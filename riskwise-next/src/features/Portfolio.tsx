import { useMemo } from "react";
import { Briefcase, Trash2, CheckCircle2, TrendingUp, TrendingDown, History, PieChart, AlertTriangle } from "lucide-react";
import { useSelector } from "../store/store";
import { actions } from "../store/actions";
import { floatingPnl } from "../lib/calculator";
import { sectorExposure } from "../lib/analytics";
import { Card, StatCard, Badge, Button, EmptyState, NumberInput } from "../components/ui";
import { useToast } from "../components/Toast";
import { fmtMoney, fmtNum, fmtPct, fmtDate, clsx } from "../lib/format";
import { SECTORS, SECTOR_CONCENTRATION_WARN } from "../lib/types";
import type { PortfolioTrade } from "../lib/types";

function ActiveRow({ t }: { t: PortfolioTrade }) {
  const toast = useToast();
  const pnl = floatingPnl(t.direction, t.entryPrice, t.currentPrice, t.units);
  const pnlTone = pnl > 0 ? "text-pos" : pnl < 0 ? "text-neg" : "text-muted";

  return (
    <div className="inset rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-text">{t.ticker}</span>
            <Badge tone={t.direction === "long" ? "pos" : "neg"}>
              {t.direction === "long" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {t.direction.toUpperCase()}
            </Badge>
            {!t.followedChecklist && <Badge tone="warn">Bỏ qua checklist</Badge>}
          </div>
          <p className="mt-1 text-[11px] text-faint">
            {fmtNum(t.units, 4)} units · Rủi ro {fmtMoney(t.riskAmount)} · {fmtDate(t.enteredAt)}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-[10px] uppercase text-faint">Ngành</span>
            <select
              value={t.sector ?? ""}
              onChange={(e) => actions.updateTrade(t.id, { sector: e.target.value || undefined })}
              className="cursor-pointer rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] text-text outline-none focus:border-brand/60"
            >
              <option value="">— Chưa phân loại —</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="text-right">
          <div className={clsx("figure text-lg", pnlTone)}>
            {pnl >= 0 ? "+" : ""}
            {fmtMoney(pnl)}
          </div>
          <div className="text-[11px] text-faint">PnL tạm tính</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 items-end gap-3 sm:grid-cols-4">
        <div>
          <div className="text-[10px] uppercase text-faint">Giá vào</div>
          <div className="num text-sm text-text">{fmtNum(t.entryPrice, 4)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-faint">SL</div>
          <div className="num text-sm text-neg">{fmtNum(Number(t.stopLoss), 4)}</div>
        </div>
        <div>
          <label className="text-[10px] uppercase text-faint">Giá hiện tại</label>
          <NumberInput
            value={t.currentPrice}
            onValue={(n) => actions.updateTrade(t.id, { currentPrice: n })}
            className="mt-0.5 px-2 py-1 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="pos"
            className="flex-1 px-2 py-1.5 text-xs"
            onClick={() => {
              actions.closeTrade(t.id, t.currentPrice);
              toast("Đã đóng vị thế.");
            }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Đóng
          </Button>
          <button onClick={() => actions.deleteTrade(t.id)} className="text-faint hover:text-neg" aria-label="delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ClosedRow({ t }: { t: PortfolioTrade }) {
  const pnl = t.realizedPnl ?? 0;
  return (
    <div className="inset flex items-center justify-between rounded-xl p-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text">{t.ticker}</span>
          <Badge tone={pnl >= 0 ? "pos" : "neg"}>{pnl >= 0 ? "Thắng" : "Thua"}</Badge>
        </div>
        <p className="text-[11px] text-faint">{fmtDate(t.closedAt ?? t.enteredAt)}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={clsx("figure", pnl >= 0 ? "text-pos" : "text-neg")}>
          {pnl >= 0 ? "+" : ""}
          {fmtMoney(pnl)}
        </span>
        <button onClick={() => actions.deleteTrade(t.id)} className="text-faint hover:text-neg" aria-label="delete">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SectorExposureCard({ trades }: { trades: PortfolioTrade[] }) {
  const exposure = useMemo(() => sectorExposure(trades), [trades]);
  if (exposure.length === 0) return null;

  const top = exposure[0];
  const concentrated = exposure.length > 1 && top.riskPct >= SECTOR_CONCENTRATION_WARN;

  return (
    <Card>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
        <PieChart className="h-4 w-4" /> Phân bổ rủi ro theo ngành
      </h3>

      {/* Highlight: the sector holding the most open risk */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-brand/30 bg-brand/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-brand" />
          <span className="text-sm text-text">
            Tập trung lớn nhất: <span className="font-semibold">{top.sector}</span>
          </span>
        </div>
        <span className="figure text-lg text-brand">{fmtPct(top.riskPct, 0)}</span>
      </div>

      {concentrated && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs text-warn">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Danh mục đang dồn <span className="font-semibold">{fmtPct(top.riskPct, 0)}</span> rủi ro vào ngành{" "}
            <span className="font-semibold">{top.sector}</span>. Cân nhắc đa dạng hoá để giảm rủi ro theo ngành.
          </span>
        </div>
      )}

      <div className="space-y-3">
        {exposure.map((s, i) => {
          const isTop = i === 0;
          return (
            <div key={s.sector}>
              <div className="mb-1 flex items-center justify-between gap-2 text-[13px]">
                <span className={clsx("flex items-center gap-2", isTop ? "font-semibold text-text" : "text-muted")}>
                  {s.sector}
                  {isTop && <Badge tone="brand">Lớn nhất</Badge>}
                  <span className="text-[11px] text-faint">· {s.count} lệnh</span>
                </span>
                <span className="num shrink-0 text-text">
                  {fmtMoney(s.riskAmount)} · {fmtPct(s.riskPct, 0)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(s.riskPct, 2)}%`,
                    background: isTop ? "rgb(var(--brand))" : "rgb(var(--border-strong))",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function Portfolio() {
  const trades = useSelector((d) => d.trades);
  const active = trades.filter((t) => t.status === "active");
  const closed = trades.filter((t) => t.status !== "active");

  const totals = useMemo(() => {
    const floating = active.reduce((s, t) => s + floatingPnl(t.direction, t.entryPrice, t.currentPrice, t.units), 0);
    const realized = closed.reduce((s, t) => s + (t.realizedPnl ?? 0), 0);
    const atRisk = active.reduce((s, t) => s + t.riskAmount, 0);
    return { floating, realized, atRisk };
  }, [active, closed]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Vị thế mở" value={active.length} tone="brand" />
        <StatCard label="Tổng rủi ro đang mở" value={fmtMoney(totals.atRisk)} tone="neg" />
        <StatCard label="PnL tạm tính" value={fmtMoney(totals.floating)} tone={totals.floating >= 0 ? "pos" : "neg"} />
        <StatCard label="PnL đã chốt" value={fmtMoney(totals.realized)} tone={totals.realized >= 0 ? "pos" : "neg"} />
      </div>

      {active.length > 0 && <SectorExposureCard trades={active} />}

      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
          <Briefcase className="h-4 w-4" /> Vị thế đang mở ({active.length})
        </h3>
        {active.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-8 w-8" />}
            title="Chưa có vị thế nào"
            description="Dùng tab Tính toán để tạo và thêm vị thế vào danh mục theo dõi."
          />
        ) : (
          <div className="space-y-3">
            {active.map((t) => (
              <ActiveRow key={t.id} t={t} />
            ))}
          </div>
        )}
      </Card>

      {closed.length > 0 && (
        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
            <History className="h-4 w-4" /> Lịch sử đã đóng ({closed.length})
          </h3>
          <div className="space-y-2">
            {closed.map((t) => (
              <ClosedRow key={t.id} t={t} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
