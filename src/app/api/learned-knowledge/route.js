import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

export async function GET() {
  try {
    const list = readGlobalKnowledge();
    return NextResponse.json(
      { success: true, count: list.length, learnedDocs: list },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
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

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, query, normalizedQuery, answer, subject, topic, queryTFIDF, tfidfVector, createdAt } = body;
    const effectiveQuery = query || body.question;

    if (!effectiveQuery || !answer) {
      return NextResponse.json({ success: false, error: 'Thiếu query hoặc answer' }, { status: 400 });
    }

    const cleanQ = effectiveQuery.trim();
    const cleanA = answer.trim();

    // ⚡ CHẶN LƯU THÔNG TIN CÁ NHÂN HOẶC CÂU CHÀO HỎI
    if (isPersonalOrGreeting(cleanQ, cleanA)) {
      console.log(`[API learned-knowledge] Từ chối lưu nội dung cá nhân/chào hỏi: "${cleanQ}"`);
      return NextResponse.json({ success: false, ignored: true, message: 'Nội dung cá nhân hoặc chào hỏi không được lưu trữ' });
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
      createdAt: createdAt || new Date().toISOString()
    };

    if (existingIdx >= 0) {
      list[existingIdx] = newItem;
    } else {
      list.unshift(newItem);
    }

    // Giới hạn tối đa 5000 tri thức toàn hệ thống
    if (list.length > 5000) list.pop();

    writeGlobalKnowledge(list);

    console.log(`🧠 [GLOBAL LEARNING DB SERVER] Đã ghi nạp tri thức học thuật mới: "${cleanQ}" (Tổng số: ${list.length})`);

    return NextResponse.json({ success: true, item: newItem, totalCount: list.length });
  } catch (err) {
    console.error('[API learned-knowledge] Lỗi POST:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
