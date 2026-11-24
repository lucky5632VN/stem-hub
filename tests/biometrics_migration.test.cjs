const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const assert = require('assert');
const { runBiometricMigration } = require('../scripts/migrate_face_biometrics.cjs');

async function testMigration() {
  console.log('🧪 === BẮT ĐẦU TEST SCRIPT MIGRATION DỮ LIỆU SINH TRẮC HỌC ===\n');
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  const testEnv = await initializeTestEnvironment({
    projectId: 'stem-hub-43e96',
    firestore: {
      rules: rules,
      host: '127.0.0.1',
      port: 8080
    }
  });

  const mock128D = new Array(128).fill(0.555555);

  // 1. Tạo 2 user cũ chứa faceDescriptor ở root và trong personalization
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await db.collection('users').doc('user_old_1').set({
      displayName: 'Học sinh Cũ 1',
      faceDescriptor: mock128D,
      role: 'student'
    });

    await db.collection('users').doc('user_old_2').set({
      displayName: 'Học sinh Cũ 2',
      personalization: {
        faceDescriptor: mock128D,
        crystals: 500
      },
      role: 'student'
    });

    await db.collection('users').doc('user_clean_3').set({
      displayName: 'Học sinh Không Dùng Face',
      role: 'student'
    });
  });

  // 2. Chạy migration bên trong context quản trị
  let result;
  await testEnv.withSecurityRulesDisabled(async (context) => {
    result = await runBiometricMigration(context.firestore());
  });

  assert.strictEqual(result.totalScanned, 3, 'Tổng số quét phải là 3 user');
  assert.strictEqual(result.migratedCount, 2, 'Số lượng migrated phải là 2');
  assert.strictEqual(result.cleanedCount, 2, 'Số lượng cleaned phải là 2');

  // 3. Kiểm tra user 1
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const u1 = (await db.collection('users').doc('user_old_1').get()).data();
    assert.strictEqual(u1.faceDescriptor, undefined, 'Trường faceDescriptor cũ phải bị xóa');

    const u1Bio = (await db.collection('users').doc('user_old_1').collection('private').doc('biometrics').get()).data();
    assert.ok(u1Bio, 'Subcollection private/biometrics phải tồn tại');
    assert.strictEqual(u1Bio.faceDescriptor.length, 128, 'Vector 128-D phải được chuyển');

    const u2 = (await db.collection('users').doc('user_old_2').get()).data();
    assert.strictEqual(u2.personalization?.faceDescriptor, undefined, 'Trường personalization.faceDescriptor cũ phải bị xóa');
    assert.strictEqual(u2.personalization?.crystals, 500, 'Các trường khác trong personalization không bị ảnh hưởng');

    const u2Bio = (await db.collection('users').doc('user_old_2').collection('private').doc('biometrics').get()).data();
    assert.ok(u2Bio, 'Subcollection private/biometrics user 2 phải tồn tại');
    assert.strictEqual(u2Bio.faceDescriptor.length, 128);
  });

  await testEnv.cleanup();
  console.log('✅ [PASS] Tất cả các bước di chuyển và dọn dẹp dữ liệu sinh trắc học thành công!');
}

testMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ [FAIL]:', err);
    process.exit(1);
  });
