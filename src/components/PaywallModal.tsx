import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthProvider';
import { 
  Crown, 
  X, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  Lock, 
  QrCode, 
  Copy, 
  CheckCircle2,
  LockKeyhole
} from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
  const { login, isPremium } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [copiedText, setCopiedText] = useState(false);
  const [showBillingForm, setShowBillingForm] = useState(false);
  
  // Billing user info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const currentPrice = selectedPlan === 'monthly' ? '199.000' : '999.000';
  const planName = selectedPlan === 'monthly' ? 'Gói Tháng Tiêu Chuẩn' : 'Gói Năm VIP (Tiết kiệm 58%)';
  const transferMsg = `RISKWISE UPGRADE ${selectedPlan.toUpperCase()}`;

  const handleCopyMemo = () => {
    navigator.clipboard.writeText(transferMsg);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleUpgradeMock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    
    // Set standard license key and login
    const randKey = 'RW-PREMIUM-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    login(email, name, randKey);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setShowBillingForm(false);
      onClose();
    }, 2500);
  };

  const features = [
    "Expert System AI Báo Cáo Kỷ Luật (Bóc trần con quỷ cảm xúc)",
    "Hành Vi Khi Thua Chuỗi (Thống kê thói quen trả thù thị trường)",
    "Báo cáo Khoảnh Khắc Nguy Hiểm (Khung giờ vứt bỏ kỷ luật)",
    "Tương Quan Kỷ Luật & Kết Quả (So sánh trực quan Winrate & Profit Factor)",
    "Phân Tích Thống Kê Cảm Xúc (Tác động của cay cú, FOMO tới PnL)",
    "Tạo tối đa 5 bộ checklist kỷ luật tùy biến cao cấp",
    "Xuất báo cáo PDF/Excel phân tích hành vi gửi trực tiếp về Email",
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#060913]/90 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="bg-[#0f1322] border border-amber-500/35 rounded-2xl w-full max-w-4xl p-6 md:p-8 max-h-[92vh] overflow-y-auto shadow-2xl relative z-10 text-left font-sans text-slate-100 grid grid-cols-1 md:grid-cols-12 gap-8"
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Column: Core Value Proposition */}
          <div className="md:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider bg-amber-500/10 py-1.5 px-3 rounded-full w-fit border border-amber-500/20">
              <Crown className="w-4 h-4 fill-amber-400" />
              RiskWise Pro Trader Premium
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                Mở Khóa <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent">Bộ Não Phân Tích</span> Kỷ Luật Hành Vi
              </h2>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                Bản <strong className="text-slate-200">FREE</strong> giúp bạn xây dựng thói quen ghi chép nhật ký, bản <strong className="text-amber-400 font-extrabold">PREMIUM</strong> mở khóa bộ não <span className="text-amber-300 font-bold">Báo Cáo Kỷ Luật (Expert System)</span> để bóc trần con quỷ cảm xúc và xem sự thật về chính mình.
              </p>
            </div>

            {/* Features check list */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Quyền Lợi Độc Quyền Bản Premium:
              </h4>
              <ul className="grid grid-cols-1 gap-2.5">
                {features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 leading-normal">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-indigo-950/20 border border-indigo-500/15 rounded-xl flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-white leading-none">Cảnh Báo Từ Market</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  95% các trader thua lỗ không phải vì phân tích sai, mà vì giao dịch vội vã, trả thù hay buông xuôi sau chuỗi thua. Đã đến lúc đối diện với sự thật kỷ luật của bạn.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Price packages & Payment VietQR/Activation */}
          <div className="md:col-span-5 bg-[#12172d] border border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col justify-between relative overflow-hidden">
            
            {isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center py-10 h-full space-y-4"
              >
                <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-12 h-12 animate-bounce" />
                </div>
                <h3 className="text-lg font-black text-white uppercase">CẤP QUYỀN THÀNH CÔNG!</h3>
                <p className="text-xs text-slate-300 leading-normal px-2">
                  Chào mừng <span className="font-bold text-amber-300">{name}</span>! Bản Premium đã được kích hoạt trực tiếp trên thiết bị này.
                </p>
              </motion.div>
            ) : showBillingForm ? (
              <form onSubmit={handleUpgradeMock} className="space-y-4 w-full">
                <div className="flex items-center gap-2 text-slate-300 font-bold text-xs cursor-pointer hover:text-white mb-2" onClick={() => setShowBillingForm(false)}>
                  ← Quay lại phương thức thanh toán
                </div>
                
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Thông Tin Thanh Toán</h3>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Nhập thông tin của bạn để chúng tôi cấp Key bản quyền tự động ngay sau khi xác nhận.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Họ và tên nhà giao dịch
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nguyễn Văn A" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#171c3a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Email đăng ký
                    </label>
                    <input 
                      type="email" 
                      required
                      placeholder="email@gmail.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#171c3a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg"
                >
                  XÁC NHẬN KÍCH HOẠT PREMIUM
                </button>
              </form>
            ) : (
              <div className="space-y-5 h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                    LỰA CHỌN GÓI PREMIUM:
                  </h3>
                  
                  {/* Package Selector */}
                  <div className="space-y-2.5">
                    {/* Yearly Offer */}
                    <div 
                      onClick={() => setSelectedPlan('yearly')}
                      className={`relative p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        selectedPlan === 'yearly'
                          ? 'bg-amber-500/10 border-amber-400/80 shadow-md'
                          : 'bg-[#171c3a]/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="absolute top-0 right-3 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase tracking-wider py-0.5 px-2 rounded-full">
                        Tiết Kiệm 58%
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedPlan === 'yearly' ? 'border-amber-400' : 'border-slate-600'
                        }`}>
                          {selectedPlan === 'yearly' && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">GÓI NĂM VIP</p>
                          <p className="text-[10px] text-slate-400">Thanh toán theo năm</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-amber-300">999.000 VNĐ</p>
                        <p className="text-[9px] text-slate-400 font-semibold">~83.000đ/tháng</p>
                      </div>
                    </div>

                    {/* Monthly Offer */}
                    <div 
                      onClick={() => setSelectedPlan('monthly')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        selectedPlan === 'monthly'
                          ? 'bg-amber-500/10 border-amber-400/80 shadow-md'
                          : 'bg-[#171c3a]/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedPlan === 'monthly' ? 'border-amber-400' : 'border-slate-600'
                        }`}>
                          {selectedPlan === 'monthly' && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">GÓI THÁNG TIÊU CHUẨN</p>
                          <p className="text-[10px] text-slate-400">Gia hạn từng tháng</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-200">199.000 VNĐ</p>
                        <p className="text-[9px] text-slate-400">Mỗi tháng</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VietQR automatic visual layout inside dashed border */}
                <div className="p-4 bg-[#0a0d1a] border-2 border-dashed border-slate-800 rounded-xl space-y-3 relative">
                  <div className="absolute top-2.5 right-2.5 p-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-md">
                    <QrCode className="w-4 h-4" />
                  </div>
                  
                  <div className="space-y-1 text-center">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                      QUÉT MÃ VIETQR QUA NGÂN HÀNG
                    </span>
                    <p className="text-[11px] font-extrabold text-amber-300">
                      Chuyển khoản: {currentPrice} VNĐ
                    </p>
                  </div>

                  {/* SVG VietQR Box representation */}
                  <div className="mx-auto w-24 h-24 bg-white/95 p-1.5 rounded-lg flex items-center justify-center shadow-lg">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 select-none">
                      {/* Grid representation */}
                      <rect x="0" y="0" width="100" height="100" fill="white" />
                      <path d="M5,5 h30 v30 h-30 z M10,10 h20 v20 h-20 z" fill="currentColor" />
                      <path d="M65,5 h30 v30 h-30 z M70,10 h20 v20 h-20 z" fill="currentColor" />
                      <path d="M5,65 h30 v30 h-30 z M10,70 h20 v20 h-20 z" fill="currentColor" />
                      {/* Center logo marker */}
                      <rect x="38" y="38" width="24" height="24" fill="currentColor" rx="4" />
                      <polygon points="45,50 50,43 55,50" fill="white" />
                      <rect x="49" y="51" width="2" height="6" fill="white" />
                      {/* Random pixel path data representing QR complex layout */}
                      <path d="M42,5 h5 v5 h-5 z M52,5 h5 v5 h-5 z M60,15 h5 v10 h-5 z M45,25 h10 v5 h-10 z M15,42 h10 v5 h-10 z M5,55 h10 v5 h-10 z M42,65 h10 v5 h-10 z M55,75 h15 v5 h-15 z M75,55 h15 v5 h-15 z M85,65 h10 v15 h-10 z M65,85 h20 v5 h-20 z" fill="currentColor" />
                    </svg>
                  </div>

                  <div className="space-y-1.5 text-center px-1">
                    <div className="text-[10px] text-slate-400 leading-normal">
                      Nội dung chuyển khoản (bắt buộc):
                    </div>
                    <div className="flex items-center justify-center gap-1.5 bg-[#12162a] border border-slate-800 py-1 px-2 rounded-lg">
                      <span className="font-mono text-xs text-slate-200 select-all font-black">
                        {transferMsg}
                      </span>
                      <button 
                        type="button" 
                        onClick={handleCopyMemo} 
                        className="text-slate-400 hover:text-amber-400 transition" 
                        title="Copy memo"
                      >
                        {copiedText ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBillingForm(true)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg text-center select-none uppercase tracking-wider"
                >
                  XÁC NHẬN ĐÃ CHUYỂN KHOẢN (Mở Khóa Ngay)
                </button>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
