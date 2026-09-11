/**
 * Lấy full API Keys từ Google Cloud API Keys API
 * Dùng OAuth2 Device Flow - không cần browser automation
 */

const https = require('https');
const readline = require('readline');

const PROJECT_ID = 'credentials-458510'; // Từ AI Studio project name

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
  });
}

function httpsPost(url, postData, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function getKeysViaDeviceFlow() {
  // Google OAuth2 Device Flow
  // Client ID của Google Cloud SDK (public, không cần secret cho device flow)
  const CLIENT_ID = '32555940559.apps.googleusercontent.com';
  const SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

  console.log('🔑 Đang lấy device code từ Google...');
  
  const deviceRes = await httpsPost(
    'https://oauth2.googleapis.com/device/code',
    `client_id=${CLIENT_ID}&scope=${encodeURIComponent(SCOPE)}`
  );

  if (!deviceRes.body.device_code) {
    console.error('❌ Không lấy được device code:', deviceRes.body);
    return;
  }

  const { device_code, user_code, verification_url, interval, expires_in } = deviceRes.body;

  console.log('\n' + '='.repeat(60));
  console.log('📱 ĐĂNG NHẬP GOOGLE (Device Flow)');
  console.log('='.repeat(60));
  console.log(`\n1. Mở trình duyệt vào: ${verification_url}`);
  console.log(`2. Nhập code: \x1b[33m${user_code}\x1b[0m`);
  console.log(`3. Đăng nhập bằng tài khoản Google có quyền truy cập project credentials-458510`);
  console.log(`\n⏳ Đang chờ xác nhận... (${expires_in}s)\n`);

  // Poll cho đến khi user xác nhận
  let token = null;
  const startTime = Date.now();
  
  while (Date.now() - startTime < expires_in * 1000) {
    await new Promise(r => setTimeout(r, interval * 1000));
    
    const tokenRes = await httpsPost(
      'https://oauth2.googleapis.com/token',
      `client_id=${CLIENT_ID}&device_code=${device_code}&grant_type=urn:ietf:params:oauth:grant-type:device_code`
    );

    if (tokenRes.body.access_token) {
      token = tokenRes.body.access_token;
      console.log('✅ Đăng nhập thành công!');
      break;
    } else if (tokenRes.body.error === 'authorization_pending') {
      process.stdout.write('.');
    } else if (tokenRes.body.error === 'slow_down') {
      await new Promise(r => setTimeout(r, 5000));
    } else {
      console.log('\n❌ Lỗi:', tokenRes.body.error);
      return;
    }
  }

  if (!token) {
    console.log('\n❌ Hết thời gian chờ');
    return;
  }

  // Gọi API Keys API
  console.log('\n🔍 Đang lấy danh sách API Keys...');
  const keysUrl = `https://apikeys.googleapis.com/v2/projects/${PROJECT_ID}/locations/global/keys`;
  
  const keysRes = await httpsGet(keysUrl, { Authorization: `Bearer ${token}` });
  
  if (keysRes.status !== 200) {
    console.log('❌ Lỗi lấy keys:', keysRes.status, JSON.stringify(keysRes.body, null, 2));
    
    // Thử với project number
    console.log('\n🔄 Thử với project number...');
    const projectRes = await httpsGet(
      `https://cloudresourcemanager.googleapis.com/v1/projects?filter=name:credentials`,
      { Authorization: `Bearer ${token}` }
    );
    console.log('Projects:', JSON.stringify(projectRes.body, null, 2));
    return;
  }

  const keys = keysRes.body.keys || [];
  console.log(`\n🎯 Tìm thấy ${keys.length} API Keys:\n`);

  const geminiKeys = [];
  
  for (const key of keys) {
    // Lấy full key string
    const keyName = key.name; // projects/.../locations/global/keys/xxx
    const getKeyRes = await httpsGet(
      `https://apikeys.googleapis.com/v2/${keyName}/keyString`,
      { Authorization: `Bearer ${token}` }
    );
    
    const fullKey = getKeyRes.body.keyString || '';
    const displayName = key.displayName || key.name.split('/').pop();
    
    console.log(`✅ ${displayName}: ${fullKey}`);
    
    if (fullKey.startsWith('AIzaSy')) {
      geminiKeys.push(fullKey);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`🎯 TỔNG KẾT: ${geminiKeys.length} Gemini Keys`);
  console.log('='.repeat(60));
  
  const combined = geminiKeys.join(',');
  console.log('\nCombined string:');
  console.log(combined);

  // Lưu file
  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(
    path.join(__dirname, 'recovered_keys.txt'),
    combined
  );
  console.log('\n📁 Đã lưu vào scripts/recovered_keys.txt');

  // Nạp lên Cloudflare
  if (geminiKeys.length > 0) {
    const { execSync } = require('child_process');
    const workerDir = path.join(__dirname, '..', 'cloudflare-worker');
    console.log('\n⚡ Đang nạp lên Cloudflare...');
    try {
      execSync(
        `echo "${combined}" | npx wrangler secret put GEMINI_API_KEY`,
        { cwd: workerDir, stdio: 'inherit' }
      );
      console.log('✅ Đã nạp lên Cloudflare thành công!');
    } catch (e) {
      console.log('Lệnh thủ công:');
      console.log(`cd cloudflare-worker && echo "${combined}" | npx wrangler secret put GEMINI_API_KEY`);
    }
  }
}

getKeysViaDeviceFlow().catch(console.error);
