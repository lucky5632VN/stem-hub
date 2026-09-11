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

  console.log('🌐 Điều hướng đến Trang chủ Portal: https://ai.stem-hub.top/');
  await send('Page.navigate', { url: 'https://ai.stem-hub.top/' });
  await new Promise(r => setTimeout(r, 4500));

  // Reset sessions
  await send('Runtime.evaluate', {
    expression: `
      localStorage.removeItem('stem_hub_global_ai_history');
      localStorage.removeItem('stem_hub_global_ai_sessions');
    `,
    awaitPromise: true
  });
  await send('Page.reload', { ignoreCache: true });
  await new Promise(r => setTimeout(r, 3500));

  // Click mở NOVA AI
  console.log('👉 Click mở NOVA AI button...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.querySelector('button[title*="NOVA"]') || 
                    Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('NOVA AI'));
        if (btn) btn.click();
      })()
    `,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 1200));

  // Kiểm tra tin nhắn chào
  const initMsgRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const bubbles = document.querySelectorAll('.nova-hud-container div[class*="rounded-2xl"]');
        return bubbles.length > 0 ? bubbles[0].innerText.trim() : '';
      })()
    `,
    returnByValue: true
  });
  const initialNovaMsg = initMsgRes.result?.value || '';
  console.log('📝 Tin nhắn khởi đầu NOVA AI:', initialNovaMsg);
  console.log('🚫 Đã loại bỏ robot/chào hỏi AI:', !/xin\s+chào/i.test(initialNovaMsg) && !/chào\s+em/i.test(initialNovaMsg));

  // Gửi câu hỏi có công thức
  const question = 'công thức tính vận tốc cực đại và gia tốc cực đại trong dao động điều hòa';
  console.log(`📤 Gửi câu hỏi kiểm tra: "${question}"`);
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const input = document.querySelector('.nova-hud-container input[type="text"]');
        if (!input) return 'no input';
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, '${question}');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        setTimeout(() => {
          const sendBtn = document.querySelector('.nova-hud-container button[title*="Gửi"]');
          if (sendBtn) sendBtn.click();
          else input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
        }, 150);
        return 'sent';
      })()
    `,
    returnByValue: true
  });

  console.log('⏳ Chờ NOVA AI phản hồi...');
  let responseText = '';
  let responseHtml = '';

  for (let i = 0; i < 35; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const checkRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const bubbles = document.querySelectorAll('.nova-hud-container div[class*="rounded-2xl"]');
          if (bubbles.length < 2) return null;
          const last = bubbles[bubbles.length - 1];
          if (last.innerText.includes('AI đang suy nghĩ') || last.innerText.includes('Đang phân tích')) return null;
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
  console.log('💬 NỘI DUNG PHẢN HỒI CỦA NOVA AI:');
  console.log(responseText);
  console.log('======================================================\n');

  const wordCount = responseText.split(/\s+/).length;
  const hasKatex = responseHtml.includes('katex');
  const hasFormulas = responseText.includes('v_max') || responseText.includes('v_{max}') || responseText.includes('a_max') || responseText.includes('omega') || responseHtml.includes('katex') || responseText.includes('ω');
  const noRawStars = !responseText.includes('**');
  const noAiGreeting = !/xin\s+chào/i.test(responseText) && !/chào\s+bạn/i.test(responseText) && !/tôi\s+là\s+nova/i.test(responseText);

  console.log('📊 ĐÁNH GIÁ CHỈ TIÊU YÊU CẦU CỦA NGƯỜI DÙNG:');
  console.log(`1. Tóm tắt súc tích: ${wordCount <= 85 ? '✅ ĐẠT' : '⚠️ VƯỢT'} (${wordCount} từ)`);
  console.log(`2. Đưa công thức vào đầy đủ: ${hasFormulas ? '✅ ĐẠT' : '❌ THIẾU'}`);
  console.log(`3. Công thức chuẩn KaTeX/LaTeX: ${hasKatex ? '✅ ĐẠT (KaTeX element đã render)' : '❌ CHƯA CÓ KATEX'}`);
  console.log(`4. Xoá hết dấu sao thô (**): ${noRawStars ? '✅ ĐẠT' : '❌ CÒN DẤU SAO'}`);
  console.log(`5. Xoá hết dấu xưng danh/chào hỏi AI: ${noAiGreeting ? '✅ ĐẠT' : '❌ CÒN DẤU'}`);

  // Chụp ảnh màn hình làm bằng chứng
  const shotRes = await send('Page.captureScreenshot', { format: 'png' });
  const shotPath = path.join(ARTIFACTS_DIR, 'nova_ai_latex_clean.png');
  fs.writeFileSync(shotPath, Buffer.from(shotRes.data, 'base64'));
  console.log(`📸 Đã lưu ảnh chụp xác thực tại: ${shotPath}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});
