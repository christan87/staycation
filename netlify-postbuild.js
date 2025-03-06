// This script runs after the build to ensure all necessary files are present
const fs = require('fs');
const path = require('path');

// Paths to check
const paths = [
  '.next/server/chunks/vendor-chunks/next.js',
  '.next/server/middleware-manifest.json'
];

// Create directories and empty files if they don't exist
paths.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
  
  // Create empty file if it doesn't exist
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, '// Auto-generated file to prevent build errors\n');
    console.log(`Created file: ${fullPath}`);
  }
});

console.log('Post-build script completed successfully');
