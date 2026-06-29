import type { AppData } from "../lib/types";
import { defaultData, DATA_VERSION } from "./defaults";

const STORAGE_KEY = "riskwise_next_data_v1";

/**
 * Loads persisted state, merging with defaults so missing fields (e.g. after a
 * schema addition) never crash the app.
 */
export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch {
    return defaultData();
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full / unavailable — fail silently rather than break the UI.
  }
}

/** Defensive merge of unknown persisted data onto the current defaults. */
export function migrate(parsed: unknown): AppData {
  const base = defaultData();
  if (!parsed || typeof parsed !== "object") return base;
  const p = parsed as Partial<AppData>;
  return {
    version: DATA_VERSION,
    setup: { ...base.setup, ...(p.setup ?? {}) },
    savedSetups: Array.isArray(p.savedSetups) ? p.savedSetups : base.savedSetups,
    checklist: Array.isArray(p.checklist) ? p.checklist : base.checklist,
    trades: Array.isArray(p.trades) ? p.trades : base.trades,
    plans: Array.isArray(p.plans) ? p.plans : base.plans,
    settings: { ...base.settings, ...(p.settings ?? {}) },
  };
}
