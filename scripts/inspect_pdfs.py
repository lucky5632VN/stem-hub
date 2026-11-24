import pypdf

pdfs = [
    'toan_2026_dap_an_bo_gddt.pdf',
    'vat_ly_2026_dap_an_bo_gddt.pdf',
    'hoa_hoc_2026_dap_an_bo_gddt.pdf',
    'sinh_hoc_2026_dap_an_bo_gddt.pdf'
]

for p in pdfs:
    path = f'reports/ablation/evidence/official_pages/{p}'
    reader = pypdf.PdfReader(path)
    print(f"\n=== {p} (Pages: {len(reader.pages)}) ===")
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ''
        print(f"Page {i+1}: length={len(text)}, images={len(page.images)}")
        if len(text) > 0:
            print("  Preview text:", text[:200].replace('\n', ' '))

