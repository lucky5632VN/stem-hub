const fs = require('fs');
const path = require('path');

const TARGET_STRINGS = [
  ['stemhub', 'rag', 'internal', 'sig', '2026'].join('_'),
  ['stemhub', 'admin', 'secret', 'key', '2026'].join('_'),
  'INTERNAL_AI_SECRET',
  'ADMIN_SECRET_KEY',
  'CRON_SECRET'
];

function scanDirectory(dir, results = {}) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, results);
    } else if (entry.isFile()) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const str of TARGET_STRINGS) {
          if (!results[str]) results[str] = { staticCount: 0, serverCount: 0, occurrences: [] };
          let idx = 0;
          let count = 0;
          while ((idx = content.indexOf(str, idx)) !== -1) {
            count++;
            idx += str.length;
          }
          if (count > 0) {
            const isStatic = fullPath.includes('.next' + path.sep + 'static') || fullPath.includes('/static/');
            if (isStatic) {
              results[str].staticCount += count;
            } else {
              results[str].serverCount += count;
            }
            results[str].occurrences.push({
              file: fullPath.replace(process.cwd(), ''),
              count,
              isStatic
            });
          }
        }
      } catch (_) {}
    }
  }
  return results;
}

function main() {
  console.log('='.repeat(70));
  console.log('🔍 QUÉT BẢNG MÃ .next/static VÀ .next/server TÌM BÍ MẬT CŨ VÀ TÊN BIẾN');
  console.log('='.repeat(70));

  const nextDir = path.resolve('.next');
  if (!fs.existsSync(nextDir)) {
    console.error('❌ Thư mục .next chưa tồn tại. Cần chạy next build trước.');
    process.exit(1);
  }

  const staticDir = path.join(nextDir, 'static');
  const serverDir = path.join(nextDir, 'server');

  const results = {};
  TARGET_STRINGS.forEach(s => {
    results[s] = { staticCount: 0, serverCount: 0, occurrences: [] };
  });

  scanDirectory(staticDir, results);
  scanDirectory(serverDir, results);

  console.log('\n📊 KẾT QUẢ QUÉT:');
  console.log('─'.repeat(70));
  console.log(String('Chuỗi / Tên biến').padEnd(35) + String('.next/static (Client)').padEnd(22) + '.next/server (Server)');
  console.log('─'.repeat(70));

  for (const str of TARGET_STRINGS) {
    const r = results[str];
    console.log(
      String(str).padEnd(35) +
      String(r.staticCount + ' lần').padEnd(22) +
      (r.serverCount + ' lần')
    );
  }
  console.log('─'.repeat(70));

  const totalStaticLeaks = TARGET_STRINGS.reduce((sum, s) => sum + results[s].staticCount, 0);
  console.log(`\n🔒 TỔNG SỐ LẦN XUẤT HIỆN TRONG .next/static (Trình duyệt tải về): ${totalStaticLeaks}`);
  if (totalStaticLeaks === 0) {
    console.log('✅ AN TOÀN: Không có bất kỳ bí mật hay tên biến môi trường nào bị rò rỉ vào Client Bundle.');
  } else {
    console.log('❌ CẢNH BÁO: Phát hiện chuỗi bí mật trong client bundle!');
  }
}

main();

