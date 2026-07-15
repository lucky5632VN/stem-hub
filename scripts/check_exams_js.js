// Script kiểm tra dữ liệu trong src/data/exams.js
const fs = require('fs');
const path = require('path');

const examsPath = path.join(__dirname, '../src/data/exams.js');
if (fs.existsSync(examsPath)) {
  const { EXAM_DATABASE } = require(examsPath);
  console.log(`Số lượng đề thi trong EXAM_DATABASE: ${EXAM_DATABASE.length}`);
  const counts = EXAM_DATABASE.reduce((acc, e) => {
    acc[e.subject] = (acc[e.subject] || 0) + 1;
    return acc;
  }, {});
  console.log("Thống kê theo môn:");
  Object.entries(counts).forEach(([k, v]) => {
    console.log(` - ${k}: ${v} đề`);
  });
  
  // Đếm xem bao nhiêu đề có câu hỏi
  const withQuestions = EXAM_DATABASE.filter(e => e.questions && e.questions.length > 0).length;
  console.log(`Số lượng đề có câu hỏi (> 0): ${withQuestions}`);
} else {
  console.log("Không tìm thấy src/data/exams.js");
}
