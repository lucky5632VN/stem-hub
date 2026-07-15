'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { EXAM_DATABASE } from '@/data/exams';
import { 
  Plus, Edit, Trash2, Search, X, Check, FileText, 
  HelpCircle, Eye, EyeOff, Sparkles, Filter
} from 'lucide-react';
import { playSound } from '@/lib/sound';
import { logAdminAction } from '@/lib/adminLogger';

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
  { regex: /\\left/g, replacement: '' },
  { regex: /\\right/g, replacement: '' },
  { regex: /\\pi/g, replacement: 'π' },
  { regex: /\\lambda/g, replacement: 'λ' },
  { regex: /\\mu/g, replacement: 'μ' },
  { regex: /\\alpha/g, replacement: 'α' },
  { regex: /\\beta/g, replacement: 'β' },
  { regex: /\\gamma/g, replacement: 'γ' },
  { regex: /\\delta/g, replacement: 'δ' },
  { regex: /\\epsilon/g, replacement: 'ε' },
  { regex: /\\varepsilon/g, replacement: 'ε' },
  { regex: /\\varphi/g, replacement: 'φ' },
  { regex: /\\phi/g, replacement: 'φ' },
  { regex: /\\omega/g, replacement: 'ω' },
  { regex: /\\theta/g, replacement: 'θ' },
  { regex: /\\eta/g, replacement: 'η' },
  { regex: /\\rho/g, replacement: 'ρ' },
  { regex: /\\sigma/g, replacement: 'σ' },
  { regex: /\\tau/g, replacement: 'τ' },
  { regex: /\\Delta/g, replacement: 'Δ' },
  { regex: /\\Omega/g, replacement: 'Ω' },
  { regex: /\^\\circ/g, replacement: '°' },
  { regex: /\\circ/g, replacement: '°' },
  { regex: /\\degree/g, replacement: '°' },
  { regex: /\\rightarrow/g, replacement: ' ➔ ' },
  { regex: /\\Rightarrow/g, replacement: ' ➔ ' },
  { regex: /\\to/g, replacement: ' ➔ ' },
  { regex: /\\Leftrightarrow/g, replacement: ' ⇔ ' },
  { regex: /\\times/g, replacement: ' × ' },
  { regex: /\\approx/g, replacement: ' ≈ ' },
  { regex: /\\cdot/g, replacement: ' · ' },
  { regex: /\\pm/g, replacement: '±' },
  { regex: /\\neq/g, replacement: '≠' },
  { regex: /\\infty/g, replacement: '∞' },
  { regex: /\\cup/g, replacement: ' ∪ ' },
  { regex: /\\le/g, replacement: '≤' },
  { regex: /\\ge/g, replacement: '≥' },
  { regex: /\\leq/g, replacement: '≤' },
  { regex: /\\geq/g, replacement: '≥' },
  { regex: /\\perp/g, replacement: '⊥' },
  { regex: /\\parallel/g, replacement: '∥' },
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
  
  // 1b. Inject referrerpolicy="no-referrer" và URL-encode cho thẻ img
  formatted = formatted.replace(/#colorend/g, ''); // dọn dẹp các thẻ màu cũ nếu có
  formatted = formatted.replace(/<img\s+([^>]*?)src="([^"]+?)"([^>]*?)>/gi, (match, before, src, after) => {
    return `<img referrerpolicy="no-referrer" ${before}src="${encodeURI(src.trim())}"${after}>`;
  });

  // 1c. Xử lý phân số \frac{A}{B} hoặc \dfrac{A}{B} thành HTML phân số chồng tuyệt đẹp
  while (formatted.includes('\\frac{') || formatted.includes('\\dfrac{')) {
    const isDfrac = formatted.includes('\\dfrac{');
    const startToken = isDfrac ? '\\dfrac{' : '\\frac{';
    const startIdx = formatted.indexOf(startToken);
    
    let depth = 0;
    let midIdx = -1;
    for (let i = startIdx + startToken.length; i < formatted.length; i++) {
      if (formatted[i] === '{') depth++;
      else if (formatted[i] === '}') {
        if (depth === 0) {
          midIdx = i;
          break;
        }
        depth--;
      }
    }
    
    if (midIdx === -1) break;
    const numerator = formatted.slice(startIdx + startToken.length, midIdx);
    
    if (formatted[midIdx + 1] !== '{') break;
    let endIdx = -1;
    depth = 0;
    for (let i = midIdx + 2; i < formatted.length; i++) {
      if (formatted[i] === '{') depth++;
      else if (formatted[i] === '}') {
        if (depth === 0) {
          endIdx = i;
          break;
        }
        depth--;
      }
    }
    
    if (endIdx === -1) break;
    const denominator = formatted.slice(midIdx + 2, endIdx);
    
    const replacement = `<span class="inline-flex flex-col items-center align-middle mx-1" style="font-size: 0.85em; line-height: 1.15;"><span class="border-b border-zinc-400 pb-0.5 px-0.5 text-center w-full">${numerator}</span><span class="pt-0.5 px-0.5 text-center w-full">${denominator}</span></span>`;
    formatted = formatted.slice(0, startIdx) + replacement + formatted.slice(endIdx + 1);
  }

  // 1d. Xử lý hệ phương trình \begin{cases} ... \end{cases}
  while (formatted.includes('\\begin{cases}')) {
    const startIdx = formatted.indexOf('\\begin{cases}');
    const endIdx = formatted.indexOf('\\end{cases}', startIdx);
    if (endIdx === -1) break;
    
    const content = formatted.slice(startIdx + 13, endIdx);
    const rawLines = content.split(/\\\\+|\\cr/g);
    const lines = rawLines
      .map(line => line.trim().replace(/&/g, '&nbsp;&nbsp;&nbsp;&nbsp;'))
      .filter(line => line.length > 0);
      
    const htmlLines = lines.map(line => `<span class="block">${line}</span>`).join('');
    
    const bracketSize = lines.length <= 2 ? '1.8em' : (lines.length === 3 ? '2.4em' : '3.2em');
    const scaleY = lines.length <= 2 ? '1.2' : (lines.length === 3 ? '1.45' : '1.7');
    
    const replacement = `<span class="inline-flex items-center align-middle mx-1"><span style="font-size: ${bracketSize}; font-weight: 100; line-height: 0.8; margin-right: 0.1em; font-family: sans-serif; opacity: 0.85; user-select: none; transform: scaleY(${scaleY}); transform-origin: center; display: inline-block;">{</span><span class="inline-flex flex-col text-left justify-center font-mono" style="font-size: 0.9em; line-height: 1.45;">${htmlLines}</span></span>`;
    
    formatted = formatted.slice(0, startIdx) + replacement + formatted.slice(endIdx + 11);
  }

  // 1e. Xử lý các khối aligned \begin{aligned} ... \end{aligned}
  while (formatted.includes('\\begin{aligned}')) {
    const startIdx = formatted.indexOf('\\begin{aligned}');
    const endIdx = formatted.indexOf('\\end{aligned}', startIdx);
    if (endIdx === -1) break;
    
    const content = formatted.slice(startIdx + 15, endIdx);
    const rawLines = content.split(/\\\\+|\\cr/g);
    const lines = rawLines
      .map(line => line.trim().replace(/&/g, '&nbsp;&nbsp;'))
      .filter(line => line.length > 0);
      
    const htmlLines = lines.map(line => `<span class="block">${line}</span>`).join('');
    const replacement = `<span class="inline-flex flex-col text-left justify-center mx-1 font-mono" style="font-size: 0.9em; line-height: 1.45;">${htmlLines}</span>`;
    
    formatted = formatted.slice(0, startIdx) + replacement + formatted.slice(endIdx + 13);
  }

  // 2. Chạy dịch kí tự đặc biệt trước
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

  // 6. Xử lý căn thức \sqrt{x} -> √(x)
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
    if (endIdx === -1) break;
    const content = formatted.slice(startIdx + 6, endIdx);
    formatted = formatted.slice(0, startIdx) + `√(${content})` + formatted.slice(endIdx + 1);
  }

  // 7. Khôi phục lại khối lim_{...} đã được bảo vệ
  formatted = formatted.replace(/@@@LIMSTART@@@(.*?)@@@LIMEND@@?/g, (match, limitContent) => {
    return `<span class="inline-flex flex-col items-center align-middle mx-1" style="line-height: 0.9;"><span style="font-size: 13px; font-weight: 600; color: #e4e4e7;">lim</span><span style="font-size: 9px; color: #a1a1aa; user-select: none; margin-top: -0.1em;">${limitContent}</span></span>`;
  });

  // 7b. Dọn dẹp trùng lặp từ "vectơ vectơ"
  formatted = formatted.replace(/(vectơ\s+)+/gi, 'vectơ ');

  return formatted;
};

