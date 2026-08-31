import fs from 'fs';
import path from 'path';

const datasetPath = path.resolve('src/ai-training/datasets/physics-error/attempts.json');
const edgePath = path.resolve('src/ai-training/datasets/physics-error/edge-cases-physics.json');

const rawData = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
const edgeData = JSON.parse(fs.readFileSync(edgePath, 'utf-8'));

// 1. Compute Mean and StdDev from TRAIN dataset for Z-Score Normalization (StandardScaler)
function computeScaler(dataset) {
  const n = dataset.length;
  const sumAngle = dataset.reduce((s, d) => s + Math.abs(d.angleDiff || 0), 0);
  const sumPos = dataset.reduce((s, d) => s + Math.abs(d.posOffset || 0), 0);
  const sumIndex = dataset.reduce((s, d) => s + Math.abs(d.indexDiff || 0), 0);

  const meanAngle = sumAngle / n;
  const meanPos = sumPos / n;
  const meanIndex = sumIndex / n;

  const stdAngle = Math.sqrt(dataset.reduce((s, d) => s + Math.pow(Math.abs(d.angleDiff || 0) - meanAngle, 2), 0) / n) || 1.0;
  const stdPos = Math.sqrt(dataset.reduce((s, d) => s + Math.pow(Math.abs(d.posOffset || 0) - meanPos, 2), 0) / n) || 1.0;
  const stdIndex = Math.sqrt(dataset.reduce((s, d) => s + Math.pow(Math.abs(d.indexDiff || 0) - meanIndex, 2), 0) / n) || 1.0;

  return { meanAngle, meanPos, meanIndex, stdAngle, stdPos, stdIndex };
}

const scaler = computeScaler(rawData);

// 2. kNN Classifier with StandardScaler Normalized Distance
export function classifyPhysicsError(attempt, k = 3, dataset = rawData, customScaler = scaler) {
  const angleDiff = Math.abs(attempt.angleDiff || 0);
  const posOffset = Math.abs(attempt.posOffset || 0);
  const indexDiff = Math.abs(attempt.indexDiff || 0);

  // Standardized Z-scores using Train Scaler
  const zAngle = (angleDiff - customScaler.meanAngle) / customScaler.stdAngle;
  const zPos = (posOffset - customScaler.meanPos) / customScaler.stdPos;
  const zIndex = (indexDiff - customScaler.meanIndex) / customScaler.stdIndex;

  const distances = dataset.map(sample => {
    const sAngle = (Math.abs(sample.angleDiff) - customScaler.meanAngle) / customScaler.stdAngle;
    const sPos = (Math.abs(sample.posOffset) - customScaler.meanPos) / customScaler.stdPos;
    const sIndex = (Math.abs(sample.indexDiff) - customScaler.meanIndex) / customScaler.stdIndex;

    const dist = Math.sqrt(
      Math.pow(zAngle - sAngle, 2) +
      Math.pow(zPos - sPos, 2) +
      Math.pow(zIndex - sIndex, 2)
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

function trainAndEvaluateEdgeCases() {
  console.log('⚡ [Physics Error Model] Kiểm thử lại 15 Ca Mơ Hồ sau khi SỬA LỖI Chuẩn hóa Z-Score (StandardScaler)...');

  console.log(`📏 Scaler Params (Train):`);
  console.log(`  - Angle : Mean = ${scaler.meanAngle.toFixed(2)}, Std = ${scaler.stdAngle.toFixed(2)}`);
  console.log(`  - Pos   : Mean = ${scaler.meanPos.toFixed(2)}, Std = ${scaler.stdPos.toFixed(2)}`);
  console.log(`  - Index : Mean = ${scaler.meanIndex.toFixed(4)}, Std = ${scaler.stdIndex.toFixed(4)}`);

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
    }, 3, rawData, scaler);

    const actual = sample.label;
    const predicted = pred.classId;

    matrix[actual][predicted]++;
    if (actual === predicted) correct++;
  });

  const accuracy = (correct / edgeData.length) * 100;

  console.log(`📊 Model: Physics Optics Diagnostic kNN Classifier (Post-Fix)`);
  console.log(`- Edge Case Test Size: ${edgeData.length} mẫu mâu thuẫn 3 sai số`);
  console.log(`- Accuracy sau khi SỬA CHUẨN HÓA Z-SCORE: ${accuracy.toFixed(2)}% (${correct}/${edgeData.length})`);
  console.log(`- Confusion Matrix MỚI (Bảng Nhầm Lẫn 3x3):`);
  console.log(`                   Dự đoán Sai Góc | Dự đoán Sai Vị Trí | Dự đoán Sai Chiết Suất`);
  console.log(`  Thực tế Sai Góc  :       ${matrix[0][0]}       |        ${matrix[0][1]}        |        ${matrix[0][2]}`);
  console.log(`  Thực tế Sai VịTrí:       ${matrix[1][0]}       |        ${matrix[1][1]}        |        ${matrix[1][2]}`);
  console.log(`  Thực tế ChiếtSuất:       ${matrix[2][0]}       |        ${matrix[2][1]}        |        ${matrix[2][2]}`);

  if (accuracy < 50) {
    console.log(`💡 KẾT LUẬN GIỚI HẠN THẬT CỦA kNN ĐƠN NHÃN:`);
    console.log(`  Sau khi đã chuẩn hóa Z-Score đúng chuẩn thống kê, accuracy trên các ca biên 3-sai-số-đồng-thời đạt ${accuracy.toFixed(2)}%.`);
    console.log(`  Đây là GIỚI HẠN THẬT của bài toán kNN phân loại đơn nhãn (Single-label Classification). Khi bài học sinh có sai số kết hợp đồng thời (Ví dụ: vừa lệch góc 15°, vừa lệch kính 25px, vừa sai chiết suất 0.25), kNN buộc phải chọn 1 nhãn duy nhất. Hướng nâng cấp tối ưu là Multi-label Probability Diagnostic.`);
  }

  const savePath = path.resolve('src/data/models/physics-error-model.json');
  fs.mkdirSync(path.dirname(savePath), { recursive: true });
  fs.writeFileSync(savePath, JSON.stringify({
    metadata: {
      modelName: "Physics Optics Diagnostic kNN Classifier (StandardScaler)",
      trainedAt: new Date().toISOString(),
      datasetSize: rawData.length,
      edgeCaseAccuracyPostFix: `${accuracy.toFixed(2)}%`,
      confusionMatrix: matrix,
      scaler
    },
    dataset: rawData
  }, null, 2), 'utf-8');

  console.log(`✅ [Physics Error Model] Đã cập nhật model thành công tại: ${savePath}`);
}

trainAndEvaluateEdgeCases();
