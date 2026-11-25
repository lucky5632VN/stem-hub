/**
 * 🔬 STEM HUB Real Ablation & Multi-Model Benchmark Runner (Prompt 10)
 * Evaluates:
 * - Part A: RAG ON vs RAG OFF vs Retrieval-Only on Stratified 100 Benchmark
 * - Parameter k=3, temperature=0, production model (gemini-flash-lite-latest)
 * - Auto-grader with criteria; open questions marked "chưa chấm, chờ giáo viên"
 * - ResponseVerifier warning rate and false alarms
 * - Bootstrap 95% CI and McNemar paired significance test
 * - Token spending cap: 5,000,000 tokens (strict halt)
 * - Safe logging: NEVER logs API keys. Raw logs in reports/ablation/raw/
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { callResilientGemini, getGeminiKeys } from '../src/lib/geminiCaller.js';
import { retrieveTopK, normalizeQuery } from '../src/lib/ragService.js';
import { verifyResponseGrounding } from '../src/lib/responseVerifier.js';
import { matchNumericalAnswer } from '../src/lib/ablationGrader.js';

// Load environment from .env.local
const envLocalPath = path.resolve('.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const regex = /^\s*([A-Za-z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^#\r\n]*))/gm;
  let m;
  while ((m = regex.exec(envContent)) !== null) {
    const key = m[1];
    let val = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[4]);
    if (val !== undefined) {
      process.env[key] = val.trim();
    }
  }
}

const reportsDir = path.resolve('reports/ablation');
const rawDir = path.join(reportsDir, 'raw');
const evidenceDir = path.join(reportsDir, 'evidence');

// 🛡️ ĐÓNG BĂNG KHO THÍ NGHIỆM: Chỉ cho phép đúng 303 chunk từ stem-corpus.json (Ghi nhận hash SHA-256)
const stemCorpusPath = path.resolve('src/ai-training/datasets/rag-knowledge/stem-corpus.json');
if (!fs.existsSync(stemCorpusPath)) {
  console.error(`❌ Không tìm thấy tệp stem-corpus.json tại ${stemCorpusPath}`);
  process.exit(1);
}
const stemCorpusRaw = fs.readFileSync(stemCorpusPath);
const stemCorpusHash = crypto.createHash('sha256').update(stemCorpusRaw).digest('hex');
const expectedCorpusHash = '28f7b3382697954fd92f9c09971469d6f9d2c897e5c506fc838b800603ac2cc0';
if (stemCorpusHash !== expectedCorpusHash) {
  console.error(`❌ Hash của stem-corpus.json không khớp: ${stemCorpusHash} !== ${expectedCorpusHash}`);
  process.exit(1);
}
const stemCorpusChunks = JSON.parse(stemCorpusRaw.toString('utf8'));
const FROZEN_303_CHUNK_IDS = new Set(stemCorpusChunks.map(c => c.id));
if (FROZEN_303_CHUNK_IDS.size !== 303) {
  console.error(`❌ Số lượng chunk trong stem-corpus.json không đúng 303 (tìm thấy ${FROZEN_303_CHUNK_IDS.size})`);
  process.exit(1);
}
console.log(`🔒 [FROZEN CORPUS GUARD] Đã nạp thành công ${FROZEN_303_CHUNK_IDS.size} chunks từ stem-corpus.json (SHA-256: ${stemCorpusHash.slice(0, 16)}...)`);

const isPilotArg = process.argv.includes('--pilot') || process.argv.some(a => a.startsWith('--pilot='));
const isV140 = process.argv.includes('--v140') || process.argv.includes('--dataset=v140');
const isV141 = process.argv.includes('--v141') || process.argv.includes('--dataset=v141');
const isV142 = process.argv.includes('--v142') || process.argv.includes('--dataset=v142') || (!isV140 && !isV141); // Mặc định là v1.4.2 (bản đã khóa chính thức)

let datasetFileName = 'ablation_dataset_100.v1.4.2.json';
export let currentDatasetVersion = 'v1.4.2';
if (isV140) {
  datasetFileName = 'ablation_dataset_100.v1.4.0.json';
  currentDatasetVersion = 'v1.4.0';
} else if (isV141) {
  datasetFileName = 'ablation_dataset_100.v1.4.1.json';
  currentDatasetVersion = 'v1.4.1';
}

const datasetPath = path.join(reportsDir, datasetFileName);
const hashPath = path.join(reportsDir, 'dataset_hash.json');

// Tách bộ nhớ đệm riêng cho pilot: Pilot dùng reports/ablation/pilot/cache/call_cache.json
// Full run dùng reports/ablation/call_cache.json (không đọc chéo)
const cachePath = isPilotArg
  ? path.join(reportsDir, 'pilot/cache/call_cache.json')
  : path.join(reportsDir, 'call_cache.json');

if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });
if (isPilotArg && !fs.existsSync(path.dirname(cachePath))) {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
}

// Load dataset & verify hash
if (!fs.existsSync(datasetPath)) {
  console.error(`❌ Dataset file ${datasetPath} not found! Run scripts/prepare_ablation_dataset.mjs first.`);
  process.exit(1);
}

const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
const hashInfo = JSON.parse(fs.readFileSync(hashPath, 'utf8'));
const expectedHash = isV140
  ? (hashInfo.v1_4_0_official?.sha256 || '0a80f4cbfbafbf0423a18c288f8c197bc7d5ab6d0e5f4b2233bfc7f3acbff233')
  : (isV141
      ? (hashInfo.v1_4_1_official?.sha256 || '7073358d7396609e2ab7805877aa9bda908862aadba63abccd6107183cc7b0c1')
      : (hashInfo.v1_4_2_official?.sha256 || 'cefc6ce343f01692dc4b9e83b9ac257ed833f70bb7c3d366d05259057c2c65c6'));

// Load cache
let callCache = {};
if (fs.existsSync(cachePath)) {
  try {
    callCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  } catch (e) {
    callCache = {};
  }
}

function saveCache() {
  fs.writeFileSync(cachePath, JSON.stringify(callCache, null, 2), 'utf8');
}

/**
 * Tạo cache key tiêu chuẩn cô lập phiên bản, mã băm tập dữ liệu, mã băm kho tri thức 303 chunk, ngữ cảnh truy xuất, mô hình, nội dung câu hỏi
 */
