import fs from 'fs';

async function searchVietNamNet(q) {
  const url = `https://vietnamnet.vn/tim-kiem?q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  const results = [];
  while ((m = linkRegex.exec(html)) !== null) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    if (href.includes('de-thi') || text.includes('Đề thi')) {
      results.push({ href, text });
    }
  }
  return results;
}

async function main() {
  const queries = [
    'Đề thi môn Hóa học tốt nghiệp THPT năm 2026',
    'Đề thi môn Vật lý tốt nghiệp THPT năm 2026',
    'Đề thi môn Sinh học tốt nghiệp THPT năm 2026'
  ];

  for (const q of queries) {
    console.log(`\n=== Query: ${q} ===`);
    const res = await searchVietNamNet(q);
    res.slice(0, 5).forEach(r => console.log(`  ${r.href} -> ${r.text}`));
  }
}

main().catch(console.error);

