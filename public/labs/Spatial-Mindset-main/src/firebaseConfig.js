// =====================================================
// SpatialMind — Firebase Configuration
// =====================================================
// HƯỚNG DẪN SETUP FIREBASE:
// 1. Vào https://console.firebase.google.com
// 2. Bấm "Add project" → Đặt tên "SpatialMind" → Create
// 3. Vào Project Settings (⚙️) → General → "Add app" → Web (</>) 
// 4. Đặt nickname "SpatialMind Web" → Register app
// 5. Copy firebaseConfig object → Dán vào file .env (xem bên dưới)
// 6. Vào Authentication → Sign-in method → Enable "Email/Password" + "Google"
// 7. Vào Firestore Database → Create database → Start in test mode
// 8. Vào Storage → Get started → Start in test mode
//
// FILE .env (tạo ở root project):
// VITE_FIREBASE_API_KEY=AIzaSy...
// VITE_FIREBASE_AUTH_DOMAIN=spatialmind-xxxxx.firebaseapp.com
// VITE_FIREBASE_PROJECT_ID=spatialmind-xxxxx
// VITE_FIREBASE_STORAGE_BUCKET=spatialmind-xxxxx.appspot.com
// VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
// VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
// =====================================================

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Kiểm tra config có hợp lệ không
const isFirebaseConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== '';

let app = null;
let auth = null;
let db = null;
let storage = null;
let googleProvider = null;
let githubProvider = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    
    githubProvider = new GithubAuthProvider();
  } catch (err) {
    console.warn('Firebase initialization failed:', err.message);
  }
} else {
  console.warn(
    '⚠️ Firebase chưa được cấu hình. Thêm VITE_FIREBASE_* vào file .env hoặc Vercel Environment Variables.\n' +
    'App sẽ chạy ở chế độ offline (localStorage only).'
  );
  console.log('Config check:', { 
    hasApiKey: !!firebaseConfig.apiKey, 
    hasAuthDomain: !!firebaseConfig.authDomain,
    env: import.meta.env.MODE 
  });
}

export { app, auth, db, storage, googleProvider, githubProvider, isFirebaseConfigured };
export default app;
