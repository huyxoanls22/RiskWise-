export type AssetClass = 'forex' | 'crypto_stock';

export interface ForexPairConfig {
  symbol: string;
  pipSize: number; // e.g. 0.0001 for EURUSD, 0.01 for USDJPY
  standardLotUnits: number; // typically 100,000
  defaultPipValueUSD: number; // Approx value of 1 pip for 1 standard lot (usually $10 for USD quote pairs)
}

export interface TradeSetup {
  id: string;
  name: string;
  assetClass: AssetClass;
  direction?: 'long' | 'short'; // Long/Buy or Short/Sell direction
  accountBalance: number;
  accountCurrency: string;
  riskType: 'percentage' | 'amount';
  riskValue: number; // either % (like 2%) or absolute cash amount (like 200)
  emotion?: 'Bình tĩnh' | 'Hưng phấn' | 'Sợ hãi' | 'FOMO' | 'Cay cú/Trả thù';
  
  // Forex spec
  forexPair?: string;
  stopLossPips?: number;
  pipValueUSD?: number; // Custom pip value per standard lot
  takeProfitPips?: number;
  
  // Crypto/Stock spec
  entryPrice?: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  sector?: string;
  dailyLimitPercent?: number; // Daily risk limit as a percentage of account balance (e.g., 2% or 5%)

  createdAt: string;
}

export interface CalculationResult {
  riskAmount: number; // Absolute cash at risk
  positionSizeLots?: number; // Forex position in lots (Standard/Mini/Micro)
  positionSizeUnits: number; // Position size in raw units/shares/contracts
  riskRewardRatio?: number;
  potentialProfit?: number;
  notionalValue: number; // Total value of the position
  requiredMargin?: number; // based on chosen leverage
}

export interface ChecklistItem {
  id: string;
  text: string;
  isChecked: boolean;
  isRequired: boolean; // if true, entering trade without it prompts alert
}

export interface ChecklistProfile {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface PortfolioTrade {
  id: string;
  ticker: string;
  assetClass: AssetClass;
  direction: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  units: number;
  lots?: number; // for forex
  riskAmount: number;
  stopLoss: number | string;
  takeProfit?: number | string;
  pnl: number; // current price-based floating profit/loss
  trailingStopPrice?: number;
  status: 'active' | 'won' | 'lost';
  enteredAt: string;
  uncheckedWarning: boolean; // whether warning was issued (i.e. check list wasn't fully checked)
  isPriceUpdated?: boolean; // whether current price has been explicitly updated by user
  notes?: string;
  sector?: string;
  setup?: string;
  emotion?: 'Bình tĩnh' | 'Hưng phấn' | 'Sợ hãi' | 'FOMO' | 'Cay cú/Trả thù';
  riskPercent?: number;
  tpPercent?: number;
  rrRatio?: number;
}

export interface TradingPlan {
  id: string;
  title: string;
  ticker: string;
  assetClass: AssetClass;
  direction: 'long' | 'short';
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice?: number;
  timeframe: string; // e.g., M15, H1, H4, D1
  conviction: number; // rating 1 to 5
  notes: string;
  status: 'pending' | 'executed' | 'cancelled';
  createdAt: string;
}

export interface DailyLimitLog {
  date: string; // Format: "YYYY-MM-DD" or "DD/MM/YYYY"
  totalRisk: number; // Total risk calculated for that day (USD)
  allowedLimit: number; // Daily limit threshold (USD)
  isExceeded: boolean; // Whether the total risk exceeded the daily limit
  breachedByForce: boolean; // True if the trader forced-entered
}

