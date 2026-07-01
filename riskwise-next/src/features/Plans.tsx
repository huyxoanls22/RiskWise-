import { useState } from "react";
import { ClipboardList, Plus, Trash2, Star, Target } from "lucide-react";
import { useSelector } from "../store/store";
import { actions } from "../store/actions";
import { Card, Field, TextInput, Textarea, NumberInput, Select, Segmented, Button, Badge, EmptyState } from "../components/ui";
import { useToast } from "../components/Toast";
import { fmtNum, fmtDate, clsx } from "../lib/format";
import type { AssetClass, Direction, TradingPlan } from "../lib/types";

const TIMEFRAMES = ["M5", "M15", "M30", "H1", "H4", "D1", "W1"];
const STATUS: Record<TradingPlan["status"], { label: string; tone: "neutral" | "pos" | "neg" | "warn" }> = {
  pending: { label: "Chờ vào", tone: "warn" },
  executed: { label: "Đã vào", tone: "pos" },
  cancelled: { label: "Đã huỷ", tone: "neg" },
};

function blankForm() {
  return {
    title: "",
    ticker: "",
    assetClass: "forex" as AssetClass,
    direction: "long" as Direction,
    entryPrice: 0,
    stopLossPrice: 0,
    takeProfitPrice: 0,
    timeframe: "H4",
    conviction: 3,
    notes: "",
  };
}

export default function Plans() {
  const plans = useSelector((d) => d.plans);
  const [form, setForm] = useState(blankForm());
  const [open, setOpen] = useState(false);
  const toast = useToast();

  const submit = () => {
    if (!form.title.trim() || !form.ticker.trim()) {
      toast("Nhập tiêu đề và mã giao dịch.", "error");
      return;
    }
    actions.addPlan({ ...form, takeProfitPrice: form.takeProfitPrice || undefined });
    setForm(blankForm());
    setOpen(false);
    toast("Đã tạo kế hoạch giao dịch.");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-serif text-xl text-text">
          <ClipboardList className="h-5 w-5 text-brand" /> Kế hoạch giao dịch
        </h2>
        <Button onClick={() => setOpen((v) => !v)}>
          <Plus className="h-4 w-4" /> Kế hoạch mới
        </Button>
      </div>

      {open && (
        <Card className="animate-fade-in">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tiêu đề">
              <TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="VD: EURUSD breakout H4" />
            </Field>
            <Field label="Mã (ticker)">
              <TextInput value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })} placeholder="EUR/USD" />
            </Field>
            <Field label="Loại tài sản">
              <Segmented
                value={form.assetClass}
                onChange={(v) => setForm({ ...form, assetClass: v })}
                options={[
                  { value: "forex", label: "Forex" },
                  { value: "crypto_stock", label: "Crypto/CK" },
                ]}
              />
            </Field>
            <Field label="Hướng">
              <Segmented
                value={form.direction}
                onChange={(v) => setForm({ ...form, direction: v })}
                options={[
                  { value: "long", label: "Long" },
                  { value: "short", label: "Short" },
                ]}
              />
            </Field>
            <Field label="Giá vào">
              <NumberInput value={form.entryPrice} onValue={(n) => setForm({ ...form, entryPrice: n })} />
            </Field>
            <Field label="Khung thời gian">
              <Select value={form.timeframe} onChange={(v) => setForm({ ...form, timeframe: v })} options={TIMEFRAMES.map((t) => ({ value: t, label: t }))} />
            </Field>
            <Field label="Cắt lỗ (SL)">
              <NumberInput value={form.stopLossPrice} onValue={(n) => setForm({ ...form, stopLossPrice: n })} />
            </Field>
            <Field label="Chốt lời (TP)">
              <NumberInput value={form.takeProfitPrice} onValue={(n) => setForm({ ...form, takeProfitPrice: n })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Mức tự tin">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setForm({ ...form, conviction: n })} aria-label={`conviction ${n}`}>
                      <Star className={clsx("h-6 w-6", n <= form.conviction ? "fill-brand text-brand" : "text-faint")} />
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Ghi chú / luận điểm">
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Vì sao đây là cơ hội tốt? Điều kiện vào lệnh…"
                />
              </Field>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Huỷ</Button>
            <Button onClick={submit}>Lưu kế hoạch</Button>
          </div>
        </Card>
      )}

      {plans.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="Chưa có kế hoạch"
          description="Lập kế hoạch trước khi thị trường mở cửa để giao dịch có kỷ luật, không theo cảm xúc."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {plans.map((p) => (
            <Card key={p.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text">{p.title}</span>
                    <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
                  </div>
                  <p className="text-[11px] text-faint">
                    {p.ticker} · {p.timeframe} · {p.direction.toUpperCase()} · {fmtDate(p.createdAt)}
                  </p>
                </div>
                <button onClick={() => actions.deletePlan(p.id)} className="text-faint hover:text-neg" aria-label="delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex gap-4 text-xs text-muted">
                <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5" /> Vào {fmtNum(p.entryPrice, 4)}</span>
                <span className="text-neg">SL {fmtNum(p.stopLossPrice, 4)}</span>
                {p.takeProfitPrice ? <span className="text-pos">TP {fmtNum(p.takeProfitPrice, 4)}</span> : null}
              </div>

              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={clsx("h-3.5 w-3.5", n <= p.conviction ? "fill-brand text-brand" : "text-faint")} />
                ))}
              </div>

              {p.notes && <p className="inset rounded-lg p-2.5 text-xs text-muted">{p.notes}</p>}

              {p.status === "pending" && (
                <div className="flex gap-2">
                  <Button variant="pos" className="flex-1 px-2 py-1.5 text-xs" onClick={() => actions.updatePlan(p.id, { status: "executed" })}>
                    Đánh dấu đã vào
                  </Button>
                  <Button variant="danger" className="flex-1 px-2 py-1.5 text-xs" onClick={() => actions.updatePlan(p.id, { status: "cancelled" })}>
                    Huỷ
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
