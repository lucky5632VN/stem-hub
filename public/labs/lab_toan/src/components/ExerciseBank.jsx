import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  Search, 
  BookOpen, 
  Send, 
  ChevronRight, 
  Filter, 
  LayoutGrid, 
  List as ListIcon, 
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import lessons from '../data/lessons.json';

export default function ExerciseBank({ isOpen, onClose, onSelectLesson, onSelectExercise }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // grid | list

  const categories = ['All', ...new Set(lessons.map(l => l.category))];

  const filteredLessons = lessons.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || l.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-[#020617]/90 backdrop-blur-2xl"
        >
          <div className="relative w-full max-w-6xl h-full flex flex-col bg-slate-900/50 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-8 pb-4 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Database size={24} className="text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Kho Học Liệu Thông Minh</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                      <Sparkles size={12} className="text-yellow-400" /> Hệ thống bài tập & lý thuyết phân loại theo buổi
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 relative group">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm chủ đề, bài tập..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/20 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                  />
                </div>

                <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        selectedCategory === cat 
                          ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {cat === 'All' ? 'Tất cả' : cat}
                    </button>
                  ))}
                </div>

                <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-600'}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-600'}`}
                  >
                    <ListIcon size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "flex flex-col gap-4"
              }>
                {filteredLessons.map((lesson, idx) => (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -5 }}
                    className="group relative bg-white/5 border border-white/5 hover:border-violet-500/30 rounded-[32px] p-6 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-[10px] font-black px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase tracking-widest">
                        {lesson.category}
                      </span>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        #{lesson.id}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-black text-white leading-tight mb-2 group-hover:text-violet-300 transition-colors">
                      {lesson.title}
                    </h3>
                    
                    <div className="flex flex-col gap-3 mt-6">
                      <button
                        onClick={() => onSelectLesson(lesson)}
                        className="w-full flex items-center justify-between px-5 py-3 bg-white/5 hover:bg-violet-500/10 border border-white/5 rounded-2xl text-xs font-bold text-slate-300 group-hover:text-white transition-all"
                      >
                        <span className="flex items-center gap-2"><BookOpen size={14} /> Lý thuyết buổi</span>
                        <ChevronRight size={14} />
                      </button>
                      <button
                        onClick={() => onSelectExercise && onSelectExercise(lesson)}
                        className="w-full flex items-center justify-between px-5 py-3 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 rounded-2xl text-xs font-black text-violet-400 uppercase tracking-widest transition-all"
                      >
                        <span className="flex items-center gap-2"><ListIcon size={14} /> Bài tập tự luyện</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredLessons.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                  <Database size={48} strokeWidth={1} />
                  <p className="font-bold uppercase tracking-widest text-sm">Không tìm thấy học liệu phù hợp</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-white/5 bg-black/20 flex items-center justify-between text-slate-500">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Database Sync: OK</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{filteredLessons.length} bài học khả dụng</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40 italic">
                SpatialMind Learning Asset Management System
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
