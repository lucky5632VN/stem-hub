// Script cấp full 10 loại thẻ bài (số lượng 99) cho tất cả tài khoản Admin trên Firestore.
// Chạy: node scripts/give_admin_full_inventory.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('../stem-hub-43e96-firebase-adminsdk-fbsvc-d71f6a4cd7.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const FULL_CATALOG = [
  { cardId: 'card_elo_shield', quantity: 99 },
  { cardId: 'card_crystal_magnet', quantity: 99 },
  { cardId: 'card_subject_ban', quantity: 99 },
  { cardId: 'card_incognito', quantity: 99 },
  { cardId: 'card_wildcard_slot', quantity: 99 },
  { cardId: 'card_time_freeze', quantity: 99 },
  { cardId: 'card_smoke_fog', quantity: 99 },
  { cardId: 'card_progress_steal', quantity: 99 },
  { cardId: 'card_ai_assist', quantity: 99 },
  { cardId: 'card_dispel', quantity: 99 }
];

async function run() {
  console.log("👑 Bắt đầu cập nhật Full 10 Thẻ bài (số lượng 99) cho các tài khoản Admin trên Firestore...");

  const usersSnap = await db.collection('users').get();
  let updatedAdminCount = 0;

  for (const docSnap of usersSnap.docs) {
    const data = docSnap.data();
    const uid = docSnap.id;
    const name = (data.displayName || data.name || '').toLowerCase();
    const email = (data.email || '').toLowerCase();
    const role = (data.role || '').toLowerCase();

    const isAdmin = role === 'admin' || email.includes('admin') || name.includes('admin') || uid.toLowerCase().includes('admin');

    if (isAdmin) {
      await docSnap.ref.update({
        role: 'admin',
        inventory: FULL_CATALOG
      });
      console.log(` ✅ Đã cập nhật Full 10 loại thẻ bài (x99) cho Admin: ${uid} (${data.displayName || name})`);
      updatedAdminCount++;
    }
  }

  console.log(`\n🎉 HOÀN THÀNH! Đã cấp Full kho thẻ cho ${updatedAdminCount} tài khoản Admin.`);
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Lỗi khi cập nhật kho thẻ Admin:", err);
  process.exit(1);
});
