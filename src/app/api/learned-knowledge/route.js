import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';

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

    console.log(`🧠 [GLOBAL LEARNING DB SERVER] Đã ghi nạp tri thức mới từ người dùng: "${cleanQ}" (Tổng số tri thức đã học: ${list.length})`);

    return NextResponse.json({ success: true, item: newItem, totalCount: list.length });
  } catch (err) {
    console.error('[API learned-knowledge] Lỗi POST:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
