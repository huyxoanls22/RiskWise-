import type { AppData } from "../lib/types";
import { store } from "./store";
import { migrate } from "./persistence";

/** Strip angle brackets so imported strings can never carry HTML/script. */
function sanitizeStrings<T>(value: T): T {
  if (typeof value === "string") {
    return value.replace(/[<>]/g, "").slice(0, 10000) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeStrings) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitizeStrings(v);
    return out as T;
  }
  return value;
}

export function exportData(): string {
  return JSON.stringify(store.get(), null, 2);
}

export function downloadBackup(): void {
  const blob = new Blob([exportData()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `riskwise-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Validates and sanitizes an imported backup. Throws a user-facing message on
 * structurally invalid input. Unknown top-level keys are rejected to prevent
 * prototype/structure pollution.
 */
export function parseImport(raw: string): AppData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Tập tin không phải JSON hợp lệ.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Định dạng tập tin khôi phục không hợp lệ.");
  }

  const allowed = new Set([
    "version",
    "setup",
    "savedSetups",
    "checklist",
    "trades",
    "plans",
    "settings",
  ]);
  for (const key of Object.keys(parsed)) {
    if (!allowed.has(key)) {
      throw new Error(`Dữ liệu chứa thuộc tính không hợp lệ: "${key}".`);
    }
  }

  // migrate() fills any gaps with safe defaults; sanitize neutralizes strings.
  return migrate(sanitizeStrings(parsed));
}
