const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyD9YsaKNmUXDMxDEAA4CcG_KXdGGfJVEOE",
  authDomain: "cuoc-thi-ai-e2044.firebaseapp.com",
  projectId: "cuoc-thi-ai-e2044",
  storageBucket: "cuoc-thi-ai-e2044.firebasestorage.app",
  messagingSenderId: "384565535158",
  appId: "1:384565535158:web:b7c6ea2e48c718a05f6117",
  measurementId: "G-W00VVRFZ40"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function cleanLine(line) {
  if (typeof line !== 'string') return line;
  return line
    .replace(/\s*\([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\)/g, '')
    .replace(/\s*\(guest\)/gi, '')
    .replace(/\s*\(\s*\)/g, '');
}

async function cleanLogs() {
  console.log('Logging in as admin...');
  await signInWithEmailAndPassword(auth, 'admin@stemhub.edu.vn', 'AdminStemHub2026!@');
  console.log('✅ Admin logged in!');

  const logsSnap = await getDocs(collection(db, 'ai_reasoning_logs'));
  console.log(`Found ${logsSnap.size} logs in ai_reasoning_logs collection.`);

  let updatedCount = 0;

  for (const docSnap of logsSnap.docs) {
    const data = docSnap.data();
    let needUpdate = false;
    const updates = {};

    if (data.userEmail) {
      updates.userEmail = '';
      needUpdate = true;
    }

    if (Array.isArray(data.terminalLines)) {
      const newLines = data.terminalLines.map(cleanLine);
      const isDifferent = JSON.stringify(newLines) !== JSON.stringify(data.terminalLines);
      if (isDifferent) {
        updates.terminalLines = newLines;
        needUpdate = true;
      }
    }

    if (needUpdate) {
      await updateDoc(doc(db, 'ai_reasoning_logs', docSnap.id), updates);
      updatedCount++;
    }
  }

  console.log(`✅ Successfully cleaned ${updatedCount} logs in Firestore!`);
  process.exit(0);
}

cleanLogs().catch((err) => {
  console.error('Error cleaning logs:', err);
  process.exit(1);
});
