// =====================================================
// SpatialMind — Navbar (LeetCode-style)
// =====================================================
// Sticky full-width header với:
//  - Logo + Brand name
//  - Menu: Problems, Contest, Discuss
//  - Search bar (trigger Command Palette Ctrl+K)
//  - Streak badge 🔥
//  - Notification bell với unread dot
//  - User avatar dropdown
// =====================================================

import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bell, 
  Flame, 
  LogIn, 
  CheckCheck, 
  User, 
  LayoutDashboard, 
  Settings, 
  Sun, 
  LogOut, 
  Zap, 
  Trophy, 
  ChevronDown,
  Moon,
  MessageSquare,
  BookOpen,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getRankInfo } from './GameHUD';

// ── Nav menu items ──
const NAV_ITEMS = [
  { id: 'problems',  label: 'Problems',  labelVi: 'Bài tập',    action: '/problems' },
  { id: 'contest',   label: 'Contest',   labelVi: 'Thi đấu',    action: '/contest' },
  { id: 'discuss',   label: 'Discuss',   labelVi: 'Thảo luận',  action: '/discuss' },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, text: 'Thử thách ngày mới đã sẵn sàng! Chinh phục ngay.', icon: '🎯', time: '5 phút trước', read: false },
  { id: 2, text: 'HieuIT vừa giải được bài toán "Hình chóp S.ABCD".', icon: '🏆', time: '1 giờ trước', read: false },
  { id: 3, text: 'Hệ thống vừa cập nhật tính năng Explorer Mode v3.0.', icon: '🚀', time: '2 giờ trước', read: true },
  { id: 4, text: 'Bạn đã đạt mốc 7 ngày Streak! Tiếp tục phát huy.', icon: '🔥', time: '1 ngày trước', read: true },
];

