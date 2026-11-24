/**
 * 🧪 AUTOMATED TEST SUITE: GROUNDING & UI NEGATIVE CASES
 * 
 * Bộ kiểm thử tự động xác minh các trường hợp tiêu cực (Negative Cases):
 * 1. Chunk có nguồn unknown / team_summary không bao giờ hiển thị thành SGK.
 * 2. Câu hỏi ngoài phạm vi tuyệt đối không bịa trích đoạn (snippet = null).
 * 3. Tri thức tự học chưa duyệt (pending / demo / quarantined) bị cách ly hoàn toàn,
 *    không hiển thị cho học sinh khác trong RAG.
 * 4. Hậu kiểm phát hiện chunkId giả mạo và số liệu/công thức không có trong nguồn.
 */

import assert from 'node:assert';
import { getSourceTypeLabel, verifyResponseGrounding, extractChunkIds, extractFormulasAndNumbers } from '../src/lib/responseVerifier.js';
import { retrieveTopK, saveLearnedAnswerToRAG } from '../src/lib/ragService.js';

console.log('🧪 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG CÁC TRƯỜNG HỢP TIÊU CỰC (NEGATIVE CASES)...');

let passedTests = 0;
let totalTests = 0;

function runTest(testName, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${testName}`);
    console.error(`     Chi tiết: ${err.message}`);
    process.exitCode = 1;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 1: Source Label Integrity
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 1. Kiểm tra tính trung thực của Nhãn Nguồn (Source Label) ---');

runTest('Chunk có sourceType unknown hoặc undefined KHÔNG ĐƯỢC hiển thị là SGK', () => {
  const labelUnknown = getSourceTypeLabel('unknown');
  const labelUndefined = getSourceTypeLabel(undefined);
  const labelEmpty = getSourceTypeLabel('');

  assert.strictEqual(labelUnknown, 'Nguồn chưa xác định');
  assert.strictEqual(labelUndefined, 'Nguồn chưa xác định');
  assert.strictEqual(labelEmpty, 'Nguồn chưa xác định');

  assert.strictEqual(labelUnknown.includes('SGK'), false, 'Không được chứa chữ SGK');
  assert.strictEqual(labelUndefined.includes('SGK'), false, 'Không được chứa chữ SGK');
});

runTest('Chunk team_summary phải hiển thị đúng bản tóm tắt do nhóm biên soạn, cấm gọi là SGK', () => {
  const label = getSourceTypeLabel('team_summary');
  assert.strictEqual(label, 'Bản tóm tắt do nhóm biên soạn theo chương trình GDPT 2018');
  assert.strictEqual(label.includes('Trích đoạn SGK'), false, 'Không được tự nhận là Trích đoạn SGK');
});

runTest('Chỉ khi sourceType là textbook_excerpt mới được gắn nhãn Trích đoạn SGK', () => {
  const label = getSourceTypeLabel('textbook_excerpt');
  assert.strictEqual(label, 'Trích đoạn SGK');
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 2: Out-of-Scope Queries Do Not Fabricate Snippets
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 2. Kiểm tra câu hỏi ngoài phạm vi không bịa trích đoạn ---');

runTest('Câu hỏi ngoài phạm vi có độ tương quan thấp phải bị từ chối và snippet = null', () => {
  const oosQuery = "Hôm nay thời tiết Hà Nội bao nhiêu độ?";
  const hits = retrieveTopK(oosQuery, 3);
  const topScore = hits.length > 0 ? hits[0].score : 0;

  // Mô phỏng logic gán grounding evidence khi từ chối (Khớp ngưỡng Abstention < 0.30 của GlobalAIAssistant.jsx)
  const evidence = {
    status: topScore >= 0.30 ? 'grounded' : 'ungrounded',
    score: topScore,
    snippet: topScore >= 0.30 && hits.length > 0 ? hits[0].content.slice(0, 150) : null,
    sourceType: topScore >= 0.30 && hits.length > 0 ? hits[0].sourceType : 'unknown',
    warningMessage: 'Chưa tìm thấy căn cứ trong kho tài liệu. Hãy đối chiếu sách giáo khoa hoặc hỏi giáo viên.'
  };

  assert.strictEqual(evidence.status, 'ungrounded', 'Trạng thái phải là ungrounded');
  assert.strictEqual(evidence.snippet, null, 'Snippet của câu ngoài phạm vi phải tuyệt đối bằng null (không được bịa trích đoạn)');
  assert.strictEqual(evidence.sourceType, 'unknown', 'Loại nguồn của câu ngoài phạm vi phải là unknown');
  assert.ok(evidence.warningMessage.includes('Chưa tìm thấy căn cứ trong kho tài liệu'));
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 3: Knowledge Isolation & Quarantine
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 3. Kiểm tra cách ly tri thức tự học (Quarantine & Demo Isolation) ---');

runTest('Tri thức tự học ở trạng thái pending_review hoặc isDemo bị loại khỏi kết quả RAG', () => {
  // Lấy kết quả truy xuất cho một chủ đề
  const results = retrieveTopK('công thức tính diện tích hình phẳng tích phân', 5);
  
  // Xác minh không có bản ghi nào là demo hoặc chưa qua duyệt
  for (const doc of results) {
    assert.notStrictEqual(doc.status, 'pending_review', `Tài liệu ${doc.id} đang pending không được xuất hiện trong RAG`);
    assert.notStrictEqual(doc.isDemo, true, `Tài liệu demo ${doc.id} không được xuất hiện trong RAG thực tế`);
    assert.notStrictEqual(doc.quarantined, true, `Tài liệu bị cách ly ${doc.id} không được xuất hiện trong RAG`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 4: LLM Response Post-Verification (Heuristic Verifier)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 4. Kiểm tra Hậu kiểm suy nghiệm câu trả lời (Heuristic Verifier) ---');

runTest('Phát hiện chunkId giả mạo không tồn tại trong stem-corpus', () => {
  const result = verifyResponseGrounding({
    answerText: 'Kiến thức này lấy từ mã [Mã ID: fake-chunk-999] và hoa-10-001.',
    retrievedChunks: [{ id: 'hoa-10-001', topic: 'Cấu tạo', content: 'nguyên tử hạt nhân' }]
  });

  assert.strictEqual(result.hasUnverifiedContent, true, 'Phải gắn cờ hasUnverifiedContent khi có chunkId giả');
  assert.deepStrictEqual(result.invalidChunkIds, ['fake-chunk-999'], 'Phải phát hiện chính xác fake-chunk-999');
  assert.deepStrictEqual(result.validChunkIds, ['hoa-10-001'], 'Phải công nhận hoa-10-001 là ID hợp lệ');
  assert.ok(result.warningMessage.includes('fake-chunk-999'), 'Cảnh báo phải nêu rõ ID giả mạo');
});

runTest('Phát hiện số liệu/công thức không có trong nguồn đối chiếu', () => {
  const result = verifyResponseGrounding({
    answerText: 'Gia tốc trọng trường tại bề mặt Trái Đất đo được là $g = 99.8$ và hằng số đặc biệt là 88888.',
    retrievedChunks: [
      { id: 'ly-10-001', topic: 'Rơi tự do', content: 'Gia tốc rơi tự do thường lấy g = 9.8 m/s2.' }
    ]
  });

  assert.strictEqual(result.hasUnverifiedContent, true, 'Phải gắn cờ cảnh báo khi có số liệu lạ');
  assert.ok(result.unverifiedElements.includes('88888'), 'Phải phát hiện số 88888 không có trong nguồn');
  assert.ok(result.warningMessage.includes('chưa tìm thấy trong nguồn'), 'Phải chứa thông điệp cảnh báo');
  assert.strictEqual(result.heuristicCheck, true, 'Phải có cờ heuristicCheck = true');
});

runTest('Khi công thức và số liệu khớp với nguồn hoặc solver xác định, kiểm tra hợp lệ', () => {
  const result = verifyResponseGrounding({
    answerText: 'Gia tốc trọng trường lấy xấp xỉ là 9.8 m/s2 theo công thức rơi tự do.',
    retrievedChunks: [
      { id: 'ly-10-001', topic: 'Rơi tự do', content: 'Gia tốc rơi tự do g = 9.8 m/s2.' }
    ],
    deterministicFacts: ['9.8']
  });

  assert.strictEqual(result.isGrounded, true, 'isGrounded phải là true');
  assert.strictEqual(result.hasUnverifiedContent, false, 'hasUnverifiedContent phải là false');
  assert.strictEqual(result.unverifiedElements.length, 0, 'Không được có phần tử chưa kiểm chứng');
  assert.strictEqual(result.warningMessage, null, 'Không được có cảnh báo khi dữ liệu khớp');
});

console.log(`\n========================================================================`);
console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐẠT YÊU CẦU!`);
console.log(`========================================================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}

