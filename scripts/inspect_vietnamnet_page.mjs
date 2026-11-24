import fs from 'fs';

async function inspectHtml() {
  const url = 'https://vietnamnet.vn/dap-an-chinh-thuc-mon-toan-thi-tot-nghiep-thpt-nam-2026-cua-bo-gd-dt-2527484.html';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const html = await res.text();

  console.log('--- Links in Answer Page ---');
  const links = [...html.matchAll(/href=["']([^"']+)["']/gi)].map(m => m[1]);
  links.filter(l => l.includes('.pdf') || l.includes('moet') || l.includes('dap-an') || l.includes('drive')).forEach(l => console.log('Link:', l));

  console.log('\n--- Iframes/Embeds ---');
  const iframes = [...html.matchAll(/<(?:iframe|embed|object)[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]);
  iframes.forEach(f => console.log('Frame:', f));

  console.log('\n--- Images in Article ---');
  const imgs = [...html.matchAll(/<img[^>]+(?:src|data-original)=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
  imgs.forEach(img => console.log('Image:', img));

  console.log('\n--- Paragraphs ---');
  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => m[1].replace(/<[^>]+>/g, ' ').trim()).filter(p => p.length > 20);
  paragraphs.slice(0, 20).forEach((p, i) => console.log(`[P${i+1}] ${p}`));
}

inspectHtml().catch(console.error);

