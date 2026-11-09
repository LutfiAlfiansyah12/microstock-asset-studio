import type { GeminiModel } from "./gemini";

const STORAGE_KEY = "microstock_settings";

export type ModuleType = "generator" | "analysis";

export type KeyScope = "generator" | "analysis" | "backup";

export type ModuleKeys = {
  generator?: string[];
  analysis?: string[];
  backup?: string[];
  // Legacy field kept optional for backward compatibility
  trend?: string[];
};

export type AppSettings = {
  moduleKeys: {
    generator: string[];
    analysis: string[];
    backup: string[];
  };
  geminiModel: GeminiModel;
  geminiKeys?: string[]; // Legacy compatibility
};

const defaults: AppSettings = {
  moduleKeys: {
    generator: [],
    analysis: [],
    backup: [],
  },
  geminiModel: "gemini-3.8-flash",
};

import { GEMINI_MODELS } from "./gemini";

const validModelValues = GEMINI_MODELS.map((m) => m.value) as readonly string[];

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);

    // Auto-migrate legacy global geminiKeys to backup if backup is empty
    const legacyGlobalKeys = Array.isArray(parsed.geminiKeys) ? parsed.geminiKeys : [];
    const savedBackup = Array.isArray(parsed.moduleKeys?.backup) ? parsed.moduleKeys.backup : [];
    const backupKeys = savedBackup.length > 0 ? savedBackup : legacyGlobalKeys;

    const result: AppSettings = {
      moduleKeys: {
        generator: Array.isArray(parsed.moduleKeys?.generator) ? parsed.moduleKeys.generator : [],
        analysis: Array.isArray(parsed.moduleKeys?.analysis) ? parsed.moduleKeys.analysis : [],
        backup: backupKeys,
      },
      geminiModel: validModelValues.includes(parsed.geminiModel) ? parsed.geminiModel : defaults.geminiModel,
    };
    return result;
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/**
 * Strict isolation with backup fallback:
 * - When running "analysis": uses analysis keys first. If exhausted, falls back ONLY to backup keys.
 *   DILARANG KERAS menyentuh key generator! Kuota generator terlindungi 100%.
 * - When running "generator": uses generator keys first. If exhausted, falls back ONLY to backup keys.
 *   DILARANG KERAS menyentuh key analysis! Kuota analysis terlindungi 100%.
 */
export function getModuleKeys(module: ModuleType): string[] {
  const settings = loadSettings();
  const primary = settings.moduleKeys?.[module] ?? [];
  const backup = settings.moduleKeys?.backup ?? [];

  // Dedup while preserving priority order: primary module keys first, then backup keys
  const combined = Array.from(new Set([...primary, ...backup])).filter(
    (k) => typeof k === "string" && k.trim().length > 0
  );
  return combined;
}
