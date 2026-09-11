const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\dell\\.gemini\\antigravity-ide\\brain\\c5c5557e-4515-43dc-9a08-cec531225bac';

async function testChemLab() {
  console.log('🚀 Launching Chrome to test Chemistry Lab Workbench...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    console.log('Navigating to: https://ai.stem-hub.top/labs/lab-ktra15p/dist/index.html');
    await page.goto('https://ai.stem-hub.top/labs/lab-ktra15p/dist/index.html', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Click "KHÁM PHÁ NGAY" to enter workbench
    const entered = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const enterBtn = btns.find(b => b.innerText.includes('KHÁM PHÁ NGAY'));
      if (enterBtn) {
        enterBtn.click();
        return true;
      }
      return false;
    });
    console.log('Clicked "KHÁM PHÁ NGAY":', entered);
    await new Promise(r => setTimeout(r, 2000));

    // Confirm safety rules
    const confirmedRules = await page.evaluate(() => {
      const confirmBtn = document.querySelector('.btn-confirm-rules');
      if (confirmBtn) {
        confirmBtn.click();
        return true;
      }
      if (typeof window.confirmLabRules === 'function') {
        window.confirmLabRules();
        return true;
      }
      return false;
    });
    console.log('Confirmed lab rules:', confirmedRules);
    await new Promise(r => setTimeout(r, 1500));

    // Equip safety gear and enter lab
    const enteredWorkbench = await page.evaluate(() => {
      if (typeof window.toggleSafetyGear === 'function') {
        window.toggleSafetyGear('goggles');
        window.toggleSafetyGear('gloves');
        window.toggleSafetyGear('lab-coat');
      }
      const enterBtn = document.getElementById('btnEnterLab');
      if (enterBtn) {
        enterBtn.disabled = false;
        enterBtn.click();
        return true;
      }
      if (typeof window.enterLab === 'function') {
        window.enterLab();
        return true;
      }
      return false;
    });
    console.log('Equipped gear & entered workbench:', enteredWorkbench);
    await new Promise(r => setTimeout(r, 2000));

    // Now in workbench: find floating AI button #quantum-fab-btn
    const clickedFab = await page.evaluate(() => {
      const fab = document.getElementById('quantum-fab-btn');
      if (fab) {
        fab.click();
        return true;
      }
      return false;
    });
    console.log('Clicked quantum-fab-btn:', clickedFab);
    await new Promise(r => setTimeout(r, 1500));

    // Take screenshot of opened modal with both tabs
    const chemOpenModalPath = path.join(ARTIFACT_DIR, 'chem_modal_live_opened.png');
    await page.screenshot({ path: chemOpenModalPath });
    console.log('📸 Modal open screenshot saved:', chemOpenModalPath);

    // Switch to TRỢ LÝ CHUNG
    const switchedToGeneral = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const genBtn = btns.find(b => b.innerText.includes('TRỢ LÝ CHUNG'));
      if (genBtn) {
        genBtn.click();
        return true;
      }
      return false;
    });
    console.log('Switched to TRỢ LÝ CHUNG:', switchedToGeneral);
    await new Promise(r => setTimeout(r, 1500));

    // Send question
    const inputSelector = '#quantum-input';
    await page.waitForSelector(inputSelector, { timeout: 5000 });
    await page.type(inputSelector, 'Tại sao than chì dẫn điện được nhưng kim cương thì không?');
    await page.keyboard.press('Enter');
    console.log('Query sent to Chem General AI: "Tại sao than chì dẫn điện được nhưng kim cương thì không?"');

    // Wait for response
    await new Promise(r => setTimeout(r, 7000));

    const generalAiScreenshot = path.join(ARTIFACT_DIR, 'chem_general_ai_answered.png');
    await page.screenshot({ path: generalAiScreenshot });
    console.log('📸 Chem General AI answered screenshot saved:', generalAiScreenshot);

    const chatContent = await page.evaluate(() => {
      const body = document.getElementById('quantum-body');
      return body ? body.innerText : '';
    });
    console.log('Chat body snippet:\n', chatContent.substring(chatContent.length - 500));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

testChemLab();
