import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODELS = [
  { value: "gemini-flash-latest", label: "Gemini Flash (Rekomendasi)" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Lebih pintar, lebih lambat)" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Cepat & hemat)" },
] as const;

export type GeminiModel = typeof GEMINI_MODELS[number]["value"];

function isRateLimitError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes("429") || msg.includes("quota") || msg.includes("rate limit") || msg.includes("resource_exhausted");
  }
  return false;
}

function isUnavailableError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("503") ||
      msg.includes("unavailable") ||
      msg.includes("high demand") ||
      msg.includes("overloaded") ||
      msg.includes("404") ||
      msg.includes("not_found") ||
      msg.includes("no longer available")
    );
  }
  return false;
}

// Uploaded file reports ACTIVE but Gemini's backend hasn't replicated it yet.
// ponytail: fixed retry count/delay, tune if propagation lag proves longer in practice.
function isFileNotReadyError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes("permission_denied") && msg.includes("may not exist");
  }
  return false;
}

async function callWithFileRetry<T>(client: GoogleGenAI, model: string, fn: (client: GoogleGenAI, model: string) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(client, model);
    } catch (err) {
      if (!isFileNotReadyError(err) || attempt >= 3) throw err;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
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
        return await callWithFileRetry(client, model, fn);
      } catch (err) {
        if (isRateLimitError(err)) {
          lastError = err;
          continue; // try next key
        }
        if (isUnavailableError(err)) {
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

  throw new Error(`Semua model tidak tersedia. Error: ${(lastError as Error)?.message}`);
}

// Build fallback model chain: user's choice first, then other known-good models as fallback
export function buildModelChain(primary: string): string[] {
  const fallbacks = ["gemini-flash-latest", "gemini-2.5-flash"].filter((m) => m !== primary);
  return [primary, ...fallbacks];
}
