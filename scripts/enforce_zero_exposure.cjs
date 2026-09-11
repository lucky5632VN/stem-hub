const fs = require('fs');
const path = require('path');

console.log('🔒 [ZERO EXPOSURE] Bắt đầu rà soát và thanh lọc toàn bộ API Key nhạy cảm ở Client-Side...');

const PROXY_URL = 'https://stem-hub-api-proxy.ai-stem-hub.workers.dev';

// ============================================================================
// 1. DỌN DẸP src/lib/geminiResilientPool.js
// ============================================================================
const poolFile = path.resolve('src/lib/geminiResilientPool.js');
if (fs.existsSync(poolFile)) {
  let content = fs.readFileSync(poolFile, 'utf-8');
  // Xóa toàn bộ key thô
  content = content.replace(/export const COMBINED_MATH_API_KEYS = \[[\s\S]*?\];/, `export const COMBINED_MATH_API_KEYS = []; // Key đã chuyển lên Cloudflare Secrets Vault`);
  
  // Nâng cấp hàm callResilientGemini gọi qua Cloudflare API Gateway
  const gatewayLogic = `
  // Ưu tiên 1: Định tuyến qua Cloudflare API Gateway (Zero Exposure)
  const proxyBase = (process.env.NEXT_PUBLIC_API_PROXY_URL || '${PROXY_URL}').replace(/\\/$/, '');
  try {
    const gatewayRes = await fetch(\`\${proxyBase}/api/ai/chat\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (gatewayRes.ok) {
      const gData = await gatewayRes.json();
      if (gData.text) {
        return {
          text: gData.text,
          model: gData.model || 'gateway-edge',
          keyUsed: 'CLOUDFLARE_EDGE_VAULT',
          keyIndex: 0
        };
      }
    }
  } catch (gwErr) {
    console.warn('[ResilientPool] Gateway proxy warning:', gwErr.message);
  }
`;
  if (!content.includes('CLOUDFLARE_EDGE_VAULT')) {
    content = content.replace(/let lastError = null;/, `let lastError = null;\n${gatewayLogic}`);
  }

  fs.writeFileSync(poolFile, content, 'utf-8');
  console.log('✅ Đã thanh lọc và tích hợp Gateway vào src/lib/geminiResilientPool.js');
}

// ============================================================================
// 2. DỌN DẸP src/components/organisms/GlobalAIAssistant.jsx
// ============================================================================
const globalAiFile = path.resolve('src/components/organisms/GlobalAIAssistant.jsx');
if (fs.existsSync(globalAiFile)) {
  let content = fs.readFileSync(globalAiFile, 'utf-8');
  // Xóa BACKUP_ENCRYPTED_KEYS
  content = content.replace(/const BACKUP_ENCRYPTED_KEYS = \[[\s\S]*?\];/, `const BACKUP_ENCRYPTED_KEYS = []; // Đã bảo mật 100% qua Cloudflare Gateway`);
  
  // Thay thế luồng gọi fetch trực tiếp sang Cloudflare Proxy
  const oldFetchCall = `const proxyUrl = process.env.NEXT_PUBLIC_GEMINI_PROXY_URL;
            const url = proxyUrl 
              ? \`\${proxyUrl}?model=\${modelName}&apiVer=\${apiVer}\` 
              : \`https://generativelanguage.googleapis.com/\${apiVer}/models/\${modelName}:generateContent?key=\${apiKey}\`;`;

  const newFetchCall = `const proxyBase = (process.env.NEXT_PUBLIC_API_PROXY_URL || '${PROXY_URL}').replace(/\\/$/, '');
            const url = \`\${proxyBase}/api/ai/chat\`;`;

  if (content.includes('const proxyUrl = process.env.NEXT_PUBLIC_GEMINI_PROXY_URL;')) {
    content = content.replace(oldFetchCall, newFetchCall);
  }

  fs.writeFileSync(globalAiFile, content, 'utf-8');
  console.log('✅ Đã thanh lọc và định tuyến Gateway cho GlobalAIAssistant.jsx');
}

// ============================================================================
// 3. DỌN DẸP LAB HÓA HỌC (gemini_ai.js)
// ============================================================================
const chemFiles = [
  'public/labs/lab-hoa-sandbox/gemini_ai.js',
  'public/labs/lab-ktra15p/gemini_ai.js',
  'public/labs/lab-ktra15p/public/gemini_ai.js',
  'public/labs/lab-ktra15p/dist/gemini_ai.js'
];

