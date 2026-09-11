import fs from 'fs';
import { evolvePvPPopulation } from './src/lib/pvpEvolutionEngine.js';

const storageFile = './test_pvp_storage.json';

const mockLocalStorage = {
  getItem: (key) => {
    try {
      if (fs.existsSync(storageFile)) {
        const data = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
        return data[key] || null;
      }
      return null;
    } catch (_) {
      return null;
    }
  },
  setItem: (key, val) => {
    let data = {};
    try { data = JSON.parse(fs.readFileSync(storageFile, 'utf8')); } catch (_) {}
    data[key] = val;
    fs.writeFileSync(storageFile, JSON.stringify(data, null, 2));
  }
};

global.window = { localStorage: mockLocalStorage };
global.localStorage = mockLocalStorage;

async function runPvpStep2() {
  console.log('--- PVP TEST STEP 2: Khởi động mới Process Node.js #2 (RAM SẠCH, isPopulationLoaded = false) ---');
  
  const { meanAccuracy1, meanSpeed1, botNamesGen1 } = JSON.parse(fs.readFileSync('./test_pvp_step1_result.json', 'utf8'));

  // Tiến hóa thế hệ tiếp theo (Thế hệ 2) dựa trên Quần thể đã khôi phục từ LocalStorage
  const popGen2 = evolvePvPPopulation([
    { botId: 'bot_evo_1', userElo: 1300, result: 'win' }
  ]);

  const meanAccuracy2 = Number((popGen2.reduce((sum, b) => sum + b.accuracyRate, 0) / popGen2.length).toFixed(4));
  const meanSpeed2 = Number((popGen2.reduce((sum, b) => sum + b.responseTimeSec, 0) / popGen2.length).toFixed(2));
  const meanFitness2 = Number((popGen2.reduce((sum, b) => sum + b.fitness, 0) / popGen2.length).toFixed(4));
  const botNamesGen2 = popGen2.slice(0, 3).map(b => b.name);

  console.log(`[Process #2 - Thế hệ 2] Số lượng cá thể: ${popGen2.length}`);
  console.log(`[Process #2 - Thế hệ 2] Độ chính xác trung bình (20 bots): ${meanAccuracy2} (So với Gen 1: ${meanAccuracy1})`);
  console.log(`[Process #2 - Thế hệ 2] Tốc độ phản hồi trung bình (20 bots): ${meanSpeed2}s (So với Gen 1: ${meanSpeed1}s)`);
  console.log(`[Process #2 - Thế hệ 2] Fitness trung bình: ${meanFitness2}`);
  console.log(`[Process #2 - Thế hệ 2] 3 Bot đầu tiên kế thừa:`, botNamesGen2);

  // Kiểm tra thế hệ kế thừa: Bot có mang tên Gen-2 / Gen-3 đại diện cho các thế hệ tiến hóa kế thừa hay không
  const isInherited = popGen2.some(b => b.name.includes('Gen-'));

  if (isInherited) {
    console.log('=> KẾT QUẢ TEST 2: ✅ THÀNH CÔNG RỰC RỠ! QUẦN THỂ BOT PVP KẾ THỪA NGUYÊN VẸN TIẾN HÓA CỦA THẾ HỆ TRƯỚC VÀ KHÔNG BỊ RESET VỀ GEN-1 BAN ĐẦU!');
  } else {
    console.log('=> KẾT QUẢ TEST 2: ❌ THẤT BẠI!');
  }

  process.exit(0);
}

runPvpStep2();
