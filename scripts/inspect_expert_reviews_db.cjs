const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

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
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cuoc-thi-ai-e2044',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: normalizedPem
      })
    });
  } else {
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
    app = initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cuoc-thi-ai-e2044' });
  }
} else {
  app = getApps()[0];
}

const db = getFirestore(app);
const auth = getAuth(app);

async function main() {
  console.log('=== ĐỌC DỮ LIỆU TỪ FIRESTORE: expert_reviews ===');
  const snap = await db.collection('expert_reviews').get();
  console.log('Tổng số bản ghi trong expert_reviews:', snap.size);

  for (const doc of snap.docs) {
    const data = doc.data();
    let claims = {};
    if (data.reviewerUid) {
      try {
        const user = await auth.getUser(data.reviewerUid);
        claims = user.customClaims || {};
      } catch (e) {
        claims = { error: e.message };
      }
    }
    const rawUid = String(data.reviewerUid || '');
    const maskedUid = rawUid.length > 8 ? `${rawUid.slice(0, 4)}...${rawUid.slice(-4)}` : '***';

    console.log('\n--- BẢN GHI PHIẾU CHẤM ---');
    console.log('ID Tài liệu:', doc.id);
    console.log('reviewerType:', data.reviewerType);
    console.log('reviewerCode:', data.reviewerCode);
    console.log('reviewerUid (đã che):', maskedUid);
    console.log('Custom Claims của tài khoản:', JSON.stringify(claims));
    console.log('source:', data.source || 'portal_direct');
    console.log('sampleId:', data.sampleId);
    console.log('createdAt / timestamp:', data.timestamp || data.createdAt);
    console.log('aiVerdict:', data.aiVerdict);
    console.log('overallVerdict (verdict):', data.verdict);
    console.log('dap_an:', data.dap_an, '| trinh_bay:', data.trinh_bay);
    console.log('isDemo:', data.isDemo);
    console.log('skipped:', data.skipped);
    console.log('notes:', data.notes);
  }

  console.log('\n=== ĐỌC DỮ LIỆU TỪ FIRESTORE: admin_logs ===');
  try {
    const logSnap = await db.collection('admin_logs').orderBy('timestamp', 'desc').limit(20).get();
    console.log('Số log quản trị tìm thấy:', logSnap.size);
    for (const lDoc of logSnap.docs) {
      const lData = lDoc.data();
      const adminUid = String(lData.adminUid || lData.performedBy || '');
      const targetUid = String(lData.targetUid || lData.userId || '');
      const maskedAdmin = adminUid.length > 8 ? `${adminUid.slice(0, 4)}...${adminUid.slice(-4)}` : '***';
      const maskedTarget = targetUid.length > 8 ? `${targetUid.slice(0, 4)}...${targetUid.slice(-4)}` : '***';
      console.log(`[${lData.timestamp || lData.createdAt}] Hành động: ${lData.action || lData.type} | Người thực hiện (adminUid): ${maskedAdmin} | Đối tượng (targetUid): ${maskedTarget} | Chi tiết:`, JSON.stringify(lData.details || lData.payload || {}));
    }
  } catch (errLog) {
    console.log('Không đọc được admin_logs:', errLog.message);
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Lỗi thực thi:', err);
  process.exit(1);
});
