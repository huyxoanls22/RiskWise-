import React, { useState } from 'react';
import { ChecklistItem, ChecklistProfile } from '../types';
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  CheckSquare, 
  Square,
  Pencil,
  Check,
  X,
  FolderOpen,
  Heart,
  Smile,
  Zap
} from 'lucide-react';

interface PreTradeChecklistProps {
  title: string;
  onUpdateTitle: (newTitle: string) => void;
  items: ChecklistItem[];
  onToggleCheck: (id: string) => void;
  onAddItem: (text: string, isRequired: boolean) => void;
  onDeleteItem: (id: string) => void;
  isPremium?: boolean;
  onTriggerPaywall?: () => void;
  profiles: ChecklistProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onCreateProfile: (title: string) => void;
  onDeleteProfile: (id: string) => void;
  // New Emotion integration props
  emotion?: 'Bình tĩnh' | 'Hưng phấn' | 'Sợ hãi' | 'FOMO' | 'Cay cú/Trả thù';
  onUpdateEmotion: (emotion: 'Bình tĩnh' | 'Hưng phấn' | 'Sợ hãi' | 'FOMO' | 'Cay cú/Trả thù') => void;
  style?: React.CSSProperties;
}

export default function PreTradeChecklist({
  title,
  onUpdateTitle,
  items,
  onToggleCheck,
  onAddItem,
  onDeleteItem,
  isPremium = false,
  onTriggerPaywall,
  profiles,
  activeProfileId,
  onSelectProfile,
  onCreateProfile,
  onDeleteProfile,
  emotion,
  onUpdateEmotion,
  style
}: PreTradeChecklistProps) {
  const [newItemText, setNewItemText] = useState('');
  const [newIsRequired, setNewIsRequired] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(title);

  // Profile creation state
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileTitle, setNewProfileTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    onAddItem(newItemText.trim(), newIsRequired);
    setNewItemText('');
  };

  const handleSaveTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editTitleValue.trim()) {
      onUpdateTitle(editTitleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const handleStartEditingTitle = () => {
    setEditTitleValue(title);
    setIsEditingTitle(true);
  };

  const handleAddNewProfileClick = () => {
    if (!isPremium && profiles.length >= 1) {
      if (onTriggerPaywall) onTriggerPaywall();
      return;
    }
    setIsCreatingProfile(true);
  };

  const emotionsList = [
    { value: 'Bình tĩnh', emoji: '🧘', label: 'Bình tĩnh', desc: 'Bình tâm, kỷ luật, đúng bài mới vào', borderClass: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400' },
    { value: 'Hưng phấn', emoji: '🔥', label: 'Hưng phấn', desc: 'Vừa thắng chuỗi, hưng phấn quá nhiều', borderClass: 'border-orange-500/40 bg-orange-950/20 text-orange-400' },
    { value: 'Sợ hãi', emoji: '😨', label: 'Sợ hãi', desc: 'Vừa dính lỗ liên tục, tâm lý rón rén', borderClass: 'border-blue-500/40 bg-blue-950/20 text-blue-400' },
    { value: 'FOMO', emoji: '🚀', label: 'FOMO', desc: 'Sợ lỡ cơ hội ngon, vào lệnh đuổi giá', borderClass: 'border-violet-500/40 bg-violet-950/20 text-violet-400' },
    { value: 'Cay cú/Trả thù', emoji: '😡', label: 'Trả thù', desc: 'Sớm trả thù sàn, muốn gỡ gạc ngay', borderClass: 'border-rose-500/40 bg-rose-950/20 text-rose-450' },
  ] as const;

  const displayedItems = items || [];

  const totalRequired = displayedItems.filter(i => i.isRequired).length;
  const checkedRequired = displayedItems.filter(i => i.isRequired && i.isChecked).length;
  const isChecklistDone = checkedRequired === totalRequired;
  
  // Both checklist is fully complete AND a valid emotion has been selected!
  const isSafeToTrade = isChecklistDone && !!emotion;

  return (
    <div id="pre-trade-checklist-card" className="bg-[#14171F] rounded-2xl p-5 border border-slate-800/80 shadow-md" style={style}>
      
      {/* Title block with edit option */}
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-850 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ShieldCheck className="w-5 h-5 text-indigo-450 shrink-0" />
          
          {isEditingTitle ? (
            <form onSubmit={handleSaveTitleSubmit} className="flex items-center gap-1.5 flex-1 min-w-0">
              <input
                id="input-checklist-title-edit"
                type="text"
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                className="bg-[#161B26] border border-indigo-500/55 text-xs px-2.5 py-1 rounded-lg text-white focus:outline-none font-bold flex-1 min-w-0"
                placeholder="Tên checklist..."
                maxLength={45}
                autoFocus
              />
              <button
                type="submit"
                title="Lưu tên"
                className="p-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg transition shrink-0 cursor-pointer flex items-center justify-center"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingTitle(false)}
                title="Hủy bỏ"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition shrink-0 cursor-pointer flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5 group min-w-0">
              <h2 className="font-bold text-slate-100 text-xs sm:text-sm uppercase tracking-wide truncate">
                {title || 'Checklist Trước Vào Lệnh'}
              </h2>
              <button
                type="button"
                onClick={handleStartEditingTitle}
                title="Sửa tên Checklist"
                className="p-1 hover:bg-slate-800/60 rounded-md text-slate-400 hover:text-white transition cursor-pointer shrink-0"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
            isChecklistDone 
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40' 
              : 'bg-amber-950/40 text-amber-400 border-amber-900/40'
          }`}>
            {checkedRequired}/{totalRequired} Bắt buộc
          </span>
        </div>
      </div>

      {/* Multi-profile Selector Pills */}
      <div className="flex flex-wrap gap-1.5 items-center mb-4 pb-3 border-b border-slate-850 font-sans">
        {profiles && profiles.map(p => (
          <div key={p.id} className="relative group/pill flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onSelectProfile(p.id)}
              className={`px-2.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1 cursor-pointer font-sans ${
                p.id === activeProfileId
                  ? 'bg-indigo-600/35 text-indigo-300 border-indigo-500/70 shadow-sm'
                  : 'bg-[#1C212D]/45 text-slate-400 border-slate-850 hover:bg-[#1C212D]/70 hover:text-slate-300'
              }`}
            >
              <FolderOpen className="w-3 h-3 text-slate-500 group-hover/pill:text-slate-350 shrink-0" />
              <span className="truncate max-w-[120px] font-sans">{p.title}</span>
            </button>
            {profiles.length > 1 && (
              <button
                type="button"
                onClick={() => onDeleteProfile(p.id)}
                title="Xóa Checklist này"
                className="p-1 text-slate-500 hover:text-rose-450 opacity-0 group-hover/pill:opacity-100 transition shrink-0 cursor-pointer absolute -top-1.5 -right-1 z-10 bg-[#14171F] rounded-full hover:bg-[#1e2535] border border-slate-800"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        ))}

        {/* Add profile trigger pill button */}
        <button
          type="button"
          onClick={handleAddNewProfileClick}
          className="px-2.5 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg border border-dashed border-slate-800 bg-[#161B26]/40 hover:bg-[#161B26]/80 text-slate-400 hover:text-slate-200 transition flex items-center gap-1 cursor-pointer select-none' font-sans"
        >
          <Plus className="w-3 h-3 text-indigo-400 shrink-0" />
          <span className="font-sans">Tạo mới</span>
          {!isPremium && (
            <span className="text-[8px] font-mono bg-amber-500/10 text-amber-500 font-extrabold px-1 border border-amber-500/20 rounded ml-0.5 uppercase tracking-wide">PRO</span>
          )}
        </button>
      </div>

      {/* Inline Form to name and create profile */}
      {isCreatingProfile && (
        <form onSubmit={(e) => {
          e.preventDefault();
          if (newProfileTitle.trim()) {
            onCreateProfile(newProfileTitle.trim());
            setNewProfileTitle('');
            setIsCreatingProfile(false);
          }
        }} className="flex items-center gap-1.5 bg-[#171B26]/80 border border-indigo-500/35 p-2 rounded-xl mb-3 shrink-0 animate-fadeIn font-sans">
          <input
            type="text"
            placeholder="Tên checklist (Ví dụ: Swing Trade...)"
            value={newProfileTitle}
            onChange={(e) => setNewProfileTitle(e.target.value)}
            className="bg-[#0f111a] border border-slate-800 text-[11px] px-2.5 py-1.5 rounded-lg text-white font-semibold flex-1 focus:outline-none focus:border-indigo-500 font-sans"
            autoFocus
            maxLength={35}
          />
          <button
            type="submit"
            className="px-2.5 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold transition shrink-0 cursor-pointer font-sans"
          >
            Lưu
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreatingProfile(false);
              setNewProfileTitle('');
            }}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-705 text-slate-300 rounded-lg text-[10px] font-bold transition shrink-0 cursor-pointer font-sans"
          >
            Hủy
          </button>
        </form>
      )}

      {/* STEP 1: INTERACTIVE EMOTIONAL SELF-ASSESSMENT (SCIENTIFIC DESIGN) */}
      <div className="mb-4 bg-[#191D28]/40 border border-slate-850 p-3.5 rounded-xl">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            BƯỚC 1: Đánh giá cảm xúc hiện tại <span className="text-rose-500 font-extrabold">*</span>
          </span>
          {emotion ? (
            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/30 px-1.5 py-0.2 rounded-sm font-sans uppercase">ĐÃ KHAI BÁO</span>
          ) : (
            <span className="text-[9px] text-rose-400 font-extrabold animate-pulse bg-rose-950/20 border border-rose-900/30 px-1.5 py-0.2 rounded-sm font-sans uppercase">CẦN CHỌN</span>
          )}
        </label>
        
        {/* Horizontal scrollable / wrap-around row of beautiful emotion nodes */}
        <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-5 gap-2 font-sans mt-2">
          {emotionsList.map((emo) => {
            const isSelected = emotion === emo.value;
            return (
              <button
                key={emo.value}
                type="button"
                onClick={() => onUpdateEmotion(emo.value)}
                className={`py-2 px-2 rounded-xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center group relative ${
                  isSelected 
                    ? `${emo.borderClass} scale-[1.02] ring-1 ring-slate-800 shadow-md` 
                    : 'bg-[#1C212D]/45 border-slate-850 hover:bg-[#1C212D]/85 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-base sm:text-lg mb-1">{emo.emoji}</span>
                <span className="text-[10px] font-extrabold tracking-tight font-sans block">{emo.label}</span>
                
                {/* Micro tooltip indicator for logical clarification */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 hidden group-hover:block bg-[#0B0E14] border border-slate-800/90 text-slate-300 text-[9px] p-2 rounded-lg shadow-xl text-center pointer-events-none z-50 leading-relaxed">
                  <span className="font-bold block mb-0.5 text-slate-100">{emo.emoji} {emo.value}</span>
                  {emo.desc}
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Small helpful guideline subtitle */}
        <p className="text-[9px] text-slate-550 font-sans mt-2.5 leading-normal select-none">
          💡 <span className="font-semibold text-slate-455">Khoa học hành vi:</span> Khai báo trung thực để nhận biết và làm chủ tâm lý trước khi giải ngân vốn giao dịch.
        </p>
      </div>

      {/* STEP 2: TECHNICAL RULES CHECKLIST */}
      <div className="mb-3.5 bg-[#191D28]/20 border border-slate-850/60 p-3.5 rounded-xl">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-2">
          BƯỚC 2: Kiểm tra Tiêu chí Kỹ luật giao dịch
        </label>
        
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 mt-2">
          {displayedItems.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl bg-[#1C212D]/10">
              <p className="text-xs text-slate-550 font-sans">Chưa cấu hình quy tắc checklist nào cho nhóm này.</p>
            </div>
          ) : (
            displayedItems.map((item) => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${
                  item.isChecked 
                    ? 'bg-[#1C212D]/40 border-slate-850/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]' 
                    : 'bg-[#1C212D]/15 border-slate-850 hover:bg-[#1C212D]/30'
                }`}
              >
                <button 
                  type="button"
                  onClick={() => onToggleCheck(item.id)}
                  className="flex items-center gap-2 flex-1 text-left cursor-pointer select-none min-w-0"
                >
                  {item.isChecked ? (
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-550 hover:text-slate-400 shrink-0" />
                  )}
                  <span className={`text-[11px] font-semibold font-sans truncate ${
                    item.isChecked ? 'text-slate-550 line-through' : 'text-slate-205'
                  }`}>
                    {item.text}
                  </span>
                  {item.isRequired && (
                    <span className="text-[7.5px] bg-rose-950/40 border border-rose-900/40 text-rose-400 font-black px-1 rounded shrink-0 uppercase tracking-widest leading-none py-0.5">
                      Bắt buộc
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  title="Xóa điều kiện"
                  onClick={() => onDeleteItem(item.id)}
                  className="p-1 text-slate-605 hover:text-rose-400 hover:bg-slate-800/40 rounded transition duration-150 shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Checklist Item Form */}
        <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 animate-fadeIn">
          <div className="flex gap-1.5">
            <input
              id="input-new-checklist-text"
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Thêm tiêu chí (Ví dụ: Chờ nến đóng cửa...)"
              maxLength={60}
              className="flex-1 bg-[#1C212D]/85 border border-slate-800 hover:border-slate-700 text-[11px] px-2.5 py-1.5 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-sans"
            />
            <button
              type="submit"
              className="px-2.5 bg-[#1C212D] border border-slate-800 hover:border-indigo-500/50 hover:text-indigo-400 text-slate-300 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 select-none pl-0.5">
            <input
              type="checkbox"
              id="checkbox-new-item-is-required"
              checked={newIsRequired}
              onChange={(e) => setNewIsRequired(e.target.checked)}
              className="w-3 h-3 cursor-pointer accent-indigo-500 rounded"
            />
            <label 
              htmlFor="checkbox-new-item-is-required" 
              className="text-[9px] text-slate-450 font-bold cursor-pointer"
            >
              Bắt buộc phải tích xong mới cho phép lưu lệnh
            </label>
          </div>
        </form>
      </div>

      {/* COMPREHENSIVE ELIGIBILITY SAFETY WARNING CONTAINER */}
      <div className={`p-3 rounded-xl border transition-all duration-300 relative overflow-hidden ${
        isSafeToTrade 
          ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' 
          : 'bg-amber-950/20 border-amber-900/45 text-amber-400 animate-pulse'
      }`}>
        <div className="flex gap-2">
          {isSafeToTrade ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
          )}
          <div className="flex-1 text-[11px] leading-normal font-sans">
            <span className="font-bold block text-xs">
              {isSafeToTrade ? 'Đủ điều kiện tâm lý & kỷ luật!' : 'CẢNH BÁO: Chưa đủ điều kiện kích hoạt!'}
            </span>
            <p className="mt-0.5 text-[10.5px] opacity-85 leading-relaxed">
              {!emotion ? (
                <span className="text-rose-400 font-bold block mt-0.5">• Cảnh báo bảo mật: Bạn chưa chọn cảm xúc ở Bước 1! Việc bỏ qua trạng thái tâm trí có thể khiến bạn giao dịch bốc đồng.</span>
              ) : null}
              {!isChecklistDone ? (
                <span className="text-amber-400 block mt-0.5">• Chưa hoàn tất kỹ luật: Còn {totalRequired - checkedRequired} tiêu chí bắt buộc trong checklist kỹ luật chưa đánh dấu xác nhận.</span>
              ) : null}
              {isSafeToTrade ? (
                <span>Trạng thái tâm lý ({emotion}) sẵn sàng & đủ toàn bộ checklist kỹ luật bắt buộc của bạn. Giao dịch chất lượng cao!</span>
              ) : null}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
