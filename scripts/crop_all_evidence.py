import os
from PIL import Image

crops_dir = 'reports/ablation/evidence/official_pages/crops'
os.makedirs(crops_dir, exist_ok=True)
base_dir = 'reports/ablation/evidence/official_pages'

print("=== GENERATING IMAGE CROPS FOR CANDIDATES ===")

# Helper crop function
def crop_box(src_img_path, box, dest_name):
    im = Image.open(src_img_path)
    cropped = im.crop(box)
    dest_path = os.path.join(crops_dir, dest_name)
    cropped.save(dest_path)
    print(f"Saved: {dest_name} ({cropped.size})")

# 1. TOÁN (Mã 0115)
# Exam pages: toan_2026_de_page_3.jpg, page_4.jpg, page_1.jpg, page_2.jpg
# Answer table: toan_bo_gddt_page_1.png (1241 x 1754)
# In toan_bo_gddt_page_1.png, table header is around y=240, cols 0101 to 0124
# Col 0115 is col index 15 (after label col)
# Let's inspect answer table dimensions
ans_toan = Image.open(os.path.join(base_dir, 'toan_bo_gddt_page_1.png'))
w_t, h_t = ans_toan.size
print(f"Toan answer table size: {w_t}x{h_t}")

# Table x-span roughly 50 to 1200
# Let's find exact coordinates for col 0115
col_0115_x0 = int(50 + 15 * ((1200 - 50) / 25))
col_0115_x1 = int(50 + 16 * ((1200 - 50) / 25))

# We can crop the col 0115 header + cells
# Part III rows are rows 17 to 22
row_h = (1650 - 270) / 23 # roughly 22-23 rows
for r in range(1, 23):
    y0 = int(270 + (r - 1) * row_h)
    y1 = int(270 + r * row_h)

print("Base coordinates calculated.")

