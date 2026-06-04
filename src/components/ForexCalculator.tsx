import React from 'react';
import { ForexPairConfig, TradeSetup } from '../types';
import { FOREX_PAIRS, DEFAULT_FOREX_PRICES } from '../utils/calculator';
import { Info, HelpCircle } from 'lucide-react';

interface ForexCalculatorProps {
  setup: TradeSetup;
  onChangeSetup: (updater: Partial<TradeSetup>) => void;
}

export default function ForexCalculator({ setup, onChangeSetup }: ForexCalculatorProps) {
  const selectedPairSymbol = setup.forexPair || FOREX_PAIRS[0].symbol;
  const currentPair = FOREX_PAIRS.find(p => p.symbol === selectedPairSymbol) || FOREX_PAIRS[0];

  const handlePairChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const symbol = e.target.value;
    const pair = FOREX_PAIRS.find(p => p.symbol === symbol) || FOREX_PAIRS[0];
    onChangeSetup({
      forexPair: symbol,
      // reset custom pip value to the selected pair's default when pair is updated
      pipValueUSD: pair.defaultPipValueUSD,
      entryPrice: DEFAULT_FOREX_PRICES[symbol] || 1.0852,
    });
  };

  const handleNumChange = (field: keyof TradeSetup, value: string) => {
    const parsed = value === '' ? undefined : Math.max(0, parseFloat(value) || 0);
    onChangeSetup({ [field]: parsed });
  };

  return (
    <div className="space-y-4">
      {/* Forex Pair */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Cặp Tiền Tệ</span>
          <span className="text-[10px] text-slate-500 font-mono font-medium lowercase">
            1 Lot = {currentPair.standardLotUnits.toLocaleString()} units
          </span>
        </label>
        <select
          id="forex-pair-select"
          value={selectedPairSymbol}
          onChange={handlePairChange}
          className="w-full bg-[#1C212D] border border-slate-700 hover:border-slate-600 px-3.5 py-3 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:border-indigo-500 transition duration-150 cursor-pointer"
        >
          {FOREX_PAIRS.map((pair) => (
            <option key={pair.symbol} value={pair.symbol} className="bg-[#14171F] text-slate-200">
              {pair.symbol} (Mặc định ${pair.defaultPipValueUSD}/lot)
            </option>
          ))}
        </select>
      </div>

      {/* Entry Price */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Giá Điểm Vào (Entry Price)
        </label>
        <input
          id="input-forex-entry-price"
          type="number"
          step="any"
          min="0"
          value={setup.entryPrice !== undefined ? setup.entryPrice : ''}
          onChange={(e) => handleNumChange('entryPrice', e.target.value)}
          placeholder={`VD: ${DEFAULT_FOREX_PRICES[selectedPairSymbol] || '1.0852'}`}
          className="w-full bg-[#1C212D] border border-slate-700 hover:border-slate-600 font-mono text-xs font-semibold text-white px-3.5 py-3 rounded-xl focus:outline-hidden focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Stop Loss Pips */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1">
            Mức Stop Loss (Pips)
            <span className="group relative cursor-help text-slate-500 hover:text-slate-400">
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-930 text-slate-300 text-[10px] rounded-lg shadow-xl hidden group-hover:block z-50 leading-relaxed border border-slate-800">
                Chỉ số bước nhảy tối thiểu của cặp tỷ giá (Pip). VD: EURUSD dừng lỗ 50 pips.
              </span>
            </span>
          </span>
        </label>
        <input
          id="input-sl-pips"
          type="number"
          min="1"
          max="5000"
          value={setup.stopLossPips || 10}
          onChange={(e) => onChangeSetup({ stopLossPips: Math.max(1, parseInt(e.target.value) || 0) })}
          className="w-full bg-[#1C212D] border border-slate-700 hover:border-slate-600 font-mono text-xs font-semibold text-white px-3.5 py-3 rounded-xl focus:outline-hidden focus:border-indigo-500 transition"
        />
      </div>

      {/* Target Take Profit Pips */}
      <div>
        <label className="block text-xs font-semibold text-emerald-450 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1">
            Mức Take Profit (Pips)
            <span className="text-[10px] text-slate-550 font-sans font-medium lowercase">
              (Tùy chọn)
            </span>
          </span>
        </label>
        <input
          id="input-tp-pips"
          type="number"
          min="0"
          max="10000"
          placeholder="VD: 150 pips (bỏ trống nếu chưa tính)"
          value={setup.takeProfitPips !== undefined ? setup.takeProfitPips : ''}
          onChange={(e) => {
            const val = e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value) || 0);
            onChangeSetup({ takeProfitPips: val });
          }}
          className="w-full bg-[#1C212D] border border-slate-700 hover:border-slate-600 font-mono text-xs font-semibold text-white px-3.5 py-3 rounded-xl focus:outline-hidden focus:border-indigo-500 transition"
        />

        {/* Preset R:R buttons */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mr-1">Chốt Lời nhanh theo R:R:</span>
          {[2, 3, 5, 10].map((ratio) => {
            const slPips = setup.stopLossPips || 10;
            const targetPips = slPips * ratio;
            const isSelected = setup.takeProfitPips === targetPips;
            return (
              <button
                key={ratio}
                type="button"
                onClick={() => onChangeSetup({ takeProfitPips: targetPips })}
                className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg border transition ${
                  isSelected 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-450' 
                    : 'bg-[#1C212D]/60 border-slate-700 text-slate-450 hover:text-white hover:border-slate-600'
                }`}
              >
                1:{ratio} ({targetPips} pips)
              </button>
            );
          })}
          {setup.takeProfitPips !== undefined && (
            <button
              type="button"
              onClick={() => onChangeSetup({ takeProfitPips: undefined })}
              className="px-2 py-1 text-[10px] font-mono font-bold rounded-lg border bg-[#1C212D]/60 border-rose-900/30 text-rose-450 hover:bg-rose-500/10 cursor-pointer transition"
            >
              Xóa TP
            </button>
          )}
        </div>
      </div>

      {/* Pip Value Customization */}
      <div className="bg-[#1C212D]/40 rounded-xl p-3 border border-slate-800/80">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <span className="block text-[11px] font-semibold text-slate-300">Giá trị Pip ước tính ($)</span>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
              Dựa trên tài khoản gốc USD. Đối với các cặp chéo hoặc tài khoản khác, bạn có thể chỉnh sửa giá trị Pip cho 1 standard lot (100.000 units) để có độ chính xác tuyệt đối.
            </p>
          </div>
        </div>

        <div className="mt-3.5 pt-3.5 border-t border-slate-800/50 flex items-center justify-between gap-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Pip Value ($ / Lot):</span>
          <input
            id="input-pip-value"
            type="number"
            step="0.01"
            min="0.1"
            max="1000"
            value={setup.pipValueUSD !== undefined ? setup.pipValueUSD : currentPair.defaultPipValueUSD}
            onChange={(e) => onChangeSetup({ pipValueUSD: Math.max(0.1, parseFloat(e.target.value) || 0) })}
            className="w-28 bg-[#1C212D] border border-slate-700 hover:border-slate-650 font-mono text-xs font-bold text-right px-2.5 py-1.5 rounded-lg text-white focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}
