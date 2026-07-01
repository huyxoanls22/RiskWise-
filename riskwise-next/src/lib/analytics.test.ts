import { describe, it, expect } from "vitest";
import { computeDisciplineScore, computeStats, riskUsedToday } from "./analytics";
import type { PortfolioTrade } from "./types";

const trade = (over: Partial<PortfolioTrade>): PortfolioTrade => ({
  id: Math.random().toString(36),
  ticker: "EUR/USD",
  assetClass: "forex",
  direction: "long",
  entryPrice: 1,
  currentPrice: 1,
  units: 1000,
  riskAmount: 100,
  stopLoss: 0.99,
  status: "won",
  enteredAt: "2026-01-01T00:00:00Z",
  closedAt: "2026-01-02T00:00:00Z",
  realizedPnl: 100,
  followedChecklist: true,
  emotion: "calm",
  ...over,
});

describe("computeDisciplineScore", () => {
  it("returns a neutral placeholder with no closed trades", () => {
    const s = computeDisciplineScore([]);
    expect(s.grade).toBe("—");
    expect(s.score).toBe(0);
  });

  it("rewards disciplined, calm, consistent winners with a high grade", () => {
    const trades = Array.from({ length: 6 }, () =>
      trade({ followedChecklist: true, emotion: "calm", riskAmount: 100, realizedPnl: 150, status: "won" })
    );
    const s = computeDisciplineScore(trades);
    expect(s.score).toBeGreaterThanOrEqual(85);
    expect(s.grade).toBe("S");
  });

  it("punishes revenge trading, skipped checklists and long loss streaks", () => {
    const trades = Array.from({ length: 6 }, (_, i) =>
      trade({
        followedChecklist: false,
        emotion: "revenge",
        riskAmount: 100 + i * 80, // inconsistent sizing
        realizedPnl: -200,
        status: "lost",
      })
    );
    const s = computeDisciplineScore(trades);
    expect(s.score).toBeLessThan(40);
    expect(s.grade).toBe("D");
  });

  it("score stays within 0..100", () => {
    const trades = [trade({}), trade({ realizedPnl: -50, status: "lost", emotion: "fomo" })];
    const s = computeDisciplineScore(trades);
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.score).toBeLessThanOrEqual(100);
  });
});

describe("computeStats sanity", () => {
  it("counts wins and losses", () => {
    const stats = computeStats([trade({ realizedPnl: 100 }), trade({ realizedPnl: -40, status: "lost" })]);
    expect(stats.wins).toBe(1);
    expect(stats.losses).toBe(1);
    expect(stats.netPnl).toBe(60);
  });

  it("treats a daily-limit override as undisciplined even when the checklist was followed", () => {
    const within = computeStats([trade({ followedChecklist: true, withinDailyLimit: true })]);
    const over = computeStats([trade({ followedChecklist: true, withinDailyLimit: false })]);
    expect(within.disciplineRate).toBe(100);
    expect(over.disciplineRate).toBe(0);
  });

  it("treats legacy trades without the withinDailyLimit flag as within the limit", () => {
    const stats = computeStats([trade({ followedChecklist: true, withinDailyLimit: undefined })]);
    expect(stats.disciplineRate).toBe(100);
  });
});

describe("riskUsedToday", () => {
  const now = new Date("2026-06-30T10:00:00");

  it("sums risk only for trades entered today (active or closed)", () => {
    const trades = [
      trade({ enteredAt: now.toISOString(), riskAmount: 100, status: "active" }),
      trade({ enteredAt: now.toISOString(), riskAmount: 50, status: "won" }),
      trade({ enteredAt: "2026-06-29T10:00:00", riskAmount: 999, status: "won" }), // yesterday
    ];
    expect(riskUsedToday(trades, now)).toBe(150);
  });

  it("ignores invalid dates and non-positive risk", () => {
    const trades = [
      trade({ enteredAt: "not-a-date", riskAmount: 100 }),
      trade({ enteredAt: now.toISOString(), riskAmount: -5 }),
    ];
    expect(riskUsedToday(trades, now)).toBe(0);
  });
});
