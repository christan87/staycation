/** @type {import('next').NextConfig} */
const nextConfig = {
  // Core Next.js configuration
  reactStrictMode: true,
  swcMinify: true,
  // Use standalone output for Netlify
  output: 'standalone',
  distDir: '.next',
  // Image configuration
  images: {
    domains: ['res.cloudinary.com', 'localhost'],
  },
  // Enable server actions for form submissions
  experimental: {
    serverActions: true,
  },
};

export default nextConfig;
