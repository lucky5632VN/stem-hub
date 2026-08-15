/**
 * Script Node.js tự động nạp ngân hàng >2.200 câu hỏi STEM (>550 câu/môn: Toán, Lý, Hóa, Sinh)
 * Hỗ trợ 3 định dạng: Trắc nghiệm (MCQ), Đúng/Sai (TF), Trả lời ngắn (SA)
 * 100% Tiếng Việt
 */

const { generateAllSubjectQuestions } = require('../src/lib/questionAiGenerator');

console.log("=== BẮT ĐẦU SCRIPT KHỞI TẠO 2.200+ CÂU HỎI MỚI (TOÁN, LÝ, HÓA, SINH) ===");

try {
  const data = generateAllSubjectQuestions();
  console.log(`- Số lượng câu hỏi Toán học: ${data.math.length}`);
  console.log(`- Số lượng câu hỏi Vật lý: ${data.physics.length}`);
  console.log(`- Số lượng câu hỏi Hóa học: ${data.chemistry.length}`);
  console.log(`- Số lượng câu hỏi Sinh học: ${data.biology.length}`);
  console.log(`- TỔNG CỘNG: ${data.all.length} câu hỏi mới đa dạng đã sẵn sàng nạp từ Admin UI hoặc Firebase Admin SDK.`);
} catch (err) {
  console.error("Lỗi khởi tạo:", err);
}
