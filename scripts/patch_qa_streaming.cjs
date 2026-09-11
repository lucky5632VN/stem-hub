const fs = require('fs');
const path = require('path');

const qaFiles = [
  path.resolve('public/labs/lab-ktra15p/public/qa_system.js'),
  path.resolve('public/labs/lab-ktra15p/dist/qa_system.js')
];

const streamPanelCode = `
window.streamPanelAIMessage = async function(text) {
  const bot = window.qaSelectedBot === 'lab' ? window.labBot : window.generalBot;
  if (!bot) return;

  const msgsDiv = document.getElementById('panel-ai-messages');
  if (!msgsDiv) {
    bot.addMessage('ai', text);
    return;
  }

  const isLab = (window.qaSelectedBot !== 'gen');
  const botLabel = isLab ? '⚡ Lab Commander' : '🌐 Quantum AI';
  const botColor = isLab ? '#4ade80' : '#38bdf8';

  const mDiv = document.createElement('div');
  mDiv.style.margin = '8px 0';
  mDiv.style.padding = '10px 14px';
  mDiv.style.borderRadius = '12px';
  mDiv.style.fontSize = '12px';
  mDiv.style.lineHeight = '1.6';
  mDiv.style.maxWidth = '85%';
  mDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  mDiv.style.wordBreak = 'break-word';
  mDiv.style.background = 'rgba(15,23,42,0.85)';
  mDiv.style.border = \`1px solid \${botColor}33\`;
  mDiv.style.color = '#cbd5e1';
  mDiv.style.alignSelf = 'flex-start';
  mDiv.style.borderBottomLeftRadius = '2px';

  msgsDiv.appendChild(mDiv);

  const words = text.split(' ');
  let cur = '';
  const delay = Math.max(10, Math.min(25, Math.floor(1600 / Math.max(1, words.length))));

  for (let i = 0; i < words.length; i++) {
    cur += (i === 0 ? '' : ' ') + words[i];
    let formatted = cur
      .replace(/\\*\\*([^*]+)\\*\\*/g, \`<b style="color:\${botColor}">$1</b>\`)
      .replace(/\\*([^*\\n]+)\\*/g, '<em style="color:#94a3b8">$1</em>')
      .replace(/\`([^\`]+)\`/g, '<code style="background:rgba(0,0,0,0.4);padding:1px 5px;border-radius:3px;font-size:11px;color:#00ffcc">$1</code>')
      .replace(/\\$([^$]+)\\$/g, '<b style="color:#00ffcc">$1</b>')
      .replace(/\\n/g, '<br>')
      .replace(/^[-•] (.*)$/gm, '&bull; $1');
    mDiv.innerHTML = \`<div style="font-size:10px;color:\${botColor};font-weight:bold;font-family:'Orbitron',sans-serif;margin-bottom:5px;opacity:0.9;">\${botLabel}</div>\${formatted}\`;
    await new Promise(res => setTimeout(res, delay));
  }

  // Update history in bot instance
  if (bot.history) {
    bot.history.push({ role: 'ai', text: text });
  } else if (bot.labHistory) {
    isLab ? bot.labHistory.push({ role: 'ai', text: text }) : bot.genHistory.push({ role: 'ai', text: text });
  }
};
`;

qaFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    if (!content.includes('window.streamPanelAIMessage =')) {
      content = content.replace('window.sendQAInPanelChat = async function() {', streamPanelCode + '\nwindow.sendQAInPanelChat = async function() {');
    }

    content = content.replace("bot.addMessage('ai', cached.answer);", "if (typingInd) typingInd.style.display = 'none'; await window.streamPanelAIMessage(cached.answer);");
    content = content.replace("bot.addMessage('ai', response);", "if (typingInd) typingInd.style.display = 'none'; await window.streamPanelAIMessage(response);");
    content = content.replace("bot.addMessage('ai', 'Lỗi: Không thể kết nối mạng Quantum.');", "if (typingInd) typingInd.style.display = 'none'; await window.streamPanelAIMessage('Lỗi: Không thể kết nối mạng Quantum.');");

    fs.writeFileSync(file, content, 'utf-8');
    console.log('✅ Patched qa_system streaming in', file);
  }
});
