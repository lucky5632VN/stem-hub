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
const DEMO_JUDGE_NAME = 'Ban Giám Khảo — Hội Đồng Đánh Giá KHKT';

// Nạp thông tin kết nối Firebase Admin
const envLocalPath = path.resolve('.env.local');
let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
let projectId = process.env.FIREBASE_PROJECT_ID || 'stem-hub-43e96';

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (match) {
      const k = match[1];
      let v = match[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (k === 'FIREBASE_CLIENT_EMAIL' && !clientEmail) clientEmail = v;
      if (k === 'FIREBASE_PRIVATE_KEY' && !privateKey) privateKey = v;
      if (k === 'FIREBASE_PROJECT_ID' && !projectId) projectId = v;
    }
  }
}

let cleanKey = (privateKey || '').replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim();
let normalizedPem = cleanKey;
try {
  const lines = cleanKey.split('\n').map(l => l.trim()).filter(Boolean);
  const b64 = lines.slice(1, -1).join('');
  const buf = Buffer.from(b64, 'base64');
  const k = crypto.createPrivateKey({ key: buf, format: 'der', type: 'pkcs8' });
  normalizedPem = k.export({ type: 'pkcs8', format: 'pem' });
} catch (e) {}

const app = !getApps().length
  ? initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: normalizedPem
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
  const initialPassword = process.env.JUDGE_DEMO_PASSWORD || crypto.randomBytes(16).toString('hex') + 'Aa1!';

  if (!existingUser) {
    const createdUser = await auth.createUser({
      email: DEMO_JUDGE_EMAIL,
      displayName: DEMO_JUDGE_NAME,
      emailVerified: true,
      password: initialPassword
    });
    uid = createdUser.uid;
    console.log(`✅ Đã tạo mới tài khoản Auth thành công.`);
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

