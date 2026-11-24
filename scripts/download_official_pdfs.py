import urllib.request
import os

pdf_links = {
    'toan_2026_dap_an_bo_gddt.pdf': 'https://attachment.vnecdn.net/2026/06/19/Toa-n-pdf.pdf',
    'vat_ly_2026_dap_an_bo_gddt.pdf': 'https://attachment.vnecdn.net/2026/06/19/Vat-ly-pdf.pdf',
    'hoa_hoc_2026_dap_an_bo_gddt.pdf': 'https://attachment.vnecdn.net/2026/06/19/Hoa-hoc-pdf.pdf',
    'sinh_hoc_2026_dap_an_bo_gddt.pdf': 'https://attachment.vnecdn.net/2026/06/19/Sinh-ho-c-pdf.pdf'
}

out_dir = 'reports/ablation/evidence/official_pages'
os.makedirs(out_dir, exist_ok=True)

for fname, url in pdf_links.items():
    dest = os.path.join(out_dir, fname)
    print(f"Downloading {fname} from {url}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        data = urllib.request.urlopen(req).read()
        with open(dest, 'wb') as f:
            f.write(data)
        print(f"  Saved {dest} ({len(data)} bytes)")
    except Exception as e:
        print(f"  Failed {fname}: {e}")

