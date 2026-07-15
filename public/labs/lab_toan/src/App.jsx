import React, { useState, useRef, Suspense, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line, Sphere, Stars, Float, PerspectiveCamera, ContactShadows, Sky, Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Lightbulb,
  X,
  RotateCcw,
  ChevronRight,
  Info,
  Box,
  Maximize,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  LayoutDashboard,
  Dna,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Trophy,
  Flame,
  MessageSquare,
  Zap,
  Sliders,
  Share2,
  BookOpen,
  Database,
  Book,
  Bell,
  Command,
  Users,
  LogIn,
  LogOut,
  User,
} from 'lucide-react';

// Components
import GeometryViewer from './components/GeometryViewer';
import FunctionPlotter from './components/Math/FunctionPlotter';
import Graph2DViewer from './components/Math/Graph2DViewer';
import SpatialVector from './components/Math/SpatialVector';
import ImageUpload from './components/ImageUpload';
import GameHUD from './components/GameHUD';
import DailyChallenge from './components/DailyChallenge';
import SocraticChat from './components/SocraticChat';
import ParticleEffect from './components/ParticleEffect';
import ExplorerMode from './components/ExplorerMode';
import SharePanel from './components/SharePanel';
import ProfileDashboard from './components/ProfileDashboard';
import LandingPage from './components/LandingPage';
import TheoryPanel from './components/TheoryPanel';
import ExerciseBank from './components/ExerciseBank';
import ExercisePanel from './components/ExercisePanel';
import AuthModal from './components/AuthModal';
import CommandPalette from './components/CommandPalette';
import CommunityGallery from './components/CommunityGallery';
import NotificationSettings from './components/NotificationSettings';
import Navbar from './components/Navbar';
import { SidebarSkeleton, CanvasSkeleton } from './components/SkeletonLoader';
import { getRankInfo } from './components/GameHUD';
import { useAuth } from './contexts/AuthContext';
import { useUserSync } from './hooks/useUserSync';
import useSettingsStore from './store/useSettingsStore';
import useUserStore from './store/useUserStore';
import { apiClient } from './api/client';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';


// =====================
// Helpers: Persistence
// =====================
// Persistence helpers removed - now using useUserStore


// =====================
// Component: Scene Loader (3D Fallback) — cải thiện với animated orb
// =====================
function SceneLoader() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-4 bg-black/40 backdrop-blur-xl p-8 rounded-[32px] border border-white/10 shadow-2xl min-w-[220px]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-violet-500/20 border-t-violet-400/60" style={{ animation: 'spin 3s linear infinite reverse' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-cyan-400/50 animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-cyan-400 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">
            AI đang phân tích...
          </p>
          <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">
            Khởi tạo không gian 3D
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"
              style={{ animationDelay: `${i * 0.4}s` }} />
          ))}
        </div>
      </div>
    </Html>
  );
}


// =====================
// Helpers: LaTeX
// =====================
const preprocessLatex = (text) => {
  if (!text) return "";
  // Ensure we don't have double escaped backslashes coming from JSON
  let processed = text.replace(/\\\\/g, "\\");
  // Wrap simple $...$ with standard markdown math if needed or adjust for katex
  return processed;
};

