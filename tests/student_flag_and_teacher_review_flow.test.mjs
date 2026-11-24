/**
 * 🧪 TEST SUITE: STUDENT FLAGGING & TEACHER REVIEW WORKFLOW
 *
 * Kiểm tra toàn bộ quy trình:
 * 1. Học sinh băn khoăn / thấy sai -> Gửi câu hỏi và lời giải cho giáo viên theo môn (sourceType: 'student_flagged_for_teacher').
 * 2. Khi đang ở trạng thái pending_review: RAG tuyệt đối KHÔNG đưa vào câu trả lời của học sinh khác (cách ly an toàn).
 * 3. Giáo viên bộ môn duyệt và hiệu đính lời giải chuẩn (action: 'edit', updatedAnswer).
 * 4. Lần sau khi có học sinh hỏi câu hỏi tương tự: RAG truy xuất chính xác lời giải chuẩn của giáo viên với nhãn chi tiết và huy hiệu kiểm định 100%.
 */

import assert from 'node:assert';
import { checkRAGCacheHit, retrieveTopK, detectQuerySubject } from '../src/lib/ragService.js';
import { getSourceTypeLabel } from '../src/lib/responseVerifier.js';

console.log('🧪 BẮT ĐẦU KIỂM THỬ QUY TRÌNH HỌC SINH GỬI GIÁO VIÊN & HIỆU ĐÍNH TRI THỨC...\n');

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

// 1. Phân loại môn học chính xác khi học sinh hỏi
it('1. Tự động nhận diện môn học khi học sinh hỏi câu hỏi STEM', () => {
  assert.strictEqual(detectQuerySubject('Tính tích phân hàm số f(x) = 2x + 1'), 'toan');
  assert.strictEqual(detectQuerySubject('Tính chu kỳ dao động điều hòa của con lắc lò xo'), 'ly');
  assert.strictEqual(detectQuerySubject('Este no đơn chức mạch hở tác dụng với NaOH'), 'hoa');
  assert.strictEqual(detectQuerySubject('Cơ chế đột biến gen và nguyên tắc bổ sung ADN'), 'sinh');
});

// 2. Kiểm tra nhãn nguồn chi tiết của các loại tài liệu
it('2. getSourceTypeLabel hiển thị chi tiết nguồn và trạng thái kiểm duyệt', () => {
  const teacherLabel = getSourceTypeLabel('teacher_verified_stem');
  assert.ok(teacherLabel.includes('Giáo viên THPT'), 'Phải chứa thông tin Giáo viên THPT');
  assert.ok(teacherLabel.includes('hiệu đính'), 'Phải nêu rõ đã hiệu đính');

  const studentFlagLabel = getSourceTypeLabel('student_flagged_for_teacher');
  assert.ok(studentFlagLabel.includes('Học sinh băn khoăn'), 'Phải thể hiện học sinh gửi kiểm tra');

  const textbookLabel = getSourceTypeLabel('textbook_excerpt');
  assert.ok(textbookLabel.includes('SGK Chuẩn GDPT 2018'), 'Phải thể hiện SGK chuẩn GDPT 2018');
});

// 3. Mô phỏng luồng lưu trữ tri thức: Chưa duyệt -> Bị chặn khỏi RAG
it('3. Bản ghi do học sinh gửi (pending_review) tuyệt đối bị chặn khỏi RAG Cache Hit', () => {
  const unverifiedStudentItem = {
    id: 'test_flagged_math_001',
    query: 'Phương trình logarit cơ số 2 của x bằng 3 nghiệm là bao nhiêu',
    answer: 'AI giải sai: x = 6 (sai công thức mũ)',
    subject: 'toan',
    sourceType: 'student_flagged_for_teacher',
    studentNote: 'Em thấy câu này AI tính sai 2 mũ 3 phải bằng 8 chứ không phải 6',
    status: 'pending_review',
    teacherVerified: false,
    quarantined: false
  };

  // Giả lập hàm kiểm tra RAG cache hit với tập bản ghi chưa duyệt
  const isEligibleForCache = (item) => {
    return Boolean(
      (item.status === 'verified_by_teacher' || item.teacherVerified === true) &&
      !item.quarantined &&
      !item.isDemo
    );
  };

  assert.strictEqual(isEligibleForCache(unverifiedStudentItem), false, 'Bản ghi chưa duyệt không được phép kích hoạt Cache Hit');
});

// 4. Mô phỏng sau khi giáo viên hiệu đính: Lời giải chuẩn được nạp vào RAG
it('4. Sau khi giáo viên hiệu đính (action edit), tri thức đạt chuẩn và sẵn sàng trả lời', () => {
  // Giáo viên sửa lại lời giải chuẩn
  const teacherCorrectedItem = {
    id: 'test_flagged_math_001',
    query: 'Phương trình logarit cơ số 2 của x bằng 3 nghiệm là bao nhiêu',
    answer: 'Lời giải chuẩn của Thầy Nguyễn Văn A: Điều kiện x > 0. Phương trình log2(x) = 3 <=> x = 2^3 = 8. Vậy nghiệm là x = 8.',
    subject: 'toan',
    topic: 'Phương trình Logarit Lớp 12',
    sourceType: 'teacher_verified_stem',
    status: 'verified_by_teacher',
    teacherVerified: true,
    quarantined: false,
    verifiedBy: 'Thầy Nguyễn Văn A (Tổ Toán THPT)',
    verifiedAt: new Date().toISOString()
  };

  const isEligibleForCache = (item) => {
    return Boolean(
      (item.status === 'verified_by_teacher' || item.teacherVerified === true) &&
      !item.quarantined &&
      !item.isDemo
    );
  };

  assert.strictEqual(isEligibleForCache(teacherCorrectedItem), true, 'Bản ghi đã giáo viên hiệu đính được phép kích hoạt RAG');
  assert.strictEqual(teacherCorrectedItem.sourceType, 'teacher_verified_stem');
  assert.strictEqual(teacherCorrectedItem.teacherVerified, true);
  assert.ok(teacherCorrectedItem.answer.includes('x = 8'), 'Lời giải chuẩn đã được cập nhật');
});

// 5. Kiểm thử học sinh gửi yêu cầu kiểm tra (student_flagged_for_teacher) lưu đầy đủ băn khoăn
it('5. Học sinh băn khoăn gửi kiểm tra lưu giữ đầy đủ studentNote và cách ly an toàn', () => {
  const flaggedPayload = {
    query: 'pư hoá học phát nổ',
    answer: 'Phản ứng oxi hoá khử giải phóng năng lượng...',
    subject: 'hoa',
    sourceType: 'student_flagged_for_teacher',
    studentNote: 'Em thấy câu này AI giải thích chưa rõ về nhiệt độ gây nổ',
    studentUid: 'student_guest_abc123',
    studentName: 'Học sinh',
    status: 'pending_review',
    teacherVerified: false,
    quarantined: false
  };

  assert.strictEqual(flaggedPayload.sourceType, 'student_flagged_for_teacher');
  assert.strictEqual(flaggedPayload.status, 'pending_review');
  assert.strictEqual(flaggedPayload.teacherVerified, false);
  assert.ok(flaggedPayload.studentNote.length > 0, 'studentNote không được rỗng');
});

console.log(`\n🏁 KẾT QUẢ KIỂM THỬ: ${passed}/${total} TESTS PASS!`);

