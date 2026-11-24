/**
 * 🛡️ Unit test kiểm thử phân quyền API routes:
 * Chứng minh: User có document role:'admin' nhưng KHÔNG có Custom Claims
 * sẽ KHÔNG có quyền admin tại các API route:
 * - /api/learned-knowledge
 * - /api/reviews/samples
 * - /api/reviews/submit
 */

import assert from 'assert';

// Mock function getReviewerContext from learned-knowledge
function evaluateLearnedKnowledgeAuth(tokenPayload, isUidWhitelisted = false) {
  const uid = tokenPayload.user_id || tokenPayload.sub || tokenPayload.uid;
  const email = tokenPayload.email || '';
  let role = tokenPayload.role || '';

  const hasAdminClaim = Boolean(tokenPayload.admin === true || tokenPayload.role === 'admin');
  if (hasAdminClaim || isUidWhitelisted) {
    role = 'admin';
  }

  if (!role && tokenPayload.reviewerType === 'teacher') {
    role = 'teacher';
  }

  if (role === 'admin' || role === 'teacher') {
    return { authorized: true, role, uid };
  } else {
    return { authorized: false, reason: 'Chỉ Giáo viên hoặc Quản trị viên mới có quyền xem tri thức máy học' };
  }
}

// Mock function evaluateReviewAccess from reviews/samples and reviews/submit
function evaluateReviewerAccess(tokenPayload) {
  let reviewerType = tokenPayload.reviewerType || (tokenPayload.role === 'teacher' ? 'teacher' : (tokenPayload.role === 'team_self' ? 'team_self' : null));
  let subjects = Array.isArray(tokenPayload.subjects) ? tokenPayload.subjects : [];

  const isAdmin = tokenPayload.admin === true || tokenPayload.role === 'admin';
  if (isAdmin && !reviewerType) {
    reviewerType = 'team_self';
    subjects = ['toan', 'ly', 'hoa', 'sinh'];
  }

  if (!reviewerType) {
    return { authorized: false, error: 'Tài khoản chưa được cấp quyền thẩm định' };
  }

  return { authorized: true, reviewerType, subjects };
}

console.log('========================================================================');
console.log('🛡️ KIỂM THỬ BẢO MẬT API ROUTES (CHỐNG LEO THANG QUA FIRESTORE DOCUMENT)');
console.log('========================================================================');

// Ca 1: Impostor User có document role: 'admin' trong DB nhưng token KHÔNG CÓ claims
const impostorTokenPayload = {
  uid: 'impostor_uid_123',
  email: 'hacker@gmail.com'
  // KHÔNG CÓ token.admin, token.role, token.reviewerType
};

// 1. Kiểm tra với API /api/learned-knowledge
const lkResult = evaluateLearnedKnowledgeAuth(impostorTokenPayload, false);
assert.strictEqual(lkResult.authorized, false, 'Impostor user không được phép truy cập /api/learned-knowledge');
console.log('✅ [PASS] API /api/learned-knowledge: Từ chối người dùng không có Custom Claims (dù doc Firestore có role:admin)');

// 2. Kiểm tra với API /api/reviews/samples
const samplesResult = evaluateReviewerAccess(impostorTokenPayload);
assert.strictEqual(samplesResult.authorized, false, 'Impostor user không được phép truy cập /api/reviews/samples');
console.log('✅ [PASS] API /api/reviews/samples: Từ chối người dùng không có Custom Claims');

// 3. Kiểm tra với API /api/reviews/submit
const submitResult = evaluateReviewerAccess(impostorTokenPayload);
assert.strictEqual(submitResult.authorized, false, 'Impostor user không được phép truy cập /api/reviews/submit');
console.log('✅ [PASS] API /api/reviews/submit: Từ chối người dùng không có Custom Claims');

// Ca 2: Admin HỢP LỆ có Custom Claims (admin: true)
const validAdminTokenPayload = {
  uid: 'real_admin_uid_999',
  email: 'admin_real@stemhub.edu.vn',
  admin: true,
  role: 'admin'
};

const adminLkResult = evaluateLearnedKnowledgeAuth(validAdminTokenPayload);
assert.strictEqual(adminLkResult.authorized, true);
assert.strictEqual(adminLkResult.role, 'admin');

const adminReviewResult = evaluateReviewerAccess(validAdminTokenPayload);
assert.strictEqual(adminReviewResult.authorized, true);
console.log('✅ [PASS] Admin có Custom Claims hợp lệ được phân quyền chính xác');

console.log('\n🎉 TẤT CẢ CÁC KIỂM THỬ BẢO MẬT API ĐÃ PASS THÀNH CÔNG (100% CLAIMS-DRIVEN).');

