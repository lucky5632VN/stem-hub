// Script dọn dẹp các dòng AI Reasoning Log bị trùng lặp trên Firebase Firestore DB
// Chạy command: node scripts/cleanup_duplicate_ai_logs.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, deleteDoc, writeBatch } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyD9YsaKNmUXDMxDEAA4CcG_KXdGGfJVEOE",
  authDomain: "cuoc-thi-ai-e2044.firebaseapp.com",
  projectId: "cuoc-thi-ai-e2044",
  storageBucket: "cuoc-thi-ai-e2044.firebasestorage.app",
  messagingSenderId: "384565535158",
  appId: "1:384565535158:web:b7c6ea2e48c718a05f6117",
  measurementId: "G-W00VVRFZ40"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupDuplicateLogs() {
  console.log("⏳ Đang kết nối Firestore và tải toàn bộ ai_reasoning_logs...");
  const snapshot = await getDocs(collection(db, 'ai_reasoning_logs'));
  
  const allLogs = [];
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    allLogs.push({
      docId: docSnap.id,
      ...data
    });
  });

  console.log(`📊 Tìm thấy tổng cộng ${allLogs.length} bản ghi log trên Firestore DB.`);

  if (allLogs.length === 0) {
    console.log("✅ CSDL sạch sẽ, không có bản ghi nào!");
    return;
  }

  // Phân nhóm theo (UserEmail + Query + Khoảng thời gian 30s)
  const groups = new Map();

  allLogs.forEach(log => {
    const email = (log.userEmail || '').toLowerCase();
    const queryStr = (log.query || '').trim().toLowerCase();
    const ts = log.timestamp || 0;
    const timeBucket = Math.floor(ts / 30000); // 30s window

    const groupKey = `${email}___${queryStr}___${timeBucket}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey).push(log);
  });

  let duplicateCount = 0;
  const docsToDelete = [];

  groups.forEach((logsInGroup, key) => {
    if (logsInGroup.length > 1) {
      // Sắp xếp ưu tiên: Bản ghi CÓ aiResponseText lên đầu, sau đó mới đến timestamp mới nhất
      logsInGroup.sort((a, b) => {
        const hasAnsA = a.aiResponseText ? 1 : 0;
        const hasAnsB = b.aiResponseText ? 1 : 0;
        if (hasAnsA !== hasAnsB) return hasAnsB - hasAnsA;
        return (b.timestamp || 0) - (a.timestamp || 0);
      });

      // Giữ lại log đầu tiên (logsInGroup[0]), xóa tất cả bản ghi dư thừa phía sau
      const keep = logsInGroup[0];
      const duplicates = logsInGroup.slice(1);

      console.log(`📌 Nhóm trùng [${key.split('___')[1]}]: Giữ lại 1 bản ghi chính (${keep.docId}), loại bỏ ${duplicates.length} bản ghi rác.`);

      duplicates.forEach(dup => {
        docsToDelete.push(dup.docId);
        duplicateCount++;
      });
    }
  });

  if (docsToDelete.length === 0) {
    console.log("🎉 Không tìm thấy log trùng lặp nào cần xóa! CSDL đã hoàn toàn sạch sẽ.");
    return;
  }

  console.log(`\n🗑️ Tiến hành xóa ${docsToDelete.length} bản ghi log trùng lặp khỏi Firestore DB...`);

  let deletedBatchCount = 0;
  for (let i = 0; i < docsToDelete.length; i += 400) {
    const chunk = docsToDelete.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach(id => {
      batch.delete(doc(db, 'ai_reasoning_logs', id));
    });
    await batch.commit();
    deletedBatchCount += chunk.length;
    console.log(`  -> Đã xóa ${deletedBatchCount}/${docsToDelete.length} bản ghi trùng.`);
  }

  console.log(`\n✅ HOÀN TẤT! Đã dọn dẹp sạch sẽ ${deletedCountBatchCount} bản ghi trùng lặp khỏi Firestore DB!`);
}

cleanupDuplicateLogs().catch(err => {
  console.error("❌ Lỗi khi dọn dẹp log:", err);
});
