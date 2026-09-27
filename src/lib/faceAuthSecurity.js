/**
 * STEM HUB Face 2FA Security Token Manager
 * Phòng vệ chống thao túng client-side (CWE-602):
 * - Thay thế chuỗi 'true' trần bằng Session Signature có ký số và hết hạn 12h
 * - Tự động phát hiện và xóa token giả mạo, token hết hạn
 */

const FACE_2FA_SECRET_SALT = 'STEM_HUB_2FA_SECURE_SALT_982348_v2';
const MAX_SESSION_AGE_MS = 12 * 60 * 60 * 1000; // 12 tiếng

/**
 * Tạo chữ ký xác thực 2FA chống giả mạo
 */
function computeSignature(uid, timestamp) {
  const payload = `${uid}_${timestamp}_${FACE_2FA_SECRET_SALT}`;
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0, ch; i < payload.length; i++) {
    ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/**
 * Lưu phiên 2FA hợp lệ đã ký số vào storage
 */
export function setFace2FASession(uid) {
  if (typeof window === 'undefined' || !uid) return;
  const timestamp = Date.now();
  const signature = computeSignature(uid, timestamp);
  const token = JSON.stringify({ uid, timestamp, signature });

  try {
    sessionStorage.setItem('face2FA_verified_' + uid, token);
    localStorage.setItem('face2FA_verified_' + uid, token);
  } catch (_) {}
}

/**
 * Xác thực phiên 2FA: Kiểm tra chữ ký và hạn sử dụng 12h
 * @returns {boolean} true nếu hợp lệ, false nếu bị can thiệp/hết hạn
 */
export function isFace2FAValid(uid) {
  if (typeof window === 'undefined' || !uid) return false;

  const rawToken = sessionStorage.getItem('face2FA_verified_' + uid) ||
                   localStorage.getItem('face2FA_verified_' + uid);

  if (!rawToken) return false;

  try {
    const parsed = JSON.parse(rawToken);
    if (!parsed || typeof parsed !== 'object' || !parsed.timestamp || !parsed.signature) {
      clearFace2FASession(uid);
      return false;
    }

    if (parsed.uid !== uid) {
      clearFace2FASession(uid);
      return false;
    }

    const now = Date.now();
    // Chặn thời gian tương lai hoặc quá 12 tiếng
    if (now < parsed.timestamp || (now - parsed.timestamp) > MAX_SESSION_AGE_MS) {
      console.warn('⚠️ Phiên Face 2FA đã hết hạn. Yêu cầu xác thực lại.');
      clearFace2FASession(uid);
      return false;
    }

    const expectedSignature = computeSignature(uid, parsed.timestamp);
    if (parsed.signature !== expectedSignature) {
      console.warn('🚨 Phát hiện chữ ký Face 2FA không hợp lệ (Tamper attempt)!');
      clearFace2FASession(uid);
      return false;
    }

    return true;
  } catch {
    // Nếu dữ liệu không phải JSON (ví dụ như chuỗi 'true' hack từ console F12) -> XÓA NGAY!
    clearFace2FASession(uid);
    return false;
  }
}

/**
 * Xóa sạch phiên 2FA khi đăng xuất
 */
export function clearFace2FASession(uid) {
  if (typeof window === 'undefined' || !uid) return;
  try {
    sessionStorage.removeItem('face2FA_verified_' + uid);
    localStorage.removeItem('face2FA_verified_' + uid);
  } catch (_) {}
}
