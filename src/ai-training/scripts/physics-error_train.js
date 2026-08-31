import fs from 'fs';
import path from 'path';

const datasetPath = path.resolve('src/ai-training/datasets/physics-error/attempts.json');
const unseenPath = path.resolve('src/ai-training/datasets/physics-error/unseen-test-physics.json');

const rawData = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
const unseenData = JSON.parse(fs.readFileSync(unseenPath, 'utf-8'));

export function classifyPhysicsError(attempt, k = 3, dataset = rawData) {
  const angleDiff = Math.abs(attempt.angleDiff || 0);
  const posOffset = Math.abs(attempt.posOffset || 0);
  const indexDiff = Math.abs(attempt.indexDiff || 0);

  const normAngle = angleDiff / 30.0;
  const normPos = posOffset / 50.0;
  const normIndex = indexDiff / 0.5;

  const distances = dataset.map(sample => {
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

  let topErrorType = dataset[0].errorType;
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

function runFiveFoldCrossValidation(dataset, k = 5) {
  const shuffled = [...dataset].sort(() => 0.5 - Math.random());
  const foldSize = Math.floor(shuffled.length / k);
  const accuracies = [];

  for (let fold = 0; fold < k; fold++) {
    const testSet = shuffled.slice(fold * foldSize, (fold + 1) * foldSize);
    const trainSet = [
      ...shuffled.slice(0, fold * foldSize),
      ...shuffled.slice((fold + 1) * foldSize)
    ];

    let correct = 0;
    testSet.forEach(sample => {
      const pred = classifyPhysicsError({
        angleDiff: sample.angleDiff,
        posOffset: sample.posOffset,
        indexDiff: sample.indexDiff
      }, 3, trainSet);

      if (pred.errorType === sample.errorType) correct++;
    });

    accuracies.push((correct / testSet.length) * 100);
  }

  const meanAcc = accuracies.reduce((a, b) => a + b, 0) / k;
  return meanAcc;
}

function trainAndSaveModel() {
  console.log('⚡ [Physics Error Model] Bắt đầu đánh giá 5-Fold Cross Validation & Unseen Test Set...');

  const cvAcc = runFiveFoldCrossValidation(rawData, 5);

  // Evaluate on Unseen Holdout Test Set
  let unseenCorrect = 0;
  unseenData.forEach(sample => {
    const pred = classifyPhysicsError({
      angleDiff: sample.angleDiff,
      posOffset: sample.posOffset,
      indexDiff: sample.indexDiff
    }, 3, rawData);
    if (pred.errorType === sample.errorType) unseenCorrect++;
  });
  const unseenAcc = (unseenCorrect / unseenData.length) * 100;

  console.log(`📊 Model: Physics Optics Diagnostic kNN Classifier`);
  console.log(`- Dataset size: ${rawData.length} mẫu`);
  console.log(`- 5-Fold Cross-Validation Accuracy (Trung bình 5 lần): ${cvAcc.toFixed(1)}%`);
  console.log(`- Accuracy trên bộ test MỚI (Unseen 30 mẫu holdout): ${unseenAcc.toFixed(1)}%`);
  console.log(`- Nhận xét trung thực: Mô hình kNN phân loại chính xác dựa trên khoảng cách khoảng không không gian chuẩn hóa. Khi biên độ sai số kết hợp đồng thời cả 3 yếu tố, độ chính xác có thể biến thiên.`);

  const savePath = path.resolve('src/data/models/physics-error-model.json');
  fs.mkdirSync(path.dirname(savePath), { recursive: true });
  fs.writeFileSync(savePath, JSON.stringify({
    metadata: {
      modelName: "Physics Optics Diagnostic kNN Classifier",
      trainedAt: new Date().toISOString(),
      datasetSize: rawData.length,
      kNeighbors: 3,
      crossValidationAccuracy: `${cvAcc.toFixed(1)}%`,
      unseenTestAccuracy: `${unseenAcc.toFixed(1)}%`
    },
    dataset: rawData
  }, null, 2), 'utf-8');

  console.log(`✅ [Physics Error Model] Đã lưu model thành công tại: ${savePath}`);
}

trainAndSaveModel();
