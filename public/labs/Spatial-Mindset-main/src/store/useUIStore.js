import { create } from 'zustand';

const useUIStore = create((set) => ({
  isSidebarCollapsed: false,
  setIsSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  
  isProfileOpen: false,
  setIsProfileOpen: (open) => set({ isProfileOpen: open }),
  
  isNotificationOpen: false,
  setIsNotificationOpen: (open) => set({ isNotificationOpen: open }),
  
  isGalleryOpen: false,
  setIsGalleryOpen: (open) => set({ isGalleryOpen: open }),
  
  isAuthModalOpen: false,
  setIsAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
  
  isCommandPaletteOpen: false,
  setIsCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  
  isExplorerOpen: false,
  setIsExplorerOpen: (open) => set({ isExplorerOpen: open }),
  
  isShareOpen: false,
  setIsShareOpen: (open) => set({ isShareOpen: open }),
  
  showDailyChallenge: false,
  setShowDailyChallenge: (show) => set({ showDailyChallenge: show }),
  
  isExerciseBankOpen: false,
  setIsExerciseBankOpen: (open) => set({ isExerciseBankOpen: open }),
  
  activeMode: 'GEOMETRY',
  setActiveMode: (mode) => set({ activeMode: mode }),
  
  xp: 0,
  setXP: (xp) => set({ xp }),
  
  streak: 0,
  setStreak: (streak) => set({ streak }),
}));

export default useUIStore;
