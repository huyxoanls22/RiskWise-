import { ForexPairConfig, TradeSetup, CalculationResult } from '../types';

export const FOREX_PAIRS: ForexPairConfig[] = [
  { symbol: 'EUR/USD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 10 },
  { symbol: 'GBP/USD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 10 },
  { symbol: 'AUD/USD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 10 },
  { symbol: 'NZD/USD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 10 },
  { symbol: 'USD/JPY', pipSize: 0.01, standardLotUnits: 100000, defaultPipValueUSD: 9.3 }, // dynamic approximation
  { symbol: 'USD/CAD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 7.4 },
  { symbol: 'USD/CHF', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 11.2 },
  { symbol: 'EUR/GBP', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 12.5 },
  { symbol: 'EUR/JPY', pipSize: 0.01, standardLotUnits: 100000, defaultPipValueUSD: 9.3 },
  { symbol: 'GBP/JPY', pipSize: 0.01, standardLotUnits: 100000, defaultPipValueUSD: 9.3 },
  { symbol: 'BTC/USD (Crypto Lot)', pipSize: 1, standardLotUnits: 1, defaultPipValueUSD: 1 },
];

export function calculatePositionSize(setup: TradeSetup): CalculationResult {
  // 1. Calculate risk amount in cash (USD or active currency)
  let riskAmount = 0;
  if (setup.riskType === 'percentage') {
    riskAmount = setup.accountBalance * (setup.riskValue / 100);
  } else {
    riskAmount = setup.riskValue;
  }

  // Guard: Avoid dividing by zero or negative balances
  if (setup.accountBalance <= 0 || riskAmount <= 0) {
    return { riskAmount: 0, positionSizeUnits: 0, notionalValue: 0 };
  }

  if (setup.assetClass === 'forex') {
    const slPips = setup.stopLossPips || 10;
    const pairConfig = FOREX_PAIRS.find(p => p.symbol === setup.forexPair) || FOREX_PAIRS[0];
    
    // Custom or default pip value per standard lot
    const pipValLot = setup.pipValueUSD || pairConfig.defaultPipValueUSD;
    
    // Position Size (Lots) = Risk Amount / (Stop Loss in Pips * (Pip Value per lot / Standard Lot Size)) 
    // Wait, let's keep it simple: Lot Size = Risk Amount / (Stop Loss in Pips * Pip Value per Lot)
    // E.g. Risk $100, Stop Loss 50 pips, Pip Value $10 per Lot. 
    // Lot Size = 100 / (50 * 10) = 0.2 Lots. This is exactly correct!
    const positionLots = slPips > 0 && pipValLot > 0 ? (riskAmount / (slPips * pipValLot)) : 0;
    const units = positionLots * pairConfig.standardLotUnits;

    // Estimate notional value (assuming around entry price of 1.0 for cross/base approximations, or simplify to Lot volume * contract unit)
    const notional = positionLots * pairConfig.standardLotUnits;

    let riskRewardRatio = undefined;
    let potentialProfit = undefined;

    if (setup.takeProfitPips && setup.takeProfitPips > 0) {
      riskRewardRatio = setup.takeProfitPips / slPips;
      potentialProfit = positionLots * pipValLot * setup.takeProfitPips;
    }

    return {
      riskAmount,
      positionSizeLots: Math.round(positionLots * 100) / 100, // Round to micro-lots (2 decimals)
      positionSizeUnits: Math.round(units),
      notionalValue: Math.round(notional),
      riskRewardRatio: riskRewardRatio ? Math.round(riskRewardRatio * 100) / 100 : undefined,
      potentialProfit: potentialProfit ? Math.round(potentialProfit * 100) / 100 : undefined,
    };
  } else {
    // Crypto / Stocks
    const entry = setup.entryPrice || 0;
    const slPrice = setup.stopLossPrice || 0;
    const tpPrice = setup.takeProfitPrice || 0;

    const priceDiff = Math.abs(entry - slPrice);

    if (priceDiff <= 0 || entry <= 0 || slPrice <= 0) {
      return { riskAmount, positionSizeUnits: 0, notionalValue: 0 };
    }

    const units = riskAmount / priceDiff;
    const notionalValue = units * entry;

    let riskRewardRatio = undefined;
    let potentialProfit = undefined;

    if (tpPrice > 0) {
      const targetDiff = Math.abs(tpPrice - entry);
      riskRewardRatio = targetDiff / priceDiff;
      
      // Potential profit is calculated based on direction (Long or Short)
      const isLong = entry > slPrice;
      if (isLong && tpPrice > entry) {
        potentialProfit = units * (tpPrice - entry);
      } else if (!isLong && tpPrice < entry) {
        potentialProfit = units * (entry - tpPrice);
      } else {
        // Just raw positive absolute difference as a reference
        potentialProfit = units * targetDiff;
      }
    }

    return {
      riskAmount,
      positionSizeUnits: Math.round(units * 10000) / 10000, // For crypto we can have fractional units (4 decimals)
      riskRewardRatio: riskRewardRatio ? Math.round(riskRewardRatio * 100) / 100 : undefined,
      potentialProfit: potentialProfit ? Math.round(potentialProfit * 100) / 100 : undefined,
      notionalValue: Math.round(notionalValue * 100) / 100,
    };
  }
}
