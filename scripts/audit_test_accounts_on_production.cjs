const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Load .env.local
const envLocalPath = path.resolve('.env.local');
let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
let projectId = process.env.FIREBASE_PROJECT_ID || 'stem-hub-43e96';

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (match) {
      const k = match[1];
      let v = match[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (k === 'FIREBASE_CLIENT_EMAIL' && !clientEmail) clientEmail = v;
      if (k === 'FIREBASE_PRIVATE_KEY' && !privateKey) privateKey = v;
      if (k === 'FIREBASE_PROJECT_ID' && !projectId) projectId = v;
    }
  }
}

let cleanKey = (privateKey || '').replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim();
const crypto = require('crypto');
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

// All test/seed emails discovered in code
const CANDIDATE_EMAILS = [
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

async function auditAccounts() {
  console.log('========================================================================');
  console.log('🔍 KIỂM TOÁN TÀI KHOẢN KIỂM THỬ TRÊN PRODUCTION FIREBASE AUTH');
  console.log('========================================================================');
  console.log(`Dự án Firebase: ${projectId}\n`);

  const results = [];

  for (const email of CANDIDATE_EMAILS) {
    try {
      const user = await auth.getUserByEmail(email);
      results.push({
        email_masked: maskEmail(email),
        raw_email: email,
        exists: true,
        uid_masked: maskUid(user.uid),
        emailVerified: user.emailVerified,
        disabled: user.disabled,
        lastSignInTime: user.metadata?.lastSignInTime || 'Never',
        creationTime: user.metadata?.creationTime || 'N/A',
        customClaims: JSON.stringify(user.customClaims || {}),
        passwordStatus: 'Mật khẩu cố định có trong mã nguồn'
      });
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        results.push({
          email_masked: maskEmail(email),
          raw_email: email,
          exists: false,
          uid_masked: 'N/A',
          emailVerified: 'N/A',
          disabled: 'N/A',
          lastSignInTime: 'N/A',
          creationTime: 'N/A',
          customClaims: 'N/A',
          passwordStatus: 'Không tồn tại trên Auth'
        });
      } else {
        console.error(`Lỗi kiểm tra email ${email}:`, err.message);
      }
    }
  }

  const existingAccounts = results.filter(r => r.exists);
  const nonExistingAccounts = results.filter(r => !r.exists);

  console.log(`📊 TỔNG KẾT:`);
  console.log(`  - Tổng số email kiểm thử rà soát trong script: ${CANDIDATE_EMAILS.length}`);
  console.log(`  - Số tài khoản THỰC SỰ TỒN TẠI trên Firebase Auth: ${existingAccounts.length}`);
  console.log(`  - Số tài khoản KHÔNG TỒN TẠI: ${nonExistingAccounts.length}\n`);

  console.log('📋 BẢNG DANH SÁCH TÀI KHOẢN TỒN TẠI TRÊN PRODUCTION AUTH:');
  console.table(existingAccounts.map(r => ({
    'Email (Che)': r.email_masked,
    'UID (Che)': r.uid_masked,
    'Verified': r.emailVerified,
    'Disabled': r.disabled,
    'Claims': r.customClaims,
    'Lần đăng nhập cuối': r.lastSignInTime,
    'Tình trạng mật khẩu': r.passwordStatus
  })));

  if (nonExistingAccounts.length > 0) {
    console.log('\n📋 CÁC EMAIL KHÔNG TỒN TẠI TRÊN AUTH:');
    console.log(nonExistingAccounts.map(r => r.email_masked).join(', '));
  }
}

auditAccounts().catch(e => {
  console.error('Fatal audit error:', e);
  process.exit(1);
});
