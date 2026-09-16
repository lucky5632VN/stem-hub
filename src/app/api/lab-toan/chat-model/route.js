import { NextResponse } from 'next/server';
import { callResilientGemini } from '@/lib/geminiCaller';

/**
 * Tự động phát hiện và chuyển đổi pseudo-LaTeX (thiếu backslash hoặc thiếu ngoặc nhọn)
 * thành LaTeX chuẩn mực hoặc ký hiệu toán học tự nhiên đẹp mắt.
 */
function repairPseudoLatex(text) {
  if (!text || typeof text !== 'string') return '';
  let s = text;

  // 1. Dọn dẹp ký tự Form Feed / Backspace nếu có từ JSON parse
  s = s.replace(/\x0c/g, '\\f').replace(/\x08/g, '\\b');

  // 2. Gộp các dòng bị ngắt vụn công thức đứng một mình (dấu = hoặc \cdot)
  s = s.replace(/\n\s*(\\?cdot|·)\s*\n/g, ' \\cdot ');
  s = s.replace(/\n\s*(\\?cdot|·)\s*/g, ' \\cdot ');
  s = s.replace(/\s*(\\?cdot|·)\s*\n/g, ' \\cdot ');
  s = s.replace(/=\s*\n\s*/g, ' = ');
  s = s.replace(/\n\s*=\s*/g, ' = ');

  // 3. Chuẩn hóa backslash kép/ba thành 1 backslash trước các lệnh LaTeX: \\sqrt -> \sqrt, \\frac -> \frac
  s = s.replace(/\\{2,}([a-zA-Z]+)/g, '\\$1');

  // 4. Chuẩn hóa Delta
  s = s.replace(/(?<!\\)\bDelta([A-Z]+)/g, '\\Delta $1');
  s = s.replace(/(?<!\\)\bDelta\b/g, '\\Delta');

  // 5. Chuẩn hóa tiếng Việt cho căn: "căn bậc hai của X", "căn(X)", "căn X", "a căn X"
  s = s.replace(/(?:căn\s+bậc\s+(?:hai|2)\s+của)\s*\(([^)]+)\)/gi, '\\sqrt{$1}');
  s = s.replace(/(?:căn\s+bậc\s+(?:hai|2)\s+của)\s*([a-zA-Z0-9^]+)/gi, '\\sqrt{$1}');
  s = s.replace(/\bcăn\s*\(([^)]+)\)/gi, '\\sqrt{$1}');
  s = s.replace(/\bcăn\s*\{([^}]+)\}/gi, '\\sqrt{$1}');
  s = s.replace(/\bcăn\s*(\d+)/gi, '\\sqrt{$1}');
  s = s.replace(/\bcăn\s+(?!bậc\b)([a-zA-Z](?:\^[0-9]+)?)\b/gi, '\\sqrt{$1}');

  // 6. Chuẩn hóa ký tự Unicode '√': "√(X)" -> \sqrt{X}, "√X" -> \sqrt{X}
  s = s.replace(/√\s*\(([^)]+)\)/g, '\\sqrt{$1}');
  s = s.replace(/√\s*\{([^}]+)\}/g, '\\sqrt{$1}');
  s = s.replace(/√\s*(\d+)/g, '\\sqrt{$1}');
  s = s.replace(/√\s*([a-zA-Z](?:\^[0-9]+)?)\b/g, '\\sqrt{$1}');

  // 7. Chuẩn hóa pseudo-sqrt:
  s = s.replace(/(?<!\\)\bsqrt\s*\(([^)]+)\)/gi, '\\sqrt{$1}');
  s = s.replace(/(?<!\\)\bsqrt\s+([A-Za-z0-9'^]+(?:\s*[-+]\s*[A-Za-z0-9'^]+)+)\b/g, '\\sqrt{$1}');
  s = s.replace(/(?<!\\)\bsqrt\s+([a-zA-Z0-9^]+(?:\s*[-+]\s*\\frac\{[^}]+\}\{[^}]+\}))/g, '\\sqrt{$1}');
  s = s.replace(/(?<!\\)\bsqrt\s*(\d+)/g, '\\sqrt{$1}');
  s = s.replace(/(?<!\\)\bsqrt\{([^{}]+)\}/g, '\\sqrt{$1}');

  // 8. Nếu \sqrt thiếu ngoặc nhọn: "\sqrt 3" -> "\sqrt{3}", "\sqrt 2" -> "\sqrt{2}"
  s = s.replace(/\\sqrt\s*(\d+)/g, '\\sqrt{$1}');
  s = s.replace(/\\sqrt\s*([a-zA-Z])(?![a-zA-Z{])/g, '\\sqrt{$1}');

  // 9. Sửa thiếu gạch chéo \frac{ và \sqrt{ và \cdot
  s = s.replace(/(?<!\\)\bfrac\{/g, '\\frac{');
  s = s.replace(/(?<!\\)\bsqrt\{/g, '\\sqrt{');
  s = s.replace(/(?<!\\)\bcdot\b/g, '\\cdot');

  // 10. Chuẩn hóa pseudo-fraction: "frac a^2 sqrt 3 4" -> "\frac{a^2\sqrt{3}}{4}"
  s = s.replace(/\b(?:\\?frac)\s+([a-zA-Z0-9^]+(?:\s*(?:\\?sqrt|√|căn)\s*[0-9a-zA-Z^]+)?)\s+(\d+)\b/gi, (_match, num, den) => {
    const cleanNum = num
      .replace(/(?:\\?sqrt|√|căn)\s*(\d+)/gi, '\\sqrt{$1}')
      .replace(/(?<!\\)sqrt/g, '\\sqrt');
    return `\\frac{${cleanNum}}{${den}}`;
  });

  // 11. Chuẩn hóa pseudo-fraction cơ bản: "frac a^2 3" -> "\frac{a^2}{3}"
  s = s.replace(/\b(?:\\?frac)\s+([a-zA-Z0-9^]+)\s+([a-zA-Z0-9^]+)\b/g, (_match, num, den) => {
    return `\\frac{${num}}{${den}}`;
  });

  // 12. Bọc các dòng đẳng thức độc lập thành $$...$$ nếu chưa có bọc
  s = s.replace(/^((?:[A-Za-z0-9'_]+|V|S|A'G|h|R)\s*=\s*[\s\S]+?)$/gm, (line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('$') || trimmed.startsWith('$$') || trimmed.startsWith('<') || trimmed.startsWith('#') || trimmed.startsWith('*') || trimmed.startsWith('-')) {
      return line;
    }
    if (/(\\frac|\\sqrt|\\cdot|·|\^|=|\\Delta|Δ)/.test(trimmed)) {
      return `$$${trimmed}$$`;
    }
    return line;
  });

  // 13. Tự động bọc các biểu thức toán học rời rạc có \sqrt{...} hoặc \frac{...}{...} vào $...$ nếu chưa bọc
  const protectedMath = [];
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (m) => {
    protectedMath.push(m);
    return `__MATH_PROT_${protectedMath.length - 1}__`;
  });
  s = s.replace(/(?<!\$)\$([^$\n\r]+?)\$(?!\$)/g, (m) => {
    protectedMath.push(m);
    return `__MATH_PROT_${protectedMath.length - 1}__`;
  });

  // Bọc các biểu thức chứa \sqrt{...} hoặc \frac{...}{...} chưa có $
  s = s.replace(/(?:[a-zA-Z0-9'_^]+\s*=\s*)?(?:[a-zA-Z0-9'_^.]*\\(?:sqrt|frac)\{(?:[^{}]+|\{[^{}]*\})*\}(?:\{[^{}]*\})*[a-zA-Z0-9_{}^\\/.+\-*=()]*)+/g, (match) => {
    return `$${match.trim()}$`;
  });

  // Phục hồi lại các khối math đã bảo vệ (dùng callback function để tránh bug $$ của JS)
  protectedMath.forEach((m, idx) => {
    s = s.replace(`__MATH_PROT_${idx}__`, () => m);
  });

  return s;
}

/**
 * Phân tích và trích xuất an toàn định dạng JSON kép từ AI:
 * {
 *   "answer": "...",
 *   "action": { "type": "...", ... } // hoặc null
 * }
 */
function parseChatModelOutput(aiResponseText) {
  if (!aiResponseText || typeof aiResponseText !== 'string') {
    return { answer: '', action: null, actions: [] };
  }

  let text = aiResponseText.trim();
  let cleanAnswer = text;
  let action = null;
  const actions = [];

  // Loại bỏ các khối bọc ```json hoặc ``` nếu có
  let unquoted = text;
  if (unquoted.startsWith('```')) {
    unquoted = unquoted.replace(/^```(?:json|actions)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  let parsedObj = null;

  if (unquoted.startsWith('{') && /"answer"\s*:/i.test(unquoted)) {
    try {
      parsedObj = JSON.parse(unquoted);
    } catch {
      try {
        // Tự động sửa lỗi backslash chưa escape trong công thức LaTeX (ví dụ: \perp, \Delta, \frac, \sqrt)
        const fixed = unquoted.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');
        parsedObj = JSON.parse(fixed);
      } catch {
        // Fallback: trích xuất regex an toàn
        const ansMatch = unquoted.match(/"answer"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"action"|"\s*\})/i);
        if (ansMatch) {
          cleanAnswer = ansMatch[1]
            .replace(/\\r\\n/g, '\n')
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, ' ')
            .replace(/\\"/g, '"');
        }
        const actMatch = unquoted.match(/"action"\s*:\s*(\{[\s\S]*?\})/i);
        if (actMatch) {
          try { action = JSON.parse(actMatch[1]); } catch {}
        }
      }
    }

    if (parsedObj && typeof parsedObj === 'object') {
      if (parsedObj.answer) cleanAnswer = String(parsedObj.answer).trim();
      if (parsedObj.action && typeof parsedObj.action === 'object') {
        action = parsedObj.action;
        actions.push(parsedObj.action);
      } else if (Array.isArray(parsedObj.actions) && parsedObj.actions.length > 0) {
        action = parsedObj.actions[0];
        actions.push(...parsedObj.actions);
      }
    }
  } else {
    // Trích xuất action nếu AI đặt trong khối code block
    const codeBlockRegex = /```(?:actions|json)?\s*([\s\S]*?)```/gi;
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const content = match[1].trim();
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) actions.push(...parsed);
        else if (parsed && typeof parsed === 'object') {
          if (parsed.type) actions.push(parsed);
          else if (parsed.action) actions.push(parsed.action);
          else if (Array.isArray(parsed.actions)) actions.push(...parsed.actions);
        }
      } catch {}
    }

    cleanAnswer = text
      .replace(/```(?:actions|json)?\s*\[[\s\S]*?\]\s*```/gi, '')
      .replace(/```(?:actions|json)?\s*\{[\s\S]*?"type"[\s\S]*?\}\s*```/gi, '')
      .replace(/\{[\s\r\n]*"(?:action)"[\s\r\n]*:[\s\r\n]*\{[^{}]+\}[\s\r\n]*\}/g, '')
      .replace(/\{[^{}]*?"type"[\s\r\n]*:[\s\r\n]*"[^"]+"[^{}]*?\}/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (actions.length > 0 && !action) {
      action = actions[0];
    }
  }

  cleanAnswer = repairPseudoLatex(cleanAnswer);
  return { answer: cleanAnswer, action: action || null, actions: action ? [action] : actions };
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const question = (body.question || body.message || body.prompt || body.text || body.userText || '').trim();

    if (!question) {
      return NextResponse.json({ error: "Vui lòng nhập câu hỏi về mô hình 3D." }, { status: 400 });
    }

    const modelContext = body.modelContext || {
      shapeName: 'Hình chóp S.ABCD',
      shapeType: 'hinh_chop_day_hcn',
      originalProblemText: 'Mô hình không gian 3D STEM HUB',
      parameters: { canhDay: 4, chieuCao: 5 },
      labels: ['A', 'B', 'C', 'D', 'S']
    };

    // Chuẩn bị chuỗi dữ liệu toán học chuẩn xác từ Tầng 2 đã tính
    const vertexCoords = (modelContext.labels || []).map((lbl, idx) => ({
      diem: lbl,
      toaDo: modelContext.vertices?.[idx] || []
    }));

    const contextSummary = `
Tên khối hình: ${modelContext.shapeName || modelContext.shapeType}
Loại hình: ${modelContext.shapeType}
Đề bài gốc: "${modelContext.originalProblemText || 'N/A'}"
Các tham số đầu vào: ${JSON.stringify(modelContext.parameters || {})}
Các đại lượng hình học ĐÃ ĐƯỢC HỆ THỐNG TÍNH TOÁN CHUẨN XÁC 100% (TẦNG 2):
${JSON.stringify(modelContext.calculations || {}, null, 2)}
Tọa độ 3D thực tế của các đỉnh (TẦNG 2):
${JSON.stringify(vertexCoords, null, 2)}
Danh sách đỉnh và nhãn hiện có: ${JSON.stringify(modelContext.labels || modelContext.vertex_labels || [])}
Danh sách đường phụ hiện có: ${JSON.stringify(modelContext.auxiliaryRequests || [])}
`;

    const systemInstruction = `Bạn là Trợ lý AI Chuyên gia Hình học Không gian 3D tương tác của hệ thống STEM HUB.

PHONG CÁCH TRÌNH BÀY: CHUẨN MỰC, TỰ NHIÊN, TÓM TẮT SÚC TÍCH THEO SGK:
- Trình bày diễn giải toán học tự nhiên, mạch lạc, dễ hiểu theo đúng chuẩn sách giáo khoa Việt Nam.
- CÔNG THỨC TOÁN BẮT BUỘC VIẾT CHUẨN LATEX:
  * Dùng $...$ cho công thức inline hoặc $$...$$ cho công thức trọng tâm.
  * Luôn viết đầy đủ dấu gạch chéo và ngoặc nhọn: \frac{a}{b}, \sqrt{x}, \cdot, \Delta.
  * TUYỆT ĐỐI KHÔNG viết dạng pseudo-code thiếu gạch chéo hay thiếu ngoặc như "frac a^2 sqrt 3 4" hay "sqrt a^2 - frac a^2 3".
  * TUYỆT ĐỐI KHÔNG ngắt dấu nhân (\cdot) hay dấu bằng (=) thành từng dòng đứng một mình. Hãy viết đẳng thức trên một dòng hoàn chỉnh:
    Ví dụ: $$V = S_{\Delta ABC} \cdot A'G = \frac{a^2\sqrt{3}}{4} \cdot \frac{a\sqrt{6}}{3} = \frac{a^3\sqrt{2}}{4}$$
  * BẮT BUỘC giữ nguyên tham số ẩn a, căn thức, phân thức tối giản theo đề bài gốc.
  * Nếu đề bài có tham số a (hệ thống quy ước a = 4 để dựng hình số học 3D), hãy luôn kết luận kết quả dạng tham số a (ví dụ V = \frac{3a^3\sqrt{3}}{2}) đồng thời có thể kèm giá trị số tương ứng với a = 4 (V = 166.28) để học sinh đối chiếu trực quan với thông số mô hình 3D trên màn hình.

VÍ DỤ MẪU CHUẨN MỰC:
Vì $SA \perp (ABCD)$ nên $AC$ là hình chiếu vuông góc của $SC$ lên mặt phẳng $(ABCD)$.
$\Rightarrow (SC, (ABCD)) = (SC, AC) = \widehat{SCA} = 45^\circ$

Tam giác $SAC$ vuông tại $A$ nên:
$\sin \widehat{SCA} = \frac{SA}{SC} \Rightarrow SA = SC \cdot \sin 45^\circ = 2a \cdot \sin 45^\circ = a\sqrt{2}$

$S_{ABCD} = AB^2 = a^2$

Vậy thể tích khối chóp là:
$$V = \frac{1}{3} S_{ABCD} \cdot SA = \frac{1}{3} a^2 \cdot a\sqrt{2} = \frac{a^3\sqrt{2}}{3}$$

BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON KÉP (AGENTIC AI OUTPUT):
BẮT BUỘC trả về ĐÚNG MỘT KHỐI JSON DUY NHẤT theo mẫu:
{
  "answer": "Câu trả lời diễn giải Toán học tự nhiên (dùng LaTeX $...$ hoặc $$...$$).",
  "action": { "type": "perpendicular", "from": "S", "toLine": ["A", "C"], "pointName": "O" }
}
Nếu cần thực hiện nhiều hành động cùng lúc, dùng mảng "actions":
{
  "answer": "...",
  "actions": [
    { "type": "segment", "from": "A'", "to": "B" },
    { "type": "highlight_plane", "points": ["A'", "B", "C"], "color": "#f59e0b", "label": "(A'BC)" }
  ]
}
Nếu không yêu cầu kẻ thêm đường phụ, đặt action = null:
{
  "answer": "Câu trả lời diễn giải Toán học (dùng LaTeX).",
  "action": null
}

DANH MỤC CÁC PHÉP DỰNG HÌNH PHỤ 3D ĐƯỢC HỖ TRỢ CHO "action":
1. "perpendicular": Kẻ đường vuông góc từ 1 điểm lên 1 đoạn thẳng:
   {"type": "perpendicular", "from": "A", "toLine": ["S", "B"], "pointName": "H"}
2. "midpoint": Lấy trung điểm 1 đoạn thẳng:
   {"type": "midpoint", "onLine": ["S", "C"], "pointName": "M", "connectFrom": "A"}
3. "segment": Kẻ đoạn thẳng nối 2 điểm có sẵn:
   {"type": "segment", "from": "A", "to": "C"}
4. "highlight_plane": Tô màu mặt phẳng thiết diện:
   {"type": "highlight_plane", "points": ["S", "A", "C"], "color": "#f59e0b", "label": "(SAC)"}

HƯỚNG DẪN KẺ ĐƯỜNG PHỤ CHUẨN BGD & TỰ ĐỘNG TẠO ACTION:
- Khi học sinh bấm "📐 Hướng dẫn kẻ đường phụ chuẩn BGD" hoặc hỏi cách kẻ đường phụ:
  * KHÔNG ĐƯỢC TỪ CHỐI! Hãy phân tích yêu cầu bài toán theo phương pháp giải hình học không gian chuẩn SGK Bộ Giáo Dục.
  * Xác định đường phụ chuẩn cần kẻ:
    - Nếu bài toán liên quan đến góc giữa mặt phẳng nghiêng (A'BC) và mặt đáy trong lăng trụ đứng ABC.A'B'C' đáy vuông tại B:
      Vì AA' ⊥ (ABC) và AB ⊥ BC nên theo định lý ba đường vuông góc ta có A'B ⊥ BC.
      Do đó góc giữa (A'BC) và mặt đáy (ABC) chính là góc giữa hai đường thẳng A'B và AB, tức ∠A'BA = 30°.
      Đường phụ then chốt cần kẻ chính là đoạn nối A' và B (A'B) và tô màu thiết diện tam giác (A'BC).
      BẮT BUỘC trả về action tương ứng: {"type": "segment", "from": "A'", "to": "B"} hoặc "actions": [{"type": "segment", "from": "A'", "to": "B"}, {"type": "highlight_plane", "points": ["A'", "B", "C"], "color": "#f59e0b", "label": "(A'BC)"}].
    - Với các bài toán hình chóp hoặc lăng trụ khác: hãy phân tích và chọn thao tác phù hợp trong danh mục 4 phép dựng hình trên (perpendicular, midpoint, segment, highlight_plane) và trả về action tương ứng để 3D canvas tự động vẽ ngay cho học sinh quan sát.

QUY TẮC TỪ CHỐI THAO TÁC NGOÀI DANH MỤC:
- Nếu học sinh yêu cầu dựng hình KHÔNG THỂ quy về danh mục 4 phép trên, đặt "action": null và giải thích rõ trong "answer".
- TUYỆT ĐỐI KHÔNG tự bịa ra tọa độ hay action ngoài danh mục.

NGỮ CẢNH HÌNH HỌC ĐÃ TÍNH TOÁN (TẦNG 2):
${contextSummary}
`;

    const prompt = `Câu hỏi hoặc yêu cầu của học sinh: "${question.trim()}"`;

    // Gọi Gemini trực tiếp qua bộ xoay tua Resilient (không lo geo-block hay cạn quota)
    const geminiRes = await callResilientGemini({
      prompt,
      systemInstruction,
      temperature: 0.2,
      maxOutputTokens: 2048,
    });

    const parsedOutput = parseChatModelOutput(geminiRes.text);
    const data = {
      answer: parsedOutput.answer,
      action: parsedOutput.action,
      actions: parsedOutput.actions
    };

    // Parse và chuẩn hóa JSON kép từ phản hồi của Proxy
    let answer = data.answer || '';
    let action = data.action || null;
    let actions = data.actions || (action ? [action] : []);

    // Nếu answer vẫn còn bọc JSON kép thô, bóc tách triệt để
    if (typeof answer === 'string' && answer.trim().startsWith('{') && /"answer"\s*:/i.test(answer)) {
      const parsed = parseChatModelOutput(answer);
      answer = parsed.answer;
      if (!action && parsed.action) {
        action = parsed.action;
        actions = [action];
      }
    }

    // Heuristic Safety Net: Nếu học sinh yêu cầu tô màu thiết diện mà AI quên action
    if (!action) {
      const planeMatch = question.match(/(?:tô màu|hiển thị|mặt phẳng|thiết diện)\s*(?:mặt phẳng|thiết diện)?\s*\(?([A-Za-z]{3,4})\)?/i);
      if (planeMatch) {
        const rawPoints = planeMatch[1].toUpperCase();
        action = {
          type: 'highlight_plane',
          points: rawPoints.split(''),
          color: '#a371f7',
          name: `(${rawPoints})`
        };
        actions = [action];
      }
    }

    return NextResponse.json({
      answer,
      action,
      actions,
      modelName: modelContext.shapeName || modelContext.shapeType
    }, { status: 200 });

  } catch (error) {
    console.error("Lỗi API Hỏi - Đáp Mô hình 3D (Agentic via Cloudflare Proxy):", error);
    return NextResponse.json({
      error: "Không thể xử lý câu hỏi: " + (error.message || "Lỗi không xác định")
    }, { status: 500 });
  }
}
