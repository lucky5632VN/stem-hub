import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_styled_heading(doc, text, level):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.bold = True
    if level == 1:
        run.font.size = Pt(16)
        run.font.color.rgb = RGBColor(27, 54, 93)
    elif level == 2:
        run.font.size = Pt(13)
        run.font.color.rgb = RGBColor(41, 128, 185)
    else:
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(50, 50, 50)
    return p

def format_cell_text(cell, text, bold=False, italic=False, font_size=10, align=WD_ALIGN_PARAGRAPH.LEFT, color_rgb=(0,0,0)):
    p = cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(font_size)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = RGBColor(*color_rgb)

# -------------------------------------------------------------
# 1. GENERATE LICHSU_CAULENH_VA_HINH_ANH_MINH_CHUNG.DOCX
# -------------------------------------------------------------
def build_doc1():
    doc = Document()

    # Set page margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Title
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_p.paragraph_format.space_after = Pt(4)
    run_t = title_p.add_run("LỊCH SỬ CÂU LỆNH VÀ HÌNH ẢNH MINH CHỨNG")
    run_t.font.name = 'Calibri'
    run_t.font.size = Pt(18)
    run_t.bold = True
    run_t.font.color.rgb = RGBColor(27, 54, 93)

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_p.paragraph_format.space_after = Pt(18)
    run_sub = sub_p.add_run("Dự án: STEM HUB - Hệ sinh thái Học tập và Thí nghiệm Ảo\nĐơn vị dự thi: Trường THPT Quỳnh Lưu 4")
    run_sub.font.name = 'Calibri'
    run_sub.font.size = Pt(11)
    run_sub.italic = True
    run_sub.font.color.rgb = RGBColor(100, 100, 100)

    # Section 1
    add_styled_heading(doc, "I. TỔNG QUAN VỀ QUÁ TRÌNH PHÁT TRIỂN", 1)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run("Dự án STEM HUB được nhóm học sinh Trường THPT Quỳnh Lưu 4 lên ý tưởng và xây dựng nhằm tạo ra một môi trường học tập trực quan, sinh động cho các môn Khoa học tự nhiên (Toán, Lý, Hóa, Sinh). Trong quá trình làm dự án, nhóm đã tự lên nội dung kiến thức, xây dựng ngân hàng câu hỏi và ứng dụng công cụ AI (Gemini API & Antigravity) để hỗ trợ lập trình giao diện, viết mã nguồn và gỡ lỗi phần mềm.")
    run.font.name = 'Calibri'
    run.font.size = Pt(11)

    # Section 2
    add_styled_heading(doc, "II. LỊCH SỬ CÁC CÂU LỆNH CHÍNH (PROMPT LOG)", 1)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    run = p.add_run("Dưới đây là bảng tổng hợp các câu lệnh (prompts) chính mà nhóm đã sử dụng trong từng giai đoạn phát triển sản phẩm:")
    run.font.name = 'Calibri'
    run.font.size = Pt(11)

    table1_data = [
        ["Giai đoạn", "Mục tiêu thực hiện", "Nội dung câu lệnh (Prompt)", "Kết quả đạt được"],
        ["Giai đoạn 1", "Dựng khung website & Thí nghiệm Hóa ảo", "Tạo giao diện website học tập STEM bằng Next.js. Viết mô phỏng phòng lab Hóa học tương tác, cho phép chọn hóa chất và hiển thị hiện tượng phản ứng.", "Hoàn thành giao diện chính và mô phỏng thí nghiệm Hóa học cơ bản."],
        ["Giai đoạn 2", "Xây dựng các Phòng lab Vật lý, Sinh học, Toán học", "Viết mã nguồn mô phỏng con lắc đơn 3D cho môn Vật lý, bài tập di truyền cho môn Sinh học và công thức toán học bằng KaTeX.", "Tích hợp đủ 4 phòng thí nghiệm ảo tương tác trực quan."],
        ["Giai đoạn 3", "Tích hợp Trợ lý AI Nova", "Tạo cửa sổ trợ lý AI Nova dạng nổi kéo thả, hỗ trợ nhận diện giọng nói tiếng Việt để giải đáp thắc mắc và hỗ trợ chuyển trang.", "Trợ lý Nova hỗ trợ học sinh học tập và điều hướng website tiện lợi."],
        ["Giai đoạn 4", "Phát triển Đấu trường Thách đấu 1v1", "Viết chức năng đấu trường thách đấu 1v1 giữa 2 học sinh, tự động ghép trận sau 30 giây và tạo câu hỏi trắc nghiệm theo ELO.", "Hoàn thành tính năng Đấu trường 1v1 sôi nổi, hấp dẫn."],
        ["Giai đoạn 5", "Tích hợp Đăng nhập và Xác thực khuôn mặt", "Thêm chức năng đăng nhập tài khoản và tính năng quét khuôn mặt 2FA bằng thư viện TensorFlow.js để tăng tính bảo mật.", "Hệ thống tài khoản và xác thực khuôn mặt hoạt động ổn định."],
        ["Giai đoạn 6", "Hoàn thiện giao diện & Tối ưu trải nghiệm", "Tạo hiệu ứng in chữ từ từ cho Trợ lý Nova, sửa lỗi cuộn trang và hoàn thiện các chức năng hiển thị trên máy tính và điện thoại.", "Giao diện mượt mà, dễ sử dụng, hoàn thành dự án."]
    ]

    t1 = doc.add_table(rows=len(table1_data), cols=4)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    t1.autofit = False

    col_widths1 = [Inches(1.0), Inches(1.5), Inches(2.6), Inches(1.7)]

    for row_idx, row in enumerate(t1.rows):
        is_header = (row_idx == 0)
        for col_idx, cell in enumerate(row.cells):
            cell.width = col_widths1[col_idx]
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            text = table1_data[row_idx][col_idx]
            if is_header:
                set_cell_background(cell, "1B365D")
                format_cell_text(cell, text, bold=True, font_size=10, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(255,255,255))
            else:
                bg = "F4F6F9" if row_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg)
                align = WD_ALIGN_PARAGRAPH.CENTER if col_idx == 0 else WD_ALIGN_PARAGRAPH.LEFT
                format_cell_text(cell, text, bold=False, font_size=9.5, align=align, color_rgb=(30,30,30))

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Section 3
    add_styled_heading(doc, "III. DANH SÁCH CÁC PROMPT HỆ THỐNG (SYSTEM PROMPTS)", 1)
    
    prompts_info = [
        ("1. Prompt cho Trợ lý AI Nova (Cố vấn Học tập & Điều hướng)", 
         "Bạn là NOVA - Trợ lý AI hỗ trợ học tập STEM cho học sinh THPT.\nNhiệm vụ:\n- Giải đáp thắc mắc kiến thức 4 môn Toán, Lý, Hóa, Sinh theo chương trình SGK THPT 2025.\n- Hỗ trợ chuyển trang khi học sinh yêu cầu (ví dụ: 'Mở lab Hóa', 'Vào đấu trường').\n- Giữ thái độ thân thiện, lịch sự, từ chối các nội dung không phù hợp hoặc bạo lực."),
        ("2. Prompt cho AI Giám sát Phòng Lab Hóa", 
         "Bạn là AI hỗ trợ thí nghiệm Hóa học ảo.\nNhiệm vụ: Theo dõi các chất hóa học học sinh đưa vào cốc thí nghiệm, giải thích ngắn gọn nguyên nhân phản ứng xảy ra và đưa ra lời nhắc an toàn thí nghiệm."),
        ("3. Prompt cho AI Cố vấn Kiến thức 4 Môn", 
         "Bạn là AI Cố vấn Khoa học cho các phòng thí nghiệm ảo.\nNhiệm vụ: Trả lời ngắn gọn, súc tích (từ 2 - 4 dòng) đi thẳng vào đáp số, công thức cốt lõi môn Toán, Lý, Hóa, Sinh."),
        ("4. Prompt cho AI Đấu trường 1v1", 
         "Bạn là Động cơ hỗ trợ Đấu trường Thách đấu STEM 1v1.\nNhiệm vụ: Hỗ trợ tự động ghép trận đấu khi hết thời gian chờ, chọn câu hỏi trắc nghiệm phù hợp với trình độ người chơi.")
    ]

    for title_p_text, content_text in prompts_info:
        add_styled_heading(doc, title_p_text, 2)
        box_table = doc.add_table(rows=1, cols=1)
        box_table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = box_table.rows[0].cells[0]
        cell.width = Inches(6.8)
        set_cell_background(cell, "F8F9FA")
        set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
        format_cell_text(cell, content_text, font_size=9.5, color_rgb=(40,40,40))
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # Section 4
    add_styled_heading(doc, "IV. DANH MỤC HÌNH ẢNH MINH CHỨNG THỰC TẾ", 1)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    run = p.add_run("Các hình ảnh chụp màn hình thực tế minh chứng cho quá trình vận hành của sản phẩm STEM HUB bao gồm:")
    run.font.name = 'Calibri'
    run.font.size = Pt(11)

    table2_data = [
        ["STT", "Tên hình ảnh minh chứng", "Nội dung mô tả"],
        ["1", "Giao diện Trang chủ & Trợ lý Nova", "Màn hình trang chủ STEM HUB với cửa sổ Trợ lý AI Nova hỗ trợ học sinh."],
        ["2", "Nhật ký xử lý câu lệnh hệ thống", "Màn hình hiển thị quá trình nhận và xử lý câu hỏi của trợ lý AI."],
        ["3", "Mô phỏng Thí nghiệm Lab Hóa", "Giao diện trộn hóa chất và hiển thị kết quả phản ứng trong phòng lab Hóa."],
        ["4", "Mô phỏng Thí nghiệm Lab Vật lý 3D", "Mô phỏng con lắc đơn 3D và đồ thị dao động môn Vật lý."],
        ["5", "Bài tập Di truyền Lab Sinh học", "Sơ đồ phả hệ và bài tập xác suất di truyền môn Sinh học."],
        ["6", "Đấu trường Thách đấu PvP 1v1", "Giao diện thi đấu trắc nghiệm 1v1 giữa hai học sinh thời gian thực."],
        ["7", "Tính năng Quét khuôn mặt 2FA", "Màn hình xác thực khuôn mặt khi đăng nhập tài khoản."],
        ["8", "Trang kiểm thử hệ thống (/admin)", "Giao diện dành cho người quản trị kiểm tra các chức năng của website."]
    ]

    t2 = doc.add_table(rows=len(table2_data), cols=3)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    t2.autofit = False

    col_widths2 = [Inches(0.6), Inches(2.5), Inches(3.7)]

    for row_idx, row in enumerate(t2.rows):
        is_header = (row_idx == 0)
        for col_idx, cell in enumerate(row.cells):
            cell.width = col_widths2[col_idx]
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            text = table2_data[row_idx][col_idx]
            if is_header:
                set_cell_background(cell, "1B365D")
                format_cell_text(cell, text, bold=True, font_size=10, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(255,255,255))
            else:
                bg = "F4F6F9" if row_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg)
                align = WD_ALIGN_PARAGRAPH.CENTER if col_idx == 0 else WD_ALIGN_PARAGRAPH.LEFT
                format_cell_text(cell, text, bold=False, font_size=9.5, align=align, color_rgb=(30,30,30))

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Section 5
    add_styled_heading(doc, "V. HƯỚNG DẪN NỘP BÀI LÊN GOOGLE DRIVE", 1)
    steps = [
        "Bước 1: Tạo một thư mục trên Google Drive cá nhân với tên thư mục: [QuynhLuu4_STEMHUB]_LichSuCauLenh_MinhChung.",
        "Bước 2: Tải file báo cáo này cùng các hình ảnh chụp màn hình tương ứng vào thư mục vừa tạo.",
        "Bước 3: Nhấp chuột phải vào thư mục -> Chọn 'Chia sẻ' -> Chuyển quyền truy cập thành 'Bất kỳ ai có liên kết đều có thể xem'.",
        "Bước 4: Sao chép liên kết chia sẻ của thư mục và dán vào ô 'Lịch sử câu lệnh và hình ảnh minh chứng' trên cổng nộp bài."
    ]
    for step in steps:
        p_s = doc.add_paragraph()
        p_s.paragraph_format.space_after = Pt(3)
        p_s.paragraph_format.left_indent = Inches(0.2)
        run_s = p_s.add_run(step)
        run_s.font.name = 'Calibri'
        run_s.font.size = Pt(10.5)

    file_path = "e:/project/cuoc_thi_AI/Lich_Su_Cau_Lenh_Va_Hinh_Anh_Minh_Chung.docx"
    doc.save(file_path)
    print("Saved Doc1 successfully!")


