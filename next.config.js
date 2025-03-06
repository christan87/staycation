const path = require('path');

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Core Next.js configuration
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  
  // Enable server actions for form submissions
  experimental: {
    serverActions: true,
    // Disable optimizeCss to avoid critters dependency issues
    optimizeCss: false,
    optimizeServerReact: true
  },
  
  // Webpack configuration for optimizations
  webpack: (config, { dev, isServer }) => {
    // Add production optimizations
    if (!dev && !isServer) {
      // Ensure minimization is enabled
      config.optimization.minimize = true;
      
      // Split chunks more aggressively for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk for third-party modules
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk for shared code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      };
    }
    
    // Path aliases for cleaner imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src'),
    };
    
    return config;
  },
  
  // Image optimization configuration
  images: {
    domains: ['res.cloudinary.com', 'localhost'],
    // Optimize images for faster loading
    minimumCacheTTL: 60,
    formats: ['image/webp'],
  },
  
  // Disable TypeScript and ESLint errors during build for Netlify
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Security and performance optimizations
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  optimizeFonts: true,
  compress: true,
  
  // Add security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

// Handle Netlify-specific environment variables
if (process.env.NETLIFY === 'true') {
  console.log('Applying Netlify-specific configuration');
  // Ensure we're not using features that might cause issues on Netlify
  nextConfig.output = 'standalone';
}

module.exports = nextConfig;