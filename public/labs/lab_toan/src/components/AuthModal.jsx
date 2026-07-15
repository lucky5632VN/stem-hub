// =====================================================
// SpatialMind — Auth Modal (Đăng nhập / Đăng ký)
// =====================================================
// Glassmorphism modal với Email/Password + Google Sign-in
// Framer Motion animations
// =====================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Mail, Lock, User, Eye, EyeOff, 
  LogIn, UserPlus, Zap, Triangle, ArrowRight,
  AlertCircle, CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const { login, register, loginWithGoogle, authError, clearError, isOfflineMode } = useAuth();

  // Reset form khi đổi mode
  useEffect(() => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setSuccessMsg('');
    clearError();
  }, [mode, clearError]);

  // Reset khi mở/đóng
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSuccessMsg('');
    }
  }, [isOpen, initialMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSuccessMsg('');

    try {
      if (mode === 'register') {
        await register(email, password, displayName);
        setSuccessMsg('🎉 Đăng ký thành công! Chào mừng đến SpatialMind!');
        setTimeout(() => onClose(), 1500);
      } else {
        await login(email, password);
        setSuccessMsg('✅ Đăng nhập thành công!');
        setTimeout(() => onClose(), 800);
      }
    } catch {
      // Error đã được set trong AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      setSuccessMsg('✅ Đăng nhập Google thành công!');
      setTimeout(() => onClose(), 800);
    } catch {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueOffline = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.85, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="fixed inset-0 z-[501] flex items-center justify-center p-6 pointer-events-none"
          >
            <div
              className="relative w-full max-w-md rounded-[32px] overflow-hidden pointer-events-auto"
              style={{
                background: 'linear-gradient(145deg, rgba(2,6,23,0.98) 0%, rgba(15,23,42,0.98) 100%)',
                border: '1px solid rgba(34,211,238,0.15)',
                boxShadow: '0 0 80px rgba(34,211,238,0.08), 0 40px 100px rgba(0,0,0,0.7)',
              }}
            >
              {/* Top glow line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 z-10 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X size={16} />
              </button>

              <div className="p-8 pt-10">
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div 
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(99,102,241,0.15))',
                      border: '1px solid rgba(34,211,238,0.2)',
                    }}
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Triangle size={28} className="text-cyan-400" />
                  </motion.div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {mode === 'login' ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    {mode === 'login' 
                      ? 'Đăng nhập để đồng bộ tiến trình học tập'
                      : 'Bắt đầu hành trình chinh phục hình học không gian'
                    }
                  </p>
                </div>

                {/* Google Sign-in */}
                {!isOfflineMode && (
                  <>
                    <button
                      onClick={handleGoogleLogin}
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#e2e8f0',
                        opacity: isSubmitting ? 0.6 : 1,
                      }}
                    >
                      {/* Google icon SVG */}
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Tiếp tục với Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                      <div className="flex-1 h-px bg-white/5" />
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">hoặc</span>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                  </>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Display name (register only) */}
                  <AnimatePresence>
                    {mode === 'register' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <label className="text-slate-400 text-xs font-bold mb-1.5 block">Tên hiển thị</label>
                        <div className="relative">
                          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Nguyễn Văn A"
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 transition-colors"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <div>
                    <label className="text-slate-400 text-xs font-bold mb-1.5 block">Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        required
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-slate-400 text-xs font-bold mb-1.5 block">Mật khẩu</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full pl-11 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Error message */}
                  <AnimatePresence>
                    {authError && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20"
                      >
                        <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-red-400 text-xs font-bold">{authError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Success message */}
                  <AnimatePresence>
                    {successMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-start gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                      >
                        <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span className="text-emerald-400 text-xs font-bold">{successMsg}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !email || !password}
                    className="w-full py-3.5 rounded-2xl font-black text-white text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    style={{
                      background: isSubmitting
                        ? 'rgba(34,211,238,0.2)'
                        : 'linear-gradient(135deg, #06b6d4, #6366f1)',
                      opacity: (!email || !password) ? 0.5 : 1,
                      boxShadow: isSubmitting ? 'none' : '0 0 30px rgba(34,211,238,0.2)',
                    }}
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : mode === 'login' ? (
                      <>
                        <LogIn size={16} />
                        Đăng nhập
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Đăng ký
                      </>
                    )}
                  </button>
                </form>

                {/* Toggle mode */}
                <div className="text-center mt-6">
                  <button
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="text-xs text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    {mode === 'login' ? (
                      <>Chưa có tài khoản? <span className="font-bold text-cyan-500">Đăng ký ngay</span></>
                    ) : (
                      <>Đã có tài khoản? <span className="font-bold text-cyan-500">Đăng nhập</span></>
                    )}
                  </button>
                </div>

                {/* Continue offline */}
                <div className="text-center mt-3">
                  <button
                    onClick={handleContinueOffline}
                    className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-widest font-bold flex items-center gap-1.5 mx-auto"
                  >
                    <Zap size={10} />
                    Tiếp tục không cần tài khoản
                    <ArrowRight size={10} />
                  </button>
                </div>
              </div>

              {/* Bottom branding */}
              <div className="px-8 py-4 border-t border-white/5 bg-black/30 text-center">
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.15em]">
                  SpatialMind • Tư duy không gian cho học sinh Việt Nam
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
