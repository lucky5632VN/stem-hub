const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('../stem-hub-43e96-firebase-adminsdk-fbsvc-d71f6a4cd7.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Real-sounding opponent names for high variety
const OPPONENTS = [
  { name: 'Hồ Thị A', avatarFrame: 'legendary', avatarParts: null },
  { name: 'Trần Thị Thanh Vân', avatarFrame: 'cyber_gold', avatarParts: null },
  { name: 'Phạm Minh Anh', avatarFrame: 'neon_blue', avatarParts: null },
  { name: 'Bùi Minh Triết', avatarFrame: 'fire_flame', avatarParts: null },
  { name: 'Hoàng Khánh Linh', avatarFrame: 'emerald_shield', avatarParts: null },
  { name: 'Đặng Thùy Dương', avatarFrame: 'galaxy_purple', avatarParts: null },
  { name: 'Nguyễn Minh Khang', avatarFrame: 'champion_star', avatarParts: null },
  { name: 'Phan Thanh Hằng', avatarFrame: 'default', avatarParts: null },
];

// Alternating 7 Wins / 3 Losses pattern (index 0 is newest match)
// 1: Win, 2: Loss, 3: Win, 4: Win, 5: Loss, 6: Win, 7: Win, 8: Loss, 9: Win, 10: Win
// Total Wins = 7, Total Losses = 3
const MATCH_PATTERN = [
  { result: 'win', offsetMinutes: 2, oppIndex: 0 },    // Hồ Thị A - Win
  { result: 'loss', offsetMinutes: 12, oppIndex: 0 },   // Hồ Thị A - Loss
  { result: 'win', offsetMinutes: 30, oppIndex: 1 },    // Trần Thị Thanh Vân - Win
  { result: 'loss', offsetMinutes: 75, oppIndex: 2 },   // Phạm Minh Anh - Loss
  { result: 'win', offsetMinutes: 150, oppIndex: 3 },   // Bùi Minh Triết - Win
  { result: 'win', offsetMinutes: 240, oppIndex: 4 },   // Hoàng Khánh Linh - Win
  { result: 'loss', offsetMinutes: 380, oppIndex: 5 },  // Đặng Thùy Dương - Loss
  { result: 'win', offsetMinutes: 600, oppIndex: 6 },   // Nguyễn Minh Khang - Win
  { result: 'win', offsetMinutes: 900, oppIndex: 7 },   // Phan Thanh Hằng - Win
  { result: 'win', offsetMinutes: 1300, oppIndex: 1 },  // Trần Thị Thanh Vân - Win
];

async function seedHistory() {
  console.log("🌱 Bắt đầu tạo 10 trận đấu lịch sử môn Sinh học (7 Thắng / 3 Thua xen kẽ)...");

  // 1. Tìm user test3@gmail.com
  let test3UserDoc = null;
  const usersSnap = await db.collection('users').where('email', '==', 'test3@gmail.com').get();

  if (usersSnap.empty) {
    console.log("⚠️ Không tìm thấy test3@gmail.com trong `users`, sẽ dùng fallback UID 'test3_user'");
    test3UserDoc = {
      uid: 'test3_user',
      name: 'Lê Hoàng Nam',
      avatarFrame: 'default'
    };
  } else {
    const uDoc = usersSnap.docs[0];
    test3UserDoc = {
      uid: uDoc.id,
      name: uDoc.data().name || uDoc.data().displayName || 'Lê Hoàng Nam',
      avatarFrame: uDoc.data().avatarFrame || 'default',
      avatarParts: uDoc.data().avatarParts || null
    };
  }

  console.log(`👤 Đối tượng ghép trận: ${test3UserDoc.name} (${test3UserDoc.uid})`);

  // 2. Clear các match_rooms cũ có chứa test3UserDoc.uid
  const p1Snap = await db.collection('match_rooms').where('player1.uid', '==', test3UserDoc.uid).get();
  const p2Snap = await db.collection('match_rooms').where('player2.uid', '==', test3UserDoc.uid).get();

  const deleteBatch = db.batch();
  p1Snap.docs.forEach(doc => deleteBatch.delete(doc.ref));
  p2Snap.docs.forEach(doc => deleteBatch.delete(doc.ref));
  await deleteBatch.commit();
  console.log("🧹 Đã xóa lịch sử đấu cũ trên Firestore.");

  // 3. Tạo 10 trận đấu mới môn Sinh học
  const now = Date.now();
  const createBatch = db.batch();

  MATCH_PATTERN.forEach((item, index) => {
    const opp = OPPONENTS[item.oppIndex % OPPONENTS.length];
    const matchTime = new Date(now - item.offsetMinutes * 60 * 1000).toISOString();
    const isWin = item.result === 'win';

    const oppUid = `bot_opp_${index}_${Date.now()}`;
    const roomRef = db.collection('match_rooms').doc(`seed_bio_match_${index}_${Date.now()}`);

    const roomData = {
      subject: 'biology',
      status: 'result',
      winnerId: isWin ? test3UserDoc.uid : oppUid,
      createdAt: matchTime,
      player1: {
        uid: test3UserDoc.uid,
        name: test3UserDoc.name,
        elo: 100,
        level: 3,
        avatarFrame: test3UserDoc.avatarFrame,
        avatarParts: test3UserDoc.avatarParts
      },
      player2: {
        uid: oppUid,
        name: opp.name,
        elo: 95,
        level: 3,
        avatarFrame: opp.avatarFrame,
        avatarParts: opp.avatarParts
      },
      player1EloChange: isWin ? 25 : -15,
      player2EloChange: isWin ? -15 : 25,
      player1Score: isWin ? 100 : 60,
      player2Score: isWin ? 60 : 100,
      matchData: {
        challengeMode: 'mcq'
      }
    };

    createBatch.set(roomRef, roomData);
  });

  await createBatch.commit();
  console.log("✅ Đã tạo thành công 10 trận đấu Sinh Học (7 Thắng - 3 Thua) cho test3!");
  process.exit(0);
}

seedHistory().catch(err => {
  console.error("🚨 Lỗi khi seed lịch sử đấu:", err);
  process.exit(1);
});
