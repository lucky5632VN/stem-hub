// Script phân tích và sửa đổi/dọn dẹp category "schools" trong Firestore
// Chạy: node scripts/clean_firestore_categories.js
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } = require('firebase/firestore');

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

async function run() {
  console.log("⏳ Đang tải dữ liệu để phân tích...");
  const snapshot = await getDocs(collection(db, 'exams'));
  
  let schoolsExams = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.category === 'schools') {
      schoolsExams.push({ id: doc.id, ...data });
    }
  });

  console.log(`🔍 Tìm thấy ${schoolsExams.length} đề thi có category là 'schools'.`);
  if (schoolsExams.length === 0) {
    console.log("✅ Không có đề thi nào cần sửa!");
    return;
  }

  // Hiển thị một số tiêu đề mẫu để phân loại
  console.log("\nTiêu đề mẫu:");
  schoolsExams.slice(0, 10).forEach(e => {
    console.log(` - [${e.subject}] ${e.title}`);
  });

  console.log("\n🔄 Bắt đầu chuyển đổi: 'schools' -> 'so-gddt' hoặc 'truong-chuyen' dựa theo tiêu đề...");
  
  const batch = writeBatch(db);
  let count = 0;
  let batchCount = 0;

  for (const exam of schoolsExams) {
    let newCategory = 'truong-chuyen'; // Mặc định là trường chuyên & THPT
    
    // Nếu tiêu đề chứa "Sở GD" hoặc "Sở GD&ĐT" -> 'so-gddt'
    if (exam.title.toLowerCase().includes('sở gd') || exam.title.toLowerCase().includes('so gd')) {
      newCategory = 'so-gddt';
    }

    const docRef = doc(db, 'exams', exam.id);
    batch.update(docRef, { category: newCategory });
    count++;
    batchCount++;

    if (batchCount >= 450) {
      console.log(`💾 Đang commit batch ${count}...`);
      await batch.commit();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`\n🎉 Đã cập nhật thành công ${count} đề thi từ 'schools' sang đúng phân loại!`);
}

run().catch(console.error);
