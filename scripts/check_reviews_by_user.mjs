import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const envContent = fs.readFileSync('.env.local', 'utf8');
const regex = /^\s*([A-Za-z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^#\r\n]*))/gm;
let m;
while ((m = regex.exec(envContent)) !== null) {
  const key = m[1];
  let val = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[4]);
  if (val !== undefined && !process.env[key]) {
    process.env[key] = val.trim();
  }
}

let cleanKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim();
const app = initializeApp({
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'cuoc-thi-ai-e2044',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: cleanKey
  })
});
const db = getFirestore(app);

async function main() {
  const snap = await db.collection('expert_reviews').get();
  const byUser = {};
  snap.docs.forEach(d => {
    const data = d.data();
    const uid = data.reviewerUid || 'anonymous';
    byUser[uid] = (byUser[uid] || 0) + 1;
  });
  console.log('Reviews by user:');
  for (const [uid, count] of Object.entries(byUser)) {
    const masked = uid.length > 8 ? `${uid.slice(0, 4)}...${uid.slice(-4)}` : uid;
    console.log(`UID: ${masked} (len ${uid.length}) -> Count: ${count}`);
  }
}

main().then(() => process.exit(0)).catch(console.error);

