import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let app;
const apps = getApps();
if (!apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'stem-hub-43e96';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY 
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
      : undefined;

    if (privateKey && clientEmail) {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('✨ [Firebase Admin] Initialized successfully with credentials.');
    } else {
      // Fallback cho local dev hoặc GCP default app
      app = initializeApp();
      console.log('✨ [Firebase Admin] Initialized with default credentials.');
    }
  } catch (error) {
    console.error('❌ [Firebase Admin] Initialization error:', error);
  }
} else {
  app = apps[0];
}

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
export { app as adminApp };
