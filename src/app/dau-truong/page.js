'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { playSound } from '@/lib/sound';
import { db, functions, httpsCallable } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { 
  Swords, Timer, Activity, Zap, RotateCcw, 
  Compass, Cpu, Flame, Trophy, Beaker, CheckCircle2, AlertTriangle, Sparkles, Orbit,
  ArrowRight, Clock, User, Send, Gem
} from 'lucide-react';
import { 
  joinMatchmakingQueue, 
  leaveMatchmakingQueue, 
  getRankInfo,
  checkForRoomMerge
} from '@/lib/matchmaker';
import { 
  BIO_BANKS, 
  CHEMISTRY_MISSIONS, 
  getMathQuestionPool,
  getPhysicsTargetPool,
  generateBioPool, 
  generateMathPool, 
  generatePhysicsPool, 
  generateChemistryPool
} from '@/lib/arenaGenerator';
import { AvatarFrame } from '@/components/atoms/AvatarFrame';
import STEMAvatarSVG from '@/components/atoms/STEMAvatarSVG';
import { EXAM_DATABASE } from '@/data/exams';

const getTitleLabel = (title) => {
  const titles = {
    apprentice: 'Tập sự STEM',
    assistant: 'Trợ tá Nghiên cứu',
    researcher: 'Nghiên cứu viên',
    scholar: 'Học giả STEM',
    expert: 'Chuyên gia Lab',
    master: 'Viện sĩ STEM',
    grandmaster: 'Trưởng ban Học thuật'
  };
  return titles[title] || 'Học viên';
};

// Cấu hình bản đồ chỉ số dưới hóa học/toán học sang Unicode subscripts
const subscriptMap = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ', 'h': 'ₕ',
  'n': 'ₙ', 'm': 'ₘ', 'p': 'ₚ', 's': 'ₛ', 't': 'ₜ'
};

// Cấu hình bản đồ số mũ, điện tích sang Unicode superscripts
const superscriptMap = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 
  'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'k': 'ᵏ', 'm': 'ᵐ', 
  'n': 'ⁿ', 'o': 'ᵒ', 'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 
  't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ', 'x': 'ˣ', 'y': 'ʸ',
  'T': 'ᵀ', 'L': 'ᴸ'
};

// Danh sách các ánh xạ kí tự đặc biệt LaTeX sang Unicode
const latexTranslations = [
  { regex: /\\text\{\s*(.*?)\s*\}/g, replacement: '$1' },
  { regex: /\\pi/g, replacement: 'π' },
  { regex: /\\lambda/g, replacement: 'λ' },
  { regex: /\\mu/g, replacement: 'μ' },
  { regex: /\\alpha/g, replacement: 'α' },
  { regex: /\\beta/g, replacement: 'β' },
  { regex: /\\gamma/g, replacement: 'γ' },
  { regex: /\\epsilon/g, replacement: 'ε' },
  { regex: /\\varepsilon/g, replacement: 'ε' },
  { regex: /\\varphi/g, replacement: 'φ' },
  { regex: /\\phi/g, replacement: 'φ' },
  { regex: /\\omega/g, replacement: 'ω' },
  { regex: /\\Delta/g, replacement: 'Δ' },
  { regex: /\\Omega/g, replacement: 'Ω' },
  { regex: /\^\\circ/g, replacement: '°' },
  { regex: /\\circ/g, replacement: '°' },
  { regex: /\\rightarrow/g, replacement: ' ➔ ' },
  { regex: /\\Rightarrow/g, replacement: ' ➔ ' },
  { regex: /\\to/g, replacement: ' ➔ ' },
  { regex: /\\Leftrightarrow/g, replacement: ' ⇔ ' },
  { regex: /\\xrightarrow\{([^}]+)\}/g, replacement: ' ──($1)──> ' },
  { regex: /\\xrightarrow/g, replacement: ' ➔ ' },
  { regex: /\\times/g, replacement: ' × ' },
  { regex: /\\approx/g, replacement: ' ≈ ' },
  { regex: /\\cdot/g, replacement: ' · ' },
  { regex: /\\pm/g, replacement: '±' },
  { regex: /\\neq/g, replacement: '≠' },
  { regex: /\\infty/g, replacement: '∞' },
  { regex: /\\cup/g, replacement: ' ∪ ' },
  { regex: /\\le/g, replacement: '≤' },
  { regex: /\\ge/g, replacement: '≥' },
  { regex: /\\int/g, replacement: '∫' },
  { regex: /\\in\b/g, replacement: ' ∈ ' },
  { regex: /\\setminus/g, replacement: ' ∖ ' },
  { regex: /\\uparrow/g, replacement: '↑' },
  { regex: /\\downarrow/g, replacement: '↓' },
  { regex: /\\pieces/g, replacement: '.' },
  { regex: /\\mathbb\{R\}/g, replacement: 'ℝ' },
  { regex: /\\mathbb\{C\}/g, replacement: 'ℂ' },
  { regex: /\\mathbb\{N\}/g, replacement: 'ℕ' },
  { regex: /\\mathbb\{Z\}/g, replacement: 'ℤ' },
  { regex: /\\log/g, replacement: 'log' },
  { regex: /\\ln/g, replacement: 'ln' },
  { regex: /\\lim/g, replacement: 'lim' },
  { regex: /\\sin/g, replacement: 'sin' },
  { regex: /\\cos/g, replacement: 'cos' },
  { regex: /\\tan/g, replacement: 'tan' },
  { regex: /\\vec\{([^}]+)\}/g, replacement: 'vectơ $1' },
  { regex: /\\overrightarrow\{([^}]+)\}/g, replacement: 'vectơ $1' },
  { regex: /\\overline\{([^}]+)\}/g, replacement: '$1' },
  { regex: /\\,/g, replacement: ' ' },
  { regex: /\\;/g, replacement: ' ' },
  { regex: /\\quad/g, replacement: ' ' },
  { regex: /\\qquad/g, replacement: ' ' },
  { regex: /\\text/g, replacement: '' }
];