// =====================
// =====================
// Offline Self-Healing Solvers Fallback Engine (Vietnamese)
// =====================
const generateLocalFallbackGeometry = (query) => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('lập phương') || lowerQuery.includes('cube') || lowerQuery.includes('hộp') || lowerQuery.includes('chữ nhật')) {
    const isCuboid = lowerQuery.includes('hộp chữ nhật');
    const zScale = isCuboid ? 0.7 : 1;
    const yScale = isCuboid ? 1.4 : 1;
    
    return {
      vertices: {
        A: [-1, -yScale/2, zScale], B: [1, -yScale/2, zScale], C: [1, -yScale/2, -zScale], D: [-1, -yScale/2, -zScale],
        "A'": [-1, yScale/2, zScale], "B'": [1, yScale/2, zScale], "C'": [1, yScale/2, -zScale], "D'": [-1, yScale/2, -zScale],
      },
      edges: [
        ["A", "B", "white", "solid"], ["B", "C", "white", "solid"], ["C", "D", "white", "dashed"], ["D", "A", "white", "dashed"],
        ["A'", "B'", "white", "solid"], ["B'", "C'", "white", "solid"], ["C'", "D'", "white", "solid"], ["D'", "A'", "white", "solid"],
        ["A", "A'", "white", "solid"], ["B", "B'", "white", "solid"], ["C", "C'", "white", "solid"], ["D", "D'", "white", "dashed"],
      ],
      steps: [
        {
          step_number: 1,
          title: "Dựng đáy ABCD",
          description: "Vẽ mặt đáy ABCD của khối đa diện (các cạnh nét khuất biểu diễn bằng nét đứt).",
          draw_elements: [
            { type: "line", from: "A", to: "B", color: "blue", style: "solid" },
            { type: "line", from: "B", to: "C", color: "blue", style: "solid" },
            { type: "line", from: "C", to: "D", color: "blue", style: "dashed" },
            { type: "line", from: "D", to: "A", color: "blue", style: "dashed" },
          ]
        },
        {
          step_number: 2,
          title: "Dựng mặt trên A'B'C'D'",
          description: "Tạo mặt đối xứng song song A'B'C'D' ở độ cao tương ứng của khối lăng trụ.",
          draw_elements: [
            { type: "line", from: "A'", to: "B'", color: "green", style: "solid" },
            { type: "line", from: "B'", to: "C'", color: "green", style: "solid" },
            { type: "line", from: "C'", to: "D'", color: "green", style: "solid" },
            { type: "line", from: "D'", to: "A'", color: "green", style: "solid" },
          ]
        },
        {
          step_number: 3,
          title: "Kết nối các đường sinh",
          description: "Nối các đỉnh tương ứng để hoàn thiện khối đa diện 3D hoàn chỉnh.",
          draw_elements: [
            { type: "line", from: "A", to: "A'", color: "red", style: "solid" },
            { type: "line", from: "B", to: "B'", color: "red", style: "solid" },
            { type: "line", from: "C", to: "C'", color: "red", style: "solid" },
            { type: "line", from: "D", to: "D'", color: "red", style: "dashed" },
          ]
        }
      ],
      difficulty: "medium",
      xp_reward: 35,
      hint: {
        title: "Gợi ý khối hộp đứng",
        content: "Hình hộp đứng có các mặt bên là hình chữ nhật vuông góc với đáy. Hãy chú ý tỉ lệ đường chéo không gian."
      },
      final_quiz: {
        question: "Độ dài đường chéo lớn nhất AC' của hình lập phương cạnh a bằng:",
        options: ["a√3", "a√2", "a√5", "2a"],
        correct_index: 0
      }
    };
  } else if (lowerQuery.includes('chóp') || lowerQuery.includes('pyramid') || lowerQuery.includes('s.')) {
    return {
      vertices: {
        S: [0, 1.4, 0],
        A: [-1, -0.8, 0.8], B: [1, -0.8, 0.8], C: [0.8, -0.8, -0.8], D: [-1.2, -0.8, -0.8]
      },
      edges: [
        ["A", "B", "white", "solid"], ["B", "C", "white", "solid"], ["C", "D", "white", "dashed"], ["D", "A", "white", "dashed"],
        ["S", "A", "white", "solid"], ["S", "B", "white", "solid"], ["S", "C", "white", "solid"], ["S", "D", "white", "dashed"]
      ],
      steps: [
        {
          step_number: 1,
          title: "Dựng đáy ABCD",
          description: "Vẽ mặt đáy hình bình hành hoặc hình vuông ABCD (các nét khuất vẽ đứt).",
          draw_elements: [
            { type: "line", from: "A", to: "B", color: "blue", style: "solid" },
            { type: "line", from: "B", to: "C", color: "blue", style: "solid" },
            { type: "line", from: "C", to: "D", color: "blue", style: "dashed" },
            { type: "line", from: "D", to: "A", color: "blue", style: "dashed" },
          ]
        },
        {
          step_number: 2,
          title: "Đặt đỉnh chóp S",
          description: "Xác định đỉnh S phía trên tương ứng với tâm đáy để chóp đều.",
          draw_elements: [
            { type: "point", name: "S", color: "red" }
          ]
        },
        {
          step_number: 3,
          title: "Vẽ các cạnh bên",
          description: "Nối S lần lượt với các đỉnh của đáy để hoàn thiện khối chóp.",
          draw_elements: [
            { type: "line", from: "S", to: "A", color: "green", style: "solid" },
            { type: "line", from: "S", to: "B", color: "green", style: "solid" },
            { type: "line", from: "S", to: "C", color: "green", style: "solid" },
            { type: "line", from: "S", to: "D", color: "green", style: "dashed" },
          ]
        }
      ],
      difficulty: "easy",
      xp_reward: 30,
      hint: {
        title: "Thể tích khối chóp",
        content: "Thể tích khối chóp tính bằng 1/3 lần tích của diện tích đáy và chiều cao: V = 1/3 * B * h."
      },
      final_quiz: {
        question: "Công thức tính thể tích khối chóp là?",
        options: ["V = 1/3 * B * h", "V = 1/2 * B * h", "V = B * h", "V = 1/3 * B * h²"],
        correct_index: 0
      }
    };
  } else if (lowerQuery.includes('lăng trụ') || lowerQuery.includes('prism')) {
    return {
      vertices: {
        A: [-0.8, -1, 0.8], B: [0.8, -1, 0.8], C: [0, -1, -0.8],
        "A'": [-0.8, 1, 0.8], "B'": [0.8, 1, 0.8], "C'": [0, 1, -0.8]
      },
      edges: [
        ["A", "B", "white", "solid"], ["B", "C", "white", "solid"], ["C", "A", "white", "dashed"],
        ["A'", "B'", "white", "solid"], ["B'", "C'", "white", "solid"], ["C'", "A'", "white", "solid"],
        ["A", "A'", "white", "solid"], ["B", "B'", "white", "solid"], ["C", "C'", "white", "dashed"]
      ],
      steps: [
        {
          step_number: 1,
          title: "Dựng đáy ABC",
          description: "Vẽ tam giác đáy ABC với cạnh AC nét đứt khuất tầm nhìn.",
          draw_elements: [
            { type: "line", from: "A", to: "B", color: "blue", style: "solid" },
            { type: "line", from: "B", to: "C", color: "blue", style: "solid" },
            { type: "line", from: "C", to: "A", color: "blue", style: "dashed" },
          ]
        },
        {
          step_number: 2,
          title: "Dựng mặt đối diện A'B'C'",
          description: "Vẽ tam giác A'B'C' song song và bằng đáy ABC phía trên.",
          draw_elements: [
            { type: "line", from: "A'", to: "B'", color: "green", style: "solid" },
            { type: "line", from: "B'", to: "C'", color: "green", style: "solid" },
            { type: "line", from: "C'", to: "A'", color: "green", style: "solid" },
          ]
        },
        {
          step_number: 3,
          title: "Kết nối các đỉnh lăng trụ",
          description: "Nối AA', BB', CC' để hoàn tất lăng trụ đứng tam giác hoàn chỉnh.",
          draw_elements: [
            { type: "line", from: "A", to: "A'", color: "red", style: "solid" },
            { type: "line", from: "B", to: "B'", color: "red", style: "solid" },
            { type: "line", from: "C", to: "C'", color: "red", style: "dashed" },
          ]
        }
      ],
      difficulty: "medium",
      xp_reward: 35,
      hint: {
        title: "Lăng trụ đứng",
        content: "Lăng trụ đứng có các cạnh bên vuông góc với hai mặt đáy. Các mặt bên là hình chữ nhật phẳng."
      },
      final_quiz: {
        question: "Số cạnh của hình lăng trụ đứng tam giác là?",
        options: ["9", "6", "8", "12"],
        correct_index: 0
      }
    };
  } else {
    return {
      vertices: {
        O: [0, 0, 0], A: [1, 1, 1], B: [-1, 1, -1]
      },
      edges: [
        ["O", "A", "cyan", "solid"], ["O", "B", "red", "solid"]
      ],
      vectors: [
        { start: [0,0,0], direction: [1,1,1], length: 1.73 },
        { start: [0,0,0], direction: [-1,1,-1], length: 1.73 }
      ],
      steps: [
        {
          step_number: 1,
          title: "Khởi tạo gốc tọa độ O",
          description: "Đặt gốc tọa độ O(0,0,0) trong không gian vector 3 chiều.",
          draw_elements: [
            { type: "point", name: "O", color: "white" }
          ]
        },
        {
          step_number: 2,
          title: "Dựng Vector A(1, 1, 1)",
          description: "Dựng vector OA hướng từ gốc O đến điểm không gian A.",
          draw_elements: [
            { type: "line", from: "O", to: "A", color: "blue", style: "solid" }
          ]
        }
      ],
      difficulty: "easy",
      xp_reward: 20,
      hint: {
        title: "Tọa độ không gian",
        content: "Vector trong không gian Oxyz được biểu diễn bởi một mũi tên có hướng từ điểm đầu đến điểm cuối."
      },
      final_quiz: {
        question: "Vector OA có tọa độ A(1, 1, 1). Độ dài vector OA bằng bao nhiêu?",
        options: ["√3", "1", "3", "√2"],
        correct_index: 0
      }
    };
  }
};

