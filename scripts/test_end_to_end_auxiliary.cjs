const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Đọc GEMINI_API_KEY từ .env.local
const envPath = path.resolve(__dirname, '../.env.local');
let apiKey = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/GEMINI_API_KEY="?([^"\r\n]+)"?/);
  if (match) apiKey = match[1];
}

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { calculateGeometry, vecSub, vecDot } = require('../src/lib/geometryCalculator.js');

async function testE2EAuxiliary() {
  console.log("================================================================================");
  console.log("🧪 KIỂM THỬ TOÀN TRÌNH (END-TO-END) TÍNH NĂNG KẺ ĐƯỜNG PHỤ (AUXILIARY GEOMETRY)");
  console.log("================================================================================");

  const problemText = 'Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh 8cm, SA vuông góc với đáy và SA = 6cm. Kẻ AH vuông góc với SB tại H. Gọi M là trung điểm của SC. Kẻ AM.';
  console.log(`\n📝 Đề bài thử nghiệm:\n"${problemText}"\n`);

  // BƯỚC 1: Gọi Tầng 1 (Gemini 2.5 Flash)
  console.log("🎯 [BƯỚC 1: TẦNG 1 - TRÍCH XUẤT THAM SỐ & ĐƯỜNG PHỤ]");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
Bạn là chuyên gia bóc tách dữ liệu Toán học Hình học Không gian THPT.
Hãy phân tích đề bài sau và trích xuất các tham số hình học cùng các yêu cầu KẺ ĐƯỜNG PHỤ (Auxiliary Geometry) thành cấu trúc JSON chuẩn xác.

QUY TẮC BẮT BUỘC:
1. CHỈ TRẢ VỀ ĐÚNG 1 KHỐI JSON DUY NHẤT. Tuyệt đối không thêm lời chào, không giải thích ngoài JSON.
2. "shapeType" bắt buộc phải là một trong các giá trị sau:
   - "hinh_chop_tam_giac_deu", "hinh_chop_tu_giac_deu", "hinh_chop_day_hcn", "hinh_hop_chu_nhat", "hinh_lang_tru_tam_giac_deu", "hinh_tru", "hinh_non", "hinh_cau", "khac"
3. TRÍCH XUẤT CÁC YÊU CẦU KẺ ĐƯỜNG PHỤ ("auxiliaryRequests"):
   - "Kẻ AH vuông góc với SB" -> { "type": "perpendicular", "from": "A", "toLine": ["S", "B"], "pointName": "H" }
   - "Gọi M là trung điểm của SC" -> { "type": "midpoint", "onLine": ["S", "C"], "pointName": "M", "connectFrom": "A" }

Cấu trúc JSON:
{
  "shapeType": "hinh_chop_day_hcn",
  "shapeName": "...",
  "parameters": { ... },
  "auxiliaryRequests": [ ... ],
  "donVi": "cm"
}

Đề bài: "${problemText}"
`;

  const res = await model.generateContent(prompt);
  let text = res.response.text();
  let jsonString = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
  const startIdx = jsonString.indexOf('{');
  const endIdx = jsonString.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    jsonString = jsonString.substring(startIdx, endIdx + 1);
  }
  const llmData = JSON.parse(jsonString);
  llmData.originalProblemText = problemText;

  console.log("-> JSON Tầng 1 trả về:\n", JSON.stringify(llmData, null, 2));

  // BƯỚC 2: Gọi Tầng 2 (Toán học Vector tất định)
  console.log("\n📐 [BƯỚC 2: TẦNG 2 - TÍNH TOÁN VECTOR HÌNH HỌC TẤT ĐỊNH]");
  const modelContext = calculateGeometry(llmData);

  console.log("-> Tên hình:", modelContext.shapeName);
  console.log("-> Tổng số đỉnh (gốc + phụ):", modelContext.vertices.length);
  console.log("-> Danh sách nhãn đỉnh:", modelContext.labels);
  console.log("-> Điểm phụ sinh ra:", modelContext.auxiliary_labels);
  console.log("-> Các cạnh phụ kẻ thêm (auxiliary_edges):", modelContext.auxiliary_edges);

  modelContext.auxiliary_edges.forEach(([idx1, idx2]) => {
    const p1 = modelContext.vertices[idx1];
    const p2 = modelContext.vertices[idx2];
    const name = `${modelContext.labels[idx1]}${modelContext.labels[idx2]}`;
    console.log(`   * Cạnh ${name}: [${p1}] -> [${p2}]`);
  });

  // BƯỚC 3: Kiểm định tính chính xác Toán học
  console.log("\n🔍 [BƯỚC 3: KIỂM ĐỊNH TOÁN HỌC CHUẨN XÁC]");
  
  // 1. Kiểm tra điểm H
  const hIdx = modelContext.labels.indexOf("H");
  assert(hIdx !== -1, "Không tìm thấy điểm H!");
  const H = modelContext.vertices[hIdx];
  const aIdx = modelContext.labels.indexOf("A");
  const sIdx = modelContext.labels.indexOf("S");
  const bIdx = modelContext.labels.indexOf("B");
  const A = modelContext.vertices[aIdx];
  const S = modelContext.vertices[sIdx];
  const B = modelContext.vertices[bIdx];

  const AH = vecSub(H, A);
  const SB = vecSub(B, S);
  const dotProduct = vecDot(AH, SB);
  console.log(`1. Kiểm tra AH vuông góc SB: AH . SB = ${dotProduct.toFixed(6)}`);
  assert(Math.abs(dotProduct) < 1e-4, "AH phải vuông góc với SB!");
  console.log("   => ✅ ĐẠT: AH vuông góc 100% với SB!");

  // 2. Kiểm tra điểm M
  const mIdx = modelContext.labels.indexOf("M");
  assert(mIdx !== -1, "Không tìm thấy điểm M!");
  const M = modelContext.vertices[mIdx];
  const cIdx = modelContext.labels.indexOf("C");
  const C = modelContext.vertices[cIdx];
  console.log(`2. Kiểm tra M là trung điểm SC: M = [${M}], S = [${S}], C = [${C}]`);
  assert.strictEqual(M[0], (S[0] + C[0]) / 2, "Tọa độ X của M sai!");
  assert.strictEqual(M[1], (S[1] + C[1]) / 2, "Tọa độ Y của M sai!");
  assert.strictEqual(M[2], (S[2] + C[2]) / 2, "Tọa độ Z của M sai!");
  console.log("   => ✅ ĐẠT: M là trung điểm chính xác 100% của SC!");

  console.log("\n================================================================================");
  console.log("🏆 TOÀN BỘ KIỂM THỬ END-TO-END GIAI ĐOẠN 5 THÀNH CÔNG RỰC RỠ!");
  console.log("================================================================================");
}

testE2EAuxiliary().catch(console.error);
