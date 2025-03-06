#!/bin/bash
set -e

echo "Starting development server for testing..."

# Clean the .next directory to ensure a fresh start
rm -rf .next

# Start the development server
npm run dev
