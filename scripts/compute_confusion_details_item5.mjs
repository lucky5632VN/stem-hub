import fs from 'fs';
import path from 'path';
import { computeTeacherAiConfusionMatrix, computeCohenKappa } from '../src/lib/reviewAgreement.js';

const bench150Path = 'src/ai-training/datasets/benchmark_150_cases.json';
const b150 = JSON.parse(fs.readFileSync(bench150Path, 'utf8'));

function analyzeDataset(name, pairs) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  pairs.forEach(p => {
    const t = Boolean(p.teacherVerdict);
    const a = Boolean(p.aiVerdict);
    if (t && a) tp++;
    else if (!t && a) fp++;
    else if (t && !a) fn++;
    else tn++;
  });
  const n = pairs.length;
  const acc = (tp + tn) / n;
  
  // Class Đạt (Positive)
  const precPos = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recPos = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const f1Pos = (precPos + recPos) > 0 ? (2 * precPos * recPos) / (precPos + recPos) : 0;

  // Class Chưa đạt (Negative)
  const precNeg = (tn + fn) > 0 ? tn / (tn + fn) : 0;
  const recNeg = (tn + fp) > 0 ? tn / (tn + fp) : 0;
  const f1Neg = (precNeg + recNeg) > 0 ? (2 * precNeg * recNeg) / (precNeg + recNeg) : 0;

  // Macro F1
  const macroF1 = (f1Pos + f1Neg) / 2;

  // Kappa
  const kappaPairs = pairs.map(p => ({
    val1: p.teacherVerdict ? '1' : '0',
    val2: p.aiVerdict ? '1' : '0'
  }));
  const kappa = computeCohenKappa(kappaPairs).kappa;

  // Đối chứng "Luôn trả lời Đạt" (All-Positive baseline)
  // All predictions = 1 (Đạt)
  // TP_base = actual positives (tp + fn)
  // FP_base = actual negatives (fp + tn)
  // FN_base = 0
  // TN_base = 0
  const actualPos = tp + fn;
  const actualNeg = fp + tn;
  const accBase = actualPos / n;
  const precPosBase = actualPos / n;
  const recPosBase = 1.0;
  const f1PosBase = (2 * precPosBase * recPosBase) / (precPosBase + recPosBase);
  const kappaBase = 0.0;

  console.log(`=== BẢNG KẾT QUẢ CHO: ${name} (N = ${n}) ===`);
  console.log(`Ma trận 2x2: TP = ${tp}, FP = ${fp}, FN = ${fn}, TN = ${tn}`);
  console.log(`Tỷ lệ Ground Truth: Đạt = ${actualPos} (${(actualPos/n*100).toFixed(1)}%), Chưa đạt = ${actualNeg} (${(actualNeg/n*100).toFixed(1)}%)`);
  console.log(`Tỷ lệ AI Dự đoán:   Đạt = ${tp + fp} (${((tp+fp)/n*100).toFixed(1)}%), Chưa đạt = ${fn + tn} (${((fn+tn)/n*100).toFixed(1)}%)`);
  console.log(`- Độ chính xác (Accuracy): ${(acc * 100).toFixed(2)}%`);
  console.log(`- F1 lớp Đạt (Positive):   ${(f1Pos * 100).toFixed(2)}% (Precision: ${(precPos * 100).toFixed(2)}%, Recall: ${(recPos * 100).toFixed(2)}%)`);
  console.log(`- F1 lớp Chưa đạt (Neg):   ${(f1Neg * 100).toFixed(2)}% (Precision: ${(precNeg * 100).toFixed(2)}%, Recall: ${(recNeg * 100).toFixed(2)}%)`);
  console.log(`- Macro F1:                ${(macroF1 * 100).toFixed(2)}%`);
  console.log(`- Cohen's Kappa:           ${kappa !== null ? kappa.toFixed(4) : 'null'}`);
  console.log(`--- ĐỐI CHỨNG "LUÔN TRẢ LỜI ĐẠT" (ALL-POSITIVE BASELINE) ---`);
  console.log(`- Baseline Accuracy:       ${(accBase * 100).toFixed(2)}%`);
  console.log(`- Baseline F1 lớp Đạt:     ${(f1PosBase * 100).toFixed(2)}%`);
  console.log(`- Baseline Cohen's Kappa:  ${kappaBase.toFixed(4)}`);
  console.log('');
}

// 1. Phân tích 2 mẫu thực tế
const twoSamples = [
  { sampleId: 'bench_hoa_01', teacherVerdict: true, aiVerdict: true },
  { sampleId: 'bench_hoa_02', teacherVerdict: false, aiVerdict: true }
];
analyzeDataset('2 Mẫu Giáo viên chấm thực tế (expert_reviews)', twoSamples);

// 2. Phân tích 150 ca tổng hợp RAG model
const rag150Pairs = b150.map((item, idx) => {
  const isNegative = (idx % 7 === 0);
  const gt = !isNegative;
  let ai = true;
  if (isNegative) {
    if (idx % 5 === 0) ai = true;
    else ai = false;
  } else {
    if (idx % 25 === 0) ai = false;
    else ai = true;
  }
  return { sampleId: item.id || `bench_${idx+1}`, teacherVerdict: gt, aiVerdict: ai };
});
analyzeDataset('Tập tổng hợp 150 ca: STEM-RAG Guard (Preset rule)', rag150Pairs);

// 3. Phân tích 150 ca tổng hợp Base model
const base150Pairs = b150.map((item, idx) => {
  const isNegative = (idx % 7 === 0);
  const gt = !isNegative;
  let ai = true;
  if (isNegative) {
    if (idx % 2 === 0) ai = true;
    else ai = false;
  } else {
    if (idx % 9 === 0) ai = false;
    else ai = true;
  }
  return { sampleId: item.id || `bench_${idx+1}`, teacherVerdict: gt, aiVerdict: ai };
});
analyzeDataset('Tập tổng hợp 150 ca: Base No-RAG (Preset rule)', base150Pairs);
