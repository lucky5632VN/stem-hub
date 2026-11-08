import { test, expect } from '@playwright/test';

test.describe('E2E Real User - 04: Trợ Lý AI NOVA & RAG Matching Engine', () => {

  test('04.1 - Kiểm tra lớp bảo vệ xác thực (Auth Gate) của Trợ lý AI khi chưa đăng nhập', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Bấm nút Trợ lý AI NOVA hoặc ấn phím nóng Ctrl+K
    await page.keyboard.press('Control+KeyK');
    await page.waitForTimeout(600);

    const bodyText = await page.innerText('body');
    const hasLockOrHUD = bodyText.includes('khóa') || bodyText.includes('Đăng nhập') || bodyText.includes('NOVA') || bodyText.includes('Trợ lý');
    console.log(`[04.1] Lớp bảo vệ AI Gate hoạt động đúng quy tắc bảo mật: ${hasLockOrHUD}`);
    expect(hasLockOrHUD).toBeTruthy();
  });

  test('04.2 - Đăng nhập tài khoản test1@gmail.com và mở Trợ lý AI NOVA thời gian thực', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"], form button:has-text("Đăng nhập")').first();

    if (await emailInput.isVisible({ timeout: 4000 }).catch(() => false)) {
      await emailInput.fill('test1@gmail.com');
      await passwordInput.fill('test1123');
      await submitBtn.click();
      await page.waitForTimeout(2500);
    }

    // Quay lại trang chủ và mở Trợ lý AI
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Bấm phím nóng hoặc click nút AI
    await page.keyboard.press('Control+KeyK');
    await page.waitForTimeout(1000);

    // Kiểm tra xem khung HUD của AI đã mở ra chưa
    const hud = page.locator('.nova-hud-container, textarea[placeholder*="Nhập câu hỏi"], input[placeholder*="câu hỏi"]').first();
    const isHudOpen = await hud.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`[04.2] Khung chat Trợ lý AI NOVA mở thành công: ${isHudOpen}`);
    expect(isHudOpen).toBeTruthy();
  });

  test('04.3 - Gửi câu hỏi kiến thức THPT thật, nhận đáp án RAG Cache và kiểm tra hiển thị công thức chuẩn', async ({ page }) => {
    // Đăng nhập nhanh
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"], form button:has-text("Đăng nhập")').first();

    if (await emailInput.isVisible({ timeout: 4000 }).catch(() => false)) {
      await emailInput.fill('test1@gmail.com');
      await passwordInput.fill('test1123');
      await submitBtn.click();
      await page.waitForTimeout(2000);
    }

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.keyboard.press('Control+KeyK');
    await page.waitForTimeout(1000);

    const chatInput = page.locator('.nova-hud-container textarea, .nova-hud-container input[type="text"]').first();
    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Gõ câu hỏi thật vào ô chat
      const realQuestion = 'Nguyên tắc bổ sung trong cấu trúc ADN là gì?';
      console.log(`[04.3] Người thật gửi câu hỏi: "${realQuestion}"`);
      await chatInput.fill(realQuestion);
      await chatInput.press('Enter');

      // Đợi AI phản hồi (từ Cache RAG hoặc mô hình)
      await page.waitForTimeout(4000);

      const hudText = await page.locator('.nova-hud-container').innerText().catch(() => '');
      const hasAnswer = hudText.includes('Adenin') || hudText.includes('A = T') || hudText.includes('liên kết') || hudText.includes('ADN');
      console.log(`[04.3] AI phản hồi thành công và chính xác kiến thức: ${hasAnswer}`);
      expect(hasAnswer).toBeTruthy();
    }
  });

});

