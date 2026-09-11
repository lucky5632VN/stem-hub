'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { 
  Shield, Search, ChevronLeft, ChevronRight, 
  Calendar, Clock, AlertCircle, RefreshCw, Terminal, Cpu, Sparkles, Filter, Copy, Check
} from 'lucide-react';
import { playSound } from '@/lib/sound';

export default function AdminLogsDashboard() {
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' | 'ai'
  
  // Admin Action Logs State
  const [adminLogs, setAdminLogs] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  // AI Reasoning Logs State
  const [aiLogs, setAiLogs] = useState([]);
  const [loadingAi, setLoadingAi] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [aiSubjectFilter, setAiSubjectFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Lắng nghe admin_logs từ Firestore
  useEffect(() => {
    setLoadingAdmin(true);
    const logsCollection = collection(db, 'admin_logs');
    
    const unsubscribe = onSnapshot(logsCollection, (snapshot) => {
      const logsList = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        logsList.push({
          id: docSnap.id,
          ...data,
          dateObject: data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp ? new Date(data.timestamp) : new Date())
        });
      });

      logsList.sort((a, b) => b.dateObject.getTime() - a.dateObject.getTime());
      setAdminLogs(logsList);
      setLoadingAdmin(false);
    }, (err) => {
      console.warn("Lỗi khi đồng bộ Admin Logs:", err.message);
      setLoadingAdmin(false);
    });

    return () => unsubscribe();
  }, []);

  // Lắng nghe ai_reasoning_logs từ Firestore & API
  useEffect(() => {
    setLoadingAi(true);
    let unsubscribe = null;

    try {
      const q = query(collection(db, 'ai_reasoning_logs'), orderBy('timestamp', 'desc'), limit(150));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const logsList = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          logsList.push({
            id: docSnap.id,
            ...data,
            dateObject: data.timestamp ? new Date(data.timestamp) : new Date()
          });
        });
        const deduplicated = [];
        const seenKeys = new Map();
        logsList.forEach(log => {
          const email = (log.userEmail || '').toLowerCase();
          const q = (log.query || '').trim().toLowerCase();
          const t = Math.floor((log.timestamp || (log.dateObject ? log.dateObject.getTime() : 0)) / 30000);
          const key = `${email}_${q}_${t}`;
          if (seenKeys.has(key)) {
            const idx = seenKeys.get(key);
            if (log.aiResponseText && !deduplicated[idx].aiResponseText) {
              deduplicated[idx] = log;
            }
          } else {
            seenKeys.set(key, deduplicated.length);
            deduplicated.push(log);
          }
        });
        setAiLogs(deduplicated);
        setLoadingAi(false);
      }, (err) => {
        console.warn("Firestore AI logs sub fallback:", err.message);
      });
    } catch (_) {}

    // Polling API backup
    const fetchApiAiLogs = async () => {
      try {
        const res = await fetch(`/api/ai-reasoning-log?t=${Date.now()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.logs) && data.logs.length > 0) {
          const parsed = data.logs.map(l => ({ ...l, dateObject: new Date(l.timestamp) }));
          setAiLogs((prevLogs) => {
            const existingIds = new Set(prevLogs.map((l) => l.id));
            const newItems = parsed.filter((l) => !existingIds.has(l.id));
            if (newItems.length === 0) return prevLogs;
            const merged = [...newItems, ...prevLogs];
            merged.sort((a, b) => b.dateObject.getTime() - a.dateObject.getTime());
            return merged.slice(0, 200);
          });
        }
      } catch (_) {} finally {
        setLoadingAi(false);
      }
    };

    fetchApiAiLogs();
    const interval = setInterval(fetchApiAiLogs, 4000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Format thời gian hiển thị
  const formatDateTime = (date) => {
    if (!date) return 'Chưa rõ';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes}:${seconds} - ${day}/${month}/${year}`;
  };

  const getActionBadge = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('CANCEL') || act.includes('BAN')) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-450 border border-rose-500/20 whitespace-nowrap">{action}</span>;
    }
    if (act.includes('ADD') || act.includes('CREATE') || act.includes('GRANT') || act.includes('SEED')) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">{action}</span>;
    }
    if (act.includes('UPDATE') || act.includes('DEDUCT') || act.includes('CLEAR') || act.includes('RESET')) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">{action}</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">{action}</span>;
  };

  const uniqueActions = ['all', ...new Set(adminLogs.map(log => log.action).filter(Boolean))];

  // Lọc Admin logs
  const filteredAdminLogs = adminLogs.filter(log => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      (log.adminEmail || '').toLowerCase().includes(search) ||
      (log.targetName || '').toLowerCase().includes(search) ||
      (log.detail || '').toLowerCase().includes(search) ||
      (log.targetId || '').toLowerCase().includes(search);

    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    let matchesDate = true;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && log.dateObject >= start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && log.dateObject <= end;
    }
    return matchesSearch && matchesAction && matchesDate;
  });

  // Lọc AI Reasoning logs
  const filteredAiLogs = aiLogs.filter(log => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      (log.query || '').toLowerCase().includes(search) ||
      (log.userDisplayName || '').toLowerCase().includes(search) ||
      (log.userEmail || '').toLowerCase().includes(search) ||
      (log.intent || '').toLowerCase().includes(search) ||
      (log.currentPage || '').toLowerCase().includes(search);

    const matchesSubject = aiSubjectFilter === 'ALL' || (log.subject && log.subject.toUpperCase() === aiSubjectFilter);
    return matchesSearch && matchesSubject;
  });

  const currentLogsList = activeTab === 'admin' ? filteredAdminLogs : filteredAiLogs;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = currentLogsList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(currentLogsList.length / itemsPerPage) || 1;

  const resetFilters = () => {
    try { playSound.click(); } catch (_) {}
    setSearchTerm('');
    setSelectedAction('all');
    setStartDate('');
    setEndDate('');
    setAiSubjectFilter('ALL');
    setCurrentPage(1);
  };

  const handleCopyLog = (log) => {
    const textToCopy = (log.terminalLines || []).join('\n') || JSON.stringify(log, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(log.id);
    try { playSound.click(); } catch (_) {}
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 text-zinc-300 font-sans select-none">
      {/* Page Header */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Shield className="w-6 h-6 text-pink-500 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse" />
            Nhật ký hệ thống & Suy luận AI
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Theo dõi thao tác quản trị viên và toàn bộ quá trình giao tiếp, RAG Vector, TF.js của người dùng với AI thời gian thực.
          </p>
        </div>

        <button
          onClick={resetFilters}
          className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-xs font-bold text-zinc-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-md self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Xóa bộ lọc
        </button>
      </div>

      {/* Navigation Tabs Switcher */}
      <div className="flex items-center gap-3 p-1.5 bg-[#0f1017] border border-[#1f2235] rounded-2xl w-fit">
        <button
          onClick={() => {
            setActiveTab('admin');
            setCurrentPage(1);
            try { playSound.click(); } catch (_) {}
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider font-mono transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'admin'
              ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40 shadow-lg'
              : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Shield className="w-4 h-4 text-pink-400" />
          <span>Nhật ký Thao tác Admin</span>
          <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px]">
            {adminLogs.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('ai');
            setCurrentPage(1);
            try { playSound.click(); } catch (_) {}
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider font-mono transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg'
              : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Nhật ký AI Suy luận Realtime</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
            {aiLogs.length}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-800 text-zinc-300 font-mono">Alt+U</span>
        </button>
      </div>

      {/* Filter Options Panel */}
      <div className="w-full bg-[#0f1017]/60 border border-[#1f2235] p-5 rounded-2xl shadow-lg space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Search Term input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Tìm kiếm từ khóa</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder={activeTab === 'admin' ? "Tìm email, đối tượng, chi tiết..." : "Tìm tên học sinh, email, câu hỏi..."}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-white focus:outline-none placeholder-zinc-650 transition-all font-mono"
              />
            </div>
          </div>

          {activeTab === 'admin' ? (
            <>
              {/* Action Filter */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Hành động</label>
                <select
                  value={selectedAction}
                  onChange={(e) => {
                    setSelectedAction(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2 px-3 text-xs font-bold text-zinc-300 focus:outline-none transition-all cursor-pointer"
                >
                  {uniqueActions.map(action => (
                    <option key={action} value={action}>
                      {action === 'all' ? 'Tất cả hành động' : action}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Từ ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-white focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Đến ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-white focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Môn học STEM</label>
              <select
                value={aiSubjectFilter}
                onChange={(e) => {
                  setAiSubjectFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#08090d] border border-[#1f2235] focus:border-emerald-500/50 rounded-xl py-2 px-3 text-xs font-bold text-emerald-300 focus:outline-none transition-all cursor-pointer font-mono"
              >
                <option value="ALL">Tất cả môn học</option>
                <option value="HÓA">Hóa học</option>
                <option value="LÝ">Vật lý</option>
                <option value="TOÁN">Toán học</option>
                <option value="SINH">Sinh học</option>
                <option value="TỔNG HỢP">Tổng hợp / STEM</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Logs Display Table / Cards */}
      <div className="w-full bg-[#0f1017]/60 border border-[#1f2235] rounded-2xl shadow-xl overflow-hidden">
        {activeTab === 'admin' ? (
          /* TAB 1: ADMIN ACTION LOGS TABLE */
          loadingAdmin ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest animate-pulse">
                Đang tải nhật ký hệ thống...
              </span>
            </div>
          ) : currentLogs.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
              <AlertCircle className="w-12 h-12 text-zinc-650" />
              <span className="text-xs font-bold text-zinc-550 uppercase font-mono">
                Không tìm thấy dòng nhật ký nào phù hợp
              </span>
            </div>
          ) : (
            <div className="w-full overflow-x-auto custom-scrollbar">
              <table className="w-full table-fixed text-left border-collapse text-xs md:text-sm min-w-[1000px]">
                <thead>
                  <tr className="border-b border-[#1f2235] bg-[#0c0d14]/50 select-none font-mono text-[10px] font-black text-zinc-550 uppercase tracking-widest">
                    <th className="py-4 px-6 w-[180px]"><div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Thời gian</div></th>
                    <th className="py-4 px-6 w-[200px]">Admin Email</th>
                    <th className="py-4 px-6 w-[140px] text-center">Hành động</th>
                    <th className="py-4 px-6 w-[200px]">Đối tượng tác động</th>
                    <th className="py-4 px-6">Chi tiết hoạt động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2235]/40 font-semibold text-zinc-350">
                  {currentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#141622]/40 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-zinc-450 text-[11px] whitespace-nowrap">
                        {formatDateTime(log.dateObject)}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-zinc-300 text-xs">
                        {log.adminEmail || 'Unknown'}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex flex-col">
                          <span className="text-white text-xs font-bold font-mono max-w-48 truncate" title={log.targetName}>
                            {log.targetName || 'N/A'}
                          </span>
                          {log.targetId && (
                            <span className="text-[9px] text-zinc-550 font-mono mt-0.5 block max-w-48 truncate" title={log.targetId}>
                              ID: {log.targetId.slice(-8)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-zinc-400 text-xs leading-relaxed max-w-xs sm:max-w-md truncate" title={log.detail}>
                        {log.detail || 'Không có chi tiết'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* TAB 2: AI REASONING LOGS STREAM */
          loadingAi ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
                Đang kết nối luồng nhật ký AI suy luận...
              </span>
            </div>
          ) : currentLogs.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center justify-center gap-3 font-mono">
              <Cpu className="w-12 h-12 text-emerald-500/20 animate-pulse" />
              <span className="text-xs font-bold text-zinc-400 uppercase">
                Chưa có dữ liệu giao tiếp AI nào gần đây
              </span>
            </div>
          ) : (
            <div className="p-4 space-y-4 font-mono">
              {currentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-[#0b0d18] border border-emerald-500/20 hover:border-emerald-500/40 transition-all text-xs shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-zinc-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        ⏱️ {log.timeStr || formatDateTime(log.dateObject)}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                        👤 {log.userDisplayName || 'Học sinh'} ({log.userEmail || 'guest'})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                        📍 {log.currentPage || 'Trang chủ'}
                      </span>
                      {log.subject && (
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                          🏷️ {log.subject}
                        </span>
                      )}
                      {log.isCacheHit && (
                        <span className="px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-500/40 text-[10px] font-bold animate-pulse">
                          ⚡ CACHE HIT
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleCopyLog(log)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                      <span>{copiedId === log.id ? 'Đã chép' : 'Sao chép CMD'}</span>
                    </button>
                  </div>

                  <div className="space-y-1 text-[11px] leading-relaxed">
                    {log.terminalLines && log.terminalLines.length > 0 ? (
                      log.terminalLines.map((line, idx) => {
                        let textColor = 'text-zinc-300';
                        if (line.includes('🤖')) textColor = 'text-emerald-400 font-bold';
                        else if (line.includes('👤')) textColor = 'text-cyan-300';
                        else if (line.includes('📥')) textColor = 'text-amber-300 font-bold';
                        else if (line.includes('🎯')) textColor = 'text-yellow-300';
                        else if (line.includes('📚')) textColor = 'text-purple-300';
                        else if (line.includes('🧠')) textColor = 'text-blue-300';
                        else if (line.includes('⚡')) textColor = 'text-pink-400 font-bold';
                        else if (line.includes('💬')) textColor = 'text-emerald-300 italic';
                        return <div key={idx} className={textColor}>{line}</div>;
                      })
                    ) : (
                      <>
                        <div className="text-amber-300">📥 Câu hỏi: "{log.query}"</div>
                        <div className="text-purple-300">🎯 Intent: {log.intent} | Môn: {log.subject}</div>
                        {log.ragTopTopic && <div className="text-blue-300">📚 RAG Vector: {log.ragTopTopic} ({Math.round(log.ragScore * 100)}%)</div>}
                        {log.aiResponseText && <div className="text-emerald-300 italic">💬 AI Phản hồi: "{log.aiResponseText.slice(0, 150)}..."</div>}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Pagination Footer */}
        {currentLogsList.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-[#1f2235] bg-[#0c0d14]/30 flex items-center justify-between font-mono text-xs">
            <span className="text-zinc-500 font-bold">
              Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, currentLogsList.length)} trên tổng số {currentLogsList.length} logs
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 bg-[#141622] hover:bg-[#1b1e30] border border-[#1f2235] disabled:opacity-40 text-zinc-350 hover:text-white rounded-lg transition-all cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              
              <span className="px-3 py-1 font-bold text-white bg-pink-500/15 border border-pink-500/30 rounded-lg">
                Trang {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 bg-[#141622] hover:bg-[#1b1e30] border border-[#1f2235] disabled:opacity-40 text-zinc-350 hover:text-white rounded-lg transition-all cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
