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
  TrendingUp,
  Video,
  Zap,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { loadSettings, saveSettings, type AppSettings, type ModuleType } from "@/lib/settings";
import { GEMINI_MODELS } from "@/lib/gemini";

function maskKey(key: string): string {
  if (key.length <= 12) return "••••••••••••";
  return `${key.slice(0, 8)}••••••••${key.slice(-4)}`;
}

type KeyStatus = "idle" | "testing" | "ok" | "limit" | "error";

type KeyScope = "global" | ModuleType;

const SCOPE_CONFIG: Record<
  KeyScope,
  { label: string; shortLabel: string; desc: string; icon: React.ComponentType<{ className?: string }> }
> = {
  global: {
    label: "Key Utama (Global Fallback)",
    shortLabel: "Utama",
    desc: "Key cadangan umum. Digunakan otomatis oleh modul mana pun yang belum memiliki key khusus.",
    icon: Globe,
  },
  trend: {
    label: "Dasbor Tren",
    shortLabel: "Tren",
    desc: "Khusus untuk riset tren pasar microstock dan Google Search Grounding.",
    icon: TrendingUp,
  },
  analysis: {
    label: "Analisis (Foto & Video)",
    shortLabel: "Analisis",
    desc: "Khusus untuk membedah komposisi, pencahayaan, dan gaya sinematik video/foto.",
    icon: Video,
  },
  generator: {
    label: "Generator (SEO & Prompt)",
    shortLabel: "Generator",
    desc: "Khusus pembuatan prompt AI dan ekstraksi metadata SEO (judul, deskripsi, keyword).",
    icon: Zap,
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    geminiKeys: [],
    moduleKeys: { trend: [], analysis: [], generator: [] },
    geminiModel: "gemini-3.8-flash",
  });
  const [activeScope, setActiveScope] = useState<KeyScope>("global");
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
    if (scope === "global") return settings.geminiKeys;
    return settings.moduleKeys?.[scope] ?? [];
  }

  function updateKeysForScope(scope: KeyScope, nextKeys: string[]) {
    if (scope === "global") {
      updateSettings({ geminiKeys: nextKeys });
    } else {
      updateSettings({
        moduleKeys: {
          ...(settings.moduleKeys ?? {}),
          [scope]: nextKeys,
        },
      });
    }
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
      next.has(id) ? next.delete(id) : next.add(id);
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
        description="Konfigurasi API key terisolasi per modul dan preferensi aplikasi"
      />

      <div className="flex-1 p-6 space-y-4 overflow-auto">
        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="py-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <p className="font-medium">API key disimpan lokal di browser (localStorage)</p>
              <p className="text-xs">
                Key tidak dikirim ke server pihak ketiga — hanya digunakan saat memanggil API Google Gemini.
                Kini kamu bisa memisahkan key untuk masing-masing modul agar kuota tidak saling mengganggu.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
          {/* Left — API Keys per Module (wider) */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Key className="h-4 w-4" />
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
                        className="h-7 text-xs gap-1"
                        onClick={handleTestAll}
                        disabled={isTestingAny}
                      >
                        {isTestingAny ? <Loader2 className="h-3 w-3 animate-spin" /> : <Activity className="h-3 w-3" />}
                        Cek Semua
                      </Button>
                    )}
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
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
                  <TabsList className="grid grid-cols-4 w-full h-auto p-1 bg-muted/70">
                    {(Object.keys(SCOPE_CONFIG) as KeyScope[]).map((scope) => {
                      const Icon = SCOPE_CONFIG[scope].icon;
                      const count = getKeysForScope(scope).length;
                      return (
                        <TabsTrigger
                          key={scope}
                          value={scope}
                          className="flex items-center justify-center gap-1.5 py-1.5 text-xs data-[state=active]:shadow-sm"
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span>{SCOPE_CONFIG[scope].shortLabel}</span>
                          <Badge
                            variant={count > 0 ? "secondary" : "outline"}
                            className={`text-[10px] h-4 px-1.5 ${count > 0 ? "bg-background/80 font-medium" : "text-muted-foreground opacity-60"}`}
                          >
                            {count}
                          </Badge>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </Tabs>

                {/* Scope Description Box */}
                <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      {(() => {
                        const Icon = SCOPE_CONFIG[activeScope].icon;
                        return <Icon className="h-3.5 w-3.5 text-primary" />;
                      })()}
                      {SCOPE_CONFIG[activeScope].label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {currentKeys.length} key terkonfigurasi
                    </span>
                  </div>
                  <p className="text-muted-foreground">{SCOPE_CONFIG[activeScope].desc}</p>
                </div>

                {/* Fallback indicator if module has 0 keys */}
                {activeScope !== "global" && currentKeys.length === 0 && (
                  <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>
                        Belum ada key khusus. Modul ini saat ini memakai <strong>Key Utama ({settings.geminiKeys.length} key)</strong>.
                      </span>
                    </div>
                    {settings.geminiKeys.length === 0 && (
                      <Badge variant="destructive" className="text-[10px]">
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
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                <div className="overflow-y-auto space-y-2 max-h-[268px] pr-2">
                  {currentKeys.length === 0 ? (
                    <div className="text-center py-6 border border-dashed rounded-lg text-xs text-muted-foreground">
                      {activeScope === "global"
                        ? "Belum ada Key Utama. Tambahkan minimal 1 key agar semua fitur bisa bekerja."
                        : `Belum ada key khusus untuk ${SCOPE_CONFIG[activeScope].label}.`}
                    </div>
                  ) : (
                    currentKeys.map((key, i) => {
                      const statusId = `${activeScope}-${i}`;
                      const isVisible = visibleKeys.has(statusId);
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border bg-muted/30"
                        >
                          <span className="text-xs font-medium text-muted-foreground w-5 shrink-0">#{i + 1}</span>

                          <code className="flex-1 text-xs font-mono truncate text-muted-foreground">
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
                              {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
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

                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="secondary" className="text-xs">
                    {currentKeys.length} key di {SCOPE_CONFIG[activeScope].shortLabel}
                  </Badge>
                  {currentKeys.length > 1 && (
                    <span className="text-xs text-muted-foreground">Rotasi otomatis aktif</span>
                  )}
                  {healthyCount > 0 && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-300 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {healthyCount} aktif
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Model Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Model AI
                </CardTitle>
                <CardDescription>
                  Pilih model default untuk pemrosesan AI.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select
                  value={settings.geminiModel}
                  onValueChange={(val) => updateSettings({ geminiModel: val as any })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GEMINI_MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 rounded-md p-3">
                  <p><span className="font-medium text-foreground">Gemini 3.8 Flash</span> — Paling seimbang. Cepat, hemat quota, sangat pintar. Rekomendasi utama.</p>
                  <p><span className="font-medium text-foreground">3.5 Flash-Lite</span> — Super cepat dan sangat hemat quota. Paling stabil untuk pemrosesan batch/bulk.</p>
                  <p><span className="font-medium text-foreground">3.1 Pro</span> — Hasil lebih detail & reasoning kuat, tapi lebih lambat dan quota lebih cepat habis.</p>
                </div>
              </CardContent>
            </Card>

            {/* Tips Isolasi Kuota */}
            <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  Tips Kuota 3x Lipat
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-amber-900/90 dark:text-amber-200/90 space-y-2">
                <p>
                  Google AI Studio memberikan kuota gratis <strong>per project</strong> (~1.500 req/hari).
                </p>
                <p>
                  Buat 3 project terpisah di AI Studio untuk memisahkan kuota:
                </p>
                <ul className="list-disc list-inside space-y-0.5 font-medium">
                  <li>Project 1 ➡️ Key untuk <strong>Dasbor Tren</strong></li>
                  <li>Project 2 ➡️ Key untuk <strong>Analisis</strong></li>
                  <li>Project 3 ➡️ Key untuk <strong>Generator</strong></li>
                </ul>
                <p className="pt-1 text-[11px] text-muted-foreground">
                  Dengan cara ini, aktivitas video di Generator tidak akan pernah memblokir Dasbor Tren atau Analisis!
                </p>
              </CardContent>
            </Card>

            {/* Cara Dapat Key */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Cara Mendapatkan API Key Gratis</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                  <li>Buka <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">aistudio.google.com/apikey</a></li>
                  <li>Login dengan akun Google</li>
                  <li>Klik <span className="font-medium text-foreground">"Create API key"</span></li>
                  <li>Pilih project atau buat project baru</li>
                  <li>Copy key dan paste ke tab modul yang sesuai</li>
                </ol>
                <Separator className="my-3" />
                <p className="text-xs text-muted-foreground">
                  Free tier Google AI Studio: ~1,500 request/hari per project dengan <span className="font-medium">gemini-3.8-flash</span>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
