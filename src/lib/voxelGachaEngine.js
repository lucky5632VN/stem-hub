/**
 * ============================================================================
 * VOXEL GACHA ENGINE (STEM & Minecraft Lucky Block System)
 * ============================================================================
 * Handles:
 * 1. Catalog of STEM & Voxel customizer items (Legendary, Epic, Rare, Common)
 * 2. Web Audio API synthesizer for 0-latency sci-fi & Minecraft sound effects
 * 3. Lucky Block procedural texture generator (normal and cracked states)
 * 4. Pity System algorithm (Soft pity @ 30, Hard pity @ 50, 10-pull Epic guarantee)
 * 5. Duplicate item detection & automatic conversion into Quantum Crystals
 * ============================================================================
 */

import { useAppStore } from '../store/useAppStore.js';

// ============================================================================
// 1. POOL VẬT PHẨM GACHA VOXEL LUCKY BLOCK
// ============================================================================
export const VOXEL_GACHA_POOL = [
  // --- HUYỀN THOẠI (LEGENDARY - VÀNG RỰC RỠ / LỬA HẠT) - 5★ ---
  {
    id: 'dragon_elo',
    name: 'Áo Choàng ELO Rồng Vàng',
    category: 'cape',
    categoryName: 'Áo Choàng',
    rarity: 'Legendary',
    stars: 5,
    compensation: 500,
    desc: 'Áo choàng hoàng kim thêu hoa văn Rồng Lượng Tử phát quang.',
    icon: '🐉',
    type: 'cosmetic'
  },
  {
    id: 'nether_tech',
    name: 'Giáp Nether-Tech Lượng Tử',
    category: 'top',
    categoryName: 'Trang Phục',
    rarity: 'Legendary',
    stars: 5,
    compensation: 500,
    desc: 'Bộ giáp hợp kim Netherite tích hợp vi mạch năng lượng tối tân.',
    icon: '🛡️',
    type: 'cosmetic'
  },
  {
    id: 'diamond_pickaxe',
    name: 'Cuốc Kim Cương Lượng Tử',
    category: 'held',
    categoryName: 'Cầm Tay',
    rarity: 'Legendary',
    stars: 5,
    compensation: 500,
    desc: 'Công cụ biểu tượng huyền thoại khai thác khoáng thạch tri thức.',
    icon: '⛏️',
    type: 'cosmetic'
  },
  {
    id: 'stem_trophy',
    name: 'Cúp Kim Cương STEM',
    category: 'held',
    categoryName: 'Cầm Tay',
    rarity: 'Legendary',
    stars: 5,
    compensation: 500,
    desc: 'Cúp lưu niệm kết tinh từ kim cương khối đa diện tối thượng.',
    icon: '🏆',
    type: 'cosmetic'
  },
  {
    id: 'cyber_anime',
    name: 'Tóc Anime Neon Cyberpunk',
    category: 'hair',
    categoryName: 'Tóc Voxel',
    rarity: 'Legendary',
    stars: 5,
    compensation: 500,
    desc: 'Kiểu tóc nhọn anime chuyển màu quang phổ RGB phát sáng trong đêm.',
    icon: '⚡',
    type: 'cosmetic'
  },
  {
    id: 'cyborg_silver',
    name: 'Màu Da Cyborg Bạc',
    category: 'body',
    categoryName: 'Màu Da',
    rarity: 'Legendary',
    stars: 5,
    compensation: 500,
    desc: 'Lớp hợp kim titan bóng bẩy phản chiếu ánh sáng môi trường 3D.',
    icon: '🤖',
    type: 'cosmetic'
  },
  {
    id: 'quantum_wings',
    name: 'Đôi Cánh Lượng Tử Photon',
    category: 'accessory',
    categoryName: 'Phụ Kiện',
    rarity: 'Legendary',
    stars: 5,
    compensation: 500,
    desc: 'Đôi cánh photon nano rung động theo tần số ánh sáng mặt trời.',
    icon: '🪽',
    type: 'cosmetic'
  },
  {
    id: 'nano_suit',
    name: 'Giáp Nano Lượng Tử LED',
    category: 'top',
    categoryName: 'Trang Phục',
    rarity: 'Legendary',
    stars: 5,
    compensation: 500,
    desc: 'Chiến giáp sợi carbon siêu nhẹ phủ mạch điện tử Cyan phát sáng.',
    icon: '🥋',
    type: 'cosmetic'
  },

  // --- SIÊU CẤP (EPIC - TÍM MA TRẬN HOLOGRAM) - 4★ ---
  {
    id: 'aurora',
    name: 'Áo Choàng Cực Quang Aurora',
    category: 'cape',
    categoryName: 'Áo Choàng',
    rarity: 'Epic',
    stars: 4,
    compensation: 150,
    desc: 'Dải cực quang phương bắc mềm mại chuyển sắc xanh ngọc - tím mộng mơ.',
    icon: '🌌',
    type: 'cosmetic'
  },
  {
    id: 'astronaut_nebula',
    name: 'Đồ Phi Hành Gia Nebula',
    category: 'top',
    categoryName: 'Trang Phục',
    rarity: 'Epic',
    stars: 4,
    compensation: 150,
    desc: 'Bộ đồ du hành vũ trụ chống bức xạ chuẩn NASA viền LED tím.',
    icon: '👨‍🚀',
    type: 'cosmetic'
  },
  {
    id: 'einstein_hair',
    name: 'Tóc Xù Einstein Thiên Tài',
    category: 'hair',
    categoryName: 'Tóc Voxel',
    rarity: 'Epic',
    stars: 4,
    compensation: 150,
    desc: 'Mái tóc bạc kinh điển của nhà vật lý vĩ đại tích điện nhẹ.',
    icon: '💡',
    type: 'cosmetic'
  },
  {
    id: 'ar_goggles',
    name: 'Kính Bảo Hộ AR Cyber',
    category: 'accessory',
    categoryName: 'Kính & Mũ',
    rarity: 'Epic',
    stars: 4,
    compensation: 150,
    desc: 'Kính thực tế tăng cường hiển thị thông số vật lý trực tiếp lên võng mạc.',
    icon: '🥽',
    type: 'cosmetic'
  },
  {
    id: 'ruler_3d',
    name: 'Thước Đo 3D Hologram',
    category: 'held',
    categoryName: 'Cầm Tay',
    rarity: 'Epic',
    stars: 4,
    compensation: 150,
    desc: 'Thước quang học chiếu lưới tọa độ không gian 3 chiều chuẩn milimet.',
    icon: '📐',
    type: 'cosmetic'
  },
  {
    id: 'alien_green',
    name: 'Màu Da Alien Ngọc Lục',
    category: 'body',
    categoryName: 'Màu Da',
    rarity: 'Epic',
    stars: 4,
    compensation: 150,
    desc: 'Sắc tố sinh học xanh lục bảo huỳnh quang ngoài trái đất.',
    icon: '👽',
    type: 'cosmetic'
  },
  {
    id: 'lab_helmet',
    name: 'Mũ Bảo Hộ Lab Nano',
    category: 'accessory',
    categoryName: 'Kính & Mũ',
    rarity: 'Epic',
    stars: 4,
    compensation: 150,
    desc: 'Mũ bảo vệ gia cố từ ống nano carbon chịu nhiệt độ cao.',
    icon: '⛑️',
    type: 'cosmetic'
  },
  {
    id: 'cyber_hoodie',
    name: 'Áo Hoodie Hacker Cyber',
    category: 'top',
    categoryName: 'Trang Phục',
    rarity: 'Epic',
    stars: 4,
    compensation: 150,
    desc: 'Áo nỉ phong cách hacker màn đêm viền neon phát sáng.',
    icon: '🧥',
    type: 'cosmetic'
  },

  // --- HIẾM (RARE - CYAN NEON ĐIỆN TỬ) - 3★ ---
  {
    id: 'matrix',
    name: 'Áo Choàng Ma Trận Matrix',
    category: 'cape',
    categoryName: 'Áo Choàng',
    rarity: 'Rare',
    stars: 3,
    compensation: 50,
    desc: 'Dòng mã nhị phân số học chạy liên tục trên nền lụa đen.',
    icon: '💻',
    type: 'cosmetic'
  },
  {
    id: 'lab_coat',
    name: 'Áo Blouse Trắng Viền Neon',
    category: 'top',
    categoryName: 'Trang Phục',
    rarity: 'Rare',
    stars: 3,
    compensation: 50,
    desc: 'Áo nghiên cứu sinh hóa học thanh lịch với viền phản quang Cyan.',
    icon: '🥼',
    type: 'cosmetic'
  },
  {
    id: 'chemical_flask',
    name: 'Bình Hóa Chất Sủi Bọt',
    category: 'held',
    categoryName: 'Cầm Tay',
    rarity: 'Rare',
    stars: 3,
    compensation: 50,
    desc: 'Bình tam giác Erlenmeyer chứa dung dịch huỳnh quang sủi tăm khí.',
    icon: '🧪',
    type: 'cosmetic'
  },
  {
    id: 'sci_glasses',
    name: 'Kính Trí Tuệ Giáo Sư',
    category: 'accessory',
    categoryName: 'Kính & Mũ',
    rarity: 'Rare',
    stars: 3,
    compensation: 50,
    desc: 'Gọng kính titan mảnh toát lên phong thái nhà khoa học thực thụ.',
    icon: '👓',
    type: 'cosmetic'
  },
  {
    id: 'tan',
    name: 'Màu Da Tan Rám Nắng',
    category: 'body',
    categoryName: 'Màu Da',
    rarity: 'Rare',
    stars: 3,
    compensation: 50,
    desc: 'Làn da bánh mật rám nắng khỏe khoắn và năng động.',
    icon: '☀️',
    type: 'cosmetic'
  },
  {
    id: 'cyan_eyes',
    name: 'Mắt Cyan Lượng Tử 2x1',
    category: 'eyes',
    categoryName: 'Màu Mắt',
    rarity: 'Rare',
    stars: 3,
    compensation: 50,
    desc: 'Mắt pixel 2x1 phát quang HUD quét dữ liệu tức thì.',
    icon: '👁️',
    type: 'cosmetic'
  },
  {
    id: 'ruby_eyes',
    name: 'Mắt Ruby Nhiệt Hạch 2x1',
    category: 'eyes',
    categoryName: 'Màu Mắt',
    rarity: 'Rare',
    stars: 3,
    compensation: 50,
    desc: 'Năng lượng phản ứng nhiệt hạch bốc cháy nhiệt huyết.',
    icon: '🔥',
    type: 'cosmetic'
  },

  // --- THƯỜNG / CƠ BẢN (COMMON - THÉP XÁM CÔNG NGHỆ) - 2★ ---
  {
    id: 'basic_cap',
    name: 'Mũ Bảo Hộ Cơ Bản',
    category: 'accessory',
    categoryName: 'Kính & Mũ',
    rarity: 'Common',
    stars: 2,
    compensation: 20,
    desc: 'Mũ bảo hộ công trường tiêu chuẩn độ bền cao.',
    icon: '👷',
    type: 'cosmetic'
  },
  {
    id: 'intern_tshirt',
    name: 'Áo Thun Thực Tập STEM',
    category: 'top',
    categoryName: 'Trang Phục',
    rarity: 'Common',
    stars: 2,
    compensation: 20,
    desc: 'Áo thun cotton thoáng mát in logo STEM HUB năng động.',
    icon: '👕',
    type: 'cosmetic'
  },
  {
    id: 'lab_notebook',
    name: 'Sổ Ghi Chép Thí Nghiệm',
    category: 'held',
    categoryName: 'Cầm Tay',
    rarity: 'Common',
    stars: 2,
    compensation: 20,
    desc: 'Cuốn sổ bìa cứng lưu giữ dữ liệu và công thức nghiên cứu.',
    icon: '📓',
    type: 'cosmetic'
  },
  {
    id: 'ph_pen',
    name: 'Bút Đo pH Kỹ Thuật Số',
    category: 'held',
    categoryName: 'Cầm Tay',
    rarity: 'Common',
    stars: 2,
    compensation: 20,
    desc: 'Thiết bị điện tử cầm tay đo độ axit/bazơ nhanh chóng.',
    icon: '🖊️',
    type: 'cosmetic'
  },
  {
    id: 'tech_jeans',
    name: 'Quần Jeans Kỹ Thuật',
    category: 'bottom',
    categoryName: 'Trang Phục',
    rarity: 'Common',
    stars: 2,
    compensation: 20,
    desc: 'Quần bò xanh đậm có đai đeo dụng cụ tiện lợi cho kỹ sư.',
    icon: '👖',
    type: 'cosmetic'
  },
  {
    id: 'emerald_eyes',
    name: 'Mắt Ngọc Lục Bảo 2x1',
    category: 'eyes',
    categoryName: 'Màu Mắt',
    rarity: 'Common',
    stars: 2,
    compensation: 20,
    desc: 'Màu mắt xanh lục tự nhiên cân bằng và hài hòa.',
    icon: '🟢',
    type: 'cosmetic'
  }
];

