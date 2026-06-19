import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle, ShieldAlert, ShieldCheck } from 'lucide-react';

interface RiskMeterProps {
  balance: number;
  riskAmount: number;
  riskPercentage: number;
  style?: React.CSSProperties;
}

export default function RiskMeter({ balance, riskAmount, riskPercentage, style }: RiskMeterProps) {
  // Clamp percentage between 0 and 100 for visual gauge
  const visualPct = Math.min(Math.max(riskPercentage, 0), 10); // Standard gauge clamps visually up to 10%

  let statusColor = 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50';
  let gaugeColor = 'stroke-emerald-500';
  let riskLabel = 'Rủi ro thấp (An toàn)';
  let advice = 'Mức rủi ro tuyệt vời! Quản trị vốn xuất sắc giúp bạn sống sót lâu dài trong thị trường.';
  let Icon = ShieldCheck;

  if (riskPercentage <= 0) {
    statusColor = 'text-slate-500 bg-slate-900/40 border-slate-800';
    gaugeColor = 'stroke-slate-700';
    riskLabel = 'Chưa thiết lập';
    advice = 'Hãy nhập số vốn và mức rủi ro để đánh giá.';
    Icon = CheckCircle;
  } else if (riskPercentage > 1 && riskPercentage <= 2) {
    statusColor = 'text-emerald-450 bg-emerald-950/20 border-emerald-900/50';
    gaugeColor = 'stroke-emerald-500';
    riskLabel = 'Ngưỡng Chuẩn (Khuyên dùng)';
    advice = 'Khoảng rủi ro tốt được hầu hết các quỹ chuyên nghiệp lựa chọn để bảo toàn vốn.';
    Icon = ShieldCheck;
  } else if (riskPercentage > 2 && riskPercentage <= 4) {
    statusColor = 'text-amber-450 bg-amber-950/20 border-amber-900/50';
    gaugeColor = 'stroke-amber-500';
    riskLabel = 'Rủi ro Trung bình';
    advice = 'Mức rủi ro hơi cao. Chỉ nên áp dụng đối với các giao dịch có độ xác suất thắng cực lớn.';
    Icon = AlertTriangle;
  } else if (riskPercentage > 4 && riskPercentage <= 7) {
    statusColor = 'text-orange-450 bg-orange-950/25 border-orange-900/50';
    gaugeColor = 'stroke-orange-500';
    riskLabel = 'Rủi ro Cao';
    advice = 'Mức rủi ro đáng báo động! Chỉ cần chuỗi thua lỗ 10 lệnh liên tiếp, bạn sẽ mất hơn 40-50% tài khoản.';
    Icon = ShieldAlert;
  } else if (riskPercentage > 7) {
    statusColor = 'text-rose-450 bg-rose-950/25 border-rose-900/50';
    gaugeColor = 'stroke-rose-500';
    riskLabel = 'Cực kỳ Nguy hiểm (Over-risk)';
    advice = 'Nguy cơ Sụp đổ Tài lý (Ruin Probability)! Bạn đang đặt cược số tài sản quá lớn, rất dễ cháy tài khoản.';
    Icon = ShieldAlert;
  }

  // Stroke arithmetic for SVG semi circle
  const radius = 50;
  const circumference = Math.PI * radius; // 157.08 for semicircle
  const strokeDashoffset = circumference - (Math.min(visualPct, 10) / 10) * circumference;

  return (
    <div id="risk-meter-container" className="bg-[#14171F] rounded-2xl p-5 border border-slate-800/80 flex flex-col items-center w-full" style={style}>
      <div className="w-full flex items-center justify-between mb-4 gap-2 flex-nowrap overflow-hidden">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-450 whitespace-nowrap shrink-0">Đánh giá rủi ro</span>
        <div className={`px-2 py-0.5 rounded-full border text-[10px] sm:text-xs font-semibold flex items-center gap-1 shrink-0 whitespace-nowrap max-w-[60%] overflow-hidden ${statusColor}`}>
          <Icon className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{riskLabel}</span>
        </div>
      </div>

      <div className="relative flex items-center justify-center w-full h-32 mt-2">
        {/* SVG Semi-Circle Gauge */}
        <svg className="w-48 h-24 overflow-visible" viewBox="0 0 120 60">
          {/* Background rail */}
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke="#1C212D"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Active progress */}
          {visualPct > 0 && (
            <motion.path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              className={gaugeColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          )}
        </svg>

        {/* Value overlay */}
        <div className="absolute top-10 flex flex-col items-center justify-center">
          <span className="text-3xl font-black font-mono tracking-tight text-white">
            {riskPercentage.toFixed(2)}%
          </span>
          <span className="text-[11px] font-mono text-slate-400 mt-1">
            -{riskAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })} $
          </span>
        </div>
      </div>

      <div className="w-full flex justify-between text-[9px] font-mono text-slate-500 border-t border-slate-800 pt-3">
        <span>0% (An toàn)</span>
        <span>2% (Tối ưu)</span>
        <span>5% (Cao)</span>
        <span>10%+ (Cháy)</span>
      </div>

      <p className="text-xs text-slate-300 mt-4 leading-relaxed text-center bg-[#1C212D] p-3.5 rounded-xl border border-slate-800 shadow-sm">
        {advice}
      </p>
    </div>
  );
}
