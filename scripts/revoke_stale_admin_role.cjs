/**
 * 🛡️ Script Thu Hồi Quyền Admin Cũ / Tài Khoản Rác (Revoke Stale Admin Role)
 * 
 * Chế độ mặc định: --dry-run (CHỈ ĐỌC, KHÔNG THAY ĐỔI)
 * Để áp dụng thật: Thêm cờ --execute
 * 
 * Cách dùng:
 * node scripts/revoke_stale_admin_role.cjs --uid=<TARGET_UID> [--adminUid=<PERFORMED_BY_UID>] [--execute]
 * Hoặc quét toàn bộ tài khoản có role admin:
 * node scripts/revoke_stale_admin_role.cjs --scan [--execute]
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

function maskEmail(email) {
  if (!email || typeof email !== 'string') return 'N/A';
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? name.slice(0, 2) + '***' : name.slice(0, 1) + '***';
  return `${maskedName}@${domain}`;
}

async function revokeSingleUid(targetUid, adminUid, isExecute) {
  console.log(`\n--- Kiểm tra tài khoản UID: ${maskUid(targetUid)} ---`);
  let userRecord = null;
  try {
    userRecord = await auth.getUser(targetUid);
    console.log(`- Firebase Auth: Tồn tại (Email: ${maskEmail(userRecord.email)}, EmailVerified: ${userRecord.emailVerified})`);
  } catch (err) {
    console.log(`- Firebase Auth: Không tìm thấy tài khoản (${err.code})`);
  }

  const userDocRef = db.collection('users').doc(targetUid);
  const userDocSnap = await userDocRef.get();
  const docData = userDocSnap.exists ? userDocSnap.data() : null;
  console.log(`- Firestore document users/${maskUid(targetUid)}: ${userDocSnap.exists ? `Tồn tại (role: ${docData.role || 'none'})` : 'Không tồn tại'}`);

  const currentClaims = userRecord ? (userRecord.customClaims || {}) : {};
  const cleanedClaims = { ...currentClaims };
  delete cleanedClaims.admin;
  if (cleanedClaims.role === 'admin') delete cleanedClaims.role;

  console.log(`- Claims hiện tại:`, JSON.stringify(currentClaims));
  console.log(`- Claims sau khi thu hồi:`, JSON.stringify(cleanedClaims));

  if (!isExecute) {
    console.log(`  [DRY-RUN] Sẽ xóa claims admin và xóa role:'admin' trong Firestore document.`);
    return;
  }

  // Thực thi thật
  if (userRecord) {
    await auth.setCustomUserClaims(targetUid, cleanedClaims);
    console.log(`  ✅ Đã cập nhật Custom Claims trong Firebase Auth.`);
  }

  if (userDocSnap.exists && docData.role === 'admin') {
    await userDocRef.update({
      role: FieldValue.delete(),
      revokedAdminAt: FieldValue.serverTimestamp()
    });
    console.log(`  ✅ Đã xóa trường role:'admin' trong Firestore document.`);
  }

  // Ghi log bất biến
  await db.collection('admin_logs').add({
    action: 'REVOKE_STALE_ADMIN_ROLE',
    targetUid: targetUid,
    targetEmailMasked: userRecord ? maskEmail(userRecord.email) : 'N/A',
    performedBy: adminUid,
    previousClaims: currentClaims,
    newClaims: cleanedClaims,
    timestamp: FieldValue.serverTimestamp(),
    reason: 'Stale / unverified admin role revoked by security protocol'
  });
  console.log(`  ✅ Đã ghi nhận audit log vào admin_logs.`);
}

async function main() {
  const args = process.argv.slice(2);
  const uidArg = args.find(a => a.startsWith('--uid='));
  const scanArg = args.includes('--scan');
  const adminUidArg = args.find(a => a.startsWith('--adminUid='));
  const isExecute = args.includes('--execute');

  const adminUid = adminUidArg ? adminUidArg.split('=')[1].trim() : (process.env.ADMIN_UIDS ? process.env.ADMIN_UIDS.split(',')[0].trim() : 'system_admin');

  console.log('========================================================================');
  console.log(`🛡️ THU HỒI QUYỀN ADMIN (REVOKE STALE ADMIN) - ${isExecute ? '⚡ EXECUTE MODE' : '🔍 DRY-RUN MODE (CHỈ ĐỌC)'}`);
  console.log('========================================================================');

  if (uidArg) {
    const targetUid = uidArg.split('=')[1].trim();
    await revokeSingleUid(targetUid, adminUid, isExecute);
  } else if (scanArg) {
    console.log('🔍 Đang quét Firestore collection "users" tìm các tài khoản có role == "admin"...');
    const snapshot = await db.collection('users').where('role', '==', 'admin').get();
    console.log(`📊 Tìm thấy ${snapshot.size} tài khoản có role == 'admin' trong Firestore.`);

    for (const doc of snapshot.docs) {
      await revokeSingleUid(doc.id, adminUid, isExecute);
    }
  } else {
    console.log('❌ Lỗi: Cần truyền --uid=<STALE_UID> hoặc --scan');
    console.log('Ví dụ:');
    console.log('  node scripts/revoke_stale_admin_role.cjs --uid=XYZ12345');
    console.log('  node scripts/revoke_stale_admin_role.cjs --scan');
    console.log('  node scripts/revoke_stale_admin_role.cjs --scan --execute');
    process.exit(1);
  }

  if (!isExecute) {
    console.log('\n🛑 KẾT THÚC DRY-RUN: KHÔNG CÓ DỮ LIỆU NÀO BỊ THAY ĐỔI.');
    console.log('👉 Chờ xác nhận UID admin thật trước khi chạy với --execute.');
  } else {
    console.log('\n🎉 ĐÃ THỰC THI HOÀN TẤT THU HỒI.');
  }
}

main().catch(err => {
  console.error('❌ Lỗi ngoại lệ trong quá trình thực thi:', err);
  process.exit(1);
});

