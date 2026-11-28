import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCorsHeaders, getClientIdentifier, checkRateLimit } from '@/lib/serverSecurity';
import { verifyFirebaseIdToken, getSafetyFirestore } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

const LOCAL_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'lab-safety-reviews.json');

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

function normalizeReactionKey(equation = '', experimentTitle = '') {
  const eq = String(equation || '').toLowerCase().replace(/\s+/g, '').trim();
  if (eq && eq !== '(chưaghinhậnphươngtrình)' && eq !== '(yêucầuquaailabhóa)') return `eq:${eq}`;
  return `title:${String(experimentTitle || '').toLowerCase().replace(/\s+/g, ' ').trim()}`;
}

function readLocalReviews() {
  try {
    if (fs.existsSync(LOCAL_FILE_PATH)) {
      const raw = fs.readFileSync(LOCAL_FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.warn('[API lab-safety-reviews] Lỗi đọc local JSON:', err.message);
  }
  return [];
}

function writeLocalReviews(items) {
  try {
    const dir = path.dirname(LOCAL_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_FILE_PATH, JSON.stringify(items, null, 2), 'utf8');
  } catch (err) {
    console.warn('[API lab-safety-reviews] Cảnh báo ghi local JSON (serverless):', err.message);
  }
}

async function authenticateViewer(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Thiếu token xác thực.' };
  }
  const token = authHeader.substring(7);
  const host = request.headers.get('host') || '';
  const verified = await verifyFirebaseIdToken(token, { host });
  if (!verified.valid) {
    return { ok: false, status: 401, error: 'Token không hợp lệ hoặc đã hết hạn.' };
  }
  const payload = verified.decoded || {};
  const uid = payload.user_id || payload.sub || '';
  const adminUids = (process.env.ADMIN_UIDS || process.env.NEXT_PUBLIC_ADMIN_UIDS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const isAdmin = Boolean(payload.admin === true || payload.role === 'admin' || (uid && adminUids.includes(uid)));
  const isTeacher = Boolean(payload.role === 'teacher' || payload.reviewerType === 'teacher');
  const isJudge = Boolean(payload.isJudge === true || payload.reviewerType === 'judge');

  if (!isAdmin && !isTeacher && !isJudge) {
    return { ok: false, status: 403, error: 'Chỉ Giáo viên, Ban Giám Khảo hoặc Quản trị viên mới được xem mục Kiểm soát Thí nghiệm.' };
  }
  return { ok: true, uid, isAdmin, isTeacher, isJudge };
}

async function authenticateChemistryTeacherOrAdmin(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Thiếu token xác thực Giáo viên.' };
  }
  const token = authHeader.substring(7);
  const host = request.headers.get('host') || '';
  const verified = await verifyFirebaseIdToken(token, { host });
  if (!verified.valid) {
    return { ok: false, status: 401, error: 'Token không hợp lệ hoặc đã hết hạn.' };
  }
  const payload = verified.decoded || {};
  const uid = payload.user_id || payload.sub || '';
  const adminUids = (process.env.ADMIN_UIDS || process.env.NEXT_PUBLIC_ADMIN_UIDS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const isAdmin = Boolean(payload.admin === true || payload.role === 'admin' || (uid && adminUids.includes(uid)));
  const isTeacher = Boolean(payload.role === 'teacher' || payload.reviewerType === 'teacher');

  if (!isAdmin && !isTeacher) {
    return { ok: false, status: 403, error: 'Chỉ Giáo viên Hóa học hoặc Quản trị viên mới có quyền thẩm định.' };
  }

  // Cho phép toàn bộ Giáo viên Hóa học (subjects chứa 'hoa' hoặc chưa giới hạn môn nếu là GV)
  const subjects = Array.isArray(payload.subjects) ? payload.subjects.map(s => String(s).toLowerCase().trim()) : [];
  if (!isAdmin && subjects.length > 0 && !subjects.includes('hoa')) {
    return { ok: false, status: 403, error: 'Chỉ Giáo viên bộ môn Hóa học mới được chấm mục Kiểm soát Thí nghiệm Lab Hóa.' };
  }

  return { ok: true, uid, isAdmin, isTeacher };
}

async function loadAllReviews() {
  const now = Date.now();
  if (globalThis.__labSafetyCache && (now - globalThis.__labSafetyCache.ts) < 20000) {
    return { items: globalThis.__labSafetyCache.items, firestoreError: globalThis.__labSafetyCache.firestoreError || null };
  }

  const localItems = readLocalReviews();
  const map = new Map();
  localItems.forEach(item => { if (item?.id) map.set(item.id, item); });
  let firestoreError = null;

  try {
    const db = getSafetyFirestore();
    if (db) {
      const snap = await db.collection('lab_safety_reviews').get();
      snap.forEach(docSnap => {
        const d = docSnap.data();
        if (d && d.id) map.set(d.id, d);
      });
    }
  } catch (err) {
    firestoreError = err.message || 'Firestore read error';
    console.warn('[API lab-safety-reviews] Lỗi đọc Firestore:', firestoreError);
  }

  const sorted = Array.from(map.values()).sort((a, b) => {
    const revA = (a.teacherVerified === true && a.status === 'reviewed_by_teacher') ? 1 : 0;
    const revB = (b.teacherVerified === true && b.status === 'reviewed_by_teacher') ? 1 : 0;
    if (revA !== revB) return revA - revB;
    const tA = new Date(a.createdAt || 0).getTime();
    const tB = new Date(b.createdAt || 0).getTime();
    return tB - tA;
  });

  globalThis.__labSafetyCache = { ts: now, items: sorted, firestoreError };
  return { items: sorted, firestoreError };
}

export async function GET(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const { searchParams } = new URL(request.url);
    const publicOverrides = searchParams.get('publicOverrides') === 'true';
    const { items, firestoreError } = await loadAllReviews();

    if (publicOverrides) {
      const approved = items
        .filter(it => it.teacherVerified === true && it.status === 'reviewed_by_teacher')
        .map(it => ({
          id: it.id,
          reactionKey: it.reactionKey || normalizeReactionKey(it.equation, it.experimentTitle),
          editedExperimentTitle: it.editedExperimentTitle || it.experimentTitle,
          experimentTitle: it.editedExperimentTitle || it.experimentTitle,
          equation: it.editedEquation || it.equation,
          observation: it.editedObservation || it.observation,
          editedEffect: it.editedEffect || 'auto',
          originalEquation: it.equation,
          isDangerousVerdict: it.isDangerousVerdict,
          isReactionCorrect: it.isReactionCorrect,
          teacherNote: it.teacherNote || ''
        }));
      return NextResponse.json({ success: true, overrides: approved }, { status: 200, headers: corsHeaders });
    }

    const auth = await authenticateViewer(request);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status, headers: corsHeaders });
    }

    return NextResponse.json({
      success: true,
      totalCount: items.length,
      pendingCount: items.filter(it => it.status !== 'reviewed_by_teacher').length,
      quotaExhausted: Boolean(firestoreError && firestoreError.includes('RESOURCE_EXHAUSTED')),
      items
    }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('[API lab-safety-reviews] Lỗi GET:', err);
    return NextResponse.json({ success: false, error: 'Lỗi tải danh sách kiểm soát thí nghiệm.' }, { status: 500, headers: corsHeaders });
  }
}

