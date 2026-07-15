// Script đếm số câu hỏi trong từng đề thực tế
const fs = require('fs');
const path = require('path');

const newExams = JSON.parse(fs.readFileSync(path.join(__dirname, '../scratch/structured_new_exams.json'), 'utf8'));
console.log("=== structured_new_exams.json ===");
newExams.forEach(e => {
  console.log(` - [${e.subject}] ${e.title}: ${e.questions ? e.questions.length : 0} câu`);
});

const rawExams = JSON.parse(fs.readFileSync(path.join(__dirname, '../scratch/raw_questions.json'), 'utf8'));
console.log("\n=== raw_questions.json ===");
rawExams.forEach(e => {
  console.log(` - [${e.subject}] ${e.title}: ${e.questions ? e.questions.length : 0} câu`);
});
