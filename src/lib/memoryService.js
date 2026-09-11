import { db, auth } from './firebase.js';
import { collection, addDoc, getDocs, query, orderBy, limit, setDoc, doc } from 'firebase/firestore';
import { generateTextEmbedding, cosineSimilarity } from './continuousMemory.js';

// Queue tạm thời để batching log ai_metrics (Tránh vượt free tier ~20K write/ngày)
let metricsBatchQueue = [];
const BATCH_SIZE_LIMIT = 5; // Batch 5 sự kiện/lần ghi

/**
 * Thêm 1 sự kiện tương tác vào batch queue và tự động ghi khi đủ batch
 */
export async function logAIMetricEvent(eventData) {
  const payload = {
    ...eventData,
    timestamp: Date.now()
  };
  metricsBatchQueue.push(payload);

  if (metricsBatchQueue.length >= BATCH_SIZE_LIMIT) {
    await flushAIMetricsBatch();
  }
}

/**
 * Đẩy toàn bộ batch queue lên Firestore `ai_metrics`
 */
export async function flushAIMetricsBatch() {
  if (metricsBatchQueue.length === 0) return;
  const currentBatch = [...metricsBatchQueue];
  metricsBatchQueue = [];

  try {
    const user = auth?.currentUser;
    const isSimulated = !user; // Phân định Traffic: nếu không đăng nhập -> Simulated Bot traffic

    await addDoc(collection(db, 'ai_metrics'), {
      batchEvents: currentBatch,
      eventCount: currentBatch.length,
      isSimulated, // NGUYÊN TẮC #3: Phân định rạch ròi Traffic Thật vs Mô Phỏng
      loggedAt: Date.now()
    });
    console.log(`[MemoryService] Đã ghi batch ${currentBatch.length} sự kiện ai_metrics.`);
  } catch (err) {
    console.warn('[MemoryService] Ghi batch ai_metrics lỗi (Fallback Client):', err.message);
  }
}

/**
 * Lưu 1 Ký ức Dài hạn (Tầng 2) đã được Vector hóa bằng Transformers.js
 */
export async function saveUserMemorySummary(uid, sessionSummaryText, subject = 'general') {
  if (!uid || !sessionSummaryText) return null;

  try {
    const embeddingVector = await generateTextEmbedding(sessionSummaryText);
    
    const memoryItem = {
      summary: sessionSummaryText,
      subject,
      vector: embeddingVector,
      createdAt: Date.now()
    };

    const userMemRef = collection(db, `users/${uid}/memories`);
    const docRef = await addDoc(userMemRef, memoryItem);
    
    console.log('[MemoryService] Đã lưu Ký ức Tầng 2 thành công:', docRef.id);
    return { id: docRef.id, ...memoryItem };
  } catch (err) {
    console.warn('[MemoryService] Lưu Ký ức Tầng 2 thất bại:', err.message);
    return null;
  }
}

/**
 * Truy hồi Top-K Ký ức liên quan nhất bằng Cosine Similarity
 */
export async function retrieveTopKMemories(uid, queryText, topK = 3) {
  if (!uid || !queryText) return [];

  try {
    const queryVector = await generateTextEmbedding(queryText);
    if (!queryVector) return [];

    const userMemRef = collection(db, `users/${uid}/memories`);
    const q = query(userMemRef, orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);

    const memories = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.vector && Array.isArray(data.vector)) {
        const simScore = cosineSimilarity(queryVector, data.vector);
        memories.push({
          id: docSnap.id,
          summary: data.summary,
          subject: data.subject,
          simScore
        });
      }
    });

    // Sắp xếp theo Cosine Similarity giảm dần
    memories.sort((a, b) => b.simScore - a.simScore);
    return memories.slice(0, topK);
  } catch (err) {
    console.warn('[MemoryService] Truy hồi Top-K Ký ức thất bại:', err.message);
    return [];
  }
}

/**
 * Lưu Snapshot Trọng số Mô hình Tầng 3 định kỳ (Mỗi 20-30 lượt) lên Firestore
 */
export async function saveModelSnapshotToServer(uid, weightsData, trainStepCount) {
  if (!uid || !weightsData) return false;

  try {
    const snapshotRef = doc(db, `users/${uid}/model_snapshot`, 'latest');
    await setDoc(snapshotRef, {
      weights: weightsData,
      stepCount: trainStepCount,
      updatedAt: Date.now()
    });
    console.log(`[MemoryService] Đã lưu Snapshot mô hình Tầng 3 (Step #${trainStepCount}) lên Server.`);
    return true;
  } catch (err) {
    console.warn('[MemoryService] Lưu Snapshot mô hình thất bại:', err.message);
    return false;
  }
}

/**
 * Đọc Snapshot Trọng số Mô hình Tầng 3 từ Firestore
 */
export async function getModelSnapshotFromServer(uid) {
  if (!uid) return null;
  try {
    const { getDoc } = await import('firebase/firestore');
    const snapshotRef = doc(db, `users/${uid}/model_snapshot`, 'latest');
    const docSnap = await getDoc(snapshotRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (err) {
    console.warn('[MemoryService] Đọc Snapshot mô hình từ Server thất bại:', err.message);
    return null;
  }
}
