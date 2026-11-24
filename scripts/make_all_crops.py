import os
from PIL import Image

crops_dir = 'reports/ablation/evidence/official_pages/crops'
os.makedirs(crops_dir, exist_ok=True)
base_dir = 'reports/ablation/evidence/official_pages'

img_tables = {
    'toan': Image.open(os.path.join(base_dir, 'toan_2026_dap_an_full.png')),
    'hoa': Image.open(os.path.join(base_dir, 'hoa_hoc_bo_gddt_page_2_upright.png')),
    'ly': Image.open(os.path.join(base_dir, 'vat_ly_bo_gddt_page_1.png')),
    'sinh': Image.open(os.path.join(base_dir, 'sinh_hoc_bo_gddt_page_2_upright.png'))
}

# 1. Math Table Grid (965 x 522):
# Col 0115: x in [560, 630]
# Table rows: header at y=80. 22 rows down to y=510.
# row 1: y in [80, 100], row 2: [100, 118] ...
# row 17 (Part III Q1): y in [385, 415]
# row 18 (Part III Q2): y in [405, 435]
# row 19 (Part III Q3): y in [425, 455]
# row 20 (Part III Q4): y in [445, 475]
# row 21 (Part III Q5): y in [465, 495]
# row 22 (Part III Q6): y in [485, 518]
def crop_toan_ans(row_idx, dest_name):
    # Generous margin
    y_center = 80 + (row_idx - 0.5) * 19.5
    y0 = int(max(0, y_center - 16))
    y1 = int(min(img_tables['toan'].height, y_center + 16))
    crop = img_tables['toan'].crop((560, y0, 630, y1))
    crop.save(os.path.join(crops_dir, dest_name))

# 2. Ly Table Grid (1754 x 1241):
# Col 0214: x in [960, 1060]
# Table rows: header at y=135. 28 rows down to y=1215. row_h = 37.24
def crop_ly_ans(row_idx, dest_name):
    y_center = 135 + (row_idx - 0.5) * 37.24
    y0 = int(max(0, y_center - 25))
    y1 = int(min(img_tables['ly'].height, y_center + 25))
    crop = img_tables['ly'].crop((960, y0, 1060, y1))
    crop.save(os.path.join(crops_dir, dest_name))

# 3. Hoa Table Grid (1754 x 1241):
# Col 0340: x in [1090, 1195]
def crop_hoa_ans(row_idx, dest_name):
    y_center = 135 + (row_idx - 0.5) * 37.24
    y0 = int(max(0, y_center - 25))
    y1 = int(min(img_tables['hoa'].height, y_center + 25))
    crop = img_tables['hoa'].crop((1090, y0, 1195, y1))
    crop.save(os.path.join(crops_dir, dest_name))

# 4. Sinh Table Grid (1754 x 1241):
# Col 0431: x in [490, 590]
def crop_sinh_ans(row_idx, dest_name):
    y_center = 135 + (row_idx - 0.5) * 37.24
    y0 = int(max(0, y_center - 25))
    y1 = int(min(img_tables['sinh'].height, y_center + 25))
    crop = img_tables['sinh'].crop((490, y0, 590, y1))
    crop.save(os.path.join(crops_dir, dest_name))

# TOÁN
crop_toan_ans(17, 'CAND_MATH_01_dap_an.png')
crop_toan_ans(18, 'CAND_MATH_02_dap_an.png')
crop_toan_ans(20, 'CAND_MATH_03_dap_an.png')
crop_toan_ans(21, 'CAND_MATH_04_dap_an.png')
crop_toan_ans(22, 'CAND_MATH_05_dap_an.png')
crop_toan_ans(2,  'CAND_MATH_06_dap_an.png')
crop_toan_ans(4,  'CAND_MATH_07_dap_an.png')
crop_toan_ans(5,  'CAND_MATH_08_dap_an.png')
crop_toan_ans(7,  'CAND_MATH_09_dap_an.png')
crop_toan_ans(12, 'CAND_MATH_10_dap_an.png')
crop_toan_ans(9,  'CAND_MATH_11_dap_an.png')

# HÓA
crop_hoa_ans(23, 'CAND_CHEM_01_dap_an.png')
crop_hoa_ans(24, 'CAND_CHEM_02_dap_an.png')
crop_hoa_ans(25, 'CAND_CHEM_03_dap_an.png')
crop_hoa_ans(26, 'CAND_CHEM_04_dap_an.png')
crop_hoa_ans(27, 'CAND_CHEM_05_dap_an.png')
crop_hoa_ans(28, 'CAND_CHEM_06_dap_an.png')
crop_hoa_ans(13, 'CAND_CHEM_07_dap_an.png')
crop_hoa_ans(17, 'CAND_CHEM_08_dap_an.png')
crop_hoa_ans(18, 'CAND_CHEM_09_dap_an.png')
crop_hoa_ans(2,  'CAND_CHEM_10_dap_an.png')

# LÝ
crop_ly_ans(23, 'CAND_PHYS_01_dap_an.png')
crop_ly_ans(24, 'CAND_PHYS_02_dap_an.png')
crop_ly_ans(25, 'CAND_PHYS_03_dap_an.png')
crop_ly_ans(26, 'CAND_PHYS_04_dap_an.png')
crop_ly_ans(27, 'CAND_PHYS_05_dap_an.png')
crop_ly_ans(28, 'CAND_PHYS_06_dap_an.png')
crop_ly_ans(2,  'CAND_PHYS_07_dap_an.png')
crop_ly_ans(4,  'CAND_PHYS_08_dap_an.png')
crop_ly_ans(5,  'CAND_PHYS_09_dap_an.png')
crop_ly_ans(7,  'CAND_PHYS_10_dap_an.png')
crop_ly_ans(8,  'CAND_PHYS_11_dap_an.png')

# SINH
crop_sinh_ans(23, 'CAND_BIO_01_dap_an.png')
crop_sinh_ans(24, 'CAND_BIO_02_dap_an.png')
crop_sinh_ans(25, 'CAND_BIO_03_dap_an.png')
crop_sinh_ans(26, 'CAND_BIO_04_dap_an.png')
crop_sinh_ans(27, 'CAND_BIO_05_dap_an.png')
crop_sinh_ans(28, 'CAND_BIO_06_dap_an.png')
crop_sinh_ans(10, 'CAND_BIO_07_dap_an.png')
crop_sinh_ans(3,  'CAND_BIO_08_dap_an.png')
crop_sinh_ans(5,  'CAND_BIO_09_dap_an.png')

print("All answer cell crops re-generated with generous margins!")
