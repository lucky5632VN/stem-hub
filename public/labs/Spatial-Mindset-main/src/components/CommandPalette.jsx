import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import {
  Search, Sparkles, Triangle, Compass,
  PenTool, ArrowRight, CornerDownLeft
} from 'lucide-react';
import './CommandPalette.css'; // Add a little css for cmdk styling

const COMMAND_CATEGORIES = {
  ai: { label: 'AI Gợi ý', icon: Sparkles, color: '#22d3ee' },
  geometry: { label: 'Hình học', icon: Triangle, color: '#a78bfa' },
  navigate: { label: 'Điều hướng', icon: Compass, color: '#34d399' },
  tools: { label: 'Công cụ', icon: PenTool, color: '#fbbf24' },
};

export default function CommandPalette({
  isOpen,
  onClose,
  onAction,
  geometryData = null,
  currentMode = 'geometry',
}) {
  const navigate = useNavigate();

  // ── Keyboard shortcut to open (Ctrl+K) ──
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose();
        else onAction?.({ type: 'open_palette' });
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, onClose, onAction]);

  const runCommand = (action) => {
    onClose();
    action();
  };

  const baseCommands = [
    {
      id: 'ai-hint',
      category: 'ai',
      label: 'Gợi ý bước tiếp theo',
      description: 'AI phân tích hình và đưa ra gợi ý Socratic',
      shortcut: 'H',
      action: () => onAction?.({ type: 'ai-hint' }),
    },
    {
      id: 'ai-draw-height',
      category: 'ai',
      label: 'Kẻ đường cao từ đỉnh xuống đáy',
      description: 'AI tự xác định đỉnh cao nhất và vẽ đường cao',
      action: () => onAction?.({ type: 'ai-draw', element: 'height' }),
    },
    {
      id: 'ai-angle',
      category: 'ai',
      label: 'Tính góc giữa hai mặt phẳng',
      description: 'Chọn 2 mặt phẳng → AI tính góc nhị diện',
      action: () => onAction?.({ type: 'ai-calculate', calc: 'dihedral-angle' }),
    },
    {
      id: 'nav-challenge',
      category: 'navigate',
      label: 'Mở Daily Challenge',
      description: 'Thử thách hình học hàng ngày',
      shortcut: 'D',
      action: () => navigate('/contest'),
    },
    {
      id: 'nav-gallery',
      category: 'navigate',
      label: 'Thư viện Cộng đồng',
      description: 'Xem mô hình 3D từ cộng đồng',
      shortcut: 'G',
      action: () => navigate('/discuss'),
    },
    {
      id: 'nav-profile',
      category: 'navigate',
      label: 'Hồ sơ cá nhân',
      description: 'XP, Rank, và thống kê',
      action: () => navigate('/settings/profile'),
    },
    {
      id: 'nav-settings',
      category: 'navigate',
      label: 'Cài đặt giao diện',
      description: 'Đổi Theme, Light/Dark mode',
      action: () => navigate('/settings/appearance'),
    },
    {
      id: 'tool-reset-camera',
      category: 'tools',
      label: 'Reset camera',
      description: 'Đặt lại góc nhìn mặc định',
      shortcut: 'R',
      action: () => onAction?.({ type: 'camera', action: 'reset' }),
    },
    {
      id: 'tool-toggle-grid',
      category: 'tools',
      label: 'Bật/tắt lưới tọa độ',
      description: 'Hiển thị hoặc ẩn lưới Oxyz',
      action: () => onAction?.({ type: 'toggle', target: 'grid' }),
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <Command.Dialog 
          open={isOpen} 
          onOpenChange={onClose}
          className="fixed inset-0 z-[600] flex items-start justify-center pt-[15%] bg-black/50 backdrop-blur-sm"
          label="Global Command Menu"
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 30, stiffness: 500 }}
            className="w-full max-w-2xl"
          >
            <div
              className="rounded-2xl overflow-hidden cmdk-container"
              style={{
                background: 'linear-gradient(145deg, rgba(2,6,23,0.98), rgba(15,23,42,0.98))',
                border: '1px solid rgba(34,211,238,0.15)',
                boxShadow: '0 0 80px rgba(34,211,238,0.06), 0 25px 80px rgba(0,0,0,0.6)',
              }}
            >
              <div className="flex items-center gap-3 px-5 border-b border-white/5">
                <Search size={18} className="text-slate-500 shrink-0" />
                <Command.Input 
                  autoFocus 
                  placeholder="Gõ lệnh hoặc tìm kiếm... (ví dụ: 'kẻ đường cao', 'hồ sơ')"
                  className="flex-1 bg-transparent py-4 text-white text-sm placeholder-slate-500 outline-none border-none focus:ring-0"
                />
              </div>

              <Command.List className="max-h-[400px] overflow-y-auto py-2 custom-scrollbar">
                <Command.Empty className="py-12 text-center text-slate-500">
                  <Search size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold">Không tìm thấy lệnh phù hợp</p>
                </Command.Empty>

                <Command.Group heading="AI & Gợi ý" className="px-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">
                  {baseCommands.filter(c => c.category === 'ai').map((cmd) => (
                    <CommandItem key={cmd.id} cmd={cmd} onSelect={() => runCommand(cmd.action)} />
                  ))}
                </Command.Group>

                <Command.Group heading="Điều hướng" className="px-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">
                  {baseCommands.filter(c => c.category === 'navigate').map((cmd) => (
                    <CommandItem key={cmd.id} cmd={cmd} onSelect={() => runCommand(cmd.action)} />
                  ))}
                </Command.Group>

                <Command.Group heading="Công cụ" className="px-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">
                  {baseCommands.filter(c => c.category === 'tools').map((cmd) => (
                    <CommandItem key={cmd.id} cmd={cmd} onSelect={() => runCommand(cmd.action)} />
                  ))}
                </Command.Group>
              </Command.List>

              <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-black/20">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-[10px] text-slate-600 font-bold">
                    <CornerDownLeft size={10} /> Thực hiện
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-600 font-bold">
                    ↑↓ Di chuyển
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-600 font-bold">
                    Esc Đóng
                  </span>
                </div>
                <span className="text-[9px] text-slate-700 font-bold uppercase tracking-widest">
                  SpatialMind Command
                </span>
              </div>
            </div>
          </motion.div>
        </Command.Dialog>
      )}
    </AnimatePresence>
  );
}

function CommandItem({ cmd, onSelect }) {
  const cat = COMMAND_CATEGORIES[cmd.category] || COMMAND_CATEGORIES.tools;
  const Icon = cat.icon;

  return (
    <Command.Item
      onSelect={onSelect}
      className="cmdk-item flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer text-left transition-all text-slate-300 aria-selected:bg-cyan-500/10 aria-selected:text-white"
    >
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{
          background: `${cat.color}15`,
          border: `1px solid ${cat.color}25`,
        }}
      >
        <Icon size={14} style={{ color: cat.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{cmd.label}</span>
          {cmd.category === 'ai' && (
            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
              AI
            </span>
          )}
        </div>
        {cmd.description && (
          <p className="text-[11px] text-slate-500 truncate mt-0.5">{cmd.description}</p>
        )}
      </div>

      {cmd.shortcut && (
        <kbd className="flex-shrink-0 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-slate-500">
          {cmd.shortcut}
        </kbd>
      )}
    </Command.Item>
  );
}
