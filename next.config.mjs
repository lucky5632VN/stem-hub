/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
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
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = false; // Tắt source maps dung lượng lớn khi dev
    }
    return config;
  },
};

export default nextConfig;
