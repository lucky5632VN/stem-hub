import { calculateIRTHitProbability, selectAdaptiveMathQuestion } from '../../lib/mathAdaptiveEngine.js';
import { wilsonInterval } from './chem-risk_train.js';

export function runMathIrtAudit() {
  const benchmarkItems = [
    { id: 1, studentElo: 1200, itemElo: 1000, name: "Thí sinh Đồng (1200) vs Bài Dễ (1000)" },
    { id: 2, studentElo: 1200, itemElo: 1200, name: "Thí sinh Đồng (1200) vs Bài Đồng (1200)" },
    { id: 3, studentElo: 1500, itemElo: 1350, name: "Thí sinh Vàng (1500) vs Bài Vàng vỡ lòng (1350)" },
    { id: 4, studentElo: 1500, itemElo: 1500, name: "Thí sinh Vàng (1500) vs Bài Vàng chuẩn (1500)" },
    { id: 5, studentElo: 1800, itemElo: 1650, name: "Thí sinh Kim Cương (1800) vs Bài Kim Cương (1650)" },
    { id: 6, studentElo: 1800, itemElo: 1800, name: "Thí sinh Kim Cương (1800) vs Bài Kim Cương (1800)" },
    { id: 7, studentElo: 2100, itemElo: 1950, name: "Thí sinh Cao Thủ (2100) vs Bài Cao Thủ (1950)" },
    { id: 8, studentElo: 2100, itemElo: 2100, name: "Thí sinh Cao Thủ (2100) vs Bài Thách Đấu (2100)" },
    { id: 9, studentElo: 1500, itemElo: 1800, name: "Thí sinh Vàng (1500) vs Bài Khó Kim Cương (1800)" },
    { id: 10, studentElo: 1800, itemElo: 1200, name: "Thí sinh Kim Cương (1800) vs Bài Dễ Đồng (1200)" }
  ];

  let adaptiveBandHits = 0;
  const detailedResults = benchmarkItems.map(item => {
    const theta = (item.studentElo - 1500.0) / 400.0;
    const b = (item.itemElo - 1500.0) / 400.0;
    const logit = 1.7 * (theta - b);
    const pSuccess = calculateIRTHitProbability(item.studentElo, item.itemElo);
    const inAdaptiveBand = pSuccess >= 0.60 && pSuccess <= 0.75;
    if (inAdaptiveBand) adaptiveBandHits++;

    return {
      id: item.id,
      name: item.name,
      studentElo: item.studentElo,
      itemElo: item.itemElo,
      theta: theta.toFixed(3),
      b: b.toFixed(3),
      logit: logit.toFixed(3),
      pSuccessPct: (pSuccess * 100).toFixed(2) + '%',
      inAdaptiveBand
    };
  });

  const ci = wilsonInterval(adaptiveBandHits, benchmarkItems.length);

  return {
    modelName: "Math Adaptive 1PL Rasch IRT Engine",
    totalItems: benchmarkItems.length,
    adaptiveHits: adaptiveBandHits,
    hitPct: ((adaptiveBandHits / benchmarkItems.length) * 100).toFixed(2),
    ci,
    sampleSizeNote: "Cỡ mẫu nhỏ (n=10), kết quả mang tính minh họa, không đại diện thống kê đầy đủ.",
    detailedResults
  };
}

if (process.argv[1] && process.argv[1].endsWith('test-math-irt.js')) {
  const result = runMathIrtAudit();
  console.log('⚡ === AUDIT MATH ADAPTIVE IRT ENGINE ===');
  console.log(`- Benchmark Test Items: ${result.totalItems}`);
  console.log(`- Matched Adaptive Band Hits [60%, 75%]: ${result.hitPct}% (${result.adaptiveHits}/${result.totalItems})`);
  console.log(`- 95% Wilson Score CI: [${result.ci.lower}%, ${result.ci.upper}%]`);
  console.log(`- Chú thích: ${result.sampleSizeNote}`);
  console.log(`- Detailed Item Probabilities:`);
  result.detailedResults.forEach(r => {
    console.log(`   Item ${r.id}: ${r.name} | theta=${r.theta}, b=${r.b} -> Logit=${r.logit} -> P(success)=${r.pSuccessPct} | In Band: ${r.inAdaptiveBand}`);
  });
}
