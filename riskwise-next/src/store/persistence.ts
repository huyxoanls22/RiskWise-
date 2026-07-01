import type { AppData, Checklist, ChecklistItem } from "../lib/types";
import { defaultData, DATA_VERSION } from "./defaults";
import { uid } from "../lib/format";

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
  // Legacy (v1) carried a single flat `checklist: ChecklistItem[]`.
  const p = parsed as Partial<AppData> & { checklist?: ChecklistItem[] };

  const checklists = resolveChecklists(p, base.checklists);
  const activeChecklistId =
    typeof p.activeChecklistId === "string" && checklists.some((c) => c.id === p.activeChecklistId)
      ? p.activeChecklistId
      : checklists[0].id;

  return {
    version: DATA_VERSION,
    setup: { ...base.setup, ...(p.setup ?? {}) },
    savedSetups: Array.isArray(p.savedSetups) ? p.savedSetups : base.savedSetups,
    checklists,
    activeChecklistId,
    trades: Array.isArray(p.trades) ? p.trades : base.trades,
    plans: Array.isArray(p.plans) ? p.plans : base.plans,
    license: { premium: false, ...(p.license ?? {}) },
    settings: { ...base.settings, ...(p.settings ?? {}) },
  };
}

/** Accept the new `checklists` shape, or wrap a legacy flat `checklist` into one named set. */
function resolveChecklists(
  p: Partial<AppData> & { checklist?: ChecklistItem[] },
  fallback: Checklist[]
): Checklist[] {
  if (Array.isArray(p.checklists) && p.checklists.length > 0) {
    const valid = p.checklists.filter((c) => c && typeof c.id === "string" && Array.isArray(c.items));
    if (valid.length > 0) return valid;
  }
  if (Array.isArray(p.checklist) && p.checklist.length > 0) {
    return [{ id: uid("clist"), name: "Mặc định", items: p.checklist }];
  }
  return fallback;
}
