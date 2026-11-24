import fs from 'fs';

async function checkMasterArticle() {
  const url = 'https://vietnamnet.vn/dap-an-chinh-thuc-cac-mon-thi-tot-nghiep-thpt-nam-2026-cua-bo-gd-dt-2527495.html';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const text = await res.text();
  console.log('Status:', res.status);
  
  // Find all links and images
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = linkRegex.exec(text)) !== null) {
    const href = m[1];
    const label = m[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    if (label.includes('Toán') || label.includes('Lý') || label.includes('Hóa') || label.includes('Sinh') || label.includes('Vật lý') || label.includes('Hóa học') || label.includes('Sinh học') || href.includes('252') || href.includes('.pdf')) {
      console.log(`Link: ${href} | Text: "${label}"`);
    }
  }

  // Find images
  const imgRegex = /<img[^>]+(?:src|data-original)=["']([^"']+)["'][^>]*>/gi;
  while ((m = imgRegex.exec(text)) !== null) {
    if (m[1].includes('2026') || m[1].includes('dap-an')) {
      console.log('Img:', m[1]);
    }
  }
}

checkMasterArticle().catch(console.error);

