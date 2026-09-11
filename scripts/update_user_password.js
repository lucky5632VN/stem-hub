// Script cập nhật mật khẩu chính xác cho tài khoản hohoanganh20092021@gmail.com
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, updatePassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyD9YsaKNmUXDMxDEAA4CcG_KXdGGfJVEOE",
  authDomain: "cuoc-thi-ai-e2044.firebaseapp.com",
  projectId: "cuoc-thi-ai-e2044",
  storageBucket: "cuoc-thi-ai-e2044.firebasestorage.app",
  messagingSenderId: "384565535158",
  appId: "1:384565535158:web:b7c6ea2e48c718a05f6117",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function fixPassword() {
  console.log("⏳ Đang đổi mật khẩu tài khoản [hohoanganh20092021@gmail.com] thành 'hoanganh5632'...");
  try {
    // 1. Đăng nhập với mật khẩu mặc định hiện tại
    const userCredential = await signInWithEmailAndPassword(auth, 'hohoanganh20092021@gmail.com', 'password123');
    // 2. Cập nhật sang mật khẩu mong muốn 'hoanganh5632'
    await updatePassword(userCredential.user, 'hoanganh5632');
    console.log(" 🎉 ĐÃ ĐỔI MẬT KHẨU THÀNH CÔNG THÀNH 'hoanganh5632'!");
  } catch (err) {
    console.error(" ❌ Lỗi đổi mật khẩu:", err.message);
  }
}

fixPassword();
