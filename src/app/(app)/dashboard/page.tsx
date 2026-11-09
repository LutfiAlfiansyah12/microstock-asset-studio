"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  Wand2,
  Tags,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Layers,
  Camera,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { TrendData } from "@/app/api/trend/route";

export default function DashboardPage() {
  const [platform, setPlatform] = useState("all");
  const [assetType, setAssetType] = useState("all");
  const [region, setRegion] = useState("global");
  const [keywordTab, setKeywordTab] = useState<"rising" | "saturated">("rising");
  const [pageIdx, setPageIdx] = useState(0);
  const [data, setData] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCacheKey = useCallback(() => {
    return `microstock_trend_${platform}_${assetType}_${region}`;
  }, [platform, assetType, region]);

  const fetchTrends = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          assetType,
          region,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat data");
      setData(json);
      setPageIdx(0);

      try {
        localStorage.setItem(getCacheKey(), JSON.stringify(json));
      } catch {}
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [platform, assetType, region, getCacheKey]);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(getCacheKey());
      if (cached) {
        setData(JSON.parse(cached));
      }
    } catch {}

    fetchTrends();
  }, [fetchTrends, getCacheKey]);

  const activeList =
    keywordTab === "rising"
      ? data?.risingKeywords || []
      : (data?.saturatedKeywords || []).map((k) => ({
          keyword: k.keyword,
          score: k.score,
          change: k.change,
          platform: `Kompetisi ${k.competition}%`,
          reason: k.reason,
        }));

  const cardsPerPage = 3;
  const totalPages = Math.max(1, Math.ceil(activeList.length / cardsPerPage));
  const visibleKeywords = activeList.slice(
    pageIdx * cardsPerPage,
    pageIdx * cardsPerPage + cardsPerPage
  );

  return (
    <div className="space-y-5">
      {error && !data && !isLoading && (
        <div className="rounded-[28px] bg-white p-8 text-center shadow-xs">
          <div className="flex flex-col items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <p className="font-bold text-red-700">Gagal memuat data tren</p>
            <p className="text-xs text-red-600 mb-2">{error}</p>
            <Button size="sm" onClick={fetchTrends}>
              Coba Lagi
            </Button>
          </div>
        </div>
      )}

      {/* Mondly Asymmetric 12-Column, 2-Row Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT COLUMN (Spans 4 cols and 2 rows): Activity + By platform in ONE tall card */}
        <div className="lg:col-span-4 lg:row-span-2 bg-white dark:bg-card rounded-[28px] p-7 shadow-xs flex flex-col justify-between gap-6">
          {/* Top part: Activity */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-5">
              <h2 className="text-xl font-bold tracking-tight text-[#14151A] dark:text-foreground">
                Activity
              </h2>

              {/* Compact Filter Pill like Mondly's "Last 7 days" */}
              <Select
                value={platform}
                onValueChange={(v) => v && setPlatform(v)}
                items={{
                  all: "All Platforms",
                  adobe: "Adobe Stock",
                  shutterstock: "Shutterstock",
                  vecteezy: "Vecteezy",
                }}
              >
                <SelectTrigger className="h-9 rounded-full bg-white dark:bg-muted border border-border/80 text-xs px-3.5 shadow-none font-semibold text-[#14151A] dark:text-foreground">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="adobe">Adobe Stock</SelectItem>
                  <SelectItem value="shutterstock">Shutterstock</SelectItem>
                  <SelectItem value="vecteezy">Vecteezy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Big Number Stat */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-[44px] leading-none font-extrabold tracking-tight text-[#14151A] dark:text-foreground">
                {data ? `${data.stats.avgTrendScore},4` : "85,4"}
              </span>
              <span className="text-xs text-muted-foreground font-medium leading-tight">
                Trend
                <br />
                score
              </span>
            </div>

            {/* Mondly Bar Chart with dashed reference line & Lavender/Violet bars */}
            <div className="h-52 w-full relative">
              {isLoading && !data ? (
                <Skeleton className="h-full w-full rounded-2xl" />
              ) : data ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.trendChart}
                    margin={{ top: 12, right: 4, left: 4, bottom: 0 }}
                    barCategoryGap="18%"
                  >
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#8E929F", fontWeight: 500 }}
                      dy={6}
                    />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#14151A] text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-md">
                              {payload[0].value} score
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      y={data.stats.avgTrendScore}
                      stroke="#14151A"
                      strokeDasharray="4 4"
                      strokeOpacity={0.6}
                    />
                    <Bar dataKey="score" radius={[12, 12, 12, 12]}>
                      {data.trendChart.map((entry, index) => {
                        const isHighlight =
                          index === data.trendChart.length - 2 ||
                          index === data.trendChart.length - 1;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              index === data.trendChart.length - 2
                                ? "#6342E8"
                                : "#DCD6FA"
                            }
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>

          {/* Bottom part: "By platform" inside soft #F5F6FA rounded-3xl container */}
          <div className="bg-[#F5F6FA] dark:bg-muted/50 rounded-[24px] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#14151A] dark:text-foreground">
                By platform
              </h3>
              <div className="flex items-center gap-1.5">
                <Select
                  value={assetType}
                  onValueChange={(v) => v && setAssetType(v)}
                  items={{
                    all: "All Types",
                    photo: "Photo",
                    vector: "Vector",
                    video: "Video",
                  }}
                >
                  <SelectTrigger className="h-7 rounded-full bg-white dark:bg-card border-0 text-[11px] px-2.5 shadow-2xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="vector">Vector</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3.5">
              {[
                {
                  sub: "Commercial & AI",
                  name: "Adobe Stock",
                  val: "92,5",
                  unit: "%",
                  iconBg: "bg-white",
                  iconColor: "text-[#14151A]",
                  symbol: "✦",
                },
                {
                  sub: "Global Demand",
                  name: "Shutterstock",
                  val: "86,8",
                  unit: "%",
                  iconBg: "bg-sky-500/15",
                  iconColor: "text-sky-600",
                  symbol: "●",
                },
                {
                  sub: "Vector & Graphics",
                  name: "Vecteezy",
                  val: "79,2",
                  unit: "%",
                  iconBg: "bg-emerald-500/15",
                  iconColor: "text-emerald-600",
                  symbol: "◆",
                },
                {
                  sub: "Templates & PSD",
                  name: "Freepik",
                  val: "74,5",
                  unit: "%",
                  iconBg: "bg-indigo-500/15",
                  iconColor: "text-indigo-600",
                  symbol: "▲",
                },
              ].map((plat) => (
                <div
                  key={plat.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${plat.iconBg} shadow-2xs flex items-center justify-center font-bold text-sm ${plat.iconColor}`}
                    >
                      {plat.symbol}
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        {plat.sub}
                      </p>
                      <p className="text-xs font-bold text-[#14151A] dark:text-foreground">
                        {plat.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-[#14151A] dark:text-foreground">
                      {plat.val}
                    </span>
                    <span className="text-xs text-muted-foreground ml-0.5">
                      {plat.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TOP CENTER (4 Cols): Progress statistics */}
        <div className="lg:col-span-4 bg-white dark:bg-card rounded-[28px] p-7 shadow-xs flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold tracking-tight text-[#14151A] dark:text-foreground">
                Progress statistics
              </h2>
              <button
                type="button"
                onClick={fetchTrends}
                title="Refresh Data"
                className="w-8 h-8 rounded-full bg-[#F5F6FA] hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <RefreshCw
                  className={cn("w-3.5 h-3.5", isLoading && "animate-spin")}
                />
              </button>
            </div>

            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-[44px] leading-none font-extrabold tracking-tight text-[#14151A] dark:text-foreground">
                {data ? `${data.stats.avgTrendScore}%` : "64%"}
              </span>
              <span className="text-xs text-muted-foreground font-medium leading-tight">
                Total
                <br />
                activity
              </span>
            </div>

            {/* Mondly 3-Color Segmented Bar with vertical ticks & percentages */}
            <div className="space-y-2 mb-6">
              <div className="w-full h-1.5 flex items-center gap-1.5">
                <div
                  className="h-full bg-[#6342E8] rounded-full"
                  style={{ width: "28%" }}
                />
                <div
                  className="h-full bg-[#22C55E] rounded-full"
                  style={{ width: "36%" }}
                />
                <div
                  className="h-full bg-[#F59E0B] rounded-full"
                  style={{ width: "36%" }}
                />
              </div>
              <div className="flex items-center text-[11px] font-semibold text-muted-foreground">
                <span style={{ width: "28%" }}>28%</span>
                <span style={{ width: "36%" }}>36%</span>
                <span style={{ width: "36%" }}>36%</span>
              </div>
            </div>
          </div>

          {/* 3 Columns inside #F5F6FA box (In progress, Completed, Upcoming) */}
          <div className="bg-[#F5F6FA] dark:bg-muted/50 rounded-[24px] p-5 grid grid-cols-3 divide-x divide-border/70">
            <div className="flex flex-col items-center text-center px-2">
              <div className="w-10 h-10 rounded-full bg-[#6342E8] text-white flex items-center justify-center mb-3 shadow-sm shadow-[#6342E8]/30">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-2xl font-extrabold text-[#14151A] dark:text-foreground">
                {data ? data.stats.risingCount : "8"}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium mt-0.5">
                Rising Hot
              </span>
            </div>

            <div className="flex flex-col items-center text-center px-2">
              <div className="w-10 h-10 rounded-full bg-[#22C55E] text-white flex items-center justify-center mb-3 shadow-sm shadow-[#22C55E]/30">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-2xl font-extrabold text-[#14151A] dark:text-foreground">
                {data ? data.stats.opportunitiesCount : "12"}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium mt-0.5">
                Peluang
              </span>
            </div>

            <div className="flex flex-col items-center text-center px-2">
              <div className="w-10 h-10 rounded-full bg-[#F97316] text-white flex items-center justify-center mb-3 shadow-sm shadow-[#F97316]/30">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-2xl font-extrabold text-[#14151A] dark:text-foreground">
                {data ? data.stats.saturatedCount : "14"}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium mt-0.5">
                Saturated
              </span>
            </div>
          </div>
        </div>

        {/* TOP RIGHT (4 Cols): Ringkasan Tren Microstock */}
        <div className="lg:col-span-4 bg-white dark:bg-card rounded-[28px] p-7 shadow-xs flex flex-col justify-between gap-5">
          <div>
            {/* 2 Pastel Badges */}
            <div className="flex items-center gap-2 mb-3.5">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#E6F8EF] text-[#16A34A]">
                Seasonal Focus
              </span>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#E8F3FE] text-[#2563EB]">
                Market Summary
              </span>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-[#14151A] dark:text-foreground mb-3">
              Ringkasan Tren Microstock
            </h2>

            <p className="text-[13px] text-muted-foreground leading-relaxed">
              {data?.summary ||
                "Analisis pasar microstock saat ini berfokus pada persiapan kampanye musiman, tren kolaborasi AI-manusia, energi terbarukan, serta gaya hidup autentik dengan tingkat permintaan komersial tinggi."}
            </p>
          </div>

          {/* Solid Black Pill CTA Button */}
          <Link
            href="/prompt"
            className="w-full h-12 rounded-full bg-[#14151A] hover:bg-[#14151A]/90 text-white font-semibold text-xs flex items-center justify-center shadow-sm transition-all"
          >
            Continue to Prompt Studio
          </Link>
        </div>

        {/* BOTTOM RIGHT (Spans 8 Cols): "My schedule" -> Trending Keywords Schedule */}
        <div className="lg:col-span-8 bg-white dark:bg-card rounded-[28px] p-7 shadow-xs flex flex-col justify-between gap-5">
          {/* Header with < Today > navigation like Mondly */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight text-[#14151A] dark:text-foreground">
                Trending keywords
              </h2>
              <div className="inline-flex items-center gap-1 bg-[#F5F6FA] p-1 rounded-full">
                <button
                  type="button"
                  onClick={() => {
                    setKeywordTab("rising");
                    setPageIdx(0);
                  }}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer",
                    keywordTab === "rising"
                      ? "bg-[#14151A] text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Rising
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setKeywordTab("saturated");
                    setPageIdx(0);
                  }}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer",
                    keywordTab === "saturated"
                      ? "bg-[#14151A] text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Saturated
                </button>
              </div>
            </div>

            {/* Mondly < Today > style pager */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setPageIdx((p) => Math.max(0, p - 1))}
                disabled={pageIdx === 0}
                className="w-8 h-8 rounded-full border border-border/80 flex items-center justify-center text-foreground disabled:opacity-40 hover:bg-[#F5F6FA] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-[#14151A] dark:text-foreground px-1">
                Page {pageIdx + 1}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPageIdx((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={pageIdx >= totalPages - 1}
                className="w-8 h-8 rounded-full border border-border/80 flex items-center justify-center text-foreground disabled:opacity-40 hover:bg-[#F5F6FA] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3 Schedule-style Cards Side by Side (Center card highlighted in Electric Violet #6342E8) */}
          {isLoading && !data ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-52 w-full rounded-[24px]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {visibleKeywords.map((item, idx) => {
                const isCenterViolet = idx === 1;
                return (
                  <div
                    key={item.keyword}
                    className={cn(
                      "rounded-[24px] p-5 flex flex-col justify-between min-h-[210px] transition-all",
                      isCenterViolet
                        ? "bg-[#6342E8] text-white shadow-lg shadow-[#6342E8]/25"
                        : "bg-[#F5F6FA] dark:bg-muted/50 text-[#14151A] dark:text-foreground"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={cn(
                            "text-[11px] font-medium",
                            isCenterViolet
                              ? "text-white/80"
                              : "text-muted-foreground"
                          )}
                        >
                          Score: {item.score} — {item.change}
                        </span>

                        {isCenterViolet ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-white flex items-center gap-1">
                            ● Hot
                          </span>
                        ) : null}
                      </div>

                      <h3 className="text-base font-bold leading-snug mb-3 line-clamp-2">
                        {item.keyword}
                      </h3>

                      <span
                        className={cn(
                          "inline-block text-[11px] font-semibold px-3 py-1 rounded-full",
                          isCenterViolet
                            ? "bg-[#E0E7FF] text-[#3730A3]"
                            : "bg-[#E0EEFF] text-[#2563EB]"
                        )}
                      >
                        {item.platform}
                      </span>
                    </div>

                    {/* Bottom Mentor-style Row with Avatar + Quick Action */}
                    <div className="flex items-center justify-between pt-4 mt-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                            isCenterViolet
                              ? "bg-white text-[#6342E8]"
                              : "bg-[#FACC15] text-[#14151A]"
                          )}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <Link
                            href={`/prompt?keyword=${encodeURIComponent(
                              item.keyword
                            )}`}
                            className="text-xs font-bold hover:underline block leading-tight"
                          >
                            Buat Prompt
                          </Link>
                          <Link
                            href={`/seo?keyword=${encodeURIComponent(
                              item.keyword
                            )}`}
                            className={cn(
                              "text-[10px] hover:underline block",
                              isCenterViolet
                                ? "text-white/75"
                                : "text-muted-foreground"
                            )}
                          >
                            + Generate SEO
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
