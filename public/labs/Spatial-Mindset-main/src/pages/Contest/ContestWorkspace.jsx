import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ArrowLeft, CheckCircle, Clock, Play, AlertCircle, Sparkles } from 'lucide-react';
import App from '../../App'; // Re-use 3D Canvas
import useContestStore from '../../store/useContestStore';
import { apiClient } from '../../api/client';
import 'mathlive';

// Mock data for problems
const ALL_PROBLEMS = {
  'weekly-1': [
    { id: '1', title: 'Q1. Góc giữa SC và mặt phẳng (ABCD)', content: 'Cho hình chóp $S.ABCD$ có đáy là hình vuông, $SA \\perp (ABCD)$. Góc giữa đường thẳng $SC$ và mặt phẳng $(ABCD)$ là gì?', correctAnswer: 'SCA', points: 3 },
    { id: '2', title: 'Q2. Tính góc giữa SD và mặt đáy', content: 'Cho hình chóp $S.ABCD$ có đáy là hình vuông cạnh $a$, $SA \\perp (ABCD)$ và $SA = a$. Tính góc giữa $SD$ và mặt đáy $(ABCD)$.', correctAnswer: '45', points: 4 },
    { id: '3', title: 'Q3. Tính góc giữa SC và (ABC)', content: 'Cho hình chóp $S.ABC$ có $SA \\perp (ABC)$, $SA = 2a$. Tam giác $ABC$ vuông tại $B$, $AB = a\\sqrt{3}$ và $BC = a$. Tính góc giữa đường thẳng $SC$ và mặt phẳng $(ABC)$.', correctAnswer: '45', points: 5 },
    { id: '4', title: 'Q4. Góc giữa SB và đáy', content: 'Cho hình chóp $S.ABCD$ có đáy là hình vuông cạnh $a$, $SA \\perp (ABCD)$ và $SB = 2a$. Góc giữa đường thẳng $SB$ và mặt phẳng đáy bằng bao nhiêu độ?', correctAnswer: '60', points: 6 }
  ]
};

