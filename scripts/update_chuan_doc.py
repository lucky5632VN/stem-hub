# -*- coding: utf-8 -*-
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import shutil

FONT_NAME = 'Aptos'

def create_styled_paragraph(doc, text_runs, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=3, left_indent=0):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if left_indent:
        p.paragraph_format.left_indent = Inches(left_indent)
    
    for txt, is_bold, sz in text_runs:
        if txt:
            run = p.add_run(txt)
            run.font.name = FONT_NAME
            run.font.size = Pt(sz) if sz else Pt(13)
            run.bold = is_bold
    return p

def create_styled_table(doc, headers, data, col_widths=None, font_size=8.5, header_bg="EAECEF"):
    table = doc.add_table(rows=len(data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    # Header Row
    for col_idx, h_text in enumerate(headers):
        cell = table.cell(0, col_idx)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(h_text)
        r.font.name = FONT_NAME
        r.font.size = Pt(font_size + 0.5)
        r.bold = True
        cell._element.get_or_add_tcPr().append(parse_xml(r'<w:shd {} w:fill="{}"/>'.format(nsdecls('w'), header_bg)))

    # Data Rows
    for row_idx, row_vals in enumerate(data, start=1):
        for col_idx, val in enumerate(row_vals):
            cell = table.cell(row_idx, col_idx)
            p = cell.paragraphs[0]
            # Center if number/short text, Left if long text
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT if (col_idx == 0 or len(str(val)) > 20) else WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            r = p.add_run(str(val))
            r.font.name = FONT_NAME
            r.font.size = Pt(font_size)
            if col_idx == 0 and len(row_vals) <= 5:
                r.bold = True

    # Column widths
    if col_widths:
        for row in table.rows:
            for idx, w in enumerate(col_widths):
                row.cells[idx].width = Inches(w)

    # Borders
    for row in table.rows:
        for cell in row.cells:
            tcPr = cell._element.get_or_add_tcPr()
            borders = parse_xml(
                r'<w:tcBorders {}><w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>'
                r'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>'
                r'<w:left w:val="none"/><w:right w:val="none"/></w:tcBorders>'.format(nsdecls('w'))
            )
            tcPr.append(borders)

    return table

def update_document():
    doc = docx.Document('MẪU HỒ SƠ CẢI TIẾN CHẶNG 1 CHUẨN.docx')

    # Find anchor paragraphs
    p_res_22 = None # 2.2.2. Kết quả thực nghiệm và minh chứng:
    p_cm_text = None # - Ma trận nhầm lẫn:
    p_cm_img = None # Image 5 paragraph
    p_res_23 = None # 2.3.2. Kết quả thực nghiệm và minh chứng:
    p_img8 = None # Image 8 paragraph
    p_tbl2 = None # Table 2 (Bảng đối chứng giữa các tầng kiến trúc)
    p_img9 = None # Image 9 paragraph
    p_conclusion = None # - Kết luận thực nghiệm:

    for idx, p in enumerate(doc.paragraphs):
        t = p.text.strip()
        if '2.2.2. Kết quả thực nghiệm và minh chứng' in t:
            p_res_22 = p
        elif '- Ma trận nhầm lẫn:' in t:
            p_cm_text = p
            # The next paragraph with graphic is p_cm_img
            for nxt_p in doc.paragraphs[idx+1:idx+4]:
                if any('graphic' in r._element.xml for r in nxt_p.runs):
                    p_cm_img = nxt_p
                    break
        elif '2.3.2. Kết quả thực nghiệm và minh chứng' in t:
            p_res_23 = p
        elif '- Kết quả thực nghiệm khi tắt RAG Guard:' in t:
            for nxt_p in doc.paragraphs[idx+1:idx+4]:
                if any('graphic' in r._element.xml for r in nxt_p.runs):
                    p_img8 = nxt_p
                    break
        elif '- Kết luận thực nghiệm:' in t:
            p_conclusion = p
            # The paragraph before conclusion with graphic is p_img9
            for prev_p in reversed(doc.paragraphs[idx-5:idx]):
                if any('graphic' in r._element.xml for r in prev_p.runs):
                    p_img9 = prev_p
                    break

    print("Found anchors:")
    print("  p_res_22:", p_res_22.text if p_res_22 else "None")
    print("  p_cm_text:", p_cm_text.text if p_cm_text else "None")
    print("  p_cm_img found:", p_cm_img is not None)
    print("  p_res_23:", p_res_23.text if p_res_23 else "None")
    print("  p_img8 found:", p_img8 is not None)
    print("  p_img9 found:", p_img9 is not None)
    print("  p_conclusion:", p_conclusion.text[:40] if p_conclusion else "None")

    # -------------------------------------------------------------------------
    # 1. INSERT INTO SECTION 2.2.2 (LÀM RÕ ĐỘ TIN CẬY CÁC CHỈ SỐ CÔNG BỐ)
    # -------------------------------------------------------------------------
    # We will insert right after p_res_22:
    # Item A: Thống kê số mẫu & Tách biệt dữ liệu kiểm thử (Bảng cơ cấu + Bảng 4 mô hình)
    # Item B: Bộ kiểm thử có đáp án chuẩn (Bảng Ground Truth)
    # (Then comes existing p_cm_text + p_cm_img)
    # (After p_cm_img):
    # Item C: Bảng Ma trận 2x2 Có RAG
    # Item D: Báo cáo phân loại lỗi theo từng nhóm (Error Taxonomy)

    curr_elem = p_res_22._p

    # Bullet 1: Thống kê số mẫu
    p_b1 = create_styled_paragraph(doc, [
        ("- ", False, 13),
        ("Thống kê số mẫu & Tách biệt dữ liệu kiểm thử (Held-out Test Set Split): ", True, 13),
        ("Hệ thống xây dựng tập kiểm thử độc lập 150 ca chuẩn GDPT 2018 (Toán, Vật lý, Hóa học, Sinh học), phân bổ đồng đều giữa dạng bài lý thuyết định tính và bài tập định lượng số học, hoàn toàn tách biệt khỏi 303 chunk ngữ cảnh SGK:", False, 13)
    ], left_indent=0.25)
    curr_elem.addnext(p_b1._p)
    curr_elem = p_b1._p

    headers_samples = ["Môn học", "Số ca", "Tỷ lệ (%)", "Định tính / Khái niệm", "Định lượng / Số học", "Nguồn học liệu đối soát"]
    data_samples = [
        ["Toán học", "40 ca", "26.7%", "20 ca", "20 ca", "SGK Toán 10–12 & Đề tham khảo THPT 2026"],
        ["Vật lý", "38 ca", "25.3%", "22 ca", "16 ca", "SGK Vật lý 10–12 & Bài toán dao động, quang học"],
        ["Hóa học", "38 ca", "25.3%", "24 ca", "14 ca", "SGK Hóa học 10–12 & Phản ứng oxi hóa khử, liên kết"],
        ["Sinh học", "34 ca", "22.7%", "24 ca", "10 ca", "SGK Sinh học 10–12 & Di truyền học, phiên mã dịch mã"],
        ["Tổng cộng", "150 ca", "100.0%", "90 ca (60.0%)", "60 ca (40.0%)", "303 Chunk SGK GDPT 2018 (Độc lập, 0% rò rỉ)"]
    ]
    t_samp = create_styled_table(doc, headers_samples, data_samples, [1.0, 0.7, 0.8, 1.2, 1.2, 1.8], font_size=8.5)
    curr_elem.addnext(t_samp._tbl)
    curr_elem = t_samp._tbl

    # Sub-heading for split table
    p_split_title = create_styled_paragraph(doc, [
        ("• Bảng phân định tách biệt Tập Huấn Luyện vs Tập Kiểm Thử (4 Mô hình trong hệ thống):", True, 11)
    ], space_before=2, space_after=2)
    curr_elem.addnext(p_split_title._p)
    curr_elem = p_split_title._p

    headers_split = ["Mô hình", "Tập huấn luyện (Training Set)", "Tập kiểm thử (Held-out Test)", "Rò rỉ dữ liệu", "Kiểm định / Đo lường đối soát"]
    data_split = [
        ["Model 1: Rủi ro ChemLab", "180 mẫu sinh tự động", "50 ca (30 tổng hợp + 20 biên)", "0% (Tách biệt)", "McNemar p = 0.065 (Luật 94.0% vs NN 80.0%)"],
        ["Model 2: Lỗi Optics", "Định luật Snell giải tích", "45 ca (30 đơn biến + 15 đa biến)", "0% (Tách biệt)", "Đơn biến đạt 100%; Đa biến đạt 33.3% (báo cáo giới hạn)"],
        ["Model 3: Ý định Javit", "300 mẫu câu template", "65 câu hỏi thực tế của học sinh", "0% (Tách biệt)", "McNemar p = 0.0043 (Naive Bayes 90.8% vs Regex 21.5%)"],
        ["Model 4: STEM-RAG Guard", "Kho 303 chunk SGK GDPT 2018", "150 ca độc lập chuẩn GDPT 2018", "0% (Held-out)", "Cohen's κ = 0.7337; F1 = 96.09%; Accuracy = 93.33%"]
    ]
    t_split = create_styled_table(doc, headers_split, data_split, [1.3, 1.4, 1.4, 0.9, 1.7], font_size=8.5)
    curr_elem.addnext(t_split._tbl)
    curr_elem = t_split._tbl

    # Bullet 2: Bộ kiểm thử có đáp án chuẩn
    p_b2 = create_styled_paragraph(doc, [
        ("- ", False, 13),
        ("Bộ kiểm thử có đáp án chuẩn (Ground Truth Benchmark Samples): ", True, 13),
        ("Trích xuất các ca kiểm thử tiêu biểu kèm ĐÁP ÁN CHÍNH THỨC (Ground Truth), lời giải sư phạm và nguồn SGK / Đề thi tốt nghiệp THPT đối soát minh bạch (toàn bộ 150 ca lưu tại benchmark_150_cases.json và phieu_kiem_dap_an_toan_in_duoc.csv):", False, 13)
    ], left_indent=0.25, space_before=4)
    curr_elem.addnext(p_b2._p)
    curr_elem = p_b2._p

    headers_gt = ["Mã / Môn", "Chủ đề kiến thức", "Nội dung câu hỏi (Tóm tắt)", "Đáp án chuẩn (Ground Truth)", "Nguồn đối soát chuẩn"]
    data_gt = [
        ["CAND_MATH_01\n(Toán 12)", "Tích phân ứng dụng tính thể tích", "Tính thể tích hạt cườm elip x²/1.5² + y²/1² = 1 quay quanh Ox khoét lỗ trụ r=0.2cm.", "5,91 cm³ (V = 2π ∫[0 đến √2.16] (0.96 - x²/2.25)dx = 5.9100... Làm tròn 5,91)", "Đề thi tốt nghiệp THPT 2026 mã 0115 (Bộ GD&ĐT, 19/06/2026)"],
        ["BENCH_TOAN_01\n(Toán 12)", "Cực trị hàm số bậc ba", "Tìm tọa độ các điểm cực trị của đồ thị hàm số y = x³ - 3x² + 2.", "y' = 3x² - 6x = 0 ⇔ x = 0 hoặc x = 2. Cực đại A(0; 2), cực tiểu B(2; -2).", "SGK Toán 12 Tập 1, Chương I, Bài 2, Tr. 13–17"],
        ["BENCH_LY_01\n(Vật lý 12)", "Chu kỳ con lắc lò xo", "Viết công thức chu kỳ con lắc lò xo độ cứng k, vật m. Chu kỳ có phụ thuộc biên độ A?", "T = 2π√(m/k). Chu kỳ chỉ phụ thuộc m và k, hoàn toàn không phụ thuộc biên độ A.", "SGK Vật lý 12, Chương I: Dao động cơ, Bài 2, Tr. 9–13"],
        ["BENCH_LY_15\n(Vật lý 12)", "Con lắc đơn góc lớn (Cạm bẫy)", "Thả con lắc đơn l=1m từ góc α₀ = 60°. Tính vận tốc cực đại qua VTCB (g=9.8 m/s²).", "v_max = √(2gl(1 - cosα₀)) = √(gl) ≈ 3.13 m/s. (Bẫy: α₀ > 10°, không dùng công thức góc nhỏ)", "SGK Vật lý 12, Chương I: Dao động cơ, Bài 3, Tr. 26–29"],
        ["BENCH_HOA_03\n(Hóa học 10)", "Liên kết ion và cộng hóa trị", "Phân biệt liên kết trong NaCl và HCl dựa vào hiệu độ âm điện Δχ.", "NaCl: Δχ ≥ 1.7 (liên kết ion hút tĩnh điện). HCl: 0.4 ≤ Δχ < 1.7 (cộng hóa trị có cực).", "SGK Hóa học 10, Chương III: Liên kết hóa học, Bài 9–10, Tr. 48–56"],
        ["BENCH_HOA_12\n(Hóa học 10)", "Cân bằng oxi hóa khử", "Cân bằng phản ứng FeO + HNO₃ → Fe(NO₃)₃ + NO↑ + H₂O bằng thăng bằng e.", "3FeO + 10HNO₃ → 3Fe(NO₃)₃ + NO↑ + 5H₂O. Quá trình: 3×(Fe²⁺→Fe³⁺+1e); 1×(N⁵⁺+3e→N²⁺).", "SGK Hóa học 10, Chương IV: Phản ứng oxi hóa khử, Bài 12, Tr. 72–78"],
        ["BENCH_SINH_01\n(Sinh học 12)", "Mã di truyền & dịch mã", "Nêu bộ ba mở đầu và các bộ ba kết thúc trong phân tử mARN mã hóa axit amin nào?", "Mở đầu: 5'-AUG-3' (mã hóa Met ở nhân thực / fMet ở nhân sơ). Kết thúc: UAA, UAG, UGA.", "SGK Sinh học 12, Chương I: Di truyền học, Bài 2, Tr. 10–15"]
    ]
    t_gt = create_styled_table(doc, headers_gt, data_gt, [1.1, 1.2, 1.6, 1.6, 1.2], font_size=8.5)
    curr_elem.addnext(t_gt._tbl)
    curr_elem = t_gt._tbl

    # Empty separator paragraph
    p_sep1 = create_styled_paragraph(doc, [("", False, 11)], space_after=2)
    curr_elem.addnext(p_sep1._p)

    # -------------------------------------------------------------------------
    # Now after p_cm_img (Ma trận nhầm lẫn ảnh 5):
    # Insert Ma trận 2x2 table & Báo cáo phân loại lỗi theo từng nhóm
    # -------------------------------------------------------------------------
    curr_elem2 = p_cm_img._p

    # Title for 2x2 grid
    p_grid_title = create_styled_paragraph(doc, [
        ("• Phân bố Ma trận 2x2 khi CÓ RAG (STEM-RAG Guard — TP=123, FN=5, FP=5, TN=17):", True, 11)
    ], space_before=3, space_after=2)
    curr_elem2.addnext(p_grid_title._p)
    curr_elem2 = p_grid_title._p

    grid_rag_headers = ["Ground Truth \\ AI Dự Đoán", "AI: ĐẠT (Positive)", "AI: CHƯA ĐẠT (Negative)", "Tổng Hàng (SGK)"]
    grid_rag_data = [
        ["ĐẠT (Positive)", "TP = 123 (Đồng thuận Đạt)", "FN = 5 (AI từ chối thừa)", "128 ca"],
        ["CHƯA ĐẠT (Negative)", "FP = 5 (AI ảo tưởng / Sót lỗi)", "TN = 17 (Đồng thuận bắt lỗi)", "22 ca"]
    ]
    t_grid = create_styled_table(doc, grid_rag_headers, grid_rag_data, [1.7, 1.8, 1.8, 1.4], font_size=9)
    curr_elem2.addnext(t_grid._tbl)
    curr_elem2 = t_grid._tbl

    # Bullet: Báo cáo phân loại lỗi
    p_b_err = create_styled_paragraph(doc, [
        ("- ", False, 13),
        ("Báo cáo phân loại lỗi chi tiết theo từng nhóm (Error Taxonomy): ", True, 13),
        ("Bóc tách toàn diện các trường hợp sai lệch của hệ thống trên tập 150 ca kiểm thử:", False, 13)
    ], left_indent=0.25, space_before=4)
    curr_elem2.addnext(p_b_err._p)
    curr_elem2 = p_b_err._p

    headers_err = ["Phân nhóm lỗi", "Có RAG", "Không RAG", "Đặc điểm bản chất lỗi", "Ví dụ thực tế & Cơ chế khắc phục"]
    data_err = [
        ["False Positive (FP)\nẢo tưởng / Sót bẫy", "5 ca\n(3.3%)", "11 ca\n(7.3%)", "Mô hình kết luận Đạt nhưng thực tế sót bẫy điều kiện bài toán hoặc nhầm số học.", "Con lắc đơn góc lớn α₀=60°: Không RAG sót bẫy tính nhầm. Có RAG triệt tiêu 6/11 ca bẫy (54.5%), còn 5 ca biên đa tầng."],
        ["False Negative (FN)\nTừ chối thừa", "5 ca\n(3.3%)", "14 ca\n(9.3%)", "Câu hỏi đúng trọng tâm nhưng bộ lọc quá thận trọng xếp vào diện nghi ngờ.", "Học sinh dùng từ ngữ đồng nghĩa hoặc teencode ('pt', 'k/cách') ngoài ngữ cảnh chunk. Khắc phục: nâng cấp module từ đồng nghĩa."],
        ["True Negative (TN)\nBắt bẫy an toàn", "17 ca\n(11.3%)", "11 ca\n(7.3%)", "Hệ thống phát hiện chính xác câu hỏi cạm bẫy kiến thức hoặc ngoài phạm vi STEM.", "Độ đặc hiệu (Specificity) tăng từ 50.0% lên 77.27% (+27.27%). Từ chối an toàn các câu hỏi ngoài lề và ngụy biện số liệu."]
    ]
    t_err = create_styled_table(doc, headers_err, data_err, [1.3, 0.7, 0.7, 1.8, 2.2], font_size=8.5)
    curr_elem2.addnext(t_err._tbl)
    curr_elem2 = t_err._tbl

    p_sep2 = create_styled_paragraph(doc, [("", False, 11)], space_after=3)
    curr_elem2.addnext(p_sep2._p)

    # -------------------------------------------------------------------------
    # 2. INSERT INTO SECTION 2.3.2 (ĐO ĐÓNG GÓP RIÊNG CỦA AI VÀ RAG)
    # -------------------------------------------------------------------------
    # We will insert:
    # After p_img8 (Image 8: Tắt RAG):
    # - Bảng đối chứng về Đúng/Sai, Thời gian (Latency) và Lỗi (Trọng tâm Yêu cầu 3)
    # - Bảng 8 chỉ số hiệu năng trên 150 ca
    # After p_img9 (Image 9: Phân tích tổng hợp, before p_conclusion):
    # - Các ví dụ đối chứng cụ thể có ý nghĩa sư phạm (4 ví dụ)

    curr_elem3 = p_img8._p

    # Bullet: Bảng đối chứng Đúng/Sai, Thời gian và Lỗi
    p_b_comp = create_styled_paragraph(doc, [
        ("- ", False, 13),
        ("Bảng đối chứng về Đúng/Sai, Thời gian (Latency) và Lỗi giữa 3 kiến trúc xử lý (Trọng tâm Yêu cầu 3): ", True, 13),
        ("So sánh trực diện trên cùng tập kiểm thử giữa Hệ quy tắc xác định (Rule-based), AI thuần túy (Base LLM - Không RAG) và Hệ thống đa tầng (STEM-RAG Guard):", False, 13)
    ], left_indent=0.25, space_before=4)
    curr_elem3.addnext(p_b_comp._p)
    curr_elem3 = p_b_comp._p

    headers_comp = ["Tiêu chí đối chứng", "Hệ quy tắc xác định\n(Rule-based)", "AI thuần túy\n(Base LLM - Không RAG)", "Hệ thống đa tầng\n(STEM-RAG Guard)", "Đánh giá & Kết luận khoa học"]
    data_comp = [
        ["Tỷ lệ Đúng / Sai tổng thể (Accuracy)", "69.23% (câu hỏi mở)\n> 95% (bài toán cấu trúc)", "83.33%\n[76.55% – 88.45%]", "93.33%\n[88.16% – 96.34%]", "STEM-RAG vượt trội +10.0% so với Base LLM và toàn diện hơn hệ luật."],
        ["Đúng đáp án cuối cùng (Exact Answer)", "> 95% (khi đúng mẫu cú pháp)\n0% (khi sai lệch từ khóa)", "61.33%\n(92/150 ca)", "96.67%\n(145/150 ca)", "RAG tăng vọt +35.34% độ đúng đáp số, khắc phục triệt để điểm yếu số học của LLM."],
        ["Đúng lập luận sư phạm GDPT 2018", "Kém (chỉ xuất đáp số khô khan,\nkhông có lời giảng)", "74.00%\n(111/150 ca)", "88.67%\n(133/150 ca)", "RAG tăng +14.67% năng lực dẫn dắt Socratic và đúng phương pháp sư phạm."],
        ["Thời gian phản hồi (Latency trung bình)", "Cực thấp (< 5 ms)\nTính toán tức thời", "800 ms – 1.500 ms\n(Trung bình ~1.150 ms)", "1.200 ms – 2.200 ms\n(Trung bình ~1.850 ms)", "Quy tắc nhanh nhất; RAG chấp nhận thêm ~700ms để đối soát ngữ cảnh SGK."],
        ["Phân loại lỗi thường gặp (Typical Errors)", "Lỗi cú pháp (Syntax failure):\nGãy đổ hoàn toàn khi gặp teencode, từ đồng nghĩa hoặc câu hỏi văn tự do.", "Lỗi ảo giác (Hallucination):\nBịa số liệu, nhầm lẫn công thức góc lớn/nhỏ, nhầm hệ số phản ứng oxi hóa khử.", "Lỗi từ chối thừa (Conservative):\nBộ lọc quá thận trọng khi câu hỏi dùng từ ngữ mới chưa có trong chunk SGK.", "Hệ thống kết hợp định tuyến Rule-based cho công thức và RAG Guard cho bài toán mở."]
    ]
    t_comp = create_styled_table(doc, headers_comp, data_comp, [1.3, 1.3, 1.3, 1.3, 1.5], font_size=8.5)
    curr_elem3.addnext(t_comp._tbl)
    curr_elem3 = t_comp._tbl

    # Bảng 8 chỉ số hiệu năng trên 150 ca
    p_150_title = create_styled_paragraph(doc, [
        ("• Bảng so sánh đối đầu trực diện 8 chỉ số hiệu năng 2 mô hình trên 150 ca:", True, 11)
    ], space_before=3, space_after=2)
    curr_elem3.addnext(p_150_title._p)
    curr_elem3 = p_150_title._p

    headers_150 = ["Chỉ số đánh giá", "Mô hình 1: Base (No-RAG)", "Mô hình 2: STEM-RAG Guard", "Chênh lệch cải tiến (Δ)", "Ý nghĩa GDPT 2018"]
    data_150 = [
        ["Độ chính xác (Accuracy)", "83.33%\n[76.55% – 88.45%]", "93.33%\n[88.16% – 96.34%]", "+10.00%", "Tỷ lệ đồng thuận chung với chuẩn kiến thức SGK"],
        ["Độ chuẩn xác (Precision)", "91.2%", "96.09%", "+4.89%", "Giảm thiểu tối đa ảo tưởng kiến thức (Hallucination)"],
        ["Độ nhạy / Thu hồi (Recall)", "89.06%", "96.09%", "+7.03%", "Không từ chối nhầm câu hỏi chính đáng của học sinh"],
        ["Độ đặc hiệu (Specificity)", "50%", "77.27%", "+27.27%", "Năng lực phát hiện cạm bẫy và từ chối an toàn"],
        ["F1-Score", "90.12%\n(Đạt: 90.12% / Chưa: 46.81%)", "96.09%\n(Đạt: 96.09% / Chưa: 77.27%)", "+5.97%\n(+30.46% ở lớp bắt bẫy)", "Cân bằng hài hòa giữa độ chuẩn xác và độ bao quát"],
        ["Cohen's Kappa (κ)", "0.3697", "0.7337", "+0.3640", "Đồng thuận thực chất loại trừ yếu tố may rủi ngẫu nhiên"],
        ["Đúng Đáp án cuối cùng", "61.33% (92/150)", "96.67% (145/150)", "+35.34%", "Đúng kết quả số học, công thức hoặc phương án A/B/C/D"],
        ["Đúng Trình bày logic", "74% (111/150)", "88.67% (133/150)", "+14.67%", "Mạch lạc, suy luận sư phạm, không giải hộ từ A đến Z"]
    ]
    t_150 = create_styled_table(doc, headers_150, data_150, [1.4, 1.3, 1.4, 1.1, 1.5], font_size=8.5)
    curr_elem3.addnext(t_150._tbl)
    curr_elem3 = t_150._tbl

    p_sep3 = create_styled_paragraph(doc, [("", False, 11)], space_after=3)
    curr_elem3.addnext(p_sep3._p)

    # -------------------------------------------------------------------------
    # After p_img9 (Image 9: Phân tích tổng hợp, right before p_conclusion):
    # Insert 4 pedagogical case studies
    # -------------------------------------------------------------------------
    curr_elem4 = p_img9._p

    p_b_cases = create_styled_paragraph(doc, [
        ("- ", False, 13),
        ("Các ví dụ đối chứng cụ thể có ý nghĩa sư phạm (Pedagogical Case Studies): ", True, 13),
        ("Phân tích 4 trường hợp điển hình đại diện cho 4 môn học và các tình huống sư phạm thực tế:", False, 13)
    ], left_indent=0.25, space_before=4)
    curr_elem4.addnext(p_b_cases._p)
    curr_elem4 = p_b_cases._p

    headers_cases = ["Môn học & Tình huống", "Hệ quy tắc xác định (Rule-based)", "AI thuần túy (Không RAG - Base)", "Hệ thống đa tầng (STEM-RAG Guard)"]
    data_cases = [
        ["TOÁN HỌC\nTính thể tích hạt cườm elip xoay quanh Ox khoét trụ r=0.2cm\n(CAND_MATH_01)",
         "Chỉ tính được nếu người dùng nhập đúng dạng phương trình giải tích; thất bại hoàn toàn (0%) nếu học sinh hỏi bằng văn tự do.",
         "Hiểu đề bài, thiết lập công thức tích phân nhưng tính toán sai số học trung gian, đưa ra đáp án 5,42 cm³ (Sai so với Ground Truth 5,91 cm³).",
         "Truy xuất chunk toan-12-228, thiết lập đúng tích phân V = 2π ∫[0 đến √2.16] (0.96 - x²/2.25)dx = 5.91 cm³. Hướng dẫn từng bước tìm cận và khoét lỗ trụ."],
        ["HÓA HỌC\nCân bằng phản ứng oxi hóa khử:\nFeO + HNO₃ loãng\n(BENCH_HOA_12)",
         "Thuật toán ma trận tìm được hệ số 3:10:3:1:5 trong 2 ms nhưng không thể giải thích bản chất vì sao Fe²⁺ nhường 1e hay quy tắc thăng bằng e.",
         "Dễ nhầm sản phẩm khử sang NO₂ hoặc tính sai hệ số môi trường HNO₃; không chỉ rõ số oxi hóa thay đổi của từng nguyên tố.",
         "Truy xuất SGK Hóa 10 Chương IV: Phân tích 3×(Fe²⁺→Fe³⁺+1e) và 1×(N⁵⁺+3e→N²⁺), cân bằng đúng 3:10:3:1:5, hướng dẫn học sinh phương pháp thăng bằng electron."],
        ["VẬT LÝ\nCon lắc đơn góc lớn α₀ = 60°\n(Cạm bẫy vật lý kinh điển)\n(BENCH_LY_15)",
         "Nếu lập trình luật cứng theo dao động điều hòa sẽ áp dụng sai công thức v = ωA, dẫn đến kết quả sai hoàn toàn về mặt vật lý.",
         "Mắc bẫy kinh điển: Áp dụng nhầm công thức góc nhỏ v_max = α₀√(gl), tính ra kết quả sai lệch nghiêm trọng và bỏ qua điều kiện bảo toàn cơ năng.",
         "Phát hiện ngay α₀ = 60° > 10° (không phải dao động điều hòa góc nhỏ), truy xuất SGK Vật lý 12 về bảo toàn cơ năng: v = √(2gl(1-cosα₀)) = √(gl) ≈ 3.13 m/s, cảnh báo học sinh."],
        ["NGOÀI PHẠM VI\nCâu hỏi ngoài STEM:\n'Thời tiết hôm nay thế nào?' hoặc 'Kể chuyện lịch sử'",
         "Báo lỗi cú pháp không nhận diện được biến số toán lý hóa.",
         "Trả lời tự do lan man ngoài lề, làm phân tán sự tập trung học tập của học sinh trong giờ học STEM.",
         "Kích hoạt Strict Grounding Abstention: Phát cảnh báo 'Không tìm thấy căn cứ trong SGK chuẩn GDPT 2018', từ chối trả lời lan man và hướng dẫn quay lại bài học."]
    ]
    t_cases = create_styled_table(doc, headers_cases, data_cases, [1.4, 1.7, 1.8, 1.8], font_size=8.5)
    curr_elem4.addnext(t_cases._tbl)
    curr_elem4 = t_cases._tbl

    p_sep4 = create_styled_paragraph(doc, [("", False, 11)], space_after=3)
    curr_elem4.addnext(p_sep4._p)

    # Save output
    output_path = 'MẪU HỒ SƠ CẢI TIẾN CHẶNG 1 CHUẨN.docx'
    doc.save(output_path)
    print(f"Successfully updated '{output_path}' while preserving all user edits!")

if __name__ == '__main__':
    update_document()

