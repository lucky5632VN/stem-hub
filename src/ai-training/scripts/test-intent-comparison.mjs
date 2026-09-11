import fs from 'fs';
import path from 'path';
import { trainNaiveBayesOnData } from './intent_train.js';
import { normalizeText } from '../../lib/textNormalizer.js';
import { wilsonInterval } from './chem-risk_train.js';

const trainPath = path.resolve('src/ai-training/datasets/intent/intent-samples.json');
const unseenPath = path.resolve('src/ai-training/datasets/intent/unseen-test-intent.json');
const hardUnseenPath = path.resolve('src/ai-training/datasets/intent/hard-unseen-test-intent.json');

const trainSamples = JSON.parse(fs.readFileSync(trainPath, 'utf-8'));
const unseenSamples = JSON.parse(fs.readFileSync(unseenPath, 'utf-8'));
const hardUnseenSamples = JSON.parse(fs.readFileSync(hardUnseenPath, 'utf-8'));

// Train Classifier
const model = trainNaiveBayesOnData(trainSamples);

function evaluateDataset(samples, name) {
  let rawCorrect = 0;
  let normCorrect = 0;

  const results = samples.map((item, idx) => {
    const rawPred = model.predict(item.text, false);
    const normPred = model.predict(item.text, true);

    const rawMatch = rawPred.intent === item.intent;
    const normMatch = normPred.intent === item.intent;

    if (rawMatch) rawCorrect++;
    if (normMatch) normCorrect++;

    return {
      id: idx + 1,
      text: item.text,
      expected: item.intent,
      rawPred: rawPred.intent,
      normPred: normPred.intent,
      rawMatch,
      normMatch
    };
  });

  const rawAccPct = (rawCorrect / samples.length) * 100;
  const normAccPct = (normCorrect / samples.length) * 100;

  const rawCi = wilsonInterval(rawCorrect, samples.length);
  const normCi = wilsonInterval(normCorrect, samples.length);

  return {
    name,
    total: samples.length,
    rawCorrect,
    rawAccPct: rawAccPct.toFixed(2),
    rawCi,
    normCorrect,
    normAccPct: normAccPct.toFixed(2),
    normCi,
    results
  };
}

console.log('⚡ === COMPARATIVE EVALUATION OF INTENT CLASSIFIER ===\n');

const standardEval = evaluateDataset(unseenSamples, 'Standard Unseen Test (n=40)');
const hardEval = evaluateDataset(hardUnseenSamples, 'Hard Unseen Test - Regional/Slang/Inverted (n=25)');

console.log(`📊 1. STANDARD UNSEEN TEST (n=${standardEval.total}):`);
console.log(`   - Raw Accuracy: ${standardEval.rawAccPct}% (${standardEval.rawCorrect}/${standardEval.total}) | 95% CI: [${standardEval.rawCi.lower}%, ${standardEval.rawCi.upper}%]`);
console.log(`   - Normalized Accuracy: ${standardEval.normAccPct}% (${standardEval.normCorrect}/${standardEval.total}) | 95% CI: [${standardEval.normCi.lower}%, ${standardEval.normCi.upper}%]\n`);

console.log(`🔥 2. NEW HARD UNSEEN TEST (n=${hardEval.total}):`);
console.log(`   - Raw Accuracy: ${hardEval.rawAccPct}% (${hardEval.rawCorrect}/${hardEval.total}) | 95% CI: [${hardEval.rawCi.lower}%, ${hardEval.rawCi.upper}%]`);
console.log(`   - Normalized Accuracy: ${hardEval.normAccPct}% (${hardEval.normCorrect}/${hardEval.total}) | 95% CI: [${hardEval.normCi.lower}%, ${hardEval.normCi.upper}%]\n`);

console.log('🔍 Chi tiết các câu Hard Unseen Test dự đoán:');
hardEval.results.forEach(r => {
  console.log(`   [${r.id}] "${r.text}" -> Expect: ${r.expected} | Raw: ${r.rawPred} (${r.rawMatch}) | Norm: ${r.normPred} (${r.normMatch})`);
});