// ============================================================================
// 2. THUẬT TOÁN QUAY GACHA VÀ BẢO HIỂM (PITY SYSTEM)
// ============================================================================
export const GACHA_CONSTANTS = {
  PULL_COST_SINGLE: 100,
  PULL_COST_MULTI: 900,
  HARD_PITY_THRESHOLD: 50,
  SOFT_PITY_START: 30,
  FREQUENCY_CRITICAL_THRESHOLD: 7.5
};

/**
 * Thực hiện thuật toán quay Gacha lượng tử bảo vệ người chơi
 */
export function rollVoxelGacha(count = 10, currentUnlocked = [], currentTitles = [], initialPity = 0) {
  let pity = initialPity;
  const rollResults = [];
  let newlyWonIds = [];
  let totalCompensation = 0;

  const workingUnlocked = [...currentUnlocked];
  const workingTitles = [...currentTitles];

  for (let i = 0; i < count; i++) {
    pity++;

    // Tỷ lệ Rarity:
    // Hard pity @ 50: 100% Legendary
    // Soft pity @ >= 30: +5% Legendary mỗi lần quay
    let probLegendary = 4;
    if (pity >= GACHA_CONSTANTS.HARD_PITY_THRESHOLD) {
      probLegendary = 100;
    } else if (pity >= GACHA_CONSTANTS.SOFT_PITY_START) {
      probLegendary = 4 + (pity - GACHA_CONSTANTS.SOFT_PITY_START) * 5;
    }

    const rand = Math.random() * 100;
    let selectedRarity = 'Common';

    if (rand < probLegendary) {
      selectedRarity = 'Legendary';
      pity = 0; // Reset Pity khi nhận SSR
    } else if (rand < probLegendary + 22) {
      selectedRarity = 'Epic';
    } else if (rand < probLegendary + 22 + 45) {
      selectedRarity = 'Rare';
    } else {
      selectedRarity = 'Common';
    }

    // Đảm bảo lượt quay x10 có ít nhất 1 Epic hoặc Legendary (10-pull pity)
    if (count === 10 && i === 9 && !rollResults.some(r => r.item.rarity === 'Legendary' || r.item.rarity === 'Epic')) {
      selectedRarity = 'Epic';
    }

    // Lọc pool theo rarity
    let pool = VOXEL_GACHA_POOL.filter(item => item.rarity === selectedRarity);
    if (pool.length === 0) pool = VOXEL_GACHA_POOL;
    const selectedItem = pool[Math.floor(Math.random() * pool.length)];

    // Xử lý vật phẩm trùng lặp (Duplicate Detection)
    let isDuplicate = false;
    const compensation = selectedItem.compensation || 
      (selectedRarity === 'Legendary' ? 500 : selectedRarity === 'Epic' ? 150 : selectedRarity === 'Rare' ? 50 : 20);

    if (selectedItem.type === 'cosmetic') {
      if (workingUnlocked.includes(selectedItem.id)) {
        isDuplicate = true;
        totalCompensation += compensation;
      } else {
        workingUnlocked.push(selectedItem.id);
        newlyWonIds.push(selectedItem.id);
      }
    } else {
      if (workingTitles.includes(selectedItem.id)) {
        isDuplicate = true;
        totalCompensation += compensation;
      } else {
        workingTitles.push(selectedItem.id);
        newlyWonIds.push(selectedItem.id);
      }
    }

    rollResults.push({
      item: selectedItem,
      isDuplicate,
      compensation
    });
  }

  return {
    results: rollResults,
    newPity: pity,
    newlyWonIds,
    totalCompensation,
    updatedUnlocked: workingUnlocked,
    updatedTitles: workingTitles
  };
}

