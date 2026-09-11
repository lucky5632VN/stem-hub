import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc, setDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

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

// Danh sách từ cấm cá nhân / câu hỏi không phải học thuật
const PERSONAL_KEYWORDS = [
  'nguyễn minh khang',
  'hồ hoàng anh',
  'bạn chính là',
  'apprentice',
  'tinh thể',
  'phiên trò chuyện trước',
  'bộ nhớ học hỏi của nova',
  'tôi là ai',
  'nhớ gì về tôi',
  'bạn cs thể làm đc gì',
  'bạn có thể làm được gì',
  'bạn có thể làm đc cái gì',
  'đưa tôi qua lab',
  'qua lab hoá',
  'qua lab lý',
  'giúp tôi truy cập',
  'chuyển sang phần mô phỏng',
  'làm một phản ứng nổ',
  'điều chế thuốc nổ',
  'chiến thuật tăng điểm elo'
];

function isDisallowed(query, answer) {
  const text = ((query || '') + ' ' + (answer || '')).toLowerCase();
  return PERSONAL_KEYWORDS.some(k => text.includes(k));
}

function cleanAcademicAnswer(answer) {
  if (!answer) return '';
  let a = answer;
  // Loại bỏ các câu chào cá nhân ở đầu
  a = a.replace(/^(?:(?:xin\s+)?chào\s+(?:nguyễn minh khang|hồ hoàng anh|admin|học sinh)[!.,:]?\s*)+/gi, '');
  a = a.replace(/^(?:(?:nguyễn minh khang|hồ hoàng anh|admin)[!.,:]?\s*)+/gi, '');
  a = a.replace(/^(?:NOVA\s+chào\s+Admin[!.,:]?\s*)+/gi, '');
  a = a.replace(/Admin,\s*NOVA/gi, 'NOVA');
  a = a.replace(/Admin/gi, 'học sinh');
  a = a.replace(/Dựa trên bộ nhớ học hỏi,\s*em đã từng hỏi về [^.]+\.\s*/gi, '');
  return a.trim();
}

async function cleanLocalJsonFiles() {
  const filePaths = [
    path.join(process.cwd(), 'src', 'data', 'global-learned-knowledge.json'),
    path.join(process.cwd(), 'public', 'data', 'global-learned-knowledge.json')
  ];

  for (const fp of filePaths) {
    if (!fs.existsSync(fp)) continue;
    const raw = fs.readFileSync(fp, 'utf8');
    const items = JSON.parse(raw || '[]');
    console.log(`[FILE] Processing ${fp}: total ${items.length} items.`);

    const cleanedItems = [];
    for (const item of items) {
      if (isDisallowed(item.query, item.answer)) {
        console.log(`  ❌ Removed personal/nav item: "${item.query}"`);
        continue;
      }
      const cleanedA = cleanAcademicAnswer(item.answer);
      cleanedItems.push({
        ...item,
        answer: cleanedA,
        content: `[Tự học AI] ${item.query}: ${cleanedA}`
      });
    }

    fs.writeFileSync(fp, JSON.stringify(cleanedItems, null, 2), 'utf8');
    console.log(`[FILE] Saved ${fp}: remaining ${cleanedItems.length} academic items.`);
  }
}

async function cleanFirestore() {
  console.log('[FIRESTORE] Fetching all docs from learned_knowledge...');
  const snap = await getDocs(collection(db, 'learned_knowledge'));
  console.log(`[FIRESTORE] Found ${snap.docs.length} docs in collection.`);

  let deletedCount = 0;
  let updatedCount = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const q = data.query || '';
    const a = data.answer || '';

    if (isDisallowed(q, a)) {
      console.log(`  🔥 Deleting personal doc ${docSnap.id}: "${q}"`);
      await deleteDoc(doc(db, 'learned_knowledge', docSnap.id));
      deletedCount++;
    } else {
      const cleanedA = cleanAcademicAnswer(a);
      if (cleanedA !== a) {
        console.log(`  ✨ Sanitizing academic doc ${docSnap.id}: "${q}"`);
        await setDoc(doc(db, 'learned_knowledge', docSnap.id), {
          ...data,
          answer: cleanedA,
          content: `[Tự học AI] ${q}: ${cleanedA}`
        }, { merge: true });
        updatedCount++;
      }
    }
  }

  console.log(`[FIRESTORE] Finished: Deleted ${deletedCount} docs, Updated ${updatedCount} docs.`);
}

async function main() {
  await cleanLocalJsonFiles();
  await cleanFirestore();
  console.log('✅ ĐÃ HOÀN TẤT DỌN DẸP DỮ LIỆU TOÀN DIỆN!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
