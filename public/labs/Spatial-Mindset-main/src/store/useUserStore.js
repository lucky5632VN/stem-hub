import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUserStore = create(
  persist(
    (set, get) => ({
      xp: 0,
      streak: 0,
      lastActiveDate: null,
      level: 1,
      
      gainXP: (amount) => {
        const oldLevel = get().level; // Fix W3: lưu level cũ TRƯỚC khi set
        const newXP = get().xp + amount;
        const newLevel = Math.floor(newXP / 1000) + 1;
        set({ xp: newXP, level: newLevel });
        return { leveledUp: newLevel > oldLevel }; // so sánh với level cũ đã lưu
      },
      
      setXP: (newXP) => {
        const newLevel = Math.floor(newXP / 1000) + 1;
        set({ xp: newXP, level: newLevel });
      },
      
      updateStreak: () => {
        const today = new Date().toISOString().split('T')[0];
        const lastDate = get().lastActiveDate;
        
        if (lastDate === today) return;
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastDate === yesterdayStr) {
          set((state) => ({ streak: state.streak + 1, lastActiveDate: today }));
        } else {
          set({ streak: 1, lastActiveDate: today });
        }
      },
      
      resetUser: () => set({ xp: 0, streak: 0, level: 1, lastActiveDate: null })
    }),
    {
      name: 'spatialmind-user-stats',
    }
  )
);

export default useUserStore;
