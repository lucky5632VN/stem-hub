const fs = require('fs');
const path = require('path');

const files = [
  path.resolve('public/labs/lab-ktra15p/gemini_ai.js'),
  path.resolve('public/labs/lab-ktra15p/public/gemini_ai.js'),
  path.resolve('public/labs/lab-ktra15p/dist/gemini_ai.js')
];

const streamCode = `
  formatChemText(text) {
    if (!text) return '';
    let i = text;
    i = i.replace(/\\\\xrightarrow\\{[^}]*\\}/g, ' → ')
         .replace(/\\\\xrightarrow/g, ' → ')
         .replace(/\\\\rightarrow/g, ' → ')
         .replace(/\\\\rightleftharpoons/g, ' ⇌ ')
         .replace(/\\\\text\\{([^}]+)\\}/g, '$1')
         .replace(/\\\\mathrm\\{([^}]+)\\}/g, '$1')
         .replace(/\\\\mathbf\\{([^}]+)\\}/g, '$1')
         .replace(/-->/g, ' → ')
         .replace(/->/g, ' → ')
         .replace(/<=>/g, ' ⇌ ');

    const subscriptMap = {
      '₀':'0', '₁':'1', '₂':'2', '₃':'3', '₄':'4',
      '₅':'5', '₆':'6', '₇':'7', '₈':'8', '₉':'9'
    };
    i = i.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, match => \`<sub>\${subscriptMap[match]}</sub>\`);
    i = i.replace(/\\$([^\\$]+)\\$/g, (match, p1) => {
      let clean = p1
        .replace(/([A-Za-z\\)])_?\\{?(\\d+)\\}?/g, '$1<sub>$2</sub>')
        .replace(/\\^\\{?([^\\}]+)\\}?/g, '<sup>$1</sup>')
        .replace(/([A-Za-z0-9])\\^\\{?(\\d*[+-])\\}?/g, '$1<sup>$2</sup>');
      return \`<b style="color:#00ffcc">\${clean}</b>\`;
    });
    i = i.replace(/([A-Z][a-z]?|\\))(\\d+)/g, '$1<sub>$2</sub>');
    i = i.replace(/([A-Za-z0-9])\\^\\{?([1-9]?[+-])\\}?/g, '$1<sup>$2</sup>');
    i = i.replace(/^[-*]{3,}\\s*$/gm, '<hr style="border: 0; border-top: 1px dashed rgba(255,255,255,0.2); margin: 15px 0;">')
         .replace(/^#+\\s*(.*)$/gm, '<b style="color:#38bdf8">$1</b>')
         .replace(/\\*\\*(.*?)\\*\\*/g, '<b>$1</b>')
         .replace(/\\*(.*?)\\*/g, '<i>$1</i>')
         .replace(/^[\\*\\-]\\s*(.*)$/gm, '• $1')
         .replace(/^([🎯💡🌍⚠️].*):/gm, '<div style="color:#38bdf8; font-weight:bold; margin-top:10px; font-family:Orbitron, sans-serif;">$1</div>')
         .replace(/\\n/g, '<br>');
    return i;
  }

  async streamMessage(role, text) {
    if (role !== 'ai') {
      this.addMessage(role, text);
      return;
    }
    this.showTyping(false);
    const chatMsgs = document.getElementById('chatbot-messages');
    if (!chatMsgs) return;

    if (this.activeBot === 'lab') {
      this.labHistory.push({ role: 'ai', text: text });
    } else {
      this.genHistory.push({ role: 'ai', text: text });
    }
    this.saveSessions(this.activeBot);

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ai';
    chatMsgs.appendChild(msgDiv);

    const words = text.split(' ');
    let cur = '';
    const delay = Math.max(10, Math.min(25, Math.floor(1600 / Math.max(1, words.length))));

    for (let i = 0; i < words.length; i++) {
      cur += (i === 0 ? '' : ' ') + words[i];
      msgDiv.innerHTML = this.formatChemText(cur);
      await new Promise(res => setTimeout(res, delay));
    }
    msgDiv.innerHTML = this.formatChemText(text);
  }
`;

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    // Remove auto-scroll
    content = content.replace(/chatMsgs\.scrollTop = chatMsgs\.scrollHeight;/g, '// chatMsgs.scrollTop = chatMsgs.scrollHeight; // Auto-scroll disabled');

    // Add streamMessage & formatChemText
    if (!content.includes('async streamMessage')) {
      content = content.replace('showTyping(show) {', streamCode + '\n  showTyping(show) {');
    }

    // In handleUserInput, replace this.addMessage('ai', ...) with await this.streamMessage('ai', ...)
    content = content.replace("this.addMessage('ai', guard.refusal);", "await this.streamMessage('ai', guard.refusal);");
    content = content.replace("this.addMessage('ai', cacheRes.answer);", "await this.streamMessage('ai', cacheRes.answer);");
    content = content.replace("this.addMessage('ai', response);", "await this.streamMessage('ai', response);");
    content = content.replace("this.addMessage('ai', `💡 [Trợ lý Ngoại tuyến QuantumLab]:", "await this.streamMessage('ai', `💡 [Trợ lý Ngoại tuyến QuantumLab]:");
    content = content.replace("this.addMessage('ai', 'Xin lỗi,", "await this.streamMessage('ai', 'Xin lỗi,");

    fs.writeFileSync(file, content, 'utf-8');
    console.log('✅ Patched', file);
  }
});

