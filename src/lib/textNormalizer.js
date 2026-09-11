/**
 * STEM HUB Text Normalizer for Intent Classifier
 * Ánh xạ teencode, viết tắt, từ lóng học sinh sang từ chuẩn tiếng Việt trước khi đưa vào Naive Bayes.
 */

const TEENCODE_MAP = {
  // Đại từ & Xưng hô
  'tui': 'tôi',
  'tớ': 'tôi',
  'mềnh': 'tôi',
  't': 'tôi',
  'minh': 'mình',
  'ban': 'bạn',
  
  // Hành động / Động từ
  'va0': 'vào',
  'v0a': 'vào',
  'vo': 'vào',
  'muon': 'muốn',
  'lam': 'làm',
  'thach': 'thách',
  'bat': 'bật',
  'tat': 'tắt',
  'doi': 'đổi',
  'chuyen': 'chuyển',
  'luet': 'lướt',
  'dang': 'đăng',
  'ghep': 'ghép',
  'solo': 'thách đấu',

  // Danh từ / Môn học / Thuật ngữ
  'phj': 'thi',
  'phong': 'phòng',
  'thj': 'thi',
  'hoso': 'hồ sơ',
  'dautruong': 'đấu trường',
  'story': 'bài viết',
  'pvp': 'đấu trường 1v1',
  'darkmode': 'chế độ tối',
  'lightmode': 'chế độ sáng',
  'thpt': 'trung học phổ thông',
  'qg': 'quốc gia',
  'nhan': 'nhận',
  'j': 'gì',
  'ji': 'gì',
  'z': 'gì',
  'soda': 'sô đa',

  // Môn học
  'toan': 'toán',
  'ly': 'lý',
  'hoa': 'hóa',
  'sinh': 'sinh học'
};

export function normalizeText(text) {
  if (!text) return '';

  let normalized = text
    .toLowerCase()
    .normalize('NFC')
    // Thay thế số gõ thay chữ (0 -> o, 4 -> a nếu nằm trong từ)
    .replace(/\b(\w*)0(\w*)\b/g, '$1o$2')
    .replace(/\b(\w*)4(\w*)\b/g, '$1a$2')
    .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = normalized.split(' ');
  const replacedWords = words.map(w => TEENCODE_MAP[w] || w);

  return replacedWords.join(' ');
}
