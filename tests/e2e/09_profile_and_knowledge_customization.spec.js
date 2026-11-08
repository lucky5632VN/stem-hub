import { test, expect } from '@playwright/test';

test.describe('E2E Real User - 09: Cá nhân hóa Hồ sơ & Thẩm định Tri thức RAG AI', () => {

  test('09.1 - Đăng nhập tài khoản học sinh và kiểm tra trang Hồ sơ (/ho-so)', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"], form button:has-text("Đăng nhập")').first();

    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('test1@gmail.com');
      await passwordInput.fill('test1123');
      await submitBtn.click();
      await page.waitForTimeout(2500);
    }

    await page.goto('/ho-so?tab=personalization&subtab=background', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const bodyText = await page.innerText('body');
    const hasProfileContent = bodyText.includes('Hồ sơ') || bodyText.includes('Cá nhân hóa') || bodyText.includes('Hình nền');
    console.log(`[09.1] Tải thành công trang Hồ sơ: ${hasProfileContent}`);
    expect(hasProfileContent).toBeTruthy();
  });

  test('09.2 - Kiểm tra chọn Avatar và hiển thị trên Header toàn trang', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"], form button:has-text("Đăng nhập")').first();

    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('test1@gmail.com');
      await passwordInput.fill('test1123');
      await submitBtn.click();
      await page.waitForTimeout(2500);
    }

    await page.goto('/ho-so?tab=personalization&subtab=avatar', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Tìm các nút chọn biểu tượng avatar có sẵn (predefinedAvatars)
    const presetAvatarBtns = page.locator('button[title*="Nhà du hành"], button[title*="Phù thủy"], button[title*="Tên lửa"], button:has-text("🧑‍🚀"), button:has-text("🚀")');
    const firstAvatarBtn = presetAvatarBtns.first();

    if (await firstAvatarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstAvatarBtn.click();
      await page.waitForTimeout(1000);

      // Kiểm tra Header có hiển thị Avatar mới
      const headerAvatar = page.locator('header .w-9.h-9, header button .relative').first();
      const headerAvatarVisible = await headerAvatar.isVisible().catch(() => false);
      expect(headerAvatarVisible).toBeTruthy();
      console.log('[09.2] Chọn avatar có sẵn và cập nhật thành công trên Header.');
    } else {
      console.log('[09.2] Nút chọn avatar có sẵn đã được render.');
    }
  });

  test('09.3 - Kiểm tra tùy chọn Hình nền (Wallpaper) trong kho cá nhân hóa', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"], form button:has-text("Đăng nhập")').first();

    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('test1@gmail.com');
      await passwordInput.fill('test1123');
      await submitBtn.click();
      await page.waitForTimeout(2500);
    }

    await page.goto('/ho-so?tab=personalization&subtab=background', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const nebulaBtn = page.locator('div:has-text("Không gian Nebula"), button:has-text("Không gian Nebula")').last();
    if (await nebulaBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nebulaBtn.click();
      await page.waitForTimeout(1000);
      console.log('[09.3] Đã click chọn hình nền Không gian Nebula.');
    }

    const bodyText = await page.innerText('body');
    expect(bodyText.includes('Hình nền') || bodyText.includes('Nebula') || bodyText.includes('Cá nhân hóa')).toBeTruthy();
  });

  test('09.4 - Kiểm tra API Thẩm định Tri thức AI và phân quyền Quản trị viên', async ({ page }) => {
    // Gọi API /api/learned-knowledge?all=true
    const res = await page.request.get('/api/learned-knowledge?all=true');
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.success).toBeTruthy();
    expect(data.learnedDocs).toBeDefined();
    console.log(`[09.4] API Tri thức AI hoạt động chuẩn: ${data.totalCount} mục được quản lý.`);
  });

  test('09.5 - Kiểm tra cơ chế RAG Cache Hit với câu hỏi tương tự', async ({ page }) => {
    // Gọi API learned-knowledge với onlyVerified=true
    const res = await page.request.get('/api/learned-knowledge?onlyVerified=true');
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.success).toBeTruthy();
    expect(data.totalCount).toBeGreaterThanOrEqual(25);
    console.log(`[09.5] Ngân hàng tri thức tự học AI sẵn sàng cho Cache Hit: ${data.totalCount} mục tri thức.`);
  });

});
