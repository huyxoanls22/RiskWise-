import type { PortfolioTrade, Emotion } from "./types";

/**
 * Behavioural "tilt" detection — infers emotional risk from HOW the trader is acting,
 * using only data the app already has (no hardware, no self-report). It measures the
 * behaviour that actually loses money (revenge, FOMO, overtrading), which is a better
 * predictor of a bad entry than a self-declared mood.
 */

export type TiltLevel = "calm" | "caution" | "high";

export interface TiltAssessment {
  score: number; // 0..100
  level: TiltLevel;
  label: string;
  tone: "pos" | "warn" | "neg";
  reasons: string[];
  /** Best-guess emotion behind the tilt, to pre-fill/confirm instead of blind self-report. */
  suggestedEmotion: Emotion | null;
}

const pnlOf = (t: PortfolioTrade) => t.realizedPnl ?? 0;

const closedByRecency = (trades: PortfolioTrade[]) =>
  trades
    .filter((t) => t.status !== "active")
    .slice()
    .sort((a, b) => new Date(b.closedAt ?? b.enteredAt).getTime() - new Date(a.closedAt ?? a.enteredAt).getTime());

function lossStreak(closedRecentFirst: PortfolioTrade[]): number {
  let n = 0;
  for (const t of closedRecentFirst) {
    if (pnlOf(t) < 0) n++;
    else break;
  }
  return n;
}

/**
 * @param currentRisk the risk (account currency) of the trade about to be entered.
 * @param now injected for testability.
 */
export function assessTilt(
  trades: PortfolioTrade[],
  currentRisk: number,
  now: Date = new Date()
): TiltAssessment {
  const reasons: string[] = [];
  let score = 0;
  let revenge = false;
  let fomo = false;

  const closed = closedByRecency(trades);

  // 1. Losing streak → revenge risk.
  const streak = lossStreak(closed);
  if (streak >= 4) {
    score += 55;
    reasons.push(`Vừa thua ${streak} lệnh liên tiếp`);
    revenge = true;
  } else if (streak === 3) {
    score += 40;
    reasons.push("Vừa thua 3 lệnh liên tiếp");
    revenge = true;
  } else if (streak === 2) {
    score += 25;
    reasons.push("Vừa thua 2 lệnh liên tiếp");
    revenge = true;
  }

  // 2. Rapid re-entry right after a loss → impulsive/revenge.
  const lastClosed = closed[0];
  if (lastClosed && pnlOf(lastClosed) < 0) {
    const gapMin = (now.getTime() - new Date(lastClosed.closedAt ?? lastClosed.enteredAt).getTime()) / 60000;
    if (gapMin >= 0 && gapMin < 2) {
      score += 30;
      reasons.push("Vào lệnh mới chưa đầy 2 phút sau một lệnh thua");
      revenge = true;
    } else if (gapMin < 10) {
      score += 18;
      reasons.push(`Vào lệnh mới chỉ ${Math.round(gapMin)} phút sau một lệnh thua`);
      revenge = true;
    } else if (gapMin < 30) {
      score += 8;
      reasons.push("Vào lệnh lại khá nhanh sau một lệnh thua");
    }
  }

  // 3. Overtrading today → FOMO/loss of patience.
  const today = now.toDateString();
  const tradesToday = trades.filter((t) => {
    const d = new Date(t.enteredAt);
    return !isNaN(d.getTime()) && d.toDateString() === today;
  }).length;
  if (tradesToday >= 6) {
    score += 28;
    reasons.push(`Đã ${tradesToday} lệnh trong hôm nay`);
    fomo = true;
  } else if (tradesToday === 5) {
    score += 18;
    reasons.push("Đã 5 lệnh trong hôm nay");
    fomo = true;
  } else if (tradesToday === 4) {
    score += 10;
    reasons.push("Đã 4 lệnh trong hôm nay");
  }

  // 4. Risk-size spike vs the trader's own average → loss of control.
  const risks = trades.map((t) => t.riskAmount).filter((r) => r > 0);
  if (currentRisk > 0 && risks.length >= 3) {
    const avg = risks.reduce((a, b) => a + b, 0) / risks.length;
    const ratio = avg > 0 ? currentRisk / avg : 0;
    if (ratio >= 2) {
      score += 25;
      reasons.push(`Risk lệnh này gấp ${ratio.toFixed(1)}× mức thường lệ`);
      fomo = true;
    } else if (ratio >= 1.5) {
      score += 15;
      reasons.push(`Risk lệnh này cao hơn ~${Math.round((ratio - 1) * 100)}% mức thường lệ`);
      fomo = true;
    }
  }

  // 5. Recent discipline overrides → already trading emotionally.
  const recentByEntry = trades
    .slice()
    .sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime())
    .slice(0, 6);
  const overrides = recentByEntry.filter((t) => t.followedChecklist === false || t.withinDailyLimit === false).length;
  if (overrides >= 2) {
    score += 15;
    reasons.push(`${overrides} lệnh gần đây bỏ qua kỷ luật`);
  } else if (overrides === 1) {
    score += 7;
  }

  // 6. Odd hours (local 0–5h) → fatigue.
  const hour = now.getHours();
  if (hour >= 0 && hour <= 5) {
    score += 10;
    reasons.push(`Đang giao dịch lúc ${hour}h — dễ mất tỉnh táo`);
  }

  score = Math.min(100, Math.round(score));

  let level: TiltLevel = "calm";
  let label = "Bình tĩnh";
  let tone: TiltAssessment["tone"] = "pos";
  if (score >= 55) {
    level = "high";
    label = "Nguy cơ cao";
    tone = "neg";
  } else if (score >= 25) {
    level = "caution";
    label = "Thận trọng";
    tone = "warn";
  }

  const suggestedEmotion: Emotion | null =
    level === "calm" ? null : revenge ? "revenge" : fomo ? "fomo" : "excited";

  return { score, level, label, tone, reasons, suggestedEmotion };
}
