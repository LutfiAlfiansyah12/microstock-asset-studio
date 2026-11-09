"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  Key,
  ExternalLink,
  AlertTriangle,
  Cpu,
  Activity,
  Sparkles,
  Video,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { loadSettings, saveSettings, type AppSettings, type KeyScope } from "@/lib/settings";
import { GEMINI_MODELS } from "@/lib/gemini";

function maskKey(key: string): string {
  if (key.length <= 12) return "••••••••••••";
  return `${key.slice(0, 8)}••••••••${key.slice(-4)}`;
}

type KeyStatus = "idle" | "testing" | "ok" | "limit" | "error";

const SCOPE_CONFIG: Record<
  KeyScope,
  { label: string; shortLabel: string; desc: string; icon: React.ComponentType<{ className?: string }> }
> = {
  generator: {
    label: "API Key Generator (Prompt & SEO)",
    shortLabel: "Generator",
    desc: "Digunakan pertama kali saat membuat Prompt AI dan mengekstrak metadata SEO.",
    icon: Zap,
  },
  analysis: {
    label: "API Key Analisis (Foto & Video)",
    shortLabel: "Analisis",
    desc: "Digunakan pertama kali saat membedah gaya visual foto dan sinematik video (Copy Style).",
    icon: Video,
  },
  backup: {
    label: "API Key Backup (Cadangan)",
    shortLabel: "Backup",
    desc: "Cadangan otomatis jika kuota Generator ATAU Analisis habis. Tidak saling mengganggu antar modul.",
    icon: ShieldCheck,
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    moduleKeys: { generator: [], analysis: [], backup: [] },
    geminiModel: "gemini-3.8-flash",
  });
  const [activeScope, setActiveScope] = useState<KeyScope>("generator");
  const [newKey, setNewKey] = useState("");
  const [showNewKey, setShowNewKey] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [keyStatuses, setKeyStatuses] = useState<Record<string, KeyStatus>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function updateSettings(next: Partial<AppSettings>) {
    setSettings((prev) => {
      const updated = { ...prev, ...next };
      saveSettings(updated);
      return updated;
    });
  }

  function getKeysForScope(scope: KeyScope): string[] {
    return settings.moduleKeys?.[scope] ?? [];
  }

  function updateKeysForScope(scope: KeyScope, nextKeys: string[]) {
    updateSettings({
      moduleKeys: {
        ...(settings.moduleKeys ?? { generator: [], analysis: [], backup: [] }),
        [scope]: nextKeys,
      },
    });
  }

  const currentKeys = getKeysForScope(activeScope);

  function handleAddKey() {
    const trimmed = newKey.trim();
    if (!trimmed) return;
    if (currentKeys.includes(trimmed)) {
      toast.error("API key ini sudah ada di bagian ini.");
      return;
    }
    updateKeysForScope(activeScope, [...currentKeys, trimmed]);
    setNewKey("");
    toast.success(`API key ditambahkan ke ${SCOPE_CONFIG[activeScope].shortLabel}.`);
  }

  function handleDeleteKey(index: number) {
    const next = currentKeys.filter((_, i) => i !== index);
    updateKeysForScope(activeScope, next);
    setKeyStatuses((prev) => {
      const s = { ...prev };
      delete s[`${activeScope}-${index}`];
      return s;
    });
    toast.success("API key dihapus.");
  }

  function toggleVisible(scope: KeyScope, index: number) {
    const id = `${scope}-${index}`;
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleTestKey(scope: KeyScope, index: number) {
    const statusId = `${scope}-${index}`;
    const keys = getKeysForScope(scope);
    const key = keys[index];
    if (!key) return;

    setKeyStatuses((prev) => ({ ...prev, [statusId]: "testing" }));
    try {
      const res = await fetch("/api/gemini/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, model: settings.geminiModel }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setKeyStatuses((prev) => ({ ...prev, [statusId]: "ok" }));
        toast.success("Key valid dan berfungsi!");
      } else if (data.limit) {
        setKeyStatuses((prev) => ({ ...prev, [statusId]: "limit" }));
        toast.warning("Quota habis / rate limit.");
      } else {
        setKeyStatuses((prev) => ({ ...prev, [statusId]: "error" }));
        toast.error(data.error || "Key tidak valid.");
      }
    } catch {
      setKeyStatuses((prev) => ({ ...prev, [statusId]: "error" }));
      toast.error("Gagal menghubungi server.");
    }
  }

  async function handleTestAll() {
    if (!currentKeys.length) return;
    await Promise.all(currentKeys.map((_, i) => handleTestKey(activeScope, i)));
    toast.success(`Cek semua key di ${SCOPE_CONFIG[activeScope].shortLabel} selesai.`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAddKey();
  }

  const statusBadge = (status: KeyStatus) => {
    if (status === "testing") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />Cek...
        </span>
      );
    }
    if (status === "ok") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
          <CheckCircle2 className="h-3 w-3" />Aktif
        </span>
      );
    }
    if (status === "limit") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-500">
          <AlertTriangle className="h-3 w-3" />Limit
        </span>
      );
    }
    if (status === "error") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
          <XCircle className="h-3 w-3" />Error
        </span>
      );
    }
    return <span className="text-xs text-muted-foreground">—</span>;
  };

  const isTestingAny = currentKeys.some((_, i) => keyStatuses[`${activeScope}-${i}`] === "testing");
  const healthyCount = currentKeys.filter((_, i) => keyStatuses[`${activeScope}-${i}`] === "ok").length;

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Settings"
        description="Konfigurasi API key terisolasi per modul dan preferensi model AI (tersimpan aman di localStorage browser)"
        actions={
          <div className="flex items-center gap-2">
            <Badge className="rounded-full bg-[#E6F8EF] text-[#16A34A] border-0 px-3 py-1 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Local Storage Safe
            </Badge>
          </div>
        }
      />

      {/* 2x2 Asymmetric Bento Grid (12 Columns, Equal Row Heights) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* TOP LEFT (7 Cols) — Google Gemini API Keys */}
        <Card className="lg:col-span-7 h-full flex flex-col justify-between">
          <div>
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="h-4 w-4 text-[#6342E8]" />
                    Google Gemini API Keys
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Pilih tab modul di bawah untuk mengatur API key masing-masing fitur.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {currentKeys.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={handleTestAll}
                      disabled={isTestingAny}
                    >
                      {isTestingAny ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Activity className="h-3.5 w-3.5 text-[#6342E8]" />
                      )}
                      Cek Semua
                    </Button>
                  )}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#6342E8] hover:underline flex items-center gap-1 bg-[#F5F6FA] px-3 py-1.5 rounded-full"
                  >
                    Dapatkan key gratis
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Scope Navigation Tabs */}
              <Tabs
                value={activeScope}
                onValueChange={(v) => {
                  setActiveScope(v as KeyScope);
                  setNewKey("");
                }}
              >
                <TabsList className="grid grid-cols-3 w-full h-11 p-1 bg-[#F5F6FA] border-0">
                  {(Object.keys(SCOPE_CONFIG) as KeyScope[]).map((scope) => {
                    const Icon = SCOPE_CONFIG[scope].icon;
                    const count = getKeysForScope(scope).length;
                    return (
                      <TabsTrigger
                        key={scope}
                        value={scope}
                        className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span>{SCOPE_CONFIG[scope].shortLabel}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-bold">
                          {count}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>

              {/* Scope Description Box */}
              <div className="p-4 bg-[#F5F6FA] dark:bg-muted/40 rounded-2xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    {(() => {
                      const Icon = SCOPE_CONFIG[activeScope].icon;
                      return <Icon className="h-3.5 w-3.5 text-[#6342E8]" />;
                    })()}
                    {SCOPE_CONFIG[activeScope].label}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {currentKeys.length} key terkonfigurasi
                  </span>
                </div>
                <p className="text-muted-foreground">{SCOPE_CONFIG[activeScope].desc}</p>
              </div>

              {/* Fallback indicator if module has 0 keys */}
              {activeScope !== "backup" && currentKeys.length === 0 && (
                <div className="p-3.5 bg-[#E8F3FE] dark:bg-blue-950/20 rounded-2xl text-xs text-[#1E40AF] dark:text-blue-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <span>
                      Belum ada key di tab ini. Fitur ini otomatis meminjam{" "}
                      <strong>Key Backup ({settings.moduleKeys?.backup?.length ?? 0} key)</strong>.
                    </span>
                  </div>
                  {(settings.moduleKeys?.backup?.length ?? 0) === 0 && (
                    <Badge variant="destructive" className="text-[10px] shrink-0">
                      Belum Ada Key
                    </Badge>
                  )}
                </div>
              )}

              {/* Add new key */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    type={showNewKey ? "text" : "password"}
                    placeholder={`Paste API key untuk ${SCOPE_CONFIG[activeScope].shortLabel} di sini...`}
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pr-10 font-mono text-sm bg-[#F5F6FA] border-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewKey((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showNewKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button onClick={handleAddKey} disabled={!newKey.trim()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah
                </Button>
              </div>

              {/* Key list */}
              <div className="overflow-y-auto space-y-2 max-h-[210px] pr-1">
                {currentKeys.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-border rounded-2xl text-xs text-muted-foreground">
                    {activeScope === "backup"
                      ? "Belum ada Key Backup. Tambahkan key cadangan di sini."
                      : `Belum ada key di ${SCOPE_CONFIG[activeScope].label}.`}
                  </div>
                ) : (
                  currentKeys.map((key, i) => {
                    const statusId = `${activeScope}-${i}`;
                    const isVisible = visibleKeys.has(statusId);
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#F5F6FA] dark:bg-muted/30"
                      >
                        <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">
                          #{i + 1}
                        </span>

                        <code className="flex-1 text-xs font-mono truncate text-foreground">
                          {isVisible ? key : maskKey(key)}
                        </code>

                        <div className="shrink-0 text-right min-w-[72px]">
                          {statusBadge(keyStatuses[statusId] || "idle")}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => toggleVisible(activeScope, i)}
                            title={isVisible ? "Sembunyikan" : "Tampilkan"}
                          >
                            {isVisible ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-xs"
                            onClick={() => handleTestKey(activeScope, i)}
                            disabled={keyStatuses[statusId] === "testing"}
                          >
                            Test
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteKey(i)}
                            title="Hapus key"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </div>

          <CardContent className="pt-0">
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <Badge variant="secondary" className="text-xs font-bold">
                {currentKeys.length} key di {SCOPE_CONFIG[activeScope].shortLabel}
              </Badge>
              {currentKeys.length > 1 && (
                <span className="text-xs text-muted-foreground">Rotasi otomatis aktif</span>
              )}
              {healthyCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs text-emerald-700 bg-emerald-50 border-0 gap-1 font-bold"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {healthyCount} aktif
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* TOP RIGHT (5 Cols) — Model AI */}
        <Card className="lg:col-span-5 h-full flex flex-col justify-between">
          <div>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Cpu className="h-4 w-4 text-[#6342E8]" />
                Model AI
              </CardTitle>
              <CardDescription>
                Pilih model default untuk pemrosesan prompt, analisis style, dan SEO.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={settings.geminiModel}
                onValueChange={(val) => updateSettings({ geminiModel: val as any })}
              >
                <SelectTrigger className="w-full bg-[#F5F6FA] border-0 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {GEMINI_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-2.5">
                {[
                  {
                    name: "Gemini 3.8 Flash",
                    badge: "Default",
                    badgeClass: "bg-[#ECE8FD] text-[#6342E8]",
                    desc: "Paling seimbang. Cepat, hemat quota, dan sangat pintar.",
                  },
                  {
                    name: "Gemini 3.5 Flash-Lite",
                    badge: "Bulk / Cepat",
                    badgeClass: "bg-[#E6F8EF] text-[#16A34A]",
                    desc: "Super cepat & hemat quota untuk pemrosesan banyak aset.",
                  },
                  {
                    name: "Gemini 2.5 Flash",
                    badge: "Stabil",
                    badgeClass: "bg-[#E8F3FE] text-[#2563EB]",
                    desc: "Model stabil & kompatibel luas dengan semua akun AI Studio.",
                  },
                  {
                    name: "Gemini 3.1 Pro",
                    badge: "Deep Reasoning",
                    badgeClass: "bg-[#FEF3C7] text-[#B45309]",
                    desc: "Hasil lebih detail & mendalam, namun menggunakan kuota lebih besar.",
                  },
                ].map((m) => (
                  <div
                    key={m.name}
                    className="p-3 rounded-2xl bg-[#F5F6FA] dark:bg-muted/40 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{m.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${m.badgeClass}`}
                      >
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {m.desc}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </div>
        </Card>

        {/* BOTTOM LEFT (5 Cols) — Tips Kuota 3x Lipat */}
        <Card className="lg:col-span-5 h-full flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#F59E0B]" />
                  Tips Kuota 3x Lipat
                </CardTitle>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#FEF3C7] text-[#B45309]">
                  Pro Tip
                </span>
              </div>
              <CardDescription>
                Maksimalkan kuota harian gratis (~1.500 req/hari per project).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    step: "Project 1",
                    title: "Generator (Prompt & SEO)",
                    desc: "Khusus pembuatan batch prompt dan metadata SEO.",
                    dot: "bg-[#6342E8]",
                  },
                  {
                    step: "Project 2",
                    title: "Analisis (Foto & Video)",
                    desc: "Khusus fitur Copy Style berbasis Gemini Vision.",
                    dot: "bg-[#22C55E]",
                  },
                  {
                    step: "Project 3",
                    title: "Backup (Cadangan Otomatis)",
                    desc: "Otomatis mengambil alih saat kuota utama terkena limit.",
                    dot: "bg-[#F59E0B]",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="p-3 rounded-2xl bg-[#F5F6FA] dark:bg-muted/40 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-2xs">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {item.step} — {item.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </div>
        </Card>

        {/* BOTTOM RIGHT (7 Cols) — Cara Mendapatkan API Key Gratis */}
        <Card className="lg:col-span-7 h-full flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Cara Mendapatkan API Key Gratis
                </CardTitle>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#E6F8EF] text-[#16A34A]">
                  100% Gratis
                </span>
              </div>
              <CardDescription>
                Ikuti 5 langkah singkat berikut di Google AI Studio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    num: "01",
                    title: "Buka Google AI Studio",
                    desc: "Kunjungi halaman aistudio.google.com/apikey di browser.",
                  },
                  {
                    num: "02",
                    title: "Login Akun Google",
                    desc: "Masuk menggunakan akun Google pribadi kamu.",
                  },
                  {
                    num: "03",
                    title: "Klik Create API Key",
                    desc: "Pilih tombol pembuatan API key baru di dashboard.",
                  },
                  {
                    num: "04",
                    title: "Pilih / Buat Project Baru",
                    desc: "Buat project terpisah untuk setiap modul agar kuota berlipat.",
                  },
                ].map((step) => (
                  <div
                    key={step.num}
                    className="p-3.5 rounded-2xl bg-[#F5F6FA] dark:bg-muted/40 flex items-start gap-3"
                  >
                    <span className="w-7 h-7 rounded-full bg-[#6342E8] text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">
                      {step.num}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground">{step.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F5F6FA] dark:bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Langkah 05:</strong> Copy API key lalu paste ke tab modul di atas. Free tier memberikan ~1.500 req/hari per project.
                </p>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-4 py-2 rounded-full bg-[#14151A] text-white text-xs font-semibold hover:bg-[#14151A]/90 transition-colors inline-flex items-center gap-1.5"
                >
                  Buka AI Studio
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
