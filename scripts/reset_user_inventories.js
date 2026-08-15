// Script xóa toàn bộ kho thẻ trang bị (inventory) của người dùng thường trên Firestore, giữ lại tài khoản Admin.
// Chạy: node scripts/reset_user_inventories.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('../stem-hub-43e96-firebase-adminsdk-fbsvc-d71f6a4cd7.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  console.log("🧹 Bắt đầu xóa kho thẻ trang bị của tất cả tài khoản người dùng thường (trừ Admin)...");

  const usersSnap = await db.collection('users').get();
  let updatedCount = 0;
  let skippedAdminCount = 0;

  for (const docSnap of usersSnap.docs) {
    const data = docSnap.data();
    const uid = docSnap.id;
    const name = (data.displayName || data.name || '').toLowerCase();
    const email = (data.email || '').toLowerCase();
    const role = (data.role || '').toLowerCase();

    const isAdmin = role === 'admin' || email.includes('admin') || name.includes('admin') || uid.toLowerCase().includes('admin');

    if (isAdmin) {
      console.log(` 👑 GIỮ NGUYÊN Admin: ${uid} (${data.displayName || name})`);
      skippedAdminCount++;
    } else {
      await docSnap.ref.update({
        inventory: []
      });
      console.log(` ❌ Đã xóa sạch thẻ bài của người dùng: ${uid} (${data.displayName || name})`);
      updatedCount++;
    }
  }

  console.log(`\n🎉 HOÀN THÀNH!`);
  console.log(`- Đã xóa kho thẻ của ${updatedCount} người dùng thường.`);
  console.log(`- Đã giữ nguyên quyền cho ${skippedAdminCount} tài khoản Admin.`);
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Lỗi khi dọn dẹp kho thẻ:", err);
  process.exit(1);
});
