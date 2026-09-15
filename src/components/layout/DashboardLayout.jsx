'use client';

import { useEffect, useState, useRef } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import GlobalAIAssistant from '@/components/organisms/GlobalAIAssistant';
import AdminAILogHUD from '@/components/organisms/AdminAILogHUD';
import CyberMusicPlayer from '@/components/atoms/CyberMusicPlayer';
import { auth, db, functions, httpsCallable } from '@/lib/firebase';
import { onAuthStateChanged, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { ensureFirestoreOnline, safeFirestoreCall } from '@/lib/firestoreRetry';
import { useAppStore } from '@/store/useAppStore';
import CustomCursor from '@/components/atoms/CustomCursor';
import { Camera, Sparkles, Loader, ShieldAlert, Megaphone, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { playSound } from '@/lib/sound';
import html2canvas from 'html2canvas-pro';
import { motion, AnimatePresence } from 'framer-motion';
import { savePendingShare } from '@/lib/indexedDB';
import { getPresetForEmail } from '@/data/testAccounts';
import { EQUIPMENT_CATALOG } from '@/data/equipmentCatalog';
import EmailLinkAuthHandler from '@/components/atoms/EmailLinkAuthHandler';

export default function DashboardLayout({ children }) {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const setPersonalization = useAppStore((state) => state.setPersonalization);
  const personalization = useAppStore((state) => state.personalization);
  const arenaState = useAppStore((state) => state.arenaState);
  const activeLab = useAppStore((state) => state.activeLab);
  const setActiveLab = useAppStore((state) => state.setActiveLab);
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);

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
    }, (_err) => {
      // Xử lý lỗi quyền hạn nhẹ nhàng, không in log rác ra console
      setMaintenance(false);
    });
    return () => unsubscribe();
  }, []);

  // Tự động kiểm tra và đăng nhập khi người dùng click vào Magic Link xác thực qua Email
  useEffect(() => {
    if (typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailFor2FA');
      if (!email && auth.currentUser) {
        email = auth.currentUser.email;
      }
      if (!email) {
        email = window.prompt('Vui lòng nhập địa chỉ Email của bạn để hoàn tất xác thực 2FA:');
      }

      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(async (result) => {
            const loggedInUser = result.user;
            sessionStorage.setItem('face2FA_verified_' + loggedInUser.uid, 'true');
            localStorage.setItem('face2FA_verified_' + loggedInUser.uid, 'true');
            window.localStorage.removeItem('emailFor2FA');
            window.history.replaceState({}, document.title, window.location.pathname);
            try { playSound.success(); } catch (_) {}
            alert('🎉 Xác minh 2FA qua Liên kết Email thành công! Bạn đã đăng nhập vào hệ thống.');
            window.location.href = '/';
          })
          .catch((err) => {
            console.error("Lỗi xác thực Magic Link:", err);
            alert('⚠️ Liên kết xác minh 2FA đã hết hạn hoặc không hợp lệ. Vui lòng gửi lại yêu cầu!');
          });
      }
    }
  }, []);

  useEffect(() => {
    let presenceInterval = null;

    const loadUserProfile = async (user) => {
      if (!user) return;
      try {
        // Bước 1: Đảm bảo mạng Firestore online trước
        await ensureFirestoreOnline();
        
        const userDocRef = doc(db, 'users', user.uid);
        const preset = getPresetForEmail(user.email);
        
        // Bước 2: Gọi đọc tài liệu với Wrapper tự động thử lại (Retry)
        let docSnap = null;
        try {
          docSnap = await safeFirestoreCall(() => getDoc(userDocRef));
        } catch (err) {
          console.warn("⚠️ Mạng không ổn định khi tải dữ liệu người dùng, chuyển sang sử dụng cache hoặc giá trị mặc định:", err);
        }
        
        if (docSnap && docSnap.exists()) {
          let data = docSnap.data();

          // KIỂM TRA BẢO MẬT 2 BƯỚC FACE 2FA
          const isFace2FAEnabled = data?.personalization?.face2FAEnabled || data?.face2FAEnabled;
          const isFaceVerified = typeof window !== 'undefined' && (
            sessionStorage.getItem('face2FA_verified_' + user.uid) === 'true' ||
            localStorage.getItem('face2FA_verified_' + user.uid) === 'true'
          );

          if (isFace2FAEnabled && !isFaceVerified) {
            // Tài khoản bật Face 2FA nhưng chưa hoàn tất xác thực 2FA trong phiên làm việc này -> Giữ trạng thái chưa đăng nhập!
            setUser(null);
            return;
          }

          // Nếu là tài khoản test và thông tin chưa chuẩn (hoặc tên là Học viên), cập nhật theo preset
          if (preset && (!data.displayName || data.displayName === 'Học viên' || data.displayName === user.email?.split('@')[0] || data.stats?.elo === undefined || data.stats?.elo === 0)) {
            const testInventory = EQUIPMENT_CATALOG.map(card => ({ cardId: card.id, quantity: 10 }));
            const updatedFields = {
              displayName: preset.displayName,
              name: preset.displayName,
              isBotAccount: true,
              botStatus: 'available',
              inventory: testInventory,
              stats: {
                level: preset.level || 1,
                exp: (preset.level || 1) * 500,
                nextLevelExp: (preset.level || 1) * 1000,
                elo: preset.elo !== undefined ? preset.elo : 100,
                wins: preset.wins || 0,
                losses: preset.losses || 0,
                subjectStrengths: preset.subjectStrengths || { math: 50, physics: 50, chemistry: 50, biology: 50 }
              },
              personalization: {
                ...(data.personalization || {}),
                elo: preset.elo !== undefined ? preset.elo : 100,
                level: preset.level || 1,
                activeTitle: 'apprentice',
                avatarFrame: 'default',
                crystals: 1000,
                avatarParts: { gender: 'male', bodyType: 'chibi', pose: 'standard', body: 'peach', hair: 'default', top: 'default', bottom: 'default', accessory: 'none' },
                unlockedParts: ['peach', 'hair_default', 'top_default', 'bottom_default']
              }
            };
            
            try {
              await safeFirestoreCall(() => setDoc(userDocRef, updatedFields, { merge: true }));
              await updateProfile(user, { displayName: preset.displayName });
              data = { ...data, ...updatedFields };
            } catch (err) {
              console.warn("⚠️ Lỗi khi tự động sửa tên hiển thị cho tài khoản test:", err);
            }
          }

          const isAdmin = data.role === 'admin' || user.email === 'admin@stemhub.edu.vn';
          
          setUser({
            uid: user.uid,
            email: user.email,
            displayName: data.displayName || data.name || user.displayName || 'Học viên',
            photoURL: user.photoURL || null,
            role: data.role || (user.email === 'admin@stemhub.edu.vn' ? 'admin' : 'student'),
            createdAt: data.createdAt || null,
            stats: data.stats || { elo: 0, level: 1 },
          });

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
            'peach', 'fair', 'tan', 'dark', 'cyan_skin', 'ruby_skin',
            'hair_default', 'short_black', 'long_brown', 'cyber_blue', 'punk_pink', 'blonde_wavy',
            'cyberpunk_spiky', 'long_nebula', 'curly', 'ponytail', 'dreadlocks', 'mohawk', 'side_part',
            'bob', 'double_bun', 'quantum_pixie', 'crystal_waterfall',
            'lab_coat', 'astronaut_suit', 'mech_armor', 'cyber_hoodie', 'steampunk_vest', 'royal_cape',
            'bio_hazard', 'ninja_suit', 'quantum_dress',
            'space_shorts', 'robotic_legs', 'cyber_skirt', 'steampunk_pants', 'ninja_pants', 'lightweight_joggers',
            'tennis_skirt',
            'sci_glasses', 'vr_goggles', 'headphones', 'gas_mask', 'cyber_eyepatch', 'scientific_magnifier',
            'crown', 'butterfly_hairpin'
          ];

          const totalGames = (data.stats?.wins || 0) + (data.stats?.losses || 0);
          const computedAccuracy = totalGames > 0 ? Number((data.stats.wins / totalGames).toFixed(2)) : 0.85;
          const computedStreak = data.stats?.streakCount !== undefined ? data.stats.streakCount : Math.max(1, data.stats?.wins || 1);

          setPersonalization({
            avatarFrame: data.personalization?.avatarFrame || 'default',
            activeTitle: data.personalization?.activeTitle || 'apprentice',
            unlockedFrames: isAdmin ? ALL_ADMIN_FRAMES : (data.personalization?.unlockedFrames || ['default']),
            unlockedTitles: isAdmin ? ALL_ADMIN_TITLES : (data.personalization?.unlockedTitles || ['apprentice']),
            bgImage: data.personalization?.bgImage || '',
            avatarUrl: data.personalization?.avatarUrl || 'custom-avatar',
            crystals: data.personalization?.crystals !== undefined ? data.personalization.crystals : 500,
            avatarParts: data.personalization?.avatarParts || { gender: 'male', bodyType: 'chibi', pose: 'standard', body: 'peach', hair: 'default', top: 'default', bottom: 'default', accessory: 'none' },
            unlockedParts: isAdmin ? ALL_ADMIN_PARTS : (data.personalization?.unlockedParts || ['peach', 'hair_default', 'top_default', 'bottom_default']),
            claimedMilestones: data.personalization?.claimedMilestones || [],
            face2FAEnabled: data.personalization?.face2FAEnabled || data.face2FAEnabled || false,
            faceDescriptor: data.personalization?.faceDescriptor || data.faceDescriptor || null,
            level: data.stats?.level !== undefined ? data.stats.level : (preset ? preset.level : 1),
            exp: data.stats?.exp || 0,
            nextLevelExp: data.stats?.nextLevelExp || 1000,
            elo: data.stats?.elo !== undefined ? data.stats.elo : (preset ? preset.elo : 0),
            wins: data.stats?.wins !== undefined ? data.stats.wins : (preset ? preset.wins : 0),
            losses: data.stats?.losses !== undefined ? data.stats.losses : (preset ? preset.losses : 0),
            accuracyLast10: data.stats?.accuracyLast10 !== undefined ? data.stats.accuracyLast10 : computedAccuracy,
            streakCount: computedStreak,
            subjectStrengths: data.stats?.subjectStrengths || { math: 50, physics: 50, chemistry: 50, biology: 50 }
          });
        } else {
          // Nếu chưa có doc trong Firestore, tạo mới với thông tin mặc định hoặc theo preset
          const testInventory = EQUIPMENT_CATALOG.map(card => ({ cardId: card.id, quantity: 10 }));
          const displayNameToUse = preset ? preset.displayName : (user.displayName || 'Học viên');
          const initialData = {
            uid: user.uid,
            email: user.email,
            displayName: displayNameToUse,
            name: displayNameToUse,
            createdAt: new Date().toISOString(),
            role: 'student',
            inventory: preset ? testInventory : [],
            isBotAccount: preset ? true : false,
            botStatus: preset ? 'available' : 'disabled',
            personalization: {
              avatarFrame: 'default',
              activeTitle: 'apprentice',
              unlockedFrames: ['default'],
              unlockedTitles: ['apprentice'],
              customCursor: 'default',
              soundEnabled: true,
              theme: 'light',
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
              elo: preset ? preset.elo : 0,
              level: preset ? preset.level : 1
            },
            stats: {
              level: preset ? preset.level : 1,
              exp: 0,
              nextLevelExp: 1000,
              elo: preset ? preset.elo : 0,
              wins: preset ? preset.wins : 0,
              losses: preset ? preset.losses : 0,
              subjectStrengths: preset?.subjectStrengths || { math: 50, physics: 50, chemistry: 50, biology: 50 }
            }
          };
          
          // Ghi dữ liệu an toàn thông qua Safe Call
          await safeFirestoreCall(() => setDoc(userDocRef, initialData));
          
          setUser({
            uid: user.uid,
            email: user.email,
            displayName: displayNameToUse,
          });

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
            level: preset ? preset.level : 1,
            exp: 0,
            nextLevelExp: 1000,
            elo: preset ? preset.elo : 0,
            wins: preset ? preset.wins : 0,
            losses: preset ? preset.losses : 0,
            subjectStrengths: preset?.subjectStrengths || { math: 50, physics: 50, chemistry: 50, biology: 50 }
          });
        }
        // Cập nhật trạng thái hoạt động ngay sau khi tải xong thông tin người dùng
        try {
          if (auth.currentUser) {
            const updateLastActiveFn = httpsCallable(functions, 'updateLastActive');
            await updateLastActiveFn();
          }
        } catch (err) {
          console.warn("⚠️ Không thể cập nhật trạng thái hoạt động ban đầu:", err);
        }
      } catch (err) {
        console.warn("❌ Lỗi khi tải dữ liệu người dùng từ Firestore:", err.message || err);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (presenceInterval) {
        clearInterval(presenceInterval);
        presenceInterval = null;
      }
      if (user) {
        try {
          const token = await user.getIdToken();
          document.cookie = `session=${token}; path=/; max-age=604800; SameSite=Lax`;
        } catch (_) {}

        await loadUserProfile(user);

        // Thiết lập heartbeat cập nhật trạng thái hoạt động mỗi 15 giây khi tab đang mở
        presenceInterval = setInterval(async () => {
          if (document.visibilityState !== 'visible' || !auth.currentUser) return;
          try {
            const updateLastActiveFn = httpsCallable(functions, 'updateLastActive');
            await updateLastActiveFn();
          } catch (e) {
            // Bỏ qua lỗi mạng
          }
        }, 15000);
      } else {
        document.cookie = `session=; path=/; max-age=0; SameSite=Lax`;
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

    const handle2FAVerified = () => {
      if (auth.currentUser) {
        loadUserProfile(auth.currentUser);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('face2fa-verified', handle2FAVerified);
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('face2fa-verified', handle2FAVerified);
      }
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
    
    // Play initial sound click
    playSound.click();
    
    try {
      // Target body to capture the entire viewport as seen on screen
      const captureTarget = document.body;
      
      // Hide screenshot-hide class elements (like custom cursor and the camera FAB itself)
      const elementsToHide = document.querySelectorAll('.screenshot-hide');
      elementsToHide.forEach((el) => {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      });
      
      // Let it layout briefly
      await new Promise((resolve) => setTimeout(resolve, 50));
      
      const scrollX = window.scrollX || 0;
      const scrollY = window.scrollY || 0;
      
      const canvas = await html2canvas(captureTarget, {
        useCORS: true,
        backgroundColor: '#1c1e29',
        scale: 1.0,
        logging: false,
        width: window.innerWidth,
        height: window.innerHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        scrollX: scrollX,
        scrollY: scrollY,
        onclone: (clonedDoc) => {
          clonedDoc.documentElement.className = document.documentElement.className;
          clonedDoc.body.className = document.body.className;

          // Force the width to match the desktop size to trigger desktop responsive styles (lg:)
          clonedDoc.documentElement.style.width = `${window.innerWidth}px`;
          clonedDoc.documentElement.style.minWidth = `${window.innerWidth}px`;
          clonedDoc.body.style.width = `${window.innerWidth}px`;
          clonedDoc.body.style.minWidth = `${window.innerWidth}px`;

          // 1. Hide all elements marked with screenshot-hide using display: none
          const clonedHides = clonedDoc.querySelectorAll('.screenshot-hide');
          clonedHides.forEach((el) => {
            el.style.display = 'none';
          });

          // Remove max-width constraints to let content span fully
          const maxWScreens = clonedDoc.querySelectorAll('.screenshot-max-w');
          maxWScreens.forEach((el) => {
            el.classList.remove('max-w-5xl');
            el.classList.add('max-w-none', 'w-full');
          });

          // Expand specific grid column (Middle Column) to cover space left by hidden Clock Column
          const expandCols = clonedDoc.querySelectorAll('.screenshot-expand-col');
          expandCols.forEach((el) => {
            el.classList.remove('lg:col-span-2');
            el.classList.add('lg:col-span-3');
          });

          // 2. Remove margin-left from the main layout wrapper to shift it to full width
          const mainWrapper = clonedDoc.querySelector('main')?.parentElement;
          if (mainWrapper) {
            mainWrapper.classList.remove('ml-[260px]');
            mainWrapper.classList.add('ml-0');
            mainWrapper.style.paddingTop = '0';
          }

          // 3. Make left columns span 12 grid units instead of 8 to occupy full width
          const fullWidths = clonedDoc.querySelectorAll('.screenshot-full-width');
          fullWidths.forEach((el) => {
            el.classList.remove('lg:col-span-8');
            el.classList.add('lg:col-span-12');
          });
        }
      });
      
      // Show hidden elements back
      elementsToHide.forEach((el) => {
        el.style.opacity = '';
        el.style.pointerEvents = '';
      });

      // Play camera shutter and trigger flash overlay AFTER capturing is completed successfully
      playSound.shutter();
      setShowFlash(true);
      setTimeout(() => {
        setShowFlash(false);
      }, 150);
      
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        
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
        
        const isSaved = await savePendingShare(pendingShare);
        if (isSaved) {
          playSound.success();
          router.push('/story');
        } else {
          alert('⚠️ Ảnh chụp màn hình quá lớn hoặc bộ nhớ trình duyệt bị giới hạn, không thể chia sẻ câu chuyện lúc này. Vui lòng thử lại!');
        }
      } catch (err) {
        console.error("Lỗi chụp màn hình:", err);
      } finally {
        setIsCapturing(false);
      }
  };

  const isAdminRoute = pathname?.startsWith('/admin');
  const isHome = pathname === '/';
  const isLabRoute = pathname?.startsWith('/phong-lab');
  const isPlaying = arenaState.status === 'playing' || arenaState.status === 'matching' || !!activeLab || isAdminRoute || isLabRoute;
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
            STEM Hub v2.6.0
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex min-h-screen bg-bg-primary text-text-primary transition-colors duration-300 relative overflow-x-clip"
    >
      {isAnimatedBg && bgImage === 'animated-matrix' && (
        <MatrixRainBackground />
      )}

      {/* Lớp phủ làm dịu nền, giữ tương phản và độ mượt cho text */}
      {isAnimatedBg && (
        <div className="absolute inset-0 bg-white/5 dark:bg-black/25 backdrop-blur-[0.5px] pointer-events-none z-[1]" />
      )}

      {bgImage && !isAnimatedBg && (
        <div className="absolute inset-0 bg-white/75 dark:bg-[#1c1e29]/80 backdrop-blur-[2px] pointer-events-none z-0" />
      )}
      <CustomCursor />
      <EmailLinkAuthHandler />
      {!isPlaying && (
        <div className="screenshot-hide">
          <Sidebar />
          {/* Mobile backdrop overlay when Sidebar is open */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                key="sidebar-mobile-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={toggleSidebar}
                className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 lg:hidden"
              />
            )}
          </AnimatePresence>
        </div>
      )}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out relative z-10 ${isPlaying ? 'ml-0' : isSidebarOpen ? 'ml-0 lg:ml-[260px]' : 'ml-0'}`}>
        {!isPlaying && (
          <div className="screenshot-hide">
            <Header />
          </div>
        )}
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
        <main className={`flex-1 overflow-x-clip relative z-10 ${isLabRoute ? 'h-screen overflow-hidden p-0 m-0' : ''}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={isLabRoute ? false : { opacity: 0, y: 14, scale: 0.992 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={isLabRoute ? false : { opacity: 0, y: -10, scale: 0.995 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Floating Screenshot Shutter FAB (Game-like Camera tool) */}
      {showFloatingShutter && (
        <div className={`fixed screenshot-hide group select-none transition-all duration-300 ${pathname === '/ho-so' ? 'bottom-6 right-28 z-[40]' : pathname === '/xep-hang' ? 'bottom-22 right-6 z-[999]' : 'bottom-6 right-6 z-[999]'}`}>
          {/* Neon Floating Tooltip */}
          <div className="absolute bottom-16 right-0 w-max invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none bg-bg-secondary/95 border border-border-theme backdrop-blur-md px-3.5 py-2 rounded-2xl text-[10px] font-black text-accent-pink tracking-wider shadow-lg select-none flex items-center gap-1.5 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-warning animate-pulse" /> Chụp & Đăng Story 📸
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
            key="screen-shutter-flash-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[999999] bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Global Fullscreen Interactive Virtual Lab Sandbox Portal */}
      {activeLab && activeLab.link && !pathname?.match(/^\/phong-lab\/(toan|ly|hoa|sinh|math|phys|chem|bio)/) && (
        <div className="fixed inset-0 z-[99990] bg-[#0c0d14] flex flex-col">
          <div className="flex-1 flex relative overflow-hidden bg-[#0c0d14]">
            <iframe 
              src={activeLab.launchUrl || activeLab.link} 
              className="w-full h-full border-none"
              title={activeLab.name || activeLab.title}
              allow="accelerometer; autoplay; camera; microphone; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
            
            {/* Nút quay lại Hub góc dưới bên trái */}
            <div className="absolute bottom-6 left-6 z-[99995] flex items-center gap-2.5 screenshot-hide">
              <button 
                onClick={() => {
                  playSound.click?.();
                  setActiveLab(null);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 border border-rose-500/30 text-white rounded-2xl transition-all active:scale-95 flex items-center gap-1.5 shadow-lg shadow-rose-600/30 backdrop-blur-md group cursor-pointer font-sans"
              >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                <span className="text-[11px] font-black uppercase tracking-wider">Về Hub</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Draggable Cyber Music HUD */}
      <CyberMusicPlayer />

      {/* Global AI Commander Assistant HUD */}
      <GlobalAIAssistant />

      {/* Hidden Admin-only Real-time AI Log Terminal (Alt+U) */}
      <AdminAILogHUD />
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
