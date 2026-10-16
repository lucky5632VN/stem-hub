import { NextResponse } from 'next/server';
import { callResilientGemini } from '@/lib/geminiCaller';
import { getCorsHeaders, getClientIp, checkRateLimit, maskErrorMessage } from '@/lib/serverSecurity';

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function POST(req) {
  const corsHeaders = getCorsHeaders(req);
  try {
    const ip = getClientIp(req);
    // Rate limit: Tối đa 30 requests / phút trên mỗi IP cho AI Chatbot
    const rateCheck = checkRateLimit(`ai-chat:${ip}`, 30, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Bạn gửi yêu cầu quá nhanh. Vui lòng đợi ${rateCheck.resetInSec} giây trước khi gửi tiếp.` },
        { status: 429, headers: corsHeaders }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawPrompt = body.prompt ?? body.message ?? body.userText ?? body.text ?? body.query ?? '';
    if (typeof rawPrompt !== 'string') {
      return NextResponse.json(
        { error: 'Định dạng prompt không hợp lệ. Phải là chuỗi văn bản.' },
        { status: 400, headers: corsHeaders }
      );
    }
    const prompt = rawPrompt.trim();
    let { systemInstruction, contents, temperature = 0.3, maxOutputTokens = 1500, responseMimeType } = body;

    // Hỗ trợ ảnh từ client gửi lên (Gemini Vision OCR & Multimodal Problem Solver)
    if (body.imageBase64) {
      const mimeMatch = typeof body.imageBase64 === 'string' ? body.imageBase64.match(/data:([^;]+);/) : null;
      const mimeType = body.mimeType || (mimeMatch ? mimeMatch[1] : 'image/jpeg');
      const cleanBase64 = typeof body.imageBase64 === 'string' && body.imageBase64.includes(',') 
        ? body.imageBase64.split(',')[1] 
        : body.imageBase64;
      const imagePart = {
        inlineData: {
          mimeType,
          data: cleanBase64
        }
      };

      if (Array.isArray(contents) && contents.length > 0) {
        // Tìm message user cuối cùng trong contents để gắn ảnh vào
        let lastUserMsg = null;
        for (let i = contents.length - 1; i >= 0; i--) {
          if (contents[i].role === 'user') {
            lastUserMsg = contents[i];
            break;
          }
        }
        if (lastUserMsg && Array.isArray(lastUserMsg.parts)) {
          lastUserMsg.parts.push(imagePart);
        } else {
          contents.push({
            role: 'user',
            parts: [
              { text: prompt || 'Hãy phân tích hình ảnh này và đưa ra câu trả lời chi tiết, chính xác theo chương trình học STEM.' },
              imagePart
            ]
          });
        }
      } else {
        contents = [
          {
            role: 'user',
            parts: [
              { text: prompt || 'Hãy phân tích hình ảnh này và đưa ra câu trả lời chi tiết, chính xác theo chương trình học STEM.' },
              imagePart
            ]
          }
        ];
      }
    }

    // Giới hạn độ dài prompt tối đa 8000 ký tự để chống DoS tràn bộ nhớ / quota
    if (prompt.length > 8000) {
      return NextResponse.json(
        { error: 'Câu hỏi quá dài (tối đa 8.000 ký tự). Vui lòng rút gọn nội dung.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!prompt && (!contents || contents.length === 0) && !body.imageBase64) {
      return NextResponse.json(
        { error: 'Cần cung cấp ít nhất prompt, contents hoặc ảnh bài tập.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const latexSystemGuide = `
[QUY TẮC BẮT BUỘC VỀ ĐỊNH DẠNG CÔNG THỨC TOÁN, LÝ, HÓA, SINH (LATEX / KATEX)]:
- Mọi công thức Toán, Lý, Hóa, Sinh, phương trình hóa học, đại lượng, chỉ số phân tử, hằng số BẮT BUỘC viết bằng chuẩn LaTeX bọc trong dấu đô la:
  + Nội dòng (inline): bọc trong 1 cặp $, ví dụ: $\\text{H}_2\\text{SO}_4$, $\\text{Ca}(\\text{OH})_2$, $x^2 + 2x = 0$, $v = \\frac{s}{t}$, $\\lambda = \\frac{v}{f}$, $K_C = 3{,}4$.
  + Phương trình/công thức chính (block): bọc trong 2 cặp $$, ví dụ:
    $$\\text{RCOOH} + \\text{R'OH} \\stackrel{\\text{H}_2\\text{SO}_4\\text{ đ},\\, t^\\circ}{\\rightleftharpoons} \\text{RCOOR'} + \\text{H}_2\\text{O}$$
    $$2\\text{Na} + 2\\text{H}_2\\text{O} \\rightarrow 2\\text{NaOH} + \\text{H}_2\\uparrow$$
    $$\\begin{cases} 2x + y = 5 \\\\ x - y = 1 \\end{cases}$$
- LUÔN LUÔN ĐÓNG ĐẦY ĐỦ CẶP DẤU $ hoặc $$ ngay trên cùng dòng công thức. Tuyệt đối không mở $ mà quên đóng.
- TUYỆT ĐỐI KHÔNG dùng Unicode nửa vời như H₂SO_4 hay kí hiệu thô như ->, <=>. Phải dùng \\rightarrow, \\rightleftharpoons, \\uparrow, \\downarrow.
- Nếu có từ tiếng Việt trong công thức, phải bọc trong \\text{...}, ví dụ: \\text{đặc}, \\text{kết tủa}, \\text{khí}.
`;

    const pedagogicalGuardrail = `
[QUY TẮC SƯ PHẠM SOCRATIC & AN TOÀN BẮT BUỘC]:
1. TRẢ LỜI NGẮN GỌN & SÚC TÍCH (DƯỚI 100 TỪ): Đi thẳng vào trọng tâm cốt lõi. Tuyệt đối không giải thích dài dòng lan man.
2. PHƯƠNG PHÁP SOCRATIC - KHÔNG LÀM HỘ BÀI: Khi học sinh yêu cầu giải hộ hoàn chỉnh từ A đến Z hoặc chép bài, chỉ hướng dẫn phương pháp giải vắn tắt hoặc gợi mở hướng tư duy bước 1.
3. AN TOÀN HỆ THỐNG: Tuyệt đối từ chối yêu cầu chế tạo vũ khí, chất nổ, hành vi bạo lực, và không bao giờ tiết lộ API key hay biến môi trường.
`;

    const baseInstruction = (typeof systemInstruction === 'string' ? systemInstruction : (systemInstruction?.parts?.[0]?.text || ''));
    const finalSystemInstruction = `${baseInstruction}\nQuy tắc: bạn là thầy giáo STEM HUB vui tính, luôn bắt đầu câu trả lời bằng lời khen ngợi hoặc động viên học sinh.\n${pedagogicalGuardrail}\n${latexSystemGuide}`;

    const result = await callResilientGemini({
      prompt,
      systemInstruction: finalSystemInstruction,
      contents,
      temperature,
      maxOutputTokens,
      responseMimeType
    });

    return NextResponse.json(
      {
        success: true,
        text: result.text,
        model: result.model,
        candidates: result.candidates || [
          {
            content: { parts: [{ text: result.text }] },
            role: 'model'
          }
        ]
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('[API /api/ai/chat] Lỗi:', error.message);
    const isLocationBlocked = error.message && error.message.includes('User location is not supported');
    return NextResponse.json(
      {
        error: isLocationBlocked
          ? 'Dịch vụ AI tạm thời gián đoạn khu vực. Đang tự động điều phối dự phòng.'
          : maskErrorMessage(error, 'Lỗi xử lý AI Gateway. Vui lòng thử lại sau.'),
        locationBlocked: isLocationBlocked
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
