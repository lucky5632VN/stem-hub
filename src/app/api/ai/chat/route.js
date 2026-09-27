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
    const prompt = (body.prompt || body.message || body.userText || body.text || body.query || '').trim();
    const { systemInstruction, contents, temperature = 0.3, maxOutputTokens = 1500, responseMimeType } = body;

    // Giới hạn độ dài prompt tối đa 8000 ký tự để chống DoS tràn bộ nhớ / quota
    if (prompt.length > 8000) {
      return NextResponse.json(
        { error: 'Câu hỏi quá dài (tối đa 8.000 ký tự). Vui lòng rút gọn nội dung.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!prompt && (!contents || contents.length === 0)) {
      return NextResponse.json(
        { error: 'Cần cung cấp ít nhất prompt hoặc contents.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await callResilientGemini({
      prompt,
      systemInstruction: typeof systemInstruction === 'string' ? systemInstruction : systemInstruction?.parts?.[0]?.text,
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