const generateLocalFallbackGraph = (query) => {
  let funcStr = "sin(x)";
  let resultLatex = "y = \\sin(x)";
  let steps = [
    "Xác định tập xác định: D = \\mathbb{R}",
    "Chu kỳ của hàm số lượng giác sin(x) là T = 2\\pi",
    "Đồ thị đối xứng qua gốc tọa độ O, hàm số là hàm số lẻ."
  ];

  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('cos')) {
    funcStr = "cos(x)";
    resultLatex = "y = \\cos(x)";
    steps = [
      "Tập xác định: D = \\mathbb{R}",
      "Chu kỳ của hàm số lượng giác cos(x) là T = 2\\pi",
      "Đồ thị đối xứng qua trục tung Oy, hàm số chẵn."
    ];
  } else if (lowerQuery.includes('x^2') || lowerQuery.includes('parabol') || lowerQuery.includes('x2')) {
    funcStr = "x^2";
    resultLatex = "y = x^2";
    steps = [
      "Hàm số đa thức bậc 2 đại diện cho Parabol quay bề lõm lên trên.",
      "Tọa độ đỉnh Parabol là gốc O(0, 0).",
      "Trục đối xứng của Parabol là trục tung Oy."
    ];
  } else if (lowerQuery.includes('x^3') || lowerQuery.includes('x3')) {
    funcStr = "x^3";
    resultLatex = "y = x^3";
    steps = [
      "Hàm số bậc 3, đạo hàm y' = 3x^2 >= 0 với mọi x.",
      "Hàm số đồng biến trên toàn bộ tập xác định R.",
      "Điểm uốn của đồ thị là O(0,0)."
    ];
  }

  return {
    result_latex: resultLatex,
    steps: steps,
    function_string: funcStr
  };
};


