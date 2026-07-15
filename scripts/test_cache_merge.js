// Script kiểm thử việc cập nhật đáp án và giải thích từ cache
const fs = require('fs');
const path = require('path');

const cache = JSON.parse(fs.readFileSync(path.join(__dirname, '../scratch/solved_questions_cache.json'), 'utf8'));
const newExams = JSON.parse(fs.readFileSync(path.join(__dirname, '../scratch/structured_new_exams.json'), 'utf8'));

// Lấy đề hóa đầu tiên làm ví dụ
const chemExam = JSON.parse(JSON.stringify(newExams.find(e => e.subject === 'chemistry')));
console.log(`Đề thi: ${chemExam.title}`);

// Cập nhật câu hỏi của đề thi này từ cache
chemExam.questions.forEach((q, idx) => {
  const cacheKey = q.id;
  const cacheItem = cache[cacheKey];
  if (cacheItem) {
    q.explanation = cacheItem.explanation || q.explanation;
    if (q.type === 'mcq') {
      if (typeof cacheItem.correctAnswerIndex === 'number') {
        q.correctAnswer = cacheItem.correctAnswerIndex;
      }
    } else if (q.type === 'true_false') {
      if (Array.isArray(cacheItem.correctValues)) {
        q.statements.forEach((s, sIdx) => {
          if (sIdx < cacheItem.correctValues.length) {
            s.correctValue = cacheItem.correctValues[sIdx];
          }
        });
      }
    } else if (q.type === 'short_answer') {
      if (cacheItem.correctValue !== undefined) {
        q.correctShortAnswer = String(cacheItem.correctValue);
      }
    }
  }
});

// In ra thông tin 3 câu hỏi đại diện đại diện
const mcqQ = chemExam.questions.find(q => q.type === 'mcq');
const tfQ = chemExam.questions.find(q => q.type === 'true_false');
const saQ = chemExam.questions.find(q => q.type === 'short_answer');

console.log("\nMCQ Cập nhật:");
console.log(`- ID: ${mcqQ.id}`);
console.log(`- Đáp án đúng: ${mcqQ.correctAnswer}`);
console.log(`- Giải thích: ${mcqQ.explanation.slice(0, 150)}...`);

console.log("\nTrue/False Cập nhật:");
console.log(`- ID: ${tfQ.id}`);
console.log(`- Mệnh đề & đáp án:`);
tfQ.statements.forEach(s => console.log(`  * ${s.text} -> ${s.correctValue}`));
console.log(`- Giải thích: ${tfQ.explanation.slice(0, 150)}...`);

console.log("\nShort Answer Cập nhật:");
console.log(`- ID: ${saQ.id}`);
console.log(`- Đáp án: "${saQ.correctShortAnswer}"`);
console.log(`- Giải thích: ${saQ.explanation.slice(0, 150)}...`);
