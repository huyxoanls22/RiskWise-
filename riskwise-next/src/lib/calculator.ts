import type { CalculationResult, TradeSetup } from "./types";
import { getPairConfig } from "./forex";

const round = (n: number, dp: number) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

/** Cash amount the setup puts at risk (percentage of balance or fixed amount). */
export function riskAmountOf(setup: TradeSetup): number {
  if (setup.accountBalance <= 0) return 0;
  if (setup.riskType === "percentage") {
    return setup.accountBalance * (setup.riskValue / 100);
  }
  return setup.riskValue;
}

const EMPTY: CalculationResult = {
  riskAmount: 0,
  positionSizeUnits: 0,
  notionalValue: 0,
};

/**
 * Computes position size, notional, required margin and reward metrics from a
 * setup. Pure and deterministic — the single source of truth for sizing.
 */
export function calculatePositionSize(setup: TradeSetup): CalculationResult {
  const riskAmount = riskAmountOf(setup);
  if (riskAmount <= 0) return { ...EMPTY };

  if (setup.assetClass === "forex") {
    const slPips = setup.stopLossPips;
    if (!slPips || slPips <= 0) return { ...EMPTY, riskAmount };

    const cfg = getPairConfig(setup.forexPair);
    const pipValuePerLot = setup.pipValueUSD && setup.pipValueUSD > 0 ? setup.pipValueUSD : cfg.defaultPipValueUSD;

    const lots = riskAmount / (slPips * pipValuePerLot);
    const units = lots * cfg.standardLotUnits;
    const notional = units; // notional in base-currency units (≈ contract size)
    const requiredMargin = setup.leverage > 0 ? notional / setup.leverage : undefined;

    let riskRewardRatio: number | undefined;
    let potentialProfit: number | undefined;
    if (setup.takeProfitPips && setup.takeProfitPips > 0) {
      riskRewardRatio = setup.takeProfitPips / slPips;
      potentialProfit = lots * pipValuePerLot * setup.takeProfitPips;
    }

    return {
      riskAmount: round(riskAmount, 2),
      positionSizeLots: round(lots, 2),
      positionSizeUnits: Math.round(units),
      notionalValue: Math.round(notional),
      requiredMargin: requiredMargin !== undefined ? round(requiredMargin, 2) : undefined,
      riskRewardRatio: riskRewardRatio !== undefined ? round(riskRewardRatio, 2) : undefined,
      potentialProfit: potentialProfit !== undefined ? round(potentialProfit, 2) : undefined,
    };
  }

  // Crypto / stock
  const entry = setup.entryPrice;
  const sl = setup.stopLossPrice;
  const tp = setup.takeProfitPrice;
  const perUnitRisk = Math.abs(entry - sl);
  if (entry <= 0 || sl <= 0 || perUnitRisk <= 0) return { ...EMPTY, riskAmount };

  const units = riskAmount / perUnitRisk;
  const notional = units * entry;
  const requiredMargin = setup.leverage > 0 ? notional / setup.leverage : undefined;

  let riskRewardRatio: number | undefined;
  let potentialProfit: number | undefined;
  if (tp && tp > 0) {
    const reward = Math.abs(tp - entry);
    riskRewardRatio = reward / perUnitRisk;
    potentialProfit = units * reward;
  }

  return {
    riskAmount: round(riskAmount, 2),
    positionSizeUnits: round(units, 4),
    notionalValue: round(notional, 2),
    requiredMargin: requiredMargin !== undefined ? round(requiredMargin, 2) : undefined,
    riskRewardRatio: riskRewardRatio !== undefined ? round(riskRewardRatio, 2) : undefined,
    potentialProfit: potentialProfit !== undefined ? round(potentialProfit, 2) : undefined,
  };
}

/**
 * Floating PnL for an open trade given a current price. Positive = profit.
 * Direction-aware: shorts profit when price falls.
 */
export function floatingPnl(
  direction: "long" | "short",
  entryPrice: number,
  currentPrice: number,
  units: number
): number {
  const diff = direction === "long" ? currentPrice - entryPrice : entryPrice - currentPrice;
  return round(diff * units, 2);
}

/** Distance from entry to stop, expressed as a percentage of entry. */
export function stopDistancePct(entry: number, stop: number): number {
  if (entry <= 0) return 0;
  return round((Math.abs(entry - stop) / entry) * 100, 2);
}
