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
  calm: { label: "Bình tĩnh", color: "#5C7A54", disciplined: true },
  excited: { label: "Hưng phấn", color: "#B08A30", disciplined: false },
  fearful: { label: "Sợ hãi", color: "#6B6E9E", disciplined: false },
  fomo: { label: "FOMO", color: "#C2783D", disciplined: false },
  revenge: { label: "Cay cú / Trả thù", color: "#B24A3A", disciplined: false },
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

/** A named set of pre-trade criteria. Free users get one; premium up to MAX_CHECKLISTS. */
export interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
}

/** Client-side premium entitlement (local-first; no server verification). */
export interface License {
  premium: boolean;
  key?: string;
  name?: string;
  email?: string;
  plan?: "monthly" | "yearly";
  activatedAt?: string;
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
  /** False when the trade was entered despite exceeding the daily risk limit. Undefined = legacy/within limit. */
  withinDailyLimit?: boolean;
  /** Industry/sector tag, for portfolio concentration analysis. Empty = "Chưa phân loại". */
  sector?: string;
  /** Behavioural tilt score (0..100) at the moment of entry. */
  tiltScore?: number;
}

/** Curated sector/industry tags for portfolio exposure analysis (Vietnam-market flavoured). */
export const SECTORS: string[] = [
  "Ngân hàng",
  "Chứng khoán",
  "Bất động sản",
  "Công nghệ",
  "Sản xuất / Công nghiệp",
  "Bán lẻ / Tiêu dùng",
  "Năng lượng / Dầu khí",
  "Nguyên vật liệu / Thép",
  "Y tế / Dược",
  "Tiện ích",
  "Vận tải / Logistics",
  "Crypto",
  "Ngoại hối / Vàng",
  "Khác",
];

/** Portfolio is flagged as over-concentrated when one sector holds at least this % of open risk. */
export const SECTOR_CONCENTRATION_WARN = 40;

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

/** Free users are limited to a single checklist; premium unlocks up to this many. */
export const MAX_CHECKLISTS = 5;

/** Everything we persist, in one serializable shape (for storage + import/export). */
export interface AppData {
  version: number;
  setup: TradeSetup;
  savedSetups: SavedSetup[];
  checklists: Checklist[];
  activeChecklistId: string;
  trades: PortfolioTrade[];
  plans: TradingPlan[];
  license: License;
  settings: {
    theme: "dark" | "light";
    dailyLimitPercent: number;
  };
}
