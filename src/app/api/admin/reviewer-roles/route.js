import { NextResponse } from 'next/server';
import { getCorsHeaders, getClientIp, checkRateLimit } from '@/lib/serverSecurity';
import { verifyFirebaseIdToken, getFirebaseAdmin } from '@/lib/firebaseAdmin';

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/reviewer-roles
 * Quản lý & Phân quyền vai trò người dùng (Chỉ Admin mới có quyền gọi)
 * Hỗ trợ các vai trò: 'teacher' | 'admin' | 'student' | 'team_self'
 */
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
  const callerUid = payload.user_id || payload.sub;

  // 1. Kiểm tra quyền Admin của người gọi (Không dùng hardcoded email)
  const adminUids = (process.env.ADMIN_UIDS || process.env.NEXT_PUBLIC_ADMIN_UIDS || '').split(',').map(u => u.trim()).filter(Boolean);
  const isAdmin = payload.admin === true || payload.role === 'admin' || (callerUid && adminUids.includes(callerUid));

  if (!isAdmin) {
    return NextResponse.json({ error: 'Chỉ Quản trị viên (Admin) mới có quyền phân quyền người dùng.' }, { status: 403, headers: getCorsHeaders(request) });
  }

  // 2. Parse body
  const body = await request.json().catch(() => ({}));
  const {
    targetUid,
    targetEmail,
    role,
    reviewerType,
    subjects = ['toan'],
    isTeamMember = false
  } = body;

  if (!targetUid || typeof targetUid !== 'string') {
    return NextResponse.json({ error: 'Thiếu UID người dùng mục tiêu (targetUid).' }, { status: 400, headers: getCorsHeaders(request) });
  }

  // Chuẩn hóa vai trò mục tiêu
  const targetRole = role || reviewerType || 'teacher';

  const validRoles = ['teacher', 'admin', 'student', 'team_self'];
  if (!validRoles.includes(targetRole)) {
    return NextResponse.json({ error: `Vai trò không hợp lệ: "${targetRole}". Chỉ chấp nhận: ${validRoles.join(', ')}` }, { status: 400, headers: getCorsHeaders(request) });
  }

  // 3. QUY TẮC CỐT LÕI (PROMPT 0 & NHIỆM VỤ 1):
  // "Không bao giờ được cấp vai trò teacher cho thành viên nhóm."
  if (isTeamMember && targetRole === 'teacher') {
    return NextResponse.json({
      error: 'VI PHẠM QUY TẮC BẢO MẬT: Không bao giờ được cấp vai trò teacher cho thành viên nhóm.'
    }, { status: 400, headers: getCorsHeaders(request) });
  }

  const validSubjects = ['toan', 'ly', 'hoa', 'sinh'];
  const cleanSubjects = (Array.isArray(subjects) ? subjects : [subjects])
    .map(s => String(s).toLowerCase().trim())
    .filter(s => validSubjects.includes(s));

  if (targetRole === 'teacher' && cleanSubjects.length === 0) {
    return NextResponse.json({ error: 'Giáo viên cần được phân công ít nhất 1 môn học hợp lệ (toan, ly, hoa, sinh).' }, { status: 400, headers: getCorsHeaders(request) });
  }

  const admin = getFirebaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Lỗi khởi tạo Firebase Admin SDK.' }, { status: 500, headers: getCorsHeaders(request) });
  }

  // 4. Phân giải danh tính người dùng (Hỗ trợ tra cứu theo UID hoặc Email để chống lỗi lệch UID Firestore / Auth)
  try {
    let resolvedUid = targetUid;
    let authUserRecord = null;
    let existingClaims = {};

    // Bước 4.1: Thử tìm theo targetUid trong Auth
    try {
      authUserRecord = await admin.auth().getUser(targetUid);
      existingClaims = authUserRecord.customClaims || {};
      resolvedUid = authUserRecord.uid;
    } catch (authErr) {
      // Nếu không tìm thấy theo targetUid (code: auth/user-not-found)
      if (authErr.code === 'auth/user-not-found' || authErr.message?.includes('no user record')) {
        let emailToLookup = targetEmail;

        // Nếu client không gửi targetEmail, thử tìm trong Firestore doc users/{targetUid}
        if (!emailToLookup) {
          try {
            const userDoc = await admin.firestore().collection('users').doc(targetUid).get();
            if (userDoc.exists) {
              emailToLookup = userDoc.data()?.email;
            }
          } catch (_) {}
        }

        // Thử tìm theo Email trong Auth
        if (emailToLookup) {
          try {
            authUserRecord = await admin.auth().getUserByEmail(emailToLookup);
            existingClaims = authUserRecord.customClaims || {};
            resolvedUid = authUserRecord.uid;
          } catch (emailErr) {
            console.warn(`[ReviewerRoles] Không tìm thấy user trong Auth qua email:`, emailErr.message);
          }
        }
      } else {
        console.warn(`[ReviewerRoles] Lỗi getUser Auth:`, authErr.message);
      }
    }

    let newClaims = {};
    let firestoreUpdate = {
      updatedAt: new Date().toISOString()
    };

    if (targetRole === 'teacher') {
      newClaims = {
        ...existingClaims,
        role: 'teacher',
        reviewerType: 'teacher',
        subjects: cleanSubjects,
        isTeamMember: Boolean(isTeamMember)
      };
      firestoreUpdate = {
        ...firestoreUpdate,
        role: 'teacher',
        reviewerType: 'teacher',
        subjects: cleanSubjects,
        reviewSubjects: cleanSubjects,
        isTeamMember: Boolean(isTeamMember)
      };
    } else if (targetRole === 'admin') {
      newClaims = {
        ...existingClaims,
        admin: true,
        role: 'admin'
      };
      firestoreUpdate = {
        ...firestoreUpdate,
        role: 'admin'
      };
    } else if (targetRole === 'student') {
      newClaims = {
        role: 'student',
        admin: false,
        reviewerType: null,
        subjects: [],
        isTeamMember: false
      };
      firestoreUpdate = {
        ...firestoreUpdate,
        role: 'student',
        reviewerType: 'student',
        subjects: [],
        reviewSubjects: [],
        isTeamMember: false
      };
    } else if (targetRole === 'team_self') {
      newClaims = {
        ...existingClaims,
        role: 'team_self',
        reviewerType: 'team_self',
        isTeamMember: true
      };
      firestoreUpdate = {
        ...firestoreUpdate,
        role: 'team_self',
        reviewerType: 'team_self',
        isTeamMember: true
      };
    }

    // 5. Cập nhật Auth Custom Claims nếu tìm thấy Auth user
    let claimsUpdated = false;
    if (authUserRecord && resolvedUid) {
      try {
        await admin.auth().setCustomUserClaims(resolvedUid, newClaims);
        claimsUpdated = true;
      } catch (claimErr) {
        console.warn('[ReviewerRoles] Không thể setCustomUserClaims:', claimErr.message);
      }
    }

    // 6. Đồng bộ vào Firestore users/{targetUid}
    await admin.firestore().collection('users').doc(targetUid).set(firestoreUpdate, { merge: true });

    // Nếu resolvedUid từ Auth khác với targetUid trong Firestore, đồng bộ luôn cả document resolvedUid
    if (resolvedUid && resolvedUid !== targetUid) {
      try {
        await admin.firestore().collection('users').doc(resolvedUid).set(firestoreUpdate, { merge: true });
      } catch (_) {}
    }

    // 7. Ghi audit log bất biến vào admin_logs
    try {
      await admin.firestore().collection('admin_logs').add({
        action: 'UPDATE_USER_ROLE',
        targetUid,
        resolvedUid: resolvedUid || null,
        targetRole,
        performedBy: callerUid,
        previousClaims: existingClaims,
        newClaims,
        subjects: cleanSubjects,
        claimsUpdated,
        timestamp: new Date().toISOString()
      });
    } catch (logErr) {
      console.warn('[ReviewerRoles] Lỗi ghi audit log:', logErr.message);
    }

    return NextResponse.json({
      success: true,
      targetUid,
      resolvedUid,
      role: targetRole,
      reviewerType: newClaims.reviewerType || null,
      subjects: cleanSubjects,
      claimsUpdated,
      message: claimsUpdated
        ? `Đã cập nhật vai trò [${targetRole}] và Custom Claims thành công cho tài khoản!`
        : `Đã lưu vai trò [${targetRole}] vào Firestore (Lưu ý: Tài khoản chưa đăng ký Firebase Auth).`
    }, { headers: getCorsHeaders(request) });
  } catch (err) {
    console.error('[SetReviewerClaims] Lỗi:', err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: getCorsHeaders(request) });
  }
}
