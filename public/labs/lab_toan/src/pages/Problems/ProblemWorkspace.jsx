import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ArrowLeft, CheckCircle, Lightbulb, Play, Sparkles } from 'lucide-react';
import 'mathlive';

import { fetchProblemById, checkProblemAnswer } from '../../api/problemsApi';
import { apiClient } from '../../api/client';
import App from '../../App'; // Import App components or 3D Canvas
import { Badge } from '../../components/ui/badge';
import useUserStore from '../../store/useUserStore';

export default function ProblemWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  const { gainXP } = useUserStore();
  
  // Lấy chi tiết bài toán
  // Fix I6: Thêm isError để xử lý lỗi fetch bài toán (network error, 404, v.v.)
  const { data: problem, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['problem', id],
    queryFn: () => fetchProblemById(id),
    retry: 1,
  });

  const [explanationText, setExplanationText] = useState('');
  const [finalAnswer, setFinalAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [appReady, setAppReady] = useState(false); // Fix black screen

  const [showMathBuilder, setShowMathBuilder] = useState(false);
  const [mathInput, setMathInput] = useState('');

  // FIX BLACK SCREEN: set started flag trước khi render App
  useEffect(() => {
    localStorage.setItem('spatialmind_started', 'true');
    const t = setTimeout(() => setAppReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleResetCamera = () => {
    window.dispatchEvent(new CustomEvent('spatialmind-reset-view'));
    window.dispatchEvent(new CustomEvent('spatialmind-generate'));
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
      return result; // Trả về { status, feedback, ai_analysis }
    } catch (error) {
      console.warn("Evaluation API failed, using client-side fallback:", error);
      
      const isCorrect = checkProblemAnswer(probId, answer);
      if (isCorrect) {
        return { status: 'AC', feedback: 'Chúc mừng! Đáp án hoàn toàn chính xác (Offline Grader).' };
      } else {
        return { status: 'WA', feedback: 'Đáp số chưa chính xác. Vui lòng tính toán lại.' };
      }
    }
  };

  const handleSubmit = async () => {
    if (!finalAnswer.trim()) {
      showToast('error', 'Vui lòng nhập kết quả cuối cùng trước khi Submit.');
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    const result = await evaluateMathProblem(id, explanationText, finalAnswer);

    if (result.status === 'AC') {
      try {
        let solved = JSON.parse(localStorage.getItem('spatialmind_solved_list') || '[]');
        if (!Array.isArray(solved)) solved = [];
        if (!solved.includes(id)) {
          solved.push(id);
          localStorage.setItem('spatialmind_solved_list', JSON.stringify(solved));
          
          const currentCount = parseInt(localStorage.getItem('spatialmind_solved') || '0', 10);
          localStorage.setItem('spatialmind_solved', String(currentCount + 1));
          
          gainXP(100);
        }
      } catch (e) {
        console.error("Error saving solved problem:", e);
      }

      showToast('success', `Accepted! ${result.feedback}`);
      setTimeout(() => {
        setIsSubmitting(false);
        navigate('/problems'); // Back to problem list after success
      }, 2000);
    } else {
      try {
        let solved = JSON.parse(localStorage.getItem('spatialmind_solved_list') || '[]');
        if (!Array.isArray(solved)) solved = [];
        if (!solved.includes(id)) {
          let attempted = JSON.parse(localStorage.getItem('spatialmind_attempted_list') || '[]');
          if (!Array.isArray(attempted)) attempted = [];
          if (!attempted.includes(id)) {
            attempted.push(id);
            localStorage.setItem('spatialmind_attempted_list', JSON.stringify(attempted));
          }
        }
      } catch (e) {
        console.error("Error saving attempted problem:", e);
      }

      showToast('error', `${result.status === 'PE' ? 'Partial Correct' : 'Wrong Answer'}: ${result.feedback}`);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center font-sans bg-[#0a0a0a] gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <div className="absolute inset-2 rounded-full border border-violet-500/20 border-t-violet-400/60 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
        </div>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">Đang tải đề bài...</p>
      </div>
    );
  }

  // Fix I6: Hiển thị error state rõ ràng thay vì chỉ "Không tìm thấy bài toán!"
  if (isError) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center font-sans bg-[#0a0a0a] gap-4 text-center p-8">
        <div className="text-4xl">❌</div>
        <h2 className="text-xl font-black text-white">Không thể tải bài toán</h2>
        <p className="text-sm text-zinc-500 max-w-sm">{error?.message || 'Bài toán không tồn tại hoặc mất kết nối.'}</p>
        <div className="flex gap-3 mt-2">
          <button onClick={() => refetch()} className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors">
            Thử lại
          </button>
          <button onClick={() => navigate('/problems')} className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors">
            ← Quay về
          </button>
        </div>
      </div>
    );
  }

  if (!problem) {
    return <div className="h-screen w-full flex items-center justify-center font-sans bg-[#0a0a0a] text-white">Không tìm thấy bài toán!</div>;
  }

  return (
    <div className="h-screen w-full font-sans bg-[#0a0a0a] flex flex-col overflow-hidden relative">
      
      {/* Toast Notifications */}
      {toast && (
        <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full flex items-center gap-3 font-bold shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 ${
          toast.type === 'success' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <div className="w-4 h-4 rounded-full bg-red-400 flex items-center justify-center text-black text-[10px]">X</div>}
          {toast.message}
        </div>
      )}

      {/* Header bar nhỏ cho Workspace */}
      <div className="h-14 border-b border-zinc-800 flex items-center px-4 justify-between bg-zinc-900/50 flex-none">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/problems')}
            className="p-1.5 hover:bg-zinc-800 rounded-md text-gray-400 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="font-bold text-sm text-white truncate max-w-[300px]">{problem.title}</span>
          <Badge variant="outline" className={
            problem.difficulty === 'Easy' ? 'text-green-500 border-green-500/20' :
            problem.difficulty === 'Medium' ? 'text-orange-500 border-orange-500/20' :
            'text-red-500 border-red-500/20'
          }>
            {problem.difficulty}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
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
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
            ) : (
              <CheckCircle size={14} />
            )}
            {isSubmitting ? 'Đang chấm...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Split Panels */}
      <PanelGroup direction="horizontal" className="flex-1">
        
        {/* Pane Trái: Học thuật */}
        <Panel defaultSize={40} minSize={30}>
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

              {/* AI Hint Section */}
              <div className="mt-6 p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
                <div className="flex items-center gap-2 text-cyan-500 font-bold mb-2 text-xs uppercase tracking-widest">
                  <Lightbulb size={14} />
                  AI Socratic Hint
                </div>
                <p className="text-xs text-gray-400">
                  Hãy thử vẽ đường cao của khối chóp trước khi tính thể tích. Bạn cần tôi gợi ý thêm về cách xác định chân đường cao không?
                </p>
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
                  placeholder="VD: a^3\sqrt{2}/3"
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono text-sm disabled:opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit();
                  }}
                />
              </div>
            </div>

          </div>
        </Panel>

        <PanelResizeHandle className="w-1.5 bg-zinc-800 hover:bg-cyan-500 transition-colors cursor-col-resize" />

        {/* Right Panel: 3D Workspace */}
        <Panel defaultSize={60}>
          <div className="h-full w-full relative overflow-hidden">
            {/* Guard: chỉ render App khi ready — tránh black screen */}
            {!appReady ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 bg-[#050505]">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                  <div className="absolute inset-2 rounded-full border border-violet-500/20 border-t-violet-400/60 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
                </div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">Khởi tạo không gian 3D...</p>
              </div>
            ) : (
              <App isWorkspaceMode={true} initialProblem={problem} />
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
