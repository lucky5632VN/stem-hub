from PIL import Image

# Let's inspect sinh_hoc_bo_gddt_page_2.png
im_sinh = Image.open('reports/ablation/evidence/official_pages/sinh_hoc_bo_gddt_page_2.png')
# In earlier read_file, the seal was in top-left, but the table columns were vertical going left-right?
# In the image we viewed earlier:
# The header "KỲ THI TỐT NGHIỆP TRUNG HỌC PHỔ THÔNG NĂM 2026 - Môn: Sinh học" was vertical on the top right!
# Rotating 270 degrees (90 degrees counter-clockwise) makes it upright!
im_sinh_rotated = im_sinh.rotate(270, expand=True)
im_sinh_rotated.save('reports/ablation/evidence/official_pages/sinh_hoc_bo_gddt_page_2_upright.png')
print("Sinh upright size:", im_sinh_rotated.size)

# Also check hoa_hoc_bo_gddt_page_2.png
im_hoa = Image.open('reports/ablation/evidence/official_pages/hoa_hoc_bo_gddt_page_2.png')
im_hoa_rotated = im_hoa.rotate(270, expand=True)
im_hoa_rotated.save('reports/ablation/evidence/official_pages/hoa_hoc_bo_gddt_page_2_upright.png')
print("Hoa upright size:", im_hoa_rotated.size)

