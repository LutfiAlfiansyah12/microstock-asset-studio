import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { key, model } = await req.json();

    if (!key || typeof key !== "string") {
      return NextResponse.json({ ok: false, error: "API key tidak valid." }, { status: 400 });
    }

    const client = new GoogleGenAI({ apiKey: key });
    await client.models.generateContent({
      model: model || "gemini-2.5-flash",
      contents: "Reply with just the word: OK",
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isAuthError = message.includes("API_KEY_INVALID") || message.includes("401") || message.includes("403");
    return NextResponse.json(
      { ok: false, error: isAuthError ? "API key tidak valid atau tidak punya akses." : message },
      { status: 400 }
    );
  }
}
