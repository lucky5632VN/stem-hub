import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { auditAnswerKeySheet } from '../scripts/check_answer_key.mjs';

console.log('=== TEST: BỘ KIỂM TRA ĐÁP ÁN (ANSWER KEY INTEGRITY CHECKER) ===');

// 1. Kiểm tra trên phiếu thực tế (Người dùng đã xác nhận tự tay tích [X] toàn bộ 40 câu, trong đó 24 câu số học CAND_* hợp lệ)
const realReport = auditAnswerKeySheet('docs/phieu-doi-chieu-nguon-chinh-thuc.md');
console.log(`- Phiếu thật: ${realReport.totalUniqueTickedEligible} câu số học hợp lệ đã tích, ${realReport.untickedUniqueCount} câu chưa tích.`);
assert.strictEqual(realReport.totalUniqueTickedEligible, 24, 'Phiếu thật phải có đúng 24 câu số học CAND_* hợp lệ đã được người dùng tích!');
assert.strictEqual(realReport.untickedUniqueCount, 0, 'Phiếu thật đã được người dùng tích hết toàn bộ (0 câu chưa tích)!');

// 2. Tạo một file fixture giả lập để kiểm tra logic [x], [X], thiếu nguồn, sai method
const mockSheetPath = path.resolve('scratch/test_mock_sheet.md');
if (!fs.existsSync('scratch')) fs.mkdirSync('scratch', { recursive: true });

const mockContent = `# TEST SHEET
| STT | ID | Môn | Số câu | Mã đề | Đáp án chính thức | Kết quả tính | Phương pháp kiểm chứng | Độ tin cậy | Minh chứng ảnh | Nguồn thứ cấp | Tôi đã đối chiếu |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: |
| 1 | \`CAND_01\` | TOAN | C1 | 0115 | 5 | 5 | Tính toán độc lập | cao | [Ảnh](crop1.png) | [Link](https://moet.gov.vn/1) | [x] |
| 2 | \`CAND_02\` | HOA | C2 | 0340 | 10 | 10 | Tính toán độc lập | cao | [Ảnh](crop2.png) | [Link](https://moet.gov.vn/2) | [X] |
| 3 | \`CAND_03\` | LY | C3 | 0214 | 15 | 15 | Tính toán độc lập | cao | [Ảnh](crop3.png) | Không có URL | [x] |
| 4 | \`CAND_04\` | SINH | C4 | 0431 | 20 | 20 | Đối chiếu bảng đáp án | trung bình | [Ảnh](crop4.png) | [Link](https://moet.gov.vn/4) | [x] |
| 5 | \`CAND_05\` | TOAN | C5 | 0115 | 25 | 25 | Tính toán độc lập | cao | [Ảnh](crop5.png) | [Link](https://moet.gov.vn/5) | [ ] |
| 6 | \`CAND_01\` | TOAN | C1 | 0115 | 5 | 5 | Tính toán độc lập | cao | [Ảnh](crop1.png) | [Link](https://moet.gov.vn/1) | [x] |
`;

fs.writeFileSync(mockSheetPath, mockContent, 'utf8');

const mockReport = auditAnswerKeySheet(mockSheetPath);
console.log('\nKết quả kiểm tra Mock Sheet:');
console.log(`- Đủ điều kiện (kỳ vọng 2: CAND_01 [x], CAND_02 [X]): ${mockReport.totalUniqueTickedEligible}`);
console.log(`- Thiếu nguồn (kỳ vọng 1: CAND_03): ${mockReport.missingSourceCount}`);
console.log(`- Sai phương pháp (kỳ vọng 1: CAND_04): ${mockReport.invalidMethodCount}`);
console.log(`- Chưa tích (kỳ vọng 1: CAND_05): ${mockReport.untickedUniqueCount}`);

assert.strictEqual(mockReport.totalUniqueTickedEligible, 2, 'Phải nhận cả [x] và [X] và khử trùng lặp CAND_01!');
assert.strictEqual(mockReport.missingSourceCount, 1, 'Phải phát hiện CAND_03 thiếu nguồn URL!');
assert.strictEqual(mockReport.invalidMethodCount, 1, 'Phải phát hiện CAND_04 không phải Tính toán độc lập!');
assert.strictEqual(mockReport.untickedUniqueCount, 1, 'Phải giữ CAND_05 là chưa tích!');

fs.unlinkSync(mockSheetPath);

// 3. Test bảo vệ nguồn sự thật: Mock dòng ABL_* được tích [x] nhưng CAND_* không tích => Cổng KHÔNG mở (0 câu hợp lệ)
const mockAblTickedPath = path.resolve('scratch/test_mock_abl_sheet.md');
const mockAblContent = `# TEST ABL TICKED SHEET
| STT | ID | Môn | Số câu | Mã đề | Đáp án chính thức | Kết quả tính | Phương pháp kiểm chứng | Độ tin cậy | Minh chứng ảnh | Nguồn thứ cấp | Tôi đã đối chiếu |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: |
| 1 | \`ABL_IN_NUM_01\` | TOAN | C1 | 0115 | 5 | 5 | Tính toán độc lập | cao | [Ảnh](crop1.png) | [Link](https://moet.gov.vn/1) | [x] |
| 2 | \`ABL_IN_NUM_02\` | TOAN | C2 | 0115 | 10 | 10 | Tính toán độc lập | cao | [Ảnh](crop2.png) | [Link](https://moet.gov.vn/2) | [x] |
| 3 | \`ABL_IN_CONCEPT_01\` | TOAN | C3 | 0115 | 15 | 15 | Tính toán độc lập | cao | [Ảnh](crop3.png) | [Link](https://moet.gov.vn/3) | [x] |
| 4 | \`CAND_MATH_01\` | TOAN | C1 | 0115 | 5.91 | 5.91 | Tính toán độc lập | cao | [Ảnh](crop4.png) | [Link](https://moet.gov.vn/4) | [ ] |
| 5 | \`CAND_MATH_02\` | TOAN | C2 | 0115 | 1275 | 1275 | Tính toán độc lập | cao | [Ảnh](crop5.png) | [Link](https://moet.gov.vn/5) | [ ] |
`;

fs.writeFileSync(mockAblTickedPath, mockAblContent, 'utf8');
const ablReport = auditAnswerKeySheet(mockAblTickedPath);
console.log('\nKết quả kiểm tra Mock ABL Ticked (CAND_* không tích):');
console.log(`- Số câu đủ điều kiện: ${ablReport.totalUniqueTickedEligible} (Kỳ vọng: 0)`);
console.log(`- Số câu chưa tích: ${ablReport.untickedUniqueCount} (Kỳ vọng: 2 CAND_* chưa tích)`);

assert.strictEqual(ablReport.totalUniqueTickedEligible, 0, 'Cổng KHÔNG ĐƯỢC MỞ khi chỉ có ABL_* được tích mà CAND_* không tích!');
assert.strictEqual(ablReport.untickedUniqueCount, 2, 'Chỉ nhận diện 2 câu CAND_*, bỏ qua hoàn toàn các dòng ABL_*!');

fs.unlinkSync(mockAblTickedPath);
console.log('✅ [PASS] Test bảo vệ: Dòng ABL_* tích nhưng CAND_* không tích => Cổng KHÔNG mở!');
