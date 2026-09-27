'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, Play, Pause, Trash2, Search, RefreshCw, Copy, Check, ShieldAlert, Sparkles, Filter, Database, Cpu } from 'lucide-react';
import { playSound } from '@/lib/sound';

export default function AdminAILogHUD() {
  const user = useAppStore((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [accessDeniedToast, setAccessDeniedToast] = useState(false);
  const logEndRef = useRef(null);

  // Check if current user has Admin privileges
  const isAdmin = user && (user.role === 'admin' || user.email?.toLowerCase() === 'admin123@gmail.com' || user.displayName === 'admin');

  // Hotkey Listener for Alt + U
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Trigger ONLY on Alt + U (or Alt + u)
      if (e.altKey && (e.key === 'u' || e.key === 'U' || e.code === 'KeyU')) {
        e.preventDefault();
        
        if (!isAdmin) {
          try { playSound.click(); } catch (_) {}
          setAccessDeniedToast(true);
          setTimeout(() => setAccessDeniedToast(false), 3500);
          return;
        }

        setIsOpen((prev) => {
          const nextState = !prev;
          try {
            if (nextState) playSound.success();
            else playSound.click();
          } catch (_) {}
          return nextState;
        });
      }

      // Close on ESC
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin, isOpen]);

  // Real-time log synchronization from Firestore & Memory API
  useEffect(() => {
    if (!isOpen || isPaused || !isAdmin) return;

    let unsubscribe = null;

    try {
      // 1. Subscribe to Firestore collection 'ai_reasoning_logs'
      const q = query(collection(db, 'ai_reasoning_logs'), orderBy('timestamp', 'desc'), limit(150));
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const firestoreLogs = [];
        snapshot.forEach((docSnap) => {
          firestoreLogs.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (firestoreLogs.length > 0) {
          setLogs(firestoreLogs);
        }
      }, (err) => {
        console.warn('[AdminAILogHUD] Firestore Snapshot fallback to API polling:', err.message);
      });
    } catch (err) {
      console.warn('[AdminAILogHUD] Firestore sub error:', err);
    }

    // 2. Polling API fallback for local memory logs
    const fetchApiLogs = async () => {
      try {
        const res = await fetch(`/api/ai-reasoning-log?t=${Date.now()}`, {
          headers: { 'x-admin-secret-key': 'stemhub_admin_secret_key_2026' }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.logs) && data.logs.length > 0) {
          setLogs((prevLogs) => {
            // Merge & deduplicate by id
            const existingIds = new Set(prevLogs.map((l) => l.id));
            const newItems = data.logs.filter((l) => !existingIds.has(l.id));
            if (newItems.length === 0) return prevLogs;
            const merged = [...newItems, ...prevLogs];
            merged.sort((a, b) => b.timestamp - a.timestamp);
            return merged.slice(0, 200);
          });
        }
      } catch (_) {}
    };

    fetchApiLogs();
    const interval = setInterval(fetchApiLogs, 3000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
  }, [isOpen, isPaused, isAdmin]);

  // Auto-scroll to top/bottom when new log arrives
  useEffect(() => {
    if (autoScroll && isOpen && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, isOpen]);

  const handleCopyLog = (log) => {
    const cleanTerminalLines = (log.terminalLines || []).map(line =>
      line
        .replace(/\s*\([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\)/g, '')
        .replace(/\s*\(guest\)/gi, '')
        .replace(/\s*\(\s*\)/g, '')
    );
    const textToCopy = cleanTerminalLines.join('\n') || JSON.stringify(log, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(log.id);
    try { playSound.click(); } catch (_) {}
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearLogs = () => {
    setLogs([]);
    try { playSound.click(); } catch (_) {}
  };

  const filteredLogs = logs.filter((log) => {
    const queryMatch = searchQuery === '' || 
      (log.query && log.query.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.userDisplayName && log.userDisplayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.intent && log.intent.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.currentPage && log.currentPage.toLowerCase().includes(searchQuery.toLowerCase()));

    const subjectMatch = filterSubject === 'ALL' || (log.subject && log.subject.toUpperCase() === filterSubject);

    return queryMatch && subjectMatch;
  });

  return (
    <>
      {/* Access Denied Toast if Non-Admin presses Alt+U */}
      <AnimatePresence>
        {accessDeniedToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999999] px-5 py-3 rounded-2xl bg-rose-950/95 border border-rose-500/60 shadow-[0_10px_40px_rgba(244,63,94,0.4)] text-white flex items-center gap-3 backdrop-blur-xl font-sans select-none"
          >
            <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-rose-300 uppercase font-mono block">QUYỀN TRUY CẬP BỊ TỪ CHỐI (ALT+U)</span>
              <span className="text-zinc-300">Chỉ tài khoản Admin mới có quyền mở Terminal Nhật ký AI toàn cục.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Hidden Admin Terminal Modal (NO Screen Button!) */}
      <AnimatePresence>
        {isOpen && isAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 font-mono text-zinc-200 select-none overflow-hidden"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-6xl h-[88vh] bg-[#08090f]/95 border border-emerald-500/40 rounded-3xl shadow-[0_0_60px_rgba(16,185,129,0.25)] flex flex-col overflow-hidden relative"
            >
              {/* Terminal Window Top Bar */}
              <div className="px-5 py-3.5 bg-[#0d0f19] border-b border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Terminal className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-widest text-emerald-400 font-mono">
                        STEM HUB — GLOBAL AI REASONING TERMINAL
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-mono animate-pulse">
                        LIVE REASONING STREAM (ALT+U)
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 block font-mono">
                      Theo dõi quá trình suy luận, truy xuất RAG & dự đoán TF.js của toàn bộ người dùng thời gian thực
                    </span>
                  </div>
                </div>

                {/* Status Indicator & Close */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[10px] text-emerald-400 font-bold font-mono">
                    <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                    <span>{isPaused ? 'PAUSED' : 'LIVE STREAMING'}</span>
                  </div>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      try { playSound.click(); } catch (_) {}
                    }}
                    className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition-all cursor-pointer"
                    title="Đóng HUD (ESC hoặc Alt+U)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Controls & Filter Bar */}
              <div className="p-3.5 bg-[#090a12] border-b border-emerald-500/10 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Lọc theo tên học sinh, email, câu hỏi, vị trí trang hoặc intent..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#121422] border border-emerald-500/20 text-emerald-300 placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Subject Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-emerald-400" />
                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#121422] border border-emerald-500/20 text-emerald-300 text-xs focus:outline-none focus:border-emerald-500/50 font-mono cursor-pointer"
                  >
                    <option value="ALL">Tất cả môn học</option>
                    <option value="HÓA">Hóa học</option>
                    <option value="LÝ">Vật lý</option>
                    <option value="TOÁN">Toán học</option>
                    <option value="SINH">Sinh học</option>
                    <option value="TỔNG HỢP">Tổng hợp / STEM</option>
                  </select>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                      isPaused
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                    title={isPaused ? 'Tạm dừng nhận luồng log' : 'Đang chạy tự động'}
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
                  </button>

                  <button
                    onClick={handleClearLogs}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1.5 font-bold transition-all cursor-pointer"
                    title="Xóa màn hình log hiện tại"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Xóa màn hình</span>
                  </button>

                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#121422] border border-emerald-500/20 text-emerald-300 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span>Tự cuộn</span>
                  </label>
                </div>
              </div>

              {/* Log Terminal Display Box */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#05060a] scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent">
                {filteredLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500 font-mono">
                    <Cpu className="w-12 h-12 mb-3 text-emerald-500/20 animate-pulse" />
                    <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                      Chưa có nhật ký suy luận AI nào gần đây
                    </span>
                    <span className="text-xs text-zinc-600 mt-1 max-w-md">
                      Khi học sinh hoặc tài khoản bất kỳ tương tác với NOVA AI trên hệ thống, toàn bộ tiến trình suy luận, RAG Vector & dự đoán TF.js sẽ hiển thị tại đây thời gian thực.
                    </span>
                  </div>
                ) : (
                  filteredLogs.map((log, index) => (
                    <div
                      key={log.id || index}
                      className="p-4 rounded-2xl bg-[#0b0d18] border border-emerald-500/20 hover:border-emerald-500/40 transition-all font-mono text-xs shadow-md relative group"
                    >
                      {/* Log Header Tags */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-zinc-800">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            ⏱️ {log.timeStr || new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                          </span>

                          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                            👤 {log.userDisplayName || 'Học sinh'}
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

                        {/* Copy Code Line */}
                        <button
                          onClick={() => handleCopyLog(log)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                          <span>{copiedId === log.id ? 'Đã chép' : 'Sao chép'}</span>
                        </button>
                      </div>

                      {/* CMD Terminal Lines Output */}
                      <div className="space-y-1 text-zinc-300 font-mono text-[11px] leading-relaxed">
                        {log.terminalLines && log.terminalLines.length > 0 ? (
                          log.terminalLines.map((rawLine, lIdx) => {
                            const line = rawLine
                              .replace(/\s*\([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\)/g, '')
                              .replace(/\s*\(guest\)/gi, '')
                              .replace(/\s*\(\s*\)/g, '');
                            let textColor = 'text-zinc-300';
                            if (line.includes('🤖')) textColor = 'text-emerald-400 font-bold';
                            else if (line.includes('👤')) textColor = 'text-cyan-300';
                            else if (line.includes('📥')) textColor = 'text-amber-300 font-bold';
                            else if (line.includes('🎯')) textColor = 'text-yellow-300';
                            else if (line.includes('📚')) textColor = 'text-purple-300';
                            else if (line.includes('🧠')) textColor = 'text-blue-300';
                            else if (line.includes('⚡')) textColor = 'text-pink-400 font-bold';
                            else if (line.includes('💬')) textColor = 'text-emerald-300 italic';

                            return (
                              <div key={lIdx} className={`${textColor} break-words`}>
                                {line}
                              </div>
                            );
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
                  ))
                )}
                <div ref={logEndRef} />
              </div>

              {/* Bottom Footer Info */}
              <div className="px-5 py-2.5 bg-[#090a12] border-t border-emerald-500/20 flex items-center justify-between text-[10px] text-zinc-400 shrink-0 font-mono">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">● TỔNG NGHỆ SĨ LOG: {filteredLogs.length}</span>
                  <span>• Nhấn <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-200">Alt + U</kbd> bất kỳ lúc nào để Ẩn / Hiện HUD</span>
                </div>
                <div>STEM HUB ADMIN AI REASONING MONITOR V2.5.0</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
