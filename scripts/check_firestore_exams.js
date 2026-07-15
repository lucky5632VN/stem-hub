// Script kiểm tra database exams trong Firestore bằng client-side firebase SDK
// Chạy: node scripts/check_firestore_exams.js
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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
  
  const counts = {};
  const categories = {};
  snapshot.forEach(doc => {
    const data = doc.data();
    counts[data.subject] = (counts[data.subject] || 0) + 1;
    categories[data.category] = (categories[data.category] || 0) + 1;
  });
  
  console.log('\n📚 Thống kê theo môn:');
  Object.entries(counts).forEach(([k, v]) => {
    console.log(` - ${k}: ${v} đề`);
  });

  console.log('\n📂 Thống kê theo category:');
  Object.entries(categories).forEach(([k, v]) => {
    console.log(` - ${k}: ${v} đề`);
  });
}

run().catch(console.error);
