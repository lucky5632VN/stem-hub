'use client';

import { useState, useEffect } from 'react';
import { X, User, Lock, Mail, Phone, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendEmailVerification,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function AuthModal({ isOpen, onClose, initialView = 'login' }) {
  const [view, setView] = useState(initialView);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setError('');
      setSuccessMessage('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
    }
  }, [isOpen, initialView]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError('Vui lòng nhập đủ thông tin!');
    
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (signInErr) {
        // Tự động khởi tạo tài khoản admin nếu đăng nhập thất bại và email khớp với admin
        if (email.toLowerCase() === 'admin123@gmail.com' && password === 'hoanganhadmin5632') {
          // Tạo user mới trong Firebase Auth
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          // Cập nhật tên hiển thị thành 'admin'
          await updateProfile(user, { displayName: 'admin' });
          // Tạo document lưu thông tin của admin trên Firestore
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: 'admin',
            createdAt: new Date().toISOString(),
            role: 'admin',
            unlockedLabs: [],
            personalization: {
              avatarFrame: 'top_1_sovereign', // Khung VIP tối cao cho Admin
              activeTitle: 'top_1_universe',  // Danh hiệu Đại Đế cho Admin
              unlockedFrames: [
                'default', 'neon_fire', 'cyan_tech', 'cosmic_nebula', 
                'blackhole_gravity', 'antimatter_era', 'multiverse_overlord', 
                'top_1_sovereign', 'gold_vip', 'top_100_silver'
              ],
              unlockedTitles: [
                'apprentice', 'alchemist_expert', 'math_wizard', 'physics_guru', 
                'cosmic_explorer', 'nuclear_engineer', 'quantum_master', 'stem_legend', 
                'multiverse_theorist', 'dimension_creator', 'top_1_universe', 
                'top_10_legend', 'top_100_elite'
              ],
              unlockedParts: [
                'peach', 'hair_default', 'top_default', 'bottom_default',
                'chocolate', 'neon_blue', 'cosmic_purple', 'emerald_alien', 'cyborg_silver', 'sunfire_gold',
                'cyberpunk_spiky', 'long_nebula', 'curly', 'ponytail', 'dreadlocks', 'mohawk', 'side_part',
                'bob', 'double_bun', 'quantum_pixie', 'crystal_waterfall',
                'lab_coat', 'astronaut_suit', 'mech_armor', 'cyber_hoodie', 'steampunk_vest', 'royal_cape',
                'bio_hazard', 'ninja_suit', 'quantum_dress',
                'space_shorts', 'robotic_legs', 'cyber_skirt', 'steampunk_pants', 'ninja_pants', 'lightweight_joggers',
                'tennis_skirt',
                'sci_glasses', 'vr_goggles', 'headphones', 'gas_mask', 'cyber_eyepatch', 'scientific_magnifier',
                'crown', 'butterfly_hairpin'
              ],
              customCursor: 'default',
              soundEnabled: true,
              theme: 'dark'
            },
            stats: {
              level: 99,
              exp: 0,
              nextLevelExp: 1000,
              elo: 9999,
              wins: 999,
              losses: 0,
              subjectStrengths: { math: 999, physics: 999, chemistry: 999, biology: 999 }
            }
          });
        } else {
          throw signInErr;
        }
      }

      const user = userCredential.user;

      // Check if email is verified (Bypass chỉ duy nhất cho email admin và các tài khoản test)
      if (!user.emailVerified && user.email.toLowerCase() !== 'admin123@gmail.com' && !user.email.toLowerCase().startsWith('test')) {
        // Sign out immediately so they don't gain active session
        await signOut(auth);
        setError('Tài khoản của bạn chưa được xác thực email! Vui lòng kích hoạt trong hộp thư để tiếp tục.');
        setView('verification-pending');
        return;
      }

      onClose();
    } catch (err) {
      console.warn("Lỗi đăng nhập:", err);
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password || !fullName) return setError('Vui lòng điền đủ các trường bắt buộc!');
    
    // Kiểm tra định dạng email bằng Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setError('Email không đúng định dạng! (Ví dụ: student@gmail.com)');
    }
    
    if (password !== confirmPassword) return setError('Mật khẩu xác nhận không khớp!');
    if (password.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự!');

    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      // 1. Tạo user trong Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Cập nhật profile (Tên hiển thị)
      await updateProfile(user, { displayName: fullName });

      // 3. Gửi email xác thực tài khoản (Bỏ qua cho tài khoản test)
      if (!email.toLowerCase().startsWith('test')) {
        await sendEmailVerification(user);
      }

      // 4. Tạo record cấu trúc đầy đủ trong Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: fullName,
        createdAt: new Date().toISOString(),
        role: 'student',
        unlockedLabs: [],
        personalization: {
          avatarFrame: 'default',
          activeTitle: 'apprentice',
          unlockedFrames: ['default'],
          unlockedTitles: ['apprentice'],
          customCursor: 'default',
          soundEnabled: true,
          theme: 'dark',
          avatarUrl: 'custom-avatar',
          avatarParts: {
            gender: 'male',
            bodyType: 'chibi',
            pose: 'standard',
            body: 'peach',
            hair: 'default',
            top: 'default',
            bottom: 'default',
            accessory: 'none'
          },
          unlockedParts: ['peach', 'hair_default', 'top_default', 'bottom_default'],
          claimedMilestones: []
        },
        stats: {
          level: 1,
          exp: 0,
          nextLevelExp: 1000,
          elo: 0,
          wins: 0,
          losses: 0,
          subjectStrengths: { math: 50, physics: 50, chemistry: 50, biology: 50 }
        }
      });

      if (email.toLowerCase().startsWith('test')) {
        setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển hướng...');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        // Kích hoạt giao diện chờ xác thực
        setSuccessMessage('Một email xác thực đã được gửi đến địa chỉ của bạn.');
        setView('verification-pending');
        
        // Đăng xuất ngay để tạm thời chưa cấp quyền sử dụng app
        await signOut(auth);
      }
    } catch (err) {
      // Dùng console.warn thay vì console.error để tránh kích hoạt popup lỗi của Next.js dev server
      console.warn("Lỗi đăng ký:", err.code || err.message);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email này đã được sử dụng!');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email không hợp lệ hoặc không đúng định dạng!');
      } else if (err.code === 'auth/weak-password') {
        setError('Mật khẩu quá yếu! Mật khẩu cần tối thiểu 6 ký tự.');
      } else {
        setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại!');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) return setError('Vui lòng nhập email!');
    
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Đã gửi liên kết khôi phục mật khẩu! Vui lòng kiểm tra email của bạn.');
    } catch (err) {
      console.warn("Lỗi gửi email reset:", err);
      if (err.code === 'auth/user-not-found') {
        setError('Email này chưa được đăng ký tài khoản!');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email không đúng định dạng!');
      } else {
        setError('Gửi yêu cầu thất bại. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      setError('Vui lòng thử đăng nhập lại bằng tài khoản vừa tạo để hệ thống gửi lại email xác thực.');
      setView('login');
    } catch (err) {
      setError('Gửi lại email thất bại. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#2a2c3a] rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-white/10 z-10 text-slate-800 dark:text-zinc-200 transition-all duration-300"
        >
          <button 
            onClick={onClose}
            className="absolute -top-4 -right-4 w-10 h-10 bg-slate-100 hover:bg-slate-200 dark:bg-white rounded-full flex items-center justify-center text-zinc-900 hover:text-zinc-700 transition-colors shadow-lg"
          >
            <X className="w-5 h-5 text-slate-700 dark:text-zinc-900" />
          </button>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-6">
            {view === 'login' ? 'Đăng nhập' : view === 'register' ? 'Đăng ký' : view === 'forgot-password' ? 'Khôi phục mật khẩu' : 'Xác thực tài khoản'}
          </h2>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-650 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/50 rounded-xl text-emerald-650 dark:text-emerald-400 text-sm text-center">
              {successMessage}
            </div>
          )}

          {/* Login View */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="max-w-md mx-auto space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-pink-500" />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email đăng nhập" 
                    className="w-full bg-slate-100 dark:bg-[#1c1e29] border border-slate-200 dark:border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-pink-500" />
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu" 
                    className="w-full bg-slate-100 dark:bg-[#1c1e29] border border-slate-200 dark:border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
              </div>

              <div className="text-left">
                <button 
                  type="button" 
                  onClick={() => { setView('forgot-password'); setError(''); setSuccessMessage(''); }}
                  className="text-sky-600 dark:text-sky-400 hover:underline text-sm transition-colors"
                >
                  Quên mật khẩu
                </button>
              </div>

              <button disabled={loading} type="submit" className="w-full py-3.5 flex justify-center items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl shadow-lg shadow-pink-500/20 transition-all active:scale-95 text-lg disabled:opacity-70 disabled:cursor-not-allowed">
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                Đăng nhập
              </button>

              <div className="text-center text-slate-500 dark:text-zinc-400 text-sm mt-6">
                Không có tài khoản?{' '}
                <button type="button" onClick={() => {setView('register'); setError(''); setSuccessMessage('');}} className="text-sky-600 dark:text-sky-400 hover:underline transition-colors font-medium">
                  Đăng ký ngay
                </button>
              </div>
            </form>
          )}

          {/* Register View */}
          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Col 1 */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">1. Thông tin tài khoản</h3>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-pink-500" />
                    </div>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email đăng nhập*" 
                      className="w-full bg-slate-100 dark:bg-[#1c1e29] border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-pink-500" />
                    </div>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mật khẩu*" 
                      className="w-full bg-slate-100 dark:bg-[#1c1e29] border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-pink-500" />
                    </div>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Xác nhận mật khẩu*" 
                      className="w-full bg-slate-100 dark:bg-[#1c1e29] border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Col 2 */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">2. Thông tin cá nhân</h3>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-pink-500" />
                    </div>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Họ và tên*" 
                      className="w-full bg-slate-100 dark:bg-[#1c1e29] border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="w-5 h-5 text-pink-500" />
                    </div>
                    <input 
                      type="tel" 
                      placeholder="Số điện thoại (Tuỳ chọn)" 
                      className="w-full bg-slate-100 dark:bg-[#1c1e29] border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="max-w-sm mx-auto mt-8">
                <button disabled={loading} type="submit" className="w-full py-3.5 flex justify-center items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl shadow-lg shadow-pink-500/20 transition-all active:scale-95 text-lg disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  Đăng ký tài khoản
                </button>
                
                <div className="text-center text-slate-500 dark:text-zinc-400 text-sm mt-6">
                  Đã có tài khoản?{' '}
                  <button type="button" onClick={() => {setView('login'); setError(''); setSuccessMessage('');}} className="text-sky-600 dark:text-sky-400 hover:underline transition-colors font-medium">
                    Đăng nhập ngay
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Forgot Password View */}
          {view === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="max-w-md mx-auto space-y-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  Nhập địa chỉ email đăng ký tài khoản của bạn để nhận liên kết đặt lại mật khẩu qua thư.
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-pink-500" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn" 
                  className="w-full bg-slate-100 dark:bg-[#1c1e29] border border-slate-200 dark:border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                  required
                />
              </div>

              <button disabled={loading} type="submit" className="w-full py-3.5 flex justify-center items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl shadow-lg shadow-pink-500/20 transition-all active:scale-95 text-lg disabled:opacity-70 disabled:cursor-not-allowed">
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                Gửi yêu cầu khôi phục
              </button>

              <div className="text-center text-slate-500 dark:text-zinc-400 text-sm mt-6">
                <button type="button" onClick={() => {setView('login'); setError(''); setSuccessMessage('');}} className="text-sky-600 dark:text-sky-400 hover:underline transition-colors font-medium">
                  Quay lại Đăng nhập
                </button>
              </div>
            </form>
          )}

          {/* Verification Pending View */}
          {view === 'verification-pending' && (
            <div className="max-w-md mx-auto space-y-6 text-center select-none py-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 border border-pink-500/20 shadow-lg">
                  <Mail className="w-8 h-8 animate-pulse text-pink-500" />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Kiểm tra hộp thư của bạn</h3>
                <p className="text-sm text-slate-650 dark:text-zinc-400 leading-relaxed">
                  Một liên kết xác thực đã được gửi tới:<br />
                  <strong className="text-pink-600 dark:text-pink-400 font-semibold">{email}</strong>
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-500">
                  Vui lòng nhấn vào liên kết trong email để kích hoạt tài khoản của bạn. Đừng quên kiểm tra thư mục Spam hoặc Junk nếu không nhận được.
                </p>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-white/5">
                <button 
                  onClick={() => {
                    setView('login');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 text-sm"
                >
                  Tôi đã xác thực, đi tới Đăng nhập
                </button>

                <button 
                  onClick={handleResendVerification}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Gửi lại email xác thực
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
