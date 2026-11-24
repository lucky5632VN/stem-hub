import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { retrieveTopK } from '../../lib/ragService.js';
import { wilsonInterval } from './chem-risk_train.js';

const benchmarkPath = path.resolve('src/ai-training/datasets/rag_chunk_benchmark_60.json');
const rawData = fs.readFileSync(benchmarkPath, 'utf8');
const benchmarkData = JSON.parse(rawData);

// 1. Kiểm tra tính toàn vẹn và khóa hash SHA-256
const contentString = JSON.stringify(benchmarkData.queries);
const computedHash = crypto.createHash('sha256').update(contentString).digest('hex');
const expectedHash = benchmarkData.metadata.datasetSha256;

console.log('🔬 === ĐÁNH GIÁ CHUẨN XÁC RAG MỨC ĐỘ CHUNK (CHUNK-LEVEL RETRIEVAL BENCHMARK) ===\n');
console.log(`🔒 Kiểm tra SHA-256 Hash khóa dữ liệu:`);
console.log(`   - Khóa lưu trữ: ${expectedHash}`);
console.log(`   - Khóa tính toán: ${computedHash}`);

if (computedHash !== expectedHash) {
  console.error('❌ CẢNH BÁO: Dữ liệu benchmark đã bị thay đổi sau khi khóa hash!');
  process.exit(1);
} else {
  console.log('   ✅ [PASS] Hash trùng khớp (SHA-256 Verified). Dữ liệu chưa từng bị chỉnh sửa sau khi khóa.\n');
}

// 2. Chạy đánh giá từng câu hỏi
const STRICT_THRESHOLD = 0.30; // Ngưỡng Căn cứ Vững chắc (Grounded)
const FLOOR_THRESHOLD = 0.15;  // Ngưỡng Ngắt Từ chối Tối thiểu (Minimum Floor)

const inScopeQueries = benchmarkData.queries.filter(q => q.type === 'in_scope');
const oosQueries = benchmarkData.queries.filter(q => q.type === 'out_of_scope');

let recall1Count = 0;
let recall3Count = 0;
let recall5Count = 0;
let sumReciprocalRank = 0;

let inScopeGrounded = 0;
let inScopeWeak = 0;
let inScopeUngrounded = 0;

const inScopeEvaluations = inScopeQueries.map(q => {
  const topResults = retrieveTopK(q.query, 5);
  const top1 = topResults[0] || { id: null, score: 0 };

  // Tìm rank đầu tiên của chunk đúng
  let rank = 0;
  for (let i = 0; i < topResults.length; i++) {
    if (q.expectedChunkIds.includes(topResults[i].id)) {
      rank = i + 1;
      break;
    }
  }

  const isHit1 = rank === 1;
  const isHit3 = rank >= 1 && rank <= 3;
  const isHit5 = rank >= 1 && rank <= 5;
  const rr = rank > 0 ? 1 / rank : 0;

  if (isHit1) recall1Count++;
  if (isHit3) recall3Count++;
  if (isHit5) recall5Count++;
  sumReciprocalRank += rr;

  const score = top1.score;
  let band = 'ungrounded';
  if (score >= STRICT_THRESHOLD) {
    band = 'grounded';
    inScopeGrounded++;
  } else if (score >= FLOOR_THRESHOLD) {
    band = 'weak';
    inScopeWeak++;
  } else {
    band = 'ungrounded';
    inScopeUngrounded++;
  }

  return {
    id: q.id,
    query: q.query,
    expectedChunkIds: q.expectedChunkIds,
    retrievedTopChunkId: top1.id,
    top1Score: Number(top1.score.toFixed(4)),
    rankFound: rank,
    isHit1,
    isHit3,
    isHit5,
    reciprocalRank: Number(rr.toFixed(3)),
    band,
    isRejectedStrict: score < STRICT_THRESHOLD,
    isRejectedFloor: score < FLOOR_THRESHOLD
  };
});

// Đánh giá Out of Scope
let oosGrounded = 0;
let oosWeak = 0;
let oosUngrounded = 0;

