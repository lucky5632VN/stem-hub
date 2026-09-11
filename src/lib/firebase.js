import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentSingleTabManager, 
  connectFirestoreEmulator 
} from "firebase/firestore";
import { clientFunctions } from "./clientFunctions.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD9YsaKNmUXDMxDEAA4CcG_KXdGGfJVEOE",
  authDomain: "cuoc-thi-ai-e2044.firebaseapp.com",
  projectId: "cuoc-thi-ai-e2044",
  storageBucket: "cuoc-thi-ai-e2044.firebasestorage.app",
  messagingSenderId: "384565535158",
  appId: "1:384565535158:web:b7c6ea2e48c718a05f6117",
  measurementId: "G-W00VVRFZ40"
};

// Initialize Firebase (Singleton pattern to prevent re-initialization in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let auth;
let db;

// Tự động dọn dẹp các key rác/lớn trong LocalStorage để đảm bảo dung lượng cho toàn hệ thống
function cleanupLocalStorage() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      // Dọn các token đồng bộ đa tab cũ của Firestore gây QuotaExceededError
      if (key.startsWith("firestore_") || key.includes("firestore")) {
        keysToRemove.push(key);
      }
      // Dọn các key dữ liệu nặng thừa (> 40KB)
      try {
        const val = window.localStorage.getItem(key);
        if (
          key.includes("pending_share") || 
          key.includes("weights_") || 
          key.includes("pvp_bot_population") ||
          (val && val.length > 40000)
        ) {
          keysToRemove.push(key);
        }
      } catch (_) {}
    }
    keysToRemove.forEach((k) => {
      try {
        window.localStorage.removeItem(k);
      } catch (_) {}
    });
  } catch (e) {
    console.warn("[Firebase/Storage] Cleanup failed:", e);
  }
}

function createFirestoreDb(appInstance) {
  cleanupLocalStorage();
  try {
    return initializeFirestore(appInstance, {
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager()
      })
    });
  } catch (err) {
    console.warn("[Firestore] persistentSingleTabManager fallback to default getFirestore:", err?.message || err);
    try {
      return getFirestore(appInstance);
    } catch (e) {
      console.error("[Firestore] Critical init error:", e);
      return null;
    }
  }
}

if (typeof window === "undefined") {
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  if (!globalThis.__firebaseAuth) {
    globalThis.__firebaseAuth = getAuth(app);
  }
  if (!globalThis.__firebaseDb) {
    globalThis.__firebaseDb = createFirestoreDb(app);
  }
  auth = globalThis.__firebaseAuth;
  db = globalThis.__firebaseDb;
}

const useEmulator = process.env.NEXT_PUBLIC_USE_EMULATOR === 'true';

if (typeof window !== "undefined" && !globalThis.__firebaseEmulatorsConnected) {
  try {
    if (useEmulator) {
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      console.log("Connected to Firebase Emulators (Auth, Firestore)");
    } else {
      console.log("🔥 [Production] Operating in Serverless Client-Side Callable Mode!");
    }
    globalThis.__firebaseEmulatorsConnected = true;
  } catch (err) {
    console.warn("Failed to connect to Firebase Emulators:", err);
  }
}

// Giả lập hoàn toàn httpsCallable ở client-side
function httpsCallable(functionsDummy, name) {
  if (clientFunctions[name]) {
    const clientFn = clientFunctions[name](db, auth);
    return async (data) => {
      console.log(`[Client-Side Callable] Intercepted call to '${name}'`, data);
      try {
        const res = await clientFn(data);
        return { data: res };
      } catch (err) {
        console.warn(`[Client-Side Callable Warning] '${name}':`, err?.message || err);
        return { data: { success: false, error: err?.message || err } };
      }
    };
  }
  
  console.warn(`[Client-Side Mock] Function '${name}' not implemented in clientFunctions. Returning mock success.`);
  return async () => {
    return { data: { success: true } };
  };
}

const functions = {}; // Tránh lỗi import functions ở các file client khác

export { app, auth, db, functions, httpsCallable };
