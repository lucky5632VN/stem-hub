'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login?tab=register');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070913] flex items-center justify-center text-pink-400 font-mono text-xs">
      Đang chuyển hướng tới Đăng ký...
    </div>
  );
}
