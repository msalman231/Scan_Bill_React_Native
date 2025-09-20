const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if server-package.json exists
const serverPackagePath = path.join(__dirname, 'server-package.json');
if (!fs.existsSync(serverPackagePath)) {
  console.error('server-package.json not found');
  process.exit(1);
}

// Copy server-package.json to package.json in a temporary directory
const tempDir = path.join(__dirname, 'temp-server');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const serverPackageJson = JSON.parse(fs.readFileSync(serverPackagePath, 'utf8'));
fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(serverPackageJson, null, 2));

// Copy fix-iconv.js to temp directory if it exists
const fixIconvPath = path.join(__dirname, 'fix-iconv.js');
const tempFixIconvPath = path.join(tempDir, 'fix-iconv.js');
if (fs.existsSync(fixIconvPath)) {
  const fixIconvContent = fs.readFileSync(fixIconvPath, 'utf8');
  fs.writeFileSync(tempFixIconvPath, fixIconvContent);
  
  // Update package.json to include the postinstall script
  serverPackageJson.scripts = serverPackageJson.scripts || {};
  serverPackageJson.scripts.postinstall = "node fix-iconv.js";
  fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(serverPackageJson, null, 2));
}

// Install server dependencies
console.log('Installing server dependencies...');
exec('npm install', { cwd: tempDir }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error installing dependencies: ${error.message}`);
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
    return;
  }
  
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    // Check if this is just a warning
    if (!stderr.includes('deprecated') && !stderr.includes('warn')) {
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
      return;
    }
  }
  
  console.log('Server dependencies installed successfully!');
  console.log(stdout);
  
  // Copy node_modules to server directory
  const serverNodeModulesPath = path.join(__dirname, 'server-node_modules');
  if (fs.existsSync(serverNodeModulesPath)) {
    fs.rmSync(serverNodeModulesPath, { recursive: true, force: true });
  }
  
  // Clean up temp directory
  fs.rmSync(tempDir, { recursive: true, force: true });
});