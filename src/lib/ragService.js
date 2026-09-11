import ragData from '../data/rag-vectors.json' with { type: 'json' };
import { db } from './firebase.js';
import { collection, doc, setDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';

const { idfWeights, corpus } = ragData;
const DYNAMIC_KNOWLEDGE_KEY = 'stem_hub_dynamic_rag_knowledge';

// Danh sách từ dừng (Stop words) tiếng Việt để loại bỏ tạp âm khi so sánh câu hỏi
const VIETNAMESE_STOP_WORDS = new Set([
  'những', 'các', 'những_cái', 'cho', 'là', 'gì', 'như', 'thế', 'nào', 'sao',
  'hãy', 'hỏi', 'giúp', 'em', 'tôi', 'bạn', 'mình', 'cho_em', 'cho_tôi', 'cho_biết',
  'biết', 'trong', 'của', 'và', 'với', 'ở', 'tại', 'được', 'có', 'thì', 'ra',
  'cái', 'này', 'đó', 'kia', 'cùng', 'về', 'để', 'lại', 'khi', 'nào', 'ơi',
  'ạ', 'nhé', 'nha', 'được_không', 'giải_thích'
]);

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

// Lấy danh sách tri thức tự học từ LocalStorage
export function getDynamicCorpus() {
  if (typeof window === 'undefined') return [];
  if (dynamicCorpusCache) return dynamicCorpusCache;
  try {
    const raw = localStorage.getItem(DYNAMIC_KNOWLEDGE_KEY);
    dynamicCorpusCache = raw ? JSON.parse(raw) : [];
  } catch (_) {
    dynamicCorpusCache = [];
  }
  return dynamicCorpusCache;
}

/**
 * Đồng bộ Tri thức tự học TRỰC TIẾP TỪ FIREBASE FIRESTORE (Collection: learned_knowledge)
 * Giúp TOÀN BỘ học sinh và máy tính trong hệ thống dùng chung 1 ngân hàng tri thức thời gian thực
 */
export async function syncGlobalLearnedKnowledge() {
  if (typeof window === 'undefined') return [];
  try {
    let firestoreDocs = [];

    // 1. Ưu tiên tải từ Firebase Firestore Database
    if (db) {
      try {
        const q = query(collection(db, 'learned_knowledge'), orderBy('createdAt', 'desc'), limit(500));
        const snapshot = await getDocs(q);
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.query && data.answer) {
            firestoreDocs.push({
              id: docSnap.id,
              ...data,
              normalizedQuery: data.normalizedQuery || normalizeQuery(data.query)
            });
          }
        });
      } catch (fErr) {
        console.warn('[RAG FIRESTORE] Không thể tải từ Firestore, dùng API fallback:', fErr.message);
      }
    }

    // 2. Dự phòng qua Server API nếu Firestore rỗng
    if (firestoreDocs.length === 0) {
      const res = await fetch(`/api/learned-knowledge?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.learnedDocs)) {
          firestoreDocs = data.learnedDocs;
        }
      }
    }

    const localList = getDynamicCorpus();
    const map = new Map();
    
    // Hợp nhất dữ liệu Firestore, Server API và LocalStorage
    [...firestoreDocs, ...localList].forEach(item => {
      if (item && item.query) {
        const key = (item.normalizedQuery || normalizeQuery(item.query)).trim();
        if (!map.has(key)) map.set(key, item);
      }
    });

    const merged = Array.from(map.values());
    dynamicCorpusCache = merged;
    
    // Lưu bản siêu nhẹ vào LocalStorage
    try {
      const lightweightList = merged.slice(0, 100).map(item => ({
        id: item.id,
        query: item.query,
        normalizedQuery: item.normalizedQuery || normalizeQuery(item.query),
        answer: item.answer ? (item.answer.length > 300 ? item.answer.slice(0, 300) + '...' : item.answer) : '',
        subject: item.subject ? item.subject.toLowerCase() : 'stem',
        topic: item.topic,
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
 * Chuẩn hóa & Loại bỏ lời chào chứa tên riêng học sinh trước khi nạp vào Ngân hàng Tri thức RAG
 * Giúp tri thức tự học hoàn toàn trung tính và tái sử dụng chính xác tên cho mọi học sinh
 */
export function sanitizeAnswerForStorage(answerText) {
  if (!answerText) return '';
  let cleaned = answerText.trim();
  // Loại bỏ các mẫu lời chào đầu câu chứa tên riêng
  cleaned = cleaned.replace(/^(Chào\s+bạn\s+([^!\n,]+)[!.,]\s*)/i, '');
  cleaned = cleaned.replace(/^(Chào\s+học\s+sinh\s+([^!\n,]+)[!.,]\s*)/i, '');
  cleaned = cleaned.replace(/^(Xin\s+chào\s+bạn\s+([^!\n,]+)[!.,]\s*)/i, '');
  cleaned = cleaned.replace(/^(Xin\s+chào\s+([^!\n,]+)[!.,]\s*)/i, '');
  cleaned = cleaned.replace(/^(Chào\s+([^!\n,]+)[!.,]\s*)/i, '');
  return cleaned.trim();
}

/**
 * Ghi nhận & Lưu trực tiếp câu trả lời mới từ AI lên FIREBASE FIRESTORE (Collection: learned_knowledge)
 */
export async function saveLearnedAnswerToRAG(query, answer, subject = 'stem', topic = 'Tri thức tự học AI toàn hệ thống') {
  if (!query || !answer || typeof window === 'undefined') return null;
  const cleanQ = query.trim();
  const cleanA = sanitizeAnswerForStorage(answer);

  // Bỏ qua câu hỏi quá ngắn hoặc lệnh hệ thống rác
  if (cleanQ.length < 3 || cleanA.length < 10) return null;

  const normQ = normalizeQuery(cleanQ);
  const normSubject = (subject || 'stem').toLowerCase();
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
    topic: topic,
    content: `[Tự học AI toàn hệ thống] ${cleanQ}: ${cleanA}`,
    queryTFIDF: queryTFIDF,
    tfidfVector: contentTFIDF,
    isLearned: true,
    createdAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    currentDynamic[existingIdx] = newItem;
  } else {
    currentDynamic.unshift(newItem);
  }

  // Giới hạn tối đa 5000 chunk tri thức tự học trong bộ nhớ
  if (currentDynamic.length > 5000) currentDynamic.pop();

  dynamicCorpusCache = currentDynamic;

  // 1. GHI TRỰC TIẾP LÊN FIREBASE FIRESTORE TOÀN HỆ THỐNG
  try {
    if (db) {
      const docRef = doc(collection(db, 'learned_knowledge'), docId);
      await setDoc(docRef, {
        id: docId,
        query: cleanQ,
        normalizedQuery: normQ,
        answer: cleanA,
        subject: normSubject,
        topic: topic,
        isLearned: true,
        createdAt: serverTimestamp()
      });
      console.log(`🔥 [RAG FIRESTORE REALTIME] Đã ghi nạp tri thức mới lên Firebase Firestore: "${cleanQ}"`);
    }
  } catch (err) {
    console.warn('[RAG FIRESTORE] Lỗi ghi trực tiếp Firestore:', err.message);
  }

  // 2. GHI NẠP DỰ PHÒNG QUA SERVER API
  try {
    fetch('/api/learned-knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    }).catch(() => {});
  } catch (_) {}

  // 3. Lưu LocalStorage đệm
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
  if (qLower.includes('hóa') || qLower.includes('hoá') || qLower.includes('este') || qLower.includes('axit') || qLower.includes('nguyên tử') || qLower.includes('dung dịch')) return 'hoa';
  if (qLower.includes('lý') || qLower.includes('lí') || qLower.includes('vật lý') || qLower.includes('vật lí') || qLower.includes('sóng') || qLower.includes('dao động') || qLower.includes('điện')) return 'ly';
  if (qLower.includes('toán') || qLower.includes('hàm số') || qLower.includes('logarit') || qLower.includes('tích phân') || qLower.includes('đạo hàm')) return 'toan';
  if (qLower.includes('sinh') || qLower.includes('sinh học') || qLower.includes('adn') || qLower.includes('gen') || qLower.includes('tế bào') || qLower.includes('di truyền')) return 'sinh';
  return null;
}

/**
 * Kiểm tra xem câu hỏi có trùng khớp linh hoạt với Tri thức AI đã học trước đó hay không (Cache Hit)
 * Hỗ trợ so sánh linh hoạt từ ngữ (Substrings, N-Gram token overlap, Cosine Similarity & Subject Isolation)
 */
export function checkRAGCacheHit(query, minScoreThreshold = 0.65) {
  if (!query || typeof query !== 'string') return { hit: false };

  const rawQ = query.trim();
  const userNormQ = normalizeQuery(rawQ);
  if (!userNormQ) return { hit: false };

  const userTokens = userNormQ.split(' ').filter(Boolean);
  const userQueryTFIDF = buildQueryTFIDFVector(tokenize(userNormQ));

  const dynamicDocs = getDynamicCorpus();
  if (dynamicDocs.length === 0) return { hit: false };

  const userSubj = detectQuerySubject(rawQ);

  let bestMatch = null;
  let maxScore = 0;

  for (const doc of dynamicDocs) {
    const docRawQ = (doc.query || '').trim();
    const rawDocSubj = (doc.subject || '').toLowerCase();
    const docSubj = (rawDocSubj && rawDocSubj !== 'stem' && rawDocSubj !== 'general') 
      ? rawDocSubj 
      : (detectQuerySubject(docRawQ) || 'general');

    // QUY TẮC CÁCH LY MÔN HỌC (SUBJECT ISOLATION):
    // Chỉ loại bỏ nếu 2 môn học xác định rõ ràng bị mâu thuẫn (Ví dụ: Hóa vs Lý/Toán)
    if (userSubj && docSubj && docSubj !== 'general' && docSubj !== 'stem' && userSubj !== docSubj) {
      continue;
    }

    const docNormQ = doc.normalizedQuery || normalizeQuery(docRawQ);
    const docTokens = docNormQ.split(' ').filter(Boolean);
    let score = 0;

    // 1. Khớp chuỗi chính xác tuyệt đối hoặc chuỗi con (Substrings)
    if (userNormQ === docNormQ || docRawQ.toLowerCase().trim() === rawQ.toLowerCase().trim()) {
      score = 1.0; // Khớp 100% tuyệt đối!
    } else if (userNormQ.length >= 5 && docNormQ.length >= 5 && (userNormQ.includes(docNormQ) || docNormQ.includes(userNormQ))) {
      score = 0.95; // Khớp chuỗi con chính!
    } else {
      // 2. Tính tỷ lệ bao phủ Token Overlap Ratio (Jaccard similarity trên từ khóa cốt lõi)
      let matchCount = 0;
      for (const uToken of userTokens) {
        if (docTokens.includes(uToken)) matchCount++;
      }
      const tokenCoverage = userTokens.length > 0 ? (matchCount / userTokens.length) : 0;

      if (tokenCoverage >= 0.75) {
        score = 0.85 + (0.12 * tokenCoverage);
      } else {
        // 3. Tính Cosine Similarity trên Vector TF-IDF của CÂU HỎI
        const docQueryVec = doc.queryTFIDF || buildQueryTFIDFVector(tokenize(docNormQ));
        const vecCos = cosineSimilarity(userQueryTFIDF, docQueryVec);
        score = Math.max(vecCos, tokenCoverage * 0.85);

        // Thưởng điểm nếu câu hỏi thô khớp không phân biệt hoa thường
        if (docRawQ.toLowerCase().trim() === rawQ.toLowerCase().trim()) score = 1.0;
      }
    }

    // Ưu tiên thưởng điểm nếu môn học tương thích
    if (userSubj && docSubj === userSubj) {
      score *= 1.1;
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = doc;
    }
  }

  if (bestMatch && maxScore >= minScoreThreshold) {
    return {
      hit: true,
      score: Math.min(1.0, maxScore),
      cachedAnswer: bestMatch.answer,
      topic: bestMatch.topic || 'Tri thức tự học AI toàn hệ thống',
      subject: bestMatch.subject,
      query: bestMatch.query
    };
  }

  return { hit: false };
}

/**
 * Trích xuất Top-K thông tin từ cả Tập tri thức tĩnh + Tập tri thức tự học
 */
export function retrieveTopK(query, k = 3) {
  if (!query || typeof query !== 'string') return [];

  const queryTokens = tokenize(query);
  const queryTFIDF = buildQueryTFIDFVector(queryTokens);

  if (Object.keys(queryTFIDF).length === 0) return [];

  const dynamicDocs = getDynamicCorpus();
  const fullCorpus = [...dynamicDocs, ...corpus];

  const scored = fullCorpus.map((doc) => {
    let score = cosineSimilarity(queryTFIDF, doc.tfidfVector || buildQueryTFIDFVector(tokenize(`${doc.query || ''} ${doc.answer || doc.content || ''}`)));

    // Thưởng điểm cho tài liệu tự học
    if (doc.isLearned) score *= 1.4;

    // Subject boost for explicit subject keywords
    const qLower = query.toLowerCase().replace(/hoá/g, 'hóa').replace(/vật lí/g, 'vật lý');
    const docSubj = (doc.subject || '').toLowerCase();
    if (docSubj === 'hoa' && (qLower.includes('hóa') || qLower.includes('hoá') || qLower.includes('este') || qLower.includes('axit'))) {
      score *= 1.3;
    } else if (docSubj === 'ly' && (qLower.includes('lý') || qLower.includes('lí') || qLower.includes('sóng') || qLower.includes('dao động'))) {
      score *= 1.3;
    } else if (docSubj === 'toan' && (qLower.includes('toán') || qLower.includes('hàm số') || qLower.includes('tích phân'))) {
      score *= 1.3;
    } else if (docSubj === 'sinh' && (qLower.includes('sinh') || qLower.includes('adn') || qLower.includes('gen') || qLower.includes('màng'))) {
      score *= 1.3;
    }

    return {
      id: doc.id,
      subject: doc.subject,
      topic: doc.topic,
      content: doc.content || doc.answer,
      score: Math.min(1.0, score)
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).filter(doc => doc.score > 0.05);
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

    const dynamicDocs = getDynamicCorpus();
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
