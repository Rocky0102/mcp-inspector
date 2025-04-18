const fs = require('fs');
const path = require('path');

// Define source and destination directories
const sourceDir = path.join(__dirname, 'src', 'views', 'templates');
const destDir = path.join(__dirname, 'out', 'views', 'templates');

// Ensure the destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Files to copy
const filesToCopy = ['inspector.html', 'inspector.css', 'inspector.js'];

// Copy each file
filesToCopy.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(destDir, file);
  
  try {
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${file} to ${destDir}`);
    } else {
      console.error(`Source file not found: ${sourcePath}`);
    }
  } catch (err) {
    console.error(`Error copying ${file}: ${err.message}`);
  }
});

console.log('Asset copying completed.');
