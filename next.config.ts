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
      'res.cloudinary.com',  // Add Cloudinary domain
      'picsum.photos'        // Add Picsum Photos domain
    ],
  },
};

export default nextConfig;