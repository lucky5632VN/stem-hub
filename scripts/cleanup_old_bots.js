// Script xóa hẳn 20 tài khoản bot_user_XX rác cũ trên Firestore
// Chạy: node scripts/cleanup_old_bots.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('../stem-hub-43e96-firebase-adminsdk-fbsvc-d71f6a4cd7.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  console.log("🧹 Bắt đầu dọn dẹp các tài khoản bot_user_XX cũ có ELO cao (>1000) khỏi Firestore...");

  const usersSnap = await db.collection('users').get();
  let deletedCount = 0;

  for (const docSnap of usersSnap.docs) {
    if (docSnap.id.startsWith('bot_user_')) {
      await docSnap.ref.delete();
      console.log(` ❌ Đã xóa tài khoản bot rác cũ: ${docSnap.id} (${docSnap.data().displayName || docSnap.data().name})`);
      deletedCount++;
    }
  }

  console.log(`\n🎉 HOÀN THÀNH! Đã xóa tổng cộng ${deletedCount} tài khoản bot rác khỏi Firestore.`);
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Lỗi khi dọn dẹp:", err);
  process.exit(1);
});
