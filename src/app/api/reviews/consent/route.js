import { NextResponse } from 'next/server';
import { getCorsHeaders, getClientIp, checkRateLimit } from '@/lib/serverSecurity';
import { verifyFirebaseIdToken, getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { evaluateReviewPortalAccess } from '@/lib/reviewAgreement';

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export const dynamic = 'force-dynamic';

/**
 * GET & POST /api/reviews/consent
 * Quản lý phiếu đồng ý tham gia thẩm định chuyên môn của Giáo viên (lưu riêng biệt với phiếu chấm).
 */
export async function GET(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Yêu cầu token xác thực.' }, { status: 401, headers: getCorsHeaders(request) });
  }

  const token = authHeader.substring(7);
  const host = request.headers.get('host') || '';
  const tokenVerify = await verifyFirebaseIdToken(token, { host });
  if (!tokenVerify.valid) {
    return NextResponse.json({ error: tokenVerify.error }, { status: 401, headers: getCorsHeaders(request) });
  }

  const uid = tokenVerify.decoded.user_id || tokenVerify.decoded.sub;
  const admin = getFirebaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Lỗi kết nối Firebase Admin.' }, { status: 500, headers: getCorsHeaders(request) });
  }

  try {
    const snap = await admin.firestore().collection('teacher_consents').doc(uid).get();
    if (!snap.exists) {
      return NextResponse.json({
        exists: false,
        consent: {
          teacherUid: uid,
          publicNameConsent: false, // Mặc định không công khai tên
          withdrawn: false
        }
      }, { headers: getCorsHeaders(request) });
    }

    return NextResponse.json({
      exists: true,
      consent: snap.data()
    }, { headers: getCorsHeaders(request) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: getCorsHeaders(request) });
  }
}

export async function POST(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Yêu cầu token xác thực.' }, { status: 401, headers: getCorsHeaders(request) });
  }

  const token = authHeader.substring(7);
  const host = request.headers.get('host') || '';
  const tokenVerify = await verifyFirebaseIdToken(token, { host });
  if (!tokenVerify.valid) {
    return NextResponse.json({ error: tokenVerify.error }, { status: 401, headers: getCorsHeaders(request) });
  }

  const payload = tokenVerify.decoded;
  const uid = payload.user_id || payload.sub;
  const adminUids = (process.env.ADMIN_UIDS || process.env.NEXT_PUBLIC_ADMIN_UIDS || '').split(',').map(u => u.trim()).filter(Boolean);
  const portalAccess = evaluateReviewPortalAccess(payload, { adminUids });
  if (!portalAccess.canEditReviews) {
    return NextResponse.json(
      { error: 'Chỉ tài khoản có vai trò Giáo viên (role: teacher) mới được phép chỉnh sửa hoặc cập nhật phiếu đồng ý.' },
      { status: 403, headers: getCorsHeaders(request) }
    );
  }
  const body = await request.json().catch(() => ({}));
  const {
    publicNameConsent = false,
    teacherDisplayName = '',
    subjects = [],
    institution = '',
    withdrawn = false,
    withdrawReason = ''
  } = body;

  const admin = getFirebaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Lỗi kết nối Firebase Admin.' }, { status: 500, headers: getCorsHeaders(request) });
  }

  const consentRecord = {
    teacherUid: uid,
    publicNameConsent: Boolean(publicNameConsent), // Mặc định false
    teacherDisplayName: publicNameConsent ? String(teacherDisplayName).trim().slice(0, 100) : null,
    subjects: Array.isArray(subjects) ? subjects : [],
    institution: String(institution).trim().slice(0, 150),
    termsAgreed: true,
    withdrawn: Boolean(withdrawn),
    withdrawReason: withdrawn ? String(withdrawReason).trim().slice(0, 500) : null,
    withdrawnAt: withdrawn ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString()
  };

  await admin.firestore().collection('teacher_consents').doc(uid).set(consentRecord, { merge: true });

  return NextResponse.json({
    success: true,
    consent: consentRecord,
    message: withdrawn ? 'Đã ghi nhận yêu cầu rút khỏi thẩm định.' : 'Đã lưu phiếu đồng ý tham gia thẩm định thành công.'
  }, { headers: getCorsHeaders(request) });
}