export default function QuestionManagement() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  
  // Form Values
  const [formValues, setFormValues] = useState({
    text: '',
    choiceA: '',
    choiceB: '',
    choiceC: '',
    choiceD: '',
    correct: 0,
    subject: 'math',
    difficulty: 'medium',
    status: 'public',
    explanation: ''
  });

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'questions'));
      const qList = [];
      querySnapshot.forEach((docSnap) => {
        qList.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      
      // Sắp xếp theo ngày tạo mới nhất
      qList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setQuestions(qList);
    } catch (err) {
      console.error("Lỗi khi tải danh sách câu hỏi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Nạp 80 câu hỏi mẫu từ EXAM_DATABASE vào Firestore (20 câu mỗi môn)
  const handleSeedQuestions = async () => {
    playSound.click();
    if (confirm("Hệ thống sẽ nạp 80 câu hỏi trắc nghiệm chuẩn từ cơ sở dữ liệu mẫu THPT (20 câu mỗi môn: Toán, Lý, Hóa, Sinh) vào Firestore. Các câu hỏi hiện tại sẽ được giữ nguyên. Bạn muốn tiếp tục?")) {
      try {
        setSeeding(true);
        const batch = writeBatch(db);
        let countTotal = 0;
        const subjects = ['math', 'physics', 'chemistry', 'biology'];

        for (const sub of subjects) {
          let countSub = 0;
          for (const exam of EXAM_DATABASE) {
            if (exam.subject !== sub || !exam.questions) continue;
            for (const q of exam.questions) {
              if (q.type === 'mcq' && q.options && q.options.length === 4) {
                const newDocRef = doc(collection(db, 'questions'));
                batch.set(newDocRef, {
                  text: q.text.trim(),
                  choices: q.options,
                  correct: q.correctAnswer !== undefined ? q.correctAnswer : 0,
                  subject: sub,
                  difficulty: 'medium',
                  status: 'public',
                  explanation: q.explanation || '',
                  createdAt: new Date().toISOString()
                });
                countSub++;
                countTotal++;
                
                if (countSub >= 20) break;
              }
            }
            if (countSub >= 20) break;
          }
        }

        await batch.commit();
        playSound.success();
        await logAdminAction("SEED_QUESTIONS", "all", "Nạp câu hỏi mẫu", `Nạp thành công ${countTotal} câu hỏi mẫu vào Firestore`);
        alert(`Nạp thành công ${countTotal} câu hỏi mẫu (20 câu/môn: Toán, Lý, Hóa, Sinh) vào Firestore!`);
        fetchQuestions();
      } catch (err) {
        console.error("Lỗi khi nạp câu hỏi mẫu:", err);
        alert("Đã xảy ra lỗi khi nạp câu hỏi mẫu.");
      } finally {
        setSeeding(false);
      }
    }
  };

  // Mở modal Thêm câu hỏi
  const handleOpenAdd = () => {
    playSound.click();
    setEditingQuestion(null);
    setFormValues({
      text: '',
      choiceA: '',
      choiceB: '',
      choiceC: '',
      choiceD: '',
      correct: 0,
      subject: 'math',
      difficulty: 'medium',
      status: 'public',
      explanation: ''
    });
    setIsModalOpen(true);
  };

  // Mở modal Sửa câu hỏi
  const handleOpenEdit = (q) => {
    playSound.click();
    setEditingQuestion(q);
    setFormValues({
      text: q.text || '',
      choiceA: q.choices?.[0] || '',
      choiceB: q.choices?.[1] || '',
      choiceC: q.choices?.[2] || '',
      choiceD: q.choices?.[3] || '',
      correct: q.correct !== undefined ? q.correct : 0,
      subject: q.subject || 'math',
      difficulty: q.difficulty || 'medium',
      status: q.status || 'public',
      explanation: q.explanation || ''
    });
    setIsModalOpen(true);
  };

  // Lưu câu hỏi (Add hoặc Update)
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    playSound.click();

    const { text, choiceA, choiceB, choiceC, choiceD, correct, subject, difficulty, status, explanation } = formValues;

    if (!text.trim() || !choiceA.trim() || !choiceB.trim() || !choiceC.trim() || !choiceD.trim()) {
      alert("Vui lòng nhập đầy đủ nội dung câu hỏi và 4 đáp án.");
      return;
    }

    const payload = {
      text: text.trim(),
      choices: [choiceA.trim(), choiceB.trim(), choiceC.trim(), choiceD.trim()],
      correct: Number(correct),
      subject,
      difficulty,
      status,
      explanation: explanation.trim(),
      updatedAt: new Date().toISOString()
    };

    try {
      setLoading(true);
      if (editingQuestion) {
        // Cập nhật câu hỏi
        const qRef = doc(db, 'questions', editingQuestion.id);
        await updateDoc(qRef, payload);
        await logAdminAction("UPDATE_QUESTION", editingQuestion.id, payload.text, "Cập nhật nội dung câu hỏi");
        playSound.success();
        
        setQuestions(prev => prev.map(item => item.id === editingQuestion.id ? { ...item, ...payload } : item));
      } else {
        // Thêm câu hỏi mới
        payload.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, 'questions'), payload);
        await logAdminAction("ADD_QUESTION", docRef.id, payload.text, "Thêm câu hỏi mới");
        playSound.success();
        
        setQuestions(prev => [{ id: docRef.id, ...payload }, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Lỗi khi lưu câu hỏi:", err);
    } finally {
      setLoading(false);
    }
  };

  // Xóa câu hỏi
  const handleDeleteQuestion = async (id) => {
    playSound.click();
    const q = questions.find(item => item.id === id);
    const qText = q ? q.text : '';
    if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn câu hỏi này khỏi ngân hàng câu hỏi không?")) {
      try {
        setLoading(true);
        await deleteDoc(doc(db, 'questions', id));
        await logAdminAction("DELETE_QUESTION", id, qText, "Xóa câu hỏi vĩnh viễn");
        setQuestions(prev => prev.filter(item => item.id !== id));
        playSound.success();
      } catch (err) {
        console.error("Lỗi khi xóa câu hỏi:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Toggle trạng thái Công khai / Nháp nhanh
  const handleToggleStatus = async (q) => {
    playSound.click();
    const nextStatus = q.status === 'public' ? 'draft' : 'public';
    try {
      const qRef = doc(db, 'questions', q.id);
      await updateDoc(qRef, { status: nextStatus });
      await logAdminAction("UPDATE_QUESTION", q.id, q.text || '', `Đổi trạng thái câu hỏi thành: ${nextStatus === 'public' ? 'Công khai' : 'Nháp'}`);
      setQuestions(prev => prev.map(item => item.id === q.id ? { ...item, status: nextStatus } : item));
      playSound.success();
    } catch (err) {
      console.error("Lỗi khi đổi trạng thái câu hỏi:", err);
    }
  };

  // Lọc dữ liệu hiển thị
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = (q.text || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || q.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const getSubjectLabel = (subj) => {
    const subjects = {
      math: { label: 'Toán học', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      physics: { label: 'Vật lý', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
      chemistry: { label: 'Hóa học', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
      biology: { label: 'Sinh học', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
    };
    return subjects[subj] || { label: 'Khác', color: 'bg-zinc-800 text-zinc-400' };
  };

  const getDifficultyLabel = (diff) => {
    const difficulties = {
      easy: { label: 'Dễ', color: 'text-emerald-450 bg-emerald-500/5 border border-emerald-500/10' },
      medium: { label: 'Trung bình', color: 'text-amber-400 bg-amber-500/5 border border-amber-500/10' },
      hard: { label: 'Khó', color: 'text-rose-450 bg-rose-500/5 border border-rose-500/10' }
    };
    return difficulties[diff] || { label: 'Mặc định', color: 'text-zinc-400' };
  };

  return (
    <div className="space-y-6 text-zinc-300 font-sans select-none">
      {/* Title & Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider font-mono">
            Ngân hàng câu hỏi
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Quản lý câu hỏi trắc nghiệm cho phòng đấu PvP và các phòng luyện tập.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Seed questions button - always available */}
          {!loading && (
            <button
              onClick={handleSeedQuestions}
              disabled={seeding}
              className="px-4.5 py-2.5 bg-gradient-to-r from-purple-600/10 to-pink-600/10 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/20 hover:border-pink-500/40 text-xs font-bold text-white rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-yellow-400" /> 
              {seeding ? 'Đang nạp...' : 'Nạp câu hỏi mẫu (80 câu)'}
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="px-4.5 py-2.5 bg-pink-500 hover:bg-pink-600 border border-pink-500/30 hover:border-pink-400 text-xs font-bold text-white rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Thêm câu hỏi
          </button>
        </div>
      </div>

      {/* Search and Tab filter area */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-[#0f1017]/60 border border-[#1f2235] p-4 rounded-2xl shadow-lg">
        {/* Search */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Tìm kiếm nội dung câu hỏi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white focus:outline-none placeholder-zinc-500 transition-all font-mono"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'math', label: 'Toán học' },
            { id: 'physics', label: 'Vật lý' },
            { id: 'chemistry', label: 'Hóa học' },
            { id: 'biology', label: 'Sinh học' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                playSound.click();
                setSelectedSubject(tab.id);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                selectedSubject === tab.id
                  ? 'bg-pink-500/10 border-pink-500/30 text-white shadow-md'
                  : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 bg-[#0f1017]/60 border border-[#1f2235] rounded-2xl flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono font-bold text-zinc-550 tracking-widest uppercase animate-pulse">
              Đang tải danh sách câu hỏi...
            </span>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="py-20 bg-[#0f1017]/60 border border-[#1f2235] rounded-2xl text-center flex flex-col items-center justify-center gap-3">
            <HelpCircle className="w-12 h-12 text-zinc-650" />
            <span className="text-xs font-bold text-zinc-550 uppercase font-mono">
              Chưa có câu hỏi nào trong mục này
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredQuestions.map((q, idx) => {
              const subj = getSubjectLabel(q.subject);
              const diff = getDifficultyLabel(q.difficulty);

              return (
                <div 
                  key={q.id}
                  className="bg-[#0f1017]/60 border border-[#1f2235] hover:border-pink-500/10 p-5 rounded-2xl transition-all duration-200 group relative flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
                >
                  <div className="space-y-3 flex-1">
                    {/* Header: Subject & Difficulty tags */}
                    <div className="flex items-center gap-2 flex-wrap text-[9px] font-black uppercase tracking-wider font-mono">
                      <span className="text-zinc-500">#{idx + 1}</span>
                      <span className={`px-2 py-0.5 rounded border ${subj.color}`}>{subj.label}</span>
                      <span className={`px-2 py-0.5 rounded ${diff.color}`}>{diff.label}</span>
                      
                      {/* Status Tag */}
                      {q.status === 'draft' ? (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">Bản nháp</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">Công khai</span>
                      )}
                    </div>

                    {/* Question Content */}
                    <div 
                      className="text-white text-sm font-bold font-mono leading-relaxed q-content-math"
                      dangerouslySetInnerHTML={{ __html: formatMathText(q.text) }}
                    />

                    {/* Choices Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-zinc-400">
                      {q.choices?.map((choice, cIdx) => (
                        <div 
                          key={cIdx} 
                          className={`flex items-start gap-2 p-2 rounded-lg border ${
                            q.correct === cIdx 
                              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 font-bold' 
                              : 'bg-[#08090d]/60 border-zinc-800/40'
                          }`}
                        >
                          <span className="text-zinc-500 uppercase font-black">{String.fromCharCode(65 + cIdx)}.</span>
                          <span dangerouslySetInnerHTML={{ __html: formatMathText(choice) }} />
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="text-[10px] text-zinc-500 italic mt-1 font-mono leading-relaxed flex gap-1 items-start">
                        <span className="shrink-0">* Giải thích:</span>
                        <span dangerouslySetInnerHTML={{ __html: formatMathText(q.explanation) }} />
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center md:flex-col justify-end gap-2 shrink-0 border-t md:border-t-0 border-[#1f2235]/40 pt-3 md:pt-0">
                    {/* Toggle status */}
                    <button
                      onClick={() => handleToggleStatus(q)}
                      title={q.status === 'public' ? "Chuyển thành Nháp" : "Chuyển thành Công khai"}
                      className={`p-2 border rounded-xl transition-all cursor-pointer active:scale-90 flex items-center justify-center ${
                        q.status === 'public'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {q.status === 'public' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(q)}
                      title="Sửa nội dung"
                      className="p-2 bg-[#141622] hover:bg-[#1b1e30] border border-[#1f2235] text-zinc-350 hover:text-white rounded-xl transition-all cursor-pointer active:scale-90"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      title="Xóa câu hỏi"
                      className="p-2 bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-rose-450 hover:text-white rounded-xl transition-all cursor-pointer active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUESTION FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <form 
            onSubmit={handleSaveQuestion}
            className="w-full max-w-xl bg-[#0c0d14] border border-[#1f2235] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[#1f2235] flex items-center justify-between bg-[#0f1017]/80">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-pink-500 filter drop-shadow-[0_0_6px_rgba(244,63,94,0.2)]" />
                <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">
                  {editingQuestion ? 'Cập nhật câu hỏi' : 'Tạo câu hỏi mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm font-semibold">
              
              {/* Subject & Difficulty & Status row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Chuyên môn</label>
                  <select
                    value={formValues.subject}
                    onChange={(e) => setFormValues(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-[#08090d] border border-[#1f2235] rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50"
                  >
                    <option value="math">Toán học</option>
                    <option value="physics">Vật lý</option>
                    <option value="chemistry">Hóa học</option>
                    <option value="biology">Sinh học</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Độ khó</label>
                  <select
                    value={formValues.difficulty}
                    onChange={(e) => setFormValues(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full bg-[#08090d] border border-[#1f2235] rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50"
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Trạng thái</label>
                  <select
                    value={formValues.status}
                    onChange={(e) => setFormValues(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-[#08090d] border border-[#1f2235] rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50"
                  >
                    <option value="public">Công khai</option>
                    <option value="draft">Bản nháp</option>
                  </select>
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Nội dung câu hỏi</label>
                <textarea
                  rows="3"
                  value={formValues.text}
                  onChange={(e) => setFormValues(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Nhập đề bài câu hỏi..."
                  className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none placeholder-zinc-700 transition-all font-mono"
                />
              </div>

              {/* 4 Choices */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Các phương án trả lời</label>
                
                {[
                  { key: 'choiceA', label: 'Đáp án A' },
                  { key: 'choiceB', label: 'Đáp án B' },
                  { key: 'choiceC', label: 'Đáp án C' },
                  { key: 'choiceD', label: 'Đáp án D' },
                ].map((item, idx) => (
                  <div key={item.key} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correctChoice"
                      checked={formValues.correct === idx}
                      onChange={() => setFormValues(prev => ({ ...prev, correct: idx }))}
                      className="w-4 h-4 text-pink-500 accent-pink-500 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formValues[item.key]}
                      onChange={(e) => setFormValues(prev => ({ ...prev, [item.key]: e.target.value }))}
                      placeholder={`Nội dung ${item.label}...`}
                      className="flex-1 bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none placeholder-zinc-700 transition-all font-mono"
                    />
                  </div>
                ))}
              </div>

              {/* Explanation Text */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Lời giải chi tiết (Giải thích)</label>
                <textarea
                  rows="2"
                  value={formValues.explanation}
                  onChange={(e) => setFormValues(prev => ({ ...prev, explanation: e.target.value }))}
                  placeholder="Nhập lời giải hoặc kiến thức liên quan..."
                  className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none placeholder-zinc-700 transition-all font-mono"
                />
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="p-6 border-t border-[#1f2235] bg-[#0f1017]/70 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 border border-zinc-700/60"
              >
                Hủy bỏ
              </button>
              
              <button
                type="submit"
                className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-md font-mono uppercase"
              >
                {editingQuestion ? 'Lưu cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
