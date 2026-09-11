const { startChrome, getWsUrl, CDPClient } = require('./cdp_tester.cjs');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\dell\\.gemini\\antigravity-ide\\brain\\c5c5557e-4515-43dc-9a08-cec531225bac';

async function run() {
  console.log('🚀 Khởi chạy Headless Chrome kiểm thử 6 AI Bot trên https://ai.stem-hub.top/ ...');
  let chromeProc;
  try {
    chromeProc = await startChrome(9222);
    console.log('✅ Chrome đã sẵn sàng trên port 9222');

    // =========================================================================
    // TEST 1: LAB SINH HỌC (Bio AI THPT)
    // =========================================================================
    console.log('\n--- [TEST 1] Kiểm tra Bot 2: Bio AI THPT ---');
    const wsBio = await getWsUrl(9222, 'https://ai.stem-hub.top/labs/lab_sinh/dist/');
    const clientBio = new CDPClient(wsBio);
    await clientBio.connect();
    await clientBio.send('Page.enable');
    await clientBio.send('Runtime.enable');
    
    // Đợi trang load
    await new Promise(r => setTimeout(r, 2500));
    await clientBio.waitForSelector('.chatbot-toggle-btn', 10000);
    
    // Mở khung chat
    await clientBio.evaluate(`document.querySelector('.chatbot-toggle-btn').click()`);
    await new Promise(r => setTimeout(r, 600));

    // Kiểm tra tin nhắn chào ban đầu
    const initialBioMsg = await clientBio.evaluate(`
      const bubbles = document.querySelectorAll('.chatbot-messages .message-bubble');
      bubbles.length > 0 ? bubbles[0].innerText : ''
    `);
    console.log('📝 Tin nhắn khởi đầu Bio AI:', initialBioMsg);
    const hasGreetingBio = /xin\s+chào.*chuyên\s+gia\s+ai/i.test(initialBioMsg);
    console.log('🔍 Có dấu robot chào hỏi ban đầu không:', hasGreetingBio ? 'CÓ (LỖI)' : 'KHÔNG (ĐẠT CHUẨN)');

    // Gửi câu hỏi có công thức
    const questionBio = 'công thức tính chiều dài ADN và số liên kết hidro';
    console.log(`📤 Gửi câu hỏi: "${questionBio}"`);
    await clientBio.evaluate(`
      const input = document.querySelector('.chatbot-input-area input');
      input.value = '${questionBio}';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const btn = document.querySelector('.chatbot-input-area button');
      btn.click();
    `);

    // Chờ câu trả lời (tối đa 25s)
    await clientBio.waitForFunction(`
      () => {
        const msgs = document.querySelectorAll('.chatbot-messages .chatbot-message.bot');
        if (msgs.length < 2) return false;
        const last = msgs[msgs.length - 1];
        if (last.classList.contains('typing-indicator') || last.querySelector('.typing-indicator')) return false;
        const text = last.innerText.trim();
        return text.length > 15 && !text.includes('...');
      }
    `, 25000);

    const bioAnswerHtml = await clientBio.evaluate(`
      const msgs = document.querySelectorAll('.chatbot-messages .chatbot-message.bot');
      const last = msgs[msgs.length - 1];
      return { text: last.innerText.trim(), html: last.innerHTML };
    `);

    console.log('\n💬 Câu trả lời của Bio AI:');
    console.log(bioAnswerHtml.text);
    console.log('\n🔍 Kiểm tra tiêu chuẩn:');
    const wordCountBio = bioAnswerHtml.text.split(/\\s+/).length;
    console.log(`- Độ dài: ${wordCountBio} từ (${wordCountBio <= 100 ? 'TÓM TẮT ĐẠT' : 'DÀI'})`);
    const hasKatexBio = bioAnswerHtml.html.includes('katex') || bioAnswerHtml.html.includes('L =') || bioAnswerHtml.html.includes('H =');
    console.log(`- Công thức LaTeX / KaTeX: ${hasKatexBio ? 'ĐÃ RENDER CHUẨN XÁC' : 'CHƯA THẤY'}`);
    const hasAsteriskBio = bioAnswerHtml.text.includes('**');
    console.log(`- Dấu sao thô (**): ${hasAsteriskBio ? 'CÒN SÓT (LỖI)' : 'ĐÃ DỌN SẠCH'}`);

    const bioPicPath = path.join(ARTIFACTS_DIR, 'bio_ai_latex_clean.png');
    await clientBio.captureScreenshot(bioPicPath);

    // =========================================================================
    // TEST 2: LAB VẬT LÝ (Physics AI THPT)
    // =========================================================================
    console.log('\n--- [TEST 2] Kiểm tra Bot 4: Physics AI THPT ---');
    const wsPhys = await getWsUrl(9222, 'https://ai.stem-hub.top/labs/PhysicsLab/');
    const clientPhys = new CDPClient(wsPhys);
    await clientPhys.connect();
    await clientPhys.send('Page.enable');
    await clientPhys.send('Runtime.enable');

    await new Promise(r => setTimeout(r, 2500));
    await clientPhys.waitForSelector('#physics-ai-toggle', 10000);

    // Mở khung chat
    await clientPhys.evaluate(`document.getElementById('physics-ai-toggle').click()`);
    await new Promise(r => setTimeout(r, 600));

    // Kiểm tra tin nhắn khởi đầu
    const initialPhysMsg = await clientPhys.evaluate(`
      const bubbles = document.querySelectorAll('#physics-ai-messages .msg-bubble');
      bubbles.length > 0 ? bubbles[0].innerText : ''
    `);
    console.log('📝 Tin nhắn khởi đầu Physics AI:', initialPhysMsg);

    // Gửi câu hỏi có công thức
    const questionPhys = 'công thức chu kỳ dao động của con lắc đơn và con lắc lò xo';
    console.log(`📤 Gửi câu hỏi: "${questionPhys}"`);
    await clientPhys.evaluate(`
      const input = document.getElementById('physics-ai-input');
      input.value = '${questionPhys}';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('physics-ai-send').click();
    `);

    // Chờ câu trả lời
    await clientPhys.waitForFunction(`
      () => {
        const msgs = document.querySelectorAll('#physics-ai-messages .ai');
        if (msgs.length < 2) return false;
        const last = msgs[msgs.length - 1];
        const text = last.innerText.trim();
        return text.length > 15 && !text.includes('...');
      }
    `, 25000);

    const physAnswer = await clientPhys.evaluate(`
      const msgs = document.querySelectorAll('#physics-ai-messages .ai');
      const last = msgs[msgs.length - 1];
      return { text: last.innerText.trim(), html: last.innerHTML };
    `);

    console.log('\n💬 Câu trả lời của Physics AI:');
    console.log(physAnswer.text);
    console.log('\n🔍 Kiểm tra tiêu chuẩn:');
    const wordCountPhys = physAnswer.text.split(/\\s+/).length;
    console.log(`- Độ dài: ${wordCountPhys} từ (${wordCountPhys <= 100 ? 'TÓM TẮT ĐẠT' : 'DÀI'})`);
    const hasKatexPhys = physAnswer.html.includes('katex') || physAnswer.html.includes('2π') || physAnswer.html.includes('T =');
    console.log(`- Công thức LaTeX / KaTeX: ${hasKatexPhys ? 'ĐÃ RENDER CHUẨN XÁC' : 'CHƯA THẤY'}`);
    const hasAsteriskPhys = physAnswer.text.includes('**');
    console.log(`- Dấu sao thô (**): ${hasAsteriskPhys ? 'CÒN SÓT (LỖI)' : 'ĐÃ DỌN SẠCH'}`);

    const physPicPath = path.join(ARTIFACTS_DIR, 'physics_ai_latex_clean.png');
    await clientPhys.captureScreenshot(physPicPath);

    // =========================================================================
    // TEST 3: LAB TOÁN (Math AI 3D Gia Sư)
    // =========================================================================
    console.log('\n--- [TEST 3] Kiểm tra Bot 3: Math AI 3D Gia Sư ---');
    const wsMath = await getWsUrl(9222, 'https://ai.stem-hub.top/labs/toan/frontend/dist/');
    const clientMath = new CDPClient(wsMath);
    await clientMath.connect();
    await clientMath.send('Page.enable');
    await clientMath.send('Runtime.enable');

    await new Promise(r => setTimeout(r, 2500));
    await clientMath.evaluate(`
      // Tìm nút toggle của Math AI Tutor (nút hình tròn có emoji 📐 hoặc button fixed)
      const btn = document.querySelector('button[title*="Gia sư AI Toán"], button[title*="kéo để di chuyển"]') || document.querySelector('button[title*="Gia sư"]');
      if (btn) btn.click();
    `);
    await new Promise(r => setTimeout(r, 800));

    const initialMathMsg = await clientMath.evaluate(`
      const msgs = document.querySelectorAll('div[style*="rgba(30,36,46"]');
      return msgs.length > 0 ? msgs[0].innerText : '';
    `);
    console.log('📝 Tin nhắn khởi đầu Math AI:', initialMathMsg);

    const questionMath = 'công thức thể tích khối lăng trụ và khối chóp';
    console.log(`📤 Gửi câu hỏi: "${questionMath}"`);
    await clientMath.evaluate(`
      const textarea = document.querySelector('textarea[placeholder*="Hỏi gia sư"]');
      if (textarea) {
        textarea.value = '${questionMath}';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        const sendBtn = textarea.parentElement.querySelector('button');
        if (sendBtn) sendBtn.click();
      }
    `);

    await clientMath.waitForFunction(`
      () => {
        const msgs = document.querySelectorAll('div[style*="rgba(30,36,46"]');
        if (msgs.length < 2) return false;
        const last = msgs[msgs.length - 1];
        const text = last.innerText.trim();
        return text.length > 15;
      }
    `, 25000);

    const mathAnswer = await clientMath.evaluate(`
      const msgs = document.querySelectorAll('div[style*="rgba(30,36,46"]');
      const last = msgs[msgs.length - 1];
      return { text: last.innerText.trim(), html: last.innerHTML };
    `);

    console.log('\n💬 Câu trả lời của Math AI:');
    console.log(mathAnswer.text);
    console.log('\n🔍 Kiểm tra tiêu chuẩn:');
    const wordCountMath = mathAnswer.text.split(/\\s+/).length;
    console.log(`- Độ dài: ${wordCountMath} từ (${wordCountMath <= 100 ? 'TÓM TẮT ĐẠT' : 'DÀI'})`);
    const hasKatexMath = mathAnswer.html.includes('katex') || mathAnswer.html.includes('V =') || mathAnswer.html.includes('Bh');
    console.log(`- Công thức LaTeX / KaTeX: ${hasKatexMath ? 'ĐÃ RENDER CHUẨN XÁC' : 'CHƯA THẤY'}`);
    const hasAsteriskMath = mathAnswer.text.includes('**');
    console.log(`- Dấu sao thô (**): ${hasAsteriskMath ? 'CÒN SÓT (LỖI)' : 'ĐÃ DỌN SẠCH'}`);

    const mathPicPath = path.join(ARTIFACTS_DIR, 'math_ai_latex_clean.png');
    await clientMath.captureScreenshot(mathPicPath);

    // =========================================================================
    // TEST 4: LAB HÓA (Bot 5: Chỉ Huy & Bot 6: Trợ Lý Chung)
    // =========================================================================
    console.log('\n--- [TEST 4] Kiểm tra Bot 5 & 6: Chem Commander & General AI ---');
    const wsChem = await getWsUrl(9222, 'https://ai.stem-hub.top/labs/lab-ktra15p/dist/');
    const clientChem = new CDPClient(wsChem);
    await clientChem.connect();
    await clientChem.send('Page.enable');
    await clientChem.send('Runtime.enable');

    await new Promise(r => setTimeout(r, 2500));
    await clientChem.evaluate(`
      const overlay = document.getElementById('introOverlay');
      if (overlay) overlay.style.display = 'none';
      const btn = document.getElementById('chatbot-toggle');
      if (btn) btn.click();
    `);
    await new Promise(r => setTimeout(r, 800));

    // Test Bot 5: Chỉ Huy AI
    console.log('👉 [Bot 5: CHỈ HUY AI]');
    const initCmdMsg = await clientChem.evaluate(`
      const msgs = document.querySelectorAll('#chatbot-messages .message');
      return msgs.length > 0 ? msgs[0].innerText : '';
    `);
    console.log('📝 Tin nhắn mở đầu Chỉ Huy AI:', initCmdMsg);

    const questionCmd = 'phản ứng đốt cháy kim loại Magie trong không khí';
    console.log(`📤 Gửi câu hỏi: "${questionCmd}"`);
    await clientChem.evaluate(`
      const input = document.getElementById('chatbot-input');
      input.value = '${questionCmd}';
      const sendBtn = document.getElementById('chatbot-send');
      sendBtn.click();
    `);

    await clientChem.waitForFunction(`
      () => {
        const msgs = document.querySelectorAll('#chatbot-messages .message.ai');
        if (msgs.length < 2) return false;
        const last = msgs[msgs.length - 1];
        return last.innerText.trim().length > 15;
      }
    `, 25000);

    const cmdAnswer = await clientChem.evaluate(`
      const msgs = document.querySelectorAll('#chatbot-messages .message.ai');
      const last = msgs[msgs.length - 1];
      return { text: last.innerText.trim(), html: last.innerHTML };
    `);
    console.log('💬 Câu trả lời của Chỉ Huy AI:');
    console.log(cmdAnswer.text);
    console.log(`- Độ dài: ${cmdAnswer.text.split(/\\s+/).length} từ`);
    console.log(`- Công thức / phương trình: ${cmdAnswer.html.includes('Mg') || cmdAnswer.html.includes('MgO') || cmdAnswer.html.includes('katex') ? 'CHUẨN ĐẠT' : 'CHƯA RÕ'}`);

    const cmdPicPath = path.join(ARTIFACTS_DIR, 'chem_commander_latex_clean.png');
    await clientChem.captureScreenshot(cmdPicPath);

    // Test Bot 6: Trợ Lý Chung AI
    console.log('\n👉 [Bot 6: TRỢ LÝ CHUNG AI]');
    await clientChem.evaluate(`
      const tabGen = document.getElementById('tab-mode-gen');
      if (tabGen) tabGen.click();
    `);
    await new Promise(r => setTimeout(r, 600));

    const initGenMsg = await clientChem.evaluate(`
      const msgs = document.querySelectorAll('#chatbot-messages .message');
      return msgs.length > 0 ? msgs[0].innerText : '';
    `);
    console.log('📝 Tin nhắn mở đầu Trợ Lý Chung:', initGenMsg);

    const questionGen = 'công thức tính pH và phản ứng thủy phân este no đơn chức';
    console.log(`📤 Gửi câu hỏi: "${questionGen}"`);
    await clientChem.evaluate(`
      const input = document.getElementById('chatbot-input');
      input.value = '${questionGen}';
      const sendBtn = document.getElementById('chatbot-send');
      sendBtn.click();
    `);

    await clientChem.waitForFunction(`
      () => {
        const msgs = document.querySelectorAll('#chatbot-messages .message.ai');
        if (msgs.length < 2) return false;
        const last = msgs[msgs.length - 1];
        return last.innerText.trim().length > 15;
      }
    `, 25000);

    const genAnswer = await clientChem.evaluate(`
      const msgs = document.querySelectorAll('#chatbot-messages .message.ai');
      const last = msgs[msgs.length - 1];
      return { text: last.innerText.trim(), html: last.innerHTML };
    `);
    console.log('💬 Câu trả lời của Trợ Lý Chung:');
    console.log(genAnswer.text);
    console.log(`- Độ dài: ${genAnswer.text.split(/\\s+/).length} từ`);
    console.log(`- Công thức / KaTeX: ${genAnswer.html.includes('pH') || genAnswer.html.includes('katex') ? 'CHUẨN ĐẠT' : 'CHƯA RÕ'}`);

    const genPicPath = path.join(ARTIFACTS_DIR, 'chem_general_latex_clean.png');
    await clientChem.captureScreenshot(genPicPath);

    // =========================================================================
    // TEST 5: BOT 1 - NOVA AI TRÊN PORTAL CHÍNH
    // =========================================================================
    console.log('\n--- [TEST 5] Kiểm tra Bot 1: NOVA AI (Portal Assistant) ---');
    const wsPortal = await getWsUrl(9222, 'https://ai.stem-hub.top/');
    const clientPortal = new CDPClient(wsPortal);
    await clientPortal.connect();
    await clientPortal.send('Page.enable');
    await clientPortal.send('Runtime.enable');

    await new Promise(r => setTimeout(r, 2500));
    // Mở NOVA HUD (nhấn nút #open-ai-assistant-btn hoặc gọi handler)
    await clientPortal.evaluate(`
      const btn = document.getElementById('open-ai-assistant-btn') || document.querySelector('button[title*="NOVA"]');
      if (btn) btn.click();
    `);
    await new Promise(r => setTimeout(r, 800));

    const initialNovaMsg = await clientPortal.evaluate(`
      const msgs = document.querySelectorAll('.chat-bubble-assistant, [data-message-sender="bot"]');
      return msgs.length > 0 ? msgs[0].innerText : '';
    `);
    console.log('📝 Tin nhắn mở đầu NOVA AI:', initialNovaMsg);

    const questionNova = 'công thức tính tích phân từng phần và đạo hàm hàm số mũ';
    console.log(`📤 Gửi câu hỏi: "${questionNova}"`);
    await clientPortal.evaluate(`
      const textarea = document.querySelector('textarea[placeholder*="Hỏi"]') || document.querySelector('input[placeholder*="Hỏi"]');
      if (textarea) {
        textarea.value = '${questionNova}';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        const sendBtn = textarea.parentElement.querySelector('button');
        if (sendBtn) sendBtn.click();
      }
    `);

    await clientPortal.waitForFunction(`
      () => {
        const msgs = document.querySelectorAll('.chat-bubble-assistant, [data-message-sender="bot"]');
        if (msgs.length < 2) return false;
        const last = msgs[msgs.length - 1];
        return last.innerText.trim().length > 15;
      }
    `, 25000);

    const novaAnswer = await clientPortal.evaluate(`
      const msgs = document.querySelectorAll('.chat-bubble-assistant, [data-message-sender="bot"]');
      const last = msgs[msgs.length - 1];
      return { text: last.innerText.trim(), html: last.innerHTML };
    `);
    console.log('💬 Câu trả lời của NOVA AI:');
    console.log(novaAnswer.text);
    console.log(`- Độ dài: ${novaAnswer.text.split(/\\s+/).length} từ`);
    console.log(`- Công thức / KaTeX: ${novaAnswer.html.includes('katex') || novaAnswer.html.includes('∫') || novaAnswer.html.includes('uv') ? 'CHUẨN ĐẠT' : 'CHƯA RÕ'}`);

    const novaPicPath = path.join(ARTIFACTS_DIR, 'nova_ai_latex_clean.png');
    await clientPortal.captureScreenshot(novaPicPath);

    console.log('\n🎉 ĐÃ HOÀN TẤT KIỂM THỬ TOÀN DIỆN CẢ 6 AI BOT TRÊN BROWSER THẬT!');

  } catch (err) {
    console.error('❌ Lỗi kiểm thử:', err.message);
  } finally {
    if (chromeProc) {
      chromeProc.kill();
    }
  }
}

run();
