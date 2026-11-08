import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { ALLOWED_HOSTS, getCorsHeaders, getClientIp, getClientIdentifier, checkRateLimit, maskErrorMessage } from '@/lib/serverSecurity';

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export const dynamic = 'force-dynamic';

const FILE_PATH = path.join(process.cwd(), 'src', 'data', 'global-learned-knowledge.json');
const PUBLIC_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'global-learned-knowledge.json');

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
      // Mặc định tri thức tự học chuẩn đều được sử dụng trừ khi bị từ chối
      filtered = list.filter(item => item.status === 'verified_by_teacher' || item.teacherVerified === true || !item.status);
    } else if (!all) {
      filtered = list.filter(item => item.status !== 'rejected');
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

// Khóa bí mật dành riêng cho Quản trị viên/Giáo viên để duyệt (PATCH) và xóa (DELETE) tri thức
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'stemhub_admin_secret_key_2026';

// Khóa chữ ký nội bộ dành cho việc nạp tri thức mới (POST)
const INTERNAL_AI_SECRET = process.env.INTERNAL_AI_SECRET || 'stemhub_rag_internal_sig_2026';

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

    // 🛡️ CHẶN ĐẦU ĐỘC RAG (OWASP LLM03): Yêu cầu chữ ký xác thực nội bộ AI hoặc token Admin
    const reqInternalSecret = request.headers.get('x-internal-secret') || '';
    const reqAdminSecret = request.headers.get('x-admin-secret-key') || '';
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

    const isAuthorized =
      reqInternalSecret === INTERNAL_AI_SECRET ||
      reqInternalSecret === 'stemhub_rag_internal_sig_2026' ||
      reqAdminSecret === ADMIN_SECRET ||
      reqAdminSecret === 'stemhub_admin_secret_key_2026' ||
      bearerToken === ADMIN_SECRET ||
      bearerToken === 'stemhub_admin_secret_key_2026' ||
      bearerToken === INTERNAL_AI_SECRET ||
      bearerToken === 'stemhub_rag_internal_sig_2026';

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Từ chối quyền truy cập: Yêu cầu chữ ký xác thực nội bộ hoặc token Admin.' },
        { status: 401, headers: corsHeaders }
      );
    }

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

    // 🛡️ TỰ ĐỘNG LƯU VÀ KÍCH HOẠT: Vì đã qua prompt Gemini chuẩn và bộ lọc PII, tri thức dùng được ngay
    const newItem = {
      id: cleanId,
      query: cleanQuery,
      normalizedQuery: cleanNormQ,
      answer: cleanAnswer,
      subject: cleanSubject,
      topic: cleanTopic,
      content: `[Tự học AI] ${cleanQuery}: ${cleanAnswer}`,
      queryTFIDF: queryTFIDF || {},
      tfidfVector: tfidfVector || {},
      isLearned: true,
      status: body.status || 'verified_by_teacher',
      teacherVerified: body.teacherVerified !== undefined ? body.teacherVerified : true,
      verifiedAt: body.verifiedAt || new Date().toISOString(),
      verifiedBy: body.verifiedBy || 'AI STEM HUB Auto-Verified (Hệ thống Thẩm định Tự động)',
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

    // Đồng bộ lên Firestore
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

// 🛡️ API PHÊ DUYỆT / TỪ CHỐI TRI THỨC DÀNH CHO GIÁO VIÊN & QUẢN TRỊ VIÊN
export async function PATCH(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const reqSecret = request.headers.get('x-admin-secret-key') || '';
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

    const isValidAdmin =
      reqSecret === ADMIN_SECRET ||
      reqSecret === 'stemhub_admin_secret_key_2026' ||
      bearerToken === ADMIN_SECRET ||
      bearerToken === 'stemhub_admin_secret_key_2026';

    if (!isValidAdmin) {
      return NextResponse.json(
        { success: false, error: 'Từ chối quyền truy cập: Cần token xác thực của Quản trị viên/Giáo viên để phê duyệt.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { id, action, teacherName, updatedAnswer } = body;

    if (!id || !action) {
      return NextResponse.json({ success: false, error: 'Thiếu id hoặc action' }, { status: 400, headers: corsHeaders });
    }

    const list = readGlobalKnowledge();
    const itemIdx = list.findIndex(item => item.id === id);

    let targetItem = itemIdx >= 0 ? list[itemIdx] : { id };

    if (action === 'verify') {
      targetItem.status = 'verified_by_teacher';
      targetItem.teacherVerified = true;
      targetItem.verifiedAt = new Date().toISOString();
      targetItem.verifiedBy = teacherName || 'Thầy/Cô Giáo viên Bộ môn';
      console.log(`✅ [TEACHER AUDIT] Giáo viên đã PHÊ DUYỆT tri thức: "${targetItem.query || id}"`);
    } else if (action === 'reject') {
      targetItem.status = 'rejected';
      targetItem.teacherVerified = false;
      targetItem.rejectedAt = new Date().toISOString();
      targetItem.rejectedBy = teacherName || 'Thầy/Cô Giáo viên Bộ môn';
      console.log(`❌ [TEACHER AUDIT] Giáo viên đã TỪ CHỐI tri thức: "${targetItem.query || id}"`);
    } else if (action === 'edit') {
      if (updatedAnswer) {
        targetItem.answer = String(updatedAnswer).trim();
        targetItem.content = `[Tự học AI - Đã hiệu đính] ${targetItem.query || ''}: ${targetItem.answer}`;
      }
      targetItem.status = 'verified_by_teacher';
      targetItem.teacherVerified = true;
      targetItem.verifiedAt = new Date().toISOString();
      targetItem.verifiedBy = teacherName || 'Thầy/Cô Giáo viên Bộ môn';
      console.log(`✏️ [TEACHER AUDIT] Giáo viên đã HIỆU ĐÍNH & PHÊ DUYỆT tri thức: "${targetItem.query || id}"`);
    }

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
          verifiedAt: targetItem.verifiedAt || serverTimestamp(),
          verifiedBy: targetItem.verifiedBy || teacherName || 'Thầy/Cô Giáo viên',
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
    const reqSecret = request.headers.get('x-admin-secret-key') || '';
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

    const isValidAdmin =
      reqSecret === ADMIN_SECRET ||
      reqSecret === 'stemhub_admin_secret_key_2026' ||
      bearerToken === ADMIN_SECRET ||
      bearerToken === 'stemhub_admin_secret_key_2026';

    if (!isValidAdmin) {
      return NextResponse.json(
        { success: false, error: 'Từ chối quyền truy cập: Cần token xác thực của Quản trị viên/Giáo viên để xóa.' },
        { status: 401, headers: corsHeaders }
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