// Bộ phân tích biểu thức Toán lý hóa chuẩn sang Unicode đẹp mắt, không lỗi font
const formatMathText = (text) => {
  if (!text) return '';
  
  let formatted = text;
  
  // 1. Loại bỏ các kí hiệu mở đóng LaTeX \ ( và \ ) và $
  formatted = formatted.replace(/\\\(|\\\)/g, '');
  formatted = formatted.replace(/\$/g, '');
  
  // 1b. Inject referrerpolicy="no-referrer" và URL-encode cho thẻ img để tránh lỗi font/accent trong link ảnh
  formatted = formatted.replace(/<img\s+([^>]*?)src="([^"]+?)"([^>]*?)>/gi, (match, before, src, after) => {
    return `<img referrerpolicy="no-referrer" ${before}src="${encodeURI(src.trim())}"${after}>`;
  });
  
  // 2. Chạy dịch kí tự đặc biệt trước để tránh va chạm với bộ chuyển đổi subscript/superscript
  latexTranslations.forEach(t => {
    formatted = formatted.replace(t.regex, t.replacement);
  });

  // 3. Bảo vệ các khối lim_{...} khỏi việc bị chuyển đổi chỉ số dưới sai lệch
  formatted = formatted.replace(/lim_\{([^}]+)\}/g, '@@@LIMSTART@@@$1@@@LIMEND@@@');

  // 4. Chuyển đổi chỉ số dưới hóa học/toán học sang Unicode subscripts
  formatted = formatted.replace(/_\{([^}]+)\}/g, (match, p1) => {
    return p1.split('').map(char => subscriptMap[char] || char).join('');
  });
  
  formatted = formatted.replace(/_([0-9a-zA-Z])/g, (match, p1) => {
    return subscriptMap[p1] || p1;
  });

  // 5. Chuyển đổi số mũ, điện tích sang Unicode superscripts
  formatted = formatted.replace(/\^\{([^}]+)\}/g, (match, p1) => {
    return p1.split('').map(char => superscriptMap[char] || char).join('');
  });
  
  formatted = formatted.replace(/\^([0-9a-zA-Z+-])/g, (match, p1) => {
    return superscriptMap[p1] || p1;
  });

  // 6. Xử lý căn thức \sqrt{x} -> √(x) hỗ trợ ngoặc lồng nhau (ví dụ: \sqrt{\frac{l}{g}})
  while (formatted.includes('\\sqrt{')) {
    const startIdx = formatted.indexOf('\\sqrt{');
    let depth = 0;
    let endIdx = -1;
    for (let i = startIdx + 6; i < formatted.length; i++) {
      if (formatted[i] === '{') {
        depth++;
      } else if (formatted[i] === '}') {
        if (depth === 0) {
          endIdx = i;
          break;
        }
        depth--;
      }
    }
    
    if (endIdx !== -1) {
      const content = formatted.substring(startIdx + 6, endIdx);
      formatted = formatted.substring(0, startIdx) + `√(${content})` + formatted.substring(endIdx + 1);
    } else {
      break;
    }
  }

  // 7. Khôi phục lại khối lim_{...} đã được bảo vệ
  formatted = formatted.replace(/@@@LIMSTART@@@(.*?)@@@LIMEND@@?/g, 'lim_{$1}');

  // 7b. Dọn dẹp trùng lặp từ "vectơ vectơ" do cả text và regex cùng sinh ra
  formatted = formatted.replace(/(vectơ\s+)+/gi, 'vectơ ');

  // 8. Tách chuỗi và sinh HTML cho phân số và giới hạn
  if (!formatted.includes('\\frac') && !formatted.includes('lim_')) {
    return formatted;
  }

  let htmlParts = '';
  let lastIndex = 0;
  
  while (true) {
    const fracIdx = formatted.indexOf('\\frac{', lastIndex);
    const limIdx = formatted.indexOf('lim_{', lastIndex);
    
    let nextIdx = -1;
    let type = '';
    
    if (fracIdx !== -1 && limIdx !== -1) {
      if (fracIdx < limIdx) {
        nextIdx = fracIdx;
        type = 'frac';
      } else {
        nextIdx = limIdx;
        type = 'lim';
      }
    } else if (fracIdx !== -1) {
      nextIdx = fracIdx;
      type = 'frac';
    } else if (limIdx !== -1) {
      nextIdx = limIdx;
      type = 'lim';
    }
    
    if (nextIdx === -1) {
      break;
    }
    
    const textBefore = formatted.substring(lastIndex, nextIdx);
    if (textBefore) {
      htmlParts += textBefore;
    }
    
    if (type === 'frac') {
      const fracMatchRegex = /^\\frac\{([^{}]+)\}\{([^{}]+)\}/;
      const subStr = formatted.substring(nextIdx);
      const match = fracMatchRegex.exec(subStr);
      
      if (match) {
        const num = match[1];
        const den = match[2];
        htmlParts += `<span class="inline-flex flex-col items-center align-middle mx-1" style="font-size: 0.85em; line-height: 1.15;"><span class="border-b border-zinc-400 pb-0.5 px-0.5 text-center w-full">${num}</span><span class="pt-0.5 px-0.5 text-center w-full">${den}</span></span>`;
        lastIndex = nextIdx + match[0].length;
      } else {
        htmlParts += '\\frac';
        lastIndex = nextIdx + 6;
      }
    } else if (type === 'lim') {
      const limMatchRegex = /^lim_\{([^{}]+)\}/;
      const subStr = formatted.substring(nextIdx);
      const match = limMatchRegex.exec(subStr);
      
      if (match) {
        const limitContent = match[1];
        htmlParts += `<span class="inline-flex flex-col items-center align-middle mx-1" style="line-height: 0.9;"><span style="font-size: 13px; font-weight: 600; color: #e4e4e7;">lim</span><span style="font-size: 9px; color: #a1a1aa; user-select: none; margin-top: -0.1em;">${limitContent}</span></span>`;
        lastIndex = nextIdx + match[0].length;
      } else {
        htmlParts += 'lim_';
        lastIndex = nextIdx + 4;
      }
    }
  }
  
  const textAfter = formatted.substring(lastIndex);
  if (textAfter) {
    htmlParts += textAfter;
  }
  
  return htmlParts;
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
  const latestRoomDataRef = useRef(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const configSnap = await getDoc(doc(db, 'config', 'systemSettings'));
        if (configSnap.exists()) {
          const configData = configSnap.data();
          if (configData.theoryTimeLimit !== undefined) {
            setTheoryTimeLimit(Number(configData.theoryTimeLimit));
          }
        }
      } catch (err) {
        console.warn("Lỗi đọc theoryTimeLimit từ Firestore:", err);
      }
    };
    fetchSettings();
  }, []);

  const startFreePractice = (subjectId) => {
    playSound.success();
    
    // Khởi tạo trạng thái phòng chơi ảo cục bộ (Sandbox)
    setArenaStatus('playing');
    setIsPlayer1Role(true);
    setOpponentInfo({
      name: "Robot AI Luyện tập",
      elo: 1000,
      level: 1,
      title: "robot_practice"
    });
    
    // Gán ID phòng là local_sandbox
    setActiveRoomId("local_sandbox");
    
    // Đặt thời lượng phòng chơi luyện tập là 180 giây
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
      const chemPool = generateChemistryPool([], 5);
      // Gán câu hỏi
      setChemMission(chemPool[0]);
    } else if (subjectId === 'physics') {
      const target = generatePhysicsTarget();
      setPhysTarget(target);
    } else if (subjectId === 'math') {
      const ast = generateRandomMathAsteroids();
      setMathAsteroids(ast);
    } else if (subjectId === 'biology') {
      const bio = generateBioGame();
      setBioGame(bio);
    }
    
    // Đặt trạng thái chủ đề luyện tập
    useAppStore.setState(state => ({
      arenaState: {
        ...state.arenaState,
        subject: subjectId,
        playerProgress: 0,
        opponentProgress: 0,
        timeRemaining: 180,
        logs: ["Chào mừng đến phòng luyện tập tự do!", "Không tính ELO, hãy thoải mái thực hành."]
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
    localStorage.setItem('pending_share_story', JSON.stringify(shareData));
    router.push('/story');
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

        // Lấy 3 trận gần nhất và format
        const formattedMatches = matches.slice(0, 3).map((roomData) => {
          const isPlayer1 = roomData.player1?.uid === user.uid;
          const opp = isPlayer1 ? roomData.player2 : roomData.player1;
          const isWin = roomData.winnerId === user.uid;
          const isDraw = !roomData.winnerId;
          const result = isWin ? 'win' : (isDraw ? 'draw' : 'loss');

          return {
            id: roomData.id,
            opponent: opp?.name || 'Đối thủ ẩn danh',
            subject: roomData.subject === 'math' ? 'Toán học' :
                     roomData.subject === 'physics' ? 'Vật lý' :
                     roomData.subject === 'chemistry' ? 'Hóa học' : 'Sinh học',
            result,
            eloChange: isWin ? '+25' : (isDraw ? '0' : '-15'),
            time: roomData.createdAt ? formatMatchTime(roomData.createdAt) : 'Không rõ',
            avatarFrame: opp?.avatarFrame || 'default',
            avatarParts: opp?.avatarParts || null
          };
        });

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
  const [chemHCl, setChemHCl] = useState(0); // ml
  const [chemNaOH, setChemNaOH] = useState(0); // ml
  const [chemBurner, setChemBurner] = useState(false); // On/Off
  const [chemTemp, setChemTemp] = useState(25); // Celsius
  const [chemEvap, setChemEvap] = useState(0); // % bốc hơi
  const [chemTarget, setChemTarget] = useState(20); // Target ml để trung hòa
  const [chemMission, setChemMission] = useState(() => generateChemistryMission());
  const [chemAddCount, setChemAddCount] = useState(0); // Đếm thao tác
  const [showChemInstructions, setShowChemInstructions] = useState(true); // Trạng thái đóng/mở hướng dẫn nhiệm vụ Hóa Học

  // Game 2: Vật lý
  const [physPower, setPhysPower] = useState(false);
  const [physMirrors, setPhysMirrors] = useState([0, 0, 0]);
  const [physTarget, setPhysTarget] = useState(() => generatePhysicsTarget()); // Mục tiêu gương
  const [physHint, setPhysHint] = useState(0); // Số lần xem gợi ý

  // Game 3: Toán học
  const [mathTargetIndex, setMathTargetIndex] = useState(0);
  const [mathInputs, setMathInputs] = useState({ x: '', y: '' });
  const [mathAsteroids, setMathAsteroids] = useState(() => generateRandomMathAsteroids());
  const [mathLaserPath, setMathLaserPath] = useState(null);
  const [mathCombo, setMathCombo] = useState(0); // Combo liên tiếp
  const [mathWrongCount, setMathWrongCount] = useState(0); // Số lần sai

  // Game 4: Sinh học
  const [bioGame, setBioGame] = useState(() => generateBioGame());
  const [bioSelected, setBioSelected] = useState(null); // index đáp án đang chọn
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
      // Kết thúc đếm ngược, chính thức bắt đầu trận đấu
      setArenaStatus('playing');
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


  // Refs điều khiển game loop
  const matchmakingTimerRef = useRef(null);
  const gameLoopTimerRef = useRef(null);

  // LẮNG NGHE BẢNG XẾP HẠNG ONLINE THỜI GIAN THỰC
  useEffect(() => {
    if (arenaState.status === 'idle') {
      const usersCollection = collection(db, 'users');
      
      const unsubscribeLeaderboard = onSnapshot(usersCollection, (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          const uData = docSnap.data();
          list.push({
            uid: docSnap.id,
            displayName: uData.displayName || uData.name || 'Học viên ẩn danh',
            elo: uData.stats?.elo !== undefined ? uData.stats.elo : 0,
            level: uData.stats?.level || 1,
            wins: uData.stats?.wins || 0,
            losses: uData.stats?.losses || 0,
          });
        });
        
        list.sort((a, b) => b.elo - a.elo);
        setLeaderboard(list.slice(0, 10));
      }, (err) => {
        console.warn("Lỗi tải bảng xếp hạng:", err);
      });

      return () => unsubscribeLeaderboard();
    }
  }, [arenaState.status]);

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
      
      matchmakingTimerRef.current = setInterval(() => {
        playSound.hover();
        setMatchmakingTime((prev) => {
          const nextTime = prev + 1;
          
          if (
            nextTime - lastMergeCheck >= 3 && 
            currentActiveRoomId && 
            currentActiveRoomId.startsWith(`room_${user.uid}`)
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
                    if (roomData.status === 'playing' && roomData.player2) {
                      if (matchmakingTimerRef.current) clearInterval(matchmakingTimerRef.current);
                      handleMatchFoundReal(mergedId);
                    }
                  }
                }, (err) => {
                  console.error("Lỗi lắng nghe phòng đấu sau merge:", err);
                });
                
                const newRoomSnap = await getDoc(newRoomDocRef);
                if (newRoomSnap.exists() && newRoomSnap.data().status === 'playing') {
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
              localHistory = getSessionHistory('seen_chem_missions');
              const chemPool = generateChemistryPool(localHistory, 5);
              matchData.questionPool = chemPool.map(m => m.id);
            } else if (subject === 'physics') {
              localHistory = getSessionHistory('seen_phys_targets');
              const physPool = generatePhysicsPool(localHistory, 10);
              matchData.questionPool = physPool.map(arr => arr.join('-'));
            } else if (subject === 'math') {
              localHistory = getSessionHistory('seen_math_questions');
              const mathPool = generateMathPool(localHistory, 20);
              matchData.questionPool = mathPool;
            } else if (subject === 'biology') {
              localHistory = getSessionHistory('seen_bio_questions');
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
                bioPool = generateBioPool(localHistory, 30);
              } else {
                let available = bioPool.filter(q => !localHistory.includes(q.text));
                if (available.length < 30) {
                  available = bioPool;
                }
                bioPool = shuffleArray(available).slice(0, 30);
              }
              matchData.questionPool = bioPool;
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
              theoryTimeLimit
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
                if (roomData.status === 'playing' && roomData.player2) {
                  if (matchmakingTimerRef.current) clearInterval(matchmakingTimerRef.current);
                  handleMatchFoundReal(joinedRoomId);
                  return;
                }
              }
 
              unsubscribeQueue = onSnapshot(roomDocRef, (docSnap) => {
                if (docSnap.exists()) {
                  const roomData = docSnap.data();
                  if (roomData.status === 'playing' && roomData.player2) {
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

  // LẮNG NGHE SỰ KIỆN CHUYỂN TAB ĐỂ CẢNH BÁO GIAN LẬN
  useEffect(() => {
    if (arenaState.status !== 'playing' || !activeRoomId || !user || isPlayer1Role === null) return;

    let tabSwitchCount = 0;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        tabSwitchCount += 1;
        const msg = `🚨 CẢNH BÁO: Người chơi chuyển tab/rời màn hình lần ${tabSwitchCount}!`;
        addArenaLog(msg);
        
        // Cập nhật trường tabSwitches trong match room
        const roomDocRef = doc(db, 'match_rooms', activeRoomId);
        try {
          await updateDoc(roomDocRef, {
            [isPlayer1Role ? 'player1TabSwitches' : 'player2TabSwitches']: tabSwitchCount
          });
        } catch (err) {
          console.warn("Lỗi cập nhật số lần chuyển tab:", err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [arenaState.status, activeRoomId, user, isPlayer1Role]);

  // LẮNG NGHE ĐỒNG BỘ PHÒNG ĐẤU TRẬN THỜI GIAN THỰC
  useEffect(() => {
    let unsubscribeRoom = null;

    if (arenaState.status === 'playing' && activeRoomId && user) {
      const roomDocRef = doc(db, 'match_rooms', activeRoomId);

      unsubscribeRoom = onSnapshot(roomDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const roomData = docSnap.data();
          latestRoomDataRef.current = roomData;
          
          // Xác định vai trò của bản thân (Player 1 hay Player 2)
          const isPlayer1 = roomData.player1.uid === user.uid;
          const isPlayer2 = roomData.player2 ? roomData.player2.uid === user.uid : false;
          const opponent = isPlayer1 ? roomData.player2 : roomData.player1;
          const oppProgress = isPlayer1 ? roomData.player2Progress : roomData.player1Progress;
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

          // Kiểm tra xem phòng thi đấu đã hoàn thành hoặc có người chiến thắng chưa
          if (roomData.winnerId || roomData.status === 'result') {
            const eloChange = isPlayer1 ? roomData.player1EloChange : roomData.player2EloChange;
            const expChange = isPlayer1 ? roomData.player1ExpChange : roomData.player2ExpChange;
            const crystalChange = isPlayer1 ? roomData.player1CrystalChange : roomData.player2CrystalChange;

            let resultState = 'draw';
            if (roomData.winnerId === user.uid) {
              resultState = 'victory';
            } else if (roomData.winnerId === 'draw') {
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
          setArenaTimeRemaining(theoryTimeLimit);
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

    // --- ĐỒNG BỘ HÓA CÂU HỎI VÀ LỌC TRÙNG CHÉO ---
    const subject = roomData?.subject || arenaState.subject;
    const matchData = roomData?.matchData || {};
    const player1Seen = roomData?.player1Seen || [];
    const player2Seen = roomData?.player2Seen || [];

    if (subject === 'chemistry') {
      let finalTarget = 20;
      let finalMission = null;

      if (matchData.chemTarget !== undefined && matchData.chemMissionId) {
        finalTarget = matchData.chemTarget;
        finalMission = CHEMISTRY_MISSIONS.find(m => m.id === matchData.chemMissionId);
      } else if (matchData.questionPool && Array.isArray(matchData.questionPool)) {
        const pool = matchData.questionPool;
        const filtered = pool.filter(id => !player1Seen.includes(id) && !player2Seen.includes(id));
        const chosenId = filtered.length > 0 ? filtered[0] : pool[0];
        finalMission = CHEMISTRY_MISSIONS.find(m => m.id === chosenId);
        
        const chemTargetOptions = [10, 20, 30, 40];
        let seed = 0;
        for (let i = 0; i < roomId.length; i++) seed += roomId.charCodeAt(i);
        finalTarget = chemTargetOptions[seed % chemTargetOptions.length];
      }

      if (!finalMission) {
        finalMission = selectMissionFromRoomId(roomId);
      }
      setChemTarget(finalTarget);
      setChemMission(finalMission);
      updateSessionHistory('seen_chem_missions', [finalMission.id], 7);

    } else if (subject === 'physics') {
      let finalTarget = null;

      if (matchData.physTarget) {
        finalTarget = matchData.physTarget;
      } else if (matchData.questionPool && Array.isArray(matchData.questionPool)) {
        const pool = matchData.questionPool;
        const filtered = pool.filter(t => {
          const key = Array.isArray(t) ? t.join('-') : t;
          return !player1Seen.includes(key) && !player2Seen.includes(key);
        });
        const chosen = filtered.length > 0 ? filtered[0] : pool[0];
        finalTarget = Array.isArray(chosen) ? chosen : chosen.split('-').map(Number);
      }

      if (!finalTarget) {
        finalTarget = selectPhysicsTargetFromRoomId(roomId);
      }
      setPhysTarget(finalTarget);
      updateSessionHistory('seen_phys_targets', [finalTarget.join('-')], 15);

    } else if (subject === 'math') {
      let finalAsteroids = null;

      if (matchData.mathAsteroids) {
        finalAsteroids = matchData.mathAsteroids;
      } else if (matchData.questionPool && Array.isArray(matchData.questionPool)) {
        const pool = matchData.questionPool;
        const filtered = pool.filter(q => !player1Seen.includes(q.eq) && !player2Seen.includes(q.eq));
        const chosen = filtered.length >= 3 ? filtered.slice(0, 3) : pool.slice(0, 3);
        finalAsteroids = chosen.map((q, idx) => ({
          eq: q.eq,
          ans: q.ans,
          status: idx === 0 ? 'active' : 'pending',
          coord: q.coord
        }));
      }

      if (!finalAsteroids) {
        finalAsteroids = selectMathAsteroidsFromRoomId(roomId);
      }
      setMathAsteroids(finalAsteroids);
      updateSessionHistory('seen_math_questions', finalAsteroids.map(a => a.eq), 40);

    } else if (subject === 'biology') {
      let finalBioGame = null;

      if (matchData.bioGame) {
        finalBioGame = matchData.bioGame;
      } else if (matchData.questionPool && Array.isArray(matchData.questionPool)) {
        const pool = matchData.questionPool;
        const filtered = pool.filter(q => !player1Seen.includes(q.text) && !player2Seen.includes(q.text));
        const chosen = filtered.length >= 5 ? filtered.slice(0, 5) : pool.slice(0, 5);
        finalBioGame = {
          type: 'general',
          label: 'Sinh học Tổng hợp',
          icon: '🧬',
          questions: chosen,
          currentQ: 0,
          score: 0,
          mistakes: 0,
          answered: []
        };
      }

      if (!finalBioGame) {
        finalBioGame = selectBioGameFromRoomId(roomId);
      }
      setBioGame(finalBioGame);
      updateSessionHistory('seen_bio_questions', finalBioGame.questions.map(q => q.text), 100);
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
          tickArenaTime();
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
          
          const roomDocRef = doc(db, 'match_rooms', activeRoomId);
          try {
            const nextTime = Math.max(0, arenaState.timeRemaining - 1);
            await updateDoc(roomDocRef, {
              lastHeartbeat: now,
              timeRemaining: nextTime,
              ...(isPlayer2 && isHostOffline ? { hostBackupActive: true } : {})
            });
          } catch (err) {
            console.warn("Lỗi cập nhật heartbeat/timer:", err);
          }
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

  // Cảnh báo hết giờ hoặc thua cuộc thời gian thực
  useEffect(() => {
    if (arenaState.status === 'playing') {
      const checkMatchEnd = async () => {
        if (arenaState.timeRemaining <= 0) {
          if (activeRoomId === 'local_sandbox') {
            handleMatchEnd('defeat');
          } else if (activeRoomId) {
            try {
              const finalizeMatchFn = httpsCallable(functions, 'finalizeMatch');
              await finalizeMatchFn({ matchId: activeRoomId });
            } catch (err) {
              console.error("Lỗi gọi finalizeMatch khi hết giờ:", err);
            }
          }
        } else if (arenaState.playerProgress >= 100) {
          if (activeRoomId === 'local_sandbox') {
            handleMatchEnd('victory');
          } else if (activeRoomId) {
            try {
              const finalizeMatchFn = httpsCallable(functions, 'finalizeMatch');
              await finalizeMatchFn({ matchId: activeRoomId });
            } catch (err) {
              console.error("Lỗi gọi finalizeMatch khi hoàn thành 100%:", err);
            }
          }
        }
      };
      // Defer state update to avoid React Bad setState warnings
      const timer = setTimeout(checkMatchEnd, 0);
      return () => clearTimeout(timer);
    }
  }, [arenaState.timeRemaining, arenaState.playerProgress, arenaState.status, activeRoomId]);

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
    setMatchResult(result);

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
      setArenaStatus('result');
      return;
    }

    // Chế độ online: cập nhật local personalization state qua serverRewardData để đồng bộ hiển thị
    if (serverRewardData) {
      const { eloChange, expChange, crystalChange } = serverRewardData;

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
    }

    setArenaStatus('result');
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
  // LOGIC MINI-GAME 4: SINH HỌC (Genome Staircase Helix)
  // ----------------------------------------------------
  const handleBioAnswer = async (choiceIndex) => {
    if (bioRevealed) return;
    setBioSelected(choiceIndex);
    setBioRevealed(true);
    const q = bioGame.questions[bioGame.currentQ];
    const isCorrect = choiceIndex === q.correct;
    
    if (isCorrect) {
      playSound.success();
      setBioGame((prev) => ({ ...prev, score: prev.score + 1 }));
    } else {
      playSound.click();
      setBioGame((prev) => ({ ...prev, mistakes: prev.mistakes + 1 }));
    }

    if (activeRoomId === 'local_sandbox') {
      addArenaLog(isCorrect ? `✅ Đúng! ${q.note}` : `❌ Sai! Đáp án: ${q.choices[q.correct]}. ${q.note}`);
      return;
    }

    try {
      const submitAnswerFn = httpsCallable(functions, 'submitAnswer');
      const res = await submitAnswerFn({
        matchId: activeRoomId,
        questionId: String(bioGame.currentQ),
        selectedAnswer: choiceIndex
      });

      const { correct, currentProgress, explanation } = res.data;
      updatePlayerProgress(currentProgress);

      if (correct) {
        addArenaLog(`[Server] ✅ Đúng! ${explanation || q.note}`);
      } else {
        addArenaLog(`[Server] ❌ Sai! Đáp án: ${q.choices[q.correct]}. ${explanation || q.note}`);
      }
    } catch (err) {
      console.error("Lỗi submitAnswer biology:", err);
      addArenaLog(`🚨 Lỗi kết nối server khi nộp bài!`);
    }
  };

  const handleBioNext = () => {
    const nextQ = bioGame.currentQ + 1;
    setBioSelected(null);
    setBioRevealed(false);
    if (nextQ >= bioGame.questions.length) {
      if (activeRoomId === 'local_sandbox') {
        const pct = Math.round((bioGame.score / bioGame.questions.length) * 100);
        updatePlayerProgress(pct >= 60 ? Math.min(100, pct + 10) : pct);
      }
      addArenaLog(`🏁 Hoàn thành ${bioGame.label}! Đúng: ${bioGame.score}/${bioGame.questions.length}`);
    } else {
      setBioGame((prev) => ({ ...prev, currentQ: nextQ }));
      if (activeRoomId === 'local_sandbox') {
        updatePlayerProgress(Math.round((nextQ / bioGame.questions.length) * 100));
      }
    }
  };

  const phVal = getChemPH();
  const fluidColorClass = getChemFluidColor(phVal);

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col justify-center select-none font-sans text-zinc-100">
      
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
              <Swords className="w-14 h-14 text-rose-500 animate-pulse relative z-10 filter drop-shadow-[0_0_10px_#f43f5e]" />
              <div className="absolute inset-0 bg-rose-500/20 blur-md rounded-full" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-wider uppercase bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-rose-400">Đấu trường Khoa học 1v1</h1>
              <p className="text-zinc-500 text-xs mt-1 font-mono tracking-widest">[ COHERENT REAL-TIME SIMULATION PROTOCOL ]</p>
            </div>
          </div>
          <p className="text-zinc-400 text-sm max-w-lg text-center mb-10 leading-relaxed">
            Chào mừng bạn đến với hệ thống đấu trí đối kháng khoa học chuẩn hóa. Giải quyết nhanh các thử thách thực hành vật lý, hóa học, toán học, sinh học để cướp ELO của đối thủ.
          </p>

          <div className="flex flex-col gap-8 w-full max-w-6xl mt-2">
            {/* Chọn phòng thí nghiệm đấu trí full-width */}
            <div className="flex flex-col gap-6 w-full">
              <h2 className="text-base font-bold text-zinc-300 flex items-center gap-2 font-mono tracking-wider uppercase border-b border-white/5 pb-3">
                <span className="p-1.5 bg-rose-500/10 rounded-lg text-rose-400"><Swords className="w-4 h-4" /></span> CHỌN PHÒNG THÍ NGHIỆM ĐẤU TRÍ
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { id: 'math', name: 'Đại số & Tọa độ Vector', color: 'from-amber-500/10 to-yellow-600/15 border-amber-500/20 hover:border-amber-500/40 text-amber-400 shadow-amber-500/5', icon: <Orbit className="w-8 h-8" />, spec: 'Toán Học', desc: 'Sử dụng các hệ thức vector không gian để bắn pháo plasma triệt tiêu các tiểu hành tinh đang lao xuống.' },
                  { id: 'physics', name: 'Quang học Laser phản xạ', color: 'from-emerald-500/10 to-green-600/15 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 shadow-emerald-500/5', icon: <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />, spec: 'Vật Lý', desc: 'Đóng mạch cấp nguồn, tính toán hướng xoay và góc phản xạ gương để đưa tia laser hội tụ vào lõi phản ứng.' },
                  { id: 'chemistry', name: 'Chuẩn độ & Bốc hơi muối', color: 'from-pink-500/10 to-rose-600/15 border-pink-500/20 hover:border-pink-500/40 text-pink-400 shadow-pink-500/5', icon: <Beaker className="w-8 h-8" />, spec: 'Hóa Học', desc: 'Nhỏ dung dịch Axit và Bazơ trung hòa đúng tỷ lệ mol pH=7.0, gia nhiệt bay hơi kết tinh muối tinh khiết.' },
                  { id: 'biology', name: 'Giải mã Di truyền & Tế bào', color: 'from-cyan-500/10 to-blue-600/15 border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 shadow-cyan-500/5', icon: <Sparkles className="w-8 h-8" />, spec: 'Sinh Học', desc: 'Đối kháng trả lời trắc nghiệm sinh học chuyên sâu về di truyền Mendel, phân bào, chức năng bào quan và quang hợp.' }
                ].map((sub) => (
                  <div
                    key={sub.id}
                    className={`flex flex-col items-start p-6 bg-gradient-to-br ${sub.color} border rounded-3xl text-left shadow-xl group relative overflow-hidden transition-all duration-300`}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/2 rounded-full filter blur-xl transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-all" />
                    <div className="flex items-center justify-between w-full mb-5">
                      <div className="p-2.5 bg-white/5 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
                        {sub.icon}
                      </div>
                      <span className="text-[10px] font-bold font-mono tracking-widest px-2.5 py-1 bg-white/5 border border-white/5 rounded-full uppercase">{sub.spec}</span>
                    </div>
                    <h3 className="text-sm font-bold mb-2 text-white transition-colors leading-snug h-[40px] overflow-hidden">{sub.name}</h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mb-6 flex-grow">{sub.desc}</p>
                    <div className="grid grid-cols-2 gap-2 w-full mt-auto pt-4 border-t border-white/5">
                      <button
                        onClick={() => startMatching(sub.id)}
                        onMouseEnter={playSound.hover}
                        className="py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl text-[10px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 shadow-md shadow-pink-500/10 cursor-pointer"
                      >
                        ĐẤU HẠNG
                      </button>
                      <button
                        onClick={() => startFreePractice(sub.id)}
                        onMouseEnter={playSound.hover}
                        className="py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white rounded-xl text-[10px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        LUYỆN TẬP
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PVP DASHBOARD & HISTORY */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mt-4 w-full">
              {/* PvP Stats Card (5/12) */}
              <div className="lg:col-span-5 bg-gradient-to-br from-[#2a2c3a] to-[#1c1e29]/90 border border-white/5 p-6 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 w-full">
                  <h3 className="text-xs font-black text-pink-450 dark:text-pink-400 uppercase tracking-widest mb-4 font-mono">Chỉ số PvP cá nhân</h3>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div 
                      onClick={() => {
                        playSound.click();
                        router.push('/ho-so?tab=personalization&subtab=character');
                      }}
                      className="relative shrink-0 group/avatar cursor-pointer"
                      title="Thiết kế Avatar Chibi cá nhân"
                    >
                      <AvatarFrame frame={personalization.avatarFrame} className="w-20 h-20 text-3xl transition-all duration-300 group-hover/avatar:scale-105">
                        {personalization.avatarParts ? (
                          <STEMAvatarSVG parts={personalization.avatarParts} className="w-full h-full transform scale-90" />
                        ) : (
                          <User className="w-10 h-10 text-white" />
                        )}
                        
                        {/* Edit overlay */}
                        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 flex items-center justify-center z-20">
                          <span className="text-[10px] font-black text-white uppercase tracking-wider">Thiết kế</span>
                        </div>
                      </AvatarFrame>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white tracking-wide">{user?.displayName || 'Học viên'}</h4>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-pink-500/10 border border-pink-500/20 text-pink-450 dark:text-pink-400 font-bold uppercase tracking-wider">
                        {getTitleLabel(personalization.activeTitle)}
                      </span>
                      <p className="text-[9px] text-zinc-500 mt-1.5 font-mono">Cấp độ: {personalization.level}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 bg-white/2 border border-white/5 rounded-2xl p-4 text-center">
                    <div>
                      <p className="text-[10px] text-zinc-500 font-mono">Điểm Elo</p>
                      <p className="text-base font-black text-pink-400 mt-0.5">{personalization.elo}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 font-mono">Tỷ lệ thắng</p>
                      <p className="text-base font-black text-emerald-400 mt-0.5">
                        {personalization.wins + personalization.losses > 0
                          ? `${Math.round((personalization.wins / (personalization.wins + personalization.losses)) * 100)}%`
                          : '0%'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 font-mono">Trận thắng</p>
                      <p className="text-base font-black text-white mt-0.5">{personalization.wins}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-center relative z-10 w-full">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-zinc-500 font-mono">Trận thua: {personalization.losses}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                    <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Chuỗi: 0</span>
                  </div>
                </div>
              </div>

              {/* PvP Combat Log (7/12) */}
              <div className="lg:col-span-7 bg-[#1e202b]/80 backdrop-blur-2xl border border-white/5 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 font-mono flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-500" /> LỊCH SỬ THI ĐẤU PvP GẦN ĐÂY
                  </h3>
                  
                  <div className="space-y-3">
                    {loadingHistory ? (
                      <div className="flex flex-col items-center justify-center py-10 text-zinc-500 text-xs font-mono">
                        <Orbit className="w-6 h-6 animate-spin text-zinc-500 mb-2" />
                        ĐANG TẢI LỊCH SỬ ĐẤU...
                      </div>
                    ) : realHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-zinc-550 dark:text-zinc-500 text-xs font-mono border border-dashed border-white/5 rounded-2xl">
                        CHƯA CÓ DỮ LIỆU ĐẤU HẠNG PvP
                      </div>
                    ) : (
                      realHistory.map((log, idx) => (
                        <div key={log.id || idx} className="flex items-center justify-between p-3 bg-white/2 border border-white/5 rounded-2xl hover:border-white/10 hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0">
                              <AvatarFrame frame={log.avatarFrame} className="w-9 h-9 text-xs">
                                {log.avatarParts ? (
                                  <STEMAvatarSVG parts={log.avatarParts} className="w-full h-full transform scale-90" />
                                ) : (
                                  <User className="w-4 h-4 text-white" />
                                )}
                              </AvatarFrame>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{log.opponent}</span>
                                <span className="text-[8px] px-1.5 py-0.5 bg-white/5 border border-white/5 text-zinc-400 rounded-full font-mono uppercase">{log.subject}</span>
                              </div>
                              <span className="text-[9px] text-zinc-500">{log.time}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold font-mono ${log.result === 'win' ? 'text-emerald-400' : 'text-rose-500'}`}>
                              {log.result === 'win' ? 'THẮNG' : 'THUA'}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${log.result === 'win' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-450'}`}>
                              {log.eloChange} ELO
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 italic mt-4 text-center">
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
            <div className="absolute inset-0 border border-rose-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-4 border border-rose-500/20 rounded-full animate-pulse" />
            <div className="absolute inset-10 border border-rose-500/30 rounded-full" />
            <div className="absolute inset-20 border border-rose-500/40 border-dashed rounded-full" />
            <div className="absolute inset-0 rounded-full border border-rose-500/20 bg-gradient-to-t from-transparent via-rose-500/5 to-rose-500/15 animate-[spin_4s_linear_infinite]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <Swords className="w-8 h-8 text-rose-500 animate-pulse" />
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-1 font-mono">CONNECTING TO LOBBY SERVER...</h2>
          <p className="text-rose-400/80 text-xs font-mono tracking-widest mb-6 uppercase">ACTIVE DOMAIN: STOCHIOMETRIC {arenaState.subject} LABORATORY</p>
          
          <div className="flex items-center gap-2.5 px-4.5 py-2.5 bg-white/5 border border-white/5 rounded-2xl text-xs text-zinc-400 font-mono mb-10">
            <Timer className="w-4 h-4 animate-spin text-rose-400" /> SECONDS ELAPSED: {matchmakingTime}s
          </div>

          {matchmakingError && (
            <div className="mb-8 px-5 py-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-mono max-w-md text-center flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 animate-bounce" />
              <span>{matchmakingError}</span>
            </div>
          )}

          <button
            onMouseEnter={playSound.hover}
            onClick={cancelMatching}
            className="px-8 py-3 bg-[#1e202b] hover:bg-rose-600 hover:text-white border border-white/5 hover:border-rose-500 text-zinc-400 font-bold rounded-2xl transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> THOÁT HÀNG ĐỢI
          </button>
        </div>
      )}

      {/* 2.5 OVERLAY ĐIỆN ẢNH: ĐÃ TÌM THẤY TRẬN ĐẤU (CINEMATIC MATCH-FOUND OVERLAY) */}
      {matchFoundData && (
        <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
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
            <p className="text-zinc-500 text-xs font-mono tracking-widest mb-12 uppercase">
              DECRYPTING ROOM INTERNET PROTOCOL... ENCRYPTION SECURE
            </p>

            {/* Khay hiển thị hai đấu thủ */}
            <div className="grid grid-cols-1 md:grid-cols-11 gap-6 items-center justify-center">
              
              {/* Player 1 Card (Bạn) */}
              <div className="md:col-span-5 bg-[#1e202b] border border-white/5 p-6 rounded-3xl text-center shadow-2xl relative overflow-hidden group hover:border-pink-500/20 transition-all duration-300">
                <div className="absolute top-0 left-0 px-3 py-1 bg-white/5 border-r border-b border-white/5 rounded-br-2xl text-[8px] font-mono text-zinc-500 uppercase">
                  BẠN
                </div>
                <div className="relative shrink-0 w-24 h-24 flex items-center justify-center mx-auto mb-4">
                  <AvatarFrame frame={personalization.avatarFrame || 'default'} className="w-24 h-24">
                    <STEMAvatarSVG parts={personalization.avatarParts} className="w-16 h-16" />
                  </AvatarFrame>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-pink-500 border-2 border-[#1e202b] flex items-center justify-center text-[10px] font-black text-white font-mono shadow-md">
                    {personalization.level || 1}
                  </div>
                </div>
                <h3 className="text-md font-bold text-white font-mono uppercase tracking-wide truncate">
                  {personalization.name || user?.displayName || 'Bạn'}
                </h3>
                <span className="text-[9px] font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 rounded-full inline-block mt-2 font-mono uppercase tracking-wider">
                  {getTitleLabel(personalization.activeTitle || 'apprentice')}
                </span>
                <div className="mt-4 pt-3 border-t border-white/5 flex justify-center gap-1.5 items-center">
                  <Trophy className="w-4 h-4 text-pink-400" />
                  <span className="text-xs font-mono font-black text-white">ELO {personalization.elo || 1000}</span>
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
              <div className="md:col-span-5 bg-[#1e202b] border border-rose-500/10 p-6 rounded-3xl text-center shadow-2xl relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 px-3 py-1 bg-rose-500/10 border-l border-b border-rose-500/20 rounded-bl-2xl text-[8px] font-mono text-rose-400 uppercase">
                  ĐỐI THỦ
                </div>
                {matchFoundData.opponent ? (
                  <>
                    <div className="relative shrink-0 w-24 h-24 flex items-center justify-center mx-auto mb-4">
                      <AvatarFrame frame={matchFoundData.opponent.avatarFrame || 'default'} className="w-24 h-24">
                        <STEMAvatarSVG parts={matchFoundData.opponent.avatarParts} className="w-16 h-16" />
                      </AvatarFrame>
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-rose-500 border-2 border-[#1e202b] flex items-center justify-center text-[10px] font-black text-white font-mono shadow-md">
                        {matchFoundData.opponent.level || 1}
                      </div>
                    </div>
                    <h3 className="text-md font-bold text-white font-mono uppercase tracking-wide truncate">
                      {matchFoundData.opponent.name || 'Đối thủ'}
                    </h3>
                    <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full inline-block mt-2 font-mono uppercase tracking-wider">
                      {getTitleLabel(matchFoundData.opponent.activeTitle || 'apprentice')}
                    </span>
                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-center gap-1.5 items-center">
                      <Trophy className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-mono font-black text-white">ELO {matchFoundData.opponent.elo || 1000}</span>
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

      {/* 3. TRẠNG THÁI PLAYING: SPLIT-SCREEN LAB ARENA */}
      {arenaState.status === 'playing' && (
        <div className="fixed inset-0 w-screen h-screen overflow-hidden p-6 bg-[#0f111a] flex flex-col lg:flex-row gap-6 z-[99999] animate-in zoom-in-95 duration-300">
          
          {/* CỘT TRÁI (COL-SPAN-8): THÍ NGHIỆM TƯƠNG TÁC CỦA NGƯỜI CHƠI */}
          <div className="flex-1 flex flex-col bg-[#1e202b]/90 backdrop-blur-xl border border-white/5 rounded-3xl p-4 lg:p-5 pb-3 lg:pb-4 shadow-2xl overflow-hidden relative h-full">
            
            {/* Header Mini Game */}
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center justify-center text-pink-400 shrink-0">
                  <Beaker className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-md font-bold text-white leading-tight">
                    {arenaState.subject === 'chemistry' && 'HÓA HỌC: BẢN ĐỒ THỰC HÀNH HÓA HỌC CHUYÊN SÂU'}
                    {arenaState.subject === 'physics' && 'VẬT LÝ: THIẾT KẾ MẠCH QUANG HỌC LASER'}
                    {arenaState.subject === 'math' && 'TOÁN HỌC: HỆ TỌA ĐỘ PHÒNG THỦ VŨ TRỤ'}
                    {arenaState.subject === 'biology' && 'SINH HỌC: MÃ TÁI TỔ HỢP ADN XOẮN KÉP'}
                  </h2>
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">LABORATORY EXPERIMENT INTERFACE</span>
                </div>
              </div>
              
              {/* Timer đếm ngược */}
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold font-mono border ${
                arenaState.timeRemaining <= 15 
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse' 
                  : 'bg-white/5 text-zinc-300 border-white/5'
              }`}>
                <Timer className="w-4 h-4 shrink-0 text-pink-400" /> SEC: {arenaState.timeRemaining}s
              </div>
            </div>

            {/* PHÒNG LAB 1: HÓA HỌC (QuantumLab v4.0 Embedded Sandbox) */}
            {arenaState.subject === 'chemistry' && (() => {
              const activeMission = chemMission;
              return (
                <div className="flex-1 flex flex-col gap-4 py-2 w-full overflow-y-auto h-full pr-1 scrollbar-thin scrollbar-thumb-pink-500/20 scrollbar-track-transparent">
                  {/* Dashboard Nhiệm vụ Hóa Học Đấu Trường */}
                  {activeMission && (
                    showChemInstructions ? (
                      <div className="bg-gradient-to-r from-pink-950/40 via-[#14151f] to-rose-950/30 border border-pink-500/20 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row gap-5 items-start justify-between shrink-0 relative transition-all duration-300">
                        {/* Nút ẩn chi tiết */}
                        <button 
                          onClick={() => setShowChemInstructions(false)}
                          className="absolute top-4 right-4 text-[10px] text-zinc-400 hover:text-zinc-200 font-mono bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-xl transition-all z-10"
                        >
                          Thu gọn ▴
                        </button>
                        
                        <div className="flex-1 pr-12">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded-full text-[9px] font-bold text-rose-400 tracking-wider uppercase font-mono animate-pulse">
                              MỤC TIÊU ĐẤU TRƯỜNG
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">ID: {activeMission.id}</span>
                          </div>
                          <h3 className="text-md font-black text-white flex items-center gap-2">
                            🧪 {activeMission.name}
                          </h3>
                          <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed font-sans">
                            {activeMission.instructions}
                          </p>
                        </div>
                        
                        <div className="w-full md:w-80 shrink-0 bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-between font-mono gap-3 select-none">
                          <div>
                            <span className="text-[9px] text-zinc-500 block uppercase tracking-wider mb-1">Phương trình mục tiêu</span>
                            <div className="text-xs font-bold text-pink-400 bg-pink-500/5 border border-pink-500/10 py-1.5 px-3 rounded-xl tracking-wide text-center">
                              {activeMission.equation}
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500 font-sans">Mức độ nguy hiểm:</span>
                            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                              {activeMission.hazard}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#1e202b]/60 border border-pink-500/10 rounded-2xl px-4 py-2.5 flex items-center justify-between shrink-0 transition-all duration-300">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-[9px] font-bold text-rose-400 font-mono uppercase tracking-wider">
                            MỤC TIÊU
                          </span>
                          <span className="text-xs font-bold text-white">🧪 {activeMission.name}</span>
                          <span className="text-[10px] text-zinc-500 font-mono hidden md:inline">| Phương trình: {activeMission.equation}</span>
                        </div>
                        <button 
                          onClick={() => setShowChemInstructions(true)}
                          className="text-[10px] text-pink-400 hover:text-pink-300 font-mono bg-pink-500/10 hover:bg-pink-500/20 px-3 py-1 rounded-xl transition-all"
                        >
                          Hiện chi tiết ▾
                        </button>
                      </div>
                    )
                  )}

                  {/* QuantumLab Sandbox Container */}
                  <div className="w-full h-[680px] shrink-0 rounded-3xl border border-white/10 bg-black overflow-hidden shadow-2xl relative">
                    {/* Lab Frame */}
                    <iframe 
                      src="/labs/lab-ktra15p/dist/index.html?v=4.0.4&mode=arena" 
                      className="absolute inset-0 w-full h-full border-none"
                      title="QuantumLab v4.0 Sandbox"
                      id="chemistry-lab-iframe"
                    />
                  </div>
                </div>
              );
            })()}


            {/* PHÒNG LAB 2: VẬT LÝ (Optical Laser Breadboard Layout) */}
            {arenaState.subject === 'physics' && (
              <div className="flex-1 flex flex-col md:flex-row items-stretch gap-6 py-4 w-full overflow-hidden h-full">
                {/* Lưới Breadboard quang học cao cấp */}
                <div className="flex-1 flex items-center justify-center relative w-full bg-[#14151f] rounded-3xl border border-white/5 p-6 shadow-inner select-none overflow-hidden min-w-0 h-full">
                  <div className="min-w-[340px] max-w-md w-full relative flex items-center justify-center py-4">
                    {/* Metal Dotted Breadboard Grid pattern */}
                    <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                    {physPower && (
                      <div className="absolute inset-0 pointer-events-none z-10">
                        <svg className="w-full h-full" viewBox="0 0 350 200">
                          {/* Glowing Red laser beam paths */}
                          <line x1="45" y1="140" x2="45" y2="50" stroke="#f43f5e" strokeWidth="3.5" className="animate-[pulse_1s_infinite]" strokeLinecap="round" />
                          
                          {physMirrors[0] === physTarget[0] && (
                            <line x1="45" y1="50" x2="175" y2="50" stroke="#f43f5e" strokeWidth="3.5" strokeLinecap="round" />
                          )}
                          
                          {physMirrors[0] === physTarget[0] && physMirrors[1] === physTarget[1] && (
                            <line x1="175" y1="50" x2="175" y2="140" stroke="#f43f5e" strokeWidth="3.5" strokeLinecap="round" />
                          )}
                          
                          {physMirrors[0] === physTarget[0] && physMirrors[1] === physTarget[1] && physMirrors[2] === physTarget[2] && (
                            <>
                              <line x1="175" y1="140" x2="290" y2="140" stroke="#22d3ee" strokeWidth="5.5" className="animate-pulse" strokeLinecap="round" />
                              {/* Particles floating in energy receiver */}
                              <circle cx="295" cy="140" r="4" fill="#22d3ee" className="animate-ping" />
                            </>
                          )}
                        </svg>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-8 w-full max-w-md relative z-20">
                      {/* Emitter */}
                      <div className="flex flex-col items-center justify-center bg-[#1e202b] p-3 rounded-2xl border border-white/5 h-24 relative shadow-lg">
                        <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${physPower ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]' : 'bg-zinc-700'}`} />
                        <Cpu className={`w-9 h-9 ${physPower ? 'text-rose-500' : 'text-zinc-600'}`} />
                        <span className="text-[8px] font-mono text-zinc-500 font-bold uppercase mt-2">LASER EMITTER</span>
                      </div>

                      {/* Mirror A */}
                      <button 
                        onMouseEnter={playSound.hover}
                        onClick={() => handlePhysRotateMirror(0)}
                        className="flex flex-col items-center justify-center bg-[#1e202b] hover:bg-white/5 p-3 rounded-2xl border border-white/10 h-24 cursor-pointer relative shadow-lg transition-transform duration-200"
                      >
                        <div className="w-14 h-2.5 bg-gradient-to-r from-cyan-400 to-cyan-500 border border-white/20 rounded-full transition-transform duration-300 shadow-md" style={{ transform: `rotate(${physMirrors[0]}deg)` }} />
                        <span className="text-[8px] font-mono text-zinc-400 font-bold uppercase mt-3">MIRROR A ({physMirrors[0]}°)</span>
                      </button>

                      <div className="border border-dashed border-white/5 rounded-2xl h-24" />

                      <div className="border border-dashed border-white/5 rounded-2xl h-24" />

                      {/* Mirror B */}
                      <button 
                        onMouseEnter={playSound.hover}
                        onClick={() => handlePhysRotateMirror(1)}
                        className="flex flex-col items-center justify-center bg-[#1e202b] hover:bg-white/5 p-3 rounded-2xl border border-white/10 h-24 cursor-pointer relative shadow-lg transition-transform duration-200"
                      >
                        <div className="w-14 h-2.5 bg-gradient-to-r from-cyan-400 to-cyan-500 border border-white/20 rounded-full transition-transform duration-300 shadow-md" style={{ transform: `rotate(${physMirrors[1]}deg)` }} />
                        <span className="text-[8px] font-mono text-zinc-400 font-bold uppercase mt-3">MIRROR B ({physMirrors[1]}°)</span>
                      </button>
                  {/* Mirror C */}
                      <button 
                        onMouseEnter={playSound.hover}
                        onClick={() => handlePhysRotateMirror(2)}
                        className="flex flex-col items-center justify-center bg-[#1e202b] hover:bg-white/5 p-3 rounded-2xl border border-white/10 h-24 cursor-pointer relative shadow-lg transition-transform duration-200"
                      >
                        <div className="w-14 h-2.5 bg-gradient-to-r from-cyan-400 to-cyan-500 border border-white/20 rounded-full transition-transform duration-300 shadow-md" style={{ transform: `rotate(${physMirrors[2]}deg)` }} />
                        <span className="text-[8px] font-mono text-zinc-400 font-bold uppercase mt-3">MIRROR C ({physMirrors[2]}°)</span>
                      </button>

                      <div className="border border-dashed border-white/5 rounded-2xl h-24" />

                      {/* Receiver */}
                      <div className="flex flex-col items-center justify-center bg-[#1e202b] p-3 rounded-2xl border border-white/5 h-24 relative shadow-lg">
                        <Trophy className={`w-9 h-9 transition-colors ${physPower && physMirrors[0] === physTarget[0] && physMirrors[1] === physTarget[1] && physMirrors[2] === physTarget[2] ? 'text-cyan-400 animate-bounce' : 'text-zinc-700'}`} />
                        <span className="text-[8px] font-mono text-zinc-500 font-bold uppercase mt-2">ENERGY RECEIVER</span>
                      </div>

                      <div className="border border-dashed border-white/5 rounded-2xl h-24" />
                    </div>
                  </div>
                </div>

                {/* Laser config */}
                <div className="w-full md:w-80 shrink-0 flex flex-col gap-5 bg-[#14151f] p-6 rounded-3xl border border-white/5 font-mono justify-between h-full overflow-y-auto">
                  <div>
                    <span className="text-xs font-bold text-zinc-400 border-b border-white/5 pb-2.5 mb-4 block uppercase tracking-widest">AC ELECTRICS PANEL</span>
                    
                    <button 
                      onMouseEnter={playSound.hover}
                      onClick={handlePhysPowerToggle}
                      className={`w-full py-3.5 text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                        physPower 
                          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' 
                          : 'bg-[#1e202b] text-zinc-400 hover:text-white border border-white/5'
                      }`}
                    >
                      <Zap className="w-4 h-4 fill-current shrink-0" /> {physPower ? 'POWER VOLTAGE: ON' : 'POWER VOLTAGE: OFF'}
                    </button>
                  </div>

                  <div className="bg-[#1e202b] p-4 rounded-2xl border border-white/5 text-[10px] text-zinc-400 leading-relaxed font-sans">
                    <div className="text-zinc-200 font-bold flex gap-1.5 items-center mb-1.5">
                      <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
                      <span>QUANG HỌC CHÙM TIA:</span>
                    </div>
                    * Đóng nguồn điện AC để sáng Laser phát ra chùm ánh sáng liên tục.<br />
                    * <strong className="text-cyan-300">Mục tiêu trận này:</strong> Gương A = <strong className="text-rose-300">{physTarget[0]}°</strong>, Gương B = <strong className="text-rose-300">{physTarget[1]}°</strong>, Gương C = <strong className="text-rose-300">{physTarget[2]}°</strong>
                  </div>
                </div>
              </div>
            )}

            {/* PHÒNG LAB 3: TOÁN HỌC (Descartes Space Coordinate Radar Deck) */}
            {arenaState.subject === 'math' && (
              <div className="flex-1 flex flex-col md:flex-row items-stretch gap-6 py-4 w-full overflow-hidden h-full">
                {/* Lưới radar không gian toán học */}
                <div className="flex-1 flex items-center justify-center relative w-full bg-[#14151f] rounded-3xl border border-white/5 p-6 shadow-inner select-none overflow-hidden min-w-0 h-full">
                  <div className="min-w-[260px] w-full flex items-center justify-center relative py-4">
                    {/* Cartesian 2D Coordinate Grid plot */}
                    <div className="w-64 h-64 border border-zinc-800 rounded-full relative flex items-center justify-center overflow-hidden">
                      {/* Ring elements */}
                      <div className="absolute inset-0 border border-zinc-800/40 rounded-full scale-75 pointer-events-none" />
                      <div className="absolute inset-0 border border-zinc-800/40 rounded-full scale-50 pointer-events-none" />
                      <div className="absolute inset-0 border border-zinc-800/40 rounded-full scale-25 pointer-events-none" />
                      
                      {/* Coordinate axes */}
                      <div className="absolute inset-y-0 left-1/2 border-l border-zinc-800/60 pointer-events-none" />
                      <div className="absolute inset-x-0 top-1/2 border-t border-zinc-800/60 pointer-events-none" />

                      {/* Firing laser path animation */}
                      {mathLaserPath && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
                          {/* Line from center (0,0) to target mapped grid */}
                          <line 
                            x1="128" 
                            y1="128" 
                            x2={128 + (mathLaserPath.x * 11)} 
                            y2={128 - (mathLaserPath.y * 11)} 
                            stroke="#22d3ee" 
                            strokeWidth="3.5" 
                            className="animate-pulse animate-out fade-out duration-500"
                          />
                        </svg>
                      )}

                      {/* Active Radar Sweep */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-500/5 to-cyan-500/10 rounded-full animate-[spin_6s_linear_infinite] pointer-events-none" />

                      {/* Plot Asteroid Targets */}
                      {mathAsteroids.map((ast, i) => {
                        // Map math coordinates to 256x256 pixel grid centered at 128,128
                        // Scale factor = 11px per coordinate unit
                        const posX = 128 + (ast.coord.x * 11);
                        const posY = 128 - (ast.coord.y * 11);

                        return (
                          <div 
                            key={i}
                            className="absolute w-4 h-4 -translate-x-2 -translate-y-2 z-20 flex items-center justify-center"
                            style={{ left: `${posX}px`, top: `${posY}px` }}
                          >
                            {ast.status === 'active' && (
                              <>
                                <div className="absolute inset-0 bg-amber-500/30 rounded-full animate-ping" />
                                <Flame className="w-4 h-4 text-amber-500 relative z-10 animate-bounce" />
                              </>
                            )}
                            {ast.status === 'destroyed' && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shadow-md animate-pulse" />
                            )}
                            {ast.status === 'pending' && (
                              <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full" />
                            )}
                          </div>
                        );
                      })}

                      <span className="absolute bottom-2 right-2 text-[8px] font-mono text-zinc-600">RANGE: 10ly</span>
                    </div>

                    {/* Navigation HUD stats */}
                    <div className="absolute left-4 top-4 bg-[#1e202b]/95 p-3 rounded-xl border border-white/5 font-mono text-[8px] text-zinc-500 flex flex-col gap-1 select-none">
                      <span>SECTOR: DELTA-DES-9</span>
                      <span>BEARING: {mathAsteroids[mathTargetIndex] ? `${120 + (mathTargetIndex * 45)}°` : '0°'}</span>
                      <span>TGT DISTANCE: {mathAsteroids[mathTargetIndex] ? `${240 - (mathTargetIndex * 60)}k km` : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Input pad */}
                <form onSubmit={handleMathInputSubmit} className="w-full md:w-80 shrink-0 bg-[#14151f] p-6 rounded-3xl border border-white/5 flex flex-col gap-5 font-mono justify-between h-full overflow-y-auto">
                  <div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">VECTOR TARGET LOCK</span>
                      <span className="text-[10px] font-bold text-pink-400">{mathTargetIndex + 1} / 3</span>
                    </div>

                    <div className="bg-[#1e202b] p-3.5 rounded-2xl border border-white/5 text-center mb-4">
                      <span className="text-[9px] text-zinc-500 block uppercase mb-2">PHƯƠNG TRÌNH QUỸ ĐẠO</span>
                      <code className="text-sm font-bold text-white tracking-widest">{mathAsteroids[mathTargetIndex]?.eq}</code>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-[9.5px] text-zinc-500 block uppercase mb-1.5 font-bold">Hoành độ x</label>
                        <input 
                          type="number" 
                          required
                          value={mathInputs.x}
                          onChange={(e) => setMathInputs({ ...mathInputs, x: e.target.value })}
                          placeholder="x = ?"
                          className="w-full bg-[#1e202b] border border-white/5 focus:border-pink-500 focus:outline-none rounded-2xl text-center py-2.5 text-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] text-zinc-500 block uppercase mb-1.5 font-bold">Tung độ y</label>
                        <input 
                          type="number" 
                          required
                          value={mathInputs.y}
                          onChange={(e) => setMathInputs({ ...mathInputs, y: e.target.value })}
                          placeholder="y = ?"
                          className="w-full bg-[#1e202b] border border-white/5 focus:border-pink-500 focus:outline-none rounded-2xl text-center py-2.5 text-white font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    onMouseEnter={playSound.hover}
                    className="w-full py-3.5 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-pink-500/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white shrink-0 animate-bounce" /> KÍCH PHÁO PLASMA
                  </button>
                </form>
              </div>
            )}

            {/* PHÒNG LAB 4: SINH HỌC (Genome Staircase Helix) */}
            {arenaState.subject === `biology` && (
              <div className="flex-1 flex flex-col md:flex-row items-stretch gap-6 py-4 w-full overflow-hidden h-full">
                {/* MCQ Question Area */}
                <div className="flex-1 flex flex-col justify-between bg-[#14151f] rounded-3xl border border-white/5 p-6 shadow-inner select-none h-full overflow-y-auto">
                  <div>
                    {/* Header bar */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                        {bioGame.icon} {bioGame.label}
                      </span>
                      <span className="text-xs font-mono text-zinc-500">
                        CÂU HỎI {bioGame.currentQ + 1} / {bioGame.questions.length}
                      </span>
                    </div>

                    {/* Question text */}
                    <div className="bg-[#1e202b] p-6 rounded-2xl border border-white/5 mb-6">
                      <h3 className="text-base font-bold text-zinc-100 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMathText(bioGame.questions[bioGame.currentQ]?.text) }} />
                    </div>

                    {/* Choices */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {bioGame.questions[bioGame.currentQ]?.choices.map((choice, idx) => {
                        const isSelected = bioSelected === idx;
                        const isCorrectIdx = idx === bioGame.questions[bioGame.currentQ]?.correct;
                        
                        let btnStyle = "border-white/5 bg-[#1a1b26] text-zinc-300 hover:border-cyan-500/30 hover:bg-cyan-500/5";
                        if (bioRevealed) {
                          if (isCorrectIdx) {
                            btnStyle = "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-bold";
                          } else if (isSelected) {
                            btnStyle = "border-rose-500/50 bg-rose-500/10 text-rose-400 font-bold";
                          } else {
                            btnStyle = "border-white/5 bg-[#1a1b26] text-zinc-600 opacity-50";
                          }
                        } else if (isSelected) {
                          btnStyle = "border-cyan-500 bg-cyan-500/10 text-cyan-400 font-bold";
                        }

                        return (
                          <button
                            key={idx}
                            disabled={bioRevealed}
                            onClick={() => handleBioAnswer(idx)}
                            className={`p-4 rounded-xl text-left text-sm transition-all border text-zinc-300 flex items-center gap-3 cursor-pointer ${btnStyle}`}
                          >
                            <span className="w-6 h-6 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-[11px] font-mono shrink-0 font-bold">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span dangerouslySetInnerHTML={{ __html: formatMathText(choice) }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Next Button and Explanation */}
                  {bioRevealed && (
                    <div className="mt-6 flex flex-col gap-4">
                      <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl text-xs text-emerald-300 leading-relaxed flex items-start gap-2">
                        <span className="shrink-0 bg-emerald-500/20 p-1 rounded-lg text-emerald-400 font-bold text-[10px]">✓ GIẢI THÍCH</span>
                        <span dangerouslySetInnerHTML={{ __html: formatMathText(bioGame.questions[bioGame.currentQ]?.note) }} />
                      </div>
                      <button
                        onClick={handleBioNext}
                        className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        {bioGame.currentQ + 1 >= bioGame.questions.length ? 'Ho�n th�nh đấu trường' : 'C�u hỏi tiếp theo'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Panel HUD / Score stats */}
                <div className="w-full md:w-80 shrink-0 flex flex-col gap-5 bg-[#14151f] p-6 rounded-3xl border border-white/5 font-mono justify-between">
                  <div>
                    <span className="text-xs font-bold text-zinc-400 border-b border-white/5 pb-2.5 mb-4 block uppercase tracking-widest">
                      BẢNG TH�NG TIN GEN
                    </span>

                    <div className="flex flex-col gap-3.5 mb-6">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Chủ đề:</span>
                        <span className="text-cyan-400 font-bold">{bioGame.label}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Số c�u đ�ng:</span>
                        <span className="text-emerald-400 font-bold">{bioGame.score} / {bioGame.questions.length}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Số c�u sai:</span>
                        <span className="text-rose-400 font-bold">{bioGame.mistakes}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1e202b] p-4 rounded-2xl border border-white/5 text-[10px] text-zinc-400 leading-relaxed font-sans">
                    <div className="text-zinc-200 font-bold flex gap-1.5 items-center mb-1.5">
                      <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <span>HƯỚNG DẪN ĐẤU TRƯỜNG</span>
                    </div>
                    * Đọc kỹ c�u hỏi v� chọn phương �n trả lời đ�ng nhất trong 4 đ�p �n.<br />
                    * Trả lời đ�ng gi�p gia tăng tiến độ ph�ng thi đấu l�n 100%.<br />
                    * Mỗi trận đấu sẽ sinh ngẫu nhi�n bộ c�u hỏi từ c�c chương sinh học tế b�o, ph�n b�o v� di truyền học.
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar Toàn trận dưới đáy cột */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-4 select-none relative">
              <span className="text-[10px] text-zinc-500 font-bold font-mono uppercase shrink-0">MY EXPERIMENT STAGE:</span>
              <div className="flex-1 h-3.5 bg-[#14151f] rounded-full overflow-hidden border border-white/5 relative">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 rounded-full transition-all duration-500 shadow-md shadow-pink-500/10" 
                  style={{ width: `${arenaState.playerProgress}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white font-mono tracking-widest">
                  {arenaState.playerProgress}% COMPLETE
                </span>
              </div>

              {/* Avatar người chơi thu nhỏ với bong bóng chat */}
              <div className="relative shrink-0 w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 font-bold text-xs">
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
            <div className="bg-[#1e202b]/90 backdrop-blur-xl border border-white/5 rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">OPPONENT TRACKER HUD</span>
                  <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
                </div>

                {/* Opponent Info Header */}
                <div className="flex items-center gap-3 bg-[#14151f] p-3 rounded-2xl border border-white/5 mb-6 relative">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-xl font-bold relative shrink-0">
                    {arenaState.opponentInfo?.name ? arenaState.opponentInfo.name.charAt(0).toUpperCase() : 'O'}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-500 border border-[#14151f] text-[9px] font-bold text-white flex items-center justify-center">
                      {arenaState.opponentInfo?.level || 1}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm leading-tight">{arenaState.opponentInfo?.name || 'Đang chờ đối thủ...'}</h4>
                    <span className="text-[9px] text-rose-400 font-mono font-bold px-1.5 py-0.5 bg-rose-500/10 rounded mt-1 inline-block uppercase">
                      {arenaState.opponentInfo?.title || 'Tập sự'}
                    </span>
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
                  <div className="flex justify-between text-[10px] text-zinc-400 font-bold uppercase font-mono">
                    <span>STAGE COMPLETE</span>
                    <span className="text-rose-400 font-extrabold">{arenaState.opponentProgress}%</span>
                  </div>
                  <div className="w-full h-4 bg-[#14151f] rounded-full overflow-hidden border border-white/5 relative">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-500 to-orange-600 rounded-full transition-all duration-300 shadow-md" 
                      style={{ width: `${arenaState.opponentProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Log sự kiện kịch tính */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">COHERENT SIGNAL FEED</span>
                <div className="h-48 bg-[#14151f] p-3.5 rounded-2xl border border-white/5 overflow-y-auto text-[10px] font-semibold text-zinc-500 space-y-1.5 font-mono select-none">
                  {arenaState.logs.map((log, index) => (
                    <div key={index} className="flex gap-2 leading-relaxed items-start border-l border-rose-500/30 pl-2">
                      <span className="text-rose-500 shrink-0">»</span>
                      <span className={index === 0 ? 'text-zinc-200 font-bold' : ''}>{log}</span>
                    </div>
                  ))}
                  {arenaState.logs.length === 0 && (
                    <div className="text-zinc-700 text-center py-12">LISTENING TO SECTOR SIGNALS...</div>
                  )}
                </div>
              </div>
            </div>

            {/* Thanh công cụ Chat & Emoji tương tác */}
            <div className="bg-[#1e202b]/90 backdrop-blur-xl border border-white/5 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">TƯƠNG TÁC ĐẤU TRƯỜNG</span>
              
              {/* Thả Emoji nhanh */}
              <div className="flex justify-between items-center gap-2 bg-[#14151f] p-2 rounded-2xl border border-white/5">
                {['😂', '🔥', '😱', '👑', '🤝', '⚡'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendQuickChat(emoji, 'emoji')}
                    className="w-10 h-10 flex items-center justify-center text-lg hover:scale-125 hover:bg-white/5 active:scale-95 transition-all rounded-xl cursor-pointer"
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
                  className="flex-1 bg-[#14151f] border border-white/5 focus:border-pink-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
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
                    className="w-full text-left px-3.5 py-2.5 text-xs text-zinc-400 hover:text-white bg-[#14151f] border border-white/5 hover:border-pink-500/20 rounded-xl transition-all cursor-pointer block truncate"
                  >
                    💬 {msg}
                  </button>
                ))}
              </div>
            </div>

            {/* TRỢ LÝ AI TRỰC TUYẾN (AI COPILOT COCKPIT) */}
            <div className="bg-[#1e202b]/90 backdrop-blur-xl border border-pink-500/10 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 select-none">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4.5 h-4.5 text-pink-400 animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest font-mono">
                    BUỒNG TRỢ LÝ AI (COPILOT)
                  </span>
                </div>
                <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                  ONLINE
                </span>
              </div>

              {/* Bong bóng tin nhắn hiển thị lời thoại gợi ý của AI */}
              <div className="bg-[#14151f] p-4 rounded-2xl border border-white/5 relative">
                <p className="text-[11px] text-zinc-300 leading-relaxed text-left font-sans whitespace-pre-wrap">
                  {arenaAiText}
                </p>
                <div className="absolute top-3 -left-1.5 w-3 h-3 bg-[#14151f] border-l border-t border-white/5 transform rotate-[-45deg]" />
              </div>

              <div className="flex gap-2">
                {/* Nút yêu cầu gợi ý nhanh */}
                <button
                  onClick={handleGetArenaAiHint}
                  className="flex-1 py-2.5 bg-[#14151f] hover:bg-zinc-800 border border-white/10 hover:border-pink-500/30 text-pink-400 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer font-mono"
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
                  className="flex-1 bg-[#14151f] border border-white/5 focus:border-pink-500/30 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors"
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
          <div className="w-full max-w-md bg-[#1e202b]/95 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
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
                  <h2 className="text-2xl font-black text-white tracking-widest uppercase font-mono">MISSION ACCOMPLISHED!</h2>
                  <p className="text-amber-400 text-xs font-bold uppercase mt-1">Xuất sắc hoàn tất thí nghiệm trước đối thủ!</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400 animate-pulse">
                    <AlertTriangle className="w-10 h-10 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.2)]" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-widest uppercase font-mono">MISSION FAILED</h2>
                  <p className="text-rose-400 text-xs font-bold uppercase mt-1">Đối thủ hoặc giới hạn thời gian đã vượt qua bạn!</p>
                </>
              )}
            </div>

            {/* Thống kê thay đổi */}
            <div className={`grid ${arenaState.matchResult === 'victory' ? 'grid-cols-3' : 'grid-cols-2'} gap-4 bg-[#14151f] p-5 rounded-2xl border border-white/5 mb-8 font-mono`}>
              <div className="text-center">
                <span className="text-[10px] text-zinc-500 font-bold block uppercase mb-1">Xếp hạng (ELO)</span>
                <span className={`text-2xl font-black ${arenaState.matchResult === 'victory' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {arenaState.matchResult === 'victory' ? '+25' : '-15'} ELO
                </span>
                <span className="text-[10px] text-zinc-400 block mt-1">Hiện tại: {personalization.elo} ELO</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-zinc-500 font-bold block uppercase mb-1">Kinh nghiệm (EXP)</span>
                <span className="text-2xl font-black text-cyan-400">
                  +{arenaState.matchResult === 'victory' ? '250' : '50'} EXP
                </span>
                <span className="text-[10px] text-zinc-400 block mt-1">Lv.{personalization.level} ({personalization.exp}/{personalization.nextLevelExp})</span>
              </div>
              {arenaState.matchResult === 'victory' && (
                <div className="text-center animate-in fade-in slide-in-from-bottom-3 duration-500">
                  <span className="text-[10px] text-zinc-550 dark:text-zinc-500 font-bold block uppercase mb-1">Pha lê (Crystal)</span>
                  <span className="text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
                    +50 <Gem className="w-5 h-5 text-amber-400 animate-bounce" />
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-1">Hiện tại: {personalization.crystals || 0}</span>
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
                className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2 font-mono"
              >
                <RotateCcw className="w-4 h-4" /> RE-ENTER ARENA
              </button>
            </div>
          </div>
        </div>
      )}

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
















