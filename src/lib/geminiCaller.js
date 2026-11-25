/**
 * Resilient Gemini Caller for STEM HUB (Next.js Local Gateway - Zero Exposure Architecture)
 * - Reads securely from process.env.GEMINI_API_KEY (no hardcoded keys in code).
 * - Multi-Key & Multi-Model Rotation with anti-Retry-Storm mechanism.
 * - Circuit Breaker Cooldown per key on HTTP 429 / 503 to prevent cascading bottlenecks.
 * - If Google returns "User location is not supported", IMMEDIATELY breaks to prevent quota burning.
 */

export function getGeminiKeys() {
  // 1. Nếu có biến chỉ định rõ khóa duy nhất cho ablation / thí nghiệm
  if (process.env.SINGLE_GEMINI_API_KEY) {
    const single = process.env.SINGLE_GEMINI_API_KEY.replace(/[^A-Za-z0-9_.-]/g, '').trim();
    if (single.length >= 20 && (single.startsWith('AQ') || single.startsWith('AIza'))) {
      return [single];
    }
  }

  const raw = process.env.GEMINI_API_KEY || "";
  const allKeys = raw
    .split(/[\r\n,]+/)
    .map(k => k.replace(/[^A-Za-z0-9_.-]/g, '').trim())
    .filter(k => k.length >= 20 && (k.startsWith('AQ') || k.startsWith('AIza')));

  // 2. Chế độ MỘT KHÓA duy nhất: Nếu có cờ tắt xoay vòng hoặc cấu hình 1 key -> Chọn khóa HỢP LỆ đầu tiên
  if (process.env.DISABLE_KEY_ROTATION === 'true' || process.env.SINGLE_KEY_MODE === 'true') {
    const firstValid = allKeys.find(k => k.length >= 20 && (k.startsWith('AQ') || k.startsWith('AIza')));
    return firstValid ? [firstValid] : allKeys.slice(0, 1);
  }
  return allKeys;
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
  responseMimeType,
  apiKey,
  fixedModel = null
}) {
  const keys = apiKey ? [apiKey.trim()] : getGeminiKeys();
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
  const modelsToTry = fixedModel ? [fixedModel] : RESILIENT_MODELS;

  // Thử các mô hình Flash (hoặc duy nhất fixedModel nếu được chỉ định cho thí nghiệm khoa học)
  for (const model of modelsToTry) {
    // Lấy điểm bắt đầu xoay vòng để các request song song không bị trùng key
    const startingOffset = (globalThis.__GEMINI_KEY_INDEX__++) % keys.length;
    const maxKeysToTry = Math.min(keys.length, 12);

    for (let k = 0; k < maxKeysToTry; k++) {
      if (++attempts > 30) break;

      const currentKeyIdx = (startingOffset + k) % keys.length;
      const key = keys[currentKeyIdx];
      const cooldownKey = `${key}:${model}`;

      // Bỏ qua cặp (Key + Model) đang trong thời gian hạ nhiệt
      const now = Date.now();
      const cooldownUntil = modelKeyCooldownMap.get(cooldownKey) || 0;
      if (now < cooldownUntil) {
        lastError = lastError || new Error(`Khóa đang hạ nhiệt rate-limit (còn ${Math.ceil((cooldownUntil - now) / 1000)}s)`);
        continue;
      }

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const headers = {
          'Content-Type': 'application/json',
          'x-goog-api-key': key
        };

        const timeoutMs = process.env.GEMINI_TIMEOUT_MS ? parseInt(process.env.GEMINI_TIMEOUT_MS, 10) : 30000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs); // 30s timeout chuẩn cho LLM generation

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
            modelVersion: data.modelVersion || model,
            candidates: data.candidates,
            usageMetadata: data.usageMetadata || null,
            httpStatus: resp.status
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
          const isDailyLimit = errMsg.includes('per day limit') || (errMsg.includes('requests per day') && !errMsg.includes('requests per minute'));
          const cooldownDuration = isDailyLimit ? 60000 : 15000; // 60s nếu quota hồi phục, 15s nếu vượt 15 RPM
          lastError = new Error(`HTTP 429 Rate Limit (${isDailyLimit ? 'Hồi phục quota 60s' : 'Vượt 15 RPM'}): ${errMsg}`);
          modelKeyCooldownMap.set(cooldownKey, Date.now() + cooldownDuration);
          continue;
        }

        // 503 Service Unavailable / High Demand -> Đưa riêng cặp (Key + Model) này vào hạ nhiệt
        if (resp.status === 503 || errMsg.includes('high demand') || errMsg.includes('overloaded') || errMsg.includes('Spikes in demand')) {
          const cooldownDuration = 15000;
          lastError = new Error(`HTTP 503 High Demand: ${errMsg}`);
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
