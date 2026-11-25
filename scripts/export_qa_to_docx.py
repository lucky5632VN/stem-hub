# -*- coding: utf-8 -*-
"""
Xuất tài liệu Bộ Câu Hỏi Phản Biện Ban Giám Khảo & Vị Trí Mã Nguồn Cải Tiến sang file Word (.docx)
Đọc nguồn từ: docs/bo-cau-hoi-phan-bien-va-vi-tri-code.md
Xuất ra:     docs/official_submission/BO_CAU_HOI_PHAN_BIEN_VA_VI_TRI_CODE_BGK.docx
"""

import re
from pathlib import Path
from docx import Document
from docx.shared import Pt, RGBColor, Cm, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parent.parent
MD_FILE = ROOT / "docs" / "bo-cau-hoi-phan-bien-va-vi-tri-code.md"
OUT_FILE = ROOT / "docs" / "official_submission" / "BO_CAU_HOI_PHAN_BIEN_VA_VI_TRI_CODE_BGK.docx"

COLOR_PRIMARY = RGBColor(0x1B, 0x36, 0x5D)   # Navy dark
COLOR_ACCENT = RGBColor(0x0F, 0x4C, 0x81)    # Deep blue
COLOR_TEXT = RGBColor(0x1F, 0x29, 0x37)      # Dark slate
COLOR_MUTED = RGBColor(0x4B, 0x55, 0x63)     # Slate grey
COLOR_CODE = RGBColor(0xB9, 0x1C, 0x1C)      # Subtle dark crimson for inline code

TOKEN_RE = re.compile(r'(\*\*[^*]+\*\*|`[^`]+`|\$[^$]+\$)')


def add_formatted_runs(para, text: str, base_italic: bool = False, base_color=None):
    """Parse **bold**, `code`, and $math$ inline tokens cleanly into docx runs."""
    # Clean common LaTeX arrows/operators for clean Word display
    cleaned = text.replace(r'\rightarrow', '→').replace(r'\le', '≤').replace(r'\ge', '≥').replace(r'\kappa', 'κ')
    last = 0
    for m in TOKEN_RE.finditer(cleaned):
        if m.start() > last:
            run = para.add_run(cleaned[last:m.start()])
            run.italic = base_italic
            if base_color:
                run.font.color.rgb = base_color
        tok = m.group(0)
        if tok.startswith("**") and tok.endswith("**"):
            run = para.add_run(tok[2:-2])
            run.bold = True
            run.italic = base_italic
            if base_color:
                run.font.color.rgb = base_color
        elif tok.startswith("`") and tok.endswith("`"):
            run = para.add_run(tok[1:-1])
            run.font.name = "Consolas"
            run.font.size = Pt(10.5)
            run.font.color.rgb = COLOR_ACCENT
        elif tok.startswith("$") and tok.endswith("$"):
            math_body = tok[1:-1].strip()
            run = para.add_run(math_body)
            run.italic = True
            if base_color:
                run.font.color.rgb = base_color
        last = m.end()

    if last < len(cleaned):
        run = para.add_run(cleaned[last:])
        run.italic = base_italic
        if base_color:
            run.font.color.rgb = base_color


def set_cell_shading(cell, fill_hex: str):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)


def set_cell_margins(cell, top=80, bottom=80, left=120, right=120):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m_name, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m_name}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)


def add_code_block(doc, lines: list):
    code_text = "\n".join(lines)
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.left_indent = Inches(0.25)
    p.paragraph_format.right_indent = Inches(0.15)
    run = p.add_run(code_text)
    run.font.name = "Consolas"
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), 'F1F5F9')
    pPr.append(shd)

    pBdr = OxmlElement('w:pBdr')
    left_bdr = OxmlElement('w:left')
    left_bdr.set(qn('w:val'), 'single')
    left_bdr.set(qn('w:sz'), '18')
    left_bdr.set(qn('w:space'), '8')
    left_bdr.set(qn('w:color'), '0F4C81')
    pBdr.append(left_bdr)
    pPr.append(pBdr)
    return p


def add_table_from_md(doc, header_row: list, body_rows: list):
    cols = len(header_row)
    table = doc.add_table(rows=1 + len(body_rows), cols=cols)
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    # Header row
    hdr_cells = table.rows[0].cells
    for i, cell_text in enumerate(header_row):
        hdr_cells[i].text = ""
        p = hdr_cells[i].paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(cell_text.strip())
        run.bold = True
        run.font.size = Pt(10.5)
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        set_cell_shading(hdr_cells[i], '1E3A5F')
        set_cell_margins(hdr_cells[i])

    # Body rows
    for r_idx, row in enumerate(body_rows):
        cells = table.rows[r_idx + 1].cells
        bg_hex = 'F8FAFC' if r_idx % 2 == 1 else 'FFFFFF'
        for c_idx in range(cols):
            cell_text = row[c_idx].strip() if c_idx < len(row) else ""
            cells[c_idx].text = ""
            p = cells[c_idx].paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            add_formatted_runs(p, cell_text, base_color=COLOR_TEXT)
            for run in p.runs:
                if run.font.size is None:
                    run.font.size = Pt(10)
            set_cell_shading(cells[c_idx], bg_hex)
            set_cell_margins(cells[c_idx])
    return table


def parse_md_table(lines: list):
    if not lines or len(lines) < 2:
        return [], []
    header = [c.strip() for c in lines[0].strip().strip('|').split('|')]
    body = []
    for line in lines[2:]:
        if line.strip().startswith('|'):
            row = [c.strip() for c in line.strip().strip('|').split('|')]
            body.append(row)
    return header, body


