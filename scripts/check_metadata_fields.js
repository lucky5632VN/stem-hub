// Script kiểm tra các trường metadata của đề thực tế
const fs = require('fs');
const path = require('path');

const newExams = JSON.parse(fs.readFileSync(path.join(__dirname, '../scratch/structured_new_exams.json'), 'utf8'));
console.log("=== structured_new_exams.json metadata ===");
newExams.slice(0, 15).forEach((e, idx) => {
  console.log(`${idx+1}. Title: ${e.title}`);
  console.log(`   category: ${e.category}, province: ${e.province}, year: ${e.year}, typeLabel: ${e.typeLabel}`);
});
