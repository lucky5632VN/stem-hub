# -*- coding: utf-8 -*-
"""
Tạo tài liệu Word Kịch bản Video thuyết trình 5 phút STEM HUB
Cuộc thi Sáng tạo trẻ Quốc gia về Trí tuệ Nhân tạo 2026
Phiên bản 7 Cảnh: NGÔN NGỮ PHỔ THÔNG — 100% TRUNG THỰC KHOA HỌC
Sử dụng python-docx
"""

import sys
from pathlib import Path
from docx import Document
from docx.shared import Pt, RGBColor, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / "Kich_Ban_Video_STEM_HUB_5_Phut.docx"
OUT_PATH_UPDATE = ROOT / "Kich_Ban_Video_STEM_HUB_5_Phut_CapNhat.docx"

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=140, bottom=140, left=200, right=200):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def set_cell_border(cell, **kwargs):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}/>')
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        edge_data = kwargs.get(edge)
        if edge_data:
            tag = f'<w:{edge} {nsdecls("w")} w:val="{edge_data.get("val", "single")}" w:sz="{edge_data.get("sz", 4)}" w:space="0" w:color="{edge_data.get("color", "auto")}"/>'
            tcBorders.append(parse_xml(tag))
        else:
            tag = f'<w:{edge} {nsdecls("w")} w:val="none"/>'
            tcBorders.append(parse_xml(tag))
    tcPr.append(tcBorders)

