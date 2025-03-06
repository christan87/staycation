#!/bin/bash
set -e

# This script simulates the Netlify build environment locally

# Clean up any previous build artifacts
rm -rf .next

# Run our build script
./netlify-build.sh

echo "Local build test completed successfully!"
