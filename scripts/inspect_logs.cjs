const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function check() {
  const snap = await db.collection('ai_reasoning_logs').limit(10).get();
  console.log('Sample 10 docs from ai_reasoning_logs:');
  snap.forEach(d => {
    const data = d.data();
    console.log(`ID: ${d.id} | Fields: ${Object.keys(data).join(', ')} | expireAt: ${data.expireAt ? (data.expireAt.toDate ? data.expireAt.toDate() : data.expireAt) : 'none'}`);
  });
}
check().catch(e => console.error(e));
