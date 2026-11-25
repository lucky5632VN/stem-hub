import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getCorsHeaders, getClientIp, checkRateLimit, maskErrorMessage } from '@/lib/serverSecurity';
import { verifyFirebaseIdToken, getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { sampleForReviewer, generateMathTeacherBlindReviewSet, buildUnifiedSamplePool } from '@/lib/reviewSampler';

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

  // 2. Xác định vai trò thẩm định (reviewerType) và danh sách môn được cấp quyền CHỈ từ Custom Claims
  const isJudge = payload.reviewerType === 'judge' || payload.isJudge === true;
  let reviewerType = payload.reviewerType || (payload.role === 'teacher' ? 'teacher' : (payload.role === 'team_self' ? 'team_self' : null));
  let subjects = Array.isArray(payload.subjects) ? payload.subjects : [];

  // BẢO MẬT: TUYỆT ĐỐI KHÔNG fallback đọc trường role/reviewerType từ Firestore document để chống leo thang đặc quyền.

  // Admin có thể truy cập để kiểm thử/quản lý nếu cần
  const adminUids = (process.env.ADMIN_UIDS || process.env.NEXT_PUBLIC_ADMIN_UIDS || '').split(',').map(u => u.trim()).filter(Boolean);
  const isAdmin = payload.admin === true || payload.role === 'admin' || (uid && adminUids.includes(uid));
  if (isAdmin && !reviewerType) {
    reviewerType = 'team_self'; // Admin mặc định chạy thử ở cohort nhóm nội bộ
    subjects = ['toan', 'ly', 'hoa', 'sinh'];
  }

  // Ban Giám Khảo (judge): Được phép xem toàn bộ 4 môn ở chế độ Read-Only để kiểm tra giao diện & quy trình
  if (isJudge && !isAdmin) {
    reviewerType = 'judge';
    subjects = ['toan', 'ly', 'hoa', 'sinh'];
  }

  // Nếu người dùng đã đăng nhập hợp lệ nhưng chưa có claim giáo viên độc lập:
  // Mặc định phân quyền vào nhóm "team_self" (Thành viên nhóm phát triển tự chấm nội bộ)
  if (!reviewerType) {
    reviewerType = 'team_self';
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

  // 5. Thống kê số lượng câu hỏi hiện có của tất cả các môn
  const fullPool = buildUnifiedSamplePool(true);
  const subjectCounts = {
    toan: fullPool.filter(i => i.subject === 'toan').length,
    ly: fullPool.filter(i => i.subject === 'ly').length,
    hoa: fullPool.filter(i => i.subject === 'hoa').length,
    sinh: fullPool.filter(i => i.subject === 'sinh').length
  };

  // 6. Tra cứu danh sách mẫu người này đã chấm (để tính số lượng còn lại cho từng môn)
  let reviewedSampleIds = [];
  const reviewedCountsBySubject = { toan: 0, ly: 0, hoa: 0, sinh: 0 };
  const admin = getFirebaseAdmin();
  if (admin) {
    try {
      const existingSnap = await admin.firestore().collection('expert_reviews')
        .where('reviewerUid', '==', uid)
        .get();
      existingSnap.docs.forEach(doc => {
        const d = doc.data();
        if (d.subject && reviewedCountsBySubject[d.subject] !== undefined) {
          reviewedCountsBySubject[d.subject]++;
        }
        if (d.subject === requestedSubject) {
          reviewedSampleIds.push(d.sampleId);
        }
      });
    } catch (err) {
      console.warn('[ReviewSamples] Không thể đọc tiến độ chấm cũ:', err.message);
    }
  }

  return NextResponse.json({
    success: true,
    reviewerType,
    subject: requestedSubject,
    authorizedSubjects: subjects,
    seed: samplingResult.seed,
    sampleSize: samplingResult.sampleSize,
    totalAvailable: samplingResult.totalAvailable,
    subjectCounts,
    reviewedCountsBySubject,
    studentFlagsCount: samplingResult.studentFlagsCount || 0,
    reviewedCount: reviewedSampleIds.length,
    reviewedSampleIds,
    samples: samplingResult.samples
  }, { headers: getCorsHeaders(request) });
}
