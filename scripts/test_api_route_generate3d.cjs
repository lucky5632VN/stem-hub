const fs = require('fs');
const path = require('path');

// Đọc biến môi trường từ .env.local
const envLocalPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
let apiKey = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('GEMINI_API_KEY=')) {
    apiKey = line.split('=')[1].replace(/["']/g, '').trim();
  } else if (!apiKey && line.startsWith('NEXT_PUBLIC_GEMINI_API_KEY=')) {
    apiKey = line.split('=')[1].replace(/["']/g, '').trim();
  }
}

async function testGeminiExtraction() {
  console.log("================================================================================");
  console.log("🤖 KIỂM THỬ TẦNG 1: TRÍCH XUẤT THAM SỐ TOÁN HỌC QUA API ROUTE SERVER");
  console.log("================================================================================");

  const problemText = "Cho hình chóp tam giác đều cạnh đáy 4, chiều cao 5";
  console.log(`Đề bài thử nghiệm: "${problemText}"`);

  const prompt = `
Bạn là chuyên gia bóc tách dữ liệu Toán học Hình học Không gian THPT.
Hãy phân tích đề bài sau và trích xuất các tham số hình học thành cấu trúc JSON chuẩn xác.

QUY TẮC BẮT BUỘC:
1. CHỈ TRẢ VỀ ĐÚNG 1 KHỐI JSON DUY NHẤT. Tuyệt đối không thêm lời chào, không giải thích ngoài JSON.
2. "shapeType" bắt buộc phải là một trong các giá trị sau:
   - "hinh_chop_tam_giac_deu" (Chóp tam giác đều S.ABC)
   - "hinh_chop_tu_giac_deu" (Chóp tứ giác đều S.ABCD)
   - "hinh_chop_day_hcn" (Chóp có đáy hình chữ nhật hoặc hình vuông, đường cao vuông góc đáy)
   - "hinh_hop_chu_nhat" (Hình hộp chữ nhật, hình lập phương)
   - "hinh_lang_tru_tam_giac_deu" (Hình lăng trụ tam giác đều)
   - "hinh_tru" (Hình trụ tròn xoay)
   - "hinh_non" (Hình nón tròn xoay)
   - "hinh_cau" (Hình cầu)
   - "khac" (Khối hình khác)

3. Cấu trúc JSON bắt buộc:
{
  "shapeType": "hinh_chop_tam_giac_deu" | "hinh_chop_tu_giac_deu" | "hinh_chop_day_hcn" | "hinh_hop_chu_nhat" | "hinh_lang_tru_tam_giac_deu" | "hinh_tru" | "hinh_non" | "hinh_cau" | "khac",
  "shapeName": "Tên khối hình học (ví dụ: S.ABC, S.ABCD, ABCD.A'B'C'D')",
  "parameters": {
    "canhDay": <số đo cạnh đáy (nếu đáy đều), ví dụ: 4>,
    "chieuDai": <chiều dài đáy chữ nhật (nếu có), ví dụ: 6>,
    "chieuRong": <chiều rộng đáy chữ nhật (nếu có), ví dụ: 4>,
    "chieuCao": <chiều cao h của khối, ví dụ: 5>,
    "banKinh": <bán kính r nếu là khối tròn xoay/cầu, ví dụ: 3>
  },
  "donVi": "cm"
}

Đề bài: "${problemText}"
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 }
    })
  });

  const data = await response.json();
  console.log("Status:", response.status, "data:", JSON.stringify(data, null, 2));
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.log("\nRaw LLM Output:\n", rawText);

  let jsonString = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
  const startIdx = jsonString.indexOf('{');
  const endIdx = jsonString.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    jsonString = jsonString.substring(startIdx, endIdx + 1);
  }

  const parsed = JSON.parse(jsonString);
  console.log("\nParsed Structured JSON (Tầng 1):", parsed);

  // Chuyển sang Tầng 2
  const { calculateGeometry } = require('../src/lib/geometryCalculator.js');
  const fullContext = calculateGeometry(parsed);
  console.log("\n================================================================================");
  console.log("📊 KẾT QUẢ CUỐI CÙNG TÍCH HỢP (TẦNG 1 + TẦNG 2):");
  console.log("================================================================================");
  console.log("currentModelContext:", JSON.stringify(fullContext, null, 2));
}

testGeminiExtraction().catch(console.error);
