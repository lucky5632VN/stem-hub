/**
 * Resilient Gemini Caller for STEM HUB (Next.js Local Gateway - Zero Exposure Architecture)
 * - Reads securely from process.env.GEMINI_API_KEY (no hardcoded keys in code).
 * - Multi-Key & Multi-Model Rotation with anti-Retry-Storm mechanism.
 * - Circuit Breaker Cooldown per key on HTTP 429 / 503 to prevent cascading bottlenecks.
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

// Các model Flash tối ưu & tốc độ cao nhất của Google Gemini API v1beta (Đã loại bỏ các model bị bóp 20 RPD)
export const RESILIENT_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-flash-latest'
];

// Bản đồ Cooldown độc lập cho từng cặp (Key + Model) để một model hết hạn không làm nghẽn toàn bộ key
const modelKeyCooldownMap = new Map();

// Vòng xoay Atomic Round-Robin để phân phối tải đều trên 17 keys
if (!globalThis.__GEMINI_KEY_INDEX__) {
  globalThis.__GEMINI_KEY_INDEX__ = 0;
}

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

  const payload = {
    generationConfig: {
      temperature,
      maxOutputTokens
    }
  };

  if (responseMimeType) {
    payload.generationConfig.responseMimeType = responseMimeType;
  }

  if (systemInstruction) {
    payload.system_instruction = { parts: [{ text: systemInstruction }] };
  }

  if (contents && Array.isArray(contents)) {
    payload.contents = contents;
  } else if (prompt) {
    payload.contents = [{
      role: 'user',
      parts: [{ text: prompt }]
    }];
  } else {
    throw new Error('Cần cung cấp ít nhất prompt hoặc contents.');
  }

  let lastError = null;
  let attempts = 0;
  const now = Date.now();

  // Thử lần lượt các mô hình Flash theo thứ tự ưu tiên
  for (const model of RESILIENT_MODELS) {
    // Lấy điểm bắt đầu xoay vòng để các request song song không bị trùng key
    const startingOffset = (globalThis.__GEMINI_KEY_INDEX__++) % keys.length;
    const maxKeysToTry = Math.min(keys.length, 12);

    for (let k = 0; k < maxKeysToTry; k++) {
      if (++attempts > 30) break;

      const currentKeyIdx = (startingOffset + k) % keys.length;
      const key = keys[currentKeyIdx];
      const cooldownKey = `${key}:${model}`;

      // Bỏ qua cặp (Key + Model) đang trong thời gian hạ nhiệt
      const cooldownUntil = modelKeyCooldownMap.get(cooldownKey) || 0;
      if (now < cooldownUntil) {
        continue;
      }

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
        const headers = {
          'Content-Type': 'application/json',
          'x-goog-api-key': key
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6500); // 6.5s timeout cho mỗi lượt gọi

        const resp = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await resp.json().catch(() => ({}));

        if (resp.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          // Thành công: Xóa cooldown của cặp (Key + Model) này nếu có
          modelKeyCooldownMap.delete(cooldownKey);
          return {
            text: data.candidates[0].content.parts[0].text,
            model,
            candidates: data.candidates
          };
        }

        const errMsg = data.error?.message || `HTTP ${resp.status}`;
        lastError = new Error(errMsg);

        // Chặn lỗi vị trí (Location blocked)
        if (resp.status === 400 && errMsg.includes('User location is not supported')) {
          console.error('[Next.js Gateway CRITICAL] Google chặn IP (User location is not supported). DỪNG RETRY TOÀN BỘ NGAY LẬP TỨC!');
          throw new Error(`Google API chặn khu vực: ${errMsg}`);
        }

        // 404 Model không tồn tại trên endpoint -> chuyển ngay sang Model tiếp theo
        if (resp.status === 404 || errMsg.includes('not found')) {
          break;
        }

        // 429 Quota Exceeded -> Đưa riêng cặp (Key + Model) này vào hạ nhiệt
        if (resp.status === 429 || errMsg.includes('quota') || errMsg.includes('ResourceExhausted')) {
          const isDailyLimit = errMsg.includes('per day limit') || errMsg.includes('requests per day');
          const cooldownDuration = isDailyLimit ? 3600000 : 15000; // 1 giờ nếu hết quota ngày, 15s nếu 429 phút
          modelKeyCooldownMap.set(cooldownKey, Date.now() + cooldownDuration);
          continue;
        }

        continue;
      } catch (err) {
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
