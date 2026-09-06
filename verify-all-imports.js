const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'extension');

function getAllJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getAllJsFiles(fullPath));
    } else if (item.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = getAllJsFiles(baseDir);
console.log('Verifying imports for', files.length, 'files...');

let hasError = false;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const importRegex = /import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const namedImports = match[1] ? match[1].split(',').map(s => s.trim()) : [];
    const importPath = match[4];
    
    if (importPath.startsWith('.')) {
      const resolvedPath = path.resolve(path.dirname(file), importPath);
      if (!fs.existsSync(resolvedPath)) {
        console.error(`❌ Missing file: "${importPath}" imported from "${file}"`);
        hasError = true;
        continue;
      }

      const targetContent = fs.readFileSync(resolvedPath, 'utf8');
      for (const named of namedImports) {
        if (!named) continue;
        const exportRegex = new RegExp(`export\\s+(?:async\\s+)?(const|let|var|function|class)\\s+${named}\\b|export\\s+\\{[^}]*\\b${named}\\b[^}]*\\}`);
        if (!exportRegex.test(targetContent)) {
          console.error(`❌ Export "${named}" not found in "${resolvedPath}" (imported by "${file}")`);
          hasError = true;
        }
      }
    }
  }
}

if (!hasError) {
  console.log('✅ ALL IMPORTS AND EXPORTS ARE 100% VALID!');
} else {
  process.exit(1);
}
