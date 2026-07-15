// Script kiểm tra cấu trúc câu hỏi chi tiết theo type
const fs = require('fs');
const path = require('path');

const newExams = JSON.parse(fs.readFileSync(path.join(__dirname, '../scratch/structured_new_exams.json'), 'utf8'));

const samples = {};
newExams.forEach(exam => {
  if (exam.questions) {
    exam.questions.forEach(q => {
      if (!samples[q.type]) {
        samples[q.type] = q;
      }
    });
  }
});

console.log("=== Cấu trúc câu hỏi mẫu theo từng loại ===");
Object.entries(samples).forEach(([type, q]) => {
  console.log(`\n❓ Loại: ${type}`);
  console.log(JSON.stringify(q, null, 2));
});
