/** @type {import('next').NextConfig} */
const nextConfig = {
  // Core Next.js configuration
  reactStrictMode: true,
  swcMinify: true,
  // Use static export for Netlify
  output: 'export',
  distDir: '.next',
  // Image configuration
  images: {
    unoptimized: true, // Required for static export
    domains: ['res.cloudinary.com', 'localhost'],
  },
  // Trailing slash for better compatibility with static hosting
  trailingSlash: true,
};

export default nextConfig;
