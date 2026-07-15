// Script kiểm tra giải pháp và đáp án trong solved_questions_cache.json
const fs = require('fs');
const path = require('path');

const cachePath = path.join(__dirname, '../scratch/solved_questions_cache.json');
if (fs.existsSync(cachePath)) {
  const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  const keys = Object.keys(cache);
  console.log(`Số lượng bản ghi trong cache: ${keys.length}`);
  
  // Lấy mẫu một vài loại câu hỏi khác nhau để xem cấu trúc đáp án
  let mcqSample, tfSample, saSample;
  for (const key of keys) {
    const item = cache[key];
    if (key.includes('_q1') && !mcqSample) mcqSample = { key, ...item }; // Thường q1 là mcq
    if (key.includes('_q19') && !tfSample) tfSample = { key, ...item }; // Thường q19 là true_false
    if (key.includes('_q23') && !saSample) saSample = { key, ...item }; // Thường q23 là short_answer
  }
  
  console.log("\nMCQ Sample:");
  console.log(JSON.stringify(mcqSample, null, 2));
  console.log("\nTrue/False Sample:");
  console.log(JSON.stringify(tfSample, null, 2));
  console.log("\nShort Answer Sample:");
  console.log(JSON.stringify(saSample, null, 2));
} else {
  console.log("Không tìm thấy solved_questions_cache.json");
}
