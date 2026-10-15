/**
 * Resilient Gemini Caller for STEM HUB (Next.js Local Gateway - Zero Exposure Architecture)
 * - Reads securely from process.env.GEMINI_API_KEY (no hardcoded keys in code).
 * - Multi-Key & Multi-Model Rotation with anti-Retry-Storm mechanism.
 * - If Google returns "User location is not supported", IMMEDIATELY breaks to prevent quota burning.
 */

export function getGeminiKeys() {
  const raw = process.env.GEMINI_API_KEY || "";
  return raw
    .split(/[\r\n,]+/)
    .map(k => k.replace(/[^A-Za-z0-9_.-]/g, '').trim())
    .filter(k => k.length >= 20);
}

// Dynamic proxy to preserve backwards compatibility with modules reading GEMINI_KEYS
export const GEMINI_KEYS = new Proxy([], {
  get(target, prop) {
    const keys = getGeminiKeys();
    if (prop === 'length') return keys.length;
    if (typeof prop === 'string' && !isNaN(Number(prop))) return keys[Number(prop)];
    if (prop === Symbol.iterator) return keys[Symbol.iterator].bind(keys);
    if (typeof keys[prop] === 'function') return keys[prop].bind(keys);
    return keys[prop];
  }
});

export const RESILIENT_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemma-4-26b-a4b-it'
];

let keyRotator = 0;

export async function callResilientGemini({
  prompt,
  systemInstruction,
  contents,
  temperature = 0.3,
  maxOutputTokens = 1500,
  responseMimeType
}) {
  const keys = getGeminiKeys();
  if (keys.length === 0) {
    throw new Error('Next.js Gateway: Chưa cấu hình biến môi trường GEMINI_API_KEY trong .env.local.');
  }

  let lastError = null;
  let attempts = 0;

  for (const model of RESILIENT_MODELS) {
    const isGemma = model.startsWith('gemma');
    const payload = {
      generationConfig: {
        temperature,
        maxOutputTokens
      }
    };

    if (responseMimeType && !isGemma) {
      payload.generationConfig.responseMimeType = responseMimeType;
    }

    if (systemInstruction && !isGemma) {
      payload.system_instruction = { parts: [{ text: systemInstruction }] };
    }

    if (contents && Array.isArray(contents)) {
      payload.contents = isGemma && systemInstruction
        ? [{ role: 'user', parts: [{ text: `[SYSTEM]: ${systemInstruction}` }] }, ...contents]
        : contents;
    } else if (prompt) {
      payload.contents = [{
        role: 'user',
        parts: [{ text: isGemma && systemInstruction ? `[SYSTEM]: ${systemInstruction}\n\n${prompt}` : prompt }]
      }];
    } else {
      throw new Error('Cần cung cấp ít nhất prompt hoặc contents.');
    }

    // Chọn vị trí bắt đầu ngẫu nhiên để phân bổ đều trên toàn bộ keys
    const startIndex = Math.floor(Math.random() * keys.length);
    const maxKeysForModel = Math.min(keys.length, 10);

    for (let k = 0; k < maxKeysForModel; k++) {
      if (++attempts > 30) break;
      const currentKeyIdx = (startIndex + k) % keys.length;
      const key = keys[currentKeyIdx];

      try {
        // Luôn truyền API Key qua query parameter và header x-goog-api-key
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

        const headers = {
          'Content-Type': 'application/json',
          'x-goog-api-key': key
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const resp = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await resp.json().catch(() => ({}));

        if (resp.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          keyRotator = (currentKeyIdx + 1) % keys.length;
          return {
            text: data.candidates[0].content.parts[0].text,
            model,
            candidates: data.candidates
          };
        }

        const errMsg = data.error?.message || `HTTP ${resp.status}`;
        lastError = new Error(errMsg);

        // ⚠️ SỬA LỖI RETRY STORM:
        // Nếu fetch Google trả về lỗi 400 chứa "User location is not supported", bắt buộc phải BREAK
        // khỏi vòng lặp ngay lập tức và trả lỗi về, TUYỆT ĐỐI KHÔNG thử Key khác để tránh bị khóa Quota!
        if (resp.status === 400 && errMsg.includes('User location is not supported')) {
          console.error('[Next.js Gateway CRITICAL] Google chặn IP (User location is not supported). DỪNG RETRY TOÀN BỘ NGAY LẬP TỨC!');
          throw new Error(`Google API chặn khu vực: ${errMsg}`);
        }

        // 404 Model không tồn tại trên endpoint -> chuyển sang Model kế tiếp
        if (resp.status === 404 || errMsg.includes('not found')) {
          break;
        }

        // 429 Quota Exceeded -> thử Key tiếp theo trong danh sách
        continue;
      } catch (err) {
        // Nếu là lỗi chặn vị trí đã được ném ở trên, rethrow ngay lập tức ra ngoài!
        if (err.message && err.message.includes('User location is not supported')) {
          throw err;
        }
        lastError = err;
        continue;
      }
    }

    if (attempts > 30) break;
  }

  throw new Error(`Tất cả mô hình Gemini đều bận: ${lastError?.message || 'Không rõ nguyên nhân'}`);
}

