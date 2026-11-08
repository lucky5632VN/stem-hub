import { test, expect } from '@playwright/test';

test.describe('E2E Real User - 07: Bảng Điều Khiển Quản Trị & Hội Đồng Thẩm Định Tri Thức AI', () => {

  test('07.1 - Kiểm tra lớp bảo vệ Cổng An Ninh Quản Trị (/admin) khi chưa đăng nhập quyền Admin', async ({ page }) => {
    const res = await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);

    await page.waitForTimeout(1000);
    const bodyText = await page.innerText('body');
    const isSecurityProtected = bodyText.includes('STEM CONTROL CENTER') || bodyText.includes('truy cập trái phép') || bodyText.includes('bảo mật') || bodyText.includes('SECURE');
    console.log(`[07.1] Cổng an ninh Admin Gate chặn người dùng vãng lai đúng tiêu chuẩn: ${isSecurityProtected}`);
    expect(isSecurityProtected).toBeTruthy();
  });

  test('07.2 - Đăng nhập tài khoản Admin admin123@gmail.com và kiểm tra Hội Đồng Thẩm Định Tri Thức AI', async ({ page }) => {
    // Đăng nhập Admin
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"], form button:has-text("Đăng nhập")').first();

    if (await emailInput.isVisible({ timeout: 4000 }).catch(() => false)) {
      await emailInput.fill('admin123@gmail.com');
      await passwordInput.fill('hoanganhadmin5632');
      await submitBtn.click();
      await page.waitForTimeout(3000);
    }

    // Chờ phiên đăng nhập Admin được Firebase Auth lưu trữ hoàn toàn
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const res = await page.goto('/admin/knowledge-review', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);

    await page.waitForTimeout(2000);

    // Kiểm tra không còn chữ "Invalid Date"
    const bodyText = await page.innerText('body');
    const hasInvalidDate = bodyText.includes('Invalid Date');
    console.log(`[07.2] Kiểm tra lỗi Invalid Date: ${hasInvalidDate ? '❌ CÒN LỖI' : '✅ ĐÃ KHẮC PHỤC TRIỆT ĐỂ'}`);
    expect(hasInvalidDate).toBeFalsy();

    // Kiểm tra giao diện thẩm định tri thức
    const hasReviewInterface = bodyText.includes('Thẩm Định') || bodyText.includes('Tri thức') || bodyText.includes('Cache') || bodyText.includes('Duyệt') || bodyText.includes('Hội Đồng');
    console.log(`[07.2] Giao diện Hội đồng thẩm định tri thức: ${hasReviewInterface}`);
    expect(hasReviewInterface).toBeTruthy();
  });

  test('07.3 - Kiểm tra các phân hệ quản trị phụ trợ: Đề thi, Học sinh, Cài đặt hệ thống', async ({ page }) => {
    const subAdminPages = [
      { name: 'Ngân hàng câu hỏi', path: '/admin/questions' },
      { name: 'Quản lý học sinh', path: '/admin/students' },
      { name: 'Cài đặt hệ thống', path: '/admin/settings' },
      { name: 'Nhật ký hệ thống', path: '/admin/logs' }
    ];

    for (const sub of subAdminPages) {
      const res = await page.goto(sub.path, { waitUntil: 'domcontentloaded' });
      expect(res?.status()).toBe(200);
      console.log(`[07.3] Phân hệ ${sub.name} (${sub.path}) tải tốt - HTTP 200`);
      await page.waitForTimeout(300);
    }
  });

});
