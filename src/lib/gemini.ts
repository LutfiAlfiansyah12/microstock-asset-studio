import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODELS = [
  { value: "gemini-3.8-flash", label: "Gemini 3.8 Flash (Rekomendasi - Cepat & Cerdas)" },
  { value: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite (Super Cepat & Hemat Quota)" },
  { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (Lebih Pintar, Lebih Lambat)" },
] as const;

export type GeminiModel = typeof GEMINI_MODELS[number]["value"];

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}

function isRateLimitError(err: unknown): boolean {
  const msg = getErrorMessage(err).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("resource_exhausted")
  );
}

function isTransientServerError(err: unknown): boolean {
  const msg = getErrorMessage(err).toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("high demand") ||
    msg.includes("spikes in demand") ||
    msg.includes("overloaded") ||
    msg.includes("unavailable") ||
    msg.includes("service unavailable") ||
    msg.includes("500") ||
    msg.includes("internal server error")
  );
}

function isModelUnavailableError(err: unknown): boolean {
  const msg = getErrorMessage(err).toLowerCase();
  return (
    msg.includes("404") ||
    msg.includes("not_found") ||
    msg.includes("no longer available") ||
    msg.includes("is not supported") ||
    isTransientServerError(err)
  );
}

// Uploaded file reports ACTIVE but Gemini's backend hasn't replicated it yet.
function isFileNotReadyError(err: unknown): boolean {
  const msg = getErrorMessage(err).toLowerCase();
  return msg.includes("permission_denied") && msg.includes("may not exist");
}

async function callWithRetry<T>(
  client: GoogleGenAI,
  model: string,
  fn: (client: GoogleGenAI, model: string) => Promise<T>
): Promise<T> {
  const maxAttempts = 3;
  for (let attempt = 0; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(client, model);
    } catch (err) {
      // 1. Files API replication delay
      if (isFileNotReadyError(err) && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }

      // 2. Transient server error (503 high demand spike / overloaded)
      // Google: "Spikes in demand are usually temporary. Please try again later."
      if (isTransientServerError(err) && attempt < maxAttempts) {
        // Exponential backoff: 3s, 6s, 9s
        await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }

      throw err;
    }
  }
  throw new Error("Maksimum percobaan retry terlampaui.");
}

// fn receives (client, model) so model rotation is transparent to callers
export async function withGemini<T>(
  keys: string[],
  fn: (client: GoogleGenAI, model: string) => Promise<T>,
  models: string[]
): Promise<T> {
  if (keys.length === 0) {
    throw new Error("Tidak ada API key yang dikonfigurasi. Tambahkan di halaman Settings.");
  }

  let lastError: unknown;

  for (const model of models) {
    let modelUnavailable = false;

    for (const key of keys) {
      try {
        const client = new GoogleGenAI({ apiKey: key });
        return await callWithRetry(client, model, fn);
      } catch (err) {
        if (isRateLimitError(err)) {
          lastError = err;
          continue; // try next key
        }
        if (isModelUnavailableError(err)) {
          lastError = err;
          modelUnavailable = true;
          break; // skip remaining keys, try next model
        }
        throw err;
      }
    }

    if (!modelUnavailable) {
      lastError = new Error(`Semua API key kena rate limit untuk model ${model}.`);
    }
  }

  const errorMsg = (lastError as Error)?.message || getErrorMessage(lastError);
  throw new Error(`Semua model tidak tersedia: ${errorMsg}`);
}

// Build fallback model chain: user's choice first, then other known-good models as fallback
export function buildModelChain(primary: string): string[] {
  const fallbacks = ["gemini-3.8-flash", "gemini-3.5-flash-lite"].filter((m) => m !== primary);
  return [primary, ...fallbacks];
}
