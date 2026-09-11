const keys = [
  'AQ.Ab8RN6JQvJjqbu_KwhS6SeCMklVrkn6UO0eLX823yMCY9gXM9A',
  'AQ.Ab8RN6LUOCQS9WwVdCoW1bTJ4u8S6PdTmn-t8gmhAGu4rOUQMQ',
  'AQ.Ab8RN6LnbeGSrsPvVC2IRjcyV-ScvQbLdC4hiaLjRUYlTk9nKw',
  'AQ.Ab8RN6LRcFc7ZLNfv8sT5DaGLVcVAmQPoPvDZg4L5g2gCNxQBA'
];
const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-2.0-flash'];

async function test() {
  for (const m of models) {
    for (const k of keys) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${k}`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({contents: [{role: 'user', parts: [{text: 'Nung CaCO3 sinh ra khi gi?'}]}]})
        });
        const d = await res.json();
        if (d.candidates && d.candidates[0]) {
          console.log(`✅ SUCCESS on model [${m}] key [${k.substring(0, 12)}...]:`, d.candidates[0].content.parts[0].text.replace(/\n/g, ' ').substring(0, 100));
          return;
        } else {
          console.log(`⚠️ FAIL on [${m}]:`, d.error ? d.error.message : JSON.stringify(d));
        }
      } catch(e) {
        console.log(`❌ ERROR on [${m}]:`, e.message);
      }
    }
  }
}
test();
