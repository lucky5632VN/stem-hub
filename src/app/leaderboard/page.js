'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeaderboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/xep-hang');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070913] flex items-center justify-center text-cyan-400 font-mono text-xs">
      Đang chuyển hướng tới Bảng xếp hạng...
    </div>
  );
}
