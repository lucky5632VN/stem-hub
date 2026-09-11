/**
 * MÔ HÌNH THUẬT TOÁN TIẾN HÓA PVP BOT (Evolutionary PvP Bot Engine)
 * Quản lý quần thể 20 cá thể Bot PvP, tự động tiến hóa (Genetic Crossover & Mutation)
 * dựa trên kết quả thi đấu thực tế của học sinh.
 */

// Quần thể 20 Bot Khởi tạo ban đầu với các gen đặc trưng
const INITIAL_PVP_BOT_POPULATION = Array.from({ length: 20 }, (_, idx) => {
  const baseElo = 800 + idx * 80;
  return {
    id: `bot_evo_${idx + 1}`,
    name: `PvP Bot Alpha-${idx + 1}`,
    elo: baseElo,
    accuracyRate: Math.min(0.95, Math.max(0.4, 0.45 + idx * 0.025)), // Gen 1: Độ chính xác [0.4, 0.95]
    responseTimeSec: Math.max(4, 15 - idx * 0.5),                  // Gen 2: Tốc độ trả lời (giây)
    aggressionRate: 0.3 + (idx % 5) * 0.15,                       // Gen 3: Mức độ dùng thẻ bài bổ trợ
    fitness: 0,
    matchesPlayed: 0,
    wins: 0
  };
});

let currentPopulation = [...INITIAL_PVP_BOT_POPULATION];
let isPopulationLoaded = false;

function savePopulationToLocalStorage(population) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('pvp_bot_population_v1', JSON.stringify(population));
    }
  } catch (e) {
    console.warn('[PvPEvolution] Failed to save population to localStorage:', e.message);
  }
}

function loadPopulationFromLocalStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem('pvp_bot_population_v1');
      if (data) return JSON.parse(data);
    }
  } catch (e) {
    console.warn('[PvPEvolution] Failed to load population from localStorage:', e.message);
  }
  return null;
}

function ensurePopulationLoaded() {
  if (isPopulationLoaded) return;
  const saved = loadPopulationFromLocalStorage();
  if (saved && Array.isArray(saved) && saved.length > 0) {
    currentPopulation = saved;
    console.log('[PvPEvolution] Đã khôi phục quần thể PvP Bot từ bộ nhớ cục bộ (20 cá thể).');
  }
  isPopulationLoaded = true;
}

/**
 * Đánh giá độ thích nghi (Fitness Evaluation) của Bot PvP đối với đối thủ
 */
export function evaluateFitness(bot, userElo, matchResult) {
  const eloDiff = Math.abs(bot.elo - userElo);
  const eloMatchScore = Math.max(0, 1 - eloDiff / 500); // Thích nghi cao nếu Elo cận kề người chơi
  const winScore = matchResult === 'win' ? 1.0 : matchResult === 'draw' ? 0.5 : 0.2;
  
  return Number((0.6 * winScore + 0.4 * eloMatchScore).toFixed(4));
}

/**
 * Thuật toán Di truyền Tiến hóa Quần thể Bot (Genetic Algorithm Step)
 */
export function evolvePvPPopulation(matchLogs = []) {
  ensurePopulationLoaded();

  // Nếu matchLogs rỗng, tạo 1 sự kiện tự tiến hóa nhẹ để đẩy thế hệ
  const effectiveLogs = matchLogs.length > 0 ? matchLogs : [
    { botId: currentPopulation[0]?.id || 'bot_evo_1', userElo: 1200, result: 'win' }
  ];

  // 1. Tính toán Fitness tích lũy từ lịch sử trận đấu
  currentPopulation.forEach(bot => {
    const botLogs = effectiveLogs.filter(l => l.botId === bot.id);
    if (botLogs.length > 0) {
      const totalFit = botLogs.reduce((acc, l) => acc + evaluateFitness(bot, l.userElo, l.result), 0);
      bot.fitness = Number((totalFit / botLogs.length).toFixed(4));
      bot.matchesPlayed += botLogs.length;
    } else {
      bot.fitness = 0.5;
    }
  });

  // 2. Sắp xếp quần thể theo Fitness giảm dần
  currentPopulation.sort((a, b) => b.fitness - a.fitness);

  // 3. Giữ lại Top 5 cá thể ưu tú nhất (Elitism)
  const nextGen = currentPopulation.slice(0, 5).map(b => ({ ...b }));

  // 4. Lai ghép (Crossover) và Đột biến (Mutation) tạo 15 cá thể thế hệ mới
  while (nextGen.length < 20) {
    const parentA = currentPopulation[Math.floor(Math.random() * 5)];
    const parentB = currentPopulation[Math.floor(Math.random() * 10)];

    // Crossover (Lai ghép điểm mút)
    const childAccuracy = Number(((parentA.accuracyRate + parentB.accuracyRate) / 2).toFixed(3));
    const childSpeed = Number(((parentA.responseTimeSec + parentB.responseTimeSec) / 2).toFixed(1));
    
    // Mutation (Đột biến ngẫu nhiên ±5%)
    const mutationFactor = (Math.random() - 0.5) * 0.1;
    const finalAccuracy = Math.min(0.98, Math.max(0.35, Number((childAccuracy + mutationFactor).toFixed(3))));

    nextGen.push({
      id: `bot_evo_${nextGen.length + 1}`,
      name: `PvP Bot Gen-${Math.floor(nextGen.length / 5) + 1} (${nextGen.length + 1})`,
      elo: Math.round((parentA.elo + parentB.elo) / 2 + (Math.random() - 0.5) * 60),
      accuracyRate: finalAccuracy,
      responseTimeSec: Math.max(3, Number((childSpeed + mutationFactor * 10).toFixed(1))),
      aggressionRate: Number(Math.min(0.9, Math.max(0.1, parentA.aggressionRate + mutationFactor)).toFixed(2)),
      fitness: 0,
      matchesPlayed: 0,
      wins: 0
    });
  }

  currentPopulation = nextGen;
  savePopulationToLocalStorage(currentPopulation);
  return currentPopulation;
}

/**
 * Chọn lọc cá thể Bot PvP tối ưu nhất cho học sinh dựa trên Elo thời gian thực
 */
export function getEvolvedBotCandidate(userElo = 1000) {
  ensurePopulationLoaded();

  // Tìm bot có Elo gần nhất và có độ tương thích cao
  const candidates = [...currentPopulation].sort((a, b) => {
    const diffA = Math.abs(a.elo - userElo);
    const diffB = Math.abs(b.elo - userElo);
    return diffA - diffB;
  });

  return candidates[0] || INITIAL_PVP_BOT_POPULATION[0];
}

/**
 * Hàm phân tích Percentile Dwell Time (Addendum #1 Task)
 * Tự động xác định DwellTimeMin (P25) và DwellTimeMax (P75) từ dữ liệu thô
 */
export function calculateDwellTimePercentiles(rawDwellTimes = []) {
  if (!rawDwellTimes || rawDwellTimes.length === 0) {
    return { dwellTimeMin: 15, dwellTimeMax: 45, count: 0 };
  }

  const sorted = [...rawDwellTimes].sort((a, b) => a - b);
  const p25Index = Math.floor(sorted.length * 0.25);
  const p75Index = Math.floor(sorted.length * 0.75);

  const dwellTimeMin = sorted[p25Index] || 15;
  const dwellTimeMax = sorted[p75Index] || 45;

  return {
    dwellTimeMin,
    dwellTimeMax,
    median: sorted[Math.floor(sorted.length * 0.5)] || 25,
    count: sorted.length
  };
}
