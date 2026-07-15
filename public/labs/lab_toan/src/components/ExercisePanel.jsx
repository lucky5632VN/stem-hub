import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { X, CheckCircle2, AlertCircle, Maximize2, Minimize2, List as ListIcon, Trophy, Award } from 'lucide-react';
import 'katex/dist/katex.min.css';

const preprocessLatex = (text) => {
  if (!text) return "";
  let processed = text.replace(/\\\\/g, "\\");
  return processed;
};

// Hàm trích xuất câu hỏi từ Markdown
const parseExercisesFromMarkdown = (markdown) => {
  const lines = markdown.split('\n');
  const questions = [];
  let currentQuestion = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect new question: "Câu X." or "**Câu X.**"
    const matchCau = line.match(/^\s*(?:\*\*)?Câu\s+(\d+)[.:]\s*(?:\*\*)?(.*)/i);
    if (matchCau) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        id: matchCau[1],
        content: matchCau[2] + '\n',
        options: [],
        selectedAnswer: null,
        isCorrect: null,
      };
      continue;
    }

    if (currentQuestion) {
      // Check if line contains A. B. C. D.
      // E.g: **A.** L = 338. **B.** L = 1/6. **C.** L = 2027. **D.** L = +inf.
      const hasOptions = line.match(/(?:\*\*)?[A-D][.:]\s*(?:\*\*)?/g);
      
      if (hasOptions && hasOptions.length >= 2) {
        // Attempt to parse options on the same line
        const optA = line.match(/(?:\*\*)?A[.:]\s*(?:\*\*)?\s*(.*?)(?=(?:\*\*)?[B-D][.:]|$)/);
        const optB = line.match(/(?:\*\*)?B[.:]\s*(?:\*\*)?\s*(.*?)(?=(?:\*\*)?[C-D][.:]|$)/);
        const optC = line.match(/(?:\*\*)?C[.:]\s*(?:\*\*)?\s*(.*?)(?=(?:\*\*)?D[.:]|$)/);
        const optD = line.match(/(?:\*\*)?D[.:]\s*(?:\*\*)?\s*(.*)/);

        if (optA && optA[1]) currentQuestion.options.push({ label: 'A', text: optA[1].trim() });
        if (optB && optB[1]) currentQuestion.options.push({ label: 'B', text: optB[1].trim() });
        if (optC && optC[1]) currentQuestion.options.push({ label: 'C', text: optC[1].trim() });
        if (optD && optD[1]) currentQuestion.options.push({ label: 'D', text: optD[1].trim() });
      } else {
        const singleOptMatch = line.match(/^\s*(?:\*\*)?([A-D])[.:]\s*(?:\*\*)?\s*(.*)/);
        if (singleOptMatch) {
          currentQuestion.options.push({ label: singleOptMatch[1].toUpperCase(), text: singleOptMatch[2].trim() });
        } else {
          // If no options, append to question content
          if (!line.includes('**Đáp số**') && !line.includes('**Hướng dẫn giải**') && !line.includes('HẾT')) {
            currentQuestion.content += line + '\n';
          }
        }
      }
    }
  }

  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  // Filter out questions that don't have at least 2 options
  return questions.filter(q => q.options.length >= 2);
};

