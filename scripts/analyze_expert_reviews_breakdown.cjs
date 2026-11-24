const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

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
const auth = getAuth(app);

async function main() {
  const snap = await db.collection('expert_reviews').get();
  console.log('Tổng số bản ghi expert_reviews trong DB:', snap.size);

  const portalDocs = [];
  const otherDocs = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    if (!doc.id.startsWith('rev_150_') && !doc.id.startsWith('bench_')) {
      portalDocs.push({ id: doc.id, ...data });
    } else {
      otherDocs.push({ id: doc.id, ...data });
    }
  }

  console.log(`Số bản ghi portal thực tế (không phải tiền tố rev_150_/bench_): ${portalDocs.length}`);
  console.log(`Số bản ghi rev_150_*: ${otherDocs.length}`);

  console.log('\n================ CHI TIẾT CÁC BẢN GHI PORTAL THỰC TẾ ================');
  for (const d of portalDocs) {
    let claims = {};
    if (d.reviewerUid) {
      try {
        const u = await auth.getUser(d.reviewerUid);
        claims = u.customClaims || {};
      } catch (e) {
        claims = { error: e.message };
      }
    }
    const rawUid = String(d.reviewerUid || '');
    const maskedUid = rawUid.length > 8 ? `${rawUid.slice(0, 4)}...${rawUid.slice(-4)}` : '***';

    console.log(`\nDoc ID: ${d.id}`);
    console.log(`  reviewerType: ${d.reviewerType}`);
    console.log(`  reviewerCode: ${d.reviewerCode}`);
    console.log(`  reviewerUid (masked): ${maskedUid}`);
    console.log(`  Custom Claims: ${JSON.stringify(claims)}`);
    console.log(`  source: ${d.source || 'portal_direct'}`);
    console.log(`  sampleId: ${d.sampleId}`);
    console.log(`  createdAt / timestamp: ${d.timestamp || d.createdAt}`);
    console.log(`  aiVerdict: ${d.aiVerdict}`);
    console.log(`  overallVerdict: ${d.verdict}`);
    console.log(`  dap_an: ${d.dap_an} | trinh_bay: ${d.trinh_bay}`);
    console.log(`  isDemo: ${d.isDemo}`);
    console.log(`  notes: ${d.notes}`);
  }

  // Check admin_logs for claims assignment
  console.log('\n================ ADMIN LOGS (CẤP CLAIMS) ================');
  const adminSnap = await db.collection('admin_logs').get();
  console.log(`Tổng số admin_logs: ${adminSnap.size}`);
  for (const doc of adminSnap.docs) {
    const d = doc.data();
    const adminUid = String(d.adminUid || d.performedBy || '');
    const targetUid = String(d.targetUid || d.userId || '');
    const maskedAdmin = adminUid.length > 8 ? `${adminUid.slice(0, 4)}...${adminUid.slice(-4)}` : '***';
    const maskedTarget = targetUid.length > 8 ? `${targetUid.slice(0, 4)}...${targetUid.slice(-4)}` : '***';
    console.log(`[${d.timestamp || d.createdAt}] Action: ${d.action || d.type} | By: ${maskedAdmin} | Target: ${maskedTarget} | Details: ${JSON.stringify(d.details || d.payload || {})}`);
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});
