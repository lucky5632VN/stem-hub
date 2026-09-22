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
  turbopack: {}, // Cấu hình turbopack rỗng cho Next.js 16
  async headers() {
    return [
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
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
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
