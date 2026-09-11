/**
 * ONLINE LEARNING ENGINE (Tầng 3 - TensorFlow.js Client-Side Model)
 * 
 * Mô hình Neural Network nhỏ (1 Hidden Layer, 12 Neurons) cập nhật trực tiếp
 * sau mỗi tương tác người dùng qua model.fit() và lưu vào IndexedDB.
 */
import * as tf from '@tensorflow/tfjs';
import { saveWeightsToIndexedDB, loadWeightsFromIndexedDB } from './indexedDB.js';

// Tắt thông báo warning trùng lặp backend/kernel của TensorFlow.js khi Hot-reload trong Next.js Dev
try {
  if (tf && tf.env) {
    tf.env().set('PROD', true);
  }
} catch (_) {}

let onlineModel = null;

export async function getOrInitOnlineModel(uid = null) {
  if (onlineModel) return onlineModel;

  // Khởi tạo Sequential Model
  const model = tf.sequential();
  // Input 6 features: [subject_code, difficulty, user_elo_norm, streak, avg_time_sec_norm, acc_last_10]
  model.add(tf.layers.dense({ units: 12, inputShape: [6], activation: 'relu', kernelInitializer: 'glorotNormal' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });

  // Load weights từ Server Snapshot (Firestore) hoặc IndexedDB/localStorage
  try {
    let cachedWeights = null;
    if (uid) {
      try {
        const { getModelSnapshotFromServer } = await import('./memoryService.js');
        const snapshot = await getModelSnapshotFromServer(uid);
        if (snapshot && snapshot.weights) {
          cachedWeights = snapshot.weights;
          console.log(`[OnlineLearningEngine] Đã tải Snapshot từ Server Firestore (Step #${snapshot.stepCount}).`);
        }
      } catch (e) {
        console.warn('[OnlineLearningEngine] Fallback đọc bộ nhớ cục bộ:', e.message);
      }
    }

    if (!cachedWeights) {
      cachedWeights = await loadWeightsFromIndexedDB('tfjs_online_model_v1');
    }

    if (typeof cachedWeights === 'string') {
      try {
        cachedWeights = JSON.parse(cachedWeights);
      } catch (_) {}
    }

    if (cachedWeights && Array.isArray(cachedWeights)) {
      // QUAN TRỌNG: Tái tạo Tensors và gọi model.setWeights() để áp dụng lại trọng số đã học!
      const restoredTensors = cachedWeights.map((w, i) => tf.tensor(w, model.getWeights()[i].shape));
      model.setWeights(restoredTensors);
      restoredTensors.forEach(t => t.dispose());
      console.log('[OnlineLearningEngine] Đã khôi phục và ÁP DỤNG trọng số từ bộ nhớ cục bộ / Server.');
    }
  } catch (e) {
    console.warn('[OnlineLearningEngine] Lỗi khôi phục trọng số:', e.message);
  }

  onlineModel = model;
  return onlineModel;
}

/**
 * Thực hiện fit mô hình online sau 1 lượt tương tác
 */
export async function trainOnlineStep(inputFeatures, labelTarget, uid = null) {
  const model = await getOrInitOnlineModel(uid);
  
  const xs = tf.tensor2d([inputFeatures], [1, 6]);
  const ys = tf.tensor2d([[labelTarget]], [1, 1]);

  const history = await model.fit(xs, ys, {
    epochs: 1,
    batchSize: 1
  });

  const currentLoss = history.history.loss[0];

  // Lưu trọng số vào IndexedDB/localStorage
  try {
    const weightsData = model.getWeights().map(w => Array.from(w.dataSync()));
    await saveWeightsToIndexedDB('tfjs_online_model_v1', weightsData);
  } catch (e) {
    console.warn('[OnlineLearningEngine] IndexedDB Save warning:', e.message);
  }

  xs.dispose();
  ys.dispose();

  return {
    loss: currentLoss,
    timestamp: Date.now()
  };
}

/**
 * Dự đoán xác suất làm đúng/thành công câu hỏi tiếp theo
 */
export async function predictSuccessProbability(inputFeatures, uid = null) {
  const model = await getOrInitOnlineModel(uid);
  const xs = tf.tensor2d([inputFeatures], [1, 6]);
  const pred = model.predict(xs);
  const prob = (await pred.data())[0];
  xs.dispose();
  pred.dispose();
  return prob;
}
