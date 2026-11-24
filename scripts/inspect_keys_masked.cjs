const fs = require('fs');

if (fs.existsSync('.env.local')) {
  const env = fs.readFileSync('.env.local', 'utf8');
  for (const line of env.split('\n')) {
    if (line.startsWith('GEMINI_API_KEY=')) {
      const val = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
      const keys = val.split(/[\r\n,]+/).map(k => k.trim()).filter(Boolean);
      console.log('Tổng số khóa tìm thấy trong GEMINI_API_KEY:', keys.length);
      keys.forEach((k, idx) => {
        console.log(`  Khóa ${idx + 1}: ${k.slice(0, 4)}...${k.slice(-4)} (độ dài: ${k.length} ký tự)`);
      });
    }
  }
}
