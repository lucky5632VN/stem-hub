import ragData from '../data/rag-vectors.json' with { type: 'json' };
import globalLearnedData from '../data/global-learned-knowledge.json' with { type: 'json' };
import { db } from './firebase.js';
import { collection, doc, setDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';

const { idfWeights, corpus } = ragData;
const DYNAMIC_KNOWLEDGE_KEY = 'stem_hub_dynamic_rag_knowledge';

// Danh sách từ khóa liên quan đến cá nhân, danh tính, thông số người dùng TUYỆT ĐỐI KHÔNG ĐƯỢC LƯU VÀO RAG
export const FORBIDDEN_PERSONAL_KEYWORDS = [
  'nguyễn minh khang', 'nguyen minh khang', 'hồ hoàng anh', 'ho hoang anh',
  'bạn chính là', 'bạn đang ở', 'apprentice', 'tinh thể', 'elo', 'lv.', 'level', 'danh hiệu',
  'phiên trò chuyện trước', 'bộ nhớ học hỏi', 'học sinh đã từng hỏi',
  'tôi là ai', 'nhớ gì về tôi', 'bạn có thể làm gì', 'bạn cs thể làm',
  'đưa tôi qua lab', 'qua lab', 'chuyển sang phần mô phỏng', 'admin'
];

/**
 * Kiểm tra xem văn bản có chứa thông tin cá nhân hoặc câu lệnh hệ thống không
 */
export function containsPersonalOrSystemInfo(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return FORBIDDEN_PERSONAL_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * Kiểm tra xem câu hỏi có phải là câu chào hỏi xã giao hoặc lệnh điều hướng không
 */
export function isGreetingOrChitchat(text) {
  if (!text) return true;
  const t = text.trim().toLowerCase();
  if (t.length <= 2) return true;
  const greetingRegex = /^(xin\s+)?(chào|chao|hello|hi|hey|alo|halo)(\s+(bạn|ban|bn|thầy|thay|cô|co|nova|bot|ad|admin|ê|em))?[!.,?~]*$/i;
  if (greetingRegex.test(t)) return true;
  if (t.includes('bạn là ai') || t.includes('tôi là ai') || t.includes('nhớ gì về tôi')) return true;
  if (t.includes('bạn có thể làm') || t.includes('bạn cs thể làm') || t.includes('làm đc cái gì')) return true;
  if (t.startsWith('đưa tôi qua') || t.startsWith('qua lab') || t.startsWith('mở lab')) return true;
  if (t.includes('tin tức') || t.includes('thời tiết') || t.includes('hôm nay có gì') || t.includes('hôm nay cs') || t.includes('ăn gì') || t.includes('ở đâu')) return true;
  return false;
}

// Danh sách từ dừng (Stop words) tiếng Việt để loại bỏ tạp âm khi so sánh câu hỏi
const VIETNAMESE_STOP_WORDS = new Set([
  'những', 'các', 'những_cái', 'cho', 'là', 'gì', 'như', 'thế', 'nào', 'sao',
  'hãy', 'hỏi', 'giúp', 'em', 'tôi', 'bạn', 'mình', 'cho_em', 'cho_tôi', 'cho_biết',
  'biết', 'trong', 'của', 'và', 'với', 'ở', 'tại', 'được', 'có', 'thì', 'ra',
  'cái', 'này', 'đó', 'kia', 'cùng', 'về', 'để', 'lại', 'khi', 'nào', 'ơi',
  'ạ', 'nhé', 'nha', 'được_không', 'giải_thích'
]);

/**
 * Chuẩn hóa loại bỏ dấu tiếng Việt (Unaccented Auxiliary Normalizer)
 */
export function stripVietnamese(str = '') {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Chuẩn hóa câu hỏi: Loại bỏ từ dừng, dấu câu, đưa về chữ thường NFC chuẩn hóa & đồng nhất hoá/hóa
 */
export function normalizeQuery(text) {
  if (!text) return '';
  const clean = text
    .toLowerCase()
    .normalize('NFC')
    .replace(/hoá/g, 'hóa')
    .replace(/vật lí/g, 'vật lý')
    .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = clean.split(' ');
  const filtered = words.filter(w => w.length > 0 && !VIETNAMESE_STOP_WORDS.has(w));
  return filtered.length > 0 ? filtered.join(' ') : clean;
}

// Bộ nhớ đệm Client-side lưu các chunk tri thức AI tự học được
let dynamicCorpusCache = null;
let isSyncingGlobal = false;

// Tự động tải tri thức toàn cục từ API server vào bộ nhớ đệm client
export async function ensureGlobalCorpusLoaded() {
  if (typeof window === 'undefined' || isSyncingGlobal) return;
  isSyncingGlobal = true;
  try {
    const res = await fetch(`/api/learned-knowledge?onlyVerified=true&t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.learnedDocs) && data.learnedDocs.length > 0) {
        const local = getDynamicCorpus();
        const map = new Map();
        // 🛡️ BẢO VỆ RAG: Lọc nghiêm ngặt chỉ lấy tri thức đã giáo viên duyệt thật, không bị cách ly, không phải demo, không Auto-Verified
        data.learnedDocs.forEach(item => {
          const isNotAuto = !String(item.verifiedBy || '').includes('Auto-Verified') && !String(item.id || '').startsWith('bench_verified_');
          const isVerified = (item.status === 'verified_by_teacher' || item.teacherVerified === true || item.isTeacherVerified === true) && !item.quarantined && !item.isDemo;
          if (isVerified && isNotAuto) {
            map.set(item.id, item);
          }
        });
        local.forEach(item => {
          const isNotAuto = !String(item.verifiedBy || '').includes('Auto-Verified') && !String(item.id || '').startsWith('bench_verified_');
          const isVerified = (item.status === 'verified_by_teacher' || item.teacherVerified === true || item.isTeacherVerified === true) && !item.quarantined && !item.isDemo;
          if (isVerified && isNotAuto) {
            map.set(item.id, item);
          }
        });
        dynamicCorpusCache = Array.from(map.values());
      }
    }
  } catch (_) {}
  isSyncingGlobal = false;
}

// Lấy danh sách tri thức tự học (Hỗ trợ cả môi trường Client và Server)
export function getDynamicCorpus() {
  if (dynamicCorpusCache && dynamicCorpusCache.length > 0) return dynamicCorpusCache;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(DYNAMIC_KNOWLEDGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      // Tự động thanh lọc mọi item chưa được giáo viên duyệt, bị cách ly, là dữ liệu DEMO hoặc dính thông tin cá nhân
      dynamicCorpusCache = (Array.isArray(parsed) ? parsed : []).filter(item => {
        const isNotAuto = !String(item.verifiedBy || '').includes('Auto-Verified') && !String(item.id || '').startsWith('bench_verified_');
        const isVerified = (item.status === 'verified_by_teacher' || item.teacherVerified === true || item.isTeacherVerified === true) && !item.quarantined && !item.isDemo;
        const full = ((item.query || '') + ' ' + (item.answer || '')).toLowerCase();
        return isVerified && isNotAuto && !containsPersonalOrSystemInfo(full) && !isGreetingOrChitchat(item.query);
      });
      // Kích hoạt đồng bộ nền từ API server để luôn có dữ liệu mới nhất
      ensureGlobalCorpusLoaded().catch(() => {});
    } catch (_) {
      dynamicCorpusCache = [];
    }
  } else {
    // Môi trường Server / Node runtime: Đọc trực tiếp từ tệp tri thức toàn cục đã import (chỉ lấy mục đã duyệt, không cách ly, không demo, loại bỏ thông tin cá nhân/chitchat)
    try {
      const raw = Array.isArray(globalLearnedData) ? globalLearnedData : [];
      dynamicCorpusCache = raw.filter(item => {
        const isNotAuto = !String(item.verifiedBy || '').includes('Auto-Verified') && !String(item.id || '').startsWith('bench_verified_');
        const isVerified = (item.status === 'verified_by_teacher' || item.teacherVerified === true || item.isTeacherVerified === true) && !item.quarantined && !item.isDemo;
        const full = ((item.query || '') + ' ' + (item.answer || '')).toLowerCase();
        return isVerified && isNotAuto && !containsPersonalOrSystemInfo(full) && !isGreetingOrChitchat(item.query);
      });
    } catch (_) {
      dynamicCorpusCache = [];
    }
  }
  return dynamicCorpusCache || [];
}

/**
 * Đồng bộ Tri thức tự học TRỰC TIẾP TỪ FIREBASE FIRESTORE (Collection: learned_knowledge)
 * Giúp TOÀN BỘ học sinh và máy tính trong hệ thống dùng chung 1 ngân hàng tri thức thời gian thực
 */
export async function syncGlobalLearnedKnowledge(directDocs = null) {
  const isCleanVerified = (item) => {
    const isNotAuto = !String(item.verifiedBy || '').includes('Auto-Verified') && !String(item.id || '').startsWith('bench_verified_');
    return (item.status === 'verified_by_teacher' || item.teacherVerified === true) && !item.quarantined && !item.isDemo && isNotAuto;
  };
  if (Array.isArray(directDocs)) {
    const verifiedDocs = directDocs.filter(isCleanVerified).map(d => ({
      ...d,
      normalizedQuery: d.normalizedQuery || normalizeQuery(d.query),
      isLearned: true
    }));
    dynamicCorpusCache = verifiedDocs;
    return dynamicCorpusCache;
  }
  if (typeof window === 'undefined') return dynamicCorpusCache || [];
  try {
    let firestoreDocs = [];

    // 1. Ưu tiên tải qua Server API (Admin SDK đọc an toàn theo quy tắc kiểm duyệt, không gây lỗi Permission cho client)
    try {
      const res = await fetch(`/api/learned-knowledge?onlyVerified=true&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.learnedDocs)) {
          firestoreDocs = data.learnedDocs.filter(item => {
            const full = ((item.query || '') + ' ' + (item.answer || '')).toLowerCase();
            return isCleanVerified(item) && !containsPersonalOrSystemInfo(full) && !isGreetingOrChitchat(item.query);
          });
        }
      }
    } catch (_) {}

    // 2. Dự phòng tải trực tiếp từ Firebase Firestore Database với điều kiện lọc khớp firestore.rules
    if (firestoreDocs.length === 0 && db) {
      try {
        const { where } = await import('firebase/firestore');
        const q = query(
          collection(db, 'learned_knowledge'),
          where('status', '==', 'verified_by_teacher'),
          where('teacherVerified', '==', true),
          limit(500)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.query && data.answer && isCleanVerified({ id: docSnap.id, ...data })) {
            const full = (data.query + ' ' + data.answer).toLowerCase();
            if (!containsPersonalOrSystemInfo(full) && !isGreetingOrChitchat(data.query)) {
              firestoreDocs.push({
                id: docSnap.id,
                ...data,
                normalizedQuery: data.normalizedQuery || normalizeQuery(data.query)
              });
            }
          }
        });
      } catch (fErr) {
        console.warn('[RAG FIRESTORE] Không thể tải từ Firestore, dùng dữ liệu tĩnh dự phòng:', fErr.message);
      }
    }

    const localList = getDynamicCorpus();
    const map = new Map();
    
    // Hợp nhất dữ liệu Firestore, Server API và LocalStorage (đã được lọc sạch)
    [...firestoreDocs, ...localList].forEach(item => {
      if (item && item.query && !isGreetingOrChitchat(item.query)) {
        const full = (item.query + ' ' + (item.answer || '')).toLowerCase();
        if (!containsPersonalOrSystemInfo(full)) {
          const key = (item.normalizedQuery || normalizeQuery(item.query)).trim();
          if (!map.has(key)) map.set(key, item);
        }
      }
    });

    const merged = Array.from(map.values());
    dynamicCorpusCache = merged;
    
    // Ghi đè bản sạch vào LocalStorage
    try {
      const lightweightList = merged.slice(0, 100).map(item => ({
        id: item.id,
        query: item.query,
        normalizedQuery: item.normalizedQuery || normalizeQuery(item.query),
        answer: item.answer ? (item.answer.length > 300 ? item.answer.slice(0, 300) + '...' : item.answer) : '',
        subject: item.subject ? item.subject.toLowerCase() : 'stem',
        topic: item.topic,
        status: item.status,
        teacherVerified: Boolean(item.teacherVerified),
        isTeacherVerified: Boolean(item.isTeacherVerified),
        quarantined: Boolean(item.quarantined),
        isDemo: Boolean(item.isDemo),
        createdAt: item.createdAt,
        isLearned: true
      }));
      localStorage.setItem(DYNAMIC_KNOWLEDGE_KEY, JSON.stringify(lightweightList));
    } catch (_) {}

    return merged;
  } catch (err) {
    console.warn('[RAG] Lỗi đồng bộ tri thức từ Firebase Firestore:', err.message);
  }
  return getDynamicCorpus();
}

