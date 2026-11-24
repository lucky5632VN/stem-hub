from PIL import Image

img = Image.open('reports/ablation/evidence/official_pages/hoa_2026_dap_an_page_2.png')
w, h = img.size
print("Size:", w, h)

# Table headers are around y = 80 to 120
# Rows 1-18 are y = 120 to 400
# Rows 19-22 are y = 400 to 470
# Rows 23-28 are y = 470 to 570
table_x0 = 10
table_x1 = w - 10
col_w = (table_x1 - table_x0) / 25
# Col 0: Câu/Đề
# Col 1: 0325 ... Col 16: 0340
x_0340_left = int(table_x0 + 15 * col_w)
x_0340_right = int(table_x0 + 18 * col_w)

crop_header = img.crop((x_0340_left, 70, x_0340_right, 130))
crop_header.save('reports/ablation/evidence/official_pages/crop_hoa_0340_header.png')

crop_part3 = img.crop((x_0340_left, 460, x_0340_right, h - 5))
crop_part3.save('reports/ablation/evidence/official_pages/crop_hoa_0340_part3.png')

print("Saved crops successfully.")
