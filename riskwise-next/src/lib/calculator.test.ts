import { describe, it, expect } from "vitest";
import { calculatePositionSize, floatingPnl, riskAmountOf, stopDistancePct } from "./calculator";
import { defaultSetup } from "../store/defaults";
import type { TradeSetup } from "./types";

const forex = (over: Partial<TradeSetup> = {}): TradeSetup => ({
  ...defaultSetup(),
  assetClass: "forex",
  accountBalance: 10000,
  riskType: "amount",
  riskValue: 100,
  forexPair: "EUR/USD",
  stopLossPips: 50,
  takeProfitPips: 100,
  ...over,
});

const crypto = (over: Partial<TradeSetup> = {}): TradeSetup => ({
  ...defaultSetup(),
  assetClass: "crypto_stock",
  accountBalance: 10000,
  riskType: "amount",
  riskValue: 100,
  entryPrice: 100,
  stopLossPrice: 90,
  takeProfitPrice: 120,
  leverage: 1,
  ...over,
});

describe("riskAmountOf", () => {
  it("computes percentage risk", () => {
    expect(riskAmountOf(forex({ riskType: "percentage", riskValue: 2 }))).toBe(200);
  });
  it("returns 0 for non-positive balance", () => {
    expect(riskAmountOf(forex({ accountBalance: 0 }))).toBe(0);
  });
});

describe("calculatePositionSize — forex", () => {
  it("sizes lots correctly ($100 risk / 50 pips / $10 pip = 0.2 lot)", () => {
    const r = calculatePositionSize(forex());
    expect(r.positionSizeLots).toBe(0.2);
    expect(r.positionSizeUnits).toBe(20000);
  });
  it("computes R:R from pips", () => {
    expect(calculatePositionSize(forex()).riskRewardRatio).toBe(2);
  });
  it("returns empty when stop is zero", () => {
    expect(calculatePositionSize(forex({ stopLossPips: 0 })).positionSizeUnits).toBe(0);
  });
});

describe("calculatePositionSize — crypto/stock", () => {
  it("sizes units from per-unit risk", () => {
    const r = calculatePositionSize(crypto());
    expect(r.positionSizeUnits).toBe(10);
    expect(r.notionalValue).toBe(1000);
  });
  it("computes R:R and potential profit", () => {
    const r = calculatePositionSize(crypto());
    expect(r.riskRewardRatio).toBe(2);
    expect(r.potentialProfit).toBe(200);
  });
  it("required margin honors leverage", () => {
    expect(calculatePositionSize(crypto({ leverage: 10 })).requiredMargin).toBe(100);
  });
});

describe("floatingPnl", () => {
  it("long profits when price rises", () => {
    expect(floatingPnl("long", 100, 110, 10)).toBe(100);
  });
  it("short profits when price falls", () => {
    expect(floatingPnl("short", 100, 90, 10)).toBe(100);
  });
});

describe("stopDistancePct", () => {
  it("computes percentage distance", () => {
    expect(stopDistancePct(100, 95)).toBe(5);
  });
});
