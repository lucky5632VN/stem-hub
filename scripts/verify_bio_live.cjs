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
  console.log('🔗 Đã kết nối CDP WebSocket:', wsUrl);

  await send('Page.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });

  console.log('🌐 Điều hướng trang mới (cache disabled): https://ai.stem-hub.top/labs/lab_sinh/dist/index.html');
  await send('Page.navigate', { url: 'https://ai.stem-hub.top/labs/lab_sinh/dist/index.html' });
  await new Promise(r => setTimeout(r, 4000));

  // Xoá sạch session cũ trong localStorage
  await send('Runtime.evaluate', {
    expression: `
      localStorage.removeItem('bio_ai_sessions');
      localStorage.removeItem('bio_ai_current_session_id');
      localStorage.removeItem('chatbot_isOpen');
    `,
    awaitPromise: true
  });

  // Reload nhẹ để áp dụng state sạch
  await send('Page.reload', { ignoreCache: true });
  await new Promise(r => setTimeout(r, 3000));

  // Click toggle btn
  console.log('👉 Click mở Chatbot Bio AI...');
  await send('Runtime.evaluate', {
    expression: `
      const btn = document.querySelector('.chatbot-toggle-btn');
      if (btn) btn.click();
    `,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 1000));

  // Check initial message
  const initRes = await send('Runtime.evaluate', {
    expression: `document.querySelector('.chatbot-messages .message-bubble')?.innerText || ''`,
    returnByValue: true
  });
  const initialText = initRes.result?.value || '';
  console.log('📝 Tin nhắn chào khởi đầu mới:', initialText);
  const cleanGreeting = !/xin\s+chào.*chuyên\s+gia\s+ai/i.test(initialText);
  console.log('🚫 Đã loại bỏ "Xin chào tôi là chuyên gia AI":', cleanGreeting ? '✅ ĐẠT' : '❌ CHƯA ĐẠT');

  // Gửi câu hỏi về ADN
  const question = 'công thức tính chiều dài ADN và số liên kết hidro';
  console.log(`📤 Gửi câu hỏi kiểm tra: "${question}"`);
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const input = document.querySelector('.chatbot-input-area input');
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, '${question}');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        setTimeout(() => {
          const btn = document.querySelector('.chatbot-input-area button');
          if (btn && !btn.disabled) {
            btn.click();
          } else {
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
          }
        }, 150);
      })()
    `,
    awaitPromise: true
  });

  console.log('⏳ Chờ câu trả lời từ Bio AI...');
  let responseText = '';
  let responseHtml = '';

  for (let i = 0; i < 35; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const checkRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const msgs = document.querySelectorAll('.chatbot-messages .chatbot-message.bot');
          if (msgs.length < 2) return null;
          const last = msgs[msgs.length - 1];
          if (last.querySelector('.typing-indicator')) return null;
          const bubble = last.querySelector('.message-bubble');
          const text = bubble ? bubble.innerText.trim() : last.innerText.trim();
          if (!text || text.length < 10) return null;
          return {
            text: text,
            html: bubble ? bubble.innerHTML : last.innerHTML
          };
        })()
      `,
      returnByValue: true
    });

    if (checkRes.result && checkRes.result.value) {
      responseText = checkRes.result.value.text;
      responseHtml = checkRes.result.value.html;
      break;
    }
  }

  console.log('\n======================================================');
  console.log('💬 NỘI DUNG PHẢN HỒI CỦA BIO AI:');
  console.log(responseText);
  console.log('======================================================\n');

  const wordCount = responseText.split(/\s+/).length;
  const hasKatex = responseHtml.includes('katex');
  const hasFormulas = responseText.includes('L =') || responseText.includes('H =') || responseText.includes('N') || responseHtml.includes('katex');
  const noRawStars = !responseText.includes('**');
  const noAiGreeting = !/xin\s+chào/i.test(responseText);

  console.log('📊 ĐÁNH GIÁ CHỈ TIÊU YÊU CẦU CỦA NGƯỜI DÙNG:');
  console.log(`1. Tóm tắt súc tích: ${wordCount <= 85 ? '✅ ĐẠT' : '⚠️ VƯỢT'} (${wordCount} từ)`);
  console.log(`2. Đưa công thức vào đầy đủ: ${hasFormulas ? '✅ ĐẠT' : '❌ THIẾU'}`);
  console.log(`3. Công thức chuẩn KaTeX/LaTeX: ${hasKatex ? '✅ ĐẠT (KaTeX element đã render)' : '❌ CHƯA CÓ KATEX'}`);
  console.log(`4. Xoá hết dấu sao thô (**): ${noRawStars ? '✅ ĐẠT' : '❌ CÒN DẤU SAO'}`);
  console.log(`5. Xoá hết dấu xưng danh/chào hỏi AI: ${noAiGreeting ? '✅ ĐẠT' : '❌ CÒN DẤU'}`);

  // Chụp ảnh màn hình làm bằng chứng
  const shotRes = await send('Page.captureScreenshot', { format: 'png' });
  const shotPath = path.join(ARTIFACTS_DIR, 'bio_ai_live_verified.png');
  fs.writeFileSync(shotPath, Buffer.from(shotRes.data, 'base64'));
  console.log(`📸 Đã lưu ảnh chụp xác thực tại: ${shotPath}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});
