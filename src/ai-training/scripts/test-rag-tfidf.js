import fs from 'fs';
import path from 'path';
import { retrieveTopK, cosineSimilarity } from '../../lib/ragService.js';
import { wilsonInterval } from './chem-risk_train.js';

const vectorsPath = path.resolve('src/data/rag-vectors.json');
const ragData = JSON.parse(fs.readFileSync(vectorsPath, 'utf-8'));

export function runRagAudit() {
  const vocabSize = Object.keys(ragData.idfWeights).length;
  const totalChunks = ragData.metadata.totalDocs;

  // 32 Benchmark Academic Queries across Grades 10-12
  const benchmarkQueries = [
    { id: 1, query: "este hóa phản ứng giữa axit và ancol", subject: "hoa", topicMatch: "Este" },
    { id: 2, query: "dao động điều hòa con lắc đơn chu kỳ T", subject: "ly", topicMatch: "Dao động" },
    { id: 3, query: "tích phân nguyên hàm diện tích hình phẳng", subject: "toan", topicMatch: "Tích phân" },
    { id: 4, query: "di truyền mendel quy luật phân ly độc lập ADN", subject: "sinh", topicMatch: "Mendel" },
    { id: 5, query: "phản ứng trung hòa axit bazơ tạo muối nước", subject: "hoa", topicMatch: "Axit" },
    { id: 6, query: "thấu kính hội tụ tiêu điểm ảnh thật", subject: "ly", topicMatch: "Thấu kính" },
    { id: 7, query: "đạo hàm cực trị hàm số bậc ba", subject: "toan", topicMatch: "Hàm số" },
    { id: 8, query: "đột biến gen thay thế cặp nucleotit", subject: "sinh", topicMatch: "Đột biến" },
    { id: 9, query: "cân bằng le chatelier chuyển dịch nhiệt độ", subject: "hoa", topicMatch: "Cân bằng" },
    { id: 10, query: "quang phổ vạch phát xạ nguyên tử hydro", subject: "ly", topicMatch: "Quang phổ" },
    { id: 11, query: "phương trình mặt phẳng oxyz véc tơ pháp tuyến", subject: "toan", topicMatch: "Oxyz" },
    { id: 12, query: "Hardy Weinberg tần số alen quần thể", subject: "sinh", topicMatch: "Hardy-Weinberg" },
    { id: 13, query: "cấu hình electron nguyên tử phân lớp s p d f", subject: "hoa", topicMatch: "Cấu hình Electron" },
    { id: 14, query: "định luật Coulomb lực hút giữa hai điện tích điểm", subject: "ly", topicMatch: "Coulomb" },
    { id: 15, query: "hàm số bậc hai đồ thị parabol đỉnh I", subject: "toan", topicMatch: "Parabol" },
    { id: 16, query: "tế bào nhân sơ vùng nhân ADN dạng vòng", subject: "sinh", topicMatch: "Nhân sơ" },
    { id: 17, query: "axit nitric HNO3 tính oxi hóa mạnh kim loại", subject: "hoa", topicMatch: "HNO3" },
    { id: 18, query: "hiện tượng cảm ứng điện từ suất điện động Lenz", subject: "ly", topicMatch: "Cảm ứng điện từ" },
    { id: 19, query: "cấp số cộng số hạng tổng quát công sai d", subject: "toan", topicMatch: "Cấp số cộng" },
    { id: 20, query: "quang hợp C3 C4 CAM chu trình calvin", subject: "sinh", topicMatch: "Quang hợp" },
    { id: 21, query: "phản ứng xà phòng hóa este triglixerit glixerol", subject: "hoa", topicMatch: "Xà phòng hóa" },
    { id: 22, query: "dòng điện xoay chiều mạch RLC nối tiếp cộng hưởng", subject: "ly", topicMatch: "Mạch RLC" },
    { id: 23, query: "phương trình mũ logarit tập nghiệm", subject: "toan", topicMatch: "Logarit" },
    { id: 24, query: "mã di truyền bộ ba codon mARN dịch mã protein", subject: "sinh", topicMatch: "Dịch mã" },
    { id: 25, query: "dãy điện hóa kim loại tính khử cation tính oxi hóa", subject: "hoa", topicMatch: "Dãy điện hóa" },
    { id: 26, query: "sóng điện từ mạch LC tần số góc bước sóng", subject: "ly", topicMatch: "Sóng điện từ" },
    { id: 27, query: "tọa độ điểm đường tròn Oxy bán kính R", subject: "toan", topicMatch: "Đường tròn Oxy" },
    { id: 28, query: "enzyme chất xúc tác sinh học giảm năng lượng hoạt hóa", subject: "sinh", topicMatch: "Enzyme" },
    { id: 29, query: "tốc độ phản ứng hóa học nồng độ nhiệt độ chất xúc tác", subject: "hoa", topicMatch: "Tốc độ phản ứng" },
    { id: 30, query: "định luật bảo toàn động lượng hệ kín va chạm", subject: "ly", topicMatch: "Bảo toàn động lượng" },
    { id: 31, query: "số phức phần thực phần ảo môđun liên hợp", subject: "toan", topicMatch: "Số phức" },
    { id: 32, query: "operon lac vi khuẩn E coli protein chế tiết", subject: "sinh", topicMatch: "Operon Lac" }
  ];

  let top1MatchCount = 0;
  let top3MatchCount = 0;
  let totalTop1Score = 0;

  const detailedResults = benchmarkQueries.map(q => {
    const results = retrieveTopK(q.query, 3);
    const top1 = results[0] || { topic: 'None', score: 0, subject: 'none' };
    const isTop1Match = top1.subject === q.subject;
    const isTop3Match = results.some(r => r.subject === q.subject);

    if (isTop1Match) top1MatchCount++;
    if (isTop3Match) top3MatchCount++;
    totalTop1Score += top1.score;

    return {
      id: q.id,
      query: q.query,
      expectedSubject: q.subject,
      retrievedTopic: top1.topic,
      retrievedSubject: top1.subject,
      top1ScorePct: (top1.score * 100).toFixed(1) + '%',
      isTop1Match,
      isTop3Match
    };
  });

  const avgTop1ScorePct = (totalTop1Score / benchmarkQueries.length) * 100;
  const top1AccPct = (top1MatchCount / benchmarkQueries.length) * 100;
  const top3AccPct = (top3MatchCount / benchmarkQueries.length) * 100;
  const ci = wilsonInterval(top1MatchCount, benchmarkQueries.length);

  return {
    modelName: "Multilingual TF-IDF RAG Service",
    vocabSize,
    totalChunks,
    testQueryCount: benchmarkQueries.length,
    top1MatchCount,
    top1AccPct: top1AccPct.toFixed(2),
    top3AccPct: top3AccPct.toFixed(2),
    avgTop1ScorePct: avgTop1ScorePct.toFixed(2),
    ci,
    sampleSizeNote: `Tập kiểm thử Benchmark RAG (n=${benchmarkQueries.length} queries) phủ đủ 4 môn Toán, Lý, Hóa, Sinh từ Lớp 10 đến Lớp 12.`,
    detailedResults
  };
}

if (process.argv[1] && process.argv[1].endsWith('test-rag-tfidf.js')) {
  const result = runRagAudit();
  console.log('⚡ === AUDIT MULTILINGUAL TF-IDF RAG SERVICE ===');
  console.log(`- Corpus Size: ${result.totalChunks} Chunks | Vocabulary Size: ${result.vocabSize} N-Gram Tokens`);
  console.log(`- Benchmark Test Queries (n=${result.testQueryCount}): Top-1 Subject Match Accuracy: ${result.top1AccPct}% (95% CI: [${result.ci.lower}%, ${result.ci.upper}%])`);
  console.log(`- Top-3 Retrieval Hit Rate: ${result.top3AccPct}%`);
  console.log(`- Mean Top-1 Cosine Similarity Score: ${result.avgTop1ScorePct}%`);
  console.log(`- Chú thích: ${result.sampleSizeNote}`);
  console.log(`- Detailed Query Retrievals:`);
  result.detailedResults.forEach(r => {
    console.log(`   Query ${r.id}: "${r.query}" -> Top1: [${r.retrievedSubject.toUpperCase()}] ${r.retrievedTopic} (Score: ${r.top1ScorePct}) | Hit: ${r.isTop1Match}`);
  });
}
