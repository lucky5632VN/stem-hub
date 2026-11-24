/**
 * 🛡️ STEM HUB LLM Response Post-Verification (Heuristic Verifier)
 * 
 * Bộ kiểm tra suy nghiệm (Heuristic Verifier) hậu xử lý câu trả lời của AI:
 * 1. Kiểm chứng mã định danh chunkId được dẫn chứng có thực sự tồn tại trong stem-corpus hay không.
 * 2. Rà soát các số liệu / công thức toán-lý-hóa trong câu trả lời đối chiếu với nội dung đoạn tri thức
 *    được truy xuất và các solver tính toán xác định.
 * 3. Gắn nhãn cảnh báo minh bạch nếu phát hiện thành phần chưa đối soát được.
 * 
 * ⚠️ LƯU Ý MINH BẠCH BẮT BUỘC:
 * Đây là cơ chế kiểm tra heuristic (dựa trên mẫu biểu thức và đối sánh từ khóa/chuỗi con),
 * KHÔNG bảo đảm tính toàn vẹn tuyệt đối 100%. Luôn khuyến cáo người học đối chiếu SGK chuẩn.
 */

import ragData from '../data/rag-vectors.json' with { type: 'json' };

const { corpus } = ragData;
const VALID_CORPUS_IDS = new Set((corpus || []).map(c => c.id));

// Danh sách các hằng số/số thông dụng không cần báo động (năm học, lớp, bullet, số nhỏ)
const BENIGN_NUMBERS = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '2018', '2025', '2026', '100']);

/**
 * Trả về nhãn nguồn chính xác và trung thực theo loại nguồn thực tế
 */
export function getSourceTypeLabel(sourceType) {
  if (sourceType === 'teacher_verified_stem') {
    return 'Lời giải chuẩn của Giáo viên THPT';
  }
  if (sourceType === 'team_summary') {
    return 'Bản tóm tắt do nhóm biên soạn theo chương trình GDPT 2018';
  }
  if (sourceType === 'textbook_excerpt') {
    return 'Trích đoạn SGK';
  }
  if (sourceType === 'learned_knowledge') {
    return 'Tri thức bổ trợ của học sinh (đã qua giáo viên duyệt)';
  }
  if (sourceType === 'student_flagged_for_teacher') {
    return 'Học sinh băn khoăn gửi giáo viên';
  }
  return 'Nguồn chưa xác định';
}

/**
 * Trích xuất danh sách chunkId được tham chiếu từ văn bản hoặc mảng đầu vào
 */
export function extractChunkIds(text = '', explicitIds = []) {
  const ids = new Set(Array.isArray(explicitIds) ? explicitIds.filter(Boolean) : []);
  if (!text || typeof text !== 'string') return Array.from(ids);

  // Regex tìm đoạn mã như: [Đoạn mã hoa-10-001], [Mã ID: toan-12-005], [chunkId: ly-11-010], hoa-10-001, hoặc ID tùy ý sau nhãn
  const patterns = [
    /(?:Đoạn mã|Mã ID|chunkId|id)[:\s]+([a-z0-9_-]+)/gi,
    /\b([a-z]{2,5}-\d{1,2}-\d{3})\b/gi
  ];

  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        ids.add(match[1].toLowerCase());
      }
    }
  }

  return Array.from(ids);
}

/**
 * Trích xuất các công thức toán học và số liệu quan trọng từ câu trả lời
 */
export function extractFormulasAndNumbers(text = '') {
  if (!text || typeof text !== 'string') return { formulas: [], numbers: [] };

  const formulas = [];
  const numbers = [];

  // Loại bỏ các chunkId (ví dụ hoa-10-001) trước khi quét số để không tách số trong ID
  const sanitizedForNum = text.replace(/\b[a-z]{2,5}-\d{1,2}-\d{3}\b/gi, ' ');

  // 1. Trích xuất LaTeX blocks $$...$$ hoặc inline $...$
  const latexRegex = /\$([^\$]+)\$/g;
  let match;
  while ((match = latexRegex.exec(text)) !== null) {
    const rawFormula = match[1].trim();
    if (rawFormula.length > 1 && !formulas.includes(rawFormula)) {
      formulas.push(rawFormula);
    }
  }

  // 2. Trích xuất phương trình dạng ký tự chữ (V = ..., x = ...)
  const eqRegex = /([A-Za-z_]{1,6}\s*=\s*[^,\n;.\$]{2,30})/g;
  while ((match = eqRegex.exec(text)) !== null) {
    const eq = match[1].trim();
    if (!formulas.includes(eq) && !eq.includes('http')) {
      formulas.push(eq);
    }
  }

  // 3. Trích xuất số thực, phân số hoặc số nguyên có ý nghĩa (bỏ qua số thứ tự nhỏ)
  const numRegex = /\b(\d+(?:[.,]\d+)+|\d+)\b/g;
  while ((match = numRegex.exec(sanitizedForNum)) !== null) {
    const num = match[1];
    if (!BENIGN_NUMBERS.has(num) && !numbers.includes(num)) {
      numbers.push(num);
    }
  }

  return { formulas, numbers };
}

