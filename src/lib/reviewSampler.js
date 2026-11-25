/**
 * 🎯 REVIEW SAMPLER & BLIND EVALUATION ENGINE (ESM)
 * 
 * Quản lý việc trích xuất mẫu đánh giá độc lập có hạt giống (reproducible seed),
 * lọc theo chuyên môn môn học, và làm mù (Double-Blind / Single-Blind) dữ liệu
 * trước khi trả về cho giao diện thẩm định của Giáo viên hoặc Nhóm tự chấm.
 * 
 * Nguồn dữ liệu:
 * 1. 150 ca benchmark chuẩn GDPT 2018 (`benchmark_150_cases.json`)
 * 2. Mẫu câu trả lời trợ lý / cạm bẫy đối chứng (`rag_ablation_benchmark.json`)
 * 3. 45-46 bản ghi tri thức tự học đang cách ly (`global-learned-knowledge.json`)
 */

import fs from 'fs';
import path from 'path';

// 1. Bộ sinh số ngẫu nhiên giả định tất định Mulberry32
export function createPrng(seed) {
  let s = Math.floor(Math.abs(Number(seed) || 2026)) + 1;
  return function next() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hàm băm chuỗi thành số nguyên 32-bit (dùng trộn seed với UID)
export function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return hash;
}

// 2. Tải và chuẩn hóa kho mẫu toàn diện
let cachedPool = null;

function loadRawDataset(filePath) {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    }
  } catch (err) {
    console.warn(`[ReviewSampler] Không thể tải tệp ${filePath}:`, err.message);
  }
  return null;
}

