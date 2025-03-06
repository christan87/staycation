/** @type {import('next').NextConfig} */
const nextConfig = {
  // Core Next.js configuration
  reactStrictMode: true,
  swcMinify: true,
  output: 'export', // Static export for Netlify
  distDir: '.next',
  images: {
    unoptimized: true, // Required for static export
    domains: ['res.cloudinary.com', 'localhost'],
  },
  // Ensure trailing slashes for better compatibility
  trailingSlash: true,
};

export default nextConfig;
