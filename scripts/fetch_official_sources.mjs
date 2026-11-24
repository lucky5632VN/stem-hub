import fs from 'fs';
import path from 'path';

async function fetchAndAnalyze() {
  const url = 'https://vietnamnet.vn/de-thi-mon-toan-thi-tot-nghiep-thpt-nam-2026-2524242.html';
  console.log('Fetching:', url);
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const html = await res.text();
  console.log('Length:', html.length);

  // Extract images
  const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
  console.log('Found images:', imgMatches.length);
  imgMatches.slice(0, 15).forEach((m, i) => {
    console.log(`[Img ${i+1}] ${m[1]}`);
  });

  // Extract article body text / headings
  const bodyMatch = html.match(/<div[^>]+class=["'][^"']*maincontent[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)
    || html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);

  if (bodyMatch) {
    const text = bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    console.log('Body preview:', text.slice(0, 500));
  } else {
    console.log('No maincontent match, showing sample text:');
    const plain = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    console.log(plain.slice(0, 1000));
  }
}

fetchAndAnalyze().catch(console.error);

