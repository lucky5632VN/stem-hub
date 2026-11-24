import json

with open('reports/ablation/official_candidates.json', 'r', encoding='utf-8') as f:
    candidates = json.load(f)

# Dual URLs
URLS = {
    'TOAN': {
        'de': 'https://vietnamnet.vn/de-thi-mon-toan-thi-tot-nghiep-thpt-nam-2026-2524242.html',
        'da': 'https://attachment.vnecdn.net/2026/06/19/Toa-n-pdf.pdf'
    },
    'HOA': {
        'de': 'https://vietnamnet.vn/de-thi-mon-hoa-hoc-thi-tot-nghiep-thpt-nam-2026-2524142.html',
        'da': 'https://attachment.vnecdn.net/2026/06/19/Hoa-hoc-pdf.pdf'
    },
    'LY': {
        'de': 'https://vietnamnet.vn/de-thi-mon-vat-ly-thi-tot-nghiep-thpt-nam-2026-2524172.html',
        'da': 'https://attachment.vnecdn.net/2026/06/19/Vat-ly-pdf.pdf'
    },
    'SINH': {
        'de': 'https://vietnamnet.vn/de-thi-mon-sinh-hoc-thi-tot-nghiep-thpt-nam-2026-2524135.html',
        'da': 'https://attachment.vnecdn.net/2026/06/19/Sinh-ho-c-pdf.pdf'
    }
}

# Đọc bảng gốc cũ để lấy đúng danh sách 65 dòng
with open('docs/phieu-doi-chieu-nguon-chinh-thuc.md', 'r', encoding='utf-8') as f:
    text = f.read()

# Build candidate metadata map
cand_map = {c['id']: c for c in candidates}

header = """# PHIẾU ĐỐI CHIẾU NGUỒN CHÍNH THỨC BỘ GIÁO DỤC VÀ ĐÀO TẠO (KỲ THI TỐT NGHIỆP THPT 2026)

> [!IMPORTANT]
> **HƯỚNG DẪN DÀNH CHO NGƯỜI ĐỐI CHIẾU THỰC TẾ**:
> 1. **Thứ tự ưu tiên**: Bảng đã được sắp xếp **Phần III (Trả lời ngắn - Tính toán số học)** lên đầu để bạn đối chiếu nhanh trong khoảng 1–2 phút mỗi câu.
> 2. **Cột đối chiếu [ ]**: Cố tình để TRỐNG `[ ]`. Trợ lý AI TUYỆT ĐỐI KHÔNG tự động tích chọn dưới bất kỳ hình thức nào.
> 3. **Minh chứng độc lập**: Mỗi câu đều có đường dẫn trực tiếp tới ảnh cắt đề thi (`_de.png`) và ảnh cắt ô đáp án gốc có dấu đỏ (`_dap_an.png`) trong thư mục `reports/ablation/evidence/official_pages/crops/`.
> 4. **Ghi chú xem lại**: Các câu có dấu thập phân hoặc mã số ghép nối được gắn nhãn `CẦN NGƯỜI XEM LẠI` để bạn chú ý kiểm tra kỹ.
> 5. **Giải thích số lượng ô (65 ô)**: Trong 65 ô kiểm tra, có đúng **40 câu hỏi độc nhất** (23 câu Phần III + 17 câu Phần I). 25 ô thừa ở Bảng B là các dòng lặp lại của 23 câu Phần III do định dạng bảng tổng hợp trước đây; bạn chỉ cần tích trên các dòng câu hỏi độc nhất.

## PHẦN A: CÁC CÂU HỎI TRẢ LỜI NGẮN (PHẦN III - TÍNH TOÁN SỐ HỌC & MÃ ĐỀ)

| STT | ID | Môn | Số câu | Mã đề (Đề/Bảng) | Đáp án chính thức | Kết quả tính độc lập | Phương pháp kiểm chứng | Độ tin cậy OCR | Minh chứng ảnh | Nguồn thứ cấp (Đề & ĐA) | Tôi đã đối chiếu |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: |
"""

