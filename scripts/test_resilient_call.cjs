const keys = [
  "AQ.Ab8RN6LQUsXZaXFWOu7LxhO1noUzb_RAUuKrdkWA8u5_0RdyyA",
  "AQ.Ab8RN6KUEHlTK1rT6BDHzBwN3DT31L3L1kFriKNwaPSzZ_94Cg",
  "AQ.Ab8RN6LxIk7ajnDHC39c8HL8idUj_qHEEHZeHVhgQQJd6IVneg",
  "AQ.Ab8RN6IUK2SgSUHRvfrUgkMYh5ZuUkU6ARM0xV_tKg901ZFyVA",
  "AQ.Ab8RN6LgzhQhuXeK0P69gw9u_kyxv8jlWTsII--OlfbGDGMddg",
  "AQ.Ab8RN6L5ny1C1LsZNy8FdxzzqK0LYub9mSFVvfnprdwduJx8pQ",
  "AQ.Ab8RN6KGyO7LdzYEgcDARmK334qSXG689ngaloM9-Mbl3g5VUg",
  "AQ.Ab8RN6J11YpEGf4L9cmBzNkXmFSeKG1c97JlM8ympwksIjmJSQ",
  "AQ.Ab8RN6JCqpqGwgnjLGH5FuV3Ep3kbFGGNiH7XrFvfBqNKHuUxw",
  "AQ.Ab8RN6JqjVgnLduoyC8IHvGKU0-4lZtqHOMGKCQ32w398vWb-Q",
  "AQ.Ab8RN6I1nbEbhyw1ZPatFRlKk9ncAV-SrcfarJHYvztbPU-pYg",
  "AQ.Ab8RN6LENXueegwE82g3Oar7laqRNtDkWxgVA2cnIBEpiRhZsA",
  "AQ.Ab8RN6LKAFq4FY9r6CykD_7DJvtItBGL7sfzsHzNJW-vQESMpw",
  "AQ.Ab8RN6KIImWYQ51P647KvVQo-bAuoj9-mnsteNemFEvhIU2DOA",
  "AQ.Ab8RN6J5TlTTIgxjuhZgPAnPbHduDgPI_9Sx2R_2mDnx9cbDiQ",
  "AQ.Ab8RN6JrZn-2b8RqNFZlr_HimuWnvys1aklTyNaOCqI8cv1vUw",
  "AQ.Ab8RN6LRcFc7ZLNfv8sT5DaGLVcVAmQPoPvDZg4L5g2gCNxQBA",
  "AQ.Ab8RN6LnbeGSrsPvVC2IRjcyV-ScvQbLdC4hiaLjRUYlTk9nKw",
  "AQ.Ab8RN6LUOCQS9WwVdCoW1bTJ4u8S6PdTmn-t8gmhAGu4rOUQMQ",
  "AQ.Ab8RN6JQvJjqbu_KwhS6SeCMklVrkn6UO0eLX823yMCY9gXM9A",
  "AQ.Ab8RN6J_LKcFYULWOJSsNXTG3RY3tGhM2Xwpf49A2pwlFMF06w",
  "AQ.Ab8RN6IdFVTAurHBXOU2_zJcxNtHt17VB9hG7RUtgeQVZ8ztoQ",
  "AQ.Ab8RN6Jb1VWu7uwY_em6QfmQ9MAjwJUlbrU99wgmwWv1ZTA98A",
  "AQ.Ab8RN6IDogiOEW1CygJr0X7wyzuErXX9l1eyrFNim_OlD7awng",
  "AQ.Ab8RN6JPxg59QpmLxbpiEO7uNFHFSESUpsdnJoQKl2bT77d9iQ",
  "AIzaSyA3D-AqEnF44r5ON7EJ2sgKJq77wCBtAr4",
  "AIzaSyCnYq7Ixx_FXvYY7tt4DvAtxMMpVP8Qkic",
  "AIzaSyDGAlJXK72_tCOFXKVb2LAMmDzLcE7Ve8I"
];

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
