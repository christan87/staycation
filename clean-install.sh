#!/bin/bash
set -e

echo "✨ Starting clean installation process..."

# Function to handle errors
handle_error() {
  echo "❌ Error occurred at line $1"
  echo "Installation failed. See error details above."
  exit 1
}

# Set up error handling
trap 'handle_error $LINENO' ERR

# Print environment information
echo "📋 Environment Information:"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"

# Clean up any existing installation
echo "🧹 Cleaning up existing files..."
rm -rf node_modules .next package-lock.json yarn.lock pnpm-lock.yaml

# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Disable Next.js telemetry
echo "🔒 Disabling Next.js telemetry..."
npx next telemetry disable

# Install dependencies with a clean slate
echo "📦 Installing dependencies..."
npm install

# Install dev dependencies explicitly
echo "📦 Installing dev dependencies explicitly..."
npm install --save-dev typescript@5.8.2 @types/node @types/react @types/react-dom cssnano postcss autoprefixer

# Install critters for CSS optimization
echo "📦 Installing critters..."
npm install critters@0.0.20

# Verify installation
echo "🔍 Verifying installation..."
if [ ! -d "node_modules" ]; then
  echo "❌ Installation failed: node_modules directory not created"
  exit 1
fi

# Build the application
echo "🚀 Building the application..."
npm run build

# Verify build output
echo "✅ Verifying build output..."
if [ ! -d ".next" ]; then
  echo "❌ Build failed: .next directory not created"
  exit 1
fi

echo "🎉 Clean installation complete! The application is ready to run."
echo "💻 Run 'npm run dev' to start the development server."
echo "🔗 Or run 'npm run test-netlify-build' to test the Netlify deployment."
