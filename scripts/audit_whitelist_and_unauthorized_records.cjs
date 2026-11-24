/**
 * 🛡️ Security Audit: Read-Only Whitelist Accounts & Unauthorized Admin Document Scanner
 * Priority #1 - Read-Only inspection of Firebase Auth & Firestore
 * Outputs strictly masked UIDs and counts. Zero sensitive exposure.
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Load environment from .env.local
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

let app;
if (!getApps().length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.resolve('serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    app = initializeApp({ credential: cert(serviceAccount) });
  } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    let cleanKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim();
    const crypto = require('crypto');
    let normalizedPem = cleanKey;
    try {
      const lines = cleanKey.split('\n').map(l => l.trim()).filter(Boolean);
      const b64 = lines.slice(1, -1).join('');
      const buf = Buffer.from(b64, 'base64');
      const k = crypto.createPrivateKey({ key: buf, format: 'der', type: 'pkcs8' });
      normalizedPem = k.export({ type: 'pkcs8', format: 'pem' });
    } catch (e) {}

    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'cuoc-thi-ai-e2044',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: normalizedPem
      })
    });
  } else {
    // If running in local emulator mode
    app = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cuoc-thi-ai-e2044'
    });
  }
}

const auth = getAuth(app);
const db = getFirestore(app);

function maskUid(uid) {
  if (!uid || typeof uid !== 'string') return 'N/A';
  if (uid.length <= 8) return uid.slice(0, 2) + '***' + uid.slice(-2);
  return uid.slice(0, 4) + '***' + uid.slice(-4);
}

const TARGET_EMAILS = [
  'admin123@gmail.com',
  'admin@gmail.com',
  'admin@stemhub.edu.vn',
  'admin@stem-hub.top'
];

async function runAudit() {
  console.log('========================================================================');
  console.log('🔍 BẢO MẬT: BÁO CÁO RÀ SOÁT TÀI KHOẢN WHITELIST CŨ & DỮ LIỆU PHÂN QUYỀN');
  console.log('========================================================================\n');

  // 1. Kiểm tra tài khoản Firebase Auth
  console.log('--- 1. TÌNH TRẠNG CÁC EMAIL WHITELIST CŨ TRÊN FIREBASE AUTH ---');
  for (const email of TARGET_EMAILS) {
    try {
      const user = await auth.getUserByEmail(email);
      console.log(`Email: ${email}`);
      console.log(`  * UID (che):          ${maskUid(user.uid)}`);
      console.log(`  * emailVerified:      ${user.emailVerified}`);
      console.log(`  * providerId:         ${user.providerData.map(p => p.providerId).join(', ') || 'password'}`);
      console.log(`  * createdAt:          ${user.metadata.creationTime}`);
      console.log(`  * lastSignInTime:     ${user.metadata.lastSignInTime || 'Chưa đăng nhập'}`);
      console.log(`  * customClaims:       ${JSON.stringify(user.customClaims || {})}`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        console.log(`Email: ${email} -> [KHÔNG TỒN TẠI trên Firebase Auth]`);
      } else {
        console.log(`Email: ${email} -> Lỗi kiểm tra: ${err.message}`);
      }
    }
  }

  // 2. Lấy danh sách UID admin hợp lệ (từ ADMIN_UIDS biến môi trường + users collection có role='admin')
  const envAdminUids = (process.env.ADMIN_UIDS || '').split(',').map(u => u.trim()).filter(Boolean);
  const validAdminUids = new Set(envAdminUids);

  try {
    const adminUsersSnap = await db.collection('users').where('role', '==', 'admin').get();
    adminUsersSnap.docs.forEach(d => validAdminUids.add(d.id));
  } catch (err) {
    console.warn('Lỗi đọc role=admin từ users:', err.message);
  }

  console.log(`\nTổng số UID Admin hợp lệ được xác định: ${validAdminUids.size}`);

  // 3. Quét các collection nhạy cảm: admin_logs, learned_knowledge, config, system_config
  const collectionsToAudit = ['admin_logs', 'learned_knowledge', 'config', 'system_config'];
  console.log('\n--- 2. RÀ SOÁT CÁC BẢN GHI ĐƯỢC GHI BỞI UID NGOÀI DANH SÁCH ADMIN HỢP LỆ ---');

  for (const colName of collectionsToAudit) {
    try {
      const snap = await db.collection(colName).get();
      let totalRecords = snap.size;
      let unauthorizedRecords = [];

      snap.docs.forEach(docSnap => {
        const d = docSnap.data();
        const authorUid = d.userId || d.uid || d.authorId || d.adminUid || d.reviewerUid || d.createdBy || d.updatedBy;
        if (authorUid && !validAdminUids.has(authorUid)) {
          unauthorizedRecords.push({
            docId: docSnap.id,
            authorUid: maskUid(authorUid),
            createdAt: d.createdAt || d.timestamp || 'N/A'
          });
        }
      });

      console.log(`Collection: [${colName}] - Tổng số bản ghi: ${totalRecords}`);
      if (unauthorizedRecords.length === 0) {
        console.log(`  ✅ Không có bản ghi nào do UID ngoài danh sách admin hợp lệ tạo/sửa (0 vi phạm).`);
      } else {
        console.log(`  ⚠️ Phát hiện ${unauthorizedRecords.length} bản ghi do UID không thuộc admin hợp lệ:`);
        unauthorizedRecords.forEach(r => {
          console.log(`     - Doc ID: ${r.docId} | UID: ${r.authorUid} | Thời điểm: ${r.createdAt}`);
        });
      }
    } catch (err) {
      console.log(`Collection: [${colName}] -> Lỗi truy cập: ${err.message}`);
    }
  }

  console.log('\n========================================================================');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

