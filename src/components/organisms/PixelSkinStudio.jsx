'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Download, 
  Upload, 
  Save, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Check, 
  X, 
  Eye, 
  Layers, 
  User, 
  Palette, 
  Shirt, 
  Flame, 
  ShieldCheck, 
  FlaskConical, 
  Trophy, 
  Maximize2, 
  Compass, 
  HelpCircle, 
  Zap, 
  Radio, 
  Award, 
  Volume2, 
  VolumeX,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Box,
  Sliders,
  CheckCircle2,
  Info,
  Lock,
  Unlock,
  Smile,
  Target,
  Sword,
  Wand2,
  Headphones
} from 'lucide-react';
import { playSound } from '@/lib/sound';
import { useAppStore } from '@/store/useAppStore';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { 
  downloadSkin as engineDownloadSkin, 
  generatePresetSkin, 
  generateCapeTexture,
  generateIsometricHeadAvatar as engineIsometricHeadAvatar
} from '@/lib/voxelSkinEngine';

// ─── DYNAMIC IMPORT 3D VOXEL CHARACTER COMPONENT ─────────────────────────────
// Dynamic import to prevent SSR hydration mismatches with Three.js / Canvas
const VoxelCharacter3D = dynamic(
  () => import('@/components/atoms/VoxelCharacter3D').catch(() => {
    // Return fallback if component is loading or building
    return function FallbackPreview({ modelType, skinConfig }) {
      return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/40 via-slate-950/80 to-slate-950" />
          
          {/* Animated Pedestal */}
          <div className="relative z-10 w-48 h-48 rounded-full border border-cyan-500/30 bg-cyan-950/20 shadow-[0_0_50px_rgba(6,182,212,0.2)] flex items-center justify-center animate-pulse">
            <div className="w-36 h-36 rounded-full border border-cyan-400/40 border-dashed animate-spin" style={{ animationDuration: '20s' }} />
            
            {/* Voxel Hologram Silhouette */}
            <div className="absolute flex flex-col items-center">
              {/* Head */}
              <div 
                className="w-14 h-14 rounded-sm border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-300 relative"
                style={{ 
                  backgroundColor: skinConfig?.skinTone === 'cyborg_silver' ? '#94a3b8' : 
                                   skinConfig?.skinTone === 'alien_green' ? '#10b981' : 
                                   skinConfig?.skinTone === 'tan' ? '#c58c65' : '#f7c297' 
                }}
              >
                {/* 2x1 Glowing Eyes */}
                <div className="absolute top-6 left-2 flex gap-4">
                  <div 
                    className="w-2.5 h-1.5 rounded-xs shadow-[0_0_8px_currentColor]"
                    style={{ 
                      backgroundColor: skinConfig?.eyeColor === 'ruby' ? '#f43f5e' :
                                       skinConfig?.eyeColor === 'emerald' ? '#10b981' :
                                       skinConfig?.eyeColor === 'amethyst' ? '#c084fc' : '#22d3ee',
                      color: skinConfig?.eyeColor === 'ruby' ? '#f43f5e' :
                             skinConfig?.eyeColor === 'emerald' ? '#10b981' :
                             skinConfig?.eyeColor === 'amethyst' ? '#c084fc' : '#22d3ee'
                    }}
                  />
                  <div 
                    className="w-2.5 h-1.5 rounded-xs shadow-[0_0_8px_currentColor]"
                    style={{ 
                      backgroundColor: skinConfig?.eyeColor === 'ruby' ? '#f43f5e' :
                                       skinConfig?.eyeColor === 'emerald' ? '#10b981' :
                                       skinConfig?.eyeColor === 'amethyst' ? '#c084fc' : '#22d3ee',
                      color: skinConfig?.eyeColor === 'ruby' ? '#f43f5e' :
                             skinConfig?.eyeColor === 'emerald' ? '#10b981' :
                             skinConfig?.eyeColor === 'amethyst' ? '#c084fc' : '#22d3ee'
                    }}
                  />
                </div>
              </div>

              {/* Torso & Arms */}
              <div className="flex items-center gap-1 mt-1">
                <div 
                  className={`h-16 rounded-xs border border-cyan-500/60 bg-cyan-900/60 shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all ${
                    modelType === 'alex' ? 'w-4' : 'w-5'
                  }`}
                />
                <div className="w-14 h-16 rounded-xs border border-cyan-400/80 bg-slate-800/90 shadow-[0_0_15px_rgba(6,182,212,0.3)] flex flex-col items-center justify-center p-1">
                  <span className="text-[9px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                    {modelType}
                  </span>
                </div>
                <div 
                  className={`h-16 rounded-xs border border-cyan-500/60 bg-cyan-900/60 shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all ${
                    modelType === 'alex' ? 'w-4' : 'w-5'
                  }`}
                />
              </div>

              {/* Legs */}
              <div className="flex gap-1 mt-1">
                <div className="w-6 h-16 rounded-xs border border-cyan-600/60 bg-slate-900/90" />
                <div className="w-6 h-16 rounded-xs border border-cyan-600/60 bg-slate-900/90" />
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-6 max-w-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium text-cyan-400 bg-cyan-950/80 border border-cyan-500/40">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              3D VOXEL CORE KHOA HỌC
            </span>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              Hệ thống dựng khối Minecraft 64x64 đa chiều với hoạt ảnh nhịp thở & áo choàng động.
            </p>
          </div>
        </div>
      );
    };
  }),
  { ssr: false }
);

// ─── STEM CATALOG DATA DEFINITIONS ───────────────────────────────────────────

export const MODEL_OPTIONS = [
  {
    id: 'steve',
    name: 'Steve Cổ Điển',
    armWidth: '4px',
    desc: 'Thân hình Steve dũng mãnh, sải tay 4px vững chãi chuẩn phong cách Minecraft',
    tag: 'Tiêu chuẩn',
    badgeColor: 'border-cyan-500/50 text-cyan-400 bg-cyan-950/30',
    icon: '🧱'
  },
  {
    id: 'alex',
    name: 'Alex Thanh Thoát',
    armWidth: '3px',
    desc: 'Thân hình Alex thon gọn, sải tay 3px linh hoạt cho nhà thám hiểm nhanh nhẹn',
    tag: 'Thon gọn',
    badgeColor: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/30',
    icon: '🏹'
  },
  {
    id: 'cyborg',
    name: 'Cyborg Voxel',
    armWidth: '4px / Bionic',
    desc: 'Khung máy cơ giới bán sinh học với cánh tay máy Titan và vi mạch lượng tử',
    tag: 'Siêu công nghệ',
    badgeColor: 'border-violet-500/50 text-violet-400 bg-violet-950/30',
    icon: '🤖'
  }
];

export const SKIN_TONE_OPTIONS = [
  {
    id: 'natural',
    name: 'Da Tự Nhiên',
    hex: '#f7c297',
    palette: ['#f7c297', '#e2ac83', '#ca966e', '#a97a54'],
    desc: 'Tone da sáng ấm tự nhiên tiêu chuẩn',
    rarity: 'Cơ bản',
    rarityColor: 'text-slate-400 border-slate-700'
  },
  {
    id: 'tan',
    name: 'Da Rám Nắng',
    hex: '#c58c65',
    palette: ['#c58c65', '#b17751', '#98603d', '#7d4a2a'],
    desc: 'Tone da nâu đồng khỏe khoắn qua các chuyến dã ngoại khoa học',
    rarity: 'Hiếm',
    rarityColor: 'text-cyan-400 border-cyan-500/40'
  },
  {
    id: 'pale',
    name: 'Trắng Sứ Thanh Lịch',
    hex: '#fae1cf',
    palette: ['#fff1e6', '#fae1cf', '#e8cbb7', '#ccad97'],
    desc: 'Tone da trắng ngà thanh tao của nhà nghiên cứu trong phòng lab',
    rarity: 'Hiếm',
    rarityColor: 'text-cyan-400 border-cyan-500/40'
  },
  {
    id: 'cyborg_silver',
    name: 'Bạc Cyborg',
    hex: '#94a3b8',
    palette: ['#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b'],
    desc: 'Lớp phủ hợp kim Titanium bóng bẩy của người máy thông minh',
    rarity: 'Sử thi',
    rarityColor: 'text-purple-400 border-purple-500/40'
  },
  {
    id: 'alien_green',
    name: 'Lục Hành Tinh / Zombie',
    hex: '#10b981',
    palette: ['#a7f3d0', '#6ee7b7', '#10b981', '#047857'],
    desc: 'Sắc tố sinh học người ngoài Trái Đất huỳnh quang phát sáng',
    rarity: 'Huyền thoại',
    rarityColor: 'text-amber-400 border-amber-500/40'
  }
];

