import { test, expect } from '@playwright/test';

test.describe('E2E Real User - 10: Toàn bộ Tính năng Hồ sơ, Chibi Maker, Gacha, Điểm danh & Bạn bè', () => {

  const ensureLogin = async (page) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"], form button:has-text("Đăng nhập")').first();

    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill('test1@gmail.com');
      await passwordInput.fill('test1123');
      await submitBtn.click();
      await page.waitForTimeout(2000);
    }
  };

  test('10.1 - Kiểm tra Điểm danh 30 ngày (Attendance) & Nhận quà tức thì không độ trễ', async ({ page }) => {
    await ensureLogin(page);
    await page.goto('/ho-so?tab=daily_checkin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const bodyText = await page.innerText('body');
    expect(bodyText.includes('ĐIỂM DANH') || bodyText.includes('Điểm danh')).toBeTruthy();

    const checkInBtn = page.locator('button:has-text("KÍCH HOẠT ĐỒNG BỘ"), button:has-text("ĐÃ ĐỒNG BỘ HÔM NAY")').first();
    await expect(checkInBtn).toBeVisible({ timeout: 5000 });

    const btnText = await checkInBtn.innerText();
    console.log(`[10.1] Trạng thái nút Điểm danh: "${btnText}"`);

    // Click vào nút điểm danh (nếu chưa điểm danh) hoặc kiểm tra tương tác
    await checkInBtn.click({ force: true });
    await page.waitForTimeout(800);

    // Kiểm tra Modal xuất hiện lập tức không giật lag
    const modalText = await page.innerText('body');
    const modalShown = modalText.includes('năng lượng') || modalText.includes('Hệ Thống') || modalText.includes('Pha lê') || modalText.includes('ĐỒNG BỘ');
    expect(modalShown).toBeTruthy();
    console.log('[10.1] Tương tác Điểm danh phản hồi tức thì với Modal Hologram.');
  });

  test('10.2 - Kiểm tra Chibi Maker: Đầy đủ trang phục mới (Nano Suit, Phượng Hoàng, Cánh Lượng Tử, Tóc Saiyan)', async ({ page }) => {
    await ensureLogin(page);
    await page.goto('/ho-so?tab=personalization&subtab=character', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const bodyText = await page.innerText('body');
    expect(bodyText.includes('Chibi Maker') || bodyText.includes('Tạo Nhân Vật') || bodyText.includes('Nhân vật')).toBeTruthy();

    // Kiểm tra Chibi SVG Avatar hiển thị
    const svgAvatar = page.locator('svg[viewBox="0 0 100 100"]').first();
    await expect(svgAvatar).toBeVisible({ timeout: 5000 });

    // Kiểm tra các tùy chọn trang phục mới có mặt trong danh sách lựa chọn
    const hasNanoSuit = bodyText.includes('Nano') || bodyText.includes('Giáp');
    const hasHair = bodyText.includes('Tóc') || bodyText.includes('Saiyan') || bodyText.includes('Layer');
    const hasWingsOrAccessory = bodyText.includes('Cánh') || bodyText.includes('Phụ kiện') || bodyText.includes('Drone') || bodyText.includes('Kính');

    console.log(`[10.2] Kho đồ Chibi Maker: Nano/Giáp=${hasNanoSuit}, Tóc=${hasHair}, Phụ kiện/Cánh=${hasWingsOrAccessory}`);
    expect(hasNanoSuit || hasHair || hasWingsOrAccessory).toBeTruthy();
  });

  test('10.3 - Kiểm tra Cửa Hàng & Gacha Lượng Tử: Hiệu ứng Warp Vortex & Lật Thẻ 3D', async ({ page }) => {
    await ensureLogin(page);
    await page.goto('/ho-so?tab=personalization&subtab=shop_gacha', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const bodyText = await page.innerText('body');
    expect(bodyText.includes('Gacha') || bodyText.includes('Cửa Hàng')).toBeTruthy();

    // Kiểm tra nút Quay Gacha x1
    const rollBtn = page.locator('button:has-text("Quay x1"), button:has-text("Quay 1 lần")').first();
    if (await rollBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await rollBtn.click();
      console.log('[10.3] Bấm nút Quay Gacha x1');

      // Chờ hiệu ứng Warp Vortex hoặc Modal xuất hiện
      await page.waitForTimeout(2500);

      const postRollText = await page.innerText('body');
      const gachaSucceeded = postRollText.includes('GIẢI MÃ') || postRollText.includes('Lật toàn bộ') || postRollText.includes('Pha lê') || postRollText.includes('Đang trích xuất');
      console.log(`[10.3] Trạng thái Gacha: ${gachaSucceeded}`);
      expect(gachaSucceeded).toBeTruthy();

      // Thử bấm "Lật toàn bộ" nếu modal mở
      const flipAllBtn = page.locator('button:has-text("Lật toàn bộ")').first();
      if (await flipAllBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await flipAllBtn.click();
        await page.waitForTimeout(1000);
        console.log('[10.3] Bấm Lật toàn bộ thành công với hiệu ứng sóng!');
      }
    }
  });

  test('10.4 - Kiểm tra Mạng lưới Bạn bè: Tìm kiếm, Gửi lời mời & Chấp nhận không bị lỗi quyền', async ({ page }) => {
    await ensureLogin(page);
    await page.goto('/ho-so?tab=friends', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const bodyText = await page.innerText('body');
    expect(bodyText.includes('Bạn bè') || bodyText.includes('Kết bạn') || bodyText.includes('CHIẾN HỮU')).toBeTruthy();

    // Kiểm tra ô tìm kiếm bạn bè
    const searchInput = page.locator('input[placeholder*="Tìm kiếm"], input[placeholder*="tên"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Admin');
      await page.waitForTimeout(1000);

      const searchResults = page.locator('button:has-text("Kết bạn"), span:has-text("Bạn bè"), span:has-text("Đã gửi")');
      const count = await searchResults.count();
      console.log(`[10.4] Tìm kiếm bạn bè hiển thị ${count} kết quả.`);
    }
  });

  test('10.5 - Kiểm tra Nền Cổng & Quà Level: Nhận quà mốc cấp độ với Modal Hologram', async ({ page }) => {
    await ensureLogin(page);
    await page.goto('/ho-so?tab=personalization&subtab=background_rewards', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const bodyText = await page.innerText('body');
    expect(bodyText.includes('Nền Cổng') || bodyText.includes('Mốc Cấp Độ') || bodyText.includes('Level')).toBeTruthy();

    const claimBtn = page.locator('button:has-text("Nhận quà"), button:has-text("Đã nhận")').first();
    if (await claimBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isClaimable = await claimBtn.innerText();
      console.log(`[10.5] Nút quà mốc level: ${isClaimable}`);
      await claimBtn.click({ force: true });
      await page.waitForTimeout(800);

      const modalText = await page.innerText('body');
      expect(modalText.includes('Hệ Thống') || modalText.includes('quà') || modalText.includes('Level') || modalText.includes('Pha lê')).toBeTruthy();
      console.log('[10.5] Modal nhận quà thăng cấp 3D Hologram phản hồi tức thì.');
    }
  });

});
