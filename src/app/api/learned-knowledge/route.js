import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { ALLOWED_HOSTS, getCorsHeaders, getClientIp, getClientIdentifier, checkRateLimit, maskErrorMessage } from '@/lib/serverSecurity';
import { verifyFirebaseIdToken } from '@/lib/firebaseAdmin';

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export const dynamic = 'force-dynamic';

const FILE_PATH = path.join(process.cwd(), 'src', 'data', 'global-learned-knowledge.json');
const PUBLIC_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'global-learned-knowledge.json');
const AUDIT_LOG_PATH = path.join(process.cwd(), 'src', 'data', 'knowledge_audit_log.json');
const PUBLIC_AUDIT_LOG_PATH = path.join(process.cwd(), 'public', 'data', 'knowledge_audit_log.json');

function appendAuditLog(entry) {
  try {
    let logs = [];
    if (fs.existsSync(AUDIT_LOG_PATH)) {
      logs = JSON.parse(fs.readFileSync(AUDIT_LOG_PATH, 'utf8') || '[]');
    } else if (fs.existsSync(PUBLIC_AUDIT_LOG_PATH)) {
      logs = JSON.parse(fs.readFileSync(PUBLIC_AUDIT_LOG_PATH, 'utf8') || '[]');
    }
    logs.unshift({
      timestamp: new Date().toISOString(),
      ...entry
    });
    if (logs.length > 1000) logs.pop();

    const dir = path.dirname(AUDIT_LOG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(AUDIT_LOG_PATH, JSON.stringify(logs, null, 2), 'utf8');

    const pubDir = path.dirname(PUBLIC_AUDIT_LOG_PATH);
    if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });
    fs.writeFileSync(PUBLIC_AUDIT_LOG_PATH, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.warn('[API learned-knowledge] Ghi audit log lỗi:', err.message);
  }
}

function readGlobalKnowledge() {
  try {
    if (fs.existsSync(FILE_PATH)) {
      const raw = fs.readFileSync(FILE_PATH, 'utf8');
      return JSON.parse(raw || '[]');
    }
    if (fs.existsSync(PUBLIC_FILE_PATH)) {
      const raw = fs.readFileSync(PUBLIC_FILE_PATH, 'utf8');
      return JSON.parse(raw || '[]');
    }
    return [];
  } catch (err) {
    console.error('[API learned-knowledge] Lỗi đọc file tri thức toàn cục:', err);
    return [];
  }
}

function writeGlobalKnowledge(data) {
  try {
    const dir = path.dirname(FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');

    const pubDir = path.dirname(PUBLIC_FILE_PATH);
    if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });
    fs.writeFileSync(PUBLIC_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('[API learned-knowledge] Cảnh báo ghi file (môi trường serverless / read-only):', err.message);
  }
}

export async function GET(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    let list = readGlobalKnowledge();
    const { searchParams } = new URL(request.url);
    const onlyVerified = searchParams.get('onlyVerified') === 'true';
    const all = searchParams.get('all') === 'true';
    const limitCount = parseInt(searchParams.get('limit') || '100', 10);

    // Đồng bộ thêm dữ liệu tri thức từ Firestore nếu có
    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'learned_knowledge'));
        const firestoreDocs = [];
        querySnapshot.forEach(docSnap => {
          const d = docSnap.data();
          if (d && d.id) firestoreDocs.push(d);
        });
        if (firestoreDocs.length > 0) {
          const map = new Map();
          firestoreDocs.forEach(item => map.set(item.id, item));
          list.forEach(item => {
            if (!map.has(item.id)) map.set(item.id, item);
          });
          list = Array.from(map.values());
        }
      } catch (e) {
        console.warn('[API learned-knowledge] Firestore sync warning:', e.message);
      }
    }

    let filtered = list;
    if (onlyVerified) {
      // Bắt buộc tri thức phải được giáo viên thẩm định thật, không bị cách ly và không phải dữ liệu DEMO
      filtered = list.filter(item => (item.status === 'verified_by_teacher' || item.teacherVerified === true) && !item.quarantined && !item.isDemo);
    } else if (!all) {
      filtered = list.filter(item => (item.status === 'verified_by_teacher' || item.teacherVerified === true) && !item.quarantined && !item.isDemo);
    }

    // 🛡️ PHÂN QUYỀN MÔN THEO CUSTOM CLAIMS (Trừ Admin, Giáo viên chỉ thấy câu hỏi môn được cấp quyền)
    const authHeader = request.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      const bearerToken = authHeader.substring(7);
      const host = request.headers.get('host') || '';
      const tokenResult = await verifyFirebaseIdToken(bearerToken, { host });
      if (tokenResult.valid) {
        const payload = tokenResult.decoded;
        const uid = payload.user_id || payload.sub;
        const adminUids = (process.env.ADMIN_UIDS || process.env.NEXT_PUBLIC_ADMIN_UIDS || '').split(',').map(u => u.trim()).filter(Boolean);
        const isAdmin = Boolean(payload.admin === true || payload.role === 'admin' || (uid && adminUids.includes(uid)));
        const isTeacher = Boolean(payload.role === 'teacher' || payload.reviewerType === 'teacher');
        
        // Nếu là giáo viên và không phải admin: bắt buộc lọc theo danh sách môn được phân công
        if (!isAdmin && isTeacher) {
          const authorizedSubjects = (Array.isArray(payload.subjects) ? payload.subjects : [])
            .map(s => String(s).toLowerCase().trim())
            .filter(Boolean);
          
          if (authorizedSubjects.length > 0) {
            filtered = filtered.filter(item => authorizedSubjects.includes((item.subject || '').toLowerCase()));
          } else {
            // Chưa được phân môn nào -> Không trả về câu hỏi môn nào
            filtered = [];
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalCount: filtered.length,
      learnedDocs: filtered.slice(0, limitCount)
    }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('[API learned-knowledge] Lỗi GET:', err);
    return NextResponse.json({ success: false, error: 'Lỗi tải tri thức' }, { status: 500, headers: corsHeaders });
  }
}

