import React from 'react';
import { Crown, Sparkles, Shield, Flame, Zap, Trophy } from 'lucide-react';

export const getFrameStyle = (frame) => {
  switch (frame) {
    case 'neon_fire':
      return 'border-2 border-rose-500 shadow-[0_0_15px_#f43f5e]';
    case 'cyan_tech':
      return 'border-2 border-cyan-400 shadow-[0_0_15px_#22d3ee]';
    case 'cosmic_nebula':
      return 'border-2 border-purple-500 shadow-[0_0_15px_#a855f7]';
    case 'blackhole_gravity':
      return 'border-2 border-indigo-700 shadow-[0_0_15px_#4338ca]';
    case 'antimatter_era':
      return 'border-2 border-fuchsia-500 shadow-[0_0_15px_#d946ef]';
    case 'multiverse_overlord':
      return 'border-2 border-cyan-400 shadow-[0_0_18px_#22d3ee,0_0_8px_#ec4899] animate-pulse';
    case 'top_1_sovereign':
      return 'border-2 border-amber-400 shadow-[0_0_18px_#fbbf24,0_0_6px_#ffffff]';
    case 'gold_vip':
      return 'border-2 border-amber-400 shadow-[0_0_15px_#fbbf24] animate-pulse';
    case 'top_100_silver':
      return 'border-2 border-slate-300 shadow-[0_0_12px_#cbd5e1]';
    default:
      return 'border border-border-theme';
  }
};

export const AvatarFrame = ({ frame, children, className = 'w-12 h-12 text-base' }) => {
  const frameStyle = getFrameStyle(frame);

  return (
    <div className={`${className} rounded-full bg-accent-pink/10 flex items-center justify-center text-accent-pink font-extrabold relative shrink-0 ${frameStyle}`}>
      {children}
      
      {/* 👑 TOP 1: Crown and Side Laurel/Wings */}
      {frame === 'top_1_sovereign' && (
        <>
          <div className="absolute -top-[13px] left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_0_5px_rgba(251,191,36,0.9)] animate-pulse">
            <Crown className="w-5 h-5 text-amber-300 fill-amber-400" />
          </div>
          <div className="absolute -left-[7px] top-1/2 -translate-y-1/2 text-[10px] text-amber-400 z-10 pointer-events-none select-none opacity-90 scale-x-[-1] animate-pulse">
            ⚜️
          </div>
          <div className="absolute -right-[7px] top-1/2 -translate-y-1/2 text-[10px] text-amber-400 z-10 pointer-events-none select-none opacity-90 animate-pulse">
            ⚜️
          </div>
        </>
      )}

      {/* 🏆 TOP 10: Golden Star Badge & Sparkles */}
      {frame === 'gold_vip' && (
        <>
          <div className="absolute -bottom-1 -right-1 z-30 drop-shadow-[0_0_3px_#fbbf24] bg-amber-500 p-0.5 rounded-full border border-white/20">
            <Trophy className="w-2.5 h-2.5 text-white" />
          </div>
          <div className="absolute -top-1 -left-1 text-amber-400 z-10 animate-pulse">
            <Sparkles className="w-3 h-3" />
          </div>
        </>
      )}

      {/* 🛡️ TOP 100: Silver Knight Shield */}
      {frame === 'top_100_silver' && (
        <>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_0_3px_#cbd5e1] bg-slate-500 p-0.5 rounded-full border border-white/20">
            <Shield className="w-2.5 h-2.5 text-white fill-slate-300" />
          </div>
        </>
      )}

      {/* 🔥 Neon Fire: Floating Flame at Bottom */}
      {frame === 'neon_fire' && (
        <>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_0_5px_#f43f5e]">
            <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-600 animate-pulse" />
          </div>
        </>
      )}

      {/* ⚡ Cyan Tech: Glowing Microchip Node */}
      {frame === 'cyan_tech' && (
        <>
          <div className="absolute -top-1 -right-1 z-30 drop-shadow-[0_0_4px_#22d3ee] bg-cyan-400 p-0.5 rounded-full border border-white/20">
            <Zap className="w-2 h-2 text-white" />
          </div>
        </>
      )}

      {/* 🌌 Multiverse Overlord: Astral Stars */}
      {frame === 'multiverse_overlord' && (
        <>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 text-cyan-400 text-[10px] animate-pulse">
            ✦
          </div>
          <div className="absolute -bottom-1 -left-1 text-pink-400 text-[10px] animate-pulse">
            ✦
          </div>
          <div className="absolute -bottom-1 -right-1 text-cyan-400 text-[10px] animate-pulse">
            ✦
          </div>
        </>
      )}

      {/* ⚛️ Antimatter Era: Particle Orbit Decors */}
      {frame === 'antimatter_era' && (
        <>
          <div className="absolute -top-1.5 -left-1 text-[8px] text-fuchsia-400 animate-pulse">
            ⚛️
          </div>
          <div className="absolute -bottom-1.5 -right-1 text-[8px] text-fuchsia-400 animate-pulse">
            ⚛️
          </div>
        </>
      )}
    </div>
  );
};
