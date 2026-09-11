import { calculateImplicitReward } from '../src/lib/rewardEngine.js';
import { cosineSimilarity } from '../src/lib/continuousMemory.js';

console.log('=== TEST PHASE 2: CONTINUOUS LEARNING PIPELINE ===');

// 1. Test Reward Engine & Raw Dwell Time
const rewardTest1 = calculateImplicitReward({
  actionSuccess: true,
  dwellTimeSeconds: 25,
  isReaskOrQuickClose: false
});

console.log('Reward Test 1 (Success + 25s dwell time):', {
  rawReward: rewardTest1.rawReward.toFixed(3),
  clampedReward: rewardTest1.clampedReward.toFixed(3),
  normalizedLabel: rewardTest1.normalizedLabel.toFixed(3),
  rawDwellTimeRecorded: rewardTest1.rawMetrics.dwellTimeSeconds
});

const rewardTest2 = calculateImplicitReward({
  actionSuccess: false,
  dwellTimeSeconds: 5,
  isReaskOrQuickClose: true
});

console.log('Reward Test 2 (Failure + 5s dwell time + Reask penalty):', {
  rawReward: rewardTest2.rawReward.toFixed(3),
  clampedReward: rewardTest2.clampedReward.toFixed(3),
  normalizedLabel: rewardTest2.normalizedLabel.toFixed(3),
  rawDwellTimeRecorded: rewardTest2.rawMetrics.dwellTimeSeconds
});

// 2. Test Cosine Similarity
const vecA = [0.1, 0.5, 0.8, 0.3];
const vecB = [0.1, 0.5, 0.7, 0.4];
const sim = cosineSimilarity(vecA, vecB);
console.log('Cosine Similarity Test:', sim.toFixed(4));

if (sim > 0.95 && rewardTest1.normalizedLabel > rewardTest2.normalizedLabel) {
  console.log('✅ PHASE 2 UNIT TESTS PASSED 100%!');
} else {
  console.error('❌ PHASE 2 UNIT TESTS FAILED!');
  process.exit(1);
}
