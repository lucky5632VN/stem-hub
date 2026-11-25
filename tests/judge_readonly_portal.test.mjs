/**
 * 🧪 TEST SUITE: NON-STUDENT READ ACCESS, TEACHER-ONLY EDIT RBAC & NAV BUTTON VISIBILITY
 *
 * Kiểm tra cấu trúc chốt chặn 2 lớp (Server API + Client UI & Navigation):
 * 1. evaluateReviewPortalAccess: Chặn học sinh/khách, cho phép mọi role khác vào xem, chỉ Giáo viên được chỉnh sửa/cập nhật.
 * 2. GET /api/reviews/samples: Dùng evaluateReviewPortalAccess (chặn học sinh 403, mở các role khác xem).
 * 3. POST /api/reviews/submit, /api/reviews/consent, /api/reviews/answer-key-check: Chỉ vai trò Giáo viên (teacher) mới được ghi/cập nhật.
 * 4. Nút điều hướng "Thẩm định chuyên môn" (/danh-gia-chuyen-mon) hiển thị cho non-student trong Sidebar, SettingsDropdown và AdminSidebar.
 * 5. UI /danh-gia-chuyen-mon: Chỉ chặn student/guest; các role khác (judge, admin thuần, team_self...) vào xem Read-Only; chỉ teacher được chỉnh sửa.
 * 6. evaluateReportComparisonAccess: Mở 3 chế độ 150 ca cho Admin & BGK, ẩn khỏi giáo viên thuần.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  evaluateReportComparisonAccess,
  evaluateReviewPortalAccess
} from '../src/lib/reviewAgreement.js';
import { dedupePoolQuestions, sampleForReviewer } from '../src/lib/reviewSampler.js';

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
console.log('🛡️ KIỂM THỬ PHÂN QUYỀN CỔNG THẨM ĐỊNH & NÚT ĐIỀU HƯỚNG THEO VAI TRÒ');
console.log('========================================================================\n');

const samplesRoute = fs.readFileSync(path.resolve('src/app/api/reviews/samples/route.js'), 'utf8');
const submitRoute = fs.readFileSync(path.resolve('src/app/api/reviews/submit/route.js'), 'utf8');
const answerKeyRoute = fs.readFileSync(path.resolve('src/app/api/reviews/answer-key-check/route.js'), 'utf8');
const consentRoute = fs.readFileSync(path.resolve('src/app/api/reviews/consent/route.js'), 'utf8');
const reportRoute = fs.readFileSync(path.resolve('src/app/api/reviews/report/route.js'), 'utf8');
const portalPage = fs.readFileSync(path.resolve('src/app/danh-gia-chuyen-mon/page.js'), 'utf8');
const sidebarComp = fs.readFileSync(path.resolve('src/components/layout/Sidebar.jsx'), 'utf8');
const adminSidebarComp = fs.readFileSync(path.resolve('src/components/admin/AdminSidebar.jsx'), 'utf8');
const settingsDropdownComp = fs.readFileSync(path.resolve('src/components/organisms/SettingsDropdown.jsx'), 'utf8');

it('1. evaluateReviewPortalAccess: trừ học sinh mọi role đều vào được, chỉ giáo viên được sửa', () => {
  const guest = evaluateReviewPortalAccess(null);
  assert.strictEqual(guest.canEnterPortal, false);
  assert.strictEqual(guest.canEditReviews, false);

  const studentEmpty = evaluateReviewPortalAccess({ uid: 'hs1' });
  assert.strictEqual(studentEmpty.canEnterPortal, false, 'Tài khoản mặc định chưa cấp role bị coi là học sinh');
  assert.strictEqual(studentEmpty.canEditReviews, false);

  const studentExplicit = evaluateReviewPortalAccess({ uid: 'hs2', role: 'student', reviewerType: null });
  assert.strictEqual(studentExplicit.canEnterPortal, false);
  assert.strictEqual(studentExplicit.canEditReviews, false);

  const judge = evaluateReviewPortalAccess({ reviewerType: 'judge', isJudge: true });
  assert.strictEqual(judge.canEnterPortal, true);
  assert.strictEqual(judge.canEditReviews, false, 'BGK vào xem được nhưng không được sửa');

  const adminOnly = evaluateReviewPortalAccess({ admin: true, role: 'admin' });
  assert.strictEqual(adminOnly.canEnterPortal, true);
  assert.strictEqual(adminOnly.canEditReviews, false, 'Admin không có vai trò GV chỉ vào xem (Read-Only)');

  const teamSelf = evaluateReviewPortalAccess({ role: 'team_self', reviewerType: 'team_self' });
  assert.strictEqual(teamSelf.canEnterPortal, true);
  assert.strictEqual(teamSelf.canEditReviews, false, 'Thành viên nhóm vào xem được nhưng không được sửa');

  const customModerator = evaluateReviewPortalAccess({ role: 'moderator' });
  assert.strictEqual(customModerator.canEnterPortal, true);
  assert.strictEqual(customModerator.canEditReviews, false);

  const teacher = evaluateReviewPortalAccess({ role: 'teacher', reviewerType: 'teacher' });
  assert.strictEqual(teacher.canEnterPortal, true);
  assert.strictEqual(teacher.canEditReviews, true, 'Giáo viên được vào và được chỉnh sửa/chấm điểm');

  const adminPlusTeacher = evaluateReviewPortalAccess({ admin: true, role: 'teacher', reviewerType: 'teacher' });
  assert.strictEqual(adminPlusTeacher.canEnterPortal, true);
  assert.strictEqual(adminPlusTeacher.isAdmin, true);
  assert.strictEqual(adminPlusTeacher.canEditReviews, true, 'Tài khoản vừa Admin vừa Giáo viên giữ quyền chỉnh sửa');
});

it('2. API samples/submit/consent/answer-key-check chặn học sinh và chỉ cho role teacher chỉnh sửa', () => {
  assert(
    samplesRoute.includes('evaluateReviewPortalAccess(payload, { adminUids })') &&
      samplesRoute.includes('if (!portalAccess.canEnterPortal)') &&
      samplesRoute.includes('canEditReviews: portalAccess.canEditReviews'),
    'GET /api/reviews/samples phải chặn học sinh (403) và mở cho các role khác'
  );
  assert(
    submitRoute.includes('evaluateReviewPortalAccess(payload, { adminUids })') &&
      submitRoute.includes('if (!portalAccess.canEditReviews)') &&
      !submitRoute.includes('if (isAdmin && reviewerType !== \'teacher\')'),
    'POST /api/reviews/submit chỉ cho phép role teacher gửi phiếu'
  );
  assert(
    consentRoute.includes('evaluateReviewPortalAccess(payload, { adminUids })') &&
      consentRoute.includes('if (!portalAccess.canEditReviews)'),
    'POST /api/reviews/consent chỉ cho phép role teacher cập nhật cam kết'
  );
  assert(
    answerKeyRoute.includes('if (!isTeacher || (!isAdmin && subjects.length > 0 && !subjects.includes(\'toan\')))'),
    'POST /api/reviews/answer-key-check phải yêu cầu isTeacher'
  );
});

it('3. Nút điều hướng Thẩm định chuyên môn có mặt trên Sidebar, SettingsDropdown và AdminSidebar', () => {
  assert(
    sidebarComp.includes("href: '/danh-gia-chuyen-mon'") &&
      sidebarComp.includes('evaluateReviewPortalAccess') &&
      sidebarComp.includes('canEnterReviewPortal'),
    'Sidebar phải có nút Thẩm định chuyên môn ẩn với học sinh và hiện cho role khác'
  );
  assert(
    settingsDropdownComp.includes("router.push('/danh-gia-chuyen-mon')") &&
      settingsDropdownComp.includes('canEnterReviewPortal'),
    'SettingsDropdown phải có nút nhấn vào /danh-gia-chuyen-mon cho non-student'
  );
  assert(
    adminSidebarComp.includes("href: '/danh-gia-chuyen-mon'"),
    'AdminSidebar phải có nút nhấn vào /danh-gia-chuyen-mon'
  );
});

it('4. UI /danh-gia-chuyen-mon khóa chế độ chỉnh sửa cho mọi role khác ngoài teacher', () => {
  assert(
    portalPage.includes('Eye,') && portalPage.includes('<Eye '),
    'Thiếu import hoặc render icon Eye'
  );
  assert(
    portalPage.includes("reviewerType === 'student' || reviewerType === 'guest'") &&
      portalPage.includes('const isReadOnlyViewer = !isTeacherEditor;'),
    'UI phải cho mọi role trừ học sinh vào xem và khóa chỉnh sửa khi !isTeacherEditor'
  );
  assert(
    portalPage.includes('if (isReadOnlyViewer)') &&
      portalPage.includes('disabled={isReadOnlyViewer}') &&
      portalPage.includes('disabled={submitting || isReadOnlyViewer}') &&
      portalPage.includes('disabled={savingConsent || isReadOnlyViewer}'),
    'Thiếu khóa nút/ô nhập liệu khi isReadOnlyViewer = true'
  );
});

it('5. evaluateReportComparisonAccess chỉ mở 3 chế độ 150 ca cho Admin và BGK (judge); chặn giáo viên', () => {
  const unauthDefault = evaluateReportComparisonAccess(null, false);
  assert.strictEqual(unauthDefault.canViewComparisonTabs, false);

  const studentAccess = evaluateReportComparisonAccess({ role: 'student' }, false);
  assert.strictEqual(studentAccess.canViewComparisonTabs, false);

  const teacherDefault = evaluateReportComparisonAccess({ role: 'teacher', reviewerType: 'teacher' }, false);
  assert.strictEqual(teacherDefault.isTeacherOnly, true);
  assert.strictEqual(teacherDefault.canViewComparisonTabs, false);

  const teacherEvenWithEnv = evaluateReportComparisonAccess({ role: 'teacher', reviewerType: 'teacher' }, true);
  assert.strictEqual(teacherEvenWithEnv.canViewComparisonTabs, false);

  const judgeAccess = evaluateReportComparisonAccess({ reviewerType: 'judge', isJudge: true }, false);
  assert.strictEqual(judgeAccess.isJudge, true);
  assert.strictEqual(judgeAccess.canViewComparisonTabs, true);

  const adminAccess = evaluateReportComparisonAccess({ admin: true, role: 'admin' }, false);
  assert.strictEqual(adminAccess.isAdmin, true);
  assert.strictEqual(adminAccess.canViewComparisonTabs, true);

  const adminAlsoTeacher = evaluateReportComparisonAccess({ admin: true, role: 'teacher' }, false);
  assert.strictEqual(adminAlsoTeacher.isTeacherOnly, false);
  assert.strictEqual(adminAlsoTeacher.canViewComparisonTabs, true);

  assert(
    reportRoute.includes('evaluateReportComparisonAccess(callerClaims, enableSynthetic)') &&
      reportRoute.includes('canViewComparisonTabs: reportAccess.canViewComparisonTabs') &&
      reportRoute.includes("r.reviewerType === 'teacher' && !r.isDemo && !r.skipped"),
    'API report phải đồng bộ phân quyền và giữ nguyên bộ lọc !r.isDemo'
  );
});

it('6. Khử trùng lặp câu hỏi và mặc định ẩn câu đã chấm để tránh lặp lại/409', () => {
  const deduped = dedupePoolQuestions([
    { sampleId: 'a1', question: 'chuỗi DNA' },
    { sampleId: 'a2', question: '  Chuỗi   DNA ' },
    { sampleId: 'b1', question: 'Câu khác' }
  ]);
  assert.strictEqual(deduped.length, 2);
  assert.strictEqual(deduped[0].sampleId, 'a1');

  for (const subj of ['toan', 'ly', 'hoa', 'sinh']) {
    const res = sampleForReviewer({ subject: subj, seed: 2026, sampleSize: 999, reviewerUid: 'test_uid' });
    const normQuestions = res.samples.map(s => String(s.question || '').trim().toLowerCase().replace(/\s+/g, ' '));
    const uniqueQCount = new Set(normQuestions).size;
    assert.strictEqual(normQuestions.length, uniqueQCount, `Môn ${subj} không được chứa câu hỏi trùng lặp nội dung`);
  }

  assert(
    samplesRoute.includes('dedupePoolQuestions(') &&
      samplesRoute.includes('if (d.isDemo) return;') &&
      samplesRoute.includes('!currentReviewedSet.has(s.sampleId)'),
    'API samples phải khử trùng lặp và đẩy câu chưa chấm lên trước'
  );
  assert(
    portalPage.includes('showReviewedSamples') &&
      portalPage.includes('visibleSamples') &&
      portalPage.includes('isAmendment: needsAmendment'),
    'UI phải ẩn câu đã chấm theo mặc định và hỗ trợ gửi bản sửa đổi (amendment) hợp lệ'
  );
});

console.log(`\n📊 Tổng kết: ${passed}/${total} test passed.`);
if (passed !== total) process.exit(1);
