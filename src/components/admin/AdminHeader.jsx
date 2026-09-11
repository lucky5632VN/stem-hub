'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { playSound } from '@/lib/sound';
import { Clock, LogOut, ShieldCheck, ChevronRight, User, FileText } from 'lucide-react';
import { AvatarFrame } from '@/components/atoms/AvatarFrame';
import STEMAvatarSVG from '@/components/atoms/STEMAvatarSVG';
import AITransparencyModal from '@/components/organisms/AITransparencyModal';

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppStore((state) => state.user);
  const personalization = useAppStore((state) => state.personalization);
  const [timeStr, setTimeStr] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const hours = pad(d.getHours());
      const mins = pad(d.getMinutes());
      const secs = pad(d.getSeconds());
      const date = pad(d.getDate());
      const month = pad(d.getMonth() + 1);
      const year = d.getFullYear();
      setTimeStr(`${hours}:${mins}:${secs} - ${date}/${month}/${year}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getModuleTitle = () => {
    if (pathname === '/admin') return 'Bảng điều khiển';
    if (pathname?.includes('/students')) return 'Quản lý học sinh';
    if (pathname?.includes('/questions')) return 'Ngân hàng câu hỏi';
    if (pathname?.includes('/matches')) return 'Giám sát trận đấu';
    if (pathname?.includes('/stories')) return 'Kiểm duyệt Stories';
    if (pathname?.includes('/settings')) return 'Cấu hình hệ thống';
    if (pathname?.includes('/leaderboard')) return 'Giải đấu & Xếp hạng';
    return 'Admin';
  };

  const handleLogout = async () => {
    playSound.click();
    if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi tài khoản Admin không?")) {
      await signOut(auth);
      router.push('/');
    }
  };

  return (
    <>
      <header className="h-[76px] bg-[#0d0e15]/60 dark:bg-[#0c0d14]/75 backdrop-blur-md border-b border-[#1f2235] px-8 flex items-center justify-between sticky top-0 z-40 select-none">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-2 text-xs md:text-sm font-mono font-semibold tracking-wide">
          <span className="text-zinc-500">ADMIN</span>
          <ChevronRight className="w-4 h-4 text-zinc-650" />
          <span className="text-pink-400 font-bold filter drop-shadow-[0_0_6px_rgba(244,63,94,0.2)]">
            {getModuleTitle()}
          </span>
        </div>

        {/* Right Side: Live Clock, AI Transparency Button & Admin Info */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Nút AI Minh Bạch & Prompt Log dành riêng cho Admin */}
          <button
            onClick={() => { playSound.click(); setShowAiModal(true); }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/60 text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] cursor-pointer active:scale-95"
            title="Mở Hồ sơ AI Minh bạch & Trình Xuất Prompt Log Dự Án"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">🛡️ AI Minh Bạch & Prompt Log</span>
          </button>

          {/* Real-time Digital Clock */}
          <div className="hidden lg:flex items-center gap-2 bg-[#141622] px-4 py-2 rounded-xl border border-[#1f2235] text-xs font-mono font-bold text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
            <span>{timeStr || 'Đang kết nối...'}</span>
          </div>

          {/* Admin Info Profile */}
          {user && (
            <div className="flex items-center gap-3 border-l border-[#1f2235] pl-4 md:pl-6">
              <div className="flex flex-col text-right">
                <span className="text-xs font-black text-white leading-none font-mono">
                  {user.displayName || 'Admin'}
                </span>
                <span className="text-[9px] font-bold text-pink-500 mt-1 uppercase tracking-wider">
                  ADMIN HOẠT ĐỘNG
                </span>
              </div>
              
              <div className="relative w-10 h-10">
                <AvatarFrame frame={personalization.avatarFrame || 'default'} className="w-10 h-10 text-xs">
                  {personalization.avatarUrl === 'custom-avatar' ? (
                    <STEMAvatarSVG parts={personalization.avatarParts} />
                  ) : personalization.avatarUrl ? (
                    <img src={personalization.avatarUrl} alt="Admin" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-zinc-400" />
                  )}
                </AvatarFrame>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                title="Đăng xuất hệ thống"
                className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-450 hover:text-white rounded-xl border border-rose-500/20 hover:border-rose-400 transition-all cursor-pointer active:scale-90 ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Modal AI Minh Bạch & Prompt Log Exporter */}
      <AITransparencyModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />
    </>
  );
}
