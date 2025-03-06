#!/bin/bash
set -e

# Function to handle errors
handle_error() {
  echo "❌ Error occurred at line $1"
  echo "Build failed. See error details above."
  exit 1
}

# Set up error handling
trap 'handle_error $LINENO' ERR

# Print environment information for debugging
echo "📋 Environment Information:"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Initial NODE_ENV: $NODE_ENV"

# Clean cache to ensure fresh build
echo "🧹 Cleaning cache..."
rm -rf .next

# Save original NODE_ENV value
ORIGINAL_NODE_ENV=$NODE_ENV

# Temporarily set NODE_ENV to development to ensure devDependencies are installed
echo "🔧 Setting NODE_ENV=development for dependency installation"
export NODE_ENV=development

# Install dependencies with clean slate
echo "📦 Installing dependencies..."
npm ci || {
  echo "⚠️ npm ci failed, trying npm install as fallback..."
  npm install
}

# Explicitly install TypeScript and other critical dev dependencies
echo "🔧 Installing TypeScript and other critical dev dependencies..."
npm install -D typescript@5.8.2 @types/node @types/react @types/react-dom cssnano postcss autoprefixer

# Install critters for CSS optimization
echo "🔧 Installing critters for CSS optimization..."
npm install critters@0.0.20

# Disable Next.js telemetry
echo "🔒 Disabling Next.js telemetry..."
npx next telemetry disable

# Now set NODE_ENV to production for the build
echo "🏗️ Setting NODE_ENV=production for build"
export NODE_ENV=production
export NETLIFY_NEXT_PLUGIN_SKIP=true

# Run the Next.js build
echo "🚀 Building Next.js application..."
npx next build

# Verify build output directory exists
if [ ! -d ".next" ]; then
  echo "❌ Build failed: .next directory not created"
  exit 1
fi

# Run the post-build script to ensure all necessary files exist
echo "🔍 Running post-build script..."
node netlify-postbuild.js

# Copy public files to .next directory
echo "📂 Copying public files to .next directory..."
cp -r public/* .next/

# Ensure _redirects file exists in .next directory
if [ ! -f ".next/_redirects" ]; then
  echo "⚠️ Creating _redirects file in .next directory..."
  echo "/* /index.html 200" > .next/_redirects
fi

# Verify critical files exist
echo "✅ Verifying build output..."
if [ ! -f ".next/server/pages-manifest.json" ]; then
  echo "⚠️ Warning: pages-manifest.json not found, creating empty file"
  mkdir -p .next/server
  echo "{}" > .next/server/pages-manifest.json
fi

# Restore original NODE_ENV if it was set
if [ -n "$ORIGINAL_NODE_ENV" ]; then
  echo "🔄 Restoring NODE_ENV to original value: $ORIGINAL_NODE_ENV"
  export NODE_ENV=$ORIGINAL_NODE_ENV
fi

echo "✨ Build completed successfully!"
