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
  Lock,
  Compass,
  Trophy,
  Activity,
  Upload
} from 'lucide-react';
import { AvatarFrame } from '@/components/atoms/AvatarFrame';
import STEMAvatarSVG from '@/components/atoms/STEMAvatarSVG';
import { useAppStore } from '@/store/useAppStore';
import { playSound } from '@/lib/sound';
import { getRankInfo } from '@/lib/matchmaker';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, getDocs, updateDoc, onSnapshot, collection, query, orderBy, limit, addDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { getPendingShare, deletePendingShare } from '@/lib/indexedDB';

// Mẫu ảnh mô phỏng chất lượng cao cho phòng lab để đảm bảo KHÔNG DÙNG PLACEHOLDER
const LAB_TEMPLATES = {
  chemistry: [
    {
      id: 'chem_1',
      title: 'Điện phân dung dịch CuSO₄',
      desc: 'Tia lửa điện lượng tử phóng qua điện cực cực đồng.',
      url: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?q=80&w=600&auto=format&fit=crop',
    },
    {
      id: 'chem_2',
      title: 'Phản ứng trung hòa siêu đẳng',
      desc: 'Dung dịch đổi màu tím hồng phenolphthalein tuyệt đẹp.',
      url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop',
    }
  ],
  physics: [
    {
      id: 'phys_1',
      title: 'Giao thoa ánh sáng Y-âng',
      desc: 'Hệ vân sáng tối đối xứng hoàn mỹ.',
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop',
    },
    {
      id: 'phys_2',
      title: 'Mạch điện DC Lượng Tử',
      desc: 'Bản mạch lắp ráp cân bằng hiệu điện thế.',
      url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop',
    }
  ],
  math: [
    {
      id: 'math_1',
      title: 'Tọa độ Không gian 3D',
      desc: 'Vẽ hình chóp cụt xiên qua tâm O.',
      url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=600&auto=format&fit=crop',
    }
  ],
  biology: [
    {
      id: 'bio_1',
      title: 'Tái tổ hợp gen ADN THPT',
      desc: 'Mô phỏng chuỗi Nucleotide xoắn kép xoay quanh tế bào.',
      url: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=600&auto=format&fit=crop',
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
        caption: 'Hệ thống gương phản xạ bẻ cong tia laser thành công! ⚡',
        createdAt: '2 giờ trước'
      },
      {
        id: 's1_2',
        imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop',
        caption: 'Đồ thị Parabol đi qua đúng đỉnh cực trị! 🎯',
        createdAt: '1 giờ trước'
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
        caption: 'Phản ứng nổ thuốc súng đen KNO₃ quá hoành tráng! 🧪💥',
        createdAt: '4 giờ trước'
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
        caption: 'Ghép cặp thành công chuỗi ADN virus đột biến 🌾🧬',
        createdAt: '5 giờ trước'
      }
    ]
  }
];

// Bảng tin Moments Feed mẫu
const MOCK_MOMENTS = [
  {
    id: 'moment_1',
    userName: 'Kỹ Sư Lượng Tử',
    avatar: '🌀',
    title: 'Viện Sĩ Lượng Tử',
    elo: 2450,
    avatarFrame: 'cyan_tech',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop',
    caption: 'Tương giao đồ thị cực kỳ nhịp nhàng trong buổi Đấu trường sáng nay! Đã leo thành công lên 2450 ELO. Ai muốn solo môn Toán học 3D không nào? 📐🚀',
    subject: 'math',
    subjectLabel: 'Toán Học 3D',
    createdAt: '15 phút trước',
    reactions: { heart: 24, brain: 12, fire: 18 },
    comments: [
      { id: 'c1', userName: 'Học Thần Hóa', text: 'Vẽ đỉnh thế anh ơi!' },
      { id: 'c2', userName: 'Nhà Sáng Chế Trẻ', text: 'Hóng solo Toán 3D nha' }
    ]
  },
  {
    id: 'moment_2',
    userName: 'Bậc Thầy Hắc Ám',
    avatar: '🧪',
    title: 'Kỹ Thuật Viên',
    elo: 450,
    avatarFrame: 'neon_fire',
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop',
    caption: 'Đã hoàn thành phản ứng bẫy khí CO₂ chuẩn pH = 7.1 siêu ngọt ngào. Tránh được hoàn toàn vụ nổ bình ga của Chapter 1 luôn nhé mọi người! 🧪🔥',
    subject: 'chemistry',
    subjectLabel: 'Hóa Học Ảo',
    createdAt: '1 giờ trước',
    reactions: { heart: 15, brain: 8, fire: 22 },
    comments: [
      { id: 'c3', userName: 'Genetics Wizard', text: 'Chỉ em cách đổ NaHCO₃ với, toàn bị nổ!' }
    ]
  }
];

