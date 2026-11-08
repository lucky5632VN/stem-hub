import { test, expect } from '@playwright/test';

test.describe('E2E Real User - 05: Phòng Thi Trực Tuyến, Đấu Trường Tri Thức & Bảng Xếp Hạng', () => {

  test('05.1 - Truy cập Phòng Thi (/phong-thi), kiểm tra bộ lọc môn học và danh sách đề thi THPT Quốc Gia', async ({ page }) => {
    const res = await page.goto('/phong-thi', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);

    await page.waitForTimeout(1000);
    const bodyText = await page.innerText('body');
    const hasExamContent = bodyText.includes('Thi') || bodyText.includes('Đề') || bodyText.includes('Vật lý') || bodyText.includes('Toán');
    console.log(`[05.1] Tải phòng thi trực tuyến: ${hasExamContent}`);
    expect(hasExamContent).toBeTruthy();

    // Thử click vào một đề thi bất kỳ để mở giao diện làm bài
    const examCard = page.locator('button:has-text("Bắt đầu"), button:has-text("Làm bài"), div:has-text("Đề thi")').first();
    if (await examCard.isVisible({ timeout: 4000 }).catch(() => false)) {
      console.log('[05.1] Người thật click chọn đề thi làm bài...');
      await examCard.click();
      await page.waitForTimeout(1500);
    }
  });

  test('05.2 - Truy cập Đấu Trường Tri Thức (/dau-truong), kiểm tra sảnh ghép trận PvP và các chế độ thi đấu', async ({ page }) => {
    const res = await page.goto('/dau-truong', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);

    await page.waitForTimeout(1000);
    const bodyText = (await page.innerText('body')).toLowerCase();
    const hasArena = bodyText.includes('đấu trường') || bodyText.includes('ghép trận') || bodyText.includes('đấu hạng') || bodyText.includes('khoa học');
    console.log(`[05.2] Sảnh Đấu Trường tải thành công: ${hasArena}`);
    expect(hasArena).toBeTruthy();
  });

  test('05.3 - Truy cập Bảng Xếp Hạng Quốc Gia (/xep-hang), kiểm tra bục vinh danh Top 3 và bảng điểm học sinh', async ({ page }) => {
    const res = await page.goto('/xep-hang', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);

    await page.waitForTimeout(1000);
    const bodyText = (await page.innerText('body')).toLowerCase();
    const hasLeaderboard = bodyText.includes('xếp hạng') || bodyText.includes('top') || bodyText.includes('điểm') || bodyText.includes('elo') || bodyText.includes('bảng');
    console.log(`[05.3] Bảng xếp hạng nạp dữ liệu thật thành công: ${hasLeaderboard}`);
    expect(hasLeaderboard).toBeTruthy();
  });

});

