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
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getPresetForEmail } from '@/data/testAccounts';
import { EQUIPMENT_CATALOG } from '@/data/equipmentCatalog';
import dynamic from 'next/dynamic';
const FaceAuthModal = dynamic(() => import('@/components/organisms/FaceAuthModal'), { ssr: false });
import { useAppStore } from '@/store/useAppStore';
import { setFace2FASession, clearFace2FASession } from '@/lib/faceAuthSecurity';

// Hàm kiểm tra các tài khoản Admin & TK Test (cho phép đăng nhập tức thì không bị chặn xác thực)
const isBypassVerificationAccount = (email) => {
  return true; // Cho phép tất cả tài khoản học sinh / test / admin đăng nhập ngay lập tức
};

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

  // Face 2FA Verification State
  const [face2faPending, setFace2faPending] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setError('');
      setSuccessMessage('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setFace2faPending(null);
    }
  }, [isOpen, initialView]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const form = e.currentTarget || e.target;
    const inputEmail = (email || form.elements?.email?.value || form.querySelector('input[type="email"]')?.value || '').trim();
    const inputPassword = password || form.elements?.password?.value || form.querySelector('input[type="password"]')?.value || '';

    if (!inputEmail || !inputPassword) return setError('Vui lòng nhập đầy đủ Email và Mật khẩu!');
    
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      let userCredential;
      let lowerEmail = inputEmail.toLowerCase();
      if (!lowerEmail.includes('@') && lowerEmail.startsWith('test')) {
        lowerEmail = `${lowerEmail}@gmail.com`;
      }
      try {
        userCredential = await signInWithEmailAndPassword(auth, lowerEmail, inputPassword);
      } catch (signInErr) {
        // 1. Kiểm tra nếu là 20 tài khoản test1 -> test20
        const testMatch = lowerEmail.match(/^test(\d+)(@.*)?$/);
        let fallbackSuccess = false;

        if (testMatch) {
          const testNum = testMatch[1];
          const expectedTestPass = `test${testNum}123`;
          const normalizedTestEmail = `test${testNum}@gmail.com`;

          for (const tryEmail of [lowerEmail, normalizedTestEmail]) {
            for (const tryP of [inputPassword, expectedTestPass, '123456', 'password123']) {
              try {
                userCredential = await signInWithEmailAndPassword(auth, tryEmail, tryP);
                fallbackSuccess = true;
                break;
              } catch (_) {}
            }
            if (fallbackSuccess) break;
          }

          // Nếu tài khoản test chưa từng tồn tại trên Firebase Auth -> Tự động khởi tạo
          if (!fallbackSuccess) {
            try {
              userCredential = await createUserWithEmailAndPassword(auth, normalizedTestEmail, expectedTestPass);
              fallbackSuccess = true;
            } catch (_) {}
          }
        }

        // 2. Tự động tạo tài khoản cho học sinh mới hoặc thông báo sai mật khẩu nếu email đã tồn tại
        if (!fallbackSuccess) {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, lowerEmail, inputPassword);
            const user = userCredential.user;
            const preset = getPresetForEmail(user.email);
            const initialName = preset ? preset.displayName : lowerEmail.split('@')[0];
            await updateProfile(user, { displayName: initialName });
          } catch (createErr) {
            if (createErr.code === 'auth/email-already-in-use') {
              setError('Mật khẩu không chính xác! Vui lòng thử lại hoặc nhấn "Quên mật khẩu".');
              setLoading(false);
              return;
            }
            setError('Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu.');
            setLoading(false);
            return;
          }
        }
      }

      const user = userCredential.user;
      
      // Đồng bộ thông tin preset nếu là tài khoản test (chỉ tạo nếu doc chưa tồn tại)
      const preset = getPresetForEmail(user.email);
      if (preset) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const snap = await getDoc(userDocRef);
          if (!snap.exists()) {
            const testInventory = EQUIPMENT_CATALOG.map(card => ({ cardId: card.id, quantity: 10 }));
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email,
              displayName: preset.displayName,
              name: preset.displayName,
              role: 'student',
              isBotAccount: true,
              botStatus: 'available',
              inventory: testInventory,
              stats: {
                level: preset.level || 1,
                exp: (preset.level || 1) * 500,
                nextLevelExp: (preset.level || 1) * 1000,
                elo: preset.elo !== undefined ? preset.elo : 100,
                wins: preset.wins || 0,
                losses: preset.losses || 0,
                subjectStrengths: preset.subjectStrengths || { math: 50, physics: 50, chemistry: 50, biology: 50 }
              },
              personalization: {
                elo: preset.elo !== undefined ? preset.elo : 100,
                level: preset.level || 1,
                activeTitle: 'apprentice',
                avatarFrame: 'default',
                crystals: 1000,
                avatarParts: { gender: 'male', bodyType: 'chibi', pose: 'standard', body: 'peach', hair: 'default', top: 'default', bottom: 'default', accessory: 'none' },
                unlockedParts: ['peach', 'hair_default', 'top_default', 'bottom_default']
              }
            });
          }
        } catch (presetErr) {
          console.warn("Bỏ qua đồng bộ preset tài khoản test:", presetErr?.message || presetErr);
        }
        try {
          await updateProfile(user, { displayName: preset.displayName });
        } catch (_) {}
      }

      try {
        await user.reload();
      } catch (_) {}

      const isBypass = isBypassVerificationAccount(user.email);

      if (!isBypass && !user.emailVerified) {
        try {
          await sendEmailVerification(user);
          setSuccessMessage(`Đã gửi email xác thực tới: ${user.email}. Vui lòng kiểm tra Hộp thư.`);
        } catch (sendErr) {
          console.warn("Lỗi gửi email xác thực:", sendErr);
        }
        await signOut(auth);
        setView('verification-pending');
        return;
      }
      // Kiểm tra xem tài khoản có bật Face 2FA không
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const uData = userDoc.data();
          const isFaceEnabled = uData?.personalization?.face2FAEnabled || uData?.face2FAEnabled;
          let descriptor = uData?.personalization?.faceDescriptor || uData?.faceDescriptor;

          if (descriptor && typeof descriptor === 'object' && !Array.isArray(descriptor)) {
            descriptor = Object.keys(descriptor)
              .sort((a, b) => Number(a) - Number(b))
              .map(k => Number(descriptor[k]));
          }

          if (isFaceEnabled && descriptor && Array.isArray(descriptor) && descriptor.length > 0) {
            setFace2faPending({
              user: user,
              email: user.email,
              faceDescriptor: descriptor
            });
            return;
          }
        }
      } catch (err2fa) {
        console.warn("Lỗi kiểm tra trạng thái Face 2FA:", err2fa);
      }

      // Đồng bộ cookie session cho Next.js Middleware
      try {
        const token = await user.getIdToken();
        document.cookie = `session=${token}; path=/; max-age=604800; SameSite=Lax`;
      } catch (_) {}

      // Nếu có tham số ?next=, tự động chuyển tiếp tới đúng trang được yêu cầu
      if (typeof window !== 'undefined') {
        const nextDest = new URLSearchParams(window.location.search).get('next');
        if (nextDest && nextDest !== '/login' && nextDest !== '/register') {
          window.location.href = nextDest;
          return;
        }
        if (window.location.pathname === '/login' || window.location.pathname === '/register') {
          window.location.href = '/';
          return;
        }
      }

      onClose();
    } catch (err) {
      console.warn("Lỗi đăng nhập:", err?.message || err);
      setError(typeof err === 'string' ? err : (err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu.'));
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

      // 3. Gửi email xác thực tài khoản
      try {
        await sendEmailVerification(user);
      } catch (e) {
        console.warn("Lỗi gửi email xác thực khi đăng ký:", e);
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

      // 5. Kiểm tra miễn trừ xác thực với tài khoản Admin / Test
      const isBypass = isBypassVerificationAccount(user.email);
      if (!isBypass) {
        setSuccessMessage(`Đăng ký thành công! Một email xác thực đã được gửi tới ${user.email}. Vui lòng mở Hộp thư (hoặc thư mục Spam) để nhấn liên kết kích hoạt.`);
        setView('verification-pending');
        await signOut(auth);
        return;
      }

      try {
        const token = await user.getIdToken();
        document.cookie = `session=${token}; path=/; max-age=604800; SameSite=Lax`;
      } catch (_) {}

      if (typeof window !== 'undefined') {
        const nextDest = new URLSearchParams(window.location.search).get('next');
        if (nextDest && nextDest !== '/login' && nextDest !== '/register') {
          window.location.href = nextDest;
          return;
        }
        if (window.location.pathname === '/login' || window.location.pathname === '/register') {
          window.location.href = '/';
          return;
        }
      }

      onClose();
    } catch (err) {
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
    if (!email || !password) {
      setError('Vui lòng quay lại trang Đăng nhập, nhập Email và Mật khẩu để hệ thống gửi lại email xác thực.');
      setView('login');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCred.user);
      await signOut(auth);
      setSuccessMessage(`Đã gửi lại email xác thực thành công tới ${email}! Vui lòng kiểm tra Hộp thư (hoặc Spam).`);
    } catch (err) {
      console.warn("Lỗi gửi lại email:", err);
      setError('Gửi lại email thất bại. Vui lòng kiểm tra lại tài khoản, mật khẩu hoặc thử lại sau ít phút.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    if (typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
      const nextDest = new URLSearchParams(window.location.search).get('next');
      if (nextDest && nextDest !== '/login' && nextDest !== '/register') {
        window.location.href = nextDest;
        return;
      }
      window.location.href = '/';
      return;
    }
    onClose();
  };

  if (!isOpen) return null;

  if (face2faPending) {
    return (
      <FaceAuthModal
        key="face-2fa-modal"
        isOpen={!!face2faPending}
        onClose={async () => {
          // Bắt buộc Đăng xuất Firebase nếu người dùng hủy/đóng modal 2FA mà chưa xác thực thành công!
          try {
            await signOut(auth);
          } catch (_) {}
          if (typeof window !== 'undefined' && face2faPending.user) {
            clearFace2FASession(face2faPending.user.uid);
          }
          useAppStore.getState().setUser(null);
          setFace2faPending(null);
          handleModalClose();
        }}
        mode="VERIFY"
        userEmail={face2faPending.email}
        targetDescriptor={face2faPending.faceDescriptor}
        onSuccess={async () => {
          // Xác thực 2FA thành công -> Đánh dấu phiên làm việc đã xác minh và chính thức cấp quyền Đăng nhập!
          if (typeof window !== 'undefined' && face2faPending.user) {
            setFace2FASession(face2faPending.user.uid);
            window.dispatchEvent(new CustomEvent('face2fa-verified'));
          }
          try {
            const userDoc = await getDoc(doc(db, "users", face2faPending.user.uid));
            const uData = userDoc.exists() ? userDoc.data() : {};
            const realDisplayName = uData.displayName || uData.name || face2faPending.user.displayName || 'Học viên';
            
            useAppStore.getState().setUser({
              uid: face2faPending.user.uid,
              email: face2faPending.email,
              displayName: realDisplayName,
            });
          } catch (_) {
            useAppStore.getState().setUser({
              uid: face2faPending.user.uid,
              email: face2faPending.email,
              displayName: face2faPending.user.displayName || 'Học viên',
            });
          }

          if (typeof window !== 'undefined') {
            const nextDest = new URLSearchParams(window.location.search).get('next');
            if (nextDest && nextDest !== '/login' && nextDest !== '/register') {
              window.location.href = nextDest;
              return;
            }
            if (window.location.pathname === '/login' || window.location.pathname === '/register') {
              window.location.href = '/';
              return;
            }
          }

          setFace2faPending(null);
          handleModalClose();
        }}
      />
    );
  }

  return (
    <AnimatePresence>
      <div key="auth-modal-container" className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleModalClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-bg-secondary rounded-2xl shadow-2xl p-8 border border-border-theme z-10 text-text-primary transition-all duration-300"
        >
          <button 
            onClick={handleModalClose}
            className="absolute -top-4 -right-4 w-10 h-10 bg-bg-tertiary hover:opacity-90 rounded-full flex items-center justify-center text-text-primary transition-colors shadow-lg border border-border-theme"
          >
            <X className="w-5 h-5 text-text-primary" />
          </button>

          <h2 className="text-2xl font-bold text-text-primary text-center mb-6">
            {view === 'login' ? 'Đăng nhập' : view === 'register' ? 'Đăng ký' : view === 'forgot-password' ? 'Khôi phục mật khẩu' : 'Xác thực tài khoản'}
          </h2>

          {error && (
            <div className="mb-6 p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-400 font-bold text-xs leading-relaxed text-center shadow-lg shadow-rose-500/10 backdrop-blur-md animate-in fade-in duration-200">
              ⚠️ {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-400 font-bold text-xs leading-relaxed text-center shadow-lg shadow-emerald-500/10 backdrop-blur-md animate-in fade-in duration-200">
              ✅ {successMessage}
            </div>
          )}

          {/* Login View */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="max-w-md mx-auto space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-accent-pink" />
                  </div>
                  <input 
                    type="email" 
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onInput={(e) => setEmail(e.target.value)}
                    placeholder="Email đăng nhập" 
                    className="w-full bg-bg-tertiary border border-border-theme rounded-xl py-3.5 pl-12 pr-4 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-pink transition-colors"
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-accent-pink" />
                  </div>
                  <input 
                    type="password" 
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onInput={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu" 
                    className="w-full bg-bg-tertiary border border-border-theme rounded-xl py-3.5 pl-12 pr-4 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-pink transition-colors"
                  />
                </div>
              </div>

              <div className="text-left">
                <button 
                  type="button" 
                  onClick={() => { setView('forgot-password'); setError(''); setSuccessMessage(''); }}
                  className="text-sky-500 hover:underline text-sm transition-colors"
                >
                  Quên mật khẩu
                </button>
              </div>

              <button disabled={loading} type="submit" className="w-full py-3.5 flex justify-center items-center gap-2 bg-accent-pink hover:bg-accent-pink/90 text-white font-bold rounded-xl shadow-lg shadow-accent-pink/20 transition-all active:scale-95 text-lg disabled:opacity-70 disabled:cursor-not-allowed">
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                Đăng nhập
              </button>

              <div className="text-center text-text-secondary text-sm mt-6">
                Không có tài khoản?{' '}
                <button type="button" onClick={() => {setView('register'); setError(''); setSuccessMessage('');}} className="text-sky-500 hover:underline transition-colors font-medium">
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
                  <h3 className="font-bold text-text-primary mb-4">1. Thông tin tài khoản</h3>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-accent-pink" />
                    </div>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email đăng nhập*" 
                      className="w-full bg-bg-tertiary border border-border-theme rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-pink transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-accent-pink" />
                    </div>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mật khẩu*" 
                      className="w-full bg-bg-tertiary border border-border-theme rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-pink transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-accent-pink" />
                    </div>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Xác nhận mật khẩu*" 
                      className="w-full bg-bg-tertiary border border-border-theme rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-pink transition-colors"
                    />
                  </div>
                </div>

                {/* Col 2 */}
                <div className="space-y-4">
                  <h3 className="font-bold text-text-primary mb-4">2. Thông tin cá nhân</h3>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-accent-pink" />
                    </div>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Họ và tên*" 
                      className="w-full bg-bg-tertiary border border-border-theme rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-pink transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="w-5 h-5 text-accent-pink" />
                    </div>
                    <input 
                      type="tel" 
                      placeholder="Số điện thoại (Tuỳ chọn)" 
                      className="w-full bg-bg-tertiary border border-border-theme rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-pink transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="max-w-sm mx-auto mt-8">
                <button disabled={loading} type="submit" className="w-full py-3.5 flex justify-center items-center gap-2 bg-accent-pink hover:bg-accent-pink/90 text-white font-bold rounded-xl shadow-lg shadow-accent-pink/20 transition-all active:scale-95 text-lg disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  Đăng ký tài khoản
                </button>
                
                <div className="text-center text-text-secondary text-sm mt-6">
                  Đã có tài khoản?{' '}
                  <button type="button" onClick={() => {setView('login'); setError(''); setSuccessMessage('');}} className="text-sky-500 hover:underline transition-colors font-medium">
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
                <p className="text-sm text-text-secondary">
                  Nhập địa chỉ email đăng ký tài khoản của bạn để nhận liên kết đặt lại mật khẩu qua thư.
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-accent-pink" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn" 
                  className="w-full bg-bg-tertiary border border-border-theme rounded-xl py-3.5 pl-12 pr-4 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-pink transition-colors"
                  required
                />
              </div>

              <button disabled={loading} type="submit" className="w-full py-3.5 flex justify-center items-center gap-2 bg-accent-pink hover:bg-accent-pink/90 text-white font-bold rounded-xl shadow-lg shadow-accent-pink/20 transition-all active:scale-95 text-lg disabled:opacity-70 disabled:cursor-not-allowed">
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                Gửi yêu cầu khôi phục
              </button>

              <div className="text-center text-text-secondary text-sm mt-6">
                <button type="button" onClick={() => {setView('login'); setError(''); setSuccessMessage('');}} className="text-sky-500 hover:underline transition-colors font-medium">
                  Quay lại Đăng nhập
                </button>
              </div>
            </form>
          )}

          {/* Verification Pending View */}
          {view === 'verification-pending' && (
            <div className="max-w-md mx-auto space-y-6 text-center select-none py-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-accent-pink/10 flex items-center justify-center text-accent-pink border border-accent-pink/20 shadow-lg">
                  <Mail className="w-8 h-8 animate-pulse text-accent-pink" />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-bold text-text-primary">Kiểm tra hộp thư của bạn</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Một liên kết xác thực đã được gửi tới:<br />
                  <strong className="text-accent-pink font-semibold">{email}</strong>
                </p>
                <p className="text-xs text-text-secondary">
                  Vui lòng nhấn vào liên kết trong email để kích hoạt tài khoản của bạn. Đừng quên kiểm tra thư mục Spam hoặc Junk nếu không nhận được.
                </p>
              </div>

              <div className="space-y-3 pt-6 border-t border-border-theme">
                <button 
                  onClick={() => {
                    setView('login');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="w-full py-3 bg-accent-pink hover:bg-accent-pink/90 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 text-sm"
                >
                  Tôi đã xác thực, đi tới Đăng nhập
                </button>

                <button 
                  onClick={handleResendVerification}
                  className="w-full py-3 bg-bg-tertiary hover:opacity-90 text-text-primary border border-border-theme text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Gửi lại email xác thực
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal Quét Face 2FA khi Đăng Nhập */}
      {face2faPending && (
        <FaceAuthModal
          key="face-2fa-modal"
          isOpen={!!face2faPending}
          onClose={() => setFace2faPending(null)}
          mode="VERIFY"
          userEmail={face2faPending.email}
          targetDescriptor={face2faPending.faceDescriptor}
          onSuccess={() => {
            setFace2faPending(null);
            onClose();
          }}
        />
      )}
    </AnimatePresence>
  );
}
