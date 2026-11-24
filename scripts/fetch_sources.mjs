import fs from 'fs';
import path from 'path';

const outDir = path.resolve('reports/ablation/evidence/official_pages');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function fetchPageImages(name, url, filterKeyword) {
  console.log(`\n=== Fetching ${name} from ${url} ===`);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    if (!res.ok) {
      console.log(`Failed HTTP ${res.status}`);
      return [];
    }
    const html = await res.text();
    const regex = /<img[^>]+data-original=["']([^"']+)["'][^>]*>/gi;
    let match;
    const imgs = [];
    while ((match = regex.exec(html)) !== null) {
      imgs.push(match[1]);
    }
    console.log(`Total images found: ${imgs.length}`);
    const filtered = filterKeyword ? imgs.filter(u => u.includes(filterKeyword)) : imgs;
    console.log(`Matching images (${filterKeyword || 'all'}): ${filtered.length}`);

    for (let i = 0; i < filtered.length; i++) {
      let imgUrl = filtered[i];
      const fullUrl = imgUrl.replace(/width=\d+/, 'width=0');
      const ext = path.extname(new URL(fullUrl).pathname) || '.jpg';
      const destName = `${name}_${i + 1}${ext}`;
      const destPath = path.join(outDir, destName);
      console.log(`Downloading [${i + 1}/${filtered.length}]: ${destName}`);
      const imgRes = await fetch(fullUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const buf = Buffer.from(await imgRes.arrayBuffer());
      fs.writeFileSync(destPath, buf);
      console.log(`Saved ${destName} (${buf.length} bytes)`);
    }
    return filtered;
  } catch (err) {
    console.error(`Error fetching ${name}:`, err.message);
    return [];
  }
}

async function searchVietNamNetExams() {
  const subjects = [
    { name: 'hoa_hoc', query: 'de-thi-mon-hoa-hoc-thi-tot-nghiep-thpt-nam-2026' },
    { name: 'vat_ly', query: 'de-thi-mon-vat-ly-thi-tot-nghiep-thpt-nam-2026' },
    { name: 'sinh_hoc', query: 'de-thi-mon-sinh-hoc-thi-tot-nghiep-thpt-nam-2026' }
  ];

  // Try direct URLs or search
  for (const s of subjects) {
    // VietNamNet typical URL structure: de-thi-mon-<subject>-thi-tot-nghiep-thpt-nam-2026-<id>.html
    console.log(`\nSearching exam for ${s.name}...`);
  }
}

async function main() {
  // Download keys for Chemistry, Physics, Biology
  await fetchPageImages('hoa_2026_dap_an', 'https://vietnamnet.vn/dap-an-chinh-thuc-mon-hoa-hoc-thi-tot-nghiep-thpt-nam-2026-cua-bo-gd-dt-2527509.html', 'dap-an');
  await fetchPageImages('ly_2026_dap_an', 'https://vietnamnet.vn/dap-an-chinh-thuc-mon-vat-ly-thi-tot-nghiep-thpt-nam-2026-cua-bo-gd-dt-2527498.html', 'dap-an');
  await fetchPageImages('sinh_2026_dap_an', 'https://vietnamnet.vn/dap-an-chinh-thuc-mon-sinh-hoc-thi-tot-nghiep-thpt-nam-2026-cua-bo-gd-dt-2527494.html', 'dap-an');
}

main().catch(console.error);

