'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { playSound } from '@/lib/sound';
import { db, functions, httpsCallable } from '@/lib/firebase';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { 
  Trophy, Sparkles, Award, Star, Shield, ArrowRight, Swords, 
  Search, Smile, X, Heart, ShieldAlert, Zap, BookOpen, Calendar
} from 'lucide-react';
import { AvatarFrame } from '@/components/atoms/AvatarFrame';
import STEMAvatarSVG from '@/components/atoms/STEMAvatarSVG';
import { getRankInfo } from '@/lib/matchmaker';
import { getTitleLabel } from '@/lib/titles';

// Sci-Fi Cyber Badges cho Top 3 Podium
const CyberCrown = () => (
  <div className="relative flex flex-col items-center justify-center pointer-events-none select-none">
    {/* Ánh sáng neon nền */}
    <div className="absolute -inset-3 bg-gradient-to-r from-amber-400/40 via-yellow-300/70 to-amber-500/40 rounded-full blur-lg animate-pulse" />
    
    {/* Vương miện Sci-Fi 3D SVG */}
    <svg width="68" height="50" viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0_0_15px_rgba(251,191,36,0.95)]">
      <defs>
        <linearGradient id="goldGradient" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="25%" stopColor="#FBBF24" />
          <stop offset="65%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id="gemCyan" x1="0" y1="0" x2="10" y2="10">
          <stop offset="0%" stopColor="#A5F3FC" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
        <linearGradient id="gemPink" x1="0" y1="0" x2="10" y2="10">
          <stop offset="0%" stopColor="#FBCFE8" />
          <stop offset="100%" stopColor="#BE123C" />
        </linearGradient>
        <filter id="crownGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Vòng Quỹ Đạo Lượng Tử */}
      <ellipse cx="32" cy="38" rx="28" ry="6" stroke="url(#goldGradient)" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.85" />

      {/* Thân Vương Miện Lượng Tử */}
      <path
        d="M 6 36 L 10 16 L 22 26 L 32 8 L 42 26 L 54 16 L 58 36 Z"
        fill="url(#goldGradient)"
        stroke="#FEF3C7"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Đế Vương Miện VIP */}
      <rect x="6" y="34" width="52" height="6" rx="2" fill="url(#goldGradient)" stroke="#FDE68A" strokeWidth="1" />
      <circle cx="16" cy="37" r="1.5" fill="#FFF" />
      <circle cx="32" cy="37" r="2.5" fill="#A5F3FC" />
      <circle cx="48" cy="37" r="1.5" fill="#FFF" />

      {/* Đá Quý Đính Đỉnh Vương Miện */}
      <polygon points="10,10 13,16 10,22 7,16" fill="url(#gemPink)" stroke="#FFF" strokeWidth="0.8" filter="url(#crownGlow)" />
      <polygon points="32,1 37,7 32,13 27,7" fill="url(#gemCyan)" stroke="#FFF" strokeWidth="1.2" filter="url(#crownGlow)" />
      <polygon points="54,10 57,16 54,22 51,16" fill="url(#gemPink)" stroke="#FFF" strokeWidth="0.8" filter="url(#crownGlow)" />

      {/* Phản Quang Kim Loại */}
      <path d="M 32 8 L 22 26 L 32 34 L 42 26 Z" fill="#FFFFFF" fillOpacity="0.25" />
    </svg>

    {/* Băng Rôn TOP 1 CHAMPION Neon */}
    <div className="mt-[-8px] bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-400 text-zinc-950 px-3 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase border border-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.9)] flex items-center gap-1 font-mono">
      <Sparkles className="w-2.5 h-2.5 fill-zinc-950 animate-spin" />
      TOP 1 CHAMPION
    </div>
  </div>
);

