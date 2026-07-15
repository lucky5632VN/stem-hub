import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'dark', // 'light', 'dark', 'system'
      setTheme: (theme) => set({ theme }),

      // Workspace settings
      showGrid: true,
      setShowGrid: (showGrid) => set({ showGrid }),
      showAxes: true,
      setShowAxes: (showAxes) => set({ showAxes }),
      antiAliasing: true,
      setAntiAliasing: (antiAliasing) => set({ antiAliasing }),
      shadows: true,
      setShadows: (shadows) => set({ shadows }),
      backgroundColor: '#020617', // Default dark
      setBackgroundColor: (backgroundColor) => set({ backgroundColor }),

      // Shortcuts
      shortcuts: {
        draw_line: 'l',
        draw_plane: 'p',
        select_vertex: 'v',
      },
      setShortcut: (action, key) =>
        set((state) => ({
          shortcuts: { ...state.shortcuts, [action]: key },
        })),
    }),
    {
      name: 'spatialmind-settings',
    }
  )
);

export default useSettingsStore;
