// src/components/DailyGeometryChallenge.jsx
// Daily Geometry Challenge — Thử thách không gian hằng ngày
// Nâng cấp từ DailyChallenge với: Rank-gating, Optimal Moves, Construction mode
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  X, Zap, Flame, Trophy, ChevronRight, Sparkles, Check,
  WifiOff, Lock, Target, Clock, Star, Crown, TrendingUp
} from 'lucide-react';
import { RANKS, getRankInfo } from './GameHUD';

// =====================
// Constants
// =====================
const DIFF_COLOR = {
  easy:   { text: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)'  },
  medium: { text: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)'  },
  hard:   { text: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
};

const TYPE_LABEL = {
  construction: { label: '🏗️ Dựng hình', color: '#60a5fa' },
  angle:        { label: '📐 Tính góc',  color: '#a78bfa' },
  distance:     { label: '📏 Khoảng cách', color: '#34d399' },
  section:      { label: '✂️ Mặt cắt',   color: '#fb923c' },
  optimization: { label: '⚡ Tối ưu',    color: '#fbbf24' },
  proof:        { label: '🧠 Chứng minh', color: '#f472b6' },
};

// =====================
// Seeded random (by date)
// =====================
function seedRandom(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function getLocalChallengesForRank(allChallenges, userRankLevel) {
  const today = new Date().toISOString().slice(0, 10);
  const seed  = parseInt(today.replace(/-/g, ''), 10);
  const rand  = seedRandom(seed);

  // Filter by rank access
  const available = allChallenges.filter(c => c.rank_required <= userRankLevel);

  // Pick 3: easy, medium, hard (from available)
  const easy   = available.filter(c => c.difficulty === 'easy');
  const medium = available.filter(c => c.difficulty === 'medium');
  const hard   = available.filter(c => c.difficulty === 'hard');

  const pick = arr => arr.length ? arr[Math.floor(rand() * arr.length)] : null;
  return [pick(easy), pick(medium), pick(hard)].filter(Boolean);
}

function isToday(dateStr) {
  return dateStr === new Date().toISOString().slice(0, 10);
}

// =====================
// Rank Lock Badge
// =====================
function RankLockBadge({ requiredRank }) {
  const rankInfo = RANKS.find(r => r.level === requiredRank) || RANKS[0];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black"
      style={{ background: `rgba(${rankInfo.shadow},0.15)`, color: rankInfo.color, border: `1px solid rgba(${rankInfo.shadow},0.3)` }}
    >
      <Lock size={8} /> {rankInfo.emoji} {rankInfo.name}
    </span>
  );
}

// =====================
// Move Counter
// =====================
function MoveCounter({ moves, optimal, done }) {
  const ratio = optimal ? moves / optimal : 1;
  const stars = ratio <= 1 ? 3 : ratio <= 1.5 ? 2 : 1;
  const color = ratio <= 1 ? '#34d399' : ratio <= 1.5 ? '#fbbf24' : '#f87171';

  return (
    <div className="flex items-center gap-2 text-xs font-bold" style={{ color }}>
      <Target size={12} />
      <span>{moves} thao tác</span>
      {done && (
        <span className="flex">
          {[1,2,3].map(s => (
            <Star key={s} size={12} fill={s <= stars ? color : 'transparent'} color={color} />
          ))}
        </span>
      )}
      {optimal && !done && (
        <span className="text-slate-500 font-normal">/ mục tiêu ≤{optimal}</span>
      )}
    </div>
  );
}

// =====================
// Challenge Card
// =====================
function ChallengeCard({ challenge, done, locked, onSolve, userRankLevel, index }) {
  const dc = DIFF_COLOR[challenge.difficulty] || DIFF_COLOR.medium;
  const typeInfo = TYPE_LABEL[challenge.type] || { label: '🔺 Hình học', color: '#94a3b8' };
  const rankInfo = RANKS.find(r => r.level === challenge.rank_required);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-2xl p-4 flex gap-3 transition-all"
      style={{
        background: done
          ? 'rgba(52,211,153,0.05)'
          : locked ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
        border: done
          ? '1px solid rgba(52,211,153,0.2)'
          : locked ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(255,255,255,0.07)',
        opacity: locked ? 0.6 : 1,
      }}
    >
      {/* Status icon */}
      <div
        className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-black text-sm"
        style={{
          background: done ? 'rgba(52,211,153,0.15)' : locked ? 'rgba(255,255,255,0.03)' : dc.bg,
          border: `1px solid ${done ? 'rgba(52,211,153,0.3)' : locked ? 'rgba(255,255,255,0.06)' : dc.border}`,
          color: done ? '#34d399' : locked ? '#4b5563' : dc.text,
        }}
      >
        {done ? <Check size={16} /> : locked ? <Lock size={14} /> : (index + 1)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-white font-black text-sm truncate">{challenge.title}</span>
          {locked && rankInfo && <RankLockBadge requiredRank={challenge.rank_required} />}
        </div>

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: dc.bg, color: dc.text, border: `1px solid ${dc.border}` }}>
            {challenge.difficulty === 'easy' ? 'Dễ' : challenge.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
          </span>
          <span className="text-[10px] font-bold" style={{ color: typeInfo.color }}>
            {typeInfo.label}
          </span>
          {challenge.optimal_moves && (
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Target size={9} /> Mục tiêu: ≤{challenge.optimal_moves} thao tác
            </span>
          )}
        </div>

        <p className="text-slate-400 text-xs leading-relaxed mb-3 line-clamp-2">
          {challenge.problem}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-amber-400 font-black text-xs">
            <Zap size={12} />
            +{challenge.xp} XP
            {done && <span className="text-emerald-400 ml-1">✓ Đã nhận</span>}
          </div>

          {!locked && (
            <button
              onClick={() => !done && onSolve(challenge)}
              disabled={done}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all"
              style={{
                background: done
                  ? 'rgba(52,211,153,0.1)'
                  : 'linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.3) 100%)',
                border: done
                  ? '1px solid rgba(52,211,153,0.2)'
                  : '1px solid rgba(99,102,241,0.4)',
                color: done ? '#34d399' : '#a5b4fc',
              }}
            >
              {done ? <><Check size={12} /> Hoàn thành</> : <>Bắt đầu <ChevronRight size={12} /></>}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// =====================
// DailyGeometryChallenge Modal
// =====================
export default function DailyGeometryChallenge({ onClose, onSelectChallenge, onXPGain, userXP = 0 }) {
  const [allChallenges, setAllChallenges] = useState([]);
  const [challenges,    setChallenges]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [completedIds,  setCompletedIds]  = useState([]);
  const [streak,        setStreak]        = useState(0);
  const [isOffline,     setIsOffline]     = useState(false);
  const [activeTab,     setActiveTab]     = useState('today'); // today | all

  const { current: rankInfo } = getRankInfo(userXP);
  const userRankLevel = rankInfo.level;

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('daily_geo_progress') || '{}');
    const today  = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // Streak
    let currentStreak = stored.streak || 0;
    if (stored.last_date !== yesterday && stored.last_date !== today) currentStreak = 0;
    setStreak(currentStreak);

    if (isToday(stored.date)) setCompletedIds(stored.completed || []);

    // Fetch from backend, fallback to bundled data
    const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:8000';
    axios.get(`${baseUrl}/api/daily-geometry-challenge`, { timeout: 3000 })
      .then(res => {
        const data = res.data.challenges || [];
        setAllChallenges(data);
        setChallenges(getLocalChallengesForRank(data, userRankLevel));
        setIsOffline(false);
        setLoading(false);
      })
      .catch(() => {
        // Import local challenge bank
        import('../data/geometryChallenges.js')
          .then(m => {
            const data = m.GEOMETRY_CHALLENGES;
            setAllChallenges(data);
            setChallenges(getLocalChallengesForRank(data, userRankLevel));
          })
          .catch(() => setChallenges([]))
          .finally(() => { setIsOffline(true); setLoading(false); });
      });
  }, [userRankLevel]);

  const handleComplete = (challenge) => {
    if (completedIds.includes(challenge.id)) return;
    const today = new Date().toISOString().slice(0, 10);
    const newCompleted = [...completedIds, challenge.id];
    setCompletedIds(newCompleted);

    const stored = JSON.parse(localStorage.getItem('daily_geo_progress') || '{}');
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let newStreak = stored.streak || 0;
    if (stored.last_date === yesterday) newStreak += 1;
    else if (stored.last_date !== today) newStreak = 1;
    setStreak(newStreak);

    localStorage.setItem('daily_geo_progress', JSON.stringify({
      date: today, completed: newCompleted, streak: newStreak, last_date: today,
    }));
    onXPGain?.(challenge.xp);
  };

  const handleSolve = (challenge) => {
    handleComplete(challenge);
    onSelectChallenge?.(challenge.problem);
    onClose();
  };

  const totalXP   = challenges.filter(c => completedIds.includes(c.id)).reduce((s, c) => s + c.xp, 0);
  const allDone   = challenges.length > 0 && challenges.every(c => completedIds.includes(c.id));
  const lockedCount = allChallenges.filter(c => c.rank_required > userRankLevel).length;

  // All challenges grouped by rank for "all" tab
  const byRank = RANKS.map(rank => ({
    rank,
    challenges: allChallenges.filter(c => c.rank_required === rank.level),
    locked: rank.level > userRankLevel,
  })).filter(g => g.challenges.length > 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.85, y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-3xl overflow-hidden flex flex-col"
          style={{
            background: 'linear-gradient(135deg, rgba(2,6,23,0.99) 0%, rgba(15,23,42,0.99) 100%)',
            border: '1px solid rgba(99,102,241,0.2)',
            boxShadow: '0 0 60px rgba(99,102,241,0.1), 0 40px 80px rgba(0,0,0,0.6)',
            maxHeight: '90vh',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Top glow */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

          {/* Header */}
          <div className="p-5 pb-3 shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl">
                  🔺
                </div>
                <div>
                  <h2 className="text-white font-black text-base uppercase tracking-tight">
                    Daily Geometry Challenge
                  </h2>
                  <p className="text-indigo-400/70 text-[10px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                    <Flame size={9} /> Streak: {streak} ngày
                    {isOffline && <span className="flex items-center gap-0.5 text-slate-500 ml-1"><WifiOff size={8} /> offline</span>}
                    <span className="text-slate-600">·</span>
                    <Crown size={9} style={{ color: rankInfo.color }} />
                    <span style={{ color: rankInfo.color }}>{rankInfo.emoji} {rankInfo.name}</span>
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                <X size={15} />
              </button>
            </div>

            {/* XP Today */}
            {totalXP > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <Zap size={13} className="text-emerald-400" />
                <span className="text-emerald-400 font-black text-sm">+{totalXP} XP hôm nay</span>
                {allDone && <span className="ml-auto text-[10px] text-emerald-300/60 font-bold">🎉 Xuất sắc!</span>}
              </motion.div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mt-3">
              {['today', 'all'].map(tab => (
                <button key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-3 py-1.5 rounded-xl text-xs font-black transition-all"
                  style={{
                    background: activeTab === tab ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                    border: activeTab === tab ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.06)',
                    color: activeTab === tab ? '#a5b4fc' : '#64748b',
                  }}
                >
                  {tab === 'today' ? '📅 Hôm nay' : `🗂️ Tất cả ${allChallenges.length > 0 ? `(${allChallenges.length})` : ''}`}
                </button>
              ))}
              {lockedCount > 0 && (
                <span className="ml-auto text-[10px] text-slate-500 flex items-center gap-1 font-bold">
                  <Lock size={9} /> {lockedCount} bài bị khóa
                </span>
              )}
            </div>
          </div>

          {/* Challenge list */}
          <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="py-10 text-center text-slate-500 text-sm">Đang tải thử thách...</div>
            ) : activeTab === 'today' ? (
              challenges.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-sm">
                  Không có thử thách nào cho rank của bạn hôm nay.<br />
                  <span className="text-indigo-400">Tiếp tục leo rank để mở khóa!</span>
                </div>
              ) : challenges.map((c, i) => (
                <ChallengeCard
                  key={c.id}
                  challenge={c}
                  done={completedIds.includes(c.id)}
                  locked={c.rank_required > userRankLevel}
                  onSolve={handleSolve}
                  userRankLevel={userRankLevel}
                  index={i}
                />
              ))
            ) : (
              byRank.map(({ rank, challenges: rankChallenges, locked }) => (
                <div key={rank.level}>
                  <div className="flex items-center gap-2 mb-2 mt-3">
                    <span style={{ color: rank.color }} className="font-black text-sm">{rank.emoji} {rank.name}</span>
                    {locked && <RankLockBadge requiredRank={rank.level} />}
                    <span className="text-slate-600 text-xs">({rankChallenges.length} bài)</span>
                  </div>
                  <div className="space-y-2">
                    {rankChallenges.map((c, i) => (
                      <ChallengeCard
                        key={c.id}
                        challenge={c}
                        done={completedIds.includes(c.id)}
                        locked={locked}
                        onSolve={handleSolve}
                        userRankLevel={userRankLevel}
                        index={i}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Progress bar rank */}
          <div className="px-5 py-3 border-t border-white/5 shrink-0">
            <div className="flex items-center justify-between text-[10px] mb-1.5">
              <span className="font-bold" style={{ color: rankInfo.color }}>{rankInfo.emoji} {rankInfo.name}</span>
              <span className="text-slate-500">
                {userXP} XP
                {getRankInfo(userXP).next && ` / ${getRankInfo(userXP).next.minXP} XP để lên ${getRankInfo(userXP).next.name}`}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, ((userXP - rankInfo.minXP) / ((getRankInfo(userXP).next?.minXP || rankInfo.minXP + 1) - rankInfo.minXP)) * 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${rankInfo.color}, ${rankInfo.color}cc)` }}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
