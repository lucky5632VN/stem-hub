/**
 * 🛡️ Kịch bản Dry-run: Cách ly 4 bản ghi tri thức tự duyệt thời kỳ đầu (learned_1795*)
 * Tuân thủ Quy tắc trung thực: Mặc định DRY-RUN, chỉ đọc dữ liệu, KHÔNG ghi hoặc sửa Firestore khi chưa có cờ --execute
 * 
 * Cách chạy dry-run (an toàn):
 *   node scripts/remediate_learned_knowledge_dryrun.cjs
 * 
 * Cách chạy thực thi (chỉ khi có lệnh trực tiếp):
 *   node scripts/remediate_learned_knowledge_dryrun.cjs --execute
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
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

const db = getFirestore();

const TARGET_IDS = [
  'learned_1795420595828_ecmm', // pư oxh khử
  'learned_1795423314502_yxow', // nước mỹ cs bao nhiêu nước
  'learned_1795423382164_byj6', // toàn bộ kiến thức trong lớp 12 môn toán
  'learned_1795425651461_d1l4'  // dân số việt nam
];

async function run() {
  const isExecute = process.argv.includes('--execute');

  console.log('========================================================================');
  console.log(`🛡️ KIỂM TOÁN VÀ ĐỀ XUẤT CÁCH LY 4 BẢN GHI TRI THỨC TỰ DUYỆT (LEARNED_1795*)`);
  console.log(`Chế độ: ${isExecute ? '⚠️ THỰC THI THẬT (--execute)' : '🔍 DRY-RUN (CHỈ ĐỌC - KHÔNG GHI VÀO FIRESTORE)'}`);
  console.log('========================================================================\n');

  for (const id of TARGET_IDS) {
    const docRef = db.collection('learned_knowledge').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      console.log(`- Doc ${id}: KHÔNG TÌM THẤY TRONG FIRESTORE`);
      continue;
    }
    const data = snap.data();
    console.log(`📄 Doc ID: ${id}`);
    console.log(`   Câu hỏi:   "${data.query || ''}"`);
    console.log(`   Status:    ${data.status}`);
    console.log(`   Duyệt bởi: ${data.verifiedBy}`);
    console.log(`   Cách ly:   ${data.quarantined}`);
    console.log(`   Đề xuất:   status -> 'pending_review', teacherVerified -> false, quarantined -> true`);

    if (isExecute) {
      await docRef.update({
        status: 'pending_review',
        teacherVerified: false,
        quarantined: true,
        quarantineReason: 'Legacy auto-verified record from pre-c8791e0 period; quarantined pending human review',
        updatedAt: new Date().toISOString()
      });
      console.log(`   ✅ Đã cập nhật cách ly trên Firestore!`);
    } else {
      console.log(`   ℹ️ [DRY-RUN] Chưa thay đổi dữ liệu Firestore.`);
    }
    console.log('');
  }

  console.log('========================================================================');
  console.log('🏁 KẾT THÚC KIỂM TOÁN DRY-RUN LEARNED_KNOWLEDGE');
  console.log('========================================================================');
}

run().catch(console.error);

