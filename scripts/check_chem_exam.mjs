import fs from 'fs';

async function checkChemExam() {
  const url = 'https://vietnamnet.vn/de-thi-mon-hoa-hoc-thi-tot-nghiep-thpt-nam-2026-2524142.html';
  console.log('Fetching Chem exam from:', url);
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  console.log('Status:', res.status);
  if (!res.ok) return;
  const html = await res.text();
  const title = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  console.log('Title:', title ? title[1].trim() : 'none');

  // find images
  const imgRegex = /<img[^>]+(?:src|data-original)=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = imgRegex.exec(html)) !== null) {
    if (m[1].includes('vps_images_publish') || m[1].includes('de-thi') || m[1].includes('hoa')) {
      console.log('  Image:', m[1]);
    }
  }

  // find links to other exams
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = linkRegex.exec(html)) !== null) {
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    if (text.includes('Vật lý') || text.includes('Sinh học') || text.includes('Hóa học') || m[1].includes('de-thi-mon-')) {
      console.log('  Link:', m[1], 'Text:', text);
    }
  }
}

checkChemExam().catch(console.error);

