import { NextResponse } from 'next/server';
import { callResilientGemini } from '@/lib/geminiCaller';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

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

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const userText = (body.userText || body.message || body.prompt || body.text || body.userMessage || body.query || '').trim();
    const chatHistory = Array.isArray(body.chatHistory) ? body.chatHistory : [];
    const shapeContext = body.shapeContext || '';

    if (!userText) {
      return NextResponse.json(
        { error: "Nội dung câu hỏi không được để trống" },
        { status: 400, headers: corsHeaders }
      );
    }

    const systemInstruction = `Bạn là Gia sư AI Chuyên sâu Toán học THPT & Hình học 3D của hệ thống STEM HUB.
Chỉ tập trung vào Toán THPT và Hình học không gian 3D.
Trình bày diễn giải toán học tự nhiên, mạch lạc, dễ hiểu theo đúng chuẩn SGK Việt Nam.
CÔNG THỨC TOÁN BẮT BUỘC VIẾT CHUẨN LATEX:
- Bọc công thức trong $...$ cho inline hoặc $$...$$ cho công thức trọng tâm.
- Luôn viết đầy đủ dấu gạch chéo và ngoặc nhọn: \\frac{a}{b}, \\sqrt{x}, \\cdot, \\Delta, \\alpha, \\beta, \\pi.
- Giữ nguyên tham số ẩn a, căn thức, phân thức tối giản (ví dụ a\\sqrt{3}, \\frac{a\\sqrt{6}}{3}).`;

    const contents = [
      ...chatHistory.slice(-6).map(msg => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.content || msg.text || '' }]
      })),
      { role: 'user', parts: [{ text: `${userText} ${shapeContext}`.trim() }] }
    ];

    const result = await callResilientGemini({
      systemInstruction,
      contents,
      temperature: 0.3,
      maxOutputTokens: 1200
    });

    const cleanedText = repairPseudoLatex(result.text);

    return NextResponse.json(
      {
        success: true,
        text: cleanedText,
        model: result.model,
        candidates: result.candidates
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Lỗi API Chat Gia sư Toán:", error);
    return NextResponse.json(
      { error: error.message || "Không nhận được phản hồi từ AI" },
      { status: 500, headers: corsHeaders }
    );
  }
}
