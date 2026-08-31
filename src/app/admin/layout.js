'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { playSound } from '@/lib/sound';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Đang khởi tạo cổng bảo mật...');

  useEffect(() => {
    setStatusMsg('Đang kiểm tra thông tin phiên đăng nhập...');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setStatusMsg('Phát hiện truy cập trái phép. Đang chuyển hướng...');
        setIsAdmin(false);
        setTimeout(() => {
          router.push('/');
        }, 1200);
        return;
      }

      setStatusMsg('Đang xác thực quyền Admin...');
      
      // Kiểm tra email admin cứng trước
      if (firebaseUser.email?.toLowerCase() === 'admin123@gmail.com') {
        playSound.success();
        setIsAdmin(true);
        setCheckingAuth(false);
        return;
      }

      // Kiểm tra thuộc tính role: 'admin' từ Firestore
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists() && docSnap.data().role === 'admin') {
          playSound.success();
          setIsAdmin(true);
        } else {
          setStatusMsg('Tài khoản không có quyền Admin. Đang quay lại trang chủ...');
          playSound.click();
          setIsAdmin(false);
          setTimeout(() => {
            router.push('/');
          }, 1500);
        }
      } catch (err) {
        console.error("Lỗi xác thực quyền Admin:", err);
        setStatusMsg('Lỗi kết nối cơ sở dữ liệu. Đang thử lại...');
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Giao diện màn hình chờ tải bảo mật (Neon Loading Gate)
  if (checkingAuth || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#07080d] flex flex-col items-center justify-center relative font-mono text-zinc-300 select-none overflow-hidden">
        {/* Subtle cyber grid grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,20,32,0.6)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(18,20,32,0.6)_1px,_transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        
        {/* Glowing aura */}
        <div className="absolute w-[500px] h-[500px] rounded-full bg-pink-500/5 blur-[120px] pointer-events-none animate-pulse" />

        <div className="z-10 flex flex-col items-center max-w-md px-6 text-center">
          {/* Neon Portal Lock Icon */}
          <div className="w-20 h-20 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center mb-6 text-pink-500 shadow-[0_0_30px_rgba(244,63,94,0.15)] animate-[pulse_2s_infinite]">
            <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
          </div>

          <h2 className="text-xl font-black text-white tracking-widest uppercase mb-2">
            STEM CONTROL CENTER
          </h2>
          <div className="h-[2px] w-36 bg-gradient-to-r from-transparent via-pink-500 to-transparent mb-4" />
          
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider animate-pulse">
            {statusMsg}
          </p>

          <span className="text-[9px] text-zinc-650 font-bold mt-8 block">
            SECURE PORTAL V2.0 &bull; SSL PROTECTED
          </span>
        </div>
      </div>
    );
  }

  // Khi đã xác thực quyền Admin thành công
  return (
    <div className="flex min-h-screen bg-[#07080d] text-zinc-200 relative font-sans overflow-x-hidden">
      {/* Background Neon Glow Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-pink-500/5 to-transparent rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-600/5 to-transparent rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Admin Navigation Sidebar */}
      <AdminSidebar />
      
      {/* Main Content Area */}
      <div className="admin-main-content min-w-0 flex flex-col min-h-screen transition-all duration-300 relative z-10">
        <AdminHeader />
        
        <main className="flex-1 p-8 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