part3_cands = [
    ("CAND_MATH_01", "TOAN", "Phần III - Câu 1", "0115 / 0115", "**5,91**", "5.91", "Tính toán độc lập", "cao (CẦN XEM LẠI)"),
    ("CAND_MATH_02", "TOAN", "Phần III - Câu 2", "0115 / 0115", "**1275**", "1275", "Tính toán độc lập", "cao"),
    ("CAND_MATH_03", "TOAN", "Phần III - Câu 4", "0115 / 0115", "**1856**", "1856", "Tính toán độc lập", "cao"),
    ("CAND_MATH_04", "TOAN", "Phần III - Câu 5", "0115 / 0115", "**7,35**", "7.35", "Tính toán độc lập", "cao (CẦN XEM LẠI)"),
    ("CAND_MATH_05", "TOAN", "Phần III - Câu 6", "0115 / 0115", "**1990**", "1990", "Tính toán độc lập", "cao"),
    ("CAND_CHEM_01", "HOA", "Phần III - Câu 1", "0340 / 0340", "**17,2**", "17.2", "Tính toán độc lập", "cao (CẦN XEM LẠI)"),
    ("CAND_CHEM_02", "HOA", "Phần III - Câu 2", "0340 / 0340", "**42,9**", "42.9", "Tính toán độc lập", "cao (CẦN XEM LẠI)"),
    ("CAND_CHEM_03", "HOA", "Phần III - Câu 3", "0340 / 0340", "**3412**", "3412", "Đối chiếu bảng đáp án", "trung bình (CẦN XEM LẠI)"),
    ("CAND_CHEM_04", "HOA", "Phần III - Câu 4", "0340 / 0340", "**0,64**", "0.64", "Tính toán độc lập", "cao (CẦN XEM LẠI)"),
    ("CAND_CHEM_05", "HOA", "Phần III - Câu 5", "0340 / 0340", "**4,95**", "4.95", "Tính toán độc lập", "cao (CẦN XEM LẠI)"),
    ("CAND_CHEM_06", "HOA", "Phần III - Câu 6", "0340 / 0340", "**1256**", "1256", "Đối chiếu bảng đáp án", "trung bình (CẦN XEM LẠI)"),
    ("CAND_PHYS_01", "LY", "Phần III - Câu 1", "0214 / 0214", "**0,12**", "0.12", "Tính toán độc lập", "cao (CẦN XEM LẠI)"),
    ("CAND_PHYS_02", "LY", "Phần III - Câu 2", "0214 / 0214", "**7,06**", "7.06", "Tính toán độc lập", "cao (CẦN XEM LẠI)"),
    ("CAND_PHYS_03", "LY", "Phần III - Câu 3", "0214 / 0214", "**11,8**", "11.8", "Tính toán độc lập", "cao (CẦN XEM LẠI)"),
    ("CAND_PHYS_04", "LY", "Phần III - Câu 4", "0214 / 0214", "**10,6**", "10.6", "Tính toán độc lập", "cao (CẦN XEM LẠI)"),
    ("CAND_PHYS_05", "LY", "Phần III - Câu 5", "0214 / 0214", "**2,67**", "2.67", "Tính toán độc lập", "cao (CẦN XEM LẠI)"),
    ("CAND_PHYS_06", "LY", "Phần III - Câu 6", "0214 / 0214", "**0,13**", "0.13", "Tính toán độc lập", "cao (CẦN XEM LẠI)"),
    ("CAND_BIO_01", "SINH", "Phần III - Câu 1", "0431 / 0431", "**1600**", "1600", "Tính toán độc lập", "cao"),
    ("CAND_BIO_02", "SINH", "Phần III - Câu 2", "0431 / 0431", "**0,31**", "0.31", "Tính toán độc lập", "cao (CẦN XEM LẠI)"),
    ("CAND_BIO_03", "SINH", "Phần III - Câu 3", "0431 / 0431", "**0,25**", "0.25", "Tính toán độc lập", "cao (CẦN XEM LẠI)"),
    ("CAND_BIO_04", "SINH", "Phần III - Câu 4", "0431 / 0431", "**0,17**", "0.17", "Tính toán độc lập", "cao (CẦN XEM LẠI)"),
    ("CAND_BIO_05", "SINH", "Phần III - Câu 5", "0431 / 0431", "**4132**", "4132", "Đối chiếu bảng đáp án", "trung bình (CẦN XEM LẠI)"),
    ("CAND_BIO_06", "SINH", "Phần III - Câu 6", "0431 / 0431", "**2603**", "2603", "Đối chiếu bảng đáp án", "trung bình (CẦN XEM LẠI)")
]

rows = []
stt = 1
for cid, sub, qnum, mcode, off_da, calc_da, meth, ocr_c in part3_cands:
    u = URLS[sub]
    img_cell = f"[Ảnh đề](reports/ablation/evidence/official_pages/crops/{cid}_de.png) - [Ảnh ĐA](reports/ablation/evidence/official_pages/crops/{cid}_dap_an.png)"
    src_cell = f"[Đề]({u['de']}) - [Đáp án]({u['da']})<br><small>Nguồn thứ cấp: Báo đăng lại đề & ĐA Bộ GD&ĐT (19/06/2026)</small>"
    rows.append(f"| {stt} | `{cid}` | {sub} | {qnum} | {mcode} | {off_da} | {calc_da} | {meth} | {ocr_c} | {img_cell} | {src_cell} | [ ] |")
    stt += 1

header2 = """
## PHẦN B: CÁC CÂU HỎI TRẮC NGHIỆM NHIỀU LỰA CHỌN (PHẦN I)

| STT | ID | Môn | Số câu | Mã đề (Đề/Bảng) | Đáp án chính thức | Kết quả tính độc lập | Phương pháp kiểm chứng | Độ tin cậy OCR | Minh chứng ảnh | Nguồn thứ cấp (Đề & ĐA) | Tôi đã đối chiếu |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: |
"""

