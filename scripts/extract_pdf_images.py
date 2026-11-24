import pypdf
import os

pdfs = [
    ('vat_ly_2026_dap_an_bo_gddt.pdf', 'vat_ly_bo_gddt_page'),
    ('sinh_hoc_2026_dap_an_bo_gddt.pdf', 'sinh_hoc_bo_gddt_page'),
    ('hoa_hoc_2026_dap_an_bo_gddt.pdf', 'hoa_hoc_bo_gddt_page'),
    ('toan_2026_dap_an_bo_gddt.pdf', 'toan_bo_gddt_page')
]

out_dir = 'reports/ablation/evidence/official_pages'

for pdf_name, prefix in pdfs:
    path = os.path.join(out_dir, pdf_name)
    reader = pypdf.PdfReader(path)
    for p_idx, page in enumerate(reader.pages):
        for im_idx, img in enumerate(page.images):
            ext = img.name.split('.')[-1]
            out_name = f"{prefix}_{p_idx+1}.{ext}"
            out_path = os.path.join(out_dir, out_name)
            with open(out_path, 'wb') as f:
                f.write(img.data)
            print(f"Extracted {out_name}: {os.path.getsize(out_path)} bytes")