const CyberSilverWing = () => (
  <div className="relative flex flex-col items-center justify-center pointer-events-none select-none">
    <div className="absolute -inset-2 bg-cyan-400/30 rounded-full blur-md animate-pulse" />
    <svg width="50" height="38" viewBox="0 0 44 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0_0_10px_rgba(212,212,216,0.9)]">
      <defs>
        <linearGradient id="silverGradient" x1="0" y1="0" x2="44" y2="34">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>
      <path d="M 22 18 L 4 6 L 10 22 L 22 28 L 34 22 L 40 6 Z" fill="url(#silverGradient)" stroke="#F8FAFC" strokeWidth="1.2" />
      <polygon points="22,4 27,14 22,24 17,14" fill="#38BDF8" stroke="#FFF" strokeWidth="1" />
    </svg>
    <div className="mt-[-6px] bg-gradient-to-r from-slate-100 via-zinc-200 to-slate-300 text-zinc-950 px-2.5 py-0.5 rounded-full text-[8px] font-black tracking-wider uppercase border border-white shadow-[0_0_10px_rgba(255,255,255,0.6)] font-mono">
      TOP 2 NOBLE
    </div>
  </div>
);

const CyberBronzeShield = () => (
  <div className="relative flex flex-col items-center justify-center pointer-events-none select-none">
    <div className="absolute -inset-2 bg-amber-700/30 rounded-full blur-md animate-pulse" />
    <svg width="46" height="34" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0_0_8px_rgba(180,83,9,0.8)]">
      <defs>
        <linearGradient id="bronzeGradient" x1="0" y1="0" x2="40" y2="30">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>
      <path d="M 20 2 L 36 8 L 30 22 L 20 28 L 10 22 L 4 8 Z" fill="url(#bronzeGradient)" stroke="#FDE68A" strokeWidth="1.2" />
      <circle cx="20" cy="14" r="4.5" fill="#F59E0B" stroke="#FFF" strokeWidth="1" />
    </svg>
    <div className="mt-[-6px] bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 text-amber-100 px-2.5 py-0.5 rounded-full text-[8px] font-black tracking-wider uppercase border border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.5)] font-mono">
      TOP 3 ELITE
    </div>
  </div>
);

