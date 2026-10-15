import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ALLOWED_HOSTS, getCorsHeaders, getClientIp, checkRateLimit, maskErrorMessage } from '@/lib/serverSecurity';

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
    console.error('[API learned-knowledge] Lỗi ghi file tri thức toàn cục:', err);
  }
}

export async function GET(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const list = readGlobalKnowledge();
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('all') === 'true' || searchParams.get('includePending') === 'true';

    // 🛡️ CHỈ TRẢ VỀ CÁC TRI THỨC ĐÃ ĐƯỢC GIÁO VIÊN PHÊ DUYỆT CHO CLIENT HỌC SINH (YÊU CẦU 1)
    const filteredDocs = includeAll
      ? list
      : list.filter(item => item.status === 'verified_by_teacher' || item.teacherVerified === true);

    return NextResponse.json(
      { 
        success: true, 
        count: filteredDocs.length, 
        totalInStorage: list.length,
        learnedDocs: filteredDocs 
      },
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: maskErrorMessage(err, 'Lỗi đọc dữ liệu tri thức.') },
      { status: 500, headers: corsHeaders }
    );
  }
}

const FORBIDDEN_PERSONAL_KEYWORDS = [
  'nguyễn minh khang', 'nguyen minh khang', 'hồ hoàng anh', 'ho hoang anh',
  'bạn chính là', 'bạn đang ở', 'apprentice', 'tinh thể', 'elo', 'lv.', 'level', 'danh hiệu',
  'phiên trò chuyện trước', 'bộ nhớ học hỏi', 'học sinh đã từng hỏi',
  'tôi là ai', 'nhớ gì về tôi', 'bạn có thể làm gì', 'bạn cs thể làm',
  'đưa tôi qua lab', 'qua lab', 'chuyển sang phần mô phỏng', 'admin'
];

function isPersonalOrGreeting(query, answer) {
  const text = ((query || '') + ' ' + (answer || '')).toLowerCase();
  if (FORBIDDEN_PERSONAL_KEYWORDS.some(kw => text.includes(kw))) return true;
  const q = (query || '').trim().toLowerCase();
  if (q.length <= 2) return true;
  const greetingRegex = /^(xin\s+)?(chào|chao|hello|hi|hey|alo|halo)(\s+(bạn|ban|thầy|thay|cô|co|nova|bot|ad|admin|ê))?[!.,?~]*$/i;
  if (greetingRegex.test(q)) return true;
  if (q.includes('bạn là ai') || q.includes('tôi là ai') || q.includes('nhớ gì về tôi')) return true;
  if (q.includes('bạn có thể làm') || q.includes('bạn cs thể làm') || q.includes('làm đc cái gì')) return true;
  if (q.startsWith('đưa tôi qua') || q.startsWith('qua lab') || q.startsWith('mở lab')) return true;
  return false;
}

const INTERNAL_AI_SECRET = process.env.INTERNAL_AI_SECRET || process.env.ADMIN_SECRET_KEY || 'stemhub_rag_internal_sig_2026';

