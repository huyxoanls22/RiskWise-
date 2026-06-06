import React from 'react';
import { TradeSetup } from '../types';
import { HelpCircle } from 'lucide-react';

interface CryptoStockCalculatorProps {
  setup: TradeSetup;
  onChangeSetup: (updater: Partial<TradeSetup>) => void;
}

export default function CryptoStockCalculator({ setup, onChangeSetup }: CryptoStockCalculatorProps) {
  const handleNumChange = (field: keyof TradeSetup, value: string) => {
    const parsed = value === '' ? undefined : Math.max(0, parseFloat(value) || 0);
    onChangeSetup({ [field]: parsed });
  };

  return (
    <div className="space-y-4">
      {/* Ticker & Sector Grid */}
      <div className="grid grid-cols-2 gap-3 pb-1 border-b border-slate-800/50">
        <div>
          <label htmlFor="input-ticker-name" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Mã Ticker / Symbol
          </label>
          <input
            id="input-ticker-name"
            type="text"
            value={setup.name || ''}
            onChange={(e) => onChangeSetup({ name: e.target.value })}
            onBlur={(e) => onChangeSetup({ name: e.target.value.toUpperCase() })}
            placeholder="VD: BTC, TSLA"
            className="w-full bg-[#1C212D] border border-slate-700 hover:border-slate-600 font-mono text-xs font-bold text-white px-3 py-2.5 rounded-xl focus:outline-hidden focus:border-indigo-500 transition-colors uppercase"
          />
        </div>

        <div>
          <label htmlFor="input-sector-name" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Nhóm Ngành / Sector
          </label>
          <div className="relative">
            <input
              id="input-sector-name"
              type="text"
              value={setup.sector || ''}
              onChange={(e) => onChangeSetup({ sector: e.target.value })}
              placeholder="VD: Công nghệ, Y tế"
              list="sector-suggestions"
              className="w-full bg-[#1C212D] border border-slate-700 hover:border-slate-600 text-xs font-semibold text-white px-3 py-2.5 rounded-xl focus:outline-hidden focus:border-indigo-500 transition-colors"
            />
            <datalist id="sector-suggestions">
              <option value="Công nghệ" />
              <option value="Tài chính" />
              <option value="Y tế" />
              <option value="Tiền mã hóa" />
              <option value="Năng lượng" />
              <option value="Bất động sản" />
              <option value="Hàng tiêu dùng" />
              <option value="Sản xuất công nghiệp" />
            </datalist>
          </div>
        </div>
      </div>

      {/* Entry Price */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Giá Điểm Vào (Entry Price)</span>
        </label>
        <div className="relative">
          <input
            id="input-entry-price"
            type="number"
            step="any"
            min="0"
            value={setup.entryPrice !== undefined ? setup.entryPrice : ''}
            onChange={(e) => handleNumChange('entryPrice', e.target.value)}
            placeholder="VD: 64281 hòn 150"
            className="w-full bg-[#1C212D] border border-slate-700 hover:border-slate-600 font-mono text-xs font-semibold text-white px-3.5 py-3 rounded-xl focus:outline-hidden focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Stop Loss Price */}
      <div>
        <label className="block text-xs font-semibold text-rose-450 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1">
            Giá Dừng Lỗ (Stop Loss)
            <span className="group relative cursor-help text-slate-500 hover:text-slate-400">
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-930 text-slate-300 text-[10px] rounded-lg shadow-xl hidden group-hover:block z-50 leading-relaxed border border-slate-800">
                Lệnh sẽ tự động đóng tại giá này để ngăn chặn thua lỗ thêm.
              </span>
            </span>
          </span>
        </label>
        <input
          id="input-sl-price"
          type="number"
          step="any"
          min="0"
          value={setup.stopLossPrice !== undefined ? setup.stopLossPrice : ''}
          onChange={(e) => handleNumChange('stopLossPrice', e.target.value)}
          placeholder="VD: 63500 hoặc 145"
          className="w-full bg-[#1C212D] border border-rose-900/50 hover:border-rose-800/80 font-mono text-xs font-semibold text-rose-100 px-3.5 py-3 rounded-xl focus:outline-hidden focus:border-rose-500 transition-colors"
        />
      </div>

      {/* Take Profit Price */}
      <div>
        <label className="block text-xs font-semibold text-emerald-450 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1">
            Giá Chốt Lời (Take Profit)
            <span className="text-[10px] text-slate-500 font-sans font-medium lowercase">
              (Tùy chọn)
            </span>
          </span>
        </label>
        <input
          id="input-tp-price"
          type="number"
          step="any"
          min="0"
          value={setup.takeProfitPrice !== undefined ? setup.takeProfitPrice : ''}
          onChange={(e) => handleNumChange('takeProfitPrice', e.target.value)}
          placeholder="VD: 65843 hoặc 160"
          className="w-full bg-[#1C212D] border border-emerald-900/40 hover:border-emerald-800/80 font-mono text-xs font-semibold text-emerald-100 px-3.5 py-3 rounded-xl focus:outline-hidden focus:border-emerald-500 transition-colors"
        />

        {/* Preset R:R buttons for Crypto/Stock */}
        <div className="mt-2.5">
          {!setup.entryPrice || !setup.stopLossPrice ? (
            <p className="text-[10px] text-slate-500 italic">
              * Hãy chọn Giá Vào & Dừng Lỗ bên trên để tính nhanh Chốt Lời theo R:R.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mr-1">Chốt Lời nhanh theo R:R:</span>
              {[2, 3, 5, 10].map((ratio) => {
                const entry = setup.entryPrice || 0;
                const sl = setup.stopLossPrice || 0;
                const diff = Math.abs(entry - sl);
                const direction = setup.direction || 'long';
                
                const calculatedTp = direction === 'long' 
                  ? entry + (diff * ratio) 
                  : entry - (diff * ratio);
                  
                if (calculatedTp <= 0) return null; // Can't have a negative or 0 TP price for long/short assets
                
                // Helper to format precision value cleanly
                const formatPrecision = (num: number) => {
                  if (num < 0.1) return parseFloat(num.toFixed(6));
                  if (num < 1) return parseFloat(num.toFixed(5));
                  if (num < 10) return parseFloat(num.toFixed(4));
                  if (num < 100) return parseFloat(num.toFixed(3));
                  if (num < 100000) return parseFloat(num.toFixed(2));
                  return parseFloat(num.toFixed(1));
                };

                const finalTp = formatPrecision(calculatedTp);
                
                const isSelected = setup.takeProfitPrice !== undefined && 
                  Math.abs(setup.takeProfitPrice - finalTp) < 0.0001;
                
                return (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => onChangeSetup({ takeProfitPrice: finalTp })}
                    className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg border transition ${
                      isSelected 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-450' 
                        : 'bg-[#1C212D]/60 border-slate-700 text-slate-450 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    1:{ratio} (${finalTp.toLocaleString('en-US', { maximumFractionDigits: 6 })})
                  </button>
                );
              })}
              
              {setup.takeProfitPrice !== undefined && (
                <button
                  type="button"
                  onClick={() => onChangeSetup({ takeProfitPrice: undefined })}
                  className="px-2 py-1 text-[10px] font-mono font-bold rounded-lg border bg-[#1C212D]/60 border-rose-900/30 text-rose-450 hover:bg-rose-500/10 cursor-pointer transition"
                >
                  Xóa TP
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
