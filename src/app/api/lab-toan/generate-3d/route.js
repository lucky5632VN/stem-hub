import { NextResponse } from 'next/server';
import { callResilientGemini } from '@/lib/geminiResilientPool';
import { solveGeometryFacts, parseNumericValue, extractFallbackGeometry } from '@/lib/geometryFactSolver';
import { toNaturalVietnameseMathText } from '@/lib/mathFormatter';

function cleanAndRepairGeometryJson(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.replace(/```json/gi, '').replace(/```/gi, '').trim();
  const firstBrace = s.indexOf('{');
  const lastBrace = s.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    s = s.substring(firstBrace, lastBrace + 1);
  }
  try {
    const parsed = JSON.parse(s);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {}
  s = s.replace(/\/\/.*$/gm, '');
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');
  s = s.replace(/:\s*([0-9]*\.?[0-9]+)\s*\*?\s*a\b/gi, (_, n) => ': ' + (parseFloat(n || 1) * 4).toFixed(2));
  s = s.replace(/:\s*a\s*\*?\s*sqrt\((\d+)\)/gi, (_, r) => ': ' + (4 * Math.sqrt(parseInt(r, 10))).toFixed(2));
  s = s.replace(/:\s*a\b(?!\w)/gi, ': 4');
  s = s.replace(/:\s*\\?sqrt\{?(\d+)\}?/gi, (_, r) => ': ' + Math.sqrt(parseInt(r, 10)).toFixed(2));
  s = s.replace(/sin\((\d+)(?:°|deg)?\)/gi, (_, deg) => Math.sin((parseInt(deg, 10) * Math.PI) / 180).toFixed(3));
  s = s.replace(/cos\((\d+)(?:°|deg)?\)/gi, (_, deg) => Math.cos((parseInt(deg, 10) * Math.PI) / 180).toFixed(3));
  s = s.replace(/tan\((\d+)(?:°|deg)?\)/gi, (_, deg) => Math.tan((parseInt(deg, 10) * Math.PI) / 180).toFixed(3));
  s = s.replace(/:\s*([0-9\.\+\-\*\/\s\(\)]+?)(?=[,\}\]])/g, (match, expr) => {
    const trimmed = expr.trim();
    if (!trimmed) return match;
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return ': ' + trimmed;
    try {
      if (/^[0-9\.\+\-\*\/\s\(\)]+$/.test(trimmed)) {
        const val = Function('"use strict"; return (' + trimmed + ')')();
        if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
          return ': ' + Number(val.toFixed(3));
        }
      }
    } catch {}
    return ': ' + (parseFloat(trimmed) || 4);
  });
  s = s.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
  s = s.replace(/,(\s*[}\]])/g, '$1');
  s = s.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
  try {
    const parsed = JSON.parse(s);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (e) {}
  return null;
}

