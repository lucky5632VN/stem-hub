import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Trophy, Flame, Zap, Target, BarChart3, ChevronUp,
  ChevronDown, Star, Crown, Users, TrendingUp,
} from 'lucide-react';
import { getRankInfo, RANKS } from './GameHUD';

// =====================
// Helpers
// =====================
function pct(val, total) {
  if (!total) return 0;
  return Math.round((val / total) * 100);
}

// =====================
// Mock leaderboard data (weekly – seeded deterministically)
// =====================
const MOCK_PLAYERS = [
  { id: 'user_0', name: 'Bạn', xp: 0, streak: 0, solved: 0, accuracy: 0, isMe: true },
  { id: 'u1', name: 'Minh Tú',        weeklyXP: 1240, streak: 14, solved: 28, accuracy: 0.91, rankName: 'Diamond' },
  { id: 'u2', name: 'Hà Linh',        weeklyXP: 980,  streak: 9,  solved: 22, accuracy: 0.87, rankName: 'Platinum' },
  { id: 'u3', name: 'Đức Khải',       weeklyXP: 870,  streak: 7,  solved: 19, accuracy: 0.84, rankName: 'Platinum' },
  { id: 'u4', name: 'Phương Anh',     weeklyXP: 750,  streak: 5,  solved: 16, accuracy: 0.80, rankName: 'Gold' },
  { id: 'u5', name: 'Trung Hiếu',     weeklyXP: 680,  streak: 4,  solved: 15, accuracy: 0.79, rankName: 'Gold' },
  { id: 'u6', name: 'Quỳnh Mai',      weeklyXP: 540,  streak: 3,  solved: 12, accuracy: 0.75, rankName: 'Silver' },
  { id: 'u7', name: 'Bảo Long',       weeklyXP: 430,  streak: 2,  solved: 10, accuracy: 0.72, rankName: 'Silver' },
  { id: 'u8', name: 'Thu Hương',      weeklyXP: 320,  streak: 2,  solved: 8,  accuracy: 0.68, rankName: 'Bronze' },
  { id: 'u9', name: 'Viết Dũng',      weeklyXP: 210,  streak: 1,  solved: 5,  accuracy: 0.62, rankName: 'Bronze' },
];

const RANK_TO_INFO = Object.fromEntries(RANKS.map(r => [r.name, r]));

// =====================
// Activity feed mock
// =====================
const MOCK_FEED = [
  { id: 'f1', name: 'Minh Tú',    action: 'đạt hạng Diamond',      time: '2 phút trước',   emoji: '💠' },
  { id: 'f2', name: 'Hà Linh',    action: 'giải bài khó nhất tuần', time: '5 phút trước',   emoji: '🔺' },
  { id: 'f3', name: 'Đức Khải',   action: 'streak 7 ngày 🔥',        time: '12 phút trước',  emoji: '🔥' },
  { id: 'f4', name: 'Phương Anh', action: 'kiếm 200 XP trong 1h',   time: '25 phút trước',  emoji: '⚡' },
  { id: 'f5', name: 'Trung Hiếu', action: 'hoàn thành Daily Challenge', time: '1 giờ trước', emoji: '🏆' },
  { id: 'f6', name: 'Quỳnh Mai',  action: 'đạt accuracy 80%',        time: '2 giờ trước',    emoji: '🎯' },
];

// =====================
// Medals for top 3
// =====================
const MEDALS = ['🥇', '🥈', '🥉'];

// =====================
// Single leaderboard row
// =====================
function LeaderRow({ player, rank, myWeeklyXP }) {
  const isMe = player.isMe;
  const weeklyXP = isMe ? myWeeklyXP : player.weeklyXP;
  const rankInfo = isMe ? getRankInfo(myWeeklyXP).current : RANK_TO_INFO[player.rankName] || RANKS[0];
  const aboveMe = !isMe && weeklyXP > myWeeklyXP;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.04 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isMe ? 'ring-1' : ''}`}
      style={{
        background: isMe ? `rgba(${rankInfo.shadow ?? '34,211,238'},0.08)` : 'rgba(255,255,255,0.02)',
        border: isMe ? `1px solid rgba(${rankInfo.shadow ?? '34,211,238'},0.25)` : '1px solid rgba(255,255,255,0.05)',
        ringColor: isMe ? rankInfo.color : 'transparent',
      }}
    >
      {/* Rank number */}
      <div className="w-7 text-center shrink-0">
        {rank <= 3 ? (
          <span className="text-lg">{MEDALS[rank - 1]}</span>
        ) : (
          <span className="text-[11px] font-black text-slate-500">#{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
        style={{
          background: `rgba(${rankInfo.shadow ?? '34,211,238'},0.15)`,
          color: rankInfo.color,
          border: `1px solid rgba(${rankInfo.shadow ?? '34,211,238'},0.2)`,
        }}
      >
        {(isMe ? 'Bạn' : player.name).slice(0, 1)}
      </div>

      {/* Name + rank */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-black truncate ${isMe ? 'text-cyan-300' : 'text-white'}`}>
          {isMe ? 'Bạn' : player.name}
          {isMe && <span className="ml-1.5 text-[9px] text-cyan-500/60 font-bold">(bạn)</span>}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[9px]">{rankInfo.emoji}</span>
          <span className="text-[9px] font-bold truncate" style={{ color: rankInfo.color }}>{rankInfo.name}</span>
          {!isMe && player.streak > 0 && (
            <span className="text-[9px] text-orange-400">🔥{player.streak}</span>
          )}
        </div>
      </div>

      {/* Weekly XP */}
      <div className="text-right shrink-0">
        <p className="text-sm font-black" style={{ color: isMe ? '#22d3ee' : '#f8fafc' }}>
          {weeklyXP.toLocaleString()}
        </p>
        <p className="text-[9px] text-slate-500 font-bold">XP tuần</p>
      </div>

      {/* Gap indicator */}
      {aboveMe && (
        <div className="text-[9px] text-rose-400/60 font-bold shrink-0 text-right w-14">
          +{(weeklyXP - myWeeklyXP).toLocaleString()} XP
        </div>
      )}
    </motion.div>
  );
}