def build_docx():
    doc = Document()

    # Cấu hình lề trang (2cm chuẩn A4)
    sections = doc.sections
    for section in sections:
        section.top_margin = Cm(2.0)
        section.bottom_margin = Cm(2.0)
        section.left_margin = Cm(2.2)
        section.right_margin = Cm(2.0)

    # Style mặc định: Times New Roman
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(11.5)
    font.color.rgb = RGBColor(0x22, 0x22, 0x22)

    # 1. Header / Tiêu đề chính
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("CUỘC THI SÁNG TẠO TRẺ QUỐC GIA VỀ TRÍ TUỆ NHÂN TẠO 2026\nĐƠN VỊ DỰ THI: NHÓM PHÁT TRIỂN STEM HUB — TRƯỜNG THPT QUỲNH LƯU 4, NGHỆ AN")
    r_sub.font.size = Pt(11)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(0x4A, 0x60, 0x7A)
    p_sub.paragraph_format.space_after = Pt(4)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("🎬 KỊCH BẢN VIDEO THUYẾT TRÌNH 5 PHÚT — STEM HUB")
    r_title.font.size = Pt(17)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x1A, 0x36, 0x5D)
    p_title.paragraph_format.space_after = Pt(4)

    p_desc = doc.add_paragraph()
    p_desc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_desc = p_desc.add_run("Trang web học tập trực tuyến tích hợp AI — Đấu trường, Phòng thí nghiệm ảo & Trợ lý NOVA\nPhong cách diễn đạt: Ngôn ngữ phổ thông, trong sáng, dễ hiểu — 100% Trung thực khoa học\nTổng thời lượng: 5:00 phút (300 giây) | Tổng số từ lời thoại: ~815 từ | Tốc độ chuẩn: ~163 từ/phút")
    r_desc.font.size = Pt(10.5)
    r_desc.font.italic = True
    r_desc.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
    p_desc.paragraph_format.space_after = Pt(14)

    # 2. Bảng thông số kỹ thuật sản xuất
    p_h1 = doc.add_paragraph()
    r_h1 = p_h1.add_run("I. THÔNG SỐ SẢN XUẤT VIDEO")
    r_h1.font.size = Pt(13)
    r_h1.font.bold = True
    r_h1.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)
    p_h1.paragraph_format.space_after = Pt(6)

    table_spec = doc.add_table(rows=6, cols=2)
    table_spec.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_spec.style = 'Table Grid'
    spec_data = [
        ("Tổng thời lượng", "5 phút 00 giây (300 giây) — Tuân thủ tuyệt đối quy định cuộc thi"),
        ("Tổng số phân cảnh", "7 Cảnh (bố cục rõ ràng, mạch lạc, dùng ngôn ngữ học sinh phổ thông dễ hiểu)"),
        ("Tổng số từ lời thoại", "~815 từ tiếng Việt (vừa vặn, tự nhiên, ngắt nghỉ đúng câu, 100% trung thực)"),
        ("Tốc độ phát âm chuẩn", "~163 từ/phút — Tốc độ vừa phải: đĩnh đạc, rõ ràng, tự nhiên, truyền cảm, dễ nghe"),
        ("Hình thức trình bày", "Mở đầu (Cảnh 1) & Kết thúc (Cảnh 7): Cả nhóm nói trực tiếp trước máy quay\nThân bài (Cảnh 2 – 6): Quay màn hình thao tác thật + Lồng tiếng thuyết minh"),
        ("Độ phân giải & Âm thanh", "1080p hoặc 4K 60fps; Micro cài áo lọc ồn, nhạc nền lofi nhẹ nhàng (-22dB)")
    ]
    for idx, (lbl, val) in enumerate(spec_data):
        row = table_spec.rows[idx]
        cell_lbl, cell_val = row.cells[0], row.cells[1]
        cell_lbl.width = Inches(1.8)
        cell_val.width = Inches(5.0)
        set_cell_background(cell_lbl, "F0F4F8")
        set_cell_margins(cell_lbl, top=100, bottom=100, left=150, right=150)
        set_cell_margins(cell_val, top=100, bottom=100, left=150, right=150)
        
        p0 = cell_lbl.paragraphs[0]
        r0 = p0.add_run(lbl)
        r0.font.bold = True
        r0.font.size = Pt(10.5)
        
        p1 = cell_val.paragraphs[0]
        r1 = p1.add_run(val)
        r1.font.size = Pt(10.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 3. Bảng phân bổ thời lượng 7 cảnh
    p_h2 = doc.add_paragraph()
    r_h2 = p_h2.add_run("II. BẢNG PHÂN BỔ THỜI LƯỢNG & PHÂN CẢNH (7 CẢNH)")
    r_h2.font.size = Pt(13)
    r_h2.font.bold = True
    r_h2.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)
    p_h2.paragraph_format.space_after = Pt(6)

    scenes_summary = [
        ("Cảnh", "Phân cảnh & Nội dung chính", "Mốc thời gian", "Thời lượng", "Số từ", "Hình thức thể hiện"),
        ("1", "Mở đầu: Nhóm tác giả & Mục tiêu của STEM HUB", "0:00 – 0:25", "25s", "~75", "Nói trước máy quay (học sinh tự tin, khiêm tốn)"),
        ("2", "Các trợ lý AI trong STEM HUB & Lợi ích học tập (TRỌNG TÂM)", "0:25 – 2:20", "115s (1:55)", "~310", "Quay màn hình 4 phòng Lab + Đấu trường + Thuyết minh"),
        ("3", "Hành trình tự kiểm tra và sửa chữa sai sót (ĐIỂM NHẤN TRUNG THỰC)", "2:20 – 3:10", "50s", "~130", "Quay đoạn code thật: Tự sửa lỗi phân quyền, tự học thật"),
        ("4", "Khả năng tự học thêm & Các bạn Bot thi đấu", "3:10 – 3:55", "45s", "~110", "Màn hình quản trị: AI tự chỉnh độ nhạy, 20 Bot thích nghi"),
        ("5", "Xác thực 2 bước bằng khuôn mặt (Face 2FA)", "3:55 – 4:25", "30s", "~95", "Bảo vệ tài khoản: Tùy chọn bật/tắt; nếu bật thì quét mặt và chớp mắt"),
        ("6", "Công khai những điểm còn hạn chế của dự án", "4:25 – 4:50", "25s", "~75", "Trang minh bạch: Thừa nhận dữ liệu cấp THPT vừa phải"),
        ("7", "Kết thúc: Lời cảm ơn & Tinh thần học tập chân chính", "4:50 – 5:00", "10s", "~30", "Cả nhóm gửi lời cảm ơn chân thành đến Ban Giám khảo")
    ]

    table_scenes = doc.add_table(rows=len(scenes_summary), cols=6)
    table_scenes.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_scenes.style = 'Table Grid'
    col_widths = [Inches(0.6), Inches(2.3), Inches(1.0), Inches(0.8), Inches(0.6), Inches(1.5)]

    for row_idx, row_data in enumerate(scenes_summary):
        row = table_scenes.rows[row_idx]
        is_hdr = (row_idx == 0)
        bg_color = "1F4E79" if is_hdr else ("F7FAFC" if row_idx % 2 == 1 else "FFFFFF")
        
        for col_idx, text in enumerate(row_data):
            cell = row.cells[col_idx]
            cell.width = col_widths[col_idx]
            set_cell_background(cell, bg_color)
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if col_idx in [0, 2, 3, 4] else WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(text)
            r.font.size = Pt(9.5)
            if is_hdr:
                r.font.bold = True
                r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            elif row_idx in [1, 2]:  # Highlight Scene 2 and 3
                if col_idx == 1:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(0x99, 0x1B, 0x1B)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # 4. Chi tiết từng phân cảnh (Detailed Cue Cards)
    p_h3 = doc.add_paragraph()
    r_h3 = p_h3.add_run("III. CHI TIẾT LỜI THOẠI & KỊCH BẢN THỰC HIỆN TỪNG CẢNH")
    r_h3.font.size = Pt(13)
    r_h3.font.bold = True
    r_h3.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)
    p_h3.paragraph_format.space_after = Pt(6)

    scenes_data = [
        {
            "num": "1",
            "title": "MỞ ĐẦU: NHÓM TÁC GIẢ & MỤC TIÊU CỦA STEM HUB",
            "time": "0:00 – 0:25",
            "duration": "25 giây",
            "words": "~75 từ",
            "format": "Cả nhóm nói trước máy quay (Talking Head)",
            "visual": "Cả nhóm đứng nghiêm túc, tươi tắn trước sản phẩm hoặc bảng tên đội; ánh sáng rõ mặt; logo STEM HUB ở góc màn hình hoặc màn chiếu phía sau.",
            "purpose": "Giới thiệu con người thật đứng sau dự án — tạo thiện cảm tự nhiên, thể hiện rõ tinh thần học sinh tự làm.",
            "speaker": "1 hoặc 2 bạn thay nhau nói",
            "script": '“Xin chào Hội đồng Giám khảo. Chúng em là nhóm phát triển dự án STEM HUB, đến từ Trường THPT Quỳnh Lưu 4, Nghệ An.\n\n'
                      'STEM HUB là một trang web học tập nơi học sinh chúng em có thể vừa ôn bài, vừa làm thí nghiệm ảo an toàn và thi đấu kiến thức cùng nhau. Đứng sau hỗ trợ người học là các trợ lý AI và những mô hình tự học do chính chúng em tìm tòi, huấn luyện và đưa vào hệ thống, dùng chung một kho kiến thức các môn học phổ thông.”'
        },
        {
            "num": "2",
            "title": "CÁC TRỢ LÝ AI TRONG STEM HUB VÀ LỢI ÍCH THỰC TẾ (CẢNH TRỌNG TÂM)",
            "time": "0:25 – 2:20",
            "duration": "115 giây (1 phút 55 giây)",
            "words": "~310 từ",
            "format": "Quay màn hình thao tác thật + Lồng tiếng thuyết minh",
            "visual": "Lướt màn hình chậm rãi qua từng phòng và Đấu trường tương ứng lời đọc:\n1. Trợ lý Nova: Mở khung chat, nói một câu vào micro hoặc gõ tin nhắn viết tắt, Nova trả lời và chuyển trang.\n2. Phòng Hóa: Thấy 2 khung AI — một bên tự động cảnh báo khi trộn hóa chất trong ống nghiệm, một bên giải bài tập hóa.\n3. Phòng Lý: Mở khung chat của trợ lý Lý, gõ câu hỏi thắc mắc về bài tập quang học hoặc hiện tượng vật lý, AI giải thích chi tiết và đưa ra công thức.\n4. Phòng Sinh: Mở khung chat của trợ lý Sinh, gõ hỏi về bài tập di truyền Men-đen hoặc cấu trúc ADN, AI giải đáp cặn kẽ từng bước.\n5. Phòng Toán: 3 AI phối hợp — giải toán, vẽ hình 3D xoay nhiều góc và tự kẻ thêm đường phụ khi hỏi.\n6. Đấu trường 1v1: Thấy bạn Bot AI thi đấu, biết dùng các thẻ bài hỗ trợ như người thật.",
            "purpose": "PHÂN CẢNH TRỌNG TÂM NHẤT — Dùng lời ăn tiếng nói bình dị, dễ hiểu để giám khảo thấy rõ: Có những con AI nào và mỗi con AI giúp gì cho việc học của học sinh.",
            "speaker": "Thành viên lồng tiếng thuyết minh (Voice-over)",
            "script": '“Khi ôn thi, chúng em thấy các bạn thường gặp khó khăn vì vừa phải nhớ lý thuyết khô khan, vừa thiếu dụng cụ làm thí nghiệm thực tế. Vì vậy, từ một kho kiến thức chung của bốn môn Toán, Lý, Hóa, Sinh, chúng em đã xây dựng các trợ lý AI để hỗ trợ từng môn học:\n\n'
                      'Đầu tiên là trợ lý Nova — giống như một người dẫn đường thông minh. Nova có thể nghe giọng nói hoặc đọc tin nhắn gõ nhanh, kể cả tiếng lóng hay từ viết tắt của học sinh, để giải đáp thắc mắc và mở ngay phòng thí nghiệm mà bạn cần.\n\n'
                      'Ở phòng Hóa, chúng em có hai con AI: một con theo dõi trực tiếp các chất học sinh đang trộn trong ống nghiệm ảo để giải thích hiện tượng và nhắc nhở nguy cơ mất an toàn; con AI thứ hai chuyên hướng dẫn giải bài tập tính nồng độ, độ pH hay cân bằng phương trình.\n\n'
                      'Ở phòng Lý, có một trợ lý AI chuyên giải đáp thắc mắc và hướng dẫn các bài tập Vật lý — từ cơ học, điện học cho đến quang học.\n\n'
                      'Ở phòng Sinh, có một trợ lý AI chuyên giải thích sâu các kiến thức Sinh học — từ các quy luật di truyền Men-đen, bài tập ADN cho đến sinh thái học.\n\n'
                      'Đặc biệt ở phòng Toán, có ba con AI cùng phối hợp: một con hướng dẫn giải bài từng bước; một con đọc đề bài hình học để tự dựng ngay khối hình 3D trên màn hình; và con AI thứ ba sẽ tương tác trực tiếp — khi bạn thắc mắc về khoảng cách hay góc, AI sẽ tô màu nổi bật và tự kẻ thêm đường cao hay đường chéo phụ lên hình 3D để học sinh dễ nhìn.\n\n'
                      'Cuối cùng, trong Đấu trường, có một bạn Bot AI sẵn sàng thi đấu một chọi một với học sinh, biết dùng các thẻ bài chiến thuật và tự đổi độ khó cho vừa sức với người chơi.”'
        },
        {
            "num": "3",
            "title": "HÀNH TRÌNH TỰ KIỂM TRA VÀ SỬA CHỮA SAI SÓT (ĐIỂM NHẤN TRUNG THỰC)",
            "time": "2:20 – 3:10",
            "duration": "50 giây",
            "words": "~130 từ",
            "format": "Quay màn hình thao tác thật + Lồng tiếng thuyết minh",
            "visual": "Quay các dòng lệnh terminal chạy test thật, lướt qua đoạn code trước và sau khi sửa lỗi (git diff). Hiện chữ phụ đề to rõ: 'Thừa nhận sai sót & Tự sửa bằng thuật toán thật', 'Kiểm tra với 33 tình huống'.",
            "purpose": "ĐIỂM NHẤN TRUNG THỰC & BẢN LĨNH HỌC SINH — Chứng minh học sinh tự hiểu bản chất kỹ thuật, dám nhận lỗi và tự sửa lỗi, không dùng số liệu ảo.",
            "speaker": "Thành viên lồng tiếng thuyết minh (Voice-over)",
            "script": '“Thưa Ban Giám khảo, điều chúng em tự hào nhất không phải là những lời khen hay kết quả đẹp, mà là hành trình tự tìm ra và sửa chữa những lỗi sai của chính mình.\n\n'
                      'Ở phiên bản đầu tiên, có một phần tính toán được gắn nhãn là \'mô hình mạng nơ-ron\', nhưng thực chất lúc đó chỉ là công thức viết tay, máy chưa từng tự học được gì cả. Khi nhận ra, chúng em đã dũng cảm viết lại hoàn toàn bằng thuật toán huấn luyện thật để máy tự học từ dữ liệu.\n\n'
                      'Chúng em cũng từng phát hiện một lỗi trong quy tắc phân quyền, khiến người dùng bình thường cũng có thể sửa đề thi. Chúng em đã tự viết lại các quy tắc bảo vệ và thử nghiệm thành công với 33 tình huống cố tình vào sửa trái phép. Với chúng em, một sản phẩm đáng tin cậy là khi người làm ra nó hiểu rõ bản chất và biết nó có thể sai ở đâu để sửa.”'
        },
        {
            "num": "4",
            "title": "KHẢ NĂNG TỰ HỌC THÊM VÀ CÁC BẠN BOT THI ĐẤU",
            "time": "3:10 – 3:55",
            "duration": "45 giây",
            "words": "~110 từ",
            "format": "Quay màn hình thao tác thật + Lồng tiếng thuyết minh",
            "visual": "Quay màn hình trang quản trị (Admin Dashboard) — biểu đồ tự học cập nhật; quay cảnh học sinh thử làm một bài tập; bảng danh sách 20 Bot đang tự điều chỉnh chỉ số.",
            "purpose": "Giải thích việc AI thích ứng và thông minh lên bằng cách nói bình dị, dễ hiểu, có minh chứng thực tế trên trang quản trị.",
            "speaker": "Thành viên lồng tiếng thuyết minh (Voice-over)",
            "script": '“Để các trợ lý AI ngày càng hiểu học sinh hơn, chúng em xây dựng cơ chế tự học ngay trên trình duyệt: mỗi khi bạn làm xong một bài tập hay tương tác, mô hình sẽ tự điều chỉnh lại độ nhạy và lưu lại ngay trên máy tính, để lần sau mở lên kiến thức không bị mất đi.\n\n'
                      'Song song đó, 20 bạn Bot trong Đấu trường cũng được áp dụng thuật toán tiến hóa: sau mỗi trận đấu, Bot sẽ tự động điều chỉnh tốc độ trả lời và độ chính xác cho phù hợp với sức học của từng bạn.\n\n'
                      'Tất cả những thay đổi này đều có biểu đồ theo dõi trực tiếp trên trang quản trị, giúp Ban Giám khảo thấy rõ AI của chúng em đang tự học thật qua từng ngày.”'
        },
        {
            "num": "5",
            "title": "TÍNH NĂNG XÁC THỰC 2 BƯỚC BẰNG KHUÔN MẶT (FACE 2FA)",
            "time": "3:55 – 4:25",
            "duration": "30 giây",
            "words": "~95 từ",
            "format": "Quay màn hình thao tác đăng nhập có xác thực khuôn mặt",
            "visual": "Quay màn hình đăng nhập một tài khoản có bật tính năng này: sau khi gõ mật khẩu, webcam hiện lên quét khuôn mặt và phát hiện một cái chớp mắt tự nhiên để xác nhận người thật rồi vào trang web. Quay thêm nút bật/tắt tính năng trong phần Cài đặt tài khoản.",
            "purpose": "Giới thiệu tính năng bảo mật tài khoản 2 bước (Face 2FA) thông minh và tiện lợi, người dùng có toàn quyền bật hoặc tắt trong phần cài đặt cá nhân.",
            "speaker": "Thành viên lồng tiếng thuyết minh (Voice-over)",
            "script": '“Để bảo vệ tài khoản cho học sinh, chúng em có phát triển thêm một tính năng xác thực hai bước bằng khuôn mặt, mà bạn có thể chủ động bật hoặc tắt trong phần cài đặt.\n\n'
                      'Nếu tài khoản đang bật tính năng này, sau khi nhập mật khẩu, hệ thống sẽ yêu cầu quét khuôn mặt và chớp mắt một lần để xác nhận đúng người thật đang đăng nhập. Còn nếu bạn không bật thì vẫn đăng nhập bình thường như các trang web khác.\n\n'
                      'Toàn bộ quá trình quét mặt này được xử lý trực tiếp trên trình duyệt máy tính của bạn, camera không gửi bất kỳ hình ảnh nào ra bên ngoài, đảm bảo an toàn riêng tư tuyệt đối.”'
        },
        {
            "num": "6",
            "title": "CÔNG KHAI NHỮNG ĐIỂM CÒN HẠN CHẾ CỦA DỰ ÁN",
            "time": "4:25 – 4:50",
            "duration": "25 giây",
            "words": "~75 từ",
            "format": "Quay màn hình trang Hồ sơ Minh bạch AI trên web",
            "visual": "Cuộn chuột qua trang minh bạch, dừng lại ở mục liệt kê rõ các giới hạn của hệ thống.",
            "purpose": "Thể hiện đạo đức nghiên cứu và sự trung thực của học sinh, tạo ấn tượng rất tốt với giám khảo trước khi kết thúc.",
            "speaker": "Thành viên lồng tiếng thuyết minh (Voice-over)",
            "script": '“Chúng em cũng dành riêng một trang công khai rõ những điểm còn hạn chế của sản phẩm: số lượng câu hỏi và dữ liệu huấn luyện hiện tại mới ở mức vừa phải, tập trung chủ yếu trong chương trình cấp ba.\n\n'
                      'Chúng em tin rằng một đội thi học sinh dám nói thẳng những gì mình đã làm được và những gì còn thiếu sót, sẽ đáng tin cậy hơn nhiều so với việc khoe khoang những con số hoàn hảo nhưng không có thật.”'
        },
        {
            "num": "7",
            "title": "KẾT THÚC: LỜI CẢM ƠN VÀ THÔNG ĐIỆP",
            "time": "4:50 – 5:00",
            "duration": "10 giây",
            "words": "~30 từ",
            "format": "Cả nhóm nói trước máy quay (Talking Head)",
            "visual": "Quay lại cả nhóm, nét mặt rạng rỡ, tự tin, mỉm cười; phía sau là màn hình đang hiển thị ứng dụng STEM HUB.",
            "purpose": "Khép lại video bằng hình ảnh con người thật, ấm áp, lễ phép và giàu nhiệt huyết.",
            "speaker": "Cả nhóm đồng thanh hoặc bạn đại diện nói dứt khoát",
            "script": '“Đó là STEM HUB — nơi chúng em học cách làm trí tuệ nhân tạo một cách chân chính, bắt đầu từ việc dám nhìn thẳng vào những thiếu sót của chính mình.\n\n'
                      'Chúng em xin chân thành cảm ơn Hội đồng Giám khảo!”'
        }
    ]

    for sc in scenes_data:
        # Hộp phân cảnh
        tbl = doc.add_table(rows=5, cols=2)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.style = 'Table Grid'
        
        # Tiêu đề scene gộp 2 cột
        cell_hdr = tbl.cell(0, 0)
        cell_hdr.merge(tbl.cell(0, 1))
        set_cell_background(cell_hdr, "1A365D")
        set_cell_margins(cell_hdr, top=100, bottom=100, left=150, right=150)
        p_shdr = cell_hdr.paragraphs[0]
        r_shdr = p_shdr.add_run(f"CẢNH {sc['num']} — {sc['title']}  ({sc['time']} | {sc['duration']} | {sc['words']})")
        r_shdr.font.bold = True
        r_shdr.font.size = Pt(11.5)
        r_shdr.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

        rows_info = [
            ("Hình ảnh & Thao tác quay", sc['visual']),
            ("Mục đích & Tiêu chí", sc['purpose']),
            ("Người thực hiện", f"{sc['speaker']} ({sc['format']})"),
        ]

        for r_i, (lbl, val) in enumerate(rows_info, start=1):
            c_lbl, c_val = tbl.cell(r_i, 0), tbl.cell(r_i, 1)
            c_lbl.width = Inches(1.8)
            c_val.width = Inches(5.0)
            set_cell_background(c_lbl, "F0F4F8")
            set_cell_margins(c_lbl, top=80, bottom=80, left=120, right=120)
            set_cell_margins(c_val, top=80, bottom=80, left=120, right=120)
            
            p_l = c_lbl.paragraphs[0]
            r_l = p_l.add_run(lbl)
            r_l.font.bold = True
            r_l.font.size = Pt(10)
            
            p_v = c_val.paragraphs[0]
            r_v = p_v.add_run(val)
            r_v.font.size = Pt(10)

        # Hàng Lời thoại gộp 2 cột
        c_script = tbl.cell(4, 0)
        c_script.merge(tbl.cell(4, 1))
        set_cell_background(c_script, "FEF9E7")  # Vàng nhẹ ấm cúng cho lời thoại
        set_cell_margins(c_script, top=140, bottom=140, left=180, right=180)
        set_cell_border(c_script, left=dict(val='single', sz=18, color='D97706'))  # Viền cam đậm nổi bật
        
        p_sc_title = c_script.paragraphs[0]
        r_sc_t = p_sc_title.add_run("🎙️ LỜI THOẠI ĐỌC (NGÔN NGỮ PHỔ THÔNG DỄ HIỂU):")
        r_sc_t.font.bold = True
        r_sc_t.font.size = Pt(10.5)
        r_sc_t.font.color.rgb = RGBColor(0xB4, 0x53, 0x09)
        p_sc_title.paragraph_format.space_after = Pt(4)

        # Đoạn thoại chính
        for line in sc['script'].split("\n\n"):
            p_sc = c_script.add_paragraph()
            r_sc = p_sc.add_run(line)
            r_sc.font.bold = True
            r_sc.font.size = Pt(11.5)
            r_sc.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
            p_sc.paragraph_format.space_after = Pt(4)

        doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # 5. Ghi chú quan trọng trước khi quay
    p_h4 = doc.add_paragraph()
    r_h4 = p_h4.add_run("IV. ⚠️ NGUYÊN TẮC QUAN TRỌNG KHI TẬP NÓI & QUAY VIDEO")
    r_h4.font.size = Pt(13)
    r_h4.font.bold = True
    r_h4.font.color.rgb = RGBColor(0xB9, 0x1C, 0x1C)
    p_h4.paragraph_format.space_after = Pt(6)

    notes = [
        ("Cách nói chuyện tự nhiên như học sinh THPT:",
         "Giọng đọc cần tự nhiên, rõ ràng từng từ, không lên gân hay dùng giọng máy móc. Nói như đang chia sẻ chân thành với thầy cô và bạn bè về những điều mình đã tự tay làm được.\nTốc độ chuẩn ~165 từ/phút giúp lời nói thong thả, người nghe dễ tiếp thu trọn vẹn ý tứ."),
        ("4 chi tiết TUYỆT ĐỐI KHÔNG nhắc đến (vì chưa làm hoặc chưa kiểm chứng trong mã nguồn):",
         "❌ Cổng kết nối đám mây Cloudflare Edge Gateway\n❌ Công nghệ xử lý ngầm 60 FPS cho RAG\n❌ Dải điểm ELO bot 50–130\n❌ Tự động tìm trận trong 10 giây\n→ Chỉ nói đúng những gì đang chạy trên máy và đã được kiểm thử thành công."),
        ("Mẹo quay phim chuẩn:",
         "Quay hình trước, thu âm sau: Hãy quay màn hình từng thao tác chuột thật chậm rãi, sau đó nhìn vào video để đọc lời thoại đè lên, hình ảnh và tiếng nói sẽ khớp nhau hoàn hảo.\nỞ Cảnh 2: Khi giọng đọc nhắc đến môn nào, chuột rê vào phóng to đúng phần đó (Nova -> Hóa -> Lý -> Sinh -> Toán -> Đấu trường).")
    ]

    for title, content in notes:
        p_n = doc.add_paragraph()
        r_nt = p_n.add_run(f"• {title}\n")
        r_nt.font.bold = True
        r_nt.font.size = Pt(10.5)
        r_nt.font.color.rgb = RGBColor(0x99, 0x1B, 0x1B)
        
        r_nc = p_n.add_run(content)
        r_nc.font.size = Pt(10.5)
        r_nc.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
        p_n.paragraph_format.space_after = Pt(6)

    # Lưu file
    doc.save(str(OUT_PATH))
    doc.save(str(OUT_PATH_UPDATE))
    print(f"[OK] Da xuat tai lieu Word thanh cong: {OUT_PATH}")
    print(f"[OK] Da xuat ban sao cap nhat: {OUT_PATH_UPDATE}")

if __name__ == "__main__":
    build_docx()
