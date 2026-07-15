// Script phân tích nguồn câu hỏi trong thư mục scratch để gộp vào các đề thi seed
// Chạy: node scripts/analyze_scratch_pools.js
const fs = require('fs');
const path = require('path');

const files = [
  'structured_new_exams.json',
  'structured_exams.json',
  'raw_questions.json',
  'physics_mcq_pool.json',
  'solved_questions_cache.json'
];

files.forEach(file => {
  const filePath = path.join(__dirname, '../scratch', file);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Không tìm thấy ${file}`);
    return;
  }
  
  const stats = fs.statSync(filePath);
  console.log(`\n📄 Tệp: ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (Array.isArray(data)) {
      console.log(` - Số lượng phần tử: ${data.length}`);
      // Xem cấu trúc phần tử đầu tiên
      if (data.length > 0) {
        const item = data[0];
        console.log(` - Các thuộc tính: ${Object.keys(item).join(', ')}`);
        if (item.subject) console.log(` - Môn học: ${item.subject}`);
        if (item.questions) console.log(` - Có mảng questions (${item.questions.length} câu)`);
      }
    } else {
      console.log(` - Các thuộc tính chính: ${Object.keys(data).join(', ')}`);
    }
  } catch (err) {
    console.log(` - Lỗi đọc JSON: ${err.message}`);
  }
});
