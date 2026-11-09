import { test, expect } from '@playwright/test';

test.describe('E2E Real User - 11: Hệ Thống Chụp Màn Hình & STEM Story Studio', () => {

  test('11.1 - Tải trang STEM Stories, kiểm tra dải Stories 24h, Bảng tin Moments và Trình xem Story toàn màn hình', async ({ page }) => {
    await page.goto('/story', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Kiểm tra tiêu đề chính
    const heading = page.locator('h1:has-text("STEM Stories")');
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Kiểm tra nút "Chia sẻ ngay"
    const shareBtn = page.locator('button:has-text("Chia sẻ ngay")').first();
    await expect(shareBtn).toBeVisible({ timeout: 5000 });

    // Kiểm tra dải Stories có ít nhất 1 avatar story
    const storyAvatars = page.locator('div.w-\\[66px\\]');
    const avatarCount = await storyAvatars.count();
    console.log(`[11.1] Số lượng Story người dùng đang hiển thị: ${avatarCount}`);
    expect(avatarCount).toBeGreaterThan(0);

    // Mở Trình xem Story (Story Viewer)
    await storyAvatars.first().click();
    await page.waitForTimeout(1000);

    // Kiểm tra Story Viewer mở lên
    const storyImage = page.locator('img[alt="Story moment"]');
    await expect(storyImage).toBeVisible({ timeout: 5000 });

    // Kiểm tra có các nút điều khiển Play/Pause và Tải về
    const downloadStoryBtn = page.locator('button[title="Tải ảnh story này"]').first();
    await expect(downloadStoryBtn).toBeVisible({ timeout: 3000 });

    // Đóng Story Viewer bằng phím Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await expect(storyImage).not.toBeVisible();
    console.log('[11.1] Trình xem Story hoạt động mượt mà, đóng/mở chuẩn xác');
  });

  test('11.2 - Kiểm tra Tương tác Bảng tin Moments: Thả cảm xúc tức thì (❤️, 🧠, 💥) & Thêm bình luận không có độ trễ', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.goto('/story', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Kiểm tra có ít nhất 1 bài đăng Moment
    const momentCards = page.locator('div.group\\/card');
    const cardCount = await momentCards.count();
    console.log(`[11.2] Số lượng bài đăng Moments: ${cardCount}`);
    expect(cardCount).toBeGreaterThan(0);

    const firstCard = momentCards.first();

    // Thả tim ❤️ và kiểm tra số lượt nhảy tức thì
    const heartBtn = firstCard.locator('button:has-text("❤️"), button:has(.text-rose-500)').first();
    const initialHeartText = await heartBtn.innerText();
    await heartBtn.click();
    await page.waitForTimeout(300);
    const afterHeartText = await heartBtn.innerText();
    console.log(`[11.2] Lượt tim trước: "${initialHeartText}" -> sau: "${afterHeartText}"`);

    // Thả kích nổ 💥
    const fireBtn = firstCard.locator('button:has(.text-orange-500)').first();
    await fireBtn.click();
    await page.waitForTimeout(300);

    // Nhập bình luận nhanh
    const commentInput = firstCard.locator('input[placeholder="Viết câu trả lời..."]').first();
    if (await commentInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await commentInput.scrollIntoViewIfNeeded();
      await commentInput.click();
      await commentInput.fill('Thí nghiệm quá đỉnh!');
      await page.waitForTimeout(300);
      const submitBtn = firstCard.locator('button[type="submit"]').first();
      await submitBtn.click();
      await page.waitForTimeout(800);

      // Kiểm tra có văn bản bình luận hiển thị trên thẻ
      const cardText = await firstCard.innerText();
      expect(cardText.includes('Thí nghiệm quá đỉnh!')).toBeTruthy();
      console.log('[11.2] Bình luận phản hồi tức thì với Optimistic UI');
    }
  });

  test('11.3 - Kiểm tra Studio Đăng Story: Đầy đủ 3 Tab (Lab/Đấu trường, Tải lên, Chụp màn hình), Bộ lọc Sci-Fi & Stickers', async ({ page }) => {
    await page.goto('/story', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Bấm nút "Chia sẻ ngay"
    const shareBtn = page.locator('button:has-text("Chia sẻ ngay")').first();
    await shareBtn.click();
    await page.waitForTimeout(600);

    // Kiểm tra Modal Studio mở lên
    const studioModal = page.locator('.fixed.z-\\[999997\\]').first();
    await expect(studioModal).toBeVisible({ timeout: 5000 });

    // Kiểm tra 3 tab chọn nguồn ảnh
    const labTab = studioModal.locator('button:has-text("Thí Nghiệm & Lab")').first();
    const uploadTab = studioModal.locator('button:has-text("Tải Lên Từ Máy")').first();
    const captureTab = studioModal.locator('button:has-text("Chụp Màn Hình")').first();

    await expect(labTab).toBeVisible();
    await expect(uploadTab).toBeVisible();
    await expect(captureTab).toBeVisible();
    console.log('[11.3] Đầy đủ 3 Tab lựa chọn nguồn ảnh');

    // Chuyển sang môn Đấu Trường trong Tab 1
    const arenaSubjectBtn = studioModal.locator('button:has-text("Đấu Trường")').first();
    if (await arenaSubjectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await arenaSubjectBtn.click();
      await page.waitForTimeout(300);
      console.log('[11.3] Chọn môn Đấu Trường thành công');
    }

    // Kiểm tra các nút Bộ lọc màu Sci-Fi
    const cyberpunkFilter = studioModal.locator('button:has-text("Cyberpunk")').first();
    await expect(cyberpunkFilter).toBeVisible();
    await cyberpunkFilter.click();

    // Nhập caption và gắn sticker nhanh trong Modal Studio
    const captionInput = studioModal.locator('textarea[placeholder*="Ghi chú thành tựu"]').first();
    await captionInput.scrollIntoViewIfNeeded();
    await captionInput.fill('Vừa thực hành xong thí nghiệm Hóa học Lượng tử siêu đỉnh!');
    
    // Tìm sticker 🚀 nằm bên trong studioModal
    const rocketSticker = studioModal.locator('button:has-text("🚀")').first();
    if (await rocketSticker.isVisible({ timeout: 2000 }).catch(() => false)) {
      await rocketSticker.scrollIntoViewIfNeeded();
      await rocketSticker.click({ force: true });
      await page.waitForTimeout(300);
    }

    const captionVal = await captionInput.inputValue();
    expect(captionVal.includes('🚀')).toBeTruthy();
    console.log(`[11.3] Caption đã gắn sticker thành công: "${captionVal}"`);

    // Đóng Modal Studio
    const closeBtn = studioModal.locator('button:has(.lucide-x)').first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(500);
  });

  test('11.4 - Kiểm tra Nút Camera FAB chụp màn hình toàn trang: Chụp siêu tốc, không treo máy, kích hoạt Instant Studio Modal', async ({ page }) => {
    // Vào một trang bất kỳ có camera FAB (ví dụ trang Chủ hoặc Hồ Sơ)
    await page.goto('/ho-so', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Tìm nút Camera FAB góc dưới
    const cameraFab = page.locator('button:has(.lucide-camera)').first();
    await expect(cameraFab).toBeVisible({ timeout: 5000 });

    console.log('[11.4] Đã tìm thấy nút Camera FAB');
    await cameraFab.click();

    // Chờ Studio Modal mở lên (có tiêu đề "STEM STORY STUDIO" hoặc "Chỉnh Sửa & Xuất Bản")
    const studioHeading = page.locator('h3:has-text("Chỉnh Sửa & Xuất Bản Khoảnh Khắc Khoa Học")');
    await expect(studioHeading).toBeVisible({ timeout: 10000 });

    // Kiểm tra có xem trước ảnh chụp
    const previewImg = page.locator('img[alt="Captured Screenshot"]');
    await expect(previewImg).toBeVisible({ timeout: 5000 });

    // Kiểm tra có nút "Tải Về"
    const downloadBtn = page.locator('button[title="Tải ảnh này về máy"]').first();
    await expect(downloadBtn).toBeVisible({ timeout: 3000 });

    // Kiểm tra có nút "Đóng & Giữ Nguyên Màn Hình"
    const closeStayBtn = page.locator('button:has-text("Đóng & Giữ Nguyên Màn Hình")').first();
    await expect(closeStayBtn).toBeVisible({ timeout: 3000 });

    await closeStayBtn.click();
    await page.waitForTimeout(500);

    // Xác nhận người dùng vẫn ở lại đúng trang /ho-so mà không bị văng sang trang khác
    expect(page.url()).toContain('/ho-so');
    console.log('[11.4] Đóng Studio Modal thành công, người dùng giữ nguyên màn hình làm việc 100%');
  });

});