// Component: Main App
// =====================
export default function App({ isWorkspaceMode = false, initialProblem = null }) {
  const [isStarted, setIsStarted] = useState(() => {
    return localStorage.getItem('spatialmind_started') === 'true';
  });
  const [promptInput, setPromptInput] = useState(initialProblem ? initialProblem.content : '');
  const [geometryData, setGeometryData] = useState(null);
  const [hintData, setHintData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeMode, setActiveMode] = useState('GEOMETRY');
  const [graphExpression, setGraphExpression] = useState('sin(x)');
  const [algebraData, setAlgebraData] = useState(null);
  const [showAlgebraSolution, setShowAlgebraSolution] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Resize listener for Mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Settings from Store
  const {
    theme,
    setTheme,
    showAxes,
    setShowAxes,
    showGrid,
    antiAliasing,
    shadows
  } = useSettingsStore();
  const [uploadedImage, setUploadedImage] = useState(null);

  // Gamification from Store
  const { xp, streak, gainXP: storeGainXP, updateStreak, setXP } = useUserStore();
  const [showDailyChallenge, setShowDailyChallenge] = useState(false);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTheoryOpen, setIsTheoryOpen] = useState(false);
  const [isExerciseBankOpen, setIsExerciseBankOpen] = useState(false);
  const [isExercisePanelOpen, setIsExercisePanelOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [activeWorkspaceQuestion, setActiveWorkspaceQuestion] = useState(null);
  const [explorerPendingGenerate, setExplorerPendingGenerate] = useState(false);

  // ── New v3.0 State ──
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [solvedProblems, setSolvedProblems] = useState(() => {
    return parseInt(localStorage.getItem('spatialmind_solved') || '0', 10);
  });

  // ── Auth + Sync ──
  const { user, isAuthenticated, logout, isOfflineMode, userProfile } = useAuth();
  const { isSynced, lastSync } = useUserSync({
    xp, streak, solvedProblems,
    setSolvedProblems,
  });

  // Quiz state
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizResult, setQuizResult] = useState(null); // 'correct' | 'wrong' | null

  const controlsRef = useRef();
  const generateRef = useRef(null);
  const textareaRef = useRef(null);
  const [showMathKeyboard, setShowMathKeyboard] = useState(false);

  const insertMath = (latex, cursorOffset) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = promptInput;

    const before = currentText.substring(0, start);
    const after = currentText.substring(end);

    const newText = before + latex + after;
    setPromptInput(newText);

    // Đặt lại vị trí con trỏ (focus)
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + (cursorOffset !== undefined ? cursorOffset : latex.length);
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Sync profile with backend
  const syncProfile = useCallback(async (currentXP, currentStreak) => {
    try {
      const { current: r } = getRankInfo(currentXP);
      await apiClient.post('/api/user/profile', {
        name: "Học sinh",
        xp: currentXP,
        streak: currentStreak,
        level: r.level,
        rank: r.name,
        achievements: []
      });
    } catch (err) {
      console.warn("Backend offline, syncProfile failed");
    }
  }, []);

  // Sync on XP/Streak change
  useEffect(() => {
    if (isStarted) {
      syncProfile(xp, streak);
    }
  }, [xp, streak, isStarted, syncProfile]);

  // Load initial profile from backend
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await apiClient.get('/api/user/profile');
        if (data.xp > xp) {
          setXP(data.xp);
        }
      } catch (err) {
        console.warn("Backend offline, sử dụng local data");
      }
    };
    if (isStarted) loadProfile();
  }, [isStarted]);

  // Tự động kích hoạt khi người dùng đã đăng nhập từ hệ thống chính (Firebase)
  useEffect(() => {
    if (isAuthenticated) {
      setIsStarted(true);
      localStorage.setItem('spatialmind_started', 'true');
    }
  }, [isAuthenticated]);

  const handleStartApp = () => {
    setIsStarted(true);
    localStorage.setItem('spatialmind_started', 'true');
  };

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Streak update on mount
  useEffect(() => {
    if (isStarted) updateStreak();
  }, [isStarted, updateStreak]);

  // ── Keyboard Shortcuts (Ctrl+K, etc.) ──
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      // Ctrl+K / Cmd+K → Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  // ── Command Palette action handler ──
  const handleCommandAction = useCallback((action) => {
    switch (action.type) {
      case 'navigate':
        if (action.target === 'daily-challenge') setShowDailyChallenge(true);
        if (action.target === 'gallery') setIsGalleryOpen(true);
        if (action.target === 'share') setIsShareOpen(true);
        if (action.target === 'exercise-bank') setIsExerciseBankOpen(true);
        if (action.target === 'profile') setIsProfileOpen(true);
        break;
      case 'toggle':
        if (action.target === 'grid') setShowAxes(prev => !prev);
        break;
      case 'camera':
        if (action.action === 'reset' && controlsRef.current) {
          controlsRef.current.reset();
        }
        break;
      case 'ai-hint':
        setIsChatOpen(true);
        break;
      default:
        console.log('Command action:', action);
    }
  }, []);

  // Show daily challenge on first visit of the day
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('daily_progress') || '{}');
      const today = new Date().toISOString().slice(0, 10);
      if (stored.date !== today) {
        setTimeout(() => setShowDailyChallenge(true), 1500);
      }
    } catch { }
  }, []);

  // URL params: auto-load problem from ?problem=...
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const problemParam = params.get('problem');
      if (problemParam) {
        setPromptInput(decodeURIComponent(problemParam));
        // Auto trigger generation after short delay
        setTimeout(() => {
          // Clean the URL without reload
          window.history.replaceState({}, '', window.location.pathname);
        }, 200);
      }
    } catch { }
  }, []);

  // ExplorerMode: trigger generate after state settles
  useEffect(() => {
    if (explorerPendingGenerate && promptInput.trim()) {
      setExplorerPendingGenerate(false);
      handleGenerate();
    }
  }, [explorerPendingGenerate, promptInput]);

  // Workspace Auto-Generate & Remote Control
  useEffect(() => {
    if (isWorkspaceMode && initialProblem?.content) {
      setPromptInput(initialProblem.content);
      // Automatically trigger generation after a short delay to allow state to settle
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('spatialmind-generate'));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isWorkspaceMode, initialProblem?.content]);

  useEffect(() => {
    const handleResetView = () => {
      if (controlsRef.current) {
        controlsRef.current.reset();
      }
    };
    const handleForceGenerate = () => {
      if (isWorkspaceMode && promptInput.trim()) {
        handleGenerate();
      }
    };
    window.addEventListener('spatialmind-reset-view', handleResetView);
    window.addEventListener('spatialmind-generate', handleForceGenerate);
    return () => {
      window.removeEventListener('spatialmind-reset-view', handleResetView);
      window.removeEventListener('spatialmind-generate', handleForceGenerate);
    };
  }, [isWorkspaceMode, promptInput]);

  const gainXP = useCallback((amount) => {
    storeGainXP(amount);
    setParticleTrigger(t => t + 1);
  }, [storeGainXP]);

  const handleGenerate = async () => {
    if (!promptInput.trim()) {
      setError('Vui lòng nhập đề bài để bắt đầu.');
      return;
    }
    if (loading) return; // Prevent multiple simultaneous requests
    setLoading(true);
    setError('');
    setCompletedSteps(new Set());
    setSelectedAnswer(null);
    setQuizResult(null);

    try {
      const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

      if (activeMode === 'GEOMETRY' || activeMode === 'VECTOR') {
        let query = activeMode === 'VECTOR'
          ? `${promptInput} (Hãy xử lý bài toán này dưới góc độ vector không gian, vẽ các mũi tên vector)`
          : promptInput;

        query = query.split(/\n\s*[A-D]\./)[0].trim();

        const data = await apiClient.post('/api/geometry/calculate', {
          query,
          image: uploadedImage
        });

        setGeometryData(data);
        setHintData(data.hint ?? null);
        setActiveStep(0);

        if (data.type === '2D') {
          setActiveMode('GRAPH');
        } else {
          setActiveMode('GEOMETRY');
        }
        gainXP(data.xp_reward || 30);

      } else if (activeMode === 'GRAPH') {
        const data = await apiClient.post('/api/algebra/solve', {
          query: promptInput,
          image: uploadedImage
        });

        setAlgebraData(data);
        setShowAlgebraSolution(true);
        if (data.function_string) {
          setGraphExpression(data.function_string);
        }
        setHintData(null);
        gainXP(40);
      }

      if (controlsRef.current) {
        controlsRef.current.reset();
      }
    } catch (err) {
      console.warn("⚠️ Mất kết nối với AI Backend, tự động kích hoạt offline self-healing solver...");
      try {
        if (activeMode === 'GEOMETRY' || activeMode === 'VECTOR') {
          const fallbackData = generateLocalFallbackGeometry(promptInput);
          setGeometryData(fallbackData);
          setHintData(fallbackData.hint ?? null);
          setActiveStep(0);
          gainXP(25);
        } else if (activeMode === 'GRAPH') {
          const fallbackData = generateLocalFallbackGraph(promptInput);
          setAlgebraData(fallbackData);
          setShowAlgebraSolution(true);
          if (fallbackData.function_string) {
            setGraphExpression(fallbackData.function_string);
          }
          setHintData(null);
          gainXP(25);
        }
        if (controlsRef.current) {
          controlsRef.current.reset();
        }
      } catch (fallbackErr) {
        console.error("Local fallback failed:", fallbackErr);
        setError('Không kết nối được server và chế độ giải toán ngoại tuyến gặp lỗi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStepClick = (idx) => {
    setActiveStep(idx + 1);
    if (!completedSteps.has(idx)) {
      const newSet = new Set(completedSteps);
      newSet.add(idx);
      setCompletedSteps(newSet);
      gainXP(20);
      // Confetti on completing last step
      if (geometryData?.steps && idx === geometryData.steps.length - 1) {
        setParticleTrigger(t => t + 1);
      }
    }
  };

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleAnswerSelect = (idx) => {
    if (quizResult === 'correct') return; // Prevent clicking after correct

    setSelectedAnswer(idx);
    const isCorrect = idx === geometryData.final_quiz.correct_index;

    if (isCorrect) {
      setQuizResult('correct');
      gainXP(50 + streak * 5); // Base 50 + streak bonus
      setParticleTrigger(t => t + 2); // Big confetti
    } else {
      setQuizResult('wrong');
      setXP(Math.max(0, xp - 10)); // Fix I5: setXP nhận số trực tiếp, không phải callback
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#020617] text-slate-100 font-sans overflow-hidden select-none ocean-gradient">

      {/* 🏁 Landing Page Overlay */}
      <AnimatePresence>
        {!isStarted && !isWorkspaceMode && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="fixed inset-0 z-[1000]"
          >
            <LandingPage onStart={handleStartApp} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── v3.0 Navbar ── */}
      {!isWorkspaceMode && !activeWorkspaceQuestion && (
        <Navbar
          xp={xp}
          streak={streak}
          theme={theme}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          onOpenExerciseBank={() => setIsExerciseBankOpen(true)}
          onOpenDailyChallenge={() => setShowDailyChallenge(true)}
          onOpenGallery={() => setIsGalleryOpen(true)}
          onNavigate={(target) => {
            if (target === 'login') setIsAuthModalOpen(true);
          }}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />
      )}

      {/* 🌟 Particle Celebration */}
      <ParticleEffect trigger={particleTrigger} />

      {/* ── Mode switcher sub-bar (dưới Navbar) ── */}
      {!isWorkspaceMode && (
        <div className="fixed top-14 left-0 right-0 z-[90] flex items-center justify-between px-3 md:px-6 py-1.5 border-b border-white/5 overflow-x-auto no-scrollbar"
          style={{ background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(12px)' }}
        >
          {/* Mode tabs */}
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/5 shrink-0">
            {[
              { id: 'GEOMETRY', icon: Box, label: 'Hình học 3D' },
              { id: 'VECTOR', icon: Dna, label: 'Vector' },
              { id: 'GRAPH', icon: Layers, label: 'Đồ thị' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className="relative px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 group"
              >
                {activeMode === mode.id && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-cyan-500/20 border border-cyan-400/30 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <mode.icon size={13} className={activeMode === mode.id ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${activeMode === mode.id ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {mode.label}
                </span>
              </button>
            ))}
          </div>

          {/* Quick action tools */}
          <div className="flex items-center gap-1 shrink-0 ml-4">
            <button
              onClick={() => setIsExplorerOpen(e => !e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${isExplorerOpen ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-400/20' : 'text-slate-500 hover:text-cyan-400 hover:bg-white/5'
                }`}
            >
              <Sliders size={12} /> Explorer
            </button>
            <button
              onClick={() => setIsShareOpen(s => !s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${isShareOpen ? 'bg-violet-500/15 text-violet-400 border border-violet-400/20' : 'text-slate-500 hover:text-violet-400 hover:bg-white/5'
                }`}
            >
              <Share2 size={12} /> Share
            </button>
            <button
              onClick={() => setShowAxes(!showAxes)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${showAxes ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
            >
              <LayoutDashboard size={12} /> Axes
            </button>
          </div>
        </div>
      )}

      {/* 🔮 Floating Sidebar / Mobile Bottom Sheet */}
      {!isWorkspaceMode && (
        <motion.div
          initial={false}
          animate={isMobile ? {
            width: '100%',
            height: isSidebarCollapsed ? 90 : '75vh',
            x: 0,
            y: 0,
            bottom: 0,
            left: 0,
            borderRadius: isSidebarCollapsed ? '28px 28px 0 0' : '40px 40px 0 0'
          } : {
            width: isSidebarCollapsed ? 80 : 380,
            height: 'calc(100vh - 100px)',
            x: 0,
            y: 0,
            top: '88px',
            left: '24px',
            borderRadius: '32px'
          }}
          className={`fixed z-[100] overflow-hidden flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.6)] transition-all duration-700 ease-[0.23,1,0.32,1] ${
            theme === 'dark' 
              ? 'bg-[#020617]/80 backdrop-blur-[40px] border-t border-white/10 md:border border-white/5' 
              : 'bg-white/90 backdrop-blur-[40px] border-t border-black/5 md:border border-black/5'
          }`}
        >
          {/* ✨ Premium Drag Handle for Mobile */}
          {isMobile && (
            <div 
              className="w-full flex flex-col items-center py-4 cursor-grab active:cursor-grabbing"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden relative">
                <motion.div 
                  className="absolute inset-0 bg-cyan-400/50"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-cyan-500/40 mt-2">
                {isSidebarCollapsed ? 'Kéo lên để xem' : 'Vuốt xuống để thu gọn'}
              </span>
            </div>
          )}

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`absolute ${isMobile ? 'top-6 right-8' : 'top-8 right-8'} p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-500 hover:text-cyan-400 transition-all z-[110] border border-white/5 hover:border-cyan-500/30 shadow-lg`}
          >
            {isSidebarCollapsed ? (isMobile ? <PanelLeftOpen className="rotate-90" size={18} /> : <PanelLeftOpen size={18} />) : (isMobile ? <PanelLeftClose className="rotate-90" size={18} /> : <PanelLeftClose size={18} />)}
          </button>

          <div className="p-8 flex flex-col h-full overflow-hidden">
            <div className={`mb-10 flex items-center gap-4 transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 scale-90 invisible' : 'opacity-100 scale-100 visible'}`}>
              <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Box size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter text-[var(--text-main)] uppercase leading-none">
                  SpatialMind
                </h1>
                <p className="text-[10px] text-cyan-500/80 font-bold uppercase tracking-widest mt-1">
                  v2.2 {theme === 'dark' ? 'HUD' : 'Light'} Edition
                </p>
              </div>
            </div>

            <div className={`flex-1 overflow-y-auto pr-2 custom-scrollbar transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 translate-x-10 invisible' : 'opacity-100 translate-x-0 visible'}`}>
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <LayoutDashboard size={10} className="text-cyan-500" /> Nhập nhiệm vụ
                    </label>
                    <button
                      onClick={() => setShowMathKeyboard(!showMathKeyboard)}
                      className={`text-[9px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider transition-all border ${showMathKeyboard ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-white/5 text-slate-500 border-white/5 hover:text-slate-300'}`}
                    >
                      {showMathKeyboard ? 'Đóng phím' : 'Bàn phím Toán'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showMathKeyboard && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 overflow-hidden pb-2"
                      >
                        {[
                          { label: 'Công thức', latex: '$  $', offset: 2, display: '$$' },
                          { label: 'Phân số', latex: '\\frac{}{} ', offset: 6, display: 'a/b' },
                          { label: 'Căn bậc 2', latex: '\\sqrt{} ', offset: 6, display: '√' },
                          { label: 'Số mũ', latex: '^{} ', offset: 2, display: 'x²' },
                          { label: 'Chỉ số dưới', latex: '_{} ', offset: 2, display: 'x₂' },
                          { label: 'Góc', latex: '\\widehat{} ', offset: 9, display: '∠' },
                          { label: 'Độ', latex: '^\\circ ', display: '°' },
                          { label: 'Vector', latex: '\\vec{} ', offset: 5, display: 'v⃗' },
                          { label: 'Vuông góc', latex: '\\perp ', display: '⊥' },
                          { label: 'Song song', latex: '\\parallel ', display: '∥' },
                          { label: 'Tam giác', latex: '\\triangle ', display: '△' },
                          { label: 'Pi', latex: '\\pi ', display: 'π' }
                        ].map((btn, i) => (
                          <button
                            key={i}
                            onClick={() => insertMath(btn.latex, btn.offset)}
                            title={btn.label}
                            className="flex items-center justify-center py-2 bg-black/20 hover:bg-cyan-500/20 border border-white/5 hover:border-cyan-500/30 rounded-xl text-cyan-100 text-xs transition-all font-mono"
                          >
                            {btn.display}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <textarea
                    ref={textareaRef}
                    rows={5}
                    className="w-full px-5 py-4 bg-black/10 text-[var(--text-main)] text-sm rounded-2xl border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-[var(--text-dim)] resize-none shadow-inner leading-relaxed"
                    placeholder="Nhập đề bài hình học hoặc đồ thị tại đây..."
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleGenerate(); }}
                  />
                  <ImageUpload image={uploadedImage} setImage={setUploadedImage} />
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/20"
                    >
                      <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-red-300 leading-relaxed">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerate}
                    disabled={loading}
                    className={`py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-xl flex items-center justify-center gap-3 relative overflow-hidden
                    ${loading
                        ? 'bg-cyan-600/40 cursor-not-allowed opacity-50'
                        : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/40 border border-cyan-400/40'}`}
                  >
                    {loading ? <RotateCcw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                    {loading ? 'Đang phân tích...' : 'Khởi tạo không gian'}
                    {!loading && <span className="text-[9px] opacity-60 font-normal normal-case tracking-normal ml-1">(Ctrl+Enter)</span>}
                  </motion.button>

                  {/* Socratic Chat button */}
                  <motion.button
                    whileHover={hintData ? { scale: 1.02, backgroundColor: 'rgba(34, 211, 238, 0.15)' } : {}}
                    whileTap={hintData ? { scale: 0.98 } : {}}
                    onClick={() => setIsChatOpen(true)}
                    disabled={!hintData && !geometryData}
                    className={`py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3
                    ${hintData || geometryData
                        ? 'bg-cyan-500/5 border border-cyan-500/20 text-cyan-400'
                        : 'bg-slate-800/10 border border-white/5 text-slate-700 cursor-not-allowed'}`}
                  >
                    <MessageSquare size={16} />
                    Socratic AI Chat
                  </motion.button>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsExerciseBankOpen(true)}
                      className="flex items-center justify-center gap-2 px-4 py-4 bg-white/5 hover:bg-violet-500/10 border border-white/5 rounded-2xl text-slate-400 hover:text-violet-400 transition-all group"
                    >
                      <Database size={16} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Học liệu</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedLesson(null);
                        setIsTheoryOpen(true);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-4 bg-white/5 hover:bg-emerald-500/10 border border-white/5 rounded-2xl text-slate-400 hover:text-emerald-400 transition-all group"
                    >
                      <BookOpen size={16} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Lý thuyết</span>
                    </motion.button>
                  </div>
                </div>

                {/* Steps Area */}
                <AnimatePresence>
                  {/* Skeleton khi đang load */}
                  {loading && (
                    <motion.div
                      key="skeleton"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <SidebarSkeleton />
                    </motion.div>
                  )}
                  {activeMode === 'GEOMETRY' && geometryData && !loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4 border-t border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tiến trình giải</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-cyan-500 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full">
                            {activeStep}/{geometryData.steps?.length}
                          </span>
                          {geometryData.difficulty && (
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${geometryData.difficulty === 'easy' ? 'text-emerald-400 bg-emerald-500/10' :
                              geometryData.difficulty === 'medium' ? 'text-yellow-400 bg-yellow-500/10' :
                                'text-red-400 bg-red-500/10'
                              }`}>
                              {geometryData.difficulty === 'easy' ? 'Dễ' : geometryData.difficulty === 'medium' ? 'Vừa' : 'Khó'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        {geometryData.steps?.map((step, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => handleStepClick(idx)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${activeStep >= idx + 1
                              ? 'bg-cyan-500/10 border-cyan-500/30'
                              : 'bg-[var(--glass-bg)] border-transparent opacity-40 grayscale hover:opacity-100'
                              }`}
                          >
                            {completedSteps.has(idx) && (
                              <div className="absolute top-3 right-3">
                                <CheckCircle2 size={14} className="text-emerald-400" />
                              </div>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-[11px] font-black text-cyan-500 uppercase tracking-tighter">Bước {idx + 1}</p>
                              <span className="text-[9px] text-yellow-400/70 font-bold">+20 XP</span>
                            </div>
                            <div className="text-[12px] text-[var(--text-main)] leading-relaxed opacity-90">
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {preprocessLatex(step.explanation)}
                              </ReactMarkdown>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Final Quiz & Completion banner */}
                      {geometryData.steps && completedSteps.size === geometryData.steps.length && geometryData.steps.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-2xl border flex flex-col gap-3"
                          style={{
                            background: quizResult === 'correct' ? 'rgba(16, 185, 129, 0.1)' : quizResult === 'wrong' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 211, 238, 0.05)',
                            borderColor: quizResult === 'correct' ? 'rgba(16, 185, 129, 0.3)' : quizResult === 'wrong' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 211, 238, 0.2)'
                          }}
                        >
                          {geometryData.final_quiz ? (
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-2">
                                {quizResult === 'correct' ? <Trophy size={16} className="text-emerald-400" /> : <Info size={16} className="text-cyan-400" />}
                                <p className={`font-black text-xs uppercase tracking-widest ${quizResult === 'correct' ? 'text-emerald-400' : 'text-cyan-400'}`}>
                                  {quizResult === 'correct' ? 'Chính xác! 🎉' : 'Chốt đáp án cuối cùng'}
                                </p>
                              </div>
                              <div className="text-[12px] text-slate-200">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                  {preprocessLatex(geometryData.final_quiz.question)}
                                </ReactMarkdown>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {geometryData.final_quiz.options.map((opt, oIdx) => (
                                  <button
                                    key={oIdx}
                                    onClick={() => handleAnswerSelect(oIdx)}
                                    disabled={quizResult === 'correct'}
                                    className={`p-2 rounded-xl text-left text-[11px] font-medium transition-all ${selectedAnswer === oIdx
                                      ? quizResult === 'correct'
                                        ? 'bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.5)] border border-emerald-500 text-emerald-200'
                                        : quizResult === 'wrong'
                                          ? 'bg-red-500/20 border border-red-500 text-red-200 animate-[shake_0.5s_ease-in-out]'
                                          : 'bg-cyan-500/20 border border-cyan-400 text-cyan-200'
                                      : 'bg-black/20 hover:bg-white/10 border border-white/10 text-slate-300'
                                      }`}
                                  >
                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                      {preprocessLatex(opt)}
                                    </ReactMarkdown>
                                  </button>
                                ))}
                              </div>
                              {quizResult === 'correct' && (
                                <p className="text-emerald-300/60 text-[10px] mt-1">+{50 + streak * 5} XP (Gồm Streak Bonus)</p>
                              )}
                              {quizResult === 'wrong' && (
                                <p className="text-red-400/80 text-[10px] mt-1 text-center">Sai rồi! Bị trừ 10 XP. Hãy thử lại.</p>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Trophy size={18} className="text-emerald-400 shrink-0" />
                              <div>
                                <p className="text-emerald-400 font-black text-sm">Hoàn thành! 🎉</p>
                                <p className="text-emerald-300/60 text-[10px]">+{geometryData.xp_reward || 50} XP đã được cộng</p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Collapsed mini icons */}
            {!isWorkspaceMode && (
              <div className={`absolute left-0 top-32 w-full flex flex-col items-center gap-8 transition-all duration-300 ${isSidebarCollapsed ? 'opacity-100 visible translate-x-0' : 'opacity-0 invisible -translate-x-10'}`}>
                <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  {activeMode === 'GEOMETRY' ? <Box size={22} className="text-white" /> :
                    activeMode === 'VECTOR' ? <Dna size={22} className="text-white" /> :
                      <Layers size={22} className="text-white" />}
                </div>
                <div className="flex flex-col gap-6 items-center">
                  <button onClick={handleGenerate} className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-all"><Sparkles size={20} /></button>
                  <button onClick={() => setIsChatOpen(true)} className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-all"><MessageSquare size={20} /></button>
                  <button onClick={() => setShowDailyChallenge(true)} className="p-3 bg-orange-500/10 text-orange-400 rounded-xl hover:bg-orange-500/20 transition-all"><Flame size={20} /></button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
      {/* 🧊 Vertical Solution Panel (Graph mode) */}
      <AnimatePresence>
        {activeMode === 'GRAPH' && algebraData && showAlgebraSolution && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[33%] z-[101] flex flex-col shadow-2xl border-l border-white/5"
            style={{
              background: 'rgba(2,6,23,0.85)',
              backdropFilter: 'blur(30px)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Layers size={18} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-white font-black text-sm uppercase tracking-tight">Kết quả Giải tích</h2>
                  <p className="text-cyan-500/60 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                    <Sparkles size={8} /> Phân tích chuyên sâu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAlgebraSolution(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar space-y-8">
              {/* Main Result Card */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 size={10} className="text-emerald-400" /> Kết quả cuối cùng
                </label>
                <div className={`p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 overflow-x-auto custom-scrollbar`}>
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {`$$${algebraData.result_latex}$$`}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Vertical Steps */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <LayoutDashboard size={10} className="text-cyan-500" /> Các bước phân tích
                </label>

                {algebraData.steps?.map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-500/20 transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-5 h-5 rounded-md bg-cyan-500/10 flex items-center justify-center text-[10px] font-black text-cyan-400 border border-cyan-500/20">
                        {idx + 1}
                      </span>
                      <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Pha {idx + 1}</p>
                    </div>
                    <div className="text-[13px] text-slate-300 leading-relaxed markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {preprocessLatex(step)}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Hint/Footer */}
              <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 text-center">
                <p className="text-[9px] text-cyan-400/60 font-bold uppercase tracking-[0.2em]">
                  SpatialMind SymPy Engine
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button (Show when panel is hidden but data exists) */}
      <AnimatePresence>
        {activeMode === 'GRAPH' && algebraData && !showAlgebraSolution && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.5, x: 20 }}
            onClick={() => setShowAlgebraSolution(true)}
            className="fixed top-1/2 -translate-y-1/2 right-8 z-[60] w-14 h-14 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-2xl flex items-center justify-center border border-cyan-400/30 group transition-all"
          >
            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
              <Sparkles size={24} />
            </motion.div>
            <div className="absolute right-full mr-4 px-3 py-2 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Xem lời giải</p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 🧊 3D Canvas Box */}
      <div className="flex-1 relative overflow-hidden bg-[#020617]">
        <div className="absolute top-8 right-8 z-40 flex flex-col gap-2 mt-16">
          <button
            onClick={handleResetCamera}
            className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all hover:bg-white/10"
            title="Reset Camera"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {isWorkspaceMode && loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              <p className="text-cyan-400 font-bold tracking-widest uppercase text-sm animate-pulse">Đang phân tích AI...</p>
            </div>
          </div>
        )}

        {isWorkspaceMode && error && !loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-8">
            <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex flex-col items-center max-w-md text-center shadow-2xl">
              <AlertCircle size={48} className="text-red-500 mb-4" />
              <h3 className="text-red-400 font-bold mb-2">Lỗi AI</h3>
              <p className="text-red-300 text-sm mb-4 leading-relaxed">{error}</p>
              <button 
                onClick={() => setError('')}
                className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-colors font-bold text-xs uppercase tracking-widest"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Views based on activeMode */}
        {activeMode === 'GRAPH' ? (
          <div className="absolute inset-0 z-10 p-12 flex items-center justify-center">
            {geometryData?.type === '2D' ? (
              <Graph2DViewer functions={geometryData.functions} />
            ) : (
              <FunctionPlotter expression={graphExpression} />
            )}
          </div>
        ) : (
          <Canvas className="canvas-container" dpr={[1, 2]} shadows gl={{ antialias: true }}>
            <Suspense fallback={<SceneLoader />}>
              <PerspectiveCamera makeDefault fov={45} position={[8, 6, 12]} />
              <color attach="background" args={[theme === 'dark' ? '#020617' : '#e0f2fe']} />

              <ambientLight intensity={theme === 'dark' ? 0.8 : 1.0} />
              <spotLight position={[10, 20, 10]} intensity={2} angle={0.3} penumbra={1} castShadow />
              <pointLight position={[-10, 10, -10]} intensity={theme === 'dark' ? 2 : 1.5} color="#22d3ee" />
              <pointLight position={[5, -5, 5]} intensity={1} color="#0ea5e9" />

              {theme === 'dark' ? (
                <>
                  <Stars radius={150} depth={50} count={3000} factor={4} saturation={1} fade speed={1.5} />
                  <fog attach="fog" args={['#020617', 5, 25]} />
                </>
              ) : (
                <>
                  <Sky sunPosition={[100, 20, 100]} />
                  <fog attach="fog" args={['#e0f2fe', 10, 40]} />
                </>
              )}

              <group position={[0, -1, 0]}>
                {(activeMode === 'GEOMETRY' || activeMode === 'VECTOR') && geometryData && (
                  <GeometryViewer data={geometryData} currentStep={activeStep} theme={theme} showAxes={showAxes} />
                )}

                {activeMode === 'GEOMETRY' && !geometryData && (
                  <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                    <mesh rotation={[0.5, 0.5, 0]}>
                      <boxGeometry args={[3, 3, 3]} />
                      <meshStandardMaterial
                        color="#1e293b"
                        wireframe
                        transparent
                        opacity={0.1}
                        emissive="#1e3a8a"
                      />
                    </mesh>
                  </Float>
                )}

                <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.2} far={10} color="#000000" />
              </group>

              <OrbitControls
                ref={controlsRef}
                makeDefault
                enableDamping
                dampingFactor={0.06}
                minDistance={3}
                maxDistance={30}
                autoRotate={!geometryData && activeMode === 'GEOMETRY'}
                autoRotateSpeed={0.5}
              />
            </Suspense>
          </Canvas>
        )}

        {activeMode === 'GEOMETRY' && !geometryData && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="text-slate-500 text-xs font-black uppercase tracking-[0.4em] text-center opacity-40 px-10 py-5 border border-slate-800 rounded-full backdrop-blur-sm"
            >
              Waiting for Input · Enter Problem Description
            </motion.div>
          </div>
        )}
      </div>

      {/* 💬 Socratic Chat Panel */}
      <SocraticChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        problemStatement={promptInput}
        hint={hintData}
      />

      {/* 🔍 Explorer Mode Panel */}
      <ExplorerMode
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        onSendToAI={(problem) => {
          setPromptInput(problem);
          setActiveMode('GEOMETRY');
          // Use a short delay so state updates first, then trigger via flag
          setExplorerPendingGenerate(true);
        }}
      />

      {/* 🔗 Share Panel */}
      <SharePanel
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        problem={promptInput}
        geometryData={geometryData}
      />

      {/* 👤 Profile Dashboard */}
      <ProfileDashboard
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        xp={xp}
        streak={streak}
      />

      {/* 🏆 Daily Challenge Modal */}
      {
        showDailyChallenge && (
          <DailyChallenge
            onClose={() => setShowDailyChallenge(false)}
            onSelectChallenge={(problem) => {
              setPromptInput(problem);
              setActiveMode('GEOMETRY');
            }}
            onXPGain={(amount) => {
              gainXP(amount);
              const stored = JSON.parse(localStorage.getItem('daily_progress') || '{}');
              setStreak(stored.streak || 0);
            }}
          />
        )
      }

      {/* 📚 Theory & Exercise Bank */}
      <TheoryPanel
        isOpen={isTheoryOpen}
        onClose={() => setIsTheoryOpen(false)}
        lesson={selectedLesson}
      />

      <ExerciseBank
        isOpen={isExerciseBankOpen}
        onClose={() => setIsExerciseBankOpen(false)}
        onSelectLesson={(lesson) => {
          setSelectedLesson(lesson);
          setIsExerciseBankOpen(false);
          setIsTheoryOpen(true);
        }}
        onSelectExercise={(lesson) => {
          setSelectedLesson(lesson);
          setIsExerciseBankOpen(false);
          setIsExercisePanelOpen(true);
        }}
        onSendToAI={(problem) => {
          setPromptInput(problem);
          setIsExerciseBankOpen(false);
        }}
      />

      <ExercisePanel
        isOpen={isExercisePanelOpen}
        onClose={() => setIsExercisePanelOpen(false)}
        lesson={selectedLesson}
        onXPgain={(amount) => {
          const newXP = xp + amount;
          setXP(newXP);
        }}
        onSolveExercise={(question) => {
          setIsExercisePanelOpen(false);
          setActiveWorkspaceQuestion(question);
          setPromptInput(question.content); // Pre-fill the prompt input
          setActiveMode('GEOMETRY');
        }}
      />

      {/* ── v3.0: Auth Modal ── */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* ── v3.0: Command Palette (Ctrl+K) ── */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onAction={handleCommandAction}
        geometryData={geometryData}
        currentMode={activeMode}
      />

      {/* ── v3.0: Community Gallery ── */}
      <CommunityGallery
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onLoadModel={({ geometryData: gd, promptInput: pi }) => {
          if (gd) setGeometryData(gd);
          if (pi) setPromptInput(pi);
        }}
      />

      {/* ── v3.0: Notification Settings ── */}
      <NotificationSettings
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        user={{
          email: user?.email || '',
          displayName: user?.displayName || userProfile?.displayName || '',
        }}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
        
        .markdown-content p {
          margin-bottom: 1.25rem;
          line-height: 1.7;
        }
        .markdown-content .katex {
          font-size: 1.1em;
        }
        .markdown-content .katex-display {
          margin: 1.5rem 0;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 0.5rem 0;
        }

        .markdown-chat p {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }
        .markdown-chat p:last-child {
          margin-bottom: 0;
        }
        .markdown-chat .katex {
          font-size: 1em;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
      `}} />
    </div >
  );
}
