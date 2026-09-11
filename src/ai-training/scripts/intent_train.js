import fs from 'fs';
import path from 'path';
import { normalizeText } from '../../lib/textNormalizer.js';
import { wilsonInterval } from './chem-risk_train.js';

const datasetPath = path.resolve('src/ai-training/datasets/intent/intent-samples.json');
const unseenPath = path.resolve('src/ai-training/datasets/intent/unseen-test-intent.json');

const rawData = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
const unseenData = JSON.parse(fs.readFileSync(unseenPath, 'utf-8'));

function removeVietnameseTones(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function tokenize(text, applyNormalization = true) {
  if (!text) return [];
  const processedText = applyNormalization ? normalizeText(text) : text;
  const cleaned = processedText
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = cleaned.split(' ').filter(Boolean);
  const unaccented = tokens.map(t => removeVietnameseTones(t));
  return Array.from(new Set([...tokens, ...unaccented]));
}

export function trainNaiveBayesOnData(trainDataset) {
  const vocab = new Set();
  const classCounts = {};
  const wordCounts = {};
  const totalWordsInClass = {};
  const totalDocs = trainDataset.length;

  trainDataset.forEach(item => {
    const intent = item.intent;
    const tokens = tokenize(item.text, true);

    classCounts[intent] = (classCounts[intent] || 0) + 1;
    wordCounts[intent] = wordCounts[intent] || {};
    totalWordsInClass[intent] = (totalWordsInClass[intent] || 0) + tokens.length;

    tokens.forEach(word => {
      vocab.add(word);
      wordCounts[intent][word] = (wordCounts[intent][word] || 0) + 1;
    });
  });

  const vocabSize = vocab.size;

  const predict = (text, applyNormalization = true) => {
    const tokens = tokenize(text, applyNormalization);
    let bestIntent = null;
    let maxLogProb = -Infinity;
    const scores = {};
    let sumScore = 0;

    for (const intent in classCounts) {
      const priorLogProb = Math.log(classCounts[intent] / totalDocs);
      let logProb = priorLogProb;

      tokens.forEach(word => {
        const count = wordCounts[intent][word] || 0;
        const likelihood = Math.log((count + 1) / (totalWordsInClass[intent] + vocabSize));
        logProb += likelihood;
      });

      scores[intent] = Math.exp(logProb);
      sumScore += scores[intent];

      if (logProb > maxLogProb) {
        maxLogProb = logProb;
        bestIntent = intent;
      }
    }

    const maxProb = sumScore > 0 ? (scores[bestIntent] / sumScore) : 0;

    let detectedSubject = null;
    if (bestIntent === 'chitchat') {
      detectedSubject = null;
    } else {
      const qLower = text.toLowerCase();
      if (qLower.includes('hóa') || qLower.includes('este') || qLower.includes('axit') || qLower.includes('gluco') || qLower.includes('chất')) detectedSubject = 'hoa';
      else if (qLower.includes('lý') || qLower.includes('sóng') || qLower.includes('dao động') || qLower.includes('mạch') || qLower.includes('quang')) detectedSubject = 'ly';
      else if (qLower.includes('toán') || qLower.includes('đạo hàm') || qLower.includes('tích phân') || qLower.includes('bậc hai') || qLower.includes('hàm số')) detectedSubject = 'toan';
      else if (qLower.includes('sinh') || qLower.includes('adn') || qLower.includes('gen') || qLower.includes('màng') || qLower.includes('tế bào')) detectedSubject = 'sinh';
    }

    return {
      intent: bestIntent,
      subject: detectedSubject,
      confidenceProb: maxProb,
      isLowConfidence: maxProb < 0.65
    };
  };

  return { predict, vocab, classCounts, wordCounts, totalWordsInClass, totalDocs };
}

export function runIntentAudit() {
  // Check exact string overlap between train and unseen test
  const trainTexts = new Set(rawData.map(d => d.text.trim().toLowerCase()));
  const overlappingSamples = unseenData.filter(d => trainTexts.has(d.text.trim().toLowerCase()));
  const overlapCount = overlappingSamples.length;

  const model = trainNaiveBayesOnData(rawData);

  // Per-class metrics accumulator
  const perClassStats = {};
  const allIntents = Array.from(new Set([...rawData.map(d => d.intent), ...unseenData.map(d => d.intent)]));
  allIntents.forEach(intent => {
    perClassStats[intent] = { total: 0, rawCorrect: 0, normCorrect: 0 };
  });

  // Raw without normalization
  let rawCorrect = 0;
  unseenData.forEach(item => {
    const res = model.predict(item.text, false);
    if (perClassStats[item.intent]) perClassStats[item.intent].total++;
    if (res.intent === item.intent) {
      rawCorrect++;
      if (perClassStats[item.intent]) perClassStats[item.intent].rawCorrect++;
    }
  });
  const rawAccPct = (rawCorrect / unseenData.length) * 100;
  const rawCi = wilsonInterval(rawCorrect, unseenData.length);

  // With normalization
  let normCorrect = 0;
  unseenData.forEach(item => {
    const res = model.predict(item.text, true);
    if (res.intent === item.intent) {
      normCorrect++;
      if (perClassStats[item.intent]) perClassStats[item.intent].normCorrect++;
    }
  });
  const normAccPct = (normCorrect / unseenData.length) * 100;
  const normCi = wilsonInterval(normCorrect, unseenData.length);

  // Format per-class results
  const perClassMetrics = {};
  for (const intent of allIntents) {
    const stat = perClassStats[intent];
    const acc = stat.total > 0 ? ((stat.normCorrect / stat.total) * 100).toFixed(1) : '0.0';
    const ci = wilsonInterval(stat.normCorrect, stat.total);
    perClassMetrics[intent] = {
      unseenTotal: stat.total,
      normCorrect: stat.normCorrect,
      accuracyPct: acc,
      wilsonCi95: ci
    };
  }

  // Save model
  const savePath = path.resolve('src/data/models/intent-classifier.json');
  fs.mkdirSync(path.dirname(savePath), { recursive: true });
  fs.writeFileSync(savePath, JSON.stringify({
    metadata: {
      modelName: "Multinomial Naive Bayes Intent & Subject Classifier",
      trainedAt: new Date().toISOString(),
      datasetTotal: rawData.length,
      unseenSampleSize: unseenData.length,
      exactOverlapCount: overlapCount,
      rawUnseenAccuracyPct: rawAccPct.toFixed(2),
      rawWilsonCi95: rawCi,
      normalizedUnseenAccuracyPct: normAccPct.toFixed(2),
      normalizedWilsonCi95: normCi,
      perClassMetrics,
      confidenceThreshold: 0.65,
      vocabSize: model.vocab.size,
      sampleSizeNote: `Tập kiểm thử độc lập Unseen Test set (n=${unseenData.length}), phủ đủ 7 lớp ý định bao gồm cả chitchat.`
    },
    vocab: Array.from(model.vocab),
    classCounts: model.classCounts,
    totalWordsInClass: model.totalWordsInClass,
    wordCounts: model.wordCounts,
    totalDocs: model.totalDocs
  }, null, 2), 'utf-8');

  return {
    modelName: "Javit Intent Classifier",
    trainSize: rawData.length,
    unseenSize: unseenData.length,
    overlapCount,
    rawAccPct: rawAccPct.toFixed(2),
    rawCi,
    normAccPct: normAccPct.toFixed(2),
    normCi,
    perClassMetrics,
    vocabSize: model.vocab.size
  };
}

if (process.argv[1] && process.argv[1].endsWith('intent_train.js')) {
  const result = runIntentAudit();
  console.log('⚡ === AUDIT JAVIT INTENT CLASSIFIER ===');
  console.log(`- Dataset: Total ${result.trainSize} Train samples, ${result.unseenSize} Unseen Test samples`);
  console.log(`- Overlap Check (Train vs Unseen): ${result.overlapCount} trùng lặp (${result.overlapCount === 0 ? 'PASS - Hoàn toàn không trùng' : 'LƯU Ý'})`);
  console.log(`- Raw Unseen Test Accuracy (n=${result.unseenSize}): ${result.rawAccPct}% (95% CI: [${result.rawCi.lower}%, ${result.rawCi.upper}%])`);
  console.log(`- Normalized Unseen Test Accuracy (n=${result.unseenSize}): ${result.normAccPct}% (95% CI: [${result.normCi.lower}%, ${result.normCi.upper}%])`);
  console.log('\n📊 Phân rã độ chính xác từng lớp (Per-Class Accuracy Breakdown):');
  for (const [intent, stat] of Object.entries(result.perClassMetrics)) {
    console.log(`  - Class '${intent}': ${stat.normCorrect}/${stat.unseenTotal} đúng (${stat.accuracyPct}%, 95% CI: [${stat.wilsonCi95.lower}%, ${stat.wilsonCi95.upper}%])`);
  }
}