// Also patch dist/assets/index-DbqG5P_q.js
const bundlePath = path.resolve('public/labs/lab-ktra15p/dist/assets/index-DbqG5P_q.js');
if (fs.existsSync(bundlePath)) {
  let bundle = fs.readFileSync(bundlePath, 'utf-8');
  // Remove auto-scroll in bundle
  bundle = bundle.replace(/t\.scrollTop=t\.scrollHeight;/g, '');
  bundle = bundle.replace(/n\.scrollTop=n\.scrollHeight/g, '');

  // Add streaming helper in bundle
  const bundleStreamHelper = `async streamMsg(role,text){if(role!=="ai"){this.addMessage(role,text);return;}this.showTyping(!1);let n=document.getElementById("chatbot-messages");if(!n)return;let r=document.createElement("div");r.className="message ai";n.appendChild(r);let words=text.split(" "),cur="";let delay=Math.max(10,Math.min(25,Math.floor(1600/Math.max(1,words.length))));for(let i=0;i<words.length;i++){cur+=(i===0?"":" ")+words[i];r.innerHTML=cur.replace(/\\n/g,"<br>");await new Promise(res=>setTimeout(res,delay));}r.innerHTML=text.replace(/\\n/g,"<br>");this.activeBot==="lab"?this.labHistory.push({role:"ai",text:text}):this.genHistory.push({role:"ai",text:text});this.saveSessions(this.activeBot);}`;

  if (!bundle.includes('async streamMsg(')) {
    bundle = bundle.replace('showTyping(e){', bundleStreamHelper + 'showTyping(e){');
  }

  bundle = bundle.replace('this.addMessage(`ai`,e.refusal)', 'await this.streamMsg(`ai`,e.refusal)');
  bundle = bundle.replace('this.addMessage(`ai`,r)', 'await this.streamMsg(`ai`,e.answer)');
  bundle = bundle.replace('this.addMessage(`ai`,e)', 'await this.streamMsg(`ai`,e)');

  fs.writeFileSync(bundlePath, bundle, 'utf-8');
  console.log('✅ Patched Lab Hóa dist bundle index-DbqG5P_q.js');
}

// Also remove auto-scroll in qa_system.js
const qaPath = path.resolve('public/labs/lab-ktra15p/public/qa_system.js');
if (fs.existsSync(qaPath)) {
  let qa = fs.readFileSync(qaPath, 'utf-8');
  qa = qa.replace('requestAnimationFrame(() => { msgsDiv.scrollTop = msgsDiv.scrollHeight; });', '// Auto-scroll disabled');
  fs.writeFileSync(qaPath, qa, 'utf-8');
  console.log('✅ Patched qa_system.js');
}