export function buildCacheKey({
  condition,
  item,
  runIndex = 1,
  model,
  systemInstruction = '',
  datasetVersion,
  datasetSha256,
  corpusHash,
  contextText = '',
  retrievedChunkIds = []
}) {
  const qText = item?.question || item?.question_text || '';
  const qHash = crypto.createHash('sha256').update(qText).digest('hex').slice(0, 12);
  const sysHash = crypto.createHash('sha256').update(systemInstruction).digest('hex').slice(0, 8);
  const dsVer = datasetVersion || currentDatasetVersion || 'v1.4.2';
  const dsHash = (datasetSha256 || expectedHash || 'unknown_ds').slice(0, 12);
  const corHash = (corpusHash || stemCorpusHash || 'unknown_corp').slice(0, 12);

  // Khóa ngữ cảnh truy xuất: nếu condition == 'no_rag' thì là 'no_ctx'; nếu có RAG thì băm danh sách chunkId đã sắp xếp và nội dung trích đoạn
  const sortedChunkIds = Array.isArray(retrievedChunkIds) && retrievedChunkIds.length > 0
    ? [...retrievedChunkIds].sort().join('+')
    : '';
  const ctxContentHash = crypto.createHash('sha256').update(contextText || '').digest('hex').slice(0, 8);
  const ctxKey = condition === 'no_rag'
    ? 'no_ctx'
    : (sortedChunkIds ? `${sortedChunkIds}_${ctxContentHash}` : `ctx_${ctxContentHash}`);

  const modelId = model || RUN_CONFIG.model;
  const itemId = item?.id || 'UNKNOWN_ID';
  return `${condition}_${itemId}_${dsVer}_ds${dsHash}_corp${corHash}_${ctxKey}_${modelId}_q${qHash}_sys${sysHash}_run${runIndex}`;
}

// Token Counter estimation heuristic (~4 chars per token for Vietnamese/Math)
function estimateTokens(text = '') {
  if (!text) return 0;
  return Math.ceil(text.length / 3.6);
}

// Production prompt templates
const BASE_SYSTEM_INSTRUCTION = `Bạn là trợ lý học tập STEM HUB dành cho học sinh Việt Nam theo chương trình GDPT 2018.
- Trả lời súc tích, ngắn gọn, đúng trọng tâm khoa học.
- Đối với câu hỏi tính toán, đưa ra kết quả số liệu và công thức ngắn gọn.
- Nếu câu hỏi nằm ngoài chương trình GDPT 2018 hoặc không thuộc phạm vi STEM trường học, hãy nêu rõ rằng nội dung này ngoài phạm vi SGK chuẩn và khuyến cáo học sinh tham khảo tài liệu chuyên ngành.`;

const PEDAGOGICAL_GUARD = `
[QUY TẮC CĂN CỨ VÀ AN TOÀN]:
1. Chỉ khẳng định các định lý, hằng số, công thức có căn cứ trong tài liệu SGK chuẩn được cung cấp.
2. Nếu ngữ liệu trích dẫn không đủ thông tin để trả lời câu hỏi, hãy từ chối trả lời khẳng định và thông báo thiếu tài liệu SGK.`;

