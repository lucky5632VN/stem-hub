import fs from 'fs';
import path from 'path';

const datasetPath = path.resolve('src/ai-training/datasets/physics-error/attempts.json');
const rawData = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

// k-Nearest Neighbors (kNN) Classifier
export function classifyPhysicsError(attempt, k = 3) {
  const angleDiff = Math.abs(attempt.angleDiff || 0);
  const posOffset = Math.abs(attempt.posOffset || 0);
  const indexDiff = Math.abs(attempt.indexDiff || 0);

  // Normalize inputs (Weights: angle: 1/30, pos: 1/50, index: 1/0.5)
  const normAngle = angleDiff / 30.0;
  const normPos = posOffset / 50.0;
  const normIndex = indexDiff / 0.5;

  const distances = rawData.map(sample => {
    const sAngle = sample.angleDiff / 30.0;
    const sPos = sample.posOffset / 50.0;
    const sIndex = sample.indexDiff / 0.5;

    const dist = Math.sqrt(
      Math.pow(normAngle - sAngle, 2) +
      Math.pow(normPos - sPos, 2) +
      Math.pow(normIndex - sIndex, 2)
    );

    return { label: sample.label, errorType: sample.errorType, dist };
  });

  distances.sort((a, b) => a.dist - b.dist);
  const kNearest = distances.slice(0, k);

  const votes = {};
  kNearest.forEach(n => {
    votes[n.errorType] = (votes[n.errorType] || 0) + 1;
  });

  let topErrorType = rawData[0].errorType;
  let maxVotes = 0;
  for (const [errType, count] of Object.entries(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      topErrorType = errType;
    }
  }

  return {
    errorType: topErrorType,
    confidence: maxVotes / k,
    neighbors: kNearest
  };
}

function trainAndSaveModel() {
  console.log('⚡ [Physics Error Model] Bắt đầu huấn luyện kNN Classifier (k=3)...');

  let correct = 0;
  rawData.forEach(sample => {
    const pred = classifyPhysicsError({
      angleDiff: sample.angleDiff,
      posOffset: sample.posOffset,
      indexDiff: sample.indexDiff
    }, 3);
    if (pred.errorType === sample.errorType) correct++;
  });

  const accuracy = (correct / rawData.length) * 100;
  console.log(`📊 [Physics Error Model] Accuracy trên tập dữ liệu (${rawData.length} mẫu): ${accuracy.toFixed(1)}%`);

  const savePath = path.resolve('src/data/models/physics-error-model.json');
  fs.mkdirSync(path.dirname(savePath), { recursive: true });
  fs.writeFileSync(savePath, JSON.stringify({
    metadata: {
      modelName: "Physics Optics Diagnostic kNN Classifier",
      trainedAt: new Date().toISOString(),
      datasetSize: rawData.length,
      kNeighbors: 3,
      accuracy: `${accuracy.toFixed(1)}%`
    },
    dataset: rawData
  }, null, 2), 'utf-8');

  console.log(`✅ [Physics Error Model] Đã lưu model thành công tại: ${savePath}`);
}

trainAndSaveModel();