// ============================================================================
// 3. WEB AUDIO SYNTHESIZER
// ============================================================================
let gachaAudioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!gachaAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) gachaAudioCtx = new AudioContextClass();
  }
  if (gachaAudioCtx && gachaAudioCtx.state === 'suspended') {
    gachaAudioCtx.resume();
  }
  return gachaAudioCtx;
}

export const voxelAudio = {
  playSpark: () => {
    try {
      if (typeof window !== 'undefined' && useAppStore?.getState && !useAppStore.getState().soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400 + Math.random() * 800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } catch {}
  },

  playCharge: (ratio = 0) => {
    try {
      if (typeof window !== 'undefined' && useAppStore?.getState && !useAppStore.getState().soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const targetFreq = 180 + ratio * 1600;
      osc.frequency.setValueAtTime(targetFreq * 0.9, now);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.08);
      gain.gain.setValueAtTime(0.05 + ratio * 0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  },

  playShatter: () => {
    try {
      if (typeof window !== 'undefined' && useAppStore?.getState && !useAppStore.getState().soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Bass Thud
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(120, now);
      bassOsc.frequency.exponentialRampToValueAtTime(28, now + 0.55);
      bassGain.gain.setValueAtTime(0.28, now);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 0.55);

      // Crystal Cascade
      const freqs = [1600, 2200, 2900, 3800];
      freqs.forEach((f, i) => {
        const chime = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(f, now + i * 0.03);
        chime.frequency.exponentialRampToValueAtTime(f * 0.7, now + i * 0.03 + 0.35);
        chimeGain.gain.setValueAtTime(0.06, now + i * 0.03);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.03 + 0.35);
        chime.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        chime.start(now + i * 0.03);
        chime.stop(now + i * 0.03 + 0.35);
      });
    } catch {}
  },

  playCardFlip: () => {
    try {
      if (typeof window !== 'undefined' && useAppStore?.getState && !useAppStore.getState().soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  },

  playLegendaryStinger: () => {
    try {
      if (typeof window !== 'undefined' && useAppStore?.getState && !useAppStore.getState().soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.07);
        gain.gain.setValueAtTime(0.08, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.45);
      });
    } catch {}
  },

  playEpicStinger: () => {
    try {
      if (typeof window !== 'undefined' && useAppStore?.getState && !useAppStore.getState().soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [440.00, 554.37, 659.25, 880.00];
      notes.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.06);
        gain.gain.setValueAtTime(0.07, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.35);
      });
    } catch {}
  },

  playRefundPing: () => {
    try {
      if (typeof window !== 'undefined' && useAppStore?.getState && !useAppStore.getState().soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now);
      osc.frequency.exponentialRampToValueAtTime(2637, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }
};
