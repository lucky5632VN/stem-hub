import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD9YsaKNmUXDMxDEAA4CcG_KXdGGfJVEOE",
  authDomain: "cuoc-thi-ai-e2044.firebaseapp.com",
  projectId: "cuoc-thi-ai-e2044",
  storageBucket: "cuoc-thi-ai-e2044.firebasestorage.app",
  messagingSenderId: "384565535158",
  appId: "1:384565535158:web:b7c6ea2e48c718a05f6117"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testPermissions() {
  console.log("=== [TEST MATCHMAKER & EQUIPMENT PERMISSIONS] ===");
  const userCredential = await signInWithEmailAndPassword(auth, 'test1@gmail.com', 'test1123');
  const user = userCredential.user;
  console.log("✅ Logged in as:", user.uid);

  // 1. Check all waiting rooms
  const q = query(collection(db, 'match_rooms'), where('status', '==', 'waiting'));
  const snap = await getDocs(q);
  console.log(`Found ${snap.docs.length} waiting rooms:`);
  for (const d of snap.docs) {
    const data = d.data();
    console.log(` - Room ID: ${d.id}, player1.uid: ${data.player1?.uid}, isOwner: ${data.player1?.uid === user.uid}`);
  }

  // 2. Test user update on inventory and pendingExtraSlot
  console.log("\nTesting user inventory update...");
  const userRef = doc(db, 'users', user.uid);
  try {
    await updateDoc(userRef, {
      inventory: [{ cardId: 'card_time_freeze', quantity: 5 }],
      pendingExtraSlot: false
    });
    console.log("✅ User inventory update SUCCESS!");
  } catch (err) {
    console.error("❌ User inventory update FAILED:", err.code, err.message);
  }

  // 3. Test room update on player1Equipment and equipmentPhase
  console.log("\nTesting room equipment update...");
  const testRoomId = `test_equip_room_${Date.now()}`;
  const roomRef = doc(db, 'match_rooms', testRoomId);
  await setDoc(roomRef, {
    id: testRoomId,
    subject: 'math',
    status: 'equipment_selecting',
    player1: { uid: user.uid, name: 'Tester' },
    player2: { uid: 'bot_123', name: 'Bot' },
    isBotMatch: true,
    player1Equipment: [],
    player2Equipment: [],
    timeRemaining: 180,
    createdAt: new Date().toISOString()
  });

  try {
    await updateDoc(roomRef, {
      player1Equipment: ['card_time_freeze'],
      'equipmentPhase.p1Ready': true
    });
    console.log("✅ Room equipment update SUCCESS!");
  } catch (err) {
    console.error("❌ Room equipment update FAILED:", err.code, err.message);
  }

  // 4. Test deleteDoc on this room
  console.log("\nTesting deleteDoc on room...");
  try {
    await deleteDoc(roomRef);
    console.log("✅ Room deleteDoc SUCCESS!");
  } catch (err) {
    console.error("❌ Room deleteDoc FAILED:", err.code, err.message);
  }

  // 5. Test deleteDoc on a room that has player1.uid !== user.uid (simulating attempting to delete another room)
  // Or test deleteDoc when status is 'waiting'
  const waitingRoomId = `test_wait_room_${Date.now()}`;
  const waitRoomRef = doc(db, 'match_rooms', waitingRoomId);
  await setDoc(waitRoomRef, {
    id: waitingRoomId,
    subject: 'math',
    status: 'waiting',
    player1: { uid: user.uid, name: 'Tester' },
    player2: null,
    createdAt: new Date().toISOString()
  });

  console.log("\nTesting deleteDoc on waiting room by owner...");
  try {
    await deleteDoc(waitRoomRef);
    console.log("✅ Waiting room deleteDoc SUCCESS!");
  } catch (err) {
    console.error("❌ Waiting room deleteDoc FAILED:", err.code, err.message);
  }

  process.exit(0);
}

testPermissions().catch(err => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
