/**
 * STEM HUB - UNIFIED LAB AI CONTINUOUS LEARNING BRIDGE
 * Cầu nối Trí tuệ Nhân tạo Tự học & Đồng bộ Tri thức cho 5 Bot trong 4 Phòng Lab
 * Giúp các bot trong lab hoạt động thông minh, tra cứu tri thức tự học (Cache Hit 0đ)
 * và tự động lưu câu trả lời mới vào hệ sinh thái STEM HUB giống hệt Trợ lý NOVA.
 */

(function (root, factory) {
  const exported = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = exported;
  }
  if (typeof define === 'function' && define.amd) {
    define([], () => exported);
  }
  const globalTarget = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : root));
  if (globalTarget) {
    globalTarget.StemLabAIBridge = exported;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this), function () {

  const CACHE_KEY = 'stem_learned_knowledge_cache';
  const CACHE_TIME_KEY = 'stem_learned_knowledge_timestamp';
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút làm mới danh mục tri thức

  // Cờ cấu hình vô hiệu hóa cache (QA Automation / Test Mode)
  // Khi bật, ép toàn bộ hệ sinh thái luôn gọi API thật, không tra cứu cache
  let BYPASS_CACHE = true;

  function isErrorResponse(text, status) {
    // Nếu HTTP Status không phải 200 (hoặc trong dải 200-299) -> xem như lỗi
    if (status !== undefined && status !== null && (Number(status) < 200 || Number(status) >= 300)) return true;
    if (!text || typeof text !== 'string') return true;
    const t = text.toLowerCase().trim();
    if (t.length < 5) return true;

    // Danh sách từ khóa báo lỗi / gián đoạn
    const errorKeywords = [
      'sự cố', 'rất tiếc', 'error', 'gián đoạn', 'kết nối', 'không thể kết nối',
      'vui lòng thử lại', 'vui lòng hỏi lại', 'lỗi khi xử lý', 'gemini api error',
      'thiếu api key', 'failed to fetch', 'máy chủ ai', 'tất cả mô hình gemini đều bận',
      'user location is not supported', 'trợ lý ngoại tuyến', '400 bad request',
      '500 internal', 'http 500', 'http 400', 'http 429', 'http 503',
      'edge_tutor_html_error', 'quota', 'resourceexhausted', 'rate limit',
      'overloaded', 'unregistered callers'
    ];

    return errorKeywords.some(kw => t.includes(kw));
  }

  // Bộ stopwords tiếng Việt cơ bản để tính toán độ tương đồng từ khóa
  const STOP_WORDS = new Set([
    'là', 'gì', 'như', 'thế', 'nào', 'của', 'và', 'các', 'những', 'cho', 'với',
    'trong', 'được', 'có', 'không', 'khi', 'để', 'về', 'hãy', 'bạn', 'tôi',
    'em', 'cho', 'biết', 'giải', 'thích', 'ạ', 'nhé', 'giúp', 'với'
  ]);

  function normalizeText(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFC')
      .replace(/[.,?!:;'"()\[\]{}\\/<>~`@#$%^&*_=+|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function extractTokens(text) {
    const norm = normalizeText(text);
    return norm
      .split(' ')
      .map(w => w.trim())
      .filter(w => w.length > 1 && !STOP_WORDS.has(w));
  }

  // Thuật toán đo tương đồng Jaccard + N-Gram Weighted Overlap
  function computeSimilarity(query, target) {
    const qNorm = normalizeText(query);
    const tNorm = normalizeText(target);

    // Trùng khớp hoàn toàn
    if (qNorm === tNorm) return 1.0;
    if (tNorm.includes(qNorm) || qNorm.includes(tNorm)) {
      const lenRatio = Math.min(qNorm.length, tNorm.length) / Math.max(qNorm.length, tNorm.length);
      if (lenRatio > 0.6) return 0.85 + (lenRatio * 0.15);
    }

    const qTokens = extractTokens(query);
    const tTokens = extractTokens(target);

    if (qTokens.length === 0 || tTokens.length === 0) return 0;

    const qSet = new Set(qTokens);
    const tSet = new Set(tTokens);

    let intersectionCount = 0;
    qSet.forEach(token => {
      if (tSet.has(token)) intersectionCount++;
    });

    const unionCount = new Set([...qTokens, ...tTokens]).size;
    if (unionCount === 0) return 0;

    const jaccard = intersectionCount / unionCount;
    // Overlap theo độ dài câu hỏi của học sinh
    const overlapWithQuery = intersectionCount / qSet.size;

    return (jaccard * 0.4) + (overlapWithQuery * 0.6);
  }

  // Tải danh sách tri thức đã học từ server / API / localStorage
  async function fetchLearnedDocs(forceRefresh = false) {
    try {
      const now = Date.now();
      const lastTime = parseInt(localStorage.getItem(CACHE_TIME_KEY) || '0', 10);
      const cached = localStorage.getItem(CACHE_KEY);

      if (!forceRefresh && cached && (now - lastTime < CACHE_TTL_MS)) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (_) {}
      }

      // Thử tải qua API chính thức của Next.js
      try {
        const res = await fetch(`/api/learned-knowledge?t=${now}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
          const data = await res.json();
          const docs = Array.isArray(data.learnedDocs) ? data.learnedDocs : (Array.isArray(data) ? data : []);
          if (docs.length > 0) {
            localStorage.setItem(CACHE_KEY, JSON.stringify(docs));
            localStorage.setItem(CACHE_TIME_KEY, now.toString());
            return docs;
          }
        }
      } catch (_) {}

      // Dự phòng tĩnh: Tải trực tiếp từ /data/global-learned-knowledge.json
      try {
        const staticRes = await fetch(`/data/global-learned-knowledge.json?t=${now}`);
        if (staticRes.ok) {
          const staticDocs = await staticRes.json();
          if (Array.isArray(staticDocs) && staticDocs.length > 0) {
            localStorage.setItem(CACHE_KEY, JSON.stringify(staticDocs));
            localStorage.setItem(CACHE_TIME_KEY, now.toString());
            return staticDocs;
          }
        }
      } catch (_) {}
    } catch (err) {
      console.warn('[StemLabAIBridge] Không thể fetch tri thức, sử dụng local cache:', err.message);
    }

    // Fallback: Lấy từ localStorage nếu fetch thất bại
    try {
      const local = localStorage.getItem(CACHE_KEY);
      if (local) return JSON.parse(local);
    } catch (_) {}

    return [];
  }

  /**
   * 1. Kiểm tra câu hỏi trong kho tri thức AI tự học (RAG Cache Hit)
   * @param {string} userQuery - Câu hỏi của học sinh
   * @param {string} subject - 'hoa' | 'ly' | 'sinh' | 'toan' | 'stem'
   * @param {number} threshold - Ngưỡng tương đồng (mặc định 0.68)
   * @returns {Promise<{ hit: boolean, answer?: string, score?: number, topic?: string, query?: string }>}
   */
  
  const SUBJECT_DEFINITIONS = {
    toan: {
      name: 'Toán học',
      labName: 'phòng thí nghiệm Toán học 3D',
      keywords: [
        'lăng trụ', 'lang tru', 'hình chóp', 'hinh chop', 'hình hộp', 'hinh hop', 'thể tích', 'the tich',
        'diện tích', 'dien tich', 'hình nón', 'hinh non', 'hình trụ', 'hinh tru', 'mặt cầu', 'mat cau',
        'tứ diện', 'tu dien', 'tam giác', 'tam giac', 'vector', 'vecto', 'tọa độ', 'toa do', 'oxyz',
        'đạo hàm', 'dao ham', 'tích phân', 'tich phan', 'nguyên hàm', 'nguyen ham', 'khảo sát hàm số',
        'cực trị', 'cuc tri', 'tiệm cận', 'tiem can', 'xác suất', 'xac suat', 'biến cố', 'tổ hợp', 'chỉnh hợp',
        'số phức', 'so phuc', 'logarit', 'lũy thừa', 'luỹ thừa', 'phương trình bậc', 'hệ phương trình',
        'bất phương trình', 'lượng giác', 'sin', 'cos', 'tan', 'cotan', 'đồ thị hàm số'
      ]
    },
    ly: {
      name: 'Vật lý',
      labName: 'phòng thí nghiệm Vật lý Ảo',
      keywords: [
        'con lắc', 'con lac', 'dao động điều hòa', 'dao dong', 'chu kỳ', 'chu ky', 'tần số', 'tan so',
        'vận tốc', 'gia tốc', 'quãng đường', 'rơi tự do', 'lực ma sát', 'lực hấp dẫn', 'định luật newton',
        'động năng', 'thế năng', 'cơ năng', 'công suất', 'áp suất', 'nhiệt lượng', 'nhiệt độ',
        'khí lý tưởng', 'sóng cơ', 'bước sóng', 'giao thoa sóng', 'sóng dừng', 'âm học',
        'điện trường', 'điện tích', 'hiệu điện thế', 'cường độ dòng điện', 'định luật ôm', 'dinh luat om',
        'điện trở', 'ampe kế', 'vôn kế', 'mạch rlc', 'từ trường', 'cảm ứng từ', 'lực từ', 'lực lorentz',
        'quang hình', 'khúc xạ', 'phản xạ', 'thấu kính', 'lăng kính', 'quang điện', 'hạt nhân', 'phóng xạ'
      ]
    },
    hoa: {
      name: 'Hóa học',
      labName: 'phòng thí nghiệm Hóa học Ảo',
      keywords: [
        'phản ứng', 'phan ung', 'hóa học', 'chất kết tủa', 'ket tua', 'axit', 'bazơ', 'bazo', 'muối',
        'oxit', 'bảng tuần hoàn', 'kim loại', 'phi kim', 'kiềm', 'ancol', 'rượu', 'este', 'xà phòng hóa',
        'lipit', 'chất béo', 'glucozơ', 'saccarozơ', 'tinh bột', 'xenlulozơ', 'cacbohidrat',
        'amin', 'amino axit', 'peptit', 'protein', 'polime', 'ankan', 'anken', 'ankin',
        'benzen', 'phenol', 'andehit', 'axit axetic', 'hcl', 'h2so4', 'naoh', 'caco3',
        'điện phân', 'ăn mòn kim loại', 'nồng độ mol', 'dung dịch', 'ống nghiệm', 'quỳ tím', 'phenolphtalein'
      ]
    },
    sinh: {
      name: 'Sinh học',
      labName: 'phòng thí nghiệm Sinh học Ảo',
      keywords: [
        'tế bào', 'te bao', 'màng sinh chất', 'ti thể', 'lục lạp', 'nhân tế bào',
        'adn', 'arn', 'dna', 'rna', 'gen', 'alen', 'nhiễm sắc thể', 'nst', 'nuclêôtit',
        'nhân đôi', 'tái bản', 'phiên mã', 'dịch mã', 'đột biến', 'nguyên phân', 'giảm phân',
        'giao tử', 'hợp tử', 'menđen', 'menden', 'quy luật di truyền', 'sơ đồ lai', 'f1', 'f2',
        'hoán vị gen', 'liên kết gen', 'di truyền quần thể', 'hardy-weinberg', 'tiến hóa',
        'chọn lọc tự nhiên', 'sinh thái', 'quang hợp', 'hô hấp tế bào', 'chuỗi thức ăn',
        'hệ sinh thái', 'thoát hơi nước', 'tuần hoàn máu', 'tiêu hóa'
      ]
    }
  };

  /**
   * Kiểm tra ranh giới môn học của câu hỏi đối với phòng Lab hiện tại.
   * Nếu câu hỏi rõ ràng thuộc môn khác, từ chối lịch sự và hướng dẫn sang phòng lab phù hợp.
   */
  function checkSubjectBoundary(userQuery, labSubject = 'stem') {
    const normSubj = (labSubject || 'stem').toLowerCase();
    if (normSubj === 'stem' || !SUBJECT_DEFINITIONS[normSubj]) {
      return { allowed: true };
    }

    const currentDef = SUBJECT_DEFINITIONS[normSubj];
    const cleanQ = normalizeText(userQuery);

    // Bỏ qua kiểm tra với các câu hỏi chào hỏi, giao tiếp chung ngắn gọn
    const isGreeting = /^(chào|xin chào|hello|hi|bạn là ai|giới thiệu|hướng dẫn|chức năng|giúp tôi|cứu|help|test)/i.test(cleanQ);
    if (isGreeting && cleanQ.split(' ').length <= 6) {
      return { allowed: true };
    }

    // Đếm số từ khóa khớp với môn hiện tại
    let currentMatches = 0;
    for (const kw of currentDef.keywords) {
      if (cleanQ.includes(kw)) {
        currentMatches++;
      }
    }

    // Đếm số từ khóa khớp với các môn khác
    let highestOtherMatches = 0;
    let otherSubjKey = null;

    for (const [subjKey, def] of Object.entries(SUBJECT_DEFINITIONS)) {
      if (subjKey === normSubj) continue;
      let matches = 0;
      for (const kw of def.keywords) {
        if (cleanQ.includes(kw)) {
          matches++;
        }
      }
      if (matches > highestOtherMatches) {
        highestOtherMatches = matches;
        otherSubjKey = subjKey;
      }
    }

    // Nếu câu hỏi hoàn toàn không có từ khóa môn này, nhưng lại khớp rõ rệt môn khác
    if (currentMatches === 0 && highestOtherMatches >= 1 && otherSubjKey) {
      const otherDef = SUBJECT_DEFINITIONS[otherSubjKey];
      return {
        allowed: false,
        otherSubject: otherSubjKey,
        otherSubjectName: otherDef.name,
        refusal: `Tôi là Chuyên gia AI chuyên sâu môn ${currentDef.name} của STEM HUB. Tôi chỉ giải đáp các kiến thức, bài tập và thí nghiệm thuộc phạm vi môn ${currentDef.name}. Đối với câu hỏi về môn ${otherDef.name}, bạn vui lòng chuyển sang ${otherDef.labName} để được hỗ trợ chuyên sâu và mô phỏng trực quan tốt nhất nhé!`
      };
    }

    return { allowed: true };
  }

  async function checkLabLearnedCache(userQuery, subject = 'stem', threshold = 0.68, options = {}) {
    if (BYPASS_CACHE || options.bypassCache) {
      console.log(`⚡ [StemLabAIBridge] Cache bypass ACTIVE (QA Mode: bypassCache=true) -> Bỏ qua cache, luôn gọi API thật cho: "${userQuery}"`);
      return { hit: false, bypassed: true };
    }
    if (!userQuery || userQuery.trim().length < 3) return { hit: false };

    const docs = await fetchLearnedDocs();
    if (!docs || docs.length === 0) return { hit: false };

    let bestScore = 0;
    let bestItem = null;

    const normSubj = (subject || 'stem').toLowerCase();

    for (const doc of docs) {
      if (!doc || !doc.query || !doc.answer) continue;

      const docSubj = (doc.subject || 'stem').toLowerCase();
      // Chế độ chuyên sâu từng môn: CHỈ lấy đúng tri thức của môn phòng lab đó (tuyệt đối không lấy chéo môn)
      if (normSubj !== 'stem' && docSubj !== normSubj) {
        continue;
      }

      const subjectBonus = (docSubj === normSubj) ? 0.08 : 0;
      const sim = computeSimilarity(userQuery, doc.query);
      const finalScore = Math.min(1.0, sim + subjectBonus);

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestItem = doc;
      }
    }

    if (bestItem && bestScore >= threshold) {
      if (isErrorResponse(bestItem.answer)) {
        console.warn(`⚠️ [StemLabAIBridge] Bỏ qua câu trả lời lỗi trong cache: "${bestItem.query}"`);
        return { hit: false, bestScore: 0 };
      }
      console.log(`⚡ [StemLabAIBridge] CACHE HIT! Độ tương đồng: ${(bestScore * 100).toFixed(1)}% cho câu hỏi: "${userQuery}"`);
      return {
        hit: true,
        answer: cleanAIMarkers(bestItem.answer),
        score: bestScore,
        topic: bestItem.topic || 'Tri thức tự học AI',
        matchedQuery: bestItem.query
      };
    }

    return { hit: false, bestScore };
  }

  /**
   * 2. Lưu câu trả lời mới vào kho tri thức AI tự học toàn hệ thống
   * @param {string} userQuery - Câu hỏi
   * @param {string} aiAnswer - Câu trả lời vừa sinh từ AI
   * @param {string} subject - Môn học ('hoa' | 'ly' | 'sinh' | 'toan')
   * @param {string} labTitle - Tên phòng lab
   */
  async function saveLabLearnedAnswer(userQuery, aiAnswer, subject = 'stem', labTitle = 'Lab ảo STEM', httpStatus = 200) {
    if (BYPASS_CACHE) {
      console.log(`[StemLabAIBridge] Bỏ qua lưu tri thức do BYPASS_CACHE = true: "${userQuery?.trim()}"`);
      return false;
    }
    if (!userQuery || !aiAnswer) return false;

    // TUYỆT ĐỐI KHÔNG LƯU NẾU HTTP STATUS KHÁC 200 HOẶC CHỨA TỪ KHÓA BÁO LỖI
    if (httpStatus && (Number(httpStatus) < 200 || Number(httpStatus) >= 300)) {
      console.warn(`[StemLabAIBridge] TUYỆT ĐỐI KHÔNG LƯU CACHE do HTTP Status = ${httpStatus}`);
      return false;
    }

    const cleanQ = userQuery.trim();
    const cleanA = aiAnswer.trim();

    if (cleanQ.length < 3 || cleanA.length < 10) return false;

    if (isErrorResponse(cleanA, httpStatus)) {
      console.warn('[StemLabAIBridge] TUYỆT ĐỐI KHÔNG LƯU CACHE do câu trả lời chứa thông báo lỗi / sự cố:', cleanA.substring(0, 60));
      return false;
    }

    const docId = `lab_learned_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const payload = {
      id: docId,
      query: cleanQ,
      normalizedQuery: normalizeText(cleanQ),
      answer: cleanA,
      subject: (subject || 'stem').toLowerCase(),
      topic: `${labTitle} - Tự học AI`,
      createdAt: new Date().toISOString()
    };

    // 1. Cập nhật ngay vào localStorage của trình duyệt
    try {
      const cachedStr = localStorage.getItem(CACHE_KEY);
      const list = cachedStr ? JSON.parse(cachedStr) : [];
      list.unshift(payload);
      if (list.length > 5000) list.pop();
      localStorage.setItem(CACHE_KEY, JSON.stringify(list));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (_) {}

    // 2. Đẩy lên Server API để lưu vĩnh viễn vào Firestore / file global-learned-knowledge.json
    try {
      fetch('/api/learned-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(res => {
        if (res.ok) {
          console.log(`🧠 [StemLabAIBridge] Đã nạp thành công câu hỏi mới vào Tri thức AI toàn hệ thống: "${cleanQ}"`);
        }
      }).catch(err => {
        console.warn('[StemLabAIBridge] Lỗi gửi POST /api/learned-knowledge:', err.message);
      });
    } catch (_) {}

    // 3. Thông báo cho trang cha (nếu lab nằm trong Iframe)
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'STEM_LEARNED_KNOWLEDGE_SAVED',
          payload: payload
        }, '*');
      }
    } catch (_) {}

    return true;
  }

  /**
   * 3. Ghi log hoạt động suy luận thời gian thực về màn hình Admin Audit Log HUD
   * @param {Object} logData - Dữ liệu nhật ký suy luận
   */
  async function logLabReasoning(logData) {
    try {
      const payload = {
        query: logData.query || '',
        userDisplayName: logData.userDisplayName || 'Học sinh',
        userEmail: logData.userEmail || 'student@stemhub.edu.vn',
        currentPage: logData.labTitle || 'Phòng Thí Nghiệm Ảo',
        intent: logData.intent || 'lab_assistant',
        subject: (logData.subject || 'stem').toUpperCase(),
        ragTopTopic: logData.topic || 'Tri thức tự học AI',
        ragScore: logData.score || 0.85,
        isCacheHit: !!logData.isCacheHit,
        aiResponseText: (logData.aiResponseText || '').slice(0, 250),
        actionTriggered: logData.actionTriggered || null
      };

      fetch('/api/ai-reasoning-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});

      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'STEM_REASONING_LOG',
          payload: payload
        }, '*');
      }
    } catch (_) {}
  }

  /**
   * 4. Tự động nạp KaTeX cục bộ không phụ thuộc CDN bên ngoài
   */
  function ensureKaTeXLoaded() {
    if (typeof document === 'undefined') return;

    if (!document.getElementById('stem-shared-katex-css')) {
      const link = document.createElement('link');
      link.id = 'stem-shared-katex-css';
      link.rel = 'stylesheet';
      link.href = '/labs/shared/katex/katex.min.css';
      document.head.appendChild(link);
    }

    if (!window.katex && !document.getElementById('stem-shared-katex-js')) {
      const script = document.createElement('script');
      script.id = 'stem-shared-katex-js';
      script.src = '/labs/shared/katex/katex.min.js';
      script.async = false;
      document.head.appendChild(script);
    }
  }

  /**
   * 5. Xóa bỏ hoàn toàn "dấu vết" AI:
   * - Xóa các lời chào robot ("Chào bạn", "Tôi là AI...", "Thầy là...", "Dưới đây là...")
   * - Xóa lời kết sáo rỗng ("Chúc bạn học tốt", "Hy vọng câu trả lời...", "Nếu còn thắc mắc...")
   * - Xóa sạch các ký tự markdown thừa, raw json action blocks
   */
  function cleanAIMarkers(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';

    const original = rawText.trim();
    if (!original) return '';

    let text = original;

    // 1. Xóa các khối JSON Action ngầm hoặc code block thừa nếu có
    text = text.replace(/```(?:json)?[\s\S]*?```/gi, '').trim();
    text = text.replace(/\{[\s\S]*?"action"\s*:\s*[\s\S]*?\}/gi, '').trim();

    // 2. Chỉ xóa câu chào robot mở đầu khi CÒN nội dung giải đáp phía sau (> 8 ký tự)
    const withoutIntro = text
      .replace(/^(?:(?:xin\s+)?chào(?:\s+(?:bạn|em|thầy|cô|học\s+sinh|mọi\s+người))?[!.,:;~-]?\s*)+/gi, '')
      .replace(/^(?:(?:thầy|tôi|mình|chúng\s+tôi)?\s*rất\s+vui\s+được\s+[^.!?\n]{2,80}[.!?,;:]\s*)+/gi, '')
      .replace(/^(?:(?:tôi|mình|thầy|trợ\s+lý)\s+là\s+[^.!?,;\n]{2,60}[.!?,;]\s*)+/gi, '')
      .replace(/^(?:chào\s+mừng(?:\s+bạn|\s+em)?\s+đến\s+với\s+[^.!?,;\n]{2,60}[.!?,;]\s*)+/gi, '')
      .replace(/^(?:dưới\s+đây\s+là\s+(?:tóm\s+tắt|câu\s+trả\s+lời|hướng\s+dẫn|lời\s+giải)[^:\n]*:\s*)+/gi, '')
      .replace(/^(?:rất\s+vui\s+được\s+hỗ\s+trợ\s+[^.!?,;\n]{2,50}[.!?,;]\s*)+/gi, '')
      .replace(/^(?:tôi\s+có\s+thể\s+giúp\s+gì\s+cho\s+[^.!?,;\n]{2,50}[?!.,;]\s*)+/gi, '')
      .trim();

    if (withoutIntro.length >= 8) {
      text = withoutIntro;
    }

    // 3. Xóa các câu kết sáo rỗng ở cuối nếu còn nội dung chính
    const withoutOutro = text.replace(/(?:chúc\s+(?:bạn|em)\s+học\s+tốt[!.]?|hy\s+vọng\s+[^.!?\n]{5,80}[.!]?|nếu\s+(?:bạn|em)\s+còn\s+thắc\s+mắc[^.!?\n]{5,100}[.!]?|hãy\s+hỏi\s+(?:tôi|thầy)[^.!?\n]{5,60}[.!]?)\s*$/gi, '').trim();

    if (withoutOutro.length >= 8) {
      text = withoutOutro;
    }

    // Tuyệt đối bảo vệ: không bao giờ để tin nhắn bị trắng rỗng
    return text.trim() || original;
  }

  /**
   * Định dạng tin nhắn người dùng:
   * - Bảo toàn 100% câu chữ, lời chào, thắc mắc của học sinh (tuyệt đối KHÔNG xóa dấu vết hay lời chào)
   * - Chống XSS an toàn
   * - Hỗ trợ KaTeX nội dòng $...$ nếu học sinh nhập công thức toán/lý/hóa
   * - Đảm bảo khung chat luôn đầy đủ nội dung, không bị co nhỏ thành chấm xanh rỗng
   */
  function formatUserMessage(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';
    let text = rawText.trim();
    if (!text) return '&nbsp;';

    // An toàn XSS trước
    text = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Hỗ trợ hiển thị công thức toán/lý nếu học sinh gõ $...$ hoặc $$...$$
    const mathTokens = [];
    const pushMath = (mathStr) => {
      let f = mathStr.trim();
      if (!f) return '';
      let html = '';
      if (typeof window !== 'undefined' && window.katex && typeof window.katex.renderToString === 'function') {
        try {
          html = window.katex.renderToString(f, { displayMode: false, throwOnError: false });
        } catch (_) {
          html = `<span style="font-weight:600;color:#93c5fd;">${f}</span>`;
        }
      } else {
        html = `<span style="font-weight:600;color:#93c5fd;">${f}</span>`;
      }
      const tok = `###USER_MATH_${mathTokens.length}###`;
      mathTokens.push(html);
      return tok;
    };

    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => pushMath(m));
    text = text.replace(/\$([^\$\n]+?)\$/g, (_, m) => pushMath(m));

    // Xuống dòng
    text = text.replace(/\n/g, '<br/>');

    // Khôi phục tokens
    mathTokens.forEach((tokHtml, i) => {
      text = text.replace(`###USER_MATH_${i}###`, tokHtml);
    });

    return text;
  }

  /**
   * 6. Render chuẩn LaTeX & định dạng văn bản súc tích không lỗi ký hiệu
   * @param {string} rawText - Chuỗi phản hồi từ AI
   * @returns {string} - Chuỗi HTML sạch sẽ, công thức KaTeX chuẩn xác
   */
  function formatAIFormulaText(rawText) {
    if (!rawText) return '';
    let text = cleanAIMarkers(rawText);

    // Auto-repair pseudo-LaTeX before KaTeX parsing
    text = text.replace(/\x0c/g, '\\f').replace(/\x08/g, '\\b');
    text = text.replace(/\n\s*(\\cdot|·)\s*\n/g, ' \\cdot ');
    text = text.replace(/=\s*\n\s*/g, ' = ');
    text = text.replace(/\n\s*(\\cdot|·)\s*/g, ' \\cdot ');

    text = text.replace(/\b(?:\\?frac)\s+([a-zA-Z0-9^]+(?:\s*(?:\\?sqrt|√)\s*[0-9a-zA-Z^]+)?)\s+(\d+)\b/g, (_match, num, den) => {
      const cleanNum = num
        .replace(/(?:\\?sqrt|√)\s*(\d+)/g, '\\sqrt{$1}')
        .replace(/(?<!\\)sqrt/g, '\\sqrt');
      return `\\frac{${cleanNum}}{${den}}`;
    });

    text = text.replace(/\b(?:\\?frac)\s+([a-zA-Z0-9^]+)\s+([a-zA-Z0-9^]+)\b/g, (_match, num, den) => {
      return `\\frac{${num}}{${den}}`;
    });

    text = text.replace(/(?<!\\)\bsqrt\s+([A-Za-z0-9'^]+(?:\s*[-+]\s*[A-Za-z0-9'^]+)+)\b/g, '\\sqrt{$1}');
    text = text.replace(/(?<!\\)\bsqrt\s+([a-zA-Z0-9^]+(?:\s*[-+]\s*\\frac\{[^}]+\}\{[^}]+\}))/g, '\\sqrt{$1}');
    text = text.replace(/(?<!\\)\bsqrt\s*(\d+)/g, '\\sqrt{$1}');
    text = text.replace(/(?<!\\)\bsqrt\{([^{}]+)\}/g, '\\sqrt{$1}');

    text = text.replace(/(?<!\\)\bfrac\{/g, '\\frac{');
    text = text.replace(/(?<!\\)\bsqrt\{/g, '\\sqrt{');
    text = text.replace(/(?<!\\)\bcdot\b/g, '\\cdot');
    text = text.replace(/(?<!\\)\bDelta\b/g, '\\Delta');

    text = text.replace(/^((?:[A-Za-z0-9'_]+|V|S|A'G)\s*=\s*[\s\S]+?)$/gm, (line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('$') || trimmed.startsWith('$$') || trimmed.startsWith('<') || trimmed.startsWith('#') || trimmed.startsWith('*') || trimmed.startsWith('-')) {
        return line;
      }
      if (/(\\frac|\\sqrt|\\cdot|·|\^|=|\\Delta|Δ)/.test(trimmed)) {
        return `$$${trimmed}$$`;
      }
      return line;
    });

    // Mảng bảo vệ các khối KaTeX đã render
    const katexTokens = [];
    const pushKaTeX = (latex, isDisplay = false) => {
      let formula = (latex || '').trim();
      if (!formula) return '';

      // Tiền xử lý công thức: làm sạch ký hiệu LaTeX tiếng Việt hoặc lỗi gõ
      formula = formula
        .replace(/\\rightarrow/g, ' \\to ')
        .replace(/\\rightleftharpoons/g, ' \\rightleftharpoons ')
        .replace(/-->|->/g, ' \\to ')
        .replace(/<=>|<==>/g, ' \\rightleftharpoons ');

      let renderedHtml = '';
      if (typeof window !== 'undefined' && window.katex && typeof window.katex.renderToString === 'function') {
        try {
          renderedHtml = window.katex.renderToString(formula, {
            displayMode: isDisplay,
            throwOnError: false,
            strict: 'ignore'
          });
        } catch (e) {
          renderedHtml = isDisplay ? `<div class="katex-fallback" style="margin:6px 0;text-align:center;font-weight:600;">${formula}</div>` : `<span class="katex-fallback" style="font-weight:600;">${formula}</span>`;
        }
      } else {
        // Fallback nhẹ khi KaTeX chưa kịp nạp
        const cleanUni = formula
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
          .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
          .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
          .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
          .replace(/\\pi/g, 'π')
          .replace(/\\times/g, '×')
          .replace(/\\cdot/g, '·')
          .replace(/\\to/g, '→');
        renderedHtml = isDisplay ? `<div style="margin:4px 0;text-align:center;color:#38bdf8;">${cleanUni}</div>` : `<span style="color:#38bdf8;font-weight:600;">${cleanUni}</span>`;
      }

      const token = `###STEM_KATEX_${katexTokens.length}###`;
      katexTokens.push(renderedHtml);
      return token;
    };

    // a. Render Display Math: $$...$$ và \[...\]
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, p1) => pushKaTeX(p1, true));
    text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_, p1) => pushKaTeX(p1, true));

    // b. Render Inline Math: $...$ và \(...\)
    text = text.replace(/\\\(([\s\S]+?)\\\)/g, (_, p1) => pushKaTeX(p1, false));
    text = text.replace(/\$([^\$\n]+?)\$/g, (_, p1) => pushKaTeX(p1, false));

    // c. Xử lý các công thức phân số chưa bọc đô la như \frac{a}{b} hoặc \dfrac{a}{b}
    text = text.replace(/\\d?frac\{([^}]+)\}\{([^}]+)\}/g, (match, n, d) => pushKaTeX(`\\frac{${n}}{${d}}`, false));
    text = text.replace(/\\sqrt\{([^}]+)\}/g, (match, r) => pushKaTeX(`\\sqrt{${r}}`, false));

    // d. Xử lý các mũi tên phản ứng và ký hiệu phổ biến còn sót
    text = text
      .replace(/-->|->/g, ' → ')
      .replace(/<=>|<==>/g, ' ⇌ ')
      .replace(/Delta\s*H/gi, 'ΔH')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\pi/g, 'π')
      .replace(/\\times/g, '×')
      .replace(/\\cdot/g, '·');

    // e. Markdown headers & bold
    text = text
      .replace(/^###\s+(.+)$/gm, '<h4 style="font-size:0.9rem;font-weight:700;color:#38bdf8;margin:6px 0 2px;">$1</h4>')
      .replace(/^##\s+(.+)$/gm, '<h3 style="font-size:0.95rem;font-weight:700;color:#38bdf8;margin:8px 0 3px;">$1</h3>')
      .replace(/^#\s+(.+)$/gm, '<h2 style="font-size:1rem;font-weight:700;color:#38bdf8;margin:10px 0 4px;">$1</h2>')
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:0.88em;color:#38bdf8;">$1</code>');

    // f. Bullet items
    text = text.replace(/^[\-\*•]\s+(.+)$/gm, '<li style="margin:2px 0;list-style-type:disc;list-style-position:inside;">$1</li>');

    // g. Xóa triệt để các dấu sao thô thừa do AI tạo ra (* đơn lẻ)
    text = text.replace(/\*/g, '');

    // h. Ngắt dòng
    text = text.replace(/\n\n+/g, '<br/><br/>').replace(/\n/g, '<br/>');

    // i. Phục hồi KaTeX tokens
    katexTokens.forEach((tokenHtml, idx) => {
      text = text.replace(`###STEM_KATEX_${idx}###`, tokenHtml);
    });

    return text;
  }

  // Khởi chạy ngầm tải danh mục tri thức & KaTeX
  if (typeof window !== 'undefined') {
    ensureKaTeXLoaded();
    setTimeout(() => {
      fetchLearnedDocs().catch(() => {});
    }, 1000);
  }

  return {
    checkLabLearnedCache,
    checkSubjectBoundary,
    SUBJECT_DEFINITIONS,
    saveLabLearnedAnswer,
    logLabReasoning,
    fetchLearnedDocs,
    ensureKaTeXLoaded,
    cleanAIMarkers,
    formatAIFormulaText,
    formatUserMessage,
    isErrorResponse,
    setBypassCache: (val) => {
      BYPASS_CACHE = !!val;
      console.log(`[StemLabAIBridge] Cache bypass set to: ${BYPASS_CACHE}`);
    },
    isCacheBypassed: () => BYPASS_CACHE,
    clearLearnedCache: () => {
      try {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIME_KEY);
        console.log('🧹 [StemLabAIBridge] Đã xóa sạch toàn bộ cache tri thức cục bộ.');
      } catch (_) {}
    }
  };
});
