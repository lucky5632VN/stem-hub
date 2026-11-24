import fs from 'fs';
import path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { buildUnifiedSamplePool } from '../src/lib/reviewSampler.js';
import { computeTeacherAiConfusionMatrix } from '../src/lib/reviewAgreement.js';

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
  const allReviews = snap.docs.map(d => ({ docId: d.id, ...d.data() }));

  const samplePool = buildUnifiedSamplePool();
  const samplePoolMap = new Map();
  samplePool.forEach(s => samplePoolMap.set(s.sampleId, s));
  console.log('samplePool size:', samplePool.length);

  let blindMap = [];
  try {
    const mapPath = path.resolve('reports/ablation/secret_mapping/math_teacher_blind_map.json');
    if (fs.existsSync(mapPath)) blindMap = JSON.parse(fs.readFileSync(mapPath, 'utf8')).mapping || [];
  } catch (_) {}

  const teacherReviews = allReviews.filter(r => r.reviewerType === 'teacher' && !r.isDemo && !r.skipped);
  console.log('teacherReviews count:', teacherReviews.length);

  const matchedSid = [];
  const unmatchedSid = [];

  teacherReviews.forEach(r => {
    const sid = r.sampleId;
    if (samplePoolMap.has(sid)) {
      matchedSid.push(sid);
    } else {
      unmatchedSid.push(sid);
    }
  });

  console.log('matched in samplePoolMap:', matchedSid.length);
  console.log('unmatched in samplePoolMap:', unmatchedSid.length);
  if (unmatchedSid.length > 0) {
    console.log('Sample unmatched sid:', unmatchedSid.slice(0, 10));
    console.log('Sample pool sampleId:', Array.from(samplePoolMap.keys()).slice(0, 10));
  }
}

main().then(() => process.exit(0)).catch(console.error);