// =====================
// Profile stats card
// =====================
function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div
      className="flex-1 p-3 rounded-2xl flex flex-col gap-1"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} style={{ color }} />
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-xl font-black" style={{ color }}>{value}</p>
      {sub && <p className="text-[9px] text-slate-600">{sub}</p>}
    </div>
  );
}

// =====================
// Main ProfileDashboard
// =====================
export default function ProfileDashboard({ isOpen, onClose, xp, streak }) {
  const [tab, setTab] = useState('profile'); // profile | leaderboard | feed

  const { current: rank, next } = getRankInfo(xp);
  const solved = Math.floor(xp / 35);
  const accuracy = Math.min(99, 60 + Math.floor(xp / 80));
  const weeklyXP = Math.floor(xp * 0.6); // estimate weekly

  // Sort leaderboard: inject "me"
  const board = useMemo(() => {
    const players = MOCK_PLAYERS.map(p => ({
      ...p,
      weeklyXP: p.isMe ? weeklyXP : p.weeklyXP,
    }));
    return [...players].sort((a, b) => b.weeklyXP - a.weeklyXP);
  }, [weeklyXP]);

  // My position on board
  const myPos = board.findIndex(p => p.isMe) + 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex justify-end"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          {/* Side Panel */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="relative h-full w-full max-w-md overflow-hidden flex flex-col"
            style={{
              background: 'linear-gradient(180deg, rgba(2,6,23,0.99) 0%, rgba(5,10,30,0.99) 100%)',
              borderLeft: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top glow */}
            <div className="h-0.5 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-black text-lg tracking-tight">Hồ sơ của bạn</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Rank hero */}
              <div
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, rgba(${rank.shadow},0.1) 0%, transparent 100%)`,
                  border: `1px solid rgba(${rank.shadow},0.2)`,
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl text-3xl flex items-center justify-center"
                  style={{
                    background: `rgba(${rank.shadow},0.15)`,
                    boxShadow: `0 0 20px rgba(${rank.shadow},0.3)`,
                  }}
                >
                  {rank.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Hạng hiện tại</p>
                  <h3 className="text-2xl font-black" style={{ color: rank.color }}>{rank.name}</h3>
                  <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, rgba(${rank.shadow},0.5), ${rank.color})` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ((xp - rank.minXP) / ((next?.minXP ?? xp + 1) - rank.minXP)) * 100)}%` }}
                      transition={{ type: 'spring', damping: 25, delay: 0.3 }}
                    />
                  </div>
                  {next && (
                    <p className="text-[9px] text-slate-500 mt-1">
                      {(next.minXP - xp).toLocaleString()} XP đến {next.name} {next.emoji}
                    </p>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-4 p-1 rounded-xl bg-white/3">
                {[
                  { id: 'profile',     label: 'Thống kê',   icon: BarChart3 },
                  { id: 'leaderboard', label: 'BXH Tuần',   icon: Trophy },
                  { id: 'feed',        label: 'Hoạt động',  icon: TrendingUp },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all"
                    style={{
                      background: tab === t.id ? 'rgba(34,211,238,0.1)' : 'transparent',
                      border: tab === t.id ? '1px solid rgba(34,211,238,0.2)' : '1px solid transparent',
                      color: tab === t.id ? '#22d3ee' : '#475569',
                    }}
                  >
                    <t.icon size={11} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">
              <AnimatePresence mode="wait">

                {/* PROFILE TAB */}
                {tab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Stat cards */}
                    <div className="flex gap-3">
                      <StatCard label="Tổng XP" value={xp.toLocaleString()} sub="điểm kinh nghiệm" color="#22d3ee" icon={Zap} />
                      <StatCard label="Streak" value={`${streak}🔥`} sub="ngày liên tiếp" color="#fb923c" icon={Flame} />
                    </div>
                    <div className="flex gap-3">
                      <StatCard label="Đã giải" value={solved} sub="bài toán" color="#a78bfa" icon={Target} />
                      <StatCard label="Độ chính xác" value={`${accuracy}%`} sub="tỉ lệ đúng" color="#34d399" icon={Star} />
                    </div>

                    {/* Rank journey */}
                    <div
                      className="p-4 rounded-2xl space-y-3"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hành trình thăng hạng</p>
                      <div className="flex items-center gap-1">
                        {RANKS.map((r, i) => {
                          const unlocked = xp >= r.minXP;
                          const isCurrent = rank.name === r.name;
                          return (
                            <React.Fragment key={r.name}>
                              <div className="flex flex-col items-center gap-1">
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all ${isCurrent ? 'scale-125' : ''}`}
                                  style={{
                                    background: unlocked ? `rgba(${r.shadow},0.2)` : 'rgba(255,255,255,0.03)',
                                    border: isCurrent ? `2px solid ${r.color}` : `1px solid rgba(255,255,255,0.06)`,
                                    opacity: unlocked ? 1 : 0.3,
                                    boxShadow: isCurrent ? `0 0 12px rgba(${r.shadow},0.4)` : 'none',
                                  }}
                                >
                                  {r.emoji}
                                </div>
                                <span className="text-[7px] font-bold" style={{ color: unlocked ? r.color : '#334155' }}>
                                  {r.name.slice(0, 3)}
                                </span>
                              </div>
                              {i < RANKS.length - 1 && (
                                <div
                                  className="flex-1 h-0.5 rounded-full mx-0.5 mb-4"
                                  style={{ background: xp >= RANKS[i + 1].minXP ? `rgba(${r.shadow},0.4)` : 'rgba(255,255,255,0.05)' }}
                                />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>

                    {/* Streak freeze info */}
                    <div
                      className="p-4 rounded-2xl flex items-center gap-3"
                      style={{ background: streak > 0 ? 'rgba(251,146,60,0.05)' : 'rgba(255,255,255,0.02)', border: streak > 0 ? '1px solid rgba(251,146,60,0.15)' : '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <span className="text-2xl">🧊</span>
                      <div>
                        <p className="text-sm font-black text-white">Streak Freeze</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {streak >= 7
                            ? '✅ Bạn có 1 lần bảo vệ streak miễn phí (streak ≥ 7)!'
                            : `Duy trì streak 7 ngày để mở khóa bảo vệ streak (hiện tại: ${streak}/7 ngày)`}
                        </p>
                      </div>
                    </div>

                    {/* Weekly goal */}
                    <div
                      className="p-4 rounded-2xl space-y-2"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mục tiêu tuần</p>
                        <span className="text-[10px] text-cyan-400 font-bold">{weeklyXP}/500 XP</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (weeklyXP / 500) * 100)}%` }}
                          transition={{ type: 'spring', damping: 25, delay: 0.5 }}
                        />
                      </div>
                      <p className="text-[9px] text-slate-600">
                        {weeklyXP >= 500 ? '🎉 Hoàn thành mục tiêu tuần!' : `Còn ${Math.max(0, 500 - weeklyXP)} XP nữa để hoàn thành mục tiêu`}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* LEADERBOARD TAB */}
                {tab === 'leaderboard' && (
                  <motion.div
                    key="leaderboard"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <Trophy size={10} className="text-yellow-400" /> Bảng xếp hạng tuần
                      </p>
                      <span className="text-[9px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full">
                        Vị trí #{myPos}
                      </span>
                    </div>

                    {board.map((player, i) => (
                      <LeaderRow
                        key={player.id}
                        player={player}
                        rank={i + 1}
                        myWeeklyXP={weeklyXP}
                      />
                    ))}

                    {/* Info */}
                    <div className="pt-2 text-center text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                      Reset vào 00:00 thứ Hai · Top 10 nhận XP Boost
                    </div>
                  </motion.div>
                )}

                {/* FEED TAB */}
                {tab === 'feed' && (
                  <motion.div
                    key="feed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2"
                  >
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-3">
                      <TrendingUp size={10} className="text-cyan-400" /> Hoạt động gần đây
                    </p>

                    {MOCK_FEED.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        <span className="text-xl shrink-0">{item.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-white truncate">
                            <span className="text-cyan-400">{item.name}</span> {item.action}
                          </p>
                          <p className="text-[9px] text-slate-600 mt-0.5">{item.time}</p>
                        </div>
                      </motion.div>
                    ))}

                    {/* FOMO prompt */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="mt-4 p-4 rounded-2xl text-center"
                      style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.1)' }}
                    >
                      <p className="text-[11px] text-cyan-400/80 font-bold">
                        🚀 Mọi người đang giải bài. Bạn thì sao?
                      </p>
                    </motion.div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
