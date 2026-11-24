/**
 * 🔒 Script Xử Lý / Vô Hiệu Hóa Các Tài Khoản Kiểm Thử Lộ Mật Khẩu Trên Production
 * Tuân thủ Quy tắc Trung thực Prompt 0:
 * - Mặc định chạy ở chế độ --dry-run (CHỈ ĐỌC).
 * - TUYỆT ĐỐI KHÔNG thực hiện thay đổi nếu không có cờ --execute.
 * - Danh sách loại trừ đọc từ file qua --exclude-file="path/to/file.txt" (hỗ trợ UID hoặc email).
 * - Bỏ qua tuyệt đối các tài khoản có claims admin hoặc teacher.
 * - Hành động: Đặt mật khẩu ngẫu nhiên bảo mật (không lưu/không in) + Thu hồi refresh token (revokeRefreshTokens).
 * - KHÔNG xóa tài khoản.
 * - Dry-run in danh sách đã che: phân loại (bot đấu trường / test / hoạt động thật), emailVerified, lần đăng nhập cuối, số trận.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

const args = process.argv.slice(2);
const isExecute = args.includes('--execute');
const excludeFileArg = args.find(a => a.startsWith('--exclude-file='));

let excludedIdentifiers = new Set();
if (excludeFileArg) {
  const excludeFilePath = path.resolve(excludeFileArg.split('=')[1].trim().replace(/^["']|["']$/g, ''));
  if (fs.existsSync(excludeFilePath)) {
    const lines = fs.readFileSync(excludeFilePath, 'utf8').split(/\r?\n/);
    lines.forEach(l => {
      const clean = l.trim().toLowerCase();
      if (clean && !clean.startsWith('#')) excludedIdentifiers.add(clean);
    });
    console.log(`📁 Đã nạp ${excludedIdentifiers.size} định danh loại trừ từ file: ${excludeFilePath}`);
  } else {
    console.warn(`⚠️ File loại trừ không tồn tại: ${excludeFilePath}`);
  }
}

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

const TARGET_EMAILS = [
  'admin@stemhub.edu.vn',
  'admin123@gmail.com',
  'admin@gmail.com',
  'admin@stem-hub.top',
  'p1@test.com',
  'p2@test.com',
  'testuser1@example.com',
  ...Array.from({ length: 20 }, (_, i) => `test${i + 1}@gmail.com`)
];

function maskEmail(email) {
  if (!email) return 'N/A';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? name.slice(0, 2) + '***' : name + '***';
  return `${maskedName}@${domain}`;
}

function maskUid(uid) {
  if (!uid) return 'N/A';
  return uid.length > 6 ? uid.slice(0, 4) + '***' + uid.slice(-3) : '***';
}

async function remediate() {
  console.log('========================================================================');
  console.log(`🛡️ SCRIPT XỬ LÝ TÀI KHOẢN KIỂM THỬ [CHẾ ĐỘ: ${isExecute ? '⚡ EXECUTE (THỰC THI)' : '🛡️ DRY-RUN (CHỈ ĐỌC)'}]`);
  console.log('========================================================================\n');

  if (!isExecute) {
    console.log('⚠️ ĐANG CHẠY Ở CHẾ ĐỘ DRY-RUN: Chỉ phân tích và lập danh sách, KHÔNG thay đổi dữ liệu.');
    console.log('Chờ người dùng xác nhận UID hợp lệ trước khi thực hiện --execute.\n');
  }

  const accountList = [];

  for (const email of TARGET_EMAILS) {
    try {
      const user = await auth.getUserByEmail(email);
      const claims = user.customClaims || {};
      const isAdminOrTeacher = claims.admin === true || claims.teacher === true || claims.reviewerType === 'teacher';

      // Kiểm tra trong Firestore doc
      let isBot = false;
      let totalMatches = 0;
      try {
        const uDoc = await db.collection('users').doc(user.uid).get();
        if (uDoc.exists) {
          const uData = uDoc.data();
          if (uData.isBotAccount === true) isBot = true;
          totalMatches = uData.stats?.matches || uData.stats?.totalMatches || 0;
        }
      } catch (_) {}

      // Phân loại tài khoản
      let category = 'Test thông thường';
      if (isAdminOrTeacher) {
        category = 'Admin/Giáo viên (ĐƯỢC BẢO VỆ)';
      } else if (isBot) {
        category = 'Bot đấu trường';
      } else if (totalMatches > 0) {
        category = `Có hoạt động thật (${totalMatches} trận)`;
      }

      // Kiểm tra file loại trừ
      const isExcluded = excludedIdentifiers.has(user.uid.toLowerCase()) || excludedIdentifiers.has(email.toLowerCase());

      let action = 'BỎ QUA (Claims Admin/Teacher)';
      if (isAdminOrTeacher) {
        action = 'BỎ QUA: Giữ nguyên (có claims được cấp phép)';
      } else if (isExcluded) {
        action = 'BỎ QUA: Nằm trong danh sách loại trừ do người dùng cung cấp';
      } else if (isExecute) {
        // Thực hiện đặt mật khẩu ngẫu nhiên + revoke refresh token
        const randomSecret = crypto.randomBytes(32).toString('base64');
        await auth.updateUser(user.uid, { password: randomSecret });
        await auth.revokeRefreshTokens(user.uid);
        action = 'ĐÃ THỰC THI: Đặt mật khẩu ngẫu nhiên + Thu hồi token';
      } else {
        action = 'DỰ KIẾN: Đặt mật khẩu ngẫu nhiên + Thu hồi token';
      }

      accountList.push({
        'Email (Che)': maskEmail(email),
        'UID (Che)': maskUid(user.uid),
        'Phân loại': category,
        'Email Verified': user.emailVerified ? 'Đã xác thực' : 'Chưa',
        'Lần đăng nhập cuối': user.metadata.lastSignInTime || 'Chưa từng',
        'Số trận': totalMatches,
        'Hành động': action,
        uid: user.uid,
        email: email,
        isAdminOrTeacher,
        isExcluded
      });

    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        // Không tồn tại trên Firebase Auth
      } else {
        console.error(`Lỗi kiểm tra ${maskEmail(email)}:`, err.message);
      }
    }
  }

  console.log(`📋 KẾT QUẢ ĐỐI SOÁT (${accountList.length} tài khoản tìm thấy trên Firebase Auth):`);
  console.table(accountList.map(a => ({
    'Email (Che)': a['Email (Che)'],
    'UID (Che)': a['UID (Che)'],
    'Phân loại': a['Phân loại'],
    'Email Verified': a['Email Verified'],
    'Lần đăng nhập cuối': a['Lần đăng nhập cuối'],
    'Số trận': a['Số trận'],
    'Hành động': a['Hành động']
  })));

  if (!isExecute) {
    console.log('\n🔒 [BẢO MẬT]: Toàn bộ mật khẩu và token trên Auth được giữ nguyên 100%.');
    console.log('Để chạy thật sự sau khi chốt danh sách UID cần giữ:');
    console.log('node scripts/remediate_test_accounts.cjs [--exclude-file="path/to/uids.txt"] --execute\n');
  }
}

remediate().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
