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

// Chỉ kết nối tới emulator khi có biến môi trường NEXT_PUBLIC_USE_EMULATOR chỉ định rõ ràng là 'true'
const useEmulator = process.env.NEXT_PUBLIC_USE_EMULATOR === 'true';

if (useEmulator) {
  // Flag check để tránh connect emulator nhiều lần khi React reload
  if (!globalThis.__firebaseEmulatorsConnected) {
    try {
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      globalThis.__firebaseEmulatorsConnected = true;
      console.log("Connected to Firebase Emulators (Auth, Firestore)");
    } catch (err) {
      console.warn("Failed to connect to Firebase Emulators:", err);
    }
  }
}

function httpsCallable(functionsInstance, name) {
  const apiRouteMapping = {
    'submitAnswer': '/api/submit-answer',
    'finalizeMatch': '/api/finalize-match',
    'processCrystalTransaction': '/api/crystal-transaction',
    'processFriendAction': '/api/friend-action',
    'updateLastActive': '/api/update-last-active'
  };

  const apiPath = apiRouteMapping[name];

  if (apiPath) {
    return async (data) => {
      console.log(`[Next.js API Route Redirect] Calling API Route for '${name}' at ${apiPath}`, data);
      try {
        const authInstance = getAuth(app);
        const currentUser = authInstance.currentUser;
        const headers = {
          'Content-Type': 'application/json'
        };

        if (currentUser) {
          const idToken = await currentUser.getIdToken(true);
          headers['Authorization'] = `Bearer ${idToken}`;
        }

        const response = await fetch(apiPath, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(data || {})
        });

        const resData = await response.json();
        
        if (!response.ok) {
          throw new Error(resData.error || `HTTP error ${response.status}`);
        }

        // httpsCallable returns the response wrapped in a { data } object
        return { data: resData };
      } catch (err) {
        console.error(`[API Route Request Failed] '${name}' failed:`, err);
        throw err;
      }
    };
  }

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
  return originalHttpsCallable(functionsInstance, name);
}

export { app, auth, db, functions, httpsCallable };


