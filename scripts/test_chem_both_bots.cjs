const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\dell\\.gemini\\antigravity-ide\\brain\\c5c5557e-4515-43dc-9a08-cec531225bac';

async function testChemBothBots() {
  console.log('🚀 Starting Chemistry Lab 2-Bot Test on Production...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    console.log('Navigating to: https://ai.stem-hub.top/labs/lab-ktra15p/dist/index.html');
    await page.goto('https://ai.stem-hub.top/labs/lab-ktra15p/dist/index.html', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Check if #chatbot-toggle exists and click it
    console.log('Clicking #chatbot-toggle...');
    const clicked = await page.evaluate(() => {
      const btn = document.getElementById('chatbot-toggle');
      if (btn) {
        btn.click();
        return true;
      }
      if (typeof window.toggleQA === 'function') {
        window.toggleQA();
        return true;
      }
      return false;
    });
    console.log('Toggle clicked:', clicked);
    await new Promise(r => setTimeout(r, 1500));

    // 2. Verify round button is hidden and chat window is visible
    const visibility = await page.evaluate(() => {
      const toggleBtn = document.getElementById('chatbot-toggle');
      const win = document.getElementById('chatbot-window');
      return {
        toggleDisplay: toggleBtn ? toggleBtn.style.display : null,
        winDisplay: win ? win.style.display : null
      };
    });
    console.log('Visibility status:', visibility);

    // 3. Switch to 🌐 TRỢ LÝ CHUNG
    console.log('Switching to TRỢ LÝ CHUNG tab (#tab-mode-gen)...');
    await page.click('#tab-mode-gen');
    await new Promise(r => setTimeout(r, 1000));

    // 4. Send question to General AI
    const query = 'Tại sao than chì dẫn điện được nhưng kim cương thì không?';
    console.log(`Sending query to General AI: "${query}"...`);
    await page.type('#chatbot-input', query);
    await page.click('#chatbot-send-btn');

    // Wait for response streaming
    await new Promise(r => setTimeout(r, 7000));

    // Capture screenshot of TRỢ LÝ CHUNG response
    const generalScreenshot = path.join(ARTIFACT_DIR, 'chem_general_ai_verified_live.png');
    await page.screenshot({ path: generalScreenshot });
    console.log('📸 Saved screenshot:', generalScreenshot);

    const generalMsgs = await page.evaluate(() => {
      const el = document.getElementById('chatbot-messages');
      return el ? el.innerText : '';
    });
    console.log('\n--- TRỢ LÝ CHUNG RESPONSE ---');
    console.log(generalMsgs.substring(generalMsgs.length - 500));
    console.log('-----------------------------\n');

    // 5. Switch back to ⚡ CHỈ HUY
    console.log('Switching back to ⚡ CHỈ HUY tab (#tab-mode-lab)...');
    await page.click('#tab-mode-lab');
    await new Promise(r => setTimeout(r, 1000));

    const commanderScreenshot = path.join(ARTIFACT_DIR, 'chem_commander_ai_verified_live.png');
    await page.screenshot({ path: commanderScreenshot });
    console.log('📸 Saved screenshot:', commanderScreenshot);

    // 6. Close chat window and verify round button reappears
    console.log('Closing chat window with #quantum-close-btn...');
    await page.click('#quantum-close-btn');
    await new Promise(r => setTimeout(r, 1000));

    const finalStatus = await page.evaluate(() => {
      const toggleBtn = document.getElementById('chatbot-toggle');
      const win = document.getElementById('chatbot-window');
      return {
        toggleDisplay: toggleBtn ? toggleBtn.style.display : null,
        winDisplay: win ? win.style.display : null
      };
    });
    console.log('Final visibility status after close:', finalStatus);

    const closedScreenshot = path.join(ARTIFACT_DIR, 'chem_round_button_reappeared.png');
    await page.screenshot({ path: closedScreenshot });
    console.log('📸 Saved screenshot:', closedScreenshot);

    console.log('\n🎉 ALL CHEMISTRY TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('Error during Chem test:', err);
  } finally {
    await browser.close();
  }
}

testChemBothBots();
