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

function buildTFVector(tokens) {
  const tfMap = {};
  for (const token of tokens) {
    tfMap[token] = (tfMap[token] || 0) + 1;
  }
  return tfMap;
}

console.log('⚡ [RAG Build Script] Đang trích xuất vector embedding cho STEM Corpus...');

const vectorsData = stemCorpus.map((item) => {
  const fullText = `${item.topic} ${item.content} ${item.subject}`;
  const tokens = tokenize(fullText);
  return {
    id: item.id,
    subject: item.subject,
    topic: item.topic,
    tokenCount: tokens.length,
    vector: buildTFVector(tokens)
  };
});

const outputPath = path.resolve('src/data/rag-vectors.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(vectorsData, null, 2), 'utf-8');

console.log(`✅ [RAG Build Script] Đã tính toán và lưu thành công ${vectorsData.length} vector vào: ${outputPath}`);
