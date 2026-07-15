'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  Shield, Search, SlidersHorizontal, ChevronLeft, ChevronRight, 
  Calendar, Clock, AlertCircle, RefreshCw, X, FileText
} from 'lucide-react';
import { playSound } from '@/lib/sound';

export default function AdminLogsDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Lắng nghe logs realtime từ Firestore
  useEffect(() => {
    setLoading(true);
    const logsCollection = collection(db, 'admin_logs');
    
    const unsubscribe = onSnapshot(logsCollection, (snapshot) => {
      const logsList = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        logsList.push({
          id: docSnap.id,
          ...data,
          // Đảm bảo timestamp được chuyển đổi an toàn sang Date
          dateObject: data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp ? new Date(data.timestamp) : new Date())
        });
      });

      // Sắp xếp log mới nhất trước
      logsList.sort((a, b) => b.dateObject.getTime() - a.dateObject.getTime());
      setLogs(logsList);
      setLoading(false);
    }, (err) => {
      console.error("Lỗi khi đồng bộ Admin Logs:", err);
      setLoading(false);
    });

    return () => unsubscribe();
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

  // Xác định badge màu sắc cho từng loại hành động
  const getActionBadge = (action) => {
    const act = (action || '').toUpperCase();
    
    // Nhóm hành động Xóa / Hủy (Đỏ)
    if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('CANCEL') || act.includes('BAN')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-450 border border-rose-500/20 whitespace-nowrap">
          {action}
        </span>
      );
    }

    // Nhóm hành động Thêm / Nạp (Xanh lá)
    if (act.includes('ADD') || act.includes('CREATE') || act.includes('GRANT') || act.includes('SEED')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
          {action}
        </span>
      );
    }

    // Nhóm hành động Cập nhật / Sửa đổi (Vàng/Cam)
    if (act.includes('UPDATE') || act.includes('DEDUCT') || act.includes('CLEAR') || act.includes('RESET')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
          {action}
        </span>
      );
    }

    // Nhóm mặc định (Xanh dương/Xám)
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
        {action}
      </span>
    );
  };

  // Lấy danh sách các loại hành động để lọc
  const uniqueActions = ['all', ...new Set(logs.map(log => log.action).filter(Boolean))];

  // Lọc log theo các tiêu chí tìm kiếm
  const filteredLogs = logs.filter(log => {
    // 1. Search term
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      (log.adminEmail || '').toLowerCase().includes(search) ||
      (log.targetName || '').toLowerCase().includes(search) ||
      (log.detail || '').toLowerCase().includes(search) ||
      (log.targetId || '').toLowerCase().includes(search);

    // 2. Action Filter
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;

    // 3. Date Range Filter
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

  // Phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const resetFilters = () => {
    playSound.click();
    setSearchTerm('');
    setSelectedAction('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 text-zinc-300 font-sans select-none">
      {/* Page Header */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Shield className="w-6 h-6 text-pink-500 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse" />
            Nhật ký hoạt động Admin (Audit Trail)
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Tra cứu vết lịch sử hoạt động ghi, sửa, xóa dữ liệu hệ thống thời gian thực của các quản trị viên.
          </p>
        </div>

        <button
          onClick={resetFilters}
          className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-xs font-bold text-zinc-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-md"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Xóa bộ lọc
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
                placeholder="Tìm email, đối tượng, chi tiết..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-white focus:outline-none placeholder-zinc-650 transition-all font-mono"
              />
            </div>
          </div>

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
        </div>
      </div>

      {/* Logs Table Container */}
      <div className="w-full bg-[#0f1017]/60 border border-[#1f2235] rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
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
                    {/* Time Cell */}
                    <td className="py-3.5 px-6 font-mono text-zinc-450 text-[11px] whitespace-nowrap">
                      {formatDateTime(log.dateObject)}
                    </td>

                    {/* Admin Email Cell */}
                    <td className="py-3.5 px-6 font-mono text-zinc-300 text-xs">
                      {log.adminEmail || 'Unknown'}
                    </td>

                    {/* Action Badge Cell */}
                    <td className="py-3.5 px-6 text-center">
                      {getActionBadge(log.action)}
                    </td>

                    {/* Target Name/ID Cell */}
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

                    {/* Detail Activity Cell */}
                    <td className="py-3.5 px-6 font-mono text-zinc-400 text-xs leading-relaxed max-w-xs sm:max-w-md truncate" title={log.detail}>
                      {log.detail || 'Không có chi tiết'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredLogs.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-[#1f2235] bg-[#0c0d14]/30 flex items-center justify-between font-mono text-xs">
            <span className="text-zinc-500 font-bold">
              Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredLogs.length)} trên tổng số {filteredLogs.length} logs
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
