import React, { useState } from 'react';
import { TradingPlan, AssetClass } from '../types';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Star, 
  ArrowRight, 
  Settings, 
  Play, 
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface TradingPlanManagerProps {
  plans: TradingPlan[];
  onAddPlan: (plan: Omit<TradingPlan, 'id' | 'createdAt'>) => void;
  onDeletePlan: (id: string) => void;
  onUpdatePlanStatus: (id: string, status: 'pending' | 'executed' | 'cancelled') => void;
  onImportPlanToCalc: (plan: TradingPlan) => void;
}

export default function TradingPlanManager({
  plans,
  onAddPlan,
  onDeletePlan,
  onUpdatePlanStatus,
  onImportPlanToCalc
}: TradingPlanManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [ticker, setTicker] = useState('');
  const [assetClass, setAssetClass] = useState<AssetClass>('forex');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [timeframe, setTimeframe] = useState('H1');
  const [conviction, setConviction] = useState(3);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !ticker.trim()) return;

    onAddPlan({
      title: title.trim(),
      ticker: ticker.trim().toUpperCase(),
      assetClass,
      direction,
      entryPrice: parseFloat(entryPrice) || 0,
      stopLossPrice: parseFloat(stopLossPrice) || 0,
      takeProfitPrice: takeProfitPrice ? parseFloat(takeProfitPrice) : undefined,
      timeframe,
      conviction,
      notes: notes.trim(),
      status: 'pending'
    });

    // Reset form
    setTitle('');
    setTicker('');
    setEntryPrice('');
    setStopLossPrice('');
    setTakeProfitPrice('');
    setNotes('');
    setShowAddForm(false);
  };

  return (
    <div id="trading-plan-manager" className="space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white uppercase tracking-wide flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Nhật ký Kế hoạch Giao dịch
          </h2>
          <p className="text-[11px] text-slate-450 mt-1">Xây dựng chiến lược rõ ràng, kỷ luật trước khi mạo hiểm đồng vốn.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          {showAddForm ? 'Đóng form' : 'Tạo kế hoạch mới'}
          <Plus className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* Add Plan Form Overlay / Box */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-[#14171F] border border-slate-800/90 rounded-2xl p-5 space-y-4 animate-fadeIn">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-805/80 pb-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Chi tiết Kế hoạch Giao dịch
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Title / Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Tên Kế hoạch</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: EURUSD Breakout đáy"
                className="w-full bg-[#1C212D] border border-slate-700 hover:border-slate-650 text-xs px-3 py-2.5 rounded-xl text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Ticker Symbol */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Cặp tiền / Cổ phiếu</label>
              <input
                type="text"
                required
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="VD: EUR/USD, BTCUSD, AAPL"
                className="w-full bg-[#1C212D] border border-slate-700 hover:border-slate-650 text-xs px-3 py-2.5 rounded-xl text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Asset Class */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Phân khúc tài sản</label>
              <select
                value={assetClass}
                onChange={(e) => setAssetClass(e.target.value as AssetClass)}
                className="w-full bg-[#1C212D] border border-slate-700 text-xs px-3 py-2.5 rounded-xl text-white focus:outline-hidden focus:border-indigo-500"
              >
                <option value="forex">Forex (Ngoại hối)</option>
                <option value="crypto_stock">Crypto & Stocks (Tiền số & Chứng khoán)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Direction */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Chiều giao dịch</label>
              <div className="grid grid-cols-2 gap-1 bg-[#1C212D] p-0.5 rounded-xl border border-slate-750">
                <button
                  type="button"
                  onClick={() => setDirection('long')}
                  className={`py-1.5 rounded-lg text-[10px] font-bold transition ${
                    direction === 'long' ? 'bg-emerald-600 text-white' : 'text-slate-450 hover:text-slate-200'
                  }`}
                >
                  Mua (Long)
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('short')}
                  className={`py-1.5 rounded-lg text-[10px] font-bold transition ${
                    direction === 'short' ? 'bg-rose-600 text-white' : 'text-slate-450 hover:text-slate-200'
                  }`}
                >
                  Bán (Short)
                </button>
              </div>
            </div>

            {/* Entry Target */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Mức giá Vào (Entry)</label>
              <input
                type="number"
                step="any"
                required
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="VD: 1.0850"
                className="w-full bg-[#1C212D] border border-slate-700 hover:border-slate-650 text-xs px-3 py-2.5 rounded-xl text-white font-mono"
              />
            </div>

            {/* SL */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Cắt lỗ (Stop Loss)</label>
              <input
                type="number"
                step="any"
                required
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(e.target.value)}
                placeholder="VD: 1.0820"
                className="w-full bg-[#1C212D] border border-slate-700 hover:border-slate-650 text-xs px-3 py-2.5 rounded-xl text-white font-mono"
              />
            </div>

            {/* TP */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Chốt lời (Take Profit)</label>
              <input
                type="number"
                step="any"
                value={takeProfitPrice}
                onChange={(e) => setTakeProfitPrice(e.target.value)}
                placeholder="VD: 1.0910"
                className="w-full bg-[#1C212D] border border-slate-700 hover:border-slate-650 text-xs px-3 py-2.5 rounded-xl text-white font-mono"
              />
            </div>

            {/* Timeframe */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Khung thời gian (TF)</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full bg-[#1C212D] border border-slate-700 text-xs px-3 py-2.5 rounded-xl text-white font-mono focus:outline-hidden focus:border-indigo-500"
              >
                <option value="M5">M5 (5 phút)</option>
                <option value="M15">M15 (15 phút)</option>
                <option value="H1">H1 (1 giờ)</option>
                <option value="H4">H4 (4 giờ)</option>
                <option value="D1">D1 (1 ngày)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Conviction Stars */}
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Mức độ tự tin (Conviction)</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setConviction(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-115 text-yellow-500"
                  >
                    <Star className={`w-5 h-5 ${star <= conviction ? 'fill-yellow-500' : 'text-slate-600'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Strategy notes */}
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Ghi chú &amp; Phân tích chiến lược</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Mô hình vai đầu vai nghịch, breakout kênh tăng xu hướng phụ..."
                className="w-full bg-[#1C212D] border border-slate-700 hover:border-slate-650 text-xs px-3 py-2.5 rounded-xl text-white"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-805/40">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-350 text-xs font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold cursor-pointer transition-all"
            >
              Lưu Kế hoạch
            </button>
          </div>
        </form>
      )}

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.length === 0 ? (
          <div className="md:col-span-2 text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-[#14171F]/40">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Bạn chưa lập kế hoạch giao dịch nào.</p>
            <p className="text-[10px] text-slate-600 mt-1">Một kế hoạch chi tiết giúp giảm 80% lỗi giao dịch theo cảm tính.</p>
          </div>
        ) : (
          plans.map((p) => {
            const formattedDate = new Date(p.createdAt).toLocaleDateString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: 'numeric',
              month: 'short'
            });

            return (
              <div 
                key={p.id} 
                className="bg-[#14171F] border border-slate-800/80 rounded-2xl p-4.5 flex flex-col justify-between hover:border-slate-700/80 transition shadow-sm relative overflow-hidden"
              >
                {/* Visual side accent */}
                <div className={`absolute top-0 left-0 w-1 h-full ${p.direction === 'long' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase border ${
                          p.direction === 'long' 
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' 
                            : 'bg-rose-950/40 text-rose-400 border-rose-900/30'
                        }`}>
                          {p.direction === 'long' ? 'Mua (Long)' : 'Bán (Short)'}
                        </span>
                        <span className="text-[9px] bg-slate-800/50 border border-slate-705 text-slate-400 px-1.5 py-0.5 rounded font-mono font-semibold">
                          TF: {p.timeframe}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-400 font-mono tracking-wide">{p.ticker}</span>
                      </div>
                      <h4 className="font-bold text-slate-200 text-xs sm:text-sm mt-2 truncate w-[220px]" title={p.title}>
                        {p.title}
                      </h4>
                    </div>

                    <div className="flex bg-[#1C212D] border border-slate-800/60 p-0.5 rounded text-[10px] font-bold font-mono">
                      <span className={`px-1.5 py-0.5 rounded-sm uppercase ${
                        p.status === 'pending' ? 'bg-[#0B0E14] text-amber-400 font-bold' : 
                        p.status === 'executed' ? 'bg-emerald-950/30 text-emerald-400' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {p.status === 'pending' ? 'Chờ' : p.status === 'executed' ? 'Đã khớp' : 'Hủy'}
                      </span>
                    </div>
                  </div>

                  {/* Pricing specs */}
                  <div className="mt-3.5 bg-[#1C212D]/60 p-2.5 rounded-xl border border-slate-805/50 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider block">Target Entry</span>
                      <span className="text-xs font-bold text-slate-300 font-mono block mt-0.5">{p.entryPrice}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider block">Stop Loss</span>
                      <span className="text-xs font-bold text-rose-450 font-mono block mt-0.5">{p.stopLossPrice}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider block">Take Profit</span>
                      <span className="text-xs font-bold text-emerald-450 font-mono block mt-0.5">{p.takeProfitPrice || '---'}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {p.notes && (
                    <p className="mt-3 text-[11px] text-slate-400 font-sans italic line-clamp-2">
                      "{p.notes}"
                    </p>
                  )}
                </div>

                {/* Footer and Interactive load */}
                <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-slate-550 font-mono block">{formattedDate}</span>
                    <span className="mx-1 text-slate-700 text-[9px]">•</span>
                    <div className="flex items-center text-yellow-500">
                      {Array.from({ length: p.conviction }).map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-current" />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    {/* Status update buttons */}
                    {p.status === 'pending' && (
                      <>
                        <button
                          title="Chuyển sang Đã kích hoạt"
                          onClick={() => onUpdatePlanStatus(p.id, 'executed')}
                          className="px-2 py-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-350 bg-emerald-950/20 border border-emerald-900/40 rounded-lg hover:bg-emerald-950/40 transition duration-150 cursor-pointer"
                        >
                          Đã khớp
                        </button>
                        <button
                          title="Hủy kế hoạch"
                          onClick={() => onUpdatePlanStatus(p.id, 'cancelled')}
                          className="px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-350 bg-slate-800 border border-transparent rounded-lg hover:bg-slate-705 transition duration-150 cursor-pointer"
                        >
                          Hủy
                        </button>
                      </>
                    )}

                    {/* Import to calculator */}
                    <button
                      onClick={() => onImportPlanToCalc(p)}
                      title="Nạp vào Bộ tính toán"
                      className="px-2.5 py-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-950/30 border border-indigo-900/40 rounded-lg hover:bg-indigo-950/50 hover:border-indigo-850 transition duration-150 flex items-center gap-1 cursor-pointer font-sans"
                    >
                      <span>Tính toán</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDeletePlan(p.id)}
                      title="Xóa kế hoạch"
                      className="p-1 px-[5px] text-slate-600 hover:text-rose-450 hover:bg-slate-800/40 rounded-lg border border-transparent hover:border-slate-800 transition duration-150"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
