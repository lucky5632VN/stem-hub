import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

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
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  const usersResult = await auth.listUsers(100);
  console.log('Total auth users:', usersResult.users.length);
  for (const u of usersResult.users) {
    const docSnap = await db.collection('users').doc(u.uid).get();
    const data = docSnap.exists ? docSnap.data() : null;
    const bioSnap = await db.collection('users').doc(u.uid).collection('private').doc('biometrics').get();
    const bioData = bioSnap.exists ? bioSnap.data() : null;
    const faceEnabled = data?.personalization?.face2FAEnabled || data?.face2FAEnabled;
    const hasBio = !!(bioData?.faceDescriptor);
    console.log(`[USER] email: ${u.email} | uid: ${u.uid} | docExists: ${docSnap.exists} | role: ${data?.role} | face2FAEnabled: ${faceEnabled} | hasBio: ${hasBio}`);
  }
}

main().then(() => process.exit(0)).catch(console.error);
