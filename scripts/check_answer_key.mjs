/**
 * 🔍 Script Kiểm Tra Bộ Đáp Án Chuẩn (Answer Key Integrity Checker)
 * Tuân thủ Quy tắc Trung thực Prompt 0:
 * - CHỈ ĐỌC (Read-Only): Đọc trạng thái từ DUY NHẤT một nguồn chuẩn: docs/phieu-doi-chieu-nguon-chinh-thuc.md
 * - Nhận diện cả [x] và [X].
 * - Chỉ tính câu có ĐỦ 3 điều kiện:
 *   1. Đã có tích [x] hoặc [X] của người dùng.
 *   2. Có nguồn xác nhận đầy đủ (URL đề và URL đáp án hợp lệ).
 *   3. Phương pháp kiểm chứng hợp lệ: 'Tính toán độc lập' (computed_independent).
 * - Khử trùng lặp ID (De-duplicate) nếu có dòng lặp lại trong bảng.
 */

import fs from 'fs';
import path from 'path';

export function auditAnswerKeySheet(sheetPath = 'docs/phieu-doi-chieu-nguon-chinh-thuc.md') {
  const resolvedPath = path.resolve(sheetPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Không tìm thấy file phiếu đối chiếu: ${resolvedPath}`);
  }

  const content = fs.readFileSync(resolvedPath, 'utf8');
  const lines = content.split('\n');

  const validCheckedCases = new Map(); // id -> caseDetails
  const untickedCases = new Map();
  const invalidMethodCases = [];
  const missingSourceCases = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || trimmed.includes('STT | ID') || trimmed.includes(':---:')) continue;

    const parts = line.split('|').map(s => s.trim());
    // parts[0]='' | parts[1]=STT | parts[2]=ID | parts[3]=Môn | parts[4]=Số câu | parts[5]=Mã đề | parts[6]=Đáp án chính thức | parts[7]=Kết quả tính | parts[8]=Phương pháp | parts[9]=Độ tin cậy | parts[10]=Minh chứng ảnh | parts[11]=Nguồn thứ cấp | parts[12]=Checkbox
    if (parts.length < 13) continue;

    const id = parts[2].replace(/`/g, '').trim();
    // 🛡️ NGUỒN SỰ THẬT DUY NHẤT V1.4.x: Chỉ đếm các câu CAND_* trên phiếu đối chiếu mới.
    // Tuyệt đối không đếm các dòng ABL_* của bản cũ.
    if (!id.startsWith('CAND_')) {
      continue;
    }
    const subject = parts[3].trim();
    const questionNum = parts[4].trim();
    const examCode = parts[5].trim();
    const officialAnswer = parts[6].replace(/\*\*/g, '').trim();
    const calcResult = parts[7].trim();
    const method = parts[8].trim();
    const ocrConf = parts[9].trim();
    const cropImgs = parts[10].trim();
    const sourceUrls = parts[11].trim();
    const checkbox = parts[12].trim();

    const isTicked = /\[[xX]\]/.test(checkbox);
    const hasFullSource = /https?:\/\//i.test(sourceUrls);
    const isValidMethod = method.includes('Tính toán độc lập') || method.toLowerCase().includes('computed_independent');

    const caseData = {
      id, subject, questionNum, examCode, officialAnswer, calcResult,
      method, ocrConf, cropImgs, sourceUrls, isTicked, hasFullSource, isValidMethod
    };

    if (isTicked) {
      if (!hasFullSource) {
        missingSourceCases.push(caseData);
      } else if (!isValidMethod) {
        invalidMethodCases.push(caseData);
      } else {
        // Hợp lệ cả 3 điều kiện
        validCheckedCases.set(id, caseData);
      }
    } else {
      if (!untickedCases.has(id)) {
        untickedCases.set(id, caseData);
      }
    }
  }

  return {
    sheetPath,
    totalUniqueTickedEligible: validCheckedCases.size,
    eligibleCases: Array.from(validCheckedCases.values()),
    untickedUniqueCount: untickedCases.size,
    untickedCases: Array.from(untickedCases.values()),
    missingSourceCount: missingSourceCases.length,
    missingSourceCases,
    invalidMethodCount: invalidMethodCases.length,
    invalidMethodCases
  };
}

if (process.argv[1] && process.argv[1].endsWith('check_answer_key.mjs')) {
  console.log('========================================================================');
  console.log('🔍 KIỂM TOÁN TÍNH TOÀN VẸN BỘ ĐÁP ÁN (NGUỒN DUY NHẤT: PHIẾU ĐỐI CHIẾU)');
  console.log('========================================================================');

  const args = process.argv.slice(2);
  const sheetArg = args.find(a => a.startsWith('--sheet='));
  const sheetPath = sheetArg ? sheetArg.split('=')[1].trim() : 'docs/phieu-doi-chieu-nguon-chinh-thuc.md';

  try {
    const report = auditAnswerKeySheet(sheetPath);
    console.log(`📄 Tệp kiểm toán:                   ${report.sheetPath}`);
    console.log(`✅ Số câu ĐỦ ĐIỀU KIỆN (tích [x]/[X], đủ nguồn, tính độc lập): ${report.totalUniqueTickedEligible}`);
    console.log(`⏳ Số câu ứng viên độc nhất CHƯA TÍCH [ ]:                     ${report.untickedUniqueCount}`);
    console.log(`⚠️ Số câu có tích nhưng thiếu nguồn URL:                      ${report.missingSourceCount}`);
    console.log(`⚠️ Số câu có tích nhưng phương pháp không hợp lệ:              ${report.invalidMethodCount}`);

    if (report.totalUniqueTickedEligible > 0) {
      console.log('\n📋 DANH SÁCH CÁC CÂU ĐỦ ĐIỀU KIỆN:');
      report.eligibleCases.forEach((c, idx) => {
        console.log(`  ${idx + 1}. [${c.subject}] ${c.id} (${c.questionNum}) - ĐA: ${c.officialAnswer} | Độc lập: ${c.calcResult}`);
      });
    }

    if (report.untickedUniqueCount > 0) {
      console.log('\n⏳ TOÀN BỘ CÂU ĐANG CHỜ NGƯỜI DÙNG ĐỐI CHIẾU VÀ TÍCH TRÊN PHIẾU:');
      console.log(`   (Tổng cộng ${report.untickedUniqueCount} câu độc nhất trong phiếu đang ở trạng thái [ ])`);
    }

    console.log('\n========================================================================');
  } catch (err) {
    console.error('❌ Lỗi kiểm toán:', err.message);
    process.exit(1);
  }
}
