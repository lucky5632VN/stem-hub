// Script seed dữ liệu mẫu actionLogs và phòng đấu nghi vấn gian lận
// Chạy: node scripts/seedActionLogs.js
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, collection, getDocs, doc, setDoc, deleteDoc, writeBatch 
} = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyBGDJCKxedUMhxuOZ9QV305JnwZzWEi98Y",
  authDomain: "stem-hub-43e96.firebaseapp.com",
  projectId: "stem-hub-43e96",
  storageBucket: "stem-hub-43e96.firebasestorage.app",
  messagingSenderId: "182148750391",
  appId: "1:182148750391:web:d9297f826abc285babf3b2",
  measurementId: "G-1D80591ZNN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const matchId = 'demo_match_fraud_123';

const mockLogs = [
  { offsetSeconds: 0, userId: 'system', playerName: 'Hệ thống', actionText: 'Trận đấu bắt đầu. Phòng thi đấu số #123 đã được thiết lập.' },
  { offsetSeconds: 20, userId: 'user_p1', playerName: 'Nguyễn Văn Hùng', actionText: 'Đã trả lời ĐÚNG câu hỏi số 1 (Vật lý - Động lực học).' },
  { offsetSeconds: 35, userId: 'user_p2', playerName: 'Trần Minh Khôi', actionText: 'Đã trả lời ĐÚNG câu hỏi số 1 (Vật lý - Động lực học).' },
  { offsetSeconds: 50, userId: 'user_p1', playerName: 'Nguyễn Văn Hùng', actionText: 'Phát hiện rời khỏi màn hình thi đấu lần 1 (Cảnh báo chuyển tab).' },
  { offsetSeconds: 70, userId: 'user_p2', playerName: 'Trần Minh Khôi', actionText: 'Đã trả lời SAI câu hỏi số 2 (Vật lý - Nhiệt học).' },
  { offsetSeconds: 85, userId: 'user_p1', playerName: 'Nguyễn Văn Hùng', actionText: 'Đã trả lời ĐÚNG câu hỏi số 2 (Vật lý - Nhiệt học).' },
  { offsetSeconds: 100, userId: 'user_p1', playerName: 'Nguyễn Văn Hùng', actionText: 'Phát hiện rời khỏi màn hình thi đấu lần 2.' },
  { offsetSeconds: 120, userId: 'user_p1', playerName: 'Nguyễn Văn Hùng', actionText: 'Kích hoạt Sabotage: Che màn hình phòng thi của đối thủ!' },
  { offsetSeconds: 140, userId: 'user_p2', playerName: 'Trần Minh Khôi', actionText: 'Đã trả lời ĐÚNG câu hỏi số 3 (Vật lý - Quang học).' },
  { offsetSeconds: 160, userId: 'user_p1', playerName: 'Nguyễn Văn Hùng', actionText: 'Phát hiện rời khỏi màn hình thi đấu lần 3.' },
  { offsetSeconds: 180, userId: 'user_p1', playerName: 'Nguyễn Văn Hùng', actionText: 'Phát hiện rời khỏi màn hình thi đấu lần 4. 🚨 Cảnh báo vi phạm: Số lần chuyển tab vượt quá giới hạn cho phép!' },
  { offsetSeconds: 200, userId: 'user_p1', playerName: 'Nguyễn Văn Hùng', actionText: 'Đã hoàn thành toàn bộ bài thi. Trực quan hóa kết quả.' },
  { offsetSeconds: 220, userId: 'system', playerName: 'Hệ thống', actionText: 'Trận đấu kết thúc. Kết quả: Nguyễn Văn Hùng thắng (+25 ELO), Trần Minh Khôi thua (-15 ELO).' }
];

async function run() {
  console.log("🔑 Đang đăng nhập tài khoản Admin...");
  await signInWithEmailAndPassword(auth, 'admin123@gmail.com', 'hoanganhadmin5632');
  console.log("✅ Đăng nhập Admin thành công!");

  console.log(`⏳ Đang thiết lập phòng đấu demo "${matchId}"...`);
  
  // 1. Tạo hoặc cập nhật tài liệu match room
  const matchRef = doc(db, 'match_rooms', matchId);
  const matchData = {
    id: matchId,
    subject: 'physics',
    status: 'finished',
    player1: {
      uid: 'user_p1',
      name: 'Nguyễn Văn Hùng',
      elo: 1050
    },
    player2: {
      uid: 'user_p2',
      name: 'Trần Minh Khôi',
      elo: 1080
    },
    player1Progress: 100,
    player2Progress: 75,
    player1TabSwitches: 4, // > 3, tự động kích hoạt flagged
    player2TabSwitches: 0,
    flagged: true, // Gắn cờ nghi vấn gian lận
    winnerId: 'user_p1',
    isCancelled: false,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 phút trước
  };

  await setDoc(matchRef, matchData);
  console.log("✅ Đã ghi nhận phòng đấu mẫu.");

  // 2. Tạo subcollection actionLogs
  console.log("⏳ Đang dọn dẹp subcollection actionLogs cũ...");
  const logsSnapshot = await getDocs(collection(db, 'match_rooms', matchId, 'actionLogs'));
  const deleteBatch = writeBatch(db);
  logsSnapshot.forEach(docSnap => {
    deleteBatch.delete(docSnap.ref);
  });
  await deleteBatch.commit();
  console.log("✅ Đã dọn dẹp xong actionLogs cũ.");

  console.log("⏳ Đang nạp các dòng nhật ký (actionLogs)...");
  const baseTime = Date.now() - 5 * 60 * 1000; // 5 phút trước
  
  for (let i = 0; i < mockLogs.length; i++) {
    const log = mockLogs[i];
    const logDocRef = doc(collection(db, 'match_rooms', matchId, 'actionLogs'));
    const logTime = new Date(baseTime + log.offsetSeconds * 1000);
    
    await setDoc(logDocRef, {
      userId: log.userId,
      playerName: log.playerName,
      actionText: log.actionText,
      timestamp: logTime.toISOString()
    });
  }
  
  console.log(`🎉 Seed dữ liệu thành công cho trận đấu ${matchId}!`);
  console.log(`👉 Hãy truy cập trang Giám sát Trận đấu trên Admin Panel để xem kết quả.`);
}

run().catch(err => {
  console.error("❌ Lỗi khi chạy seed script:", err);
});
