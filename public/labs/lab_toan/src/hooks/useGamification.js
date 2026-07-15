/**
 * useGamification — Hook quản lý toàn bộ XP, Streak, Solved Problems
 * Tách khỏi App.jsx để dễ test và tái sử dụng
 */
import { useState, useCallback, useEffect } from 'react';

const loadXP = () => {
  const saved = localStorage.getItem('spatialmind_xp');
  return saved ? parseInt(saved, 10) : 0;
};

const loadStreak = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('daily_progress') || '{}');
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (stored.date === today || stored.last_date === yesterday) {
      return stored.streak || 0;
    }
    return 0;
  } catch {
    return 0;
  }
};

const loadSolved = () =>
  parseInt(localStorage.getItem('spatialmind_solved') || '0', 10);

export function useGamification() {
  const [xp, setXP] = useState(loadXP);
  const [streak, setStreak] = useState(loadStreak);
  const [solvedProblems, setSolvedProblems] = useState(loadSolved);
  const [particleTrigger, setParticleTrigger] = useState(0);

  // Persist XP
  useEffect(() => {
    localStorage.setItem('spatialmind_xp', String(xp));
  }, [xp]);

  // Persist solved problems
  useEffect(() => {
    localStorage.setItem('spatialmind_solved', String(solvedProblems));
  }, [solvedProblems]);

  const gainXP = useCallback((amount) => {
    setXP((prev) => prev + amount);
    setParticleTrigger((t) => t + 1);
  }, []);

  const loseXP = useCallback((amount) => {
    setXP((prev) => Math.max(0, prev - amount));
  }, []);

  const triggerCelebration = useCallback((intensity = 1) => {
    setParticleTrigger((t) => t + intensity);
  }, []);

  const incrementSolved = useCallback(() => {
    setSolvedProblems((prev) => prev + 1);
  }, []);

  return {
    xp, setXP,
    streak, setStreak,
    solvedProblems, setSolvedProblems,
    particleTrigger,
    gainXP,
    loseXP,
    triggerCelebration,
    incrementSolved,
  };
}
