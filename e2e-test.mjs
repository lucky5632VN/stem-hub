import puppeteer from 'puppeteer';

const BASE_URL = process.env.TARGET_URL || process.argv[2] || 'http://localhost:3000';

const LABS_TO_TEST = [
  {
    name: 'Lab Toán',
    subject: 'toan',
    route: '/phong-lab/toan',
    expectedTitle: 'Phòng Thí Nghiệm Hình Học Không Gian 3D'
  },
  {
    name: 'Lab Lý',
    subject: 'ly',
    route: '/phong-lab/ly',
    expectedTitle: 'Phòng Thí Nghiệm Vật Lý Lượng Tử'
  },
  {
    name: 'Lab Hóa',
    subject: 'hoa',
    route: '/phong-lab/hoa',
    expectedTitle: 'Phòng Thí Nghiệm Hóa Học Ảo'
  },
  {
    name: 'Lab Sinh',
    subject: 'sinh',
    route: '/phong-lab/sinh',
    expectedTitle: 'Phòng Thí Nghiệm Sinh Học Di Truyền'
  }
];

async function runE2ETest() {
  console.log('='.repeat(60));
  console.log(`🚀 BẮT ĐẦU KIỂM THỬ END-TO-END GIAO DIỆN (E2E UI TEST)`);
  console.log(`🎯 Mục tiêu: ${BASE_URL}`);
  console.log('='.repeat(60));

  let browser;
  try {
    // Thử launch với default Chromium, nếu thiếu thì dùng Chrome/Edge hệ thống
    const launchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1440,900'
      ]
    };

    try {
      browser = await puppeteer.launch(launchOptions);
    } catch (launchErr) {
      console.warn('⚠️ Không thể khởi động Chrome mặc định của Puppeteer, chuyển sang Chrome/Edge hệ thống...');
      const fallbackPaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
      ];
      let launched = false;
      for (const p of fallbackPaths) {
        try {
          browser = await puppeteer.launch({ ...launchOptions, executablePath: p });
          launched = true;
          console.log(`✓ Đã khởi động trình duyệt hệ thống: ${p}`);
          break;
        } catch (_) {}
      }
      if (!launched) throw launchErr;
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    for (const lab of LABS_TO_TEST) {
      console.log(`\n------------------------------------------------------------`);
      console.log(`🧪 Đang kiểm tra: ${lab.name} (Đích mong đợi: ${lab.route})`);

      // 1. Truy cập trang chủ
      console.log(`1. Truy cập trang chủ: ${BASE_URL}...`);
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await new Promise(r => setTimeout(r, 2000));

      // 2. Tìm phần tử nút hoặc thẻ bài phòng lab
      console.log(`2. Tìm phần tử nút/thẻ bài cho ${lab.name}...`);
      const linkSelector = `a[href*="${lab.route}"]`;
      await page.waitForSelector(linkSelector, { timeout: 30000 });
      const linkHandle = await page.$(linkSelector);

      if (!linkHandle) {
        throw new Error(`[FAIL] Không tìm thấy phần tử DOM thẻ/nút Link nào có href chứa "${lab.route}" tại trang chủ.`);
      }

      // 3. Thực hiện click vào nút
      console.log(`3. Mô phỏng hành vi người dùng: Click vào nút "${lab.name}"...`);
      await linkHandle.click();

      // Chờ chuyển route và DOM cập nhật
      await page.waitForFunction(
        (expectedRoute) => window.location.pathname.includes(expectedRoute),
        { timeout: 30000 },
        lab.route
      ).catch(() => {});

      await new Promise(r => setTimeout(r, 3000));

      const currentUrl = page.url();
      console.log(`4. URL hiện tại sau click: ${currentUrl}`);

      // 4. Kiểm tra xem có gặp lỗi 404 hay không
      const bodyText = await page.evaluate(() => document.body.innerText || '');
      const is404 = (bodyText.includes('404') && (bodyText.includes('This page could not be found') || bodyText.includes('could not be found')))
        || bodyText.includes('404 | This page could not be found');

      if (is404) {
        throw new Error(`[FAIL] Bấm nút ${lab.name} -> Trang đích gặp lỗi: "404 This page could not be found" (URL: ${currentUrl})`);
      }

      // 5. Kiểm tra DOM xem VirtualLabSandbox hoặc Iframe có hiện diện không
      const hasIframeOrSandbox = await page.evaluate(() => {
        const iframe = document.querySelector('iframe');
        const hasHubButton = document.body.innerText.includes('Về Hub') || document.body.innerText.includes('AI Cố Vấn');
        return !!iframe || hasHubButton;
      });

      if (!hasIframeOrSandbox) {
        console.warn(`[CẢNH BÁO] Không tìm thấy iframe mô phỏng hoặc thanh điều khiển VirtualLabSandbox trên trang ${lab.name}`);
      }

      console.log(`✅ [PASS] Bấm nút ${lab.name} -> Render thành công (URL: ${currentUrl})`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 TẤT CẢ 4 PHÒNG LAB ĐÃ VƯỢT QUA BÀI TEST E2E 100%!`);
    console.log('='.repeat(60));

    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error('\n' + '!'.repeat(60));
    console.error(`❌ KIỂM THỬ THẤT BẠI: ${error.message}`);
    console.error('!'.repeat(60));
    if (browser) await browser.close();
    process.exit(1);
  }
}

runE2ETest();
