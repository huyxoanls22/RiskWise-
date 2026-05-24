import React, { useState } from 'react';
import { ChecklistItem } from '../types';
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Info,
  ShieldCheck,
  CheckSquare,
  Square
} from 'lucide-react';

interface PreTradeChecklistProps {
  items: ChecklistItem[];
  onToggleCheck: (id: string) => void;
  onAddItem: (text: string, isRequired: boolean) => void;
  onDeleteItem: (id: string) => void;
}

export default function PreTradeChecklist({
  items,
  onToggleCheck,
  onAddItem,
  onDeleteItem
}: PreTradeChecklistProps) {
  const [newItemText, setNewItemText] = useState('');
  const [newIsRequired, setNewIsRequired] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    onAddItem(newItemText.trim(), newIsRequired);
    setNewItemText('');
  };

  const totalRequired = items.filter(i => i.isRequired).length;
  const checkedRequired = items.filter(i => i.isRequired && i.isChecked).length;
  const isSafeToTrade = checkedRequired === totalRequired;

  return (
    <div id="pre-trade-checklist-card" className="bg-[#14171F] rounded-2xl p-5 border border-slate-800/80 shadow-md">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <h2 className="font-bold text-slate-100 text-sm sm:text-base uppercase tracking-wide">
            Checklist Trước Vào Lệnh
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
            isSafeToTrade 
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40' 
              : 'bg-amber-950/40 text-amber-400 border-amber-900/40'
          }`}>
            {checkedRequired}/{totalRequired} Bắt buộc
          </span>
        </div>
      </div>

      {/* Safety Alert Warning */}
      <div className={`mb-4 p-3 rounded-xl border transition-all duration-300 ${
        isSafeToTrade 
          ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' 
          : 'bg-amber-950/20 border-amber-900/40 text-amber-400 animate-pulse'
      }`}>
        <div className="flex gap-2">
          {isSafeToTrade ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
          )}
          <div className="flex-1 text-[11px] leading-normal font-sans">
            <span className="font-bold block">
              {isSafeToTrade ? 'Đủ điều kiện kỷ luật!' : 'CẢNH BÁO: Chưa đủ điều kiện!'}
            </span>
            <p className="mt-0.5 opacity-85">
              {isSafeToTrade 
                ? 'Tất cả các tiêu chí bắt buộc đã được xác nhận. Vị thế của bạn có độ tin cậy và tuân thủ kỷ luật cao.' 
                : `Còn ${totalRequired - checkedRequired} tiêu chí bắt buộc chưa được kiểm tra. Việc vào lệnh lúc này mang tính rủi ro cao.`}
            </p>
          </div>
        </div>
      </div>

      {/* Checklist items list */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {items.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl bg-[#1C212D]/10">
            <p className="text-xs text-slate-500">Chưa cấu hình quy tắc checklist nào.</p>
          </div>
        ) : (
          items.map((item) => (
            <div 
              key={item.id} 
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                item.isChecked 
                  ? 'bg-[#1C212D]/40 border-slate-800/80' 
                  : 'bg-[#1C212D]/20 border-slate-850 hover:bg-[#1C212D]/30'
              }`}
            >
              <button 
                type="button"
                onClick={() => onToggleCheck(item.id)}
                className="flex items-center gap-2.5 flex-1 text-left cursor-pointer select-none"
              >
                {item.isChecked ? (
                  <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-550 hover:text-slate-400 shrink-0" />
                )}
                <span className={`text-xs font-medium font-sans ${
                  item.isChecked ? 'text-slate-400 line-through' : 'text-slate-200'
                }`}>
                  {item.text}
                </span>
                {item.isRequired && (
                  <span className="text-[8px] bg-rose-950/40 border border-rose-900/40 text-rose-400 font-bold px-1.5 py-0.2 rounded shrink-0">
                    BẮT BUỘC
                  </span>
                )}
              </button>

              <button
                type="button"
                title="Xóa điều kiện"
                onClick={() => onDeleteItem(item.id)}
                className="p-1 px-[5px] text-slate-600 hover:text-rose-450 hover:bg-slate-800/50 rounded-md border border-transparent hover:border-slate-800 transition duration-150 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Checklist Item Form */}
      <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono">
          Thêm tiêu chí giao dịch mới
        </label>
        <div className="flex gap-2">
          <input
            id="input-new-checklist-text"
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Ví dụ: Đã kiểm tra lịch tin tức..."
            maxLength={60}
            className="flex-1 bg-[#1C212D] border border-slate-700 hover:border-slate-650 text-xs px-3 py-2 rounded-xl text-white focus:outline-hidden focus:border-indigo-500 font-sans"
          />
          <button
            type="submit"
            className="px-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 select-none pl-1">
          <input
            type="checkbox"
            id="checkbox-new-item-is-required"
            checked={newIsRequired}
            onChange={(e) => setNewIsRequired(e.target.checked)}
            className="w-3 h-3 cursor-pointer accent-indigo-505"
          />
          <label 
            htmlFor="checkbox-new-item-is-required" 
            className="text-[10px] text-slate-400 font-semibold cursor-pointer"
          >
            Bắt buộc phải tích trước khi đăng nhập lệnh
          </label>
        </div>
      </form>
    </div>
  );
}
