'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  Timer, 
  Flag, 
  AlertTriangle, 
  CheckCircle2, 
  CheckCircle,
  XCircle, 
  Sparkles, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft,
  ArrowLeft,
  ShieldAlert,
  BrainCircuit,
  MessageSquare,
  X,
  Send,
  Calendar,
  MapPin,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Search,
  Menu,
  Check,
  RotateCw,
  Award,
  Maximize2,
  Minimize2,
  Clock,
  LayoutGrid,
  GraduationCap,
  ListFilter,
  CheckSquare,
  Hash,
  Sun,
  Moon
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/store/useAppStore';
import { playSound } from '@/lib/sound';
import { getRankInfo } from '@/lib/matchmaker';
import { savePendingShare } from '@/lib/indexedDB';

import { EXAM_DATABASE } from '@/data/exams';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { formatMathText } from '@/lib/mathFormatter';

export default function RealCombatExamPage() {
  // Lấy thông tin cá nhân để cộng điểm sau thi
  const updateStats = useAppStore((state) => state.setPersonalization);
  const personalization = useAppStore((state) => state.personalization);
  const setIsExamPlaying = useAppStore((state) => state.setIsExamPlaying);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (resolvedTheme || theme) === 'dark';

  // States bộ lọc trang chủ
  const [selectedSubject, setSelectedSubject] = useState('physics');
  const [selectedCategory, setSelectedCategory] = useState('bo-gddt');
  const [selectedYear, setSelectedYear] = useState('Tất cả');
  const [selectedProvince, setSelectedProvince] = useState('Tất cả');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // States bài thi
  const [activeExam, setActiveExam] = useState(null); // Đề thi đang làm
  const [examStatus, setExamStatus] = useState('landing'); // 'landing' | 'playing' | 'result'
  const [loadingExam, setLoadingExam] = useState(false); // State tải đề thi từ Firestore
  const [firestoreExams, setFirestoreExams] = useState([]); // Danh sách đề thi từ Firestore
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [questionId]: answerData }
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);

  // States hỗ trợ làm bài & Modal tương tác cao cấp
  const [fontSize, setFontSize] = useState('normal'); // 'normal' | 'large' | 'xlarge'
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [imageZoomLevel, setImageZoomLevel] = useState(1);
  const [questionPaletteFilter, setQuestionPaletteFilter] = useState('all'); // 'all' | 'unanswered' | 'flagged'
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);
  const [resultReviewFilter, setResultReviewFilter] = useState('all'); // 'all' | 'part_1' | 'part_2' | 'part_3' | 'wrong' | 'correct' | 'skipped'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [partScores, setPartScores] = useState({ part1: 0, part2: 0, part3: 0 });

  // Tự động bật Zen Mode ẩn toàn bộ Sidebar và Header toàn cục của Portal khi đang thi
  useEffect(() => {
    setIsExamPlaying(examStatus === 'playing');
    return () => setIsExamPlaying(false);
  }, [examStatus, setIsExamPlaying]);

  // Điều khiển chế độ toàn màn hình
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Anti-cheat Tab switching counter
  const [cheatAttempts, setCheatAttempts] = useState(0);
  const [showCheatWarning, setShowCheatWarning] = useState(false);

  // AI review kết quả sau nộp
  const [finalScore, setFinalScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [aiReviewData, setAiReviewData] = useState(null);
  
  // AI Tutor chat mini
  const [showAiTutor, setShowAiTutor] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // Trạng thái thăng hạng và phần thưởng ELO
  const [showRankUpModal, setShowRankUpModal] = useState(false);
  const [rankUpDetails, setRankUpDetails] = useState({ oldRank: null, newRank: null, newElo: 0, rewardElo: 0, rewardExp: 0 });
  const [showPointsPopup, setShowPointsPopup] = useState(false);
  const [pointsPopupData, setPointsPopupData] = useState({ elo: 0, exp: 0 });

  // Hiệu ứng chạy chữ số vù vù như game
  const [animatedElo, setAnimatedElo] = useState(0);
  const [animatedExp, setAnimatedExp] = useState(0);

  const timerRef = useRef(null);

  // Tải danh sách đề thi từ Firestore để đồng bộ thực tế
  useEffect(() => {
    const loadExams = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'exams'));
        const list = [];
        querySnapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setFirestoreExams(list);
      } catch (err) {
        console.warn("⚠️ Không thể tải danh sách đề thi từ Firestore:", err);
      }
    };
    loadExams();
  }, []);

  const combinedExams = useMemo(() => {
    const rawList = firestoreExams.length > 0 ? firestoreExams : EXAM_DATABASE;
    return rawList.filter(e => e.questions && e.questions.length > 0).map(e => {
      if (!e.difficulty) {
        const category = e.category || 'bo-gddt';
        const title = (e.title || '').toLowerCase();
        if (
          category === 'cac-truong-chuyen' || 
          category === 'on-thi-hsg' || 
          title.includes('chuyên') || 
          title.includes('hsg') ||
          title.includes('học sinh giỏi')
        ) {
          e.difficulty = 'hard';
          e.difficultyLabel = 'Nâng cao';
        } else if (
          category === 'so-gddt' || 
          title.includes('sở gd') || 
          title.includes('sở giáo dục')
        ) {
          e.difficulty = 'medium';
          e.difficultyLabel = 'Khá';
        } else {
          e.difficulty = 'easy';
          e.difficultyLabel = 'Cơ bản';
        }
      }
      return e;
    });
  }, [firestoreExams]);

  // Reset các bộ lọc khi chuyển môn học hoặc phân loại
  useEffect(() => {
    setSelectedYear('Tất cả');
    setSelectedProvince('Tất cả');
    setSelectedDifficulty('all');
  }, [selectedSubject, selectedCategory]);

  // Trích xuất các năm học khả dụng
  const availableYears = useMemo(() => {
    const years = new Set();
    combinedExams.forEach(e => {
      if (e.subject === selectedSubject && e.category === selectedCategory && e.year) {
        years.add(e.year);
      }
    });
    return ['Tất cả', ...Array.from(years).sort((a, b) => b - a)];
  }, [selectedSubject, selectedCategory, combinedExams]);

  // Trích xuất các tỉnh/thành phố khả dụng
  const availableProvinces = useMemo(() => {
    const provinces = new Set();
    combinedExams.forEach(e => {
      if (e.subject === selectedSubject && e.category === selectedCategory) {
        if (selectedYear === 'Tất cả' || String(e.year) === String(selectedYear)) {
          if (e.province) {
            provinces.add(e.province);
          }
        }
      }
    });
    return ['Tất cả', ...Array.from(provinces).sort((a, b) => a.localeCompare(b, 'vi'))];
  }, [selectedSubject, selectedCategory, selectedYear, combinedExams]);

  // Thống kê số câu đã làm / chưa làm / gắn cờ trong thời gian thực
  const answeredStats = useMemo(() => {
    if (!activeExam || !activeExam.questions) {
      return { answered: 0, total: 0, percentage: 0, unansweredIndices: [], flaggedIndices: [] };
    }
    const total = activeExam.questions.length;
    let answered = 0;
    const unansweredIndices = [];
    const flaggedIndices = [];

    activeExam.questions.forEach((q, idx) => {
      const ans = userAnswers[q.id];
      let isAnswered = false;
      if (q.type === 'mcq') {
        isAnswered = ans !== undefined && ans !== null;
      } else if (q.type === 'short_answer') {
        isAnswered = ans !== undefined && ans !== null && String(ans).trim() !== '';
      } else if (q.type === 'true_false') {
        isAnswered = ans && typeof ans === 'object' && Object.keys(ans).length > 0;
      }
      if (isAnswered) answered++;
      else unansweredIndices.push(idx);

      if (flaggedQuestions.has(idx)) {
        flaggedIndices.push(idx);
      }
    });

    return {
      answered,
      total,
      percentage: Math.round((answered / (total || 1)) * 100),
      unansweredIndices,
      flaggedIndices
    };
  }, [activeExam, userAnswers, flaggedQuestions]);

  // Phân chia cấu trúc đề thi thành 3 phần chuẩn Bộ GD&ĐT (2025/2026)
  const examParts = useMemo(() => {
    if (!activeExam || !activeExam.questions) return [];
    
    const part1 = [];
    const part2 = [];
    const part3 = [];

    activeExam.questions.forEach((q, idx) => {
      const item = { ...q, globalIndex: idx };
      if (q.type === 'mcq') {
        part1.push(item);
      } else if (q.type === 'true_false') {
        part2.push(item);
      } else if (q.type === 'short_answer') {
        part3.push(item);
      } else {
        part1.push(item);
      }
    });

    const parts = [];
    if (part1.length > 0) {
      parts.push({
        id: 'part_1',
        title: 'PHẦN I',
        name: 'Trắc nghiệm nhiều lựa chọn',
        shortName: 'Trắc nghiệm đơn',
        desc: 'Mỗi câu hỏi thí sinh chọn một phương án đúng nhất (A, B, C hoặc D).',
        pointsPerQuestion: '0.25 điểm / câu',
        questions: part1,
        startIndex: part1[0].globalIndex,
        endIndex: part1[part1.length - 1].globalIndex,
        total: part1.length
      });
    }
    if (part2.length > 0) {
      parts.push({
        id: 'part_2',
        title: 'PHẦN II',
        name: 'Trắc nghiệm Đúng / Sai',
        shortName: 'Đúng / Sai',
        desc: 'Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn Đúng hoặc Sai.',
        pointsPerQuestion: 'Tối đa 1.00 điểm / câu',
        questions: part2,
        startIndex: part2[0].globalIndex,
        endIndex: part2[part2.length - 1].globalIndex,
        total: part2.length
      });
    }
    if (part3.length > 0) {
      parts.push({
        id: 'part_3',
        title: 'PHẦN III',
        name: 'Trắc nghiệm trả lời ngắn',
        shortName: 'Trả lời ngắn',
        desc: 'Thí sinh tính toán và điền đáp án số vào ô trả lời.',
        pointsPerQuestion: '0.25 điểm / câu',
        questions: part3,
        startIndex: part3[0].globalIndex,
        endIndex: part3[part3.length - 1].globalIndex,
        total: part3.length
      });
    }
    return parts;
  }, [activeExam]);

  // Thống kê tiến độ theo từng phần thi
  const partStats = useMemo(() => {
    return examParts.map((part) => {
      let answeredCount = 0;
      let partialCount = 0;
      part.questions.forEach((q) => {
        const ans = userAnswers[q.id];
        if (q.type === 'mcq') {
          if (ans !== undefined && ans !== null) answeredCount++;
        } else if (q.type === 'short_answer') {
          if (ans !== undefined && ans !== null && String(ans).trim() !== '') answeredCount++;
        } else if (q.type === 'true_false') {
          const keys = ans && typeof ans === 'object' ? Object.keys(ans).length : 0;
          if (keys === 4) answeredCount++;
          else if (keys > 0) partialCount++;
        }
      });
      return {
        ...part,
        answeredCount,
        partialCount,
        isCompleted: answeredCount === part.total,
        percentage: Math.round((answeredCount / (part.total || 1)) * 100)
      };
    });
  }, [examParts, userAnswers]);

  // Phần thi của câu hỏi hiện tại
  const currentPart = useMemo(() => {
    if (!examParts.length) return null;
    return examParts.find(p => currentQuestionIndex >= p.startIndex && currentQuestionIndex <= p.endIndex) || examParts[0];
  }, [examParts, currentQuestionIndex]);

  // Vị trí câu hỏi trong phần (ví dụ: Câu 1/18 trong Phần I, Câu 1/4 trong Phần II, Câu 1/6 trong Phần III)
  const questionNumberInPart = currentPart ? (currentQuestionIndex - currentPart.startIndex + 1) : (currentQuestionIndex + 1);

  // Câu hỏi hiện tại
  const currentQ = activeExam?.questions?.[currentQuestionIndex];

  // Kiểm tra nếu tất cả 4 options trắc nghiệm đều ngắn (< 45 ký tự) để xếp 2 cột cân đối
  const areAllOptionsShort = useMemo(() => {
    if (!currentQ || currentQ.type !== 'mcq' || !currentQ.options) return false;
    return currentQ.options.every(opt => {
      if (!opt) return true;
      const stripped = opt.replace(/<[^>]+>/g, '').trim();
      return stripped.length < 45 && !stripped.includes('\n');
    });
  }, [currentQ]);

  // Hiệu ứng số ELO / EXP nhảy
  useEffect(() => {
    if (showPointsPopup) {
      setAnimatedElo(0);
      setAnimatedExp(0);
      const steps = 25;
      const interval = 1000 / steps;
      let step = 0;
      
      const timer = setInterval(() => {
        step++;
        setAnimatedElo(Math.round((pointsPopupData.elo / steps) * step));
        setAnimatedExp(Math.round((pointsPopupData.exp / steps) * step));
        if (step >= steps) {
          clearInterval(timer);
          setAnimatedElo(pointsPopupData.elo);
          setAnimatedExp(pointsPopupData.exp);
        }
      }, interval);
      return () => clearInterval(timer);
    }
  }, [showPointsPopup, pointsPopupData]);

  useEffect(() => {
    if (showRankUpModal && rankUpDetails.newRank) {
      const oldEloVal = rankUpDetails.newElo - rankUpDetails.rewardElo;
      setAnimatedElo(oldEloVal);
      setAnimatedExp(0);
      const steps = 30;
      const interval = 1200 / steps;
      let step = 0;
      
      const timer = setInterval(() => {
        step++;
        const currentElo = Math.round(oldEloVal + (rankUpDetails.rewardElo / steps) * step);
        setAnimatedElo(currentElo);
        setAnimatedExp(Math.round((rankUpDetails.rewardExp / steps) * step));
        if (step >= steps) {
          clearInterval(timer);
          setAnimatedElo(rankUpDetails.newElo);
          setAnimatedExp(rankUpDetails.rewardExp);
        }
      }, interval);
      return () => clearInterval(timer);
    }
  }, [showRankUpModal, rankUpDetails]);

  // Bộ lọc danh sách đề thi
  const baseExams = combinedExams.filter(e => {
    const category = e.category || 'bo-gddt';
    if (e.subject !== selectedSubject || category !== selectedCategory) {
      return false;
    }
    if (selectedYear !== 'Tất cả' && String(e.year) !== String(selectedYear)) {
      return false;
    }
    if (selectedProvince !== 'Tất cả' && e.province !== selectedProvince) {
      return false;
    }
    if (selectedDifficulty !== 'all' && e.difficulty !== selectedDifficulty) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = (e.title || '').toLowerCase().includes(q);
      const matchProvince = (e.province || '').toLowerCase().includes(q);
      if (!matchTitle && !matchProvince) return false;
    }
    return true;
  });

  const randomExamDummy = {
    id: `random_exam_${selectedSubject}`,
    subject: selectedSubject,
    subjectLabel: selectedSubject === 'math' ? 'Toán Học' : selectedSubject === 'physics' ? 'Vật Lý' : selectedSubject === 'chemistry' ? 'Hóa Học' : 'Sinh Học',
    title: `🎲 Đề Luyện Tập Ngẫu Nhiên (Trộn Đề Thông Minh Chuẩn THPT)`,
    type: 'thpt_random',
    typeLabel: 'Vô Hạn Đề Thi',
    timeLimit: selectedSubject === 'math' ? 5400 : 3000,
    questions: []
  };

  const filteredExams = [...baseExams, randomExamDummy];

  // Chống gian lận (Tab Switching)
  useEffect(() => {
    if (examStatus !== 'playing') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        playSound.error();
        const nextAttempts = cheatAttempts + 1;
        setCheatAttempts(nextAttempts);

        if (nextAttempts >= 3) {
          setShowCheatWarning(false);
          handleForceSubmit();
        } else {
          setShowCheatWarning(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [examStatus, cheatAttempts]);

  // Bộ đếm thời gian
  useEffect(() => {
    if (examStatus !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleForceSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examStatus]);

  // Phím tắt bàn phím tiện lợi khi làm bài thi (1-4 hoặc A-D chọn đáp án, Mũi tên trái/phải chuyển câu, F gắn cờ)
  useEffect(() => {
    if (examStatus !== 'playing' || !activeExam) return;

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      if (showSubmitModal || showExitModal || zoomedImage || showCheatWarning) return;

      const currentQ = activeExam.questions[currentQuestionIndex];
      if (!currentQ) return;

      if (e.key === 'ArrowLeft' || e.key === '[') {
        e.preventDefault();
        playSound.click();
        setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight' || e.key === ']') {
        e.preventDefault();
        playSound.click();
        setCurrentQuestionIndex(prev => Math.min(activeExam.questions.length - 1, prev + 1));
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFlag(currentQuestionIndex);
      } else if (currentQ.type === 'mcq') {
        if (['1', 'a', 'A'].includes(e.key) && currentQ.options.length > 0) {
          e.preventDefault();
          handleSelectMcq(currentQ.id, 0);
        } else if (['2', 'b', 'B'].includes(e.key) && currentQ.options.length > 1) {
          e.preventDefault();
          handleSelectMcq(currentQ.id, 1);
        } else if (['3', 'c', 'C'].includes(e.key) && currentQ.options.length > 2) {
          e.preventDefault();
          handleSelectMcq(currentQ.id, 2);
        } else if (['4', 'd', 'D'].includes(e.key) && currentQ.options.length > 3) {
          e.preventDefault();
          handleSelectMcq(currentQ.id, 3);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [examStatus, activeExam, currentQuestionIndex, showSubmitModal, showExitModal, zoomedImage, showCheatWarning]);

  // Bắt sự kiện click vào bất kỳ hình vẽ hay sơ đồ nào trong câu hỏi để mở Lightbox phóng to
  const handleQuestionBodyClick = (e) => {
    const target = e.target;
    if (target && target.tagName === 'IMG') {
      e.preventDefault();
      e.stopPropagation();
      playSound.click();
      setZoomedImage(target.src);
      setImageZoomLevel(1);
    }
  };

  // Khởi động kỳ thi
  const startExam = async (exam) => {
    playSound.success();
    setLoadingExam(true);

    if ((!exam.questions || exam.questions.length === 0) && exam.type !== 'thpt_random') {
      setLoadingExam(false);
      if (exam.sourceUrl) {
        window.open(exam.sourceUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert('⚠️ Đề thi này chưa có câu hỏi nội bộ và không có link nguồn.');
      }
      return;
    }
    
    let examQuestions = [];

    if (exam.type === 'thpt_random') {
      let firestoreMcqs = [];
      try {
        const qRef = collection(db, 'questions');
        const q = query(qRef, where('subject', '==', exam.subject), where('status', '==', 'public'));
        const querySnap = await getDocs(q);
        querySnap.forEach(docSnap => {
          const data = docSnap.data();
          firestoreMcqs.push({
            id: docSnap.id,
            type: 'mcq',
            text: data.text,
            options: data.choices || [],
            correctAnswer: data.correct !== undefined ? data.correct : 0,
            explanation: data.explanation || '',
            topic: 'Ngân Hàng Câu Hỏi Firestore'
          });
        });
      } catch (err) {
        console.warn("⚠️ Không thể tải ngân hàng câu hỏi từ Firestore:", err);
      }

      const allSubjectQuestions = EXAM_DATABASE
        .filter(e => e.subject === exam.subject)
        .flatMap(e => e.questions);

      const staticMcqs = allSubjectQuestions.filter(q => q.type === 'mcq');
      const trueFalses = allSubjectQuestions.filter(q => q.type === 'true_false');
      const shortAnswers = allSubjectQuestions.filter(q => q.type === 'short_answer');

      const getRandomSamples = (arr, num) => {
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, num);
      };

      const combinedMcqs = [...firestoreMcqs, ...staticMcqs];
      const selectedMcqs = getRandomSamples(combinedMcqs, 12);
      const selectedTrueFalses = getRandomSamples(trueFalses, 4);
      const selectedShortAnswers = getRandomSamples(shortAnswers, 6);

      const prepareQuestions = (questionsList) => {
        return questionsList.map((q, idx) => ({
          ...q,
          id: q.id && !q.id.includes('random') ? q.id : `${exam.subject}_random_${q.type}_${idx}_${Math.floor(Math.random() * 10000)}`
        }));
      };

      examQuestions = [
        ...prepareQuestions(selectedMcqs),
        ...prepareQuestions(selectedTrueFalses),
        ...prepareQuestions(selectedShortAnswers)
      ];
    } else {
      examQuestions = exam.questions;
    }

    const mcqs = examQuestions.filter(q => q.type === 'mcq');
    const trueFalses = examQuestions.filter(q => q.type === 'true_false');
    const shortAnswers = examQuestions.filter(q => q.type === 'short_answer');

    const shuffledMcqs = [...mcqs].sort(() => Math.random() - 0.5);
    const shuffledTrueFalses = [...trueFalses].sort(() => Math.random() - 0.5);
    const shuffledShortAnswers = [...shortAnswers].sort(() => Math.random() - 0.5);

    const orderedQuestions = [...shuffledMcqs, ...shuffledTrueFalses, ...shuffledShortAnswers];
    
    // Đảo thứ tự lựa chọn MCQ
    const randomizedQuestions = orderedQuestions.map(q => {
      if (q.type === 'mcq') {
        const optionsWithIndices = q.options.map((opt, idx) => ({ opt, idx }));
        const shuffledOpts = [...optionsWithIndices].sort(() => Math.random() - 0.5);
        const newCorrectAnswer = shuffledOpts.findIndex(item => item.idx === q.correctAnswer);
        return {
          ...q,
          options: shuffledOpts.map(item => item.opt),
          correctAnswer: newCorrectAnswer
        };
      }
      return q;
    });

    setActiveExam({
      ...exam,
      questions: randomizedQuestions
    });
    setTimeRemaining(exam.timeLimit || 3000);
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setCheatAttempts(0);
    setShowCheatWarning(false);
    setCurrentQuestionIndex(0);
    setExamStatus('playing');
    setLoadingExam(false);
  };

  // Click chọn đáp án MCQ
  const handleSelectMcq = (questionId, optionIndex) => {
    playSound.click();
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  // Nhập đáp số ngắn
  const handleShortAnswerChange = (questionId, value) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Click Đúng/Sai phức hợp
  const handleTrueFalseChange = (questionId, statementId, value) => {
    playSound.click();
    setUserAnswers((prev) => {
      const currentAnswer = prev[questionId] || {};
      return {
        ...prev,
        [questionId]: {
          ...currentAnswer,
          [statementId]: value
        }
      };
    });
  };

  // Gắn cờ xem lại
  const toggleFlag = (index) => {
    playSound.click();
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Tính điểm & nộp bài
  const submitExam = () => {
    playSound.success();
    if (timerRef.current) clearInterval(timerRef.current);

    const isQuestionCorrect = (qId) => {
      const q = activeExam.questions.find(item => item.id === qId);
      if (!q) return true;
      const answer = userAnswers[qId];
      if (answer === undefined) return false;
      
      if (q.type === 'mcq') {
        return answer === q.correctAnswer;
      } else if (q.type === 'short_answer') {
        const cleanAnswer = String(answer).replace(',', '.').trim();
        return parseFloat(cleanAnswer) === q.correctShortAnswer;
      } else if (q.type === 'true_false') {
        let isAllCorrect = true;
        const subAnswers = answer || {};
        q.statements.forEach((stmt) => {
          if (subAnswers[stmt.id] !== stmt.correctValue) {
            isAllCorrect = false;
          }
        });
        return isAllCorrect;
      }
      return true;
    };

    let calculatedCorrect = 0;
    const totalQuestions = activeExam.questions.length;

    let part1Score = 0;
    let part2Score = 0;
    let part3Score = 0;

    activeExam.questions.forEach((q) => {
      if (isQuestionCorrect(q.id)) {
        calculatedCorrect++;
      }

      const answer = userAnswers[q.id];
      if (q.type === 'mcq') {
        if (answer === q.correctAnswer) part1Score += 0.25;
      } else if (q.type === 'true_false') {
        if (answer && q.statements) {
          let countInQ = 0;
          q.statements.forEach((stmt) => {
            if (answer[stmt.id] === stmt.correctValue) countInQ++;
          });
          if (countInQ === 1) part2Score += 0.1;
          else if (countInQ === 2) part2Score += 0.25;
          else if (countInQ === 3) part2Score += 0.5;
          else if (countInQ === 4) part2Score += 1.0;
        }
      } else if (q.type === 'short_answer') {
        if (answer !== undefined && answer !== null) {
          const cleanAnswer = String(answer).replace(',', '.').trim();
          if (parseFloat(cleanAnswer) === q.correctShortAnswer) {
            part3Score += 0.25;
          }
        }
      }
    });

    const detailedPartScores = {
      part1: parseFloat(part1Score.toFixed(2)),
      part2: parseFloat(part2Score.toFixed(2)),
      part3: parseFloat(part3Score.toFixed(2))
    };
    setPartScores(detailedPartScores);

    const rawTotal = parseFloat((part1Score + part2Score + part3Score).toFixed(2));
    const score = Math.min(10, Math.max(0, rawTotal > 0 ? rawTotal : parseFloat(((calculatedCorrect / totalQuestions) * 10).toFixed(1))));
    setCorrectCount(calculatedCorrect);
    setFinalScore(score);

    const weakPoints = [];
    activeExam.questions.forEach((q) => {
      if (!isQuestionCorrect(q.id) && q.topic) {
        weakPoints.push(q.topic);
      }
    });
    const uniqueWeakPoints = Array.from(new Set(weakPoints)).slice(0, 4);

    let eloGained = 0;
    let expGained = 0;
    if (score >= 8.0) {
      eloGained = 30;
      expGained = 200;
    } else if (score >= 5.0) {
      eloGained = 15;
      expGained = 100;
    } else {
      eloGained = -10;
      expGained = 20;
    }

    const oldElo = personalization.elo || 0;
    const newElo = Math.max(0, oldElo + eloGained);
    const oldRank = getRankInfo(oldElo);
    const newRank = getRankInfo(newElo);
    const isRankUp = newElo > oldElo && newRank.title !== oldRank.title;

    updateStats({
      elo: newElo,
      exp: (personalization.exp || 0) + expGained,
      wins: score >= 5.0 ? (personalization.wins || 0) + 1 : (personalization.wins || 0),
      losses: score < 5.0 ? (personalization.losses || 0) + 1 : (personalization.losses || 0)
    });

    setAiReviewData({
      weakPoints: uniqueWeakPoints.length > 0 ? uniqueWeakPoints : ['Tuyệt vời! Bạn không bị hổng kiến thức nào trong kỳ thi này.'],
      generalAdvice: score >= 8.0 
        ? 'Bạn nắm rất chắc lý thuyết và vận dụng nhanh. Hãy giữ phong độ và tiếp tục thử sức ở các kỳ thi THPT Lượng Tử nâng cao!' 
        : 'Bạn bị sai một số điểm lý thuyết quan trọng. Nên ôn tập lại các công thức bổ trợ và thực hành thêm các phòng thí nghiệm mô phỏng để ghi nhớ sâu sắc.',
      rewards: { elo: eloGained, exp: expGained }
    });

    setExamStatus('result');

    if (isRankUp) {
      setRankUpDetails({
        oldRank,
        newRank,
        newElo,
        rewardElo: eloGained,
        rewardExp: expGained
      });
      setTimeout(() => {
        playRankUpFanfare();
        setShowRankUpModal(true);
      }, 600);
    } else if (eloGained > 0 || expGained > 0) {
      setPointsPopupData({ elo: eloGained, exp: expGained });
      setTimeout(() => {
        playSound.success();
        setShowPointsPopup(true);
      }, 600);
    }
  };

  const playRankUpFanfare = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      
      const playNote = (freq, start, duration, type = 'sine', volume = 0.05) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      
      playNote(261.63, now, 0.4, 'triangle', 0.08);
      playNote(329.63, now + 0.1, 0.4, 'triangle', 0.08);
      playNote(392.00, now + 0.2, 0.4, 'triangle', 0.08);
      playNote(523.25, now + 0.3, 0.6, 'sine', 0.06);
      playNote(659.25, now + 0.4, 0.6, 'sine', 0.06);
      playNote(783.99, now + 0.5, 0.6, 'sine', 0.06);
      playNote(1046.50, now + 0.6, 1.2, 'sine', 0.04);
      playNote(1318.51, now + 0.7, 1.5, 'sine', 0.03);
    } catch (err) {
      console.warn("Lỗi phát nhạc vinh danh:", err);
    }
  };

  const handleShareExamResult = async () => {
    playSound.success();
    const element = document.getElementById('exam-result-card');
    if (!element) return;
    
    try {
      setShowPointsPopup(false);
      const captureTarget = document.body;
      const scrollX = window.scrollX || 0;
      const scrollY = window.scrollY || 0;
      
      const canvas = await html2canvas(captureTarget, {
        useCORS: true,
        backgroundColor: isDark ? '#131524' : '#F8F6FC',
        scale: 1.0,
        width: window.innerWidth,
        height: window.innerHeight,
        x: scrollX,
        y: scrollY,
        onclone: (clonedDoc) => {
          clonedDoc.documentElement.className = document.documentElement.className;
          clonedDoc.body.className = document.body.className;
        }
      });
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      
      const pendingShare = {
        subject: activeExam?.subject || 'physics',
        subjectLabel: activeExam?.subjectLabel || (activeExam?.subject === 'physics' ? 'Vật Lý Lượng Tử' : 'Hóa Học Ảo'),
        caption: `Tôi vừa hoàn thành đề thi "${activeExam?.title}" với số điểm ${finalScore}/10! 🚀🧪 Nhận thêm +${aiReviewData?.rewards?.elo || 0} ELO!`,
        elo: personalization.elo,
        rewardElo: aiReviewData?.rewards?.elo || 0,
        rewardExp: aiReviewData?.rewards?.exp || 0,
        score: finalScore,
        totalQuestions: activeExam?.questions?.length || 0,
        imageUrl: base64Image
      };

      const isSaved = await savePendingShare(pendingShare);
      if (isSaved) {
        window.location.href = '/story';
      } else {
        alert('⚠️ Không thể chia sẻ kết quả thi do dung lượng bộ nhớ tạm bị giới hạn.');
      }
    } catch (err) {
      console.error("Lỗi chụp ảnh màn hình kết quả:", err);
    }
  };

  const handleShareRankUp = async () => {
    playSound.success();
    try {
      const captureTarget = document.body;
      const scrollX = window.scrollX || 0;
      const scrollY = window.scrollY || 0;
      
      const canvas = await html2canvas(captureTarget, {
        useCORS: true,
        backgroundColor: isDark ? '#131524' : '#F8F6FC',
        scale: 1.0,
        width: window.innerWidth,
        height: window.innerHeight,
        x: scrollX,
        y: scrollY,
        onclone: (clonedDoc) => {
          clonedDoc.documentElement.className = document.documentElement.className;
          clonedDoc.body.className = document.body.className;
        }
      });
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      
      const pendingShare = {
        subject: activeExam?.subject || 'physics',
        subjectLabel: activeExam?.subjectLabel || 'Đấu Trường Lượng Tử',
        caption: `🎉 KỲ TÍCH HỌC TẬP! Tôi đã chính thức thăng cấp lên danh hiệu "${rankUpDetails.newRank.title}" (${rankUpDetails.newRank.badge}) với danh vọng ${rankUpDetails.newElo} ELO! 👑🔥`,
        elo: rankUpDetails.newElo,
        rewardElo: rankUpDetails.rewardElo,
        rewardExp: rankUpDetails.rewardExp,
        score: finalScore,
        imageUrl: base64Image
      };

      const isSaved = await savePendingShare(pendingShare);
      if (isSaved) {
        window.location.href = '/story';
      } else {
        alert('⚠️ Không thể chia sẻ thăng hạng do dung lượng bộ nhớ tạm bị giới hạn.');
      }
    } catch (err) {
      console.error("Lỗi chụp ảnh màn hình thăng hạng:", err);
    }
  };

  const handleForceSubmit = () => {
    playSound.error();
    submitExam();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startAiTutor = (questionText, explanation) => {
    playSound.click();
    setAiChatMessages([
      { role: 'assistant', text: `Chào bạn! Tôi là AI Gia Sư của STEM Lab. Tôi thấy bạn đang thắc mắc về câu hỏi này:\n\n"${questionText.replace(/\\\(|\\\)/g, '')}"\n\nBạn chưa hiểu ở bước giải nào? Hãy hỏi để tôi giải thích chi tiết nhé!` }
    ]);
    setShowAiTutor(true);
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;
    playSound.click();

    const newMsgs = [...aiChatMessages, { role: 'user', text: chatInput }];
    setAiChatMessages(newMsgs);
    setChatInput('');

    setTimeout(() => {
      playSound.success();
      setAiChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Trong bài toán này, mấu chốt là phải chuẩn hóa đơn vị đo lường SI (mét, kilôgam, giây) trước khi áp dụng công thức. Bạn thử kiểm tra lại các bước biến đổi trung gian xem nhé!' }
      ]);
    }, 1000);
  };

  // Lọc câu hỏi hiển thị trong Navigator theo tab
  const filteredQuestionIndices = useMemo(() => {
    if (!activeExam || !activeExam.questions) return [];
    return activeExam.questions.map((q, idx) => idx).filter(idx => {
      if (questionPaletteFilter === 'all') return true;
      if (questionPaletteFilter === 'flagged') return flaggedQuestions.has(idx);
      if (questionPaletteFilter === 'unanswered') {
        const q = activeExam.questions[idx];
        const ans = userAnswers[q.id];
        if (q.type === 'mcq') return ans === undefined || ans === null;
        if (q.type === 'short_answer') return ans === undefined || ans === null || String(ans).trim() === '';
        if (q.type === 'true_false') return !ans || Object.keys(ans).length === 0;
      }
      return true;
    });
  }, [activeExam, questionPaletteFilter, flaggedQuestions, userAnswers]);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-rose-500/30 selection:text-white select-none relative overflow-x-hidden">
      
      {/* Hiệu ứng nền Ambient Neon mờ ảo */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-rose-500/5 rounded-full filter blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full filter blur-[140px] pointer-events-none" />

      {/* Loading overlay khi tải đề từ Firestore */}
      {loadingExam && (
        <div className="fixed inset-0 z-[99999] bg-bg-primary/95 backdrop-blur-md flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono font-bold text-text-secondary tracking-widest uppercase animate-pulse">
            Đang đồng bộ đề thi thực chiến từ máy chủ...
          </span>
        </div>
      )}

      {/* ================== SCREEN 1: LANDING HUB (CHỌN ĐỀ THI) ================== */}
      {examStatus === 'landing' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 md:p-8 max-w-7xl mx-auto pb-24 relative z-10"
        >
          {/* Header Bảng Đề */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Rocket className="w-5 h-5 text-accent-pink animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent-pink">Exam Center • 400+ Đề Thi</span>
            </div>
            <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Phòng Thi Thực Chiến</h1>
            <p className="text-xs text-text-secondary mt-1">Rèn luyện tốc độ phản xạ và kiến thức chuẩn cấu trúc THPT Quốc Gia với đồng hồ thời gian thực.</p>
          </div>

          {/* Chọn Môn Học (Tabbar chính) */}
          <div className="flex flex-wrap gap-2 mb-4 bg-bg-secondary/60 border border-border-theme p-1.5 rounded-2xl w-fit">
            {[
              { id: 'physics', label: '⚡ Vật Lý Lượng Tử' },
              { id: 'chemistry', label: '🧪 Hóa Học Ảo' },
              { id: 'math', label: '📐 Toán Siêu Cấp' },
              { id: 'biology', label: '🧬 Sinh Học Tế Bào' }
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => { playSound.click(); setSelectedSubject(sub.id); }}
                className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  selectedSubject === sub.id 
                    ? 'bg-accent-pink text-white shadow-lg shadow-accent-pink/20' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* Chọn Phân Loại & Cấp Độ Khó */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2 bg-bg-secondary/40 border border-border-theme p-1 rounded-xl">
              {[
                { id: 'bo-gddt', label: '🏫 Bộ GD&ĐT & Đề Ôn Tập' },
                { id: 'so-gddt', label: '🗺️ Sở GD&ĐT (Tỉnh/Thành)' },
                { id: 'truong-chuyen', label: '🎓 Trường Chuyên & THPT' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { playSound.click(); setSelectedCategory(cat.id); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all border cursor-pointer ${
                    selectedCategory === cat.id 
                      ? 'bg-accent-pink/15 border-accent-pink/30 text-accent-pink shadow-sm' 
                      : 'bg-transparent border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Ô tìm kiếm đề thi */}
            <div className="relative min-w-[260px] flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Tìm tên đề, tỉnh thành..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-secondary border border-border-theme text-xs text-text-primary rounded-xl pl-9 pr-3 py-2 outline-none focus:border-accent-pink/50 transition-all placeholder:text-text-secondary/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Bộ lọc nâng cao theo độ khó, năm học, tỉnh thành */}
          <div className="mb-8 p-4 bg-bg-secondary/60 border border-border-theme rounded-2xl flex flex-wrap gap-6 items-center">
            {/* Cấp độ khó */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-text-secondary uppercase">Độ khó:</span>
              <div className="flex gap-1">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'easy', label: 'Cơ bản' },
                  { id: 'medium', label: 'Khá' },
                  { id: 'hard', label: 'Nâng cao' }
                ].map((diff) => (
                  <button
                    key={diff.id}
                    onClick={() => { playSound.click(); setSelectedDifficulty(diff.id); }}
                    className={`px-2.5 py-1 rounded-lg text-[9.5px] font-bold transition-all border cursor-pointer ${
                      selectedDifficulty === diff.id 
                        ? 'bg-accent-pink/15 border-accent-pink/30 text-accent-pink font-extrabold' 
                        : 'bg-transparent border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                    }`}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Năm học */}
            {availableYears.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-accent-pink" /> Năm:
                </span>
                <div className="flex gap-1 bg-bg-tertiary p-0.5 rounded-lg border border-border-theme">
                  {availableYears.map(yr => (
                    <button
                      key={yr}
                      onClick={() => { playSound.click(); setSelectedYear(yr); }}
                      className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold transition-all cursor-pointer ${
                        String(selectedYear) === String(yr)
                          ? 'bg-accent-pink/20 text-accent-pink font-extrabold'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tỉnh thành */}
            {availableProvinces.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-accent-purple" /> Tỉnh:
                </span>
                <select
                  value={selectedProvince}
                  onChange={(e) => { playSound.click(); setSelectedProvince(e.target.value); }}
                  className="bg-bg-tertiary border border-border-theme rounded-xl px-3 py-1 text-[10px] font-bold text-text-primary outline-none cursor-pointer"
                >
                  {availableProvinces.map(prov => (
                    <option key={prov} value={prov} className="bg-bg-secondary text-text-primary">
                      {prov}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* LƯỚI DANH SÁCH ĐỀ THI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredExams.map((exam) => {
              const subjectTheme = {
                physics: {
                  gradient: 'from-blue-950/70 via-indigo-950/50 to-bg-secondary',
                  glow: 'group-hover:shadow-blue-500/10 hover:border-blue-500/40',
                  badge: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
                  icon: '⚡',
                  btn: 'from-blue-600 to-indigo-600'
                },
                chemistry: {
                  gradient: 'from-emerald-950/70 via-teal-950/50 to-bg-secondary',
                  glow: 'group-hover:shadow-emerald-500/10 hover:border-emerald-500/40',
                  badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
                  icon: '🧪',
                  btn: 'from-emerald-600 to-teal-600'
                },
                math: {
                  gradient: 'from-amber-950/70 via-orange-950/50 to-bg-secondary',
                  glow: 'group-hover:shadow-amber-500/10 hover:border-amber-500/40',
                  badge: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
                  icon: '📐',
                  btn: 'from-amber-600 to-orange-600'
                },
                biology: {
                  gradient: 'from-pink-950/70 via-purple-950/50 to-bg-secondary',
                  glow: 'group-hover:shadow-pink-500/10 hover:border-pink-500/40',
                  badge: 'bg-pink-500/15 border-pink-500/30 text-pink-400',
                  icon: '🧬',
                  btn: 'from-pink-600 to-purple-600'
                }
              };
              const theme = subjectTheme[exam.subject] || subjectTheme.physics;
              const isRandom = exam.type === 'thpt_random';
              const hasInternal = isRandom || (exam.questions?.length > 0);
              const questionCount = isRandom ? '22+ (Chuẩn THPT)' : `${exam.questions?.length || 0} câu`;
              const timeMins = Math.round((exam.timeLimit || 3000) / 60);

              const diffColors = {
                hard: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
                medium: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
                easy: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              };

              return (
                <div
                  key={exam.id}
                  className={`group relative bg-bg-secondary border border-border-theme rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-xl ${theme.glow} transition-all duration-300 hover:-translate-y-1 ${
                    isRandom ? 'border-accent-pink/40 shadow-accent-pink/5' : ''
                  }`}
                >
                  <div className={`relative h-32 bg-gradient-to-br ${theme.gradient} flex flex-col items-center justify-center overflow-hidden shrink-0`}>
                    <span className="text-4xl drop-shadow-lg select-none z-10 group-hover:scale-110 transition-transform duration-300">
                      {isRandom ? '🎲' : theme.icon}
                    </span>
                    <span className="mt-2 px-2.5 py-0.5 bg-black/30 backdrop-blur-sm rounded-full text-[8.5px] font-black text-white/90 uppercase tracking-wider z-10">
                      {exam.typeLabel || 'Đề thi THPT'}
                    </span>
                    {!isRandom && exam.difficulty && (
                      <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${diffColors[exam.difficulty] || diffColors.easy}`}>
                        {exam.difficultyLabel || 'Cơ bản'}
                      </span>
                    )}
                    {exam.year && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/40 rounded-full text-[8px] font-bold text-white/80">
                        {exam.year}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 p-4 gap-2.5">
                    <h3 className="text-[13px] font-black text-text-primary group-hover:text-accent-pink transition-colors leading-snug line-clamp-2">
                      {exam.title}
                    </h3>

                    <div className="flex flex-wrap gap-1.5">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-bold border ${theme.badge}`}>
                        <BookOpen className="w-2.5 h-2.5" />
                        {questionCount}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-bg-tertiary border border-border-theme rounded-full text-[8.5px] font-bold text-text-secondary">
                        <Timer className="w-2.5 h-2.5" />
                        {timeMins} phút
                      </span>
                      {exam.province && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-bg-tertiary border border-border-theme rounded-full text-[8.5px] font-bold text-text-secondary">
                          <MapPin className="w-2.5 h-2.5" />
                          {exam.province}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-border-theme/40 text-[9px] text-text-secondary">
                      <span>Phần thưởng:</span>
                      <span className="px-1.5 py-0.2 bg-amber-500/10 border border-amber-500/25 rounded-md text-[8.5px] font-bold text-amber-500">
                        +30 ELO
                      </span>
                      <span className="px-1.5 py-0.2 bg-pink-500/10 border border-pink-500/25 rounded-md text-[8.5px] font-bold text-pink-500">
                        +200 EXP
                      </span>
                    </div>
                  </div>

                  <div className="px-4 pb-4 shrink-0">
                    {hasInternal ? (
                      <button
                        type="button"
                        onClick={() => startExam(exam)}
                        className={`w-full py-2.5 bg-gradient-to-r ${isRandom ? 'from-rose-500 via-pink-500 to-purple-600' : theme.btn} hover:opacity-95 text-white text-[11px] font-black rounded-xl transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-md cursor-pointer`}
                      >
                        {isRandom ? '🎲 Trộn Đề & Vào Thi' : 'Vào Thi Ngay'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : exam.sourceUrl ? (
                      <a
                        href={exam.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-bg-tertiary hover:bg-bg-tertiary/80 border border-border-theme text-text-secondary hover:text-text-primary text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        Xem Đề Gốc <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="w-full py-2.5 bg-bg-tertiary/50 text-text-secondary/50 text-[11px] font-bold rounded-xl flex items-center justify-center cursor-not-allowed">
                        Đang chuẩn bị đề
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ================== SCREEN 2: PHÒNG THI THỰC CHIẾN CBT (CHẾ ĐỘ THI CAO CẤP - HỖ TRỢ SÁNG/TỐI) ================== */}
      {examStatus === 'playing' && activeExam && currentQ && (
        <div className="w-full min-h-screen flex flex-col bg-bg-primary text-text-primary select-none relative z-20 transition-colors">
          
          {/* 1. THANH TIÊU ĐỀ PHÒNG THI CHUYÊN NGHIỆP (CBT TOP COMMAND BAR) */}
          <header className="sticky top-0 z-40 w-full bg-bg-secondary/95 dark:bg-[#0d0f1a]/95 backdrop-blur-xl border-b border-border-theme dark:border-white/10 px-4 md:px-8 py-3 transition-colors shadow-lg dark:shadow-xl">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
              
              {/* Trái: Nút Thoát & Thông tin đề thi */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowExitModal(true)}
                  className="p-2.5 rounded-2xl bg-bg-tertiary hover:bg-rose-500/15 border border-border-theme hover:border-rose-500/30 text-text-secondary hover:text-rose-500 dark:hover:text-rose-300 transition-all active:scale-95 cursor-pointer shrink-0"
                  title="Rời khỏi phòng thi"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-gradient-to-r from-pink-500/15 to-purple-500/15 border border-pink-500/30 text-accent-pink font-mono tracking-wider shrink-0">
                      {activeExam.subjectLabel || activeExam.subject?.toUpperCase() || 'THPT QUỐC GIA'}
                    </span>
                    <span className="text-[10px] font-mono text-text-secondary">
                      {activeExam.year || '2025 - 2026'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hidden sm:flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ĐANG THI TRỰC TUYẾN
                    </span>
                  </div>
                  <h1 className="text-xs md:text-sm lg:text-base font-black text-text-primary truncate max-w-[240px] sm:max-w-md lg:max-w-xl">
                    {activeExam.title}
                  </h1>
                </div>
              </div>

              {/* Giữa: Đồng hồ đếm ngược HUD */}
              <div className={`flex items-center gap-3 px-4 md:px-6 py-1.5 md:py-2 rounded-2xl border transition-all duration-300 shrink-0 ${
                timeRemaining <= 300 
                  ? 'bg-rose-500/20 border-rose-500/60 text-rose-500 dark:text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse' 
                  : 'bg-bg-tertiary dark:bg-[#151828] border-accent-pink/30 shadow-[0_0_20px_rgba(240,57,140,0.12)] text-text-primary'
              }`}>
                <Clock className={`w-4 h-4 md:w-5 md:h-5 ${timeRemaining <= 300 ? 'text-rose-500 animate-spin' : 'text-accent-pink'}`} style={timeRemaining <= 300 ? { animationDuration: '3s' } : {}} />
                <div className="flex flex-col items-center">
                  <span className={`font-mono text-lg md:text-2xl font-black tracking-wider ${timeRemaining <= 300 ? 'text-rose-500 dark:text-rose-400' : 'text-accent-pink'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-text-secondary font-semibold -mt-1 hidden sm:inline">
                    {timeRemaining <= 300 ? 'Sắp hết giờ!' : 'Thời gian làm bài'}
                  </span>
                </div>
              </div>

              {/* Phải: Chuyển Giao diện Sáng/Tối, Toàn màn hình & Nộp bài */}
              <div className="flex items-center gap-2 md:gap-2.5 shrink-0">
                {/* Nút Đổi Giao Diện Sáng / Tối trong phòng thi */}
                <button
                  type="button"
                  onClick={() => {
                    playSound.click();
                    setTheme(isDark ? 'light' : 'dark');
                  }}
                  className="p-2.5 rounded-xl bg-bg-tertiary hover:bg-bg-secondary border border-border-theme text-text-secondary hover:text-text-primary transition-all flex items-center justify-center cursor-pointer active:scale-95"
                  title={isDark ? 'Chuyển sang Giao diện Sáng (Light Theme)' : 'Chuyển sang Giao diện Tối (Dark Theme)'}
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
                  ) : (
                    <Moon className="w-4 h-4 text-accent-pink transition-transform duration-300 hover:-rotate-12" />
                  )}
                </button>

                {/* Toàn màn hình */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="hidden md:flex p-2.5 rounded-xl bg-bg-tertiary hover:bg-bg-secondary border border-border-theme text-text-secondary hover:text-text-primary transition-all items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95"
                  title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình phòng thi (F11)'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  <span className="hidden xl:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
                </button>

                {/* Nút Mục Lục Câu Hỏi trên Mobile */}
                <button
                  type="button"
                  onClick={() => setMobilePaletteOpen(true)}
                  className="lg:hidden p-2.5 rounded-xl bg-bg-tertiary border border-border-theme text-text-secondary hover:text-text-primary transition-all flex items-center gap-1.5 text-xs font-bold"
                  title="Mở mục lục câu hỏi"
                >
                  <LayoutGrid className="w-4 h-4 text-accent-pink" />
                  <span className="hidden sm:inline">Câu hỏi ({answeredStats.answered}/{answeredStats.total})</span>
                </button>

                {/* Nút Nộp Bài */}
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:opacity-95 text-white font-black text-xs md:text-sm transition-all shadow-lg shadow-pink-500/25 flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Nộp Bài</span>
                </button>
              </div>
            </div>

            {/* 2. THANH TABS CHUYỂN NHANH 3 PHẦN THI (PART NAVIGATION TABS) */}
            <div className="max-w-[1600px] mx-auto mt-3 pt-2.5 border-t border-border-theme/60 flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
              <div className="flex items-center gap-2.5 min-w-max">
                {partStats.map((part) => {
                  const isActive = currentPart?.id === part.id;
                  return (
                    <button
                      key={part.id}
                      type="button"
                      onClick={() => {
                        playSound.click();
                        setCurrentQuestionIndex(part.startIndex);
                      }}
                      className={`px-4 py-2 rounded-2xl transition-all duration-200 flex items-center gap-3 border text-left cursor-pointer group ${
                        isActive
                          ? 'bg-gradient-to-r from-pink-500/15 via-purple-600/10 to-transparent border-pink-500 shadow-[0_0_20px_rgba(240,57,140,0.18)] ring-1 ring-pink-500/40'
                          : 'bg-bg-tertiary/50 dark:bg-white/[0.02] border-border-theme dark:border-white/10 hover:bg-bg-tertiary hover:border-pink-500/30'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-colors font-mono ${
                        isActive 
                          ? 'bg-pink-500 text-white shadow-md shadow-pink-500/40' 
                          : 'bg-bg-secondary dark:bg-zinc-800 text-text-secondary border border-border-theme'
                      }`}>
                        {part.id === 'part_1' ? 'I' : part.id === 'part_2' ? 'II' : 'III'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isActive ? 'text-text-primary font-black' : 'text-text-secondary group-hover:text-text-primary'}`}>
                            {part.title}: {part.shortName}
                          </span>
                          {part.isCompleted && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" title="Đã hoàn thành phần này" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-text-secondary font-mono">
                          <span>{part.total} câu</span>
                          <span>•</span>
                          <span className={part.answeredCount === part.total ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
                            Đã làm: {part.answeredCount}/{part.total}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="hidden xl:flex items-center gap-3 text-xs text-text-secondary font-mono">
                <span>Toàn bài: <strong className="text-text-primary font-bold">{answeredStats.answered}/{answeredStats.total} câu ({answeredStats.percentage}%)</strong></span>
                <span>•</span>
                <span>Cờ: <strong className="text-orange-500 font-bold">{answeredStats.flaggedIndices.length}</strong></span>
              </div>
            </div>
          </header>

          {/* 3. KHÔNG GIAN LÀM BÀI CHÍNH */}
          <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* CỘT CHÍNH: THẺ CÂU HỎI */}
              <main className="lg:col-span-8 xl:col-span-9 flex flex-col gap-5">
                
                <div className="bg-bg-secondary dark:bg-[#121422]/95 border border-border-theme dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-xl dark:shadow-2xl backdrop-blur-xl flex flex-col justify-between min-h-[560px] transition-colors">
                  <div>
                    {/* Header Thẻ Câu Hỏi */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border-theme dark:border-white/10 mb-5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="px-3 py-1 rounded-xl bg-pink-500/15 border border-pink-500/30 text-accent-pink font-mono text-xs font-black uppercase tracking-wider">
                          {currentPart?.title}: {currentPart?.name?.toUpperCase()}
                        </span>
                        <span className="text-sm font-black text-text-primary font-mono">
                          CÂU {questionNumberInPart}/{currentPart?.total}
                        </span>
                        <span className="text-xs text-text-secondary font-mono hidden sm:inline">
                          (Câu {currentQuestionIndex + 1}/{activeExam.questions.length} toàn bài)
                        </span>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 font-mono">
                          {currentPart?.pointsPerQuestion}
                        </span>
                      </div>

                      {/* Nút cỡ chữ & Gắn cờ */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-bg-tertiary p-1 rounded-xl border border-border-theme text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => setFontSize('normal')}
                            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${fontSize === 'normal' ? 'bg-pink-500 text-white shadow-sm font-black' : 'text-text-secondary hover:text-text-primary'}`}
                            title="Cỡ chữ vừa"
                          >
                            A
                          </button>
                          <button
                            type="button"
                            onClick={() => setFontSize('large')}
                            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${fontSize === 'large' ? 'bg-pink-500 text-white shadow-sm font-black' : 'text-text-secondary hover:text-text-primary'}`}
                            title="Cỡ chữ to"
                          >
                            A+
                          </button>
                          <button
                            type="button"
                            onClick={() => setFontSize('xlarge')}
                            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${fontSize === 'xlarge' ? 'bg-pink-500 text-white shadow-sm font-black' : 'text-text-secondary hover:text-text-primary'}`}
                            title="Cỡ chữ rất to"
                          >
                            A++
                          </button>
                        </div>

                        <button 
                          type="button"
                          onClick={() => toggleFlag(currentQuestionIndex)}
                          className={`px-3 py-1.5 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold border cursor-pointer ${
                            flaggedQuestions.has(currentQuestionIndex) 
                              ? 'bg-rose-500/15 text-rose-500 dark:text-rose-300 border-rose-500/40 shadow-sm' 
                              : 'bg-bg-tertiary text-text-secondary hover:text-text-primary border-border-theme'
                          }`}
                          title="Đánh dấu câu này để xem lại trước khi nộp (Phím F)"
                        >
                          <Flag className={`w-3.5 h-3.5 ${flaggedQuestions.has(currentQuestionIndex) ? 'fill-current' : ''}`} />
                          <span className="hidden sm:inline">{flaggedQuestions.has(currentQuestionIndex) ? 'Đã gắn cờ' : 'Gắn cờ (F)'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Dòng ghi chú hướng dẫn thể thức thi của Phần hiện tại */}
                    <div className="mb-5 px-4 py-2.5 rounded-2xl bg-bg-tertiary/70 dark:bg-white/[0.02] border border-border-theme dark:border-white/5 flex items-center gap-2 text-xs text-text-secondary">
                      <Sparkles className="w-3.5 h-3.5 text-accent-pink shrink-0" />
                      <span>{currentPart?.desc}</span>
                    </div>

                    {/* Nội dung câu hỏi KaTeX (hỗ trợ click hình để zoom) */}
                    <div 
                      onClick={handleQuestionBodyClick}
                      className={`text-text-primary dark:text-zinc-100 leading-relaxed mb-6 select-text selection:bg-pink-500/25 ${
                        fontSize === 'xlarge' ? 'text-lg leading-loose' : fontSize === 'large' ? 'text-base leading-relaxed' : 'text-sm sm:text-[15px] leading-relaxed'
                      }`}
                      dangerouslySetInnerHTML={{ __html: formatMathText(currentQ.text) }}
                    />

                    {/* VÙNG ĐÁP ÁN THEO DẠNG CÂU HỎI */}
                    
                    {/* 1. DẠNG TRẮC NGHIỆM 4 LỰA CHỌN (MCQ) */}
                    {currentQ.type === 'mcq' && (
                      <div className={`mt-6 ${areAllOptionsShort ? 'grid grid-cols-1 md:grid-cols-2 gap-3.5' : 'grid grid-cols-1 gap-3.5'}`}>
                        {currentQ.options.map((option, optIdx) => {
                          const isSelected = userAnswers[currentQ.id] === optIdx;
                          const letter = String.fromCharCode(65 + optIdx);
                          const letterBadges = [
                            { bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30' },
                            { bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' },
                            { bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
                            { bg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30' }
                          ];
                          const badge = letterBadges[optIdx] || letterBadges[0];

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleSelectMcq(currentQ.id, optIdx)}
                              className={`p-4 rounded-2xl text-left transition-all duration-200 border flex items-center justify-between gap-3.5 group cursor-pointer ${
                                isSelected 
                                  ? 'bg-gradient-to-r from-pink-500/15 via-purple-500/10 to-transparent border-pink-500 text-text-primary shadow-[0_0_20px_rgba(240,57,140,0.18)] ring-1 ring-pink-500/50' 
                                  : 'bg-bg-secondary dark:bg-white/[0.02] border-border-theme dark:border-white/10 hover:bg-bg-tertiary hover:border-pink-500/40 text-text-primary dark:text-zinc-200 shadow-sm'
                              }`}
                            >
                              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                <div className={`w-9 h-9 rounded-xl font-black flex items-center justify-center text-sm shrink-0 transition-all font-mono border ${
                                  isSelected 
                                    ? 'bg-pink-500 border-pink-400 text-white shadow-md shadow-pink-500/50 scale-105' 
                                    : `${badge.bg} group-hover:scale-105`
                                }`}>
                                  {letter}
                                </div>
                                <div 
                                  className={`flex-1 text-xs sm:text-sm font-medium leading-relaxed ${isSelected ? 'text-text-primary font-bold' : 'text-text-primary dark:text-zinc-200 group-hover:text-accent-pink'}`}
                                  dangerouslySetInnerHTML={{ __html: formatMathText(option) }} 
                                />
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="hidden sm:inline-block text-[10px] font-mono text-text-secondary px-2 py-1 rounded-md bg-bg-tertiary border border-border-theme">
                                  [{optIdx + 1}]
                                </span>
                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-500 flex items-center justify-center shrink-0">
                                    <Check className="w-3.5 h-3.5" />
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 2. DẠNG ĐÚNG / SAI PHỨC HỢP (TRUE / FALSE) */}
                    {currentQ.type === 'true_false' && (
                      <div className="space-y-3.5 mt-6">
                        <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                          <span className="text-xs text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-accent-purple" />
                            Đánh giá Đúng hoặc Sai cho mỗi mệnh đề a), b), c), d)
                          </span>
                          <span className="text-xs font-mono font-bold text-accent-purple">
                            Đã chọn: {Object.keys(userAnswers[currentQ.id] || {}).length}/4 ý
                          </span>
                        </div>

                        <div className="space-y-3">
                          {currentQ.statements.map((stmt, sIdx) => {
                            const currentVal = userAnswers[currentQ.id]?.[stmt.id];
                            const letter = String.fromCharCode(97 + sIdx);
                            const hasAnswered = currentVal !== undefined;

                            return (
                              <div 
                                key={stmt.id}
                                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                  hasAnswered 
                                    ? 'bg-bg-tertiary/80 dark:bg-white/[0.04] border-accent-pink/30 dark:border-white/20' 
                                    : 'bg-bg-secondary dark:bg-white/[0.02] border-border-theme dark:border-white/10 hover:border-border-theme'
                                }`}
                              >
                                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                  <span className="w-7 h-7 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5 font-mono">
                                    {letter})
                                  </span>
                                  <div 
                                    className="text-xs sm:text-sm text-text-primary dark:text-zinc-100 leading-relaxed font-medium"
                                    dangerouslySetInnerHTML={{ __html: formatMathText(stmt.text) }} 
                                  />
                                </div>
                                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                                  <button
                                    type="button"
                                    onClick={() => handleTrueFalseChange(currentQ.id, stmt.id, true)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                      currentVal === true 
                                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30 scale-105 font-black' 
                                        : 'bg-bg-tertiary border-border-theme text-text-secondary hover:text-emerald-600 hover:border-emerald-500/40'
                                    }`}
                                  >
                                    <Check className="w-3.5 h-3.5" /> Đúng
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleTrueFalseChange(currentQ.id, stmt.id, false)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                      currentVal === false 
                                        ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-600/30 scale-105 font-black' 
                                        : 'bg-bg-tertiary border-border-theme text-text-secondary hover:text-rose-600 hover:border-rose-500/40'
                                    }`}
                                  >
                                    <X className="w-3.5 h-3.5" /> Sai
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 3. DẠNG ĐIỀN ĐÁP SỐ NGẮN (SHORT ANSWER) */}
                    {currentQ.type === 'short_answer' && (
                      <div className="mt-6 max-w-xl mx-auto space-y-4">
                        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                          <p className="text-xs text-cyan-800 dark:text-cyan-300 font-medium">
                            💡 Điền kết quả số (số nguyên hoặc số thập phân, dùng dấu . hoặc ,)
                          </p>
                        </div>

                        <div className="relative">
                          <input 
                            type="text"
                            placeholder="Nhập kết quả số..."
                            value={userAnswers[currentQ.id] || ''}
                            onChange={(e) => handleShortAnswerChange(currentQ.id, e.target.value)}
                            className="w-full text-center text-2xl md:text-3xl font-black font-mono tracking-wider py-4 px-6 rounded-2xl bg-bg-secondary dark:bg-[#0e101a] border-2 border-pink-500/40 focus:border-cyan-500 text-cyan-700 dark:text-cyan-300 placeholder:text-text-secondary/40 shadow-inner outline-none transition-all"
                          />
                          {userAnswers[currentQ.id] && (
                            <button
                              onClick={() => handleShortAnswerChange(currentQ.id, '')}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-rose-500 transition-colors p-1 cursor-pointer"
                              title="Xóa kết quả"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>

                        {/* Bàn phím số ảo nhanh */}
                        <div className="bg-bg-secondary dark:bg-[#0e101a] border border-border-theme dark:border-white/10 rounded-2xl p-4 shadow-lg">
                          <div className="text-[11px] text-text-secondary font-semibold mb-2.5 text-center uppercase tracking-wider">
                            Bàn phím nhập số nhanh
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {['7', '8', '9', '4', '5', '6', '1', '2', '3', '-', '0', '.'].map((key) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => {
                                  playSound.click();
                                  const curr = String(userAnswers[currentQ.id] || '');
                                  handleShortAnswerChange(currentQ.id, curr + key);
                                }}
                                className="py-3 rounded-xl bg-bg-tertiary hover:bg-bg-tertiary/80 border border-border-theme text-text-primary font-mono font-bold text-lg active:scale-95 transition-all cursor-pointer shadow-sm"
                              >
                                {key}
                              </button>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => {
                                playSound.click();
                                const curr = String(userAnswers[currentQ.id] || '');
                                handleShortAnswerChange(currentQ.id, curr.slice(0, -1));
                              }}
                              className="py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-xs uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>⌫ Xóa ký tự</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                playSound.click();
                                handleShortAnswerChange(currentQ.id, '');
                              }}
                              className="py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-700 dark:text-rose-300 font-bold text-xs uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>Xóa hết</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thanh điều hướng chân câu hỏi */}
                  <div className="flex items-center justify-between border-t border-border-theme dark:border-white/10 pt-6 mt-8">
                    <button
                      type="button"
                      onClick={() => { playSound.click(); setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1)); }}
                      disabled={currentQuestionIndex === 0}
                      className="px-5 py-2.5 bg-bg-tertiary hover:bg-bg-secondary border border-border-theme text-text-primary text-xs font-bold rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Câu trước (Phím [)</span>
                    </button>

                    <span className="text-[11px] font-mono text-text-secondary hidden sm:inline">
                      Phím tắt: [ hoặc ← lùi • ] hoặc → tiến • 1-4/A-D chọn • F cờ
                    </span>

                    {currentQuestionIndex < activeExam.questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => { playSound.click(); setCurrentQuestionIndex(currentQuestionIndex + 1); }}
                        className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-pink-500/20"
                      >
                        <span>Câu sau (Phím ])</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowSubmitModal(true)}
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Xem lại & Nộp bài</span>
                      </button>
                    )}
                  </div>
                </div>
              </main>

              {/* CỘT PHỤ: BẢNG TIẾN TRÌNH 3 PHẦN THI ĐỘC LẬP (STICKY) */}
              <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-28 bg-bg-secondary dark:bg-[#121422]/95 border border-border-theme dark:border-white/10 p-5 rounded-3xl shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-4 max-h-[calc(100vh-140px)] flex flex-col transition-colors">
                
                {/* Header Thống kê tiến trình */}
                <div className="flex items-center justify-between pb-3 border-b border-border-theme dark:border-white/10">
                  <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-2 font-mono">
                    <LayoutGrid className="w-4 h-4 text-accent-pink" /> BẢNG TIẾN TRÌNH THI
                  </h3>
                  <span className="text-[11px] font-mono font-bold text-accent-pink bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full">
                    {answeredStats.answered}/{answeredStats.total} câu
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-bg-tertiary dark:bg-zinc-800/80 rounded-full h-2 overflow-hidden border border-border-theme dark:border-white/5">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${answeredStats.percentage}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Bộ lọc câu hỏi */}
                <div className="flex gap-1 bg-bg-tertiary p-1 rounded-xl text-[10px] font-bold border border-border-theme">
                  <button
                    type="button"
                    onClick={() => setQuestionPaletteFilter('all')}
                    className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
                      questionPaletteFilter === 'all'
                        ? 'bg-pink-500 text-white shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Tất cả ({answeredStats.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionPaletteFilter('unanswered')}
                    className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
                      questionPaletteFilter === 'unanswered'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-text-secondary hover:text-amber-500'
                    }`}
                  >
                    Chưa ({answeredStats.unansweredIndices.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionPaletteFilter('flagged')}
                    className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
                      questionPaletteFilter === 'flagged'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-text-secondary hover:text-rose-500'
                    }`}
                  >
                    Cờ ({answeredStats.flaggedIndices.length})
                  </button>
                </div>

                {/* DANH SÁCH 3 PHẦN THI ĐỘC LẬP */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                  {partStats.map((part) => (
                    <div 
                      key={part.id} 
                      className={`rounded-2xl border p-3.5 transition-all ${
                        currentPart?.id === part.id 
                          ? 'bg-accent-pink/5 dark:bg-white/[0.03] border-pink-500/40 shadow-sm' 
                          : 'bg-bg-tertiary/50 dark:bg-black/20 border-border-theme dark:border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md font-mono ${
                            currentPart?.id === part.id ? 'bg-pink-500 text-white' : 'bg-bg-secondary dark:bg-zinc-800 text-text-primary dark:text-zinc-300 border border-border-theme'
                          }`}>
                            {part.title}
                          </span>
                          <span className="text-xs font-bold text-text-primary">{part.shortName}</span>
                        </div>
                        <span className="text-[11px] font-mono text-text-secondary">
                          {part.answeredCount}/{part.total}
                        </span>
                      </div>

                      {/* Lưới câu hỏi của phần này */}
                      <div className="grid grid-cols-5 gap-1.5">
                        {part.questions.map((q) => {
                          const idx = q.globalIndex;
                          if (!filteredQuestionIndices.includes(idx)) return null;

                          const isCurrent = idx === currentQuestionIndex;
                          const isFlagged = flaggedQuestions.has(idx);
                          const ans = userAnswers[q.id];

                          let status = 'unanswered';
                          if (q.type === 'mcq') {
                            if (ans !== undefined && ans !== null) status = 'answered';
                          } else if (q.type === 'short_answer') {
                            if (ans !== undefined && ans !== null && String(ans).trim() !== '') status = 'answered';
                          } else if (q.type === 'true_false') {
                            const keys = ans && typeof ans === 'object' ? Object.keys(ans).length : 0;
                            if (keys === 4) status = 'answered';
                            else if (keys > 0) status = 'partial';
                          }

                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => {
                                playSound.click();
                                setCurrentQuestionIndex(idx);
                              }}
                              className={`relative h-9 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center cursor-pointer ${
                                isCurrent
                                  ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-bg-secondary dark:ring-offset-[#121422] scale-105 z-10 font-black ' + 
                                    (status === 'answered' ? 'bg-emerald-600 text-white' : status === 'partial' ? 'bg-amber-600 text-white' : 'bg-pink-500 text-white')
                                  : status === 'answered'
                                    ? 'bg-emerald-500/15 dark:bg-emerald-600/30 hover:bg-emerald-500/25 border border-emerald-500/50 text-emerald-700 dark:text-emerald-300 font-bold'
                                    : status === 'partial'
                                      ? 'bg-amber-500/15 dark:bg-amber-500/25 hover:bg-amber-500/25 border border-amber-500/50 text-amber-700 dark:text-amber-300 font-bold'
                                      : 'bg-bg-tertiary hover:bg-bg-tertiary/70 border border-border-theme text-text-secondary hover:text-text-primary'
                              }`}
                            >
                              <span>{idx + 1}</span>
                              {isFlagged && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-bg-secondary dark:border-[#121422] shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chú thích màu sắc */}
                <div className="border-t border-border-theme pt-3 text-[10px] text-text-secondary grid grid-cols-2 gap-1.5 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-pink-500" /> <span>Đang làm</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500" /> <span>Đã hoàn thành</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-500" /> <span>Làm 1 phần (Đ/S)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> <span>Đặt cờ xem lại</span>
                  </div>
                </div>

                {/* Nút nộp bài trực tiếp */}
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:opacity-95 text-white text-xs font-black rounded-xl transition-all active:scale-95 shadow-md shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Nộp Bài Thi</span>
                </button>
              </aside>
            </div>
          </div>
        </div>
      )}

      {/* ================== MOBILE DRAWER BẢNG CÂU HỎI (CHIA 3 PHẦN - HỖ TRỢ SÁNG/TỐI) ================== */}
      <AnimatePresence>
        {mobilePaletteOpen && activeExam && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobilePaletteOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="absolute right-0 top-0 bottom-0 w-84 bg-bg-secondary dark:bg-[#121422] border-l border-border-theme dark:border-white/10 p-5 flex flex-col shadow-2xl z-10 transition-colors"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border-theme dark:border-white/10 mb-4">
                <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-2 font-mono">
                  <LayoutGrid className="w-4 h-4 text-accent-pink" /> BẢNG TIẾN TRÌNH ({answeredStats.answered}/{answeredStats.total})
                </h3>
                <button
                  onClick={() => setMobilePaletteOpen(false)}
                  className="p-1 rounded-lg text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* DANH SÁCH 3 PHẦN THI TRÊN MOBILE */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {partStats.map((part) => (
                  <div key={part.id} className="rounded-2xl border border-border-theme dark:border-white/10 p-3.5 bg-bg-tertiary/50 dark:bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-black text-accent-pink uppercase font-mono">{part.title}: {part.shortName}</span>
                      <span className="text-[11px] font-mono text-text-secondary">{part.answeredCount}/{part.total}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {part.questions.map((q) => {
                        const idx = q.globalIndex;
                        const isCurrent = idx === currentQuestionIndex;
                        const isFlagged = flaggedQuestions.has(idx);
                        const ans = userAnswers[q.id];
                        let isAnswered = false;
                        if (q.type === 'mcq') isAnswered = ans !== undefined && ans !== null;
                        else if (q.type === 'short_answer') isAnswered = ans !== undefined && ans !== null && String(ans).trim() !== '';
                        else if (q.type === 'true_false') isAnswered = ans && Object.keys(ans).length === 4;

                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => {
                              playSound.click();
                              setCurrentQuestionIndex(idx);
                              setMobilePaletteOpen(false);
                            }}
                            className={`h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center border relative cursor-pointer ${
                              isCurrent
                                ? 'bg-pink-500 border-pink-400 text-white font-black shadow-md'
                                : isAnswered
                                  ? 'bg-emerald-500/20 dark:bg-emerald-500/30 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 font-bold'
                                  : 'bg-bg-tertiary dark:bg-white/5 border-border-theme dark:border-white/10 text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            {idx + 1}
                            {isFlagged && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute -top-1 -right-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border-theme dark:border-white/10 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobilePaletteOpen(false);
                    setShowSubmitModal(true);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Nộp Bài Thi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================== SCREEN 3: EXAM RESULT (KẾT QUẢ & LỜI GIẢI CHI TIẾT) ================== */}
      {examStatus === 'result' && activeExam && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 md:p-8 max-w-6xl mx-auto pb-24 relative z-10"
        >
          {/* Header Báo Cáo */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-theme">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { playSound.click(); setExamStatus('landing'); }}
                className="p-2.5 bg-bg-tertiary border border-border-theme rounded-xl text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                title="Quay lại danh sách đề thi"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Thi đấu hoàn tất
                </span>
                <h1 className="text-2xl font-black text-text-primary tracking-tight">Báo Cáo Điểm Số & Lời Giải</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => startExam(activeExam)}
                className="px-4 py-2 rounded-xl bg-bg-tertiary hover:bg-bg-tertiary/80 border border-border-theme text-xs font-bold text-text-primary transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-accent-pink" /> Làm lại đề này
              </button>
              <button
                onClick={() => setExamStatus('landing')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-90 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Rocket className="w-3.5 h-3.5" /> Chọn đề khác
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Cột Trái: Score board & ELO rewards */}
            <div className="lg:col-span-1 space-y-6">
              {/* Score panel */}
              <div id="exam-result-card" className="bg-bg-secondary border border-border-theme p-6 rounded-3xl text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500" />
                
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary block mb-3 font-mono">
                  Điểm Số THPT
                </span>
                
                <h2 className={`text-6xl font-black tracking-tight font-mono ${finalScore >= 8.0 ? 'text-emerald-400' : finalScore >= 5.0 ? 'text-amber-400' : 'text-rose-500'}`}>
                  {finalScore}
                </h2>
                
                <p className="text-xs text-text-secondary mt-3 mb-5 font-mono">
                  Đúng {correctCount} trên tổng số {activeExam.questions.length} câu hỏi.
                </p>

                {/* Nút chia sẻ nhanh lên Story */}
                <button
                  onClick={handleShareExamResult}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/15 cursor-pointer"
                >
                  🚀 Chia sẻ chiến tích lên Story
                </button>
              </div>

              {/* Bảng phân tích điểm 3 Phần chuẩn Bộ GD&ĐT */}
              <div className="bg-bg-secondary border border-border-theme p-5 rounded-3xl space-y-3 shadow-md">
                <h3 className="text-xs font-black text-text-primary uppercase tracking-wider font-mono flex items-center gap-2">
                  <Award className="w-4 h-4 text-pink-400" /> Điểm Số Chi Tiết Theo 3 Phần
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-bg-tertiary border border-white/5">
                    <span className="font-bold text-zinc-300">Phần I (Trắc nghiệm đơn)</span>
                    <span className="font-black text-pink-400">{partScores.part1} / 4.5 đ</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-bg-tertiary border border-white/5">
                    <span className="font-bold text-zinc-300">Phần II (Đúng / Sai)</span>
                    <span className="font-black text-purple-400">{partScores.part2} / 4.0 đ</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-bg-tertiary border border-white/5">
                    <span className="font-bold text-zinc-300">Phần III (Trả lời ngắn)</span>
                    <span className="font-black text-cyan-400">{partScores.part3} / 1.5 đ</span>
                  </div>
                </div>
              </div>

              {/* ELO Rewards */}
              <div className="bg-bg-secondary border border-border-theme p-6 rounded-3xl shadow-md">
                <h3 className="text-xs font-black text-text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Phần Thưởng Đấu Trường
                </h3>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-bg-tertiary border border-border-theme rounded-2xl p-3.5">
                    <span className="text-[10px] font-bold text-text-secondary block mb-1">Điểm ELO</span>
                    <span className={`text-lg font-black font-mono ${aiReviewData?.rewards?.elo >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {aiReviewData?.rewards?.elo >= 0 ? `+${aiReviewData.rewards.elo}` : aiReviewData?.rewards?.elo} ELO
                    </span>
                  </div>
                  <div className="bg-bg-tertiary border border-border-theme rounded-2xl p-3.5">
                    <span className="text-[10px] font-bold text-text-secondary block mb-1">Điểm EXP</span>
                    <span className="text-lg font-black text-pink-400 font-mono">
                      +{aiReviewData?.rewards?.exp} EXP
                    </span>
                  </div>
                </div>
              </div>

              {/* AI review card */}
              <div className="bg-bg-secondary border border-border-theme p-6 rounded-3xl relative overflow-hidden shadow-md">
                <h3 className="text-xs font-black text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5 font-mono">
                  <BrainCircuit className="w-4 h-4 text-pink-400" /> Phân Tích Lỗ Hổng Kiến Thức
                </h3>

                <div className="mb-4">
                  <span className="text-[10px] font-bold text-text-secondary block mb-2 font-mono">Chủ đề cần gia cố:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {aiReviewData?.weakPoints?.map((point, index) => (
                      <span key={index} className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold rounded-lg flex items-center gap-1">
                        ⚠️ {point}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed bg-bg-tertiary border border-border-theme p-3.5 rounded-2xl">
                  {aiReviewData?.generalAdvice}
                </p>
              </div>
            </div>

            {/* Cột Phải: Đáp án & Solution keys chi tiết */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-bg-secondary border border-border-theme p-6 sm:p-7 rounded-3xl shadow-md">
                
                {/* Header danh sách lời giải & Bộ lọc */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-border-theme">
                  <h3 className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <BookOpen className="w-4 h-4 text-rose-400" /> Lời Giải Chi Tiết Từng Câu
                  </h3>

                  {/* Tabs lọc theo 3 phần thi & câu đúng/sai */}
                  <div className="flex flex-wrap gap-1 bg-bg-tertiary p-1 rounded-xl text-[10px] font-bold">
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'part_1', label: 'Phần I (Đơn)' },
                      { id: 'part_2', label: 'Phần II (Đ/S)' },
                      { id: 'part_3', label: 'Phần III (Điền)' },
                      { id: 'wrong', label: 'Câu sai ❌' },
                      { id: 'correct', label: 'Câu đúng ✔️' },
                      { id: 'skipped', label: 'Chưa làm ⚪' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setResultReviewFilter(tab.id)}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          resultReviewFilter === tab.id
                            ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400 font-extrabold'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Danh sách câu hỏi và lời giải */}
                <div className="space-y-6">
                  {activeExam.questions.map((q, idx) => {
                    const isCorrect = userAnswers[q.id] !== undefined && (
                      q.type === 'mcq' ? userAnswers[q.id] === q.correctAnswer :
                      q.type === 'short_answer' ? parseFloat(String(userAnswers[q.id]).replace(',', '.')) === q.correctShortAnswer :
                      (() => {
                        let ok = true;
                        const subAns = userAnswers[q.id] || {};
                        q.statements?.forEach(s => { if (subAns[s.id] !== s.correctValue) ok = false; });
                        return ok;
                      })()
                    );
                    const isSkipped = userAnswers[q.id] === undefined || userAnswers[q.id] === null;

                    if (resultReviewFilter === 'part_1' && q.type !== 'mcq') return null;
                    if (resultReviewFilter === 'part_2' && q.type !== 'true_false') return null;
                    if (resultReviewFilter === 'part_3' && q.type !== 'short_answer') return null;
                    if (resultReviewFilter === 'wrong' && (isCorrect || isSkipped)) return null;
                    if (resultReviewFilter === 'correct' && !isCorrect) return null;
                    if (resultReviewFilter === 'skipped' && !isSkipped) return null;

                    return (
                      <div key={q.id} className="border-b border-border-theme pb-6 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[11px] font-black text-text-secondary font-mono">CÂU {idx + 1}</span>
                          {isSkipped ? (
                            <span className="px-2 py-0.5 bg-zinc-500/10 border border-zinc-500/20 rounded-md text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                              Chưa làm
                            </span>
                          ) : isCorrect ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[8px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Đúng
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-[8px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-0.5">
                              <XCircle className="w-2.5 h-2.5" /> Sai
                            </span>
                          )}
                        </div>

                        {/* Đề câu hỏi (hỗ trợ click hình để phóng to) */}
                        <div 
                          onClick={handleQuestionBodyClick}
                          className="text-xs text-text-primary leading-relaxed mb-4 select-text"
                          dangerouslySetInnerHTML={{ __html: formatMathText(q.text) }}
                        />

                        {/* Đáp án học sinh vs Đáp án đúng */}
                        {q.type === 'mcq' && (
                          <div className="flex flex-wrap gap-3 mb-3 text-[11px] font-mono">
                            <span className={`px-2.5 py-1 rounded-lg border ${
                              isCorrect 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            }`}>
                              Bạn chọn: {userAnswers[q.id] !== undefined ? String.fromCharCode(65 + userAnswers[q.id]) : 'Chưa chọn'}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                              Đáp án đúng: {String.fromCharCode(65 + q.correctAnswer)}
                            </span>
                          </div>
                        )}

                        {q.type === 'short_answer' && (
                          <div className="flex flex-wrap gap-3 mb-3 text-[11px] font-mono">
                            <span className={`px-2.5 py-1 rounded-lg border ${
                              isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            }`}>
                              Bạn điền: {userAnswers[q.id] !== undefined ? userAnswers[q.id] : 'Chưa điền'}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                              Đáp số đúng: {q.correctShortAnswer} {q.suffix || ''}
                            </span>
                          </div>
                        )}

                        {/* Lời giải chi tiết */}
                        {q.explanation && (
                          <div className="bg-bg-tertiary border border-border-theme p-4 rounded-2xl mt-2">
                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest block mb-1 font-mono">Lời giải chi tiết:</span>
                            <div 
                              onClick={handleQuestionBodyClick}
                              className="text-[11px] text-text-secondary leading-relaxed select-text"
                              dangerouslySetInnerHTML={{ __html: formatMathText(q.explanation) }}
                            />

                            {/* Nút bấm hỏi Gia Sư AI */}
                            <button
                              type="button"
                              onClick={() => startAiTutor(q.text, q.explanation)}
                              className="mt-3 flex items-center gap-1.5 text-[9.5px] font-black text-pink-400 hover:text-pink-300 uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Hỏi Gia Sư AI giảng lại bước giải này
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      )}

      {/* ================== MODAL XÁC NHẬN NỘP BÀI THI ================== */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-bg-secondary border border-border-theme rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl text-left"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-text-primary">Xác Nhận Nộp Bài Thi</h3>
                  <p className="text-xs text-text-secondary">Kiểm tra lại tiến trình bài làm trước khi nộp điểm vào hệ thống</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 my-5">
                <div className="p-3 bg-bg-tertiary rounded-2xl border border-border-theme text-center">
                  <span className="text-[10px] text-text-secondary block font-bold font-mono">ĐÃ LÀM</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">{answeredStats.answered}/{answeredStats.total}</span>
                </div>
                <div className="p-3 bg-bg-tertiary rounded-2xl border border-border-theme text-center">
                  <span className="text-[10px] text-text-secondary block font-bold font-mono">CHƯA LÀM</span>
                  <span className="text-xl font-black text-rose-400 font-mono">{answeredStats.unansweredIndices.length} câu</span>
                </div>
                <div className="p-3 bg-bg-tertiary rounded-2xl border border-border-theme text-center">
                  <span className="text-[10px] text-text-secondary block font-bold font-mono">GẮN CỜ</span>
                  <span className="text-xl font-black text-orange-400 font-mono">{answeredStats.flaggedIndices.length} câu</span>
                </div>
              </div>

              {answeredStats.unansweredIndices.length > 0 && (
                <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                  <span className="text-[11px] font-bold text-rose-400 block mb-2 font-mono">
                    ⚠️ Bạn còn {answeredStats.unansweredIndices.length} câu chưa chọn đáp án:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {answeredStats.unansweredIndices.map((uIdx) => (
                      <button
                        key={uIdx}
                        type="button"
                        onClick={() => {
                          setCurrentQuestionIndex(uIdx);
                          setShowSubmitModal(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-bg-secondary hover:bg-rose-500 hover:text-white border border-rose-500/30 text-[10px] font-bold text-text-primary transition-colors cursor-pointer"
                        title="Bấm để nhảy tới câu này làm ngay"
                      >
                        Câu {uIdx + 1} ↗
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-bg-tertiary hover:bg-bg-tertiary/80 border border-border-theme text-xs font-bold text-text-primary transition-all cursor-pointer"
                >
                  Tiếp tục làm bài
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitModal(false);
                    submitExam();
                  }}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:opacity-90 text-xs font-black text-white shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
                >
                  Xác Nhận Nộp Bài
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================== MODAL XÁC NHẬN THOÁT KHỎI PHÒNG THI ================== */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-bg-secondary border border-border-theme rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-text-primary mb-1">Thoát Bài Thi?</h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-6">
                Bạn đang trong phiên làm bài thi. Nếu thoát bây giờ, toàn bộ bài làm hiện tại sẽ bị hủy và không được lưu kết quả.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-bg-tertiary hover:bg-bg-tertiary/80 border border-border-theme text-xs font-bold text-text-primary cursor-pointer"
                >
                  Ở lại thi tiếp
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitModal(false);
                    if (timerRef.current) clearInterval(timerRef.current);
                    setExamStatus('landing');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md cursor-pointer"
                >
                  Thoát bài thi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================== LIGHTBOX MODAL PHÓNG TO HÌNH ẢNH ================== */}
      <AnimatePresence>
        {zoomedImage && (
          <div 
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-[100002] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out select-none"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl max-h-[92vh] w-full flex flex-col items-center cursor-default"
            >
              <div className="w-full flex items-center justify-between pb-3 mb-2 text-white/80">
                <span className="text-xs font-bold font-mono">🔍 Phóng to sơ đồ / đồ thị</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setImageZoomLevel(prev => Math.min(2.5, prev + 0.25))}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                    title="Phóng to (+)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setImageZoomLevel(prev => Math.max(0.75, prev - 0.25))}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                    title="Thu nhỏ (-)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setImageZoomLevel(1)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                    title="Mặc định (100%)"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <a
                    href={zoomedImage}
                    download="STEM_Exam_Image.png"
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-400 transition-all"
                    title="Tải ảnh về máy"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setZoomedImage(null)}
                    className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all"
                    title="Đóng (ESC)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-auto max-h-[78vh] w-full flex items-center justify-center p-4 bg-bg-secondary dark:bg-[#12141f] rounded-3xl border border-border-theme dark:border-white/15 shadow-2xl">
                {zoomedImage && (
                  <img 
                    src={zoomedImage}
                    alt="Enlarged diagram"
                    style={{ transform: `scale(${imageZoomLevel})`, transformOrigin: 'center center' }}
                    className="max-w-full max-h-[72vh] object-contain transition-transform duration-200 rounded-xl"
                  />
                )}
              </div>
              <p className="text-[11px] text-text-secondary mt-2 font-mono">
                💡 Nhấn ESC hoặc click ra ngoài để đóng • Kéo cuộn để quan sát các thông số nhỏ
              </p>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ================== GIA SƯ AI MINI DRAWER CHAT ================== */}
      <AnimatePresence>
        {showAiTutor && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 right-6 z-[1000] w-80 bg-bg-secondary border border-accent-pink/30 rounded-3xl shadow-2xl shadow-accent-pink/10 overflow-hidden flex flex-col justify-between"
          >
            <div className="p-4 border-b border-border-theme flex items-center justify-between bg-bg-tertiary">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-pink-500 animate-bounce" />
                <span className="text-xs font-black text-text-primary uppercase tracking-wider font-mono">STEM AI Gia Sư</span>
              </div>
              
              <button 
                onClick={() => setShowAiTutor(false)}
                className="p-1 hover:bg-bg-secondary rounded-lg text-text-secondary hover:text-text-primary transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="h-64 overflow-y-auto p-4 space-y-3 bg-bg-primary scrollbar-none">
              {aiChatMessages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3 text-[11px] leading-relaxed select-text ${
                    msg.role === 'user' 
                      ? 'bg-pink-500 text-white font-bold' 
                      : 'bg-bg-tertiary border border-border-theme text-text-primary'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-border-theme bg-bg-tertiary flex gap-2">
              <input 
                type="text" 
                placeholder="Hỏi thêm bước giải..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatMessage(); }}
                className="flex-1 bg-bg-secondary text-[11px] text-text-primary rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-pink-500/50 border border-border-theme placeholder:text-text-secondary/60"
              />
              <button 
                onClick={handleSendChatMessage}
                className="p-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================== POPUP GIAN LẬN CẢNH BÁO ĐỎ ================== */}
      <AnimatePresence>
        {showCheatWarning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-bg-secondary border-2 border-red-500/40 rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl relative"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto mb-4 animate-bounce">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <h2 className="text-xl font-black text-red-500 mb-2 uppercase tracking-wide">Phát Hiện Chuyển Tab!</h2>
              <p className="text-xs text-text-primary leading-relaxed mb-6">
                Hệ thống Phòng Thi Thực Chiến phát hiện bạn vừa rời khỏi màn hình thi đấu. Lần vi phạm: <strong className="text-red-500">{cheatAttempts}/3</strong>.<br/>
                Nếu vi phạm quá <strong className="text-red-500">3 lần</strong>, hệ thống sẽ cưỡng chế nộp bài ngay lập tức!
              </p>

              <button
                onClick={() => { playSound.click(); setShowCheatWarning(false); }}
                className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-red-500/20 cursor-pointer"
              >
                Đã hiểu, quay lại thi ngay
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ================== GAME-LIKE LEVEL UP OVERLAY ================== */}
        {showRankUpModal && rankUpDetails.newRank && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              id="rank-up-overlay-card"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-bg-secondary border-2 border-amber-500/40 rounded-3xl w-full max-w-sm p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.2)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
              
              <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                  className="w-full h-full bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(245,158,11,0.6)] border-4 border-yellow-300/80 relative z-10"
                >
                  {rankUpDetails.newRank.badge}
                </motion.div>
              </div>

              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-[10px] font-black tracking-[0.25em] text-amber-500 uppercase mb-1.5 animate-pulse font-mono"
              >
                THĂNG HẠNG VINH DANH!
              </motion.h2>
              
              <motion.h1 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 10, delay: 0.5 }}
                className="text-2xl font-black text-amber-400 mb-2 uppercase tracking-wide"
              >
                {rankUpDetails.newRank.title}
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-[10px] text-text-secondary px-4 mb-6 italic leading-relaxed"
              >
                "{rankUpDetails.newRank.description}"
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-bg-tertiary border border-border-theme rounded-2xl p-3.5 mb-6 grid grid-cols-2 gap-4"
              >
                <div className="border-r border-border-theme">
                  <span className="text-[8px] font-bold text-text-secondary block uppercase mb-0.5">Danh Vọng Mới</span>
                  <span className="text-md font-black text-amber-500 animate-pulse font-mono">{animatedElo} ELO</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-text-secondary block uppercase mb-0.5">Phòng Lab Thưởng</span>
                  <span className="text-md font-black text-emerald-400 font-mono">+{rankUpDetails.rewardElo} ELO</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-2.5"
              >
                <button
                  onClick={handleShareRankUp}
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 text-[11px] font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 border border-yellow-300/40 cursor-pointer"
                >
                  🚀 Chia sẻ vinh danh lên Story
                </button>
                <button
                  onClick={() => { playSound.click(); setShowRankUpModal(false); }}
                  className="w-full py-2 bg-bg-tertiary border border-border-theme text-text-secondary hover:text-text-primary text-[9px] font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  Bỏ qua vinh hiển
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* ================== GAME-LIKE POINTS EARNED OVERLAY ================== */}
        {showPointsPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.85, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 14 }}
              className="bg-bg-secondary border border-emerald-500/20 rounded-3xl w-full max-w-xs p-6 text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500" />
              
              <div className="w-14 h-14 bg-emerald-500/10 rounded-full mx-auto flex items-center justify-center text-emerald-400 border border-emerald-500/20 mb-4">
                <Sparkles className="w-7 h-7 animate-pulse" />
              </div>

              <h2 className="text-[9px] font-black tracking-widest text-emerald-500 uppercase mb-1 font-mono">CHIẾN THẮNG PHÒNG LAB!</h2>
              <h1 className="text-lg font-black text-text-primary mb-4">Nhận Điểm Danh Vọng</h1>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-bg-tertiary border border-border-theme rounded-xl p-3">
                  <span className="text-[8px] font-bold text-text-secondary block mb-0.5">Thưởng ELO</span>
                  <span className="text-sm font-black text-emerald-500 animate-pulse font-mono">+{animatedElo} ELO</span>
                </div>
                <div className="bg-bg-tertiary border border-border-theme rounded-xl p-3">
                  <span className="text-[8px] font-bold text-text-secondary block mb-0.5">Thưởng EXP</span>
                  <span className="text-sm font-black text-pink-500 animate-pulse font-mono">+{animatedExp} EXP</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleShareExamResult}
                  className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-[10px] font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/15 border border-white/10 cursor-pointer"
                >
                  🚀 Chia sẻ kết quả lên Story
                </button>
                <button
                  onClick={() => { playSound.click(); setShowPointsPopup(false); }}
                  className="w-full py-2 bg-bg-tertiary border border-border-theme text-text-secondary hover:text-text-primary text-[9px] font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  Tiếp tục học tập
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
