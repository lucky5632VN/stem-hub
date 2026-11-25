import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getCorsHeaders, getClientIp, checkRateLimit, maskErrorMessage } from '@/lib/serverSecurity';
import { verifyFirebaseIdToken, getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { sampleForReviewer, generateMathTeacherBlindReviewSet, buildUnifiedSamplePool, dedupePoolQuestions } from '@/lib/reviewSampler';
import { evaluateReviewPortalAccess } from '@/lib/reviewAgreement';

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export const dynamic = 'force-dynamic';

/**
 * GET /api/reviews/samples?subject=toan&seed=2026&sampleSize=30
 * 
 * Lấy danh sách mẫu câu hỏi và câu trả lời AI đã được làm mù (blinded)
 * theo đúng môn học được cấp quyền thẩm định của người chấm.
 */
export async function GET(request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`review_samples:${ip}`, { maxTokens: 60, refillRate: 2 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
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

  // 2. Xác định quyền vào cổng và vai trò thẩm định CHỈ từ Custom Claims
  // - Trừ tài khoản Học sinh (student / chưa cấp vai trò), mọi vai trò khác đều có thể vào xem
  // - Chỉ vai trò Giáo viên (teacher) mới có quyền chỉnh sửa / gửi phiếu
  const adminUids = (process.env.ADMIN_UIDS || process.env.NEXT_PUBLIC_ADMIN_UIDS || '').split(',').map(u => u.trim()).filter(Boolean);
  const portalAccess = evaluateReviewPortalAccess(payload, { adminUids });

  if (!portalAccess.canEnterPortal) {
    return NextResponse.json(
      { error: 'Tài khoản Học sinh không có quyền truy cập khu vực thẩm định chuyên môn.' },
      { status: 403, headers: getCorsHeaders(request) }
    );
  }

  const isAdmin = portalAccess.isAdmin;
  const reviewerType = portalAccess.effectiveRole;
  let subjects = Array.isArray(payload.subjects) ? payload.subjects : [];
  if (!portalAccess.isTeacher || isAdmin || subjects.length === 0) {
    subjects = ['toan', 'ly', 'hoa', 'sinh'];
  }

  // 3. Kiểm tra môn yêu cầu
  const { searchParams } = new URL(request.url);
  const requestedSubject = (searchParams.get('subject') || 'toan').toLowerCase();
  const seed = parseInt(searchParams.get('seed') || '2026', 10);
  const sampleSize = parseInt(searchParams.get('sampleSize') || '999', 10);

  // QUY TẮC BẢO MẬT: Chặn chấm ngoài môn được phân công
  if (reviewerType === 'teacher' && subjects.length > 0 && !subjects.includes(requestedSubject)) {
    return NextResponse.json(
      { 
        error: `Bạn chỉ được cấp quyền thẩm định môn [${subjects.join(', ')}]. Không thể truy cập môn [${requestedSubject}].`,
        allowedSubjects: subjects
      },
      { status: 403, headers: getCorsHeaders(request) }
    );
  }

  // 4. Rút mẫu làm mù: Ưu tiên câu hỏi học sinh gửi lên đầu, hỗ trợ xem toàn bộ câu hỏi
  let samplingResult = sampleForReviewer({
    subject: requestedSubject,
    seed,
    sampleSize,
    reviewerUid: uid
  });

  // 5. Thống kê số lượng câu hỏi duy nhất hiện có của tất cả các môn
  const fullPool = buildUnifiedSamplePool(true);
  const subjectCounts = {
    toan: dedupePoolQuestions(fullPool.filter(i => i.subject === 'toan')).length,
    ly: dedupePoolQuestions(fullPool.filter(i => i.subject === 'ly')).length,
    hoa: dedupePoolQuestions(fullPool.filter(i => i.subject === 'hoa')).length,
    sinh: dedupePoolQuestions(fullPool.filter(i => i.subject === 'sinh')).length
  };

  // 6. Tra cứu danh sách mẫu người này đã chấm (lọc bỏ isDemo và khử trùng lặp amendment theo sampleId)
  const reviewedSetBySubject = {
    toan: new Set(),
    ly: new Set(),
    hoa: new Set(),
    sinh: new Set()
  };
  const admin = getFirebaseAdmin();
  if (admin) {
    try {
      const existingSnap = await admin.firestore().collection('expert_reviews')
        .where('reviewerUid', '==', uid)
        .get();
      existingSnap.docs.forEach(doc => {
        const d = doc.data();
        if (d.isDemo) return;
        const subj = (d.subject || '').toLowerCase();
        if (subj && reviewedSetBySubject[subj] && d.sampleId) {
          reviewedSetBySubject[subj].add(d.sampleId);
        }
      });
    } catch (err) {
      console.warn('[ReviewSamples] Không thể đọc tiến độ chấm cũ:', err.message);
    }
  }

  const reviewedSampleIds = Array.from(reviewedSetBySubject[requestedSubject] || []);
  const reviewedCountsBySubject = {
    toan: reviewedSetBySubject.toan.size,
    ly: reviewedSetBySubject.ly.size,
    hoa: reviewedSetBySubject.hoa.size,
    sinh: reviewedSetBySubject.sinh.size
  };

  // Đẩy toàn bộ câu chưa chấm lên đầu danh sách để giáo viên không chạm lại câu đã chấm
  const currentReviewedSet = reviewedSetBySubject[requestedSubject] || new Set();
  const orderedSamples = [
    ...samplingResult.samples.filter(s => !currentReviewedSet.has(s.sampleId)),
    ...samplingResult.samples.filter(s => currentReviewedSet.has(s.sampleId))
  ];

  return NextResponse.json({
    success: true,
    reviewerType,
    canEditReviews: portalAccess.canEditReviews,
    subject: requestedSubject,
    authorizedSubjects: subjects,
    seed: samplingResult.seed,
    sampleSize: orderedSamples.length,
    totalAvailable: samplingResult.totalAvailable,
    subjectCounts,
    reviewedCountsBySubject,
    studentFlagsCount: samplingResult.studentFlagsCount || 0,
    reviewedCount: reviewedSampleIds.length,
    reviewedSampleIds,
    samples: orderedSamples
  }, { headers: getCorsHeaders(request) });
}
