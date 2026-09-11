const fetch = globalThis.fetch;

const COMBINED_MATH_API_KEYS = [
  "AQ.Ab8RN6JPxg59QpmLxbpiEO7uNFHFSESUpsdnJoQKl2bT77d9iQ",
  "AIzaSyA3D-AqEnF44r5ON7EJ2sgKJq77wCBtAr4",
  "AQ.Ab8RN6JQvJjqbu_KwhS6SeCMklVrkn6UO0eLX823yMCY9gXM9A",
];

const RESILIENT_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

async function testCall() {
  const text = "Cho hình lăng trụ ABC.A'B'C' có đáy ABC là tam giác đều cạnh bằng a. Hình chiếu vuông góc của A' trên (ABC) là trung điểm của AB. Mặt phẳng (AA'C'C) tạo với đáy một góc bằng 45°.";
  const prompt = `Phân tích đề bài sau và trích xuất JSON tham số: "${text}". CHỈ TRẢ VỀ JSON: shapeType, shapeName, parameters, auxiliaryRequests.`;

  for (const model of RESILIENT_MODELS) {
    for (const key of COMBINED_MATH_API_KEYS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2048,
              responseMimeType: 'application/json'
            }
          })
        });
        const data = await res.json();
        console.log(`Model: ${model}, Key: ${key.substring(0, 10)}... -> Status: ${res.status}`);
        if (!res.ok) {
          console.log('Error data:', JSON.stringify(data));
        } else {
          console.log('Success! Text:', data.candidates?.[0]?.content?.parts?.[0]?.text);
          return;
        }
      } catch (err) {
        console.log(`Err:`, err.message);
      }
    }
  }
}

testCall();
