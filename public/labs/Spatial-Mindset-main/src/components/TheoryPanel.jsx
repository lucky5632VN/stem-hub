import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { X, BookOpen, ChevronLeft, Download, Maximize2, Minimize2 } from 'lucide-react';
import 'katex/dist/katex.min.css';

export default function TheoryPanel({ isOpen, onClose, lesson }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (isOpen && lesson?.filePath) {
      setLoading(true);
      fetch(lesson.filePath)
        .then(res => res.text())
        .then(text => {
          setContent(text);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading theory:', err);
          setContent('# Lỗi tải tài liệu\nKhông thể tải nội dung lý thuyết. Vui lòng thử lại sau.');
          setLoading(false);
        });
    }
  }, [isOpen, lesson]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
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
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <BookOpen size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-white font-black text-sm uppercase tracking-tight">Lý thuyết chuyên sâu</h2>
                  <p className="text-cyan-500/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">
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
                  <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">Đang chuẩn bị học liệu...</p>
                </div>
              ) : (
                <article className="prose prose-invert prose-cyan max-w-none markdown-theory">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {content}
                  </ReactMarkdown>
                </article>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 bg-black/40 flex justify-between items-center">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">
                SpatialMind Learning Engine • © 2026
              </p>
              <div className="flex gap-4">
                 <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-[10px] font-black text-cyan-400 uppercase tracking-widest hover:bg-cyan-500/20 transition-all">
                   <Download size={12} /> Tải bản PDF
                 </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
