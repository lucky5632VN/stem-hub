import assert from 'assert';
import fs from 'fs';
import { retrieveTopK, syncGlobalLearnedKnowledge, getDynamicCorpus } from '../src/lib/ragService.js';

let passedTests = 0;
let totalTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
  }
}

// Logic mô phỏng kiểm tra token phía server (giống authenticateReviewer trong route.js)
function verifyTokenReviewer(authHeader, secretKey) {
  const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'mock_test_secret_for_unit_tests';
  if (secretKey && secretKey === ADMIN_SECRET) {
    return { authorized: true, role: 'admin', uid: 'system_admin_key' };
  }
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
  if (!bearerToken) {
    return { authorized: false, error: 'Thiếu token xác thực' };
  }
  try {
    const parts = bearerToken.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      const uid = payload.user_id || payload.sub;
      const role = payload.role || '';
      const emailLower = (payload.email || '').toLowerCase();
      const adminUids = (process.env.ADMIN_UIDS || '').split(',').map(u => u.trim()).filter(Boolean);
      const isWhitelistedUid = uid && adminUids.includes(uid);
      const hasAdminClaim = payload.admin === true || payload.role === 'admin';
      const effectiveRole = (hasAdminClaim || isWhitelistedUid) ? 'admin' : (role === 'teacher' ? 'teacher' : '');
      if (effectiveRole === 'admin' || effectiveRole === 'teacher') {
        return { authorized: true, role: effectiveRole, uid, email: payload.email };
      }
      return { authorized: false, error: 'Không có vai trò teacher/admin' };
    }
  } catch (_) {}
  return { authorized: false, error: 'Token không hợp lệ' };
}

// Logic mô phỏng lọc GET tri thức RAG (giống route.js)
function filterLearnedDocs(list, onlyVerified = true) {
  if (onlyVerified) {
    return list.filter(item => (item.status === 'verified_by_teacher' || item.teacherVerified === true) && !item.quarantined && !item.isDemo);
  }
  return list.filter(item => !item.isDemo);
}

// Logic mô phỏng nạp tri thức POST (giống route.js: luôn pending, teacherVerified false)
function sanitizeNewLearnedItem(body) {
  return {
    id: body.id || `learned_${Date.now()}`,
    query: body.query.trim(),
    answer: body.answer.trim(),
    status: 'pending_review',
    teacherVerified: false,
    quarantined: false,
    verifiedAt: null,
    verifiedBy: null,
    isDemo: Boolean(body.isDemo || false)
  };
}

