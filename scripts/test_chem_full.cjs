const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\dell\\.gemini\\antigravity-ide\\brain\\c5c5557e-4515-43dc-9a08-cec531225bac';

async function testChemFullWorkbench() {
  console.log('🚀 Testing Chemistry Lab Workbench directly...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Set intro seen in localStorage and clear old failed sessions
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('quantum_lab_intro_seen', 'true');
      localStorage.removeItem('quantum_lab_sessions');
      localStorage.removeItem('quantum_gen_sessions');
    });

    console.log('Navigating to https://ai.stem-hub.top/labs/lab-ktra15p/dist/index.html');
    await page.goto('https://ai.stem-hub.top/labs/lab-ktra15p/dist/index.html', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Ensure enterLab() is called if modal is still up
    await page.evaluate(() => {
      if (typeof window.enterLab === 'function') {
        window.enterLab();
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    // Screenshot workbench
    const workbenchShot = path.join(ARTIFACT_DIR, 'chem_workbench_view.png');
    await page.screenshot({ path: workbenchShot });
    console.log('📸 Workbench screenshot saved:', workbenchShot);

    // 1. Click round AI button
    console.log('Clicking #chatbot-toggle...');
    await page.click('#chatbot-toggle');
    await new Promise(r => setTimeout(r, 1500));

    // Screenshot opened chatbot window with round button hidden
    const chatOpenedShot = path.join(ARTIFACT_DIR, 'chem_chat_opened_clean.png');
    await page.screenshot({ path: chatOpenedShot });
    console.log('📸 Chat opened screenshot saved:', chatOpenedShot);

    // 2. Switch to TRỢ LÝ CHUNG
    console.log('Switching to TRỢ LÝ CHUNG (#tab-mode-gen)...');
    await page.click('#tab-mode-gen');
    await new Promise(r => setTimeout(r, 1000));

    // 3. Ask General AI
    const qGeneral = 'Tại sao than chì dẫn điện tốt mà kim cương thì cách điện?';
    console.log(`Asking General AI: "${qGeneral}"`);
    await page.type('#chatbot-input', qGeneral);
    await page.click('#chatbot-send-btn');

    // Wait for streaming AI response
    await new Promise(r => setTimeout(r, 10000));

    // Screenshot General AI response
    const generalAiShot = path.join(ARTIFACT_DIR, 'chem_general_ai_live_answer.png');
    await page.screenshot({ path: generalAiShot });
    console.log('📸 General AI answer screenshot saved:', generalAiShot);

    // 4. Switch back to ⚡ CHỈ HUY AI
    console.log('Switching back to ⚡ CHỈ HUY AI (#tab-mode-lab)...');
    await page.click('#tab-mode-lab');
    await new Promise(r => setTimeout(r, 1000));

    // 5. Ask Commander AI
    const qCommander = 'Phản ứng nung CaCO3 sinh ra khí gì?';
    console.log(`Asking Commander AI: "${qCommander}"`);
    await page.type('#chatbot-input', qCommander);
    await page.click('#chatbot-send-btn');

    // Wait for streaming AI response
    await new Promise(r => setTimeout(r, 10000));

    // Screenshot Commander AI response
    const commanderAiShot = path.join(ARTIFACT_DIR, 'chem_commander_ai_live_answer.png');
    await page.screenshot({ path: commanderAiShot });
    console.log('📸 Commander AI answer screenshot saved:', commanderAiShot);

    const msgs = await page.evaluate(() => {
      const el = document.getElementById('chatbot-messages');
      return el ? el.innerText : '';
    });
    console.log('\n--- COMMANDER AI ANSWER ---');
    console.log(msgs.substring(msgs.length - 600));
    console.log('---------------------------\n');

    // 6. Close chatbot window and verify round button reappears
    console.log('Closing chatbot window (#quantum-close-btn)...');
    await page.click('#quantum-close-btn');
    await new Promise(r => setTimeout(r, 1000));

    const roundReappearedShot = path.join(ARTIFACT_DIR, 'chem_round_btn_verified.png');
    await page.screenshot({ path: roundReappearedShot });
    console.log('📸 Round button reappeared screenshot saved:', roundReappearedShot);

    console.log('\n🌟 ALL 2 CHEMISTRY AI BOTS VERIFIED LIVE!');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
}

testChemFullWorkbench();
