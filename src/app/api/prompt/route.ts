import { NextResponse } from "next/server";
import { withGemini, buildModelChain } from "@/lib/gemini";

const MODEL_TIPS: Record<string, string> = {
  midjourney: "Format Midjourney: deskripsi detail, pisahkan elemen dengan koma, tambahkan parameter seperti --ar 16:9 --v 6.1 --style raw di akhir.",
  firefly: "Format Adobe Firefly: kalimat deskriptif natural, spesifik tentang subjek, pencahayaan, mood, dan komposisi.",
  sdxl: "Format Stable Diffusion XL: keyword padat dipisah koma, tambahkan quality tags seperti (masterpiece:1.2), (best quality:1.1).",
  dalle3: "Format DALL-E 3: kalimat natural deskriptif, spesifik dan detail, tidak perlu parameter teknis.",
  ideogram: "Format Ideogram: deskripsi natural, bisa include teks jika ada elemen tipografi.",
  nanobanana: "Format Nano Banana: deskripsi singkat dan padat dalam bahasa Inggris, fokus pada subjek utama, style, dan mood. Pisahkan elemen dengan koma.",
  veo: "Format Google Veo: deskripsi sinematik, sertakan gerakan kamera, pacing, color grade, shot type.",
  runway: "Format Runway Gen-3: deskripsikan pergerakan, suasana, dan transisi visual secara sinematik.",
  pika: "Format Pika Labs: deskripsi pendek dan padat, fokus pada subjek dan motion.",
  sora: "Format Sora: kalimat sinematik natural, deskripsikan adegan, pencahayaan, dan gerakan.",
  kling: "Format Kling AI: deskripsi natural, sertakan elemen temporal dan gerakan.",
};

const ASPECT_RATIOS: Record<string, string[]> = {
  image: ["16:9", "4:3", "1:1", "3:2", "9:16"],
  photo: ["3:2", "4:3", "16:9", "1:1", "2:3"],
  vector: ["1:1", "16:9", "4:3", "3:4"],
  video: ["16:9", "9:16", "1:1"],
};

function extractJson(text: string): string {
  const fence = text.match(/```json\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  return text.match(/\[[\s\S]*\]/)?.[0] ?? text.trim();
}

export async function POST(req: Request) {
  try {
    const { keyword, themes, style, brief, assetType, targetModel, count, model, keys, seamless, abstrak } = await req.json();

    if (!keys?.length) {
      return NextResponse.json({ error: "Belum ada API key. Tambahkan di halaman Settings." }, { status: 400 });
    }

    const n = Math.min(Math.max(parseInt(count) || 3, 1), 20);
    const ratios = ASPECT_RATIOS[assetType] || ASPECT_RATIOS.image;
    const modelTip = MODEL_TIPS[targetModel] || "Format deskriptif detail.";

    const isVideoMode = seamless || abstrak;

    const seamlessRules = seamless ? `
SEAMLESS LOOP — WAJIB:
- Video harus looping sempurna: frame pertama identik dengan frame terakhir
- Gerakan harus kontinu dan tidak putus: aliran air, gelombang, partikel berputar, gradien bergerak, texture flowing
- TIDAK boleh ada hard cut, jump cut, atau transisi yang terlihat
- Durasi ideal: 4-10 detik yang bisa di-loop tanpa terasa
- Teknik: seamless loop, perfect loop, cinemagraph style, infinite loop` : "";

    const abstrakRules = abstrak ? `
ABSTRACT VISUAL — WAJIB:
- TIDAK boleh ada objek/subjek yang dapat dikenali (no people, no objects, no text, no landscapes)
- Murni elemen visual: warna, cahaya, bentuk geometris, fluid simulation, partikel, bokeh, tekstur organik, motion graphics, plasma
- Contoh: color gradient flow, geometric morphing, light leak explosion, particle wave, ink in water, glitch art, fractal zoom` : "";

    const prompt = isVideoMode
      ? `Kamu adalah ahli prompt engineering untuk video microstock. Buat TEPAT ${n} variasi prompt video untuk model AI ${targetModel || "video AI"}.
${seamlessRules}${abstrakRules}

Panduan format: ${modelTip}
${themes ? `\nStyle/tema tambahan: ${themes}` : ""}${style ? `\nStyle preset: ${style}` : ""}${brief ? `\nBrief: ${brief}` : ""}

ATURAN DIVERSIFIKASI:
- Setiap prompt HARUS memiliki palet warna, ritme gerakan, dan elemen visual yang BERBEDA
- Tujuan: ${n} aset berbeda yang bisa dijual independen
- Negative prompt: no people, no text, no recognizable objects, no camera shake${abstrak ? "" : ", no abrupt cuts"}
- Aspect ratio dari: ${ratios.join(", ")}

Kembalikan HANYA array JSON valid dengan TEPAT ${n} item:
[{ "text": "<prompt>", "negative": "<negative>", "aspectRatio": "<ratio>" }]`

      : `Kamu adalah ahli prompt engineering untuk aset microstock. Buat TEPAT ${n} variasi prompt untuk model AI ${targetModel || "image AI"}.

Input:
- Tipe aset: ${assetType}
- Kategori: ${keyword}
- Tema/style tambahan: ${themes || "-"}
- Style preset: ${style || "-"}
- Brief: ${brief || "-"}

Panduan format: ${modelTip}

ATURAN WAJIB — DIVERSIFIKASI:
- Setiap prompt HARUS memiliki SUBJEK yang BERBEDA dalam kategori "${keyword}". Jangan ulangi objek/subjek yang sama.
- Variasikan sudut kamera: top-down, eye-level, low angle, close-up macro, wide shot, aerial — tiap prompt berbeda.
- Variasikan environment/konteks: indoor, outdoor, studio, alam, urban, dll.
- Variasikan lighting: golden hour, studio softbox, natural window light, dramatic side light, dll.
- Tujuan: ${n} prompt = ${n} aset berbeda yang bisa dijual secara independen, bukan variasi dari objek yang sama.
- Fokus nilai komersial microstock: clean, versatile, commercially usable.
- Negative prompt relevan per subjek masing-masing.
- Aspect ratio pilih dari: ${ratios.join(", ")}

Kembalikan HANYA array JSON valid dengan TEPAT ${n} item, tanpa teks lain:
[{ "text": "<prompt lengkap siap pakai>", "negative": "<negative prompt>", "aspectRatio": "<salah satu dari: ${ratios.join(", ")}>" }]`;

    const rawText = await withGemini(keys, async (client, activeModel) => {
      const response = await client.models.generateContent({
        model: activeModel,
        contents: prompt,
      });
      return response.text;
    }, buildModelChain(model || "gemini-2.5-flash"));

    const parsed = JSON.parse(extractJson(rawText ?? ""));
    if (!Array.isArray(parsed)) throw new Error("Format respons tidak valid");

    const results = parsed.slice(0, n).map((p: { text: string; negative: string; aspectRatio: string }, i: number) => ({
      id: String(i + 1),
      text: p.text,
      negative: p.negative,
      aspectRatio: p.aspectRatio,
    }));

    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
