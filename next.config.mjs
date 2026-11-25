/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  cleanDistDir: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    cpus: 2, // Giới hạn 2 worker threads để tránh lỗi spawn UNKNOWN trên Windows
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  poweredByHeader: false, // 🛡️ OWASP: Tắt X-Powered-By chống nhận diện máy chủ (Server Fingerprinting)
  turbopack: {}, // Cấu hình turbopack rỗng cho Next.js 16
  compress: true, // ⚡ Nén Gzip/Brotli tối đa băng thông và tăng tốc FCP
  outputFileTracingIncludes: {
    '/api/reviews/**/*': [
      'src/ai-training/datasets/benchmark_150_cases.json',
      'src/ai-training/datasets/rag_ablation_benchmark.json',
      'src/ai-training/datasets/official_exam_questions_for_review.json',
      'src/data/global-learned-knowledge.json',
      'reports/ablation/ablation_dataset_100.json',
      'reports/ablation/ablation_dataset_100.v1.4.2.json',
      'reports/ablation/call_cache.json',
      'reports/ablation/expert_reviews_local.json',
    ],
    '/api/learned-knowledge': [
      'src/data/global-learned-knowledge.json',
      'src/data/knowledge_audit_log.json',
      'public/data/global-learned-knowledge.json',
      'public/data/knowledge_audit_log.json',
    ],
  },
  env: {
    // 🛡️ Nguồn cấu hình duy nhất: Mặc định tắt (true) ở production, chỉ bật khi đặt rõ ràng 'false'
    NEXT_PUBLIC_DISABLE_AI_REASONING_LOG: String(
      process.env.NODE_ENV === 'production'
        ? process.env.DISABLE_AI_REASONING_LOG !== 'false'
        : (process.env.DISABLE_AI_REASONING_LOG === 'true' || process.env.NEXT_PUBLIC_DISABLE_AI_REASONING_LOG === 'true')
    ),
  },
  async headers() {
    return [
      {
        source: '/(images|audio|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' http://localhost:3000 http://127.0.0.1:3000 https://ai.stem-hub.top https://cuoc-thi-ai-e2044.web.app;",
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },

  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = false; // Tắt source maps dung lượng lớn khi dev
    }
    // Tắt cảnh báo Critical dependency từ thư viện protobufjs của Firebase Firestore
    config.module.exprContextCritical = false;
    return config;
  },
};

export default nextConfig;
