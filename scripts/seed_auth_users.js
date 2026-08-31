// Script tự động khởi tạo danh sách tài khoản Đăng nhập (Firebase Authentication) cho dự án MỚI (cuoc-thi-ai-e2044)
// Chạy: node scripts/seed_auth_users.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');

const newFirebaseConfig = {
  apiKey: "AIzaSyD9YsaKNmUXDMxDEAA4CcG_KXdGGfJVEOE",
  authDomain: "cuoc-thi-ai-e2044.firebaseapp.com",
  projectId: "cuoc-thi-ai-e2044",
  storageBucket: "cuoc-thi-ai-e2044.firebasestorage.app",
  messagingSenderId: "384565535158",
  appId: "1:384565535158:web:b7c6ea2e48c718a05f6117",
};

const app = initializeApp(newFirebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Mật khẩu mặc định cho các tài khoản test/học sinh nếu chưa có
const DEFAULT_PASSWORD = "password123";

const CUSTOM_PASSWORDS = {
  "admin123@gmail.com": "hoanganhadmin5632",
  "admin@gmail.com": "hoanganhadmin5632",
  "test1@gmail.com": "123456",
  "test2@gmail.com": "123456",
  "test3@gmail.com": "123456",
  "test4@gmail.com": "123456",
  "test5@gmail.com": "123456",
  "test6@gmail.com": "123456",
  "test7@gmail.com": "123456",
  "test8@gmail.com": "123456",
  "test9@gmail.com": "123456",
  "test10@gmail.com": "123456",
  "test11@gmail.com": "123456",
  "test12@gmail.com": "123456",
  "test13@gmail.com": "123456",
  "test14@gmail.com": "123456",
  "test15@gmail.com": "123456",
  "test16@gmail.com": "123456",
  "test17@gmail.com": "123456",
  "test18@gmail.com": "123456",
  "test19@gmail.com": "123456",
  "test20@gmail.com": "123456",
  "p1@test.com": "123456",
  "p2@test.com": "123456",
  "testuser1@example.com": "password123"
};

async function seedAuthUsers() {
  console.log("==================================================================");
  console.log("🚀 ĐANG KHỞI TẠO TÀI KHOẢN ĐĂNG NHẬP (FIREBASE AUTH) CHO DỰ ÁN MỚI");
  console.log("==================================================================");

  try {
    // 1. Đăng nhập Admin trước để lấy quyền đọc Firestore
    console.log("🔑 Đang đăng nhập tài khoản Admin...");
    try {
      await signInWithEmailAndPassword(auth, "admin123@gmail.com", "hoanganhadmin5632");
      console.log(" ✅ Đã đăng nhập Admin thành công!");
    } catch (adminErr) {
      console.warn(" ⚠️ Lỗi đăng nhập Admin:", adminErr.message);
    }

    // 2. Đọc tất cả tài khoản trong Firestore users
    const userDocs = await getDocs(collection(db, "users"));
    console.log(`🔍 Tìm thấy ${userDocs.size} hồ sơ người dùng trong Firestore.`);

    let successCount = 0;
    let existCount = 0;

    for (const docSnap of userDocs.docs) {
      const userData = docSnap.data();
      const email = userData.email || (docSnap.id.includes('@') ? docSnap.id : null);

      if (!email || !email.includes('@')) {
        continue;
      }

      const password = CUSTOM_PASSWORDS[email] || DEFAULT_PASSWORD;

      try {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log(` ✅ Đã tạo tài khoản Auth mới: [${email}] (Mật khẩu: ${password})`);
        successCount++;
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          console.log(` ℹ️ Tài khoản [${email}] đã có sẵn trên Firebase Auth.`);
          existCount++;
        } else {
          console.warn(` ⚠️ Không thể tạo tài khoản [${email}]:`, err.message);
        }
      }
    }

    console.log("\n==================================================================");
    console.log(`🎉 HOÀN THÀNH! Đã khởi tạo ${successCount} tài khoản mới, ${existCount} tài khoản đã tồn tại.`);
    console.log("==================================================================");
  } catch (err) {
    console.error("❌ Lỗi khởi tạo Auth:", err);
  }
}

seedAuthUsers();

