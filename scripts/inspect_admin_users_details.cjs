const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const envContent = fs.readFileSync('.env.local', 'utf8');
const regex = /^\s*([A-Za-z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^#\r\n]*))/gm;
let m;
while ((m = regex.exec(envContent)) !== null) {
  const k = m[1];
  const v = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[4]);
  if (v !== undefined && !process.env[k]) process.env[k] = v.trim();
}

let rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
let cleanKey = rawKey.replace(/\\r/g, '').replace(/\r/g, '').replace(/\\n/g, '\n').trim();
const lines = cleanKey.split('\n').map(l => l.trim()).filter(Boolean);
let normalizedPem = cleanKey;
try {
  const b64 = lines.slice(1, -1).join('');
  const buf = Buffer.from(b64, 'base64');
  const k = crypto.createPrivateKey({ key: buf, format: 'der', type: 'pkcs8' });
  normalizedPem = k.export({ type: 'pkcs8', format: 'pem' });
} catch (e) {}

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID || 'stem-hub-43e96',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: normalizedPem
  })
});
const db = getFirestore(app);
const auth = getAuth(app);

function maskStr(s) {
  if (!s) return 'N/A';
  if (s.length <= 4) return s[0] + '***';
  return s.slice(0, 2) + '***' + s.slice(-2);
}
function maskUid(uid) {
  if (!uid || uid.length < 8) return '***';
  return uid.slice(0, 4) + '***' + uid.slice(-4);
}

async function inspectAdmins() {
  const usersSnap = await db.collection('users').where('role', '==', 'admin').get();
  console.log('Tổng số user có role admin trong Firestore:', usersSnap.size);

  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const uid = doc.id;
    let authUser = null;
    try {
      authUser = await auth.getUser(uid);
    } catch (err) {
      authUser = { error: err.code };
    }

    const statsFieldNames = data.stats && typeof data.stats === 'object' ? Object.keys(data.stats) : [];

    console.log('\n---------------------------------------------------------');
    console.log('User UID (che):', maskUid(uid));
    console.log('  * displayName (che):', maskStr(data.displayName || (authUser && authUser.displayName)));
    console.log('  * createdAt (Firestore):', data.createdAt || 'N/A');
    console.log('  * lastActive (Firestore):', data.lastActive ? new Date(data.lastActive).toISOString() : 'N/A');
    console.log('  * Các trường trong stats (chỉ tên trường):', statsFieldNames.length > 0 ? statsFieldNames : 'Không có stats');
    if (authUser && !authUser.error) {
      console.log('  * Custom Claims (Firebase Auth):', JSON.stringify(authUser.customClaims || {}));
      console.log('  * emailVerified:', authUser.emailVerified);
      console.log('  * Lần đăng nhập cuối (Auth lastSignInTime):', authUser.metadata.lastSignInTime || 'Chưa đăng nhập');
      console.log('  * Thời điểm tạo (Auth creationTime):', authUser.metadata.creationTime);
    } else {
      console.log('  * Firebase Auth status:', authUser ? authUser.error : 'Not found');
    }
  }

  // KIỂM TRA ĐÍCH DANH TÀI KHOẢN admin123@gmail.com (YÊU CẦU 2A)
  console.log('\n=========================================================');
  console.log('🔍 KIỂM TRA ĐÍCH DANH TÀI KHOẢN admin123@gmail.com');
  console.log('=========================================================');
  let authAdmin123 = null;
  try {
    authAdmin123 = await auth.getUserByEmail('admin123@gmail.com');
  } catch (err) {
    authAdmin123 = { error: err.code };
  }

  if (authAdmin123 && !authAdmin123.error) {
    const uid123 = authAdmin123.uid;
    const doc123Snap = await db.collection('users').doc(uid123).get();
    const doc123Data = doc123Snap.exists ? doc123Snap.data() : {};
    const statsFields = doc123Data.stats && typeof doc123Data.stats === 'object' ? Object.keys(doc123Data.stats) : [];

    console.log('UID (che):', maskUid(uid123));
    console.log('  * role (trong Firestore doc):', doc123Data.role || '(không có trường role)');
    console.log('  * displayName (che):', maskStr(doc123Data.displayName || authAdmin123.displayName));
    console.log('  * createdAt (Firestore):', doc123Data.createdAt || 'N/A');
    console.log('  * lastActive (Firestore):', doc123Data.lastActive ? new Date(doc123Data.lastActive).toISOString() : 'N/A');
    console.log('  * Các trường trong stats (chỉ tên trường):', statsFields.length > 0 ? statsFields : 'Không có stats');
    console.log('  * emailVerified (Auth):', authAdmin123.emailVerified);
    console.log('  * Custom Claims (Auth):', JSON.stringify(authAdmin123.customClaims || {}));
    console.log('  * creationTime (Auth):', authAdmin123.metadata.creationTime);
    console.log('  * lastSignInTime (Auth):', authAdmin123.metadata.lastSignInTime || 'Chưa từng đăng nhập');
  } else {
    console.log('Trạng thái Auth của admin123@gmail.com:', authAdmin123 ? authAdmin123.error : 'Not found');
    const snap123 = await db.collection('users').where('email', '==', 'admin123@gmail.com').get();
    console.log('Trạng thái Firestore của email admin123@gmail.com: Tìm thấy', snap123.size, 'doc');
  }
}

inspectAdmins().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

