// Script phân tích loại câu hỏi theo môn học
const fs = require('fs');
const path = require('path');

const poolPath = path.join(__dirname, '../scratch/aggregated_question_pool.json');
if (!fs.existsSync(poolPath)) {
  console.log("❌ Chưa tạo aggregated_question_pool.json, hãy chạy scripts/build_question_pool.js trước.");
  process.exit(1);
}

const pool = JSON.parse(fs.readFileSync(poolPath, 'utf8'));

Object.entries(pool).forEach(([subject, questions]) => {
  console.log(`\n📚 Môn: ${subject} (${questions.length} câu)`);
  const types = {};
  questions.forEach(q => {
    types[q.type] = (types[q.type] || 0) + 1;
  });
  Object.entries(types).forEach(([type, count]) => {
    console.log(` - ${type}: ${count} câu`);
  });
});
