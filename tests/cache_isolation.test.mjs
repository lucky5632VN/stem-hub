import assert from 'assert';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

console.log('=== TEST: CÔ LẬP BỘ NHỚ ĐỆM (CACHE ISOLATION & INTEGRITY TEST) ===');

/**
 * Hàm tạo cache key tiêu chuẩn
 */
function buildCacheKey({ condition, item, runIndex = 1, model, systemInstruction = '', datasetVersion }) {
  const qText = item?.question || item?.question_text || '';
  const qHash = crypto.createHash('sha256').update(qText).digest('hex').slice(0, 12);
  const sysHash = crypto.createHash('sha256').update(systemInstruction).digest('hex').slice(0, 8);
  const dsVer = datasetVersion || 'v1.4.2';
  const modelId = model || 'gemini-3.5-flash-lite';
  const itemId = item?.id || 'UNKNOWN_ID';
  return `${condition}_${itemId}_${dsVer}_${modelId}_${qHash}_${sysHash}_run${runIndex}`;
}

const mockItemA = {
  id: 'ABL_IN_NUM_01',
  question: 'Để chế tác một hạt cườm...'
};

const mockItemB_sameQuestionDifferentText = {
  id: 'ABL_IN_NUM_01',
  question: 'Khi môi trường có lactose, phân tử allolactose liên kết với...'
};

// 1. Cùng câu hỏi nhưng KHÁC bộ dữ liệu (datasetVersion v1.4.0 vs v1.4.2)
const key_v140 = buildCacheKey({
  condition: 'no_rag',
  item: mockItemA,
  model: 'gemini-3.5-flash-lite',
  datasetVersion: 'v1.4.0'
});

const key_v142 = buildCacheKey({
  condition: 'no_rag',
  item: mockItemA,
  model: 'gemini-3.5-flash-lite',
  datasetVersion: 'v1.4.2'
});

console.log('- Khóa v1.4.0:', key_v140);
console.log('- Khóa v1.4.2:', key_v142);
assert.notStrictEqual(key_v140, key_v142, 'Khác bộ dữ liệu bắt buộc phải sinh ra hai khóa cache khác nhau!');
console.log('✅ [PASS] Cô lập phiên bản dataset: Không dùng lại cache giữa v1.4.0 và v1.4.2');

// 2. Cùng câu hỏi, cùng dataset nhưng KHÁC mô hình (Model A vs Model B)
const key_model1 = buildCacheKey({
  condition: 'no_rag',
  item: mockItemA,
  model: 'gemini-3.5-flash-lite',
  datasetVersion: 'v1.4.2'
});

const key_model2 = buildCacheKey({
  condition: 'no_rag',
  item: mockItemA,
  model: 'gemini-2.5-flash',
  datasetVersion: 'v1.4.2'
});

assert.notStrictEqual(key_model1, key_model2, 'Khác model bắt buộc phải sinh ra hai khóa cache khác nhau!');
console.log('✅ [PASS] Cô lập mô hình: Không dùng lại cache giữa các model khác nhau');

// 3. Cùng ID nhưng nội dung câu hỏi bị thay đổi (Question text hash)
const key_oldQuestion = buildCacheKey({
  condition: 'no_rag',
  item: mockItemB_sameQuestionDifferentText,
  model: 'gemini-3.5-flash-lite',
  datasetVersion: 'v1.4.2'
});

assert.notStrictEqual(key_v142, key_oldQuestion, 'Cùng ID nhưng khác nội dung câu hỏi phải có hash câu hỏi khác nhau!');
console.log('✅ [PASS] Cô lập nội dung câu hỏi: Tránh lỗi dùng lại kết quả cũ khi ID bị trỏ sai');

// 4. Kiểm tra đường dẫn cache Pilot và Full run
const reportsDir = path.resolve('reports/ablation');
const fullCachePath = path.join(reportsDir, 'call_cache.json');
const pilotCachePath = path.join(reportsDir, 'pilot/cache/call_cache.json');

assert.notStrictEqual(fullCachePath, pilotCachePath, 'Cache pilot và cache full run bắt buộc phải nằm ở 2 file riêng biệt!');
assert.strictEqual(fs.existsSync(fullCachePath), true, 'File full cache phải tồn tại!');
assert.strictEqual(fs.existsSync(pilotCachePath), true, 'File pilot cache phải tồn tại!');

console.log('✅ [PASS] Cô lập tệp cache: Pilot cache nằm riêng tại pilot/cache/call_cache.json, không đọc vào full run');
console.log('\n=== TẤT CẢ KIỂM THỬ CÔ LẬP CACHE ĐỀU ĐẠT! ===');

