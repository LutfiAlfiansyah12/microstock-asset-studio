import { NextResponse } from "next/server";
import { withGemini, buildModelChain } from "@/lib/gemini";

const platformLimits: Record<string, { name: string; maxTitle: number; maxDesc: number; maxKeywords: number }> = {
  adobe:       { name: "Adobe Stock",   maxTitle: 200, maxDesc: 200, maxKeywords: 49 },
  shutterstock:{ name: "Shutterstock",  maxTitle: 100, maxDesc: 400, maxKeywords: 50 },
  vecteezy:    { name: "Vecteezy",      maxTitle: 120, maxDesc: 300, maxKeywords: 20 },
};

function buildPrompt(platformKey: string, assetType: string, keyword: string) {
  const p = platformLimits[platformKey] ?? platformLimits.adobe;
  return `Kamu adalah SEO specialist microstock profesional. Analisis gambar/aset ini dan buat metadata SEO yang dioptimasi untuk ${p.name}.

Buat metadata dalam bahasa Inggris. Return HANYA objek JSON valid tanpa teks lain:

{
  "title": "<judul SEO maks ${p.maxTitle} karakter, deskriptif dan keyword-rich>",
  "description": "<deskripsi maks ${p.maxDesc} karakter, jelas dan informatif>",
  "keywords": ["<keyword1>", "<keyword2>", ...]
}

Tipe aset: ${assetType}
${keyword ? `Keyword tambahan: ${keyword}` : ""}
Maksimum ${p.maxKeywords} keyword, urutkan dari paling relevan ke paling umum.
Jangan melebihi batas karakter dan jumlah keyword.`;
}

function extractJson(text: string): string {
  const fence = text.match(/```json\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  return text.match(/\{[\s\S]*\}/)?.[0] ?? text.trim();
}

export async function POST(req: Request) {
  try {
    const { imageBase64, fileUri, mimeType, platform, assetType, keyword, model, keys } = await req.json();

    if (!keys?.length) {
      return NextResponse.json({ error: "Belum ada API key. Tambahkan di halaman Settings." }, { status: 400 });
    }
    if (!imageBase64 && !fileUri) {
      return NextResponse.json({ error: "Tidak ada aset yang diberikan." }, { status: 400 });
    }

    const rawText = await withGemini(keys, async (client, activeModel) => {
      const mediaPart = fileUri
        ? { fileData: { fileUri, mimeType: mimeType || "video/mp4" } }
        : { inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } };
      const response = await client.models.generateContent({
        model: activeModel,
        contents: [
          mediaPart,
          { text: buildPrompt(platform || "adobe", assetType || "photo", keyword || "") },
        ],
      });
      return response.text;
    }, buildModelChain(model || "gemini-2.5-flash"));

    return NextResponse.json(JSON.parse(extractJson(rawText ?? "")));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
