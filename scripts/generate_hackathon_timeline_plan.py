# -*- coding: utf-8 -*-
"""
Script tạo tài liệu Word:
KẾ HOẠCH TÁC CHIẾN HACKATHON 06 GIỜ: QUY TRÌNH PHỐI HỢP SONG SONG 3 THÀNH VIÊN
KHÔNG ĐIỂM NGHẼN (ZERO-BLOCKING PIPELINE) & CƠ CHẾ CẮT GỌT PHẠM VI (SCOPE PRUNING)
Dự án: Nền tảng học tập & Đấu trường trí tuệ STEM HUB (Mã: AI26B0012)
"""

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import os

def create_hackathon_timeline_document():
    doc = docx.Document()

    # Thiết lập kích thước trang A4 & căn lề chuẩn văn bản khoa học / tác chiến
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
    font.size = Pt(11.5)
    font.color.rgb = RGBColor(0, 0, 0)
    style_normal.paragraph_format.line_spacing = 1.15
    style_normal.paragraph_format.space_after = Pt(3)

    # Helper functions
    def add_p(text="", align=WD_ALIGN_PARAGRAPH.JUSTIFY, bold=False, italic=False, size=11.5, space_before=0, space_after=3, color=None):
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
        p.paragraph_format.space_before = Pt(13)
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(13.5)
        run.bold = True
        run.font.color.rgb = RGBColor(16, 75, 140) # Xanh lam đậm
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(9)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)
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
        run.font.size = Pt(11.5)
        run.bold = True
        run.italic = True
        run.font.color.rgb = RGBColor(40, 40, 40)
        return p

    def add_bullet(lead_bold, text_normal, level=0):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.left_indent = Inches(0.2 * (level + 1))
        
        bullet_symbol = "• " if level == 0 else "- "
        r_sym = p.add_run(bullet_symbol)
        r_sym.font.name = 'Times New Roman'
        r_sym.font.size = Pt(11.5)
        r_sym.bold = True
        
        if lead_bold:
            r_lead = p.add_run(lead_bold)
            r_lead.font.name = 'Times New Roman'
            r_lead.font.size = Pt(11.5)
            r_lead.bold = True
        
        if text_normal:
            r_text = p.add_run(text_normal)
            r_text.font.name = 'Times New Roman'
            r_text.font.size = Pt(11.5)
        return p

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
    # TIÊU ĐỀ TÀI LIỆU
    # =========================================================================
    add_p("HỘI THI SÁNG TẠO KHOA HỌC KỸ THUẬT & TRÍ TUỆ NHÂN TẠO - CHẶNG 2 CHUNG CUỘC", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=11, space_after=2)
    add_p("DỰ ÁN: NỀN TẢNG HỌC TẬP & ĐẤU TRƯỜNG TRÍ TUỆ STEM HUB (MÃ: AI26B0012)", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=10.5, color=RGBColor(100, 100, 100), space_after=10)

    p_title = add_p("KẾ HOẠCH TÁC CHIẾN HACKATHON 06 GIỜ:\nQUY TRÌNH PHỐI HỢP SONG SONG 3 THÀNH VIÊN KHÔNG ĐIỂM NGHẼN", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=14.5, color=RGBColor(16, 75, 140), space_after=3)
    add_p("(Chiến lược Zero-blocking, Giao ước dữ liệu 15 phút đầu và Cơ chế cắt gọt phạm vi lúc 4h30)", align=WD_ALIGN_PARAGRAPH.CENTER, italic=True, size=10.5, color=RGBColor(90, 90, 90), space_after=10)

    # Box triết lý tác chiến
    p_box = doc.add_paragraph()
    p_box.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_box.paragraph_format.space_before = Pt(2)
    p_box.paragraph_format.space_after = Pt(8)
    r_box = p_box.add_run("TRIẾT LÝ TÁC CHIẾN SỐNG CÒN:\n\"KHÔNG AI ĐƯỢC CHỜ AI - DÙNG GIAO ƯỚC DỮ LIỆU ĐỂ CHẠY SONG SONG TỪ PHÚT THỨ 16\nĐẾN 4H30 DỪNG LẠI KIỂM ĐỊNH (TRIAGE) - CẮT BỎ KHÔNG THƯƠNG TIẾC PHẦN LỖI - BẢO VỆ PHẦN CHẮC THẮNG!\"")
    r_box.font.name = 'Times New Roman'
    r_box.font.size = Pt(11)
    r_box.bold = True
    r_box.font.color.rgb = RGBColor(190, 30, 30)

    # =========================================================================
    # PHẦN 1: MA TRẬN PHÂN VAI & TRÁCH NHIỆM RẠCH RÒI (RACI MATRIX)
    # =========================================================================
    add_heading_1("Phần 1: Ma Trận Phân Vai & Trách Nhiệm 3 Thành Viên (RACI Matrix)")
    add_p("Trong 6 giờ thi đấu căng thẳng, nguyên nhân số 1 khiến các đội thi thất bại là: **'Người viết báo cáo ngồi chờ người code, người làm slide ngồi chờ người viết báo cáo, cuối cùng 30 phút cuối nháo nhào ráp nối và vỡ trận'**. Để xóa bỏ hoàn toàn điểm nghẽn này, nhóm phân chia 3 vai trò độc lập tác chiến từ phút đầu tiên:")

    table_roles = doc.add_table(rows=4, cols=4)
    r_headers = ["Thành Viên & Vai Trò", "Nhiệm Vụ Độc Quyền (Owns)", "Đầu Ra Bắt Buộc (Deliverable)", "Nguyên Tắc Hành Động"]
    r_data = [
        ["THÀNH VIÊN 1:\nTECH LEAD\n(Cải tiến & Code)",
         "• Đọc đề bài kỹ thuật của BGK.\n• Viết script xử lý / chunking dữ liệu mới.\n• Tinh chỉnh prompt / RAG pipeline / model.\n• Fix lỗi ngoại lệ (Empty, Network, JSON).",
         "• 1 Pipeline chạy mượt mà trên localhost.\n• 1 File kết quả thực nghiệm (CSV/JSON).\n• Ảnh chụp màn hình kết quả chạy thực tế.",
         "Tập trung 100% vào code; không bị phân tâm bởi việc viết văn bản hay trang trí slide."],
        ["THÀNH VIÊN 2:\nDOC & DATA LEAD\n(Báo cáo kỹ thuật)",
         "• Dựng sẵn khung Báo Cáo Chặng 2 (Word).\n• Soạn sẵn lý thuyết, cơ sở khoa học GDPT 2018.\n• Vẽ sẵn bảng ma trận nhầm lẫn 2x2 trống.\n• Viết phân tích nguyên nhân lỗi (Error analysis).",
         "• File Word/PDF Báo Cáo Kỹ Thuật hoàn chỉnh (8-10 trang) nộp cho BGK.\n• Các bảng số liệu Wilson 95% CI, Kappa.",
         "Không chờ code xong; viết trước 70% nội dung lý thuyết & khung bảng, chỉ đợi điền số liệu cuối."],
        ["THÀNH VIÊN 3:\nPITCH & DEMO LEAD\n(Slide & Thuyết trình)",
         "• Thiết kế bộ Slide 6-7 trang (Canva/PPT).\n• Viết kịch bản nói (script) 5 phút chuẩn đét.\n• Chuẩn bị máy tính trình chiếu, tab demo sẵn.\n• Luyện phản xạ trả lời các câu hỏi bẫy của BGK.",
         "• Bộ Slide thuyết trình ấn tượng, đúng format.\n• Kịch bản demo live 2 phút mượt mà.\n• Người làm chủ sân khấu khi thuyết trình.",
         "Làm xong 80% slide từ giờ thứ 3; dành 2 tiếng cuối diễn tập nói và chuẩn bị sẵn backup offline."]
    ]

    for c_idx, h in enumerate(r_headers):
        cell = table_roles.cell(0, c_idx)
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = cell.paragraphs[0].add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10.5)
        r.bold = True
        cell._element.get_or_add_tcPr().append(parse_xml(r'<w:shd {} w:fill="EAECEF"/>'.format(nsdecls('w'))))

    for r_idx, row in enumerate(r_data, start=1):
        for c_idx, val in enumerate(row):
            cell = table_roles.cell(r_idx, c_idx)
            cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx < 3 else WD_ALIGN_PARAGRAPH.JUSTIFY
            r = cell.paragraphs[0].add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)
            if c_idx == 0:
                r.bold = True
                if "THÀNH VIÊN 1" in val:
                    r.font.color.rgb = RGBColor(16, 75, 140)
                elif "THÀNH VIÊN 2" in val:
                    r.font.color.rgb = RGBColor(16, 120, 70)
                else:
                    r.font.color.rgb = RGBColor(190, 30, 30)
    format_table(table_roles, [Inches(1.8), Inches(2.6), Inches(2.4), Inches(1.8)])

    add_p("", space_before=4, space_after=4)

    # =========================================================================
    # PHẦN 2: BÍ QUYẾT TÁC CHIẾN "GIAO ƯỚC DỮ LIỆU 15 PHÚT ĐẦU" (CONTRACT-FIRST)
    # =========================================================================
    add_heading_1("Phần 2: Bí Quyết Chạy Song Song: Giao Ước Dữ Liệu 15 Phút Đầu (Contract-First)")
    add_p("Làm sao để Thành viên 2 (Báo cáo) và Thành viên 3 (Slide) làm việc được ngay khi Thành viên 1 chưa viết xong 1 dòng code nào? Câu trả lời nằm ở: **HỢP ĐỒNG DỮ LIỆU (DATA INTERFACE CONTRACT)** được thống nhất trong 15 phút đầu:")

    add_bullet("1. Thống nhất Câu chuyện xuyên suốt (Core Storyline): ", "Trong 5 phút đầu sau khi mở đề thi, cả 3 thành viên thống nhất thông điệp duy nhất: 'Ví dụ: Đề bài yêu cầu xử lý dữ liệu mới môn Tin học 12 theo cấu trúc Đúng/Sai 4 ý 2025. Câu chuyện của nhóm là chứng minh RAG thích ứng tức thời trong 1 giờ mà vẫn đảm bảo 100% trích dẫn SGK chuẩn.'")
    add_bullet("2. Thống nhất Cấu trúc Bảng kết quả (Output Contract): ", "Thống nhất rằng khi code chạy xong, file output của TV1 sẽ là 1 bảng gồm đúng 4 cột: [Câu hỏi | Căn cứ SGK trích xuất | AI dự đoán | Ground Truth kết quả]. Cả 3 người cùng hiểu định dạng này.")
    add_bullet("3. Thống nhất 4 Chỉ số mục tiêu (Target Metrics): ", "Chốt sẵn 4 con số sẽ đưa lên báo cáo và slide: Độ chính xác (Accuracy), Độ đặc hiệu (Specificity), Thời gian phản hồi trung bình (Latency ms), và Tỷ lệ có trích dẫn SGK (Grounding Rate %).")
    add_bullet("4. Tách luồng độc lập từ phút thứ 16: ", "Thành viên 2 và 3 sử dụng số liệu giả định (Placeholder: [XX.X%], [Ảnh biểu đồ tại đây]) để hoàn thiện 80% văn bản và slide mà không cần đợi Thành viên 1!")

    # =========================================================================
    # PHẦN 3: LỘ TRÌNH TÁC CHIẾN 6 GIỜ CHI TIẾT THEO TỪNG PHÚT
    # =========================================================================
    add_heading_1("Phần 3: Lộ Trình Tác Chiến 6 Giờ Phân Bổ Chi Tiết Từng Thành Viên")

    table_timeline = doc.add_table(rows=6, cols=5)
    t_headers = ["Khung Giờ", "Giai Đoạn", "Thành Viên 1 (Tech Lead)", "Thành Viên 2 (Doc & Data)", "Thành Viên 3 (Pitch & Demo)"]
    t_data = [
        ["0:00 - 0:15\n(15 phút)", "KICKOFF &\nGIAO ƯỚC",
         "Đọc đề, kiểm tra file dữ liệu BGK cấp, chốt kiến trúc pipeline.",
         "Lắng nghe đề, chốt dàn ý báo cáo và các bảng số liệu cần vẽ.",
         "Chốt câu chuyện thuyết trình 5 phút và bố cục 6 slide."],
        ["0:15 - 2:30\n(2h15p)", "TÁCH LUỒNG\nĐỘC LẬP 100%\n(Sprint 1)",
         "• Viết script làm sạch dữ liệu mới.\n• Semantic chunking & nạp Vector RAG.\n• Viết logic chấm / phân loại theo đề mới.\n• Chạy thử nghiệm trên 10 mẫu đầu tiên.",
         "• Mở file mẫu báo cáo Word.\n• Viết Phần 1 (Đặt vấn đề & bối cảnh GDPT 2018).\n• Viết Phần 2 (Phương pháp luận kiến trúc 3 tầng).\n• Dựng sẵn khung bảng ma trận 2x2 và công thức toán.",
         "• Mở Canva/PPT dựng sẵn template Slide.\n• Soạn Slide 1 (Bìa), Slide 2 (Nỗi đau thực tế), Slide 3 (Giải pháp kiến trúc).\n• Soạn dàn bài kịch bản thuyết trình (Speech Script).\n• Chuẩn bị máy chiếu, dây HDMI, tab backup."],
        ["2:30 - 4:30\n(2h00p)", "TÍCH HỢP &\nCHẠY THỰC TẾ\n(Sprint 2)",
         "• Đấu nối pipeline với giao diện Web STEM HUB.\n• Hiển thị khối GroundingEvidenceBox.\n• Chạy toàn bộ tập test của BGK (batch inference).\n• Xuất file CSV kết quả thực tế đợt 1.",
         "• Nhận file CSV đợt 1 từ TV1.\n• Tính toán nhanh: TP, FP, FN, TN, Accuracy, Kappa.\n• Điền số liệu vào bảng ma trận 2x2.\n• Viết Phần 3 (Bàn luận kết quả & Phân tích lỗi).\n• Chụp 3-4 ảnh màn hình giao diện thực tế.",
         "• Nhận số liệu chính từ TV2, điền vào Slide 4 (Kết quả thực nghiệm).\n• Thiết lập kịch bản Live Demo 2 phút: chọn sẵn 2 câu hỏi ấn tượng nhất để bấm demo.\n• Luyện nói lần 1 (tự canh giờ bằng điện thoại)."],
        ["4:30 - 5:00\n(30 phút)", "ĐIỂM CHỐT CHẶN:\nTRIAGE &\nSCOPE PRUNING\n(Cực kỳ quan trọng)",
         "🛑 DỪNG CODE TÍNH NĂNG MỚI!\n• Báo cáo cho nhóm: Cái gì chạy tốt, cái gì đang lỗi.\n• Cắt bỏ ngay phần lỗi, khóa mã nguồn (Code Freeze).",
         "• Họp nhanh 5 phút cùng nhóm.\n• Điều chỉnh nội dung báo cáo khớp với những gì ĐÃ CHẠY ĐƯỢC.\n• Bỏ các mục hứa hẹn không kịp làm.",
         "• Chỉnh slide theo đúng tính năng chạy được.\n• Tập trung làm nổi bật những gì ĐÃ LÀM TỐT NHẤT.\n• Chuẩn bị câu trả lời giải thích nếu BGK hỏi phần cắt bỏ."],
        ["5:00 - 6:00\n(60 phút)", "KHÓA NỘP BÀI\n& DIỄN TẬP\nCHUNG CUỘC",
         "• Chạy kiểm thử lần cuối trên localhost.\n• Đóng gói mã nguồn theo yêu cầu của BTC.\n• Đứng cạnh TV3 hỗ trợ kỹ thuật khi demo.",
         "• Rà soát chính tả, căn lề, xuất file PDF Báo Cáo.\n• Nộp sản phẩm và file báo cáo cho BTC trước hạn 15 phút.\n• In 1 bản giấy cầm tay cho nhóm (nếu có máy in).",
         "• DIỄN TẬP THỰC TẾ 2 LẦN (5 phút/lần).\n• TV3 nói - TV1 thao tác máy tính demo - TV2 bấm slide.\n• Tự tin, sẵn sàng bước vào phòng vấn đáp của BGK!"]
    ]

    for c_idx, h in enumerate(t_headers):
        cell = table_timeline.cell(0, c_idx)
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = cell.paragraphs[0].add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)
        r.bold = True
        cell._element.get_or_add_tcPr().append(parse_xml(r'<w:shd {} w:fill="EAECEF"/>'.format(nsdecls('w'))))

    for r_idx, row in enumerate(t_data, start=1):
        for c_idx, val in enumerate(row):
            cell = table_timeline.cell(r_idx, c_idx)
            cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx == 0 or c_idx == 1 else WD_ALIGN_PARAGRAPH.LEFT
            r = cell.paragraphs[0].add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9.5)
            if c_idx == 0 or c_idx == 1:
                r.bold = True
            if r_idx == 4: # Hàng Triage nổi bật
                cell._element.get_or_add_tcPr().append(parse_xml(r'<w:shd {} w:fill="FFF3CD"/>'.format(nsdecls('w'))))
    format_table(table_timeline, [Inches(1.1), Inches(1.3), Inches(2.2), Inches(2.2), Inches(2.2)])

    add_p("", space_before=4, space_after=4)

    # =========================================================================
    # PHẦN 4: NGUYÊN TẮC CẮT GỌT PHẠM VI (SCOPE PRUNING) LÚC 4H30
    # =========================================================================
    add_heading_1("Phần 4: Nguyên Tắc Sống Còn Lúc 4h30: Cắt Gọt Phạm Vi (Scope Pruning)")
    add_p("Đúng 4h30 (hoặc khi đồng hồ còn 1 tiếng), cả 3 thành viên BẮT BUỘC phải dừng tay họp nhanh 5 phút. Đây là thời khắc quyết định tấm huy chương. Hãy áp dụng **Quy tắc đèn giao thông (Traffic Light Triage)** sau:")

    add_bullet("🟢 Nhóm XANH (Tính năng đã chạy ổn định 80-100%): ", "KHÓA MÃ NGUỒN NGAY LẬP TỨC! Tuyệt đối không thêm hiệu ứng, không sửa giao diện, không tối ưu thuật toán nữa. Lấy kết quả này làm trụ cột chính để báo cáo và demo.")
    add_bullet("🟡 Nhóm VÀNG (Tính năng đang dở dang 50%, thiếu thời gian): ", "CHUYỂN SANG GIẢI PHÁP DỰ PHÒNG (FALLBACK): Thay vì gọi AI phức tạp bị lỗi, hãy dùng hệ quy tắc đơn giản (Rule-based) hoặc gắn dữ liệu mẫu tĩnh (Mocked Response) có chú thích trung thực. Tuyệt đối không để màn hình báo lỗi đỏ (Error 500) khi BGK xem!")
    add_bullet("🔴 Nhóm ĐỎ (Tính năng lỗi nặng, bug liên tục, chưa ra kết quả): ", "CẮT BỎ HOÀN TOÀN KHÔNG THƯƠNG TIẾC! Ẩn nút bấm trên giao diện, xóa mục đó khỏi slide thuyết trình, không nhắc đến trong báo cáo. Giám khảo không thể trừ điểm một tính năng mà các em không công bố, nhưng họ sẽ trừ điểm rất nặng nếu một tính năng các em khoe trên slide nhưng bấm vào lại bị đơ/văng ứng dụng!")

    # =========================================================================
    # PHẦN 5: CHECKLIST TRANG THIẾT BỊ & CHUẨN BỊ TRƯỚC GIỜ G
    # =========================================================================
    add_heading_1("Phần 5: Checklist Trang Thiết Bị & Chuẩn Bị Trước Giờ G (Ngày 28/11)")
    add_bullet("Thiết bị & Mạng dự phòng: ", "Mỗi người mang 1 laptop có sạc đầy đủ. Chuẩn bị sẵn ít nhất 2 điện thoại có gói cước 4G/5G tốc độ cao để phát Wifi riêng (tuyệt đối không phụ thuộc hoàn toàn vào Wifi hội trường vì thường bị nghẽn).")
    add_bullet("Môi trường lập trình Local sẵn sàng: ", "Cài đặt sẵn Node.js, Python, Git, VS Code, thư viện `python-docx`, các model weights và biến môi trường `.env`. Không đợi vào phòng thi mới chạy `npm install` hay tải model nặng.")
    add_bullet("Template Báo Cáo & Slide trắng sẵn có: ", "Lưu sẵn 1 template Word chuẩn font Times New Roman, dãn dòng 1.15 và 1 bộ slide template STEM HUB để mở ra là gõ nội dung được ngay.")
    add_bullet("Thuốc nhỏ mắt, nước ngọt & đồ ăn nhẹ: ", "Chuẩn bị nước tăng lực, bánh ngọt để duy trì sự tỉnh táo và năng lượng cao nhất trong suốt 6 giờ thi đấu liên tục.")

    output_path = 'KE_HOACH_TAC_CHIEN_6_GIO_3_NGUOI_SONG_SONG.docx'
    try:
        doc.save(output_path)
        print(f"✅ Đã tạo thành công tài liệu Word: {output_path}")
    except PermissionError:
        fallback_path = 'KE_HOACH_TAC_CHIEN_6_GIO_3_NGUOI_SONG_SONG_MOI.docx'
        doc.save(fallback_path)
        print(f"⚠️ File bị khóa. Đã lưu sang: {fallback_path}")

if __name__ == '__main__':
    create_hackathon_timeline_document()

