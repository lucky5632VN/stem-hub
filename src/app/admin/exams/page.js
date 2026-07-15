'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, setDoc, writeBatch } from 'firebase/firestore';

import { SCRAPED_EXAMS_SEED } from '@/data/exams_seed';
import { 
  FileText, Plus, Trash2, Upload, AlertCircle, Calendar, 
  Timer, Check, RotateCcw, X, ShieldAlert, Award, ExternalLink
} from 'lucide-react';
import { playSound } from '@/lib/sound';
import { logAdminAction } from '@/lib/adminLogger';

export default function AdminExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSubject, setActiveSubject] = useState('all');

  // Form states
  const [formValues, setFormValues] = useState({
    title: '',
    subject: 'physics',
    category: 'bo-gddt',
    year: new Date().getFullYear(),
    province: 'Bộ GD&ĐT',
    timeLimit: 3000,
    jsonText: '',
    difficulty: 'easy'
  });

  const [uploadError, setUploadError] = useState('');

  // Tải danh sách đề thi từ Firestore
  const fetchExams = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'exams'));
      const list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setExams(list);
    } catch (err) {
      console.error("Lỗi khi tải danh sách đề thi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // Xử lý đọc file JSON tải lên
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    playSound.click();
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!Array.isArray(json)) {
          throw new Error("File JSON phải chứa một mảng các câu hỏi.");
        }
        setFormValues(prev => ({ ...prev, jsonText: JSON.stringify(json, null, 2) }));
        setUploadError('');
        playSound.success();
      } catch (err) {
        setUploadError("Định dạng file JSON không hợp lệ: " + err.message);
        playSound.error();
      }
    };
    reader.readAsText(file);
  };

  // Lưu đề thi mới lên Firestore
  const handleSaveExam = async (e) => {
    e.preventDefault();
    playSound.click();
    setUploadError('');

    const { title, subject, category, year, province, timeLimit, jsonText, difficulty } = formValues;

    if (!title.trim()) {
      alert("Vui lòng nhập tiêu đề đề thi.");
      return;
    }

    let parsedQuestions = [];
    try {
      if (!jsonText.trim()) {
        alert("Vui lòng tải lên file JSON hoặc dán nội dung câu hỏi.");
        return;
      }
      parsedQuestions = JSON.parse(jsonText.trim());
      if (!Array.isArray(parsedQuestions)) {
        throw new Error("Dữ liệu câu hỏi phải là một danh sách (mảng).");
      }
    } catch (err) {
      setUploadError("Lỗi cú pháp câu hỏi JSON: " + err.message);
      playSound.error();
      return;
    }

    const subjectLabelMap = { math: 'Toán Học', physics: 'Vật Lý', chemistry: 'Hóa Học', biology: 'Sinh Học' };
    const difficultyLabelMap = { easy: 'Cơ bản', medium: 'Khá', hard: 'Nâng cao' };
    const payload = {
      title: title.trim(),
      subject,
      subjectLabel: subjectLabelMap[subject] || subject,
      category,
      year: Number(year),
      province: province.trim(),
      timeLimit: Number(timeLimit),
      type: 'thpt_chuan',
      typeLabel: `Cấu trúc 2026 (${parsedQuestions.length} câu)`,
      difficulty: difficulty || 'easy',
      difficultyLabel: difficultyLabelMap[difficulty || 'easy'] || 'Cơ bản',
      questions: parsedQuestions,
      createdAt: new Date().toISOString()
    };

    try {
      setSaving(true);
      const docRef = await addDoc(collection(db, 'exams'), payload);
      await logAdminAction("ADD_EXAM", docRef.id, payload.title, "Tải lên đề thi mới");
      playSound.success();
      setExams(prev => [{ id: docRef.id, ...payload }, ...prev]);
      setIsModalOpen(false);
      // Reset form
      setFormValues({
        title: '',
        subject: 'physics',
        category: 'bo-gddt',
        year: new Date().getFullYear(),
        province: 'Bộ GD&ĐT',
        timeLimit: 3000,
        jsonText: '',
        difficulty: 'easy'
      });
      alert("Tải lên đề thi thực chiến thành công!");
    } catch (err) {
      console.error("Lỗi lưu đề thi:", err);
      alert("Đã xảy ra lỗi khi lưu đề thi lên Firestore.");
    } finally {
      setSaving(false);
    }
  };

  // Xóa đề thi
  const handleDeleteExam = async (id) => {
    playSound.click();
    const examToDelete = exams.find(item => item.id === id);
    const examTitle = examToDelete ? examToDelete.title : '';
    if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn đề thi này khỏi hệ thống không?")) {
      try {
        setLoading(true);
        await deleteDoc(doc(db, 'exams', id));
        await logAdminAction("DELETE_EXAM", id, examTitle, "Xóa đề thi vĩnh viễn");
        setExams(prev => prev.filter(item => item.id !== id));
        playSound.success();
        alert("Đã xóa đề thi thành công!");
      } catch (err) {
        console.error("Lỗi xóa đề thi:", err);
        alert("Đã xảy ra lỗi khi xóa đề thi.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Nạp đề thi mẫu vào Firestore - chỉ từ SCRAPED_EXAMS_SEED (Toán/Hóa/Sinh đã cân bằng)
  const handleSeedExams = async () => {
    playSound.click();

    // Tính số đề hiện tại theo môn
    const currentCounts = exams.reduce((acc, e) => {
      acc[e.subject] = (acc[e.subject] || 0) + 1;
      return acc;
    }, {});

    // Chỉ seed từ SCRAPED_EXAMS_SEED (đã cân bằng Toán/Hóa/Sinh ~18-20 đề mỗi môn)
    const toSeed = SCRAPED_EXAMS_SEED.filter(exam => {
      return !exams.some(e => e.title === exam.title);
    });

    if (toSeed.length === 0) {
      alert('✅ Tất cả đề thi mẫu đã tồn tại trên Firestore rồi!');
      return;
    }

    const preview = Object.entries(
      toSeed.reduce((acc, e) => { acc[e.subjectLabel] = (acc[e.subjectLabel] || 0) + 1; return acc; }, {})
    ).map(([k, v]) => `${k}: ${v} đề`).join(', ');

    if (!confirm(`Hệ thống sẽ nạp ${toSeed.length} đề thi mẫu vào Firestore.\n📚 ${preview}\n\nCác đề đã tồn tại sẽ bỏ qua. Tiếp tục?`)) return;

    try {
      setSeeding(true);
      const batch = writeBatch(db);
      let count = 0;
      let batchCount = 0;

      for (const exam of toSeed) {
        const newDocRef = doc(collection(db, 'exams'));
        const difficultyLabelMap = { easy: 'Cơ bản', medium: 'Khá', hard: 'Nâng cao' };
        const examDiff = exam.difficulty || 'easy';
        batch.set(newDocRef, {
          title: exam.title,
          subject: exam.subject,
          subjectLabel: exam.subjectLabel,
          category: exam.category || 'bo-gddt',
          year: exam.year || 2026,
          province: exam.province || 'Bộ GD&ĐT',
          timeLimit: exam.timeLimit || 5400,
          type: exam.type || 'thpt_chuan',
          typeLabel: exam.typeLabel || 'Cấu trúc 2026',
          difficulty: examDiff,
          difficultyLabel: exam.difficultyLabel || difficultyLabelMap[examDiff] || 'Cơ bản',
          questions: exam.questions || [],
          sourceUrl: exam.sourceUrl || null,
          createdAt: new Date().toISOString()
        });
        count++;
        batchCount++;
        // Firestore batch giới hạn 500 ops, commit theo lô
        if (batchCount >= 490) {
          await batch.commit();
          batchCount = 0;
        }
      }

      if (batchCount > 0) await batch.commit();
      playSound.success();
      await logAdminAction("SEED_EXAMS", "all", "Nạp đề thi mẫu", `Nạp thành công ${count} đề thi mẫu vào Firestore`);
      alert(`✅ Nạp thành công ${count} đề thi vào Firestore!\n📊 ${preview}`);
      fetchExams();
    } catch (err) {
      console.error('Lỗi khi nạp đề thi mẫu:', err);
      alert('Đã xảy ra lỗi: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  // Chuyển đổi các đề thi thuộc category 'schools' cũ sang phân loại đúng
  const handleMigrateSchools = async () => {
    playSound.click();
    const schoolsExams = exams.filter(e => e.category === 'schools' || !e.category);
    if (schoolsExams.length === 0) {
      alert('Không có đề thi nào thuộc phân loại cũ.');
      return;
    }
    if (!confirm(`Phát hiện ${schoolsExams.length} đề thuộc phân loại cũ 'schools'. Hệ thống sẽ tự động chuyển đổi sang 'so-gddt' hoặc 'truong-chuyen' dựa theo tiêu đề. Tiếp tục?`)) return;

    try {
      setLoading(true);
      const batch = writeBatch(db);
      let count = 0;
      let batchCount = 0;

      for (const exam of schoolsExams) {
        let newCategory = 'truong-chuyen';
        const titleLower = exam.title?.toLowerCase() || '';
        if (titleLower.includes('sở gd') || titleLower.includes('so gd')) {
          newCategory = 'so-gddt';
        }

        const docRef = doc(db, 'exams', exam.id);
        batch.update(docRef, { category: newCategory });
        count++;
        batchCount++;

        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      playSound.success();
      alert(`✅ Đã chuyển đổi thành công ${count} đề thi sang phân loại mới!`);
      fetchExams();
    } catch (err) {
      console.error('Lỗi khi chuyển đổi phân loại:', err);
      alert('Đã xảy ra lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-zinc-300 font-sans select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider font-mono">
            Quản lý đề thi thực chiến
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Tải lên, biên tập và đồng bộ các đề thi thực chiến THPT Quốc Gia từ internet lên hệ thống học sinh.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Nút sửa đổi phân loại cũ */}
          {(() => {
            const oldCnt = exams.filter(e => e.category === 'schools' || !e.category).length;
            if (oldCnt > 0) {
              return (
                <button
                  onClick={handleMigrateSchools}
                  disabled={loading}
                  className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-black text-amber-300 hover:text-amber-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 animate-pulse"
                >
                  <AlertCircle className="w-4 h-4" /> Sửa Category Cũ ({oldCnt})
                </button>
              );
            }
            return null;
          })()}

          <button
            onClick={handleSeedExams}
            disabled={seeding || loading}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 border border-zinc-750 hover:border-zinc-650 text-xs font-black text-zinc-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <RotateCcw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} /> Nạp đề mẫu
          </button>
          
          <button
            onClick={() => {
              playSound.click();
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-xs font-black text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
          >
            <Plus className="w-4 h-4" /> Tải lên đề mới
          </button>
        </div>
      </div>



      {/* Subject Filter Tabs */}
      {!loading && exams.length > 0 && (() => {
        const SUBJECTS = [
          { key: 'all', label: 'Tất cả', color: 'zinc' },
          { key: 'math', label: 'Toán Học', color: 'indigo' },
          { key: 'physics', label: 'Vật Lý', color: 'cyan' },
          { key: 'chemistry', label: 'Hóa Học', color: 'amber' },
          { key: 'biology', label: 'Sinh Học', color: 'rose' },
        ];
        const colorMap = {
          zinc:   { active: 'bg-zinc-700 text-white border-zinc-500', inactive: 'bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300' },
          indigo: { active: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50', inactive: 'bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:border-indigo-500/30 hover:text-indigo-400' },
          cyan:   { active: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50', inactive: 'bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:border-cyan-500/30 hover:text-cyan-400' },
          amber:  { active: 'bg-amber-500/20 text-amber-300 border-amber-500/50', inactive: 'bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:border-amber-500/30 hover:text-amber-400' },
          rose:   { active: 'bg-rose-500/20 text-rose-300 border-rose-500/50', inactive: 'bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:border-rose-500/30 hover:text-rose-400' },
        };
        return (
          <div className="flex items-center gap-2 flex-wrap">
            {SUBJECTS.map(s => {
              const count = s.key === 'all' ? exams.length : exams.filter(e => e.subject === s.key).length;
              const isActive = activeSubject === s.key;
              const cls = colorMap[s.color];
              return (
                <button key={s.key} onClick={() => { playSound.click(); setActiveSubject(s.key); }}
                  className={`px-3.5 py-1.5 rounded-xl border text-[11px] font-black font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive ? cls.active : cls.inactive
                  }`}
                >
                  {s.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive ? 'bg-white/10' : 'bg-zinc-800'
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* Main Table/Grid */}
      {loading ? (
        <div className="py-20 bg-[#0f1017]/60 border border-[#1f2235] rounded-2xl flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono font-bold text-zinc-500 tracking-widest uppercase animate-pulse">
            Đang đồng bộ dữ liệu đề thi...
          </span>
        </div>
      ) : exams.length === 0 ? (
        <div className="py-20 bg-[#0f1017]/60 border border-[#1f2235] rounded-2xl flex flex-col items-center justify-center gap-3 text-center px-4">
          <ShieldAlert className="w-12 h-12 text-zinc-650 animate-bounce" />
          <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Hệ thống chưa có đề thi tải lên</h3>
          <p className="text-xs text-zinc-500 max-w-sm">
            Bấm nút "Tải lên đề mới" ở góc trên bên phải để import các đề thi mẫu/đề thi chính thức từ file JSON.
          </p>
        </div>
      ) : (
        <div className="bg-[#0f1017]/60 border border-[#1f2235] rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1f2235] bg-[#0c0d14]/40 text-[10px] font-black uppercase tracking-wider text-zinc-450 font-mono">
                  <th className="py-4 px-6">Môn học</th>
                  <th className="py-4 px-6 text-center">Cấp độ</th>
                  <th className="py-4 px-6">Tiêu đề đề thi</th>
                  <th className="py-4 px-6">Thông tin chi tiết</th>
                  <th className="py-4 px-6">Thời gian làm bài</th>
                  <th className="py-4 px-6 text-center">Số câu hỏi</th>
                  <th className="py-4 px-6 text-center">Nguồn</th>
                  <th className="py-4 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2235]/40 text-xs font-medium">
                {exams
                  .filter(exam => activeSubject === 'all' || exam.subject === activeSubject)
                  .map((exam) => (
                  <tr key={exam.id} className="hover:bg-white/[0.02] transition-all">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`inline-block whitespace-nowrap px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${
                        exam.subject === 'math' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        exam.subject === 'physics' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                        exam.subject === 'chemistry' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {exam.subjectLabel}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <span className={`inline-block whitespace-nowrap px-2.5 py-1 text-[9px] font-bold uppercase rounded-full border ${
                        exam.difficulty === 'hard' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-sm shadow-rose-500/5' :
                        exam.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {exam.difficultyLabel || 'Cơ bản'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-white font-mono max-w-xs truncate">
                      {exam.title}
                    </td>
                    <td className="py-4 px-6 text-zinc-400 font-mono text-[11px]">
                      {exam.province} ({exam.year}) &bull; {exam.category === 'bo-gddt' ? 'Bộ GD&ĐT' : 'Trường THPT'}
                    </td>
                    <td className="py-4 px-6 font-mono text-zinc-450 flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-zinc-500" /> {Math.round(exam.timeLimit / 60)} phút
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-center text-pink-400">
                      {exam.questions?.length > 0 ? exam.questions.length : <span className="text-zinc-600 text-[10px]">—</span>}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {exam.sourceUrl ? (
                        <a href={exam.sourceUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Link
                        </a>
                      ) : <span className="text-zinc-600 text-[10px]">Nội bộ</span>}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDeleteExam(exam.id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-xl transition-all cursor-pointer active:scale-95"
                        title="Xóa đề thi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Exam */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f1017] border border-[#1f2235] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#1f2235] flex items-center justify-between bg-[#0c0d14]/40">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-pink-500" />
                <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  Tải lên đề thi thực chiến mới
                </h2>
              </div>
              <button
                onClick={() => {
                  playSound.click();
                  setIsModalOpen(false);
                }}
                className="p-1.5 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSaveExam} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-zinc-500 font-mono tracking-wider block">Tiêu đề đề thi</label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: Đề thi thử tốt nghiệp THPT Quốc Gia môn Vật Lý lần 1"
                    value={formValues.title}
                    onChange={(e) => setFormValues(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-[#08090d]/60 border border-[#1f2235] focus:border-pink-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 font-mono tracking-wider block">Môn thi</label>
                  <select
                    value={formValues.subject}
                    onChange={(e) => setFormValues(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-[#08090d]/60 border border-[#1f2235] focus:border-pink-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all font-mono"
                  >
                    <option value="physics">Vật Lý</option>
                    <option value="math">Toán Học</option>
                    <option value="chemistry">Hóa Học</option>
                    <option value="biology">Sinh Học</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 font-mono tracking-wider block">Phân loại</label>
                  <select
                    value={formValues.category}
                    onChange={(e) => setFormValues(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-[#08090d]/60 border border-[#1f2235] focus:border-pink-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all font-mono"
                  >
                    <option value="bo-gddt">Bộ GD&ĐT (Đề Minh Họa/Chính Thức)</option>
                    <option value="so-gddt">Sở GD&ĐT (Tỉnh/Thành)</option>
                    <option value="cac-truong-chuyen">Trường Chuyên & THPT</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 font-mono tracking-wider block">Cấp độ khó</label>
                  <select
                    value={formValues.difficulty}
                    onChange={(e) => setFormValues(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full bg-[#08090d]/60 border border-[#1f2235] focus:border-pink-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all font-mono"
                  >
                    <option value="easy">Cơ bản</option>
                    <option value="medium">Khá</option>
                    <option value="hard">Nâng cao</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 font-mono tracking-wider block">Đơn vị / Tỉnh thành</label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: Bộ GD&ĐT, Chuyên Hà Nội-Amsterdam"
                    value={formValues.province}
                    onChange={(e) => setFormValues(prev => ({ ...prev, province: e.target.value }))}
                    className="w-full bg-[#08090d]/60 border border-[#1f2235] focus:border-pink-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 font-mono tracking-wider block">Năm học</label>
                  <input
                    type="number"
                    required
                    value={formValues.year}
                    onChange={(e) => setFormValues(prev => ({ ...prev, year: Number(e.target.value) }))}
                    className="w-full bg-[#08090d]/60 border border-[#1f2235] focus:border-pink-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 font-mono tracking-wider block">Thời gian làm bài (giây)</label>
                  <input
                    type="number"
                    required
                    value={formValues.timeLimit}
                    onChange={(e) => setFormValues(prev => ({ ...prev, timeLimit: Number(e.target.value) }))}
                    className="w-full bg-[#08090d]/60 border border-[#1f2235] focus:border-pink-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 font-mono tracking-wider block">Import File Đề thi (.json)</label>
                  <label className="w-full bg-[#08090d]/60 border border-[#1f2235]/60 hover:border-pink-500/50 rounded-xl px-4 py-2.5 text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-all">
                    <Upload className="w-4 h-4" /> Chọn file JSON câu hỏi
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* JSON Textarea */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-zinc-500 font-mono tracking-wider">Cấu trúc câu hỏi JSON của Đề thi</label>
                  <span className="text-[9px] text-pink-400 font-mono">Chấp nhận định dạng mảng câu hỏi</span>
                </div>
                <textarea
                  rows="7"
                  required
                  placeholder='[\n  {\n    "id": "q1",\n    "type": "mcq",\n    "text": "Câu hỏi...",\n    "options": ["A", "B", "C", "D"],\n    "correctAnswer": 0,\n    "explanation": "Giải thích..."\n  }\n]'
                  value={formValues.jsonText}
                  onChange={(e) => setFormValues(prev => ({ ...prev, jsonText: e.target.value }))}
                  className="w-full bg-[#08090d]/60 border border-[#1f2235] focus:border-pink-500 rounded-xl px-4 py-3 text-[11px] text-zinc-300 font-mono focus:outline-none transition-all resize-none"
                />
              </div>

              {uploadError && (
                <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </form>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#1f2235] bg-[#0c0d14]/40 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  playSound.click();
                  setIsModalOpen(false);
                }}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-xs font-bold text-zinc-300 rounded-xl transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveExam}
                disabled={saving}
                className="px-5 py-2.5 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-800 text-xs font-black text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                {saving ? 'Đang tải lên...' : 'Lưu đề thi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
