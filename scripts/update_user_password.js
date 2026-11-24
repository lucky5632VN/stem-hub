// Script cập nhật mật khẩu cho tài khoản quản trị
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, updatePassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSy_MASKED",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "cuoc-thi-ai-e2044.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "cuoc-thi-ai-e2044",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "cuoc-thi-ai-e2044.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "384565535158",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:384565535158:web:b7c6ea2e48c718a05f6117",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function fixPassword() {
  const targetEmail = process.env.ADMIN_EMAIL || 'admin@stem-hub.top';
  console.log(`⏳ Đang đổi mật khẩu tài khoản quản trị [${targetEmail}]...`);
  try {
    const currentPass = process.env.CURRENT_PASSWORD || 'password123';
    const newPass = process.env.NEW_PASSWORD || 'newSecretPassword123';
    // 1. Đăng nhập với mật khẩu hiện tại
    const userCredential = await signInWithEmailAndPassword(auth, targetEmail, currentPass);
    // 2. Cập nhật sang mật khẩu mới
    await updatePassword(userCredential.user, newPass);
    console.log(" 🎉 ĐÃ ĐỔI MẬT KHẨU THÀNH CÔNG!");
  } catch (err) {
    console.error(" ❌ Lỗi đổi mật khẩu:", err.message);
  }
}

fixPassword();
