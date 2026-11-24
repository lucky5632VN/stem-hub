const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync('.env.local', 'utf8');
const match = envContent.match(/^GEMINI_API_KEY=(.*)$/m);
const rawKeys = match[1].split(/[\r\n,]+/).map(k => k.trim()).filter(Boolean);
const cleanedKeys = rawKeys.map(k => k.replace(/[^A-Za-z0-9_.-]/g, '').trim()).filter(k => k.length >= 20);

const maskedData = JSON.parse(fs.readFileSync('reports/gitleaks_classification_masked.json', 'utf8'));
const masks = [];
function extract(obj) {
  if (Array.isArray(obj)) obj.forEach(extract);
  else if (obj && typeof obj === 'object') {
    if (obj.secretMask) masks.push(obj.secretMask);
    Object.values(obj).forEach(extract);
  }
}
extract(maskedData);

console.log('================================================================================');
console.log('🔍 ĐỐI CHIẾU 4 KÝ TỰ CUỐI CỦA 15 KHÓA GEMINI VỚI GITLEAKS MASKED REPORT');
console.log('================================================================================');
console.log('Tổng số khóa kiểm tra:', cleanedKeys.length);
console.log('--------------------------------------------------------------------------------');
cleanedKeys.forEach((key, idx) => {
  const last4 = key.slice(-4);
  const last3 = key.slice(-3);
  const isAQ = key.startsWith('AQ');
  const isAIza = key.startsWith('AIza');
  const type = isAQ ? 'AQ' : (isAIza ? 'AIza' : 'Other');
  
  // Check if last4 or last3 is in any mask in gitleaks_classification_masked.json
  const matchedMask = masks.find(m => m.includes(last4) || m.includes(last3));
  const res = matchedMask ? 'Khớp (có trong báo cáo gitleaks)' : 'Không khớp (không có trong báo cáo gitleaks)';
  console.log('STT #' + (idx + 1) + ' [' + type + ']: ' + res);
});
console.log('================================================================================');

