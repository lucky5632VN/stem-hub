import React from 'react';
import useSettingsStore from '../../../store/useSettingsStore';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function AppearanceTab() {
  const { theme, setTheme } = useSettingsStore();
  const isDark = theme === 'dark';

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  // Helper function to update the HTML class for Tailwind dark mode
  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-1">Giao diện</h3>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Tùy chỉnh giao diện hiển thị của SpatialMind.
        </p>
      </div>

      <div className={`p-6 rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm`}>
        <h4 className="font-semibold mb-4">Chủ đề (Theme)</h4>
        <div className="grid grid-cols-3 gap-4">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => updateTheme(t.id)}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                theme === t.id
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500'
                  : isDark
                    ? 'border-zinc-800 hover:border-zinc-700 text-slate-400'
                    : 'border-zinc-200 hover:border-zinc-300 text-slate-600'
              }`}
            >
              <t.icon size={24} />
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