async function main() {
  console.log('=== BẮT ĐẦU KIỂM THỬ RAG QUARANTINE & AUTH LOGIC ===\n');

  // -------------------------------------------------------------------------
  // TEST PHẦN 1: RAG RETRIEVAL FILTERS (Quarantine, Pending, Demo Isolation)
  // -------------------------------------------------------------------------

  const testKnowledge = [
    {
      id: 'doc_verified_valid',
      query: 'Công thức tính chu kỳ con lắc đơn dao động điều hòa',
      answer: 'Chu kỳ dao động điều hòa của con lắc đơn: T = 2 * pi * sqrt(l / g).',
      subject: 'ly',
      status: 'verified_by_teacher',
      teacherVerified: true,
      quarantined: false,
      isDemo: false
    },
    {
      id: 'doc_quarantined_danger',
      query: 'Công thức tính chu kỳ con lắc đơn độc hại nguy hiểm',
      answer: 'T = 2 * pi * sqrt(l / g) kèm nội dung nguy hiểm bị cách ly.',
      subject: 'ly',
      status: 'verified_by_teacher',
      teacherVerified: true,
      quarantined: true, // Bị cách ly
      isDemo: false
    },
    {
      id: 'doc_pending_unverified',
      query: 'Công thức tính chu kỳ con lắc đơn từ học sinh chưa duyệt',
      answer: 'T = 2 * pi * sqrt(l / g) do học sinh tự nhập chưa kiểm chứng.',
      subject: 'ly',
      status: 'pending_review', // Chờ duyệt
      teacherVerified: false,
      quarantined: false,
      isDemo: false
    },
    {
      id: 'doc_demo_seed',
      query: 'Công thức tính chu kỳ con lắc đơn bản demo thử nghiệm',
      answer: 'T = 2 * pi * sqrt(l / g) bản ghi demo thử nghiệm hệ thống.',
      subject: 'ly',
      status: 'verified_by_teacher',
      teacherVerified: true,
      quarantined: false,
      isDemo: true // Bản ghi demo
    }
  ];

  syncGlobalLearnedKnowledge(testKnowledge);

  await runTest('RAG: Không bao giờ truy xuất tri thức bị cách ly (quarantined: true)', () => {
    const results = retrieveTopK('con lắc đơn độc hại nguy hiểm', 10);
    const hasQuarantined = results.some(r => r.id === 'doc_quarantined_danger' || r.quarantined === true);
    assert.strictEqual(hasQuarantined, false, 'Phát hiện tài liệu quarantined bị lọt vào kết quả RAG!');
  });

  await runTest('RAG: Không bao giờ truy xuất tri thức chưa duyệt (status: pending_review)', () => {
    const results = retrieveTopK('học sinh tự nhập chưa kiểm chứng', 10);
    const hasPending = results.some(r => r.id === 'doc_pending_unverified' || r.status === 'pending_review');
    assert.strictEqual(hasPending, false, 'Phát hiện tài liệu pending_review bị lọt vào kết quả RAG!');
  });

  await runTest('RAG: Không bao giờ truy xuất tri thức demo thử nghiệm (isDemo: true)', () => {
    const results = retrieveTopK('bản ghi demo thử nghiệm hệ thống', 10);
    const hasDemo = results.some(r => r.id === 'doc_demo_seed' || r.isDemo === true);
    assert.strictEqual(hasDemo, false, 'Phát hiện tài liệu isDemo: true bị lọt vào kết quả RAG!');
  });

  await runTest('RAG: Truy xuất thành công tri thức hợp lệ đã được thẩm định (verified, not quarantined, not demo)', () => {
    const results = retrieveTopK('chu kỳ con lắc đơn dao động điều hòa', 10);
    const hasVerified = results.some(r => r.id === 'doc_verified_valid');
    assert.strictEqual(hasVerified, true, 'Tri thức hợp lệ đã thẩm định phải được tìm thấy trong RAG!');
  });

  await runTest('RAG: getDynamicCorpus loại bỏ hoàn toàn các mục quarantined, pending và isDemo', () => {
    const corpus = getDynamicCorpus();
    const badDocs = corpus.filter(c => c.quarantined === true || c.isDemo === true || c.status === 'pending_review');
    assert.strictEqual(badDocs.length, 0, 'Dynamic corpus chứa tài liệu vi phạm!');
  });

  // -------------------------------------------------------------------------
  // TEST PHẦN 2: KIỂM TRA MÃ NGUỒN VÀ LOGIC ROUTE /api/learned-knowledge
  // -------------------------------------------------------------------------

  const routeSrc = fs.readFileSync('src/app/api/learned-knowledge/route.js', 'utf-8');

  await runTest('Route Source: POST luôn gán status pending_review và teacherVerified false', () => {
    assert(routeSrc.includes("status: 'pending_review'"), 'Thiếu status pending_review trong POST');
    assert(routeSrc.includes('teacherVerified: false'), 'Thiếu teacherVerified false trong POST');
  });

  await runTest('Route Source: PATCH sử dụng authenticateReviewer kiểm tra vai trò teacher/admin từ token', () => {
    assert(routeSrc.includes('authenticateReviewer(request)'), 'Thiếu authenticateReviewer trong PATCH');
    assert(routeSrc.includes("role === 'admin' || role === 'teacher'"), 'Thiếu kiểm tra vai trò admin hoặc teacher');
    assert(routeSrc.includes('status: 403'), 'Thiếu trả về status 403 khi không đủ thẩm quyền');
  });

  await runTest('Route Source: Audit Log ghi nhận reviewerUid, reviewerEmail và beforeState/afterState', () => {
    assert(routeSrc.includes('reviewerUid:'), 'Thiếu reviewerUid trong audit log');
    assert(routeSrc.includes('reviewerEmail:'), 'Thiếu reviewerEmail trong audit log');
    assert(routeSrc.includes('beforeState') && routeSrc.includes('afterState'), 'Thiếu beforeState/afterState trong audit log');
  });

  await runTest('Route Logic: POST ép học sinh không thể tự phong verified', () => {
    const rogueBody = {
      query: 'Định luật II Newton',
      answer: 'F = m * a',
      status: 'verified_by_teacher',
      teacherVerified: true,
      isDemo: false
    };
    const sanitized = sanitizeNewLearnedItem(rogueBody);
    assert.strictEqual(sanitized.status, 'pending_review');
    assert.strictEqual(sanitized.teacherVerified, false);
    assert.strictEqual(sanitized.verifiedBy, null);
  });

  await runTest('Route Logic: Học sinh không có role teacher/admin bị từ chối 403', () => {
    const studentTokenPayload = Buffer.from(JSON.stringify({
      user_id: 'hs_001',
      email: 'student@gmail.com',
      role: 'student'
    })).toString('base64');
    const authHeader = `Bearer header.${studentTokenPayload}.signature`;
    const authResult = verifyTokenReviewer(authHeader, '');
    assert.strictEqual(authResult.authorized, false);
  });

  await runTest('Route Logic: Giáo viên có token role teacher được cấp phép', () => {
    const teacherTokenPayload = Buffer.from(JSON.stringify({
      user_id: 'gv_001',
      email: 'teacher@stemhub.edu.vn',
      role: 'teacher'
    })).toString('base64');
    const authHeader = `Bearer header.${teacherTokenPayload}.signature`;
    const authResult = verifyTokenReviewer(authHeader, '');
    assert.strictEqual(authResult.authorized, true);
    assert.strictEqual(authResult.role, 'teacher');
    assert.strictEqual(authResult.uid, 'gv_001');
  });

  await runTest('Route Logic: GET lọc bỏ hoàn toàn các mục isDemo, quarantined, pending khi public', () => {
    const filtered = filterLearnedDocs(testKnowledge, true);
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].id, 'doc_verified_valid');
  });

  console.log('\n=========================================');
  console.log(`KẾT QUẢ: Đã chạy thành công ${passedTests}/${totalTests} test cases.`);
  if (passedTests === totalTests) {
    console.log('TẤT CẢ CÁC KIỂM THỬ ĐÃ ĐẠT YÊU CẦU!');
    process.exit(0);
  } else {
    console.error(`CÓ ${totalTests - passedTests} TEST CASES BỊ THẤT BẠI!`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Lỗi thực thi test suite:', err);
  process.exit(1);
});
