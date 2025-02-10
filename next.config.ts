import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src'),
    };
    return config;
  },
  images: {
    domains: [
      'via.placeholder.com',
      'res.cloudinary.com',
      'picsum.photos'
    ],
    unoptimized: false,
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    forceSwcTransforms: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  // Optimize for Netlify
  output: 'standalone',
  distDir: '.next'
}

export default nextConfig;