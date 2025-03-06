#!/bin/bash
set -e

echo "Starting clean installation process..."

# Clean up any existing installation
echo "Cleaning up existing files..."
rm -rf node_modules .next package-lock.json

# Install dependencies
echo "Installing dependencies..."
npm install

# Install dev dependencies explicitly
echo "Installing dev dependencies explicitly..."
npm install --save-dev typescript@5.8.2 @types/node @types/react @types/react-dom

# Build the application
echo "Building the application..."
npm run build

echo "Clean installation complete!"
