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
  console.log('=== [MỤC 3] TÌM KIẾM BẢN GHI learned_1795425684028_sefy ===\n');

  // 1. Kiểm tra Firestore
  const collSnap = await db.collection('learned_knowledge').get();
  console.log('Tổng số bản ghi trong learned_knowledge:', collSnap.size);

  let targetDoc = null;
  collSnap.docs.forEach(doc => {
    const id = doc.id;
    if (id.includes('1795425684028') || id.includes('sefy')) {
      targetDoc = { id: doc.id, ...doc.data() };
    }
  });

  // 2. Kiểm tra local file
  if (!targetDoc) {
    const localPath = 'src/data/global-learned-knowledge.json';
    if (fs.existsSync(localPath)) {
      const list = JSON.parse(fs.readFileSync(localPath, 'utf8'));
      const found = list.find(item => item.id && (item.id.includes('1795425684028') || item.id.includes('sefy')));
      if (found) targetDoc = { id: found.id, ...found, _source: 'local_json' };
    }
  }

  if (targetDoc) {
    console.log('TÌM THẤY BẢN GHI:');
    console.log('ID:', targetDoc.id);
    console.log('status:', targetDoc.status);
    console.log('teacherVerified:', targetDoc.teacherVerified);
    console.log('isTeacherVerified:', targetDoc.isTeacherVerified);
    console.log('quarantined:', targetDoc.quarantined);
    console.log('sourceType:', targetDoc.sourceType);
    console.log('createdAt:', targetDoc.createdAt || targetDoc.timestamp);
    
    // Người tạo (hash)
    const creator = targetDoc.creator || targetDoc.reviewerUid || targetDoc.uid || targetDoc.clientId || 'anonymous';
    const creatorHash = crypto.createHash('sha256').update(String(creator)).digest('hex').slice(0, 12);
    console.log('người tạo (hash 12 hex):', creatorHash);

    const q = targetDoc.query || targetDoc.question || '';
    const a = targetDoc.answer || targetDoc.content || '';
    console.log('câu hỏi rút gọn:', q.slice(0, 80));
    console.log('đáp án rút gọn:', a.slice(0, 100));
  } else {
    console.log('Không tìm thấy ID chính xác learned_1795425684028_sefy trong Firestore hoặc global-learned-knowledge.json.');
    console.log('Danh sách các ID có chứa learned_1795*:');
    collSnap.docs.filter(d => d.id.startsWith('learned_1795')).forEach(d => console.log(' - ', d.id));
  }
}

main().then(() => process.exit(0)).catch(console.error);