// Tự động kích hoạt đồng bộ khi load trên trình duyệt
if (typeof window !== 'undefined') {
  syncGlobalLearnedKnowledge();
}

// Tokenizer & N-Gram Feature Extractor
function tokenize(text) {
  if (!text) return [];
  const clean = text
    .toLowerCase()
    .normalize('NFC')
    .replace(/hoá/g, 'hóa')
    .replace(/vật lí/g, 'vật lý')
    .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = clean.split(' ').filter(w => w.length > 0);
  const nGrams = [];
  for (let i = 0; i < words.length; i++) {
    nGrams.push(words[i]);
    if (i < words.length - 1) nGrams.push(`${words[i]}_${words[i + 1]}`);
  }
  return nGrams;
}

// Compute TF-IDF Vector for Query using precalculated IDF Weights
function buildQueryTFIDFVector(tokens) {
  const tfMap = {};
  const len = tokens.length || 1;
  for (const token of tokens) {
    tfMap[token] = (tfMap[token] || 0) + 1;
  }

  const tfidfMap = {};
  for (const word in tfMap) {
    const tf = tfMap[word] / len;
    const idf = idfWeights[word] || Math.log((ragData.metadata?.totalDocs || 300) + 1) + 1.0;
    tfidfMap[word] = tf * idf;
  }
  return tfidfMap;
}

