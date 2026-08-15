'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { EXAM_DATABASE } from '@/data/exams';
import { 
  Plus, Edit, Trash2, Search, X, Check, FileText, 
  HelpCircle, Eye, EyeOff, Sparkles, Filter
} from 'lucide-react';
import { playSound } from '@/lib/sound';
import { logAdminAction } from '@/lib/adminLogger';

import { formatMathText } from '@/lib/mathFormatter';

import { generateAllSubjectQuestions } from '@/lib/questionAiGenerator';

export default function QuestionManagement() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  
  // Form Values
  const [formValues, setFormValues] = useState({
    type: 'mcq',
    text: '',
    choiceA: '',
    choiceB: '',
    choiceC: '',
    choiceD: '',
    correct: 0,
    subject: 'math',
    difficulty: 'medium',
    status: 'public',
    explanation: ''
  });

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'questions'));
      const qList = [];
      querySnapshot.forEach((docSnap) => {
        qList.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      
      // Sắp xếp theo ngày tạo mới nhất
      qList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setQuestions(qList);
    } catch (err) {
      console.error("Lỗi khi tải danh sách câu hỏi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Xóa cũ & AI Nạp >2.200 câu hỏi mẫu đa dạng (>550 câu/môn: Toán, Lý, Hóa, Sinh)
  const handleSeedQuestions = async () => {
    playSound.click();
    if (confirm("⚠️ CẢNH BÁO: Hệ thống sẽ XÓA SẠCH TOÀN BỘ câu hỏi trùng lặp hiện tại trong Firestore và tiến hành AI NẠP MỚI >2.200 CÂU HỎI ĐA DẠNG (>550 câu/môn: Toán, Lý, Hóa, Sinh - gồm Trắc nghiệm, Đúng/Sai, Trả lời ngắn).\n\nBạn có chắc chắn muốn tiếp tục không?")) {
      try {
        setSeeding(true);
        setSeedProgress('Đang xóa các câu hỏi trùng lặp cũ...');

        // 1. Lấy toàn bộ danh sách câu hỏi cũ để xóa theo đợt batch (400 items/batch)
        const oldSnap = await getDocs(collection(db, 'questions'));
        const oldDocs = oldSnap.docs;

        let batch = writeBatch(db);
        let countOp = 0;
        for (let i = 0; i < oldDocs.length; i++) {
          batch.delete(doc(db, 'questions', oldDocs[i].id));
          countOp++;
          if (countOp >= 400) {
            await batch.commit();
            batch = writeBatch(db);
            countOp = 0;
            setSeedProgress(`Đã xóa ${i + 1}/${oldDocs.length} câu hỏi cũ...`);
          }
        }
        if (countOp > 0) {
          await batch.commit();
        }

        // 2. Sinh ngân hàng câu hỏi AI mới (>2200 câu)
        setSeedProgress('AI đang khởi tạo >2.200 câu hỏi mới...');
        const generatedData = generateAllSubjectQuestions();
        const allNewQuestions = generatedData.all;

        // 3. Ghi dữ liệu mới vào Firestore theo batch (400 items/batch)
        batch = writeBatch(db);
        countOp = 0;
        let insertedTotal = 0;

        for (let i = 0; i < allNewQuestions.length; i++) {
          const qObj = allNewQuestions[i];
          const newDocRef = doc(collection(db, 'questions'));
          batch.set(newDocRef, {
            ...qObj,
            createdAt: new Date().toISOString()
          });
          countOp++;
          insertedTotal++;

          if (countOp >= 400) {
            await batch.commit();
            batch = writeBatch(db);
            countOp = 0;
            setSeedProgress(`Đã nạp ${insertedTotal}/${allNewQuestions.length} câu hỏi mới...`);
          }
        }

        if (countOp > 0) {
          await batch.commit();
        }

        playSound.success();
        await logAdminAction("SEED_QUESTIONS", "all", "AI Nạp ngân hàng câu hỏi mới", `Đã xóa cũ và nạp thành công ${insertedTotal} câu hỏi mới (>550 câu/môn)`);
        alert(`🎉 THÀNH CÔNG: Đã xóa toàn bộ câu hỏi cũ và nạp thành công ${insertedTotal} câu hỏi AI mới đa dạng (>550 câu mỗi môn Toán, Lý, Hóa, Sinh) bao gồm Trắc nghiệm, Đúng/Sai và Trả lời ngắn!`);
        fetchQuestions();
      } catch (err) {
        console.error("Lỗi khi nạp câu hỏi mẫu:", err);
        alert("Đã xảy ra lỗi trong quá trình xóa và nạp câu hỏi.");
      } finally {
        setSeeding(false);
        setSeedProgress('');
      }
    }
  };

  // Mở modal Thêm câu hỏi
  const handleOpenAdd = () => {
    playSound.click();
    setEditingQuestion(null);
    setFormValues({
      text: '',
      choiceA: '',
      choiceB: '',
      choiceC: '',
      choiceD: '',
      correct: 0,
      subject: 'math',
      difficulty: 'medium',
      status: 'public',
      explanation: ''
    });
    setIsModalOpen(true);
  };

  // Mở modal Sửa câu hỏi
  const handleOpenEdit = (q) => {
    playSound.click();
    setEditingQuestion(q);
    setFormValues({
      text: q.text || '',
      choiceA: q.choices?.[0] || '',
      choiceB: q.choices?.[1] || '',
      choiceC: q.choices?.[2] || '',
      choiceD: q.choices?.[3] || '',
      correct: q.correct !== undefined ? q.correct : 0,
      subject: q.subject || 'math',
      difficulty: q.difficulty || 'medium',
      status: q.status || 'public',
      explanation: q.explanation || ''
    });
    setIsModalOpen(true);
  };

  // Lưu câu hỏi (Add hoặc Update)
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    playSound.click();

    const { text, choiceA, choiceB, choiceC, choiceD, correct, subject, difficulty, status, explanation } = formValues;

    if (!text.trim() || !choiceA.trim() || !choiceB.trim() || !choiceC.trim() || !choiceD.trim()) {
      alert("Vui lòng nhập đầy đủ nội dung câu hỏi và 4 đáp án.");
      return;
    }

    const payload = {
      text: text.trim(),
      choices: [choiceA.trim(), choiceB.trim(), choiceC.trim(), choiceD.trim()],
      correct: Number(correct),
      subject,
      difficulty,
      status,
      explanation: explanation.trim(),
      updatedAt: new Date().toISOString()
    };

    try {
      setLoading(true);
      if (editingQuestion) {
        // Cập nhật câu hỏi
        const qRef = doc(db, 'questions', editingQuestion.id);
        await updateDoc(qRef, payload);
        await logAdminAction("UPDATE_QUESTION", editingQuestion.id, payload.text, "Cập nhật nội dung câu hỏi");
        playSound.success();
        
        setQuestions(prev => prev.map(item => item.id === editingQuestion.id ? { ...item, ...payload } : item));
      } else {
        // Thêm câu hỏi mới
        payload.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, 'questions'), payload);
        await logAdminAction("ADD_QUESTION", docRef.id, payload.text, "Thêm câu hỏi mới");
        playSound.success();
        
        setQuestions(prev => [{ id: docRef.id, ...payload }, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Lỗi khi lưu câu hỏi:", err);
    } finally {
      setLoading(false);
    }
  };

  // Xóa câu hỏi
  const handleDeleteQuestion = async (id) => {
    playSound.click();
    const q = questions.find(item => item.id === id);
    const qText = q ? q.text : '';
    if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn câu hỏi này khỏi ngân hàng câu hỏi không?")) {
      try {
        setLoading(true);
        await deleteDoc(doc(db, 'questions', id));
        await logAdminAction("DELETE_QUESTION", id, qText, "Xóa câu hỏi vĩnh viễn");
        setQuestions(prev => prev.filter(item => item.id !== id));
        playSound.success();
      } catch (err) {
        console.error("Lỗi khi xóa câu hỏi:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Toggle trạng thái Công khai / Nháp nhanh
  const handleToggleStatus = async (q) => {
    playSound.click();
    const nextStatus = q.status === 'public' ? 'draft' : 'public';
    try {
      const qRef = doc(db, 'questions', q.id);
      await updateDoc(qRef, { status: nextStatus });
      await logAdminAction("UPDATE_QUESTION", q.id, q.text || '', `Đổi trạng thái câu hỏi thành: ${nextStatus === 'public' ? 'Công khai' : 'Nháp'}`);
      setQuestions(prev => prev.map(item => item.id === q.id ? { ...item, status: nextStatus } : item));
      playSound.success();
    } catch (err) {
      console.error("Lỗi khi đổi trạng thái câu hỏi:", err);
    }
  };

  // Lọc dữ liệu hiển thị
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = (q.text || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || q.subject === selectedSubject;
    const qType = q.type || 'mcq';
    const matchesType = selectedType === 'all' || qType === selectedType;
    return matchesSearch && matchesSubject && matchesType;
  });

  const getSubjectLabel = (subj) => {
    const subjects = {
      math: { label: 'Toán học', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      physics: { label: 'Vật lý', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
      chemistry: { label: 'Hóa học', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
      biology: { label: 'Sinh học', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
    };
    return subjects[subj] || { label: 'Khác', color: 'bg-zinc-800 text-zinc-400' };
  };

  const getTypeLabel = (type) => {
    const types = {
      mcq: { label: 'Trắc nghiệm (MCQ)', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
      tf: { label: 'Đúng / Sai (TF)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
      sa: { label: 'Trả lời ngắn (SA)', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' }
    };
    return types[type] || { label: 'Trắc nghiệm', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
  };

  const getDifficultyLabel = (diff) => {
    const difficulties = {
      easy: { label: 'Dễ', color: 'text-emerald-450 bg-emerald-500/5 border border-emerald-500/10' },
      medium: { label: 'Trung bình', color: 'text-amber-400 bg-amber-500/5 border border-amber-500/10' },
      hard: { label: 'Khó', color: 'text-rose-450 bg-rose-500/5 border border-rose-500/10' }
    };
    return difficulties[diff] || { label: 'Mặc định', color: 'text-zinc-400' };
  };

  return (
    <div className="space-y-6 text-zinc-300 font-sans select-none">
      {/* Title & Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider font-mono">
            Ngân hàng câu hỏi
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Quản lý ngân hàng câu hỏi 4 môn STEM (Toán, Lý, Hóa, Sinh) đa dạng chuẩn GDPT.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Seed questions button - always available */}
          {!loading && (
            <button
              onClick={handleSeedQuestions}
              disabled={seeding}
              className="px-4.5 py-2.5 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 hover:from-purple-600/40 hover:to-pink-600/40 border border-purple-500/30 hover:border-pink-500/50 text-xs font-bold text-white rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" /> 
              {seeding ? (seedProgress || 'Đang xử lý...') : 'Xóa cũ & AI Nạp 2200+ câu hỏi (>550 câu/môn)'}
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="px-4.5 py-2.5 bg-pink-500 hover:bg-pink-600 border border-pink-500/30 hover:border-pink-400 text-xs font-bold text-white rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Thêm câu hỏi
          </button>
        </div>
      </div>

      {/* Search and Tab filter area */}
      <div className="flex flex-col gap-3 bg-[#0f1017]/60 border border-[#1f2235] p-4 rounded-2xl shadow-lg">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung câu hỏi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white focus:outline-none placeholder-zinc-500 transition-all font-mono"
            />
          </div>

          {/* Subject Tab Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
            {[
              { id: 'all', label: 'Tất cả môn' },
              { id: 'math', label: 'Toán học' },
              { id: 'physics', label: 'Vật lý' },
              { id: 'chemistry', label: 'Hóa học' },
              { id: 'biology', label: 'Sinh học' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  playSound.click();
                  setSelectedSubject(tab.id);
                }}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all border ${
                  selectedSubject === tab.id
                    ? 'bg-pink-500/10 border-pink-500/30 text-white shadow-md'
                    : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type Format Filters */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#1f2235]/40 text-xs font-bold font-mono">
          <span className="text-zinc-500 text-[10px] uppercase">Dạng bài:</span>
          {[
            { id: 'all', label: 'Tất cả dạng' },
            { id: 'mcq', label: 'Trắc nghiệm (MCQ)' },
            { id: 'tf', label: 'Đúng / Sai (TF)' },
            { id: 'sa', label: 'Trả lời ngắn (SA)' },
          ].map(tTab => (
            <button
              key={tTab.id}
              onClick={() => {
                playSound.click();
                setSelectedType(tTab.id);
              }}
              className={`px-3 py-1 text-[11px] rounded-lg transition-all border ${
                selectedType === tTab.id
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                  : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tTab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 bg-[#0f1017]/60 border border-[#1f2235] rounded-2xl flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono font-bold text-zinc-550 tracking-widest uppercase animate-pulse">
              {seeding ? (seedProgress || 'Đang xử lý nạp câu hỏi...') : 'Đang tải danh sách câu hỏi...'}
            </span>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="py-20 bg-[#0f1017]/60 border border-[#1f2235] rounded-2xl text-center flex flex-col items-center justify-center gap-3">
            <HelpCircle className="w-12 h-12 text-zinc-650" />
            <span className="text-xs font-bold text-zinc-550 uppercase font-mono">
              Chưa có câu hỏi nào trong mục này
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredQuestions.map((q, idx) => {
              const subj = getSubjectLabel(q.subject);
              const diff = getDifficultyLabel(q.difficulty);
              const typeInfo = getTypeLabel(q.type || 'mcq');
              const qType = q.type || 'mcq';

              return (
                <div 
                  key={q.id}
                  className="bg-[#0f1017]/60 border border-[#1f2235] hover:border-pink-500/10 p-5 rounded-2xl transition-all duration-200 group relative flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
                >
                  <div className="space-y-3 flex-1">
                    {/* Header: Subject, Type & Difficulty tags */}
                    <div className="flex items-center gap-2 flex-wrap text-[9px] font-black uppercase tracking-wider font-mono">
                      <span className="text-zinc-500">#{idx + 1}</span>
                      <span className={`px-2 py-0.5 rounded border ${subj.color}`}>{subj.label}</span>
                      <span className={`px-2 py-0.5 rounded border ${typeInfo.color}`}>{typeInfo.label}</span>
                      <span className={`px-2 py-0.5 rounded ${diff.color}`}>{diff.label}</span>
                      
                      {/* Status Tag */}
                      {q.status === 'draft' ? (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">Bản nháp</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">Công khai</span>
                      )}
                    </div>

                    {/* Question Content */}
                    <div 
                      className="text-white text-sm font-bold font-mono leading-relaxed q-content-math"
                      dangerouslySetInnerHTML={{ __html: formatMathText(q.text) }}
                    />

                    {/* Choices / Sub-statements / Short Answer Content */}
                    {qType === 'mcq' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-zinc-400">
                        {q.choices?.map((choice, cIdx) => (
                          <div 
                            key={cIdx} 
                            className={`flex items-start gap-2 p-2 rounded-lg border ${
                              q.correct === cIdx 
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 font-bold' 
                                : 'bg-[#08090d]/60 border-zinc-800/40'
                            }`}
                          >
                            <span className="text-zinc-500 uppercase font-black">{String.fromCharCode(65 + cIdx)}.</span>
                            <span dangerouslySetInnerHTML={{ __html: formatMathText(choice) }} />
                          </div>
                        ))}
                      </div>
                    )}

                    {qType === 'tf' && (
                      <div className="space-y-1.5 text-xs font-mono">
                        {(q.statements || q.choices || []).map((st, sIdx) => {
                          const isTrue = Array.isArray(q.correct) ? q.correct[sIdx] : true;
                          return (
                            <div key={sIdx} className="flex items-center justify-between p-2 rounded-lg bg-[#08090d]/60 border border-zinc-800/40">
                              <span className="text-zinc-300 font-semibold" dangerouslySetInnerHTML={{ __html: formatMathText(typeof st === 'string' ? st : (st.text || '')) }} />
                              <span className={`px-2 py-0.5 rounded font-black text-[10px] ${isTrue ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                                {isTrue ? 'ĐÚNG' : 'SAI'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {qType === 'sa' && (
                      <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs font-mono flex items-center gap-2">
                        <span className="text-indigo-400 font-bold">👉 Đáp số đúng:</span>
                        <span className="text-white font-black">{q.correctAnswer || q.choices?.[0] || 'N/A'}</span>
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="text-[10px] text-zinc-500 italic mt-1 font-mono leading-relaxed flex gap-1 items-start">
                        <span className="shrink-0">* Giải thích:</span>
                        <span dangerouslySetInnerHTML={{ __html: formatMathText(q.explanation) }} />
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center md:flex-col justify-end gap-2 shrink-0 border-t md:border-t-0 border-[#1f2235]/40 pt-3 md:pt-0">
                    {/* Toggle status */}
                    <button
                      onClick={() => handleToggleStatus(q)}
                      title={q.status === 'public' ? "Chuyển thành Nháp" : "Chuyển thành Công khai"}
                      className={`p-2 border rounded-xl transition-all cursor-pointer active:scale-90 flex items-center justify-center ${
                        q.status === 'public'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {q.status === 'public' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(q)}
                      title="Sửa nội dung"
                      className="p-2 bg-[#141622] hover:bg-[#1b1e30] border border-[#1f2235] text-zinc-350 hover:text-white rounded-xl transition-all cursor-pointer active:scale-90"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      title="Xóa câu hỏi"
                      className="p-2 bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-rose-450 hover:text-white rounded-xl transition-all cursor-pointer active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUESTION FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <form 
            onSubmit={handleSaveQuestion}
            className="w-full max-w-xl bg-[#0c0d14] border border-[#1f2235] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[#1f2235] flex items-center justify-between bg-[#0f1017]/80">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-pink-500 filter drop-shadow-[0_0_6px_rgba(244,63,94,0.2)]" />
                <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">
                  {editingQuestion ? 'Cập nhật câu hỏi' : 'Tạo câu hỏi mới'}
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
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm font-semibold">
              
              {/* Subject & Difficulty & Status row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Chuyên môn</label>
                  <select
                    value={formValues.subject}
                    onChange={(e) => setFormValues(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-[#08090d] border border-[#1f2235] rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50"
                  >
                    <option value="math">Toán học</option>
                    <option value="physics">Vật lý</option>
                    <option value="chemistry">Hóa học</option>
                    <option value="biology">Sinh học</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Độ khó</label>
                  <select
                    value={formValues.difficulty}
                    onChange={(e) => setFormValues(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full bg-[#08090d] border border-[#1f2235] rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50"
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Trạng thái</label>
                  <select
                    value={formValues.status}
                    onChange={(e) => setFormValues(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-[#08090d] border border-[#1f2235] rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50"
                  >
                    <option value="public">Công khai</option>
                    <option value="draft">Bản nháp</option>
                  </select>
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Nội dung câu hỏi</label>
                <textarea
                  rows="3"
                  value={formValues.text}
                  onChange={(e) => setFormValues(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Nhập đề bài câu hỏi..."
                  className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none placeholder-zinc-700 transition-all font-mono"
                />
              </div>

              {/* 4 Choices */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Các phương án trả lời</label>
                
                {[
                  { key: 'choiceA', label: 'Đáp án A' },
                  { key: 'choiceB', label: 'Đáp án B' },
                  { key: 'choiceC', label: 'Đáp án C' },
                  { key: 'choiceD', label: 'Đáp án D' },
                ].map((item, idx) => (
                  <div key={item.key} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correctChoice"
                      checked={formValues.correct === idx}
                      onChange={() => setFormValues(prev => ({ ...prev, correct: idx }))}
                      className="w-4 h-4 text-pink-500 accent-pink-500 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formValues[item.key]}
                      onChange={(e) => setFormValues(prev => ({ ...prev, [item.key]: e.target.value }))}
                      placeholder={`Nội dung ${item.label}...`}
                      className="flex-1 bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none placeholder-zinc-700 transition-all font-mono"
                    />
                  </div>
                ))}
              </div>

              {/* Explanation Text */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-550 uppercase tracking-widest font-mono">Lời giải chi tiết (Giải thích)</label>
                <textarea
                  rows="2"
                  value={formValues.explanation}
                  onChange={(e) => setFormValues(prev => ({ ...prev, explanation: e.target.value }))}
                  placeholder="Nhập lời giải hoặc kiến thức liên quan..."
                  className="w-full bg-[#08090d] border border-[#1f2235] focus:border-pink-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none placeholder-zinc-700 transition-all font-mono"
                />
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
                {editingQuestion ? 'Lưu cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
