'use client';

import { 
  LayoutDashboard, Users, BookOpen, Swords, 
  MessageSquare, Settings, Trophy, ArrowLeft, Shield, FileText
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { playSound } from '@/lib/sound';

export default function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Bảng tổng quan', href: '/admin' },
    { icon: <Users className="w-5 h-5 text-indigo-400" />, label: 'Quản lý học sinh', href: '/admin/students' },
    { icon: <BookOpen className="w-5 h-5 text-cyan-400" />, label: 'Ngân hàng câu hỏi', href: '/admin/questions' },
    { icon: <FileText className="w-5 h-5 text-purple-400" />, label: 'Quản lý đề thi', href: '/admin/exams' },
    { icon: <Swords className="w-5 h-5 text-rose-400" />, label: 'Giám sát trận đấu', href: '/admin/matches' },
    { icon: <MessageSquare className="w-5 h-5 text-emerald-400" />, label: 'Kiểm duyệt Stories', href: '/admin/stories' },
    { icon: <Settings className="w-5 h-5 text-amber-400" />, label: 'Cấu hình hệ thống', href: '/admin/settings' },
    { icon: <Trophy className="w-5 h-5 text-yellow-400" />, label: 'Giải đấu & Xếp hạng', href: '/admin/leaderboard' },
    { icon: <Shield className="w-5 h-5 text-teal-400" />, label: 'Nhật ký hoạt động', href: '/admin/logs' },
  ];

  return (
    <aside className="w-[76px] lg:w-[260px] h-screen bg-[#0d0e15]/90 dark:bg-[#0c0d14]/95 backdrop-blur-xl flex flex-col fixed left-0 top-0 border-r border-[#1f2235] z-50 transition-all duration-300">
      {/* Brand Logo & Admin Badge */}
      <div className="h-[76px] flex flex-col justify-center items-center lg:items-start px-3 lg:px-6 border-b border-[#1f2235] relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-xl pointer-events-none" />
        
        <Link href="/" className="flex items-center gap-2 group">
          <Shield className="w-6 h-6 text-pink-500 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse shrink-0" />
          <div className="hidden lg:flex flex-col">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 font-black uppercase tracking-widest text-base font-mono">
              STEM ADMIN
            </span>
            <span className="text-[8px] text-pink-400/80 uppercase tracking-widest font-mono font-black mt-0.5">
              HỆ THỐNG QUẢN TRỊ
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-6 px-2 lg:px-4 overflow-y-auto space-y-1">
        <ul className="space-y-1.5">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <li key={index}>
                <Link 
                  href={item.href}
                  onClick={() => playSound.click()}
                  className={`flex items-center justify-center lg:justify-start gap-3.5 px-3 lg:px-4 py-3 rounded-xl transition-all duration-200 border group relative ${
                    isActive 
                      ? 'bg-pink-500/10 text-white font-bold border-pink-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                      : 'text-zinc-400 border-transparent hover:text-white hover:bg-white/5'
                  }`}
                  title={item.label}
                >
                  {/* Active Indicator Line */}
                  {isActive && (
                    <span className="absolute left-0 top-1/4 w-[3px] h-1/2 bg-pink-500 rounded-r-md filter drop-shadow-[0_0_5px_#ec4899]" />
                  )}
                  
                  <div className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-pink-500' : 'text-zinc-450'} shrink-0`}>
                    {item.icon}
                  </div>
                  
                  <span className="hidden lg:inline text-xs sm:text-sm font-medium tracking-wide">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Back to Portal / Logout Area */}
      <div className="p-4 border-t border-[#1f2235] bg-[#090a0f]/50">
        <Link
          href="/"
          onClick={() => playSound.click()}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition-all border border-zinc-700/50 hover:border-zinc-650 active:scale-95 shadow-lg"
          title="Quay lại Cổng Học Sinh"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span className="hidden lg:inline whitespace-nowrap">Quay lại Cổng Học Sinh</span>
        </Link>
      </div>
    </aside>
  );
}
