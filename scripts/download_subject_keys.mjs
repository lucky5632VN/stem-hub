import fs from 'fs';
import path from 'path';

const outDir = path.resolve('reports/ablation/evidence/official_pages');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function downloadSubjectKeys() {
  const articles = [
    { subject: 'hoa', url: 'https://vietnamnet.vn/dap-an-chinh-thuc-mon-hoa-hoc-thi-tot-nghiep-thpt-nam-2026-cua-bo-gd-dt-2527509.html' },
    { subject: 'ly', url: 'https://vietnamnet.vn/dap-an-chinh-thuc-mon-vat-ly-thi-tot-nghiep-thpt-nam-2026-cua-bo-gd-dt-2527498.html' },
    { subject: 'sinh', url: 'https://vietnamnet.vn/dap-an-chinh-thuc-mon-sinh-hoc-thi-tot-nghiep-thpt-nam-2026-cua-bo-gd-dt-2527494.html' }
  ];

  for (const item of articles) {
    console.log(`\n=== Checking ${item.subject} from ${item.url} ===`);
    const res = await fetch(item.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const text = await res.text();
    
    // find all figure images
    const figRegex = /<figure[^>]*>[\s\S]*?<img[^>]+data-original=["']([^"']+)["'][^>]*>[\s\S]*?<\/figure>/gi;
    let m;
    let idx = 0;
    while ((m = figRegex.exec(text)) !== null) {
      idx++;
      let imgUrl = m[1].replace(/width=\d+/, 'width=0');
      // decode html entities like &amp;
      imgUrl = imgUrl.replace(/&amp;/g, '&');
      console.log(`Found image ${idx}:`, imgUrl);
      const ext = path.extname(new URL(imgUrl).pathname) || '.png';
      const destName = `${item.subject}_2026_dap_an_page_${idx}${ext}`;
      const destPath = path.join(outDir, destName);
      
      const imgRes = await fetch(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const buf = Buffer.from(await imgRes.arrayBuffer());
      fs.writeFileSync(destPath, buf);
      console.log(`Saved: ${destName} (${buf.length} bytes)`);
    }
  }
}

downloadSubjectKeys().catch(console.error);

