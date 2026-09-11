const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id && this.callbacks.has(data.id)) {
          const cb = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) cb.reject(new Error(data.error.message));
          else cb.resolve(data.result);
        }
      };
    });
  }

  send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (res && res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || 'Evaluation error');
    }
    return res && res.result ? res.result.value : null;
  }

  async captureScreenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    if (res && res.data) {
      fs.writeFileSync(outputPath, Buffer.from(res.data, 'base64'));
      console.log(`📸 Screenshot saved: ${outputPath}`);
      return outputPath;
    }
    throw new Error('Screenshot failed');
  }

  async waitForSelector(selector, timeoutMs = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const exists = await this.evaluate(`!!document.querySelector('${selector}')`);
      if (exists) return true;
      await new Promise(r => setTimeout(r, 400));
    }
    throw new Error(`Timeout waiting for selector: ${selector}`);
  }

  async waitForFunction(fnStr, timeoutMs = 25000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const ok = await this.evaluate(`(${fnStr})()`);
      if (ok) return ok;
      await new Promise(r => setTimeout(r, 500));
    }
    throw new Error(`Timeout waiting for function: ${fnStr}`);
  }
}

async function getWsUrl(port, targetUrl) {
  return new Promise((resolve, reject) => {
    // Thử tạo tab mới bằng PUT, nếu không được thì lấy tab có sẵn từ /json/list
    const req = http.request({
      hostname: '127.0.0.1',
      port: port,
      path: `/json/new?${encodeURIComponent(targetUrl || 'about:blank')}`,
      method: 'PUT'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json && json.webSocketDebuggerUrl) {
            return resolve(json.webSocketDebuggerUrl);
          }
        } catch (_) {}
        // Fallback: lấy từ /json/list
        getExistingTabWsUrl(port).then(resolve).catch(reject);
      });
    });
    req.on('error', () => {
      getExistingTabWsUrl(port).then(resolve).catch(reject);
    });
    req.end();
  });
}

function getExistingTabWsUrl(port) {
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

async function startChrome(port = 9222) {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(process.cwd(), '.chrome_cdp_test_profile');
  
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1280,800',
    'about:blank'
  ], { stdio: 'ignore', detached: false });

  // Wait for Chrome port to be ready
  let ready = false;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      await new Promise((res, rej) => {
        const req = http.get(`http://127.0.0.1:${port}/json/version`, () => res(true));
        req.on('error', rej);
      });
      ready = true;
      break;
    } catch (_) {}
  }

  if (!ready) {
    throw new Error('Chrome failed to start or open remote debugging port');
  }

  return chromeProc;
}

module.exports = { startChrome, getWsUrl, CDPClient };
