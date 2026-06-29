import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Brain, TrendingUp, Lightbulb, Activity } from "lucide-react";
import { useSelector } from "../store/store";
import { computeStats, equityCurve, emotionBreakdown, buildInsights, computeDisciplineScore } from "../lib/analytics";
import { Card, StatCard, EmptyState, Badge } from "../components/ui";
import { fmtMoney, fmtPct, fmtNum } from "../lib/format";
import { EMOTION_META } from "../lib/types";
import DisciplineScore from "../components/DisciplineScore";

const POS = "#3DDC97";
const NEG = "#FB7185";
const BRAND = "#3DDC97";

export default function Journal() {
  const trades = useSelector((d) => d.trades);
  const stats = useMemo(() => computeStats(trades), [trades]);
  const curve = useMemo(() => equityCurve(trades), [trades]);
  const emotions = useMemo(() => emotionBreakdown(trades), [trades]);
  const insights = useMemo(() => buildInsights(stats, emotions), [stats, emotions]);
  const discipline = useMemo(() => computeDisciplineScore(trades), [trades]);

  if (stats.total === 0) {
    return (
      <EmptyState
        icon={<Brain className="h-10 w-10" />}
        title="Chưa có dữ liệu phân tích"
        description="Đóng một vài vị thế trong tab Danh mục để hệ thống phân tích kỷ luật và hiệu suất của bạn."
      />
    );
  }

  const pfText = stats.profitFactor === null ? "∞" : fmtNum(stats.profitFactor, 2);

  return (
    <div className="space-y-5">
      <DisciplineScore data={discipline} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Tổng lệnh" value={stats.total} />
        <StatCard label="Win rate" value={fmtPct(stats.winRate, 1)} tone={stats.winRate >= 50 ? "pos" : "neg"} />
        <StatCard label="Profit Factor" value={pfText} tone={stats.profitFactor !== null && stats.profitFactor >= 1 ? "pos" : "neg"} />
        <StatCard label="PnL ròng" value={fmtMoney(stats.netPnl)} tone={stats.netPnl >= 0 ? "pos" : "neg"} />
        <StatCard label="Kỳ vọng/lệnh" value={fmtMoney(stats.expectancy)} tone={stats.expectancy >= 0 ? "pos" : "neg"} />
        <StatCard label="Tuân thủ KL" value={fmtPct(stats.disciplineRate, 0)} tone={stats.disciplineRate >= 70 ? "pos" : "warn"} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
            <TrendingUp className="h-4 w-4" /> Đường cong vốn (Equity Curve)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curve} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="i" tick={{ fontSize: 11, fill: "currentColor" }} className="text-faint" />
                <YAxis tick={{ fontSize: 11, fill: "currentColor" }} className="text-faint" />
                <Tooltip
                  contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [fmtMoney(Number(v)), "Luỹ kế"]}
                />
                <Line type="monotone" dataKey="cumulative" stroke={BRAND} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
            <Activity className="h-4 w-4" /> Streak & Extremes
          </h3>
          <div className="space-y-3">
            <StatCard label="Chuỗi thắng dài nhất" value={stats.maxWinStreak} tone="pos" />
            <StatCard label="Chuỗi thua dài nhất" value={stats.maxLossStreak} tone="neg" />
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Lệnh tốt nhất" value={fmtMoney(stats.bestTrade)} tone="pos" />
              <StatCard label="Lệnh tệ nhất" value={fmtMoney(stats.worstTrade)} tone="neg" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted">PnL theo tâm lý</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotions} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "currentColor" }} className="text-faint" />
                <YAxis tick={{ fontSize: 11, fill: "currentColor" }} className="text-faint" />
                <Tooltip
                  contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [fmtMoney(Number(v)), "PnL ròng"]}
                />
                <Bar dataKey="netPnl" radius={[6, 6, 0, 0]}>
                  {emotions.map((e) => (
                    <Cell key={e.emotion} fill={e.netPnl >= 0 ? POS : NEG} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1.5">
            {emotions.map((e) => (
              <div key={e.emotion} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted">
                  <span className="h-2 w-2 rounded-full" style={{ background: EMOTION_META[e.emotion].color }} />
                  {e.label}
                </span>
                <span className="flex items-center gap-2">
                  <Badge tone={e.winRate >= 50 ? "pos" : "neg"}>{fmtPct(e.winRate, 0)} WR</Badge>
                  <span className={e.netPnl >= 0 ? "text-pos num" : "text-neg num"}>{fmtMoney(e.netPnl)}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
            <Lightbulb className="h-4 w-4 text-brand" /> Nhận định hành vi (Expert System)
          </h3>
          <ul className="space-y-3">
            {insights.map((ins, i) => (
              <li key={i} className="inset flex gap-3 rounded-xl p-3 text-sm text-text">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[11px] font-bold text-brand">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{ins}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
