#!/bin/bash

# Set environment variables similar to Netlify
export NODE_VERSION="18.20.6"
export NPM_VERSION="10.8.2"
export NODE_ENV="production"

# Clean up previous build
echo "Cleaning up previous build..."
rm -rf .next
rm -rf node_modules

# Run the netlify build script
echo "Running netlify build script..."
chmod +x netlify-build.sh
./netlify-build.sh

echo "Build completed. Check for any errors above."
