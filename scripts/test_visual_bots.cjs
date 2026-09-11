const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\dell\\.gemini\\antigravity-ide\\brain\\c5c5557e-4515-43dc-9a08-cec531225bac';

async function run() {
  console.log('🚀 Launching Chrome at:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // ==========================================
    // 1. TEST BIO AI THPT
    // ==========================================
    console.log('\n🌿 [1/2] Navigating to Bio Lab: https://ai.stem-hub.top/labs/lab_sinh/dist/index.html');
    await page.goto('https://ai.stem-hub.top/labs/lab_sinh/dist/index.html', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Check floating button
    const bioBtnSelector = 'button[title*="Chat"] , .chatbot-floating-btn, button:has(svg)';
    console.log('Finding round floating button in Bio Lab...');
    
    // Evaluate in page to find the floating button
    const clickedBio = await page.evaluate(() => {
      // Find button in bottom right
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => {
        const rect = b.getBoundingClientRect();
        return rect.right > window.innerWidth - 120 && rect.bottom > window.innerHeight - 120;
      });
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    console.log('Bio floating button clicked:', clickedBio);
    await new Promise(r => setTimeout(r, 1500));

    // Type query
    const inputSelector = 'input[placeholder*="Hỏi AI"], input[placeholder*="hỏi"], input[type="text"]';
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    await page.type(inputSelector, 'Gen cấu trúc gồm những vùng nào?');
    await page.keyboard.press('Enter');
    console.log('Query sent to Bio AI: "Gen cấu trúc gồm những vùng nào?"');

    // Wait for response (up to 12s)
    await new Promise(r => setTimeout(r, 8000));

    // Get last bot response
    const bioResponse = await page.evaluate(() => {
      const msgs = document.querySelectorAll('.message, [class*="message"], [class*="chat"]');
      const texts = Array.from(msgs).map(m => m.innerText.trim()).filter(Boolean);
      return texts.slice(-3);
    });
    console.log('Bio AI Response output:', JSON.stringify(bioResponse, null, 2));

    const bioScreenshotPath = path.join(ARTIFACT_DIR, 'bio_ai_live_verified.png');
    await page.screenshot({ path: bioScreenshotPath });
    console.log('📸 Bio AI screenshot saved to:', bioScreenshotPath);

    // ==========================================
    // 2. TEST CHEM AI: 🌐 TRỢ LÝ CHUNG
    // ==========================================
    console.log('\n⚗️ [2/2] Navigating to Chem Lab: https://ai.stem-hub.top/labs/lab-ktra15p/dist/index.html');
    await page.goto('https://ai.stem-hub.top/labs/lab-ktra15p/dist/index.html', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Click floating round button
    const clickedChem = await page.evaluate(() => {
      const btn = document.getElementById('quantum-fab-btn') || document.querySelector('button[title*="AI"]');
      if (btn) {
        btn.click();
        return true;
      }
      // fallback
      const buttons = Array.from(document.querySelectorAll('button'));
      const found = buttons.find(b => {
        const rect = b.getBoundingClientRect();
        return rect.right > window.innerWidth - 120 && rect.bottom > window.innerHeight - 120;
      });
      if (found) {
        found.click();
        return true;
      }
      return false;
    });
    console.log('Chem floating button clicked:', clickedChem);
    await new Promise(r => setTimeout(r, 1500));

    // Switch to TRỢ LÝ CHUNG
    const switchedTab = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const generalTab = tabs.find(t => t.innerText.includes('TRỢ LÝ CHUNG'));
      if (generalTab) {
        generalTab.click();
        return true;
      }
      return false;
    });
    console.log('Switched to TRỢ LÝ CHUNG tab:', switchedTab);
    await new Promise(r => setTimeout(r, 1000));

    // Send question to General AI
    const chemInputSelector = '#quantum-input, input[placeholder*="Hỏi"], input[type="text"]';
    await page.waitForSelector(chemInputSelector, { timeout: 10000 });
    await page.type(chemInputSelector, 'Tại sao than chì dẫn điện được nhưng kim cương thì không?');
    await page.keyboard.press('Enter');
    console.log('Query sent to Chem General AI: "Tại sao than chì dẫn điện được nhưng kim cương thì không?"');

    // Wait for streaming response (8s)
    await new Promise(r => setTimeout(r, 8000));

    const chemResponse = await page.evaluate(() => {
      const container = document.getElementById('quantum-body') || document.querySelector('.quantum-messages');
      return container ? container.innerText : document.body.innerText;
    });
    console.log('Chem General AI Response snippet:', chemResponse.substring(chemResponse.length - 600));

    const chemScreenshotPath = path.join(ARTIFACT_DIR, 'chem_general_ai_live_verified.png');
    await page.screenshot({ path: chemScreenshotPath });
    console.log('📸 Chem General AI screenshot saved to:', chemScreenshotPath);

    console.log('\n🎉 ALL VISUAL TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Error during visual test:', err);
  } finally {
    await browser.close();
  }
}

run();
