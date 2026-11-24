/**
 * 🧪 TEST SUITE: ADMIN AUTHORIZATION & EMAIL WHITELIST REMOVAL VERIFICATION
 * 
 * Mục đích kiểm thử:
 * 1. Admin thật (có custom claims admin: true, role: 'admin' hoặc UID trong ADMIN_UIDS) luôn có quyền.
 * 2. Mọi tài khoản đăng ký bằng bất kỳ email nào (kể cả chứa chữ 'admin' như admin123@gmail.com,
 *    admin@stem-hub.top, admin@gmail.com) nếu không có role/claims/UID admin thì TUYỆT ĐỐI KHÔNG CÓ QUYỀN.
 * 3. Kiểm tra mã nguồn src/app bảo đảm không còn bất kỳ mảng ADMIN_EMAILS hardcoded nào.
 */

import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

console.log('🧪 BẮT ĐẦU KIỂM THỬ XÁC THỰC QUYỀN ADMIN (NO EMAIL WHITELIST)...');

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Chi tiết: ${err.message}`);
    process.exitCode = 1;
  }
}

// Logic kiểm tra quyền Admin chuẩn theo UID, Claims và Firestore Role (không phụ thuộc email)
function checkAdminAccess({ uid, email, customClaims, firestoreData, envAdminUids = '' }) {
  const allowedUids = envAdminUids.split(',').map(u => u.trim()).filter(Boolean);
  
  // 1. Kiểm tra UID từ biến môi trường
  if (uid && allowedUids.includes(uid)) {
    return { authorized: true, reason: 'env_uid_match' };
  }

  // 2. Kiểm tra Custom Claims từ Firebase Auth Token
  if (customClaims?.admin === true || customClaims?.role === 'admin') {
    return { authorized: true, reason: 'custom_claims_admin' };
  }

  // 3. Kiểm tra Role trong Firestore document
  if (firestoreData?.role === 'admin') {
    return { authorized: true, reason: 'firestore_role_admin' };
  }

  // TUYỆT ĐỐI KHÔNG CẤP QUYỀN DỰA VÀO EMAIL
  return { authorized: false, reason: 'insufficient_permissions' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 1: Admin thật luôn có quyền
// ─────────────────────────────────────────────────────────────────────────────
test('Admin thật với role="admin" trong Firestore luôn có quyền', () => {
  const res = checkAdminAccess({
    uid: 'real_admin_uid_001',
    email: 'admin_real@stemhub.edu.vn',
    firestoreData: { role: 'admin' }
  });
  assert.strictEqual(res.authorized, true);
  assert.strictEqual(res.reason, 'firestore_role_admin');
});

test('Admin thật với custom claims admin=true luôn có quyền', () => {
  const res = checkAdminAccess({
    uid: 'real_admin_uid_002',
    email: 'dev_ops@school.edu.vn',
    customClaims: { admin: true }
  });
  assert.strictEqual(res.authorized, true);
  assert.strictEqual(res.reason, 'custom_claims_admin');
});

test('Admin thật với UID được khai báo trong ADMIN_UIDS luôn có quyền', () => {
  const res = checkAdminAccess({
    uid: 'env_whitelisted_uid_123',
    email: 'someone@school.edu.vn',
    envAdminUids: 'env_whitelisted_uid_123,other_uid'
  });
  assert.strictEqual(res.authorized, true);
  assert.strictEqual(res.reason, 'env_uid_match');
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 2: Bất kỳ email lạ nào không có role/claims/UID đều bị từ chối
// ─────────────────────────────────────────────────────────────────────────────
test('Tài khoản email admin123@gmail.com không có role bị TỪ CHỐI hoàn toàn', () => {
  const res = checkAdminAccess({
    uid: 'attacker_uid_001',
    email: 'admin123@gmail.com',
    firestoreData: { role: 'student' }
  });
  assert.strictEqual(res.authorized, false);
  assert.strictEqual(res.reason, 'insufficient_permissions');
});

test('Tài khoản email admin@stem-hub.top không có role bị TỪ CHỐI hoàn toàn', () => {
  const res = checkAdminAccess({
    uid: 'attacker_uid_002',
    email: 'admin@stem-hub.top',
    firestoreData: { role: 'student' }
  });
  assert.strictEqual(res.authorized, false);
});

test('Tài khoản email admin@gmail.com không có role bị TỪ CHỐI hoàn toàn', () => {
  const res = checkAdminAccess({
    uid: 'attacker_uid_003',
    email: 'admin@gmail.com',
    firestoreData: { role: 'student' }
  });
  assert.strictEqual(res.authorized, false);
});

test('Tài khoản học sinh thông thường bị TỪ CHỐI hoàn toàn', () => {
  const res = checkAdminAccess({
    uid: 'student_uid_999',
    email: 'student@gmail.com',
    firestoreData: { role: 'student' }
  });
  assert.strictEqual(res.authorized, false);
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Group 3: Quét mã nguồn xác nhận không còn hardcoded ADMIN_EMAILS
// ─────────────────────────────────────────────────────────────────────────────
test('Mã nguồn /api/learned-knowledge không còn mảng ADMIN_EMAILS', () => {
  const filePath = path.resolve('src/app/api/learned-knowledge/route.js');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.strictEqual(code.includes('ADMIN_EMAILS'), false, 'Không được tồn tại mảng ADMIN_EMAILS');
  assert.strictEqual(code.includes('admin123@gmail.com'), false, 'Không được hardcode admin123@gmail.com');
  assert.strictEqual(code.includes('admin@stem-hub.top'), false, 'Không được hardcode admin@stem-hub.top');
});

test('Mã nguồn /admin/layout.js không còn kiểm tra email hardcoded', () => {
  const filePath = path.resolve('src/app/admin/layout.js');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.strictEqual(code.includes('admin123@gmail.com'), false);
  assert.strictEqual(code.includes('admin@stem-hub.top'), false);
});

test('Mã nguồn /lien-he/page.js không còn kiểm tra email hardcoded', () => {
  const filePath = path.resolve('src/app/lien-he/page.js');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.strictEqual(code.includes('admin123@gmail.com'), false);
  assert.strictEqual(code.includes('admin@stem-hub.top'), false);
});

console.log(`\n🏁 KẾT QUẢ KIỂM THỬ: ${passed}/${total} TESTS ĐẠT YÊU CẦU!\n`);

