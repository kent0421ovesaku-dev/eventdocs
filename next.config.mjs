/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // pdfjs-dist/legacy はビルド時に canvas（Node.js ネイティブモジュール）を要求するが
    // ブラウザ環境では不要のため空モジュールとして解決する
    config.resolve.alias.canvas = false;
    return config;
  },
};
export default nextConfig;