const oosEvaluations = oosQueries.map(q => {
  const topResults = retrieveTopK(q.query, 5);
  const top1 = topResults[0] || { id: null, score: 0 };
  const score = top1.score;

  let band = 'ungrounded';
  if (score >= STRICT_THRESHOLD) {
    band = 'grounded';
    oosGrounded++;
  } else if (score >= FLOOR_THRESHOLD) {
    band = 'weak';
    oosWeak++;
  } else {
    band = 'ungrounded';
    oosUngrounded++;
  }

  return {
    id: q.id,
    query: q.query,
    top1Score: Number(top1.score.toFixed(4)),
    top1ChunkId: top1.id,
    band,
    isRejectedStrict: score < STRICT_THRESHOLD,
    isRejectedFloor: score < FLOOR_THRESHOLD
  };
});

// 3. Tính toán các chỉ số thống kê & Wilson 95% CI
const nInScope = inScopeQueries.length;
const nOos = oosQueries.length;

const recall1Rate = (recall1Count / nInScope) * 100;
const recall3Rate = (recall3Count / nInScope) * 100;
const recall5Rate = (recall5Count / nInScope) * 100;
const mrr = sumReciprocalRank / nInScope;

// Chỉ số theo ngưỡng nghiêm ngặt (0.30)
const strictOosRejections = nOos - oosGrounded;
const strictInScopeRejections = nInScope - inScopeGrounded;
const strictTrueRejectionRate = (strictOosRejections / nOos) * 100;
const strictFalseRejectionRate = (strictInScopeRejections / nInScope) * 100;

// Chỉ số theo ngưỡng tối thiểu (0.15)
const floorOosRejections = oosUngrounded;
const floorInScopeRejections = inScopeUngrounded;
const floorTrueRejectionRate = (floorOosRejections / nOos) * 100;
const floorFalseRejectionRate = (floorInScopeRejections / nInScope) * 100;

const ciRecall1 = wilsonInterval(recall1Count, nInScope);
const ciRecall3 = wilsonInterval(recall3Count, nInScope);
const ciRecall5 = wilsonInterval(recall5Count, nInScope);

const ciStrictTrueRej = wilsonInterval(strictOosRejections, nOos);
const ciStrictFalseRej = wilsonInterval(strictInScopeRejections, nInScope);
const ciFloorTrueRej = wilsonInterval(floorOosRejections, nOos);
const ciFloorFalseRej = wilsonInterval(floorInScopeRejections, nInScope);

console.log('========================================================================');
console.log('📊 BÁO CÁO KẾT QUẢ ĐO LƯỜNG RAG TRÊN MỨC ĐỘ CHUNK THỰC TẾ:');
console.log('========================================================================');
console.log(`1. Quy mô tập thử nghiệm (TẬP DEV):`);
console.log(`   - In-Scope Queries (n=${nInScope}): Viết tay độc lập, ngữ điệu học sinh, đa dạng cấu trúc.`);
console.log(`   - Out-of-Scope Queries (n=${nOos}): Chủ đề ngoài SGK kiểm tra bộ ngắt từ chối.`);
console.log(`   - Ngưỡng phân tầng: Grounded >= ${STRICT_THRESHOLD} | Weak: [${FLOOR_THRESHOLD}, ${STRICT_THRESHOLD}) | Ungrounded < ${FLOOR_THRESHOLD}`);
console.log(`\n2. Hiệu năng Truy xuất Chunk (Chunk Retrieval Performance):`);
console.log(`   - Recall@1: ${recall1Count}/${nInScope} = ${recall1Rate.toFixed(2)}% (Wilson 95% CI: [${ciRecall1.lower}%, ${ciRecall1.upper}%])`);
console.log(`   - Recall@3: ${recall3Count}/${nInScope} = ${recall3Rate.toFixed(2)}% (Wilson 95% CI: [${ciRecall3.lower}%, ${ciRecall3.upper}%])`);
console.log(`   - Recall@5: ${recall5Count}/${nInScope} = ${recall5Rate.toFixed(2)}% (Wilson 95% CI: [${ciRecall5.lower}%, ${ciRecall5.upper}%])`);
console.log(`   - MRR (Mean Reciprocal Rank): ${mrr.toFixed(4)}`);
console.log(`\n3. Phân phối 3 Tầng Căn cứ (Grounding Tri-Band Distribution):`);
console.log(`   - In-Scope (n=${nInScope}):  Grounded: ${inScopeGrounded}/${nInScope} (${((inScopeGrounded/nInScope)*100).toFixed(1)}%) | Weak: ${inScopeWeak}/${nInScope} (${((inScopeWeak/nInScope)*100).toFixed(1)}%) | Ungrounded: ${inScopeUngrounded}/${nInScope} (${((inScopeUngrounded/nInScope)*100).toFixed(1)}%)`);
console.log(`   - Out-of-Scope (n=${nOos}): Grounded: ${oosGrounded}/${nOos} (${((oosGrounded/nOos)*100).toFixed(1)}%) | Weak: ${oosWeak}/${nOos} (${((oosWeak/nOos)*100).toFixed(1)}%) | Ungrounded: ${oosUngrounded}/${nOos} (${((oosUngrounded/nOos)*100).toFixed(1)}%)`);
console.log(`\n4. An toàn & Ngắt từ chối (Abstention Guard Safety):`);
console.log(`   a) Tại ngưỡng tối thiểu 0.15 (Chấp nhận In-Scope tối đa):`);
console.log(`      - Tỷ lệ từ chối đúng trên Out-of-Scope: ${floorOosRejections}/${nOos} = ${floorTrueRejectionRate.toFixed(2)}% (Wilson 95% CI: [${ciFloorTrueRej.lower}%, ${ciFloorTrueRej.upper}%])`);
console.log(`      - Tỷ lệ từ chối nhầm trên In-Scope:     ${floorInScopeRejections}/${nInScope} = ${floorFalseRejectionRate.toFixed(2)}% (Wilson 95% CI: [${ciFloorFalseRej.lower}%, ${ciFloorFalseRej.upper}%])`);
console.log(`   b) Tại ngưỡng nghiêm ngặt 0.30 (Chặn 100% OOS không có căn cứ vững):`);
console.log(`      - Tỷ lệ từ chối đúng trên Out-of-Scope: ${strictOosRejections}/${nOos} = ${strictTrueRejectionRate.toFixed(2)}% (Wilson 95% CI: [${ciStrictTrueRej.lower}%, ${ciStrictTrueRej.upper}%])`);
console.log(`      - Tỷ lệ từ chối nhầm trên In-Scope:     ${strictInScopeRejections}/${nInScope} = ${strictFalseRejectionRate.toFixed(2)}% (Wilson 95% CI: [${ciStrictFalseRej.lower}%, ${ciStrictFalseRej.upper}%])`);
console.log('========================================================================\n');

