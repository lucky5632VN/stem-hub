import fs from 'fs';

async function findOtherExams() {
  // Let's test likely IDs around 2524142:
  // Math was 2524242.
  // Chem was 2524142.
  // Let's scan IDs between 2524100 and 2524300
  const urls = [];
  for (let id = 2524100; id <= 2524260; id++) {
    urls.push(id);
  }

  console.log(`Checking IDs...`);
  for (const id of urls) {
    try {
      const res = await fetch(`https://vietnamnet.vn/${id}.html`, { method: 'HEAD', redirect: 'follow' });
      if (res.ok) {
        const finalUrl = res.url;
        if (finalUrl.includes('de-thi-mon-') || finalUrl.includes('dap-an-mon-')) {
          console.log(`ID ${id} -> ${finalUrl}`);
        }
      }
    } catch(e) {}
  }
}

findOtherExams().catch(console.error);

