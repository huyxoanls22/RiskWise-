import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import { fmtMoney } from "../lib/format";

interface Props {
  riskAmount: number;
  riskPercentage: number;
  currency?: string;
}

interface Band {
  color: string;
  stroke: string;
  label: string;
  advice: string;
  Icon: typeof ShieldCheck;
}

function bandFor(pct: number): Band {
  if (pct <= 0)
    return {
      color: "text-faint",
      stroke: "rgb(var(--border))",
      label: "Chưa thiết lập",
      advice: "Nhập số vốn và mức rủi ro để đánh giá.",
      Icon: ShieldCheck,
    };
  if (pct <= 2)
    return {
      color: "text-pos",
      stroke: "rgb(var(--pos))",
      label: "Ngưỡng chuẩn (khuyên dùng)",
      advice: "Mức rủi ro được hầu hết quỹ chuyên nghiệp dùng để bảo toàn vốn dài hạn.",
      Icon: ShieldCheck,
    };
  if (pct <= 4)
    return {
      color: "text-warn",
      stroke: "rgb(var(--warn))",
      label: "Rủi ro trung bình",
      advice: "Hơi cao — chỉ nên dùng cho các lệnh có xác suất thắng cao.",
      Icon: AlertTriangle,
    };
  if (pct <= 7)
    return {
      color: "text-orange-400",
      stroke: "#fb923c",
      label: "Rủi ro cao",
      advice: "Chuỗi 10 lệnh thua liên tiếp có thể bốc hơi 40–50% tài khoản.",
      Icon: ShieldAlert,
    };
  return {
    color: "text-neg",
    stroke: "rgb(var(--neg))",
    label: "Cực kỳ nguy hiểm",
    advice: "Nguy cơ cháy tài khoản rất cao. Hãy giảm khối lượng ngay.",
    Icon: ShieldAlert,
  };
}

export default function RiskMeter({ riskAmount, riskPercentage, currency = "USD" }: Props) {
  const band = bandFor(riskPercentage);
  const visual = Math.min(Math.max(riskPercentage, 0), 10);
  const radius = 50;
  const circumference = Math.PI * radius;
  const offset = circumference - (visual / 10) * circumference;
  const Icon = band.Icon;

  return (
    <div className="card flex flex-col items-center p-5">
      <div className="mb-2 flex w-full items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">Đánh giá rủi ro</span>
        <span className={`flex items-center gap-1 text-xs font-semibold ${band.color}`}>
          <Icon className="h-3.5 w-3.5" />
          {band.label}
        </span>
      </div>

      <div className="relative flex h-28 w-full items-center justify-center">
        <svg className="h-24 w-48 overflow-visible" viewBox="0 0 120 60">
          <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="rgb(var(--surface-2))" strokeWidth="10" strokeLinecap="round" />
          {visual > 0 && (
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke={band.stroke}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.7s ease, stroke 0.3s ease" }}
            />
          )}
        </svg>
        <div className="absolute top-9 flex flex-col items-center">
          <span className="num text-3xl font-black text-text">{riskPercentage.toFixed(2)}%</span>
          <span className="num mt-0.5 text-[11px] text-muted">-{fmtMoney(riskAmount, currency)}</span>
        </div>
      </div>

      <div className="mt-1 flex w-full justify-between border-t border-border pt-3 text-[9px] text-faint num">
        <span>0%</span>
        <span>2%</span>
        <span>5%</span>
        <span>10%+</span>
      </div>

      <p className="inset mt-4 rounded-xl p-3 text-center text-xs leading-relaxed text-muted">{band.advice}</p>
    </div>
  );
}
