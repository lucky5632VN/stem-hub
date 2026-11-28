import { NextResponse } from 'next/server';
import { getCorsHeaders, getClientIp, checkRateLimit, maskErrorMessage } from '@/lib/serverSecurity';
import { verifyFirebaseIdToken, getSafetyFirestore } from '@/lib/firebaseAdmin';

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export const dynamic = 'force-dynamic';

/**
 * GET /api/reviews/answer-key-check
 * 
 * Trả về danh sách các câu hỏi môn Toán trong answer key để giáo viên đối soát.
 */
export async function GET(request) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const datasetPath = path.resolve(process.cwd(), 'reports/ablation/ablation_dataset_100.json');
    if (!fs.existsSync(datasetPath)) {
      return NextResponse.json({ error: 'Không tìm thấy dataset.' }, { status: 404, headers: getCorsHeaders(request) });
    }
    const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
    const mathCases = (dataset.cases || [])
      .filter(c => (c.subject || '').toLowerCase() === 'toan')
      .map((c, idx) => ({
        stt: idx + 1,
        id: c.id,
        stratum: c.stratum,
        question: c.question,
        groundTruth: c.ground_truth,
        sgkSource: c.sgk_source || 'SGK GDPT 2018'
      }));

    return NextResponse.json({
      total: mathCases.length,
      cases: mathCases,
      notice: 'Dữ liệu chỉ đọc phục vụ giáo viên Toán đối soát và thẩm định đáp án chuẩn.'
    }, { headers: getCorsHeaders(request) });
  } catch (err) {
    return NextResponse.json({ error: maskErrorMessage(err.message) }, { status: 500, headers: getCorsHeaders(request) });
  }
}

/**
 * POST /api/reviews/answer-key-check
 * 
 * Lưu phiếu kiểm tra đáp án chuẩn từ Giáo viên Toán vào collection riêng biệt `teacher_answer_key_reviews`.
 * Bảo mật: Chỉ người có custom claims môn Toán (teacher/admin) mới được gửi phiếu.
 * Quy tắc trung thực Prompt 0: Dữ liệu này được lưu riêng, CHƯA dùng làm "người kiểm" thay thế cho tác giả
 * nghiên cứu trừ khi tác giả trực tiếp kiểm duyệt và xác nhận.
 */
export async function POST(request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`answer_key_check:${ip}`, { maxTokens: 20, refillRate: 1 });
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
  const email = payload.email || '';

  // 2. Kiểm tra quyền hạn từ Custom Claims (chỉ Giáo viên Toán mới được gửi/cập nhật phiếu kiểm tra đáp án)
  const reviewerType = payload.reviewerType || (payload.role === 'teacher' ? 'teacher' : (payload.role === 'team_self' ? 'team_self' : null));
  const subjects = Array.isArray(payload.subjects) ? payload.subjects : [];
  const isAdmin = payload.admin === true || payload.role === 'admin';
  const isTeacher = reviewerType === 'teacher' || payload.role === 'teacher';

  if (!isTeacher || (!isAdmin && subjects.length > 0 && !subjects.includes('toan'))) {
    return NextResponse.json(
      { error: 'Chỉ tài khoản có vai trò Giáo viên môn Toán (role: teacher) mới được phép cập nhật phiếu kiểm tra đáp án.' },
      { status: 403, headers: getCorsHeaders(request) }
    );
  }

  // 3. Đọc dữ liệu phiếu kiểm
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json(
      { error: 'Dữ liệu JSON không hợp lệ.' },
      { status: 400, headers: getCorsHeaders(request) }
    );
  }

  const { checks = [], globalNote = '' } = body;
  if (!Array.isArray(checks) || checks.length === 0) {
    return NextResponse.json(
      { error: 'Danh sách câu kiểm tra (checks) không được để trống.' },
      { status: 400, headers: getCorsHeaders(request) }
    );
  }

  // 4. Lưu vào collection riêng biệt `teacher_answer_key_reviews` trong Firestore (Safety DB)
  const db = getSafetyFirestore();
  if (!db) {
    return NextResponse.json(
      { error: 'Lỗi cấu hình Firebase Admin.' },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }

  try {
    const docRef = db.collection('teacher_answer_key_reviews').doc();
    const submissionRecord = {
      reviewId: docRef.id,
      reviewerUid: uid,
      reviewerEmail: email,
      reviewerType: reviewerType || (isAdmin ? 'admin_test' : 'teacher'),
      subject: 'toan',
      submittedAt: new Date().toISOString(),
      clientIp: ip,
      checksCount: checks.length,
      checks: checks.map(c => ({
        caseId: String(c.caseId || '').trim(),
        agree: Boolean(c.agree),
        confirmedSource: String(c.confirmedSource || '').trim(),
        teacherNote: String(c.teacherNote || '').trim()
      })),
      globalNote: String(globalNote || '').trim(),
      source: 'teacher_answer_key_check',
      verifiedByAuthor: false, // BẢO MẬT/TRUNG THỰC: Chưa dùng làm người kiểm thay thế cho tác giả trừ khi tác giả xác nhận
      authorVerificationNotice: 'Dữ liệu thẩm định của giáo viên được lưu riêng biệt để đối chiếu khoa học; KHÔNG tự động thay thế người kiểm tra chính trừ khi được tác giả nghiên cứu thẩm định và kích hoạt bằng văn bản.'
    };

    await docRef.set(submissionRecord);

    return NextResponse.json(
      {
        success: true,
        reviewId: docRef.id,
        submittedAt: submissionRecord.submittedAt,
        message: 'Đã ghi nhận phiếu kiểm tra đáp án của Giáo viên Toán thành công vào collection teacher_answer_key_reviews.'
      },
      { status: 201, headers: getCorsHeaders(request) }
    );
  } catch (err) {
    console.error('Lỗi lưu phiếu kiểm tra đáp án giáo viên:', err);
    return NextResponse.json(
      { error: maskErrorMessage(err.message) },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}
