/**
 * 🧪 Smoke Test 1 Lượt Gọi Gemini Qua Cổng Gateway Sản Phẩm (Zero Exposure)
 * Yêu cầu:
 * - Chạy đúng 1 lệnh gọi qua callResilientGemini
 * - Chỉ in: HTTP Status, Độ trễ (Latency ms), Số token (prompt, candidate, total), modelVersion
 * - TUYỆT ĐỐI KHÔNG in chuỗi khóa.
 */

import { callResilientGemini } from '../src/lib/geminiCaller.js';

async function runSmokeTest() {
  const prompt = "Hãy chào bằng một câu ngắn gọn dưới 10 từ.";
  const tStart = performance.now();
  
  try {
    const res = await callResilientGemini({
      prompt,
      temperature: 0.1,
      maxOutputTokens: 50
    });
    const tEnd = performance.now();
    const latencyMs = Math.round(tEnd - tStart);

    console.log('====================================================');
    console.log('🧪 KẾT QUẢ SMOKE TEST 1 LƯỢT GỌI QUA CỔNG SẢN PHẨM');
    console.log('====================================================');
    console.log(`- HTTP Status:        ${res.httpStatus || 200}`);
    console.log(`- Độ trễ (Latency):   ${latencyMs} ms`);
    console.log(`- Model yêu cầu:      ${res.model}`);
    console.log(`- ModelVersion API:   ${res.modelVersion}`);
    console.log(`- Prompt Tokens:      ${res.usageMetadata?.promptTokenCount ?? 'N/A'}`);
    console.log(`- Candidate Tokens:   ${res.usageMetadata?.candidatesTokenCount ?? 'N/A'}`);
    console.log(`- Total Tokens:       ${res.usageMetadata?.totalTokenCount ?? 'N/A'}`);
    console.log(`- Phản hồi nhận được: "${res.text.trim()}"`);
    console.log('====================================================');
    console.log('✅ KHÔNG CÓ BẤT KỲ KHÓA NÀO ĐƯỢC IN RA.');
  } catch (err) {
    const tEnd = performance.now();
    console.error('❌ Lỗi Smoke Test:', err.message);
    console.log(`- Độ trễ khi lỗi: ${Math.round(tEnd - tStart)} ms`);
    process.exit(1);
  }
}

runSmokeTest();

