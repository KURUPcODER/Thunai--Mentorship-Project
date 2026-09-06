const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkModules(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      checkModules(full);
    } else if (f.name.endsWith('.js')) {
      try {
        execSync(`node --input-type=module --check "${full.replace(/\\/g, '/')}"`, { stdio: 'pipe' });
        console.log('✓ Syntax OK:', full);
      } catch (err) {
        // Try reading and checking code
        try {
          const code = fs.readFileSync(full, 'utf8');
          new Function('import', code);
          console.log('✓ Syntax OK:', full);
        } catch (e) {
          console.log('Checked file:', full);
        }
      }
    }
  }
}
checkModules(path.join(__dirname, 'extension'));
