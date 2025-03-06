#!/bin/bash
set -e

# Print Node and NPM versions for debugging
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Clean cache and node_modules to ensure fresh build
echo "Cleaning cache..."
rm -rf .next

# Install dependencies with clean slate
echo "Installing dependencies..."
npm ci

# Install CSS processing dependencies
echo "Installing CSS processing dependencies..."
npm install -D cssnano postcss autoprefixer

# Disable Next.js telemetry
echo "Disabling Next.js telemetry..."
npx next telemetry disable

# Set environment variables
export NODE_ENV=production
export NETLIFY_NEXT_PLUGIN_SKIP=true

# Run the Next.js build
echo "Building Next.js application..."
npx next build

echo "Build completed successfully!"
