'use client';

import { Grid, Mail, Swords, Trophy, Sparkles, PanelLeftClose } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { playSound } from '@/lib/sound';

export default function Sidebar() {
  const pathname = usePathname();
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);

  const menuItems = [
    { icon: <Grid className="w-5 h-5 transition-transform group-hover:scale-110" />, label: 'Danh mục phòng lab', href: '/' },
    { icon: <Swords className="w-5 h-5 text-accent-pink transition-transform group-hover:scale-110" />, label: 'Đấu trường 1v1', href: '/dau-truong', highlight: true },
    { icon: <Trophy className="w-5 h-5 text-warning transition-transform group-hover:scale-110" />, label: 'Bảng xếp hạng ELO', href: '/xep-hang' },
    { icon: <Mail className="w-5 h-5 transition-transform group-hover:scale-110" />, label: 'Liên hệ', href: '/lien-he' },
  ];

  return (
    <aside className={`w-[260px] h-screen bg-bg-primary/95 backdrop-blur-xl flex flex-col fixed left-0 top-0 border-r border-border-theme z-40 transition-transform duration-300 ease-in-out select-none ${
      isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Logo Area */}
      <div className="h-[72px] flex items-center justify-between px-6 border-b border-border-theme">
        <Link href="/" className="group flex flex-col">
          <div className="flex items-center gap-2.5">
            <img 
              src="/icon.png?v=3" 
              alt="STEM HUB Logo" 
              className="w-7 h-7 rounded-full object-cover border border-cyan-400/40 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] group-hover:scale-110 transition-transform duration-300"
            />
            <div className="flex flex-col">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-pink via-accent-purple to-accent-cyan font-black uppercase tracking-wider text-xl leading-none">
                STEM HUB
              </span>
              <span className="text-[9px] text-text-secondary uppercase tracking-widest font-mono font-bold mt-0.5">
                VIRTUAL SCI-FI PORTAL
              </span>
            </div>
          </div>
        </Link>
        <button
          onClick={() => {
            playSound.click();
            toggleSidebar();
          }}
          className="p-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-secondary border border-transparent hover:border-border-theme transition-all active:scale-95 cursor-pointer"
          title="Thu gọn thanh menu"
        >
          <PanelLeftClose className="w-5 h-5 text-accent-pink" />
        </button>
      </div>

      {/* Menu Area */}
      <div className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
          Điều hướng chính
        </div>
        <ul className="space-y-1.5">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <li key={index}>
                <Link 
                  href={item.href}
                  prefetch={false}
                  className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 group relative border ${
                    isActive 
                      ? item.highlight
                        ? 'bg-accent-pink/15 text-text-primary font-bold border-accent-pink/50 shadow-md shadow-accent-pink/10'
                        : 'bg-bg-secondary text-text-primary font-bold border-border-theme shadow-md shadow-black/5 dark:shadow-none' 
                      : item.highlight
                        ? 'text-text-secondary hover:text-text-primary hover:bg-accent-pink/10 border-transparent hover:border-accent-pink/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary border-transparent hover:border-border-theme'
                  }`}
                >
                  {/* Left Active Marker Pill */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-accent-pink rounded-r-full shadow-[0_0_8px_rgba(240,57,140,0.6)]" />
                  )}
                  {item.icon}
                  <span className="text-sm tracking-wide">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer Branding Badge */}
      <div className="p-4 border-t border-border-theme text-center">
        <div className="p-3 rounded-xl bg-bg-secondary border border-border-theme">
          <div className="text-[11px] font-bold text-text-primary">STEM HUB v4.5</div>
          <div className="text-[9px] text-text-secondary font-mono mt-0.5">THPT Quỳnh Lưu 4</div>
        </div>
      </div>
    </aside>
  );
}
