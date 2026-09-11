const fs = require('fs');
const http = require('http');

function getWsUrl(port = 9222) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/json/list`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          const page = list.find(t => t.type === 'page' && t.url.includes('lab-ktra15p'));
          if (page && page.webSocketDebuggerUrl) {
            resolve(page.webSocketDebuggerUrl);
          } else {
            reject(new Error('No chem lab page target found'));
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

  const res = await send('Runtime.evaluate', {
    expression: `
      JSON.stringify({
        hasStemBridge: typeof window.StemLabAIBridge !== 'undefined',
        hasKatex: typeof window.katex !== 'undefined',
        messages: Array.from(document.querySelectorAll('#chatbot-messages .message')).map(m => ({
          className: m.className,
          innerText: m.innerText,
          innerHTML: m.innerHTML
        }))
      })
    `,
    returnByValue: true
  });

  console.log('CHEM LAB INSPECTION:', JSON.stringify(JSON.parse(res.result.value), null, 2));
  process.exit(0);
}

main().catch(console.error);
