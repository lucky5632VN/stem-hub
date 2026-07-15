'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, getDocs, doc, writeBatch, addDoc, updateDoc, deleteDoc, onSnapshot, getDoc 
} from 'firebase/firestore';
import { 
  Trophy, Calendar, RefreshCw, Plus, Trash2, X, AlertTriangle, 
  Search, CheckCircle2, ShieldAlert, Award, Star, Compass, Download
} from 'lucide-react';
import { playSound } from '@/lib/sound';
import { logAdminAction } from '@/lib/adminLogger';

export default function LeaderboardTournamentManagement() {
  const [users, setUsers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [resetting, setResetting] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');

  // Excel Export Handler
  const exportLeaderboardToExcel = () => {
    playSound.click();
    try {
      const { utils, writeFile } = require('xlsx');
      
      const excelData = filteredUsers.map((player, index) => ({
        "Hạng": index + 1,
        "ID Học Sinh": player.id,
        "Họ và Tên": player.name,
        "ELO": player.elo,
        "Cấp độ": player.level,
        "Danh hiệu": player.activeTitle,
        "Số trận thắng": player.wins,
        "Số trận thua": player.losses,
        "Tỉ lệ thắng (%)": player.wins + player.losses > 0 
          ? Math.round((player.wins / (player.wins + player.losses)) * 100) 
          : 0
      }));

      const ws = utils.json_to_sheet(excelData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Bảng Xếp Hạng ELO");

      ws['!cols'] = [
        { wch: 8 },  // Hạng
        { wch: 30 }, // ID Học Sinh
        { wch: 25 }, // Họ và Tên
        { wch: 10 }, // ELO
        { wch: 10 }, // Cấp độ
        { wch: 25 }, // Danh hiệu
        { wch: 15 }, // Số trận thắng
        { wch: 15 }, // Số trận thua
        { wch: 15 }  // Tỉ lệ thắng (%)
      ];

      writeFile(wb, `Bang_xep_hang_ELO_STEM_Arena_${new Date().toISOString().slice(0, 10)}.xlsx`);

      logAdminAction(
        "EXPORT_EXCEL",
        "LEADERBOARD",
        "Bảng vàng ELO",
        `Xuất thành công bảng xếp hạng gồm ${excelData.length} học sinh ra file Excel.`
      );
    } catch (err) {
      console.error("Lỗi khi xuất file Excel bảng xếp hạng:", err);
      alert("Đã xảy ra lỗi khi xuất file Excel. Vui lòng kiểm tra console.");
    }
  };

  // Modals States
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Tournament Form Values
  const [formValues, setFormValues] = useState({
    title: '',
    subject: 'all',
    minElo: 1000,
    startDate: '',
    endDate: '',
    prize: '500 Pha lê + Huy hiệu Độc Quyền',
    status: 'upcoming'
  });

  // Đồng bộ realtime danh sách học sinh theo ELO (bảng xếp hạng)
  useEffect(() => {
    setLoadingUsers(true);
    const usersCollection = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
      const uList = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Bỏ qua tài khoản admin
        if (data.role === 'admin' || data.email?.toLowerCase() === 'admin123@gmail.com' || docSnap.id === 'admin') {
          return;
        }
        uList.push({
          id: docSnap.id,
          name: data.displayName || data.name || 'Học sinh ẩn danh',
          elo: data.stats?.elo !== undefined ? data.stats.elo : 1000,
          wins: data.stats?.wins || 0,
          losses: data.stats?.losses || 0,
          level: data.stats?.level || 1,
          activeTitle: data.personalization?.activeTitle || 'apprentice',
          subjectStrengths: data.stats?.subjectStrengths || null
        });
      });
      // Sắp xếp ELO giảm dần
      uList.sort((a, b) => b.elo - a.elo);
      setUsers(uList);
      setLoadingUsers(false);
    }, (err) => {
      console.error("Lỗi đồng bộ bảng xếp hạng ELO:", err);
      setLoadingUsers(false);
    });

    return () => unsubscribe();
  }, []);

  // Đồng bộ realtime danh sách giải đấu
  useEffect(() => {
    setLoadingTournaments(true);
    const tournamentCollection = collection(db, 'tournaments');
    const unsubscribe = onSnapshot(tournamentCollection, (snapshot) => {
      const tList = [];
      snapshot.forEach((docSnap) => {
        tList.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      // Sắp xếp ngày tạo mới nhất
      tList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setTournaments(tList);
      setLoadingTournaments(false);
    }, (err) => {
      console.error("Lỗi đồng bộ giải đấu:", err);
      setLoadingTournaments(false);
    });

    return () => unsubscribe();
  }, []);

  // Tạo giải đấu mới
  const handleSaveTournament = async (e) => {
    e.preventDefault();
    playSound.click();
    
    const { title, subject, minElo, startDate, endDate, prize, status } = formValues;

    if (!title.trim() || !startDate || !endDate) {
      alert("Vui lòng điền đầy đủ tiêu đề, ngày bắt đầu và kết thúc giải đấu.");
      return;
    }

    const payload = {
      title: title.trim(),
      subject,
      minElo: Number(minElo),
      startDate,
      endDate,
      prize: prize.trim(),
      status,
      participantsCount: 0,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'tournaments'), payload);
      await logAdminAction("ADD_TOURNAMENT", docRef.id, payload.title, "Tạo giải đấu mới");
      playSound.success();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Lỗi khi thêm giải đấu:", err);
    }
  };

  const mapFrameNameToId = (frameName) => {
    const name = frameName.toLowerCase();
    if (name.includes('hoang kim') || name.includes('vang') || name.includes('gold') || name.includes('trung thuong')) {
      return 'gold_vip';
    }
    if (name.includes('kim cuong') || name.includes('dai de') || name.includes('quan chu') || name.includes('sovereign')) {
      return 'top_1_sovereign';
    }
    if (name.includes('cong nghe') || name.includes('cyan') || name.includes('tech')) {
      return 'cyan_tech';
    }
    if (name.includes('lua') || name.includes('fire') || name.includes('neon')) {
      return 'neon_fire';
    }
    if (name.includes('vu tru') || name.includes('nebula') || name.includes('cosmic')) {
      return 'cosmic_nebula';
    }
    if (name.includes('ho den') || name.includes('gravity') || name.includes('blackhole')) {
      return 'blackhole_gravity';
    }
    if (name.includes('da vu tru') || name.includes('overlord') || name.includes('multiverse')) {
      return 'multiverse_overlord';
    }
    if (name.includes('bac') || name.includes('silver')) {
      return 'top_100_silver';
    }
    return 'gold_vip';
  };

  // Cập nhật trạng thái giải đấu
  const handleUpdateTournamentStatus = async (id, currentStatus) => {
    playSound.click();
    const nextStatus = currentStatus === 'upcoming' ? 'active' : 'ended';

    if (nextStatus === 'ended') {
      const tDoc = tournaments.find(t => t.id === id);
      if (!tDoc) return;

      let winner = null;
      if (users.length > 0) {
        if (tDoc.subject && tDoc.subject !== 'all') {
          // Tìm học sinh có điểm mạnh môn này cao nhất
          winner = [...users].sort((a, b) => {
            const aStrength = a.subjectStrengths?.[tDoc.subject] || 1000;
            const bStrength = b.subjectStrengths?.[tDoc.subject] || 1000;
            return bStrength - aStrength;
          })[0];
        } else {
          winner = users[0];
        }
      }

      const winnerName = winner ? winner.name : "không xác định";
      const confirmMsg = `Bạn có chắc chắn muốn kết thúc giải đấu "${tDoc.title}" không?\n\n` + 
                         `🏆 Học viên vô địch dự kiến: ${winnerName} (ELO: ${winner ? winner.elo : 0})\n` +
                         `🎁 Phần thưởng sẽ được tự động trao: ${tDoc.prize || "Không có"}`;
      
      if (!confirm(confirmMsg)) return;

      // Trao thưởng
      if (winner && tDoc.prize) {
        try {
          const winnerRef = doc(db, 'users', winner.id);
          const winnerSnap = await getDoc(winnerRef);
          if (winnerSnap.exists()) {
            const winnerData = winnerSnap.data();
            const personalization = winnerData.personalization || {};
            let currentCrystals = personalization.crystals || 0;
            let unlockedTitles = personalization.unlockedTitles || ['apprentice'];
            let unlockedFrames = personalization.unlockedFrames || ['default'];

            const prizeText = tDoc.prize;

            // 1. Pha lê
            const crystalMatch = prizeText.match(/(\d+)\s*(Pha lê|Pha le|Crystals|Crystal)/i);
            let addedCrystals = 0;
            if (crystalMatch) {
              addedCrystals = parseInt(crystalMatch[1], 10);
              currentCrystals += addedCrystals;
            }

            // 2. Huy hiệu / Danh hiệu
            const titleMatch = prizeText.match(/(Huy hiệu|Danh hiệu)\s+([^\+\,\n]+)/i);
            let newTitle = null;
            if (titleMatch) {
              newTitle = `${titleMatch[1]} ${titleMatch[2].trim()}`;
              if (!unlockedTitles.includes(newTitle)) {
                unlockedTitles.push(newTitle);
              }
            }

            // 3. Khung viền
            const frameMatch = prizeText.match(/(Khung viền|Khung vien)\s+([^\+\,\n]+)/i);
            let newFrame = null;
            let frameLabel = "";
            if (frameMatch) {
              frameLabel = frameMatch[2].trim();
              newFrame = mapFrameNameToId(frameLabel);
              if (!unlockedFrames.includes(newFrame)) {
                unlockedFrames.push(newFrame);
              }
            }

            await updateDoc(winnerRef, {
              'personalization.crystals': currentCrystals,
              'personalization.unlockedTitles': unlockedTitles,
              'personalization.unlockedFrames': unlockedFrames
            });

            alert(`🎉 Kết thúc giải đấu thành công!\n` +
                  `🏆 Học viên chiến thắng: ${winnerName}\n` +
                  `🎁 Phần thưởng đã trao:\n` +
                  (addedCrystals > 0 ? `  - +${addedCrystals} Pha lê (Tổng hiện tại: ${currentCrystals})\n` : "") +
                  (newTitle ? `  - Mở khóa danh hiệu: ${newTitle}\n` : "") +
                  (newFrame ? `  - Mở khóa khung viền: ${frameLabel} (${newFrame})\n` : ""));
          }
        } catch (err) {
          console.error("Lỗi khi trao thưởng giải đấu:", err);
          alert("Có lỗi xảy ra khi tự động trao thưởng: " + err.message);
        }
      }
    }

    try {
      const docRef = doc(db, 'tournaments', id);
      await updateDoc(docRef, { status: nextStatus });
      await logAdminAction("UPDATE_TOURNAMENT_STATUS", id, tDoc ? tDoc.title : 'Giải đấu', `Cập nhật trạng thái giải đấu sang: ${nextStatus === 'active' ? 'Đang diễn ra' : 'Đã kết thúc'}`);
      playSound.success();
    } catch (err) {
      console.error("Lỗi cập nhật giải đấu:", err);
    }
  };

  // Xóa giải đấu
  const handleDeleteTournament = async (id) => {
    playSound.click();
    const tDoc = tournaments.find(t => t.id === id);
    if (confirm("Bạn có chắc chắn muốn xóa giải đấu này khỏi hệ thống?")) {
      try {
        await deleteDoc(doc(db, 'tournaments', id));
        await logAdminAction("DELETE_TOURNAMENT", id, tDoc ? tDoc.title : 'Giải đấu', "Xóa giải đấu khỏi hệ thống");
        playSound.success();
      } catch (err) {
        console.error("Lỗi xóa giải đấu:", err);
      }
    }
  };

  // Reset Mùa giải & Lưu trữ lịch sử
  const handleResetSeason = async () => {
    playSound.click();
    const seasonName = prompt("Nhập tên Mùa giải vừa kết thúc để lưu trữ (ví dụ: 'Mùa 1 - Chiến thần Lượng tử'):");
    if (!seasonName) return;

    const doubleCheck = confirm(`CẢNH BÁO TỐI CAO:\n\nHành động này sẽ:\n1. Lưu lại Top 3 người chơi dẫn đầu vào Bảng vàng lưu trữ.\n2. Thiết lập lại ELO của toàn bộ học sinh về 1000.\n3. Reset số trận Thắng/Thua về 0.\n\nBạn có chắc chắn muốn kết thúc mùa giải hiện tại?`);
    
    if (doubleCheck) {
      try {
        setResetting(true);
        const batch = writeBatch(db);

        // Lấy Top 3 hiện tại
        const top3 = users.slice(0, 3).map((u, idx) => ({
          rank: idx + 1,
          name: u.name,
          elo: u.elo
        }));

        // 1. Lưu thông tin mùa giải cũ vào bộ sưu tập `seasons`
        await addDoc(collection(db, 'seasons'), {
          seasonName,
          endedAt: new Date().toISOString(),
          top3
        });

        // 2. Cập nhật chỉ số reset của từng user
        const querySnapshot = await getDocs(collection(db, 'users'));
        querySnapshot.forEach((docSnap) => {
          const uData = docSnap.data();
          if (uData.role === 'admin' || uData.email?.toLowerCase() === 'admin123@gmail.com' || docSnap.id === 'admin') {
            return;
          }
          const userRef = doc(db, 'users', docSnap.id);
          batch.update(userRef, {
            'stats.elo': 1000,
            'stats.wins': 0,
            'stats.losses': 0
          });
        });

        await batch.commit();
        await logAdminAction("RESET_SEASON", seasonName, "Thiết lập lại mùa giải", "Reset ELO và lưu trữ kết quả");
        playSound.success();
        alert("Đã hoàn thành thiết lập lại mùa giải mới! Toàn bộ ELO đã reset về 1000.");
      } catch (err) {
        console.error("Lỗi thiết lập lại mùa giải:", err);
        alert("Đã xảy ra lỗi trong quá trình reset.");
      } finally {
        setResetting(false);
      }
    }
  };

  const getSubjectIcon = (subj) => {
    const subjects = {
      math: '📐 Toán học',
      physics: '⚡ Vật lý',
      chemistry: '🧪 Hóa học',
      biology: '🧬 Sinh học',
      all: '🏆 Liên môn STEM'
    };
    return subjects[subj] || '🏆 Giải đấu STEM';
  };

  // Lọc danh sách ELO
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.activeTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-zinc-300 font-sans select-none">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider font-mono">
            Giải đấu & Bảng xếp hạng ELO
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Quản lý bảng vàng ELO học sinh, reset mùa giải mới, và thiết lập các sự kiện giải đấu ngắn hạn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Reset Season button */}
          <button
            onClick={handleResetSeason}
            disabled={resetting}
            className="px-4 py-2.5 bg-[#16120e] hover:bg-[#201812] border border-amber-500/20 hover:border-amber-500 text-xs font-bold text-amber-500 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} /> 
            {resetting ? 'Đang đặt lại...' : 'Reset mùa giải'}
          </button>

          {/* Create tournament button */}
          <button
            onClick={() => { playSound.click(); setIsModalOpen(true); }}
            className="px-4 py-2.5 bg-pink-500 hover:bg-pink-600 border border-pink-500/30 hover:border-pink-400 text-xs font-bold text-white rounded-xl transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-lg"
          >
            <Plus className="w-4 h-4" /> Tạo giải đấu
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMN 1 & 2: LEADERBOARD TABLE */}
        <div className="bg-[#0f1017]/60 border border-[#1f2235] p-5 rounded-2xl shadow-xl space-y-4 lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1f2235]/40 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  Bảng vàng xếp hạng học sinh
                </h2>
              </div>

              {/* Action bar */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Tìm học sinh..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-1.5 px-3 text-[10px] font-semibold text-white focus:outline-none placeholder-zinc-650 transition-all font-mono w-32"
                />
                
                <button
                  onClick={exportLeaderboardToExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-450 hover:text-emerald-400 text-[10px] font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất Excel</span>
                </button>
              </div>
            </div>

            {/* Leaderboard list */}
            {loadingUsers ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-mono text-zinc-550 uppercase">Đang tải bảng xếp hạng...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-20 text-center text-xs font-bold text-zinc-600 font-mono">
                KHÔNG TÌM THẤY DỮ LIỆU BẢNG VÀNG ELO
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-96 pr-1 custom-scrollbar">
                {filteredUsers.map((player, idx) => {
                  const winRatio = player.wins + player.losses > 0 
                    ? Math.round((player.wins / (player.wins + player.losses)) * 100) 
                    : 0;

                  return (
                    <div 
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-[#08090d]/60 border border-[#1f2235]/45 hover:border-pink-500/10 rounded-xl transition-all font-mono text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${
                          idx === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          idx === 1 ? 'bg-zinc-400/20 text-zinc-300 border border-zinc-400/30' :
                          idx === 2 ? 'bg-amber-800/20 text-amber-600 border border-amber-800/30' :
                          'bg-zinc-800/40 text-zinc-500'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-white font-bold">{player.name}</div>
                          <div className="text-[9px] text-zinc-550 font-bold mt-0.5">Lv.{player.level} • {player.activeTitle}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 text-right">
                        <div className="hidden sm:block">
                          <div className="text-[10px] text-zinc-400 font-bold">Thắng: {winRatio}%</div>
                          <div className="text-[8px] text-zinc-550">{player.wins}W / {player.losses}L</div>
                        </div>
                        <div className="shrink-0">
                          <div className="text-rose-450 font-black text-sm">{player.elo}</div>
                          <span className="text-[8px] text-zinc-650 block mt-0.5">ELO</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: TOURNAMENTS LIST */}
        <div className="bg-[#0f1017]/60 border border-[#1f2235] p-5 rounded-2xl shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#1f2235]/40 pb-3">
              <Calendar className="w-5 h-5 text-pink-500" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                Sự kiện giải đấu
              </h2>
            </div>

            {loadingTournaments ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-mono text-zinc-550 uppercase">Đang tải giải đấu...</span>
              </div>
            ) : tournaments.length === 0 ? (
              <div className="py-20 text-center text-xs font-bold text-zinc-600 font-mono">
                CHƯA CÓ GIẢI ĐẤU NÀO ĐƯỢC TẠO
              </div>
            ) : (
              <div className="space-y-3.5 overflow-y-auto max-h-96 pr-1 custom-scrollbar">
                {tournaments.map((t) => (
                  <div 
                    key={t.id}
                    className="p-3.5 bg-[#08090d]/60 border border-[#1f2235] rounded-xl flex flex-col justify-between gap-3 text-xs font-mono relative overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      {/* Badge status */}
                      <div className="flex justify-between items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                          t.status === 'active' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                          t.status === 'ended' ? 'bg-zinc-800 text-zinc-500 border-zinc-700' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {t.status === 'active' ? 'Đang diễn ra' : t.status === 'ended' ? 'Đã kết thúc' : 'Sắp diễn ra'}
                        </span>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          {t.status !== 'ended' && (
                            <button
                              onClick={() => handleUpdateTournamentStatus(t.id, t.status)}
                              title={t.status === 'upcoming' ? 'Kích hoạt giải đấu' : 'Kết thúc giải đấu'}
                              className="p-1 hover:bg-white/5 rounded text-zinc-400 hover:text-white transition-all cursor-pointer border border-transparent hover:border-zinc-750"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-450" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTournament(t.id)}
                            title="Xóa giải đấu"
                            className="p-1 hover:bg-rose-500/10 rounded text-rose-500 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Info Title */}
                      <div className="text-white font-bold leading-normal truncate">{t.title}</div>
                      <div className="text-[10px] text-zinc-450 font-bold">{getSubjectIcon(t.subject)}</div>
                    </div>

                    <div className="space-y-1 text-[9px] text-zinc-500 border-t border-[#1f2235]/40 pt-2 font-semibold">
                      <div>Thời gian: {t.startDate} đến {t.endDate}</div>
                      <div>Yêu cầu: ELO {t.minElo}+</div>
                      <div className="text-pink-400 mt-1">Phần thưởng: {t.prize}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE TOURNAMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <form 
            onSubmit={handleSaveTournament}
            className="w-full max-w-md bg-[#0c0d14] border border-[#1f2235] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[#1f2235] flex items-center justify-between bg-[#0f1017]/80">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-pink-500" />
                <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">
                  Tạo giải đấu mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs font-semibold">
              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Tên giải đấu</label>
                <input
                  type="text"
                  required
                  value={formValues.title}
                  onChange={(e) => setFormValues(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ví dụ: Đại chiến Lượng tử Hè 2026..."
                  className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2 px-3 text-xs text-white focus:outline-none placeholder-zinc-700 transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Subject selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Môn thi đấu</label>
                  <select
                    value={formValues.subject}
                    onChange={(e) => setFormValues(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-[#08090d] border border-[#1f2235] rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50"
                  >
                    <option value="all">Liên môn STEM</option>
                    <option value="math">Toán học</option>
                    <option value="physics">Vật lý</option>
                    <option value="chemistry">Hóa học</option>
                    <option value="biology">Sinh học</option>
                  </select>
                </div>

                {/* Min elo */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">ELO Tối thiểu</label>
                  <input
                    type="number"
                    value={formValues.minElo}
                    onChange={(e) => setFormValues(prev => ({ ...prev, minElo: e.target.value }))}
                    className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2 px-3 text-xs text-white focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Start Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Ngày bắt đầu</label>
                  <input
                    type="date"
                    required
                    value={formValues.startDate}
                    onChange={(e) => setFormValues(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2 px-3 text-xs text-white focus:outline-none transition-all font-mono"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Ngày kết thúc</label>
                  <input
                    type="date"
                    required
                    value={formValues.endDate}
                    onChange={(e) => setFormValues(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2 px-3 text-xs text-white focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Prize */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Phần thưởng giải đấu</label>
                <input
                  type="text"
                  value={formValues.prize}
                  onChange={(e) => setFormValues(prev => ({ ...prev, prize: e.target.value }))}
                  placeholder="Ví dụ: 500 Pha lê + Huy hiệu Đại Đế..."
                  className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2 px-3 text-xs text-white focus:outline-none placeholder-zinc-700 transition-all font-mono"
                />
              </div>

              {/* Initial Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Trạng thái ban đầu</label>
                <select
                  value={formValues.status}
                  onChange={(e) => setFormValues(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-[#08090d] border border-[#1f2235] rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50"
                >
                  <option value="upcoming">Chờ mở (Sắp diễn ra)</option>
                  <option value="active">Mở ngay (Đang diễn ra)</option>
                </select>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-6 border-t border-[#1f2235] bg-[#0f1017]/70 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 border border-zinc-700/60"
              >
                Hủy bỏ
              </button>
              
              <button
                type="submit"
                className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-md font-mono uppercase"
              >
                Tạo giải đấu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
