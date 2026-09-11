/**
 * Lấy API Keys bằng cách gọi thẳng REST API của AI Studio
 * Dùng cookie từ Chrome profile đã đăng nhập
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Đọc cookies từ Chrome SQLite database
function getChromeCookies() {
  try {
    // Thử dùng PowerShell để đọc cookies từ Chrome
    const cookiePath = path.join(
      process.env.USERPROFILE || 'C:\\Users\\dell',
      'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Cookies'
    );
    
    if (!fs.existsSync(cookiePath)) {
      console.log('❌ Không tìm thấy Chrome Cookies file');
      return null;
    }
    
    // Copy cookies file (Chrome lock it)
    const tmpCookies = path.join(__dirname, '_tmp_cookies.db');
    fs.copyFileSync(cookiePath, tmpCookies);
    
    // Dùng sqlite3 để query
    const result = execSync(
      `sqlite3 "${tmpCookies}" "SELECT name, encrypted_value FROM cookies WHERE host_key LIKE '%google%' OR host_key LIKE '%googleapis%'"`,
      { encoding: 'buffer' }
    );
    
    fs.unlinkSync(tmpCookies);
    return result.toString();
  } catch (e) {
    console.log('⚠️ Không đọc được cookies:', e.message);
    return null;
  }
}

// Thử gọi API Keys API với wrangler token (đã login qua wrangler)
async function tryWithWranglerCredentials() {
  console.log('🔍 Thử lấy Cloudflare config để kiểm tra...');
  try {
    const result = execSync('npx wrangler secret list --name stem-hub-api-proxy 2>&1', {
      cwd: path.join(__dirname, '..', 'cloudflare-worker'),
      encoding: 'utf8'
    });
    console.log('Cloudflare secrets hiện tại:', result);
  } catch(e) {
    console.log(e.message);
  }
}

// Approach mới: Dùng Google API với service account từ .env.local
async function tryWithServiceAccount() {
  const envLocal = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envLocal)) {
    console.log('❌ Không tìm thấy .env.local');
    return;
  }

  const content = fs.readFileSync(envLocal, 'utf8');
  
  // Parse .env.local
  const projectId = content.match(/FIREBASE_PROJECT_ID="([^"]+)"/)?.[1];
  const clientEmail = content.match(/FIREBASE_CLIENT_EMAIL="([^"]+)"/)?.[1];
  const privateKeyRaw = content.match(/FIREBASE_PRIVATE_KEY="([\s\S]+?)"(\r?\n|$)/)?.[1];
  
  if (!projectId || !clientEmail || !privateKeyRaw) {
    console.log('❌ Thiếu Firebase credentials trong .env.local');
    return;
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
  
  console.log(`✅ Tìm thấy service account: ${clientEmail}`);
  console.log(`   Project: ${projectId}`);
  
  // Tạo JWT để lấy access token
  const { createSign } = require('crypto');
  
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  })).toString('base64url');

  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(privateKey, 'base64url');
  const jwt = `${header}.${payload}.${signature}`;

  // Lấy access token
  console.log('\n🔑 Đang lấy access token từ service account...');
  
  const tokenData = await new Promise((resolve, reject) => {
    const postBody = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`;
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postBody)
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(postBody);
    req.end();
  });

  if (!tokenData.access_token) {
    console.log('❌ Không lấy được token:', tokenData);
    return;
  }

  console.log('✅ Có access token!');
  
  // Thử gọi API Keys API với project stem-hub-43e96
  const projects = [projectId, 'credentials-458510'];
  
  for (const proj of projects) {
    console.log(`\n🔍 Thử project: ${proj}`);
    
    const result = await new Promise((resolve, reject) => {
      const req = https.get({
        hostname: 'apikeys.googleapis.com',
        path: `/v2/projects/${proj}/locations/global/keys`,
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
          catch { resolve({ status: res.statusCode, body: d }); }
        });
      });
      req.on('error', reject);
    });

    if (result.status === 200 && result.body.keys) {
      console.log(`✅ Tìm thấy ${result.body.keys.length} keys trong project ${proj}!`);
      
      const geminiKeys = [];
      
      for (const key of result.body.keys) {
        // Lấy key string
        const keyStringRes = await new Promise((resolve, reject) => {
          const req = https.get({
            hostname: 'apikeys.googleapis.com',
            path: `/v2/${key.name}/keyString`,
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
          }, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
              try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
              catch { resolve({ status: res.statusCode, body: d }); }
            });
          });
          req.on('error', reject);
        });
        
        const fullKey = keyStringRes.body?.keyString || '';
        const name = key.displayName || key.uid || '';
        console.log(`  ${name}: ${fullKey || '(không lấy được)'}`);
        
        if (fullKey.startsWith('AIza')) {
          geminiKeys.push(fullKey);
        }
      }
      
      if (geminiKeys.length > 0) {
        const combined = geminiKeys.join(',');
        fs.writeFileSync(path.join(__dirname, 'recovered_keys.txt'), combined);
        console.log(`\n📁 Đã lưu ${geminiKeys.length} keys vào scripts/recovered_keys.txt`);
        
        console.log('\n⚡ Đang nạp lên Cloudflare...');
        execSync(
          `echo "${combined}" | npx wrangler secret put GEMINI_API_KEY`,
          { cwd: path.join(__dirname, '..', 'cloudflare-worker'), stdio: 'inherit' }
        );
        console.log('✅ Hoàn tất!');
      }
      return;
    } else {
      console.log(`   ❌ ${result.status}:`, JSON.stringify(result.body).substring(0, 200));
    }
  }
}

tryWithServiceAccount().catch(console.error);
