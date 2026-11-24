import fs from 'fs';

async function checkArticles() {
  const articles = [
    { name: 'hoa', url: 'https://vietnamnet.vn/dap-an-chinh-thuc-mon-hoa-hoc-thi-tot-nghiep-thpt-nam-2026-cua-bo-gd-dt-2527509.html' },
    { name: 'ly', url: 'https://vietnamnet.vn/dap-an-chinh-thuc-mon-vat-ly-thi-tot-nghiep-thpt-nam-2026-cua-bo-gd-dt-2527498.html' },
    { name: 'sinh', url: 'https://vietnamnet.vn/dap-an-chinh-thuc-mon-sinh-hoc-thi-tot-nghiep-thpt-nam-2026-cua-bo-gd-dt-2527494.html' }
  ];

  for (const a of articles) {
    console.log(`\n=== Article: ${a.name} (${a.url}) ===`);
    const res = await fetch(a.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const text = await res.text();
    // find title
    const titleMatch = text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    console.log('Title:', titleMatch ? titleMatch[1].trim() : 'none');
    
    // find all img sources in article body
    const bodyMatch = text.match(/<div[^>]+class=["'][^"']*maincontent[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
                      text.match(/<div[^>]+id=["']maincontent["'][^>]*>([\s\S]*?)<\/div>/i);
    const content = bodyMatch ? bodyMatch[1] : text;
    const imgRegex = /<img[^>]+(?:src|data-original)=["']([^"']+)["'][^>]*>/gi;
    let m;
    while ((m = imgRegex.exec(content)) !== null) {
      console.log('  Image:', m[1]);
    }

    // check if there are links or tables or embed PDFs
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    while ((m = linkRegex.exec(content)) !== null) {
      if (m[1].includes('.pdf') || m[1].includes('dap-an') || m[1].includes('de-thi') || m[2].includes('đáp án') || m[2].includes('đề thi')) {
        console.log('  Link:', m[1], 'Text:', m[2].trim().replace(/\s+/g, ' '));
      }
    }
  }
}

checkArticles().catch(console.error);