function isChitchatOrGreeting(text) {
  if (!text) return true;
  const t = text.trim().toLowerCase();
  if (t.length <= 2) return true;
  const greetingRegex = /^(xin\s+)?(chào|chao|hello|hi|hey|alo|halo)(\s+(bạn|ban|thầy|thay|cô|co|nova|bot|ad|admin|ê))?[!.,?~]*$/i;
  if (greetingRegex.test(t)) return true;
  const q = t.replace(/[?.,!~]/g, '');
  if (q.includes('bạn là ai') || q.includes('tôi là ai') || q.includes('nhớ gì về tôi')) return true;
  if (q.includes('bạn có thể làm') || q.includes('bạn cs thể làm') || q.includes('làm đc cái gì')) return true;
  if (q.startsWith('đưa tôi qua') || q.startsWith('qua lab') || q.startsWith('mở lab')) return true;
  return false;
}

export async function POST(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const clientId = getClientIdentifier(request);
    // Rate limit: Tối đa 80 lượt gửi tri thức / phút trên mỗi định danh học sinh / IP
    const rateCheck = checkRateLimit(`learned-knowledge:${clientId}`, 80, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Bạn gửi dữ liệu quá nhanh. Vui lòng đợi ${rateCheck.resetInSec} giây trước khi gửi tiếp.` },
        { status: 429, headers: corsHeaders }
      );
    }

    // 🛡️ CHẶN ĐẦU ĐỘC RAG (OWASP LLM03): Chỉ chấp nhận người dùng đã đăng nhập có Firebase Bearer ID Token hợp lệ
    // Đã loại bỏ hoàn toàn việc dùng khóa chia sẻ (Fail-Closed)
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

    if (!bearerToken) {
      return NextResponse.json(
        { success: false, error: 'Từ chối quyền truy cập: Yêu cầu đăng nhập với Firebase Bearer ID Token hợp lệ.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const tokenResult = await verifyFirebaseIdToken(bearerToken);
    if (!tokenResult.valid) {
      return NextResponse.json(
        { success: false, error: tokenResult.error || 'Từ chối quyền truy cập: Token xác thực không hợp lệ.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const userPayload = tokenResult.decoded || {};
    const authenticatedUid = userPayload.user_id || userPayload.sub || userPayload.uid || 'authenticated_user';

    const body = await request.json().catch(() => ({}));
    const { id, query, normalizedQuery, answer, subject, topic, queryTFIDF, tfidfVector, createdAt } = body;

    if (!query || !answer || typeof query !== 'string' || typeof answer !== 'string') {
      return NextResponse.json({ success: false, error: 'Dữ liệu tri thức không hợp lệ' }, { status: 400, headers: corsHeaders });
    }

    const cleanQuery = query.trim();
    const cleanAnswer = answer.trim();

    if (cleanQuery.length < 3 || cleanQuery.length > 500) {
      return NextResponse.json({ success: false, error: 'Độ dài câu hỏi không hợp lệ (từ 3 đến 500 ký tự).' }, { status: 400, headers: corsHeaders });
    }

    if (cleanAnswer.length < 10 || cleanAnswer.length > 5000) {
      return NextResponse.json({ success: false, error: 'Độ dài câu trả lời không hợp lệ (từ 10 đến 5.000 ký tự).' }, { status: 400, headers: corsHeaders });
    }

    if (isChitchatOrGreeting(cleanQuery)) {
      return NextResponse.json({ success: false, error: 'Bỏ qua câu chào hỏi / xã giao' }, { status: 400, headers: corsHeaders });
    }

    const cleanSubject = (subject || 'stem').toLowerCase();
    const cleanTopic = topic || 'Tri thức tự học AI toàn hệ thống';
    const cleanNormQ = normalizedQuery || cleanQuery.toLowerCase();
    const cleanId = id || `learned_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // 🛡️ BẢO VỆ RAG (Quy tắc trung thực): Tri thức mới nạp mặc định pending, không vào RAG khi chưa qua giáo viên duyệt
    const isDemoRecord = Boolean(body.isDemo || false);
    const newItem = {
      id: cleanId,
      query: cleanQuery,
      normalizedQuery: cleanNormQ,
      answer: cleanAnswer,
      subject: cleanSubject,
      topic: cleanTopic,
      sourceType: body.sourceType || 'student_query',
      isDemo: isDemoRecord,
      content: `[Chờ giáo viên duyệt] ${cleanQuery}: ${cleanAnswer}`,
      queryTFIDF: queryTFIDF || {},
      tfidfVector: tfidfVector || {},
      isLearned: true,
      status: 'pending_review',
      teacherVerified: false,
      quarantined: false,
      verifiedAt: null,
      verifiedBy: null,
      verifiedByUid: null,
      verifiedByEmail: null,
      createdAt: createdAt || new Date().toISOString()
    };

    const list = readGlobalKnowledge();
    const existingIdx = list.findIndex(item => item.id === cleanId || item.normalizedQuery === cleanNormQ);

    if (existingIdx >= 0) {
      list[existingIdx] = newItem;
    } else {
      list.unshift(newItem);
    }

    if (list.length > 5000) list.pop();
    writeGlobalKnowledge(list);

    // Ghi nhận Audit Log cho tri thức mới nộp
    appendAuditLog({
      action: 'student_submit_knowledge',
      itemId: cleanId,
      subject: cleanSubject,
      querySnippet: cleanQuery.substring(0, 80),
      operator: authenticatedUid || clientId || 'student',
      status: 'pending_review'
    });

    // Đồng bộ lên Firestore với trạng thái pending
    if (db) {
      try {
        const docRef = doc(collection(db, 'learned_knowledge'), cleanId);
        await setDoc(docRef, newItem, { merge: true });
      } catch (dbErr) {
        console.warn('[POST Firestore Sync] Warning:', dbErr.message);
      }
    }

    return NextResponse.json({ success: true, item: newItem }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('[API learned-knowledge] Lỗi POST:', err);
    return NextResponse.json({ success: false, error: maskErrorMessage(err, 'Lỗi lưu trữ tri thức.') }, { status: 500, headers: corsHeaders });
  }
}

// 🛡️ XÁC THỰC DANH TÍNH & VAI TRÒ NGƯỜI DUYỆT TỪ TOKEN (YÊU CẦU CLAIMS-ONLY & FAIL-CLOSED)
// Đã loại bỏ hoàn toàn kiểm tra khóa chia sẻ, chỉ chấp nhận Bearer ID token Firebase Admin
async function authenticateReviewer(request) {
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

  if (!bearerToken) {
    return {
      authorized: false,
      error: 'Từ chối quyền truy cập: Cần Bearer ID token của Quản trị viên hoặc Giáo viên để phê duyệt.',
      status: 401
    };
  }

  // Xác thực Firebase Auth ID Token (Fail-Closed)
  const tokenResult = await verifyFirebaseIdToken(bearerToken);
  if (!tokenResult.valid) {
    return {
      authorized: false,
      error: tokenResult.error || 'Token xác thực không hợp lệ',
      status: tokenResult.status || 401
    };
  }

  const payload = tokenResult.decoded;
  const uid = payload.user_id || payload.sub || payload.uid;
  const email = payload.email || '';
  let role = '';

  // Quyền Admin qua Custom Claims hoặc Biến môi trường Admin UID
  const adminUids = (process.env.ADMIN_UIDS || '').split(',').map(u => u.trim()).filter(Boolean);
  const hasAdminClaim = Boolean(payload.admin === true || payload.role === 'admin');
  const isUidWhitelisted = uid && adminUids.includes(uid);
  if (hasAdminClaim || isUidWhitelisted) {
    role = 'admin';
  } else if (payload.reviewerType === 'teacher' || payload.role === 'teacher') {
    role = 'teacher';
  }

  if (role === 'admin' || role === 'teacher') {
    return {
      authorized: true,
      role,
      uid,
      email,
      displayName: payload.name || (email ? email.split('@')[0] : `User_${uid.slice(0, 6)}`)
    };
  }

  return {
    authorized: false,
    error: 'Từ chối quyền: Tài khoản không có vai trò Giáo viên (teacher) hoặc Quản trị viên (admin).',
    status: 403
  };
}

// 🛡️ API PHÊ DUYỆT / TỪ CHỐI TRI THỨC DÀNH CHO GIÁO VIÊN & QUẢN TRỊ VIÊN
export async function PATCH(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const reviewerAuth = await authenticateReviewer(request);
    if (!reviewerAuth.authorized) {
      return NextResponse.json(
        { success: false, error: reviewerAuth.error },
        { status: reviewerAuth.status || 403, headers: corsHeaders }
      );
    }
    const reviewer = reviewerAuth;

    const body = await request.json().catch(() => ({}));
    const { id, action, updatedAnswer } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Thiếu action' }, { status: 400, headers: corsHeaders });
    }

    const approver = reviewer.displayName;
    const list = readGlobalKnowledge();
    const now = new Date().toISOString();

    // ⚡ XỬ LÝ PHÊ DUYỆT HÀNG LOẠT (BATCH VERIFY ALL)
    if (action === 'verify_all') {
      let updatedCount = 0;

      list.forEach(item => {
        if (item.status !== 'rejected') {
          item.status = 'verified_by_teacher';
          item.teacherVerified = true;
          item.quarantined = false;
          item.verifiedAt = item.verifiedAt || now;
          item.verifiedBy = approver;
          item.verifiedByUid = reviewer.uid;
          item.verifiedByEmail = reviewer.email;
          updatedCount++;
        }
      });
      writeGlobalKnowledge(list);

      appendAuditLog({
        action: 'teacher_batch_verify_all',
        reviewerUid: reviewer.uid,
        reviewerEmail: reviewer.email,
        reviewerRole: reviewer.role,
        operator: approver,
        count: updatedCount,
        timestamp: now
      });

      // Cập nhật đồng bộ Firestore
      if (db) {
        try {
          const querySnapshot = await getDocs(collection(db, 'learned_knowledge'));
          const updatePromises = [];
          querySnapshot.forEach(docSnap => {
            const d = docSnap.data();
            if (d && d.id && d.status !== 'rejected') {
              updatePromises.push(setDoc(docSnap.ref, {
                status: 'verified_by_teacher',
                teacherVerified: true,
                quarantined: false,
                verifiedAt: d.verifiedAt || now,
                verifiedBy: approver,
                verifiedByUid: reviewer.uid,
                verifiedByEmail: reviewer.email
              }, { merge: true }));
            }
          });
          await Promise.all(updatePromises);
        } catch (dbErr) {
          console.warn('[PATCH verify_all Firestore Sync] Warning:', dbErr.message);
        }
      }

      console.log(`⚡ [TEACHER AUDIT BATCH] Đã phê duyệt hàng loạt ${updatedCount} mục tri thức bởi ${approver} (${reviewer.uid})`);
      return NextResponse.json({ 
        success: true, 
        message: `Đã phê duyệt thành công ${updatedCount} tri thức bởi giáo viên ${approver}!`,
        count: updatedCount 
      }, { status: 200, headers: corsHeaders });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu id bản ghi' }, { status: 400, headers: corsHeaders });
    }

    const itemIdx = list.findIndex(item => item.id === id);
    let targetItem = itemIdx >= 0 ? list[itemIdx] : { id };

    const beforeState = {
      status: targetItem.status || 'pending_review',
      teacherVerified: Boolean(targetItem.teacherVerified),
      answer: targetItem.answer || ''
    };

    if (action === 'verify') {
      targetItem.status = 'verified_by_teacher';
      targetItem.teacherVerified = true;
      targetItem.quarantined = false;
      targetItem.verifiedAt = now;
      targetItem.verifiedBy = approver;
      targetItem.verifiedByUid = reviewer.uid;
      targetItem.verifiedByEmail = reviewer.email;
    } else if (action === 'reject') {
      targetItem.status = 'rejected';
      targetItem.teacherVerified = false;
      targetItem.quarantined = true;
      targetItem.rejectedAt = now;
      targetItem.rejectedBy = approver;
      targetItem.rejectedByUid = reviewer.uid;
      targetItem.rejectedByEmail = reviewer.email;
    } else if (action === 'edit') {
      if (updatedAnswer) {
        targetItem.answer = String(updatedAnswer).trim();
        targetItem.content = `[Giáo viên hiệu đính] ${targetItem.query || ''}: ${targetItem.answer}`;
      }
      targetItem.sourceType = 'teacher_verified_stem';
      targetItem.status = 'verified_by_teacher';
      targetItem.teacherVerified = true;
      targetItem.quarantined = false;
      targetItem.verifiedAt = now;
      targetItem.verifiedBy = approver;
      targetItem.verifiedByUid = reviewer.uid;
      targetItem.verifiedByEmail = reviewer.email;
    }

    const afterState = {
      status: targetItem.status,
      teacherVerified: targetItem.teacherVerified,
      answer: targetItem.answer || ''
    };

    appendAuditLog({
      action: `teacher_${action}_single`,
      reviewerUid: reviewer.uid,
      reviewerEmail: reviewer.email,
      reviewerRole: reviewer.role,
      operator: approver,
      itemId: id,
      timestamp: now,
      querySnippet: (targetItem.query || id).substring(0, 80),
      beforeState,
      afterState
    });

    if (itemIdx >= 0) {
      list[itemIdx] = targetItem;
    } else {
      list.unshift(targetItem);
    }
    writeGlobalKnowledge(list);

    // Đồng bộ lên Firestore
    if (db) {
      try {
        const docRef = doc(collection(db, 'learned_knowledge'), id);
        await setDoc(docRef, {
          id,
          status: targetItem.status,
          teacherVerified: targetItem.teacherVerified,
          quarantined: targetItem.quarantined || false,
          verifiedAt: targetItem.verifiedAt || serverTimestamp(),
          verifiedBy: approver,
          verifiedByUid: reviewer.uid,
          verifiedByEmail: reviewer.email,
          ...(targetItem.rejectedAt ? { rejectedAt: targetItem.rejectedAt } : {}),
          ...(targetItem.rejectedBy ? { rejectedBy: targetItem.rejectedBy } : {}),
          ...(action === 'edit' && updatedAnswer ? { answer: targetItem.answer, content: targetItem.content } : {})
        }, { merge: true });
      } catch (dbErr) {
        console.warn('[PATCH Firestore Sync] Warning:', dbErr.message);
      }
    }

    return NextResponse.json({ success: true, item: targetItem }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('[API learned-knowledge] Lỗi PATCH:', err);
    return NextResponse.json({ success: false, error: maskErrorMessage(err, 'Lỗi cập nhật trạng thái tri thức.') }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const authRes = await authenticateReviewer(request);
    if (!authRes.authorized || authRes.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: authRes.error || 'Từ chối quyền truy cập: Cần token xác thực của Quản trị viên để xóa.' },
        { status: authRes.status || 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu id tri thức cần xóa' }, { status: 400, headers: corsHeaders });
    }

    const list = readGlobalKnowledge();
    const updated = list.filter(item => item.id !== id);
    writeGlobalKnowledge(updated);

    appendAuditLog({
      action: 'admin_delete_knowledge',
      operator: 'admin',
      itemId: id
    });

    if (db) {
      try {
        const docRef = doc(collection(db, 'learned_knowledge'), id);
        await deleteDoc(docRef);
      } catch (dbErr) {
        console.warn('[DELETE Firestore Sync] Warning:', dbErr.message);
      }
    }

    return NextResponse.json({ success: true, message: `Đã xóa tri thức ID ${id}` }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('[API learned-knowledge] Lỗi DELETE:', err);
    return NextResponse.json({ success: false, error: maskErrorMessage(err, 'Lỗi xóa tri thức.') }, { status: 500, headers: corsHeaders });
  }
}
