'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, getDocs, doc, deleteDoc, updateDoc, onSnapshot, arrayRemove 
} from 'firebase/firestore';
import { 
  MessageSquare, Trash2, Search, X, ShieldAlert, ShieldCheck, 
  Heart, Flame, Brain, Calendar, Compass, AlertCircle
} from 'lucide-react';
import { playSound } from '@/lib/sound';
import { logAdminAction } from '@/lib/adminLogger';
import { AvatarFrame } from '@/components/atoms/AvatarFrame';

export default function StoryModeration() {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('report_desc');

  // Preview Modal State
  const [previewPost, setPreviewPost] = useState(null);

  // Đồng bộ realtime bảng tin moments từ Firestore
  useEffect(() => {
    setLoading(true);
    const momentsCollection = collection(db, 'moments');

    const unsubscribe = onSnapshot(momentsCollection, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        // Lấy số lượt báo cáo thực tế từ mảng reports hoặc số báo cáo
        let reportsCount = 0;
        if (data.reports) {
          reportsCount = Array.isArray(data.reports) ? data.reports.length : Number(data.reports);
        }

        list.push({
          id: docSnap.id,
          reportsCount,
          ...data
        });
      });

      // Sắp xếp mặc định
      list.sort((a, b) => (b.reportsCount || 0) - (a.reportsCount || 0));
      setMoments(list);
      setLoading(false);
    }, (err) => {
      console.error("Lỗi khi đồng bộ Moments:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Xóa bài viết khỏi cộng đồng
  const handleDeletePost = async (postId) => {
    playSound.click();
    if (confirm("Hành động này sẽ XÓA VĨNH VIỄN bài đăng và tất cả các bình luận đi kèm khỏi bảng tin cộng đồng. Bạn muốn tiếp tục?")) {
      try {
        setLoading(true);
        await deleteDoc(doc(db, 'moments', postId));
        await logAdminAction("REMOVE_STORY", postId, previewPost ? previewPost.userName : 'Ẩn danh', "Xóa bài đăng Moment vĩnh viễn");
        if (previewPost?.id === postId) {
          setPreviewPost(null);
        }
        playSound.success();
      } catch (err) {
        console.error("Lỗi khi xóa bài viết:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Bỏ qua báo cáo (Gỡ cờ cảnh báo)
  const handleClearReports = async (postId) => {
    playSound.click();
    if (confirm("Bạn muốn bỏ qua toàn bộ báo cáo vi phạm và giữ lại bài đăng này?")) {
      try {
        const momentRef = doc(db, 'moments', postId);
        await updateDoc(momentRef, {
          reports: [],
          reportsCount: 0
        });
        await logAdminAction("CLEAR_REPORTS", postId, previewPost ? previewPost.userName : 'Ẩn danh', "Bỏ qua các báo cáo vi phạm");
        
        // Cập nhật state cục bộ
        setMoments(prev => prev.map(m => m.id === postId ? { ...m, reports: [], reportsCount: 0 } : m));
        if (previewPost?.id === postId) {
          setPreviewPost(prev => ({ ...prev, reports: [], reportsCount: 0 }));
        }
        playSound.success();
      } catch (err) {
        console.error("Lỗi khi xóa cờ báo cáo:", err);
      }
    }
  };

  // Xóa bình luận không phù hợp
  const handleDeleteComment = async (postId, commentObj) => {
    playSound.click();
    if (confirm(`Bạn muốn xóa bình luận của "${commentObj.userName}"?`)) {
      try {
        const momentRef = doc(db, 'moments', postId);
        await updateDoc(momentRef, {
          comments: arrayRemove(commentObj)
        });
        await logAdminAction("DELETE_COMMENT", commentObj.id || postId, commentObj.userName || 'Ẩn danh', `Xóa bình luận toxic: ${commentObj.text}`);

        // Đồng bộ lên UI modal xem chi tiết
        if (previewPost && previewPost.id === postId) {
          setPreviewPost(prev => ({
            ...prev,
            comments: prev.comments.filter(c => c.id !== commentObj.id)
          }));
        }
        playSound.success();
      } catch (err) {
        console.error("Lỗi khi xóa bình luận:", err);
      }
    }
  };

  // Phân loại môn học
  const getSubjectColor = (subj) => {
    const subjects = {
      math: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      physics: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      chemistry: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      biology: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    };
    return subjects[subj] || 'bg-zinc-800 text-zinc-400';
  };

  // Tìm kiếm & Lọc dữ liệu
  const filteredMoments = moments.filter(m => {
    const search = searchTerm.toLowerCase();
    return (
      (m.userName || '').toLowerCase().includes(search) ||
      (m.caption || '').toLowerCase().includes(search)
    );
  });

  // Sắp xếp
  const sortedMoments = [...filteredMoments].sort((a, b) => {
    const timeA = new Date(a.timestamp || 0).getTime();
    const timeB = new Date(b.timestamp || 0).getTime();
    const likesA = (a.reactions?.heart || 0) + (a.reactions?.brain || 0) + (a.reactions?.fire || 0);
    const likesB = (b.reactions?.heart || 0) + (b.reactions?.brain || 0) + (b.reactions?.fire || 0);

    if (sortBy === 'report_desc') return (b.reportsCount || 0) - (a.reportsCount || 0);
    if (sortBy === 'time_desc') return timeB - timeA;
    if (sortBy === 'time_asc') return timeA - timeB;
    if (sortBy === 'likes_desc') return likesB - likesA;
    return (b.reportsCount || 0) - (a.reportsCount || 0);
  });

  // Số liệu tổng quan
  const stats = {
    total: moments.length,
    flagged: moments.filter(m => (m.reportsCount || 0) > 0).length,
    totalComments: moments.reduce((acc, curr) => acc + (curr.comments?.length || 0), 0)
  };

  return (
    <div className="space-y-6 text-zinc-300 font-sans select-none">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wider font-mono">
          Kiểm duyệt bảng tin Stories
        </h1>
        <p className="text-xs text-zinc-500 font-semibold mt-1">
          Giám sát bài đăng cộng đồng (Moments), lọc các báo cáo vi phạm tiêu chuẩn cộng đồng và xóa bình luận toxic.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng số bài viết', value: stats.total, color: 'text-zinc-400' },
          { label: 'Bài viết bị báo cáo', value: stats.flagged, color: stats.flagged > 0 ? 'text-amber-500 font-black animate-pulse' : 'text-zinc-500' },
          { label: 'Tổng số bình luận', value: stats.totalComments, color: 'text-zinc-400' }
        ].map((s, idx) => (
          <div key={idx} className="bg-[#0f1017]/60 border border-[#1f2235] p-4.5 rounded-2xl flex flex-col justify-center gap-1 shadow-lg">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider font-mono">{s.label}</span>
            <span className={`text-xl font-black font-mono leading-none ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0f1017]/60 border border-[#1f2235] p-4 rounded-2xl shadow-lg">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Tìm theo tên tác giả hoặc nội dung bài viết..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white focus:outline-none placeholder-zinc-500 transition-all font-mono"
          />
        </div>

        {/* Sort select */}
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2.5 px-4 text-xs font-bold text-zinc-300 focus:outline-none transition-all cursor-pointer"
          >
            <option value="report_desc">Báo cáo nhiều nhất</option>
            <option value="time_desc">Mới nhất trước</option>
            <option value="time_asc">Cũ nhất trước</option>
            <option value="likes_desc">Yêu thích nhiều nhất</option>
          </select>
        </div>
      </div>

      {/* Stories Grid */}
      {loading ? (
        <div className="py-20 bg-[#0f1017]/60 border border-[#1f2235] rounded-2xl flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono font-bold text-zinc-550 tracking-widest uppercase animate-pulse">
            Đang tải dữ liệu kiểm duyệt...
          </span>
        </div>
      ) : sortedMoments.length === 0 ? (
        <div className="py-20 bg-[#0f1017]/60 border border-[#1f2235] rounded-2xl text-center flex flex-col items-center justify-center gap-3">
          <AlertCircle className="w-12 h-12 text-zinc-650" />
          <span className="text-xs font-bold text-zinc-550 uppercase font-mono">
            Không tìm thấy bài đăng nào phù hợp
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedMoments.map((post) => {
            const hasReports = (post.reportsCount || 0) > 0;
            const likesCount = (post.reactions?.heart || 0) + (post.reactions?.brain || 0) + (post.reactions?.fire || 0);

            return (
              <div 
                key={post.id}
                className={`bg-[#0f1017]/60 border p-5 rounded-2xl transition-all duration-200 shadow-xl flex flex-col justify-between gap-4 ${
                  hasReports 
                    ? 'border-amber-500/30 bg-[#16120e]/60 shadow-[0_0_15px_rgba(245,158,11,0.02)]' 
                    : 'border-[#1f2235] hover:border-pink-500/10'
                }`}
              >
                {/* Author Card Info */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <AvatarFrame frame={post.avatarFrame || 'default'} className="w-9 h-9 text-xs">
                      {post.avatarUrl ? (
                        <img src={post.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-sm">{post.avatar || '👑'}</span>
                      )}
                    </AvatarFrame>
                    <div className="flex flex-col">
                      <span className="text-white text-xs font-bold font-mono leading-none">
                        {post.userName || 'Ẩn danh'}
                      </span>
                      <span className="text-[8px] text-zinc-500 font-bold font-mono mt-1">
                        ELO: {post.elo || 1000}
                      </span>
                    </div>
                  </div>

                  {/* Subject and Report Warning */}
                  <div className="flex flex-col items-end gap-1 font-mono">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getSubjectColor(post.subject)}`}>
                      {post.subjectLabel || post.subject}
                    </span>
                    {hasReports && (
                      <span className="inline-flex items-center gap-1 text-[8px] text-amber-500 font-extrabold uppercase animate-pulse">
                        ⚠️ Báo cáo: {post.reportsCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Caption / Image */}
                <div className="space-y-2">
                  <p className="text-zinc-300 text-xs font-semibold font-mono leading-relaxed line-clamp-2">
                    {post.caption}
                  </p>
                  
                  {post.imageUrl && (
                    <div className="w-full h-32 rounded-xl overflow-hidden border border-[#1f2235] relative group cursor-pointer" onClick={() => { playSound.click(); setPreviewPost(post); }}>
                      <img src={post.imageUrl} alt="Lab capture" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-white transition-opacity select-none">
                        Nhấn để xem chi tiết & bình luận
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Reactions / Comments / Actions */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#1f2235]/40 text-[10px] font-mono text-zinc-500 select-none">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-500 fill-rose-500/25" /> {(post.reactions?.heart || 0)}</span>
                    <span className="flex items-center gap-1"><Brain className="w-3 h-3 text-cyan-400 fill-cyan-400/25" /> {(post.reactions?.brain || 0)}</span>
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400 fill-orange-400/25" /> {(post.reactions?.fire || 0)}</span>
                    <span className="flex items-center gap-1 ml-2"><MessageSquare className="w-3 h-3 text-zinc-550" /> {(post.comments?.length || 0)}</span>
                  </div>

                  {/* Moderation Controls */}
                  <div className="flex items-center gap-1">
                    {hasReports && (
                      <button
                        onClick={() => handleClearReports(post.id)}
                        title="Bỏ qua cảnh cáo vi phạm"
                        className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-450 hover:text-white border border-emerald-500/25 hover:border-emerald-400 rounded-lg transition-all cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      title="Xóa bài đăng vĩnh viễn"
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-rose-450 hover:text-white rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STORY DETAIL & COMMENTS PREVIEW MODAL */}
      {previewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="w-full max-w-2xl bg-[#0c0d14] border border-[#1f2235] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[#1f2235] flex items-center justify-between bg-[#0f1017]/80">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-pink-500 filter drop-shadow-[0_0_6px_rgba(244,63,94,0.2)] animate-spin" style={{ animationDuration: '6s' }} />
                <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">
                  Chi tiết bài đăng Stories
                </h3>
              </div>
              <button
                onClick={() => setPreviewPost(null)}
                className="p-1.5 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Image & Post text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl overflow-hidden border border-[#1f2235] bg-black/40 flex items-center justify-center aspect-video md:aspect-auto md:h-64">
                  <img src={previewPost.imageUrl} alt="High resolution" className="w-full h-full object-cover" />
                </div>

                <div className="flex flex-col justify-between gap-3 text-xs md:text-sm font-semibold text-zinc-400">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AvatarFrame frame={previewPost.avatarFrame} className="w-9 h-9 text-xs">
                        {previewPost.avatarUrl ? <img src={previewPost.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : <span>{previewPost.avatar || '👑'}</span>}
                      </AvatarFrame>
                      <div>
                        <div className="text-white text-xs font-bold font-mono leading-none">{previewPost.userName}</div>
                        <span className="text-[9px] text-pink-500 font-bold block mt-1 font-mono">Rank: {previewPost.title || 'Học viên'}</span>
                      </div>
                    </div>

                    <p className="font-mono text-zinc-300 leading-relaxed max-h-32 overflow-y-auto pr-1">
                      {previewPost.caption}
                    </p>
                  </div>

                  <div className="border-t border-[#1f2235]/40 pt-3 flex items-center justify-between text-[10px] font-mono text-zinc-550">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Đăng lúc: {previewPost.createdAt || 'Vừa xong'}</span>
                    <span className={`px-2 py-0.5 rounded border ${getSubjectColor(previewPost.subject)}`}>{previewPost.subjectLabel || previewPost.subject}</span>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-widest font-mono border-l-2 border-pink-500 pl-2.5 select-none">
                  Quản lý bình luận ({(previewPost.comments?.length || 0)})
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(!previewPost.comments || previewPost.comments.length === 0) ? (
                    <div className="p-4 bg-[#0f1017]/40 border border-[#1f2235]/30 rounded-xl text-center text-xs font-bold text-zinc-650 font-mono">
                      BÀI ĐĂNG NÀY CHƯA CÓ BÌNH LUẬN NÀO
                    </div>
                  ) : (
                    previewPost.comments.map((comment) => (
                      <div 
                        key={comment.id}
                        className="flex items-center justify-between p-3 bg-[#0f1017]/60 border border-[#1f2235]/50 rounded-xl font-mono text-xs hover:border-pink-500/10 transition-all group"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-white font-bold text-[10px]">{comment.userName}:</span>
                          <span className="text-zinc-350">{comment.text}</span>
                        </div>

                        {/* Action: Delete comment */}
                        <button
                          onClick={() => handleDeleteComment(previewPost.id, comment)}
                          title="Xóa bình luận này"
                          className="p-1 text-rose-500/20 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#1f2235] bg-[#0f1017]/70 flex items-center justify-between">
              <div className="flex gap-2">
                {(previewPost.reportsCount || 0) > 0 && (
                  <button
                    onClick={() => handleClearReports(previewPost.id)}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-md font-mono"
                  >
                    Bỏ qua báo cáo
                  </button>
                )}

                <button
                  onClick={() => handleDeletePost(previewPost.id)}
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-md font-mono"
                >
                  Xóa bài viết vĩnh viễn
                </button>
              </div>

              <button
                onClick={() => setPreviewPost(null)}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 border border-zinc-700/60"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
