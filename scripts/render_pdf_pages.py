import fitz # PyMuPDF
import os

pdfs = [
    ('vat_ly_2026_dap_an_bo_gddt.pdf', 'vat_ly_bo_gddt'),
    ('sinh_hoc_2026_dap_an_bo_gddt.pdf', 'sinh_hoc_bo_gddt'),
    ('hoa_hoc_2026_dap_an_bo_gddt.pdf', 'hoa_hoc_bo_gddt'),
    ('toan_2026_dap_an_bo_gddt.pdf', 'toan_bo_gddt')
]

out_dir = 'reports/ablation/evidence/official_pages'

for pdf_name, prefix in pdfs:
    path = os.path.join(out_dir, pdf_name)
    doc = fitz.open(path)
    print(f"\nProcessing {pdf_name} ({len(doc)} pages)...")
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=150)
        out_name = f"{prefix}_page_{i+1}.png"
        out_path = os.path.join(out_dir, out_name)
        pix.save(out_path)
        print(f"  Rendered {out_name}: {os.path.getsize(out_path)} bytes, size=({pix.width}, {pix.height})")

