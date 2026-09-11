const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'labs', 'lab_sinh', 'dist', 'assets', 'index-2SVj7IJ4.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Replace vi(e) function
const targetVi = 'function vi(e){return e?e.replace(/\\$\\$(.+?)\\$\\$/gs,`$1`).replace(/\\$(.+?)\\$/g,`$1`).replace(/_\\{([^}]+)\\}/g,`<sub>$1</sub>`).replace(/\\^\\{([^}]+)\\}/g,`<sup>$1</sup>`).replace(/\\^2/g,`²`).replace(/\\^3/g,`³`).replace(/\\\\times/g,`×`).replace(/\\\\cdot/g,`·`).replace(/\\\\pi/g,`π`).replace(/\\$/g,``).replace(/\\*\\*(.*?)\\*\\*/g,`<strong>$1</strong>`).replace(/^[\\-\\*•]\\s+(.+)$/gm,`<li style="margin:2px 0;">$1</li>`).replace(/\\n\\n/g,`<br/><br/>`).replace(/\\n/g,`<br/>`):``}';

const replacementVi = 'function vi(e){if(!e)return "";if(window.StemLabAIBridge&&typeof window.StemLabAIBridge.formatAIFormulaText=="function")return window.StemLabAIBridge.formatAIFormulaText(e);return e.replace(/\\*\\*(.*?)\\*\\*/g,"<strong>$1</strong>").replace(/\\*/g,"").replace(/\\n/g,"<br/>");}';

if (code.includes(targetVi)) {
  code = code.replace(targetVi, replacementVi);
  console.log('✅ Replaced vi(e) with StemLabAIBridge.formatAIFormulaText');
} else {
  console.warn('⚠️ Could not find targetVi, attempting regex fallback...');
  code = code.replace(/function vi\(e\)\{return e\?e\.replace\(\/\\\$\\\$\(\.\+?\)\\\$\\\$\/gs.*?:\`\`\}/, replacementVi);
}

// 2. Initial welcome message
const oldWelcome1 = 'Xin chào! Tôi là Chuyên gia AI chuyên sâu Sinh Học THPT của STEM HUB. Tôi có thể hỗ trợ bạn tìm hiểu về cơ chế di truyền, cấu trúc tế bào, quy luật Menđen, sơ đồ lai và bài tập sinh học chuyên sâu. Bạn cần hỗ trợ câu hỏi nào?';
const newWelcome1 = 'Hệ thống hỗ trợ học tập & tra cứu chuyên sâu Sinh Học THPT. Đặt câu hỏi để nhận lời giải súc tích kèm công thức chuẩn xác.';

code = code.replace(oldWelcome1, newWelcome1);

// 3. New chat welcome message
const oldWelcome2 = 'Xin chào! Phiên hội thoại mới đã sẵn sàng. Bạn đang tìm hiểu phần kiến thức Sinh học nào?';
const newWelcome2 = 'Phiên tra cứu mới đã sẵn sàng. Nhập câu hỏi hoặc bài tập Sinh học để nhận lời giải tóm tắt.';

code = code.replace(oldWelcome2, newWelcome2);

// 4. System prompt
const oldSystemPrompt = 'Bạn là Chuyên gia AI Chuyên sâu Sinh Học THPT (Biology Specialist) của hệ thống STEM HUB.';
const newSystemPrompt = 'Bạn là Chuyên gia Sinh Học THPT. QUY TẮC BẮT BUỘC: 1. Trả lời tóm tắt, súc tích (dưới 80 từ). 2. Đi thẳng vào bản chất, KHÔNG chào hỏi, KHÔNG xưng danh AI. 3. Nếu có công thức hay tỉ lệ di truyền, BẮT BUỘC viết chuẩn LaTeX bằng $...$ hoặc $$...$$ (Ví dụ: $L = \\frac{N}{2} \\times 3{,}4\\text{ \\AA}$, $H = 2A + 3G$, $N = 2A + 2G$, $C = \\frac{N}{20}$, $\\text{F}_1: 1\\text{AA} : 2\\text{Aa} : 1\\text{aa}$). 4. Ký hiệu Nu: A, T, G, X theo SGK Việt Nam. 5. KHÔNG để dấu sao thô thừa.';

code = code.replace(oldSystemPrompt, newSystemPrompt);

fs.writeFileSync(filePath, code, 'utf8');
console.log('🎉 Patched index-2SVj7IJ4.js complete!');
