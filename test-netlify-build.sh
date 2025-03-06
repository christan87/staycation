#!/bin/bash
set -e

# This script simulates the Netlify build environment locally
echo "Simulating Netlify build environment..."

# Set environment variables similar to Netlify
export NODE_VERSION="18.20.6"
export NPM_VERSION="10.8.2"
export NETLIFY_NEXT_PLUGIN_SKIP="true"

# Clean up previous build
echo "Cleaning up previous build..."
rm -rf .next
rm -rf node_modules

# Run the netlify build script
echo "Running netlify build script..."
chmod +x netlify-build.sh
./netlify-build.sh

# Verify that the critical files exist
echo "Verifying build output..."
if [ -f ".next/server/chunks/vendor-chunks/next.js" ] && [ -f ".next/server/middleware-manifest.json" ]; then
  echo "✅ Critical files exist in the build output"
else
  echo "❌ Some critical files are missing in the build output"
  [ ! -f ".next/server/chunks/vendor-chunks/next.js" ] && echo "Missing: .next/server/chunks/vendor-chunks/next.js"
  [ ! -f ".next/server/middleware-manifest.json" ] && echo "Missing: .next/server/middleware-manifest.json"
  exit 1
fi

echo "Build completed successfully. Ready for Netlify deployment."
