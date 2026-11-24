import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

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
  console.log('=== CHI TIẾT CÁC BẢN GHI LEARNED_1795* TRONG FIRESTORE ===\n');
  const ids = [
    'learned_1795420595828_ecmm',
    'learned_1795423314502_yxow',
    'learned_1795423382164_byj6',
    'learned_1795425651461_d1l4'
  ];

  for (const id of ids) {
    const docSnap = await db.collection('learned_knowledge').doc(id).get();
    if (docSnap.exists) {
      const data = docSnap.data();
      const creator = data.creator || data.reviewerUid || data.uid || data.clientId || 'anonymous';
      const creatorHash = crypto.createHash('sha256').update(String(creator)).digest('hex').slice(0, 12);
      console.log(`--- [ID: ${id}] ---`);
      console.log('status:', data.status);
      console.log('teacherVerified:', data.teacherVerified);
      console.log('isTeacherVerified:', data.isTeacherVerified);
      console.log('quarantined:', data.quarantined);
      console.log('sourceType:', data.sourceType);
      console.log('createdAt:', data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null);
      console.log('người tạo (hash 12 hex):', creatorHash);
      console.log('câu hỏi rút gọn:', (data.query || data.question || '').slice(0, 80));
      console.log('đáp án rút gọn:', (data.answer || data.content || '').slice(0, 100));
      console.log('');
    }
  }

  // Tìm trong reasoning_logs quanh thời điểm 1795425684028 (16:21:24 23/11/2026)
  console.log('=== TÌM TRONG reasoning_logs GẦN 16:21:24 ===');
  const logsSnap = await db.collection('reasoning_logs')
    .orderBy('timestamp', 'desc')
    .limit(20)
    .get();
  
  logsSnap.docs.forEach(d => {
    const data = d.data();
    const time = data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate().toISOString() : data.timestamp) : data.createdAt;
    console.log(`[Log ${d.id}] time: ${time} | query: ${data.query?.slice(0, 50)} | ragTopic: ${data.ragTopTopic} | intent: ${data.intent}`);
  });
}

main().then(() => process.exit(0)).catch(console.error);

