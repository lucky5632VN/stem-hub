const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Load env
const envContent = fs.readFileSync('.env.local', 'utf8');
const lines = envContent.split('\n');
let clientEmail, privateKey, projectId;
for (const l of lines) {
  const m = l.trim().match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) {
    let [_, k, v] = m;
    v = v.replace(/^['"]|['"]$/g, '').trim();
    if (k === 'FIREBASE_CLIENT_EMAIL') clientEmail = v;
    if (k === 'FIREBASE_PRIVATE_KEY') privateKey = v.replace(/\\n/g, '\n');
    if (k === 'FIREBASE_PROJECT_ID') projectId = v;
  }
}

const app = !getApps().length ? initializeApp({
  credential: cert({ projectId, clientEmail, privateKey })
}) : getApps()[0];

const db = getFirestore(app);

function maskUid(uid) {
  if (!uid || typeof uid !== 'string') return 'N/A';
  if (uid.length <= 8) return uid.slice(0, 2) + '***' + uid.slice(-2);
  return uid.slice(0, 4) + '...' + uid.slice(-4);
}

async function audit() {
  console.log('=== 1. EXPERT_REVIEWS AUDIT (READ ONLY) ===');
  const expSnap = await db.collection('expert_reviews').get();
  console.log('Total expert_reviews docs in Firestore:', expSnap.size);

  const breakdown = {};
  const sampleTimes = {};

  expSnap.forEach(d => {
    const data = d.data();
    const isRev150 = d.id.startsWith('rev_150_');
    const key = JSON.stringify({
      source: data.source || 'undefined',
      reviewerType: data.reviewerType || 'undefined',
      isDemo: data.isDemo !== undefined ? data.isDemo : 'undefined',
      prefix_rev_150: isRev150
    });
    breakdown[key] = (breakdown[key] || 0) + 1;
    if (!sampleTimes[key]) sampleTimes[key] = [];
    if (sampleTimes[key].length < 3) sampleTimes[key].push({ id: d.id, createdAt: data.createdAt });
  });

  for (const [k, count] of Object.entries(breakdown)) {
    console.log(`Group: ${k} -> Count: ${count}`);
    console.log('  Samples:', sampleTimes[k]);
  }

  console.log('\n=== 2. ADMIN_LOGS AUDIT (READ ONLY) ===');
  const adminSnap = await db.collection('admin_logs').get();
  console.log('Total admin_logs in Firestore:', adminSnap.size);
  adminSnap.forEach(d => {
    const data = d.data();
    const str = JSON.stringify(data);
    if (str.includes('auto_setup') || str.includes('sZmj') || data.action === 'GRANT_TEACHER_ROLE') {
      console.log('Doc ID:', d.id);
      console.log('Data:', {
        action: data.action,
        targetUid: maskUid(data.targetUid),
        grantedBy: maskUid(data.grantedBy),
        createdAt: data.createdAt,
        timestamp: data.timestamp,
        auditNote: data.auditNote,
        reviewerType: data.reviewerType,
        subjects: data.subjects
      });
    }
  });

  console.log('\n=== 3. LEARNED_KNOWLEDGE AUDIT (READ ONLY) ===');
  const lkSnap = await db.collection('learned_knowledge').get();
  console.log('Total learned_knowledge docs in Firestore:', lkSnap.size);
  let benchCount = 0, learnedCount = 0, otherCount = 0;
  const lkBreakdown = {};
  lkSnap.forEach(d => {
    if (d.id.startsWith('bench_verified_')) benchCount++;
    else if (d.id.startsWith('learned_')) learnedCount++;
    else otherCount++;
    const data = d.data();
    const key = `status=${data.status || 'undefined'}, verifiedBy=${data.verifiedBy ? 'present' : 'none'}, quarantined=${data.quarantined}`;
    lkBreakdown[key] = (lkBreakdown[key] || 0) + 1;
    if (d.id.startsWith('learned_1795') || d.id.includes('sefy')) {
      console.log('Special doc:', d.id, {
        status: data.status,
        verifiedBy: data.verifiedBy,
        verifiedAt: data.verifiedAt,
        creator: maskUid(data.creatorUid || data.userId || data.authorUid || data.userHash),
        createdAt: data.createdAt,
        query: (data.query || '').slice(0, 40)
      });
    }
  });
  console.log(`Prefix count in Firestore: bench_verified_* = ${benchCount}, learned_* = ${learnedCount}, other = ${otherCount}`);
  console.log('learned_knowledge status breakdown:');
  for (const [k, c] of Object.entries(lkBreakdown)) {
    console.log(`  ${k}: ${c}`);
  }
}

audit().catch(console.error);
