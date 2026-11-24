/**
 * scripts/migrate_face_biometrics.cjs
 * 
 * Script di chuyển dữ liệu sinh trắc học khuôn mặt:
 * 1. Đọc dữ liệu `faceDescriptor` cũ từ `users/{uid}` (gốc hoặc trong `personalization`).
 * 2. Ghi sang subcollection riêng tư bảo mật cao `users/{uid}/private/biometrics`.
 * 3. Xóa vĩnh viễn trường `faceDescriptor` khỏi tài liệu `users/{uid}` gốc.
 * 4. Báo cáo số lượng bản ghi đã di chuyển và xóa.
 */

const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

async function getAdminApp() {
  if (admin.getApps().length > 0) return admin.getApp();
  
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return admin.initializeApp({ projectId: 'stem-hub-43e96' });
  }

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (saJson) {
    try {
      return admin.initializeApp({ credential: admin.credential.cert(JSON.parse(saJson)) });
    } catch (_) {}
  }

  return admin.initializeApp({ projectId: 'stem-hub-43e96' });
}

async function runBiometricMigration(customDb = null) {
  const app = await getAdminApp();
  const db = customDb || getFirestore(app);
  console.log('🔄 === BẮT ĐẦU MIGRATION DỮ LIỆU SINH TRẮC HỌC SANG SUBCOLLECTION RIÊNG TƯ ===');

  const usersSnap = await db.collection('users').get();
  console.log(`📋 Tổng số tài khoản người dùng quét được: ${usersSnap.size}`);

  let migratedCount = 0;
  let cleanedCount = 0;

  const deleteSentinel = (() => {
    try {
      // Nếu là Client SDK từ rules-unit-testing
      if (customDb && (customDb._delegate || customDb.type === 'firestore' || customDb._databaseId)) {
        const { deleteField } = require('firebase/firestore');
        return deleteField();
      }
    } catch (_) {}
    return FieldValue.delete();
  })();

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const uid = userDoc.id;
    const oldDescriptor = data.faceDescriptor || data.personalization?.faceDescriptor;

    if (oldDescriptor && Array.isArray(oldDescriptor) && oldDescriptor.length > 0) {
      console.log(`  -> Tìm thấy vector khuôn mặt cũ tại user ${uid} (độ dài ${oldDescriptor.length}-D)`);

      // 1. Ghi sang subcollection riêng tư users/{uid}/private/biometrics
      const privateBiometricRef = db.collection('users').doc(uid).collection('private').doc('biometrics');
      await privateBiometricRef.set({
        faceDescriptor: oldDescriptor,
        migratedAt: new Date().toISOString(),
        model: '@vladmandic/face-api@1.7.12 (ResNet-34 FaceNet 128-D)',
        source: 'migrated_from_root'
      }, { merge: true });
      migratedCount++;

      // 2. Xóa trường cũ khỏi users/{uid} gốc
      const deletePayload = {};
      if ('faceDescriptor' in data) {
        deletePayload.faceDescriptor = deleteSentinel;
      }
      if (data.personalization && 'faceDescriptor' in data.personalization) {
        deletePayload['personalization.faceDescriptor'] = deleteSentinel;
      }

      if (Object.keys(deletePayload).length > 0) {
        await userDoc.ref.update(deletePayload);
        cleanedCount++;
      }
    }
  }

  console.log(`\n📊 KẾT QUẢ MIGRATION:`);
  console.log(`  - Số bản ghi đã chuyển sang users/{uid}/private/biometrics: ${migratedCount}`);
  console.log(`  - Số bản ghi đã xóa trường cũ trên users/{uid}: ${cleanedCount}`);
  console.log('========================================================================\n');

  return { totalScanned: usersSnap.size, migratedCount, cleanedCount };
}

if (require.main === module) {
  runBiometricMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Lỗi khi chạy migration:', err);
      process.exit(1);
    });
}

module.exports = { runBiometricMigration };
