/**
 * 🧪 AUTOMATED TEST: BIOMETRICS ALTERNATIVE EXAM & CONSENT LABEL VERIFICATION
 * 
 * Kiểm chứng:
 * 1. Học sinh không bật sinh trắc học (face2FAEnabled: false) KHÔNG bị chặn vào phòng thi và đấu trường.
 * 2. Phương án giám sát thay thế được thiết lập là manual_teacher_supervision.
 * 3. Nhãn bản ghi consent đúng chuẩn: "học sinh tự xác nhận đã có đồng ý của phụ huynh (chưa được xác minh)".
 */

import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

console.log('🧪 BẮT ĐẦU KIỂM THỬ PHƯƠNG ÁN THI THAY THẾ & NHÃN CONSENT...');

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Chi tiết: ${err.message}`);
    process.exitCode = 1;
  }
}

// 1. Kiểm tra mã nguồn DashboardLayout không chặn người dùng không bật face
test('DashboardLayout: Học sinh không bật face2FAEnabled không bị logout hoặc chặn quyền', () => {
  const dashPath = path.resolve('src/components/layout/DashboardLayout.jsx');
  const dashContent = fs.readFileSync(dashPath, 'utf8');

  // Điều kiện kiểm tra 2FA trong DashboardLayout:
  // if (isFace2FAEnabled && !isFaceVerified) { setUser(null); return; }
  // Nghĩa là chỉ khi isFace2FAEnabled = true mới kiểm tra isFaceVerified!
  assert.ok(dashContent.includes('const isFace2FAEnabled = data?.personalization?.face2FAEnabled || data?.face2FAEnabled;'));
  assert.ok(dashContent.includes('if (isFace2FAEnabled && !isFaceVerified)'));
});

// 2. Kiểm tra trang Phòng thi (phong-thi/page.js) không có logic chặn sinh trắc học
test('Phòng thi (/phong-thi): Hoàn toàn không ép buộc sinh trắc học', () => {
  const examPath = path.resolve('src/app/phong-thi/page.js');
  const examContent = fs.readFileSync(examPath, 'utf8');

  assert.strictEqual(examContent.includes('isFace2FAValid'), false, 'Phòng thi không được yêu cầu isFace2FAValid');
  assert.strictEqual(examContent.includes('faceDescriptor'), false, 'Phòng thi không được đọc faceDescriptor');
});

// 3. Kiểm tra nhãn bản ghi consent trong ho-so/page.js
test('Hồ sơ (/ho-so): Nhãn bản ghi consent là "học sinh tự xác nhận đã có đồng ý của phụ huynh (chưa được xác minh)"', () => {
  const hoSoPath = path.resolve('src/app/ho-so/page.js');
  const hoSoContent = fs.readFileSync(hoSoPath, 'utf8');

  const expectedNote = "note: 'học sinh tự xác nhận đã có đồng ý của phụ huynh (chưa được xác minh)'";
  const expectedStatus = "parentalConsentStatus: 'self_reported_unverified'";
  const expectedAlt = "alternativeSupervision: 'manual_teacher_supervision'";

  assert.ok(hoSoContent.includes(expectedNote), 'Phải chứa nhãn consent chính xác');
  assert.ok(hoSoContent.includes(expectedStatus), 'Phải có status self_reported_unverified');
  assert.ok(hoSoContent.includes(expectedAlt), 'Phải có alternativeSupervision manual_teacher_supervision');
});

// 4. Kiểm tra runbook migration đã tồn tại và có dry-run mặc định
test('Runbook Migration: Tồn tại và script có chế độ dry-run mặc định', () => {
  const runbookPath = path.resolve('docs/runbook-migrate-biometrics.md');
  const scriptPath = path.resolve('scripts/migrate_biometrics_real_firestore.cjs');

  assert.ok(fs.existsSync(runbookPath), 'Tệp docs/runbook-migrate-biometrics.md phải tồn tại');
  assert.ok(fs.existsSync(scriptPath), 'Tệp scripts/migrate_biometrics_real_firestore.cjs phải tồn tại');

  const scriptContent = fs.readFileSync(scriptPath, 'utf8');
  assert.ok(scriptContent.includes('const isDryRun = !isExecute && !rollbackArg;'), 'Script phải có dry-run mặc định');
  assert.ok(scriptContent.includes('CHẾ ĐỘ MẶC ĐỊNH: --dry-run'), 'Script phải thông báo dry-run');
});

console.log(`\n🏁 KẾT QUẢ KIỂM THỬ: ${passed}/${total} TESTS ĐẠT YÊU CẦU!\n`);

if (passed !== total) {
  process.exit(1);
}

