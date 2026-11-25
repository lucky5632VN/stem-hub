import assert from 'node:assert';
import { buildCacheKey } from '../scripts/run_ablation_real.mjs';

console.log('🧪 BẮT ĐẦU KIỂM THỬ ĐỘ CÔ LẬP KHÓA BỘ NHỚ ĐỆM (CACHE KEY ISOLATION TEST)...');

const baseItem = {
  id: 'ABL_IN_NUM_01',
  question: 'Để chế tác một hạt cườm, người ta lấy một khối vật thể...'
};

const baseConfig = {
  condition: 'rag_guard',
  item: baseItem,
  runIndex: 1,
  model: 'gemini-3.5-flash-lite',
  systemInstruction: 'Bạn là trợ lý học tập STEM HUB',
  datasetVersion: 'v1.4.2',
  datasetSha256: 'cefc6ce343f01692dc4b9e83b9ac257ed833f70bb7c3d366d05259057c2c65c6',
  corpusHash: '28f7b3382697954fd92f9c09971469d6f9d2c897e5c506fc838b800603ac2cc0',
  contextText: '[Trích đoạn toan-12-228]: Elip và hình cầu',
  retrievedChunkIds: ['toan-12-228', 'toan-12-226']
};

// 1. Khóa cơ sở
const keyBase = buildCacheKey(baseConfig);
console.log('  * Khóa cơ sở:', keyBase);

// 2. Khác kho tri thức 303 chunk => Bắt buộc Cache Miss (Khóa khác nhau)
const keyDifferentCorpus = buildCacheKey({
  ...baseConfig,
  corpusHash: 'aaaa1111222233334444555566667777888899990000aaaabbbbccccddddeeee'
});
assert.notStrictEqual(keyBase, keyDifferentCorpus, 'Lỗi: Khác kho tri thức nhưng khóa lại giống nhau!');
console.log('  ✅ Test 1 PASS: Khác mã băm kho tri thức (corpusHash) => Sinh khóa khác nhau (Cache Miss)');

// 3. Khác ngữ cảnh truy xuất (retrieved chunk IDs hoặc context text) => Bắt buộc Cache Miss
const keyDifferentContextChunks = buildCacheKey({
  ...baseConfig,
  retrievedChunkIds: ['toan-10-100', 'toan-10-101'],
  contextText: '[Trích đoạn toan-10-100]: Tam thức bậc hai'
});
assert.notStrictEqual(keyBase, keyDifferentContextChunks, 'Lỗi: Khác ngữ cảnh truy xuất nhưng khóa lại giống nhau!');
console.log('  ✅ Test 2 PASS: Khác danh sách chunk truy xuất => Sinh khóa khác nhau (Cache Miss)');

// 4. Khác nội dung trích đoạn (dù cùng ID) => Bắt buộc Cache Miss
const keyDifferentContextText = buildCacheKey({
  ...baseConfig,
  contextText: '[Trích đoạn toan-12-228]: Bản sửa đổi nội dung trích đoạn'
});
assert.notStrictEqual(keyBase, keyDifferentContextText, 'Lỗi: Khác nội dung ngữ cảnh trích đoạn nhưng khóa lại giống nhau!');
console.log('  ✅ Test 3 PASS: Khác nội dung trích đoạn ngữ cảnh => Sinh khóa khác nhau (Cache Miss)');

// 5. Khác mã băm dataset (datasetSha256) => Bắt buộc Cache Miss
const keyDifferentDataset = buildCacheKey({
  ...baseConfig,
  datasetSha256: 'bbbb9999888877776666555544443333222211110000ffffbbbbccccddddeeee'
});
assert.notStrictEqual(keyBase, keyDifferentDataset, 'Lỗi: Khác hash dataset nhưng khóa lại giống nhau!');
console.log('  ✅ Test 4 PASS: Khác mã băm bộ dữ liệu (datasetSha256) => Sinh khóa khác nhau (Cache Miss)');

// 6. Cùng cấu hình => Bắt buộc Cache Hit (Khóa giống hệt)
const keyIdentical = buildCacheKey(baseConfig);
assert.strictEqual(keyBase, keyIdentical, 'Lỗi: Cùng cấu hình nhưng khóa lại khác nhau!');
console.log('  ✅ Test 5 PASS: Cùng toàn bộ tham số => Khóa trùng khớp hoàn toàn (Cache Hit)');

// 7. Thử nghiệm trên điều kiện No-RAG: contextKey tự động chuyển thành 'no_ctx'
const keyNoRag = buildCacheKey({
  ...baseConfig,
  condition: 'no_rag',
  contextText: '',
  retrievedChunkIds: []
});
assert(keyNoRag.includes('no_ctx'), 'Lỗi: Điều kiện no_rag phải có chuỗi nhận diện no_ctx');
assert.notStrictEqual(keyBase, keyNoRag, 'Lỗi: No-RAG và RAG phải có khóa khác nhau');
console.log('  ✅ Test 6 PASS: Điều kiện No-RAG gắn đúng nhãn no_ctx và cô lập khỏi RAG');

console.log('\n🎉 TOÀN BỘ 6/6 TEST CÔ LẬP KHÓA BỘ NHỚ ĐỆM ĐÃ VƯỢT QUA!\n');

