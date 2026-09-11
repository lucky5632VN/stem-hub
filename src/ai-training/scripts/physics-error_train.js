import fs from 'fs';
import path from 'path';
import { wilsonInterval } from './chem-risk_train.js';

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

export function classifyPhysicsError(attempt, k = 5, trainData = rawData, customScaler) {
  const scaler = customScaler || computeScaler(trainData);
  const angleDiff = Math.abs(attempt.angleDiff || 0);
  const posOffset = Math.abs(attempt.posOffset || 0);
  const indexDiff = Math.abs(attempt.indexDiff || 0);

  const zAngle = (angleDiff - scaler.meanAngle) / scaler.stdAngle;
  const zPos = (posOffset - scaler.meanPos) / scaler.stdPos;
  const zIndex = (indexDiff - scaler.meanIndex) / scaler.stdIndex;

  const distances = trainData.map(sample => {
    const sAngle = (Math.abs(sample.angleDiff) - scaler.meanAngle) / scaler.stdAngle;
    const sPos = (Math.abs(sample.posOffset) - scaler.meanPos) / scaler.stdPos;
    const sIndex = (Math.abs(sample.indexDiff) - scaler.meanIndex) / scaler.stdIndex;

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
    confidence: maxVotes / k
  };
}

export function runPhysicsAudit() {
  // Deterministic 80/20 train/test split on 120 samples
  const trainSize = Math.floor(rawData.length * 0.8); // 96
  const trainSet = rawData.slice(0, trainSize);
  const testSet = rawData.slice(trainSize); // 24
  const scaler = computeScaler(trainSet);

  // Evaluate Primary Label Accuracy on 24 Test Set Samples
  let testCorrect = 0;
  testSet.forEach(sample => {
    const diag = classifyPhysicsError(sample, 5, trainSet, scaler);
    if (diag.classId === sample.label) testCorrect++;
  });
  const testAccPct = (testCorrect / testSet.length) * 100;
  const testCi = wilsonInterval(testCorrect, testSet.length);

  // Evaluate Multi-Label Combo Detection on 15 Edge Cases
  let multiErrorCount = 0;
  edgeData.forEach(sample => {
    const diag = classifyPhysicsError(sample, 5, trainSet, scaler);
    if (diag.isMultiError) multiErrorCount++;
  });
  const multiDetectPct = (multiErrorCount / edgeData.length) * 100;
  const edgeCi = wilsonInterval(multiErrorCount, edgeData.length);

  // Save model JSON
  const savePath = path.resolve('src/data/models/physics-error-model.json');
  fs.mkdirSync(path.dirname(savePath), { recursive: true });
  fs.writeFileSync(savePath, JSON.stringify({
    metadata: {
      modelName: "Physics Optics Multi-Label Diagnostic kNN",
      trainedAt: new Date().toISOString(),
      datasetTotal: rawData.length,
      trainSize: trainSet.length,
      testSize: testSet.length,
      testAccuracyPct: testAccPct.toFixed(2),
      testWilsonCi95: testCi,
      edgeCaseSize: edgeData.length,
      multiErrorDetectPct: multiDetectPct.toFixed(2),
      edgeWilsonCi95: edgeCi,
      kNeighbors: 5,
      scaler
    },
    dataset: trainSet
  }, null, 2), 'utf-8');

  return {
    modelName: "Physics Diagnostic kNN Classifier",
    trainSize: trainSet.length,
    testSize: testSet.length,
    testAccuracyPct: testAccPct.toFixed(2),
    testCi,
    edgeSize: edgeData.length,
    multiErrorDetectPct: multiDetectPct.toFixed(2),
    edgeCi
  };
}

if (process.argv[1] && process.argv[1].endsWith('physics-error_train.js')) {
  const result = runPhysicsAudit();
  console.log('⚡ === AUDIT PHYSICS DIAGNOSTIC kNN ===');
  console.log(`- Dataset: Total ${rawData.length} (96 Train / 24 Test) + 15 Edge Cases`);
  console.log(`- Test Set Accuracy: ${result.testAccuracyPct}% (n=24, 95% CI: [${result.testCi.lower}%, ${result.testCi.upper}%])`);
  console.log(`- Edge Case Multi-Error Detection: ${result.multiErrorDetectPct}% (n=15, 95% CI: [${result.edgeCi.lower}%, ${result.edgeCi.upper}%])`);
}