export default function Navbar({
  xp = 0,
  streak = 0,
  onOpenCommandPalette,
  onOpenNotifications,
  onOpenProfile,
  onOpenExerciseBank,
  onOpenDailyChallenge,
  onOpenGallery,
  theme = 'dark',
  onToggleTheme
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('spatialmind_notifications');
      return stored ? JSON.parse(stored) : MOCK_NOTIFICATIONS;
    } catch (e) {
      return MOCK_NOTIFICATIONS;
    }
  });
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  
  useEffect(() => {
    localStorage.setItem('spatialmind_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated, logout, userProfile } = useAuth();
  const { current: rank } = getRankInfo(xp);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Scroll shadow effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const displayName = user?.displayName
    || userProfile?.displayName
    || user?.email?.split('@')[0]
    || 'Guest';

  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-[100] h-14
          flex items-center
          transition-all duration-300
          ${scrolled
            ? 'backdrop-blur-xl border-b border-white/8 shadow-[0_1px_40px_rgba(0,0,0,0.4)]'
            : 'backdrop-blur-md border-b border-white/5'
          }
        `}
        style={{
          background: theme === 'dark'
            ? 'rgba(2, 6, 23, 0.88)'
            : 'rgba(248, 250, 252, 0.92)',
        }}
      >
        <div className="w-full max-w-screen-2xl mx-auto px-6 flex items-center gap-6 h-full">

          {/* ── LEFT: Logo + Brand ── */}
          <div className="flex items-center gap-5 flex-shrink-0">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <img
                src="/logo.png"
                alt="SpatialMind"
                className="h-8 w-8 object-contain rounded-lg group-hover:brightness-110 transition-all"
              />
              <span
                className="text-lg font-black tracking-tight hidden sm:block"
                style={{
                  background: 'linear-gradient(135deg, #22d3ee 0%, #4ade80 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                SpatialMind
              </span>
            </NavLink>

            <div className="h-5 w-px bg-white/10 hidden md:block" />

            {/* ── Nav menu items ── */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.action}
                  className={({ isActive }) => `
                    relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all group
                    ${isActive 
                      ? (theme === 'dark' ? 'text-slate-100' : 'text-slate-900') 
                      : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-black')}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <span className="relative z-10">{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-underline"
                          className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                          style={{ background: 'linear-gradient(90deg, #22d3ee, #6366f1)' }}
                          transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
                        />
                      )}
                      <span
                        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                      />
                    </>
                  )}
                </NavLink>
              ))}

              {/* RBAC: Teacher/Admin */}
              {(userProfile?.role === 'teacher' || userProfile?.role === 'admin') && (
                <NavLink
                  to="/problems/create"
                  className="ml-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all text-cyan-500 hover:bg-cyan-500/10 border border-cyan-500/20"
                >
                  + Tạo bài tập
                </NavLink>
              )}

              {/* Admin Center */}
              {userProfile?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  className="ml-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all text-violet-400 hover:bg-violet-500/10 border border-violet-500/20"
                >
                  Admin Center
                </NavLink>
              )}
            </nav>
          </div>

          <div className="flex-1" />

          {/* ── RIGHT: Tools ── */}
          <div className="flex items-center gap-1.5">

            {/* Search */}
            <button
              onClick={onOpenCommandPalette}
              className={`
                hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl
                border transition-all duration-200 group
                hover:border-cyan-500/40
                ${theme === 'dark' ? 'bg-white/[0.04] border-white/8' : 'bg-black/[0.04] border-black/8'}
              `}
            >
              <Search size={14} className="text-slate-500 group-hover:text-cyan-400" />
              <span className="text-xs text-slate-500">Search...</span>
              <kbd className="hidden lg:flex px-1.5 py-0.5 rounded text-[9px] font-bold border border-white/10 text-slate-500">Ctrl K</kbd>
            </button>

            {/* Streak */}
            <button
              onClick={() => navigate('/contest')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-orange-500/10 transition-all group"
            >
              <Flame
                size={17}
                className={streak > 0 ? 'text-orange-400 animate-pulse' : 'text-slate-600'}
              />
              <span className={`text-sm font-black ${streak > 0 ? 'text-orange-400' : 'text-slate-500'}`}>
                {streak}
              </span>
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(v => !v)}
                className="relative p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-slate-200 transition-all"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-[#020617]" />
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <NotificationPanel
                    notifications={notifications}
                    onMarkAllRead={markAllRead}
                    onOpenSettings={onOpenNotifications}
                    theme={theme}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* User Dropdown */}
            <div className="relative ml-1" ref={dropdownRef}>
              {isAuthenticated ? (
                <button
                  onClick={() => setIsDropdownOpen(v => !v)}
                  className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl hover:bg-white/5 transition-all group"
                >
                  <div className="relative">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt={displayName} className="w-7 h-7 rounded-full object-cover ring-2 ring-cyan-500/30" />
                    ) : (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white ring-2 ring-cyan-500/30" style={{ background: `linear-gradient(135deg, ${rank.color}88, #6366f1)` }}>
                        {avatarInitial}
                      </div>
                    )}
                  </div>
                  <ChevronDown size={13} className={`text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-1.5 rounded-xl font-bold text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20"
                >
                  Đăng nhập
                </button>
              )}

              <AnimatePresence>
                {isDropdownOpen && isAuthenticated && (
                  <UserDropdown
                    user={user}
                    userProfile={userProfile}
                    rank={rank}
                    displayName={displayName}
                    xp={xp}
                    theme={theme}
                    onProfile={onOpenProfile}
                    onOpenSettings={() => { setIsDropdownOpen(false); navigate('/settings/appearance'); }}
                    onLogout={() => { logout(); setIsDropdownOpen(false); navigate('/'); }}
                    onToggleTheme={onToggleTheme}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>
      <div className="h-14 flex-shrink-0" />
    </>
  );
}

function NotificationPanel({ notifications, onMarkAllRead, onOpenSettings, theme }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      className="absolute right-0 top-[calc(100%+8px)] w-80 rounded-2xl overflow-hidden shadow-2xl z-[200] border border-white/10"
      style={{ background: theme === 'dark' ? 'rgba(15,23,42,0.98)' : 'rgba(255,255,255,0.98)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <span className="text-sm font-black">Thông báo</span>
        <button onClick={onMarkAllRead} className="text-[10px] font-bold text-cyan-500 hover:text-cyan-400 flex items-center gap-1">
          <CheckCheck size={11} /> Đọc tất cả
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {notifications.map((notif) => (
          <div key={notif.id} className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 ${!notif.read ? 'bg-cyan-500/5' : ''}`}>
            <span className="text-base">{notif.icon}</span>
            <div className="flex-1">
              <p className={`text-xs ${!notif.read ? 'text-white' : 'text-slate-400'}`}>{notif.text}</p>
              <p className="text-[9px] text-slate-500 mt-1">{notif.time}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function UserDropdown({ user, userProfile, rank, displayName, xp, theme, onProfile, onToggleTheme, onOpenSettings, onLogout }) {
  const menuItems = [
    { icon: User,          label: 'Hồ sơ cá nhân',    action: onProfile },
    { icon: LayoutDashboard, label: 'Dashboard',       action: onProfile },
    { icon: Settings,      label: 'Cài đặt',           action: onOpenSettings },
    { icon: theme === 'dark' ? Sun : Moon, label: 'Đổi giao diện', action: onToggleTheme },
    { divider: true },
    { icon: LogOut,        label: 'Đăng xuất',         action: onLogout, danger: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      className="absolute right-0 top-[calc(100%+8px)] w-64 rounded-2xl overflow-hidden shadow-2xl z-[200] border border-white/10"
      style={{ background: theme === 'dark' ? 'rgba(15,23,42,0.98)' : 'rgba(255,255,255,0.98)' }}
    >
      <div className="p-4 border-b border-white/5 bg-gradient-to-br from-cyan-500/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white" style={{ background: `linear-gradient(135deg, ${rank.color}, #6366f1)` }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-black truncate max-w-[140px]">{displayName}</p>
            <p className="text-[10px] font-bold" style={{ color: rank.color }}>{rank.emoji} {rank.name}</p>
          </div>
        </div>
      </div>
      <div className="py-1">
        {menuItems.map((item, idx) => item.divider ? (
          <div key={idx} className="my-1 border-t border-white/5" />
        ) : (
          <button
            key={idx}
            onClick={item.action}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-all ${item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <item.icon size={15} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
