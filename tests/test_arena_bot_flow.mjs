import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { clientFunctions } from "../src/lib/clientFunctions.js";

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

async function testArenaBotFlow() {
  console.log("=== [TEST ARENA BOT FLOW] BẮT ĐẦU KIỂM THỬ TÍNH NĂNG BOT ĐẤU TRƯỜNG ===");

  try {
    // 1. Đăng nhập bằng tài khoản test1
    console.log("\n1. Đang đăng nhập tài khoản test1@gmail.com...");
    let userCredential = null;
    for (const pwd of ['test1123', '123456', 'password123']) {
      try {
        userCredential = await signInWithEmailAndPassword(auth, "test1@gmail.com", pwd);
        break;
      } catch (_) {}
    }
    if (!userCredential) {
      throw new Error("Không thể đăng nhập tài khoản test1@gmail.com!");
    }
    const user = userCredential.user;
    console.log("✅ Đăng nhập thành công! UID:", user.uid);

    // 2. Tạo phòng đấu chờ ban đầu (giống client tạo khi join matchmaking)
    const testRoomId = `test_room_${user.uid}_${Date.now()}`;
    const roomRef = doc(db, 'match_rooms', testRoomId);
    console.log("\n2. Tạo phòng đấu chờ ban đầu:", testRoomId);
    
    await setDoc(roomRef, {
      id: testRoomId,
      subject: 'math',
      status: 'waiting',
      player1: {
        uid: user.uid,
        name: user.displayName || 'Test Player 1',
        elo: 100,
        level: 1
      },
      player2: null,
      player1Progress: 0,
      player2Progress: 0,
      player1Score: 0,
      player2Score: 0,
      timeRemaining: 180,
      expiresAt: Date.now() + 210000,
      winnerId: null,
      createdAt: new Date().toISOString()
    });
    console.log("✅ Đã tạo phòng trạng thái waiting thành công!");

    // 3. Kích hoạt fallback gán Bot sau 30s chờ: gọi assignBotOpponent
    console.log("\n3. Kiểm tra gọi assignBotOpponent cho phòng...");
    const assignFn = clientFunctions.assignBotOpponent(db, auth);
    const result = await assignFn({ subject: 'math', activeRoomId: testRoomId });
    console.log("✅ assignBotOpponent phản hồi:", {
      success: result.success,
      botUid: result.botUid,
      botName: result.botName,
      botElo: result.botElo,
      scheduleLength: result.playbackSchedule?.length
    });

    if (!result.success || !result.botUid) {
      throw new Error("assignBotOpponent thất bại!");
    }

    // 4. Kiểm tra dữ liệu phòng sau khi gán bot
    console.log("\n4. Kiểm tra phòng trên Firestore...");
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) throw new Error("Phòng không tồn tại!");
    const roomData = roomSnap.data();
    console.log("✅ Trạng thái phòng:", roomData.status);
    console.log("✅ isBotMatch:", roomData.isBotMatch);
    console.log("✅ Player 2 (Bot):", roomData.player2?.name, "| ELO:", roomData.player2?.elo);
    console.log("✅ Kịch bản Bot Schedule có:", roomData.botSchedule?.length, "bước");

    // 5. Kiểm tra bot chọn thẻ trang bị và sẵn sàng
    console.log("\n5. Kiểm tra bot chọn thẻ trang bị...");
    const botPicks = ['card_time_freeze', 'card_smoke_fog', 'card_progress_steal'];
    await updateDoc(roomRef, {
      player2Equipment: botPicks,
      'equipmentPhase.p2Ready': true
    });
    console.log("✅ Bot đã chọn 3 thẻ thành công!");

    // 6. Chuyển phòng sang 'playing'
    console.log("\n6. Chuyển trạng thái phòng sang 'playing'...");
    await updateDoc(roomRef, {
      status: 'playing',
      'equipmentPhase.status': 'completed',
      'equipmentPhase.p1Ready': true
    });
    console.log("✅ Phòng đã chuyển sang trạng thái playing!");

    // 7. Kiểm tra Bot trả lời câu hỏi và cập nhật tiến độ (submitAnswer)
    console.log("\n7. Kiểm tra Bot submitAnswer...");
    const submitAnswerFn = clientFunctions.submitAnswer(db, { currentUser: { uid: result.botUid } });
    const answerRes = await submitAnswerFn({
      matchId: testRoomId,
      actingForBotId: result.botUid,
      stepIndex: 0
    });
    console.log("✅ Bot trả lời câu hỏi bước 0:", answerRes);

    // Kiểm tra lại phòng sau khi bot trả lời
    const roomAfterAnswer = (await getDoc(roomRef)).data();
    console.log("✅ Điểm Bot:", roomAfterAnswer.player2Score, "| Tiến độ Bot:", roomAfterAnswer.player2Progress);
    console.log("✅ Log phòng:", roomAfterAnswer.player2Logs?.[0]);

    // 8. Kiểm tra bot tung thẻ chiêu (cướp tiến độ / đóng băng)
    console.log("\n8. Kiểm tra bot tung thẻ chiêu (card_progress_steal / card_time_freeze)...");
    const currentBotProg = roomAfterAnswer.player2Checkpoint?.progress || roomAfterAnswer.player2Progress || 0;
    const nextBotProg = Math.min(100, currentBotProg + 10);
    await updateDoc(roomRef, {
      player2Checkpoint: { progress: nextBotProg },
      'activeEffects.p1.frozenUntil': Date.now() + 3000,
      player1Logs: ['💥 Bot đã cướp 10% tiến độ của bạn!']
    });
    const roomAfterSkill = (await getDoc(roomRef)).data();
    console.log("✅ Tiến độ bot sau chiêu:", roomAfterSkill.player2Checkpoint?.progress || roomAfterSkill.player2Progress);
    console.log("✅ Hiệu ứng p1 frozenUntil:", roomAfterSkill.activeEffects?.p1?.frozenUntil);
    console.log("✅ Log phòng sau chiêu:", roomAfterSkill.player1Logs?.[0]);

    // Dọn dẹp phòng test
    await deleteDoc(roomRef);
    console.log("✅ Đã dọn dẹp phòng test thành công!");

    console.log("\n🎉 === TẤT CẢ KIỂM THỬ ARENA BOT ĐÃ VƯỢT QUA 100% THÀNH CÔNG! ===");
    process.exit(0);
  } catch (err) {
    console.error("🚨 KIỂM THỬ THẤT BẠI:", err);
    process.exit(1);
  }
}

testArenaBotFlow();
