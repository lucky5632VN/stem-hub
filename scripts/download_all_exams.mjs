import fs from 'fs';
import path from 'path';

const outDir = path.resolve('reports/ablation/evidence/official_pages');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function downloadExamPages(subjectPrefix, url) {
  console.log(`\n=== Downloading ${subjectPrefix} exam from ${url} ===`);
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) {
    console.log(`HTTP error ${res.status}`);
    return;
  }
  const html = await res.text();
  
  // Find all content images
  const regex = /<img[^>]+data-original=["']([^"']+)["'][^>]*>/gi;
  let m;
  const imgs = [];
  while ((m = regex.exec(html)) !== null) {
    const src = m[1];
    // Filter for exam images (avoid avatars, logos, related article thumbs)
    if (src.includes('vps_images_publish') && !src.includes('dap-an') && !src.includes('nga-4') && !src.includes('2145')) {
      imgs.push(src);
    }
  }

  console.log(`Found ${imgs.length} exam image candidates`);
  let count = 0;
  for (const rawUrl of imgs) {
    count++;
    const fullUrl = rawUrl.replace(/width=\d+/, 'width=0').replace(/&amp;/g, '&');
    const ext = path.extname(new URL(fullUrl).pathname) || '.jpg';
    const destName = `${subjectPrefix}_2026_de_page_${count}${ext}`;
    const destPath = path.join(outDir, destName);
    
    console.log(`Downloading page ${count}: ${destName}`);
    const imgRes = await fetch(fullUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const buf = Buffer.from(await imgRes.arrayBuffer());
    fs.writeFileSync(destPath, buf);
    console.log(`Saved ${destName} (${buf.length} bytes)`);
  }
}

async function main() {
  await downloadExamPages('hoa', 'https://vietnamnet.vn/de-thi-mon-hoa-hoc-thi-tot-nghiep-thpt-nam-2026-2524142.html');
  await downloadExamPages('ly', 'https://vietnamnet.vn/de-thi-mon-vat-ly-thi-tot-nghiep-thpt-nam-2026-2524172.html');
  await downloadExamPages('sinh', 'https://vietnamnet.vn/de-thi-mon-sinh-hoc-thi-tot-nghiep-thpt-nam-2026-2524135.html');
}

main().catch(console.error);

