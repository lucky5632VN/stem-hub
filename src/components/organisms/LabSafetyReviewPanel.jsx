'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, RefreshCw, Edit3, Save, FlaskConical } from 'lucide-react';

export default function LabSafetyReviewPanel({ firebaseUser, canEditReviews }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savingId, setSavingId] = useState('');
  const [drafts, setDrafts] = useState({});

  const loadItems = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    setError('');
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/lab-safety-reviews', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Không thể tải danh sách kiểm soát thí nghiệm.');
      } else {
        if (data.quotaExhausted) {
          setError('Cảnh báo: Firebase Firestore gói miễn phí (Spark) đã chạm ngưỡng 50.000 lượt đọc/ngày nên tạm thời không đồng bộ được dữ liệu mới giữa các máy. Vui lòng kiểm tra hạn mức trên Firebase Console.');
        }
        const list = Array.isArray(data.items) ? data.items : [];
        setItems(list);
        const initDrafts = {};
        list.forEach((it) => {
          initDrafts[it.id] = {
            isDangerousVerdict: it.isDangerousVerdict || (it.hazardLevel >= 3 ? 'dangerous' : 'warning'),
            isReactionCorrect: typeof it.isReactionCorrect === 'boolean' ? it.isReactionCorrect : true,
            editedExperimentTitle: it.editedExperimentTitle || it.experimentTitle || '',
            editedEquation: it.editedEquation || it.equation || '',
            editedObservation: it.editedObservation || it.observation || '',
            editedEffect: it.editedEffect || 'auto',
            teacherNote: it.teacherNote || ''
          };
        });
        setDrafts(initDrafts);
      }
    } catch (err) {
      setError('Lỗi kết nối khi tải danh sách thí nghiệm Lab Hóa.');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const updateDraft = (id, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value }
    }));
  };

  const handleSaveReview = async (id) => {
    if (!firebaseUser || !canEditReviews) return;
    setSavingId(id);
    setError('');
    setSuccess('');
    try {
      const token = await firebaseUser.getIdToken();
      const draft = drafts[id] || {};
      const res = await fetch('/api/lab-safety-reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id, ...draft })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Lưu thẩm định thất bại.');
      } else {
        setItems((prev) => {
          const updated = prev.map((it) => (it.id === id ? data.item : it));
          return [...updated].sort((a, b) => {
            const revA = (a.teacherVerified === true && a.status === 'reviewed_by_teacher') ? 1 : 0;
            const revB = (b.teacherVerified === true && b.status === 'reviewed_by_teacher') ? 1 : 0;
            if (revA !== revB) return revA - revB;
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          });
        });
        setSuccess(`Đã lưu thẩm định & chỉnh sửa của Giáo viên cho ca "${data.item?.editedExperimentTitle || data.item?.experimentTitle}".`);
      }
    } catch (err) {
      setError('Lỗi mạng khi lưu thẩm định thí nghiệm.');
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/70 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Kiểm Soát Thí Nghiệm &amp; Phản Ứng Lab Hóa (Giáo Viên Thẩm Định)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Các thí nghiệm gây nguy hiểm hoặc yêu cầu rủi ro từ Lab Hóa được AI báo trước và tự động gửi về đây để Giáo viên Hóa chấm tính nguy hiểm, kiểm tra độ đúng của phản ứng và sửa nội dung chuẩn (chỉ chấm 1 lần).
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadItems}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
          {success}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Đang tải danh sách thí nghiệm từ Lab Hóa...</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-600 dark:text-slate-400 shadow-sm">
          Chưa có ca thí nghiệm nguy hiểm nào được gửi từ Lab Hóa. Hãy thử thực hiện một phản ứng nguy hiểm trong Phòng Lab Hóa để kiểm tra luồng tự động gửi.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const draft = drafts[item.id] || {};
            const isReviewed = item.teacherVerified === true && item.status === 'reviewed_by_teacher';
            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 space-y-4 shadow-sm ${
                  isReviewed
                    ? 'bg-white dark:bg-slate-900/60 border-emerald-300 dark:border-emerald-500/35'
                    : 'bg-white dark:bg-slate-900/90 border-amber-300 dark:border-amber-500/40'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isReviewed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                          : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                      }`}>
                        {isReviewed ? '✅ Đã có Giáo viên thẩm định' : '⏳ Chờ Giáo viên kiểm soát'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Nguồn: {item.source === 'lab_hoa_ai_chat' ? 'AI Lab Hóa' : 'Mô phỏng Lab Hóa'} • {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Thí nghiệm gốc: {item.experimentTitle}
                    </h3>
                    <div className="text-xs text-cyan-700 dark:text-cyan-300 font-mono font-semibold">
                      Phản ứng gốc: {item.equation || '(Chưa có phương trình)'}
                    </div>
                    {item.missingSafety && item.missingSafety.length > 0 && (
                      <div className="text-xs text-rose-600 dark:text-rose-300 font-medium">
                        Thiếu bảo hộ: {item.missingSafety.join(', ')}
                      </div>
                    )}
                    {item.aiWarning && (
                      <div className="text-xs text-amber-900 dark:text-amber-200/90 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 rounded-lg p-2.5 mt-1">
                        <strong>Cảnh báo trước của AI:</strong> {item.aiWarning}
                      </div>
                    )}
                  </div>
                </div>

                {/* Khu vực Giáo viên chấm & sửa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      1. Đánh giá tính nguy hiểm của thí nghiệm
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { val: 'dangerous', label: '🔴 Nguy hiểm cao', cls: 'border-rose-500 bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200' },
                        { val: 'warning', label: '🟡 Cần giám sát', cls: 'border-amber-500 bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200' },
                        { val: 'safe', label: '🟢 An toàn', cls: 'border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200' }
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          disabled={!canEditReviews || isReviewed}
                          onClick={() => updateDraft(item.id, 'isDangerousVerdict', opt.val)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer disabled:cursor-not-allowed ${
                            draft.isDangerousVerdict === opt.val
                              ? opt.cls
                              : 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      2. Phản ứng hóa học hiển thị có đúng không?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={!canEditReviews || isReviewed}
                        onClick={() => updateDraft(item.id, 'isReactionCorrect', true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer disabled:cursor-not-allowed ${
                          draft.isReactionCorrect === true
                            ? 'border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
                            : 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400'
                        }`}
                      >
                        ✅ Phản ứng đúng
                      </button>
                      <button
                        type="button"
                        disabled={!canEditReviews || isReviewed}
                        onClick={() => updateDraft(item.id, 'isReactionCorrect', false)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer disabled:cursor-not-allowed ${
                          draft.isReactionCorrect === false
                            ? 'border-rose-500 bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200'
                            : 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400'
                        }`}
                      >
                        ❌ Phản ứng sai / Cần sửa
                      </button>
                    </div>
                  </div>
                </div>

                {/* Giáo viên chỉnh sửa lại thí nghiệm & phản ứng */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Edit3 className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Chỉnh sửa tên / mô tả thí nghiệm
                    </label>
                    <input
                      type="text"
                      disabled={!canEditReviews || isReviewed}
                      value={draft.editedExperimentTitle || ''}
                      onChange={(e) => updateDraft(item.id, 'editedExperimentTitle', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white disabled:opacity-70"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Edit3 className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Chỉnh sửa phương trình phản ứng
                    </label>
                    <input
                      type="text"
                      disabled={!canEditReviews || isReviewed}
                      value={draft.editedEquation || ''}
                      onChange={(e) => updateDraft(item.id, 'editedEquation', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-cyan-700 dark:text-cyan-300 font-mono disabled:opacity-70"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Chỉnh sửa hiện tượng / hướng dẫn an toàn chuẩn
                    </label>
                    <textarea
                      rows={2}
                      disabled={!canEditReviews || isReviewed}
                      value={draft.editedObservation || ''}
                      onChange={(e) => updateDraft(item.id, 'editedObservation', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white disabled:opacity-70"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Hiệu ứng hiện tượng hiển thị đúng trên màn hình Lab (Nếu hiệu ứng cũ bị sai)
                    </label>
                    <select
                      disabled={!canEditReviews || isReviewed}
                      value={draft.editedEffect || 'auto'}
                      onChange={(e) => updateDraft(item.id, 'editedEffect', e.target.value)}
                      className="w-full md:w-1/2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-amber-700 dark:text-amber-300 font-semibold disabled:opacity-70"
                    >
                      <option value="auto">Giữ theo phản ứng gốc</option>
                      <option value="explosion">💥 Nổ mạnh &amp; tia lửa</option>
                      <option value="gas">💨 Sủi bọt / Bốc khí - khói</option>
                      <option value="burn">🔥 Cháy sáng / Tỏa nhiệt mạnh</option>
                      <option value="precipitate-color">🧪 Kết tủa / Đổi màu</option>
                      <option value="none">🫧 Không phản ứng / An toàn (Tắt cảnh báo nổ)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-1">
                    <input
                      type="text"
                      disabled={!canEditReviews || isReviewed}
                      placeholder="Ghi chú thêm của Giáo viên..."
                      value={draft.teacherNote || ''}
                      onChange={(e) => updateDraft(item.id, 'teacherNote', e.target.value)}
                      className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 disabled:opacity-70"
                    />
                    {isReviewed ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn tất thẩm định (Chỉ chấm 1 lần)
                      </span>
                    ) : canEditReviews ? (
                      <button
                        type="button"
                        disabled={savingId === item.id}
                        onClick={() => handleSaveReview(item.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {savingId === item.id ? 'Đang lưu...' : 'Lưu & Xác nhận Giáo viên'}
                      </button>
                    ) : (
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" /> Chỉ Giáo viên Hóa học / Admin được quyền chấm
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
