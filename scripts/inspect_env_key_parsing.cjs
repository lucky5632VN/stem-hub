const fs = require('fs');
const path = require('path');

const envPath = path.resolve('.env.local');
if (!fs.existsSync(envPath)) {
  console.log('File .env.local không tồn tại');
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const match = content.match(/^GEMINI_API_KEY=(.*)$/m);
if (!match) {
  console.log('Không tìm thấy dòng GEMINI_API_KEY trong .env.local');
  process.exit(1);
}

const rawLine = match[1].trim();
console.log('=== PHÂN TÍCH ĐỊNH DẠNG DÒNG GEMINI_API_KEY TRONG .env.local ===');
console.log('Dòng bắt đầu bằng dấu nháy kép ":', rawLine.startsWith('"'));
console.log('Dòng kết thúc bằng dấu nháy kép ":', rawLine.endsWith('"'));
console.log('Tổng độ dài dòng thô:', rawLine.length);

// Phân tích cách cắt dấu phẩy thông thường
const rawParts = rawLine.split(',');
console.log('Số lượng phần tử cắt bởi dấu phẩy:', rawParts.length);

console.log('\n--- Kiểm tra từng phần tử khi split(",") thuần túy ---');
rawParts.forEach((part, idx) => {
  const trimmed = part.trim();
  const startsWithQuote = trimmed.startsWith('"') || trimmed.startsWith("'");
  const endsWithQuote = trimmed.endsWith('"') || trimmed.endsWith("'");
  const hasExtraneous = startsWithQuote || endsWithQuote || /[^A-Za-z0-9_.-]/.test(trimmed);
  const cleaned = trimmed.replace(/[^A-Za-z0-9_.-]/g, '');
  const format = cleaned.startsWith('AQ') ? 'AQ' : (cleaned.startsWith('AIza') ? 'AIza' : 'Khác');
  console.log(`Khóa #${idx + 1}: độ dài thô = ${trimmed.length}, độ dài sạch = ${cleaned.length}, có ký tự thừa = ${hasExtraneous ? 'CÓ' : 'KHÔNG'} (nháy đầu: ${startsWithQuote}, nháy cuối: ${endsWithQuote}), dạng = ${format}`);
});

