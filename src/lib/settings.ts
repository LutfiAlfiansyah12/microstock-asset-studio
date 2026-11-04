import type { GeminiModel } from "./gemini";

const STORAGE_KEY = "microstock_settings";

export type ModuleType = "trend" | "analysis" | "generator";

export type ModuleKeys = {
  trend?: string[];
  analysis?: string[];
  generator?: string[];
};

export type AppSettings = {
  geminiKeys: string[]; // Global fallback keys
  moduleKeys?: ModuleKeys;
  geminiModel: GeminiModel;
};

const defaults: AppSettings = {
  geminiKeys: [],
  moduleKeys: {
    trend: [],
    analysis: [],
    generator: [],
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
    const result: AppSettings = {
      geminiKeys: Array.isArray(parsed.geminiKeys) ? parsed.geminiKeys : [],
      moduleKeys: {
        trend: Array.isArray(parsed.moduleKeys?.trend) ? parsed.moduleKeys.trend : [],
        analysis: Array.isArray(parsed.moduleKeys?.analysis) ? parsed.moduleKeys.analysis : [],
        generator: Array.isArray(parsed.moduleKeys?.generator) ? parsed.moduleKeys.generator : [],
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
 * Returns dedicated API keys for the specific module if configured,
 * followed by global fallback keys.
 * Prioritizes module-specific keys while ensuring users aren't left stranded
 * when a single dedicated key hits rate limit or quota issues.
 */
export function getModuleKeys(module: ModuleType): string[] {
  const settings = loadSettings();
  const specific = settings.moduleKeys?.[module] ?? [];
  const globalKeys = settings.geminiKeys ?? [];
  const combined = Array.from(new Set([...specific, ...globalKeys])).filter(
    (k) => typeof k === "string" && k.trim().length > 0
  );
  return combined;
}
