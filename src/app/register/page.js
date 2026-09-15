'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { auth } from '@/lib/firebase';
import { Sparkles, UserPlus } from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') || '/';

  const user = useAppStore((state) => state.user);
  const isAuthOpen = useAppStore((state) => state.isAuthOpen);
  const openAuth = useAppStore((state) => state.openAuth);

  useEffect(() => {
    if (user || auth?.currentUser) {
      router.replace(nextParam.startsWith('/') ? nextParam : '/');
      return;
    }
    openAuth('register');
  }, [user, nextParam, openAuth, router]);

  return (
    <div className="min-h-[75vh] w-full flex items-center justify-center relative p-6 select-none">
      <div className="text-center p-8 max-w-md mx-auto bg-bg-secondary/60 border border-border-theme/70 backdrop-blur-md rounded-3xl shadow-xl">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent-pink/15 border border-accent-pink/30 flex items-center justify-center text-accent-pink shadow-lg shadow-accent-pink/20 animate-pulse">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-text-primary mb-2">Đăng ký thành viên STEM Hub</h2>
        <p className="text-xs text-text-secondary leading-relaxed mb-6">
          Tạo tài khoản học sinh để tham gia cộng đồng STEM Hub, khám phá phòng lab và thi đấu ELO.
        </p>
        {!isAuthOpen && (
          <button
            onClick={() => openAuth('register')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-pink hover:bg-accent-pink/90 text-white text-xs font-bold shadow-lg shadow-accent-pink/25 transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Mở cửa sổ Đăng ký</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[75vh]" />}>
      <RegisterContent />
    </Suspense>
  );
}
