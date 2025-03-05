const fs = require('fs');
const path = require('path');

// Function to search for imports in a file
function searchForImportsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for any import from next/document
    const documentImportRegex = /import\s+[^;]*from\s+['"]next\/document['"]/;
    const hasDocumentImport = documentImportRegex.test(content);
    
    if (hasDocumentImport) {
      console.log(`Found next/document import in: ${filePath}`);
      
      // Extract the import line for context
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('import') && lines[i].includes('next/document')) {
          console.log(`  Line ${i+1}: ${lines[i].trim()}`);
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
      if (searchForImportsInFile(filePath)) {
        count++;
      }
    }
  }
  
  return count;
}

// Start the search from the src directory
const srcDir = path.join(__dirname, 'src');
console.log(`Searching for next/document imports in ${srcDir}...`);

const count = searchDirectory(srcDir);
console.log(`\nFound ${count} files with next/document imports`);
