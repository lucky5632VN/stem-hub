/**
 * 🛡️ Script Cấp Quyền Admin Bằng Custom Claims (Strict RBAC by UID)
 * Tuân thủ Security Checklist: Không hardcode email, ghi nhận immutable audit log vào admin_logs
 * 
 * Chế độ mặc định: --dry-run (CHỈ ĐỌC, KHÔNG THAY ĐỔI)
 * Để áp dụng thật: Thêm cờ --execute
 * Yêu cầu an toàn: Mặc định TỪ CHỐI nếu emailVerified = false (cần cờ --allow-unverified kèm cảnh báo)
 * 
 * Cách dùng:
 * node scripts/grant_admin_role.cjs --uid=<TARGET_UID> [--adminUid=<PERFORMED_BY_UID>] [--allow-unverified] [--execute]
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
  if (uid.length <= 6) return '***';
  return uid.slice(0, 3) + '...' + uid.slice(-4);
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

async function main() {
  const args = process.argv.slice(2);
  const uidArg = args.find(a => a.startsWith('--uid='));
  const adminUidArg = args.find(a => a.startsWith('--adminUid='));
  const isExecute = args.includes('--execute');
  const allowUnverified = args.includes('--allow-unverified');

  if (!uidArg) {
    console.log('❌ Lỗi: Cần truyền --uid=<TARGET_UID>');
    console.log('Ví dụ:');
    console.log('  [Dry-run (mặc định)]: node scripts/grant_admin_role.cjs --uid=XYZ12345');
    console.log('  [Thực thi thật]:      node scripts/grant_admin_role.cjs --uid=XYZ12345 --execute');
    process.exit(1);
  }

  const targetUid = uidArg.split('=')[1].trim();
  const adminUid = adminUidArg ? adminUidArg.split('=')[1].trim() : (process.env.ADMIN_UIDS ? process.env.ADMIN_UIDS.split(',')[0].trim() : 'system_admin');

  console.log('========================================================================');
  console.log(`🛡️ CẤP QUYỀN ADMIN RBAC (CUSTOM CLAIMS) - ${isExecute ? '⚡ EXECUTE MODE' : '🔍 DRY-RUN MODE (CHỈ ĐỌC)'}`);
  console.log('========================================================================');
  console.log(`- Target UID (che):   ${maskUid(targetUid)}`);
  console.log(`- Performed By (che): ${maskUid(adminUid)}`);
  console.log(`- Chế độ:             ${isExecute ? 'THỰC THI THẬT (--execute)' : 'MẶC ĐỊNH (DRY-RUN - không sửa đổi gì)'}`);

  // 1. Kiểm tra tài khoản tồn tại trong Firebase Auth
  let userRecord;
  try {
    userRecord = await auth.getUser(targetUid);
    console.log(`✅ Tìm thấy tài khoản Auth: UID ${maskUid(userRecord.uid)} | Email: ${maskEmail(userRecord.email)} | emailVerified: ${userRecord.emailVerified}`);
  } catch (err) {
    console.error(`❌ Không tìm thấy user với UID ${maskUid(targetUid)} trong Firebase Auth:`, err.message);
    process.exit(1);
  }

  // 2. Kiểm tra emailVerified
  if (!userRecord.emailVerified && !allowUnverified) {
    console.error(`\n❌ [BẢO MẬT TỪ CHỐI]: Tài khoản UID ${maskUid(targetUid)} có emailVerified = false!`);
    console.error(`   Quy tắc bảo mật: Không cấp quyền Admin cho tài khoản chưa xác thực email để phòng chống chiếm quyền.`);
    console.error(`   Nếu muốn ghi đè khẩn cấp trong môi trường thử nghiệm, hãy truyền thêm cờ --allow-unverified.`);
    process.exit(1);
  }

  if (!userRecord.emailVerified && allowUnverified) {
    console.warn(`\n⚠️ [CẢNH BÁO NGUY HIỂM]: Đang cho phép cấp quyền Admin cho tài khoản CHƯA XÁC THỰC EMAIL (--allow-unverified)!`);
  }

  const existingClaims = userRecord.customClaims || {};
  console.log(`- Custom Claims hiện tại:`, JSON.stringify(existingClaims));

  const newClaims = {
    ...existingClaims,
    admin: true,
    role: 'admin'
  };

  if (!isExecute) {
    console.log('\n[DRY-RUN] Các hành động SẼ được thực hiện nếu có xác nhận và thêm cờ --execute:');
    console.log(`1. Gán Custom Claims mới cho UID ${maskUid(targetUid)}:`, JSON.stringify(newClaims));
    console.log(`2. Cập nhật Firestore document users/${maskUid(targetUid)} với { role: 'admin', updatedAt: FieldValue.serverTimestamp() }`);
    console.log(`3. Ghi log bất biến vào collection admin_logs:`);
    console.log(`   - action: 'GRANT_ADMIN_ROLE'`);
    console.log(`   - targetUid (che): ${maskUid(targetUid)}`);
    console.log(`   - performedBy (che): ${maskUid(adminUid)}`);
    console.log(`   - previousClaims:`, JSON.stringify(existingClaims));
    console.log(`   - newClaims:`, JSON.stringify(newClaims));
    console.log('\n🛑 KẾT THÚC DRY-RUN: KHÔNG CÓ DỮ LIỆU NÀO BỊ THAY ĐỔI.');
    console.log('👉 Chờ người dùng xác nhận từng UID trước khi chạy --execute.');
    process.exit(0);
  }

  // EXECUTE MODE
  console.log('\n⚡ Đang thực thi gán custom claims...');
  await auth.setCustomUserClaims(targetUid, newClaims);

  // Lấy lại user sau khi gán để in claims thật xác nhận từ Auth
  const verifiedUser = await auth.getUser(targetUid);
  console.log(`✅ Claims thật đã gán (xác nhận từ Firebase Auth):`, JSON.stringify(verifiedUser.customClaims));

  // Cập nhật document Firestore users/{targetUid}
  console.log('⚡ Đang cập nhật Firestore document users/{targetUid}...');
  await db.collection('users').doc(targetUid).set({
    role: 'admin',
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  console.log(`✅ Đã cập nhật document Firestore.`);

  // Ghi nhật ký kiểm toán bất biến vào admin_logs
  console.log('⚡ Đang ghi nhận nhật ký kiểm toán bất biến vào admin_logs...');
  const auditLogRef = await db.collection('admin_logs').add({
    action: 'GRANT_ADMIN_ROLE',
    targetUid: targetUid,
    targetUidMasked: maskUid(targetUid),
    targetEmailMasked: maskEmail(userRecord.email),
    emailVerified: userRecord.emailVerified,
    performedBy: adminUid,
    performedByMasked: maskUid(adminUid),
    previousClaims: existingClaims,
    newClaims: verifiedUser.customClaims,
    timestamp: FieldValue.serverTimestamp(),
    clientIp: 'server-script',
    reason: 'Admin privilege provisioned via secure CLI script'
  });
  console.log(`✅ Đã tạo bản ghi audit log bất biến với Doc ID: ${auditLogRef.id}`);

  console.log('\n🎉 HOÀN THÀNH CẤP QUYỀN ADMIN AN TOÀN.');
}

main().catch(err => {
  console.error('❌ Lỗi ngoại lệ trong quá trình thực thi:', err);
  process.exit(1);
});
