const fs = require('fs');
const path = require('path');

const cleanLaTeX = (content) => {
  if (typeof content !== 'string') return content;
  
  let cleaned = content;

  // 1. Loại bỏ hoàn toàn \left và \right (có thể có 1 hoặc nhiều gạch chéo ngược do escape)
  cleaned = cleaned.replace(/\\+left\b/g, '');
  cleaned = cleaned.replace(/\\+right\b/g, '');

  // 2. Chuẩn hóa các ký hiệu đặc biệt sang Unicode để database gọn gàng và tránh lỗi render
  const mappings = [
    { regex: /\\+times\b/g, rep: '×' },
    { regex: /\\+cdot\b/g, rep: '·' },
    { regex: /\\+neq\b/g, rep: '≠' },
    { regex: /\\+leq\b/g, rep: '≤' },
    { regex: /\\+geq\b/g, rep: '≥' },
    { regex: /\\+le\b/g, rep: '≤' },
    { regex: /\\+ge\b/g, rep: '≥' },
    { regex: /\\+perp\b/g, rep: '⊥' },
    { regex: /\\+parallel\b/g, rep: '∥' },
    { regex: /\\+approx\b/g, rep: '≈' },
    { regex: /\\+pi\b/g, rep: 'π' },
    { regex: /\\+lambda\b/g, rep: 'λ' },
    { regex: /\\+mu\b/g, rep: 'μ' },
    { regex: /\\+alpha\b/g, rep: 'α' },
    { regex: /\\+beta\b/g, rep: 'β' },
    { regex: /\\+gamma\b/g, rep: 'γ' },
    { regex: /\\+delta\b/g, rep: 'δ' },
    { regex: /\\+Delta\b/g, rep: 'Δ' },
    { regex: /\\+omega\b/g, rep: 'ω' },
    { regex: /\\+Omega\b/g, rep: 'Ω' },
    { regex: /\\+theta\b/g, rep: 'θ' },
    { regex: /\\+phi\b/g, rep: 'φ' },
    { regex: /\\+varphi\b/g, rep: 'φ' },
    { regex: /\\+rightarrow\b/g, rep: '➔' },
    { regex: /\\+Rightarrow\b/g, rep: '➔' },
    { regex: /\\+to\b/g, rep: '➔' },
    { regex: /\\+Leftrightarrow\b/g, rep: '⇔' },
    { regex: /\\+pm\b/g, rep: '±' },
    { regex: /\\+infty\b/g, rep: '∞' },
    { regex: /\\+cup\b/g, rep: ' ∪ ' },
    { regex: /\\+mathbb\{R\}/g, rep: 'ℝ' },
    { regex: /\\+mathbb\{C\}/g, rep: 'ℂ' },
    { regex: /\\+mathbb\{N\}/g, rep: 'ℕ' },
    { regex: /\\+mathbb\{Z\}/g, rep: 'ℤ' },
    { regex: /\\+circ\b/g, rep: '°' },
    { regex: /\\+degree\b/g, rep: '°' }
  ];

  mappings.forEach(m => {
    cleaned = cleaned.replace(m.regex, m.rep);
  });

  return cleaned;
};

const processFile = (filePath) => {
  console.log(`Đang quét file: ${filePath}...`);
  if (!fs.existsSync(filePath)) {
    console.error(`Không tìm thấy file: ${filePath}`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Chúng ta sử dụng hàm cleanLaTeX cho toàn bộ nội dung file.
  // Điều này an toàn vì các từ khóa LaTeX chỉ xuất hiện trong các chuỗi câu hỏi/lời giải.
  const cleanedContent = cleanLaTeX(fileContent);

  if (fileContent !== cleanedContent) {
    fs.writeFileSync(filePath, cleanedContent, 'utf8');
    console.log(`Đã làm sạch thành công file: ${filePath}`);
  } else {
    console.log(`File đã sạch sẵn, không cần thay đổi: ${filePath}`);
  }
};

// Chạy quét cho cả 2 file database
const examsPath = path.join(__dirname, '../src/data/exams.js');
const examsSeedPath = path.join(__dirname, '../src/data/exams_seed.js');

processFile(examsPath);
processFile(examsSeedPath);

console.log('Hoàn thành quá trình dọn dẹp LaTeX database!');
