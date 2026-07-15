'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { playSound } from '@/lib/sound';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { 
  Trophy, Sparkles, Award, Star, Shield, ArrowRight, Swords, 
  Search, Smile, X, Heart, ShieldAlert, Zap, BookOpen, Calendar
} from 'lucide-react';
import { AvatarFrame } from '@/components/atoms/AvatarFrame';
import STEMAvatarSVG from '@/components/atoms/STEMAvatarSVG';
import { getRankInfo } from '@/lib/matchmaker';

// Danh sách Danh hiệu
const TITLE_LABELS = {
  apprentice: 'Tập sự STEM',
  alchemist_expert: 'Bậc thầy Hóa học',
  math_wizard: 'Chiến thần Toán học',
  physics_guru: 'Kỹ sư Cơ học',
  cosmic_explorer: 'Nhà thám hiểm Vũ trụ',
  nuclear_engineer: 'Kỹ sư Phản ứng hạt',
  quantum_master: 'Thạc sĩ Lượng tử',
  stem_legend: 'Huyền thoại STEM',
  multiverse_theorist: 'Nhà lập thuyết Đa vũ trụ',
  dimension_creator: 'Đấng kiến tạo Không gian',
  top_1_universe: 'Đại Đế STEM 👑',
  top_10_legend: 'Huyền thoại Đấu trường',
  top_100_elite: 'Đại Cao Thủ STEM'
};

const getTitleLabel = (titleKey) => {
  return TITLE_LABELS[titleKey] || titleKey || 'Tập sự STEM';
};



