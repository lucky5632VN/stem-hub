/**
 * Script tự động lấy full Gemini API Keys từ Google AI Studio
 * Dùng Puppeteer/Chrome CDP để intercept network response
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Dùng Chrome profile sẵn có (đã đăng nhập) nếu có
const CHROME_PROFILE = path.join(process.env.USERPROFILE || 'C:\\Users\\dell', 
  'AppData', 'Local', 'Google', 'Chrome', 'User Data');

async function collectGeminiKeys() {
  console.log('🚀 Khởi động trình duyệt...');
  
  const browser = await chromium.launchPersistentContext(CHROME_PROFILE, {
    headless: false,
    channel: 'chrome',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--no-default-browser-check',
    ],
    viewport: { width: 1280, height: 800 }
  }).catch(async () => {
    // Fallback: dùng Chromium không có profile
    console.log('⚠️ Không dùng được Chrome profile, mở Chromium mới...');
    return chromium.launchPersistentContext(
      path.join(__dirname, '..', '.chrome_cdp_test_profile'),
      { headless: false, viewport: { width: 1280, height: 800 } }
    );
  });

  const page = browser.pages()[0] || await browser.newPage();
  const collectedKeys = [];

  // Intercept tất cả network responses để tìm API keys
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('apikey') || url.includes('credentials') || url.includes('generativelanguage')) {
      try {
        const ct = response.headers()['content-type'] || '';
        if (ct.includes('json')) {
          const json = await response.json().catch(() => null);
          if (json) {
            const text = JSON.stringify(json);
            const matches = text.match(/AIzaSy[A-Za-z0-9_-]{33}/g);
            if (matches) {
              matches.forEach(k => {
                if (!collectedKeys.includes(k)) {
                  collectedKeys.push(k);
                  console.log(`✅ Found key: ${k.substring(0, 15)}...`);
                }
              });
            }
          }
        }
      } catch (e) {}
    }
  });

  console.log('🌐 Đang mở AI Studio...');
  await page.goto('https://aistudio.google.com/apikey', { 
    waitUntil: 'networkidle',
    timeout: 120000 
  });

  // Chờ trang load, xử lý đăng nhập nếu cần
  await page.waitForTimeout(3000);
  const currentUrl = page.url();
  
  if (currentUrl.includes('accounts.google.com') || currentUrl.includes('signin')) {
    console.log('\n⏳ ĐANG CHỜ BẠN ĐĂNG NHẬP...');
    console.log('   Vui lòng đăng nhập vào Google trong cửa sổ browser vừa mở');
    console.log('   Script sẽ tự động tiếp tục sau khi đăng nhập xong\n');
    
    // Chờ đến khi URL chuyển sang AI Studio (tối đa 5 phút)
    await page.waitForURL('**/aistudio.google.com/**', { timeout: 300000 });
    await page.goto('https://aistudio.google.com/apikey', { waitUntil: 'networkidle', timeout: 60000 });
  }

  console.log('✅ Đã vào trang API Keys, đang chờ load...');
  await page.waitForTimeout(5000);

  // Thử extract từ DOM nếu có
  const domKeys = await page.evaluate(() => {
    const keys = [];
    // Tìm tất cả text có pattern AIzaSy
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while (node = walker.nextNode()) {
      const matches = node.textContent.match(/AIzaSy[A-Za-z0-9_-]{33}/g);
      if (matches) keys.push(...matches);
    }
    // Tìm trong input values
    document.querySelectorAll('input').forEach(input => {
      const val = input.value || '';
      const m = val.match(/AIzaSy[A-Za-z0-9_-]{33}/g);
      if (m) keys.push(...m);
    });
    return [...new Set(keys)];
  }).catch(() => []);

  domKeys.forEach(k => {
    if (!collectedKeys.includes(k)) {
      collectedKeys.push(k);
      console.log(`✅ Found from DOM: ${k.substring(0, 15)}...`);
    }
  });

  // Click copy button cho từng row key nếu có
  console.log('🔍 Đang tìm và click copy buttons...');
  try {
    // Tìm tất cả rows trong bảng
    const rows = await page.$$('table tbody tr, [role="row"]');
    console.log(`   Tìm thấy ${rows.length} rows`);
    
    for (const row of rows) {
      // Tìm copy button
      const copyBtn = await row.$('[aria-label*="copy" i], [title*="copy" i], button[mat-icon-button] mat-icon').catch(() => null);
      if (copyBtn) {
        // Đọc clipboard sau khi click
        await copyBtn.click().catch(() => {});
        await page.waitForTimeout(500);
        
        const clipText = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
        const m = clipText?.match?.(/AIzaSy[A-Za-z0-9_-]{33}/);
        if (m && !collectedKeys.includes(m[0])) {
          collectedKeys.push(m[0]);
          console.log(`✅ Copied from clipboard: ${m[0].substring(0, 15)}...`);
        }
      }
    }
  } catch (e) {
    console.log('   (Không click được copy buttons)');
  }

  // Reload để kích hoạt thêm network requests
  console.log('🔄 Reload để bắt thêm network requests...');
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Tổng kết
  const uniqueKeys = [...new Set(collectedKeys)].filter(k => !k.includes('BGDJCKxedUMhxuOZ9QV305Jnw')); // Lọc bỏ Firebase Web Key
  
  console.log('\n' + '='.repeat(60));
  console.log(`🎯 TỔNG KẾT: Tìm được ${uniqueKeys.length} Gemini API Keys`);
  console.log('='.repeat(60));
  uniqueKeys.forEach((k, i) => console.log(`${i + 1}. ${k}`));
  
  // Lưu vào file
  const outPath = path.join(__dirname, '..', 'scripts', 'recovered_keys.txt');
  fs.writeFileSync(outPath, uniqueKeys.join(','));
  console.log(`\n📁 Đã lưu vào: ${outPath}`);
  console.log(`\n🔑 Chuỗi combined:\n${uniqueKeys.join(',')}`);

  if (uniqueKeys.length > 0) {
    console.log('\n⚡ Đang tự động nạp lên Cloudflare...');
    const { execSync } = require('child_process');
    const workerDir = path.join(__dirname, '..', 'cloudflare-worker');
    try {
      execSync(
        `echo "${uniqueKeys.join(',')}" | npx wrangler secret put GEMINI_API_KEY`,
        { cwd: workerDir, stdio: 'inherit' }
      );
      console.log('✅ Đã nạp lên Cloudflare thành công!');
    } catch (e) {
      console.log('❌ Lỗi nạp Cloudflare:', e.message);
      console.log('   Chạy thủ công:');
      console.log(`   echo "${uniqueKeys.join(',')}" | npx wrangler secret put GEMINI_API_KEY`);
    }
  }

  await page.waitForTimeout(5000);
  await browser.close();
}

collectGeminiKeys().catch(console.error);
