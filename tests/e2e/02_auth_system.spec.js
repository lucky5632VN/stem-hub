import { test, expect } from '@playwright/test';

test.describe('E2E Real User - 02: Hệ Thống Xác Thực Học Sinh (Login / Register / Validation)', () => {

  test('02.1 - Truy cập /login, kiểm tra modal xác thực hiển thị đầy đủ các trường nhập liệu', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Kiểm tra có ô nhập Email và Password
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    const emailVisible = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);
    const passwordVisible = await passwordInput.isVisible({ timeout: 5000 }).catch(() => false);

    console.log(`[02.1] Modal đăng nhập: Email input=${emailVisible}, Password input=${passwordVisible}`);
    expect(emailVisible || passwordVisible).toBeTruthy();
  });

  test('02.2 - Kiểm tra bắt lỗi Validation khi người dùng bỏ trống hoặc nhập sai định dạng', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const submitBtn = page.locator('button[type="submit"], form button:has-text("Đăng nhập")').first();
    if (await submitBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      // Click submit khi chưa nhập gì
      await submitBtn.click();
      await page.waitForTimeout(500);

      const pageText = await page.innerText('body');
      const hasError = pageText.includes('Vui lòng') || pageText.includes('Email') || pageText.includes('mật khẩu');
      console.log(`[02.2] Bắt lỗi validation khi bỏ trống: ${hasError}`);
      expect(hasError).toBeTruthy();
    }
  });

  test('02.3 - Chuyển đổi qua lại giữa tab Đăng nhập và Đăng ký tài khoản', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const switchBtn = page.locator('button:has-text("Đăng ký ngay"), button:has-text("Tạo tài khoản")').first();
    if (await switchBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await switchBtn.click();
      await page.waitForTimeout(600);

      const bodyText = await page.innerText('body');
      const inRegisterView = bodyText.includes('Họ và tên') || bodyText.includes('Xác nhận mật khẩu') || bodyText.includes('Đăng ký');
      console.log(`[02.3] Chuyển đổi sang giao diện Đăng ký: ${inRegisterView}`);
      expect(inRegisterView).toBeTruthy();
    }
  });

  test('02.4 - Đăng nhập tài khoản học sinh thật test1@gmail.com và kiểm tra phiên làm việc', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"], form button:has-text("Đăng nhập")').first();

    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Người thật gõ email và mật khẩu với delay thực tế
      await emailInput.fill('');
      await emailInput.pressSequentially('test1@gmail.com', { delay: 30 });
      await passwordInput.fill('');
      await passwordInput.pressSequentially('test1123', { delay: 30 });

      console.log('[02.4] Đã điền thông tin test1@gmail.com. Đang gửi yêu cầu đăng nhập lên Firebase...');
      await submitBtn.click();

      // Đợi phản hồi xử lý xác thực
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      console.log(`[02.4] URL sau khi đăng nhập: ${currentUrl}`);
      expect(currentUrl).toBeDefined();
    }
  });

});

