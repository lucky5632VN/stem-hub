/**
 * 🛡️ STEM HUB Deterministic Safety Filter & Teacher Supervision Guard
 *
 * Thành phần thuật toán tất định (Deterministic Rule-based Filter):
 * 1. BLOCKED_HAZARD: Chặn cứng các yêu cầu chế tạo chất nổ, khí độc, vũ khí, ma túy, hóa chất cấm.
 *    Chạy TRƯỚC khi gọi LLM và TRƯỚC cả nhánh fallback RAG.
 * 2. SUPERVISED_RISK: Nhận diện hóa chất/thí nghiệm rủi ro cao trong SGK cần hướng dẫn có giám sát
 *    của giáo viên (H2SO4 đặc, Na/K + H2O, Cl2, HNO3 đặc, HF, oleum, photpho trắng, nhiệt nhôm...).
 * 3. NO_AI_RISK_APPROVAL: Phát hiện và chặn việc học sinh yêu cầu AI "xác nhận an toàn / cho phép tự làm"
 *    thay cho giáo viên ở các thao tác rủi ro.
 */

export const SAFETY_LEVELS = {
  BLOCKED_HAZARD: 'BLOCKED_HAZARD',
  SUPERVISED_RISK: 'SUPERVISED_RISK',
  SAFE: 'SAFE'
};

const BLOCKED_HAZARD_RULES = [
  {
    id: 'EXPLOSIVE_SYNTHESIS',
    label: 'Chế tạo chất nổ / bom / pháo tự chế',
    pattern: /(chế\s*tạo|tổng\s*hợp|pha\s*chế|điều\s*chế|làm\s*sao\s*(?:để\s*)?(?:tạo|làm)|công\s*thức\s*làm|hướng\s*dẫn\s*làm)\s*[^.!?\n]{0,40}\b(thuốc\s*nổ|chất\s*nổ|bom|mìn|kíp\s*nổ|pháo\s*nổ|tnt|nitroglycerin|tatp|rdx|c4|thuốc\s*súng|hỗn\s*hợp\s*nổ|kclo3\s*\+?\s*(?:lưu\s*huỳnh|s|than|c))\b/i
  },
  {
    id: 'EXPLOSIVE_DIRECT',
    label: 'Chất nổ tự chế nguy hiểm',
    pattern: /\b(cách\s*làm\s*bom|tự\s*chế\s*thuốc\s*nổ|chế\s*tạo\s*bom|pha\s*thuốc\s*nổ|nitroglycerin|tatp|triacetone\s*triperoxide|ammonium\s*nitrate\s*fuel\s*oil|anfo)\b/i
  },
  {
    id: 'TOXIC_WEAPON_GAS',
    label: 'Điều chế khí cực độc / chất độc hóa học',
    pattern: /(chế\s*tạo|điều\s*chế|tổng\s*hợp|tạo\s*ra|pha\s*chế|giải\s*phóng|đầu\s*độc)\s*[^.!?\n]{0,40}\b(khí\s*độc|chất\s*độc|hcn|xyanua|cyanide|kali\s*xyanua|kcn|nacn|phosgene|cocl2|sarin|khí\s*mù\s*tạt|ricin|thủy\s*ngân|asen|thạch\s*tín)\b/i
  },
  {
    id: 'DIRECT_FORBIDDEN_TOXIN',
    label: 'Hóa chất cực độc bị cấm ngoài chương trình phổ thông',
    pattern: /\b(hcn|xyanua|kali\s*xyanua|phosgene|sarin|ricin|chất\s*độc\s*thần\s*kinh|vũ\s*khí\s*hóa\s*học|vũ\s*khí\s*sinh\s*học)\b/i
  },
  {
    id: 'ILLICIT_DRUGS_WEAPONS',
    label: 'Chất gây nghiện / vũ khí / gây hại',
    pattern: /(chế\s*tạo|tổng\s*hợp|nấu|điều\s*chế)\s*[^.!?\n]{0,35}\b(ma\s*túy|ma\s*tuý|heroin|methamphetamine|hàng\s*đá|ketamine|thuốc\s*lắc|vũ\s*khí|súng\s*tự\s*chế|bom\s*xăng|molotov)\b/i
  },
  {
    id: 'HOME_HAZARD_MIXING',
    label: 'Pha trộn hóa chất nguy hiểm tự phát tại nhà',
    pattern: /(tự\s*làm|làm\s*tại\s*nhà|thử\s*tại\s*nhà|trộn\s*ở\s*nhà)\s*[^.!?\n]{0,45}\b(khí\s*clo|cl2|h2so4\s*đặc|axit\s*sunfuric\s*đặc|hno3\s*đặc|natri\s*kim\s*loại|kali\s*kim\s*loại|nổ\s*lớn|cháy\s*nổ)\b/i
  }
];

