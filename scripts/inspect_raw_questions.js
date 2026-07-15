// Script kiểm tra cấu trúc raw_questions.json
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../scratch/raw_questions.json');
if (fs.existsSync(filePath)) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`Số lượng phần tử trong raw_questions.json: ${data.length}`);
  if (data.length > 0) {
    console.log("Phần tử đầu tiên:");
    console.log(JSON.stringify(data[0], null, 2).slice(0, 1000));
  }
} else {
  console.log("Không tìm thấy raw_questions.json");
}
