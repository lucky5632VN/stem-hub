/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: false,
  cleanDistDir: false,
  images: {
    unoptimized: true,
  },
  experimental: {},
};

export default nextConfig;