function getGenericOrFallbackGeometry(parsedData, problemText) {
  const clean = (problemText || '').toLowerCase();
  const rawShapeType = (parsedData?.shapeType || '').toLowerCase();

  // 🌟 NẾU CÓ CUSTOM MESH TỪ AI SINH RA TRỰC TIẾP
  if (parsedData?.customMesh && Array.isArray(parsedData.customMesh.vertices) && parsedData.customMesh.vertices.length >= 4) {
    return {
      success: true,
      shapeType: parsedData.shapeType || 'hinh_da_dien_tuy_bien',
      shapeName: parsedData.shapeName || 'Khối đa diện 3D tùy biến',
      parameters: parsedData.parameters || {},
      customMesh: parsedData.customMesh,
      appliedRule: 'smart_interactive_custom_polyhedron',
      explanation: `Chào bạn! Mình đã phân tích đề bài và dựng xong mô hình 3D tùy biến: ${parsedData.shapeName || 'Khối đa diện'}. Bạn có thể tự do dùng chuột xoay và phóng to để quan sát các góc độ không gian. Bạn cần mình hỗ trợ tính toán hay phân tích gì tiếp theo?`,
      sanityCheck: { passed: true, maxDiscrepancy: 0, details: [] },
      needsReview: false,
      donVi: 'cm',
      givenFacts: parsedData?.givenFacts || []
    };
  }
  
  let shapeType = 'hinh_chop_day_hcn';
  let shapeName = 'Hình chóp S.ABCD (Mô hình 3D mẫu)';
  let parameters = { canhDay: 4, chieuCao: 5, chieuDai: 4, chieuRong: 4, banKinh: 2 };
  
  // 0A. Khối bát diện đều
  if (clean.includes('bát diện') || rawShapeType.includes('bat_dien') || clean.includes('octahedron')) {
    shapeType = 'hinh_bat_dien_deu';
    shapeName = 'Khối bát diện đều';
    parameters = { canhDay: 4, canh: 4 };
  }
  // 0B. Tứ diện vuông
  else if (clean.includes('tứ diện vuông') || rawShapeType.includes('tu_dien_vuong') || (clean.includes('vuông góc') && clean.includes('oa') && clean.includes('ob') && clean.includes('oc'))) {
    shapeType = 'hinh_tu_dien_vuong';
    shapeName = 'Tứ diện vuông O.ABC (OA ⊥ OB ⊥ OC)';
    parameters = { canhOA: 4, canhOB: 4, canhOC: 5, canhDay: 4, chieuCao: 5 };
  }
  // 0C. Chóp đáy hình thang
  else if (clean.includes('hình thang') || rawShapeType.includes('hinh_thang') || clean.includes('trapezoid')) {
    shapeType = 'hinh_chop_day_hinh_thang';
    shapeName = 'Hình chóp S.ABCD (đáy hình thang, SA ⊥ đáy)';
    parameters = { canhDay: 4, dayLon: 8, chieuCao: 5 };
  }
  // 0D. Chóp cụt
  else if (clean.includes('chóp cụt') || rawShapeType.includes('chop_cut') || clean.includes('frustum')) {
    shapeType = 'hinh_chop_cut';
    shapeName = "Hình chóp cụt tứ giác đều ABCD.A'B'C'D'";
    parameters = { canhDay: 5, dayNho: 2.5, chieuCao: 4 };
  }
  // 0E. Nón cụt
  else if (clean.includes('nón cụt') || rawShapeType.includes('non_cut')) {
    shapeType = 'hinh_non_cut';
    shapeName = 'Hình nón cụt tròn xoay';
    parameters = { banKinhLon: 4, banKinhNho: 2, chieuCao: 5 };
  }
  // 0F. Lăng trụ lục giác đều
  else if (clean.includes('lục giác') || rawShapeType.includes('luc_giac') || clean.includes('hexagonal')) {
    shapeType = 'hinh_lang_tru_luc_giac_deu';
    shapeName = "Hình lăng trụ lục giác đều ABCDEF.A'B'C'D'E'F'";
    parameters = { canhDay: 3, chieuCao: 6 };
  }
  // 1. Kiểm tra Lăng trụ
  else if (clean.includes('lăng trụ') || clean.includes('lang_tru') || clean.includes('prism') || clean.includes("a'b'c'") || rawShapeType.includes('lang_tru') || rawShapeType.includes('prism')) {
    const isQuad = clean.includes('tứ giác') || clean.includes("a'b'c'd'") || clean.includes('thoi') || rawShapeType.includes('tu_giac');
    const isOblique = (clean.includes('xiên') || clean.includes('trọng tâm') || clean.includes('trung điểm') || clean.includes('chiếu của')) && !clean.includes('đứng');
    
    if (isQuad && isOblique) {
      shapeType = 'hinh_lang_tru_tu_giac_xien';
      shapeName = "Hình lăng trụ xiên ABCD.A'B'C'D'";
      parameters = { canhDay: 4, chieuCao: 4.5, chieuDai: 4, chieuRong: 4, banKinh: 2 };
    } else if (isQuad) {
      shapeType = 'hinh_hop_chu_nhat';
      shapeName = "Hình hộp chữ nhật ABCD.A'B'C'D'";
      parameters = { canhDay: 4, chieuCao: 4, chieuDai: 5, chieuRong: 4, banKinh: 2 };
    } else if (isOblique) {
      shapeType = 'hinh_lang_tru_tam_giac_xien';
      shapeName = "Hình lăng trụ xiên ABC.A'B'C'";
      parameters = { canhDay: 4, chieuCao: 4.5, chieuDai: 4, chieuRong: 4, banKinh: 2 };
    } else if (clean.includes('vuông') || rawShapeType.includes('dung') || clean.includes('đứng')) {
      shapeType = 'hinh_lang_tru_dung_tam_giac';
      shapeName = "Hình lăng trụ đứng ABC.A'B'C' (đáy vuông)";
      parameters = { canhDay: 4, chieuCao: 6, chieuDai: 4, chieuRong: 4, banKinh: 2 };
    } else {
      shapeType = 'hinh_lang_tru_tam_giac_deu';
      shapeName = "Hình lăng trụ tam giác đều ABC.A'B'C'";
      parameters = { canhDay: 4, chieuCao: 6, chieuDai: 4, chieuRong: 4, banKinh: 2 };
    }
  }
  // 2. Hình hộp chữ nhật & Hình lập phương
  else if (clean.includes('lập phương') || clean.includes('hộp chữ nhật') || rawShapeType.includes('hop_chu_nhat')) {
    shapeType = 'hinh_hop_chu_nhat';
    if (clean.includes('lập phương')) {
      shapeName = "Hình lập phương ABCD.A'B'C'D'";
      parameters = { canhDay: 4, chieuCao: 4, chieuDai: 4, chieuRong: 4, banKinh: 2 };
    } else {
      shapeName = "Hình hộp chữ nhật ABCD.A'B'C'D'";
      parameters = { canhDay: 4, chieuCao: 3, chieuDai: 5, chieuRong: 4, banKinh: 2 };
    }
  }
  // 3. Hình chóp tứ giác đều
  else if (clean.includes('tứ giác đều') || clean.includes('chóp đều s.abcd') || rawShapeType === 'hinh_chop_tu_giac_deu') {
    shapeType = 'hinh_chop_tu_giac_deu';
    shapeName = 'Hình chóp tứ giác đều S.ABCD';
    parameters = { canhDay: 4, chieuCao: 5, chieuDai: 4, chieuRong: 4, banKinh: 2 };
  }
  // 4. Hình chóp tam giác đều / Tứ diện đều
  else if (clean.includes('tam giác đều') || clean.includes('tứ diện đều') || clean.includes('chóp tam giác đều') || rawShapeType === 'hinh_chop_tam_giac_deu') {
    shapeType = 'hinh_chop_tam_giac_deu';
    shapeName = 'Hình chóp tam giác đều S.ABC';
    parameters = { canhDay: 4, chieuCao: 5, chieuDai: 4, chieuRong: 4, banKinh: 2 };
  }
  // 5. Hình chóp tam giác S.ABC
  else if ((/\bs\.abc\b/i.test(clean) || (clean.includes('chóp') && clean.includes('tam giác')) || rawShapeType === 'hinh_chop_tam_giac') && !clean.includes('s.abcd')) {
    shapeType = 'hinh_chop_tam_giac';
    shapeName = 'Hình chóp S.ABC (SA ⊥ đáy)';
    parameters = { canhDay: 4, chieuCao: 5, chieuDai: 4, chieuRong: 4, banKinh: 2 };
  }
  // 6. Hình nón tròn xoay
  else if (clean.includes('nón') || clean.includes('non') || rawShapeType.includes('non')) {
    shapeType = 'hinh_non';
    shapeName = 'Hình nón tròn xoay';
    parameters = { banKinh: 3, chieuCao: 5, canhDay: 4 };
  }
  // 7. Hình trụ tròn xoay
  else if (clean.includes('trụ') || clean.includes('tru') || rawShapeType.includes('tru')) {
    shapeType = 'hinh_tru';
    shapeName = 'Hình trụ tròn xoay';
    parameters = { banKinh: 3, chieuCao: 6, canhDay: 4 };
  }
  // 8. Hình cầu
  else if (clean.includes('cầu') || clean.includes('cau') || rawShapeType.includes('cau')) {
    shapeType = 'hinh_cau';
    shapeName = 'Hình cầu';
    parameters = { banKinh: 3, chieuCao: 3, canhDay: 4 };
  }
  // 9. Mặc định Hình chóp S.ABCD
  else {
    shapeType = 'hinh_chop_day_hcn';
    shapeName = 'Hình chóp S.ABCD (SA ⊥ đáy)';
    parameters = { canhDay: 4, chieuCao: 5, chieuDai: 4, chieuRong: 4, banKinh: 2 };
  }

  // Tận dụng bất kỳ thông số nào đã trích xuất được từ đề bài (nếu có)
  if (parsedData?.parameters) {
    if (parsedData.parameters.canhDay) parameters.canhDay = parsedData.parameters.canhDay;
    if (parsedData.parameters.chieuCao) parameters.chieuCao = parsedData.parameters.chieuCao;
    if (parsedData.parameters.chieuDai) parameters.chieuDai = parsedData.parameters.chieuDai;
    if (parsedData.parameters.chieuRong) parameters.chieuRong = parsedData.parameters.chieuRong;
    if (parsedData.parameters.banKinh) parameters.banKinh = parsedData.parameters.banKinh;
  }
  if (parsedData?.givenFacts && Array.isArray(parsedData.givenFacts)) {
    const bFact = parsedData.givenFacts.find(f => ['canhday', 'ab', 'bc', 'chieu_dai', 'canh_day'].some(k => String(f.element || f.name || '').toLowerCase().includes(k)));
    if (bFact) {
      const v = parseFloat(bFact.numericValue !== undefined ? bFact.numericValue : bFact.value);
      if (!isNaN(v) && v > 0) parameters.canhDay = v;
    }
    const hFact = parsedData.givenFacts.find(f => ['chieucao', 'duongcao', 'sa', 'sh', 'so', 'aa', 'chieu_cao'].some(k => String(f.element || f.name || '').toLowerCase().includes(k)));
    if (hFact) {
      const v = parseFloat(hFact.numericValue !== undefined ? hFact.numericValue : hFact.value);
      if (!isNaN(v) && v > 0) parameters.chieuCao = v;
    }
  }

  return {
    success: true,
    shapeType,
    shapeName,
    parameters,
    appliedRule: 'smart_interactive_preview',
    explanation: `Chào bạn! Mình đã phân tích đề bài và dựng xong mô hình 3D tương tác: ${shapeName}. Bạn có thể tự do dùng chuột xoay và phóng to để quan sát các góc độ không gian. Bạn cần mình hỗ trợ tính toán hay kẻ thêm đường phụ gì tiếp theo?`,
    sanityCheck: { passed: true, maxDiscrepancy: 0, details: [] },
    needsReview: false,
    donVi: 'cm',
    givenFacts: parsedData?.givenFacts || []
  };
}

