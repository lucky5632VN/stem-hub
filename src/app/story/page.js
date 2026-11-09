'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MessageSquare, 
  Send, 
  Plus, 
  X, 
  Sparkles, 
  Flame, 
  Brain, 
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  Check, 
  Volume2, 
  VolumeX,
  Lock,
  Compass,
  Trophy,
  Activity,
  Upload,
  Download,
  Share2,
  Trash2,
  Play,
  Pause,
  Palette,
  Layers,
  CheckCircle2,
  Loader
} from 'lucide-react';
import { AvatarFrame } from '@/components/atoms/AvatarFrame';
import STEMAvatarSVG from '@/components/atoms/STEMAvatarSVG';
import { useAppStore } from '@/store/useAppStore';
import { playSound } from '@/lib/sound';
import { getRankInfo } from '@/lib/matchmaker';
import { db } from '@/lib/firebase';
import { 
  doc, setDoc, getDoc, getDocs, updateDoc, onSnapshot, collection, 
  query, orderBy, limit, serverTimestamp, arrayUnion, increment, deleteDoc 
} from 'firebase/firestore';
import { getPendingShare, deletePendingShare } from '@/lib/indexedDB';
import { 
  compressImageDataUrl, 
  captureScreenOptimized, 
  downloadDataUrl, 
  applyFilterToDataUrl 
} from '@/lib/screenshotEngine';

const QUICK_STICKERS = ['🚀', '🧪', '⚡', '🧬', '👑', '🔥', '🏆', '💎', '🎉', '💡', '😍', '👏'];

const FILTERS = [
  { id: 'none', label: 'Nguyên Bản', icon: '✨' },
  { id: 'cyberpunk', label: 'Cyberpunk', icon: '⚡' },
  { id: 'golden', label: 'Hoàng Kim', icon: '🌟' },
  { id: 'hologram', label: 'Hologram', icon: '🔮' },
  { id: 'matrix', label: 'Ma Trận', icon: '💻' },
  { id: 'vintage', label: 'Lab Cổ Điển', icon: '🔬' },
];

// Mẫu ảnh mô phỏng chất lượng cao cho phòng lab & đấu trường để đảm bảo KHÔNG DÙNG PLACEHOLDER
const LAB_TEMPLATES = {
  chemistry: [
    {
      id: 'chem_1',
      title: 'Điện phân dung dịch CuSO₄',
      desc: 'Tia lửa điện lượng tử phóng qua điện cực đồng.',
      url: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'chem_2',
      title: 'Phản ứng trung hòa siêu đẳng',
      desc: 'Dung dịch đổi màu tím hồng phenolphthalein tuyệt đẹp.',
      url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800&auto=format&fit=crop',
    }
  ],
  physics: [
    {
      id: 'phys_1',
      title: 'Giao thoa ánh sáng Y-âng',
      desc: 'Hệ vân sáng tối đối xứng hoàn mỹ.',
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'phys_2',
      title: 'Mạch điện DC Lượng Tử',
      desc: 'Bản mạch lắp ráp cân bằng hiệu điện thế.',
      url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop',
    }
  ],
  math: [
    {
      id: 'math_1',
      title: 'Tọa độ Không gian 3D',
      desc: 'Vẽ hình chóp cụt xiên qua tâm O.',
      url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=800&auto=format&fit=crop',
    }
  ],
  biology: [
    {
      id: 'bio_1',
      title: 'Tái tổ hợp gen ADN THPT',
      desc: 'Mô phỏng chuỗi Nucleotide xoắn kép xoay quanh tế bào.',
      url: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=800&auto=format&fit=crop',
    }
  ],
  arena: [
    {
      id: 'arena_1',
      title: 'Chiến Binh MVP Đấu Trường 1v1',
      desc: 'Chiến thắng áp đảo với chuỗi combo kiến thức chuẩn xác.',
      url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 'arena_2',
      title: 'Vinh Quang Bảng Xếp Hạng ELO',
      desc: 'Đột phá thứ hạng vươn lên đỉnh cao học thuật.',
      url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop',
    }
  ]
};

// Dữ liệu Story của người dùng khác (Mô phỏng active stories 24h)
const MOCK_STORIES = [
  {
    id: 'user_story_1',
    userName: 'Kỹ Sư Lượng Tử',
    avatar: '🌀',
    elo: 2450,
    title: 'Viện Sĩ Lượng Tử',
    activeFrame: 'cyan_tech',
    stories: [
      {
        id: 's1_1',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop',
        caption: 'Hệ thống gương phản xạ bẻ cong tia laser thành công! ⚡🔥',
        createdAt: '25 phút trước'
      },
      {
        id: 's1_2',
        imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop',
        caption: 'Đồ thị Parabol đi qua đúng đỉnh cực trị 3D! 🎯📐',
        createdAt: '10 phút trước'
      }
    ]
  },
  {
    id: 'user_story_2',
    userName: 'Nhà Sáng Chế Trẻ',
    avatar: '🔬',
    elo: 2050,
    title: 'Giáo Sư Phát Minh',
    activeFrame: 'gold_vip',
    stories: [
      {
        id: 's2_1',
        imageUrl: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?q=80&w=600&auto=format&fit=crop',
        caption: 'Phản ứng nổ thuốc súng đen KNO₃ quá hoành tráng! 🧪💥😍',
        createdAt: '40 phút trước'
      },
      {
        id: 's2_2',
        imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop',
        caption: 'Dung dịch phenolphthalein chuyển màu hồng neon tuyệt đẹp 🧪✨',
        createdAt: '15 phút trước'
      }
    ]
  },
  {
    id: 'user_story_3',
    userName: 'Genetics Wizard',
    avatar: '🧬',
    elo: 1650,
    title: 'Giáo Sư Phát Minh',
    activeFrame: 'neon_fire',
    stories: [
      {
        id: 's3_1',
        imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=600&auto=format&fit=crop',
        caption: 'Ghép cặp thành công chuỗi ADN virus đột biến! 🌾🧬💯',
        createdAt: '1 giờ trước'
      }
    ]
  },
  {
    id: 'user_story_4',
    userName: 'Nguyễn Minh Khang',
    avatar: '⚡',
    elo: 1300,
    title: 'Bậc Thầy Đấu Trường',
    activeFrame: 'top_1_sovereign',
    stories: [
      {
        id: 's4_1',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop',
        caption: 'Chuỗi 8 trận thắng liên tiếp ở PvP Arena! 🏆🚀🔥',
        createdAt: '2 giờ trước'
      }
    ]
  },
  {
    id: 'user_story_5',
    userName: 'Trần Thị Thanh Vân',
    avatar: '📐',
    elo: 1150,
    title: 'Học Sinh Ưu Tú',
    activeFrame: 'cosmic_nebula',
    stories: [
      {
        id: 's5_1',
        imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=600&auto=format&fit=crop',
        caption: 'Vừa giải đáp xong bài toán Tọa độ 3D góc giữa 2 mặt phẳng 📐✨😍',
        createdAt: '3 giờ trước'
      }
    ]
  },
  {
    id: 'user_story_6',
    userName: 'Phạm Minh Anh',
    avatar: '🔬',
    elo: 1200,
    title: 'Nhà Nghiên Cứu',
    activeFrame: 'antimatter_era',
    stories: [
      {
        id: 's6_1',
        imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=600&auto=format&fit=crop',
        caption: 'Hiện tượng quang phổ vạch phát xạ trong phòng thí nghiệm ⚡🌈',
        createdAt: '4 giờ trước'
      }
    ]
  },
  {
    id: 'user_story_7',
    userName: 'Vũ Hoàng Bách',
    avatar: '⚙️',
    elo: 1080,
    title: 'Kỹ Thuật Viên',
    activeFrame: 'blackhole_gravity',
    stories: [
      {
        id: 's7_1',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop',
        caption: 'Lắp ráp mạch vi xử lý lượng tử đơn chip thành công 💻💥',
        createdAt: '5 giờ trước'
      }
    ]
  },
  {
    id: 'user_story_8',
    userName: 'Đặng Thùy Dương',
    avatar: '🌿',
    elo: 950,
    title: 'Thành Viên Năng Nổ',
    activeFrame: 'multiverse_overlord',
    stories: [
      {
        id: 's8_1',
        imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=600&auto=format&fit=crop',
        caption: 'Quan sát tế bào thực vật phân bào dưới kính hiển vi điện tử 🔬🌱😍',
        createdAt: '6 giờ trước'
      }
    ]
  },
  {
    id: 'user_story_9',
    userName: 'Lê Hoàng Nam',
    avatar: '🦁',
    elo: 890,
    title: 'Tân Binh Xuất Sắc',
    activeFrame: 'top_100_silver',
    stories: [
      {
        id: 's9_1',
        imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=600&auto=format&fit=crop',
        caption: 'Phá đảo 10 trận Sinh học PvP liên tiếp! 7 Thắng rực rỡ 🧬🏆🔥',
        createdAt: '7 giờ trước'
      }
    ]
  }
];

