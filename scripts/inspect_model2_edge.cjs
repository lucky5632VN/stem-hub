const fs = require('fs');
const { classifyPhysicsError } = require('../src/ai-training/scripts/physics-error_train.js');
const train = JSON.parse(fs.readFileSync('src/ai-training/datasets/physics-error/attempts.json', 'utf8'));
const edge = JSON.parse(fs.readFileSync('src/ai-training/datasets/physics-error/edge-cases-physics.json', 'utf8'));

function physicsRulePredict(sample) {
  const angle = Math.abs(sample.angleDiff || 0);
  const pos = Math.abs(sample.posOffset || 0);
  const idx = Math.abs(sample.indexDiff || 0);

  if (angle > 15) return 0;
  if (pos > 25) return 1;
  if (idx > 0.25) return 2;
  return 0;
}

console.log('Model 2 Edge cases (n=15):');
edge.forEach((s, i) => {
  const target = s.label !== undefined ? s.label : s.errorType;
  const pRule = physicsRulePredict(s);
  const pKNN = classifyPhysicsError(s, 5, train).classId;
  const ruleOk = pRule === target;
  const knnOk = pKNN === target;
  console.log(`${i+1}. [${s.id}] target=${target}, rule=${pRule} (${ruleOk ? 'CORRECT' : 'FAIL'}), knn=${pKNN} (${knnOk ? 'CORRECT' : 'FAIL'}) | angle=${s.angleDiff}, pos=${s.posOffset}, idx=${s.indexDiff} | ${s.desc}`);
});
