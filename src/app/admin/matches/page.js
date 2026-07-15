'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, onSnapshot, doc, getDoc, updateDoc, addDoc, query, orderBy
} from 'firebase/firestore';
import { 
  Swords, ShieldAlert, FileText, RefreshCw, X, Play, 
  CheckCircle2, Clock, Ban, Search, HelpCircle, Activity
} from 'lucide-react';
import { playSound } from '@/lib/sound';
import { logAdminAction } from '@/lib/adminLogger';

export default function MatchMonitoring() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Logs Modal State
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [actionLogs, setActionLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Subscribe realtime to match actionLogs subcollection
  useEffect(() => {
    if (!selectedRoom) {
      setActionLogs([]);
      return;
    }

    setLoadingLogs(true);
    const logsColRef = collection(db, 'match_rooms', selectedRoom.id, 'actionLogs');
    const logsQuery = query(logsColRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setActionLogs(list);
      setLoadingLogs(false);
    }, (err) => {
      console.error("Lỗi khi tải actionLogs trận đấu:", err);
      setLoadingLogs(false);
    });

    return () => unsubscribe();
  }, [selectedRoom]);

  // Helper format log time
  const formatLogTime = (timestamp) => {
    if (!timestamp) return 'Chưa rõ';
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    if (isNaN(date.getTime())) return 'Chưa rõ';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // Lắng nghe realtime danh sách phòng đấu
  useEffect(() => {
    setLoading(true);
    const roomsCollection = collection(db, 'match_rooms');
    
    const unsubscribe = onSnapshot(roomsCollection, (snapshot) => {
      const roomList = [];
      snapshot.forEach((docSnap) => {
        roomList.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      
      // Sắp xếp theo thời gian tạo mới nhất
      roomList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setRooms(roomList);
      setLoading(false);
    }, (err) => {
      console.error("Lỗi khi lắng nghe phòng đấu:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Kiểm tra xem phòng đấu có thực sự đang diễn ra (dưới 15 phút từ lúc tạo)
  const isRoomActivePlaying = (room) => {
    if (room.status !== 'playing') return false;
    if (!room.createdAt) return false;
    const createdTime = new Date(room.createdAt).getTime();
    if (isNaN(createdTime)) return false;
    const now = Date.now();
    return (now - createdTime) < 15 * 60 * 1000; // 15 phút
  };

  // Lọc phòng đấu theo tab và tìm kiếm tên người chơi
  const getFilteredRooms = () => {
    return rooms.filter(room => {
      // Tìm kiếm tên người chơi 1 hoặc người chơi 2
      const name1 = (room.player1?.name || '').toLowerCase();
      const name2 = (room.player2?.name || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      const matchesSearch = name1.includes(search) || name2.includes(search) || room.id.toLowerCase().includes(search);

      // Lọc theo trạng thái/nghi vấn
      if (activeTab === 'playing') {
        return matchesSearch && isRoomActivePlaying(room);
      }
      if (activeTab === 'finished') {
        return matchesSearch && (room.status === 'result' || room.status === 'finished' || (room.status === 'playing' && !isRoomActivePlaying(room))) && !room.isCancelled;
      }
      if (activeTab === 'flagged') {
        const p1Flag = (room.player1TabSwitches || 0) > 3;
        const p2Flag = (room.player2TabSwitches || 0) > 3;
        return matchesSearch && (p1Flag || p2Flag);
      }
      return matchesSearch;
    });
  };

  // Xem log chi tiết của phòng
  const handleViewLogs = (room) => {
    playSound.click();
    setSelectedRoom(room);
  };

  // Hủy kết quả trận đấu & Thu hồi ELO (Rollback)
  const handleRollbackMatch = async (room) => {
    playSound.click();
    if (!room.winnerId) {
      alert("Trận đấu này hòa hoặc chưa kết thúc, không thể thực hiện rollback ELO.");
      return;
    }

    const winnerName = room.winnerId === room.player1?.uid ? room.player1.name : room.player2?.name;
    const confirmMsg = `CẢNH BÁO PHỤC HỒI:\n\nBạn đang hủy kết quả trận đấu ID: ${room.id}.\nHành động này sẽ:\n1. Thu hồi 25 ELO và 50 pha lê của người thắng (${winnerName}).\n2. Hoàn lại 15 ELO cho người thua.\n3. Đánh dấu trận đấu này bị hủy bỏ.\n\nBạn có chắc chắn muốn thực hiện?`;
    
    if (confirm(confirmMsg)) {
      try {
        setLoading(true);
        const p1Uid = room.player1?.uid;
        const p2Uid = room.player2?.uid;
        const isP1Winner = room.winnerId === p1Uid;

        const winnerUid = isP1Winner ? p1Uid : p2Uid;
        const loserUid = isP1Winner ? p2Uid : p1Uid;

        // Rollback Winner
        if (winnerUid) {
          const winnerDocRef = doc(db, 'users', winnerUid);
          const snap = await getDoc(winnerDocRef);
          if (snap.exists()) {
            const data = snap.data();
            const currentElo = data.stats?.elo !== undefined ? data.stats.elo : 1000;
            const currentWins = data.stats?.wins || 0;
            const currentCrystals = data.personalization?.crystals !== undefined ? data.personalization.crystals : 500;

            await updateDoc(winnerDocRef, {
              'stats.elo': Math.max(0, currentElo - 25),
              'stats.wins': Math.max(0, currentWins - 1),
              'personalization.crystals': Math.max(0, currentCrystals - 50)
            });
          }
        }

        // Rollback Loser
        if (loserUid) {
          const loserDocRef = doc(db, 'users', loserUid);
          const snap = await getDoc(loserDocRef);
          if (snap.exists()) {
            const data = snap.data();
            const currentElo = data.stats?.elo !== undefined ? data.stats.elo : 1000;
            const currentLosses = data.stats?.losses || 0;

            await updateDoc(loserDocRef, {
              'stats.elo': currentElo + 15,
              'stats.losses': Math.max(0, currentLosses - 1)
            });
          }
        }

        // Cập nhật trạng thái trận đấu trong Firestore
        const roomDocRef = doc(db, 'match_rooms', room.id);
        await updateDoc(roomDocRef, {
          isCancelled: true,
          winnerId: null,
          cancelledAt: new Date().toISOString()
        });

        await logAdminAction("CANCEL_MATCH", room.id, `${room.player1?.name || 'Ẩn danh'} vs ${room.player2?.name || 'Ẩn danh'}`, "Hủy kết quả trận đấu và thu hồi ELO/Pha lê");

        // Tạo system alert để log lại hoạt động
        await addDoc(collection(db, 'system_alerts'), {
          type: 'security',
          message: `Admin đã hủy trận đấu ${room.id} và rollback ELO của người chơi do phát hiện nghi vấn.`,
          timestamp: new Date().toISOString()
        });

        playSound.success();
        alert("Đã hủy trận đấu và rollback ELO thành công!");
      } catch (err) {
        console.error("Lỗi khi rollback trận đấu:", err);
        alert("Đã xảy ra lỗi trong quá trình rollback.");
      } finally {
        setLoading(false);
      }
    }
  };

  const getSubjectLabel = (subj) => {
    const subjects = {
      math: { label: 'Toán học', icon: '📐', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
      physics: { label: 'Vật lý', icon: '⚡', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
      chemistry: { label: 'Hóa học', icon: '🧪', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
      biology: { label: 'Sinh học', icon: '🧬', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
    };
    return subjects[subj] || { label: 'Khác', icon: '🎮', color: 'text-zinc-400 bg-zinc-800' };
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Vừa xong';
    try {
      const d = new Date(isoString);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} - ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    } catch (e) {
      return 'Lỗi giờ';
    }
  };

  const filteredRooms = getFilteredRooms();

  // Thống kê nhanh
  const stats = {
    total: rooms.length,
    active: rooms.filter(r => isRoomActivePlaying(r)).length,
    finished: rooms.filter(r => (r.status === 'result' || r.status === 'finished' || (r.status === 'playing' && !isRoomActivePlaying(r))) && !r.isCancelled).length,
    flagged: rooms.filter(r => (r.player1TabSwitches || 0) > 3 || (r.player2TabSwitches || 0) > 3).length
  };

  return (
    <div className="space-y-6 text-zinc-300 font-sans select-none">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wider font-mono">
          Giám sát trận đấu realtime
        </h1>
        <p className="text-xs text-zinc-500 font-semibold mt-1">
          Theo dõi tiến trình các trận PvP thời gian thực, giám sát chuyển tab gian lận và xử lý thu hồi ELO.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng số trận', value: stats.total, color: 'text-zinc-400' },
          { label: 'Đang thi đấu', value: stats.active, color: 'text-cyan-400 font-bold animate-pulse' },
          { label: 'Đã hoàn thành', value: stats.finished, color: 'text-emerald-400' },
          { label: 'Nghi vấn gian lận', value: stats.flagged, color: stats.flagged > 0 ? 'text-rose-500 font-black animate-bounce' : 'text-zinc-500' }
        ].map((s, idx) => (
          <div key={idx} className="bg-[#0f1017]/60 border border-[#1f2235] p-4.5 rounded-2xl flex flex-col justify-center gap-1 shadow-lg">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider font-mono">{s.label}</span>
            <span className={`text-xl font-black font-mono leading-none ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-[#0f1017]/60 border border-[#1f2235] p-4 rounded-2xl shadow-lg">
        {/* Search */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Tìm theo Tên người chơi hoặc Mã phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white focus:outline-none placeholder-zinc-500 transition-all font-mono"
          />
        </div>

        {/* Tab filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'playing', label: 'Đang đấu' },
            { id: 'finished', label: 'Đã kết thúc' },
            { id: 'flagged', label: `Nghi vấn (${stats.flagged})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                playSound.click();
                setActiveTab(tab.id);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                activeTab === tab.id
                  ? 'bg-pink-500/10 border-pink-500/30 text-white shadow-md'
                  : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Realtime Rooms Grid */}
      {loading ? (
        <div className="py-20 bg-[#0f1017]/60 border border-[#1f2235] rounded-2xl flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono font-bold text-zinc-550 tracking-widest uppercase animate-pulse">
            Đang tải dữ liệu trận đấu...
          </span>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="py-20 bg-[#0f1017]/60 border border-[#1f2235] rounded-2xl text-center flex flex-col items-center justify-center gap-3">
          <Activity className="w-12 h-12 text-zinc-650 animate-pulse" />
          <span className="text-xs font-bold text-zinc-550 uppercase font-mono">
            Không tìm thấy trận đấu nào phù hợp
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRooms.map((room) => {
            const subj = getSubjectLabel(room.subject);
            const p1Flag = (room.player1TabSwitches || 0) > 3;
            const p2Flag = (room.player2TabSwitches || 0) > 3;
            const isSuspicious = p1Flag || p2Flag;

            return (
              <div 
                key={room.id}
                className={`bg-[#0f1017]/60 border p-5 rounded-2xl transition-all duration-200 shadow-xl flex flex-col justify-between gap-4 ${
                  isSuspicious 
                    ? 'border-rose-500/25 shadow-[0_0_20px_rgba(244,63,94,0.05)]' 
                    : 'border-[#1f2235] hover:border-pink-500/10'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider font-mono">
                    <span className={`px-2 py-0.5 rounded border ${subj.color}`}>
                      {subj.icon} {subj.label}
                    </span>
                    <span className="text-zinc-500">
                      ID: {room.id.slice(-6)}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase font-mono">
                    {room.isCancelled ? (
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-450 border border-rose-500/20">Bị hủy</span>
                    ) : room.status === 'playing' ? (
                      isRoomActivePlaying(room) ? (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1 animate-pulse">
                          <Play className="w-2.5 h-2.5 fill-cyan-400" /> Đang đấu
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-550 border border-zinc-750 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> Bỏ dở (Quá hạn)
                        </span>
                      )
                    ) : (room.status === 'result' || room.status === 'finished') ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Xong
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">Chờ</span>
                    )}
                  </div>
                </div>

                {/* Match progress visual */}
                <div className="space-y-4">
                  {/* Player 1 Row */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className="text-white flex items-center gap-1.5">
                        {room.player1?.name || 'Đang chờ...'}
                        {p1Flag && <ShieldAlert className="w-3.5 h-3.5 text-rose-500 animate-pulse" />}
                      </span>
                      <span className="text-zinc-400 font-medium">
                        {room.player1Progress || 0}% ELO: {room.player1?.elo || 1000}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-[#08090d] rounded-full overflow-hidden border border-[#1f2235]">
                      <div 
                        className={`h-full transition-all duration-300 rounded-full ${p1Flag ? 'bg-rose-500' : 'bg-pink-500'}`} 
                        style={{ width: `${room.player1Progress || 0}%` }} 
                      />
                    </div>
                    {/* Tab switches indicator */}
                    <div className="flex justify-between items-center text-[9px] font-mono text-zinc-550">
                      <span>Rời tab: {room.player1TabSwitches || 0}</span>
                      {p1Flag && <span className="text-rose-500 font-black animate-pulse">Cảnh báo gian lận!</span>}
                    </div>
                  </div>

                  {/* Player 2 Row */}
                  {room.player2 ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="text-white flex items-center gap-1.5">
                          {room.player2?.name}
                          {p2Flag && <ShieldAlert className="w-3.5 h-3.5 text-rose-500 animate-pulse" />}
                        </span>
                        <span className="text-zinc-400 font-medium">
                          {room.player2Progress || 0}% ELO: {room.player2?.elo || 1000}
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-[#08090d] rounded-full overflow-hidden border border-[#1f2235]">
                        <div 
                          className={`h-full transition-all duration-300 rounded-full ${p2Flag ? 'bg-rose-500' : 'bg-cyan-400'}`} 
                          style={{ width: `${room.player2Progress || 0}%` }} 
                        />
                      </div>
                      {/* Tab switches indicator */}
                      <div className="flex justify-between items-center text-[9px] font-mono text-zinc-550">
                        <span>Rời tab: {room.player2TabSwitches || 0}</span>
                        {p2Flag && <span className="text-rose-500 font-black animate-pulse">Cảnh báo gian lận!</span>}
                      </div>
                    </div>
                  ) : (
                    <div className="py-2.5 text-center bg-[#08090d]/50 border border-dashed border-[#1f2235] rounded-xl text-[10px] text-zinc-600 font-mono font-black uppercase tracking-wider">
                      ĐANG CHỜ ĐỐI THỦ GIA NHẬP...
                    </div>
                  )}
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#1f2235]/40 text-xs font-semibold">
                  <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(room.createdAt)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* View Logs Button */}
                    <button
                      onClick={() => handleViewLogs(room)}
                      className="px-3.5 py-1.5 bg-[#141622] hover:bg-[#1b1e30] border border-[#1f2235] text-zinc-350 hover:text-white rounded-lg transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> Nhật ký
                    </button>

                    {/* Rollback Button (only for finished, non-cancelled matches with a winner) */}
                    {(room.status === 'result' || room.status === 'finished') && !room.isCancelled && room.winnerId && (
                      <button
                        onClick={() => handleRollbackMatch(room)}
                        title="Hủy kết quả & thu hồi ELO/Pha lê"
                        className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-rose-450 hover:text-white rounded-lg transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                      >
                        <Ban className="w-3.5 h-3.5" /> Thu hồi
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED MATCH LOGS MODAL */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="w-full max-w-2xl bg-[#0c0d14] border border-[#1f2235] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[#1f2235] flex items-center justify-between bg-[#0f1017]/80">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-pink-500 filter drop-shadow-[0_0_6px_rgba(244,63,94,0.2)]" />
                <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">
                  Nhật ký hành động đấu trường
                </h3>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="p-1.5 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Timeline Logs */}
            <div className="p-6 overflow-y-auto flex-1 bg-[#08090d]/50 space-y-4 max-h-[60vh]">
              {loadingLogs ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-mono text-zinc-550 uppercase">Đang tải nhật ký...</span>
                </div>
              ) : actionLogs.length === 0 ? (
                <div className="py-20 text-center text-xs font-bold text-zinc-650 font-mono">
                  CHƯA CÓ DỮ LIỆU HOẠT ĐỘNG TRẬN ĐẤU
                </div>
              ) : (
                <div className="relative border-l-2 border-[#1f2235] pl-6 ml-3 space-y-6">
                  {actionLogs.map((log, idx) => {
                    const isSystem = log.userId === 'system' || !log.userId;
                    const isP1 = log.userId === selectedRoom.player1?.uid;
                    const isP2 = log.userId === selectedRoom.player2?.uid;
                    const isAlert = log.actionText.includes('🚨') || log.actionText.includes('CẢNH BÁO') || log.actionText.includes('gian lận') || log.actionText.includes('rời') || log.actionText.includes('Rời');
                    const isCorrect = log.actionText.includes('đúng') || log.actionText.includes('ĐÚNG') || log.actionText.includes('🎯') || log.actionText.includes('thắng');
                    
                    return (
                      <div key={log.id || idx} className="relative flex flex-col gap-1.5">
                        {/* Timeline Node Icon */}
                        <div className={`absolute -left-[32px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isAlert ? 'bg-rose-950 border-rose-500 text-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]' :
                          isCorrect ? 'bg-emerald-950 border-emerald-500 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' :
                          isP1 ? 'bg-pink-950 border-pink-500 text-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.3)]' :
                          isP2 ? 'bg-cyan-950 border-cyan-500 text-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.3)]' :
                          'bg-zinc-900 border-zinc-700 text-zinc-400'
                        }`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        </div>

                        {/* Log Row Header */}
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                          <span className="text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatLogTime(log.timestamp)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-bold uppercase ${
                            isSystem ? 'bg-zinc-800 text-zinc-400' :
                            isP1 ? 'bg-pink-500/10 text-pink-400 border border-pink-500/10' :
                            isP2 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/10' :
                            'bg-zinc-800 text-zinc-400'
                          }`}>
                            {log.playerName || (isP1 ? selectedRoom.player1?.name : isP2 ? selectedRoom.player2?.name : 'Hệ thống')}
                          </span>
                        </div>

                        {/* Log Text */}
                        <div className={`text-xs font-semibold font-mono leading-relaxed p-3 bg-[#0f1017]/70 border rounded-xl ${
                          isAlert ? 'border-rose-500/20 text-rose-450 bg-rose-500/[0.02]' :
                          isCorrect ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/[0.02]' :
                          'border-[#1f2235] text-zinc-300'
                        }`}>
                          {log.actionText}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#1f2235] bg-[#0f1017]/70 flex items-center justify-end">
              <button
                onClick={() => setSelectedRoom(null)}
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