def style_heading(doc, text: str, level: int):
    clean = re.sub(r'^#+\s*', '', text).strip()
    h = doc.add_heading(clean, level=min(level, 4))
    h.paragraph_format.space_before = Pt(14 if level == 1 else (11 if level == 2 else 8))
    h.paragraph_format.space_after = Pt(4)
    for run in h.runs:
        run.font.name = "Times New Roman"
        if level == 1:
            run.font.size = Pt(16)
            run.font.color.rgb = COLOR_PRIMARY
            run.bold = True
        elif level == 2:
            run.font.size = Pt(14)
            run.font.color.rgb = COLOR_PRIMARY
            run.bold = True
        elif level == 3:
            run.font.size = Pt(12.5)
            run.font.color.rgb = COLOR_ACCENT
            run.bold = True
        else:
            run.font.size = Pt(11.5)
            run.font.color.rgb = RGBColor(0x0F, 0x76, 0x6E)
            run.bold = True
    return h


def convert():
    md_text = MD_FILE.read_text(encoding="utf-8")
    # Fix literal \n in last table header separator if any
    md_text = md_text.replace("---|---|\n|", "---|---|\n|")
    lines = md_text.splitlines()

    doc = Document()

    for section in doc.sections:
        section.top_margin = Cm(2.0)
        section.bottom_margin = Cm(2.0)
        section.left_margin = Cm(2.2)
        section.right_margin = Cm(2.0)

    normal_style = doc.styles["Normal"]
    normal_style.font.name = "Times New Roman"
    normal_style.font.size = Pt(11.5)
    normal_style.font.color.rgb = COLOR_TEXT

    # Footer with page metadata
    footer = doc.sections[0].footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    frun = fp.add_run("STEM HUB (AI26B0012) — Tài liệu tra cứu mã nguồn & phản biện kỹ thuật BGK")
    frun.font.name = "Times New Roman"
    frun.font.size = Pt(9)
    frun.font.color.rgb = COLOR_MUTED

    i = 0
    in_code = False
    code_lines = []
    table_lines = []

    while i < len(lines):
        line = lines[i]

        # Code blocks
        if line.strip().startswith("```"):
            if not in_code:
                in_code = True
                code_lines = []
            else:
                in_code = False
                add_code_block(doc, code_lines)
            i += 1
            continue

        if in_code:
            code_lines.append(line)
            i += 1
            continue

        # Tables
        if line.strip().startswith("|"):
            table_lines.append(line)
            i += 1
            continue
        elif table_lines:
            header, body = parse_md_table(table_lines)
            if header:
                add_table_from_md(doc, header, body)
                doc.add_paragraph().paragraph_format.space_after = Pt(2)
            table_lines = []

        # Horizontal rules
        if re.match(r'^-{3,}$', line.strip()):
            p = doc.add_paragraph()
            pPr = p._p.get_or_add_pPr()
            pBdr = OxmlElement('w:pBdr')
            bottom = OxmlElement('w:bottom')
            bottom.set(qn('w:val'), 'single')
            bottom.set(qn('w:sz'), '6')
            bottom.set(qn('w:space'), '1')
            bottom.set(qn('w:color'), 'CBD5E1')
            pBdr.append(bottom)
            pPr.append(pBdr)
            i += 1
            continue

        # Headings levels 1..4
        heading_match = re.match(r'^(#{1,4})\s+(.+)$', line)
        if heading_match:
            level = len(heading_match.group(1))
            style_heading(doc, heading_match.group(2), level)
            i += 1
            continue

        # Blockquote
        if line.strip().startswith(">"):
            clean = line.strip().lstrip(">").strip()
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.3)
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(4)
            pPr = p._p.get_or_add_pPr()
            shd = OxmlElement('w:shd')
            shd.set(qn('w:val'), 'clear')
            shd.set(qn('w:color'), 'auto')
            shd.set(qn('w:fill'), 'EFF6FF')
            pPr.append(shd)
            add_formatted_runs(p, clean, base_italic=True, base_color=COLOR_MUTED)
            i += 1
            continue

        # Bullet list (with nesting support)
        bullet_match = re.match(r'^(\s*)[-*]\s+(.+)$', line)
        if bullet_match:
            indent_len = len(bullet_match.group(1))
            clean = bullet_match.group(2).strip()
            p = doc.add_paragraph(style="List Bullet")
            if indent_len >= 2:
                p.paragraph_format.left_indent = Inches(0.55)
            p.paragraph_format.space_after = Pt(3)
            add_formatted_runs(p, clean, base_color=COLOR_TEXT)
            i += 1
            continue

        # Numbered list
        num_match = re.match(r'^(\s*)\d+\.\s+(.+)$', line)
        if num_match:
            clean = num_match.group(2).strip()
            p = doc.add_paragraph(style="List Number")
            p.paragraph_format.space_after = Pt(3)
            add_formatted_runs(p, clean, base_color=COLOR_TEXT)
            i += 1
            continue

        if line.strip() == "":
            i += 1
            continue

        # Normal paragraph
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        add_formatted_runs(p, line.strip(), base_color=COLOR_TEXT)
        i += 1

    if table_lines:
        header, body = parse_md_table(table_lines)
        if header:
            add_table_from_md(doc, header, body)

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(OUT_FILE))
    print(f"✅ Đã tạo tệp Word thành công: {OUT_FILE} ({OUT_FILE.stat().st_size:,} bytes)")


if __name__ == "__main__":
    convert()

