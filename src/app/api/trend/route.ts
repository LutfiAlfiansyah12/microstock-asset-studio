import { NextResponse } from "next/server";
import { withGemini, buildModelChain } from "@/lib/gemini";

export type TrendData = {
  summary: string;
  updatedAt: string;
  stats: {
    risingCount: number;
    avgTrendScore: number;
    saturatedCount: number;
    opportunitiesCount: number;
  };
  trendChart: { month: string; score: number }[];
  categories: { name: string; score: number; growth: number }[];
  risingKeywords: {
    keyword: string;
    score: number;
    change: string;
    platform: string;
    reason: string;
  }[];
  saturatedKeywords: {
    keyword: string;
    score: number;
    change: string;
    competition: number;
    reason: string;
  }[];
  isFallback?: boolean;
  warning?: string;
};

function extractJson(text: string): string {
  if (!text) return "";
  const fence = text.match(/```json\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) return brace[0].trim();
  return text.trim();
}

function getFallbackTrends(platform: string, assetType: string, region: string): TrendData {
  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
  });

  const platformName =
    platform === "adobe"
      ? "Adobe Stock"
      : platform === "shutterstock"
      ? "Shutterstock"
      : platform === "vecteezy"
      ? "Vecteezy"
      : "Adobe Stock & Shutterstock";

  const typeDesc =
    assetType === "photo"
      ? "fotografi komersial"
      : assetType === "vector"
      ? "ilustrasi vektor & icon"
      : assetType === "video"
      ? "footage video 4K & b-roll"
      : "aset visual microstock";

  const regionName =
    region === "id"
      ? "Indonesia"
      : region === "us"
      ? "Amerika Serikat"
      : region === "eu"
      ? "Eropa"
      : region === "as"
      ? "Asia"
      : "global";

  return {
    summary: `Pasar ${platformName} (${regionName}) saat ini didominasi oleh persiapan konten liburan akhir tahun, tema teknologi AI terapan, dan persiapan musim semi/Ramadan untuk ${typeDesc}.`,
    updatedAt: today,
    stats: {
      risingCount: 28,
      avgTrendScore: 86,
      saturatedCount: 16,
      opportunitiesCount: 34,
    },
    trendChart: [
      { month: last6Months[0], score: 62 },
      { month: last6Months[1], score: 68 },
      { month: last6Months[2], score: 74 },
      { month: last6Months[3], score: 79 },
      { month: last6Months[4], score: 83 },
      { month: last6Months[5], score: 89 },
    ],
    categories: [
      { name: "Year-End Holidays & New Year", score: 95, growth: 34 },
      { name: "Artificial Intelligence in Workflow", score: 91, growth: 22 },
      { name: "Ramadan & Eid Early Preparation", score: 88, growth: 42 },
      { name: "Renewable Energy & Sustainability", score: 84, growth: 16 },
      { name: "Remote Work & Digital Nomad Lifestyle", score: 80, growth: 8 },
      { name: "Mental Wellness & Mindful Living", score: 76, growth: 12 },
      { name: "Local Cultural Heritage & Crafting", score: 73, growth: 19 },
      { name: "Modern Healthcare & Telemedicine", score: 70, growth: 6 },
    ],
    risingKeywords: [
      {
        keyword: "family winter holiday celebration dinner",
        score: 96,
        change: "+38%",
        platform: "Adobe Stock",
        reason: "Permintaan kampanye marketing akhir tahun dan perayaan keluarga global",
      },
      {
        keyword: "ramadan iftar meal table top view",
        score: 93,
        change: "+45%",
        platform: "Semua",
        reason: "Pembeli microstock mulai mengumpulkan materi promosi 2-3 bulan sebelum Ramadan",
      },
      {
        keyword: "engineer inspecting solar panels aerial",
        score: 90,
        change: "+28%",
        platform: "Adobe Stock",
        reason: "Kebutuhan laporan ESG tahunan dan presentasi corporate green energy",
      },
      {
        keyword: "happy new year 2027 celebration banner",
        score: 89,
        change: "+52%",
        platform: "Shutterstock",
        reason: "Kebutuhan aset promosi countdown, banner media sosial, dan event poster",
      },
      {
        keyword: "cyberpunk futuristic neon city street",
        score: 87,
        change: "+18%",
        platform: "Adobe Stock",
        reason: "Tren visual sci-fi dan gaming editorial yang terus diminati",
      },
      {
        keyword: "traditional batik artisan crafting fabric",
        score: 85,
        change: "+31%",
        platform: "Shutterstock",
        reason: "Kebutuhan konten autentik budaya lokal dan UMKM ekonomi kreatif",
      },
      {
        keyword: "young businesswoman working remote cafe",
        score: 83,
        change: "+15%",
        platform: "Semua",
        reason: "Kategori evergreen lifestyle profesional dengan demand konsisten",
      },
      {
        keyword: "clean renewable wind turbines sunset",
        score: 81,
        change: "+20%",
        platform: "Adobe Stock",
        reason: "Visual industri ramah lingkungan untuk materi editorial dan komersial",
      },
      {
        keyword: "organic skincare dropper bottle mock up",
        score: 79,
        change: "+24%",
        platform: "Vecteezy",
        reason: "Pertumbuhan brand kecantikan & kosmetik natural yang membutuhkan mockup",
      },
      {
        keyword: "diverse creative agency team brainstorming",
        score: 77,
        change: "+14%",
        platform: "Shutterstock",
        reason: "Representasi inklusivitas tempat kerja dan kolaborasi tim modern",
      },
    ],
    saturatedKeywords: [
      {
        keyword: "business handshake close up",
        score: 42,
        change: "-18%",
        competition: 96,
        reason: "Terlalu banyak supply kontributor lama, buyer lebih menyukai interaksi kerja alami",
      },
      {
        keyword: "isolated lightbulb on white background",
        score: 38,
        change: "-22%",
        competition: 98,
        reason: "Konsep ide klise dengan jutaan aset serupa, acceptance rate rendah",
      },
      {
        keyword: "piggy bank coins savings concept",
        score: 45,
        change: "-14%",
        competition: 92,
        reason: "Buyer finansial kini lebih menyukai UI mobile banking dan visual investasi digital",
      },
      {
        keyword: "generic cryptocurrency bitcoin tokens",
        score: 48,
        change: "-25%",
        competition: 94,
        reason: "Pasar jenuh dengan stok render 3D koin fisik bitcoin sederhana",
      },
      {
        keyword: "call center woman wearing headset smiling",
        score: 35,
        change: "-30%",
        competition: 95,
        reason: "Katalog oversupply, tren beralih ke visual chatbot AI dan customer support riil",
      },
    ],
  };
}

export async function POST(req: Request) {
  let platform = "all";
  let assetType = "all";
  let region = "global";

  try {
    const body = await req.json().catch(() => ({}));
    const keys: string[] = Array.isArray(body.keys) ? body.keys : [];
    const model: string = body.model || "";
    platform = body.platform || "all";
    assetType = body.assetType || "all";
    region = body.region || "global";

    const platformLabel: Record<string, string> = {
      all: "Adobe Stock, Shutterstock, dan Vecteezy",
      adobe: "Adobe Stock",
      shutterstock: "Shutterstock",
      vecteezy: "Vecteezy",
    };
    const typeLabel: Record<string, string> = {
      all: "foto, vector, dan video",
      photo: "foto",
      vector: "vector",
      video: "video",
    };
    const regionLabel: Record<string, string> = {
      global: "global (seluruh dunia)",
      id: "Indonesia",
      us: "Amerika Serikat",
      eu: "Eropa",
      as: "Asia",
    };

    const today = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
    });

    // If no keys provided, immediately return curated fallback trend data
    if (!keys || keys.length === 0) {
      const fallback = getFallbackTrends(platform, assetType, region);
      return NextResponse.json({
        ...fallback,
        isFallback: true,
        warning: "Belum ada API key Gemini. Tambahkan API key di halaman Settings untuk analisis tren live berbasis AI.",
      });
    }

    const prompt = `Kamu adalah analis tren microstock profesional. Hari ini tanggal ${today}.

Analisis tren terkini di ${platformLabel[platform] || "Adobe Stock dan Shutterstock"} khusus untuk konten ${typeLabel[assetType] || "foto, vector, dan video"}, pasar ${regionLabel[region] || "global"}.

Fokus pada:
- Topik pencarian trending bulan ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
- Keyword populer yang paling banyak dicari buyer microstock
- Event, perayaan, dan musim bulan ini dan 1-3 bulan ke depan (persiapan buyer)

ATURAN PENTING untuk field "keyword":
- Harus berupa frasa pencarian nyata seperti yang diketik buyer di search bar microstock
- Spesifik dan visual: "elderly woman doing yoga outdoors", "ramadan iftar family dinner", "solar panel installation worker"
- BUKAN konsep abstrak: JANGAN tulis "authentic storytelling", "diversity", "sustainability concept"
- Panjang 2-5 kata, konkret, bisa langsung dijadikan brief foto/vector/video
- Sesuaikan dengan musim/event aktual bulan ${today}

Kembalikan HANYA objek JSON valid (tanpa teks lain di luar JSON):

{
  "summary": "Ringkasan 2 kalimat kondisi tren microstock bulan ini berdasarkan data pencarian aktual",
  "updatedAt": "${today}",
  "stats": {
    "risingCount": <angka>,
    "avgTrendScore": <0-100>,
    "saturatedCount": <angka>,
    "opportunitiesCount": <angka>
  },
  "trendChart": [
    ${last6Months.map((m) => `{"month": "${m}", "score": <0-100>}`).join(",\n    ")}
  ],
  "categories": [
    {"name": "<kategori spesifik misal: Ramadan & Eid, Summer Travel, AI Technology, Remote Work>", "score": <0-100>, "growth": <persentase, bisa negatif>},
    ... (8 kategori)
  ],
  "risingKeywords": [
    {"keyword": "<frasa pencarian konkret 2-5 kata>", "score": <0-100>, "change": "<+X%>", "platform": "<Adobe|Shutterstock|Vecteezy|Semua>", "reason": "<sebab trending: event/musim/kebutuhan editorial spesifik>"},
    ... (10 keyword)
  ],
  "saturatedKeywords": [
    {"keyword": "<frasa pencarian konkret>", "score": <0-100>, "change": "<-X%>", "competition": <0-100>, "reason": "<kenapa jenuh: terlalu banyak kontributor, demand turun, dll>"},
    ... (5 keyword)
  ]
}`;

    let rawText: string | null = null;
    let liveError: string | null = null;

    try {
      rawText = await withGemini(
        keys,
        async (client, activeModel) => {
          // Attempt 1: Try with Google Search grounding
          try {
            const response = await client.models.generateContent({
              model: activeModel,
              contents: prompt,
              config: { tools: [{ googleSearch: {} }] },
            });
            const text =
              response.text ||
              response.candidates?.[0]?.content?.parts
                ?.map((p: any) => p.text)
                .filter(Boolean)
                .join("");
            if (text && text.trim().length > 0) return text;
          } catch (searchErr) {
            // If search grounding tool is not permitted, rate-limited, or fails, proceed directly
            console.warn(
              `[trend API] Search grounding tidak tersedia pada model ${activeModel}, fallback ke direct generation:`,
              searchErr
            );
          }

          // Attempt 2: Direct generation without tools (much higher quota & compatibility)
          const directResponse = await client.models.generateContent({
            model: activeModel,
            contents: prompt,
          });
          const text =
            directResponse.text ||
            directResponse.candidates?.[0]?.content?.parts
              ?.map((p: any) => p.text)
              .filter(Boolean)
              .join("");
          if (!text) throw new Error("Respons teks dari Gemini kosong.");
          return text;
        },
        buildModelChain(model || "gemini-3.8-flash")
      );
    } catch (err: unknown) {
      liveError = err instanceof Error ? err.message : String(err);
      console.warn("[trend API] Gemini live generation gagal:", liveError);
    }

    if (rawText && !liveError) {
      try {
        const jsonStr = extractJson(rawText);
        const parsed: TrendData = JSON.parse(jsonStr);
        if (parsed.summary && Array.isArray(parsed.risingKeywords)) {
          return NextResponse.json(parsed);
        }
      } catch {
        liveError = "Gagal memproses format JSON dari respon AI.";
      }
    }

    // High quality fallback data when API keys hit limit or server is overloaded
    const fallback = getFallbackTrends(platform, assetType, region);
    return NextResponse.json({
      ...fallback,
      isFallback: true,
      warning: liveError
        ? `Menampilkan data tren terkurasi (offline mode). Catatan API: ${liveError}`
        : "Menampilkan data tren terkurasi.",
    });
  } catch {
    const fallback = getFallbackTrends(platform, assetType, region);
    return NextResponse.json({
      ...fallback,
      isFallback: true,
      warning: "Terjadi kesalahan internal. Menampilkan data tren terkurasi.",
    });
  }
}
