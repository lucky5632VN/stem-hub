// Script tổng hợp toàn bộ câu hỏi từ các nguồn trong scratch/
// Chạy: node scripts/build_question_pool.js
const fs = require('fs');
const path = require('path');

const pool = {
  math: [],
  physics: [],
  chemistry: [],
  biology: []
};

// 1. Đọc structured_new_exams.json
const structuredNewPath = path.join(__dirname, '../scratch/structured_new_exams.json');
if (fs.existsSync(structuredNewPath)) {
  const exams = JSON.parse(fs.readFileSync(structuredNewPath, 'utf8'));
  exams.forEach(exam => {
    if (exam.questions && exam.questions.length > 0) {
      exam.questions.forEach(q => {
        pool[exam.subject].push(q);
      });
    }
  });
}

// 2. Đọc raw_questions.json
const rawQuestionsPath = path.join(__dirname, '../scratch/raw_questions.json');
if (fs.existsSync(rawQuestionsPath)) {
  const exams = JSON.parse(fs.readFileSync(rawQuestionsPath, 'utf8'));
  exams.forEach(exam => {
    if (exam.questions && exam.questions.length > 0) {
      exam.questions.forEach(q => {
        pool[exam.subject].push(q);
      });
    }
  });
}

// 3. Đọc physics_mcq_pool.json
const physicsMcqPath = path.join(__dirname, '../scratch/physics_mcq_pool.json');
if (fs.existsSync(physicsMcqPath)) {
  const questions = JSON.parse(fs.readFileSync(physicsMcqPath, 'utf8'));
  questions.forEach(q => {
    pool.physics.push(q);
  });
}

console.log("📊 Thống kê tổng số câu hỏi thu thập được:");
Object.entries(pool).forEach(([subject, list]) => {
  console.log(` - ${subject}: ${list.length} câu hỏi`);
});

// Ghi ra file tạm để dùng
const poolPath = path.join(__dirname, '../scratch/aggregated_question_pool.json');
fs.writeFileSync(poolPath, JSON.stringify(pool, null, 2), 'utf8');
console.log(`\n✅ Đã ghi pool vào ${poolPath}`);
