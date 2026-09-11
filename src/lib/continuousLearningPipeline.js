import { calculateImplicitReward, DEFAULT_REWARD_WEIGHTS } from './rewardEngine.js';
import { trainOnlineStep, predictSuccessProbability, getOrInitOnlineModel } from './onlineLearningEngine.js';
import { logAIMetricEvent, saveModelSnapshotToServer } from './memoryService.js';
import { auth } from './firebase.js';

let stepCounter = 0;

/**
 * PIPELINE HỌC LIÊN TỤC (Continuous Learning Loop)
 * Gọi tự động sau mỗi lượt tương tác của học sinh
 */
export async function processInteractionFeedback({
  subjectCode = 1,          // 1: Chem, 2: Phys, 3: Math, 4: Bio
  questionDifficulty = 0.5, // 0.0 - 1.0
  userElo = 1000,
  streakCount = 0,
  avgResponseTimeSec = 20,
  accuracyLast10 = 0.8,
  
  // Tín hiệu từ Implicit Reward
  actionSuccess = false,
  dwellTimeSeconds = 0,
  isReaskOrQuickClose = false,
  weights = DEFAULT_REWARD_WEIGHTS
}) {
  // 1. Tính toán Implicit Reward & Nhãn Sigmoid [0.0, 1.0]
  const rewardResult = calculateImplicitReward({
    actionSuccess,
    dwellTimeSeconds,
    isReaskOrQuickClose,
    weights
  });

  // 2. Định dạng 6 Input Features cho TensorFlow.js Model Tầng 3
  const inputFeatures = [
    subjectCode / 4.0,                        // Normalized Subject Code
    questionDifficulty,                       // Difficulty [0, 1]
    Math.min(1.0, userElo / 2500.0),          // Normalized Elo
    Math.min(1.0, streakCount / 10.0),        // Normalized Streak
    Math.min(1.0, avgResponseTimeSec / 60.0), // Normalized Avg Response Time
    accuracyLast10                            // Accuracy last 10 [0, 1]
  ];

  const targetLabel = rewardResult.normalizedLabel;
  const currentUid = auth?.currentUser?.uid || null;

  // 3. Huấn luyện 1 bước (Online Fit) và lưu IndexedDB/Firestore
  const trainResult = await trainOnlineStep(inputFeatures, targetLabel, currentUid);
  stepCounter++;

  // 4. Ghi log sự kiện vào Queue (Batching 5 items trước khi lưu Firestore)
  const isSimulated = !auth?.currentUser;
  
  await logAIMetricEvent({
    step: stepCounter,
    loss: trainResult.loss,
    reward: rewardResult.clampedReward,
    label: targetLabel,
    rawDwellTimeSeconds: rewardResult.rawMetrics.dwellTimeSeconds, // GHI LẠI DWELL TIME THÔ NGUYÊN TẮC ADDENDUM 1
    actionSuccess: rewardResult.rawMetrics.actionSuccess,
    isReask: rewardResult.rawMetrics.isReaskOrQuickClose,
    isSimulated,
    timestamp: trainResult.timestamp
  });

  // 5. Định kỳ 20 bước: Snapshot trọng số lên Firestore
  if (stepCounter % 20 === 0 && currentUid) {
    try {
      const model = await getOrInitOnlineModel(currentUid);
      const weightsData = model.getWeights().map(w => Array.from(w.dataSync()));
      await saveModelSnapshotToServer(currentUid, weightsData, stepCounter);
    } catch (e) {
      console.warn('[ContinuousPipeline] Snapshot warning:', e.message);
    }
  }

  return {
    step: stepCounter,
    loss: trainResult.loss,
    reward: rewardResult.clampedReward,
    label: targetLabel,
    dwellTimeSeconds
  };
}

/**
 * Gợi ý độ khó câu hỏi tiếp theo dựa trên xác suất dự đoán của Tầng 3
 */
export async function getAdaptiveDifficultyRecommendation(inputFeatures) {
  const probSuccess = await predictSuccessProbability(inputFeatures);
  
  // Nâng cấp ELO thích ứng dựa trên xác suất dự đoán
  if (probSuccess > 0.8) {
    return { recommendedDifficulty: 'hard', deltaElo: +15, probSuccess };
  } else if (probSuccess < 0.4) {
    return { recommendedDifficulty: 'easy', deltaElo: -10, probSuccess };
  }
  return { recommendedDifficulty: 'medium', deltaElo: 0, probSuccess };
}
