// Script xóa toàn bộ đề thi cũ trên Firestore và nạp lại 400 đề thi đầy đủ từ exams_seed.js
// Chạy: node scripts/reseed_firestore.js
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, writeBatch } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const fs = require('fs');
const path = require('path');

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
const auth = getAuth(app);

async function run() {
  console.log("⏳ Bắt đầu quy trình nạp lại dữ liệu đề thi trên Firestore...");

  // 1. Đăng nhập với tài khoản Admin để có quyền ghi/xóa trên Firestore
  console.log("🔑 Đang đăng nhập tài khoản Admin...");
  await signInWithEmailAndPassword(auth, 'admin123@gmail.com', 'hoanganhadmin5632');
  console.log("✅ Đăng nhập Admin thành công!");

  // 2. Đọc danh sách đề thi mẫu từ exams_seed.js
  const seedFilePath = path.join(__dirname, '../src/data/exams_seed.js');
  const seedFileContent = fs.readFileSync(seedFilePath, 'utf8');
  
  // Trích xuất JSON từ export const SCRAPED_EXAMS_SEED = [...];
  const jsonStart = seedFileContent.indexOf('[');
  const jsonEnd = seedFileContent.lastIndexOf(']') + 1;
  if (jsonStart === -1 || jsonEnd === 0) {
    throw new Error("Không thể phân tích dữ liệu JSON từ file exams_seed.js");
  }
  const scrapedExamsSeed = JSON.parse(seedFileContent.slice(jsonStart, jsonEnd));
  console.log(`📄 Đọc thành công ${scrapedExamsSeed.length} đề thi mẫu từ file seed.`);

  // 3. Tải danh sách đề thi hiện có trên Firestore để tiến hành xóa sạch
  console.log("⏳ Đang lấy danh sách đề thi hiện tại từ Firestore...");
  const snapshot = await getDocs(collection(db, 'exams'));
  const currentCount = snapshot.size;
  console.log(`🔍 Tìm thấy ${currentCount} đề thi hiện có trên Firestore.`);

  if (currentCount > 0) {
    console.log("🗑️ Đang tiến hành xóa sạch các đề thi cũ...");
    let batch = writeBatch(db);
    let count = 0;
    let batchCount = 0;

    for (const docSnap of snapshot.docs) {
      batch.delete(docSnap.ref);
      count++;
      batchCount++;

      if (batchCount >= 450) {
        console.log(` - Đang commit lô xóa ${count}/${currentCount}...`);
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      console.log(` - Đang commit lô xóa cuối cùng ${count}/${currentCount}...`);
      await batch.commit();
    }
    console.log("✅ Đã xóa sạch toàn bộ đề thi cũ thành công!");
  }

  // 4. Tiến hành ghi 400 đề thi mới vào Firestore
  console.log(`\n🚀 Bắt đầu nạp lại ${scrapedExamsSeed.length} đề thi mới vào Firestore...`);
  let writeBatchObj = writeBatch(db);
  let writeCount = 0;
  let batchWriteCount = 0;

  for (const exam of scrapedExamsSeed) {
    const newDocRef = doc(collection(db, 'exams'));
    
    writeBatchObj.set(newDocRef, {
      title: exam.title,
      subject: exam.subject,
      subjectLabel: exam.subjectLabel,
      category: exam.category,
      province: exam.province,
      year: exam.year,
      timeLimit: exam.timeLimit,
      type: exam.type,
      typeLabel: exam.typeLabel,
      questions: exam.questions || [],
      sourceUrl: exam.sourceUrl || null,
      createdAt: new Date().toISOString()
    });

    writeCount++;
    batchWriteCount++;

    if (batchWriteCount >= 100) { 
      // Commit theo từng lô 100 đề để tránh vượt quá giới hạn kích thước gói mạng
      console.log(` - Đang nạp đề thứ ${writeCount}/${scrapedExamsSeed.length}...`);
      await writeBatchObj.commit();
      writeBatchObj = writeBatch(db);
      batchWriteCount = 0;
    }
  }

  if (batchWriteCount > 0) {
    console.log(` - Đang nạp đề cuối cùng ${writeCount}/${scrapedExamsSeed.length}...`);
    await writeBatchObj.commit();
  }

  console.log(`\n🎉 NẠP THÀNH CÔNG ${writeCount} ĐỀ THI HOÀN CHỈNH VÀO FIRESTORE!`);
}

run().catch(err => {
  console.error("❌ Đã xảy ra lỗi khi nạp đề thi:", err);
});
