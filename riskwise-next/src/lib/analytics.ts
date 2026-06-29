import type { Emotion, PortfolioTrade } from "./types";
import { EMOTIONS } from "./types";

export interface JournalStats {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  netPnl: number;
  profitFactor: number | null;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  bestTrade: number;
  worstTrade: number;
  maxWinStreak: number;
  maxLossStreak: number;
  disciplineRate: number; // % of trades that followed the checklist
}

export interface EmotionBreakdown {
  emotion: Emotion;
  label: string;
  trades: number;
  netPnl: number;
  winRate: number;
}

const closed = (trades: PortfolioTrade[]) =>
  trades
    .filter((t) => t.status !== "active")
    .slice()
    .sort((a, b) => new Date(a.closedAt ?? a.enteredAt).getTime() - new Date(b.closedAt ?? b.enteredAt).getTime());

const pnlOf = (t: PortfolioTrade) => t.realizedPnl ?? 0;

export function computeStats(trades: PortfolioTrade[]): JournalStats {
  const c = closed(trades);
  const total = c.length;
  const winTrades = c.filter((t) => pnlOf(t) > 0);
  const lossTrades = c.filter((t) => pnlOf(t) < 0);

  const grossProfit = winTrades.reduce((s, t) => s + pnlOf(t), 0);
  const grossLoss = Math.abs(lossTrades.reduce((s, t) => s + pnlOf(t), 0));
  const netPnl = grossProfit - grossLoss;

  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let curWin = 0;
  let curLoss = 0;
  for (const t of c) {
    const p = pnlOf(t);
    if (p > 0) {
      curWin++;
      curLoss = 0;
    } else if (p < 0) {
      curLoss++;
      curWin = 0;
    }
    maxWinStreak = Math.max(maxWinStreak, curWin);
    maxLossStreak = Math.max(maxLossStreak, curLoss);
  }

  const disciplined = c.filter((t) => t.followedChecklist).length;
  const pnls = c.map(pnlOf);

  return {
    total,
    wins: winTrades.length,
    losses: lossTrades.length,
    winRate: total ? (winTrades.length / total) * 100 : 0,
    grossProfit,
    grossLoss,
    netPnl,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? null : 0,
    avgWin: winTrades.length ? grossProfit / winTrades.length : 0,
    avgLoss: lossTrades.length ? grossLoss / lossTrades.length : 0,
    expectancy: total ? netPnl / total : 0,
    bestTrade: pnls.length ? Math.max(...pnls) : 0,
    worstTrade: pnls.length ? Math.min(...pnls) : 0,
    maxWinStreak,
    maxLossStreak,
    disciplineRate: total ? (disciplined / total) * 100 : 0,
  };
}

/** Cumulative equity curve (net PnL over time) from closed trades. */
export function equityCurve(trades: PortfolioTrade[]): { i: number; pnl: number; cumulative: number }[] {
  const c = closed(trades);
  let cumulative = 0;
  return c.map((t, i) => {
    cumulative += pnlOf(t);
    return { i: i + 1, pnl: pnlOf(t), cumulative: Math.round(cumulative * 100) / 100 };
  });
}

/** PnL + win-rate grouped by the emotion logged on each trade. */
export function emotionBreakdown(trades: PortfolioTrade[]): EmotionBreakdown[] {
  const c = closed(trades);
  return EMOTIONS.map(({ value, label }) => {
    const group = c.filter((t) => t.emotion === value);
    const wins = group.filter((t) => pnlOf(t) > 0).length;
    return {
      emotion: value,
      label,
      trades: group.length,
      netPnl: group.reduce((s, t) => s + pnlOf(t), 0),
      winRate: group.length ? (wins / group.length) * 100 : 0,
    };
  }).filter((e) => e.trades > 0);
}

