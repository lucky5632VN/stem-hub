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

  console.log('🌐 Điều hướng đến: https://ai.stem-hub.top/labs/PhysicsLab/index.html');
  await send('Page.navigate', { url: 'https://ai.stem-hub.top/labs/PhysicsLab/index.html' });
  await new Promise(r => setTimeout(r, 4000));

  // Reset localStorage
  await send('Runtime.evaluate', {
    expression: `
      localStorage.removeItem('physics_ai_sessions');
      localStorage.removeItem('physics_ai_current_session_id');
    `,
    awaitPromise: true
  });
  await send('Page.reload', { ignoreCache: true });
  await new Promise(r => setTimeout(r, 3000));

  // Click mở chatbot Vật lý
  console.log('👉 Click mở Physics AI Chatbot (#physics-ai-toggle)...');
  await send('Runtime.evaluate', {
    expression: `
      const box = document.querySelector('#physics-ai-box');
      const toggle = document.querySelector('#physics-ai-toggle');
      if (box) box.classList.add('open');
      if (toggle) toggle.style.display = 'none';
    `,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 1000));

  // Kiểm tra tin nhắn chào khởi đầu
  const initMsgRes = await send('Runtime.evaluate', {
    expression: `document.querySelector('.pai-msg.ai')?.innerText || ''`,
    returnByValue: true
  });
  const initialPhysicsMsg = initMsgRes.result?.value || '';
  console.log('📝 Tin nhắn khởi đầu Physics AI:', initialPhysicsMsg);
  const cleanPhysicsGreeting = !/xin\s+chào.*chuyên\s+gia\s+ai/i.test(initialPhysicsMsg) && !/thầy\s+là/i.test(initialPhysicsMsg);
  console.log('🚫 Đã loại bỏ chào hỏi robot/thầy là:', cleanPhysicsGreeting ? '✅ ĐẠT' : '❌ CHƯA ĐẠT');

  // Gửi câu hỏi: công thức chu kỳ con lắc đơn và con lắc lò xo
  const question = 'công thức tính chu kỳ con lắc đơn và con lắc lò xo';
  console.log(`📤 Gửi câu hỏi kiểm tra: "${question}"`);
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const input = document.querySelector('#pai-input');
        if (!input) return 'no input';
        input.value = '${question}';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const sendBtn = document.querySelector('#pai-send');
        if (sendBtn) sendBtn.click();
        return 'sent';
      })()
    `,
    returnByValue: true
  });

  console.log('⏳ Chờ Physics AI phản hồi...');
  let responseText = '';
  let responseHtml = '';

  for (let i = 0; i < 35; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const checkRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const msgs = document.querySelectorAll('.pai-msg.ai');
          if (msgs.length < 2) return null;
          const last = msgs[msgs.length - 1];
          if (last.querySelector('.pai-typing') || last.querySelector('.typing-indicator')) return null;
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
      responseText = checkRes.result.value.text;
      responseHtml = checkRes.result.value.html;
      break;
    }
  }

  console.log('\n======================================================');
  console.log('💬 NỘI DUNG PHẢN HỒI CỦA PHYSICS AI:');
  console.log(responseText);
  console.log('======================================================\n');

  const wordCount = responseText.split(/\s+/).length;
  const hasKatex = responseHtml.includes('katex');
  const hasFormulas = responseText.includes('T =') || responseHtml.includes('katex');
  const noRawStars = !responseText.includes('**');
  const noAiGreeting = !/chào\s+em/i.test(responseText) && !/thầy\s+là/i.test(responseText) && !/tôi\s+là\s+trợ\s+lý/i.test(responseText);

  console.log('📊 ĐÁNH GIÁ CHỈ TIÊU YÊU CẦU CỦA NGƯỜI DÙNG:');
  console.log(`1. Tóm tắt súc tích: ${wordCount <= 85 ? '✅ ĐẠT' : '⚠️ VƯỢT'} (${wordCount} từ)`);
  console.log(`2. Đưa công thức vào đầy đủ: ${hasFormulas ? '✅ ĐẠT' : '❌ THIẾU'}`);
  console.log(`3. Công thức chuẩn KaTeX/LaTeX: ${hasKatex ? '✅ ĐẠT (KaTeX element đã render)' : '❌ CHƯA CÓ KATEX'}`);
  console.log(`4. Xoá hết dấu sao thô (**): ${noRawStars ? '✅ ĐẠT' : '❌ CÒN DẤU SAO'}`);
  console.log(`5. Xoá hết dấu xưng danh/chào hỏi AI: ${noAiGreeting ? '✅ ĐẠT' : '❌ CÒN DẤU'}`);

  // Đảm bảo khung chat hiển thị và scroll xuống cuối
  await send('Runtime.evaluate', {
    expression: `
      const box = document.querySelector('#physics-ai-box');
      if (box) box.classList.add('open');
      const container = document.querySelector('#pai-msg-container');
      if (container) container.scrollTop = container.scrollHeight;
    `,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 600));

  // Chụp ảnh màn hình làm bằng chứng
  const shotRes = await send('Page.captureScreenshot', { format: 'png' });
  const shotPath = path.join(ARTIFACTS_DIR, 'physics_ai_live_verified.png');
  fs.writeFileSync(shotPath, Buffer.from(shotRes.data, 'base64'));
  console.log(`📸 Đã lưu ảnh chụp xác thực tại: ${shotPath}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});
