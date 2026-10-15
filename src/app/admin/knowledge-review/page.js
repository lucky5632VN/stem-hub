'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, CheckCircle2, XCircle, Edit3, Clock, AlertTriangle, 
  Search, Filter, RefreshCw, BookOpen, UserCheck, Trash2, ArrowRight
} from 'lucide-react';
import { playSound } from '@/lib/sound';
import { formatMathText } from '@/lib/mathFormatter';

export default function KnowledgeReviewAdminPage() {
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'verified' | 'rejected' | 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [editAnswerText, setEditAnswerText] = useState('');
  const [teacherName, setTeacherName] = useState('Thầy Nguyễn Trọng Nghĩa (Tổ phó Chuyên môn)');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchKnowledge = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/learned-knowledge?all=true&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.learnedDocs)) {
          // Nếu dữ liệu rỗng, nạp sẵn các mẫu tri thức học thuật ban đầu phục vụ thẩm định
          if (data.learnedDocs.length === 0) {
            seedSampleKnowledge();
          } else {
            setKnowledgeList(data.learnedDocs);
          }
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách tri thức:', err);
    } finally {
      setLoading(false);
    }
  };

  const seedSampleKnowledge = async () => {
    const samples = [
      {
        query: 'Este no đơn chức mạch hở có công thức tổng quát là gì?',
        answer: 'Công thức phân tử tổng quát của este no, đơn chức, mạch hở là CnH2nO2 (với n ≥ 2). Phản ứng thủy phân trong môi trường kiềm (xà phòng hóa) tạo muối natri của axit cacboxylic và ancol.',
        subject: 'hoa',
        topic: 'Este - Lipit Lớp 12',
        status: 'pending_review',
        teacherVerified: false
      },
      {
        query: 'Điều kiện để xảy ra hiện tượng cộng hưởng trong mạch RLC nối tiếp?',
        answer: 'Hiện tượng cộng hưởng điện xảy ra khi tần số góc của dòng điện bằng tần số góc riêng của mạch: ω = 1 / sqrt(LC) hay Z_L = Z_C. Khi đó tổng trở Z đạt giá trị nhỏ nhất (Z = R) và cường độ dòng điện hiệu dụng đạt cực đại I_max = U / R.',
        subject: 'ly',
        topic: 'Dòng điện xoay chiều Lớp 12',
        status: 'verified_by_teacher',
        teacherVerified: true,
        verifiedAt: new Date(Date.now() - 3600000).toISOString(),
        verifiedBy: 'Cô Đặng Thị Bích Thủy (Tổ Chuyên môn Vật lý)'
      },
      {
        query: 'Công thức tính thể tích khối chóp bất kỳ?',
        answer: 'Thể tích khối chóp có diện tích đáy B và chiều cao h được tính theo công thức: V = (1/3) * B * h.',
        subject: 'toan',
        topic: 'Hình học Không gian Lớp 12',
        status: 'pending_review',
        teacherVerified: false
      },
      {
        query: 'Nguyên tắc bổ sung trong cấu trúc xoắn kép của phân tử ADN là gì?',
        answer: 'Nguyên tắc bổ sung: A liên kết với T bằng 2 liên kết hiđro (A = T), G liên kết với X bằng 3 liên kết hiđro (G ≡ X). Điều này đảm bảo đường kính xoắn kép luôn cố định 20 Å.',
        subject: 'sinh',
        topic: 'Cơ chế di truyền và biến dị Lớp 12',
        status: 'verified_by_teacher',
        teacherVerified: true,
        verifiedAt: new Date(Date.now() - 7200000).toISOString(),
        verifiedBy: 'Cô Vũ Thị Hoàng Yến (Thạc sĩ Sinh học)'
      }
    ];

    for (const s of samples) {
      await fetch('/api/learned-knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': 'stemhub_rag_internal_sig_2026'
        },
        body: JSON.stringify(s)
      }).catch(() => {});
    }

    setTimeout(fetchKnowledge, 500);
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const handleAction = async (id, action, updatedAnswer = null) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/learned-knowledge', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action,
          teacherName,
          updatedAnswer
        })
      });

      if (res.ok) {
        playSound.success();
        await fetchKnowledge();
        setEditingItem(null);
      }
    } catch (err) {
      console.error('Lỗi cập nhật thẩm định:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản ghi tri thức này khỏi cơ sở dữ liệu?')) return;
    try {
      const res = await fetch(`/api/learned-knowledge?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        playSound.click();
        await fetchKnowledge();
      }
    } catch (err) {
      console.error('Lỗi xóa tri thức:', err);
    }
  };

  // Filter list
  const filteredList = knowledgeList.filter(item => {
    // Filter tab
    if (activeTab === 'pending' && (item.status === 'verified_by_teacher' || item.status === 'rejected')) return false;
    if (activeTab === 'verified' && item.status !== 'verified_by_teacher') return false;
    if (activeTab === 'rejected' && item.status !== 'rejected') return false;

    // Filter subject
    if (selectedSubject !== 'all' && (item.subject || '').toLowerCase() !== selectedSubject) return false;

    // Filter search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchQ = (item.query || '').toLowerCase().includes(term);
      const matchA = (item.answer || '').toLowerCase().includes(term);
      const matchT = (item.topic || '').toLowerCase().includes(term);
      if (!matchQ && !matchA && !matchT) return false;
    }

    return true;
  });

  const pendingCount = knowledgeList.filter(i => i.status === 'pending_review' || (!i.status && !i.teacherVerified)).length;
  const verifiedCount = knowledgeList.filter(i => i.status === 'verified_by_teacher' || i.teacherVerified === true).length;
  const rejectedCount = knowledgeList.filter(i => i.status === 'rejected').length;

  return (
    <div className="space-y-6 text-zinc-300 font-sans select-none">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0d101a] via-[#161a2e] to-[#0d101a] border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.12)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1.5">
              <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>Cơ chế Kiểm duyệt Trước khi Tái sử dụng Cache (Yêu cầu 1)</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight font-mono uppercase">
              Hội Đồng Thẩm Định & Phê Duyệt Tri Thức AI
            </h1>
            <p className="text-xs text-zinc-400 mt-1.5 max-w-3xl leading-relaxed">
              Mọi câu trả lời mới sinh từ AI mặc định ở trạng thái <span className="text-amber-400 font-mono font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">pending_review</span> và <strong className="text-zinc-200">chưa được phép làm Cache Hit</strong>. Chỉ khi Thầy/Cô bấm "Phê duyệt (Verify)", tri thức mới được kích hoạt vào luồng tái sử dụng của toàn bộ học sinh.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={fetchKnowledge}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700/80 text-zinc-100 text-xs font-mono font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? 'animate-spin text-cyan-400' : 'text-zinc-300'}`} />
              <span>Làm mới danh sách</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f1017]/80 border border-[#1f2235] rounded-xl p-4 shadow-sm">
          <span className="text-[11px] text-zinc-400 font-mono block">TỔNG TRI THỨC HỆ THỐNG</span>
          <span className="text-2xl font-black text-white font-mono mt-1 block">{knowledgeList.length}</span>
        </div>
        <div className="bg-[#0f1017]/80 border border-amber-500/40 rounded-xl p-4 shadow-[0_0_15px_rgba(245,158,11,0.08)]">
          <span className="text-[11px] text-amber-400 font-mono block">⏳ CHỜ GIÁO VIÊN DUYỆT</span>
          <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">{pendingCount}</span>
        </div>
        <div className="bg-[#0f1017]/80 border border-emerald-500/40 rounded-xl p-4 shadow-[0_0_15px_rgba(16,185,129,0.08)]">
          <span className="text-[11px] text-emerald-400 font-mono block">✅ ĐÃ DUYỆT (ACTIVE CACHE)</span>
          <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">{verifiedCount}</span>
        </div>
        <div className="bg-[#0f1017]/80 border border-rose-500/40 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] text-rose-400 font-mono block">❌ ĐÃ TỪ CHỐI (REJECTED)</span>
          <span className="text-2xl font-black text-rose-400 font-mono mt-1 block">{rejectedCount}</span>
        </div>
      </div>

      {/* Controls Bar: Tabs, Search & Filters */}
      <div className="bg-[#0f1017]/80 border border-[#1f2235] rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-lg">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ duyệt ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('verified')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'verified'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã duyệt ({verifiedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'rejected'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Từ chối ({rejectedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tất cả ({knowledgeList.length})
          </button>
        </div>

        {/* Search & Subject select */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo câu hỏi, đáp án..."
              className="w-full pl-9 pr-3 py-2 bg-[#08090d] border border-[#1f2235] focus:border-cyan-400 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-hidden font-mono"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 bg-[#08090d] border border-[#1f2235] focus:border-cyan-400 rounded-xl text-xs text-zinc-200 focus:outline-hidden font-mono shrink-0 cursor-pointer"
          >
            <option value="all">Tất cả môn</option>
            <option value="toan">Toán học</option>
            <option value="ly">Vật lý</option>
            <option value="hoa">Hóa học</option>
            <option value="sinh">Sinh học</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 font-mono text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
            Đang tải dữ liệu tri thức...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-[#11131f] border border-zinc-800 rounded-2xl p-12 text-center">
            <BookOpen className="w-10 h-10 mx-auto text-zinc-600 mb-3" />
            <p className="text-zinc-300 font-bold">Không có bản ghi tri thức nào trong mục này</p>
            <p className="text-xs text-zinc-500 mt-1">Các câu hỏi học thuật mới từ học sinh sẽ tự động cập nhật về đây để chờ thẩm định.</p>
          </div>
        ) : (
          filteredList.map((item) => {
            const isVerified = item.status === 'verified_by_teacher' || item.teacherVerified === true;
            const isRejected = item.status === 'rejected';
            const isPending = !isVerified && !isRejected;

            const subjectBadges = {
              toan: { bg: 'bg-blue-500/15 border-blue-500/40 text-blue-300', label: 'Toán học' },
              ly: { bg: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300', label: 'Vật lý' },
              hoa: { bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300', label: 'Hóa học' },
              sinh: { bg: 'bg-pink-500/15 border-pink-500/40 text-pink-300', label: 'Sinh học' },
              stem: { bg: 'bg-purple-500/15 border-purple-500/40 text-purple-300', label: 'STEM' }
            };
            const badge = subjectBadges[(item.subject || '').toLowerCase()] || subjectBadges.stem;

            return (
              <div
                key={item.id}
                className={`bg-[#0d101a] border rounded-2xl p-5 transition-all ${
                  isVerified
                    ? 'border-emerald-500/30 hover:border-emerald-500/50'
                    : isRejected
                    ? 'border-rose-500/30 opacity-75'
                    : 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {item.topic || 'Tri thức tự học AI'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      • {new Date(item.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-mono font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã Phê Duyệt (Active Cache Hit)
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 text-xs font-mono font-bold">
                        <XCircle className="w-3.5 h-3.5" />
                        Đã Từ Chối
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-mono font-bold animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        Chờ Giáo Viên Phê Duyệt (Pending)
                      </span>
                    )}
                  </div>
                </div>

                {/* Question */}
                <div className="mb-3">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    CÂU HỎI TỪ HỌC SINH:
                  </div>
                  <div 
                    className="text-sm font-bold text-white bg-zinc-900/60 p-3 rounded-xl border border-zinc-800"
                    dangerouslySetInnerHTML={{ __html: `"${formatMathText(item.query)}"` }}
                  />
                </div>

                {/* Answer */}
                <div className="mb-4">
                  <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>CÂU TRẢ LỜI CỦA GEMINI AI:</span>
                    {isVerified && item.verifiedBy && (
                      <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-400" />
                        Thẩm định bởi: <strong className="text-emerald-300">{item.verifiedBy}</strong>
                      </span>
                    )}
                  </div>
                  
                  {editingItem?.id === item.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editAnswerText}
                        onChange={(e) => setEditAnswerText(e.target.value)}
                        rows={5}
                        className="w-full p-3 bg-zinc-950 border border-cyan-400 rounded-xl text-xs text-zinc-100 font-sans focus:outline-hidden"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingItem(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-white cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleAction(item.id, 'edit', editAnswerText)}
                          disabled={actionLoading === item.id}
                          className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs shadow-md cursor-pointer"
                        >
                          Lưu & Duyệt Luôn
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="text-xs text-zinc-200 bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-800/80 leading-relaxed font-sans"
                      dangerouslySetInnerHTML={{ __html: formatMathText(item.answer) }}
                    />
                  )}
                </div>

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/60">
                  <div className="text-[11px] text-zinc-500 font-mono">
                    ID: {item.id}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Nút Phê Duyệt */}
                    <button
                      onClick={() => handleAction(item.id, 'verify')}
                      disabled={actionLoading === item.id}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-mono font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isVerified ? 'Cập nhật Duyệt' : 'Phê duyệt (Verify)'}</span>
                    </button>

                    {/* Nút Hiệu đính */}
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setEditAnswerText(item.answer || '');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs border border-zinc-700 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Hiệu đính</span>
                    </button>

                    {/* Nút Từ chối */}
                    <button
                      onClick={() => handleAction(item.id, 'reject')}
                      disabled={actionLoading === item.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-mono text-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Từ chối</span>
                    </button>

                    {/* Xóa */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                      title="Xóa vĩnh viễn"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
