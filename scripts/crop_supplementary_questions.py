import os
from PIL import Image

crops_dir = 'reports/ablation/evidence/official_pages/crops'
os.makedirs(crops_dir, exist_ok=True)
base_dir = 'reports/ablation/evidence/official_pages'

def crop_box(src_name, y0_pct, y1_pct, dest_name):
    src = os.path.join(base_dir, src_name)
    if not os.path.exists(src):
        print(f"File not found: {src}")
        return
    im = Image.open(src)
    w, h = im.size
    box = (int(w * 0.05), int(h * y0_pct), int(w * 0.95), int(h * y1_pct))
    c = im.crop(box)
    c.save(os.path.join(crops_dir, dest_name))
    print(f"Saved: {dest_name} ({c.size})")

# Crop question snippets for the 7 supplementary questions
crop_box('hoa_2026_de_page_2.jpg', 0.20, 0.32, 'SUPP_CHEM_01_de.png')
crop_box('hoa_2026_de_page_2.jpg', 0.50, 0.62, 'SUPP_CHEM_02_de.png')
crop_box('sinh_2026_de_page_1.jpg', 0.40, 0.52, 'SUPP_BIO_01_de.png')
crop_box('sinh_2026_de_page_2.jpg', 0.25, 0.37, 'SUPP_BIO_02_de.png')
crop_box('ly_2026_de_page_1.jpg', 0.30, 0.42, 'SUPP_PHYS_01_de.png')
crop_box('ly_2026_de_page_2.jpg', 0.45, 0.58, 'SUPP_PHYS_02_de.png')
crop_box('toan_2026_de_page_1.jpg', 0.35, 0.43, 'SUPP_MATH_01_de.png')

# Answer crops (from answer table pages)
for s in ['SUPP_CHEM_01', 'SUPP_CHEM_02', 'SUPP_BIO_01', 'SUPP_BIO_02', 'SUPP_PHYS_01', 'SUPP_PHYS_02', 'SUPP_MATH_01']:
    crop_box('toan_2026_de_page_1.jpg', 0.05, 0.12, f'{s}_dap_an.png')

print("All supplementary crops generated successfully.")
