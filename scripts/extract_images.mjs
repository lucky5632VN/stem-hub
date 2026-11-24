import fs from 'fs';

async function extractImages() {
  const url = 'https://vietnamnet.vn/de-thi-mon-toan-thi-tot-nghiep-thpt-nam-2026-2524242.html';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();

  const imgRegex = /<img[^>]+(?:src|data-original)=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    if (match[1].includes('vps_images_publish')) {
      console.log('Exam Image:', match[1]);
    }
  }

  // Also check answer page
  const ansUrl = 'https://vietnamnet.vn/dap-an-chinh-thuc-mon-toan-thi-tot-nghiep-thpt-nam-2026-cua-bo-gd-dt-2527484.html';
  const resAns = await fetch(ansUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const htmlAns = await resAns.text();
  console.log('\n--- Answer Page Images ---');
  while ((match = imgRegex.exec(htmlAns)) !== null) {
    if (match[1].includes('vps_images_publish') || match[1].includes('.jpg') || match[1].includes('.png')) {
      console.log('Answer Image:', match[1]);
    }
  }
}

extractImages().catch(console.error);

