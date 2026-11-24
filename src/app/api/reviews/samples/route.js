import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getCorsHeaders, getClientIp, checkRateLimit, maskErrorMessage } from '@/lib/serverSecurity';
import { verifyFirebaseIdToken, getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { sampleForReviewer, generateMathTeacherBlindReviewSet } from '@/lib/reviewSampler';

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
  const sampleSize = parseInt(searchParams.get('sampleSize') || '20', 10);

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

  // 4. Rút mẫu làm mù (Tách bạch rõ rệt giữa đầu ra Gemini thật và 150 ca benchmark tổng hợp)
  const source = searchParams.get('source') || '';
  const ablationSummaryPath = path.resolve(process.cwd(), 'reports/ablation/ablation_summary.json');
  const hasLiveAblation = fs.existsSync(ablationSummaryPath);
  const useRealGeminiOutput = (source === 'real' || source === 'live' || source === 'gemini_real') || 
                              (requestedSubject === 'toan' && hasLiveAblation && source !== 'synthetic' && source !== 'benchmark_150');

  let samplingResult;
  if (useRealGeminiOutput && requestedSubject === 'toan') {
    const blindSet = generateMathTeacherBlindReviewSet({
      seed,
      mathQuestionsCount: Math.min(10, Math.floor(sampleSize / 2) || 10),
      datasetFilePath: 'reports/ablation/ablation_dataset_100.v1.4.1.json',
      ablationSummaryPath: 'reports/ablation/ablation_summary.json'
    });
    samplingResult = {
      seed: blindSet.seed,
      subject: 'toan',
      sampleSize: blindSet.totalItems,
      totalAvailable: blindSet.totalItems,
      sourceType: 'gemini_real_output',
      samples: blindSet.blindedSamplesForTeacher
    };
  } else {
    samplingResult = sampleForReviewer({
      subject: requestedSubject,
      seed,
      sampleSize,
      reviewerUid: uid
    });
  }

  // 5. Tra cứu danh sách mẫu người này đã chấm (để hiển thị tiến độ trên UI)
  let reviewedSampleIds = [];
  const admin = getFirebaseAdmin();
  if (admin) {
    try {
      const existingSnap = await admin.firestore().collection('expert_reviews')
        .where('reviewerUid', '==', uid)
        .where('subject', '==', requestedSubject)
        .get();
      reviewedSampleIds = existingSnap.docs.map(d => d.data().sampleId);
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
    reviewedCount: reviewedSampleIds.length,
    reviewedSampleIds,
    samples: samplingResult.samples
  }, { headers: getCorsHeaders(request) });
}