export const EYE_COLOR_OPTIONS = [
  {
    id: 'cyan',
    name: 'Mắt Cyan Lượng Tử',
    hex: '#06b6d4',
    glowColor: 'rgba(6,182,212,0.9)',
    desc: 'Quang phổ 490nm phát quang HUD quét dữ liệu tức thì',
    badge: 'Phát Sáng 2x1',
    rarity: 'Cơ bản'
  },
  {
    id: 'ruby',
    name: 'Mắt Ruby Nhiệt Hạch',
    hex: '#f43f5e',
    glowColor: 'rgba(244,63,94,0.9)',
    desc: 'Năng lượng phản ứng nhiệt hạch bốc cháy nhiệt huyết',
    badge: 'Phát Sáng 2x1',
    rarity: 'Hiếm'
  },
  {
    id: 'emerald',
    name: 'Mắt Ngọc Lục Bảo',
    hex: '#10b981',
    glowColor: 'rgba(16,185,129,0.9)',
    desc: 'Nguyên tố thiên nhiên và sóng sinh thái hài hòa',
    badge: 'Phát Sáng 2x1',
    rarity: 'Hiếm'
  },
  {
    id: 'amethyst',
    name: 'Mắt Thạch Anh Tím',
    hex: '#a855f7',
    glowColor: 'rgba(168,85,247,0.9)',
    desc: 'Tần số năng lượng không-thời gian bí ẩn và sâu lắng',
    badge: 'Phát Sáng 2x1',
    rarity: 'Sử thi'
  },
  {
    id: 'amber',
    name: 'Mắt Vàng Hổ Phách',
    hex: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.9)',
    desc: 'Hào quang vàng rực rỡ tích tụ năng lượng mặt trời',
    badge: 'Phát Sáng 2x1',
    rarity: 'Hiếm'
  },
  {
    id: 'sunglasses',
    name: 'Kính Râm Đen Ngầu',
    hex: '#0f172a',
    glowColor: 'rgba(255,255,255,0.4)',
    desc: 'Cặp kính râm 2x2 thời thượng chống lóa phong cách siêu ngầu',
    badge: 'Kính Râm 2x2',
    rarity: 'Sử thi'
  },
  {
    id: 'wink',
    name: 'Mắt Nháy Tinh Nghịch',
    hex: '#06b6d4',
    glowColor: 'rgba(6,182,212,0.8)',
    desc: 'Một bên mắt mở to thông tuệ, một bên nháy mắt duyên dáng',
    badge: 'Biểu Cảm 1 Bên',
    rarity: 'Hiếm'
  },
  {
    id: 'herobrine',
    name: 'Mắt Herobrine Trắng Sáng',
    hex: '#ffffff',
    glowColor: 'rgba(255,255,255,1.0)',
    desc: 'Đôi mắt trắng toát phát hào quang thần thoại bí ẩn của Minecraft',
    badge: 'Hào Quang Trắng',
    rarity: 'Huyền thoại'
  }
];

export const EXPRESSION_OPTIONS = [
  {
    id: 'smile',
    name: 'Cười Tươi Rạng Rỡ',
    desc: 'Nụ cười thân thiện mang lại năng lượng tích cực cho cả đội lab',
    icon: '😊',
    rarity: 'Cơ bản'
  },
  {
    id: 'neutral',
    name: 'Nghiêm Túc Tỉnh Táo',
    desc: 'Khuôn mặt bình thản tập trung 100% vào các tính toán logic',
    icon: '😐',
    rarity: 'Cơ bản'
  },
  {
    id: 'smirk',
    name: 'Nhếch Mép Tinh Quái',
    desc: 'Nụ cười nửa miệng tự tin của thiên tài nắm chắc phần thắng',
    icon: '😏',
    rarity: 'Hiếm'
  },
  {
    id: 'surprised',
    name: 'Bất Ngờ Mắt Tròn',
    desc: 'Biểu cảm ngạc nhiên thán phục trước phát hiện khoa học đột phá',
    icon: '😮',
    rarity: 'Hiếm'
  },
  {
    id: 'cyber_jaw',
    name: 'Khí Chất Ngầu / Râu Quai Nón',
    desc: 'Góc cằm nam tính hoặc viền giáp Titan bảo vệ cằm cực kỳ phong độ',
    icon: '🧔',
    rarity: 'Sử thi'
  }
];

export const HAIR_HAT_OPTIONS = [
  {
    id: 'none',
    name: 'Tóc Tự Nhiên',
    category: 'Mặc định',
    desc: 'Kiểu tóc tự nhiên gọn gàng của học viên STEM',
    rarity: 'Cơ bản',
    icon: '✂️'
  },
  {
    id: 'brown_classic',
    name: 'Tóc Nâu Ngắn Cổ Điển',
    category: 'Cổ Điển',
    desc: 'Mái tóc nâu ngắn rẽ ngôi chuẩn mực phong thái học giả',
    rarity: 'Cơ bản',
    icon: '💇'
  },
  {
    id: 'anime_blonde',
    name: 'Tóc Vàng Anime Lãng Tử',
    category: 'Anime',
    desc: 'Mái tóc vàng óng ả phong cách nhân vật chính trong truyện tranh',
    rarity: 'Hiếm',
    icon: '👱'
  },
  {
    id: 'lab_helmet',
    name: 'Mũ Bảo Hộ Lab Chuyên Dụng',
    category: 'An Toàn Phòng Lab',
    desc: 'Mũ chịu lực với kính che Polycarbonate chống hóa chất và tia bức xạ cực mạnh',
    rarity: 'Hiếm',
    icon: '⛑️',
    statBoost: '+15% Kháng Axit'
  },
  {
    id: 'einstein_fuzzy',
    name: 'Tóc Xù Einstein',
    category: 'Huyền Thoại Bác Học',
    desc: 'Mái tóc xù bất hủ của nhà vật lý đại tài bùng nổ sức sáng tạo không biên giới',
    rarity: 'Huyền thoại',
    icon: '⚡',
    statBoost: '+25% Tốc Độ Tư Duy'
  },
  {
    id: 'cyber_anime',
    name: 'Tóc Anime Neon Cyberpunk',
    category: 'Cyberpunk',
    desc: 'Mái tóc vuốt dựng nhọn viền sợi quang LED phát quang đổi màu liên tục',
    rarity: 'Sử thi',
    icon: '🌟',
    statBoost: '+20% Phong Cách Cyber'
  },
  {
    id: 'ar_goggles',
    name: 'Kính Bảo Hộ AR Hologram',
    category: 'Kính Thực Tế Ảo',
    desc: 'Kính viễn vọng điện tử hiển thị công thức hóa học và quỹ đạo chuyển động trực quan',
    rarity: 'Sử thi',
    icon: '🥽',
    statBoost: '+18% Phân Tích Dữ Liệu'
  },
  {
    id: 'gaming_headset',
    name: 'Tai Nghe Gamer LED RGB',
    category: 'Gaming Gear',
    desc: 'Tai nghe gaming chụp tai cách âm với dải đèn LED RGB và micro định hướng',
    rarity: 'Sử thi',
    icon: '🎧',
    statBoost: '+15% Phản Xạ Đấu Trường'
  },
  {
    id: 'diamond_helmet',
    name: 'Mũ Giáp Kim Cương 3D',
    category: 'Voxel Siêu Cấp',
    desc: 'Mũ giáp bảo vệ đầu chế tác từ khối Kim Cương nguyên chất Minecraft siêu bền',
    rarity: 'Huyền thoại',
    icon: '💠',
    statBoost: '+30% Giáp Phòng Thủ'
  },
  {
    id: 'ninja_mask',
    name: 'Mặt Nạ Ninja Hacker',
    category: 'Stealth',
    desc: 'Mặt nạ vải Nano đen che nửa khuôn mặt phong cách gián điệp mạng',
    rarity: 'Hiếm',
    icon: '🥷',
    statBoost: '+12% Tốc Độ Luồn Lách'
  },
  {
    id: 'wizard_hat',
    name: 'Mũ Phù Thủy Học Viện',
    category: 'Học Viện Ma Pháp',
    desc: 'Mũ chóp tím nạm sao vàng tượng trưng cho đỉnh cao học thuật toán học',
    rarity: 'Sử thi',
    icon: '🧙',
    statBoost: '+20% Uy Lực Phép Lượng Tử'
  }
];

export const OUTFIT_OPTIONS = [
  {
    id: 'lab_coat',
    name: 'Áo Blouse Trắng Viền Neon',
    category: 'Phòng Lab',
    desc: 'Áo choàng nghiên cứu viên STEM sợi Nano dệt sợi quang Cyan phản quang sang trọng',
    rarity: 'Hiếm',
    icon: '🥼',
    statBoost: '+10% Điểm Hóa Học'
  },
  {
    id: 'astronaut_nebula',
    name: 'Đồ Phi Hành Gia Nebula',
    category: 'Vũ Trụ',
    desc: 'Bộ giáp du hành không gian màu tím tinh vân chịu áp suất và vi trọng lực vũ trụ',
    rarity: 'Huyền thoại',
    icon: '🚀',
    statBoost: '+25% Vật Lý Thiên Văn'
  },
  {
    id: 'cyber_hoodie',
    name: 'Áo Hoodie Hacker Cyber',
    category: 'Cyberpunk',
    desc: 'Áo trùm đầu đen tàng hình cảm ứng với chuỗi mã ma trận nhị phân chạy dọc sống lưng',
    rarity: 'Sử thi',
    icon: '🧥',
    statBoost: '+15% Thuật Toán Code'
  },
  {
    id: 'nether_armor',
    name: 'Giáp Nethe-Tech Lượng Tử',
    category: 'Voxel Siêu Cấp',
    desc: 'Bộ giáp tôi luyện từ mảnh Netherite siêu cứng nạm tinh thể năng lượng đỏ thẫm',
    rarity: 'Huyền thoại',
    icon: '🛡️',
    statBoost: '+30% Khí Chất Đấu Trường'
  },
  {
    id: 'diamond_armor',
    name: 'Bộ Giáp Kim Cương Minecraft',
    category: 'Biểu Tượng Voxel',
    desc: 'Bộ giáp ngọc kim cương xanh biếc bất hoại lừng danh khắp thế giới hình hộp',
    rarity: 'Huyền thoại',
    icon: '💎',
    statBoost: '+35% Giáp Toàn Diện'
  },
  {
    id: 'stem_pioneer',
    name: 'Đồng Phục STEM Pioneer',
    category: 'Học Viện',
    desc: 'Bộ đồng phục thể thao năng động đại diện cho tinh thần tiên phong học viện STEM',
    rarity: 'Cơ bản',
    icon: '🥋',
    statBoost: '+5% Tự Tin Thi Đấu'
  },
  {
    id: 'tuxedo',
    name: 'Áo Vest Nhà Khoa Học Lịch Lãm',
    category: 'Trang Trọng',
    desc: 'Bộ tuxedo đen tuyền thắt nơ quý phái tham dự các lễ trao giải Nobel danh giá',
    rarity: 'Sử thi',
    icon: '🤵',
    statBoost: '+20% Phong Thái Đĩnh Đạc'
  },
  {
    id: 'mecha_golem',
    name: 'Giáp Robot Mecha Golem',
    category: 'Cơ Giới',
    desc: 'Bộ giáp người máy khổng lồ tích hợp lò phản ứng hồ quang năng lượng vĩnh cửu',
    rarity: 'Huyền thoại',
    icon: '🦾',
    statBoost: '+28% Sức Mạnh Cơ Bắp'
  }
];

