'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { auth } from '@/lib/firebase';
import { ShieldCheck, LogIn } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') || '/';
  const tabParam = searchParams.get('tab') || searchParams.get('view') || 'login';

  const user = useAppStore((state) => state.user);
  const isAuthOpen = useAppStore((state) => state.isAuthOpen);
  const openAuth = useAppStore((state) => state.openAuth);

  useEffect(() => {
    // Nếu học sinh đã đăng nhập, tự động chuyển tiếp tới trang yêu cầu
    if (user || auth?.currentUser) {
      router.replace(nextParam.startsWith('/') ? nextParam : '/');
      return;
    }
    // Mở đúng giao diện đăng nhập / đăng ký nguyên bản duy nhất của hệ thống
    openAuth(tabParam === 'register' ? 'register' : 'login');
  }, [user, nextParam, tabParam, openAuth, router]);

  return (
    <div className="min-h-[75vh] w-full flex items-center justify-center relative p-6 select-none">
      <div className="text-center p-8 max-w-md mx-auto bg-bg-secondary/60 border border-border-theme/70 backdrop-blur-md rounded-3xl shadow-xl">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent-pink/15 border border-accent-pink/30 flex items-center justify-center text-accent-pink shadow-lg shadow-accent-pink/20 animate-pulse">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-text-primary mb-2">Cổng Xác thực STEM Hub</h2>
        <p className="text-xs text-text-secondary leading-relaxed mb-6">
          Vui lòng hoàn tất đăng nhập hoặc tạo tài khoản để truy cập các tính năng bảo mật và phòng thí nghiệm ảo.
        </p>
        {!isAuthOpen && (
          <button
            onClick={() => openAuth('login')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-pink hover:bg-accent-pink/90 text-white text-xs font-bold shadow-lg shadow-accent-pink/25 transition-all active:scale-95 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Mở cửa sổ Đăng nhập</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[75vh]" />}>
      <LoginContent />
    </Suspense>
  );
}
