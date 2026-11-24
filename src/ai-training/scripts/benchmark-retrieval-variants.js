/**
 * 🔬 RAG RETRIEVAL VARIANTS BENCHMARK ON DEV SET (n=60 In-Scope + n=20 Out-of-Scope)
 * 
 * Script thực nghiệm toàn diện các biến thể cải tiến thuật toán truy xuất:
 * 1. Variant 0: Baseline Raw TF-IDF (Không chuẩn hóa, không bỏ dấu)
 * 2. Variant 1: + Chuẩn hóa Tiếng Việt & Viết tắt Khoa học (pt, pứ, dd, ctpt, đk...)
 * 3. Variant 2: + So khớp phụ không dấu (Unaccented Auxiliary Matching)
 * 4. Variant 3: + N-gram Word Bigrams
 * 5. Variant 4: + BM25 Okapi-style Saturation
 * 6. Variant 5: + Mở rộng truy vấn theo chủ đề GDPT 2018 (Topic Query Expansion)
 * 7. Variant 6: + Pipeline lai tối ưu (Optimal Hybrid: Norm + Unaccent + BM25 + Expansion)
 * 
 * Đo lường: Recall@1, Recall@3, Recall@5, MRR, In-Scope Acceptance Rate,
 * OOS True Rejection Rate, False Rejection Rate, và ROC-AUC.
 */

import fs from 'fs';
import path from 'path';
import ragData from '../../data/rag-vectors.json' with { type: 'json' };
import { normalizeText } from '../../lib/textNormalizer.js';
import { wilsonInterval } from './chem-risk_train.js';

const { corpus, idfWeights } = ragData;

// Nạp tập Dev (60 in-scope + 20 out-of-scope)
const devBenchmarkPath = path.resolve('src/ai-training/datasets/rag_chunk_benchmark_60.json');
const devData = JSON.parse(fs.readFileSync(devBenchmarkPath, 'utf8'));
const inScopeQueries = devData.queries.filter(q => q.type === 'in_scope');
const oosQueries = devData.queries.filter(q => q.type === 'out_of_scope');

// Từ điển viết tắt thuật ngữ khoa học bổ trợ
const SCIENCE_ABBREVIATIONS = {
  'pt': 'phương trình',
  'pứ': 'phản ứng',
  'pu': 'phản ứng',
  'dd': 'dung dịch',
  'ctpt': 'công thức phân tử',
  'ctct': 'công thức cấu tạo',
  'kl': 'khối lượng',
  'kt': 'kích thước',
  'đk': 'điều kiện',
  'kn': 'khái niệm',
  'ht': 'hiện tượng',
  'dđđh': 'dao động điều hòa',
  'clđ': 'con lắc đơn',
  'cllx': 'con lắc lò xo',
  'adn': 'axit đeoxiribonucleic adn',
  'arn': 'axit ribonucleic arn',
  'nl': 'năng lượng',
  'tđ': 'tốc độ',
  'v': 'vận tốc',
  't': 'thời gian',
  'hsg': 'học sinh giỏi'
};