function makeSafeDocId(reactionKey) {
  return 'rx_' + Buffer.from(String(reactionKey || 'unknown')).toString('base64url').slice(0, 64);
}

export async function POST(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const clientId = getClientIdentifier(request);
    const rate = checkRateLimit(`lab-safety-post:${clientId}`, 30, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ success: false, error: 'Gửi quá nhanh, vui lòng đợi.' }, { status: 429, headers: corsHeaders });
    }

    const body = await request.json().catch(() => ({}));
    const experimentTitle = String(body.experimentTitle || '').trim();
    const equation = String(body.equation || '').trim();
    if (!experimentTitle && !equation) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin thí nghiệm hoặc phản ứng.' }, { status: 400, headers: corsHeaders });
    }

    const reactionKey = normalizeReactionKey(equation, experimentTitle);
    const docId = makeSafeDocId(reactionKey);
    const db = getSafetyFirestore();
    const localList = readLocalReviews();

    // Kiểm tra nhanh 1 doc duy nhất thay vì quét toàn bộ collection
    let existingItem = localList.find(it =>
      it.id === docId || (it.reactionKey || normalizeReactionKey(it.equation, it.experimentTitle)) === reactionKey
    ) || null;

    if (db) {
      try {
        const docSnap = await db.collection('lab_safety_reviews').doc(docId).get();
        if (docSnap.exists) {
          existingItem = docSnap.data();
        }
      } catch (fsReadErr) {
        console.warn('[API lab-safety-reviews] Lỗi đọc 1 doc Firestore:', fsReadErr.message);
      }
    }

    if (existingItem && existingItem.teacherVerified === true && existingItem.status === 'reviewed_by_teacher') {
      return NextResponse.json({
        success: true,
        alreadyReviewed: true,
        item: existingItem
      }, { status: 200, headers: corsHeaders });
    }

    if (existingItem && existingItem.status === 'pending_review') {
      return NextResponse.json({
        success: true,
        deduplicated: true,
        item: existingItem
      }, { status: 200, headers: corsHeaders });
    }

    const now = new Date();
    const id = docId;
    const newItem = {
      id,
      reactionKey,
      experimentTitle: experimentTitle || 'Thí nghiệm hóa học chưa đặt tên',
      reactants: Array.isArray(body.reactants) ? body.reactants.map(String) : [],
      equation: equation || '(Chưa ghi nhận phương trình)',
      observation: String(body.observation || '').trim(),
      hazardLevel: Number(body.hazardLevel || 2),
      hazardType: String(body.hazardType || 'warning'),
      missingSafety: Array.isArray(body.missingSafety) ? body.missingSafety.map(String) : [],
      aiWarning: String(body.aiWarning || '').trim(),
      source: String(body.source || 'lab_hoa_auto'),
      studentName: String(body.studentName || 'Học sinh Lab Hóa').slice(0, 60),
      status: 'pending_review',
      teacherVerified: false,
      aiCannotApprove: true,
      isDangerousVerdict: null,
      isReactionCorrect: null,
      editedExperimentTitle: '',
      editedEquation: '',
      editedObservation: '',
      editedEffect: 'auto',
      teacherNote: '',
      createdAt: now.toISOString()
    };

    localList.unshift(newItem);
    writeLocalReviews(localList.slice(0, 500));
    globalThis.__labSafetyCache = null;

    if (db) {
      try {
        await db.collection('lab_safety_reviews').doc(id).set(newItem);
      } catch (fsErr) {
        console.warn('[API lab-safety-reviews] Ghi Firestore lỗi (đã lưu local):', fsErr.message);
      }
    }

    return NextResponse.json({ success: true, item: newItem }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('[API lab-safety-reviews] Lỗi POST:', err);
    return NextResponse.json({ success: false, error: 'Lỗi lưu phiếu thí nghiệm nguy hiểm.' }, { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const auth = await authenticateChemistryTeacherOrAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status, headers: corsHeaders });
    }

    const body = await request.json().catch(() => ({}));
    const id = String(body.id || '').trim();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID phiếu thí nghiệm.' }, { status: 400, headers: corsHeaders });
    }

    const db = getSafetyFirestore();
    const localList = readLocalReviews();
    let target = localList.find(it => it.id === id) || null;
    if (db) {
      try {
        const snap = await db.collection('lab_safety_reviews').doc(id).get();
        if (snap.exists) target = snap.data();
      } catch (fsErr) {
        console.warn('[API lab-safety-reviews] PATCH đọc 1 doc lỗi:', fsErr.message);
      }
    }
    if (!target) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy phiếu thí nghiệm.' }, { status: 404, headers: corsHeaders });
    }

    // CHỈ CHẤM 1 LẦN MÀ THÔI
    if (target.teacherVerified === true && target.status === 'reviewed_by_teacher') {
      return NextResponse.json({
        success: false,
        alreadyReviewed: true,
        error: 'Phản ứng/thí nghiệm này đã được Giáo viên Hóa chấm xong (chỉ chấm 1 lần).'
      }, { status: 409, headers: corsHeaders });
    }

    const validVerdicts = ['dangerous', 'warning', 'safe'];
    const isDangerousVerdict = validVerdicts.includes(body.isDangerousVerdict) ? body.isDangerousVerdict : 'dangerous';
    const isReactionCorrect = typeof body.isReactionCorrect === 'boolean' ? body.isReactionCorrect : true;

    const validEffects = ['auto', 'explosion', 'gas', 'burn', 'precipitate-color', 'none'];
    const editedEffect = validEffects.includes(body.editedEffect) ? body.editedEffect : 'auto';

    const patchData = {
      isDangerousVerdict,
      isReactionCorrect,
      editedExperimentTitle: String(body.editedExperimentTitle || '').trim(),
      editedEquation: String(body.editedEquation || '').trim(),
      editedObservation: String(body.editedObservation || '').trim(),
      editedEffect,
      teacherNote: String(body.teacherNote || '').trim(),
      status: 'reviewed_by_teacher',
      teacherVerified: true,
      reviewedByUid: auth.uid,
      reviewedAt: new Date().toISOString()
    };

    const idx = localList.findIndex(it => it.id === id);
    let updatedItem = { ...target, ...patchData };
    if (idx !== -1) {
      localList[idx] = updatedItem;
      writeLocalReviews(localList);
    }
    globalThis.__labSafetyCache = null;

    try {
      if (db) {
        await db.collection('lab_safety_reviews').doc(id).set(patchData, { merge: true });
      }
    } catch (fsErr) {
      console.warn('[API lab-safety-reviews] Cập nhật Firestore lỗi:', fsErr.message);
    }

    return NextResponse.json({ success: true, item: updatedItem }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('[API lab-safety-reviews] Lỗi PATCH:', err);
    return NextResponse.json({ success: false, error: 'Lỗi cập nhật thẩm định thí nghiệm.' }, { status: 500, headers: corsHeaders });
  }
}
