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
const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey: privateKey.replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim() }) });
const db = getFirestore(app);
const snap = await db.collection('expert_reviews').get();

const list = snap.docs.map(d => d.data());
console.log(`Đã đọc ${list.length} tài liệu từ Firestore.`);

const localFile = path.resolve('reports/ablation/expert_reviews_local.json');
fs.writeFileSync(localFile, JSON.stringify(list, null, 2), 'utf8');
console.log(`Đã cập nhật tệp local: ${localFile} với chính xác ${list.length} bản ghi.`);

