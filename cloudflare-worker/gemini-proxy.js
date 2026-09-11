/**
 * Cloudflare Worker: Gemini API Reverse Proxy ($0 Plan - 100,000 req/day)
 * 
 * Mục đích: Ẩn 100% Google Gemini API Key khỏi Client-side trình duyệt.
 * Khắc phục Tử huyệt #1 (Lộ API Key trong tab Network F12).
 * 
 * Cách triển khai (100% Free):
 * 1. Đăng ký tài khoản Cloudflare miễn phí tại https://dash.cloudflare.com
 * 2. Vào mục "Workers & Pages" -> Create Application -> Create Worker
 * 3. Dán toàn bộ mã nguồn bên dưới vào Worker Editor.
 * 4. Vào Settings -> Variables -> Thêm Secret: GEMINI_API_KEY = "Khóa Gemini của bạn"
 * 5. Deploy và copy URL worker (ví dụ: https://stem-gemini-proxy.your-name.workers.dev)
 *    gán vào biến môi trường NEXT_PUBLIC_GEMINI_PROXY_URL trong dự án.
 */

export default {
  async fetch(request, env, ctx) {
    // 1. CORS Preflight Handling (Cho phép trình duyệt web gọi cross-origin)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Chỉ hỗ trợ phương thức POST" }), {
        status: 405,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    try {
      const url = new URL(request.url);
      const model = url.searchParams.get("model") || "gemini-2.5-flash";
      const apiVer = url.searchParams.get("apiVer") || "v1beta";

      // Đọc Secret Key được lưu an toàn trong Cloudflare Environment Variables
      // Trình duyệt của học sinh KHÔNG BAO GIỜ nhìn thấy hoặc tiếp cận được khóa này
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ 
          error: "Cloudflare Worker chưa cấu hình biến môi trường bí mật GEMINI_API_KEY" 
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const body = await request.text();
      const targetUrl = `https://generativelanguage.googleapis.com/${apiVer}/models/${model}:generateContent?key=${apiKey}`;

      // Gọi lên Google Gemini từ máy chủ Edge của Cloudflare
      const geminiResponse = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: body,
      });

      const responseBody = await geminiResponse.text();
      return new Response(responseBody, {
        status: geminiResponse.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ 
        error: "Lỗi nội bộ Proxy trung gian", 
        message: err.message 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  },
};
