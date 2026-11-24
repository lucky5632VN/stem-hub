/**
 * 🎓 Script Cấp Quyền Giáo Viên Thẩm Định Bằng UID (Không Dùng Email)
 * Tuân thủ RBAC & Ghi nhận Audit Log bất biến vào Firestore
 * 
 * Cách dùng:
 * node scripts/grant_teacher_role.cjs --uid=<TEACHER_UID> --subjects=toan,ly --adminUid=<ADMIN_UID>
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

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

async function main() {
  const args = process.argv.slice(2);
  const uidArg = args.find(a => a.startsWith('--uid='));
  const subjectsArg = args.find(a => a.startsWith('--subjects='));
  const adminUidArg = args.find(a => a.startsWith('--adminUid='));

  if (!uidArg) {
    console.log('❌ Lỗi: Cần truyền --uid=<TEACHER_UID>');
    console.log('Ví dụ: node scripts/grant_teacher_role.cjs --uid=XYZ12345 --subjects=toan,ly --adminUid=ADMIN999');
    process.exit(1);
  }

  const targetUid = uidArg.split('=')[1].trim();
  const subjects = subjectsArg ? subjectsArg.split('=')[1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : ['toan'];
  const adminUid = adminUidArg ? adminUidArg.split('=')[1].trim() : (process.env.ADMIN_UIDS ? process.env.ADMIN_UIDS.split(',')[0].trim() : 'system_admin');

  console.log('========================================================================');
  console.log('🎓 TIẾN HÀNH CẤP QUYỀN GIÁO VIÊN THẨM ĐỊNH (TEACHER RBAC BY UID)');
  console.log('========================================================================');
  console.log(`- Target UID (che):   ${maskUid(targetUid)}`);
  console.log(`- Môn được phép chấm: ${subjects.join(', ')}`);
  console.log(`- Admin cấp quyền:    ${maskUid(adminUid)}`);

  // 1. Kiểm tra tài khoản tồn tại trong Firebase Auth
  let userRecord;
  try {
    userRecord = await auth.getUser(targetUid);
    console.log(`✅ Tìm thấy tài khoản Firebase Auth: ${maskUid(userRecord.uid)} (Email: ${userRecord.email ? userRecord.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'Không có'})`);
  } catch (err) {
    console.error(`❌ Không tìm thấy user với UID ${maskUid(targetUid)} trong Firebase Auth:`, err.message);
    process.exit(1);
  }

  // 2. Thiết lập Custom Claims (bảo lưu các quyền hiện có như admin)
  const existingClaims = userRecord.customClaims || {};
  const claims = {
    ...existingClaims,
    role: 'teacher',
    reviewerType: 'teacher',
    subjects: subjects,
    isTeamMember: false
  };

  await auth.setCustomUserClaims(targetUid, claims);
  console.log('✅ Đã cập nhật Custom Claims trên Firebase Auth:', JSON.stringify(claims));

  // 3. Cập nhật tài liệu hồ sơ Firestore
  const userRef = db.collection('users').doc(targetUid);
  await userRef.set({
    role: 'teacher',
    reviewerType: 'teacher',
    subjects: subjects,
    isTeamMember: false,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  console.log('✅ Đã đồng bộ phân quyền vào Firestore users/' + maskUid(targetUid));

  // 4. Ghi Audit Log bất biến vào admin_logs
  const logRef = db.collection('admin_logs').doc();
  await logRef.set({
    action: 'GRANT_TEACHER_ROLE',
    targetUid: targetUid,
    targetEmailMasked: userRecord.email ? userRecord.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'none',
    subjects: subjects,
    reviewerType: 'teacher',
    isTeamMember: false,
    grantedBy: adminUid,
    createdAt: FieldValue.serverTimestamp(),
    auditNote: 'Cấp quyền giáo viên thẩm định chuyên môn độc lập qua script chính thức'
  });
  console.log('✅ Đã ghi nhận Audit Log vào Firestore collection admin_logs (Log ID: ' + logRef.id + ')');
  console.log('========================================================================');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

