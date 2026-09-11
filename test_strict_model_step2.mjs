import fs from 'fs';
import * as tf from '@tensorflow/tfjs';
import { predictSuccessProbability, getOrInitOnlineModel } from './src/lib/onlineLearningEngine.js';

const storageFile = './test_model_storage.json';

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

async function runStep2() {
  console.log('--- STEP 2: Khởi động mới hoàn toàn Process Node.js #2 (RAM SẠCH 100%, onlineModel = null) ---');
  const inputFeatures = [0.25, 0.5, 0.48, 0.1, 0.25, 0.8];
  
  const { pred1, sampleWeight } = JSON.parse(fs.readFileSync('./test_step1_result.json', 'utf8'));

  // Gọi predictSuccessProbability -> Tự động kích hoạt getOrInitOnlineModel() -> Tải weights từ storage -> Thực thi setWeights()
  const pred2 = await predictSuccessProbability(inputFeatures);

  const model2 = await getOrInitOnlineModel();
  const restoredWeights2 = model2.getWeights().map(w => Array.from(w.dataSync()));
  const sampleWeight2 = restoredWeights2[0].slice(0, 3);

  console.log(`[Process #2] Trọng số Layer 0 sau khi setWeights():`, sampleWeight2);
  console.log(`[Process #2] Xác suất dự đoán probSuccess (Sau khi khôi phục setWeights): ${pred2.toFixed(6)}`);

  const diff = Math.abs(pred1 - pred2);
  console.log(`- ĐỘ CHÊNH LỆCH DỰ ĐOÁN GIỮA 2 PROCESS RIÊNG BIỆT: ${diff.toFixed(8)}`);

  if (diff < 1e-6) {
    console.log('=> KẾT QUẢ TEST 1: ✅ THÀNH CÔNG HOÀN HẢO! setWeights() ĐÃ KHÔI PHỤC VÀ ÁP DỤNG TRỌNG SỐ CHÍNH XÁC 100% TRONG NGUYÊN NGUYÊN BẢN PROCESS SẠCH!');
  } else {
    console.log('=> KẾT QUẢ TEST 1: ❌ THẤT BẠI!');
  }
  process.exit(0);
}

runStep2();
