/**
 * 🧪 TEST SUITE: RAG PENDING & QUARANTINE ISOLATION (MỤC 3)
 *
 * Kiểm tra hồi quy:
 * 1. Bản ghi pending_review không bao giờ lọt vào RAG.
 * 2. Bản ghi quarantined / isDemo không bao giờ lọt vào RAG.
 * 3. Tri thức tự học (learned_knowledge) khi được duyệt chỉ mang nhãn
 *    "Tri thức bổ trợ của học sinh (đã qua giáo viên duyệt)", tuyệt đối KHÔNG mang nhãn "SGK <môn>".
 */

import assert from 'node:assert';
import { retrieveTopK, checkRAGCacheHit, getDynamicCorpus } from '../src/lib/ragService.js';
import { getSourceTypeLabel } from '../src/lib/responseVerifier.js';

console.log('🧪 BẮT ĐẦU KIỂM THỬ RAG ISOLATION & SOURCE LABEL INTEGRITY...');

let passed = 0;
let total = 0;

function it(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Lỗi: ${e.message}`);
    process.exitCode = 1;
  }
}

// 1. Kiểm tra không có bản ghi pending / demo / quarantined trong dynamic corpus
it('Tất cả bản ghi trong getDynamicCorpus() đều phải đã được duyệt và không cách ly/demo', () => {
  const dynamic = getDynamicCorpus();
  for (const item of dynamic) {
    assert.strictEqual(item.quarantined, false, `Item ${item.id} không được bị cách ly`);
    assert.strictEqual(item.isDemo, false, `Item ${item.id} không được là demo`);
    assert.strictEqual(item.status, 'verified_by_teacher', `Item ${item.id} phải có status verified_by_teacher`);
    const isV = Boolean(item.teacherVerified || item.isTeacherVerified);
    assert.strictEqual(isV, true, `Item ${item.id} phải có cờ teacherVerified`);
  }
});

// 2. Kiểm tra retrieveTopK không bao giờ trả về pending_review / quarantined / demo
it('retrieveTopK() tuyệt đối không chứa item pending_review hoặc demo', () => {
  const queries = [
    'định luật bảo toàn năng lượng trong dao động điều hòa',
    'phản ứng este hóa ancol và axit cacboxylic',
    'công thức tính đạo hàm hàm số mũ',
    'nguyên phân và giảm phân trong tế bào học'
  ];

  for (const q of queries) {
    const hits = retrieveTopK(q, 10);
    for (const h of hits) {
      assert.notStrictEqual(h.status, 'pending_review', `Mục ${h.id} đang pending không được xuất hiện`);
      assert.notStrictEqual(h.isDemo, true, `Mục demo ${h.id} không được xuất hiện`);
      assert.notStrictEqual(h.quarantined, true, `Mục cách ly ${h.id} không được xuất hiện`);
    }
  }
});

// 3. Kiểm tra checkRAGCacheHit không khớp item pending_review / demo
it('checkRAGCacheHit() không bao giờ trả về item unverified hoặc demo', () => {
  const cacheHit = checkRAGCacheHit('dân số việt nam');
  if (cacheHit.hit) {
    assert.strictEqual(cacheHit.quarantined, false);
    assert.strictEqual(cacheHit.isDemo, false);
    assert.notStrictEqual(cacheHit.status, 'pending_review');
  }
});

// 4. Nhãn nguồn của tri thức tự học (learned_knowledge)
it('Tri thức tự học gắn nhãn "Tri thức bổ trợ của học sinh (đã qua giáo viên duyệt)", cấm gắn "SGK"', () => {
  const label = getSourceTypeLabel('learned_knowledge');
  assert.strictEqual(label, 'Tri thức bổ trợ của học sinh (đã qua giáo viên duyệt)');
  assert.strictEqual(label.includes('SGK'), false, 'Cấm có chữ SGK trong nhãn tri thức tự học');
  assert.strictEqual(label.includes('Sách giáo khoa'), false, 'Cấm có chữ Sách giáo khoa trong nhãn tri thức tự học');
});

// 5. Kiểm tra kết quả truy xuất với chunk tự học
it('Nếu chunk là learned, sourceType phải là learned_knowledge, không bao giờ là SGK', () => {
  const hits = retrieveTopK('phản ứng tạo kết tủa trong dung dịch chất điện li', 5);
  for (const h of hits) {
    if (h.isLearned) {
      assert.strictEqual(h.sourceType, 'learned_knowledge');
      const label = getSourceTypeLabel(h.sourceType);
      assert.strictEqual(label.includes('SGK'), false);
    }
  }
});

console.log(`\n🏁 KẾT QUẢ: ${passed}/${total} TESTS PASS!`);

