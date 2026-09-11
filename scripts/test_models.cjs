const apiKey = 'AQ.Ab8RN6JPxg59QpmLxbpiEO7uNFHFSESUpsdnJoQKl2bT77d9iQ';
const models = [
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro'
];

async function check() {
  for (const m of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: '1+1=' }] }] })
      });
      const data = await res.json();
      if (res.ok) {
        console.log('✅ Model', m, 'OK! Answer:', data.candidates?.[0]?.content?.parts?.[0]?.text?.trim());
      } else {
        console.log('❌ Model', m, 'Failed:', res.status, data.error?.message?.slice(0, 100));
      }
    } catch (e) {
      console.log('❌ Model', m, 'Error:', e.message);
    }
  }
}
check();
