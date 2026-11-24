import fs from 'fs';
import path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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
  console.log('Tổng số phiếu expert_reviews trong DB:', allReviews.length);

  // Group by docId pattern
  const portalReal = allReviews.filter(d => !d.docId.startsWith('rev_150_'));
  const synthetic150 = allReviews.filter(d => d.docId.startsWith('rev_150_'));
  console.log('Số phiếu portal thực tế:', portalReal.length);
  console.log('Số phiếu tổng hợp (rev_150_*):', synthetic150.length);

  portalReal.forEach((r, idx) => {
    console.log(`\nPhiếu Portal #${idx + 1}:`);
    console.log('  Doc ID:', r.docId);
    console.log('  reviewerType:', r.reviewerType);
    console.log('  reviewerUid:', r.reviewerUid ? (r.reviewerUid.slice(0, 4) + '...' + r.reviewerUid.slice(-4)) : 'N/A');
    console.log('  sampleId:', r.sampleId);
    console.log('  verdict:', r.verdict);
    console.log('  aiVerdict:', r.aiVerdict);
    console.log('  isDemo:', r.isDemo);
    console.log('  timestamp:', r.timestamp || r.createdAt);
  });

  const teacherReviews = allReviews.filter(r => r.reviewerType === 'teacher' && !r.isDemo && !r.skipped);
  console.log('\nteacherReviews (tất cả không phải isDemo/skipped):', teacherReviews.length);

  const pairsAll = teacherReviews.map(r => ({
    sampleId: r.sampleId,
    teacherVerdict: r.verdict === 'dung',
    aiVerdict: r.aiVerdict !== undefined ? Boolean(r.aiVerdict) : true
  }));
  const cmAll = computeTeacherAiConfusionMatrix(pairsAll);
  console.log('\n=== MA TRẬN TRÊN TOÀN BỘ 150 PHIẾU (gồm rev_150_*) ===');
  console.log('totalSamples:', cmAll.totalSamples);
  console.log('matrix:', cmAll.matrix);
  console.log('metrics:', cmAll.metrics);
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});
