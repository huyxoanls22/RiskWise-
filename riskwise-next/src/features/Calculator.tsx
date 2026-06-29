import { useMemo, useState } from "react";
import { Calculator as CalcIcon, TrendingUp, TrendingDown, PlusCircle, AlertTriangle } from "lucide-react";
import { useSelector } from "../store/store";
import { actions } from "../store/actions";
import { calculatePositionSize, riskAmountOf } from "../lib/calculator";
import { FOREX_PAIRS } from "../lib/forex";
import { EMOTIONS } from "../lib/types";
import type { Emotion } from "../lib/types";
import { Card, Field, NumberInput, TextInput, Select, Segmented, Button, StatCard, Badge } from "../components/ui";
import { useToast } from "../components/Toast";
import { fmtMoney, fmtNum } from "../lib/format";
import RiskMeter from "../components/RiskMeter";
import Checklist from "./Checklist";
import SavedSetups from "./SavedSetups";

export default function Calculator() {
  const setup = useSelector((d) => d.setup);
  const checklist = useSelector((d) => d.checklist);
  const toast = useToast();
  const [cryptoTicker, setCryptoTicker] = useState("BTC/USDT");
  const [emotion, setEmotion] = useState<Emotion>("calm");

  const result = useMemo(() => calculatePositionSize(setup), [setup]);
  const riskAmount = riskAmountOf(setup);
  const riskPct = setup.accountBalance > 0 ? (riskAmount / setup.accountBalance) * 100 : 0;
  const isForex = setup.assetClass === "forex";

  const requiredItems = checklist.filter((c) => c.isRequired);
  const requiredDone = requiredItems.filter((c) => c.isChecked).length;
  const checklistComplete = requiredItems.length === 0 || requiredDone === requiredItems.length;

  const rr = result.riskRewardRatio;
  const rrTone = rr === undefined ? "neutral" : rr >= 2 ? "pos" : rr >= 1 ? "warn" : "neg";

  const addToPortfolio = () => {
    if (result.positionSizeUnits <= 0) {
      toast("Chưa đủ dữ liệu để mở vị thế.", "error");
      return;
    }
    const ticker = isForex ? setup.forexPair : cryptoTicker.trim() || "—";
    const entry = isForex ? 0 : setup.entryPrice;
    const stop = isForex ? 0 : setup.stopLossPrice;
    const tp = isForex ? 0 : setup.takeProfitPrice;
    actions.addTrade({
      ticker,
      assetClass: setup.assetClass,
      direction: setup.direction,
      entryPrice: entry,
      currentPrice: entry,
      units: result.positionSizeUnits,
      lots: result.positionSizeLots,
      riskAmount: result.riskAmount,
      stopLoss: stop,
      takeProfit: tp || undefined,
      emotion,
      followedChecklist: checklistComplete,
    });
    toast(checklistComplete ? "Đã thêm vị thế vào danh mục." : "Đã thêm — nhưng checklist chưa đủ điều kiện!", checklistComplete ? "success" : "info");
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Inputs */}
      <div className="space-y-5 lg:col-span-7">
        <Card>
          <h2 className="mb-5 flex items-center gap-2 text-base font-black text-text">
            <CalcIcon className="h-5 w-5 text-brand" /> Tính khối lượng vị thế
          </h2>

          <div className="space-y-4">
            <Segmented
              value={setup.assetClass}
              onChange={(v) => actions.patchSetup({ assetClass: v as typeof setup.assetClass })}
              options={[
                { value: "forex", label: "Forex / Vàng" },
                { value: "crypto_stock", label: "Crypto / Chứng khoán" },
              ]}
            />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Hướng lệnh">
                <Segmented
                  value={setup.direction}
                  onChange={(v) => actions.patchSetup({ direction: v as typeof setup.direction })}
                  options={[
                    { value: "long", label: "Long" },
                    { value: "short", label: "Short" },
                  ]}
                />
              </Field>
              <Field label="Đòn bẩy (leverage)" hint="Dùng để ước tính ký quỹ">
                <NumberInput value={setup.leverage} onValue={(n) => actions.patchSetup({ leverage: n })} min={1} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Số dư tài khoản">
                <NumberInput value={setup.accountBalance} onValue={(n) => actions.patchSetup({ accountBalance: n })} min={0} />
              </Field>
              <Field label="Loại tiền">
                <TextInput
                  value={setup.accountCurrency}
                  onChange={(e) => actions.patchSetup({ accountCurrency: e.target.value.toUpperCase().slice(0, 4) })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Kiểu rủi ro">
                <Segmented
                  value={setup.riskType}
                  onChange={(v) => actions.patchSetup({ riskType: v as typeof setup.riskType })}
                  options={[
                    { value: "percentage", label: "% tài khoản" },
                    { value: "amount", label: "Số tiền" },
                  ]}
                />
              </Field>
              <Field label={setup.riskType === "percentage" ? "Rủi ro (%)" : "Rủi ro ($)"}>
                <NumberInput value={setup.riskValue} onValue={(n) => actions.patchSetup({ riskValue: n })} min={0} step={0.1} />
              </Field>
            </div>

            {isForex ? (
              <>
                <Field label="Cặp tiền">
                  <Select
                    value={setup.forexPair}
                    onChange={(v) => actions.patchSetup({ forexPair: v })}
                    options={FOREX_PAIRS.map((p) => ({ value: p.symbol, label: p.symbol }))}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Stop loss (pips)">
                    <NumberInput value={setup.stopLossPips} onValue={(n) => actions.patchSetup({ stopLossPips: n })} min={0} />
                  </Field>
                  <Field label="Take profit (pips)">
                    <NumberInput value={setup.takeProfitPips} onValue={(n) => actions.patchSetup({ takeProfitPips: n })} min={0} />
                  </Field>
                </div>
              </>
            ) : (
              <>
                <Field label="Mã (ticker)">
                  <TextInput value={cryptoTicker} onChange={(e) => setCryptoTicker(e.target.value)} placeholder="VD: BTC/USDT, AAPL" />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Giá vào">
                    <NumberInput value={setup.entryPrice} onValue={(n) => actions.patchSetup({ entryPrice: n })} min={0} />
                  </Field>
                  <Field label="Cắt lỗ (SL)">
                    <NumberInput value={setup.stopLossPrice} onValue={(n) => actions.patchSetup({ stopLossPrice: n })} min={0} />
                  </Field>
                  <Field label="Chốt lời (TP)">
                    <NumberInput value={setup.takeProfitPrice} onValue={(n) => actions.patchSetup({ takeProfitPrice: n })} min={0} />
                  </Field>
                </div>
              </>
            )}

            <Field label="Tâm lý khi vào lệnh">
              <Select value={emotion} onChange={(v) => setEmotion(v as Emotion)} options={EMOTIONS} />
            </Field>
          </div>
        </Card>

        {/* Results */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Kết quả</h3>
            <Badge tone={setup.direction === "long" ? "pos" : "neg"}>
              {setup.direction === "long" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {setup.direction.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Tiền rủi ro" value={fmtMoney(result.riskAmount, setup.accountCurrency)} tone="neg" />
            {isForex ? (
              <StatCard label="Khối lượng" value={`${fmtNum(result.positionSizeLots ?? 0, 2)} lot`} tone="brand" sub={`${fmtNum(result.positionSizeUnits, 0)} units`} />
            ) : (
              <StatCard label="Số lượng" value={fmtNum(result.positionSizeUnits, 4)} tone="brand" />
            )}
            <StatCard label="Giá trị vị thế" value={fmtMoney(result.notionalValue, setup.accountCurrency)} />
            <StatCard
              label="R : R"
              value={rr !== undefined ? `1 : ${fmtNum(rr, 2)}` : "—"}
              tone={rrTone as "pos" | "neg" | "neutral"}
            />
            <StatCard
              label="Lợi nhuận kỳ vọng"
              value={result.potentialProfit !== undefined ? fmtMoney(result.potentialProfit, setup.accountCurrency) : "—"}
              tone="pos"
            />
            <StatCard
              label="Ký quỹ cần"
              value={result.requiredMargin !== undefined ? fmtMoney(result.requiredMargin, setup.accountCurrency) : "—"}
            />
          </div>

          {rr !== undefined && rr < 1 && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-neg/30 bg-neg/10 p-3 text-xs text-neg">
              <AlertTriangle className="h-4 w-4 shrink-0" /> R:R dưới 1 — phần thưởng nhỏ hơn rủi ro. Cân nhắc lại điểm chốt lời.
            </div>
          )}

          <Button className="mt-4 w-full" onClick={addToPortfolio}>
            <PlusCircle className="h-4 w-4" /> Thêm vào danh mục
          </Button>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-5 lg:col-span-5">
        <RiskMeter riskAmount={riskAmount} riskPercentage={riskPct} currency={setup.accountCurrency} />
        <Checklist />
        <SavedSetups />
      </div>
    </div>
  );
}
