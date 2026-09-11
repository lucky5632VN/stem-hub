const key = 'AQ.Ab8RN6JQvJjqbu_KwhS6SeCMklVrkn6UO0eLX823yMCY9gXM9A';
const models = ['gemini-2.5-pro', 'gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-pro-latest'];

async function run() {
  for (const m of models) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({contents: [{role: 'user', parts: [{text: 'hi'}]}]})
      });
      const d = await r.json();
      if (d.candidates && d.candidates[0]) {
        console.log(`✅ ${m} SUCCESS:`, d.candidates[0].content.parts[0].text.substring(0, 40));
      } else {
        console.log(`❌ ${m} FAIL:`, d.error ? d.error.message.substring(0, 50) : d);
      }
    } catch(e) {
      console.log(`⚠️ ${m} NET ERROR:`, e.message);
    }
  }
}
run();
