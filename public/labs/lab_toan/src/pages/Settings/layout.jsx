import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { User, Palette, Box, Keyboard, ChevronLeft } from 'lucide-react';
import useSettingsStore from '../../store/useSettingsStore';

export default function SettingsLayout() {
  const { theme } = useSettingsStore();
  const location = useLocation();

  const isDark = theme === 'dark';

  const menuItems = [
    { path: '/settings/profile', label: 'Hồ sơ', icon: User },
    { path: '/settings/appearance', label: 'Giao diện', icon: Palette },
    { path: '/settings/workspace', label: 'Không gian 3D', icon: Box },
    { path: '/settings/shortcuts', label: 'Phím tắt', icon: Keyboard },
  ];

  return (
    <div className={`flex min-h-screen pt-14 ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar */}
      <aside className={`w-64 border-r hidden md:block ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <div className="p-6">
          <NavLink to="/" className="inline-flex items-center gap-2 text-sm text-cyan-500 hover:text-cyan-400 mb-8 font-medium">
            <ChevronLeft size={16} /> Quay lại
          </NavLink>
          <h2 className="text-xl font-bold mb-6">Cài đặt</h2>
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive 
                    ? (isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-900') 
                    : (isDark ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700')}
                `}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
