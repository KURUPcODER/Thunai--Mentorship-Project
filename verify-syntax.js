const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let totalChecked = 0;
let errors = 0;

function checkModules(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      checkModules(full);
    } else if (f.name.endsWith('.js')) {
      totalChecked++;
      try {
        const code = fs.readFileSync(full);
        execSync('node --input-type=module --check', { input: code, stdio: 'pipe' });
        console.log('✓ Syntax OK:', full);
      } catch (err) {
        console.error('❌ Syntax Error in:', full, '\n', err.stderr ? err.stderr.toString() : err.message);
        errors++;
      }
    }
  }
}

checkModules(path.join(__dirname, 'extension'));
console.log(`\nChecked ${totalChecked} files. Errors: ${errors}`);
if (errors > 0) process.exit(1);
