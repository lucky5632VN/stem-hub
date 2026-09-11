const fs = require('fs');
const path = require('path');

const filePath = path.resolve('public/labs/PhysicsLab/js/physics-ai-chatbot.js');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Remove auto-scroll in renderMessages
content = content.replace('container.scrollTop = container.scrollHeight;', '// container.scrollTop = container.scrollHeight; // Auto-scroll disabled');

// 2. Add streamAIReply function right before handleSend
const streamFunction = `
  async function streamAIReply(aiReply) {
    isLoading = false;
    const msgObj = { role: 'ai', content: '' };
    messages.push(msgObj);
    renderMessages();

    const container = document.getElementById('pai-msg-container');
    const msgDivs = container ? container.querySelectorAll('.pai-msg.ai') : [];
    const targetDiv = msgDivs.length > 0 ? msgDivs[msgDivs.length - 1] : null;

    const words = aiReply.split(' ');
    let current = '';
    const delay = Math.max(10, Math.min(25, Math.floor(1600 / Math.max(1, words.length))));

    for (let i = 0; i < words.length; i++) {
      current += (i === 0 ? '' : ' ') + words[i];
      msgObj.content = current;
      if (targetDiv) {
        targetDiv.innerHTML = parseSimpleMarkdown(current);
      }
      await new Promise(res => setTimeout(res, delay));
    }

    msgObj.content = aiReply;
    if (targetDiv) {
      targetDiv.innerHTML = parseSimpleMarkdown(aiReply);
    }
    saveSessions();

    if (window.MathJax && window.MathJax.typesetPromise && targetDiv) {
      try {
        window.MathJax.typesetPromise([targetDiv]).catch(function(e) {});
      } catch (e) {}
    }
  }
`;

if (!content.includes('async function streamAIReply')) {
  content = content.replace('async function handleSend() {', streamFunction + '\n  async function handleSend() {');
}

// 3. Replace direct message pushes in handleSend with streamAIReply
// A. Guard refusal
content = content.replace(
  `          const refusal = guard.refusal;
          messages.push({ role: 'ai', content: refusal });
          isLoading = false;
          saveSessions();
          renderMessages();`,
  `          const refusal = guard.refusal;
          await streamAIReply(refusal);`
);

// B. Cache hit
content = content.replace(
  `          const aiReply = cacheResult.answer;
          messages.push({ role: 'ai', content: aiReply });
          isLoading = false;
          saveSessions();
          renderMessages();`,
  `          const aiReply = cacheResult.answer;
          await streamAIReply(aiReply);`
);

// C. Gemini response / error at end of handleSend
content = content.replace(
  `    messages.push({ role: 'ai', content: aiReply });
    isLoading = false;
    saveSessions();
    renderMessages();`,
  `    await streamAIReply(aiReply);`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Successfully patched PhysicsLab with typewriter streaming and no auto-scroll');
