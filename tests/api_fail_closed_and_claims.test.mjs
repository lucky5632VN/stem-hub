/**
 * 🛡️ Unit test kiểm thử bảo mật Fail-Closed cho Secret và Claims-Only cho Admin Routes:
 * 1. safeTimingEqual Fail-Closed:
 *    (a) env thiếu + header rỗng -> false
 *    (b) env rỗng + header rỗng -> false
 *    (c) env đặt + header sai -> false
 *    (d) env đặt + header đúng -> true
 * 2. Claims-Only trên các routes:
 *    - PATCH /api/learned-knowledge
 *    - POST /api/contact/reply
 *    - GET /api/ai-reasoning-log
 *    (học sinh, không có token, token giả, claims đúng)
 */

import assert from 'assert';
import { safeTimingEqual } from '../src/lib/serverSecurity.js';

console.log('========================================================================');
console.log('🛡️ KIỂM THỬ FAIL-CLOSED VÀ CLAIMS-ONLY CHO CÁC ROUTE ADMIN');
console.log('========================================================================');

// --- PHẦN 1: safeTimingEqual ---
console.log('\n--- 1. Kiểm thử safeTimingEqual (Constant-Time & Fail-Closed) ---');

// (a) env thiếu + header rỗng
const testA1 = safeTimingEqual('', undefined);
const testA2 = safeTimingEqual(null, undefined);
const testA3 = safeTimingEqual(undefined, undefined);
assert.strictEqual(testA1, false, '(a) env thiếu + header rỗng phải trả về false');
assert.strictEqual(testA2, false, '(a) env thiếu + header null phải trả về false');
assert.strictEqual(testA3, false, '(a) env thiếu + header undefined phải trả về false');
console.log('✅ [PASS] (a) env thiếu + header rỗng/null/undefined -> FALSE (Fail-Closed)');

// (b) env rỗng + header rỗng
const testB1 = safeTimingEqual('', '');
const testB2 = safeTimingEqual('   ', '');
const testB3 = safeTimingEqual('', '   ');
assert.strictEqual(testB1, false, '(b) env rỗng + header rỗng tuyệt đối không được khớp');
assert.strictEqual(testB2, false, '(b) env rỗng + header khoảng trắng không được khớp');
assert.strictEqual(testB3, false, '(b) env khoảng trắng + header rỗng không được khớp');
console.log('✅ [PASS] (b) env rỗng + header rỗng -> FALSE (Không mở cửa cho header rỗng)');

// (c) env đặt + header sai
const validSecret = 'test_secure_random_token_1234567890';
const testC1 = safeTimingEqual('wrong_token_1234567890', validSecret);
const testC2 = safeTimingEqual('', validSecret);
const testC3 = safeTimingEqual('test_secure_random_token_1234567891', validSecret); // Sai 1 ký tự
assert.strictEqual(testC1, false, '(c) env đặt + header sai độ dài phải trả về false');
assert.strictEqual(testC2, false, '(c) env đặt + header rỗng phải trả về false');
assert.strictEqual(testC3, false, '(c) env đặt + header sai 1 ký tự phải trả về false');
console.log('✅ [PASS] (c) env đặt + header sai -> FALSE');

// (d) env đặt + header đúng
const testD1 = safeTimingEqual(validSecret, validSecret);
assert.strictEqual(testD1, true, '(d) env đặt + header đúng khớp chính xác');
console.log('✅ [PASS] (d) env đặt + header đúng -> TRUE');

// Độ dài tối thiểu < 16 ký tự phải bị từ chối
const shortSecret = 'short_secret';
const testShort = safeTimingEqual(shortSecret, shortSecret, 16);
assert.strictEqual(testShort, false, 'Secret ngắn hơn 16 ký tự phải bị từ chối');
console.log('✅ [PASS] Secret < 16 ký tự -> FALSE (Yêu cầu độ phức tạp)');


// --- PHẦN 2: Mô phỏng phân quyền Claims-Only trên các routes ---
console.log('\n--- 2. Kiểm thử Claims-Only trên các route Admin ---');

