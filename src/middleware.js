import { NextResponse } from 'next/server.js';

/**
 * Danh sách các tiền tố đường dẫn được bảo vệ nghiêm ngặt (Protected Routes).
 * Mọi truy cập vào các đường dẫn này bắt buộc phải có Cookie phiên đăng nhập (session).
 */
const PROTECTED_PREFIXES = [
  '/phong-lab',
  '/match_rooms',
  '/dashboard'
];

/**
 * Danh sách các đường dẫn công khai (Public Routes) cho phép khách tự do truy cập.
 */
const PUBLIC_PREFIXES = [
  '/',
  '/leaderboard',
  '/xep-hang',
  '/login',
  '/register',
  '/auth',
  '/lien-he'
];

export function middleware(request) {
  const { pathname, search } = request.nextUrl;

  // 1. Kiểm tra xem route hiện tại có thuộc nhóm Route Bảo Mật (Protected) không
  const isProtected = PROTECTED_PREFIXES.some((prefix) => 
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected) {
    // Đọc cookie phiên đăng nhập từ trình duyệt gửi lên
    const sessionCookie = 
      request.cookies.get('session')?.value ||
      request.cookies.get('__session')?.value ||
      request.cookies.get('authToken')?.value ||
      request.cookies.get('firebaseToken')?.value;

    // Nếu chưa có Cookie session -> Chặn và chuyển hướng về /login kèm tham số ?next=
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      const nextDestination = pathname + (search || '');
      loginUrl.searchParams.set('next', nextDestination);

      console.log(`[Middleware Auth Wall] ⛔ Chặn truy cập trái phép: ${pathname} -> Chuyển hướng tới /login?next=${nextDestination}`);
      return NextResponse.redirect(loginUrl);
    }

    // Đã có cookie hợp lệ -> Cho phép đi tiếp vào phòng Lab / Dashboard
    console.log(`[Middleware Auth Wall] ✅ Xác thực thành công cho phiên truy cập: ${pathname}`);
  }

  return NextResponse.next();
}

// Cấu hình matcher để bỏ qua các tài nguyên tĩnh, API và nội dung nhúng lab
export const config = {
  matcher: [
    /*
     * Khớp tất cả các đường dẫn ngoại trừ:
     * - api (các API endpoint)
     * - _next/static (Next.js static assets)
     * - _next/image (Next.js image optimization)
     * - favicon.ico, icon.png
     * - labs (tài nguyên phòng lab ảo static trong public/labs)
     * - Các định dạng file tĩnh (.svg, .png, .jpg, .css, .js, .mp3, .glb, ...)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|labs|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|ogg|glb|gltf|css|js|html)).*)',
  ],
};

export default middleware;
