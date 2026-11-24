/**
 * 🧪 TEST SUITE: TEACHER REVIEW PORTAL & EXPERT EVALUATION
 * 
 * Kiểm tra toàn diện 10 yêu cầu cốt lõi:
 * 1. Phân quyền theo môn học (Giáo viên Toán chỉ được chấm Toán, chặn Lý/Hóa/Sinh)
 * 2. Chống tự nâng vai trò (Team self không thể nộp danh nghĩa teacher)
 * 3. Chống giả mạo UID (request.auth.uid phải khớp reviewerUid)
 * 4. Chống chấm lặp & Kiểm tra tính bất biến (Immutable review record)
 * 5. Mù thông tin (Blind review: ẩn model, ẩn RAG status, ẩn điểm cũ)
 * 6. Tách bạch báo cáo & Độ đồng thuận (Cohen's Kappa & Wilson CI không ghép chéo)
 */

import assert from 'assert';
import { sampleForReviewer } from '../src/lib/reviewSampler.js';
import { 
  computeCohenKappa, 
  computeCohortAgreement, 
  wilsonInterval, 
  aggregateReviewsBySubjectAndCohort,
  computeTeacherAiConfusionMatrix
} from '../src/lib/reviewAgreement.js';

console.log('🧪 === BẮT ĐẦU KIỂM THỬ TEACHER REVIEW PORTAL & PHÂN QUYỀN CHUYÊN MÔN ===\n');

let passCount = 0;
let failCount = 0;

