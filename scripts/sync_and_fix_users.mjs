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
    const docRef = db.collection('users').doc(u.uid);
    const docSnap = await docRef.get();
    const bioSnap = await docRef.collection('private').doc('biometrics').get();
    const bioData = bioSnap.exists ? bioSnap.data() : null;
    const hasBio = !!(bioData?.faceDescriptor);

    if (!docSnap.exists) {
      console.log(`[CREATING MISSING DOC] for ${u.email} (${u.uid})`);
      const isTeacher = u.email?.includes('teacher') || u.email?.includes('gv');
      const isAdmin = u.email === 'admin@stemhub.edu.vn';
      const role = isAdmin ? 'admin' : (isTeacher ? 'teacher' : 'student');
      
      await docRef.set({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || u.email.split('@')[0],
        name: u.displayName || u.email.split('@')[0],
        role: role,
        createdAt: new Date().toISOString(),
        inventory: [],
        isBotAccount: false,
        botStatus: 'disabled',
        personalization: {
          avatarFrame: 'default',
          activeTitle: 'apprentice',
          unlockedFrames: ['default'],
          unlockedTitles: ['apprentice'],
          customCursor: 'default',
          soundEnabled: true,
          theme: 'light',
          crystals: 500,
          face2FAEnabled: false,
          avatarParts: {
            gender: 'male',
            bodyType: 'chibi',
            pose: 'standard',
            body: 'peach',
            hair: 'default',
            top: 'default',
            bottom: 'default',
            accessory: 'none'
          },
          unlockedParts: ['peach', 'hair_default', 'top_default', 'bottom_default'],
          claimedMilestones: [],
          elo: 0,
          level: 1
        },
        stats: {
          level: 1,
          exp: 0,
          nextLevelExp: 1000,
          elo: 0,
          wins: 0,
          losses: 0,
          subjectStrengths: { math: 50, physics: 50, chemistry: 50, biology: 50 }
        }
      });
    } else {
      const data = docSnap.data();
      const faceEnabled = data?.personalization?.face2FAEnabled || data?.face2FAEnabled;
      // If face2FA is enabled but user has NO biometric vector enrolled, disable it to prevent login trap!
      if (faceEnabled && !hasBio) {
        console.log(`[DISABLING FACE 2FA TRAP] for ${u.email} (${u.uid}) because hasBio is false`);
        await docRef.update({
          'personalization.face2FAEnabled': false,
          'face2FAEnabled': false
        });
      }
    }
  }
  console.log('✅ Synchronized all user documents and resolved face 2FA traps.');
}

main().then(() => process.exit(0)).catch(console.error);
