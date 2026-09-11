import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, limit, doc, deleteDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD9YsaKNmUXDMxDEAA4CcG_KXdGGfJVEOE",
  authDomain: "cuoc-thi-ai-e2044.firebaseapp.com",
  projectId: "cuoc-thi-ai-e2044",
  storageBucket: "cuoc-thi-ai-e2044.firebasestorage.app",
  messagingSenderId: "384565535158",
  appId: "1:384565535158:web:b7c6ea2e48c718a05f6117",
  measurementId: "G-W00VVRFZ40"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

async function checkFirestoreLearnedKnowledge() {
  console.log("Connecting to Firestore...");
  const q = query(collection(db, 'learned_knowledge'), orderBy('createdAt', 'desc'), limit(100));
  const snap = await getDocs(q);
  console.log("Total docs fetched from learned_knowledge:", snap.docs.length);

  const found = [];
  snap.forEach((d) => {
    const data = d.data();
    const str = JSON.stringify(data).toLowerCase();
    if (str.includes('khang') || str.includes('chào') || str.includes('apprentice') || str.includes('bạn chính là') || str.includes('elo') || str.includes('tinh thể')) {
      found.push({ id: d.id, ...data });
    }
  });

  console.log(`Found ${found.length} documents matching criteria:`);
  found.forEach(item => {
    console.log("----------------------------");
    console.log(`ID: ${item.id}`);
    console.log(`Query: ${item.query}`);
    console.log(`Answer: ${item.answer?.slice(0, 200)}...`);
  });
}

checkFirestoreLearnedKnowledge().catch(err => console.error("Error:", err));
