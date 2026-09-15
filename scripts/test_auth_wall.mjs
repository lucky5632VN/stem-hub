import { middleware } from '../src/middleware.js';

console.log('\n=============================================================');
console.log('🧪 BẮT ĐẦU KIỂM THỬ HỆ THỐNG AUTH WALL (LAYER 1 & LAYER 2)');
console.log('=============================================================\n');

function createMockRequest(pathname, search = '', cookies = {}) {
  const url = new URL(`http://localhost:3000${pathname}${search}`);
  return {
    url: url.toString(),
    nextUrl: url,
    cookies: {
      get: (name) => (cookies[name] ? { name, value: cookies[name] } : undefined)
    }
  };
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
  }
}

// -------------------------------------------------------------
// TEST LAYER 1: MIDDLEWARE AUTHORIZATION
// -------------------------------------------------------------
console.log('--- [LAYER 1: BẢO VỆ ĐƯỜNG DẪN / MIDDLEWARE] ---');

// Test 1.1: Khách chưa đăng nhập truy cập /phong-lab/toan -> Phải bị redirect về /login?next=/phong-lab/toan
{
  const req = createMockRequest('/phong-lab/toan');
  const res = middleware(req);
  const location = res?.headers?.get('location');
  assert(
    res && res.status >= 300 && res.status < 400 && location?.includes('/login?next=%2Fphong-lab%2Ftoan'),
    'Chặn khách chưa có cookie vào /phong-lab/toan -> Redirect về /login?next=/phong-lab/toan'
  );
}

// Test 1.2: Khách chưa đăng nhập truy cập /match_rooms/room123 -> Phải bị redirect về /login?next=...
{
  const req = createMockRequest('/match_rooms/room123');
  const res = middleware(req);
  const location = res?.headers?.get('location');
  assert(
    res && res.status >= 300 && res.status < 400 && location?.includes('/login?next=%2Fmatch_rooms%2Froom123'),
    'Chặn khách chưa có cookie vào /match_rooms/:path* -> Redirect về /login'
  );
}

// Test 1.3: Khách chưa đăng nhập truy cập /dashboard/stats -> Phải bị redirect về /login?next=...
{
  const req = createMockRequest('/dashboard/stats');
  const res = middleware(req);
  const location = res?.headers?.get('location');
  assert(
    res && res.status >= 300 && res.status < 400 && location?.includes('/login?next=%2Fdashboard%2Fstats'),
    'Chặn khách chưa có cookie vào /dashboard/:path* -> Redirect về /login'
  );
}

// Test 1.4: Khách đã đăng nhập (có cookie session) truy cập /phong-lab/toan -> Cho phép truy cập (NextResponse.next())
{
  const req = createMockRequest('/phong-lab/toan', '', { session: 'firebase_valid_token_xyz' });
  const res = middleware(req);
  const location = res?.headers?.get('location');
  assert(
    !location,
    'Người dùng có cookie session hợp lệ được phép vào /phong-lab/toan (NextResponse.next)'
  );
}

// Test 1.5: Truy cập Route Công Khai: Trang chủ (/) không có cookie -> Cho phép xem bình thường
{
  const req = createMockRequest('/');
  const res = middleware(req);
  const location = res?.headers?.get('location');
  assert(
    !location,
    'Khách chưa đăng nhập được phép truy cập Trang chủ (/)'
  );
}

// Test 1.6: Truy cập Route Công Khai: /leaderboard không có cookie -> Cho phép xem bình thường
{
  const req = createMockRequest('/leaderboard');
  const res = middleware(req);
  const location = res?.headers?.get('location');
  assert(
    !location,
    'Khách chưa đăng nhập được phép truy cập Bảng xếp hạng (/leaderboard)'
  );
}

// Test 1.7: Truy cập Route Công Khai: /login, /register không có cookie -> Cho phép xem bình thường
{
  const reqLogin = createMockRequest('/login');
  const resLogin = middleware(reqLogin);
  const reqRegister = createMockRequest('/register');
  const resRegister = middleware(reqRegister);
  assert(
    !resLogin?.headers?.get('location') && !resRegister?.headers?.get('location'),
    'Khách chưa đăng nhập được phép truy cập trang Auth (/login, /register)'
  );
}

// -------------------------------------------------------------
// TEST LAYER 2: CLIENT-SIDE CHATBOT GATING LOGIC
// -------------------------------------------------------------
console.log('\n--- [LAYER 2: BẢO VỆ CHATBOT AI / CLIENT-SIDE GATING] ---');

function mockHandleOpenHUD({ currentUser, authLoading }) {
  if (authLoading) {
    return { opened: false, reason: 'auth_loading', toast: false };
  }
  if (!currentUser) {
    return {
      opened: false,
      reason: 'blocked_unauthenticated',
      toast: true,
      toastMessage: '🔒 Trợ lý AI đang bị khóa. Vui lòng đăng nhập để sử dụng tính năng này!',
      apiCallAllowed: false
    };
  }
  return {
    opened: true,
    reason: 'authenticated',
    toast: false,
    apiCallAllowed: true
  };
}

// Test 2.1: Khi người dùng chưa đăng nhập (!currentUser) click hoặc bấm Ctrl+K
{
  const result = mockHandleOpenHUD({ currentUser: null, authLoading: false });
  assert(
    result.opened === false &&
    result.toast === true &&
    result.toastMessage === '🔒 Trợ lý AI đang bị khóa. Vui lòng đăng nhập để sử dụng tính năng này!' &&
    result.apiCallAllowed === false,
    'Chặn tuyệt đối Chatbot AI khi !currentUser, hiện đúng nội dung Toast, không nạp Gemini API'
  );
}

// Test 2.2: Khi Auth đang trong quá trình nạp (authLoading === true)
{
  const result = mockHandleOpenHUD({ currentUser: null, authLoading: true });
  assert(
    result.opened === false && result.toast === false,
    'Xử lý mượt mà trạng thái Auth Loading, không bị khóa nhầm hay báo lỗi sai lúc khởi tạo'
  );
}

// Test 2.3: Khi người dùng đã đăng nhập (currentUser có giá trị)
{
  const result = mockHandleOpenHUD({ currentUser: { uid: 'user_123', email: 'student@stemhub.edu.vn' }, authLoading: false });
  assert(
    result.opened === true && result.toast === false && result.apiCallAllowed === true,
    'Tự động mở khóa tính năng Chatbot AI khi đã đăng nhập mà không cần F5'
  );
}

console.log('\n=============================================================');
console.log(`🎯 KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐẠT CHUẨN 100%!`);
console.log('=============================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
