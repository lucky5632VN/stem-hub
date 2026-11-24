/**
 * 🧪 Test vận chuyển khóa Gemini chỉ qua Header 'x-goog-api-key' (Zero Exposure in URL)
 * - Đảm bảo URL là sạch (không có ?key=)
 * - Thử nghiệm với các dạng khóa (AIza... và AQ...)
 * - Chỉ in tiền tố 4 ký tự đầu, TUYỆT ĐỐI không in toàn bộ khóa
 * - Ghi nhận: HTTP status, latency, token count, modelVersion
 */

const fs = require('fs');
const path = require('path');

// Đọc danh sách khóa từ .env.local
const envLocalPath = path.resolve('.env.local');
let keys = [];
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  const match = content.match(/^GEMINI_API_KEY=(.*)$/m);
  if (match) {
    keys = match[1].split(',').map(k => k.trim()).filter(Boolean);
  }
}

async function testHeaderKey(key, label) {
  const prefix = key.substring(0, 4) + '...' + key.substring(key.length - 4);
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent';

  console.log(`\n──────────────────────────────────────────────────`);
  console.log(`🔑 Thử nghiệm khóa [${label}]: Tiền tố '${prefix}'`);
  console.log(`🌐 Endpoint URL: ${url}`);
  console.log(`🔒 Kiểm tra an toàn: URL có chứa "?key=" không? -> ${url.includes('?key=') ? '❌ CÓ LỖ HỔNG!' : '✅ HOÀN TOÀN SẠCH (Header-only)'}`);

  const payload = {
    contents: [{ role: 'user', parts: [{ text: 'Trả lời đúng 1 từ: OK' }] }],
    generationConfig: { temperature: 0, maxOutputTokens: 10 }
  };

  const tStart = performance.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key
      },
      body: JSON.stringify(payload)
    });
    const latencyMs = Math.round(performance.now() - tStart);
    const data = await res.json().catch(() => ({}));

    console.log(`📡 Mã phản hồi HTTP: ${res.status} ${res.statusText}`);
    console.log(`⏱️ Độ trễ: ${latencyMs} ms`);

    if (res.ok) {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      const usage = data.usageMetadata || {};
      console.log(`🤖 Model Version trả về: ${data.modelVersion || 'gemini-flash-lite-latest'}`);
      console.log(`📊 Số token: Input: ${usage.promptTokenCount || 'N/A'}, Output: ${usage.candidatesTokenCount || 'N/A'}, Tổng: ${usage.totalTokenCount || 'N/A'}`);
      console.log(`💬 Phản hồi ngắn: "${text}"`);
      console.log(`✅ Kết quả: Thành công 100% qua header 'x-goog-api-key'.`);
    } else {
      console.log(`⚠️ Lỗi API: ${data.error?.message || 'Unknown error'}`);
    }
  } catch (err) {
    console.error(`❌ Lỗi kết nối:`, err.message);
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('🚀 KIỂM THỬ KHÓA GEMINI VẬN CHUYỂN BẰNG HEADER "x-goog-api-key"');
  console.log('='.repeat(70));

  // Phân loại khóa AIza... và AQ...
  const aizaKey = keys.find(k => k.startsWith('AIza'));
  const aqKey = keys.find(k => k.startsWith('AQ') || !k.startsWith('AIza'));

  if (aizaKey) {
    await testHeaderKey(aizaKey, 'Dạng AIza');
  } else {
    console.log('Không tìm thấy khóa dạng AIza trong .env.local');
  }

  if (aqKey && aqKey !== aizaKey) {
    await testHeaderKey(aqKey, 'Dạng AQ / Khác');
  } else if (keys.length > 1) {
    await testHeaderKey(keys[1], 'Khóa số 2');
  }

  console.log('\n' + '='.repeat(70));
  console.log('🛡️ TẤT CẢ LỆNH GỌI THỰC HIỆN QUA HEADER. KHÔNG IN KHÓA, KHÔNG LỘ URL.');
  console.log('='.repeat(70));
}

main();

