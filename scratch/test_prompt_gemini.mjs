import { callResilientGemini } from '../src/lib/geminiCaller.js';

const question = "Tính thể tích khối lăng trụ ABC.A'B'C' biết AB = a, góc ABC = 120 độ, AA' = a.";
const modelContext = {
  shapeType: "hinh_lang_tru_tu_giac_xien",
  shapeName: "Hình lăng trụ xiên ABCD.A'B'C'D' (A'G ⊥ đáy tại trọng tâm G của ΔABD)",
  parameters: { canhDay: 4, chieuCao: 3.266 },
  calculations: {
    canhDay: 4,
    chieuCao: 3.266,
    dienTichDay: 6.928,
    theTich: 22.627,
    donVi: "cm",
    congThuc: {
      dienTichDay: "S_{\\Delta ABC} = \\frac{a^2\\sqrt{3}}{4}",
      chieuCao: "A'G = \\sqrt{AA'^2 - AG^2} = \\frac{a\\sqrt{6}}{3}",
      theTich: "V_{ABC.A'B'C'} = S_{\\Delta ABC} \\cdot A'G = \\frac{a^3\\sqrt{2}}{4}",
      theTichToanKhoi: "V_{ABCD.A'B'C'D'} = 2 \\cdot V_{ABC.A'B'C'} = \\frac{a^3\\sqrt{2}}{2}"
    }
  },
  originalProblemText: "Câu 2. Cho lăng trụ ABCD.A'B'C'D' có ABCD là hình thoi. Hình chiếu của A' lên (ABCD) là trọng tâm của tam giác ABD. Tính thể tích khối lăng trụ ABC.A'B'C' biết AB = a, góc ABC = 120 độ, AA' = a."
};

const vertexCoords = [
  { diem: "A", toaDo: [0, 0, 0] },
  { diem: "B", toaDo: [4, 0, 0] },
  { diem: "C", toaDo: [6, 3.46, 0] },
  { diem: "D", toaDo: [2, 3.46, 0] },
  { diem: "G", toaDo: [2, 1.15, 0] },
  { diem: "A'", toaDo: [2, 1.15, 3.266] }
];

const contextSummary = `
Tên khối hình: ${modelContext.shapeName}
Loại hình: ${modelContext.shapeType}
Đề bài gốc: "${modelContext.originalProblemText}"
Các tham số đầu vào: ${JSON.stringify(modelContext.parameters)}
Các đại lượng hình học ĐÃ ĐƯỢC HỆ THỐNG TÍNH TOÁN CHUẨN XÁC 100% (TẦNG 2):
${JSON.stringify(modelContext.calculations, null, 2)}
Tọa độ 3D thực tế của các đỉnh (TẦNG 2):
${JSON.stringify(vertexCoords, null, 2)}
`;

const systemInstruction = `Bạn là Trợ lý AI Chuyên gia Hình học Không gian 3D tương tác của hệ thống STEM HUB.

PHONG CÁCH TRÌNH BÀY: CHUẨN MỰC, TỰ NHIÊN, TÓM TẮT SÚC TÍCH THEO SGK:
- Trình bày diễn giải toán học tự nhiên, mạch lạc, dễ hiểu theo đúng chuẩn sách giáo khoa Việt Nam.
- CÔNG THỨC TOÁN BẮT BUỘC VIẾT CHUẨN LATEX VÀ ĐƯỢC BỌC TRONG $...$ (nếu viết inline) HOẶC $$...$$ (nếu là công thức trọng tâm).
  * Ví dụ đúng: $A'G = \\sqrt{AA'^2 - AG^2} = \\frac{a\\sqrt{6}}{3}$
  * Ví dụ đúng: $$V = S_{ABC} \\cdot A'G = \\frac{a^2\\sqrt{3}}{4} \\cdot \\frac{a\\sqrt{6}}{3} = \\frac{a^3\\sqrt{2}}{4}$$
  * TUYỆT ĐỐI KHÔNG viết công thức cụt lủn, cấm viết pseudo-code thiếu dấu gạch chéo như "frac a sqrt 6 3" hay "sqrt a^2 - frac a^2 3".
  * TUYỆT ĐỐI KHÔNG ngắt dấu nhân (\\cdot) hay ngắt dấu bằng (=) thành từng dòng đứng một mình.

BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON DUY NHẤT:
{
  "answer": "Nội dung lời giải chi tiết, chuẩn xác, tự nhiên...",
  "action": null
}

NGỮ CẢNH HÌNH HỌC (TẦNG 2):
${contextSummary}
`;

async function testPrompt() {
  console.log('Testing Resilient Gemini with improved prompt...');
  const res = await callResilientGemini({
    prompt: `Câu hỏi hoặc yêu cầu của học sinh: "${question}"`,
    systemInstruction,
    temperature: 0.2,
    maxOutputTokens: 2048,
  });
  console.log('Gemini raw output:');
  console.log(res.text);
}

testPrompt().catch(console.error);
