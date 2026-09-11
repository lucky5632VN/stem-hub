const { startChrome, getWsUrl, CDPClient } = require('./cdp_tester.cjs');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\dell\\.gemini\\antigravity-ide\\brain\\c5c5557e-4515-43dc-9a08-cec531225bac';

async function testBio() {
  console.log('🧪 Bắt đầu kiểm tra Bot 2: Bio AI THPT...');
  let chromeProc;
  try {
    chromeProc = await startChrome(9222);
    const wsUrl = await getWsUrl(9222);
    const client = new CDPClient(wsUrl);
    await client.connect();
    await client.send('Page.enable');
    await client.send('Runtime.enable');

    client.ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.method === 'Runtime.consoleAPICalled') {
          console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
        }
        if (msg.method === 'Runtime.exceptionThrown') {
          console.log('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
        }
      } catch (e) {}
    });

    console.log('🌐 Điều hướng đến https://ai.stem-hub.top/labs/lab_sinh/dist/');
    await client.send('Page.navigate', { url: 'https://ai.stem-hub.top/labs/lab_sinh/dist/' });
    await new Promise(r => setTimeout(r, 4000));

    const bodyHtml = await client.evaluate('document.body.innerHTML');
    console.log('📄 Body length:', bodyHtml ? bodyHtml.length : 0);
    console.log('📄 Body snippet:', (bodyHtml || '').slice(0, 300));

    await client.waitForSelector('.chatbot-toggle-btn', 10000);
    console.log('👉 Click mở chatbot Bio AI');
    await client.evaluate(`document.querySelector('.chatbot-toggle-btn').click()`);
    await new Promise(r => setTimeout(r, 1000));

    const initialMsg = await client.evaluate(`
      const bubbles = document.querySelectorAll('.chatbot-messages .message-bubble');
      bubbles.length > 0 ? bubbles[0].innerText : ''
    `);
    console.log('📝 Tin nhắn khởi đầu của bot:', initialMsg);

    const question = 'công thức tính chiều dài ADN và số liên kết hidro';
    console.log(`📤 Gửi câu hỏi: "${question}"`);
    await client.evaluate(`
      const input = document.querySelector('.chatbot-input-area input');
      input.value = '${question}';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('.chatbot-input-area button').click();
    `);

    console.log('⏳ Đang chờ Bio AI trả lời...');
    await client.waitForFunction(`
      () => {
        const msgs = document.querySelectorAll('.chatbot-messages .chatbot-message.bot');
        if (msgs.length < 2) return false;
        const last = msgs[msgs.length - 1];
        if (last.querySelector('.typing-indicator')) return false;
        const text = last.innerText.trim();
        return text.length > 15;
      }
    `, 25000);

    const result = await client.evaluate(`
      const msgs = document.querySelectorAll('.chatbot-messages .chatbot-message.bot');
      const last = msgs[msgs.length - 1];
      const bubble = last.querySelector('.message-bubble');
      return {
        text: last.innerText.trim(),
        html: bubble ? bubble.innerHTML : last.innerHTML
      };
    `);

    console.log('\n========================================');
    console.log('💬 NỘI DUNG PHẢN HỒI CỦA BIO AI:');
    console.log(result.text);
    console.log('========================================\n');

    const wordCount = result.text.split(/\\s+/).length;
    console.log(`📊 Số từ: ${wordCount} từ (Tiêu chuẩn tóm tắt: <= 80 từ)`);
    console.log(`📐 Có KaTeX class: ${result.html.includes('katex')}`);
    console.log(`✨ Có công thức L = hoặc H =: ${result.text.includes('L =') || result.text.includes('H =')}`);
    console.log(`🧹 Không còn dấu sao thô (**): ${!result.text.includes('**')}`);
    console.log(`🚫 Không có lời chào robot: ${!/xin\s+chào/i.test(result.text)}`);

    const screenshotPath = path.join(ARTIFACTS_DIR, 'bio_ai_live_verified.png');
    await client.captureScreenshot(screenshotPath);
    console.log(`📸 Đã lưu ảnh chụp xác thực tại: ${screenshotPath}`);

  } catch (err) {
    console.error('❌ Lỗi:', err);
  } finally {
    if (chromeProc) chromeProc.kill();
  }
}

testBio();
