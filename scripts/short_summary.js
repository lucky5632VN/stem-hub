// Script in ra tóm tắt ngắn gọn không bị terminal truncate
// Chạy: node scripts/short_summary.js
const fs = require('fs');
const path = require('path');

const files = [
  'structured_new_exams.json',
  'raw_questions.json',
  'physics_mcq_pool.json',
  'solved_questions_cache.json'
];

files.forEach(file => {
  const filePath = path.join(__dirname, '../scratch', file);
  if (!fs.existsSync(filePath)) return;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`=== ${file} ===`);
  if (Array.isArray(data)) {
    console.log(`Len: ${data.length}`);
    if (data.length > 0) {
      console.log(`Sample Subject: ${data[0].subject || 'none'}`);
      if (data[0].questions) {
        console.log(`Questions count in sample: ${data[0].questions.length}`);
      }
    }
  } else {
    const keys = Object.keys(data);
    console.log(`Keys length: ${keys.length}`);
    if (keys.length > 0) {
      console.log(`Sample key: ${keys[0]}`);
      const val = data[keys[0]];
      console.log(`Sample value type: ${typeof val}`);
      console.log(`Sample value keys: ${Object.keys(val || {}).slice(0, 5).join(', ')}`);
    }
  }
});
