/**
 * 🛡️ scripts/remediate_reviews_dryrun.cjs
 * Script kiểm tra và chuẩn bị đánh dấu isDemo hoặc đưa về trạng thái "nội bộ" (team_self)
 * MẶC ĐỊNH: CHỈ DRY-RUN (không ghi, không sửa Firestore)
 * TUYỆT ĐỐI KHÔNG THỰC THI (--execute) KHI CHƯA CÓ LỆNH TƯỜNG MINH CỦA NGƯỜI DÙNG.
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const envContent = fs.readFileSync('.env.local', 'utf8');
const regex = /^\s*([A-Za-z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^#\r\n]*))/gm;
let m;
while ((m = regex.exec(envContent)) !== null) {
  const key = m[1];
  let val = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[4]);
  if (val !== undefined && !process.env[key]) {
    process.env[key] = val.trim();
  }
}

let cleanKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim();
const app = initializeApp({
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'cuoc-thi-ai-e2044',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: cleanKey
  })
});
const db = getFirestore(app);
const auth = getAuth(app);

const isExecute = process.argv.includes('--execute');

async function main() {
  console.log('====================================================================');
  console.log(`🛡️ SCRIPT PHÂN LOẠI PHIẾU THẨM ĐỊNH (CHẾ ĐỘ: ${isExecute ? 'EXECUTE - THỰC THI THẬT' : 'DRY-RUN - CHỈ XEM TRƯỚC'})`);
  console.log('====================================================================\n');

  if (isExecute) {
    console.error('⛔ LỖI BẢO MẬT: Quy tắc Prompt 0 nghiêm cấm chạy --execute khi chưa có lệnh tường minh từ người dùng!');
    process.exit(1);
  }

  const snap = await db.collection('expert_reviews').get();
  console.log(`Tìm thấy ${snap.size} phiếu trong collection expert_reviews.\n`);

  let candidateCount = 0;
  for (const doc of snap.docs) {
    const d = doc.data();
    // Tiêu chí xem xét:
    // - Bản ghi rev_150_* (sinh từ tập tổng hợp benchmark, không phải giáo viên ngoài trường chấm mù trực tiếp)
    // - Hoặc bản ghi do tài khoản admin/nội bộ tự chấm
    const isSyntheticBench = doc.id.startsWith('rev_150_');
    const isLocalSelf = d.reviewerType === 'team_self' || d.isTeamMember === true;

    if (isSyntheticBench || isLocalSelf) {
      candidateCount++;
      const maskedUid = d.reviewerUid ? `${d.reviewerUid.slice(0, 4)}...${d.reviewerUid.slice(-4)}` : '***';
      if (candidateCount <= 5) {
        console.log(`[DRY-RUN ĐỀ XUẤT] Doc ID: ${doc.id}`);
        console.log(`  Hiện tại: reviewerType=${d.reviewerType}, isDemo=${d.isDemo}`);
        console.log(`  Đề xuất: reviewerType='team_self' hoặc isDemo=true (để tách bạch hoàn toàn khỏi 'Giáo viên chấm thực tế')`);
        console.log(`  Lý do: Nguồn ${d.source || 'portal'} gắn với mã mẫu ${d.sampleId} thuộc tập tổng hợp benchmark / nhóm nội bộ.`);
        console.log(`  UID: ${maskedUid}`);
      }
    }
  }

  console.log(`\nTổng số phiếu đề xuất chuyển trạng thái nội bộ / isDemo: ${candidateCount}/${snap.size}`);
  console.log('\n✅ KẾT THÚC DRY-RUN: 0 bản ghi bị thay đổi trên Firestore DB.');
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});

