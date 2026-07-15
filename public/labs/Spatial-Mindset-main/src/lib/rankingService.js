import { collection, query, orderBy, limit, getDocs, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// ==========================================
// Kịch bản 1: Lấy Bảng phong thần (Global Ranking)
// ==========================================
export const fetchGlobalRanking = async (topN = 100) => {
  const q = query(
    collection(db, "users"),
    orderBy("contestRating", "desc"),
    limit(topN)
  );

  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc, index) => ({
    uid: doc.id,
    rank: index + 1,
    ...doc.data()
  }));
};

// ==========================================
// Kịch bản 2: Bảng xếp hạng Live trong Contest
// Cập nhật realtime không cần F5 trình duyệt
// ==========================================
export const subscribeToLiveContestRanking = (contestId, onUpdate) => {
  const q = query(
    collection(db, "contest_participations"),
    where("contestId", "==", contestId),
    orderBy("score", "desc"),       // Ưu tiên 1: Điểm số cao nhất
    orderBy("penaltyTime", "asc"),  // Ưu tiên 2: Cùng điểm thì ai ít thời gian phạt hơn sẽ xếp trên
    limit(50)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const liveData = snapshot.docs.map((doc, index) => ({
      rank: index + 1,
      participationId: doc.id,
      ...doc.data()
    }));
    
    onUpdate(liveData); 
  });

  return unsubscribe; 
};
