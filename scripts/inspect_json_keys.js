// Script xem thông tin cơ bản các tệp nguồn trong scratch/
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
  console.log(`\n📄 Tệp: ${file}`);
  if (Array.isArray(data)) {
    console.log(` - Số lượng phần tử: ${data.length}`);
    if (data.length > 0) {
      console.log(` - Phần tử đầu tiên: keys = [${Object.keys(data[0]).join(', ')}]`);
      if (data[0].subject) console.log(` - Môn học: ${data[0].subject}`);
      if (data[0].type) console.log(` - Type: ${data[0].type}`);
    }
  } else {
    console.log(` - keys = [${Object.keys(data).join(', ')}]`);
    const valKeys = Object.keys(data);
    if (valKeys.length > 0) {
      const sampleVal = data[valKeys[0]];
      console.log(` - Cấu trúc giá trị mẫu: type = ${typeof sampleVal}, keys = [${Object.keys(sampleVal || {}).join(', ')}]`);
    }
  }
});
