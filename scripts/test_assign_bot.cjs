const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, getDoc, updateDoc, query, where } = require('firebase/firestore');
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

// Import clientFunctions
const { clientFunctions } = require('../src/lib/clientFunctions.js');

async function testBotAssignment() {
  console.log('1. Logging in as test user or student...');
  // Log in as test1 or test2 or a student
  const userCredential = await signInWithEmailAndPassword(auth, 'admin@stemhub.edu.vn', 'AdminStemHub2026!@');
  const user = userCredential.user;
  console.log('✅ Logged in as:', user.email, 'uid:', user.uid);

  const mockRoomId = `room_${user.uid}_test_${Date.now()}`;
  const roomRef = doc(db, 'match_rooms', mockRoomId);

  // Create a waiting room first
  await setDoc(roomRef, {
    id: mockRoomId,
    status: 'waiting',
    subject: 'math',
    player1: {
      uid: user.uid,
      name: 'Test Student',
      elo: 100,
      level: 2
    },
    player2: null,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + 60000
  });
  console.log('✅ Created mock waiting room:', mockRoomId);

  console.log('2. Calling assignBotOpponent...');
  try {
    const fn = clientFunctions.assignBotOpponent(db, auth);
    const result = await fn({ subject: 'math', activeRoomId: mockRoomId });
    console.log('🎉 assignBotOpponent Result:', result);
  } catch (err) {
    console.error('❌ assignBotOpponent threw error:', err.stack || err);
  }
}

testBotAssignment().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
