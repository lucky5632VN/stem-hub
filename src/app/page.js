'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { playSound } from '@/lib/sound';
import { auth, db, functions, httpsCallable } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  BookOpen, Trophy, Sparkles, Shield, Award, Star, 
  Flame, CheckCircle, Zap, User, Activity, Gem, Clock,
  X, Camera, Send, RefreshCw, MessageSquare
} from 'lucide-react';
import { AvatarFrame } from '@/components/atoms/AvatarFrame';
import STEMAvatarSVG from '@/components/atoms/STEMAvatarSVG';
import dynamic from 'next/dynamic';
import { savePendingShare } from '@/lib/indexedDB';
import CrystalIcon from '@/components/atoms/CrystalIcon';

const ArenaBackground = dynamic(() => import('@/components/organisms/ArenaBackground'), { ssr: false });

const labs = [
  {
    id: 'chem',
    title: 'Hóa học',
    name: 'QuantumLab v4.0',
    status: 'active',
    link: '/labs/lab-ktra15p/dist/index.html?v=4.1.5',
    image: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?q=80&w=600&auto=format&fit=crop',
    desc: 'Thiết lập phản ứng axit-bazơ ảo, theo dõi nồng độ pH thời gian thực.',
  },
  {
    id: 'bio',
    title: 'Sinh học',
    name: 'BioSTEM Virtual AI',
    status: 'active',
    link: '/labs/lab_sinh/dist/index.html?v=4.0.6',
    image: '/bio_stem_cover.png',
    desc: 'Giải mã bản đồ gene di truyền, trắc nghiệm sinh học chuẩn THPT Quốc gia.',
  },
  {
    id: 'phys',
    title: 'Vật lý',
    name: 'PhysicsLab v3.0',
    status: 'active',
    link: '/labs/PhysicsLab/index.html',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop',
    desc: 'Mô phỏng dao động điều hòa, giao thoa sóng cơ, đặc tuyến linh kiện và lắp ráp mạch điện DC tương tác.',
  },
  {
    id: 'math',
    title: 'Toán học',
    name: 'SpatialMind AI',
    status: 'active',
    link: '/labs/toan/frontend/dist/index.html',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop',
    desc: 'Khám phá hình học không gian 3D trực quan bằng công cụ giải toán thông minh.',
  }
];

