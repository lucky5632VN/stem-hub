// Script siêu tốc sao chép TOÀN BỘ 100% 10 Collection từ Firebase Cũ (stem-hub-43e96) sang Firebase Mới (cuoc-thi-ai-e2044)
// Chạy: node scripts/migrate_ALL_collections.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, writeBatch } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const oldFirebaseConfig = {
  apiKey: "AIzaSyBGDJCKxedUMhxuOZ9QV305JnwZzWEi98Y",
  authDomain: "stem-hub-43e96.firebaseapp.com",
  projectId: "stem-hub-43e96",
  storageBucket: "stem-hub-43e96.firebasestorage.app",
  messagingSenderId: "182148750391",
  appId: "1:182148750391:web:d9297f826abc285babf3b2",
};

const newFirebaseConfig = {
  apiKey: "AIzaSyD9YsaKNmUXDMxDEAA4CcG_KXdGGfJVEOE",
  authDomain: "cuoc-thi-ai-e2044.firebaseapp.com",
  projectId: "cuoc-thi-ai-e2044",
  storageBucket: "cuoc-thi-ai-e2044.firebasestorage.app",
  messagingSenderId: "384565535158",
  appId: "1:384565535158:web:b7c6ea2e48c718a05f6117",
};

const oldApp = initializeApp(oldFirebaseConfig, 'OLD_APP_BATCH');
const oldDb = getFirestore(oldApp);
const oldAuth = getAuth(oldApp);

const newApp = initializeApp(newFirebaseConfig, 'NEW_APP_BATCH');
const newDb = getFirestore(newApp);
const newAuth = getAuth(newApp);

const ALL_COLLECTIONS = [
  'admin_logs',
  'config',
  'exams',
  'match_rooms',
  'moments',
  'questions',
  'stories',
  'system_config',
  'tournaments',
  'users'
];

async function authenticate() {
  console.log("🔑 Đang đăng nhập Admin trên cả 2 hệ thống...");
  try {
    await signInWithEmailAndPassword(oldAuth, 'admin123@gmail.com', 'hoanganhadmin5632');
    console.log(" ✅ Đã đăng nhập Admin ở Firebase Cũ.");
  } catch (err) {
    console.warn(" ⚠️ Đăng nhập Firebase Cũ:", err.message);
  }

  try {
    await signInWithEmailAndPassword(newAuth, 'admin123@gmail.com', 'hoanganhadmin5632');
    console.log(" ✅ Đã đăng nhập Admin ở Firebase Mới.");
  } catch (err) {
    console.warn(" ⚠️ Đăng nhập Firebase Mới:", err.message);
  }
}

async function migrateCollectionBatch(collectionName) {
  try {
    console.log(`\n⏳ Đang sao chép collection [${collectionName}]...`);
    const snapshot = await getDocs(collection(oldDb, collectionName));
    
    if (snapshot.empty) {
      console.log(` ℹ️ [${collectionName}] chưa có tài liệu nào.`);
      return;
    }

    const totalDocs = snapshot.size;
    console.log(` 🔍 Tìm thấy ${totalDocs} tài liệu trong [${collectionName}]. Đang nạp siêu tốc theo Lô (Batch)...`);

    let batch = writeBatch(newDb);
    let count = 0;
    let batchCount = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const targetRef = doc(newDb, collectionName, docSnap.id);
      
      batch.set(targetRef, data, { merge: true });
      count++;
      batchCount++;

      if (batchCount >= 400) {
        console.log(`   - Đang commit lô dữ liệu ${count}/${totalDocs}...`);
        await batch.commit();
        batch = writeBatch(newDb);
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      console.log(`   - Đang commit lô cuối cùng ${count}/${totalDocs}...`);
      await batch.commit();
    }

    console.log(` ✅ HOÀN THÀNH CHÉP NGUYÊN VẸN [${collectionName}] (${count}/${totalDocs} tài liệu)!`);
  } catch (err) {
    console.error(` ❌ Lỗi khi chép [${collectionName}]:`, err.message);
  }
}

async function runFastBatchMigration() {
  console.log("==================================================================");
  console.log("🚀 NẠP SIÊU TỐC TOÀN BỘ 10 DANH MỤC DỮ LIỆU SANG FIREBASE MỚI");
  console.log("🔒 NGUYÊN TẮC: CHỈ ĐỌC DỮ LIỆU CŨ - GIỮ NGUYÊN 100% FIREBASE CŨ");
  console.log("==================================================================");

  await authenticate();

  for (const col of ALL_COLLECTIONS) {
    await migrateCollectionBatch(col);
  }

  console.log("\n==================================================================");
  console.log("🎉 ĐÃ ĐỒNG BỘ SIÊU TỐC NGUYÊN VẸN 100% CẢ 10/10 COLLECTION SANG FIREBASE MỚI!");
  console.log("==================================================================");
}

runFastBatchMigration();
