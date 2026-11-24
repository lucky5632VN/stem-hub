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
  console.log('Total expert_reviews:', snap.size);
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Sort by timestamp
  docs.sort((a, b) => String(b.timestamp || b.createdAt || '').localeCompare(String(a.timestamp || a.createdAt || '')));

  console.log('\nTop 5 newest documents in expert_reviews:');
  docs.slice(0, 5).forEach(d => {
    console.log('ID:', d.id, 'reviewerType:', d.reviewerType, 'sampleId:', d.sampleId, 'time:', d.timestamp || d.createdAt, 'verdict:', d.verdict, 'aiVerdict:', d.aiVerdict, 'uid:', d.reviewerUid ? (d.reviewerUid.slice(0, 4) + '...' + d.reviewerUid.slice(-4)) : 'N/A');
  });

  console.log('\nAny documents where id DOES NOT start with rev_150_?');
  const nonRev150 = docs.filter(d => !d.id.startsWith('rev_150_'));
  console.log('Count:', nonRev150.length);
  nonRev150.forEach(d => console.log('Non rev_150:', d.id, d));
}

main().then(() => process.exit(0)).catch(console.error);

