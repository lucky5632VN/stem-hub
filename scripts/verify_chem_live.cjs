const fs = require('fs');
const path = require('path');
const http = require('http');

const ARTIFACTS_DIR = 'C:\\Users\\dell\\.gemini\\antigravity-ide\\brain\\c5c5557e-4515-43dc-9a08-cec531225bac';

function getWsUrl(port = 9222) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/json/list`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          const page = list.find(t => t.type === 'page');
          if (page && page.webSocketDebuggerUrl) {
            resolve(page.webSocketDebuggerUrl);
          } else {
            reject(new Error('No page target found in Chrome'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const wsUrl = await getWsUrl(9222);
  const ws = new WebSocket(wsUrl);

  let msgId = 1;
  const callbacks = new Map();

  function send(method, params = {}) {
    const id = msgId++;
    return new Promise((resolve, reject) => {
      callbacks.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      const cb = callbacks.get(data.id);
      callbacks.delete(data.id);
      if (data.error) cb.reject(new Error(data.error.message));
      else cb.resolve(data.result);
    }
  };

  await new Promise((res) => { ws.onopen = res; });
  console.log('🔗 Đã kết nối CDP WebSocket');

  await send('Page.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });

  console.log('🌐 Điều hướng đến Lab Hóa học: https://ai.stem-hub.top/labs/lab-ktra15p/dist/index.html');
  await send('Page.navigate', { url: 'https://ai.stem-hub.top/labs/lab-ktra15p/dist/index.html' });
  await new Promise(r => setTimeout(r, 4000));

  // Reset sessions
  await send('Runtime.evaluate', {
    expression: `
      localStorage.removeItem('quantum_lab_sessions');
      localStorage.removeItem('quantum_gen_sessions');
      localStorage.removeItem('chatbot_isOpen');
    `,
    awaitPromise: true
  });
  await send('Page.reload', { ignoreCache: true });
  await new Promise(r => setTimeout(r, 3000));

  // Đảm bảo ẩn các lớp phủ onboarding để hiển thị trực quan bàn thí nghiệm và khung chat
  console.log('👉 Ẩn các modal giới thiệu & chuẩn bị để hiện rõ bàn thí nghiệm...');
  await send('Runtime.evaluate', {
    expression: `
      ['introOverlay', 'welcomeSetupModal', 'labRulesModal', 'eco-report-overlay'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      const toggle = document.getElementById('chatbot-toggle');
      if (toggle) toggle.click();
      const win = document.getElementById('chatbot-window');
      if (win) {
        win.style.setProperty('display', 'flex', 'important');
        win.style.zIndex = '99999';
      }
    `,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 1200));

  // =========================================================================
  // BOT 5: CHỈ HUY AI (LAB MODE)
  // =========================================================================
  console.log('\n--- ⚡ KIỂM TRA BOT 5: CHỈ HUY AI (LAB MODE) ---');
  await send('Runtime.evaluate', {
    expression: `
      const tab = document.getElementById('tab-mode-lab') || document.querySelector('.mode-btn[data-bot="lab"]');
      if (tab) tab.click();
    `,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 800));

  const initCmdMsgRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const msgs = document.querySelectorAll('#chatbot-messages .message');
        return msgs.length > 0 ? msgs[0].innerText.trim() : '';
      })()
    `,
    returnByValue: true
  });
  const initCmdMsg = initCmdMsgRes.result?.value || '';
  console.log('📝 Tin nhắn khởi đầu Chỉ Huy AI:', initCmdMsg);
  console.log('🚫 Đã loại bỏ robot/chào hỏi AI:', !/xin\s+chào/i.test(initCmdMsg));

  // Gửi câu hỏi cho Chỉ Huy AI
  const questionCmd = 'phương trình phản ứng nhiệt nhôm Al tác dụng Fe2O3 viết chuẩn latex';
  console.log(`📤 Gửi câu hỏi Chỉ Huy AI: "${questionCmd}"`);
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const input = document.querySelector('#chatbot-input');
        if (!input) return 'no input';
        input.value = '${questionCmd}';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const sendBtn = document.querySelector('#chatbot-send-btn');
        if (sendBtn) sendBtn.click();
        else input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
        return 'sent';
      })()
    `,
    returnByValue: true
  });

  console.log('⏳ Chờ Chỉ Huy AI phản hồi...');
  let resCmdText = '';
  let resCmdHtml = '';

  for (let i = 0; i < 35; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const checkRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const msgs = document.querySelectorAll('#chatbot-messages .message.ai');
          if (msgs.length < 2) return null;
          const last = msgs[msgs.length - 1];
          if (last.innerText.includes('AI đang phân tích')) return null;
          const text = last.innerText.trim();
          if (!text || text.length < 10) return null;
          return {
            text: text,
            html: last.innerHTML
          };
        })()
      `,
      returnByValue: true
    });

    if (checkRes.result && checkRes.result.value) {
      resCmdText = checkRes.result.value.text;
      resCmdHtml = checkRes.result.value.html;
      break;
    }
  }

  console.log('\n======================================================');
  console.log('💬 NỘI DUNG PHẢN HỒI CỦA CHỈ HUY AI:');
  console.log(resCmdText);
  console.log('======================================================\n');

  const cmdWordCount = resCmdText.split(/\s+/).length;
  const cmdHasKatex = resCmdHtml.includes('katex');
  const cmdHasFormula = resCmdText.includes('Al') || resCmdText.includes('Fe') || cmdHasKatex;
  const cmdNoRawStars = !resCmdText.includes('**');
  const cmdNoAiGreeting = !/xin\s+chào/i.test(resCmdText) && !/tôi\s+là\s+chỉ\s+huy/i.test(resCmdText);

  console.log('📊 ĐÁNH GIÁ CHỈ HUY AI:');
  console.log(`1. Tóm tắt súc tích: ${cmdWordCount <= 85 ? '✅ ĐẠT' : '⚠️ VƯỢT'} (${cmdWordCount} từ)`);
  console.log(`2. Đưa công thức/phương trình: ${cmdHasFormula ? '✅ ĐẠT' : '❌ THIẾU'}`);
  console.log(`3. Công thức chuẩn KaTeX/LaTeX: ${cmdHasKatex ? '✅ ĐẠT (KaTeX element đã render)' : '❌ CHƯA CÓ KATEX'}`);
  console.log(`4. Xoá hết dấu sao thô (**): ${cmdNoRawStars ? '✅ ĐẠT' : '❌ CÒN DẤU SAO'}`);
  console.log(`5. Xoá hết dấu xưng danh/chào hỏi AI: ${cmdNoAiGreeting ? '✅ ĐẠT' : '❌ CÒN DẤU'}`);

  const shotCmdPath = path.join(ARTIFACTS_DIR, 'chem_commander_latex_clean.png');
  const shotCmdRes = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(shotCmdPath, Buffer.from(shotCmdRes.data, 'base64'));
  console.log(`📸 Đã lưu ảnh chụp Chỉ Huy AI tại: ${shotCmdPath}`);

  // =========================================================================
  // BOT 6: TRỢ LÝ CHUNG (GENERAL MODE)
  // =========================================================================
  console.log('\n--- 🌐 KIỂM TRA BOT 6: TRỢ LÝ CHUNG HÓA HỌC (GENERAL MODE) ---');
  await send('Runtime.evaluate', {
    expression: `
      const tab = document.getElementById('tab-mode-gen') || document.querySelector('.mode-btn[data-bot="gen"]');
      if (tab) tab.click();
    `,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 800));

  const initGenMsgRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const msgs = document.querySelectorAll('#chatbot-messages .message');
        return msgs.length > 0 ? msgs[0].innerText.trim() : '';
      })()
    `,
    returnByValue: true
  });
  const initGenMsg = initGenMsgRes.result?.value || '';
  console.log('📝 Tin nhắn khởi đầu Trợ Lý Chung:', initGenMsg);
  console.log('🚫 Đã loại bỏ robot/chào hỏi AI:', !/xin\s+chào/i.test(initGenMsg));

  // Gửi câu hỏi cho Trợ Lý Chung
  const questionGen = 'công thức tính hằng số cân bằng Kc và phản ứng este hóa';
  console.log(`📤 Gửi câu hỏi Trợ Lý Chung: "${questionGen}"`);
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const input = document.querySelector('#chatbot-input');
        if (!input) return 'no input';
        input.value = '${questionGen}';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const sendBtn = document.querySelector('#chatbot-send-btn');
        if (sendBtn) sendBtn.click();
        else input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
        return 'sent';
      })()
    `,
    returnByValue: true
  });

  console.log('⏳ Chờ Trợ Lý Chung phản hồi...');
  let resGenText = '';
  let resGenHtml = '';

  for (let i = 0; i < 35; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const checkRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const msgs = document.querySelectorAll('#chatbot-messages .message.ai');
          if (msgs.length < 2) return null;
          const last = msgs[msgs.length - 1];
          if (last.innerText.includes('AI đang phân tích')) return null;
          const text = last.innerText.trim();
          if (!text || text.length < 10) return null;
          return {
            text: text,
            html: last.innerHTML
          };
        })()
      `,
      returnByValue: true
    });

    if (checkRes.result && checkRes.result.value) {
      resGenText = checkRes.result.value.text;
      resGenHtml = checkRes.result.value.html;
      break;
    }
  }

  console.log('\n======================================================');
  console.log('💬 NỘI DUNG PHẢN HỒI CỦA TRỢ LÝ CHUNG:');
  console.log(resGenText);
  console.log('======================================================\n');

  const genWordCount = resGenText.split(/\s+/).length;
  const genHasKatex = resGenHtml.includes('katex');
  const genHasFormula = resGenText.includes('Kc') || resGenText.includes('K_c') || genHasKatex;
  const genNoRawStars = !resGenText.includes('**');
  const genNoAiGreeting = !/xin\s+chào/i.test(resGenText) && !/tôi\s+là/i.test(resGenText);

  console.log('📊 ĐÁNH GIÁ TRỢ LÝ CHUNG:');
  console.log(`1. Tóm tắt súc tích: ${genWordCount <= 85 ? '✅ ĐẠT' : '⚠️ VƯỢT'} (${genWordCount} từ)`);
  console.log(`2. Đưa công thức/phương trình: ${genHasFormula ? '✅ ĐẠT' : '❌ THIẾU'}`);
  console.log(`3. Công thức chuẩn KaTeX/LaTeX: ${genHasKatex ? '✅ ĐẠT (KaTeX element đã render)' : '❌ CHƯA CÓ KATEX'}`);
  console.log(`4. Xoá hết dấu sao thô (**): ${genNoRawStars ? '✅ ĐẠT' : '❌ CÒN DẤU SAO'}`);
  console.log(`5. Xoá hết dấu xưng danh/chào hỏi AI: ${genNoAiGreeting ? '✅ ĐẠT' : '❌ CÒN DẤU'}`);

  const shotGenPath = path.join(ARTIFACTS_DIR, 'chem_general_latex_clean.png');
  const shotGenRes = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(shotGenPath, Buffer.from(shotGenRes.data, 'base64'));
  console.log(`📸 Đã lưu ảnh chụp Trợ Lý Chung tại: ${shotGenPath}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});
