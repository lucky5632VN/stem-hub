import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

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

async function main() {
  const usersResult = await auth.listUsers(50);
  console.log('Total auth users listed:', usersResult.users.length);
  usersResult.users.forEach(u => {
    const rawUid = u.uid;
    const maskedUid = rawUid.length > 8 ? `${rawUid.slice(0, 4)}...${rawUid.slice(-4)}` : '***';
    const emailPrefix = u.email ? u.email.split('@')[0].slice(0, 3) + '***@' + u.email.split('@')[1] : 'no-email';
    console.log(`User UID: ${maskedUid} (id prefix: ${rawUid.slice(0, 6)}) | Email: ${emailPrefix} | Claims: ${JSON.stringify(u.customClaims)}`);
  });
}

main().then(() => process.exit(0)).catch(console.error);

