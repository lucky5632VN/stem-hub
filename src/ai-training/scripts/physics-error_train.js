import fs from 'fs';
import path from 'path';

const datasetPath = path.resolve('src/ai-training/datasets/physics-error/attempts.json');
const edgePath = path.resolve('src/ai-training/datasets/physics-error/edge-cases-physics.json');

const rawData = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
const edgeData = JSON.parse(fs.readFileSync(edgePath, 'utf-8'));

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

/**
 * Enhanced Multi-label Probability Diagnostic kNN Classifier
 * Trả về phân bố xác suất % của cả 3 loại lỗi thay vì ép chọn 1 nhãn duy nhất
 */
export function classifyPhysicsError(attempt, k = 5, dataset = rawData, customScaler = scaler) {
  const angleDiff = Math.abs(attempt.angleDiff || 0);
  const posOffset = Math.abs(attempt.posOffset || 0);
  const indexDiff = Math.abs(attempt.indexDiff || 0);

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

  const votes = { 0: 0, 1: 0, 2: 0 };
  kNearest.forEach(n => {
    votes[n.label] = (votes[n.label] || 0) + 1;
  });

  const probs = {
    sai_goc: Math.round((votes[0] / k) * 100),
    sai_vi_tri: Math.round((votes[1] / k) * 100),
    sai_chiet_suat: Math.round((votes[2] / k) * 100)
  };

  let topLabel = 0;
  let maxVotes = -1;
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

  const activeErrors = [];
  if (probs.sai_goc >= 20) activeErrors.push(`Sai góc tới (${probs.sai_goc}%)`);
  if (probs.sai_vi_tri >= 20) activeErrors.push(`Sai vị trí (${probs.sai_vi_tri}%)`);
  if (probs.sai_chiet_suat >= 20) activeErrors.push(`Sai chiết suất (${probs.sai_chiet_suat}%)`);

  return {
    classId: topLabel,
    topError: errorTypes[topLabel],
    probabilities: probs,
    isMultiError: activeErrors.length > 1,
    multiErrorSummary: activeErrors.join(' + '),
    confidence: maxVotes / k,
    neighbors: kNearest
  };
}

function evaluateMultiLabelDiagnostic() {
  console.log('⚡ [Physics Error Model] Đánh giá kNN Đa Nhãn Chẩn Đoán (Multi-Label Probability Diagnostic)...');

  let multiErrorDetectedCount = 0;
  edgeData.forEach((sample, idx) => {
    const diag = classifyPhysicsError({
      angleDiff: sample.angleDiff,
      posOffset: sample.posOffset,
      indexDiff: sample.indexDiff
    }, 5, rawData, scaler);

    if (diag.isMultiError) multiErrorDetectedCount++;
  });

  console.log(`📊 Model: Physics Optics Multi-Label Diagnostic kNN (Post-Upgrade)`);
  console.log(`- Edge Case Test Size: ${edgeData.length} mẫu mâu thuẫn 3 sai số`);
  console.log(`- Số mẫu phát hiện chính xác là ĐA LỖI HỖN HỢP (Multi-Error): ${multiErrorDetectedCount}/${edgeData.length} (${((multiErrorDetectedCount/edgeData.length)*100).toFixed(1)}%)`);
  console.log(`- Ví dụ output chẩn đoán đa nhãn tại Mẫu 1:`, classifyPhysicsError(edgeData[0], 5).probabilities);

  const savePath = path.resolve('src/data/models/physics-error-model.json');
  fs.mkdirSync(path.dirname(savePath), { recursive: true });
  fs.writeFileSync(savePath, JSON.stringify({
    metadata: {
      modelName: "Physics Optics Multi-Label Diagnostic kNN",
      trainedAt: new Date().toISOString(),
      datasetSize: rawData.length,
      kNeighbors: 5,
      scaler
    },
    dataset: rawData
  }, null, 2), 'utf-8');

  console.log(`✅ [Physics Error Model] Đã cập nhật model thành công tại: ${savePath}`);
}

evaluateMultiLabelDiagnostic();
