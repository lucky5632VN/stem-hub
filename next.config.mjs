/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  cleanDistDir: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
