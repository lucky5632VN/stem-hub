'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { playSound } from '@/lib/sound';
import { auth, db, functions, httpsCallable } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot, collection, query, where, getDocs, getDoc, addDoc, serverTimestamp, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { 
  Trophy, Sparkles, Shield, Award, BookOpen, Star, 
  Flame, CheckCircle, ChevronRight, User, Zap,
  Mail, Lock, ShieldAlert, Key, Users, UserPlus,
  UserMinus, UserCheck, UserX, Search, MessageSquare,
  Smile, Swords, Upload, ShoppingBag, Gift, X,
  Atom, Crown, Cpu, Dna, FlaskConical
} from 'lucide-react';
import { 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  reauthenticateWithCredential, 
  EmailAuthProvider, 
  updateEmail 
} from 'firebase/auth';
import { AvatarFrame } from '@/components/atoms/AvatarFrame';
import STEMAvatarSVG, { skinColors } from '@/components/atoms/STEMAvatarSVG';

export const ALL_COSMETICS = [
  // Màu da (Unisex)
  { id: 'chocolate', category: 'body', name: 'Màu da Chocolate', rarity: 'Rare', price: 150, value: 'chocolate', desc: 'Màu đồng đậm sang trọng.', genderTarget: 'unisex' },
  { id: 'neon_blue', category: 'body', name: 'Màu da Xanh Neon', rarity: 'Epic', price: 250, value: 'neon_blue', desc: 'Màu xanh công nghệ lượng tử phát sáng.', genderTarget: 'unisex' },
  { id: 'cosmic_purple', category: 'body', name: 'Màu da Tím Vũ Trụ', rarity: 'Legendary', price: 350, value: 'cosmic_purple', desc: 'Tím huyền bí từ dải ngân hà xa xôi.', genderTarget: 'unisex' },
  { id: 'emerald_alien', category: 'body', name: 'Màu da Alien Ngọc Lục', rarity: 'Epic', price: 200, value: 'emerald_alien', desc: 'Màu da xanh ngọc lục bảo ngoài hành tinh.', genderTarget: 'unisex' },
  { id: 'cyborg_silver', category: 'body', name: 'Màu da Cyborg Bạc', rarity: 'Legendary', price: 380, value: 'cyborg_silver', desc: 'Màu kim loại bạc nhám của robot Cyborg.', genderTarget: 'unisex' },
  { id: 'sunfire_gold', category: 'body', name: 'Màu da Thái Dương Vàng', rarity: 'Legendary', price: 420, value: 'sunfire_gold', desc: 'Da vàng rực rỡ mang năng lượng mặt trời.', genderTarget: 'unisex' },

  // Kiểu tóc (Nam / Nữ / Unisex)
  { id: 'cyberpunk_spiky', category: 'hair', name: 'Tóc Gai Nhọn Cyber', rarity: 'Epic', price: 200, value: 'cyberpunk_spiky', desc: 'Tóc gai nhọn cá tính phát sáng.', genderTarget: 'unisex' },
  { id: 'long_nebula', category: 'hair', name: 'Tóc Tinh Vân Nebula', rarity: 'Legendary', price: 350, value: 'long_nebula', desc: 'Tóc dài bồng bềnh cuộn tròn lượng tử.', genderTarget: 'female' },
  { id: 'curly', category: 'hair', name: 'Tóc Curly Lãng Tử', rarity: 'Rare', price: 150, value: 'curly', desc: 'Kiểu tóc xoăn bồng bềnh lãng tử.', genderTarget: 'male' },
  { id: 'ponytail', category: 'hair', name: 'Tóc Đuôi Ngựa Nữ Tính', rarity: 'Rare', price: 160, value: 'ponytail', desc: 'Tóc buộc cao năng động trẻ trung.', genderTarget: 'female' },
  { id: 'dreadlocks', category: 'hair', name: 'Tóc Tết Dreadlocks', rarity: 'Epic', price: 240, value: 'dreadlocks', desc: 'Tóc tết châu Phi đai vàng cực cá tính.', genderTarget: 'unisex' },
  { id: 'mohawk', category: 'hair', name: 'Tóc Chỏm Mohawk Nam', rarity: 'Epic', price: 220, value: 'mohawk', desc: 'Tóc chỏm giữa dựng đứng mạnh mẽ.', genderTarget: 'male' },
  { id: 'side_part', category: 'hair', name: 'Tóc Rẽ Ngôi Tài Phiệt', rarity: 'Rare', price: 130, value: 'side_part', desc: 'Mái tóc rẽ ngôi lịch lãm.', genderTarget: 'male' },
  { id: 'bob', category: 'hair', name: 'Tóc Bob Ngắn', rarity: 'Rare', price: 140, value: 'bob', desc: 'Tóc bob ngắn cúp ôm lấy gương mặt.', genderTarget: 'female' },
  { id: 'double_bun', category: 'hair', name: 'Búi Đôi Lượng Tử', rarity: 'Rare', price: 180, value: 'double_bun', desc: 'Kiểu tóc búi tròn hai bên cực kỳ đáng yêu cho nữ.', genderTarget: 'female' },
  { id: 'quantum_pixie', category: 'hair', name: 'Tóc tém Pixie Tiên Nữ', rarity: 'Epic', price: 220, value: 'quantum_pixie', desc: 'Mái tém Pixie cá tính với các lọn tóc phát sáng.', genderTarget: 'female' },
  { id: 'crystal_waterfall', category: 'hair', name: 'Tóc Thác Nước Tinh Thể', rarity: 'Legendary', price: 380, value: 'crystal_waterfall', desc: 'Tóc siêu dài gợn sóng đính các hạt tinh thể lấp lánh.', genderTarget: 'female' },

  // Áo (Thượng y)
  { id: 'lab_coat', category: 'top', name: 'Áo Choàng Phòng Lab', rarity: 'Rare', price: 150, value: 'lab_coat', desc: 'Trang phục chuyên nghiệp cho nhà hóa học.', genderTarget: 'unisex' },
  { id: 'astronaut_suit', category: 'top', name: 'Giáp Phi Hành Vũ Trụ', rarity: 'Epic', price: 250, value: 'astronaut_suit', desc: 'Trang phục khám phá các hành tinh mới.', genderTarget: 'unisex' },
  { id: 'mech_armor', category: 'top', name: 'Giáp Cơ Giới Lượng Tử', rarity: 'Legendary', price: 400, value: 'mech_armor', desc: 'Áo giáp robot đỏ-vàng lõi phản ứng.', genderTarget: 'unisex' },
  { id: 'cyber_hoodie', category: 'top', name: 'Hoodie Cyberpunk Tối', rarity: 'Epic', price: 220, value: 'cyber_hoodie', desc: 'Hoodie đen có dây khóa phát sáng xanh lá.', genderTarget: 'unisex' },
  { id: 'steampunk_vest', category: 'top', name: 'Áo Gile Steampunk', rarity: 'Rare', price: 160, value: 'steampunk_vest', desc: 'Gile da bò kèm cà vạt nơ cổ điển.', genderTarget: 'male' },
  { id: 'royal_cape', category: 'top', name: 'Choàng Hoàng Gia Đỏ', rarity: 'Legendary', price: 450, value: 'royal_cape', desc: 'Áo giáp vàng thêu tơ tằm đỏ thượng lưu.', genderTarget: 'unisex' },
  { id: 'bio_hazard', category: 'top', name: 'Đồ Bảo Hộ Chống Độc', rarity: 'Rare', price: 180, value: 'bio_hazard', desc: 'Bộ đồ bảo hộ màu vàng có khóa kéo.', genderTarget: 'unisex' },
  { id: 'ninja_suit', category: 'top', name: 'Y Phục Ninja Bóng Đêm', rarity: 'Epic', price: 260, value: 'ninja_suit', desc: 'Bộ đồ đen Ninja quấn đai đỏ bí ẩn.', genderTarget: 'unisex' },
  { id: 'quantum_dress', category: 'top', name: 'Đầm Dạ Hội Lượng Tử', rarity: 'Legendary', price: 460, value: 'quantum_dress', desc: 'Đầm dạ hội trễ vai hồng cánh sen sang trọng quý phái.', genderTarget: 'female' },

  // Quần (Hạ y)
  { id: 'space_shorts', category: 'bottom', name: 'Quần Đùi Vũ Trụ', rarity: 'Rare', price: 120, value: 'space_shorts', desc: 'Quần đùi màu slate phản quang tiện dụng.', genderTarget: 'unisex' },
  { id: 'robotic_legs', category: 'bottom', name: 'Chân Robot Cybernetic', rarity: 'Legendary', price: 350, value: 'robotic_legs', desc: 'Chân cơ khí thép phát sáng cyan.', genderTarget: 'unisex' },
  { id: 'cyber_skirt', category: 'bottom', name: 'Chân Váy Cyber Neon', rarity: 'Epic', price: 200, value: 'cyber_skirt', desc: 'Chân váy đen phát sáng cyan quyến rũ.', genderTarget: 'female' },
  { id: 'steampunk_pants', category: 'bottom', name: 'Quần Steampunk Ông Côn', rarity: 'Rare', price: 140, value: 'steampunk_pants', desc: 'Quần Steampunk da nâu ống côn có đai.', genderTarget: 'male' },
  { id: 'ninja_pants', category: 'bottom', name: 'Quần Ninja Quấn Băng', rarity: 'Epic', price: 210, value: 'ninja_pants', desc: 'Quần Ninja đen quấn băng trắng cổ chân.', genderTarget: 'unisex' },
  { id: 'lightweight_joggers', category: 'bottom', name: 'Quần Jogger Thể Thao', rarity: 'Rare', price: 130, value: 'lightweight_joggers', desc: 'Jogger xám sọc trắng kèm giày thể thao cyan.', genderTarget: 'unisex' },
  { id: 'tennis_skirt', category: 'bottom', name: 'Chân Váy Tennis Trắng', rarity: 'Rare', price: 150, value: 'tennis_skirt', desc: 'Chân váy xếp ly trắng thể thao năng động và trẻ trung.', genderTarget: 'female' },

  // Phụ kiện (Accessory)
  { id: 'sci_glasses', category: 'accessory', name: 'Kính Trí Tuệ Giáo Sư', rarity: 'Rare', price: 100, value: 'sci_glasses', desc: 'Kính gọng vàng trí thức của nhà bác học.', genderTarget: 'unisex' },
  { id: 'vr_goggles', category: 'accessory', name: 'Kính Thực Tế Ảo VR', rarity: 'Epic', price: 250, value: 'vr_goggles', desc: 'Kính VR phát sáng dải màu neon cyan.', genderTarget: 'unisex' },
  { id: 'headphones', category: 'accessory', name: 'Tai Nghe Lượng Tử Đỏ', rarity: 'Epic', price: 200, value: 'headphones', desc: 'Tai nghe chụp tai phát sáng lõi hạt nhân đỏ.', genderTarget: 'unisex' },
  { id: 'gas_mask', category: 'accessory', name: 'Mặt Nạ Phòng Độc Lab', rarity: 'Rare', price: 180, value: 'gas_mask', desc: 'Mặt nạ chuyên dụng phòng độc hóa học.', genderTarget: 'unisex' },
  { id: 'cyber_eyepatch', category: 'accessory', name: 'Bịt Mắt Laser Cyber', rarity: 'Epic', price: 240, value: 'cyber_eyepatch', desc: 'Bịt mắt công nghệ có tia laser đỏ.', genderTarget: 'unisex' },
  { id: 'scientific_magnifier', category: 'accessory', name: 'Kính Vi Phẫu Nhãn Quang', rarity: 'Epic', price: 220, value: 'scientific_magnifier', desc: 'Kính lúp hỗ trợ phẫu thuật vi lượng.', genderTarget: 'unisex' },
  { id: 'crown', category: 'accessory', name: 'Vương Miện Đại Đế', rarity: 'Legendary', price: 500, value: 'crown', desc: 'Vương miện vàng nạm ngọc ruby tối cao của Đại Đế STEM.', genderTarget: 'unisex' },
  { id: 'butterfly_hairpin', category: 'accessory', name: 'Kẹp Tóc Bướm Hologram', rarity: 'Epic', price: 230, value: 'butterfly_hairpin', desc: 'Kẹp tóc hình cánh bướm hologram phát sáng lung linh.', genderTarget: 'female' }
];

export const HAIR_COLORS = [
  { id: 'black', name: 'Đen Thư Sinh', hex: '#1a1a1a' },
  { id: 'blonde', name: 'Vàng Hoàng Kim', hex: '#ffd700' },
  { id: 'neon_pink', name: 'Hồng Cyberpunk', hex: '#ff007f' },
  { id: 'cyan', name: 'Xanh Lượng Tử', hex: '#00ffff' },
  { id: 'fire_orange', name: 'Cam Bão Lửa', hex: '#f97316' },
  { id: 'toxic_green', name: 'Xanh Độc Tố', hex: '#22c55e' },
  { id: 'cosmic_purple', name: 'Tím Tinh Vân', hex: '#a855f7' },
  { id: 'silver_gray', name: 'Xám Bạch Kim', hex: '#cbd5e1' },
  { id: 'pure_white', name: 'Trắng Sương Mù', hex: '#ffffff' },
  { id: 'sky_blue', name: 'Xanh Da Trời', hex: '#3b82f6' }
];