const SUPERVISED_RISK_RULES = [
  {
    id: 'HIGH_RISK_CHEM_CONC_ACID',
    label: 'Axit đặc ăn mòn / tỏa nhiệt mạnh (H2SO4 đặc, HNO3 đặc, HF, Oleum)',
    pattern: /\b(h2so4\s*đặc|axit\s*sunfuric\s*đặc|acid\s*sulfuric\s*đặc|pha\s*loãng\s*h2so4|oleum|hno3\s*đặc|axit\s*nitric\s*đặc|axit\s*flohidric|\bhf\b)\b/i
  },
  {
    id: 'HIGH_RISK_ALKALI_WATER',
    label: 'Kim loại kiềm (Na, K) phản ứng mãnh liệt',
    pattern: /\b(natri|kali|\bna\b|\bk\b)\s*[^.!?\n]{0,25}(?:tác\s*dụng|phản\s*ứng|bỏ\s*vào|ném\s*vào|cho\s*vào|\+)\s*[^.!?\n]{0,20}(nước|h2o|axit|hcl|h2so4)\b/i
  },
  {
    id: 'HIGH_RISK_TOXIC_LAB_GAS',
    label: 'Thí nghiệm sinh khí độc (Cl2, SO2, NO2, H2S, NH3)',
    pattern: /\b(điều\s*chế|thu\s*khí|thí\s*nghiệm|đốt)\s*[^.!?\n]{0,30}\b(cl2|khí\s*clo|so2|no2|h2s|photpho\s*trắng|p\s*trắng)\b/i
  },
  {
    id: 'HIGH_RISK_THERMAL_PRESSURE',
    label: 'Phản ứng tỏa nhiệt mạnh / đun nóng / áp suất cao',
    pattern: /(?:phản\s*ứng\s*nhiệt\s*nhôm|đun\s*nóng\s*bình\s*kín|điện\s*phân\s*nóng\s*chảy|đốt\s*cháy\s*magie|kclo3\s*nhiệt\s*phân|đèn\s*cồn\s*đun\s*nóng)/i
  }
];

const RISK_APPROVAL_PATTERNS = [
  /(xác\s*nhận|duyệt|chấp\s*thuận|cam\s*kết|bảo\s*đảm|đảm\s*bảo|cho\s*phép|kết\s*luận)\s*[^.!?\n]{0,55}(?:an\s*toàn|không\s*nổ|không\s*độc|không\s*nguy\s*hiểm|thao\s*tác\s*này|thí\s*nghiệm\s*này|tự\s*làm|thực\s*hiện)/i,
  /(?:\bai\b|trợ\s*lý|nova|hệ\s*thống)\s*[^.!?\n]{0,35}(?:xác\s*nhận|duyệt|cho\s*phép|thay\s*giáo\s*viên)/i,
  /(?:tự\s*làm\s*(?:ở|tại)\s*nhà\s*được\s*không|không\s*cần\s*giáo\s*viên|tự\s*(?:thực\s*hành|làm)\s*một\s*mình)/i
];

const LAB_ACTION_CONTEXT_PATTERN = /\b(thí\s*nghiệm|thao\s*tác|pha|trộn|đổ|rót|đun|đốt|thực\s*hành|hóa\s*chất|axit|bazơ|kiềm|kim\s*loại|khí)\b/i;

