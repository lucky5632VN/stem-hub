import re

file_path = 'docs/phieu-doi-chieu-nguon-chinh-thuc.md'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
math_de_url = "https://vietnamnet.vn/de-thi-mon-toan-thi-tot-nghiep-thpt-nam-2026-2524242.html"
math_da_url = "https://attachment.vnecdn.net/2026/06/19/Toa-n-pdf.pdf"

hoa_de_url = "https://vietnamnet.vn/de-thi-mon-hoa-hoc-thi-tot-nghiep-thpt-nam-2026-2524142.html"
hoa_da_url = "https://attachment.vnecdn.net/2026/06/19/Hoa-hoc-pdf.pdf"

ly_de_url = "https://vietnamnet.vn/de-thi-mon-vat-ly-thi-tot-nghiep-thpt-nam-2026-2524172.html"
ly_da_url = "https://attachment.vnecdn.net/2026/06/19/Vat-ly-pdf.pdf"

sinh_de_url = "https://vietnamnet.vn/de-thi-mon-sinh-hoc-thi-tot-nghiep-thpt-nam-2026-2524135.html"
sinh_da_url = "https://attachment.vnecdn.net/2026/06/19/Sinh-ho-c-pdf.pdf"

for line in lines:
    if line.strip().startswith('|') and not line.strip().startswith('| STT') and not line.strip().startswith('| :---:'):
        parts = [p.strip() for p in line.split('|')]
        if len(parts) >= 13:
            # parts[1]=STT, parts[2]=ID, parts[3]=Môn
            subject = parts[3].upper()
            if 'TOAN' in subject:
                source_cell = f"[Đề]({math_de_url}) \\| [Đáp án]({math_da_url})<br><small>Nguồn thứ cấp: Báo đăng lại đề & ĐA Bộ GD&ĐT (19/06/2026)</small>"
            elif 'HOA' in subject:
                source_cell = f"[Đề]({hoa_de_url}) \\| [Đáp án]({hoa_da_url})<br><small>Nguồn thứ cấp: Báo đăng lại đề & ĐA Bộ GD&ĐT (19/06/2026)</small>"
            elif 'LY' in subject:
                source_cell = f"[Đề]({ly_de_url}) \\| [Đáp án]({ly_da_url})<br><small>Nguồn thứ cấp: Báo đăng lại đề & ĐA Bộ GD&ĐT (19/06/2026)</small>"
            elif 'SINH' in subject:
                source_cell = f"[Đề]({sinh_de_url}) \\| [Đáp án]({sinh_da_url})<br><small>Nguồn thứ cấp: Báo đăng lại đề & ĐA Bộ GD&ĐT (19/06/2026)</small>"
            else:
                source_cell = parts[11]

            parts[11] = source_cell
            # Bắt buộc giữ checkbox trống [ ]
            parts[12] = "[ ]"
            new_line = " | ".join(parts) + "\n"
            new_lines.append(new_line)
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Updated docs/phieu-doi-chieu-nguon-chinh-thuc.md with dual URLs and secondary source classification.")

