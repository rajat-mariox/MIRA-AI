// Copies non-TS runtime assets (locale JSON files) from src/ to dist/ after `tsc`.
const fs = require('node:fs');
const path = require('node:path');
const src = path.join(__dirname, '..', 'src', 'locales');
const dest = path.join(__dirname, '..', 'dist', 'locales');
fs.mkdirSync(dest, { recursive: true });
for (const f of fs.readdirSync(src)) {
  if (f.endsWith('.json')) fs.copyFileSync(path.join(src, f), path.join(dest, f));
}
console.log('Copied locales to dist/locales');
