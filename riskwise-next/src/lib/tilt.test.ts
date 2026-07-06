import { describe, it, expect } from "vitest";
import { assessTilt } from "./tilt";
import type { PortfolioTrade } from "./types";

const NOW = new Date("2026-06-30T14:00:00"); // local afternoon → not "odd hours"

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
  enteredAt: "2026-06-01T09:00:00Z",
  closedAt: "2026-06-01T10:00:00Z",
  realizedPnl: 100,
  followedChecklist: true,
  ...over,
});

describe("assessTilt", () => {
  it("is calm with no history", () => {
    const t = assessTilt([], 100, NOW);
    expect(t.level).toBe("calm");
    expect(t.score).toBe(0);
    expect(t.suggestedEmotion).toBeNull();
  });

  it("flags a losing streak and suggests revenge", () => {
    const losses = Array.from({ length: 3 }, (_, i) =>
      trade({
        status: "lost",
        realizedPnl: -100,
        closedAt: `2026-06-2${i}T10:00:00Z`,
      })
    );
    const t = assessTilt(losses, 100, NOW);
    expect(t.level).not.toBe("calm");
    expect(t.suggestedEmotion).toBe("revenge");
    expect(t.reasons.join(" ")).toContain("3 lệnh liên tiếp");
  });

  it("escalates to high on a fresh loss re-entry + streak", () => {
    // last loss closed 1 minute ago → rapid re-entry, plus a 2-streak
    const recentLossIso = new Date(NOW.getTime() - 60_000).toISOString();
    const trades = [
      trade({ status: "lost", realizedPnl: -100, closedAt: recentLossIso }),
      trade({ status: "lost", realizedPnl: -100, closedAt: "2026-06-20T10:00:00Z" }),
    ];
    const t = assessTilt(trades, 100, NOW);
    expect(t.level).toBe("high");
    expect(t.suggestedEmotion).toBe("revenge");
  });

  it("flags a risk-size spike as FOMO", () => {
    // three past trades at risk 100 → avg 100; current risk 250 = 2.5×
    const history = Array.from({ length: 3 }, () => trade({ riskAmount: 100, status: "won", realizedPnl: 50 }));
    const t = assessTilt(history, 250, NOW);
    expect(t.reasons.join(" ")).toMatch(/gấp .*× mức thường lệ/);
    expect(t.suggestedEmotion).toBe("fomo");
  });

  it("adds an odd-hours signal at night", () => {
    const night = new Date("2026-06-30T03:00:00"); // 3am local
    const t = assessTilt([], 0, night);
    expect(t.reasons.join(" ")).toContain("3h");
    expect(t.score).toBeGreaterThan(0);
  });
});
