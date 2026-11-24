/**
 * 🛡️ RUNBOOK SCRIPT: BIOMETRICS DATA MIGRATION FOR REAL FIRESTORE
 * 
 * ⚠️ QUY TẮC AN TOÀN TUYỆT ĐỐI:
 * 1. Mặc định luôn chạy ở chế độ --dry-run (CHỈ ĐỌC, KHÔNG GHI/XÓA).
 * 2. Chỉ thực thi ghi/xóa khi có cờ --execute tường minh.
 * 3. Tự động lưu bản đồ hoàn tác (Rollback Map) vào reports/ trước khi xóa trường cũ.
 * 4. Cung cấp cờ --rollback=<path> để khôi phục lại trạng thái ban đầu khi cần thiết.
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

console.log('🛡️ === FIRESTORE BIOMETRICS MIGRATION RUNBOOK SCRIPT ===\n');

// 1. Phân tích tham số dòng lệnh
const args = process.argv.slice(2);
const isExecute = args.includes('--execute');
const rollbackArg = args.find(a => a.startsWith('--rollback='));
const isDryRun = !isExecute && !rollbackArg;

if (isDryRun) {
  console.log('🔒 CHẾ ĐỘ MẶC ĐỊNH: --dry-run (CHỈ ĐỌC, KHÔNG THAY ĐỔI DỮ LIỆU THẬT)');
  console.log('   Để thực thi di chuyển thật sau khi đã sao lưu, truyền cờ: --execute\n');
}

// 2. Khởi tạo Firebase Admin (Tự động nạp cấu hình từ .env.local nếu có)
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
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.resolve('serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      app = initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('✅ Đã nạp Service Account Key từ:', serviceAccountPath);
    } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      let rawKey = process.env.FIREBASE_PRIVATE_KEY;
      let cleanKey = rawKey.replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim();
      const lines = cleanKey.split('\n').map(l => l.trim()).filter(Boolean);
      let normalizedPem = cleanKey;
      
      const crypto = require('crypto');
      try {
        // Trích xuất buffer DER base64 để xuất ra chuẩn PEM tương thích OpenSSL 3
        const b64 = lines.slice(1, -1).join('');
        const buf = Buffer.from(b64, 'base64');
        const k = crypto.createPrivateKey({ key: buf, format: 'der', type: 'pkcs8' });
        normalizedPem = k.export({ type: 'pkcs8', format: 'pem' });
      } catch (err) {
        // Fallback giữ nguyên cleanKey
      }

      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'stem-hub-43e96',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: normalizedPem
        })
      });
      console.log('✅ Đã kết nối Firebase Admin SDK với Service Account từ .env.local');
    } else {
      app = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'stem-hub-2026'
      });
      console.log('ℹ️ Sử dụng Application Default Credentials / Project ID.');
    }
  } catch (err) {
    console.warn('⚠️ Lỗi khởi tạo Firebase Admin SDK:', err.message, err.cause || '');
  }
} else {
  app = getApps()[0];
}

const db = getApps().length ? getFirestore(app) : null;

// Hàm quét đệ quy mọi trường có tên chứa "facedescriptor" hoặc "descriptor"
function scanObjectRecursively(obj, prefix = '') {
  const matches = [];
  if (!obj || typeof obj !== 'object') return matches;
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      matches.push(...scanObjectRecursively(item, `${prefix}[${idx}]`));
    });
    return matches;
  }
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('facedescriptor') || lowerKey.includes('descriptor')) {
      matches.push(fullPath);
    }
    if (value && typeof value === 'object') {
      matches.push(...scanObjectRecursively(value, fullPath));
    }
  }
  return matches;
}

async function run() {
  if (!db) {
    console.error('❌ Không thể kết nối Firestore (Thiếu credentials).');
    console.log('📋 Vui lòng thiết lập biến môi trường FIREBASE_SERVICE_ACCOUNT_PATH trước khi chạy.');
    process.exit(1);
  }

  // Chế độ Hoàn tác (Rollback)
  if (rollbackArg) {
    const mapPath = path.resolve(rollbackArg.split('=')[1]);
    console.log(`⏪ ĐANG TIẾN HÀNH HOÀN TÁC TỪ FILE MAP: ${mapPath}`);
    if (!fs.existsSync(mapPath)) {
      console.error('❌ Không tìm thấy file rollback map!');
      process.exit(1);
    }
    const rollbackData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    console.log(`📦 Tìm thấy ${rollbackData.length} bản ghi cần hoàn tác.`);
    let restoredCount = 0;
    for (const item of rollbackData) {
      const userRef = db.collection('users').doc(item.uid);
      await userRef.update({ faceDescriptor: item.faceDescriptor });
      const bioRef = userRef.collection('private').doc('biometrics');
      await bioRef.delete();
      restoredCount++;
      console.log(`   -> Đã hoàn tác cho UID: ${item.uid}`);
    }
    console.log(`\n✅ HOÀN TẤT HOÀN TÁC: Đã phục hồi ${restoredCount} bản ghi về root document.`);
    return;
  }

  console.log('🔍 [1/3] Đang quét ĐỆ QUY collection "users" trên Firestore...');
  const usersSnapshot = await db.collection('users').get();
  console.log(`📊 Tổng số tài khoản users quét được: ${usersSnapshot.size}`);

  const userPathCounts = {};
  let usersWithRootDescriptor = 0;
  let privateBiometricsDocCount = 0;
  let privateConsentDocCount = 0;

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    
    // Quét đệ quy toàn bộ các trường lồng (personalization, avatar, stats, v.v.)
    const foundPaths = scanObjectRecursively(data);
    if (foundPaths.length > 0) {
      foundPaths.forEach(p => {
        userPathCounts[p] = (userPathCounts[p] || 0) + 1;
      });
      if (data.faceDescriptor) {
        usersWithRootDescriptor++;
      }
    }

    // Kiểm tra subcollection users/{uid}/private/biometrics
    try {
      const bioSnap = await doc.ref.collection('private').doc('biometrics').get();
      if (bioSnap.exists) {
        privateBiometricsDocCount++;
      }
    } catch (_) {}

    // Kiểm tra subcollection users/{uid}/private/consent
    try {
      const consentSnap = await doc.ref.collection('private').doc('consent').get();
      if (consentSnap.exists) {
        privateConsentDocCount++;
      }
    } catch (_) {}
  }

  console.log('\n🔍 [2/3] Đang quét ĐỆ QUY CÁC COLLECTION KHÁC trên Firestore...');
  const allRootCollections = await db.listCollections();
  const otherCollectionCounts = {};

  for (const colRef of allRootCollections) {
    if (colRef.id === 'users') continue;
    try {
      const snap = await colRef.get();
      let colMatchCount = 0;
      for (const d of snap.docs) {
        const matches = scanObjectRecursively(d.data());
        if (matches.length > 0) {
          matches.forEach(m => {
            const p = `${colRef.id}.${m}`;
            otherCollectionCounts[p] = (otherCollectionCounts[p] || 0) + 1;
            colMatchCount++;
          });
        }
      }
      console.log(`   - Collection "${colRef.id}": ${snap.size} documents, ${colMatchCount} trường descriptor phát hiện.`);
    } catch (err) {
      console.warn(`   ⚠️ Không thể quét collection "${colRef.id}": ${err.message}`);
    }
  }

  console.log('\n========================================================================');
  console.log('📊 BÁO CÁO THỐNG KÊ SINH TRẮC HỌC CHI TIẾT (DRY-RUN - CHỈ BÁO CÁO SỐ LƯỢNG):');
  console.log('========================================================================');
  console.log(`1. Trong collection users/{uid} (tổng số: ${usersSnapshot.size} tài khoản):`);
  console.log(`   - Số tài khoản có faceDescriptor ở root: ${usersWithRootDescriptor}`);
  const userKeys = Object.keys(userPathCounts);
  if (userKeys.length === 0) {
    console.log('   - Quét đệ quy mọi trường lồng (personalization.*, v.v.): 0 trường phát hiện');
  } else {
    userKeys.forEach(k => {
      console.log(`   - Đường dẫn "${k}": ${userPathCounts[k]} tài liệu`);
    });
  }

  console.log(`\n2. Trong subcollection riêng biệt users/{uid}/private/*:`);
  console.log(`   - Số tài liệu tại users/{uid}/private/biometrics: ${privateBiometricsDocCount}`);
  console.log(`   - Số tài liệu tại users/{uid}/private/consent:    ${privateConsentDocCount}`);

  console.log(`\n3. Trong các collection khác (phiên thi, log, export, match_rooms...):`);
  const otherKeys = Object.keys(otherCollectionCounts);
  if (otherKeys.length === 0) {
    console.log('   - Không phát hiện trường descriptor/faceDescriptor nào trong bất kỳ collection nào khác.');
  } else {
    otherKeys.forEach(k => {
      console.log(`   - Đường dẫn "${k}": ${otherCollectionCounts[k]} tài liệu`);
    });
  }
  console.log('========================================================================');

  if (isDryRun) {
    console.log('\n🛡️ [DRY RUN HOÀN TẤT - BẢO ĐẢM KHÔNG THAY ĐỔI DỮ LIỆU]');
    console.log('   - Chế độ chỉ đọc hoàn tất an toàn. Không có thao tác ghi hoặc xóa nào.');
    console.log('   - Dừng lại và chờ xác nhận trước khi thực hiện bất kỳ bước tiếp theo nào.');
    return;
  }

  // NẾU CÓ CỜ --execute: THỰC HIỆN DI CHUYỂN THẬT
  console.log('\n⚠️ BẮT ĐẦU THỰC HIỆN DI CHUYỂN DỮ LIỆU THẬT...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const rollbackMapPath = path.resolve(`reports/biometrics_rollback_map_${timestamp}.json`);

  // Lưu Rollback Map trước khi xóa
  fs.mkdirSync(path.dirname(rollbackMapPath), { recursive: true });
  fs.writeFileSync(rollbackMapPath, JSON.stringify(accountsToMigrate, null, 2), 'utf8');
  console.log(`💾 Đã tạo file rollback map tại: ${rollbackMapPath}`);

  let migratedCount = 0;
  let deletedRootCount = 0;

  for (const acc of accountsToMigrate) {
    const userRef = db.collection('users').doc(acc.uid);
    const bioRef = userRef.collection('private').doc('biometrics');

    // 1. Ghi vào subcollection
    await bioRef.set({
      faceDescriptor: acc.faceDescriptor,
      migratedAt: new Date().toISOString(),
      migrationTool: 'migrate_biometrics_real_firestore.cjs',
      version: '2.0',
      ownerUid: acc.uid
    }, { merge: true });
    migratedCount++;

    // 2. Xóa khỏi root document
    await userRef.update({
      faceDescriptor: FieldValue.delete()
    });
    deletedRootCount++;

    console.log(`   ✅ [MIGRATED] UID: ${acc.uid} -> subcollection OK, root deleted.`);
  }

  console.log('\n========================================================================');
  console.log(`🏁 HOÀN TẤT DI CHUYỂN THẬT:`);
  console.log(`   - Số bản ghi đã ghi vào private/biometrics: ${migratedCount}`);
  console.log(`   - Số bản ghi đã xóa khỏi document gốc: ${deletedRootCount}`);
  console.log(`   - Nếu cần hoàn tác, chạy: node scripts/migrate_biometrics_real_firestore.cjs --rollback=${rollbackMapPath}`);
  console.log('========================================================================\n');
}

run().catch(err => {
  console.error('❌ Lỗi thực thi script:', err);
  process.exit(1);
});