// Hàm Seeding dữ liệu mẫu vào Firestore nếu trống để đảm bảo giao diện luôn đầy đủ thông tin sinh động
const seedDatabase = async () => {
  try {
    const momentsCollection = collection(db, 'moments');
    const momentsSnapshot = await getDocs(momentsCollection);
    if (momentsSnapshot.empty) {
      console.log("Seeding mock moments to Firestore...");
      for (const m of MOCK_MOMENTS) {
        await setDoc(doc(db, 'moments', m.id), {
          ...m,
          timestamp: Date.now() - (m.id === 'moment_1' ? 900000 : 3600000) // Khởi tạo mốc thời gian đăng hợp lý
        });
      }
    }

    const storiesCollection = collection(db, 'stories');
    const storiesSnapshot = await getDocs(storiesCollection);
    if (storiesSnapshot.empty) {
      console.log("Seeding mock stories to Firestore...");
      for (const s of MOCK_STORIES) {
        await setDoc(doc(db, 'stories', s.id), {
          ...s,
          updatedAt: Date.now() - (s.id === 'user_story_1' ? 3600000 : 7200000)
        });
      }
    }
  } catch (err) {
    console.error("Lỗi Seeding cơ sở dữ liệu mẫu:", err);
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
  
  const [activeStoryIndex, setActiveStoryIndex] = useState(null); // index của user trong MOCK_STORIES
  const [storySubIndex, setStorySubIndex] = useState(0); // index của câu chuyện cụ thể
  const [isPosting, setIsPosting] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('chemistry');
  const [selectedTemplate, setSelectedTemplate] = useState(LAB_TEMPLATES.chemistry[0]);
  const [commentInputs, setCommentInputs] = useState({});
  const [floatingEmojis, setFloatingEmojis] = useState([]);

  // Ảnh tùy chỉnh tải lên
  const [customImage, setCustomImage] = useState(null);

  // Tin chia sẻ nhanh đang chờ xác nhận từ phòng thi
  const [pendingShare, setPendingShare] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  
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
          try {
            localStorage.setItem('community_moments', JSON.stringify(list));
          } catch (e) {
            console.warn("Could not cache community_moments in localStorage:", e);
          }
        }
      }
    }, (err) => {
      console.error("Lỗi đồng bộ moments từ Firestore:", err);
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
          try {
            localStorage.setItem('community_stories', JSON.stringify(list));
          } catch (e) {
            console.warn("Could not cache community_stories in localStorage:", e);
          }
        }
      }
    }, (err) => {
      console.error("Lỗi đồng bộ stories từ Firestore:", err);
    });

    return () => {
      unsubMoments();
      unsubStories();
    };
  }, []);

  // Logic chạy tự động cho Story Viewer
  useEffect(() => {
    if (activeStoryIndex === null || isHolding) {
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
  }, [activeStoryIndex, storySubIndex, isHolding]);

  // Điều khiển bàn phím cho Story
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeStoryIndex === null) return;
      if (e.key === 'ArrowRight') handleNextStory();
      if (e.key === 'ArrowLeft') handlePrevStory();
      if (e.key === 'Escape') handleCloseStory();
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

  // Handle click biểu cảm của Bảng tin
  const handleReact = async (momentId, reactionType, e) => {
    playSound.click();
    
    // Tạo hiệu ứng bong bóng nổi bọt tại vị trí click
    const rect = e.target.getBoundingClientRect();
    const emojiMap = { heart: '❤️', brain: '🧠', fire: '💥' };
    triggerFloatingEmoji(emojiMap[reactionType], e.clientX - 15, e.clientY - 15);

    if (reactionType === 'fire') {
      playSound.explosion(); // Thêm âm thanh nổ nhỏ cực kỳ đã tai khi thả kích nổ
    }

    try {
      const momentRef = doc(db, 'moments', momentId);
      const momentSnap = await getDoc(momentRef);
      if (momentSnap.exists()) {
        const currentReactions = momentSnap.data().reactions || { heart: 0, brain: 0, fire: 0 };
        await updateDoc(momentRef, {
          [`reactions.${reactionType}`]: (currentReactions[reactionType] || 0) + 1
        });
      }
    } catch (err) {
      console.error("Lỗi cập nhật Reaction lên Firestore:", err);
      setMoments((prev) =>
        prev.map((m) => {
          if (m.id === momentId) {
            return {
              ...m,
              reactions: {
                ...m.reactions,
                [reactionType]: m.reactions[reactionType] + 1
              }
            };
          }
          return m;
        })
      );
    }
  };

  // Viết bình luận nhanh
  const handleAddComment = async (momentId) => {
    const text = commentInputs[momentId] || '';
    if (!text.trim()) return;

    playSound.success();
    const newComment = {
      id: Math.random().toString(),
      userName: user?.displayName || 'Người chơi ẩn danh',
      text: text,
      timestamp: Date.now()
    };

    setCommentInputs((prev) => ({ ...prev, [momentId]: '' }));

    try {
      const momentRef = doc(db, 'moments', momentId);
      await updateDoc(momentRef, {
        comments: arrayUnion(newComment)
      });
    } catch (err) {
      console.error("Lỗi thêm bình luận lên Firestore:", err);
      setMoments((prev) =>
        prev.map((m) => {
          if (m.id === momentId) {
            return {
              ...m,
              comments: [...(m.comments || []), newComment]
            };
          }
          return m;
        })
      );
    }
  };

  // Đăng khoảnh khắc mới
  const handleCreatePost = async () => {
    if (!newCaption.trim()) return;

    playSound.success();

    const newPostId = `moment_${Date.now()}`;
    const subjectLabels = {
      chemistry: 'Hóa Học Ảo',
      physics: 'Vật Lý Lượng Tử',
      math: 'Toán Học 3D',
      biology: 'Sinh Học Di Truyền'
    };

    // Ưu tiên sử dụng ảnh tùy chỉnh tự tải lên, nếu không dùng template lab
    const postImageUrl = customImage || selectedTemplate.url;

    const newPost = {
      id: newPostId,
      userName: user?.displayName || 'Bạn',
      avatar: '👑',
      avatarUrl: personalization.avatarUrl || '',
      avatarParts: personalization.avatarParts || null,
      title: rankInfo.title,
      elo: userElo,
      avatarFrame: personalization.avatarFrame || 'border border-pink-500/40',
      imageUrl: postImageUrl,
      caption: newCaption,
      subject: selectedSubject,
      subjectLabel: subjectLabels[selectedSubject],
      createdAt: 'Vừa xong',
      reactions: { heart: 0, brain: 0, fire: 0 },
      comments: [],
      timestamp: serverTimestamp()
    };

    // Reset Form
    setNewCaption('');
    setCustomImage(null);
    setIsPosting(false);

    try {
      // 1. Lưu bài viết Moments mới lên Firestore
      await setDoc(doc(db, 'moments', newPostId), newPost);

      // 2. Lưu tin lên danh sách Stories chung của cộng đồng trên Firestore
      const storyDocId = user?.uid || 'guest_user';
      const storyDocRef = doc(db, 'stories', storyDocId);
      const storySnap = await getDoc(storyDocRef);

      const newStorySlide = {
        id: `s_${Date.now()}`,
        imageUrl: postImageUrl,
        caption: newPost.caption,
        createdAt: 'Vừa xong'
      };

      if (storySnap.exists()) {
        const currentStories = storySnap.data().stories || [];
        await setDoc(storyDocRef, {
          ...storySnap.data(),
          elo: userElo,
          title: rankInfo.title,
          activeFrame: personalization.avatarFrame || 'border border-pink-500/40',
          avatarUrl: personalization.avatarUrl || '',
          avatarParts: personalization.avatarParts || null,
          stories: [newStorySlide, ...currentStories],
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        await setDoc(storyDocRef, {
          id: storyDocId,
          userName: user?.displayName || 'Bạn',
          avatar: '👑',
          avatarUrl: personalization.avatarUrl || '',
          avatarParts: personalization.avatarParts || null,
          elo: userElo,
          title: rankInfo.title,
          activeFrame: personalization.avatarFrame || 'border border-pink-500/40',
          stories: [newStorySlide],
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Lỗi khi lưu bài viết lên Firestore:", err);
    }
  };

  // Đăng tin chia sẻ nhanh sau khi xem trước & xác nhận
  const handleConfirmPendingShare = async (customCaption) => {
    if (!pendingShare) return;

    playSound.success();

    const newPostId = `moment_${Date.now()}`;
    const subjectLabels = {
      chemistry: 'Hóa Học Ảo',
      physics: 'Vật Lý Lượng Tử',
      math: 'Toán Học 3D',
      biology: 'Sinh Học Di Truyền'
    };

    const finalCaption = customCaption || pendingShare.caption;

    const newPost = {
      id: newPostId,
      userName: user?.displayName || 'Bạn',
      avatar: '👑',
      avatarUrl: personalization.avatarUrl || '',
      avatarParts: personalization.avatarParts || null,
      title: rankInfo.title,
      elo: pendingShare.elo || userElo,
      avatarFrame: personalization.avatarFrame || 'border border-pink-500/40',
      imageUrl: pendingShare.imageUrl,
      caption: finalCaption,
      subject: pendingShare.subject,
      subjectLabel: subjectLabels[pendingShare.subject] || pendingShare.subjectLabel,
      createdAt: 'Vừa xong',
      reactions: { heart: 0, brain: 0, fire: 0 },
      comments: [],
      timestamp: serverTimestamp()
    };

    // Reset tin chờ xác nhận
    setPendingShare(null);
    deletePendingShare();

    try {
      // 1. Lưu bài viết Moments mới lên Firestore
      await setDoc(doc(db, 'moments', newPostId), newPost);

      // 2. Lưu tin lên danh sách Stories chung của cộng đồng trên Firestore
      const storyDocId = user?.uid || 'guest_user';
      const storyDocRef = doc(db, 'stories', storyDocId);
      const storySnap = await getDoc(storyDocRef);

      const newStorySlide = {
        id: `s_${Date.now()}`,
        imageUrl: pendingShare.imageUrl,
        caption: finalCaption,
        createdAt: 'Vừa xong'
      };

      if (storySnap.exists()) {
        const currentStories = storySnap.data().stories || [];
        await setDoc(storyDocRef, {
          ...storySnap.data(),
          elo: pendingShare.elo || userElo,
          title: rankInfo.title,
          activeFrame: personalization.avatarFrame || 'border border-pink-500/40',
          avatarUrl: personalization.avatarUrl || '',
          avatarParts: personalization.avatarParts || null,
          stories: [newStorySlide, ...currentStories],
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        await setDoc(storyDocRef, {
          id: storyDocId,
          userName: user?.displayName || 'Bạn',
          avatar: '👑',
          avatarUrl: personalization.avatarUrl || '',
          avatarParts: personalization.avatarParts || null,
          elo: pendingShare.elo || userElo,
          title: rankInfo.title,
          activeFrame: personalization.avatarFrame || 'border border-pink-500/40',
          stories: [newStorySlide],
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Lỗi khi xác nhận lưu bài viết lên Firestore:", err);
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

              {/* Tag Môn Học */}
              <div className="px-3 py-1 bg-white/[0.04] border border-border-theme rounded-full text-[9px] font-extrabold text-accent-pink uppercase tracking-widest">
                {moment.subjectLabel}
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
              
              {/* Nút bấm phóng to lab giả lập */}
              <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 border border-border-theme rounded-lg text-[9px] font-bold text-text-secondary flex items-center gap-1">
                <Camera className="w-3 h-3" /> Chụp từ Lab
              </div>
            </div>

            {/* Bộ điều khiển biểu cảm (Reaction bar) */}
            <div className="flex items-center justify-between border-t border-b border-border-theme py-3 mb-4">
              <div className="flex items-center gap-4">
                
                {/* Thả tim */}
                <button 
                  onClick={(e) => handleReact(moment.id, 'heart', e)}
                  className="flex items-center gap-1.5 text-text-secondary hover:text-rose-500 text-xs font-bold transition-all hover:scale-110"
                >
                  <Heart className="w-4 h-4 text-rose-500" fill="currentColor" />
                  <span>{moment.reactions.heart}</span>
                </button>

                {/* Thả trí tuệ */}
                <button 
                  onClick={(e) => handleReact(moment.id, 'brain', e)}
                  className="flex items-center gap-1.5 text-text-secondary hover:text-cyan-400 text-xs font-bold transition-all hover:scale-110"
                >
                  <Brain className="w-4 h-4 text-cyan-400" />
                  <span>{moment.reactions.brain}</span>
                </button>

                {/* Thả kích nổ */}
                <button 
                  onClick={(e) => handleReact(moment.id, 'fire', e)}
                  className="flex items-center gap-1.5 text-text-secondary hover:text-orange-500 text-xs font-bold transition-all hover:scale-110"
                >
                  <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span>{moment.reactions.fire}</span>
                </button>
              </div>

              {/* Đếm số bình luận */}
              <div className="flex items-center gap-1.5 text-text-secondary text-[11px] font-bold">
                <MessageSquare className="w-4 h-4" />
                <span>{moment.comments.length} bình luận</span>
              </div>
            </div>

            {/* Danh sách bình luận */}
            {moment.comments.length > 0 && (
              <div className="space-y-2 mb-4 bg-white/[0.01] border border-border-theme rounded-2xl p-3">
                {moment.comments.map((comment) => (
                  <div key={comment.id} className="text-[11px] text-text-secondary leading-relaxed select-text">
                    <span className="font-extrabold text-text-primary mr-1.5">{comment.userName}:</span>
                    {comment.text}
                  </div>
                ))}
              </div>
            )}

            {/* Viết bình luận nhanh */}
            <div className="flex items-center gap-2 relative">
              <input 
                type="text" 
                placeholder="Viết câu trả lời..." 
                value={commentInputs[moment.id] || ''}
                onChange={(e) => setCommentInputs({ ...commentInputs, [moment.id]: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddComment(moment.id);
                }}
                className="flex-1 bg-bg-tertiary text-xs text-text-primary rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-accent-pink/50 border border-border-theme transition-all placeholder:text-text-secondary"
              />
              <button 
                onClick={() => handleAddComment(moment.id)}
                className="p-2.5 bg-accent-pink hover:bg-accent-pink/90 text-white rounded-xl transition-all active:scale-90"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
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

                  {/* Đóng Story */}
                  <button 
                    onClick={handleCloseStory}
                    className="p-2 bg-black/40 hover:bg-black/60 rounded-full text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
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

                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={(e) => {
                        playSound.click();
                        triggerFloatingEmoji('❤️', e.clientX, e.clientY - 40);
                      }}
                      className="w-11 h-11 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-full flex items-center justify-center text-lg shadow-xl"
                    >
                      ❤️
                    </button>
                    <button 
                      onClick={(e) => {
                        playSound.click();
                        triggerFloatingEmoji('🧠', e.clientX, e.clientY - 40);
                      }}
                      className="w-11 h-11 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-full flex items-center justify-center text-lg shadow-xl"
                    >
                      🧠
                    </button>
                    <button 
                      onClick={(e) => {
                        playSound.explosion();
                        triggerFloatingEmoji('💥', e.clientX, e.clientY - 40);
                      }}
                      className="w-11 h-11 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-full flex items-center justify-center text-lg shadow-xl"
                    >
                      💥
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ================== CREATE MOMENT MODAL ================== */}
      {mounted && createPortal(
        <AnimatePresence>
          {isPosting && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999997] bg-black/80 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-bg-secondary border border-border-theme rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden text-left"
              >
                {/* Header Modal */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-accent-pink" />
                    <span className="text-sm font-black text-text-primary">Đăng Khoảnh Khắc Lên STEM Stories</span>
                  </div>
                  <button 
                    onClick={() => setIsPosting(false)}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Lựa chọn Môn học */}
                <div className="mb-4">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary block mb-2">1. Chọn Môn Học Tác Nghiệp</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.keys(LAB_TEMPLATES).map((subject) => {
                      const labelMap = { chemistry: '🧪 Hóa', physics: '⚡ Lý', math: '📐 Toán', biology: '🧬 Sinh' };
                      return (
                        <button
                          key={subject}
                          onClick={() => handleSubjectChange(subject)}
                          className={`py-2 px-1 text-2xs font-extrabold rounded-xl border transition-all active:scale-95 ${
                            selectedSubject === subject 
                              ? 'bg-accent-pink border-accent-pink text-white shadow-lg shadow-accent-pink/10' 
                              : 'bg-bg-tertiary/60 border-border-theme text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {labelMap[subject]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lựa chọn Ảnh chụp mẫu chất lượng cao */}
                <div className="mb-4">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary block mb-2">2. Chọn Kết Quả Phòng Lab Thí Nghiệm</label>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none mb-3">
                    {LAB_TEMPLATES[selectedSubject].map((template) => (
                      <div 
                        key={template.id}
                        onClick={() => {
                          setCustomImage(null); // Xóa ảnh custom nếu chọn template
                          setSelectedTemplate(template);
                        }}
                        className={`w-32 h-20 shrink-0 rounded-xl overflow-hidden relative cursor-pointer border-2 transition-all ${
                          !customImage && selectedTemplate.id === template.id ? 'border-accent-pink scale-98 shadow-md shadow-accent-pink/10' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={template.url} alt="template" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 p-1.5 flex flex-col justify-end">
                          <span className="text-[7px] font-black text-white truncate">{template.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tải ảnh tùy chỉnh của riêng bạn (Chụp màn hình...) */}
                <div className="mb-4">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary block mb-2">
                    Hoặc tự tải lên ảnh/ảnh chụp màn hình của bạn
                  </label>
                  <div className="flex gap-4 items-center bg-white/[0.02] border border-border-theme p-3 rounded-2xl">
                    {customImage ? (
                      <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-accent-pink shrink-0">
                        <img src={customImage} alt="custom upload" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setCustomImage(null)}
                          className="absolute top-1 right-1 p-1 bg-danger hover:bg-danger/90 text-white rounded-full transition-colors active:scale-90"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-32 h-20 shrink-0 rounded-xl border-2 border-dashed border-border-theme hover:border-accent-pink/40 bg-bg-tertiary/60 hover:bg-bg-tertiary transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group">
                        <Upload className="w-4 h-4 text-text-secondary group-hover:text-accent-pink transition-colors" />
                        <span className="text-[8px] font-black text-text-secondary group-hover:text-text-primary uppercase tracking-wider">Tải ảnh lên</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setCustomImage(event.target.result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                    <div className="text-[8px] text-text-secondary leading-relaxed font-bold">
                      Hệ thống tự động mã hóa Base64 siêu tốc để lưu trữ an toàn trong LocalSession. Phù hợp tải ảnh chụp màn hình đấu trường, vinh danh của riêng bạn.
                    </div>
                  </div>
                </div>

                {/* Nhập Caption */}
                <div className="mb-6">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary block mb-2">3. Trải nghiệm/Thành tích của bạn</label>
                  <textarea 
                    rows="3"
                    placeholder="Ghi chú thành tựu phản ứng, ELO, hay mẹo giải toán... (ví dụ: pH đạt 7.1 tuyệt vời!)"
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                    className="w-full bg-bg-tertiary/60 border border-border-theme focus:border-accent-pink/30 rounded-xl p-3 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none transition-all resize-none"
                  />
                </div>

                {/* Nút Đăng */}
                <button 
                  onClick={handleCreatePost}
                  disabled={!newCaption.trim()}
                  className={`w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 ${
                    newCaption.trim()
                      ? 'bg-gradient-to-r from-accent-pink to-accent-purple hover:opacity-90 text-white shadow-lg shadow-accent-pink/10'
                      : 'bg-bg-tertiary text-text-secondary cursor-not-allowed border border-border-theme'
                  }`}
                >
                  <Sparkles className="w-4 h-4 animate-pulse" /> Đăng Lên Bảng Tin Lập Tức
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
                <button 
                  onClick={() => setLightboxImage(null)}
                  className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/80 rounded-full text-white/70 hover:text-white transition-all border border-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
