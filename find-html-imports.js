const fs = require('fs');
const path = require('path');

function findHtmlImportsInDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.next' && file !== '.git') {
      findHtmlImportsInDirectory(filePath);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx'))) {
      if (file === '_document.js' || file === '_document.tsx') continue;
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for imports of Html from next/document
      if (content.includes('next/document') && (content.includes('Html') || content.includes('<Html'))) {
        console.log(`Found potential Html import in: ${filePath}`);
        
        // Extract the import line
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('next/document') && lines[i].includes('Html')) {
            console.log(`  Line ${i + 1}: ${lines[i].trim()}`);
          }
          if (lines[i].includes('<Html')) {
            console.log(`  Line ${i + 1}: ${lines[i].trim()}`);
          }
        }
      }
    }
  }
}

// Start from the src directory
findHtmlImportsInDirectory(path.join(__dirname, 'src'));
