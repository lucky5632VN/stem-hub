import { test, expect } from '@playwright/test';

test.describe('E2E Real User - 06: Cổng Liên Hệ & Hộp Thư Đóng Góp Ý Kiến', () => {

  test('06.1 - Truy cập trang Liên Hệ (/lien-he), kiểm tra form gửi phản hồi', async ({ page }) => {
    const res = await page.goto('/lien-he', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);

    const bodyText = await page.innerText('body');
    const hasContact = bodyText.includes('Liên hệ') || bodyText.includes('Góp ý') || bodyText.includes('Tin nhắn');
    console.log(`[06.1] Giao diện liên hệ tải thành công: ${hasContact}`);
    expect(hasContact).toBeTruthy();
  });

  test('06.2 - Điền nội dung tin nhắn thật, kiểm tra nút gửi phản hồi', async ({ page }) => {
    await page.goto('/lien-he', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const textarea = page.locator('textarea').first();
    const submitBtn = page.locator('button:has-text("Gửi"), button[type="submit"]').first();

    if (await textarea.isVisible({ timeout: 4000 }).catch(() => false)) {
      // Người thật gõ nội dung phản hồi kiểm thử
      const feedbackText = 'Kiểm thử hệ thống phản hồi tự động từ học sinh: Giao diện trực quan và phòng thí nghiệm 3D hoạt động rất mượt mà!';
      console.log(`[06.2] Nhập tin nhắn phản hồi: "${feedbackText.substring(0, 40)}..."`);
      await textarea.fill(feedbackText);
      await page.waitForTimeout(500);

      const canClick = await submitBtn.isEnabled().catch(() => false);
      console.log(`[06.2] Nút gửi phản hồi ở trạng thái khả dụng: ${canClick}`);
      expect(canClick).toBeTruthy();
    }
  });

});

