/** Formatting + id helpers shared across the UI. */

export const fmtMoney = (n: number, currency = "USD"): string => {
  if (!isFinite(n)) return "—";
  try {
    return n.toLocaleString("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });
  } catch {
    // currency may be an incomplete/invalid ISO code while the user is typing
    // (e.g. "US" or ""). Intl throws on those — fall back to a plain number.
    const amount = n.toLocaleString("en-US", { maximumFractionDigits: 2 });
    return currency ? `${amount} ${currency}` : amount;
  }
};

export const fmtNum = (n: number, dp = 2): string => {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: dp });
};

export const fmtPct = (n: number, dp = 2): string => `${n.toFixed(dp)}%`;

export const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

let counter = 0;
/** Collision-resistant id without external deps. */
export const uid = (prefix = "id"): string => {
  counter = (counter + 1) % 1_000_000;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
};

/** Coerces arbitrary input to a finite number, falling back to a default. */
export const toNum = (v: unknown, fallback = 0): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return isFinite(n) ? n : fallback;
};

export const clsx = (...parts: (string | false | null | undefined)[]): string =>
  parts.filter(Boolean).join(" ");
