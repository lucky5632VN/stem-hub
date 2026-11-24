const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const envLocalPath = path.resolve('.env.local');
let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
let projectId = process.env.FIREBASE_PROJECT_ID;

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const lines = envContent.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.replace(/\r/g, '').trim();
    const match = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (match) {
      const k = match[1];
      let v = match[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (k === 'FIREBASE_CLIENT_EMAIL' && !clientEmail) clientEmail = v;
      if (k === 'FIREBASE_PRIVATE_KEY' && !privateKey) privateKey = v;
      if (k === 'FIREBASE_PROJECT_ID' && !projectId) projectId = v;
    }
  }
}
projectId = projectId || 'cuoc-thi-ai-e2044';

let cleanKey = (privateKey || '').replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim();
let normalizedPem = cleanKey;
try {
  const lines = cleanKey.split('\n').map(l => l.trim()).filter(Boolean);
  const b64 = lines.slice(1, -1).join('');
  const buf = Buffer.from(b64, 'base64');
  const k = crypto.createPrivateKey({ key: buf, format: 'der', type: 'pkcs8' });
  normalizedPem = k.export({ type: 'pkcs8', format: 'pem' });
} catch (e) {}

const app = !getApps().length
  ? initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: normalizedPem
      })
    })
  : getApps()[0];

const db = getFirestore(app);

async function checkCount() {
  const snap = await db.collection('expert_reviews').get();
  console.log('EXPERT_REVIEWS_DOC_COUNT: ' + snap.size);
  if (snap.size > 0) {
    snap.docs.forEach(doc => {
      console.log(' - Doc ID:', doc.id, '| source:', doc.data().source);
    });
  }
}

checkCount().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

