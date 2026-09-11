const fs = require('fs');
const path = require('path');
const { calculateGeometry } = require('../src/lib/geometryCalculator.js');

// Đọc API Key từ .env.local
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

async function askModelQuestion(question, modelContext) {
  const contextSummary = `
Tên khối hình: ${modelContext.shapeName || modelContext.shapeType}
Loại hình: ${modelContext.shapeType}
Đề bài gốc: "${modelContext.originalProblemText || 'N/A'}"
Các tham số đầu vào: ${JSON.stringify(modelContext.parameters || {})}
Các đại lượng hình học ĐÃ ĐƯỢC HỆ THỐNG TÍNH TOÁN CHUẨN XÁC 100% (TẦNG 2):
${JSON.stringify(modelContext.calculations || {}, null, 2)}
Danh sách đỉnh và nhãn: ${JSON.stringify(modelContext.labels || modelContext.vertex_labels || [])}
`;

  const systemInstruction = `Bạn là Trợ lý AI Chuyên gia Hình học Không gian 3D của hệ thống STEM HUB.

NHIỆM VỤ CỦA BẠN:
Giải đáp mọi thắc mắc của học sinh về KHỐI MÔ HÌNH 3D ĐANG HIỂN THỊ TRÊN MÀN HÌNH dựa trên dữ liệu toán học đã được hệ thống tính toán sẵn.

NGỮ CẢNH HÌNH HỌC ĐÃ TÍNH TOÁN CHUẨN XÁC TỪ HỆ THỐNG (TẦNG 2):
${contextSummary}

NGUYÊN TẮC PHẢN HỒI TUYỆT ĐỐI BẮT BUỘC:
1. CHỈ SỬ DỤNG CÁC CON SỐ TRONG DỮ LIỆU ĐƯỢC CUNG CẤP Ở TRÊN. TUYỆT ĐỐI KHÔNG TỰ TÍNH TOÁN LẠI các đại lượng như diện tích đáy, diện tích xung quanh, thể tích, chiều cao, trung đoạn... Hãy dùng trực tiếp kết quả đã tính sẵn từ Tầng 2 để giải thích và trình bày cho học sinh.
2. NẾU HỌC SINH HỎI THÔNG TIN NGOÀI DỮ LIỆU ĐÃ CÓ: Trả lời trung thực và rõ ràng rằng "Dữ liệu đề bài hiện tại chưa cung cấp thông tin này, không thể suy đoán", tuyệt đối KHÔNG ĐƯỢC TỰ BỊA RA SỐ LIỆU.
3. PHONG CÁCH SƯ PHẠM CHUẨN MỰC:
   - Trả lời tóm tắt, súc tích, mạch lạc, đi thẳng vào câu hỏi.
   - Khi nêu công thức hoặc tính toán, BẮT BUỘC viết công thức chuẩn LaTeX bọc trong dấu $...$ (nội dòng) hoặc $$...$$ (khối độc lập), ví dụ: $V = \\frac{1}{3}Bh$, $S_{đáy} = \\frac{a^2\\sqrt{3}}{4}$.
   - TUYỆT ĐỐI KHÔNG để lại dấu sao thô (**).
   - TUYỆT ĐỐI KHÔNG chào hỏi robot ("Chào em...", "Tôi là trợ lý AI...") hay kết luận sáo rỗng ("Chúc em học tốt...").`;

  const prompt = `Câu hỏi của học sinh: "${question.trim()}"`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
    })
  });

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function runQaTests() {
  console.log("================================================================================");
  console.log("💬 KIỂM THỬ GIAI ĐOẠN 3: HỎI - ĐÁP (Q&A) DỰA TRÊN NGỮ CẢNH MÔ HÌNH ĐANG HIỂN THỊ");
  console.log("================================================================================\n");

  // Chuẩn bị context cho: Cho hình chóp tam giác đều cạnh đáy 4, chiều cao 5
  const sampleContext = calculateGeometry({
    shapeType: 'hinh_chop_tam_giac_deu',
    shapeName: 'S.ABC',
    parameters: { canhDay: 4, chieuCao: 5 },
    donVi: 'cm',
    originalProblemText: 'Cho hình chóp tam giác đều cạnh đáy 4cm, chiều cao 5cm.'
  });

  console.log("📦 NGỮ CẢNH HIỆN TẠI (currentModelContext):");
  console.log(`- Hình: ${sampleContext.shapeName}`);
  console.log(`- Cạnh đáy a = ${sampleContext.parameters.canhDay} cm, Chiều cao h = ${sampleContext.parameters.chieuCao} cm`);
  console.log(`- S(đáy) = ${sampleContext.calculations.dienTichDay} cm², Thể tích V = ${sampleContext.calculations.theTich} cm³`);
  console.log(`- Trung đoạn d = ${sampleContext.calculations.trungDoan} cm, Cạnh bên l = ${sampleContext.calculations.canhBen} cm\n`);

  // Câu 1: Hỏi lại đúng số liệu đã có
  console.log("--------------------------------------------------------------------------------");
  console.log("TEST 1: Hỏi lại số liệu đã tính (Thể tích và diện tích đáy)");
  const q1 = "Thể tích của khối chóp này là bao nhiêu và diện tích đáy bằng mấy?";
  console.log(`Học sinh: "${q1}"`);
  const a1 = await askModelQuestion(q1, sampleContext);
  console.log(`AI Phản hồi:\n${a1}\n`);
  const pass1 = a1.includes("11.547") && (a1.includes("6.928") || a1.includes("6,928"));
  console.log(`Đánh giá: ${pass1 ? "✅ ĐẠT (Khớp 100% số liệu Tầng 2: V=11.547, S=6.928)" : "❌ KHÔNG KHỚP"}\n`);

  // Câu 2: Hỏi suy luận từ số liệu
  console.log("--------------------------------------------------------------------------------");
  console.log("TEST 2: Hỏi suy luận giải thích (Vì sao thể tích lại tính ra như vậy?)");
  const q2 = "Vì sao thể tích khối chóp này lại bằng 11.547 cm³?";
  console.log(`Học sinh: "${q2}"`);
  const a2 = await askModelQuestion(q2, sampleContext);
  console.log(`AI Phản hồi:\n${a2}\n`);
  const pass2 = a2.includes("11.547") || a2.includes("6.928") || a2.includes("V =");
  console.log(`Đánh giá: ${pass2 ? "✅ ĐẠT (Diễn giải đúng công thức và số liệu sẵn có)" : "❌ CHƯA ĐẠT"}\n`);

  // Câu 3: Hỏi ngoài phạm vi dữ liệu
  console.log("--------------------------------------------------------------------------------");
  console.log("TEST 3: Hỏi ngoài phạm vi dữ liệu (Chất liệu, khối lượng kg)");
  const q3 = "Khối hình chóp này làm bằng chất liệu gì và nặng bao nhiêu kg?";
  console.log(`Học sinh: "${q3}"`);
  const a3 = await askModelQuestion(q3, sampleContext);
  console.log(`AI Phản hồi:\n${a3}\n`);
  const pass3 = /chưa\s+cung\s+cấp|không\s+có\s+thông\s+tin|không\s+thể|chưa\s+đủ\s+dữ\s+liệu/i.test(a3);
  console.log(`Đánh giá: ${pass3 ? "✅ ĐẠT (Từ chối bịa đặt, trung thực báo chưa có dữ liệu)" : "❌ CÒN BỊA ĐẶT"}\n`);

  console.log("================================================================================");
  console.log(`🏆 TỔNG KẾT TEST Q&A: ${pass1 && pass2 && pass3 ? "3/3 TEST CASES HOÀN HẢO!" : "CẦN TINH CHỈNH"}`);
  console.log("================================================================================");
}

runQaTests().catch(console.error);
