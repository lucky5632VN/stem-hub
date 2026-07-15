// Script cập nhật trường difficulty cho các đề thi hiện có trên Firestore
// Chạy: node scripts/update_firestore_difficulty.js
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

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
  console.log("⏳ Đang tải dữ liệu đề thi từ Firestore...");
  const snapshot = await getDocs(collection(db, 'exams'));
  console.log(`📊 Tổng số đề thi trên Firestore: ${snapshot.size}`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    
    // Nếu đề thi chưa có trường difficulty, tiến hành cập nhật
    if (!data.difficulty) {
      const category = data.category || 'bo-gddt';
      const title = (data.title || '').toLowerCase();
      
      let difficulty = 'easy';
      let difficultyLabel = 'Cơ bản';

      if (
        category === 'cac-truong-chuyen' || 
        category === 'on-thi-hsg' || 
        title.includes('chuyên') || 
        title.includes('hsg') ||
        title.includes('học sinh giỏi')
      ) {
        difficulty = 'hard';
        difficultyLabel = 'Nâng cao';
      } else if (
        category === 'so-gddt' || 
        title.includes('sở gd') || 
        title.includes('sở giáo dục')
      ) {
        difficulty = 'medium';
        difficultyLabel = 'Khá';
      }

      console.log(`🔄 Cập nhật đề "${data.title}" -> ${difficultyLabel}`);
      
      const docRef = doc(db, 'exams', docSnap.id);
      await updateDoc(docRef, { difficulty, difficultyLabel });
      
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`\n🎉 Hoàn thành cập nhật Firestore!`);
  console.log(` - Đã cập nhật thành công: ${updatedCount} đề`);
  console.log(` - Đã bỏ qua (đã có sẵn cấp độ): ${skippedCount} đề`);
}

run().catch(console.error);