export default function LeaderboardPage() {
  const { user, isSidebarOpen } = useAppStore();
  const [personalization, setPersonalization] = useState({
    name: 'Người chơi',
    elo: 1000,
    level: 1,
    avatarFrame: 'default',
    avatarParts: null,
    activeTitle: 'apprentice',
    wins: 0,
    losses: 0
  });

  const [leaderboard, setLeaderboard] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [myRank, setMyRank] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  // 1.5. Đồng bộ danh sách giải đấu từ Firestore
  useEffect(() => {
    if (!user) {
      setTournaments([]);
      setLoadingTournaments(false);
      return;
    }
    setLoadingTournaments(true);
    const tournamentCollection = collection(db, 'tournaments');
    const unsubscribeTournaments = onSnapshot(tournamentCollection, (snapshot) => {
      const tList = [];
      snapshot.forEach((docSnap) => {
        tList.push({ id: docSnap.id, ...docSnap.data() });
      });
      tList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setTournaments(tList);
      setLoadingTournaments(false);
    }, (err) => {
      console.error("Lỗi đồng bộ giải đấu:", err);
      setLoadingTournaments(false);
    });
    return () => unsubscribeTournaments();
  }, [user]);

  // 1. Đồng bộ thông tin cá nhân của người dùng hiện tại
  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeMe = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          const uData = snap.snap ? snap.snap.data() : snap.data();
          setPersonalization({
            name: uData.displayName || uData.name || 'Người chơi',
            elo: uData.stats?.elo !== undefined ? uData.stats.elo : 1000,
            level: uData.stats?.level || 1,
            avatarFrame: uData.personalization?.avatarFrame || 'default',
            avatarParts: uData.personalization?.avatarParts || null,
            activeTitle: uData.personalization?.activeTitle || 'apprentice',
            wins: uData.stats?.wins || 0,
            losses: uData.stats?.losses || 0
          });
        }
      });
      return () => unsubscribeMe();
    }
  }, [user]);

  // 2. Lấy danh sách bảng xếp hạng online qua Cloud Function
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const getLeaderboardFn = httpsCallable(functions, 'getLeaderboard');
        const res = await getLeaderboardFn();
        if (res.data?.leaderboard) {
          const top100 = res.data.leaderboard;
          setLeaderboard(top100);
          
          if (user) {
            const myIdx = top100.findIndex(p => p.uid === user.uid);
            setMyRank(myIdx !== -1 ? myIdx + 1 : '100+');
          }
        }
      } catch (err) {
        console.error("Lỗi đồng bộ bảng xếp hạng qua Cloud Function:", err);
      }
    };

    fetchLeaderboard();
    const intervalId = setInterval(fetchLeaderboard, 60000);
    return () => clearInterval(intervalId);
  }, [user]);

  // 3. Xem chi tiết thông tin người chơi (Inspector)
  const handleInspectUser = async (player) => {
    playSound.click();
    setLoadingProfile(true);
    try {
      // Lấy dữ liệu trực tiếp từ Firestore
      const uRef = doc(db, 'users', player.uid);
      const snap = await getDoc(uRef);
      if (snap.exists()) {
        const data = snap.data();
        setSelectedUser({
          uid: player.uid,
          displayName: data.displayName || 'Học viên ẩn danh',
          elo: data.stats?.elo || 1000,
          level: data.stats?.level || 1,
          wins: data.stats?.wins || 0,
          losses: data.stats?.losses || 0,
          activeTitle: data.personalization?.activeTitle || 'apprentice',
          avatarFrame: data.personalization?.avatarFrame || 'default',
          avatarParts: data.personalization?.avatarParts || null,
          subjectStrengths: data.stats?.subjectStrengths || { math: 100, physics: 100, chemistry: 100, biology: 100 }
        });
      } else {
        setSelectedUser(player);
      }
    } catch (err) {
      console.warn("Lỗi tải thông tin chi tiết:", err);
      setSelectedUser(player);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Lọc tìm kiếm
  const filteredLeaderboard = leaderboard.filter(p => 
    p.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const top3 = leaderboard.slice(0, 3);
  const others = filteredLeaderboard.slice(3);

  // Sắp xếp Top 3 theo thứ tự hiển thị bục Podium: [2, 1, 3]
  const podiumList = [];
  if (top3[1]) podiumList.push({ rank: 2, data: top3[1] });
  if (top3[0]) podiumList.push({ rank: 1, data: top3[0] });
  if (top3[2]) podiumList.push({ rank: 3, data: top3[2] });

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen flex flex-col justify-between select-none font-sans text-text-primary bg-bg-primary pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border-theme pb-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <Trophy className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-wider text-amber-400">
                BẢNG XẾP HẠNG STEM TOÀN CẦU
              </h1>
              <p className="text-text-secondary text-xs font-mono uppercase tracking-widest mt-0.5">
                Bảng vàng vinh danh những Viện sĩ xuất sắc nhất vương quốc
              </p>
            </div>
          </div>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Tìm kiếm danh hiệu, tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-secondary border border-border-theme focus:border-amber-500/50 focus:outline-none rounded-2xl pl-11 pr-4 py-3 text-xs text-text-primary placeholder:text-text-secondary transition-all font-mono"
          />
        </div>
      </div>

      {/* 3D Podium Section */}
      {searchTerm === '' && podiumList.length > 0 && (
        <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto w-full items-end justify-center mb-16 pt-12 relative min-h-[350px]">
          {/* Ánh sáng nền hoàng kim */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-amber-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />

          {podiumList.map((item) => {
            const isRank1 = item.rank === 1;
            const isRank2 = item.rank === 2;
            const isRank3 = item.rank === 3;
            
            const bụcHeight = isRank1 ? 'h-[160px]' : isRank2 ? 'h-[120px]' : 'h-[90px]';
            const bụcBorder = isRank1 ? 'border-amber-400/40 shadow-[0_-5px_30px_rgba(251,191,36,0.15)] bg-gradient-to-b from-amber-500/20 to-bg-secondary' :
                              isRank2 ? 'border-zinc-300/20 shadow-[0_-5px_20px_rgba(212,212,216,0.1)] bg-gradient-to-b from-zinc-500/10 to-bg-secondary' :
                              'border-amber-800/20 shadow-[0_-5px_15px_rgba(180,83,9,0.05)] bg-gradient-to-b from-amber-800/10 to-bg-secondary';
            
            return (
              <div 
                key={item.data.uid} 
                onClick={() => handleInspectUser(item.data)}
                className="flex flex-col items-center group cursor-pointer relative z-10 transition-all"
              >
                {/* Chibi Avatar Container */}
                <div className={`relative ${isRank1 ? 'w-24 h-24 mb-6 scale-110' : 'w-20 h-20 mb-4'} transition-transform group-hover:scale-105 duration-300`}>
                  {/* Huy hiệu Sci-Fi Top 1, 2, 3 */}
                  {isRank1 && (
                    <motion.div 
                      initial={{ y: -5, opacity: 0 }}
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                      className="absolute -top-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none"
                    >
                      <CyberCrown />
                    </motion.div>
                  )}
                  {isRank2 && (
                    <motion.div 
                      initial={{ y: -4, opacity: 0 }}
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                      className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none"
                    >
                      <CyberSilverWing />
                    </motion.div>
                  )}
                  {isRank3 && (
                    <motion.div 
                      initial={{ y: -4, opacity: 0 }}
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                      className="absolute -top-11 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none"
                    >
                      <CyberBronzeShield />
                    </motion.div>
                  )}
                  <div className={`w-full h-full rounded-full ${
                    isRank1 ? 'shadow-[0_0_35px_rgba(251,191,36,0.6)] border-2 border-amber-400 ring-4 ring-amber-400/20' :
                    isRank2 ? 'shadow-[0_0_25px_rgba(56,189,248,0.4)] border-2 border-cyan-300/80 ring-2 ring-cyan-400/20' :
                    'shadow-[0_0_20px_rgba(217,119,6,0.3)] border-2 border-amber-600/80'
                  }`}>
                    <AvatarFrame frame={item.data.avatarFrame} className="w-full h-full text-base">
                      {item.data.avatarParts ? (
                        <STEMAvatarSVG 
                          parts={{ 
                            ...item.data.avatarParts, 
                            pose: item.rank === 1 ? 'super' : item.rank === 2 ? 'wave' : 'thinker' 
                          }} 
                          className="w-full h-full transform scale-95" 
                        />
                      ) : (
                        <span className="select-none font-bold text-lg uppercase">{item.data.displayName.charAt(0)}</span>
                      )}
                    </AvatarFrame>
                  </div>
                  {/* Badge thứ hạng */}
                  <div className={`absolute -bottom-2 -right-1 w-6 h-6 rounded-full flex items-center justify-center font-black text-xs border shadow-lg z-30 ${
                    isRank1 ? 'bg-amber-400 text-zinc-950 border-amber-300 animate-bounce' :
                    isRank2 ? 'bg-zinc-300 text-zinc-950 border-zinc-200' :
                    'bg-amber-700 text-white border-amber-600'
                  }`}>
                    {item.rank}
                  </div>
                </div>

                {/* Tên & ELO */}
                <div className="text-center mb-4 max-w-[120px]">
                  <span className={`text-xs font-black truncate block leading-snug ${isRank1 ? 'text-amber-400 font-extrabold text-sm' : 'text-text-primary'}`}>
                    {item.data.displayName}
                  </span>
                  <span className="text-[9px] text-text-secondary font-mono tracking-wider block mt-0.5 uppercase bg-white/5 border border-border-theme px-2 py-0.5 rounded-full">
                    {getTitleLabel(item.data.activeTitle)}
                  </span>
                  <span className="text-xs font-mono font-black text-accent-pink mt-1 block">
                    {item.data.elo} ELO
                  </span>
                </div>

                {/* Bục Podium thực sự */}
                <div className={`w-full ${bụcHeight} ${bụcBorder} border-t border-x rounded-t-3xl flex flex-col items-center justify-center relative overflow-hidden transition-colors group-hover:border-border-theme`}>
                  <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                  
                  {/* Hiệu ứng hạt bụi vàng lấp lánh cho Hạng 1 */}
                  {isRank1 && (
                    <div className="absolute inset-0 overflow-hidden rounded-t-3xl pointer-events-none">
                      <div className="absolute top-2 left-1/4 w-1 h-1 bg-amber-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '0.2s', animationDuration: '3s' }} />
                      <div className="absolute top-6 left-2/3 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping opacity-45" style={{ animationDelay: '0.8s', animationDuration: '4s' }} />
                      <div className="absolute top-12 left-1/5 w-1 h-1 bg-amber-200 rounded-full animate-ping opacity-75" style={{ animationDelay: '1.5s', animationDuration: '2.5s' }} />
                    </div>
                  )}

                  <span className="text-4xl font-extrabold font-mono text-text-secondary/15 select-none">{item.rank}</span>
                  <span className="text-[10px] text-text-secondary font-mono mt-1">
                    {item.data.wins} Thắng / {item.data.losses} Thua
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2-Column Layout: Leaderboard & Tournaments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full mb-16">
        {/* Main Leaderboard List */}
        <div className="lg:col-span-8 bg-bg-secondary/80 backdrop-blur-3xl border border-border-theme p-6 rounded-3xl shadow-2xl flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between border-b border-border-theme pb-4 mb-4 select-none">
            <span className="text-xs font-bold text-text-secondary font-mono tracking-widest uppercase">
              Học viên bảng xếp hạng
            </span>
            <span className="text-[10px] text-text-secondary font-mono uppercase">
              Cập nhật trực tuyến từ máy chủ
            </span>
          </div>

          {/* Danh sách cuộn */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 max-h-[500px] custom-scrollbar">
            {filteredLeaderboard.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-text-secondary text-xs font-mono">
                <Smile className="w-12 h-12 text-text-secondary/50 animate-bounce mb-3" />
                KHÔNG TÌM THẤY HỌC VIÊN NÀO PHÙ HỢP!
              </div>
            ) : (
              (searchTerm === '' ? others : filteredLeaderboard).map((player, index) => {
                const displayRank = searchTerm === '' ? index + 4 : index + 1;
                const isMe = player.uid === user?.uid;
                const rank = getRankInfo(player.elo);
                const winRate = player.wins + player.losses > 0 
                  ? Math.round((player.wins / (player.wins + player.losses)) * 100) 
                  : 0;

                return (
                  <div
                    key={player.uid}
                    onClick={() => handleInspectUser(player)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      isMe 
                        ? 'bg-accent-pink/10 border-accent-pink/30 shadow-[0_0_15px_rgba(240,57,140,0.15)] scale-[1.005]' 
                        : 'bg-white/2 border-border-theme hover:border-border-theme/80 hover:bg-bg-tertiary/40'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Thứ hạng */}
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs font-black shrink-0 bg-bg-tertiary text-text-secondary">
                        {displayRank}
                      </div>

                      {/* Avatar Chibi và Khung Viền VIP */}
                      <AvatarFrame frame={player.avatarFrame} className="w-11 h-11 text-base shrink-0">
                        {player.avatarParts ? (
                          <STEMAvatarSVG parts={player.avatarParts} className="w-full h-full transform scale-90" />
                        ) : (
                          <span className="select-none font-bold uppercase">{player.displayName.charAt(0)}</span>
                        )}
                      </AvatarFrame>

                      {/* Tên hiển thị & Danh hiệu */}
                      <div className="flex flex-col min-w-0">
                        <span className={`text-sm font-bold truncate max-w-[150px] sm:max-w-[220px] leading-tight ${isMe ? 'text-accent-pink' : 'text-text-primary'}`}>
                          {player.displayName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase truncate max-w-[110px] bg-accent-pink/10 border border-accent-pink/20 text-accent-pink">
                            ✨ {getTitleLabel(player.activeTitle)}
                          </span>
                          <span className="text-[8px] text-text-secondary font-mono">Lv.{player.level}</span>
                        </div>
                      </div>
                    </div>

                    {/* Thống kê ELO */}
                    <div className="flex items-center gap-6 text-right shrink-0">
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[10px] text-text-secondary font-mono">Tỷ lệ thắng: {winRate}%</span>
                        <span className="text-[8px] text-text-secondary font-mono">{player.wins} Thắng / {player.losses} Thua</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-mono font-black text-accent-pink tracking-wider">
                          {player.elo}
                        </span>
                        <span className="text-[8px] text-text-secondary font-mono uppercase tracking-widest">ELO</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tournaments Column */}
        <div className="lg:col-span-4 bg-bg-secondary/80 backdrop-blur-3xl border border-border-theme p-6 rounded-3xl shadow-2xl space-y-4 flex flex-col min-h-[400px]">
          <div className="flex items-center gap-2 border-b border-border-theme pb-3">
            <Calendar className="w-5 h-5 text-accent-pink" />
            <h2 className="text-sm font-black text-text-primary uppercase tracking-wider font-mono">
              Sự kiện giải đấu
            </h2>
          </div>

          {loadingTournaments ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-accent-pink border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-mono text-text-secondary uppercase">Đang tải giải đấu...</span>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="py-20 text-center text-xs font-bold text-text-secondary font-mono">
              CHƯA CÓ GIẢI ĐẤU NÀO ĐƯỢC TẠO
            </div>
          ) : (
            <div className="space-y-3.5 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
              {tournaments.map((t) => (
                <div 
                  key={t.id}
                  className="p-3.5 bg-bg-tertiary/60 border border-border-theme rounded-xl flex flex-col justify-between gap-3 text-xs font-mono relative overflow-hidden"
                >
                  <div className="space-y-1.5">
                    {/* Badge status */}
                    <div className="flex justify-between items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                        t.status === 'active' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                        t.status === 'ended' ? 'bg-bg-tertiary text-text-secondary border-border-theme' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {t.status === 'active' ? 'Đang diễn ra' : t.status === 'ended' ? 'Đã kết thúc' : 'Sắp diễn ra'}
                      </span>

                      <span className="text-[10px] text-text-secondary font-bold">
                        {t.subject === 'all' ? '🏆 Liên môn STEM' :
                         t.subject === 'math' ? '📐 Toán học' :
                         t.subject === 'physics' ? '⚡ Vật lý' :
                         t.subject === 'chemistry' ? '🧪 Hóa học' :
                         t.subject === 'biology' ? '🧬 Sinh học' : '🏆 Giải đấu STEM'}
                      </span>
                    </div>

                    {/* Info Title */}
                    <div className="text-text-primary font-bold leading-normal truncate">{t.title}</div>
                  </div>

                  <div className="space-y-1 text-[9px] text-text-secondary border-t border-border-theme/40 pt-2 font-semibold">
                    <div>Thời gian: {t.startDate} đến {t.endDate}</div>
                    <div>Yêu cầu: ELO {t.minElo}+</div>
                    <div className="text-accent-pink mt-1 font-bold">Phần thưởng: {t.prize}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Inspector Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 bg-bg-primary/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-secondary border border-border-theme rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-left overflow-hidden"
            >
              {/* Ánh sáng neon */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-accent-pink to-accent-purple" />
              
              <button 
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-text-secondary hover:text-text-primary transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center mt-4">
                {/* Avatar Chibi lớn trong Inspector */}
                <div className="w-24 h-24 relative mb-4">
                  <AvatarFrame frame={selectedUser.avatarFrame} className="w-full h-full text-base">
                    {selectedUser.avatarParts ? (
                      <STEMAvatarSVG parts={selectedUser.avatarParts} className="w-full h-full transform scale-95" />
                    ) : (
                      <span className="select-none font-bold text-xl uppercase">{selectedUser.displayName.charAt(0)}</span>
                    )}
                  </AvatarFrame>
                </div>

                <h3 className="text-lg font-black text-text-primary">{selectedUser.displayName}</h3>
                <span className="text-xs text-amber-400 font-mono tracking-wider uppercase bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mt-1.5">
                  {getTitleLabel(selectedUser.activeTitle)}
                </span>
                
                <div className="flex items-center gap-6 mt-4 w-full justify-center border-b border-border-theme pb-4">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-text-secondary uppercase font-mono tracking-widest">ELO</span>
                    <span className="text-lg font-black font-mono text-accent-pink mt-0.5">{selectedUser.elo}</span>
                  </div>
                  <div className="w-[1px] h-6 bg-border-theme" />
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-text-secondary uppercase font-mono tracking-widest">Cấp độ</span>
                    <span className="text-lg font-black font-mono text-text-primary mt-0.5">Lv.{selectedUser.level}</span>
                  </div>
                  <div className="w-[1px] h-6 bg-border-theme" />
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-text-secondary uppercase font-mono tracking-widest">Tỉ lệ thắng</span>
                    <span className="text-lg font-black font-mono text-success mt-0.5">
                      {selectedUser.wins + selectedUser.losses > 0 
                        ? Math.round((selectedUser.wins / (selectedUser.wins + selectedUser.losses)) * 100) 
                        : 0}%
                    </span>
                  </div>
                </div>

                {/* Biểu đồ năng lực môn học */}
                <div className="w-full mt-5">
                  <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Chỉ số kỹ năng
                  </h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Toán Học', val: selectedUser.subjectStrengths?.math || 100, color: 'bg-amber-500 shadow-amber-500/20' },
                      { label: 'Vật Lý', val: selectedUser.subjectStrengths?.physics || 100, color: 'bg-emerald-500 shadow-emerald-500/20' },
                      { label: 'Hóa Học', val: selectedUser.subjectStrengths?.chemistry || 100, color: 'bg-pink-500 shadow-pink-500/20' },
                      { label: 'Sinh Học', val: selectedUser.subjectStrengths?.biology || 100, color: 'bg-cyan-500 shadow-cyan-500/20' }
                    ].map((subject, idx) => (
                      <div key={idx} className="flex flex-col gap-1 text-left">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-text-secondary">{subject.label}</span>
                          <span className="text-text-primary font-bold">{subject.val} ELO</span>
                        </div>
                        <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${subject.color} rounded-full shadow-[0_0_8px]`}
                            style={{ width: `${Math.min(100, (subject.val / 2500) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nút đóng */}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 text-text-primary font-bold text-xs rounded-2xl transition-all cursor-pointer select-none text-center"
                >
                  ĐÓNG HỒ SƠ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sticky Current User Ranking Banner */}
      {user && (
        <div className={`fixed bottom-0 right-0 bg-bg-secondary/90 backdrop-blur-2xl border-t border-border-theme p-4 z-30 shadow-2xl flex items-center justify-between transition-all duration-300 ${
          isSidebarOpen ? 'left-0 lg:left-[260px]' : 'left-0'
        }`}>
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Thứ hạng của tôi */}
              <div className="px-3.5 py-1.5 bg-accent-pink/10 border border-accent-pink/20 rounded-xl text-xs font-mono font-black text-accent-pink">
                HẠNG: {myRank || '...'}
              </div>

              {/* Avatar Chibi của tôi */}
              <AvatarFrame frame={personalization.avatarFrame} className="w-9 h-9 text-xs">
                {personalization.avatarParts ? (
                  <STEMAvatarSVG parts={personalization.avatarParts} className="w-full h-full transform scale-90" />
                ) : (
                  <span className="select-none font-bold uppercase">{personalization.name.charAt(0)}</span>
                )}
              </AvatarFrame>

              {/* Tên & ELO */}
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-text-primary leading-tight">
                  {personalization.name} (Tôi)
                </span>
                <span className="text-[9px] text-accent-pink font-mono tracking-widest mt-0.5 uppercase">
                  {getTitleLabel(personalization.activeTitle)} • Lv.{personalization.level}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-[10px] text-text-secondary font-mono">Thành tích: {personalization.wins} Thắng / {personalization.losses} Thua</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-mono font-black text-accent-pink tracking-wider">
                  {personalization.elo}
                </span>
                <span className="text-[8px] text-text-secondary font-mono uppercase tracking-widest font-bold">ELO CỦA TÔI</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
