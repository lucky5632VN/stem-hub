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
Trình bày ngắn gọn, súc tích, công thức bọc trong $...$ hoặc $$...$$.`;

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

    return NextResponse.json(
      {
        success: true,
        text: result.text,
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
