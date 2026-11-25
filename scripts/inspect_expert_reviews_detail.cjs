const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const envLocalPath = path.resolve('.env.local');
let clientEmail, privateKey, projectId;
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const m = line.trim().match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (m) {
      let [_, k, v] = m;
      v = v.replace(/^['"]|['"]$/g, '').trim();
      if (k === 'FIREBASE_CLIENT_EMAIL') clientEmail = v;
      if (k === 'FIREBASE_PRIVATE_KEY') privateKey = v.replace(/\\n/g, '\n');
      if (k === 'FIREBASE_PROJECT_ID') projectId = v;
    }
  }
}

const app = !getApps().length
  ? initializeApp({
      credential: cert({
        projectId: projectId || 'cuoc-thi-ai-e2044',
        clientEmail,
        privateKey
      })
    })
  : getApps()[0];

const db = getFirestore(app);

async function inspectExpertReviews() {
  const snap = await db.collection('expert_reviews').get();
  console.log(`Total expert_reviews docs in Firestore: ${snap.size}`);

  const rev150Docs = [];
  const admin7jmODocs = [];
  const otherDocs = [];

  snap.forEach(d => {
    const id = d.id;
    const data = d.data();
    const createTime = d.createTime ? d.createTime.toDate().toISOString() : 'N/A';
    const updateTime = d.updateTime ? d.updateTime.toDate().toISOString() : 'N/A';
    const item = { id, data, createTime, updateTime };

    if (id.startsWith('rev_150_')) {
      rev150Docs.push(item);
    } else if (data.reviewerUid === '7jmO1c841eW6p3nQyL4R7smjew1' || (data.reviewerEmail && data.reviewerEmail.includes('ad') && data.reviewerEmail.includes('gmail'))) {
      admin7jmODocs.push(item);
    } else {
      otherDocs.push(item);
    }
  });

  console.log(`- rev_150_* docs: ${rev150Docs.length}`);
  console.log(`- admin 7jmO...mew1 docs: ${admin7jmODocs.length}`);
  console.log(`- other docs: ${otherDocs.length}`);

  console.log('\n--- (a) CHI TIẾT 4 PHIẾU KHÔNG THUỘC rev_150_* ---');
  otherDocs.forEach((doc, idx) => {
    console.log(`[Phiếu ${idx + 1}] ID: ${doc.id}`);
    console.log(`  reviewerUid:   ${doc.data.reviewerUid || 'N/A'}`);
    console.log(`  reviewerEmail: ${doc.data.reviewerEmail || 'N/A'}`);
    console.log(`  sampleId:      ${doc.data.sampleId || doc.data.caseId || doc.data.questionId || 'N/A'}`);
    console.log(`  createTime thật (Firestore metadata): ${doc.createTime}`);
    console.log(`  createdAt ghi trong payload:          ${doc.data.createdAt || 'N/A'}`);
    console.log(`  Scores/Rubric:   ${JSON.stringify(doc.data.scores || doc.data.rubric || doc.data.evaluation || {})}`);
    console.log(`  Ghi chú:         "${(doc.data.notes || doc.data.note || doc.data.comment || doc.data.feedback || '').slice(0, 150)}"`);
    console.log(`  Nguồn trích:     ${doc.data.source || doc.data.sourceType || doc.data.sourceTitle || 'N/A'}`);
    console.log('------------------------------------------------------------');
  });

  // (b) So sánh createTime và createdAt của 150 phiếu rev_150_*
  console.log('\n--- (b) SO SÁNH createTime THẬT VÀ createdAt CỦA 150 PHIẾU rev_150_* ---');
  if (rev150Docs.length > 0) {
    const first = rev150Docs[0];
    const last = rev150Docs[rev150Docs.length - 1];
    console.log(`Phiếu đầu (${first.id}):`);
    console.log(`  createTime thật (Firestore metadata): ${first.createTime}`);
    console.log(`  createdAt ghi trong payload:          ${first.data.createdAt}`);
    console.log(`Phiếu cuối (${last.id}):`);
    console.log(`  createTime thật (Firestore metadata): ${last.createTime}`);
    console.log(`  createdAt ghi trong payload:          ${last.data.createdAt}`);

    // Kiểm tra độ chênh lệch thời gian
    const diffMsFirst = Math.abs(new Date(first.createTime) - new Date(first.data.createdAt));
    console.log(`  Độ chênh lệch giữa createTime thật và createdAt: ${(diffMsFirst / 1000 / 3600).toFixed(1)} giờ`);
  }
}

inspectExpertReviews().catch(console.error);
