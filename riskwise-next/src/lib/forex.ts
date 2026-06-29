import type { ForexPairConfig } from "./types";

/** Common forex pairs + metals, with pip metadata used for position sizing. */
export const FOREX_PAIRS: ForexPairConfig[] = [
  { symbol: "EUR/USD", pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 10 },
  { symbol: "GBP/USD", pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 10 },
  { symbol: "AUD/USD", pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 10 },
  { symbol: "NZD/USD", pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 10 },
  { symbol: "USD/JPY", pipSize: 0.01, standardLotUnits: 100000, defaultPipValueUSD: 9.3 },
  { symbol: "USD/CAD", pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 7.4 },
  { symbol: "USD/CHF", pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 11.2 },
  { symbol: "EUR/GBP", pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 12.5 },
  { symbol: "EUR/JPY", pipSize: 0.01, standardLotUnits: 100000, defaultPipValueUSD: 9.3 },
  { symbol: "EUR/AUD", pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 6.8 },
  { symbol: "EUR/CAD", pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 7.4 },
  { symbol: "EUR/CHF", pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 11.2 },
  { symbol: "GBP/JPY", pipSize: 0.01, standardLotUnits: 100000, defaultPipValueUSD: 9.3 },
  { symbol: "GBP/AUD", pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 6.8 },
  { symbol: "AUD/JPY", pipSize: 0.01, standardLotUnits: 100000, defaultPipValueUSD: 9.3 },
  { symbol: "AUD/NZD", pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 6.2 },
  { symbol: "NZD/JPY", pipSize: 0.01, standardLotUnits: 100000, defaultPipValueUSD: 9.3 },
  { symbol: "CAD/JPY", pipSize: 0.01, standardLotUnits: 100000, defaultPipValueUSD: 9.3 },
  { symbol: "CHF/JPY", pipSize: 0.01, standardLotUnits: 100000, defaultPipValueUSD: 9.3 },
  { symbol: "USD/SGD", pipSize: 0.0001, standardLotUnits: 100000, defaultPipValueUSD: 7.4 },
  { symbol: "XAU/USD (Gold)", pipSize: 0.01, standardLotUnits: 100, defaultPipValueUSD: 1.0 },
  { symbol: "XAG/USD (Silver)", pipSize: 0.01, standardLotUnits: 5000, defaultPipValueUSD: 50.0 },
];

export function getPairConfig(symbol: string): ForexPairConfig {
  return FOREX_PAIRS.find((p) => p.symbol === symbol) ?? FOREX_PAIRS[0];
}
