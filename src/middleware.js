import { NextResponse } from 'next/server';

/**
 * Middleware: Cho phép người dùng (cả khách và thành viên) truy cập tự do toàn bộ hệ thống:
 * phòng lab, đấu trường 1v1, câu hỏi, bảng xếp hạng, dashboard... mà không bị chặn.
 */
export function middleware(request) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Cho phép tất cả các route đi qua, chỉ bỏ qua file tĩnh và tài nguyên hệ thống
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png|labs|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|ogg|glb|gltf|css|js|html)$).*)',
  ],
};

export default middleware;