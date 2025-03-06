const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Disable static HTML export
  output: 'standalone',
  // Configure pages and document handling
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Disable static optimization for pages that use getServerSideProps
  experimental: {
    // This prevents issues with the Html component in static pages
    optimizeCss: false,
    serverActions: true,
    // Explicitly disable static page optimization
    disableOptimizedLoading: true,
    // Ensure proper component resolution
    esmExternals: true
  },
  webpack: (config, { dev, isServer }) => {
    // Only run in production and when not running on the server
    if (!dev && !isServer) {
      // Enable CSS optimization in production
      config.optimization.minimize = true;
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src'),
    };
    return config;
  },
  images: {
    unoptimized: true,
    domains: ['res.cloudinary.com', 'localhost'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
};

module.exports = nextConfig;