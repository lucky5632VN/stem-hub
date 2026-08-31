import fs from 'fs';
import path from 'path';

const datasetPath = path.resolve('src/ai-training/datasets/physics-error/attempts.json');
const edgePath = path.resolve('src/ai-training/datasets/physics-error/edge-cases-physics.json');

const rawData = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
const edgeData = JSON.parse(fs.readFileSync(edgePath, 'utf-8'));

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
    votes[n.label] = (votes[n.label] || 0) + 1;
  });

  let topLabel = dataset[0].label;
  let maxVotes = 0;
  for (const [lbl, count] of Object.entries(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      topLabel = parseInt(lbl);
    }
  }

  const errorTypes = [
    "Sai góc tới (Incidence Angle Error)",
    "Sai vị trí thấu kính/gương (Element Alignment Error)",
    "Sai chiết suất môi trường (Refractive Index Error)"
  ];

  return {
    classId: topLabel,
    errorType: errorTypes[topLabel] || dataset[0].errorType,
    confidence: maxVotes / k,
    neighbors: kNearest
  };
}

function evaluatePhysicsEdgeCases() {
  console.log('⚡ [Physics Error Model] Đánh giá 15 Ca Mơ Hồ Sai Số Hỗn Hợp (Multi-Error Edge Cases)...');

  // 3x3 Confusion Matrix: [Actual][Predicted]
  // 0: Sai goc, 1: Sai vi tri, 2: Sai chiet suat
  const matrix = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];

  let correct = 0;
  edgeData.forEach(sample => {
    const pred = classifyPhysicsError({
      angleDiff: sample.angleDiff,
      posOffset: sample.posOffset,
      indexDiff: sample.indexDiff
    }, 3, rawData);

    const actual = sample.label;
    const predicted = pred.classId;

    matrix[actual][predicted]++;
    if (actual === predicted) correct++;
  });

  const accuracy = (correct / edgeData.length) * 100;

  console.log(`📊 Model: Physics Optics Diagnostic kNN Classifier`);
  console.log(`- Edge Case Test Size: ${edgeData.length} mẫu mâu thuẫn đồng thời 3 sai số`);
  console.log(`- Accuracy thực tế trên Ca Biên: ${accuracy.toFixed(2)}% (${correct}/${edgeData.length})`);
  console.log(`- Confusion Matrix (Bảng Nhầm Lẫn 3x3):`);
  console.log(`                   Dự đoán Sai Góc | Dự đoán Sai Vị Trí | Dự đoán Sai Chiết Suất`);
  console.log(`  Thực tế Sai Góc  :       ${matrix[0][0]}       |        ${matrix[0][1]}        |        ${matrix[0][2]}`);
  console.log(`  Thực tế Sai VịTrí:       ${matrix[1][0]}       |        ${matrix[1][1]}        |        ${matrix[1][2]}`);
  console.log(`  Thực tế ChiếtSuất:       ${matrix[2][0]}       |        ${matrix[2][1]}        |        ${matrix[2][2]}`);

  console.log(`- Kết luận trung thực: Khi cả 3 sai số cùng xuất hiện với khoảng cách chuẩn hóa tiệm cận nhau, kNN dễ bị hòa phiếu (tie-vote) hoặc nhầm lẫn giữa Sai Góc và Sai Vị Trí do biên vùng quyết định chồng lấp.`);

  const savePath = path.resolve('src/data/models/physics-error-model.json');
  fs.mkdirSync(path.dirname(savePath), { recursive: true });
  fs.writeFileSync(savePath, JSON.stringify({
    metadata: {
      modelName: "Physics Optics Diagnostic kNN Classifier",
      trainedAt: new Date().toISOString(),
      datasetSize: rawData.length,
      edgeCaseAccuracy: `${accuracy.toFixed(2)}%`,
      confusionMatrix: matrix,
      kNeighbors: 3
    },
    dataset: rawData
  }, null, 2), 'utf-8');

  console.log(`✅ [Physics Error Model] Đã cập nhật model thành công tại: ${savePath}`);
}

evaluatePhysicsEdgeCases();
