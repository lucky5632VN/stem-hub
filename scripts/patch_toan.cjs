const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'labs', 'toan', 'frontend', 'dist', 'assets', 'index-OxSL28ZT.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Initial message
const oldMsg1 = 'Chào em! 👋 Thầy là **Gia sư STEM AI**. Thầy đã **ghi nhớ tiến trình học tập** của em từ các phiên trước. Em có câu hỏi nào mới về hình học 3D không?';
const newMsg1 = 'Hệ thống hỗ trợ học tập & tra cứu Toán học THPT & Hình học 3D. Nhập câu hỏi để nhận lời giải tóm tắt kèm công thức chuẩn xác.';
if (code.includes(oldMsg1)) {
  code = code.replace(oldMsg1, newMsg1);
  console.log('✅ Patched welcome message 1');
} else {
  console.log('⚠️ Welcome message 1 not found');
}

// 2. New chat message
const oldMsg2 = 'Chào em! 👋 Thầy là **Gia sư STEM AI**. Thầy đã ghi nhớ lịch sử học tập của em. Em có câu hỏi mới nào không?';
const newMsg2 = 'Phiên tra cứu mới đã sẵn sàng. Nhập bài toán hoặc hình không gian cần giải đáp.';
if (code.includes(oldMsg2)) {
  code = code.replace(oldMsg2, newMsg2);
  console.log('✅ Patched welcome message 2');
} else {
  console.log('⚠️ Welcome message 2 not found');
}

// 3. System prompt: rule against LaTeX
const oldPromptMarker = '3. TUYỆT ĐỐI KHÔNG DÙNG KÝ HIỆU LATEX VỚI DẤU ĐÔ LA ($...$, $$...$$)';
const newPromptMarker = '3. BẮT BUỘC DÙNG CHUẨN LATEX: Mọi công thức Toán BẮT BUỘC viết chuẩn LaTeX bằng $...$ hoặc $$...$$ (Ví dụ: $V = B \\cdot h$, $V = \\frac{1}{3}Bh$, $S_{xq} = 2\\pi r h$, $V = \\frac{4}{3}\\pi R^3$). QUY TẮC: 1. Trả lời tóm tắt dưới 80 từ. 2. Đi thẳng vào vấn đề, KHÔNG chào hỏi, KHÔNG xưng danh AI. 3. KHÔNG để dấu sao thô.';

if (code.includes(oldPromptMarker)) {
  code = code.replace(oldPromptMarker, newPromptMarker);
  console.log('✅ Patched Math AI prompt rule');
} else {
  console.log('⚠️ Math AI prompt rule not found');
}

// 4. Markdown parser in bundle: Ensure it calls StemLabAIBridge.formatAIFormulaText
const oldLk = 'function lK(e){if(!e)return``;let t=cK(e);';
const newLk = 'function lK(e){if(!e)return"";if(window.StemLabAIBridge&&typeof window.StemLabAIBridge.formatAIFormulaText=="function")return window.StemLabAIBridge.formatAIFormulaText(e);let t=cK(e);';

if (code.includes(oldLk)) {
  code = code.replace(oldLk, newLk);
  console.log('✅ Patched lK(e) to use StemLabAIBridge.formatAIFormulaText');
} else {
  console.log('⚠️ oldLk not found in bundle');
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('🎉 Math bundle index-OxSL28ZT.js patched successfully!');
