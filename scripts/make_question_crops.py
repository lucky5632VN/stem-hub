import os
from PIL import Image

crops_dir = 'reports/ablation/evidence/official_pages/crops'
os.makedirs(crops_dir, exist_ok=True)
base_dir = 'reports/ablation/evidence/official_pages'

# We can crop question regions from the exam page images
# Each exam page is roughly 1500-2000 width, 2000-2800 height

def crop_exam_q(src_name, y_ratio_start, y_ratio_end, dest_name):
    src_path = os.path.join(base_dir, src_name)
    im = Image.open(src_path)
    w, h = im.size
    y0 = int(h * y_ratio_start)
    y1 = int(h * y_ratio_end)
    crop = im.crop((int(w * 0.05), y0, int(w * 0.95), y1))
    dest_path = os.path.join(crops_dir, dest_name)
    crop.save(dest_path)

print("Cropping exam question snippets...")

# MATH (Mã 0115)
crop_exam_q('toan_2026_de_page_3.jpg', 0.33, 0.68, 'CAND_MATH_01_de.png')
crop_exam_q('toan_2026_de_page_3.jpg', 0.68, 0.96, 'CAND_MATH_02_de.png')
crop_exam_q('toan_2026_de_page_4.jpg', 0.44, 0.62, 'CAND_MATH_03_de.png')
crop_exam_q('toan_2026_de_page_4.jpg', 0.70, 0.76, 'CAND_MATH_04_de.png')
crop_exam_q('toan_2026_de_page_4.jpg', 0.76, 0.84, 'CAND_MATH_05_de.png')
crop_exam_q('toan_2026_de_page_1.jpg', 0.30, 0.38, 'CAND_MATH_06_de.png')
crop_exam_q('toan_2026_de_page_1.jpg', 0.41, 0.45, 'CAND_MATH_07_de.png')
crop_exam_q('toan_2026_de_page_1.jpg', 0.45, 0.51, 'CAND_MATH_08_de.png')
crop_exam_q('toan_2026_de_page_1.jpg', 0.55, 0.60, 'CAND_MATH_09_de.png')
crop_exam_q('toan_2026_de_page_2.jpg', 0.20, 0.25, 'CAND_MATH_10_de.png')
crop_exam_q('toan_2026_de_page_1.jpg', 0.76, 0.88, 'CAND_MATH_11_de.png')

# HÓA (Mã 0340)
crop_exam_q('hoa_2026_de_page_4.jpg', 0.05, 0.17, 'CAND_CHEM_01_de.png')
crop_exam_q('hoa_2026_de_page_4.jpg', 0.17, 0.40, 'CAND_CHEM_02_de.png')
crop_exam_q('hoa_2026_de_page_4.jpg', 0.40, 0.56, 'CAND_CHEM_03_de.png')
crop_exam_q('hoa_2026_de_page_4.jpg', 0.56, 0.61, 'CAND_CHEM_04_de.png')
crop_exam_q('hoa_2026_de_page_4.jpg', 0.61, 0.71, 'CAND_CHEM_05_de.png')
crop_exam_q('hoa_2026_de_page_4.jpg', 0.71, 0.79, 'CAND_CHEM_06_de.png')
crop_exam_q('hoa_2026_de_page_2.jpg', 0.29, 0.44, 'CAND_CHEM_07_de.png')
crop_exam_q('hoa_2026_de_page_2.jpg', 0.67, 0.72, 'CAND_CHEM_08_de.png')
crop_exam_q('hoa_2026_de_page_2.jpg', 0.72, 0.76, 'CAND_CHEM_09_de.png')
crop_exam_q('hoa_2026_de_page_1.jpg', 0.29, 0.33, 'CAND_CHEM_10_de.png')

# LÝ (Mã 0214)
crop_exam_q('ly_2026_de_page_3.jpg', 0.70, 0.88, 'CAND_PHYS_01_de.png')
crop_exam_q('ly_2026_de_page_3.jpg', 0.88, 0.94, 'CAND_PHYS_02_de.png')
crop_exam_q('ly_2026_de_page_4.jpg', 0.06, 0.25, 'CAND_PHYS_03_de.png')
crop_exam_q('ly_2026_de_page_4.jpg', 0.25, 0.36, 'CAND_PHYS_04_de.png')
crop_exam_q('ly_2026_de_page_4.jpg', 0.36, 0.67, 'CAND_PHYS_05_de.png')
crop_exam_q('ly_2026_de_page_4.jpg', 0.67, 0.76, 'CAND_PHYS_06_de.png')
crop_exam_q('ly_2026_de_page_1.jpg', 0.25, 0.30, 'CAND_PHYS_07_de.png')
crop_exam_q('ly_2026_de_page_1.jpg', 0.38, 0.44, 'CAND_PHYS_08_de.png')
crop_exam_q('ly_2026_de_page_1.jpg', 0.44, 0.51, 'CAND_PHYS_09_de.png')
crop_exam_q('ly_2026_de_page_1.jpg', 0.57, 0.66, 'CAND_PHYS_10_de.png')
crop_exam_q('ly_2026_de_page_1.jpg', 0.66, 0.75, 'CAND_PHYS_11_de.png')

# SINH (Mã 0431)
crop_exam_q('sinh_2026_de_page_4.jpg', 0.03, 0.13, 'CAND_BIO_01_de.png')
crop_exam_q('sinh_2026_de_page_4.jpg', 0.13, 0.23, 'CAND_BIO_02_de.png')
crop_exam_q('sinh_2026_de_page_4.jpg', 0.23, 0.41, 'CAND_BIO_03_de.png')
crop_exam_q('sinh_2026_de_page_4.jpg', 0.41, 0.51, 'CAND_BIO_04_de.png')
crop_exam_q('sinh_2026_de_page_4.jpg', 0.51, 0.67, 'CAND_BIO_05_de.png')
crop_exam_q('sinh_2026_de_page_4.jpg', 0.67, 0.85, 'CAND_BIO_06_de.png')
crop_exam_q('sinh_2026_de_page_1.jpg', 0.85, 0.92, 'CAND_BIO_07_de.png')
crop_exam_q('sinh_2026_de_page_1.jpg', 0.37, 0.43, 'CAND_BIO_08_de.png')
crop_exam_q('sinh_2026_de_page_1.jpg', 0.47, 0.53, 'CAND_BIO_09_de.png')

print("All question crops generated successfully!")

