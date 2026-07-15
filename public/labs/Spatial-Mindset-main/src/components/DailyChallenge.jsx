import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../api/client';
import { X, Zap, Flame, Trophy, ChevronRight, Sparkles, Check, WifiOff } from 'lucide-react';

const DIFF_LABEL = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' };
const DIFF_COLOR = {
  easy:   { text: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)'  },
  medium: { text: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)'  },
  hard:   { text: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
};

// =====================
// Local fallback challenge bank (subset, seeded by day)
// =====================
const LOCAL_BANK = [
  { id: 1,  difficulty: 'easy',   xp: 50,  title: 'Hình lập phương cơ bản',         problem: 'Cho hình lập phương ABCD.A\'B\'C\'D\' cạnh a = 2. Tính góc giữa đường chéo AC\' và mặt đáy ABCD.' },
  { id: 2,  difficulty: 'easy',   xp: 55,  title: 'Hình chóp đều S.ABCD',           problem: 'Hình chóp đều S.ABCD có cạnh đáy a = 4, chiều cao h = 3. Tính thể tích.' },
  { id: 6,  difficulty: 'medium', xp: 100, title: 'Góc nhị diện phức tạp',          problem: 'Hình lập phương ABCD.A\'B\'C\'D\' cạnh 1. Tính góc nhị diện giữa mặt phẳng A\'BD và mặt đáy ABCD.' },
  { id: 7,  difficulty: 'medium', xp: 100, title: 'Khoảng cách điểm đến mặt phẳng', problem: 'Hình chóp đều S.ABCD cạnh đáy 4, chiều cao 3. Tính khoảng cách từ B đến mặt phẳng (SAC).' },
  { id: 12, difficulty: 'hard',   xp: 180, title: 'Tứ diện đều',                    problem: 'Tứ diện đều ABCD cạnh a. Tính khoảng cách giữa hai cạnh chéo nhau AB và CD.' },
  { id: 14, difficulty: 'hard',   xp: 200, title: 'Cầu nội tiếp hình chóp',         problem: 'Hình chóp đều S.ABCD cạnh đáy a=2, cạnh bên l=3. Tìm bán kính cầu nội tiếp.' },
  { id: 16, difficulty: 'easy',   xp: 55,  title: 'Hình hộp chữ nhật',              problem: 'Hình hộp chữ nhật ABCD.A\'B\'C\'D\' có AB=3, BC=4, AA\'=5. Tính đường chéo không gian.' },
  { id: 18, difficulty: 'medium', xp: 110, title: 'Mặt phẳng qua 3 điểm',           problem: 'Cho A(1,0,0), B(0,2,0), C(0,0,3). Viết phương trình mặt phẳng (ABC) và tính khoảng cách từ O đến (ABC).' },
];

function seedRandom(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function getLocalChallenges() {
  const today = new Date().toISOString().slice(0, 10);
  const seed = parseInt(today.replace(/-/g, ''), 10);
  const rand = seedRandom(seed);
  const easy   = LOCAL_BANK.filter(c => c.difficulty === 'easy');
  const medium = LOCAL_BANK.filter(c => c.difficulty === 'medium');
  const hard   = LOCAL_BANK.filter(c => c.difficulty === 'hard');
  const pick = arr => arr[Math.floor(rand() * arr.length)];
  return [pick(easy), pick(medium), pick(hard)].filter(Boolean);
}

// =====================
// Helper: is today
// =====================
function isToday(dateStr) {
  return dateStr === new Date().toISOString().slice(0, 10);
}

// =====================
// DailyChallenge Modal
// =====================
export default function DailyChallenge({ onClose, onSelectChallenge, onXPGain }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState([]);
  const [streak, setStreak] = useState(0);
  const [isOffline, setIsOffline] = useState(false);

  // Load từ localStorage + fetch API
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('daily_progress') || '{}');
    const today = new Date().toISOString().slice(0, 10);

    // Streak logic
    const lastDate = stored.last_date || '';
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let currentStreak = stored.streak || 0;
    if (lastDate === yesterday || lastDate === today) {
      // streak still valid
    } else {
      currentStreak = 0;
    }
    setStreak(currentStreak);

    if (isToday(stored.date)) {
      setCompletedIds(stored.completed || []);
    }

    // Fetch challenges – fallback to local bank if backend offline
    apiClient.get('/api/daily-challenge', { timeout: 3000 })
      .then(res => {
        setChallenges(res.challenges || []);
        setIsOffline(false);
        setLoading(false);
      })
      .catch(() => {
        setChallenges(getLocalChallenges());
        setIsOffline(true);
        setLoading(false);
      });
  }, []);


  const handleComplete = (challenge) => {
    if (completedIds.includes(challenge.id)) return;

    const today = new Date().toISOString().slice(0, 10);
    const newCompleted = [...completedIds, challenge.id];
    setCompletedIds(newCompleted);

    // Update streak
    const stored = JSON.parse(localStorage.getItem('daily_progress') || '{}');
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let newStreak = stored.streak || 0;
    if (stored.last_date === yesterday) {
      newStreak += 1;
    } else if (stored.last_date !== today) {
      newStreak = 1;
    }
    setStreak(newStreak);

    localStorage.setItem('daily_progress', JSON.stringify({
      date: today,
      completed: newCompleted,
      streak: newStreak,
      last_date: today,
    }));

    onXPGain && onXPGain(challenge.xp);
  };

  const handleSolve = (challenge) => {
    handleComplete(challenge);
    onSelectChallenge && onSelectChallenge(challenge.problem);
    onClose();
  };

  const totalXP = challenges
    .filter(c => completedIds.includes(c.id))
    .reduce((sum, c) => sum + c.xp, 0);
  const allDone = challenges.length > 0 && challenges.every(c => completedIds.includes(c.id));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-6"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.85, y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(2,6,23,0.98) 0%, rgba(15,23,42,0.98) 100%)',
            border: '1px solid rgba(251,146,60,0.2)',
            boxShadow: '0 0 60px rgba(251,146,60,0.1), 0 40px 80px rgba(0,0,0,0.5)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Top glow line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent" />

          {/* Header */}
          <div className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <Flame size={20} className="text-orange-400" />
                </div>
                <div>
                  <h2 className="text-white font-black text-lg uppercase tracking-tight">Daily Challenge</h2>
                  <p className="text-orange-400/70 text-[10px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                    <Flame size={10} />
                    Streak: {streak} ngày liên tiếp
                    {isOffline && (
                      <span className="flex items-center gap-0.5 text-slate-500 ml-1">
                        <WifiOff size={9} /> offline
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* XP earned today */}
            {totalXP > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20"
              >
                <Zap size={14} className="text-emerald-400" />
                <span className="text-emerald-400 font-black text-sm">+{totalXP} XP đã kiếm hôm nay</span>
                {allDone && <span className="ml-auto text-[10px] text-emerald-300/60 font-bold">Hoàn thành! 🎉</span>}
              </motion.div>
            )}
          </div>

          {/* Challenge list */}
          <div className="px-6 pb-6 space-y-3">
            {loading ? (
              <div className="py-8 text-center text-slate-500 text-sm">Đang tải thử thách...</div>
            ) : challenges.map((c, i) => {
              const done = completedIds.includes(c.id);
              const dc = DIFF_COLOR[c.difficulty] || DIFF_COLOR.medium;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-2xl p-4 flex gap-3 transition-all"
                  style={{
                    background: done ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.03)',
                    border: done ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Status icon */}
                  <div
                    className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5"
                    style={{
                      background: done ? 'rgba(52,211,153,0.1)' : dc.bg,
                      border: `1px solid ${done ? 'rgba(52,211,153,0.3)' : dc.border}`,
                    }}
                  >
                    {done
                      ? <Check size={16} className="text-emerald-400" />
                      : <Trophy size={14} style={{ color: dc.text }} />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ background: dc.bg, color: dc.text, border: `1px solid ${dc.border}` }}
                      >
                        {DIFF_LABEL[c.difficulty]}
                      </span>
                      <span className="text-[9px] text-yellow-400 font-bold">+{c.xp} XP</span>
                    </div>
                    <h3 className="text-white font-bold text-sm leading-tight">{c.title}</h3>
                    <p className="text-slate-400 text-[11px] mt-1 leading-relaxed line-clamp-2">{c.problem}</p>
                  </div>

                  {/* Action button */}
                  {!done ? (
                    <button
                      onClick={() => handleSolve(c)}
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all"
                      style={{
                        background: dc.bg,
                        color: dc.text,
                        border: `1px solid ${dc.border}`,
                      }}
                    >
                      Giải <ChevronRight size={12} />
                    </button>
                  ) : (
                    <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black text-emerald-400">
                      Done ✓
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Footer hint */}
          <div className="px-6 pb-5 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            <Sparkles size={10} className="inline mr-1" />
            Thử thách mới lúc 00:00 mỗi ngày
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
