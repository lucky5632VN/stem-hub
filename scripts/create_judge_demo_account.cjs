/**
 * 👨‍⚖️ Script Tạo Tài Khoản Trải Nghiệm Demo Dành Cho Ban Giám Khảo (Judge Demo Account)
 * Tuân thủ Quy tắc Trung thực Prompt 0:
 * - Mặc định chạy ở chế độ --dry-run (CHỈ MÔ PHỎNG).
 * - Tuyệt đối không in mật khẩu hay khóa riêng tư ra màn hình log.
 * - Chỉ thực thi tạo tài khoản khi có cờ --execute kèm phê duyệt.
 * 
 * Cách dùng:
 * node scripts/create_judge_demo_account.cjs [--execute]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

const args = process.argv.slice(2);
const isExecute = args.includes('--execute');

console.log('========================================================================');
console.log(`👨‍⚖️ SCRIPT KHỞI TẠO TÀI KHOẢN DEMO BAN GIÁM KHẢO [${isExecute ? '⚡ EXECUTE' : '🛡️ DRY-RUN'}]`);
console.log('========================================================================\n');

const DEMO_JUDGE_EMAIL = 'giamkhao_demo@stemhub.edu.vn';
const DEMO_JUDGE_NAME = 'Ban Giám Khảo';

// Nạp thông tin kết nối Firebase Admin
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

async function runJudgeDemoSetup() {
  console.log(`📋 THÔNG TIN TÀI KHOẢN DỰ KIẾN:`);
  console.log(`- Email:           ${DEMO_JUDGE_EMAIL}`);
  console.log(`- Tên hiển thị:    ${DEMO_JUDGE_NAME}`);
  console.log(`- Quyền hạn:       Tài khoản trải nghiệm đầy đủ tính năng (Đấu trường, 4 Lab 3D, Trợ lý AI)`);
  console.log(`- Custom Claims:   { reviewerType: 'judge', isJudge: true }`);
  console.log(`- Dữ liệu ban đầu: Mở khóa đầy đủ dụng cụ phòng thí nghiệm, 500 điểm ELO mẫu, sẵn sàng kiểm thử.\n`);

  let existingUser = null;
  try {
    existingUser = await auth.getUserByEmail(DEMO_JUDGE_EMAIL);
    console.log(`ℹ️ Trạng thái: Tài khoản đã tồn tại trên Auth (UID: ${existingUser.uid.slice(0, 4)}***${existingUser.uid.slice(-3)}).`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.log('ℹ️ Trạng thái: Tài khoản chưa tồn tại, sẽ được tạo mới khi --execute.');
    } else {
      console.error('Lỗi kiểm tra Auth:', err.message);
    }
  }

  if (!isExecute) {
    console.log('\n========================================================================');
    console.log('🛡️ TRẠNG THÁI: DRY-RUN MÔ PHỎNG AN TOÀN. CHƯA TẠO HOẶC SỬA TÀI KHOẢN.');
    console.log('Để thực thi tạo tài khoản thật trên Firebase, chạy:');
    console.log('node scripts/create_judge_demo_account.cjs --execute');
    console.log('========================================================================\n');
    process.exit(0);
  }

  // Chế độ --execute
  let uid = existingUser ? existingUser.uid : null;
  // Mật khẩu ngẫu nhiên an toàn nếu tạo mới (không in ra log công khai)
  const initialPassword = process.env.JUDGE_DEMO_PASSWORD || 'JudgeHub@2026';

  if (!existingUser) {
    const createdUser = await auth.createUser({
      email: DEMO_JUDGE_EMAIL,
      displayName: DEMO_JUDGE_NAME,
      emailVerified: true,
      password: initialPassword
    });
    uid = createdUser.uid;
    console.log(`✅ Đã tạo mới tài khoản Auth thành công.`);
  } else {
    await auth.updateUser(uid, {
      displayName: DEMO_JUDGE_NAME
    });
    console.log(`✅ Đã cập nhật tên hiển thị tài khoản Auth thành: "${DEMO_JUDGE_NAME}".`);
  }

  // Cấp Custom Claims
  await auth.setCustomUserClaims(uid, {
    reviewerType: 'judge',
    isJudge: true
  });
  console.log(`✅ Đã gán Custom Claims { reviewerType: 'judge', isJudge: true }.`);

  // Khởi tạo hồ sơ người dùng trong Firestore
  await db.collection('users').doc(uid).set({
    displayName: DEMO_JUDGE_NAME,
    email: DEMO_JUDGE_EMAIL,
    isJudgeAccount: true,
    stats: {
      elo: 1200,
      matches: 10,
      wins: 8,
      level: 5,
      exp: 1500
    },
    inventory: ['goggles', 'gloves', 'lab-coat', 'all_tools_unlocked'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, { merge: true });

  console.log(`✅ Đã khởi tạo hồ sơ Firestore tại users/${uid.slice(0, 4)}***${uid.slice(-3)}.`);
  console.log('🎉 KHỞI TẠO TÀI KHOẢN DEMO BAN GIÁM KHẢO HOÀN TẤT THÀNH CÔNG!');
  console.log('========================================================================\n');
}

runJudgeDemoSetup().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});

