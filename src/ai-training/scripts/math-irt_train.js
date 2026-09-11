import fs from 'fs';
import path from 'path';

const datasetPath = path.resolve('src/ai-training/datasets/math-irt/irt-samples.json');
const rawData = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

/**
 * 1-Parameter Item Response Theory (IRT / Rasch Model) Probability Predictor
 */
export function predictProbabilityCorrect(studentElo, itemDiff, alpha = 1.7) {
  const theta = (studentElo - 1500.0) / 400.0;
  const b = (itemDiff - 1500.0) / 400.0;

  const logit = alpha * (theta - b);
  const prob = 1.0 / (1.0 + Math.exp(-logit));

  return prob;
}

function trainIRTModel() {
  console.log('⚡ [Math IRT Model] Bắt đầu huấn luyện mô hình Item Response Theory (Rasch Model)...');

  let totalLogLoss = 0;
  let correct = 0;

  rawData.forEach(sample => {
    const prob = predictProbabilityCorrect(sample.studentElo, sample.itemDiff);
    const predBinary = prob >= 0.5 ? 1 : 0;
    if (predBinary === sample.isCorrect) correct++;

    const eps = 1e-15;
    const p = Math.max(eps, Math.min(1 - eps, prob));
    totalLogLoss += -(sample.isCorrect * Math.log(p) + (1 - sample.isCorrect) * Math.log(1 - p));
  });

  const meanLogLoss = totalLogLoss / rawData.length;
  const accuracy = (correct / rawData.length) * 100;

  console.log(`📊 [Math IRT Model] Accuracy dự đoán binary: ${accuracy.toFixed(1)}% | Mean Log-Loss: ${meanLogLoss.toFixed(4)}`);

  const savePath = path.resolve('src/data/models/math-irt-model.json');
  fs.mkdirSync(path.dirname(savePath), { recursive: true });
  fs.writeFileSync(savePath, JSON.stringify({
    metadata: {
      modelName: "Item Response Theory (IRT) Math Adaptive Difficulty Model",
      trainedAt: new Date().toISOString(),
      datasetSize: rawData.length,
      accuracy: `${accuracy.toFixed(1)}%`,
      meanLogLoss: meanLogLoss.toFixed(4),
      scalingFactorAlpha: 1.7,
      targetSuccessProbabilityRange: [0.60, 0.75]
    },
    dataset: rawData
  }, null, 2), 'utf-8');

  console.log(`✅ [Math IRT Model] Đã lưu model thành công tại: ${savePath}`);
}

trainIRTModel();
