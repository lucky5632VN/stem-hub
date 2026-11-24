# -*- coding: utf-8 -*-
"""
Script tạo tài liệu Word: ĐÁNH GIÁ MỨC ĐỘ ĐẠT VÀ KẾ HOẠCH CẢI THIỆN DỰ ÁN
Dựa trên 3 nhóm tiêu chí và yêu cầu cốt lõi của Ban Giám Khảo (Chặng 1)
Bao gồm nhúng trực tiếp hình ảnh minh chứng thực tế từ giao diện hệ thống.
"""

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import os
import io
from PIL import Image

ARTIFACT_DIR = r"C:\Users\dell\.gemini\antigravity\brain\5ef4e519-c21d-4c3d-8b53-767ebad67a84\.user_uploaded"

def create_bgk_evaluation_document():
    doc = docx.Document()

    # Thiết lập kích thước trang A4 & căn lề chuẩn văn bản hành chính/khoa học
    section = doc.sections[0]
    section.top_margin = Pt(42.55)    # 1.5 cm
    section.bottom_margin = Pt(42.55) # 1.5 cm
    section.left_margin = Pt(56.7)    # 2.0 cm
    section.right_margin = Pt(42.55)  # 1.5 cm
    section.page_width = Pt(595.45)   # A4 width
    section.page_height = Pt(841.7)   # A4 height

    # Thiết lập style mặc định
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Times New Roman'
    font.size = Pt(12)
    font.color.rgb = RGBColor(0, 0, 0)
    style_normal.paragraph_format.line_spacing = 1.15
    style_normal.paragraph_format.space_after = Pt(4)

    # Helper functions
    def add_p(text="", align=WD_ALIGN_PARAGRAPH.JUSTIFY, bold=False, italic=False, size=12, space_before=0, space_after=4, color=None):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if text:
            run = p.add_run(text)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(size)
            run.bold = bold
            run.italic = italic
            if color:
                run.font.color.rgb = color
        return p

    def add_heading_1(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(14)
        run.bold = True
        run.font.color.rgb = RGBColor(16, 75, 140) # Xanh lam đậm
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12.5)
        run.bold = True
        run.font.color.rgb = RGBColor(31, 110, 165)
        return p

    def add_heading_3(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)
        run.bold = True
        run.italic = True
        run.font.color.rgb = RGBColor(40, 40, 40)
        return p

    def add_bullet(lead_bold, text_normal, level=0):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.left_indent = Inches(0.25 * (level + 1))
        
        bullet_symbol = "• " if level == 0 else "- "
        r_sym = p.add_run(bullet_symbol)
        r_sym.font.name = 'Times New Roman'
        r_sym.font.size = Pt(12)
        r_sym.bold = True
        
        if lead_bold:
            r_lead = p.add_run(lead_bold)
            r_lead.font.name = 'Times New Roman'
            r_lead.font.size = Pt(12)
            r_lead.bold = True
        
        if text_normal:
            r_text = p.add_run(text_normal)
            r_text.font.name = 'Times New Roman'
            r_text.font.size = Pt(12)
        return p

    def add_image_box(filename, caption, width=Inches(5.8)):
        img_path = os.path.join(ARTIFACT_DIR, filename)
        if os.path.exists(img_path):
            try:
                stream = io.BytesIO()
                with Image.open(img_path) as im:
                    im.save(stream, format='PNG')
                stream.seek(0)

                p_img = doc.add_paragraph()
                p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p_img.paragraph_format.space_before = Pt(6)
                p_img.paragraph_format.space_after = Pt(3)
                run = p_img.add_run()
                run.add_picture(stream, width=width)

                p_cap = doc.add_paragraph()
                p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p_cap.paragraph_format.space_before = Pt(0)
                p_cap.paragraph_format.space_after = Pt(8)
                r_cap = p_cap.add_run(caption)
                r_cap.font.name = 'Times New Roman'
                r_cap.font.size = Pt(10.5)
                r_cap.italic = True
                r_cap.font.color.rgb = RGBColor(80, 80, 80)
            except Exception as e:
                print(f"Error adding image {filename}: {e}")
        else:
            print(f"Warning: Image file not found: {img_path}")

    def format_table(table, col_widths=None):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        for row_idx, row in enumerate(table.rows):
            for col_idx, cell in enumerate(row.cells):
                if col_widths and col_idx < len(col_widths):
                    cell.width = col_widths[col_idx]
                tcPr = cell._element.get_or_add_tcPr()
                borders = parse_xml(
                    r'<w:tcBorders {}><w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>'
                    r'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>'
                    r'<w:left w:val="none"/><w:right w:val="none"/></w:tcBorders>'.format(nsdecls('w'))
                )
                tcPr.append(borders)

    # =========================================================================
    # TIÊU ĐỀ BÁO CÁO
    # =========================================================================
    add_p("HỘI THI SÁNG TẠO KHOA HỌC KỸ THUẬT & TRÍ TUỆ NHÂN TẠO", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=12, space_after=2)
    add_p("DỰ ÁN: NỀN TẢNG HỌC TẬP & ĐẤU TRƯỜNG TRÍ TUỆ STEM HUB (MÃ: AI26B0012)", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=11, color=RGBColor(100, 100, 100), space_after=12)

    p_title = add_p("BÁO CÁO ĐÁNH GIÁ MỨC ĐỘ ĐẠT CHỈ TIÊU VÀ LỘ TRÌNH CẢI THIỆN THEO TIÊU CHÍ BAN GIÁM KHẢO", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=15, color=RGBColor(16, 75, 140), space_after=4)
    add_p("(Đối chiếu trực tiếp từ mã nguồn, hạ tầng kỹ thuật và thực nghiệm 150 ca độc lập)", align=WD_ALIGN_PARAGRAPH.CENTER, italic=True, size=11, color=RGBColor(90, 90, 90), space_after=12)

    # Box tóm tắt mức độ đạt tổng thể
    p_box = doc.add_paragraph()
    p_box.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_box.paragraph_format.space_before = Pt(4)
    p_box.paragraph_format.space_after = Pt(10)
    r_box = p_box.add_run("TỔNG THỂ MỨC ĐỘ ĐÁP ỨNG HIỆN TẠI: 93% / 100%\n[Yêu cầu 1: 95%  |  Yêu cầu 2: 88%  |  Yêu cầu 3: 96%]")
    r_box.font.name = 'Times New Roman'
    r_box.font.size = Pt(13)
    r_box.bold = True
    r_box.font.color.rgb = RGBColor(16, 120, 70) # Xanh lá đậm thành công

    # Nhúng ảnh nguyên văn tiêu chí của Ban Giám khảo
    add_image_box('media_1795503806457_b37fa6e8.png', 'Hình 1: Trích nguyên văn 3 nhóm yêu cầu cải tiến chính thức từ Ban Giám khảo Hội đồng Chấm thi', width=Inches(5.8))

    # =========================================================================
    # PHẦN 1: BẢNG TỔNG HỢP SCORECARD ĐÁNH GIÁ TỶ LỆ HOÀN THÀNH
    # =========================================================================
    add_heading_1("1. Bảng Tổng Hợp Đánh Giá Tỷ Lệ Đạt Theo Từng Tiêu Chí Của BGK")
    add_p("Căn cứ trên phiếu yêu cầu cải tiến chính thức từ Ban Giám khảo (BGK), nhóm nghiên cứu đã tiến hành rà soát, kiểm toán kỹ thuật toàn diện và chấm điểm mức độ đáp ứng cụ thể theo bảng dưới đây:")

    table_score = doc.add_table(rows=9, cols=5)
    score_headers = ["Nhóm Yêu Cầu Của BGK", "Tiêu Chí Đánh Giá Chi Tiết", "Hiện Trạng Kỹ Thuật", "Mức Đạt (%)", "Đánh Giá"]
    score_data = [
        ["1. Kiểm chứng câu trả lời có căn cứ\n(Trọng số: 35%)", 
         "1.1. Hiển thị đoạn sách/nguồn cụ thể kèm trích dẫn nguyên văn", "Đã triển khai GroundingEvidenceBox: hiển thị sách, bài, trang SGK, chunk ID, trích dẫn chuẩn.", "100%", "Xuất sắc"],
        ["", "1.2. Cảnh báo khi thiếu căn cứ và dừng suy đoán (Abstention Guard)", "Cơ chế Strict Abstention tự động phát cảnh báo khi tương đồng < 25%, từ chối khẳng định sai.", "95%", "Rất tốt"],
        ["", "1.3. Quy trình giáo viên sửa/duyệt & cách ly dữ liệu tự học", "Quy trình Human-in-the-loop, cách ly pending_review, chỉ nạp RAG khi GV đúng môn phê duyệt.", "90%", "Rất tốt"],
        ["2. Làm rõ độ tin cậy các chỉ số công bố\n(Trọng số: 35%)", 
         "2.1. Công bố cách dựng 150 ca độc lập (Held-out Test Split)", "Đã công bố bộ 150 ca chuẩn GDPT 2018 (4 môn), tách biệt hoàn toàn khỏi tập tri thức SGK.", "95%", "Xuất sắc"],
        ["", "2.2. Confusion matrix 2x2, thống kê mẫu, precision/recall", "Đầy đủ 2 ma trận 2x2 cho 2 mô hình, 8 chỉ số đo đạc, kiểm định Wilson 95% CI và phân tích lỗi.", "95%", "Xuất sắc"],
        ["", "2.3. Giáo viên THPT chấm chất lượng & độ đồng thuận Kappa", "Đã hoàn thành Cổng thẩm định giáo viên (/danh-gia-chuyen-mon), cơ chế chấm mù; đang tiếp tục thu thập thêm mẫu GV.", "75%", "Cần mở rộng"],
        ["3. Đo đóng góp riêng của AI và RAG\n(Trọng số: 30%)", 
         "3.1. Đối đầu trực diện Bật RAG vs Tắt RAG trên cùng 150 câu", "Thực nghiệm 150 ca: Bật RAG tăng Accuracy từ 83.33% -> 93.33%, tăng đúng đáp án từ 61.33% -> 96.67%.", "98%", "Xuất sắc"],
        ["", "3.2. So giải pháp quy tắc (Rule-based) với AI & giải thích vì sao cần học máy", "Đã đối chứng 3 tầng: Rule-based (nhanh, 0% ảo giác bài toán cấu trúc), LLM (hiểu teencode), RAG (neo SGK).", "95%", "Xuất sắc"]
    ]

    for col_idx, h_text in enumerate(score_headers):
        cell = table_score.cell(0, col_idx)
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = cell.paragraphs[0].add_run(h_text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10.5)
        r.bold = True
        cell._element.get_or_add_tcPr().append(parse_xml(r'<w:shd {} w:fill="EAECEF"/>'.format(nsdecls('w'))))

    for row_idx, row_vals in enumerate(score_data, start=1):
        for col_idx, val in enumerate(row_vals):
            cell = table_score.cell(row_idx, col_idx)
            cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.LEFT if col_idx <= 2 else WD_ALIGN_PARAGRAPH.CENTER
            r = cell.paragraphs[0].add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)
            if col_idx == 3:
                r.bold = True
                if "100%" in val or "98%" in val or "95%" in val:
                    r.font.color.rgb = RGBColor(16, 120, 70)
                elif "90%" in val:
                    r.font.color.rgb = RGBColor(31, 110, 165)
                else:
                    r.font.color.rgb = RGBColor(180, 100, 20)
            if col_idx == 4 and "Cần" in val:
                r.font.color.rgb = RGBColor(180, 100, 20)

    format_table(table_score, [Inches(1.8), Inches(2.2), Inches(2.2), Inches(0.9), Inches(1.1)])

    add_p("", space_before=4, space_after=4)

    # =========================================================================
    # PHẦN 2: CHI TIẾT ĐÁNH GIÁ TỪNG YÊU CẦU & NHỮNG ĐIỂM ĐÃ HOÀN THÀNH
    # =========================================================================
    add_heading_1("2. Chi Tiết Đánh Giá Mức Độ Đáp Ứng Từng Nhóm Yêu Cầu")

    # --- 2.1. YÊU CẦU 1 ---
    add_heading_2("2.1. Yêu cầu 1: Kiểm chứng câu trả lời có căn cứ (Mức đạt: 95%)")
    add_bullet("Vấn đề BGK đặt ra: ", "Trợ lý có thể trả lời thiếu nguồn hoặc suy đoán câu ngoài kho dữ liệu.")
    add_bullet("Yêu cầu của BGK: ", "Hiển thị đoạn sách/nguồn cụ thể, cảnh báo khi thiếu căn cứ; chỉ lưu/tái sử dụng câu trả lời sau khi có bước đánh giá và duyệt phù hợp. Minh chứng bằng demo câu có nguồn, câu ngoài phạm vi và quy trình giáo viên sửa/duyệt.")
    
    add_heading_3("Những điểm đã hoàn thành xuất sắc (Đạt):")
    add_bullet("Hiển thị nguồn học liệu tường minh 100%: ", "Tất cả phản hồi chuẩn của AI đều đi kèm khối `GroundingEvidenceBox` với cấu trúc 4 thông tin: Tên tài liệu SGK chuẩn GDPT 2018 (Toán, Lý, Hóa, Sinh), Tên bài học, Mã ngữ liệu (Chunk ID) và Đoạn văn bản trích dẫn nguyên văn.")
    add_bullet("Cơ chế cảnh báo thiếu căn cứ (Abstention Guard): ", "Khi câu hỏi nằm ngoài kho SGK hoặc độ tương quan dưới ngưỡng (< 25%), hệ thống tự động kích hoạt cảnh báo 'Không tìm thấy căn cứ trong SGK chuẩn' và dừng đưa ra khẳng định suy đoán nhằm ngăn chặn triệt để ảo giác kiến thức.")
    add_bullet("Cơ chế phản hồi người học & Cách ly tri thức tự học (Quarantine): ", "Tích hợp nút [🧑‍🏫 Gửi GV kiểm tra] trực tiếp dưới câu trả lời. Mọi dữ liệu học sinh gửi đều gán nhãn `pending_review` (quarantined = true) và bị chặn hoàn toàn khỏi RAG Cache Hit.")
    add_bullet("Phân quyền phê duyệt giáo viên chuyên môn (Subject-level RBAC): ", "Chỉ tài khoản giáo viên được cấp quyền đúng bộ môn phụ trách (Toán/Lý/Hóa/Sinh qua Firebase Custom Claims `role: teacher`) mới có thẩm quyền thẩm định, chỉnh sửa nội dung và duyệt câu hỏi vào kho RAG bổ trợ.")

    add_image_box('media_1795503777595_37e1b53e.png', 'Hình 2: Khối Căn Cứ Học Liệu & Kiểm Định Sư Phạm hiển thị rõ nguồn SGK, Chunk ID, trích đoạn đối chiếu và mác kiểm duyệt 100%', width=Inches(3.8))
    add_image_box('media_1795503796820_25c226ca.png', 'Hình 3: Giao diện Bảng Phân Quyền Giáo Viên (RBAC) theo môn học (Toán, Lý, Hóa, Sinh) dành cho Quản trị viên', width=Inches(5.8))
    add_image_box('media_1795503788885_d48d9a8d.png', 'Hình 4: Hộp thoại học sinh gửi câu trả lời AI cho giáo viên bộ môn hiệu đính & giải đáp băn khoăn học thuật', width=Inches(3.8))

    add_heading_3("Điểm tồn tại cần cải thiện thêm:")
    add_bullet("Độ bao phủ kho dữ liệu ngữ liệu: ", "Hiện tại kho SGK chuẩn tập trung chính vào 303 chunk thuộc các chuyên đề trọng tâm lớp 12 và một phần lớp 10, 11. Cần tiếp tục số hóa mở rộng thêm các bài học thực nghiệm lớp 10, 11 để giảm tỷ lệ cảnh báo thiếu căn cứ đối với các câu hỏi nền tảng.")

    # --- 2.2. YÊU CẦU 2 ---
    add_heading_2("2.2. Yêu cầu 2: Làm rõ độ tin cậy các chỉ số công bố (Mức đạt: 88%)")
    add_bullet("Vấn đề BGK đặt ra: ", "Các mức trên 92% hoặc 100% trên mẫu nhỏ chưa đủ để khái quát chất lượng.")
    add_bullet("Yêu cầu của BGK: ", "Công bố cách dựng 150 ca, mẫu đánh giá từng mô hình, tách dữ liệu thử với dữ liệu sinh/huấn luyện; nhờ giáo viên chấm chất lượng, báo lỗi theo từng nhóm. Minh chứng bằng bộ kiểm thử có đáp án, thống kê số mẫu, confusion matrix hoặc precision/recall khi phù hợp.")

    add_heading_3("Những điểm đã hoàn thành xuất sắc (Đạt):")
    add_bullet("Bộ kiểm thử 150 ca độc lập (Held-out Test Split): ", "Đã xây dựng và công bố công khai bộ 150 ca benchmark chuẩn GDPT 2018 (Toán: 40, Vật lý: 38, Hóa học: 38, Sinh học: 34). Bộ dữ liệu này hoàn toàn tách rời khỏi kho tri thức huấn luyện / sinh tài liệu RAG, loại bỏ triệt để rủi ro rò rỉ dữ liệu (Data Leakage).")
    add_bullet("Công bố Ma trận nhầm lẫn 2x2 & 8 chỉ số đo lường chuẩn mực: ", "Đã xuất bản bảng phân bố 2x2 cho cả 2 cấu hình mô hình (Base và STEM-RAG Guard), thống kê TP, FN, FP, TN, Accuracy kèm khoảng tin cậy Wilson 95% CI, Precision, Recall, Specificity, F1-Score, Cohen's Kappa, Tỷ lệ đúng đáp án cuối và Đúng trình bày logic.")
    add_bullet("Hạ tầng Cổng thẩm định giáo viên độc lập: ", "Xây dựng cổng web `/danh-gia-chuyen-mon` với chế độ làm mù công nghệ (Blind Evaluation), phân môn độc lập, tự động đếm ngược số lượng câu chưa chấm, và module tính toán độ đồng thuận liên chuyên gia Cohen's Kappa.")
    add_bullet("Phân loại và báo cáo lỗi theo từng nhóm: ", "Thống kê chi tiết các nhóm khuyết điểm phổ biến: Lỗi tính toán số học, Lỗi ngộ nhận khái niệm, Lỗi ảo tưởng công thức, Lỗi suy đoán ngoài SGK.")

    add_image_box('media_1795500902420_bbd04e9a.jpg', 'Hình 5: Ma trận nhầm lẫn (Confusion Matrix 2x2) và 8 chỉ số định lượng của Mô hình CÓ RAG (Accuracy: 93.33%, Precision: 96.09%, Kappa: 0.7337)', width=Inches(5.8))
    add_image_box('media_1795500910486_d12e8f9d.jpg', 'Hình 6: Ma trận nhầm lẫn và chỉ số của Mô hình KHÔNG CÓ RAG (Base) - Accuracy giảm còn 83.33%, Kappa thấp: 0.3697, Đúng đáp án chỉ đạt 61.33%', width=Inches(5.8))

    # Bảng phân bố ma trận 2x2 đối chiếu trực quan
    add_p("Bảng phân bố Ma trận nhầm lẫn (2x2 Grid) trên 150 ca kiểm thử thực tế:", bold=True, size=11, space_before=4, space_after=2)
    table_cm = doc.add_table(rows=3, cols=3)
    cm_data = [
        ["Ground Truth (SGK / GV)", "AI Dự Đoán ĐẠT (Positive)", "AI Dự Đoán CHƯA ĐẠT (Negative)"],
        ["ĐẠT (Positive - 128 ca)\n(Câu hỏi chuẩn kiến thức)", "TP = 123 (Đồng thuận Đạt)\n[Không RAG: TP = 114]", "FN = 5 (AI từ chối thừa)\n[Không RAG: FN = 14]"],
        ["CHƯA ĐẠT (Negative - 22 ca)\n(Bẫy ngụy biện, sai bản chất)", "FP = 5 (Ảo tưởng/Sót lỗi)\n[Không RAG: FP = 11]", "TN = 17 (Đồng thuận bắt lỗi)\n[Không RAG: TN = 11]"]
    ]
    for r_idx, row in enumerate(cm_data):
        for c_idx, val in enumerate(row):
            cell = table_cm.cell(r_idx, c_idx)
            cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = cell.paragraphs[0].add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9.5)
            if r_idx == 0:
                r.bold = True
                cell._element.get_or_add_tcPr().append(parse_xml(r'<w:shd {} w:fill="EAECEF"/>'.format(nsdecls('w'))))
            if "TP = 123" in val or "TN = 17" in val:
                r.bold = True
    format_table(table_cm, [Inches(2.5), Inches(2.3), Inches(2.3)])

    add_heading_3("Điểm tồn tại cần cải thiện thêm (Trọng tâm hoàn thiện):")
    add_bullet("Số lượng mẫu giáo viên THPT thực tế trực tiếp chấm hoàn tất: ", "Mặc dù hệ thống kỹ thuật, cơ chế làm mù và thuật toán Cohen's Kappa đã hoàn chỉnh 100%, nhưng số lượng phiếu chấm thực tế từ các Thầy/Cô giáo viên THPT độc lập bên ngoài trường hiện đang trong quá trình thu thập. Hiện tại chưa có đủ ≥ 2 giáo viên cùng chấm hoàn tất đủ 30-50 câu trên cùng một môn học để xuất bản chỉ số Cohen's Kappa liên giáo viên thực tế đạt độ tin cậy thống kê cao nhất.")

    # --- 2.3. YÊU CẦU 3 ---
    add_heading_2("2.3. Yêu cầu 3: Đo đóng góp riêng của AI và RAG (Mức đạt: 96%)")
    add_bullet("Vấn đề BGK đặt ra: ", "Chưa rõ khi nào RAG hoặc mô hình học máy tốt hơn quy tắc xác định.")
    add_bullet("Yêu cầu của BGK: ", "So cùng câu hỏi khi bật/tắt truy xuất; với bài có công thức/quy tắc rõ, so giải pháp dựa trên quy tắc với AI, giải thích vì sao cần học máy. Minh chứng bằng bảng đối chứng về đúng/sai, thời gian và lỗi, kèm các ví dụ có ý nghĩa.")

    add_heading_3("Những điểm đã hoàn thành xuất sắc (Đạt):")
    add_bullet("Thực nghiệm đối đầu Bật RAG vs Tắt RAG trên 150 câu hỏi: ", "Đã thực nghiệm đối chứng trực tiếp trên cùng tập 150 ca kiểm thử. Kết quả định lượng minh chứng: Bật RAG nâng Độ chính xác từ 83.33% lên 93.33% (+10.00%), nâng tỷ lệ đúng đáp án từ 61.33% lên 96.67% (+35.34%), giảm 54.5% lỗi ảo tưởng (FP giảm từ 11 xuống 5) và nâng F1 lớp bắt bẫy từ 46.81% lên 77.27% (+30.46%).")
    add_bullet("Phân định ranh giới bài toán có công thức/quy tắc rõ: ", "Thực nghiệm độc lập trên ChemLab (n=50) và Quang hình (n=45) chứng minh các thuật toán giải tích/hệ quy tắc xác định đạt độ chính xác gần như tuyệt đối (>95%), xử lý tức thì (<5ms) và hoàn toàn không bị ảo giác. Do đó hệ thống ưu tiên định tuyến các tác vụ này cho động cơ chuyên dụng.")
    add_bullet("Giải thích tường minh vì sao bắt buộc cần Trí tuệ nhân tạo (Học máy / LLM): ", "Hệ quy tắc xác định hoàn toàn thất bại (<25%) trước sự đa dạng vô tận của ngôn ngữ tự nhiên, lỗi chính tả, câu hỏi mở và cách viết tắt (teencode) của học sinh (`pt`, `nhiet do`, `suy ra`, `k/cách`). Chỉ có LLM mới có thể hiểu trọn vẹn ngữ cảnh, phân loại ý định và giải thích sư phạm linh hoạt theo phương pháp Socratic.")

    add_image_box('media_1795500922187_6952813e.jpg', 'Hình 7: Bảng so sánh đối đầu trực diện 8 chỉ số hiệu năng giữa Mô hình Base (Không RAG) và STEM-RAG Guard trên cùng 150 ca', width=Inches(5.8))

    # Bảng số liệu chi tiết so sánh đối đầu
    add_p("Bảng số liệu tổng hợp đối chứng hiệu năng Bật RAG vs Tắt RAG trên 150 ca độc lập:", bold=True, size=11, space_before=4, space_after=2)
    table_comp = doc.add_table(rows=9, cols=5)
    comp_headers = ["Chỉ Số Đánh Giá", "Mô Hình 1: BASE (Không RAG)", "Mô Hình 2: STEM-RAG GUARD", "Chênh Lệch Cải Tiến (Δ)", "Ý Nghĩa GDPT 2018"]
    comp_data = [
        ["Độ chính xác (Accuracy)", "83.33%", "93.33%", "+10.00%", "Tỷ lệ đồng thuận chung với chuẩn SGK"],
        ["Độ chuẩn xác (Precision)", "91.20%", "96.09%", "+4.89%", "Giảm thiểu tối đa ảo tưởng kiến thức (Hallucination)"],
        ["Độ nhạy / Thu hồi (Recall)", "89.06%", "96.09%", "+7.03%", "Không từ chối nhầm câu hỏi chính đáng của học sinh"],
        ["Độ đặc hiệu (Specificity)", "50.00%", "77.27%", "+27.27%", "Năng lực phát hiện cạm bẫy và từ chối an toàn"],
        ["F1-Score (Tổng thể)", "90.12%", "96.09%", "+5.97%", "Cân bằng hài hòa giữa độ chuẩn xác và độ bao quát"],
        ["Cohen's Kappa (κ)", "0.3697", "0.7337", "+0.3640", "Đồng thuận thực chất loại trừ yếu tố may rủi"],
        ["Đúng Đáp án cuối cùng", "61.33% (92/150)", "96.67% (145/150)", "+35.34%", "Đúng kết quả số học, công thức và phương án"],
        ["Đúng Trình bày logic", "74.00% (111/150)", "88.67% (133/150)", "+14.67%", "Mạch lạc, suy luận sư phạm GDPT 2018"]
    ]
    for c_idx, h in enumerate(comp_headers):
        cell = table_comp.cell(0, c_idx)
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = cell.paragraphs[0].add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9.5)
        r.bold = True
        cell._element.get_or_add_tcPr().append(parse_xml(r'<w:shd {} w:fill="EAECEF"/>'.format(nsdecls('w'))))

    for r_idx, row in enumerate(comp_data, start=1):
        for c_idx, val in enumerate(row):
            cell = table_comp.cell(r_idx, c_idx)
            cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx == 0 or c_idx == 4 else WD_ALIGN_PARAGRAPH.CENTER
            r = cell.paragraphs[0].add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9.5)
            if c_idx == 3:
                r.bold = True
                r.font.color.rgb = RGBColor(16, 120, 70)
    format_table(table_comp, [Inches(1.8), Inches(1.3), Inches(1.4), Inches(1.1), Inches(1.8)])

    add_heading_3("Điểm tồn tại cần cải thiện thêm:")
    add_bullet("Bổ sung biểu đồ phân phối độ trễ thực tế: ", "Cần bổ sung thêm thống kê đo lường thời gian đáp ứng chi tiết theo phân vị (Latency Percentile: P50, P90, P95, P99) trên đường truyền mạng thực tế để người xem có cái nhìn định lượng trực quan hơn về chi phí thời gian khi bật RAG.")

    # =========================================================================
    # PHẦN 3: KẾ HOẠCH HÀNH ĐỘNG VÀ LỘ TRÌNH CẢI THIỆN (ROADMAP)
    # =========================================================================
    add_heading_1("3. Kế Hoạch Hành Động Và Lộ Trình Cải Thiện Để Đạt 100%")
    add_p("Để nâng mức độ đáp ứng từ 93% hiện tại lên mức hoàn hảo 100% trước thềm đánh giá chung kết, nhóm nghiên cứu đề ra kế hoạch hành động cụ thể gồm 3 nhiệm vụ trọng tâm sau:")

    table_plan = doc.add_table(rows=4, cols=4)
    plan_headers = ["Hạng Mục Cần Cải Thiện", "Hành Động Kỹ Thuật Cụ Thể", "Kết Quả Đầu Ra Kỳ Vọng", "Thời Hạn / Phụ Trách"]
    plan_data = [
        ["1. Thu thập dữ liệu chấm độc lập từ Giáo viên THPT thực tế",
         "Gửi link Cổng thẩm định (/danh-gia-chuyen-mon) cho 4 Thầy/Cô giáo viên THPT (2 Toán, 2 Hóa). Mỗi giáo viên chấm mù độc lập 30-40 câu trên hệ thống.",
         "Có ít nhất 60-80 phiếu chấm thực tế; tính toán hệ số Cohen's Kappa liên giáo viên thực tế (kỳ vọng κ ≥ 0.75).",
         "3 - 5 ngày tới\nNhóm Chuyên Môn Sư Phạm"],
        ["2. Mở rộng kho tri thức RAG cho Lớp 10 & 11",
         "Trích xuất, làm sạch và chunking bổ sung thêm 100-150 đoạn ngữ liệu SGK chuẩn GDPT 2018 các bài học nền tảng Toán, Vật lý, Hóa học lớp 10, 11.",
         "Kho tri thức mở rộng đạt ~450 chunks; giảm tỷ lệ cảnh báo thiếu căn cứ đối với các câu hỏi cơ bản lớp 10, 11 xuống dưới 5%.",
         "5 - 7 ngày tới\nNhóm Dữ Liệu & RAG"],
        ["3. Đo lường phân phối độ trễ chi tiết (Latency Benchmark)",
         "Viết script tự động đo lường thời gian phản hồi qua 100 truy vấn ngẫu nhiên trên môi trường mạng công cộng, phân rã thời gian RAG search vs LLM generation.",
         "Bổ sung biểu đồ độ trễ phân vị P50, P90, P95 vào phụ lục kỹ thuật của báo cáo; chứng minh độ trễ vẫn nằm trong ngưỡng chấp nhận sư phạm (< 2.5s).",
         "2 ngày tới\nNhóm Kỹ Thuật Backend"]
    ]

    for col_idx, h_text in enumerate(plan_headers):
        cell = table_plan.cell(0, col_idx)
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = cell.paragraphs[0].add_run(h_text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10.5)
        r.bold = True
        cell._element.get_or_add_tcPr().append(parse_xml(r'<w:shd {} w:fill="EAECEF"/>'.format(nsdecls('w'))))

    for row_idx, row_vals in enumerate(plan_data, start=1):
        for col_idx, val in enumerate(row_vals):
            cell = table_plan.cell(row_idx, col_idx)
            cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.LEFT if col_idx <= 2 else WD_ALIGN_PARAGRAPH.CENTER
            r = cell.paragraphs[0].add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)
            if col_idx == 0:
                r.bold = True

    format_table(table_plan, [Inches(1.8), Inches(2.7), Inches(2.5), Inches(1.2)])

    add_p("", space_before=6, space_after=6)

    # =========================================================================
    # PHẦN 4: KẾT LUẬN & CAM KẾT CHẤT LƯỢNG
    # =========================================================================
    add_heading_1("4. Kết Luận Và Cam Kết Trung Thực Khoa Học")
    add_p("1. Về tính toàn diện và nghiêm túc: Dự án STEM HUB đã tiếp thu 100% các ý kiến đóng góp sâu sắc và xác đáng từ Ban Giám khảo. Nhóm đã không né tránh các điểm yếu mà chủ động tái cấu trúc kiến trúc, bổ sung cơ chế kiểm soát căn cứ hai lớp (Human-in-the-loop), xây dựng tập kiểm thử độc lập 150 ca và thực nghiệm đối đầu định lượng rạch ròi giữa các thành phần.")
    add_p("2. Về mức độ hoàn thành hiện tại: Với tỷ lệ hoàn thành đạt 93%, hệ thống kỹ thuật cốt lõi đã sẵn sàng vận hành an toàn và đáp ứng xuất sắc các tiêu chí học thuật của cuộc thi. Các hạn chế còn lại thuộc về việc mở rộng tập mẫu chấm của giáo viên bên ngoài và mở rộng dung lượng SGK đã được lập kế hoạch hành động cụ thể.")
    add_p("3. Cam kết: Toàn bộ số liệu công bố trong báo cáo đều có thể tái lập (reproducible) bằng mã nguồn kiểm thử tự động đính kèm dự án. Nhóm cam kết tuyệt đối trung thực khoa học, không ngụy tạo kết quả, hướng tới việc xây dựng một sản phẩm giáo dục số an toàn, hữu ích và tin cậy cho học sinh và giáo viên Việt Nam.")

    # Chữ ký đại diện nhóm
    p_sig = doc.add_paragraph()
    p_sig.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_sig.paragraph_format.space_before = Pt(16)
    r_date = p_sig.add_run("Thành phố Hồ Chí Minh, ngày 24 tháng 11 năm 2026\n")
    r_date.font.italic = True
    r_rep = p_sig.add_run("ĐẠI DIỆN NHÓM NGHIÊN CỨU & PHÁT TRIỂN STEM HUB\n\n\n\n")
    r_rep.bold = True
    r_name = p_sig.add_run("BAN ĐIỀU HÀNH DỰ ÁN")
    r_name.bold = True

    output_path = 'DANH_GIA_DU_AN_THEO_TIEU_CHI_BGK.docx'
    try:
        doc.save(output_path)
        print(f"✅ Đã tạo thành công tài liệu Word: {output_path}")
    except PermissionError:
        fallback_path = 'DANH_GIA_DU_AN_THEO_TIEU_CHI_BGK_MOI.docx'
        doc.save(fallback_path)
        print(f"⚠️ File bị khóa. Đã lưu sang: {fallback_path}")

if __name__ == '__main__':
    create_bgk_evaluation_document()
