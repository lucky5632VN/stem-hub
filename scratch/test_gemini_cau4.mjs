import { callResilientGemini } from '../src/lib/geminiResilientPool.js';
import { solveGeometryFacts, extractFallbackGeometry } from '../src/lib/geometryFactSolver.js';

async function main() {
  const problemText = "Câu 4. Cho hình lăng trụ đứng ABC.A'B'C' có đáy ABC là tam giác vuông tại B, BC = a, mặt phẳng (A'BC) tạo với đáy một góc 30 độ và tam giác A'BC có diện tích bằng a^2\\sqrt{3}. Tính thể tích khối lăng trụ ABC.A'B'C'.";
  
  console.log('Calling Gemini...');
  try {
    const res = await callResilientGemini({
      prompt: `Phân tích bài toán hình học 12 sau và trích xuất JSON:
${problemText}

Trả về định dạng JSON thuần:
{
  "shapeType": "hinh_lang_tru_tam_giac_deu" | "hinh_lang_tru_dung_tam_giac" | "hinh_hop_chu_nhat" | "khac",
  "shapeName": "...",
  "givenFacts": [
    { "type": "length", "element": "BC", "value": "a", "numericValue": 4 },
    { "type": "angle", "between": ["(A'BC)", "mp_day"], "degrees": 30 },
    { "type": "area", "element": "A'BC", "value": "a^2\\sqrt{3}", "numericValue": 27.71 }
  ],
  "auxiliaryRequests": []
}`
    });
    console.log('Gemini response:');
    console.log(res.text);

    let clean = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
    let json = JSON.parse(clean);
    console.log('Parsed JSON:', json);

    const solveRes = solveGeometryFacts(json);
    console.log('Solve result:', solveRes);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