export function buildUnifiedSamplePool(forceReload = false) {
  if (cachedPool && !forceReload) return cachedPool;

  const pool = [];

  // Nguồn 1: 150 benchmark cases
  const bench150 = loadRawDataset('src/ai-training/datasets/benchmark_150_cases.json') || [];
  bench150.forEach((item, index) => {
    const subj = (item.subject || 'toan').toLowerCase();
    const cleanId = item.id ? String(item.id).toLowerCase() : `bench_${subj}_${index + 1}`;
    pool.push({
      sampleId: cleanId.startsWith('bench_') ? cleanId : `bench_${subj}_${cleanId}`,
      subject: subj,
      sourceType: 'benchmark_150',
      grade: item.grade || 12,
      topic: item.topic || 'Chủ đề chuẩn GDPT 2018',
      difficulty: item.difficulty || 'Thông hiểu',
      question: item.question || '',
      systemResponse: item.gemini_response || item.answer || '',
      referenceAnswer: item.ground_truth || '',
      sgkReference: item.sgk_reference || '',
      rawMeta: {
        originalId: item.id
      }
    });
  });

  // Nguồn 2: RAG Ablation Benchmark (Hard trap questions)
  const ablationData = loadRawDataset('src/ai-training/datasets/rag_ablation_benchmark.json');
  if (ablationData && Array.isArray(ablationData.hard_trap_gdpt2018)) {
    ablationData.hard_trap_gdpt2018.forEach((item, index) => {
      const subj = (item.subject || 'toan').toLowerCase();
      const cleanId = item.id ? String(item.id).toLowerCase() : `ablation_${subj}_${index + 1}`;
      pool.push({
        sampleId: cleanId.startsWith('ablation_') ? cleanId : `ablation_${subj}_${cleanId}`,
        subject: subj,
        sourceType: 'assistant_response',
        grade: 12,
        topic: item.topic || 'Câu hỏi biên cạm bẫy GDPT 2018',
        difficulty: 'Vận dụng cao',
        question: item.question || '',
        systemResponse: item.correct_answer ? `Phân tích phản hồi học tập: ${item.correct_answer}` : '',
        referenceAnswer: item.correct_answer || '',
        sgkReference: item.sgk_ref || 'SGK GDPT 2018',
        rawMeta: {
          trapPoint: item.trap_point
        }
      });
    });
  }

  // Nguồn 3: Tri thức học sinh gửi & tri thức tự học (Quarantined / Pending Learned Knowledge)
  const quarantinedData = loadRawDataset('src/data/global-learned-knowledge.json') || [];
  quarantinedData.forEach((item, index) => {
    let subj = (item.subject || 'stem').toLowerCase();
    if (subj === 'stem') subj = 'toan'; // Map mặc định nếu là liên môn
    const isStudentFlag = item.sourceType === 'student_flagged_for_teacher';
    pool.push({
      sampleId: String(item.id || `learned_${subj}_${index + 1}`).toLowerCase(),
      subject: subj,
      sourceType: isStudentFlag ? 'student_flagged_for_teacher' : 'quarantined_knowledge',
      studentNote: item.studentNote || '',
      studentName: item.studentName || 'Học sinh',
      isStudentFlag: isStudentFlag,
      grade: item.grade || 12,
      topic: item.topic || (isStudentFlag ? 'Học sinh băn khoăn gửi giáo viên kiểm tra' : 'Tri thức tự học học sinh'),
      difficulty: 'Thực tế',
      question: item.query || '',
      systemResponse: item.answer || item.content || '',
      referenceAnswer: item.referenceAnswer || (isStudentFlag ? 'Học sinh gửi yêu cầu giáo viên kiểm tra và hiệu đính' : 'Học sinh đề xuất / Hệ thống ghi nhận tự động (Cần giáo viên đối chiếu SGK)'),
      sgkReference: item.sgkReference || 'Cần giáo viên đối chiếu SGK chuẩn và hiệu đính',
      rawMeta: {
        isStudentFlag,
        studentNote: item.studentNote,
        quarantined: item.quarantined
      }
    });
  });

  // Nguồn 4: Đề thi chính thức & minh họa THPT 4 môn có đáp án chi tiết sinh từ AI
  const officialExamsData = loadRawDataset('src/ai-training/datasets/official_exam_questions_for_review.json') || [];
  officialExamsData.forEach(item => {
    pool.push({
      sampleId: item.sampleId,
      subject: (item.subject || 'toan').toLowerCase(),
      sourceType: 'official_exam',
      grade: item.grade || 12,
      topic: item.topic || 'Đề thi chính thức / Đề ôn tập THPT',
      difficulty: item.difficulty || 'Vận dụng',
      question: item.question || '',
      systemResponse: item.systemResponse || '',
      referenceAnswer: item.referenceAnswer || '',
      sgkReference: item.sgkReference || 'Đề thi chính thức Bộ GD&ĐT',
      rawMeta: item.rawMeta || {}
    });
  });

  cachedPool = pool;
  return pool;
}

// Hàm làm sạch chuỗi câu trả lời của AI để không lộ tên mô hình hay prompt metadata
export function cleanSystemResponse(text) {
  if (!text) return '';
  return text
    .replace(/^Phân tích theo SGK(?:\s+[^:]+?)?\s*GDPT 2018:\s*/i, '')
    .replace(/^\[Tự học AI\]\s*/i, '')
    .trim();
}

