import fs from 'fs';

async function inspectPhysBio() {
  const list = [
    { name: 'ly', url: 'https://vietnamnet.vn/dap-an-chinh-thuc-mon-vat-ly-thi-tot-nghiep-thpt-nam-2026-cua-bo-gd-dt-2527498.html' },
    { name: 'sinh', url: 'https://vietnamnet.vn/dap-an-chinh-thuc-mon-sinh-hoc-thi-tot-nghiep-thpt-nam-2026-cua-bo-gd-dt-2527494.html' }
  ];

  for (const item of list) {
    const res = await fetch(item.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const text = await res.text();
    console.log(`\n=== ${item.name} ===`);
    const allImgs = [...text.matchAll(/https:\/\/static-images\.vnncdn\.net[^\s"'>]+/gi)].map(m => m[0]);
    console.log('Static images count:', allImgs.length);
    allImgs.forEach(u => console.log('  ', u));
  }
}

inspectPhysBio().catch(console.error);

