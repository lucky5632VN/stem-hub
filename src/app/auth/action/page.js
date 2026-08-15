'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { 
  confirmPasswordReset, 
  applyActionCode, 
  verifyPasswordResetCode 
} from 'firebase/auth';
import { 
  Key, 
  MailCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Eye, 
  EyeOff, 
  ArrowRight 
} from 'lucide-react';
import { motion } from 'framer-motion';

function AuthActionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  // General states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState(''); // Email for reset password

  // Password reset states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!mode || !oobCode) {
      setError('Đường dẫn không hợp lệ hoặc thiếu tham số kích hoạt.');
      setLoading(false);
      return;
    }

    if (mode === 'verifyEmail') {
      // Tự động chạy xác thực email
      handleVerifyEmail();
    } else if (mode === 'resetPassword') {
      // Xác minh code reset password trước xem có hợp lệ không
      handleVerifyResetCode();
    } else {
      setError('Hành động xác thực không được hỗ trợ.');
      setLoading(false);
    }
  }, [mode, oobCode]);

  // 1. Xác thực Email
  const handleVerifyEmail = async () => {
    try {
      await applyActionCode(auth, oobCode);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Mã xác thực email đã hết hạn, không hợp lệ hoặc đã được sử dụng trước đó.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Xác minh mã Reset Password
  const handleVerifyResetCode = async () => {
    try {
      const userEmail = await verifyPasswordResetCode(auth, oobCode);
      setEmail(userEmail);
    } catch (err) {
      console.error(err);
      setError('Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Thực hiện Đổi Mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError('Mật khẩu xác nhận không trùng khớp.');
    if (password.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự.');

    setSubmitting(true);
    setError('');
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Không thể cập nhật mật khẩu mới. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  // Trạng thái Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
        <p className="text-slate-650 dark:text-zinc-400 font-medium animate-pulse">
          Đang xác thực thông tin với Firebase...
        </p>
      </div>
    );
  }

  // Trạng thái Lỗi
  if (error && !success) {
    return (
      <div className="text-center space-y-6 max-w-sm">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500">
            <AlertCircle className="w-7 h-7" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Lỗi xác thực</h3>
          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">{error}</p>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white text-xs font-bold rounded-xl transition-all"
        >
          Quay lại Trang chủ
        </button>
      </div>
    );
  }

  // Trạng thái Đổi mật khẩu Thành công
  if (success && mode === 'resetPassword') {
    return (
      <div className="text-center space-y-6 max-w-sm">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-7 h-7" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Đã đặt lại mật khẩu!</h3>
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Mật khẩu mới của bạn đã được cập nhật thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.
          </p>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 text-xs flex items-center justify-center gap-1.5"
        >
          Đăng nhập ngay
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Trạng thái Xác thực Email Thành công
  if (success && mode === 'verifyEmail') {
    return (
      <div className="text-center space-y-6 max-w-sm">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
            <MailCheck className="w-7 h-7" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Kích hoạt tài khoản thành công!</h3>
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Cảm ơn bạn đã xác thực email. Tài khoản của bạn hiện đã sẵn sàng hoạt động tại STEM Hub.
          </p>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 text-xs flex items-center justify-center gap-1.5"
        >
          Trải nghiệm ngay
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Giao diện đặt lại mật khẩu
  if (mode === 'resetPassword') {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-pink-500/10 border border-pink-500/20 rounded-full flex items-center justify-center text-pink-500">
              <Key className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Đặt lại mật khẩu</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Đặt mật khẩu mới cho tài khoản: <strong className="text-slate-800 dark:text-zinc-200">{email}</strong>
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-650 dark:text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="relative">
            <input 
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu mới*" 
              className="w-full bg-slate-100 dark:bg-[#1c1e29] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-pink-500 transition-colors text-sm"
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 dark:text-zinc-500 hover:text-pink-500 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <input 
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu mới*" 
              className="w-full bg-slate-100 dark:bg-[#1c1e29] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-pink-500 transition-colors text-sm"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-3 flex justify-center items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl shadow-lg shadow-pink-500/20 transition-all active:scale-95 text-xs disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Lưu mật khẩu mới
          </button>
        </form>
      </div>
    );
  }

  return null;
}

export default function AuthActionPage() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6 text-text-primary transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-bg-secondary rounded-3xl shadow-xl p-8 border border-border-theme flex flex-col items-center justify-center transition-all duration-300 min-h-[300px]"
      >
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-accent-pink animate-spin" />
            <p className="text-text-secondary font-medium">Đang chuẩn bị...</p>
          </div>
        }>
          <AuthActionContent />
        </Suspense>
      </motion.div>
    </div>
  );
}
