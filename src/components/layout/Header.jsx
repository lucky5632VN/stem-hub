'use client';

import { Search, Moon, Sun, Beaker, Rocket, BookOpen, User, Swords, Sparkles, PanelLeft } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AuthModal from '@/components/organisms/AuthModal';
import SettingsDropdown from '@/components/organisms/SettingsDropdown';
import { useAppStore } from '@/store/useAppStore';
import { auth, db, functions, httpsCallable } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, updateDoc, deleteDoc, setDoc, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { playSound } from '@/lib/sound';
import { AvatarFrame } from '@/components/atoms/AvatarFrame';
import STEMAvatarSVG from '@/components/atoms/STEMAvatarSVG';
import CyberMusicPlayer, { CyberMusicHeaderButton } from '@/components/atoms/CyberMusicPlayer';
import { 
  generateBioPool, 
  generateMathPool, 
  generatePhysicsPool, 
  generateChemistryPool 
} from '@/lib/arenaGenerator';

const MCQ_QUESTIONS_PER_MATCH = 8;

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
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const lastIncomingUidsRef = useRef(null);
  const [newFriendRequest, setNewFriendRequest] = useState(null);

  const dropdownRef = useRef(null);

  // Tự động đóng Menu Cài đặt khi nhấp vào bất kỳ đâu ngoài Menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

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
      apprentice: 'Tập sự STEM',
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

  // Lắng nghe số lời mời kết bạn chờ xử lý và tự động thông báo lời mời mới
  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const incoming = data.incomingRequests || [];
          setPendingRequestsCount(incoming.length);

          const currentUids = incoming.map(r => r.uid);
          const previousUids = lastIncomingUidsRef.current;

          if (previousUids !== null) {
            const addedUids = currentUids.filter(uid => !previousUids.includes(uid));
            if (addedUids.length > 0) {
              const newReq = incoming.find(r => r.uid === addedUids[0]);
              if (newReq) {
                try { playSound.success(); } catch (_) {}
                setNewFriendRequest(newReq);
              }
            }
          }
          lastIncomingUidsRef.current = currentUids;
        }
      }, (err) => {
        console.error("Lỗi đồng bộ thông báo kết bạn:", err);
      });
      return () => unsubscribe();
    } else {
      setPendingRequestsCount(0);
      lastIncomingUidsRef.current = null;
      setNewFriendRequest(null);
    }
  }, [user]);

  const acceptFriendRequest = async (senderUid) => {
    try { playSound.success(); } catch (_) {}
    if (!user || !senderUid) return;
    try {
      const processFriend = httpsCallable(functions, 'processFriendAction');
      await processFriend({
        actionType: 'ACCEPT_REQUEST',
        payload: { targetUid: senderUid }
      });
      setNewFriendRequest(null);
    } catch (err) {
      console.error("Lỗi khi chấp nhận kết bạn:", err);
    }
  };

  const declineFriendRequest = async (senderUid) => {
    try { playSound.click(); } catch (_) {}
    if (!user || !senderUid) return;
    try {
      const processFriend = httpsCallable(functions, 'processFriendAction');
      await processFriend({
        actionType: 'DECLINE_REQUEST',
        payload: { targetUid: senderUid }
      });
      setNewFriendRequest(null);
    } catch (err) {
      console.error("Lỗi khi từ chối kết bạn:", err);
    }
  };

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

      const challengeMode = ['math', 'physics', 'chemistry'].includes(subject)
        ? (Math.random() < 0.5 ? 'mcq' : 'practical')
        : 'mcq';
      matchData.challengeMode = challengeMode;

      if (challengeMode === 'mcq') {
        const seenQuestions = getSessionHistory(`seen_${subject}_questions`);
        let mcqPool = [];
        try {
          const qRef = collection(db, 'questions');
          const q = query(qRef, where('subject', '==', subject), where('status', '==', 'public'));
          const querySnap = await getDocs(q);
          querySnap.forEach(docSnap => {
            const data = docSnap.data();
            mcqPool.push({
              text: data.text,
              choices: data.choices,
              correct: data.correct,
              note: data.explanation || ''
            });
          });
        } catch (err) {
          console.warn(`Lỗi tải câu hỏi ${subject} trắc nghiệm từ Firestore:`, err);
        }

        const targetCount = subject === 'biology' ? 30 : MCQ_QUESTIONS_PER_MATCH;

        if (mcqPool.length === 0) {
          if (subject === 'biology') {
            mcqPool = generateBioPool(seenQuestions, targetCount);
          } else {
            mcqPool = Array.from({ length: targetCount }, (_, i) => ({
              text: `Câu hỏi trắc nghiệm mẫu môn ${subject} số ${i + 1} (Đang tải...)?`,
              choices: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
              correct: 0,
              note: 'Không tải được câu hỏi từ server.'
            }));
          }
        } else {
          let available = mcqPool.filter(q => !seenQuestions.includes(q.text));
          if (available.length < targetCount) {
            available = mcqPool;
          }
          for (let i = available.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [available[i], available[j]] = [available[j], available[i]];
          }
          mcqPool = available.slice(0, targetCount);
        }

        const mcqGameData = {
          type: 'general',
          label: subject === 'math' ? 'Toán học Trắc nghiệm' : subject === 'physics' ? 'Vật lý Trắc nghiệm' : subject === 'chemistry' ? 'Hóa học Trắc nghiệm' : 'Sinh học Tổng hợp',
          icon: subject === 'math' ? '📐' : subject === 'physics' ? '⚙️' : subject === 'chemistry' ? '🧪' : '🧬',
          questions: mcqPool,
          currentQ: 0,
          score: 0,
          mistakes: 0,
          answered: []
        };

        if (subject === 'biology') {
          matchData.bioGame = mcqGameData;
        } else {
          matchData.mcqGame = mcqGameData;
        }
      } else {
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
          const mathPool = generateMathPool(seenMath, 8);
          matchData.mathAsteroids = mathPool.map((q, idx) => ({
            eq: q.eq,
            ans: q.ans,
            status: idx === 0 ? 'active' : 'pending',
            coord: q.coord
          }));
        }
      }


      const roomData = {
        id: roomId,
        subject: subject,
        status: 'equipment_selecting',
        equipmentPhase: {
          status: 'selecting',
          expiresAt: Date.now() + 30000,
          p1Ready: false,
          p2Ready: false
        },
        player1Equipment: [],
        player2Equipment: [],
        activeEffects: {
          p1: { frozenUntil: 0, fogUntil: 0, eloShielded: false, crystalMultiplier: 1, stolenCount: 0, reflectActive: false },
          p2: { frozenUntil: 0, fogUntil: 0, eloShielded: false, crystalMultiplier: 1, stolenCount: 0, reflectActive: false }
        },
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
        timeRemaining: 180,
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
    try { playSound.click(); } catch (_) {}
    try {
      if (typeof window !== 'undefined') {
        if (user?.uid) {
          sessionStorage.removeItem('face2FA_verified_' + user.uid);
          localStorage.removeItem('face2FA_verified_' + user.uid);
        }
        localStorage.removeItem('emailFor2FA');
        sessionStorage.clear();
      }
      useAppStore.getState().setUser(null);
      await signOut(auth);
    } catch (err) {
      console.error("Lỗi khi đăng xuất:", err);
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  return (
    <>
      <header className="h-[72px] bg-bg-primary/95 backdrop-blur-xl flex items-center justify-between px-6 lg:px-8 border-b border-border-theme sticky top-0 z-30 w-full transition-colors select-none">
        {/* Left Action: Toggle Sidebar Button */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              playSound.click();
              toggleSidebar();
            }}
            onMouseEnter={playSound.hover}
            className="p-2 text-text-secondary hover:text-text-primary transition-all rounded-xl hover:bg-bg-tertiary border border-border-theme flex items-center justify-center cursor-pointer active:scale-95 group"
            title={isSidebarOpen ? "Thu gọn thanh menu" : "Mở thanh menu"}
          >
            <PanelLeft className={`w-5 h-5 transition-transform duration-300 ${isSidebarOpen ? 'text-accent-pink' : 'text-text-secondary group-hover:scale-110'}`} />
          </button>
        </div>

        {/* Center Nav */}
        <nav className="hidden lg:flex items-center gap-8 mx-8 h-full">
          <button 
            onClick={() => {
              playSound.click();
              router.push('/');
            }}
            onMouseEnter={playSound.hover}
            className={`flex items-center gap-2 text-sm transition-all duration-200 h-[72px] border-b-2 active:scale-95 ${
              pathname === '/' 
                ? 'text-accent-pink border-accent-pink font-bold shadow-[inset_0_-2px_0_0_var(--accent-pink)]' 
                : 'text-text-secondary hover:text-text-primary border-transparent'
            }`}
          >
            <Beaker className="w-4 h-4 text-accent-pink" /> Phòng lab
          </button>
          <button 
            onClick={() => {
              playSound.click();
              router.push('/phong-thi');
            }}
            onMouseEnter={playSound.hover}
            className={`flex items-center gap-2 text-sm transition-all duration-200 h-[72px] border-b-2 active:scale-95 group ${
              pathname?.startsWith('/phong-thi') 
                ? 'text-accent-pink border-accent-pink font-bold shadow-[inset_0_-2px_0_0_var(--accent-pink)]' 
                : 'text-text-secondary hover:text-text-primary border-transparent'
            }`}
          >
            <Rocket className="w-4 h-4 text-accent-pink group-hover:animate-bounce" /> Phòng thi thực chiến
          </button>
          <button 
            onClick={() => {
              playSound.click();
              router.push('/story');
            }}
            onMouseEnter={playSound.hover}
            className={`flex items-center gap-2 text-sm transition-all duration-200 h-[72px] border-b-2 active:scale-95 group ${
              pathname?.startsWith('/story') 
                ? 'text-accent-cyan border-accent-cyan font-bold shadow-[inset_0_-2px_0_0_var(--accent-cyan)]' 
                : 'text-text-secondary hover:text-text-primary border-transparent'
            }`}
          >
            <BookOpen className="w-4 h-4 text-accent-cyan group-hover:rotate-12 transition-transform" /> Story
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3 md:gap-4">
          <CyberMusicHeaderButton />
          {mounted && (
            <button 
              onClick={() => {
                try { playSound.click(); } catch (_) {}
                setTheme(theme === 'dark' ? 'light' : 'dark');
              }}
              className={`group relative flex items-center justify-between w-14 h-7 p-1 rounded-full border transition-all duration-500 cursor-pointer shadow-inner overflow-hidden active:scale-95 ${
                theme === 'dark'
                  ? 'bg-[#181428] border-purple-500/40 hover:border-accent-pink/60 shadow-purple-950/50'
                  : 'bg-[#F0EBFA] border-amber-400/50 hover:border-amber-500 shadow-amber-200/50'
              }`}
              title={theme === 'dark' ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
            >
              {/* Background Track Icons */}
              <span className="flex items-center justify-between w-full px-0.5 text-[10px] pointer-events-none select-none z-0">
                <Sun className={`w-3.5 h-3.5 transition-all duration-500 ${theme === 'dark' ? 'text-zinc-600 opacity-40 scale-75' : 'text-amber-500 opacity-100 scale-100 rotate-0'}`} />
                <Moon className={`w-3.5 h-3.5 transition-all duration-500 ${theme === 'dark' ? 'text-accent-pink opacity-100 scale-100' : 'text-zinc-400 opacity-40 scale-75'}`} />
              </span>

              {/* Sliding Glowing Orb Thumb */}
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) shadow-md z-10 ${
                  theme === 'dark'
                    ? 'translate-x-7 bg-gradient-to-tr from-accent-pink to-accent-purple text-white shadow-[0_0_10px_rgba(240,57,140,0.5)] group-hover:scale-110'
                    : 'translate-x-0 bg-gradient-to-tr from-amber-400 to-amber-300 text-amber-950 shadow-[0_0_10px_rgba(251,191,36,0.5)] group-hover:scale-110'
                }`}
              >
                {theme === 'dark' ? (
                  <Moon className="w-3.5 h-3.5 text-white transform -rotate-12 transition-transform duration-500 group-hover:rotate-12" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-950 transform rotate-0 transition-transform duration-500 group-hover:rotate-90" />
                )}
              </div>
            </button>
          )}
          
          {user ? (
            <div ref={dropdownRef} className="relative flex items-center gap-3 ml-2">
              {/* Lớp phủ bắt sự kiện nhấp ra bất kỳ vị trí nào bên ngoài để đóng menu */}
              {isDropdownOpen && (
                <div 
                  className="fixed inset-0 z-[990] bg-transparent cursor-default pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(false);
                  }}
                />
              )}

              <button 
                onMouseEnter={playSound.hover}
                onClick={() => {
                  playSound.click();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                className="flex items-center gap-3 px-3 py-1.5 rounded-full hover:bg-bg-tertiary border border-transparent hover:border-border-theme transition-all select-none active:scale-95 relative z-[1001]"
              >
                <AvatarFrame frame={personalization.avatarFrame} className="w-9 h-9 text-base">
                  {personalization.avatarUrl === 'custom-avatar' || (!personalization.avatarUrl && personalization.avatarParts) || personalization.avatarParts ? (
                    <STEMAvatarSVG parts={personalization.avatarParts} />
                  ) : personalization.avatarUrl && (personalization.avatarUrl.startsWith('http') || personalization.avatarUrl.startsWith('data:image/')) ? (
                    <img src={personalization.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                  ) : (
                    <span className="font-extrabold text-accent-pink select-none">
                      {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'H'}
                    </span>
                  )}
                  {pendingRequestsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-500 border border-slate-200 dark:border-bg-primary text-[8px] font-bold text-white rounded-full flex items-center justify-center animate-bounce shadow-md z-30">
                      {pendingRequestsCount}
                    </span>
                  )}
                </AvatarFrame>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-text-primary leading-tight">{user.displayName || 'Học viên'}</div>
                  <div className="text-[10px] text-text-secondary leading-none mt-0.5">{getTitleLabel(personalization.activeTitle)} (Lv.{personalization.level})</div>
                </div>
              </button>

              {isDropdownOpen && (
                <SettingsDropdown onClose={() => setIsDropdownOpen(false)} />
              )}
            </div>
          ) : (
            <>
              <button onClick={() => openAuth('login')} className="px-5 py-2 text-sm font-medium text-text-primary bg-bg-tertiary hover:bg-border-theme border border-border-theme rounded-full transition-all active:scale-95">
                Đăng nhập
              </button>
              <button onClick={() => openAuth('register')} className="px-5 py-2 text-sm font-medium text-white bg-accent-pink hover:opacity-90 rounded-full transition-all active:scale-95 shadow-lg shadow-accent-pink/20">
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
        <div className="fixed bottom-6 right-6 z-[99999] w-80 bg-gradient-to-br from-bg-secondary to-bg-primary border border-rose-500/30 rounded-3xl shadow-2xl shadow-rose-500/10 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl shrink-0">
                <Swords className="w-5 h-5 text-rose-400 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-text-primary uppercase tracking-wider">Lời mời thách đấu!</p>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  <span className="text-accent-pink font-bold">{incomingChallenge.fromName}</span>
                  {' '}(Elo {incomingChallenge.fromElo}) đang thách đấu bạn
                </p>
              </div>
            </div>

            <div className="bg-bg-tertiary/60 border border-border-theme rounded-xl p-3 mb-4 text-center">
              <p className="text-[10px] text-text-secondary uppercase tracking-widest mb-1">Môn thi</p>
              <p className="text-sm font-extrabold text-text-primary">{incomingChallenge.subjectLabel || incomingChallenge.subject}</p>
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
        <div className="fixed bottom-6 right-6 z-[99999] w-80 bg-gradient-to-br from-bg-secondary to-bg-primary border border-emerald-500/30 rounded-3xl shadow-2xl shadow-emerald-500/10 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
          <div className="p-5 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shrink-0">
              <Swords className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-text-primary uppercase tracking-wider">Lời mời được chấp nhận!</p>
              <p className="text-[10px] text-text-secondary mt-0.5">
                <span className="text-accent-pink font-bold">{acceptedOutgoing.toName}</span> đã đồng ý thách đấu! Đang chuyển hướng vào đấu trường...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ====== INCOMING FRIEND REQUEST TOAST ====== */}
      {newFriendRequest && (
        <div className="fixed bottom-6 right-6 z-[99999] w-80 bg-gradient-to-br from-bg-secondary to-bg-primary border border-accent-pink/30 rounded-3xl shadow-2xl shadow-accent-pink/10 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 text-left">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent-pink to-transparent" />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <AvatarFrame frame={newFriendRequest.avatarFrame} className="w-10 h-10 text-base shrink-0">
                {newFriendRequest.avatarParts ? (
                  <STEMAvatarSVG parts={newFriendRequest.avatarParts} className="w-full h-full transform scale-90" />
                ) : newFriendRequest.avatarUrl ? (
                  newFriendRequest.avatarUrl.startsWith('http') || newFriendRequest.avatarUrl.startsWith('data:image/') ? (
                    <img src={newFriendRequest.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="select-none">{newFriendRequest.avatarUrl}</span>
                  )
                ) : (
                  newFriendRequest.displayName ? newFriendRequest.displayName.charAt(0).toUpperCase() : 'H'
                )}
              </AvatarFrame>
              <div>
                <p className="text-xs font-extrabold text-text-primary uppercase tracking-wider">Yêu cầu kết bạn mới!</p>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  <span className="text-accent-pink font-bold">{newFriendRequest.displayName || 'Học viên'}</span>
                  {' '}muốn kết bạn với bạn.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => acceptFriendRequest(newFriendRequest.uid)}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 uppercase tracking-wider"
              >
                Chấp nhận
              </button>
              <button
                onClick={() => declineFriendRequest(newFriendRequest.uid)}
                className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:text-white text-rose-400 text-[10px] font-bold rounded-xl transition-all active:scale-95 uppercase tracking-wider"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