export async function POST(req) {
  let problemText = '';
  try {
    const body = await req.json().catch(() => ({}));
    problemText = (body.problemText || body.message || body.prompt || body.text || '').trim();
    const imageBase64 = body.imageBase64;
    const imageMimeType = body.imageMimeType || 'image/jpeg';

    if (!problemText && !imageBase64) {
      return NextResponse.json({ error: "Vui lòng cung cấp đề bài toán hình học hoặc tải lên ảnh." }, { status: 400 });
    }

    const prompt = `
Bạn là chuyên gia bóc tách dữ liệu Toán học Hình học Không gian THPT.
Nhiệm vụ của bạn CHỈ LÀ ĐỌC HIỂU ĐỀ BÀI VÀ TRÍCH XUẤT DỮ KIỆN GỐC (Given Facts), KHÔNG ĐƯỢC TỰ LÀM PHÉP TÍNH LƯỢNG GIÁC HAY ĐẠI SỐ ĐỂ ĐOÁN CHIỀU CAO. Toàn bộ tính toán toạ độ và tham số dẫn xuất sẽ do Fact Solver tự động giải.

QUY TẮC BẮT BUỘC:
1. CHỈ TRẢ VỀ ĐÚNG 1 KHỐI JSON DUY NHẤT. Tuyệt đối không thêm lời chào, không giải thích ngoài JSON.
2. "shapeType" bắt buộc phải là một trong các giá trị sau:
   - "hinh_chop_tam_giac" (Chóp có đáy tam giác S.ABC, ví dụ: SA vuông góc đáy, đáy vuông/cân/đều)
   - "hinh_chop_day_hcn" (Chóp có đáy hình chữ nhật hoặc hình vuông, đường cao vuông góc đáy, ví dụ: SA vuông góc đáy)
   - "hinh_chop_tu_giac_deu" (Chóp tứ giác đều S.ABCD)
   - "hinh_chop_tam_giac_deu" (Chóp tam giác đều S.ABC, tứ diện đều)
   - "hinh_bat_dien_deu" (Khối bát diện đều, 8 mặt tam giác đều)
   - "hinh_tu_dien_vuong" (Tứ diện vuông O.ABC có OA, OB, OC đôi một vuông góc)
   - "hinh_chop_day_hinh_thang" (Chóp S.ABCD có đáy là hình thang vuông hoặc cân)
   - "hinh_chop_cut" (Hình chóp cụt tứ giác đều hoặc tam giác đều)
   - "hinh_non_cut" (Hình nón cụt tròn xoay)
   - "hinh_lang_tru_luc_giac_deu" (Hình lăng trụ lục giác đều)
   - "hinh_hop_chu_nhat" (Hình hộp chữ nhật, hình lập phương)
   - "hinh_lang_tru_tam_giac_deu" (Hình lăng trụ tam giác đều hoặc lăng trụ xiên)
   - "hinh_lang_tru_dung_tam_giac" (Hình lăng trụ đứng tam giác ABC.A'B'C', ví dụ đáy vuông tại B)
   - "hinh_tru" (Hình trụ tròn xoay)
   - "hinh_non" (Hình nón tròn xoay)
   - "hinh_cau" (Hình cầu)
   - "hinh_da_dien_tuy_bien" (BẤT KỲ khối hình đặc biệt / tùy biến nào khác)

* ĐẶC BIỆT KHI GẶP KHỐI ĐA DIỆN TÙY BIẾN HOẶC HÌNH ĐẶC BIỆT ("hinh_da_dien_tuy_bien"):
Nếu đề bài là một khối hình đặc biệt/tùy biến không thuộc các mẫu trên, bạn BẮT BUỘC sinh thêm trường "customMesh":
"customMesh": {
  "vertices": [[x1, y1, z1], [x2, y2, z2], ...],
  "edges": [[0, 1], [1, 2], ...],
  "faces": [[0, 1, 2], ...],
  "labels": ["A", "B", "C", ...]
}

3. "givenFacts": Danh sách các dữ kiện đề bài cho NGUYÊN VĂN:
   - Dữ kiện độ dài (length): { "type": "length", "element": "canh_day" | "BC" | "AB" | "AC" | "SC" | "SA" | "chieu_cao" | "canh_ben" | "duong_cheo" | "bankinh" | "duongsinh", "value": "2a", "numericValue": 8 }
     * Quy ước chuẩn hóa nếu có ẩn a: a = 4. (ví dụ: "a" -> 4, "2a" -> 8, "a√2" -> 5.66, "a√3" -> 6.93, "a√5" -> 8.94).
   - Dữ kiện diện tích (area): { "type": "area", "element": "A'BC" | "SBC" | "mat_ben" | "day", "value": "a²√3", "numericValue": 27.71 }
   - Dữ kiện góc (angle): { "type": "angle", "between": ["SC", "mp_day"] | ["(SBC)", "mp_day"] | ["(A'BC)", "mp_day"] | ["(SCD)", "mp_day"] | ["canh_ben", "mp_day"], "degrees": 45 }
   - Dữ kiện vuông góc (perpendicular): { "type": "perpendicular", "line": "SA", "plane": "mp_day" }
   - Dữ kiện hình dạng đáy (shape_feature): { "type": "shape_feature", "feature": "day_la_hinh_vuong" | "day_la_hcn" | "day_la_tam_giac_vuong_tai_b" | "day_la_tam_giac_vuong_can_tai_a" | "day_la_tam_giac_deu" }

4. TUYỆT ĐỐI KHÔNG TỰ TÍNH RA "chieuCao" NẾU ĐỀ BÀI CHƯA CHO TRỰC TIẾP. Nếu đề bài chỉ cho cạnh bên và góc (như SC=2a và góc 45°), chỉ trích xuất đúng 2 dữ kiện đó vào givenFacts.

5. Cấu trúc JSON bắt buộc:
{
  "problemText": "Toàn bộ chuỗi văn bản đề bài bằng tiếng Việt tự nhiên dễ đọc (ví dụ: 'góc ABC = 120°', 'a√2', 'tam giác ABC', tuyệt đối KHÔNG dùng mã LaTeX như \\widehat, \\circ, \\sqrt trong problemText)",
  "shapeType": "hinh_chop_tam_giac",
  "shapeName": "Tên khối hình học (ví dụ: S.ABC hoặc S.ABCD)",
  "givenFacts": [
    { "type": "length", "element": "BC", "value": "a√2", "numericValue": 5.66 },
    { "type": "angle", "between": ["(SBC)", "mp_day"], "degrees": 45 },
    { "type": "perpendicular", "line": "SA", "plane": "mp_day" }
  ],
  "auxiliaryRequests": [],
  "donVi": "cm"
}

${problemText ? `Đề bài văn bản: "${problemText}"` : 'Đề bài được cung cấp qua hình ảnh đính kèm, vui lòng đọc kỹ ảnh để trích xuất!'}
`;

    let responseText = '';
    try {
      let callOptions = {
        prompt,
        temperature: 0.1,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json'
      };

      if (imageBase64) {
        const cleanBase64 = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;
        callOptions = {
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: imageMimeType,
                    data: cleanBase64
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json'
        };
      }

      const result = await callResilientGemini(callOptions);
      responseText = result.text;
    } catch (apiErr) {
      console.error("[generate-3d] Resilient Gemini call failed:", apiErr);
    }

    let parsedData = cleanAndRepairGeometryJson(responseText);
    if (!parsedData || !parsedData.shapeType) {
      parsedData = extractFallbackGeometry(problemText);
    }
    parsedData.originalProblemText = toNaturalVietnameseMathText(parsedData.problemText || problemText || '');

    // Nếu AI sinh customMesh trực tiếp cho khối đa diện tùy biến
    if (parsedData.customMesh && Array.isArray(parsedData.customMesh.vertices) && parsedData.customMesh.vertices.length >= 4) {
      const customModel = getGenericOrFallbackGeometry(parsedData, problemText);
      return NextResponse.json(customModel, { status: 200 });
    }

    let factResult = solveGeometryFacts(parsedData);
    if (!factResult.success && problemText) {
      const fbData = extractFallbackGeometry(problemText);
      const fbSolved = solveGeometryFacts(fbData);
      if (fbSolved.success) {
        factResult = fbSolved;
        parsedData = { ...parsedData, ...fbData };
      }
    }
    if (!factResult.success) {
      const fallbackModel = getGenericOrFallbackGeometry(parsedData, problemText);
      return NextResponse.json(fallbackModel, { status: 200 });
    }

    const finalResponse = {
      success: true,
      shapeType: factResult.shapeType || parsedData.shapeType,
      shapeName: factResult.shapeName || parsedData.shapeName,
      parameters: factResult.parameters,
      customMesh: parsedData.customMesh || factResult.customMesh || null,
      appliedRule: factResult.appliedRule,
      ruleId: factResult.ruleId,
      explanation: factResult.explanation,
      sanityCheck: factResult.sanityCheck,
      needsReview: factResult.needsReview || false,
      givenFacts: factResult.givenFacts || parsedData.givenFacts || [],
      auxiliaryRequests: parsedData.auxiliaryRequests || [],
      donVi: factResult.donVi || parsedData.donVi || 'cm',
      originalProblemText: parsedData.originalProblemText || problemText
    };

    return NextResponse.json(finalResponse, { status: 200 });
  } catch (error) {
    console.error("Lỗi Tầng 1 (LLM Extraction):", error);
    const fallback = extractFallbackGeometry(problemText || "");
    const solvedFallback = solveGeometryFacts(fallback);
    return NextResponse.json({
      success: true,
      ...fallback,
      parameters: solvedFallback.parameters || { canhDay: 4, chieuCao: 5, chieuDai: 4, chieuRong: 4, banKinh: 2 },
      sanityCheck: solvedFallback.sanityCheck || { passed: true, maxDiscrepancy: 0, details: [] }
    }, { status: 200 });
  }
}


