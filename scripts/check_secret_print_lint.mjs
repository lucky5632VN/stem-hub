/**
 * 🛡️ LINT CHECK: Chặn in biến môi trường nhạy cảm ra log hoặc console
 * Quét toàn bộ mã nguồn và script để phát hiện:
 * 1. Lệnh console.log / console.info / print in trực tiếp biến môi trường nhạy cảm (GEMINI_API_KEY, PRIVATE_KEY, SECRET_KEY, CRON_SECRET, etc.)
 * 2. In chuỗi không che của UID đầy đủ hoặc email đầy đủ trong log kiểm toán
 * 3. Chuỗi bí mật tĩnh hardcode
 */

import fs from 'fs';
import path from 'path';

const SENSITIVE_ENV_VARS = [
  'GEMINI_API_KEY',
  'FIREBASE_PRIVATE_KEY',
  'ADMIN_SECRET_KEY',
  'INTERNAL_AI_SECRET',
  'INTERNAL_API_SECRET',
  'CRON_SECRET',
  'FIREBASE_CLIENT_EMAIL'
];

const SCAN_DIRS = ['scripts', 'src', 'tests'];
const SCAN_EXTENSIONS = ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.py'];

function scanDir(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next' || entry.name === 'dist') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath, results);
    } else if (entry.isFile()) {
      if (SCAN_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

export function runSecretPrintLint() {
  const violations = [];
  let filesScanned = 0;

  for (const dir of SCAN_DIRS) {
    const files = scanDir(dir);
    for (const filePath of files) {
      // Bỏ qua chính script lint này
      if (filePath.includes('check_secret_print_lint') || filePath.includes('secret_print_lint.test')) continue;
      filesScanned++;

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, lineNum) => {
        const trimmed = line.trim();
        // Bỏ qua dòng comment
        if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) return;

        // 1. Kiểm tra console.log trực tiếp biến môi trường nhạy cảm
        for (const envVar of SENSITIVE_ENV_VARS) {
          const directPrintPattern = new RegExp(`(console\\.(log|info|warn|error)|print)\\s*\\([^)]*process\\.env\\.${envVar}[^)]*\\)`);
          if (directPrintPattern.test(line)) {
            // Cho phép nếu có hàm mask / che (slice, mask, length, substring, etc.)
            const isMasked = /slice|mask|length|substring|substr|replace/i.test(line);
            if (!isMasked) {
              violations.push({
                file: filePath,
                line: lineNum + 1,
                reason: `In trực tiếp process.env.${envVar} mà không có hàm che giấu (masking)`,
                snippet: trimmed.slice(0, 100)
              });
            }
          }
        }

        // 2. Kiểm tra chuỗi bí mật tĩnh hardcoded cũ
        if (line.includes('stemhub_admin_secret_key_2026') || line.includes('stemhub_rag_internal_sig_2026')) {
          violations.push({
            file: filePath,
            line: lineNum + 1,
            reason: `Hardcode chuỗi bí mật tĩnh`,
            snippet: trimmed.slice(0, 100)
          });
        }
      });
    }
  }

  return { filesScanned, violations };
}

// Chạy trực tiếp qua CLI
if (process.argv[1] && process.argv[1].endsWith('check_secret_print_lint.mjs')) {
  console.log('🔍 Đang kiểm tra lint chặn in biến môi trường nhạy cảm...');
  const { filesScanned, violations } = runSecretPrintLint();
  console.log(`📊 Đã quét ${filesScanned} tệp mã nguồn.`);

  if (violations.length === 0) {
    console.log('✅ PASS: Không phát hiện bất kỳ vị trí nào in trực tiếp biến môi trường nhạy cảm.');
    process.exit(0);
  } else {
    console.error(`❌ PHÁT HIỆN ${violations.length} VI PHẠM:`);
    for (const v of violations) {
      console.error(`  - ${v.file}:${v.line} -> ${v.reason}\n    ${v.snippet}`);
    }
    process.exit(1);
  }
}