// Hàm loại bỏ các câu hỏi trùng lặp hoàn toàn nội dung trong cùng một môn (giữ mục đầu tiên)
export function dedupePoolQuestions(items = []) {
  const seenQuestions = new Set();
  const deduped = [];
  for (const item of items) {
    const normQ = String(item?.question || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (normQ && seenQuestions.has(normQ)) continue;
    if (normQ) seenQuestions.add(normQ);
    deduped.push(item);
  }
  return deduped;
}

/**
 * Lấy danh sách mẫu đã được làm mù cho một người chấm cụ thể
 * @param {Object} params
 * @param {string} params.subject - Môn học ('toan', 'ly', 'hoa', 'sinh')
 * @param {number} params.seed - Hạt giống ngẫu nhiên (mặc định 2026)
 * @param {number} params.sampleSize - Số lượng mẫu cần rút (mặc định 20, có thể cấu hình lên 30)
 * @param {string} params.reviewerUid - UID của người chấm (để xáo thứ tự chống order bias)
 * @returns {Object} { seed, subject, sampleSize, samples }
 */
export function sampleForReviewer({ subject, seed = 2026, sampleSize = 999, reviewerUid = '' }) {
  const normSubj = (subject || 'toan').toLowerCase();
  const fullPool = buildUnifiedSamplePool(true);

  // Lọc theo môn học và loại bỏ câu hỏi trùng lặp nội dung
  const subjectPool = dedupePoolQuestions(fullPool.filter(item => item.subject === normSubj));
  if (subjectPool.length === 0) {
    return {
      seed,
      subject: normSubj,
      sampleSize: 0,
      totalAvailable: 0,
      studentFlagsCount: 0,
      samples: []
    };
  }

  // 🛡️ ƯU TIÊN HÀNG ĐẦU: Các câu hỏi do học sinh gửi băn khoăn (student_flagged_for_teacher)
  const studentFlags = subjectPool.filter(item => item.isStudentFlag || item.sourceType === 'student_flagged_for_teacher');
  const normalPool = subjectPool.filter(item => !item.isStudentFlag && item.sourceType !== 'student_flagged_for_teacher');

  // Rút mẫu ngẫu nhiên bằng PRNG cố định seed cho tập câu hỏi thông thường
  const prng = createPrng(seed);
  const poolCopy = [...normalPool];

  // Fisher-Yates xáo trộn tập mẫu thông thường
  for (let i = poolCopy.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const temp = poolCopy[i];
    poolCopy[i] = poolCopy[j];
    poolCopy[j] = temp;
  }

  // Số lượng lấy (mặc định lấy hết toàn bộ câu hỏi của môn nếu không giới hạn)
  const maxNormalCount = sampleSize >= 900 ? poolCopy.length : Math.max(0, sampleSize - studentFlags.length);
  const selectedNormal = poolCopy.slice(0, maxNormalCount > 0 ? maxNormalCount : poolCopy.length);

  // Xáo thứ tự riêng cho từng Reviewer trên tập bình thường
  const reviewerSeed = (Number(seed) ^ hashString(reviewerUid || 'default_user')) >>> 0;
  const reviewerPrng = createPrng(reviewerSeed);
  for (let i = selectedNormal.length - 1; i > 0; i--) {
    const j = Math.floor(reviewerPrng() * (i + 1));
    const temp = selectedNormal[i];
    selectedNormal[i] = selectedNormal[j];
    selectedNormal[j] = temp;
  }

  // GHÉP LẠI: Câu hỏi do học sinh gửi LUÔN ĐỨNG ĐẦU TIÊN
  const selected = [...studentFlags, ...selectedNormal];

  // LÀM MÙ TOÀN BỘ (BLIND SANITIZATION):
  // 1. Ẩn model (không ghi Gemini, GPT, Claude, v.v.)
  // 2. Ẩn điều kiện RAG (không ghi RAG On/Off)
  // 3. Ẩn điểm cũ và preset score
  // 4. Giữ ID ổn định (sampleId) để ghép cặp so sánh
  const blindedSamples = selected.map((item, idx) => ({
    sampleId: item.sampleId,
    displayOrder: idx + 1,
    subject: item.subject,
    sourceType: item.sourceType,
    isStudentFlag: Boolean(item.isStudentFlag || item.sourceType === 'student_flagged_for_teacher'),
    studentNote: item.studentNote || '',
    studentName: item.studentName || 'Học sinh',
    grade: item.grade,
    topic: item.topic,
    difficulty: item.difficulty,
    question: item.question,
    systemResponse: cleanSystemResponse(item.systemResponse),
    referenceAnswer: item.referenceAnswer,
    sgkReference: item.sgkReference
  }));

  return {
    seed,
    subject: normSubj,
    sampleSize: blindedSamples.length,
    totalAvailable: subjectPool.length,
    studentFlagsCount: studentFlags.length,
    samples: blindedSamples
  };
}

/**
 * 🎓 Cơ chế sinh bộ mẫu mù dành riêng cho Giáo viên Toán từ output thật của thí nghiệm RAG:
 * - Mặc định chọn 10 câu Toán (10 câu x 2 điều kiện = 20 mục đánh giá, ước tính ~40 phút)
 * - Có thể cấu hình lên 15 câu (15 câu x 2 điều kiện = 30 mục đánh giá, ước tính ~60 phút)
 * - Mỗi câu trích xuất 2 câu trả lời (Condition 1: Không RAG / Condition 2: Có RAG)
 * - Lấy 1 lần chạy mỗi điều kiện (lần chạy 1)
 * - Xáo thứ tự ngẫu nhiên bằng seed
 * - Lưu ánh xạ giải mã bí mật tại server (không gửi client): reports/ablation/secret_mapping/math_teacher_blind_map.json
 */
export function generateMathTeacherBlindReviewSet({
  seed = 2026,
  mathQuestionsCount = 10,
  datasetFilePath = 'reports/ablation/ablation_dataset_100.v1.4.1.json',
  ablationSummaryPath = 'reports/ablation/ablation_summary.json',
  secretMappingDir = 'reports/ablation/secret_mapping'
} = {}) {
  let fullDatasetPath = path.resolve(process.cwd(), datasetFilePath);
  if (!fs.existsSync(fullDatasetPath)) {
    fullDatasetPath = path.resolve(process.cwd(), 'reports/ablation/ablation_dataset_100.json');
  }
  if (!fs.existsSync(fullDatasetPath)) {
    throw new Error(`Không tìm thấy file dataset 100 câu: ${fullDatasetPath}`);
  }
  const dataset = JSON.parse(fs.readFileSync(fullDatasetPath, 'utf8'));

  // 1. Lọc tất cả câu hỏi môn Toán
  const mathCases = (dataset.cases || []).filter(c => (c.subject || '').toLowerCase() === 'toan');
  const targetCount = Math.min(Math.max(1, mathQuestionsCount), mathCases.length);
  if (mathCases.length < targetCount) {
    throw new Error(`Không đủ ${targetCount} câu Toán trong dataset (chỉ có ${mathCases.length} câu)`);
  }

  // 2. Chọn ngẫu nhiên targetCount câu Toán bằng PRNG seed cố định
  const prng = createPrng(seed);
  const mathPool = [...mathCases];
  for (let i = mathPool.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const temp = mathPool[i];
    mathPool[i] = mathPool[j];
    mathPool[j] = temp;
  }
  const selectedMathCases = mathPool.slice(0, targetCount);

  // 3. Đọc dữ liệu câu trả lời thật từ thí nghiệm ablation (nếu đã chạy)
  const fullAblationPath = path.resolve(process.cwd(), ablationSummaryPath);
  let ablationResults = null;
  if (fs.existsSync(fullAblationPath)) {
    try {
      ablationResults = JSON.parse(fs.readFileSync(fullAblationPath, 'utf8'));
    } catch (_) {}
  }

  // 4. Ghép cặp targetCount câu x 2 điều kiện = targetCount * 2 mẫu (mặc định 20, cấu hình lên 30)
  const pairedItems = [];
  const secretMapping = [];

  selectedMathCases.forEach((qItem, qIdx) => {
    // Trích xuất phản hồi thực tế từ Condition 1 (Không RAG) & Condition 2 (Có RAG)
    let noRagResp = `[Chờ nạp dữ liệu chạy thật] Câu trả lời thực nghiệm Condition 1 (Không RAG) của câu hỏi ${qItem.id}.`;
    let ragResp = `[Chờ nạp dữ liệu chạy thật] Câu trả lời thực nghiệm Condition 2 (Có RAG + Guard) của câu hỏi ${qItem.id}.`;

    if (ablationResults) {
      const c1List = Array.isArray(ablationResults.condition_1_no_rag) ? ablationResults.condition_1_no_rag : [];
      const c1Match = c1List.find(r => r.case_id === qItem.id && r.run === 1);
      if (c1Match && c1Match.response) noRagResp = c1Match.response;

      const c2List = Array.isArray(ablationResults.condition_2_rag_guard) ? ablationResults.condition_2_rag_guard : [];
      const c2Match = c2List.find(r => r.case_id === qItem.id && r.run === 1);
      if (c2Match && c2Match.response) ragResp = c2Match.response;
    }

    // Điều kiện 1: Không RAG
    pairedItems.push({
      parentQuestionId: qItem.id,
      conditionKey: 'condition_1_no_rag',
      runIndex: 1,
      question: qItem.question,
      groundTruth: qItem.ground_truth,
      sgkSource: qItem.sgk_source || 'SGK GDPT 2018',
      response: cleanSystemResponse(noRagResp)
    });

    // Điều kiện 2: Có RAG
    pairedItems.push({
      parentQuestionId: qItem.id,
      conditionKey: 'condition_2_rag_guard',
      runIndex: 1,
      question: qItem.question,
      groundTruth: qItem.ground_truth,
      sgkSource: qItem.sgk_source || 'SGK GDPT 2018',
      response: cleanSystemResponse(ragResp)
    });
  });

  // 5. Xáo trộn ngẫu nhiên 30 mục đánh giá (ẩn hoàn toàn điều kiện RAG và thứ tự xuất hiện)
  const shufflePrng = createPrng(seed ^ 0x5a5a);
  for (let i = pairedItems.length - 1; i > 0; i--) {
    const j = Math.floor(shufflePrng() * (i + 1));
    const temp = pairedItems[i];
    pairedItems[i] = pairedItems[j];
    pairedItems[j] = temp;
  }

  // 6. Gán ID mù và tách bạch dữ liệu Client vs Server Secret Mapping
  const clientBlindedList = [];
  pairedItems.forEach((item, idx) => {
    const blindId = `MATH_BLIND_${String(idx + 1).padStart(2, '0')}`;
    
    // Giao diện giáo viên chỉ nhận các trường này (KHÔNG CÓ conditionKey, KHÔNG CÓ modelName):
    clientBlindedList.push({
      sampleId: blindId,
      displayIndex: idx + 1,
      subject: 'toan',
      grade: 12,
      topic: 'Đánh giá năng lực giải toán SGK GDPT 2018 (Thẩm định mù)',
      question: item.question,
      systemResponse: item.response,
      referenceAnswer: item.groundTruth,
      sgkReference: item.sgkSource
    });

    // Bản đồ giải mã bảo mật (LƯU TẠI SERVER, KHÔNG BAO GIỜ GỬI CHO GIÁO VIÊN):
    secretMapping.push({
      blindId,
      parentQuestionId: item.parentQuestionId,
      condition: item.conditionKey,
      runIndex: item.runIndex,
      groundTruth: item.groundTruth,
      sgkSource: item.sgkSource
    });
  });

  // 7. Lưu bản đồ giải mã bí mật tại server
  const fullSecretDir = path.resolve(process.cwd(), secretMappingDir);
  if (!fs.existsSync(fullSecretDir)) fs.mkdirSync(fullSecretDir, { recursive: true });
  const secretMapFilePath = path.join(fullSecretDir, 'math_teacher_blind_map.json');
  fs.writeFileSync(secretMapFilePath, JSON.stringify({
    generated_at: new Date().toISOString(),
    seed,
    total_items: secretMapping.length,
    selected_math_questions_count: selectedMathCases.length,
    is_live_data_populated: Boolean(ablationResults),
    mapping: secretMapping
  }, null, 2), 'utf8');

  return {
    seed,
    totalItems: clientBlindedList.length,
    selectedMathQuestionsCount: selectedMathCases.length,
    isLiveDataPopulated: Boolean(ablationResults),
    secretMapPath: secretMapFilePath,
    blindedSamplesForTeacher: clientBlindedList
  };
}

export default {
  createPrng,
  hashString,
  buildUnifiedSamplePool,
  sampleForReviewer,
  generateMathTeacherBlindReviewSet,
  cleanSystemResponse
};
