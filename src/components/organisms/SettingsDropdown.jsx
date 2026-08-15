'use client';

import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { playSound } from '@/lib/sound';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  Sun, Moon, Volume2, VolumeX, MousePointer, 
  LogOut, User, Sparkles, Trophy, Shield
} from 'lucide-react';
import { AvatarFrame } from '@/components/atoms/AvatarFrame';
import STEMAvatarSVG from '@/components/atoms/STEMAvatarSVG';

export default function SettingsDropdown({ onClose }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const user = useAppStore((state) => state.user);
  const personalization = useAppStore((state) => state.personalization);
  const soundEnabled = useAppStore((state) => state.soundEnabled);
  const toggleSound = useAppStore((state) => state.toggleSound);
  const cursorType = useAppStore((state) => state.cursorType);
  const setCursorType = useAppStore((state) => state.setCursorType);
  const language = useAppStore((state) => state.language);
  const toggleLanguage = useAppStore((state) => state.toggleLanguage);

  const getFrameStyle = (frame) => {
    switch (frame) {
      case 'neon_fire':
        return 'border-2 border-rose-500 shadow-[0_0_10px_#f43f5e]';
      case 'cyan_tech':
        return 'border-2 border-cyan-400 shadow-[0_0_10px_#22d3ee]';
      case 'cosmic_nebula':
        return 'border-2 border-purple-500 shadow-[0_0_10px_#a855f7]';
      case 'blackhole_gravity':
        return 'border-2 border-indigo-700 shadow-[0_0_10px_#4338ca]';
      case 'antimatter_era':
        return 'border-2 border-fuchsia-500 shadow-[0_0_10px_#d946ef]';
      case 'multiverse_overlord':
        return 'border-2 border-cyan-400 shadow-[0_0_12px_#22d3ee,0_0_6px_#ec4899] animate-pulse';
      case 'top_1_sovereign':
        return 'border-2 border-amber-400 shadow-[0_0_12px_#fbbf24,0_0_4px_#ffffff] animate-pulse';
      case 'gold_vip':
        return 'border-2 border-amber-400 shadow-[0_0_10px_#fbbf24] animate-pulse';
      case 'top_100_silver':
        return 'border-2 border-slate-300 shadow-[0_0_10px_#cbd5e1]';
      default:
        return 'border border-pink-500/30';
    }
  };

  const getTitleLabel = (title) => {
    const titles = {
      apprentice: 'Tập sự STEM',
      alchemist_expert: 'Bậc thầy Hóa học',
      math_wizard: 'Chiến thần Toán học',
      physics_guru: 'Kỹ sư Cơ học',
      cosmic_explorer: 'Nhà thám hiểm Vũ trụ',
      nuclear_engineer: 'Kỹ sư Phản ứng hạt',
      quantum_master: 'Thạc sĩ Lượng tử',
      stem_legend: 'Huyền thoại STEM',
      multiverse_theorist: 'Nhà lập thuyết Đa vũ trụ',
      dimension_creator: 'Đấng kiến tạo Không gian',
      top_1_universe: 'Đại Đế STEM 👑',
      top_10_legend: 'Huyền thoại Đấu trường',
      top_100_elite: 'Đại Cao Thủ STEM'
    };
    return titles[title] || 'Học viên';
  };

  const handleLogout = async () => {
    playSound.click();
    await signOut(auth);
    onClose();
  };

  const handleCursorChange = async (type) => {
    playSound.click();
    setCursorType(type);
    
    // Lưu cài đặt con trỏ lên Firestore nếu người dùng đã đăng nhập
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, {
          'personalization.customCursor': type
        });
      } catch (err) {
        console.error("Lỗi khi lưu cài đặt con trỏ:", err);
      }
    }
  };

  const handleSoundToggle = async () => {
    playSound.click();
    toggleSound();
    
    // Lưu cài đặt âm thanh lên Firestore
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, {
          'personalization.soundEnabled': !soundEnabled
        });
      } catch (err) {
        console.error("Lỗi khi lưu cài đặt âm thanh:", err);
      }
    }
  };

  const handleLanguageToggle = () => {
    playSound.click();
    toggleLanguage();
  };

  const handleThemeChange = (newTheme) => {
    playSound.click();
    setTheme(newTheme);
  };

  const handleProfileClick = () => {
    playSound.click();
    router.push('/ho-so');
    onClose();
  };

  return (
    <div 
      className="absolute right-0 w-[340px] bg-bg-secondary backdrop-blur-2xl border border-border-theme rounded-2xl shadow-2xl p-5 z-[999] animate-in fade-in slide-in-from-top-3 duration-200 text-text-primary"
      style={{ top: '68px' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* User Info Header */}
      {user && (
        <div className="flex flex-col items-center border-b border-border-theme pb-4 mb-4 select-none">
          {/* Avatar with selected frame */}
          <div 
            onClick={() => {
              playSound.click();
              router.push('/ho-so?tab=personalization&subtab=character');
              onClose();
            }}
            className="relative group/avatar cursor-pointer animate-in fade-in zoom-in-50 duration-200"
            title="Thiết kế Avatar Chibi cá nhân"
          >
            <AvatarFrame frame={personalization.avatarFrame} className="w-16 h-16 text-2xl mb-2 transition-all duration-300 group-hover/avatar:scale-105">
              {personalization.avatarUrl === 'custom-avatar' ? (
                <STEMAvatarSVG parts={personalization.avatarParts} />
              ) : personalization.avatarUrl ? (
                personalization.avatarUrl.startsWith('http') || personalization.avatarUrl.startsWith('data:image/') ? (
                  <img src={personalization.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a1a1aa'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E"; }} />
                ) : (
                  <span className="select-none">{personalization.avatarUrl}</span>
                )
              ) : (
                user.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-8 h-8 text-text-primary" />
              )}
              
              {/* Edit overlay */}
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 flex items-center justify-center z-20">
                <span className="text-[8px] font-black text-white uppercase tracking-wider">Sửa</span>
              </div>
              
              {/* Level badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent-pink border-2 border-bg-secondary text-[10px] font-bold text-white flex items-center justify-center shadow-lg z-30">
                {personalization.level}
              </div>
            </AvatarFrame>
          </div>

          <div className="text-center flex flex-col items-center">
            <h4 className="text-text-primary font-semibold text-base leading-snug">{user.displayName || 'Học viên'}</h4>
            <span className="text-[10px] text-accent-pink font-bold px-2 py-0.5 bg-accent-pink/10 rounded-full inline-block mt-1 border border-accent-pink/20">
              {getTitleLabel(personalization.activeTitle)}
            </span>
            <button
              onClick={() => {
                playSound.click();
                router.push('/ho-so?tab=personalization&subtab=character');
                onClose();
              }}
              className="mt-2 text-[10px] font-bold text-accent-pink hover:opacity-80 transition-all flex items-center gap-1 bg-accent-pink/5 px-2.5 py-1 rounded-lg border border-accent-pink/20 active:scale-95 shadow-sm"
            >
              🎨 Thiết kế Avatar Chibi
            </button>
          </div>

          {/* EXP Progress bar */}
          <div className="w-full mt-3">
            <div className="flex justify-between text-[10px] text-text-secondary mb-1">
              <span>Tiến trình EXP</span>
              <span>{personalization.exp} / {personalization.nextLevelExp}</span>
            </div>
            <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden border border-border-theme">
              <div 
                className="h-full bg-gradient-to-r from-accent-pink to-accent-purple rounded-full transition-all duration-300"
                style={{ width: `${(personalization.exp / personalization.nextLevelExp) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Settings Options */}
      <div className="space-y-4 text-xs sm:text-sm text-text-primary">
        <h5 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 select-none">Cài đặt hệ thống</h5>

        {/* 1. Theme Switch */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-text-primary font-medium whitespace-nowrap">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-accent-pink" /> : <Sun className="w-4 h-4 text-warning" />}
            Chủ đề sáng/tối
          </span>
          <div className="flex bg-bg-tertiary p-0.5 rounded-lg border border-border-theme select-none">
            <button 
              onMouseEnter={playSound.hover}
              onClick={() => handleThemeChange('light')}
              className={`p-1 px-2.5 rounded-md transition-all text-xs font-semibold ${theme === 'light' ? 'bg-accent-pink text-white shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Sáng
            </button>
            <button 
              onMouseEnter={playSound.hover}
              onClick={() => handleThemeChange('dark')}
              className={`p-1 px-2.5 rounded-md transition-all text-xs font-semibold ${theme === 'dark' ? 'bg-accent-pink text-white shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Tối
            </button>
          </div>
        </div>

        {/* 2. Sound FX Toggle */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-text-primary font-medium whitespace-nowrap">
            {soundEnabled ? <Volume2 className="w-4 h-4 text-accent-pink" /> : <VolumeX className="w-4 h-4 text-text-secondary" />}
            Âm thanh hiệu ứng
          </span>
          <button 
            onMouseEnter={playSound.hover}
            onClick={handleSoundToggle}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${soundEnabled ? 'bg-accent-pink' : 'bg-bg-tertiary border border-border-theme'}`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${soundEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* 3. Custom Cursor Select */}
        <div className="space-y-1.5">
          <span className="flex items-center gap-2 text-text-primary font-medium whitespace-nowrap">
            <MousePointer className="w-4 h-4 text-accent-pink" />
            Con trỏ chuột tùy biến
          </span>
          <div className="grid grid-cols-3 gap-1 bg-bg-tertiary p-1 rounded-xl border border-border-theme select-none">
            {[
              { id: 'default', label: 'Thường' },
              { id: 'neon', label: 'Neon' },
              { id: 'target', label: 'Tâm ngắm' }
            ].map((cursor) => (
              <button
                key={cursor.id}
                onMouseEnter={playSound.hover}
                onClick={() => handleCursorChange(cursor.id)}
                className={`py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  cursorType === cursor.id 
                    ? 'bg-accent-pink text-white shadow-md' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {cursor.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Language Switch */}
        <div className="flex items-center justify-between border-b border-border-theme pb-4">
          <span className="flex items-center gap-2 text-text-primary font-medium whitespace-nowrap">
            <Sparkles className="w-4 h-4 text-accent-pink" />
            Ngôn ngữ
          </span>
          <button 
            onMouseEnter={playSound.hover}
            onClick={handleLanguageToggle}
            className="text-xs font-bold px-3 py-1 bg-bg-tertiary border border-border-theme rounded-lg text-text-primary hover:opacity-80 transition-all select-none"
          >
            {language === 'vi' ? 'Tiếng Việt' : 'English'}
          </button>
        </div>
      </div>

      {/* Buttons Footer */}
      <div className="mt-4 space-y-2">
        {user?.email?.toLowerCase() === 'admin123@gmail.com' && (
          <button 
            onMouseEnter={playSound.hover}
            onClick={() => {
              playSound.click();
              router.push('/admin');
              onClose();
            }}
            className="w-full py-2.5 bg-gradient-to-r from-accent-pink/20 to-accent-purple/20 hover:from-accent-pink hover:to-accent-purple text-accent-pink hover:text-white border border-accent-pink/30 hover:border-accent-pink text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98 animate-pulse hover:animate-none"
          >
            <Shield className="w-3.5 h-3.5" /> Vào Trang Quản Trị
          </button>
        )}
        <button 
          onMouseEnter={playSound.hover}
          onClick={handleProfileClick}
          className="w-full py-2.5 bg-bg-tertiary hover:opacity-90 border border-border-theme text-text-primary text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98"
        >
          <Trophy className="w-3.5 h-3.5 text-warning" /> Xem Hồ sơ Khoa học
        </button>
        
        <button 
          onMouseEnter={playSound.hover}
          onClick={handleLogout}
          className="w-full py-2.5 bg-danger/10 hover:bg-danger hover:text-white border border-danger/20 text-danger text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-98"
        >
          <LogOut className="w-3.5 h-3.5" /> Đăng xuất tài khoản
        </button>
      </div>
    </div>
  );
}
