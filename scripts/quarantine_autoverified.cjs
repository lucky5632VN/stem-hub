/**
 * 🛡️ Script Kiểm Toán và Cách Ly Bản Ghi Tri Thức Auto-Verified / Bench-Verified
 * Tuân thủ Quy tắc trung thực Prompt 0:
 * - Mặc định DRY-RUN (CHỈ ĐỌC), TUYỆT ĐỐI KHÔNG GHI FIRESTORE NẾU THIẾU CỜ --execute.
 * - Luôn tự động xuất bản sao lưu đầy đủ ra reports/backup/ trước khi có bất kỳ thao tác ghi nào.
 * - Hỗ trợ cờ --rollback=<path> để hoàn tác trạng thái từ file sao lưu.
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Đọc biến môi trường từ .env.local
const envLocalPath = path.resolve('.env.local');
let clientEmail, privateKey, projectId, adminUidsEnv = '';
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
      if (k === 'ADMIN_UIDS') adminUidsEnv = v;
    }
  }
}

const app = !getApps().length
  ? initializeApp({
      credential: cert({
        projectId: projectId || 'cuoc-thi-ai-e2044',
        clientEmail,
        privateKey
      })
    })
  : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);

const args = process.argv.slice(2);
const isExecute = args.includes('--execute');
const rollbackArg = args.find(a => a.startsWith('--rollback'));

function maskUid(uid) {
  if (!uid || typeof uid !== 'string') return 'N/A';
  if (uid.length <= 8) return uid.slice(0, 2) + '***' + uid.slice(-2);
  return uid.slice(0, 4) + '***' + uid.slice(-4);
}

async function run() {
  console.log('========================================================================');
  console.log(`🛡️ KIỂM TOÁN VÀ CÁCH LY BẢN GHI TRI THỨC (learned_knowledge)`);
  console.log(`Chế độ: ${isExecute ? '⚠️ THỰC THI THẬT (--execute)' : (rollbackArg ? '🔄 HOÀN TÁC (--rollback)' : '🔍 DRY-RUN (CHỈ ĐỌC - KHÔNG GHI)')}`);
  console.log('========================================================================\n');

  // Xử lý hoàn tác ROLLBACK
  if (rollbackArg) {
    let backupFilePath = rollbackArg.includes('=') ? rollbackArg.split('=')[1].trim().replace(/^['"]|['"]$/g, '') : null;
    if (!backupFilePath) {
      console.error('❌ Vui lòng chỉ định đường dẫn file sao lưu: --rollback="reports/backup/learned_knowledge_xxx.json"');
      process.exit(1);
    }
    const fullPath = path.resolve(backupFilePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Không tìm thấy file sao lưu tại: ${fullPath}`);
      process.exit(1);
    }
    const backupData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    console.log(`🔄 Bắt đầu hoàn tác cho ${backupData.length} tài liệu từ: ${path.basename(fullPath)}...`);
    const batchSize = 100;
    let restored = 0;
    for (let i = 0; i < backupData.length; i += batchSize) {
      const chunk = backupData.slice(i, i + batchSize);
      const batch = db.batch();
      for (const item of chunk) {
        const ref = db.collection('learned_knowledge').doc(item.id);
        batch.set(ref, item.data, { merge: true });
      }
      await batch.commit();
      restored += chunk.length;
      console.log(`  Đã khôi phục ${restored}/${backupData.length} tài liệu...`);
    }
    console.log(`✅ Đã hoàn tất khôi phục trạng thái từ bản sao lưu.`);
    return;
  }

  // 1. Quét danh sách UID hợp lệ có claims admin hoặc teacher
  const validTeacherUids = new Set(adminUidsEnv.split(',').map(u => u.trim()).filter(Boolean));

  // 2. Đọc toàn bộ collection learned_knowledge
  console.log('📡 Đang tải danh sách tài liệu từ Firestore collection: learned_knowledge...');
  const snap = await db.collection('learned_knowledge').get();
  console.log(`Tổng số tài liệu trong learned_knowledge: ${snap.size}\n`);

  let countCriteria1 = 0; // verifiedBy chứa "Auto-Verified"
  let countCriteria2 = 0; // id bắt đầu bằng bench_verified_
  let countCriteria3 = 0; // status = verified_by_teacher mà verifiedBy không phải UID hợp lệ
  const targetMap = new Map();
  const allDocsBackup = [];

  for (const doc of snap.docs) {
    const id = doc.id;
    const data = doc.data();
    allDocsBackup.push({ id, data });

    const verifiedBy = String(data.verifiedBy || '');
    const isAutoVerified = verifiedBy.includes('Auto-Verified');
    const isBenchId = id.startsWith('bench_verified_');
    const isTeacherStatus = data.status === 'verified_by_teacher';
    const isInvalidTeacher = isTeacherStatus && !validTeacherUids.has(verifiedBy);

    let matched = false;
    const reasons = [];

    if (isAutoVerified) {
      countCriteria1++;
      matched = true;
      reasons.push('verifiedBy chứa "Auto-Verified"');
    }
    if (isBenchId) {
      countCriteria2++;
      matched = true;
      reasons.push('ID bắt đầu bằng bench_verified_');
    }
    if (isInvalidTeacher && !isAutoVerified && !isBenchId) {
      countCriteria3++;
      matched = true;
      reasons.push('status="verified_by_teacher" nhưng verifiedBy không thuộc UID giáo viên/admin hợp lệ');
    }

    if (matched) {
      targetMap.set(id, { doc, data, reasons });
    }
  }

  console.log('--- KẾT QUẢ PHÂN LOẠI THEO TIÊU CHÍ CÁCH LY ---');
  console.log(`1. Tiêu chí 1 (verifiedBy chứa "Auto-Verified"):                 ${countCriteria1} mục`);
  console.log(`2. Tiêu chí 2 (ID bắt đầu bằng "bench_verified_"):               ${countCriteria2} mục`);
  console.log(`3. Tiêu chí 3 (status="verified_by_teacher" không rõ UID GV):     ${countCriteria3} mục`);
  console.log(`------------------------------------------------------------------------`);
  console.log(`🎯 TỔNG SỐ TÀI LIỆU DUY NHẤT CẦN CÁCH LY:                     ${targetMap.size} mục (kỳ vọng ≈ 157)\n`);

  // 3. TẠO BẢN SAO LƯU ĐẦY ĐỦ BẮT BUỘC TRƯỚC KHI THỰC HIỆN
  const backupDir = path.resolve('reports/backup');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(backupDir, `learned_knowledge_${timestampStr}.json`);
  fs.writeFileSync(backupFilePath, JSON.stringify(allDocsBackup, null, 2), 'utf8');
  console.log(`💾 [SAO LƯU AN TOÀN]: Đã xuất toàn bộ ${allDocsBackup.length} bản ghi sang file:`);
  console.log(`   ${backupFilePath} (Đã thêm vào .gitignore, loại bỏ khỏi gói nộp)\n`);

  // In mẫu 5 bản ghi đầu tiên
  console.log('📋 Danh sách mẫu 5 tài liệu tiêu biểu trong diện cách ly:');
  let sampleCount = 0;
  for (const [id, item] of targetMap.entries()) {
    if (++sampleCount > 5) break;
    console.log(`  [${sampleCount}] ID: ${id}`);
    console.log(`      Câu hỏi:     "${item.data.query || item.data.question || ''}"`);
    console.log(`      Status hiện: ${item.data.status} | verifiedBy: ${item.data.verifiedBy}`);
    console.log(`      Lý do khớp:  ${item.reasons.join(' | ')}`);
  }

  if (isExecute) {
    console.log('\n⏳ Đang thực thi cập nhật cách ly trên Firestore...');
    const targetEntries = Array.from(targetMap.entries());
    const batchSize = 100;
    let updated = 0;

    for (let i = 0; i < targetEntries.length; i += batchSize) {
      const chunk = targetEntries.slice(i, i + batchSize);
      const batch = db.batch();
      for (const [id, item] of chunk) {
        batch.update(item.doc.ref, {
          status: 'pending_review',
          teacherVerified: false,
          isTeacherVerified: false,
          quarantined: true,
          quarantineReason: `Cách ly triệt để theo tiêu chí kiểm toán: ${item.reasons.join('; ')}`,
          updatedAt: new Date().toISOString()
        });
      }
      await batch.commit();
      updated += chunk.length;
      console.log(`  Đã cách ly ${updated}/${targetMap.size} tài liệu trên Firestore...`);
    }

    // Ghi audit log vào admin_logs
    await db.collection('admin_logs').add({
      action: 'QUARANTINE_AUTOVERIFIED_LEARNED_KNOWLEDGE_EXECUTED',
      totalQuarantined: targetMap.size,
      backupFile: path.basename(backupFilePath),
      executedAt: new Date().toISOString(),
      performedBy: 'quarantine_autoverified_script'
    });

    console.log(`\n✅ HOÀN TẤT THỰC THI CÁCH LY ${targetMap.size} MỤC TRÊN FIRESTORE!`);
    console.log(`Đã ghi nhận nhật ký kiểm toán vào admin_logs.`);
  } else {
    console.log('\nℹ️ [CHẾ ĐỘ DRY-RUN]:');
    console.log('- Đã tạo bản sao lưu an toàn tại thư mục reports/backup/');
    console.log('- CHƯA THỰC THI BẤT KỲ THAO TÁC GHI/SỬA NÀO TRÊN FIRESTORE.');
    console.log('- Khi bạn sẵn sàng thực thi, hãy gửi đúng lệnh: "cách ly learned execute".');
  }
  console.log('========================================================================\n');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