export default function Home() {
  const user = useAppStore((state) => state.user);
  const personalization = useAppStore((state) => state.personalization);
  const setPersonalization = useAppStore((state) => state.setPersonalization);
  const [claimedQuests, setClaimedQuests] = useState({});

  const router = useRouter();
  const activeLab = useAppStore((state) => state.activeLab);
  const setActiveLab = useAppStore((state) => state.setActiveLab);

  // Dọn dẹp phòng lab khi chuyển trang
  useEffect(() => {
    return () => {
      setActiveLab(null);
    };
  }, [setActiveLab]);
  const [showAiCompanion, setShowAiCompanion] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [screenshotFlash, setScreenshotFlash] = useState(false);
  const [showShareConfirm, setShowShareConfirm] = useState(false);

  const checkQuestCompleted = (questId) => {
    if (!user) return false;
    if (questId === 1) {
      return localStorage.getItem('daily_quest_pvp_win') === 'completed';
    }
    if (questId === 2) {
      return localStorage.getItem('daily_quest_lab_done') === 'completed';
    }
    if (questId === 3) {
      return (personalization.elo || 0) >= 1100;
    }
    return false;
  };

  const aiCompanionData = {
    chem: {
      welcome: "🔬 Xin chào! Tôi là Trợ lý Lượng tử phòng thí nghiệm Hóa học. Tôi có thể hỗ trợ bạn thiết lập các chuỗi phản ứng axit-bazơ, cân bằng phương trình hóa học hoặc đo lường nồng độ pH. Hãy chọn một câu hỏi gợi ý bên dưới hoặc nhập câu hỏi của bạn nhé!",
      suggestions: [
        "Làm thế nào để pha dung dịch HCl 0.1M?",
        "Giải thích phản ứng trung hòa axit-bazơ?",
        "Công thức tính độ pH của dung dịch là gì?"
      ],
      answers: {
        "Làm thế nào để pha dung dịch HCl 0.1M?": "Để pha 1 lít dung dịch HCl 0.1M từ HCl đặc (thường là 37%, d = 1.19 g/mL):\n1. Tính số mol HCl cần dùng: n = C.V = 0.1 mol.\n2. Khối lượng HCl nguyên chất: m = 0.1 * 36.5 = 3.65g.\n3. Khối lượng dung dịch đặc cần lấy: m_dd = 3.65 / 0.37 = 9.86g.\n4. Thể tích dung dịch đặc cần hút: V_dd = m_dd / d = 9.86 / 1.19 ≈ 8.3 mL.\n5. Đong khoảng 500mL nước cất vào bình định mức 1L, hút từ từ 8.3 mL HCl đặc nhỏ vào (luôn cho axit vào nước, KHÔNG làm ngược lại), sau đó thêm nước cất đến vạch định mức 1L.",
        "Giải thích phản ứng trung hòa axit-bazơ?": "Phản ứng trung hòa là phản ứng giữa một axit và một bazơ tạo thành muối và nước. Bản chất là sự kết hợp giữa ion H+ (từ axit) và ion OH- (từ bazơ) để tạo thành phân tử nước (H2O):\n\nFormula: H⁺ + OH⁻ → H₂O\n\nVí dụ: HCl + NaOH → NaCl + H₂O. Khi phản ứng đạt điểm tương đương (lượng H+ bằng lượng OH-), dung dịch sẽ có tính trung tính (pH ≈ 7 nếu là axit mạnh và bazơ mạnh).",
        "Công thức tính độ pH của dung dịch là gì?": "Độ pH là đại lượng đo hoạt độ của các ion hydro (H+) trong dung dịch, xác định tính axit hay bazơ của dung dịch đó. Công thức xác định:\n\nFormula: pH = -log₁₀[H⁺]\n\nTrong đó [H+] là nồng độ ion H+ tính bằng mol/lít.\n- pH < 7: Dung dịch có tính axit (nồng độ H+ cao).\n- pH = 7: Dung dịch trung tính (nước tinh khiết).\n- pH > 7: Dung dịch có tính bazơ/kiềm (nồng độ H+ thấp, OH- cao)."
      }
    },
    phys: {
      welcome: "⚡ Chào bạn! Tôi là Trợ lý Lượng tử phòng thí nghiệm Vật lý. Bạn cần trợ giúp gì về dao động điều hòa, mạch điện xoay chiều AC hay các định luật Newton cơ học?",
      suggestions: [
        "Cách nối song song và nối tiếp các điện trở?",
        "Công thức tính chu kỳ dao động con lắc lò xo?",
        "Giải thích hiện tượng cảm ứng điện từ?"
      ],
      answers: {
        "Cách nối song song và nối tiếp các điện trở?": "1. Mạch nối tiếp:\n- Cường độ dòng điện bằng nhau qua mọi điện trở: I = I₁ = I₂.\n- Hiệu điện thế tổng bằng tổng các hiệu điện thế thành phần: U = U₁ + U₂.\n- Điện trở tương đương: R_tđ = R₁ + R₂.\n\n2. Mạch song song:\n- Hiệu điện thế bằng nhau: U = U₁ = U₂.\n- Cường độ dòng điện tổng bằng tổng các cường độ thành phần: I = I₁ + I₂.\n- Điện trở tương đương nghịch đảo: 1/R_tđ = 1/R₁ + 1/R₂.",
        "Công thức tính chu kỳ dao động con lắc lò xo?": "Chu kỳ dao động T của con lắc lò xo phụ thuộc vào khối lượng vật nặng m (kg) và độ cứng của lò xo k (N/m), được tính theo công thức:\n\nFormula: T = 2π * √(m / k)\n\nTrong đó:\n- T: Chu kỳ dao động (giây).\n- m: Khối lượng vật treo (kg).\n- k: Độ cứng lò xo (N/m).\nChu kỳ này hoàn toàn độc lập với biên độ dao động trong giới hạn đàn hồi.",
        "Giải thích hiện tượng cảm ứng điện từ?": "Hiện tượng cảm ứng điện từ là sự xuất hiện một suất điện động cảm ứng (và dòng điện cảm ứng nếu mạch kín) bên trong một mạch dẫn khi từ thông qua mạch đó biến thiên theo thời gian. Định luật Faraday phát biểu:\n\nFormula: e = -dΦ/dt\n\nChiều của dòng điện cảm ứng được xác định theo Định luật Lenz: Dòng điện cảm ứng xuất hiện có chiều sao cho từ trường do nó sinh ra có tác dụng chống lại sự biến thiên của từ thông đã sinh ra nó."
      }
    },
    math: {
      welcome: "📐 Xin chào! Tôi là Trợ lý Lượng tử phòng toán học SpatialMind. Tôi ở đây để hỗ trợ bạn dựng hình học không gian 3D, tính toán thể tích và khám phá các định lý Euler.",
      suggestions: [
        "Định lý Euler cho đa diện lồi là gì?",
        "Công thức tính thể tích khối cầu và diện tích mặt cầu?",
        "Cách xác định góc giữa đường thẳng và mặt phẳng?"
      ],
      answers: {
        "Định lý Euler cho đa diện lồi là gì?": "Định lý Euler (hay hệ thức Euler) phát biểu rằng đối với bất kỳ đa diện lồi nào, mối quan hệ giữa số đỉnh (Đ), số cạnh (C) và số mặt (M) luôn thỏa mãn công thức hằng số:\n\nFormula: Đ - C + M = 2\n\nVí dụ:\n- Hình lập phương: 8 đỉnh, 12 cạnh, 6 mặt. Ta có: 8 - 12 + 6 = 2.\n- Hình chóp tam giác (tứ diện): 4 đỉnh, 6 cạnh, 4 mặt. Ta có: 4 - 6 + 4 = 2.",
        "Công thức tính thể tích khối cầu và diện tích mặt cầu?": "Với khối cầu có bán kính R:\n\n1. Thể tích khối cầu (V):\nFormula: V = (4/3) * π * R³\n\n2. Diện tích mặt cầu (S):\nFormula: S = 4 * π * R²\n\nTrong đó π ≈ 3.14159.",
        "Cách xác định góc giữa đường thẳng và mặt phẳng?": "Để xác định góc giữa đường thẳng d và mặt phẳng (P):\n1. Tìm giao điểm O của đường thẳng d và mặt phẳng (P).\n2. Lấy một điểm A bất kỳ trên d (A khác O). Dựng hình chiếu vuông góc H của A lên mặt phẳng (P).\n3. Góc giữa đường thẳng d và mặt phẳng (P) chính là góc giữa đường thẳng d và hình chiếu d' của nó trên (P), tức là góc AOH."
      }
    },
    bio: {
      welcome: "🧬 Xin chào! Tôi là Trợ lý Lượng tử phòng thí nghiệm Sinh học BioSTEM. Hãy để tôi giúp bạn giải mã bản đồ gene di truyền, các quy luật phân ly Men-đen và cấu trúc mạch kép ADN nhé!",
      suggestions: [
        "Quy luật phân ly độc lập của Men-đen là gì?",
        "Cấu trúc cấu tạo của phân tử ADN?",
        "Cách tính tần số alen trong quần thể?"
      ],
      answers: {
        "Quy luật phân ly độc lập của Men-đen là gì?": "Quy luật phân ly độc lập phát biểu rằng các cặp nhân tố di truyền (cặp alen) phân ly độc lập với nhau trong quá trình hình thành giao tử. Điều này xảy ra khi các gen quy định các tính trạng khác nhau nằm trên các cặp nhiễm sắc thể tương đồng khác nhau. Tỷ lệ phân ly kiểu hình ở thế hệ lai F2 khi lai hai bố mẹ thuần chủng khác nhau về hai cặp tính trạng tương phản là 9:3:3:1.",
        "Cấu trúc cấu tạo của phân tử ADN?": "ADN (Axit đêôxiribônuclêic) là phân tử mang thông tin di truyền dưới dạng chuỗi xoắn kép gồm hai mạch polynucleotit song song ngược chiều. \n- Đơn phân là Nucleotit, gồm 4 loại: Adenin (A), Thymin (T), Guanin (G), Cytosin (X).\n- Hai mạch liên kết với nhau theo nguyên tắc bổ sung:\n  + A liên kết với T bằng 2 liên kết Hydro.\n  + G liên kết với X bằng 3 liên kết Hydro.",
        "Cách tính tần số alen trong quần thể?": "Trong một quần thể lưỡng bội cân bằng di truyền Hardy-Weinberg đối với một gen có hai alen A và a:\n- Gọi p là tần số của alen A, q là tần số của alen a (p + q = 1).\n- Tỷ lệ các kiểu gen trong quần thể sẽ tuân theo đẳng thức:\n\nFormula: p² (AA) + 2pq (Aa) + q² (aa) = 1\n\nĐể tính tần số alen A (p) từ số lượng cá thể: p = (2 * số cá thể AA + số cá thể Aa) / (2 * tổng số cá thể)."
      }
    }
  };

  // Hàm chuyển đổi Rank Title sang tiếng Việt
  const getTitleLabel = (titleKey) => {
    const titles = {
      apprentice: 'Tập sự STEM',
      scholar: 'Học giả STEM',
      adept: 'Chuyên gia STEM',
      master: 'Bậc thầy STEM',
      grandmaster: 'Huyền thoại STEM',
      academician: 'Viện sĩ STEM'
    };
    return titles[titleKey] || 'Tập sự STEM';
  };

  const handleLaunchLab = (lab) => {
    playSound.click();
    setActiveLab(lab);
    setShowAiCompanion(false);
    
    // Nạp tin nhắn welcome tương ứng môn học
    const compData = aiCompanionData[lab.id];
    if (compData) {
      setChatHistory([
        { sender: 'ai', text: compData.welcome, timestamp: new Date() }
      ]);
    } else {
      setChatHistory([
        { sender: 'ai', text: "🔬 Chào mừng bạn đến với phòng thí nghiệm ảo STEM! Tôi có thể hỗ trợ gì cho bạn?", timestamp: new Date() }
      ]);
    }
  };

  const handleTakeScreenshot = () => {
    playSound.click();
    setScreenshotFlash(true);
    setTimeout(() => setScreenshotFlash(false), 300);

    if (!user || !activeLab) return;

    // Thiết lập dữ liệu chia sẻ sang Story
    const imagesBySubject = {
      chem: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?q=80&w=600&auto=format&fit=crop',
      phys: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop',
      math: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop',
      bio: '/bio_stem_cover.png'
    };

    const pendingData = {
      type: 'lab_report',
      subject: activeLab.id,
      subjectLabel: activeLab.title,
      title: `Báo cáo thí nghiệm: ${activeLab.name}`,
      description: `Đã hoàn thành xuất sắc bài thí nghiệm tại ${activeLab.name}!`,
      score: 100,
      timestamp: new Date().toISOString(),
      imageUrl: imagesBySubject[activeLab.id] || 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?q=80&w=600&auto=format&fit=crop',
      authorName: user.displayName || 'Học viên',
      authorAvatarFrame: personalization.avatarFrame || 'default',
      authorTitle: personalization.activeTitle || 'apprentice'
    };

    savePendingShare(pendingData).then((isSaved) => {
      if (isSaved) {
        localStorage.setItem('daily_quest_lab_done', 'completed');
        setShowShareConfirm(true);
      } else {
        alert('⚠️ Không thể lưu trữ thông tin chia sẻ do dung lượng bộ nhớ tạm bị giới hạn. Vui lòng thử lại!');
      }
    });
  };

  const handleConfirmShareToStories = () => {
    playSound.click();
    setShowShareConfirm(false);
    setActiveLab(null);
    router.push('/story');
  };

  const handleSendChatMessage = (textToSend = '') => {
    const text = textToSend.trim() || chatInput.trim();
    if (!text || !activeLab) return;
    
    playSound.click();
    if (!textToSend) setChatInput('');

    // Thêm tin nhắn của user vào history
    const userMsg = { sender: 'user', text, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatLoading(true);

    setTimeout(() => {
      const compData = aiCompanionData[activeLab.id];
      let aiText = "Tôi đã ghi nhận câu hỏi của bạn. Tuy nhiên thông tin này tạm thời chưa có trong cơ sở dữ liệu học tập lượng tử. Hãy thử hỏi câu hỏi khác nhé!";
      
      if (compData && compData.answers && compData.answers[text]) {
        aiText = compData.answers[text];
      } else {
        // Tìm kiếm câu trả lời gần đúng
        const keys = Object.keys(compData?.answers || {});
        const matchedKey = keys.find(k => k.toLowerCase().includes(text.toLowerCase()) || text.toLowerCase().includes(k.toLowerCase()));
        if (matchedKey && compData.answers[matchedKey]) {
          aiText = compData.answers[matchedKey];
        }
      }

      setChatHistory(prev => [...prev, { sender: 'ai', text: aiText, timestamp: new Date() }]);
      setChatLoading(false);
      playSound.success();
    }, 1500);
  };



  // Đọc danh sách nhiệm vụ đã claimed từ localStorage
  useEffect(() => {
    if (user) {
      const claimed = {};
      [1, 2, 3].forEach(id => {
        const val = localStorage.getItem(`quest_${user.uid}_${id}`);
        if (val === 'claimed') {
          claimed[id] = true;
        }
      });
      setClaimedQuests(claimed);
    }
  }, [user]);

  const handleResetQuests = () => {
    playSound.click();
    if (user) {
      [1, 2, 3].forEach(id => {
        localStorage.removeItem(`quest_${user.uid}_${id}`);
      });
    }
    localStorage.removeItem('daily_quest_pvp_win');
    localStorage.removeItem('daily_quest_lab_done');
    setClaimedQuests({});
    alert("Đã reset trạng thái 3 nhiệm vụ hàng ngày về ban đầu để bạn dễ dàng chạy thử test!");
  };

  // Bộ câu hỏi/nhiệm vụ hàng ngày
  const dailyQuests = [
    { id: 1, title: 'Chiến thắng ít nhất 1 trận đấu trí PvP', reward: 50, icon: '⚔️', desc: 'Tham gia Đấu trường 1v1 và giành chiến thắng.' },
    { id: 2, title: 'Thực hành thành công 1 thí nghiệm ảo', reward: 30, icon: '🧪', desc: 'Vào bất kỳ phòng Lab nào để hoàn thành bài thực hành.' },
    { id: 3, title: 'Tích lũy ELO Đấu trường đạt mốc 1100', reward: 100, icon: '🏆', desc: 'Nâng cao trình độ đấu trí của bạn qua các môn học.' }
  ];

  // Nhận thưởng Crystals
  const handleClaimReward = async (questId, amount) => {
    if (!user) return;
    playSound.success();
    
    try {
      const processTransaction = httpsCallable(functions, 'processCrystalTransaction');
      const res = await processTransaction({
        actionType: 'CLAIM_HOMEPAGE_QUEST',
        payload: { questId, amount }
      });
      if (res.data?.success) {
        setPersonalization({ crystals: res.data.newCrystals });
      }
      localStorage.setItem(`quest_${user.uid}_${questId}`, 'claimed');
      setClaimedQuests(prev => ({ ...prev, [questId]: true }));
    } catch (err) {
      console.warn("Lỗi đồng bộ Crystals lên Firestore:", err);
    }
  };


  // Tính toán tọa độ vẽ biểu đồ Radar SVG
  const getRadarPoints = () => {
    const strengths = personalization.subjectStrengths || { math: 50, physics: 50, chemistry: 50, biology: 50 };
    const center = 100;
    const maxVal = 100;
    const r = 70; // Bán kính tối đa

    // Các trục: Math (Top), Physics (Right), Chemistry (Bottom), Biology (Left)
    const pMath = {
      x: center,
      y: center - (strengths.math / maxVal) * r
    };
    const pPhys = {
      x: center + (strengths.physics / maxVal) * r,
      y: center
    };
    const pChem = {
      x: center,
      y: center + (strengths.chemistry / maxVal) * r
    };
    const pBio = {
      x: center - (strengths.biology / maxVal) * r,
      y: center
    };

    return `${pMath.x},${pMath.y} ${pPhys.x},${pPhys.y} ${pChem.x},${pChem.y} ${pBio.x},${pBio.y}`;
  };

  return (
    <div className="relative min-h-screen bg-bg-primary overflow-hidden transition-colors duration-300">
      {/* 🚀 LỚP NỀN ĐỘNG CINEMAGRAPH BACKGROUND (Z-INDEX 0) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 dark:opacity-25 mix-blend-multiply dark:mix-blend-screen overflow-hidden">
        <ArenaBackground subject="math" />
      </div>

      {/* 🚀 LỚP GIAO DIỆN UI THAO TÁC NGƯỜI DÙNG (Z-INDEX 10) */}
      <div className="relative z-10 w-full min-h-screen p-6 max-w-7xl mx-auto">
      
      {/* 2-COLUMN HUB LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* CỘT TRÁI (COL-SPAN-8): DANH SÁCH PHÒNG LABS THỰC HÀNH */}
        <div className="lg:col-span-8 flex flex-col gap-6 screenshot-full-width">
          <div className="flex flex-col mb-2">
            <h2 className="text-xl font-bold text-text-primary tracking-tight uppercase flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent-pink animate-pulse" /> HỆ THỐNG PHÒNG THÍ NGHIỆM ẢO STEM
            </h2>
            <p className="text-text-secondary text-xs mt-1 tracking-wide">CHỌN PHÒNG THÍ NGHIỆM ĐỂ KHỞI CHẠY MÔ PHỎNG LƯỢNG TỬ</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {labs.map((lab) => (
              <div key={lab.id} className="bg-bg-secondary/95 rounded-3xl overflow-hidden border border-border-theme hover:border-accent-pink/40 hover:shadow-[0_8px_30px_rgba(240,57,140,0.12)] transition-all duration-300 group flex flex-col justify-between shadow-lg relative">
                <div>
                  <div className="h-44 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary via-bg-secondary/30 to-transparent z-10 group-hover:via-bg-secondary/60 transition-colors duration-300" />
                    <img src={lab.image} alt={lab.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 z-20 px-3.5 py-1.5 bg-bg-primary/80 backdrop-blur-md border border-border-theme rounded-full text-[10px] font-bold text-accent-pink uppercase tracking-wider shadow-sm">
                      {lab.title}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-2 text-text-primary group-hover:text-accent-pink transition-colors tracking-wide">{lab.name}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed min-h-[40px]">{lab.desc}</p>
                  </div>
                </div>
                
                <div className="p-6 pt-0 flex justify-between items-center mt-auto border-t border-border-theme pt-4">
                  <span className="text-[10px] font-mono text-text-secondary">MÁY CHỦ: VIỆT NAM (HN-1)</span>
                  <button 
                    onClick={() => handleLaunchLab(lab)}
                    onMouseEnter={playSound.hover}
                    className={`px-5 py-2.5 rounded-2xl text-[11px] font-bold transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] flex items-center gap-1.5 ${
                      lab.status === 'active' 
                        ? 'bg-accent-pink hover:opacity-90 text-white shadow-lg shadow-accent-pink/20 cursor-pointer' 
                        : 'bg-bg-tertiary text-text-secondary border border-border-theme cursor-default pointer-events-none'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    {lab.status === 'active' ? 'Vào học ngay' : 'Đang nâng cấp'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI (COL-SPAN-4): Spaceship Cockpit HUD */}
        <div className="lg:col-span-4 flex flex-col gap-6 screenshot-hide">
          
          {/* STYLE NHÚNG CHO HIỆU ỨNG RA-ĐA VÀ GIAO DIỆN HOÀNG GIA */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes radar-sweep {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .neon-border-glow {
              box-shadow: 0 0 15px rgba(240, 57, 140, 0.12), inset 0 0 15px rgba(240, 57, 140, 0.03);
            }
            .cyber-glitch-text {
              text-shadow: 0 0 5px rgba(240, 57, 140, 0.4), 0 0 10px rgba(240, 57, 140, 0.2);
            }
          `}} />

          {/* USER CONSOLE HUD: BẢNG ĐIỀU KHIỂN BẰNG KÍNH */}
          <div className="bg-bg-secondary/95 border border-border-theme rounded-3xl p-6 shadow-2xl relative overflow-hidden neon-border-glow">
            {/* Họa tiết trang trí góc điều khiển */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent-pink/30 rounded-tl-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent-pink/30 rounded-tr-xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-accent-pink/30 rounded-bl-xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent-pink/30 rounded-br-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-pink/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-1.5 mb-5 border-b border-border-theme pb-3">
              <Activity className="w-4.5 h-4.5 text-accent-pink animate-pulse" />
              <span className="text-[11px] font-extrabold text-text-primary uppercase tracking-wider cyber-glitch-text">
                BUỒNG LÁI LƯỢNG TỬ v4.0
              </span>
            </div>

            {user ? (
              <div className="flex flex-col gap-4">
                {/* Khu vực thông tin Avatar và Rank */}
                <div className="flex items-center gap-4 bg-bg-tertiary/80 p-4 border border-border-theme rounded-2xl relative">
                  <div className="relative shrink-0 w-16 h-16 flex items-center justify-center">
                    <AvatarFrame frame={personalization.avatarFrame || 'default'} className="w-16 h-16">
                      <STEMAvatarSVG parts={personalization.avatarParts} className="w-11 h-11" />
                    </AvatarFrame>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent-pink border-2 border-bg-primary flex items-center justify-center text-[9px] font-black text-white font-mono shadow-md">
                      {personalization.level || 1}
                    </div>
                  </div>

                  <div className="text-left flex-1 min-w-0">
                    <h4 className="text-sm font-black text-text-primary truncate font-mono uppercase tracking-wide">
                      {personalization.name || user.displayName || 'Người chơi ẩn danh'}
                    </h4>
                    <span className="text-[9px] font-bold text-accent-pink bg-accent-pink/10 border border-accent-pink/20 px-2.5 py-0.5 rounded-full inline-block mt-1 font-mono uppercase tracking-wider">
                      {getTitleLabel(personalization.activeTitle || 'apprentice')}
                    </span>
                    <p className="text-[9px] text-text-secondary font-mono mt-1 uppercase">HẠNG: TÂN BINH</p>
                  </div>
                </div>

                {/* Grid Chỉ số phụ ELO & Tinh thể */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-tertiary/80 border border-border-theme p-3 rounded-2xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-accent-pink/10 border border-accent-pink/20 flex items-center justify-center shrink-0">
                      <Trophy className="w-5 h-5 text-accent-pink" />
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] text-text-secondary font-mono block">ĐIỂM ELO</span>
                      <strong className="text-sm font-black text-text-primary font-mono">{personalization.elo || 1000}</strong>
                    </div>
                  </div>

                  <div className="bg-bg-tertiary/80 border border-border-theme p-3 rounded-2xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <CrystalIcon className="w-5.5 h-5.5" />
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] text-text-secondary font-mono block">TINH THỂ</span>
                      <strong className="text-sm font-black text-amber-400 font-mono">+{personalization.crystals || 0}</strong>
                    </div>
                  </div>
                </div>

                {/* Năng lượng hệ thống */}
                <div className="bg-bg-tertiary/80 border border-border-theme p-3 rounded-2xl text-left">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[9px] text-text-secondary font-mono uppercase">Năng lượng hệ thống</span>
                    <span className="text-[9px] text-accent-pink font-mono font-bold">100% (Ổn định)</span>
                  </div>
                  <div className="h-2 w-full bg-bg-primary rounded-full overflow-hidden p-[1px] border border-border-theme">
                    <div className="h-full bg-gradient-to-r from-accent-pink to-accent-purple rounded-full w-full shadow-lg shadow-accent-pink/30" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-bg-tertiary/80 border border-border-theme rounded-2xl text-center">
                <User className="w-8 h-8 text-text-secondary mx-auto mb-2" />
                <p className="text-xs text-text-secondary font-mono">Đăng nhập để khởi tạo bảng điều khiển của bạn</p>
              </div>
            )}
          </div>

          {/* DYNAMIC RADAR CONSOLE (CHỈ SỐ SỨC MẠNH MÔN HỌC) */}
          {user && (
            <div className="bg-bg-secondary/95 border border-border-theme rounded-3xl p-6 shadow-2xl relative overflow-hidden neon-border-glow">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent-pink/30 rounded-tl-xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent-pink/30 rounded-br-xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4 border-b border-border-theme pb-3">
                <h3 className="text-[11px] font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-1.5 cyber-glitch-text">
                  <Sparkles className="w-4 h-4 text-accent-pink" /> QUÉT RADAR ĐA MÔN
                </h3>
                <span className="text-[8px] text-accent-pink/70 border border-accent-pink/20 px-1.5 py-0.5 rounded uppercase">
                  Chỉ số thực tế
                </span>
              </div>

              {/* Radar Chart Visual */}
              <div className="relative w-full flex items-center justify-center py-4 bg-bg-tertiary/50 rounded-2xl border border-border-theme">
                <svg width="200" height="200" className="relative z-10 overflow-visible">
                  {/* Radar grid circles */}
                  <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(240, 57, 140, 0.15)" strokeWidth="1" />
                  <circle cx="100" cy="100" r="45" fill="none" stroke="rgba(240, 57, 140, 0.1)" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="100" cy="100" r="20" fill="none" stroke="rgba(240, 57, 140, 0.1)" strokeWidth="1" />
                  
                  {/* Radar axis lines */}
                  <line x1="100" y1="30" x2="100" y2="170" stroke="rgba(240, 57, 140, 0.15)" strokeWidth="1" />
                  <line x1="30" y1="100" x2="170" y2="100" stroke="rgba(240, 57, 140, 0.15)" strokeWidth="1" />
                  
                  {/* Rotating sweep line */}
                  <line x1="100" y1="100" x2="100" y2="30" stroke="rgba(240, 57, 140, 0.3)" strokeWidth="1.5" style={{
                    transformOrigin: '100px 100px',
                    animation: 'radar-sweep 4s linear infinite'
                  }} />

                  {/* Filled polygon for subject strengths */}
                  <polygon 
                    points={getRadarPoints()} 
                    fill="rgba(240, 57, 140, 0.25)" 
                    stroke="rgba(240, 57, 140, 0.85)" 
                    strokeWidth="2" 
                    className="drop-shadow-[0_0_8px_rgba(240,57,140,0.5)]"
                  />

                  {/* Vertices indicator points */}
                  {(() => {
                    const strengths = personalization.subjectStrengths || { math: 50, physics: 50, chemistry: 50, biology: 50 };
                    const center = 100;
                    const maxVal = 100;
                    const r = 70;
                    return [
                      { x: center, y: center - (strengths.math / maxVal) * r },
                      { x: center + (strengths.physics / maxVal) * r, y: center },
                      { x: center, y: center + (strengths.chemistry / maxVal) * r },
                      { x: center - (strengths.biology / maxVal) * r, y: center }
                    ].map((pt, idx) => (
                      <circle key={idx} cx={pt.x} cy={pt.y} r="3.5" className="fill-white stroke-accent-pink stroke-2" />
                    ));
                  })()}

                  {/* Label Texts */}
                  <text x="100" y="22" textAnchor="middle" className="fill-text-secondary font-mono text-[9px] font-bold">TOÁN</text>
                  <text x="178" y="103" textAnchor="start" className="fill-text-secondary font-mono text-[9px] font-bold">LÝ</text>
                  <text x="100" y="188" textAnchor="middle" className="fill-text-secondary font-mono text-[9px] font-bold">HÓA</text>
                  <text x="22" y="103" textAnchor="end" className="fill-text-secondary font-mono text-[9px] font-bold">SINH</text>
                </svg>
              </div>

              {/* Legend with percentages */}
              {(() => {
                const strengths = personalization.subjectStrengths || { math: 50, physics: 50, chemistry: 50, biology: 50 };
                return (
                  <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-mono">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-bg-tertiary/75 border border-border-theme rounded-xl">
                      <span className="text-text-secondary">Toán học:</span>
                      <strong className="text-text-primary">{strengths.math}%</strong>
                    </div>
                    <div className="flex items-center justify-between px-3 py-1.5 bg-bg-tertiary/75 border border-border-theme rounded-xl">
                      <span className="text-text-secondary">Vật lý:</span>
                      <strong className="text-text-primary">{strengths.physics}%</strong>
                    </div>
                    <div className="flex items-center justify-between px-3 py-1.5 bg-bg-tertiary/75 border border-border-theme rounded-xl">
                      <span className="text-text-secondary">Hóa học:</span>
                      <strong className="text-text-primary">{strengths.chemistry}%</strong>
                    </div>
                    <div className="flex items-center justify-between px-3 py-1.5 bg-bg-tertiary/75 border border-border-theme rounded-xl">
                      <span className="text-text-secondary">Sinh học:</span>
                      <strong className="text-text-primary">{strengths.biology}%</strong>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}


          {/* DAILY QUESTS PANEL */}
          <div className="bg-bg-secondary/95 border border-border-theme p-6 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-border-theme pb-3">
              <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-accent-pink animate-pulse" /> Nhiệm vụ hàng ngày
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleResetQuests}
                  className="px-2 py-0.5 bg-bg-tertiary hover:bg-border-theme border border-border-theme text-[9px] font-mono text-text-secondary hover:text-text-primary rounded transition-all active:scale-95 flex items-center gap-1"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Reset
                </button>
                <span className="text-[9px] text-text-secondary font-mono">MỖI 24 GIỜ</span>
              </div>
            </div>

            <div className="space-y-3.5">
              {dailyQuests.map((quest) => {
                const isClaimed = claimedQuests[quest.id];
                return (
                  <div key={quest.id} className="flex flex-col gap-2.5 p-3.5 bg-bg-tertiary border border-border-theme rounded-2xl">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg shrink-0">{quest.icon}</span>
                        <div>
                          <h4 className="text-xs font-bold text-text-primary leading-tight">{quest.title}</h4>
                          <p className="text-[10px] text-text-secondary mt-0.5">{quest.desc}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-border-theme pt-2 mt-1">
                      <span className="text-[9px] font-bold text-amber-400 flex items-center gap-1">
                        PHẦN THƯỞNG: <CrystalIcon className="w-4 h-4" /> +{quest.reward}
                      </span>
                      
                      {user ? (
                        isClaimed ? (
                          <span className="text-[9px] font-bold text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded-xl flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> ĐÃ NHẬN
                          </span>
                        ) : checkQuestCompleted(quest.id) ? (
                          <button
                            onClick={() => handleClaimReward(quest.id, quest.reward)}
                            className="px-3 py-1.5 bg-gradient-to-r from-accent-pink to-rose-600 hover:opacity-90 text-[10px] font-bold text-white rounded-xl transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95 animate-pulse"
                          >
                            NHẬN THƯỞNG
                          </button>
                        ) : (
                          <span className="text-[9px] text-text-secondary font-mono font-bold bg-bg-primary/40 border border-border-theme px-2.5 py-1.5 rounded-xl">
                            CHƯA HOÀN THÀNH
                          </span>
                        )
                      ) : (
                        <span className="text-[9px] text-text-secondary font-mono italic">YÊU CẦU ĐĂNG NHẬP</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* ================== OVERLAY IFRAME PORTAL (FULLSCREEN SANDBOX LAB) ================== */}
      {activeLab && (
        <div className="fixed inset-0 z-[9999] bg-bg-primary flex flex-col">
          {/* Body chính: Iframe Lab + Sidebar AI */}
          <div className="flex-1 flex relative overflow-hidden bg-bg-primary">
            {/* Iframe load trang Lab */}
            <div className="flex-1 h-full relative">
              <iframe 
                src={activeLab.link} 
                className="w-full h-full border-none"
                title={activeLab.name}
              />
              
              {/* Nhóm nút điều khiển nổi ở góc dưới bên trái */}
              <div className="absolute bottom-6 left-6 z-30 flex items-center gap-2.5 screenshot-hide">
                {/* Nút quay lại Hub */}
                <button 
                  onClick={() => {
                    playSound.click();
                    setActiveLab(null);
                  }}
                  className="px-4 py-2.5 bg-danger hover:opacity-90 border border-danger/30 text-white rounded-2xl transition-all active:scale-95 flex items-center gap-1.5 shadow-lg shadow-danger/20 backdrop-blur-md group cursor-pointer"
                >
                  <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="text-[11px] font-black uppercase tracking-wider">Về Hub</span>
                </button>

                {/* Nút bật tắt Trợ lý AI */}
                <button 
                  onClick={() => setShowAiCompanion(!showAiCompanion)}
                  className={`p-2.5 border rounded-2xl transition-all active:scale-95 flex items-center justify-center shadow-lg backdrop-blur-md cursor-pointer ${
                    showAiCompanion 
                      ? 'bg-accent-pink border-accent-pink text-white shadow-accent-pink/20' 
                      : 'bg-bg-secondary/80 border-border-theme text-text-secondary hover:text-text-primary shadow-black/30'
                  }`}
                  title="Trợ lý thí nghiệm AI"
                >
                  <MessageSquare className="w-4.5 h-4.5" />
                </button>

                {/* Nút chụp ảnh kết quả */}
                <button 
                  onClick={handleTakeScreenshot}
                  className="p-2.5 bg-bg-secondary/80 border border-border-theme hover:border-accent-pink/35 text-text-secondary hover:text-text-primary rounded-2xl transition-all active:scale-95 flex items-center justify-center shadow-lg backdrop-blur-md cursor-pointer shadow-black/30"
                  title="Chụp ảnh kết quả"
                >
                  <Camera className="w-4.5 h-4.5 text-accent-pink" />
                </button>
              </div>
              
              {/* Flash screen khi chụp ảnh */}
              {screenshotFlash && (
                <div className="absolute inset-0 bg-white z-[99999] animate-[ping_0.3s_ease-in-out_infinite]" />
              )}
            </div>

            {/* Sidebar Trợ lý AI */}
            {showAiCompanion && (
              <div className="w-80 h-full bg-bg-secondary border-l border-border-theme flex flex-col justify-between z-20 shadow-2xl animate-in slide-in-from-right duration-300">
                {/* Header Sidebar */}
                <div className="p-4 border-b border-border-theme flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-accent-pink animate-pulse" />
                    <span className="text-xs font-black text-text-primary">Trợ lý AI Companion</span>
                  </div>
                  <button 
                    onClick={() => setShowAiCompanion(false)}
                    className="p-1 hover:bg-bg-tertiary rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Nội dung chat history */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
                  {chatHistory.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`text-[9px] text-text-secondary mb-1 font-mono`}>
                        {msg.sender === 'user' ? 'Bạn' : 'Companion AI'}
                      </div>
                      <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-accent-pink text-white rounded-tr-none shadow-md shadow-accent-pink/10' 
                          : 'bg-bg-tertiary border border-border-theme text-text-primary rounded-tl-none whitespace-pre-wrap'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex flex-col items-start">
                      <div className="text-[9px] text-text-secondary mb-1 font-mono">Companion AI</div>
                      <div className="p-3 bg-bg-tertiary border border-border-theme rounded-2xl rounded-tl-none text-xs text-text-secondary flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent-pink" />
                        Đang phân tích dữ liệu...
                      </div>
                    </div>
                  )}
                </div>

                {/* Chân Sidebar: gợi ý câu hỏi & ô nhập */}
                <div className="p-4 border-t border-border-theme space-y-3 bg-bg-tertiary">
                  {/* Câu hỏi gợi ý */}
                  {aiCompanionData[activeLab.id] && (
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wider text-left">Gợi ý chủ đề nhanh:</p>
                      <div className="flex flex-col gap-1.5">
                        {aiCompanionData[activeLab.id].suggestions.map((sug, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendChatMessage(sug)}
                            className="w-full text-[10px] text-text-secondary hover:text-text-primary bg-bg-primary hover:bg-bg-secondary border border-border-theme p-2 rounded-xl text-left transition-all truncate"
                          >
                            💡 {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input nhập chat */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChatMessage();
                    }}
                    className="flex gap-1.5 mt-2"
                  >
                    <input 
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Hỏi trợ lý công thức, lý thuyết..."
                      className="flex-1 bg-bg-primary border border-border-theme focus:border-accent-pink focus:outline-none rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary transition-colors"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-accent-pink hover:opacity-90 text-white rounded-xl transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================== MODAL XÁC NHẬN CHIA SỄ STORIES ================== */}
      {showShareConfirm && (
        <div className="fixed inset-0 z-[100000] bg-bg-primary/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-theme rounded-3xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden text-center">
            {/* Light effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-pink/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="w-16 h-16 rounded-full bg-accent-pink/10 border border-accent-pink/20 flex items-center justify-center mx-auto mb-5">
              <Camera className="w-8 h-8 text-accent-pink" />
            </div>

            <h3 className="text-lg font-black text-text-primary tracking-wide">ĐÃ CHỤP ẢNH BÁO CÁO THÍ NGHIỆM!</h3>
            <p className="text-xs text-text-secondary leading-relaxed mt-2.5 px-2">
              Kết quả thí nghiệm của bạn đã được ghi nhận. Bạn có muốn chia sẻ khoảnh khắc học tập xuất sắc này lên bảng tin <strong className="text-accent-pink">Stories Cộng đồng</strong> không?
            </p>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleConfirmShareToStories}
                className="flex-1 py-3 bg-accent-pink hover:opacity-90 text-white text-xs font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-accent-pink/20 cursor-pointer"
              >
                Chia sẻ ngay 🚀
              </button>
              <button
                onClick={() => {
                  playSound.click();
                  setShowShareConfirm(false);
                }}
                className="px-5 py-3 bg-bg-tertiary hover:bg-border-theme border border-border-theme text-text-secondary hover:text-text-primary text-xs font-bold rounded-2xl transition-all active:scale-95 cursor-pointer"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