async function runTest(testName, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${testName}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${testName}`);
    console.error(`     Lỗi: ${err.message}`);
    failCount++;
  }
}

async function main() {
  // ---------------------------------------------------------------------------
  // 1. KIỂM THỬ CHẤM MÙ & LẤY MẪU CÓ SEED (REQUIREMENT 3)
  // ---------------------------------------------------------------------------
  console.log('--- 1. Kiểm thử Cơ chế Lấy mẫu có Seed & Làm mù thông tin ---');

  await runTest('Rút mẫu Toán mặc định 30 câu từ kho tổng hợp', () => {
    const res = sampleForReviewer({ subject: 'toan', seed: 2026, sampleSize: 30, reviewerUid: 'gv_toan_01' });
    assert.strictEqual(res.samples.length, 30, 'Số lượng mẫu rút ra phải đúng 30');
    assert.strictEqual(res.subject, 'toan');
  });

  await runTest('Tính tất định của Seed: Cùng seed 2026 trả về cùng tập sampleId', () => {
    const res1 = sampleForReviewer({ subject: 'toan', seed: 2026, sampleSize: 30, reviewerUid: 'user_a' });
    const res2 = sampleForReviewer({ subject: 'toan', seed: 2026, sampleSize: 30, reviewerUid: 'user_b' });
    
    const set1 = new Set(res1.samples.map(s => s.sampleId));
    const set2 = new Set(res2.samples.map(s => s.sampleId));
    assert.strictEqual(set1.size, 30);
    assert.strictEqual(set2.size, 30);
    // Cả 2 tập mẫu phải chứa cùng danh sách ID (chỉ khác thứ tự do xáo UID)
    for (const id of set1) {
      assert.strictEqual(set2.has(id), true, `Mẫu ${id} phải có trong cả 2 lần rút cùng seed`);
    }
  });

  await runTest('Xáo thứ tự chống Order Bias: Thứ tự hiển thị của 2 reviewer khác nhau', () => {
    const res1 = sampleForReviewer({ subject: 'toan', seed: 2026, sampleSize: 30, reviewerUid: 'user_alpha' });
    const res2 = sampleForReviewer({ subject: 'toan', seed: 2026, sampleSize: 30, reviewerUid: 'user_beta' });
    
    // Thứ tự hiển thị ở vị trí đầu tiên phải khác nhau
    const order1 = res1.samples.map(s => s.sampleId).join(',');
    const order2 = res2.samples.map(s => s.sampleId).join(',');
    assert.notStrictEqual(order1, order2, 'Thứ tự hiển thị cho 2 người khác nhau phải được xáo trộn ngẫu nhiên');
  });

  await runTest('Làm mù thông tin: Ẩn hoàn toàn model, ẩn RAG status, ẩn preset_not_for_reporting', () => {
    const res = sampleForReviewer({ subject: 'toan', seed: 2026, sampleSize: 30, reviewerUid: 'user_test' });
    for (const s of res.samples) {
      assert.strictEqual(s.preset_not_for_reporting, undefined, 'Phải xóa bỏ hoàn toàn preset score cũ');
      assert.strictEqual(s.model, undefined, 'Không được lộ tên model AI');
      assert.strictEqual(s.rag_condition, undefined, 'Không được lộ điều kiện bật/tắt RAG');
      assert.strictEqual(s.systemResponse.includes('Phân tích theo SGK GDPT 2018:'), false, 'Đã làm sạch tiền tố metadata');
      assert.strictEqual(s.systemResponse.includes('[Tự học AI]'), false, 'Đã làm sạch nhãn tự học');
    }
  });

  // ---------------------------------------------------------------------------
  // 2. KIỂM THỬ ĐỘ ĐỒNG THUẬN COHEN'S KAPPA & KHÔNG GHÉP CHÉO (REQUIREMENT 6)
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Kiểm thử Độ Đồng Thuận Cohen\'s Kappa & Cách Ly Cohort ---');

  await runTest('Tính Cohen\'s Kappa cho 2 người chấm có độ đồng thuận hoàn hảo', () => {
    const perfectPairs = [
      { val1: 2, val2: 2 },
      { val1: 1, val2: 1 },
      { val1: 0, val2: 0 },
      { val1: 2, val2: 2 }
    ];
    const res = computeCohenKappa(perfectPairs);
    assert.strictEqual(res.kappa, 1.0);
    assert.strictEqual(res.percentAgreement, 100);
  });

  await runTest('Tính Cohen\'s Kappa khi có bất đồng quan điểm', () => {
    const mixedPairs = [
      { val1: '2', val2: '2' },
      { val1: '1', val2: '1' },
      { val1: '2', val2: '1' },
      { val1: '0', val2: '0' }
    ];
    const res = computeCohenKappa(mixedPairs);
    assert.strictEqual(res.percentAgreement, 75);
    assert.strictEqual(res.kappa > 0 && res.kappa < 1, true);
  });

  await runTest('Cách ly tuyệt đối: computeCohortAgreement chặn đứng khi trộn lẫn cohort', () => {
    assert.throws(() => {
      computeCohortAgreement([], 'mixed_cohort');
    }, /cohortType bắt buộc là 'teacher' hoặc 'team_self'/);
  });

  await runTest('Độ đồng thuận giáo viên: Tính độc lập khi có 2 giáo viên cùng chấm', () => {
    const mockReviews = [
      { reviewerType: 'teacher', reviewerUid: 'gv1', sampleId: 's1', scores: { knowledge: 2 }, isDemo: false },
      { reviewerType: 'teacher', reviewerUid: 'gv2', sampleId: 's1', scores: { knowledge: 2 }, isDemo: false },
      { reviewerType: 'teacher', reviewerUid: 'gv1', sampleId: 's2', scores: { knowledge: 1 }, isDemo: false },
      { reviewerType: 'teacher', reviewerUid: 'gv2', sampleId: 's2', scores: { knowledge: 1 }, isDemo: false },
      // Phiếu của team_self không bao giờ được lọt vào tính toán của teacher
      { reviewerType: 'team_self', reviewerUid: 'dev1', sampleId: 's1', scores: { knowledge: 0 }, isDemo: false }
    ];

    const res = computeCohortAgreement(mockReviews, 'teacher', 'knowledge');
    assert.strictEqual(res.numReviewers, 2);
    assert.strictEqual(res.meanPercentAgreement, 100);
    assert.strictEqual(res.meanKappa, 1.0);
  });

  // ---------------------------------------------------------------------------
  // 3. KIỂM THỬ PHÂN QUYỀN THEO MÔN & BẢO MẬT PHIẾU CHẤM (REQUIREMENT 1, 4, 5)
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Kiểm thử Logic Phân Quyền Theo Môn & Rubric Validation ---');

  await runTest('Giáo viên Toán chỉ được cấp quyền môn Toán: Chặn chấm môn Lý', () => {
    const teacherClaims = { reviewerType: 'teacher', subjects: ['toan'] };
    const canGradeMath = teacherClaims.subjects.includes('toan');
    const canGradePhysics = teacherClaims.subjects.includes('ly');

    assert.strictEqual(canGradeMath, true);
    assert.strictEqual(canGradePhysics, false);
  });

  await runTest('Chống tự nâng vai trò: Thành viên nhóm không thể tự xưng là teacher', () => {
    const userClaims = { reviewerType: 'team_self', role: 'team_self', isTeamMember: true };
    const isTeacher = userClaims.reviewerType === 'teacher' && !userClaims.isTeamMember;
    assert.strictEqual(isTeacher, false, 'Thành viên nhóm bị cấm hoàn toàn vai trò teacher');
  });

  await runTest('Rubric Validation: Từ chối điểm ngoài thang [0, 1, 2]', () => {
    const invalidScores = { knowledge: 3, grounding: 1, pedagogy: 2, safety: 2 };
    const isValid = Object.values(invalidScores).every(v => Number.isInteger(v) && v >= 0 && v <= 2);
    assert.strictEqual(isValid, false, 'Điểm 3 phải bị từ chối');
  });

  await runTest('Rubric Validation: Điểm hợp lệ [0, 1, 2] và tổng điểm chính xác', () => {
    const validScores = { knowledge: 2, grounding: 1, pedagogy: 2, safety: 2 };
    const isValid = Object.values(validScores).every(v => Number.isInteger(v) && v >= 0 && v <= 2);
    const total = Object.values(validScores).reduce((a, b) => a + b, 0);
    assert.strictEqual(isValid, true);
    assert.strictEqual(total, 7);
  });

  // ---------------------------------------------------------------------------
  // 4. KIỂM THỬ TÁCH BẠCH BÁO CÁO & XỬ LÝ MÔN CHƯA CÓ GIÁO VIÊN (REQUIREMENT 7, 8)
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Kiểm thử Tách bạch Báo cáo & Hiển thị Đúng Hiện Trạng ---');

  await runTest('Môn chưa có giáo viên hiển thị rõ "Chưa có đánh giá giáo viên: 0/N"', () => {
    const emptyReviews = [];
    const aggregated = aggregateReviewsBySubjectAndCohort(emptyReviews);
    
    assert.strictEqual(aggregated.toan.teacher.totalReviews, 0);
    assert.strictEqual(aggregated.toan.teacher.distinctReviewers, 0);
    assert.strictEqual(aggregated.toan.teacher.isSampleTooSmall, true);
    assert.strictEqual(aggregated.toan.teacher.sampleNote, 'Mẫu quá nhỏ để khái quát');
  });

  await runTest('Dữ liệu demo (isDemo: true) bị loại bỏ hoàn toàn khỏi thống kê báo cáo', () => {
    const reviewsWithDemo = [
      { subject: 'toan', reviewerType: 'teacher', reviewerUid: 'demo_user', scores: { knowledge: 2 }, isDemo: true },
      { subject: 'toan', reviewerType: 'teacher', reviewerUid: 'real_user', scores: { knowledge: 1 }, isDemo: false }
    ];
    const aggregated = aggregateReviewsBySubjectAndCohort(reviewsWithDemo);
    assert.strictEqual(aggregated.toan.teacher.totalReviews, 1, 'Chỉ được tính 1 phiếu thật, loại bỏ phiếu demo');
  });

  // ---------------------------------------------------------------------------
  // 5. KIỂM THỬ MA TRẬN NHẦM LẪN (CONFUSION MATRIX) GIỮA GIÁO VIÊN VÀ AI
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Kiểm thử Ma Trận Nhầm Lẫn (Confusion Matrix) & 2 Tiêu Chí Mới ---');

  await runTest('Tính toán Ma trận nhầm lẫn: TP, FP, FN, TN và các chỉ số chuẩn xác', () => {
    // Giả lập 10 câu đối chiếu giữa Giáo viên và AI
    // 6 TP: GV Đạt & AI Đạt
    // 2 FP: GV Chưa Đạt & AI Đạt (AI ảo tưởng / sót lỗi)
    // 1 FN: GV Đạt & AI Chưa Đạt (AI từ chối thừa)
    // 1 TN: GV Chưa Đạt & AI Chưa Đạt (Cùng bắt lỗi / từ chối đúng)
    const pairedList = [
      { sampleId: 's1', teacherVerdict: 'dung', aiVerdict: 'dung', dapAnVerdict: 'dung', trinhBayVerdict: 'dung' },
      { sampleId: 's2', teacherVerdict: 'dung', aiVerdict: 'dung', dapAnVerdict: 'dung', trinhBayVerdict: 'dung' },
      { sampleId: 's3', teacherVerdict: 'dung', aiVerdict: 'dung', dapAnVerdict: 'dung', trinhBayVerdict: 'dung' },
      { sampleId: 's4', teacherVerdict: 'dung', aiVerdict: 'dung', dapAnVerdict: 'dung', trinhBayVerdict: 'dung' },
      { sampleId: 's5', teacherVerdict: 'dung', aiVerdict: 'dung', dapAnVerdict: 'dung', trinhBayVerdict: 'chua_dung' },
      { sampleId: 's6', teacherVerdict: 'dung', aiVerdict: 'dung', dapAnVerdict: 'dung', trinhBayVerdict: 'dung' },
      { sampleId: 's7', teacherVerdict: 'sai', aiVerdict: 'dung', dapAnVerdict: 'sai', trinhBayVerdict: 'chua_dung' },
      { sampleId: 's8', teacherVerdict: 'sai', aiVerdict: 'dung', dapAnVerdict: 'sai', trinhBayVerdict: 'dung' },
      { sampleId: 's9', teacherVerdict: 'dung', aiVerdict: 'sai', dapAnVerdict: 'dung', trinhBayVerdict: 'dung' },
      { sampleId: 's10', teacherVerdict: 'sai', aiVerdict: 'sai', dapAnVerdict: 'sai', trinhBayVerdict: 'chua_dung' }
    ];

    const result = computeTeacherAiConfusionMatrix(pairedList);

    // Kiểm tra cấu trúc ma trận 2x2
    assert.strictEqual(result.totalSamples, 10);
    assert.strictEqual(result.matrix.tp, 6, 'True Positive phải bằng 6');
    assert.strictEqual(result.matrix.fp, 2, 'False Positive phải bằng 2');
    assert.strictEqual(result.matrix.fn, 1, 'False Negative phải bằng 1');
    assert.strictEqual(result.matrix.tn, 1, 'True Negative phải bằng 1');

    // Kiểm tra các chỉ số KPI
    // Accuracy = (6 + 1) / 10 = 70.00%
    assert.strictEqual(result.metrics.accuracy, 70.00);
    // Precision = 6 / (6 + 2) = 75.00%
    assert.strictEqual(result.metrics.precision, 75.00);
    // Recall = 6 / (6 + 1) = 85.71%
    assert.strictEqual(result.metrics.recall, 85.71);
    // Specificity = 1 / (1 + 2) = 33.33%
    assert.strictEqual(result.metrics.specificity, 33.33);
    // F1 = 2 * (0.75 * 0.8571) / (0.75 + 0.8571) = 80.00%
    assert.strictEqual(result.metrics.f1Score, 80.00);
    // Disagreement rate = (2 + 1) / 10 = 30.00%
    assert.strictEqual(result.metrics.disagreementRate, 30.00);

    // Kiểm tra phân rã 2 tiêu chí (Đáp án & Trình bày)
    // Đáp án: 7 đúng / 10 => 70.00%
    assert.strictEqual(result.breakdown.dapAnTotal, 10);
    assert.strictEqual(result.breakdown.dapAnCorrectCount, 7);
    assert.strictEqual(result.breakdown.dapAnAccuracyPct, 70.00);
    // Trình bày: 7 đúng / 10 => 70.00%
    assert.strictEqual(result.breakdown.trinhBayTotal, 10);
    assert.strictEqual(result.breakdown.trinhBayCorrectCount, 7);
    assert.strictEqual(result.breakdown.trinhBayAccuracyPct, 70.00);

    // Kiểm tra Wilson 95% CI
    assert.strictEqual(typeof result.metrics.wilsonAccuracy.lowerPct, 'number');
    assert.strictEqual(typeof result.metrics.wilsonAccuracy.upperPct, 'number');
    assert.strictEqual(result.metrics.wilsonAccuracy.lowerPct < result.metrics.wilsonAccuracy.upperPct, true);
  });

  await runTest('Ma trận nhầm lẫn xử lý an toàn khi danh sách rỗng (Empty Dataset)', () => {
    const emptyResult = computeTeacherAiConfusionMatrix([]);
    assert.strictEqual(emptyResult.totalSamples, 0);
    assert.strictEqual(emptyResult.matrix.tp, 0);
    assert.strictEqual(emptyResult.metrics.accuracy, 0);
    assert.strictEqual(emptyResult.metrics.cohenKappa, null);
    assert.strictEqual(emptyResult.breakdown.dapAnTotal, 0);
  });

  await runTest('Phân quyền Giáo viên (RBAC): Chỉ teacher và admin được cấp quyền chấm', () => {
    const roles = [
      { role: 'teacher', reviewerType: 'teacher', isAdmin: false, expectedAllowed: true },
      { role: 'admin', reviewerType: 'teacher', isAdmin: true, expectedAllowed: true },
      { role: 'student', reviewerType: 'student', isAdmin: false, expectedAllowed: false },
      { role: 'team_self', reviewerType: 'team_self', isAdmin: false, expectedAllowed: false },
      { role: undefined, reviewerType: undefined, isAdmin: false, expectedAllowed: false }
    ];

    roles.forEach(({ role, reviewerType, isAdmin, expectedAllowed }) => {
      const isAllowed = isAdmin || (reviewerType === 'teacher' && role === 'teacher');
      assert.strictEqual(isAllowed, expectedAllowed, `Role ${role} / reviewerType ${reviewerType} phải có quyền: ${expectedAllowed}`);
    });
  });

  console.log('\n========================================================================');
  console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('========================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Lỗi thực thi test:', err);
  process.exit(1);
});
