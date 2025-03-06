#!/bin/bash
set -e

# Print Node and NPM versions for debugging
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Clean cache and node_modules to ensure fresh build
echo "Cleaning cache..."
rm -rf .next

# Temporarily set NODE_ENV to development to ensure devDependencies are installed
export NODE_ENV=development

# Install dependencies with clean slate
echo "Installing dependencies..."
npm ci

# Explicitly install TypeScript and other critical dev dependencies
echo "Installing TypeScript and other critical dev dependencies..."
npm install -D typescript@5.8.2 @types/node @types/react cssnano postcss autoprefixer

# Disable Next.js telemetry
echo "Disabling Next.js telemetry..."
npx next telemetry disable

# Now set NODE_ENV to production for the build
export NODE_ENV=production
export NETLIFY_NEXT_PLUGIN_SKIP=true

# Run the Next.js build
echo "Building Next.js application..."
npx next build

echo "Build completed successfully!"
