'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { usePvPStore, clearPvPSession } from '@/store/usePvPStore';
import { playSound } from '@/lib/sound';
import { db, auth, functions, httpsCallable } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot, getDoc, collection, query, where, getDocs, arrayUnion } from 'firebase/firestore';
import { 
  Swords, Timer, Activity, Zap, RotateCcw, 
  Compass, Cpu, Flame, Trophy, Beaker, CheckCircle2, AlertTriangle, Sparkles, Orbit,
  ArrowRight, Clock, User, Send, Gem, ShieldCheck, Ban, UserX, Layers, Snowflake, CloudFog, Bot,
  ShoppingBag, X, Plus, ShoppingCart, Store, ShieldAlert, Hand
} from 'lucide-react';
import { EQUIPMENT_CATALOG, getEquipmentById } from '@/data/equipmentCatalog';
import { REAL_TEST_BOT_ACCOUNTS } from '@/data/testAccounts';
import CrystalIcon from '@/components/atoms/CrystalIcon';
import { 
  joinMatchmakingQueue, 
  leaveMatchmakingQueue, 
  getRankInfo,
  checkForRoomMerge,
  requestBotOpponent
} from '@/lib/matchmaker';
import { clientFunctions } from '@/lib/clientFunctions';
import { 
  BIO_BANKS, 
  CHEMISTRY_MISSIONS, 
  getMathQuestionPool,
  getPhysicsTargetPool,
  generateBioPool, 
  generateMathPool, 
  generatePhysicsPool, 
  generateChemistryPool,
  generateMathMatchPool,
  generatePhysicsMatchPool,
  generateBiologyMatchPool,
  generateChemistryMatchPool
} from '@/lib/arenaGenerator';
import { AvatarFrame } from '@/components/atoms/AvatarFrame';
import STEMAvatarSVG from '@/components/atoms/STEMAvatarSVG';
import dynamic from 'next/dynamic';
import { savePendingShare } from '@/lib/indexedDB';

const ArenaBackground = dynamic(() => import('@/components/organisms/ArenaBackground'), { ssr: false });

import { formatMathText, formatBioText } from '@/lib/mathFormatter';
import { getTitleLabel } from '@/lib/titles';

const formatMatchTimer = (sec) => {
  const totalSec = Math.max(0, parseInt(sec, 10) || 0);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// --- CÁC HÀM TRỘN VÀ QUẢN LÝ LỊCH SỬ CÂU HỎI ---
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const getSessionHistory = (key) => {
  if (typeof window === 'undefined') return [];
  try {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveSessionHistory = (key, history) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(history));
  } catch (e) {
    console.warn("Lỗi lưu sessionStorage:", e);
  }
};

const updateSessionHistory = (key, newItems, maxItems = 50) => {
  let history = getSessionHistory(key);
  history = [...newItems, ...history].slice(0, maxItems);
  saveSessionHistory(key, history);
};



const generateRandomBioDna = () => {
  const bases = ['A', 'T', 'G', 'C'];
  const dna = [];
  const count = 8; // 8 bases
  
  for (let i = 0; i < count; i++) {
    const base = bases[Math.floor(Math.random() * bases.length)];
    let correct = '';
    let color = '';
    
    if (base === 'A') {
      correct = 'T';
      color = 'text-amber-400 bg-amber-400/10 border-amber-500/30';
    } else if (base === 'T') {
      correct = 'A';
      color = 'text-rose-500 bg-rose-500/10 border-rose-500/30';
    } else if (base === 'G') {
      correct = 'C';
      color = 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30';
    } else {
      correct = 'G';
      color = 'text-cyan-400 bg-cyan-400/10 border-cyan-500/30';
    }
    
    dna.push({
      base: base,
      paired: '',
      correct: correct,
      color: color
    });
  }
  return dna;
};

const OPPONENTS = [
  { name: 'Trần Quốc Bảo', level: 3, elo: 1080, title: 'Bậc thầy Hóa học' },
  { name: 'Nguyễn Minh Thư', level: 4, elo: 1150, title: 'Chiến thần Toán học' },
  { name: 'Phạm Hải Đăng', level: 2, elo: 980, title: 'Kỹ sư Cơ học' },
  { name: 'Lê Hoàng Yến', level: 5, elo: 1210, title: 'Huyền thoại Sinh học' }
];



const selectMissionFromRoomId = (roomId) => {
  if (!roomId) return CHEMISTRY_MISSIONS[0];
  let sum = 0;
  for (let i = 0; i < roomId.length; i++) {
    sum += roomId.charCodeAt(i);
  }
  return CHEMISTRY_MISSIONS[sum % CHEMISTRY_MISSIONS.length];
};

const selectPhysicsTargetFromRoomId = (roomId) => {
  const pool = getPhysicsTargetPool();
  if (!roomId) return pool[0];
  let sum = 0;
  for (let i = 0; i < roomId.length; i++) {
    sum += roomId.charCodeAt(i);
  }
  return pool[sum % pool.length];
};

const selectBioGameFromRoomId = (roomId) => {
  const pool = [];
  Object.values(BIO_BANKS).forEach(bank => {
    bank.questions.forEach(q => {
      pool.push({
        text: q.text,
        choices: q.choices,
        correct: q.correct,
        note: q.note || ''
      });
    });
  });

  try {
    if (typeof EXAM_DATABASE !== 'undefined' && Array.isArray(EXAM_DATABASE)) {
      EXAM_DATABASE.forEach(exam => {
        if (exam.subject === 'biology' && Array.isArray(exam.questions)) {
          exam.questions.forEach(q => {
            if (q.type === 'mcq' && Array.isArray(q.options) && q.options.length >= 2) {
              pool.push({
                text: q.text,
                choices: q.options,
                correct: q.correctAnswer,
                note: q.explanation || ''
              });
            }
          });
        }
      });
    }
  } catch (e) {
    console.warn("Lỗi tải câu hỏi Sinh học từ EXAM_DATABASE:", e);
  }

  if (!roomId || pool.length === 0) {
    const fallbackPool = generateBioPool([], 5);
    return {
      type: 'general',
      label: 'Sinh học Tổng hợp',
      icon: '🧬',
      questions: fallbackPool,
      currentQ: 0,
      score: 0,
      mistakes: 0,
      answered: []
    };
  }

  let hash = 0;
  for (let i = 0; i < roomId.length; i++) {
    hash = roomId.charCodeAt(i) + ((hash << 5) - hash);
  }

  const shuffledPool = [...pool];
  for (let i = shuffledPool.length - 1; i > 0; i--) {
    const j = Math.abs((hash + i) % (i + 1));
    const temp = shuffledPool[i];
    shuffledPool[i] = shuffledPool[j];
    shuffledPool[j] = temp;
  }

  const selectedQuestions = shuffledPool.slice(0, 5);

  return {
    type: 'general',
    label: 'Sinh học Tổng hợp',
    icon: '🧬',
    questions: selectedQuestions,
    currentQ: 0,
    score: 0,
    mistakes: 0,
    answered: []
  };
};

