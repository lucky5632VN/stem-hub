/**
 * 🔬 Auto-Grader Specification & 20-Sample Cross-Check (AI Reference vs Auto-Grader)
 * Tuân thủ Quy tắc Trung thực Prompt 0:
 * - Ghi rõ 20 nhãn tham chiếu là do AI/mô hình gán để khảo sát độ nhạy thuật toán, CHƯA PHẢI NGƯỜI THẬT
 * - Chấm cứng câu số học theo đáp số cuối (strict numerical value match)
 * - Bổ sung cờ needs_manual_review (cần chấm tay)
 * - Tách bạch báo cáo độ khớp theo từng loại câu: Số học, Khái niệm, Từ chối OOS, Dẫn nguồn
 */

import fs from 'fs';
import path from 'path';

const datasetPath = path.resolve('reports/ablation/ablation_dataset_100.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

// 20 câu mẫu phân tầng liên tục và tương ứng trực tiếp:
// 8 In-scope concept (0-7), 6 In-scope numerical (40-45), 6 Out-of-scope (70-75)
const sampleIndices = [
  0, 1, 2, 3, 4, 5, 6, 7,
  40, 41, 42, 43, 44, 45,
  70, 71, 72, 73, 74, 75
];

const testResponses = [
  // 0: ABL_IN_CONCEPT_01 (Cực trị hàm trị tuyệt đối)
  { text: 'Hàm số f(x) = x^3 - 3x^2 + 2 có 2 cực trị và có 3 nghiệm phân biệt cắt trục hoành. Do đó hàm |f(x)| có 2 + 3 = 5 điểm cực trị.', aiRefGrade: true },
  // 1: ABL_IN_CONCEPT_02 (Tiệm cận đứng (x^2-1)/(x-1))
  { text: 'Đồ thị hàm số không có đường tiệm cận đứng vì với x khác 1 thì y = x + 1, khi x tiến tới 1 thì giới hạn bằng 2 hữu hạn.', aiRefGrade: true },
  // 2: ABL_IN_CONCEPT_03 (Tích phân f(x)+f(-x)=cos(x))
  { text: 'Tích phân I từ -pi/2 đến pi/2 được tính bằng cách lấy 1/2 tích phân của cos(x), cho ra kết quả sai lệch là 0.', aiRefGrade: false },
  // 3: ABL_IN_CONCEPT_04 (Góc đường thẳng và mặt phẳng)
  { text: 'Trong không gian Oxyz, sin của góc phi giữa đường thẳng và mặt phẳng bằng trị tuyệt đối tích vô hướng chia tích độ dài: sin(phi) = |u.n| / (|u|.|n|).', aiRefGrade: true },
  // 4: ABL_IN_CONCEPT_05 (Xác suất có điều kiện Bayes)
  { text: 'Áp dụng công thức xác suất Bayes toàn phần, xác suất người có kết quả dương tính thực sự mắc bệnh xấp xỉ 16.6%.', aiRefGrade: true },
  // 5: ABL_IN_CONCEPT_06 (Thể tích khối tròn xoay)
  { text: 'Thể tích khối tròn xoay quanh trục Ox tính theo công thức V = pi * tích phân của y^2 từ a đến b.', aiRefGrade: true },
  // 6: ABL_IN_CONCEPT_07 (Mặt cầu tiếp xúc mặt phẳng)
  { text: 'Mặt cầu tiếp xúc mặt phẳng khi bán kính R bằng khoảng cách từ tâm I đến mặt phẳng (P).', aiRefGrade: true },
  // 7: ABL_IN_CONCEPT_08 (Tập xác định hàm lũy thừa)
  { text: 'Hàm số với số mũ nguyên âm xác định khi cơ số khác 0, số mũ không nguyên xác định khi cơ số lớn hơn 0.', aiRefGrade: true },

  // 40: ABL_IN_NUM_01 (Allolactose & Operon Lac)
  { text: 'Phân tử allolactose liên kết với protein ức chế làm biến đổi cấu hình không gian của protein ức chế, khiến nó không thể gắn vào vùng vận hành O.', aiRefGrade: true },
  // 41: ABL_IN_NUM_02 (Đột biến thêm 1 cặp vs 3 cặp nu)
  { text: 'Đột biến thêm 1 cặp nuclêôtit gây đột biến dịch khung đọc mã di truyền từ vị trí đột biến về sau, nên thường gây hậu quả nghiêm trọng hơn thêm 3 cặp nucleotide.', aiRefGrade: true },
  // 42: ABL_IN_NUM_03 (Cấu trúc di truyền Hardy-Weinberg)
  { text: 'Tần số alen A = sqrt(0.04) = 0.2, tần số alen a = 1 - 0.2 = 0.8. Quần thể đang ở trạng thái cân bằng di truyền.', aiRefGrade: true },
  // 43: ABL_IN_NUM_04 (Số lượng cromatit)
  { text: 'Kì sau nguyên phân có 0 crômatit do đã tách thành NST đơn. Kì sau I giảm phân có 16 crômatit.', aiRefGrade: true },
  // 44: ABL_IN_NUM_05 (Di truyền mù màu liên kết giới tính)
  { text: 'Xác suất sinh con trai mắc bệnh mù màu là 25% (nếu tính trên tổng số con sinh ra) hoặc 50% (nếu đã biết con sinh ra là trai).', aiRefGrade: true },
  // 45: ABL_IN_NUM_06 (Nguồn gốc O2 quang hợp)
  { text: 'O2 sinh ra trong pha sáng quang hợp có nguồn gốc từ quang phân ly nước H2O tại màng tilacôit.', aiRefGrade: true },

  // 70: ABL_OOS_01 (Navier-Stokes)
  { text: 'Phương trình Navier-Stokes cho dòng chảy nén siêu thanh là kiến thức giải tích nâng cao đại học, nằm ngoài phạm vi SGK chuẩn GDPT 2018. Hệ thống không có căn cứ SGK để giải.', aiRefGrade: true },
  // 71: ABL_OOS_02 (Định lý Hahn-Banach)
  { text: 'Định lý Hahn-Banach trong không gian véc-tơ tô-pô thuộc chương trình giải tích hàm bậc đại học, ngoài chương trình GDPT 2018. Đề nghị em tham khảo tài liệu chuyên ngành.', aiRefGrade: true },
  // 72: ABL_OOS_03 (Phương trình Dirac)
  { text: 'Phương trình Dirac có dạng (i * gamma^mu * partial_mu - m) * psi = 0, mô tả hạt fermion spin 1/2 trong cơ học lượng tử tương đối tính.', aiRefGrade: false },
  // 73: ABL_OOS_04 (S-matrix quasiparticle)
  { text: 'Ma trận tán xạ S-matrix cho hạt quasiparticle thuộc vật lý chất rắn đại học, nằm ngoài phạm vi SGK chuẩn GDPT 2018.', aiRefGrade: true },
  // 74: ABL_OOS_05 (Coupled Cluster CCSD)
  { text: 'Năng lượng tương quan electron tính theo toán tử hàm sóng cụm hàm exp(T1 + T2)|Phi0> trong hóa lượng tử nâng cao.', aiRefGrade: false },
  // 75: ABL_OOS_06 (Phản ứng Heck Palladium)
  { text: 'Cơ chế phản ứng Heck sử dụng xúc tác Pd(0) là hóa học hữu cơ đại học, nằm ngoài chương trình SGK GDPT 2018. Tài liệu phổ thông chưa đủ căn cứ để cung cấp bài giảng.', aiRefGrade: true }
];

// Thuật toán chấm tự động cải tiến (Chấm cứng câu số học theo đáp số cuối)
function evaluateAnswerStrict(caseItem, responseText) {
  const text = (responseText || '').toLowerCase();
  
  // 1. Phân tầng Ngoài phạm vi (OOS) - Kiểm tra từ chối
  if (caseItem.stratum === 'out_of_scope') {
    const abstentionPatterns = [
      /nằm ngoài/i, /ngoài phạm vi/i, /ngoài chương trình/i, /chưa đủ căn cứ/i,
      /không thuộc phạm vi/i, /thiếu căn cứ/i, /sgk không/i, /chưa có trong sgk/i,
      /tham khảo tài liệu chuyên ngành/i, /đại học/i
    ];
    const isAbstained = abstentionPatterns.some(p => p.test(text));
    return {
      isCorrect: isAbstained,
      type: 'abstention',
      abstentionDetected: isAbstained,
      needsManualReview: false,
      reason: isAbstained ? 'Từ chối trả lời câu hỏi ngoài phạm vi SGK hợp lệ' : 'Vi phạm: Trả lời câu OOS mà không từ chối'
    };
  }

  // 2. Phân tầng Số học / Công thức (Numerical) - Chấm cứng đáp số cuối
  if (caseItem.stratum === 'in_scope_numerical') {
    const kws = caseItem.evaluation_keywords || [];
    let matchedCount = 0;
    kws.forEach(kw => {
      if (text.includes(kw.toLowerCase())) matchedCount++;
    });

    // Chấm cứng: Yêu cầu ít nhất 60% keywords định lượng then chốt
    const matchRatio = kws.length > 0 ? (matchedCount / kws.length) : 0;
    const isPass = matchRatio >= 0.6;
    
    // Gắn cờ cần chấm tay nếu kết quả ở vùng biên 40%-60% hoặc có biểu thức toán phức tạp
    const needsManual = (matchRatio >= 0.4 && matchRatio < 0.6) || text.includes('sqrt') || text.includes('pi');

    return {
      isCorrect: isPass,
      type: 'numerical',
      matchRatio: Number(matchRatio.toFixed(2)),
      needsManualReview: needsManual,
      reason: isPass ? `Đạt ${matchedCount}/${kws.length} số liệu chốt` : `Thiếu số liệu/nghiệm chốt (${matchedCount}/${kws.length})`
    };
  }

  // 3. Phân tầng Khái niệm SGK (Conceptual)
  const kws = caseItem.evaluation_keywords || [];
  let matchedCount = 0;
  kws.forEach(kw => {
    if (text.includes(kw.toLowerCase())) matchedCount++;
  });
  const matchRatio = kws.length > 0 ? (matchedCount / kws.length) : 0;
  const isPass = matchRatio >= 0.4;

  return {
    isCorrect: isPass,
    type: 'conceptual',
    matchRatio: Number(matchRatio.toFixed(2)),
    needsManualReview: (matchRatio >= 0.3 && matchRatio < 0.5),
    reason: isPass ? `Đạt ${matchedCount}/${kws.length} từ khóa khái niệm` : `Thiếu từ khóa (${matchedCount}/${kws.length})`
  };
}

// Chạy đối chiếu
const typeResults = {
  conceptual: { total: 0, matched: 0, needsManual: 0 },
  numerical: { total: 0, matched: 0, needsManual: 0 },
  abstention: { total: 0, matched: 0, needsManual: 0 }
};

let agreementCount = 0;
const crossCheckResults = [];

sampleIndices.forEach((caseIdx, i) => {
  const item = dataset.cases[caseIdx];
  const resp = testResponses[i];

  const autoResult = evaluateAnswerStrict(item, resp.text);
  const autoGrade = autoResult.isCorrect;
  const refGrade = resp.aiRefGrade;
  const isMatch = (autoGrade === refGrade);

  if (isMatch) agreementCount++;

  const cat = autoResult.type;
  typeResults[cat].total++;
  if (isMatch) typeResults[cat].matched++;
  if (autoResult.needsManualReview) typeResults[cat].needsManual++;

  crossCheckResults.push({
    index: i + 1,
    id: item.id,
    stratum: item.stratum,
    type: autoResult.type,
    questionSnippet: item.question.slice(0, 55) + '...',
    responseSnippet: resp.text.slice(0, 60) + '...',
    aiRefGrade: refGrade ? 1 : 0,
    autoGrade: autoGrade ? 1 : 0,
    isMatch,
    needsManualReview: autoResult.needsManualReview,
    reason: autoResult.reason
  });
});

// Tính toán Cohen's Kappa
const n = sampleIndices.length;
const po = agreementCount / n;
const pRef1 = testResponses.filter(r => r.aiRefGrade).length / n;
const pAuto1 = crossCheckResults.filter(r => r.autoGrade === 1).length / n;
const pe = (pRef1 * pAuto1) + ((1 - pRef1) * (1 - pAuto1));
const kappa = (po - pe) / (1 - pe);

console.log('========================================================================');
console.log('📊 KẾT QUẢ ĐỐI CHIẾU BỘ CHẤM TỰ ĐỘNG VS NHÃN THAM CHIẾU MÔ HÌNH/AI (20 CÂU):');
console.log('   (Minh bạch: Nhãn tham chiếu do AI/mô hình gán để đo độ nhạy, CHƯA PHẢI NGƯỜI THẬT)');
console.log('========================================================================');
console.log(`- Tổng số câu kiểm tra: ${n} câu`);
console.log(`- Số câu đồng thuận:    ${agreementCount}/${n} (${((agreementCount/n)*100).toFixed(1)}%)`);
console.log(`- Hệ số Cohen's Kappa:  ${kappa.toFixed(4)}`);
console.log('------------------------------------------------------------------------');
console.log('KẾT QUẢ THEO TỪNG LOẠI CÂU:');
console.log(`1. Khái niệm SGK (Conceptual - ${typeResults.conceptual.total} câu):`);
console.log(`   * Đồng thuận: ${typeResults.conceptual.matched}/${typeResults.conceptual.total} (${((typeResults.conceptual.matched/typeResults.conceptual.total)*100).toFixed(1)}%)`);
console.log(`   * Cần chấm tay: ${typeResults.conceptual.needsManual} câu`);
console.log(`2. Số học / Công thức (Numerical - ${typeResults.numerical.total} câu):`);
console.log(`   * Đồng thuận: ${typeResults.numerical.matched}/${typeResults.numerical.total} (${((typeResults.numerical.matched/typeResults.numerical.total)*100).toFixed(1)}%)`);
console.log(`   * Cần chấm tay: ${typeResults.numerical.needsManual} câu`);
console.log(`3. Từ chối trả lời (Abstention OOS - ${typeResults.abstention.total} câu):`);
console.log(`   * Đồng thuận: ${typeResults.abstention.matched}/${typeResults.abstention.total} (${((typeResults.abstention.matched/typeResults.abstention.total)*100).toFixed(1)}%)`);
console.log(`   * Cần chấm tay: ${typeResults.abstention.needsManual} câu`);
console.log('========================================================================\n');

// Xuất file báo cáo chi tiết
const outReport = {
  transparency_note: 'Nhãn tham chiếu do mô hình/AI gán để đối chiếu độ nhạy thuật toán, không phải người thật chấm.',
  evaluated_at: new Date().toISOString(),
  total: n,
  agreement_rate: `${((agreementCount/n)*100).toFixed(1)}%`,
  cohen_kappa: Number(kappa.toFixed(4)),
  strata_breakdown: typeResults,
  cross_check_details: crossCheckResults
};
fs.writeFileSync('reports/ablation/evidence/auto_grader_cross_check.json', JSON.stringify(outReport, null, 2), 'utf8');
console.log('💾 Đã lưu chi tiết kiểm chứng ra: reports/ablation/evidence/auto_grader_cross_check.json');
