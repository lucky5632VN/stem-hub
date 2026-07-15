'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { 
  Search, SlidersHorizontal, ShieldAlert, ShieldCheck, 
  Trash2, X, Trophy, Star, ChevronLeft, ChevronRight, User, Mail, Calendar, Eye,
  Sparkles, Award, Download
} from 'lucide-react';
import { AvatarFrame } from '@/components/atoms/AvatarFrame';
import STEMAvatarSVG from '@/components/atoms/STEMAvatarSVG';
import { playSound } from '@/lib/sound';
import { logAdminAction } from '@/lib/adminLogger';

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search, Filter, Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('elo_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Detail Modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentMatches, setStudentMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Delete Confirm Modal state
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [confirmInputName, setConfirmInputName] = useState('');

  // Crystal modification state
  const [crystalAmount, setCrystalAmount] = useState('50');

  // Excel Export Handler
  const exportToExcel = () => {
    playSound.click();
    try {
      const { utils, writeFile } = require('xlsx');
      
      // Chuẩn bị dữ liệu xuất
      const excelData = sortedStudents.map((student, index) => ({
        "STT": index + 1,
        "ID Học Sinh": student.id,
        "Họ và Tên": student.displayName || student.name || 'Chưa đặt tên',
        "Email": student.email || 'Chưa rõ',
        "ELO": student.stats?.elo || 0,
        "Danh hiệu": getTitleLabel(student.personalization?.activeTitle || 'apprentice'),
        "Cấp độ (Level)": student.stats?.level || 1,
        "Kinh nghiệm (EXP)": student.stats?.exp || 0,
        "Pha lê (Crystals)": student.crystals || 0,
        "Số trận Thắng": student.stats?.wins || 0,
        "Số trận Thua": student.stats?.losses || 0,
        "Trạng thái": student.isBanned ? "Đang bị khóa" : "Hoạt động",
        "Ngày tạo tài khoản": formatDate(student.createdAt)
      }));

      // Tạo workbook & worksheet
      const ws = utils.json_to_sheet(excelData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Danh sách học sinh");

      // Set column widths
      ws['!cols'] = [
        { wch: 6 }, // STT
        { wch: 30 }, // ID Học Sinh
        { wch: 25 }, // Họ và Tên
        { wch: 30 }, // Email
        { wch: 10 }, // ELO
        { wch: 25 }, // Danh hiệu
        { wch: 15 }, // Cấp độ (Level)
        { wch: 18 }, // Kinh nghiệm (EXP)
        { wch: 18 }, // Pha lê (Crystals)
        { wch: 15 }, // Số trận Thắng
        { wch: 15 }, // Số trận Thua
        { wch: 15 }, // Trạng thái
        { wch: 20 }  // Ngày tạo tài khoản
      ];

      // Xuất file
      writeFile(wb, `Danh_sach_hoc_sinh_STEM_Arena_${new Date().toISOString().slice(0, 10)}.xlsx`);
      
      logAdminAction(
        "EXPORT_EXCEL",
        "ALL_STUDENTS",
        "Danh sách học sinh",
        `Xuất thành công danh sách gồm ${excelData.length} học sinh ra file Excel.`
      );
    } catch (err) {
      console.error("Lỗi khi xuất file Excel:", err);
      alert("Đã xảy ra lỗi khi xuất file Excel. Vui lòng kiểm tra console.");
    }
  };

  const getEloTier = (elo = 1000) => {
    if (elo < 1200) return 'Đồng';
    if (elo < 1500) return 'Bạc';
    if (elo < 1800) return 'Vàng';
    return 'Kim Cương';
  };
  
  const getEloTierBadgeColor = (elo = 1000) => {
    if (elo < 1200) return 'bg-amber-700/15 text-amber-500 border border-amber-750/30';
    if (elo < 1500) return 'bg-zinc-500/15 text-zinc-400 border border-zinc-650/30';
    if (elo < 1800) return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30';
    return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30';
  };

  // Tải danh sách học sinh từ Firestore
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'users'));
      const studentList = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Loại bỏ tài khoản Admin
        if (data.role !== 'admin' && data.email?.toLowerCase() !== 'admin123@gmail.com' && docSnap.id !== 'admin') {
          studentList.push({
            id: docSnap.id,
            ...data
          });
        }
      });
      setStudents(studentList);
    } catch (err) {
      console.error("Lỗi khi tải danh sách học sinh:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Tải lịch sử đấu của học sinh được chọn
  const fetchStudentMatches = async (studentId) => {
    try {
      setLoadingMatches(true);
      const roomsSnapshot = await getDocs(collection(db, 'match_rooms'));
      const matches = [];
      roomsSnapshot.forEach((docSnap) => {
        const room = docSnap.data();
        const isPlayer1 = room.player1?.uid === studentId;
        const isPlayer2 = room.player2?.uid === studentId;
        if ((isPlayer1 || isPlayer2) && (room.status === 'result' || room.status === 'finished')) {
          matches.push({
            id: docSnap.id,
            ...room
          });
        }
      });
      
      // Sắp xếp giảm dần theo thời gian tạo
      matches.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setStudentMatches(matches);
    } catch (err) {
      console.error("Lỗi khi tải lịch sử đấu:", err);
    } finally {
      setLoadingMatches(false);
    }
  };

  // Xem chi tiết học sinh
  const handleViewDetails = (student) => {
    playSound.click();
    setSelectedStudent(student);
    setCrystalAmount('50');
    fetchStudentMatches(student.id);
  };

  // Điều chỉnh Pha lê của học sinh
  const handleModifyCrystals = async (isAddition) => {
    if (!selectedStudent) return;
    playSound.click();
    
    const amount = parseInt(crystalAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Vui lòng nhập số pha lê hợp lệ (số nguyên dương).");
      return;
    }

    try {
      const currentCrystals = selectedStudent.personalization?.crystals !== undefined 
        ? selectedStudent.personalization.crystals 
        : 500;
        
      const nextCrystals = isAddition 
        ? currentCrystals + amount 
        : Math.max(0, currentCrystals - amount);

      const studentRef = doc(db, 'users', selectedStudent.id);
      await updateDoc(studentRef, {
        'personalization.crystals': nextCrystals
      });

      // Cập nhật state cục bộ cho học sinh đang chọn
      setSelectedStudent(prev => ({
        ...prev,
        personalization: {
          ...prev.personalization,
          crystals: nextCrystals
        }
      }));

      // Cập nhật trong danh sách chính
      setStudents(prev => prev.map(s => s.id === selectedStudent.id ? {
        ...s,
        personalization: {
          ...s.personalization,
          crystals: nextCrystals
        }
      } : s));

      await logAdminAction(
        isAddition ? "GRANT_CURRENCY" : "DEDUCT_CURRENCY",
        selectedStudent.id,
        selectedStudent.displayName || selectedStudent.email || "Ẩn danh",
        `${isAddition ? "Tặng" : "Khấu trừ"} ${amount} pha lê. Số dư mới: ${nextCrystals}`
      );

      playSound.success();
    } catch (err) {
      console.error("Lỗi khi điều chỉnh pha lê:", err);
      alert("Không thể cập nhật số pha lê. Vui lòng thử lại.");
    }
  };

  // Khóa / Mở khóa tài khoản học sinh
  const handleToggleBan = async (student) => {
    playSound.click();
    const actionText = student.isBanned ? 'mở khóa' : 'khóa';
    if (confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản của học sinh "${student.displayName}" không?`)) {
      try {
        const studentRef = doc(db, 'users', student.id);
        const nextBanState = !student.isBanned;
        await updateDoc(studentRef, { isBanned: nextBanState });
        
        // Cập nhật state cục bộ
        setStudents(prev => prev.map(s => s.id === student.id ? { ...s, isBanned: nextBanState } : s));
        if (selectedStudent && selectedStudent.id === student.id) {
          setSelectedStudent(prev => ({ ...prev, isBanned: nextBanState }));
        }

        await logAdminAction(
          nextBanState ? "BAN_USER" : "UNBAN_USER",
          student.id,
          student.displayName || student.email || "Ẩn danh",
          `${nextBanState ? "Khóa" : "Mở khóa"} tài khoản học sinh`
        );

        playSound.success();
      } catch (err) {
        console.error("Lỗi khi thay đổi trạng thái tài khoản:", err);
      }
    }
  };

  // Xác nhận xóa tài khoản (Bước 1: Mở modal)
  const handleOpenDeleteConfirm = (student) => {
    playSound.click();
    setDeleteConfirmUser(student);
    setConfirmInputName('');
  };

  // Thực thi xóa tài khoản (Bước 2)
  const handleExecuteDelete = async () => {
    if (!deleteConfirmUser) return;
    playSound.click();
    
    if (confirmInputName.trim() !== deleteConfirmUser.displayName) {
      alert("Tên học sinh nhập vào không khớp. Vui lòng thử lại.");
      return;
    }

    try {
      // Xóa tài liệu Firestore
      await deleteDoc(doc(db, 'users', deleteConfirmUser.id));
      
      await logAdminAction(
        "DELETE_USER",
        deleteConfirmUser.id,
        deleteConfirmUser.displayName || deleteConfirmUser.email || "Ẩn danh",
        "Xóa tài khoản học sinh vĩnh viễn khỏi hệ thống"
      );

      // Cập nhật state
      setStudents(prev => prev.filter(s => s.id !== deleteConfirmUser.id));
      if (selectedStudent && selectedStudent.id === deleteConfirmUser.id) {
        setSelectedStudent(null);
      }
      setDeleteConfirmUser(null);
      playSound.success();
    } catch (err) {
      console.error("Lỗi khi xóa tài khoản:", err);
    }
  };

  // Bộ lọc Tìm kiếm & Sắp xếp
  const filteredStudents = students.filter(student => {
    const search = searchTerm.toLowerCase();
    return (
      (student.displayName || '').toLowerCase().includes(search) ||
      (student.email || '').toLowerCase().includes(search)
    );
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const eloA = a.stats?.elo || 0;
    const eloB = b.stats?.elo || 0;
    const expA = a.stats?.exp || 0;
    const expB = b.stats?.exp || 0;
    const levelA = a.stats?.level || 1;
    const levelB = b.stats?.level || 1;
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();

    switch (sortBy) {
      case 'elo_desc': return eloB - eloA;
      case 'elo_asc': return eloA - eloB;
      case 'exp_desc': return expB - expA;
      case 'level_desc': return levelB - levelA;
      case 'date_desc': return dateB - dateA;
      case 'date_asc': return dateA - dateB;
      default: return eloB - eloA;
    }
  });

  // Tính toán phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = sortedStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);

  const getTitleLabel = (title) => {
    const titles = {
      apprentice: 'Tập sự STEM',
      alchemist_expert: 'Bậc thầy Hóa học',
      math_wizard: 'Chiến thần Toán học',
      physics_guru: 'Kỹ sư Cơ học',
      cosmic_explorer: 'Nhà thám hiểm Vũ trụ',
      nuclear_engineer: 'Kỹ sư Phản ứng hạt',
      quantum_master: 'Thạc sĩ Lượng tử',
      stem_legend: 'Huyền thoại STEM',
      multiverse_theorist: 'Nhà lập thuyết Đa vũ trụ',
      dimension_creator: 'Đấng kiến tạo Không gian',
      top_1_universe: 'Đại Đế STEM 👑',
      top_10_legend: 'Huyền thoại Đấu trường',
      top_100_elite: 'Đại Cao Thủ STEM'
    };
    return titles[title] || 'Học viên';
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Chưa rõ';
    try {
      const d = new Date(isoString);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch (e) {
      return 'Lỗi định dạng';
    }
  };

  return (
    <div className="space-y-6 text-zinc-300 font-sans select-none">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wider font-mono">
          Quản lý danh sách học sinh
        </h1>
        <p className="text-xs text-zinc-500 font-semibold mt-1">
          Xem thông tin chi tiết học sinh, lịch sử thi đấu, quản lý cấp độ, và xử lý khóa hoặc xóa tài khoản.
        </p>
      </div>

      {/* Control Bar (Search, Filter, Sort) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0f1017]/60 border border-[#1f2235] p-4 rounded-2xl shadow-lg">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh hoặc email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white focus:outline-none placeholder-zinc-500 transition-all font-mono"
          />
        </div>

        {/* Sort Select & Export Excel */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          <SlidersHorizontal className="w-4 h-4 text-zinc-500 hidden sm:block" />
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2.5 px-4 text-xs font-bold text-zinc-300 focus:outline-none transition-all cursor-pointer"
          >
            <option value="elo_desc">Sắp xếp: ELO Cao Nhất</option>
            <option value="elo_asc">Sắp xếp: ELO Thấp Nhất</option>
            <option value="exp_desc">Sắp xếp: EXP Cao Nhất</option>
            <option value="level_desc">Sắp xếp: Cấp Độ Cao Nhất</option>
            <option value="date_desc">Ngày tham gia: Mới nhất</option>
            <option value="date_asc">Sắp xếp: Ngày cũ nhất</option>
          </select>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-450 hover:text-emerald-400 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-[#0f1017]/60 border border-[#1f2235] rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest animate-pulse">
              Đang tải danh sách học sinh...
            </span>
          </div>
        ) : currentStudents.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <X className="w-12 h-12 text-zinc-650" />
            <span className="text-xs font-bold text-zinc-550 uppercase font-mono">
              Không tìm thấy học sinh nào phù hợp
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-[#1f2235] bg-[#0c0d14]/50 select-none font-mono text-[10px] font-black text-zinc-550 uppercase tracking-widest">
                  <th className="py-4.5 px-6">Học sinh</th>
                  <th className="py-4.5 px-6">Email</th>
                  <th className="py-4.5 px-6 text-center">Xếp hạng (ELO)</th>
                  <th className="py-4.5 px-6 text-center">Cấp độ (EXP)</th>
                  <th className="py-4.5 px-6 text-center">Ngày tham gia</th>
                  <th className="py-4.5 px-6 text-center">Trạng thái</th>
                  <th className="py-4.5 px-6 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2235]/40 font-semibold text-zinc-350">
                {currentStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-[#141622]/40 transition-colors">
                    {/* User Profile Cell */}
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className="relative w-9 h-9 shrink-0">
                        <AvatarFrame frame={student.personalization?.avatarFrame || 'default'} className="w-9 h-9 text-[10px]">
                          {student.personalization?.avatarUrl === 'custom-avatar' ? (
                            <STEMAvatarSVG parts={student.personalization?.avatarParts} />
                          ) : student.personalization?.avatarUrl ? (
                            <img src={student.personalization.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-zinc-500" />
                          )}
                        </AvatarFrame>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white text-xs font-bold font-mono leading-tight">
                          {student.displayName || 'Chưa đặt tên'}
                        </span>
                        <span className="text-[9px] text-pink-500 font-bold mt-0.5 leading-none">
                          {getTitleLabel(student.personalization?.activeTitle || 'apprentice')}
                        </span>
                      </div>
                    </td>

                    {/* Email Cell */}
                    <td className="py-4 px-6 font-mono text-zinc-400 text-xs">
                      {student.email || 'Ẩn danh'}
                    </td>

                    {/* ELO Cell */}
                    <td className="py-4 px-6 text-center font-mono">
                      <span className="text-emerald-400 font-black">
                        {student.stats?.elo !== undefined ? student.stats.elo : 1000}
                      </span>
                    </td>

                    {/* EXP & Level Cell */}
                    <td className="py-4 px-6 text-center font-mono text-xs">
                      <span className="text-cyan-400 font-black">Cấp {student.stats?.level || 1}</span>
                      <span className="text-[10px] text-zinc-550 block font-medium mt-0.5">
                        ({student.stats?.exp || 0} EXP)
                      </span>
                    </td>

                    {/* Join Date Cell */}
                    <td className="py-4 px-6 text-center font-mono text-xs text-zinc-450">
                      {formatDate(student.createdAt)}
                    </td>

                    {/* Status Cell */}
                    <td className="py-4 px-6 text-center">
                      {student.isBanned ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-450 border border-rose-500/20">
                          Đã Khóa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Bình Thường
                        </span>
                      )}
                    </td>

                    {/* Actions Cell */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Button */}
                        <button
                          onClick={() => handleViewDetails(student)}
                          title="Xem thông tin chi tiết"
                          className="p-1.5 bg-[#141622] hover:bg-[#1b1e30] border border-[#1f2235] text-zinc-350 hover:text-white rounded-lg transition-all cursor-pointer active:scale-90"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Lock / Unlock Button */}
                        <button
                          onClick={() => handleToggleBan(student)}
                          title={student.isBanned ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                          className={`p-1.5 border rounded-lg transition-all cursor-pointer active:scale-90 ${
                            student.isBanned
                              ? 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border-emerald-500/25 hover:border-emerald-400'
                              : 'bg-rose-500/10 hover:bg-rose-500 text-rose-450 hover:text-white border-rose-500/25 hover:border-rose-400'
                          }`}
                        >
                          {student.isBanned ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleOpenDeleteConfirm(student)}
                          title="Xóa tài khoản vĩnh viễn"
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-450 hover:text-white border border-rose-500/20 hover:border-rose-500 rounded-lg transition-all cursor-pointer active:scale-90"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {sortedStudents.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-[#1f2235] bg-[#0c0d14]/30 flex items-center justify-between font-mono text-xs">
            <span className="text-zinc-500 font-bold">
              Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, sortedStudents.length)} trên tổng số {sortedStudents.length} học sinh
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

      {/* STUDENT DETAIL MODAL */}
      {selectedStudent && (() => {
        const exp = selectedStudent.stats?.exp || 0;
        const nextLevelExp = selectedStudent.stats?.nextLevelExp || 1000;
        const expPercentage = Math.min(100, Math.max(0, (exp / nextLevelExp) * 100));

        const wins = selectedStudent.stats?.wins || 0;
        const losses = selectedStudent.stats?.losses || 0;
        const totalMatches = wins + losses;
        const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
        const elo = selectedStudent.stats?.elo !== undefined ? selectedStudent.stats.elo : 1000;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div 
              className="w-full max-w-2xl bg-[#0c0d14] border border-[#1f2235] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 text-zinc-300 font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#1f2235] flex items-center justify-between bg-[#0f1017]/80">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-pink-500 filter drop-shadow-[0_0_6px_rgba(244,63,94,0.3)]" />
                  <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">
                    Hồ sơ học viên chi tiết
                  </h3>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedStudent.isBanned ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-450 border border-rose-500/25 animate-pulse">
                      Tài khoản bị khóa
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      Hoạt động bình thường
                    </span>
                  )}
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="p-1.5 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer ml-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                
                {/* Main Profile Info Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#0f1017]/90 p-5 rounded-2xl border border-[#1f2235]/65 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-pink-500/10 transition-colors" />
                  
                  {/* Left Column: Avatar & EXP */}
                  <div className="flex flex-col items-center justify-center p-3 border-r border-[#1f2235]/40 md:col-span-1">
                    <div className="relative w-24 h-24 mb-3">
                      <AvatarFrame frame={selectedStudent.personalization?.avatarFrame || 'default'} className="w-24 h-24 text-4xl">
                        {selectedStudent.personalization?.avatarUrl === 'custom-avatar' ? (
                          <STEMAvatarSVG parts={selectedStudent.personalization?.avatarParts} />
                        ) : selectedStudent.personalization?.avatarUrl ? (
                          <img src={selectedStudent.personalization.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-zinc-500" />
                        )}
                      </AvatarFrame>
                    </div>
                    
                    <div className="flex flex-col items-center w-full space-y-2 mt-2">
                      <span className="text-[10px] text-pink-500 font-mono font-black uppercase px-3 py-1 bg-pink-500/10 rounded-full border border-pink-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                        Cấp {selectedStudent.stats?.level || 1}
                      </span>
                      
                      {/* EXP bar */}
                      <div className="w-full mt-2 space-y-1">
                        <div className="flex justify-between text-[9px] text-zinc-550 font-mono font-black">
                          <span>EXP</span>
                          <span>{exp}/{nextLevelExp}</span>
                        </div>
                        <div className="w-full bg-zinc-900/80 h-1.5 rounded-full overflow-hidden border border-[#1f2235]/30">
                          <div 
                            className="bg-gradient-to-r from-pink-500 to-purple-600 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" 
                            style={{ width: `${expPercentage}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Details list */}
                  <div className="md:col-span-2 space-y-4 flex flex-col justify-center">
                    <div>
                      <h4 className="text-white text-lg font-black font-mono tracking-wide">
                        {selectedStudent.displayName || 'Chưa đặt tên'}
                      </h4>
                      <p className="text-[9.5px] text-zinc-500 font-mono font-bold mt-0.5">
                        ID: {selectedStudent.id}
                      </p>
                    </div>
                    
                    {/* Information Grid */}
                    <div className="grid grid-cols-1 gap-2.5 text-xs text-zinc-400 font-mono">
                      <div className="flex items-center gap-2.5 bg-black/30 p-2 rounded-lg border border-[#1f2235]/20 min-w-0">
                        <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                        <span className="truncate font-semibold select-all text-zinc-350 break-all" title={selectedStudent.email || 'Ẩn danh'}>
                          {selectedStudent.email || 'Ẩn danh'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2.5 bg-black/30 p-2 rounded-lg border border-[#1f2235]/20">
                          <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span className="truncate">Gia nhập: {formatDate(selectedStudent.createdAt)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2.5 bg-black/30 p-2 rounded-lg border border-[#1f2235]/20">
                          <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate flex items-center gap-1.5">
                            <span>{elo} ELO</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase font-mono border ${getEloTierBadgeColor(elo)}`}>
                              {getEloTier(elo)}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Competency & Currency */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-[#1f2235]/40 pt-3">
                      
                      {/* Wins & Losses Visualizer */}
                      <div className="space-y-1.5 font-mono">
                        <div className="flex justify-between text-[10px] text-zinc-400 font-bold">
                          <span>Tỉ lệ thắng: <strong className="text-emerald-400">{winRate}%</strong></span>
                          <span className="text-zinc-500">({wins}T - {losses}B)</span>
                        </div>
                        
                        {/* Bi-color Win/Loss Bar */}
                        <div className="w-full bg-rose-500 h-2 rounded-full overflow-hidden flex border border-[#1f2235]/20">
                          {totalMatches > 0 ? (
                            <div 
                              className="bg-emerald-500 h-full rounded-l-full" 
                              style={{ width: `${(wins / totalMatches) * 100}%` }} 
                            />
                          ) : (
                            <div className="bg-zinc-700 h-full w-full" />
                          )}
                        </div>
                      </div>

                      {/* Crystal Display */}
                      <div className="flex items-center justify-between bg-pink-500/5 border border-pink-500/10 p-2.5 rounded-xl self-end">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Pha lê hiện có:
                        </span>
                        <span className="text-sm font-black font-mono text-pink-400 filter drop-shadow-[0_0_6px_rgba(244,63,94,0.3)] flex items-center gap-1">
                          {selectedStudent.personalization?.crystals !== undefined ? selectedStudent.personalization.crystals : 500} 💎
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quản lý Pha lê panel */}
                <div className="bg-[#08090d]/80 p-4.5 rounded-2xl border border-[#1f2235] space-y-3">
                  <div className="flex items-center gap-1.5 border-b border-[#1f2235]/40 pb-2">
                    <Sparkles className="w-4 h-4 text-pink-500" />
                    <h5 className="text-[11px] font-black text-white uppercase tracking-wider font-mono">
                      Điều chỉnh số lượng Pha lê
                    </h5>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                    <span className="text-zinc-500 font-bold">
                      Nhập số pha lê cần cộng hoặc trừ vào tài khoản học viên:
                    </span>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <input
                        type="number"
                        placeholder="Số..."
                        value={crystalAmount}
                        onChange={(e) => setCrystalAmount(e.target.value)}
                        className="bg-[#0c0d14] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2 px-3 text-xs text-white focus:outline-none w-24 font-mono text-center font-bold"
                      />
                      <button
                        onClick={() => handleModifyCrystals(true)}
                        type="button"
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-md shadow-emerald-500/10 flex items-center gap-1"
                      >
                        + Tặng
                      </button>
                      <button
                        onClick={() => handleModifyCrystals(false)}
                        type="button"
                        className="px-4 py-2 bg-rose-500/10 hover:bg-rose-600 hover:text-white border border-rose-500/20 text-rose-450 font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-md flex items-center gap-1"
                      >
                        - Khấu trừ
                      </button>
                    </div>
                  </div>
                </div>

                {/* Match History Section */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest font-mono border-l-2 border-pink-500 pl-2.5 select-none">
                      Lịch sử thi đấu gần đây
                    </h4>
                    <span className="text-[9px] font-bold text-zinc-500 font-mono">
                      Realtime logs
                    </span>
                  </div>
                  
                  {loadingMatches ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 border border-dashed border-[#1f2235] rounded-2xl bg-[#0f1017]/20">
                      <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] font-mono font-bold text-zinc-650 tracking-wider">ĐANG TẢI LỊCH SỬ...</span>
                    </div>
                  ) : studentMatches.length === 0 ? (
                    <div className="p-8 bg-[#0f1017]/30 border border-dashed border-[#1f2235]/80 rounded-2xl text-center text-xs font-bold text-zinc-600 font-mono uppercase">
                      Chưa có trận đấu nào được ghi nhận
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {studentMatches.map((room) => {
                        const isPlayer1 = room.player1?.uid === selectedStudent.id;
                        const opp = isPlayer1 ? room.player2 : room.player1;
                        const isWin = room.winnerId === selectedStudent.id;
                        const isDraw = !room.winnerId;

                        const subjectInfo = {
                          math: { label: 'Toán học', style: 'border-blue-500/30 text-blue-400 bg-blue-500/5' },
                          physics: { label: 'Vật lý', style: 'border-purple-500/30 text-purple-400 bg-purple-500/5' },
                          chemistry: { label: 'Hóa học', style: 'border-pink-500/30 text-pink-400 bg-pink-500/5' },
                          biology: { label: 'Sinh học', style: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' }
                        };
                        const subj = subjectInfo[room.subject] || { label: room.subject, style: 'border-zinc-800 text-zinc-550' };

                        return (
                          <div 
                            key={room.id} 
                            className="flex items-center justify-between p-3.5 bg-[#0f1017]/40 border border-[#1f2235]/40 hover:border-pink-500/10 rounded-2xl font-mono text-xs transition-all hover:bg-[#0f1017]/60"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border shadow-sm ${
                                isWin 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-emerald-500/5' 
                                  : isDraw 
                                  ? 'bg-zinc-800 text-zinc-400 border-zinc-750' 
                                  : 'bg-rose-500/10 text-rose-450 border-rose-500/25 shadow-rose-500/5'
                              }`}>
                                {isWin ? 'Thắng' : isDraw ? 'Hòa' : 'Thua'}
                              </span>
                              <span className="text-zinc-600 font-bold">vs</span>
                              <span className="text-white font-bold truncate max-w-40">{opp?.name || 'Ẩn danh'}</span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-zinc-500 font-medium">
                              <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase font-mono ${subj.style}`}>
                                {subj.label}
                              </span>
                              <span className="text-[10px] text-zinc-550">{formatDate(room.createdAt)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="p-6 border-t border-[#1f2235] bg-[#0f1017]/70 flex items-center justify-between">
                <button
                  onClick={() => handleToggleBan(selectedStudent)}
                  className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-md font-mono uppercase ${
                    selectedStudent.isBanned
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/10'
                      : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/10'
                  }`}
                >
                  {selectedStudent.isBanned ? 'Mở khóa tài khoản' : 'Khóa tài khoản này'}
                </button>

                <button
                  onClick={() => {
                    setSelectedStudent(null);
                    handleOpenDeleteConfirm(selectedStudent);
                  }}
                  className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-450 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-md font-mono uppercase"
                >
                  Xóa tài khoản
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DELETE CONFIRM MODAL (2-step verification) */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0c0d14] border border-rose-500/20 rounded-3xl overflow-hidden shadow-2xl p-6 relative animate-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center gap-2.5 text-rose-500">
              <ShieldAlert className="w-6 h-6 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.3)] animate-bounce" />
              <h3 className="text-base font-black uppercase tracking-wider font-mono">Xác thực xóa tài khoản</h3>
            </div>
            
            <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
              Bạn đang thực hiện thao tác xóa vĩnh viễn tài khoản của học sinh <strong className="text-white">"{deleteConfirmUser.displayName}"</strong>. Mọi chỉ số ELO, EXP, lịch sử trận đấu và Chibi avatar sẽ bị hủy và KHÔNG THỂ KHÔI PHỤC.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">
                Nhập lại tên học sinh để xác nhận:
              </label>
              <input
                type="text"
                value={confirmInputName}
                onChange={(e) => setConfirmInputName(e.target.value)}
                placeholder={deleteConfirmUser.displayName}
                className="w-full bg-[#08090d] border border-[#1f2235] focus:border-rose-500/50 rounded-xl py-2.5 px-4 text-xs font-mono font-bold text-white focus:outline-none placeholder-zinc-700 transition-all"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleExecuteDelete}
                disabled={confirmInputName.trim() !== deleteConfirmUser.displayName}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-lg font-mono uppercase"
              >
                Xác nhận XÓA vĩnh viễn
              </button>
              
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-5 py-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 border border-zinc-700/60"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