export async function POST(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const ip = getClientIp(request);
    // Rate limit: Tối đa 20 lượt gửi tri thức / phút trên mỗi IP
    const rateCheck = checkRateLimit(`learned-knowledge:${ip}`, 20, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Bạn gửi dữ liệu quá nhanh. Vui lòng đợi ${rateCheck.resetInSec} giây trước khi gửi tiếp.` },
        { status: 429, headers: corsHeaders }
      );
    }

    // 🛡️ CHẶN ĐẦU ĐỘC RAG (OWASP LLM03): Yêu cầu chữ ký xác thực nội bộ AI hoặc token Admin
    const reqSecret = request.headers.get('x-internal-secret') || request.headers.get('x-admin-secret-key') || '';
    const authHeader = request.headers.get('authorization') || '';
    const isAuthBearer = authHeader.startsWith('Bearer ') && authHeader.substring(7) === INTERNAL_AI_SECRET;

    if (reqSecret !== INTERNAL_AI_SECRET && !isAuthBearer) {
      return NextResponse.json(
        { success: false, error: 'Từ chối quyền truy cập: Cần chữ ký nội bộ AI hoặc token xác thực của Quản trị viên.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { id, query, normalizedQuery, answer, subject, topic, queryTFIDF, tfidfVector, createdAt } = body;
    const effectiveQuery = query || body.question;

    if (!effectiveQuery || !answer) {
      return NextResponse.json({ success: false, error: 'Thiếu query hoặc answer' }, { status: 400, headers: corsHeaders });
    }

    const cleanQ = String(effectiveQuery).trim();
    const cleanA = String(answer).trim();

    if (cleanQ.length > 500) {
      return NextResponse.json({ success: false, error: 'Câu hỏi quá dài (tối đa 500 ký tự)' }, { status: 400, headers: corsHeaders });
    }

    if (cleanA.length > 5000) {
      return NextResponse.json({ success: false, error: 'Câu trả lời quá dài (tối đa 5000 ký tự)' }, { status: 400, headers: corsHeaders });
    }

    // 🛡️ SANITIZATION: Chống XSS & chèn thẻ mã HTML độc hại
    const dangerousHtmlRegex = /<(script|iframe|object|embed|form|input|button|svg|link|style|meta)[^>]*>/i;
    if (dangerousHtmlRegex.test(cleanA) || dangerousHtmlRegex.test(cleanQ) || /javascript:/i.test(cleanA) || /onerror\s*=/i.test(cleanA) || /onload\s*=/i.test(cleanA)) {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu bị từ chối: Phát hiện thẻ HTML hoặc mã thực thi script không an toàn.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 🛡️ SANITIZATION: Chống lừa đảo qua link URL ngoài danh sách cho phép
    const foundUrls = (cleanA + ' ' + cleanQ).match(/https?:\/\/[^\s"'<>]+/gi) || [];
    for (const rawUrl of foundUrls) {
      try {
        const parsed = new URL(rawUrl);
        if (!ALLOWED_HOSTS.includes(parsed.host)) {
          return NextResponse.json(
            { success: false, error: 'Dữ liệu bị từ chối: Phát hiện đường link ngoài danh sách tên miền cho phép.' },
            { status: 400, headers: corsHeaders }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, error: 'Dữ liệu bị từ chối: URL không đúng định dạng.' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // ⚡ CHẶN LƯU THÔNG TIN CÁ NHÂN HOẶC CÂU CHÀO HỎI
    if (isPersonalOrGreeting(cleanQ, cleanA)) {
      console.log(`[API learned-knowledge] Từ chối lưu nội dung cá nhân/chào hỏi: "${cleanQ}"`);
      return NextResponse.json({ success: false, ignored: true, message: 'Nội dung cá nhân hoặc chào hỏi không được lưu trữ' }, { status: 200, headers: corsHeaders });
    }

    const list = readGlobalKnowledge();

    const existingIdx = list.findIndex(
      item => item.query && (
        item.query.toLowerCase() === cleanQ.toLowerCase() ||
        (normalizedQuery && item.normalizedQuery === normalizedQuery)
      )
    );

    const newItem = {
      id: id || `learned_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      query: cleanQ,
      normalizedQuery: normalizedQuery || cleanQ.toLowerCase(),
      answer: cleanA,
      subject: subject || 'stem',
      topic: topic || 'Tri thức tự học AI toàn hệ thống',
      content: `[Tự học AI] ${cleanQ}: ${cleanA}`,
      queryTFIDF: queryTFIDF || {},
      tfidfVector: tfidfVector || {},
      isLearned: true,
      // 🛡️ YÊU CẦU 1 (KIỂM DUYỆT CỦA GIÁO VIÊN TRƯỚC KHI TÁI SỬ DỤNG CACHE):
      // Mọi câu trả lời mới mặc định gán 'pending_review' và teacherVerified: false
      // Tuyệt đối không cho phép trả về làm Cache Hit cho học sinh khác khi chưa có phê duyệt
      status: 'pending_review',
      teacherVerified: false,
      verifiedAt: null,
      verifiedBy: null,
      createdAt: createdAt || new Date().toISOString()
    };

    if (existingIdx >= 0) {
      // Giữ nguyên trạng thái thẩm định nếu đã từng duyệt
      if (list[existingIdx].status === 'verified_by_teacher') {
        newItem.status = 'verified_by_teacher';
        newItem.teacherVerified = true;
        newItem.verifiedAt = list[existingIdx].verifiedAt;
        newItem.verifiedBy = list[existingIdx].verifiedBy;
      }
      list[existingIdx] = newItem;
    } else {
      list.unshift(newItem);
    }

    // Giới hạn tối đa 5000 tri thức toàn hệ thống
    if (list.length > 5000) list.pop();

    writeGlobalKnowledge(list);

    console.log(`🧠 [GLOBAL LEARNING DB SERVER] Đã ghi nạp tri thức học thuật mới (Trạng thái: pending_review): "${cleanQ}" (Tổng số: ${list.length})`);

    return NextResponse.json({ success: true, item: newItem, totalCount: list.length }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('[API learned-knowledge] Lỗi POST:', err);
    return NextResponse.json({ success: false, error: maskErrorMessage(err, 'Lỗi ghi nhận tri thức.') }, { status: 500, headers: corsHeaders });
  }
}

