'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { 
  Settings, ShieldAlert, AlertTriangle, Megaphone, Save, 
  RotateCcw, Sliders, PlayCircle, Info, Clock, ToggleLeft, ToggleRight,
  Award, Coins, Zap
} from 'lucide-react';
import { playSound } from '@/lib/sound';
import { logAdminAction } from '@/lib/adminLogger';

export default function SystemSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form States
  const [settings, setSettings] = useState({
    sabotageEnabled: true,
    theoryTimeLimit: 60,
    pvpCrystalStake: 50,
    pvpEloFactor: 25,
    expMultiplier: 1.0,
    maintenanceMode: false,
    bannerEnabled: true,
    bannerText: 'Chào mừng bạn đến với Đấu Trường STEM! Giải đấu PvP Mùa 1 đang diễn ra cực kỳ gay cấn.',
    bannerType: 'event' // 'info' | 'warning' | 'event'
  });

  // Tải cấu hình từ Firestore
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'config', 'systemSettings');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        // Tạo mặc định nếu chưa tồn tại
        const defaultSettings = {
          sabotageEnabled: true,
          theoryTimeLimit: 60,
          pvpCrystalStake: 50,
          pvpEloFactor: 25,
          expMultiplier: 1.0,
          maintenanceMode: false,
          bannerEnabled: true,
          bannerText: 'Chào mừng bạn đến với Đấu Trường STEM! Giải đấu PvP Mùa 1 đang diễn ra cực kỳ gay cấn.',
          bannerType: 'event'
        };
        await setDoc(docRef, defaultSettings);
        setSettings(defaultSettings);
      }
    } catch (err) {
      console.error("Lỗi khi tải cấu hình hệ thống:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Lưu cấu hình
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    playSound.click();
    try {
      setSaving(true);
      const docRef = doc(db, 'config', 'systemSettings');
      await updateDoc(docRef, {
        ...settings,
        updatedAt: new Date().toISOString()
      });
      await logAdminAction("UPDATE_SETTINGS", "settings", "Cấu hình hệ thống", "Cập nhật tham số vận hành hoặc banner");
      playSound.success();
      alert("Đã lưu cấu hình hệ thống thành công!");
    } catch (err) {
      console.error("Lỗi khi lưu cấu hình:", err);
      alert("Đã xảy ra lỗi khi lưu cấu hình.");
    } finally {
      setSaving(false);
    }
  };

  // Khôi phục mặc định
  const handleResetSettings = async () => {
    playSound.click();
    if (confirm("Bạn có chắc chắn muốn khôi phục toàn bộ cấu hình hệ thống về trạng thái mặc định?")) {
      const defaultSettings = {
        sabotageEnabled: true,
        theoryTimeLimit: 60,
        pvpCrystalStake: 50,
        pvpEloFactor: 25,
        expMultiplier: 1.0,
        maintenanceMode: false,
        bannerEnabled: true,
        bannerText: 'Chào mừng bạn đến với Đấu Trường STEM! Giải đấu PvP Mùa 1 đang diễn ra cực kỳ gay cấn.',
        bannerType: 'event'
      };
      setSettings(defaultSettings);
      await logAdminAction("RESET_SETTINGS", "settings", "Cấu hình hệ thống", "Khôi phục cấu hình mặc định");
      playSound.success();
    }
  };

  return (
    <div className="space-y-6 text-zinc-300 font-sans select-none">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider font-mono">
            Cấu hình hệ thống
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Thiết lập các tham số vận hành đấu trường, chế độ bảo trì và quản lý nội dung banner truyền thông.
          </p>
        </div>

        <button
          onClick={handleResetSettings}
          className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-xs font-bold text-zinc-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
        >
          <RotateCcw className="w-4 h-4" /> Mặc định
        </button>
      </div>

      {loading ? (
        <div className="py-20 bg-[#0f1017]/60 border border-[#1f2235] rounded-2xl flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono font-bold text-zinc-550 tracking-widest uppercase animate-pulse">
            Đang tải dữ liệu cấu hình...
          </span>
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* COLUMN 1: ARENA CONFIGS */}
            <div className="bg-[#0f1017]/60 border border-[#1f2235] p-6 rounded-2xl shadow-xl space-y-6">
              <div className="flex items-center gap-2 border-b border-[#1f2235]/40 pb-3">
                <Sliders className="w-5 h-5 text-pink-500" />
                <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  Tham số đấu trường (PvP)
                </h2>
              </div>

              {/* Sabotage Switch */}
              <div className="flex items-center justify-between gap-4 p-4 bg-[#08090d]/60 border border-[#1f2235]/40 rounded-xl">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-white font-mono block">Chức năng Sabotage (Gây nhiễu)</span>
                  <span className="text-[10px] text-zinc-500 font-semibold block leading-normal">
                    Cho phép người chơi kích hoạt các hiệu ứng cản trở đối thủ (khóa phòng lab, đổi vị trí, che camera).
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playSound.click();
                    setSettings(prev => ({ ...prev, sabotageEnabled: !prev.sabotageEnabled }));
                  }}
                  className="cursor-pointer focus:outline-none"
                >
                  {settings.sabotageEnabled ? (
                    <ToggleRight className="w-12 h-12 text-pink-500" />
                  ) : (
                    <ToggleLeft className="w-12 h-12 text-zinc-650" />
                  )}
                </button>
              </div>

              {/* Theory Limit input slider */}
              <div className="space-y-3 p-4 bg-[#08090d]/60 border border-[#1f2235]/40 rounded-xl">
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="text-white flex items-center gap-1.5"><Clock className="w-4 h-4 text-pink-500" /> Giới hạn câu lý thuyết</span>
                  <span className="text-pink-400">{settings.theoryTimeLimit} giây</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="180"
                  step="5"
                  value={settings.theoryTimeLimit}
                  onChange={(e) => setSettings(prev => ({ ...prev, theoryTimeLimit: Number(e.target.value) }))}
                  className="w-full accent-pink-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                />
                <span className="text-[9px] text-zinc-500 font-semibold block">
                  Thời gian tối đa để trả lời mỗi câu hỏi trắc nghiệm lý thuyết trong phòng thi đấu.
                </span>
              </div>

              {/* PVP Crystal Stake slider */}
              <div className="space-y-3 p-4 bg-[#08090d]/60 border border-[#1f2235]/40 rounded-xl">
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="text-white flex items-center gap-1.5"><Coins className="w-4 h-4 text-pink-500" /> Mức cược Pha lê mỗi trận</span>
                  <span className="text-pink-400">{settings.pvpCrystalStake !== undefined ? settings.pvpCrystalStake : 50} Pha lê</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={settings.pvpCrystalStake !== undefined ? settings.pvpCrystalStake : 50}
                  onChange={(e) => setSettings(prev => ({ ...prev, pvpCrystalStake: Number(e.target.value) }))}
                  className="w-full accent-pink-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                />
                <span className="text-[9px] text-zinc-500 font-semibold block">
                  Số lượng pha lê nhận được khi giành chiến thắng một trận đấu PvP.
                </span>
              </div>

              {/* PVP Elo Factor slider */}
              <div className="space-y-3 p-4 bg-[#08090d]/60 border border-[#1f2235]/40 rounded-xl">
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="text-white flex items-center gap-1.5"><Award className="w-4 h-4 text-pink-500" /> Điểm ELO cơ bản thay đổi</span>
                  <span className="text-pink-400">+{settings.pvpEloFactor !== undefined ? settings.pvpEloFactor : 25} / -{settings.pvpEloFactor !== undefined ? Math.floor(settings.pvpEloFactor * 0.6) : 15} ELO</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={settings.pvpEloFactor !== undefined ? settings.pvpEloFactor : 25}
                  onChange={(e) => setSettings(prev => ({ ...prev, pvpEloFactor: Number(e.target.value) }))}
                  className="w-full accent-pink-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                />
                <span className="text-[9px] text-zinc-500 font-semibold block">
                  Lượng điểm xếp hạng (ELO) thay đổi cơ bản khi thắng hoặc thua trận PvP.
                </span>
              </div>

              {/* EXP Multiplier slider */}
              <div className="space-y-3 p-4 bg-[#08090d]/60 border border-[#1f2235]/40 rounded-xl">
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="text-white flex items-center gap-1.5"><Zap className="w-4 h-4 text-pink-500 animate-pulse" /> Hệ số nhân EXP học tập</span>
                  <span className="text-pink-400">x{settings.expMultiplier !== undefined ? Number(settings.expMultiplier).toFixed(1) : '1.0'}</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.5"
                  value={settings.expMultiplier !== undefined ? settings.expMultiplier : 1.0}
                  onChange={(e) => setSettings(prev => ({ ...prev, expMultiplier: Number(e.target.value) }))}
                  className="w-full accent-pink-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                />
                <span className="text-[9px] text-zinc-500 font-semibold block">
                  Hệ số nhân điểm kinh nghiệm (EXP) dùng để kích hoạt sự kiện nhân đôi hoặc nhân ba kinh nghiệm học tập.
                </span>
              </div>
            </div>

            {/* COLUMN 2: SYSTEM AND BANNER CONFIGS */}
            <div className="bg-[#0f1017]/60 border border-[#1f2235] p-6 rounded-2xl shadow-xl space-y-6">
              <div className="flex items-center gap-2 border-b border-[#1f2235]/40 pb-3">
                <Megaphone className="w-5 h-5 text-pink-500 animate-pulse" />
                <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  Hệ thống & Banner thông báo
                </h2>
              </div>

              {/* Maintenance Mode Switch */}
              <div className="flex items-center justify-between gap-4 p-4 bg-rose-950/5 border border-rose-500/10 rounded-xl">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-500" /> Chế độ bảo trì hệ thống
                  </span>
                  <span className="text-[10px] text-zinc-500 font-semibold block leading-normal">
                    Khi kích hoạt, toàn bộ giao diện học sinh sẽ hiển thị màn hình thông báo bảo trì và khóa truy cập.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playSound.click();
                    setSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }));
                  }}
                  className="cursor-pointer focus:outline-none"
                >
                  {settings.maintenanceMode ? (
                    <ToggleRight className="w-12 h-12 text-rose-500 animate-pulse" />
                  ) : (
                    <ToggleLeft className="w-12 h-12 text-zinc-650" />
                  )}
                </button>
              </div>

              {/* Banner Text Config */}
              <div className="space-y-4 p-4 bg-[#08090d]/60 border border-[#1f2235]/40 rounded-xl">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-bold text-white font-mono block">Hiển thị Banner thông báo</span>
                  <button
                    type="button"
                    onClick={() => {
                      playSound.click();
                      setSettings(prev => ({ ...prev, bannerEnabled: !prev.bannerEnabled }));
                    }}
                    className="cursor-pointer focus:outline-none"
                  >
                    {settings.bannerEnabled ? (
                      <ToggleRight className="w-10 h-10 text-pink-500" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-zinc-650" />
                    )}
                  </button>
                </div>

                {settings.bannerEnabled && (
                  <div className="space-y-3 pt-2">
                    {/* Banner Type Selection */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'info', label: 'Thông tin', color: 'border-blue-500/30 text-blue-400 bg-blue-500/5' },
                        { id: 'warning', label: 'Cảnh báo', color: 'border-amber-500/30 text-amber-400 bg-amber-500/5' },
                        { id: 'event', label: 'Sự kiện hot', color: 'border-pink-500/30 text-pink-400 bg-pink-500/5' }
                      ].map(type => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => {
                            playSound.click();
                            setSettings(prev => ({ ...prev, bannerType: type.id }));
                          }}
                          className={`py-1.5 border rounded-lg text-[10px] font-black uppercase font-mono transition-all cursor-pointer ${
                            settings.bannerType === type.id
                              ? `${type.color} ring-1 ring-pink-500/30`
                              : 'border-zinc-800 text-zinc-500 bg-transparent hover:text-zinc-300'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>

                    {/* Text Area */}
                    <textarea
                      rows="3"
                      value={settings.bannerText}
                      onChange={(e) => setSettings(prev => ({ ...prev, bannerText: e.target.value }))}
                      placeholder="Nhập nội dung thông báo hiển thị trên banner..."
                      className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none placeholder-zinc-700 transition-all font-mono leading-relaxed"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Actions Button */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-pink-500 hover:bg-pink-600 border border-pink-500/30 hover:border-pink-400 text-xs font-bold text-white rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-2 font-mono uppercase"
            >
              <Save className="w-4 h-4" /> 
              {saving ? 'Đang lưu cấu hình...' : 'Lưu cấu hình hệ thống'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