export default function ExercisePanel({ isOpen, onClose, lesson, onXPgain, onSolveExercise }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (isOpen && lesson?.filePath) {
      setLoading(true);
      setSubmitted(false);
      setScore(0);
      fetch(lesson.filePath)
        .then(res => res.text())
        .then(text => {
          const parsedQuestions = parseExercisesFromMarkdown(text);
          setQuestions(parsedQuestions);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading exercises:', err);
          setQuestions([]);
          setLoading(false);
        });
    }
  }, [isOpen, lesson]);

  const handleSelectAnswer = (qIndex, optLabel) => {
    if (submitted) return;
    const updated = [...questions];
    updated[qIndex].selectedAnswer = optLabel;
    setQuestions(updated);
  };

  const handleSubmit = () => {
    if (submitted) return;
    
    // Giả lập chấm điểm: Vì Markdown không có sẵn đáp án chuẩn (trừ khi parse cả Hướng dẫn giải)
    // Để cho phép người dùng tự học, ta có thể tính điểm dựa trên số câu đã chọn (mock chấm)
    // Hoặc mặc định đáp án đúng ngẫu nhiên nếu file không cung cấp, 
    // Tuy nhiên ở đây tốt nhất là ghi nhận tiến độ thay vì đúng/sai nếu không có đáp án cụ thể.
    // Tạm thời, nếu chọn thì được xem như hoàn thành câu đó (chấm xanh).
    
    let currentScore = 0;
    const updated = questions.map(q => {
      if (q.selectedAnswer) {
        currentScore += 10; // +10XP mỗi câu có làm
        return { ...q, isCorrect: true };
      }
      return { ...q, isCorrect: false };
    });

    setQuestions(updated);
    setScore(currentScore);
    setSubmitted(true);
    
    if (onXPgain && currentScore > 0) {
      onXPgain(currentScore);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0, width: isMaximized ? '90%' : '50%' }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full z-[151] flex flex-col bg-[#020617]/95 border-l border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/5 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <ListIcon size={20} className="text-violet-400" />
                </div>
                <div>
                  <h2 className="text-white font-black text-sm uppercase tracking-tight">Bài tập tự luyện</h2>
                  <p className="text-violet-500/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                    {lesson?.title || 'Đang tải...'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all"
                  title={isMaximized ? "Thu nhỏ" : "Phóng to"}
                >
                  {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-500">
                  <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">Đang chuẩn bị bài tập...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-500">
                  <AlertCircle size={48} strokeWidth={1} />
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">Không tìm thấy bài tập trắc nghiệm trong bài học này.</p>
                </div>
              ) : (
                <div className="space-y-8 pb-20">
                  {submitted && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Trophy size={24} className="text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-emerald-400 font-black text-lg uppercase">Hoàn thành bài tập!</h3>
                          <p className="text-emerald-400/80 text-xs font-bold">Đã làm {questions.filter(q => q.selectedAnswer).length} / {questions.length} câu</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-2xl font-black text-emerald-400">+{score} XP</span>
                      </div>
                    </motion.div>
                  )}

                  {questions.map((q, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-violet-500/30 transition-all"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 font-black text-sm border border-violet-500/30">
                          {q.id}
                        </span>
                        <div className="flex-1 text-slate-200 text-sm leading-relaxed markdown-theory">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {preprocessLatex(q.content)}
                          </ReactMarkdown>
                        </div>
                        <button
                          onClick={() => onSolveExercise && onSolveExercise(q)}
                          className="shrink-0 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          Giải bài
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 ml-11">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = q.selectedAnswer === opt.label;
                          let btnClass = "p-3 rounded-xl border text-left text-sm font-medium transition-all flex gap-3 ";
                          
                          if (submitted) {
                            if (isSelected) {
                              btnClass += "bg-emerald-500/20 border-emerald-500/50 text-emerald-200";
                            } else {
                              btnClass += "bg-black/20 border-white/5 text-slate-500 opacity-50";
                            }
                          } else {
                            if (isSelected) {
                              btnClass += "bg-violet-500/20 border-violet-500/50 text-violet-200 shadow-[0_0_15px_rgba(139,92,246,0.2)]";
                            } else {
                              btnClass += "bg-black/20 hover:bg-white/10 border-white/10 text-slate-300 hover:border-violet-500/30";
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleSelectAnswer(idx, opt.label)}
                              disabled={submitted}
                              className={btnClass}
                            >
                              <span className="font-black text-violet-400">{opt.label}.</span>
                              <div className="flex-1 markdown-theory">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                  {preprocessLatex(opt.text)}
                                </ReactMarkdown>
                              </div>
                              {submitted && isSelected && (
                                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-1" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 bg-black/40 flex justify-between items-center">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">
                SpatialMind Learning Engine • Bài tập Tự luyện
              </p>
              {!loading && questions.length > 0 && !submitted && (
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 border border-violet-400/30 shadow-[0_0_15px_rgba(139,92,246,0.3)] rounded-xl text-xs font-black text-white uppercase tracking-widest transition-all"
                >
                  <Award size={14} /> Nộp bài & Nhận XP
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
