const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const crypto = require('crypto');

const envContent = fs.readFileSync('.env.local', 'utf8');
const regex = /^\s*([A-Za-z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^#\r\n]*))/gm;
let m;
while ((m = regex.exec(envContent)) !== null) {
  const k = m[1];
  let v = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[4]);
  if (v !== undefined) process.env[k] = v.trim();
}

let cleanKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim();
const lines = cleanKey.split('\n').map(l => l.trim()).filter(Boolean);
const b64 = lines.slice(1, -1).join('');
const buf = Buffer.from(b64, 'base64');
const k = crypto.createPrivateKey({ key: buf, format: 'der', type: 'pkcs8' });
const pem = k.export({ type: 'pkcs8', format: 'pem' });

const app = initializeApp({
  credential: cert({
    projectId: 'cuoc-thi-ai-e2044',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: pem
  })
});

const db = getFirestore(app);
async function inspect() {
  const snap = await db.collection('ai_reasoning_logs').get();
  let withField = 0;
  let withRealEmail = 0;
  let withEmptyStringOrNull = 0;
  let withAnonymous = 0;
  let withRealDisplayName = 0;
  let withEmptyDisplayName = 0;
  let uniqueDomains = new Set();
  
  snap.forEach(d => {
    const data = d.data();
    if ('userEmail' in data) {
      withField++;
      const val = data.userEmail;
      if (typeof val === 'string' && val.includes('@')) {
        withRealEmail++;
        const domain = val.split('@')[1];
        if (domain) uniqueDomains.add(domain);
      } else if (val === 'anonymous' || val === 'demo') {
        withAnonymous++;
      } else {
        withEmptyStringOrNull++;
      }
    }
    if ('userDisplayName' in data) {
      const name = data.userDisplayName;
      if (typeof name === 'string' && name.trim().length > 0) withRealDisplayName++;
      else withEmptyDisplayName++;
    }
  });

  console.log('Total docs in ai_reasoning_logs:', snap.size);
  console.log('Docs containing field userEmail:', withField);
  console.log('Docs with real email string (containing @):', withRealEmail);
  console.log('Docs with anonymous/demo as userEmail:', withAnonymous);
  console.log('Docs with empty string/null/undefined userEmail:', withEmptyStringOrNull);
  console.log('Docs with real userDisplayName:', withRealDisplayName);
  console.log('Docs with empty userDisplayName:', withEmptyDisplayName);
  console.log('Email domains count:', uniqueDomains.size);
}

inspect().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
