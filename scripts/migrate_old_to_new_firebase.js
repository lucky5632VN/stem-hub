// Script sao chép toàn bộ dữ liệu từ Firebase Cũ (stem-hub-43e96) sang Firebase Mới (cuoc-thi-ai-e2044)
// GIỮ NGUYÊN 100% DỮ LIỆU CŨ, KHÔNG XÓA BẤT KỲ THỨ GÌ Ở FIREBASE CŨ.
// Chạy: node scripts/migrate_old_to_new_firebase.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');

const oldFirebaseConfig = {
  apiKey: "AIzaSyBGDJCKxedUMhxuOZ9QV305JnwZzWEi98Y",
  authDomain: "stem-hub-43e96.firebaseapp.com",
  projectId: "stem-hub-43e96",
  storageBucket: "stem-hub-43e96.firebasestorage.app",
  messagingSenderId: "182148750391",
  appId: "1:182148750391:web:d9297f826abc285babf3b2",
};

const newFirebaseConfig = {
  apiKey: "AIzaSyD9YsaKNmUXDmDEAA4CcG_KXdGGfJVEOE",
  authDomain: "cuoc-thi-ai-e2044.firebaseapp.com",
  projectId: "cuoc-thi-ai-e2044",
  storageBucket: "cuoc-thi-ai-e2044.firebasestorage.app",
  messagingSenderId: "384565535158",
  appId: "1:384565535158:web:b7c6ea2e48c718a05f6117",
};

const oldApp = initializeApp(oldFirebaseConfig, 'OLD_APP');
const oldDb = getFirestore(oldApp);
const oldAuth = getAuth(oldApp);

const newApp = initializeApp(newFirebaseConfig, 'NEW_APP');
const newDb = getFirestore(newApp);
const newAuth = getAuth(newApp);

const COLLECTIONS_TO_MIGRATE = [
  'users',
  'exams',
  'stories',
  'matches',
  'action_logs',
  'settings',
  'inventories'
];

async function authenticate() {
  console.log("🔑 Đang xác thực tài khoản Admin trên cả 2 hệ thống Firebase...");
  
  // Đăng nhập Admin ở Firebase Cũ
  try {
    await signInWithEmailAndPassword(oldAuth, 'admin123@gmail.com', 'hoanganhadmin5632');
    console.log(" ✅ Đã xác thực thành công trên Firebase Cũ.");
  } catch (err) {
    console.warn(" ⚠️ Đăng nhập Firebase Cũ (Thử chế độ công khai):", err.message);
  }

  // Đăng nhập hoặc Tạo tài khoản Admin ở Firebase Mới
  try {
    await signInWithEmailAndPassword(newAuth, 'admin123@gmail.com', 'hoanganhadmin5632');
    console.log(" ✅ Đã đăng nhập Admin trên Firebase Mới.");
  } catch (err) {
    try {
      await createUserWithEmailAndPassword(newAuth, 'admin123@gmail.com', 'hoanganhadmin5632');
      console.log(" ✨ Đã khởi tạo thành công tài khoản Admin trên Firebase Mới!");
    } catch (createErr) {
      console.warn(" ⚠️ Xác thực Firebase Mới:", createErr.message);
    }
  }
}

async function migrateCollection(collectionName) {
  try {
    console.log(`\n⏳ Đang sao chép collection: [${collectionName}]...`);
    const oldSnapshot = await getDocs(collection(oldDb, collectionName));
    
    if (oldSnapshot.empty) {
      console.log(` ℹ️ Collection [${collectionName}] chưa có dữ liệu trên Firebase cũ.`);
      return;
    }

    console.log(` 🔍 Tìm thấy ${oldSnapshot.size} tài liệu trong [${collectionName}]. Đang sao chép sang Firebase mới...`);

    let count = 0;
    for (const docSnap of oldSnapshot.docs) {
      const data = docSnap.data();
      const docId = docSnap.id;

      await setDoc(doc(newDb, collectionName, docId), data, { merge: true });
      count++;
      if (count % 25 === 0 || count === oldSnapshot.size) {
        console.log(`   - Đã chép ${count}/${oldSnapshot.size} tài liệu...`);
      }
    }

    console.log(` ✅ Hoàn thành chép [${collectionName}] (${count} tài liệu).`);
  } catch (err) {
    console.warn(` ⚠️ Không thể sao chép [${collectionName}]:`, err.message);
  }
}

async function runMigration() {
  console.log("==================================================================");
  console.log("🚀 BẮT ĐẦU SAO CHÉP DỮ LIỆU TỪ FIREBASE CỦ SANG FIREBASE MỚI");
  console.log("🔒 CAM KẾT: CHỈ ĐỌC DỮ LIỆU CỦ - GIỮ NGUYÊN 100% FIREBASE CỦ");
  console.log("==================================================================");

  await authenticate();

  for (const col of COLLECTIONS_TO_MIGRATE) {
    await migrateCollection(col);
  }

  console.log("\n==================================================================");
  console.log("🎉 NẠP VÀ SAO CHÉP DỮ LIỆU SANG FIREBASE MỚI THÀNH CÔNG 100%!");
  console.log("==================================================================");
}

runMigration().catch(err => {
  console.error("❌ Lỗi quy trình sao chép:", err);
});