const RotateCw = ({ className, size }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

export default function ContestWorkspace() {
  const { contestId, problemId } = useParams();
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  
  // Fix W2: Không fallback cứng sang weekly-1 — hiển thị lỗi nếu contest không tồn tại
  const contestProblems = ALL_PROBLEMS[contestId] || null;
  const problem = contestProblems?.find(p => p.id === problemId) || contestProblems?.[0] || null;

  const [explanationText, setExplanationText] = useState('');
  const [finalAnswer, setFinalAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [appReady, setAppReady] = useState(false); // Fix black screen

  const [showMathBuilder, setShowMathBuilder] = useState(false);
  const [mathInput, setMathInput] = useState('');

  const { activeContestId, timeLeft, isStarted, startContest, decrementTime, addPenalty,
          isEvaluating, setIsEvaluating, setAiResult, submitContestResult } = useContestStore();

  // FIX BLACK SCREEN: Đảm bảo App component không bị block bởi LandingPage
  useEffect(() => {
    // Set flag để App biết đã "started" — tránh LandingPage overlay
    localStorage.setItem('spatialmind_started', 'true');
    // Delay nhỏ để component tree settle trước khi render App
    const readyTimer = setTimeout(() => setAppReady(true), 100);
    return () => clearTimeout(readyTimer);
  }, []);

  // Fix C3: Dùng useRef để tránh timer leak khi navigate giữa các bài trong contest
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isStarted || activeContestId !== contestId) {
      startContest(contestId, 90 * 60);
    }

    // Clear timer cũ nếu có trước khi tạo mới
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      decrementTime();
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [contestId]); // Chỉ depend vào contestId để tránh re-init loop

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const insertMathToTextarea = () => {
    if (!mathInput.trim()) {
      setShowMathBuilder(false);
      return;
    }
    
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = explanationText.substring(0, start);
    const after = explanationText.substring(end);
    
    const latexToInsert = `$${mathInput}$`;
    const newText = before + latexToInsert + after;
    setExplanationText(newText);
    
    setMathInput('');
    setShowMathBuilder(false);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + latexToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };
  const evaluateMathProblem = async (probId, explain, answer) => {
    try {
      const result = await apiClient.post('/api/evaluate-problem', {
        problem_id: probId,
        explanation: explain,
        answer: answer,
        problem_context: problem.content
      });
      return result;
    } catch (error) {
      console.warn("Evaluation API failed, using client-side fallback:", error);
      
      // Client-side fallback: check case-insensitive answer
      const normUserAnswer = answer.replace(/\s+/g, '').toLowerCase().replace(/độ/g, '').replace(/°/g, '');
      const normCorrectAnswer = problem.correctAnswer.replace(/\s+/g, '').toLowerCase().replace(/độ/g, '').replace(/°/g, '');
      
      if (normUserAnswer === normCorrectAnswer) {
        return { 
          status: 'AC', 
          feedback: 'Chúc mừng! Đáp án của bạn hoàn toàn chính xác (Chế độ tự động chấm điểm ngoại tuyến).' 
        };
      } else {
        return { 
          status: 'WA', 
          feedback: 'Đáp số chưa chính xác. Vui lòng kiểm tra lại hình vẽ và các bước chứng minh của bạn.' 
        };
      }
    }
  };

  const handleSubmit = async () => {
    if (!finalAnswer.trim()) {
      showToast('error', 'Vui lòng nhập kết quả cuối cùng trước khi Submit.');
      return;
    }

    setIsSubmitting(true);
    setIsEvaluating(true); // Fix Lỗi 2: Cập nhật trạng thái AI đang chấm
    setToast(null);

    const result = await evaluateMathProblem(problemId, explanationText, finalAnswer);
    setAiResult(result); // Fix Lỗi 2: Lưu kết quả AI vào store
    setIsEvaluating(false);

    if (result.status === 'AC') {
      showToast('success', `Accepted! ${result.feedback}`);
      setTimeout(() => {
        setIsSubmitting(false);
        const nextId = String(parseInt(problemId) + 1);
        const nextProblem = contestProblems.find(p => p.id === nextId);
        if (nextProblem) {
          setExplanationText('');
          setFinalAnswer('');
          navigate(`/contest/${contestId}/workspace/${nextId}`);
        } else {
          // Fix Lỗi 3: Dùng submitContestResult từ store (đã chuẩn hóa dữ liệu)
          submitContestResult(contestId, 100).finally(() => {
            navigate(`/contest/${contestId}/ranking`);
          });
        }
      }, 1500);
    } else {
      showToast('error', `${result.feedback} (+5 phút Penalty)`);
      setIsSubmitting(false);
      addPenalty(300);
    }
  };

  // Fix I2: Keyboard shortcut Ctrl+Enter để submit bài
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isSubmitting && !isEvaluating) handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, isEvaluating, finalAnswer, explanationText]);

  // Reset 3D Camera / Generate geometry by dispatching custom events to App.jsx
  const handleResetCamera = () => {
    window.dispatchEvent(new CustomEvent('spatialmind-generate'));
    window.dispatchEvent(new CustomEvent('spatialmind-reset-view'));
  };

  // Fix W2: Hiển thị lỗi nếu contest không tồn tại thay vì fallback cứng
  if (!contestProblems || !problem) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center font-sans bg-[#0a0a0a] gap-4 text-center p-8">
        <div className="text-4xl">🔍</div>
        <h2 className="text-xl font-black text-white">Không tìm thấy kỳ thi</h2>
        <p className="text-sm text-zinc-500 max-w-sm">Contest <code className="text-cyan-400">{contestId}</code> chưa có dữ liệu hoặc đang được cập nhật. Vui lòng kiểm tra lại URL.</p>
        <button onClick={() => navigate('/contest')} className="mt-4 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors">
          ← Quay về danh sách kỳ thi
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full font-sans bg-[#0a0a0a] flex flex-col overflow-hidden text-gray-300">
      
      {/* Topbar */}
      <div className="h-14 border-b border-zinc-800 flex items-center px-4 justify-between bg-zinc-900 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/contest/${contestId}`)}
            className="p-2 hover:bg-zinc-800 rounded-lg text-gray-500 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="font-bold text-base text-white truncate max-w-[400px]">{problem.title}</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-gray-400 bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700">
            <Clock size={16} className={timeLeft < 300 ? 'text-red-500 animate-pulse' : ''} />
            <span className={`font-mono font-bold text-lg tracking-wider ${timeLeft < 300 ? 'text-red-500' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          <button 
            onClick={handleResetCamera}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors shadow-sm border border-zinc-700"
          >
            <Play size={12} />
            Khởi Tạo / Reset
          </button>
          
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || isEvaluating}
            className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-xl transition-all shadow-sm ${
              isSubmitting || isEvaluating
                ? 'bg-green-500/50 text-white/70 cursor-not-allowed' 
                : 'bg-green-500 text-white hover:bg-green-600 shadow-green-500/20 shadow-lg'
            }`}
          >
            {isEvaluating
              ? <><RotateCw className="animate-spin" size={16} /> AI đang chấm...</>
              : isSubmitting
              ? <><RotateCw className="animate-spin" size={16} /> Đang xử lý...</>
              : <><CheckCircle size={16} /> Submit</>
            }
          </button>
        </div>
      </div>

      {/* Main Workspace Split */}
      <div className="flex-1 relative">
        {toast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-top-4">
            <div className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold shadow-xl border ${
              toast.type === 'success' 
                ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}>
              {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              {toast.message}
            </div>
          </div>
        )}

        <PanelGroup direction="horizontal">
          
          {/* Pane Trái: Học thuật */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col bg-[#0a0a0a] border-r border-zinc-800">
              
              {/* Khu vực 1: Đề bài */}
              <div className="flex-none p-6 border-b border-zinc-800 bg-zinc-900/30 max-h-[40%] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={14} className="text-cyan-400" /> Đề Bài
                  </h3>
                </div>
                <div className="prose prose-sm prose-invert max-w-none text-gray-300 leading-relaxed text-[15px]">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {problem.content}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Khu vực 2: Phần Trình Bày */}
              <div className="flex-1 flex flex-col min-h-0 bg-zinc-900/10">
                <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between flex-none">
                  <h3 className="text-sm font-bold text-gray-300">Phần Trình bày</h3>
                  <button 
                    onClick={() => {
                      if (!showMathBuilder) {
                        setShowMathBuilder(true);
                        setTimeout(() => {
                           if (window.mathVirtualKeyboard) window.mathVirtualKeyboard.show();
                        }, 100);
                      } else {
                        setShowMathBuilder(false);
                        if (window.mathVirtualKeyboard) window.mathVirtualKeyboard.hide();
                      }
                    }}
                    className={`text-[10px] font-black uppercase tracking-widest transition-colors px-3 py-1.5 rounded-md border ${
                      showMathBuilder 
                        ? 'bg-zinc-800 text-gray-400 border-zinc-700 hover:text-white' 
                        : 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20 hover:text-cyan-400'
                    }`}
                  >
                    {showMathBuilder ? 'Đóng bộ gõ' : 'Chèn công thức Toán'}
                  </button>
                </div>

                {showMathBuilder && (
                  <div className="flex-none p-4 border-b border-zinc-800 bg-[#050505] flex flex-col gap-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={12}/> Trình soạn công thức
                      </label>
                      <button
                        onClick={insertMathToTextarea}
                        className="text-[10px] font-black uppercase tracking-widest text-white bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 rounded-md transition-all shadow-lg shadow-cyan-500/20"
                      >
                        Chèn vào bài làm
                      </button>
                    </div>
                    <div className="bg-zinc-900 rounded-xl border border-zinc-700 overflow-hidden focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all">
                      <math-field
                        value={mathInput}
                        onInput={(e) => setMathInput(e.target.value)}
                        style={{ 
                          width: '100%', 
                          minHeight: '60px',
                          background: 'transparent', 
                          color: '#22d3ee', 
                          border: 'none', 
                          outline: 'none',
                          fontSize: '20px',
                          padding: '12px 16px'
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex-1 p-6 overflow-hidden bg-zinc-900/20">
                  <textarea
                    ref={textareaRef}
                    value={explanationText}
                    onChange={(e) => setExplanationText(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Nhập phần trình bày bằng văn bản bình thường (VD: Ta có tam giác vuông ABC...). Khi cần chèn toán, hãy nhấn nút 'Chèn công thức Toán' ở trên..."
                    className="w-full h-full bg-transparent border-none resize-none focus:outline-none text-[15px] text-gray-300 placeholder:text-zinc-600 custom-scrollbar leading-relaxed font-sans"
                  />
                </div>
              </div>

              {/* Khu vực 3: Kết quả cuối cùng */}
              <div className="flex-none p-6 border-t border-zinc-800 bg-zinc-900/50">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Kết quả cuối cùng <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-cyan-500 font-mono font-bold">$</span>
                  </div>
                  <input
                    type="text"
                    value={finalAnswer}
                    onChange={(e) => setFinalAnswer(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Ví dụ: a^3\sqrt{2}/3"
                    className="w-full bg-[#050505] border border-zinc-700 group-hover:border-zinc-600 rounded-xl py-4 pl-9 pr-4 text-white font-mono text-base focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

            </div>
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-zinc-900 hover:bg-zinc-700 active:bg-cyan-500/50 transition-colors cursor-col-resize flex flex-col justify-center items-center">
            <div className="w-0.5 h-8 bg-zinc-700 rounded-full" />
          </PanelResizeHandle>

          {/* Pane Phải: Trực quan 3D */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full w-full relative bg-[#050505] flex flex-col">
              <div className="flex-1 overflow-hidden">
                {/* Guard: chỉ render App khi đã ready để tránh black screen */}
                {!appReady ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                      <div className="absolute inset-2 rounded-full border border-violet-500/20 border-t-violet-400/60 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
                    </div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">
                      Khởi tạo không gian 3D...
                    </p>
                  </div>
                ) : (
                  <App
                    isWorkspaceMode={true}
                    initialProblem={{ title: problem.title, content: problem.content }}
                  />
                )}
              </div>
            </div>
          </Panel>

        </PanelGroup>
      </div>
    </div>
  );
}
