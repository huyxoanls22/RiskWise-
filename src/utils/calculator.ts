import { ForexPairConfig, TradeSetup, CalculationResult } from '../types';

export const FOREX_PAIRS: ForexPairConfig[] = [
  // Major Pairs (USD Quotes, EUR, GBP, AUD, NZD)
  { symbol: 'EUR/USD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 10 },
  { symbol: 'GBP/USD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 10 },
  { symbol: 'AUD/USD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 10 },
  { symbol: 'NZD/USD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 10 },
  
  // Majors (USD Base, Quote Japanese Yen, Canadian Dollar, Swiss Franc)
  { symbol: 'USD/JPY', pipSize: 0.01, standardLotUnits: 100000, defaultPipValueUSD: 9.3 },
  { symbol: 'USD/CAD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 7.4 },
  { symbol: 'USD/CHF', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 11.2 },

  // Euro Crosses
  { symbol: 'EUR/GBP', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 12.5 },
  { symbol: 'EUR/JPY', pipSize: 0.01, standardLotUnits: 100000, defaultPipValueUSD: 9.3 },
  { symbol: 'EUR/AUD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 6.8 },
  { symbol: 'EUR/CAD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 7.4 },
  { symbol: 'EUR/CHF', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 11.2 },
  { symbol: 'EUR/NZD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 6.2 },

  // Pound Crosses
  { symbol: 'GBP/JPY', pipSize: 0.01, standardLotUnits: 100000, defaultPipValueUSD: 9.3 },
  { symbol: 'GBP/AUD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 6.8 },
  { symbol: 'GBP/CAD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 7.4 },
  { symbol: 'GBP/CHF', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 11.2 },
  { symbol: 'GBP/NZD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 6.2 },

  // Aussie & Kiwi & Swiss Franc & Canadian crosses
  { symbol: 'AUD/JPY', pipSize: 0.01, standardLotUnits: 100000, defaultPipValueUSD: 9.3 },
  { symbol: 'AUD/CAD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 7.4 },
  { symbol: 'AUD/CHF', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 11.2 },
  { symbol: 'AUD/NZD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 6.2 },
  { symbol: 'NZD/JPY', pipSize: 0.01, standardLotUnits: 100000, defaultPipValueUSD: 9.3 },
  { symbol: 'NZD/CAD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 7.4 },
  { symbol: 'NZD/CHF', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 11.2 },
  { symbol: 'CAD/JPY', pipSize: 0.01, standardLotUnits: 100000, defaultPipValueUSD: 9.3 },
  { symbol: 'CAD/CHF', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 11.2 },
  { symbol: 'CHF/JPY', pipSize: 0.01, standardLotUnits: 100000, defaultPipValueUSD: 9.3 },

  // Emerging & Exotics
  { symbol: 'USD/SGD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 7.4 },
  { symbol: 'USD/HKD', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 1.28 },
  { symbol: 'USD/MXN', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 0.55 },
  { symbol: 'USD/ZAR', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 0.52 },
  { symbol: 'USD/TRY', pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 0.03 },

  // Metals & Popular Commodities (treated under Forex lot rules)
  { symbol: 'XAU/USD (Gold)', pipSize: 0.01, standardLotUnits: 100, defaultPipValueUSD: 1.0 },
  { symbol: 'XAG/USD (Silver)', pipSize: 0.01, standardLotUnits: 5000, defaultPipValueUSD: 50.0 },
];

export const DEFAULT_FOREX_PRICES: { [key: string]: number } = {
  'EUR/USD': 1.0852,
  'GBP/USD': 1.2684,
  'AUD/USD': 0.6612,
  'NZD/USD': 0.6124,
  'USD/JPY': 156.45,
  'USD/CAD': 1.3650,
  'USD/CHF': 0.9080,
  'EUR/GBP': 0.8550,
  'EUR/JPY': 169.80,
  'GBP/JPY': 198.50,
  'EUR/AUD': 1.6420,
  'EUR/CAD': 1.4810,
  'EUR/CHF': 0.9760,
  'EUR/NZD': 1.7750,
  'GBP/AUD': 1.9180,
  'GBP/CAD': 1.7320,
  'GBP/CHF': 1.1410,
  'GBP/NZD': 2.0710,
  'AUD/JPY': 103.45,
  'AUD/CAD': 0.9020,
  'AUD/CHF': 0.6000,
  'AUD/NZD': 1.0790,
  'NZD/JPY': 95.80,
  'NZD/CAD': 0.8350,
  'NZD/CHF': 0.5565,
  'CAD/JPY': 114.60,
  'CAD/CHF': 0.6650,
  'CHF/JPY': 172.30,
  'USD/SGD': 1.3480,
  'USD/HKD': 7.8120,
  'USD/MXN': 17.6500,
  'USD/ZAR': 18.5200,
  'USD/TRY': 32.2500,
  'XAU/USD (Gold)': 2335.50,
  'XAG/USD (Silver)': 29.45,
};

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
