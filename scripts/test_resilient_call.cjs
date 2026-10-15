const keys = []; // Cleared for security


const RESILIENT_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemma-4-26b-a4b-it'
];

let globalKeyIdx = Math.floor(Math.random() * keys.length);

async function testCallGemini(promptText) {
  let lastError = null;
  let subrequestCount = 0;

  for (const model of RESILIENT_MODELS) {
    const isGemma = model.startsWith('gemma');
    const payload = {
      contents: [{
        role: 'user',
        parts: [{ text: promptText }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1200
      }
    };

    // Try a couple of keys per model; if 429 quota, break to next model!
    const startIndex = globalKeyIdx;
    for (let k = 0; k < Math.min(keys.length, 5); k++) {
      if (++subrequestCount > 25) break;
      const keyIdx = (startIndex + k) % keys.length;
      const key = keys[keyIdx];

      try {
        const isAQ = key.startsWith('AQ.');
        const url = isAQ
          ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
          : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

        const reqHeaders = { 'Content-Type': 'application/json' };
        if (isAQ) reqHeaders['x-goog-api-key'] = key;

        const resp = await fetch(url, {
          method: 'POST',
          headers: reqHeaders,
          body: JSON.stringify(payload)
        });

        const data = await resp.json();
        if (resp.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          globalKeyIdx = (keyIdx + 1) % keys.length;
          return {
            text: data.candidates[0].content.parts[0].text,
            model,
            keyIdx
          };
        }

        const errMsg = data.error?.message || `HTTP ${resp.status}`;
        lastError = new Error(errMsg);

        // If 429 quota exceeded, this model's quota is exhausted -> break to next model!
        if (resp.status === 429 || errMsg.includes('Quota') || errMsg.includes('quota')) {
          console.log(`[test] Model ${model} rate-limited (429), switching to next model...`);
          break;
        }

        // If model 503 or 404, switch to next model immediately
        if (resp.status === 503 || resp.status === 404) {
          console.log(`[test] Model ${model} not available (${resp.status}), switching to next model...`);
          break;
        }

      } catch (err) {
        lastError = err;
      }
    }
  }

  throw new Error(`Tất cả mô hình Gemini đều bận: ${lastError?.message || 'Không rõ nguyên nhân'}`);
}

async function run() {
  try {
    console.log('Testing callGemini with prompt: "Chào bạn, hãy giới thiệu 1 câu ngắn về hình chóp tam giác"...');
    const res = await testCallGemini("Chào bạn, hãy giới thiệu 1 câu ngắn về hình chóp tam giác");
    console.log('✅ SUCCESS!');
    console.log('Model used:', res.model);
    console.log('Key index:', res.keyIdx);
    console.log('AI response:\n', res.text);
  } catch (e) {
    console.error('❌ FAILED:', e.message);
  }
}

run();
