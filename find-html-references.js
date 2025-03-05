const fs = require('fs');
const path = require('path');

// Function to search for Html references in a file
function searchForHtmlReferencesInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip _document.tsx since it's expected to have Html
    if (filePath.includes('_document.tsx')) {
      return false;
    }
    
    // Check for <Html or <Html> pattern which would indicate usage of the Html component
    const htmlTagRegex = /<Html[>\s]/;
    const hasHtmlTag = htmlTagRegex.test(content);
    
    if (hasHtmlTag) {
      console.log(`Found <Html> tag in: ${filePath}`);
      
      // Extract the lines with Html for context
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('<Html')) {
          console.log(`  Line ${i+1}: ${lines[i].trim()}`);
          // Show a few lines of context
          for (let j = Math.max(0, i-2); j <= Math.min(lines.length-1, i+2); j++) {
            if (j !== i) {
              console.log(`  Line ${j+1}: ${lines[j].trim()}`);
            }
          }
        }
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
    return false;
  }
}

// Function to recursively search directories
function searchDirectory(dir) {
  let count = 0;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
      count += searchDirectory(filePath);
    } else if (stat.isFile() && (filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.ts') || filePath.endsWith('.tsx'))) {
      if (searchForHtmlReferencesInFile(filePath)) {
        count++;
      }
    }
  }
  
  return count;
}

// Start the search from the src directory
const srcDir = path.join(__dirname, 'src');
console.log(`Searching for <Html> tags in ${srcDir}...`);

const count = searchDirectory(srcDir);
console.log(`\nFound ${count} files with <Html> tags outside of _document.tsx`);
