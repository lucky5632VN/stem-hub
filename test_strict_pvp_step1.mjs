import fs from 'fs';
import { evolvePvPPopulation } from './src/lib/pvpEvolutionEngine.js';

const storageFile = './test_pvp_storage.json';
if (!fs.existsSync(storageFile)) {
  fs.writeFileSync(storageFile, JSON.stringify({}));
}

const mockLocalStorage = {
  setItem: (key, val) => {
    let data = {};
    try { data = JSON.parse(fs.readFileSync(storageFile, 'utf8')); } catch (_) {}
    data[key] = val;
    fs.writeFileSync(storageFile, JSON.stringify(data, null, 2));
  },
  getItem: (key) => {
    try {
      const data = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
      return data[key] || null;
    } catch (_) {
      return null;
    }
  }
};

global.window = { localStorage: mockLocalStorage };
global.localStorage = mockLocalStorage;

async function runPvpStep1() {
  console.log('--- PVP TEST STEP 1: Khởi tạo & Tiến hóa Quần thể Bot (Process Node.js #1) ---');
  
  // Tiến hóa thế hệ đầu tiên
  const popGen1 = evolvePvPPopulation([
    { botId: 'bot_evo_1', userElo: 1200, result: 'win' },
    { botId: 'bot_evo_2', userElo: 1250, result: 'win' }
  ]);

  const meanAccuracy1 = Number((popGen1.reduce((sum, b) => sum + b.accuracyRate, 0) / popGen1.length).toFixed(4));
  const meanSpeed1 = Number((popGen1.reduce((sum, b) => sum + b.responseTimeSec, 0) / popGen1.length).toFixed(2));
  const meanFitness1 = Number((popGen1.reduce((sum, b) => sum + b.fitness, 0) / popGen1.length).toFixed(4));
  const botNamesGen1 = popGen1.slice(0, 3).map(b => b.name);

  console.log(`[Process #1 - Thế hệ 1] Số lượng cá thể: ${popGen1.length}`);
  console.log(`[Process #1 - Thế hệ 1] Độ chính xác trung bình (20 bots): ${meanAccuracy1}`);
  console.log(`[Process #1 - Thế hệ 1] Tốc độ phản hồi trung bình (20 bots): ${meanSpeed1}s`);
  console.log(`[Process #1 - Thế hệ 1] Fitness trung bình: ${meanFitness1}`);
  console.log(`[Process #1 - Thế hệ 1] 3 Bot đầu tiên:`, botNamesGen1);

  fs.writeFileSync('./test_pvp_step1_result.json', JSON.stringify({
    meanAccuracy1,
    meanSpeed1,
    meanFitness1,
    botNamesGen1
  }));

  console.log('[Process #1] Đã lưu Quần thể 20 Bot vào LocalStorage & THOÁT TIẾN TRÌNH.\n');
  process.exit(0);
}

runPvpStep1();
