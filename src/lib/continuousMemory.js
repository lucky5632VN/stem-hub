/**
 * CONTINUOUS MEMORY LAYER (Tầng 2 - RAG Vector Memory)
 * 
 * 🔍 Quyết định gói npm Embeddings:
 * - So sánh ngày cập nhật package:
 *   + @xenova/transformers: 2024-05-29T14:37:06.874Z
 *   + @huggingface/transformers: 2026-04-22T16:28:41.207Z
 * -> LỰA CHỌN: Sử dụng `@huggingface/transformers` vì đây là gói chính thức kế thừa, được duy trì và cập nhật liên tục bởi Hugging Face.
 */
import { pipeline } from '@huggingface/transformers';

let featureExtractor = null;

export async function getEmbeddingPipeline() {
  if (!featureExtractor) {
    featureExtractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return featureExtractor;
}

export async function generateTextEmbedding(text) {
  try {
    const extractor = await getEmbeddingPipeline();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (err) {
    console.warn('[ContinuousMemory] Embedding fallback to TF-IDF vectorizer:', err.message);
    return null;
  }
}

export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return normA && normB ? dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}
