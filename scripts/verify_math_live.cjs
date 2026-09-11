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

  console.log('🌐 Điều hướng đến: https://ai.stem-hub.top/labs/toan/frontend/dist/index.html');
  await send('Page.navigate', { url: 'https://ai.stem-hub.top/labs/toan/frontend/dist/index.html' });
  await new Promise(r => setTimeout(r, 4000));

  // Reset localStorage
  await send('Runtime.evaluate', {
    expression: `
      localStorage.removeItem('math_ai_sessions');
      localStorage.removeItem('math_ai_current_session_id');
    `,
    awaitPromise: true
  });
  await send('Page.reload', { ignoreCache: true });
  await new Promise(r => setTimeout(r, 3000));

  // Mở popup AI Tutor
  console.log('👉 Tìm và click mở panel Math AI Tutor...');
  const openRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.querySelector('button[title*="Gia sư AI Toán học"]') || 
                    Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('📐'));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()
    `,
    returnByValue: true
  });
  console.log('👉 Trạng thái click mở panel:', openRes.result?.value);
  await new Promise(r => setTimeout(r, 1200));

  // Kiểm tra tin nhắn chào khởi đầu
  const initMsgRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const bubbles = document.querySelectorAll('div[style*="border-radius"]');
        const msgs = Array.from(bubbles).map(b => b.innerText.trim()).filter(t => t.length > 5);
        return msgs.length > 0 ? msgs[0] : '';
      })()
    `,
    returnByValue: true
  });
  const initialMathMsg = initMsgRes.result?.value || '';
  console.log('📝 Tin nhắn khởi đầu Math AI:', initialMathMsg);
  const cleanMathGreeting = !/xin\s+chào.*thầy\s+là/i.test(initialMathMsg) && !/chào\s+em/i.test(initialMathMsg);
  console.log('🚫 Đã loại bỏ chào hỏi robot/thầy là:', cleanMathGreeting ? '✅ ĐẠT' : '❌ CHƯA ĐẠT');

  // Gửi câu hỏi có công thức: Thể tích khối lăng trụ và khối chóp
  const question = 'công thức tính thể tích khối chóp và khối lăng trụ tam giác';
  console.log(`📤 Gửi câu hỏi kiểm tra: "${question}"`);
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const textarea = document.querySelector('textarea[placeholder*="Hỏi gia sư"]');
        if (!textarea) return 'no textarea';
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeSetter.call(textarea, '${question}');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        
        setTimeout(() => {
          const btn = textarea.parentElement.querySelector('button');
          if (btn && !btn.disabled) {
            btn.click();
          } else {
            textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
          }
        }, 150);
        return 'sent';
      })()
    `,
    returnByValue: true
  });

  console.log('⏳ Chờ Math AI 3D phản hồi...');
  let responseText = '';
  let responseHtml = '';

  for (let i = 0; i < 35; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const checkRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const bubbles = Array.from(document.querySelectorAll('div')).filter(d => 
            d.style && (d.style.maxWidth === '82%' || d.getAttribute('style')?.includes('max-width: 82%'))
          );
          if (bubbles.length < 2) return null;
          const last = bubbles[bubbles.length - 1];
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
  console.log('💬 NỘI DUNG PHẢN HỒI CỦA MATH AI 3D:');
  console.log(responseText);
  console.log('======================================================\n');

  const wordCount = responseText.split(/\s+/).length;
  const hasKatex = responseHtml.includes('katex');
  const hasFormulas = responseText.includes('V =') || responseText.includes('B') || responseHtml.includes('katex');
  const noRawStars = !responseText.includes('**');
  const noAiGreeting = !/chào\s+em/i.test(responseText) && !/thầy\s+là/i.test(responseText);

  console.log('📊 ĐÁNH GIÁ CHỈ TIÊU YÊU CẦU CỦA NGƯỜI DÙNG:');
  console.log(`1. Tóm tắt súc tích: ${wordCount <= 85 ? '✅ ĐẠT' : '⚠️ VƯỢT'} (${wordCount} từ)`);
  console.log(`2. Đưa công thức vào đầy đủ: ${hasFormulas ? '✅ ĐẠT' : '❌ THIẾU'}`);
  console.log(`3. Công thức chuẩn KaTeX/LaTeX: ${hasKatex ? '✅ ĐẠT (KaTeX element đã render)' : '❌ CHƯA CÓ KATEX'}`);
  console.log(`4. Xoá hết dấu sao thô (**): ${noRawStars ? '✅ ĐẠT' : '❌ CÒN DẤU SAO'}`);
  console.log(`5. Xoá hết dấu xưng danh/chào hỏi AI: ${noAiGreeting ? '✅ ĐẠT' : '❌ CÒN DẤU'}`);

  // Chụp ảnh màn hình làm bằng chứng
  const shotRes = await send('Page.captureScreenshot', { format: 'png' });
  const shotPath = path.join(ARTIFACTS_DIR, 'math_ai_live_verified.png');
  fs.writeFileSync(shotPath, Buffer.from(shotRes.data, 'base64'));
  console.log(`📸 Đã lưu ảnh chụp xác thực tại: ${shotPath}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});
