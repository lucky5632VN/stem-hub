import fs from 'fs';
import path from 'path';
import { normalizeText } from '../../lib/textNormalizer.js';

const datasetPath = path.resolve('src/ai-training/datasets/intent/intent-samples.json');
const unseenPath = path.resolve('src/ai-training/datasets/intent/unseen-test-intent.json');

const rawData = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
const unseenData = JSON.parse(fs.readFileSync(unseenPath, 'utf-8'));

function tokenize(text, applyNormalization = true) {
  if (!text) return [];
  const processedText = applyNormalization ? normalizeText(text) : text;
  return processedText
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

function trainNaiveBayesOnData(trainDataset) {
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

    // Probability calculation
    const maxProb = sumScore > 0 ? (scores[bestIntent] / sumScore) : 0;

    let detectedSubject = null;
    const qLower = text.toLowerCase();
    if (qLower.includes('hóa') || qLower.includes('este') || qLower.includes('axit') || qLower.includes('gluco') || qLower.includes('chất')) detectedSubject = 'hoa';
    else if (qLower.includes('lý') || qLower.includes('sóng') || qLower.includes('dao động') || qLower.includes('mạch') || qLower.includes('quang')) detectedSubject = 'ly';
    else if (qLower.includes('toán') || qLower.includes('đạo hàm') || qLower.includes('tích phân') || qLower.includes('bậc hai') || qLower.includes('hàm số')) detectedSubject = 'toan';
    else if (qLower.includes('sinh') || qLower.includes('adn') || qLower.includes('gen') || qLower.includes('màng') || qLower.includes('tế bào')) detectedSubject = 'sinh';

    return {
      intent: bestIntent,
      subject: detectedSubject,
      confidenceProb: maxProb,
      isLowConfidence: maxProb < 0.65
    };
  };

  return { predict, vocab, classCounts, wordCounts, totalWordsInClass, totalDocs };
}

function evaluateIntentClassifier() {
  console.log('⚡ [Intent Classifier] Đánh giá ảnh hưởng của Text Normalization trên Unseen Test Set...');

  const model = trainNaiveBayesOnData(rawData);

  // Raw without normalization
  let rawCorrect = 0;
  unseenData.forEach(item => {
    const res = model.predict(item.text, false);
    if (res.intent === item.intent) rawCorrect++;
  });
  const rawAcc = (rawCorrect / unseenData.length) * 100;

  // With normalization
  let normCorrect = 0;
  unseenData.forEach(item => {
    const res = model.predict(item.text, true);
    if (res.intent === item.intent) normCorrect++;
  });
  const normAcc = (normCorrect / unseenData.length) * 100;

  console.log(`📊 Model: Multinomial Naive Bayes Intent Classifier (Hybrid Pipeline)`);
  console.log(`- Dataset size: ${rawData.length} câu (50 câu/lớp × 6 lớp)`);
  console.log(`- Unseen Test Accuracy khi KHÔNG chuẩn hóa (Raw Teen-code): ${rawAcc.toFixed(1)}% (${rawCorrect}/${unseenData.length})`);
  console.log(`- Unseen Test Accuracy sau khi CHUẨN HÓA (Text Normalizer): ${normAcc.toFixed(1)}% (${normCorrect}/${unseenData.length})`);
  console.log(`- Cơ chế Fallback Hybrid: Đã tích hợp ngưỡng tin cậy (Confidence threshold = 0.65). Nếu confidence < 0.65, hệ thống không gọi lệnh [[NAV:...]] cứng mà sẽ fallback chuyển cho Gemini RAG.`);

  const savePath = path.resolve('src/data/models/intent-classifier.json');
  fs.mkdirSync(path.dirname(savePath), { recursive: true });
  fs.writeFileSync(savePath, JSON.stringify({
    metadata: {
      modelName: "Multinomial Naive Bayes Intent & Subject Classifier",
      trainedAt: new Date().toISOString(),
      datasetSize: rawData.length,
      rawUnseenAccuracy: `${rawAcc.toFixed(1)}%`,
      normalizedUnseenAccuracy: `${normAcc.toFixed(1)}%`,
      confidenceThreshold: 0.65,
      vocabSize: model.vocab.size
    },
    vocab: Array.from(model.vocab),
    classCounts: model.classCounts,
    totalWordsInClass: model.totalWordsInClass,
    wordCounts: model.wordCounts,
    totalDocs: model.totalDocs
  }, null, 2), 'utf-8');

  console.log(`✅ [Intent Classifier] Đã cập nhật model thành công tại: ${savePath}`);
}

evaluateIntentClassifier();
