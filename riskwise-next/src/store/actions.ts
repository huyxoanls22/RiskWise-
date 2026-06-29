import type {
  AppData,
  ChecklistItem,
  PortfolioTrade,
  SavedSetup,
  TradeSetup,
  TradingPlan,
} from "../lib/types";
import { store } from "./store";
import { defaultData } from "./defaults";
import { uid } from "../lib/format";

/** All state mutations live here so components never touch storage directly. */
export const actions = {
  // --- Setup -------------------------------------------------------------
  patchSetup(patch: Partial<TradeSetup>) {
    store.update((d) => ({ ...d, setup: { ...d.setup, ...patch } }));
  },
  resetSetup() {
    store.update((d) => ({ ...d, setup: defaultData().setup }));
  },

  // --- Saved setups ------------------------------------------------------
  saveSetup(name: string) {
    store.update((d) => {
      const saved: SavedSetup = {
        ...d.setup,
        id: uid("setup"),
        name: name.trim() || "Thiết lập chưa đặt tên",
        createdAt: new Date().toISOString(),
      };
      return { ...d, savedSetups: [saved, ...d.savedSetups] };
    });
  },
  loadSetup(id: string) {
    store.update((d) => {
      const s = d.savedSetups.find((x) => x.id === id);
      if (!s) return d;
      const { id: _id, name: _name, createdAt: _c, ...setup } = s;
      return { ...d, setup: { ...setup } };
    });
  },
  deleteSetup(id: string) {
    store.update((d) => ({ ...d, savedSetups: d.savedSetups.filter((s) => s.id !== id) }));
  },

  // --- Checklist ---------------------------------------------------------
  toggleChecklist(id: string) {
    store.update((d) => ({
      ...d,
      checklist: d.checklist.map((c) => (c.id === id ? { ...c, isChecked: !c.isChecked } : c)),
    }));
  },
  resetChecklist() {
    store.update((d) => ({
      ...d,
      checklist: d.checklist.map((c) => ({ ...c, isChecked: false })),
    }));
  },
  addChecklistItem(text: string, isRequired: boolean) {
    if (!text.trim()) return;
    store.update((d) => ({
      ...d,
      checklist: [...d.checklist, { id: uid("ck"), text: text.trim(), isChecked: false, isRequired }],
    }));
  },
  updateChecklistItem(id: string, patch: Partial<ChecklistItem>) {
    store.update((d) => ({
      ...d,
      checklist: d.checklist.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  },
  deleteChecklistItem(id: string) {
    store.update((d) => ({ ...d, checklist: d.checklist.filter((c) => c.id !== id) }));
  },

  // --- Portfolio ---------------------------------------------------------
  addTrade(trade: Omit<PortfolioTrade, "id" | "enteredAt" | "status">) {
    store.update((d) => ({
      ...d,
      trades: [
        { ...trade, id: uid("trade"), enteredAt: new Date().toISOString(), status: "active" },
        ...d.trades,
      ],
    }));
  },
  updateTrade(id: string, patch: Partial<PortfolioTrade>) {
    store.update((d) => ({
      ...d,
      trades: d.trades.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  },
  closeTrade(id: string, exitPrice: number) {
    store.update((d) => ({
      ...d,
      trades: d.trades.map((t) => {
        if (t.id !== id) return t;
        const diff = t.direction === "long" ? exitPrice - t.entryPrice : t.entryPrice - exitPrice;
        const realizedPnl = Math.round(diff * t.units * 100) / 100;
        return {
          ...t,
          currentPrice: exitPrice,
          realizedPnl,
          status: realizedPnl >= 0 ? "won" : "lost",
          closedAt: new Date().toISOString(),
        };
      }),
    }));
  },
  deleteTrade(id: string) {
    store.update((d) => ({ ...d, trades: d.trades.filter((t) => t.id !== id) }));
  },

  // --- Plans -------------------------------------------------------------
  addPlan(plan: Omit<TradingPlan, "id" | "createdAt" | "status">) {
    store.update((d) => ({
      ...d,
      plans: [
        { ...plan, id: uid("plan"), createdAt: new Date().toISOString(), status: "pending" },
        ...d.plans,
      ],
    }));
  },
  updatePlan(id: string, patch: Partial<TradingPlan>) {
    store.update((d) => ({
      ...d,
      plans: d.plans.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  },
  deletePlan(id: string) {
    store.update((d) => ({ ...d, plans: d.plans.filter((p) => p.id !== id) }));
  },

  // --- Settings / data ---------------------------------------------------
  setTheme(theme: "dark" | "light") {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("rw_theme", theme);
    } catch {
      /* ignore */
    }
    store.update((d) => ({ ...d, settings: { ...d.settings, theme } }));
  },
  setDailyLimit(pct: number) {
    store.update((d) => ({ ...d, settings: { ...d.settings, dailyLimitPercent: pct } }));
  },
  importData(data: AppData) {
    store.replace(data);
  },
  resetAll() {
    store.replace(defaultData());
  },
};
