const fs = require('fs');

const content = fs.readFileSync('cloudflare-worker/index.js', 'utf8');
const start = content.indexOf('const fallbackKeys = [');
const end = content.indexOf('];', start);
const arrStr = content.substring(start + 'const fallbackKeys = ['.length, end);
const keys = arrStr.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);

console.log('Total keys to test:', keys.length);

async function testKeys() {
  let okCount = 0;
  let failCount = 0;
  const validKeys = [];
  const badKeys = [];

  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const isAQ = k.startsWith('AQ.');
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent' + (isAQ ? '' : '?key=' + k);
    const headers = { 'Content-Type': 'application/json' };
    if (isAQ) headers['x-goog-api-key'] = k;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ contents: [{ parts: [{ text: '1+1=' }] }] })
      });
      const data = await res.json();
      if (res.ok && data.candidates && data.candidates[0] && data.candidates[0].content) {
        console.log(`${i + 1}/${keys.length} [${k.substring(0, 15)}...]: OK`);
        okCount++;
        validKeys.push(k);
      } else {
        console.log(`${i + 1}/${keys.length} [${k.substring(0, 15)}...]: FAIL (${res.status} - ${data.error ? data.error.message : 'No candidate'})`);
        failCount++;
        badKeys.push({ key: k, status: res.status, err: data.error ? data.error.message : 'No candidate' });
      }
    } catch (e) {
      console.log(`${i + 1}/${keys.length} [${k.substring(0, 15)}...]: ERROR (${e.message})`);
      failCount++;
      badKeys.push({ key: k, err: e.message });
    }
  }

  console.log(`\nResults: ${okCount} OK, ${failCount} FAIL`);
}

testKeys();
