'use client';

import { Grid, Mail, Swords, Trophy } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { icon: <Grid className="w-5 h-5" />, label: 'Danh mục phòng lab', href: '/' },
    { icon: <Swords className="w-5 h-5 text-rose-400" />, label: 'Đấu trường 1v1', href: '/dau-truong', highlight: true },
    { icon: <Trophy className="w-5 h-5 text-amber-400" />, label: 'Bảng xếp hạng ELO', href: '/xep-hang' },
    { icon: <Mail className="w-5 h-5" />, label: 'Liên hệ', href: '/lien-he' },
  ];

  return (
    <aside className="w-[260px] h-screen bg-white/70 dark:bg-[#1c1e29]/75 backdrop-blur-md flex flex-col fixed left-0 top-0 border-r border-slate-200 dark:border-white/5 z-20 transition-all duration-300">
      {/* Logo Area */}
      <div className="h-[72px] flex items-center px-6 border-b border-slate-200 dark:border-white/5">
        <Link href="/" className="text-xl font-bold flex flex-col">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 font-extrabold uppercase tracking-widest text-lg">STEM ARENA</span>
          <span className="text-[8px] text-pink-400/60 uppercase tracking-wider mt-0.5 text-right font-mono font-bold">
            VIRTUAL PORTAL
          </span>
        </Link>
      </div>

      {/* Menu Area */}
      <div className="flex-1 py-6 px-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <li key={index}>
                <Link 
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border border-transparent group ${
                    isActive 
                      ? item.highlight
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 font-semibold border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                        : 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white font-medium' 
                      : item.highlight
                        ? 'text-rose-500 dark:text-rose-400 hover:text-white hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