// Bảng tin Moments Feed mẫu sinh động
const MOCK_MOMENTS = [
  {
    id: 'moment_1',
    userName: 'Kỹ Sư Lượng Tử',
    avatar: '🌀',
    title: 'Viện Sĩ Lượng Tử',
    elo: 2450,
    avatarFrame: 'cyan_tech',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop',
    caption: 'Tương giao đồ thị cực kỳ nhịp nhàng trong buổi Đấu trường sáng nay! Đã leo thành công lên 2450 ELO. Ai muốn solo môn Toán học 3D không nào? 📐🚀🔥',
    subject: 'math',
    subjectLabel: 'Toán Học 3D',
    createdAt: '15 phút trước',
    reactions: { heart: 42, brain: 28, fire: 35 },
    comments: [
      { id: 'c1', userName: 'Học Thần Hóa', text: 'Vẽ đỉnh thế anh ơi! 🔥👏' },
      { id: 'c2', userName: 'Nhà Sáng Chế Trẻ', text: 'Hóng solo Toán 3D nha 🚀💯' },
      { id: 'c3', userName: 'Trần Thị Thanh Vân', text: 'Chúc mừng idol nhé! 😍🎉' }
    ]
  },
  {
    id: 'moment_2',
    userName: 'Nhà Sáng Chế Trẻ',
    avatar: '🧪',
    title: 'Giáo Sư Phát Minh',
    elo: 2050,
    avatarFrame: 'gold_vip',
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop',
    caption: 'Đã hoàn thành phản ứng bẫy khí CO₂ chuẩn pH = 7.1 siêu ngọt ngào. Tránh được hoàn toàn vụ nổ bình ga của Chapter 1 luôn nhé mọi người! 🧪🔥😍',
    subject: 'chemistry',
    subjectLabel: 'Hóa Học Ảo',
    createdAt: '45 phút trước',
    reactions: { heart: 38, brain: 19, fire: 45 },
    comments: [
      { id: 'c4', userName: 'Genetics Wizard', text: 'Chỉ em cách đổ NaHCO₃ với, toàn bị nổ! 😅🧪' },
      { id: 'c5', userName: 'Vũ Hoàng Bách', text: 'Dùng tỉ lệ 2:1 là bao mượt nha bro 💡✨' }
    ]
  },
  {
    id: 'moment_3',
    userName: 'Genetics Wizard',
    avatar: '🧬',
    title: 'Giáo Sư Phát Minh',
    elo: 1650,
    avatarFrame: 'neon_fire',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=600&auto=format&fit=crop',
    caption: 'Thí nghiệm mô phỏng phiên mã ADN thành mARN vừa hoàn thành 100%! Cảm giác nối các cặp Nucleotit A-U, G-X cuốn thực sự! 🧬🌾💯',
    subject: 'biology',
    subjectLabel: 'Sinh Học Di Truyền',
    createdAt: '1 giờ trước',
    reactions: { heart: 51, brain: 34, fire: 29 },
    comments: [
      { id: 'c6', userName: 'Phạm Minh Anh', text: 'Quá đỉnh luôn b ơi! 🧬😍' },
      { id: 'c7', userName: 'Lê Hoàng Nam', text: 'Sinh học di truyền đỉnh cao! 👏🔥' }
    ]
  },
  {
    id: 'moment_4',
    userName: 'Nguyễn Minh Khang',
    avatar: '⚡',
    title: 'Bậc Thầy Đấu Trường',
    elo: 1300,
    avatarFrame: 'top_1_sovereign',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop',
    caption: 'Chuỗi 8 trận thắng liên tiếp ở Đấu trường 1v1! Cú nổ ELO lên 1300 đỉnh nhất tuần này. Cảm ơn các đối thủ đã cho mình những trận đấu kịch tính! ⚔️🏆🔥',
    subject: 'physics',
    subjectLabel: 'Vật Lý Lượng Tử',
    createdAt: '2 giờ trước',
    reactions: { heart: 64, brain: 22, fire: 78 },
    comments: [
      { id: 'c8', userName: 'Bùi Minh Triết', text: 'Cao thủ quá bro ơi! 🏆💪' },
      { id: 'c9', userName: 'Hoàng Khánh Linh', text: 'Hẹn solo trận tới nha 🔥⚔️' }
    ]
  },
  {
    id: 'moment_5',
    userName: 'Trần Thị Thanh Vân',
    avatar: '📐',
    title: 'Học Sinh Ưu Tú',
    elo: 1150,
    avatarFrame: 'cosmic_nebula',
    imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=600&auto=format&fit=crop',
    caption: 'Đêm muộn nhưng vẫn phải hoàn thành xong bài tập Tọa độ Không gian 3D. Góc giữa hai mặt phẳng ra đúng √3/2 ngọt lịm! 📐🌙✨',
    subject: 'math',
    subjectLabel: 'Toán Học 3D',
    createdAt: '3 giờ trước',
    reactions: { heart: 33, brain: 41, fire: 15 },
    comments: [
      { id: 'c10', userName: 'Kỹ Sư Lượng Tử', text: 'Dùng tích có hướng của 2 VTCP là ra ngay! 📐💡' },
      { id: 'c11', userName: 'Đặng Thùy Dương', text: 'Thức khuya học chăm quá b 🎉👏' }
    ]
  },
  {
    id: 'moment_6',
    userName: 'Phạm Minh Anh',
    avatar: '🔬',
    title: 'Nhà Nghiên Cứu',
    elo: 1200,
    avatarFrame: 'antimatter_era',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=600&auto=format&fit=crop',
    caption: 'Hiện tượng giao thoa ánh sáng đơn sắc với khe Y-âng tạo vân sáng vân tối nhìn như tác phẩm nghệ thuật. STEM HUB đúng là đỉnh! ⚡🌈😍',
    subject: 'physics',
    subjectLabel: 'Vật Lý Lượng Tử',
    createdAt: '4 giờ trước',
    reactions: { heart: 45, brain: 30, fire: 27 },
    comments: [
      { id: 'c12', userName: 'Nhà Sáng Chế Trẻ', text: 'Ảnh sắc nét vãi! 📸⚡' },
      { id: 'c13', userName: 'Genetics Wizard', text: 'Đẹp thực sự b ơi! ❤️✨' }
    ]
  },
  {
    id: 'moment_7',
    userName: 'Lê Hoàng Nam',
    avatar: '🦁',
    title: 'Tân Binh Xuất Sắc',
    elo: 890,
    avatarFrame: 'top_100_silver',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=600&auto=format&fit=crop',
    caption: 'Vừa giải xong sơ đồ phả hệ di truyền 4 thế hệ của môn Sinh! Tìm ra tỉ lệ kiểu gen bệnh di truyền chính xác 25%. Ai cần mẹo giải nhanh ib nhé! 🧬📊💪',
    subject: 'biology',
    subjectLabel: 'Sinh Học Di Truyền',
    createdAt: '5 giờ trước',
    reactions: { heart: 29, brain: 37, fire: 22 },
    comments: [
      { id: 'c14', userName: 'Nguyễn Minh Khang', text: 'Xin mẹo với bro ơi 🧬💡' },
      { id: 'c15', userName: 'Phan Thanh Hằng', text: 'Quá xuất sắc luôn 💯🎉' }
    ]
  }
];

// Hàm Seeding dữ liệu mẫu vào Firestore để đảm bảo giao diện luôn đầy đủ thông tin sinh động
const seedDatabase = async () => {
  try {
    const momentsCollection = collection(db, 'moments');
    const momentsSnapshot = await getDocs(momentsCollection);
    if (momentsSnapshot.empty || momentsSnapshot.size < 5) {
      console.log("Seeding rich mock moments to Firestore...");
      for (const m of MOCK_MOMENTS) {
        await setDoc(doc(db, 'moments', m.id), {
          ...m,
          timestamp: Date.now() - Math.floor(Math.random() * 3600000 * 5)
        }, { merge: true });
      }
    }

    const storiesCollection = collection(db, 'stories');
    const storiesSnapshot = await getDocs(storiesCollection);
    if (storiesSnapshot.empty || storiesSnapshot.size < 5) {
      console.log("Seeding rich mock stories to Firestore...");
      for (const s of MOCK_STORIES) {
        await setDoc(doc(db, 'stories', s.id), {
          ...s,
          updatedAt: Date.now() - Math.floor(Math.random() * 3600000 * 5)
        }, { merge: true });
      }
    }
  } catch (err) {
    console.error("Lỗi Seeding cơ sở dữ liệu mẫu:", err);
  }
};

const safeCacheToLocalStorage = (key, list) => {
  if (typeof window === 'undefined') return;
  try {
    const sanitized = list.slice(0, 10).map(item => {
      const copy = { ...item };
      if (copy.imageUrl && copy.imageUrl.startsWith('data:image')) {
        copy.imageUrl = '';
      }
      if (Array.isArray(copy.stories)) {
        copy.stories = copy.stories.map(s => (s.imageUrl && s.imageUrl.startsWith('data:image') ? { ...s, imageUrl: '' } : s));
      }
      return copy;
    });
    localStorage.setItem(key, JSON.stringify(sanitized));
  } catch (e) {
    try {
      const minimal = list.slice(0, 3).map(item => ({ ...item, imageUrl: '', stories: [] }));
      localStorage.setItem(key, JSON.stringify(minimal));
    } catch (err) {
      console.warn(`Could not cache ${key} in localStorage:`, err);
    }
  }
};