export interface DisciplineComponent {
  key: string;
  label: string;
  value: number; // 0..100
}
export interface DisciplineScore {
  score: number; // 0..100
  grade: string; // S / A / B / C / D / —
  label: string;
  tone: "pos" | "warn" | "neg" | "neutral";
  components: DisciplineComponent[];
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/**
 * A 0–100 "discipline score" — a credit-score-like measure of trading behaviour,
 * blending four heuristics from closed trades:
 *   - checklist adherence (30%)
 *   - emotional control / % calm entries (25%)
 *   - risk-size consistency, via coefficient of variation (20%)
 *   - loss control, via losing streaks and avg-loss vs avg-win (25%)
 */
export function computeDisciplineScore(trades: PortfolioTrade[]): DisciplineScore {
  const c = closed(trades);
  const zero: DisciplineComponent[] = [
    { key: "checklist", label: "Tuân thủ checklist", value: 0 },
    { key: "emotion", label: "Kiểm soát cảm xúc", value: 0 },
    { key: "consistency", label: "Nhất quán rủi ro", value: 0 },
    { key: "lossControl", label: "Kiểm soát thua lỗ", value: 0 },
  ];
  if (c.length === 0) {
    return { score: 0, grade: "—", label: "Chưa có dữ liệu", tone: "neutral", components: zero };
  }

  const stats = computeStats(trades);

  const checklist = clamp(stats.disciplineRate);
  const calm = c.filter((t) => t.emotion === "calm").length;
  const emotion = clamp((calm / c.length) * 100);

  const risks = c.map((t) => t.riskAmount).filter((r) => r > 0);
  let consistency = 100;
  if (risks.length >= 2) {
    const mean = risks.reduce((a, b) => a + b, 0) / risks.length;
    const variance = risks.reduce((a, b) => a + (b - mean) ** 2, 0) / risks.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
    consistency = clamp(100 - cv * 100);
  }

  let lossControl = 100 - clamp(Math.max(0, stats.maxLossStreak - 2) * 18);
  if (stats.avgWin > 0 && stats.avgLoss > stats.avgWin) {
    lossControl -= clamp((stats.avgLoss / stats.avgWin - 1) * 30, 0, 30);
  }
  lossControl = clamp(lossControl);

  const score = Math.round(
    checklist * 0.3 + emotion * 0.25 + consistency * 0.2 + lossControl * 0.25
  );

  let grade = "D";
  let label = "Mất kiểm soát";
  let tone: DisciplineScore["tone"] = "neg";
  if (score >= 85) { grade = "S"; label = "Kỷ luật thép"; tone = "pos"; }
  else if (score >= 70) { grade = "A"; label = "Vững vàng"; tone = "pos"; }
  else if (score >= 55) { grade = "B"; label = "Ổn định"; tone = "warn"; }
  else if (score >= 40) { grade = "C"; label = "Đang dao động"; tone = "warn"; }

  return {
    score,
    grade,
    label,
    tone,
    components: [
      { key: "checklist", label: "Tuân thủ checklist", value: Math.round(checklist) },
      { key: "emotion", label: "Kiểm soát cảm xúc", value: Math.round(emotion) },
      { key: "consistency", label: "Nhất quán rủi ro", value: Math.round(consistency) },
      { key: "lossControl", label: "Kiểm soát thua lỗ", value: Math.round(lossControl) },
    ],
  };
}

/** Human-readable behavioural insights derived from the stats. */
export function buildInsights(stats: JournalStats, emo: EmotionBreakdown[]): string[] {
  const out: string[] = [];
  if (stats.total < 5) {
    out.push("Cần thêm dữ liệu: hãy ghi nhận ít nhất 5–10 lệnh đã đóng để phân tích đáng tin cậy.");
    return out;
  }
  if (stats.profitFactor !== null && stats.profitFactor < 1) {
    out.push(`Profit Factor đang ở mức ${stats.profitFactor.toFixed(2)} (< 1) — hệ thống hiện đang thua lỗ ròng. Hãy soát lại điểm vào/cắt lỗ.`);
  } else if (stats.profitFactor !== null && stats.profitFactor >= 1.5) {
    out.push(`Profit Factor ${stats.profitFactor.toFixed(2)} là rất tốt — hệ thống có lợi thế thống kê rõ ràng.`);
  }
  if (stats.maxLossStreak >= 4) {
    out.push(`Chuỗi thua dài nhất là ${stats.maxLossStreak} lệnh. Cân nhắc giảm khối lượng hoặc nghỉ sau 3 lệnh thua liên tiếp.`);
  }
  if (stats.disciplineRate < 70) {
    out.push(`Chỉ ${stats.disciplineRate.toFixed(0)}% lệnh tuân thủ checklist — kỷ luật thấp thường tương quan với thua lỗ.`);
  }
  const revenge = emo.find((e) => e.emotion === "revenge");
  const fomo = emo.find((e) => e.emotion === "fomo");
  if (revenge && revenge.netPnl < 0) {
    out.push(`Các lệnh "Cay cú/Trả thù" lỗ ròng ${revenge.netPnl.toFixed(0)}$ — đây là tín hiệu cảm xúc tàn phá tài khoản.`);
  }
  if (fomo && fomo.winRate < 50) {
    out.push(`Lệnh vào do FOMO chỉ thắng ${fomo.winRate.toFixed(0)}% — tránh đuổi giá khi đã lỡ điểm vào đẹp.`);
  }
  if (out.length === 0) {
    out.push("Hiệu suất ổn định và kỷ luật tốt. Duy trì khối lượng rủi ro nhất quán để giữ lợi thế dài hạn.");
  }
  return out;
}
