import { create } from 'zustand';

export const useAppStore = create((set) => ({
  language: 'vi',
  toggleLanguage: () => set((state) => ({ language: state.language === 'vi' ? 'en' : 'vi' })),
  
  // Custom Cursor states
  cursorType: 'default', // 'default', 'pointer', 'text', 'hidden'
  setCursorType: (type) => set({ cursorType: type }),
  
  // Audio state
  soundEnabled: true,
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  // Sidebar State
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  // Auth State
  user: null,
  setUser: (user) => set({ user }),

  // Personalization & Stats State
  personalization: {
    avatarFrame: 'default',
    activeTitle: 'apprentice',
    unlockedFrames: ['default'],
    unlockedTitles: ['apprentice'],
    avatarUrl: '',
    bgImage: '',
    crystals: 500,
    avatarParts: {
      gender: 'male',
      bodyType: 'chibi',
      pose: 'standard',
      body: 'peach',
      hair: 'default',
      top: 'default',
      bottom: 'default',
      accessory: 'none'
    },
    unlockedParts: ['peach', 'hair_default', 'top_default', 'bottom_default'],
    claimedMilestones: [],
    level: 1,
    exp: 0,
    nextLevelExp: 1000,
    elo: 0,
    wins: 0,
    losses: 0,
    subjectStrengths: { math: 50, physics: 50, chemistry: 50, biology: 50 },
    face2FAEnabled: false,
    faceDescriptor: null
  },
  setPersonalization: (data) => set((state) => ({
    personalization: { ...state.personalization, ...data }
  })),

  // Arena State
  arenaState: {
    status: 'idle', // 'idle', 'matching', 'playing', 'result'
    subject: null,
    playerProgress: 0,
    opponentProgress: 0,
    opponentInfo: null,
    matchResult: null,
    logs: [],
    timeRemaining: 180
  },

  startMatching: (subject) => set({
    arenaState: {
      status: 'matching',
      subject,
      playerProgress: 0,
      opponentProgress: 0,
      opponentInfo: null,
      matchResult: null,
      logs: [],
      timeRemaining: 180
    }
  }),

  startChallengeGame: (subject, timeLimit = 180) => set({
    arenaState: {
      status: 'playing',
      subject,
      playerProgress: 0,
      opponentProgress: 0,
      opponentInfo: null,
      matchResult: null,
      logs: [],
      timeRemaining: timeLimit
    }
  }),

  cancelMatching: () => set((state) => ({
    arenaState: { ...state.arenaState, status: 'idle', subject: null }
  })),

  setArenaStatus: (status) => set((state) => ({
    arenaState: { ...state.arenaState, status }
  })),

  setOpponentInfo: (info) => set((state) => ({
    arenaState: { ...state.arenaState, opponentInfo: info }
  })),

  updatePlayerProgress: (progress) => set((state) => ({
    arenaState: { ...state.arenaState, playerProgress: Math.max(0, progress) }
  })),

  updateOpponentProgress: (progress) => set((state) => ({
    arenaState: { ...state.arenaState, opponentProgress: Math.max(0, progress) }
  })),

  setArenaTimeRemaining: (time) => set((state) => ({
    arenaState: { ...state.arenaState, timeRemaining: time }
  })),

  addArenaLog: (log) => set((state) => ({
    arenaState: { ...state.arenaState, logs: [log, ...state.arenaState.logs].slice(0, 5) }
  })),

  setMatchResult: (result) => set((state) => ({
    arenaState: { ...state.arenaState, matchResult: result, status: 'result' }
  })),

  tickArenaTime: () => set((state) => ({
    arenaState: { ...state.arenaState, timeRemaining: Math.max(0, state.arenaState.timeRemaining - 1) }
  })),

  // Active Lab Sandbox State
  activeLab: null,
  setActiveLab: (lab) => set({ activeLab: lab }),

  // AI Assistant Personalization & Adaptive Memory State
  subjectFrequency: { hoa: 0, ly: 0, toan: 0, sinh: 0 },
  conciseMode: false,
  dislikeCount: 0,
  incrementSubjectFrequency: (subject) => set((state) => {
    if (!subject || state.subjectFrequency[subject] === undefined) return state;
    return {
      subjectFrequency: {
        ...state.subjectFrequency,
        [subject]: state.subjectFrequency[subject] + 1
      }
    };
  }),
  recordFeedback: (isLike) => set((state) => {
    if (isLike) {
      return { dislikeCount: Math.max(0, state.dislikeCount - 1) };
    }
    const newDislikes = state.dislikeCount + 1;
    return {
      dislikeCount: newDislikes,
      conciseMode: newDislikes >= 2 ? true : state.conciseMode
    };
  }),
}));
