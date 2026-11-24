'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CheckCircle2, XCircle, FileText, Download, Send, ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';

export default function MathAnswerKeyCheckPage() {
  const { user } = useAppStore();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState({});
  const [globalNote, setGlobalNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetch('/api/reviews/answer-key-check')
      .then(res => res.json())
      .then(data => {
        if (data.cases) {
          setCases(data.cases);
          // Khởi tạo form
          const initialReviews = {};
          data.cases.forEach(c => {
            initialReviews[c.id] = {
              agree: true,
              confirmedSource: '',
              teacherNote: ''
            };
          });
          setReviews(initialReviews);
        }
      })
      .catch(err => setErrorMsg('Không thể tải danh sách câu hỏi: ' + err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleFieldChange = (caseId, field, value) => {
    setReviews(prev => ({
      ...prev,
      [caseId]: {
        ...prev[caseId],
        [field]: value
      }
    }));
  };

  const handleDownloadCsv = () => {
    let csv = '\uFEFF';
    csv += '"STT","Ma_Cau_Hoi","Phan_Tang","Cau_Hoi","Dap_An_Chuan_De_Xuat","Nguon_SGK_Goi_Y","Y_Kien_Giao_Vien","Nguon_Chinh_Thuc_Xac_Nhan","Ghi_Chu_Chuyen_Mon"\n';
    cases.forEach((c, idx) => {
      const rev = reviews[c.id] || {};
      const agreeText = rev.agree ? 'Đồng ý' : 'Không đồng ý';
      csv += `${idx + 1},"${c.id}","${c.stratum}","${(c.question || '').replace(/"/g, '""')}","${(c.groundTruth || '').replace(/"/g, '""')}","${(c.sgkSource || '').replace(/"/g, '""')}","${agreeText}","${(rev.confirmedSource || '').replace(/"/g, '""')}","${(rev.teacherNote || '').replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phieu_kiem_dap_an_toan_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (!user) {
      setErrorMsg('Vui lòng đăng nhập bằng tài khoản giáo viên được cấp quyền để gửi phiếu.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setErrorMsg('Vui lòng đăng nhập bằng tài khoản để gửi phiếu.');
        setSubmitting(false);
        return;
      }
      const token = await currentUser.getIdToken();
      const checksArray = Object.keys(reviews).map(id => ({
        caseId: id,
        agree: reviews[id].agree,
        confirmedSource: reviews[id].confirmedSource,
        teacherNote: reviews[id].teacherNote
      }));

      const res = await fetch('/api/reviews/answer-key-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          checks: checksArray,
          globalNote
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi gửi phiếu kiểm tra.');

      setSuccessMsg(`Đã ghi nhận phiếu kiểm tra thành công (Mã phiếu: ${data.reviewId})! Cảm ơn Quý Thầy/Cô đã hỗ trợ dự án.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        
        {/* Thanh tiêu đề */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
          <div>
            <Link href="/danh-gia-chuyen-mon" className="inline-flex items-center gap-2 text-xs font-bold text-cyan-700 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Cổng Thẩm Định
            </Link>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              Tác Vụ Kiểm Tra & Thẩm Định Đáp Án Môn Toán
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Dành riêng cho Giáo viên Toán: Xem lại đề bài, đáp án chuẩn đề xuất, nguồn SGK và xác nhận tính chuẩn xác khoa học.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownloadCsv}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Tải Bản In CSV
            </button>
          </div>
        </div>

        {/* Thông báo nguyên tắc */}
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-900 dark:text-blue-200 space-y-1">
            <div className="font-bold text-blue-950 dark:text-white text-sm">Nguyên Tắc Lưu Trữ & Thẩm Định Độc Lập</div>
            <p>
              Phiếu kiểm tra của Quý Thầy/Cô được lưu riêng vào cơ sở dữ liệu (collection <code className="text-cyan-700 dark:text-cyan-300 font-bold">teacher_answer_key_reviews</code>).
              Hệ thống tuyệt đối <strong>không tự động thay thế</strong> vai trò người kiểm của nhóm nghiên cứu, mà dùng làm căn cứ đối chiếu chuyên môn để nhóm cập nhật lại bộ đáp án kèm văn bản chứng minh.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/50 rounded-xl text-red-800 dark:text-red-200 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/50 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Bảng câu hỏi Toán */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">Đang tải danh sách câu hỏi Toán...</div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Danh Sách Câu Hỏi Môn Toán ({cases.length} câu)
            </div>

            {cases.map((c, idx) => {
              const rev = reviews[c.id] || { agree: true, confirmedSource: '', teacherNote: '' };
              return (
                <div key={c.id} className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm dark:shadow-none transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-mono text-xs font-bold rounded">
                        #{idx + 1}
                      </span>
                      <span className="font-mono text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                        {c.id}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-medium">
                        {c.stratum === 'in_scope_numerical' ? 'Bài toán số liệu / công thức' : 'Khái niệm SGK'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white">
                        <input
                          type="radio"
                          name={`agree_${c.id}`}
                          checked={rev.agree === true}
                          onChange={() => handleFieldChange(c.id, 'agree', true)}
                          className="accent-emerald-600 dark:accent-emerald-500"
                        />
                        <span className={rev.agree ? 'text-emerald-700 dark:text-emerald-400 font-bold' : ''}>Đồng ý</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white">
                        <input
                          type="radio"
                          name={`agree_${c.id}`}
                          checked={rev.agree === false}
                          onChange={() => handleFieldChange(c.id, 'agree', false)}
                          className="accent-rose-600 dark:accent-rose-500"
                        />
                        <span className={!rev.agree ? 'text-rose-700 dark:text-rose-400 font-bold' : ''}>Không đồng ý</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="text-slate-600 dark:text-slate-400 font-semibold">Đề bài câu hỏi:</div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 leading-relaxed font-sans">
                        {c.question}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-slate-600 dark:text-slate-400 font-semibold">Đáp án chuẩn đề xuất (Ground Truth):</div>
                      <div className="p-3 bg-emerald-50/60 dark:bg-slate-950/60 rounded-xl border border-emerald-200 dark:border-slate-800 text-emerald-900 dark:text-emerald-300 leading-relaxed font-sans font-bold">
                        {c.groundTruth}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Gợi ý nguồn: <span className="text-slate-600 dark:text-slate-400">{c.sgkSource}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vùng giáo viên điền */}
                  <div className="grid md:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Nguồn xác nhận chính thức (ghi nếu Thầy/Cô biết đề thi/SGK cụ thể):
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Đề thi TN THPT 2024, Mã đề 101, Câu 32"
                        value={rev.confirmedSource}
                        onChange={(e) => handleFieldChange(c.id, 'confirmedSource', e.target.value)}
                        className="w-full bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Ghi chú chuyên môn / Đề xuất chỉnh sửa (nếu có):
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Cần bổ sung điều kiện x > 0 hoặc đơn vị..."
                        value={rev.teacherNote}
                        onChange={(e) => handleFieldChange(c.id, 'teacherNote', e.target.value)}
                        className="w-full bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Ghi chú tổng và Nút nộp */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nhận xét tổng thể của Thầy/Cô về toàn bộ bộ đề Toán:
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi nhận xét chung về độ khó, độ bao phủ chương trình GDPT 2018..."
                  value={globalNote}
                  onChange={(e) => setGlobalNote(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black rounded-xl text-sm flex items-center gap-2 shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Đang gửi phiếu...' : 'Gửi Phiếu Thẩm Định Đáp Án'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
  );
}