const UNSAFE_LLM_APPROVAL_PHRASES = [
  /tôi\s*xác\s*nhận\s*(?:rằng\s*)?(?:thao\s*tác|thí\s*nghiệm)\s*(?:này\s*)?an\s*toàn/i,
  /bạn\s*(?:hoàn\s*toàn\s*)?có\s*thể\s*tự\s*(?:làm|thực\s*hiện)\s*(?:ở|tại)\s*nhà/i,
  /không\s*cần\s*giáo\s*viên\s*(?:giám\s*sát|xác\s*nhận)/i,
  /hoàn\s*toàn\s*an\s*toàn\s*để\s*tự\s*thực\s*hiện/i
];

function normalizeInput(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Đánh giá chính sách an toàn tất định cho câu hỏi / yêu cầu thao tác.
 * @param {string} prompt
 * @returns {{
 *   level: 'BLOCKED_HAZARD' | 'SUPERVISED_RISK' | 'SAFE',
 *   blocked: boolean,
 *   requiresTeacherApproval: boolean,
 *   isApprovalAttempt: boolean,
 *   matchedRules: string[],
 *   reason: string,
 *   safeResponse: string | null,
 *   supervisionNotice: string | null
 * }}
 */
export function evaluateSafetyPolicy(prompt) {
  const clean = normalizeInput(prompt);
  if (!clean) {
    return {
      level: SAFETY_LEVELS.SAFE,
      blocked: false,
      requiresTeacherApproval: false,
      isApprovalAttempt: false,
      matchedRules: [],
      reason: '',
      safeResponse: null,
      supervisionNotice: null
    };
  }

  const blockedMatches = [];
  for (const rule of BLOCKED_HAZARD_RULES) {
    if (rule.pattern.test(clean)) {
      blockedMatches.push(rule.id);
    }
  }

  if (blockedMatches.length > 0) {
    return {
      level: SAFETY_LEVELS.BLOCKED_HAZARD,
      blocked: true,
      requiresTeacherApproval: true,
      isApprovalAttempt: false,
      matchedRules: blockedMatches,
      reason: 'Yêu cầu liên quan đến chế tạo chất nổ, hóa chất cực độc, vũ khí hoặc pha trộn nguy hiểm ngoài phạm vi an toàn học tập.',
      safeResponse:
        '⛔ **TỪ CHỐI YÊU CẦU AN TOÀN HỌC TẬP**: Hệ thống không cung cấp hướng dẫn chế tạo chất nổ, hóa chất cực độc, chất cấm hoặc thao tác pha trộn nguy hiểm.\n\n' +
        'Nếu em đang tìm hiểu lý thuyết hóa học trong chương trình GDPT 2018, hãy hỏi về tính chất vật lý/hóa học hoặc phương trình phản ứng chuẩn SGK và trao đổi trực tiếp với Giáo viên bộ môn.',
      supervisionNotice: 'Đã kích hoạt bộ lọc chặn hóa chất/yêu cầu nguy hiểm tất định trước khi gọi mô hình AI.'
    };
  }

  const supervisedMatches = [];
  for (const rule of SUPERVISED_RISK_RULES) {
    if (rule.pattern.test(clean)) {
      supervisedMatches.push(rule.id);
    }
  }

  const isApprovalAttempt = RISK_APPROVAL_PATTERNS.some((p) => p.test(clean));
  const hasLabContext = LAB_ACTION_CONTEXT_PATTERN.test(clean);

  // Trường hợp học sinh yêu cầu AI xác nhận an toàn / cho phép tự làm thao tác rủi ro
  if (isApprovalAttempt && (supervisedMatches.length > 0 || hasLabContext)) {
    const rules = Array.from(new Set([...supervisedMatches, 'NO_AI_RISK_APPROVAL']));
    return {
      level: SAFETY_LEVELS.SUPERVISED_RISK,
      blocked: false,
      requiresTeacherApproval: true,
      isApprovalAttempt: true,
      matchedRules: rules,
      reason: 'Yêu cầu xác nhận an toàn cho thao tác thực hành rủi ro. AI không được phép thay thế giáo viên xác nhận thao tác rủi ro.',
      safeResponse:
        '🛡️ **YÊU CẦU GIÁO VIÊN XÁC NHẬN (AI KHÔNG THAY GIÁO VIÊN DUYỆT RỦI RO)**\n\n' +
        'Trợ lý AI **không có thẩm quyền xác nhận an toàn** hoặc cho phép học sinh tự thực hiện thao tác thí nghiệm rủi ro ở nhà hay trong phòng thí nghiệm.\n\n' +
        '- Thao tác liên quan hóa chất/phản ứng rủi ro cao bắt buộc phải có **Giáo viên trực tiếp kiểm tra** đồ bảo hộ (kính, găng tay, áo blouse, tủ hút) và xác nhận tại lớp.\n' +
        '- Em có thể nhấn nút **"Gửi GV kiểm tra"** bên dưới để chuyển nội dung này tới Giáo viên bộ môn.',
      supervisionNotice: 'Chế độ hướng dẫn có giám sát: Bắt buộc Giáo viên xác nhận thao tác rủi ro.'
    };
  }

  if (supervisedMatches.length > 0) {
    return {
      level: SAFETY_LEVELS.SUPERVISED_RISK,
      blocked: false,
      requiresTeacherApproval: true,
      isApprovalAttempt: false,
      matchedRules: supervisedMatches,
      reason: 'Nội dung chứa hóa chất hoặc thao tác thí nghiệm có mức độ rủi ro cao trong SGK.',
      safeResponse: null,
      supervisionNotice:
        '⚠️ **HƯỚNG DẪN CÓ GIÁM SÁT**: Nội dung này liên quan đến hóa chất/thí nghiệm rủi ro cao. Chỉ tìm hiểu lý thuyết hoặc thực hành trong phòng thí nghiệm ảo/phòng lab có **Giáo viên trực tiếp giám sát** và trang bị đầy đủ bảo hộ (Kính, găng tay, áo blouse, tủ hút).'
    };
  }

  return {
    level: SAFETY_LEVELS.SAFE,
    blocked: false,
    requiresTeacherApproval: false,
    isApprovalAttempt: false,
    matchedRules: [],
    reason: '',
    safeResponse: null,
    supervisionNotice: null
  };
}

/**
 * Hậu kiểm câu trả lời của LLM: ngăn AI vô tình tự nhận xác nhận an toàn thay giáo viên.
 * @param {string} answerText
 * @param {ReturnType<typeof evaluateSafetyPolicy>} policyResult
 * @returns {{ text: string, overridden: boolean }}
 */
export function sanitizeLLMResponseForRisk(answerText, policyResult) {
  if (!answerText || typeof answerText !== 'string') {
    return { text: '', overridden: false };
  }

  if (policyResult?.blocked) {
    return { text: policyResult.safeResponse, overridden: true };
  }

  const llmAttemptedApproval = UNSAFE_LLM_APPROVAL_PHRASES.some((rx) => rx.test(answerText));
  if (llmAttemptedApproval || policyResult?.isApprovalAttempt) {
    const safePrefix =
      '🛡️ **LƯU Ý GIÁM SÁT**: AI không thay giáo viên xác nhận an toàn thao tác thí nghiệm. Mọi thao tác thực hành rủi ro cần Giáo viên trực tiếp kiểm tra và xác nhận.\n\n';
    const cleaned = answerText
      .replace(/tôi\s*xác\s*nhận[^.!?\n]*[.!?]?/gi, '[Đã ẩn nội dung tự xác nhận — cần Giáo viên duyệt]')
      .replace(/bạn\s*(?:hoàn\s*toàn\s*)?có\s*thể\s*tự\s*(?:làm|thực\s*hiện)\s*(?:ở|tại)\s*nhà[^.!?\n]*[.!?]?/gi, '[Không tự ý thực hiện tại nhà — cần Giáo viên giám sát]');
    return {
      text: cleaned.startsWith('🛡️') ? cleaned : safePrefix + cleaned,
      overridden: true
    };
  }

  if (policyResult?.level === SAFETY_LEVELS.SUPERVISED_RISK && !answerText.includes('GIÁM SÁT') && !answerText.includes('giáo viên')) {
    return {
      text: `${answerText}\n\n${policyResult.supervisionNotice}`,
      overridden: false
    };
  }

  return { text: answerText, overridden: false };
}
