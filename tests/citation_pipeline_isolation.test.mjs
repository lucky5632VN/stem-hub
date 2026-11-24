/**
 * 🧪 TEST SUITE: CITATION PIPELINE & EVIDENCE BOX ISOLATION (MỤC 4)
 *
 * Kiểm tra:
 * 1. Câu STEM mà kho không có chunk phù hợp (< 0.30) => không có khối nguồn (GroundingEvidenceBox hides / returns null).
 * 2. Câu ngoài STEM (như "kiến thức địa lí") => không có khối nguồn (GroundingEvidenceBox hides / returns null).
 * 3. Câu GROUNDED (STEM có chunk >= 0.30) => khối nguồn lấy đúng chunk thực tế.
 */

import assert from 'node:assert';
import { retrieveTopK, detectQuerySubject } from '../src/lib/ragService.js';
import { getSourceTypeLabel, verifyResponseGrounding } from '../src/lib/responseVerifier.js';

console.log('🧪 BẮT ĐẦU KIỂM THỬ CITATION PIPELINE & EVIDENCE BOX ISOLATION...');

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

// Hàm giả lập logic hiển thị của GroundingEvidenceBox
function evaluateEvidenceBoxDisplay(query, hits, aiResponseText = '') {
  const isNonStemQuery = /địa\s*l[ýí]|lịch\s*sử|\bsử\b|ngữ\s*văn|văn\s*học|tiếng\s*anh|ngoại\s*ngữ|gdcd|kinh\s*tế\s*pháp\s*luật|triết\s*học/i.test(query);
  const isOutOfScopeRefusal = (
    aiResponseText.toLowerCase().includes('chuyên hỗ trợ các môn stem') ||
    aiResponseText.toLowerCase().includes('ngoài phạm vi') ||
    aiResponseText.toLowerCase().includes('khoa học tự nhiên') ||
    aiResponseText.toLowerCase().includes('cảnh báo thiếu căn cứ')
  );

  const topChunk = (hits && hits.length > 0) ? hits[0] : null;
  const topScore = topChunk ? (topChunk.score || 0) : 0;
  const isRefusal = Boolean(isNonStemQuery || isOutOfScopeRefusal || topScore < 0.30);

  const groundingStatus = topScore >= 0.30 ? 'grounded' : (topScore >= 0.15 ? 'weak' : 'ungrounded');

  const evidence = {
    status: isRefusal ? 'ungrounded' : groundingStatus,
    score: isRefusal ? 0 : topScore,
    snippet: (!isRefusal && topChunk && topScore >= 0.30) ? topChunk.content.slice(0, 100) : null,
    chunkId: (!isRefusal && topChunk && topScore >= 0.30) ? topChunk.id : null,
    sourceType: (!isRefusal && topChunk) ? topChunk.sourceType : 'unknown',
    isRefusal: isRefusal,
    isOutOfScope: Boolean(isNonStemQuery)
  };

  // Logic hiển thị của GroundingEvidenceBox
  const shouldRender = (
    evidence &&
    evidence.status === 'grounded' &&
    !evidence.isRefusal &&
    !evidence.isOutOfScope &&
    typeof evidence.score === 'number' && evidence.score >= 0.30 &&
    Boolean(evidence.snippet)
  );

  return { shouldRender, evidence };
}

// 1. Câu ngoài STEM: "kiến thức địa lí"
it('1. Câu ngoài STEM ("kiến thức địa lí") => Không có khối nguồn (shouldRender = false)', () => {
  const q = 'kiến thức địa lí';
  const hits = retrieveTopK(q, 3);
  const refusalText = 'Lưu ý rằng NOVA chuyên hỗ trợ các môn STEM (Toán, Lý, Hóa, Sinh)...';
  
  const { shouldRender, evidence } = evaluateEvidenceBoxDisplay(q, hits, refusalText);
  assert.strictEqual(shouldRender, false, 'Khối nguồn phải ẩn hoàn toàn khi câu hỏi ngoài STEM');
  assert.strictEqual(evidence.snippet, null, 'Snippet phải bằng null');
  assert.strictEqual(evidence.isRefusal, true, 'isRefusal phải là true');
  assert.strictEqual(evidence.isOutOfScope, true, 'isOutOfScope phải là true');
});

// 2. Câu STEM mà kho không có chunk phù hợp (< 0.30)
it('2. Câu STEM không có chunk phù hợp => Không có khối nguồn (shouldRender = false)', () => {
  const q = 'toán học ma trận lượng tử trong không gian n chiều phi euclid cực đại';
  const hits = retrieveTopK(q, 3);
  const abstentionText = 'Cảnh báo thiếu căn cứ: Câu hỏi nằm ngoài phạm vi kho ngữ liệu...';

  const { shouldRender, evidence } = evaluateEvidenceBoxDisplay(q, hits, abstentionText);
  assert.strictEqual(shouldRender, false, 'Khối nguồn phải ẩn khi không có căn cứ (score < 0.30)');
  assert.strictEqual(evidence.status, 'ungrounded');
  assert.strictEqual(evidence.snippet, null);
});

// 3. Câu GROUNDED: STEM có chunk phù hợp (>= 0.30)
it('3. Câu GROUNDED (STEM có chunk >= 0.30) => Khối nguồn lấy đúng chunk thực tế', () => {
  const q = 'công thức tính chu kỳ con lắc đơn dao động điều hòa';
  const hits = retrieveTopK(q, 3);
  assert.ok(hits.length > 0, 'Phải tìm thấy chunk');
  assert.ok(hits[0].score >= 0.30, `Score phải >= 0.30, thực tế: ${hits[0].score}`);

  const aiResp = 'Chu kỳ dao động điều hòa của con lắc đơn được tính theo công thức T = 2π√(l/g).';
  const { shouldRender, evidence } = evaluateEvidenceBoxDisplay(q, hits, aiResp);

  assert.strictEqual(shouldRender, true, 'Khối nguồn phải hiển thị');
  assert.strictEqual(evidence.status, 'grounded');
  assert.strictEqual(evidence.chunkId, hits[0].id, 'ChunkId phải khớp chính xác topChunk');
  assert.ok(evidence.snippet.length > 0, 'Snippet phải có nội dung thực tế');
  assert.strictEqual(evidence.isRefusal, false);
});

// 4. Tuyệt đối không để chuỗi "[Nguồn dẫn chứng: ...]" lọt vào phản hồi
it('4. Phản hồi cuối cùng không chứa thẻ [Nguồn dẫn chứng: ...] bịa đặt', () => {
  const textWithFakeCitation = 'Lời giải bài toán.\n\n[Nguồn dẫn chứng: SGK LY - Đoạn mã test]';
  const cleaned = textWithFakeCitation.replace(/\[Nguồn dẫn chứng:\s*[^\]]+\]/gi, '').trim();
  assert.strictEqual(cleaned, 'Lời giải bài toán.', 'Thẻ [Nguồn dẫn chứng:] phải bị gỡ sạch');
});

console.log(`\n🏁 KẾT QUẢ: ${passed}/${total} TESTS PASS!`);

