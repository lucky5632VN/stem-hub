import fs from 'fs';
import path from 'path';

const corpusPath = path.resolve('src/ai-training/datasets/rag-knowledge/stem-corpus.json');
const stemCorpus = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'));

function tokenize(text) {
  if (!text) return [];
  const clean = text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = clean.split(' ').filter(w => w.length > 0);
  const nGrams = [];
  for (let i = 0; i < words.length; i++) {
    nGrams.push(words[i]);
    if (i < words.length - 1) nGrams.push(`${words[i]}_${words[i + 1]}`);
  }
  return nGrams;
}

function buildTFMap(tokens) {
  const tfMap = {};
  const len = tokens.length || 1;
  for (const token of tokens) {
    tfMap[token] = (tfMap[token] || 0) + 1;
  }
  // Normalize TF
  for (const k in tfMap) {
    tfMap[k] = tfMap[k] / len;
  }
  return tfMap;
}

console.log('⚡ [RAG Build Script] Đang tính toán ma trận TF-IDF thực sự cho STEM Corpus...');

const N = stemCorpus.length;
const docTokensList = [];
const docFrequency = {};

// 1. Calculate Term Frequencies and Document Frequencies
stemCorpus.forEach(item => {
  const fullText = `${item.topic} ${item.content} ${item.subject}`;
  const tokens = tokenize(fullText);
  docTokensList.push(tokens);
  
  const uniqueTokens = new Set(tokens);
  uniqueTokens.forEach(t => {
    docFrequency[t] = (docFrequency[t] || 0) + 1;
  });
});

// 2. Calculate IDF Vector Weights: IDF(w) = ln((N + 1) / (DF(w) + 1)) + 1
const idfWeights = {};
for (const word in docFrequency) {
  idfWeights[word] = Math.log((N + 1) / (docFrequency[word] + 1)) + 1.0;
}

// 3. Compute TF-IDF Vectors for all documents
const tfidfCorpus = stemCorpus.map((item, idx) => {
  const tokens = docTokensList[idx];
  const tfMap = buildTFMap(tokens);
  const tfidfMap = {};

  for (const word in tfMap) {
    tfidfMap[word] = tfMap[word] * idfWeights[word];
  }

  return {
    id: item.id,
    subject: item.subject,
    topic: item.topic,
    content: item.content,
    tokenCount: tokens.length,
    tfidfVector: tfidfMap
  };
});

const outputPath = path.resolve('src/data/rag-vectors.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify({
  metadata: {
    totalDocs: N,
    vocabSize: Object.keys(docFrequency).length,
    generatedAt: new Date().toISOString()
  },
  idfWeights,
  corpus: tfidfCorpus
}, null, 2), 'utf-8');

console.log(`✅ [RAG Build Script] Đã lưu ma trận TF-IDF chuẩn (${N} tài liệu, ${Object.keys(docFrequency).length} từ vựng N-Gram) vào: ${outputPath}`);