// Hàm bỏ dấu tiếng Việt
function stripVietnamese(str = '') {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Tokenizer cơ bản
function tokenizeBase(text = '') {
  return text
    .toLowerCase()
    .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

// Tokenizer mở rộng viết tắt
function tokenizeWithScience(text = '') {
  let normalized = normalizeText(text);
  const words = normalized.split(/\s+/);
  const expanded = [];
  for (const w of words) {
    if (SCIENCE_ABBREVIATIONS[w]) {
      expanded.push(...SCIENCE_ABBREVIATIONS[w].split(' '));
    } else {
      expanded.push(w);
    }
  }
  return expanded.filter(t => t.length > 1);
}

// Tokenizer bigram
function extractBigrams(tokens) {
  const bigrams = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]}_${tokens[i + 1]}`);
  }
  return bigrams;
}

// Tính TF-IDF Vector
function buildTFIDF(tokens) {
  const tf = {};
  for (const t of tokens) {
    tf[t] = (tf[t] || 0) + 1;
  }
  const vec = {};
  for (const t in tf) {
    const idf = idfWeights[t] || 2.5;
    vec[t] = (tf[t] / tokens.length) * idf;
  }
  return vec;
}

// Cosine Similarity
function cosineSim(v1, v2) {
  let dot = 0;
  let mag1 = 0;
  let mag2 = 0;
  for (const k in v1) {
    mag1 += v1[k] * v1[k];
    if (v2[k]) dot += v1[k] * v2[k];
  }
  for (const k in v2) {
    mag2 += v2[k] * v2[k];
  }
  if (mag1 === 0 || mag2 === 0) return 0;
  return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

// Tính AUC ROC (Wilcoxon-Mann-Whitney U statistic)
function calculateAUC(posScores, negScores) {
  let u = 0;
  for (const p of posScores) {
    for (const n of negScores) {
      if (p > n) u += 1.0;
      else if (p === n) u += 0.5;
    }
  }
  return u / (posScores.length * negScores.length);
}

// ─────────────────────────────────────────────────────────────────────────────
// CÁC HÀM TRUY XUẤT THEO BIẾN THỂ (RETRIEVAL VARIANTS)
// ─────────────────────────────────────────────────────────────────────────────

function retrieveVariant0(query, k = 5) {
  // Baseline: TF-IDF thô
  const tokens = tokenizeBase(query);
  const qVec = buildTFIDF(tokens);
  const scored = corpus.map(doc => {
    const dTokens = tokenizeBase(`${doc.topic || ''} ${doc.content || ''}`);
    const dVec = buildTFIDF(dTokens);
    const score = cosineSim(qVec, dVec);
    return { id: doc.id, score, subject: doc.subject };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

function retrieveVariant1(query, k = 5) {
  // + Chuẩn hóa Tiếng Việt & Viết tắt
  const tokens = tokenizeWithScience(query);
  const qVec = buildTFIDF(tokens);
  const scored = corpus.map(doc => {
    const dTokens = tokenizeWithScience(`${doc.topic || ''} ${doc.content || ''}`);
    const dVec = buildTFIDF(dTokens);
    const score = cosineSim(qVec, dVec);
    return { id: doc.id, score, subject: doc.subject };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

function retrieveVariant2(query, k = 5) {
  // + So khớp phụ không dấu
  const tokens = tokenizeWithScience(query);
  const qVec = buildTFIDF(tokens);
  const qUnaccent = stripVietnamese(query).split(/\s+/).filter(t => t.length > 1);

  const scored = corpus.map(doc => {
    const dTokens = tokenizeWithScience(`${doc.topic || ''} ${doc.content || ''}`);
    const dVec = buildTFIDF(dTokens);
    const cos = cosineSim(qVec, dVec);

    const dUnaccent = stripVietnamese(`${doc.topic || ''} ${doc.content || ''}`);
    let unaccentMatches = 0;
    for (const ut of qUnaccent) {
      if (dUnaccent.includes(ut)) unaccentMatches++;
    }
    const unaccentScore = qUnaccent.length > 0 ? (unaccentMatches / qUnaccent.length) : 0;
    const finalScore = (0.7 * cos) + (0.3 * unaccentScore);

    return { id: doc.id, score: finalScore, subject: doc.subject };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

function retrieveVariant3(query, k = 5) {
  // + Word Bigrams
  const tokens = tokenizeWithScience(query);
  const bigrams = extractBigrams(tokens);
  const allTokens = [...tokens, ...bigrams];
  const qVec = buildTFIDF(allTokens);

  const scored = corpus.map(doc => {
    const dTokens = tokenizeWithScience(`${doc.topic || ''} ${doc.content || ''}`);
    const dBigrams = extractBigrams(dTokens);
    const dAllTokens = [...dTokens, ...dBigrams];
    const dVec = buildTFIDF(dAllTokens);
    const score = cosineSim(qVec, dVec);
    return { id: doc.id, score, subject: doc.subject };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

function retrieveVariant4(query, k = 5) {
  // + BM25 Okapi Saturation
  const tokens = tokenizeWithScience(query);
  const k1 = 1.2;
  const b = 0.75;
  const avgDocLen = 45; // Ước lượng độ dài trung bình

  const scored = corpus.map(doc => {
    const dTokens = tokenizeWithScience(`${doc.topic || ''} ${doc.content || ''}`);
    const docLen = dTokens.length;
    let bm25 = 0;
    
    // Đếm tần suất từ trong tài liệu
    const tfMap = {};
    for (const t of dTokens) tfMap[t] = (tfMap[t] || 0) + 1;

    for (const qTerm of tokens) {
      const tf = tfMap[qTerm] || 0;
      if (tf > 0) {
        const idf = idfWeights[qTerm] || 2.5;
        const numerator = tf * (k1 + 1);
        const denominator = tf + k1 * (1 - b + b * (docLen / avgDocLen));
        bm25 += idf * (numerator / denominator);
      }
    }
    // Chuẩn hóa BM25 về thang [0, 1]
    const normBM25 = Math.min(1.0, bm25 / 15.0);
    return { id: doc.id, score: normBM25, subject: doc.subject };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

function retrieveVariant5(query, k = 5) {
  // + Topic Query Expansion
  let expandedQuery = query;
  const qLower = query.toLowerCase();

  if (qLower.includes('este') || qLower.includes('axit') || qLower.includes('ancol') || qLower.includes('lipit')) {
    expandedQuery += ' este lipit este hóa thủy phân xà phòng hóa';
  } else if (qLower.includes('con lắc') || qLower.includes('dao động') || qLower.includes('chu kỳ')) {
    expandedQuery += ' dao động điều hòa con lắc đơn lò xo chu kỳ tần số';
  } else if (qLower.includes('tích phân') || qLower.includes('nguyên hàm') || qLower.includes('diện tích')) {
    expandedQuery += ' giải tích tích phân nguyên hàm diện tích hình phẳng thể tích';
  } else if (qLower.includes('menđen') || qLower.includes('alen') || qLower.includes('gen') || qLower.includes('lai')) {
    expandedQuery += ' quy luật di truyền menđen phân ly độc lập tương tác gen';
  }

  const tokens = tokenizeWithScience(expandedQuery);
  const qVec = buildTFIDF(tokens);

  const scored = corpus.map(doc => {
    const dTokens = tokenizeWithScience(`${doc.topic || ''} ${doc.content || ''}`);
    const dVec = buildTFIDF(dTokens);
    const score = cosineSim(qVec, dVec);
    return { id: doc.id, score, subject: doc.subject };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

function retrieveVariant6Optimal(query, k = 5) {
  // Variant 6: Pipeline Lai Tối Ưu (Optimal Hybrid)
  // Kết hợp: Text Normalizer + Khoa học + Không dấu phụ + BM25 saturation + Phân loại môn học
  const tokens = tokenizeWithScience(query);
  const qVec = buildTFIDF(tokens);
  const qUnaccent = stripVietnamese(query).split(/\s+/).filter(t => t.length > 1);

  // Nhận diện từ khóa môn học để ưu tiên phân loại
  const qLower = query.toLowerCase();
  let explicitSubj = null;
  if (qLower.includes('hóa') || qLower.includes('este') || qLower.includes('axit') || qLower.includes('phản ứng') || qLower.includes('nguyên tử')) explicitSubj = 'hoa';
  else if (qLower.includes('lý') || qLower.includes('sóng') || qLower.includes('dao động') || qLower.includes('thấu kính') || qLower.includes('điện')) explicitSubj = 'ly';
  else if (qLower.includes('toán') || qLower.includes('tích phân') || qLower.includes('hàm số') || qLower.includes('parabol') || qLower.includes('đạo hàm')) explicitSubj = 'toan';
  else if (qLower.includes('sinh') || qLower.includes('adn') || qLower.includes('menđen') || qLower.includes('gen') || qLower.includes('tế bào')) explicitSubj = 'sinh';

  const scored = corpus.map(doc => {
    const dTokens = tokenizeWithScience(`${doc.topic || ''} ${doc.content || ''}`);
    const dVec = buildTFIDF(dTokens);
    const cosSim = cosineSim(qVec, dVec);

    // Tính điểm không dấu
    const dUnaccent = stripVietnamese(`${doc.topic || ''} ${doc.content || ''}`);
    let unaccentMatches = 0;
    for (const ut of qUnaccent) {
      if (dUnaccent.includes(ut)) unaccentMatches++;
    }
    const unaccentScore = qUnaccent.length > 0 ? (unaccentMatches / qUnaccent.length) : 0;

    // Kết hợp Cosine TF-IDF chuẩn hóa và Không dấu
    const normCos = Math.min(1.0, cosSim / 0.50);
    let hybridScore = (0.65 * normCos) + (0.35 * unaccentScore);

    // Ưu tiên môn học nếu trùng khớp
    if (explicitSubj && doc.subject === explicitSubj) {
      hybridScore *= 1.25;
    }

    const finalScore = Math.min(1.0, hybridScore);
    return { id: doc.id, score: finalScore, subject: doc.subject };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

// ─────────────────────────────────────────────────────────────────────────────
// CHẠY THỰC NGHIỆM ĐO ĐẠC CHO TOÀN BỘ 7 BIẾN THỂ
// ─────────────────────────────────────────────────────────────────────────────

const VARIANTS = [
  { name: 'Variant 0 (Baseline Raw TF-IDF)', fn: retrieveVariant0 },
  { name: 'Variant 1 (+ Science Text Normalizer)', fn: retrieveVariant1 },
  { name: 'Variant 2 (+ Unaccented Auxiliary Matching)', fn: retrieveVariant2 },
  { name: 'Variant 3 (+ Word Bigrams)', fn: retrieveVariant3 },
  { name: 'Variant 4 (+ BM25 Saturation)', fn: retrieveVariant4 },
  { name: 'Variant 5 (+ Topic Query Expansion)', fn: retrieveVariant5 },
  { name: 'Variant 6 (Optimal Hybrid Pipeline)', fn: retrieveVariant6Optimal }
];

console.log('🔬 === ĐANG THỰC NGHIỆM ĐO ĐẠC 7 BIẾN THỂ TRUY XUẤT TRÊN DEV SET ===\n');

const resultsTable = [];

for (const variant of VARIANTS) {
  let r1Count = 0;
  let r3Count = 0;
  let r5Count = 0;
  let sumRR = 0;

  const inScopeScores = [];
  const oosScores = [];

  // 1. Đo lường trên In-Scope (n=60)
  for (const q of inScopeQueries) {
    const hits = variant.fn(q.query, 5);
    const topScore = hits[0]?.score || 0;
    inScopeScores.push(topScore);

    let rank = 0;
    for (let i = 0; i < hits.length; i++) {
      if (q.expectedChunkIds.includes(hits[i].id)) {
        rank = i + 1;
        break;
      }
    }

    if (rank === 1) r1Count++;
    if (rank >= 1 && rank <= 3) r3Count++;
    if (rank >= 1 && rank <= 5) r5Count++;
    if (rank > 0) sumRR += (1 / rank);
  }

  // 2. Đo lường trên Out-of-Scope (n=20)
  for (const q of oosQueries) {
    const hits = variant.fn(q.query, 5);
    const topScore = hits[0]?.score || 0;
    oosScores.push(topScore);
  }

  // 3. Tính toán các chỉ số
  const nInScope = inScopeQueries.length;
  const nOos = oosQueries.length;

  const r1Pct = ((r1Count / nInScope) * 100).toFixed(2);
  const r3Pct = ((r3Count / nInScope) * 100).toFixed(2);
  const r5Pct = ((r5Count / nInScope) * 100).toFixed(2);
  const mrr = (sumRR / nInScope).toFixed(4);

  // Phân tầng theo ngưỡng: Grounded (>= 0.30), Weak (0.15 - 0.29), Ungrounded (< 0.15)
  const inScopeGrounded = inScopeScores.filter(s => s >= 0.30).length;
  const inScopeWeak = inScopeScores.filter(s => s >= 0.15 && s < 0.30).length;
  const inScopeUngrounded = inScopeScores.filter(s => s < 0.15).length;

  const oosGrounded = oosScores.filter(s => s >= 0.30).length;
  const oosWeak = oosScores.filter(s => s >= 0.15 && s < 0.30).length;
  const oosUngrounded = oosScores.filter(s => s < 0.15).length;

  // Với ngưỡng ngắt an toàn tại T = 0.30 (Hoặc T = 0.15 cho lọc mềm):
  // Tiêu chí đánh giá tại T = 0.15:
  const trueAcceptInScope = inScopeScores.filter(s => s >= 0.15).length;
  const falseRejectInScope = inScopeScores.filter(s => s < 0.15).length;
  const trueRejectOos = oosScores.filter(s => s < 0.15).length;
  const falseAcceptOos = oosScores.filter(s => s >= 0.15).length;

  const tpr = trueAcceptInScope / nInScope;
  const tnr = trueRejectOos / nOos;
  const fpr = falseAcceptOos / nOos;
  const balancedAcc = (((tpr + tnr) / 2) * 100).toFixed(2);

  const auc = calculateAUC(inScopeScores, oosScores);

  resultsTable.push({
    variant: variant.name,
    recall1: `${r1Pct}% (${r1Count}/${nInScope})`,
    recall3: `${r3Pct}% (${r3Count}/${nInScope})`,
    recall5: `${r5Pct}% (${r5Count}/${nInScope})`,
    mrr: mrr,
    auc: auc.toFixed(4),
    balancedAcc: `${balancedAcc}%`,
    inScopeDist: `G:${inScopeGrounded} | W:${inScopeWeak} | U:${inScopeUngrounded}`,
    oosDist: `G:${oosGrounded} | W:${oosWeak} | U:${oosUngrounded}`,
    rawMetrics: {
      r1Count, r3Count, r5Count, sumRR,
      inScopeGrounded, inScopeWeak, inScopeUngrounded,
      oosGrounded, oosWeak, oosUngrounded,
      trueAcceptInScope, falseRejectInScope, trueRejectOos, falseAcceptOos,
      tpr, tnr, fpr, balancedAcc: parseFloat(balancedAcc), auc
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// IN BẢNG BÁO CÁO VÀ LƯU KẾT QUẢ THỰC NGHIỆM
// ─────────────────────────────────────────────────────────────────────────────

console.log('========================================================================================================================');
console.log('📊 BẢNG TỔNG HỢP SO SÁNH CÁC BIẾN THỂ CẢI TIẾN TRUY XUẤT RAG TRÊN TẬP DEV (n=80)');
console.log('========================================================================================================================');
console.table(resultsTable.map(r => ({
  'Biến Thể': r.variant,
  'Recall@1': r.recall1,
  'Recall@3': r.recall3,
  'Recall@5': r.recall5,
  'MRR': r.mrr,
  'ROC AUC': r.auc,
  'Balanced Acc': r.balancedAcc,
  'In-Scope (G/W/U)': r.inScopeDist,
  'OOS (G/W/U)': r.oosDist
})));

const outPath = path.resolve('reports/retrieval_variants_benchmark.json');
fs.writeFileSync(outPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  dataset: 'rag_chunk_benchmark_60.json (Dev Set)',
  totalDevQueries: 80,
  inScopeCount: 60,
  oosCount: 20,
  predefinedCriteria: 'Tối đa hóa Balanced Accuracy giữa In-Scope Acceptance và OOS Rejection với FPR (chấp nhận OOS) <= 5.0%',
  results: resultsTable
}, null, 2), 'utf8');

console.log(`\n💾 Đã lưu toàn bộ số liệu đo lường thô tại: ${outPath}`);

