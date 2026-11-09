"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Camera,
  Video,
  Tag,
  Settings,
  History,
  ChevronDown,
  Menu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const isDashboardActive = pathname === "/dashboard";
  const isCopyStyleActive = pathname.startsWith("/copy-style");
  const isPromptActive = pathname.startsWith("/prompt");
  const isSeoActive = pathname.startsWith("/seo");
  const isCalendarActive = pathname.startsWith("/calendar");
  const isHistoryActive = pathname.startsWith("/history");
  const isSettingsActive = pathname.startsWith("/settings");

  return (
    <header className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-5">
      <div className="w-full flex items-center justify-between gap-4 bg-white dark:bg-card px-6 py-3.5 rounded-[28px] shadow-xs">
        {/* Brand / Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 text-[#14151A] dark:text-foreground group shrink-0"
        >
          <svg
            viewBox="0 0 28 28"
            fill="none"
            className="w-7 h-7 transition-transform duration-200 group-hover:scale-105"
          >
            <path
              d="M6 6C9.5 6 12.5 9 12.5 12.5C9 12.5 6 9.5 6 6Z"
              fill="currentColor"
            />
            <path
              d="M22 6C22 9.5 19 12.5 15.5 12.5C15.5 9 18.5 6 22 6Z"
              fill="currentColor"
            />
            <path
              d="M6 22C6 18.5 9 15.5 12.5 15.5C12.5 19 9.5 22 6 22Z"
              fill="currentColor"
            />
            <path
              d="M22 22C18.5 22 15.5 19 15.5 15.5C19 15.5 22 18.5 22 22Z"
              fill="#6342E8"
            />
          </svg>
          <span className="text-xl font-extrabold tracking-tight">
            microstock
          </span>
        </Link>

        {/* Center Navigation Pills: Dashboard - Copy Style - Prompt Studio - SEO Generator - Calendar - History */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#F5F6FA] dark:bg-muted p-1.5 rounded-full">
          {/* 1. Dashboard */}
          <Link
            href="/dashboard"
            className={`px-5 py-2 text-[13px] font-semibold rounded-full transition-all duration-200 ${
              isDashboardActive
                ? "bg-[#14151A] text-white dark:bg-primary shadow-xs"
                : "text-[#14151A]/75 dark:text-muted-foreground hover:text-[#14151A] hover:bg-white/60"
            }`}
          >
            Dashboard
          </Link>

          {/* 2. Copy Style */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`px-5 py-2 text-[13px] font-semibold rounded-full transition-all duration-200 flex items-center gap-1.5 outline-none cursor-pointer ${
                isCopyStyleActive
                  ? "bg-[#14151A] text-white dark:bg-primary shadow-xs"
                  : "text-[#14151A]/75 dark:text-muted-foreground hover:text-[#14151A] hover:bg-white/60"
              }`}
            >
              Copy Style
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className="rounded-2xl p-1.5 shadow-lg border-border/60 min-w-48"
            >
              <DropdownMenuItem
                onClick={() => router.push("/copy-style/image")}
                className="rounded-xl cursor-pointer flex items-center gap-2.5 text-xs font-semibold py-2 px-3"
              >
                <Camera className="w-4 h-4 text-[#6342E8]" />
                Analisis Foto / Gambar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/copy-style/video")}
                className="rounded-xl cursor-pointer flex items-center gap-2.5 text-xs font-semibold py-2 px-3"
              >
                <Video className="w-4 h-4 text-[#6342E8]" />
                Analisis Video
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 3. Prompt Studio */}
          <Link
            href="/prompt"
            className={`px-5 py-2 text-[13px] font-semibold rounded-full transition-all duration-200 ${
              isPromptActive
                ? "bg-[#14151A] text-white dark:bg-primary shadow-xs"
                : "text-[#14151A]/75 dark:text-muted-foreground hover:text-[#14151A] hover:bg-white/60"
            }`}
          >
            Prompt Studio
          </Link>

          {/* 4. SEO Generator */}
          <Link
            href="/seo"
            className={`px-5 py-2 text-[13px] font-semibold rounded-full transition-all duration-200 ${
              isSeoActive
                ? "bg-[#14151A] text-white dark:bg-primary shadow-xs"
                : "text-[#14151A]/75 dark:text-muted-foreground hover:text-[#14151A] hover:bg-white/60"
            }`}
          >
            SEO Generator
          </Link>

          {/* 5. Calendar */}
          <Link
            href="/calendar"
            className={`px-5 py-2 text-[13px] font-semibold rounded-full transition-all duration-200 ${
              isCalendarActive
                ? "bg-[#14151A] text-white dark:bg-primary shadow-xs"
                : "text-[#14151A]/75 dark:text-muted-foreground hover:text-[#14151A] hover:bg-white/60"
            }`}
          >
            Calendar
          </Link>

          {/* 6. History */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`px-5 py-2 text-[13px] font-semibold rounded-full transition-all duration-200 flex items-center gap-1.5 outline-none cursor-pointer ${
                isHistoryActive
                  ? "bg-[#14151A] text-white dark:bg-primary shadow-xs"
                  : "text-[#14151A]/75 dark:text-muted-foreground hover:text-[#14151A] hover:bg-white/60"
              }`}
            >
              History
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-2xl p-1.5 shadow-lg border-border/60 min-w-44"
            >
              <DropdownMenuItem
                onClick={() => router.push("/history/prompt")}
                className="rounded-xl cursor-pointer flex items-center gap-2.5 text-xs font-semibold py-2 px-3"
              >
                <History className="w-4 h-4 text-[#6342E8]" />
                Riwayat Prompt
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/history/seo")}
                className="rounded-xl cursor-pointer flex items-center gap-2.5 text-xs font-semibold py-2 px-3"
              >
                <Tag className="w-4 h-4 text-[#6342E8]" />
                Riwayat SEO
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right Actions: Mobile Menu + Settings Icon Button */}
        <div className="flex items-center gap-2">
          {/* Mobile Navigation Menu */}
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-10 h-10 rounded-full bg-[#F5F6FA] hover:bg-muted text-foreground flex items-center justify-center outline-none">
                <Menu className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl p-2 shadow-lg min-w-48">
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard")}
                  className="rounded-xl cursor-pointer text-xs font-semibold py-2 px-3"
                >
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/copy-style/image")}
                  className="rounded-xl cursor-pointer text-xs font-semibold py-2 px-3"
                >
                  Copy Style — Foto/Gambar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/copy-style/video")}
                  className="rounded-xl cursor-pointer text-xs font-semibold py-2 px-3"
                >
                  Copy Style — Video
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/prompt")}
                  className="rounded-xl cursor-pointer text-xs font-semibold py-2 px-3"
                >
                  Prompt Studio
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/seo")}
                  className="rounded-xl cursor-pointer text-xs font-semibold py-2 px-3"
                >
                  SEO Generator
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/calendar")}
                  className="rounded-xl cursor-pointer text-xs font-semibold py-2 px-3"
                >
                  Calendar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/history/prompt")}
                  className="rounded-xl cursor-pointer text-xs font-semibold py-2 px-3"
                >
                  History — Prompt
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/history/seo")}
                  className="rounded-xl cursor-pointer text-xs font-semibold py-2 px-3"
                >
                  History — SEO
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Standard Settings Gear Icon */}
          <Link
            href="/settings"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
              isSettingsActive
                ? "bg-[#14151A] text-white shadow-xs"
                : "bg-[#F5F6FA] hover:bg-muted text-[#14151A] dark:text-foreground"
            }`}
            title="Pengaturan"
          >
            <Settings className="w-[18px] h-[18px]" />
          </Link>
        </div>
      </div>
    </header>
  );
}