export const CAPE_OPTIONS = [
  {
    id: 'none',
    name: 'Không Dùng Áo Choàng',
    desc: 'Gọn gàng tối giản, tập trung vào thao tác tay',
    rarity: 'Cơ bản',
    icon: '❌'
  },
  {
    id: 'dragon_elo',
    name: 'Áo Choàng ELO Rồng Vàng',
    desc: 'Áo choàng hoàng kim thêu hình Rồng Vàng phát sáng dành riêng cho kỳ tài Đấu Trường',
    rarity: 'Huyền thoại',
    icon: '🐉',
    particle: 'Tia lửa vàng'
  },
  {
    id: 'aurora',
    name: 'Cực Quang Aurora Chuyển Màu',
    desc: 'Dải lụa quang phổ mô phỏng ánh sáng cực quang địa cực mềm mại dập dềnh trong gió',
    rarity: 'Sử thi',
    icon: '🌌',
    particle: 'Quang phổ sóng'
  },
  {
    id: 'matrix',
    name: 'Ma Trận Matrix Xanh Lá',
    desc: 'Cơn mưa mã số nhị phân màu xanh huỳnh quang chảy vô tận từ trên xuống',
    rarity: 'Sử thi',
    icon: '💻',
    particle: 'Mã số 0101'
  },
  {
    id: 'stem',
    name: 'Khiên Biểu Tượng STEM',
    desc: 'Áo choàng màu xanh Cyan với quốc huy khiên năng lượng học viện STEM HUB',
    rarity: 'Hiếm',
    icon: '🛡️',
    particle: 'Hào quang Cyan'
  },
  {
    id: 'migrator_creeper',
    name: 'Creeper Cổ Điển Migrator',
    desc: 'Áo choàng nhung đỏ thẫm in hình mặt Creeper huyền thoại Minecraft',
    rarity: 'Huyền thoại',
    icon: '🧨',
    particle: 'Tia lửa đỏ'
  },
  {
    id: 'hazard',
    name: 'Vạch Cảnh Báo Nguy Hiểm',
    desc: 'Áo choàng sọc vàng đen cảnh báo vật liệu phóng xạ và nguy cơ sinh học cao',
    rarity: 'Hiếm',
    icon: '⚠️',
    particle: 'Cảnh báo vàng'
  }
];

export const HELD_ITEM_OPTIONS = [
  {
    id: 'none',
    name: 'Không Cầm Vật Phẩm',
    desc: 'Đôi bàn tay sẵn sàng bấm máy tính bỏ túi và vẽ đồ thị',
    rarity: 'Cơ bản',
    icon: '✋'
  },
  {
    id: 'chemical_flask',
    name: 'Bình Hóa Chất Sủi Bọt',
    desc: 'Bình tam giác Erlenmeyer chứa dung dịch huỳnh quang sủi tăm khí phát sáng lấp lánh',
    rarity: 'Hiếm',
    icon: '🧪'
  },
  {
    id: 'diamond_pickaxe',
    name: 'Cuốc Kim Cương Lượng Tử',
    desc: 'Công cụ biểu tượng huyền thoại của Minecraft khai thác khoáng thạch tri thức',
    rarity: 'Huyền thoại',
    icon: '⛏️'
  },
  {
    id: 'diamond_sword',
    name: 'Kiếm Kim Cương Pixel',
    desc: 'Thanh bảo kiếm Minecraft bằng kim cương xanh sắc bén bất khả chiến bại',
    rarity: 'Huyền thoại',
    icon: '⚔️'
  },
  {
    id: 'stem_trophy',
    name: 'Cúp Kim Cương STEM',
    desc: 'Cúp quán quân đúc từ tinh thể pha lê kim cương phát hào quang chiến thắng lẫy lừng',
    rarity: 'Huyền thoại',
    icon: '🏆'
  },
  {
    id: 'ruler_3d',
    name: 'Thước Đo 3D Hologram',
    desc: 'Thước kẹp vi mô laser chiếu tia Hologram đo đạc không gian với độ chính xác nano',
    rarity: 'Sử thi',
    icon: '📐'
  }
];

export const PRESET_SKINS = [
  {
    id: 'stem_steve',
    name: 'STEM Lab Coat Steve',
    icon: '🧪',
    model: 'steve',
    skinTone: 'natural',
    eyeColor: 'cyan',
    expression: 'smile',
    hairHat: 'ar_goggles',
    outfit: 'lab_coat',
    cape: 'none',
    heldItem: 'chemical_flask',
    desc: 'Nhà nghiên cứu khoa học chuẩn chỉ với áo blouse trắng viền LED Cyan'
  },
  {
    id: 'cyber_alex',
    name: 'Cyber Alex',
    icon: '⚡',
    model: 'alex',
    skinTone: 'cyborg_silver',
    eyeColor: 'ruby',
    expression: 'smirk',
    hairHat: 'cyber_anime',
    outfit: 'cyber_hoodie',
    cape: 'matrix',
    heldItem: 'stem_trophy',
    desc: 'Nữ chiến binh công nghệ số thanh thoát cùng cơn mưa mã Matrix'
  },
  {
    id: 'biohazard_hazmat',
    name: 'Biohazard Hazmat',
    icon: '☣️',
    model: 'steve',
    skinTone: 'tan',
    eyeColor: 'emerald',
    expression: 'neutral',
    hairHat: 'lab_helmet',
    outfit: 'astronaut_nebula',
    cape: 'hazard',
    heldItem: 'ruler_3d',
    desc: 'Chuyên gia xử lý vật liệu nguy cơ cao với mũ bảo hộ phòng thí nghiệm'
  },
  {
    id: 'diamond_hero',
    name: 'Chiến Binh Kim Cương',
    icon: '💎',
    model: 'steve',
    skinTone: 'natural',
    eyeColor: 'amber',
    expression: 'smile',
    hairHat: 'diamond_helmet',
    outfit: 'diamond_armor',
    cape: 'dragon_elo',
    heldItem: 'diamond_sword',
    desc: 'Hiệp sĩ vô địch mang trọn bộ giáp và kiếm Kim Cương toàn diện'
  },
  {
    id: 'gamer_pro',
    name: 'Pro Gamer RGB',
    icon: '🎧',
    model: 'alex',
    skinTone: 'pale',
    eyeColor: 'amethyst',
    expression: 'smirk',
    hairHat: 'gaming_headset',
    outfit: 'cyber_hoodie',
    cape: 'aurora',
    heldItem: 'diamond_pickaxe',
    desc: 'Streamer kỳ cựu với tai nghe RGB phát sáng và dải cực quang lãng mạn'
  },
  {
    id: 'quantum_physicist',
    name: 'Quantum Physicist',
    icon: '🌌',
    model: 'alex',
    skinTone: 'natural',
    eyeColor: 'herobrine',
    expression: 'neutral',
    hairHat: 'einstein_fuzzy',
    outfit: 'nether_armor',
    cape: 'aurora',
    heldItem: 'ruler_3d',
    desc: 'Bác học vật lý lượng tử với mái tóc xù Einstein và đôi mắt thông tuệ'
  }
];

// Helper: Rarity badge styles
const getRarityBadge = (rarity) => {
  switch (rarity) {
    case 'Huyền thoại':
      return 'border-amber-400/50 bg-amber-500/10 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
    case 'Sử thi':
      return 'border-purple-400/50 bg-purple-500/10 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]';
    case 'Hiếm':
      return 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]';
    default:
      return 'border-slate-600/50 bg-slate-800/40 text-slate-300';
  }
};

// ─── BUILT-IN MINECRAFT 64x64 SKIN CANVAS SYNTHESIZER ────────────────────────
/**
 * Generates an authentic Minecraft 64x64 skin PNG data URL
 * conforming to official Minecraft Java & Bedrock UV specifications.
 */
