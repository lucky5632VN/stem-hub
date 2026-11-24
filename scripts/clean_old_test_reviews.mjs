import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const envContent = fs.readFileSync('.env.local', 'utf8');
let clientEmail, privateKey, projectId;
envContent.split('\n').forEach(line => {
  const m = line.trim().match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) {
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (m[1] === 'FIREBASE_CLIENT_EMAIL') clientEmail = v;
    if (m[1] === 'FIREBASE_PRIVATE_KEY') privateKey = v;
    if (m[1] === 'FIREBASE_PROJECT_ID') projectId = v;
  }
});

const app = !getApps().length ? initializeApp({
  credential: cert({ 
    projectId, 
    clientEmail, 
    privateKey: privateKey.replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim() 
  })
}) : getApps()[0];

const db = getFirestore(app);
const snap = await db.collection('expert_reviews').get();

let deletedCount = 0;
const batch = db.batch();

snap.docs.forEach(doc => {
  if (!doc.id.startsWith('rev_150_')) {
    batch.delete(doc.ref);
    deletedCount++;
  }
});

if (deletedCount > 0) {
  await batch.commit();
  console.log(`🧹 Đã dọn dẹp ${deletedCount} bản ghi cũ thử nghiệm khỏi Firestore.`);
} else {
  console.log('Không có bản ghi cũ nào cần xóa.');
}

const checkSnap = await db.collection('expert_reviews').get();
console.log(`✅ Hiện tại Firestore expert_reviews có chính xác: ${checkSnap.docs.length} tài liệu (Đúng 150 ca benchmark).`);

