import assert from 'assert';
import { runSecretPrintLint } from '../scripts/check_secret_print_lint.mjs';

console.log('=== TEST: LINT CHẶN IN BIẾN MÔI TRƯỜNG NHẠY CẢM ===');

const result = runSecretPrintLint();
console.log(`Đã quét ${result.filesScanned} tệp tin.`);

if (result.violations.length > 0) {
  console.error('Các vi phạm phát hiện:', result.violations);
}

assert.strictEqual(result.violations.length, 0, `Phát hiện ${result.violations.length} vi phạm in bí mật trong mã nguồn!`);
console.log('✅ [PASS] Tất cả các script và mã nguồn tuân thủ: không in trực tiếp biến môi trường nhạy cảm.');