export default function LeaderboardPage() {
  const { user } = useAppStore();
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
  }, []);

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

  // 2. Lắng nghe danh sách bảng xếp hạng online qua Firestore
  useEffect(() => {
    const usersCollection = collection(db, 'users');
    const unsubscribeLeaderboard = onSnapshot(usersCollection, (snapshot) => {
      let realPlayers = [];
      snapshot.forEach((docSnap) => {
        const uData = docSnap.data();
        // Loại bỏ tài khoản admin khỏi bảng xếp hạng ELO
        if (uData.role === 'admin' || uData.email?.toLowerCase() === 'admin123@gmail.com' || docSnap.id === 'admin') {
          return;
        }
        realPlayers.push({
          uid: docSnap.id,
          displayName: uData.displayName || uData.name || 'Học viên ẩn danh',
          elo: uData.stats?.elo !== undefined ? uData.stats.elo : 1000,
          level: uData.stats?.level || 1,
          wins: uData.stats?.wins || 0,
          losses: uData.stats?.losses || 0,
          activeTitle: uData.personalization?.activeTitle || 'apprentice',
          avatarFrame: uData.personalization?.avatarFrame || 'default',
          avatarParts: uData.personalization?.avatarParts || null
        });
      });

      // Sắp xếp theo ELO giảm dần
      realPlayers.sort((a, b) => b.elo - a.elo);

      // Cắt lấy 100 người
      const top100 = realPlayers.slice(0, 100);
      setLeaderboard(top100);

      // Xác định thứ hạng của tôi
      if (user) {
        const myIdx = top100.findIndex(p => p.uid === user.uid);
        setMyRank(myIdx !== -1 ? myIdx + 1 : '100+');
      }
    }, (err) => {
      console.error("Lỗi đồng bộ bảng xếp hạng:", err);
    });

    return () => unsubscribeLeaderboard();
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
    <div className="p-6 max-w-7xl mx-auto min-h-screen flex flex-col justify-between select-none font-sans text-zinc-100 bg-[#0c0d16] pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <Trophy className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-wider bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-rose-400">
                BẢNG XẾP HẠNG STEM TOÀN CẦU
              </h1>
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mt-0.5">
                Bảng vàng vinh danh những Viện sĩ xuất sắc nhất vương quốc
              </p>
            </div>
          </div>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Tìm kiếm danh hiệu, tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#161726] border border-white/5 focus:border-amber-500/50 focus:outline-none rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-zinc-500 transition-all font-mono"
          />
        </div>
      </div>

      {/* 3D Podium Section */}
      {searchTerm === '' && podiumList.length > 0 && (
        <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto w-full items-end justify-center mb-16 pt-8 relative min-h-[350px]">
          {/* Ánh sáng nền hoàng kim */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-amber-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />

          {podiumList.map((item) => {
            const isRank1 = item.rank === 1;
            const isRank2 = item.rank === 2;
            const isRank3 = item.rank === 3;
            
            const bụcHeight = isRank1 ? 'h-[160px]' : isRank2 ? 'h-[120px]' : 'h-[90px]';
            const bụcBorder = isRank1 ? 'border-amber-400/40 shadow-[0_-5px_30px_rgba(251,191,36,0.15)] bg-gradient-to-b from-amber-500/20 to-[#141526]' :
                              isRank2 ? 'border-zinc-300/20 shadow-[0_-5px_20px_rgba(212,212,216,0.1)] bg-gradient-to-b from-zinc-500/10 to-[#141526]' :
                              'border-amber-800/20 shadow-[0_-5px_15px_rgba(180,83,9,0.05)] bg-gradient-to-b from-amber-800/10 to-[#141526]';
            
            return (
              <div 
                key={item.data.uid} 
                onClick={() => handleInspectUser(item.data)}
                className="flex flex-col items-center group cursor-pointer relative z-10 transition-all"
              >
                {/* Vương miện cho Hạng 1 */}
                {isRank1 && (
                  <motion.div 
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="absolute -top-[140px] z-20 flex flex-col items-center pointer-events-none"
                  >
                    <Award className="w-12 h-12 text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                  </motion.div>
                )}

                {/* Chibi Avatar Container */}
                <div className={`relative ${isRank1 ? 'w-24 h-24 mb-6 scale-110' : 'w-20 h-20 mb-4'} transition-transform group-hover:scale-105 duration-300`}>
                  <div className={`w-full h-full rounded-full ${
                    isRank1 ? 'shadow-[0_0_30px_rgba(251,191,36,0.4)] border-2 border-amber-400' :
                    isRank2 ? 'shadow-[0_0_20px_rgba(212,212,216,0.2)] border border-zinc-400/50' :
                    'shadow-[0_0_15px_rgba(180,83,9,0.15)] border border-amber-800/50'
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
                  <span className={`text-xs font-black truncate block leading-snug ${isRank1 ? 'text-amber-400 font-extrabold text-sm' : 'text-zinc-200'}`}>
                    {item.data.displayName}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-mono tracking-wider block mt-0.5 uppercase bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                    {getTitleLabel(item.data.activeTitle)}
                  </span>
                  <span className="text-xs font-mono font-black text-rose-400 mt-1 block">
                    {item.data.elo} ELO
                  </span>
                </div>

                {/* Bục Podium thực sự */}
                <div className={`w-full ${bụcHeight} ${bụcBorder} border-t border-x rounded-t-3xl flex flex-col items-center justify-center relative overflow-hidden transition-colors group-hover:border-white/10`}>
                  <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                  
                  {/* Hiệu ứng hạt bụi vàng lấp lánh cho Hạng 1 */}
                  {isRank1 && (
                    <div className="absolute inset-0 overflow-hidden rounded-t-3xl pointer-events-none">
                      <div className="absolute top-2 left-1/4 w-1 h-1 bg-amber-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '0.2s', animationDuration: '3s' }} />
                      <div className="absolute top-6 left-2/3 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping opacity-45" style={{ animationDelay: '0.8s', animationDuration: '4s' }} />
                      <div className="absolute top-12 left-1/5 w-1 h-1 bg-amber-200 rounded-full animate-ping opacity-75" style={{ animationDelay: '1.5s', animationDuration: '2.5s' }} />
                    </div>
                  )}

                  <span className="text-4xl font-extrabold font-mono text-white/5 select-none">{item.rank}</span>
                  <span className="text-[10px] text-zinc-500 font-mono mt-1">
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
        <div className="lg:col-span-8 bg-[#141526]/80 backdrop-blur-3xl border border-white/5 p-6 rounded-3xl shadow-2xl flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
            <span className="text-xs font-bold text-zinc-400 font-mono tracking-widest uppercase">
              Học viên bảng xếp hạng
            </span>
            <span className="text-[10px] text-zinc-500 font-mono uppercase">
              Cập nhật trực tuyến từ máy chủ
            </span>
          </div>

          {/* Danh sách cuộn */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 max-h-[500px] custom-scrollbar">
            {filteredLeaderboard.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-zinc-500 text-xs font-mono">
                <Smile className="w-12 h-12 text-zinc-700 animate-bounce mb-3" />
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
                        ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)] scale-[1.005]' 
                        : 'bg-white/2 border-white/5 hover:border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Thứ hạng */}
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs font-black shrink-0 bg-white/5 text-zinc-400">
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
                        <span className={`text-sm font-bold truncate max-w-[150px] sm:max-w-[220px] leading-tight ${isMe ? 'text-rose-400' : 'text-white'}`}>
                          {player.displayName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase truncate max-w-[110px] bg-pink-500/10 border border-pink-500/20 text-pink-400">
                            ✨ {getTitleLabel(player.activeTitle)}
                          </span>
                          <span className="text-[8px] text-zinc-500 font-mono">Lv.{player.level}</span>
                        </div>
                      </div>
                    </div>

                    {/* Thống kê ELO */}
                    <div className="flex items-center gap-6 text-right shrink-0">
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[10px] text-zinc-400 font-mono">Tỷ lệ thắng: {winRate}%</span>
                        <span className="text-[8px] text-zinc-500 font-mono">{player.wins} Thắng / {player.losses} Thua</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-mono font-black text-rose-400 tracking-wider">
                          {player.elo}
                        </span>
                        <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest">ELO</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tournaments Column */}
        <div className="lg:col-span-4 bg-[#141526]/80 backdrop-blur-3xl border border-white/5 p-6 rounded-3xl shadow-2xl space-y-4 flex flex-col min-h-[400px]">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Calendar className="w-5 h-5 text-pink-500" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
              Sự kiện giải đấu
            </h2>
          </div>

          {loadingTournaments ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Đang tải giải đấu...</span>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="py-20 text-center text-xs font-bold text-zinc-500 font-mono">
              CHƯA CÓ GIẢI ĐẤU NÀO ĐƯỢC TẠO
            </div>
          ) : (
            <div className="space-y-3.5 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
              {tournaments.map((t) => (
                <div 
                  key={t.id}
                  className="p-3.5 bg-[#08090d]/60 border border-[#1f2235] rounded-xl flex flex-col justify-between gap-3 text-xs font-mono relative overflow-hidden"
                >
                  <div className="space-y-1.5">
                    {/* Badge status */}
                    <div className="flex justify-between items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                        t.status === 'active' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                        t.status === 'ended' ? 'bg-zinc-800 text-zinc-500 border-zinc-700' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {t.status === 'active' ? 'Đang diễn ra' : t.status === 'ended' ? 'Đã kết thúc' : 'Sắp diễn ra'}
                      </span>

                      <span className="text-[10px] text-zinc-400 font-bold">
                        {t.subject === 'all' ? '🏆 Liên môn STEM' :
                         t.subject === 'math' ? '📐 Toán học' :
                         t.subject === 'physics' ? '⚡ Vật lý' :
                         t.subject === 'chemistry' ? '🧪 Hóa học' :
                         t.subject === 'biology' ? '🧬 Sinh học' : '🏆 Giải đấu STEM'}
                      </span>
                    </div>

                    {/* Info Title */}
                    <div className="text-white font-bold leading-normal truncate">{t.title}</div>
                  </div>

                  <div className="space-y-1 text-[9px] text-zinc-550 border-t border-[#1f2235]/40 pt-2 font-semibold">
                    <div>Thời gian: {t.startDate} đến {t.endDate}</div>
                    <div>Yêu cầu: ELO {t.minElo}+</div>
                    <div className="text-pink-400 mt-1 font-bold">Phần thưởng: {t.prize}</div>
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
          <div className="fixed inset-0 bg-[#08090f]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1c1e2d] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-left overflow-hidden"
            >
              {/* Ánh sáng neon */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500" />
              
              <button 
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
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

                <h3 className="text-lg font-black text-white">{selectedUser.displayName}</h3>
                <span className="text-xs text-amber-400 font-mono tracking-wider uppercase bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mt-1.5">
                  {getTitleLabel(selectedUser.activeTitle)}
                </span>
                
                <div className="flex items-center gap-6 mt-4 w-full justify-center border-b border-white/5 pb-4">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-zinc-500 uppercase font-mono tracking-widest">ELO</span>
                    <span className="text-lg font-black font-mono text-rose-400 mt-0.5">{selectedUser.elo}</span>
                  </div>
                  <div className="w-[1px] h-6 bg-white/5" />
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-zinc-500 uppercase font-mono tracking-widest">Cấp độ</span>
                    <span className="text-lg font-black font-mono text-white mt-0.5">Lv.{selectedUser.level}</span>
                  </div>
                  <div className="w-[1px] h-6 bg-white/5" />
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-zinc-500 uppercase font-mono tracking-widest">Tỉ lệ thắng</span>
                    <span className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                      {selectedUser.wins + selectedUser.losses > 0 
                        ? Math.round((selectedUser.wins / (selectedUser.wins + selectedUser.losses)) * 100) 
                        : 0}%
                    </span>
                  </div>
                </div>

                {/* Biểu đồ năng lực môn học */}
                <div className="w-full mt-5">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
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
                          <span className="text-zinc-400">{subject.label}</span>
                          <span className="text-zinc-300 font-bold">{subject.val} ELO</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
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
                  className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer select-none text-center"
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
        <div className="fixed bottom-0 inset-x-0 bg-[#161726]/90 backdrop-blur-2xl border-t border-white/5 p-4 z-40 shadow-2xl flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Thứ hạng của tôi */}
              <div className="px-3.5 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-mono font-black text-rose-400">
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
                <span className="text-xs font-bold text-white leading-tight">
                  {personalization.name} (Tôi)
                </span>
                <span className="text-[9px] text-rose-400 font-mono tracking-widest mt-0.5 uppercase">
                  {getTitleLabel(personalization.activeTitle)} • Lv.{personalization.level}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-[10px] text-zinc-400 font-mono">Thành tích: {personalization.wins} Thắng / {personalization.losses} Thua</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-mono font-black text-rose-400 tracking-wider">
                  {personalization.elo}
                </span>
                <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest font-bold">ELO CỦA TÔI</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