// 🛡️ API PHÊ DUYỆT / TỪ CHỐI TRI THỨC DÀNH CHO GIÁO VIÊN & QUẢN TRỊ VIÊN
export async function PATCH(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const body = await request.json().catch(() => ({}));
    const { id, action, teacherName, updatedAnswer } = body;

    if (!id || !action) {
      return NextResponse.json({ success: false, error: 'Thiếu id hoặc action' }, { status: 400, headers: corsHeaders });
    }

    const list = readGlobalKnowledge();
    const itemIdx = list.findIndex(item => item.id === id);

    if (itemIdx === -1) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bản ghi tri thức' }, { status: 404, headers: corsHeaders });
    }

    const targetItem = list[itemIdx];

    if (action === 'verify') {
      targetItem.status = 'verified_by_teacher';
      targetItem.teacherVerified = true;
      targetItem.verifiedAt = new Date().toISOString();
      targetItem.verifiedBy = teacherName || 'Thầy/Cô Giáo viên Bộ môn';
      console.log(`✅ [TEACHER AUDIT] Giáo viên đã PHÊ DUYỆT tri thức: "${targetItem.query}" (Kích hoạt Cache Hit)`);
    } else if (action === 'reject') {
      targetItem.status = 'rejected';
      targetItem.teacherVerified = false;
      targetItem.rejectedAt = new Date().toISOString();
      targetItem.rejectedBy = teacherName || 'Thầy/Cô Giáo viên Bộ môn';
      console.log(`❌ [TEACHER AUDIT] Giáo viên đã TỪ CHỐI tri thức: "${targetItem.query}"`);
    } else if (action === 'edit') {
      if (updatedAnswer) {
        targetItem.answer = String(updatedAnswer).trim();
        targetItem.content = `[Tự học AI - Đã hiệu đính] ${targetItem.query}: ${targetItem.answer}`;
      }
      targetItem.status = 'verified_by_teacher';
      targetItem.teacherVerified = true;
      targetItem.verifiedAt = new Date().toISOString();
      targetItem.verifiedBy = teacherName || 'Thầy/Cô Giáo viên Bộ môn';
      console.log(`✏️ [TEACHER AUDIT] Giáo viên đã HIỆU ĐÍNH & PHÊ DUYỆT tri thức: "${targetItem.query}"`);
    }

    list[itemIdx] = targetItem;
    writeGlobalKnowledge(list);

    return NextResponse.json({ success: true, item: targetItem }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('[API learned-knowledge] Lỗi PATCH:', err);
    return NextResponse.json({ success: false, error: maskErrorMessage(err, 'Lỗi cập nhật trạng thái tri thức.') }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu id' }, { status: 400, headers: corsHeaders });
    }

    let list = readGlobalKnowledge();
    const prevLen = list.length;
    list = list.filter(item => item.id !== id);

    if (list.length === prevLen) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bản ghi' }, { status: 404, headers: corsHeaders });
    }

    writeGlobalKnowledge(list);
    return NextResponse.json({ success: true, deletedId: id, totalCount: list.length }, { status: 200, headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ success: false, error: maskErrorMessage(err, 'Lỗi xóa bản ghi.') }, { status: 500, headers: corsHeaders });
  }
}

