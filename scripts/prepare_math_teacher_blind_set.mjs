/**
 * 🎓 Script Chuẩn Bị Bộ Mẫu Mù Cho Giáo Viên Toán (Mặc định: 10 câu x 2 điều kiện = 20 mẫu; Cấu hình được lên 15 câu x 2 = 30 mẫu)
 * Tuân thủ yêu cầu:
 * - Mặc định 10 câu Toán (20 mục đánh giá, ước tính ~40 phút)
 * - Cấu hình được lên 15 câu (30 mục đánh giá, ước tính ~60 phút) qua cờ --count=15
 * - Mỗi câu hiển thị 2 câu trả lời (không RAG / có RAG) ẩn điều kiện và xáo thứ tự
 * - Lấy 1 lần chạy mỗi điều kiện
 * - Lưu ánh xạ giải mã bí mật tại server (nơi giáo viên không truy cập được)
 */

import { generateMathTeacherBlindReviewSet } from '../src/lib/reviewSampler.js';

const args = process.argv.slice(2);
const countArg = args.find(a => a.startsWith('--count=') || a.startsWith('--size='));
let mathQuestionsCount = 10; // Mặc định 10 câu Toán x 2 = 20 mục đánh giá
if (countArg) {
  const parsedVal = parseInt(countArg.split('=')[1], 10);
  if (parsedVal === 30 || parsedVal === 15) {
    mathQuestionsCount = 15;
  } else if (parsedVal === 20 || parsedVal === 10) {
    mathQuestionsCount = 10;
  } else {
    mathQuestionsCount = Math.min(Math.max(1, Math.floor(parsedVal / 2)), 15);
  }
}

console.log('🎓 === KHỞI TẠO CƠ CHẾ SINH BỘ MẪU MÙ CHO GIÁO VIÊN TOÁN ===\n');

const res = generateMathTeacherBlindReviewSet({
  seed: 2026,
  mathQuestionsCount,
  datasetFilePath: 'reports/ablation/ablation_dataset_100.json',
  ablationSummaryPath: 'reports/ablation/ablation_summary.json',
  secretMappingDir: 'reports/ablation/secret_mapping'
});

console.log(`✅ Đã chọn ${res.selectedMathQuestionsCount} câu Toán từ tập 100 câu bằng PRNG seed = ${res.seed}`);
console.log(`✅ Đã ghép cặp 2 điều kiện (Condition 1 & Condition 2), tổng số mục mù: ${res.totalItems} mục (${res.totalItems === 20 ? 'Mặc định ~40 phút' : 'Mở rộng ~60 phút'})`);
console.log(`✅ Trạng thái nạp dữ liệu: ${res.isLiveDataPopulated ? 'Đã có dữ liệu chạy thật' : 'Chưa nạp dữ liệu thật (Chờ chạy --execute)'}`);
console.log(`🔒 File ánh xạ giải mã bí mật đã được lưu tại server:`);
console.log(`   -> ${res.secretMapPath}`);
console.log('\nVí dụ 3 mục đầu tiên giáo viên sẽ nhìn thấy (hoàn toàn ẩn điều kiện):');
res.blindedSamplesForTeacher.slice(0, 3).forEach(item => {
  console.log(`  * [${item.sampleId}] Câu hỏi: "${item.question.slice(0, 50)}..."`);
  console.log(`    Phản hồi hiển thị: "${item.systemResponse.slice(0, 60)}..."`);
});
console.log('\n========================================================================\n');
