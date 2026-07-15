const fs = require('fs');
const path = require('path');

const assignDifficultyForExam = (exam) => {
  const category = exam.category || 'bo-gddt';
  const title = (exam.title || '').toLowerCase();
  
  if (
    category === 'cac-truong-chuyen' || 
    category === 'on-thi-hsg' || 
    title.includes('chuyên') || 
    title.includes('hsg') ||
    title.includes('học sinh giỏi')
  ) {
    exam.difficulty = 'hard';
    exam.difficultyLabel = 'Nâng cao';
  } else if (
    category === 'so-gddt' || 
    title.includes('sở gd') || 
    title.includes('sở giáo dục')
  ) {
    exam.difficulty = 'medium';
    exam.difficultyLabel = 'Khá';
  } else {
    exam.difficulty = 'easy';
    exam.difficultyLabel = 'Cơ bản';
  }
};

const processExamsFile = (sourcePath, exportVarName) => {
  console.log(`Đang xử lý ${sourcePath}...`);
  if (!fs.existsSync(sourcePath)) {
    console.error(`Không tìm thấy file: ${sourcePath}`);
    return;
  }

  const fileText = fs.readFileSync(sourcePath, 'utf8');
  
  // Tạo file tạm để require
  let tempText = fileText.replace(`export const ${exportVarName} =`, `const ${exportVarName} =`);
  tempText += `\nmodule.exports = { ${exportVarName} };`;
  
  const tempPath = path.join(__dirname, `temp_${exportVarName}.js`);
  fs.writeFileSync(tempPath, tempText, 'utf8');
  
  try {
    const tempModule = require(tempPath);
    const database = tempModule[exportVarName];
    
    if (Array.isArray(database)) {
      console.log(`Tìm thấy ${database.length} đề thi. Bắt đầu gán độ khó...`);
      database.forEach(exam => {
        assignDifficultyForExam(exam);
      });
      
      // Ghi đè lại file gốc
      const updatedContent = `export const ${exportVarName} = ${JSON.stringify(database, null, 2)};\n`;
      fs.writeFileSync(sourcePath, updatedContent, 'utf8');
      console.log(`Đã lưu ${database.length} đề thi vào ${sourcePath}`);
    } else {
      console.error(`Dữ liệu trong ${exportVarName} không phải là mảng!`);
    }
  } catch (err) {
    console.error(`Lỗi khi xử lý dữ liệu:`, err);
  } finally {
    // Xóa file tạm
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
};

const examsPath = path.join(__dirname, '../src/data/exams.js');
const examsSeedPath = path.join(__dirname, '../src/data/exams_seed.js');

processExamsFile(examsPath, 'EXAM_DATABASE');
processExamsFile(examsSeedPath, 'SCRAPED_EXAMS_SEED');

console.log('Đã gán xong cấp độ khó cho tất cả đề thi!');
