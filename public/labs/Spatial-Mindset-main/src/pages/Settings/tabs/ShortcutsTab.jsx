import React, { useState } from 'react';
import useSettingsStore from '../../../store/useSettingsStore';
import { Keyboard, AlertCircle } from 'lucide-react';

export default function ShortcutsTab() {
  const { theme, shortcuts, setShortcut } = useSettingsStore();
  const isDark = theme === 'dark';
  
  const [editingAction, setEditingAction] = useState(null);
  const [conflict, setConflict] = useState(null);

  const handleKeyDown = (e, action) => {
    e.preventDefault();
    const key = e.key.toLowerCase();
    
    // Check conflict
    const existingAction = Object.keys(shortcuts).find(a => shortcuts[a] === key && a !== action);
    if (existingAction) {
      setConflict({ key, action: existingAction });
      setTimeout(() => setConflict(null), 3000);
      setEditingAction(null);
      return;
    }
    
    setShortcut(action, key);
    setEditingAction(null);
  };

  const actionLabels = {
    draw_line: 'Vẽ đoạn thẳng',
    draw_plane: 'Dựng mặt phẳng',
    select_vertex: 'Chọn đỉnh'
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-1">Cấu hình phím tắt</h3>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Thao tác nhanh trên không gian 3D bằng bàn phím.
        </p>
      </div>

      {conflict && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm">
          <AlertCircle size={16} />
          <span>Phím <b>{conflict.key.toUpperCase()}</b> đã được gán cho "{actionLabels[conflict.action]}".</span>
        </div>
      )}

      <div className={`rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm overflow-hidden`}>
        <div className={`grid grid-cols-2 p-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'} font-semibold text-sm`}>
          <div>Hành động</div>
          <div>Phím tắt</div>
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {Object.entries(shortcuts).map(([action, key]) => (
            <div key={action} className="grid grid-cols-2 p-4 items-center hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors">
              <div className="text-sm">{actionLabels[action] || action}</div>
              <div>
                {editingAction === action ? (
                  <input
                    autoFocus
                    type="text"
                    className="w-20 px-3 py-1 bg-cyan-500/10 border border-cyan-500 text-cyan-500 rounded text-center focus:outline-none animate-pulse"
                    value="Bấm phím..."
                    readOnly
                    onKeyDown={(e) => handleKeyDown(e, action)}
                    onBlur={() => setEditingAction(null)}
                  />
                ) : (
                  <button
                    onClick={() => setEditingAction(action)}
                    className={`w-10 h-8 flex items-center justify-center rounded border ${isDark ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700' : 'bg-slate-100 border-slate-300 hover:bg-slate-200'} transition-colors font-mono font-bold uppercase`}
                  >
                    {key}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
