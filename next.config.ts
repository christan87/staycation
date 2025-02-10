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
  // Disable static optimization for dynamic routes
  typescript: {
    ignoreBuildErrors: true
  }
}

export default nextConfig;