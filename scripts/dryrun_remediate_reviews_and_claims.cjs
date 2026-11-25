/**
 * 🛡️ Kịch bản Kiểm toán, Cách ly Phiếu Đánh giá rev_150_* và Gỡ Claims Giáo viên
 * Tuân thủ Quy tắc trung thực Prompt 0:
 * - Mặc định DRY-RUN (CHỈ ĐỌC), TUYỆT ĐỐI KHÔNG GHI FIRESTORE NẾU THIẾU CỜ --execute.
 * - Luôn tự động xuất bản sao lưu đầy đủ ra reports/backup/expert_reviews_<thời_điểm>.json trước khi có bất kỳ thao tác ghi nào.
 * - Hỗ trợ cờ --rollback=<path> để hoàn tác trạng thái từ file sao lưu.
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Đọc cấu hình môi trường từ .env.local
const envLocalPath = path.resolve('.env.local');
let clientEmail, privateKey, projectId;
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const m = line.trim().match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (m) {
      let [_, k, v] = m;
      v = v.replace(/^['"]|['"]$/g, '').trim();
      if (k === 'FIREBASE_CLIENT_EMAIL') clientEmail = v;
      if (k === 'FIREBASE_PRIVATE_KEY') privateKey = v.replace(/\\n/g, '\n');
      if (k === 'FIREBASE_PROJECT_ID') projectId = v;
    }
  }
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: projectId || 'cuoc-thi-ai-e2044',
      clientEmail,
      privateKey
    })
  });
}

const auth = getAuth();
const db = getFirestore();

function maskUid(uid) {
  if (!uid || typeof uid !== 'string') return 'N/A';
  if (uid.length <= 8) return uid.slice(0, 2) + '***' + uid.slice(-2);
  return uid.slice(0, 4) + '***' + uid.slice(-4);
}

async function run() {
  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute');
  const rollbackArg = args.find(a => a.startsWith('--rollback'));

  console.log('========================================================================');
  console.log(`🛡️ KIỂM TOÁN VÀ CÁCH LY PHIẾU ĐÁNH GIÁ (expert_reviews) & CLAIMS GIÁO VIÊN`);
  console.log(`Chế độ: ${isExecute ? '⚠️ THỰC THI THẬT (--execute)' : (rollbackArg ? '🔄 HOÀN TÁC (--rollback)' : '🔍 DRY-RUN (CHỈ ĐỌC - KHÔNG GHI)')}`);
  console.log('========================================================================\n');

  const targetUid = 'sZmjOcLHQlcLfKEtpQmGxJfAbHI3';

  // 1. XỬ LÝ HOÀN TÁC ROLLBACK
  if (rollbackArg) {
    let backupFilePath = rollbackArg.includes('=') ? rollbackArg.split('=')[1].trim().replace(/^['"]|['"]$/g, '') : null;
    if (!backupFilePath) {
      console.error('❌ Vui lòng chỉ định file sao lưu: --rollback="reports/backup/expert_reviews_xxx.json"');
      process.exit(1);
    }
    const fullPath = path.resolve(backupFilePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Không tìm thấy file sao lưu tại: ${fullPath}`);
      process.exit(1);
    }
    const backupData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    console.log(`🔄 Bắt đầu hoàn tác cho ${backupData.reviews?.length || 0} phiếu từ: ${path.basename(fullPath)}...`);

    const reviews = backupData.reviews || [];
    const batchSize = 100;
    let restored = 0;
    for (let i = 0; i < reviews.length; i += batchSize) {
      const chunk = reviews.slice(i, i + batchSize);
      const batch = db.batch();
      for (const item of chunk) {
        const ref = db.collection('expert_reviews').doc(item.id);
        batch.set(ref, item.data, { merge: true });
      }
      await batch.commit();
      restored += chunk.length;
      console.log(`  Đã khôi phục ${restored}/${reviews.length} phiếu...`);
    }

    // Khôi phục Claims người dùng nếu có trong backup
    if (backupData.targetUserClaims) {
      console.log(`🔄 Đang khôi phục Custom Claims cho tài khoản ${maskUid(targetUid)}...`);
      await auth.setCustomUserClaims(targetUid, backupData.targetUserClaims);
      if (backupData.targetUserDoc) {
        await db.collection('users').doc(targetUid).set(backupData.targetUserDoc, { merge: true });
      }
      console.log(`✅ Đã khôi phục Claims cho tài khoản ${maskUid(targetUid)}.`);
    }

    console.log(`✅ Đã hoàn tất khôi phục trạng thái từ bản sao lưu.`);
    return;
  }

  // 2. ĐỌC DỮ LIỆU TỪ FIRESTORE
  const reviewsSnap = await db.collection('expert_reviews').get();
  console.log(`Tổng số tài liệu trong expert_reviews: ${reviewsSnap.size}`);

  const allReviewsBackup = [];
  const scriptDocs = [];
  const otherDocs = [];

  reviewsSnap.forEach(docSnap => {
    const id = docSnap.id;
    const data = docSnap.data();
    const createTime = docSnap.createTime ? docSnap.createTime.toDate().toISOString() : 'N/A';
    allReviewsBackup.push({ id, data, createTime });

    if (id.startsWith('rev_150_')) {
      scriptDocs.push({ id, ref: docSnap.ref, data, createTime });
    } else {
      otherDocs.push({ id, ref: docSnap.ref, data, createTime });
    }
  });

  console.log(`- Phiếu kịch bản rev_150_*: ${scriptDocs.length} phiếu`);
  console.log(`- Phiếu nguồn khác:         ${otherDocs.length} phiếu`);

  // Lấy trạng thái tài khoản mục tiêu
  let userRecord = null;
  let currentClaims = {};
  let targetUserDoc = null;
  try {
    userRecord = await auth.getUser(targetUid);
    currentClaims = userRecord.customClaims || {};
    const uDoc = await db.collection('users').doc(targetUid).get();
    if (uDoc.exists) targetUserDoc = uDoc.data();
  } catch (err) {
    console.warn(`⚠️ Không thể đọc tài khoản ${maskUid(targetUid)}:`, err.message);
  }

  // 3. XUẤT BẢN SAO LƯU AN TOÀN TRƯỚC KHI GHI
  const backupDir = path.resolve('reports/backup');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(backupDir, `expert_reviews_${timestampStr}.json`);
  const fullBackupPayload = {
    exportedAt: new Date().toISOString(),
    totalReviews: allReviewsBackup.length,
    rev150Count: scriptDocs.length,
    otherCount: otherDocs.length,
    targetUid: targetUid,
    targetUserClaims: currentClaims,
    targetUserDoc: targetUserDoc,
    reviews: allReviewsBackup
  };
  fs.writeFileSync(backupFilePath, JSON.stringify(fullBackupPayload, null, 2), 'utf8');
  console.log(`\n💾 [SAO LƯU AN TOÀN]: Đã xuất toàn bộ ${allReviewsBackup.length} phiếu và Claims sang file:`);
  console.log(`   ${backupFilePath} (Đã thêm vào .gitignore, loại bỏ khỏi gói nộp)\n`);

  console.log('--- KẾ HOẠCH XỬ LÝ CÁCH LY PHIẾU rev_150_* ---');
  console.log(`- Đặt isDemo: true cho ${scriptDocs.length} phiếu rev_150_*`);
  console.log(`- Đặt reviewerType: 'demo' cho ${scriptDocs.length} phiếu rev_150_*`);
  console.log(`- Gỡ claims teacher khỏi tài khoản ${maskUid(targetUid)}, đặt role: 'student', reviewerType: null, isTeacher: false`);

  if (isExecute) {
    console.log('\n⏳ Đang thực thi cập nhật cách ly trên Firestore...');
    const batchSize = 100;
    let updated = 0;
    for (let i = 0; i < scriptDocs.length; i += batchSize) {
      const chunk = scriptDocs.slice(i, i + batchSize);
      const batch = db.batch();
      for (const d of chunk) {
        batch.update(d.ref, {
          isDemo: true,
          reviewerType: 'demo',
          quarantined: true,
          quarantineReason: 'Kịch bản thẩm định đối đầu kỹ thuật; cách ly khỏi dữ liệu đồng thuận giáo viên thật',
          updatedAt: new Date().toISOString()
        });
      }
      await batch.commit();
      updated += chunk.length;
      console.log(`  Đã cách ly ${updated}/${scriptDocs.length} phiếu trên Firestore...`);
    }

    // Gỡ claims
    console.log(`⏳ Đang gỡ quyền teacher khỏi tài khoản ${maskUid(targetUid)}...`);
    const safeClaims = {
      ...currentClaims,
      role: 'student',
      reviewerType: null,
      isTeacher: false,
      subjects: []
    };
    await auth.setCustomUserClaims(targetUid, safeClaims);
    await db.collection('users').doc(targetUid).set({
      role: 'student',
      reviewerType: null,
      isTeacher: false,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Ghi admin_logs
    await db.collection('admin_logs').add({
      action: 'QUARANTINE_REVIEWS_AND_REVOKE_CLAIMS_EXECUTED',
      rev150Quarantined: scriptDocs.length,
      targetUid: targetUid,
      backupFile: path.basename(backupFilePath),
      performedBy: 'dryrun_remediate_reviews_and_claims_script',
      executedAt: new Date().toISOString()
    });

    console.log(`\n✅ HOÀN TẤT THỰC THI CÁCH LY 150 PHIẾU VÀ GỠ CLAIMS TRÊN FIRESTORE & AUTH!`);
  } else {
    console.log('\nℹ️ [CHẾ ĐỘ DRY-RUN]:');
    console.log('- Đã tạo bản sao lưu an toàn tại thư mục reports/backup/');
    console.log('- CHƯA THỰC THI BẤT KỲ THAO TÁC GHI/SỬA NÀO TRÊN FIRESTORE HOẶC FIREBASE AUTH.');
    console.log('- Khi bạn sẵn sàng thực thi, hãy gửi đúng lệnh: "cách ly phiếu execute".');
  }

  console.log('========================================================================\n');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
