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

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = (body.prompt || body.message || body.userText || body.text || body.query || '').trim();
    const { systemInstruction, contents, temperature = 0.3, maxOutputTokens = 1500, responseMimeType } = body;

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
          ? 'Google AI chặn IP máy chủ theo khu vực (User location is not supported). Đã ngắt retry để bảo toàn quota.'
          : (error.message || 'Lỗi xử lý AI Gateway'),
        locationBlocked: isLocationBlocked
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
