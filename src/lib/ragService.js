import stemCorpus from '../ai-training/datasets/rag-knowledge/stem-corpus.json';

// Simple Vietnamese Tokenizer & N-Gram Feature Extractor for Semantic Vector Matching
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
    if (i < words.length - 1) {
      nGrams.push(`${words[i]}_${words[i + 1]}`);
    }
  }
  return nGrams;
}

// Compute Term Frequency Vector Object
function buildTFVector(tokens) {
  const tfMap = {};
  for (const token of tokens) {
    tfMap[token] = (tfMap[token] || 0) + 1;
  }
  return tfMap;
}

// Compute Cosine Similarity between two TF Vector objects
export function cosineSimilarity(tfA, tfB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const key in tfA) {
    normA += tfA[key] * tfA[key];
    if (tfB[key]) {
      dotProduct += tfA[key] * tfB[key];
    }
  }

  for (const key in tfB) {
    normB += tfB[key] * tfB[key];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Pre-index the stem corpus with precomputed TF Vectors
const indexedCorpus = stemCorpus.map((item) => {
  const fullText = `${item.topic} ${item.content} ${item.subject}`;
  const tokens = tokenize(fullText);
  return {
    ...item,
    tfVector: buildTFVector(tokens)
  };
});

/**
 * Retrieve Top-K most relevant knowledge entries using Cosine Similarity
 * @param {string} query User query
 * @param {number} k Number of documents to return (default: 3)
 * @returns {Array<{id: string, subject: string, topic: string, content: string, score: number}>}
 */
export function retrieveTopK(query, k = 3) {
  if (!query || typeof query !== 'string') return [];

  const queryTokens = tokenize(query);
  const queryTF = buildTFVector(queryTokens);

  if (Object.keys(queryTF).length === 0) return [];

  const scored = indexedCorpus.map((doc) => {
    let score = cosineSimilarity(queryTF, doc.tfVector);

    // Subject boost if query explicitly mentions subject
    const qLower = query.toLowerCase();
    if (doc.subject === 'hoa' && (qLower.includes('hóa') || qLower.includes('hoa') || qLower.includes('este') || qLower.includes('axit'))) {
      score *= 1.25;
    } else if (doc.subject === 'ly' && (qLower.includes('lý') || qLower.includes('ly') || qLower.includes('sóng') || qLower.includes('dao động'))) {
      score *= 1.25;
    } else if (doc.subject === 'toan' && (qLower.includes('toán') || qLower.includes('toan') || qLower.includes('hàm số') || qLower.includes('tích phân'))) {
      score *= 1.25;
    } else if (doc.subject === 'sinh' && (qLower.includes('sinh') || qLower.includes('adn') || qLower.includes('gen') || qLower.includes('màng'))) {
      score *= 1.25;
    }

    return {
      id: doc.id,
      subject: doc.subject,
      topic: doc.topic,
      content: doc.content,
      score: Math.min(1.0, score)
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, k).filter(doc => doc.score > 0.05);
}

export function getCorpus() {
  return indexedCorpus;
}

export default {
  retrieveTopK,
  cosineSimilarity,
  getCorpus
};
