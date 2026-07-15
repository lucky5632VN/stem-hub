// Script in ra danh sách toàn bộ tiêu đề trong structured_new_exams.json và raw_questions.json
const fs = require('fs');
const path = require('path');

const newExams = JSON.parse(fs.readFileSync(path.join(__dirname, '../scratch/structured_new_exams.json'), 'utf8'));
console.log("=== structured_new_exams.json ===");
newExams.forEach((e, i) => {
  console.log(`${i+1}. [${e.subject}] ${e.title}`);
});

const rawExams = JSON.parse(fs.readFileSync(path.join(__dirname, '../scratch/raw_questions.json'), 'utf8'));
console.log("\n=== raw_questions.json ===");
rawExams.forEach((e, i) => {
  console.log(`${i+1}. [${e.subject}] ${e.title}`);
});
