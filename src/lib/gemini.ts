import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODELS = [
  { value: "gemini-3.8-flash", label: "Gemini 3.8 Flash (Rekomendasi - Cepat & Cerdas)" },
  { value: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite (Super Cepat & Hemat Quota)" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Stabil & Teruji)" },
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

export function isRateLimitError(err: unknown): boolean {
  const msg = getErrorMessage(err).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("resource_exhausted") ||
    msg.includes("too many requests")
  );
}

export function isAuthError(err: unknown): boolean {
  const msg = getErrorMessage(err).toLowerCase();
  return (
    msg.includes("api_key_invalid") ||
    msg.includes("api key not valid") ||
    msg.includes("invalid api key") ||
    msg.includes("401") ||
    msg.includes("403") ||
    msg.includes("permission_denied") ||
    msg.includes("unauthenticated")
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
    msg.includes("502") ||
    msg.includes("504") ||
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
    msg.includes("not found for api version") ||
    msg.includes("model not found")
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
  const maxAttempts = 2;
  for (let attempt = 0; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(client, model);
    } catch (err) {
      // 1. Files API replication delay
      if (isFileNotReadyError(err) && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }

      // 2. Transient server error (503 high demand spike / overloaded)
      // Retry once quickly (1.5s); if still failing, let withGemini rotate to the next key or model immediately
      if (isTransientServerError(err) && attempt < 1) {
        await new Promise((r) => setTimeout(r, 1500));
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
  const validKeys = (keys || [])
    .map((k) => (typeof k === "string" ? k.trim() : ""))
    .filter((k) => k.length > 0);

  if (validKeys.length === 0) {
    throw new Error("Tidak ada API key yang dikonfigurasi. Tambahkan di halaman Settings.");
  }

  let lastError: unknown;

  for (const model of models) {
    let modelUnavailable = false;

    for (const key of validKeys) {
      try {
        const client = new GoogleGenAI({ apiKey: key });
        return await callWithRetry(client, model, fn);
      } catch (err) {
        lastError = err;

        // If the model itself is not recognized or not available, skip to next model
        if (isModelUnavailableError(err)) {
          modelUnavailable = true;
          break;
        }

        // For rate limit, auth error, 503, or any other error on this specific key:
        // Try the NEXT key in the pool!
        continue;
      }
    }

    if (modelUnavailable) {
      continue; // Try next model in chain
    }
  }

  const errorMsg = (lastError as Error)?.message || getErrorMessage(lastError);
  throw new Error(`Semua API key dan model gagal diproses: ${errorMsg}`);
}

// Build fallback model chain: user's choice first, then other known-good models as fallback
export function buildModelChain(primary: string): string[] {
  const candidateChain = [
    primary,
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
  ];
  return Array.from(new Set(candidateChain.filter(Boolean)));
}
