import React from 'react';
import useSettingsStore from '../../../store/useSettingsStore';
import { Switch } from '../../../components/ui/switch';

export default function WorkspaceTab() {
  const { 
    theme,
    showGrid, setShowGrid,
    showAxes, setShowAxes,
    antiAliasing, setAntiAliasing,
    shadows, setShadows,
    backgroundColor, setBackgroundColor
  } = useSettingsStore();

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-1">Không gian làm việc</h3>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Tùy chỉnh các cài đặt cho Canvas 3D.
        </p>
      </div>

      {/* Hiển thị */}
      <div className={`rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'} font-semibold`}>
          Hiển thị (Display)
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Lưới tọa độ (Grid)</div>
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hiển thị mặt phẳng lưới nền.</div>
            </div>
            <Switch checked={showGrid} onCheckedChange={setShowGrid} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Trục tọa độ X-Y-Z (Axes)</div>
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hiển thị trục gốc tọa độ.</div>
            </div>
            <Switch checked={showAxes} onCheckedChange={setShowAxes} />
          </div>
        </div>
      </div>

      {/* Hiệu năng */}
      <div className={`rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'} font-semibold`}>
          Hiệu năng (Performance)
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Khử răng cưa (Anti-aliasing)</div>
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Giúp các cạnh của mô hình mượt mà hơn (giảm FPS trên máy yếu).</div>
            </div>
            <Switch checked={antiAliasing} onCheckedChange={setAntiAliasing} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Đổ bóng (Shadows)</div>
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bật hiệu ứng đổ bóng chân thực.</div>
            </div>
            <Switch checked={shadows} onCheckedChange={setShadows} />
          </div>
        </div>
      </div>
      
      {/* Môi trường */}
      <div className={`rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'} font-semibold`}>
          Môi trường (Environment)
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Màu nền</div>
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tùy chỉnh màu phông nền không gian 3D.</div>
            </div>
            <input 
              type="color" 
              value={backgroundColor} 
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-10 h-10 p-1 bg-transparent rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
