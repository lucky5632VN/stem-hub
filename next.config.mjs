/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  cleanDistDir: false,
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
