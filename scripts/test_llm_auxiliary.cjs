const fs = require('fs');
const path = require('path');

// Đọc GEMINI_API_KEY từ .env.local
const envPath = path.resolve(__dirname, '../.env.local');
let apiKey = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/GEMINI_API_KEY="?([^"\r\n]+)"?/);
  if (match) apiKey = match[1];
}

if (!apiKey) {
  console.error("Không tìm thấy GEMINI_API_KEY");
  process.exit(1);
}

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testPrompt() {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const problemText = 'Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh 8cm, SA vuông góc với đáy và SA = 6cm. Kẻ AH vuông góc với SB tại H. Gọi M là trung điểm của SC. Kẻ AM.';

  const prompt = `
Bạn là chuyên gia bóc tách dữ liệu Toán học Hình học Không gian THPT.
Hãy phân tích đề bài sau và trích xuất các tham số hình học cùng các yêu cầu KẺ ĐƯỜNG PHỤ (Auxiliary Geometry) thành cấu trúc JSON chuẩn xác.

QUY TẮC BẮT BUỘC:
1. CHỈ TRẢ VỀ ĐÚNG 1 KHỐI JSON DUY NHẤT. Tuyệt đối không thêm lời chào, không giải thích ngoài JSON.
2. "shapeType" bắt buộc phải là một trong các giá trị sau:
   - "hinh_chop_tam_giac_deu" (Chóp tam giác đều S.ABC)
   - "hinh_chop_tu_giac_deu" (Chóp tứ giác đều S.ABCD)
   - "hinh_chop_day_hcn" (Chóp có đáy hình chữ nhật hoặc hình vuông, đường cao vuông góc đáy, ví dụ: SA vuông góc đáy)
   - "hinh_hop_chu_nhat" (Hình hộp chữ nhật, hình lập phương)
   - "hinh_lang_tru_tam_giac_deu" (Hình lăng trụ tam giác đều)
   - "hinh_tru" (Hình trụ tròn xoay)
   - "hinh_non" (Hình nón tròn xoay)
   - "hinh_cau" (Hình cầu)
   - "khac" (Khối hình khác)

3. TRÍCH XUẤT CÁC YÊU CẦU KẺ ĐƯỜNG PHỤ ("auxiliaryRequests"):
   Đề bài hình học thường yêu cầu dựng thêm điểm và kẻ thêm đường:
   - "Kẻ AH vuông góc với SB" / "Hạ AH vuông góc SB" -> { "type": "perpendicular", "from": "A", "toLine": ["S", "B"], "pointName": "H" }
   - "Gọi M là trung điểm của SC" -> { "type": "midpoint", "onLine": ["S", "C"], "pointName": "M", "connectFrom": "A" (nếu có đề cập kẻ AM) }
   - "Nối A với C" / "Kẻ đường chéo AC" -> { "type": "segment", "from": "A", "to": "C" }
   Nếu đề bài không có yêu cầu kẻ đường phụ, hãy trả về mảng rỗng: "auxiliaryRequests": []

4. Cấu trúc JSON bắt buộc:
{
  "shapeType": "hinh_chop_tam_giac_deu" | "hinh_chop_tu_giac_deu" | "hinh_chop_day_hcn" | "hinh_hop_chu_nhat" | "hinh_lang_tru_tam_giac_deu" | "hinh_tru" | "hinh_non" | "hinh_cau" | "khac",
  "shapeName": "Tên khối hình học (ví dụ: S.ABC, S.ABCD, ABCD.A'B'C'D')",
  "parameters": {
    "canhDay": <số đo cạnh đáy (nếu đáy đều hoặc vuông), ví dụ: 4>,
    "chieuDai": <chiều dài đáy chữ nhật (nếu có), ví dụ: 8>,
    "chieuRong": <chiều rộng đáy chữ nhật (nếu có), ví dụ: 8>,
    "chieuCao": <chiều cao h của khối, ví dụ: 6>,
    "banKinh": <bán kính r nếu là khối tròn xoay/cầu, ví dụ: 3>
  },
  "auxiliaryRequests": [
    {
      "type": "perpendicular",
      "from": "A",
      "toLine": ["S", "B"],
      "pointName": "H"
    },
    {
      "type": "midpoint",
      "onLine": ["S", "C"],
      "pointName": "M",
      "connectFrom": "A"
    }
  ],
  "donVi": "cm",
  "originalProblemText": "${problemText.replace(/"/g, '\\"')}"
}

Đề bài: "${problemText}"
`;

  console.log("Đang gọi Gemini 2.5 Flash trích xuất auxiliaryRequests...");
  const res = await model.generateContent(prompt);
  let text = res.response.text();
  console.log("Raw LLM output:\n", text);

  let jsonString = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
  const startIdx = jsonString.indexOf('{');
  const endIdx = jsonString.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    jsonString = jsonString.substring(startIdx, endIdx + 1);
  }
  const parsed = JSON.parse(jsonString);
  console.log("Parsed JSON:\n", JSON.stringify(parsed, null, 2));
}

testPrompt().catch(console.error);
