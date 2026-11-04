import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { buildModelChain } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { key, model } = await req.json();

    if (!key || typeof key !== "string" || !key.trim()) {
      return NextResponse.json({ ok: false, error: "API key tidak valid." }, { status: 400 });
    }

    const trimmedKey = key.trim();
    const client = new GoogleGenAI({ apiKey: trimmedKey });
    const modelsToTry = buildModelChain(model || "gemini-3.8-flash");

    let lastErrorMsg = "";
    let isLimit = false;

    for (const testModel of modelsToTry) {
      try {
        await client.models.generateContent({
          model: testModel,
          contents: "Reply with just the word: OK",
        });
        return NextResponse.json({ ok: true, activeModel: testModel });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        lastErrorMsg = msg;
        const lower = msg.toLowerCase();
        if (
          lower.includes("429") ||
          lower.includes("quota") ||
          lower.includes("resource_exhausted") ||
          lower.includes("rate limit")
        ) {
          isLimit = true;
          break; // Key hit quota, stop trying other models
        }
        if (
          lower.includes("api_key_invalid") ||
          lower.includes("401") ||
          lower.includes("403") ||
          lower.includes("api key not valid")
        ) {
          return NextResponse.json(
            { ok: false, error: "API key tidak valid atau tidak memiliki akses." },
            { status: 400 }
          );
        }
        // If 404 or unsupported model, try next model in chain
        continue;
      }
    }

    if (isLimit) {
      return NextResponse.json({ ok: false, limit: true, error: "Quota habis / rate limit." }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, error: lastErrorMsg || "Model tidak merespons." },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
