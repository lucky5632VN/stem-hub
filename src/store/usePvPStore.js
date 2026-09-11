import { create } from 'zustand';

const SESSION_KEY = 'stem_hub_pvp_active_session';

// Hàm lưu trữ an toàn vào sessionStorage (chống F5 tải lại trang)
const persistToSession = (state) => {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      roomId: state.roomId,
      subject: state.subject,
      timeRemaining: state.timeRemaining,
      score: state.score,
      playerProgress: state.playerProgress,
      currentQ: state.currentQ,
      answered: state.answered,
      activeEffects: state.activeEffects,
      checkpointsSent: Array.from(state.checkpointsSent),
      updatedAt: Date.now()
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('⚠️ Không thể lưu trạng thái PvP vào sessionStorage:', e);
  }
};

// Hàm đọc lại phiên làm việc từ sessionStorage
const loadFromSession = (roomId) => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.roomId === roomId && Date.now() - data.updatedAt < 240000) {
      return data;
    }
  } catch (e) {
    console.warn('⚠️ Lỗi khôi phục session PvP:', e);
  }
  return null;
};

export const clearPvPSession = () => {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }
};

export const usePvPStore = create((set, get) => ({
  // Trạng thái cơ bản của trận đấu
  roomId: null,
  subject: null,
  isHost: false,
  status: 'idle', // 'idle' | 'playing' | 'result' | 'abandoned'
  
  // Thời gian & Đồng bộ
  matchDuration: 180,
  timeRemaining: 180,
  matchStartTime: null,
  clientStartTime: null,
  lastHeartbeatSent: 0,
  opponentLastActive: 0,

  // Điểm số & Tiến độ
  score: 0,
  playerProgress: 0,
  opponentProgress: 0,
  opponentInfo: null,

  // Bộ câu hỏi & Lịch sử
  questions: [],
  currentQ: 0,
  answered: [],

  // Thẻ bài & Hiệu ứng khống chế
  equippedCards: [],
  activeEffects: {
    frozenUntil: 0,
    fogUntil: 0,
    eloShielded: false,
    crystalMultiplier: 1,
    reflectActive: false
  },

  // Nhật ký trận đấu
  logs: [],

  // Quản lý mốc Checkpoint (Chỉ sync ở mốc 120s, 60s, 20s và khi hoàn thành)
  checkpointsSent: new Set(),
  isFinalizing: false,

  // --- ACTIONS ---

  // 1. Khởi tạo trận đấu mới hoặc khôi phục từ Session
  initMatch: ({ roomId, subject, isHost, duration = 180, questions = [], opponent = null }) => {
    const saved = loadFromSession(roomId);

    if (saved) {
      console.log('🔄 Đã phát hiện phiên PvP chưa hoàn thành, tiến hành Rehydrate từ sessionStorage!');
      set({
        roomId,
        subject,
        isHost,
        status: 'playing',
        matchDuration: duration,
        timeRemaining: saved.timeRemaining ?? duration,
        score: saved.score ?? 0,
        playerProgress: saved.playerProgress ?? 0,
        currentQ: saved.currentQ ?? 0,
        answered: saved.answered ?? [],
        activeEffects: saved.activeEffects ?? {
          frozenUntil: 0,
          fogUntil: 0,
          eloShielded: false,
          crystalMultiplier: 1,
          reflectActive: false
        },
        questions: questions.length > 0 ? questions : get().questions,
        opponentInfo: opponent || get().opponentInfo,
        checkpointsSent: new Set(saved.checkpointsSent || []),
        isFinalizing: false,
        clientStartTime: Date.now()
      });
      return;
    }

    // Nếu là trận đấu hoàn toàn mới
    const now = Date.now();
    set({
      roomId,
      subject,
      isHost,
      status: 'playing',
      matchDuration: duration,
      timeRemaining: duration,
      matchStartTime: now,
      clientStartTime: now,
      opponentLastActive: now,
      score: 0,
      playerProgress: 0,
      opponentProgress: 0,
      opponentInfo: opponent,
      questions,
      currentQ: 0,
      answered: [],
      activeEffects: {
        frozenUntil: 0,
        fogUntil: 0,
        eloShielded: false,
        crystalMultiplier: 1,
        reflectActive: false
      },
      logs: ['⚔️ Trận đấu đã chính thức bắt đầu! Chúc bạn thi đấu xuất sắc!'],
      checkpointsSent: new Set(),
      isFinalizing: false
    });

    persistToSession(get());
  },

  // 2. Bộ đếm thời gian nội bộ trên RAM (0ms Firestore cost)
  tickLocalTimer: () => {
    const state = get();
    if (state.status !== 'playing' || state.isFinalizing) return state.timeRemaining;

    // Tính toán thời gian dựa trên mốc khởi tạo máy khách để loại trừ sai số trễ luồng
    const elapsed = Math.floor((Date.now() - (state.clientStartTime || Date.now())) / 1000);
    const newRemaining = Math.max(0, state.matchDuration - elapsed);

    set({ timeRemaining: newRemaining });
    
    // Tự động sao lưu tiến độ định kỳ
    if (newRemaining % 5 === 0) {
      persistToSession(get());
    }

    return newRemaining;
  },

  // 3. Trả lời câu hỏi & Cập nhật tiến độ trên RAM
  recordAnswer: ({ answer, isCorrect, scoreDelta = 1, progressDelta = null, maxQuestions = 20 }) => {
    const state = get();
    const newScore = isCorrect ? state.score + scoreDelta : state.score;
    const newQ = state.currentQ + 1;
    const newProgress = progressDelta !== null 
      ? Math.min(100, Math.max(state.playerProgress, progressDelta))
      : Math.min(100, Math.round((newScore / maxQuestions) * 100));

    const newAnswered = [...state.answered, {
      qIndex: state.currentQ,
      answer,
      isCorrect,
      timestamp: Date.now()
    }];

    set({
      score: newScore,
      currentQ: newQ,
      playerProgress: newProgress,
      answered: newAnswered
    });

    persistToSession(get());
    return { newScore, newProgress, currentQ: newQ };
  },

  // 4. Kiểm tra xem có mốc Checkpoint nào cần gửi lên Firestore không
  // (Chỉ kích hoạt ở mốc 120s, 60s, 20s hoặc khi tiến độ đạt 100%)
  checkNeedSyncCheckpoint: () => {
    const { timeRemaining, playerProgress, checkpointsSent, status } = get();
    if (status !== 'playing') return null;

    // Checkpoint hoàn thành 100%
    if (playerProgress >= 100 && !checkpointsSent.has('prog_100')) {
      return 'prog_100';
    }

    // Checkpoint thời gian: 120s
    if (timeRemaining <= 120 && timeRemaining > 100 && !checkpointsSent.has('time_120')) {
      return 'time_120';
    }

    // Checkpoint thời gian: 60s
    if (timeRemaining <= 60 && timeRemaining > 40 && !checkpointsSent.has('time_60')) {
      return 'time_60';
    }

    // Checkpoint thời gian: 20s
    if (timeRemaining <= 20 && timeRemaining > 5 && !checkpointsSent.has('time_20')) {
      return 'time_20';
    }

    return null;
  },

  markCheckpointSent: (checkpointKey) => {
    set((state) => {
      const updated = new Set(state.checkpointsSent);
      updated.add(checkpointKey);
      return { checkpointsSent: updated, lastHeartbeatSent: Date.now() };
    });
    persistToSession(get());
  },

  // 5. Cập nhật tiến độ của đối thủ từ Firestore Snapshot
  syncOpponentProgress: (oppProgress) => {
    if (typeof oppProgress === 'number') {
      set({ 
        opponentProgress: Math.max(0, oppProgress),
        opponentLastActive: Date.now()
      });
    }
  },

  // 6. Ghi nhận hiệu ứng khống chế cục bộ (Freeze 500ms, Smoke fog 30s)
  applyDebuff: (type, durationMs) => {
    const until = Date.now() + durationMs;
    set((state) => ({
      activeEffects: {
        ...state.activeEffects,
        [type === 'freeze' ? 'frozenUntil' : 'fogUntil']: until
      }
    }));
    persistToSession(get());
  },

  // 7. Thêm dòng nhật ký cục bộ
  addLog: (msg) => {
    set((state) => ({
      logs: [msg, ...state.logs].slice(0, 10)
    }));
  },

  // 8. Đánh dấu kết thúc trận đấu
  finishMatch: () => {
    set({ status: 'result', isFinalizing: true });
    clearPvPSession();
  },

  resetPvPStore: () => {
    clearPvPSession();
    set({
      roomId: null,
      subject: null,
      status: 'idle',
      score: 0,
      playerProgress: 0,
      opponentProgress: 0,
      questions: [],
      currentQ: 0,
      answered: [],
      isFinalizing: false,
      checkpointsSent: new Set()
    });
  }
}));
