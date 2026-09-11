import { calculateSingleLocusProbabilities, calculateMultiLocusBayesianCross } from '../../lib/geneticsBayes.js';
import { wilsonInterval } from './chem-risk_train.js';

export function runGeneticsAudit() {
  const cases = [
    { id: 1, p1: 'Aa', p2: 'Aa', name: 'Monohybrid (Aa x Aa)', expectedDom: 0.75, fn: () => calculateMultiLocusBayesianCross('Aa', 'Aa').probAllDominantPhenotype },
    { id: 2, p1: 'AaBb', p2: 'AaBb', name: 'Dihybrid (AaBb x AaBb)', expectedDom: 0.5625, fn: () => calculateMultiLocusBayesianCross('AaBb', 'AaBb').probAllDominantPhenotype },
    { id: 3, p1: 'AaBbDd', p2: 'AaBbDd', name: 'Trihybrid (AaBbDd x AaBbDd)', expectedDom: 0.421875, fn: () => calculateMultiLocusBayesianCross('AaBbDd', 'AaBbDd').probAllDominantPhenotype },
    { id: 4, p1: 'AA', p2: 'aa', name: 'Single Locus Homozygous (AA x aa)', expectedAa: 1.0, fn: () => calculateSingleLocusProbabilities('AA', 'aa')['Aa'] },
    { id: 5, p1: 'Aa', p2: 'aa', name: 'Testcross (Aa x aa)', expectedAa: 0.5, fn: () => calculateSingleLocusProbabilities('Aa', 'aa')['Aa'] },
    { id: 6, p1: 'AABB', p2: 'aabb', name: 'Pure Breeding Dihybrid (AABB x aabb)', expectedDom: 1.0, fn: () => calculateMultiLocusBayesianCross('AABB', 'aabb').probAllDominantPhenotype },
    { id: 7, p1: 'Aabb', p2: 'aaBb', name: 'Heterozygous Cross (Aabb x aaBb)', expectedDom: 0.25, fn: () => calculateMultiLocusBayesianCross('Aabb', 'aaBb').probAllDominantPhenotype },
    { id: 8, p1: 'AaBbCcDd', p2: 'AaBbCcDd', name: 'Tetrahybrid (4 Loci AaBbCcDd x AaBbCcDd)', expectedDom: 0.31640625, fn: () => calculateMultiLocusBayesianCross('AaBbCcDd', 'AaBbCcDd').probAllDominantPhenotype },
    { id: 9, p1: 'AABBCC', p2: 'AABBCC', name: 'Dominant Pure Cross (AABBCC x AABBCC)', expectedDom: 1.0, fn: () => calculateMultiLocusBayesianCross('AABBCC', 'AABBCC').probAllDominantPhenotype },
    { id: 10, p1: 'aabbcc', p2: 'aabbcc', name: 'Recessive Pure Cross (aabbcc x aabbcc)', expectedDom: 0.0, fn: () => calculateMultiLocusBayesianCross('aabbcc', 'aabbcc').probAllDominantPhenotype }
  ];

  let passed = 0;
  const detailedResults = cases.map(c => {
    const calculated = c.fn();
    const target = c.expectedDom !== undefined ? c.expectedDom : c.expectedAa;
    const isPassed = Math.abs(calculated - target) < 1e-5;
    if (isPassed) passed++;
    return {
      id: c.id,
      name: c.name,
      expected: target,
      calculated,
      status: isPassed ? 'PASS' : 'FAIL'
    };
  });

  const accuracyPct = (passed / cases.length) * 100;
  const ci = wilsonInterval(passed, cases.length);

  return {
    modelName: "Genetics Multi-Gene Bayesian Reasoner",
    totalCases: cases.length,
    passedCases: passed,
    accuracyPct: accuracyPct.toFixed(2),
    ci,
    sampleSizeNote: "Cỡ mẫu nhỏ (n=10), kết quả mang tính minh họa, không đại diện thống kê đầy đủ.",
    detailedResults
  };
}

if (process.argv[1] && process.argv[1].endsWith('test-bayes-genetics.js')) {
  const result = runGeneticsAudit();
  console.log('⚡ === AUDIT GENETICS BAYESIAN REASONER ===');
  console.log(`- Total Benchmark Test Cases: ${result.totalCases}`);
  console.log(`- Verification Accuracy (n=10): ${result.accuracyPct}% (${result.passedCases}/${result.totalCases})`);
  console.log(`- 95% Wilson Score CI: [${result.ci.lower}%, ${result.ci.upper}%]`);
  console.log(`- Chú thích: ${result.sampleSizeNote}`);
  console.log(`- Detailed Test Case Outputs:`);
  result.detailedResults.forEach(r => {
    console.log(`   Case ${r.id}: ${r.name} | Target: ${r.expected} | Calc: ${r.calculated} | Status: ${r.status}`);
  });
}
