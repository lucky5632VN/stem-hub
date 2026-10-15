'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  Timer, 
  Flag, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  ChevronRight, 
  ArrowLeft,
  ShieldAlert,
  BrainCircuit,
  MessageSquare,
  X,
  Send,
  Calendar,
  MapPin,
  ExternalLink
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
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

  // States cốt lõi
  const [selectedSubject, setSelectedSubject] = useState('physics');
  const [selectedCategory, setSelectedCategory] = useState('bo-gddt');
  const [selectedYear, setSelectedYear] = useState('Tất cả');
  const [selectedProvince, setSelectedProvince] = useState('Tất cả');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [activeExam, setActiveExam] = useState(null); // Đề thi đang làm
  const [examStatus, setExamStatus] = useState('landing'); // 'landing' | 'playing' | 'result'
  const [loadingExam, setLoadingExam] = useState(false); // State tải đề thi từ Firestore
  const [firestoreExams, setFirestoreExams] = useState([]); // Danh sách đề thi từ Firestore

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
    // Ưu tiên sử dụng dữ liệu từ Firestore, chỉ fallback về EXAM_DATABASE nếu Firestore trống.
    // Lọc bỏ mọi đề thi không có câu hỏi nội bộ (questions rỗng) để đảm bảo thi trực tiếp 100%.
    const rawList = firestoreExams.length > 0 ? firestoreExams : EXAM_DATABASE;
    return rawList.filter(e => e.questions && e.questions.length > 0).map(e => {
      // Dynamic difficulty assignment fallback
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

  // Trích xuất các năm học khả dụng dựa trên môn học và phân loại
  const availableYears = useMemo(() => {
    const years = new Set();
    combinedExams.forEach(e => {
      if (e.subject === selectedSubject && e.category === selectedCategory && e.year) {
        years.add(e.year);
      }
    });
    return ['Tất cả', ...Array.from(years).sort((a, b) => b - a)];
  }, [selectedSubject, selectedCategory, combinedExams]);

  // Trích xuất các tỉnh/thành phố khả dụng dựa trên môn học, phân loại và năm học được chọn
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
  
  // Trạng thái làm bài
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [questionId]: answerData }
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);

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

  // Trạng thái thăng hạng và phần thưởng ELO giống trong game
  const [showRankUpModal, setShowRankUpModal] = useState(false);
  const [rankUpDetails, setRankUpDetails] = useState({ oldRank: null, newRank: null, newElo: 0, rewardElo: 0, rewardExp: 0 });
  const [showPointsPopup, setShowPointsPopup] = useState(false);
  const [pointsPopupData, setPointsPopupData] = useState({ elo: 0, exp: 0 });

  // Hiệu ứng chạy chữ số vù vù như game (Ticking numerical stats animation)
  const [animatedElo, setAnimatedElo] = useState(0);
  const [animatedExp, setAnimatedExp] = useState(0);

  useEffect(() => {
    if (showPointsPopup) {
      setAnimatedElo(0);
      setAnimatedExp(0);
      const duration = 1000; // 1s
      const steps = 25;
      const interval = duration / steps;
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
      const duration = 1200; // 1.2s
      const steps = 30;
      const interval = duration / steps;
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

  const timerRef = useRef(null);

  // Lọc đề thi phù hợp với môn học và phân loại được chọn
  const baseExams = combinedExams.filter(e => {
    const category = e.category || 'bo-gddt';
    if (e.subject !== selectedSubject || category !== selectedCategory) {
      return false;
    }
    // Lọc theo năm học
    if (selectedYear !== 'Tất cả' && String(e.year) !== String(selectedYear)) {
      return false;
    }
    // Lọc theo tỉnh/thành
    if (selectedProvince !== 'Tất cả' && e.province !== selectedProvince) {
      return false;
    }
    // Lọc theo cấp độ khó
    if (selectedDifficulty !== 'all' && e.difficulty !== selectedDifficulty) {
      return false;
    }
    return true;
  });
  const randomExamDummy = {
    id: `random_exam_${selectedSubject}`,
    subject: selectedSubject,
    subjectLabel: selectedSubject === 'math' ? 'Toán Học' : selectedSubject === 'physics' ? 'Vật Lý' : selectedSubject === 'chemistry' ? 'Hóa Học' : 'Sinh Học',
    title: `🎲 Đề Luyện Tập Ngẫu Nhiên (Tự Động Trộn Đề từ Kho Khoa Học)`,
    type: 'thpt_random',
    typeLabel: 'Vô Hạn Đề Thi',
    timeLimit: selectedSubject === 'math' ? 5400 : 3000,
    questions: []
  };
  const filteredExams = [...baseExams, randomExamDummy];

  // Lắng nghe sự kiện rời màn hình (Tab Switching - Anti Cheat)
  useEffect(() => {
    if (examStatus !== 'playing') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        playSound.error();
        const nextAttempts = cheatAttempts + 1;
        setCheatAttempts(nextAttempts);

        if (nextAttempts >= 3) {
          // Gian lận quá 3 lần -> Cưỡng chế nộp bài
          setShowCheatWarning(false);
          handleForceSubmit();
        } else {
          // Hiển thị cảnh báo đỏ rực
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
          handleForceSubmit(); // Hết giờ -> Tự động nộp
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examStatus]);

  // Khởi động kỳ thi
  const startExam = async (exam) => {
    playSound.success();
    setLoadingExam(true);

    // Nếu đề không có câu hỏi nội bộ nhưng có link nguồn → mở link ngoài
    if ((!exam.questions || exam.questions.length === 0) && exam.type !== 'thpt_random') {
      setLoadingExam(false);
      if (exam.sourceUrl) {
        window.open(exam.sourceUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert('⚠️ Đề thi này chưa có câu hỏi nội bộ và không có link nguồn.\nVui lòng liên hệ Admin để cập nhật nội dung đề.');
      }
      return;
    }
    
    let examQuestions = [];

    if (exam.type === 'thpt_random') {

      // 1. Tải câu hỏi từ Firestore để đồng bộ ngân hàng câu hỏi thực tế của Admin
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

      // 2. Lấy tất cả câu hỏi của môn học đó từ toàn bộ database mẫu
      const allSubjectQuestions = EXAM_DATABASE
        .filter(e => e.subject === exam.subject)
        .flatMap(e => e.questions);

      const staticMcqs = allSubjectQuestions.filter(q => q.type === 'mcq');
      const trueFalses = allSubjectQuestions.filter(q => q.type === 'true_false');
      const shortAnswers = allSubjectQuestions.filter(q => q.type === 'short_answer');

      // Chọn ngẫu nhiên không trùng lặp các câu hỏi
      const getRandomSamples = (arr, num) => {
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, num);
      };

      // Gộp câu hỏi từ Firestore và static mẫu để trộn đều
      const combinedMcqs = [...firestoreMcqs, ...staticMcqs];

      // Cần 12 MCQ, 4 T/F, 6 Trả lời ngắn
      const selectedMcqs = getRandomSamples(combinedMcqs, 12);
      const selectedTrueFalses = getRandomSamples(trueFalses, 4);
      const selectedShortAnswers = getRandomSamples(shortAnswers, 6);

      // Thêm tiền tố id duy nhất để tránh xung đột key
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

    // Phân nhóm câu hỏi theo cấu trúc chuẩn THPT Quốc Gia 2025 của Bộ GD&ĐT
    const mcqs = examQuestions.filter(q => q.type === 'mcq');
    const trueFalses = examQuestions.filter(q => q.type === 'true_false');
    const shortAnswers = examQuestions.filter(q => q.type === 'short_answer');

    // Tráo đổi ngẫu nhiên nội bộ từng phần để đảm bảo tính khách quan và chống quay cóp
    const shuffledMcqs = [...mcqs].sort(() => Math.random() - 0.5);
    const shuffledTrueFalses = [...trueFalses].sort(() => Math.random() - 0.5);
    const shuffledShortAnswers = [...shortAnswers].sort(() => Math.random() - 0.5);

    // Ghép lại theo thứ tự nghiêm ngặt của quy chế thi: Trắc nghiệm nhiều lựa chọn -> Đúng/Sai -> Trả lời ngắn
    const orderedQuestions = [...shuffledMcqs, ...shuffledTrueFalses, ...shuffledShortAnswers];
    
    // Tráo các phương án lựa chọn đối với các câu hỏi MCQ để tăng tính bảo mật chống gian lận!
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
    setTimeRemaining(exam.timeLimit);
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

  // Click nhập điền đáp số ngắn
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

    // Helper kiểm tra chính xác đáp án học sinh có đúng không (chống lệch index do đảo đề/đáp án)
    const isQuestionCorrect = (qId) => {
      const q = activeExam.questions.find(item => item.id === qId);
      if (!q) return true; // Nếu câu hỏi không nằm trong đề thi lần này coi như đã qua
      const answer = userAnswers[qId];
      if (answer === undefined) return false;
      
      if (q.type === 'mcq') {
        return answer === q.correctAnswer;
      } else if (q.type === 'short_answer') {
        return parseFloat(answer) === q.correctShortAnswer;
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

    activeExam.questions.forEach((q) => {
      if (isQuestionCorrect(q.id)) {
        calculatedCorrect++;
      }
    });

    const score = parseFloat(((calculatedCorrect / totalQuestions) * 10).toFixed(1));
    setCorrectCount(calculatedCorrect);
    setFinalScore(score);

    // AI Phân tích yếu điểm học tập dựa trên kết quả sai một cách động
    const weakPoints = [];
    activeExam.questions.forEach((q) => {
      if (!isQuestionCorrect(q.id) && q.topic) {
        weakPoints.push(q.topic);
      }
    });
    const uniqueWeakPoints = Array.from(new Set(weakPoints)).slice(0, 4);

    // Cộng ELO/EXP vinh danh nếu điểm cao (score >= 5.0)
    let eloGained = 0;
    let expGained = 0;
    if (score >= 8.0) {
      eloGained = 30;
      expGained = 200;
    } else if (score >= 5.0) {
      eloGained = 15;
      expGained = 100;
    } else {
      eloGained = -10; // Trừ nhẹ ELO nếu thi trượt dưới trung bình
      expGained = 20;
    }

    const oldElo = personalization.elo || 0;
    const newElo = Math.max(0, oldElo + eloGained);
    const oldRank = getRankInfo(oldElo);
    const newRank = getRankInfo(newElo);
    const isRankUp = newElo > oldElo && newRank.title !== oldRank.title;

    // Cập nhật lên Zustand toàn cục
    updateStats({
      elo: newElo,
      exp: (personalization.exp || 0) + expGained,
      wins: score >= 5.0 ? (personalization.wins || 0) + 1 : (personalization.wins || 0),
      losses: score < 5.0 ? (personalization.losses || 0) + 1 : (personalization.losses || 0)
    });

    setAiReviewData({
      weakPoints: uniqueWeakPoints.length > 0 ? uniqueWeakPoints : ['Tuyệt vời! Bạn không bị hổng kiến thức nào trong chương này.'],
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

  // Hàm phát nhạc vinh danh lên hạng đỉnh cao
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
      
      // Epic arpeggio victory chord
      playNote(261.63, now, 0.4, 'triangle', 0.08);        // C4
      playNote(329.63, now + 0.1, 0.4, 'triangle', 0.08);  // E4
      playNote(392.00, now + 0.2, 0.4, 'triangle', 0.08);  // G4
      playNote(523.25, now + 0.3, 0.6, 'sine', 0.06);      // C5
      playNote(659.25, now + 0.4, 0.6, 'sine', 0.06);      // E5
      playNote(783.99, now + 0.5, 0.6, 'sine', 0.06);      // G5
      playNote(1046.50, now + 0.6, 1.2, 'sine', 0.04);     // C6
      playNote(1318.51, now + 0.7, 1.5, 'sine', 0.03);     // E6
    } catch (err) {
      console.warn("Lỗi phát nhạc vinh danh:", err);
    }
  };

  // Hàm chụp màn hình kết quả thi và chia sẻ lên Story
  const handleShareExamResult = async () => {
    playSound.success();
    const element = document.getElementById('exam-result-card');
    if (!element) return;
    
    try {
      // Đóng popup trước khi chụp để không bị đè hình nếu đang mở popup
      setShowPointsPopup(false);
      
      const captureTarget = document.body;
      const scrollX = window.scrollX || 0;
      const scrollY = window.scrollY || 0;
      
      const canvas = await html2canvas(captureTarget, {
        useCORS: true,
        backgroundColor: '#131524',
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
        caption: `Tôi vừa hoàn thành xuất sắc đề thi "${activeExam?.title}" với số điểm cực đỉnh ${finalScore}/10! 🚀🧪 Trình độ thăng hoa, cộng thêm +${aiReviewData?.rewards?.elo || 0} ELO!`,
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
        alert('⚠️ Không thể chia sẻ kết quả thi do dung lượng bộ nhớ tạm bị giới hạn. Vui lòng thử lại!');
      }
    } catch (err) {
      console.error("Lỗi chụp ảnh màn hình kết quả:", err);
    }
  };

  // Hàm chụp màn hình khung Thăng hạng và chia sẻ lên Story
  const handleShareRankUp = async () => {
    playSound.success();
    const element = document.getElementById('rank-up-overlay-card');
    if (!element) return;
    
    try {
      const captureTarget = document.body;
      const scrollX = window.scrollX || 0;
      const scrollY = window.scrollY || 0;
      
      const canvas = await html2canvas(captureTarget, {
        useCORS: true,
        backgroundColor: '#131524',
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
        alert('⚠️ Không thể chia sẻ thăng hạng do dung lượng bộ nhớ tạm bị giới hạn. Vui lòng thử lại!');
      }
    } catch (err) {
      console.error("Lỗi chụp ảnh màn hình thăng hạng:", err);
    }
  };

  // Cưỡng chế nộp bài (do gian lận hoặc hết giờ)
  const handleForceSubmit = () => {
    playSound.error();
    submitExam();
  };

  // Định dạng hiển thị thời gian phút:giây
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Khởi tạo Chat AI Tutor giảng bài
  const startAiTutor = (questionText, explanation) => {
    playSound.click();
    setAiChatMessages([
      { role: 'assistant', text: `Chào bạn! Tôi là AI Gia Sư của STEM Lab. Tôi thấy bạn đang thắc mắc về câu hỏi này:\n\n"${questionText.replace(/\\\(|\\\)/g, '')}"\n\nBạn chưa hiểu ở bước giải nào? Hãy hỏi để tôi giảng giải chi tiết nhé!` }
    ]);
    setShowAiTutor(true);
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;
    playSound.click();

    const newMsgs = [...aiChatMessages, { role: 'user', text: chatInput }];
    setAiChatMessages(newMsgs);
    setChatInput('');

    // Giả lập câu trả lời thông minh của AI Tutor
    setTimeout(() => {
      playSound.success();
      setAiChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Tôi hiểu thắc mắc của bạn rồi. Trong công thức tính trên, mấu chốt là phải đổi tất cả đơn vị khối lượng (g sang kg) hoặc thể tích (ml sang lít) về đơn vị đo lường SI tiêu chuẩn trước khi thế số vào căn thức. Bạn hãy làm lại thử xem có ra đáp án chính xác không nhé!' }
      ]);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-6 md:p-8 max-w-5xl mx-auto pb-24 relative overflow-hidden select-none">
      
      {/* Hiệu ứng nền Neon lấp lánh */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-rose-500/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-500/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Loading overlay khi tải đề từ Firestore */}
      {loadingExam && (
        <div className="fixed inset-0 z-[9999] bg-bg-primary/90 backdrop-blur-md flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 border-4 border-accent-pink border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono font-bold text-text-secondary tracking-widest uppercase animate-pulse">
            Đang đồng bộ đề thi thực chiến từ Firestore...
          </span>
        </div>
      )}

      {/* ================== SCREEN 1: LANDING HUB (CHỌN ĐỀ) ================== */}
      {examStatus === 'landing' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          {/* Header Bảng Đề */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Rocket className="w-5 h-5 text-accent-pink animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent-pink">Exam Center</span>
            </div>
            <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Phòng Thi Thực Chiến</h1>
            <p className="text-xs text-text-secondary">Rèn luyện tốc độ phản xạ và kiến thức chuẩn cấu trúc THPT Quốc Gia.</p>
          </div>

          {/* Chọn Môn Học (Tabbar) */}
          <div className="flex flex-wrap gap-2 mb-4 bg-bg-secondary/60 border border-border-theme p-1.5 rounded-2xl w-fit">
            {['physics', 'chemistry', 'math', 'biology'].map((sub) => {
              const labels = { 
                physics: '⚡ Vật Lý Lượng Tử', 
                chemistry: '🧪 Hóa Học Ảo',
                math: '📐 Toán Siêu Cấp',
                biology: '🧬 Sinh Học Tế Bào'
              };
              return (
                <button
                  key={sub}
                  onClick={() => { playSound.click(); setSelectedSubject(sub); }}
                  className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                    selectedSubject === sub 
                      ? 'bg-accent-pink text-white shadow-lg shadow-accent-pink/20' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                  }`}
                >
                  {labels[sub]}
                </button>
              );
            })}
          </div>

          {/* Chọn Phân Loại (Sub-tabbar) */}
          <div className="flex flex-wrap gap-2 mb-4 bg-bg-secondary/40 border border-border-theme p-1 rounded-xl w-fit">
            {[
              { id: 'bo-gddt', label: '🏫 Bộ GD&ĐT & Đề Ôn Tập' },
              { id: 'so-gddt', label: '🗺️ Sở GD&ĐT (Tỉnh/Thành)' },
              { id: 'truong-chuyen', label: '🎓 Trường Chuyên & THPT' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => { playSound.click(); setSelectedCategory(cat.id); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all border ${
                  selectedCategory === cat.id 
                    ? 'bg-accent-pink/10 border-accent-pink/20 text-accent-pink shadow-md' 
                    : 'bg-transparent border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Chọn Cấp Độ Khó (Difficulty selector) */}
          <div className="flex flex-wrap gap-2 mb-8 bg-bg-secondary/40 border border-border-theme p-1 rounded-xl w-fit">
            {[
              { id: 'all', label: '🌟 Tất Cả Cấp Độ' },
              { id: 'easy', label: '🟢 Cơ Bản' },
              { id: 'medium', label: '🟡 Khá' },
              { id: 'hard', label: '🔴 Nâng Cao' }
            ].map((diff) => (
              <button
                key={diff.id}
                onClick={() => { playSound.click(); setSelectedDifficulty(diff.id); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all border ${
                  selectedDifficulty === diff.id 
                    ? 'bg-accent-pink/10 border-accent-pink/20 text-accent-pink shadow-md' 
                    : 'bg-transparent border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                }`}
              >
                {diff.label}
              </button>
            ))}
          </div>

          {/* Bộ lọc nâng cao theo năm học và tỉnh/thành phố */}
          {(availableYears.length > 1 || availableProvinces.length > 1) && (
            <div className="mb-8 p-5 bg-bg-secondary/80 backdrop-blur-md border border-border-theme rounded-3xl flex flex-wrap gap-8 items-center shadow-2xl">
              {availableYears.length > 1 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <Calendar className="w-4 h-4 text-accent-pink" />
                    <span className="text-[11px] font-bold tracking-wide uppercase">Năm Học:</span>
                  </div>
                  <div className="flex gap-1 bg-bg-tertiary p-1 border border-border-theme rounded-2xl">
                    {availableYears.map(yr => (
                      <button
                        key={yr}
                        onClick={() => { playSound.click(); setSelectedYear(yr); }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition-all duration-200 ${
                          String(selectedYear) === String(yr)
                            ? 'bg-accent-pink/20 border border-accent-pink/30 text-accent-pink shadow-inner'
                            : 'bg-transparent border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {availableProvinces.length > 1 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <MapPin className="w-4 h-4 text-accent-purple" />
                    <span className="text-[11px] font-bold tracking-wide uppercase">Tỉnh / Thành phố:</span>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedProvince}
                      onChange={(e) => { playSound.click(); setSelectedProvince(e.target.value); }}
                      className="appearance-none bg-bg-tertiary border border-border-theme hover:bg-bg-secondary rounded-2xl pl-4 pr-10 py-2 text-[10px] font-extrabold text-text-primary outline-none cursor-pointer transition-all duration-200 focus:border-accent-pink/50"
                    >
                      {availableProvinces.map(prov => (
                        <option key={prov} value={prov} className="bg-bg-secondary text-text-primary">
                          {prov}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                      <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== GRID DANH SÁCH ĐỀ THI — PHONG CÁCH HOCMAI ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredExams.map((exam) => {
              // Màu gradient theo môn học - phong cách Dark Neon Semantic
              const subjectTheme = {
                physics: {
                  gradient: 'from-blue-950/70 via-indigo-950/50 to-bg-secondary',
                  glow: 'group-hover:shadow-blue-500/10 hover:border-blue-500/40',
                  badge: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
                  icon: '⚡',
                  accent: 'text-blue-400',
                  bar: 'bg-blue-500'
                },
                chemistry: {
                  gradient: 'from-emerald-950/70 via-teal-950/50 to-bg-secondary',
                  glow: 'group-hover:shadow-emerald-500/10 hover:border-emerald-500/40',
                  badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
                  icon: '🧪',
                  accent: 'text-emerald-400',
                  bar: 'bg-emerald-500'
                },
                math: {
                  gradient: 'from-amber-950/70 via-orange-950/50 to-bg-secondary',
                  glow: 'group-hover:shadow-amber-500/10 hover:border-amber-500/40',
                  badge: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
                  icon: '📐',
                  accent: 'text-amber-400',
                  bar: 'bg-amber-500'
                },
                biology: {
                  gradient: 'from-pink-950/70 via-purple-950/50 to-bg-secondary',
                  glow: 'group-hover:shadow-pink-500/10 hover:border-pink-500/40',
                  badge: 'bg-pink-500/15 border-pink-500/30 text-pink-400',
                  icon: '🧬',
                  accent: 'text-pink-400',
                  bar: 'bg-pink-500'
                }
              };
              const theme = subjectTheme[exam.subject] || subjectTheme.physics;
              const isRandom = exam.type === 'thpt_random';
              const hasInternal = isRandom || (exam.questions?.length > 0);
              const questionCount = isRandom ? '22+' : (exam.questions?.length || 0);
              const timeMins = Math.round((exam.timeLimit || 1800) / 60);

              // Nhãn độ khó
              const diffColors = {
                hard: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
                medium: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
                easy: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              };

              return (
                <div
                  key={exam.id}
                  className={`group relative bg-bg-secondary border border-border-theme rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-xl ${theme.glow} transition-all duration-300 hover:-translate-y-1`}
                >
                  {/* ===== VÙNG ẢNH BÌA / HEADER GRADIENT ===== */}
                  <div className={`relative h-36 bg-gradient-to-br ${theme.gradient} flex flex-col items-center justify-center overflow-hidden shrink-0`}>
                    {/* Texture nền */}
                    <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                      style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)' }}
                    />
                    {/* Icon môn học lớn */}
                    <span className="text-5xl drop-shadow-lg select-none z-10 group-hover:scale-105 transition-transform duration-500">
                      {isRandom ? '🎲' : theme.icon}
                    </span>
                    {/* Badge phân loại */}
                    <span className="mt-2 px-3 py-0.5 bg-black/25 backdrop-blur-sm rounded-full text-[9px] font-black text-white/90 uppercase tracking-wider z-10">
                      {exam.typeLabel || 'Đề thi'}
                    </span>
                    {/* Badge độ khó */}
                    {!isRandom && exam.difficulty && (
                      <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${diffColors[exam.difficulty] || diffColors.easy}`}>
                        {exam.difficultyLabel || 'Cơ bản'}
                      </span>
                    )}
                    {/* Badge năm */}
                    {exam.year && (
                      <span className="absolute top-3 left-3 px-2 py-0.5 bg-black/30 rounded-full text-[8px] font-bold text-white/80">
                        {exam.year}
                      </span>
                    )}
                  </div>

                  {/* ===== THÔNG TIN CHÍNH ===== */}
                  <div className="flex flex-col flex-1 p-4 gap-3">
                    {/* Tiêu đề */}
                    <h3 className="text-[13px] font-black text-text-primary group-hover:text-accent-pink transition-colors leading-snug line-clamp-2">
                      {exam.title}
                    </h3>

                    {/* Info Badges — giống HocMai */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${theme.badge}`}>
                        <BookOpen className="w-2.5 h-2.5" />
                        {questionCount} Câu hỏi
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-full text-[9px] font-bold text-slate-600 dark:text-zinc-400">
                        <Timer className="w-2.5 h-2.5" />
                        {timeMins} Phút
                      </span>
                      {exam.province && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-full text-[9px] font-bold text-slate-600 dark:text-zinc-400">
                          <MapPin className="w-2.5 h-2.5" />
                          {exam.province}
                        </span>
                      )}
                    </div>

                    {/* Mô tả ngắn */}
                    <p className="text-[11px] text-slate-500 dark:text-zinc-500 leading-relaxed line-clamp-2 flex-1">
                      {isRandom
                        ? 'Trộn đề ngẫu nhiên từ toàn bộ kho câu hỏi — mỗi lần thi là một thử thách khác nhau.'
                        : exam.questions?.length > 0
                        ? `Đề thi gồm ${questionCount} câu hỏi (MCQ, Đúng/Sai, Điền số) chuẩn cấu trúc THPT Quốc Gia.`
                        : 'Đề thi nguồn ngoài — bấm để xem trên trang gốc.'}
                    </p>

                    {/* Phần thưởng */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-semibold">Phần thưởng:</span>
                      <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/25 rounded-full text-[9px] font-black text-amber-500">
                        +30 ELO
                      </span>
                      <span className="px-2 py-0.5 bg-pink-500/10 border border-pink-500/25 rounded-full text-[9px] font-black text-pink-500">
                        +200 EXP
                      </span>
                    </div>
                  </div>

                  {/* ===== NÚT HÀNH ĐỘNG (cố định đáy card) ===== */}
                  <div className="px-4 pb-4 shrink-0">
                    {hasInternal ? (
                      <button
                        onClick={() => startExam(exam)}
                        className={`w-full py-2.5 bg-gradient-to-r ${theme.gradient} hover:opacity-90 text-white text-[11px] font-black rounded-xl transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-md`}
                      >
                        {isRandom ? '🎲 Trộn Đề & Vào Thi' : 'Vào Thi Ngay'}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : exam.sourceUrl ? (
                      <a
                        href={exam.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 text-[11px] font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        Xem Đề Gốc <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="w-full py-2.5 bg-slate-100 dark:bg-white/[0.03] text-slate-400 dark:text-zinc-600 text-[11px] font-bold rounded-xl flex items-center justify-center cursor-not-allowed select-none">
                        Chưa có đề
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}


      {/* ================== SCREEN 2: EXAM WORKSPACE (LÀM BÀI) ================== */}
      {examStatus === 'playing' && activeExam && (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-8 screenshot-max-w">
          
          {/* CỘT TRÁI: LƯỚI CÂU HỎI & STATUS */}
          <div className="lg:col-span-1 bg-bg-secondary border border-border-theme p-5 rounded-3xl h-fit shadow-md">
            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" /> Bảng Tiến Trình
            </h3>

            {/* Lưới các câu hỏi chia làm 3 phần */}
            <div className="space-y-4 mb-6">
              {/* Phần I: Trắc nghiệm nhiều lựa chọn */}
              {activeExam.questions.some(q => q.type === 'mcq') && (
                <div>
                  <div className="text-[10px] font-black text-rose-400 mb-2 uppercase tracking-wider">
                    Phần I: Trắc nghiệm
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {activeExam.questions.map((q, index) => {
                      if (q.type !== 'mcq') return null;
                      const isAnswered = userAnswers[q.id] !== undefined;
                      const isFlagged = flaggedQuestions.has(index);
                      const isActive = currentQuestionIndex === index;

                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQuestionIndex(index)}
                          className={`w-9 h-9 rounded-xl text-[11px] font-extrabold transition-all active:scale-90 flex items-center justify-center border ${
                            isActive 
                              ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' 
                              : isFlagged 
                              ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' 
                              : isAnswered 
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                              : 'bg-bg-tertiary border-border-theme text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Phần II: Trắc nghiệm Đúng/Sai */}
              {activeExam.questions.some(q => q.type === 'true_false') && (
                <div>
                  <div className="text-[10px] font-black text-rose-400 mb-2 uppercase tracking-wider">
                    Phần II: Đúng / Sai
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {activeExam.questions.map((q, index) => {
                      if (q.type !== 'true_false') return null;
                      const isAnswered = userAnswers[q.id] !== undefined;
                      const isFlagged = flaggedQuestions.has(index);
                      const isActive = currentQuestionIndex === index;

                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQuestionIndex(index)}
                          className={`w-9 h-9 rounded-xl text-[11px] font-extrabold transition-all active:scale-90 flex items-center justify-center border ${
                            isActive 
                              ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' 
                              : isFlagged 
                              ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' 
                              : isAnswered 
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                              : 'bg-bg-tertiary border-border-theme text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Phần III: Trắc nghiệm trả lời ngắn */}
              {activeExam.questions.some(q => q.type === 'short_answer') && (
                <div>
                  <div className="text-[10px] font-black text-rose-400 mb-2 uppercase tracking-wider">
                    Phần III: Điền số
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {activeExam.questions.map((q, index) => {
                      if (q.type !== 'short_answer') return null;
                      const isAnswered = userAnswers[q.id] !== undefined;
                      const isFlagged = flaggedQuestions.has(index);
                      const isActive = currentQuestionIndex === index;

                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQuestionIndex(index)}
                          className={`w-9 h-9 rounded-xl text-[11px] font-extrabold transition-all active:scale-90 flex items-center justify-center border ${
                            isActive 
                              ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' 
                              : isFlagged 
                              ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' 
                              : isAnswered 
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                              : 'bg-bg-tertiary border-border-theme text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Chú thích màu sắc */}
            <div className="space-y-2 text-[10px] text-text-secondary border-t border-border-theme pt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-rose-500" /> <span>Đang xem</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" /> <span>Đã trả lời</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500/40" /> <span>Cần xem lại</span>
              </div>
            </div>
          </div>

          {/* CỘT GIỮA: NỘI DUNG CÂU HỎI */}
          <div className="lg:col-span-2 screenshot-expand-col bg-bg-secondary border border-border-theme p-6 md:p-8 rounded-3xl min-h-[400px] flex flex-col justify-between shadow-md">
            
            {/* Câu hỏi hiện tại */}
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-theme">
                <span className="text-xs font-black text-rose-400">
                  CÂU HỎI {currentQuestionIndex + 1}/{activeExam.questions.length}
                </span>

                <button 
                  onClick={() => toggleFlag(currentQuestionIndex)}
                  className={`p-2 rounded-xl transition-all active:scale-95 ${
                    flaggedQuestions.has(currentQuestionIndex) 
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                      : 'bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border-theme'
                  }`}
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>

              {/* Đọc đề dạng KaTeX */}
              <div 
                className="text-sm text-text-primary leading-relaxed mb-8 selection:bg-rose-500/30 selection:text-white select-text"
                dangerouslySetInnerHTML={{ __html: formatMathText(activeExam.questions[currentQuestionIndex].text) }}
              />

              {/* Tùy chọn trả lời tùy theo Type */}
              <div className="space-y-3">
                {/* 1. Dạng MCQ */}
                {activeExam.questions[currentQuestionIndex].type === 'mcq' && 
                  activeExam.questions[currentQuestionIndex].options.map((option, optIdx) => {
                    const isSelected = userAnswers[activeExam.questions[currentQuestionIndex].id] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectMcq(activeExam.questions[currentQuestionIndex].id, optIdx)}
                        className={`w-full p-4 rounded-2xl text-left text-xs font-bold transition-all border flex items-center gap-3 ${
                          isSelected 
                            ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-md shadow-rose-500/5' 
                            : 'bg-bg-tertiary border-border-theme text-text-primary hover:bg-bg-tertiary/80'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                          isSelected ? 'border-rose-400 text-rose-400' : 'border-border-theme text-text-secondary'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span dangerouslySetInnerHTML={{ __html: formatMathText(option) }} />
                      </button>
                    );
                  })
                }

                {/* 2. Dạng Điền Đáp Số Ngắn */}
                {activeExam.questions[currentQuestionIndex].type === 'short_answer' && (
                  <div className="flex items-center gap-3">
                    <input 
                      type="number"
                      placeholder="Nhập số đáp án..."
                      value={userAnswers[activeExam.questions[currentQuestionIndex].id] || ''}
                      onChange={(e) => handleShortAnswerChange(activeExam.questions[currentQuestionIndex].id, e.target.value)}
                      className="bg-bg-tertiary text-sm text-text-primary rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-rose-500/50 border border-border-theme transition-all placeholder:text-text-secondary w-48"
                    />
                    <span className="text-xs font-black text-rose-400 uppercase tracking-widest">
                      {activeExam.questions[currentQuestionIndex].suffix}
                    </span>
                  </div>
                )}

                {/* 3. Dạng Đúng/Sai phức hợp */}
                {activeExam.questions[currentQuestionIndex].type === 'true_false' && 
                  activeExam.questions[currentQuestionIndex].statements.map((stmt) => {
                    const answersObj = userAnswers[activeExam.questions[currentQuestionIndex].id] || {};
                    const currentVal = answersObj[stmt.id];

                    return (
                      <div 
                        key={stmt.id}
                        className="p-4 bg-bg-tertiary border border-border-theme rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <span className="text-xs text-text-primary leading-normal" dangerouslySetInnerHTML={{ __html: formatMathText(stmt.text) }} />
                        
                        <div className="flex gap-2 shrink-0">
                          {/* Button Đúng */}
                          <button
                            onClick={() => handleTrueFalseChange(activeExam.questions[currentQuestionIndex].id, stmt.id, true)}
                            className={`px-3 py-1.5 text-[10px] font-black rounded-lg border transition-all ${
                              currentVal === true 
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                                : 'bg-bg-secondary border-border-theme text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            Đúng
                          </button>
                          
                          {/* Button Sai */}
                          <button
                            onClick={() => handleTrueFalseChange(activeExam.questions[currentQuestionIndex].id, stmt.id, false)}
                            className={`px-3 py-1.5 text-[10px] font-black rounded-lg border transition-all ${
                              currentVal === false 
                                ? 'bg-rose-500/10 border-rose-500/40 text-rose-400' 
                                : 'bg-bg-secondary border-border-theme text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            Sai
                          </button>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>

            {/* Điều hướng Trận đấu */}
            <div className="flex justify-between border-t border-border-theme pt-6 mt-8">
              <button
                onClick={() => { playSound.click(); setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1)); }}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 bg-bg-tertiary border border-border-theme text-text-primary hover:opacity-90 text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                Câu trước
              </button>

              <button
                onClick={() => { 
                  playSound.click(); 
                  setCurrentQuestionIndex(Math.min(activeExam.questions.length - 1, currentQuestionIndex + 1)); 
                }}
                disabled={currentQuestionIndex === activeExam.questions.length - 1}
                className="px-4 py-2 bg-bg-tertiary border border-border-theme text-text-primary hover:opacity-90 text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                Câu sau
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: ĐỒNG HỒ & GỬI BÀI */}
          <div className="lg:col-span-1 screenshot-hide bg-bg-secondary border border-border-theme p-6 rounded-3xl flex flex-col items-center justify-between h-fit gap-8 shadow-md">
            <div className="text-center w-full">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary block mb-2">Thời gian còn lại</span>
              
              {/* Vòng tròn đếm ngược Neon sinh động */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full border-4 ${
                  timeRemaining <= 30 ? 'border-rose-500/20 animate-pulse' : 'border-border-theme'
                }`} />
                <div className={`absolute inset-[-4px] rounded-full border-4 border-transparent transition-colors duration-500 ${
                  timeRemaining <= 30 ? 'border-t-rose-500 shadow-[0_0_8px_#ef4444]' : 'border-t-rose-500'
                }`} style={{ transform: 'rotate(45deg)' }} />
                
                <span className={`text-2xl font-black ${timeRemaining <= 30 ? 'text-rose-500' : 'text-text-primary'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>

            {/* Warning Gian lận dạng nhỏ */}
            {cheatAttempts > 0 && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-2 text-rose-400 text-center w-full">
                <AlertTriangle className="w-4 h-4 shrink-0 mx-auto" />
                <span className="text-[9px] font-black uppercase tracking-wider">Lần cảnh cáo rời màn hình: {cheatAttempts}/3</span>
              </div>
            )}

            <button 
              onClick={submitExam}
              className="w-full py-3 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white text-xs font-black rounded-2xl transition-all active:scale-95 shadow-lg shadow-rose-500/15"
            >
              Gửi Bài Thi Lập Tức
            </button>
          </div>
        </div>
      )}

      {/* ================== SCREEN 3: EXAM RESULT (KẾT QUẢ AI) ================== */}
      {examStatus === 'result' && activeExam && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          {/* Header Báo Cáo */}
          <div className="flex items-center gap-3 mb-8">
            <button 
              onClick={() => { playSound.click(); setExamStatus('landing'); }}
              className="p-2 bg-bg-tertiary border border-border-theme rounded-xl text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Thi đấu hoàn tất</span>
              <h1 className="text-2xl font-extrabold text-text-primary">Báo Cáo Quang Phổ Kết Quả</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Cột Trái: Score board & ELO rewards */}
            <div className="lg:col-span-1 space-y-6">
              {/* Score panel */}
              <div id="exam-result-card" className="bg-bg-secondary border border-border-theme p-6 rounded-3xl text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500" />
                
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary block mb-3">Điểm Số Lượng Tử</span>
                
                <h2 className={`text-6xl font-black ${finalScore >= 8.0 ? 'text-emerald-400' : finalScore >= 5.0 ? 'text-amber-400' : 'text-rose-500'}`}>
                  {finalScore}
                </h2>
                
                <p className="text-xs text-text-secondary mt-3 mb-4">
                  Đúng {correctCount} trên tổng {activeExam.questions.length} câu.
                </p>

                {/* Nút chia sẻ nhanh lên Story */}
                <button
                  onClick={handleShareExamResult}
                  className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-[10px] font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/10 border border-white/10"
                >
                  🚀 Chia sẻ chiến tích lên Story
                </button>
              </div>

              {/* ELO Rewards */}
              <div className="bg-bg-secondary border border-border-theme p-6 rounded-3xl shadow-md">
                <h3 className="text-xs font-black text-text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Phần Thưởng Đấu Trường
                </h3>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-bg-tertiary border border-border-theme rounded-2xl p-4">
                    <span className="text-[10px] font-bold text-text-secondary block mb-1">Điểm ELO</span>
                    <span className={`text-lg font-black ${aiReviewData?.rewards.elo >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {aiReviewData?.rewards.elo >= 0 ? `+${aiReviewData.rewards.elo}` : aiReviewData?.rewards.elo} ELO
                    </span>
                  </div>
                  <div className="bg-bg-tertiary border border-border-theme rounded-2xl p-4">
                    <span className="text-[10px] font-bold text-text-secondary block mb-1">Điểm EXP</span>
                    <span className="text-lg font-black text-pink-400">
                      +{aiReviewData?.rewards.exp} EXP
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột Giữa & Phải: AI Spectral review & Solution keys */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* AI review card */}
              <div className="bg-bg-secondary border border-border-theme p-6 rounded-3xl relative overflow-hidden shadow-md">
                {/* Viền neon lấp lánh */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full filter blur-xl pointer-events-none" />
                
                <h3 className="text-xs font-black text-text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 text-pink-400" /> Phân Tích Lỗ Hổng Kiến Thức (AI Insight)
                </h3>

                <div className="mb-4">
                  <span className="text-[10px] font-bold text-text-secondary block mb-2">Chủ đề cần gia cố học thuật:</span>
                  <div className="flex flex-wrap gap-2">
                    {aiReviewData?.weakPoints.map((point, index) => (
                      <span key={index} className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl flex items-center gap-1">
                        ⚠️ {point}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed bg-bg-tertiary border border-border-theme p-4 rounded-2xl">
                  {aiReviewData?.generalAdvice}
                </p>
              </div>

              {/* Đáp án & Solution keys */}
              <div className="bg-bg-secondary border border-border-theme p-6 rounded-3xl shadow-md">
                <h3 className="text-xs font-black text-text-primary uppercase tracking-wider mb-6 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-rose-400" /> Đáp Án & Hướng Dẫn Giải Chi Tiết
                </h3>

                <div className="space-y-6">
                  {activeExam.questions.map((q, idx) => {
                    const isCorrect = userAnswers[q.id] !== undefined && (
                      q.type === 'mcq' ? userAnswers[q.id] === q.correctAnswer :
                      q.type === 'short_answer' ? parseFloat(userAnswers[q.id]) === q.correctShortAnswer :
                      (() => {
                        let ok = true;
                        const subAns = userAnswers[q.id] || {};
                        q.statements.forEach(s => { if (subAns[s.id] !== s.correctValue) ok = false; });
                        return ok;
                      })()
                    );

                    return (
                      <div key={q.id} className="border-b border-border-theme pb-6 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[11px] font-black text-text-secondary">CÂU {idx + 1}</span>
                          {isCorrect ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[8px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Đúng
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-[8px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-0.5">
                              <XCircle className="w-2.5 h-2.5" /> Sai
                            </span>
                          )}
                        </div>

                        {/* Đề câu hỏi */}
                        <p 
                          className="text-xs text-text-primary leading-relaxed mb-3 select-text"
                          dangerouslySetInnerHTML={{ __html: formatMathText(q.text) }}
                        />

                        {/* Đáp án chi tiết */}
                        <div className="bg-bg-tertiary border border-border-theme p-4 rounded-2xl">
                          <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest block mb-1">Lời giải:</span>
                          <p 
                            className="text-[11px] text-text-secondary leading-relaxed select-text"
                            dangerouslySetInnerHTML={{ __html: formatMathText(q.explanation) }}
                          />

                          {/* Nút bấm giảng bài nhanh với AI Tutor */}
                          <button
                            onClick={() => startAiTutor(q.text, q.explanation)}
                            className="mt-3 flex items-center gap-1 text-[9px] font-black text-pink-500 hover:text-pink-600 uppercase tracking-wider transition-colors active:scale-95"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Hỏi Gia Sư AI giảng lại
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </motion.div>
      )}

      {/* ================== GIA SƯ AI MINI DRAWER CHAT ================== */}
      <AnimatePresence>
        {showAiTutor && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 right-6 z-[1000] w-80 bg-bg-secondary border border-accent-pink/30 rounded-3xl shadow-2xl shadow-accent-pink/10 overflow-hidden flex flex-col justify-between"
          >
            {/* Header chat */}
            <div className="p-4 border-b border-border-theme flex items-center justify-between bg-bg-tertiary">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-pink-500 animate-bounce" />
                <span className="text-xs font-black text-text-primary uppercase tracking-wider">STEM AI Gia Sư</span>
              </div>
              
              <button 
                onClick={() => setShowAiTutor(false)}
                className="p-1 hover:bg-bg-secondary rounded-lg text-text-secondary hover:text-text-primary transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Vùng tin nhắn */}
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

            {/* Nhập chat */}
            <div className="p-3 border-t border-border-theme bg-bg-tertiary flex gap-2">
              <input 
                type="text" 
                placeholder="Hỏi thêm bước giải..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatMessage(); }}
                className="flex-1 bg-bg-secondary text-[11px] text-text-primary rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-pink-500/50 border border-border-theme placeholder:text-text-secondary"
              />
              <button 
                onClick={handleSendChatMessage}
                className="p-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl active:scale-95 transition-all"
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
                className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-red-500/20"
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
            className="fixed inset-0 z-[110000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            {/* Confetti Background animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -50, x: Math.random() * 1000 - 500, rotate: 0 }}
                  animate={{ 
                    y: 800, 
                    x: Math.random() * 1000 - 500, 
                    rotate: 360 
                  }}
                  transition={{ 
                    duration: Math.random() * 3 + 2, 
                    repeat: Infinity, 
                    delay: Math.random() * 2 
                  }}
                  className="absolute w-2 h-4 rounded"
                  style={{
                    backgroundColor: ['#fbbf24', '#f43f5e', '#a855f7', '#3b82f6', '#10b981'][i % 5],
                    left: `${Math.random() * 100}%`
                  }}
                />
              ))}
            </div>

            <motion.div 
              initial={{ scale: 0.8, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              id="rank-up-overlay-card"
              className="bg-bg-secondary border-2 border-amber-400 rounded-3xl w-full max-w-sm p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.25)] relative overflow-hidden"
            >
              {/* Golden neon particles effect in card background */}
              <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/10 rounded-full filter blur-[40px] pointer-events-none" />
              
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500" />
              
              <div className="relative w-24 h-24 mx-auto mb-5">
                {/* Rotating sunburst aura */}
                <div className="absolute inset-[-15px] bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.25)_0%,_transparent_70%)] animate-pulse rounded-full pointer-events-none" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-[-6px] rounded-full border-2 border-dashed border-amber-400/50 pointer-events-none"
                />
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
                className="text-[10px] font-black tracking-[0.25em] text-amber-500 uppercase mb-1.5 animate-pulse"
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
                  <span className="text-md font-black text-amber-500 animate-pulse">{animatedElo} ELO</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-text-secondary block uppercase mb-0.5">Phòng Lab Thưởng</span>
                  <span className="text-md font-black text-emerald-400">+{rankUpDetails.rewardElo} ELO</span>
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
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 text-[11px] font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 border border-yellow-300/40"
                >
                  🚀 Chia sẻ vinh danh lên Story
                </button>
                <button
                  onClick={() => { playSound.click(); setShowRankUpModal(false); }}
                  className="w-full py-2 bg-bg-tertiary border border-border-theme text-text-secondary hover:text-text-primary text-[9px] font-bold rounded-xl transition-all active:scale-95"
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

              <h2 className="text-[9px] font-black tracking-widest text-emerald-500 uppercase mb-1">CHIẾN THẮNG PHÒNG LAB!</h2>
              <h1 className="text-lg font-black text-text-primary mb-4">Nhận Điểm Danh Vọng</h1>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-bg-tertiary border border-border-theme rounded-xl p-3">
                  <span className="text-[8px] font-bold text-text-secondary block mb-0.5">Thưởng ELO</span>
                  <span className="text-sm font-black text-emerald-500 animate-pulse">+{animatedElo} ELO</span>
                </div>
                <div className="bg-bg-tertiary border border-border-theme rounded-xl p-3">
                  <span className="text-[8px] font-bold text-text-secondary block mb-0.5">Thưởng EXP</span>
                  <span className="text-sm font-black text-pink-500 animate-pulse">+{animatedExp} EXP</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleShareExamResult}
                  className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-[10px] font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/15 border border-white/10"
                >
                  🚀 Chia sẻ kết quả lên Story
                </button>
                <button
                  onClick={() => { playSound.click(); setShowPointsPopup(false); }}
                  className="w-full py-2 bg-bg-tertiary border border-border-theme text-text-secondary hover:text-text-primary text-[9px] font-bold rounded-xl transition-all active:scale-95"
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
