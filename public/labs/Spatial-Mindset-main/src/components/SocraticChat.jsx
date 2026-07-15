import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../api/client';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { X, Send, Sparkles, Bot, User, RotateCcw, Lightbulb, Info } from 'lucide-react';

// =====================
// Typing indicator
// =====================
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-cyan-400"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

// =====================
// Socratic Chat Panel (Side-over)
// =====================
export default function SocraticChat({ isOpen, onClose, problemStatement, hint }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [theory, setTheory] = useState('');
  const bottomRef = useRef(null);

  // Init: khi mở panel, inject lời chào của AI + hint
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = hint
        ? `Xin chào! 👋 Tôi sẽ hướng dẫn bạn giải bài này theo kiểu Socratic — tức là tôi **không giải bài hộ** mà sẽ đặt câu hỏi để bạn tự tìm ra đáp án nhé!\n\n*Gợi ý ban đầu:*\n\n${hint}\n\nBạn đang suy nghĩ đến bước nào rồi?`
        : `Xin chào! 👋 Hãy nhập đề bài và tôi sẽ hướng dẫn bạn từng bước theo phương pháp Socratic!\n\n*Phương pháp Socratic:* Tôi sẽ đặt câu hỏi gợi ý để bạn **tự tìm ra** cách giải, thay vì đưa đáp án ngay.`;

      setMessages([{
        role: 'ai',
        content: greeting,
        id: Date.now(),
      }]);
    }
  }, [isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAITyping]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isAITyping) return;

    const userMsg = { role: 'user', content: text, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsAITyping(true);

    try {
      const data = await apiClient.post('/api/socratic-hint', {
        problem_statement: problemStatement || 'Bài toán hình học không gian',
        student_wrong_step: text,
        theory_markdown: theory || 'Hình học không gian, góc nhị diện, khoảng cách từ điểm đến mặt phẳng',
      });

      const { socratic_question, theory_applied } = response.data;
      if (theory_applied) setTheory(theory_applied);

      setMessages(prev => [...prev, {
        role: 'ai',
        content: socratic_question,
        theory: theory_applied,
        id: Date.now(),
      }]);
    } catch (err) {
      let errorMessage = '⚠️ Không kết nối được với AI. Hãy kiểm tra backend nhé!';
      if (err.response?.data?.detail) {
        errorMessage = `⚠️ ${err.response.data.detail}`;
      } else if (err.response?.status === 429) {
        errorMessage = '⚠️ Hệ thống đang bận (Rate Limit). Vui lòng đợi một lát rồi thử lại.';
      } else if (err.message) {
        errorMessage = `⚠️ Lỗi: ${err.message}`;
      }

      setMessages(prev => [...prev, {
        role: 'ai',
        content: errorMessage,
        id: Date.now(),
      }]);
    } finally {
      setIsAITyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setTheory('');
    setTimeout(() => {
      setMessages([{
        role: 'ai',
        content: `Bắt đầu lại nhé! 🔄\n\nBạn đang nghĩ gì về bài toán này?\n\n*${problemStatement || 'Hãy mô tả bài toán của bạn.'}*`,
        id: Date.now(),
      }]);
    }, 100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[33%] z-[101] flex flex-col"
            style={{
              background: 'rgba(2,6,23,0.85)',
              backdropFilter: 'blur(30px)',
              borderLeft: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Lightbulb size={18} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-white font-black text-sm uppercase tracking-tight">Socratic AI</h2>
                  <p className="text-cyan-500/60 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                    <Sparkles size={8} /> Học bằng câu hỏi gợi mở
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                  title="Bắt đầu lại"
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Problem context bar */}
            {problemStatement && (
              <div className="px-5 py-3 border-b border-white/5 bg-cyan-500/5">
                <p className="text-[10px] text-cyan-400/60 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Info size={9} /> Đề bài đang giải
                </p>
                <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">{problemStatement}</p>
              </div>
            )}

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar space-y-4">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: msg.role === 'ai'
                          ? 'rgba(34,211,238,0.1)'
                          : 'rgba(167,139,250,0.1)',
                        border: msg.role === 'ai'
                          ? '1px solid rgba(34,211,238,0.2)'
                          : '1px solid rgba(167,139,250,0.2)',
                      }}
                    >
                      {msg.role === 'ai'
                        ? <Bot size={14} className="text-cyan-400" />
                        : <User size={14} className="text-violet-400" />
                      }
                    </div>

                    {/* Bubble */}
                    <div
                      className="max-w-[80%] rounded-2xl px-4 py-3 text-[12px] leading-relaxed"
                      style={{
                        background: msg.role === 'ai'
                          ? 'rgba(34,211,238,0.05)'
                          : 'rgba(167,139,250,0.08)',
                        border: msg.role === 'ai'
                          ? '1px solid rgba(34,211,238,0.12)'
                          : '1px solid rgba(167,139,250,0.15)',
                        borderRadius: msg.role === 'ai'
                          ? '4px 16px 16px 16px'
                          : '16px 4px 16px 16px',
                        color: msg.role === 'ai' ? '#cbd5e1' : '#e2e8f0',
                      }}
                    >
                      <div className="prose prose-invert prose-sm max-w-none markdown-chat">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                            strong: ({ node, ...props }) => <strong className="text-white font-bold" {...props} />,
                            em: ({ node, ...props }) => <em className="text-cyan-300/80 not-italic font-medium" {...props} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      {msg.theory && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <span className="text-[9px] text-cyan-500/50 font-bold uppercase tracking-widest">
                            Lý thuyết: {msg.theory}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {isAITyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2.5"
                >
                  <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Bot size={14} className="text-cyan-400" />
                  </div>
                  <div
                    className="rounded-2xl px-4"
                    style={{
                      background: 'rgba(34,211,238,0.05)',
                      border: '1px solid rgba(34,211,238,0.12)',
                      borderRadius: '4px 16px 16px 16px',
                    }}
                  >
                    <TypingIndicator />
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-white/5" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div
                className="flex items-end gap-3 p-3 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <textarea
                  rows={2}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Chia sẻ suy nghĩ của bạn... (Enter để gửi)"
                  className="flex-1 bg-transparent text-slate-200 text-[12px] resize-none focus:outline-none placeholder:text-slate-600 leading-relaxed"
                  style={{ minHeight: '40px', maxHeight: '100px' }}
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={sendMessage}
                  disabled={!inputText.trim() || isAITyping}
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: inputText.trim() && !isAITyping
                      ? 'rgba(34,211,238,0.2)'
                      : 'rgba(255,255,255,0.05)',
                    border: inputText.trim() && !isAITyping
                      ? '1px solid rgba(34,211,238,0.3)'
                      : '1px solid rgba(255,255,255,0.05)',
                    color: inputText.trim() && !isAITyping ? '#22d3ee' : '#475569',
                  }}
                >
                  <Send size={14} />
                </motion.button>
              </div>
              <p className="text-center text-[9px] text-slate-600 mt-2 font-bold uppercase tracking-widest">
                Enter để gửi • Shift+Enter xuống dòng
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
