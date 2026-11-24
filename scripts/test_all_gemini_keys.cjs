/**
 * 🧪 scripts/test_all_gemini_keys.cjs
 * Thử nghiệm lần lượt cả 15 khóa trong GEMINI_API_KEY
 * - Phương thức: Header 'x-goog-api-key' (Zero Exposure URL)
 * - Mô hình: gemini-3.5-flash-lite
 * - Lời nhắc: rất ngắn ("ping")
 * - Chỉ in: STT, Dạng (AQ/AIza), Mã HTTP, Độ trễ (ms), observedModelVersion, Tổng hợp lệ/không hợp lệ
 * - TUYỆT ĐỐI KHÔNG IN KHÓA API.
 */

const fs = require('fs');
const path = require('path');

// Đọc danh sách khóa từ .env.local
const envLocalPath = path.resolve('.env.local');
if (!fs.existsSync(envLocalPath)) {
  console.error('LỖI: Không tìm thấy file .env.local');
  process.exit(1);
}

const envContent = fs.readFileSync(envLocalPath, 'utf8');
const match = envContent.match(/^GEMINI_API_KEY=(.*)$/m);
if (!match) {
  console.error('LỖI: Không tìm thấy biến GEMINI_API_KEY trong .env.local');
  process.exit(1);
}

const rawLine = match[1].trim();
// Tách bằng dấu phẩy và làm sạch ký tự bao ngoài (nháy kép, nháy đơn, xuống dòng)
const rawKeys = rawLine.split(/[\r\n,]+/).map(k => k.trim()).filter(Boolean);
const cleanedKeys = rawKeys.map(k => k.replace(/[^A-Za-z0-9_.-]/g, '').trim()).filter(k => k.length >= 20);

async function testSingleKey(key, index) {
  const isAQ = key.startsWith('AQ');
  const isAIza = key.startsWith('AIza');
  const keyType = isAQ ? 'AQ' : (isAIza ? 'AIza' : 'Khác');

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent';
  const payload = {
    contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
    generationConfig: { maxOutputTokens: 5, temperature: 0 }
  };

  const tStart = performance.now();
  let httpStatus = 0;
  let latencyMs = 0;
  let observedModelVersion = 'N/A';
  let isValid = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);

    latencyMs = Math.round(performance.now() - tStart);
    httpStatus = res.status;

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      isValid = true;
      observedModelVersion = data.modelVersion || 'gemini-3.5-flash-lite';
    } else {
      observedModelVersion = data.error?.message ? `Lỗi: ${data.error.message.slice(0, 45)}...` : 'N/A';
    }
  } catch (err) {
    latencyMs = Math.round(performance.now() - tStart);
    httpStatus = 0;
    observedModelVersion = `Lỗi mạng: ${err.message.slice(0, 40)}`;
  }

  return {
    index: index + 1,
    keyType,
    httpStatus,
    latencyMs,
    observedModelVersion,
    isValid
  };
}

async function main() {
  console.log('='.repeat(80));
  console.log('🔍 KIỂM THỬ TỪNG KHÓA TRONG BIẾN GEMINI_API_KEY (.env.local)');
  console.log('='.repeat(80));
  console.log(`Tổng số khóa trích xuất được: ${cleanedKeys.length}`);
  console.log('─'.repeat(80));
  console.log(
    String('STT').padEnd(6) +
    String('Dạng').padEnd(10) +
    String('Mã HTTP').padEnd(12) +
    String('Độ trễ').padEnd(12) +
    'observedModelVersion / Chi tiết lỗi'
  );
  console.log('─'.repeat(80));

  let validCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < cleanedKeys.length; i++) {
    const result = await testSingleKey(cleanedKeys[i], i);
    if (result.isValid) {
      validCount++;
    } else {
      invalidCount++;
    }

    console.log(
      String(`#${result.index}`).padEnd(6) +
      String(result.keyType).padEnd(10) +
      String(result.httpStatus).padEnd(12) +
      String(`${result.latencyMs} ms`).padEnd(12) +
      result.observedModelVersion
    );
  }

  console.log('─'.repeat(80));
  console.log(`📊 TỔNG KẾT:`);
  console.log(`• Tổng số khóa kiểm tra: ${cleanedKeys.length}`);
  console.log(`• Số lượng HỢP LỆ (HTTP 200): ${validCount}`);
  console.log(`• Số lượng KHÔNG HỢP LỆ: ${invalidCount}`);
  console.log('='.repeat(80));
}

main();

