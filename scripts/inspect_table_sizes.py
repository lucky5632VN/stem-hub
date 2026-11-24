from PIL import Image
import os

base_dir = 'reports/ablation/evidence/official_pages'

imgs = {
    'toan': 'toan_2026_dap_an_full.png',
    'hoa': 'hoa_hoc_bo_gddt_page_2.png',
    'ly': 'vat_ly_bo_gddt_page_1.png',
    'sinh': 'sinh_hoc_bo_gddt_page_2.png'
}

for k, v in imgs.items():
    p = os.path.join(base_dir, v)
    im = Image.open(p)
    print(f"{k.upper()}: {v} -> size={im.size}")

