'use client';

import { Search, Moon, Sun, Beaker, Rocket, BookOpen, User, Swords, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AuthModal from '@/components/organisms/AuthModal';
import SettingsDropdown from '@/components/organisms/SettingsDropdown';
import { useAppStore } from '@/store/useAppStore';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, updateDoc, deleteDoc, setDoc, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { playSound } from '@/lib/sound';
import { AvatarFrame } from '@/components/atoms/AvatarFrame';
import STEMAvatarSVG from '@/components/atoms/STEMAvatarSVG';
import { 
  generateBioPool, 
  generateMathPool, 
  generatePhysicsPool, 
  generateChemistryPool 
} from '@/lib/arenaGenerator';

const getSessionHistory = (key) => {
  if (typeof window === 'undefined') return [];
  try {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authView, setAuthView] = useState('login');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [incomingChallenge, setIncomingChallenge] = useState(null);
  const [decliningChallenge, setDecliningChallenge] = useState(false);
  const [acceptedOutgoing, setAcceptedOutgoing] = useState(null); // invite accepted by the other side
  const router = useRouter();
  const pathname = usePathname();

  const user = useAppStore((state) => state.user);
  const personalization = useAppStore((state) => state.personalization);

  const getFrameStyle = (frame) => {
    switch (frame) {
      case 'neon_fire':
        return 'border border-rose-500 shadow-[0_0_8px_#f43f5e]';
      case 'cyan_tech':
        return 'border border-cyan-400 shadow-[0_0_8px_#22d3ee]';
      case 'cosmic_nebula':
        return 'border border-purple-500 shadow-[0_0_8px_#a855f7]';
      case 'blackhole_gravity':
        return 'border border-indigo-700 shadow-[0_0_8px_#4338ca]';
      case 'antimatter_era':
        return 'border border-fuchsia-500 shadow-[0_0_8px_#d946ef]';
      case 'multiverse_overlord':
        return 'border border-cyan-400 shadow-[0_0_10px_#22d3ee,0_0_4px_#ec4899] animate-pulse';
      case 'top_1_sovereign':
        return 'border-2 border-amber-400 shadow-[0_0_12px_#fbbf24,0_0_4px_#ffffff] animate-pulse';
      case 'gold_vip':
        return 'border border-amber-400 shadow-[0_0_8px_#fbbf24] animate-pulse';
      case 'top_100_silver':
        return 'border border-slate-300 shadow-[0_0_8px_#cbd5e1]';
      default:
        return 'border border-pink-500/40';
    }
  };

  const getTitleLabel = (title) => {
    const titles = {
      apprentice: 'Tập sự',
      alchemist_expert: 'Bậc thầy Hóa',
      math_wizard: 'Chiến thần Toán',
      physics_guru: 'Kỹ sư Cơ học',
      cosmic_explorer: 'T.Hiểm V.Trụ',
      nuclear_engineer: 'K.Sư Hạt Nhân',
      quantum_master: 'T.Sĩ Lượng Tử',
      stem_legend: 'Huyền thoại',
      multiverse_theorist: 'Thuyết Đa V.Trụ',
      dimension_creator: 'Kiến Tạo K.Gian',
      top_1_universe: 'Đại Đế STEM 👑',
      top_10_legend: 'H.Thoại Đ.Trường',
      top_100_elite: 'Đại Cao Thủ'
    };
    return titles[title] || 'Học viên';
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lắng nghe số lời mời kết bạn chờ xử lý
  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPendingRequestsCount((data.incomingRequests || []).length);
        }
      }, (err) => {
        console.error("Lỗi đồng bộ thông báo kết bạn:", err);
      });
      return () => unsubscribe();
    } else {
      setPendingRequestsCount(0);
    }
  }, [user]);

  // Lắng nghe lời mời thách đấu đến (phíd người nhận)
  useEffect(() => {
    if (!user) {
      setIncomingChallenge(null);
      return;
    }
    const q = query(
      collection(db, 'challengeInvites'),
      where('toUid', '==', user.uid),
      where('status', '==', 'pending')
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0];
        setIncomingChallenge({ id: d.id, ...d.data() });
      } else {
        setIncomingChallenge(null);
      }
    }, (err) => console.error('Challenge listener error:', err));
    return () => unsub();
  }, [user]);

  // Lưu các lời thách đấu đã xử lý thành công để tránh xử lý nhiều lần
  const processedChallengesRef = useRef(new Set());

  // Lắng nghe lời mời đã gửi được chấp nhận (phía người gửi)
  useEffect(() => {
    if (!user) {
      setAcceptedOutgoing(null);
      return;
    }
    const q = query(
      collection(db, 'challengeInvites'),
      where('fromUid', '==', user.uid),
      where('status', '==', 'accepted')
    );
    const unsub = onSnapshot(q, async (snap) => {
      if (!snap.empty) {
        // Tìm document có thời gian tạo (createdAt) mới nhất hoặc đang ước lượng để xử lý chính xác
        let latestDoc = snap.docs[0];
        let latestTime = 0;
        
        snap.docs.forEach((docSnap) => {
          const dData = docSnap.data();
          let time = Date.now();
          if (dData.createdAt) {
            if (typeof dData.createdAt.toMillis === 'function') {
              time = dData.createdAt.toMillis();
            } else if (dData.createdAt.seconds) {
              time = dData.createdAt.seconds * 1000;
            } else {
              time = new Date(dData.createdAt).getTime();
            }
          }
          if (time > latestTime) {
            latestTime = time;
            latestDoc = docSnap;
          }
        });

        const d = latestDoc;
        const data = d.data();
        const roomId = data.roomId;
        
        // Kiểm tra xem lời mời này có mới không (trong vòng 2 phút)
        const ageMs = Date.now() - latestTime;
        if (ageMs > 120000) {
          // Lời mời quá cũ (stale), tiến hành dọn dẹp cơ sở dữ liệu và không xử lý
          try { await deleteDoc(doc(db, 'challengeInvites', d.id)); } catch (_) {}
          return;
        }

        // Bỏ qua nếu lời mời này đã được xử lý thành công trên client hiện tại
        if (processedChallengesRef.current.has(d.id)) return;
        processedChallengesRef.current.add(d.id);
        
        setAcceptedOutgoing({ subject: data.subject, toName: data.toName });
        
        // Tiến hành xóa document sau khi đã lưu thông tin cục bộ để tránh trigger lại khi navigate
        try { await deleteDoc(doc(db, 'challengeInvites', d.id)); } catch (_) {}
        
        // Tự động vào đấu trường sau 1.5 giây (để hiện toast)
        setTimeout(() => {
          setAcceptedOutgoing(null);
          router.push(`/dau-truong?roomId=${roomId}&subject=${data.subject}&t=${Date.now()}`);
        }, 1500);
      }
    }, (err) => console.error('Outgoing challenge listener error:', err));
    return () => unsub();
  }, [user]);



  const acceptChallenge = async () => {
    if (!incomingChallenge) return;
    playSound.click();
    try {
      const roomId = `challenge_${incomingChallenge.id}`;
      const roomRef = doc(db, 'match_rooms', roomId);
      
      const subject = incomingChallenge.subject;
      const matchData = {};

      if (subject === 'chemistry') {
        const seenChem = getSessionHistory('seen_chem_missions');
        const chemPool = generateChemistryPool(seenChem, 1);
        const chemTargetOptions = [10, 20, 30, 40];
        matchData.chemTarget = chemTargetOptions[Math.floor(Math.random() * chemTargetOptions.length)];
        matchData.chemMissionId = chemPool[0]?.id || 'mission_01_cl2_synthesis';
      } else if (subject === 'physics') {
        const seenPhys = getSessionHistory('seen_phys_targets');
        const physPool = generatePhysicsPool(seenPhys, 1);
        matchData.physTarget = physPool[0] || [45, 90, 135];
      } else if (subject === 'math') {
        const seenMath = getSessionHistory('seen_math_questions');
        const mathPool = generateMathPool(seenMath, 3);
        matchData.mathAsteroids = mathPool.map((q, idx) => ({
          eq: q.eq,
          ans: q.ans,
          status: idx === 0 ? 'active' : 'pending',
          coord: q.coord
        }));
      } else if (subject === 'biology') {
        const seenBio = getSessionHistory('seen_bio_questions');
        let bioPool = [];
        try {
          const qRef = collection(db, 'questions');
          const q = query(qRef, where('subject', '==', 'biology'), where('status', '==', 'public'));
          const querySnap = await getDocs(q);
          querySnap.forEach(docSnap => {
            const data = docSnap.data();
            bioPool.push({
              text: data.text,
              choices: data.choices,
              correct: data.correct,
              note: data.explanation || ''
            });
          });
        } catch (err) {
          console.warn("Lỗi tải câu hỏi từ Firestore, dùng fallback:", err);
        }

        if (bioPool.length === 0) {
          bioPool = generateBioPool(seenBio, 5);
        } else {
          // Lọc trùng chéo theo lịch sử đã xem
          let available = bioPool.filter(q => !seenBio.includes(q.text));
          if (available.length < 5) {
            available = bioPool;
          }
          // Trộn ngẫu nhiên (Fisher-Yates)
          for (let i = available.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [available[i], available[j]] = [available[j], available[i]];
          }
          bioPool = available.slice(0, 5);
        }

        matchData.bioGame = {
          type: 'general',
          label: 'Sinh học Tổng hợp',
          icon: '🧬',
          questions: bioPool,
          currentQ: 0,
          score: 0,
          mistakes: 0,
          answered: []
        };
      }

      const roomData = {
        id: roomId,
        subject: subject,
        status: 'playing',
        player1: {
          uid: incomingChallenge.fromUid,
          name: incomingChallenge.fromName,
          elo: incomingChallenge.fromElo || 0,
          level: incomingChallenge.fromLevel || 1,
          activeTitle: incomingChallenge.fromActiveTitle || 'apprentice',
          avatarFrame: incomingChallenge.fromAvatarFrame || 'default',
          avatarParts: incomingChallenge.fromAvatarParts || null
        },
        player2: {
          uid: user.uid,
          name: personalization.name || user.displayName || 'Học viên',
          elo: personalization.elo || 0,
          level: personalization.level || 1,
          activeTitle: personalization.activeTitle || 'apprentice',
          avatarFrame: personalization.avatarFrame || 'default',
          avatarParts: personalization.avatarParts || null
        },
        player1Progress: 0,
        player2Progress: 0,
        player1Logs: ['Đấu thủ 1 thách đấu đã sẵn sàng!'],
        player2Logs: ['Đấu thủ 2 thách đấu đã sẵn sàng!'],
        timeRemaining: 60,
        winnerId: null,
        createdAt: new Date().toISOString(),
        isChallenge: true,
        matchData: matchData
      };

      // Tạo phòng chơi
      await setDoc(roomRef, roomData);

      // Cập nhật lời mời đã được chấp nhận và lưu roomId
      await updateDoc(doc(db, 'challengeInvites', incomingChallenge.id), { 
        status: 'accepted',
        roomId: roomId
      });

      setIncomingChallenge(null);
      router.push(`/dau-truong?roomId=${roomId}&subject=${incomingChallenge.subject}&t=${Date.now()}`);
    } catch (err) {
      console.error('Accept challenge error:', err);
    }
  };

  const declineChallenge = async () => {
    if (!incomingChallenge) return;
    playSound.click();
    setDecliningChallenge(true);
    try {
      await deleteDoc(doc(db, 'challengeInvites', incomingChallenge.id));
      setIncomingChallenge(null);
    } catch (err) {
      console.error('Decline challenge error:', err);
    } finally {
      setDecliningChallenge(false);
    }
  };

  const openAuth = (view) => {
    setAuthView(view);
    setIsAuthOpen(true);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <>
      <header className="h-[72px] bg-white/70 dark:bg-[#1c1e29]/75 backdrop-blur-md flex items-center justify-between px-8 border-b border-slate-200 dark:border-white/5 sticky top-0 z-50 w-full transition-colors">
        {/* Center Nav */}
        <nav className="hidden lg:flex items-center gap-8 mx-8 h-full">
          <button 
            onClick={() => {
              playSound.click();
              router.push('/');
            }}
            onMouseEnter={playSound.hover}
            className={`flex items-center gap-2 text-sm font-medium transition-all duration-300 h-[72px] border-b-2 active:scale-95 ${
              pathname === '/' 
                ? 'text-pink-500 dark:text-pink-400 border-pink-500 dark:border-pink-400' 
                : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border-transparent'
            }`}
          >
            <Beaker className="w-4 h-4 text-pink-500 dark:text-pink-400" /> Phòng lab
          </button>
          <button 
            onClick={() => {
              playSound.click();
              router.push('/phong-thi');
            }}
            onMouseEnter={playSound.hover}
            className={`flex items-center gap-2 text-sm font-medium transition-all duration-300 h-[72px] border-b-2 active:scale-95 group ${
              pathname?.startsWith('/phong-thi') 
                ? 'text-rose-600 dark:text-rose-400 border-rose-500 dark:border-rose-500 shadow-[inset_0_-2px_0_0_#f43f5e]' 
                : 'text-slate-650 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border-transparent'
            }`}
          >
            <Rocket className="w-4 h-4 text-rose-500 group-hover:animate-bounce" /> Phòng thi thực chiến
          </button>
          <button 
            onClick={() => {
              playSound.click();
              router.push('/story');
            }}
            onMouseEnter={playSound.hover}
            className={`flex items-center gap-2 text-sm font-medium transition-all duration-300 h-[72px] border-b-2 active:scale-95 group ${
              pathname?.startsWith('/story') 
                ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500 dark:border-emerald-500 shadow-[inset_0_-2px_0_0_#10b981]' 
                : 'text-slate-650 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border-transparent'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-500 group-hover:rotate-12 transition-transform" /> Story
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {mounted && (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-white/5"
              title="Đổi giao diện"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}
          
          {user ? (
            <div className="relative flex items-center gap-3 ml-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 dark:text-purple-300 rounded-full text-xs font-black font-sans select-none">
                <span className="animate-pulse">🔮</span>
                <span>{personalization.crystals !== undefined ? personalization.crystals : 500} Pha lê</span>
              </div>

              <button 
                onMouseEnter={playSound.hover}
                onClick={() => {
                  playSound.click();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                className="flex items-center gap-3 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/5 transition-all select-none active:scale-95 relative z-[1001]"
              >
                <AvatarFrame frame={personalization.avatarFrame} className="w-9 h-9 text-base">
                  {personalization.avatarUrl === 'custom-avatar' ? (
                    <STEMAvatarSVG parts={personalization.avatarParts} />
                  ) : personalization.avatarUrl ? (
                    personalization.avatarUrl.startsWith('http') || personalization.avatarUrl.startsWith('data:image/') ? (
                      <img src={personalization.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a1a1aa'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E"; }} />
                    ) : (
                      <span className="select-none">{personalization.avatarUrl}</span>
                    )
                  ) : (
                    user.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-5 h-5 text-slate-700 dark:text-zinc-300" />
                  )}
                  {pendingRequestsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-500 border border-slate-200 dark:border-[#1c1e29] text-[8px] font-bold text-white rounded-full flex items-center justify-center animate-bounce shadow-md z-30">
                      {pendingRequestsCount}
                    </span>
                  )}
                </AvatarFrame>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-slate-800 dark:text-white leading-tight">{user.displayName || 'Học viên'}</div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400 leading-none mt-0.5">{getTitleLabel(personalization.activeTitle)} (Lv.{personalization.level})</div>
                </div>
              </button>

              {isDropdownOpen && (
                <SettingsDropdown onClose={() => setIsDropdownOpen(false)} />
              )}
            </div>
          ) : (
            <>
              <button onClick={() => openAuth('login')} className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-full transition-all active:scale-95">
                Đăng nhập
              </button>
              <button onClick={() => openAuth('register')} className="px-5 py-2 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 rounded-full transition-all active:scale-95 shadow-lg shadow-pink-500/20">
                Đăng ký
              </button>
            </>
          )}
        </div>
      </header>

      {/* Login & Register Modal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        initialView={authView} 
      />

      {/* ====== INCOMING CHALLENGE NOTIFICATION TOAST ====== */}
      {incomingChallenge && (
        <div className="fixed bottom-6 right-6 z-[99999] w-80 bg-gradient-to-br from-[#2a2c3a] to-[#1c1e29] border border-rose-500/30 rounded-3xl shadow-2xl shadow-rose-500/10 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl shrink-0">
                <Swords className="w-5 h-5 text-rose-400 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white uppercase tracking-wider">Lời mời thách đấu!</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  <span className="text-pink-400 font-bold">{incomingChallenge.fromName}</span>
                  {' '}(Elo {incomingChallenge.fromElo}) đang thách đấu bạn
                </p>
              </div>
            </div>

            <div className="bg-[#1c1e29]/60 border border-white/5 rounded-xl p-3 mb-4 text-center">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Môn thi</p>
              <p className="text-sm font-extrabold text-white">{incomingChallenge.subjectLabel || incomingChallenge.subject}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={acceptChallenge}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                ✅ Chấp nhận
              </button>
              <button
                onClick={declineChallenge}
                disabled={decliningChallenge}
                className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:text-white text-rose-400 text-xs font-bold rounded-xl transition-all active:scale-95"
              >
                ❌ Từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== OUTGOING CHALLENGE ACCEPTED TOAST ====== */}
      {acceptedOutgoing && (
        <div className="fixed bottom-6 right-6 z-[99999] w-80 bg-gradient-to-br from-[#2a2c3a] to-[#1c1e29] border border-emerald-500/30 rounded-3xl shadow-2xl shadow-emerald-500/10 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
          <div className="p-5 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shrink-0">
              <Swords className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white uppercase tracking-wider">Lời mời được chấp nhận!</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                <span className="text-pink-400 font-bold">{acceptedOutgoing.toName}</span> đã đồng ý thách đấu! Đang chuyển hướng vào đấu trường...
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
