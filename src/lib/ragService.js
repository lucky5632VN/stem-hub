import ragData from '../data/rag-vectors.json';

const { idfWeights, corpus } = ragData;

// Tokenizer & N-Gram Feature Extractor
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

// Compute TF-IDF Vector for Query using precalculated IDF Weights
function buildQueryTFIDFVector(tokens) {
  const tfMap = {};
  const len = tokens.length || 1;
  for (const token of tokens) {
    tfMap[token] = (tfMap[token] || 0) + 1;
  }

  const tfidfMap = {};
  for (const word in tfMap) {
    const tf = tfMap[word] / len;
    const idf = idfWeights[word] || Math.log(ragData.metadata.totalDocs + 1) + 1.0;
    tfidfMap[word] = tf * idf;
  }
  return tfidfMap;
}

// Compute Cosine Similarity between two TF-IDF Vector Objects
export function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const key in vecA) {
    normA += vecA[key] * vecA[key];
    if (vecB[key]) {
      dotProduct += vecA[key] * vecB[key];
    }
  }

  for (const key in vecB) {
    normB += vecB[key] * vecB[key];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Retrieve Top-K most relevant STEM knowledge entries using TF-IDF + Cosine Similarity
 * @param {string} query User query
 * @param {number} k Number of documents to return (default: 3)
 */
export function retrieveTopK(query, k = 3) {
  if (!query || typeof query !== 'string') return [];

  const queryTokens = tokenize(query);
  const queryTFIDF = buildQueryTFIDFVector(queryTokens);

  if (Object.keys(queryTFIDF).length === 0) return [];

  const scored = corpus.map((doc) => {
    let score = cosineSimilarity(queryTFIDF, doc.tfidfVector);

    // Subject boost for explicit subject keywords
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
  return corpus;
}

export default {
  retrieveTopK,
  cosineSimilarity,
  getCorpus
};
