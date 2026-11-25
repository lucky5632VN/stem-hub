import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getCorsHeaders, getClientIp, checkRateLimit, maskErrorMessage } from '@/lib/serverSecurity';
import { verifyFirebaseIdToken, getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { hashString } from '@/lib/reviewSampler';
import { evaluateReviewPortalAccess } from '@/lib/reviewAgreement';

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export const dynamic = 'force-dynamic';

const VALID_PRIMARY_ERRORS = [
  'none',
  'sai_kien_thuc',
  'thieu_nguon',
  'nguon_khong_lien_quan',
  'sai_don_vi',
  'dien_dat',
  'khac'
];

/**
 * POST /api/reviews/submit
 * Gửi phiếu thẩm định bất biến của Giáo viên hoặc Thành viên nhóm
 */
export async function POST(request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`review_submit:${ip}`, { maxTokens: 40, refillRate: 1 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Quá nhiều yêu cầu gửi phiếu. Vui lòng thử lại sau.' },
      { status: 429, headers: getCorsHeaders(request) }
    );
  }

  // 1. Xác thực Bearer Token
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Yêu cầu token xác thực hợp lệ (Bearer token).' },
      { status: 401, headers: getCorsHeaders(request) }
    );
  }

  const token = authHeader.substring(7);
  const host = request.headers.get('host') || '';
  const tokenVerify = await verifyFirebaseIdToken(token, { host });
  if (!tokenVerify.valid) {
    return NextResponse.json(
      { error: tokenVerify.error || 'Token không hợp lệ hoặc đã hết hạn.' },
      { status: tokenVerify.status || 401, headers: getCorsHeaders(request) }
    );
  }

  const payload = tokenVerify.decoded;
  const uid = payload.user_id || payload.sub || payload.uid;

  // 2. Xác định vai trò thẩm định thực tế CHỈ từ server-side token/claims
  const adminUids = (process.env.ADMIN_UIDS || process.env.NEXT_PUBLIC_ADMIN_UIDS || '').split(',').map(u => u.trim()).filter(Boolean);
  const portalAccess = evaluateReviewPortalAccess(payload, { adminUids });
  const isAdmin = portalAccess.isAdmin;

  // QUY TẮC CỐT LÕI: Chỉ tài khoản có vai trò Giáo viên (teacher) mới được chấm, chỉnh sửa và cập nhật phiếu
  if (!portalAccess.canEditReviews) {
    const denyMsg = portalAccess.isJudge
      ? 'Tài khoản Ban Giám Khảo chỉ có quyền xem giao diện và quy trình (Read-Only), không thể gửi hoặc sửa phiếu đánh giá.'
      : 'Chỉ tài khoản có vai trò Giáo viên (role: teacher) mới được phép chấm, chỉnh sửa hoặc cập nhật phiếu đánh giá.';
    return NextResponse.json(
      { error: denyMsg },
      { status: 403, headers: getCorsHeaders(request) }
    );
  }

  const reviewerType = 'teacher';
  let subjects = Array.isArray(payload.subjects) ? payload.subjects : [];
  if (isAdmin && subjects.length === 0) {
    subjects = ['toan', 'ly', 'hoa', 'sinh'];
  }

  // 3. Phân tích nội dung phiếu chấm gửi lên
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ error: 'Dữ liệu JSON không hợp lệ.' }, { status: 400, headers: getCorsHeaders(request) });
  }

  const {
    sampleId,
    subject,
    scores,
    dap_an,
    trinh_bay,
    verdict,
    primaryError = 'none',
    notes = '',
    timeSpentSeconds = 0,
    skipped = false,
    skipReason = '',
    isAmendment = false,
    amendsReviewId = null,
    amendmentReason = '',
    isDemo = false
  } = body;

  if (!sampleId || typeof sampleId !== 'string') {
    return NextResponse.json({ error: 'Thiếu mã mẫu (sampleId).' }, { status: 400, headers: getCorsHeaders(request) });
  }

  const normSubject = (subject || '').toLowerCase();
  if (!normSubject || !['toan', 'ly', 'hoa', 'sinh', 'stem'].includes(normSubject)) {
    return NextResponse.json({ error: 'Môn học không hợp lệ (hỗ trợ toan, ly, hoa, sinh).' }, { status: 400, headers: getCorsHeaders(request) });
  }

  // BẢO MẬT: Chặn chấm ngoài môn được phân công
  if (reviewerType === 'teacher' && subjects.length > 0 && !subjects.includes(normSubject)) {
    return NextResponse.json(
      { error: `Tài khoản giáo viên môn [${subjects.join(', ')}] bị cấm chấm môn [${normSubject}].` },
      { status: 403, headers: getCorsHeaders(request) }
    );
  }

  // Kiểm tra tính hợp lệ của Rubric chấm điểm
  let validScores = null;
  let totalScore = 0;
  let dapAnNormalized = null;
  let trinhBayNormalized = null;
  let overallVerdict = null;

  if (!skipped) {
    // 🎯 HỖ TRỢ SCHEMA CHẤM ĐIỂM TINH GỌN (2 TIÊU CHÍ: ĐÁP ÁN & TRÌNH BÀY)
    const isSimplified = dap_an !== undefined || trinh_bay !== undefined;

    if (isSimplified) {
      dapAnNormalized = (dap_an === 'dung' || dap_an === true || dap_an === 1) ? 'dung' : 'sai';
      trinhBayNormalized = (trinh_bay === 'dung' || trinh_bay === true || trinh_bay === 1) ? 'dung' : 'chua_dung';
      overallVerdict = (verdict === 'dung' || verdict === 'sai') 
        ? verdict 
        : ((dapAnNormalized === 'dung' && trinhBayNormalized === 'dung') ? 'dung' : 'sai');

      const isDapAnPass = dapAnNormalized === 'dung';
      const isTrinhBayPass = trinhBayNormalized === 'dung';

      validScores = {
        dap_an: isDapAnPass ? 1 : 0,
        trinh_bay: isTrinhBayPass ? 1 : 0,
        knowledge: isDapAnPass ? 2 : 0,
        pedagogy: isTrinhBayPass ? 2 : 0,
        grounding: 2,
        safety: 2
      };
      totalScore = (isDapAnPass ? 1 : 0) + (isTrinhBayPass ? 1 : 0);
    } else {
      // Schema 4 tiêu chí cũ
      if (!scores || typeof scores !== 'object') {
        return NextResponse.json({ error: 'Thiếu điểm đánh giá (scores hoặc dap_an/trinh_bay).' }, { status: 400, headers: getCorsHeaders(request) });
      }

      const { knowledge, grounding, pedagogy, safety } = scores;
      const isScoreValid = (val) => Number.isInteger(val) && val >= 0 && val <= 2;

      if (!isScoreValid(knowledge) || !isScoreValid(grounding) || !isScoreValid(pedagogy) || !isScoreValid(safety)) {
        return NextResponse.json(
          { error: 'Mỗi tiêu chí trong Rubric (đúng kiến thức, có căn cứ, sư phạm, an toàn) phải là số nguyên từ 0 đến 2.' },
          { status: 400, headers: getCorsHeaders(request) }
        );
      }

      validScores = { knowledge, grounding, pedagogy, safety };
      totalScore = knowledge + grounding + pedagogy + safety;
      dapAnNormalized = knowledge >= 1 ? 'dung' : 'sai';
      trinhBayNormalized = pedagogy >= 1 ? 'dung' : 'chua_dung';
      overallVerdict = totalScore >= 5 ? 'dung' : 'sai';
    }

    if (!VALID_PRIMARY_ERRORS.includes(primaryError)) {
      return NextResponse.json(
        { error: `Loại lỗi chính không hợp lệ. Cho phép: ${VALID_PRIMARY_ERRORS.join(', ')}` },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }
  } else {
    if (!skipReason || typeof skipReason !== 'string' || skipReason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Khi chọn "Không đủ chuyên môn để chấm", vui lòng nêu rõ lý do.' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }
  }

  // 4. Sinh mã ẩn danh (Anonymized Reviewer Code)
  const hashHex = Math.abs(hashString(uid)).toString(16).toUpperCase().padStart(4, '0').slice(-4);
  const reviewerCode = reviewerType === 'teacher' 
    ? `GV-${normSubject.toUpperCase()}-${hashHex}`
    : `TEAM-${hashHex}`;

  // 5. Kiểm tra tính bất biến & chống gửi trùng lặp
  const baseDocId = `${sampleId}_${reviewerType}_${uid}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const targetDocId = isAmendment 
    ? `${baseDocId}_rev_${Date.now()}`
    : baseDocId;

  const admin = getFirebaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: 'Không thể kết nối Firebase Admin để lưu trữ phiếu chấm.' },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }

  const firestore = admin.firestore();
  const reviewRef = firestore.collection('expert_reviews').doc(targetDocId);

  // Nếu không phải là phiếu sửa đổi (amendment), kiểm tra xem phiếu gốc đã tồn tại chưa
  if (!isAmendment) {
    const existingSnap = await reviewRef.get();
    if (existingSnap.exists) {
      return NextResponse.json(
        { 
          error: 'Mẫu này đã được bạn chấm trước đó. Theo quy tắc bất biến, không thể ghi đè phiếu cũ. Vui lòng gửi dưới dạng bản sửa (amendment) kèm lý do sửa đổi.',
          existingReviewId: baseDocId
        },
        { status: 409, headers: getCorsHeaders(request) }
      );
    }
  } else {
    if (!amendmentReason || amendmentReason.trim().length < 5) {
      return NextResponse.json(
        { error: 'Bản sửa đổi (amendment) bắt buộc phải có lý do sửa đổi chi tiết (tối thiểu 5 ký tự).' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }
  }

  // 6. Xác định nhãn dự đoán của AI (aiVerdict) cho ma trận nhầm lẫn
  let determinedAiVerdict = true;
  if (body.aiVerdict !== undefined && body.aiVerdict !== null) {
    determinedAiVerdict = Boolean(body.aiVerdict);
  } else {
    // Nếu là câu cạm bẫy đối chứng hoặc câu tri thức cách ly
    if (sampleId.startsWith('ablation_') || sampleId.startsWith('learned_')) {
      determinedAiVerdict = false;
    } else {
      determinedAiVerdict = true;
    }
  }

  // 7. Ghi bản ghi phiếu chấm bất biến
  const reviewRecord = {
    reviewId: targetDocId,
    sampleId,
    subject: normSubject,
    reviewerType,
    reviewerUid: uid,
    reviewerCode,
    rubricVersion: '2.0',
    dap_an: dapAnNormalized,
    trinh_bay: trinhBayNormalized,
    verdict: overallVerdict,
    aiVerdict: determinedAiVerdict,
    timeSpentSeconds: Math.max(1, Number(timeSpentSeconds) || 1),
    timestamp: new Date().toISOString(),
    scores: validScores,
    totalScore: skipped ? null : totalScore,
    primaryError: skipped ? null : primaryError,
    notes: String(notes || '').trim().slice(0, 2000),
    skipped: Boolean(skipped),
    skipReason: skipped ? String(skipReason).trim().slice(0, 500) : null,
    isAmendment: Boolean(isAmendment),
    amendsReviewId: isAmendment ? (amendsReviewId || baseDocId) : null,
    amendmentReason: isAmendment ? String(amendmentReason).trim().slice(0, 500) : null,
    isDemo: Boolean(isDemo)
  };

  await reviewRef.set(reviewRecord);

  // 🛡️ ĐÃ TẮT CƠ CHẾ TỰ ĐỒNG BỘ TỪ PHIẾU CHẤM SANG learned_knowledge.
  // Duyệt tri thức vào RAG CHỈ qua trang duyệt chính thức (/admin/knowledge-review) với tài khoản có claims hợp lệ.
  // Tuyệt đối không tự động gán mác isTeacherVerified từ 1 phiếu chấm đơn lẻ.

  // Đồng bộ lưu bản sao cục bộ để hỗ trợ chạy phân tích offline / dự phòng
  try {
    const localDir = path.resolve(process.cwd(), 'reports/ablation');
    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
    const localFile = path.join(localDir, 'expert_reviews_local.json');
    let localList = [];
    if (fs.existsSync(localFile)) {
      try {
        localList = JSON.parse(fs.readFileSync(localFile, 'utf8'));
      } catch (_) { localList = []; }
    }
    const existingIdx = localList.findIndex(r => r.reviewId === targetDocId);
    if (existingIdx >= 0) {
      localList[existingIdx] = reviewRecord;
    } else {
      localList.push(reviewRecord);
    }
    fs.writeFileSync(localFile, JSON.stringify(localList, null, 2), 'utf8');
  } catch (localErr) {
    console.warn('[ReviewSubmit] Không thể ghi bản sao local:', localErr.message);
  }

  return NextResponse.json({
    success: true,
    reviewId: targetDocId,
    reviewerCode,
    reviewerType,
    subject: normSubject,
    isAmendment: Boolean(isAmendment),
    message: isAmendment ? 'Đã ghi nhận bản sửa đổi thành công.' : 'Đã ghi nhận phiếu thẩm định thành công.'
  }, { headers: getCorsHeaders(request) });
}