export default function STEMStoriesPage() {
  const user = useAppStore((state) => state.user);
  const personalization = useAppStore((state) => state.personalization);
  const userElo = personalization.elo || 0;

  // Lọc thông tin rank
  const rankInfo = getRankInfo(userElo);

  // States
  const [moments, setMoments] = useState(MOCK_MOMENTS);
  const [allStories, setAllStories] = useState(MOCK_STORIES);
  
  const [activeStoryIndex, setActiveStoryIndex] = useState(null); // index của user trong allStories
  const [storySubIndex, setStorySubIndex] = useState(0); // index của câu chuyện cụ thể
  const [isPosting, setIsPosting] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('chemistry');
  const [selectedTemplate, setSelectedTemplate] = useState(LAB_TEMPLATES.chemistry[0]);
  const [commentInputs, setCommentInputs] = useState({});
  const [floatingEmojis, setFloatingEmojis] = useState([]);

  // Nâng cấp Studio Đăng Story
  const [postDestination, setPostDestination] = useState('both'); // 'both' | 'story' | 'moment'
  const [activeCreationTab, setActiveCreationTab] = useState('templates'); // 'templates' | 'upload' | 'capture'
  const [activeFilter, setActiveFilter] = useState('none');
  const [isCapturingFromStory, setIsCapturingFromStory] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [isViewerPlaying, setIsViewerPlaying] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Ảnh tùy chỉnh tải lên
  const [customImage, setCustomImage] = useState(null);

  // Tin chia sẻ nhanh đang chờ xác nhận từ phòng thi
  const [pendingShare, setPendingShare] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };
  
  // Timer cho Story Viewer
  const progressTimerRef = useRef(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);

  // Đọc dữ liệu chia sẻ nhanh từ localStorage và đăng ký Firestore real-time listeners khi mount
  useEffect(() => {
    // 1. Tải cache từ localStorage trước để hiển thị siêu tốc (Local Cache Fallback)
    if (typeof window !== 'undefined') {
      const cachedMoments = localStorage.getItem('community_moments');
      if (cachedMoments) setMoments(JSON.parse(cachedMoments));

      const cachedStories = localStorage.getItem('community_stories');
      if (cachedStories) setAllStories(JSON.parse(cachedStories));

      // Kiểm tra có tin chia sẻ nhanh đang chờ xác nhận hay không
      getPendingShare().then((pending) => {
        if (pending) setPendingShare(pending);
      });
    }

    // 2. Chạy Seeding tự động nếu Database Firebase trống
    const initSync = async () => {
      await seedDatabase();
    };
    initSync();

    // 3. Đăng ký Real-time Listeners đồng bộ dữ liệu thời gian thực từ Firestore
    const qMoments = query(collection(db, 'moments'), orderBy('timestamp', 'desc'));
    const unsubMoments = onSnapshot(qMoments, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          ...data,
          id: docSnap.id
        });
      });
      if (list.length > 0) {
        setMoments(list);
        if (typeof window !== 'undefined') {
          safeCacheToLocalStorage('community_moments', list);
        }
      }
    }, (err) => {
      console.warn("Lỗi đồng bộ moments từ Firestore (sử dụng cache cục bộ):", err);
    });

    const qStories = query(collection(db, 'stories'), orderBy('updatedAt', 'desc'));
    const unsubStories = onSnapshot(qStories, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          ...data,
          id: docSnap.id
        });
      });
      if (list.length > 0) {
        setAllStories(list);
        if (typeof window !== 'undefined') {
          safeCacheToLocalStorage('community_stories', list);
        }
      }
    }, (err) => {
      console.warn("Lỗi đồng bộ stories từ Firestore (sử dụng cache cục bộ):", err);
    });

    return () => {
      unsubMoments();
      unsubStories();
    };
  }, []);

  // Logic chạy tự động cho Story Viewer
  useEffect(() => {
    if (activeStoryIndex === null || isHolding || !isViewerPlaying) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    const currentStoryUser = allStories[activeStoryIndex];
    if (!currentStoryUser) return;

    setStoryProgress(0);

    const intervalTime = 50; // Cập nhật mỗi 50ms
    const step = (50 / 5000) * 100; // Tổng thời gian 5s

    progressTimerRef.current = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          // Hết giờ -> Chuyển sang story tiếp theo
          handleNextStory();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [activeStoryIndex, storySubIndex, isHolding, isViewerPlaying]);

  // Điều khiển bàn phím cho Story
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeStoryIndex === null) return;
      if (e.key === 'ArrowRight') handleNextStory();
      if (e.key === 'ArrowLeft') handlePrevStory();
      if (e.key === 'Escape') handleCloseStory();
      if (e.key === ' ') {
        e.preventDefault();
        setIsViewerPlaying((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStoryIndex, storySubIndex]);

  // Chuyển Story tiếp theo
  const handleNextStory = () => {
    const currentUser = allStories[activeStoryIndex];
    if (!currentUser) return;

    if (storySubIndex < currentUser.stories.length - 1) {
      // Chuyển slide trong cùng 1 user
      setStorySubIndex(storySubIndex + 1);
    } else {
      // Chuyển sang user tiếp theo
      if (activeStoryIndex < allStories.length - 1) {
        setActiveStoryIndex(activeStoryIndex + 1);
        setStorySubIndex(0);
      } else {
        // Hết tất cả user -> đóng viewer
        handleCloseStory();
      }
    }
  };

  // Quay lại Story trước đó
  const handlePrevStory = () => {
    if (storySubIndex > 0) {
      setStorySubIndex(storySubIndex - 1);
    } else {
      if (activeStoryIndex > 0) {
        const prevUser = allStories[activeStoryIndex - 1];
        setActiveStoryIndex(activeStoryIndex - 1);
        setStorySubIndex(prevUser.stories.length - 1);
      } else {
        // Hết lùi -> reset tiến trình của story đầu tiên
        setStoryProgress(0);
      }
    }
  };

  const handleCloseStory = () => {
    setActiveStoryIndex(null);
    setStorySubIndex(0);
    setStoryProgress(0);
    setIsViewerPlaying(true);
  };

  // Thả reaction nổi bọt (floating emoji)
  const triggerFloatingEmoji = (emoji, x, y) => {
    const id = Math.random().toString();
    const newEmoji = { id, emoji, x, y };
    setFloatingEmojis((prev) => [...prev, newEmoji]);

    // Xóa emoji sau 1.5s
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter(e => e.id !== id));
    }, 1500);
  };

  // Handle click biểu cảm của Bảng tin với Optimistic UI 0ms
  const handleReact = async (momentId, reactionType, e) => {
    playSound.click();
    
    // Tạo hiệu ứng bong bóng nổi bọt tại vị trí click
    const rect = e?.target?.getBoundingClientRect ? e.target.getBoundingClientRect() : { left: 100, top: 100 };
    const emojiMap = { heart: '❤️', brain: '🧠', fire: '💥' };
    triggerFloatingEmoji(emojiMap[reactionType] || '✨', (e?.clientX || rect.left) - 15, (e?.clientY || rect.top) - 15);

    if (reactionType === 'fire') {
      playSound.explosion();
    }

    // 1. Cập nhật lạc quan (Optimistic) ngay lập tức
    setMoments((prev) => {
      const next = prev.map((m) => {
        if (String(m.id) === String(momentId)) {
          const cur = m.reactions || { heart: 0, brain: 0, fire: 0 };
          return {
            ...m,
            reactions: {
              ...cur,
              [reactionType]: (cur[reactionType] || 0) + 1
            }
          };
        }
        return m;
      });
      if (typeof window !== 'undefined') {
        safeCacheToLocalStorage('community_moments', next);
      }
      return next;
    });

    // 2. Ghi lên Firestore bằng increment(1) nếu đã xác thực
    if (auth?.currentUser && !String(momentId).startsWith('moment_')) {
      try {
        const momentRef = doc(db, 'moments', String(momentId));
        await updateDoc(momentRef, {
          [`reactions.${reactionType}`]: increment(1)
        });
      } catch (err) {
        console.warn("Reaction Firestore update fallback to local:", err);
      }
    }
  };

  // Viết bình luận nhanh với Optimistic UI 0ms
  const handleAddComment = async (momentId, explicitText) => {
    const text = (explicitText !== undefined && explicitText !== '') ? explicitText : (commentInputs[momentId] || '');
    if (!text || !text.trim()) return;

    playSound.success();
    const newComment = {
      id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userName: user?.displayName || 'Nhà Khoa Học',
      text: text.trim(),
      timestamp: Date.now()
    };

    setCommentInputs((prev) => ({ ...prev, [momentId]: '' }));

    // Cập nhật lạc quan trên giao diện tức thì
    setMoments((prev) => {
      const next = prev.map((m) => {
        if (String(m.id) === String(momentId)) {
          return {
            ...m,
            comments: [...(m.comments || []), newComment]
          };
        }
        return m;
      });
      if (typeof window !== 'undefined') {
        safeCacheToLocalStorage('community_moments', next);
      }
      return next;
    });

    // Lưu vào Firestore nếu người dùng đã đăng nhập và không phải mock ID
    if (auth?.currentUser && !String(momentId).startsWith('moment_')) {
      try {
        const momentRef = doc(db, 'moments', String(momentId));
        await updateDoc(momentRef, {
          comments: arrayUnion(newComment)
        });
      } catch (err) {
        console.warn("Thêm bình luận lên Firestore gặp trục trặc, đã lưu tạm cục bộ:", err);
      }
    }
  };

  // Xóa khoảnh khắc nếu là tác giả hoặc Admin
  const handleDeleteMoment = async (momentId) => {
    playSound.click();
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này khỏi bảng tin cộng đồng?')) return;

    // Cập nhật lạc quan
    setMoments((prev) => prev.filter((m) => m.id !== momentId));
    showToast('Đã xóa bài viết thành công!');

    try {
      await deleteDoc(doc(db, 'moments', momentId));
    } catch (err) {
      console.warn('Lỗi khi xóa bài viết trên Firestore:', err);
    }
  };

  // Sao chép liên kết khoảnh khắc
  const handleShareMoment = (momentId) => {
    playSound.click();
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const shareUrl = `${window.location.origin}/story#${momentId}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Đã sao chép liên kết khoảnh khắc! 📋');
        playSound.success();
      }).catch(() => {
        showToast('Đã sao chép liên kết! 📋');
      });
    }
  };

  // Chụp màn hình nhanh trực tiếp từ giao diện trang Story
  const handleCaptureFromStory = async () => {
    setIsCapturingFromStory(true);
    playSound.shutter();
    try {
      const dataUrl = await captureScreenOptimized();
      if (dataUrl) {
        setCustomImage(dataUrl);
        playSound.success();
        showToast('Đã chụp ảnh màn hình thành công! 📸');
      }
    } catch (err) {
      console.error('Lỗi khi chụp màn hình:', err);
      alert('Không thể hoàn tất chụp màn hình lúc này. Vui lòng thử lại!');
    } finally {
      setIsCapturingFromStory(false);
    }
  };

  // Đăng khoảnh khắc mới với bộ nén ảnh siêu nhẹ & bộ lọc Sci-Fi
  const handleCreatePost = async () => {
    if (!newCaption.trim() || isSubmittingPost) return;
    setIsSubmittingPost(true);
    playSound.click();

    try {
      // 1. Xác định ảnh gốc
      let rawImage = customImage || selectedTemplate?.url;
      if (!rawImage) {
        rawImage = LAB_TEMPLATES.chemistry[0].url;
      }

      // 2. Áp dụng filter (nếu có)
      const filteredImage = await applyFilterToDataUrl(rawImage, activeFilter);

      // 3. Nén ảnh bảo đảm dung lượng < 120KB
      const finalImage = await compressImageDataUrl(filteredImage, 1280, 0.78);

      const timestampNow = Date.now();
      const newPostId = `moment_${timestampNow}`;
      const uid = user?.uid || 'guest_user';
      const displayName = user?.displayName || 'Bạn';

      const subjectLabels = {
        chemistry: 'Hóa Học Ảo',
        physics: 'Vật Lý Lượng Tử',
        math: 'Toán Học 3D',
        biology: 'Sinh Học Di Truyền',
        arena: 'Đấu Trường Lượng Tử'
      };

      const newPost = {
        id: newPostId,
        userId: uid,
        authorId: uid,
        userName: displayName,
        avatar: '👑',
        avatarUrl: personalization.avatarUrl || '',
        avatarParts: personalization.avatarParts || null,
        title: rankInfo.title,
        elo: userElo,
        avatarFrame: personalization.avatarFrame || 'default',
        imageUrl: finalImage,
        caption: newCaption.trim(),
        subject: selectedSubject,
        subjectLabel: subjectLabels[selectedSubject] || 'STEM Lab',
        createdAt: 'Vừa xong',
        reactions: { heart: 0, brain: 0, fire: 0 },
        comments: [],
        timestamp: serverTimestamp(),
        clientTime: timestampNow
      };

      // Cập nhật lạc quan (Optimistic update) trên giao diện tức thì
      if (postDestination === 'both' || postDestination === 'moment') {
        setMoments((prev) => [newPost, ...prev]);
      }

      const newStorySlide = {
        id: `s_${timestampNow}`,
        imageUrl: finalImage,
        caption: newCaption.trim(),
        createdAt: 'Vừa xong',
        timestamp: timestampNow
      };

      if (postDestination === 'both' || postDestination === 'story') {
        setAllStories((prev) => {
          const existingUserIndex = prev.findIndex((s) => s.id === uid || s.userName === displayName);
          if (existingUserIndex >= 0) {
            const updated = [...prev];
            updated[existingUserIndex] = {
              ...updated[existingUserIndex],
              stories: [newStorySlide, ...(updated[existingUserIndex].stories || [])]
            };
            return updated;
          } else {
            return [
              {
                id: uid,
                userName: displayName,
                avatar: '👑',
                avatarUrl: personalization.avatarUrl || '',
                avatarParts: personalization.avatarParts || null,
                elo: userElo,
                title: rankInfo.title,
                activeFrame: personalization.avatarFrame || 'default',
                stories: [newStorySlide]
              },
              ...prev
            ];
          }
        });
      }

      // Reset Form & Đóng Modal
      setNewCaption('');
      setCustomImage(null);
      setIsPosting(false);
      playSound.success();
      showToast('Đã đăng khoảnh khắc thành công! 🎉');

      // Ghi đồng bộ lên Firestore
      if (postDestination === 'both' || postDestination === 'moment') {
        await setDoc(doc(db, 'moments', newPostId), newPost);
      }

      if (postDestination === 'both' || postDestination === 'story') {
        const storyDocRef = doc(db, 'stories', uid);
        const storySnap = await getDoc(storyDocRef);

        if (storySnap.exists()) {
          const currentStories = storySnap.data().stories || [];
          await setDoc(storyDocRef, {
            ...storySnap.data(),
            userId: uid,
            authorId: uid,
            userName: displayName,
            elo: userElo,
            title: rankInfo.title,
            activeFrame: personalization.avatarFrame || 'default',
            avatarUrl: personalization.avatarUrl || '',
            avatarParts: personalization.avatarParts || null,
            stories: [newStorySlide, ...currentStories.slice(0, 8)],
            updatedAt: serverTimestamp()
          }, { merge: true });
        } else {
          await setDoc(storyDocRef, {
            id: uid,
            userId: uid,
            authorId: uid,
            userName: displayName,
            avatar: '👑',
            avatarUrl: personalization.avatarUrl || '',
            avatarParts: personalization.avatarParts || null,
            elo: userElo,
            title: rankInfo.title,
            activeFrame: personalization.avatarFrame || 'default',
            stories: [newStorySlide],
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (err) {
      console.warn("Lỗi khi lưu bài viết lên Firestore (dữ liệu đã lưu cục bộ):", err);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Đăng tin chia sẻ nhanh sau khi xem trước & xác nhận
  const handleConfirmPendingShare = async (customCaption) => {
    if (!pendingShare) return;

    playSound.success();

    const timestampNow = Date.now();
    const newPostId = `moment_${timestampNow}`;
    const uid = user?.uid || 'guest_user';
    const displayName = user?.displayName || 'Bạn';

    const subjectLabels = {
      chemistry: 'Hóa Học Ảo',
      physics: 'Vật Lý Lượng Tử',
      math: 'Toán Học 3D',
      biology: 'Sinh Học Di Truyền',
      arena: 'Đấu Trường Lượng Tử'
    };

    const finalCaption = customCaption || pendingShare.caption;

    // Nén ảnh bảo đảm an toàn Firestore
    const compressedImage = await compressImageDataUrl(pendingShare.imageUrl, 1280, 0.78);

    const newPost = {
      id: newPostId,
      userId: uid,
      authorId: uid,
      userName: displayName,
      avatar: '👑',
      avatarUrl: personalization.avatarUrl || '',
      avatarParts: personalization.avatarParts || null,
      title: rankInfo.title,
      elo: pendingShare.elo || userElo,
      avatarFrame: personalization.avatarFrame || 'default',
      imageUrl: compressedImage,
      caption: finalCaption,
      subject: pendingShare.subject || 'chemistry',
      subjectLabel: subjectLabels[pendingShare.subject] || pendingShare.subjectLabel || 'STEM Lab',
      createdAt: 'Vừa xong',
      reactions: { heart: 0, brain: 0, fire: 0 },
      comments: [],
      timestamp: serverTimestamp(),
      clientTime: timestampNow
    };

    // Reset tin chờ xác nhận
    setPendingShare(null);
    deletePendingShare();

    // Cập nhật lạc quan
    setMoments((prev) => [newPost, ...prev]);
    showToast('Đã xác nhận chia sẻ chiến tích! 🎉');

    try {
      // 1. Lưu bài viết Moments mới lên Firestore
      await setDoc(doc(db, 'moments', newPostId), newPost);

      // 2. Lưu tin lên danh sách Stories chung của cộng đồng trên Firestore
      const storyDocRef = doc(db, 'stories', uid);
      const storySnap = await getDoc(storyDocRef);

      const newStorySlide = {
        id: `s_${timestampNow}`,
        imageUrl: compressedImage,
        caption: finalCaption,
        createdAt: 'Vừa xong',
        timestamp: timestampNow
      };

      if (storySnap.exists()) {
        const currentStories = storySnap.data().stories || [];
        await setDoc(storyDocRef, {
          ...storySnap.data(),
          userId: uid,
          authorId: uid,
          userName: displayName,
          elo: pendingShare.elo || userElo,
          title: rankInfo.title,
          activeFrame: personalization.avatarFrame || 'default',
          avatarUrl: personalization.avatarUrl || '',
          avatarParts: personalization.avatarParts || null,
          stories: [newStorySlide, ...currentStories.slice(0, 8)],
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        await setDoc(storyDocRef, {
          id: uid,
          userId: uid,
          authorId: uid,
          userName: displayName,
          avatar: '👑',
          avatarUrl: personalization.avatarUrl || '',
          avatarParts: personalization.avatarParts || null,
          elo: pendingShare.elo || userElo,
          title: rankInfo.title,
          activeFrame: personalization.avatarFrame || 'default',
          stories: [newStorySlide],
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.warn("Lỗi khi xác nhận lưu bài viết lên Firestore:", err);
    }
  };

  // Hủy tin chia sẻ tự động
  const handleCancelPendingShare = () => {
    deletePendingShare();
    setPendingShare(null);
  };

  // Đổi Subject đổi cả ảnh mẫu phòng lab
  const handleSubjectChange = (subject) => {
    setSelectedSubject(subject);
    setSelectedTemplate(LAB_TEMPLATES[subject][0]);
  };

  // Helpers
  const getFrameColorClass = (frame) => {
    switch (frame) {
      case 'neon_fire':
        return 'from-rose-500 via-purple-500 to-pink-500';
      case 'cyan_tech':
        return 'from-cyan-400 via-blue-500 to-indigo-500';
      case 'cosmic_nebula':
        return 'from-purple-500 via-violet-500 to-indigo-500';
      case 'blackhole_gravity':
        return 'from-indigo-900 via-purple-900 to-zinc-900';
      case 'antimatter_era':
        return 'from-fuchsia-500 via-pink-600 to-rose-500';
      case 'multiverse_overlord':
        return 'from-cyan-400 via-fuchsia-500 to-pink-500';
      case 'top_1_sovereign':
        return 'from-amber-400 via-yellow-200 to-amber-500';
      case 'gold_vip':
        return 'from-amber-400 via-orange-400 to-yellow-500';
      case 'top_100_silver':
        return 'from-slate-400 via-zinc-200 to-slate-500';
      default:
        return 'from-pink-500 to-purple-500';
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-6 md:p-8 max-w-4xl mx-auto pb-24 relative overflow-hidden select-none">
      
      {/* Hiệu ứng mây hạt bụi neon nền cực mượt */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-accent-pink/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-success/5 rounded-full filter blur-[100px] pointer-events-none" />

      {/* Header Khoảnh Khắc */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-5 h-5 text-accent-pink animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent-pink">STEM Social Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">STEM Stories</h1>
          <p className="text-xs text-text-secondary">Chia sẻ khoảnh khắc phòng lab và vinh hiển đấu trường của bạn.</p>
        </div>

        <button 
          onClick={() => {
            playSound.click();
            setIsPosting(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-pink to-accent-purple hover:opacity-90 text-white text-xs font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent-pink/10 border border-border-theme"
        >
          <Plus className="w-4 h-4" /> Chia sẻ ngay
        </button>
      </div>

      {/* ================== STORIES HEADER BAR ================== */}
      <div className="relative z-10 mb-8 bg-white/[0.02] backdrop-blur-xl border border-border-theme p-4 rounded-3xl overflow-x-auto flex gap-4 scrollbar-none shadow-xl">
        
        {/* Nút cộng story của bản thân nếu chưa có tin */}
        {!allStories.some(s => s.userName === (user?.displayName || 'Bạn')) && (
          <div className="flex flex-col items-center justify-center shrink-0 cursor-pointer" onClick={() => setIsPosting(true)}>
            <div className="w-16 h-16 rounded-full bg-white/[0.04] border-2 border-dashed border-text-secondary flex items-center justify-center hover:border-accent-pink/50 hover:bg-white/[0.08] transition-all relative">
              <span className="text-2xl text-text-secondary">👑</span>
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-accent-pink border border-bg-primary rounded-full flex items-center justify-center">
                <Plus className="w-3 h-3 text-white" />
              </div>
            </div>
            <span className="text-[10px] font-semibold text-text-secondary mt-2">Bản tin của tôi</span>
          </div>
        )}

        {/* Danh sách Stories hoạt động */}
        {allStories.map((storyUser, index) => (
          <div 
            key={storyUser.id}
            onClick={() => {
              playSound.click();
              setActiveStoryIndex(index);
              setStorySubIndex(0);
            }}
            className="flex flex-col items-center shrink-0 cursor-pointer group"
          >
            <div className="relative">
              {/* Vòng Neon Gradient xoay quyến rũ */}
              <div className={`absolute inset-[-3px] rounded-full bg-gradient-to-tr ${getFrameColorClass(storyUser.activeFrame)} opacity-80 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-700 blur-[2px]`} />
              
              <div className="w-[66px] h-[66px] rounded-full bg-bg-tertiary border-[3px] border-bg-primary flex items-center justify-center text-3xl relative z-10 select-none overflow-hidden">
                {storyUser.avatarUrl ? (
                  storyUser.avatarUrl === 'custom-avatar' ? (
                    <STEMAvatarSVG parts={storyUser.avatarParts} className="w-full h-full transform scale-90" />
                  ) : storyUser.avatarUrl.startsWith('http') || storyUser.avatarUrl.startsWith('data:image/') ? (
                    <img src={storyUser.avatarUrl} alt={storyUser.userName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="select-none text-2xl">{storyUser.avatarUrl}</span>
                  )
                ) : (
                  storyUser.avatar
                )}
              </div>

              {/* Tag ELO nhỏ gắn góc */}
              <div className="absolute -bottom-1 -right-1 z-20 px-1.5 py-0.5 bg-bg-primary/90 border border-border-theme rounded-full text-[8px] font-extrabold text-amber-400 scale-90">
                {storyUser.elo}
              </div>
            </div>
            
            <span className="text-[10px] font-bold text-text-secondary mt-2 text-ellipsis overflow-hidden w-16 text-center whitespace-nowrap group-hover:text-text-primary transition-colors">
              {storyUser.userName}
            </span>
          </div>
        ))}
      </div>

      {/* ================== MOMENTS FEED (DÒNG THỜI GIAN) ================== */}
      <div className="space-y-6 relative z-10">
        {moments.map((moment) => (
          <div 
            key={moment.id} 
            className="bg-bg-secondary/80 backdrop-blur-xl border border-border-theme rounded-3xl p-6 shadow-2xl relative overflow-hidden group/card"
          >
            {/* Viền mờ tỏa sáng khi hover vào thẻ bài */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-pink/0 via-accent-purple/0 to-success/0 group-hover/card:from-accent-pink/5 group-hover/card:to-success/5 transition-all duration-700 pointer-events-none" />

            {/* Header Thẻ bài */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <AvatarFrame frame={moment.avatarFrame} className="w-11 h-11 text-xl">
                  {moment.avatarUrl ? (
                    moment.avatarUrl === 'custom-avatar' ? (
                      <STEMAvatarSVG parts={moment.avatarParts} className="w-full h-full transform scale-90" />
                    ) : moment.avatarUrl.startsWith('http') || moment.avatarUrl.startsWith('data:image/') ? (
                      <img src={moment.avatarUrl} alt={moment.userName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="select-none text-xl">{moment.avatarUrl}</span>
                    )
                  ) : (
                    moment.avatar
                  )}
                </AvatarFrame>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-text-primary">{moment.userName}</span>
                    <span className="text-[9px] font-extrabold text-amber-400 px-1.5 py-0.5 bg-amber-400/10 border border-amber-400/20 rounded-full">
                      🏆 {moment.elo} ELO
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-text-secondary mt-0.5">
                    <span>{moment.title}</span>
                    <span>•</span>
                    <span>{moment.createdAt}</span>
                  </div>
                </div>
              </div>

              {/* Tag Môn Học & Nút Xóa (nếu là chính chủ hoặc admin) */}
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-white/[0.04] border border-border-theme rounded-full text-[9px] font-extrabold text-accent-pink uppercase tracking-widest">
                  {moment.subjectLabel}
                </div>
                {(user?.uid === moment.userId || user?.uid === moment.authorId || user?.email === 'admin123@gmail.com') && (
                  <button
                    onClick={() => handleDeleteMoment(moment.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all active:scale-95 cursor-pointer"
                    title="Xóa bài viết này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Caption chia sẻ */}
            <p className="text-xs text-text-secondary leading-relaxed mb-4 select-text selection:bg-accent-pink/30 selection:text-text-primary">
              {moment.caption}
            </p>

            {/* Ảnh chụp màn hình lab hoặc thành quả */}
            <div 
              onClick={() => setLightboxImage(moment.imageUrl)}
              className="h-64 rounded-2xl overflow-hidden relative border border-border-theme mb-4 bg-bg-tertiary cursor-zoom-in group"
            >
              <img 
                src={moment.imageUrl} 
                alt="Workspace screenshot" 
                className="w-full h-full object-cover group-hover/card:scale-102 transition-transform duration-700 cursor-zoom-in" 
              />
              {/* Bóng mờ tối dần ở đáy */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              
              {/* Nút bấm tải ảnh & phóng to lab */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadDataUrl(moment.imageUrl, `STEM_Moment_${moment.id}.jpg`);
                    playSound.success();
                    showToast('Đang tải ảnh về máy... 💾');
                  }}
                  className="px-2 py-1 bg-black/60 hover:bg-black/80 border border-white/10 rounded-lg text-[9px] font-bold text-cyan-300 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  title="Tải ảnh này về máy"
                >
                  <Download className="w-3 h-3" /> Tải về
                </button>
                <div className="px-2 py-1 bg-black/50 border border-border-theme rounded-lg text-[9px] font-bold text-text-secondary flex items-center gap-1">
                  <Camera className="w-3 h-3" /> Phóng to
                </div>
              </div>
            </div>

            {/* Bộ điều khiển biểu cảm (Reaction bar) */}
            <div className="flex items-center justify-between border-t border-b border-border-theme py-3 mb-4">
              <div className="flex items-center gap-3 sm:gap-4">
                
                {/* Thả tim */}
                <button 
                  onClick={(e) => handleReact(moment.id, 'heart', e)}
                  className="flex items-center gap-1.5 text-text-secondary hover:text-rose-500 text-xs font-bold transition-all hover:scale-110 cursor-pointer"
                >
                  <Heart className="w-4 h-4 text-rose-500" fill="currentColor" />
                  <span>{moment.reactions?.heart || 0}</span>
                </button>

                {/* Thả trí tuệ */}
                <button 
                  onClick={(e) => handleReact(moment.id, 'brain', e)}
                  className="flex items-center gap-1.5 text-text-secondary hover:text-cyan-400 text-xs font-bold transition-all hover:scale-110 cursor-pointer"
                >
                  <Brain className="w-4 h-4 text-cyan-400" />
                  <span>{moment.reactions?.brain || 0}</span>
                </button>

                {/* Thả kích nổ */}
                <button 
                  onClick={(e) => handleReact(moment.id, 'fire', e)}
                  className="flex items-center gap-1.5 text-text-secondary hover:text-orange-500 text-xs font-bold transition-all hover:scale-110 cursor-pointer"
                >
                  <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span>{moment.reactions?.fire || 0}</span>
                </button>

                {/* Nút Chia sẻ liên kết */}
                <button 
                  onClick={() => handleShareMoment(moment.id)}
                  className="flex items-center gap-1.5 text-text-secondary hover:text-purple-400 text-xs font-bold transition-all hover:scale-105 cursor-pointer"
                  title="Sao chép liên kết"
                >
                  <Share2 className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Chia sẻ</span>
                </button>
              </div>

              {/* Đếm số bình luận */}
              <div className="flex items-center gap-1.5 text-text-secondary text-[11px] font-bold">
                <MessageSquare className="w-4 h-4" />
                <span>{moment.comments?.length || 0} bình luận</span>
              </div>
            </div>

            {/* Danh sách bình luận */}
            {(moment.comments?.length || 0) > 0 && (
              <div className="space-y-2 mb-4 bg-white/[0.01] border border-border-theme rounded-2xl p-3">
                {moment.comments.map((comment) => (
                  <div key={comment.id} className="text-[11px] text-text-secondary leading-relaxed select-text">
                    <span className="font-extrabold text-text-primary mr-1.5">{comment.userName}:</span>
                    {comment.text}
                  </div>
                ))}
              </div>
            )}

            {/* Thanh biểu cảm Emoji nhanh cho bình luận */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3 select-none">
              <span className="text-[10px] text-text-secondary font-mono mr-1 shrink-0">Bình luận Emoji:</span>
              {['🔥', '❤️', '👏', '🧪', '🚀', '💯', '🧠', '😍', '🎉', '💪', '✨'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={(e) => {
                    playSound.click();
                    const currentVal = commentInputs[moment.id] || '';
                    setCommentInputs({ ...commentInputs, [moment.id]: currentVal + emoji });
                    triggerFloatingEmoji(emoji, e.clientX, e.clientY - 30);
                  }}
                  className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.1] border border-border-theme hover:border-pink-500/40 rounded-xl text-xs transition-all hover:scale-110 active:scale-95 shrink-0"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Viết bình luận nhanh */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const inputEl = e.currentTarget.elements.namedItem('commentInput');
                const val = inputEl ? inputEl.value : (commentInputs[moment.id] || '');
                handleAddComment(moment.id, val);
              }}
              className="flex items-center gap-2 relative"
            >
              <input 
                name="commentInput"
                type="text" 
                placeholder="Viết câu trả lời..." 
                value={commentInputs[moment.id] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setCommentInputs((prev) => ({ ...prev, [moment.id]: val }));
                }}
                className="flex-1 bg-bg-tertiary text-xs text-text-primary rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-accent-pink/50 border border-border-theme transition-all placeholder:text-text-secondary"
              />
              <button 
                type="submit"
                className="p-2.5 bg-accent-pink hover:bg-accent-pink/90 text-white rounded-xl transition-all active:scale-90"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ))}
      </div>

      {/* ================== FULLSCREEN STORY VIEWER MODAL ================== */}
      {mounted && createPortal(
        <AnimatePresence>
          {activeStoryIndex !== null && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999996] bg-black/95 flex items-center justify-center"
            >
              {/* Lớp phủ click đóng */}
              <div className="absolute inset-0 z-0 cursor-default" onClick={handleCloseStory} />

              <div className="relative w-full max-w-md h-full md:h-[90vh] md:max-h-[800px] md:rounded-3xl bg-bg-primary border border-border-theme overflow-hidden flex flex-col justify-between z-10 shadow-2xl">
                
                {/* Thanh tiến trình thời gian ở đỉnh đầu */}
                <div className="absolute top-4 left-4 right-4 z-50 flex gap-1">
                  {allStories[activeStoryIndex]?.stories.map((story, i) => (
                    <div key={story.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-accent-pink to-accent-purple transition-all duration-75"
                        style={{ 
                          width: i === storySubIndex ? `${storyProgress}%` : i < storySubIndex ? '100%' : '0%' 
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Thông tin User trong Story */}
                <div className="absolute top-8 left-4 right-4 z-50 flex items-center justify-between">
                  <div className="flex items-center gap-3 animate-none">
                    <div className="w-9 h-9 rounded-full bg-bg-secondary border border-border-theme flex items-center justify-center text-xl shadow-lg overflow-hidden">
                      {allStories[activeStoryIndex]?.avatarUrl ? (
                        allStories[activeStoryIndex]?.avatarUrl === 'custom-avatar' ? (
                          <STEMAvatarSVG parts={allStories[activeStoryIndex]?.avatarParts} className="w-full h-full transform scale-90" />
                        ) : allStories[activeStoryIndex]?.avatarUrl.startsWith('http') || allStories[activeStoryIndex]?.avatarUrl.startsWith('data:image/') ? (
                          <img src={allStories[activeStoryIndex]?.avatarUrl} alt={allStories[activeStoryIndex]?.userName} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="select-none text-sm">{allStories[activeStoryIndex]?.avatarUrl}</span>
                        )
                      ) : (
                        allStories[activeStoryIndex]?.avatar
                      )}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white">{allStories[activeStoryIndex]?.userName}</span>
                        <span className="text-[8px] font-extrabold text-amber-400 px-1 py-0.2 bg-amber-400/10 border border-amber-400/20 rounded-full">
                          🏆 {allStories[activeStoryIndex]?.elo} ELO
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-400 mt-0.5">{allStories[activeStoryIndex]?.stories[storySubIndex]?.createdAt}</p>
                    </div>
                  </div>

                  {/* Bộ điều khiển Story: Chỉ số, Play/Pause, Tải về, Đóng */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9.5px] font-mono font-bold text-zinc-300 bg-black/50 px-2 py-0.5 rounded-full border border-white/10 select-none">
                      {storySubIndex + 1}/{allStories[activeStoryIndex]?.stories?.length || 1}
                    </span>

                    <button 
                      onClick={() => {
                        playSound.click();
                        setIsViewerPlaying(p => !p);
                      }}
                      className="p-1.5 bg-black/40 hover:bg-black/70 rounded-full text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      title={isViewerPlaying ? 'Tạm dừng (Phím Space)' : 'Tiếp tục phát'}
                    >
                      {isViewerPlaying ? <Pause className="w-3.5 h-3.5 text-amber-300" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>

                    <button 
                      onClick={() => {
                        const curUrl = allStories[activeStoryIndex]?.stories[storySubIndex]?.imageUrl;
                        if (curUrl) {
                          downloadDataUrl(curUrl, `STEM_Story_Slide_${Date.now()}.jpg`);
                          playSound.success();
                          showToast('Đang tải ảnh story về máy... 💾');
                        }
                      }}
                      className="p-1.5 bg-black/40 hover:bg-black/70 rounded-full text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      title="Tải ảnh story này"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                    </button>

                    <button 
                      onClick={handleCloseStory}
                      className="p-1.5 bg-black/40 hover:bg-black/70 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Đóng Story"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Vùng Ảnh & Trượt chạm */}
                <div 
                  className="flex-1 relative flex items-center justify-center bg-black cursor-pointer"
                  onMouseDown={() => setIsHolding(true)}
                  onMouseUp={() => setIsHolding(false)}
                  onTouchStart={() => setIsHolding(true)}
                  onTouchEnd={() => setIsHolding(false)}
                >
                  <img 
                    src={allStories[activeStoryIndex]?.stories[storySubIndex]?.imageUrl} 
                    alt="Story moment" 
                    className="w-full h-full object-contain"
                  />

                  {/* Các nút bấm điều hướng trái/phải cực lớn ẩn */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1/4 z-30 cursor-pointer" 
                    onClick={(e) => { e.stopPropagation(); handlePrevStory(); }}
                  />
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1/4 z-30 cursor-pointer" 
                    onClick={(e) => { e.stopPropagation(); handleNextStory(); }}
                  />

                  {/* Nút bấm mũi tên điều hướng hiển thị PC */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handlePrevStory(); }}
                    className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center z-40 text-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleNextStory(); }}
                    className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center z-40 text-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Bottom Caption & quick reactions */}
                <div className="p-6 bg-gradient-to-t from-black via-black/90 to-transparent pt-12 relative z-50">
                  <p className="text-xs text-white leading-relaxed mb-6 text-center select-text">
                    {allStories[activeStoryIndex]?.stories[storySubIndex]?.caption}
                  </p>

                  <div className="flex justify-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {['❤️', '🔥', '👏', '🧪', '🚀', '💯', '🧠', '😍', '🎉', '💥'].map((emoji) => (
                      <button 
                        key={emoji}
                        onClick={(e) => {
                          if (emoji === '💥' || emoji === '🔥') playSound.explosion();
                          else playSound.click();
                          triggerFloatingEmoji(emoji, e.clientX, e.clientY - 40);
                        }}
                        className="w-10 h-10 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-full flex items-center justify-center text-lg shadow-xl shrink-0 border border-white/10"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ================== CREATE STORY & MOMENTS STUDIO MODAL ================== */}
      {mounted && createPortal(
        <AnimatePresence>
          {isPosting && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999997] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none overflow-y-auto"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-gradient-to-b from-[#181335] via-[#0f0c22] to-[#070511] border border-purple-500/30 rounded-3xl w-full max-w-2xl p-5 sm:p-7 shadow-2xl relative overflow-hidden text-left my-auto ring-1 ring-purple-400/20"
              >
                {/* Laser grid nền */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                {/* Header Modal */}
                <div className="relative z-10 flex items-center justify-between mb-5 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-pink-500/30">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                        STEM Story & Moment Studio
                      </h3>
                      <p className="text-[10px] text-zinc-400">Chia sẻ khoảnh khắc học tập, vinh hiển và mô phỏng 3D</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsPosting(false)}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 3 Tab chọn nguồn ảnh */}
                <div className="relative z-10 grid grid-cols-3 gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      playSound.click();
                      setActiveCreationTab('templates');
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeCreationTab === 'templates'
                        ? 'bg-purple-600/30 border-purple-400 text-white shadow-md shadow-purple-600/20'
                        : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>🔬 Thí Nghiệm & Lab</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound.click();
                      setActiveCreationTab('upload');
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeCreationTab === 'upload'
                        ? 'bg-pink-600/30 border-pink-400 text-white shadow-md shadow-pink-600/20'
                        : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-pink-400" />
                    <span>Tải Lên Từ Máy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound.click();
                      setActiveCreationTab('capture');
                      handleCaptureFromStory();
                    }}
                    disabled={isCapturingFromStory}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeCreationTab === 'capture'
                        ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-md shadow-cyan-600/20'
                        : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isCapturingFromStory ? 'Đang chụp...' : 'Chụp Màn Hình'}</span>
                  </button>
                </div>

                {/* Nội dung Tab 1: Mẫu Thí Nghiệm & Đấu Trường */}
                {activeCreationTab === 'templates' && (
                  <div className="relative z-10 mb-4 bg-zinc-900/60 border border-white/5 rounded-2xl p-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-2.5">
                      {Object.keys(LAB_TEMPLATES).map((subject) => {
                        const labelMap = { 
                          chemistry: '🧪 Hóa Học', 
                          physics: '⚡ Vật Lý', 
                          math: '📐 Toán 3D', 
                          biology: '🧬 Sinh Học',
                          arena: '🏆 Đấu Trường'
                        };
                        return (
                          <button
                            key={subject}
                            type="button"
                            onClick={() => handleSubjectChange(subject)}
                            className={`py-1 px-3 text-[10px] font-bold rounded-full border transition-all shrink-0 cursor-pointer ${
                              selectedSubject === subject 
                                ? 'bg-pink-500/25 border-pink-400 text-pink-300 shadow-sm' 
                                : 'bg-black/30 border-white/5 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {labelMap[subject] || subject}
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                      {(LAB_TEMPLATES[selectedSubject] || []).map((template) => (
                        <div 
                          key={template.id}
                          onClick={() => {
                            playSound.click();
                            setCustomImage(null);
                            setSelectedTemplate(template);
                          }}
                          className={`h-20 rounded-xl overflow-hidden relative cursor-pointer border-2 transition-all group ${
                            !customImage && selectedTemplate.id === template.id 
                              ? 'border-pink-500 shadow-md shadow-pink-500/25 scale-98' 
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={template.url} alt="template" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-1.5 flex flex-col justify-end">
                            <span className="text-[8px] font-black text-white truncate">{template.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nội dung Tab 2: Tải ảnh tùy chỉnh */}
                {activeCreationTab === 'upload' && (
                  <div className="relative z-10 mb-4 bg-zinc-900/60 border border-white/5 rounded-2xl p-4">
                    {customImage ? (
                      <div className="relative w-full h-36 rounded-xl overflow-hidden border border-pink-500 shadow-inner">
                        <img src={customImage} alt="custom upload" className="w-full h-full object-contain bg-black" />
                        <button 
                          onClick={() => setCustomImage(null)}
                          className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors active:scale-90 cursor-pointer shadow-md"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-full h-32 rounded-xl border-2 border-dashed border-white/10 hover:border-pink-500/50 bg-black/30 hover:bg-black/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group">
                        <Upload className="w-6 h-6 text-zinc-400 group-hover:text-pink-400 transition-colors" />
                        <span className="text-xs font-bold text-zinc-300 group-hover:text-white uppercase tracking-wider">
                          Chọn ảnh hoặc Kéo thả vào đây
                        </span>
                        <span className="text-[9px] text-zinc-500">
                          Hệ thống tự động nén thông minh HD (~90KB) bảo đảm tốc độ siêu tốc
                        </span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = async (event) => {
                                const compressed = await compressImageDataUrl(event.target.result, 1280, 0.78);
                                setCustomImage(compressed);
                                playSound.success();
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                )}

                {/* Nội dung Tab 3: Chụp ảnh màn hình */}
                {activeCreationTab === 'capture' && (
                  <div className="relative z-10 mb-4 bg-zinc-900/60 border border-white/5 rounded-2xl p-4 text-center">
                    {customImage ? (
                      <div className="relative w-full h-36 rounded-xl overflow-hidden border border-cyan-400 shadow-inner">
                        <img src={customImage} alt="captured screenshot" className="w-full h-full object-contain bg-black" />
                        <div className="absolute top-2 right-2 flex gap-1.5">
                          <button
                            type="button"
                            onClick={handleCaptureFromStory}
                            className="px-2.5 py-1 bg-black/70 hover:bg-black/90 border border-white/20 rounded-lg text-[9.5px] font-bold text-cyan-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3 h-3" /> Chụp lại
                          </button>
                          <button 
                            onClick={() => setCustomImage(null)}
                            className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 flex flex-col items-center justify-center">
                        <button
                          type="button"
                          onClick={handleCaptureFromStory}
                          disabled={isCapturingFromStory}
                          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>{isCapturingFromStory ? 'Đang Chụp Màn Hình...' : 'Bấm Để Chụp Màn Hình Nhanh'}</span>
                        </button>
                        <p className="text-[10px] text-zinc-400 mt-2">Chụp toàn bộ giao diện làm việc hiện tại tức thì không bị lag</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Thanh Lựa Chọn Bộ Lọc Màu Sci-Fi */}
                <div className="relative z-10 mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <Palette className="w-3.5 h-3.5 text-amber-400" /> Chọn Bộ Lọc Sci-Fi:
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {FILTERS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          playSound.click();
                          setActiveFilter(f.id);
                        }}
                        className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                          activeFilter === f.id
                            ? 'bg-purple-600/40 border-purple-400 text-white shadow-md shadow-purple-600/20'
                            : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        <span className="text-xs">{f.icon}</span>
                        <span className="text-[8.5px] truncate w-full text-center">{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tùy Chọn Đích Đến */}
                <div className="relative z-10 mb-3 grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={postDestination === 'both' || postDestination === 'story'}
                      onChange={(e) => {
                        const curStory = postDestination === 'both' || postDestination === 'story';
                        const curMoment = postDestination === 'both' || postDestination === 'moment';
                        const nextStory = e.target.checked;
                        if (nextStory && curMoment) setPostDestination('both');
                        else if (nextStory) setPostDestination('story');
                        else if (curMoment) setPostDestination('moment');
                        else setPostDestination('moment'); // Giữ ít nhất 1
                      }}
                      className="rounded accent-pink-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="leading-tight">
                      <div className="font-bold text-white text-[10.5px]">Đăng vào Story 24h</div>
                      <div className="text-[8px] text-zinc-400">Hiển thị ở thanh Story trên đầu</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={postDestination === 'both' || postDestination === 'moment'}
                      onChange={(e) => {
                        const curStory = postDestination === 'both' || postDestination === 'story';
                        const curMoment = postDestination === 'both' || postDestination === 'moment';
                        const nextMoment = e.target.checked;
                        if (curStory && nextMoment) setPostDestination('both');
                        else if (nextMoment) setPostDestination('moment');
                        else if (curStory) setPostDestination('story');
                        else setPostDestination('story'); // Giữ ít nhất 1
                      }}
                      className="rounded accent-purple-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="leading-tight">
                      <div className="font-bold text-white text-[10.5px]">Đăng lên Bảng Tin Moments</div>
                      <div className="text-[8px] text-zinc-400">Hiển thị trên dòng thời gian</div>
                    </div>
                  </label>
                </div>

                {/* Nhập Caption & Stickers */}
                <div className="relative z-10 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      Cảm Nghĩ / Trải Nghiệm Của Bạn:
                    </label>
                    <span className="text-[9px] font-mono text-zinc-500">{newCaption.length}/500</span>
                  </div>
                  <textarea 
                    rows="2"
                    maxLength={500}
                    placeholder="Ghi chú thành tựu phản ứng, ELO, hay mẹo giải toán... (ví dụ: pH đạt 7.1 tuyệt vời!)"
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                    className="w-full bg-zinc-900/80 border border-purple-500/30 focus:border-pink-500/60 rounded-xl p-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-all resize-none shadow-inner"
                  />

                  {/* Thanh Sticker nhanh */}
                  <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-[9px] text-zinc-500 shrink-0 font-bold">Gắn nhanh:</span>
                    {QUICK_STICKERS.map((stk) => (
                      <button
                        key={stk}
                        type="button"
                        onClick={() => {
                          playSound.click();
                          setNewCaption((prev) => (prev ? `${prev} ${stk}` : stk));
                        }}
                        className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xs shrink-0 transition-transform active:scale-90 cursor-pointer"
                      >
                        {stk}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nút Đăng */}
                <button 
                  onClick={handleCreatePost}
                  disabled={!newCaption.trim() || isSubmittingPost}
                  className={`relative z-10 w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shadow-lg ${
                    newCaption.trim() && !isSubmittingPost
                      ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-pink-500/25 border border-pink-400/30'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                  }`}
                >
                  {isSubmittingPost ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin text-white" />
                      <span>Đang Xuất Bản Lập Tức...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
                      <span>Xuất Bản Lên STEM Stories & Bảng Tin</span>
                    </>
                  )}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ================== PENDING SHARE CONFIRMATION MODAL ================== */}
      {mounted && createPortal(
        <AnimatePresence>
          {pendingShare && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999998] bg-black/85 flex items-center justify-center p-4 cursor-default select-none"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-bg-secondary border border-border-theme rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden"
              >
                {/* Glow accent */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-accent-pink via-accent-purple to-cyan-500 rounded-full" />

                {/* Header */}
                <div className="text-center mb-6 text-left">
                  <span className="text-[9px] font-black text-accent-pink uppercase tracking-widest block mb-1">
                    Đấu Trường Vinh Danh
                  </span>
                  <h3 className="text-sm font-black text-text-primary">Xác Nhận Chia Sẻ Chiến Tích</h3>
                </div>

                {/* Preview Card */}
                <div className="bg-bg-tertiary border border-border-theme rounded-2xl p-4 mb-6 relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-3 text-left">
                    <div className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-lg border border-border-theme">
                      👑
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xs font-extrabold text-text-primary">{user?.displayName || 'Bạn'}</span>
                        <span className="text-[8px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full">
                          +{pendingShare.rewardElo} ELO
                        </span>
                      </div>
                      <span className="text-[8px] text-text-secondary block uppercase font-black tracking-widest">{pendingShare.subjectLabel}</span>
                    </div>
                  </div>

                  {/* Simulated screenshot / visual score badge */}
                  <div className="w-full h-32 rounded-xl overflow-hidden relative border border-border-theme mb-3 bg-bg-primary flex items-center justify-center">
                    <img src={pendingShare.imageUrl} alt="preview" className="w-full h-full object-contain" />
                    {(pendingShare.rewardElo > 0 || pendingShare.rewardExp > 0) ? (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-2">
                        <span className="text-[9px] font-black text-accent-pink uppercase tracking-widest mb-1">Thi đấu hoàn tất</span>
                        <span className="text-lg font-black text-white tracking-tight">Đạt {pendingShare.score}/{pendingShare.totalQuestions} Điểm</span>
                        <span className="text-[9px] text-zinc-300 font-bold mt-1">EXP Nhận được: +{pendingShare.rewardExp} EXP</span>
                      </div>
                    ) : (
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 border border-border-theme rounded-md text-[8px] font-black text-accent-pink uppercase tracking-wider flex items-center gap-1">
                        📸 Ảnh chụp màn hình
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-text-secondary leading-normal italic select-text bg-white/[0.01] border border-border-theme p-2.5 rounded-xl text-left">
                    "{pendingShare.caption}"
                  </div>
                </div>

                {/* Custom Caption Input */}
                <div className="mb-6 text-left">
                  <label className="text-[9px] font-extrabold uppercase tracking-widest text-text-secondary block mb-2">Tùy Chỉnh Caption chia sẻ</label>
                  <textarea 
                    rows="2"
                    placeholder="Viết cảm nghĩ chiến thắng của bạn..."
                    defaultValue={pendingShare.caption}
                    id="pending-share-caption-input"
                    className="w-full bg-bg-tertiary border border-border-theme focus:border-accent-pink/30 rounded-xl p-3 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none transition-all resize-none"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button 
                    onClick={handleCancelPendingShare}
                    className="flex-1 py-2.5 bg-bg-tertiary hover:bg-bg-tertiary/80 text-text-secondary hover:text-text-primary text-xs font-bold rounded-xl border border-border-theme transition-all active:scale-95"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={() => {
                      const inputVal = document.getElementById('pending-share-caption-input')?.value;
                      handleConfirmPendingShare(inputVal);
                    }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-accent-pink to-accent-purple hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-lg shadow-accent-pink/10 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" /> Xác nhận đăng tin
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Hiệu ứng hạt emoji bay lên (Floating bubble reactions) */}
      <AnimatePresence>
        {floatingEmojis.map((e) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 1, scale: 0.8, y: 0 }}
            animate={{ opacity: 0, scale: 1.5, y: -100, rotate: Math.random() * 30 - 15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="fixed pointer-events-none z-[99999] text-3xl font-bold select-none"
            style={{ left: e.x, top: e.y }}
          >
            {e.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Fullscreen Lightbox Image Viewer */}
      {mounted && createPortal(
        <AnimatePresence>
          {lightboxImage && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxImage(null)}
              className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-md flex items-center justify-center cursor-zoom-out p-4"
            >
              <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <motion.img 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  src={lightboxImage} 
                  alt="Enlarged screenshot" 
                  className="max-w-full max-h-full object-contain rounded-2xl border border-white/10 shadow-2xl"
                />
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if (lightboxImage) {
                        downloadDataUrl(lightboxImage, `STEM_HUB_Image_${Date.now()}.jpg`);
                        playSound.success();
                        showToast('Đang tải ảnh về máy... 💾');
                      }
                    }}
                    className="p-3 bg-black/50 hover:bg-black/80 rounded-full text-white/70 hover:text-white transition-all border border-white/10 cursor-pointer"
                    title="Tải ảnh này về máy"
                  >
                    <Download className="w-5 h-5 text-cyan-400" />
                  </button>
                  <button 
                    onClick={() => setLightboxImage(null)}
                    className="p-3 bg-black/50 hover:bg-black/80 rounded-full text-white/70 hover:text-white transition-all border border-white/10 cursor-pointer"
                    title="Đóng xem ảnh"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999999] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-white/20 animate-bounce pointer-events-none select-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
