import assert from 'assert';
import { matchNumericalAnswer } from '../src/lib/ablationGrader.js';

console.log('=== TEST SUITE: KIỂM THỬ QUY TẮC CHẤM SỐ HỌC (NUMERICAL GRADING RULES) ===');
console.log('Căn cứ: docs/quy-tac-cham-ablation.md (Mục 3.2 & 3.3)');

// 1. Biến thể số học thập phân (Căn cứ câu CAND_MATH_01: GT = 5,91)
const gt591 = '5,91';

const testCases591 = [
  { input: '5,91', desc: 'Dấu phẩy chuẩn', expected: true },
  { input: '5.91', desc: 'Dấu chấm chuẩn hóa', expected: true },
  { input: '5,9', desc: 'Làm tròn 1 chữ số thập phân (sai số 0.01 <= 0.02)', expected: true },
  { input: '5,910', desc: 'Dư số 0 vô nghĩa ở đuôi', expected: true },
  { input: 'xấp xỉ 5,91', desc: 'Kèm tiền tố định tính', expected: true },
  { input: '5,91 cm3', desc: 'Kèm đơn vị đo cm3', expected: true },
  { input: 'Thể tích hạt cườm là 5,91 cm^3.', desc: 'Câu kết luận đầy đủ', expected: true },
  { input: '7,35', desc: 'Số sai lệch ngoài dung sai', expected: false }
];

console.log('\n--- 1. Kiểm thử biến thể 5,91 ---');
testCases591.forEach(tc => {
  const res = matchNumericalAnswer(gt591, tc.input, 0.02);
  console.log(`  * [${res.isCorrect === tc.expected ? 'PASS' : 'FAIL'}] "${tc.input}" (${tc.desc}) -> ${res.isCorrect ? 'ĐÚNG' : 'SAI'} (Rule: ${res.rule})`);
  assert.strictEqual(res.isCorrect, tc.expected, `Thất bại tại ca: ${tc.desc}`);
});

// 2. Trắc nghiệm Phần I (Căn cứ CAND_MATH_06: GT = "B. (1; 0)")
const gtMCQ = 'B. (1; 0)';

const testCasesMCQ = [
  { input: 'B', desc: 'Chỉ ghi chữ cái phương án', expected: true },
  { input: 'Chọn phương án B.', desc: 'Câu khẳng định chữ cái', expected: true },
  { input: '(1; 0)', desc: 'Chỉ ghi nội dung nghiệm', expected: true },
  { input: 'B. (1; 0)', desc: 'Ghi cả chữ cái và nội dung', expected: true },
  { input: 'Đáp án là B. Cặp số (1, 0) thỏa mãn hệ.', desc: 'Văn bản diễn giải đầy đủ', expected: true },
  { input: 'A', desc: 'Phương án sai A', expected: false },
  { input: '(0; 2)', desc: 'Nội dung phương án sai', expected: false }
];

console.log('\n--- 2. Kiểm thử trắc nghiệm Phần I ---');
testCasesMCQ.forEach(tc => {
  const res = matchNumericalAnswer(gtMCQ, tc.input);
  console.log(`  * [${res.isCorrect === tc.expected ? 'PASS' : 'FAIL'}] "${tc.input}" (${tc.desc}) -> ${res.isCorrect ? 'ĐÚNG' : 'SAI'} (Rule: ${res.rule})`);
  assert.strictEqual(res.isCorrect, tc.expected, `Thất bại tại ca trắc nghiệm: ${tc.desc}`);
});

// 3. Đáp án có nhiều số trong lời giải
console.log('\n--- 3. Kiểm thử văn bản có nhiều số trung gian ---');
const multiNumberResponse = `
Bước 1: Bán kính elip a = 1,5 cm, b = 1 cm.
Bước 2: Khoan lỗ trụ có bán kính r = 0,2 cm.
Bước 3: Chiều cao h = 2,4 cm. Thể tích hình trụ khoét đi là 0,30 cm3.
Bước 4: Thể tích khối tròn xoay ban đầu là 6,21 cm3.
Kết luận: Thể tích còn lại của hạt cườm là 5,91 cm3.
`;
const multiRes = matchNumericalAnswer(gt591, multiNumberResponse, 0.02);
console.log(`  * [${multiRes.isCorrect ? 'PASS' : 'FAIL'}] Lời giải 5 bước nhiều số -> ${multiRes.isCorrect ? 'ĐÚNG' : 'SAI'} (Bắt được số: ${multiRes.extractedValue})`);
assert.strictEqual(multiRes.isCorrect, true, 'Phải trích xuất được số cuối 5.91 trong văn bản nhiều số!');

// 4. Mã 4 chữ số (Căn cứ CAND_CHEM_03: GT = "3412")
console.log('\n--- 4. Kiểm thử mã 4 chữ số định danh ---');
const gtCode = '3412';
const codeTests = [
  { input: 'Thứ tự các phản ứng là 3412', expected: true, desc: 'Có chứa đúng mã 3412' },
  { input: '3412', expected: true, desc: 'Chỉ ghi mã 3412' },
  { input: 'Thứ tự là 3415', expected: false, desc: 'Mã sai 3415' },
  { input: '1234', expected: false, desc: 'Mã sai 1234' }
];

codeTests.forEach(tc => {
  const res = matchNumericalAnswer(gtCode, tc.input);
  console.log(`  * [${res.isCorrect === tc.expected ? 'PASS' : 'FAIL'}] "${tc.input}" (${tc.desc}) -> ${res.isCorrect ? 'ĐÚNG' : 'SAI'}`);
  assert.strictEqual(res.isCorrect, tc.expected, `Thất bại tại kiểm thử mã: ${tc.desc}`);
});

console.log('\n✅ [HOÀN THÀNH TOÀN BỘ TEST]: Mọi quy tắc chấm số học đã kiểm thử thành công theo docs/quy-tac-cham-ablation.md!');

