const fs = require('fs');
const path = require('path');

// Fix for iconv-lite missing encodings module
// This is a known issue with certain versions of iconv-lite

const iconvLitePath = path.join(__dirname, 'node_modules', 'iconv-lite');
const encodingsPath = path.join(iconvLitePath, 'encodings');

// Check if the encodings directory exists
if (fs.existsSync(iconvLitePath) && !fs.existsSync(encodingsPath)) {
  console.log('Fixing iconv-lite encodings issue...');
  
  // Create the encodings directory
  fs.mkdirSync(encodingsPath, { recursive: true });
  
  // Create a dummy index.js file in the encodings directory
  const indexPath = path.join(encodingsPath, 'index.js');
  fs.writeFileSync(indexPath, 'module.exports = {};\n');
  
  console.log('Fixed iconv-lite encodings issue');
} else {
  console.log('iconv-lite encodings directory already exists or iconv-lite not installed');
}