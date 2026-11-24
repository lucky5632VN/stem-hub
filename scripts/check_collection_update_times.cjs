/**
 * 🔍 Script Kiểm Tra Timestamp và Đếm Số Document Cập Nhật Sau 2026-08-13T00:00:00Z
 * Đối chiếu giữa dữ liệu Firestore và Git log của các seed scripts
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

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
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cuoc-thi-ai-e2044'
    });
  }
}

const db = getFirestore(app);

const TARGET_COLLECTIONS = [
  'exams',
  'questions',
  'match_rooms',
  'moments',
  'stories',
  'tournaments',
  'config',
  'system_config'
];

const CUTOFF_DATE = new Date('2026-06-22T00:00:00.000Z');
const CUTOFF_MILLIS = CUTOFF_DATE.getTime();

function extractTimestamp(data) {
  const possibleFields = [
    'updatedAt', 'updated_at', 'updateTime', 'lastUpdated',
    'createdAt', 'created_at', 'timestamp', 'date', 'time'
  ];

  let latestDate = null;

  for (const field of possibleFields) {
    const val = data[field];
    if (!val) continue;

    let d = null;
    if (val instanceof Timestamp || (typeof val.toDate === 'function')) {
      d = val.toDate();
    } else if (typeof val === 'number') {
      d = new Date(val);
    } else if (typeof val === 'string') {
      const parsed = Date.parse(val);
      if (!isNaN(parsed)) d = new Date(parsed);
    }

    if (d && (!latestDate || d > latestDate)) {
      latestDate = d;
    }
  }

  return latestDate;
}

async function inspectCollection(colName) {
  const colRef = db.collection(colName);
  const snapshot = await colRef.get();

  let totalDocs = snapshot.size;
  let countAfterCutoff = 0;
  let mostRecentTimestamp = null;
  let earliestAfterCutoff = null;
  let sampleIdsAfterCutoff = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    // Also check doc.updateTime (Firestore metadata)
    let docTime = null;
    if (doc.updateTime && typeof doc.updateTime.toDate === 'function') {
      docTime = doc.updateTime.toDate();
    }

    const fieldTime = extractTimestamp(data);
    const effectiveTime = fieldTime && docTime ? (fieldTime > docTime ? fieldTime : docTime) : (fieldTime || docTime);

    if (effectiveTime) {
      if (!mostRecentTimestamp || effectiveTime > mostRecentTimestamp) {
        mostRecentTimestamp = effectiveTime;
      }
      if (effectiveTime.getTime() >= CUTOFF_MILLIS) {
        countAfterCutoff++;
        if (!earliestAfterCutoff || effectiveTime < earliestAfterCutoff) {
          earliestAfterCutoff = effectiveTime;
        }
        if (sampleIdsAfterCutoff.length < 5) {
          sampleIdsAfterCutoff.push({ id: doc.id, time: effectiveTime.toISOString() });
        }
      }
    }
  }

  return {
    collection: colName,
    totalDocs,
    countAfterCutoff,
    earliestAfterCutoff: earliestAfterCutoff ? earliestAfterCutoff.toISOString() : 'N/A',
    mostRecent: mostRecentTimestamp ? mostRecentTimestamp.toISOString() : 'N/A',
    sampleIdsAfterCutoff
  };
}

async function main() {
  console.log('========================================================================');
  console.log(`🔍 KIỂM TRA TIMESTAMP & DOCS CẬP NHẬT TỪ 2026-06-22 ĐẾN NAY`);
  console.log('========================================================================\n');

  const results = [];

  for (const col of TARGET_COLLECTIONS) {
    try {
      const res = await inspectCollection(col);
      results.push(res);
      console.log(`📁 [${col}]:`);
      console.log(`   - Tổng số docs: ${res.totalDocs}`);
      console.log(`   - Docs cập nhật từ 2026-06-22: ${res.countAfterCutoff}`);
      console.log(`   - Sớm nhất sau 2026-06-22: ${res.earliestAfterCutoff}`);
      console.log(`   - Gần nhất: ${res.mostRecent}`);
      if (res.countAfterCutoff > 0) {
        console.log(`   - Mẫu docs:`, JSON.stringify(res.sampleIdsAfterCutoff));
      }
    } catch (err) {
      console.error(`❌ Lỗi khi đọc collection ${col}:`, err.message);
      results.push({ collection: col, error: err.message });
    }
  }

  console.log('\n========================================================================');
  console.log('📊 BẢNG TỔNG HỢP KIỂM TOÁN TẬP DỮ LIỆU FIRESTORE');
  console.log('========================================================================');
  console.table(results.map(r => ({
    Collection: r.collection,
    'Tổng docs': r.totalDocs,
    '>= 2026-06-22': r.countAfterCutoff,
    'Sớm nhất >= 22/06': r.earliestAfterCutoff,
    'Gần nhất': r.mostRecent
  })));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

