import fs from 'fs';
import path from 'path';

async function downloadMathExam() {
  const url = 'https://vietnamnet.vn/de-thi-mon-toan-thi-tot-nghiep-thpt-nam-2026-2524242.html';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();

  const dir = path.resolve('reports/ablation/evidence/official_pages');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const regex = /<img[^>]+data-original=["']([^"']+)["'][^>]*>/gi;
  let match;
  let count = 0;
  while ((match = regex.exec(html)) !== null) {
    let imgUrl = match[1];
    if (imgUrl.includes('de-toan-thpt')) {
      count++;
      // convert to width=0 for full res
      const fullUrl = imgUrl.replace(/width=\d+/, 'width=0');
      console.log(`Downloading Math page ${count}:`, fullUrl);
      const imgRes = await fetch(fullUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const dest = path.join(dir, `toan_2026_de_page_${count}.jpg`);
      fs.writeFileSync(dest, buf);
      console.log(`Saved: ${dest} (${buf.length} bytes)`);
    }
  }
}

downloadMathExam().catch(console.error);