export function generateMinecraft64x64Skin(config) {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Clear canvas transparent
  ctx.clearRect(0, 0, 64, 64);

  // Colors based on config
  const skinColorMap = {
    natural: '#f7c297',
    tan: '#c58c65',
    pale: '#fae1cf',
    cyborg_silver: '#94a3b8',
    alien_green: '#10b981'
  };
  const baseSkin = skinColorMap[config.skinTone] || '#f7c297';

  // Helper function to fill rectangle with subtle pixel noise shading
  const fillShadedRect = (x, y, w, h, baseHex) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(x, y, w, h);
    for (let px = x; px < x + w; px++) {
      for (let py = y; py < y + h; py++) {
        if ((px + py) % 3 === 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.06)';
          ctx.fillRect(px, py, 1, 1);
        } else if ((px * 2 + py) % 5 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }
  };

  // 1. HEAD BASE LAYER (0,0 to 32,16)
  // Top (8,0,8,8), Bottom (16,0,8,8)
  fillShadedRect(8, 0, 8, 8, baseSkin);
  fillShadedRect(16, 0, 8, 8, baseSkin);
  // Sides & Back: Right (0,8,8,8), Front (8,8,8,8), Left (16,8,8,8), Back (24,8,8,8)
  fillShadedRect(0, 8, 8, 8, baseSkin);
  fillShadedRect(8, 8, 8, 8, baseSkin);
  fillShadedRect(16, 8, 8, 8, baseSkin);
  fillShadedRect(24, 8, 8, 8, baseSkin);

  // Hair Base Shading (Nền tóc cơ bản)
  const hairBaseColor = config.hairHat === 'anime_blonde' ? '#eab308' :
                        config.hairHat === 'einstein_fuzzy' ? '#e2e8f0' :
                        config.hairHat === 'cyber_anime' ? '#a855f7' : '#451a03';
  ctx.fillStyle = hairBaseColor;
  ctx.fillRect(8, 0, 8, 3); // Đỉnh đầu
  ctx.fillRect(8, 8, 8, 2); // Trán trước

  // Draw Eyes on Front Face (at x: 9-10 & 13-14, y: 12)
  const eyeColorMap = {
    cyan: '#06b6d4',
    ruby: '#f43f5e',
    emerald: '#10b981',
    amethyst: '#a855f7',
    amber: '#f59e0b',
    sunglasses: '#0f172a',
    wink: '#06b6d4',
    herobrine: '#ffffff'
  };
  const eyeHex = eyeColorMap[config.eyeColor] || '#06b6d4';

  if (config.eyeColor === 'sunglasses') {
    // Kính râm đen ngầu 2x2 kèm gọng và vệt phản quang
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(9, 11, 2, 2);
    ctx.fillRect(13, 11, 2, 2);
    ctx.fillRect(11, 11, 2, 1); // Cầu kính
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(9, 11, 1, 1); // Vệt bóng sáng
    ctx.fillRect(13, 11, 1, 1);
  } else if (config.eyeColor === 'herobrine') {
    // Mắt trắng toát Herobrine
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(9, 12, 2, 1);
    ctx.fillRect(13, 12, 2, 1);
  } else if (config.eyeColor === 'wink') {
    // Mắt trái mở to cyan, mắt phải nháy
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(9, 12, 1, 1);
    ctx.fillStyle = eyeHex;
    ctx.fillRect(10, 12, 1, 1);
    // Nháy mắt phải (đường ngang sẫm)
    ctx.fillStyle = '#78350f';
    ctx.fillRect(13, 12, 2, 1);
  } else {
    // Mắt tiêu chuẩn 2x1 có lòng trắng và tròng mắt phát sáng
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(9, 12, 1, 1);
    ctx.fillRect(14, 12, 1, 1);
    ctx.fillStyle = eyeHex;
    ctx.fillRect(10, 12, 1, 1);
    ctx.fillRect(13, 12, 1, 1);
  }

  // Draw Mouth / Facial Expression (y: 13-15)
  const mouthColor = '#884433';
  if (config.expression === 'neutral') {
    ctx.fillStyle = mouthColor;
    ctx.fillRect(11, 14, 2, 1);
  } else if (config.expression === 'smirk') {
    ctx.fillStyle = mouthColor;
    ctx.fillRect(11, 14, 2, 1);
    ctx.fillRect(13, 13, 1, 1); // Nhếch lên
  } else if (config.expression === 'surprised') {
    ctx.fillStyle = '#442211';
    ctx.fillRect(11, 13, 2, 2);
  } else if (config.expression === 'cyber_jaw') {
    ctx.fillStyle = '#475569';
    ctx.fillRect(10, 14, 4, 1);
    ctx.fillRect(11, 15, 2, 1);
  } else {
    // Mặc định: Nụ cười thân thiện (Smile)
    ctx.fillStyle = mouthColor;
    ctx.fillRect(11, 14, 2, 1);
    ctx.fillRect(10, 13, 1, 1);
    ctx.fillRect(13, 13, 1, 1);
  }

  // 2. HEAD OUTER LAYER (Hat/Hair/Headset) (32,0 to 64,16)
  if (config.hairHat === 'lab_helmet') {
    // Mũ bảo hộ vàng công nghiệp
    ctx.fillStyle = '#eab308';
    ctx.fillRect(40, 0, 8, 8); // Đỉnh
    ctx.fillRect(32, 8, 8, 8); // Phải
    ctx.fillRect(40, 8, 8, 4); // Trán trước
    ctx.fillRect(48, 8, 8, 8); // Trái
    ctx.fillRect(56, 8, 8, 8); // Sau
    // Kính chắn Polycarbonate Cyan
    ctx.fillStyle = 'rgba(6,182,212,0.85)';
    ctx.fillRect(40, 11, 8, 3);
  } else if (config.hairHat === 'gaming_headset') {
    // Tai nghe Gamer LED RGB
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(40, 1, 8, 2); // Khung vòm trên đỉnh
    // Ốp tai trái & phải
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(32, 9, 3, 5); // Tai phải
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(53, 9, 3, 5); // Tai trái
    // Micro đàm thoại
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(41, 14, 3, 1);
  } else if (config.hairHat === 'diamond_helmet') {
    // Mũ giáp Kim Cương Minecraft 3D
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(40, 0, 8, 8); // Đỉnh
    ctx.fillRect(32, 8, 8, 7); // Phải
    ctx.fillRect(40, 8, 8, 4); // Trán
    ctx.fillRect(48, 8, 8, 7); // Trái
    ctx.fillRect(56, 8, 8, 8); // Sau
    // Điểm nhấn kim cương sáng bóng
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(41, 9, 2, 2);
    ctx.fillRect(45, 9, 2, 2);
  } else if (config.hairHat === 'ninja_mask') {
    // Mặt nạ Ninja Hacker đen che nửa mặt
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(40, 12, 8, 4);
    ctx.fillRect(32, 12, 8, 4);
    ctx.fillRect(48, 12, 8, 4);
  } else if (config.hairHat === 'einstein_fuzzy') {
    // Tóc xù Einstein trắng xóa
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(39, 0, 10, 9);
    ctx.fillRect(31, 7, 10, 8);
    ctx.fillRect(47, 7, 10, 8);
    ctx.fillRect(55, 7, 10, 8);
  } else if (config.hairHat === 'cyber_anime') {
    // Tóc vuốt nhọn Cyberpunk Cyan & Magenta
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(40, 0, 8, 8);
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(40, 8, 8, 4);
    ctx.fillRect(32, 8, 8, 5);
    ctx.fillRect(48, 8, 8, 5);
  } else if (config.hairHat === 'ar_goggles') {
    // Kính viễn vọng AR Hologram
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 10, 8, 4);
    ctx.fillStyle = '#00f2fe';
    ctx.fillRect(41, 11, 2, 2);
    ctx.fillRect(45, 11, 2, 2);
  } else if (config.hairHat === 'wizard_hat') {
    // Mũ phù thủy tím
    ctx.fillStyle = '#6b21a8';
    ctx.fillRect(39, 6, 10, 3);
    ctx.fillRect(41, 2, 6, 4);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(43, 6, 2, 2);
  }

  // 3. TORSO / BODY (16,16 to 40,32) & JACKET LAYER (16,32 to 40,48)
  const outfitColorMap = {
    lab_coat: '#f8fafc',
    astronaut_nebula: '#3b0764',
    cyber_hoodie: '#0f172a',
    nether_armor: '#1e1b4b',
    nether_tech: '#1e1b4b',
    diamond_armor: '#0891b2',
    stem_pioneer: '#0284c7',
    tuxedo: '#09090b',
    mecha_golem: '#334155'
  };
  const outfitHex = outfitColorMap[config.outfit] || '#0284c7';

  // Front Torso (20,20,8,12)
  fillShadedRect(20, 20, 8, 12, outfitHex);
  // Back Torso (32,20,8,12)
  fillShadedRect(32, 20, 8, 12, outfitHex);
  // Sides Torso (16,20,4,12) and (28,20,4,12)
  fillShadedRect(16, 20, 4, 12, outfitHex);
  fillShadedRect(28, 20, 4, 12, outfitHex);
  // Top & Bottom Torso
  fillShadedRect(20, 16, 8, 4, outfitHex);
  fillShadedRect(28, 16, 8, 4, outfitHex);

  // Outer Torso / Jacket Layer (16,32 to 40,48)
  if (config.outfit === 'lab_coat') {
    // Áo blouse trắng viền Cyan, túi ngực cắm bút
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(20, 36, 1, 12);
    ctx.fillRect(27, 36, 1, 12);
    // Bút trong túi
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(22, 39, 1, 3);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(23, 39, 1, 3);
  } else if (config.outfit === 'diamond_armor') {
    // Giáp Kim Cương với viền Cyan sáng chói
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(21, 36, 6, 2);
    ctx.fillRect(21, 40, 2, 4);
    ctx.fillRect(25, 40, 2, 4);
  } else if (config.outfit === 'astronaut_nebula') {
    // Bảng đồng hồ áp suất ngực phi hành gia
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(23, 38, 2, 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(22, 42, 4, 2);
  } else if (config.outfit === 'cyber_hoodie') {
    // Mã ma trận xanh lá Matrix
    ctx.fillStyle = '#10b981';
    ctx.fillRect(22, 38, 1, 1);
    ctx.fillRect(25, 41, 1, 1);
    ctx.fillRect(23, 44, 1, 1);
  } else if (config.outfit === 'tuxedo') {
    // Áo sơ mi trắng & nơ bướm đỏ
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(23, 36, 2, 6);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(23, 37, 2, 1); // Nơ
  }

  // 4. ARMS (Steve 4px / Alex 3px)
  const isAlex = config.modelType === 'alex';
  const armW = isAlex ? 3 : 4;

  // Right Arm Base (40,16 to 56,32)
  fillShadedRect(44, 20, armW, 12, outfitHex);
  fillShadedRect(40, 20, 4, 12, outfitHex);
  fillShadedRect(44 + armW, 20, 4, 12, outfitHex);
  fillShadedRect(48 + armW, 20, armW, 12, outfitHex);
  fillShadedRect(44, 16, armW, 4, outfitHex); // Vai
  // Bàn tay (4 pixel dưới cùng)
  fillShadedRect(44, 28, armW, 4, baseSkin);

  // Left Arm Base (32,48 to 48,64)
  fillShadedRect(36, 52, armW, 12, outfitHex);
  fillShadedRect(32, 52, 4, 12, outfitHex);
  fillShadedRect(36 + armW, 52, 4, 12, outfitHex);
  fillShadedRect(40 + armW, 52, armW, 12, outfitHex);
  fillShadedRect(36, 48, armW, 4, outfitHex); // Vai
  // Bàn tay
  fillShadedRect(36, 60, armW, 4, baseSkin);

  // 5. LEGS (Quần và Giày Boots)
  const pantsHex = '#1e293b';
  // Right Leg Base (0,16 to 16,32)
  fillShadedRect(4, 20, 4, 12, pantsHex);
  fillShadedRect(0, 20, 4, 12, pantsHex);
  fillShadedRect(8, 20, 4, 12, pantsHex);
  fillShadedRect(12, 20, 4, 12, pantsHex);

  // Left Leg Base (16,48 to 32,64)
  fillShadedRect(20, 52, 4, 12, pantsHex);
  fillShadedRect(16, 52, 4, 12, pantsHex);
  fillShadedRect(24, 52, 4, 12, pantsHex);
  fillShadedRect(28, 52, 4, 12, pantsHex);

  // Giày Boots chuyên dụng
  const bootHex = '#090d16';
  ctx.fillStyle = bootHex;
  ctx.fillRect(4, 28, 4, 4);
  ctx.fillRect(20, 60, 4, 4);
  // Đế giày viền Cyan thể thao
  ctx.fillStyle = '#06b6d4';
  ctx.fillRect(4, 31, 4, 1);
  ctx.fillRect(20, 63, 4, 1);

  return canvas.toDataURL('image/png');
}

