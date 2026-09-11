const key = 'AQ.Ab8RN6JQvJjqbu_KwhS6SeCMklVrkn6UO0eLX823yMCY9gXM9A';
const models = [
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemini-3.7-flash'
];

async function run() {
  for (const m of models) {
    const t0 = Date.now();
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: '1+1=?' }] }] })
      });
      const dt = Date.now() - t0;
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ ${m}: OK in ${dt}ms`);
      } else {
        console.log(`❌ ${m}: HTTP ${res.status} (${data.error?.message?.substring(0, 60)}) in ${dt}ms`);
      }
    } catch (e) {
      console.log(`💥 ${m}: ${e.message}`);
    }
  }
}

run();
