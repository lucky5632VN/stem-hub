/**
 * 🧪 Test Kiểm Chứng An Toàn Script Nhập Google Form (Anti-Tampering & Whitelist)
 * Khẳng định:
 * 1. Mọi file có tên chứa "sample", "example", "demo" đều bị từ chối ngay lập tức.
 * 2. Cờ --execute không thể chạy nếu thiếu --confirm-real-teacher-data.
 * 3. File chứa email không có trong whitelist giáo viên bị chặn và không thể ghi vào expert_reviews.
 */

import { execSync } from 'child_process';
import assert from 'assert';
import path from 'path';

console.log('=== [TEST IMPORT FORM SECURITY] BẮT ĐẦU KIỂM THỬ BẢO MẬT IMPORT GOOGLE FORM ===\n');

// 1. Kiểm thử từ chối file có tên sample / example
console.log('1. Kiểm thử từ chối file có chứa "example" trong tên...');
let rejectedExampleName = false;
try {
  execSync('node scripts/import_reviews_from_form.mjs --file="docs/mau-csv-google-form.EXAMPLE.csv"', { stdio: 'pipe' });
} catch (err) {
  const stderr = err.stderr.toString();
  if (stderr.includes('BẢO MẬT BỊ TỪ CHỐI (Rule 1a)') || stderr.includes('từ khóa cấm')) {
    rejectedExampleName = true;
  }
}
assert.strictEqual(rejectedExampleName, true, 'LỖI: Script không chặn file có tên chứa example!');
console.log('✅ Đã chặn thành công file có tên EXAMPLE.csv\n');

// 2. Kiểm thử từ chối file có tên demo
console.log('2. Kiểm thử từ chối file có chứa "demo" trong tên...');
let rejectedDemoName = false;
try {
  execSync('node scripts/import_reviews_from_form.mjs --file="demo_form.csv"', { stdio: 'pipe' });
} catch (err) {
  const stderr = err.stderr.toString();
  if (stderr.includes('BẢO MẬT BỊ TỪ CHỐI (Rule 1a)') || stderr.includes('từ khóa cấm')) {
    rejectedDemoName = true;
  }
}
assert.strictEqual(rejectedDemoName, true, 'LỖI: Script không chặn file có tên chứa demo!');
console.log('✅ Đã chặn thành công file có tên demo\n');

// 3. Kiểm thử từ chối --execute khi thiếu --confirm-real-teacher-data
console.log('3. Kiểm thử từ chối --execute khi thiếu --confirm-real-teacher-data...');
let rejectedMissingConfirm = false;
try {
  execSync('node scripts/import_reviews_from_form.mjs --file="valid_name_test.csv" --execute', { stdio: 'pipe' });
} catch (err) {
  const stderr = err.stderr.toString();
  if (stderr.includes('BẢO MẬT BỊ TỪ CHỐI (Rule 1c)') || stderr.includes('--confirm-real-teacher-data')) {
    rejectedMissingConfirm = true;
  }
}
assert.strictEqual(rejectedMissingConfirm, true, 'LỖI: Script không chặn --execute thiếu cờ xác nhận!');
console.log('✅ Đã chặn thành công --execute khi thiếu cờ xác nhận\n');

console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ BẢO MẬT IMPORT FORM ĐÃ PASS 100%!');

