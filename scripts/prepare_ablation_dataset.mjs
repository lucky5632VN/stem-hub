import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ablationBenchPath = path.resolve('src/ai-training/datasets/rag_ablation_benchmark.json');
const bench150Path = path.resolve('src/ai-training/datasets/benchmark_150_cases.json');
const outDir = path.resolve('reports/ablation');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const ablationBench = JSON.parse(fs.readFileSync(ablationBenchPath, 'utf8'));
const bench150 = JSON.parse(fs.readFileSync(bench150Path, 'utf8'));

// 1. Phân tầng 1: 40 câu khái niệm / lý thuyết / bẫy SGK GDPT 2018 trong phạm vi
const conceptTraps = ablationBench.hard_trap_gdpt2018.slice(0, 40).map((c, idx) => ({
  id: `ABL_IN_CONCEPT_${String(idx + 1).padStart(2, '0')}`,
  stratum: 'in_scope_concept',
  subject: c.subject,
  topic: c.topic,
  question: c.question,
  ground_truth: c.correct_answer,
  trap_point: c.trap_point,
  sgk_source: c.sgk_ref,
  question_type: 'closed_concept',
  evaluation_keywords: extractKeywords(c.correct_answer)
}));

// 2. Phân tầng 2: 30 câu tính toán / số liệu / công thức chính xác
// 10 câu bẫy tính toán từ ablation_benchmark + 20 câu tính toán từ benchmark_150
const numTraps = ablationBench.hard_trap_gdpt2018.slice(40, 50).map((c, idx) => ({
  id: `ABL_IN_NUM_${String(idx + 1).padStart(2, '0')}`,
  stratum: 'in_scope_numerical',
  subject: c.subject,
  topic: c.topic,
  question: c.question,
  ground_truth: c.correct_answer,
  trap_point: c.trap_point,
  sgk_source: c.sgk_ref,
  question_type: 'closed_numerical',
  evaluation_keywords: extractNumericAndFormulaTokens(c.correct_answer)
}));

const bench150Numericals = bench150
  .filter(c => /\d/.test(c.ground_truth || '') && (c.ground_truth.includes('=') || c.ground_truth.includes('pH') || c.ground_truth.includes('mol') || c.ground_truth.includes('m/s') || c.ground_truth.includes('V') || c.ground_truth.includes('Cực')))
  .slice(0, 20)
  .map((c, idx) => ({
    id: `ABL_IN_NUM_${String(idx + 11).padStart(2, '0')}`,
    stratum: 'in_scope_numerical',
    subject: c.subject,
    topic: c.topic,
    question: c.question,
    ground_truth: c.ground_truth,
    trap_point: 'Yêu cầu tính toán chính xác số liệu hoặc công thức nghiệm',
    sgk_source: c.sgk_reference,
    question_type: 'closed_numerical',
    evaluation_keywords: extractNumericAndFormulaTokens(c.ground_truth)
  }));

const numericalCases = [...numTraps, ...bench150Numericals];

// 3. Phân tầng 3: 30 câu ngoài phạm vi GDPT 2018 (Out-of-Scope / Adversarial)
const outOfScopeCases = ablationBench.out_of_scope.slice(0, 30).map((c, idx) => ({
  id: `ABL_OOS_${String(idx + 1).padStart(2, '0')}`,
  stratum: 'out_of_scope',
  subject: 'oos',
  topic: c.domain,
  question: c.question,
  ground_truth: 'Yêu cầu kích hoạt cảnh báo thiếu căn cứ SGK chuẩn / từ chối trả lời khẳng định ngoài phạm vi GDPT 2018',
  trap_point: 'Câu hỏi học thuật đại học hoặc phi STEM, nằm ngoài kho SGK GDPT 2018',
  sgk_source: 'N/A - Ngoài chương trình GDPT 2018',
  question_type: 'out_of_scope',
  evaluation_keywords: ['ngoài', 'sgk', 'chương trình', 'phạm vi', 'căn cứ', 'chưa đủ', 'tham khảo']
}));

const fullDataset = {
  metadata: {
    name: 'STEM HUB Ablation Stratified 100 Benchmark',
    version: '1.0.0',
    total_cases: 100,
    strata: {
      in_scope_concept: conceptTraps.length,
      in_scope_numerical: numericalCases.length,
      out_of_scope: outOfScopeCases.length
    },
    dataset_nature: 'Tập dev phân tầng (kết quả có thể lạc quan), dùng để kiểm chứng phương pháp và đo lường độ nhạy hệ thống',
    created_at: new Date().toISOString(),
    locked_hash_algorithm: 'SHA-256'
  },
  cases: [
    ...conceptTraps,
    ...numericalCases,
    ...outOfScopeCases
  ]
};

function extractKeywords(text = '') {
  const words = text.toLowerCase()
    .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !['chính', 'trong', 'những', 'được', 'nghiệm'].includes(w));
  return Array.from(new Set(words)).slice(0, 8);
}

function extractNumericAndFormulaTokens(text = '') {
  const matches = text.match(/(\b\d+(?:[.,]\d+)?\b|[A-Za-z_]\s*=\s*[^,\n;.\$]{1,15}|pH\s*=\s*\d+|Cực\s+[A-Za-z]\([^)]+\))/g) || [];
  return Array.from(new Set(matches)).slice(0, 6);
}

const jsonContent = JSON.stringify(fullDataset, null, 2);
const datasetPath = path.join(outDir, 'ablation_dataset_100.json');
fs.writeFileSync(datasetPath, jsonContent, 'utf8');

const hash = crypto.createHash('sha256').update(jsonContent).digest('hex');
const hashInfo = {
  dataset_file: 'reports/ablation/ablation_dataset_100.json',
  sha256: hash,
  locked_at: new Date().toISOString(),
  total_cases: fullDataset.cases.length,
  strata: fullDataset.metadata.strata
};

fs.writeFileSync(path.join(outDir, 'dataset_hash.json'), JSON.stringify(hashInfo, null, 2), 'utf8');

console.log('✅ Dataset generated and locked successfully!');
console.log('   File:', datasetPath);
console.log('   Total cases:', fullDataset.cases.length);
console.log('   SHA-256:', hash);

