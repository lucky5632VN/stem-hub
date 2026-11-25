/**
 * 🧪 TEST SUITE: BAN GIÁM KHẢO (JUDGE) READ-ONLY RBAC ON TEACHER REVIEW PORTAL
 *
 * Kiểm tra cấu trúc chốt chặn 2 lớp (Server API + Client UI):
 * 1. GET /api/reviews/samples: Cho phép judge (isJudge/reviewerType='judge') xem mẫu blinded cả 4 môn.
 * 2. POST /api/reviews/submit: Chặn judge với HTTP 403.
 * 3. POST /api/reviews/answer-key-check: Chỉ cho phép Admin hoặc Giáo viên Toán (chặn judge với HTTP 403).
 * 4. POST /api/reviews/consent: Chặn judge ghi nhận đồng thuận với HTTP 403.
 * 5. UI /danh-gia-chuyen-mon: Cho phép judge vào Tab 1 (Chấm Mẫu) ở chế độ Chỉ Xem, vô hiệu hóa các nút/ô nhập ghi dữ liệu.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

let passed = 0;
let total = 0;

function it(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Lỗi: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('========================================================================');
console.log('🛡️ KIỂM THỬ CHẾ ĐỘ CHỈ XEM (READ-ONLY) CHO BAN GIÁM KHẢO (JUDGE)');
console.log('========================================================================\n');

const samplesRoute = fs.readFileSync(path.resolve('src/app/api/reviews/samples/route.js'), 'utf8');
const submitRoute = fs.readFileSync(path.resolve('src/app/api/reviews/submit/route.js'), 'utf8');
const answerKeyRoute = fs.readFileSync(path.resolve('src/app/api/reviews/answer-key-check/route.js'), 'utf8');
const consentRoute = fs.readFileSync(path.resolve('src/app/api/reviews/consent/route.js'), 'utf8');
const portalPage = fs.readFileSync(path.resolve('src/app/danh-gia-chuyen-mon/page.js'), 'utf8');

it('1. GET /api/reviews/samples nhận diện judge và mở 4 môn chế độ đọc', () => {
  assert(
    samplesRoute.includes("const isJudge = payload.reviewerType === 'judge' || payload.isJudge === true;"),
    'Thiếu logic nhận diện claim judge'
  );
  assert(
    samplesRoute.includes('if (isJudge && !isAdmin)') && samplesRoute.includes("reviewerType = 'judge'"),
    'Thiếu gán reviewerType = judge cho tài khoản judge'
  );
  assert(
    samplesRoute.includes("subjects = ['toan', 'ly', 'hoa', 'sinh']"),
    'Judge phải được cấp danh sách 4 môn để xem giao diện chấm mẫu'
  );
});

it('2. POST /api/reviews/submit chặn tuyệt đối tài khoản judge (403)', () => {
  assert(
    submitRoute.includes("if (reviewerType === 'judge' && !isAdmin)"),
    'Thiếu nhánh chặn explicit cho judge khi submit phiếu chấm'
  );
  assert(
    submitRoute.includes('status: 403'),
    'Phải trả về HTTP 403 khi judge cố gửi phiếu chấm'
  );
});

it('3. POST /api/reviews/answer-key-check chỉ cho phép Admin hoặc Giáo viên Toán (chặn judge)', () => {
  assert(
    answerKeyRoute.includes("const isTeacher = reviewerType === 'teacher' || payload.role === 'teacher';"),
    'Thiếu kiểm tra isTeacher tường minh'
  );
  assert(
    answerKeyRoute.includes("if (!isAdmin && (!isTeacher || (subjects.length > 0 && !subjects.includes('toan'))))"),
    'Chưa khóa chặt POST answer-key-check trước vai trò judge/học sinh'
  );
});

it('4. POST /api/reviews/consent chặn judge lưu/thay đổi cam kết đồng thuận', () => {
  assert(
    consentRoute.includes("if ((payload.reviewerType === 'judge' || payload.isJudge === true) && !isAdmin)"),
    'Thiếu kiểm tra chặn judge ở POST /api/reviews/consent'
  );
});

it('5. UI /danh-gia-chuyen-mon nhập Eye, cho phép judge xem Tab 1 và khóa thao tác ghi', () => {
  assert(
    portalPage.includes('Eye,') && portalPage.includes('<Eye '),
    'Thiếu import hoặc render icon Eye'
  );
  assert(
    portalPage.includes("const isReadOnlyJudge = reviewerType === 'judge' && !isAdmin;"),
    'Thiếu biến isReadOnlyJudge'
  );
  assert(
    portalPage.includes("reviewerType !== 'teacher' && reviewerType !== 'judge' && !isAdmin"),
    'Tab 1 phải cho phép judge xem thay vì ẩn toàn bộ'
  );
  assert(
    portalPage.includes('if (isReadOnlyJudge)') &&
      portalPage.includes('disabled={isReadOnlyJudge}') &&
      portalPage.includes('disabled={submitting || isReadOnlyJudge}') &&
      portalPage.includes('disabled={savingConsent || isReadOnlyJudge}'),
    'Thiếu khóa nút/ô nhập liệu khi isReadOnlyJudge = true'
  );
});

console.log(`\n📊 Tổng kết: ${passed}/${total} test passed.`);
if (passed !== total) process.exit(1);

