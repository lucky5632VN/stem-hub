/**
 * STEM HUB Server Security Utilities
 * Thực hiện các tiêu chuẩn an ninh phòng vệ cho Next.js Route Handlers:
 * - CORS Whitelisting (Tiêu chí 16)
 * - Rate Limiting theo IP (Tiêu chí 2)
 * - Sanitize & Masking Error Messages (Tiêu chí 6)
 * - URL Domain Whitelisting (Tiêu chí 9)
 */

export const ALLOWED_ORIGINS = [
  'https://ai.stem-hub.top',
  'https://cuoc-thi-ai-e2044.web.app',
  'https://cuoc-thi-ai-e2044.firebaseapp.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

export const ALLOWED_HOSTS = [
  'ai.stem-hub.top',
  'cuoc-thi-ai-e2044.web.app',
  'cuoc-thi-ai-e2044.firebaseapp.com',
  'localhost:3000',
  '127.0.0.1:3000'
];

/**
 * Trả về CORS headers an toàn cho Origin hợp lệ
 */
export function getCorsHeaders(req) {
  const origin = req?.headers?.get ? req.headers.get('origin') : '';
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

/**
 * Trích xuất IP người dùng từ headers request
 */
export function getClientIp(req) {
  if (!req?.headers?.get) return '127.0.0.1';
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',');
    return ips[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

// In-Memory Rate Limiter Map (tự động dọn dẹp mỗi 5 phút)
const rateLimitMap = new Map();

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Kiểm tra giới hạn tốc độ (Rate Limit) theo key (IP + Action)
 * @param {string} key - Định danh (ví dụ: `send-otp:${ip}`)
 * @param {number} maxRequests - Số lượng request tối đa trong cửa sổ thời gian
 * @param {number} windowMs - Độ rộng cửa sổ thời gian (ms)
 * @returns {{ allowed: boolean, remaining: number, resetInSec: number }}
 */
export function checkRateLimit(key, maxRequests = 30, windowMs = 60 * 1000) {
  const now = Date.now();
  let record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + windowMs };
    rateLimitMap.set(key, record);
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInSec: Math.ceil(windowMs / 1000)
    };
  }

  record.count += 1;
  const remaining = Math.max(0, maxRequests - record.count);
  const resetInSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

  if (record.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSec
    };
  }

  return {
    allowed: true,
    remaining,
    resetInSec
  };
}

/**
 * Kiểm tra URL có thuộc domain được phép hay không (Chống Open Redirect)
 */
export function isAllowedUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;
  try {
    const parsed = new URL(urlString);
    return ALLOWED_HOSTS.includes(parsed.host);
  } catch {
    return false;
  }
}

/**
 * Sanitize error message, không lộ stack trace hay thông tin server
 */
export function maskErrorMessage(err, customMessage = 'Hệ thống đang bận hoặc gặp sự cố kết nối. Vui lòng thử lại sau.') {
  if (!err) return customMessage;
  const msg = typeof err === 'string' ? err : err.message || '';
  
  // Cho phép một số lỗi người dùng phổ biến
  if (msg.includes('Cần cung cấp') || msg.includes('bắt buộc') || msg.includes('không hợp lệ')) {
    return msg;
  }
  return customMessage;
}