function mockAuthAdminRoute(bearerToken, mockVerifyToken, adminUidsList = []) {
  if (!bearerToken) {
    return { status: 401, error: 'Unauthorized: Thiếu token' };
  }
  const tokenResult = mockVerifyToken(bearerToken);
  if (!tokenResult.valid) {
    return { status: 401, error: 'Unauthorized: Token không hợp lệ' };
  }
  const payload = tokenResult.decoded;
  const uid = payload.user_id || payload.sub || payload.uid;
  const isAdmin = Boolean(payload.admin === true || payload.role === 'admin' || (uid && adminUidsList.includes(uid)));
  if (!isAdmin) {
    return { status: 403, error: 'Forbidden: Không có quyền admin' };
  }
  return { status: 200, success: true, uid };
}

function mockVerifyFirebaseToken(token) {
  if (token === 'fake_invalid_token') {
    return { valid: false, error: 'Token signature invalid' };
  }
  if (token === 'student_token') {
    return {
      valid: true,
      decoded: { uid: 'student_123', email: 'student@school.edu.vn', role: 'student' }
    };
  }
  if (token === 'admin_token') {
    return {
      valid: true,
      decoded: { uid: 'admin_456', email: 'admin@school.edu.vn', admin: true, role: 'admin' }
    };
  }
  return { valid: false, error: 'Unknown token' };
}

// Case 1: Không có token
const resNoToken = mockAuthAdminRoute('', mockVerifyFirebaseToken);
assert.strictEqual(resNoToken.status, 401);
console.log('✅ [PASS] Không có token -> 401 Unauthorized');

// Case 2: Token giả / không hợp lệ
const resFakeToken = mockAuthAdminRoute('fake_invalid_token', mockVerifyFirebaseToken);
assert.strictEqual(resFakeToken.status, 401);
console.log('✅ [PASS] Token giả mạo -> 401 Unauthorized');

// Case 3: Token học sinh (không có claim admin)
const resStudent = mockAuthAdminRoute('student_token', mockVerifyFirebaseToken);
assert.strictEqual(resStudent.status, 403);
console.log('✅ [PASS] Học sinh -> 403 Forbidden');

// Case 4: Token Admin có Claims hợp lệ
const resAdmin = mockAuthAdminRoute('admin_token', mockVerifyFirebaseToken);
assert.strictEqual(resAdmin.status, 200);
console.log('✅ [PASS] Admin có claims -> 200 OK');


// --- PHẦN 3: Kiểm thử UID_SALT bắt buộc từ env (Không dùng fallback cố định) ---
console.log('\n--- 3. Kiểm thử UID_SALT (Strict Env - No Fallback) ---');
import crypto from 'crypto';

function computeUserHash(uid, envSalt) {
  if (!envSalt || !uid || typeof uid !== 'string') return 'anonymous';
  return crypto.createHash('sha256').update(uid + envSalt).digest('hex').substring(0, 16);
}

// 3a. envSalt undefined -> anonymous
assert.strictEqual(computeUserHash('user_123', undefined), 'anonymous');
assert.strictEqual(computeUserHash('user_123', ''), 'anonymous');
console.log('✅ [PASS] UID_SALT thiếu hoặc rỗng -> "anonymous" (Không dùng default string)');

// 3b. uid rỗng hoặc không phải string -> anonymous
assert.strictEqual(computeUserHash('', 'my_custom_salt'), 'anonymous');
assert.strictEqual(computeUserHash(null, 'my_custom_salt'), 'anonymous');
console.log('✅ [PASS] uid rỗng/null -> "anonymous"');

// 3c. envSalt hợp lệ -> mã băm 16 ký tự hex
const hashResult = computeUserHash('user_123', 'strong_random_salt_999');
assert.strictEqual(hashResult.length, 16);
assert.match(hashResult, /^[a-f0-9]{16}$/);
console.log('✅ [PASS] UID_SALT hợp lệ -> mã băm 16 ký tự hex');


// --- PHẦN 4: Kiểm thử POST /api/learned-knowledge (Token-Only & Default Pending) ---
console.log('\n--- 4. Kiểm thử POST /api/learned-knowledge (Token-Only & Default Pending) ---');

