import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../api/client';
import { db, auth, isFirebaseConfigured } from '../firebaseConfig';
import { doc, setDoc, collection } from 'firebase/firestore';

const useContestStore = create(
  persist(
    (set, get) => ({
      activeContestId: null,
      timeLeft: 90 * 60,
      isStarted: false,
      // AI Evaluation State (Fix: OWL Report Lỗi 2)
      aiResult: null,
      isEvaluating: false,
      submittedAnswers: {}, // { [questionId]: answer }

      startContest: (contestId, duration = 90 * 60) => set({
        activeContestId: contestId,
        timeLeft: duration,
        isStarted: true,
        aiResult: null,
        submittedAnswers: {},
      }),

      decrementTime: () => set((state) => ({
        timeLeft: Math.max(0, state.timeLeft - 1)
      })),

      addPenalty: (seconds) => set((state) => ({
        timeLeft: Math.max(0, state.timeLeft - seconds)
      })),

      // Lưu câu trả lời từng câu (Fix: OWL Report Lỗi 1)
      saveAnswer: (questionId, answer) => set((state) => ({
        submittedAnswers: { ...state.submittedAnswers, [questionId]: answer }
      })),

      // Submit kết quả contest lên server (Fix: OWL Report Lỗi 3 - chuẩn hóa dữ liệu)
      submitContestResult: async (contestId, score, username) => {
        const { timeLeft } = get();
        const finishSeconds = 90 * 60 - timeLeft;
        const h = Math.floor(finishSeconds / 3600);
        const m = Math.floor((finishSeconds % 3600) / 60);
        const s = finishSeconds % 60;
        const finishTime = h > 0
          ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
          : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

        // Save to Firestore if configured
        if (isFirebaseConfigured && db) {
          try {
            const uid = auth?.currentUser?.uid || 'guest_' + Date.now();
            const subRef = doc(collection(db, 'contest_submissions'), `${contestId}_${uid}`);
            await setDoc(subRef, {
              contest_id: contestId,
              uid,
              username: username || auth?.currentUser?.displayName || auth?.currentUser?.email?.split('@')[0] || localStorage.getItem('spatialmind_user') || 'Ẩn danh',
              score,
              finish_time: finishTime,
              finish_seconds: finishSeconds,
              submittedAt: Date.now()
            }, { merge: true });
            console.log('Saved contest result to Firestore!');
          } catch (e) {
            console.error('Save contest result to Firestore error:', e);
          }
        }

        try {
          await apiClient.post('/api/contest/submit', {
            contest_id: contestId,
            username: username || localStorage.getItem('spatialmind_user') || 'Ẩn danh',
            score,
            finish_time: finishTime,
            penalty: 0,
          });
        } catch (e) {
          console.error('Submit contest result error (ignored for offline/fallback):', e);
        }
      },

      // Cập nhật kết quả AI (Fix: OWL Report Lỗi 2)
      setAiResult: (result) => set({ aiResult: result }),
      setIsEvaluating: (val) => set({ isEvaluating: val }),

      // Fix C2: Reset toàn bộ state khi kết thúc contest (tránh stale state khi vào lại)
      endContest: () => set({
        isStarted: false,
        timeLeft: 0,
        aiResult: null,
        isEvaluating: false,
        submittedAnswers: {},
        activeContestId: null,
      }),

      // Fix I3: Reset sạch cho một contest mới mà không cần unmount/remount store
      resetForContest: (contestId, duration = 90 * 60) => set({
        activeContestId: contestId,
        timeLeft: duration,
        isStarted: true,
        aiResult: null,
        isEvaluating: false,
        submittedAnswers: {},
      }),
    }),
    {
      name: 'spatialmind-contest-storage',
    }
  )
);

export default useContestStore;