/**
 * Hàm hậu kiểm suy nghiệm câu trả lời của AI đối chiếu với kho ngữ liệu truy xuất
 * 
 * @param {Object} params
 * @param {string} params.answerText Nội dung câu trả lời do LLM sinh ra
 * @param {Array<string>} params.citedChunkIds Danh sách chunkId được khai báo hoặc trích xuất
 * @param {Array<Object>} params.retrievedChunks Danh sách các chunk đã nạp vào prompt RAG
 * @param {Array<string|number>} params.deterministicFacts Các số liệu/công thức từ solver tính toán xác định
 * @returns {Object} Kết quả kiểm chứng chi tiết kèm cờ cảnh báo
 */
export function verifyResponseGrounding({
  answerText = '',
  citedChunkIds = [],
  retrievedChunks = [],
  deterministicFacts = []
} = {}) {
  const extractedIds = extractChunkIds(answerText, citedChunkIds);
  const validChunkIds = [];
  const invalidChunkIds = [];

  // 1. Kiểm chứng tính hợp lệ của chunkId đối với stem-corpus
  for (const id of extractedIds) {
    if (VALID_CORPUS_IDS.has(id)) {
      validChunkIds.push(id);
    } else {
      invalidChunkIds.push(id);
    }
  }

  // Tập hợp toàn bộ ngữ cảnh nguồn để đối chiếu chuỗi con
  const sourceTexts = retrievedChunks.map(c => `${c.id || ''} ${c.topic || ''} ${c.content || c.answer || ''}`).join(' ');
  const factsText = deterministicFacts.map(f => String(f)).join(' ');
  const combinedEvidenceText = `${sourceTexts} ${factsText}`;

  // 2. Trích xuất các công thức và số liệu trong câu trả lời
  const { formulas, numbers } = extractFormulasAndNumbers(answerText);
  const unverifiedElements = [];
  const verifiedElements = [];

  // Kiểm tra công thức
  for (const f of formulas) {
    // Làm sạch ký tự latex để so sánh chuỗi con mềm dẻo
    const cleanFormula = f.replace(/[\\{}]/g, '').replace(/\s+/g, '');
    const cleanEvidence = combinedEvidenceText.replace(/[\\{}]/g, '').replace(/\s+/g, '');

    if (cleanEvidence.includes(cleanFormula) || sourceTexts.includes(f) || factsText.includes(f)) {
      verifiedElements.push(f);
    } else {
      unverifiedElements.push(f);
    }
  }

  // Kiểm tra số liệu
  for (const n of numbers) {
    if (combinedEvidenceText.includes(n)) {
      verifiedElements.push(n);
    } else {
      unverifiedElements.push(n);
    }
  }

  const hasUnverifiedContent = unverifiedElements.length > 0 || invalidChunkIds.length > 0;
  const isGrounded = !hasUnverifiedContent && (retrievedChunks.length > 0 || deterministicFacts.length > 0);

  let warningMessage = null;
  if (invalidChunkIds.length > 0) {
    warningMessage = `⚠️ [Cảnh báo trích dẫn]: Mã ngữ liệu [${invalidChunkIds.join(', ')}] không tồn tại trong kho tri thức chuẩn stem-corpus.`;
  } else if (unverifiedElements.length > 0) {
    const sample = unverifiedElements.slice(0, 3).map(e => `"${e}"`).join(', ');
    warningMessage = `⚠️ Phần này chưa tìm thấy trong nguồn: Một số công thức hoặc số liệu (${sample}) không có trong đoạn ngữ liệu được nạp. Đây là kiểm tra suy nghiệm (heuristic), không bảo đảm tính toàn vẹn tuyệt đối. Hãy đối chiếu sách giáo khoa hoặc hỏi thầy cô.`;
  }

  return {
    isGrounded,
    hasUnverifiedContent,
    extractedIds,
    validChunkIds,
    invalidChunkIds,
    verifiedElements,
    unverifiedElements,
    warningMessage,
    heuristicCheck: true,
    verificationNotice: 'Kiểm tra suy nghiệm (heuristic checking) hỗ trợ cảnh báo sớm, không bảo đảm loại trừ sai sót tuyệt đối.'
  };
}