# -------------------------------------------------------------
# 2. GENERATE KE_KHAI_CONG_CU_AI_DU_LIEU_API_THU_VIEN_MA_NGUON_MO.DOCX
# -------------------------------------------------------------
def build_doc2():
    doc = Document()

    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Title
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_p.paragraph_format.space_after = Pt(4)
    run_t = title_p.add_run("KÊ KHAI CÔNG CỤ AI, DỮ LIỆU, API, THƯ VIỆN VÀ MÃ NGUỒN MỞ")
    run_t.font.name = 'Calibri'
    run_t.font.size = Pt(16)
    run_t.bold = True
    run_t.font.color.rgb = RGBColor(27, 54, 93)

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_p.paragraph_format.space_after = Pt(18)
    run_sub = sub_p.add_run("Dự án: STEM HUB - Hệ sinh thái Học tập và Thí nghiệm Ảo\nĐơn vị dự thi: Trường THPT Quỳnh Lưu 4")
    run_sub.font.name = 'Calibri'
    run_sub.font.size = Pt(11)
    run_sub.italic = True
    run_sub.font.color.rgb = RGBColor(100, 100, 100)

    # Section 1
    add_styled_heading(doc, "I. CAM KẾT MINH BẠCH DỰ ÁN", 1)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run("Nhóm phát triển dự án STEM HUB (Trường THPT Quỳnh Lưu 4) xin cam kết trung thực kê khai toàn bộ các công cụ AI, nguồn dữ liệu, giao diện API, thư viện phần mềm và mã nguồn mở được sử dụng trong quá trình xây dựng sản phẩm theo quy định của Ban Tổ chức Cuộc thi Trí tuệ Nhân tạo do Ban Bí thư Trung ương Đoàn phát động.")
    run.font.name = 'Calibri'
    run.font.size = Pt(11)

    # Section 2
    add_styled_heading(doc, "II. KÊ KHAI CÔNG CỤ AI ĐÃ SỬ DỤNG", 1)
    table1_data = [
        ["STT", "Tên công cụ AI", "Đơn vị cung cấp", "Mục đích sử dụng trong dự án"],
        ["1", "Antigravity AI Agent", "Google DeepMind", "Hỗ trợ nhóm lập trình mã nguồn, sửa lỗi code và tối ưu hóa các chức năng của website."],
        ["2", "Google Gemini API", "Google AI", "Xử lý ngôn ngữ tự nhiên, giúp Trợ lý AI Nova trả lời thắc mắc của học sinh bằng tiếng Việt."],
        ["3", "AudioCraft / MusicGen", "Meta AI", "Tạo âm thanh nền và hiệu ứng âm thanh khoa học cho các phòng thí nghiệm ảo."]
    ]

    t1 = doc.add_table(rows=len(table1_data), cols=4)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    t1.autofit = False
    col_widths1 = [Inches(0.6), Inches(2.0), Inches(1.7), Inches(2.5)]

    for row_idx, row in enumerate(t1.rows):
        is_header = (row_idx == 0)
        for col_idx, cell in enumerate(row.cells):
            cell.width = col_widths1[col_idx]
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            text = table1_data[row_idx][col_idx]
            if is_header:
                set_cell_background(cell, "1B365D")
                format_cell_text(cell, text, bold=True, font_size=10, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(255,255,255))
            else:
                bg = "F4F6F9" if row_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg)
                align = WD_ALIGN_PARAGRAPH.CENTER if col_idx == 0 else WD_ALIGN_PARAGRAPH.LEFT
                format_cell_text(cell, text, bold=False, font_size=9.5, align=align, color_rgb=(30,30,30))

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Section 3
    add_styled_heading(doc, "III. KÊ KHAI NGUỒN DỮ LIỆU", 1)
    table2_data = [
        ["STT", "Tên bộ dữ liệu", "Quy mô dữ liệu", "Mục đích sử dụng & Nguồn gốc"],
        ["1", "Bộ dữ liệu Tri thức STEM THPT", "303 đoạn tri thức tóm tắt", "Dùng cho Trợ lý AI Nova tra cứu kiến thức SGK 4 môn Toán, Lý, Hóa, Sinh. Nguồn: Nhóm tự biên soạn từ SGK GDPT 2018."],
        ["2", "Ngân hàng Câu hỏi Trắc nghiệm", "500+ câu hỏi 4 môn", "Dùng cho phân hệ Đấu trường 1v1 và luyện tập. Nguồn: Nhóm tự biên soạn và chuẩn hóa."],
        ["3", "Dữ liệu Phản ứng Hóa học", "144 mẫu thí nghiệm Hóa", "Dùng cho phòng lab Hóa ảo phân tích phản ứng và đưa ra cảnh báo an toàn. Nguồn: Nhóm tự tổng hợp."],
        ["4", "Dữ liệu Mẫu Ý định Hội thoại", "392 câu thoại tiếng Việt", "Dùng cho Trợ lý Nova nhận diện ý định câu hỏi và teencode của học sinh. Nguồn: Nhóm tự thu thập."],
        ["5", "Dữ liệu Thao tác Lab Vật lý", "96 mẫu thao tác thí nghiệm", "Dùng cho phòng lab Vật lý 3D hỗ trợ phát hiện các lỗi thao tác của học sinh. Nguồn: Nhóm tự thử nghiệm."]
    ]

    t2 = doc.add_table(rows=len(table2_data), cols=4)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    t2.autofit = False
    col_widths2 = [Inches(0.6), Inches(2.2), Inches(1.6), Inches(2.4)]

    for row_idx, row in enumerate(t2.rows):
        is_header = (row_idx == 0)
        for col_idx, cell in enumerate(row.cells):
            cell.width = col_widths2[col_idx]
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            text = table2_data[row_idx][col_idx]
            if is_header:
                set_cell_background(cell, "1B365D")
                format_cell_text(cell, text, bold=True, font_size=10, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(255,255,255))
            else:
                bg = "F4F6F9" if row_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg)
                align = WD_ALIGN_PARAGRAPH.CENTER if col_idx == 0 else WD_ALIGN_PARAGRAPH.LEFT
                format_cell_text(cell, text, bold=False, font_size=9.5, align=align, color_rgb=(30,30,30))

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Section 4
    add_styled_heading(doc, "IV. KÊ KHAI GIAO DIỆN API VÀ DỊCH VỤ TÍCH HỢP", 1)
    table3_data = [
        ["STT", "Tên API / Dịch vụ", "Nhà cung cấp", "Mục đích tích hợp"],
        ["1", "Google Gemini REST API", "Google AI", "Gửi câu hỏi và nhận câu trả lời tư vấn cho học sinh từ Gemini LLM."],
        ["2", "Firebase Auth & Firestore", "Google Firebase", "Quản lý tài khoản học sinh, lưu lịch sử thi đấu và điểm xếp hạng ELO."],
        ["3", "Web Speech API (STT)", "Tích hợp sẵn trên trình duyệt", "Nhận diện giọng nói tiếng Việt trực tiếp khi học sinh bấm mic nói chuyện với Trợ lý Nova."],
        ["4", "Web Audio API", "Tích hợp sẵn trên trình duyệt", "Phát âm thanh hiệu ứng thí nghiệm và nhạc nền học tập."]
    ]

    t3 = doc.add_table(rows=len(table3_data), cols=4)
    t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    t3.autofit = False
    col_widths3 = [Inches(0.6), Inches(2.2), Inches(1.8), Inches(2.2)]

    for row_idx, row in enumerate(t3.rows):
        is_header = (row_idx == 0)
        for col_idx, cell in enumerate(row.cells):
            cell.width = col_widths3[col_idx]
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            text = table3_data[row_idx][col_idx]
            if is_header:
                set_cell_background(cell, "1B365D")
                format_cell_text(cell, text, bold=True, font_size=10, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(255,255,255))
            else:
                bg = "F4F6F9" if row_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg)
                align = WD_ALIGN_PARAGRAPH.CENTER if col_idx == 0 else WD_ALIGN_PARAGRAPH.LEFT
                format_cell_text(cell, text, bold=False, font_size=9.5, align=align, color_rgb=(30,30,30))

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Section 5
    add_styled_heading(doc, "V. KÊ KHAI THƯ VIỆN VÀ MÃ NGUỒN MỞ", 1)
    table4_data = [
        ["STT", "Tên thư viện / mã nguồn mở", "Phiên bản", "Mục đích sử dụng trong sản phẩm", "Giấy phép"],
        ["1", "Next.js / React", "16.2 / 19.0", "Framework chính dựng giao diện website và hệ thống API.", "MIT License"],
        ["2", "TensorFlow.js / Face-API", "4.x / 1.7.x", "Thư viện hỗ trợ tính năng quét khuôn mặt xác thực 2FA.", "Apache 2.0 / MIT"],
        ["3", "KaTeX", "0.16.x", "Hiển thị công thức Toán, Lý, Hóa đẹp mắt trên web.", "MIT License"],
        ["4", "Tailwind CSS & Framer Motion", "3.4 / 11.x", "Thiết kế giao diện đẹp, mượt mà và tương thích các thiết bị.", "MIT License"],
        ["5", "Zustand & LocalForage", "4.5 / 1.10", "Quản lý trạng thái và lưu trữ bộ nhớ dữ liệu trên trình duyệt.", "MIT License"],
        ["6", "Lucide React Icons", "0.4x", "Bộ biểu tượng đồ họa khoa học.", "ISC License"]
    ]

    t4 = doc.add_table(rows=len(table4_data), cols=5)
    t4.alignment = WD_TABLE_ALIGNMENT.CENTER
    t4.autofit = False
    col_widths4 = [Inches(0.5), Inches(2.0), Inches(1.1), Inches(2.1), Inches(1.1)]

    for row_idx, row in enumerate(t4.rows):
        is_header = (row_idx == 0)
        for col_idx, cell in enumerate(row.cells):
            cell.width = col_widths4[col_idx]
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            text = table4_data[row_idx][col_idx]
            if is_header:
                set_cell_background(cell, "1B365D")
                format_cell_text(cell, text, bold=True, font_size=10, align=WD_ALIGN_PARAGRAPH.CENTER, color_rgb=(255,255,255))
            else:
                bg = "F4F6F9" if row_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg)
                align = WD_ALIGN_PARAGRAPH.CENTER if col_idx in [0, 1, 4] else WD_ALIGN_PARAGRAPH.LEFT
                format_cell_text(cell, text, bold=False, font_size=9.5, align=align, color_rgb=(30,30,30))

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Section 6
    add_styled_heading(doc, "VI. CAM KẾT BẢN QUYỀN", 1)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run("Nhóm phát triển xin cam kết toàn bộ thư viện mã nguồn mở nêu trên đều được sử dụng hợp pháp theo đúng các giấy phép nguồn mở tương ứng. Toàn bộ nội dung bài học, ngân hàng câu hỏi và mã nguồn giao diện của dự án STEM HUB là sản phẩm tự thực hiện của nhóm học sinh Trường THPT Quỳnh Lưu 4.")
    run.font.name = 'Calibri'
    run.font.size = Pt(11)

    file_path = "e:/project/cuoc_thi_AI/Ke_Khai_Cong_Cu_AI_Du_Lieu_API_Thu_Vien_Ma_Nguon_Mo.docx"
    doc.save(file_path)
    print("Saved Doc2 successfully!")

if __name__ == '__main__':
    build_doc1()
    build_doc2()
