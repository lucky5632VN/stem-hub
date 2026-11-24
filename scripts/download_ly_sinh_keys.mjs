import fs from 'fs';
import path from 'path';

const outDir = path.resolve('reports/ablation/evidence/official_pages');

const downloads = [
  { name: 'ly_2026_dap_an_page_1.jpg', url: 'https://static-images.vnncdn.net/vps_images_publish/000001/000003/2026/6/19/dap-an-chinh-thuc-mon-vat-ly-thi-tot-nghiep-thpt-nam-2026-cua-bo-gd-dt-2182.jpg?width=0&s=k-ehRhtzQNnHHVhnUf_rXA' },
  { name: 'ly_2026_dap_an_page_2.jpg', url: 'https://static-images.vnncdn.net/vps_images_publish/000001/000003/2026/6/19/dap-an-chinh-thuc-mon-vat-ly-thi-tot-nghiep-thpt-nam-2026-cua-bo-gd-dt-2183.jpg?width=0&s=N33jPKF_H7tWcl3nwKTzkw' },
  { name: 'sinh_2026_dap_an_page_1.jpg', url: 'https://static-images.vnncdn.net/vps_images_publish/000001/000003/2026/6/19/dap-an-chinh-thuc-mon-sinh-hoc-thi-tot-nghiep-thpt-nam-2026-cua-bo-gd-dt-2153.jpg?width=0&s=OM68i3wgx5JHyB7cjlxkPw' },
  { name: 'sinh_2026_dap_an_page_2.jpg', url: 'https://static-images.vnncdn.net/vps_images_publish/000001/000003/2026/6/19/dap-an-chinh-thuc-mon-sinh-hoc-thi-tot-nghiep-thpt-nam-2026-cua-bo-gd-dt-2154.jpg?width=0&s=uil_Z-0oE0pqZNzrTdvKIg' }
];

async function run() {
  for (const item of downloads) {
    const dest = path.join(outDir, item.name);
    console.log(`Downloading ${item.name}...`);
    const res = await fetch(item.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log(`Saved ${item.name} (${buf.length} bytes)`);
  }
}

run().catch(console.error);