// ─── 2D ISOMETRIC HEAD SNAPSHOT AVATAR GENERATOR ────────────────────────────
export function generateIsometricHeadAvatar(config, size = 96) {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const skinColorMap = {
    natural: '#f7c297',
    tan: '#c58c65',
    pale: '#fae1cf',
    cyborg_silver: '#94a3b8',
    alien_green: '#10b981'
  };
  const skin = skinColorMap[config?.skinTone] || '#f7c297';

  // Eye color
  const eyeColorMap = {
    cyan: '#06b6d4',
    ruby: '#f43f5e',
    emerald: '#10b981',
    amethyst: '#a855f7',
    amber: '#f59e0b',
    sunglasses: '#0f172a',
    wink: '#06b6d4',
    herobrine: '#ffffff'
  };
  const eyeHex = eyeColorMap[config?.eyeColor] || '#06b6d4';

  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 48; // scale factor

  ctx.save();
  ctx.translate(cx, cy);

  // Front face (slightly lit)
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-18 * scale, 10 * scale);
  ctx.lineTo(-18 * scale, 32 * scale);
  ctx.lineTo(0, 22 * scale);
  ctx.closePath();
  ctx.fill();

  // Right face (shaded)
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(18 * scale, 10 * scale);
  ctx.lineTo(18 * scale, 32 * scale);
  ctx.lineTo(0, 22 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fill();

  // Top face (brightest)
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-18 * scale, 10 * scale);
  ctx.lineTo(0, -10 * scale);
  ctx.lineTo(18 * scale, 10 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fill();

  // Eyes on front face
  if (config?.eyeColor === 'sunglasses') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-15 * scale, 10 * scale, 6 * scale, 4 * scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-14 * scale, 11 * scale, 2 * scale, 1 * scale);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-14 * scale, 12 * scale, 3 * scale, 2 * scale);
    ctx.fillStyle = eyeHex;
    ctx.fillRect(-11 * scale, 12 * scale, 2 * scale, 2 * scale);
  }

  ctx.restore();

  return canvas.toDataURL('image/png');
}

// ─── MAIN PIXEL SKIN STUDIO COMPONENT ───────────────────────────────────────
function computeIsometricSnapshot(skinState) {
  try {
    if (typeof engineIsometricHeadAvatar === 'function' && !skinState.customSkinUrl) {
      const presetKey = skinState.outfit === 'lab_coat' 
        ? 'stem_steve' 
        : skinState.outfit === 'cyber_hoodie' 
          ? 'cyber_alex' 
          : skinState.outfit === 'astronaut_nebula' 
            ? 'biohazard_hazmat' 
            : 'quantum_physicist';
      const snap = engineIsometricHeadAvatar(presetKey, { size: 128 });
      if (snap) {
        const finalUrl = typeof snap === 'string' ? snap : (snap.toDataURL ? snap.toDataURL() : null);
        if (finalUrl) return finalUrl;
      }
    }
    return generateIsometricHeadAvatar(skinState, 128);
  } catch (e) {
    return generateIsometricHeadAvatar(skinState, 128);
  }
}

