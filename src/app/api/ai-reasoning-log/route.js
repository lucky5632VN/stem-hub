import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';

export const dynamic = 'force-static';

// In-memory buffer fallback for ultra-fast response
if (!globalThis.__AI_REASONING_LOGS__) {
  globalThis.__AI_REASONING_LOGS__ = [];
}

export async function GET(request) {
  try {
    // If memory buffer has logs, return them
    let logs = globalThis.__AI_REASONING_LOGS__ || [];

    // Fallback: If memory buffer is empty, attempt to fetch recent 50 logs from Firestore
    if (logs.length === 0 && db) {
      try {
        const q = query(collection(db, 'ai_reasoning_logs'), orderBy('timestamp', 'desc'), limit(50));
        const snap = await getDocs(q);
        const fetchedLogs = [];
        snap.forEach((docSnap) => {
          fetchedLogs.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (fetchedLogs.length > 0) {
          globalThis.__AI_REASONING_LOGS__ = fetchedLogs;
          logs = fetchedLogs;
        }
      } catch (err) {
        console.warn('Lỗi fetch Firestore trong GET /api/ai-reasoning-log:', err.message);
      }
    }

    return NextResponse.json({ success: true, logs }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      query: userQuery,
      userDisplayName,
      userEmail,
      currentPage,
      intent,
      subject,
      ragTopTopic,
      ragScore,
      tfjsProb,
      isCacheHit,
      aiResponseText,
      actionTriggered
    } = body;

    const timestamp = Date.now();
    const timeStr = new Date(timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logId = 'log_' + timestamp + '_' + Math.random().toString(36).substring(2, 7);
    const subjectName = (subject || 'tổng hợp').toUpperCase();

    // Console output mimicking local CMD terminal
    console.log('\n' + '─'.repeat(75));
    console.log(`🤖 [STEM HUB AI REASONING ENGINE — LOG REALTIME SERVER — ${timeStr}]`);
    console.log(`👤 Học sinh: ${userDisplayName || 'Học sinh'} (${userEmail || 'guest'}) | Vị trí: ${currentPage || 'Trang chủ'}`);
    console.log(`📥 Câu hỏi: "${userQuery || ''}"`);
    console.log(`🎯 1/3 Intent & Môn học: Intent '${intent || 'stem_query'}' -> Môn: ${subjectName}`);

    if (isCacheHit) {
      console.log(`⚡ [CACHE HIT - DỮ LIỆU TỰ HỌC] Tìm thấy câu trả lời đã lưu trong Tri thức AI (Độ tương quan: ${Math.round((ragScore || 0) * 100)}%)`);
    } else if (ragTopTopic) {
      console.log(`📚 2/3 Tầng 2 Vector RAG: Trích xuất chunk '${ragTopTopic}' (Độ tương quan: ${Math.round((ragScore || 0) * 100)}%)`);
    } else {
      console.log(`📚 2/3 Tầng 2 Vector RAG: Khai phá tri thức tự do & tìm kiếm bài học tương quan`);
    }

    if (tfjsProb !== undefined && tfjsProb !== null) {
      console.log(`🧠 3/3 Tầng 3 TF.js Online: Dự đoán xác suất = ${(tfjsProb * 100).toFixed(1)}% -> Fit & lưu trọng số vào IndexedDB`);
    } else {
      console.log(`🧠 3/3 Tầng 3 TF.js Online: Kích hoạt bộ nhớ tương tác học máy client-side`);
    }

    if (isCacheHit) {
      console.log(`⚡ TRẢ LỜI TRỰC TIẾP TỪ TRÍ THỨC TỰ HỌC (BỎ QUA GEMINI APIKEY)`);
    } else {
      console.log(`⚡ Tầng 1 Gemini LLM Engine: Tổng hợp câu trả lời & NẠP TỰ ĐỘNG VÀO DỮ LIỆU AI TỰ HỌC`);
    }
    if (aiResponseText) {
      console.log(`💬 Phản hồi AI: "${aiResponseText.slice(0, 100)}..."`);
    }
    console.log('─'.repeat(75) + '\n');

    const terminalLines = [
      `🤖 [STEM HUB AI REASONING ENGINE — LOG REALTIME — ${timeStr}]`,
      `👤 Học sinh: ${userDisplayName || 'Học sinh'} (${userEmail || 'guest@stemhub.edu.vn'}) | Vị trí: ${currentPage || 'Trang chủ'}`,
      `📥 Câu hỏi: "${userQuery || ''}"`,
      `🎯 1/3 Intent & Môn học: Intent '${intent || 'stem_query'}' -> Môn: ${subjectName}`,
      isCacheHit
        ? `⚡ [CACHE HIT - DỮ LIỆU TỰ HỌC] Tìm thấy câu trả lời trong Tri thức AI (Độ tương quan: ${Math.round((ragScore || 0) * 100)}%)`
        : (ragTopTopic ? `📚 2/3 Tầng 2 Vector RAG: Chunk '${ragTopTopic}' (Độ tương quan: ${Math.round((ragScore || 0) * 100)}%)` : `📚 2/3 Tầng 2 Vector RAG: Khai phá tri thức tự do & bài học tương quan`),
      tfjsProb !== null ? `🧠 3/3 Tầng 3 TF.js Online: Dự đoán xác suất = ${(tfjsProb * 100).toFixed(1)}% -> Fit & lưu trọng số` : `🧠 3/3 Tầng 3 TF.js Online: Kích hoạt bộ nhớ tương tác client-side`,
      isCacheHit ? `⚡ TRẢ LỜI TRỰC TIẾP TỪ TRÍ THỨC TỰ HỌC (BỎ QUA GEMINI APIKEY)` : `⚡ Tầng 1 Gemini LLM Engine: Phản hồi & Nạp tự động vào Tri thức AI`,
      aiResponseText ? `💬 AI Phản hồi: "${aiResponseText.slice(0, 120)}..."` : '',
      actionTriggered ? `⚡ Lệnh kích hoạt: ${actionTriggered}` : ''
    ].filter(Boolean);

    const logRecord = {
      id: logId,
      timestamp,
      timeStr,
      userDisplayName: userDisplayName || 'Học sinh',
      userEmail: userEmail || 'guest@stemhub.edu.vn',
      currentPage: currentPage || 'Trang chủ',
      query: userQuery || '',
      intent: intent || 'stem_query',
      subject: subjectName,
      ragTopTopic: ragTopTopic || null,
      ragScore: ragScore || 0,
      tfjsProb: tfjsProb !== undefined ? tfjsProb : null,
      isCacheHit: !!isCacheHit,
      aiResponseText: aiResponseText || '',
      actionTriggered: actionTriggered || null,
      terminalLines
    };

    // Save to global memory array
    globalThis.__AI_REASONING_LOGS__.unshift(logRecord);
    if (globalThis.__AI_REASONING_LOGS__.length > 300) {
      globalThis.__AI_REASONING_LOGS__ = globalThis.__AI_REASONING_LOGS__.slice(0, 300);
    }

    // Persist to Firestore DB for real-time streaming across all admin screens & deployment environments
    if (db) {
      try {
        const docRef = doc(collection(db, 'ai_reasoning_logs'), logId);
        await setDoc(docRef, {
          ...logRecord,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        // Fallback nhẹ nhàng vào bộ nhớ máy chủ (in-memory globalThis.__AI_REASONING_LOGS__)
      }
    }

    return NextResponse.json({ success: true, log: logRecord });
  } catch (error) {
    console.error('Lỗi Server AI Reasoning Log Route:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
