'use client';

import { useEffect, useState, useRef } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { auth, db, functions, httpsCallable } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { ensureFirestoreOnline, safeFirestoreCall } from '@/lib/firestoreRetry';
import { useAppStore } from '@/store/useAppStore';
import CustomCursor from '@/components/atoms/CustomCursor';
import { Camera, Sparkles, Loader, ShieldAlert, Megaphone } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { playSound } from '@/lib/sound';
import html2canvas from 'html2canvas-pro';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({ children }) {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const setPersonalization = useAppStore((state) => state.setPersonalization);
  const personalization = useAppStore((state) => state.personalization);
  const arenaState = useAppStore((state) => state.arenaState);
  const activeLab = useAppStore((state) => state.activeLab);

  const pathname = usePathname();
  const router = useRouter();
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const userElo = personalization.elo || 0;
  const [maintenance, setMaintenance] = useState(false);
  const [banner, setBanner] = useState({ enabled: false, text: '', type: 'info' });

  // Đồng bộ cấu hình bảo trì hệ thống và banner thời gian thực từ Firestore
  useEffect(() => {
    const docRef = doc(db, 'config', 'systemSettings');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMaintenance(!!data.maintenanceMode);
        setBanner({
          enabled: !!data.bannerEnabled,
          text: data.bannerText || '',
          type: data.bannerType || 'info'
        });
      }
    }, (err) => {
      console.warn("⚠️ Không thể đồng bộ chế độ bảo trì:", err);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let presenceInterval = null;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (presenceInterval) {
        clearInterval(presenceInterval);
        presenceInterval = null;
      }
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        });

        // Bọc luồng tải dữ liệu cá nhân hóa Firestore trong khối Async tự chữa lành
        const loadUserProfile = async () => {
          try {
            // Bước 1: Đảm bảo mạng Firestore online trước
            await ensureFirestoreOnline();
            
            const userDocRef = doc(db, 'users', user.uid);
            
            // Bước 2: Gọi đọc tài liệu với Wrapper tự động thử lại (Retry)
            let docSnap = null;
            try {
              docSnap = await safeFirestoreCall(() => getDoc(userDocRef));
            } catch (err) {
              console.warn("⚠️ Mạng không ổn định khi tải dữ liệu người dùng, chuyển sang sử dụng cache hoặc giá trị mặc định:", err);
            }
            
            if (docSnap && docSnap.exists()) {
              const data = docSnap.data();
              const isAdmin = user.email?.toLowerCase() === 'admin123@gmail.com';
              const ALL_ADMIN_FRAMES = [
                'default', 'neon_fire', 'cyan_tech', 'cosmic_nebula', 
                'blackhole_gravity', 'antimatter_era', 'multiverse_overlord', 
                'top_1_sovereign', 'gold_vip', 'top_100_silver'
              ];
              const ALL_ADMIN_TITLES = [
                'apprentice', 'alchemist_expert', 'math_wizard', 'physics_guru', 
                'cosmic_explorer', 'nuclear_engineer', 'quantum_master', 'stem_legend', 
                'multiverse_theorist', 'dimension_creator', 'top_1_universe', 
                'top_10_legend', 'top_100_elite'
              ];
              const ALL_ADMIN_PARTS = [
                'peach', 'hair_default', 'top_default', 'bottom_default',
                'chocolate', 'neon_blue', 'cosmic_purple', 'emerald_alien', 'cyborg_silver', 'sunfire_gold',
                'cyberpunk_spiky', 'long_nebula', 'curly', 'ponytail', 'dreadlocks', 'mohawk', 'side_part',
                'bob', 'double_bun', 'quantum_pixie', 'crystal_waterfall',
                'lab_coat', 'astronaut_suit', 'mech_armor', 'cyber_hoodie', 'steampunk_vest', 'royal_cape',
                'bio_hazard', 'ninja_suit', 'quantum_dress',
                'space_shorts', 'robotic_legs', 'cyber_skirt', 'steampunk_pants', 'ninja_pants', 'lightweight_joggers',
                'tennis_skirt',
                'sci_glasses', 'vr_goggles', 'headphones', 'gas_mask', 'cyber_eyepatch', 'scientific_magnifier',
                'crown', 'butterfly_hairpin'
              ];

              setPersonalization({
                avatarFrame: data.personalization?.avatarFrame || 'default',
                activeTitle: data.personalization?.activeTitle || 'apprentice',
                unlockedFrames: isAdmin ? ALL_ADMIN_FRAMES : (data.personalization?.unlockedFrames || ['default']),
                unlockedTitles: isAdmin ? ALL_ADMIN_TITLES : (data.personalization?.unlockedTitles || ['apprentice']),
                bgImage: data.personalization?.bgImage || '',
                avatarUrl: data.personalization?.avatarUrl || '',
                crystals: data.personalization?.crystals !== undefined ? data.personalization.crystals : 500,
                avatarParts: data.personalization?.avatarParts || { gender: 'male', bodyType: 'chibi', pose: 'standard', body: 'peach', hair: 'default', top: 'default', bottom: 'default', accessory: 'none' },
                unlockedParts: isAdmin ? ALL_ADMIN_PARTS : (data.personalization?.unlockedParts || ['peach', 'hair_default', 'top_default', 'bottom_default']),
                claimedMilestones: data.personalization?.claimedMilestones || [],
                level: data.stats?.level || 1,
                exp: data.stats?.exp || 0,
                nextLevelExp: data.stats?.nextLevelExp || 1000,
                elo: data.stats?.elo !== undefined ? data.stats.elo : 0,
                wins: data.stats?.wins || 0,
                losses: data.stats?.losses || 0,
                subjectStrengths: data.stats?.subjectStrengths || { math: 50, physics: 50, chemistry: 50, biology: 50 }
              });
            } else {
              // Nếu chưa có doc trong Firestore, tạo mới với thông tin mặc định
              const initialData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || 'Học viên',
                createdAt: new Date().toISOString(),
                role: 'student',
                personalization: {
                  avatarFrame: 'default',
                  activeTitle: 'apprentice',
                  unlockedFrames: ['default'],
                  unlockedTitles: ['apprentice'],
                  customCursor: 'default',
                  soundEnabled: true,
                  theme: 'dark',
                  crystals: 500,
                  avatarParts: {
                    gender: 'male',
                    bodyType: 'chibi',
                    pose: 'standard',
                    body: 'peach',
                    hair: 'default',
                    top: 'default',
                    bottom: 'default',
                    accessory: 'none'
                  },
                  unlockedParts: ['peach', 'hair_default', 'top_default', 'bottom_default'],
                  claimedMilestones: []
                },
                stats: {
                  level: 1,
                  exp: 0,
                  nextLevelExp: 1000,
                  elo: 0,
                  wins: 0,
                  losses: 0,
                  subjectStrengths: { math: 50, physics: 50, chemistry: 50, biology: 50 }
                }
              };
              
              // Ghi dữ liệu an toàn thông qua Safe Call
              await safeFirestoreCall(() => setDoc(userDocRef, initialData));
              
              setPersonalization({
                avatarFrame: 'default',
                activeTitle: 'apprentice',
                unlockedFrames: ['default'],
                unlockedTitles: ['apprentice'],
                avatarUrl: '',
                bgImage: '',
                crystals: 500,
                avatarParts: {
                  gender: 'male',
                  bodyType: 'chibi',
                  pose: 'standard',
                  body: 'peach',
                  hair: 'default',
                  top: 'default',
                  bottom: 'default',
                  accessory: 'none'
                },
                unlockedParts: ['peach', 'hair_default', 'top_default', 'bottom_default'],
                claimedMilestones: [],
                level: 1,
                exp: 0,
                nextLevelExp: 1000,
                elo: 0,
                wins: 0,
                losses: 0,
                subjectStrengths: { math: 50, physics: 50, chemistry: 50, biology: 50 }
              });
            }
            // Cập nhật trạng thái hoạt động ngay sau khi tải xong thông tin người dùng
            try {
              const updateLastActiveFn = httpsCallable(functions, 'updateLastActive');
              await updateLastActiveFn();
            } catch (err) {
              console.warn("⚠️ Không thể cập nhật trạng thái hoạt động ban đầu:", err);
            }
          } catch (err) {
            console.error("❌ Lỗi nghiêm trọng khi tải dữ liệu người dùng từ Firestore:", err.message || err);
          }
        };

        await loadUserProfile();

        // Thiết lập heartbeat cập nhật trạng thái hoạt động mỗi 15 giây khi tab đang mở
        presenceInterval = setInterval(async () => {
          if (document.visibilityState !== 'visible') return;
          try {
            const updateLastActiveFn = httpsCallable(functions, 'updateLastActive');
            await updateLastActiveFn();
          } catch (e) {
            // Bỏ qua lỗi mạng
          }
        }, 15000);
      } else {
        setUser(null);
        // Reset trạng thái cá nhân hóa
        setPersonalization({
          avatarFrame: 'default',
          activeTitle: 'apprentice',
          unlockedFrames: ['default'],
          unlockedTitles: ['apprentice'],
          level: 1,
          exp: 0,
          nextLevelExp: 1000,
          elo: 0,
          wins: 0,
          losses: 0,
          subjectStrengths: { math: 50, physics: 50, chemistry: 50, biology: 50 }
        });
      }
    });

    return () => {
      unsubscribe();
      if (presenceInterval) clearInterval(presenceInterval);
    };
  }, [setUser, setPersonalization]);

  // Tự động kiểm tra và hủy trang bị Danh hiệu / Khung Avatar nếu không còn đủ điều kiện (Elo, Cấp độ, hoặc Top 10)
  useEffect(() => {
    if (user && personalization) {
      const validateEquippedItems = async () => {
        const currentElo = personalization.elo || 0;
        const currentLevel = personalization.level || 1;
        const equippedFrame = personalization.avatarFrame || 'default';
        const equippedTitle = personalization.activeTitle || 'apprentice';

        let needsUpdate = false;
        let newFrame = equippedFrame;
        let newTitle = equippedTitle;

        // 1. Kiểm tra danh hiệu
        if (equippedTitle === 'stem_legend' && currentElo < 2000) {
          newTitle = 'apprentice';
          needsUpdate = true;
        } else if (equippedTitle === 'multiverse_theorist' && currentElo < 2400) {
          newTitle = 'apprentice';
          needsUpdate = true;
        } else if (equippedTitle === 'dimension_creator' && currentElo < 2800) {
          newTitle = 'apprentice';
          needsUpdate = true;
        } else if (equippedTitle === 'quantum_master' && currentElo < 1600) {
          newTitle = 'apprentice';
          needsUpdate = true;
        } else if (equippedTitle === 'nuclear_engineer' && currentElo < 1300) {
          newTitle = 'apprentice';
          needsUpdate = true;
        } else if (equippedTitle === 'cosmic_explorer' && currentElo < 1100) {
          newTitle = 'apprentice';
          needsUpdate = true;
        } else if (equippedTitle === 'physics_guru' && currentLevel < 4) {
          newTitle = 'apprentice';
          needsUpdate = true;
        } else if (equippedTitle === 'math_wizard' && currentLevel < 3) {
          newTitle = 'apprentice';
          needsUpdate = true;
        } else if (equippedTitle === 'alchemist_expert' && currentLevel < 2) {
          newTitle = 'apprentice';
          needsUpdate = true;
        }

        // 2. Kiểm tra khung avatar
        if (equippedFrame === 'cyan_tech' && currentElo < 1200) {
          newFrame = 'default';
          needsUpdate = true;
        } else if (equippedFrame === 'cosmic_nebula' && currentElo < 1500) {
          newFrame = 'default';
          needsUpdate = true;
        } else if (equippedFrame === 'blackhole_gravity' && currentElo < 1800) {
          newFrame = 'default';
          needsUpdate = true;
        } else if (equippedFrame === 'antimatter_era' && currentElo < 2200) {
          newFrame = 'default';
          needsUpdate = true;
        } else if (equippedFrame === 'multiverse_overlord' && currentElo < 2500) {
          newFrame = 'default';
          needsUpdate = true;
        } else if (equippedFrame === 'neon_fire' && currentLevel < 2) {
          newFrame = 'default';
          needsUpdate = true;
        }

        const rankEquipped = 
          equippedFrame === 'top_1_sovereign' || 
          equippedFrame === 'gold_vip' || 
          equippedFrame === 'top_100_silver' ||
          equippedTitle === 'top_1_universe' ||
          equippedTitle === 'top_10_legend' ||
          equippedTitle === 'top_100_elite';

        if (rankEquipped) {
          try {
            const allUsersSnap = await getDocs(collection(db, 'users'));
            const players = [];
            allUsersSnap.forEach(d => {
              const uData = d.data();
              if (uData.role !== 'admin' && uData.email?.toLowerCase() !== 'admin123@gmail.com' && d.id !== 'admin') {
                players.push({
                  uid: d.id,
                  elo: uData.stats?.elo !== undefined ? uData.stats.elo : 1000
                });
              }
            });
            players.sort((a, b) => b.elo - a.elo);
            const rankIndex = players.findIndex(p => p.uid === user.uid);
            const rank = rankIndex === -1 ? 999 : rankIndex + 1;

            // Kiểm tra TOP 1
            if (equippedFrame === 'top_1_sovereign' && rank !== 1) {
              newFrame = 'default';
              needsUpdate = true;
            }
            if (equippedTitle === 'top_1_universe' && rank !== 1) {
              newTitle = 'apprentice';
              needsUpdate = true;
            }

            // Kiểm tra TOP 10
            if (equippedFrame === 'gold_vip' && rank > 10) {
              newFrame = 'default';
              needsUpdate = true;
            }
            if (equippedTitle === 'top_10_legend' && rank > 10) {
              newTitle = 'apprentice';
              needsUpdate = true;
            }

            // Kiểm tra TOP 100
            if (equippedFrame === 'top_100_silver' && rank > 100) {
              newFrame = 'default';
              needsUpdate = true;
            }
            if (equippedTitle === 'top_100_elite' && rank > 100) {
              newTitle = 'apprentice';
              needsUpdate = true;
            }
          } catch (err) {
            console.warn("Lỗi khi kiểm tra thứ hạng bảng xếp hạng:", err);
          }
        }

        if (needsUpdate) {
          console.log(`⚠️ Tự động hủy trang bị do không còn đủ điều kiện: Khung -> ${newFrame}, Danh hiệu -> ${newTitle}`);
          setPersonalization({
            avatarFrame: newFrame,
            activeTitle: newTitle
          });
          try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              'personalization.avatarFrame': newFrame,
              'personalization.activeTitle': newTitle
            });
          } catch (err) {
            console.error("Lỗi đồng bộ hủy trang bị lên Firestore:", err);
          }
        }
      };

      validateEquippedItems();
    }
  }, [user, personalization.elo, personalization.level]);

  const handleCaptureScreen = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    
    // Play sound click and camera shutter
    playSound.click();
    playSound.shutter();
    setShowFlash(true);
    
    // Wait for the flash to display, then capture
    setTimeout(async () => {
      setShowFlash(false);
      
      try {
        // Target main element
        const mainArea = document.querySelector('main') || document.body;
        
        // Hide screenshot-hide class elements (like custom cursor and the camera FAB itself)
        const elementsToHide = document.querySelectorAll('.screenshot-hide');
        elementsToHide.forEach((el) => {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
        });
        
        // Let it layout briefly
        await new Promise((resolve) => setTimeout(resolve, 40));
        
        const canvas = await html2canvas(mainArea, {
          useCORS: true,
          backgroundColor: '#1c1e29',
          scale: 1.5,
          logging: false,
        });
        
        // Show hidden elements back
        elementsToHide.forEach((el) => {
          el.style.opacity = '';
          el.style.pointerEvents = '';
        });
        
        const base64Image = canvas.toDataURL('image/png');
        
        // Contextual title / caption / subject based on route
        let subject = 'chemistry';
        let subjectLabel = 'STEM Lab';
        let caption = 'Đang khám phá thế giới thực hành STEM thực tế ảo siêu sống động! 🚀🧪';
        
        if (pathname?.includes('/phong-thi')) {
          subject = 'physics';
          subjectLabel = 'Phòng Thi Lượng Tử';
          caption = 'Thực chiến luyện đề thi chuẩn cấu trúc THPT Quốc Gia MoET 2025 đỉnh cao! ⚡🎓';
        } else if (pathname?.includes('/dau-truong')) {
          subject = 'chemistry';
          subjectLabel = 'Đấu Trường Sinh Tử';
          caption = 'Thách đấu thực chiến 1v1 trực tiếp tại Đấu Trường Khoa Học kịch tính! ⚔️🔥';
        } else if (pathname?.includes('/hanh-trinh')) {
          subject = 'biology';
          subjectLabel = 'Hành Trình Di Truyền';
          caption = 'Khám phá thế giới nucleotide, cơ chế di truyền và bản đồ tri thức STEM! 🧬🗺️';
        } else if (pathname?.includes('/ho-so')) {
          subject = 'math';
          subjectLabel = 'Hồ Sơ Danh Vọng';
          caption = 'Chiêm ngưỡng bảng vàng thành tích danh hiệu vinh hiển và chứng chỉ của tôi! 🏆👑';
        }
        
        const pendingShare = {
          subject,
          subjectLabel,
          caption,
          elo: userElo,
          rewardElo: 0,
          rewardExp: 0,
          score: 10,
          totalQuestions: 10,
          imageUrl: base64Image
        };
        
        localStorage.setItem('pending_share_story', JSON.stringify(pendingShare));
        
        playSound.success();
        router.push('/story');
      } catch (err) {
        console.error("Lỗi chụp màn hình:", err);
      } finally {
        setIsCapturing(false);
      }
    }, 150);
  };

  const isAdminRoute = pathname?.startsWith('/admin');
  const isPlaying = arenaState.status === 'playing' || !!activeLab || isAdminRoute;
  const showFloatingShutter = !isPlaying && pathname !== '/story' && pathname !== '/auth';

  const bgImage = personalization?.bgImage || '';
  const isAnimatedBg = bgImage && bgImage.startsWith('animated-');
  const bgStyle = bgImage && !isAnimatedBg ? {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    backgroundRepeat: 'no-repeat'
  } : {};

  const isAdmin = user && (user.email?.toLowerCase() === 'admin123@gmail.com' || user.displayName === 'admin');
  const isMaintenanceActive = maintenance && !isAdmin && !isAdminRoute && pathname !== '/auth';

  if (isMaintenanceActive) {
    return (
      <div 
        style={bgStyle}
        className="flex min-h-screen items-center justify-center bg-[#0c0d14] text-zinc-100 relative overflow-hidden font-sans select-none"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-rose-600/10 to-pink-600/10 rounded-full blur-[120px] animate-[spin_60s_linear_infinite]" />
          <div className="absolute inset-0 opacity-[0.015] bg-[radial-gradient(ellipse_at_center,_#ffffff_1px,_transparent_1px)] bg-[size:32px_32px]" />
        </div>

        <div className="relative z-10 max-w-md w-full mx-4 p-8 bg-[#0f1017]/80 border border-[#1f2235] rounded-3xl shadow-2xl backdrop-blur-xl text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-500 relative group">
              <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-md animate-pulse" />
              <ShieldAlert className="w-10 h-10 animate-[bounce_2s_infinite]" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500 font-mono">
              Hệ thống bảo trì
            </h1>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              Đấu Trường STEM đang được nâng cấp các phân hệ học tập và thi đấu PvP lượng tử. Chúng tôi sẽ trở lại trong ít phút với hiệu năng tốt nhất!
            </p>
          </div>

          <div className="p-4 bg-rose-950/20 border border-rose-500/10 rounded-2xl flex items-center gap-3 text-left">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
            <div className="text-[10px] text-rose-300 font-semibold uppercase tracking-wider font-mono">
              Vui lòng quay lại sau ít phút • Trân trọng cảm ơn!
            </div>
          </div>
          
          <div className="text-[9px] text-zinc-550 font-bold uppercase tracking-widest font-mono pt-2">
            STEM Arena v2.6.0
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={bgStyle}
      className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-[#1c1e29] dark:text-white transition-colors duration-300 relative overflow-x-clip"
    >
      {/* Hình nền động Lượng tử đặc sắc */}
      {isAnimatedBg && bgImage === 'animated-supernova' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#1a1b26]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-purple-600/20 to-pink-600/20 rounded-full blur-[110px] animate-[spin_40s_linear_infinite]" />
          <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[90px] animate-[pulse_10s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-rose-500/15 rounded-full blur-[80px] animate-[pulse_8s_ease-in-out_infinite_1.5s]" />
          <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(ellipse_at_center,_#ffffff_1px,_transparent_1px)] bg-[size:32px_32px]" />
        </div>
      )}
      
      {isAnimatedBg && bgImage === 'animated-cybergrid' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#0c0d14]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#141522] via-[#0c0d14] to-[#0c0d14]" />
          <div className="absolute inset-0" style={{ perspective: '500px' }}>
            <div 
              className="absolute inset-0 origin-[50%_100%]"
              style={{
                transform: 'rotateX(60deg) translateY(-100px)',
                backgroundImage: 'linear-gradient(to right, rgba(34, 211, 238, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(34, 211, 238, 0.06) 1px, transparent 1px)',
                backgroundSize: '45px 45px',
                animation: 'cybergrid-scroll 25s linear infinite',
              }}
            />
          </div>
          <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-cyan-500/5 to-transparent blur-md" />
        </div>
      )}

      {isAnimatedBg && bgImage === 'animated-matrix' && (
        <MatrixRainBackground />
      )}

      {/* Lớp phủ làm dịu dịu dịu nền, giữ tương phản và độ mượt cho text */}
      {isAnimatedBg && (
        <div className="absolute inset-0 bg-white/5 dark:bg-black/25 backdrop-blur-[0.5px] pointer-events-none z-[1]" />
      )}

      {bgImage && !isAnimatedBg && (
        <div className="absolute inset-0 bg-white/75 dark:bg-[#1c1e29]/80 backdrop-blur-[2px] pointer-events-none z-0" />
      )}
      <CustomCursor />
      {!isPlaying && <Sidebar />}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 relative z-10 ${isPlaying ? 'ml-0' : 'ml-[260px]'}`}>
        {!isPlaying && <Header />}
        {!isPlaying && banner.enabled && banner.text && (
          <div className={`w-full py-2 px-6 border-b text-xs font-bold transition-all relative z-30 flex items-center justify-between gap-4 select-none ${
            banner.type === 'warning' 
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/10'
              : banner.type === 'event'
                ? 'bg-pink-500/10 text-pink-400 border-pink-500/10'
                : 'bg-blue-500/10 text-blue-400 border-blue-500/10'
          }`}>
            <div className="flex items-center gap-2 overflow-hidden w-full">
              <Megaphone className={`w-4 h-4 shrink-0 ${banner.type === 'warning' ? 'text-amber-400 animate-pulse' : banner.type === 'event' ? 'text-pink-400 animate-bounce' : 'text-blue-400 animate-pulse'}`} />
              <marquee className="w-full font-mono uppercase tracking-wider font-semibold">{banner.text}</marquee>
            </div>
          </div>
        )}
        <main className="flex-1 overflow-x-clip relative z-10">
          {children}
        </main>
      </div>

      {/* Global Floating Screenshot Shutter FAB (Game-like Camera tool) */}
      {showFloatingShutter && (
        <div className={`fixed bottom-6 screenshot-hide group select-none transition-all duration-300 ${pathname === '/ho-so' ? 'right-28 z-[40]' : 'right-6 z-[999]'}`}>
          {/* Neon Floating Tooltip */}
          <div className="absolute bottom-16 right-0 w-max invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none bg-black/90 border border-pink-500/30 backdrop-blur-md px-3.5 py-2 rounded-2xl text-[10px] font-black text-pink-400 tracking-wider shadow-[0_0_20px_rgba(244,63,94,0.2)] select-none flex items-center gap-1.5 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" /> Chụp & Đăng Story 📸
          </div>
          
          <button
            onClick={handleCaptureScreen}
            disabled={isCapturing}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-purple-700 text-white flex items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.35)] hover:shadow-[0_0_35px_rgba(244,63,94,0.6)] border-2 border-white/20 transition-all hover:scale-110 active:scale-90 relative overflow-hidden group cursor-pointer"
          >
            {/* Spinning Neon Aura */}
            <span className="absolute inset-0 bg-gradient-to-tr from-cyan-400 via-pink-500 to-yellow-400 opacity-0 group-hover:opacity-30 animate-spin" style={{ animationDuration: '4s' }} />
            
            {isCapturing ? (
              <Loader className="w-6 h-6 animate-spin text-white z-10" />
            ) : (
              <Camera className="w-6 h-6 text-white z-10 group-hover:rotate-12 transition-transform" />
            )}
          </button>
        </div>
      )}

      {/* Screen shutter flash overlay */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[999999] bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Component hiệu ứng mưa ký tự lượng tử rơi tự do (Matrix Rain) cho thành tích tối cao
function MatrixRainBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationId;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
    
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const yPositions = Array(columns).fill(0).map(() => Math.random() * -canvas.height);
    
    // Ký tự khoa học, toán học, hóa sinh lượng tử
    const chars = "ΨΦΩλθπ∞√∑∫≈≠01⚛🧪🧬📐⚡".split("");
    
    const draw = () => {
      ctx.fillStyle = 'rgba(28, 30, 41, 0.08)'; // Làm mờ chậm tạo hiệu ứng vệt sáng
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.font = `${fontSize}px monospace`;
      
      for (let i = 0; i < yPositions.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = yPositions[i];
        
        // Tạo dải màu phát sáng tím/rose hồng neon của game
        const opacity = 0.15 + Math.random() * 0.55;
        ctx.fillStyle = `rgba(244, 63, 94, ${opacity})`; // Rose hồng lượng tử phát sáng
        
        ctx.fillText(char, x, y);
        
        if (y > canvas.height && Math.random() > 0.975) {
          yPositions[i] = 0;
        } else {
          yPositions[i] += fontSize * 0.85;
        }
      }
    };
    
    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };
    animate();
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);
  
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
}