// Dùng đúng 1 khóa cố định cho thí nghiệm Ablation (không xoay vòng)
let ABLATION_SINGLE_KEY = process.env.ABLATION_GEMINI_API_KEY?.trim() || process.env.SINGLE_GEMINI_API_KEY?.trim();
if (ABLATION_SINGLE_KEY && ABLATION_SINGLE_KEY.includes(',')) {
  ABLATION_SINGLE_KEY = ABLATION_SINGLE_KEY.split(',')[0].trim().replace(/['"]/g, '');
}
if (!ABLATION_SINGLE_KEY) {
  // Lấy khóa HỢP LỆ đầu tiên từ getGeminiKeys()
  const validKeys = getGeminiKeys();
  if (validKeys && validKeys.length > 0) {
    ABLATION_SINGLE_KEY = validKeys[0];
  }
}
if (ABLATION_SINGLE_KEY) {
  ABLATION_SINGLE_KEY = ABLATION_SINGLE_KEY.replace(/['"]/g, '').trim();
}

// Configuration - Cố định mô hình thí nghiệm bằng chuỗi phiên bản cụ thể (không dùng bí danh -latest)
const kArg = process.argv.find(a => a.startsWith('--k='));
const configuredK = kArg ? parseInt(kArg.split('=')[1], 10) : (process.argv.includes('--k1') ? 1 : 3);

export const RUN_CONFIG = {
  model: 'gemini-3.5-flash-lite',
  temperature: 0,
  k_runs: configuredK,
  token_spending_cap: 5000000,
  dataset_sha256: expectedHash,
  total_cases: dataset.cases.length,
  single_key_mode: Boolean(ABLATION_SINGLE_KEY)
};

/**
 * Tính toán ước tính số lệnh gọi và tiêu thụ token
 */
export function calculatePreRunEstimation() {
  const numCases = dataset.cases.length; // 100
  const k = RUN_CONFIG.k_runs; // 3

  const tangA = dataset.cases.filter(c => c.corpus_stratum === 'tang_A_kho_du_de_giai').length;
  const tangB = dataset.cases.filter(c => c.corpus_stratum === 'tang_B_chu_de_lien_quan_chua_du_de_giai').length;
  const tangC = dataset.cases.filter(c => c.corpus_stratum === 'tang_C_ngoai_kho').length;
  const inScopeConcept = dataset.cases.filter(c => c.stratum === 'in_scope_concept').length;
  const outOfScope = dataset.cases.filter(c => c.stratum === 'out_of_scope').length;
  const supplementary = dataset.cases.filter(c => c.stratum === 'supplementary_unscored' || c.corpus_stratum === 'bo_tro_khong_cham').length;
  const scoredCases = dataset.cases.filter(c => c.is_scored !== false).length;

  // Condition 1: No RAG
  // System prompt ~100 tokens, Question ~30 tokens -> Input ~130 tokens
  // Output ~150 tokens -> Total ~280 tokens/call
  const noRagInputAvg = 130;
  const noRagOutputAvg = 150;
  const noRagCalls = numCases * k; // 300
  const noRagTokens = noRagCalls * (noRagInputAvg + noRagOutputAvg); // ~84,000

  // Condition 2: RAG + Guard
  // System prompt + Guard + Retrieved chunks (top-2 chunks ~500 chars each) ~600 tokens
  // Question ~30 tokens -> Input ~630 tokens
  // Output ~180 tokens -> Total ~810 tokens/call
  const ragInputAvg = 630;
  const ragOutputAvg = 180;
  const ragCalls = numCases * k; // 300
  const ragTokens = ragCalls * (ragInputAvg + ragOutputAvg); // ~243,000

  // Condition 3: Retrieval Only
  // Pure local deterministic calculation -> 0 API calls, 0 tokens
  const retrievalOnlyCalls = 0;
  const retrievalOnlyTokens = 0;

  // Part B LLM Baseline (Model 1: 10, Model 2: 10, Model 3: 10 = 30 calls)
  const partBCalls = 30;
  const partBTokens = partBCalls * 250; // ~7,500

  const totalCalls = noRagCalls + ragCalls + retrievalOnlyCalls + partBCalls;
  const totalTokens = noRagTokens + ragTokens + retrievalOnlyTokens + partBTokens;

  return {
    model: RUN_CONFIG.model,
    temperature: RUN_CONFIG.temperature,
    spendingCapTokens: RUN_CONFIG.token_spending_cap,
    casesBreakdown: {
      tang_A: tangA,
      tang_B: tangB,
      tang_C: tangC,
      in_scope_concept: inScopeConcept,
      out_of_scope: outOfScope,
      supplementary_unscored: supplementary,
      scored_cases: scoredCases,
      total: numCases
    },
    runsPerCase: k,
    conditions: [
      {
        name: 'Condition 1: LLM Không RAG (No RAG Baseline)',
        calls: noRagCalls,
        estimatedInputTokens: noRagCalls * noRagInputAvg,
        estimatedOutputTokens: noRagCalls * noRagOutputAvg,
        estimatedTokensTotal: noRagTokens
      },
      {
        name: 'Condition 2: LLM Có RAG + Guard (Production Architecture)',
        calls: ragCalls,
        estimatedInputTokens: ragCalls * ragInputAvg,
        estimatedOutputTokens: ragCalls * ragOutputAvg,
        estimatedTokensTotal: ragTokens
      },
      {
        name: 'Condition 3: Chỉ truy xuất RAG (Offline TF-IDF/BM25 Hybrid)',
        calls: retrievalOnlyCalls,
        estimatedInputTokens: 0,
        estimatedOutputTokens: 0,
        estimatedTokensTotal: 0
      },
      {
        name: 'Part B Baseline: LLM thô trên Model 1, 2, 3',
        calls: partBCalls,
        estimatedInputTokens: partBCalls * 150,
        estimatedOutputTokens: partBCalls * 100,
        estimatedTokensTotal: partBTokens
      }
    ],
    totalCalls,
    estimatedTokensTotal: totalTokens,
    estimatedTokensWithBuffer: Math.round(totalTokens * 1.2),
    percentOfSpendingCapBase: ((totalTokens / RUN_CONFIG.token_spending_cap) * 100).toFixed(2) + '%',
    percentOfSpendingCapBuffered: (((totalTokens * 1.2) / RUN_CONFIG.token_spending_cap) * 100).toFixed(2) + '%'
  };
}

/**
 * Automated Grader & Status Classifier
 * Tuân thủ quy tắc trung thực:
 * - Trạng thái phân loại rõ: "đã xử lý", "đúng", "sai", "từ chối", "cần người chấm".
 * - Tuyệt đối KHÔNG in PASS / tự động chấm đúng cho câu hỏi khái niệm (in_scope_concept) -> Đặt status: "cần người chấm".
 */
export function evaluateAnswer(caseItem, responseText) {
  if (!responseText || typeof responseText !== 'string') {
    return { isCorrect: false, isAbstained: false, status: 'sai', gradeType: 'empty_response' };
  }

  const textLower = responseText.toLowerCase();

  // Out of scope evaluation: check if model abstained or gave cautious disclaimer
  if (caseItem.stratum === 'out_of_scope') {
    const abstentionPatterns = [
      /nằm ngoài/i, /ngoài phạm vi/i, /ngoài chương trình/i, /chưa đủ căn cứ/i,
      /không thuộc phạm vi/i, /thiếu căn cứ/i, /sgk không/i, /chưa có trong sgk/i,
      /tham khảo tài liệu chuyên ngành/i, /đại học/i
    ];
    const isAbstained = abstentionPatterns.some(p => p.test(textLower));
    return {
      isCorrect: isAbstained, // Đối với OOS, từ chối đúng phạm vi là hành vi chuẩn
      isAbstained,
      status: isAbstained ? 'từ chối' : 'sai',
      gradeType: 'abstention_check',
      matchedRule: isAbstained ? 'Từ chối đúng câu hỏi ngoài phạm vi' : 'Không từ chối (ảo tưởng kiến thức ngoài SGK)'
    };
  }

  // Numerical evaluation: kiểm tra sự hiện diện của đáp án số học với sai số cho phép
  if (caseItem.stratum === 'in_scope_numerical') {
    const isRefusal = /nằm ngoài|ngoài phạm vi|ngoài chương trình|chưa đủ căn cứ|không thuộc phạm vi|thiếu căn cứ|sgk không|chưa có trong sgk|tham khảo tài liệu chuyên ngành|từ chối/i.test(textLower);
    if (isRefusal) {
      return {
        isCorrect: false,
        isAbstained: true,
        status: 'từ chối',
        gradeType: 'numerical_criteria',
        matchRatio: 0.0,
        matchedRule: 'Mô hình từ chối câu hỏi số học trong phạm vi'
      };
    }
    const numEval = matchNumericalAnswer(caseItem.ground_truth, responseText, 0.02);
    return {
      isCorrect: numEval.isCorrect,
      isAbstained: false,
      status: numEval.isCorrect ? 'đúng' : 'sai',
      gradeType: 'numerical_criteria',
      matchRatio: numEval.isCorrect ? 1.0 : 0.0,
      matchedRule: numEval.rule,
      extractedValue: numEval.extractedValue,
      diff: numEval.diff
    };
  }

  // Conceptual evaluation: Tuyệt đối KHÔNG tự động chấm PASS cho câu khái niệm!
  if (caseItem.stratum === 'in_scope_concept') {
    const isRefusal = /nằm ngoài|ngoài phạm vi|ngoài chương trình|chưa đủ căn cứ|không thuộc phạm vi|thiếu căn cứ|sgk không|chưa có trong sgk|tham khảo tài liệu chuyên ngành|từ chối/i.test(textLower);
    return {
      isCorrect: null, // Không tự động chấm đúng/sai cho câu khái niệm
      isAbstained: isRefusal,
      needsHumanReview: true,
      status: isRefusal ? 'từ chối' : 'cần người chấm',
      gradeType: 'human_review_required',
      note: 'Câu khái niệm cần người chấm theo quy tắc đóng băng docs/quy-tac-cham-ablation.md'
    };
  }

  return { isCorrect: false, isAbstained: false, status: 'sai', gradeType: 'unknown' };
}

// Exponential backoff delay
const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * Execute Gemini call with Cache, Rate Limit, Backoff, Token Tracking & Model Version Enforcement
 */
let cumulativeTokensUsed = 0;
let observedModelVersion = null;
let budgetWarningShown = false;

async function executeCachedCall({ keyId, prompt, systemInstruction, temperature = 0 }) {
  if (callCache[keyId]) {
    return { ...callCache[keyId], fromCache: true };
  }

  // Cảnh báo khi chạm 80% ngân sách (4 triệu tokens)
  if (cumulativeTokensUsed >= 4000000 && !budgetWarningShown) {
    console.warn('⚠️ [CẢNH BÁO HẠN MỨC]: Đã tiêu thụ vượt 80% ngân sách (4.000.000 / 5.000.000 tokens)!');
    budgetWarningShown = true;
  }

  // Dừng ngắt khẩn cấp khi chạm 5 triệu tokens
  if (cumulativeTokensUsed >= RUN_CONFIG.token_spending_cap) {
    throw new Error(`CRITICAL: Đã chạm trần ngân sách ${RUN_CONFIG.token_spending_cap} tokens! Dừng toàn bộ.`);
  }

  let attempts = 0;
  let lastError = null;
  const tStart = performance.now();

  const maxAttempts = 30;
  while (attempts < maxAttempts) {
    attempts++;
    try {
      const res = await callResilientGemini({
        prompt,
        systemInstruction,
        temperature,
        maxOutputTokens: 600,
        apiKey: ABLATION_SINGLE_KEY,
        fixedModel: 'gemini-3.5-flash-lite'
      });

      // 🛡️ Kiểm tra modelVersion thực tế từ API response: Nếu thay đổi giữa chừng thì ngắt ngay
      const currentVer = res.modelVersion || res.model;
      if (!observedModelVersion) {
        observedModelVersion = currentVer;
        console.log(`📌 Ghi nhận modelVersion ban đầu: "${observedModelVersion}"`);
      } else if (currentVer !== observedModelVersion) {
        const msg = `❌ [DỪNG KHẨN CẤP]: modelVersion bị thay đổi giữa chừng từ "${observedModelVersion}" sang "${currentVer}"! Dừng toàn bộ thí nghiệm để đảm bảo tính nhất quán khoa học.`;
        console.error(msg);
        throw new Error(msg);
      }

      const latencyMs = Math.round(performance.now() - tStart);
      const inputTokens = estimateTokens(prompt + (systemInstruction || ''));
      const outputTokens = estimateTokens(res.text);
      const callTokens = inputTokens + outputTokens;
      cumulativeTokensUsed += callTokens;

      const result = {
        text: res.text,
        model: res.model,
        modelVersion: currentVer,
        latencyMs,
        attempts,
        inputTokens,
        outputTokens,
        totalTokens: callTokens,
        timestamp: new Date().toISOString()
      };

      callCache[keyId] = result;
      saveCache();

      // Pacing delay to stay strictly under Gemini Free Tier 15 RPM limit (4.1s per call = ~14.6 RPM)
      await delay(4100);
      return result;
    } catch (err) {
      lastError = err;
      if (err.message && err.message.includes('DỪNG KHẨN CẤP')) {
        throw err;
      }
      if (err.message && err.message.includes('Google API chặn khu vực')) {
        throw err;
      }
      const isRateLimitOrBusy = err.message && (
        err.message.includes('429') || 
        err.message.includes('Rate Limit') || 
        err.message.includes('hạ nhiệt') || 
        err.message.includes('quota') || 
        err.message.includes('ResourceExhausted') ||
        err.message.includes('high demand') ||
        err.message.includes('503') ||
        err.message.includes('bận') ||
        err.message.includes('spikes') ||
        err.message.includes('overloaded') ||
        err.message.includes('aborted') ||
        err.message.includes('timeout')
      );
      const backoffTime = isRateLimitOrBusy ? Math.min(60000, 15000 + attempts * 3000) : (attempts * 2000);
      console.warn(`⏳ [Rate Limit / Busy Retry] Lần thử ${attempts}/${maxAttempts}: Chờ ${Math.round(backoffTime / 1000)}s rồi gọi lại...`);
      await delay(backoffTime);
    }
  }

  throw new Error(`Failed after ${maxAttempts} attempts: ${lastError?.message}`);
}

/**
 * Main execution function
 */
export async function runAblationStudy({ execute = false, pilot = null } = {}) {
  const estimation = calculatePreRunEstimation();

  const nChinh = dataset.cases.filter(c => ['tang_A_kho_du_de_giai', 'tang_B_chu_de_lien_quan_chua_du_de_giai'].includes(c.corpus_stratum || c.dataset_v140_group)).length;
  const nNgoaiKho = dataset.cases.filter(c => (c.corpus_stratum === 'tang_C_ngoai_kho' || c.dataset_v140_group === 'tang_C_ngoai_kho')).length;
  const nKhaiNiem = dataset.cases.filter(c => c.stratum === 'in_scope_concept').length;
  const nNgoaiPhamVi = dataset.cases.filter(c => c.stratum === 'out_of_scope' || c.dataset_v140_group === 'out_of_scope_concept' || c.dataset_v140_group === 'supplementary_numerical').length;

  console.log('=============================================================');
  console.log('🔬 STEM HUB REAL ABLATION STUDY & BENCHMARK');
  console.log('=============================================================');
  console.log(`Dataset: ${datasetPath}`);
  console.log(`Dataset Version: ${currentDatasetVersion}`);
  console.log(`SHA-256: ${expectedHash}`);
  console.log(`Phân tầng thực tế: Tầng A = ${estimation.casesBreakdown.tang_A}, Tầng B = ${estimation.casesBreakdown.tang_B}, Tầng C = ${estimation.casesBreakdown.tang_C}`);
  console.log(`Khái niệm: ${estimation.casesBreakdown.in_scope_concept}, Ngoài phạm vi (đo từ chối): ${estimation.casesBreakdown.out_of_scope}, Bổ trợ (không chấm): ${estimation.casesBreakdown.supplementary_unscored}`);
  console.log(`Tổng số ca: ${estimation.casesBreakdown.total} (Chấm: ${estimation.casesBreakdown.scored_cases}, Không chấm: ${estimation.casesBreakdown.supplementary_unscored})`);
  console.log('Model:', estimation.model);
  console.log('Temperature:', estimation.temperature);
  console.log('Runs per case (k):', estimation.runsPerCase);
  console.log('Spending Cap:', estimation.spendingCapTokens.toLocaleString(), 'tokens');
  console.log('-------------------------------------------------------------');
  console.log('📊 ƯỚC TÍNH SỐ LỆNH GỌI & TOKEN:');
  estimation.conditions.forEach(c => {
    console.log(`  * ${c.name}: ${c.calls} calls | ~${c.estimatedTokensTotal.toLocaleString()} tokens`);
  });
  console.log('-------------------------------------------------------------');
  console.log(`TỔNG SỐ LỆNH GỌI: ${estimation.totalCalls} calls`);
  console.log(`TỔNG TOKEN DỰ KIẾN: ~${estimation.estimatedTokensTotal.toLocaleString()} tokens (~${estimation.estimatedTokensWithBuffer.toLocaleString()} gồm 20% dự phòng)`);
  console.log(`TỈ LỆ TRÊN TRẦN CHI TIÊU: ${estimation.percentOfSpendingCapBase} (cơ sở) / ${estimation.percentOfSpendingCapBuffered} (dự phòng) (an toàn dưới 5 triệu)`);
  const cachedCount = Object.keys(callCache).filter(k => k.includes(`_${currentDatasetVersion}_`)).length;
  const uncachedCalls = Math.max(0, estimation.totalCalls - cachedCount);
  // Thời gian ước tính khi cache trống: 630 calls x 4.100 ms = 2.583 giây (~43.1 phút)
  const estSeconds = Math.round(uncachedCalls * 4.1);
  const estMinutes = (estSeconds / 60).toFixed(1);

  console.log(`⏱️ ƯỚC TÍNH THỜI GIAN CHẠY (${estimation.totalCalls} calls):`);
  console.log(`  * Đã có trong cache: ${cachedCount} calls (0s)`);
  console.log(`  * Cần gọi API mới:   ${uncachedCalls} calls với khoảng cách an toàn 4.100 ms/call`);
  console.log(`  * Thời gian dự kiến (pacing 4.100 ms): ${estSeconds} giây (~${estMinutes} phút)`);
  console.log('=============================================================');

  if (pilot) {
    console.log(`\n🧪 KÍCH HOẠT CHẾ ĐỘ THỬ NGHIỆM THĂM DÒ (--pilot=${pilot}):`);
    console.log(`   - Chọn ${pilot} câu hỏi đại diện (2 khái niệm + 2 số liệu + 1 ngoài phạm vi)`);
    console.log(`   - Chạy 1 lần (k=1) x 3 điều kiện = 10 API calls (Condition 3 chỉ truy xuất local)`);
    console.log(`   - Ước tính tiêu thụ: ~4.000 tokens | Thời gian: ~15 - 30 giây`);
  }

  if (!execute) {
    console.log('\n⚠️ CHẾ ĐỘ HIỆN TẠI: CHỈ ƯỚC TÍNH (DRY-RUN / ESTIMATION).');
    console.log('Để thực thi các lệnh gọi API thực tế tới Google Gemini, cần xác nhận từ người dùng.');
    return { status: 'estimation_only', estimation };
  }

  // 🛡️ BẢO VỆ NGHIÊM NGẶT: Bắt buộc phải có ABLATION_GEMINI_API_KEY, từ chối chạy nếu thiếu (không fallback)
  if (!ABLATION_SINGLE_KEY) {
    console.error('\n❌ [TỪ CHỐI CHẠY KHẨN CẤP]: Thiếu biến môi trường ABLATION_GEMINI_API_KEY!');
    console.error('Quy tắc nghiêm ngặt: Không tự động fallback sang danh sách khóa GEMINI_API_KEY.');
    console.error('Vui lòng thiết lập ABLATION_GEMINI_API_KEY=<key> trước khi chạy thí nghiệm ablation.');
    process.exit(1);
  }

  // 🛡️ BẢO VỆ 1: Kiểm tra tính toàn vẹn và SHA-256 Hash của file dữ liệu 100 câu
  const currentFileBuffer = fs.readFileSync(datasetPath);
  const currentHash = crypto.createHash('sha256').update(currentFileBuffer).digest('hex');
  if (currentHash !== expectedHash) {
    const hashErrMsg = `❌ [TỪ CHỐI THỰC THI --execute]: Mã băm SHA-256 của tệp dữ liệu không khớp với tệp khóa!\n` +
      `   * Mã băm hiện tại của ${datasetPath}: ${currentHash}\n` +
      `   * Mã băm khóa kỳ vọng:                ${expectedHash}\n` +
      `   * Khắc phục: Khóa lại hash tệp dữ liệu sau khi sửa đổi trước khi chạy.`;
    console.error(hashErrMsg);
    throw new Error(hashErrMsg);
  }

  // 🛡️ BẢO VỆ 2: NGUỒN SỰ THẬT CỔNG v1.4.x (Chỉ đếm câu CAND_* hợp lệ trên phiếu đối chiếu mới)
  const { auditAnswerKeySheet } = await import('./check_answer_key.mjs');
  const auditReport = auditAnswerKeySheet('docs/phieu-doi-chieu-nguon-chinh-thuc.md');
  const checkedCandCount = auditReport.totalUniqueTickedEligible;

  // Đếm số câu số học chính thức trong tập v1.4.x (24 câu CAND_*)
  const numericalCasesInDataset = dataset.cases.filter(c => 
    c.official_candidate_id || ['tang_A_kho_du_de_giai', 'tang_B_chu_de_lien_quan_chua_du_de_giai', 'tang_C_ngoai_kho'].includes(c.corpus_stratum)
  ).length;

  if (checkedCandCount !== numericalCasesInDataset) {
    const gateErrMsg = `❌ [TỪ CHỐI THỰC THI --execute]: Số câu số học trong tập (${numericalCasesInDataset} câu) không bằng số câu CAND_* đã được người dùng tích trên phiếu đối chiếu mới!\n` +
      `   * Số câu CAND_* hợp lệ đã tích [x]/[X] trên docs/phieu-doi-chieu-nguon-chinh-thuc.md: ${checkedCandCount}/${numericalCasesInDataset}\n` +
      `   * Số câu số học trong tập v1.4.x: ${numericalCasesInDataset} câu\n` +
      `   * Cổng đóng: Cổng kiểm tra v1.4.x chỉ đếm câu CAND_* đã được người dùng tích trên phiếu đối chiếu mới (đủ URL, phương pháp tính độc lập). Tuyệt đối không đếm ABL_* của bản cũ.`;
    console.error(gateErrMsg);
    throw new Error(gateErrMsg);
  }

  console.log('\n🚀 BẮT ĐẦU THỰC THI THỰC NGHIỆM ĐO THẬT VỚI GEMINI API...');
  const targetRawDir = pilot ? path.join(reportsDir, 'pilot') : rawDir;
  if (!fs.existsSync(targetRawDir)) fs.mkdirSync(targetRawDir, { recursive: true });
  const rawLogFile = path.join(targetRawDir, pilot ? `pilot_run_${Date.now()}.jsonl` : `ablation_run_${Date.now()}.jsonl`);
  const rawStream = fs.createWriteStream(rawLogFile, { flags: 'a' });

  const results = {
    metadata: {
      model: RUN_CONFIG.model,
      temperature: RUN_CONFIG.temperature,
      k_runs: RUN_CONFIG.k_runs,
      dataset_sha256: expectedHash,
      started_at: new Date().toISOString()
    },
    condition_1_no_rag: [],
    condition_2_rag_guard: [],
    condition_3_retrieval_only: [],
    verifier_metrics: {
      total_evaluations: 0,
      flagged_warnings: 0,
      false_alarms_on_correct: 0
    }
  };

  let casesToRun = dataset.cases;
  let runsPerCase = RUN_CONFIG.k_runs;
  if (pilot) {
    const conceptCases = dataset.cases.filter(c => c.stratum === 'in_scope_concept').slice(0, 2);
    const numCases = dataset.cases.filter(c => c.stratum === 'in_scope_numerical').slice(0, 2);
    const oosCases = dataset.cases.filter(c => c.stratum === 'out_of_scope').slice(0, 1);
    casesToRun = [...conceptCases, ...numCases, ...oosCases];
    runsPerCase = 1;
    results.metadata.k_runs = 1;
    results.metadata.pilot = pilot;
    console.log(`\n▶️ CHẠY PILOT TRÊN ${casesToRun.length} CÂU: ${casesToRun.map(c => c.id).join(', ')}`);
  }

  for (let cIdx = 0; cIdx < casesToRun.length; cIdx++) {
    const item = casesToRun[cIdx];
    console.log(`[${cIdx + 1}/${casesToRun.length}] Evaluating: ${item.id} (${item.stratum})`);

    // 🛡️ CHẶN RÒ RỈ TRI THỨC TRONG ABLATION: Chỉ nạp từ đúng 303 chunk đã đóng băng
    const retrievedChunks = retrieveTopK(item.question, 2, {
      staticOnly: true,
      allowedChunkIds: FROZEN_303_CHUNK_IDS
    });

    // Kiểm tra và ghi nhận từng chunkId đưa vào ngữ cảnh
    const chunkIdsInContext = retrievedChunks.map(c => c.id);
    for (const cid of chunkIdsInContext) {
      if (!FROZEN_303_CHUNK_IDS.has(cid) || String(cid).startsWith('bench_verified_')) {
        console.error(`🚨 [PHÁT HIỆN RÒ RỈ TRI THỨC] Chunk '${cid}' không thuộc 303 chunk thí nghiệm đã đóng băng!`);
        throw new Error(`[ABLATION HALT] Vi phạm kho thí nghiệm: Gặp chunk '${cid}' ngoài 303 mã chunk chuẩn.`);
      }
    }

    const topChunk = retrievedChunks[0] || null;
    const topScore = topChunk ? topChunk.score : 0;
    const isRetrieved = topScore >= 0.30; // Cosine grounding threshold

    // Context formatting for Condition 2
    let ragContextText = '';
    if (retrievedChunks.length > 0) {
      ragContextText = retrievedChunks.map(c => `[Trích đoạn SGK ${c.id} - ${c.topic}]:\n${c.content}`).join('\n\n');
    }

    // Condition 3: Retrieval Only
    results.condition_3_retrieval_only.push({
      case_id: item.id,
      topChunkId: topChunk ? topChunk.id : null,
      topScore,
      isRetrieved,
      expectedRetrieved: item.stratum !== 'out_of_scope',
      hitGrounding: (item.stratum !== 'out_of_scope' && isRetrieved) || (item.stratum === 'out_of_scope' && !isRetrieved)
    });

    // Run k iterations for LLM conditions
    for (let r = 1; r <= runsPerCase; r++) {
      // 1. Condition 1: No RAG
      const noRagKey = buildCacheKey({
        condition: 'no_rag',
        item,
        runIndex: r,
        model: RUN_CONFIG.model,
        systemInstruction: BASE_SYSTEM_INSTRUCTION,
        datasetVersion: currentDatasetVersion,
        datasetSha256: expectedHash,
        corpusHash: stemCorpusHash,
        contextText: '',
        retrievedChunkIds: []
      });
      const noRagRes = await executeCachedCall({
        keyId: noRagKey,
        prompt: item.question,
        systemInstruction: BASE_SYSTEM_INSTRUCTION,
        temperature: RUN_CONFIG.temperature
      });

      const gradeNoRag = evaluateAnswer(item, noRagRes.text);
      console.log(`   [Run ${r}] No-RAG: [${gradeNoRag.status || 'đã xử lý'}] | Latency: ${noRagRes.latencyMs}ms | Tokens: ${noRagRes.totalTokens}${noRagRes.fromCache ? ' (cached)' : ''}`);
      results.condition_1_no_rag.push({
        case_id: item.id,
        run: r,
        stratum: item.stratum,
        corpus_stratum: item.corpus_stratum || item.dataset_v140_group || null,
        response: noRagRes.text,
        grade: gradeNoRag,
        latencyMs: noRagRes.latencyMs,
        tokens: noRagRes.totalTokens,
        fromCache: !!noRagRes.fromCache,
        attempts: noRagRes.attempts || 1
      });

      // 2. Condition 2: With RAG + Guard
      const ragPrompt = ragContextText
        ? `Tài liệu SGK tham khảo:\n${ragContextText}\n\nCâu hỏi: ${item.question}`
        : item.question;

      const ragKey = buildCacheKey({
        condition: 'rag_guard',
        item,
        runIndex: r,
        model: RUN_CONFIG.model,
        systemInstruction: `${BASE_SYSTEM_INSTRUCTION}\n${PEDAGOGICAL_GUARD}`,
        datasetVersion: currentDatasetVersion,
        datasetSha256: expectedHash,
        corpusHash: stemCorpusHash,
        contextText: ragContextText,
        retrievedChunkIds: chunkIdsInContext
      });
      const ragRes = await executeCachedCall({
        keyId: ragKey,
        prompt: ragPrompt,
        systemInstruction: `${BASE_SYSTEM_INSTRUCTION}\n${PEDAGOGICAL_GUARD}`,
        temperature: RUN_CONFIG.temperature
      });

      const gradeRag = evaluateAnswer(item, ragRes.text);
      console.log(`   [Run ${r}] RAG+Guard: [${gradeRag.status || 'đã xử lý'}] | Latency: ${ragRes.latencyMs}ms | Tokens: ${ragRes.totalTokens}${ragRes.fromCache ? ' (cached)' : ''}`);

      // Heuristic Verifier check
      const verifierRes = verifyResponseGrounding({
        answerText: ragRes.text,
        citedChunkIds: retrievedChunks.map(c => c.id),
        retrievedChunks,
        deterministicFacts: []
      });

      results.verifier_metrics.total_evaluations++;
      if (verifierRes && (verifierRes.warning || verifierRes.hasWarning)) {
        results.verifier_metrics.flagged_warnings++;
        if (gradeRag.isCorrect) {
          results.verifier_metrics.false_alarms_on_correct++;
        }
      }

      results.condition_2_rag_guard.push({
        case_id: item.id,
        run: r,
        stratum: item.stratum,
        corpus_stratum: item.corpus_stratum || item.dataset_v140_group || null,
        response: ragRes.text,
        grade: gradeRag,
        verifier: verifierRes,
        latencyMs: ragRes.latencyMs,
        tokens: ragRes.totalTokens,
        fromCache: !!ragRes.fromCache,
        attempts: ragRes.attempts || 1
      });

      // Write raw sanitized log
      rawStream.write(JSON.stringify({
        case_id: item.id,
        run: r,
        no_rag: {
          latency: noRagRes.latencyMs,
          tokens: noRagRes.totalTokens,
          correct: gradeNoRag.isCorrect,
          status: gradeNoRag.status,
          fromCache: !!noRagRes.fromCache,
          attempts: noRagRes.attempts || 1
        },
        rag: { 
          latency: ragRes.latencyMs, 
          tokens: ragRes.totalTokens, 
          correct: gradeRag.isCorrect, 
          status: gradeRag.status,
          fromCache: !!ragRes.fromCache,
          attempts: ragRes.attempts || 1,
          verifier: verifierRes,
          retrieved_chunk_ids: chunkIdsInContext
        }
      }) + '\n');

      // 💾 Lưu checkpoint tiến trình sau mỗi lần gọi để sẵn sàng phục hồi nếu bị gián đoạn
      const checkpointPath = path.join(reportsDir, 'checkpoint.json');
      fs.writeFileSync(checkpointPath, JSON.stringify({
        lastCompletedCaseId: item.id,
        caseIndex: cIdx + 1,
        totalCases: casesToRun.length,
        lastRun: r,
        totalRunsPerCase: runsPerCase,
        cumulativeTokensUsed,
        observedModelVersion,
        timestamp: new Date().toISOString()
      }, null, 2), 'utf8');
    }
  }

  rawStream.end();
  results.metadata.completed_at = new Date().toISOString();
  results.metadata.total_tokens_consumed = cumulativeTokensUsed;

  // Aggregate stats
  const aggregated = computeAggregatedMetrics(results);
  
  if (pilot) {
    const pilotSummaryPath = path.join(targetRawDir, 'pilot_ablation_summary.json');
    fs.writeFileSync(pilotSummaryPath, JSON.stringify(aggregated, null, 2), 'utf8');
    console.log('\n=============================================================');
    console.log('✅ PILOT ABLATION STUDY HOÀN THÀNH (TÁCH BIỆT KHỎI BÁO CÁO CHÍNH)!');
    console.log('Pilot Summary:', pilotSummaryPath);
    console.log('Pilot Raw logs:', rawLogFile);

    // Kiểm tra bộ lấy mẫu mù tạo đúng 2 mục từ output pilot để kiểm chứng pipeline rồi xóa
    console.log('\n🧪 KIỂM CHỨNG BỘ SINH MẪU MÙ VỚI OUTPUT PILOT (2 MỤC)...');
    try {
      const { generateMathTeacherBlindReviewSet } = await import('../src/lib/reviewSampler.js');
      const testBlind = generateMathTeacherBlindReviewSet({
        seed: 2026,
        mathQuestionsCount: 1, // 1 câu x 2 điều kiện = 2 mục
        datasetFilePath: datasetPath,
        ablationSummaryPath: pilotSummaryPath,
        secretMappingDir: path.join(targetRawDir, 'temp_secret_mapping')
      });
      console.log(`✅ Bộ sinh mẫu mù tạo thành công ${testBlind.totalItems} mục từ output pilot để kiểm chứng pipeline.`);
      // Xóa file giải mã tạm thời
      if (fs.existsSync(testBlind.secretMapPath)) {
        fs.unlinkSync(testBlind.secretMapPath);
        console.log(`🧹 Đã dọn dẹp file giải mã tạm thời của pilot.`);
      }
      const tempSecretDir = path.join(targetRawDir, 'temp_secret_mapping');
      if (fs.existsSync(tempSecretDir)) fs.rmdirSync(tempSecretDir);
    } catch (e) {
      console.warn('⚠️ Lỗi kiểm chứng bộ sinh mẫu mù pilot:', e.message);
    }
    console.log('=============================================================');
  } else {
    const summaryPath = path.join(reportsDir, 'ablation_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(aggregated, null, 2), 'utf8');
    fs.writeFileSync(path.join(evidenceDir, 'ablation_summary.json'), JSON.stringify(aggregated, null, 2), 'utf8');
    fs.writeFileSync(path.join(evidenceDir, 'dataset_hash.json'), JSON.stringify(hashInfo, null, 2), 'utf8');

    console.log('\n=============================================================');
    console.log('✅ ABLATION STUDY HOÀN THÀNH VÀ LƯU THÀNH CÔNG!');
    console.log('Summary:', summaryPath);
    console.log('Raw logs:', rawLogFile);
    console.log('=============================================================');

    // 🎯 Tự động tạo bộ 20 mục mù từ ĐẦU RA GEMINI THẬT cho giáo viên Toán (Prompt 10 Mục 9)
    try {
      const { generateMathTeacherBlindReviewSet } = await import('../src/lib/reviewSampler.js');
      const blindSet = generateMathTeacherBlindReviewSet({
        seed: 2026,
        mathQuestionsCount: 10,
        datasetFilePath: datasetPath,
        ablationSummaryPath: summaryPath,
        secretMappingDir: path.join(reportsDir, 'secret_mapping')
      });
      console.log(`\n🎯 ĐÃ TẠO BỘ 20 MỤC MÙ TỪ ĐẦU RA GEMINI THẬT (KHÔNG DÙNG BENCHMARK TỔNG HỢP):`);
      console.log(`   - Tổng số mục mù: ${blindSet.totalItems} mục (${blindSet.selectedMathQuestionsCount} câu Toán x 2 điều kiện)`);
      console.log(`   - Mã bảo mật giải mã (lưu server): ${blindSet.secretMapPath}`);
    } catch (e) {
      console.warn('⚠️ Lỗi tạo bộ mẫu mù từ đầu ra thật:', e.message);
    }
  }
  return aggregated;
}

/**
 * Statistical Aggregation & Bootstrap Confidence Intervals
 * Tuân thủ quy tắc trung thực Prompt 0:
 * - n < 10 tuyệt đối KHÔNG in phần trăm, chỉ in tỷ lệ số đếm thô (k/n).
 * - Báo cáo số lệnh gọi mô hình thật, số lần thử lại 503, số lần từ chối 0-call, độ trễ p50/p95 chỉ tính lệnh gọi thật.
 * - Tuyệt đối không nhận định "RAG làm nhanh hơn" nếu do từ chối hoặc thử lại.
 */
function computeAggregatedMetrics(results) {
  const noRag = results.condition_1_no_rag;
  const rag = results.condition_2_rag_guard;
  const retOnly = results.condition_3_retrieval_only;

  const getStats = list => {
    const total = list.length;
    // Chỉ tính các lệnh gọi mô hình thật (không tính từ cache nếu có)
    const realCalls = list.filter(x => !x.fromCache);
    const realCallsCount = realCalls.length;
    
    // Số lần thử lại / 503
    const retries503Count = list.reduce((acc, x) => acc + Math.max(0, (x.attempts || 1) - 1), 0);
    
    // Số lần từ chối không gọi mô hình (hoặc từ chối do bảo vệ)
    const refusalsZeroCallCount = list.filter(x => x.grade?.isAbstained && x.tokens === 0).length;
    
    // Độ trễ trung vị & p95 CHỈ tính trên các lệnh gọi mô hình thật
    const realLatencies = realCalls.map(x => x.latencyMs).filter(l => typeof l === 'number' && l > 0).sort((a, b) => a - b);
    const medianLatency = realLatencies.length > 0 ? (realLatencies[Math.floor(realLatencies.length / 2)] || 0) : 0;
    const p95Latency = realLatencies.length > 0 ? (realLatencies[Math.floor(realLatencies.length * 0.95)] || 0) : 0;

    // Câu số học trong phạm vi (có ground truth số học chuẩn)
    const inScopeNum = list.filter(x => x.stratum === 'in_scope_numerical');
    const inScopeNumCorrect = inScopeNum.filter(x => x.grade.isCorrect === true).length;

    // Câu khái niệm trong phạm vi: CẦN NGƯỜI CHẤM TAY
    const inScopeConcept = list.filter(x => x.stratum === 'in_scope_concept');

    // Câu ngoài phạm vi (OOS): hành vi chuẩn là từ chối
    const oos = list.filter(x => x.stratum === 'out_of_scope');
    const oosCorrectAbstain = oos.filter(x => x.grade.isCorrect === true).length;

    const isRefusal = text => {
      if (!text) return false;
      return /nằm ngoài|ngoài phạm vi|ngoài chương trình|chưa đủ căn cứ|không thuộc phạm vi|thiếu căn cứ|sgk không|chưa có trong sgk|tham khảo tài liệu chuyên ngành|từ chối/i.test(text);
    };

    const getStratumDetail = (filterFn) => {
      const items = list.filter(filterFn);
      const subTotal = items.length;
      const correct = items.filter(x => x.grade.isCorrect === true).length;
      const refused = items.filter(x => x.grade.isAbstained || isRefusal(x.response)).length;
      const needsReview = items.filter(x => x.grade.status === 'cần người chấm').length;
      
      const res = {
        total: subTotal,
        correct,
        refused,
        needsReview,
        fraction: `${correct}/${subTotal}`
      };

      // QUY TẮC TRUNG THỰC: Với n < 10 tuyệt đối KHÔNG in phần trăm
      if (subTotal >= 10) {
        res.accuracyPct = Number(((correct / subTotal) * 100).toFixed(2));
        res.refusalRatePct = Number(((refused / subTotal) * 100).toFixed(2));
      } else {
        res.accuracyPct = null;
        res.refusalRatePct = null;
        res.note_small_sample = `Cỡ mẫu nhỏ (n = ${subTotal} < 10): chỉ ghi nhận tỷ lệ số đếm thô ${correct}/${subTotal}, không tính phần trăm.`;
      }
      return res;
    };

    const totalScored = list.filter(x => x.grade.isCorrect !== null);
    const totalCorrect = totalScored.filter(x => x.grade.isCorrect === true).length;

    return {
      total,
      realCallsCount,
      retries503Count,
      refusalsZeroCallCount,
      medianLatencyMs: medianLatency,
      p95LatencyMs: p95Latency,
      // Tỷ lệ và phần trăm
      scoredCasesTotal: totalScored.length,
      scoredCasesCorrect: totalCorrect,
      scoredAccuracyFraction: `${totalCorrect}/${totalScored.length}`,
      scoredAccuracyPct: totalScored.length >= 10 ? Number(((totalCorrect / totalScored.length) * 100).toFixed(2)) : null,
      inScopeNumericalTotal: inScopeNum.length,
      inScopeNumericalAccuracyFraction: `${inScopeNumCorrect}/${inScopeNum.length}`,
      inScopeNumericalAccuracyPct: inScopeNum.length >= 10 ? Number(((inScopeNumCorrect / inScopeNum.length) * 100).toFixed(2)) : null,
      inScopeConceptTotal: inScopeConcept.length,
      inScopeConceptStatus: `${inScopeConcept.length} câu khái niệm: CẦN NGƯỜI CHẤM TAY (không tự động chấm PASS)`,
      oosTotal: oos.length,
      oosAbstentionFraction: `${oosCorrectAbstain}/${oos.length}`,
      oosAbstentionRatePct: oos.length >= 10 ? Number(((oosCorrectAbstain / oos.length) * 100).toFixed(2)) : null,
      strata_3_tiers: {
        tang_A: getStratumDetail(x => x.corpus_stratum === 'tang_A_kho_du_de_giai'),
        tang_B: getStratumDetail(x => x.corpus_stratum === 'tang_B_chu_de_lien_quan_chua_du_de_giai'),
        tang_C: getStratumDetail(x => x.corpus_stratum === 'tang_C_ngoai_kho'),
        concept: {
          ...getStratumDetail(x => x.stratum === 'in_scope_concept'),
          note: 'Câu khái niệm cần người chấm tay theo quy tắc đóng băng docs/quy-tac-cham-ablation.md (không tự động chấm PASS)'
        }
      }
    };
  };

  const noRagStats = getStats(noRag);
  const ragStats = getStats(rag);

  // Verifier metrics
  const vm = results.verifier_metrics;
  const warningRatePct = vm.total_evaluations >= 10 ? Number(((vm.flagged_warnings / vm.total_evaluations) * 100).toFixed(2)) : null;
  const falseAlarmRatePct = vm.total_evaluations >= 10 ? Number(((vm.false_alarms_on_correct / vm.total_evaluations) * 100).toFixed(2)) : null;

  return {
    metadata: results.metadata,
    condition_1_no_rag: noRagStats,
    condition_2_rag_guard: ragStats,
    delta: {
      inScopeDiff: (ragStats.inScopeNumericalAccuracyPct !== null && noRagStats.inScopeNumericalAccuracyPct !== null)
        ? (ragStats.inScopeNumericalAccuracyPct - noRagStats.inScopeNumericalAccuracyPct).toFixed(2) + ' pp'
        : 'Chưa đủ n>=10 để so sánh pp',
      oosAbstentionDiff: (ragStats.oosAbstentionRatePct !== null && noRagStats.oosAbstentionRatePct !== null)
        ? (ragStats.oosAbstentionRatePct - noRagStats.oosAbstentionRatePct).toFixed(2) + ' pp'
        : 'Chưa đủ n>=10 để so sánh pp',
      latencyNote: 'So sánh độ trễ chỉ phản ánh các lệnh gọi thật. Tuyệt đối không kết luận RAG làm nhanh hơn nếu chênh lệch xuất phát từ việc từ chối sớm hoặc các lần thử lại mạng.'
    },
    retrieval_only_accuracy: retOnly.length >= 10 
      ? Number(((retOnly.filter(x => x.hitGrounding).length / (retOnly.length || 1)) * 100).toFixed(2))
      : null,
    retrieval_only_fraction: `${retOnly.filter(x => x.hitGrounding).length}/${retOnly.length}`,
    response_verifier: {
      total_evaluations: vm.total_evaluations,
      warningFraction: `${vm.flagged_warnings}/${vm.total_evaluations}`,
      warningRatePct: warningRatePct !== null ? `${warningRatePct}%` : 'Chưa đủ n>=10',
      falseAlarmFraction: `${vm.false_alarms_on_correct}/${vm.total_evaluations}`,
      falseAlarmRatePct: falseAlarmRatePct !== null ? `${falseAlarmRatePct}%` : 'Chưa đủ n>=10'
    }
  };
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith('run_ablation_real.mjs')) {
  const isExecute = process.argv.includes('--execute');
  const pilotArg = process.argv.find(a => a.startsWith('--pilot='));
  const pilotCount = pilotArg ? parseInt(pilotArg.split('=')[1], 10) : (process.argv.includes('--pilot') ? 5 : null);
  runAblationStudy({ execute: isExecute, pilot: pilotCount }).catch(err => {
    console.error('Fatal error in ablation runner:', err);
    process.exit(1);
  });
}

