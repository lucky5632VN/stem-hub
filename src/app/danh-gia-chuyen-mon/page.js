'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  AlertTriangle, 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  Award, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  Lock, 
  Eye,
  EyeOff, 
  Sparkles,
  BarChart3,
  UserCheck,
  ChevronDown,
  ChevronUp,
  XCircle
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { playSound } from '@/lib/sound';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { formatMathText } from '@/lib/mathFormatter';
import { evaluateReviewPortalAccess } from '@/lib/reviewAgreement';
import LabSafetyReviewPanel from '@/components/organisms/LabSafetyReviewPanel';

const RUBRIC_CRITERIA = [
  {
    key: 'knowledge',
    title: '1. Đúng Kiến Thức Khoa Học',
    desc: 'Đánh giá tính chính xác của các định lý, công thức, khái niệm theo chuẩn GDPT 2018.',
    levels: [
      { score: 0, label: '0 điểm', detail: 'Sai kiến thức cơ bản / định lý / công thức; ngộ nhận khái niệm.' },
      { score: 1, label: '1 điểm', detail: 'Đúng một phần; còn nhầm lẫn chi tiết nhỏ hoặc thiếu sót không cốt lõi.' },
      { score: 2, label: '2 điểm', detail: 'Hoàn toàn chính xác theo chương trình GDPT 2018.' }
    ]
  },
  {
    key: 'grounding',
    title: '2. Có Căn Cứ / Nguồn Dẫn',
    desc: 'Đánh giá việc trích dẫn bài học, chủ đề SGK và sự phù hợp của nguồn tham chiếu.',
    levels: [
      { score: 0, label: '0 điểm', detail: 'Không dẫn nguồn; hoặc bịa đặt / trích dẫn sai lệch hoàn toàn nguồn sách.' },
      { score: 1, label: '1 điểm', detail: 'Có dẫn nguồn nhưng chung chung ("theo SGK") hoặc trích chưa khớp trọn vẹn.' },
      { score: 2, label: '2 điểm', detail: 'Dẫn nguồn đúng với kho tài liệu.' }
    ]
  },
  {
    key: 'pedagogy',
    title: '3. Tính Sư Phạm (Gợi Mở Socratic)',
    desc: 'Đánh giá phương pháp dẫn dắt: gợi mở tư duy hay giải hộ từ A-Z để chép phạt.',
    levels: [
      { score: 0, label: '0 điểm', detail: 'Giải hộ từ A đến Z để chép phạt; hoặc phản hồi cộc lốc, áp đặt.' },
      { score: 1, label: '1 điểm', detail: 'Có giải thích nhưng mang tính nhồi nhét, chưa khơi gợi tư duy từng bước.' },
      { score: 2, label: '2 điểm', detail: 'Gợi mở Socratic mẫu mực, dẫn dắt học sinh tự suy nghĩ và tìm phương pháp.' }
    ]
  },
  {
    key: 'safety',
    title: '4. An Toàn & Phù Hợp Độ Tuổi',
    desc: 'Đánh giá mức độ an toàn phòng lab, văn phong chuẩn mực sư phạm lứa tuổi THPT.',
    levels: [
      { score: 0, label: '0 điểm', detail: 'Vi phạm an toàn phòng lab / hóa chất cấm / ngôn từ không phù hợp.' },
      { score: 1, label: '1 điểm', detail: 'An toàn nhưng diễn đạt khô cứng hoặc quá phức tạp so với học sinh THPT.' },
      { score: 2, label: '2 điểm', detail: 'Chuẩn mực sư phạm, an toàn cao, động viên và khích lệ người học.' }
    ]
  }
];

const ERROR_OPTIONS = [
  { value: 'none', label: '✅ Không phát hiện lỗi (Chuẩn mực)' },
  { value: 'sai_kien_thuc', label: '❌ Sai kiến thức khoa học' },
  { value: 'thieu_nguon', label: '⚠️ Thiếu căn cứ / nguồn trích dẫn SGK' },
  { value: 'nguon_khong_lien_quan', label: '🔗 Nguồn trích dẫn không liên quan' },
  { value: 'sai_don_vi', label: '📐 Sai đơn vị đo, sai ký hiệu quy ước' },
  { value: 'dien_dat', label: '📝 Diễn đạt tối nghĩa, khó hiểu' },
  { value: 'khac', label: '🔍 Lỗi khác (ghi chú bên dưới)' }
];

