import { formatMathText } from '../src/lib/mathFormatter.js';
import { EXAM_DATABASE } from '../src/data/exams.js';

console.log("=== KIỂM TRA ĐỊNH DẠNG MATH FORMATTER ===");

// Test 1: Math question with integral and choices
const testStrings = [
  '$S = π \\int_{1}^{2} (2x+1) \\text{d}x$.',
  '$S = \\int_{1}^{2} (2x+1)^2 \\text{d}x$.',
  'S = \\int_{1}^{2} (2x+1)^2 \\text{d}x.',
  'S = \\pi \\int_{1}^{2} (2x+1) \\text{d}x.',
  '\\vec{u} = (1; 2; 3)',
  'y = \\frac{2x+1}{x-1}',
  '\\sqrt{x^2 + 1}',
  'Fe + 2HCl -> FeCl2 + H2'
];

let hasErrors = false;
testStrings.forEach((str, idx) => {
  const formatted = formatMathText(str);
  const hasPlaceholderLeak = formatted.includes('###KATEXPH') || formatted.includes('###HTMLPH');
  console.log(`[Test ${idx + 1}] Input: ${str}`);
  console.log(`         Output: ${formatted.substring(0, 100)}...`);
  console.log(`         Placeholder leak: ${hasPlaceholderLeak ? '❌ YES' : '✅ NO'}`);
  if (hasPlaceholderLeak) hasErrors = true;
});

// Test 2: Random sample of 100 questions from EXAM_DATABASE across all 4 subjects
console.log("\n=== KIỂM TRA 100 CÂU HỎI THỰC TẾ TỪ EXAM_DATABASE ===");
let checkedCount = 0;
let leakCount = 0;

for (const examId in EXAM_DATABASE) {
  const exam = EXAM_DATABASE[examId];
  if (!exam.questions) continue;
  for (const q of exam.questions) {
    // Check text
    if (q.text) {
      const fText = formatMathText(q.text);
      if (fText.includes('###KATEXPH') || fText.includes('###HTMLPH')) {
        console.error(`❌ Leak in exam ${examId} q ${q.id} text:`, q.text);
        leakCount++;
      }
      checkedCount++;
    }
    // Check options
    if (Array.isArray(q.options)) {
      for (const opt of q.options) {
        const fOpt = formatMathText(opt);
        if (fOpt.includes('###KATEXPH') || fOpt.includes('###HTMLPH')) {
          console.error(`❌ Leak in exam ${examId} q ${q.id} option:`, opt);
          leakCount++;
        }
        checkedCount++;
      }
    }
    if (checkedCount >= 200) break;
  }
  if (checkedCount >= 200) break;
}

console.log(`Đã kiểm tra ${checkedCount} văn bản. Số lỗi rò rỉ placeholder: ${leakCount}`);
if (leakCount === 0 && !hasErrors) {
  console.log("🎉 TẤT CẢ CÔNG THỨC RENDER HOÀN HẢO!");
}