// Compute Cosine Similarity between two TF-IDF Vector Objects
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const key in vecA) {
    normA += vecA[key] * vecA[key];
    if (vecB[key]) {
      dotProduct += vecA[key] * vecB[key];
    }
  }

  for (const key in vecB) {
    normB += vecB[key] * vecB[key];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Chuẩn hóa & Loại bỏ triệt để lời chào, xưng hô cá nhân trước khi nạp vào Ngân hàng Tri thức RAG
 * Chỉ giữ lại phần kiến thức, định nghĩa, công thức khoa học trung tính
 */
export function sanitizeAnswerForStorage(answerText) {
  if (!answerText) return '';
  let cleaned = answerText.trim();

  // 1. Loại bỏ các mẫu lời chào đầu câu chứa tên riêng hoặc xưng hô
  cleaned = cleaned.replace(/^(?:(?:xin\s+)?chào(?:\s+[^!.,:;\n]{1,35})?[!.,:;~-]?\s*)+/gi, '');
  cleaned = cleaned.replace(/^(?:(?:thầy|cô|nova|tôi)\s+rất\s+vui(?:\s+[^!.,:;\n]{1,40})?[!.,:;~-]?\s*)+/gi, '');
  cleaned = cleaned.replace(/^dựa\s+trên\s+bộ\s+nhớ\s+học\s+hỏi[^.\n]+[.\n]\s*/gi, '');
  cleaned = cleaned.replace(/^hôm\s+nay,?\s*chúng\s+ta\s+sẽ\s+đi\s+sâu\s+hơn\s+vào/gi, '');

  // 2. Loại bỏ các lời kết sáo rỗng cuối câu
  cleaned = cleaned.replace(/(?:chúc\s+(?:em|bạn|học\s+sinh)[^.!\n]*[.!\n]?\s*)+$/gi, '');
  cleaned = cleaned.replace(/(?:nếu\s+(?:em|bạn)\s+còn\s+thắc\s+mắc[^.!\n]*[.!\n]?\s*)+$/gi, '');
  cleaned = cleaned.replace(/(?:em\s+có\s+câu\s+hỏi\s+nào\s+khác[^.!\n]*[.!\n]?\s*)+$/gi, '');
  cleaned = cleaned.replace(/(?:bạn\s+có\s+câu\s+hỏi\s+nào\s+khác[^.!\n]*[.!\n]?\s*)+$/gi, '');

  return cleaned.trim();
}

/**
 * Ghi nhận & Lưu trực tiếp câu trả lời mới từ AI lên FIREBASE FIRESTORE (Collection: learned_knowledge)
 * CHỈ LƯU KIẾN THỨC HỌC THUẬT CHUẨN - TUYỆT ĐỐI KHÔNG LƯU THÔNG TIN CÁ NHÂN HOẶC CÂU CHÀO HỎI
 */
export async function saveLearnedAnswerToRAG(query, answer, subject = 'stem', topic = 'Tri thức tự học AI toàn hệ thống') {
  if (!query || !answer || typeof window === 'undefined') return null;
  const cleanQ = query.trim();

  // 1. CHẶN TRIỆT ĐỂ CÁC CÂU HỎI CHÀO HỎI, XÃ GIAO, DANH TÍNH, ĐIỀU HƯỚNG
  if (isGreetingOrChitchat(cleanQ)) {
    console.log(`[RAG Ingestion Guard] Bỏ qua câu chào hỏi / chitchat: "${cleanQ}"`);
    return null;
  }

  // 2. CHẶN NẾU CHỨA BẤT KỲ TỪ KHÓA CÁ NHÂN NÀO TRONG CÂU HỎI HOẶC CÂU TRẢ LỜI
  if (containsPersonalOrSystemInfo(cleanQ) || containsPersonalOrSystemInfo(answer)) {
    console.warn(`[RAG Ingestion Guard] Bỏ qua vì chứa thông tin cá nhân/hệ thống: "${cleanQ}"`);
    return null;
  }

  // 3. XÁC THỰC MÔN HỌC HỢP LỆ (CHỈ LƯU KIẾN THỨC KHOA HỌC THPT)
  const detectedSubj = detectQuerySubject(cleanQ);
  const normSubject = (detectedSubj || subject || 'stem').toLowerCase();
  const validAcademicSubjects = ['toan', 'ly', 'hoa', 'sinh', 'tin', 'stem'];
  if (!validAcademicSubjects.includes(normSubject)) {
    console.log(`[RAG Ingestion Guard] Bỏ qua câu hỏi ngoài chương trình STEM: "${cleanQ}"`);
    return null;
  }

  const cleanA = sanitizeAnswerForStorage(answer);

  // Bỏ qua nếu sau khi làm sạch độ dài không đủ đạt chuẩn kiến thức
  if (cleanQ.length < 4 || cleanA.length < 15) return null;

  // Kiểm tra lại sau khi sanitize xem có còn sót từ khóa cấm không
  if (containsPersonalOrSystemInfo(cleanA)) {
    console.warn(`[RAG Ingestion Guard] Bỏ qua câu trả lời sau sanitize vẫn chứa dữ liệu cá nhân: "${cleanQ}"`);
    return null;
  }

  const normQ = normalizeQuery(cleanQ);
  const currentDynamic = getDynamicCorpus();
  
  // Kiểm tra nếu câu hỏi trùng lặp đã tồn tại
  const existingIdx = currentDynamic.findIndex(item => {
    const itemNorm = item.normalizedQuery || normalizeQuery(item.query);
    return itemNorm === normQ;
  });

  // Vector dành riêng cho câu hỏi (Query Vector)
  const queryTokens = tokenize(normQ);
  const queryTFIDF = buildQueryTFIDFVector(queryTokens);

  // Vector tổng hợp cho nội dung tài liệu RAG
  const contentTokens = tokenize(`${cleanQ} ${cleanA}`);
  const contentTFIDF = buildQueryTFIDFVector(contentTokens);

  const docId = `learned_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newItem = {
    id: docId,
    query: cleanQ,
    normalizedQuery: normQ,
    answer: cleanA,
    subject: normSubject,
    topic: topic || 'Tri thức tự học AI toàn hệ thống',
    content: `[Chờ giáo viên duyệt] ${cleanQ}: ${cleanA}`,
    queryTFIDF: queryTFIDF,
    tfidfVector: contentTFIDF,
    isLearned: true,
    // 🛡️ BẢO VỆ RAG: Tri thức mới nạp mặc định pending, không vào RAG khi chưa được giáo viên duyệt
    status: 'pending_review',
    teacherVerified: false,
    quarantined: false,
    verifiedAt: null,
    verifiedBy: null,
    createdAt: new Date().toISOString()
  };

  // 1. GHI TRỰC TIẾP LÊN FIREBASE FIRESTORE VỚI TRẠNG THÁI PENDING (CHỜ GIÁO VIÊN THẨM ĐỊNH)
  try {
    if (db) {
      const docRef = doc(collection(db, 'learned_knowledge'), docId);
      await setDoc(docRef, {
        id: docId,
        query: cleanQ,
        normalizedQuery: normQ,
        answer: cleanA,
        subject: normSubject,
        topic: topic || 'Tri thức tự học AI toàn hệ thống',
        isLearned: true,
        status: 'pending_review',
        teacherVerified: false,
        quarantined: false,
        verifiedAt: null,
        verifiedBy: null,
        createdAt: serverTimestamp()
      });
      console.log(`⏳ [RAG FIRESTORE REALTIME] Đã ghi nạp tri thức mới (Chờ giáo viên thẩm định): "${cleanQ}"`);
    }
  } catch (err) {
    console.warn('[RAG FIRESTORE] Lỗi ghi trực tiếp Firestore:', err.message);
  }

  // 2. GHI NẠP DỰ PHÒNG QUA SERVER API
  try {
    const { auth } = await import('./firebase.js');
    const token = auth && auth.currentUser ? await auth.currentUser.getIdToken().catch(() => '') : '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    fetch('/api/learned-knowledge', {
      method: 'POST',
      headers,
      body: JSON.stringify(newItem)
    }).catch(() => {});
  } catch (_) {}

  // 3. Lưu LocalStorage đệm (bản sạch)
  try {
    const lightweightList = currentDynamic.slice(0, 50).map(item => ({
      id: item.id,
      query: item.query,
      normalizedQuery: item.normalizedQuery || normalizeQuery(item.query),
      answer: item.answer ? (item.answer.length > 250 ? item.answer.slice(0, 250) + '...' : item.answer) : '',
      subject: item.subject,
      topic: item.topic,
      createdAt: item.createdAt,
      isLearned: true
    }));
    localStorage.setItem(DYNAMIC_KNOWLEDGE_KEY, JSON.stringify(lightweightList));
  } catch (_) {}

  return newItem;
}

/**
 * Nhận diện môn học dựa trên từ khóa trong câu hỏi (Đã tối ưu hóa chuẩn hóa tiếng Việt)
 */
export function detectQuerySubject(query) {
  if (!query) return null;
  const qLower = query.toLowerCase().replace(/hoá/g, 'hóa').replace(/vật lí/g, 'vật lý');

  // 1. Chặn đứng các môn ngoài phạm vi STEM (Địa lí, Sử, Văn, Anh...)
  const isNonStem = /địa\s*l[ýí]|lịch\s*sử|\bsử\b|ngữ\s*văn|văn\s*học|tiếng\s*anh|ngoại\s*ngữ|gdcd|kinh\s*tế\s*pháp\s*luật|triết\s*học/i.test(qLower);
  if (isNonStem) return null;

  // 2. Nhận diện các môn STEM chuẩn
  if (
    qLower.includes('hóa') || 
    qLower.includes('este') || 
    qLower.includes('axit') || 
    qLower.includes('nguyên tử') || 
    qLower.includes('dung dịch') ||
    qLower.includes('phản ứng') ||
    qLower.includes('oxi hóa') ||
    qLower.includes('oxit') ||
    qLower.includes('polime') ||
    qLower.includes('ancol') ||
    qLower.includes('phenol') ||
    qLower.includes('amino axit') ||
    qLower.includes('glucoz') ||
    qLower.includes('saccaroz') ||
    qLower.includes('kết tủa')
  ) return 'hoa';

  if (
    qLower.includes('vật lý') || 
    qLower.includes('vật lí') || 
    qLower.includes('môn lý') || 
    qLower.includes('môn lí') || 
    qLower.includes('bài tập lý') || 
    qLower.includes('học lý') ||
    qLower.includes('dao động') ||
    qLower.includes('con lắc') ||
    qLower.includes('sóng cơ') ||
    qLower.includes('thấu kính') ||
    qLower.includes('quang học') ||
    qLower.includes('điện từ') ||
    qLower.includes('cảm ứng từ') ||
    qLower.includes('quang điện') ||
    qLower.includes('phóng xạ') ||
    qLower.includes('hạt nhân') ||
    (!/(địa|tâm|triết|quản|xử|chân|hợp|vô|pháp|đạo|lý\s*do)\s*l[ýí]/i.test(qLower) && (qLower.includes(' lý') || qLower.includes(' lí') || qLower.startsWith('lý') || qLower.startsWith('lí')))
  ) return 'ly';

  if (
    qLower.includes('sinh') || 
    qLower.includes('sinh học') || 
    qLower.includes('adn') || 
    qLower.includes('dna') || 
    qLower.includes('arn') || 
    qLower.includes('rna') || 
    qLower.includes('gen') || 
    qLower.includes('tế bào') || 
    qLower.includes('di truyền') ||
    qLower.includes('nhiễm sắc thể') ||
    qLower.includes('axit nucleic') ||
    qLower.includes('đột biến') ||
    qLower.includes('quang hợp') ||
    qLower.includes('nguyên phân') ||
    qLower.includes('giảm phân') ||
    qLower.includes('menđen') ||
    qLower.includes('quần thể') ||
    qLower.includes('hệ sinh thái')
  ) return 'sinh';

  if (
    qLower.includes('tin học') || 
    qLower.includes('lập trình') || 
    qLower.includes('thuật toán') || 
    qLower.includes('python') || 
    qLower.includes('c++') || 
    qLower.includes('pascal') || 
    qLower.includes('mạng máy tính') || 
    qLower.includes('cơ sở dữ liệu') || 
    qLower.includes('sql')
  ) return 'tin';

  if (
    (!qLower.includes('thuật toán') && qLower.includes('toán')) || 
    qLower.includes('hàm số') || 
    qLower.includes('logarit') || 
    qLower.includes('tích phân') || 
    qLower.includes('đạo hàm') ||
    qLower.includes('hình học') ||
    qLower.includes('vecto') ||
    qLower.includes('xác suất') ||
    qLower.includes('cấp số')
  ) return 'toan';

  return null;
}

/**
 * Trích xuất phần cốt lõi của câu hỏi tiếng Việt (loại bỏ các mẫu câu hỏi thường gặp)
 */
export function extractQuestionCore(text) {
  if (!text) return '';
  let s = text.toLowerCase().normalize('NFC').replace(/hoá/g, 'hóa').replace(/vật lí/g, 'vật lý');

  const questionPrefixes = [
    /^(?:thầy|cô|bạn|ad|nova|em)?\s*(?:ơi\s+)?(?:cho\s+em\s+hỏi|em\s+muốn\s+hỏi|thầy\s+cho\s+em\s+hỏi|cô\s+cho\s+em\s+hỏi|thầy\s+cô\s+cho\s+em\s+hỏi)\s+/gi,
    /^(?:giúp\s+tôi|giúp\s+em|hãy\s+giúp\s+tôi|hãy\s+giúp\s+em|tôi\s+muốn\s+làm|em\s+muốn\s+làm|tôi\s+muốn|em\s+muốn|hướng\s+dẫn\s+tôi|hướng\s+dẫn\s+em|chỉ\s+tôi|chỉ\s+em)\s+/gi,
    /^(?:thực\s+hiện|làm\s+thí\s+nghiệm|thí\s+nghiệm)\s+/gi,
    /^(?:hãy\s+giải\s+thích|hãy\s+cho\s+biết|hãy\s+nêu|cho\s+biết|giải\s+thích|nêu|cho\s+em\s+biết)\s+/gi,
    /^(?:làm\s+thế\s+nào\s+để|làm\s+sao\s+để|tìm\s+hiểu\s+về|định\s+nghĩa\s+về|khái\s+niệm\s+về)\s+/gi,
    /^(?:công\s+thức\s+tổng\s+quát\s+của|công\s+thức\s+phân\s+tử\s+của|công\s+thức\s+tính|công\s+thức\s+của)\s+/gi,
    /^(?:ý\s+nghĩa\s+của|tính\s+chất\s+của|đặc\s+điểm\s+của|hiện\s+tượng)\s+/gi
  ];

  const questionSuffixes = [
    /\s+(?:là\s+gì\s+vậy\s+ạ|là\s+gì\s+thế\s+ạ|là\s+gì\s+vậy|là\s+gì\s+thế|là\s+gì\s+nhỉ|là\s+gì|như\s+thế\s+nào\s+vậy|như\s+thế\s+nào|ra\s+sao|vậy\s+ạ|vậy|nhỉ|hở\s+thầy|hở\s+cô|được\s+không\s+ạ|được\s+không|thế\s+nào)[?!\s.]*$/gi,
    /\s+(?:diễn\s+ra\s+như\s+thế\s+nào|xảy\s+ra\s+khi\s+nào|có\s+ý\s+nghĩa\s+gì|dùng\s+để\s+làm\s+gì)[?!\s.]*$/gi,
    /\s+(?:đi\s+nhé|đi\s+nha|đi\s+ạ|đi|nhé|nha|với\s+ạ|với|ạ|ơi)[?!\s.]*$/gi
  ];

  for (const p of questionPrefixes) s = s.replace(p, '');
  for (const suf of questionSuffixes) s = s.replace(suf, '');

  return s.trim();
}

/**
 * Trích xuất tập hợp Bi-grams (từ ghép 2 từ liên tiếp) để bảo toàn thuật ngữ khoa học
 */
export function extractBiGrams(text) {
  if (!text) return new Set();
  const words = text
    .toLowerCase()
    .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0 && !VIETNAMESE_STOP_WORDS.has(w));

  const grams = new Set();
  words.forEach(w => grams.add(w));
  for (let i = 0; i < words.length - 1; i++) {
    grams.add(`${words[i]}_${words[i + 1]}`);
  }
  return grams;
}

/**
 * Tính độ tương đồng Jaccard giữa 2 tập hợp Bi-grams
 */
export function computeBiGramJaccard(gramsA, gramsB) {
  if (gramsA.size === 0 || gramsB.size === 0) return 0;
  let intersect = 0;
  for (const g of gramsA) {
    if (gramsB.has(g)) intersect++;
  }
  const union = gramsA.size + gramsB.size - intersect;
  return union === 0 ? 0 : intersect / union;
}

/**
 * Kiểm tra xem câu hỏi có trùng khớp linh hoạt với Tri thức AI đã học trước đó hay không (Cache Hit)
 * Hỗ trợ so sánh linh hoạt từ ngữ: N-Gram Jaccard, Cosine Similarity, Core Concept Match & Subject Isolation
 */
export function checkRAGCacheHit(query, minScoreThreshold = 0.55) {
  if (!query || typeof query !== 'string') return { hit: false };

  const rawQ = query.trim();

  // 1. TUYỆT ĐỐI KHÔNG DÙNG CACHE CHO CÂU CHÀO HỎI HOẶC CÂU LỆNH HỆ THỐNG
  if (isGreetingOrChitchat(rawQ) || containsPersonalOrSystemInfo(rawQ)) {
    return { hit: false };
  }

  const userNormQ = normalizeQuery(rawQ);
  if (!userNormQ || userNormQ.length < 3) return { hit: false };

  const userCore = extractQuestionCore(rawQ);
  const userTokens = userNormQ.split(' ').filter(Boolean);
  if (userTokens.length < 2 && rawQ.length < 8) return { hit: false };

  const userBiGrams = extractBiGrams(rawQ);
  const userQueryTFIDF = buildQueryTFIDFVector(tokenize(userNormQ));
  const dynamicDocs = getDynamicCorpus();

  // Tổng hợp kho tìm kiếm: Tri thức tự học (đã được giáo viên phê duyệt thật) + 303 chủ đề ngữ liệu chuẩn
  const candidates = [
    ...dynamicDocs.filter(d => (d.status === 'verified_by_teacher' || d.teacherVerified === true) && !d.quarantined && !d.isDemo),
    ...corpus.map(c => ({
      query: c.topic,
      normalizedQuery: normalizeQuery(c.topic),
      answer: c.content,
      subject: c.subject,
      topic: c.topic,
      isTextbook: true
    }))
  ];

  if (candidates.length === 0) return { hit: false };

  const userSubj = detectQuerySubject(rawQ);

  let bestMatch = null;
  let maxScore = 0;

  for (const doc of candidates) {
    const docRawQ = (doc.query || doc.topic || '').trim();
    const docAnswer = (doc.answer || doc.content || '').trim();

    if (containsPersonalOrSystemInfo(docRawQ) || containsPersonalOrSystemInfo(docAnswer) || isGreetingOrChitchat(docRawQ)) {
      continue;
    }

    const rawDocSubj = (doc.subject || '').toLowerCase();
    const docSubj = (rawDocSubj && rawDocSubj !== 'stem' && rawDocSubj !== 'general')
      ? rawDocSubj
      : (detectQuerySubject(docRawQ) || 'general');

    // Cách ly môn học nếu có xung đột rõ rệt (ví dụ Hóa vs Lý)
    if (userSubj && docSubj && docSubj !== 'general' && docSubj !== 'stem' && userSubj !== docSubj) {
      continue;
    }

    const docNormQ = doc.normalizedQuery || normalizeQuery(docRawQ);
    const docCore = extractQuestionCore(docRawQ);
    const docTokens = docNormQ.split(' ').filter(Boolean);
    const docBiGrams = extractBiGrams(docRawQ + ' ' + (doc.topic || ''));

    let score = 0;

    // 1. Khớp nguyên văn hoặc khớp phần cốt lõi (Core Concept Match)
    if (userNormQ === docNormQ || docRawQ.toLowerCase().trim() === rawQ.toLowerCase().trim()) {
      score = 1.0;
    } else if (userCore && docCore && (userCore === docCore || userCore.includes(docCore) || docCore.includes(userCore)) && docCore.length >= 6) {
      score = 0.95;
    } else {
      // 2. Tính Bi-gram Jaccard Similarity (bảo toàn trật tự từ và thuật ngữ khoa học)
      const biGramJaccard = computeBiGramJaccard(userBiGrams, docBiGrams);

      // 3. Tính Cosine Similarity TF-IDF của câu hỏi
      const docQueryVec = doc.queryTFIDF || buildQueryTFIDFVector(tokenize(docNormQ));
      const tfidfCos = cosineSimilarity(userQueryTFIDF, docQueryVec);

      // 4. Tính tỷ lệ bao phủ từ khóa (Token Overlap)
      let matchCount = 0;
      for (const uToken of userTokens) {
        if (docTokens.includes(uToken)) matchCount++;
      }
      const tokenCoverage = userTokens.length > 0 ? (matchCount / userTokens.length) : 0;

      // Trọng số kết hợp đa tầng: 45% Bi-gram Jaccard + 35% TF-IDF Cosine + 20% Token Coverage
      score = (0.45 * biGramJaccard) + (0.35 * tfidfCos) + (0.20 * tokenCoverage);

      // Thưởng điểm nếu có các thuật ngữ chuyên sâu trùng khớp
      if (tokenCoverage >= 0.75 && userTokens.length >= 3) {
        score = Math.max(score, 0.82 + (0.15 * tokenCoverage));
      }
    }

    // Thưởng điểm nếu môn học tương thích
    if (userSubj && docSubj === userSubj) {
      score *= 1.15;
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = doc;
    }
  }

  if (bestMatch && maxScore >= minScoreThreshold) {
    const isVerified = Boolean((bestMatch.isTeacherVerified || bestMatch.teacherVerified) && bestMatch.status === 'verified_by_teacher' && !bestMatch.quarantined && !bestMatch.isDemo);
    return {
      hit: true,
      score: Math.min(1.0, maxScore),
      cachedAnswer: bestMatch.answer || bestMatch.content,
      topic: bestMatch.topic || 'Tri thức tự học AI toàn hệ thống',
      subject: bestMatch.subject,
      query: bestMatch.query || bestMatch.topic,
      isLearned: Boolean(bestMatch.isLearned),
      isTeacherVerified: isVerified,
      teacherVerified: isVerified,
      verifiedBy: bestMatch.verifiedBy || (isVerified ? 'Giáo viên THPT' : null),
      verifiedAt: bestMatch.verifiedAt || null,
      reviewId: bestMatch.reviewId || null,
      rubricScore: bestMatch.rubricScore || null,
      expertReviewUrl: null,
      sourceType: bestMatch.isLearned ? 'learned_knowledge' : (bestMatch.sourceType || 'team_summary')
    };
  }

  return { hit: false };
}

/**
 * Trích xuất Top-K thông tin từ cả Tập tri thức tĩnh + Tập tri thức tự học
 */
export function retrieveTopK(query, k = 3, options = {}) {
  if (!query || typeof query !== 'string') return [];

  const queryTokens = tokenize(query);
  const queryTFIDF = buildQueryTFIDFVector(queryTokens);

  if (Object.keys(queryTFIDF).length === 0) return [];

  const isStaticOnly = Boolean(options.staticOnly || options.ablationMode || process.env.ABLATION_MODE === 'true');
  const allowedChunkIds = options.allowedChunkIds || null;

  let fullCorpus;
  if (isStaticOnly) {
    fullCorpus = corpus;
  } else {
    const dynamicDocs = getDynamicCorpus();
    // 🛡️ Chỉ nạp vào ngữ cảnh RAG các tri thức tự học đã được giáo viên phê duyệt thật, không bị cách ly, không phải demo
    const verifiedDynamic = dynamicDocs.filter(doc => (doc.status === 'verified_by_teacher' || doc.teacherVerified === true) && !doc.quarantined && !doc.isDemo);
    fullCorpus = [...verifiedDynamic, ...corpus];
  }

  // 🛡️ CHẾ ĐỘ ABLATION GUARD: Nếu chỉ định allowedChunkIds, lọc nghiêm ngặt và chặn mọi chunk ngoài danh sách
  if (allowedChunkIds) {
    fullCorpus = fullCorpus.filter(doc => allowedChunkIds.has(doc.id));
  }

  const qUnaccent = stripVietnamese(query).split(/\s+/).filter(t => t.length > 1);
  const isUnaccented = query.toLowerCase().trim() === stripVietnamese(query);

  const scored = fullCorpus.map((doc) => {
    const rawCos = cosineSimilarity(queryTFIDF, doc.tfidfVector || buildQueryTFIDFVector(tokenize(`${doc.query || ''} ${doc.answer || doc.content || ''}`)));

    // Tính BM25-style Token Overlap giữa câu hỏi và đoạn tri thức
    const docTokens = tokenize(`${doc.topic || ''} ${doc.content || doc.answer || ''}`);
    let matchCount = 0;
    queryTokens.forEach(token => {
      if (docTokens.includes(token)) matchCount++;
    });
    const bm25Overlap = queryTokens.length > 0 ? (matchCount / queryTokens.length) : 0;

    // Chuẩn hóa TF-IDF: Ngưỡng thô 0.18 quy đổi thành điểm chuẩn hóa 0.30 (hệ số tỉ lệ / 0.60)
    const normTFIDF = Math.min(1.0, rawCos / 0.60);

    // 🛡️ CÔNG THỨC HYBRID GROUNDING SCORE (THỐNG NHẤT VỚI THỰC NGHIỆM RETRIEVAL BENCHMARK):
    // GroundingScore = 0.6 * Norm_TFIDF + 0.4 * BM25_Overlap
    let hybridScore = (0.6 * normTFIDF) + (0.4 * bm25Overlap);

    // Bổ trợ so khớp phụ không dấu khi người dùng gõ không dấu / teencode (Variant 2)
    if (isUnaccented) {
      const docUnaccentStr = stripVietnamese(`${doc.topic || ''} ${doc.content || doc.answer || ''}`);
      let unaccentMatches = 0;
      for (const ut of qUnaccent) {
        if (docUnaccentStr.includes(ut)) unaccentMatches++;
      }
      const unaccentScore = qUnaccent.length > 0 ? (unaccentMatches / qUnaccent.length) : 0;
      if (unaccentScore > 0) {
        hybridScore = (0.7 * hybridScore) + (0.3 * unaccentScore);
      }
    }

    // Subject boost for explicit subject keywords
    const qLower = query.toLowerCase().replace(/hoá/g, 'hóa').replace(/vật lí/g, 'vật lý');
    const docSubj = (doc.subject || '').toLowerCase();
    if (docSubj === 'hoa' && (qLower.includes('hóa') || qLower.includes('hoá') || qLower.includes('este') || qLower.includes('axit'))) {
      hybridScore *= 1.3;
    } else if (docSubj === 'ly' && (qLower.includes('vật lý') || (!/địa\s*l[ýí]/i.test(qLower) && (/\bl[ýí]\b/i.test(qLower) || qLower.includes('sóng') || qLower.includes('dao động'))))) {
      hybridScore *= 1.3;
    } else if (docSubj === 'toan' && (qLower.includes('toán') || qLower.includes('hàm số') || qLower.includes('tích phân'))) {
      hybridScore *= 1.3;
    } else if (docSubj === 'sinh' && (qLower.includes('sinh') || qLower.includes('adn') || qLower.includes('gen') || qLower.includes('màng'))) {
      hybridScore *= 1.3;
    }

    const finalScore = Math.min(1.0, hybridScore);

    const isVerified = Boolean((doc.isTeacherVerified || doc.teacherVerified) && doc.status === 'verified_by_teacher' && !doc.quarantined && !doc.isDemo);
    return {
      id: doc.id,
      sampleId: doc.sampleId,
      subject: doc.subject,
      topic: doc.topic,
      sourceType: doc.isLearned ? 'learned_knowledge' : (doc.sourceType || 'team_summary'),
      content: doc.content || doc.answer,
      score: finalScore,
      rawTFIDF: rawCos,
      normTFIDF: normTFIDF,
      bm25Score: bm25Overlap,
      isLearned: Boolean(doc.isLearned),
      isTeacherVerified: isVerified,
      teacherVerified: isVerified,
      verifiedBy: doc.verifiedBy || (isVerified ? 'Giáo viên THPT' : null),
      verifiedAt: doc.verifiedAt || null,
      reviewId: doc.reviewId || null,
      rubricScore: doc.rubricScore || null,
      expertReviewUrl: null
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const topHits = scored.slice(0, k).filter(doc => doc.score > 0.05);

  // 🛡️ CHẶN RÒ RỈ TRI THỨC TRONG ABLATION (QUY TẮC TRUNG THỰC):
  // Nếu ở chế độ staticOnly hoặc ablationMode có danh sách chunk cố định,
  // kiểm tra từng chunkId được đưa vào ngữ cảnh. Nếu gặp bất kỳ chunkId nào ngoài allowedChunkIds
  // hoặc có tiền tố 'bench_verified_*' thì lập tức dừng ngay và ném lỗi.
  if (isStaticOnly && allowedChunkIds) {
    for (const hit of topHits) {
      if (!allowedChunkIds.has(hit.id) || String(hit.id).startsWith('bench_verified_')) {
        throw new Error(`[ABLATION CORRUPTION DETECTED] Chunk ID '${hit.id}' is outside the frozen 303 stem-corpus chunks! Aborting.`);
      }
    }
  }

  return topHits;
}

// ─────────────────────────────────────────────────────────────────────────────
// WEB WORKER RETRIEVAL (Chạy ngầm ở luồng nền Background Thread - Giải phóng Main Thread)
// ─────────────────────────────────────────────────────────────────────────────
let ragWorkerInstance = null;
let workerMsgId = 0;
const pendingWorkerRequests = new Map();

function getRagWorker() {
  if (typeof window === 'undefined' || !window.Worker) return null;
  if (!ragWorkerInstance) {
    try {
      ragWorkerInstance = new Worker('/workers/ragWorker.js');
      ragWorkerInstance.onmessage = (e) => {
        const { id, results } = e.data;
        if (pendingWorkerRequests.has(id)) {
          const { resolve } = pendingWorkerRequests.get(id);
          pendingWorkerRequests.delete(id);
          resolve(results || []);
        }
      };
      ragWorkerInstance.onerror = (err) => {
        console.warn('[RAG Web Worker] Gặp lỗi, tự động chuyển về luồng chính:', err);
      };
    } catch (err) {
      console.warn('[RAG Web Worker] Không thể khởi tạo, dùng fallback đồng bộ:', err);
      ragWorkerInstance = null;
    }
  }
  return ragWorkerInstance;
}

/**
 * Trích xuất Top-K phi đồng bộ thông qua Web Worker (Background Thread)
 * Đảm bảo giao diện 60 FPS mượt mà không bao giờ bị đơ (UI Freezing)
 */
export async function retrieveTopKAsync(query, k = 3) {
  if (!query || typeof query !== 'string') return [];

  const worker = getRagWorker();
  if (worker) {
    const queryTokens = tokenize(query);
    const queryTFIDF = buildQueryTFIDFVector(queryTokens);
    if (Object.keys(queryTFIDF).length === 0) return [];

    const dynamicDocs = getDynamicCorpus().filter(doc => (doc.status === 'verified_by_teacher' || doc.teacherVerified === true) && !doc.quarantined && !doc.isDemo);
    const fullCorpus = [...dynamicDocs, ...corpus];

    return new Promise((resolve) => {
      const msgId = ++workerMsgId;
      pendingWorkerRequests.set(msgId, { resolve });

      // Fallback tự kích hoạt sau 1200ms nếu worker không phản hồi
      setTimeout(() => {
        if (pendingWorkerRequests.has(msgId)) {
          pendingWorkerRequests.delete(msgId);
          resolve(retrieveTopK(query, k));
        }
      }, 1200);

      worker.postMessage({
        id: msgId,
        type: 'RETRIEVE_TOP_K',
        query,
        k,
        corpus: fullCorpus,
        queryTFIDF
      });
    });
  }

  // Fallback chạy đồng bộ khi chạy trong môi trường Node.js kiểm thử hoặc SSR
  return retrieveTopK(query, k);
}

export function getCorpus() {
  return corpus;
}

export default {
  retrieveTopK,
  retrieveTopKAsync,
  saveLearnedAnswerToRAG,
  checkRAGCacheHit,
  getDynamicCorpus,
  syncGlobalLearnedKnowledge,
  normalizeQuery,
  cosineSimilarity,
  getCorpus
};