export default function PixelSkinStudio({
  isOpen = true,
  onClose,
  initialSkin,
  embedded = false,
  onSaved
}) {
  const { user, personalization, setPersonalization } = useAppStore();

  // Active Category Tab
  const [activeTab, setActiveTab] = useState('model'); // 'model' | 'skin_face' | 'hair_hat' | 'outfit' | 'cape' | 'heldItem'
  const [skinFaceSubTab, setSkinFaceSubTab] = useState('tone'); // 'tone' | 'eyes' | 'expression'

  // Skin Customization State
  const [skinState, setSkinState] = useState(() => {
    const existing = personalization?.voxelSkin || initialSkin || {};
    return {
      modelType: existing.modelType || 'steve',
      skinTone: existing.skinTone || 'natural',
      eyeColor: existing.eyeColor || 'cyan',
      expression: existing.expression || 'smile',
      hairHat: existing.hairHat || 'ar_goggles',
      outfit: existing.outfit || 'lab_coat',
      cape: existing.cape || 'none',
      heldItem: existing.heldItem || 'chemical_flask',
      customSkinUrl: existing.customSkinUrl || null
    };
  });

  // 3D Viewport Controls
  const [autoRotate, setAutoRotate] = useState(true);
  const [currentPose, setCurrentPose] = useState('idle'); // 'idle' | 'wave' | 'combat'
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [showHoloGrid, setShowHoloGrid] = useState(true);
  const [soundMuted, setSoundMuted] = useState(false);

  // Notification / Toast Feedback
  const [toastMessage, setToastMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Hidden File Input Ref
  const fileInputRef = useRef(null);

  // Danh sách các vật phẩm người dùng đã mở khóa
  const unlockedParts = useMemo(() => {
    return personalization?.unlockedParts || ['natural', 'cyan', 'smile', 'none', 'lab_coat', 'chemical_flask', 'stem_pioneer', 'brown_classic'];
  }, [personalization?.unlockedParts]);

  // Generate real 64x64 skin dataUrl whenever state changes
  const activeSkinDataUrl = useMemo(() => {
    if (skinState.customSkinUrl) return skinState.customSkinUrl;
    return generateMinecraft64x64Skin(skinState);
  }, [skinState]);

  // Generate 2D Isometric Head Avatar
  const snapshotAvatarUrl = useMemo(() => computeIsometricSnapshot(skinState), [skinState]);

  // Show Toast
  const showToast = useCallback((msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  }, []);

  // Play Sound helper with mute check
  const playSfx = useCallback((type) => {
    if (soundMuted) return;
    if (type === 'click') playSound.click();
    else if (type === 'hover') playSound.hover();
    else if (type === 'success') playSound.success();
  }, [soundMuted]);

  // Apply Preset
  const handleApplyPreset = (preset) => {
    playSfx('click');
    let presetDataUrl = null;
    try {
      if (typeof generatePresetSkin === 'function') {
        const c = generatePresetSkin(preset.id);
        if (c?.toDataURL) {
          presetDataUrl = c.toDataURL();
        }
      }
    } catch (e) {
      console.warn("Preset generation error", e);
    }

    setSkinState({
      modelType: preset.model,
      skinTone: preset.skinTone,
      eyeColor: preset.eyeColor,
      expression: preset.expression || 'smile',
      hairHat: preset.hairHat,
      outfit: preset.outfit,
      cape: preset.cape,
      heldItem: preset.heldItem,
      customSkinUrl: presetDataUrl
    });
    showToast(`✨ Đã nạp Preset mẫu: ${preset.name}!`);
  };

  // 1. TẢI SKIN TỪ MÁY (IMPORT PNG 64x64 hoặc 64x32 LEGACY)
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playSfx('click');

    // Validation: Image type
    if (!file.type.includes('png') && !file.type.includes('image')) {
      showToast('⚠️ Vui lòng chọn tệp ảnh PNG chuẩn 64x64 pixel!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Check dimensions (Minecraft skins are 64x64 or legacy 64x32)
        if (img.width !== 64 || (img.height !== 64 && img.height !== 32)) {
          showToast(`⚠️ Tỉ lệ ảnh (${img.width}x${img.height}) không phải chuẩn Minecraft 64x64!`, 'error');
          return;
        }

        let finalDataUrl = event.target.result;
        let detectedModel = 'steve';

        // Tự động chuyển đổi skin cổ điển 64x32 sang chuẩn hiện đại 64x64
        if (img.height === 32) {
          const c = document.createElement('canvas');
          c.width = 64;
          c.height = 64;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          // Mirror Right Leg (0,16,16,16) to Left Leg (16,48)
          ctx.drawImage(img, 0, 16, 16, 16, 16, 48, 16, 16);
          // Mirror Right Arm (40,16,16,16) to Left Arm (32,48)
          ctx.drawImage(img, 40, 16, 16, 16, 32, 48, 16, 16);
          finalDataUrl = c.toDataURL('image/png');
        } else {
          // Nhận diện kiểu thân Alex (3px) dựa trên độ trong suốt cột tay phải
          try {
            const c = document.createElement('canvas');
            c.width = 64;
            c.height = 64;
            const ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const p = ctx.getImageData(54, 20, 1, 1).data;
            if (p[3] === 0) detectedModel = 'alex';
          } catch (err) {}
        }

        // Set imported skin texture
        setSkinState(prev => ({
          ...prev,
          modelType: detectedModel,
          customSkinUrl: finalDataUrl
        }));

        playSfx('success');
        showToast('🎉 Tải Skin Minecraft 64x64 thành công! Đã nạp vào khung 3D!');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  // 2. XUẤT SKIN VÀO MINECRAFT (EXPORT PNG 64x64)
  const handleExportMinecraftSkin = () => {
    playSfx('click');
    try {
      const dataUrl = activeSkinDataUrl || generateMinecraft64x64Skin(skinState);
      if (!dataUrl) {
        showToast('⚠️ Không thể xuất Skin, vui lòng thử lại!', 'error');
        return;
      }

      const filename = `STEM_Skin_${skinState.modelType}_${Date.now()}.png`;

      // Use engine downloadSkin if available
      if (typeof engineDownloadSkin === 'function') {
        engineDownloadSkin(dataUrl, filename);
      } else {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      playSfx('success');
      setShowExportModal(true);
      showToast('📥 Đã tải tệp Skin 64x64 PNG về máy! Sẵn sàng cho Minecraft!');
    } catch (err) {
      console.error("Export error", err);
      showToast('⚠️ Lỗi khi xuất tệp Skin Minecraft!', 'error');
    }
  };

  // 3. LƯU NHÂN VẬT (0ms OPTIMISTIC UI)
  const handleSavePersonalization = async () => {
    playSfx('click');
    setIsSaving(true);

    const updatedVoxelSkin = {
      ...skinState,
      updatedAt: Date.now()
    };

    // 0ms Optimistic UI: Update Zustand store immediately
    setPersonalization((prev) => ({
      ...prev,
      voxelSkin: updatedVoxelSkin,
      voxelAvatarUrl: snapshotAvatarUrl || prev?.voxelAvatarUrl
    }));

    // LocalStorage fallback
    try {
      localStorage.setItem('stem_voxel_skin', JSON.stringify(updatedVoxelSkin));
    } catch (e) {
      console.warn("LocalStorage save error", e);
    }

    // Firebase Firestore Sync if user logged in
    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          voxelSkin: updatedVoxelSkin,
          voxelAvatarUrl: snapshotAvatarUrl,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Firestore sync warning (offline or guest):", err);
      }
    }

    setIsSaving(false);
    playSfx('success');
    showToast('💾 Đã lưu & đồng bộ nhân vật Pixel STEM HUB thành công!');
    if (onSaved) onSaved(updatedVoxelSkin);
  };

  if (!isOpen) return null;

  return (
    <div className={`w-full text-slate-100 ${embedded ? '' : 'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xl overflow-y-auto'}`}>
      
      {/* Hidden File Input for Minecraft Skin Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportFile} 
        accept="image/png" 
        className="hidden" 
      />

      {/* Main Studio Frame */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25 }}
        className={`relative w-full max-w-7xl rounded-2xl sm:rounded-3xl border border-cyan-500/30 bg-slate-950/90 shadow-[0_0_80px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden ${
          embedded ? 'min-h-[720px]' : 'max-h-[95vh] h-[92vh]'
        }`}
      >
        {/* Hologram Scanline & Grid Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500 shadow-[0_0_20px_rgba(6,182,212,0.8)]" />

        {/* ─── HEADER BAR ─────────────────────────────────────────────────── */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-cyan-500/20 bg-slate-900/60 backdrop-blur-md">
          {/* Studio Brand */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400/50">
              <Box className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '30s' }} />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wider uppercase bg-gradient-to-r from-cyan-300 via-sky-200 to-white bg-clip-text text-transparent">
                  PIXEL SKIN STUDIO
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-500/40">
                  Minecraft 64x64 UV
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                STEM HUB Voxel 3D Engine • Cá nhân hóa & Xuất Skin thật
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Import Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={() => playSfx('hover')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/40 hover:border-cyan-400 transition-all shadow-sm active:scale-95"
              title="Nhập Skin Minecraft 64x64 PNG từ máy tính của bạn"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tải Skin từ máy</span>
              <span className="md:hidden">Tải PNG</span>
            </button>

            {/* Export Minecraft Skin Button */}
            <button
              onClick={handleExportMinecraftSkin}
              onMouseEnter={() => playSfx('hover')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/40 hover:border-emerald-400 transition-all shadow-sm active:scale-95"
              title="Xuất tệp Skin PNG 64x64 chuẩn Minecraft để chơi game"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Xuất Skin Minecraft</span>
              <span className="md:hidden">Xuất Game</span>
            </button>

            {/* Save Button (0ms) */}
            <button
              onClick={handleSavePersonalization}
              disabled={isSaving}
              onMouseEnter={() => playSfx('hover')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-300 hover:from-cyan-300 hover:to-sky-200 border border-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all active:scale-95"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Lưu Nhân Vật</span>
            </button>

            {/* Close Button if not embedded */}
            {!embedded && onClose && (
              <button
                onClick={() => {
                  playSfx('click');
                  onClose();
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white bg-slate-800/60 hover:bg-rose-950/40 hover:border-rose-500/40 border border-slate-700/60 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ─── BODY GRID: LEFT 3D VIEWPORT & RIGHT CATEGORY TABS ─────────── */}
        <div className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* ════ LEFT COLUMN: 3D VOXEL INTERACTIVE VIEWPORT ═══════════════ */}
          <div className="w-full lg:w-5/12 xl:w-9/20 relative flex flex-col border-b lg:border-b-0 lg:border-r border-cyan-500/20 bg-slate-950/80">
            
            {/* Viewport Top HUD Indicators */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-slate-900/90 text-cyan-300 border border-cyan-500/30 backdrop-blur-md shadow-sm">
                  {skinState.modelType === 'steve' ? 'STEVE 4PX' : skinState.modelType === 'alex' ? 'ALEX 3PX SLIM' : 'CYBORG VOXEL'}
                </span>

                {skinState.customSkinUrl && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/40">
                    PNG Tùy Biến
                  </span>
                )}
              </div>

              {/* Viewport Control Buttons */}
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <button
                  onClick={() => {
                    playSfx('click');
                    setAutoRotate(prev => !prev);
                  }}
                  className={`w-7 h-7 rounded-md flex items-center justify-center border text-xs transition-all ${
                    autoRotate 
                      ? 'bg-cyan-950/80 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Bật/Tắt xoay 360 độ tự động"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
                </button>

                <button
                  onClick={() => {
                    playSfx('click');
                    setShowHoloGrid(prev => !prev);
                  }}
                  className={`w-7 h-7 rounded-md flex items-center justify-center border text-xs transition-all ${
                    showHoloGrid 
                      ? 'bg-purple-950/80 text-purple-400 border-purple-500/50' 
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Bật/Tắt lưới Hologram"
                >
                  <Box className="w-3.5 h-3.5" />
                </button>

                {/* Reset Camera View Button */}
                <button
                  onClick={() => {
                    playSfx('click');
                    setZoomLevel(1.0);
                    setResetTrigger(prev => prev + 1);
                    showToast('🎯 Đã căn chỉnh góc nhìn camera toàn thân!');
                  }}
                  className="w-7 h-7 rounded-md bg-slate-900/80 hover:bg-cyan-950/80 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-center transition-all"
                  title="Căn chỉnh lại góc nhìn toàn thân mặc định"
                >
                  <Target className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    playSfx('click');
                    setZoomLevel(prev => Math.min(Number((prev + 0.15).toFixed(2)), 2.2));
                  }}
                  className="w-7 h-7 rounded-md bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center justify-center"
                  title="Phóng to camera"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    playSfx('click');
                    setZoomLevel(prev => Math.max(Number((prev - 0.15).toFixed(2)), 0.6));
                  }}
                  className="w-7 h-7 rounded-md bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center justify-center"
                  title="Thu nhỏ camera"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Custom Skin Loaded Notice Banner */}
            {skinState.customSkinUrl && (
              <div className="absolute top-12 left-3 right-3 z-20 flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500/50 backdrop-blur-md text-[11px] font-mono text-emerald-200">
                <span className="flex items-center gap-1.5 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Đang xem Skin nạp từ máy tính
                </span>
                <button
                  onClick={() => {
                    playSfx('click');
                    setSkinState(prev => ({ ...prev, customSkinUrl: null }));
                    showToast('🎨 Đã chuyển sang chế độ tự phối đồ Pixel!');
                  }}
                  className="ml-2 px-2 py-0.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[10px] shrink-0"
                >
                  Tự Phối Đồ
                </button>
              </div>
            )}

            {/* 3D Canvas Container */}
            <div className="relative flex-1 min-h-[460px] sm:min-h-[500px] lg:min-h-[540px] h-[540px] flex items-center justify-center overflow-hidden">
              {/* Sci-fi Cyber Background Pedestal */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {showHoloGrid && (
                  <div className="w-[320px] h-[320px] rounded-full border border-cyan-500/20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-slate-950/50 to-transparent" />
                )}
                <div className="absolute bottom-6 w-56 h-12 rounded-[100%] bg-cyan-500/15 blur-xl pointer-events-none" />
                <div className="absolute bottom-10 w-44 h-8 rounded-[100%] border border-cyan-400/30 bg-cyan-950/20 shadow-[0_0_30px_rgba(6,182,212,0.3)] pointer-events-none" />
              </div>

              {/* RENDER 3D VOXEL CHARACTER */}
              <VoxelCharacter3D 
                skin={activeSkinDataUrl}
                skinTexture={activeSkinDataUrl}
                skinConfig={skinState}
                modelType={skinState.modelType === 'alex' ? 'alex' : 'steve'}
                cape={
                  skinState.cape === 'dragon_elo' ? 'dragon_elo' :
                  skinState.cape === 'matrix' ? 'matrix' :
                  skinState.cape === 'aurora' ? 'aurora' :
                  skinState.cape === 'hazard' ? 'hazard' :
                  skinState.cape === 'migrator_creeper' ? 'migrator_creeper' :
                  skinState.cape === 'none' ? 'none' : 'stem'
                }
                heldItem={
                  skinState.heldItem === 'diamond_sword' ? 'diamond_sword' :
                  skinState.heldItem === 'chemical_flask' ? 'test_tube' :
                  skinState.heldItem === 'diamond_pickaxe' ? 'pickaxe' :
                  (skinState.heldItem === 'stem_trophy' || skinState.heldItem === 'ruler_3d') ? 'stem_tablet' :
                  skinState.heldItem === 'none' ? 'none' : 'test_tube'
                }
                animation={currentPose === 'wave' ? 'wave' : currentPose === 'combat' ? 'combat' : 'idle'}
                pose={currentPose}
                autoRotate={autoRotate}
                autoRotateSpeed={1.2}
                enableZoom={true}
                enableRotate={true}
                zoomLevel={zoomLevel}
                resetTrigger={resetTrigger}
                height="100%"
                width="100%"
                className="w-full h-full"
              />

              {/* Pose Selector Buttons (Bottom left of Viewport) */}
              <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-cyan-500/30 backdrop-blur-md">
                {[
                  { id: 'idle', label: 'Đứng Yên', icon: '🧍' },
                  { id: 'wave', label: 'Vẫy Chào', icon: '👋' },
                  { id: 'combat', label: 'Chiến Đấu', icon: '⚔️' }
                ].map((pose) => (
                  <button
                    key={pose.id}
                    onClick={() => {
                      playSfx('click');
                      setCurrentPose(pose.id);
                    }}
                    className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition-all ${
                      currentPose === pose.id
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="mr-1">{pose.icon}</span>
                    <span>{pose.label}</span>
                  </button>
                ))}
              </div>

              {/* 2D Snapshot Avatar Badge (Bottom Right of Viewport) */}
              {snapshotAvatarUrl && (
                <div 
                  className="absolute bottom-3 right-3 z-20 group relative flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-cyan-500/30 backdrop-blur-md cursor-pointer hover:border-cyan-400 transition-all"
                  onClick={() => {
                    playSfx('click');
                    setPersonalization({ voxelAvatarUrl: snapshotAvatarUrl });
                    showToast('🌟 Đã đặt diện mạo Pixel làm Avatar đại diện chính của bạn!');
                  }}
                  title="Nhấn để dùng ảnh 2D này làm Avatar BXH STEM HUB"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={snapshotAvatarUrl} 
                    alt="Head Snapshot" 
                    className="w-8 h-8 rounded-lg bg-slate-950 border border-cyan-500/40 object-contain shadow-inner" 
                  />
                  <div className="pr-1 text-left">
                    <span className="text-[10px] font-mono block text-cyan-400 font-bold leading-tight">
                      AVATAR 2D
                    </span>
                    <span className="text-[9px] text-slate-400 block leading-tight">
                      Dùng cho BXH
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Preset Strip (Bottom of Left Column) */}
            <div className="p-3 border-t border-cyan-500/20 bg-slate-950/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Preset Khoa Học 1-Click:
                </span>
                <span className="text-[10px] font-mono text-cyan-400/80">
                  {PRESET_SKINS.length} Mẫu Chuẩn
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_SKINS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    onMouseEnter={() => playSfx('hover')}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-cyan-950/30 hover:border-cyan-500/40 transition-all text-center group active:scale-95"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">
                      {preset.icon}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-slate-300 group-hover:text-cyan-300 mt-1 truncate w-full">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ════ RIGHT COLUMN: CATEGORIZED CUSTOMIZATION TABS ══════════════ */}
          <div className="w-full lg:w-7/12 xl:w-11/20 flex flex-col bg-slate-900/30 backdrop-blur-md overflow-hidden">
            
            {/* Category Tab Bar */}
            <div className="flex items-center overflow-x-auto no-scrollbar border-b border-cyan-500/20 bg-slate-950/60 px-2 pt-2 gap-1">
              {[
                { id: 'model', label: 'Dáng Người', icon: User, color: 'text-cyan-400' },
                { id: 'skin_face', label: 'Da & Mắt & Biểu Cảm', icon: Palette, color: 'text-amber-400' },
                { id: 'hair_hat', label: 'Tóc & Mũ', icon: ShieldCheck, color: 'text-emerald-400' },
                { id: 'outfit', label: 'Trang Phục', icon: Shirt, color: 'text-sky-400' },
                { id: 'cape', label: 'Áo Choàng', icon: Flame, color: 'text-purple-400' },
                { id: 'heldItem', label: 'Cầm Tay', icon: FlaskConical, color: 'text-rose-400' },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      playSfx('click');
                      setActiveTab(tab.id);
                    }}
                    onMouseEnter={() => playSfx('hover')}
                    className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-t-xl text-xs font-mono font-medium whitespace-nowrap transition-all ${
                      isActive 
                        ? 'text-white bg-slate-900 border-t border-x border-cyan-500/30 shadow-[0_-5px_15px_rgba(6,182,212,0.1)]' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 ${isActive ? tab.color : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400" 
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content Panel (Scrollable) */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
              
              {/* ─── TAB 1: DÁNG NGƯỜI & MODEL ───────────────────────────── */}
              {activeTab === 'model' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                        Chọn Khung Thân & Sải Tay Voxel
                      </h3>
                      <p className="text-xs text-slate-400">
                        Quyết định độ rộng cánh tay (Steve 4px cổ điển hoặc Alex 3px thon gọn)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {MODEL_OPTIONS.map((model) => {
                      const isSelected = skinState.modelType === model.id;
                      return (
                        <div
                          key={model.id}
                          onClick={() => {
                            playSfx('click');
                            setSkinState(prev => ({ ...prev, modelType: model.id, customSkinUrl: null }));
                          }}
                          onMouseEnter={() => playSfx('hover')}
                          className={`relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group active:scale-98 ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}

                          <div>
                            <div className="text-2xl mb-2">{model.icon}</div>
                            <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 font-mono">
                              {model.name}
                            </h4>
                            <span className={`inline-block my-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${model.badgeColor}`}>
                              {model.armWidth} • {model.tag}
                            </span>
                            <p className="text-xs text-slate-400 line-clamp-2">
                              {model.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Model Technical Note */}
                  <div className="p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-950/20 flex items-start gap-3">
                    <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-cyan-300/90 leading-relaxed font-mono">
                      Khung nhân vật tương thích hoàn hảo với hệ thống nạp Skin của Minecraft Launcher (Cài đặt chọn Steve: Classic, Alex: Slim).
                    </p>
                  </div>
                </div>
              )}

              {/* ─── TAB 2: DA & MẮT & BIỂU CẢM ─────────────────────────── */}
              {activeTab === 'skin_face' && (
                <div className="space-y-6">
                  {/* Sub-tab Switcher: Tone / Eyes / Expression */}
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    {[
                      { id: 'tone', label: '1. Màu Da Pixel', icon: Palette },
                      { id: 'eyes', label: '2. Đôi Mắt Lượng Tử', icon: Eye },
                      { id: 'expression', label: '3. Khuôn Miệng & Biểu Cảm', icon: Smile }
                    ].map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          playSfx('click');
                          setSkinFaceSubTab(sub.id);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                          skinFaceSubTab === sub.id 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        <sub.icon className="w-3.5 h-3.5" />
                        <span>{sub.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* SUB 1: SKIN TONES */}
                  {skinFaceSubTab === 'tone' && (
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide mb-1">
                        Màu Da Pixel Chuẩn Khoa Học
                      </h3>
                      <p className="text-xs text-slate-400 mb-3">
                        Lớp màu sắc tố biểu bì được tổng hợp từ 4 cấp độ sáng và đổ bóng pixel tự nhiên
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {SKIN_TONE_OPTIONS.map((tone) => {
                          const isSelected = skinState.skinTone === tone.id;
                          return (
                            <div
                              key={tone.id}
                              onClick={() => {
                                playSfx('click');
                                setSkinState(prev => ({ ...prev, skinTone: tone.id, customSkinUrl: null }));
                              }}
                              onMouseEnter={() => playSfx('hover')}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center group active:scale-95 ${
                                isSelected
                                  ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                              }`}
                            >
                              <div className="w-12 h-12 rounded-lg border-2 border-slate-700 flex flex-wrap overflow-hidden shadow-md group-hover:scale-105 transition-transform mb-2">
                                {tone.palette.map((c, i) => (
                                  <div key={i} className="w-6 h-6" style={{ backgroundColor: c }} />
                                ))}
                              </div>

                              <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 font-mono">
                                {tone.name}
                              </span>
                              <span className={`text-[9px] font-mono mt-1 px-1.5 py-0.5 rounded border ${tone.rarityColor}`}>
                                {tone.rarity}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SUB 2: EYES */}
                  {skinFaceSubTab === 'eyes' && (
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide mb-1">
                        Màu Mắt Phát Sáng Lượng Tử & Kính Râm
                      </h3>
                      <p className="text-xs text-slate-400 mb-3">
                        Tùy biến tròng mắt 2x1 phát quang hoặc kính râm 2x2 siêu ngầu
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {EYE_COLOR_OPTIONS.map((eye) => {
                          const isSelected = skinState.eyeColor === eye.id;
                          return (
                            <div
                              key={eye.id}
                              onClick={() => {
                                playSfx('click');
                                setSkinState(prev => ({ ...prev, eyeColor: eye.id, customSkinUrl: null }));
                              }}
                              onMouseEnter={() => playSfx('hover')}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center group active:scale-95 ${
                                isSelected
                                  ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                              }`}
                            >
                              <div className="relative my-2 flex items-center justify-center">
                                <div 
                                  className="w-8 h-4 rounded-xs border border-white/60 shadow-[0_0_15px_currentColor] transition-transform group-hover:scale-110"
                                  style={{ backgroundColor: eye.hex, color: eye.hex }}
                                />
                              </div>

                              <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 font-mono">
                                {eye.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono mt-1">
                                {eye.badge}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SUB 3: EXPRESSIONS */}
                  {skinFaceSubTab === 'expression' && (
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide mb-1">
                        Khuôn Miệng & Biểu Cảm Khuôn Mặt
                      </h3>
                      <p className="text-xs text-slate-400 mb-3">
                        Thể hiện cảm xúc và cá tính của nhân vật qua các nét vẽ Pixel Art đặc sắc
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {EXPRESSION_OPTIONS.map((exp) => {
                          const isSelected = skinState.expression === exp.id;
                          return (
                            <div
                              key={exp.id}
                              onClick={() => {
                                playSfx('click');
                                setSkinState(prev => ({ ...prev, expression: exp.id, customSkinUrl: null }));
                              }}
                              onMouseEnter={() => playSfx('hover')}
                              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 group active:scale-98 ${
                                isSelected
                                  ? 'border-amber-400 bg-amber-950/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                              }`}
                            >
                              <div className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                                {exp.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-amber-300 font-mono">
                                    {exp.name}
                                  </h4>
                                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getRarityBadge(exp.rarity)}`}>
                                    {exp.rarity}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                                  {exp.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── TAB 3: TÓC & MŨ BẢO HỘ ──────────────────────────────── */}
              {activeTab === 'hair_hat' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                      Mũ Bảo Hộ & Tóc Nghiên Cứu Viên
                    </h3>
                    <p className="text-xs text-slate-400">
                      Lớp 3D Hat Layer (9x9x9) bao bọc quanh đầu bảo vệ và thể hiện cá tính
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {HAIR_HAT_OPTIONS.map((item) => {
                      const isSelected = skinState.hairHat === item.id;
                      const isUnlocked = item.rarity === 'Cơ bản' || unlockedParts.includes(item.id);

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            playSfx('click');
                            setSkinState(prev => ({ ...prev, hairHat: item.id, customSkinUrl: null }));
                          }}
                          onMouseEnter={() => playSfx('hover')}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 group active:scale-98 ${
                            isSelected
                              ? 'border-emerald-400 bg-emerald-950/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                            {item.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 font-mono truncate">
                                {item.name}
                              </h4>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${getRarityBadge(item.rarity)}`}>
                                {item.rarity}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                              {item.desc}
                            </p>
                            <div className="flex items-center justify-between mt-1.5">
                              {item.statBoost && (
                                <span className="text-[10px] font-mono text-emerald-400">
                                  ⚡ {item.statBoost}
                                </span>
                              )}
                              {isUnlocked ? (
                                <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> Đã mở
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono text-amber-400 flex items-center gap-0.5">
                                  <Lock className="w-3 h-3" /> Gacha / Thử đồ
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── TAB 4: TRANG PHỤC LAB & CYBER ────────────────────────── */}
              {activeTab === 'outfit' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                      Trang Phục Phòng Lab, Giáp Kim Cương & Cyberpunk
                    </h3>
                    <p className="text-xs text-slate-400">
                      Bao phủ thân, cánh tay và chân với các chất liệu cách điện, chống bức xạ công nghệ cao
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {OUTFIT_OPTIONS.map((outfit) => {
                      const isSelected = skinState.outfit === outfit.id;
                      const isUnlocked = outfit.rarity === 'Cơ bản' || unlockedParts.includes(outfit.id) || unlockedParts.includes('nether_tech');

                      return (
                        <div
                          key={outfit.id}
                          onClick={() => {
                            playSfx('click');
                            setSkinState(prev => ({ ...prev, outfit: outfit.id, customSkinUrl: null }));
                          }}
                          onMouseEnter={() => playSfx('hover')}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 group active:scale-98 ${
                            isSelected
                              ? 'border-sky-400 bg-sky-950/30 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                            {outfit.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-slate-200 group-hover:text-sky-300 font-mono truncate">
                                {outfit.name}
                              </h4>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${getRarityBadge(outfit.rarity)}`}>
                                {outfit.rarity}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                              {outfit.desc}
                            </p>
                            <div className="flex items-center justify-between mt-1.5">
                              {outfit.statBoost && (
                                <span className="text-[10px] font-mono text-sky-400">
                                  🛡️ {outfit.statBoost}
                                </span>
                              )}
                              {isUnlocked ? (
                                <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> Đã mở
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono text-amber-400 flex items-center gap-0.5">
                                  <Lock className="w-3 h-3" /> Gacha / Thử đồ
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── TAB 5: ÁO CHOÀNG ĐỘNG (CAPES) ────────────────────────── */}
              {activeTab === 'cape' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                      Áo Choàng Động Voxel (Dynamic Capes)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Vẫy bay theo nhịp di chuyển với hiệu ứng sóng cực quang, rồng hoàng kim và creeper
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CAPE_OPTIONS.map((cape) => {
                      const isSelected = skinState.cape === cape.id;
                      const isUnlocked = cape.id === 'none' || unlockedParts.includes(cape.id);

                      return (
                        <div
                          key={cape.id}
                          onClick={() => {
                            playSfx('click');
                            setSkinState(prev => ({ ...prev, cape: cape.id }));
                          }}
                          onMouseEnter={() => playSfx('hover')}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 group active:scale-98 ${
                            isSelected
                              ? 'border-purple-400 bg-purple-950/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                            {cape.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-slate-200 group-hover:text-purple-300 font-mono truncate">
                                {cape.name}
                              </h4>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${getRarityBadge(cape.rarity)}`}>
                                {cape.rarity}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                              {cape.desc}
                            </p>
                            <div className="flex items-center justify-between mt-1.5">
                              {cape.particle && (
                                <span className="text-[10px] font-mono text-purple-400">
                                  ✨ {cape.particle}
                                </span>
                              )}
                              {isUnlocked ? (
                                <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> Đã mở
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono text-amber-400 flex items-center gap-0.5">
                                  <Lock className="w-3 h-3" /> Gacha / Thử đồ
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── TAB 6: VẬT PHẨM CẦM TAY (HELD ITEM) ───────────────────── */}
              {activeTab === 'heldItem' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                      Vật Phẩm Cầm Tay Khoa Học & Chiến Đấu (Held Item)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Trang bị trên tay vũ khí, dụng cụ thí nghiệm và biểu tượng chiến thắng của STEM
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {HELD_ITEM_OPTIONS.map((item) => {
                      const isSelected = skinState.heldItem === item.id;
                      const isUnlocked = item.id === 'none' || unlockedParts.includes(item.id);

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            playSfx('click');
                            setSkinState(prev => ({ ...prev, heldItem: item.id }));
                          }}
                          onMouseEnter={() => playSfx('hover')}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 group active:scale-98 ${
                            isSelected
                              ? 'border-rose-400 bg-rose-950/30 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                            {item.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-slate-200 group-hover:text-rose-300 font-mono truncate">
                                {item.name}
                              </h4>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${getRarityBadge(item.rarity)}`}>
                                {item.rarity}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                              {item.desc}
                            </p>
                            <div className="flex items-center justify-between mt-1.5">
                              {isUnlocked ? (
                                <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> Đã mở
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono text-amber-400 flex items-center gap-0.5">
                                  <Lock className="w-3 h-3" /> Gacha / Thử đồ
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* ─── BOTTOM SUMMARY BAR ───────────────────────────────────────── */}
            <div className="p-3.5 sm:p-4 border-t border-cyan-500/20 bg-slate-950/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-slate-200 block">
                    ĐỒNG BỘ 0MS THỜI GIAN THỰC
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono block">
                    Tương thích: Minecraft Java / Bedrock • STEM Đấu Trường
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSavePersonalization}
                  disabled={isSaving}
                  onMouseEnter={() => playSfx('hover')}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all active:scale-95"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>LƯU & ĐỒNG BỘ HỒ SƠ</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </motion.div>

      {/* ─── TOAST NOTIFICATION POPUP ─────────────────────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl flex items-center gap-3 max-w-md ${
              toastMessage.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200 shadow-rose-950/50'
                : 'bg-slate-900/90 border-cyan-500/50 text-cyan-200 shadow-cyan-950/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <p className="text-xs font-mono">{toastMessage.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MINECRAFT IMPORT INSTRUCTION MODAL ────────────────────────────── */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-md w-full rounded-2xl border border-cyan-500/40 bg-slate-900/95 p-6 shadow-2xl text-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold font-mono uppercase text-white">
                    HƯỚNG DẪN CÀI SKIN VÀO MINECRAFT
                  </h3>
                </div>
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300 font-mono">
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-cyan-400 block">
                    💻 Minecraft: Java Edition
                  </span>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                    <li>Mở Minecraft Launcher trên máy tính.</li>
                    <li>Vào mục <b className="text-slate-200">Skins</b> ở thanh menu trên cùng.</li>
                    <li>Nhấn <b className="text-slate-200">New Skin</b>, chọn Model (<b className="text-cyan-300">{skinState.modelType === 'alex' ? 'Slim' : 'Classic'}</b>).</li>
                    <li>Nhấn <b className="text-slate-200">Browse</b> và chọn tệp PNG vừa tải về!</li>
                  </ol>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-emerald-400 block">
                    📱 Minecraft Bedrock / Mobile
                  </span>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                    <li>Mở game Minecraft, chọn <b className="text-slate-200">Dressing Room</b>.</li>
                    <li>Chọn <b className="text-slate-200">Edit Character</b> &gt; tab <b className="text-slate-200">Classic Skins</b>.</li>
                    <li>Nhấn <b className="text-slate-200">Choose New Skin</b> và nạp tệp PNG.</li>
                  </ol>
                </div>
              </div>

              <button
                onClick={() => setShowExportModal(false)}
                className="w-full py-2 rounded-xl text-xs font-mono font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all"
              >
                ĐÃ HIỂU, CẢM ƠN!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
