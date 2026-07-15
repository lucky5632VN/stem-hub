// =====================================================
// SpatialMind — Community Gallery
// =====================================================
// Thư viện cộng đồng hiển thị mô hình 3D & lời giải
// được vote nhiều nhất
// Features: Grid/List view, Voting, Filters, Preview
// =====================================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, ThumbsUp, ThumbsDown, Eye, Send,
  Flame, Clock, Trophy, Filter, LayoutGrid,
  List as ListIcon, MessageCircle, Share2, Sparkles,
  ChevronDown, ArrowUpRight, Star, TrendingUp,
  User, Calendar, Zap, Triangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';

const SORT_OPTIONS = [
  { id: 'hot', label: '🔥 Hot', icon: Flame },
  { id: 'new', label: '🆕 Mới nhất', icon: Clock },
  { id: 'top-week', label: '🏆 Top tuần', icon: Trophy },
  { id: 'top-month', label: '⭐ Top tháng', icon: Star },
];

const DIFFICULTY_COLORS = {
  easy: '#34d399',
  medium: '#fbbf24',
  hard: '#f87171',
};

export default function CommunityGallery({
  isOpen,
  onClose,
  onLoadModel,
  onTryChallenge,
}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('hot');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedPost, setSelectedPost] = useState(null);
  const [page, setPage] = useState(1);
  const { user, isAuthenticated } = useAuth();

  // ── Load posts ──
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/gallery/feed', {
        params: { sort: sortBy, page, search: searchQuery || undefined },
      });
      setPosts(res.posts || []);
    } catch {
      // Fallback: mock data cho demo
      setPosts(MOCK_POSTS);
    } finally {
      setLoading(false);
    }
  }, [sortBy, page, searchQuery]);

  useEffect(() => {
    if (isOpen) loadPosts();
  }, [isOpen, loadPosts]);

  // ── Vote ──
  const handleVote = async (postId, direction) => {
    if (!isAuthenticated) return;
    try {
      await apiClient.post(`/api/gallery/${postId}/vote`, {
        uid: user.uid,
        direction, // 'up' | 'down'
      });
      // Optimistic update
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? { ...p, votes: p.votes + (direction === 'up' ? 1 : -1), userVoted: direction }
            : p
        )
      );
    } catch {
      // Ignore vote errors
    }
  };

  // ── Load into workspace ──
  const handleLoadModel = (post) => {
    if (onLoadModel) {
      onLoadModel({
        geometryData: post.geometryData,
        promptInput: post.problem,
      });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-2xl"
        >
          <div className="relative w-full max-w-7xl h-[90vh] flex flex-col bg-slate-900/40 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden">
            {/* ── Header ── */}
            <div className="p-6 pb-4 flex flex-col gap-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(34,211,238,0.15))',
                      border: '1px solid rgba(168,85,247,0.25)',
                    }}
                  >
                    <Sparkles size={22} className="text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">
                      Thư viện Cộng đồng
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                      <TrendingUp size={10} />
                      Mô hình 3D & lời giải được yêu thích nhất
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Filters row */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="flex-1 min-w-[200px] relative group">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Tìm theo bài toán, tác giả..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all placeholder-slate-600"
                  />
                </div>

                {/* Sort buttons */}
                <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSortBy(opt.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        sortBy === opt.id
                          ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* View mode */}
                <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-600'}`}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-600'}`}
                  >
                    <ListIcon size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Content Grid ── */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-500">
                  <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">Đang tải cộng đồng...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                  <Triangle size={48} strokeWidth={1} />
                  <p className="font-bold uppercase tracking-widest text-sm">
                    Chưa có mô hình nào. Hãy là người đầu tiên chia sẻ!
                  </p>
                </div>
              ) : (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
                      : 'flex flex-col gap-4'
                  }
                >
                  {posts.map((post, idx) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ y: -4 }}
                      className="group relative bg-white/[0.03] border border-white/5 hover:border-violet-500/30 rounded-[24px] overflow-hidden transition-all"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-40 bg-gradient-to-b from-slate-800/50 to-slate-900/50 flex items-center justify-center overflow-hidden">
                        {post.thumbnail ? (
                          <img
                            src={post.thumbnail}
                            alt={post.title}
                            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                          />
                        ) : (
                          <Triangle size={48} className="text-slate-700" strokeWidth={1} />
                        )}
                        {/* Difficulty badge */}
                        <span
                          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                          style={{
                            background: `${DIFFICULTY_COLORS[post.difficulty] || '#64748b'}20`,
                            color: DIFFICULTY_COLORS[post.difficulty] || '#64748b',
                            border: `1px solid ${DIFFICULTY_COLORS[post.difficulty] || '#64748b'}40`,
                          }}
                        >
                          {post.difficulty === 'easy' ? 'Dễ' : post.difficulty === 'medium' ? 'Vừa' : 'Khó'}
                        </span>
                        {/* Vote count overlay */}
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur text-[10px] font-bold text-emerald-400">
                          <ThumbsUp size={10} />
                          {post.votes || 0}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-sm font-black text-white leading-tight mb-1 group-hover:text-violet-300 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 mb-3 line-clamp-2">{post.problem}</p>

                        {/* Author + Date */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                            <User size={10} className="text-white" />
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">{post.authorName || 'Ẩn danh'}</span>
                          <span className="text-[10px] text-slate-600">•</span>
                          <span className="text-[10px] text-slate-600 flex items-center gap-1">
                            <Calendar size={9} />
                            {post.date || 'Hôm nay'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {/* Vote buttons */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleVote(post.id, 'up'); }}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                              post.userVoted === 'up'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-emerald-500/10 hover:text-emerald-400'
                            }`}
                          >
                            <ThumbsUp size={11} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleVote(post.id, 'down'); }}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                              post.userVoted === 'down'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-red-500/10 hover:text-red-400'
                            }`}
                          >
                            <ThumbsDown size={11} />
                          </button>

                          <div className="flex-1" />

                          {/* Load model button */}
                          <button
                            onClick={() => handleLoadModel(post)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 border border-violet-500/25 text-[10px] font-black text-violet-400 uppercase tracking-wider hover:bg-violet-500/25 transition-all"
                          >
                            <Eye size={11} />
                            Xem 3D
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="px-6 py-4 border-t border-white/5 bg-black/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {posts.length} mô hình
                  </span>
                </div>
              </div>
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.15em] italic">
                SpatialMind Community Gallery • Powered by AI
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Mock data (fallback khi chưa có backend API) ──
const MOCK_POSTS = [
  {
    id: 'mock-1',
    title: 'Hình chóp S.ABCD — Khoảng cách từ B đến (SAC)',
    problem: 'Hình chóp đều S.ABCD cạnh đáy 4, chiều cao 3. Tính khoảng cách từ B đến mặt phẳng (SAC).',
    difficulty: 'medium',
    votes: 42,
    authorName: 'Minh Tuấn',
    date: 'Hôm nay',
    thumbnail: null,
    geometryData: null,
  },
  {
    id: 'mock-2',
    title: 'Tứ diện đều — Khoảng cách hai cạnh chéo',
    problem: 'Tứ diện đều ABCD cạnh a. Tính khoảng cách giữa AB và CD.',
    difficulty: 'hard',
    votes: 38,
    authorName: 'Thu Hà',
    date: '1 ngày trước',
    thumbnail: null,
    geometryData: null,
  },
  {
    id: 'mock-3',
    title: 'Hình lập phương — Góc giữa đường chéo và đáy',
    problem: 'Hình lập phương ABCD.A\'B\'C\'D\' cạnh a=2. Tính góc giữa AC\' và mặt đáy ABCD.',
    difficulty: 'easy',
    votes: 56,
    authorName: 'Quốc Bảo',
    date: '2 ngày trước',
    thumbnail: null,
    geometryData: null,
  },
  {
    id: 'mock-4',
    title: 'Thiết diện hình chóp qua 3 điểm',
    problem: 'Hình chóp S.ABCD, M trung điểm SA, N trung điểm SB. Tìm thiết diện qua M, N, C.',
    difficulty: 'medium',
    votes: 31,
    authorName: 'Lan Anh',
    date: '3 ngày trước',
    thumbnail: null,
    geometryData: null,
  },
  {
    id: 'mock-5',
    title: 'Cầu ngoại tiếp hình chóp đều',
    problem: 'Hình chóp đều S.ABCD cạnh đáy 2, cạnh bên √3. Tìm R cầu ngoại tiếp.',
    difficulty: 'hard',
    votes: 27,
    authorName: 'Đức Anh',
    date: '4 ngày trước',
    thumbnail: null,
    geometryData: null,
  },
  {
    id: 'mock-6',
    title: 'Hình hộp chữ nhật — Đường chéo không gian',
    problem: 'ABCD.A\'B\'C\'D\' có AB=3, BC=4, AA\'=5. Tính đường chéo không gian.',
    difficulty: 'easy',
    votes: 64,
    authorName: 'Phương Thảo',
    date: '5 ngày trước',
    thumbnail: null,
    geometryData: null,
  },
];
