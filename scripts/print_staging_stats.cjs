const fs = require('fs');
const path = require('path');

const stagingDir = path.resolve('scratch/staging_submission');
if (!fs.existsSync(stagingDir)) {
  console.log('Staging dir does not exist yet');
  process.exit(0);
}

console.log('=== DANH SÁCH THƯ MỤC CẤP 1 CỦA STAGING ===');
const entries = fs.readdirSync(stagingDir, { withFileTypes: true });
const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
console.log(dirs.join('\n'));

console.log('\n=== 20 TỆP LỚN NHẤT CỦA STAGING ===');
const allFiles = [];
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      walk(full);
    } else if (item.isFile()) {
      const stats = fs.statSync(full);
      const rel = path.relative(stagingDir, full).replace(/\\/g, '/');
      allFiles.push({ path: rel, sizeBytes: stats.size, sizeKB: (stats.size / 1024).toFixed(1) });
    }
  }
}
walk(stagingDir);

allFiles.sort((a, b) => b.sizeBytes - a.sizeBytes);
allFiles.slice(0, 20).forEach((f, idx) => {
  console.log(`${idx + 1}. ${f.path} (${f.sizeKB} KB)`);
});

