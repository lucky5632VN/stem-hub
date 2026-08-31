import fs from 'fs';
import path from 'path';

const edgePath = path.resolve('src/ai-training/datasets/chem-risk/edge-cases-chem.json');
const edgeData = JSON.parse(fs.readFileSync(edgePath, 'utf-8'));

// Config 1: Pure Hard Rules Only (No Neural Net)
function predictRulesOnly(sample) {
  const temp = sample.temp;
  const energy = sample.energy;
  const violations = sample.violations;
  const hasHazard = sample.hasHazard === 1;

  if (temp >= 75 || violations >= 2 || energy <= 35) return 2; // Danger
  if (temp >= 45 || violations >= 1 || energy <= 70 || hasHazard) return 1; // Warning
  return 0; // Safe
}

// Config 2: Pure Neural Network Score Only (Pure Argmax, No IF Overrides)
function predictPureNNOnly(sample) {
  const temp = sample.temp;
  const energy = sample.energy;
  const violations = sample.violations;
  const hasHazard = sample.hasHazard === 1 ? 1 : 0;

  const score = (temp / 120.0) * 0.45 + ((100 - energy) / 100.0) * 0.25 + (violations / 5.0) * 0.2 + (hasHazard * 0.1);

  if (score >= 0.55) return 2;
  if (score >= 0.30) return 1;
  return 0;
}

// Config 3: Hybrid System (Current Asymmetric Safety Boundary)
function predictHybrid(sample) {
  const temp = sample.temp;
  const energy = sample.energy;
  const violations = sample.violations;
  const hasHazard = sample.hasHazard === 1 ? 1 : 0;

  const score = (temp / 120.0) * 0.45 + ((100 - energy) / 100.0) * 0.25 + (violations / 5.0) * 0.2 + (hasHazard * 0.1);

  let safeProb = Math.max(0, 1 - score * 1.5);
  let warnProb = Math.max(0, 1 - Math.abs(score - 0.4) * 2.5);
  let dangerProb = Math.max(0, (score - 0.35) * 2.0);
  const probSum = safeProb + warnProb + dangerProb;
  dangerProb /= probSum;

  if (score >= 0.45 || dangerProb >= 0.25 || violations >= 2 || temp >= 75 || energy <= 35) return 2;
  if (score >= 0.28 || warnProb >= 0.35 || violations >= 1 || temp >= 45 || energy <= 70 || hasHazard === 1) return 1;
  return 0;
}

function runAblationStudy() {
  console.log('🧪 === ABLATION STUDY: CHEM RISK CLASSIFIER (20 EDGE CASES) ===\n');

  const configs = [
    { name: "1. Chỉ Luật Cứng (Pure Hard Rules)", fn: predictRulesOnly },
    { name: "2. Chỉ Neural Net Thuần (Pure NN Argmax)", fn: predictPureNNOnly },
    { name: "3. Hệ Thống Hybrid Hiện Tại (Safety Asymmetric)", fn: predictHybrid }
  ];

  configs.forEach(cfg => {
    const matrix = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    let correct = 0;

    edgeData.forEach(sample => {
      const pred = cfg.fn(sample);
      const actual = sample.label;
      matrix[actual][pred]++;
      if (actual === pred) correct++;
    });

    const acc = (correct / edgeData.length) * 100;
    const fnDanger = matrix[2][0] + matrix[2][1]; // Danger predicted as Safe/Warning

    console.log(`📌 Cấu hình: ${cfg.name}`);
    console.log(`   - Accuracy: ${acc.toFixed(2)}% (${correct}/${edgeData.length})`);
    console.log(`   - Lỗi Bỏ Sót Nguy Hiểm (False Negatives): ${fnDanger} ca`);
    console.log(`   - Confusion Matrix (Actual \\ Pred):`);
    console.log(`       Safe    : ${matrix[0][0]} | ${matrix[0][1]} | ${matrix[0][2]}`);
    console.log(`       Warning : ${matrix[1][0]} | ${matrix[1][1]} | ${matrix[1][2]}`);
    console.log(`       Danger  : ${matrix[2][0]} | ${matrix[2][1]} | ${matrix[2][2]}\n`);
  });
}

runAblationStudy();
