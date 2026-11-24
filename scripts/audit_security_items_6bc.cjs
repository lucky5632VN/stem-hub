const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const envLocalPath = path.resolve('.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const regex = /^\s*([A-Za-z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^#\r\n]*))/gm;
  let m;
  while ((m = regex.exec(envContent)) !== null) {
    const key = m[1];
    let val = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[4]);
    if (val !== undefined && !process.env[key]) {
      process.env[key] = val.trim();
    }
  }
}

let rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
let cleanKey = rawKey.replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim();
const lines = cleanKey.split('\n').map(l => l.trim()).filter(Boolean);
let normalizedPem = cleanKey;
try {
  const b64 = lines.slice(1, -1).join('');
  const buf = Buffer.from(b64, 'base64');
  const k = crypto.createPrivateKey({ key: buf, format: 'der', type: 'pkcs8' });
  normalizedPem = k.export({ type: 'pkcs8', format: 'pem' });
} catch (e) {}

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID || 'stem-hub-43e96',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: normalizedPem
  })
});
const db = getFirestore(app);
const auth = getAuth(app);

function maskUid(uid) {
  if (!uid || uid.length < 8) return '***';
  return uid.slice(0, 4) + '***' + uid.slice(-4);
}

async function runSecurityAudit() {
  console.log('🔍 [6.b] LIỆT KÊ USERS CÓ ROLE ADMIN HOẶC TEACHER & CUSTOM CLAIMS:\n');
  
  // 1. Quét users collection
  const usersSnap = await db.collection('users').get();
  const privilegedUsers = [];
  
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const role = data.role;
    if (role === 'admin' || role === 'teacher' || data.reviewerType === 'teacher') {
      privilegedUsers.push({
        uid: doc.id,
        role: role || 'N/A',
        reviewerType: data.reviewerType || 'N/A',
        createdAt: data.createdAt || 'N/A'
      });
    }
  }

  // 2. Kiểm tra Custom Claims qua Firebase Auth cho các user này và toàn bộ user
  const listUsersResult = await auth.listUsers(100);
  const authUsersWithClaims = [];
  for (const userRecord of listUsersResult.users) {
    const claims = userRecord.customClaims || {};
    if (claims.admin || claims.role === 'admin' || claims.teacher || claims.role === 'teacher' || claims.reviewerType === 'teacher') {
      authUsersWithClaims.push({
        uid: userRecord.uid,
        email: userRecord.email,
        claims: claims
      });
    }
  }

  console.log(`- Số user trong Firestore có role admin/teacher: ${privilegedUsers.length}`);
  privilegedUsers.forEach(u => {
    console.log(`  * UID: ${maskUid(u.uid)} | Role: ${u.role} | ReviewerType: ${u.reviewerType} | Created: ${u.createdAt}`);
  });

  console.log(`\n- Số user trong Firebase Auth có Custom Claims admin/teacher: ${authUsersWithClaims.length}`);
  authUsersWithClaims.forEach(u => {
    console.log(`  * UID: ${maskUid(u.uid)} | Claims: ${JSON.stringify(u.claims)}`);
  });

  console.log('\n────────────────────────────────────────────────────────────────────────');
  console.log('🔍 [6.c] KIỂM TRA TRƯỜNG LƯU UID NGƯỜI GHI TRONG CÁC COLLECTION LỚN:\n');

  // UID của hai tài khoản whitelist cũ:
  // admin123@gmail.com -> 4ESyFeGhWTbU1fxt3So13DRAQE82
  // admin@gmail.com -> 3iCIgP75Yrf0RrnTeqYx20x7ZCr2
  const targetUids = new Set([
    '4ESyFeGhWTbU1fxt3So13DRAQE82',
    '3iCIgP75Yrf0RrnTeqYx20x7ZCr2'
  ]);

  const collectionsToCheck = ['exams', 'questions', 'match_rooms', 'moments', 'stories', 'tournaments'];

  for (const colName of collectionsToCheck) {
    const colRef = db.collection(colName);
    const snap = await colRef.get();
    if (snap.empty) {
      console.log(`Collection [${colName}]: Rỗng (0 documents).`);
      continue;
    }
    
    // Kiểm tra các tài liệu đầu tiên để tìm các trường lưu UID người tạo/sửa
    const sampleDocs = snap.docs.slice(0, 10);
    const writerFields = new Set();
    const candidateFieldNames = ['uid', 'userId', 'createdBy', 'authorId', 'ownerUid', 'lastModifiedBy', 'updatedBy', 'creatorUid'];
    
    sampleDocs.forEach(d => {
      const data = d.data();
      candidateFieldNames.forEach(f => {
        if (data[f] !== undefined) writerFields.add(f);
      });
    });

    if (writerFields.size === 0) {
      console.log(`Collection [${colName}] (${snap.size} docs):`);
      console.log(`  ⚠️ KHÔNG CÓ TRƯỜNG NÀO lưu UID người ghi (Đã quét các trường: ${candidateFieldNames.join(', ')}).`);
    } else {
      console.log(`Collection [${colName}] (${snap.size} docs):`);
      console.log(`  * Các trường lưu UID phát hiện: [${Array.from(writerFields).join(', ')}]`);
      
      let matchCount = 0;
      snap.docs.forEach(d => {
        const data = d.data();
        for (const f of writerFields) {
          if (targetUids.has(data[f])) {
            matchCount++;
            break;
          }
        }
      });
      console.log(`  * Số bản ghi do 2 tài khoản whitelist cũ ghi: ${matchCount}`);
    }
  }
}

runSecurityAudit().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});

