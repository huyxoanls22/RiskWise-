/** Domain model for RiskWise Next. Pure types — no UI / framework imports. */

export type AssetClass = "forex" | "crypto_stock";
export type Direction = "long" | "short";
export type RiskType = "percentage" | "amount";

export type Emotion =
  | "calm"
  | "excited"
  | "fearful"
  | "fomo"
  | "revenge";

export const EMOTIONS: { value: Emotion; label: string }[] = [
  { value: "calm", label: "Bình tĩnh" },
  { value: "excited", label: "Hưng phấn" },
  { value: "fearful", label: "Sợ hãi" },
  { value: "fomo", label: "FOMO" },
  { value: "revenge", label: "Cay cú / Trả thù" },
];

/** Per-emotion display metadata. `disciplined` flags emotionally-controlled states. */
export const EMOTION_META: Record<Emotion, { label: string; color: string; disciplined: boolean }> = {
  calm: { label: "Bình tĩnh", color: "#3DDC97", disciplined: true },
  excited: { label: "Hưng phấn", color: "#FBBF24", disciplined: false },
  fearful: { label: "Sợ hãi", color: "#A78BFA", disciplined: false },
  fomo: { label: "FOMO", color: "#FB923C", disciplined: false },
  revenge: { label: "Cay cú / Trả thù", color: "#FB7185", disciplined: false },
};

export interface ForexPairConfig {
  symbol: string;
  pipSize: number;
  standardLotUnits: number;
  defaultPipValueUSD: number;
}

/** A risk/position-sizing setup the user is composing. */
export interface TradeSetup {
  assetClass: AssetClass;
  direction: Direction;
  accountBalance: number;
  accountCurrency: string;
  riskType: RiskType;
  riskValue: number;

  // Forex
  forexPair: string;
  stopLossPips: number;
  takeProfitPips: number;
  pipValueUSD?: number;

  // Crypto / stock
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;

  // Meta
  leverage: number;
  emotion?: Emotion;
}

export interface SavedSetup extends TradeSetup {
  id: string;
  name: string;
  createdAt: string;
}

export interface CalculationResult {
  riskAmount: number;
  positionSizeUnits: number;
  positionSizeLots?: number;
  notionalValue: number;
  requiredMargin?: number;
  riskRewardRatio?: number;
  potentialProfit?: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  isChecked: boolean;
  isRequired: boolean;
}

export interface PortfolioTrade {
  id: string;
  ticker: string;
  assetClass: AssetClass;
  direction: Direction;
  entryPrice: number;
  currentPrice: number;
  units: number;
  lots?: number;
  riskAmount: number;
  stopLoss: number;
  takeProfit?: number;
  status: "active" | "won" | "lost";
  enteredAt: string;
  closedAt?: string;
  realizedPnl?: number;
  notes?: string;
  emotion?: Emotion;
  followedChecklist: boolean;
}

export interface TradingPlan {
  id: string;
  title: string;
  ticker: string;
  assetClass: AssetClass;
  direction: Direction;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice?: number;
  timeframe: string;
  conviction: number; // 1..5
  notes: string;
  status: "pending" | "executed" | "cancelled";
  createdAt: string;
}

/** Everything we persist, in one serializable shape (for storage + import/export). */
export interface AppData {
  version: number;
  setup: TradeSetup;
  savedSetups: SavedSetup[];
  checklist: ChecklistItem[];
  trades: PortfolioTrade[];
  plans: TradingPlan[];
  settings: {
    theme: "dark" | "light";
    dailyLimitPercent: number;
  };
}
