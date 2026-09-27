import { NextResponse } from 'next/server';
import { callResilientGemini } from '@/lib/geminiResilientPool';
import { toNaturalVietnameseMathText } from '@/lib/mathFormatter';
import { getCorsHeaders, getClientIp, checkRateLimit, maskErrorMessage } from '@/lib/serverSecurity';

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

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
  return null;
}

export async function POST(req) {
  const corsHeaders = getCorsHeaders(req);
  try {
    const ip = getClientIp(req);
    // Rate limit: Tối đa 15 lượt OCR ảnh / phút trên mỗi IP
    const rateCheck = checkRateLimit(`vision-ocr:${ip}`, 15, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Bạn gửi ảnh quá nhanh. Vui lòng đợi ${rateCheck.resetInSec} giây trước khi gửi tiếp.` },
        { status: 429, headers: corsHeaders }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { imageBase64, mimeType = 'image/jpeg', extraPromptText = '' } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ error: 'Vui lòng cung cấp hình ảnh Base64' }, { status: 400, headers: corsHeaders });
    }

    // 🛡️ TIÊU CHÍ 7: Chỉ cho phép định dạng ảnh an toàn
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      return NextResponse.json({ error: 'Định dạng ảnh không được hỗ trợ (chỉ nhận JPEG, PNG, WEBP)' }, { status: 400, headers: corsHeaders });
    }

    const cleanBase64 = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;

    // 🛡️ TIÊU CHÍ 8: Giới hạn dung lượng ảnh < 5MB (~7,000,000 ký tự base64)
    if (cleanBase64.length > 7 * 1024 * 1024) {
      return NextResponse.json({ error: 'Dung lượng hình ảnh quá lớn (vượt quá giới hạn 5MB)' }, { status: 400, headers: corsHeaders });
    }

    const prompt = `
Bạn là chuyên gia OCR và bóc tách đề thi Toán học THPT (đặc biệt là Hình học Không gian).
Nhiệm vụ:
1. Đọc TOÀN BỘ chữ trong ảnh một cách chính xác tuyệt đối, bao gồm số thứ tự câu, các giả thiết và câu hỏi.
2. Bóc tách loại hình học không gian và các dữ kiện.

QUY TẮC BẮT BUỘC VỀ VĂN BẢN (problemText):
- problemText BẮT BUỘC viết bằng TIẾNG VIỆT TỰ NHIÊN DỄ ĐỌC (chuẩn diễn đạt SGK).
- TUYỆT ĐỐI KHÔNG xuất mã lệnh LaTeX thô trong problemText:
  * Viết "góc ABC = 120°" hoặc "góc ABC = 120 độ" thay vì "\\widehat{ABC} = 120^0" hay "\\widehat{ABC} = 120^\\circ".
  * Viết "a√2", "a√3" thay vì "a\\sqrt{2}", "a\\sqrt{3}".
  * Viết "tam giác ABC" thay vì "\\Delta ABC" hay "\\triangle ABC".
  * Viết "vuông góc với" hoặc "⊥" thay vì "\\perp".
  * Viết "song song với" hoặc "//" thay vì "\\parallel".
  * Viết "a/b" thay vì "\\frac{a}{b}".
  * Viết "AA'" thay vì "AA^{\\prime}".

CẤU TRÚC JSON DUY NHẤT:
{
  "problemText": "Toàn bộ văn bản đề bài bằng tiếng Việt tự nhiên dễ đọc",
  "shapeType": "hinh_chop_tam_giac" | "hinh_chop_day_hcn" | "hinh_chop_tu_giac_deu" | "hinh_hop_chu_nhat" | "hinh_lang_tru_tam_giac_deu" | "khac",
  "shapeName": "Tên hình (ví dụ: Hình lăng trụ ABCD.A'B'C' hoặc Hình chóp S.ABCD)",
  "givenFacts": []
}
${extraPromptText ? `Gợi ý thêm: ${extraPromptText}` : ''}
`;

    const callOptions = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
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

    const result = await callResilientGemini(callOptions);
    const parsed = cleanAndRepairGeometryJson(result.text) || {
      problemText: result.text.trim(),
      shapeType: 'khac',
      shapeName: 'Khối hình học'
    };

    const rawProbText = parsed.problemText || result.text.trim();
    const naturalProblemText = toNaturalVietnameseMathText(rawProbText);

    return NextResponse.json({
      success: true,
      problemText: naturalProblemText,
      shapeType: parsed.shapeType || 'khac',
      shapeName: parsed.shapeName || 'Khối hình học',
      givenFacts: parsed.givenFacts || [],
      rawText: result.text
    }, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('[Vision OCR Route Error]:', error);
    return NextResponse.json({
      error: maskErrorMessage(error, 'Lỗi nhận diện hình ảnh. Vui lòng thử lại với ảnh rõ nét hơn.'),
      success: false
    }, { status: 500, headers: corsHeaders });
  }
}
