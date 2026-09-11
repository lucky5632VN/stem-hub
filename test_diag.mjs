import fs from 'fs';
import * as tf from '@tensorflow/tfjs';
import { trainOnlineStep, predictSuccessProbability, getOrInitOnlineModel } from './src/lib/onlineLearningEngine.js';

const storageFile = './test_model_storage.json';
fs.writeFileSync(storageFile, JSON.stringify({}));

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

async function diag() {
  const inputFeatures = [0.25, 0.5, 0.48, 0.1, 0.25, 0.8];
  
  // 1. Train 10 steps
  for (let i = 0; i < 10; i++) {
    await trainOnlineStep(inputFeatures, 1.0);
  }

  const model1 = await getOrInitOnlineModel();
  const weights1 = model1.getWeights().map(w => Array.from(w.dataSync()));
  const xs1 = tf.tensor2d([inputFeatures], [1, 6]);
  const pred1 = (await model1.predict(xs1).data())[0];

  console.log('Model 1 Trained Weights Layer 0:', weights1[0].slice(0, 3));
  console.log('Model 1 Prediction:', pred1);

  const fileData = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
  console.log('Keys in Storage File:', Object.keys(fileData));
  const rawItem = fileData['weights_tfjs_online_model_v1'];
  console.log('Raw Storage Item Type:', typeof rawItem);

  let parsed = typeof rawItem === 'string' ? JSON.parse(rawItem) : rawItem;
  if (typeof parsed === 'string') parsed = JSON.parse(parsed);

  console.log('Parsed Weights Layer 0:', parsed[0].slice(0, 3));

  // 2. Re-create model 2
  const model2 = tf.sequential();
  model2.add(tf.layers.dense({ units: 12, inputShape: [6], activation: 'relu', kernelInitializer: 'glorotNormal' }));
  model2.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  const restoredTensors = parsed.map((w, i) => tf.tensor(w, model2.getWeights()[i].shape));
  model2.setWeights(restoredTensors);

  const pred2 = (await model2.predict(xs1).data())[0];
  console.log('Model 2 Restored Prediction:', pred2);
  console.log('Exact Match:', Math.abs(pred1 - pred2) < 1e-6);
}

diag();
