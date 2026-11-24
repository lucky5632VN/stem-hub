/**
 * 📊 Script đếm số lượng bản ghi trong collection ai_reasoning_logs (DRY-RUN ONLY)
 * Báo cáo:
 * - Tổng số bản ghi hiện có
 * - Số bản ghi có chứa trường userEmail
 * TUYỆT ĐỐI KHÔNG IN email, UID, hay bất kỳ thông tin cá nhân nào.
 * TUYỆT ĐỐI KHÔNG XÓA hay sửa đổi dữ liệu.
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Load environment from .env.local
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
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.resolve('serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    app = initializeApp({ credential: cert(serviceAccount) });
  } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    let cleanKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim();
    const crypto = require('crypto');
    let normalizedPem = cleanKey;
    try {
      const lines = cleanKey.split('\n').map(l => l.trim()).filter(Boolean);
      const b64 = lines.slice(1, -1).join('');
      const buf = Buffer.from(b64, 'base64');
      const k = crypto.createPrivateKey({ key: buf, format: 'der', type: 'pkcs8' });
      normalizedPem = k.export({ type: 'pkcs8', format: 'pem' });
    } catch (e) {}

    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'cuoc-thi-ai-e2044',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: normalizedPem
      })
    });
  } else {
    app = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'cuoc-thi-ai-e2044'
    });
  }
}

async function countLogs() {
  console.log('='.repeat(70));
  console.log('📊 KIỂM TRA SỐ LƯỢNG BẢN GHI AI_REASONING_LOGS (DRY-RUN)');
  console.log('='.repeat(70));

  try {
    const db = getFirestore();
    const snapshot = await db.collection('ai_reasoning_logs').get();
    const totalCount = snapshot.size;

    let withEmailCount = 0;
    let withoutEmailCount = 0;
    let withTtlCount = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.userEmail && typeof data.userEmail === 'string' && data.userEmail.trim().length > 0) {
        withEmailCount++;
      } else {
        withoutEmailCount++;
      }
      if (data.expireAt) {
        withTtlCount++;
      }
    });

    console.log(`• Tổng số bản ghi trong collection ai_reasoning_logs: ${totalCount}`);
    console.log(`• Số bản ghi CÓ userEmail: ${withEmailCount}`);
    console.log(`• Số bản ghi KHÔNG có userEmail: ${withoutEmailCount}`);
    console.log(`• Số bản ghi có trường expireAt (TTL): ${withTtlCount}`);
    console.log('─'.repeat(70));
    console.log('🔒 Chế độ Dry-Run hoàn tất: Không có bất kỳ dữ liệu nào bị xóa hay thay đổi.');
  } catch (error) {
    console.error('❌ Lỗi khi truy vấn Firestore:', error.message);
  }
}

countLogs();

