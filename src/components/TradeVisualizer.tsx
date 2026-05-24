import React from 'react';
import { TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';

interface TradeVisualizerProps {
  assetClass: 'forex' | 'crypto_stock';
  entryPrice?: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  stopLossPips?: number;
  potentialProfit?: number;
  riskAmount: number;
}

export default function TradeVisualizer({
  assetClass,
  entryPrice = 0,
  stopLossPrice = 0,
  takeProfitPrice = 0,
  stopLossPips = 0,
  potentialProfit = 0,
  riskAmount = 0
}: TradeVisualizerProps) {

  if (assetClass === 'forex') {
    return (
      <div id="trade-visualizer-container" className="bg-[#14171F] rounded-2xl p-5 border border-slate-800/80 flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-450 mb-3.5">Tỷ lệ Kế hoạch Trade (Forex)</span>
        
        <div className="flex flex-col gap-3.5 relative py-2">
          <div className="h-2.5 bg-[#1C212D] rounded-full overflow-hidden flex border border-slate-850">
            <div className="bg-rose-500/80 h-full" style={{ width: '40%' }}></div>
            <div className="bg-emerald-500/80 h-full" style={{ width: '60%' }}></div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs mt-1">
            <div className="bg-[#1C212D] p-3 rounded-xl border border-slate-800">
              <span className="block text-slate-500 text-[10px] font-mono uppercase mb-1">Khoảng dừng lỗ</span>
              <span className="font-extrabold text-rose-450 text-sm font-mono">{stopLossPips} pips</span>
              <span className="block text-slate-400 text-[10px] mt-1">Sự thâm hụt: -{riskAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })} $</span>
            </div>

            <div className="bg-[#1C212D] p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="block text-slate-500 text-[10px] font-mono uppercase mb-1">Chiến thuật</span>
                <span className="font-bold text-slate-200 text-xs">Vào lệnh chính xác</span>
              </div>
              <span className="text-slate-400 text-[10px] mt-1 leading-snug">R/R tối ưu</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stock / Crypto Visualization
  const entry = parseFloat(entryPrice.toString()) || 0;
  const sl = parseFloat(stopLossPrice.toString()) || 0;
  const tp = parseFloat(takeProfitPrice.toString()) || 0;

  const hasSetup = entry > 0 && sl > 0;
  if (!hasSetup) {
    return (
      <div id="trade-visualizer-placeholder" className="bg-[#14171F] rounded-2xl p-6 border border-slate-800/80 flex flex-col items-center justify-center text-center h-48 border-dashed">
        <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
          Hãy điền đầy đủ thông tin Giá Entry và Giá Stop Loss để giả lập sơ đồ biến động giá.
        </p>
      </div>
    );
  }

  const isLong = entry > sl;
  const priceDiff = Math.abs(entry - sl);
  const targetDiff = tp > 0 ? Math.abs(tp - entry) : 0;
  const rrRatio = priceDiff > 0 ? (targetDiff / priceDiff) : 0;

  // Visual bar height proportions
  // We'll give Stop Loss area 100px base, and Take Profit area proportional based on R:R (capped min 40px max 180px)
  let tpHeight = 0;
  let slHeight = 80; // default constant size for stoploss

  if (tp > 0) {
    if (rrRatio > 0) {
      tpHeight = Math.min(Math.max((rrRatio * slHeight), 40), 160);
    } else {
      tpHeight = 0;
    }
  }

  return (
    <div id="trade-visualizer-active" className="bg-[#14171F] rounded-2xl p-5 border border-slate-800/80 flex flex-col">
      <div className="flex items-center justify-between mb-4.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-450">Giả lập biên độ Lệnh</span>
        <div className={`p-1 px-2.5 rounded-md text-[10px] font-semibold flex items-center gap-1.5 border ${
          isLong ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/50' : 'text-rose-400 bg-rose-950/25 border-rose-900/50'
        }`}>
          {isLong ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span>{isLong ? 'MUA (LONG)' : 'BÁN (SHORT)'}</span>
        </div>
      </div>

      {/* Interactive visual slider stack */}
      <div className="flex gap-4 items-stretch h-52">
        <div className="flex-1 flex flex-col select-none relative bg-[#1C212D] border border-slate-800 rounded-xl overflow-hidden shadow-inner">
          {isLong ? (
            /* Long Structure (TP at top, SL at bottom) */
            <div className="flex flex-col h-full">
              {/* Take Profit Area */}
              {tp > 0 ? (
                <div 
                  className="bg-emerald-500/10 border-b border-dashed border-emerald-500/40 flex flex-col justify-center px-4 transition-all"
                  style={{ height: `${(tpHeight / (tpHeight + slHeight + 20)) * 105}%` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-wide">TAKE PROFIT</span>
                    <span className="text-xs font-bold text-emerald-300 font-mono">{tp.toLocaleString('en-US')}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 font-mono mt-1">
                    +{potentialProfit ? potentialProfit.toLocaleString('en-US', { maximumFractionDigits: 1 }) : 0} $
                  </span>
                </div>
              ) : (
                <div className="flex-1 bg-[#1C212D] border-b border-dashed border-slate-800/80 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-slate-550 italic">Chưa nhập Take Profit</span>
                </div>
              )}

              {/* Entry Price Ribbon */}
              <div className="h-8 bg-indigo-600 flex items-center justify-between px-4 text-white font-mono text-[11px] font-extrabold z-10 shadow-md">
                <span className="tracking-wide">ENTRY PRICE</span>
                <span>{entry.toLocaleString('en-US')}</span>
              </div>

              {/* Stop Loss Area */}
              <div 
                className="bg-rose-500/10 border-t border-dashed border-rose-500/40 flex flex-col justify-center px-4 transition-all"
                style={{ height: `${(slHeight / (tpHeight + slHeight + 20)) * 105}%` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-rose-400 font-mono tracking-wide">STOP LOSS</span>
                  <span className="text-xs font-bold text-rose-300 font-mono">{sl.toLocaleString('en-US')}</span>
                </div>
                <span className="text-[10px] font-bold text-rose-450 font-mono mt-1">
                  -{riskAmount.toLocaleString('en-US', { maximumFractionDigits: 1 })} $
                </span>
              </div>
            </div>
          ) : (
            /* Short Structure (SL at top, TP at bottom) */
            <div className="flex flex-col h-full">
              {/* Stop Loss Area (Top of Short) */}
              <div 
                className="bg-rose-500/10 border-b border-dashed border-rose-500/40 flex flex-col justify-center px-4 transition-all"
                style={{ height: `${(slHeight / (tpHeight + slHeight + 20)) * 105}%` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-rose-400 font-mono tracking-wide">STOP LOSS</span>
                  <span className="text-xs font-bold text-rose-300 font-mono">{sl.toLocaleString('en-US')}</span>
                </div>
                <span className="text-[10px] font-bold text-rose-455 font-mono mt-1">
                  -{riskAmount.toLocaleString('en-US', { maximumFractionDigits: 1 })} $
                </span>
              </div>

              {/* Entry Price Ribbon */}
              <div className="h-8 bg-indigo-600 flex items-center justify-between px-4 text-white font-mono text-[11px] font-extrabold z-10 shadow-md">
                <span className="tracking-wide">ENTRY PRICE</span>
                <span>{entry.toLocaleString('en-US')}</span>
              </div>

              {/* Take Profit Area (Bottom of Short) */}
              {tp > 0 ? (
                <div 
                  className="bg-emerald-500/10 border-t border-dashed border-emerald-500/40 flex flex-col justify-center px-4 transition-all"
                  style={{ height: `${(tpHeight / (tpHeight + slHeight + 20)) * 105}%` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-wide">TAKE PROFIT</span>
                    <span className="text-xs font-bold text-emerald-300 font-mono">{tp.toLocaleString('en-US')}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 font-mono mt-1">
                    +{potentialProfit ? potentialProfit.toLocaleString('en-US', { maximumFractionDigits: 1 }) : 0} $
                  </span>
                </div>
              ) : (
                <div className="flex-1 bg-[#1C212D] border-t border-dashed border-slate-800/80 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-slate-550 italic">Chưa nhập Take Profit</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info stats column on real-time visualizer details */}
        {tp > 0 && rrRatio > 0 && (
          <div className="w-1/3 flex flex-col justify-between bg-[#1C212D] border border-slate-800 p-3 rounded-xl">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wide">Risk/Reward</span>
              <span className="text-xl font-black font-mono text-white mt-1">1 : {rrRatio.toFixed(2)}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>Rủi ro:</span>
                <span className="font-bold text-rose-400">1.00</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>Lợi nhuận:</span>
                <span className="font-bold text-emerald-400">{rrRatio.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-2 text-[9px] text-slate-400 leading-normal">
              {rrRatio >= 2 ? (
                <span className="text-emerald-400/90 font-medium font-sans">Kế hoạch tốt! Tỷ lệ R:R hợp lý (≥ 1:2).</span>
              ) : (
                <span className="text-amber-400/90 font-medium font-sans">R:R hơi thấp (&lt; 1:2). Cân nhắc nâng chặn lời.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
