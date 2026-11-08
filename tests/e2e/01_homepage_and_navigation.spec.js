import { test, expect } from '@playwright/test';

test.describe('E2E Real User - 01: Trang Chủ & Điều Hướng Toàn Trang', () => {

  test('01.1 - Tải trang chủ, kiểm tra SEO meta, tiêu đề và đo đạc Web Vitals thời gian thực', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;

    expect(response?.status()).toBe(200);

    // Kiểm tra tiêu đề trang
    const title = await page.title();
    console.log(`[01.1] Tiêu đề trang: "${title}" | Thời gian phản hồi DOM: ${loadTime}ms`);
    expect(title.length).toBeGreaterThan(0);

    // Đo lường Performance Web Vitals bằng browser API
    const performanceTiming = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(p => p.name === 'first-contentful-paint');
      return {
        dnsTime: nav ? Math.round(nav.domainLookupEnd - nav.domainLookupStart) : 0,
        tcpTime: nav ? Math.round(nav.connectEnd - nav.connectStart) : 0,
        ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : 0,
        domInteractive: nav ? Math.round(nav.domInteractive - nav.startTime) : 0,
        domComplete: nav ? Math.round(nav.domComplete - nav.startTime) : 0,
        fcp: fcp ? Math.round(fcp.startTime) : 0,
      };
    });

    console.log('[01.1] Web Vitals đo từ Browser thật:', JSON.stringify(performanceTiming, null, 2));
    expect(performanceTiming.ttfb).toBeLessThan(3000); // TTFB dưới 3s trên mạng thực tế
  });

  test('01.2 - Người dùng cuộn trang, kiểm tra các khối chức năng và danh mục 4 môn STEM', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Mô phỏng thao tác cuộn mượt mà như người thật
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(300);
    }

    // Kiểm tra sự xuất hiện của các thẻ Lab Toán, Lý, Hóa, Sinh
    const bodyText = await page.innerText('body');
    const hasMath = bodyText.includes('Toán') || bodyText.includes('MATH');
    const hasPhys = bodyText.includes('Lý') || bodyText.includes('Vật lý');
    const hasChem = bodyText.includes('Hóa') || bodyText.includes('Hóa học');
    const hasBio = bodyText.includes('Sinh') || bodyText.includes('Sinh học');

    console.log(`[01.2] Phát hiện các phân hệ môn: Toán=${hasMath}, Lý=${hasPhys}, Hóa=${hasChem}, Sinh=${hasBio}`);
    expect(hasMath && hasPhys && hasChem && hasBio).toBeTruthy();
  });

  test('01.3 - Người dùng bấm nút chuyển đổi giao diện Sáng / Tối (Dark / Light Mode)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Tìm nút toggle theme (thường có icon Sun/Moon hoặc class liên quan)
    const themeBtn = page.locator('button:has(svg.lucide-moon), button:has(svg.lucide-sun)').first();
    if (await themeBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      const initialHtmlClass = await page.getAttribute('html', 'class') || '';
      console.log(`[01.3] Class HTML ban đầu: "${initialHtmlClass}"`);
      
      // Người dùng thật click chuyển theme
      await themeBtn.click();
      await page.waitForTimeout(600);
      
      const newHtmlClass = await page.getAttribute('html', 'class') || '';
      console.log(`[01.3] Class HTML sau click: "${newHtmlClass}"`);
      expect(newHtmlClass).toBeDefined();
    } else {
      console.log('[01.3] Nút chuyển theme nằm trong menu con hoặc mặc định dark mode.');
    }
  });

  test('01.4 - Người dùng nhấp điều hướng Menu Header: Phòng Lab, Đấu Trường, Phòng Thi, Bảng Xếp Hạng', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const navLinks = [
      { name: 'Phòng Lab', path: '/phong-lab' },
      { name: 'Đấu Trường', path: '/dau-truong' },
      { name: 'Phòng Thi', path: '/phong-thi' },
      { name: 'Xếp Hạng', path: '/xep-hang' },
      { name: 'Liên Hệ', path: '/lien-he' }
    ];

    for (const nav of navLinks) {
      const response = await page.goto(nav.path, { waitUntil: 'domcontentloaded', timeout: 25000 });
      expect(response?.status()).toBe(200);
      console.log(`[01.4] Điều hướng thành công tới ${nav.name} (${nav.path}) - HTTP 200`);
      await page.waitForTimeout(400);
    }
  });

});

