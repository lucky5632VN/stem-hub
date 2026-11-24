/**
 * 🛡️ scripts/scrub_reasoning_logs.cjs
 * Tối thiểu hóa dữ liệu (Data Minimization) & Tẩy rửa 130 bản ghi cũ trong ai_reasoning_logs:
 * - Xóa trường userEmail, userDisplayName (FieldValue.delete())
 * - Cắt ngắn query <= 120 ký tự
 * - Cắt ngắn aiResponseText <= 150 ký tự
 * - Đặt expireAt = Date.now() + 7 ngày (TTL Firestore)
 * 
 * MẶC ĐỊNH: --dry-run (Chỉ xem trước số lượng bản ghi cần sửa, KHÔNG thay đổi DB)
 * CHỈ THỰC THI THẬT: Khi có cờ --execute VÀ người dùng xác nhận "scrub logs"
 * Tuyệt đối không chạm vào bất kỳ collection nào khác.
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');

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
    // Emulator fallback
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
    app = initializeApp({ projectId: 'cuoc-thi-ai-e2044' });
  }
}

const db = getFirestore(app);

const args = process.argv.slice(2);
const isExecute = args.includes('--execute');

async function main() {
  console.log('='.repeat(80));
  console.log(`🛡️ SCRUB REASONING LOGS [Chế độ: ${isExecute ? '⚠️ THỰC THI (--execute)' : '🔍 XEM TRƯỚC (--dry-run)'}]`);
  console.log('='.repeat(80));

  const collectionRef = db.collection('ai_reasoning_logs');
  const snapshot = await collectionRef.get();

  const totalDocs = snapshot.size;
  console.log(`Tổng số bản ghi trong ai_reasoning_logs: ${totalDocs}`);

  if (totalDocs === 0) {
    console.log('Không có bản ghi nào trong collection ai_reasoning_logs.');
    return;
  }

  let needEmailRemoval = 0;
  let realEmailsCount = 0;
  let emptyEmailsCount = 0;
  let needDisplayNameRemoval = 0;
  let needQueryTruncation = 0;
  let needResponseTruncation = 0;
  let needExpireAt = 0;
  let totalDocsToModify = 0;

  const nowMs = Date.now();
  const sevenDaysLater = new Date(nowMs + 7 * 24 * 60 * 60 * 1000);
  const sevenDaysTimestamp = Timestamp.fromDate(sevenDaysLater);

  const updates = [];

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const docUpdates = {};
    let willModify = false;

    // 1. Xóa userEmail
    if (data.userEmail !== undefined) {
      docUpdates.userEmail = FieldValue.delete();
      needEmailRemoval++;
      if (typeof data.userEmail === 'string' && data.userEmail.includes('@')) {
        realEmailsCount++;
      } else {
        emptyEmailsCount++;
      }
      willModify = true;
    }

    // 2. Xóa userDisplayName
    if (data.userDisplayName !== undefined) {
      docUpdates.userDisplayName = FieldValue.delete();
      needDisplayNameRemoval++;
      willModify = true;
    }

    // 3. Cắt ngắn query <= 120 ký tự
    if (data.query && typeof data.query === 'string' && data.query.length > 120) {
      docUpdates.query = data.query.substring(0, 120);
      needQueryTruncation++;
      willModify = true;
    }

    // 4. Cắt ngắn aiResponseText <= 150 ký tự
    if (data.aiResponseText && typeof data.aiResponseText === 'string' && data.aiResponseText.length > 150) {
      docUpdates.aiResponseText = data.aiResponseText.substring(0, 150);
      needResponseTruncation++;
      willModify = true;
    } else if (data.response && typeof data.response === 'string' && data.response.length > 150) {
      docUpdates.response = data.response.substring(0, 150);
      needResponseTruncation++;
      willModify = true;
    }

    // 5. expireAt = hiện tại + 7 ngày
    if (!data.expireAt) {
      docUpdates.expireAt = sevenDaysTimestamp;
      needExpireAt++;
      willModify = true;
    }

    if (willModify) {
      totalDocsToModify++;
      updates.push({ id: docSnap.id, updates: docUpdates });
    }
  });

  console.log('\n📊 KẾT QUẢ RÀ SOÁT DỮ LIỆU CŨ:');
  console.log(`• Tổng số bản ghi quét: ${totalDocs}`);
  console.log(`• Số bản ghi CẦN SỬA ĐỔI: ${totalDocsToModify} / ${totalDocs}`);
  console.log(`  - Xóa userEmail: ${needEmailRemoval} bản ghi (Gồm: ${realEmailsCount} bản ghi chứa email thật '@', ${emptyEmailsCount} bản ghi chứa chuỗi rỗng/null)`);
  console.log(`  - Xóa userDisplayName: ${needDisplayNameRemoval} bản ghi`);
  console.log(`  - Cắt ngắn query (<= 120 ký tự): ${needQueryTruncation} bản ghi`);
  console.log(`  - Cắt ngắn aiResponseText (<= 150 ký tự): ${needResponseTruncation} bản ghi`);
  console.log(`  - Bổ sung expireAt (TTL 7 ngày): ${needExpireAt} bản ghi`);

  if (!isExecute) {
    console.log('\n🔒 [DRY-RUN] Script đang chạy ở chế độ xem trước an toàn.');
    console.log('Chưa có bất kỳ thay đổi nào được ghi vào cơ sở dữ liệu Firestore.');
    console.log('Để thực thi ghi đè, cần chạy lệnh với cờ --execute khi có lệnh xác nhận "scrub logs" từ người dùng.');
    return;
  }

  // Chế độ thực thi thật
  console.log('\n⚡ Đang thực hiện cập nhật theo lô (batch updates)...');
  const batchSize = 400;
  for (let i = 0; i < updates.length; i += batchSize) {
    const chunk = updates.slice(i, i + batchSize);
    const batch = db.batch();
    for (const item of chunk) {
      const ref = collectionRef.doc(item.id);
      batch.update(ref, item.updates);
    }
    await batch.commit();
    console.log(`  -> Đã cập nhật xong lô ${Math.floor(i / batchSize) + 1} (${chunk.length} bản ghi)`);
  }

  console.log('\n✅ HOÀN TẤT THỰC THI: Đã tẩy rửa thành công toàn bộ dữ liệu nhạy cảm cũ.');
}

main().catch(err => {
  console.error('Lỗi thực thi:', err.message);
  process.exit(1);
});