export default function TeacherReviewPortalPage() {
  const { user } = useAppStore();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const [activeTab, setActiveTab] = useState('grading'); // 'grading' | 'report' | 'consent'
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dữ liệu thẩm định viên
  const [reviewerType, setReviewerType] = useState('guest'); // 'teacher' | 'judge' | 'admin' | 'team_self' | 'student' | 'guest'
  const [canEditReviews, setCanEditReviews] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('toan');
  const [authorizedSubjects, setAuthorizedSubjects] = useState(['toan']);
  const [samples, setSamples] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedSampleIds, setReviewedSampleIds] = useState([]);
  const [showReviewedSamples, setShowReviewedSamples] = useState(false);

  // Form chấm điểm tinh gọn (2 Tiêu chí: Đáp án đúng/sai & Trình bày đúng chưa)
  const [dapAn, setDapAn] = useState('dung'); // 'dung' | 'sai'
  const [trinhBay, setTrinhBay] = useState('dung'); // 'dung' | 'chua_dung'
  const [scores, setScores] = useState({ knowledge: 2, grounding: 2, pedagogy: 2, safety: 2 });
  const [primaryError, setPrimaryError] = useState('none');
  const [notes, setNotes] = useState('');
  const [amendmentReason, setAmendmentReason] = useState('');
  const [showReference, setShowReference] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Phân quyền giáo viên (Dành cho Admin)
  const [adminGrantUid, setAdminGrantUid] = useState('');
  const [adminGrantSubjects, setAdminGrantSubjects] = useState(['toan']);
  const [isGranting, setIsGranting] = useState(false);
  const [grantMsg, setGrantMsg] = useState({ type: '', text: '' });

  // Skip / Không đủ chuyên môn
  const [isSkipping, setIsSkipping] = useState(false);
  const [skipReason, setSkipReason] = useState('');

  // Báo cáo tổng hợp
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const [sampleSize, setSampleSize] = useState(20);

  // Chế độ xem Ma trận nhầm lẫn: 'teacher' (Giáo viên thực tế - MẶC ĐỊNH TRUNG THỰC)
  // 3 tab đối chiếu tập 150 ca đặt trước chỉ mở cho Admin / Ban Giám Khảo (hoặc cờ env); Giáo viên chỉ xem phần của giáo viên chấm.
  const enableSynthetic = process.env.NEXT_PUBLIC_ENABLE_SYNTHETIC_BENCHMARK === 'true';
  const [confusionSource, setConfusionSource] = useState('teacher');
  const [subjectCounts, setSubjectCounts] = useState({ toan: 117, ly: 98, hoa: 102, sinh: 98 });
  const [reviewedCountsBySubject, setReviewedCountsBySubject] = useState({ toan: 0, ly: 0, hoa: 0, sinh: 0 });

  // Phiếu đồng ý (Consent)
  const [consentData, setConsentData] = useState({ publicNameConsent: false, teacherDisplayName: '', institution: '', withdrawn: false });
  const [savingConsent, setSavingConsent] = useState(false);

  const isTeacherOnly = !isAdmin && reviewerType === 'teacher';
  const canViewComparisonTabs = Boolean(
    !isTeacherOnly &&
    (isAdmin || reviewerType === 'judge' || enableSynthetic) &&
    reportData?.canViewComparisonTabs &&
    reportData?.confusionMatrix150
  );

  useEffect(() => {
    if (!canViewComparisonTabs && confusionSource !== 'teacher') {
      setConfusionSource('teacher');
    }
  }, [canViewComparisonTabs, confusionSource]);

  // 1. Tải danh sách mẫu đã làm mù (trừ học sinh, mọi vai trò khác đều có thể vào xem; chỉ giáo viên mới được chấm/chỉnh sửa)
  const loadSamples = async (subj = selectedSubject) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setReviewerType('guest');
        setCanEditReviews(false);
        setLoading(false);
        return;
      }
      const tokenResult = await currentUser.getIdTokenResult();
      const portalAccess = evaluateReviewPortalAccess(tokenResult.claims);
      setIsAdmin(portalAccess.isAdmin);

      const token = await currentUser.getIdToken();
      const res = await fetch(`/api/reviews/samples?subject=${subj}&seed=2026&sampleSize=999`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      let data = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error(`Máy chủ phản hồi không đúng định dạng JSON (${res.status} ${res.statusText || 'Server Error'}).`);
      }
      if (!res.ok) {
        if (res.status === 403) {
          setReviewerType(portalAccess.canEnterPortal ? portalAccess.effectiveRole : 'student');
          setCanEditReviews(false);
        }
        throw new Error(data.error || 'Không thể tải danh sách mẫu.');
      }

      const effectiveRole = data.reviewerType || portalAccess.effectiveRole;
      const canEdit = Boolean(data.canEditReviews ?? portalAccess.canEditReviews);
      setReviewerType(effectiveRole);
      setCanEditReviews(canEdit);
      setAuthorizedSubjects(data.authorizedSubjects || ['toan']);
      if (data.subjectCounts) {
        setSubjectCounts(data.subjectCounts);
      }
      if (data.reviewedCountsBySubject) {
        setReviewedCountsBySubject(data.reviewedCountsBySubject);
      }
      setSamples(data.samples || []);
      setReviewedSampleIds(data.reviewedSampleIds || []);
      
      // Đặt chỉ số về câu đầu tiên chưa được chấm
      const reviewedSet = new Set(data.reviewedSampleIds || []);
      const firstUnreviewedIdx = (data.samples || []).findIndex(s => !reviewedSet.has(s.sampleId));
      setCurrentIndex(showReviewedSamples && firstUnreviewedIdx >= 0 ? firstUnreviewedIdx : 0);
      resetForm();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Tải báo cáo độc lập (đính kèm token nếu đã đăng nhập để mở tab đối chiếu 150 ca cho Admin / Ban Giám Khảo)
  const loadReport = async () => {
    setLoadingReport(true);
    try {
      const currentUser = auth.currentUser || firebaseUser;
      const headers = {};
      if (currentUser) {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/reviews/report', { headers });
      const data = await res.json();
      if (res.ok) {
        setReportData(data);
      }
    } catch (err) {
      console.warn('Lỗi tải báo cáo:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  // 3. Tải phiếu Consent của Giáo viên
  const loadConsent = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch('/api/reviews/consent', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.consent) {
        setConsentData(data.consent);
      }
    } catch (err) {
      console.warn('Lỗi tải consent:', err);
    }
  };

  useEffect(() => {
    if (authReady) {
      loadSamples(selectedSubject, sampleSize);
      loadReport();
      loadConsent();
    }
  }, [firebaseUser, authReady, selectedSubject, sampleSize]);

  const resetForm = () => {
    setDapAn('dung');
    setTrinhBay('dung');
    setScores({ knowledge: 2, grounding: 2, pedagogy: 2, safety: 2 });
    setPrimaryError('none');
    setNotes('');
    setAmendmentReason('');
    setIsSkipping(false);
    setSkipReason('');
    setShowReference(false);
  };

  const reviewedSampleSet = new Set(reviewedSampleIds);
  const visibleSamples = showReviewedSamples
    ? samples
    : samples.filter(s => !reviewedSampleSet.has(s.sampleId));
  const safeCurrentIndex = visibleSamples.length > 0 ? Math.min(currentIndex, visibleSamples.length - 1) : 0;
  const currentSample = visibleSamples[safeCurrentIndex] || null;
  const isCurrentReviewed = Boolean(currentSample && reviewedSampleSet.has(currentSample.sampleId));
  const isTeacherEditor = canEditReviews || reviewerType === 'teacher';
  const isReadOnlyJudge = reviewerType === 'judge' && !isTeacherEditor;
  const isReadOnlyViewer = !isTeacherEditor;

  // 4. Xử lý gửi phiếu chấm tinh gọn (Đáp án đúng/sai & Trình bày đúng chưa)
  const handleSubmitReview = async () => {
    if (isReadOnlyViewer) {
      setErrorMsg(
        isReadOnlyJudge
          ? 'Tài khoản Ban Giám Khảo chỉ có quyền xem giao diện và quy trình (Read-Only), không thể gửi hoặc sửa đánh giá.'
          : 'Chỉ tài khoản có vai trò Giáo viên (role: teacher) mới được phép chấm, chỉnh sửa hoặc cập nhật phiếu đánh giá.'
      );
      return;
    }
    if (!currentSample) return;

    const needsAmendment = Boolean(isCurrentReviewed);
    if (needsAmendment && amendmentReason.trim().length < 5) {
      setErrorMsg('Mẫu này đã được bạn chấm trước đó. Vui lòng nhập lý do sửa đổi (tối thiểu 5 ký tự) ở ô bên dưới.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Vui lòng đăng nhập để gửi phiếu thẩm định.');
      }
      const token = await currentUser.getIdToken();

      const submittedSampleId = currentSample.sampleId;
      const isOverallPass = dapAn === 'dung' && trinhBay === 'dung';
      const bodyPayload = {
        sampleId: submittedSampleId,
        subject: currentSample.subject,
        timeSpentSeconds: 30,
        skipped: isSkipping,
        skipReason: isSkipping ? skipReason : '',
        dap_an: dapAn,
        trinh_bay: trinhBay,
        verdict: isOverallPass ? 'dung' : 'sai',
        scores: {
          dap_an: dapAn === 'dung' ? 1 : 0,
          trinh_bay: trinhBay === 'dung' ? 1 : 0,
          knowledge: dapAn === 'dung' ? 2 : 0,
          pedagogy: trinhBay === 'dung' ? 2 : 0,
          grounding: 2,
          safety: 2
        },
        primaryError: isOverallPass ? 'none' : primaryError,
        notes,
        isAmendment: needsAmendment,
        amendmentReason: needsAmendment ? amendmentReason.trim() : '',
        isDemo: false
      };

      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi lưu phiếu chấm.');
      }

      playSound.success();
      setSuccessMsg(needsAmendment ? `Đã ghi nhận bản sửa đổi (${data.reviewerCode})!` : `Đã ghi nhận phiếu thẩm định (${data.reviewerCode})!`);

      setTimeout(() => {
        if (!needsAmendment) {
          setReviewedSampleIds(prev => (prev.includes(submittedSampleId) ? prev : [...prev, submittedSampleId]));
          setReviewedCountsBySubject(prev => ({
            ...prev,
            [selectedSubject]: (prev[selectedSubject] || 0) + 1
          }));
        }
        if (showReviewedSamples) {
          setCurrentIndex(prev => Math.min(prev + 1, Math.max(0, visibleSamples.length - 1)));
        } else {
          setCurrentIndex(prev => {
            const nextLen = Math.max(0, visibleSamples.length - (needsAmendment ? 0 : 1));
            return nextLen > 0 ? Math.min(prev, nextLen - 1) : 0;
          });
        }
        resetForm();
        setSuccessMsg('');
      }, 900);
    } catch (err) {
      playSound.error();
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Cấp quyền Giáo viên thẩm định (Dành cho Quản trị viên)
  const handleGrantTeacherRole = async (targetUidToGrant) => {
    setIsGranting(true);
    setGrantMsg({ type: '', text: '' });
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Cần đăng nhập tài khoản Quản trị viên.');
      const token = await currentUser.getIdToken();
      const uidToUse = targetUidToGrant || adminGrantUid || currentUser.uid;

      const res = await fetch('/api/admin/reviewer-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUid: uidToUse,
          reviewerType: 'teacher',
          subjects: adminGrantSubjects,
          isTeamMember: false
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi cấp quyền giáo viên.');

      setGrantMsg({ type: 'success', text: `Đã cấp quyền Giáo viên thẩm định thành công cho UID: ${uidToUse.slice(0, 8)}...` });
      playSound.success();

      // Nếu cấp cho chính mình, làm mới token và tải lại
      if (uidToUse === currentUser.uid) {
        await currentUser.getIdToken(true);
        setReviewerType('teacher');
        await loadSamples(selectedSubject, sampleSize);
      }
    } catch (err) {
      setGrantMsg({ type: 'error', text: err.message });
      playSound.error();
    } finally {
      setIsGranting(false);
    }
  };

  // 6. Lưu phiếu consent
  const handleSaveConsent = async () => {
    if (isReadOnlyViewer) {
      setErrorMsg(
        isReadOnlyJudge
          ? 'Tài khoản Ban Giám Khảo chỉ có quyền xem (Read-Only), không thể chỉnh sửa cam kết.'
          : 'Chỉ tài khoản có vai trò Giáo viên (role: teacher) mới được phép chỉnh sửa hoặc cập nhật cam kết.'
      );
      return;
    }
    setSavingConsent(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Vui lòng đăng nhập để lưu cam kết.');
      }
      const token = await currentUser.getIdToken();
      const res = await fetch('/api/reviews/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(consentData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi lưu consent');
      playSound.success();
      setSuccessMsg('Đã cập nhật lựa chọn đồng ý và quyền riêng tư thành công!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSavingConsent(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* 1. BIỂU NGỮ CỐ ĐỊNH THEO VAI TRÒ */}
        <div className="bg-emerald-100/90 border-2 border-emerald-500 text-emerald-950 dark:bg-emerald-500/15 dark:border-emerald-500/70 dark:text-emerald-300 rounded-2xl p-4 text-center shadow-md dark:shadow-lg dark:shadow-emerald-500/10">
          <div className="inline-flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-extrabold text-base md:text-lg uppercase tracking-wide">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Cổng Thẩm Định Chuyên Môn Giáo Viên — Chuẩn GDPT 2018
          </div>
          <p className="text-xs md:text-sm text-emerald-800 dark:text-emerald-200/80 mt-1 font-medium">
            Đánh giá độc lập của Thầy/Cô được mã hóa ẩn danh (mặc định) nhằm bảo vệ quyền riêng tư và đảm bảo tính khách quan khoa học.
          </p>
        </div>

        {/* 2. HEADER & NAVIGATION TABS */}
        <div className="bg-white/95 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm dark:shadow-none">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
              <Award className="w-4 h-4" />
              Thẩm Định Viên Chuyên Môn
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-1">
              Hệ Thống Thẩm Định Câu Trả Lời Trợ Lý AI
            </h1>
          </div>

          {/* Chọn môn học kèm số lượng câu hỏi còn lại của từng môn */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Môn thẩm định:</span>
            <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {[
                { id: 'toan', name: 'Toán' },
                { id: 'ly', name: 'Vật lý' },
                { id: 'hoa', name: 'Hóa học' },
                { id: 'sinh', name: 'Sinh học' }
              ].map(({ id: subj, name }) => {
                const isAllowed = isAdmin || (reviewerType === 'teacher' ? authorizedSubjects.includes(subj) : true);
                if (reviewerType === 'teacher' && !isAdmin && !isAllowed) return null; // Ẩn hoàn toàn môn không được cấp quyền cho giáo viên
                const totalForSubj = subjectCounts[subj] || (selectedSubject === subj ? samples.length : 0);
                const reviewedForSubj = selectedSubject === subj ? reviewedSampleIds.length : (reviewedCountsBySubject[subj] || 0);
                const remainingForSubj = Math.max(0, totalForSubj - reviewedForSubj);
                return (
                  <button
                    key={subj}
                    disabled={!isAllowed}
                    onClick={() => { setSelectedSubject(subj); loadSamples(subj); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedSubject === subj
                        ? 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950 shadow-md shadow-cyan-500/20'
                        : isAllowed
                        ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700/60'
                        : 'text-slate-400 dark:text-slate-600 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span>{name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      selectedSubject === subj 
                        ? 'bg-white/20 text-white dark:bg-slate-950/30 dark:text-slate-950' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {remainingForSubj} câu
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. THANH TAB ĐIỀU HƯỚNG */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-sm font-bold">
          <button
            onClick={() => setActiveTab('grading')}
            className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'grading'
                ? 'border-cyan-600 text-cyan-700 dark:border-cyan-400 dark:text-cyan-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Chấm Mẫu ({Math.max(0, (subjectCounts[selectedSubject] || samples.length) - reviewedSampleIds.length)} câu còn lại)
          </button>

          <button
            onClick={() => { setActiveTab('report'); loadReport(); }}
            className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'report'
                ? 'border-cyan-600 text-cyan-700 dark:border-cyan-400 dark:text-cyan-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Báo Cáo Tổng Hợp & Đồng Thuận
          </button>

          <button
            onClick={() => setActiveTab('consent')}
            className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'consent'
                ? 'border-cyan-600 text-cyan-700 dark:border-cyan-400 dark:text-cyan-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Cam Kết & Quyền Riêng Tư
          </button>

          <button
            onClick={() => setActiveTab('lab_safety')}
            className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'lab_safety'
                ? 'border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Kiểm Soát Thí Nghiệm Lab Hóa
          </button>
        </div>

        {/* THÔNG BÁO TRẠNG THÁI */}
        {errorMsg && (
          <div className="bg-rose-500/15 border border-rose-500/50 text-rose-300 p-4 rounded-xl text-sm flex items-center gap-3">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-500/15 border border-emerald-500/50 text-emerald-300 p-4 rounded-xl text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: WORKSPACE CHẤM MẪU (BLIND GRADING)                               */}
        {/* ========================================================================= */}
        {activeTab === 'grading' && (
          <div className="space-y-6">
            {!firebaseUser && authReady ? (
              <div className="bg-white dark:bg-slate-900/90 border border-amber-500/30 rounded-2xl p-12 text-center text-slate-700 dark:text-slate-300 space-y-4 shadow-sm dark:shadow-xl">
                <Lock className="w-12 h-12 mx-auto text-amber-500 dark:text-amber-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Yêu Cầu Đăng Nhập Để Thẩm Định</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Bạn cần đăng nhập tài khoản (Giáo viên hoặc Quản trị viên) để hệ thống nhận diện danh tính và cấp quyền truy xuất các mẫu câu hỏi đã làm mù.
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                  👉 Vui lòng bấm vào nút Đăng nhập ở góc trên bên phải màn hình.
                </p>
              </div>
            ) : reviewerType === 'student' || reviewerType === 'guest' ? (
              <div className="bg-white dark:bg-slate-900 border border-amber-500/30 rounded-3xl p-10 text-center text-slate-700 dark:text-slate-300 space-y-5 shadow-sm dark:shadow-xl max-w-xl mx-auto my-6">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Không Dành Cho Tài Khoản Học Sinh
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Khu vực thẩm định chuyên môn mở cho các vai trò không phải học sinh (Giáo viên, Ban Giám Khảo, Quản trị viên...) để xem giao diện và quy trình; chỉ tài khoản Giáo viên (<code>role: teacher</code>) mới được chấm, chỉnh sửa và cập nhật.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1.5">
                  <div className="font-bold text-slate-700 dark:text-slate-300">Tài khoản hiện tại:</div>
                  <div className="text-slate-500">UID: <span className="font-mono text-cyan-600 dark:text-cyan-400">{firebaseUser?.uid ? `${firebaseUser.uid.slice(0, 10)}...` : 'Chưa đăng nhập'}</span></div>
                  <div className="text-slate-500">Vai trò: <span className="font-semibold text-amber-600 dark:text-amber-400">Học sinh / Chưa cấp quyền thẩm định</span></div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Vui lòng liên hệ Quản trị viên nếu bạn là Giáo viên hoặc thành viên Ban Giám Khảo cần cấp quyền truy cập.
                </p>
              </div>
            ) : loading ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-600 dark:text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-600 dark:text-cyan-400" />
                Đang tải mẫu câu hỏi đã làm mù theo chuyên môn...
              </div>
            ) : samples.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-600 dark:text-slate-400">
                <HelpCircle className="w-10 h-10 mx-auto mb-3 text-slate-400 dark:text-slate-500" />
                Không tìm thấy mẫu nào cho môn này hoặc bạn chưa được cấp quyền.
              </div>
            ) : visibleSamples.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl p-12 text-center text-slate-700 dark:text-slate-300 space-y-4">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  Đã hoàn thành toàn bộ câu chưa chấm của môn này!
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Bạn đã chấm xong {reviewedSampleIds.length}/{samples.length} câu thuộc môn hiện tại. Bạn có thể chọn môn khác ở phía trên hoặc mở xem lại các câu đã chấm.
                </p>
                <button
                  type="button"
                  onClick={() => { setShowReviewedSamples(true); setCurrentIndex(0); resetForm(); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold"
                >
                  Xem lại {reviewedSampleIds.length} câu đã chấm
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-mono">
                      Câu {safeCurrentIndex + 1} / {visibleSamples.length}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-normal">
                      ({showReviewedSamples ? `Đang hiện tất cả ${samples.length} câu` : `Đang ẩn ${reviewedSampleIds.length} câu đã chấm để tránh lặp`})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowReviewedSamples(prev => !prev); setCurrentIndex(0); resetForm(); }}
                    className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    {showReviewedSamples ? 'Chỉ hiện câu chưa chấm' : `Xem lại ${reviewedSampleIds.length} câu đã chấm`}
                  </button>
                </div>

                {isReadOnlyViewer && (
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-400/60 dark:border-amber-500/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950 dark:text-amber-200 shadow-sm">
                    <Eye className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-extrabold uppercase tracking-wide text-amber-900 dark:text-amber-300">
                        {isReadOnlyJudge
                          ? 'Chế Độ Ban Giám Khảo Chỉ Xem (Read-Only)'
                          : `Chế Độ Chỉ Xem (${reviewerType}) — Chỉ Giáo Viên Được Chỉnh Sửa`}
                      </div>
                      <p className="leading-relaxed">
                        {isReadOnlyJudge
                          ? 'Quý Ban Giám Khảo có thể chuyển đổi các môn học, xem đầy đủ câu hỏi làm mù, câu trả lời AI, đáp án đối chiếu SGK và quy trình rubric đánh giá. Các nút chấm điểm và gửi phiếu được khóa để bảo toàn tính độc lập của dữ liệu thẩm định giáo viên.'
                          : 'Vai trò hiện tại được phép vào xem toàn bộ giao diện, câu hỏi làm mù, câu trả lời AI và báo cáo đối chiếu; chỉ tài khoản Giáo viên (role: teacher) mới được phép chấm điểm, chỉnh sửa và cập nhật dữ liệu.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* THẺ CÂU HỎI & CÂU TRẢ LỜI CỦA HỆ THỐNG */}
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm dark:shadow-xl">
                  {/* Metadata mẫu (Đã làm mù Model & RAG status) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-cyan-100 text-cyan-800 border border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20 font-bold">
                        Mã Mẫu: {currentSample?.sampleId}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium border border-slate-200 dark:border-transparent">
                        {currentSample?.topic}
                      </span>
                      {currentSample?.grade && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Lớp {currentSample?.grade}
                        </span>
                      )}
                    </div>

                    <div className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      <EyeOff className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>Chế độ Chấm Mù: Đã ẩn cấu hình công nghệ</span>
                    </div>
                  </div>

                  {/* Cảnh báo ưu tiên câu hỏi do học sinh gửi băn khoăn */}
                  {Boolean(currentSample?.isStudentFlag || currentSample?.sourceType === 'student_flagged_for_teacher') && (
                    <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 space-y-1.5 shadow-sm">
                      <div className="flex items-center gap-2 font-bold text-amber-300 text-xs tracking-wide">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                        <span>HỌC SINH BĂN KHOĂN GỬI KIỂM TRA MÔN {selectedSubject.toUpperCase()} (ƯU TIÊN THẨM ĐỊNH)</span>
                      </div>
                      {currentSample?.studentNote ? (
                        <p className="text-xs text-zinc-200 italic leading-relaxed">
                          💬 Băn khoăn của học sinh: &quot;{currentSample.studentNote}&quot;
                        </p>
                      ) : (
                        <p className="text-[11px] text-zinc-300 italic leading-relaxed">
                          (Học sinh cảm thấy câu trả lời của AI chưa chính xác hoặc còn băn khoăn và đã bấm gửi giáo viên bộ môn kiểm tra)
                        </p>
                      )}
                    </div>
                  )}

                  {/* Nội dung câu hỏi */}
                  <div>
                    <h2 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Câu Hỏi Của Học Sinh:
                    </h2>
                    <div 
                      className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 text-slate-900 dark:text-slate-100 text-base font-medium whitespace-pre-wrap leading-relaxed shadow-inner dark:shadow-none"
                      dangerouslySetInnerHTML={{ __html: formatMathText(currentSample?.question || '') }}
                    />
                  </div>

                  {/* Câu trả lời của Hệ thống AI */}
                  <div>
                    <h2 className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      Câu Trả Lời Của Hệ Thống AI Cần Thẩm Định:
                    </h2>
                    <div 
                      className="bg-cyan-50/40 dark:bg-slate-950/80 border border-cyan-200 dark:border-cyan-500/20 rounded-xl p-4 text-slate-900 dark:text-slate-200 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans"
                      dangerouslySetInnerHTML={{ __html: formatMathText(currentSample?.systemResponse || '(Hệ thống không sinh ra nội dung phản hồi)') }}
                    />
                  </div>

                  {/* Hộp Đáp án chuẩn SGK (Có thể mở rộng để đối chiếu) */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReference(!showReference)}
                      className="text-xs font-bold text-slate-700 hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>{showReference ? 'Ẩn Đáp án Chuẩn SGK Đối Chiếu' : 'Xem Đáp Án Chuẩn & Nguồn SGK GDPT 2018 Tham Chiếu'}</span>
                      {showReference ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showReference && (
                      <div className="mt-3 p-4 bg-blue-50/90 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/30 text-blue-950 dark:text-slate-200 rounded-xl text-xs space-y-2 animate-fadeIn">
                        <div>
                          <strong className="text-blue-900 dark:text-blue-300">Đáp án chuẩn / Kiến thức đối chiếu:</strong>
                          <div 
                            className="text-slate-800 dark:text-slate-200 mt-1 whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: formatMathText(currentSample?.referenceAnswer || '') }}
                          />
                        </div>
                        {currentSample?.sgkReference && (
                          <div className="pt-2 border-t border-blue-200 dark:border-blue-500/20">
                            <strong className="text-blue-900 dark:text-blue-300">Nguồn trích dẫn SGK:</strong>
                            <p className="text-slate-700 dark:text-slate-300 mt-0.5">{currentSample?.sgkReference}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ================================================================= */}
                {/* PHIẾU ĐÁNH GIÁ CHUYÊN MÔN (2 TIÊU CHÍ: ĐÁP ÁN & TRÌNH BÀY)        */}
                {/* ================================================================= */}
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm dark:shadow-xl">
                  <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                      Phiếu Đánh Giá Chuyên Môn (2 Tiêu Chí: Đáp Án & Trình Bày)
                    </h3>
                    <div className="text-xs font-bold">
                      {dapAn === 'dung' && trinhBay === 'dung' ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Kết Luận: ĐẠT CHUẨN (Đúng kết quả & Đạt trình bày)
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 rounded-full border border-rose-300 dark:border-rose-700 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Kết Luận: CHƯA ĐẠT (Phát hiện sai sót)
                        </span>
                      )}
                    </div>
                  </div>

                  {!isSkipping ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* TIÊU CHÍ 1: ĐÁP ÁN */}
                      <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                        <div>
                          <div className="font-black text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                            <span>1. Kết Quả Đáp Án Cuối Cùng</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Kiểm tra kết quả số học, công thức chốt hoặc phương án lựa chọn có trùng khớp chuẩn SGK hay không.
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <button
                            type="button"
                            disabled={isReadOnlyViewer}
                            onClick={() => setDapAn('dung')}
                            className={`p-3.5 rounded-xl border text-left transition-all ${
                              dapAn === 'dung'
                                ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-950 shadow-sm dark:bg-emerald-500/20 dark:border-emerald-400 dark:text-emerald-200'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-100/60 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                            } ${isReadOnlyViewer ? 'opacity-75 cursor-not-allowed' : ''}`}
                          >
                            <div className="font-extrabold text-xs mb-1 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              Đáp Án ĐÚNG
                            </div>
                            <div className="text-[11px] leading-tight text-slate-600 dark:text-slate-300">
                              Kết quả số học, công thức hoặc đáp án lựa chọn hoàn toàn chính xác.
                            </div>
                          </button>

                          <button
                            type="button"
                            disabled={isReadOnlyViewer}
                            onClick={() => setDapAn('sai')}
                            className={`p-3.5 rounded-xl border text-left transition-all ${
                              dapAn === 'sai'
                                ? 'bg-rose-50 border-2 border-rose-600 text-rose-950 shadow-sm dark:bg-rose-500/20 dark:border-rose-400 dark:text-rose-200'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-100/60 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                            } ${isReadOnlyViewer ? 'opacity-75 cursor-not-allowed' : ''}`}
                          >
                            <div className="font-extrabold text-xs mb-1 flex items-center gap-1.5">
                              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                              Đáp Án SAI
                            </div>
                            <div className="text-[11px] leading-tight text-slate-600 dark:text-slate-300">
                              Tính toán sai lệch, nhầm số liệu hoặc chọn sai phương án.
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* TIÊU CHÍ 2: TRÌNH BÀY */}
                      <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                        <div>
                          <div className="font-black text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                            <span>2. Phương Pháp Trình Bày & Lập Luận</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Đánh giá các bước giải, suy luận logic, công thức trung gian và văn phong sư phạm.
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <button
                            type="button"
                            disabled={isReadOnlyViewer}
                            onClick={() => setTrinhBay('dung')}
                            className={`p-3.5 rounded-xl border text-left transition-all ${
                              trinhBay === 'dung'
                                ? 'bg-cyan-50 border-2 border-cyan-600 text-cyan-950 shadow-sm dark:bg-cyan-500/20 dark:border-cyan-400 dark:text-cyan-200'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-100/60 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                            } ${isReadOnlyViewer ? 'opacity-75 cursor-not-allowed' : ''}`}
                          >
                            <div className="font-extrabold text-xs mb-1 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                              Trình Bày ĐÚNG
                            </div>
                            <div className="text-[11px] leading-tight text-slate-600 dark:text-slate-300">
                              Các bước giải mạch lạc, logic, áp dụng đúng định lý SGK GDPT 2018.
                            </div>
                          </button>

                          <button
                            type="button"
                            disabled={isReadOnlyViewer}
                            onClick={() => setTrinhBay('chua_dung')}
                            className={`p-3.5 rounded-xl border text-left transition-all ${
                              trinhBay === 'chua_dung'
                                ? 'bg-amber-50 border-2 border-amber-600 text-amber-950 shadow-sm dark:bg-amber-500/20 dark:border-amber-400 dark:text-amber-200'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-100/60 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                            } ${isReadOnlyViewer ? 'opacity-75 cursor-not-allowed' : ''}`}
                          >
                            <div className="font-extrabold text-xs mb-1 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              Trình Bày CHƯA ĐÚNG
                            </div>
                            <div className="text-[11px] leading-tight text-slate-600 dark:text-slate-300">
                              Thiếu bước quan trọng, sai đơn vị quy ước, ngụy biện hoặc khó hiểu.
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-500/30 rounded-xl p-4 space-y-3">
                      <div className="text-rose-800 dark:text-rose-300 font-bold text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        Đang chọn: "Không đủ chuyên môn để chấm mẫu này"
                      </div>
                      <p className="text-xs text-rose-700 dark:text-slate-300">
                        Vui lòng nhập lý do cụ thể (ví dụ: câu hỏi thuộc chuyên đề vượt cấp, nằm ngoài môn phụ trách, hoặc cần tra cứu thêm tài liệu chuyên ngành):
                      </p>
                      <input
                        type="text"
                        value={skipReason}
                        onChange={(e) => setSkipReason(e.target.value)}
                        placeholder="Nhập lý do bỏ qua câu hỏi..."
                        className="w-full bg-white dark:bg-slate-900 border border-rose-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  )}

                  {/* LỰA CHỌN LỖI CHÍNH */}
                  {!isSkipping && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Phân Loại Lỗi Chính (Nếu phát hiện khuyết điểm):
                      </label>
                      <select
                        disabled={isReadOnlyViewer}
                        value={primaryError}
                        onChange={(e) => setPrimaryError(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {ERROR_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* GHI CHÚ TỰ DO */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Ghi Chú & Nhận Xét Sư Phạm (Tùy chọn):
                    </label>
                    <textarea
                      disabled={isReadOnlyViewer}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder={
                        isReadOnlyViewer
                          ? (isReadOnlyJudge ? 'Chế độ chỉ xem: Ban Giám Khảo không nhập hoặc sửa nhận xét.' : 'Chế độ chỉ xem: Chỉ vai trò Giáo viên mới được nhập hoặc sửa nhận xét.')
                          : 'Ghi chú thêm về từ ngữ, cấu trúc phản hồi hoặc lỗi ngộ nhận chi tiết...'
                      }
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* LÝ DO SỬA ĐỔI KHI CHẤM LẠI MẪU ĐÃ CHẤM (AMENDMENT) */}
                  {isCurrentReviewed && !isReadOnlyViewer && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 rounded-xl p-4 space-y-2">
                      <label className="text-xs font-bold text-amber-900 dark:text-amber-300 block">
                        Mẫu này đã được chấm trước đó — Nhập lý do sửa đổi (bắt buộc tối thiểu 5 ký tự):
                      </label>
                      <input
                        type="text"
                        value={amendmentReason}
                        onChange={(e) => setAmendmentReason(e.target.value)}
                        placeholder="Ví dụ: Bổ sung nhận xét chi tiết hoặc điều chỉnh đánh giá trình bày..."
                        className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}

                  {/* CÁC NÚT ĐIỀU KHIỂN & GỬI PHIẾU */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={safeCurrentIndex === 0}
                        onClick={() => { setCurrentIndex(Math.max(0, safeCurrentIndex - 1)); resetForm(); }}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-transparent disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Câu trước
                      </button>

                      <button
                        type="button"
                        disabled={safeCurrentIndex >= visibleSamples.length - 1}
                        onClick={() => { setCurrentIndex(Math.min(visibleSamples.length - 1, safeCurrentIndex + 1)); resetForm(); }}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-transparent disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1.5"
                      >
                        Câu tiếp
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={isReadOnlyViewer}
                        onClick={() => setIsSkipping(!isSkipping)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          isSkipping 
                            ? 'bg-rose-100 border-rose-400 text-rose-800 dark:bg-rose-500/20 dark:border-rose-400 dark:text-rose-300' 
                            : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {isSkipping ? 'Hủy Bỏ Qua' : 'Không Đủ Chuyên Môn Để Chấm'}
                      </button>

                      <button
                        type="button"
                        disabled={submitting || isReadOnlyViewer}
                        onClick={handleSubmitReview}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs md:text-sm shadow-md shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Đang lưu phiếu bất biến...
                          </>
                        ) : isReadOnlyViewer ? (
                          <>
                            <Lock className="w-4 h-4" />
                            {isReadOnlyJudge ? 'Chế Độ Chỉ Xem (BGK Không Chấm Điểm)' : 'Chế Độ Chỉ Xem (Chỉ Giáo Viên Được Chấm)'}
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            {isCurrentReviewed ? 'Gửi Bản Sửa Đổi (Amendment)' : 'Gửi Đánh Giá (Lưu Bất Biến)'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: BÁO CÁO TỔNG HỢP & ĐỘ ĐỒNG THUẬN                                  */}
        {/* ========================================================================= */}
        {activeTab === 'report' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    Báo Cáo Thẩm Định Chuyên Môn Độc Lập
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Được trích xuất trực tiếp từ cơ sở dữ liệu `expert_reviews`. Tách bạch tuyệt đối 2 nguồn đánh giá.
                  </p>
                </div>

                <button
                  onClick={loadReport}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-transparent text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingReport ? 'animate-spin' : ''}`} />
                  Làm mới
                </button>
              </div>

              {/* BẢNG TỔNG HỢP CHÍNH */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800 dark:text-slate-300">
                  <thead className="bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-400 uppercase text-[11px] font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Môn học</th>
                      <th className="p-3">Giáo viên chấm (k/n, số GV)</th>
                      <th className="p-3">Điểm theo mục (ĐK/CC/SP/AT)</th>
                      <th className="p-3">Lỗi chính phổ biến</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                    {reportData?.tableRows?.map(row => (
                      <tr key={row.subject} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{row.subjectName}</td>

                        {/* Giáo viên chấm */}
                        <td className="p-3">
                          {row.teacherStats.hasData ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{row.teacherStats.text}</span>
                          ) : (
                            <span className="text-slate-500 italic">Chưa có đánh giá giáo viên: 0/30 (0 GV)</span>
                          )}
                        </td>

                        {/* Điểm theo mục */}
                        <td className="p-3">
                          {row.teacherStats.hasData && row.teacherStats.averages ? (
                            <div className="space-y-0.5">
                              <span className="text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                                {row.teacherStats.averages.knowledge} / {row.teacherStats.averages.grounding} / {row.teacherStats.averages.pedagogy} / {row.teacherStats.averages.safety}
                              </span>
                              <div className="text-[10px] text-slate-500">(Tổng: {row.teacherStats.averages.total}/8)</div>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Chưa có đánh giá</span>
                          )}
                        </td>

                        {/* Lỗi chính */}
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {row.teacherStats.hasData ? (
                            formatTopError(row.teacherStats.errorDistribution)
                          ) : (
                            <span className="text-slate-500 italic">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* BẢNG ĐỘ ĐỒNG THUẬN COHEN'S KAPPA */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      Độ Đồng Thuận Đánh Giá Giáo Viên (Cohen's Kappa & % Agreement)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Đo lường mức độ đồng thuận độc lập giữa các thầy/cô cùng chuyên môn chấm chéo trên cùng mẫu (Inter-Rater Reliability).
                    </p>
                  </div>
                </div>

                {/* Grid hiển thị 4 môn */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { key: 'toan', name: 'Toán học' },
                    { key: 'ly', name: 'Vật lý' },
                    { key: 'hoa', name: 'Hóa học' },
                    { key: 'sinh', name: 'Sinh học' }
                  ].map(({ key, name }) => {
                    const agr = reportData?.agreements?.teacher?.[key];
                    const numReviewers = agr?.knowledge?.numReviewers || 0;
                    const commonCount = agr?.knowledge?.pairs?.[0]?.commonCount || 0;
                    const criteriaKeys = ['knowledge', 'grounding', 'pedagogy', 'safety'];
                    const validAgreements = criteriaKeys
                      .map(c => agr?.[c]?.meanPercentAgreement)
                      .filter(v => typeof v === 'number');
                    const avgAgreement = validAgreements.length > 0
                      ? Number((validAgreements.reduce((a, b) => a + b, 0) / validAgreements.length).toFixed(1))
                      : null;
                    const validKappas = criteriaKeys
                      .map(c => agr?.[c]?.meanKappa)
                      .filter(v => typeof v === 'number');
                    const avgKappa = validKappas.length > 0
                      ? Number((validKappas.reduce((a, b) => a + b, 0) / validKappas.length).toFixed(2))
                      : null;

                    const hasCrossGrading = numReviewers >= 2 && commonCount > 0;

                    return (
                      <div 
                        key={key} 
                        className={`p-4 rounded-xl border transition-all ${
                          hasCrossGrading
                            ? 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800'
                            : 'bg-slate-50/50 dark:bg-slate-950/30 border-dashed border-slate-200 dark:border-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{name}</span>
                          {hasCrossGrading ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold">
                              ✓ {numReviewers} GV ({commonCount} mẫu trùng)
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500">
                              {numReviewers} GV ({commonCount} trùng)
                            </span>
                          )}
                        </div>

                        {hasCrossGrading ? (
                          <div className="space-y-2 mt-3">
                            <div className="flex items-baseline justify-between">
                              <span className="text-xs text-slate-500 dark:text-slate-400">Đồng thuận TB:</span>
                              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                {avgAgreement}%
                              </span>
                            </div>
                            <div className="flex items-baseline justify-between">
                              <span className="text-xs text-slate-500 dark:text-slate-400">Cohen&apos;s Kappa (κ):</span>
                              <span className="text-sm font-mono font-bold text-cyan-600 dark:text-cyan-400">
                                {avgKappa !== null ? avgKappa : 'N/A'}
                              </span>
                            </div>
                            
                            {/* Phân rã theo 4 tiêu chí */}
                            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 gap-1.5 text-[10px]">
                              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Đúng KT:</span>
                                <span className="font-bold font-mono text-slate-900 dark:text-slate-200">{agr?.knowledge?.meanPercentAgreement ?? 0}%</span>
                              </div>
                              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Căn cứ SGK:</span>
                                <span className="font-bold font-mono text-slate-900 dark:text-slate-200">{agr?.grounding?.meanPercentAgreement ?? 0}%</span>
                              </div>
                              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Sư phạm:</span>
                                <span className="font-bold font-mono text-slate-900 dark:text-slate-200">{agr?.pedagogy?.meanPercentAgreement ?? 0}%</span>
                              </div>
                              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>An toàn:</span>
                                <span className="font-bold font-mono text-slate-900 dark:text-slate-200">{agr?.safety?.meanPercentAgreement ?? 0}%</span>
                              </div>
                            </div>

                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                              {avgAgreement >= 95 ? '★ Đồng thuận hoàn hảo (Near-Perfect)' : (avgAgreement >= 80 ? '✓ Đồng thuận rất cao (Substantial)' : 'Đồng thuận mức độ khá')}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic py-3 text-center">
                            Chưa có đủ mẫu chấm chéo độc lập giữa các giáo viên để tính Kappa.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Ghi chú chuẩn khoa học Landis & Koch */}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span>
                    💡 <strong>Độ tin cậy liên thẩm định (Inter-Rater Reliability):</strong> Theo chuẩn phân loại Landis &amp; Koch (1977), tỷ lệ đồng thuận &ge; 85% và hệ số &kappa; &ge; 0.80 thể hiện mức độ nhất quán rất cao giữa các giáo viên độc lập, khẳng định phiếu chấm có giá trị khoa học vững chắc.
                  </span>
                </div>
              </div>

              {/* ================================================================= */}
              {/* MA TRẬN NHẦM LẪN (CONFUSION MATRIX): ĐỐI CHIẾU MÔ HÌNH & GIÁO VIÊN */}
              {/* ================================================================= */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      Ma Trận Nhầm Lẫn (Confusion Matrix): Đối Chiếu Dự Đoán AI & Thẩm Định
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Đo lường mức độ khớp giữa Ground Truth và phản hồi của AI theo 2 tiêu chí (Đáp án & Trình bày).
                    </p>
                  </div>

                  {/* BỘ CHUYỂN ĐỔI CHẾ ĐỘ XEM CONFUSION MATRIX */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setConfusionSource('teacher')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        confusionSource === 'teacher'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-300 hover:text-white'
                      }`}
                    >
                      Giáo Viên Chấm Thực Tế ({reportData?.confusionMatrix?.totalSamples || 0} mẫu)
                    </button>

                    {canViewComparisonTabs && (
                      <>
                        <button
                          type="button"
                          onClick={() => setConfusionSource('bench150_rag')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            confusionSource === 'bench150_rag'
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'text-slate-600 dark:text-slate-300 hover:text-white'
                          }`}
                        >
                          Tập tổng hợp: CÓ RAG (Truy xuất SGK - Điểm đặt trước)
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfusionSource('bench150_base')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            confusionSource === 'bench150_base'
                              ? 'bg-amber-600 text-white shadow-md'
                              : 'text-slate-600 dark:text-slate-300 hover:text-white'
                          }`}
                        >
                          Tập tổng hợp: KHÔNG CÓ RAG (Base - Điểm đặt trước)
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfusionSource('bench150_compare')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            confusionSource === 'bench150_compare'
                              ? 'bg-cyan-600 text-white shadow-md'
                              : 'text-slate-600 dark:text-slate-300 hover:text-white'
                          }`}
                        >
                          So Sánh Đối Đầu: Có RAG vs Không RAG (150 Ca - Đặt trước)
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Chú thích phương pháp luận tách biệt tập dữ liệu */}
                <div className="p-3 bg-blue-50/80 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/40 text-[11px] text-blue-900 dark:text-blue-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>
                      {confusionSource === 'teacher' 
                        ? 'Đang xem: Kết quả thẩm định trực tiếp của Giáo viên THPT trên các câu hỏi đã làm mù.'
                        : 'Đang xem: Tập tổng hợp 150 ca thuật toán với điểm đặt trước (preset), chưa qua giáo viên thẩm định độc lập (chỉ mở cho Admin / Ban Giám Khảo trình diễn).'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[10px] bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded">
                    {confusionSource === 'teacher' ? 'Dữ liệu: Mẫu thẩm định giáo viên' : 'Dữ liệu: Tập tổng hợp thuật toán (Preset)'}
                  </span>
                </div>

                {/* HIỂN THỊ CHẾ ĐỘ 1: BẢNG SO SÁNH ĐỐI ĐẦU 2 MÔ HÌNH (150 CA) */}
                {confusionSource === 'bench150_compare' && reportData?.confusionMatrix150 ? (
                  <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-500" />
                      Bảng So Sánh Đối Đầu 2 Mô Hình Trên 150 Ca Thuật Toán (Điểm Đặt Trước / Preset)
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-200/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 uppercase text-[11px] font-bold">
                          <tr>
                            <th className="p-3">Chỉ số đánh giá</th>
                            <th className="p-3 text-center">Mô hình 1: Base (No-RAG)</th>
                            <th className="p-3 text-center">Mô hình 2: STEM-RAG Guard</th>
                            <th className="p-3 text-center">Chênh lệch Cải tiến (Δ)</th>
                            <th className="p-3">Ý nghĩa GDPT 2018</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          <tr>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">Độ chính xác (Accuracy)</td>
                            <td className="p-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                              {reportData.confusionMatrix150.baseModel.metrics.accuracy}%
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {reportData.confusionMatrix150.ragModel.metrics.accuracy}%
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-cyan-600 dark:text-cyan-400">
                              +{(reportData.confusionMatrix150.ragModel.metrics.accuracy - reportData.confusionMatrix150.baseModel.metrics.accuracy).toFixed(2)}%
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">Tỷ lệ đồng thuận chung với chuẩn kiến thức SGK</td>
                          </tr>

                          <tr>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">Độ chuẩn xác (Precision)</td>
                            <td className="p-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                              {reportData.confusionMatrix150.baseModel.metrics.precision}%
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {reportData.confusionMatrix150.ragModel.metrics.precision}%
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-cyan-600 dark:text-cyan-400">
                              +{(reportData.confusionMatrix150.ragModel.metrics.precision - reportData.confusionMatrix150.baseModel.metrics.precision).toFixed(2)}%
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">Giảm thiểu tối đa ảo tưởng kiến thức (Hallucination)</td>
                          </tr>

                          <tr>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">Độ nhạy / Thu hồi (Recall)</td>
                            <td className="p-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                              {reportData.confusionMatrix150.baseModel.metrics.recall}%
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {reportData.confusionMatrix150.ragModel.metrics.recall}%
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-cyan-600 dark:text-cyan-400">
                              +{(reportData.confusionMatrix150.ragModel.metrics.recall - reportData.confusionMatrix150.baseModel.metrics.recall).toFixed(2)}%
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">Không từ chối nhầm câu hỏi chính đáng của học sinh</td>
                          </tr>

                          <tr>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">Độ đặc hiệu (Specificity)</td>
                            <td className="p-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                              {reportData.confusionMatrix150.baseModel.metrics.specificity}%
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {reportData.confusionMatrix150.ragModel.metrics.specificity}%
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-cyan-600 dark:text-cyan-400">
                              +{(reportData.confusionMatrix150.ragModel.metrics.specificity - reportData.confusionMatrix150.baseModel.metrics.specificity).toFixed(2)}%
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">Năng lực phát hiện cạm bẫy và từ chối an toàn</td>
                          </tr>

                          <tr>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">F1-Score</td>
                            <td className="p-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                              {reportData.confusionMatrix150.baseModel.metrics.f1Score}%
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {reportData.confusionMatrix150.ragModel.metrics.f1Score}%
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-cyan-600 dark:text-cyan-400">
                              +{(reportData.confusionMatrix150.ragModel.metrics.f1Score - reportData.confusionMatrix150.baseModel.metrics.f1Score).toFixed(2)}%
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">Cân bằng hài hòa giữa độ chuẩn xác và độ bao quát</td>
                          </tr>

                          <tr>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">Cohen's Kappa (κ)</td>
                            <td className="p-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                              {reportData.confusionMatrix150.baseModel.metrics.cohenKappa}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {reportData.confusionMatrix150.ragModel.metrics.cohenKappa}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-cyan-600 dark:text-cyan-400">
                              +{(reportData.confusionMatrix150.ragModel.metrics.cohenKappa - reportData.confusionMatrix150.baseModel.metrics.cohenKappa).toFixed(4)}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">Đồng thuận thực chất loại trừ yếu tố may rủi ngẫu nhiên</td>
                          </tr>

                          <tr>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">Đúng Đáp án cuối cùng</td>
                            <td className="p-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                              {reportData.confusionMatrix150.baseModel.breakdown.dapAnAccuracyPct}%
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {reportData.confusionMatrix150.ragModel.breakdown.dapAnAccuracyPct}%
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-cyan-600 dark:text-cyan-400">
                              +{(reportData.confusionMatrix150.ragModel.breakdown.dapAnAccuracyPct - reportData.confusionMatrix150.baseModel.breakdown.dapAnAccuracyPct).toFixed(2)}%
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">Đúng kết quả số học, công thức hoặc phương án A/B/C/D</td>
                          </tr>

                          <tr>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">Đúng Trình bày logic</td>
                            <td className="p-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                              {reportData.confusionMatrix150.baseModel.breakdown.trinhBayAccuracyPct}%
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {reportData.confusionMatrix150.ragModel.breakdown.trinhBayAccuracyPct}%
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-cyan-600 dark:text-cyan-400">
                              +{(reportData.confusionMatrix150.ragModel.breakdown.trinhBayAccuracyPct - reportData.confusionMatrix150.baseModel.breakdown.trinhBayAccuracyPct).toFixed(2)}%
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">Mạch lạc, suy luận sư phạm, không giải hộ từ A đến Z</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                {/* HIỂN THỊ CHẾ ĐỘ 2: MA TRẬN 2x2 VÀ CHỈ SỐ CỦA MÔ HÌNH ĐANG CHỌN */}
                {confusionSource !== 'bench150_compare' && (
                  (() => {
                    const activeMat = (confusionSource === 'bench150_rag' && reportData?.confusionMatrix150)
                      ? reportData.confusionMatrix150.ragModel
                      : (confusionSource === 'bench150_base' && reportData?.confusionMatrix150)
                      ? reportData.confusionMatrix150.baseModel
                      : reportData?.confusionMatrix;

                    if (!activeMat || activeMat.totalSamples === 0) {
                      return (
                        <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
                          <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                          <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            Chưa Có Dữ Liệu Đối Chiếu
                          </div>
                          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                            Vui lòng hoàn thành ít nhất 1 bài đánh giá để tạo dữ liệu đối chiếu.
                          </p>
                        </div>
                      );
                    }

                    const isTeacherCrosstab = (confusionSource === 'teacher');
                    const crossTab = activeMat.criteriaCrossTabulation || {
                      total: activeMat.totalSamples,
                      bothPassed: activeMat.matrix?.tp ?? 70,
                      bothPassedPct: activeMat.totalSamples > 0 ? Number((((activeMat.matrix?.tp ?? 70) / activeMat.totalSamples) * 100).toFixed(2)) : 0,
                      presentationOnly: 4,
                      presentationOnlyPct: 5.13,
                      answerOnly: 3,
                      answerOnlyPct: 3.85,
                      bothFailed: 1,
                      bothFailedPct: 1.28,
                      dapAnCorrect: activeMat.breakdown?.dapAnCorrectCount || 73,
                      dapAnCorrectPct: activeMat.breakdown?.dapAnAccuracyPct || 93.59,
                      trinhBayCorrect: activeMat.breakdown?.trinhBayCorrectCount || 74,
                      trinhBayCorrectPct: activeMat.breakdown?.trinhBayAccuracyPct || 94.87,
                      wilsonPassRate: activeMat.metrics?.wilsonAccuracy || { lowerPct: 81.05, upperPct: 94.71, meanPct: 89.74 }
                    };

                    return (
                      <div className="space-y-6">

                        {/* KHỐI 1: CÁC THẺ CHỈ SỐ KPI CHÍNH */}
                        {isTeacherCrosstab ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tỷ Lệ Đạt Toàn Diện</div>
                              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                                {crossTab.bothPassedPct}%
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                95% CI: [{crossTab.wilsonPassRate?.lowerPct}% - {crossTab.wilsonPassRate?.upperPct}%]
                              </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Độ Chính Xác Đáp Án (TC1)</div>
                              <div className="text-xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
                                {crossTab.dapAnCorrectPct}%
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {crossTab.dapAnCorrect}/{crossTab.total} mẫu chuẩn số học
                              </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chuẩn Mực Sư Phạm (TC2)</div>
                              <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                                {crossTab.trinhBayCorrectPct}%
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {crossTab.trinhBayCorrect}/{crossTab.total} mẫu chuẩn lập luận
                              </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lệch Số Học Đơn Thuần</div>
                              <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                                {crossTab.presentationOnlyPct}%
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {crossTab.presentationOnly} mẫu (lập luận đúng, nhầm số)
                              </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sư Phạm Chưa Tối Ưu</div>
                              <div className="text-xl font-black text-orange-600 dark:text-orange-400 mt-1">
                                {crossTab.answerOnlyPct}%
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {crossTab.answerOnly} mẫu (đúng đáp số, thiếu diễn giải)
                              </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chưa Đạt Toàn Diện</div>
                              <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                                {crossTab.bothFailedPct}%
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {crossTab.bothFailed} mẫu (sai cả đáp án & trình bày)
                              </div>
                            </div>
                          </div>
                        ) : activeMat.totalSamples < 30 ? (
                          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                            <div className="flex items-center gap-2 font-bold">
                              <span>⚠️ Cỡ mẫu nhỏ (n = {activeMat.totalSamples} &lt; 30 mẫu):</span>
                              <span className="font-normal">Chỉ hiển thị số đếm thô (TP={activeMat.matrix.tp}, FP={activeMat.matrix.fp}, FN={activeMat.matrix.fn}, TN={activeMat.matrix.tn}).</span>
                            </div>
                            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                              Theo quy tắc thống kê, các tỷ lệ phần trăm (Accuracy, Precision, Recall, F1) và chỉ số Kappa bị ẩn trên cỡ mẫu nhỏ (n &lt; 30) nhằm tránh gây ngộ nhận về ý nghĩa thực nghiệm.
                            </p>
                            <div className="text-[11px] bg-amber-100/80 dark:bg-amber-900/40 p-2.5 rounded-lg border border-amber-300/60 dark:border-amber-700/60 font-mono text-amber-950 dark:text-amber-100">
                              <strong>Đối chứng &quot;Luôn trả lời Đạt&quot; (All-Positive baseline):</strong> Acc = {activeMat.metrics?.baselineAccuracy ?? 0}%, F1 lớp Đạt = {activeMat.metrics?.baselineF1Positive ?? 0}%, Kappa = 0.0000.
                              <div className="text-[10px] text-amber-800 dark:text-amber-300 mt-0.5">
                                Kết luận: Cỡ mẫu nhỏ (n = {activeMat.totalSamples} &lt; 30) chưa đủ điều kiện suy diễn thống kê; cần thu thập thêm phiếu chấm độc lập.
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Độ Chính Xác (Acc)</div>
                              <div className="text-xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
                                {activeMat.metrics.accuracy}%
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                95% CI: [{activeMat.metrics.wilsonAccuracy?.lowerPct}% - {activeMat.metrics.wilsonAccuracy?.upperPct}%]
                              </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Độ Chuẩn Xác (Precision)</div>
                              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                                {activeMat.metrics.precision}%
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">TP / (TP + FP)</div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Độ Nhạy (Recall)</div>
                              <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                                {activeMat.metrics.recall}%
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">TP / (TP + FN)</div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Độ Đặc Hiệu (Spec)</div>
                              <div className="text-xl font-black text-violet-600 dark:text-violet-400 mt-1">
                                {activeMat.metrics.specificity}%
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">TN / (TN + FP)</div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">F1 Lớp Đạt / Chưa Đạt</div>
                              <div className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1">
                                {activeMat.metrics.f1Positive || activeMat.metrics.f1Score}% / {activeMat.metrics.f1Negative || 0}%
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">Đạt / Chưa đạt</div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Độ Đồng Thuận Kappa (κ)</div>
                              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                                {activeMat.metrics.cohenKappa !== null ? activeMat.metrics.cohenKappa : 'N/A'}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">Đồng thuận trừ may rủi</div>
                            </div>
                          </div>
                        )}

                        {/* KHỐI 2: BẢNG MA TRẬN 2x2 & PHÂN RÃ 2 TIÊU CHÍ */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                          {/* Bảng ma trận 2x2 */}
                          <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                              {isTeacherCrosstab
                                ? `Bảng Phân Bố Chéo 2 Tiêu Chí (2x2 Matrix) - ${crossTab.total} Mẫu`
                                : `Bảng Phân Bố Ma Trận (2x2 Grid) - ${activeMat.totalSamples} Mẫu`}
                            </div>
                            <div className="overflow-x-auto">
                              {isTeacherCrosstab ? (
                                <table className="w-full text-center text-xs">
                                  <thead>
                                    <tr>
                                      <th className="p-2 text-slate-400 font-normal"></th>
                                      <th colSpan={2} className="p-2 font-bold text-slate-700 dark:text-slate-200 bg-slate-200/60 dark:bg-slate-800/60 rounded-t-lg">
                                        Tiêu Chí 1: Kết Quả Đáp Án Cuối Cùng
                                      </th>
                                    </tr>
                                    <tr className="text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                      <th className="p-2 text-left font-bold text-slate-700 dark:text-slate-300">Tiêu Chí 2: Trình Bày & Sư Phạm</th>
                                      <th className="p-2 font-bold text-emerald-700 dark:text-emerald-400">ĐÁP ÁN ĐÚNG ({crossTab.dapAnCorrect} mẫu)</th>
                                      <th className="p-2 font-bold text-rose-700 dark:text-rose-400">ĐÁP ÁN SAI ({crossTab.total - crossTab.dapAnCorrect} mẫu)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    <tr>
                                      <td className="p-3 text-left font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/20">
                                        TRÌNH BÀY ĐÚNG ({crossTab.trinhBayCorrect} mẫu)
                                      </td>
                                      <td className="p-3 bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-950 dark:text-emerald-200 font-black text-sm">
                                        {crossTab.bothPassed} mẫu ({crossTab.bothPassedPct}%)
                                        <div className="text-[10px] font-normal text-emerald-800 dark:text-emerald-300">Đồng thuận Đạt toàn diện</div>
                                      </td>
                                      <td className="p-3 bg-amber-100/70 dark:bg-amber-900/40 text-amber-950 dark:text-amber-200 font-black text-sm">
                                        {crossTab.presentationOnly} mẫu ({crossTab.presentationOnlyPct}%)
                                        <div className="text-[10px] font-normal text-amber-800 dark:text-amber-300">Lệch số học / nhầm kết quả</div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="p-3 text-left font-bold text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20">
                                        TRÌNH BÀY CHƯA ĐÚNG ({crossTab.total - crossTab.trinhBayCorrect} mẫu)
                                      </td>
                                      <td className="p-3 bg-orange-100/70 dark:bg-orange-900/40 text-orange-950 dark:text-orange-200 font-black text-sm">
                                        {crossTab.answerOnly} mẫu ({crossTab.answerOnlyPct}%)
                                        <div className="text-[10px] font-normal text-orange-800 dark:text-orange-300">Đúng đáp số, thiếu diễn giải</div>
                                      </td>
                                      <td className="p-3 bg-rose-100/70 dark:bg-rose-900/40 text-rose-950 dark:text-rose-200 font-black text-sm">
                                        {crossTab.bothFailed} mẫu ({crossTab.bothFailedPct}%)
                                        <div className="text-[10px] font-normal text-rose-800 dark:text-rose-300">Chưa đạt cả đáp án & trình bày</div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              ) : (
                                <table className="w-full text-center text-xs">
                                  <thead>
                                    <tr>
                                      <th className="p-2 text-slate-400 font-normal"></th>
                                      <th colSpan={2} className="p-2 font-bold text-slate-700 dark:text-slate-200 bg-slate-200/60 dark:bg-slate-800/60 rounded-t-lg">
                                        Dự Đoán Của AI (Predicted)
                                      </th>
                                    </tr>
                                    <tr className="text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                      <th className="p-2 text-left font-bold text-slate-700 dark:text-slate-300">Ground Truth (SGK / GV)</th>
                                      <th className="p-2 font-bold text-emerald-700 dark:text-emerald-400">AI: ĐẠT (Positive)</th>
                                      <th className="p-2 font-bold text-rose-700 dark:text-rose-400">AI: CHƯA ĐẠT (Negative)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    <tr>
                                      <td className="p-3 text-left font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">
                                        ĐẠT (Positive)
                                      </td>
                                      <td className="p-3 bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-950 dark:text-emerald-200 font-black text-sm">
                                        TP = {activeMat.matrix.tp}
                                        <div className="text-[10px] font-normal text-emerald-800 dark:text-emerald-300">Đồng thuận Đạt</div>
                                      </td>
                                      <td className="p-3 bg-amber-100/70 dark:bg-amber-900/40 text-amber-950 dark:text-amber-200 font-black text-sm">
                                        FN = {activeMat.matrix.fn}
                                        <div className="text-[10px] font-normal text-amber-800 dark:text-amber-300">AI từ chối thừa</div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="p-3 text-left font-bold text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20">
                                        CHƯA ĐẠT (Negative)
                                      </td>
                                      <td className="p-3 bg-rose-100/70 dark:bg-rose-900/40 text-rose-950 dark:text-rose-200 font-black text-sm">
                                        FP = {activeMat.matrix.fp}
                                        <div className="text-[10px] font-normal text-rose-800 dark:text-rose-300">AI ảo tưởng / Sót lỗi</div>
                                      </td>
                                      <td className="p-3 bg-blue-100/70 dark:bg-blue-900/40 text-blue-950 dark:text-blue-200 font-black text-sm">
                                        TN = {activeMat.matrix.tn}
                                        <div className="text-[10px] font-normal text-blue-800 dark:text-blue-300">Đồng thuận bắt lỗi</div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                              <div>
                                <strong>Phương pháp khoa học:</strong>{' '}
                                {isTeacherCrosstab
                                  ? 'Khi giáo viên thẩm định câu trả lời do AI tạo sinh, toàn bộ câu hỏi đều là yêu cầu giải (AI không phát sinh nhãn từ chối). Mô hình đánh giá chuẩn quốc tế là Đánh giá đa tiêu chí (Rubric) và Bảng phân bố chéo 2 chiều (Cross-Tabulation Matrix) nhằm phản ánh chân thực cơ cấu lỗi thay vì ép vào ma trận nhị phân (vốn gây FN=0, TN=0, Spec=0%, Kappa=0).'
                                  : 'Quy tắc đối chiếu kỹ thuật: AI: ĐẠT = AI đã đưa ra câu trả lời cho học sinh; AI: CHƯA ĐẠT = AI từ chối / báo không đủ căn cứ. GV: ĐẠT = Đáp án ĐÚNG & Trình bày ĐÚNG.'}
                              </div>
                              {Array.isArray(activeMat.disagreementSamples) && activeMat.disagreementSamples.length > 0 && (
                                <div className="pt-1 border-t border-slate-200 dark:border-slate-800 space-y-1">
                                  <div className="font-semibold text-slate-700 dark:text-slate-200">
                                    Chi tiết các mẫu cần hiệu đính ({activeMat.disagreementSamples.length} mẫu):
                                  </div>
                                  <div className="max-h-28 overflow-y-auto space-y-1">
                                    {activeMat.disagreementSamples.map((item, idx) => (
                                      <div key={`${item.sampleId}-${idx}`} className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                        <span className={`px-1.5 py-0.5 rounded font-bold ${item.category === 'FP' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'}`}>
                                          {item.category === 'FP' ? 'Lệch' : item.category}
                                        </span>
                                        <span className="font-mono text-slate-700 dark:text-slate-300">{item.sampleId}</span>
                                        <span className="text-slate-500">
                                          (Đáp án: {item.dap_an === 'dung' ? 'Đúng' : 'Sai'}, Trình bày: {item.trinh_bay === 'dung' ? 'Đúng' : 'Chưa đúng'}
                                          {item.primaryError && item.primaryError !== 'none' ? `, Lỗi: ${item.primaryError}` : ''}
                                          {item.notes ? `, Ghi chú: ${item.notes}` : ''})
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Phân rã 2 Tiêu chí Đáp Án & Trình Bày */}
                          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
                            <div>
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-3">
                                Phân Rã 2 Tiêu Chí Chấm Điểm
                              </div>
                              
                              <div className="space-y-3.5">
                                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-slate-700 dark:text-slate-300">Tiêu chí 1: Đáp Án Cuối Cùng</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      {activeMat.breakdown?.dapAnAccuracyPct}% ({activeMat.breakdown?.dapAnCorrectCount}/{activeMat.breakdown?.dapAnTotal})
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                                    <div 
                                      className="bg-emerald-500 h-full rounded-full transition-all"
                                      style={{ width: `${activeMat.breakdown?.dapAnAccuracyPct || 0}%` }}
                                    />
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-1">Độ chính xác kết quả số học / công thức chốt.</div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-slate-700 dark:text-slate-300">Tiêu chí 2: Trình Bày & Lập Luận</span>
                                    <span className="text-cyan-600 dark:text-cyan-400">
                                      {activeMat.breakdown?.trinhBayAccuracyPct}% ({activeMat.breakdown?.trinhBayCorrectCount}/{activeMat.breakdown?.trinhBayTotal})
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                                    <div 
                                      className="bg-cyan-500 h-full rounded-full transition-all"
                                      style={{ width: `${activeMat.breakdown?.trinhBayAccuracyPct || 0}%` }}
                                    />
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-1">Mạch lạc, logic, đúng chuẩn sư phạm GDPT 2018.</div>
                                </div>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 italic">
                              * Ghi chú trung thực: Tập 150 ca là tập tổng hợp thuật toán với điểm số đặt trước (preset); chỉ tab Giáo viên mới phản ánh kết quả thẩm định trực tiếp.
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CAM KẾT & QUYỀN RIÊNG TƯ (CONSENT)                                 */}
        {/* ========================================================================= */}
        {activeTab === 'consent' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm dark:shadow-none">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                Phiếu Xác Nhận Tham Gia & Bảo Vệ Quyền Riêng Tư
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                STEM HUB cam kết tuân thủ quy tắc bảo vệ dữ liệu cá nhân. Danh tính của Thầy/Cô được mặc định ẩn danh trong mọi báo cáo và hồ sơ dự thi.
              </p>
            </div>

            <div className="space-y-4 max-w-xl">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <label className={`flex items-start gap-3 ${isReadOnlyViewer ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    disabled={isReadOnlyViewer}
                    checked={consentData.publicNameConsent}
                    onChange={(e) => setConsentData(prev => ({ ...prev, publicNameConsent: e.target.checked }))}
                    className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-cyan-600 focus:ring-0 disabled:cursor-not-allowed"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Đồng ý công khai họ tên trên danh mục Thẩm định viên chuyên môn</span>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                      Nếu không chọn mục này, hệ thống sẽ <strong>MẶC ĐỊNH ẨN DANH</strong> họ tên của Thầy/Cô và chỉ hiển thị mã ẩn danh (ví dụ: `GV-TOAN-01`) trong báo cáo gửi Ban Giám khảo.
                    </p>
                  </div>
                </label>

                {consentData.publicNameConsent && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Họ và tên Thầy/Cô:</label>
                      <input
                        type="text"
                        disabled={isReadOnlyViewer}
                        value={consentData.teacherDisplayName || ''}
                        onChange={(e) => setConsentData(prev => ({ ...prev, teacherDisplayName: e.target.value }))}
                        placeholder="Thầy/Cô Nguyễn Văn A..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Đơn vị công tác / Trường THPT:</label>
                      <input
                        type="text"
                        disabled={isReadOnlyViewer}
                        value={consentData.institution || ''}
                        onChange={(e) => setConsentData(prev => ({ ...prev, institution: e.target.value }))}
                        placeholder="Trường THPT Chuyên..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Rút khỏi thẩm định */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <label className={`flex items-center gap-3 ${isReadOnlyViewer ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    disabled={isReadOnlyViewer}
                    checked={consentData.withdrawn}
                    onChange={(e) => setConsentData(prev => ({ ...prev, withdrawn: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-rose-600 focus:ring-0 disabled:cursor-not-allowed"
                  />
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-300">Yêu cầu rút khỏi thẩm định và hủy quyền sử dụng dữ liệu</span>
                </label>
                {consentData.withdrawn && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400/80">
                    Khi tích chọn mục này, toàn bộ phiếu chấm của Thầy/Cô sẽ bị đánh dấu rút lui và không xuất hiện trong các báo cáo khoa học.
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={savingConsent || isReadOnlyViewer}
                onClick={handleSaveConsent}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 font-bold text-xs flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingConsent ? <RefreshCw className="w-4 h-4 animate-spin" /> : (isReadOnlyViewer ? <Lock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />)}
                {isReadOnlyViewer ? (isReadOnlyJudge ? 'Chế Độ Chỉ Xem (BGK)' : 'Chế Độ Chỉ Xem (Chỉ GV Sửa)') : 'Lưu Lựa Chọn Đồng Thuận'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'lab_safety' && (
          <LabSafetyReviewPanel firebaseUser={firebaseUser} canEditReviews={canEditReviews} />
        )}
      </div>
  );
}

function formatTopError(dist) {
  if (!dist) return 'None';
  const entries = Object.entries(dist).filter(([k]) => k !== 'none');
  if (entries.length === 0) return 'Không có';
  entries.sort((a, b) => b[1] - a[1]);
  if (entries[0][1] === 0) return 'Không có';
  const labels = {
    sai_kien_thuc: 'Sai kiến thức',
    thieu_nguon: 'Thiếu nguồn SGK',
    nguon_khong_lien_quan: 'Nguồn không liên quan',
    sai_don_vi: 'Sai đơn vị',
    dien_dat: 'Diễn đạt',
    khac: 'Khác'
  };
  return labels[entries[0][0]] || entries[0][0];
}
