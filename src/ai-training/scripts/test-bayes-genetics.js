import { calculateSingleLocusProbabilities, calculateMultiLocusBayesianCross } from '../../lib/geneticsBayes.js';

console.log('⚡ [Genetics Bayes Model] Đang kiểm thử 10 trường hợp suy luận xác suất di truyền Bayes...');

let passed = 0;

// Test 1: Aa x Aa (Monohybrid) -> 3/4 dominant phenotype
const t1 = calculateMultiLocusBayesianCross('Aa', 'Aa');
if (Math.abs(t1.probAllDominantPhenotype - 0.75) < 1e-5) passed++;

// Test 2: AaBb x AaBb (Dihybrid) -> 9/16 = 0.5625 dominant phenotype
const t2 = calculateMultiLocusBayesianCross('AaBb', 'AaBb');
if (Math.abs(t2.probAllDominantPhenotype - 0.5625) < 1e-5) passed++;

// Test 3: AaBbDd x AaBbDd (Trihybrid) -> (3/4)^3 = 27/64 = 0.421875
const t3 = calculateMultiLocusBayesianCross('AaBbDd', 'AaBbDd');
if (Math.abs(t3.probAllDominantPhenotype - 0.421875) < 1e-5) passed++;

// Test 4: AA x aa -> 100% Aa
const t4 = calculateSingleLocusProbabilities('AA', 'aa');
if (t4['Aa'] === 1.0) passed++;

// Test 5: Aa x aa -> 50% Aa, 50% aa
const t5 = calculateSingleLocusProbabilities('Aa', 'aa');
if (t5['Aa'] === 0.5 && t5['aa'] === 0.5) passed++;

// Test 6: AABB x aabb -> 100% AaBb (dominant phenotype prob = 1.0)
const t6 = calculateMultiLocusBayesianCross('AABB', 'aabb');
if (t6.probAllDominantPhenotype === 1.0) passed++;

// Test 7: Aabb x aaBb -> (1/2) * (1/2) = 1/4 dominant
const t7 = calculateMultiLocusBayesianCross('Aabb', 'aaBb');
if (Math.abs(t7.probAllDominantPhenotype - 0.25) < 1e-5) passed++;

// Test 8: AaBbCcDd x AaBbCcDd (4 Loci) -> (3/4)^4 = 81/256 = 0.31640625
const t8 = calculateMultiLocusBayesianCross('AaBbCcDd', 'AaBbCcDd');
if (Math.abs(t8.probAllDominantPhenotype - 0.31640625) < 1e-5) passed++;

// Test 9: AABBCC x AABBCC -> 100% dominant
const t9 = calculateMultiLocusBayesianCross('AABBCC', 'AABBCC');
if (t9.probAllDominantPhenotype === 1.0) passed++;

// Test 10: aabbcc x aabbcc -> 0% dominant phenotype
const t10 = calculateMultiLocusBayesianCross('aabbcc', 'aabbcc');
if (t10.probAllDominantPhenotype === 0.0) passed++;

console.log(`📊 [Genetics Bayes Model] Số test cases vượt qua: ${passed}/10 (Accuracy: ${(passed / 10) * 100}%)`);

if (passed === 10) {
  console.log('✅ [Genetics Bayes Model] Tất cả 10 unit test cases Bayes di truyền đa gen đã ĐẠT CHUẨN XÁC NGUYÊN TẮC MENDEL!');
}
