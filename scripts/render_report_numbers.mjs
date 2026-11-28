#!/usr/bin/env node
/**
 * Điền số liệu thật từ các tệp JSON kết quả vào khung báo cáo có placeholder {{kq:...}}.
 * Quy tắc trung thực:
 * - Nếu thiếu tệp nguồn hoặc thiếu khóa placeholder: THẤT BẠI (exit code 1), không điền ước lượng.
 * - Cách dùng: node scripts/render_report_numbers.mjs [--template <path>] [--out <path>]
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
function getArg(flag, fallback) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const templatePath = path.resolve(getArg('--template', 'docs/ke-hoach-6h/BAO_CAO_KHUNG.md'));
const outputPath = path.resolve(getArg('--out', 'docs/ke-hoach-6h/BAO_CAO_HOAN_CHINH.md'));

const SOURCE_FILES = [
  'reports/safety_eval_result.json',
  'reports/unit_test_summary.json',
  'reports/security_package_summary.json'
];

function flattenValues(obj, out = {}) {
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined && typeof v !== 'object') {
      out[k] = v;
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      flattenValues(v, out);
    }
  }
  return out;
}

function main() {
  if (!fs.existsSync(templatePath)) {
    console.error(`[FAIL] Không tìm thấy tệp khung báo cáo: ${templatePath}`);
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, 'utf8');
  const values = {};
  const missingFiles = [];

  for (const rel of SOURCE_FILES) {
    const abs = path.resolve(rel);
    if (!fs.existsSync(abs)) {
      missingFiles.push(rel);
      continue;
    }
    try {
      const parsed = JSON.parse(fs.readFileSync(abs, 'utf8'));
      flattenValues(parsed, values);
    } catch (err) {
      console.error(`[FAIL] Tệp JSON không hợp lệ (${rel}): ${err.message}`);
      process.exit(1);
    }
  }

  if (missingFiles.length > 0) {
    console.error('[FAIL] Thiếu tệp kết quả JSON bắt buộc:');
    missingFiles.forEach(f => console.error(`  - ${f}`));
    process.exit(1);
  }

  const placeholderRegex = /\{\{kq:([a-zA-Z0-9_]+)\}\}/g;
  const missingKeys = new Set();
  const rendered = template.replace(placeholderRegex, (full, key) => {
    if (!(key in values) || values[key] === '' || values[key] === null || values[key] === undefined) {
      missingKeys.add(key);
      return full;
    }
    return String(values[key]);
  });

  if (missingKeys.size > 0) {
    console.error('[FAIL] Thiếu giá trị thật cho các placeholder sau (KHÔNG điền bừa):');
    for (const k of missingKeys) {
      console.error(`  - {{kq:${k}}}`);
    }
    process.exit(1);
  }

  fs.writeFileSync(outputPath, rendered, 'utf8');
  console.log(`[PASS] Đã điền toàn bộ số liệu thật vào: ${path.relative(process.cwd(), outputPath)}`);
}

main();

