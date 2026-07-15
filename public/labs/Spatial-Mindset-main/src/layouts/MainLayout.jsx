import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, Trophy, Flame, Bell, Command, User, LogIn, 
  PanelLeftClose, PanelLeftOpen, Sliders, Share2, 
  LayoutDashboard, Dna, Layers 
} from 'lucide-react';

import Navbar from '../components/Navbar';
import CommandPalette from '../components/CommandPalette';
import AuthModal from '../components/AuthModal';
import ProfileDashboard from '../components/ProfileDashboard';
import NotificationSettings from '../components/NotificationSettings';
import CommunityGallery from '../components/CommunityGallery';
import DailyChallenge from '../components/DailyChallenge';
import ExerciseBank from '../components/ExerciseBank';
import ParticleEffect from '../components/ParticleEffect';
import useUIStore from '../store/useUIStore';
import useSettingsStore from '../store/useSettingsStore';
import useUserStore from '../store/useUserStore';

export default function MainLayout() {
  const location = useLocation();
  const { theme, setTheme } = useSettingsStore();
  const { xp: realXP, streak: realStreak } = useUserStore();
  const {
    isSidebarCollapsed, setIsSidebarCollapsed,
    isProfileOpen, setIsProfileOpen,
    isNotificationOpen, setIsNotificationOpen,
    isGalleryOpen, setIsGalleryOpen,
    isAuthModalOpen, setIsAuthModalOpen,
    isCommandPaletteOpen, setIsCommandPaletteOpen,
    showDailyChallenge, setShowDailyChallenge,
    isExerciseBankOpen, setIsExerciseBankOpen,
    activeMode, setActiveMode,
    isExplorerOpen, setIsExplorerOpen,
    isShareOpen, setIsShareOpen,
  } = useUIStore();

  // Hide Navbar/Sidebar on certain routes (like workspace)
  const isWorkspace = location.pathname.includes('/workspace') || location.pathname.match(/\/problems\/\d+/);

  return (
    <div className={`min-h-screen w-full flex flex-col bg-[#020617] text-slate-100 font-sans ocean-gradient`}>
      
      {/* ── Global UI Overlays ── */}
      <ParticleEffect />
      
      <AnimatePresence>
        {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
        {isCommandPaletteOpen && <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />}
        {isProfileOpen && <ProfileDashboard isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} xp={realXP} streak={realStreak} />}
        {isNotificationOpen && <NotificationSettings isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />}
        {isGalleryOpen && <CommunityGallery isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />}
        {showDailyChallenge && <DailyChallenge isOpen={showDailyChallenge} onClose={() => setShowDailyChallenge(false)} />}
        {isExerciseBankOpen && <ExerciseBank isOpen={isExerciseBankOpen} onClose={() => setIsExerciseBankOpen(false)} />}
      </AnimatePresence>

      {/* ── Navbar ── */}
      {!isWorkspace && (
        <Navbar
          xp={realXP}
          streak={realStreak}
          theme={theme}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          onOpenExerciseBank={() => setIsExerciseBankOpen(true)}
          onOpenDailyChallenge={() => setShowDailyChallenge(true)}
          onOpenGallery={() => setIsGalleryOpen(true)}
          onNavigate={(target) => {
            if (target === 'login') setIsAuthModalOpen(true);
          }}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />
      )}

      {/* ── Main Content Area ── */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* ── Floating Sidebar (Optional, maybe only on Home/Playground) ── */}
      {!isWorkspace && location.pathname === '/' && (
        <FloatingSidebar />
      )}
    </div>
  );
}

// Extracting the Sidebar from App.jsx to a component
function FloatingSidebar() {
  const { theme } = useSettingsStore();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useUIStore();

  return (
    <motion.div
      initial={false}
      animate={{
        width: isSidebarCollapsed ? 80 : 380,
        x: 0,
        opacity: 1
      }}
      className="fixed left-6 z-50 aqua-glass rounded-[28px] overflow-hidden flex flex-col shadow-2xl border-white/5 group/sidebar transition-all duration-500 ease-in-out"
      style={{ top: '88px', height: 'calc(100vh - 100px)' }}
    >
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-500 hover:text-cyan-400 transition-all z-[70]"
      >
        {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>

      <div className="p-8 flex flex-col h-full overflow-hidden">
        <div className={`mb-10 flex items-center gap-4 transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 scale-90 invisible' : 'opacity-100 scale-100 visible'}`}>
          <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Box size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase leading-none">
              SpatialMind
            </h1>
            <p className="text-[10px] text-cyan-500/80 font-bold uppercase tracking-widest mt-1">
              v2.2 {theme === 'dark' ? 'HUD' : 'Light'} Edition
            </p>
          </div>
        </div>
        {/* Sidebar content would go here - for now it's a placeholder to show structure */}
        {!isSidebarCollapsed && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
             <p className="text-zinc-500 text-sm italic">Playground Controls Active</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
