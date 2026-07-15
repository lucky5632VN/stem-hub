// Script kiểm tra xuất của src/data/exams.js và src/data/exams_seed.js
const fs = require('fs');
const path = require('path');

const examsSeedPath = path.join(__dirname, '../src/data/exams_seed.js');
if (fs.existsSync(examsSeedPath)) {
  const code = fs.readFileSync(examsSeedPath, 'utf8');
  console.log("=== exams_seed.js ===");
  console.log(`Độ dài file: ${code.length} ký tự`);
  console.log("Dòng đầu:");
  console.log(code.split('\n').slice(0, 10).join('\n'));
}

const examsPath = path.join(__dirname, '../src/data/exams.js');
if (fs.existsSync(examsPath)) {
  const code = fs.readFileSync(examsPath, 'utf8');
  console.log("\n=== exams.js ===");
  console.log(`Độ dài file: ${code.length} ký tự`);
  console.log("Dòng đầu:");
  console.log(code.split('\n').slice(0, 10).join('\n'));
}
