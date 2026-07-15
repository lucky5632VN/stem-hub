/**
 * useBackendSync — Hook quản lý đồng bộ dữ liệu với backend
 * Bao gồm: loadProfile, syncProfile, beacon sync khi đóng tab
 */
import { useCallback, useEffect } from 'react';
import axios from 'axios';
import { getRankInfo } from '../components/GameHUD';

const BASE_URL = () =>
  (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:8000');

export function useBackendSync({ xp, streak, isStarted }) {
  const syncProfile = useCallback(async (currentXP, currentStreak) => {
    try {
      const baseUrl = BASE_URL();
      const { current: r } = getRankInfo(currentXP);
      await axios.post(`${baseUrl}/api/user/profile`, {
        name: 'Học sinh',
        xp: currentXP,
        streak: currentStreak,
        level: r.level,
        rank: r.name,
        achievements: [],
      });
    } catch {
      // Backend offline — silent fail, data vẫn lưu trong localStorage
    }
  }, []);

  const loadProfile = useCallback(async (setXP) => {
    try {
      const baseUrl = BASE_URL();
      const res = await axios.get(`${baseUrl}/api/user/profile`);
      if (res.data.xp > 0) {
        setXP((prev) => Math.max(prev, res.data.xp));
      }
    } catch {
      // Backend offline — dùng local data
    }
  }, []);

  // Sync khi XP/Streak thay đổi
  useEffect(() => {
    if (isStarted) {
      syncProfile(xp, streak);
    }
  }, [xp, streak, isStarted, syncProfile]);

  // Beacon sync khi đóng tab
  useEffect(() => {
    if (!isStarted) return;
    const baseUrl = BASE_URL();
    const handleBeforeUnload = () => {
      const data = JSON.stringify({ xp, streak, timestamp: Date.now() });
      try {
        navigator.sendBeacon?.(`${baseUrl}/api/user/sync-beacon`, data);
      } catch { /* ignore */ }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [xp, streak, isStarted]);

  return { syncProfile, loadProfile };
}
