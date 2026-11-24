const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const searchTerms = [
  'Lê Văn Hùng', 'Le Van Hung',
  'Đặng Thị Bích Thủy', 'Đặng Thị Bích Thuỷ', 'Dang Thi Bich Thuy',
  'Nguyễn Trọng Nghĩa', 'Nguyen Trong Nghia',
  'Vũ Thị Hoàng Yến', 'Vu Thi Hoang Yen',
  'Tổ Chuyên Môn', 'to chuyen mon',
  'đã được giáo viên',
  'verified_by_teacher'
];

const ALLOWED_EXT = new Set(['.js', '.jsx', '.json', '.md', '.csv', '.html', '.ts', '.tsx', '.txt', '.mjs']);

function walkDir(dir, callback) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    // skip webpack pack binary cache
    if (fullPath.includes('.next' + path.sep + 'cache')) continue;
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (ALLOWED_EXT.has(ext)) {
        callback(fullPath);
      }
    }
  }
}

console.log('=== 1. FILE SCAN IN WORKSPACE ===');
const results = [];
walkDir('.', (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const lowerLine = line.toLowerCase();
      for (const term of searchTerms) {
        if (lowerLine.includes(term.toLowerCase())) {
          results.push({
            file: filePath.replace(/\\/g, '/'),
            line: idx + 1,
            term: term,
            snippet: line.trim().substring(0, 160)
          });
        }
      }
    });
  } catch (e) {
    // skip
  }
});

console.log(`Total occurrences in workspace files: ${results.length}`);
results.forEach(r => {
  console.log(`${r.file}:${r.line} [${r.term}] => ${r.snippet}`);
});

console.log('\n=== 2. GIT COMMIT HISTORY SCAN (git log -S) ===');
const gitTerms = [
  'Lê Văn Hùng',
  'Đặng Thị Bích Thủy',
  'Đặng Thị Bích Thuỷ',
  'Nguyễn Trọng Nghĩa',
  'Vũ Thị Hoàng Yến',
  'Tổ Chuyên Môn'
];

for (const term of gitTerms) {
  try {
    const out = execSync(`git --no-pager log -S "${term}" --oneline -- ":!*.doc" ":!*.docx"`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    console.log(`git log -S "${term}":`);
    console.log(out.trim() || '  (none)');
  } catch (err) {
    console.log(`Error running git log -S "${term}":`, err.message);
  }
}
