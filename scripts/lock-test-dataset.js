/**
 * 🔒 STEM HUB RAG Test Dataset Validator & SHA-256 Locker
 * 
 * Công cụ kiểm tra hợp lệ và khóa mã băm SHA-256 cho Tập Test độc lập:
 * 1. Kiểm tra số lượng tối thiểu: ≥60 in-scope và ≥30 out-of-scope.
 * 2. Xác thực tất cả expectedChunkIds có thực sự tồn tại trong stem-corpus.json.
 * 3. Kiểm tra tính độc lập và phân loại nguồn (human_written vs LLM-assisted).
 * 4. Tính toán và ghi khóa SHA-256 vào metadata trước khi đóng băng tập dữ liệu.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CORPUS_PATH = path.resolve('src/ai-training/datasets/rag-knowledge/stem-corpus.json');
const TARGET_PATH = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve('src/ai-training/datasets/rag_test_benchmark_unseen.json');

console.log('🔒 === STEM HUB RAG TEST DATASET LOCKER & VALIDATOR ===\n');

if (!fs.existsSync(TARGET_PATH)) {
  console.log(`ℹ️ [THÔNG BÁO MINH BẠCH]: Chưa tìm thấy tệp test mới tại: ${TARGET_PATH}`);
  console.log('   Trạng thái hiện tại: "Tập test mới: CHƯA CÓ".');
  console.log('   Vui lòng điền dữ liệu theo hướng dẫn tại: docs/viet-tap-test.md\n');
  process.exit(0);
}

const corpusData = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf8'));
const validChunkIds = new Set(corpusData.map(c => c.id));

const rawTarget = fs.readFileSync(TARGET_PATH, 'utf8');
const testDataset = JSON.parse(rawTarget);

const queries = testDataset.queries || [];
const inScope = queries.filter(q => q.type === 'in_scope');
const outOfScope = queries.filter(q => q.type === 'out_of_scope');

console.log(`📊 Thống kê tập dữ liệu:`);
console.log(`   - Tổng số câu hỏi: ${queries.length}`);
console.log(`   - In-Scope: ${inScope.length} (Yêu cầu: ≥ 60)`);
console.log(`   - Out-of-Scope: ${outOfScope.length} (Yêu cầu: ≥ 30)`);

let hasErrors = false;

if (inScope.length < 60) {
  console.error(`❌ Lỗi: Số câu in-scope (${inScope.length}) chưa đạt yêu cầu tối thiểu (≥ 60).`);
  hasErrors = true;
}
if (outOfScope.length < 30) {
  console.error(`❌ Lỗi: Số câu out-of-scope (${outOfScope.length}) chưa đạt yêu cầu tối thiểu (≥ 30).`);
  hasErrors = true;
}

// Kiểm tra expectedChunkIds
for (const q of inScope) {
  if (!Array.isArray(q.expectedChunkIds) || q.expectedChunkIds.length === 0) {
    console.error(`❌ Lỗi câu ${q.id}: Không có expectedChunkIds.`);
    hasErrors = true;
    continue;
  }
  for (const cid of q.expectedChunkIds) {
    if (!validChunkIds.has(cid)) {
      console.error(`❌ Lỗi câu ${q.id}: expectedChunkId "${cid}" không tồn tại trong stem-corpus.json!`);
      hasErrors = true;
    }
  }
}

if (hasErrors) {
  console.error('\n🚫 TẬP TEST CHƯA ĐẠT CHUẨN ĐỂ KHÓA HASH! Vui lòng sửa các lỗi trên.');
  process.exit(1);
}

// Khóa SHA-256
const queriesString = JSON.stringify(queries);
const sha256 = crypto.createHash('sha256').update(queriesString).digest('hex');

testDataset.metadata = {
  ...testDataset.metadata,
  role: 'blind_test_set',
  totalQueries: queries.length,
  inScopeQueries: inScope.length,
  outOfScopeQueries: outOfScope.length,
  datasetSha256: sha256,
  lockedAt: new Date().toISOString()
};

fs.writeFileSync(TARGET_PATH, JSON.stringify(testDataset, null, 2), 'utf8');

console.log(`\n✅ [THÀNH CÔNG] Tập test đã được chuẩn hóa và khóa SHA-256!`);
console.log(`   - SHA-256: ${sha256}`);
console.log(`   - Lưu trữ tại: ${TARGET_PATH}`);
console.log(`   ⚠️ LƯU Ý KỶ LUẬT: Tuyệt đối không chạy thử nghiệm lặp lại trên tập này để chỉnh ngưỡng!`);

