import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator, httpsCallable as originalHttpsCallable } from "firebase/functions";
import { clientFunctions } from "./clientFunctions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBGDJCKxedUMhxuOZ9QV305JnwZzWEi98Y",
  authDomain: "stem-hub-43e96.firebaseapp.com",
  projectId: "stem-hub-43e96",
  storageBucket: "stem-hub-43e96.firebasestorage.app",
  messagingSenderId: "182148750391",
  appId: "1:182148750391:web:d9297f826abc285babf3b2",
  measurementId: "G-1D80591ZNN"
};

// Initialize Firebase (Singleton pattern to prevent re-initialization in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let auth;
let db;
let functions;

if (typeof window === "undefined") {
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
} else {
  if (!globalThis.__firebaseAuth) {
    globalThis.__firebaseAuth = getAuth(app);
  }
  if (!globalThis.__firebaseDb) {
    globalThis.__firebaseDb = getFirestore(app);
  }
  if (!globalThis.__firebaseFunctions) {
    globalThis.__firebaseFunctions = getFunctions(app);
  }
  auth = globalThis.__firebaseAuth;
  db = globalThis.__firebaseDb;
  functions = globalThis.__firebaseFunctions;
}

const useEmulator = process.env.NEXT_PUBLIC_USE_EMULATOR === 'true';

if (typeof window !== "undefined" && !globalThis.__firebaseEmulatorsConnected) {
  try {
    if (useEmulator) {
      // Kết nối tất cả emulators (Auth, Firestore, Functions)
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFunctionsEmulator(functions, '127.0.0.1', 5001);
      console.log("Connected to all Firebase Emulators (Auth, Firestore, Functions)");
    } else {
      // Cơ chế Hybrid Production: Chỉ kết nối Functions tới local emulator, Auth & Firestore kết nối thẳng Production Cloud
      connectFunctionsEmulator(functions, '127.0.0.1', 5001);
      console.log("🔥 [Hybrid Production] Connected Functions to Local Emulator (127.0.0.1:5001), Auth & Firestore to Production");
    }
    globalThis.__firebaseEmulatorsConnected = true;
  } catch (err) {
    console.warn("Failed to connect to Firebase Emulators:", err);
  }
}

function httpsCallable(functionsInstance, name) {
  // Ưu tiên các hàm được xử lý trực tiếp ở client-side (nếu có cấu hình)
  if (clientFunctions[name]) {
    const clientFn = clientFunctions[name](db, auth);
    return async (data) => {
      console.log(`[Client-Side Callable] Intercepted call to '${name}'`, data);
      try {
        const res = await clientFn(data);
        return { data: res };
      } catch (err) {
        console.error(`[Client-Side Callable Error] '${name}' failed:`, err);
        throw err;
      }
    };
  }
  
  // Trả về lệnh gọi Cloud Function gốc (kết nối trực tiếp qua Emulator hoặc Cloud thực tế tùy cấu hình)
  return originalHttpsCallable(functionsInstance, name);
}

export { app, auth, db, functions, httpsCallable };