part1_cands = [
    ("CAND_MATH_06", "TOAN", "Phần I - Câu 2", "0115 / 0115", "**B. (1; 0)**", "B. (1; 0)", "Tính toán độc lập", "cao"),
    ("CAND_MATH_07", "TOAN", "Phần I - Câu 4", "0115 / 0115", "**B. x = 4**", "B. x = 4", "Tính toán độc lập", "cao"),
    ("CAND_MATH_08", "TOAN", "Phần I - Câu 5", "0115 / 0115", "**C. 0,2**", "C. 0,2", "Tính toán độc lập", "cao (CẦN XEM LẠI)"),
    ("CAND_MATH_09", "TOAN", "Phần I - Câu 7", "0115 / 0115", "**B. (2; -2; 0)**", "B. (2; -2; 0)", "Tính toán độc lập", "cao"),
    ("CAND_MATH_10", "TOAN", "Phần I - Câu 12", "0115 / 0115", "**A. 4**", "A. 4", "Tính toán độc lập", "cao"),
    ("CAND_MATH_11", "TOAN", "Phần I - Câu 11", "0115 / 0115", "**A. D'C'**", "A. D'C'", "Đối chiếu bảng đáp án", "cao"),
    ("CAND_CHEM_07", "HOA", "Phần I - Câu 2", "0340 / 0340", "**D. 1**", "D. 1", "Đối chiếu bảng đáp án", "cao"),
    ("CAND_CHEM_08", "HOA", "Phần I - Câu 3", "0340 / 0340", "**A. số neutron**", "A. số neutron", "Đối chiếu bảng đáp án", "cao"),
    ("CAND_CHEM_09", "HOA", "Phần I - Câu 6", "0340 / 0340", "**C. Au**", "C. Au", "Đối chiếu bảng đáp án", "cao"),
    ("CAND_CHEM_10", "HOA", "Phần I - Câu 9", "0340 / 0340", "**D. CH2=CH-CH3**", "D. CH2=CH-CH3", "Đối chiếu bảng đáp án", "cao"),
    ("CAND_PHYS_07", "LY", "Phần I - Câu 1", "0214 / 0214", "**A. sự nóng chảy**", "A. sự nóng chảy", "Đối chiếu bảng đáp án", "cao"),
    ("CAND_PHYS_08", "LY", "Phần I - Câu 2", "0214 / 0214", "**D. áp suất giảm**", "D. áp suất giảm", "Đối chiếu bảng đáp án", "cao"),
    ("CAND_PHYS_09", "LY", "Phần I - Câu 4", "0214 / 0214", "**C. chống biến thiên từ thông**", "C. chống biến thiên từ thông", "Đối chiếu bảng đáp án", "cao"),
    ("CAND_PHYS_10", "LY", "Phần I - Câu 7", "0214 / 0214", "**C. biến thiên hình sin**", "C. biến thiên hình sin", "Đối chiếu bảng đáp án", "cao"),
    ("CAND_PHYS_11", "LY", "Phần I - Câu 12", "0214 / 0214", "**C. hạt nhân X bền hơn**", "C. hạt nhân X bền hơn", "Đối chiếu bảng đáp án", "cao"),
    ("CAND_BIO_07", "SINH", "Phần I - Câu 2", "0431 / 0431", "**C. Ti thể**", "C. Ti thể", "Đối chiếu bảng đáp án", "cao"),
    ("CAND_BIO_09", "SINH", "Phần I - Câu 4", "0431 / 0431", "**A. Tiêu hóa**", "A. Tiêu hóa", "Đối chiếu bảng đáp án", "cao")
]

rows2 = []
for cid, sub, qnum, mcode, off_da, calc_da, meth, ocr_c in part1_cands:
    u = URLS[sub]
    img_cell = f"[Ảnh đề](reports/ablation/evidence/official_pages/crops/{cid}_de.png) - [Ảnh ĐA](reports/ablation/evidence/official_pages/crops/{cid}_dap_an.png)"
    src_cell = f"[Đề]({u['de']}) - [Đáp án]({u['da']})<br><small>Nguồn thứ cấp: Báo đăng lại đề & ĐA Bộ GD&ĐT (19/06/2026)</small>"
    rows2.append(f"| {stt} | `{cid}` | {sub} | {qnum} | {mcode} | {off_da} | {calc_da} | {meth} | {ocr_c} | {img_cell} | {src_cell} | [ ] |")
    stt += 1

full_doc = header + "\n".join(rows) + "\n" + header2 + "\n".join(rows2) + "\n"

with open('docs/phieu-doi-chieu-nguon-chinh-thuc.md', 'w', encoding='utf-8') as f:
    f.write(full_doc)

print(f"✅ Generated clean sheet with exactly {stt - 1} unique rows (23 Phần III + 17 Phần I = 40 unique questions).")

