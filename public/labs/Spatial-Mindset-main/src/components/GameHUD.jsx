import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

// =====================
// Rank system
// =====================
export const RANKS = [
  { name: 'Beginner',  minXP: 0,    color: '#94a3b8', emoji: '🌱', shadow: '148,163,184', level: 1 },
  { name: 'Bronze',    minXP: 100,  color: '#cd7f32', emoji: '🥉', shadow: '205,127,50',  level: 2 },
  { name: 'Silver',    minXP: 300,  color: '#94a3b8', emoji: '🥈', shadow: '148,163,184', level: 3 },
  { name: 'Gold',      minXP: 600,  color: '#fbbf24', emoji: '🥇', shadow: '251,191,36',  level: 4 },
  { name: 'Platinum',  minXP: 1000, color: '#67e8f9', emoji: '💎', shadow: '103,232,249', level: 5 },
  { name: 'Diamond',   minXP: 2000, color: '#a78bfa', emoji: '💠', shadow: '167,139,250', level: 6 },
  { name: 'Master',    minXP: 4000, color: '#f43f5e', emoji: '👑', shadow: '244,63,94',    level: 7 },
];

export function getRankInfo(xp) {
  let current = RANKS[0];
  let next = RANKS[1];
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].minXP) {
      current = RANKS[i];
      next = RANKS[i + 1] || null;
    }
  }
  return { current, next };
}

export function getXPProgress(xp) {
  const { current, next } = getRankInfo(xp);
  if (!next) return 100;
  const range = next.minXP - current.minXP;
  const progress = xp - current.minXP;
  return Math.min(100, (progress / range) * 100);
}

// =====================
// Level-Up Celebration Overlay
// =====================
function LevelUpOverlay({ rank, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] flex items-center justify-center pointer-events-none"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}
    >
      {/* Radial glow behind */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-30"
        style={{
          background: `radial-gradient(circle, rgba(${rank.shadow},0.8) 0%, transparent 70%)`,
          animation: 'ping 1s ease-out',
        }}
      />

      <motion.div
        initial={{ scale: 0.3, rotate: -10, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
        className="flex flex-col items-center gap-4 text-center"
      >
        {/* Rank emoji */}
        <motion.div
          animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.3, 1.3, 1.1, 1.1, 1] }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-8xl"
          style={{ filter: `drop-shadow(0 0 30px rgba(${rank.shadow},0.8))` }}
        >
          {rank.emoji}
        </motion.div>

        {/* "RANK UP!" text */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p
            className="text-[11px] font-black uppercase tracking-[0.4em] mb-1"
            style={{ color: rank.color }}
          >
            Thăng hạng!
          </p>
          <h2
            className="text-5xl font-black uppercase tracking-tight"
            style={{
              color: rank.color,
              textShadow: `0 0 40px rgba(${rank.shadow},0.8), 0 0 80px rgba(${rank.shadow},0.4)`,
            }}
          >
            {rank.name}
          </h2>
          <p className="text-slate-400 text-sm mt-3 font-bold">
            Chúc mừng! Bạn đã lên hạng mới 🎉
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// =====================
// Floating XP Toast
// =====================
function XPPopup({ amount, id, onDone }) {
  return (
    <motion.div
      key={id}
      initial={{ y: 0, opacity: 1, scale: 1 }}
      animate={{ y: -60, opacity: 0, scale: 1.3 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      onAnimationComplete={onDone}
      className="absolute right-0 top-0 text-emerald-400 font-black text-sm pointer-events-none select-none"
      style={{ textShadow: '0 0 12px rgba(52,211,153,0.8)' }}
    >
      +{amount} XP ✨
    </motion.div>
  );
}

// =====================
// Main GameHUD
// =====================
export default function GameHUD({ xp, streak, onOpenProfile }) {
  const { current, next } = getRankInfo(xp);
  const progress = getXPProgress(xp);
  const [popups, setPopups] = useState([]);
  const [levelUpRank, setLevelUpRank] = useState(null);
  const prevXP = useRef(xp);
  const prevRank = useRef(current.name);

  // Detect XP increase → popup, detect rank change → level-up overlay
  useEffect(() => {
    const diff = xp - prevXP.current;
    if (diff > 0) {
      const id = Date.now();
      setPopups(p => [...p, { id, amount: diff }]);
    }

    const { current: newRank } = getRankInfo(xp);
    if (newRank.name !== prevRank.current) {
      setLevelUpRank(newRank);
      prevRank.current = newRank.name;
    }

    prevXP.current = xp;
  }, [xp]);

  const removePopup = (id) => setPopups(p => p.filter(x => x.id !== id));

  return (
    <>
      {/* Level-up overlay */}
      <AnimatePresence>
        {levelUpRank && (
          <LevelUpOverlay rank={levelUpRank} onDone={() => setLevelUpRank(null)} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', damping: 20 }}
        className="fixed top-8 right-8 z-[60] flex flex-col items-end gap-2"
      >
        {/* Rank + XP Bar Card */}
        <motion.div
          className="relative flex items-center gap-3 px-4 py-2.5 rounded-2xl border cursor-pointer group"
          style={{
            background: 'rgba(2,6,23,0.7)',
            backdropFilter: 'blur(20px)',
            borderColor: `rgba(${current.shadow},0.3)`,
            boxShadow: `0 0 20px rgba(${current.shadow},0.15)`,
          }}
          whileHover={{ scale: 1.03, boxShadow: `0 0 30px rgba(${current.shadow},0.3)` }}
          onClick={onOpenProfile}
          title="Xem hồ sơ"
        >
          {/* Rank emoji */}
          <div
            className="text-xl w-9 h-9 flex items-center justify-center rounded-xl transition-transform group-hover:scale-110"
            style={{ background: `rgba(${current.shadow},0.15)` }}
          >
            {current.emoji}
          </div>

          <div className="flex flex-col min-w-[120px]">
            {/* Rank name */}
            <div className="flex items-center justify-between gap-3">
              <span
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: current.color }}
              >
                {current.name}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">{xp.toLocaleString()} XP</span>
            </div>

            {/* XP Progress bar */}
            <div className="mt-1.5 h-1.5 rounded-full bg-white/5 overflow-hidden w-full">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, rgba(${current.shadow},0.6), ${current.color})` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', damping: 30 }}
              />
            </div>

            {next && (
              <span className="text-[9px] text-slate-500 mt-1">
                {(next.minXP - xp).toLocaleString()} XP → {next.name}
              </span>
            )}
          </div>

          {/* XP Popups */}
          <div className="relative">
            <AnimatePresence>
              {popups.map(p => (
                <XPPopup key={p.id} id={p.id} amount={p.amount} onDone={() => removePopup(p.id)} />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Streak Badge */}
        {streak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-orange-400 text-[11px] font-black fire-glow"
            style={{
              background: 'rgba(2,6,23,0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(251,146,60,0.3)',
            }}
          >
            🔥 {streak} ngày liên tiếp
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
