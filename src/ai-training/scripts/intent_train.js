import fs from 'fs';
import path from 'path';

const datasetPath = path.resolve('src/ai-training/datasets/intent/intent-samples.json');
const rawData = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

export function trainNaiveBayesIntentClassifier() {
  console.log('⚡ [Intent Classifier] Bắt đầu huấn luyện Mô hình Multinomial Naive Bayes...');

  const vocab = new Set();
  const classCounts = {};
  const wordCounts = {};
  const totalWordsInClass = {};
  let totalDocs = rawData.length;

  rawData.forEach(item => {
    const intent = item.intent;
    const tokens = tokenize(item.text);

    classCounts[intent] = (classCounts[intent] || 0) + 1;
    wordCounts[intent] = wordCounts[intent] || {};
    totalWordsInClass[intent] = (totalWordsInClass[intent] || 0) + tokens.length;

    tokens.forEach(word => {
      vocab.add(word);
      wordCounts[intent][word] = (wordCounts[intent][word] || 0) + 1;
    });
  });

  const vocabSize = vocab.size;

  const predict = (text) => {
    const tokens = tokenize(text);
    let bestIntent = null;
    let maxLogProb = -Infinity;

    for (const intent in classCounts) {
      const priorLogProb = Math.log(classCounts[intent] / totalDocs);
      let logProb = priorLogProb;

      tokens.forEach(word => {
        const count = wordCounts[intent][word] || 0;
        // Laplace Smoothing (+1)
        const likelihood = Math.log((count + 1) / (totalWordsInClass[intent] + vocabSize));
        logProb += likelihood;
      });

      if (logProb > maxLogProb) {
        maxLogProb = logProb;
        bestIntent = intent;
      }
    }

    // Determine subject if intent is stem_query
    let detectedSubject = null;
    const qLower = text.toLowerCase();
    if (qLower.includes('hóa') || qLower.includes('este') || qLower.includes('axit') || qLower.includes('gluco')) detectedSubject = 'hoa';
    else if (qLower.includes('lý') || qLower.includes('sóng') || qLower.includes('dao động') || qLower.includes('mạch')) detectedSubject = 'ly';
    else if (qLower.includes('toán') || qLower.includes('đạo hàm') || qLower.includes('tích phân') || qLower.includes('bậc hai')) detectedSubject = 'toan';
    else if (qLower.includes('sinh') || qLower.includes('adn') || qLower.includes('gen') || qLower.includes('màng')) detectedSubject = 'sinh';

    return { intent: bestIntent, subject: detectedSubject, logProb: maxLogProb };
  };

  // Evaluate Accuracy
  let correct = 0;
  rawData.forEach(item => {
    const res = predict(item.text);
    if (res.intent === item.intent) correct++;
  });

  const accuracy = (correct / totalDocs) * 100;
  console.log(`📊 [Intent Classifier] Accuracy trên tập huấn luyện (${totalDocs} mẫu): ${accuracy.toFixed(1)}%`);

  const savePath = path.resolve('src/data/models/intent-classifier.json');
  fs.mkdirSync(path.dirname(savePath), { recursive: true });
  fs.writeFileSync(savePath, JSON.stringify({
    metadata: {
      modelName: "Multinomial Naive Bayes Intent & Subject Classifier",
      trainedAt: new Date().toISOString(),
      datasetSize: totalDocs,
      accuracy: `${accuracy.toFixed(1)}%`,
      vocabSize
    },
    vocab: Array.from(vocab),
    classCounts,
    totalWordsInClass,
    wordCounts,
    totalDocs
  }, null, 2), 'utf-8');

  console.log(`✅ [Intent Classifier] Đã lưu model thành công tại: ${savePath}`);
}

trainNaiveBayesIntentClassifier();
