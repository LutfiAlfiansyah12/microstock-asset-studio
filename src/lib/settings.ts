import type { GeminiModel } from "./gemini";

const STORAGE_KEY = "microstock_settings";

export type AppSettings = {
  geminiKeys: string[];
  geminiModel: GeminiModel;
};

const defaults: AppSettings = {
  geminiKeys: [],
  geminiModel: "gemini-flash-latest",
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
