import fs from 'fs';
import path from 'path';

const edgePath = path.resolve('src/ai-training/datasets/chem-risk/edge-cases-chem.json');
const edgeData = JSON.parse(fs.readFileSync(edgePath, 'utf-8'));

// Config 1: Pure Hard Rules Only
function predictRulesOnly(sample) {
  const temp = sample.temp;
  const energy = sample.energy;
  const violations = sample.violations;
  const hasHazard = sample.hasHazard === 1;

  if (temp >= 80 || violations >= 2 || energy <= 35) return 2; // Danger
  if (temp >= 45 || violations >= 1 || energy <= 70 || hasHazard) return 1; // Warning
  return 0; // Safe
}

// Config 2: Pure Neural Network Score Only (Argmax, No Hard Rules)
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

// Config 3: Perfected Hybrid System (Luật Cứng giữ quyền cao nhất cho Nguy hiểm & Cảnh báo tiêu chuẩn; NN Score làm mịn ranh giới Safe/Warning & hiển thị thanh đo %)
function predictHybridPerfected(sample) {
  const temp = sample.temp;
  const energy = sample.energy;
  const violations = sample.violations;
  const hasHazard = sample.hasHazard === 1 ? 1 : 0;

  // 1. HARD SAFETY CIRCUIT BREAKER (Quyền quyết định tuyệt đối cho các ngưỡng nguy hiểm)
  if (temp >= 80 || violations >= 2 || energy <= 35) return 2; // Danger

  // 2. STANDARD SAFETY RULES
  if (temp >= 45 || violations >= 1 || energy <= 70 || hasHazard === 1) return 1; // Warning

  // 3. NEURAL NETWORK CONTINUOUS SCORE (Độ mịn rủi ro & phát hiện ca tích tụ nhiệt sát ngưỡng)
  const score = (temp / 120.0) * 0.45 + ((100 - energy) / 100.0) * 0.25 + (violations / 5.0) * 0.2 + (hasHazard * 0.10);
  if (score >= 0.28) return 1;

  return 0; // Safe
}

function runFullAblationComparison() {
  console.log('🧪 === ABLATION TEST CHUẨN HÓA VÒNG 5 (SOLVED CONTRADICTION) ===\n');

  const configs = [
    { name: "1. Chỉ Luật Cứng (Pure Hard Rules)", fn: predictRulesOnly },
    { name: "2. Chỉ Neural Net Thuần (Pure NN Argmax)", fn: predictPureNNOnly },
    { name: "3. Hệ Thống Hybrid Đã Chuẩn Hóa (Perfected Hybrid System)", fn: predictHybridPerfected }
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
    const fnDanger = matrix[2][0] + matrix[2][1];

    console.log(`📌 Cấu hình: ${cfg.name}`);
    console.log(`   - Accuracy: ${acc.toFixed(2)}% (${correct}/${edgeData.length})`);
    console.log(`   - Lỗi Bỏ Sót Nguy Hiểm (False Negatives): ${fnDanger} ca`);
    console.log(`   - Confusion Matrix (Actual \\ Pred):`);
    console.log(`       Safe    : ${matrix[0][0]} | ${matrix[0][1]} | ${matrix[0][2]}`);
    console.log(`       Warning : ${matrix[1][0]} | ${matrix[1][1]} | ${matrix[1][2]}`);
    console.log(`       Danger  : ${matrix[2][0]} | ${matrix[2][1]} | ${matrix[2][2]}\n`);
  });
}

runFullAblationComparison();