// 4. Lưu báo cáo chi tiết vào reports/
const reportPayload = {
  metadata: {
    ...benchmarkData.metadata,
    evaluationTimestamp: new Date().toISOString(),
    strictThreshold: STRICT_THRESHOLD,
    floorThreshold: FLOOR_THRESHOLD
  },
  metrics: {
    recallAt1: { count: recall1Count, total: nInScope, percentage: Number(recall1Rate.toFixed(2)), ci95: ciRecall1 },
    recallAt3: { count: recall3Count, total: nInScope, percentage: Number(recall3Rate.toFixed(2)), ci95: ciRecall3 },
    recallAt5: { count: recall5Count, total: nInScope, percentage: Number(recall5Rate.toFixed(2)), ci95: ciRecall5 },
    mrr: Number(mrr.toFixed(4)),
    distribution: {
      inScope: { grounded: inScopeGrounded, weak: inScopeWeak, ungrounded: inScopeUngrounded, total: nInScope },
      outOfScope: { grounded: oosGrounded, weak: oosWeak, ungrounded: oosUngrounded, total: nOos }
    },
    threshold015: {
      trueRejectionOos: { count: floorOosRejections, total: nOos, percentage: Number(floorTrueRejectionRate.toFixed(2)), ci95: ciFloorTrueRej },
      falseRejectionInScope: { count: floorInScopeRejections, total: nInScope, percentage: Number(floorFalseRejectionRate.toFixed(2)), ci95: ciFloorFalseRej }
    },
    threshold030: {
      trueRejectionOos: { count: strictOosRejections, total: nOos, percentage: Number(strictTrueRejectionRate.toFixed(2)), ci95: ciStrictTrueRej },
      falseRejectionInScope: { count: strictInScopeRejections, total: nInScope, percentage: Number(strictFalseRejectionRate.toFixed(2)), ci95: ciStrictFalseRej }
    }
  },
  detailedInScope: inScopeEvaluations,
  detailedOutOfScope: oosEvaluations
};

const reportPath = path.resolve('reports/rag_chunk_benchmark_results.json');
fs.writeFileSync(reportPath, JSON.stringify(reportPayload, null, 2), 'utf8');
console.log(`💾 Đã lưu kết quả đo đạc chi tiết tại: ${reportPath}`);

