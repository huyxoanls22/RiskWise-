import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';

interface SupabaseAuthProps {
  onAuthSuccess: () => void;
}

export default function SupabaseAuth({ onAuthSuccess }: SupabaseAuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Supabase auto-confirms or sends confirmation email
          setSuccessMsg('Đăng ký thành công! Hãy kiểm tra hộp thư email của bạn hoặc đăng nhập ngay nếu tài khoản được kích hoạt tự động.');
          // Reset fields
          setPassword('');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          onAuthSuccess();
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Có lỗi xảy ra, vui lòng kiểm tra thông tin và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-550/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-550/5 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[#0F121A] border border-slate-800/80 rounded-2xl shadow-2xl p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-650 to-indigo-550 text-white shadow-lg mb-4">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-sans font-black text-white uppercase tracking-wider">
            RiskWise <span className="text-indigo-400 font-light">SaaS</span>
          </h2>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            {isSignUp ? 'Đăng ký tài khoản giao dịch kỷ luật' : 'Đăng nhập vào hệ thống quản lý rủi ro & kỷ luật'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 bg-rose-950/20 border border-rose-800/30 text-rose-300 rounded-xl text-xs flex gap-2.5 items-start"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 bg-emerald-950/25 border border-emerald-800/20 text-emerald-350 rounded-xl text-xs flex gap-2.5 items-start"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Địa chỉ Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trade@example.com"
                className="w-full bg-[#161B26] border border-slate-800 focus:border-indigo-500 focus:outline-hidden text-sm text-slate-200 pl-10 pr-4 py-3 rounded-xl transition duration-150 placeholder-slate-600 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Mật khẩu
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="auth-password-input"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#161B26] border border-slate-800 focus:border-indigo-500 focus:outline-hidden text-sm text-slate-200 pl-10 pr-4 py-3 rounded-xl transition duration-150 placeholder-slate-600 font-medium"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 mt-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold text-xs rounded-xl select-none cursor-pointer duration-200 transition-all shadow-md hover:shadow-indigo-950/20 flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {isSignUp ? 'Đăng ký tài khoản' : 'Đăng nhập hệ thống'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-800/60 pt-4 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition duration-150"
          >
            {isSignUp ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký tại đây'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
