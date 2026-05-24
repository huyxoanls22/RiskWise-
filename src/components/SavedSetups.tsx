import React, { useState } from 'react';
import { TradeSetup } from '../types';
import { calculatePositionSize } from '../utils/calculator';
import { Bookmark, Trash2, FolderOpen, Calendar, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SavedSetupsProps {
  setups: TradeSetup[];
  onLoadSetup: (setup: TradeSetup) => void;
  onDeleteSetup: (id: string) => void;
  onSaveSetup: (name: string) => void;
}

export default function SavedSetups({
  setups,
  onLoadSetup,
  onDeleteSetup,
  onSaveSetup
}: SavedSetupsProps) {
  const [newSetupName, setNewSetupName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const handleSubmitSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetupName.trim()) return;
    onSaveSetup(newSetupName.trim());
    setNewSetupName('');
    setShowSaveInput(false);
  };

  return (
    <div id="saved-setups-container" className="bg-[#14171F] rounded-2xl p-5 border border-slate-800/80 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-slate-200 text-sm">Bộ sưu tập Kế hoạch đã lưu</h3>
        </div>
        <span className="text-xs bg-[#1C212D] text-slate-400 font-bold font-mono px-2 py-0.5 rounded-full border border-slate-800">
          {setups.length}
        </span>
      </div>

      {/* Save Trigger inline form */}
      {!showSaveInput ? (
        <button
          id="btn-trigger-save"
          onClick={() => setShowSaveInput(true)}
          className="w-full py-2.5 px-3 text-xs font-semibold text-indigo-400 bg-indigo-950/20 hover:bg-indigo-950/40 border border-indigo-900/50 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 focus:outline-hidden cursor-pointer"
        >
          <Bookmark className="w-3.5 h-3.5" />
          Lưu Kế hoạch hiện tại
        </button>
      ) : (
        <form onSubmit={handleSubmitSave} className="space-y-2 mb-3 bg-[#1C212D]/60 p-3 rounded-xl border border-slate-800">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tên kế hoạch</label>
          <div className="flex gap-2">
            <input
              id="input-setup-name"
              type="text"
              value={newSetupName}
              onChange={(e) => setNewSetupName(e.target.value)}
              placeholder="VD: EURUSD Breakout"
              className="flex-1 bg-[#1C212D] border border-slate-700 text-xs px-2.5 py-1.5 rounded-lg text-white focus:outline-hidden focus:border-indigo-500 font-sans"
              maxLength={25}
              required
            />
            <button
              id="btn-confirm-save"
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Lưu
            </button>
            <button
              id="btn-cancel-save"
              type="button"
              onClick={() => setShowSaveInput(false)}
              className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* List of Setups */}
      <div className="flex-1 overflow-y-auto max-h-[350px] mt-4 space-y-3 pr-1 scrollbar-thin">
        <AnimatePresence initial={false}>
          {setups.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 px-4 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl bg-[#1C212D]/20 animate-pulse"
            >
              <FolderOpen className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400">Chưa có kế hoạch giao dịch nào được lưu.</p>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[170px]">Tính toán nhanh, đặt tên và lưu lại để so sánh sau.</p>
            </motion.div>
          ) : (
            setups.map((setup) => {
              const res = calculatePositionSize(setup);
              const isForex = setup.assetClass === 'forex';
              const formattedDate = new Date(setup.createdAt).toLocaleDateString('vi-VN', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <motion.div
                  key={setup.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="bg-[#1C212D]/40 hover:bg-[#1C212D] hover:border-indigo-900/50 border border-slate-800 rounded-xl p-3 flex flex-col justify-between group transition-all"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm font-mono uppercase border ${
                          isForex ? 'bg-indigo-950/40 text-indigo-400 border-indigo-900/40' : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                        }`}>
                          {isForex ? 'Forex' : 'Crypto/Stock'}
                        </span>
                        <span className="font-semibold text-slate-200 text-xs truncate max-w-[120px]" title={setup.name}>
                          {setup.name}
                        </span>
                      </div>
                      
                      <div className="mt-2 text-[11px] space-y-1 text-slate-400 font-sans">
                        <div className="flex justify-between">
                          <span>Vốn / Rủi ro:</span>
                          <span className="font-semibold text-slate-300">
                            {setup.accountBalance.toLocaleString('en-US')} $ / {setup.riskType === 'percentage' ? `${setup.riskValue}%` : `$${setup.riskValue}`}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Thông số lệnh:</span>
                          <span className="font-semibold text-slate-300">
                            {isForex ? `${setup.forexPair} (SL ${setup.stopLossPips}p)` : `Entry ${setup.entryPrice} / SL ${setup.stopLossPrice}`}
                          </span>
                        </div>

                        <div className="flex justify-between border-t border-slate-800/60 pt-1.5 mt-1.5 font-mono text-[11px]">
                          <span className="text-indigo-400 font-semibold font-sans">Khối lượng:</span>
                          <span className="font-bold text-white">
                            {isForex ? `${res.positionSizeLots} Lots` : `${res.positionSizeUnits} Units`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 opacity-60 group-hover:opacity-100 transition duration-150">
                      <button
                        title="Tải kế hoạch"
                        onClick={() => onLoadSetup(setup)}
                        className="p-1 px-[5px] text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-md border border-transparent hover:border-slate-700 transition duration-150"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Xóa kế hoạch"
                        onClick={() => onDeleteSetup(setup.id)}
                        className="p-1 px-[5px] text-slate-500 hover:text-rose-450 hover:bg-slate-800 rounded-md border border-transparent hover:border-slate-700 transition duration-150"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {formattedDate}
                    </span>
                    {res.riskRewardRatio && (
                      <span className="font-bold text-emerald-400 font-mono bg-emerald-950/40 px-1.5 py-0.5 border border-emerald-900/30 rounded">R:R = 1:{res.riskRewardRatio}</span>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
