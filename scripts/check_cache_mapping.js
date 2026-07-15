// Script kiểm tra ánh xạ khóa giữa câu hỏi cào và cache đáp án
const fs = require('fs');
const path = require('path');

const cache = JSON.parse(fs.readFileSync(path.join(__dirname, '../scratch/solved_questions_cache.json'), 'utf8'));
const newExams = JSON.parse(fs.readFileSync(path.join(__dirname, '../scratch/structured_new_exams.json'), 'utf8'));

console.log("Thử tìm khóa chem_01 trong cache:");
const chemKeys = Object.keys(cache).filter(k => k.includes('chem_01') || k.includes('chemistry_01'));
console.log(`Tìm thấy ${chemKeys.length} khóa tương tự:`);
console.log(chemKeys.slice(0, 10));

console.log("\nXem một câu hỏi true_false trong structured_new_exams.json:");
const sampleExam = newExams.find(e => e.subject === 'chemistry');
if (sampleExam) {
  const tfQ = sampleExam.questions.find(q => q.type === 'true_false');
  if (tfQ) {
    console.log(`ID câu hỏi: ${tfQ.id}`);
    console.log(`Statements gốc:`, tfQ.statements);
    // Tìm đáp án trong cache
    const cacheKey = tfQ.id;
    if (cache[cacheKey]) {
      console.log(`Tìm thấy trong cache!`, cache[cacheKey]);
    } else {
      console.log(`Không tìm thấy khóa ${cacheKey} trong cache.`);
      // Tìm khóa gần giống
      const partialKeys = Object.keys(cache).filter(k => k.includes(tfQ.id.replace('chem_', '')));
      console.log(`Các khóa tương tự trong cache:`, partialKeys);
    }
  }
}
