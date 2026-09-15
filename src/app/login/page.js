'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAppStore } from '@/store/useAppStore';
import { playSound } from '@/lib/sound';
import { 
  Lock, Mail, Key, ShieldCheck, ArrowRight, Sparkles, 
  UserCheck, AlertCircle, Bot, Home, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') || '/';
  
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const storeUser = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  // Nếu người dùng đã đăng nhập từ trước, tự động chuyển tiếp tới nextParam
  useEffect(() => {
    if (storeUser || auth?.currentUser) {
      console.log(`[Auth Wall] Người dùng đã đăng nhập sẵn. Tự động chuyển tiếp tới: ${nextParam}`);
      router.replace(nextParam);
    }
  }, [storeUser, nextParam, router]);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ Email và Mật khẩu!');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let lowerEmail = email.trim().toLowerCase();
      if (!lowerEmail.includes('@') && lowerEmail.startsWith('test')) {
        lowerEmail = `${lowerEmail}@gmail.com`;
      }

      let userCred;
      try {
        userCred = await signInWithEmailAndPassword(auth, lowerEmail, password);
      } catch (err) {
        // Hỗ trợ nhanh cho 20 tài khoản test mẫu
        const testMatch = lowerEmail.match(/^test(\d+)(@.*)?$/);
        if (testMatch) {
          const testNum = testMatch[1];
          const expectedPass = `test${testNum}123`;
          try {
            userCred = await signInWithEmailAndPassword(auth, `test${testNum}@gmail.com`, expectedPass);
          } catch (_) {
            try {
              userCred = await createUserWithEmailAndPassword(auth, `test${testNum}@gmail.com`, expectedPass);
            } catch (createErr) {
              throw err;
            }
          }
        } else {
          throw err;
        }
      }

      const user = userCred.user;
      const token = await user.getIdToken();
      // Ghi cookie session để Next.js Middleware xác thực tức thì
      document.cookie = `session=${token}; path=/; max-age=604800; SameSite=Lax`;

      setUser(user);
      setSuccess('Đăng nhập thành công! Đang chuyển hướng...');
      try { playSound.click(); } catch (_) {}

      console.log(`[Auth Wall] ✅ Đăng nhập thành công cho ${user.email}! Đang mở khóa và chuyển tiếp tới: ${nextParam}`);

      setTimeout(() => {
        window.location.href = nextParam;
      }, 500);

    } catch (err) {
      console.warn('[Auth Wall] Lỗi đăng nhập:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Mật khẩu hoặc tài khoản không chính xác!');
      } else if (err.code === 'auth/user-not-found') {
        setError('Tài khoản không tồn tại. Bạn có thể chuyển qua tab Đăng ký.');
      } else {
        setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password || !fullName) {
      setError('Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const lowerEmail = email.trim().toLowerCase();
      const userCred = await createUserWithEmailAndPassword(auth, lowerEmail, password);
      const user = userCred.user;

      await updateProfile(user, { displayName: fullName.trim() });
      const token = await user.getIdToken();
      document.cookie = `session=${token}; path=/; max-age=604800; SameSite=Lax`;

      // Tạo profile mặc định trên Firestore
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: lowerEmail,
          displayName: fullName.trim(),
          role: 'student',
          stats: { level: 1, exp: 0, nextLevelExp: 1000, elo: 100, wins: 0, losses: 0 }
        });
      } catch (_) {}

      setUser(user);
      setSuccess('Đăng ký tài khoản thành công! Đang chuyển hướng...');
      console.log(`[Auth Wall] ✅ Đăng ký thành công cho ${user.email}! Chuyển tiếp tới: ${nextParam}`);

      setTimeout(() => {
        window.location.href = nextParam;
      }, 600);
    } catch (err) {
      console.warn('[Auth Wall] Lỗi đăng ký:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email này đã được sử dụng. Vui lòng chuyển qua Đăng nhập.');
      } else if (err.code === 'auth/weak-password') {
        setError('Mật khẩu quá ngắn (tối thiểu 6 ký tự).');
      } else {
        setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick fill cho tài khoản kiểm thử
  const quickFill = (accEmail, accPass) => {
    setEmail(accEmail);
    setPassword(accPass);
    setError('');
    try { playSound.hover(); } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-[#070913] text-zinc-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Cyber Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-600/20 via-pink-600/15 to-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0e1222]/90 border border-cyan-500/30 rounded-3xl p-8 backdrop-blur-2xl shadow-[0_0_60px_rgba(34,211,238,0.15)]">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-pink-500/20 border border-cyan-400/40 text-cyan-300 mb-3 shadow-[0_0_25px_rgba(34,211,238,0.3)]">
            <ShieldCheck className="w-7 h-7 text-cyan-400 animate-pulse" />
          </div>
          <h1 className="text-xl font-black tracking-wider uppercase font-mono bg-gradient-to-r from-cyan-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
            STEM HUB AUTH WALL
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Hệ thống Xác thực Danh tính Học sinh & Bảo mật AI
          </p>
        </div>

        {/* Protected Route Banner */}
        {nextParam && nextParam !== '/' && (
          <div className="mb-6 p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block font-mono text-amber-300">YÊU CẦU ĐĂNG NHẬP</span>
              <span>
                Bạn cần đăng nhập để truy cập khu vực: <code className="px-1.5 py-0.5 rounded bg-amber-900/60 font-mono text-[11px] text-amber-200">{nextParam}</code>
              </span>
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-zinc-900/80 p-1 mb-6 border border-zinc-800">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ĐĂNG NHẬP
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
              tab === 'register'
                ? 'bg-pink-500/20 border border-pink-400/40 text-pink-300 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ĐĂNG KÝ
          </button>
        </div>

        {/* Form */}
        <form onSubmit={tab === 'login' ? handleLogin : handleRegister} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-300 mb-1.5">
                HỌ VÀ TÊN HỌC SINH
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-700/70 focus:border-pink-500 focus:outline-none text-xs text-zinc-100 placeholder:text-zinc-500 transition-all font-sans"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono font-bold text-zinc-300 mb-1.5">
              EMAIL / TÊN TÀI KHOẢN
            </label>
            <div className="relative">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@stemhub.edu.vn hoặc test1"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-700/70 focus:border-cyan-500 focus:outline-none text-xs text-zinc-100 placeholder:text-zinc-500 transition-all font-sans"
              />
              <Mail className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-zinc-300 mb-1.5">
              MẬT KHẨU
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-700/70 focus:border-cyan-500 focus:outline-none text-xs text-zinc-100 placeholder:text-zinc-500 transition-all font-sans"
              />
              <Key className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
              tab === 'login'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-lg shadow-cyan-500/30'
                : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white shadow-lg shadow-pink-500/30'
            }`}
          >
            {loading ? (
              <span>Đang xử lý...</span>
            ) : (
              <>
                <span>{tab === 'login' ? 'Đăng nhập & Tiếp tục' : 'Tạo tài khoản'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick fill testing accounts */}
        {tab === 'login' && (
          <div className="mt-6 pt-5 border-t border-zinc-800/80">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-2 text-center">
              ⚡ Tài khoản kiểm thử nhanh (1-Click)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => quickFill('test1@gmail.com', 'test1123')}
                className="px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-cyan-300 text-center transition-all cursor-pointer"
              >
                test1 (130 ELO)
              </button>
              <button
                type="button"
                onClick={() => quickFill('test2@gmail.com', 'test2123')}
                className="px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-cyan-300 text-center transition-all cursor-pointer"
              >
                test2 (70 ELO)
              </button>
              <button
                type="button"
                onClick={() => quickFill('admin@stemhub.edu.vn', 'AdminStemHub2026!@')}
                className="px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-amber-300 text-center transition-all cursor-pointer"
              >
                Admin Hub
              </button>
            </div>
          </div>
        )}

        {/* Back to Home Link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-cyan-300 font-mono transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Quay về Trang chủ (Công khai)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070913] flex items-center justify-center text-cyan-400 font-mono text-xs">Đang tải Auth Wall...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
