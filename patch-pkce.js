const fs = require('fs');
const path = require('path');

// Path to pkce-challenge package.json
const pkcePackageJsonPath = path.join(__dirname, 'node_modules', 'pkce-challenge', 'package.json');

// Read the package.json file
try {
  const packageJson = JSON.parse(fs.readFileSync(pkcePackageJsonPath, 'utf8'));
  
  // Change type from "module" to "commonjs"
  packageJson.type = "commonjs";
  
  // Write the modified package.json back
  fs.writeFileSync(pkcePackageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
  
  console.log('Successfully patched pkce-challenge package.json to use CommonJS');
} catch (error) {
  console.error('Error patching pkce-challenge package.json:', error);
  process.exit(1);
}
