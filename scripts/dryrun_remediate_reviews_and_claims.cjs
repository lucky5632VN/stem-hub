/**
 * 🛡️ Kịch bản Dry-run: Cách ly phiếu đánh giá kịch bản và gỡ Claims giáo viên
 * Tuân thủ Quy tắc trung thực: Mặc định DRY-RUN, chỉ đọc dữ liệu, KHÔNG ghi hoặc sửa Firestore khi chưa có cờ --execute
 * 
 * Cách chạy dry-run (an toàn):
 *   node scripts/dryrun_remediate_reviews_and_claims.cjs
 * 
 * Cách chạy thực thi (chỉ khi có lệnh trực tiếp):
 *   node scripts/dryrun_remediate_reviews_and_claims.cjs --execute
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
  const isExecute = process.argv.includes('--execute');

  console.log('========================================================================');
  console.log(`🛡️ KIỂM TOÁN VÀ ĐỀ XUẤT CÁCH LY PHIẾU ĐÁNH GIÁ & CLAIMS GIÁO VIÊN`);
  console.log(`Chế độ: ${isExecute ? '⚠️ THỰC THI THẬT (--execute)' : '🔍 DRY-RUN (CHỈ ĐỌC - KHÔNG GHI VÀO FIRESTORE)'}`);
  console.log('========================================================================\n');

  // PHẦN A: KIỂM TOÁN BỘ PHIẾU rev_150_*
  console.log('--- PHẦN A: KIỂM TOÁN 150 PHIẾU ĐÁNH GIÁ SCRIPT TẠO (rev_150_*) ---');
  const reviewsSnap = await db.collection('expert_reviews').get();
  const scriptDocs = [];
  reviewsSnap.forEach(docSnap => {
    if (docSnap.id.startsWith('rev_150_')) {
      scriptDocs.push({
        id: docSnap.id,
        ref: docSnap.ref,
        data: docSnap.data()
      });
    }
  });

  console.log(`Tổng số phiếu rev_150_* phát hiện trong Firestore: ${scriptDocs.length}`);
  const currentDemoCount = scriptDocs.filter(d => d.data.isDemo === true).length;
  const currentTeacherTypeCount = scriptDocs.filter(d => d.data.reviewerType === 'teacher').length;
  console.log(`- Số phiếu hiện có isDemo === true: ${currentDemoCount}`);
  console.log(`- Số phiếu hiện có reviewerType === 'teacher': ${currentTeacherTypeCount}`);

  console.log('\nKế hoạch xử lý (Dry-run proposal):');
  console.log(`- Đặt isDemo: true cho ${scriptDocs.length} phiếu`);
  console.log(`- Đặt reviewerType: 'demo' cho ${scriptDocs.length} phiếu`);
  console.log(`- Giữ nguyên createdAt, scores, notes phục vụ nghiên cứu kịch bản, không tính vào giáo viên thật`);

  if (isExecute) {
    console.log('\n⏳ Đang thực thi ghi dữ liệu lên Firestore...');
    const batchSize = 100;
    let updated = 0;
    for (let i = 0; i < scriptDocs.length; i += batchSize) {
      const chunk = scriptDocs.slice(i, i + batchSize);
      const batch = db.batch();
      for (const d of chunk) {
        batch.update(d.ref, {
          isDemo: true,
          reviewerType: 'demo',
          quarantineReason: 'Script-generated benchmark review; isolated from real teacher consensus'
        });
      }
      await batch.commit();
      updated += chunk.length;
      console.log(`  Đã cập nhật ${updated}/${scriptDocs.length} phiếu.`);
    }
    console.log('✅ Hoàn tất cập nhật 150 phiếu về diện demo!');
  } else {
    console.log('ℹ️ [DRY-RUN] Chưa áp dụng thay đổi nào trên Firestore. Thêm --execute để thực thi khi có lệnh.');
  }

  // PHẦN B: KIỂM TOÁN VÀ GỠ CLAIMS CHO TÀI KHOẢN sZmj...bHI3
  console.log('\n--- PHẦN B: KIỂM TOÁN CUSTOM CLAIMS TÀI KHOẢN REVIEWER ---');
  const targetUid = 'sZmjOcLHQlcLfKEtpQmGxJfAbHI3';
  console.log(`Tài khoản mục tiêu: ${maskUid(targetUid)}`);

  try {
    const userRecord = await auth.getUser(targetUid);
    const currentClaims = userRecord.customClaims || {};
    console.log(`Trạng thái Claims hiện tại:`, JSON.stringify(currentClaims));

    console.log('\nKế hoạch xử lý (Dry-run proposal):');
    console.log(`- Gỡ quyền teacher khỏi Custom Claims`);
    console.log(`- Thiết lập Claims mới: { role: 'student', reviewerType: null, isTeacher: false }`);
    console.log(`- Cập nhật Firestore document users/${maskUid(targetUid)} về role: 'student'`);

    if (isExecute) {
      console.log('\n⏳ Đang gỡ Claims trên Firebase Auth và Firestore...');
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

      // Ghi audit log
      await db.collection('admin_logs').add({
        action: 'REVOKE_TEACHER_ROLE_DRYRUN_EXECUTED',
        targetUid: targetUid,
        performedBy: 'academic_integrity_script',
        createdAt: new Date().toISOString(),
        reason: 'Temporary revocation of synthetic teacher claims until real teacher verification onboarded'
      });
      console.log('✅ Đã gỡ thành công Claims teacher trên Firebase Auth và users doc!');
    } else {
      console.log('ℹ️ [DRY-RUN] Chưa thay đổi Claims của tài khoản. Thêm --execute để thực thi khi có lệnh.');
    }
  } catch (err) {
    console.log(`⚠️ Không thể truy xuất thông tin tài khoản ${maskUid(targetUid)}:`, err.message);
  }

  console.log('\n========================================================================');
  console.log('🏁 KẾT THÚC KIỂM TOÁN DRY-RUN');
  console.log('========================================================================');
}

run().catch(console.error);

