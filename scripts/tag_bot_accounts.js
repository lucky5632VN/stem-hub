// Script khởi tạo / gắn tag 20 tài khoản bot test thực tế từ Danh_sach_20_tai_khoan_test.docx trên Firestore
// Chạy: node scripts/tag_bot_accounts.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('../stem-hub-43e96-firebase-adminsdk-fbsvc-d71f6a4cd7.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// 20 tài khoản bot chuẩn từ file Danh_sach_20_tai_khoan_test.docx (mức Elo từ 50 đến 130)
const REAL_TEST_BOT_ACCOUNTS = [
  { email: 'test1@gmail.com', name: 'Nguyễn Minh Khang', elo: 130, level: 4, wins: 8, losses: 3 },
  { email: 'test2@gmail.com', name: 'Trần Thị Thanh Vân', elo: 70, level: 3, wins: 5, losses: 3 },
  { email: 'test3@gmail.com', name: 'Lê Hoàng Nam', elo: 70, level: 3, wins: 5, losses: 3 },
  { email: 'test4@gmail.com', name: 'Phạm Minh Anh', elo: 90, level: 6, wins: 8, losses: 7 },
  { email: 'test5@gmail.com', name: 'Vũ Hoàng Bách', elo: 80, level: 3, wins: 5, losses: 2 },
  { email: 'test6@gmail.com', name: 'Đặng Thùy Dương', elo: 50, level: 3, wins: 4, losses: 3 },
  { email: 'test7@gmail.com', name: 'Nguyễn Gia Bảo', elo: 60, level: 4, wins: 5, losses: 4 },
  { email: 'test8@gmail.com', name: 'Bùi Minh Triết', elo: 70, level: 3, wins: 5, losses: 3 },
  { email: 'test9@gmail.com', name: 'Phan Thanh Hằng', elo: 80, level: 5, wins: 7, losses: 6 },
  { email: 'test10@gmail.com', name: 'Nguyễn Tiến Đạt', elo: 90, level: 5, wins: 7, losses: 5 },
  { email: 'test11@gmail.com', name: 'Trần Đức Lộc', elo: 50, level: 2, wins: 3, losses: 1 },
  { email: 'test12@gmail.com', name: 'Hoàng Khánh Linh', elo: 90, level: 6, wins: 8, losses: 7 },
  { email: 'test13@gmail.com', name: 'Phạm Đăng Khoa', elo: 50, level: 2, wins: 3, losses: 1 },
  { email: 'test14@gmail.com', name: 'Vũ Thảo Nguyên', elo: 70, level: 2, wins: 4, losses: 1 },
  { email: 'test15@gmail.com', name: 'Nguyễn Hải Phong', elo: 110, level: 3, wins: 6, losses: 1 },
  { email: 'test16@gmail.com', name: 'Lê Cát Tường', elo: 100, level: 3, wins: 6, losses: 2 },
  { email: 'test17@gmail.com', name: 'Nguyễn Quốc Anh', elo: 60, level: 3, wins: 4, losses: 2 },
  { email: 'test18@gmail.com', name: 'Đỗ Gia Huy', elo: 90, level: 5, wins: 7, losses: 5 },
  { email: 'test19@gmail.com', name: 'Trần Mai Phương', elo: 110, level: 4, wins: 7, losses: 3 },
  { email: 'test20@gmail.com', name: 'Lê Thanh Tùng', elo: 130, level: 4, wins: 8, losses: 3 }
];

async function run() {
  console.log("🚀 Bắt đầu gắn tag 20 tài khoản Bot Test chính thức từ Danh_sach_20_tai_khoan_test.docx...");

  // 1. Xóa flag isBotAccount khỏi các tài khoản dummy bot_user_XX cũ
  const oldDummySnap = await db.collection('users').where('isBotAccount', '==', true).get();
  for (const docSnap of oldDummySnap.docs) {
    if (docSnap.id.startsWith('bot_user_')) {
      await docSnap.ref.update({
        isBotAccount: false,
        botStatus: 'disabled'
      });
      console.log(` - Đã hủy tag bot giả cũ: ${docSnap.id}`);
    }
  }

  // 2. Tìm và gắn tag isBotAccount + botStatus = available cho 20 tài khoản test thật
  const allUsersSnap = await db.collection('users').get();
  const userByEmail = {};
  allUsersSnap.docs.forEach(docSnap => {
    const data = docSnap.data();
    if (data.email) {
      userByEmail[data.email.toLowerCase().trim()] = docSnap;
    }
  });

  for (const botData of REAL_TEST_BOT_ACCOUNTS) {
    const emailKey = botData.email.toLowerCase().trim();
    const existingDoc = userByEmail[emailKey];

    const updatePayload = {
      isBotAccount: true,
      botStatus: 'available',
      displayName: botData.name,
      name: botData.name,
      'stats.elo': botData.elo,
      'stats.level': botData.level,
      'stats.wins': botData.wins,
      'stats.losses': botData.losses,
      'personalization.elo': botData.elo,
      'personalization.level': botData.level,
      'personalization.activeTitle': 'apprentice',
      'personalization.avatarFrame': 'default',
      updatedAt: new Date().toISOString()
    };

    if (existingDoc) {
      await existingDoc.ref.update(updatePayload);
      console.log(` ✅ Đã cập nhật tag bot thực tế: ${botData.email} (${botData.name}) - Elo: ${botData.elo}`);
    } else {
      // Tạo mới nếu chưa có
      const docId = `bot_${botData.email.split('@')[0]}`;
      await db.collection('users').doc(docId).set({
        uid: docId,
        email: botData.email,
        role: 'student',
        ...updatePayload,
        stats: {
          elo: botData.elo,
          level: botData.level,
          wins: botData.wins,
          losses: botData.losses,
          exp: botData.level * 500,
          nextLevelExp: botData.level * 1000
        },
        personalization: {
          elo: botData.elo,
          level: botData.level,
          activeTitle: 'apprentice',
          avatarFrame: 'default',
          crystals: 1000
        }
      });
      console.log(` ✨ Đã tạo mới và gắn tag bot thực tế: ${botData.email} (${botData.name}) - Elo: ${botData.elo}`);
    }
  }

  console.log("\n🎉 HOÀN THÀNH GẮN TAG 20 TÀI KHOẢN BOT TEST THỰC TẾ TRÊN FIRESTORE!");
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Lỗi khi gắn tag tài khoản bot:", err);
  process.exit(1);
});
