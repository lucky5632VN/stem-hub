import fs from 'fs';
import * as tf from '@tensorflow/tfjs';
import { trainOnlineStep, predictSuccessProbability, getOrInitOnlineModel } from './src/lib/onlineLearningEngine.js';

const storageFile = './test_model_storage.json';
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

async function runStep1() {
  console.log('--- STEP 1: Huấn luyện Mô hình TF.js (Process Node.js #1 - RAM Sạch) ---');
  const inputFeatures = [0.25, 0.5, 0.48, 0.1, 0.25, 0.8];
  
  // Fit 10 epochs
  for (let i = 0; i < 10; i++) {
    await trainOnlineStep(inputFeatures, 1.0);
  }

  const pred1 = await predictSuccessProbability(inputFeatures);
  const model = await getOrInitOnlineModel();
  const weights1 = model.getWeights().map(w => Array.from(w.dataSync()));

  console.log(`[Process #1] Trọng số Layer 0 (3 phần tử đầu):`, weights1[0].slice(0, 3));
  console.log(`[Process #1] Xác suất dự đoán probSuccess (Trước khi tắt app): ${pred1.toFixed(6)}`);

  fs.writeFileSync('./test_step1_result.json', JSON.stringify({ pred1, sampleWeight: weights1[0].slice(0, 3) }));
  console.log('[Process #1] Đã huấn luyện 10 bước, ghi file storage & THOÁT TIẾN TRÌNH 1.\n');
  process.exit(0);
}

runStep1();
