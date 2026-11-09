import { NextResponse } from "next/server";

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
};

type KeywordItem = {
  keyword: string;
  score: number;
  change: string;
  platform: string;
  reason: string;
};

function getSeasonalTrends(platform: string, assetType: string, region: string): TrendData {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;

  const today = now.toLocaleDateString("id-ID", {
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

  // Dynamic Seasonal Categories depending on Quarter (Q1, Q2, Q3, Q4)
  let categories: { name: string; score: number; growth: number }[] = [];
  let seasonFocus = "";

  if (month >= 9) {
    // Q4: Oct, Nov, Dec
    seasonFocus = `persiapan kampanye akhir tahun (${currentYear}), promosi Tahun Baru (${nextYear}), serta pesanan awal Ramadan & Musim Semi`;
    categories = [
      { name: `Year-End Holidays & Christmas Season`, score: 96, growth: 38 },
      { name: `New Year ${nextYear} Celebration & Calendars`, score: 94, growth: 52 },
      { name: `Ramadan & Eid Early Agency Prep`, score: 89, growth: 44 },
      { name: `AI in Workflow & Human-Tech Collaboration`, score: 87, growth: 24 },
      { name: `Renewable Energy & Green Technology`, score: 84, growth: 16 },
      { name: `Winter Lifestyle & Mindful Living`, score: 80, growth: 18 },
      { name: `Local Heritage & Authentic UMKM`, score: 77, growth: 14 },
      { name: `Annual Financial Review & Corporate ESG`, score: 73, growth: 10 },
    ];
  } else if (month >= 6) {
    // Q3: Jul, Aug, Sep
    seasonFocus = `persiapan Back to School, tema musim gugur/Halloween, dan peluncuran produk Q4`;
    categories = [
      { name: `Back to School & Academic Life`, score: 95, growth: 42 },
      { name: `Autumn Harvest & Fall Foliage`, score: 91, growth: 36 },
      { name: `Halloween & Spooky Early Campaigns`, score: 88, growth: 48 },
      { name: `Artificial Intelligence & Cybersecurity`, score: 86, growth: 20 },
      { name: `Eco-Friendly Products & Zero Waste`, score: 82, growth: 14 },
      { name: `Outdoor Trekking & Camping Lifestyle`, score: 79, growth: 16 },
      { name: `Modern Healthcare & Telemedicine`, score: 75, growth: 8 },
      { name: `Fintech & Mobile Banking Solutions`, score: 71, growth: 12 },
    ];
  } else if (month >= 3) {
    // Q2: Apr, May, Jun
    seasonFocus = `liburan musim panas, wisata alam tropis, hari ayah/ibu, dan persiapan awal Q3`;
    categories = [
      { name: `Summer Travel & Tropical Vacation`, score: 95, growth: 40 },
      { name: `Father's & Mother's Day Family Moments`, score: 92, growth: 32 },
      { name: `Graduation Day & Career Milestones`, score: 88, growth: 26 },
      { name: `Outdoor Fitness & Hydration`, score: 85, growth: 18 },
      { name: `Clean Energy & Electric Vehicles`, score: 81, growth: 15 },
      { name: `Remote Team Collaboration`, score: 78, growth: 11 },
      { name: `Artisan Culinary & Specialty Coffee`, score: 74, growth: 14 },
      { name: `Mental Wellness & Work-Life Balance`, score: 70, growth: 9 },
    ];
  } else {
    // Q1: Jan, Feb, Mar
    seasonFocus = `Ramadan & Idul Fitri peak buying, resolusi hidup sehat/fitness, dan Tahun Baru Imlek`;
    categories = [
      { name: `Ramadan & Eid Mubarak Peak Demand`, score: 97, growth: 60 },
      { name: `Lunar New Year & Spring Festival`, score: 93, growth: 45 },
      { name: `Fitness, Gym & Healthy Nutrition`, score: 90, growth: 28 },
      { name: `Spring Renewal & Gardening Lifestyle`, score: 86, growth: 22 },
      { name: `Tax Season & Wealth Management`, score: 83, growth: 19 },
      { name: `Earth Day & Sustainable Living`, score: 80, growth: 15 },
      { name: `Next-Gen AI Tools & Automation`, score: 76, growth: 20 },
      { name: `Modern Asian Family Lifestyle`, score: 72, growth: 12 },
    ];
  }

  // Keywords tailored by Asset Type
  let risingKeywords: KeywordItem[] = [];

  if (assetType === "photo") {
    risingKeywords = [
      {
        keyword: "family winter holiday celebration dinner",
        score: 96,
        change: "+38%",
        platform: "Adobe Stock",
        reason: "Tingginya permintaan foto editorial & komersial momen kehangatan keluarga",
      },
      {
        keyword: "engineer inspecting solar panels aerial view",
        score: 93,
        change: "+28%",
        platform: "Adobe Stock",
        reason: "Kebutuhan visual green energy untuk annual report dan presentasi korporat",
      },
      {
        keyword: "young businesswoman working remote cafe",
        score: 90,
        change: "+22%",
        platform: "Shutterstock",
        reason: "Evergreen lifestyle profesional muda dengan pencahayaan alami soft diffused",
      },
      {
        keyword: "ramadan iftar meal table top view authentic",
        score: 89,
        change: "+45%",
        platform: "Semua",
        reason: "Persiapan stok foto sajian berbuka puasa untuk agensi 2-3 bulan sebelum Ramadan",
      },
      {
        keyword: "happy diverse coworkers celebrating project success",
        score: 87,
        change: "+19%",
        platform: "Shutterstock",
        reason: "Kebutuhan foto representasi kolaborasi inklusif di lingkungan kerja modern",
      },
      {
        keyword: "traditional batik artisan crafting fabric close up",
        score: 85,
        change: "+32%",
        platform: "Shutterstock",
        reason: "Meningkatnya minat foto kerajinan tangan lokal autentik dan ekonomi kreatif",
      },
      {
        keyword: "senior woman doing yoga in nature park",
        score: 83,
        change: "+17%",
        platform: "Adobe Stock",
        reason: "Tren healthy aging dan kebugaran lansia yang aktif dan bugar",
      },
      {
        keyword: "organic skincare dropper bottle natural sunlight",
        score: 81,
        change: "+25%",
        platform: "Semua",
        reason: "Kebutuhan estetika fotografi produk kosmetik & herbal dengan bayangan lembut",
      },
      {
        keyword: "father teaching young son woodworking workshop",
        score: 79,
        change: "+16%",
        platform: "Adobe Stock",
        reason: "Momen emosional parenting dan transfer keterampilan manual yang hangat",
      },
      {
        keyword: "electric car charging at modern station sunset",
        score: 77,
        change: "+21%",
        platform: "Shutterstock",
        reason: "Pertumbuhan ekosistem EV komersial dengan latar arsitektur futuristik",
      },
    ];
  } else if (assetType === "vector") {
    risingKeywords = [
      {
        keyword: "happy new year celebration banner set flat vector",
        score: 96,
        change: "+54%",
        platform: "Vecteezy",
        reason: "Kebutuhan template countdown poster, banner sosial media, dan ucapan digital",
      },
      {
        keyword: "ramadan kareem gold crescent calligraphy illustration",
        score: 94,
        change: "+48%",
        platform: "Vecteezy",
        reason: "Desain ornamen islami elegan untuk kartu ucapan, kemasan hampers, & flyer",
      },
      {
        keyword: "clean renewable energy infographic icon collection",
        score: 91,
        change: "+29%",
        platform: "Adobe Stock",
        reason: "Set icon flat & outline ramah lingkungan untuk laporan sustainability",
      },
      {
        keyword: "isometric digital marketing workspace character vector",
        score: 88,
        change: "+22%",
        platform: "Shutterstock",
        reason: "Ilustrasi isometrik untuk landing page SaaS, presentasi pitch desk, dan website",
      },
      {
        keyword: "cute seasonal holiday sticker pack doodle style",
        score: 86,
        change: "+35%",
        platform: "Vecteezy",
        reason: "Elemen grafis stiker digital untuk planner, journaling, dan konten medsos",
      },
      {
        keyword: "vintage organic food badge packaging label set",
        score: 84,
        change: "+20%",
        platform: "Shutterstock",
        reason: "Label retro bernuansa artisan untuk brand makanan sehat & coffee shop",
      },
      {
        keyword: "modern abstract geometric gradient banner background",
        score: 82,
        change: "+15%",
        platform: "Vecteezy",
        reason: "Background dinamis serbaguna untuk cover presentasi, pamflet, dan banner web",
      },
      {
        keyword: "flat design mobile banking financial growth vector",
        score: 80,
        change: "+18%",
        platform: "Adobe Stock",
        reason: "Visual fintech, grafik investasi naik, dan dompet digital untuk industri perbankan",
      },
      {
        keyword: "traditional batik seamless pattern vector illustration",
        score: 78,
        change: "+30%",
        platform: "Semua",
        reason: "Pola tekstil nusantara format vector yang bisa di-scale tanpa pecah",
      },
      {
        keyword: "diverse avatar profile character collection set",
        score: 76,
        change: "+14%",
        platform: "Shutterstock",
        reason: "Kumpulan karakter ilustrasi untuk UI persona, website profil, dan presentasi",
      },
    ];
  } else if (assetType === "video") {
    risingKeywords = [
      {
        keyword: "cinematic drone flight over wind turbine farm sunset 4k",
        score: 96,
        change: "+34%",
        platform: "Adobe Stock",
        reason: "Aerial footage landscape energi bersih beresolusi 4K untuk video korporat",
      },
      {
        keyword: "steam rising from warm coffee cup morning window b-roll",
        score: 93,
        change: "+24%",
        platform: "Shutterstock",
        reason: "B-roll atmosferik slow motion untuk iklan kafe, lifestyle, dan intro video",
      },
      {
        keyword: "vertical 9:16 businesswoman smiling using smartphone city",
        score: 91,
        change: "+48%",
        platform: "Semua",
        reason: "Tingginya permintaan footage vertikal rasio 9:16 untuk format Reels, TikTok, & Shorts",
      },
      {
        keyword: "timelapse modern city highway traffic neon lights night",
        score: 88,
        change: "+20%",
        platform: "Adobe Stock",
        reason: "Footage dinamis perpindahan waktu kota metropolitan untuk transisi video",
      },
      {
        keyword: "happy family opening gifts holiday celebration 4k",
        score: 86,
        change: "+40%",
        platform: "Shutterstock",
        reason: "Klip video hangat bertema perayaan liburan akhir tahun untuk kampanye iklan",
      },
      {
        keyword: "young creative team collaborating around whiteboard slow pan",
        score: 84,
        change: "+17%",
        platform: "Adobe Stock",
        reason: "B-roll rapat kerja santai berorientasi solusi di kantor modern",
      },
      {
        keyword: "chef hands plating gourmet food restaurant kitchen b-roll",
        score: 82,
        change: "+22%",
        platform: "Shutterstock",
        reason: "Visual gastronomi close-up dengan depth of field tipis dan pencahayaan studio",
      },
      {
        keyword: "electric car driving on scenic coastal road sunset",
        score: 80,
        change: "+27%",
        platform: "Adobe Stock",
        reason: "Footage otomotif ramah lingkungan dengan pemandangan alam spektakuler",
      },
      {
        keyword: "ramadan family eating together iftar table slow motion",
        score: 78,
        change: "+42%",
        platform: "Semua",
        reason: "Kebutuhan footage iklan komersial Ramadhan untuk TVC & digital campaign",
      },
      {
        keyword: "hands typing on laptop keyboard with code screen reflection",
        score: 75,
        change: "+15%",
        platform: "Shutterstock",
        reason: "Visual programming, cybersecurity, dan AI engineering berbobot tinggi",
      },
    ];
  } else {
    // Mixed / All Asset Types
    risingKeywords = [
      {
        keyword: "family winter holiday celebration dinner",
        score: 96,
        change: "+38%",
        platform: "Adobe Stock",
        reason: "Permintaan kampanye marketing akhir tahun dan perayaan keluarga global",
      },
      {
        keyword: "happy new year celebration banner set",
        score: 94,
        change: "+52%",
        platform: "Shutterstock",
        reason: "Kebutuhan aset countdown event, kartu ucapan, dan poster media sosial",
      },
      {
        keyword: "ramadan iftar meal table top view authentic",
        score: 91,
        change: "+45%",
        platform: "Semua",
        reason: "Pembeli microstock mulai memborong materi promosi 2-3 bulan sebelum Ramadan",
      },
      {
        keyword: "engineer inspecting solar panels aerial view",
        score: 89,
        change: "+28%",
        platform: "Adobe Stock",
        reason: "Kebutuhan visual green energy untuk laporan ESG tahunan dan korporat",
      },
      {
        keyword: "cyberpunk futuristic neon city street night",
        score: 87,
        change: "+18%",
        platform: "Adobe Stock",
        reason: "Tren visual sci-fi, gaming editorial, dan estetika neon yang konsisten diminati",
      },
      {
        keyword: "traditional batik artisan crafting fabric",
        score: 85,
        change: "+31%",
        platform: "Shutterstock",
        reason: "Kebutuhan konten autentik budaya nusantara, kerajinan lokal, dan UMKM",
      },
      {
        keyword: "young businesswoman working remote cafe",
        score: 83,
        change: "+15%",
        platform: "Semua",
        reason: "Kategori evergreen lifestyle profesional dengan demand pembeli stabil",
      },
      {
        keyword: "clean renewable wind turbines sunset landscape",
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
        reason: "Pertumbuhan brand kecantikan & kosmetik natural yang butuh mockup kemasan",
      },
      {
        keyword: "diverse creative agency team brainstorming",
        score: 77,
        change: "+14%",
        platform: "Shutterstock",
        reason: "Representasi inklusivitas tempat kerja dan kolaborasi tim modern",
      },
    ];
  }

  // Adjust for region Indonesia if selected
  if (region === "id") {
    risingKeywords[0] = {
      keyword: "keluarga buka puasa bersama ramadan nusantara",
      score: 98,
      change: "+60%",
      platform: "Semua",
      reason: "Permintaan puncak kampanye Ramadan & Idul Fitri pasar Indonesia",
    };
    risingKeywords[1] = {
      keyword: "pengrajin batik tulis tradisional indonesia studio",
      score: 93,
      change: "+38%",
      platform: "Shutterstock",
      reason: "Aset kearifan lokal budaya nusantara untuk promosi UMKM dan pariwisata",
    };
    risingKeywords[2] = {
      keyword: "umkm kuliner jajanan pasar tradisional estetik",
      score: 90,
      change: "+34%",
      platform: "Adobe Stock",
      reason: "Visual street food nusantara & bisnis F&B lokal beresolusi tajam",
    };
  }

  const saturatedKeywords = [
    {
      keyword: "business handshake close up",
      score: 42,
      change: "-18%",
      competition: 97,
      reason: "Terlalu banyak supply kontributor lama. Buyer lebih mencari interaksi kerja nyata dan kolaboratif.",
    },
    {
      keyword: "isolated lightbulb on white background",
      score: 38,
      change: "-22%",
      competition: 98,
      reason: "Konsep ide klise dengan jutaan aset serupa di database. Acceptance rate dan sales sangat rendah.",
    },
    {
      keyword: "piggy bank coins savings concept",
      score: 45,
      change: "-14%",
      competition: 92,
      reason: "Buyer industri finansial kini lebih menyukai UI mobile banking dan visual investasi digital modern.",
    },
    {
      keyword: "generic 3d cryptocurrency bitcoin tokens",
      score: 48,
      change: "-25%",
      competition: 95,
      reason: "Katalog oversupplied dengan stok render koin emas fisik sederhana yang minim diferensiasi.",
    },
    {
      keyword: "call center woman wearing headset smiling",
      score: 35,
      change: "-30%",
      competition: 94,
      reason: "Gaya foto stok kaku era 2010-an yang ditinggalkan, buyer beralih ke visual customer support riil.",
    },
  ];

  return {
    summary: `Analisis pasar ${platformName} wilayah ${regionName} untuk ${typeDesc} saat ini berfokus pada ${seasonFocus}. Data disesuaikan dengan siklus pembelian 2–3 bulan sebelum event puncak.`,
    updatedAt: today,
    stats: {
      risingCount: 28,
      avgTrendScore: 88,
      saturatedCount: 16,
      opportunitiesCount: 34,
    },
    trendChart: [
      { month: last6Months[0], score: 64 },
      { month: last6Months[1], score: 69 },
      { month: last6Months[2], score: 76 },
      { month: last6Months[3], score: 81 },
      { month: last6Months[4], score: 85 },
      { month: last6Months[5], score: 91 },
    ],
    categories,
    risingKeywords,
    saturatedKeywords,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const platform = body.platform || "all";
    const assetType = body.assetType || "all";
    const region = body.region || "global";

    const trends = getSeasonalTrends(platform, assetType, region);
    return NextResponse.json(trends);
  } catch {
    const fallback = getSeasonalTrends("all", "all", "global");
    return NextResponse.json(fallback);
  }
}
