// Script phân tích structured_new_exams.json
// Chạy: node scripts/analyze_new_exams.js
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../scratch/structured_new_exams.json');
if (!fs.existsSync(filePath)) {
  console.log("❌ Không tìm thấy structured_new_exams.json");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
console.log(`📊 Tổng số đề thi trong file: ${data.length}`);

const counts = {};
const questionCounts = {};

data.forEach((exam, idx) => {
  counts[exam.subject] = (counts[exam.subject] || 0) + 1;
  const qLen = exam.questions ? exam.questions.length : 0;
  questionCounts[exam.subject] = (questionCounts[exam.subject] || 0) + qLen;
  if (idx < 5) {
    console.log(` - Đề mẫu: [${exam.subject}] ${exam.title} (${qLen} câu hỏi)`);
  }
});

console.log('\n📚 Thống kê số lượng đề theo môn:');
Object.entries(counts).forEach(([k, v]) => {
  console.log(` - ${k}: ${v} đề`);
});

console.log('\n❓ Tổng số câu hỏi theo môn:');
Object.entries(questionCounts).forEach(([k, v]) => {
  console.log(` - ${k}: ${v} câu hỏi`);
});