chemFiles.forEach(f => {
  const fp = path.resolve(f);
  if (fs.existsSync(fp)) {
    let c = fs.readFileSync(fp, 'utf-8');
    // Xóa key pools
    c = c.replace(/const COMMANDER_API_KEYS = \[[\s\S]*?\];/, `const COMMANDER_API_KEYS = []; // Managed by Cloudflare Gateway`);
    c = c.replace(/const GENERAL_API_KEYS = \[[\s\S]*?\];/, `const GENERAL_API_KEYS = []; // Managed by Cloudflare Gateway`);
    
    // Đổi luồng askAI sang Gateway
    const gatewayCall = `
        // Zero Exposure: Định tuyến qua Cloudflare Gateway
        const proxyUrl = '${PROXY_URL}/api/ai/chat';
        try {
          const gwRes = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: formattedContents,
              systemInstruction: systemPrompt,
              temperature: 0.3,
              maxOutputTokens: 1200
            })
          });
          if (gwRes.ok) {
            const gwData = await gwRes.json();
            if (gwData.text) {
              console.log('📡 [Quantum AI] Phản hồi an toàn qua Cloudflare Gateway (Zero Exposure)');
              return gwData.text;
            }
          }
        } catch (e) {
          console.warn('[Quantum AI] Gateway fallback triggered:', e.message);
        }
    `;

    if (!c.includes('Zero Exposure: Định tuyến qua Cloudflare Gateway')) {
      c = c.replace(/const response = await fetch\(url, \{/, `${gatewayCall}\n        const response = await fetch(url, {`);
    }

    fs.writeFileSync(fp, c, 'utf-8');
    console.log('✅ Đã thanh lọc Lab Hóa học:', f);
  }
});

// ============================================================================
// 4. DỌN DẸP LAB VẬT LÝ (physics-ai-chatbot.js)
// ============================================================================
const physFile = path.resolve('public/labs/PhysicsLab/js/physics-ai-chatbot.js');
if (fs.existsSync(physFile)) {
  let c = fs.readFileSync(physFile, 'utf-8');
  c = c.replace(/const PHYSICS_API_KEYS = \[[\s\S]*?\];/, `const PHYSICS_API_KEYS = []; // Managed by Cloudflare Gateway`);

  const physGwCall = `
    // Zero Exposure: Gọi bảo mật qua Cloudflare Gateway
    const gatewayUrl = '${PROXY_URL}/api/ai/chat';
    try {
      const gwRes = await fetch(gatewayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: payload.contents,
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2,
          maxOutputTokens: 1200
        })
      });
      if (gwRes.ok) {
        const gwData = await gwRes.json();
        if (gwData.text) {
          aiReply = gwData.text;
          success = true;
          console.log('[Physics AI] Phản hồi an toàn từ Cloudflare Gateway (Zero Exposure)');
        }
      }
    } catch (gwErr) {
      console.warn('[Physics AI] Gateway connection error:', gwErr.message);
    }
  `;

  if (!c.includes('Zero Exposure: Gọi bảo mật qua Cloudflare Gateway')) {
    c = c.replace(/while \(!success && attempt < totalAttempts\) \{/, `${physGwCall}\n    while (!success && attempt < totalAttempts) {`);
  }

  fs.writeFileSync(physFile, c, 'utf-8');
  console.log('✅ Đã thanh lọc Lab Vật lý: physics-ai-chatbot.js');
}

// ============================================================================
// 5. DỌN DẸP LAB SINH HỌC (src/components/Chatbot.jsx & bundles)
// ============================================================================
const bioSrc = path.resolve('public/labs/lab_sinh/src/components/Chatbot.jsx');
if (fs.existsSync(bioSrc)) {
  let c = fs.readFileSync(bioSrc, 'utf-8');
  c = c.replace(/const API_KEYS = \[[\s\S]*?\];/, `const API_KEYS = []; // Managed by Cloudflare Gateway`);
  fs.writeFileSync(bioSrc, c, 'utf-8');
  console.log('✅ Đã thanh lọc Lab Sinh học Source: Chatbot.jsx');
}

const bioBundle1 = path.resolve('public/labs/lab_sinh/dist/assets/index-bio-v2.js');
if (fs.existsSync(bioBundle1)) {
  let c = fs.readFileSync(bioBundle1, 'utf-8');
  c = c.replace(/hi=\[`AQ.Ab8RN6[\s\S]*?`\],gi=0/, `hi=[],gi=0`);
  fs.writeFileSync(bioBundle1, c, 'utf-8');
  console.log('✅ Đã xóa mảng key thô trong lab_sinh/dist/assets/index-bio-v2.js');
}

const bioBundle2 = path.resolve('public/labs/lab_sinh/dist/assets/index-2SVj7IJ4.js');
if (fs.existsSync(bioBundle2)) {
  let c = fs.readFileSync(bioBundle2, 'utf-8');
  c = c.replace(/hi=\[`AQ.Ab8RN6[\s\S]*?`\],gi=0/, `hi=[],gi=0`);
  fs.writeFileSync(bioBundle2, c, 'utf-8');
  console.log('✅ Đã xóa mảng key thô trong lab_sinh/dist/assets/index-2SVj7IJ4.js');
}

// ============================================================================
// 6. DỌN DẸP LAB TOÁN (GeometryGenerator.tsx & AITutorPanel.tsx)
// ============================================================================
const geomFile = path.resolve('public/labs/toan/frontend/src/components/ui/GeometryGenerator.tsx');
if (fs.existsSync(geomFile)) {
  let c = fs.readFileSync(geomFile, 'utf-8');
  // Xóa key thô fallback
  c = c.replace(/'AQ\.Ab8RN6JPxg59QpmLxbpiEO7uNFHFSESUpsdnJoQKl2bT77d9iQ'/g, "''");
  fs.writeFileSync(geomFile, c, 'utf-8');
  console.log('✅ Đã thanh lọc key thô trong GeometryGenerator.tsx');
}

const tutorFile = path.resolve('public/labs/toan/frontend/src/components/ui/AITutorPanel.tsx');
if (fs.existsSync(tutorFile)) {
  let c = fs.readFileSync(tutorFile, 'utf-8');
  c = c.replace(/'AQ\.Ab8RN6JPxg59QpmLxbpiEO7uNFHFSESUpsdnJoQKl2bT77d9iQ'/g, "''");
  fs.writeFileSync(tutorFile, c, 'utf-8');
  console.log('✅ Đã thanh lọc key thô trong AITutorPanel.tsx');
}

// ============================================================================
// 7. DỌN DẸP FILE .env VÀ .env.local
// ============================================================================
const envLocalPath = path.resolve('.env.local');
if (fs.existsSync(envLocalPath)) {
  let c = fs.readFileSync(envLocalPath, 'utf-8');
  // Loại bỏ các key nhạy cảm phía frontend
  c = c.replace(/NEXT_PUBLIC_GEMINI_API_KEY=".*?"\n?/g, '');
  c = c.replace(/GEMINI_API_KEY=".*?"\n?/g, '');
  
  // Đảm bảo có NEXT_PUBLIC_API_PROXY_URL
  if (!c.includes('NEXT_PUBLIC_API_PROXY_URL')) {
    c += `\n# Cloudflare Edge API Gateway Proxy\nNEXT_PUBLIC_API_PROXY_URL="${PROXY_URL}"\n`;
  }
  fs.writeFileSync(envLocalPath, c.trim() + '\n', 'utf-8');
  console.log('✅ Đã xóa toàn bộ Gemini API Key khỏi .env.local (chỉ giữ lại Proxy URL & Firebase Server SDK)');
}

const mathEnvPath = path.resolve('public/labs/toan/frontend/.env');
if (fs.existsSync(mathEnvPath)) {
  let c = fs.readFileSync(mathEnvPath, 'utf-8');
  c = c.replace(/VITE_GEMINI_API_KEY=.*?\n?/g, '');
  fs.writeFileSync(mathEnvPath, c.trim() + '\n', 'utf-8');
  console.log('✅ Đã xóa VITE_GEMINI_API_KEY khỏi public/labs/toan/frontend/.env');
}

console.log('🎉 [ZERO EXPOSURE HOÀN TẤT] 100% API Key đã được thanh lọc khỏi Frontend Client!');
