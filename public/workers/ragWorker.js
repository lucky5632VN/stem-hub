/**
 * RAG Web Worker: Background Thread Cosine Similarity Calculator
 * 
 * Mục đích: Chạy ngầm thuật toán tìm kiếm vector TF-IDF trong luồng nền (Web Worker).
 * Giải phóng Main Thread, ngăn chặn 100% hiện tượng đơ/khựng (UI Freezing) trên máy tính học đường.
 */

self.onmessage = function(e) {
  const { id, type, query, k, corpus, queryTFIDF } = e.data;

  if (type === 'RETRIEVE_TOP_K') {
    try {
      const vecA = queryTFIDF || {};
      let normA = 0;
      for (const token in vecA) {
        normA += vecA[token] * vecA[token];
      }
      const sqrtNormA = Math.sqrt(normA);

      const scored = (corpus || []).map((doc) => {
        let score = 0;
        const vecB = doc.tfidfVector || {};

        if (sqrtNormA > 0) {
          let dotProduct = 0;
          let normB = 0;

          for (const token in vecA) {
            if (vecB[token]) {
              dotProduct += vecA[token] * vecB[token];
            }
          }
          for (const token in vecB) {
            normB += vecB[token] * vecB[token];
          }

          if (normB > 0) {
            score = dotProduct / (sqrtNormA * Math.sqrt(normB));
          }
        }

        // Thưởng điểm cho tài liệu tự học
        if (doc.isLearned) score *= 1.4;

        // Subject boost cho các từ khóa môn học cụ thể
        const qLower = (query || '').toLowerCase().replace(/hoá/g, 'hóa').replace(/vật lí/g, 'vật lý');
        const docSubj = (doc.subject || '').toLowerCase();
        if (docSubj === 'hoa' && (qLower.includes('hóa') || qLower.includes('hoá') || qLower.includes('este') || qLower.includes('axit'))) {
          score *= 1.3;
        } else if (docSubj === 'ly' && (qLower.includes('lý') || qLower.includes('lí') || qLower.includes('sóng') || qLower.includes('dao động'))) {
          score *= 1.3;
        } else if (docSubj === 'toan' && (qLower.includes('toán') || qLower.includes('hàm số') || qLower.includes('tích phân'))) {
          score *= 1.3;
        } else if (docSubj === 'sinh' && (qLower.includes('sinh') || qLower.includes('adn') || qLower.includes('gen') || qLower.includes('màng'))) {
          score *= 1.3;
        }

        return {
          id: doc.id,
          subject: doc.subject,
          topic: doc.topic,
          content: doc.content || doc.answer,
          score: Math.min(1.0, score)
        };
      });

      scored.sort((a, b) => b.score - a.score);
      const results = scored.slice(0, k || 3).filter(doc => doc.score > 0.05);

      self.postMessage({ id, success: true, results });
    } catch (err) {
      self.postMessage({ id, success: false, error: err.message, results: [] });
    }
  }
};
