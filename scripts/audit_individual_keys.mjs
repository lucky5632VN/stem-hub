import fs from 'fs';

// Load .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
let rawKeys = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('GEMINI_API_KEY=')) {
    rawKeys = line.substring('GEMINI_API_KEY='.length).trim();
  }
}

const keys = rawKeys
  .split(/[\r\n,]+/)
  .map(k => k.replace(/[^A-Za-z0-9_.-]/g, '').trim())
  .filter(k => k.length >= 20);

console.log(`Auditing each of the ${keys.length} API keys individually...`);

const report = [];
for (let i = 0; i < keys.length; i++) {
  const k = keys[i];
  const masked = k.substring(0, 8) + '...' + k.substring(k.length - 4);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${encodeURIComponent(k)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Hi' }] }] }),
      signal: AbortSignal.timeout(6000)
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      report.push({ index: i, key: masked, status: 'VALID (OK 200)' });
    } else {
      report.push({ index: i, key: masked, status: `FAILED (HTTP ${res.status}): ${data.error?.message?.slice(0, 80) || 'Unknown error'}` });
    }
  } catch (err) {
    report.push({ index: i, key: masked, status: `ERROR: ${err.message}` });
  }
}

console.log('\n--- BÁO CÁO SỨC KHỎE 17 KEYS GEMINI ---');
for (const r of report) {
  console.log(`Key #${String(r.index + 1).padStart(2)} [${r.key}]: ${r.status}`);
}