// Component hiệu ứng hạt lượng tử khi nhảy múa
const QuantumParticlesCanvas = ({ active, color = '#f472b6' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth || 200;
      canvas.height = canvas.offsetHeight || 200;
    };
    resize();

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 20;
        this.speedY = -Math.random() * 2 - 1;
        this.speedX = (Math.random() - 0.5) * 1.5;
        this.size = Math.random() * 3 + 1;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.01;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= this.decay;
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Spawn new particles
      if (Math.random() < 0.3) {
        particles.push(new Particle());
      }

      particles.forEach((p, idx) => {
        p.update();
        p.draw();
        if (p.alpha <= 0) {
          particles.splice(idx, 1);
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [active, color]);

  if (!active) return null;

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-10" 
    />
  );
};

// Helper chuyển đổi vật phẩm sang avatar parts để render hình đồ lượng tử thực tế
const getCosmeticPreviewParts = (item) => {
  const baseParts = {
    gender: 'unisex',
    bodyType: 'chibi',
    pose: 'standard',
    body: 'peach',
    hair: 'default',
    hairColor: 'black',
    top: 'default',
    bottom: 'default',
    accessory: 'none'
  };
  
  let category = item.category;
  let value = item.value;
  
  if (!category && item.id) {
    if (item.id === 'crown') {
      category = 'accessory';
      value = 'crown';
    } else if (item.id.includes('_')) {
      const idx = item.id.indexOf('_');
      category = item.id.substring(0, idx);
      value = item.id.substring(idx + 1);
    }
  }
  
  if (category === 'body') baseParts.body = value;
  else if (category === 'hair') baseParts.hair = value;
  else if (category === 'top') baseParts.top = value;
  else if (category === 'bottom') baseParts.bottom = value;
  else if (category === 'accessory') baseParts.accessory = value;
  
  return baseParts;
};

// Helper để lấy emoji cho danh hiệu lượng tử
const getTitleEmoji = (title) => {
  if (!title) return '🏆';
  if (title.id === 'alchemist_expert') return '🧪';
  if (title.id === 'math_wizard') return '📐';
  if (title.id === 'physics_guru') return '⚙️';
  if (title.id === 'cosmic_explorer') return '🌌';
  if (title.id === 'nuclear_engineer') return '⚛️';
  if (title.id === 'quantum_master') return '🔮';
  const match = title.name?.match(/[\p{Emoji_Presentation}\p{Emoji}\u200d]+/u);
  return match ? match[0] : '🏆';
};

export default function ProfilePage() {
  const user = useAppStore((state) => state.user);
  const personalization = useAppStore((state) => state.personalization);
  const setPersonalization = useAppStore((state) => state.setPersonalization);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('overview');
  const [mounted, setMounted] = useState(false);
  
  // Security & Email States
  const [verifying, setVerifying] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [settingsMessage, setSettingsMessage] = useState(null);
  
  // Social & Friends System States
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [richFriends, setRichFriends] = useState([]);
  const [richIncomingRequests, setRichIncomingRequests] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [allPlayers, setAllPlayers] = useState([]);
  const [searching, setSearching] = useState(false);

  // Profile Viewer Modal State
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Challenge Invite States
  const [showChallengeModal, setShowChallengeModal] = useState(null); // friend object
  const [sendingChallenge, setSendingChallenge] = useState(false);
  const [challengeSentMsg, setChallengeSentMsg] = useState('');  
  // Hologram Card 3D tilt refs & states
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hoveredSubject, setHoveredSubject] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('all');

  // Trạng thái Tương tác Chibi Avatar
  const [speechBubbleText, setSpeechBubbleText] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDancing, setIsDancing] = useState(false);
  const bubbleTimeoutRef = useRef(null);

  // Trạng thái Nhiệm vụ Hàng ngày (Daily Quests)
  const [dailyQuests, setDailyQuests] = useState([]);
  const [questsLoaded, setQuestsLoaded] = useState(false);

  // Trạng thái Vòng quay Gacha Lượng tử & Mở thẻ
  const [showGachaModal, setShowGachaModal] = useState(false);
  const [gachaResults, setGachaResults] = useState([]);
  const [flippedGachaCards, setFlippedGachaCards] = useState([]);
  const [gachaCrystalsSpent, setGachaCrystalsSpent] = useState(0);

  // Trạng thái Modal Nhận quà Thăng cấp 3D
  const [levelRewardModal, setLevelRewardModal] = useState({
    show: false,
    type: 'level', // 'level' | 'avatar' | 'checkin'
    milestone: 0,
    rewardText: '',
    frameReward: '',
    titleReward: '',
    flipped: false,
    error: false
  });

  const triggerSpeechBubble = () => {
    playSound.click();
    const quotes = [
      "E=mc²! Hãy cùng khám phá vũ trụ nhé!",
      "Hôm nay bạn muốn thử thách ở Đấu trường nào?",
      "Năng lượng lượng tử đã sẵn sàng để đồng bộ!",
      "Đại Đế STEM luôn đồng hành cùng bạn!",
      "Cơ học lượng tử thật tuyệt vời phải không?",
      "Học tập là chìa khóa mở ra các chiều không gian!",
      "Bạn thấy trang phục Chibi này của tôi có ngầu không?",
      "Newton và Einstein chắc chắn sẽ tự hào về bạn!"
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setSpeechBubbleText(randomQuote);

    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    bubbleTimeoutRef.current = setTimeout(() => {
      setSpeechBubbleText('');
    }, 4000);
  };

  const handleDance = () => {
    if (isDancing) return;
    playSound.success();
    setIsDancing(true);
    const poses = ['wave', 'super', 'thinker', 'walk', 'heart', 'spark', 'victory', 'standard'];
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < poses.length) {
        setTempAvatarParts(prev => ({ ...prev, pose: poses[index] }));
        index++;
      } else {
        clearInterval(interval);
        setIsDancing(false);
      }
    }, 300);
  };
  const loadDailyQuests = async (currentUser) => {
    if (!currentUser) return;
    try {
      const processTransaction = httpsCallable(functions, 'processCrystalTransaction');
      const result = await processTransaction({
        actionType: 'SYNC_DAILY_QUESTS',
        payload: {}
      });
      if (result.data && result.data.dailyQuests) {
        setDailyQuests(result.data.dailyQuests);
      }
      setQuestsLoaded(true);
    } catch (err) {
      console.error("Lỗi khi tải/đồng bộ nhiệm vụ hàng ngày:", err);
    }
  };

  const updateQuestProgress = async (questId, value = 1) => {
    // Để giữ bảo mật, tiến độ nhiệm vụ hàng ngày được tính toán hoàn toàn phía server.
    // Khi client gọi hàm này, ta chỉ cần gọi loadDailyQuests để đồng bộ lại trạng thái mới nhất từ server.
    if (user) {
      await loadDailyQuests(user);
    }
  };
  const handleClaimQuestReward = async (questId) => {
    playSound.click();
    const quest = dailyQuests.find(q => q.id === questId);
    if (!quest) return;
    if (quest.current < quest.target) {
      setLevelRewardModal({
        show: true,
        milestone: 0,
        rewardText: "⚠️ Bạn chưa hoàn thành nhiệm vụ này!",
        flipped: true,
        error: true
      });
      return;
    }
    if (quest.claimed) {
      setLevelRewardModal({
        show: true,
        milestone: 0,
        rewardText: "Bạn đã nhận phần thưởng cho nhiệm vụ này rồi!",
        flipped: true,
        error: true
      });
      return;
    }

    try {
      const processTransaction = httpsCallable(functions, 'processCrystalTransaction');
      const result = await processTransaction({
        actionType: 'CLAIM_QUEST',
        payload: { questId }
      });

      const newCrystals = result.data.newCrystals;
      const updatedQuests = dailyQuests.map(q => {
        if (q.id === questId) {
          return { ...q, claimed: true };
        }
        return q;
      });

      setDailyQuests(updatedQuests);
      setPersonalization({ crystals: newCrystals });

      playSound.success();
      
      setLevelRewardModal({
        show: true,
        milestone: 0,
        rewardText: `🎁 Nhận thưởng thành công +${quest.reward} Pha lê Lượng tử 🔮 từ nhiệm vụ "${quest.label}"!`,
        flipped: true,
        error: false
      });
    } catch (err) {
      console.error("Lỗi khi nhận thưởng nhiệm vụ:", err);
      setLevelRewardModal({
        show: true,
        milestone: 0,
        rewardText: `⚠️ Lỗi: ${err.message || 'Không thể nhận thưởng.'}`,
        flipped: true,
        error: true
      });
    }
  };

  // Portal Background states
  const [customUrlInput, setCustomUrlInput] = useState('');
  const predefinedBgs = [
    { id: 'none', name: 'Mặc định', url: '', requiredElo: 0 },
    { id: 'nebula', name: 'Không gian Nebula', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1200', requiredElo: 0 },
    { id: 'cyber', name: 'Lưới ánh sáng Cyber', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200', requiredElo: 0 },
    { id: 'science', name: 'Công nghệ bảo mật', url: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=1200', requiredElo: 0 },
    { id: 'abstract', name: 'Sóng trừu tượng', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200', requiredElo: 0 },
    
    // Thành tích ELO unlockable
    { id: 'bg_reactor', name: 'Lò Phản Ứng Neon', url: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?q=80&w=1200', requiredElo: 200 },
    { id: 'bg_magnetic', name: 'Dòng Sông Từ Trường', url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=1200', requiredElo: 500 },
    { id: 'bg_multiverse', name: 'Mã Nguồn Đa Vũ Trụ', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200', requiredElo: 900 },
    { id: 'bg_supernova', name: 'Siêu Tân Tinh Lượng Tử', url: 'animated-supernova', preview: 'https://images.unsplash.com/photo-1462332420958-a05d1e002413?q=80&w=400', requiredElo: 1400, isAnimated: true },
    { id: 'bg_cybergrid', name: 'Không Gian Cyberpunk', url: 'animated-cybergrid', preview: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=400', requiredElo: 2000, isAnimated: true },
    { id: 'bg_matrix', name: 'Cơn Mưa Số Lượng Tử', url: 'animated-matrix', preview: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=400', requiredElo: 2600, isAnimated: true },
  ];

  const updateBgImage = async (url) => {
    playSound.click();
    try {
      setPersonalization({ bgImage: url });
      if (user) {
        const processTransaction = httpsCallable(functions, 'processCrystalTransaction');
        await processTransaction({
          actionType: 'UPDATE_PERSONALIZATION',
          payload: { bgImage: url }
        });
      }
    } catch (err) {
      console.error("Lỗi cập nhật ảnh nền:", err);
    }
  };


  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    playSound.click();

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with 0.65 quality
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
        updateBgImage(compressedDataUrl);
      };
    };
  };

  const handleApplyUrl = () => {
    if (!customUrlInput.trim()) return;
    updateBgImage(customUrlInput.trim());
    setCustomUrlInput('');
  };
  const [customAvatarUrlInput, setCustomAvatarUrlInput] = useState('');
  const predefinedAvatars = [
    { id: 'astronaut', name: 'Nhà du hành', emoji: '🧑‍🚀', url: '🧑‍🚀' },
    { id: 'wizard', name: 'Phù thủy', emoji: '🧙‍♂️', url: '🧙‍♂️' },
    { id: 'dna', name: 'Sinh học DNA', emoji: '🧬', url: '🧬' },
    { id: 'rocket', name: 'Tên lửa khoa học', emoji: '🚀', url: '🚀' },
    { id: 'chemistry', name: 'Hóa học ảo', emoji: '🧪', url: '🧪' },
    { id: 'physics', name: 'Vật lý nguyên tử', emoji: '⚛️', url: '⚛️' },
    { id: 'robot', name: 'Người máy AI', emoji: '🤖', url: '🤖' },
    { id: 'brain', name: 'Não bộ thông thái', emoji: '🧠', url: '🧠' },
  ];

  const updateAvatarUrl = async (url) => {
    playSound.click();
    try {
      setPersonalization({ avatarUrl: url });
      if (user) {
        const processTransaction = httpsCallable(functions, 'processCrystalTransaction');
        await processTransaction({
          actionType: 'UPDATE_PERSONALIZATION',
          payload: { avatarUrl: url }
        });
      }
    } catch (err) {
      console.error("Lỗi cập nhật ảnh đại diện:", err);
    }
  };


  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    playSound.click();

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
        updateAvatarUrl(compressedDataUrl);
      };
    };
  };

  const handleApplyAvatarUrl = () => {
    if (!customAvatarUrlInput.trim()) return;
    updateAvatarUrl(customAvatarUrlInput.trim());
    setCustomAvatarUrlInput('');
  };

  // Các state và hàm mới phục vụ Gacha, Shop & Mặc đồ, Nhận quà Level
  const [activePersonalizationSubTab, setActivePersonalizationSubTab] = useState('character');
  const [isRolling, setIsRolling] = useState(false);
  const [gachaResult, setGachaResult] = useState(null);
  const [gachaError, setGachaError] = useState('');
  const [shopSuccessMsg, setShopSuccessMsg] = useState('');
  const [rewardsSuccessMsg, setRewardsSuccessMsg] = useState('');

  // Tạm lưu thay đổi nhân vật trước khi lưu chính thức
  const [tempAvatarParts, setTempAvatarParts] = useState(() => {
    const parts = personalization.avatarParts || {};
    return {
      gender: parts.gender || 'male',
      bodyType: parts.bodyType || 'chibi',
      pose: parts.pose || 'standard',
      body: parts.body || 'peach',
      hair: parts.hair || 'default',
      hairColor: parts.hairColor || 'black',
      top: parts.top || 'default',
      bottom: parts.bottom || 'default',
      accessory: parts.accessory || 'none'
    };
  });

  // Đồng bộ khi personalization được load
  useEffect(() => {
    if (personalization.avatarParts) {
      setTempAvatarParts(prev => ({
        ...prev,
        ...personalization.avatarParts
      }));
    }
  }, [personalization.avatarParts]);

  // Tải nhiệm vụ hàng ngày khi user thay đổi
  useEffect(() => {
    if (user) {
      loadDailyQuests(user);
    }
  }, [user]);

  // Quay Gacha lượng tử nâng cao
  const handleSpinGacha = async (pullCount) => {
    if (isRolling) return;
    playSound.click();
    setGachaError('');
    setGachaResults([]);
    
    const cost = pullCount === 10 ? 900 : 100; // Quay 10 lần giá 900 (tiết kiệm 100)
    const currentCrystals = personalization.crystals !== undefined ? personalization.crystals : 500;
    
    if (currentCrystals < cost) {
      setGachaError(`⚠️ Bạn không có đủ Pha lê Lượng tử (Cần ${cost} 🔮)! Hãy làm thêm bài lab.`);
      return;
    }

    setIsRolling(true);
    setGachaCrystalsSpent(cost);
    
    setTimeout(async () => {
      try {
        const processTransaction = httpsCallable(functions, 'processCrystalTransaction');
        const result = await processTransaction({
          actionType: 'GACHA_ROLL',
          payload: { pullCount }
        });

        const { newCrystals, results } = result.data;

        // Trích xuất list unlockedParts và unlockedTitles mới từ kết quả
        const updatedUnlockedParts = [...(personalization.unlockedParts || ['peach', 'hair_default', 'top_default', 'bottom_default'])];
        const updatedUnlockedTitles = [...(personalization.unlockedTitles || ['apprentice'])];

        results.forEach(res => {
          if (!res.isDuplicate) {
            if (res.item.type === 'cosmetic') {
              if (!updatedUnlockedParts.includes(res.item.id)) {
                updatedUnlockedParts.push(res.item.id);
              }
            } else {
              if (!updatedUnlockedTitles.includes(res.item.id)) {
                updatedUnlockedTitles.push(res.item.id);
              }
            }
          }
        });

        // Cập nhật local
        setPersonalization({
          crystals: newCrystals,
          unlockedParts: updatedUnlockedParts,
          unlockedTitles: updatedUnlockedTitles
        });

        setGachaResults(results);
        setFlippedGachaCards([]);
        setShowGachaModal(true);
      } catch (err) {
        console.error('Lỗi khi quay Gacha nâng cao:', err);
        setGachaError(`⚠️ Giải mã lượng tử thất bại: ${err.message || 'Lỗi kết nối.'}`);
      } finally {
        setIsRolling(false);
      }
    }, 1500);
  };

  // Mua trang phục trực tiếp từ Shop
  const handleBuyCosmetic = async (item) => {
    playSound.click();
    setShopSuccessMsg('');
    const currentCrystals = personalization.crystals !== undefined ? personalization.crystals : 500;
    
    if (currentCrystals < item.price) {
      alert(`⚠️ Bạn không có đủ Pha lê Lượng tử để mua vật phẩm này (Cần ${item.price} 🔮)!`);
      return;
    }

    const unlocked = personalization.unlockedParts || ['peach', 'hair_default', 'top_default', 'bottom_default'];
    if (unlocked.includes(item.id)) {
      alert('Bạn đã sở hữu vật phẩm này rồi!');
      return;
    }

    try {
      const processTransaction = httpsCallable(functions, 'processCrystalTransaction');
      const result = await processTransaction({
        actionType: 'SHOP_PURCHASE',
        payload: { itemId: item.id }
      });

      const { newCrystals } = result.data;
      const newUnlocked = [...unlocked, item.id];

      // Cập nhật local
      setPersonalization({
        crystals: newCrystals,
        unlockedParts: newUnlocked
      });

      playSound.success();
      setShopSuccessMsg(`🎉 Mua thành công: ${item.name}! Hãy sang tab Tự tạo Nhân vật để trang bị.`);
      setTimeout(() => setShopSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Lỗi khi mua vật phẩm:', err);
      alert(`Không thể hoàn tất giao dịch: ${err.message || 'Lỗi kết nối.'}`);
    }
  };

  // Lưu tạo hình nhân vật
  const handleEquipAvatarParts = async () => {
    playSound.click();
    try {
      setPersonalization({
        avatarUrl: 'custom-avatar',
        avatarParts: tempAvatarParts
      });

      if (user) {
        const processTransaction = httpsCallable(functions, 'processCrystalTransaction');
        await processTransaction({
          actionType: 'UPDATE_PERSONALIZATION',
          payload: {
            avatarUrl: 'custom-avatar',
            avatarParts: tempAvatarParts
          }
        });
      }

      // Cập nhật nhiệm vụ hàng ngày: Thiết kế avatar
      updateQuestProgress('quest_avatar', 1);

      // Hiển thị modal nhận diện mạo thành công dạng thông báo đẹp mắt
      setLevelRewardModal({
        show: true,
        type: 'avatar',
        milestone: 0,
        rewardText: '🎉 Đã đồng bộ nhân vật Chibi 2D làm ảnh đại diện chính của bạn thành công!',
        flipped: true,
        error: false
      });
    } catch (err) {
      console.error('Lỗi khi lưu tạo hình nhân vật:', err);
      setLevelRewardModal({
        show: true,
        type: 'avatar',
        milestone: 0,
        rewardText: '⚠️ Lỗi lưu cấu hình nhân vật.',
        flipped: true,
        error: true
      });
    }
  };

  // Logic Điểm danh lượng tử 7 ngày
  const handleDailyCheckIn = async () => {
    playSound.click();
    const todayStr = new Date().toISOString().split('T')[0];
    const lastCheckIn = personalization.lastCheckInDate;
    
    if (lastCheckIn === todayStr) {
      setLevelRewardModal({
        show: true,
        milestone: 0,
        rewardText: "⚠️ Bạn đã hoàn thành đồng bộ năng lượng hôm nay rồi. Hãy quay lại vào ngày mai!",
        flipped: true,
        error: true
      });
      return;
    }

    try {
      const processTransaction = httpsCallable(functions, 'processCrystalTransaction');
      const result = await processTransaction({
        actionType: 'CHECKIN',
        payload: {}
      });

      const { newCrystals, bonusCrystals, nextDayIndex, giftMsg } = result.data;

      const unlocked = personalization.unlockedParts || ['peach', 'hair_default', 'top_default', 'bottom_default'];
      let newUnlocked = [...unlocked];
      if (nextDayIndex === 7 && !newUnlocked.includes('crown')) {
        newUnlocked.push('crown');
      }

      setPersonalization({
        crystals: newCrystals,
        lastCheckInDate: todayStr,
        checkInDayIndex: nextDayIndex,
        unlockedParts: newUnlocked
      });

      playSound.success();

      // Cập nhật nhiệm vụ hàng ngày: Điểm danh
      updateQuestProgress('quest_checkin', 1);

      setLevelRewardModal({
        show: true,
        milestone: 0,
        rewardText: `🔋 Đồng bộ năng lượng ngày ${nextDayIndex} thành công! Nhận +${bonusCrystals} Pha lê Lượng tử 🔮${giftMsg}`,
        flipped: true,
        error: false
      });
    } catch (err) {
      console.error("Lỗi khi điểm danh:", err);
      setLevelRewardModal({
        show: true,
        milestone: 0,
        rewardText: `⚠️ Điểm danh thất bại: ${err.message || 'Lỗi kết nối.'}`,
        flipped: true,
        error: true
      });
    }
  };

  // Nhận quà thăng cấp nâng cao với Modal Hologram 3D
  const handleClaimMilestone = async (milestoneLevel) => {
    playSound.click();
    setRewardsSuccessMsg('');

    const currentLevel = personalization.level || 1;
    if (currentLevel < milestoneLevel && !(user && (user.displayName === 'admin' || user.email?.includes('admin')))) {
      setLevelRewardModal({
        show: true,
        type: 'level',
        milestone: milestoneLevel,
        rewardText: `⚠️ Trình độ của bạn chưa đạt Cấp ${milestoneLevel}! Hãy tiếp tục học tập và làm bài lab.`,
        flipped: true,
        error: true
      });
      return;
    }

    const claimed = personalization.claimedMilestones || [];
    if (claimed.includes(milestoneLevel)) {
      setLevelRewardModal({
        show: true,
        type: 'level',
        milestone: milestoneLevel,
        rewardText: `Bạn đã nhận phần quà của mốc Level ${milestoneLevel} rồi!`,
        flipped: true,
        error: true
      });
      return;
    }

    try {
      const processTransaction = httpsCallable(functions, 'processCrystalTransaction');
      const result = await processTransaction({
        actionType: 'CLAIM_LEVEL_MILESTONE',
        payload: { milestoneLevel }
      });

      const { newCrystals } = result.data;
      const newClaimed = [...claimed, milestoneLevel];

      // Thêm quà tặng độc quyền tương ứng mốc
      let newUnlockedFrames = [...(personalization.unlockedFrames || ['default'])];
      let newUnlockedTitles = [...(personalization.unlockedTitles || ['apprentice'])];
      let rewardText = '';
      let frameReward = '';
      let titleReward = '';

      if (milestoneLevel === 10) {
        if (!newUnlockedFrames.includes('gold_vip')) {
          newUnlockedFrames.push('gold_vip');
        }
        frameReward = 'gold_vip';
        rewardText = 'Khung Avatar "Huyền thoại Vàng" ✨ + 500 Pha lê Lượng tử 🔮';
      } else if (milestoneLevel === 20) {
        if (!newUnlockedFrames.includes('neon_fire')) {
          newUnlockedFrames.push('neon_fire');
        }
        frameReward = 'neon_fire';
        rewardText = 'Khung Avatar "Bão lửa Neon" 🔥 + 500 Pha lê Lượng tử 🔮';
      } else if (milestoneLevel === 30) {
        if (!newUnlockedTitles.includes('dimension_creator')) {
          newUnlockedTitles.push('dimension_creator');
        }
        titleReward = 'dimension_creator';
        rewardText = 'Danh hiệu "Đấng kiến tạo Không gian" 🌌 + 500 Pha lê Lượng tử 🔮';
      } else {
        rewardText = '500 Pha lê Lượng tử 🔮';
      }

      // Cập nhật local
      setPersonalization({
        crystals: newCrystals,
        claimedMilestones: newClaimed,
        unlockedFrames: newUnlockedFrames,
        unlockedTitles: newUnlockedTitles
      });

      playSound.success();
      
      // Kích hoạt Modal nhận quà level lộng lẫy
      setLevelRewardModal({
        show: true,
        type: 'level',
        milestone: milestoneLevel,
        rewardText,
        frameReward,
        titleReward,
        flipped: false,
        error: false
      });
    } catch (err) {
      console.error("Lỗi khi nhận quà mốc level:", err);
      setLevelRewardModal({
        show: true,
        type: 'level',
        milestone: milestoneLevel,
        rewardText: "⚠️ Đã xảy ra lỗi khi đồng bộ quà tặng thăng cấp.",
        flipped: true,
        error: true
      });
    }
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) {
        setActiveTab(tabParam);
      }
      const subTabParam = params.get('subtab');
      if (subTabParam) {
        setActivePersonalizationSubTab(subTabParam);
      }
    }
  }, []);

  const [leaderboardRank, setLeaderboardRank] = useState(999);
  const [selectedPodIndex, setSelectedPodIndex] = useState(null);

  // Tự động kiểm tra thứ hạng bảng xếp hạng Elo của người dùng hiện tại
  useEffect(() => {
    if (user) {
      const checkRank = async () => {
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
          const idx = players.findIndex(p => p.uid === user.uid);
          setLeaderboardRank(idx === -1 ? 999 : idx + 1);
        } catch (err) {
          console.warn("Lỗi kiểm tra xếp hạng:", err);
        }
      };
      checkRank();
    }
  }, [user, personalization.elo]);

  // Tải danh sách tất cả người chơi để lọc tức thì theo thời gian thực (Search-as-you-type)
  useEffect(() => {
    if (user && activeTab === 'friends') {
      const loadAllPlayers = async () => {
        setSearching(true);
        try {
          const querySnapshot = await getDocs(collection(db, 'users'));
          const players = [];
          querySnapshot.forEach(docSnap => {
            if (docSnap.id !== user.uid) {
              const d = docSnap.data();
              players.push({
                uid: docSnap.id,
                displayName: d.displayName || 'Học viên',
                elo: d.stats?.elo || 0,
                level: d.stats?.level || 1,
                activeTitle: d.personalization?.activeTitle || 'apprentice',
                avatarFrame: d.personalization?.avatarFrame || 'default',
                avatarParts: d.personalization?.avatarParts || null,
                email: d.email || ''
              });
            }
          });
          setAllPlayers(players);
        } catch (err) {
          console.error("Lỗi tải danh sách người chơi:", err);
        } finally {
          setSearching(false);
        }
      };
      loadAllPlayers();
    }
  }, [user, activeTab]);

  // Real-time Firestore sync of friends data
  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFriends(data.friends || []);
          setIncomingRequests(data.incomingRequests || []);
          setOutgoingRequests(data.outgoingRequests || []);
        }
      }, (err) => {
        console.error("Lỗi đồng bộ danh sách bạn bè:", err);
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Phân giải động thông tin chi tiết bạn bè (avatarParts, avatarFrame, level, elo, danh hiệu) từ users collection
  useEffect(() => {
    if (friends.length === 0) {
      setRichFriends([]);
      return;
    }

    const resolveFriends = async () => {
      const resolved = await Promise.all(
        friends.map(async (friend) => {
          try {
            const friendRef = doc(db, 'users', friend.uid);
            const snap = await getDoc(friendRef);
            if (snap.exists()) {
              const data = snap.data();
              return {
                ...friend,
                displayName: data.displayName || data.name || friend.displayName,
                avatarFrame: data.personalization?.avatarFrame || friend.avatarFrame || 'default',
                activeTitle: data.personalization?.activeTitle || data.activeTitle || 'Tập sự STEM',
                elo: data.stats?.elo !== undefined ? data.stats.elo : (friend.elo || 1000),
                level: data.stats?.level || friend.level || 1,
                avatarParts: data.personalization?.avatarParts || null,
                lastActive: data.lastActive || 0,
              };
            }
          } catch (err) {
            console.error("Lỗi phân giải chi tiết bạn bè:", friend.uid, err);
          }
          return friend;
        })
      );
      setRichFriends(resolved);
    };

    resolveFriends();

    // Tự động kiểm tra trạng thái hoạt động mỗi 30 giây
    const interval = setInterval(resolveFriends, 30000);
    return () => clearInterval(interval);
  }, [friends]);

  // Phân giải động thông tin yêu cầu kết bạn nhận được từ users collection
  useEffect(() => {
    if (incomingRequests.length === 0) {
      setRichIncomingRequests([]);
      return;
    }

    const resolveRequests = async () => {
      const resolved = await Promise.all(
        incomingRequests.map(async (req) => {
          try {
            const reqRef = doc(db, 'users', req.uid);
            const snap = await getDoc(reqRef);
            if (snap.exists()) {
              const data = snap.data();
              return {
                ...req,
                displayName: data.displayName || data.name || req.displayName,
                avatarFrame: data.personalization?.avatarFrame || req.avatarFrame || 'default',
                activeTitle: data.personalization?.activeTitle || data.activeTitle || 'Tập sự STEM',
                elo: data.stats?.elo !== undefined ? data.stats.elo : (req.elo || 1000),
                level: data.stats?.level || req.level || 1,
                avatarParts: data.personalization?.avatarParts || null,
              };
            }
          } catch (err) {
            console.error("Lỗi phân giải yêu cầu kết bạn:", req.uid, err);
          }
          return req;
        })
      );
      setRichIncomingRequests(resolved);
    };

    resolveRequests();
  }, [incomingRequests]);

  const handleCardMouseMove = (e) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Tỉ lệ nghiêng (tilt) tối đa 15 độ
    const tiltX = -(y / (rect.height / 2)) * 12;
    const tiltY = (x / (rect.width / 2)) * 12;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleCardMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // ================= FRIEND SYSTEM HANDLERS =================
  const sendFriendRequest = async (targetUser) => {
    playSound.click();
    if (!user || !targetUser) return;
    
    try {
      const processFriend = httpsCallable(functions, 'processFriendAction');
      await processFriend({
        actionType: 'SEND_REQUEST',
        payload: { targetUid: targetUser.uid }
      });
      
      setSettingsMessage({
        type: 'success',
        text: `Đã gửi lời mời kết bạn đến ${targetUser.displayName || 'Học viên'}!`
      });
    } catch (err) {
      console.error(err);
      setSettingsMessage({ type: 'error', text: `Lỗi khi gửi lời mời: ${err.message}` });
    }
  };

  const acceptFriendRequest = async (sender) => {
    playSound.success();
    if (!user || !sender) return;
    
    try {
      const processFriend = httpsCallable(functions, 'processFriendAction');
      await processFriend({
        actionType: 'ACCEPT_REQUEST',
        payload: { targetUid: sender.uid }
      });
      
      setSettingsMessage({
        type: 'success',
        text: `Đã trở thành bạn bè với ${sender.displayName || 'Học viên'}!`
      });
    } catch (err) {
      console.error(err);
      setSettingsMessage({ type: 'error', text: `Lỗi khi chấp nhận kết bạn: ${err.message}` });
    }
  };

  const declineFriendRequest = async (sender) => {
    playSound.click();
    if (!user || !sender) return;
    
    try {
      const processFriend = httpsCallable(functions, 'processFriendAction');
      await processFriend({
        actionType: 'DECLINE_REQUEST',
        payload: { targetUid: sender.uid }
      });
      
      setSettingsMessage({
        type: 'success',
        text: `Đã từ chối lời mời kết bạn từ ${sender.displayName || 'Học viên'}.`
      });
    } catch (err) {
      console.error(err);
      setSettingsMessage({ type: 'error', text: `Lỗi khi từ chối kết bạn: ${err.message}` });
    }
  };

  const unfriendPlayer = async (friend) => {
    playSound.click();
    if (!user || !friend) return;
    
    if (!window.confirm(`Bạn có chắc chắn muốn hủy kết bạn với ${friend.displayName || 'Học viên'} không?`)) return;
    
    try {
      const processFriend = httpsCallable(functions, 'processFriendAction');
      await processFriend({
        actionType: 'UNFRIEND',
        payload: { targetUid: friend.uid }
      });
      
      setSettingsMessage({
        type: 'success',
        text: `Đã hủy kết bạn với ${friend.displayName || 'Học viên'}.`
      });
    } catch (err) {
      console.error(err);
      setSettingsMessage({ type: 'error', text: `Lỗi khi hủy kết bạn: ${err.message}` });
    }
  };


  const handleSearchFriends = (e) => {
    e.preventDefault();
  };

  const viewFriendProfile = async (friend) => {
    playSound.click();
    setLoadingProfile(true);
    setSelectedFriend(null);
    try {
      const friendRef = doc(db, 'users', friend.uid);
      const snap = await getDoc(friendRef);
      if (snap.exists()) {
        const d = snap.data();
        setSelectedFriend({
          uid: snap.id,
          displayName: d.displayName || 'Học viên',
          email: d.email || '',
          level: d.stats?.level || 1,
          exp: d.stats?.exp || 0,
          nextLevelExp: d.stats?.nextLevelExp || 1000,
          elo: d.stats?.elo || 0,
          wins: d.stats?.wins || 0,
          losses: d.stats?.losses || 0,
          subjectStrengths: d.stats?.subjectStrengths || { math: 50, physics: 50, chemistry: 50, biology: 50 },
          avatarFrame: d.personalization?.avatarFrame || 'default',
          activeTitle: d.personalization?.activeTitle || 'apprentice',
          avatarUrl: d.personalization?.avatarUrl || '',
          createdAt: d.createdAt || null,
          lastActive: d.lastActive || 0,
        });
      }
    } catch (err) {
      console.error('Lỗi tải hồ sơ chiến hữu:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Mở modal chọn môn thách đấu
  const openChallengeFor = (friend) => {
    playSound.click();
    
    // Kiểm tra trực tuyến thời gian thực (lastActive < 45 giây)
    const lastActive = friend.lastActive || 0;
    const isOnline = Date.now() - lastActive < 45000;
    if (!isOnline) {
      alert(`Người chơi ${friend.displayName || 'này'} hiện đang không trực tuyến (offline)! Không thể gửi lời mời thách đấu.`);
      return;
    }

    setChallengeSentMsg('');
    setShowChallengeModal(friend);
    // Đóng profile modal nếu đang mở
    setSelectedFriend(null);
  };


  // Gửi lời mời thách đấu vào Firestore
  const sendChallengeInvite = async (targetFriend, subject) => {
    if (!user || !targetFriend) return;
    playSound.click();
    setSendingChallenge(true);
    setChallengeSentMsg('');
    try {
      // KIỂM TRA ONLINE STATUS CỦA ĐỐI THỦ THỜI GIAN THỰC
      const friendRef = doc(db, 'users', targetFriend.uid);
      const snap = await getDoc(friendRef);
      if (snap.exists()) {
        const data = snap.data();
        const lastActive = data.lastActive || 0;
        const isOnline = Date.now() - lastActive < 45000; // 45 giây
        if (!isOnline) {
          setChallengeSentMsg(`❌ Người chơi ${targetFriend.displayName} hiện đang không online! Không thể gửi lời mời thách đấu.`);
          setSendingChallenge(false);
          return;
        }
      }

      const subjectLabels = { math: 'Toán học', physics: 'Vật lý', chemistry: 'Hóa học', biology: 'Sinh học' };
      const allSubjects = ['math', 'physics', 'chemistry', 'biology'];
      const finalSubject = subject === 'random'
        ? allSubjects[Math.floor(Math.random() * allSubjects.length)]
        : subject;

      await addDoc(collection(db, 'challengeInvites'), {
        fromUid: user.uid,
        fromName: user.displayName || 'Học viên',
        fromElo: personalization.elo || 0,
        fromLevel: personalization.level || 1,
        fromAvatarFrame: personalization.avatarFrame || 'default',
        fromActiveTitle: personalization.activeTitle || 'apprentice',
        toUid: targetFriend.uid,
        toName: targetFriend.displayName || 'Học viên',
        subject: finalSubject,
        subjectLabel: subjectLabels[finalSubject],
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setChallengeSentMsg(`✅ Đã gửi lời mời thách đấu môn ${subjectLabels[finalSubject] || finalSubject} đến ${targetFriend.displayName}! Đang chờ họ phản hồi...`);
      setTimeout(() => {
        setShowChallengeModal(null);
        setChallengeSentMsg('');
      }, 3000);
    } catch (err) {
      console.error('Lỗi gửi lời mời thách đấu:', err);
      setChallengeSentMsg(`❌ Lỗi: ${err.message}`);
    } finally {
      setSendingChallenge(false);
    }
  };

  const equipTitle = async (titleId) => {
    playSound.click();
    setPersonalization({ activeTitle: titleId });

    if (user) {
      try {
        const processTransaction = httpsCallable(functions, 'processCrystalTransaction');
        await processTransaction({
          actionType: 'UPDATE_PERSONALIZATION',
          payload: { activeTitle: titleId }
        });
      } catch (err) {
        console.error("Lỗi khi lưu danh hiệu:", err);
      }
    }
  };


  const handleSendVerification = async () => {
    playSound.click();
    if (!auth.currentUser) return;
    setVerifying(true);
    setSettingsMessage(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setSettingsMessage({
        type: 'success',
        text: `Đã gửi hòm thư xác minh thành công! Vui lòng kiểm tra hộp thư đến hoặc hộp thư rác của hòm thư ${auth.currentUser.email}.`
      });
    } catch (err) {
      console.error(err);
      setSettingsMessage({
        type: 'error',
        text: `Có lỗi xảy ra: ${err.message || 'Không thể gửi email xác minh.'}`
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    playSound.click();
    if (!auth.currentUser || !auth.currentUser.email) return;
    setResetting(true);
    setSettingsMessage(null);
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      setSettingsMessage({
        type: 'success',
        text: `Đã gửi liên kết đặt lại mật khẩu thành công! Vui lòng mở hòm thư của bạn để cập nhật mật khẩu mới.`
      });
    } catch (err) {
      console.error(err);
      setSettingsMessage({
        type: 'error',
        text: `Có lỗi xảy ra: ${err.message || 'Không thể đặt lại mật khẩu.'}`
      });
    } finally {
      setResetting(false);
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    playSound.click();
    if (!auth.currentUser) return;
    setUpdatingEmail(true);
    setSettingsMessage(null);

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPasswordInput);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updateEmail(auth.currentUser, newEmailInput);

      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        email: newEmailInput
      });

      setSettingsMessage({
        type: 'success',
        text: `Cập nhật địa chỉ email thành công sang hòm thư mới: ${newEmailInput}!`
      });
      setNewEmailInput('');
      setCurrentPasswordInput('');
    } catch (err) {
      console.error(err);
      let errMsg = 'Không thể đổi email.';
      if (err.code === 'auth/wrong-password') {
        errMsg = 'Mật khẩu xác nhận không chính xác.';
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = 'Địa chỉ email mới đã được sử dụng bởi một tài khoản khác.';
      } else {
        errMsg = err.message || errMsg;
      }
      setSettingsMessage({
        type: 'error',
        text: `Có lỗi xảy ra: ${errMsg}`
      });
    } finally {
      setUpdatingEmail(false);
    }
  };

  const equipFrame = async (frameId) => {
    playSound.click();
    setPersonalization({ avatarFrame: frameId });

    if (user) {
      try {
        const processTransaction = httpsCallable(functions, 'processCrystalTransaction');
        await processTransaction({
          actionType: 'UPDATE_PERSONALIZATION',
          payload: { avatarFrame: frameId }
        });
      } catch (err) {
        console.error("Lỗi khi lưu khung Avatar:", err);
      }
    }
  };


  // 1. Radar Chart Data & Helper Calculations
  const rMax = 80;
  const cx = 100;
  const cy = 100;
  const strengths = personalization.subjectStrengths || { math: 50, physics: 50, chemistry: 50, biology: 50 };

  const getRadarPoint = (val, axis) => {
    const r = (val / 100) * rMax;
    switch(axis) {
      case 'math': // Top
        return `${cx},${cy - r}`;
      case 'physics': // Right
        return `${cx + r},${cy}`;
      case 'chemistry': // Bottom
        return `${cx},${cy + r}`;
      case 'biology': // Left
        return `${cx - r},${cy}`;
      default:
        return `${cx},${cy}`;
    }
  };

  const radarPolygonPoints = [
    getRadarPoint(strengths.math, 'math'),
    getRadarPoint(strengths.physics, 'physics'),
    getRadarPoint(strengths.chemistry, 'chemistry'),
    getRadarPoint(strengths.biology, 'biology')
  ].join(' ');

  const getArchetype = (str) => {
    const { math = 50, physics = 50, chemistry = 50, biology = 50 } = str;
    const maxVal = Math.max(math, physics, chemistry, biology);
    const minVal = Math.min(math, physics, chemistry, biology);

    if (maxVal - minVal <= 10) {
      return {
        key: 'balanced',
        title: 'Nhà Khoa Học Toàn Diện',
        desc: 'Bạn sở hữu tư duy liên ngành xuất sắc, phân bổ đều ở mọi lĩnh vực STEM. Đây là nền tảng tuyệt vời để trở thành một nhà phát minh liên ngành xuất sắc!',
        color: 'text-amber-400 dark:text-amber-300',
        bgColor: 'bg-amber-500/10 border-amber-500/20 text-amber-200',
        glowColor: 'shadow-[0_0_15px_#fbbf24]'
      };
    }

    if (maxVal === math) {
      return {
        key: 'math',
        title: 'Chiến Thần Thuật Toán',
        desc: 'Tư duy logic, cấu trúc và khả năng trừu tượng hóa của bạn cực kỳ vượt trội. Bạn sẽ là người giải mã các thuật toán phức tạp nhất.',
        color: 'text-pink-500 dark:text-pink-400',
        bgColor: 'bg-pink-500/10 border-pink-500/20 text-pink-200',
        glowColor: 'shadow-[0_0_15px_#ec4899]'
      };
    } else if (maxVal === physics) {
      return {
        key: 'physics',
        title: 'Kiến Trúc Sư Lượng Tử',
        desc: 'Bạn có cảm nhận tuyệt vời về không gian và chuyển động. Bạn sinh ra để thiết kế các cơ chế kỹ thuật và hệ thống phức tạp.',
        color: 'text-rose-500 dark:text-rose-400',
        bgColor: 'bg-rose-500/10 border-rose-500/20 text-rose-200',
        glowColor: 'shadow-[0_0_15px_#f43f5e]'
      };
    } else if (maxVal === chemistry) {
      return {
        key: 'chemistry',
        title: 'Nhà Giả Kim Phân Tử',
        desc: 'Nhạy bén trong các phản ứng và liên kết nguyên tố. Bạn luôn tìm ra sự kết hợp tối ưu nhất giữa các chất.',
        color: 'text-yellow-500 dark:text-yellow-400',
        bgColor: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-250',
        glowColor: 'shadow-[0_0_15px_#fbbf24]'
      };
    } else {
      return {
        key: 'biology',
        title: 'Nhà Di Truyền Học Vũ Trụ',
        desc: 'Khả năng phân tích cấu trúc sinh học và di truyền vượt bậc. Bạn có thế mạnh lớn trong việc giải mã các hệ sinh thái phức tạp.',
        color: 'text-emerald-500 dark:text-emerald-400',
        bgColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-250',
        glowColor: 'shadow-[0_0_15px_#10b981]'
      };
    }
  };

  const getSubjectAdvice = (str) => {
    const { math = 50, physics = 50, chemistry = 50, biology = 50 } = str;
    const subjects = [
      { key: 'math', name: 'Toán học', val: math, action: 'giải các Câu hỏi Không gian trong phòng Lab Toán' },
      { key: 'physics', name: 'Vật lý', val: physics, action: 'chế tạo bánh răng Newton và thực hành cơ học ở phòng Lab Vật lý' },
      { key: 'chemistry', name: 'Hóa học', val: chemistry, action: 'thực hiện các chuỗi phản ứng liên kết ở phòng Lab Hóa học' },
      { key: 'biology', name: 'Sinh học', val: biology, action: 'giải đáp chuỗi mã di truyền và phân tích tế bào ở phòng Lab Sinh học' }
    ];
    
    subjects.sort((a, b) => a.val - b.val);
    const lowest = subjects[0];
    
    if (lowest.val >= 90) {
      return "Chúc mừng! Tất cả chỉ số STEM của bạn đều đang đạt mức độ huyền thoại. Hãy tiếp tục duy trì phong độ xuất sắc này!";
    }
    
    return `Chỉ số ${lowest.name} của bạn hiện đang ở mức thấp nhất (${lowest.val}%). Hãy ${lowest.action} để nâng cấp cân bằng năng lực!`;
  };

  const getFrameStyle = (frame) => {
    switch (frame) {
      case 'neon_fire':
        return 'border-2 border-rose-500 shadow-[0_0_15px_#f43f5e]';
      case 'cyan_tech':
        return 'border-2 border-cyan-400 shadow-[0_0_15px_#22d3ee]';
      case 'cosmic_nebula':
        return 'border-2 border-purple-500 shadow-[0_0_15px_#a855f7]';
      case 'blackhole_gravity':
        return 'border-2 border-indigo-700 shadow-[0_0_15px_#4338ca]';
      case 'antimatter_era':
        return 'border-2 border-fuchsia-500 shadow-[0_0_15px_#d946ef]';
      case 'multiverse_overlord':
        return 'border-2 border-cyan-400 shadow-[0_0_18px_#22d3ee,0_0_8px_#ec4899] animate-pulse';
      case 'top_1_sovereign':
        return 'border-2 border-amber-400 shadow-[0_0_18px_#fbbf24,0_0_6px_#ffffff] animate-pulse';
      case 'gold_vip':
        return 'border-2 border-amber-400 shadow-[0_0_15px_#fbbf24] animate-pulse';
      case 'top_100_silver':
        return 'border-2 border-slate-300 shadow-[0_0_12px_#cbd5e1]';
      default:
        return 'border border-pink-500/30';
    }
  };

  const getTitleLabel = (title) => {
    const titles = {
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
    return titles[title] || title || 'Học viên';
  };

  const allFrames = [
    { id: 'default', label: 'Cơ bản', desc: 'Khung mỏng mặc định ban đầu', style: 'border border-pink-500/30' },
    { id: 'neon_fire', label: 'Bão lửa Neon', desc: 'Mở khóa khi đạt chuỗi 3 trận thắng', style: 'border border-rose-500 shadow-[0_0_8px_#f43f5e]', requiredLevel: 2 },
    { id: 'cyan_tech', label: 'Công nghệ lượng tử', desc: 'Mở khóa khi đạt Elo 1200+', style: 'border border-cyan-400 shadow-[0_0_8px_#22d3ee]', requiredElo: 1200 },
    { id: 'cosmic_nebula', label: 'Tinh vân Vũ trụ', desc: 'Mở khóa khi đạt Elo 1500+', style: 'border-2 border-purple-500 shadow-[0_0_12px_#a855f7]', requiredElo: 1500 },
    { id: 'blackhole_gravity', label: 'Hố đen Siêu trọng', desc: 'Mở khóa khi đạt Elo 1800+', style: 'border-2 border-indigo-700 shadow-[0_0_14px_#4338ca]', requiredElo: 1800 },
    { id: 'antimatter_era', label: 'Kỷ nguyên Phản vật chất', desc: 'Mở khóa khi đạt Elo 2200+', style: 'border-2 border-fuchsia-500 shadow-[0_0_16px_#d946ef]', requiredElo: 2200 },
    { id: 'multiverse_overlord', label: 'Đế vương Đa vũ trụ', desc: 'Mở khóa khi đạt Elo 2500+', style: 'border-2 border-cyan-400 shadow-[0_0_18px_#22d3ee,0_0_8px_#ec4899]', requiredElo: 2500 },
    { id: 'top_1_sovereign', label: 'Vương miện Đại Đế', desc: 'Chỉ dành cho TOP 1 bảng xếp hạng', style: 'border border-amber-400 shadow-[0_0_8px_#fbbf24]' },
    { id: 'gold_vip', label: 'Huyền thoại Vàng', desc: 'Dành cho TOP 10 bảng xếp hạng', style: 'border border-amber-400 shadow-[0_0_8px_#fbbf24]' },
    { id: 'top_100_silver', label: 'Tinh anh Đấu trường', desc: 'Dành cho TOP 100 bảng xếp hạng', style: 'border border-slate-300 shadow-[0_0_8px_#cbd5e1]' }
  ];

  const allTitles = [
    { id: 'apprentice', label: 'Tập sự STEM', desc: 'Bước đầu tiên vào thế giới khoa học' },
    { id: 'alchemist_expert', label: 'Bậc thầy Hóa học', desc: 'Đạt phản ứng hoàn hảo 100% trong QuantumLab', requiredLevel: 2 },
    { id: 'math_wizard', label: 'Chiến thần Toán học', desc: 'Giải đố không gian chính xác tuyệt đối', requiredLevel: 3 },
    { id: 'physics_guru', label: 'Kỹ sư Cơ học', desc: 'Bậc thầy chế tạo các bánh răng Newton', requiredLevel: 4 },
    { id: 'cosmic_explorer', label: 'Nhà thám hiểm Vũ trụ', desc: 'Khám phá bí ẩn của các vì sao và tinh cầu', requiredElo: 1100 },
    { id: 'nuclear_engineer', label: 'Kỹ sư Phản ứng hạt', desc: 'Làm chủ năng lượng liên kết hạt nhân', requiredElo: 1300 },
    { id: 'quantum_master', label: 'Thạc sĩ Lượng tử', desc: 'Xác định chính xác vị trí của hạt qubit', requiredElo: 1600 },
    { id: 'stem_legend', label: 'Huyền thoại STEM', desc: 'Đạt mốc 2000 Elo Đấu trường thực chiến', requiredElo: 2000 },
    { id: 'multiverse_theorist', label: 'Nhà lập thuyết Đa vũ trụ', desc: 'Lý giải sơ đồ cầu Einstein-Rosen', requiredElo: 2400 },
    { id: 'dimension_creator', label: 'Đấng kiến tạo Không gian', desc: 'Làm chủ các chiều kích phi Euclid', requiredElo: 2800 },
    { id: 'top_1_universe', label: 'Đại Đế STEM 👑', desc: 'Chỉ dành cho TOP 1 bảng xếp hạng' },
    { id: 'top_10_legend', label: 'Huyền thoại Đấu trường', desc: 'Dành cho TOP 10 bảng xếp hạng' },
    { id: 'top_100_elite', label: 'Đại Cao Thủ STEM', desc: 'Dành cho TOP 100 bảng xếp hạng' }
  ];

  const badges = [
    { id: 'badge1', name: 'Nhà tiên phong', desc: 'Tạo tài khoản và tham gia buổi học đầu tiên', icon: <Sparkles className="w-8 h-8 text-yellow-400" />, unlocked: true },
    { id: 'badge2', name: 'Đột phá Hóa học', desc: 'Hoàn thành bài thi 15 phút với điểm tuyệt đối', icon: <Flame className="w-8 h-8 text-rose-500" />, unlocked: true },
    { id: 'badge3', name: 'Nhà thông thái', desc: 'Lọt top 100 Bảng xếp hạng thi đấu thực chiến', icon: <Trophy className="w-8 h-8 text-amber-400" />, unlocked: (personalization.level || 1) >= 1 || (user && (user.displayName === 'admin' || user.email?.includes('admin'))) },
    { id: 'badge4', name: 'Bách khoa toàn thư', desc: 'Mở khóa và học đầy đủ 3 môn Toán, Hóa, Sinh', icon: <BookOpen className="w-8 h-8 text-emerald-400" />, unlocked: (personalization.level || 1) >= 1 || (user && (user.displayName === 'admin' || user.email?.includes('admin'))) },
    { id: 'badge5', name: 'Bất bại', desc: 'Đạt chuỗi thắng 5 trận đấu hạng liên tiếp', icon: <Zap className="w-8 h-8 text-cyan-400" />, unlocked: true },
    { id: 'badge6', name: 'Bác học Lượng tử', desc: 'Đạt thành tích giải đố QuantumLab trong thời gian kỷ lục', icon: <Atom className="w-8 h-8 text-purple-400" />, unlocked: (personalization.level || 1) >= 1 || (user && (user.displayName === 'admin' || user.email?.includes('admin'))) },
    { id: 'badge7', name: 'Vua Đấu Trường', desc: 'Đạt Elo hạng Kim Cương trên Bảng xếp hạng Đấu trường', icon: <Crown className="w-8 h-8 text-amber-400" />, unlocked: (personalization.elo || 0) >= 1500 || (user && (user.displayName === 'admin' || user.email?.includes('admin'))) },
    { id: 'badge8', name: 'Kỹ sư Vi mạch', desc: 'Sáng tạo và lập trình vi điều khiển STM32 lượng tử', icon: <Cpu className="w-8 h-8 text-cyan-400" />, unlocked: (personalization.level || 1) >= 1 || (user && (user.displayName === 'admin' || user.email?.includes('admin'))) },
    { id: 'badge9', name: 'Sinh học Phân tử', desc: 'Ghép cặp chính xác chuỗi xoắn kép DNA và RNA trong phòng Lab', icon: <Dna className="w-8 h-8 text-pink-400" />, unlocked: (personalization.level || 1) >= 1 || (user && (user.displayName === 'admin' || user.email?.includes('admin'))) },
    { id: 'badge10', name: 'Nhà Thực Nghiệm', desc: 'Hoàn thành tất cả các bài thử nghiệm trong học phần Lab', icon: <FlaskConical className="w-8 h-8 text-indigo-400" />, unlocked: (personalization.level || 1) >= 1 || (user && (user.displayName === 'admin' || user.email?.includes('admin'))) }
  ];

  const handlePinBadge = async (badgeId) => {
    playSound.success();
    const currentPinned = personalization.pinnedBadges || ['badge1', 'badge2', 'badge3'];
    const updated = [...currentPinned];
    updated[selectedPodIndex] = badgeId;
    
    setPersonalization({ pinnedBadges: updated });
    if (user) {
      try {
        const processTransaction = httpsCallable(functions, 'processCrystalTransaction');
        await processTransaction({
          actionType: 'UPDATE_PERSONALIZATION',
          payload: { pinnedBadges: updated }
        });
      } catch (err) {
        console.error("Lỗi khi lưu ghim huy hiệu:", err);
      }
    }
    setSelectedPodIndex(null);
  };


  // Lọc danh sách người chơi động theo thời gian thực (Search-as-you-type & Case-insensitive)
  const filteredSearchResults = searchQuery.trim()
    ? allPlayers.filter(p => 
        p.displayName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        p.uid.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : [];

  if (!mounted || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-zinc-400">
        <Sparkles className="w-12 h-12 text-pink-500 animate-spin mb-4" />
        <p className="text-lg font-medium">Vui lòng đăng nhập để xem hồ sơ cá nhân của bạn...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen pb-24">
      
      {/* Page Title */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Shield className="w-8 h-8 text-pink-500" /> Hồ sơ Nhà khoa học
        </h1>
        <p className="text-zinc-400 text-sm mt-1">Cá nhân hóa thông tin hiển thị, quản lý kho đồ và theo dõi năng lực STEM.</p>
      </div>

      {/* Tabs list */}
      <div className="flex gap-4 border-b border-white/5 mb-8 flex-wrap">
        {[
          { id: 'overview', label: 'Tổng quan năng lực', icon: <User className="w-4 h-4" /> },
          { id: 'daily_checkin', label: 'Điểm danh 7 ngày', icon: <Gift className="w-4 h-4" /> },
          { id: 'friends', label: 'Mạng lưới bạn bè', icon: <Users className="w-4 h-4" /> },
          { id: 'inventory', label: 'Kho đồ & Danh hiệu', icon: <Award className="w-4 h-4" /> },
          { id: 'personalization', label: 'Cá nhân hóa', icon: <Sparkles className="w-4 h-4" /> },
          { id: 'achievements', label: 'Huy hiệu thành tựu', icon: <Trophy className="w-4 h-4" /> },
          { id: 'settings', label: 'Bảo mật & E-mail', icon: <Mail className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onMouseEnter={playSound.hover}
            onClick={() => {
              playSound.click();
              setActiveTab(tab.id);
            }}
            className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 transition-colors relative ${
              activeTab === tab.id ? 'text-pink-400 font-extrabold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.icon} {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="profileTabBorder"
                className="absolute bottom-0 left-0 w-full h-[3px] bg-pink-500 rounded-t-full" 
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Card 3D Hologram (Cols 5) */}
          <div className="xl:col-span-5 flex justify-center items-start w-full">
            <div 
              ref={cardRef}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.1s ease-out'
              }}
              className="relative w-full max-w-sm bg-white dark:bg-gradient-to-br dark:from-[#2a2c3a]/80 dark:to-[#1c1e29]/90 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-between min-h-[420px] select-none group"
            >
              {/* Sci-fi Hologram Lines & Grid Overlay */}
              <div className="absolute inset-0 rounded-3xl bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="absolute top-4 right-4 text-[10px] text-pink-500/50 font-mono tracking-widest uppercase">ID: {user.uid.slice(0, 8)}</div>

              {/* Holographic light reflection */}
              <div 
                className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  transform: `translate(${tilt.y * 3}px, ${-tilt.x * 3}px)`
                }}
              />

               <div className="mt-8 flex flex-col items-center">
                 <div 
                   onClick={() => {
                     playSound.click();
                     setActiveTab('personalization');
                     setActivePersonalizationSubTab('character');
                   }}
                   className="relative group/avatar cursor-pointer"
                   title="Thiết kế Avatar Chibi cá nhân"
                 >
                   <AvatarFrame frame={personalization.avatarFrame} className="w-24 h-24 text-4xl transition-all duration-300 group-hover/avatar:scale-105">
                     {personalization.avatarUrl === 'custom-avatar' ? (
                       <STEMAvatarSVG parts={personalization.avatarParts} />
                     ) : personalization.avatarUrl ? (
                       personalization.avatarUrl.startsWith('http') || personalization.avatarUrl.startsWith('data:image/') ? (
                         <img src={personalization.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a1a1aa'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E"; }} />
                       ) : (
                         <span className="select-none">{personalization.avatarUrl}</span>
                       )
                     ) : (
                       user.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-12 h-12" />
                     )}
                     
                     {/* Edit overlay */}
                     <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 flex items-center justify-center z-20">
                       <span className="text-[10px] font-black text-white uppercase tracking-wider">Thay đổi</span>
                     </div>
                     
                     {/* EXP Star float */}
                     <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-pink-500 border-2 border-[#1c1e29] text-[11px] font-extrabold text-white flex items-center justify-center shadow-lg z-30">
                       {personalization.level}
                     </div>
                   </AvatarFrame>
                 </div>

                <div className="text-center mt-4">
                  <h3 className="text-xl font-bold text-white tracking-wide">{user.displayName || 'Học viên'}</h3>
                  <p className="text-xs text-pink-400 font-semibold uppercase tracking-wider mt-1 px-3 py-1 bg-pink-500/10 rounded-full inline-block">
                    {getTitleLabel(personalization.activeTitle)}
                  </p>
                </div>
              </div>

              {/* Level progress info */}
              <div className="w-full mt-6 space-y-2 border-t border-white/5 pt-4 z-10">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Trình độ Nhà nghiên cứu</span>
                  <span className="font-semibold text-white">EXP: {personalization.exp} / {personalization.nextLevelExp}</span>
                </div>
                <div className="w-full h-2 bg-[#1c1e29] rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${(personalization.exp / personalization.nextLevelExp) * 100}%` }}
                  />
                </div>
              </div>

              {/* Match Stats summary */}
              <div className="grid grid-cols-3 gap-2 w-full mt-6 bg-[#1c1e29]/50 rounded-2xl p-3 border border-white/5 text-center text-xs z-10">
                <div>
                  <div className="text-zinc-500 font-medium">Elo Hạng</div>
                  <div className="text-pink-400 font-bold text-base mt-0.5">{personalization.elo}</div>
                </div>
                <div>
                  <div className="text-zinc-500 font-medium">Trận đấu</div>
                  <div className="text-white font-bold text-base mt-0.5">{personalization.wins + personalization.losses}</div>
                </div>
                <div>
                  <div className="text-zinc-500 font-medium">Tỷ lệ thắng</div>
                  <div className="text-emerald-400 font-bold text-base mt-0.5">
                    {personalization.wins + personalization.losses > 0 
                      ? `${Math.round((personalization.wins / (personalization.wins + personalization.losses)) * 100)}%` 
                      : '0%'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Radar Chart & Details (Cols 7) */}
          <div className="xl:col-span-7 flex flex-col gap-6 w-full text-left">
            
            {/* radar card */}
            <div className="bg-[#2a2c3a] border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-8 shadow-xl">
              
              {/* SVG Radar implementation */}
              <div className="w-48 h-48 shrink-0 relative bg-[#1c1e29]/40 rounded-full border border-white/5 p-4 flex items-center justify-center overflow-hidden">
                {/* Radar sweep light overlay */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500/5 to-transparent animate-[spin_12s_linear_infinite] pointer-events-none" />

                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-45 relative z-10">
                  {/* Circular grid lines */}
                  {[20, 40, 60, 80].map((r, i) => (
                    <circle 
                      key={i} 
                      cx={cx} 
                      cy={cy} 
                      r={r} 
                      fill="none" 
                      stroke="rgba(255,255,255,0.05)" 
                      strokeWidth="1" 
                    />
                  ))}
                  
                  {/* Axis lines */}
                  <line x1={cx} y1={cy - rMax} x2={cx} y2={cy + rMax} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  <line x1={cx - rMax} y1={cy} x2={cx + rMax} y2={cy} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

                  {/* Highlight axis line when hovered */}
                  {hoveredSubject === 'math' && (
                    <line x1={cx} y1={cy} x2={cx} y2={cy - rMax} stroke="#ec4899" strokeWidth="2.5" className="animate-pulse" />
                  )}
                  {hoveredSubject === 'physics' && (
                    <line x1={cx} y1={cy} x2={cx + rMax} y2={cy} stroke="#f43f5e" strokeWidth="2.5" className="animate-pulse" />
                  )}
                  {hoveredSubject === 'chemistry' && (
                    <line x1={cx} y1={cy} x2={cx} y2={cy + rMax} stroke="#fbbf24" strokeWidth="2.5" className="animate-pulse" />
                  )}
                  {hoveredSubject === 'biology' && (
                    <line x1={cx} y1={cy} x2={cx - rMax} y2={cy} stroke="#10b981" strokeWidth="2.5" className="animate-pulse" />
                  )}

                  {/* Radar sweep scanner line */}
                  <line 
                    x1={cx} 
                    y1={cy} 
                    x2={cx + rMax} 
                    y2={cy} 
                    stroke="rgba(236,72,153,0.15)" 
                    strokeWidth="1.5" 
                    style={{ transformOrigin: '100px 100px' }}
                    className="animate-[spin_4s_linear_infinite]"
                  />

                  {/* Labels on SVG */}
                  <text x={cx} y={cy - rMax - 5} textAnchor="middle" fill={hoveredSubject === 'math' ? '#ffffff' : '#ec4899'} fontSize="10" fontWeight="bold" transform="rotate(45 100 15)" className="transition-colors duration-200">Toán</text>
                  <text x={cx + rMax + 5} y={cy + 4} textAnchor="start" fill={hoveredSubject === 'physics' ? '#ffffff' : '#f43f5e'} fontSize="10" fontWeight="bold" transform="rotate(45 185 104)" className="transition-colors duration-200">Lý</text>
                  <text x={cx} y={cy + rMax + 14} textAnchor="middle" fill={hoveredSubject === 'chemistry' ? '#ffffff' : '#fbbf24'} fontSize="10" fontWeight="bold" transform="rotate(45 100 194)" className="transition-colors duration-200">Hóa</text>
                  <text x={cx - rMax - 5} y={cy + 4} textAnchor="end" fill={hoveredSubject === 'biology' ? '#ffffff' : '#10b981'} fontSize="10" fontWeight="bold" transform="rotate(45 15 104)" className="transition-colors duration-200">Sinh</text>

                  {/* Filled radar polygon */}
                  <polygon 
                    points={radarPolygonPoints} 
                    fill="rgba(236,72,153,0.2)" 
                    stroke="#ec4899" 
                    strokeWidth="2.5" 
                    className="shadow-glow animate-pulse"
                  />
                  
                  {/* Points circles with halos */}
                  {/* Math */}
                  {hoveredSubject === 'math' && (
                    <circle cx={cx} cy={cy - (strengths.math / 100) * rMax} r="10" fill="#ec4899" opacity="0.4" className="animate-ping" style={{ transformOrigin: `${cx}px ${cy - (strengths.math / 100) * rMax}px` }} />
                  )}
                  <circle cx={cx} cy={cy - (strengths.math / 100) * rMax} r={hoveredSubject === 'math' ? "6" : "4"} fill="#ec4899" className="transition-all duration-200" />
                  
                  {/* Physics */}
                  {hoveredSubject === 'physics' && (
                    <circle cx={cx + (strengths.physics / 100) * rMax} cy={cy} r="10" fill="#f43f5e" opacity="0.4" className="animate-ping" style={{ transformOrigin: `${cx + (strengths.physics / 100) * rMax}px ${cy}px` }} />
                  )}
                  <circle cx={cx + (strengths.physics / 100) * rMax} cy={cy} r={hoveredSubject === 'physics' ? "6" : "4"} fill="#f43f5e" className="transition-all duration-200" />
                  
                  {/* Chemistry */}
                  {hoveredSubject === 'chemistry' && (
                    <circle cx={cx} cy={cy + (strengths.chemistry / 100) * rMax} r="10" fill="#fbbf24" opacity="0.4" className="animate-ping" style={{ transformOrigin: `${cx}px ${cy + (strengths.chemistry / 100) * rMax}px` }} />
                  )}
                  <circle cx={cx} cy={cy + (strengths.chemistry / 100) * rMax} r={hoveredSubject === 'chemistry' ? "6" : "4"} fill="#fbbf24" className="transition-all duration-200" />
                  
                  {/* Biology */}
                  {hoveredSubject === 'biology' && (
                    <circle cx={cx - (strengths.biology / 100) * rMax} cy={cy} r="10" fill="#10b981" opacity="0.4" className="animate-ping" style={{ transformOrigin: `${cx - (strengths.biology / 100) * rMax}px ${cy}px` }} />
                  )}
                  <circle cx={cx - (strengths.biology / 100) * rMax} cy={cy} r={hoveredSubject === 'biology' ? "6" : "4"} fill="#10b981" className="transition-all duration-200" />
                </svg>
              </div>

              {/* radar details text */}
              <div className="flex-1 space-y-4 w-full">
                <h4 className="text-lg font-bold text-white flex items-center gap-1.5">
                  <Star className="w-5 h-5 text-pink-400" /> Chỉ số Năng lực STEM
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Chỉ số radar thể hiện mức độ tích cực hoạt động và kết quả bài thi giải đố của bạn ở từng phòng lab. Điểm số tăng lên khi hoàn thành bài thi thực chiến môn đó.
                </p>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div 
                    onMouseEnter={() => setHoveredSubject('math')}
                    onMouseLeave={() => setHoveredSubject(null)}
                    className={`flex justify-between items-center p-2.5 rounded-xl border transition-all duration-355 cursor-pointer ${
                      hoveredSubject === 'math' 
                        ? 'bg-pink-500/10 border-pink-500/30 shadow-md shadow-pink-500/5 scale-[1.02]' 
                        : 'bg-[#1c1e29]/40 border-white/5'
                    }`}
                  >
                    <span className="text-pink-400 font-semibold">Toán học</span>
                    <span className="text-white font-bold">{strengths.math}%</span>
                  </div>
                  <div 
                    onMouseEnter={() => setHoveredSubject('physics')}
                    onMouseLeave={() => setHoveredSubject(null)}
                    className={`flex justify-between items-center p-2.5 rounded-xl border transition-all duration-355 cursor-pointer ${
                      hoveredSubject === 'physics' 
                        ? 'bg-rose-500/10 border-rose-500/30 shadow-md shadow-rose-500/5 scale-[1.02]' 
                        : 'bg-[#1c1e29]/40 border-white/5'
                    }`}
                  >
                    <span className="text-rose-500 font-semibold">Vật lý</span>
                    <span className="text-white font-bold">{strengths.physics}%</span>
                  </div>
                  <div 
                    onMouseEnter={() => setHoveredSubject('chemistry')}
                    onMouseLeave={() => setHoveredSubject(null)}
                    className={`flex justify-between items-center p-2.5 rounded-xl border transition-all duration-355 cursor-pointer ${
                      hoveredSubject === 'chemistry' 
                        ? 'bg-amber-500/10 border-amber-500/30 shadow-md shadow-amber-500/5 scale-[1.02]' 
                        : 'bg-[#1c1e29]/40 border-white/5'
                    }`}
                  >
                    <span className="text-amber-400 font-semibold">Hóa học</span>
                    <span className="text-white font-bold">{strengths.chemistry}%</span>
                  </div>
                  <div 
                    onMouseEnter={() => setHoveredSubject('biology')}
                    onMouseLeave={() => setHoveredSubject(null)}
                    className={`flex justify-between items-center p-2.5 rounded-xl border transition-all duration-355 cursor-pointer ${
                      hoveredSubject === 'biology' 
                        ? 'bg-emerald-500/10 border-emerald-500/30 shadow-md shadow-emerald-500/5 scale-[1.02]' 
                        : 'bg-[#1c1e29]/40 border-white/5'
                    }`}
                  >
                    <span className="text-emerald-400 font-semibold">Sinh học</span>
                    <span className="text-white font-bold">{strengths.biology}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Archetype & AI Advice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Archetype Card */}
              {(() => {
                const arch = getArchetype(strengths);
                return (
                  <div className={`p-5 rounded-3xl border ${arch.bgColor} ${arch.glowColor} flex flex-col justify-between space-y-3 transition-all duration-500 relative overflow-hidden group`}>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                          <Shield className="w-4.5 h-4.5 text-pink-400" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Hệ năng lực</span>
                      </div>
                      <h4 className={`text-lg font-black tracking-wide ${arch.color}`}>
                        {arch.title}
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed mt-2">
                        {arch.desc}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Smart AI Advice Card */}
              <div className="bg-[#2a2c3a] border border-white/5 rounded-3xl p-5 flex flex-col justify-between space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-xl pointer-events-none" />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <Sparkles className="w-4.5 h-4.5 text-pink-400 animate-pulse" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Khuyến nghị phát triển</span>
                  </div>
                  <h4 className="text-sm font-bold text-white leading-snug">
                    Định hướng tối ưu hóa chỉ số
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-2">
                    {getSubjectAdvice(strengths)}
                  </p>
                </div>
              </div>
            </div>

            {/* instructions alert */}
            <div className="bg-pink-500/10 border border-pink-500/20 rounded-3xl p-6 flex items-start gap-4 shadow-md">
              <Sparkles className="w-6 h-6 text-pink-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-bold text-white mb-1">Mẹo tăng xếp hạng khoa học</h5>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Bạn có thể tăng cấp độ (Level), điểm EXP và điểm Elo thông qua việc hoàn thành các phòng Lab thực hành hoặc chiến đấu 1v1 trong <strong className="text-pink-400">Đấu trường hạng thực chiến</strong> (Phòng thi thực chiến sắp ra mắt!). Khi thăng hạng, bạn sẽ mở khóa thêm nhiều Khung Avatar neon rực rỡ và Danh hiệu độc quyền để khoe với những người chơi khác.
                </p>
              </div>
            </div>

            {/* TỦ TRƯNG BÀY HOLOGRAM 3D (STEM Holographic Showcase) */}
            <div className="mt-8 bg-[#2a2c3a] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden text-left">
              {/* Grid background & sweep line */}
              <div className="absolute inset-0 rounded-3xl bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-40" />
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-pink-400" /> Tủ Trưng Bày Hologram 3D
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">Trình diễn những huy hiệu danh giá nhất của bạn trên bục năng lượng lượng tử.</p>
                </div>
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Holographic Showcase v1.0</span>
              </div>

              {/* 3 Bục Hologram */}
              <div className="grid grid-cols-3 gap-6 pt-12 pb-6 relative z-10">
                {[0, 1, 2].map((i) => {
                  const pinnedBadgeIds = personalization.pinnedBadges || ['badge1', 'badge2', 'badge3'];
                  const badgeId = pinnedBadgeIds[i];
                  const badge = badges.find(b => b.id === badgeId);

                  return (
                    <div 
                      key={i} 
                      onClick={() => {
                        playSound.click();
                        setSelectedPodIndex(i);
                      }}
                      className="relative flex flex-col items-center justify-end min-h-[160px] group cursor-pointer"
                    >
                      {/* Cột sáng Hologram hình nón cụt bay lên */}
                      <div 
                        className={`absolute bottom-5 left-1/2 -translate-x-1/2 w-28 h-24 bg-gradient-to-t ${
                          i === 0 ? 'from-cyan-500/20 to-transparent' :
                          i === 1 ? 'from-fuchsia-500/20 to-transparent' :
                          'from-amber-500/20 to-transparent'
                        } pointer-events-none transition-all duration-300 group-hover:scale-y-110 opacity-70 group-hover:opacity-100`}
                        style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }}
                      />

                      {/* Huy hiệu lơ lửng xoay tròn */}
                      {badge ? (
                        <motion.div 
                          animate={{ 
                            y: [-12, -2, -12],
                            rotateY: [0, 360]
                          }}
                          transition={{ 
                            duration: 6 + i * 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center justify-center pointer-events-none"
                        >
                          <div className={`w-14 h-14 rounded-2xl bg-zinc-950/80 border-2 ${
                            i === 0 ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]' :
                            i === 1 ? 'border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.3)]' :
                            'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                          } flex items-center justify-center text-2xl relative overflow-hidden group`}>
                            {/* Lớp quét laser ngang */}
                            <div className="absolute inset-x-0 h-[1.5px] bg-white/40 top-1/2 -translate-y-1/2 animate-pulse" />
                            {badge.icon}
                          </div>
                          
                          <span className="text-[9px] font-black text-white mt-2 px-1.5 py-0.5 bg-black/60 border border-white/10 rounded-md whitespace-nowrap">
                            {badge.name}
                          </span>
                        </motion.div>
                      ) : (
                        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center justify-center">
                          <div className="w-10 h-10 rounded-full border border-dashed border-zinc-600 hover:border-zinc-400 bg-black/40 flex items-center justify-center transition-colors">
                            <Plus className="w-4 h-4 text-zinc-500" />
                          </div>
                          <span className="text-[8px] font-bold text-zinc-500 mt-1.5">Click để ghim</span>
                        </div>
                      )}

                      {/* Bục 3D nghiêng */}
                      <div 
                        className="relative w-32 h-10 bg-zinc-800 rounded-full border border-white/10 flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover:scale-105"
                        style={{ transform: 'rotateX(60deg) translateZ(0)' }}
                      >
                        {/* Vòng neon phát sáng ở viền bục */}
                        <div className={`absolute inset-[-1.5px] rounded-full border-2 ${
                          i === 0 ? 'border-cyan-500 shadow-[0_0_10px_#06b6d4]' :
                          i === 1 ? 'border-fuchsia-500 shadow-[0_0_10px_#d946ef]' :
                          'border-amber-500 shadow-[0_0_10px_#f59e0b]'
                        } blur-[0.5px]`} />
                        
                        <div className="w-full h-full bg-zinc-950/90 rounded-full flex items-center justify-center overflow-hidden">
                          <div className="w-20 h-4 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab Điểm danh lượng tử 7 ngày & Nhiệm vụ hàng ngày */}
      {activeTab === 'daily_checkin' && (
        <div className="bg-[#141526]/80 backdrop-blur-3xl border border-white/5 p-8 rounded-3xl shadow-2xl text-left max-w-6xl mx-auto w-full relative overflow-hidden animate-in fade-in duration-200">
          {/* Neon light beams */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/5 pb-6 mb-8">
            <div>
              <h2 className="text-2xl font-black tracking-wider uppercase bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-400 font-sans">
                ĐỒNG BỘ NĂNG LƯỢNG LƯỢNG TỬ
              </h2>
              <p className="text-zinc-400 text-xs mt-1 font-mono uppercase tracking-wider">
                Đăng nhập và hoàn thành nhiệm vụ mỗi ngày để tích lũy Pha lê 🔮 nâng cấp Chibi Avatar
              </p>
            </div>
            
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/5">
              <span className="text-xs font-bold text-zinc-400 font-sans">Số dư hiện tại:</span>
              <span className="text-lg font-mono font-black text-pink-400 flex items-center gap-1">
                {personalization.crystals !== undefined ? personalization.crystals : 500} 🔮
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Cột trái: Lịch điểm danh 7 ngày */}
            <div className="lg:col-span-7 space-y-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                Chu kỳ Đồng bộ 7 Ngày
              </h3>
              
              {/* Grid 7 ngày điểm danh */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                  const lastDayIndex = personalization.checkInDayIndex || 0;
                  const todayStr = new Date().toISOString().split('T')[0];
                  const lastCheckIn = personalization.lastCheckInDate;
                  const hasCheckedInToday = lastCheckIn === todayStr;

                  let status = 'locked'; // 'claimed', 'active', 'locked'
                  
                  if (dayNum <= lastDayIndex) {
                    status = 'claimed';
                  } else if (dayNum === lastDayIndex + 1 && !hasCheckedInToday) {
                    status = 'active';
                  } else if (dayNum === 1 && lastDayIndex === 7 && !hasCheckedInToday) {
                    status = 'active';
                  }

                  let rewardVal = 50;
                  if (dayNum === 1) rewardVal = 50;
                  else if (dayNum === 2) rewardVal = 60;
                  else if (dayNum === 3) rewardVal = 70;
                  else if (dayNum === 4) rewardVal = 80;
                  else if (dayNum === 5) rewardVal = 100;
                  else if (dayNum === 6) rewardVal = 120;
                  else if (dayNum === 7) rewardVal = 200;

                  return (
                    <div 
                      key={dayNum}
                      className={`relative p-3.5 rounded-2xl border flex flex-col items-center justify-between text-center transition-all duration-300 min-h-[130px] ${
                        status === 'claimed'
                          ? 'bg-zinc-950/40 border-emerald-500/20 opacity-60'
                          : status === 'active'
                          ? 'bg-gradient-to-b from-pink-500/10 to-[#1e1d30] border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.2)]'
                          : 'bg-zinc-900/20 border-white/5'
                      }`}
                    >
                      <span className={`text-[9px] font-mono font-bold tracking-wider uppercase ${
                        status === 'claimed' ? 'text-emerald-400' : status === 'active' ? 'text-pink-400' : 'text-zinc-500'
                      }`}>
                        Ngày {dayNum}
                      </span>

                      <div className="my-2.5">
                        {dayNum === 7 ? (
                          <div className="relative">
                            <Gift className={`w-7 h-7 ${
                              status === 'claimed' ? 'text-emerald-500' : status === 'active' ? 'text-amber-400 animate-bounce' : 'text-zinc-600'
                            }`} />
                            {status === 'active' && (
                              <span className="absolute -top-1 -right-2 text-[8px] px-1 py-0.5 bg-amber-500 text-zinc-950 rounded font-black uppercase tracking-widest animate-pulse">VIP</span>
                            )}
                          </div>
                        ) : (
                          <Sparkles className={`w-5 h-5 ${
                            status === 'claimed' ? 'text-emerald-500' : status === 'active' ? 'text-pink-400' : 'text-zinc-600'
                          }`} />
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`text-[11px] font-mono font-black ${
                          status === 'claimed' ? 'text-emerald-400' : status === 'active' ? 'text-pink-300' : 'text-zinc-400'
                        }`}>
                          +{rewardVal} 🔮
                        </span>
                        {dayNum === 7 && (
                          <span className={`text-[7px] font-bold font-sans ${
                            status === 'claimed' ? 'text-emerald-500' : status === 'active' ? 'text-amber-400' : 'text-zinc-500'
                          }`}>
                            + Vương miện 👑
                          </span>
                        )}
                      </div>

                      {status === 'claimed' && (
                        <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-zinc-950 rounded-full p-0.5 border border-emerald-400 shadow-md">
                          <CheckCircle className="w-3 h-3 text-zinc-950 fill-zinc-950" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2 font-sans">
                    <Gift className="w-4 h-4 text-pink-400" /> 
                    {personalization.lastCheckInDate === new Date().toISOString().split('T')[0]
                      ? "BẠN ĐÃ ĐỒNG BỘ NĂNG LƯỢNG HÔM NAY"
                      : "CHƯA ĐỒNG BỘ NĂNG LƯỢNG HÔM NAY"
                    }
                  </h4>
                  <p className="text-[10px] text-zinc-400 mt-1 max-w-md leading-relaxed font-sans">
                    {personalization.lastCheckInDate === new Date().toISOString().split('T')[0]
                      ? "Sóng sinh học của bạn đã được tối ưu hóa đồng đều với máy chủ. Hộp quà năng lượng tiếp theo sẽ mở khóa vào ngày mai."
                      : "Nhấn nút bên dưới để gửi tín hiệu đồng bộ lên đám mây, kích hoạt tinh thể hạt nhân và thu hoạch pha lê năng lượng."
                    }
                  </p>
                </div>

                <button
                  onClick={handleDailyCheckIn}
                  disabled={personalization.lastCheckInDate === new Date().toISOString().split('T')[0]}
                  className={`px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all duration-300 shrink-0 font-sans ${
                    personalization.lastCheckInDate === new Date().toISOString().split('T')[0]
                      ? 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white font-black hover:opacity-95 shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transform hover:-translate-y-0.5 active:translate-y-0'
                  }`}
                >
                  {personalization.lastCheckInDate === new Date().toISOString().split('T')[0]
                    ? 'ĐÃ ĐỒNG BỘ HÔM NAY'
                    : 'KÍCH HOẠT ĐỒNG BỘ'
                  }
                </button>
              </div>
            </div>

            {/* Cột phải: Nhiệm vụ hàng ngày */}
            <div className="lg:col-span-5 space-y-6 bg-zinc-900/40 border border-white/5 rounded-3xl p-6 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                Nhiệm Vụ Hàng Ngày (Daily Quests)
              </h3>

              <div className="space-y-4">
                {dailyQuests.map((q) => {
                  const isDone = q.current >= q.target;
                  const percent = Math.min((q.current / q.target) * 100, 100);
                  
                  return (
                    <div 
                      key={q.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        q.claimed
                          ? 'bg-zinc-950/20 border-white/5 opacity-55'
                          : isDone
                          ? 'bg-purple-950/10 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.1)]'
                          : 'bg-zinc-800/40 border-white/5'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="text-left flex-1">
                          <h4 className="text-xs font-bold text-white leading-snug">{q.label}</h4>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-purple-400 font-bold flex items-center gap-0.5 font-mono">
                              <span>🔮</span>
                              <span>+{q.reward}</span>
                            </span>
                            <span className="text-[9px] text-zinc-500 font-mono">
                              Tiến trình: {q.current}/{q.target}
                            </span>
                          </div>
                        </div>

                        {/* Button Claim Reward */}
                        <div className="shrink-0">
                          {q.claimed ? (
                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg select-none">
                              Đã nhận ✔️
                            </span>
                          ) : isDone ? (
                            <button
                              onClick={() => handleClaimQuestReward(q.id)}
                              className="px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-zinc-950 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 shadow-md shadow-amber-500/20 animate-pulse"
                            >
                              Nhận quà
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-500 bg-[#1c1e29] border border-white/5 px-2.5 py-1 rounded-lg select-none">
                              Chưa xong
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-zinc-950 rounded-full h-1.5 mt-3 overflow-hidden border border-white/5">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            q.claimed ? 'bg-zinc-700' : isDone ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <p className="text-[9px] text-zinc-500 leading-snug">
                Nhiệm vụ tự động reset vào 00:00 mỗi ngày. Tiến độ thi đấu đấu trường sẽ được cập nhật khi bạn quay lại trang Hồ Sơ sau trận đấu.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Tab Bạn Bè & Xã Hội */}
      {activeTab === 'friends' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
          {/* CỘT TRÁI: TÌM BẠN & LỜI MỜI (LG: Col-5) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* 1. KHUNG TÌM KIẾM CHIẾN HỮU */}
            <div className="bg-[#2a2c3a] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-sans select-none">
                <Search className="w-5 h-5 text-pink-400" /> Tìm kiếm chiến hữu
              </h3>
              
              <form onSubmit={handleSearchFriends} className="flex gap-2">
                <input 
                  type="text"
                  required
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nhập DisplayName, Email hoặc UID..."
                  className="flex-1 bg-[#1c1e29] border border-white/5 focus:border-pink-500 focus:outline-none rounded-2xl px-4 py-3 text-xs text-white font-mono placeholder:text-zinc-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="px-5 py-3 bg-pink-500 hover:bg-pink-600 disabled:bg-zinc-800 text-white text-xs font-bold rounded-2xl transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-pink-500/10 whitespace-nowrap"
                >
                  {searching ? 'Đang tìm...' : 'Tìm kiếm'}
                </button>
              </form>

              {/* Danh sách kết quả tìm kiếm */}
              {filteredSearchResults.length > 0 ? (
                <div className="mt-6 space-y-3.5 border-t border-white/5 pt-4">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 select-none">Kết quả tìm kiếm</h4>
                  {filteredSearchResults.map((resUser) => {
                    const isAlreadyFriend = friends.some(f => f.uid === resUser.uid);
                    const isOutgoing = outgoingRequests.includes(resUser.uid);
                    const isIncoming = incomingRequests.some(r => r.uid === resUser.uid);

                    return (
                      <div key={resUser.uid} className="bg-[#1c1e29]/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-150">
                        <div className="flex items-center gap-3">
                          <AvatarFrame frame={resUser.avatarFrame} className="w-11 h-11 text-base">
                            {resUser.avatarParts ? (
                              <STEMAvatarSVG parts={resUser.avatarParts} className="w-full h-full transform scale-90" />
                            ) : resUser.avatarUrl ? (
                              resUser.avatarUrl.startsWith('http') || resUser.avatarUrl.startsWith('data:image/') ? (
                                <img src={resUser.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <span className="select-none">{resUser.avatarUrl}</span>
                              )
                            ) : (
                              resUser.displayName.charAt(0).toUpperCase()
                            )}
                            <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-pink-500 border border-[#1c1e29] text-[8px] font-bold text-white flex items-center justify-center shadow-lg z-30">
                              {resUser.level}
                            </div>
                          </AvatarFrame>
                          <div className="text-left">
                            <div className="text-sm font-semibold text-white leading-snug">{resUser.displayName}</div>
                            <div className="text-[9px] text-pink-400 font-bold uppercase tracking-wider mt-0.5">{getTitleLabel(resUser.activeTitle)}</div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">Elo: {resUser.elo}</div>
                          </div>
                        </div>

                        {isAlreadyFriend ? (
                          <span className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400 tracking-wider uppercase select-none flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5" /> Bạn bè
                          </span>
                        ) : isOutgoing ? (
                          <span className="px-3.5 py-1.5 bg-zinc-800 border border-white/5 rounded-full text-[10px] font-bold text-zinc-400 tracking-wider uppercase select-none flex items-center gap-1">
                            ⏳ Đã gửi
                          </span>
                        ) : isIncoming ? (
                          <button
                            onClick={() => acceptFriendRequest(resUser)}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-xl transition-all active:scale-95 shadow-md shadow-emerald-500/10 uppercase tracking-wider flex items-center gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Chấp nhận
                          </button>
                        ) : (
                          <button
                            onClick={() => sendFriendRequest(resUser)}
                            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-bold rounded-xl transition-all active:scale-95 shadow-md shadow-pink-500/10 uppercase tracking-wider flex items-center gap-1"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Kết bạn
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : searchQuery.trim() !== '' ? (
                <div className="mt-6 border-t border-white/5 pt-4 text-xs text-zinc-500 select-none">
                  Không tìm thấy người chơi nào khớp với "{searchQuery}"
                </div>
              ) : null}
            </div>

            {/* 2. KHUNG YÊU CẦU KẾT BẠN NHẬN ĐƯỢC */}
            <div className="bg-[#2a2c3a] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden flex-1 flex flex-col min-h-[250px] text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-sans select-none border-b border-white/5 pb-3">
                📩 Yêu cầu kết bạn ({richIncomingRequests.length})
              </h3>
              
              {richIncomingRequests.length > 0 ? (
                <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[350px] pr-1">
                  {richIncomingRequests.map((req) => (
                    <div key={req.uid} className="bg-[#1c1e29]/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <AvatarFrame frame={req.avatarFrame} className="w-11 h-11 text-base">
                          {req.avatarParts ? (
                            <STEMAvatarSVG parts={req.avatarParts} className="w-full h-full transform scale-90" />
                          ) : req.avatarUrl ? (
                            req.avatarUrl.startsWith('http') || req.avatarUrl.startsWith('data:image/') ? (
                              <img src={req.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="select-none">{req.avatarUrl}</span>
                            )
                          ) : (
                            req.displayName.charAt(0).toUpperCase()
                          )}
                          <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-pink-500 border border-[#1c1e29] text-[8px] font-bold text-white flex items-center justify-center shadow-lg z-30">
                            {req.level}
                          </div>
                        </AvatarFrame>
                        <div className="text-left">
                          <div className="text-sm font-semibold text-white leading-snug">{req.displayName}</div>
                          <div className="text-[9px] text-pink-400 font-bold uppercase tracking-wider mt-0.5">{getTitleLabel(req.activeTitle)}</div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">Elo: {req.elo}</div>
                        </div>
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => acceptFriendRequest(req)}
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-xl transition-all active:scale-95"
                          title="Chấp nhận"
                        >
                          <UserCheck className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => declineFriendRequest(req)}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl transition-all active:scale-95"
                          title="Từ chối"
                        >
                          <UserX className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-center py-8 text-zinc-500">
                  <Smile className="w-12 h-12 text-zinc-700 animate-bounce mb-3" />
                  <p className="text-xs">Không có lời mời kết bạn nào đang chờ duyệt.</p>
                </div>
              )}
            </div>

          </div>

          {/* CỘT PHẢI: DANH SÁCH BẠN BÈ (LG: Col-7) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            <div className="bg-[#2a2c3a] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden min-h-[500px] flex flex-col text-left">
              <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
              <h3 className="text-lg font-bold text-white mb-6 flex items-center justify-between border-b border-white/5 pb-4 select-none">
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-400 animate-pulse" /> Bạn bè của tôi
                </span>
                <span className="px-3 py-1 bg-pink-500/10 border border-pink-500/15 rounded-full text-xs font-mono font-bold text-pink-400">
                  {richFriends.length} CHIẾN HỮU
                </span>
              </h3>

              {richFriends.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {richFriends.map((friend) => (
                    <div 
                      key={friend.uid} 
                      className="bg-[#1c1e29]/40 border border-white/5 hover:border-pink-500/20 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all duration-300 relative group"
                    >
                      <div className="flex items-center gap-3">
                        <AvatarFrame frame={friend.avatarFrame} className="w-12 h-12 text-base">
                          {friend.avatarParts ? (
                            <STEMAvatarSVG parts={friend.avatarParts} className="w-full h-full transform scale-90" />
                          ) : friend.avatarUrl ? (
                            friend.avatarUrl.startsWith('http') || friend.avatarUrl.startsWith('data:image/') ? (
                              <img src={friend.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="select-none">{friend.avatarUrl}</span>
                            )
                          ) : (
                            friend.displayName.charAt(0).toUpperCase()
                          )}
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-pink-500 border-2 border-[#1c1e29] text-[9px] font-bold text-white flex items-center justify-center shadow-lg z-30">
                            {friend.level}
                          </div>
                        </AvatarFrame>
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <div className="text-sm font-semibold text-white leading-snug group-hover:text-pink-400 transition-colors">{friend.displayName}</div>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              friend.lastActive && (Date.now() - friend.lastActive < 45000)
                                ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]'
                                : 'bg-zinc-600'
                            }`} />
                          </div>
                          <div className="text-[9px] text-pink-400 font-bold uppercase tracking-wider mt-0.5">{getTitleLabel(friend.activeTitle)}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-zinc-500">Elo: {friend.elo}</span>
                            <span className="text-[10px] text-zinc-600">•</span>
                            <span className={`text-[10px] font-mono ${
                              friend.lastActive && (Date.now() - friend.lastActive < 45000)
                                ? 'text-emerald-400 font-bold'
                                : 'text-zinc-500'
                            }`}>
                              {friend.lastActive && (Date.now() - friend.lastActive < 45000) ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 border-t border-white/5 pt-3">
                        <button
                          onClick={() => viewFriendProfile(friend)}
                          className="flex-1 py-2 bg-pink-500/10 hover:bg-pink-500 border border-pink-500/20 hover:text-white text-pink-400 text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <User className="w-3.5 h-3.5" /> Xem hồ sơ
                        </button>
                        <button
                          onClick={() => openChallengeFor(friend)}
                          className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:text-white text-rose-400 rounded-xl transition-all active:scale-95"
                          title="Thách đấu"
                        >
                          <Swords className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => unfriendPlayer(friend)}
                          className="px-3 py-2 bg-zinc-800 hover:bg-rose-600/10 text-zinc-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/20 rounded-xl transition-all active:scale-95"
                          title="Hủy kết bạn"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-center py-20 text-zinc-500 select-none">
                  <Users className="w-16 h-16 text-zinc-700 animate-pulse mb-4" />
                  <h4 className="text-base font-bold text-white mb-1">Chưa có bạn bè nào</h4>
                  <p className="text-xs max-w-xs leading-relaxed text-zinc-500">Hãy tìm kiếm bạn bè của bạn bằng tên hoặc ID ở thanh bên trái để cùng thi đấu và tiến xa hơn!</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Tab Inventory & Titles */}
      {activeTab === 'inventory' && (() => {
        const userUnlockedFrames = personalization.unlockedFrames || ['default'];
        const dynamicFrames = [...allFrames];
        userUnlockedFrames.forEach((frameId) => {
          if (!dynamicFrames.some(f => f.id === frameId)) {
            let frameLabel = frameId.toUpperCase();
            if (frameId === 'gold_vip') frameLabel = 'Huyền thoại Vàng';
            else if (frameId === 'top_1_sovereign') frameLabel = 'Vương miện Đại Đế';
            else if (frameId === 'top_100_silver') frameLabel = 'Tinh anh Đấu trường';
            
            dynamicFrames.push({
              id: frameId,
              label: frameLabel,
              desc: 'Khung viền độc quyền từ Giải đấu Đấu Trường STEM.',
              style: 'border border-pink-500 shadow-[0_0_8px_#ec4899]'
            });
          }
        });

        const userUnlockedTitles = personalization.unlockedTitles || ['apprentice'];
        const dynamicTitles = [...allTitles];
        userUnlockedTitles.forEach((unlockedTitle) => {
          if (!dynamicTitles.some(t => t.id === unlockedTitle)) {
            dynamicTitles.push({
              id: unlockedTitle,
              label: unlockedTitle,
              desc: 'Danh hiệu độc quyền từ Giải đấu Đấu Trường STEM.'
            });
          }
        });

        return (
          <div className="space-y-10">
            
            {/* Avatar Frames equip section */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" /> Trang bị Khung Avatar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dynamicFrames.map((frame) => {
                  let isUnlocked = true;
                  if (user && (user.displayName === 'admin' || user.email?.includes('admin'))) {
                    isUnlocked = true;
                  } else if (userUnlockedFrames.includes(frame.id)) {
                    isUnlocked = true;
                  } else if (frame.id === 'top_1_sovereign') {
                    isUnlocked = leaderboardRank === 1;
                  } else if (frame.id === 'gold_vip') {
                    isUnlocked = leaderboardRank <= 10;
                  } else if (frame.id === 'top_100_silver') {
                    isUnlocked = leaderboardRank <= 100;
                  } else if (frame.requiredElo) {
                    isUnlocked = personalization.elo >= frame.requiredElo;
                  } else if (frame.requiredLevel) {
                    isUnlocked = personalization.level >= frame.requiredLevel;
                  }
                  const isEquipped = personalization.avatarFrame === frame.id;
                  
                  return (
                    <div 
                      key={frame.id} 
                      className={`bg-[#2a2c3a] border rounded-2xl p-5 flex flex-col items-center text-center justify-between relative transition-all group ${
                        isEquipped ? 'border-pink-500/80 shadow-lg shadow-pink-500/10' : 'border-white/5 hover:border-white/10'
                      }`}
                    >
                      {!isUnlocked && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center p-4 z-20">
                          <span className="text-xs font-bold text-zinc-400 bg-[#1c1e29] border border-white/5 px-2.5 py-1 rounded-full mb-1 flex items-center gap-1">
                            Khóa 🔒
                          </span>
                          <p className="text-[10px] text-zinc-500 leading-tight">
                            {frame.id === 'top_1_sovereign'
                              ? 'Yêu cầu đạt TOP 1 bảng xếp hạng'
                              : frame.id === 'gold_vip'
                                ? 'Yêu cầu lọt TOP 10 bảng xếp hạng'
                                : frame.id === 'top_100_silver'
                                  ? 'Yêu cầu lọt TOP 100 bảng xếp hạng'
                                  : frame.requiredElo 
                                    ? `Yêu cầu Elo đạt ${frame.requiredElo} để mở khóa`
                                    : `Yêu cầu cấp độ ${frame.requiredLevel} để mở khóa`}
                          </p>
                        </div>
                      )}

                      <AvatarFrame frame={frame.id} className="w-14 h-14 text-xl mb-4">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
                      </AvatarFrame>

                      <div>
                        <h4 className="text-sm font-bold text-white">{frame.label}</h4>
                        <p className="text-[10px] text-zinc-400 leading-snug mt-1 min-h-[30px]">{frame.desc}</p>
                      </div>

                      <button
                        disabled={!isUnlocked || isEquipped}
                        onClick={() => equipFrame(frame.id)}
                        className={`w-full py-2 rounded-xl text-xs font-bold mt-4 transition-all active:scale-95 ${
                          isEquipped 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 cursor-default' 
                            : 'bg-pink-500 hover:bg-pink-600 text-white shadow-md'
                        }`}
                      >
                        {isEquipped ? 'Đang dùng' : 'Trang bị'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Titles Equip section */}
            <div className="border-t border-white/5 pt-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-pink-400" /> Trang bị Danh hiệu cá nhân
              </h3>
              <div className="bg-[#2a2c3a] border border-white/5 rounded-3xl p-6 space-y-4">
                 {dynamicTitles.map((title) => {
                  let isUnlocked = true;
                  if (user && (user.displayName === 'admin' || user.email?.includes('admin'))) {
                    isUnlocked = true;
                  } else if (userUnlockedTitles.includes(title.id)) {
                    isUnlocked = true;
                  } else if (title.id === 'top_1_universe') {
                    isUnlocked = leaderboardRank === 1;
                  } else if (title.id === 'top_10_legend') {
                    isUnlocked = leaderboardRank <= 10;
                  } else if (title.id === 'top_100_elite') {
                    isUnlocked = leaderboardRank <= 100;
                  } else if (title.requiredElo) {
                    isUnlocked = personalization.elo >= title.requiredElo;
                  } else if (title.requiredLevel) {
                    isUnlocked = personalization.level >= title.requiredLevel;
                  }
                  const isEquipped = personalization.activeTitle === title.id;

                  return (
                    <div 
                      key={title.id} 
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#1c1e29]/50 border rounded-2xl transition-all ${
                        isEquipped ? 'border-pink-500/40 bg-[#1c1e29]/80 shadow-md' : 'border-white/5'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white">{title.label}</h4>
                          {isUnlocked ? (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/15">Đã mở khóa</span>
                          ) : (
                            <span className="text-[9px] font-bold text-zinc-500 bg-[#1c1e29] px-2 py-0.5 rounded-full border border-white/5">
                              {title.id === 'top_1_universe'
                                ? 'Yêu cầu đạt TOP 1 bảng xếp hạng'
                                : title.id === 'top_10_legend'
                                  ? 'Yêu cầu lọt TOP 10 bảng xếp hạng'
                                  : title.id === 'top_100_elite'
                                    ? 'Yêu cầu lọt TOP 100 bảng xếp hạng'
                                    : title.requiredElo 
                                      ? `Yêu cầu Elo đạt ${title.requiredElo}`
                                      : `Yêu cầu Cấp độ ${title.requiredLevel}`}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 leading-snug">{title.desc}</p>
                      </div>

                      <button
                        disabled={!isUnlocked || isEquipped}
                        onClick={() => equipTitle(title.id)}
                        className={`w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold mt-3 sm:mt-0 transition-all active:scale-95 ${
                          isEquipped 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 cursor-default' 
                            : isUnlocked 
                              ? 'bg-pink-500 hover:bg-pink-600 text-white shadow-md' 
                              : 'bg-zinc-700 text-zinc-550 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        {isEquipped ? 'Đang dùng' : 'Trang bị'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        );
      })()}

      {/* Tab Personalization */}
      {activeTab === 'personalization' && (
        <div className="space-y-6 text-left">
          
          {/* Sub-tabs Navigation */}
          <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
            <button
              onClick={() => { playSound.click(); setActivePersonalizationSubTab('character'); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activePersonalizationSubTab === 'character'
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25'
                  : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <User className="w-4 h-4" />
              Tạo Nhân Vật (Chibi Maker)
            </button>
            <button
              onClick={() => { playSound.click(); setActivePersonalizationSubTab('shop_gacha'); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activePersonalizationSubTab === 'shop_gacha'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Cửa Hàng & Gacha Lượng Tử 🔮
            </button>
            <button
              onClick={() => { playSound.click(); setActivePersonalizationSubTab('background_rewards'); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activePersonalizationSubTab === 'background_rewards'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                  : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Gift className="w-4 h-4" />
              Nền Cổng & Quà Level 🎁
            </button>
            <button
              onClick={() => { playSound.click(); setActivePersonalizationSubTab('upload_avatar'); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activePersonalizationSubTab === 'upload_avatar'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              Tải Ảnh Đại Diện Lên 📷
            </button>
          </div>

          {/* Sub-tab 1: Character Creator */}
          {activePersonalizationSubTab === 'character' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Cột trái: Hologram Preview */}
              <div className="lg:col-span-5 lg:sticky lg:top-24 bg-[#2a2c3a] border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Xem trước tạo hình</h4>

                {/* Bong bóng thoại tương tác của Chibi */}
                <div className={`transition-all duration-300 w-full flex justify-center mb-2 min-h-[48px] ${speechBubbleText ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                  <div className="relative bg-zinc-900/90 border border-pink-500/40 rounded-2xl px-4 py-2.5 text-xs text-pink-300 max-w-[240px] text-center shadow-lg backdrop-blur-md font-sans">
                    {speechBubbleText}
                    {/* Arrow pointing down */}
                    <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-zinc-900 border-r border-b border-pink-500/40 rotate-45" />
                  </div>
                </div>
                
                {/* Hologram Glass Box */}
                <div 
                  onClick={triggerSpeechBubble}
                  title="Click vào để tương tác với Chibi!"
                  className="w-56 h-56 rounded-2xl bg-gradient-to-b from-white/5 to-white/0 border border-white/10 flex items-center justify-center p-4 relative shadow-2xl backdrop-blur-sm cursor-pointer hover:border-cyan-400/30 transition-all active:scale-98"
                >
                  {/* Quantum Particles for Dance effect */}
                  <QuantumParticlesCanvas active={isDancing} color="#f472b6" />
                  
                  {/* Neon laser corners */}
                  <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
                  <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
                  
                  <div className={`transition-all duration-300 ${isDancing ? 'animate-bounce' : ''}`}>
                    <STEMAvatarSVG 
                      parts={tempAvatarParts} 
                      className={`w-48 h-48 drop-shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-transform duration-300 ${
                        isFlipped ? 'scale-x-[-1]' : 'scale-x-[1]'
                      }`} 
                    />
                  </div>
                </div>

                {/* Các nút tương tác Chibi lượng tử */}
                <div className="flex gap-2 w-full mt-4 justify-center">
                  <button
                    onClick={triggerSpeechBubble}
                    className="px-3.5 py-2 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold border border-white/5 transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <span>💬 Nói chuyện</span>
                  </button>
                  <button
                    onClick={handleDance}
                    disabled={isDancing}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center gap-1.5 ${
                      isDancing 
                        ? 'bg-pink-500/20 border-pink-500 text-pink-400' 
                        : 'bg-zinc-800/80 hover:bg-zinc-800 border-white/5 text-zinc-300'
                    }`}
                  >
                    <span>💃 Nhảy múa</span>
                  </button>
                  <button
                    onClick={() => { playSound.click(); setIsFlipped(!isFlipped); }}
                    className="px-3.5 py-2 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold border border-white/5 transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <span>🔄 Xoay lật</span>
                  </button>
                </div>

                <p className="text-[10px] text-zinc-500 text-center mt-4 leading-snug px-4">
                  Bạn có thể chọn thử mọi trang phục. Để lưu làm ảnh đại diện chính thức, hãy bấm nút đồng bộ bên dưới.
                </p>

                <button
                  onClick={handleEquipAvatarParts}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all active:scale-95 shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Đồng bộ Avatar đại diện
                </button>
              </div>

              {/* Cột phải: Customize Parts Panels */}
              <div className="lg:col-span-7 bg-[#2a2c3a] border border-white/5 rounded-3xl p-6 space-y-6">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  Tự thiết kế từng bộ phận cơ thể & thời trang
                </h4>

                {/* BỘ CHỌN THỂ HÌNH VÀ GIỚI TÍNH */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-white/5">
                  {/* GIỚI TÍNH */}
                  <div>
                    <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Giới tính</h5>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          playSound.click();
                          setTempAvatarParts(prev => {
                            const nextParts = { ...prev, gender: 'male' };
                            // Tự động kiểm tra độ tương thích của tóc và trang phục
                            const hairItem = ALL_COSMETICS.find(c => c.category === 'hair' && c.value === prev.hair);
                            const topItem = ALL_COSMETICS.find(c => c.category === 'top' && c.value === prev.top);
                            const bottomItem = ALL_COSMETICS.find(c => c.category === 'bottom' && c.value === prev.bottom);
                            if (hairItem && hairItem.genderTarget === 'female') nextParts.hair = 'default';
                            if (topItem && topItem.genderTarget === 'female') nextParts.top = 'default';
                            if (bottomItem && bottomItem.genderTarget === 'female') nextParts.bottom = 'default';
                            return nextParts;
                          });
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          tempAvatarParts.gender === 'male'
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                            : 'bg-zinc-800/60 border-white/5 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Nam 🧑
                      </button>
                      <button
                        onClick={() => {
                          playSound.click();
                          setTempAvatarParts(prev => {
                            const nextParts = { ...prev, gender: 'female' };
                            const hairItem = ALL_COSMETICS.find(c => c.category === 'hair' && c.value === prev.hair);
                            const topItem = ALL_COSMETICS.find(c => c.category === 'top' && c.value === prev.top);
                            const bottomItem = ALL_COSMETICS.find(c => c.category === 'bottom' && c.value === prev.bottom);
                            if (hairItem && hairItem.genderTarget === 'male') nextParts.hair = 'default';
                            if (topItem && topItem.genderTarget === 'male') nextParts.top = 'default';
                            if (bottomItem && bottomItem.genderTarget === 'male') nextParts.bottom = 'default';
                            return nextParts;
                          });
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          tempAvatarParts.gender === 'female'
                            ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                            : 'bg-zinc-800/60 border-white/5 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Nữ 👧
                      </button>
                    </div>
                  </div>

                  {/* THỂ HÌNH */}
                  <div>
                    <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Kiểu cơ thể</h5>
                    <div className="flex gap-1.5">
                      {[
                        { id: 'chibi', label: 'Chibi 🧸' },
                        { id: 'tall', label: 'Cao 🕴️' },
                        { id: 'muscular', label: 'Cơ bắp 💪' }
                      ].map(bt => (
                        <button
                          key={bt.id}
                          onClick={() => {
                            playSound.click();
                            setTempAvatarParts(prev => ({ ...prev, bodyType: bt.id }));
                          }}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all active:scale-95 ${
                            tempAvatarParts.bodyType === bt.id
                              ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                              : 'bg-zinc-800/60 border-white/5 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {bt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* TẠO DÁNG */}
                  <div>
                    <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Tạo dáng</h5>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'standard', label: 'Chuẩn 🧍' },
                        { id: 'wave', label: 'Chào 👋' },
                        { id: 'thinker', label: 'Nghĩ 🧠' },
                        { id: 'victory', label: 'Thắng ✌️' },
                        { id: 'walk', label: 'Đi bộ 🏃' },
                        { id: 'heart', label: 'Bắn tim 💖' },
                        { id: 'super', label: 'Bay cao 🦸' },
                        { id: 'spark', label: 'Bắn sét ⚡' }
                      ].map(ps => (
                        <button
                          key={ps.id}
                          onClick={() => {
                            playSound.click();
                            setTempAvatarParts(prev => ({ ...prev, pose: ps.id }));
                          }}
                          className={`py-1.5 rounded-lg text-[8px] font-bold border transition-all text-center active:scale-95 ${
                            tempAvatarParts.pose === ps.id
                              ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm shadow-amber-500/15'
                              : 'bg-zinc-800/60 border-white/5 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {ps.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 1. MÀU DA */}
                <div>
                  <h5 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-2.5">1. Lớp da sinh học (Body)</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {/* Peach mặc định */}
                    <button
                      onClick={() => { playSound.click(); setTempAvatarParts(prev => ({ ...prev, body: 'peach' })); }}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all active:scale-95 text-center flex flex-col items-center gap-1 ${
                        tempAvatarParts.body === 'peach'
                          ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                          : 'bg-zinc-800/40 border-white/5 text-zinc-300'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-[#ffd1b3] border border-white/10" />
                      <span>Hồng Đào</span>
                    </button>
                    {/* Các màu da khác */}
                    {ALL_COSMETICS.filter(c => c.category === 'body' && (c.genderTarget === 'unisex' || c.genderTarget === tempAvatarParts.gender)).map((item) => {
                      const isUnlocked = (personalization.unlockedParts || []).includes(item.id) || (user && (user.displayName === 'admin' || user.email?.includes('admin')));
                      const isSelected = tempAvatarParts.body === item.value;
                      return (
                        <button
                          key={item.id}
                          disabled={!isUnlocked}
                          title={!isUnlocked ? "Vật phẩm đang khóa! Hãy quay Gacha hoặc mua tại Cửa Hàng để mở khóa." : ""}
                          onClick={() => {
                            playSound.click();
                            setTempAvatarParts(prev => ({ ...prev, body: item.value }));
                          }}
                          className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all text-center flex flex-col items-center gap-1 relative ${
                            isSelected
                              ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                              : isUnlocked
                              ? 'bg-zinc-800/40 border-white/5 text-zinc-300 active:scale-95'
                              : 'bg-zinc-900/60 border-white/5 text-zinc-600 opacity-55 cursor-not-allowed'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: skinColors[item.value] }} />
                          <span className="truncate w-full">{item.name.replace('Màu da ', '')}</span>
                          {!isUnlocked && (
                            <span className="absolute top-1 right-1 text-[8px] bg-zinc-900/90 text-amber-400 p-0.5 rounded">🔒</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. KIỂU TÓC & MÀU TÓC */}
                <div className="border-t border-white/5 pt-5 space-y-4">
                  <div>
                    <h5 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-2.5">2. Kiểu tóc lượng tử (Hair)</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {/* Tóc mặc định */}
                      <button
                        onClick={() => { playSound.click(); setTempAvatarParts(prev => ({ ...prev, hair: 'default' })); }}
                        className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all active:scale-95 text-center flex flex-col items-center gap-1 ${
                          tempAvatarParts.hair === 'default'
                            ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                            : 'bg-zinc-800/40 border-white/5 text-zinc-300'
                        }`}
                      >
                        <span>Cơ Bản</span>
                      </button>
                      {/* Các kiểu tóc khác */}
                      {ALL_COSMETICS.filter(c => c.category === 'hair' && (c.genderTarget === 'unisex' || c.genderTarget === tempAvatarParts.gender)).map((item) => {
                        const isUnlocked = (personalization.unlockedParts || []).includes(item.id) || (user && (user.displayName === 'admin' || user.email?.includes('admin')));
                        const isSelected = tempAvatarParts.hair === item.value;
                        return (
                          <button
                            key={item.id}
                            disabled={!isUnlocked}
                            title={!isUnlocked ? "Vật phẩm đang khóa! Hãy quay Gacha hoặc mua tại Cửa Hàng để mở khóa." : ""}
                            onClick={() => {
                              playSound.click();
                              setTempAvatarParts(prev => ({ ...prev, hair: item.value }));
                            }}
                            className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all text-center flex flex-col items-center gap-1 relative ${
                              isSelected
                                ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                                : isUnlocked
                                ? 'bg-zinc-800/40 border-white/5 text-zinc-300 active:scale-95'
                                : 'bg-zinc-900/60 border-white/5 text-zinc-600 opacity-55 cursor-not-allowed'
                            }`}
                          >
                            <span className="truncate w-full">{item.name.replace('Tóc ', '')}</span>
                            {!isUnlocked && (
                              <span className="absolute top-1 right-1 text-[8px] bg-zinc-900/90 text-amber-400 p-0.5 rounded">🔒</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2">Chọn màu nhuộm tóc</h5>
                    <div className="flex flex-wrap gap-2.5">
                      {HAIR_COLORS.map((hc) => (
                        <button
                          key={hc.id}
                          onClick={() => { playSound.click(); setTempAvatarParts(prev => ({ ...prev, hairColor: hc.id })); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all active:scale-95 ${
                            tempAvatarParts.hairColor === hc.id
                              ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                              : 'border-white/5 bg-zinc-800/40 text-zinc-400'
                          }`}
                        >
                          <span className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: hc.hex }} />
                          {hc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. TRANG PHỤC (ÁO & QUẦN) */}
                <div className="border-t border-white/5 pt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ÁO */}
                  <div>
                    <h5 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-2.5">3. Trang phục Thượng y (Top)</h5>
                    <div className="space-y-2">
                      {/* Mặc định */}
                      <button
                        onClick={() => { playSound.click(); setTempAvatarParts(prev => ({ ...prev, top: 'default' })); }}
                        className={`w-full px-3 py-2 rounded-xl text-[11px] font-bold border transition-all active:scale-95 text-left flex justify-between items-center ${
                          tempAvatarParts.top === 'default'
                            ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                            : 'bg-zinc-800/40 border-white/5 text-zinc-300'
                        }`}
                      >
                        <span>Áo Thun STEM cơ bản</span>
                        <span className="text-[10px] text-zinc-500">Mặc định</span>
                      </button>
                      {/* Mở rộng */}
                      {ALL_COSMETICS.filter(c => c.category === 'top' && (c.genderTarget === 'unisex' || c.genderTarget === tempAvatarParts.gender)).map((item) => {
                        const isUnlocked = (personalization.unlockedParts || []).includes(item.id) || (user && (user.displayName === 'admin' || user.email?.includes('admin')));
                        const isSelected = tempAvatarParts.top === item.value;
                        return (
                          <button
                            key={item.id}
                            disabled={!isUnlocked}
                            title={!isUnlocked ? "Vật phẩm đang khóa! Hãy quay Gacha hoặc mua tại Cửa Hàng để mở khóa." : ""}
                            onClick={() => {
                              playSound.click();
                              setTempAvatarParts(prev => ({ ...prev, top: item.value }));
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-[11px] font-bold border transition-all text-left flex justify-between items-center ${
                              isSelected
                                ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                                : isUnlocked
                                ? 'bg-zinc-800/40 border-white/5 text-zinc-300 active:scale-95'
                                : 'bg-zinc-900/60 border-white/5 text-zinc-600 opacity-55 cursor-not-allowed'
                            }`}
                          >
                            <span>{item.name}</span>
                            {!isUnlocked && (
                              <span className="text-[10px] text-amber-400 flex items-center gap-1">🔒 Khóa</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* QUẦN */}
                  <div>
                    <h5 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-2.5">4. Trang phục Hạ y (Bottom)</h5>
                    <div className="space-y-2">
                      {/* Mặc định */}
                      <button
                        onClick={() => { playSound.click(); setTempAvatarParts(prev => ({ ...prev, bottom: 'default' })); }}
                        className={`w-full px-3 py-2 rounded-xl text-[11px] font-bold border transition-all active:scale-95 text-left flex justify-between items-center ${
                          tempAvatarParts.bottom === 'default'
                            ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                            : 'bg-zinc-800/40 border-white/5 text-zinc-300'
                        }`}
                      >
                        <span>Quần Jeans cơ bản</span>
                        <span className="text-[10px] text-zinc-500">Mặc định</span>
                      </button>
                      {/* Mở rộng */}
                      {ALL_COSMETICS.filter(c => c.category === 'bottom' && (c.genderTarget === 'unisex' || c.genderTarget === tempAvatarParts.gender)).map((item) => {
                        const isUnlocked = (personalization.unlockedParts || []).includes(item.id) || (user && (user.displayName === 'admin' || user.email?.includes('admin')));
                        const isSelected = tempAvatarParts.bottom === item.value;
                        return (
                          <button
                            key={item.id}
                            disabled={!isUnlocked}
                            title={!isUnlocked ? "Vật phẩm đang khóa! Hãy quay Gacha hoặc mua tại Cửa Hàng để mở khóa." : ""}
                            onClick={() => {
                              playSound.click();
                              setTempAvatarParts(prev => ({ ...prev, bottom: item.value }));
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-[11px] font-bold border transition-all text-left flex justify-between items-center ${
                              isSelected
                                ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                                : isUnlocked
                                ? 'bg-zinc-800/40 border-white/5 text-zinc-300 active:scale-95'
                                : 'bg-zinc-900/60 border-white/5 text-zinc-600 opacity-55 cursor-not-allowed'
                            }`}
                          >
                            <span>{item.name}</span>
                            {!isUnlocked && (
                              <span className="text-[10px] text-amber-400 flex items-center gap-1">🔒 Khóa</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 4. PHỤ KIỆN */}
                <div className="border-t border-white/5 pt-5">
                  <h5 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-2.5">4. Phụ kiện lượng tử (Accessory)</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Không đeo */}
                    <button
                      onClick={() => { playSound.click(); setTempAvatarParts(prev => ({ ...prev, accessory: 'none' })); }}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all active:scale-95 text-center flex flex-col items-center justify-center min-h-[46px] ${
                        tempAvatarParts.accessory === 'none'
                          ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                          : 'bg-zinc-800/40 border-white/5 text-zinc-300'
                      }`}
                    >
                      Không đeo
                    </button>
                    {/* Các phụ kiện khác */}
                    {ALL_COSMETICS.filter(c => c.category === 'accessory' && (c.genderTarget === 'unisex' || c.genderTarget === tempAvatarParts.gender)).map((item) => {
                      const isUnlocked = (personalization.unlockedParts || []).includes(item.id) || (user && (user.displayName === 'admin' || user.email?.includes('admin')));
                      const isSelected = tempAvatarParts.accessory === item.value;
                      return (
                        <button
                          key={item.id}
                          disabled={!isUnlocked}
                          title={!isUnlocked ? "Vật phẩm đang khóa! Hãy quay Gacha hoặc mua tại Cửa Hàng để mở khóa." : ""}
                          onClick={() => {
                            playSound.click();
                            setTempAvatarParts(prev => ({ ...prev, accessory: item.value }));
                          }}
                          className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all text-center flex flex-col items-center justify-center min-h-[46px] relative ${
                            isSelected
                              ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                              : isUnlocked
                              ? 'bg-zinc-800/40 border-white/5 text-zinc-300 active:scale-95'
                              : 'bg-zinc-900/60 border-white/5 text-zinc-600 opacity-55 cursor-not-allowed'
                          }`}
                        >
                          <span className="truncate w-full">{item.name.replace('Kính Thực Tế Ảo ', '')}</span>
                          {!isUnlocked && (
                            <span className="absolute top-1 right-1 text-[8px] bg-zinc-900/90 text-amber-400 p-0.5 rounded">🔒</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Sub-tab 2: Shop & Gacha */}
          {activePersonalizationSubTab === 'shop_gacha' && (
            <div className="space-y-6">
              
              {/* Crystals wallet display bar */}
              <div className="bg-[#2a2c3a] border border-purple-500/20 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-3xl animate-bounce">
                    🔮
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Số dư Pha lê Lượng tử của bạn</h4>
                    <p className="text-xs text-zinc-400 leading-snug">Dùng Pha lê để mở khóa các trang phục độc quyền hiếm có trong shop hoặc quay Gacha vận may.</p>
                  </div>
                </div>
                <div className="px-6 py-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 dark:text-purple-300 rounded-2xl text-2xl font-black font-sans flex items-center justify-center gap-2 self-start sm:self-auto shadow-inner">
                  <span>🔮</span>
                  <span>{personalization.crystals !== undefined ? personalization.crystals : 500}</span>
                </div>
              </div>

              {shopSuccessMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-2xl text-xs font-bold animate-pulse text-center">
                  {shopSuccessMsg}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Máy quay Gacha */}
                <div className="lg:col-span-5 bg-[#2a2c3a] border border-white/5 rounded-3xl p-6 flex flex-col items-between justify-between relative overflow-hidden text-center min-h-[490px]">
                  <div className="absolute -top-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="w-full">
                    <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-6">Máy Gacha Lượng Tử</h4>

                    {/* Vòng quay Neon cầu Gacha */}
                    <div className="relative w-40 h-40 flex items-center justify-center mb-6 mx-auto">
                      <div className={`absolute inset-0 rounded-full border-4 border-dashed border-purple-500/30 ${isRolling ? 'animate-spin border-purple-500' : ''}`} />
                      <div className={`absolute w-32 h-32 rounded-full bg-gradient-to-tr from-purple-600/20 via-pink-600/10 to-cyan-500/10 flex items-center justify-center border border-white/10 shadow-2xl ${isRolling ? 'scale-110 blur-[1px]' : 'scale-100 hover:scale-105 transition-all duration-300'}`}>
                        {isRolling ? (
                          <div className="text-3xl animate-bounce">🧬</div>
                        ) : (
                          <div className="text-4xl drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse select-none">🔮</div>
                        )}
                      </div>
                    </div>

                    {gachaError && (
                      <div className="text-xs font-bold text-rose-400 mb-4 px-2">{gachaError}</div>
                    )}

                    <div className="grid grid-cols-2 gap-3 w-full">
                      <button
                        disabled={isRolling}
                        onClick={() => handleSpinGacha(1)}
                        className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg border ${
                          isRolling
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border-white/5'
                            : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 border-purple-500/20 text-white shadow-purple-500/10'
                        }`}
                      >
                        Quay x1 (100 🔮)
                      </button>
                      <button
                        disabled={isRolling}
                        onClick={() => handleSpinGacha(10)}
                        className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg border ${
                          isRolling
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border-white/5'
                            : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 border-pink-500/20 text-white shadow-pink-500/10'
                        }`}
                      >
                        Quay x10 (900 🔮)
                      </button>
                    </div>
                    <p className="text-[8.5px] text-zinc-500 mt-3 leading-relaxed">
                      Mỗi lượt quay ngẫu nhiên mở khóa một trang phục hoặc danh hiệu quý hiếm bất kỳ. Quay x10 tiết kiệm 10% Pha lê!
                    </p>
                  </div>

                  {/* Danh sách vật phẩm hiếm có thể trúng (Showcase Gacha Pool) */}
                  <div className="w-full border-t border-white/5 pt-4 mt-6">
                    <h5 className="text-[9px] font-black text-zinc-400 dark:text-zinc-300 uppercase tracking-widest mb-3 flex items-center justify-center gap-1">
                      <span>✨</span> Vật phẩm cực hiếm có thể nhận
                    </h5>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar justify-start px-1 select-none">
                      {[
                        ...ALL_COSMETICS.filter(item => item.rarity === 'Legendary' || item.rarity === 'Epic'),
                        { id: 'quantum_master', name: 'Pháp sư Lượng tử 🔮', rarity: 'Legendary', type: 'title', desc: 'Điều khiển hạt siêu vị trí chính xác' }
                      ].map((item) => (
                        <div 
                          key={item.id}
                          className="shrink-0 w-16 p-2 rounded-xl bg-zinc-950/40 border border-white/5 flex flex-col items-center justify-between text-center relative group hover:border-purple-500/30 transition-all duration-300"
                        >
                          <span className={`text-[6px] font-black uppercase px-1 rounded ${
                            item.rarity === 'Legendary' ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {item.rarity}
                          </span>

                          <div className="my-1 flex items-center justify-center h-10 w-full">
                            {item.type === 'title' ? (
                              <span className="text-xl">🏆</span>
                            ) : (
                              <STEMAvatarSVG parts={getCosmeticPreviewParts(item)} className="w-10 h-10 transform scale-110" />
                            )}
                          </div>
                          
                          <span className="text-[7.5px] font-bold text-zinc-400 w-full truncate leading-tight">{item.name.replace('Màu da ', '').replace('Tóc ', '').replace('Giáp ', '').replace('Choàng ', '').replace('Chân ', '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Cosmetics Shop */}
                <div className="lg:col-span-7 bg-[#2a2c3a] border border-white/5 rounded-3xl p-6 min-h-[460px]">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    Cửa Hàng Mua Trực Tiếp (Cosmetics Shelf)
                  </h4>
                  
                  {/* Thanh chọn lọc phân loại danh mục */}
                  <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-2 custom-scrollbar select-none">
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'body', label: 'Màu da' },
                      { id: 'hair', label: 'Kiểu tóc' },
                      { id: 'top', label: 'Áo' },
                      { id: 'bottom', label: 'Quần' },
                      { id: 'accessory', label: 'Phụ kiện' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          playSound.click();
                          setSelectedCategoryFilter(tab.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all active:scale-95 shrink-0 border ${
                          selectedCategoryFilter === tab.id
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/10'
                            : 'bg-zinc-800/40 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800/60'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Bộ lọc giới tính */}
                  <div className="flex items-center gap-1.5 mb-4 select-none">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider font-mono mr-1">GIỚI TÍNH:</span>
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'male', label: 'Nam ♂' },
                      { id: 'female', label: 'Nữ ♀' }
                    ].map((g) => (
                      <button
                        key={g.id}
                        onClick={() => {
                          playSound.click();
                          setSelectedGenderFilter(g.id);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all active:scale-95 border ${
                          selectedGenderFilter === g.id
                            ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-sm shadow-pink-500/10'
                            : 'bg-zinc-800/30 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800/50'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {ALL_COSMETICS
                      .filter(item => selectedCategoryFilter === 'all' || item.category === selectedCategoryFilter)
                      .filter(item => {
                        if (selectedGenderFilter === 'all') return true;
                        if (selectedGenderFilter === 'male') {
                          return item.genderTarget === 'male' || item.genderTarget === 'unisex';
                        }
                        if (selectedGenderFilter === 'female') {
                          return item.genderTarget === 'female' || item.genderTarget === 'unisex';
                        }
                        return true;
                      })
                      .map((item) => {
                        const isUnlocked = (personalization.unlockedParts || []).includes(item.id) || (user && (user.displayName === 'admin' || user.email?.includes('admin')));
                      
                      // Sinh parts cho preview
                      const previewParts = {
                        gender: 'male',
                        bodyType: 'chibi',
                        pose: 'standard',
                        body: item.category === 'body' ? item.value : 'peach',
                        hair: item.category === 'hair' ? item.value : 'none',
                        hairColor: 'neon_pink',
                        top: item.category === 'top' ? item.value : 'none',
                        bottom: item.category === 'bottom' ? item.value : 'none',
                        accessory: item.category === 'accessory' ? item.value : 'none'
                      };

                      return (
                        <div
                          key={item.id}
                          className={`bg-[#1c1e29]/50 border rounded-2xl p-3.5 flex gap-4 transition-all relative items-center ${
                            isUnlocked 
                              ? 'border-white/5 opacity-60' 
                              : 'border-white/10 hover:border-purple-500/30'
                          }`}
                        >
                          {/* Cột trái: Hình ảnh demo preview lượng tử */}
                          <div className="w-16 h-16 bg-[#14151f]/90 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center shrink-0 relative select-none">
                            {item.category === 'body' ? (
                              <div className="w-full h-full flex flex-col items-center justify-center p-1">
                                <div 
                                  className="w-4 h-4 rounded-full border border-white/20 mb-1 shrink-0" 
                                  style={{ backgroundColor: skinColors[item.value] || item.value }} 
                                />
                                <div className="w-8 h-8 overflow-hidden">
                                  <STEMAvatarSVG 
                                    parts={previewParts} 
                                    className="w-full h-full transform scale-[1.9] translate-y-[25%]" 
                                  />
                                </div>
                              </div>
                            ) : item.category === 'hair' ? (
                              <div className="w-12 h-12 overflow-hidden">
                                <STEMAvatarSVG 
                                  parts={previewParts} 
                                  className="w-full h-full transform scale-[1.9] translate-y-[20%]" 
                                />
                              </div>
                            ) : item.category === 'top' ? (
                              <div className="w-12 h-12 overflow-hidden">
                                <STEMAvatarSVG 
                                  parts={previewParts} 
                                  className="w-full h-full transform scale-[1.7] translate-y-[-10%]" 
                                />
                              </div>
                            ) : item.category === 'bottom' ? (
                              <div className="w-12 h-12 overflow-hidden">
                                <STEMAvatarSVG 
                                  parts={previewParts} 
                                  className="w-full h-full transform scale-[1.8] translate-y-[-32%]" 
                                />
                              </div>
                            ) : (
                              // Accessory
                              <div className="w-12 h-12 overflow-hidden">
                                <STEMAvatarSVG 
                                  parts={previewParts} 
                                  className="w-full h-full transform scale-[2.2] translate-y-[25%]" 
                                />
                              </div>
                            )}
                          </div>

                          {/* Cột phải: Nội dung thông tin vật phẩm */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between flex-1 gap-3">
                            <div className="text-left flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-white">{item.name}</span>
                                <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded shrink-0 select-none ${
                                  item.rarity === 'Legendary' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' :
                                  item.rarity === 'Epic' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/10' :
                                  'bg-blue-500/10 text-blue-400 border border-blue-500/10'
                                }`}>
                                  {item.rarity}
                                </span>
                              </div>
                              <div className="text-[10px] text-zinc-400 mt-1 leading-snug">{item.desc}</div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-2 md:pt-0">
                              <span className="text-xs font-bold text-purple-450 dark:text-purple-400 flex items-center gap-0.5 select-none font-mono">
                                <span>🔮</span>
                                <span>{item.price}</span>
                              </span>

                              {isUnlocked ? (
                                <span className="text-[9px] font-bold text-zinc-500 bg-[#1c1e29] px-3 py-1.5 rounded-lg border border-white/5 select-none font-mono">
                                  Đã sở hữu ✔️
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleBuyCosmetic(item)}
                                  className="px-3.5 py-1.5 bg-purple-500 hover:bg-purple-600 active:scale-95 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all shadow-md shadow-purple-500/10"
                                >
                                  Mua ngay
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Sub-tab 3: Backgrounds & Level Rewards */}
          {activePersonalizationSubTab === 'background_rewards' && (
            <div className="space-y-8">
              
              {/* PHẦN 1: QUÀ TẶNG THĂNG CẤP MỖI 10 LEVEL */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-400" /> Quà tặng cột mốc Cấp độ (Level Rewards)
                </h3>
                
                {rewardsSuccessMsg && (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-2xl text-xs font-bold mb-4 text-center animate-pulse">
                    {rewardsSuccessMsg}
                  </div>
                )}

                <div className="bg-[#2a2c3a] border border-white/5 rounded-3xl p-6 space-y-6">
                  {/* Current Level progress indicator */}
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-400 border-b border-white/5 pb-4">
                    <span>Cấp độ hiện tại: <span className="text-white text-sm font-black">Level {personalization.level || 1}</span></span>
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20 animate-pulse">
                      Tự động mở khóa rương khi lên mỗi 10 Level!
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* MỐC 10 */}
                    {[10, 20, 30].map((milestone) => {
                      const currentLevel = personalization.level || 1;
                      const hasClaimed = (personalization.claimedMilestones || []).includes(milestone);
                      const canClaim = (currentLevel >= milestone || (user && (user.displayName === 'admin' || user.email?.includes('admin')))) && !hasClaimed;
                      
                      let giftLabel = '';
                      let giftDesc = '';
                      if (milestone === 10) {
                        giftLabel = 'Hộp quà Titan';
                        giftDesc = 'Tặng Khung Avatar "Huyền thoại Vàng" ✨ + 500 Pha lê lượng tử 🔮';
                      } else if (milestone === 20) {
                        giftLabel = 'Hộp quà Tinh Vân';
                        giftDesc = 'Tặng Khung Avatar "Bão lửa Neon" 🔥 + 500 Pha lê lượng tử 🔮';
                      } else if (milestone === 30) {
                        giftLabel = 'Rương Thần Thoại';
                        giftDesc = 'Tặng Danh hiệu "Đấng kiến tạo Không gian" 🌌 + 500 Pha lê lượng tử 🔮';
                      }

                      return (
                        <div 
                          key={milestone}
                          className={`border rounded-2xl p-5 flex flex-col justify-between text-center relative overflow-hidden transition-all ${
                            hasClaimed 
                              ? 'border-emerald-500/20 bg-emerald-500/5 opacity-80'
                              : canClaim
                                ? 'border-amber-400 bg-amber-500/5 shadow-[0_0_15px_rgba(251,191,36,0.15)] scale-105 z-10'
                                : 'border-white/5 bg-[#1c1e29]/30 opacity-60'
                          }`}
                        >
                          {/* Chest Icon */}
                          <div className="text-4xl mb-3">
                            {hasClaimed ? '🔓' : canClaim ? '🎁' : '🔒'}
                          </div>

                          <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-wider">{giftLabel}</h4>
                            <p className="text-[10px] text-zinc-400 mt-1 leading-snug px-2">{giftDesc}</p>
                            <div className="text-[9px] text-zinc-500 mt-2">Đạt Level {milestone} để nhận</div>
                          </div>

                          <div className="mt-5 pt-3 border-t border-white/5">
                            {hasClaimed ? (
                              <span className="w-full block py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl select-none">
                                Đã nhận ✔️
                              </span>
                            ) : canClaim ? (
                              <button
                                onClick={() => handleClaimMilestone(milestone)}
                                className="w-full py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-zinc-900 text-xs font-black rounded-xl transition-all active:scale-95 shadow-md shadow-amber-400/20 animate-pulse"
                              >
                                Nhận quà 🎁
                              </button>
                            ) : (
                              <span className="w-full block py-2 bg-zinc-800 text-zinc-500 text-xs font-bold rounded-xl select-none">
                                Chưa đạt cấp
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* PHẦN 2: HÌNH NỀN CỔNG THÔNG TIN */}
              <div className="border-t border-white/5 pt-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-400" /> Hình nền cổng thông tin
                </h3>
                <div className="bg-[#2a2c3a] border border-white/5 rounded-3xl p-6 space-y-6">
                  
                  {/* Predefined background options */}
                  <div>
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Hình nền mẫu sẵn có</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                      {predefinedBgs.map((bg) => {
                        const isSelected = (personalization.bgImage || '') === bg.url;
                        const userElo = personalization.elo || 0;
                        const isLocked = bg.requiredElo && userElo < bg.requiredElo && !(user && (user.displayName === 'admin' || user.email?.includes('admin')));

                        const handleSelectBg = () => {
                          if (isLocked) {
                            playSound.hover();
                            alert(`🔒 Hình nền yêu cầu thành tích cao hơn! Bạn cần đạt tối thiểu ${bg.requiredElo} ELO đấu trường để mở khóa.`);
                            return;
                          }
                          updateBgImage(bg.url);
                        };

                        return (
                          <button
                            key={bg.id}
                            onClick={handleSelectBg}
                            className={`group relative rounded-2xl overflow-hidden aspect-video border-2 transition-all ${
                              isLocked ? 'opacity-65 cursor-not-allowed border-zinc-800' : 'active:scale-95'
                            } ${
                              isSelected ? 'border-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.35)] scale-105' : isLocked ? 'border-zinc-800/40' : 'border-white/5 hover:border-white/20'
                            }`}
                          >
                            {bg.preview || bg.url ? (
                              <img 
                                src={bg.preview || bg.url} 
                                alt={bg.name} 
                                className={`w-full h-full object-cover transition-transform duration-500 ${
                                  isLocked ? 'filter grayscale blur-[1px]' : 'group-hover:scale-110'
                                }`} 
                              />
                            ) : (
                              <div className="w-full h-full bg-[#1c1e29] flex items-center justify-center text-xs font-semibold text-zinc-500">
                                Mặc định
                              </div>
                            )}
                            
                            {/* Gradient overlay with name and unlock status */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent flex flex-col justify-end p-2 text-left z-10">
                              <span className="text-[10px] font-bold text-white tracking-wide truncate">{bg.name}</span>
                              {bg.requiredElo > 0 && (
                                <span className="text-[8px] font-mono text-zinc-400 mt-0.5">
                                  {isLocked ? `🔒 Cần ${bg.requiredElo} ELO` : `✓ Đã mở khóa`}
                                </span>
                              )}
                            </div>

                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 bg-pink-500 text-white rounded-full p-0.5 z-20 shadow-md">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </div>
                            )}

                            {isLocked && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 backdrop-blur-[0.5px]">
                                <Lock className="w-5 h-5 text-zinc-400" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Image Upload & URL input */}
                  <div className="border-t border-white/5 pt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Upload Section */}
                    <div className="bg-[#1c1e29]/40 border border-white/5 rounded-2xl p-5 text-left flex flex-col justify-between">
                      <div>
                        <h5 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-1">Tải lên ảnh từ máy tính</h5>
                        <p className="text-[10px] text-zinc-500 leading-snug">Hệ thống sẽ tự động tối ưu dung lượng hình ảnh để lưu trữ ổn định.</p>
                      </div>
                      <label className="mt-4 flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-pink-500/35 rounded-2xl p-5 cursor-pointer bg-[#1c1e29]/20 transition-all hover:bg-[#1c1e29]/40 group">
                        <Upload className="w-6 h-6 text-zinc-500 group-hover:text-pink-400 group-hover:scale-110 transition-all mb-2" />
                        <span className="text-[11px] font-bold text-zinc-400 group-hover:text-zinc-300">Chọn tệp hình ảnh...</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleFileUpload} 
                        />
                      </label>
                    </div>

                    {/* Custom URL input */}
                    <div className="bg-[#1c1e29]/40 border border-white/5 rounded-2xl p-5 text-left flex flex-col justify-between">
                      <div>
                        <h5 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-1">Hoặc sử dụng liên kết ảnh (URL)</h5>
                        <p className="text-[10px] text-zinc-500 leading-snug">Dán liên kết hình ảnh trực tiếp từ Google hoặc bất kỳ trang web chia sẻ ảnh nào.</p>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <input 
                          type="text" 
                          placeholder="https://example.com/background.jpg" 
                          value={customUrlInput}
                          onChange={(e) => setCustomUrlInput(e.target.value)}
                          className="flex-1 bg-[#1c1e29] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500/50"
                        />
                        <button
                          onClick={handleApplyUrl}
                          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-md shadow-pink-500/10"
                        >
                          Áp dụng
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* Sub-tab: Upload Custom Avatar */}
          {activePersonalizationSubTab === 'upload_avatar' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Cột trái: Hologram Preview của Avatar hiện tại */}
              <div className="lg:col-span-5 bg-[#2a2c3a] border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6">Ảnh đại diện hiện tại</h4>
                
                {/* Hologram Glass Box */}
                <div className="w-56 h-56 rounded-2xl bg-gradient-to-b from-white/5 to-white/0 border border-white/10 flex items-center justify-center p-4 relative shadow-2xl backdrop-blur-sm">
                  {/* Neon laser corners */}
                  <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-pink-500" />
                  <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-pink-500" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-pink-500" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-pink-500" />
                  
                  <div className="relative w-40 h-40">
                    <AvatarFrame frame={personalization.avatarFrame} className="w-full h-full text-5xl">
                      {personalization.avatarUrl === 'custom-avatar' ? (
                        <STEMAvatarSVG parts={personalization.avatarParts} className="w-full h-full transform scale-90" />
                      ) : personalization.avatarUrl ? (
                        personalization.avatarUrl.startsWith('http') || personalization.avatarUrl.startsWith('data:image/') ? (
                          <img 
                            src={personalization.avatarUrl} 
                            alt="Avatar" 
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a1a1aa'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
                            }}
                          />
                        ) : (
                          <span className="select-none text-6xl">{personalization.avatarUrl}</span>
                        )
                      ) : (
                        user.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-20 h-20 text-white" />
                      )}
                    </AvatarFrame>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1f212e] border border-white/5 text-zinc-400 font-mono uppercase tracking-wider">
                    {personalization.avatarUrl === 'custom-avatar' ? 'Nhân vật Chibi' : personalization.avatarUrl?.startsWith('data:') ? 'Ảnh tải lên từ thiết bị' : personalization.avatarUrl?.startsWith('http') ? 'Ảnh từ URL' : 'Biểu tượng có sẵn'}
                  </span>
                </div>

                <p className="text-[10px] text-zinc-450 dark:text-zinc-450 text-center mt-4 leading-snug px-4">
                  Ảnh đại diện của bạn sẽ hiển thị trên bảng xếp hạng ELO, thẻ PvP và danh sách bạn bè toàn game.
                </p>
              </div>

              {/* Cột phải: Các phương thức đổi ảnh */}
              <div className="lg:col-span-7 bg-[#2a2c3a] border border-white/5 rounded-3xl p-6 space-y-8">
                {/* 1. Tải ảnh từ thiết bị */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    Tải ảnh từ máy tính của bạn
                  </h4>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 hover:border-cyan-500/50 rounded-2xl p-6 transition-colors bg-zinc-900/30 group/upload relative overflow-hidden">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                    />
                    <Upload className="w-10 h-10 text-zinc-500 group-hover/upload:text-cyan-400 transition-colors mb-3" />
                    <p className="text-xs font-bold text-zinc-300">Nhấp hoặc kéo thả ảnh vào đây</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Hỗ trợ PNG, JPG, JPEG (Tự động nén và tối ưu hóa)</p>
                  </div>
                </div>

                {/* 2. Chọn biểu tượng có sẵn */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    Chọn biểu tượng Khoa học có sẵn
                  </h4>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    {predefinedAvatars.map((av) => (
                      <button
                        key={av.id}
                        onClick={() => updateAvatarUrl(av.url)}
                        title={av.name}
                        className={`aspect-square rounded-2xl flex items-center justify-center text-2xl border transition-all active:scale-95 ${
                          personalization.avatarUrl === av.url
                            ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/10'
                            : 'bg-zinc-900/40 border-white/5 hover:border-white/10 hover:bg-zinc-900/60'
                        }`}
                      >
                        {av.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Nhập liên kết ảnh */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Sử dụng liên kết ảnh (URL)
                  </h4>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="https://example.com/your-image.png"
                      value={customAvatarUrlInput}
                      onChange={(e) => setCustomAvatarUrlInput(e.target.value)}
                      className="flex-1 bg-zinc-900/60 border border-white/5 focus:border-amber-500/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition-all"
                    />
                    <button
                      onClick={handleApplyAvatarUrl}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-500/10"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Tab Achievements / Badges */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {badges.map((badge) => (
              <div 
                key={badge.id}
                className={`bg-[#2a2c3a] border rounded-3xl p-5 flex items-center gap-5 transition-all relative ${
                  badge.unlocked 
                    ? 'border-pink-500/10 hover:border-pink-500/25 shadow-md shadow-pink-500/5' 
                    : 'border-white/5 opacity-60'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 border border-white/5 shadow-inner ${
                  badge.unlocked ? 'bg-pink-500/10 border-pink-500/20' : 'bg-zinc-800 border-zinc-700'
                }`}>
                  {badge.unlocked ? badge.icon : <Star className="w-8 h-8 text-zinc-600" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-base font-bold ${badge.unlocked ? 'text-white' : 'text-zinc-500'}`}>
                      {badge.name}
                    </h4>
                    {badge.unlocked ? (
                      <span className="text-[9px] font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">Đạt được</span>
                    ) : (
                      <span className="text-[9px] font-bold text-zinc-500 bg-[#1c1e29] px-2 py-0.5 rounded-full border border-white/5">Chưa đạt</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-snug">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Settings / E-mail options */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-[#2a2c3a]/90 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-2xl space-y-8 relative">
            <div className="absolute inset-0 rounded-3xl bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-40" />
            
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Mail className="w-6 h-6 text-pink-500" /> Cấu hình Tài khoản E-mail
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Quản lý trạng thái xác minh, mật khẩu bảo mật và thay đổi thông tin liên lạc.</p>
            </div>

            {/* 1. Xác minh địa chỉ email */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#1c1e29]/50 border border-white/5 rounded-2xl relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Xác minh địa chỉ email</h4>
                  {(auth.currentUser?.emailVerified || auth.currentUser?.email?.toLowerCase() === 'admin123@gmail.com' || auth.currentUser?.email?.toLowerCase().startsWith('test')) ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/15 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Đã xác minh
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/15 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 animate-pulse" /> Chưa xác minh
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">Địa chỉ hiện tại: <strong className="text-white">{auth.currentUser?.email || user.email}</strong></p>
                <p className="text-[10px] text-zinc-500">Xác minh email giúp bảo mật tài khoản tốt hơn và nhận thông báo quan trọng.</p>
              </div>

              {(!auth.currentUser?.emailVerified && auth.currentUser?.email?.toLowerCase() !== 'admin123@gmail.com' && !auth.currentUser?.email?.toLowerCase().startsWith('test')) && (
                <button
                  onClick={handleSendVerification}
                  disabled={verifying}
                  className="px-5 py-2.5 bg-pink-500 hover:bg-pink-600 disabled:bg-zinc-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 shrink-0"
                >
                  {verifying ? 'Đang gửi...' : 'Gửi email xác minh'}
                </button>
              )}
            </div>

            {/* 2. Đặt lại mật khẩu */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#1c1e29]/50 border border-white/5 rounded-2xl relative z-10">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Đặt lại mật khẩu</h4>
                <p className="text-xs text-zinc-400">Yêu cầu liên kết đặt lại mật khẩu gửi về địa chỉ hòm thư liên kết của bạn.</p>
                <p className="text-[10px] text-zinc-500">Bạn sẽ nhận được thư chứa liên kết thay đổi mật khẩu mới an toàn.</p>
              </div>

              <button
                onClick={handleResetPassword}
                disabled={resetting}
                className="px-5 py-2.5 bg-pink-500 hover:bg-pink-600 disabled:bg-zinc-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 shrink-0"
              >
                {resetting ? 'Đang gửi...' : 'Đặt lại mật khẩu'}
              </button>
            </div>

            {/* 3. Thay đổi địa chỉ email */}
            <div className="p-5 bg-[#1c1e29]/50 border border-white/5 rounded-2xl space-y-4 relative z-10">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Thay đổi địa chỉ email</h4>
                <p className="text-xs text-zinc-400">Cập nhật địa chỉ hòm thư liên kết mới cho tài khoản nhà khoa học của bạn.</p>
              </div>

              <form onSubmit={handleChangeEmail} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-1 font-bold uppercase">Email mới</label>
                    <input 
                      type="email" 
                      required
                      value={newEmailInput}
                      onChange={(e) => setNewEmailInput(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full bg-[#1c1e29] border border-white/5 focus:border-pink-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-1 font-bold uppercase">Mật khẩu hiện tại</label>
                    <input 
                      type="password" 
                      required
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#1c1e29] border border-white/5 focus:border-pink-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingEmail}
                  className="w-full py-2.5 bg-pink-500 hover:bg-pink-600 disabled:bg-zinc-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 mt-2"
                >
                  {updatingEmail ? 'Đang cập nhật...' : 'Xác nhận thay đổi địa chỉ email'}
                </button>
              </form>
            </div>

            {/* Notification message alert */}
            {settingsMessage && (
              <div className={`p-4 rounded-2xl text-xs font-medium border flex items-center gap-2 relative z-10 ${
                settingsMessage.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{settingsMessage.text}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== FRIEND PROFILE VIEWER MODAL ====== */}
      {(selectedFriend || loadingProfile) && (
        <div
          className="fixed top-0 bottom-0 right-0 left-0 md:left-[260px] z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedFriend(null); }}
        >
          <div className="relative w-full max-w-lg bg-gradient-to-br from-[#2a2c3a] to-[#1c1e29] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">

            {/* Neon glow top edge */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500 to-transparent" />

            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

            {/* Close button */}
            <button
              onClick={() => setSelectedFriend(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
            >
              ✕
            </button>

            {loadingProfile ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Sparkles className="w-10 h-10 text-pink-500 animate-spin" />
                <p className="text-sm text-zinc-400">Đang tải hồ sơ chiến hữu...</p>
              </div>
            ) : selectedFriend && (
              <div className="p-8 relative z-10">

                {/* Header: Avatar + Name */}
                <div className="flex items-center gap-5 mb-6">
                  <AvatarFrame frame={selectedFriend.avatarFrame} className="w-20 h-20 text-3xl shrink-0">
                    {selectedFriend.avatarUrl ? (
                      selectedFriend.avatarUrl.startsWith('http') || selectedFriend.avatarUrl.startsWith('data:image/') ? (
                        <img src={selectedFriend.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="select-none">{selectedFriend.avatarUrl}</span>
                      )
                    ) : (
                      selectedFriend.displayName.charAt(0).toUpperCase()
                    )}
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-pink-500 border-2 border-[#1c1e29] text-[11px] font-extrabold text-white flex items-center justify-center shadow-lg z-30">
                      {selectedFriend.level}
                    </div>
                  </AvatarFrame>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold text-white leading-tight">{selectedFriend.displayName}</h2>
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        selectedFriend.lastActive && (Date.now() - selectedFriend.lastActive < 45000)
                          ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]'
                          : 'bg-zinc-600'
                      }`} />
                      <span className={`text-[10px] font-bold ${
                        selectedFriend.lastActive && (Date.now() - selectedFriend.lastActive < 45000)
                          ? 'text-emerald-400'
                          : 'text-zinc-500'
                      }`}>
                        {selectedFriend.lastActive && (Date.now() - selectedFriend.lastActive < 45000) ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-xs text-pink-400 font-bold uppercase tracking-widest mt-1 px-2 py-0.5 bg-pink-500/10 rounded-full inline-block border border-pink-500/15">
                      {getTitleLabel(selectedFriend.activeTitle)}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-2 font-mono">ID: {selectedFriend.uid.slice(0, 12)}...</p>
                  </div>
                </div>

                {/* EXP Bar */}
                <div className="mb-6 space-y-1.5">
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Kinh nghiệm (EXP)</span>
                    <span className="font-semibold text-white">{selectedFriend.exp} / {selectedFriend.nextLevelExp}</span>
                  </div>
                  <div className="w-full h-2 bg-[#1c1e29] rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to r from-pink-500 via-rose-500 to-amber-400 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min((selectedFriend.exp / selectedFriend.nextLevelExp) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'ELO Hạng', value: selectedFriend.elo, color: 'text-pink-400' },
                    { label: 'Thắng', value: selectedFriend.wins, color: 'text-emerald-400' },
                    { label: 'Thua', value: selectedFriend.losses, color: 'text-rose-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-[#1c1e29]/60 border border-white/5 rounded-2xl p-3 text-center">
                      <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Tỷ lệ thắng */}
                {(selectedFriend.wins + selectedFriend.losses) > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1.5">
                      <span>Tỷ lệ thắng</span>
                      <span className="text-emerald-400 font-bold">
                        {Math.round((selectedFriend.wins / (selectedFriend.wins + selectedFriend.losses)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#1c1e29] rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                        style={{ width: `${Math.round((selectedFriend.wins / (selectedFriend.wins + selectedFriend.losses)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Subject Strengths */}
                <div className="bg-[#1c1e29]/50 border border-white/5 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Chỉ số Năng lực STEM</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Toán học', key: 'math', color: 'bg-pink-500' },
                      { label: 'Vật lý', key: 'physics', color: 'bg-rose-500' },
                      { label: 'Hóa học', key: 'chemistry', color: 'bg-amber-400' },
                      { label: 'Sinh học', key: 'biology', color: 'bg-emerald-400' },
                    ].map(sub => (
                      <div key={sub.key}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-zinc-400">{sub.label}</span>
                          <span className="text-white font-bold">{selectedFriend.subjectStrengths?.[sub.key] ?? 50}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#2a2c3a] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${sub.color} rounded-full transition-all duration-700`}
                            style={{ width: `${selectedFriend.subjectStrengths?.[sub.key] ?? 50}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => openChallengeFor(selectedFriend)}
                    className="flex-1 py-3 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:text-white text-rose-400 text-xs font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Swords className="w-4 h-4" /> Thách đấu ngay
                  </button>
                  <button
                    onClick={() => setSelectedFriend(null)}
                    className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 text-xs font-bold rounded-2xl transition-all active:scale-95"
                  >
                    Đóng
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== SUBJECT PICKER MODAL (CHALLENGE) ====== */}
      {showChallengeModal && (
        <div
          className="fixed top-0 bottom-0 right-0 left-0 md:left-[260px] z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowChallengeModal(null); }}
        >
          <div className="relative w-full max-w-md bg-gradient-to-br from-[#2a2c3a] to-[#1c1e29] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
            <button
              onClick={() => setShowChallengeModal(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
            >
              ✕
            </button>

            <div className="p-8 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                  <Swords className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white">Chọn chủ đề thách đấu</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Gửi lời mời đến <span className="text-pink-400 font-bold">{showChallengeModal.displayName}</span></p>
                </div>
              </div>

              {challengeSentMsg ? (
                <div className="py-8 text-center">
                  <p className="text-sm font-bold text-white">{challengeSentMsg}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { id: 'math',      label: 'Toán học',  icon: '📐', color: 'border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 text-amber-400' },
                      { id: 'physics',   label: 'Vật lý',    icon: '⚡',   color: 'border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 text-emerald-400' },
                      { id: 'chemistry', label: 'Hóa học',  icon: '🧪',  color: 'border-pink-500/30 hover:border-pink-400 hover:bg-pink-500/10 text-pink-400' },
                      { id: 'biology',   label: 'Sinh học', icon: '🧬', color: 'border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 text-cyan-400' },
                    ].map(sub => (
                      <button
                        key={sub.id}
                        disabled={sendingChallenge}
                        onClick={() => sendChallengeInvite(showChallengeModal, sub.id)}
                        className={`flex flex-col items-center justify-center gap-2 p-5 bg-[#1c1e29]/60 border rounded-2xl transition-all active:scale-95 disabled:opacity-50 ${sub.color}`}
                      >
                        <span className="text-3xl">{sub.icon}</span>
                        <span className="text-sm font-bold">{sub.label}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={sendingChallenge}
                    onClick={() => sendChallengeInvite(showChallengeModal, 'random')}
                    className="w-full py-3.5 bg-gradient-to-r from-pink-500/20 to-rose-500/20 hover:from-pink-500/40 hover:to-rose-500/40 border border-pink-500/30 hover:border-pink-400 text-white text-sm font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    🎲 Ngẫu nhiên (Random) — Để số phận quyết định!
                  </button>
                </>
              )}

              {sendingChallenge && (
                <div className="mt-4 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400 animate-spin" /> Đang gửi lời mời...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================== MODAL CHỌN HUY HIỆU GHIM HOLOGRAPHIC ================== */}
      {selectedPodIndex !== null && (
        <div className="fixed top-0 bottom-0 right-0 left-0 md:left-[260px] z-[10000] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#2a2c3a] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-black text-white">Chọn Huy hiệu Trưng bày (Bục #{selectedPodIndex + 1})</span>
              <button 
                onClick={() => setSelectedPodIndex(null)}
                className="p-1 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {badges.map((b) => {
                const pinnedBadgeIds = personalization.pinnedBadges || ['badge1', 'badge2', 'badge3'];
                const isPinned = pinnedBadgeIds.includes(b.id);
                return (
                  <button
                    key={b.id}
                    disabled={!b.unlocked}
                    onClick={() => handlePinBadge(b.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                      !b.unlocked ? 'bg-zinc-900/40 border-white/5 opacity-40 cursor-not-allowed' :
                      isPinned ? 'bg-pink-500/10 border-pink-500/30 text-white' :
                      'bg-[#1c1e29]/60 border-white/5 hover:border-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-xl shrink-0">
                      {b.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold truncate">{b.name}</span>
                        {isPinned && <span className="text-[8px] font-black text-pink-400 uppercase tracking-wider">Đang ghim</span>}
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{b.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================== MODAL QUAY GACHA LẬT THẺ LƯỢNG TỬ 3D HOLOGRAM ================== */}
      {showGachaModal && (
        <div className="fixed top-0 bottom-0 right-0 left-0 md:left-[260px] z-[11000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-gradient-to-br from-[#121324] via-[#1a1c35] to-[#0d0e1a] border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl text-center overflow-hidden my-8">
            {/* Lưới tọa độ laser nền */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="absolute -top-48 -left-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <h3 className="text-xl font-black bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 uppercase tracking-widest mb-2 font-sans">
              GIẢI MÃ LIÊN KẾT LƯỢNG TỬ
            </h3>
            <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider mb-6">
              Bạn đã tiêu hao {gachaCrystalsSpent} 🔮 tinh thể. Click vào từng thẻ lượng tử bên dưới để lật mở liên kết!
            </p>

            {/* Container grid thẻ Gacha 3D */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 my-6 justify-center">
              {gachaResults.map((res, idx) => {
                const isFlipped = flippedGachaCards.includes(idx);
                const item = res.item;
                
                let rarityColor = 'border-zinc-500 text-zinc-400 bg-zinc-950/80';
                let glowColor = '';
                if (item.rarity === 'Legendary') {
                  rarityColor = 'border-amber-500 text-amber-300 bg-gradient-to-b from-amber-500/10 to-[#121324]';
                  glowColor = 'shadow-[0_0_20px_rgba(245,158,11,0.25)]';
                } else if (item.rarity === 'Epic') {
                  rarityColor = 'border-purple-500 text-purple-300 bg-gradient-to-b from-purple-500/10 to-[#121324]';
                  glowColor = 'shadow-[0_0_20px_rgba(168,85,247,0.25)]';
                } else if (item.rarity === 'Rare') {
                  rarityColor = 'border-cyan-500 text-cyan-300 bg-gradient-to-b from-cyan-500/10 to-[#121324]';
                  glowColor = 'shadow-[0_0_15px_rgba(6,182,212,0.2)]';
                }

                return (
                  <div 
                    key={idx}
                    className="w-full aspect-[3/4.2] relative cursor-pointer group"
                    style={{ perspective: '1000px' }}
                    onClick={() => {
                      if (!isFlipped) {
                        playSound.success();
                        setFlippedGachaCards(prev => [...prev, idx]);
                      }
                    }}
                  >
                    <div 
                      className="w-full h-full relative transition-transform duration-700"
                      style={{ 
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        transformStyle: 'preserve-3d'
                      }}
                    >
                      {/* CARD BACK (Mặt úp) */}
                      <div 
                        className="absolute inset-0 rounded-2xl border-2 border-purple-500/30 bg-gradient-to-br from-[#1b1c30] to-[#0e0f1d] flex flex-col items-center justify-center p-4 shadow-xl hover:border-purple-400 transition-colors"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-2 group-hover:scale-110 duration-300">
                          <span className="text-xl animate-pulse">🔮</span>
                        </div>
                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest font-mono">Quantum</span>
                        <span className="text-[8px] text-zinc-500 mt-1 uppercase">Click to open</span>
                      </div>

                      {/* CARD FRONT (Mặt ngửa) */}
                      <div 
                        className={`absolute inset-0 rounded-2xl border-2 flex flex-col items-center justify-between p-3 shadow-2xl ${rarityColor} ${glowColor}`}
                        style={{ 
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)'
                        }}
                      >
                        {/* Sparkles / Particles for Legendary/Epic */}
                        {(item.rarity === 'Legendary' || item.rarity === 'Epic') && (
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.08),transparent)] pointer-events-none" />
                        )}

                        <span className="text-[8px] font-black uppercase tracking-wider font-mono">
                          {item.rarity}
                        </span>

                        <div className="flex-1 flex flex-col items-center justify-center my-1 w-full min-h-0">
                          {item.type === 'title' ? (
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-cyan-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center text-2xl shadow-[0_0_10px_rgba(168,85,247,0.25)] animate-pulse">
                              {getTitleEmoji(item)}
                            </div>
                          ) : (
                            <div className="w-12 h-12 flex items-center justify-center relative overflow-hidden bg-black/30 rounded-xl border border-white/5 shadow-inner">
                              <STEMAvatarSVG parts={getCosmeticPreviewParts(item)} className="w-14 h-14 transform translate-y-1 scale-110" />
                            </div>
                          )}
                          <h4 className="text-[10px] sm:text-[11px] font-black text-white mt-1 leading-tight w-full px-0.5 text-center whitespace-normal break-words">
                            {item.name}
                          </h4>
                          {item.desc && (
                            <p className="text-[7.5px] text-zinc-400 mt-0.5 max-w-[120px] mx-auto leading-none whitespace-normal break-words">{item.desc}</p>
                          )}
                        </div>

                        <div className="w-full mt-1">
                          {res.isDuplicate ? (
                            <div className="text-[8px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 py-0.5 rounded-lg text-center font-mono">
                              Trùng: +{res.compensation} 🔮
                            </div>
                          ) : (
                            <div className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-0.5 rounded-lg text-center font-mono">
                              MỚI SỞ HỮU ✨
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <button
                onClick={() => {
                  playSound.success();
                  setFlippedGachaCards(gachaResults.map((_, i) => i));
                }}
                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl border border-white/5 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>⚡ Lật toàn bộ</span>
              </button>
              <button
                onClick={() => {
                  playSound.click();
                  setShowGachaModal(false);
                }}
                className="px-8 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-md shadow-purple-500/20"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================== MODAL NHẬN QUÀ THĂNG CẤP 3D HOLOGRAM ================== */}
      {levelRewardModal.show && (
        <div className="fixed top-0 bottom-0 right-0 left-0 md:left-[260px] z-[12000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-gradient-to-br from-[#121324] to-[#0a0a14] border border-white/10 rounded-3xl p-8 shadow-2xl text-center overflow-hidden">
            {/* Lớp lưới lượng tử */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(251,191,36,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {levelRewardModal.error ? (
              // Trường hợp Thông báo lỗi hoặc cảnh báo
              <div className="relative z-10 py-4">
                <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">
                  ⚠️
                </div>
                <h3 className="text-base font-bold text-white mb-2">Thông Báo Hệ Thống</h3>
                <p className="text-zinc-400 text-xs px-2 leading-relaxed">{levelRewardModal.rewardText}</p>
                <button
                  onClick={() => { playSound.click(); setLevelRewardModal(prev => ({ ...prev, show: false })); }}
                  className="mt-6 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all active:scale-95 border border-white/5"
                >
                  Đồng ý
                </button>
              </div>
            ) : (
              // Trường hợp nhận quà thăng cấp thành công lộng lẫy
              <div className="relative z-10">
                <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1.5">
                  {levelRewardModal.type === 'avatar' 
                    ? 'Cá Nhân Hóa' 
                    : levelRewardModal.type === 'checkin'
                    ? 'Điểm Danh Hàng Ngày'
                    : 'Phần Thưởng Đột Phá'}
                </h4>
                <h3 className="text-xl font-black bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500 uppercase tracking-wider mb-6 font-sans">
                  {levelRewardModal.type === 'avatar'
                    ? 'ĐỒNG BỘ GIAO DIỆN'
                    : levelRewardModal.type === 'checkin'
                    ? 'ĐỒNG BỘ NĂNG LƯỢNG'
                    : `QUÀ CẤP ĐỘ ${levelRewardModal.milestone > 0 ? levelRewardModal.milestone : ''}`}
                </h3>

                {/* Thẻ quà 3D lật mở */}
                <div 
                  className="w-44 h-56 mx-auto cursor-pointer relative mb-6"
                  style={{ perspective: '1000px' }}
                  onClick={() => setLevelRewardModal(prev => ({ ...prev, flipped: !prev.flipped }))}
                >
                  <div 
                    className="w-full h-full duration-700 transform-style-3d relative transition-transform"
                    style={{ transform: levelRewardModal.flipped ? 'rotateY(180deg)' : 'rotateY(0)' }}
                  >
                    {/* Mặt úp (Chiếc rương lơ lửng) */}
                    <div className="absolute inset-0 backface-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#241c12] to-[#0c0a07] flex flex-col items-center justify-center p-4 shadow-xl hover:border-amber-400 transition-colors">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-3xl mb-3 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-bounce">
                        {levelRewardModal.type === 'avatar' 
                          ? '🎨' 
                          : levelRewardModal.type === 'checkin'
                          ? '⚡'
                          : '🎁'}
                      </div>
                      <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest font-mono">Hologram Card</span>
                      <span className="text-[8px] text-zinc-500 mt-1 uppercase">Click to flip</span>
                    </div>

                    {/* Mặt ngửa (Nội dung phần thưởng) */}
                    <div className="absolute inset-0 backface-hidden rounded-2xl border-2 border-amber-400 bg-zinc-950 flex flex-col items-center justify-between p-5 rotate-y-180 shadow-[0_0_25px_rgba(245,158,11,0.3)]">
                      <span className="text-[8px] font-black text-amber-400 uppercase tracking-wider font-mono">
                        {levelRewardModal.type === 'avatar' 
                          ? 'Custom Avatar' 
                          : levelRewardModal.type === 'checkin'
                          ? 'Check-in Reward'
                          : 'Legendary Gift'}
                      </span>
                      
                      <div className="my-2">
                        {levelRewardModal.frameReward ? (
                          <div className="w-14 h-14 rounded-full border-2 border-amber-500/50 flex items-center justify-center mx-auto bg-amber-500/5 text-2xl relative overflow-hidden shadow-inner">
                            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent" />
                            🖼️
                          </div>
                        ) : levelRewardModal.titleReward ? (
                          <div className="w-14 h-14 rounded-full border-2 border-cyan-500/50 flex items-center justify-center mx-auto bg-cyan-500/5 text-2xl relative overflow-hidden shadow-inner">
                            <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent" />
                            🏆
                          </div>
                        ) : levelRewardModal.type === 'avatar' ? (
                          <div className="w-14 h-14 rounded-full border-2 border-pink-500/50 flex items-center justify-center mx-auto bg-pink-500/5 text-2xl relative overflow-hidden shadow-inner animate-pulse">
                            <div className="absolute inset-0 bg-gradient-to-t from-pink-500/10 to-transparent" />
                            ✨
                          </div>
                        ) : (
                          <div className="text-4xl animate-pulse">🔮</div>
                        )}
                        <h4 className="text-xs font-black text-white mt-3 leading-snug whitespace-pre-line">{levelRewardModal.rewardText}</h4>
                      </div>

                      <span className="text-[8.5px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg select-none">
                        {levelRewardModal.type === 'avatar' ? 'THÀNH CÔNG ✨' : 'ĐÃ NHẬN ✨'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[9px] text-zinc-500 mb-6 max-w-[280px] mx-auto leading-relaxed">
                  {levelRewardModal.type === 'avatar'
                    ? 'Nhấp vào thẻ để xoay lật 3D và hiển thị trạng thái đồng bộ diện mạo!'
                    : levelRewardModal.type === 'checkin'
                    ? 'Nhấp vào thẻ để xoay lật 3D và xem phần thưởng năng lượng điểm danh!'
                    : 'Nhấp vào thẻ để xoay lật 3D và hiển thị các phần quà độc quyền thăng cấp của bạn!'}
                </p>

                <button
                  onClick={() => { playSound.click(); setLevelRewardModal(prev => ({ ...prev, show: false })); }}
                  className="px-8 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-zinc-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-md shadow-amber-500/20"
                >
                  Tuyệt vời!
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
