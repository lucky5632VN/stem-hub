const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

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
const auth = getAuth(app);

async function check() {
  await signInWithEmailAndPassword(auth, 'admin@stemhub.edu.vn', 'AdminStemHub2026!@');
  console.log('✅ Admin logged in!');
  
  const allUsersSnap = await getDocs(collection(db, 'users'));
  console.log('Total users:', allUsersSnap.size);
  
  let botCount = 0;
  const userList = [];
  allUsersSnap.docs.forEach(d => {
    const data = d.data();
    userList.push({ id: d.id, email: data.email, isBotAccount: data.isBotAccount, botStatus: data.botStatus, elo: data.stats?.elo || data.personalization?.elo });
    if (data.isBotAccount) {
      botCount++;
    }
  });

  console.log('Bot count:', botCount);
  console.log('Users sample:', userList.slice(0, 25));
}

check().catch(console.error);