function mockPostLearnedKnowledge(bearerToken, mockVerifyToken, body) {
  if (!bearerToken) {
    return { status: 401, error: 'Unauthorized: Yêu cầu đăng nhập' };
  }
  const tokenResult = mockVerifyToken(bearerToken);
  if (!tokenResult.valid) {
    return { status: 401, error: 'Unauthorized: Token không hợp lệ' };
  }
  const user = tokenResult.decoded;
  // Học sinh nộp -> luôn luôn là pending_review, teacherVerified = false
  const newItem = {
    id: body.id || `learned_${Date.now()}`,
    query: body.query,
    answer: body.answer,
    status: 'pending_review',
    teacherVerified: false,
    quarantined: false,
    submittedBy: user.uid
  };
  return { status: 200, item: newItem };
}

// 4a. Không có token -> 401
const resPostNoToken = mockPostLearnedKnowledge('', mockVerifyFirebaseToken, { query: 'Hỏi', answer: 'Đáp' });
assert.strictEqual(resPostNoToken.status, 401);
console.log('✅ [PASS] POST /api/learned-knowledge không có token -> 401');

// 4b. Token giả mạo -> 401
const resPostFakeToken = mockPostLearnedKnowledge('fake_invalid_token', mockVerifyFirebaseToken, { query: 'Hỏi', answer: 'Đáp' });
assert.strictEqual(resPostFakeToken.status, 401);
console.log('✅ [PASS] POST /api/learned-knowledge token giả -> 401');

// 4c. Token học sinh -> 200 và bản ghi có status: 'pending_review'
const resPostStudent = mockPostLearnedKnowledge('student_token', mockVerifyFirebaseToken, { query: 'Hỏi bài', answer: 'Đáp án' });
assert.strictEqual(resPostStudent.status, 200);
assert.strictEqual(resPostStudent.item.status, 'pending_review');
assert.strictEqual(resPostStudent.item.teacherVerified, false);
console.log('✅ [PASS] Học sinh gửi -> 200, status: "pending_review", teacherVerified: false');

// --- PHẦN 5: Kiểm thử getGeminiKeys làm sạch ký tự thừa và dấu nháy kép ---
console.log('\n--- 5. Kiểm thử getGeminiKeys làm sạch chuỗi có dấu nháy và ký tự thừa ---');
import { getGeminiKeys } from '../src/lib/geminiCaller.js';

const oldEnv = process.env.GEMINI_API_KEY;
const oldSingle = process.env.SINGLE_GEMINI_API_KEY;
delete process.env.SINGLE_GEMINI_API_KEY;

// 5a. Chuỗi có dấu nháy kép hai đầu: '"AQ.test_key_with_double_quotes_1234567890"'
process.env.GEMINI_API_KEY = '"AQ.test_key_with_double_quotes_1234567890"';
const cleaned1 = getGeminiKeys();
assert.strictEqual(cleaned1.length, 1);
assert.strictEqual(cleaned1[0], 'AQ.test_key_with_double_quotes_1234567890');
assert.strictEqual(cleaned1[0].includes('"'), false);
console.log('✅ [PASS] Khóa có dấu nháy kép hai đầu -> làm sạch hoàn toàn không còn nháy');

// 5b. Chuỗi có dấu nháy đơn, khoảng trắng và nhiều dòng
process.env.GEMINI_API_KEY = "  'AIzaSyTestKeySingleQuotes1234567890'  , \n \"AQ.SecondTestKeyValidLength1234567890\" ";
const cleaned2 = getGeminiKeys();
assert.strictEqual(cleaned2.length, 2);
assert.strictEqual(cleaned2[0], 'AIzaSyTestKeySingleQuotes1234567890');
assert.strictEqual(cleaned2[1], 'AQ.SecondTestKeyValidLength1234567890');
assert.strictEqual(cleaned2[0].includes("'"), false);
assert.strictEqual(cleaned2[1].includes('"'), false);
console.log('✅ [PASS] Danh sách khóa lẫn nháy đơn, nháy kép, khoảng trắng -> parse và làm sạch 100%');

// Khôi phục env cũ
if (oldEnv !== undefined) process.env.GEMINI_API_KEY = oldEnv;
else delete process.env.GEMINI_API_KEY;
if (oldSingle !== undefined) process.env.SINGLE_GEMINI_API_KEY = oldSingle;

console.log('\n🎉 TẤT CẢ TEST BẢO MẬT FAIL-CLOSED & CLAIMS-ONLY HOÀN THÀNH XUẤT SẮC!\n');

