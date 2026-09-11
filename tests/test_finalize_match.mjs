import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { clientFunctions } from '../src/lib/clientFunctions.js';

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

async function testFinalize() {
  console.log("=== [TEST FINALIZE MATCH FLOW] ===");
  const userCredential = await signInWithEmailAndPassword(auth, 'test1@gmail.com', 'test1123');
  const user = userCredential.user;
  console.log("✅ Đăng nhập thành công:", user.uid);

  const testRoomId = `test_fin_room_${Date.now()}`;
  const roomRef = doc(db, 'match_rooms', testRoomId);

  // Tạo phòng bot match
  await setDoc(roomRef, {
    player1: { uid: user.uid, name: 'Tester', elo: 100 },
    player2: { uid: 'bot_uid_123', name: 'Bot Tester', elo: 100 },
    isBotMatch: true,
    status: 'playing',
    timeRemaining: 180,
    player1Progress: 50,
    player2Progress: 80,
    subject: 'math',
    createdAt: Date.now()
  });

  console.log("✅ Đã tạo phòng bot match:", testRoomId);

  // Test finalizeMatch
  const finalizeFn = clientFunctions.finalizeMatch(db, auth);
  const result = await finalizeFn({ matchId: testRoomId, force: true, reason: 'NORMAL' });
  console.log("✅ finalizeMatch kết quả:", result);

  // Đọc lại phòng từ Firestore
  const snap = await getDoc(roomRef);
  const data = snap.data();
  console.log("✅ Trạng thái phòng sau finalize:", data.status);
  console.log("✅ matchWinner:", data.matchWinner);
  console.log("✅ player1EloChange:", data.player1EloChange);
  console.log("✅ player2EloChange:", data.player2EloChange);

  if (data.status === 'result' && data.matchWinner === 'bot_uid_123') {
    console.log("🎉 FINALIZE MATCH HOẠT ĐỘNG HOÀN HẢO!");
  } else {
    console.error("❌ Trạng thái không khớp!");
  }

  await deleteDoc(roomRef);
  console.log("✅ Đã dọn dẹp phòng test.");
  process.exit(0);
}

testFinalize().catch(err => {
  console.error("❌ Lỗi test finalizeMatch:", err);
  process.exit(1);
});
