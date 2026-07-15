// =====================================================
// SpatialMind — useUserSync Hook
// =====================================================
// Đồng bộ XP, streak, rank giữa localStorage ↔ Firestore
// - Khi online: debounced sync lên Firestore
// - Khi offline: lưu localStorage, sync lại khi reconnect
// - Conflict resolution: lấy giá trị cao hơn
// =====================================================

import { useEffect, useCallback, useRef } from 'react';
import { db, isFirebaseConfigured } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';

const SYNC_DEBOUNCE_MS = 3000;
const SYNC_KEY = 'spatialmind_last_sync';

export function useUserSync({ xp, streak, solvedProblems, setXP, setStreak, setSolvedProblems }) {
  const { user } = useAuth();
  const syncTimeoutRef = useRef(null);
  const hasMergedRef = useRef(false);

  // ── Debounced sync lên Firestore ──
  const syncToFirestore = useCallback(async (data) => {
    if (!isFirebaseConfigured || !user?.uid || !db) return;

    try {
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const profileRef = doc(db, 'users', user.uid);
      await updateDoc(profileRef, {
        xp: data.xp,
        streak: data.streak,
        solvedProblems: data.solvedProblems || 0,
        lastActive: serverTimestamp(),
      });
      localStorage.setItem(SYNC_KEY, new Date().toISOString());
    } catch (err) {
      console.warn('[UserSync] Firestore write failed (will retry):', err.message);
    }
  }, [user]);

  // ── Auto-sync khi XP hoặc streak thay đổi ──
  useEffect(() => {
    if (!isFirebaseConfigured || !user?.uid) return;

    // Lưu localStorage ngay lập tức (offline-first)
    localStorage.setItem('spatialmind_xp', String(xp));
    localStorage.setItem('spatialmind_streak', String(streak));

    // Debounce Firestore writes
    clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      syncToFirestore({ xp, streak, solvedProblems });
    }, SYNC_DEBOUNCE_MS);

    return () => clearTimeout(syncTimeoutRef.current);
  }, [xp, streak, solvedProblems, user, syncToFirestore]);

  // ── Merge data khi login lần đầu ──
  useEffect(() => {
    if (!isFirebaseConfigured || !user?.uid || hasMergedRef.current) return;
    hasMergedRef.current = true;

    const mergeOnLogin = async () => {
      try {
        const { doc, getDoc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        const profileRef = doc(db, 'users', user.uid);
        const snap = await getDoc(profileRef);

        if (!snap.exists()) return;

        const remote = snap.data();
        const localXP = parseInt(localStorage.getItem('spatialmind_xp') || '0', 10);
        const localStreak = parseInt(localStorage.getItem('spatialmind_streak') || '0', 10);

        // Conflict resolution: lấy giá trị CAO HƠN
        const mergedXP = Math.max(remote.xp || 0, localXP, xp);
        const mergedStreak = Math.max(remote.streak || 0, localStreak, streak);
        const mergedSolved = Math.max(remote.solvedProblems || 0, solvedProblems || 0);

        if (mergedXP !== xp) setXP(mergedXP);
        if (mergedStreak !== streak) setStreak(mergedStreak);
        if (mergedSolved !== solvedProblems && setSolvedProblems) setSolvedProblems(mergedSolved);

        await updateDoc(profileRef, {
          xp: mergedXP,
          streak: mergedStreak,
          solvedProblems: mergedSolved,
          lastActive: serverTimestamp(),
        });

        console.log('[UserSync] Merged successfully:', { mergedXP, mergedStreak, mergedSolved });
      } catch (err) {
        console.warn('[UserSync] Merge failed, using local data:', err.message);
      }
    };

    mergeOnLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // ── Sync khi reconnect ──
  useEffect(() => {
    if (!isFirebaseConfigured || !user?.uid) return;

    const handleOnline = () => {
      console.log('[UserSync] Back online, syncing...');
      syncToFirestore({ xp, streak, solvedProblems });
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, xp, streak, solvedProblems, syncToFirestore]);

  // ── Sync trước khi đóng tab ──
  useEffect(() => {
    if (!isFirebaseConfigured || !user?.uid) return;

    const handleBeforeUnload = () => {
      localStorage.setItem('spatialmind_xp', String(xp));
      localStorage.setItem('spatialmind_streak', String(streak));
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `/api/user/sync-beacon`,
          JSON.stringify({ uid: user.uid, xp, streak, solvedProblems })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, xp, streak, solvedProblems]);

  return {
    isSynced: isFirebaseConfigured && !!user,
    lastSync: localStorage.getItem(SYNC_KEY) || null,
  };
}

export default useUserSync;
