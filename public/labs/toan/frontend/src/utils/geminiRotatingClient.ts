/**
 * DEPRECATED & PURGED: Client-Side Gemini Key Pool
 * 
 * Toàn bộ API Key đã được xóa bỏ 100% khỏi phía client để tuân thủ nguyên tắc Zero-Trust Security.
 * Mọi yêu cầu xử lý AI phải được chuyển qua Server API Routes (/api/lab-toan/...).
 */

export const COMBINED_MATH_API_KEYS: string[] = [];
export const RESILIENT_MODELS: string[] = [];

export async function callClientDirectRotatingGemini(_payload: any): Promise<string> {
  throw new Error('Cơ chế gọi AI trực tiếp từ client đã bị vô hiệu hóa vì lý do bảo mật. Vui lòng sử dụng Server API Route.');
}
