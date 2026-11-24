/**
 * ⚙️ SYSTEM CONFIG & PRIVACY BANNER HELPER
 * Nguồn cấu hình duy nhất (Single Source of Truth) cho trạng thái Nhật ký suy luận AI
 * Dùng chung giữa Server (API Route) và Client (Banner UI / Build config)
 */

export function getReasoningLogConfig(env = process.env) {
  const isProd = env.NODE_ENV === 'production';
  
  // Ở production: Mặc định tắt (true), chỉ bật khi đặt rõ ràng 'false'
  // Ở development: Tắt nếu DISABLE_AI_REASONING_LOG='true' hoặc NEXT_PUBLIC_DISABLE_AI_REASONING_LOG='true'
  const isLogDisabled = isProd
    ? env.DISABLE_AI_REASONING_LOG !== 'false'
    : (env.DISABLE_AI_REASONING_LOG === 'true' || env.NEXT_PUBLIC_DISABLE_AI_REASONING_LOG === 'true');

  return {
    isLogDisabled,
    bannerText: isLogDisabled
      ? 'Hệ thống không lưu nhật ký câu hỏi.'
      : 'Hệ thống lưu ẩn danh câu hỏi rút gọn trong 7 ngày.',
    noticeText: 'Dữ liệu được xử lý qua dịch vụ Gemini của Google; không nhập thông tin cá nhân.'
  };
}

