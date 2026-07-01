import type {
  AppData,
  Checklist,
  ChecklistItem,
  License,
  PortfolioTrade,
  SavedSetup,
  TradeSetup,
  TradingPlan,
} from "../lib/types";
import { MAX_CHECKLISTS } from "../lib/types";
import { store } from "./store";
import { defaultData, defaultChecklistItems } from "./defaults";
import { uid } from "../lib/format";

/** Immutably map over the items of the currently-active checklist. */
function mapActiveItems(d: AppData, fn: (items: ChecklistItem[]) => ChecklistItem[]): Checklist[] {
  return d.checklists.map((c) => (c.id === d.activeChecklistId ? { ...c, items: fn(c.items) } : c));
}

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

  // --- Checklist sets ----------------------------------------------------
  setActiveChecklist(id: string) {
    store.update((d) => (d.checklists.some((c) => c.id === id) ? { ...d, activeChecklistId: id } : d));
  },
  /** Create a new checklist set and make it active. Caller enforces the premium limit. */
  addChecklist(name: string) {
    store.update((d) => {
      if (d.checklists.length >= MAX_CHECKLISTS) return d;
      const checklist: Checklist = {
        id: uid("clist"),
        name: name.trim() || `Bộ ${d.checklists.length + 1}`,
        items: defaultChecklistItems(),
      };
      return { ...d, checklists: [...d.checklists, checklist], activeChecklistId: checklist.id };
    });
  },
  renameChecklist(id: string, name: string) {
    store.update((d) => ({
      ...d,
      checklists: d.checklists.map((c) => (c.id === id ? { ...c, name: name.trim() || c.name } : c)),
    }));
  },
  /** Delete a checklist set. The last remaining set cannot be deleted. */
  deleteChecklist(id: string) {
    store.update((d) => {
      if (d.checklists.length <= 1) return d;
      const checklists = d.checklists.filter((c) => c.id !== id);
      const activeChecklistId = d.activeChecklistId === id ? checklists[0].id : d.activeChecklistId;
      return { ...d, checklists, activeChecklistId };
    });
  },

  // --- Checklist items (operate on the active set) -----------------------
  toggleChecklist(itemId: string) {
    store.update((d) => ({
      ...d,
      checklists: mapActiveItems(d, (items) =>
        items.map((c) => (c.id === itemId ? { ...c, isChecked: !c.isChecked } : c))
      ),
    }));
  },
  resetChecklist() {
    store.update((d) => ({
      ...d,
      checklists: mapActiveItems(d, (items) => items.map((c) => ({ ...c, isChecked: false }))),
    }));
  },
  addChecklistItem(text: string, isRequired: boolean) {
    if (!text.trim()) return;
    store.update((d) => ({
      ...d,
      checklists: mapActiveItems(d, (items) => [
        ...items,
        { id: uid("ck"), text: text.trim(), isChecked: false, isRequired },
      ]),
    }));
  },
  updateChecklistItem(id: string, patch: Partial<ChecklistItem>) {
    store.update((d) => ({
      ...d,
      checklists: mapActiveItems(d, (items) => items.map((c) => (c.id === id ? { ...c, ...patch } : c))),
    }));
  },
  deleteChecklistItem(id: string) {
    store.update((d) => ({
      ...d,
      checklists: mapActiveItems(d, (items) => items.filter((c) => c.id !== id)),
    }));
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

  // --- License (client-side premium) -------------------------------------
  activatePremium(info: Omit<License, "premium" | "activatedAt">) {
    store.update((d) => ({
      ...d,
      license: { ...info, premium: true, activatedAt: new Date().toISOString() },
    }));
  },
  deactivatePremium() {
    store.update((d) => ({ ...d, license: { premium: false } }));
  },
  importData(data: AppData) {
    store.replace(data);
  },
  resetAll() {
    store.replace(defaultData());
  },
};