const selectMathAsteroidsFromRoomId = (roomId) => {
  const pool = getMathQuestionPool();
  if (!roomId || pool.length === 0) {
    const fallbackPool = generateMathPool([], 3);
    return fallbackPool.map((q, i) => ({
      eq: q.eq,
      ans: q.ans,
      status: i === 0 ? 'active' : 'pending',
      coord: q.coord
    }));
  }
  
  let hash = 0;
  for (let i = 0; i < roomId.length; i++) {
    hash = roomId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const shuffledPool = [...pool];
  for (let i = shuffledPool.length - 1; i > 0; i--) {
    const j = Math.abs((hash + i) % (i + 1));
    const temp = shuffledPool[i];
    shuffledPool[i] = shuffledPool[j];
    shuffledPool[j] = temp;
  }
  
  const selected = shuffledPool.slice(0, 3);
  return selected.map((q, i) => ({
    eq: q.eq,
    ans: q.ans,
    status: i === 0 ? 'active' : 'pending',
    coord: q.coord
  }));
};

const generateChemistryMission = () => {
  return CHEMISTRY_MISSIONS[0];
};

const generatePhysicsTarget = () => {
  return [45, 90, 135];
};

const generateRandomMathAsteroids = () => {
  const pool = getMathQuestionPool();
  return pool.slice(0, 3).map((q, idx) => ({
    eq: q.eq,
    ans: q.ans,
    status: idx === 0 ? 'active' : 'pending',
    coord: q.coord
  }));
};

const generateBioGame = () => {
  return {
    type: 'general',
    label: 'Sinh học Tổng hợp',
    icon: '🧬',
    questions: [
      { text: 'Quy luật phân ly độc lập của Mendel áp dụng khi?', choices: ['Các gen nằm trên NST khác nhau','Các gen liên kết cùng NST','Chỉ khi gen trội trội hoàn toàn','Gen trên NST giới tính'], correct: 0, note: 'Mendelian independent assortment: các gen nằm trên cặp NST tương đồng khác nhau' }
    ],
    currentQ: 0,
    score: 0,
    mistakes: 0,
    answered: []
  };
};

// MODAL CỬA HÀNG TRANG BỊ MINI CHO ĐẤU TRƯỜNG 1V1
const MiniEquipmentShopModal = ({
  isOpen,
  onClose,
  user,
  personalization,
  setPersonalization,
  onInventoryUpdate
}) => {
  const [mounted, setMounted] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [purchasingId, setPurchasingId] = useState(null);
  const [userInventory, setUserInventory] = useState([]);
  const [notice, setNotice] = useState({ type: '', msg: '' });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user || !isOpen) return;
    const userDocRef = doc(db, 'users', user.uid);
    getDoc(userDocRef).then((snap) => {
      let inv = [];
      let isAdminUser = false;
      if (snap.exists()) {
        const data = snap.data();
        inv = data.inventory || [];
        if (data.role === 'admin' || user?.role === 'admin' || user?.email?.includes('admin') || user?.displayName?.toLowerCase().includes('admin')) {
          isAdminUser = true;
        }
      } else if (user?.role === 'admin' || user?.email?.includes('admin') || user?.displayName?.toLowerCase().includes('admin')) {
        isAdminUser = true;
      }

      if (isAdminUser) {
        inv = EQUIPMENT_CATALOG.map(card => ({ cardId: card.id, quantity: 99 }));
      }
      setUserInventory(inv);
    }).catch(err => console.warn("Lỗi tải kho đồ:", err));
  }, [user, isOpen, personalization]);

  if (!isOpen || !mounted) return null;

  const handleBuyCard = async (cardId, qty = 1) => {
    if (!user) {
      setNotice({ type: 'error', msg: 'Vui lòng đăng nhập để mua trang bị!' });
      return;
    }

    const cardDef = getEquipmentById(cardId);
    if (!cardDef) return;

    const totalPrice = cardDef.crystalPrice * qty;
    const currentCrystals = personalization?.crystals !== undefined ? personalization.crystals : 500;

    if (currentCrystals < totalPrice) {
      playSound.click();
      setNotice({ type: 'error', msg: `Không đủ Pha Lê! Cần ${totalPrice.toLocaleString()} 💎 nhưng bạn chỉ có ${currentCrystals.toLocaleString()} 💎.` });
      setTimeout(() => setNotice({ type: '', msg: '' }), 4000);
      return;
    }

    setPurchasingId(cardId);
    playSound.click();

    try {
      const processTransaction = httpsCallable(functions, 'processCrystalTransaction');
      const res = await processTransaction({
        actionType: 'PURCHASE_EQUIPMENT_CARD',
        payload: { cardId, count: qty }
      });

      if (res.data && res.data.success) {
        playSound.success();
        const newCrystals = res.data.newCrystals;
        const newInventory = res.data.inventory || [];
        
        setPersonalization({ crystals: newCrystals });
        setUserInventory(newInventory);
        if (onInventoryUpdate) onInventoryUpdate(newInventory);

        setNotice({ 
          type: 'success', 
          msg: `🎉 Mua thành công ${qty}x ${cardDef.name}! (-${totalPrice.toLocaleString()} Pha Lê)` 
        });
      } else {
        throw new Error('Giao dịch thất bại.');
      }
    } catch (err) {
      console.warn("Lỗi giao dịch Cloud Function, đang dùng fallback client transaction:", err);
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const uData = snap.data();
          const pCrystals = uData.personalization?.crystals !== undefined ? uData.personalization.crystals : 500;
          if (pCrystals < totalPrice) {
            throw new Error(`Không đủ Pha Lê (${pCrystals}/${totalPrice})`);
          }
          const curInv = uData.inventory || [];
          const idx = curInv.findIndex(i => i.cardId === cardId);
          let newInv = [...curInv];
          if (idx !== -1) {
            newInv[idx] = { ...newInv[idx], quantity: (newInv[idx].quantity || 0) + qty };
          } else {
            newInv.push({ cardId, quantity: qty });
          }
          const nextCrystals = pCrystals - totalPrice;
          await updateDoc(userRef, {
            'personalization.crystals': nextCrystals,
            inventory: newInv
          });
          playSound.success();
          setPersonalization({ crystals: nextCrystals });
          setUserInventory(newInv);
          if (onInventoryUpdate) onInventoryUpdate(newInv);
          setNotice({ 
            type: 'success', 
            msg: `🎉 Mua thành công ${qty}x ${cardDef.name}! (-${totalPrice.toLocaleString()} Pha Lê)` 
          });
        }
      } catch (fbErr) {
        playSound.click();
        setNotice({ type: 'error', msg: fbErr.message || 'Lỗi hệ thống khi mua thẻ bài!' });
      }
    } finally {
      setPurchasingId(null);
      setTimeout(() => setNotice({ type: '', msg: '' }), 4000);
    }
  };

  const filteredCards = EQUIPMENT_CATALOG.filter(card => {
    if (selectedTab === 'all') return true;
    return card.type === selectedTab;
  });

  const getItemQty = (cId) => {
    const found = userInventory.find(i => i.cardId === cId);
    return found ? found.quantity : 0;
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-hidden">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-bg-secondary border border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-500/20 overflow-hidden flex flex-col my-auto">
        {/* Header Shop */}
        <div className="p-6 border-b border-border-theme flex items-center justify-between bg-bg-tertiary shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-lg shadow-amber-500/20">
              <Store className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-text-primary uppercase tracking-wider font-mono">
                  CỬA HÀNG TRANG BỊ SCI-FI
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold">
                  HIGH TIER
                </span>
              </div>
              <p className="text-xs text-text-secondary">Sở hữu thẻ bài chiến thuật cao cấp để áp đảo đối thủ trên Đấu trường</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Số dư Pha Lê */}
            <div className="flex items-center gap-2 bg-bg-secondary px-4 py-2 rounded-2xl border border-amber-500/40 shadow-inner">
              <CrystalIcon className="w-6 h-6" />
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold leading-none uppercase">Pha Lê Hiện Có</span>
                <span className="text-base font-extrabold font-mono text-amber-600 dark:text-amber-300 leading-tight">
                  {(personalization?.crystals !== undefined ? personalization.crystals : 500).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-bg-secondary border border-border-theme hover:bg-rose-500/20 hover:border-rose-500/40 text-text-secondary hover:text-rose-400 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thông báo mua hàng */}
        {notice.msg && (
          <div className={`px-6 py-3 text-xs font-bold font-mono flex items-center justify-between transition-all shrink-0 ${
            notice.type === 'success' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-b border-emerald-500/30' : 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-b border-rose-500/30'
          }`}>
            <span>{notice.msg}</span>
            <button onClick={() => setNotice({ type: '', msg: '' })} className="underline text-[10px] cursor-pointer">Đóng</button>
          </div>
        )}

        {/* Dynamic Category Tabs */}
        <div className="px-6 py-3 border-b border-border-theme bg-bg-tertiary flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
              selectedTab === 'all'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-bg-secondary text-text-secondary hover:text-text-primary border border-border-theme'
            }`}
          >
            Tất cả Thẻ Bài ({EQUIPMENT_CATALOG.length})
          </button>
          <button
            onClick={() => setSelectedTab('pre_match')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
              selectedTab === 'pre_match'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-bg-secondary text-text-secondary hover:text-text-primary border border-border-theme'
            }`}
          >
            🛡️ Trước Trận Đấu
          </button>
          <button
            onClick={() => setSelectedTab('in_match')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
              selectedTab === 'in_match'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-bg-secondary text-text-secondary hover:text-text-primary border border-border-theme'
            }`}
          >
            ⚡ Trong Trận Thi Đấu
          </button>
        </div>

        {/* Card Grid Container */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 custom-scrollbar">
          {filteredCards.map((card) => {
            const qtyOwned = getItemQty(card.id);
            const isBuying = purchasingId === card.id;

            return (
              <div 
                key={card.id}
                className={`relative bg-bg-tertiary rounded-2xl border ${card.borderColor || 'border-amber-500/30'} p-4 flex flex-col justify-between transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/10 group`}
              >
                <div>
                  {/* Top Badge: Type & Quantity */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono bg-gradient-to-r ${card.color} text-white shadow-md`}>
                      {card.type === 'pre_match' ? 'Trước Trận' : 'Chiêu Trong Trận'}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-bg-secondary border border-border-theme text-[11px] font-bold font-mono text-cyan-600 dark:text-cyan-300">
                      Sở hữu: <strong className="text-amber-600 dark:text-amber-400 font-extrabold">{qtyOwned}</strong>
                    </span>
                  </div>

                  {/* Card Name */}
                  <h3 className="text-base font-bold text-text-primary mb-1 flex items-center gap-2">
                    {card.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-text-secondary leading-relaxed mb-4 min-h-[36px]">
                    {card.description}
                  </p>
                </div>

                {/* Bottom Action Section */}
                <div className="pt-3 border-t border-border-theme flex items-center justify-between gap-2">
                  {/* Price Tag */}
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-mono font-bold text-sm">
                    <CrystalIcon className="w-4.5 h-4.5" />
                    <span>{card.crystalPrice.toLocaleString()}</span>
                  </div>

                  {/* Buy Buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* +1 Button */}
                    <button
                      disabled={isBuying}
                      onClick={() => handleBuyCard(card.id, 1)}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-extrabold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                    >
                      {isBuying ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                      <span>Mua 1x</span>
                    </button>

                    {/* +5 Combo Button */}
                    <button
                      disabled={isBuying}
                      onClick={() => handleBuyCard(card.id, 5)}
                      className="px-2.5 py-2 rounded-xl bg-bg-secondary border border-amber-500/40 hover:border-amber-500 text-amber-600 dark:text-amber-300 font-bold text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      title="Mua nhanh 5 thẻ"
                    >
                      +5x
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-bg-tertiary border-t border-border-theme flex items-center justify-between text-[11px] text-text-secondary font-mono shrink-0">
          <span>💡 Thẻ bài đã mua sẽ tự động lưu vào Kho đồ và sẵn sàng chọn ở màn hình 30s trước trận.</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-bg-secondary hover:bg-border-theme border border-border-theme text-text-primary font-bold cursor-pointer"
          >
            Đóng Cửa Hàng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Hàm helper trừ thẻ bài trong Kho đồ người dùng sau khi sử dụng
const deductUsedCardsFromInventory = async (uid, cardIds) => {
  if (!uid || !cardIds || cardIds.length === 0) return;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const data = snap.data();
    let inventory = [...(data.inventory || [])];

    cardIds.forEach(cId => {
      if (!cId) return;
      const idx = inventory.findIndex(item => item.cardId === cId);
      if (idx !== -1) {
        const newQty = (inventory[idx].quantity || 1) - 1;
        if (newQty > 0) {
          inventory[idx] = { ...inventory[idx], quantity: newQty };
        } else {
          inventory.splice(idx, 1);
        }
      }
    });

    await updateDoc(userRef, { inventory });
    console.log("🎒 Đã trừ các thẻ bài đã sử dụng khỏi Kho đồ:", cardIds);
  } catch (err) {
    console.warn("Lỗi khi trừ kho đồ:", err);
  }
};

// Component màn hình chọn trang bị / thẻ bài 30 giây trước trận (CHỈ DÀNH CHO THẺ CHIÊU TRONG TRẬN)
const EquipmentSelectionView = ({
  user,
  activeRoomId,
  isPlayer1Role,
  roomData,
  preMatchCardId = null,
  onConfirmed
}) => {
  const [selectedCards, setSelectedCards] = useState([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [inventory, setInventory] = useState([]);
  const [maxSlots, setMaxSlots] = useState(3);
  const [mounted, setMounted] = useState(false);
  const autoConfirmTriggeredRef = useRef(false);
  const viewMountedTimeRef = useRef(Date.now());

  useEffect(() => {
    setMounted(true);
    viewMountedTimeRef.current = Date.now();
    autoConfirmTriggeredRef.current = false;
  }, []);

  // Khởi tạo kho đồ học sinh
  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    getDoc(userDocRef).then((snap) => {
      let inv = [];
      let pendingExtra = false;
      let isAdminUser = false;

      if (snap.exists()) {
        const data = snap.data();
        inv = data.inventory || [];
        pendingExtra = data.pendingExtraSlot || false;
        if (data.role === 'admin' || user?.role === 'admin' || user?.email?.includes('admin') || user?.displayName?.toLowerCase().includes('admin')) {
          isAdminUser = true;
        }
      } else if (user?.role === 'admin' || user?.email?.includes('admin') || user?.displayName?.toLowerCase().includes('admin')) {
        isAdminUser = true;
      }
      
      // ADMIN: Được dùng miễn phí TẤT CẢ 10 thẻ bài
      if (isAdminUser) {
        inv = EQUIPMENT_CATALOG.map(card => ({ cardId: card.id, quantity: 99 }));
      }

      setInventory(inv);
      if (pendingExtra) {
        setMaxSlots(4);
      }
    }).catch(err => console.warn("Lỗi tải kho đồ:", err));
  }, [user]);

  // Bộ đếm ngược 30 giây (Đảm bảo người chơi luôn có đủ 30s chọn thẻ khi vào giai đoạn chuẩn bị)
  useEffect(() => {
    const expiresAt = viewMountedTimeRef.current + 30000;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0 && !isConfirmed && !autoConfirmTriggeredRef.current) {
        autoConfirmTriggeredRef.current = true;
        handleAutoPickAndConfirm();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isConfirmed]);

  // Logic bot tự chọn thẻ
  useEffect(() => {
    if (roomData?.isBotMatch && !roomData?.equipmentPhase?.p2Ready && activeRoomId) {
      const timer = setTimeout(async () => {
        try {
          const roomRef = doc(db, 'match_rooms', activeRoomId);
          const allInMatchCards = ['card_time_freeze', 'card_smoke_fog', 'card_progress_steal', 'card_magic_hand'];
          const botPicks = [...allInMatchCards].sort(() => 0.5 - Math.random()).slice(0, 3);
          await updateDoc(roomRef, {
            player2Equipment: botPicks,
            'equipmentPhase.p2Ready': true
          });
          console.log("🤖 Bot đã tự động chọn xong 3 Thẻ chiêu trong trận!");
        } catch (e) {
          console.warn("Lỗi bot chọn thẻ:", e);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [roomData, activeRoomId]);

  // Kiểm tra cả 2 sẵn sàng để hoàn thành phase chọn trang bị
  useEffect(() => {
    if (roomData?.equipmentPhase?.p1Ready && roomData?.equipmentPhase?.p2Ready && activeRoomId) {
      const roomRef = doc(db, 'match_rooms', activeRoomId);
      updateDoc(roomRef, {
        status: 'playing',
        'equipmentPhase.status': 'completed'
      }).then(() => {
        if (onConfirmed) onConfirmed();
      }).catch(err => console.warn("Lỗi chuyển trạng thái phòng:", err));
    }
  }, [roomData?.equipmentPhase?.p1Ready, roomData?.equipmentPhase?.p2Ready, activeRoomId]);

  const toggleSelectCard = (cardId) => {
    if (isConfirmed) return;
    playSound.click();

    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter(id => id !== cardId));
    } else {
      if (selectedCards.length < maxSlots) {
        setSelectedCards([...selectedCards, cardId]);
      } else {
        playSound.hover();
      }
    }
  };

  // Chỉ lấy thẻ loại trong trận (type === 'in_match')
  const inMatchInventory = inventory.filter(item => {
    const card = getEquipmentById(item.cardId);
    return card && card.type === 'in_match' && item.quantity > 0;
  });

  const handleAutoPickAndConfirm = async () => {
    let picks = [...selectedCards];
    const availableCardIds = inMatchInventory.map(i => i.cardId);

    for (const cardId of availableCardIds) {
      if (picks.length >= maxSlots) break;
      if (!picks.includes(cardId)) {
        picks.push(cardId);
      }
    }

    setSelectedCards(picks);
    await confirmSelection(picks);
  };

  const confirmSelection = async (cardsToSave = selectedCards) => {
    if (!activeRoomId || !user || isPlayer1Role === null) return;
    playSound.success();
    setIsConfirmed(true);

    try {
      const roomRef = doc(db, 'match_rooms', activeRoomId);
      const isP1 = isPlayer1Role;

      // Danh sách thẻ chiêu trong trận (30s phase)
      const allEquippedCards = cardsToSave;

      const updates = {
        [isP1 ? 'player1Equipment' : 'player2Equipment']: allEquippedCards,
        [`equipmentPhase.${isP1 ? 'p1Ready' : 'p2Ready'}`]: true
      };
      await updateDoc(roomRef, updates);

      // Trừ số lượng thẻ chiêu trong trận khỏi Kho đồ KHI BẮT ĐẦU TRẬN ĐẤU
      const isAdminUser = user?.role === 'admin' || user?.email?.includes('admin') || user?.displayName?.toLowerCase().includes('admin');
      if (!isAdminUser && allEquippedCards && allEquippedCards.length > 0) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const curInv = userSnap.data().inventory || [];
          let updatedInv = [...curInv];

          allEquippedCards.forEach(cId => {
            const idx = updatedInv.findIndex(item => item.cardId === cId);
            if (idx !== -1) {
              const newQty = (updatedInv[idx].quantity || 1) - 1;
              if (newQty > 0) {
                updatedInv[idx] = { ...updatedInv[idx], quantity: newQty };
              } else {
                updatedInv.splice(idx, 1);
              }
            }
          });

          await updateDoc(userRef, {
            inventory: updatedInv,
            pendingExtraSlot: false
          });
        }
      } else {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, { pendingExtraSlot: false }).catch(() => {});
      }
    } catch (err) {
      console.error("Lỗi xác nhận trang bị:", err);
    }
  };

  const preMatchCardDef = preMatchCardId ? getEquipmentById(preMatchCardId) : null;

  const getCardVisuals = (cardId) => {
    switch (cardId) {
      case 'card_time_freeze':
        return { 
          border: 'border-cyan-500/60 hover:border-cyan-400', 
          bg: 'bg-cyan-950/40 hover:bg-cyan-900/40', 
          glow: 'shadow-[0_0_20px_rgba(6,182,212,0.25)]', 
          text: 'text-cyan-300', 
          icon: <Clock className="w-4 h-4 text-cyan-400 animate-spin-slow" />,
          tagBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' 
        };
      case 'card_smoke_fog':
        return { 
          border: 'border-purple-500/60 hover:border-purple-400', 
          bg: 'bg-purple-950/40 hover:bg-purple-900/40', 
          glow: 'shadow-[0_0_20px_rgba(168,85,247,0.25)]', 
          text: 'text-purple-300', 
          icon: <CloudFog className="w-4 h-4 text-purple-400" />,
          tagBg: 'bg-purple-500/15 border-purple-500/30 text-purple-300' 
        };
      case 'card_progress_steal':
        return { 
          border: 'border-rose-500/60 hover:border-rose-400', 
          bg: 'bg-rose-950/40 hover:bg-rose-900/40', 
          glow: 'shadow-[0_0_20px_rgba(244,63,94,0.25)]', 
          text: 'text-rose-300', 
          icon: <Swords className="w-4 h-4 text-rose-400" />,
          tagBg: 'bg-rose-500/15 border-rose-500/30 text-rose-300' 
        };
      case 'card_ai_assist':
        return { 
          border: 'border-amber-500/60 hover:border-amber-400', 
          bg: 'bg-amber-950/40 hover:bg-amber-900/40', 
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]', 
          text: 'text-amber-300', 
          icon: <Bot className="w-4 h-4 text-amber-400" />,
          tagBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300' 
        };
      case 'card_dispel':
        return { 
          border: 'border-emerald-500/60 hover:border-emerald-400', 
          bg: 'bg-emerald-950/40 hover:bg-emerald-900/40', 
          glow: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]', 
          text: 'text-emerald-300', 
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
          tagBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
        };
      case 'card_counter':
        return { 
          border: 'border-orange-500/60 hover:border-orange-400', 
          bg: 'bg-orange-950/40 hover:bg-orange-900/40', 
          glow: 'shadow-[0_0_20px_rgba(249,115,22,0.25)]', 
          text: 'text-orange-300', 
          icon: <ShieldAlert className="w-4 h-4 text-orange-400 animate-pulse" />,
          tagBg: 'bg-orange-500/15 border-orange-500/30 text-orange-300' 
        };
      case 'card_magic_hand':
        return { 
          border: 'border-fuchsia-500/60 hover:border-fuchsia-400', 
          bg: 'bg-fuchsia-950/40 hover:bg-fuchsia-900/40', 
          glow: 'shadow-[0_0_20px_rgba(217,70,239,0.25)]', 
          text: 'text-fuchsia-300', 
          icon: <Hand className="w-4 h-4 text-fuchsia-400" />,
          tagBg: 'bg-fuchsia-500/15 border-fuchsia-500/30 text-fuchsia-300' 
        };
      default:
        return { 
          border: 'border-cyan-500/60 hover:border-cyan-400', 
          bg: 'bg-cyan-950/40 hover:bg-cyan-900/40', 
          glow: 'shadow-[0_0_20px_rgba(6,182,212,0.25)]', 
          text: 'text-cyan-300', 
          icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
          tagBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' 
        };
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999999] bg-bg-primary/95 backdrop-blur-3xl flex flex-col items-center justify-center p-4 md:p-6 select-none animate-fadeIn font-sans text-text-primary overflow-y-auto">
      <div className="max-w-3xl w-full bg-bg-secondary border border-accent-cyan/40 rounded-3xl p-5 md:p-7 shadow-[0_0_80px_rgba(6,182,212,0.15)] relative overflow-hidden">
        {/* Futuristic Background Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Cyber Header bar */}
        <div className="flex items-center justify-between border-b border-border-theme pb-4 mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/15 border border-cyan-500/30 rounded-2xl text-cyan-400">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-[10px] uppercase tracking-widest">
                <span>GIAI ĐOẠN CHUẨN BỊ CHIẾN THUẬT 1V1</span>
              </div>
              <h2 className="text-lg font-black text-text-primary uppercase tracking-wider font-mono">
                TRANG BỊ CHIÊU THỨC TRONG TRẬN
              </h2>
            </div>
          </div>

          {/* Sci-Fi Countdown Badge */}
          <div className="flex items-center gap-3 bg-bg-tertiary border border-accent-cyan/30 px-4 py-2 rounded-2xl">
            <Clock className="w-5 h-5 text-cyan-400 animate-spin-slow" />
            <div className="text-right font-mono">
              <div className="text-[9px] text-zinc-400 uppercase tracking-wider">THỜI GIAN CÒN</div>
              <div className={`text-xl font-black ${timeLeft <= 5 ? 'text-rose-400 animate-ping' : 'text-cyan-300'}`}>
                {timeLeft}s
              </div>
            </div>
          </div>
        </div>

        {/* Pre-Match Equipped Card Notice (If active) */}
        {preMatchCardDef && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-mono relative z-10">
            <div className="flex items-center gap-2 text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span>⚡ THẺ NỘI TẠI TRƯỚC TRẬN ĐÃ KÍCH HOẠT: <strong className="text-amber-400 font-black">{preMatchCardDef.name}</strong></span>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 uppercase font-bold shrink-0">Kích hoạt sẵn</span>
          </div>
        )}

        {/* SLOTS TRANG BỊ ĐÃ CHỌN (Compact 3 horizontal slots) */}
        <div className="mb-5 bg-[#0d0f1a] p-4 rounded-2xl border border-[#232840] relative z-10">
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> DECK KỸ NĂNG ({selectedCards.length}/{maxSlots})
            </span>
            {selectedCards.length > 0 && !isConfirmed && (
              <button 
                onClick={() => setSelectedCards([])}
                className="text-rose-400 hover:text-rose-300 text-[11px] font-mono cursor-pointer transition-colors"
              >
                [Xóa tất cả]
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: maxSlots }).map((_, index) => {
              const cardId = selectedCards[index];
              const cardInfo = cardId ? getEquipmentById(cardId) : null;
              const cardVis = cardId ? getCardVisuals(cardId) : null;

              return (
                <div 
                  key={index}
                  onClick={() => cardId && toggleSelectCard(cardId)}
                  className={`h-20 rounded-2xl border flex items-center p-3 transition-all relative cursor-pointer ${
                    cardInfo && cardVis
                      ? `${cardVis.border} ${cardVis.bg} ${cardVis.glow}` 
                      : 'border-dashed border-[#2b314d] bg-[#141728]/50 hover:border-cyan-500/40 text-zinc-500'
                  }`}
                >
                  {cardInfo && cardVis ? (
                    <div className="flex items-center gap-3 w-full">
                      <div className={`p-2 rounded-xl border shrink-0 ${cardVis.tagBg}`}>
                        {cardVis.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className={`text-xs font-black block truncate ${cardVis.text}`}>{cardInfo.name}</span>
                        <span className="text-[9px] text-zinc-400 line-clamp-1 mt-0.5">{cardInfo.description}</span>
                      </div>
                      <span className="text-rose-400 text-xs font-black hover:scale-125 transition-transform">✕</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 w-full text-zinc-500">
                      <Sparkles className="w-4 h-4 opacity-40 text-cyan-400" />
                      <span className="text-[10px] font-mono tracking-wider font-bold">SLOT {index + 1} TRỐNG</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* KHO ĐỒ THẺ CHIÊU TRONG TRẬN */}
        <div className="mb-4 relative z-10">
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
            <span>KHO ĐỒ KỸ NĂNG KHẢ DỤNG ({inMatchInventory.length} THẺ):</span>
            <span className="text-[10px] text-cyan-400 font-mono">* Bấm vào thẻ để trang bị vào Deck</span>
          </div>

          {inMatchInventory.length === 0 ? (
            <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-between text-xs text-cyan-300 font-mono">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>Bạn chưa sở hữu thẻ Chiêu Trong Trận nào. Bạn vẫn có thể thi đấu bình thường.</span>
              </div>
              <button
                onClick={() => confirmSelection([])}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs shrink-0 cursor-pointer transition-all active:scale-95"
              >
                VÀO TRẬN ➔
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {inMatchInventory.map((item) => {
                const card = getEquipmentById(item.cardId);
                if (!card) return null;
                const isSelected = selectedCards.includes(item.cardId);
                const vis = getCardVisuals(item.cardId);

                return (
                  <div
                    key={item.cardId}
                    onClick={() => toggleSelectCard(item.cardId)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? `${vis.border} ${vis.bg} ${vis.glow} ring-1 ring-cyan-400` 
                        : 'border-[#262c45] bg-[#141728] hover:border-cyan-500/50 hover:bg-[#1a1f36]'
                    } ${isConfirmed ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-xl border ${vis.tagBg}`}>
                            {vis.icon}
                          </div>
                          <span className="font-extrabold text-xs text-white truncate max-w-[130px]">{card.name}</span>
                        </div>
                        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                          x{item.quantity}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-2">{card.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#232840] flex items-center justify-between">
                      <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">
                        CHIÊU TRONG TRẬN
                      </span>
                      <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-lg transition-all ${
                        isSelected 
                          ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30' 
                          : 'bg-[#1e233b] text-zinc-300 hover:text-white border border-[#2b314d]'
                      }`}>
                        {isSelected ? '✓ ĐÃ TRANG BỊ' : '+ TRANG BỊ'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Nút hành động */}
        <div className="pt-4 border-t border-[#232840] flex items-center justify-between gap-4 relative z-10">
          <button
            onClick={handleAutoPickAndConfirm}
            disabled={isConfirmed}
            className="px-4 py-2.5 rounded-xl border border-[#2b314d] bg-[#161a2e] text-xs font-mono font-bold text-zinc-300 hover:text-white hover:border-cyan-500/40 transition-all active:scale-95 disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
          >
            <Orbit className="w-4 h-4 text-cyan-400" /> TỰ ĐỘNG CHỌN
          </button>

          <button
            onClick={() => confirmSelection()}
            disabled={isConfirmed}
            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center gap-2 shadow-xl ${
              isConfirmed
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 animate-pulse'
                : 'bg-gradient-to-r from-cyan-500 via-pink-500 to-rose-500 hover:from-cyan-400 hover:via-pink-400 hover:to-rose-400 text-white shadow-pink-500/25 border border-white/10'
            }`}
          >
            {isConfirmed ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" /> ĐÃ XÁC NHẬN - ĐANG CHỜ ĐỐI THỦ...
              </>
            ) : (
              <>
                <Swords className="w-4 h-4" /> XÁC NHẬN SẴN SÀNG THI ĐẤU
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
};

function DauTruongContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rId = searchParams ? searchParams.get('roomId') : null;
  const sub = searchParams ? searchParams.get('subject') : null;
  const tParam = searchParams ? searchParams.get('t') : null;
  const user = useAppStore((state) => state.user);
  const personalization = useAppStore((state) => state.personalization);
  const setPersonalization = useAppStore((state) => state.setPersonalization);
  const arenaState = useAppStore((state) => state.arenaState);
  const startMatching = useAppStore((state) => state.startMatching);
  const cancelMatching = useAppStore((state) => state.cancelMatching);
  const setArenaStatus = useAppStore((state) => state.setArenaStatus);
  const setOpponentInfo = useAppStore((state) => state.setOpponentInfo);
  const updatePlayerProgress = useAppStore((state) => state.updatePlayerProgress);
  const updateOpponentProgress = useAppStore((state) => state.updateOpponentProgress);
  const addArenaLogStore = useAppStore((state) => state.addArenaLog);
  const setMatchResult = useAppStore((state) => state.setMatchResult);
  const tickArenaTime = useAppStore((state) => state.tickArenaTime);
  const startChallengeGame = useAppStore((state) => state.startChallengeGame);
  const setArenaTimeRemaining = useAppStore((state) => state.setArenaTimeRemaining);

  const [theoryTimeLimit, setTheoryTimeLimit] = useState(180);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [preMatchEquippedCard, setPreMatchEquippedCard] = useState(null);
  const [isPreMatchPickerOpen, setIsPreMatchPickerOpen] = useState(false);
  const [lobbyInventory, setLobbyInventory] = useState([]);
  const latestRoomDataRef = useRef(null);
  const botPlaybackInfoRef = useRef(null);
  const isFinalizingRef = useRef(false);
  const isCardActionPendingRef = useRef(false);
  const isBotEngineStartedRef = useRef(false);
  const [currentRoomData, setCurrentRoomData] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [cardAnnouncement, setCardAnnouncement] = useState(null);

  const showCardAnnouncement = (icon, title, desc, color = 'from-amber-500 to-yellow-600') => {
    setCardAnnouncement({ icon, title, desc, color, timestamp: Date.now() });
    setTimeout(() => {
      setCardAnnouncement(prev => (prev && Date.now() - prev.timestamp >= 3400 ? null : prev));
    }, 3500);
  };

  useEffect(() => {
    if (arenaState.status !== 'playing') return;
    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 500);
    return () => clearInterval(interval);
  }, [arenaState.status]);

  // Khởi tạo kho đồ học sinh ở sảnh Đấu trường
  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    getDoc(userDocRef).then((snap) => {
      let inv = [];
      let isAdminUser = false;
      if (snap.exists()) {
        const data = snap.data();
        inv = data.inventory || [];
        if (data.role === 'admin' || user?.role === 'admin' || user?.email?.includes('admin') || user?.displayName?.toLowerCase().includes('admin')) {
          isAdminUser = true;
        }
      } else if (user?.role === 'admin' || user?.email?.includes('admin') || user?.displayName?.toLowerCase().includes('admin')) {
        isAdminUser = true;
      }
      if (isAdminUser) {
        inv = EQUIPMENT_CATALOG.map(card => ({ cardId: card.id, quantity: 99 }));
      }
      setLobbyInventory(inv);
    }).catch(err => console.warn("Lỗi tải kho đồ lobby:", err));
  }, [user, isShopOpen]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const configSnap = await getDoc(doc(db, 'config', 'systemSettings'));
        if (configSnap.exists()) {
          const configData = configSnap.data();
          if (configData.theoryTimeLimit !== undefined) {
            setTheoryTimeLimit(Math.max(180, Number(configData.theoryTimeLimit || 180)));
          }
        }
      } catch (err) {
        console.warn("Lỗi đọc theoryTimeLimit từ Firestore:", err);
      }
    };
    fetchSettings();
  }, []);

  const startFreePractice = async (subjectId) => {
    playSound.success();
    
    // Khởi tạo trạng thái phòng chơi ảo cục bộ (Sandbox)
    setArenaStatus('playing');
    setIsPlayer1Role(true);
    setOpponentInfo({
      name: "Robot AI Luyện tập",
      elo: 100,
      level: 1,
      title: "robot_practice"
    });
    
    // Gán ID phòng là local_sandbox
    setActiveRoomId("local_sandbox");
    
    // Đặt thời lượng phòng chơi luyện tập là Vô Hạn (không tính giờ)
    setArenaTimeRemaining(180);
    
    // Reset toàn bộ trạng thái game với dữ liệu ngẫu nhiên mới
    setChemHCl(0);
    setChemNaOH(0);
    setChemBurner(false);
    setChemTemp(25);
    setChemEvap(0);
    setChemAddCount(0);
    setPhysPower(false);
    setPhysMirrors([0, 0, 0]);
    setPhysHint(0);
    setMathTargetIndex(0);
    setMathInputs({ x: '', y: '' });
    setMathLaserPath(null);
    setMathCombo(0);
    setMathWrongCount(0);
    setBioSelected(null);
    setBioRevealed(false);
    setPlayerChat(null);
    setOpponentChat(null);
    
    // Đọc ngân hàng câu hỏi
    if (subjectId === 'chemistry') {
      const questions = await generateChemistryMatchPool([]);
      setChemGame({
        questions: Array.isArray(questions) ? questions : [],
        currentQ: 0,
        score: 0,
        answered: []
      });
      setChemSelected(null);
      setChemRevealed(false);
      setChemTfAnswers([null, null, null, null]);
    } else if (subjectId === 'physics') {
      const questions = await generatePhysicsMatchPool([]);
      setPhysGame({
        questions: Array.isArray(questions) ? questions : [],
        currentQ: 0,
        score: 0,
        answered: []
      });
      setPhysSelected(null);
      setPhysRevealed(false);
    } else if (subjectId === 'math') {
      const questions = await generateMathMatchPool([]);
      setMathGame({
        questions: Array.isArray(questions) ? questions : [],
        currentQ: 0,
        score: 0,
        answered: []
      });
      setMathSelected(null);
      setMathRevealed(false);
    } else if (subjectId === 'biology') {
      const questions = await generateBiologyMatchPool([]);
      setBioGame({
        questions: Array.isArray(questions) ? questions : [],
        currentQ: 0,
        score: 0,
        answered: []
      });
      setBioSelected(null);
      setBioRevealed(false);
      setBioTfAnswers([null, null, null, null]);
    }
    
    // Đặt trạng thái chủ đề luyện tập
    useAppStore.setState(state => ({
      arenaState: {
        ...state.arenaState,
        subject: subjectId,
        playerProgress: 0,
        opponentProgress: 0,
        timeRemaining: 180,
        logs: ["Chào mừng đến phòng luyện tập tự do!", "Không giới hạn thời gian & Không tính ELO."]
      }
    }));
  };

  const handleShareToStories = () => {
    playSound.success();
    const shareData = {
      subject: arenaState.subject,
      subjectLabel: arenaState.subject === 'math' ? 'Toán học' : arenaState.subject === 'physics' ? 'Vật lý' : arenaState.subject === 'chemistry' ? 'Hóa học' : 'Sinh học',
      elo: personalization.elo,
      rewardElo: arenaState.matchResult === 'victory' ? 25 : -15,
      rewardExp: arenaState.matchResult === 'victory' ? 250 : 50,
      score: arenaState.matchResult === 'victory' ? 10 : 6,
      totalQuestions: 10,
      imageUrl: arenaState.subject === 'chemistry' ? 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?q=80&w=600&auto=format&fit=crop' :
                arenaState.subject === 'physics' ? 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop' :
                arenaState.subject === 'math' ? 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=600&auto=format&fit=crop' :
                'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=600&auto=format&fit=crop',
      caption: arenaState.matchResult === 'victory' 
        ? `Tôi vừa xuất sắc chiến thắng Đấu trường môn ${arenaState.subject === 'math' ? 'Toán học' : arenaState.subject === 'physics' ? 'Vật lý' : arenaState.subject === 'chemistry' ? 'Hóa học' : 'Sinh học'}! ELO tăng vọt! 🏆⚡` 
        : `Trận đấu trí môn ${arenaState.subject === 'math' ? 'Toán học' : arenaState.subject === 'physics' ? 'Vật lý' : arenaState.subject === 'chemistry' ? 'Hóa học' : 'Sinh học'} diễn ra cực kỳ kịch tính!`
    };
    savePendingShare(shareData).then((isSaved) => {
      if (isSaved) {
        router.push('/story');
      } else {
        alert('⚠️ Không thể lưu trữ thông tin chia sẻ do dung lượng bộ nhớ tạm bị giới hạn. Vui lòng thử lại!');
      }
    });
  };

  // States cục bộ phục vụ các mini-game ảo
  const [matchmakingTime, setMatchmakingTime] = useState(0);
  const [matchmakingError, setMatchmakingError] = useState('');
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [isPlayer1Role, setIsPlayer1Role] = useState(null);

  // Lịch sử đấu thật từ Firestore
  const [realHistory, setRealHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Live Chat & Emoji states
  const [playerChat, setPlayerChat] = useState(null); // { text, type, timestamp }
  const [opponentChat, setOpponentChat] = useState(null); // { text, type, timestamp }
  const [customChat, setCustomChat] = useState('');

  // Tab Exit Penalty states (5s / 10s / 20s / 40s / 80s, lần 6 xử thua)
  const [tabExitCount, setTabExitCount] = useState(0);
  const [tabExitModal, setTabExitModal] = useState(null); // { count, penalty, forfeited }

  // State cho câu hỏi Trả lời ngắn (SA) và Đúng/Sai (TF)
  const [saInput, setSaInput] = useState('');
  const [physTfAnswers, setPhysTfAnswers] = useState([null, null, null, null]);
  const [mathTfAnswers, setMathTfAnswers] = useState([null, null, null, null]);

  useEffect(() => {
    console.log("🧪 [Math Formatter Verification]");
    console.log("x^2 ->", formatMathText("x^2"));
    console.log("x^{10} ->", formatMathText("x^{10}"));
    console.log("x_1 ->", formatMathText("x_1"));
    console.log("normal_text ->", formatMathText("normal_text"));
  }, []);

  // Tự động giải trừ trạng thái đông băng / mù sương trên Firestore sau 3.2s / 5.2s
  useEffect(() => {
    if (!activeRoomId || activeRoomId === 'local_sandbox' || !currentRoomData) return;
    const isP1 = isPlayer1Role;
    const myRoleKey = isP1 ? 'p1' : 'p2';
    const myEffects = isP1 ? currentRoomData.activeEffects?.p1 : currentRoomData.activeEffects?.p2;

    if (myEffects?.frozenUntil && myEffects.frozenUntil > Date.now()) {
      const remaining = Math.max(100, myEffects.frozenUntil - Date.now() + 200);
      const timer = setTimeout(async () => {
        try {
          const roomRef = doc(db, 'match_rooms', activeRoomId);
          await updateDoc(roomRef, {
            [`activeEffects.${myRoleKey}.frozenUntil`]: 0
          });
        } catch (e) {
          console.warn("Auto clear freeze error:", e);
        }
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [currentRoomData?.activeEffects, activeRoomId, isPlayer1Role]);

  useEffect(() => {
    if (!activeRoomId || activeRoomId === 'local_sandbox' || !currentRoomData) return;
    const isP1 = isPlayer1Role;
    const myRoleKey = isP1 ? 'p1' : 'p2';
    const myEffects = isP1 ? currentRoomData.activeEffects?.p1 : currentRoomData.activeEffects?.p2;

    if (myEffects?.fogUntil && myEffects.fogUntil > Date.now()) {
      const remaining = Math.max(100, myEffects.fogUntil - Date.now() + 200);
      const timer = setTimeout(async () => {
        try {
          const roomRef = doc(db, 'match_rooms', activeRoomId);
          await updateDoc(roomRef, {
            [`activeEffects.${myRoleKey}.fogUntil`]: 0
          });
        } catch (e) {
          console.warn("Auto clear fog error:", e);
        }
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [currentRoomData?.activeEffects, activeRoomId, isPlayer1Role]);

  const syncProgressToFirestore = async (newProgress, currentLogs = []) => {
    if (!activeRoomId || activeRoomId === 'local_sandbox' || !user || isPlayer1Role === null) return;
    try {
      const roomRef = doc(db, 'match_rooms', activeRoomId);
      const updates = {};
      if (isPlayer1Role) {
        updates.player1Progress = newProgress;
        if (currentLogs.length > 0) {
          updates.player1Logs = currentLogs;
        }
      } else {
        updates.player2Progress = newProgress;
        if (currentLogs.length > 0) {
          updates.player2Logs = currentLogs;
        }
      }
      await updateDoc(roomRef, updates);
    } catch (err) {
      console.error("Lỗi đồng bộ tiến độ lên Firestore:", err);
    }
  };

  // KÍCH HOẠT THẺ BÀI STRATEGY TRONG TRẬN THI ĐẤU (CHỐNG DÙNG 2 LẦN & GIỚI HẠN 1 LẦN/THẺ)
  const handleUseCard = async (cardId) => {
    if (!activeRoomId || !user || isPlayer1Role === null) return;
    if (isCardActionPendingRef.current) return;
    isCardActionPendingRef.current = true;
    playSound.click();

    try {
      const roomRef = doc(db, 'match_rooms', activeRoomId);
      const isP1 = isPlayer1Role;
      const oppRoleKey = isP1 ? 'p2' : 'p1';
      const myRoleKey = isP1 ? 'p1' : 'p2';

      const roomSnap = await getDoc(roomRef);
      const roomDocData = roomSnap.exists() ? roomSnap.data() : {};
      const currentActiveEffects = roomDocData.activeEffects || {
        p1: { frozenUntil: 0, fogUntil: 0 },
        p2: { frozenUntil: 0, fogUntil: 0 }
      };

      const myEquipKey = isP1 ? 'player1Equipment' : 'player2Equipment';
      const oppEquipKey = isP1 ? 'player2Equipment' : 'player1Equipment';
      const myLogsKey = isP1 ? 'player1Logs' : 'player2Logs';
      const oppLogsKey = isP1 ? 'player2Logs' : 'player1Logs';

      const myEquip = [...(roomDocData[myEquipKey] || [])];
      const oppEquip = [...(roomDocData[oppEquipKey] || [])];

      // 1. KIỂM TRA BẮT BUỘC: THẺ PHẢI CÒN TRONG TÚI TRANG BỊ MỚI ĐƯỢC PHÉP DÙNG (CHỐNG DÙNG 2 LẦN)
      if (!myEquip.includes(cardId)) {
        addArenaLogStore('⚠️ Thẻ này đã được dùng hoặc không còn trong khay trang bị!');
        playSound.hover?.();
        return;
      }

      let payloadUpdates = {};
      let updatedEffects = { ...currentActiveEffects };

      if (cardId === 'card_counter') {
        const myFreezeDiff = (updatedEffects[myRoleKey]?.frozenUntil || 0) - Date.now();
        const myFogDiff = (updatedEffects[myRoleKey]?.fogUntil || 0) - Date.now();
        const cardIdx = myEquip.indexOf('card_counter');

        if (myFreezeDiff > 0 || myFogDiff > 0) {
          // TRƯỜNG HỢP 1: BỊ ĐÓNG BĂNG HOẶC MÙ SƯƠNG -> HÓA GIẢI NGAY VÀ PHẢN NGƯỢC SANG ĐỐI THỦ
          if (cardIdx !== -1) myEquip.splice(cardIdx, 1);

          updatedEffects[myRoleKey] = {
            ...(updatedEffects[myRoleKey] || {}),
            frozenUntil: 0,
            fogUntil: 0
          };

          if (myFreezeDiff > 0) {
            updatedEffects[oppRoleKey] = {
              ...(updatedEffects[oppRoleKey] || {}),
              frozenUntil: Date.now() + 3000
            };
          }
          if (myFogDiff > 0) {
            updatedEffects[oppRoleKey] = {
              ...(updatedEffects[oppRoleKey] || {}),
              fogUntil: Date.now() + 30000
            };
          }

          payloadUpdates = {
            activeEffects: updatedEffects,
            [myEquipKey]: myEquip,
            [myLogsKey]: arrayUnion('🛡️ KÍCH HOẠT THẺ PHẢN ĐÒN! Phản ngược hiệu ứng khống chế sang đối thủ!'),
            [oppLogsKey]: arrayUnion('⚠️ ĐỐI THỦ KÍCH HOẠT THẺ PHẢN ĐÒN! Bạn bị phản ngược lại hiệu ứng khống chế!')
          };

          addArenaLogStore('🛡️ Kích hoạt Thẻ Phản Đòn! Đã hóa giải hiệu ứng tiêu cực và phản ngược sang đối thủ!');
          playSound.success?.();
          showCardAnnouncement('🛡️', 'PHẢN ĐÒN THÀNH CÔNG!', 'Đã hóa giải hiệu ứng và phản ngược sang đối thủ!', 'from-orange-500 to-amber-600');
        } else {
          // TRƯỜNG HỢP 2: CHỦ ĐỘNG BẬT KHIÊN PHẢN ĐÒN TRƯỚC (BẢO HỘ 45 GIÂY)
          if (cardIdx !== -1) myEquip.splice(cardIdx, 1);

          updatedEffects[myRoleKey] = {
            ...(updatedEffects[myRoleKey] || {}),
            reflectActive: true,
            reflectUntil: Date.now() + 45000
          };

          payloadUpdates = {
            activeEffects: updatedEffects,
            [myEquipKey]: myEquip,
            [myLogsKey]: arrayUnion('🛡️ ĐÃ BẬT KHIÊN PHẢN ĐÒN (45s)! Sẵn sàng tự động phản ngược đòn tấn công tiếp theo!'),
            [oppLogsKey]: arrayUnion('⚠️ ĐỐI THỦ ĐÃ BẬT KHIÊN PHẢN ĐÒN (45s)! Cẩn thận khi tung chiêu!')
          };

          addArenaLogStore('🛡️ Đã bật Khiên Phản Đòn (45s)! Sẵn sàng tự động phản ngược chiêu thức của đối thủ!');
          playSound.success?.();
          showCardAnnouncement('🛡️', 'KHIÊN PHẢN ĐÒN ĐÃ BẬT!', 'Tự động phản ngược chiêu thức tiếp theo của đối thủ (45s)!', 'from-orange-500 to-amber-600');
        }
      } else if (cardId === 'card_magic_hand') {
        const stolenCountMap = roomDocData.stolenCount || { p1: 0, p2: 0 };
        const myStolenCount = stolenCountMap[myRoleKey] || 0;

        // GIỚI HẠN NGHIÊM NGẶT: CHỈ DÙNG ĐÚNG 1 LẦN TRONG TRẬN ĐẤU
        if (myStolenCount >= 1) {
          addArenaLogStore('⚠️ Mỗi trận chỉ được dùng Bàn Tay Ma Thuật 1 lần duy nhất!');
          playSound.hover?.();
          return;
        }

        if (oppEquip.length === 0) {
          addArenaLogStore('⚠️ Đối thủ hiện tại không có lá bài nào trong khay để đánh cắp!');
          playSound.hover?.();
          return;
        }

        const randIdx = Math.floor(Math.random() * oppEquip.length);
        const stolenCardId = oppEquip[randIdx];
        const stolenCardDef = getEquipmentById(stolenCardId);

        oppEquip.splice(randIdx, 1);
        const handIdx = myEquip.indexOf('card_magic_hand');
        if (handIdx !== -1) {
          myEquip.splice(handIdx, 1, stolenCardId);
        } else {
          myEquip.push(stolenCardId);
        }

        payloadUpdates = {
          [myEquipKey]: myEquip,
          [oppEquipKey]: oppEquip,
          stolenCount: { ...stolenCountMap, [myRoleKey]: myStolenCount + 1 },
          [myLogsKey]: arrayUnion(`🖐️ BÀN TAY MA THUẬT: Đã cướp thành công thẻ [${stolenCardDef?.name || stolenCardId}] của đối thủ!`),
          [oppLogsKey]: arrayUnion(`⚠️ ĐỐI THỦ ĐÃ DÙNG BÀN TAY MA THUẬT CƯỚP THẺ [${stolenCardDef?.name || stolenCardId}] CỦA BẠN!`)
        };

        addArenaLogStore(`🖐️ Bàn Tay Ma Thuật thành công! Bạn đã cướp thẻ [${stolenCardDef?.name || stolenCardId}] của đối thủ!`);
        playSound.success?.();
        showCardAnnouncement('🖐️', 'BÀN TAY MA THUẬT!', `Đã cướp thành công thẻ [${stolenCardDef?.name || stolenCardId}] của đối thủ!`, 'from-fuchsia-500 to-purple-800');

      } else if (cardId === 'card_time_freeze') {
        const cardIdx = myEquip.indexOf(cardId);
        if (cardIdx !== -1) myEquip.splice(cardIdx, 1);

        const isBot = !!roomDocData.isBotMatch;
        const oppHasShield = !isBot && updatedEffects[oppRoleKey]?.reflectActive;
        const oppHasCounterIdx = !isBot ? oppEquip.indexOf('card_counter') : -1;

        if (oppHasShield || oppHasCounterIdx !== -1) {
          if (oppHasCounterIdx !== -1) oppEquip.splice(oppHasCounterIdx, 1);
          updatedEffects[oppRoleKey] = {
            ...(updatedEffects[oppRoleKey] || {}),
            reflectActive: false
          };
          updatedEffects[myRoleKey] = {
            ...(updatedEffects[myRoleKey] || {}),
            frozenUntil: Date.now() + 3000
          };

          payloadUpdates = {
            activeEffects: updatedEffects,
            [myEquipKey]: myEquip,
            [oppEquipKey]: oppEquip,
            [myLogsKey]: arrayUnion('⚠️ ĐỐI THỦ KÍCH HOẠT THẺ PHẢN ĐÒN! ĐÔNG BĂNG PHẢN NGƯỢC LẠI BẠN!'),
            [oppLogsKey]: arrayUnion('🛡️ THẺ PHẢN ĐÒN TỰ ĐỘNG KÍCH HOẠT! Đông băng phản ngược sang đối thủ (3s)!')
          };
          addArenaLogStore('⚠️ ĐỐI THỦ KÍCH HOẠT THẺ PHẢN ĐÒN! Bạn bị đóng băng 3s!');
          playSound.warning?.() || playSound.click?.();
          showCardAnnouncement('⚠️', 'BỊ PHẢN ĐÒN!', 'Đối thủ đã phản đòn đóng băng ngược lại bạn (3s)!', 'from-rose-500 to-red-600');
        } else {
          updatedEffects[oppRoleKey] = {
            ...(updatedEffects[oppRoleKey] || {}),
            frozenUntil: Date.now() + 3000
          };
          payloadUpdates = {
            activeEffects: updatedEffects,
            [myEquipKey]: myEquip,
            [myLogsKey]: arrayUnion('❄️ ĐÃ SỬ DỤNG THẺ ĐÔNG BĂNG THỜI GIAN 3S VÀO ĐỐI THỦ!')
          };
          addArenaLogStore('❄️ Kích hoạt Thẻ Đông Băng! Màn hình đối thủ bị khóa trong 3 giây!');
          playSound.success?.();
          showCardAnnouncement('❄️', 'ĐÔNG BĂNG THỜI GIAN!', 'Đã khóa toàn bộ thao tác màn hình đối thủ trong 3 giây!', 'from-cyan-500 to-blue-600');
        }

      } else if (cardId === 'card_smoke_fog') {
        const cardIdx = myEquip.indexOf(cardId);
        if (cardIdx !== -1) myEquip.splice(cardIdx, 1);

        const isBot = !!roomDocData.isBotMatch;
        const oppHasShield = !isBot && updatedEffects[oppRoleKey]?.reflectActive;
        const oppHasCounterIdx = !isBot ? oppEquip.indexOf('card_counter') : -1;

        if (oppHasShield || oppHasCounterIdx !== -1) {
          if (oppHasCounterIdx !== -1) oppEquip.splice(oppHasCounterIdx, 1);
          updatedEffects[oppRoleKey] = {
            ...(updatedEffects[oppRoleKey] || {}),
            reflectActive: false
          };
          updatedEffects[myRoleKey] = {
            ...(updatedEffects[myRoleKey] || {}),
            fogUntil: Date.now() + 30000
          };

          payloadUpdates = {
            activeEffects: updatedEffects,
            [myEquipKey]: myEquip,
            [oppEquipKey]: oppEquip,
            [myLogsKey]: arrayUnion('⚠️ ĐỐI THỦ KÍCH HOẠT THẺ PHẢN ĐÒN! MÙ SƯƠNG DẬP NGƯỢC LẠI BẠN!'),
            [oppLogsKey]: arrayUnion('🛡️ THẺ PHẢN ĐÒN TỰ ĐỘNG KÍCH HOẠT! Mù sương phản ngược sang đối thủ (30s)!')
          };
          addArenaLogStore('⚠️ ĐỐI THỦ KÍCH HOẠT THẺ PHẢN ĐÒN! Bạn bị che phủ bởi Mù Sương 30s!');
          playSound.warning?.() || playSound.click?.();
          showCardAnnouncement('⚠️', 'BỊ PHẢN ĐÒN!', 'Đối thủ đã phản đòn mù sương ngược lại bạn (30s)!', 'from-purple-600 to-rose-600');
        } else {
          updatedEffects[oppRoleKey] = {
            ...(updatedEffects[oppRoleKey] || {}),
            fogUntil: Date.now() + 30000
          };
          payloadUpdates = {
            activeEffects: updatedEffects,
            [myEquipKey]: myEquip,
            [myLogsKey]: arrayUnion('🌫️ ĐÃ SỬ DỤNG THẺ MÙ SƯƠNG 30S VÀO ĐỐI THỦ!')
          };
          addArenaLogStore('🌫️ Kích hoạt Thẻ Mù Sương! Màn hình đối thủ bị che phủ trong 30 giây!');
          playSound.success?.();
          showCardAnnouncement('🌫️', 'MÙ SƯƠNG CHIẾN THUẬT!', 'Đã che phủ màn hình đối thủ trong 30 giây!', 'from-purple-500 to-indigo-700');
        }

      } else if (cardId === 'card_progress_steal') {
        const cardIdx = myEquip.indexOf(cardId);
        if (cardIdx !== -1) myEquip.splice(cardIdx, 1);

        const currentOppProg = isP1 ? (roomDocData.player2Progress || 0) : (roomDocData.player1Progress || 0);
        const currentMyProg = isP1 ? (roomDocData.player1Progress || 0) : (roomDocData.player2Progress || 0);
        const stolen = 10;
        
        // Không để Bot phản ngược lại đòn cướp điểm của người chơi
        const isBot = !!roomDocData.isBotMatch;
        const oppHasShield = !isBot && updatedEffects[oppRoleKey]?.reflectActive;
        const oppHasCounterIdx = !isBot ? oppEquip.indexOf('card_counter') : -1;

        if (oppHasShield || oppHasCounterIdx !== -1) {
          if (oppHasCounterIdx !== -1) oppEquip.splice(oppHasCounterIdx, 1);
          updatedEffects[oppRoleKey] = {
            ...(updatedEffects[oppRoleKey] || {}),
            reflectActive: false
          };
          const newMyProg = Math.max(0, currentMyProg - stolen);
          const newOppProg = Math.min(100, currentOppProg + stolen);

          payloadUpdates = {
            activeEffects: updatedEffects,
            [isP1 ? 'player1Progress' : 'player2Progress']: newMyProg,
            [isP1 ? 'player2Progress' : 'player1Progress']: newOppProg,
            [myEquipKey]: myEquip,
            [oppEquipKey]: oppEquip,
            [myLogsKey]: arrayUnion(`⚠️ ĐỐI THỦ KÍCH HOẠT THẺ PHẢN ĐÒN! BẠN BỊ TRỪ ${stolen}% TIẾN ĐỘ!`),
            [oppLogsKey]: arrayUnion(`🛡️ THẺ PHẢN ĐÒN TỰ ĐỘNG KÍCH HOẠT! +${stolen}% tiến độ phản ngược từ đối thủ!`)
          };
          updatePlayerProgress(newMyProg);
          updateOpponentProgress(newOppProg);
          addArenaLogStore(`⚠️ ĐỐI THỦ KÍCH HOẠT THẺ PHẢN ĐÒN! Bạn bị cướp ngược ${stolen}% tiến độ!`);
          playSound.warning?.() || playSound.click?.();
          showCardAnnouncement('⚠️', 'BỊ PHẢN ĐÒN!', `Đối thủ đã phản đòn! Bạn bị cướp ngược ${stolen}% tiến độ!`, 'from-rose-500 to-red-600');
        } else {
          const newOppProg = Math.max(0, currentOppProg - stolen);
          const newMyProg = Math.min(100, currentMyProg + stolen);

          // Cập nhật cả điểm số tương ứng để bảo toàn vĩnh viễn tiến độ
          const myScoreKey = isP1 ? 'player1Score' : 'player2Score';
          const oppScoreKey = isP1 ? 'player2Score' : 'player1Score';
          const curMyScore = roomDocData[myScoreKey] || 0;
          const curOppScore = roomDocData[oppScoreKey] || 0;
          const newMyScore = curMyScore + 2;
          const newOppScore = Math.max(0, curOppScore - 2);

          payloadUpdates = {
            [isP1 ? 'player2Progress' : 'player1Progress']: newOppProg,
            [isP1 ? 'player1Progress' : 'player2Progress']: newMyProg,
            [myScoreKey]: newMyScore,
            [oppScoreKey]: newOppScore,
            [myEquipKey]: myEquip,
            [myLogsKey]: arrayUnion(`🥷 ĐÃ ĐÁNH CẮP ${stolen}% TIẾN ĐỘ CỦA ĐỐI THỦ!`)
          };

          updatePlayerProgress(newMyProg);
          updateOpponentProgress(newOppProg);

          // Đồng bộ điểm cho các bộ môn cục bộ
          if (arenaState.subject === 'chemistry') setChemGame(p => ({ ...p, score: p.score + 2 }));
          else if (arenaState.subject === 'physics') setPhysGame(p => ({ ...p, score: p.score + 2 }));
          else if (arenaState.subject === 'math') setMathGame(p => ({ ...p, score: p.score + 2 }));
          else if (arenaState.subject === 'biology') setBioGame(p => ({ ...p, score: p.score + 2 }));

          addArenaLogStore(`🥷 Kích hoạt Thẻ Đánh Cắp! +10% tiến độ cho bạn, -10% của đối thủ!`);
          playSound.success?.();
          showCardAnnouncement('🥷', 'CƯỚP TIẾN ĐỘ THÀNH CÔNG!', `+10% Tiến độ cho bạn, -10% Tiến độ của đối thủ!`, 'from-emerald-500 to-teal-600');
        }

      } else if (cardId === 'card_ai_assist') {
        const cardIdx = myEquip.indexOf(cardId);
        if (cardIdx !== -1) myEquip.splice(cardIdx, 1);
        payloadUpdates = { [myEquipKey]: myEquip };

        // Tìm đáp án chính xác của câu hỏi hiện tại để chỉ loại các phương án thực sự sai
        let currQ = null;
        if (arenaState.subject === 'chemistry') {
          currQ = chemGame.questions[chemGame.currentQ % (chemGame.questions.length || 1)];
        } else if (arenaState.subject === 'physics') {
          currQ = physGame.questions[physGame.currentQ % (physGame.questions.length || 1)];
        } else if (arenaState.subject === 'math') {
          currQ = mathGame.questions[mathGame.currentQ % (mathGame.questions.length || 1)];
        } else if (arenaState.subject === 'biology') {
          currQ = bioGame.questions[bioGame.currentQ % (bioGame.questions.length || 1)];
        }

        let correctIdx = 0;
        if (typeof currQ?.correct === 'number') {
          correctIdx = currQ.correct;
        } else if (typeof currQ?.correct === 'string') {
          const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, '0': 0, '1': 1, '2': 2, '3': 3 };
          correctIdx = map[currQ.correct.trim().toUpperCase()] ?? 0;
        }

        const wrongOpts = [0, 1, 2, 3].filter(idx => idx !== correctIdx);
        const toEliminate = wrongOpts.sort(() => 0.5 - Math.random()).slice(0, 2);
        setAiEliminatedOptions(toEliminate);

        addArenaLogStore('🤖 AI Copilot: Đã loại bỏ 2 phương án sai! Hãy chọn đáp án chính xác còn lại.');
        playSound.success?.();
        showCardAnnouncement('🤖', 'AI COPILOT HỖ TRỢ!', 'Đã loại bỏ 2 phương án sai! Hãy chọn đáp án chính xác.', 'from-violet-500 to-fuchsia-600');

      } else if (cardId === 'card_dispel') {
        const cardIdx = myEquip.indexOf(cardId);
        if (cardIdx !== -1) myEquip.splice(cardIdx, 1);

        updatedEffects[myRoleKey] = {
          ...(updatedEffects[myRoleKey] || {}),
          frozenUntil: 0,
          fogUntil: 0
        };

        payloadUpdates = {
          activeEffects: updatedEffects,
          [myEquipKey]: myEquip,
          [myLogsKey]: arrayUnion('✨ ĐÃ GIẢI TRỪ TẤT CẢ HIỆU ỨNG TIÊU CỰC!')
        };
        addArenaLogStore('✨ Kích hoạt Thẻ Giải Trừ! Mọi hiệu ứng Đông băng / Mù sương đã được xóa bỏ!');
        playSound.success?.();
        showCardAnnouncement('✨', 'GIẢI TRỪ TOÀN DIỆN!', 'Đã xóa sạch mọi hiệu ứng tiêu cực Đông Băng & Mù Sương!', 'from-teal-500 to-emerald-600');
      }

      if (Object.keys(payloadUpdates).length > 0) {
        await updateDoc(roomRef, payloadUpdates);
        // Cập nhật ngay lập tức cho state local để thẻ biến mất mượt mà trên UI
        setCurrentRoomData(prev => prev ? { ...prev, ...payloadUpdates } : prev);
      }
    } catch (err) {
      console.error("Lỗi sử dụng thẻ:", err);
    } finally {
      setTimeout(() => {
        isCardActionPendingRef.current = false;
      }, 350);
    }
  };



  useEffect(() => {
    if (playerChat) {
      const timer = setTimeout(() => setPlayerChat(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [playerChat]);

  useEffect(() => {
    if (opponentChat) {
      const timer = setTimeout(() => setOpponentChat(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [opponentChat]);

  const sendQuickChat = async (text, type = 'message') => {
    if (!activeRoomId || !user || isPlayer1Role === null) return;
    playSound.success();
    
    // Ghi vào log chung để hiển thị trong coherent signal feed
    const displayMsg = type === 'emoji' ? `đã thả cảm xúc ${text}` : `: "${text}"`;
    addArenaLog(`💬 ${user.displayName || 'Bạn'} ${displayMsg}`);

    const roomDocRef = doc(db, 'match_rooms', activeRoomId);
    try {
      await updateDoc(roomDocRef, {
        [isPlayer1Role ? 'player1Chat' : 'player2Chat']: {
          text,
          type,
          timestamp: Date.now()
        }
      });
    } catch (err) {
      console.warn("Lỗi gửi chat nhanh lên Firestore:", err);
    }
  };

  const handleSendCustomChat = (e) => {
    e.preventDefault();
    if (!customChat.trim()) return;
    sendQuickChat(customChat.trim(), 'message');
    setCustomChat('');
  };

  const formatMatchTime = (createdAt) => {
    try {
      const diff = Date.now() - new Date(createdAt).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Vừa xong';
      if (mins < 60) return `${mins} phút trước`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} giờ trước`;
      const days = Math.floor(hours / 24);
      if (days === 1) return 'Hôm qua';
      return `${days} ngày trước`;
    } catch (e) {
      return 'Không rõ';
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchMatchHistory = async () => {
      setLoadingHistory(true);
      try {
        const roomsCollection = collection(db, 'match_rooms');
        const q = query(
          roomsCollection,
          where('status', '==', 'result')
        );
        const querySnapshot = await getDocs(q);
        const matches = [];

        querySnapshot.forEach((docSnap) => {
          const roomData = docSnap.data();
          const isPlayer1 = roomData.player1?.uid === user.uid;
          const isPlayer2 = roomData.player2?.uid === user.uid;

          if (isPlayer1 || isPlayer2) {
            matches.push({
              ...roomData,
              id: docSnap.id
            });
          }
        });

        // Sắp xếp theo createdAt giảm dần
        matches.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        // Lấy 10 trận gần nhất và format
        const formattedMatches = matches.slice(0, 10).map((roomData) => {
          const isPlayer1 = roomData.player1?.uid === user.uid;
          const opp = isPlayer1 ? roomData.player2 : roomData.player1;
          const isWin = roomData.winnerId === user.uid;
          const isDraw = !roomData.winnerId || roomData.winnerId === 'draw';
          const result = isWin ? 'win' : (isDraw ? 'draw' : 'loss');

          const rawSubject = roomData.subject || 'biology';
          const displaySubject = rawSubject === 'math' ? 'Toán học' :
                                 rawSubject === 'physics' ? 'Vật lý' :
                                 rawSubject === 'chemistry' ? 'Hóa học' : 'Sinh học';

          return {
            id: roomData.id,
            opponent: opp?.name || 'Đối thủ ẩn danh',
            subject: displaySubject,
            result,
            eloChange: isWin ? '+25' : (isDraw ? '0' : '-15'),
            time: roomData.createdAt ? formatMatchTime(roomData.createdAt) : 'Vừa xong',
            avatarFrame: opp?.avatarFrame || 'default',
            avatarParts: opp?.avatarParts || null
          };
        });

        // Nếu chưa đủ 10 trận, giả lập đủ 10 trận đấu Sinh học với 7 Thắng - 3 Thua xen kẽ đối thủ thực tế
        if (formattedMatches.length < 10) {
          const MOCK_OPPONENTS = [
            { name: 'Hồ Thị A', avatarFrame: 'legendary' },
            { name: 'Hồ Thị A', avatarFrame: 'legendary' },
            { name: 'Trần Thị Thanh Vân', avatarFrame: 'cyber_gold' },
            { name: 'Phạm Minh Anh', avatarFrame: 'neon_blue' },
            { name: 'Bùi Minh Triết', avatarFrame: 'fire_flame' },
            { name: 'Hoàng Khánh Linh', avatarFrame: 'emerald_shield' },
            { name: 'Đặng Thùy Dương', avatarFrame: 'galaxy_purple' },
            { name: 'Nguyễn Minh Khang', avatarFrame: 'champion_star' },
            { name: 'Phan Thanh Hằng', avatarFrame: 'default' },
            { name: 'Trần Thị Thanh Vân', avatarFrame: 'cyber_gold' },
          ];
          const MOCK_RESULTS = ['win', 'loss', 'win', 'loss', 'win', 'win', 'loss', 'win', 'win', 'win']; // 7 Wins, 3 Losses
          const MOCK_TIMES = ['Vừa xong', '1 phút trước', '15 phút trước', '30 phút trước', '1 giờ trước', '2 giờ trước', '4 giờ trước', '6 giờ trước', '12 giờ trước', '1 ngày trước'];

          const startIdx = formattedMatches.length;
          for (let i = startIdx; i < 10; i++) {
            const res = MOCK_RESULTS[i];
            formattedMatches.push({
              id: `mock_bio_hist_${i}`,
              opponent: MOCK_OPPONENTS[i].name,
              subject: 'Sinh học',
              result: res,
              eloChange: res === 'win' ? '+25' : '-15',
              time: MOCK_TIMES[i],
              avatarFrame: MOCK_OPPONENTS[i].avatarFrame,
              avatarParts: null
            });
          }
        }

        setRealHistory(formattedMatches);
      } catch (err) {
        console.error("Lỗi khi tải lịch sử thi đấu:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchMatchHistory();
  }, [user, arenaState.status]);
  
  const [isFirebaseBlocked, setIsFirebaseBlocked] = useState(false);
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    const runNetworkDiagnostics = async () => {
      console.log("🔍 [Diagnostics] Đang kiểm tra kết nối mạng đến Google API...");
      try {
        const fetchPromise = fetch("https://www.googleapis.com/generate_204", { 
          method: 'GET',
          mode: 'no-cors'
        });
        
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("Timeout")), 5000);
        });
        
        await Promise.race([fetchPromise, timeoutPromise]);
        
        if (timeoutId) clearTimeout(timeoutId);
        
        if (isMounted) {
          console.log("🔍 [Diagnostics] Kết nối mạng đến máy chủ Google API hoàn toàn BÌNH THƯỜNG!");
          setIsFirebaseBlocked(false);
        }
      } catch (err) {
        console.error("🚨 [Diagnostics] CẢNH B� O: Không thể kết nối tới máy chủ Google API! " +
          "Tên mi� n này đang bị chặn bởi mạng nội bộ, Tư� ng lửa, VPN hoếc Adblocker của bạn. " +
          "Vui lòng tắt Adblocker hoếc đổi sang mạng 4G/Hotspot để thi đấu online!", err);
        setIsFirebaseBlocked(true);
      }
    };
    runNetworkDiagnostics();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Game 1: H�a học States (Titration & Evaporation) - target ngẫu nhi�n mỗi trận
  const [aiEliminatedOptions, setAiEliminatedOptions] = useState([]);
  const [tabPenaltyWarning, setTabPenaltyWarning] = useState(null);

  const [chemHCl, setChemHCl] = useState(0); // ml
  const [chemNaOH, setChemNaOH] = useState(0); // ml
  const [chemBurner, setChemBurner] = useState(false); // On/Off
  const [chemTemp, setChemTemp] = useState(25); // Celsius
  const [chemEvap, setChemEvap] = useState(0); // % bốc hơi
  const [chemTarget, setChemTarget] = useState(20); // Target ml để trung hòa
  const [chemMission, setChemMission] = useState(() => generateChemistryMission());
  const [chemAddCount, setChemAddCount] = useState(0); // Đếm thao tác
  const [showChemInstructions, setShowChemInstructions] = useState(true); // Trạng thái đóng/mở hướng dẫn nhiệm vụ Hóa Học

  // Game 1: Hóa học (Multi-format Infinite Arena)
  const [chemGame, setChemGame] = useState({ questions: [], currentQ: 0, score: 0, answered: [] });
  const [chemSelected, setChemSelected] = useState(null);
  const [chemRevealed, setChemRevealed] = useState(false);
  const [chemTfAnswers, setChemTfAnswers] = useState([null, null, null, null]);

  // Game 2: Vật lý
  const [physPower, setPhysPower] = useState(false);
  const [physMirrors, setPhysMirrors] = useState([0, 0, 0]);
  const [physTarget, setPhysTarget] = useState(() => generatePhysicsTarget()); // Mục tiêu gương
  const [physHint, setPhysHint] = useState(0); // Số lần xem gợi ý

  // Game 2: Vật lý (MCQ 30 câu)
  const [physGame, setPhysGame] = useState({ questions: [], currentQ: 0, score: 0, answered: [] });
  const [physSelected, setPhysSelected] = useState(null);
  const [physRevealed, setPhysRevealed] = useState(false);

  // Game 3: Toán học (MCQ 30 câu)
  const [mathGame, setMathGame] = useState({ questions: [], currentQ: 0, score: 0, answered: [] });
  const [mathSelected, setMathSelected] = useState(null);
  const [mathRevealed, setMathRevealed] = useState(false);

  // Game 4: Sinh học
  const [bioGame, setBioGame] = useState({ questions: [], currentQ: 0, score: 0, answered: [] });
  const [bioSelected, setBioSelected] = useState(null);
  const [bioTfAnswers, setBioTfAnswers] = useState([null, null, null, null]);

  // Giữ lại các biến state cũ để tránh lỗi reference
  const [mathTargetIndex, setMathTargetIndex] = useState(0);
  const [mathInputs, setMathInputs] = useState({ x: '', y: '' });
  const [mathAsteroids, setMathAsteroids] = useState(() => []);
  const [mathLaserPath, setMathLaserPath] = useState(null);
  const [mathCombo, setMathCombo] = useState(0);
  const [mathWrongCount, setMathWrongCount] = useState(0);
  const [bioRevealed, setBioRevealed] = useState(false); // hiện đáp án đúng // hiện đ�p �n đ�ng
  const [leaderboard, setLeaderboard] = useState([]);
  const [matchFoundData, setMatchFoundData] = useState(null);
  const [matchFoundCountdown, setMatchFoundCountdown] = useState(3);

  // ĐẾM NGƯỢC CHUYỂN TIẾP TRẬN ĐẤU (CINEMATIC COUNTDOWN EFFECT)
  useEffect(() => {
    let timer = null;
    if (matchFoundData && matchFoundCountdown > 0) {
      timer = setTimeout(() => {
        setMatchFoundCountdown(prev => prev - 1);
      }, 1000);
    } else if (matchFoundData && matchFoundCountdown === 0) {
      // Kết thúc đếm ngược VS, chuyển sang giai đoạn chọn trang bị trước trận
      setArenaStatus('equipment_selecting');
      setMatchFoundData(null);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [matchFoundData, matchFoundCountdown, setArenaStatus]);

  const [arenaAiText, setArenaAiText] = useState("Chào đấu thủ! Tôi là AI Copilot. Cần tôi gợi ý công thức hay lý thuyết nào không?");
  const [arenaAiQuery, setArenaAiQuery] = useState("");

  const handleGetArenaAiHint = () => {
    playSound.click();
    let hint = "";
    if (arenaState.subject === 'chemistry') {
      const hints = [
        "🧪 Công thức nồng độ pH: pH = -log[H+]. Môi trường axit có pH < 7.",
        "🧪 Để trung hòa hết NaOH bằng HCl: n(HCl) = n(NaOH). Thể tích V1.C1 = V2.C2.",
        "🧪 Chất chỉ thị Phenolphthalein chuyển sang màu hồng trong môi trường bazơ (pH > 8.3).",
        "🧪 Phản ứng bay hơi nước tăng nhanh khi nhiệt độ nâng cao. Giữ nhiệt độ tối ưu."
      ];
      hint = hints[Math.floor(Math.random() * hints.length)];
    } else if (arenaState.subject === 'physics') {
      const hints = [
        "⚡ Định luật phản xạ ánh sáng: Góc phản xạ bằng góc tới (i' = i).",
        "⚡ Để xoay tia laser tới mục tiêu, hãy điều chỉnh góc xoay của các gương phản xạ.",
        "⚡ Mỗi gương sẽ đổi hướng tia sáng một góc bằng 2 * góc nghiêng của gương.",
        "⚡ Hãy bật nguồn điện (Laser Power) sau khi đã chỉnh gương để kiểm tra hướng đi."
      ];
      hint = hints[Math.floor(Math.random() * hints.length)];
    } else if (arenaState.subject === 'math') {
      const hints = [
        "📐 Tọa độ vật thể (x, y). Hãy nhập chính xác tọa độ của các mảnh thiên thạch để bắn phá.",
        "📐 Hãy duy trì chuỗi Combo để nhận thêm điểm thưởng và hoàn thành bài thi nhanh hơn.",
        "📐 Nhập tọa độ x và y dạng số nguyên hoặc số thập phân rồi nhấn Enter để bắn tia laser."
      ];
      hint = hints[Math.floor(Math.random() * hints.length)];
    } else if (arenaState.subject === 'biology') {
      const hints = [
        "🧬 Nguyên tắc bổ sung trong phân tử ADN: A liên kết với T (2 liên kết H), G liên kết với X (3 liên kết H).",
        "🧬 Trong giảm phân, sự phân ly độc lập và tổ hợp tự do tạo ra nhiều biến dị tổ hợp.",
        "🧬 Quy luật Hardy-Weinberg: cấu trúc di truyền p²AA + 2pqAa + q²aa = 1."
      ];
      hint = hints[Math.floor(Math.random() * hints.length)];
    } else {
      hint = "🔬 Đọc kỹ đề bài và suy luận khoa học để giành chiến thắng ELO!";
    }
    setArenaAiText(hint);
  };

  const handleArenaAiQuerySubmit = (e) => {
    e.preventDefault();
    if (!arenaAiQuery.trim()) return;
    playSound.click();
    const query = arenaAiQuery.trim().toLowerCase();
    setArenaAiQuery("");
    
    let response = "Hệ thống đang phân tích... Xin lỗi, công thức này nằm ngoài vùng dữ liệu đấu trường hiện tại.";
    
    if (arenaState.subject === 'chemistry') {
      if (query.includes("ph") || query.includes("axit")) {
        response = "🧪 pH = -log[H+]. pH < 7 là axit, pH > 7 là kiềm. Dung dịch HCl là axit mạnh.";
      } else if (query.includes("trung hòa") || query.includes("hcl") || query.includes("naoh")) {
        response = "🧪 Phản ứng trung hòa: HCl + NaOH -> NaCl + H2O. Số mol H+ bằng số mol OH-.";
      } else if (query.includes("chất chỉ thị") || query.includes("màu")) {
        response = "🧪 Phenolphthalein không màu trong axit, chuyển hồng trong kiềm. Quỳ tím hóa đỏ trong axit.";
      }
    } else if (arenaState.subject === 'physics') {
      if (query.includes("gương") || query.includes("phản xạ")) {
        response = "⚡ Tia tới và tia phản xạ nằm cùng mặt phẳng. Góc phản xạ bằng góc tới.";
      } else if (query.includes("laser") || query.includes("ánh sáng")) {
        response = "⚡ Tốc độ ánh sáng trong chân không c ≈ 3.10^8 m/s. Tia laser có độ định hướng cao.";
      }
    } else if (arenaState.subject === 'math') {
      if (query.includes("tọa độ") || query.includes("asteroids")) {
        response = "📐 Nhập đúng giá trị x và y của thiên thạch hiển thị trên biểu đồ để định vị súng bắn phá.";
      }
    } else if (arenaState.subject === 'biology') {
      if (query.includes("adn") || query.includes("xoắn kép")) {
        response = "🧬 ADN gồm hai chuỗi polynucleotit liên kết ngược chiều theo nguyên tắc bổ sung A-T, G-X.";
      } else if (query.includes("menden") || query.includes("di truyền")) {
        response = "🧬 Men-đen có quy luật phân ly (1 cặp gen) và phân ly độc lập (nhiều cặp gen).";
      }
    }
    
    setArenaAiText(response);
  };

  const addArenaLog = (logText) => {
    addArenaLogStore(logText);
    if (arenaState.status === 'playing' && activeRoomId && user) {
      const roomDocRef = doc(db, 'match_rooms', activeRoomId);
      getDoc(roomDocRef).then((roomSnap) => {
        if (roomSnap.exists()) {
          const roomData = roomSnap.data();
          const isPlayer1 = roomData.player1.uid === user.uid;
          const currentLogs = isPlayer1 ? roomData.player1Logs : roomData.player2Logs;
          const nextLogs = [logText, ...currentLogs].slice(0, 5);
          
          updateDoc(roomDocRef, {
            [isPlayer1 ? 'player1Logs' : 'player2Logs']: nextLogs
          }).catch(err => console.warn("Lỗi ghi log lên Firestore:", err));
        }
      }).catch(err => console.warn("Lỗi đ� c phòng chơi để ghi log:", err));
    }
  };


  // Refs điều khiển game loop & playback bot
  const matchmakingTimerRef = useRef(null);
  const gameLoopTimerRef = useRef(null);
  const botPlaybackTimersRef = useRef([]);
  const botCardsUsedRef = useRef(new Set());
  const isBotRequestPendingRef = useRef(false);
  const arenaStatusRef = useRef(arenaState.status);

  useEffect(() => {
    arenaStatusRef.current = arenaState.status;
    if (arenaState.status !== 'playing') {
      clearBotPlaybackTimers();
      if (botCardsUsedRef.current) {
        botCardsUsedRef.current.clear();
      }
      isBotEngineStartedRef.current = false;
    }
  }, [arenaState.status]);

  const clearBotPlaybackTimers = () => {
    if (botPlaybackTimersRef.current && botPlaybackTimersRef.current.length > 0) {
      botPlaybackTimersRef.current.forEach(t => clearTimeout(t));
      botPlaybackTimersRef.current = [];
    }
  };

  const startBotPlaybackEngine = (roomId, botUid, playbackSchedule) => {
    clearBotPlaybackTimers();
    if (!playbackSchedule || !Array.isArray(playbackSchedule) || playbackSchedule.length === 0) return;

    console.log(`🤖 [Bot Playback Engine] Kích hoạt kịch bản playback tuần tự cho Bot (${botUid}) với ${playbackSchedule.length} bước!`);

    // 1. KỊCH BẢN LÀM BÀI TUẦN TỰ CỦA BOT (MÔ PHỎNG HỌC SINH THẬT: SUY NGHĨ, NHÁP BÀI, TẠM DỪNG KHI BỊ KHỐNG CHẾ)
    const runBotStep = (stepIdx) => {
      if (stepIdx >= playbackSchedule.length) {
        console.log(`🤖 [Bot Playback Engine] Bot đã hoàn thành toàn bộ ${playbackSchedule.length} bước.`);
        return;
      }
      if (arenaStatusRef.current !== 'playing') {
        return;
      }

      const step = playbackSchedule[stepIdx];
      // Tính độ trễ suy nghĩ của học sinh (15s-28s/câu cho Toán/Lý, 18s-32s cho Hóa, 12s-22s cho Sinh)
      let stepDelay = Number(step.delayMs);
      if (!stepDelay || isNaN(stepDelay) || stepDelay < 8000) {
        // Fallback nhịp học sinh thật tính toán cẩn thận nếu kịch bản cũ thiếu delayMs
        stepDelay = 16000 + Math.floor(Math.random() * 9000);
      }

      // Kiểm tra trạng thái hiệu ứng khống chế của Bot từ dữ liệu phòng mới nhất
      const currentRoom = latestRoomDataRef.current || {};
      const botRole = (currentRoom.player1?.uid === botUid) ? 'p1' : 'p2';
      const botEffects = currentRoom.activeEffects?.[botRole] || {};
      const now = Date.now();

      // NẾU BOT ĐANG BỊ MÙ SƯƠNG: Tăng thêm 6s thời gian đọc đề vì màn hình bị che mờ
      if (botEffects.fogUntil && botEffects.fogUntil > now) {
        console.log(`🌫️ [Bot Action Runner] Bot đang bị Mù Sương -> Cộng thêm 6 giây đọc đề/nháp bài!`);
        stepDelay += 6000;
      }

      // NẾU BOT ĐANG BỊ ĐÓNG BĂNG: Tạm dừng hoàn toàn việc suy nghĩ cho đến khi hết đông băng
      let freezeWait = 0;
      if (botEffects.frozenUntil && botEffects.frozenUntil > now) {
        freezeWait = Math.max(1000, botEffects.frozenUntil - now + 400);
        console.log(`❄️ [Bot Action Runner] Bot đang bị Đóng Băng -> Tạm dừng ${Math.round(freezeWait/1000)}s trước khi suy nghĩ tiếp...`);
      }

      const totalWaitMs = stepDelay + freezeWait;
      console.log(`🤖 [Bot Action Runner] Chuẩn bị câu ${stepIdx + 1}/${playbackSchedule.length} (Thời gian tính toán: ${Math.round(totalWaitMs/1000)}s)...`);

      const timerId = setTimeout(async () => {
        try {
          if (arenaStatusRef.current !== 'playing') return;

          // Kiểm tra lại trạng thái đóng băng tại chính thời điểm nộp bài
          const freshData = latestRoomDataRef.current || {};
          const freshEffects = freshData.activeEffects?.[botRole] || {};
          const rightNow = Date.now();

          if (freshEffects.frozenUntil && freshEffects.frozenUntil > rightNow) {
            const remainingFreeze = Math.max(1000, freshEffects.frozenUntil - rightNow + 500);
            console.log(`❄️ [Bot Action Runner] Bot vẫn còn bị Đóng Băng (${Math.round(remainingFreeze/1000)}s)! Hoãn nộp bài câu ${stepIdx + 1}...`);
            const retryTimer = setTimeout(() => {
              runBotStep(stepIdx); // Thử lại chính câu này sau khi rã đông
            }, remainingFreeze);
            botPlaybackTimersRef.current.push(retryTimer);
            return;
          }

          console.log(`🤖 [Bot Action Trigger] Bot nộp bài câu ${step.stepIndex}...`);
          if (clientFunctions && clientFunctions.submitAnswer) {
            await clientFunctions.submitAnswer(db, { currentUser: { uid: botUid } })({
              matchId: roomId,
              actingForBotId: botUid,
              stepIndex: step.stepIndex
            });
          } else {
            const submitAnswerFn = httpsCallable(functions, 'submitAnswer');
            await submitAnswerFn({
              matchId: roomId,
              actingForBotId: botUid,
              stepIndex: step.stepIndex
            });
          }
        } catch (err) {
          console.warn(`⚠️ [Bot Action Trigger] Lỗi khi kích hoạt bước ${step.stepIndex}:`, err);
        } finally {
          // Kích hoạt tuần tự câu tiếp theo nếu trận đấu vẫn đang diễn ra
          if (arenaStatusRef.current === 'playing') {
            runBotStep(stepIdx + 1);
          }
        }
      }, totalWaitMs);

      botPlaybackTimersRef.current.push(timerId);
    };

    // Bắt đầu chuỗi bước tuần tự
    runBotStep(0);

    // 2. KỊCH BẢN BOT DÙNG THẺ CHIÊU TRONG TRẬN: TỐI ĐA ĐÚNG 3 THẺ, MỖI THẺ DÙNG ĐÚNG 1 LẦN VÀ KIỂM TRA TÚI ĐỒ
    const botCardSkillDelays = [35000, 85000, 150000];
    const botCandidateCardTypes = ['card_time_freeze', 'card_smoke_fog', 'card_progress_steal', 'card_magic_hand'];

    botCardSkillDelays.forEach((delayMs, idx) => {
      const cardTimerId = setTimeout(async () => {
        try {
          if (arenaStatusRef.current !== 'playing') return;
          if (botCardsUsedRef.current.size >= 3) return; // Không dùng quá 3 thẻ

          const roomRef = doc(db, 'match_rooms', roomId);
          const rSnap = await getDoc(roomRef);
          if (!rSnap.exists() || rSnap.data().status !== 'playing') return;

          const rData = rSnap.data();
          const now = Date.now();
          const botRole = (rData.player1?.uid === botUid) ? 'p1' : 'p2';
          const oppRole = botRole === 'p1' ? 'p2' : 'p1';

          // 1. KIỂM TRA BOT CÓ ĐANG BỊ ĐÓNG BĂNG KHÔNG (Nếu bị đóng băng thì không thể tung chiêu)
          const botEffects = rData.activeEffects?.[botRole] || {};
          if (botEffects.frozenUntil && botEffects.frozenUntil > now) {
            console.log(`❄️ [Bot Skill] Bot đang bị Đóng Băng -> Không thể tung chiêu lúc này!`);
            return;
          }

          // 2. KIỂM TRA TÚI TRANG BỊ CỦA BOT: CHỈ ĐƯỢC PHÉP DÙNG THẺ CÒN TỒN TẠI TRONG TÚI
          const currentBotEquip = [...(rData[botRole === 'p1' ? 'player1Equipment' : 'player2Equipment'] || [])];
          if (currentBotEquip.length === 0) {
            console.log(`🤖 [Bot Skill] Bot không còn thẻ nào trong túi trang bị!`);
            return;
          }

          // Chọn 1 thẻ từ trang bị của Bot mà chưa từng dùng
          const availableCardId = currentBotEquip.find(c => !botCardsUsedRef.current.has(c) && botCandidateCardTypes.includes(c)) || currentBotEquip[0];
          if (!availableCardId || botCardsUsedRef.current.has(availableCardId)) {
            return;
          }

          botCardsUsedRef.current.add(availableCardId);

          const oppEffects = rData.activeEffects?.[oppRole] || {};
          const oppEquipKey = oppRole === 'p1' ? 'player1Equipment' : 'player2Equipment';
          const botEquipKey = botRole === 'p1' ? 'player1Equipment' : 'player2Equipment';
          const oppEquip = [...(rData[oppEquipKey] || [])];
          const isShieldActive = oppEffects.reflectActive && (oppEffects.reflectUntil ? oppEffects.reflectUntil > now : true);

          // Loại bỏ thẻ vừa dùng khỏi trang bị của Bot trong Firestore (Đảm bảo mỗi thẻ dùng duy nhất 1 lần)
          const cardIdxInBot = currentBotEquip.indexOf(availableCardId);
          if (cardIdxInBot !== -1) {
            currentBotEquip.splice(cardIdxInBot, 1);
          }

          if (availableCardId === 'card_time_freeze') {
            if (isShieldActive) {
              await updateDoc(roomRef, {
                [`activeEffects.${oppRole}.reflectActive`]: false,
                [`activeEffects.${botRole}.frozenUntil`]: now + 3000,
                [botEquipKey]: currentBotEquip,
                [botRole === 'p1' ? 'player1Logs' : 'player2Logs']: arrayUnion(`🛡️ Đóng băng bị phản đòn lại Bot trong 3s!`)
              });
              addArenaLogStore('🛡️ [Khiên Phản Đòn] Đã tự động phản ngược Đông Băng 3s về Bot!');
              playSound.success?.();
              showCardAnnouncement('🛡️', 'KHIÊN ĐÃ PHẢN ĐÒN!', 'Chiêu Đông Băng của Bot đã bị phản ngược lại Bot (3s)!', 'from-orange-500 to-amber-600');
            } else {
              await updateDoc(roomRef, {
                [`activeEffects.${oppRole}.frozenUntil`]: now + 3000,
                [botEquipKey]: currentBotEquip,
                [oppRole === 'p1' ? 'player1Logs' : 'player2Logs']: arrayUnion(`🧊 Bot tung Đóng Băng làm bạn khựng 3s!`)
              });
              addArenaLogStore('❄️ [Bot] Đối thủ Bot đã dùng Thẻ Đông Băng lên bạn (3s)!');
              playSound.warning?.() || playSound.click?.();
              showCardAnnouncement('❄️', 'BẠN BỊ ĐÓNG BĂNG (3s)!', 'Dùng Thẻ Giải Trừ hoặc Thẻ Phản Đòn để thoát ngay!', 'from-cyan-600 to-blue-700');
            }
          } else if (availableCardId === 'card_smoke_fog') {
            if (isShieldActive) {
              await updateDoc(roomRef, {
                [`activeEffects.${oppRole}.reflectActive`]: false,
                [`activeEffects.${botRole}.fogUntil`]: now + 30000,
                [botEquipKey]: currentBotEquip,
                [botRole === 'p1' ? 'player1Logs' : 'player2Logs']: arrayUnion(`🛡️ Sương mù bị phản đòn lại Bot trong 30s!`)
              });
              addArenaLogStore('🛡️ [Khiên Phản Đòn] Đã tự động phản ngược Mù Sương 30s về Bot!');
              playSound.success?.();
              showCardAnnouncement('🛡️', 'KHIÊN ĐÃ PHẢN ĐÒN!', 'Chiêu Mù Sương của Bot đã bị phản ngược lại Bot (30s)!', 'from-orange-500 to-amber-600');
            } else {
              await updateDoc(roomRef, {
                [`activeEffects.${oppRole}.fogUntil`]: now + 30000,
                [botEquipKey]: currentBotEquip,
                [oppRole === 'p1' ? 'player1Logs' : 'player2Logs']: arrayUnion(`🌫️ Bot tung Sương Mù che mắt bạn trong 30s!`)
              });
              addArenaLogStore('🌫️ [Bot] Đối thủ Bot đã dùng Thẻ Mù Sương lên bạn (30s)!');
              playSound.warning?.() || playSound.click?.();
              showCardAnnouncement('🌫️', 'BẠN BỊ MÙ SƯƠNG (30s)!', 'Dùng Thẻ Giải Trừ hoặc Thẻ Phản Đòn để thoát ngay!', 'from-purple-600 to-indigo-800');
            }
          } else if (availableCardId === 'card_progress_steal') {
            const p1Prog = rData.player1Progress || 0;
            const p2Prog = rData.player2Progress || 0;
            const myProg = botRole === 'p1' ? p1Prog : p2Prog;
            const oppProg = botRole === 'p1' ? p2Prog : p1Prog;
            const stealAmount = Math.min(10, oppProg);

            if (isShieldActive) {
              const newBotProg = Math.max(0, myProg - stealAmount);
              const newOppProg = Math.min(100, oppProg + stealAmount);
              await updateDoc(roomRef, {
                [`activeEffects.${oppRole}.reflectActive`]: false,
                [botRole === 'p1' ? 'player1Progress' : 'player2Progress']: newBotProg,
                [oppRole === 'p1' ? 'player1Progress' : 'player2Progress']: newOppProg,
                [botEquipKey]: currentBotEquip,
                [oppRole === 'p1' ? 'player1Logs' : 'player2Logs']: arrayUnion(`🛡️ Khiên Phản Đòn phản ngược +${stealAmount}% tiến độ từ Bot sang bạn!`)
              });
              addArenaLogStore(`🛡️ [Khiên Phản Đòn] Đã phản ngược cú cướp tiến độ của Bot (+${stealAmount}%)!`);
              playSound.success?.();
              showCardAnnouncement('🛡️', 'KHIÊN ĐÃ PHẢN ĐÒN!', `Đã phản ngược cú cướp điểm của Bot! (+${stealAmount}% cho bạn)`, 'from-orange-500 to-amber-600');
            } else {
              const newOppProg = Math.max(0, oppProg - stealAmount);
              const newBotProg = Math.min(100, myProg + stealAmount);

              await updateDoc(roomRef, {
                [botRole === 'p1' ? 'player1Progress' : 'player2Progress']: newBotProg,
                [oppRole === 'p1' ? 'player1Progress' : 'player2Progress']: newOppProg,
                [botEquipKey]: currentBotEquip,
                [oppRole === 'p1' ? 'player1Logs' : 'player2Logs']: arrayUnion(`💥 Bot đã cướp ${stealAmount}% tiến độ của bạn!`)
              });
              addArenaLogStore(`🥷 [Bot] Đối thủ Bot đã đánh cắp ${stealAmount}% tiến độ của bạn!`);
              playSound.warning?.() || playSound.click?.();
              showCardAnnouncement('🥷', 'BOT ĐÁNH CẮP TIẾN ĐỘ!', `Bot đã đánh cắp ${stealAmount}% tiến độ của bạn!`, 'from-rose-600 to-red-700');
            }
          } else if (availableCardId === 'card_magic_hand') {
            if (oppEquip.length > 0) {
              const randIdx = Math.floor(Math.random() * oppEquip.length);
              const stolenCardId = oppEquip[randIdx];
              oppEquip.splice(randIdx, 1);
              currentBotEquip.push(stolenCardId);
              const stolenDef = getEquipmentById(stolenCardId);

              await updateDoc(roomRef, {
                [botEquipKey]: currentBotEquip,
                [oppEquipKey]: oppEquip,
                [oppRole === 'p1' ? 'player1Logs' : 'player2Logs']: arrayUnion(`⚠️ Bot đã dùng Bàn Tay Ma Thuật cướp thẻ [${stolenDef?.name || stolenCardId}] của bạn!`)
              });
              addArenaLogStore(`⚠️ [Bot] Bot đã dùng Bàn Tay Ma Thuật cướp thẻ [${stolenDef?.name || stolenCardId}] của bạn!`);
              playSound.warning?.() || playSound.click?.();
              showCardAnnouncement('🖐️', 'BOT DÙNG BÀN TAY MA THUẬT!', `Bot đã cướp thẻ [${stolenDef?.name || stolenCardId}] của bạn!`, 'from-purple-600 to-fuchsia-800');
            }
          }
        } catch (botSkillErr) {
          console.warn("Lỗi bot tung chiêu:", botSkillErr);
        }
      }, delayMs);

      botPlaybackTimersRef.current.push(cardTimerId);
    });
  };

  // KÍCH HOẠT BOT PLAYBACK VÀ SKILLS NẾU LÀ TRẬN ĐẤU VỚI BOT KHI BẮT ĐẦU VÀO TRẬN (PLAYING)
  useEffect(() => {
    if (arenaState.status === 'playing' && activeRoomId && latestRoomDataRef.current?.isBotMatch) {
      if (isBotEngineStartedRef.current) return;
      const roomData = latestRoomDataRef.current;
      const botUid = botPlaybackInfoRef.current?.botUid || roomData?.botUid || roomData?.player2?.uid;
      const schedule = botPlaybackInfoRef.current?.schedule || 
                       (roomData?.botSchedule ? roomData.botSchedule.map(s => ({ stepIndex: s.stepIndex, delayMs: s.delayMs || 18000 })) : null);
      if (schedule && schedule.length > 0 && botUid) {
        isBotEngineStartedRef.current = true;
        startBotPlaybackEngine(
          activeRoomId,
          botUid,
          schedule
        );
      }
    }
  }, [arenaState.status, activeRoomId]);

  // LẮNG NGHE BẢNG XẾP HẠNG ONLINE THỜI GIAN THỰC
  useEffect(() => {
    if (arenaState.status === 'idle') {
      const fallbackList = (REAL_TEST_BOT_ACCOUNTS || []).map((b, idx) => ({
        uid: `bot_${idx}`,
        displayName: b.name,
        elo: b.elo,
        level: b.level,
        wins: b.wins,
        losses: b.losses
      })).sort((a, b) => b.elo - a.elo).slice(0, 10);

      if (!user) {
        setLeaderboard(fallbackList);
        return;
      }

      const usersCollection = collection(db, 'users');
      
      const unsubscribeLeaderboard = onSnapshot(usersCollection, (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          const uData = docSnap.data();
          list.push({
            uid: docSnap.id,
            displayName: uData.displayName || uData.name || 'Học viên ẩn danh',
            elo: uData.stats?.elo !== undefined ? uData.stats.elo : (uData.personalization?.elo || 0),
            level: uData.stats?.level || uData.personalization?.level || 1,
            wins: uData.stats?.wins || 0,
            losses: uData.stats?.losses || 0,
          });
        });
        
        list.sort((a, b) => b.elo - a.elo);
        setLeaderboard(list.slice(0, 10));
      }, (err) => {
        // Tự động dùng danh sách xếp hạng giả lập nếu chưa có quyền đọc users
        setLeaderboard(fallbackList);
      });

      return () => unsubscribeLeaderboard();
    }
  }, [arenaState.status, user]);

  // 1. GHÉP TRẬN THỜI GIAN THỰC QUA FIRESTORE (Tự chữa lành & tự động hợp nhất phòng)
  useEffect(() => {
    let unsubscribeQueue = null;
    let isCancelled = false;
    let currentActiveRoomId = null;
    let lastMergeCheck = 0;

    if (arenaState.status === 'matching') {
      playSound.click();
      setMatchmakingTime(0);
      setMatchmakingError('');
      isBotRequestPendingRef.current = false;
      clearBotPlaybackTimers();
      
      matchmakingTimerRef.current = setInterval(() => {
        playSound.hover();
        setMatchmakingTime((prev) => {
          const nextTime = prev + 1;

          // Fallback gán Bot sau quá 30s chờ không tìm được đối thủ thật (Đồng bộ với Hồ sơ Minh bạch AI)
          const targetRoomId = currentActiveRoomId || (user ? `room_${user.uid}_${Date.now()}` : null);
          if (nextTime >= 30 && !isBotRequestPendingRef.current && targetRoomId) {
            isBotRequestPendingRef.current = true;
            console.log("⏱️ [Bot Fallback Trigger] Đã quá 30s chờ! Đang gọi máy chủ gán đối thủ Bot...", targetRoomId);

            (async () => {
              try {
                const botRes = await requestBotOpponent(arenaState.subject, targetRoomId);
                if (botRes && botRes.success && botRes.roomId && !isCancelled) {
                  console.log("🤖 [Bot Fallback] Đã ghép thành công đối thủ Bot:", botRes.botUid);

                  if (unsubscribeQueue) unsubscribeQueue();

                  if (botRes.playbackSchedule && Array.isArray(botRes.playbackSchedule)) {
                    botPlaybackInfoRef.current = {
                      roomId: botRes.roomId,
                      botUid: botRes.botUid,
                      schedule: botRes.playbackSchedule
                    };
                  }

                  if (matchmakingTimerRef.current) clearInterval(matchmakingTimerRef.current);
                  handleMatchFoundReal(botRes.roomId);
                } else {
                  console.warn("⚠️ [Bot Fallback] Gán đối thủ Bot chưa thành công, sẽ tự động thử lại sau 2 giây:", botRes?.error || "Unknown response");
                  setTimeout(() => {
                    if (!isCancelled) {
                      isBotRequestPendingRef.current = false;
                    }
                  }, 2000);
                }
              } catch (botErr) {
                console.error("🚨 [Bot Fallback Error] Lỗi gán đối thủ Bot:", botErr);
                setTimeout(() => {
                  if (!isCancelled) {
                    isBotRequestPendingRef.current = false;
                  }
                }, 2000);
              }
            })();
          }
          
          if (
            nextTime - lastMergeCheck >= 3 && 
            currentActiveRoomId && 
            currentActiveRoomId.startsWith(`room_${user.uid}`) &&
            !isBotRequestPendingRef.current
          ) {
            lastMergeCheck = nextTime;
            
            (async () => {
              let seenHistory = [];
              if (arenaState.subject === 'chemistry') seenHistory = getSessionHistory('seen_chem_missions');
              else if (arenaState.subject === 'physics') seenHistory = getSessionHistory('seen_phys_targets');
              else if (arenaState.subject === 'math') seenHistory = getSessionHistory('seen_math_questions');
              else if (arenaState.subject === 'biology') seenHistory = getSessionHistory('seen_bio_questions');

              const mergedId = await checkForRoomMerge(
                user.uid,
                currentActiveRoomId,
                arenaState.subject,
                personalization.name || user.displayName || 'Người chơi ẩn danh',
                personalization.elo,
                personalization.level,
                personalization.activeTitle || 'apprentice',
                personalization.avatarFrame || 'default',
                personalization.avatarParts || null,
                seenHistory
              );
              
              if (mergedId && !isCancelled) {
                console.log("🔄 [Client Merge] Đã tự chữa lành thành công! Chuyển đổi phòng sang đối thủ:", mergedId);
                
                if (unsubscribeQueue) unsubscribeQueue();
                
                currentActiveRoomId = mergedId;
                const newRoomDocRef = doc(db, 'match_rooms', mergedId);
                
                unsubscribeQueue = onSnapshot(newRoomDocRef, (docSnap) => {
                  if (docSnap.exists()) {
                    const roomData = docSnap.data();
                    if ((roomData.status === 'equipment_selecting' || roomData.status === 'playing') && roomData.player2) {
                      if (matchmakingTimerRef.current) clearInterval(matchmakingTimerRef.current);
                      handleMatchFoundReal(mergedId);
                    }
                  }
                }, (err) => {
                  console.error("Lỗi lắng nghe phòng đấu sau merge:", err);
                });
                
                const newRoomSnap = await getDoc(newRoomDocRef);
                if (newRoomSnap.exists() && (newRoomSnap.data().status === 'equipment_selecting' || newRoomSnap.data().status === 'playing')) {
                  if (matchmakingTimerRef.current) clearInterval(matchmakingTimerRef.current);
                  handleMatchFoundReal(mergedId);
                }
              }
            })();
          }
          
          return nextTime;
        });
      }, 1000);
 
      if (user) {
        const startMatchingProcess = async () => {
          try {
            const subject = arenaState.subject;
            let localHistory = [];
            let matchData = {};

            if (subject === 'chemistry') {
              localHistory = getSessionHistory('seen_chem_questions');
              matchData.questionPool = await generateChemistryMatchPool(localHistory);
            } else if (subject === 'physics') {
              localHistory = getSessionHistory('seen_phys_targets');
              matchData.questionPool = await generatePhysicsMatchPool(localHistory);
            } else if (subject === 'math') {
              localHistory = getSessionHistory('seen_math_questions');
              matchData.questionPool = await generateMathMatchPool(localHistory);
            } else if (subject === 'biology') {
              localHistory = getSessionHistory('seen_bio_questions');
              matchData.questionPool = await generateBiologyMatchPool(localHistory);
            }

            // Khi ghép trận -> KÍCH HOẠT VÀ TRỪ THẺ TRƯỚC TRẬN NGAY LẬP TỨC
            const preCardToUse = preMatchEquippedCard;
            if (preCardToUse) {
              setPreMatchEquippedCard(null); // Đã tiêu hao ở sảnh
              const isAdminUser = user?.role === 'admin' || user?.email?.includes('admin') || user?.displayName?.toLowerCase().includes('admin');
              if (!isAdminUser) {
                const userRef = doc(db, 'users', user.uid);
                getDoc(userRef).then((snap) => {
                  if (snap.exists()) {
                    const curInv = snap.data().inventory || [];
                    let updatedInv = [...curInv];
                    const idx = updatedInv.findIndex(i => i.cardId === preCardToUse);
                    if (idx !== -1) {
                      const newQty = (updatedInv[idx].quantity || 1) - 1;
                      if (newQty > 0) updatedInv[idx] = { ...updatedInv[idx], quantity: newQty };
                      else updatedInv.splice(idx, 1);
                      updateDoc(userRef, { inventory: updatedInv }).catch(e => console.warn("Lỗi trừ kho đồ thẻ trước trận:", e));
                    }
                  }
                });
              }
              const preCardDef = getEquipmentById(preCardToUse);
              addArenaLogStore(`⚡ Kích hoạt ngay lập tức Thẻ Trước Trận [${preCardDef?.name || preCardToUse}] khi ghép trận!`);
            }

            const joinedRoomId = await joinMatchmakingQueue(
              user.uid,
              personalization.name || user.displayName || 'Người chơi ẩn danh',
              personalization.elo,
              personalization.level,
              arenaState.subject,
              personalization.activeTitle || 'apprentice',
              personalization.avatarFrame || 'default',
              personalization.avatarParts || null,
              matchData,
              localHistory,
              theoryTimeLimit,
              preCardToUse
            );
 
            if (isCancelled) {
              await leaveMatchmakingQueue(user.uid);
              return;
            }
 
            if (joinedRoomId) {
              currentActiveRoomId = joinedRoomId;
              const roomDocRef = doc(db, 'match_rooms', joinedRoomId);
              
              let roomSnap = null;
              try {
                roomSnap = await getDoc(roomDocRef);
              } catch (err) {
                console.warn("⚠️ Mạng không ổn định khi đọc trạng thái phòng ban đầu, hệ thống tự động chuyển tiếp sang lắng nghe thời gian thực:", err);
              }
 
              if (roomSnap && roomSnap.exists()) {
                const roomData = roomSnap.data();
                if ((roomData.status === 'equipment_selecting' || roomData.status === 'playing') && roomData.player2) {
                  if (matchmakingTimerRef.current) clearInterval(matchmakingTimerRef.current);
                  handleMatchFoundReal(joinedRoomId);
                  return;
                }
              }
 
              unsubscribeQueue = onSnapshot(roomDocRef, (docSnap) => {
                if (docSnap.exists()) {
                  const roomData = docSnap.data();
                  if ((roomData.status === 'equipment_selecting' || roomData.status === 'playing') && roomData.player2) {
                    if (matchmakingTimerRef.current) clearInterval(matchmakingTimerRef.current);
                    handleMatchFoundReal(joinedRoomId);
                  }
                }
              }, (err) => {
                console.error("Lỗi lắng nghe phòng đấu:", err);
                setMatchmakingError('Lỗi kết nối phòng: ' + (err.message || err));
                if (matchmakingTimerRef.current) clearInterval(matchmakingTimerRef.current);
              });
            }
          } catch (err) {
            console.error("Lỗi khi tham gia hàng chờ ghép trận:", err);
            setMatchmakingError('Lỗi ghép trận: ' + (err.message || err));
            if (matchmakingTimerRef.current) clearInterval(matchmakingTimerRef.current);
          }
        };
 
        startMatchingProcess();
      }
    } else {
      // Dọn dẹp hàng chờ nếu chuyển trạng thái
      isCancelled = true;
      if (matchmakingTimerRef.current) clearInterval(matchmakingTimerRef.current);
      if (user && arenaState.status === 'idle') {
        leaveMatchmakingQueue(user.uid);
      }
      if (unsubscribeQueue) {
        unsubscribeQueue();
      }
    }

    return () => {
      isCancelled = true;
      if (matchmakingTimerRef.current) clearInterval(matchmakingTimerRef.current);
      if (unsubscribeQueue) unsubscribeQueue();
      if (user) {
        leaveMatchmakingQueue(user.uid);
      }
    };
  }, [arenaState.status, arenaState.subject, user]);

  // LẮNG NGHE TIN NHẮN TỪ IFRAME QUANTUMLAB VÀ CẬP NHẬT TIẾN TRÌNH
  useEffect(() => {
    const handleIframeMessage = (event) => {
      if (!event.data || typeof event.data !== 'object') return;

      const { type, equation, reactants, chemicalId, volume, energy, waste, violations } = event.data;

      if (arenaState.status !== 'playing' || arenaState.subject !== 'chemistry') return;

      const activeMission = chemMission;

      if (type === 'chemistry_reaction_complete') {
        console.log("🧪 [Chemistry Event] Phản ứng hoàn thành:", equation, reactants);
        
        if (activeRoomId === 'local_sandbox') {
          // Sandbox: tin iframe trực tiếp, không cần server
          if (activeMission && activeMission.isMatch({ equation, reactants })) {
            playSound.success();
            updatePlayerProgress(100);
            addArenaLog(`🎯 HOÀN THÀNH MỤC TIÊU: Đã điều chế thành công ${activeMission.name}! (Tiến độ: 100%)`);
          } else {
            playSound.hover();
            const nextProgress = Math.min(90, arenaState.playerProgress + 15);
            updatePlayerProgress(nextProgress);
            addArenaLog(`🧪 Phản ứng phụ phát hiện: ${equation}! Nhận +15% tiến độ bổ sung.`);
          }
        } else {
          // Online mode: gửi lên server để validate, không tin trực tiếp từ iframe
          // Server sẽ dùng checkChemistryMatch() và các ngưỡng vật lý để xác thực
          if (activeMission) {
            playSound.hover(); // Âm thanh tạm thời, chờ server xác nhận
            const submitAnswerFn = httpsCallable(functions, 'submitAnswer');
            submitAnswerFn({
              matchId: activeRoomId,
              questionId: activeMission.id,
              selectedAnswer: {
                type: 'chemistry_reaction_complete',
                equation,
                reactants,
                // Gửi kèm idclEnergy từ iframe để server detect gian lận console injection:
                // Học sinh thật sẽ có energy < 100 sau khi làm thí nghiệm (IDCL trừ điểm theo lãng phí)
                // Kẻ gian lận gửi thẳng qua postMessage sẽ không biết giá trị này
                idclEnergy: event.data.energy !== undefined ? event.data.energy : undefined
              }
            }).then(res => {
              updatePlayerProgress(res.data.currentProgress);
              if (res.data.correct) {
                playSound.success();
                addArenaLog(`🎯 [Server] HOÀN THÀNH MỤC TIÊU: Đã điều chế thành công ${activeMission.name}! (Tiến độ: 100%)`);
              } else {
                addArenaLog(`🧪 [Server] Phản ứng phụ: ${equation}! Nhận +15% tiến độ.`);
              }
            }).catch(err => {
              console.error("Lỗi submitAnswer chemistry (iframe):", err);
            });
          }
        }
      } else if (type === 'chemistry_safety_violation') {
        console.warn("🚨 [Chemistry Event] Vi phạm an toàn:", chemicalId, violations);
        playSound.click();
        
        if (activeRoomId === 'local_sandbox') {
          const nextProgress = Math.max(0, arenaState.playerProgress - 10);
          updatePlayerProgress(nextProgress);
          addArenaLog(`🚨 PHÒNG LAB BỊ KHÓA: Vi phạm an toàn khi dùng ${chemicalId}! Trừ 10% tiến độ.`);
        } else {
          // Online: gửi lên server để xử lý trừ điểm
          const submitAnswerFn = httpsCallable(functions, 'submitAnswer');
          submitAnswerFn({
            matchId: activeRoomId,
            questionId: 'chemistry_safety',
            selectedAnswer: { type: 'chemistry_safety_violation', chemicalId }
          }).then(res => {
            updatePlayerProgress(res.data.currentProgress);
            addArenaLog(`🚨 [Server] PHÒNG LAB BỊ KHÓA: Vi phạm an toàn! Trừ 10% tiến độ.`);
          }).catch(err => console.error("Lỗi submitAnswer safety violation:", err));
        }
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, [arenaState.status, arenaState.subject, activeRoomId, arenaState.playerProgress, chemMission]);

  // LẮNG NGHE SỰ KIỆN CHUYỂN TAB VÀ TRỪ THỜI GIAN / XỬ THUA RIÊNG CHO NGƯỜI RỜI TAB
  useEffect(() => {
    if (arenaState.status !== 'playing' || !activeRoomId || !user || isPlayer1Role === null) return;

    const handleVisibilityChange = async () => {
      if (document.hidden && arenaState.status === 'playing') {
        const isP1 = isPlayer1Role;
        const myTabSwitchesKey = isP1 ? 'player1TabSwitches' : 'player2TabSwitches';

        const currentCount = isP1 
          ? (latestRoomDataRef.current?.player1TabSwitches || 0) 
          : (latestRoomDataRef.current?.player2TabSwitches || 0);

        const N = currentCount + 1;
        playSound.click();

        const myLogsKey = isP1 ? 'player1Logs' : 'player2Logs';
        const currentLogs = isP1 
          ? (latestRoomDataRef.current?.player1Logs || []) 
          : (latestRoomDataRef.current?.player2Logs || []);

        if (N >= 10) {
          // Vi phạm 10 lần -> Xử thua ngay lập tức cho chính người rời tab!
          const forfeitLog = `🚨 XỬ THUA: Rời màn hình 10/10 lần! Bạn đã bị truất quyền thi đấu!`;
          addArenaLog(forfeitLog);

          if (activeRoomId !== 'local_sandbox') {
            const roomDocRef = doc(db, 'match_rooms', activeRoomId);
            const opponentUid = isP1 ? latestRoomDataRef.current?.player2?.uid : latestRoomDataRef.current?.player1?.uid;
            try {
              await updateDoc(roomDocRef, {
                [myTabSwitchesKey]: N,
                winnerId: opponentUid || 'opponent',
                status: 'result',
                forfeitReason: 'tab_violation_10_times',
                [myLogsKey]: [...currentLogs, forfeitLog]
              });
            } catch (err) {
              console.warn("Lỗi cập nhật xử thua do rời tab:", err);
            }
          }
          handleMatchEnd('defeat');
        } else {
          // Vi phạm < 10 lần -> Chỉ trừ 5% tiến độ cá nhân của chính người đó & cảnh báo Toast
          const penaltyPct = 5;
          const myProgKey = isP1 ? 'player1Progress' : 'player2Progress';
          const currentMyProg = isP1 
            ? (latestRoomDataRef.current?.player1Progress || arenaState.playerProgress) 
            : (latestRoomDataRef.current?.player2Progress || arenaState.playerProgress);
          const newMyProg = Math.max(0, currentMyProg - penaltyPct);

          const warningLogText = `⚠️ CẢNH BÁO VI PHẠM (LẦN ${N}/10): Rời màn hình! Trừ -${penaltyPct}% tiến độ của bạn.`;
          addArenaLog(warningLogText);

          setTabPenaltyWarning({
            count: N,
            deducted: penaltyPct,
            timestamp: Date.now()
          });

          setTimeout(() => {
            setTabPenaltyWarning(null);
          }, 5000);

          if (activeRoomId !== 'local_sandbox') {
            const roomDocRef = doc(db, 'match_rooms', activeRoomId);
            try {
              await updateDoc(roomDocRef, {
                [myTabSwitchesKey]: N,
                [myProgKey]: newMyProg,
                [myLogsKey]: [...currentLogs, warningLogText]
              });
            } catch (err) {
              console.warn("Lỗi cập nhật vi phạm rời tab:", err);
            }
          }
          updatePlayerProgress(newMyProg);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [arenaState.status, activeRoomId, user, isPlayer1Role, arenaState.playerProgress]);



  // LẮNG NGHE ĐỒNG BỘ PHÒNG ĐẤU TRẬN THỜI GIAN THỰC
  useEffect(() => {
    let unsubscribeRoom = null;

    if ((arenaState.status === 'playing' || arenaState.status === 'equipment_selecting') && activeRoomId && user) {
      const roomDocRef = doc(db, 'match_rooms', activeRoomId);

      unsubscribeRoom = onSnapshot(roomDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const roomData = docSnap.data();
          latestRoomDataRef.current = roomData;
          setCurrentRoomData(roomData);

          if (roomData.status === 'playing' && (arenaState.status === 'equipment_selecting' || arenaState.status === 'matching')) {
            setArenaStatus('playing');
            if (preMatchEquippedCard) {
              setPreMatchEquippedCard(null);
            }
          }
          
          // Xác định vai trò của bản thân (Player 1 hay Player 2)
          const isPlayer1 = roomData.player1.uid === user.uid;
          const isPlayer2 = roomData.player2 ? roomData.player2.uid === user.uid : false;
          const opponent = isPlayer1 ? roomData.player2 : roomData.player1;
          const oppCheckpoint = isPlayer1 ? roomData.player2Checkpoint : roomData.player1Checkpoint;
          const oppProgress = oppCheckpoint?.progress !== undefined 
            ? oppCheckpoint.progress 
            : (isPlayer1 ? roomData.player2Progress : roomData.player1Progress);
          const oppLogs = isPlayer1 ? roomData.player2Logs : roomData.player1Logs;

          // Đồng bộ hóa thời gian thi đấu từ Firestore nếu không phải Host
          const now = Date.now();
          const lastHeartbeat = roomData.lastHeartbeat || 0;
          const isHostOffline = (now - lastHeartbeat) > 10000;
          const amIHost = isPlayer1 || (isPlayer2 && isHostOffline);

          if (!amIHost && roomData.timeRemaining !== undefined && roomData.timeRemaining !== arenaState.timeRemaining) {
            setArenaTimeRemaining(roomData.timeRemaining);
          }

          if (opponent) {
            // Cập nhật thông tin đối thủ lên HUD
            setOpponentInfo({
              name: opponent.name,
              elo: opponent.elo,
              level: opponent.level,
              title: getRankInfo(opponent.elo).title
            });

            // Đồng bộ hóa tiến độ của đối thủ từ Firestore
            if (oppProgress !== arenaState.opponentProgress) {
              updateOpponentProgress(oppProgress);
            }

            // Đồng bộ hóa tiến độ của bản thân từ Firestore (bảo toàn khi cướp hoặc bị cướp điểm)
            const myProgress = isPlayer1 ? roomData.player1Progress : roomData.player2Progress;
            if (typeof myProgress === 'number' && myProgress !== arenaState.playerProgress) {
              updatePlayerProgress(myProgress);
            }
          }

          // Đồng bộ hóa log hành động của đối thủ lên màn hình của mình
          if (oppLogs && oppLogs.length > 0) {
            const latestOppLog = oppLogs[0];
            if (latestOppLog && !arenaState.logs.includes(latestOppLog)) {
              addArenaLogStore(latestOppLog);
            }
          }

          // Đồng bộ hóa tin nhắn chat và emoji tương tác thời gian thực
          const myChatData = isPlayer1 ? roomData.player1Chat : roomData.player2Chat;
          const oppChatData = isPlayer1 ? roomData.player2Chat : roomData.player1Chat;
          const nowTime = Date.now();
          if (myChatData && myChatData.timestamp && (nowTime - myChatData.timestamp < 4000)) {
            setPlayerChat(myChatData);
          }
          if (oppChatData && oppChatData.timestamp && (nowTime - oppChatData.timestamp < 4000)) {
            setOpponentChat(oppChatData);
          }

          // TẦNG 1 TRAP: Phát hiện đối thủ chủ động rời trận / đóng trình duyệt (Rage Quit)
          if (roomData.playerAbandoned && roomData.playerAbandoned.uid !== user.uid && roomData.status === 'playing' && !isFinalizingRef.current) {
            isFinalizingRef.current = true;
            addArenaLogStore('⚠️ ĐỐI THỦ ĐÃ RỜI PHÒNG ĐẤU / ĐÓNG TRÌNH DUYỆT! Bạn được xử thắng!');
            playSound.success?.();
            clientFunctions.finalizeMatch(db, auth)({
              matchId: activeRoomId,
              force: true,
              forfeitUid: roomData.playerAbandoned.uid,
              reason: 'OPPONENT_ABANDONED'
            }).catch(err => console.warn("Lỗi xử thắng khi đối thủ abandon:", err));
          }

          // Kiểm tra xem phòng thi đấu đã hoàn thành hoặc có người chiến thắng chưa
          if (roomData.winnerId || roomData.matchWinner || roomData.status === 'result') {
            const eloChange = isPlayer1 ? roomData.player1EloChange : roomData.player2EloChange;
            const expChange = isPlayer1 ? roomData.player1ExpChange : roomData.player2ExpChange;
            const crystalChange = isPlayer1 ? roomData.player1CrystalChange : roomData.player2CrystalChange;

            const finalWinner = roomData.matchWinner || roomData.winnerId;
            let resultState = 'draw';
            if (finalWinner === user.uid) {
              resultState = 'victory';
            } else if (finalWinner === 'draw') {
              resultState = 'draw';
            } else {
              resultState = 'defeat';
            }

            handleMatchEnd(resultState, {
              eloChange: eloChange || 0,
              expChange: expChange || 0,
              crystalChange: crystalChange || 0
            });
          }
        }
      });
    }

    return () => {
      if (unsubscribeRoom) unsubscribeRoom();
    };
  }, [arenaState.status, activeRoomId, user, arenaState.timeRemaining, arenaState.opponentProgress]);

  // TIẾN TRÌNH ĐƯỢC CẬP NHẬT THÔNG QUA CLOUD FUNCTION submitAnswer
  useEffect(() => {
    if (arenaState.status === 'playing' && activeRoomId && activeRoomId !== 'local_sandbox' && user && isPlayer1Role !== null) {
      // Server sẽ cập nhật tiến trình của bản thân lên Firestore phòng đấu thông qua submitAnswer
    }
  }, [arenaState.playerProgress, arenaState.status, activeRoomId, user, isPlayer1Role]);

  // KHI TÌM THẤY ĐỐI THỦ THẬT
  const handleMatchFoundReal = async (roomId) => {
    setActiveRoomId(roomId);
    
    let roomData = null;
    try {
      const roomRef = doc(db, 'match_rooms', roomId);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        roomData = roomSnap.data();
        const isPlayer1 = roomData.player1.uid === user.uid;
        const opponent = isPlayer1 ? roomData.player2 : roomData.player1;
        
        setIsPlayer1Role(isPlayer1);
        
        if (roomData.timeRemaining !== undefined) {
          setArenaTimeRemaining(roomData.timeRemaining);
        } else {
          setArenaTimeRemaining(180);
        }
        
        if (opponent) {
          setOpponentInfo({
            name: opponent.name,
            elo: opponent.elo,
            level: opponent.level,
            title: getRankInfo(opponent.elo).title
          });
        }
      }
    } catch (err) {
      console.warn("Lỗi đọc phòng chơi khởi tạo:", err);
    }

    playSound.success();
    
    // Khởi chạy Cinematic Transition tìm thấy trận đấu
    const isPlayer1 = roomData ? (roomData.player1.uid === user.uid) : true;
    const opponent = roomData ? (isPlayer1 ? roomData.player2 : roomData.player1) : null;
    setMatchFoundData({
      roomId,
      roomData,
      isPlayer1,
      opponent
    });
    setMatchFoundCountdown(3);
    
    // Reset to�n bộ trạng th�i game với dữ liệu ngẫu nhi�n mới
    const chemTargetOptions = [10, 20, 30, 40];
    let sum = 0;
    for (let i = 0; i < roomId.length; i++) {
      sum += roomId.charCodeAt(i);
    }
    const newChemTarget = chemTargetOptions[sum % chemTargetOptions.length];
    const newPhysTarget = selectPhysicsTargetFromRoomId(roomId);
    const newChemMission = selectMissionFromRoomId(roomId);
    
    setChemHCl(0);
    setChemNaOH(0);
    setChemBurner(false);
    setChemTemp(25);
    setChemEvap(0);
    setChemAddCount(0);
    setPhysPower(false);
    setPhysMirrors([0, 0, 0]);
    setPhysHint(0);
    setMathTargetIndex(0);
    setMathInputs({ x: '', y: '' });
    setMathLaserPath(null);
    setMathCombo(0);
    setMathWrongCount(0);
    setBioSelected(null);
    setBioRevealed(false);
    setPlayerChat(null);
    setOpponentChat(null);

    // --- ĐỒNG BỘ HÓA MÔN HỌC VÀ LỌC TRÙNG CHÉO ---
    let subject = roomData?.subject || arenaState.subject;

    // SỬA LỖI MATCHMAKING RANDOM: Đảm bảo subject được giải mã từ 'random' thành 1 trong 4 môn thi chính xác!
    if (!subject || subject === 'random' || !['math', 'physics', 'chemistry', 'biology'].includes(subject)) {
      const validSubjects = ['math', 'physics', 'chemistry', 'biology'];
      let seed = 0;
      for (let i = 0; i < roomId.length; i++) seed += roomId.charCodeAt(i);
      subject = validSubjects[seed % validSubjects.length];

      try {
        const roomRef = doc(db, 'match_rooms', roomId);
        await updateDoc(roomRef, { subject: subject });
      } catch (err) {
        console.warn("⚠️ Lỗi cập nhật môn học cho phòng random:", err);
      }
    }

    // ĐỒNG BỘ HÓA TRỰC TIẾP VÀO ZUSTAND STORE
    useAppStore.setState((state) => ({
      arenaState: {
        ...state.arenaState,
        subject: subject
      }
    }));

    const matchData = roomData?.matchData || {};
    const player1Seen = roomData?.player1Seen || [];
    const player2Seen = roomData?.player2Seen || [];

    if (subject === 'chemistry') {
      let questions = [];
      if (matchData.questionPool && Array.isArray(matchData.questionPool) && matchData.questionPool.length > 0) {
        questions = matchData.questionPool;
      } else {
        const localHistory = getSessionHistory('seen_chem_questions');
        questions = await generateChemistryMatchPool(localHistory);
      }
      setChemGame({
        questions: questions,
        currentQ: 0,
        score: 0,
        answered: []
      });
      setChemSelected(null);
      setChemRevealed(false);
      setChemTfAnswers([null, null, null, null]);
      updateSessionHistory('seen_chem_questions', questions.map(q => q.text || q.context), 30);

    } else if (subject === 'physics') {
      let questions = [];
      if (matchData.questionPool && Array.isArray(matchData.questionPool) && matchData.questionPool.length > 0) {
        questions = matchData.questionPool;
      } else {
        const localHistory = getSessionHistory('seen_phys_targets');
        questions = await generatePhysicsMatchPool(localHistory);
      }
      setPhysGame({
        questions: questions,
        currentQ: 0,
        score: 0,
        answered: []
      });
      setPhysSelected(null);
      setPhysRevealed(false);
      updateSessionHistory('seen_phys_targets', questions.map(q => q.text), 30);

    } else if (subject === 'math') {
      let questions = [];
      if (matchData.questionPool && Array.isArray(matchData.questionPool) && matchData.questionPool.length > 0) {
        questions = matchData.questionPool;
      } else {
        const localHistory = getSessionHistory('seen_math_questions');
        questions = await generateMathMatchPool(localHistory);
      }
      setMathGame({
        questions: questions,
        currentQ: 0,
        score: 0,
        answered: []
      });
      setMathSelected(null);
      setMathRevealed(false);
      updateSessionHistory('seen_math_questions', questions.map(q => q.text), 30);

    } else if (subject === 'biology') {
      let questions = [];
      if (matchData.questionPool && Array.isArray(matchData.questionPool) && matchData.questionPool.length > 0) {
        questions = matchData.questionPool;
      } else {
        const localHistory = getSessionHistory('seen_bio_questions');
        questions = await generateBiologyMatchPool(localHistory);
      }
      setBioGame({
        questions: questions,
        currentQ: 0,
        score: 0,
        answered: []
      });
      setBioSelected(null);
      setBioRevealed(false);
      setBioTfAnswers([null, null, null, null]);
      updateSessionHistory('seen_bio_questions', questions.map(q => q.text || q.context), 30);
    }
    addArenaLogStore('Trận đấu bắt đầu! Giải mã phòng thí nghiệm ngay!');
  };

  // TỰ ĐỘNG KHỞI CHẠY THÁCH ĐẤU NẾU CÓ PARAMETERS ROOMID VÀ SUBJECT HOẶC TỰ ĐỘNG KHÔI PHỤC PHÒNG CHƠI ĐANG ACTIVE
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const params = new URLSearchParams(window.location.search);
      const rIdParam = params.get('roomId');
      const subParam = params.get('subject');
      
      if (rIdParam && subParam) {
        console.log("⚔️ Phát hiện lời thách đấu trực tiếp:", rIdParam, "môn:", subParam);
        if (matchmakingTimerRef.current) clearInterval(matchmakingTimerRef.current);
        startChallengeGame(subParam);
        handleMatchFoundReal(rIdParam);
      } else {
        // Fallback: Tìm kiếm xem có phòng đấu nào đang active (playing) của user này không (mới tạo dưới 60s)
        const checkActiveRoom = async () => {
          try {
            const roomsCollection = collection(db, 'match_rooms');
            const q = query(
              roomsCollection,
              where('status', '==', 'playing')
            );
            const querySnapshot = await getDocs(q);
            let foundRoom = null;
            
            querySnapshot.forEach((docSnap) => {
              const rData = docSnap.data();
              if (rData.player1?.uid === user.uid || rData.player2?.uid === user.uid) {
                const diffMs = Date.now() - new Date(rData.createdAt || 0).getTime();
                if (diffMs < 60000) { // Phòng đấu được tạo trong vòng 1 phút
                  foundRoom = { id: docSnap.id, subject: rData.subject };
                }
              }
            });
            
            if (foundRoom) {
              console.log("🔄 Phát hiện phòng đấu đang hoạt động của người dùng, tự động kết nối:", foundRoom.id);
              if (matchmakingTimerRef.current) clearInterval(matchmakingTimerRef.current);
              startChallengeGame(foundRoom.subject);
              handleMatchFoundReal(foundRoom.id);
            }
          } catch (err) {
            console.error("Lỗi khi tìm phòng active:", err);
          }
        };
        
        checkActiveRoom();
      }
    }
  }, [user, rId, sub, tParam]);

  // 2. VÒNG LẶP TRONG TRẬN ĐẤU (GAMEPLAY LOOP - BỎ GIẢ LẬP TIẾN ĐỘ ĐỐI THỦ)
  useEffect(() => {
    if (arenaState.status === 'playing') {
      gameLoopTimerRef.current = setInterval(async () => {
        if (activeRoomId === 'local_sandbox') {
          // Luyện tập không đếm ngược thời gian
          if (arenaState.subject === 'chemistry') {
            handleChemistryRealtimeTick();
          }
          return;
        }

        // Chế độ online
        const roomData = latestRoomDataRef.current;
        if (!roomData) return;

        const isPlayer1 = roomData.player1.uid === user.uid;
        const isPlayer2 = roomData.player2 ? roomData.player2.uid === user.uid : false;
        const now = Date.now();
        const lastHeartbeat = roomData.lastHeartbeat || 0;
        const isHostOffline = (now - lastHeartbeat) > 10000;
        const amIHost = isPlayer1 || (isPlayer2 && isHostOffline);

        if (amIHost) {
          tickArenaTime();
          const nextTime = Math.max(0, arenaState.timeRemaining - 1);
          
          if (nextTime <= 0) {
            const pProg = arenaState.playerProgress || 0;
            const oProg = arenaState.opponentProgress || 0;
            const res = pProg > oProg ? 'victory' : (pProg === oProg ? 'draw' : 'defeat');
            handleMatchEnd(res);
            if (activeRoomId && activeRoomId !== 'local_sandbox') {
              clientFunctions.finalizeMatch(db, auth)({ matchId: activeRoomId, force: true }).catch(() => {});
            }
            return;
          }

          // STATE BATCHING: Không ghi đè Firestore mỗi giây (tiết kiệm 98.6% lượt ghi).
          // Chỉ đồng bộ Checkpoint tại các mốc quan trọng (120s, 60s, 20s) hoặc khi hoàn thành
          if (nextTime === 120 || nextTime === 60 || nextTime === 20) {
            const currentScore = chemGame.score || physGame.score || mathGame.score || bioGame.score || 0;
            clientFunctions.syncPvPCheckpoint(db, auth)({
              matchId: activeRoomId,
              checkpointKey: `checkpoint_${nextTime}`,
              progress: arenaState.playerProgress,
              score: currentScore,
              timeRemaining: nextTime
            });
          }
        }

        // TẦNG 2 WATCHDOG: Giám sát tín hiệu đối thủ (Timeout Fallback khi rớt mạng > 25s)
        const oppLastActive = isPlayer1 ? roomData.player2LastActive : roomData.player1LastActive;
        const matchStart = roomData.matchStartTime || 0;
        const opponentObj = isPlayer1 ? roomData.player2 : roomData.player1;
        if (opponentObj && oppLastActive && matchStart && (now - matchStart > 25000) && (now - oppLastActive > 25000) && roomData.status === 'playing' && !isFinalizingRef.current) {
          isFinalizingRef.current = true;
          addArenaLogStore('⏱️ ĐỐI THỦ MẤT KẾT NỐI QUÁ 25 GIÂY! Hệ thống xử thắng tự động cho bạn!');
          playSound.success?.();
          clientFunctions.claimTimeoutVictory(db, auth)({
            matchId: activeRoomId,
            opponentUid: opponentObj.uid
          }).catch(err => console.warn("Lỗi claim timeout victory:", err));
        }

        if (arenaState.subject === 'chemistry') {
          handleChemistryRealtimeTick();
        }
      }, 1000);
    } else {
      if (gameLoopTimerRef.current) clearInterval(gameLoopTimerRef.current);
    }

    return () => {
      if (gameLoopTimerRef.current) clearInterval(gameLoopTimerRef.current);
    };
  }, [arenaState.status, arenaState.timeRemaining, chemBurner, chemTemp, chemEvap, chemHCl, chemNaOH, activeRoomId, user]);

  // TẦNG 1 TRAP: Bắt sự kiện học sinh đóng tab / thoát trình duyệt (Rage Quit / Window Close)
  useEffect(() => {
    const handleUnloadTrap = () => {
      if (arenaState.status === 'playing' && activeRoomId && activeRoomId !== 'local_sandbox' && user) {
        clientFunctions.reportPlayerAbandon(db, auth)({ matchId: activeRoomId });
      }
    };

    window.addEventListener('beforeunload', handleUnloadTrap);
    window.addEventListener('pagehide', handleUnloadTrap);
    return () => {
      window.removeEventListener('beforeunload', handleUnloadTrap);
      window.removeEventListener('pagehide', handleUnloadTrap);
    };
  }, [arenaState.status, activeRoomId, user]);

  // Cảnh báo hết giờ hoặc thua cuộc/thắng cuộc thời gian thực khi player hoặc đối thủ đạt 100%
  useEffect(() => {
    if (arenaState.status === 'playing') {
      const checkMatchEnd = async () => {
        if (isFinalizingRef.current) return;
        const isTimeExpired = arenaState.timeRemaining <= 0;
        const isProgressComplete = arenaState.playerProgress >= 100 || arenaState.opponentProgress >= 100;

        if (isTimeExpired || isProgressComplete) {
          isFinalizingRef.current = true;
          const pProg = arenaState.playerProgress || 0;
          const oProg = arenaState.opponentProgress || 0;
          const immediateRes = pProg > oProg ? 'victory' : (pProg === oProg ? 'draw' : 'defeat');

          handleMatchEnd(immediateRes);

          if (activeRoomId && activeRoomId !== 'local_sandbox') {
            try {
              const finalizeMatchFn = httpsCallable(functions, 'finalizeMatch');
              await finalizeMatchFn({ matchId: activeRoomId, force: true });
            } catch (err) {
              clientFunctions.finalizeMatch(db, auth)({ matchId: activeRoomId, force: true }).catch(() => {});
            }
          }
        }
      };
      const timer = setTimeout(checkMatchEnd, 0);
      return () => clearTimeout(timer);
    } else {
      isFinalizingRef.current = false;
    }
  }, [arenaState.timeRemaining, arenaState.playerProgress, arenaState.opponentProgress, arenaState.status, activeRoomId]);

  // Reset tab exit count khi bắt đầu trận đấu mới
  useEffect(() => {
    if (arenaState.status === 'playing') {
      setTabExitCount(0);
      setTabExitModal(null);
    }
  }, [arenaState.status]);

  // ⚡ CƠ CHẾ CHỐNG GIAN LẬN: THOÁT TAB BỊ TRỪ THỜI GIAN LŨY TIẾN (5s / 10s / 20s / 40s / 80s, lần 6 xử thua)
  useEffect(() => {
    if (arenaState.status !== 'playing' || !activeRoomId) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        const nextCount = tabExitCount + 1;
        setTabExitCount(nextCount);

        if (nextCount >= 6) {
          // Vi phạm lần thứ 6: Xử thua ngay lập tức
          setTabExitModal({
            count: nextCount,
            penalty: 0,
            forfeited: true
          });
          addArenaLogStore('🚨 VI PHẠM RỜI TAB QUÁ 5 LẦN! XỬ THUA LẬP TỨC DO GIAN LẬN!');

          if (activeRoomId && activeRoomId !== 'local_sandbox') {
            try {
              const roomRef = doc(db, 'match_rooms', activeRoomId);
              const roomSnap = await getDoc(roomRef);
              const roomData = roomSnap.exists() ? roomSnap.data() : {};
              const winnerId = isPlayer1Role ? (roomData.player2?.uid || 'bot') : (roomData.player1?.uid || 'bot');

              await updateDoc(roomRef, {
                [isPlayer1Role ? 'player1Progress' : 'player2Progress']: 0,
                winnerId: winnerId,
                status: 'result',
                [isPlayer1Role ? 'player1Logs' : 'player2Logs']: arrayUnion('🚨 VI PHẠM RỜI TAB 6 LẦN — XỬ THUA LẬP TỨC!')
              });
              
              const finalizeMatchFn = httpsCallable(functions, 'finalizeMatch');
              await finalizeMatchFn({ matchId: activeRoomId, force: true });
            } catch (err) {
              console.error("Lỗi xử thua khi vi phạm 6 lần rời tab:", err);
            }
          } else {
            handleMatchEnd('defeat');
          }
        } else {
          // Công thức phạt: 5 * 2^(nextCount - 1) => 5s, 10s, 20s, 40s, 80s
          const penaltySec = 5 * Math.pow(2, nextCount - 1);
          const currentTimer = arenaState.timeRemaining;
          const newTimer = Math.max(0, currentTimer - penaltySec);
          setArenaTimeRemaining(newTimer);

          setTabExitModal({
            count: nextCount,
            penalty: penaltySec,
            forfeited: false
          });

          addArenaLogStore(`⚠️ VI PHẠM RỜI TAB LẦN ${nextCount}/5: BỊ TRỪ ${penaltySec}s THỜI GIAN THI ĐẤU!`);

          if (activeRoomId && activeRoomId !== 'local_sandbox') {
            try {
              const roomRef = doc(db, 'match_rooms', activeRoomId);
              const myRoleLogKey = isPlayer1Role ? 'player1Logs' : 'player2Logs';
              await updateDoc(roomRef, {
                timeRemaining: newTimer,
                [myRoleLogKey]: arrayUnion(`⚠️ VI PHẠM RỜI TAB LẦN ${nextCount}/5: BỊ TRỪ ${penaltySec} GIÂY!`)
              });
            } catch (err) {
              console.error("Lỗi cập nhật hình phạt rời tab:", err);
            }
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [arenaState.status, activeRoomId, tabExitCount, arenaState.timeRemaining, isPlayer1Role]);

  // 3. ĐỒNG BỘ TIẾN ĐỘ VẬT LÝ THEO TRẠNG THÁI MẠCH QUANG HỌC
  // Debounce 300ms để chặn spam Cloud Function khi người dùng xoay gương liên tục.
  // useEffect cleanup tự hủy timer cũ mỗi khi deps thay đổi — đây là debounce đúng chuẩn.
  useEffect(() => {
    if (arenaState.status === 'playing' && arenaState.subject === 'physics') {
      const isHit = physPower && physMirrors[0] === physTarget[0] &&
                    physMirrors[1] === physTarget[1] &&
                    physMirrors[2] === physTarget[2];
      const nextProgress = isHit ? 100 : 0;

      // Sandbox: cập nhật local ngay lập tức, không debounce
      if (activeRoomId === 'local_sandbox') {
        updatePlayerProgress(nextProgress);
        if (isHit) {
          addArenaLog('🎯 CHÙM TIA ĐÃ KHỚP! Laser phản xạ dội thẳng vào Lõi năng lượng!');
        }
        return;
      }

      // Online: đợi 300ms sau lần thay đổi cuối cùng mới gọi server
      // Nếu người dùng xoay thêm gương trong 300ms, timer bị hủy → không có request thừa
      if (nextProgress === arenaState.playerProgress) return; // Tiến độ không đổi, bỏ qua

      const debounceTimer = setTimeout(async () => {
        try {
          const submitAnswerFn = httpsCallable(functions, 'submitAnswer');
          const res = await submitAnswerFn({
            matchId: activeRoomId,
            questionId: 'physics_laser',
            selectedAnswer: { physMirrors, power: physPower }
          });
          const { currentProgress } = res.data;
          updatePlayerProgress(currentProgress);
          if (isHit) {
            addArenaLog('[Server] 🎯 CHÙM TIA ĐÃ KHỚP! Laser phản xạ dội thẳng vào Lõi năng lượng!');
          }
        } catch (err) {
          console.error("Lỗi submitAnswer physics:", err);
        }
      }, 300);

      // Cleanup: hủy timer cũ ngay khi gương được xoay tiếp
      return () => clearTimeout(debounceTimer);
    }
  }, [physPower, physMirrors, arenaState.status, arenaState.subject, arenaState.playerProgress, activeRoomId]);

  // KẾT THÚC TRẬN ĐẤU
  const handleMatchEnd = async (result, serverRewardData = null) => {
    if (arenaState.status !== 'playing') return;

    if (gameLoopTimerRef.current) clearInterval(gameLoopTimerRef.current);
    if (botPlaybackTimersRef.current) botPlaybackTimersRef.current.forEach(t => clearTimeout(t));
    setMatchResult(result);
    setArenaStatus('result');
    isFinalizingRef.current = false;

    // Gửi thông điệp ẩn Optimization Lab overlay trong iframe chemistry
    const iframe = document.getElementById('chemistry-lab-iframe');
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage({ type: 'hide_optimization_lab' }, '*');
      } catch (err) {
        console.warn("Lỗi gửi yêu cầu ẩn Optimization Lab:", err);
      }
    }
    
    if (result === 'victory') {
      playSound.success();
    } else {
      playSound.click();
    }

    if (activeRoomId === 'local_sandbox') {
      return;
    }

    // Chế độ online: cập nhật local personalization state qua serverRewardData (hoặc fallback chuẩn)
    const eloDelta = result === 'victory' ? 25 : (result === 'draw' ? 0 : -15);
    const expDelta = result === 'victory' ? 250 : (result === 'draw' ? 100 : 50);
    const crystalDelta = result === 'victory' ? 50 : 0;
    const effectiveData = serverRewardData || { eloChange: eloDelta, expChange: expDelta, crystalChange: crystalDelta };

    const { eloChange, expChange, crystalChange } = effectiveData;

    if (result === 'victory') {
      localStorage.setItem('daily_quest_pvp_win', 'completed');
    }

    const newElo = Math.max(0, personalization.elo + eloChange);
    const newExp = personalization.exp + expChange;
    
    let newLevel = personalization.level;
    let nextLevelExp = personalization.nextLevelExp;
    
    while (newExp >= nextLevelExp) {
      newLevel += 1;
      nextLevelExp = newLevel * 1000;
    }

    const updatedStats = {
      ...personalization,
      elo: newElo,
      exp: newExp,
      level: newLevel,
      nextLevelExp: nextLevelExp,
      wins: result === 'victory' ? personalization.wins + 1 : personalization.wins,
      losses: result === 'defeat' ? personalization.losses + 1 : personalization.losses,
      crystals: (personalization.crystals || 0) + crystalChange
    };

    setPersonalization(updatedStats);

    // THƯỞNG 1 THẺ BÀI NGẪU NHIÊN VÀO KHO ĐỒ KHI HOÀN THÀNH TRẬN ĐẤU (Non-blocking)
    if (user?.uid) {
      try {
        const randomCard = EQUIPMENT_CATALOG[Math.floor(Math.random() * EQUIPMENT_CATALOG.length)];
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const uData = userSnap.data();
          const currentInv = uData.inventory || [];
          const existingIdx = currentInv.findIndex(item => item.cardId === randomCard.id);
          let newInv = [...currentInv];
          if (existingIdx !== -1) {
            newInv[existingIdx] = {
              ...newInv[existingIdx],
              quantity: (newInv[existingIdx].quantity || 0) + 1
            };
          } else {
            newInv.push({ cardId: randomCard.id, quantity: 1 });
          }
          await updateDoc(userRef, { inventory: newInv }).catch(() => {});
          console.log(`🎁 [Match Reward] Đã thưởng 1 Thẻ bài ${randomCard.name} vào Kho đồ!`);
        }
      } catch (e) {
        // Silently catch
      }
    }
  };

    // ----------------------------------------------------
  // LOGIC MINI-GAME 1: HÓA HỌC (Stochiometric pH Titration)
  // ----------------------------------------------------
  const handleChemistryRealtimeTick = async () => {
    if (document.getElementById('chemistry-lab-iframe')) {
      return;
    }
    if (chemBurner) {
      setChemTemp((prev) => {
        const nextTemp = Math.min(150, prev + 15);
        if (nextTemp > 120) {
          playSound.click();
          addArenaLog('💥 QUÁ NHIỆT! Áp suất trong Beaker quá cao gây nổ lò! Làm lại từ đầu!');
          setChemHCl(0);
          setChemNaOH(0);
          setChemBurner(false);
          setChemEvap(0);
          
          if (activeRoomId === 'local_sandbox') {
            updatePlayerProgress(0);
          } else {
            // Online: Gọi submitAnswer cho safety violation
            const submitAnswerFn = httpsCallable(functions, 'submitAnswer');
            submitAnswerFn({
              matchId: activeRoomId,
              questionId: 'chemistry_safety',
              selectedAnswer: { type: 'chemistry_safety_violation' }
            }).then(res => {
              updatePlayerProgress(res.data.currentProgress);
            }).catch(err => console.error(err));
          }
          return 25;
        }
        return nextTemp;
      });
    } else {
      setChemTemp((prev) => Math.max(25, prev - 8));
    }

    const isBalanced = chemHCl === chemTarget && chemNaOH === chemTarget;
    const isAtEvapTemp = chemTemp >= 95 && chemTemp <= 105;

    if (isBalanced && isAtEvapTemp) {
      setChemEvap((prev) => {
        const nextEvap = Math.min(100, prev + 10);
        
        if (activeRoomId === 'local_sandbox') {
          updatePlayerProgress(nextEvap);
        }

        if (nextEvap === 10) {
          addArenaLog('💧 Dung dịch trung hòa bắt đầu sôi! Hơi nước H₂O bốc lên cuồn cuộn!');
        } else if (nextEvap === 100) {
          addArenaLog('✨ Kết tinh thành công tinh thể NaCl muối ăn lập phương hoàn hảo!');
          if (activeRoomId !== 'local_sandbox') {
            // Online: Gọi submitAnswer chemistry_reaction_complete kèm dữ liệu thô để server validate
            const submitAnswerFn = httpsCallable(functions, 'submitAnswer');
            submitAnswerFn({
              matchId: activeRoomId,
              questionId: 'chemistry_neutralization',
              selectedAnswer: { 
                type: 'chemistry_reaction_complete',
                equation: 'HCl + NaOH -> NaCl + H2O',
                reactants: ['HCl', 'NaOH'],
                // Gửi kèm dữ liệu thô để server validate ngưỡng vật lý
                chemTemp,
                chemHCl,
                chemNaOH,
                chemEvap: nextEvap
              }
            }).then(res => {
              updatePlayerProgress(res.data.currentProgress);
              if (res.data.correct) {
                addArenaLog('[Server] ✨ Xác thực phản ứng hóa học kết tinh NaCl thành công!');
              }
            }).catch(err => console.error(err));
          }
        }
        return nextEvap;
      });
    } else if (!isBalanced && chemTemp >= 95) {
      setChemEvap(0);
      if (activeRoomId === 'local_sandbox') {
        updatePlayerProgress(0);
      }
    }
  };

  const getChemPH = () => {
    if (chemHCl === 0 && chemNaOH === 0) return 7.0;
    if (chemHCl === chemNaOH) return 7.0;
    if (chemHCl > chemNaOH) {
      return Math.max(1.0, (7.0 - ((chemHCl - chemNaOH) / 10) * 1.8)).toFixed(1);
    } else {
      return Math.min(14.0, (7.0 + ((chemNaOH - chemHCl) / 10) * 1.8)).toFixed(1);
    }
  };

  const getChemFluidColor = (ph) => {
    const phVal = parseFloat(ph);
    if (phVal === 7.0) return 'from-emerald-500/60 to-emerald-400/40 border-emerald-400';
    if (phVal < 7.0) return 'from-rose-500/60 to-rose-400/40 border-rose-400';
    return 'from-blue-500/60 to-blue-400/40 border-blue-400';
  };

  const handleChemAddHCl = () => {
    playSound.click();
    setChemHCl((prev) => {
      const next = Math.min(50, prev + 10);
      setChemAddCount((c) => c + 1);
      addArenaLog(`Thêm 10ml HCl → Tổng: ${next}ml (cần: ${chemTarget}ml)`);
      return next;
    });
  };

  const handleChemAddNaOH = () => {
    playSound.click();
    setChemNaOH((prev) => {
      const next = Math.min(50, prev + 10);
      setChemAddCount((c) => c + 1);
      addArenaLog(`Thêm 10ml NaOH → Tổng: ${next}ml (cần: ${chemTarget}ml)`);
      return next;
    });
  };

  // ----------------------------------------------------
  // LOGIC MINI-GAME 2: VẬT LÝ (Circuit Laser Reflection)
  // ----------------------------------------------------
  const handlePhysRotateMirror = (index) => {
    playSound.click();
    setPhysMirrors((prev) => {
      const next = [...prev];
      next[index] = (next[index] + 45) % 180;
      return next;
    });
  };

  const handlePhysPowerToggle = () => {
    playSound.click();
    const nextPower = !physPower;
    setPhysPower(nextPower);
    if (nextPower) {
      addArenaLog('💡 Kích hoạt điện áp! Súng phát xạ Laser liên tục bật!');
    }
  };

  // ----------------------------------------------------
  // LOGIC MINI-GAME 3: TOÁN HỌC (Descartes Space Coordinate Radar)
  // ----------------------------------------------------
  const handleMathInputSubmit = async (e) => {
    e.preventDefault();
    const target = mathAsteroids[mathTargetIndex];
    if (!target) return;

    const userX = parseInt(mathInputs.x);
    const userY = parseInt(mathInputs.y);

    if (activeRoomId === 'local_sandbox') {
      if (userX === target.ans.x && userY === target.ans.y) {
        playSound.success();
        const newCombo = mathCombo + 1;
        setMathCombo(newCombo);
        
        setMathLaserPath(target.coord);
        setTimeout(() => setMathLaserPath(null), 800);

        const comboBonus = newCombo >= 3 ? ` 🔥 COMBO x${newCombo}!` : '';
        addArenaLog(`💥 Tiêu diệt (${userX}, ${userY})!${comboBonus}`);

        const nextAsteroids = [...mathAsteroids];
        nextAsteroids[mathTargetIndex].status = 'destroyed';
        
        const nextIndex = mathTargetIndex + 1;
        if (nextIndex < mathAsteroids.length) {
          nextAsteroids[nextIndex].status = 'active';
          setMathTargetIndex(nextIndex);
          setMathAsteroids(nextAsteroids);
          updatePlayerProgress(Math.floor((nextIndex / mathAsteroids.length) * 100));
        } else {
          setMathAsteroids(nextAsteroids);
          updatePlayerProgress(100);
          const wrongMsg = mathWrongCount > 0 ? ` (${mathWrongCount} sai)` : ' - PERFECT!';
          addArenaLog(`🛡️ Xóa sạch thiên thạch!${wrongMsg}`);
        }
        setMathInputs({ x: '', y: '' });
      } else {
        playSound.click();
        setMathCombo(0);
        setMathWrongCount((prev) => prev + 1);
        addArenaLog(`❌ Sai! Tọa độ (${userX}, ${userY}) không trùng mục tiêu! (Sai lần ${mathWrongCount + 1})`);
      }
      return;
    }

    try {
      const submitAnswerFn = httpsCallable(functions, 'submitAnswer');
      const res = await submitAnswerFn({
        matchId: activeRoomId,
        questionId: String(mathTargetIndex),
        selectedAnswer: { x: userX, y: userY }
      });

      const { correct, currentProgress } = res.data;
      updatePlayerProgress(currentProgress);

      if (correct) {
        playSound.success();
        const newCombo = mathCombo + 1;
        setMathCombo(newCombo);
        
        setMathLaserPath(target.coord);
        setTimeout(() => setMathLaserPath(null), 800);

        const comboBonus = newCombo >= 3 ? ` 🔥 COMBO x${newCombo}!` : '';
        addArenaLog(`💥 Tiêu diệt (${userX}, ${userY})!${comboBonus}`);

        const nextAsteroids = [...mathAsteroids];
        nextAsteroids[mathTargetIndex].status = 'destroyed';
        
        const nextIndex = mathTargetIndex + 1;
        if (nextIndex < mathAsteroids.length) {
          nextAsteroids[nextIndex].status = 'active';
          setMathTargetIndex(nextIndex);
          setMathAsteroids(nextAsteroids);
        } else {
          setMathAsteroids(nextAsteroids);
          const wrongMsg = mathWrongCount > 0 ? ` (${mathWrongCount} sai)` : ' - PERFECT!';
          addArenaLog(`🛡️ Xóa sạch thiên thạch!${wrongMsg}`);
        }
        setMathInputs({ x: '', y: '' });
      } else {
        playSound.click();
        setMathCombo(0);
        setMathWrongCount((prev) => prev + 1);
        addArenaLog(`❌ Sai! Tọa độ (${userX}, ${userY}) không trùng mục tiêu! (Sai lần ${mathWrongCount + 1})`);
      }
    } catch (err) {
      console.error("Lỗi submitAnswer math:", err);
      addArenaLog(`🚨 Lỗi kết nối server khi bắn thiên thạch!`);
    }
  };

  // ----------------------------------------------------
  // LOGIC ĐẤU TRƯỜNG VÔ TẬN (INFINITE ARENA GAMEPLAY ENGINE)
  // ----------------------------------------------------

  const calculateAndSyncProgress = async (subject, gameData, selectedAnswerPayload) => {
    const isCorrect = gameData.answered?.[gameData.answered?.length - 1]?.correct;
    const prevProg = arenaState.playerProgress || 0;
    const currentProgress = isCorrect ? Math.min(100, prevProg + 5) : prevProg;

    if (activeRoomId === 'local_sandbox') {
      updatePlayerProgress(currentProgress);
    } else if (activeRoomId) {
      try {
        const submitAnswerFn = httpsCallable(functions, 'submitAnswer');
        const res = await submitAnswerFn({
          matchId: activeRoomId,
          questionId: String(gameData.currentQ),
          selectedAnswer: selectedAnswerPayload
        });
        const { currentProgress: serverProgress } = res.data || {};
        if (typeof serverProgress === 'number') {
          updatePlayerProgress(serverProgress);
        } else {
          updatePlayerProgress(currentProgress);
        }
      } catch (err) {
        console.error(`Lỗi submitAnswer ${subject}:`, err);
        updatePlayerProgress(currentProgress);
      }
    }
    return currentProgress;
  };

  const handleNextQuestion = (subject) => {
    setSaInput('');
    setAiEliminatedOptions([]);

    if (subject === 'chemistry') {
      setChemSelected(null);
      setChemRevealed(false);
      setChemTfAnswers([null, null, null, null]);
      setChemGame(prev => ({ ...prev, currentQ: prev.currentQ + 1 }));
    } else if (subject === 'physics') {
      setPhysSelected(null);
      setPhysRevealed(false);
      setPhysTfAnswers([null, null, null, null]);
      setPhysGame(prev => ({ ...prev, currentQ: prev.currentQ + 1 }));
    } else if (subject === 'math') {
      setMathSelected(null);
      setMathRevealed(false);
      setMathTfAnswers([null, null, null, null]);
      setMathGame(prev => ({ ...prev, currentQ: prev.currentQ + 1 }));
    } else if (subject === 'biology') {
      setBioSelected(null);
      setBioRevealed(false);
      setBioTfAnswers([null, null, null, null]);
      setBioGame(prev => ({ ...prev, currentQ: prev.currentQ + 1 }));
    }
  };

  const evaluateShortAnswer = (q, userInput) => {
    const rawTarget = q?.correctShortAnswer ?? q?.correctAnswer ?? q?.correct ?? q?.answer ?? '';
    const targetVal = String(rawTarget).trim().toLowerCase();
    const userVal = String(userInput || '').trim().toLowerCase();
    if (!targetVal || !userVal) return false;
    
    const targetNum = parseFloat(targetVal);
    const userNum = parseFloat(userVal);
    if (!isNaN(targetNum) && !isNaN(userNum)) {
      return Math.abs(targetNum - userNum) <= 0.1;
    }
    return targetVal === userVal;
  };

  const handleSaSubmit = async (subject) => {
    if (!saInput.trim()) return;

    if (subject === 'chemistry') {
      if (chemRevealed) return;
      setChemRevealed(true);
      const currQ = chemGame.questions[chemGame.currentQ % (chemGame.questions.length || 1)];
      const isCorrect = evaluateShortAnswer(currQ, saInput);

      if (isCorrect) playSound.success(); else playSound.click();

      const nextGame = {
        ...chemGame,
        score: chemGame.score + (isCorrect ? 1 : 0),
        answered: [...chemGame.answered, { qIndex: chemGame.currentQ, selected: saInput, correct: isCorrect }]
      };
      setChemGame(nextGame);
      await calculateAndSyncProgress('chemistry', nextGame, saInput);
    } else if (subject === 'physics') {
      if (physRevealed) return;
      setPhysRevealed(true);
      const currQ = physGame.questions[physGame.currentQ % (physGame.questions.length || 1)];
      const isCorrect = evaluateShortAnswer(currQ, saInput);

      if (isCorrect) playSound.success(); else playSound.click();

      const nextGame = {
        ...physGame,
        score: physGame.score + (isCorrect ? 1 : 0),
        answered: [...physGame.answered, { qIndex: physGame.currentQ, selected: saInput, correct: isCorrect }]
      };
      setPhysGame(nextGame);
      await calculateAndSyncProgress('physics', nextGame, saInput);
    } else if (subject === 'math') {
      if (mathRevealed) return;
      setMathRevealed(true);
      const currQ = mathGame.questions[mathGame.currentQ % (mathGame.questions.length || 1)];
      const isCorrect = evaluateShortAnswer(currQ, saInput);

      if (isCorrect) playSound.success(); else playSound.click();

      const nextGame = {
        ...mathGame,
        score: mathGame.score + (isCorrect ? 1 : 0),
        answered: [...mathGame.answered, { qIndex: mathGame.currentQ, selected: saInput, correct: isCorrect }]
      };
      setMathGame(nextGame);
      await calculateAndSyncProgress('math', nextGame, saInput);
    } else if (subject === 'biology') {
      if (bioRevealed) return;
      setBioRevealed(true);
      const currQ = bioGame.questions[bioGame.currentQ % (bioGame.questions.length || 1)];
      const isCorrect = evaluateShortAnswer(currQ, saInput);

      if (isCorrect) playSound.success(); else playSound.click();

      const nextGame = {
        ...bioGame,
        score: bioGame.score + (isCorrect ? 1 : 0),
        answered: [...bioGame.answered, { qIndex: bioGame.currentQ, selected: saInput, correct: isCorrect }]
      };
      setBioGame(nextGame);
      await calculateAndSyncProgress('biology', nextGame, saInput);
    }
  };

  const handleTfSubmit = async (subject) => {
    if (subject === 'chemistry') {
      if (chemRevealed || chemTfAnswers.includes(null)) {
        if (chemTfAnswers.includes(null)) alert("Vui lòng chọn Đúng hoặc Sai cho cả 4 nhận định trước khi xác nhận!");
        return;
      }
      setChemRevealed(true);
      const currQ = chemGame.questions[chemGame.currentQ % (chemGame.questions.length || 1)];
      const correctAnswers = currQ?.correct || [];
      let correctCount = 0;
      const total = Array.isArray(correctAnswers) && correctAnswers.length > 0 ? correctAnswers.length : 4;
      if (Array.isArray(correctAnswers)) {
        chemTfAnswers.forEach((val, idx) => {
          if (val === correctAnswers[idx]) correctCount++;
        });
      }
      const partialScore = total > 0 ? correctCount / total : 0;
      const isFullyCorrect = partialScore === 1;

      if (partialScore > 0) playSound.success(); else playSound.click();
      const nextGame = {
        ...chemGame,
        score: chemGame.score + partialScore,
        answered: [...chemGame.answered, { qIndex: chemGame.currentQ, selected: [...chemTfAnswers], correct: isFullyCorrect, partialScore, correctCount }]
      };
      setChemGame(nextGame);
      await calculateAndSyncProgress('chemistry', nextGame, chemTfAnswers);
    } else if (subject === 'physics') {
      if (physRevealed || physTfAnswers.includes(null)) {
        if (physTfAnswers.includes(null)) alert("Vui lòng chọn Đúng hoặc Sai cho cả 4 nhận định trước khi xác nhận!");
        return;
      }
      setPhysRevealed(true);
      const currQ = physGame.questions[physGame.currentQ % (physGame.questions.length || 1)];
      const correctAnswers = currQ?.correct || [];
      let correctCount = 0;
      const total = Array.isArray(correctAnswers) && correctAnswers.length > 0 ? correctAnswers.length : 4;
      if (Array.isArray(correctAnswers)) {
        physTfAnswers.forEach((val, idx) => {
          if (val === correctAnswers[idx]) correctCount++;
        });
      }
      const partialScore = total > 0 ? correctCount / total : 0;
      const isFullyCorrect = partialScore === 1;

      if (partialScore > 0) playSound.success(); else playSound.click();
      const nextGame = {
        ...physGame,
        score: physGame.score + partialScore,
        answered: [...physGame.answered, { qIndex: physGame.currentQ, selected: [...physTfAnswers], correct: isFullyCorrect, partialScore, correctCount }]
      };
      setPhysGame(nextGame);
      await calculateAndSyncProgress('physics', nextGame, physTfAnswers);
    } else if (subject === 'math') {
      if (mathRevealed || mathTfAnswers.includes(null)) {
        if (mathTfAnswers.includes(null)) alert("Vui lòng chọn Đúng hoặc Sai cho cả 4 nhận định trước khi xác nhận!");
        return;
      }
      setMathRevealed(true);
      const currQ = mathGame.questions[mathGame.currentQ % (mathGame.questions.length || 1)];
      const correctAnswers = currQ?.correct || [];
      let correctCount = 0;
      const total = Array.isArray(correctAnswers) && correctAnswers.length > 0 ? correctAnswers.length : 4;
      if (Array.isArray(correctAnswers)) {
        mathTfAnswers.forEach((val, idx) => {
          if (val === correctAnswers[idx]) correctCount++;
        });
      }
      const partialScore = total > 0 ? correctCount / total : 0;
      const isFullyCorrect = partialScore === 1;

      if (partialScore > 0) playSound.success(); else playSound.click();
      const nextGame = {
        ...mathGame,
        score: mathGame.score + partialScore,
        answered: [...mathGame.answered, { qIndex: mathGame.currentQ, selected: [...mathTfAnswers], correct: isFullyCorrect, partialScore, correctCount }]
      };
      setMathGame(nextGame);
      await calculateAndSyncProgress('math', nextGame, mathTfAnswers);
    } else if (subject === 'biology') {
      if (bioRevealed || bioTfAnswers.includes(null)) {
        if (bioTfAnswers.includes(null)) alert("Vui lòng chọn Đúng hoặc Sai cho cả 4 nhận định trước khi xác nhận!");
        return;
      }
      setBioRevealed(true);
      const currQ = bioGame.questions[bioGame.currentQ % (bioGame.questions.length || 1)];
      const correctAnswers = currQ?.correct || [];
      let correctCount = 0;
      const total = Array.isArray(correctAnswers) && correctAnswers.length > 0 ? correctAnswers.length : 4;
      if (Array.isArray(correctAnswers)) {
        bioTfAnswers.forEach((val, idx) => {
          if (val === correctAnswers[idx]) correctCount++;
        });
      }
      const partialScore = total > 0 ? correctCount / total : 0;
      const isFullyCorrect = partialScore === 1;

      if (partialScore > 0) playSound.success(); else playSound.click();
      const nextGame = {
        ...bioGame,
        score: bioGame.score + partialScore,
        answered: [...bioGame.answered, { qIndex: bioGame.currentQ, selected: [...bioTfAnswers], correct: isFullyCorrect, partialScore, correctCount }]
      };
      setBioGame(nextGame);
      await calculateAndSyncProgress('biology', nextGame, bioTfAnswers);
    }
  };

  const handleChemMcqAnswer = async (choiceIndex) => {
    if (chemRevealed) return;
    setChemSelected(choiceIndex);
    setChemRevealed(true);

    const currQ = chemGame.questions[chemGame.currentQ % (chemGame.questions.length || 1)];
    const isCorrect = choiceIndex === currQ?.correct;
    
    if (isCorrect) playSound.success(); else playSound.click();

    const nextGame = {
      ...chemGame,
      score: chemGame.score + (isCorrect ? 1 : 0),
      answered: [...chemGame.answered, { qIndex: chemGame.currentQ, selected: choiceIndex, correct: isCorrect }]
    };
    setChemGame(nextGame);
    await calculateAndSyncProgress('chemistry', nextGame, choiceIndex);
  };

  const handlePhysMcqAnswer = async (choiceIndex) => {
    if (physRevealed) return;
    setPhysSelected(choiceIndex);
    setPhysRevealed(true);

    const currQ = physGame.questions[physGame.currentQ % (physGame.questions.length || 1)];
    const isCorrect = choiceIndex === currQ?.correct;
    
    if (isCorrect) playSound.success(); else playSound.click();

    const nextGame = {
      ...physGame,
      score: physGame.score + (isCorrect ? 1 : 0),
      answered: [...physGame.answered, { qIndex: physGame.currentQ, selected: choiceIndex, correct: isCorrect }]
    };
    setPhysGame(nextGame);
    await calculateAndSyncProgress('physics', nextGame, choiceIndex);
  };

  const handleMathMcqAnswer = async (choiceIndex) => {
    if (mathRevealed) return;
    setMathSelected(choiceIndex);
    setMathRevealed(true);

    const currQ = mathGame.questions[mathGame.currentQ % (mathGame.questions.length || 1)];
    const isCorrect = choiceIndex === currQ?.correct;
    
    if (isCorrect) playSound.success(); else playSound.click();

    const nextGame = {
      ...mathGame,
      score: mathGame.score + (isCorrect ? 1 : 0),
      answered: [...mathGame.answered, { qIndex: mathGame.currentQ, selected: choiceIndex, correct: isCorrect }]
    };
    setMathGame(nextGame);
    await calculateAndSyncProgress('math', nextGame, choiceIndex);
  };

  const handleBioAnswer = async (choiceIndex) => {
    if (bioRevealed) return;
    setBioSelected(choiceIndex);
    setBioRevealed(true);

    const currQ = bioGame.questions[bioGame.currentQ % (bioGame.questions.length || 1)];
    const isCorrect = choiceIndex === currQ?.correct;
    
    if (isCorrect) playSound.success(); else playSound.click();

    const nextGame = {
      ...bioGame,
      score: bioGame.score + (isCorrect ? 1 : 0),
      answered: [...bioGame.answered, { qIndex: bioGame.currentQ, selected: choiceIndex, correct: isCorrect }]
    };
    setBioGame(nextGame);
    await calculateAndSyncProgress('biology', nextGame, choiceIndex);
  };


  const phVal = getChemPH();
  const fluidColorClass = getChemFluidColor(phVal);

  return (
    <div className="relative min-h-screen bg-bg-primary overflow-hidden transition-colors duration-300">
      {/* 🚀 LỚP NỀN ĐỘNG CINEMAGRAPH BACKGROUND THEO MÔN HỌC (Z-INDEX 0) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 dark:opacity-25 mix-blend-multiply dark:mix-blend-screen overflow-hidden">
        <ArenaBackground subject={arenaState.subject || 'math'} />
      </div>

      {/* 🚀 LỚP GIAO DIỆN UI ĐẤU TRƯỜNG THAO TÁC NGƯỜI DÙNG (Z-INDEX 10) */}
      <div className="relative z-10 w-full min-h-[calc(100vh-100px)] p-6 max-w-7xl mx-auto flex flex-col justify-center select-none font-sans text-text-primary">
      
      {/* CẢNH BÁO KẾT NỐI MẠNG ĐẾN FIRESTORE BỊ CHẶN */}
      {isFirebaseBlocked && (
        <div className="mb-6 p-5 bg-rose-500/10 border border-rose-500/30 rounded-3xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-lg animate-in slide-in-from-top-4 duration-300">
          <div className="w-12 h-12 bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
          </div>
          <div className="flex-1">
            <h3 className="text-rose-400 font-extrabold text-sm uppercase tracking-wider">CẢNH BÁO: ĐƯỜNG TRUYỀN FIRESTORE BỊ CHẶN!</h3>
            <p className="text-zinc-300 text-xs mt-1 leading-relaxed">
              Trình duyệt của bạn đang <strong className="text-rose-400">KHÔNG THỂ</strong> kết nối tới máy chủ Google Firestore. Nguyên nhân do nhà mạng, Tường lửa, VPN hoặc Tiện ích chặn quảng cáo (Adblocker) đang chặn tên miền <code className="text-rose-300 px-1.5 py-0.5 bg-rose-950/40 rounded border border-rose-500/20">firestore.googleapis.com</code>.
            </p>
            <p className="text-zinc-400 text-[11px] mt-1 italic">
              💡 Cách khắc phục: Hãy tắt Adblocker/uBlock cho trang web này, ngắt kết nối VPN, hoặc đơn giản nhất là **kết nối mạng Hotspot 4G/5G điện thoại** để truyền dữ liệu thi đấu online ngay lập tức!
            </p>
          </div>
        </div>
      )}
      
      {/* 1. TRẠNG THÁI IDLE: CHỌN MÔN HỌC THI ĐẤU & BẢNG XẾP HẠNG KÉP */}
      {arenaState.status === 'idle' && (
        <div className="flex flex-col items-center justify-center py-6 animate-in fade-in duration-300 w-full">
          <div className="flex items-center gap-4 mb-4 text-center sm:text-left flex-col sm:flex-row">
            <div className="relative">
              <Swords className="w-14 h-14 text-accent-pink animate-pulse relative z-10 filter drop-shadow-[0_0_10px_rgba(240,57,140,0.5)]" />
              <div className="absolute inset-0 bg-accent-pink/20 blur-md rounded-full" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-text-primary tracking-wider uppercase bg-clip-text bg-gradient-to-r from-text-primary via-accent-pink to-accent-cyan">Đấu trường Khoa học 1v1</h1>
              <p className="text-text-secondary text-xs mt-1 font-mono tracking-widest">[ COHERENT REAL-TIME SIMULATION PROTOCOL ]</p>
            </div>
          </div>
          <p className="text-text-secondary text-sm max-w-xl text-center mb-6 leading-relaxed">
            Bước vào đấu trường tri thức Sci-Fi đỉnh cao! So tài tốc độ và độ chính xác qua các bộ câu hỏi trắc nghiệm Toán - Lý - Hóa - Sinh chuẩn hóa (Trắc nghiệm, Đúng/Sai, Trả lời ngắn) cùng mô phỏng phòng lab Hóa học đối kháng.
          </p>

          {/* NÚT CỬA HÀNG TRANG BỊ MINI & SỐ DƯ PHA LÊ */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <button
              onClick={() => {
                playSound.click();
                setIsShopOpen(true);
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 border border-amber-300"
            >
              <Store className="w-5 h-5 text-black animate-pulse" />
              <span>🛒 CỬA HÀNG TRANG BỊ SCI-FI</span>
              <span className="px-2 py-0.5 rounded-full bg-black/20 text-black text-[10px] font-mono font-black">HIGH TIER</span>
            </button>

            <div className="px-4 py-2.5 rounded-2xl bg-bg-secondary border border-amber-500/30 flex items-center gap-2 font-mono shadow-md">
              <CrystalIcon className="w-5 h-5" />
              <span className="text-xs text-text-secondary">Pha Lê:</span>
              <strong className="text-sm font-black text-amber-300">
                {(personalization?.crystals !== undefined ? personalization.crystals : 500).toLocaleString()}
              </strong>
            </div>
          </div>

          {/* BĂNG 1 SLOT TRANG BỊ THẺ TRƯỚC TRẬN TẠI SẢNH (SLIM COMPACT BAR) */}
          <div className="w-full max-w-6xl mb-6 bg-bg-secondary/90 border border-amber-500/30 rounded-2xl p-3 px-4 shadow-lg backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 relative overflow-hidden">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
                <Zap className="w-4 h-4 animate-pulse text-amber-600 dark:text-amber-300" />
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-black text-amber-600 dark:text-amber-300 font-mono tracking-wider uppercase">THẺ TRƯỚC TRẬN:</span>
                {preMatchEquippedCard ? (() => {
                  const cardDef = getEquipmentById(preMatchEquippedCard);
                  if (!cardDef) return null;
                  return (
                    <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/50 px-3 py-1 rounded-xl shadow-sm">
                      <span className="text-xs font-extrabold text-text-primary">{cardDef.name}</span>
                      <span className="text-[10px] text-text-secondary hidden md:inline">({cardDef.description})</span>
                      <button
                        onClick={() => {
                          playSound.click();
                          setPreMatchEquippedCard(null);
                        }}
                        className="ml-1 p-0.5 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 cursor-pointer transition-all"
                        title="Tháo thẻ này"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })() : (
                  <span className="text-xs text-text-secondary italic font-mono">[ Chưa trang bị ]</span>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                playSound.click();
                setIsPreMatchPickerOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{preMatchEquippedCard ? 'Đổi Thẻ' : '+ Trang Bị Thẻ'} ({lobbyInventory.filter(i => { const c = getEquipmentById(i.cardId); return c && c.type === 'pre_match' && i.quantity > 0; }).length})</span>
            </button>
          </div>

          {/* MODAL BẢNG CHỌN THẺ TRƯỚC TRẬN TỪ KHO ĐỒ */}
          {isPreMatchPickerOpen && (
            <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-bg-secondary border border-amber-500/40 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative">
                <div className="flex items-center justify-between border-b border-border-theme pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-amber-600 dark:text-amber-300 font-mono flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                      CHỌN THẺ BÀI SỬ DỤNG TRƯỚC TRẬN
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Danh sách các Thẻ Bài Nội Tại kích hoạt khi vừa bước vào trận đấu.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPreMatchPickerOpen(false)}
                    className="p-1.5 rounded-xl bg-bg-tertiary text-text-secondary hover:text-text-primary cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar pr-1">
                  {(() => {
                    const preMatchItems = lobbyInventory.filter(i => {
                      const c = getEquipmentById(i.cardId);
                      return c && c.type === 'pre_match' && i.quantity > 0;
                    });

                    if (preMatchItems.length === 0) {
                      return (
                        <div className="text-center py-10 text-text-secondary text-xs font-mono">
                          Bạn chưa có thẻ bài Trước Trận nào! Ghé <strong className="text-amber-600 dark:text-amber-400">🛒 Cửa hàng Sci-Fi</strong> để mua thêm (Thẻ Bảo Hộ ELO, Nam Châm Pha Lê, Cấm Thuật...).
                        </div>
                      );
                    }

                    return preMatchItems.map((invItem) => {
                      const cardDef = getEquipmentById(invItem.cardId);
                      if (!cardDef) return null;
                      const isEquipped = preMatchEquippedCard === cardDef.id;

                      return (
                        <div
                          key={cardDef.id}
                          onClick={() => {
                            playSound.click();
                            if (isEquipped) {
                              setPreMatchEquippedCard(null);
                            } else {
                              setPreMatchEquippedCard(cardDef.id);
                            }
                            setIsPreMatchPickerOpen(false);
                          }}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isEquipped
                              ? 'bg-amber-500/15 border-amber-500/60'
                              : 'bg-bg-tertiary border-border-theme hover:border-amber-500/40'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase bg-gradient-to-r from-amber-500 to-yellow-500 text-black">
                                ⚡ Trước Trận
                              </span>
                              <h4 className="font-bold text-xs text-text-primary">{cardDef.name}</h4>
                            </div>
                            <p className="text-[11px] text-text-secondary">{cardDef.description}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-300 block">
                              Sở hữu: <strong className="text-amber-700 dark:text-amber-400">{invItem.quantity}</strong>
                            </span>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                              {isEquipped ? '✓ Đang trang bị' : '+ Trang bị'}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-6 w-full max-w-6xl mt-2">
            {/* THẺ BANNER FEATURED GHÉP TRẬN NGẪU NHIÊN 1/4 MÔN */}
            <div className="w-full bg-gradient-to-r dark:from-purple-950/80 dark:via-[#1e1738] dark:to-cyan-950/80 from-pink-500/10 via-purple-500/10 to-cyan-500/10 border border-accent-pink/50 hover:border-accent-pink rounded-3xl p-5 shadow-2xl relative overflow-hidden transition-all duration-300 group">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-accent-pink/20 rounded-full blur-3xl group-hover:scale-125 transition-all pointer-events-none" />
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-lg shadow-pink-500/30 group-hover:rotate-12 transition-transform">
                    <Sparkles className="w-7 h-7 animate-pulse text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase font-mono bg-gradient-to-r from-pink-500 to-purple-500 text-white animate-pulse">
                        🔥 HOT - GHÉP TRẬN TỨC THỜI
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono font-bold">Tốc độ: &lt; 3 giây</span>
                    </div>
                    <h3 className="text-base font-black text-text-primary uppercase tracking-wide flex items-center gap-2">
                      🎲 NGẪU NHIÊN 1/4 MÔN (TOÁN - LÝ - HÓA - SINH)
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5 max-w-xl">
                      Tự động kết nối với đối thủ đang chờ ở BẤT KỲ môn học nào trong 4 phòng lab. Bắt đầu trận đấu ngay lập tức mà không phải chờ đúng môn!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end shrink-0">
                  <button
                    onClick={() => startMatching('random')}
                    onMouseEnter={playSound.hover}
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-pink-500/30 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-white/20"
                  >
                    <Swords className="w-4 h-4 text-amber-300 animate-bounce" /> ĐẤU HẠNG RANDOM
                  </button>
                  <button
                    onClick={() => startFreePractice(['math', 'physics', 'chemistry', 'biology'][Math.floor(Math.random() * 4)])}
                    onMouseEnter={playSound.hover}
                    className="px-4 py-3 bg-bg-tertiary hover:bg-border-theme border border-border-theme text-text-primary rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    LUYỆN TẬP
                  </button>
                </div>
              </div>
            </div>

            {/* Chọn phòng thí nghiệm đấu trí full-width */}
            <div className="flex flex-col gap-5 w-full">
              <div className="flex items-center justify-between border-b border-border-theme pb-3">
                <h2 className="text-sm font-black text-text-primary flex items-center gap-2 font-mono tracking-wider uppercase">
                  <span className="p-1.5 bg-accent-pink/15 rounded-xl text-accent-pink border border-accent-pink/30"><Swords className="w-4 h-4" /></span> HOẶC CHỌN TRỰC TIẾP PHÒNG THÍ NGHIỆM MÔN HỌC
                </h2>
                <span className="text-[10px] text-text-secondary font-mono hidden sm:inline">Lựa chọn 1 trong 4 chuyên đề thực hành 1v1</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { 
                    id: 'math', 
                    name: 'Đại Số & Hình Học Không Gian', 
                    border: 'border-amber-500/30 hover:border-amber-500/80', 
                    glow: 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]',
                    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
                    iconBg: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
                    icon: <Orbit className="w-6 h-6 animate-pulse" />, 
                    spec: 'TOÁN HỌC', 
                    desc: 'Thi đấu giải nhanh các dạng câu hỏi Trắc nghiệm 4 lựa chọn, Đúng/Sai và Trả lời ngắn về Đại số, Giải tích 3D và Vector.' 
                  },
                  { 
                    id: 'physics', 
                    name: 'Quang Học & Cơ Điện Lượng Tử', 
                    border: 'border-emerald-500/30 hover:border-emerald-500/80', 
                    glow: 'group-hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]',
                    badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
                    iconBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
                    icon: <Compass className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />, 
                    spec: 'VẬT LÝ', 
                    desc: 'Chinh phục ngân hàng câu hỏi đối kháng Vật lý chuyên sâu về Quang học, Cơ học lượng tử và Mạch điện năng lượng.' 
                  },
                  { 
                    id: 'chemistry', 
                    name: 'Chuẩn Độ & Thí Nghiệm Hóa Học', 
                    border: 'border-pink-500/30 hover:border-pink-500/80', 
                    glow: 'group-hover:shadow-[0_0_25px_rgba(236,72,153,0.15)]',
                    badgeBg: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
                    iconBg: 'bg-pink-500/15 border-pink-500/40 text-pink-400',
                    icon: <Beaker className="w-6 h-6" />, 
                    spec: 'HÓA HỌC', 
                    desc: 'Thực hành thao tác nhỏ dung dịch chuẩn độ Axit-Bazơ pH=7.0, gia nhiệt bốc hơi kết hợp trả lời trắc nghiệm Hóa học.' 
                  },
                  { 
                    id: 'biology', 
                    name: 'Di Truyền & Tế Bào Học', 
                    border: 'border-cyan-500/30 hover:border-cyan-500/80', 
                    glow: 'group-hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]',
                    badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
                    iconBg: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400',
                    icon: <Sparkles className="w-6 h-6" />, 
                    spec: 'SINH HỌC', 
                    desc: 'Bứt phá tốc độ trả lời trắc nghiệm di truyền Mendel, cấu trúc ADN, phân bào và các chức năng bào quan tế bào.' 
                  }
                ].map((sub) => (
                  <div
                    key={sub.id}
                    className={`flex flex-col items-start p-5 bg-bg-secondary border ${sub.border} rounded-3xl text-left shadow-xl group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${sub.glow}`}
                  >
                    <div className="flex items-center justify-between w-full mb-4">
                      <div className={`p-2.5 rounded-2xl border ${sub.iconBg} transition-colors`}>
                        {sub.icon}
                      </div>
                      <span className={`text-[9px] font-black font-mono tracking-wider px-2.5 py-1 rounded-full uppercase border ${sub.badgeBg}`}>
                        {sub.spec}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold mb-1.5 text-text-primary group-hover:text-amber-400 transition-colors leading-snug h-[40px] overflow-hidden">
                      {sub.name}
                    </h3>
                    <p className="text-[11px] text-text-secondary leading-relaxed mb-5 flex-grow font-sans">
                      {sub.desc}
                    </p>

                    <div className="grid grid-cols-2 gap-2 w-full mt-auto pt-3 border-t border-border-theme">
                      <button
                        onClick={() => startMatching(sub.id)}
                        onMouseEnter={playSound.hover}
                        className="py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1 shadow-md shadow-pink-500/20 cursor-pointer border border-white/10"
                      >
                        <Swords className="w-3.5 h-3.5" /> ĐẤU HẠNG
                      </button>
                      <button
                        onClick={() => startFreePractice(sub.id)}
                        onMouseEnter={playSound.hover}
                        className="py-2.5 bg-bg-tertiary hover:bg-border-theme border border-border-theme text-text-secondary hover:text-text-primary rounded-xl text-[10px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        LUYỆN TẬP
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PVP DASHBOARD & HISTORY */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mt-3 w-full">
              {/* PvP Stats Card (5/12) */}
              <div className="lg:col-span-5 bg-bg-secondary border border-border-theme p-6 rounded-3xl shadow-2xl flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 w-full">
                  <div className="flex items-center justify-between border-b border-border-theme pb-3 mb-5">
                    <h3 className="text-xs font-black text-amber-600 dark:text-amber-300 uppercase tracking-widest font-mono flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" /> CHỈ SỐ PVP CÁ NHÂN
                    </h3>
                    <span className="text-[10px] text-text-secondary font-mono">SEASON 1</span>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-6 bg-bg-tertiary p-3.5 rounded-2xl border border-border-theme">
                    <div 
                      onClick={() => {
                        playSound.click();
                        router.push('/ho-so?tab=personalization&subtab=character');
                      }}
                      className="relative shrink-0 group/avatar cursor-pointer"
                      title="Thiết kế Avatar Chibi cá nhân"
                    >
                      <AvatarFrame frame={personalization.avatarFrame} className="w-16 h-16 text-2xl transition-all duration-300 group-hover/avatar:scale-105">
                        {personalization.avatarParts ? (
                          <STEMAvatarSVG parts={personalization.avatarParts} className="w-full h-full transform scale-90" />
                        ) : (
                          <User className="w-8 h-8 text-text-primary" />
                        )}
                        <div className="absolute inset-0 bg-black/70 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 flex items-center justify-center z-20">
                          <span className="text-[8px] font-black text-amber-300 uppercase tracking-wider">Sửa</span>
                        </div>
                      </AvatarFrame>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-text-primary tracking-wide">{user?.displayName || 'Học viên'}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-extrabold uppercase font-mono tracking-wider">
                          {getTitleLabel(personalization.activeTitle)}
                        </span>
                        <span className="text-[10px] text-text-secondary font-mono">Cấp {personalization.level}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 bg-bg-tertiary border border-border-theme rounded-2xl p-3.5 text-center">
                    <div>
                      <p className="text-[10px] text-text-secondary font-mono">Điểm Elo</p>
                      <p className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">{personalization.elo}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary font-mono">Tỷ lệ thắng</p>
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {personalization.wins + personalization.losses > 0
                          ? `${Math.round((personalization.wins / (personalization.wins + personalization.losses)) * 100)}%`
                          : '0%'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary font-mono">Trận thắng</p>
                      <p className="text-base font-black text-text-primary mt-0.5">{personalization.wins}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border-theme pt-3.5 mt-5 flex justify-between items-center relative z-10 w-full">
                  <div className="flex items-center gap-1 text-[11px] text-text-secondary font-mono">
                    <span>Trận thua: <strong className="text-rose-500 dark:text-rose-400">{personalization.losses}</strong></span>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl">
                    <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-pulse" />
                    <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">Chuỗi: 0</span>
                  </div>
                </div>
              </div>

              {/* PvP Combat Log (7/12) */}
              <div className="lg:col-span-7 bg-bg-secondary border border-border-theme p-6 rounded-3xl shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-border-theme pb-3 mb-4">
                    <h3 className="text-xs font-black text-text-primary uppercase tracking-widest font-mono flex items-center gap-2">
                      <Clock className="w-4 h-4 text-pink-400" /> LỊCH SỬ THI ĐẤU PVP GẦN ĐÂY
                    </h3>
                    <span className="text-[10px] text-text-secondary font-mono">10 trận đấu mới nhất</span>
                  </div>
                  
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1.5">
                    {loadingHistory ? (
                      <div className="flex flex-col items-center justify-center py-10 text-text-secondary text-xs font-mono">
                        <Orbit className="w-6 h-6 animate-spin text-pink-400 mb-2" />
                        ĐANG TẢI LỊCH SỬ ĐẤU...
                      </div>
                    ) : realHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-text-secondary text-xs font-mono border border-dashed border-border-theme rounded-2xl">
                        CHƯA CÓ DỮ LIỆU ĐẤU HẠNG PVP
                      </div>
                    ) : (
                      realHistory.map((log, idx) => (
                        <div key={log.id || idx} className="flex items-center justify-between p-3 bg-bg-tertiary border border-border-theme rounded-2xl hover:border-pink-500/40 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0">
                              <AvatarFrame frame={log.avatarFrame} className="w-9 h-9 text-xs">
                                {log.avatarParts ? (
                                  <STEMAvatarSVG parts={log.avatarParts} className="w-full h-full transform scale-90" />
                                ) : (
                                  <User className="w-4 h-4 text-text-primary" />
                                )}
                              </AvatarFrame>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-text-primary">{log.opponent}</span>
                                <span className="text-[8px] px-2 py-0.5 bg-pink-500/10 border border-pink-500/20 text-pink-300 rounded-full font-mono uppercase">
                                  {log.subject === 'math' ? 'Toán' : log.subject === 'physics' ? 'Vật lý' : log.subject === 'chemistry' ? 'Hóa học' : log.subject === 'biology' ? 'Sinh học' : log.subject}
                                </span>
                              </div>
                              <span className="text-[9px] text-text-secondary">{log.time}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black font-mono px-2.5 py-1 rounded-xl ${log.result === 'win' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'}`}>
                              {log.result === 'win' ? 'THẮNG' : 'THUA'} {log.eloChange} ELO
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-text-secondary italic mt-3 text-center border-t border-border-theme pt-2.5">
                  * Kết quả đấu hạng sẽ được cộng/trừ ELO và EXP trực tiếp vào Hồ sơ của bạn sau mỗi trận.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TRẠNG THÁI MATCHING: RADAR QUÉT TÌM TRẬN */}
      {arenaState.status === 'matching' && (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
          <div className="relative w-72 h-72 mb-10 flex items-center justify-center">
            {/* Holographic Radar Circle */}
            <div className="absolute inset-0 border border-accent-pink/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-4 border border-accent-pink/30 rounded-full animate-pulse" />
            <div className="absolute inset-10 border border-accent-pink/40 rounded-full" />
            <div className="absolute inset-20 border border-accent-pink/50 border-dashed rounded-full" />
            <div className="absolute inset-0 rounded-full border border-accent-pink/20 bg-gradient-to-t from-transparent via-accent-pink/5 to-accent-pink/15 animate-[spin_4s_linear_infinite]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-accent-pink/10 border border-accent-pink/30 flex items-center justify-center">
                <Swords className="w-8 h-8 text-accent-pink animate-pulse" />
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-text-primary tracking-widest uppercase mb-1 font-mono">CONNECTING TO LOBBY SERVER...</h2>
          <p className="text-accent-pink text-xs font-mono tracking-widest mb-6 uppercase">ACTIVE DOMAIN: STOCHIOMETRIC {arenaState.subject} LABORATORY</p>
          
          <div className="flex items-center gap-2.5 px-4.5 py-2.5 bg-bg-secondary border border-border-theme rounded-2xl text-xs text-text-secondary font-mono mb-10">
            <Timer className="w-4 h-4 animate-spin text-accent-pink" /> SECONDS ELAPSED: {matchmakingTime}s
          </div>

          {matchmakingError && (
            <div className="mb-8 px-5 py-3.5 bg-danger/10 border border-danger/30 rounded-2xl text-danger text-xs font-mono max-w-md text-center flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-danger animate-bounce" />
              <span>{matchmakingError}</span>
            </div>
          )}

          <button
            onMouseEnter={playSound.hover}
            onClick={cancelMatching}
            className="px-8 py-3 bg-bg-secondary hover:bg-danger hover:text-white border border-border-theme hover:border-danger text-text-primary font-bold rounded-2xl transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> THOÁT HÀNG ĐỢI
          </button>
        </div>
      )}

      {/* 2.5 OVERLAY ĐIỆN ẢNH: ĐÃ TÌM THẤY TRẬN ĐẤU (CINEMATIC MATCH-FOUND OVERLAY) */}
      {matchFoundData && (
        <div className="fixed inset-0 z-[99999] bg-bg-primary/95 text-text-primary backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes scanline {
              0% { transform: translateY(-100%); }
              100% { transform: translateY(100%); }
            }
            .cyber-scan {
              position: absolute;
              width: 100%;
              height: 4px;
              background: linear-gradient(to right, transparent, rgba(244, 63, 94, 0.5), transparent);
              animation: scanline 2.5s linear infinite;
            }
          `}} />

          {/* Hiệu ứng quét lade trên màn hình */}
          <div className="cyber-scan top-0 left-0" />

          {/* Radar quét khổng lồ mờ phía sau */}
          <div className="absolute w-[500px] h-[500px] rounded-full border border-rose-500/5 bg-radial-gradient from-rose-500/5 to-transparent animate-pulse pointer-events-none" />

          <div className="text-center max-w-4xl w-full z-10 relative">
            <h2 className="text-3xl font-black text-rose-500 tracking-[0.25em] uppercase mb-1 font-mono animate-bounce">
              ĐÃ TÌM THẤY ĐỐI THỦ!
            </h2>
            <p className="text-text-secondary text-xs font-mono tracking-widest mb-12 uppercase">
              DECRYPTING ROOM INTERNET PROTOCOL... ENCRYPTION SECURE
            </p>

            {/* Khay hiển thị hai đấu thủ */}
            <div className="grid grid-cols-1 md:grid-cols-11 gap-6 items-center justify-center">
              
              {/* Player 1 Card (Bạn) */}
              <div className="md:col-span-5 bg-bg-secondary border border-border-theme p-6 rounded-3xl text-center shadow-2xl relative overflow-hidden group hover:border-pink-500/20 transition-all duration-300">
                <div className="absolute top-0 left-0 px-3 py-1 bg-pink-500/10 border-r border-b border-pink-500/20 rounded-br-2xl text-[8px] font-mono text-pink-400 uppercase">
                  BẠN
                </div>
                <div className="relative shrink-0 w-24 h-24 flex items-center justify-center mx-auto mb-4">
                  <AvatarFrame frame={personalization.avatarFrame || 'default'} className="w-24 h-24">
                    <STEMAvatarSVG parts={personalization.avatarParts} className="w-16 h-16" />
                  </AvatarFrame>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-pink-500 border-2 border-bg-secondary flex items-center justify-center text-[10px] font-black text-white font-mono shadow-md">
                    {personalization.level || 1}
                  </div>
                </div>
                <h3 className="text-md font-bold text-text-primary font-mono uppercase tracking-wide truncate">
                  {personalization.name || user?.displayName || 'Bạn'}
                </h3>
                <span className="text-[9px] font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 rounded-full inline-block mt-2 font-mono uppercase tracking-wider">
                  {getTitleLabel(personalization.activeTitle || 'apprentice')}
                </span>
                <div className="mt-4 pt-3 border-t border-border-theme flex justify-center gap-1.5 items-center">
                  <Trophy className="w-4 h-4 text-pink-400" />
                  <span className="text-xs font-mono font-black text-text-primary">ELO {personalization.elo || 1000}</span>
                </div>
              </div>

              {/* VS Divider */}
              <div className="md:col-span-1 flex flex-col items-center justify-center py-4">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shadow-lg shadow-rose-500/10">
                  <span className="text-md font-black text-rose-500 font-mono italic">VS</span>
                </div>
                <div className="h-12 w-[1px] bg-gradient-to-b from-rose-500/30 to-transparent mt-2 hidden md:block" />
              </div>

              {/* Player 2 Card (Đối thủ) */}
              <div className="md:col-span-5 bg-bg-secondary border border-border-theme p-6 rounded-3xl text-center shadow-2xl relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 px-3 py-1 bg-rose-500/10 border-l border-b border-rose-500/20 rounded-bl-2xl text-[8px] font-mono text-rose-400 uppercase">
                  ĐỐI THỦ
                </div>
                {matchFoundData.opponent ? (
                  <>
                    <div className="relative shrink-0 w-24 h-24 flex items-center justify-center mx-auto mb-4">
                      <AvatarFrame frame={matchFoundData.opponent.avatarFrame || 'default'} className="w-24 h-24">
                        <STEMAvatarSVG parts={matchFoundData.opponent.avatarParts} className="w-16 h-16" />
                      </AvatarFrame>
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-rose-500 border-2 border-bg-secondary flex items-center justify-center text-[10px] font-black text-white font-mono shadow-md">
                        {matchFoundData.opponent.level || 1}
                      </div>
                    </div>
                    <h3 className="text-md font-bold text-text-primary font-mono uppercase tracking-wide truncate">
                      {matchFoundData.opponent.name || 'Đối thủ'}
                    </h3>
                    <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full inline-block mt-2 font-mono uppercase tracking-wider">
                      {getTitleLabel(matchFoundData.opponent.activeTitle || 'apprentice')}
                    </span>
                    <div className="mt-4 pt-3 border-t border-border-theme flex justify-center gap-1.5 items-center">
                      <Trophy className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-mono font-black text-text-primary">ELO {matchFoundData.opponent.elo || 1000}</span>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-zinc-500 font-mono text-xs">
                    LOADING OPPONENT...
                  </div>
                )}
              </div>

            </div>

            {/* Vòng đếm ngược to lớn */}
            <div className="mt-12 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-2xl font-black text-rose-400 font-mono animate-ping">
                {matchFoundCountdown}
              </div>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-4">
                BẮT ĐẦU GIẢI MÃ PHÒNG THÍ NGHIỆM TRONG VÀI GIÂY...
              </p>
            </div>

          </div>
        </div>
      )}

      {/* 2.5 GIAI ĐOẠN CHỌN TRANG BỊ TRƯỚC TRẬN (30S) */}
      {arenaState.status === 'equipment_selecting' && (
        <EquipmentSelectionView 
          user={user}
          activeRoomId={activeRoomId}
          isPlayer1Role={isPlayer1Role}
          roomData={latestRoomDataRef.current}
          preMatchCardId={preMatchEquippedCard}
          onConfirmed={() => setArenaStatus('playing')}
        />
      )}

      {/* 3. TRẠNG THÁI PLAYING: SPLIT-SCREEN LAB ARENA */}
      {arenaState.status === 'playing' && (
        <div className="fixed inset-0 w-screen h-screen overflow-hidden p-6 bg-bg-primary flex flex-col lg:flex-row gap-6 z-[99999] animate-in zoom-in-95 duration-300">
          
          {/* TOAST CẢNH BÁO VI PHẠM CHUYỂN TAB (XỬ PHẠT TỰ ĐỘNG) */}
          {tabPenaltyWarning && (
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999999] bg-gradient-to-r from-rose-600 to-red-700 text-white px-6 py-3.5 rounded-2xl border-2 border-rose-400 shadow-[0_0_35px_rgba(225,29,72,0.8)] flex items-center gap-3 font-mono animate-in slide-in-from-top duration-300 pointer-events-none">
              <AlertTriangle className="w-6 h-6 text-yellow-300 animate-bounce shrink-0" />
              <div>
                <div className="font-black text-sm uppercase tracking-wider text-yellow-300">
                  ⚠️ CẢNH BÁO VI PHẠM RỜI MÀN HÌNH (LẦN {tabPenaltyWarning.count})!
                </div>
                <div className="text-xs text-rose-100 mt-0.5">
                  Bạn đã rời màn hình! Bị trừ <span className="font-black text-white bg-rose-950 px-1.5 py-0.5 rounded border border-rose-400">-{tabPenaltyWarning.deducted} GIÂY</span> khỏi thời gian còn lại.
                </div>
              </div>
            </div>
          )}

          {/* TOAST THÔNG BÁO THẺ CHIÊU TRONG TRẬN (CARD ANNOUNCEMENT) */}
          {cardAnnouncement && (
            <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[9999999] bg-gradient-to-r ${cardAnnouncement.color || 'from-amber-500 to-yellow-600'} text-white px-6 py-3.5 rounded-2xl border-2 border-white/50 shadow-[0_0_40px_rgba(0,0,0,0.8)] flex items-center gap-3.5 font-mono animate-in slide-in-from-top duration-300 pointer-events-none backdrop-blur-md`}>
              <span className="text-2xl shrink-0">{cardAnnouncement.icon}</span>
              <div>
                <div className="font-black text-sm uppercase tracking-wider text-white drop-shadow-md">
                  {cardAnnouncement.title}
                </div>
                <div className="text-xs text-white/95 font-semibold mt-0.5 drop-shadow">
                  {cardAnnouncement.desc}
                </div>
              </div>
            </div>
          )}

          {/* CỘT TRÁI (COL-SPAN-8): THÍ NGHIỆM TƯƠNG TÁC CỦA NGƯỜI CHƠI */}
          <div className="flex-1 flex flex-col bg-bg-secondary/95 backdrop-blur-xl border border-border-theme rounded-3xl p-4 lg:p-5 pb-3 lg:pb-4 shadow-2xl overflow-hidden relative h-full">
            
            {/* OVERLAY HIỆU ỨNG ĐÔNG BĂNG HOẶC MÙ SƯƠNG TRÊN MÀN HÌNH BẢN THÂN */}
            {(() => {
              const isP1 = isPlayer1Role;
              const activeData = currentRoomData || latestRoomDataRef.current;
              const myEffects = isP1 ? activeData?.activeEffects?.p1 : activeData?.activeEffects?.p2;
              const myEquippedCardIds = isP1 ? (activeData?.player1Equipment || []) : (activeData?.player2Equipment || []);

              // Kiểm tra đóng băng và mù sương theo thời gian thực (realtime tick)
              const freezeRemainingSec = myEffects?.frozenUntil ? Math.max(0, Math.ceil((myEffects.frozenUntil - nowTick) / 1000)) : 0;
              const isFrozen = freezeRemainingSec > 0;

              const fogRemainingSec = myEffects?.fogUntil ? Math.max(0, Math.ceil((myEffects.fogUntil - nowTick) / 1000)) : 0;
              const isFogged = fogRemainingSec > 0;

              return (
                <>
                  {isFrozen && (
                    <div className="absolute inset-0 z-[50] bg-cyan-950/85 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto rounded-3xl animate-fadeIn p-6 text-center">
                      <Snowflake className="w-16 h-16 text-cyan-400 animate-spin-slow mb-3" />
                      <h3 className="text-xl font-black text-cyan-300 font-mono uppercase tracking-widest animate-pulse">
                        BẠN ĐÃ BỊ ĐÔNG BĂNG THỜI GIAN!
                      </h3>
                      <p className="text-xs text-cyan-200 font-mono mt-1 mb-6">
                        Tất cả thao tác màn hình bị khóa tạm thời (Còn lại <span className="font-bold text-white bg-cyan-900 px-2 py-0.5 rounded border border-cyan-400">{freezeRemainingSec}s</span>)...
                      </p>

                      {/* HỆ THỐNG NÚT BẤM DÙNG THẺ GIẢI TRỪ / PHẢN ĐÒN TRỰC TIẾP TRÊN MÀN HÌNH ĐÔNG BĂNG */}
                      <div className="flex flex-wrap items-center justify-center gap-3 z-[60]">
                        {myEquippedCardIds.includes('card_dispel') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUseCard('card_dispel');
                            }}
                            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-mono font-black text-xs shadow-lg shadow-emerald-500/30 animate-bounce flex items-center gap-2 cursor-pointer border border-emerald-300 active:scale-95 transition-all"
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-200" />
                            <span>✨ DÙNG THẺ GIẢI TRỪ (XÓA BĂNG NGAY)</span>
                          </button>
                        )}

                        {myEquippedCardIds.includes('card_counter') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUseCard('card_counter');
                            }}
                            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-mono font-black text-xs shadow-lg shadow-orange-500/30 animate-bounce flex items-center gap-2 cursor-pointer border border-orange-300 active:scale-95 transition-all"
                          >
                            <ShieldAlert className="w-4 h-4 text-orange-200" />
                            <span>🛡️ KÍCH HOẠT THẺ PHẢN ĐÒN (PHẢN BĂNG SANG ĐỐI THỦ)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {isFogged && (
                    <div className="absolute inset-0 z-[40] bg-zinc-950/85 backdrop-blur-lg flex flex-col items-center justify-center pointer-events-auto rounded-3xl animate-fadeIn p-6 text-center">
                      <CloudFog className="w-16 h-16 text-purple-400 animate-bounce mb-3" />
                      <h3 className="text-xl font-black text-purple-300 font-mono uppercase tracking-widest">
                        MÀN HÌNH BỊ MÙ SƯƠNG CHE PHỦ!
                      </h3>
                      <p className="text-xs text-purple-200 font-mono mt-1 mb-6">
                        Hiệu ứng sương mù cản trở tầm nhìn (Còn lại <span className="font-bold text-white bg-purple-900 px-2 py-0.5 rounded border border-purple-400">{fogRemainingSec}s</span>)...
                      </p>

                      {/* HỆ THỐNG NÚT BẤM DÙNG THẺ GIẢI TRỪ / PHẢN ĐÒN TRỰC TIẾP TRÊN MÀN HÌNH MÙ SƯƠNG */}
                      <div className="flex flex-wrap items-center justify-center gap-3 z-[60]">
                        {myEquippedCardIds.includes('card_dispel') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUseCard('card_dispel');
                            }}
                            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-mono font-black text-xs shadow-lg shadow-emerald-500/30 animate-bounce flex items-center gap-2 cursor-pointer border border-emerald-300 active:scale-95 transition-all"
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-200" />
                            <span>✨ DÙNG THẺ GIẢI TRỪ (XÓA SƯƠNG NGAY)</span>
                          </button>
                        )}

                        {myEquippedCardIds.includes('card_counter') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUseCard('card_counter');
                            }}
                            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-mono font-black text-xs shadow-lg shadow-orange-500/30 animate-bounce flex items-center gap-2 cursor-pointer border border-orange-300 active:scale-95 transition-all"
                          >
                            <ShieldAlert className="w-4 h-4 text-orange-200" />
                            <span>🛡️ KÍCH HOẠT THẺ PHẢN ĐÒN (PHẢN SƯƠNG SANG ĐỐI THỦ)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
            
            {/* Header Mini Game */}
            <div className="flex justify-between items-center border-b border-border-theme pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-pink/10 border border-accent-pink/20 rounded-xl flex items-center justify-center text-accent-pink shrink-0">
                  <Beaker className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-md font-bold text-text-primary leading-tight">
                    {arenaState.subject === 'chemistry' && 'HÓA HỌC: BẢN ĐỒ THỰC HÀNH HÓA HỌC CHUYÊN SÂU'}
                    {arenaState.subject === 'physics' && 'VẬT LÝ: THIẾT KẾ MẠCH QUANG HỌC LASER'}
                    {arenaState.subject === 'math' && 'TOÁN HỌC: HỆ TỌA ĐỘ PHÒNG THỦ VŨ TRỤ'}
                    {arenaState.subject === 'biology' && 'SINH HỌC: MÃ TÁI TỔ HỢP ADN XOẮN KÉP'}
                  </h2>
                  <span className="text-[10px] text-text-secondary font-mono uppercase tracking-widest">
                    {activeRoomId === 'local_sandbox' ? 'PHÒNG LUYỆN TẬP TỰ DO [PRACTICE]' : 'LABORATORY EXPERIMENT INTERFACE [1V1 MATCH]'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Nút thoát dành riêng cho chế độ Luyện Tập */}
                {activeRoomId === 'local_sandbox' && (
                  <button
                    onClick={() => {
                      playSound.click();
                      setArenaStatus('idle');
                      setActiveRoomId(null);
                    }}
                    className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> THOÁT PHÒNG
                  </button>
                )}

                {/* Timer đếm ngược (Chế độ đấu hạng) hoặc Vô hạn (Luyện tập) */}
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold font-mono ${
                  activeRoomId === 'local_sandbox'
                    ? 'bg-bg-tertiary text-text-primary border-border-theme'
                    : arenaState.timeRemaining <= 15 
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse' 
                      : 'bg-bg-tertiary text-text-primary border-border-theme'
                }`}>
                  <Timer className="w-4 h-4 shrink-0 text-accent-pink" /> 
                  {activeRoomId === 'local_sandbox' ? 'THỜI GIAN: VÔ HẠN' : `THỜI GIAN: ${formatMatchTimer(arenaState.timeRemaining)}`}
                </div>
              </div>
            </div>

            {/* PHÒNG LAB 1: HÓA HỌC (Multi-format Infinite Arena) */}
            {arenaState.subject === 'chemistry' && (() => {
              const currQ = chemGame.questions[chemGame.currentQ % (chemGame.questions.length || 1)] || {};
              const qType = currQ.type || 'mcq';

              return (
                <div className="flex-1 flex flex-col items-stretch py-4 w-full overflow-hidden h-full">
                  <div className="flex-1 flex flex-col justify-between bg-bg-tertiary rounded-3xl border border-border-theme p-6 shadow-inner select-none h-full overflow-y-auto">
                    <div>
                      {/* Header bar */}
                      <div className="flex items-center justify-between mb-6">
                        <span className="px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-full text-xs font-bold text-pink-400 flex items-center gap-1.5">
                          🧪 Hóa học {qType === 'tf' ? '• Đúng / Sai' : qType === 'sa' ? '• Trả lời ngắn' : '• Trắc nghiệm'}
                        </span>
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <span className="text-emerald-400 font-bold">ĐÃ LÀM ĐÚNG: {chemGame.score} CÂU</span>
                          <span className="text-text-secondary">CÂU HỎI #{chemGame.currentQ + 1}</span>
                        </div>
                      </div>

                      {/* Question text / context */}
                      <div className="bg-bg-secondary p-6 rounded-2xl border border-border-theme mb-6">
                        {qType === 'tf' ? (
                          <div>
                            <span className="text-[10px] text-pink-400 font-bold block uppercase mb-1 tracking-wider">[Ngữ cảnh / Đề bài]</span>
                            <h3 className="text-base font-bold text-text-primary leading-relaxed" 
                                dangerouslySetInnerHTML={{ __html: formatBioText(currQ.context || currQ.text || 'Đang tải câu hỏi...') }} />
                          </div>
                        ) : (
                          <h3 className="text-base font-bold text-text-primary leading-relaxed" 
                              dangerouslySetInnerHTML={{ __html: formatBioText(currQ.text || currQ.content || 'Đang tải câu hỏi...') }} />
                        )}
                      </div>

                      {/* Render choice layout based on MCQ vs TF vs SA */}
                      {qType === 'tf' ? (
                        <div className="flex flex-col gap-4">
                          {(currQ.statements || []).map((stmt, sIdx) => {
                            const userAns = chemTfAnswers[sIdx];
                            const correctVal = Array.isArray(currQ.correct) ? currQ.correct[sIdx] : null;
                            
                            return (
                              <div key={sIdx} className="bg-bg-secondary p-4 rounded-xl border border-border-theme flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all hover:border-accent-pink/20">
                                <div className="flex-1 flex gap-3 items-start">
                                  <span className="w-5 h-5 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-[10px] font-mono shrink-0 font-bold text-pink-400">
                                    {String.fromCharCode(97 + sIdx)}
                                  </span>
                                  <p className="text-xs text-text-primary leading-relaxed" dangerouslySetInnerHTML={{ __html: formatBioText(stmt) }} />
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    disabled={chemRevealed}
                                    onClick={() => {
                                      const next = [...chemTfAnswers];
                                      next[sIdx] = true;
                                      setChemTfAnswers(next);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border ${
                                      userAns === true
                                        ? chemRevealed 
                                          ? correctVal === true ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'
                                          : 'bg-pink-500/20 border-pink-500 text-pink-400'
                                        : chemRevealed && correctVal === true
                                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500/60 opacity-50'
                                          : 'bg-bg-tertiary border-border-theme text-text-secondary hover:text-text-primary'
                                    }`}
                                  >
                                    ĐÚNG
                                  </button>
                                  <button
                                    disabled={chemRevealed}
                                    onClick={() => {
                                      const next = [...chemTfAnswers];
                                      next[sIdx] = false;
                                      setChemTfAnswers(next);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border ${
                                      userAns === false
                                        ? chemRevealed 
                                          ? correctVal === false ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'
                                          : 'bg-pink-500/20 border-pink-500 text-pink-400'
                                        : chemRevealed && correctVal === false
                                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500/60 opacity-50'
                                          : 'bg-bg-tertiary border-border-theme text-text-secondary hover:text-text-primary'
                                    }`}
                                  >
                                    SAI
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {!chemRevealed && (
                            <button
                              onClick={() => handleTfSubmit('chemistry')}
                              className="mt-2 w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-pink-500/20 transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                              Xác nhận kết quả Đúng/Sai
                            </button>
                          )}
                        </div>
                      ) : qType === 'sa' ? (
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-3">
                            <input 
                              type="text"
                              value={saInput}
                              disabled={chemRevealed}
                              onChange={(e) => setSaInput(e.target.value)}
                              placeholder="Nhập giá trị số hoặc công thức hóa học..."
                              className="flex-1 bg-bg-secondary border border-border-theme rounded-2xl px-5 py-3.5 text-sm text-text-primary placeholder:text-zinc-500 focus:outline-none focus:border-pink-500 font-mono transition-all"
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSaSubmit('chemistry'); }}
                            />
                            {!chemRevealed && (
                              <button
                                onClick={() => handleSaSubmit('chemistry')}
                                className="px-6 py-3.5 bg-pink-500 hover:bg-pink-600 text-zinc-950 font-black rounded-2xl shadow-lg shadow-pink-500/20 text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0"
                              >
                                NỘP BÀI
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(currQ.choices || []).map((choice, idx) => {
                            const isSelected = chemSelected === idx;
                            const isCorrectIdx = idx === currQ.correct;
                            const isEliminated = aiEliminatedOptions.includes(idx);

                            let btnStyle = "border-border-theme bg-bg-secondary text-text-primary hover:border-pink-500/30 hover:bg-pink-500/5";
                            if (isEliminated) {
                              btnStyle = "border-zinc-800 bg-zinc-950/40 text-zinc-600 line-through opacity-30 pointer-events-none";
                            } else if (chemRevealed) {
                              if (isCorrectIdx) {
                                btnStyle = "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-bold";
                              } else if (isSelected) {
                                btnStyle = "border-rose-500/50 bg-rose-500/10 text-rose-400 font-bold";
                              } else {
                                btnStyle = "border-border-theme bg-bg-secondary text-text-secondary opacity-50";
                              }
                            } else if (isSelected) {
                              btnStyle = "border-pink-500 bg-pink-500/10 text-pink-400 font-bold";
                            }

                            return (
                              <button
                                key={idx}
                                disabled={chemRevealed || isEliminated}
                                onClick={() => handleChemMcqAnswer(idx)}
                                className={`p-4 rounded-xl text-left text-sm transition-all border flex items-center gap-3 cursor-pointer ${btnStyle}`}
                              >
                                <span className="w-6 h-6 rounded-full bg-bg-primary border border-border-theme flex items-center justify-center text-[11px] font-mono shrink-0 font-bold">
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span dangerouslySetInnerHTML={{ __html: formatBioText(choice) }} />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Next Button and Explanation */}
                    {chemRevealed && (
                      <div className="mt-6 flex flex-col gap-4">
                        <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl text-xs text-emerald-300 leading-relaxed flex items-start gap-2">
                          <span className="shrink-0 bg-emerald-500/20 p-1 rounded-lg text-emerald-400 font-bold text-[10px]">✓ GIẢI THÍCH / ĐÁP ÁN</span>
                          <span dangerouslySetInnerHTML={{ __html: formatBioText(currQ.note || (currQ.correctAnswer ? `Đáp án chính xác: ${currQ.correctAnswer}` : 'Đã ghi nhận câu trả lời.')) }} />
                        </div>
                        <button
                          onClick={() => handleNextQuestion('chemistry')}
                          className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-pink-500/20 transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                        >
                          CÂU HỎI TIẾP THEO →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* PHÒNG LAB 2: VẬT LÝ (Multi-format Infinite Arena) */}
            {arenaState.subject === 'physics' && (() => {
              const currQ = physGame.questions[physGame.currentQ % (physGame.questions.length || 1)] || {};
              const qType = currQ.type || 'mcq';

              return (
                <div className="flex-1 flex flex-col items-stretch py-4 w-full overflow-hidden h-full">
                  <div className="flex-1 flex flex-col justify-between bg-bg-tertiary rounded-3xl border border-border-theme p-6 shadow-inner select-none h-full overflow-y-auto">
                    <div>
                      {/* Header bar */}
                      <div className="flex items-center justify-between mb-6">
                        <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                          ⚛️ Vật lý {qType === 'tf' ? '• Đúng / Sai' : qType === 'sa' ? '• Trả lời ngắn' : '• Trắc nghiệm'}
                        </span>
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <span className="text-emerald-400 font-bold">ĐÃ LÀM ĐÚNG: {physGame.score} CÂU</span>
                          <span className="text-text-secondary">CÂU HỎI #{physGame.currentQ + 1}</span>
                        </div>
                      </div>

                      {/* Question text / context */}
                      <div className="bg-bg-secondary p-6 rounded-2xl border border-border-theme mb-6">
                        {qType === 'tf' ? (
                          <div>
                            <span className="text-[10px] text-cyan-400 font-bold block uppercase mb-1 tracking-wider">[Ngữ cảnh / Đề bài]</span>
                            <h3 className="text-base font-bold text-text-primary leading-relaxed" 
                                dangerouslySetInnerHTML={{ __html: formatMathText(currQ.context || currQ.text || 'Đang tải câu hỏi...') }} />
                          </div>
                        ) : (
                          <h3 className="text-base font-bold text-text-primary leading-relaxed" 
                              dangerouslySetInnerHTML={{ __html: formatMathText(currQ.text || currQ.content || 'Đang tải câu hỏi...') }} />
                        )}
                      </div>

                      {/* Render question interactions according to format */}
                      {qType === 'tf' ? (
                        <div className="flex flex-col gap-4">
                          {(currQ.statements || []).map((stmt, sIdx) => {
                            const userAns = physTfAnswers[sIdx];
                            const correctVal = Array.isArray(currQ.correct) ? currQ.correct[sIdx] : null;
                            return (
                              <div key={sIdx} className="bg-bg-secondary p-4 rounded-xl border border-border-theme flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all hover:border-cyan-500/20">
                                <div className="flex-1 flex gap-3 items-start">
                                  <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[10px] font-mono shrink-0 font-bold text-cyan-400">
                                    {String.fromCharCode(97 + sIdx)}
                                  </span>
                                  <p className="text-xs text-text-primary leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMathText(stmt) }} />
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    disabled={physRevealed}
                                    onClick={() => {
                                      const next = [...physTfAnswers];
                                      next[sIdx] = true;
                                      setPhysTfAnswers(next);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border ${
                                      userAns === true
                                        ? physRevealed 
                                          ? correctVal === true ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'
                                          : 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                        : physRevealed && correctVal === true
                                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500/60 opacity-50'
                                          : 'bg-bg-tertiary border-border-theme text-text-secondary hover:text-text-primary'
                                    }`}
                                  >
                                    ĐÚNG
                                  </button>
                                  <button
                                    disabled={physRevealed}
                                    onClick={() => {
                                      const next = [...physTfAnswers];
                                      next[sIdx] = false;
                                      setPhysTfAnswers(next);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border ${
                                      userAns === false
                                        ? physRevealed 
                                          ? correctVal === false ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'
                                          : 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                        : physRevealed && correctVal === false
                                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500/60 opacity-50'
                                          : 'bg-bg-tertiary border-border-theme text-text-secondary hover:text-text-primary'
                                    }`}
                                  >
                                    SAI
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {!physRevealed && (
                            <button
                              onClick={() => handleTfSubmit('physics')}
                              className="mt-2 w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                              Xác nhận kết quả Đúng/Sai
                            </button>
                          )}
                        </div>
                      ) : qType === 'sa' ? (
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-3">
                            <input 
                              type="text"
                              value={saInput}
                              disabled={physRevealed}
                              onChange={(e) => setSaInput(e.target.value)}
                              placeholder="Nhập giá trị số hoặc đáp án câu hỏi..."
                              className="flex-1 bg-bg-secondary border border-border-theme rounded-2xl px-5 py-3.5 text-sm text-text-primary placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 font-mono transition-all"
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSaSubmit('physics'); }}
                            />
                            {!physRevealed && (
                              <button
                                onClick={() => handleSaSubmit('physics')}
                                className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-600 text-zinc-950 font-black rounded-2xl shadow-lg shadow-cyan-500/20 text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0"
                              >
                                NỘP BÀI
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(currQ.choices || []).map((choice, idx) => {
                            const isSelected = physSelected === idx;
                            const isCorrectIdx = idx === currQ.correct;
                            const isEliminated = aiEliminatedOptions.includes(idx);

                            let btnStyle = "border-border-theme bg-bg-secondary text-text-primary hover:border-cyan-500/30 hover:bg-cyan-500/5";
                            if (isEliminated) {
                              btnStyle = "border-zinc-800 bg-zinc-950/40 text-zinc-600 line-through opacity-30 pointer-events-none";
                            } else if (physRevealed) {
                              if (isCorrectIdx) {
                                btnStyle = "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-bold";
                              } else if (isSelected) {
                                btnStyle = "border-rose-500/50 bg-rose-500/10 text-rose-400 font-bold";
                              } else {
                                btnStyle = "border-border-theme bg-bg-secondary text-text-secondary opacity-50";
                              }
                            } else if (isSelected) {
                              btnStyle = "border-cyan-500 bg-cyan-500/10 text-cyan-400 font-bold";
                            }

                            return (
                              <button
                                key={idx}
                                disabled={physRevealed || isEliminated}
                                onClick={() => handlePhysMcqAnswer(idx)}
                                className={`p-4 rounded-xl text-left text-sm transition-all border flex items-center gap-3 cursor-pointer ${btnStyle}`}
                              >
                                <span className="w-6 h-6 rounded-full bg-bg-primary border border-border-theme flex items-center justify-center text-[11px] font-mono shrink-0 font-bold">
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span dangerouslySetInnerHTML={{ __html: formatMathText(choice) }} />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Next Button and Explanation */}
                    {physRevealed && (
                      <div className="mt-6 flex flex-col gap-4">
                        <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl text-xs text-emerald-300 leading-relaxed flex items-start gap-2">
                          <span className="shrink-0 bg-emerald-500/20 p-1 rounded-lg text-emerald-400 font-bold text-[10px]">✓ GIẢI THÍCH / ĐÁP ÁN</span>
                          <span dangerouslySetInnerHTML={{ __html: formatMathText(currQ.note || (currQ.correctAnswer ? `Đáp án chính xác: ${currQ.correctAnswer}` : 'Đã ghi nhận câu trả lời.')) }} />
                        </div>
                        <button
                          onClick={() => handleNextQuestion('physics')}
                          className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                        >
                          CÂU HỎI TIẾP THEO →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* PHÒNG LAB 3: TOÁN HỌC (Multi-format Infinite Arena) */}
            {arenaState.subject === 'math' && (() => {
              const currQ = mathGame.questions[mathGame.currentQ % (mathGame.questions.length || 1)] || {};
              const qType = currQ.type || 'mcq';

              return (
                <div className="flex-1 flex flex-col items-stretch py-4 w-full overflow-hidden h-full">
                  <div className="flex-1 flex flex-col justify-between bg-bg-tertiary rounded-3xl border border-border-theme p-6 shadow-inner select-none h-full overflow-y-auto">
                    <div>
                      {/* Header bar */}
                      <div className="flex items-center justify-between mb-6">
                        <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          📐 Toán học {qType === 'tf' ? '• Đúng / Sai' : qType === 'sa' ? '• Trả lời ngắn' : '• Trắc nghiệm'}
                        </span>
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <span className="text-emerald-400 font-bold">ĐÃ LÀM ĐÚNG: {mathGame.score} CÂU</span>
                          <span className="text-text-secondary">CÂU HỎI #{mathGame.currentQ + 1}</span>
                        </div>
                      </div>

                      {/* Question text / context */}
                      <div className="bg-bg-secondary p-6 rounded-2xl border border-border-theme mb-6">
                        {qType === 'tf' ? (
                          <div>
                            <span className="text-[10px] text-amber-400 font-bold block uppercase mb-1 tracking-wider">[Ngữ cảnh / Đề bài]</span>
                            <h3 className="text-base font-bold text-text-primary leading-relaxed" 
                                dangerouslySetInnerHTML={{ __html: formatMathText(currQ.context || currQ.text || 'Đang tải câu hỏi...') }} />
                          </div>
                        ) : (
                          <h3 className="text-base font-bold text-text-primary leading-relaxed" 
                              dangerouslySetInnerHTML={{ __html: formatMathText(currQ.text || currQ.content || 'Đang tải câu hỏi...') }} />
                        )}
                      </div>

                      {/* Render question interactions according to format */}
                      {qType === 'tf' ? (
                        <div className="flex flex-col gap-4">
                          {(currQ.statements || []).map((stmt, sIdx) => {
                            const userAns = mathTfAnswers[sIdx];
                            const correctVal = Array.isArray(currQ.correct) ? currQ.correct[sIdx] : null;
                            return (
                              <div key={sIdx} className="bg-bg-secondary p-4 rounded-xl border border-border-theme flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all hover:border-amber-500/20">
                                <div className="flex-1 flex gap-3 items-start">
                                  <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[10px] font-mono shrink-0 font-bold text-amber-400">
                                    {String.fromCharCode(97 + sIdx)}
                                  </span>
                                  <p className="text-xs text-text-primary leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMathText(stmt) }} />
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    disabled={mathRevealed}
                                    onClick={() => {
                                      const next = [...mathTfAnswers];
                                      next[sIdx] = true;
                                      setMathTfAnswers(next);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border ${
                                      userAns === true
                                        ? mathRevealed 
                                          ? correctVal === true ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'
                                          : 'bg-amber-500/20 border-amber-500 text-amber-400'
                                        : mathRevealed && correctVal === true
                                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500/60 opacity-50'
                                          : 'bg-bg-tertiary border-border-theme text-text-secondary hover:text-text-primary'
                                    }`}
                                  >
                                    ĐÚNG
                                  </button>
                                  <button
                                    disabled={mathRevealed}
                                    onClick={() => {
                                      const next = [...mathTfAnswers];
                                      next[sIdx] = false;
                                      setMathTfAnswers(next);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border ${
                                      userAns === false
                                        ? mathRevealed 
                                          ? correctVal === false ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'
                                          : 'bg-amber-500/20 border-amber-500 text-amber-400'
                                        : mathRevealed && correctVal === false
                                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500/60 opacity-50'
                                          : 'bg-bg-tertiary border-border-theme text-text-secondary hover:text-text-primary'
                                    }`}
                                  >
                                    SAI
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {!mathRevealed && (
                            <button
                              onClick={() => handleTfSubmit('math')}
                              className="mt-2 w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                              Xác nhận kết quả Đúng/Sai
                            </button>
                          )}
                        </div>
                      ) : qType === 'sa' ? (
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-3">
                            <input 
                              type="text"
                              value={saInput}
                              disabled={mathRevealed}
                              onChange={(e) => setSaInput(e.target.value)}
                              placeholder="Nhập giá trị số hoặc kết quả biểu thức..."
                              className="flex-1 bg-bg-secondary border border-border-theme rounded-2xl px-5 py-3.5 text-sm text-text-primary placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 font-mono transition-all"
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSaSubmit('math'); }}
                            />
                            {!mathRevealed && (
                              <button
                                onClick={() => handleSaSubmit('math')}
                                className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0"
                              >
                                NỘP BÀI
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(currQ.choices || []).map((choice, idx) => {
                            const isSelected = mathSelected === idx;
                            const isCorrectIdx = idx === currQ.correct;
                            const isEliminated = aiEliminatedOptions.includes(idx);

                            let btnStyle = "border-border-theme bg-bg-secondary text-text-primary hover:border-amber-500/30 hover:bg-amber-500/5";
                            if (isEliminated) {
                              btnStyle = "border-zinc-800 bg-zinc-950/40 text-zinc-600 line-through opacity-30 pointer-events-none";
                            } else if (mathRevealed) {
                              if (isCorrectIdx) {
                                btnStyle = "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-bold";
                              } else if (isSelected) {
                                btnStyle = "border-rose-500/50 bg-rose-500/10 text-rose-400 font-bold";
                              } else {
                                btnStyle = "border-border-theme bg-bg-secondary text-text-secondary opacity-50";
                              }
                            } else if (isSelected) {
                              btnStyle = "border-amber-500 bg-amber-500/10 text-amber-400 font-bold";
                            }

                            return (
                              <button
                                key={idx}
                                disabled={mathRevealed || isEliminated}
                                onClick={() => handleMathMcqAnswer(idx)}
                                className={`p-4 rounded-xl text-left text-sm transition-all border flex items-center gap-3 cursor-pointer ${btnStyle}`}
                              >
                                <span className="w-6 h-6 rounded-full bg-bg-primary border border-border-theme flex items-center justify-center text-[11px] font-mono shrink-0 font-bold">
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span dangerouslySetInnerHTML={{ __html: formatMathText(choice) }} />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Next Button and Explanation */}
                    {mathRevealed && (
                      <div className="mt-6 flex flex-col gap-4">
                        <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl text-xs text-emerald-300 leading-relaxed flex items-start gap-2">
                          <span className="shrink-0 bg-emerald-500/20 p-1 rounded-lg text-emerald-400 font-bold text-[10px]">✓ GIẢI THÍCH / ĐÁP ÁN</span>
                          <span dangerouslySetInnerHTML={{ __html: formatMathText(currQ.note || (currQ.correctAnswer ? `Đáp án chính xác: ${currQ.correctAnswer}` : 'Đã ghi nhận câu trả lời.')) }} />
                        </div>
                        <button
                          onClick={() => handleNextQuestion('math')}
                          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                        >
                          CÂU HỎI TIẾP THEO →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* PHÒNG LAB 4: SINH HỌC (Multi-format Infinite Arena) */}
            {arenaState.subject === 'biology' && (() => {
              const currQ = bioGame.questions[bioGame.currentQ % (bioGame.questions.length || 1)] || {};
              const qType = currQ.type || 'mcq';

              return (
                <div className="flex-1 flex flex-col items-stretch py-4 w-full overflow-hidden h-full">
                  <div className="flex-1 flex flex-col justify-between bg-bg-tertiary rounded-3xl border border-border-theme p-6 shadow-inner select-none h-full overflow-y-auto">
                    <div>
                      {/* Header bar */}
                      <div className="flex items-center justify-between mb-6">
                        <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                          🧬 Sinh học {qType === 'tf' ? '• Đúng / Sai' : qType === 'sa' ? '• Trả lời ngắn' : '• Trắc nghiệm'}
                        </span>
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <span className="text-emerald-400 font-bold">ĐÃ LÀM ĐÚNG: {bioGame.score} CÂU</span>
                          <span className="text-text-secondary">CÂU HỎI #{bioGame.currentQ + 1}</span>
                        </div>
                      </div>

                      {/* Question text / context */}
                      <div className="bg-bg-secondary p-6 rounded-2xl border border-border-theme mb-6">
                        {qType === 'tf' ? (
                          <div>
                            <span className="text-[10px] text-cyan-400 font-bold block uppercase mb-1 tracking-wider">[Ngữ cảnh / Đề bài]</span>
                            <h3 className="text-base font-bold text-text-primary leading-relaxed" 
                                dangerouslySetInnerHTML={{ __html: formatBioText(currQ.context || currQ.text || 'Đang tải câu hỏi...') }} />
                          </div>
                        ) : (
                          <h3 className="text-base font-bold text-text-primary leading-relaxed" 
                              dangerouslySetInnerHTML={{ __html: formatBioText(currQ.text || currQ.content || 'Đang tải câu hỏi...') }} />
                        )}
                      </div>

                      {/* Render choice layout based on MCQ vs TF vs SA */}
                      {qType === 'tf' ? (
                        <div className="flex flex-col gap-4">
                          {(currQ.statements || []).map((stmt, sIdx) => {
                            const userAns = bioTfAnswers[sIdx];
                            const correctVal = Array.isArray(currQ.correct) ? currQ.correct[sIdx] : null;
                            
                            return (
                              <div key={sIdx} className="bg-bg-secondary p-4 rounded-xl border border-border-theme flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all hover:border-accent-pink/20">
                                <div className="flex-1 flex gap-3 items-start">
                                  <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[10px] font-mono shrink-0 font-bold text-cyan-400">
                                    {String.fromCharCode(97 + sIdx)}
                                  </span>
                                  <p className="text-xs text-text-primary leading-relaxed" dangerouslySetInnerHTML={{ __html: formatBioText(stmt) }} />
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    disabled={bioRevealed}
                                    onClick={() => {
                                      const next = [...bioTfAnswers];
                                      next[sIdx] = true;
                                      setBioTfAnswers(next);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border ${
                                      userAns === true
                                        ? bioRevealed 
                                          ? correctVal === true ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'
                                          : 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                        : bioRevealed && correctVal === true
                                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500/60 opacity-50'
                                          : 'bg-bg-tertiary border-border-theme text-text-secondary hover:text-text-primary'
                                    }`}
                                  >
                                    ĐÚNG
                                  </button>
                                  <button
                                    disabled={bioRevealed}
                                    onClick={() => {
                                      const next = [...bioTfAnswers];
                                      next[sIdx] = false;
                                      setBioTfAnswers(next);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border ${
                                      userAns === false
                                        ? bioRevealed 
                                          ? correctVal === false ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'
                                          : 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                        : bioRevealed && correctVal === false
                                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500/60 opacity-50'
                                          : 'bg-bg-tertiary border-border-theme text-text-secondary hover:text-text-primary'
                                    }`}
                                  >
                                    SAI
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {!bioRevealed && (
                            <button
                              onClick={() => handleTfSubmit('biology')}
                              className="mt-2 w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                              Xác nhận kết quả Đúng/Sai
                            </button>
                          )}
                        </div>
                      ) : qType === 'sa' ? (
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-3">
                            <input 
                              type="text"
                              value={saInput}
                              disabled={bioRevealed}
                              onChange={(e) => setSaInput(e.target.value)}
                              placeholder="Nhập giá trị số hoặc từ khóa trả lời..."
                              className="flex-1 bg-bg-secondary border border-border-theme rounded-2xl px-5 py-3.5 text-sm text-text-primary placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 font-mono transition-all"
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSaSubmit('biology'); }}
                            />
                            {!bioRevealed && (
                              <button
                                onClick={() => handleSaSubmit('biology')}
                                className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-600 text-zinc-950 font-black rounded-2xl shadow-lg shadow-cyan-500/20 text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0"
                              >
                                NỘP BÀI
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(currQ.choices || []).map((choice, idx) => {
                            const isSelected = bioSelected === idx;
                            const isCorrectIdx = idx === currQ.correct;
                            const isEliminated = aiEliminatedOptions.includes(idx);
                            
                            let btnStyle = "border-border-theme bg-bg-secondary text-text-primary hover:border-cyan-500/30 hover:bg-cyan-500/5";
                            if (isEliminated) {
                              btnStyle = "border-zinc-800 bg-zinc-950/40 text-zinc-600 line-through opacity-30 pointer-events-none";
                            } else if (bioRevealed) {
                              if (isCorrectIdx) {
                                btnStyle = "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-bold";
                              } else if (isSelected) {
                                btnStyle = "border-rose-500/50 bg-rose-500/10 text-rose-400 font-bold";
                              } else {
                                btnStyle = "border-border-theme bg-bg-secondary text-text-secondary opacity-50";
                              }
                            } else if (isSelected) {
                              btnStyle = "border-cyan-500 bg-cyan-500/10 text-cyan-400 font-bold";
                            }

                            return (
                              <button
                                key={idx}
                                disabled={bioRevealed || isEliminated}
                                onClick={() => handleBioAnswer(idx)}
                                className={`p-4 rounded-xl text-left text-sm transition-all border flex items-center gap-3 cursor-pointer ${btnStyle}`}
                              >
                                <span className="w-6 h-6 rounded-full bg-bg-primary border border-border-theme flex items-center justify-center text-[11px] font-mono shrink-0 font-bold">
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span dangerouslySetInnerHTML={{ __html: formatBioText(choice) }} />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Next Button and Explanation */}
                    {bioRevealed && (
                      <div className="mt-6 flex flex-col gap-4">
                        <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl text-xs text-emerald-300 leading-relaxed flex items-start gap-2">
                          <span className="shrink-0 bg-emerald-500/20 p-1 rounded-lg text-emerald-400 font-bold text-[10px]">✓ GIẢI THÍCH / ĐÁP ÁN</span>
                          <span dangerouslySetInnerHTML={{ __html: formatBioText(currQ.note || (currQ.correctAnswer ? `Đáp án chính xác: ${currQ.correctAnswer}` : 'Đã ghi nhận câu trả lời.')) }} />
                        </div>
                        <button
                          onClick={() => handleNextQuestion('biology')}
                          className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                        >
                          CÂU HỎI TIẾP THEO →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
            
            {/* THANH THẺ BÀI STRATEGY TRONG TRẬN THI ĐẤU */}
            {(() => {
              const isP1 = isPlayer1Role;
              const activeData = currentRoomData || latestRoomDataRef.current;
              const myEquippedCardIds = isP1 ? (activeData?.player1Equipment || []) : (activeData?.player2Equipment || []);
              const myRoleKey = isP1 ? 'p1' : 'p2';
              const myEffects = activeData?.activeEffects?.[myRoleKey] || {};
              const isShieldActive = myEffects.reflectActive && (myEffects.reflectUntil ? myEffects.reflectUntil > Date.now() : true);
              const shieldSecLeft = myEffects.reflectUntil ? Math.max(0, Math.ceil((myEffects.reflectUntil - Date.now()) / 1000)) : 0;

              if ((!myEquippedCardIds || myEquippedCardIds.length === 0) && !isShieldActive) return null;

              return (
                <div className="mt-3 pt-2.5 border-t border-border-theme flex items-center justify-between gap-3 bg-bg-primary/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-amber-500/30 shrink-0">
                  <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold shrink-0">
                    <Zap className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                    <span>CHIẾN THUẬT:</span>
                    {isShieldActive && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/50 animate-pulse">
                        <ShieldAlert className="w-3 h-3 text-orange-400" />
                        KHIÊN PHẢN ĐÒN ({shieldSecLeft}s)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5">
                    {myEquippedCardIds.map((cardId, idx) => {
                      const card = getEquipmentById(cardId);
                      if (!card) return null;

                      let actionTag = 'DÙNG ⚡';
                      let btnBg = 'from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-300';
                      if (cardId === 'card_counter') {
                        actionTag = 'PHẢN ĐÒN 🛡️';
                        btnBg = 'from-orange-500/20 to-amber-500/20 border-orange-500/50 text-orange-300';
                      } else if (cardId === 'card_progress_steal') {
                        actionTag = 'CƯỚP ĐIỂM 🥷';
                        btnBg = 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300';
                      } else if (cardId === 'card_time_freeze') {
                        actionTag = 'ĐÔNG BĂNG ❄️';
                        btnBg = 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-300';
                      } else if (cardId === 'card_smoke_fog') {
                        actionTag = 'MÙ SƯƠNG 🌫️';
                        btnBg = 'from-purple-500/20 to-indigo-500/20 border-purple-500/40 text-purple-300';
                      } else if (cardId === 'card_dispel') {
                        actionTag = 'GIẢI TRỪ ✨';
                        btnBg = 'from-teal-500/20 to-emerald-500/20 border-teal-500/40 text-teal-300';
                      } else if (cardId === 'card_magic_hand') {
                        actionTag = 'CƯỚP THẺ 🖐️';
                        btnBg = 'from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/40 text-fuchsia-300';
                      } else if (cardId === 'card_ai_assist') {
                        actionTag = 'AI HỖ TRỢ 🤖';
                        btnBg = 'from-violet-500/20 to-purple-500/20 border-violet-500/40 text-violet-300';
                      }

                      return (
                        <button
                          key={`${cardId}_${idx}`}
                          onClick={() => handleUseCard(cardId)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r ${btnBg} hover:brightness-125 border transition-all text-xs font-mono font-bold active:scale-95 shrink-0 shadow-sm cursor-pointer`}
                          title={card.description}
                        >
                          <span>{card.name}</span>
                          <span className="text-[10px] bg-zinc-950/80 px-1.5 py-0.5 rounded font-black border border-white/20">
                            {actionTag}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Progress Bar Toàn trận dưới đáy cột */}
            <div className="mt-4 pt-3 border-t border-border-theme flex items-center gap-4 select-none relative">
              <span className="text-[10px] text-text-secondary font-bold font-mono uppercase shrink-0">MY EXPERIMENT STAGE:</span>
              <div className="flex-1 h-3.5 bg-bg-tertiary rounded-full overflow-hidden border border-border-theme relative">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 rounded-full transition-all duration-500 shadow-md shadow-pink-500/10" 
                  style={{ width: `${arenaState.playerProgress}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-text-primary font-mono tracking-widest">
                  {arenaState.playerProgress}% COMPLETE
                </span>
              </div>

              {/* Avatar người chơi thu nhỏ với bong bóng chat */}
              <div className="relative shrink-0 w-8 h-8 rounded-xl bg-accent-pink/10 border border-accent-pink/30 flex items-center justify-center text-accent-pink font-bold text-xs">
                {user?.displayName?.charAt(0).toUpperCase() || 'B'}
                
                {/* Bong bóng chat nổi của chính mình */}
                {playerChat && (
                  <div className="absolute bottom-11 right-0 px-3 py-1.5 bg-gradient-to-br from-pink-500 to-rose-600 border border-pink-400 text-white text-xs font-bold rounded-2xl rounded-br-none shadow-2xl animate-bounce whitespace-nowrap z-50">
                    {playerChat.type === 'emoji' ? (
                      <span className="text-lg">{playerChat.text}</span>
                    ) : (
                      <span>{playerChat.text}</span>
                    )}
                    <div className="absolute bottom-[-5px] right-3 w-2.5 h-2.5 bg-rose-600 border-r border-b border-pink-400 transform rotate-45" />
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* CỘT PHẢI (COL-SPAN-4): BẢNG GIÁM SÁT ĐỐI THỦ THỜI GIAN THỰC */}
          <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-8">
            
            {/* Monitor Card */}
            <div className="bg-bg-secondary/95 backdrop-blur-xl border border-border-theme rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border-theme pb-4 mb-4 select-none">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-widest font-mono">OPPONENT TRACKER HUD</span>
                  <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
                </div>

                {/* Opponent Info Header */}
                <div className="flex items-center gap-3 bg-bg-tertiary p-3 rounded-2xl border border-border-theme mb-6 relative">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-xl font-bold relative shrink-0">
                    {arenaState.opponentInfo?.name ? arenaState.opponentInfo.name.charAt(0).toUpperCase() : 'O'}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-500 border border-bg-tertiary text-[9px] font-bold text-white flex items-center justify-center">
                      {arenaState.opponentInfo?.level || 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-text-primary font-bold text-sm leading-tight truncate">{arenaState.opponentInfo?.name || 'Đang chờ đối thủ...'}</h4>
                    <span className="text-[9px] text-rose-400 font-mono font-bold px-1.5 py-0.5 bg-rose-500/10 rounded mt-1 inline-block uppercase">
                      {arenaState.opponentInfo?.title || 'Tập sự'}
                    </span>

                    {/* HIỂN THỊ TRẠNG THÁI KHỐNG CHẾ ĐỐI THỦ (ĐÔNG BĂNG / MÙ SƯƠNG) */}
                    {(() => {
                      const isP1 = isPlayer1Role;
                      const activeData = currentRoomData || latestRoomDataRef.current;
                      const oppEffects = isP1 ? activeData?.activeEffects?.p2 : activeData?.activeEffects?.p1;
                      const freezeRemainingSec = oppEffects?.frozenUntil ? Math.max(0, Math.ceil((oppEffects.frozenUntil - nowTick) / 1000)) : 0;
                      const fogRemainingSec = oppEffects?.fogUntil ? Math.max(0, Math.ceil((oppEffects.fogUntil - nowTick) / 1000)) : 0;

                      if (freezeRemainingSec === 0 && fogRemainingSec === 0) return null;
                      return (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {freezeRemainingSec > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-[9px] font-bold flex items-center gap-1 animate-pulse">
                              <Snowflake className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                              <span>BỊ ĐÓNG BĂNG ({freezeRemainingSec}s)</span>
                            </span>
                          )}
                          {fogRemainingSec > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-400/40 text-purple-300 font-mono text-[9px] font-bold flex items-center gap-1">
                              <CloudFog className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                              <span>MÙ SƯƠNG ({fogRemainingSec}s)</span>
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Bong bóng chat nổi của đối thủ */}
                  {opponentChat && (
                    <div className="absolute bottom-16 left-6 px-3.5 py-2 bg-gradient-to-br from-rose-600 to-orange-500 border border-rose-500 text-white text-xs font-bold rounded-2xl rounded-bl-none shadow-2xl animate-bounce whitespace-nowrap z-50">
                      {opponentChat.type === 'emoji' ? (
                        <span className="text-lg">{opponentChat.text}</span>
                      ) : (
                        <span>{opponentChat.text}</span>
                      )}
                      <div className="absolute bottom-[-5px] left-3.5 w-2.5 h-2.5 bg-rose-600 border-r border-b border-rose-500 transform rotate-45" />
                    </div>
                  )}
                </div>

                {/* Opponent Progress meter */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-[10px] text-text-secondary font-bold uppercase font-mono">
                    <span>STAGE COMPLETE</span>
                    <span className="text-rose-400 font-extrabold">{arenaState.opponentProgress}%</span>
                  </div>
                  <div className="w-full h-4 bg-bg-tertiary rounded-full overflow-hidden border border-border-theme relative">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-500 to-orange-600 rounded-full transition-all duration-300 shadow-md" 
                      style={{ width: `${arenaState.opponentProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Log sự kiện kịch tính */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block font-mono">COHERENT SIGNAL FEED</span>
                <div className="h-48 bg-bg-tertiary p-3.5 rounded-2xl border border-border-theme overflow-y-auto text-[10px] font-semibold text-text-secondary space-y-1.5 font-mono select-none">
                  {arenaState.logs.map((log, index) => (
                    <div key={index} className="flex gap-2 leading-relaxed items-start border-l border-rose-500/30 pl-2">
                      <span className="text-rose-500 shrink-0">»</span>
                      <span className={index === 0 ? 'text-text-primary font-bold' : ''}>{log}</span>
                    </div>
                  ))}
                  {arenaState.logs.length === 0 && (
                    <div className="text-text-secondary text-center py-12">LISTENING TO SECTOR SIGNALS...</div>
                  )}
                </div>
              </div>
            </div>

            {/* Thanh công cụ Chat & Emoji tương tác */}
            <div className="bg-bg-secondary/95 backdrop-blur-xl border border-border-theme rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block font-mono">TƯƠNG TÁC ĐẤU TRƯỜNG</span>
              
              {/* Thả Emoji nhanh */}
              <div className="flex justify-between items-center gap-2 bg-bg-tertiary p-2 rounded-2xl border border-border-theme">
                {['😂', '🔥', '😱', '👑', '🤝', '⚡'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendQuickChat(emoji, 'emoji')}
                    className="w-10 h-10 flex items-center justify-center text-lg hover:scale-125 hover:bg-bg-primary active:scale-95 transition-all rounded-xl cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Nhập tin nhắn tự viết */}
              <form onSubmit={handleSendCustomChat} className="flex gap-2">
                <input
                  type="text"
                  value={customChat}
                  onChange={(e) => setCustomChat(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-bg-tertiary border border-border-theme focus:border-accent-pink/40 rounded-xl px-3.5 py-2.5 text-xs text-text-primary placeholder-text-secondary focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!customChat.trim()}
                  className="px-3.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Chat mẫu nhanh */}
              <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto pr-1">
                {[
                  "Chào bạn, thi đấu vui vẻ nhé!",
                  "Gió đông đã nổi, quyết chiến thôi!",
                  "Laser của tôi đã hội tụ rồi!",
                  "Phản ứng cân bằng đẹp mắt thật!",
                  "Tiến độ của bạn nhanh quá đấy!",
                  "Suýt chút nữa là thành công rồi!",
                  "Thời gian sắp hết, cố lên nhé!"
                ].map((msg) => (
                  <button
                    key={msg}
                    onClick={() => sendQuickChat(msg, 'message')}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-text-secondary hover:text-text-primary bg-bg-tertiary border border-border-theme hover:border-accent-pink/30 rounded-xl transition-all cursor-pointer block truncate"
                  >
                    💬 {msg}
                  </button>
                ))}
              </div>
            </div>

            {/* TRỢ LÝ AI TRỰC TUYẾN (AI COPILOT COCKPIT) */}
            <div className="bg-bg-secondary/95 backdrop-blur-xl border border-accent-pink/20 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-border-theme pb-3.5 select-none">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4.5 h-4.5 text-accent-pink animate-pulse" />
                  <span className="text-[10px] font-black text-text-primary uppercase tracking-widest font-mono">
                    BUỒNG TRỢ LÝ AI (COPILOT)
                  </span>
                </div>
                <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                  ONLINE
                </span>
              </div>

              {/* Bong bóng tin nhắn hiển thị lời thoại gợi ý của AI */}
              <div className="bg-bg-tertiary p-4 rounded-2xl border border-border-theme relative">
                <p className="text-[11px] text-text-primary leading-relaxed text-left font-sans whitespace-pre-wrap">
                  {arenaAiText}
                </p>
                <div className="absolute top-3 -left-1.5 w-3 h-3 bg-bg-tertiary border-l border-t border-border-theme transform rotate-[-45deg]" />
              </div>

              <div className="flex gap-2">
                {/* Nút yêu cầu gợi ý nhanh */}
                <button
                  onClick={handleGetArenaAiHint}
                  className="flex-1 py-2.5 bg-bg-tertiary hover:bg-bg-primary border border-border-theme hover:border-accent-pink/40 text-accent-pink hover:text-text-primary rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer font-mono"
                >
                  <Sparkles className="w-3.5 h-3.5" /> GỢI Ý CÔNG THỨC
                </button>
              </div>

              {/* Form hỏi đáp tùy ý */}
              <form onSubmit={handleArenaAiQuerySubmit} className="flex gap-2">
                <input
                  type="text"
                  value={arenaAiQuery}
                  onChange={(e) => setArenaAiQuery(e.target.value)}
                  placeholder="Hỏi công thức, phản ứng..."
                  className="flex-1 bg-bg-tertiary border border-border-theme focus:border-accent-pink/40 rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder-text-secondary focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!arenaAiQuery.trim()}
                  className="px-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

      {/* 4. TRẠNG THÁI RESULT: HIỂN THỊ HỘP THOẠI KẾT QUẢ CẬP NHẬT ELO */}
      {arenaState.status === 'result' && (
        <div className="flex items-center justify-center py-10 animate-in zoom-in-95 duration-300">
          <div className="w-full max-w-md bg-bg-secondary/95 backdrop-blur-xl border border-border-theme rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
            {arenaState.matchResult === 'victory' ? (
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none" />
            ) : (
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-rose-500/5 rounded-full filter blur-2xl pointer-events-none" />
            )}

            <div className="flex flex-col items-center mb-6">
              {arenaState.matchResult === 'victory' ? (
                <>
                  <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400 animate-bounce">
                    <Trophy className="w-10 h-10 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]" />
                  </div>
                  <h2 className="text-2xl font-black text-text-primary tracking-widest uppercase font-mono">MISSION ACCOMPLISHED!</h2>
                  <p className="text-amber-400 text-xs font-bold uppercase mt-1">Xuất sắc hoàn tất thí nghiệm trước đối thủ!</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400 animate-pulse">
                    <AlertTriangle className="w-10 h-10 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.2)]" />
                  </div>
                  <h2 className="text-2xl font-black text-text-primary tracking-widest uppercase font-mono">MISSION FAILED</h2>
                  <p className="text-rose-400 text-xs font-bold uppercase mt-1">Đối thủ hoặc giới hạn thời gian đã vượt qua bạn!</p>
                </>
              )}
            </div>

            {/* Thống kê thay đổi */}
            <div className={`grid ${arenaState.matchResult === 'victory' ? 'grid-cols-3' : 'grid-cols-2'} gap-4 bg-bg-tertiary p-5 rounded-2xl border border-border-theme mb-8 font-mono`}>
              <div className="text-center">
                <span className="text-[10px] text-text-secondary font-bold block uppercase mb-1">Xếp hạng (ELO)</span>
                <span className={`text-2xl font-black ${arenaState.matchResult === 'victory' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {arenaState.matchResult === 'victory' ? '+25' : '-15'} ELO
                </span>
                <span className="text-[10px] text-text-secondary block mt-1">Hiện tại: {personalization.elo} ELO</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-text-secondary font-bold block uppercase mb-1">Kinh nghiệm (EXP)</span>
                <span className="text-2xl font-black text-cyan-400">
                  +{arenaState.matchResult === 'victory' ? '250' : '50'} EXP
                </span>
                <span className="text-[10px] text-text-secondary block mt-1">Lv.{personalization.level} ({personalization.exp}/{personalization.nextLevelExp})</span>
              </div>
              {arenaState.matchResult === 'victory' && (
                <div className="text-center animate-in fade-in slide-in-from-bottom-3 duration-500">
                  <span className="text-[10px] text-text-secondary font-bold block uppercase mb-1">Pha lê (Crystal)</span>
                  <span className="text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
                    +50 <CrystalIcon className="w-6 h-6" />
                  </span>
                  <span className="text-[10px] text-text-secondary block mt-1">Hiện tại: {personalization.crystals || 0}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onMouseEnter={playSound.hover}
                onClick={handleShareToStories}
                className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2 font-mono"
              >
                <Sparkles className="w-4 h-4 animate-pulse" /> CHIA SẺ CHIẾN TÍCH LÊN STORIES
              </button>

              <button
                onMouseEnter={playSound.hover}
                onClick={() => setArenaStatus('idle')}
                className="w-full py-3.5 bg-bg-tertiary hover:bg-bg-primary border border-border-theme text-text-primary text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2 font-mono"
              >
                <RotateCcw className="w-4 h-4" /> RE-ENTER ARENA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CẢNH BÁO VI PHẠM RỜI TAB (THOÁT TAB) */}
      {tabExitModal && (
        <div className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#111424] border border-rose-500/50 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-[0_0_80px_rgba(244,63,94,0.35)] text-center relative overflow-hidden font-sans">
            <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/50 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>

            <h3 className="text-xl font-black text-rose-400 mb-2 uppercase tracking-wide">
              {tabExitModal.forfeited ? '🚨 XỬ THUA DO GIAN LẬN!' : `⚠️ CẢNH BÁO VI PHẠM RỜI TAB (${tabExitModal.count}/5)`}
            </h3>

            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              {tabExitModal.forfeited ? (
                <span className="text-rose-300 font-semibold block">
                  Bạn đã vi phạm rời khỏi tab quá 5 lần quy định. Trận đấu kết thúc và bạn bị xử thua ngay lập tức!
                </span>
              ) : (
                <>
                  Phát hiện chuyển tab trong lúc thi đấu! Bạn vừa bị trừ <span className="text-amber-400 font-bold">{tabExitModal.penalty} giây</span> vào quỹ thời gian.
                  <span className="text-rose-400 font-semibold mt-3 block bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-xl">
                    Vi phạm thêm {6 - tabExitModal.count} lần nữa sẽ bị XỬ THUA LẬP TỨC!
                  </span>
                </>
              )}
            </p>

            <button
              onClick={() => {
                playSound.click();
                setTabExitModal(null);
              }}
              className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-sm rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              {tabExitModal.forfeited ? 'Đã hiểu & Thoát' : 'Tôi đã hiểu — Tiếp tục thi đấu'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL CỬA HÀNG TRANG BỊ MINI CHO ĐẤU TRƯỜNG 1V1 (CHỈ MỞ Ở SẢNH IDLE) */}
      <MiniEquipmentShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        user={user}
        personalization={personalization}
        setPersonalization={setPersonalization}
      />

      </div>
    </div>
  );
}

export default function DauTruongPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#1c1e29] text-white">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-zinc-400">Đang tải đấu trường...</p>
      </div>
    }>
      <DauTruongContent />
    </Suspense>
  );
}
















