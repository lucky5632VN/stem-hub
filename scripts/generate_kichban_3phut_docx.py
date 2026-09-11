# -*- coding: utf-8 -*-
"""
Tạo tài liệu Word Kịch bản Video Demo 3 phút (180 giây) STEM HUB
Cuộc thi Sáng tạo trẻ Quốc gia về Trí tuệ Nhân tạo 2026
Định dạng trình bày: CHUẨN ĐỒNG BỘ 100% VỚI KỊCH BẢN 5 PHÚT
- Bảng thông số kỹ thuật (Specification)
- Bảng phân bổ thời lượng & phân cảnh (Summary Table)
- Chi tiết từng phân cảnh (Hộp Cue Card Table Grid riêng biệt, nền vàng kem, viền cam đậm)
- Bản đọc thu âm liên tục (Voiceover Master Text)
- Nguyên tắc quan trọng khi tập nói & quay video
Sử dụng python-docx
"""

import sys
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from docx import Document
from docx.shared import Pt, RGBColor, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / "Kich_Ban_Video_STEM_HUB_3_Phut.docx"

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
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

    # Cấu hình lề trang chuẩn A4 (2cm)
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
    font.size = Pt(11)
    font.color.rgb = RGBColor(0x22, 0x22, 0x22)

    # =========================================================================
    # 1. HEADER TIÊU ĐỀ CHÍNH
    # =========================================================================
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("CUỘC THI SÁNG TẠO TRẺ QUỐC GIA VỀ TRÍ TUỆ NHÂN TẠO 2026\nĐƠN VỊ DỰ THI: NHÓM PHÁT TRIỂN STEM HUB — TRƯỜNG THPT QUỲNH LƯU 4, NGHỆ AN")
    r_sub.font.size = Pt(10.5)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(0x4A, 0x60, 0x7A)
    p_sub.paragraph_format.space_after = Pt(4)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("🎬 KỊCH BẢN VIDEO DEMO 3 PHÚT (180 GIÂY) — STEM HUB")
    r_title.font.size = Pt(16.5)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x1A, 0x36, 0x5D)
    p_title.paragraph_format.space_after = Pt(4)

    p_desc = doc.add_paragraph()
    p_desc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_desc = p_desc.add_run(
        "Định dạng: Mở đầu người lên hình (12s) ➔ Chuyển hẳn sang quay màn hình thao tác thật (168s) + Lồng tiếng thuyết minh\n"
        "Điểm nhấn: Phủ đều 7 nhân vật AI (Face 2FA, NOVA HUD, Lab Toán, Lab Lý, Lab Hóa 2 AI, Lab Sinh, AI Đấu trường)\n"
        "Tổng thời lượng: 3:00 phút (180 giây) | Tổng số từ lời thoại: ~416 từ | Tốc độ đọc chuẩn: ~138 từ/phút"
    )
    r_desc.font.size = Pt(10)
    r_desc.font.italic = True
    r_desc.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
    p_desc.paragraph_format.space_after = Pt(14)

    # =========================================================================
    # 2. PHẦN I: THÔNG SỐ SẢN XUẤT VIDEO
    # =========================================================================
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
        ("Tổng thời lượng", "3 phút 00 giây (180 giây) — Đúng tiêu chuẩn video giới thiệu súc tích của Cuộc thi"),
        ("Tổng số phân cảnh", "9 Cảnh (chia nhịp chuẩn xác: 12s - 18s - 24s - 30s, ngôn ngữ học sinh phổ thông)"),
        ("Tổng số từ lời thoại", "~416 từ tiếng Việt (vừa vặn, tự nhiên, ngắt nghỉ đúng nhịp, 100% trung thực)"),
        ("Tốc độ phát âm chuẩn", "~138 từ/phút — Tốc độ thong thả, đĩnh đạc, rõ ràng, truyền cảm, có khoảng thở cho SFX"),
        ("Hình thức trình bày", "Mở đầu (Cảnh 1): 1 bạn học sinh đứng trước máy quay nói trực tiếp (Talking-head)\nThân bài & Kết (Cảnh 2 – 9): Quay màn hình thao tác thật 100% + Lồng tiếng thuyết minh"),
        ("Độ phân giải & Âm thanh", "1080p 60fps; Voice-over -3dB đến -6dB; Nhạc nền Lofi/Epic -22dB (Audio Ducking khi có thoại)")
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

    # =========================================================================
    # 3. PHẦN II: BẢNG PHÂN BỔ THỜI LƯỢNG & PHÂN CẢNH (9 CẢNH)
    # =========================================================================
    p_h2 = doc.add_paragraph()
    r_h2 = p_h2.add_run("II. BẢNG PHÂN BỔ THỜI LƯỢNG & PHÂN CẢNH (9 CẢNH)")
    r_h2.font.size = Pt(13)
    r_h2.font.bold = True
    r_h2.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)
    p_h2.paragraph_format.space_after = Pt(6)

    scenes_summary = [
        ("Cảnh", "Phân cảnh & Nội dung chính", "Mốc thời gian", "Thời lượng", "Số từ", "Hình thức thể hiện"),
        ("1", "Mở đầu: Bạn học sinh & 7 Trợ lý AI STEM HUB", "0:00 – 0:12", "12s", "~34", "Nói trước máy quay (học sinh tươi tắn, tự tin)"),
        ("2", "Đăng nhập bảo mật Sinh trắc học (Face 2FA)", "0:12 – 0:30", "18s", "~42", "Quay màn hình: Quét 68 điểm mốc & chớp mắt"),
        ("3", "Trợ lý Chỉ huy Tổng NOVA HUD & Điều hướng", "0:30 – 0:48", "18s", "~39", "Quay màn hình: Bấm Alt+U, voice command, chuyển lab"),
        ("4", "Lab Toán học 3D: Khối không gian & AI Thích ứng", "0:48 – 1:06", "18s", "~41", "Quay màn hình: Xoay hình 3D, kẻ đường phụ, KaTeX"),
        ("5", "Lab Vật Lý: Phản xạ Laser & AI Chẩn đoán kNN", "1:06 – 1:24", "18s", "~39", "Quay màn hình: Bẻ tia laser, chẩn đoán góc lệch"),
        ("6", "Lab Hóa học Ảo: Bộ đôi AI Giám sát & AI Cố vấn", "1:24 – 1:48", "24s", "~46", "Quay màn hình: Cảnh báo rủi ro & phương trình ion"),
        ("7", "Lab Sinh học: Quy luật Di truyền & Xác suất Bayes", "1:48 – 2:06", "18s", "~39", "Quay màn hình: Chuỗi ADN, phép lai Mendel 9:3:3:1"),
        ("8", "Đấu trường Tri thức 1v1: Tranh tài cùng AI Bot", "2:06 – 2:36", "30s", "~50", "Quay màn hình: Tung thẻ bài, đóng băng, ELO tăng"),
        ("9", "Kết thúc: Thông điệp 'Học thật, hiểu thật, tiến bộ thật'", "2:36 – 3:00", "24s", "~29", "Quay màn hình: Toàn cảnh Dashboard & logo lớn")
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
            elif row_idx in [6, 8]:  # Highlight Lab Hóa (2 AI) và Đấu trường
                if col_idx == 1:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(0x99, 0x1B, 0x1B)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # =========================================================================
    # 4. PHẦN III: CHI TIẾT LỜI THOẠI & KỊCH BẢN THỰC HIỆN TỪNG CẢNH (HỘP CUE CARDS)
    # =========================================================================
    p_h3 = doc.add_paragraph()
    r_h3 = p_h3.add_run("III. CHI TIẾT LỜI THOẠI & KỊCH BẢN THỰC HIỆN TỪNG CẢNH")
    r_h3.font.size = Pt(13)
    r_h3.font.bold = True
    r_h3.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)
    p_h3.paragraph_format.space_after = Pt(6)

    scenes_data = [
        {
            "num": "1",
            "title": "MỞ ĐẦU: BẠN HỌC SINH & 7 TRỢ LÝ AI STEM HUB",
            "time": "0:00 – 0:12",
            "duration": "12 giây",
            "words": "~34 từ",
            "format": "Học sinh nói trực tiếp trước máy quay (Talking-head)",
            "visual": "Bạn học sinh mặc đồng phục chỉnh tề, đứng tươi tắn, phong thái tự nhiên trước màn hình lớn đang chiếu giao diện STEM HUB phát sáng neon. Ánh sáng rõ mặt; camera góc trung bắt trọn biểu cảm.",
            "purpose": "Tạo ấn tượng con người thật, cuốn hút người xem ngay từ giây đầu tiên — khẳng định tính độc đáo khi có tới 7 trợ lý AI chuyên biệt.",
            "speaker": "Bạn học sinh đại diện nhóm",
            "audio": "Nhạc nền điện tử nhẹ nhàng, tươi sáng. SFX tiếng 'whoosh' chuyển cảnh sắc bén ở giây thứ 11.",
            "script": '“Xin chào! Đây là STEM HUB — nơi tụi mình học Toán, Lý, Hóa, Sinh cùng với không phải một, mà là bảy trợ lý AI hoàn toàn khác biệt. Khám phá ngay cùng chúng mình nhé!”'
        },
        {
            "num": "2",
            "title": "ĐĂNG NHẬP BẢO MẬT SINH TRẮC HỌC (AI 1: FACE 2FA)",
            "time": "0:12 – 0:30",
            "duration": "18 giây",
            "words": "~42 từ",
            "format": "Quay màn hình thao tác thật + Lồng tiếng thuyết minh",
            "visual": "Màn hình đăng nhập hiện modal quét mặt xanh neon. Webcam bắt trọn khuôn mặt học sinh, 68 điểm mốc xanh lá hiện lên, học sinh chớp mắt 1 nhịp. Khung chuyển sang xanh ngọc báo 'Xác thực sinh học thành công' và tự động mở Dashboard.",
            "purpose": "Giới thiệu tính năng bảo mật sinh trắc học Face 2FA ứng dụng ResNet-34 kết hợp thuật toán EAR phát hiện chớp mắt chống giả mạo.",
            "speaker": "Thành viên lồng tiếng thuyết minh (Voice-over)",
            "audio": "SFX tiếng radar quét mặt 'beep... beep', tiếng 'tách' kim loại xác thực thành công. BGM nhịp điệu công nghệ hiện đại bắt đầu dồn lên.",
            "script": '“Đăng nhập không cần mật khẩu — chỉ cần một ánh nhìn. AI nhận diện sinh học của STEM HUB phân biệt chính xác người thật và ảnh giả qua từng cái chớp mắt, bảo mật tài khoản an toàn tuyệt đối ngay trên máy của bạn.”'
        },
        {
            "num": "3",
            "title": "TRỢ LÝ CHỈ HUY TỔNG NOVA HUD & ĐIỀU HƯỚNG THÔNG MINH (AI 2)",
            "time": "0:30 – 0:48",
            "duration": "18 giây",
            "words": "~39 từ",
            "format": "Quay màn hình thao tác thật + Lồng tiếng thuyết minh",
            "visual": "Bấm phím tắt Alt + U, cửa sổ nổi NOVA HUD trượt ra mượt mà. Nhấp vào biểu tượng micro, học sinh nói: 'Mở lab Hóa cho tớ'. NOVA nhận diện giọng nói, nhạc nền tự động hạ nhỏ (Audio Ducking), lệnh điều hướng kích hoạt, màn hình chuyển sang Lab Hóa.",
            "purpose": "Trình diễn Trợ lý AI NOVA HUD với khả năng nhận diện giọng nói tiếng Việt (STT), phân loại ý định Naive Bayes và tự động điều hướng hệ sinh thái.",
            "speaker": "Thành viên lồng tiếng thuyết minh (Voice-over)",
            "audio": "SFX âm thanh mở HUD 'swoosh', tiếng 'ding' nhận lệnh. Nhạc nền tự hạ âm lượng (Audio Ducking) rồi phục hồi mượt mà.",
            "script": '“Đây là NOVA — trợ lý AI chỉ huy toàn hệ thống. Bằng văn bản hay giọng nói, kể cả từ viết tắt, NOVA đều hiểu bạn muốn gì và tự động điều hướng tức thì đến đúng nơi bạn cần.”'
        },
        {
            "num": "4",
            "title": "LAB TOÁN HỌC 3D: KHỐI KHÔNG GIAN & AI THÍCH ỨNG (AI 3)",
            "time": "0:48 – 1:06",
            "duration": "18 giây",
            "words": "~41 từ",
            "format": "Quay màn hình thao tác thật + Lồng tiếng thuyết minh",
            "visual": "Chuột xoay khối chóp / lăng trụ 3D trong không gian đa chiều. Khung AI bên cạnh tự động xuất công thức KaTeX sắc nét, tô sáng các đường chéo và tự kẻ đường cao phụ trên mô hình để hướng dẫn học sinh giải hình học không gian.",
            "purpose": "Minh họa công cụ hình học 3D tương tác kết hợp mô hình IRT thích ứng độ khó theo năng lực học sinh.",
            "speaker": "Thành viên lồng tiếng thuyết minh (Voice-over)",
            "audio": "SFX tiếng xoay khối 3D 'whir... whir', tiếng tinh thể hiện công thức 'crystal clink'. BGM mang âm hưởng tập trung, trí tuệ.",
            "script": '“Trong Lab Toán, những khối hình không gian trừu tượng biến thành mô hình 3D tương tác đa chiều. AI Toán học tự động gợi ý đường phụ, phân tích thể tích và chọn bài tập thích ứng đúng sức học của bạn.”'
        },
        {
            "num": "5",
            "title": "LAB VẬT LÝ: PHẢN XẠ LASER & AI CHẨN ĐOÁN LỖI (AI 4)",
            "time": "1:06 – 1:24",
            "duration": "18 giây",
            "words": "~39 từ",
            "format": "Quay màn hình thao tác thật + Lồng tiếng thuyết minh",
            "visual": "Kéo gương phẳng bẻ đường truyền tia laser phản xạ nhiều lần trúng đích. Cố tình xoay lệch gương, bảng chẩn đoán kNN hiện lên: 'Lệch góc tới 5° - Hãy điều chỉnh lại gương' kèm hướng dẫn khắc phục sai lệch.",
            "purpose": "Trình diễn mô hình kNN Z-Score chẩn đoán chính xác đa lỗi thao tác quang học thời gian thực kết hợp thuật toán ray-tracing.",
            "speaker": "Thành viên lồng tiếng thuyết minh (Voice-over)",
            "audio": "SFX tiếng phóng tia laser 'laser zap', tiếng chẩn đoán cảnh báo nhẹ nhàng 'chime'. BGM tiết tấu mạch lạc.",
            "script": '“Tại Lab Vật Lý, bạn tự tay điều khiển tia laser và lắp ráp mạch điện. Khi thao tác sai, AI Chẩn đoán lập tức phát hiện độ lệch góc tới hay chiết suất, hướng dẫn bạn sửa đúng quy luật tự nhiên.”'
        },
        {
            "num": "6",
            "title": "LAB HÓA HỌC ẢO: BỘ ĐÔI AI GIÁM SÁT & AI CỐ VẤN (AI 5 & 6)",
            "time": "1:24 – 1:48",
            "duration": "24 giây",
            "words": "~46 từ",
            "format": "Quay màn hình thao tác thật + Lồng tiếng thuyết minh",
            "visual": "Rót dung dịch vào cốc nghiệm ảo, dung dịch sôi bọt đổi màu hồng phenolphthalein. AI Giám sát hiện thanh đo rủi ro và nhãn 'Danger' màu đỏ chặn quá nhiệt. AI Cố vấn bên dưới xuất phương trình ion thu gọn và giải thích hiện tượng.",
            "purpose": "Làm nổi bật kiến trúc Hybrid An toàn: Mạng nơ-ron Softmax xuất thước đo rủi ro + Luật an toàn cứng (Circuit Breaker) đảm bảo an toàn tuyệt đối cho học sinh.",
            "speaker": "Thành viên lồng tiếng thuyết minh (Voice-over)",
            "audio": "SFX tiếng rót hóa chất 'liquid pour', tiếng sủi bọt khí 'fizz', âm thanh cảnh báo an toàn 'warning beep'. BGM hồi hộp rồi giải tỏa.",
            "script": '“Lab Hóa là nơi đặc biệt nhất với hai AI song hành. Một AI Giám sát thời gian thực kiểm soát rủi ro, chặn đứng nguy hiểm nếu pha trộn sai nồng độ. Một AI Cố vấn kề bên lập tức giải thích cơ chế phản ứng và phương trình ion chuẩn xác.”'
        },
        {
            "num": "7",
            "title": "LAB SINH HỌC: QUY LUẬT DI TRUYỀN & XÁC SUẤT BAYES (AI 7)",
            "time": "1:48 – 2:06",
            "duration": "18 giây",
            "words": "~39 từ",
            "format": "Quay màn hình thao tác thật + Lồng tiếng thuyết minh",
            "visual": "Màn hình mô phỏng chuỗi xoắn kép ADN. Học sinh chọn phép lai đa gen AaBb x AaBb, bảng xác suất Bayes CPT hiện ra tỷ lệ phân ly kiểu hình 9:3:3:1 trong tích tắc kèm phân tích định luật phân ly độc lập Men-đen.",
            "purpose": "Chứng minh mô hình suy luận xác suất Bayes di truyền đa gen đạt độ chính xác giải tích 100%.",
            "speaker": "Thành viên lồng tiếng thuyết minh (Voice-over)",
            "audio": "SFX tiếng chuỗi xoắn ADN chuyển động nhẹ nhàng, tiếng xác nhận tính toán 'data sweep'. BGM tươi sáng, khoa học.",
            "script": '“Ở Lab Sinh, quy luật di truyền Men-đen không còn là những con số trừu tượng. Mạng suy luận xác suất Bayes tính toán ngay tỷ lệ phân ly kiểu hình của từng thế hệ sau mỗi phép lai đa gen.”'
        },
        {
            "num": "8",
            "title": "ĐẤU TRƯỜNG TRI THỨC 1V1: TRANH TÀI CÙNG AI BOT THÍCH ỨNG",
            "time": "2:06 – 2:36",
            "duration": "30 giây",
            "words": "~50 từ",
            "format": "Quay màn hình thao tác thật + Lồng tiếng thuyết minh",
            "visual": "Ghép trận 1v1 tìm thấy đối thủ Bot. Đồng hồ đếm ngược 180s, hai bên chọn đáp án thần tốc. Người chơi tung thẻ chiêu thức 'Đóng băng đối thủ 500ms', màn hình đối phương phủ tuyết. Kết thúc: Màn hình Chiến thắng rực rỡ, ELO tăng vọt, pha lê nhảy số.",
            "purpose": "Thể hiện đấu trường kiến thức trực tiếp thời gian thực, thuật toán Bot thích ứng độ khó và cơ chế State Batching mượt mà không độ trễ.",
            "speaker": "Thành viên lồng tiếng thuyết minh (Voice-over)",
            "audio": "BGM chuyển sang nhịp nhạc thi đấu Epic dồn dập, tiếng tim đập 'heartbeat'. SFX tiếng thẻ băng vỡ 'freeze crack', chuông chiến thắng 'fanfare'.",
            "script": '“Và đây là nơi mọi kiến thức được thử lửa: Đấu trường Tri thức một chọi một. Học sinh tranh tài thời gian thực cùng bạn bè hoặc so tài với AI Bot thích ứng. Tung chiêu thẻ bài, đóng băng đối thủ, giành giật từng giây để tích lũy ELO và thăng hạng vinh quang!”'
        },
        {
            "num": "9",
            "title": "KẾT THÚC: THÔNG ĐIỆP 'HỌC THẬT, HIỂU THẬT, TIẾN BỘ THẬT'",
            "time": "2:36 – 3:00",
            "duration": "24 giây",
            "words": "~29 từ",
            "format": "Quay màn hình toàn cảnh + Lồng tiếng thuyết minh",
            "visual": "Camera lùi rộng ra toàn cảnh Dashboard và logo lớn STEM HUB phát sáng rực rỡ. Dưới chân trang hiện rõ thông điệp: 'Trường THPT Quỳnh Lưu 4 — Kiến tạo Hệ sinh thái Học tập Số Mở'.",
            "purpose": "Khép lại video bằng thông điệp giáo dục chân chính, lan tỏa tinh thần sáng tạo trẻ và niềm tự hào học sinh THPT.",
            "speaker": "Thành viên lồng tiếng thuyết minh (Voice-over)",
            "audio": "Nhạc ngân vang cao trào rồi từ từ lắng đọng, tạo cảm xúc tự hào, truyền cảm hứng. SFX tiếng lấp lánh 'sparkle'.",
            "script": '“Bảy trợ lý AI, một hệ sinh thái học tập toàn diện — được kiến tạo bởi chính học sinh cho học sinh Việt Nam. STEM HUB: Học thật, hiểu thật, tiến bộ thật!”'
        }
    ]

    for sc in scenes_data:
        # Hộp phân cảnh Table Grid
        tbl = doc.add_table(rows=6, cols=2)
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
        r_shdr.font.size = Pt(11)
        r_shdr.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

        rows_info = [
            ("Hình ảnh & Thao tác quay", sc['visual']),
            ("Mục đích & Tiêu chí", sc['purpose']),
            ("Người thực hiện & Định dạng", f"{sc['speaker']} ({sc['format']})"),
            ("Âm thanh & Nhạc nền", sc['audio']),
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
            r_l.font.size = Pt(9.5)

            p_v = c_val.paragraphs[0]
            r_v = p_v.add_run(val)
            r_v.font.size = Pt(9.5)

        # Hàng Lời thoại gộp 2 cột: Nền vàng kem, viền cam đậm
        c_script = tbl.cell(5, 0)
        c_script.merge(tbl.cell(5, 1))
        set_cell_background(c_script, "FEF9E7")  # Vàng nhẹ ấm cúng
        set_cell_margins(c_script, top=140, bottom=140, left=180, right=180)
        set_cell_border(c_script,
                        left=dict(val='single', sz=18, color='D97706'),
                        top=dict(val='single', sz=4, color='D0D9E0'),
                        bottom=dict(val='single', sz=4, color='D0D9E0'),
                        right=dict(val='single', sz=4, color='D0D9E0'))

        p_sc_title = c_script.paragraphs[0]
        r_sc_t = p_sc_title.add_run("🎙️ LỜI THOẠI ĐỌC (VOICE-OVER / HỌC SINH NÓI):")
        r_sc_t.font.bold = True
        r_sc_t.font.size = Pt(10)
        r_sc_t.font.color.rgb = RGBColor(0xB4, 0x53, 0x09)
        p_sc_title.paragraph_format.space_after = Pt(4)

        # Đoạn thoại chính
        for line in sc['script'].split("\n\n"):
            p_sc = c_script.add_paragraph()
            r_sc = p_sc.add_run(line)
            r_sc.font.bold = True
            r_sc.font.size = Pt(11)
            r_sc.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
            p_sc.paragraph_format.space_after = Pt(4)

        doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # =========================================================================
    # 5. PHẦN IV: BẢN ĐỌC THU ÂM LIÊN TỤC (VOICEOVER MASTER TEXT)
    # =========================================================================
    p_h4 = doc.add_paragraph()
    r_h4 = p_h4.add_run("IV. BẢN ĐỌC THU ÂM LIÊN TỤC (VOICEOVER MASTER SCRIPT)")
    r_h4.font.size = Pt(13)
    r_h4.font.bold = True
    r_h4.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)
    p_h4.paragraph_format.space_after = Pt(4)

    p_note_vo = doc.add_paragraph()
    r_note_vo = p_note_vo.add_run("Dành riêng cho phát thanh viên / người lồng tiếng — Đã đánh dấu ký hiệu ngắt nhịp [nghỉ 0.5s] để khớp chính xác với từng khung hình 180 giây:")
    r_note_vo.font.size = Pt(10)
    r_note_vo.font.italic = True
    r_note_vo.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
    p_note_vo.paragraph_format.space_after = Pt(8)

    vo_paragraphs = [
        ("CẢNH 1 — MỞ ĐẦU (0:00 – 0:12) | HỌC SINH NÓI TRỰC TIẾP",
         "“Xin chào! Đây là STEM HUB — nơi tụi mình học Toán, Lý, Hóa, Sinh cùng với không phải một, mà là bảy trợ lý AI hoàn toàn khác biệt. Khám phá ngay cùng chúng mình nhé!” [nghỉ 1s - cắt màn hình]"),

        ("CẢNH 2 — FACE 2FA (0:12 – 0:30) | VOICE-OVER",
         "“Đăng nhập không cần mật khẩu — chỉ cần một ánh nhìn. [nghỉ 0.5s] AI nhận diện sinh học của STEM HUB phân biệt chính xác người thật và ảnh giả qua từng cái chớp mắt, bảo mật tài khoản an toàn tuyệt đối ngay trên máy của bạn.” [nghỉ 0.5s]"),

        ("CẢNH 3 — NOVA HUD (0:30 – 0:48) | VOICE-OVER",
         "“Đây là NOVA — trợ lý AI chỉ huy toàn hệ thống. [nghỉ 0.5s] Bằng văn bản hay giọng nói, kể cả từ viết tắt, NOVA đều hiểu bạn muốn gì và tự động điều hướng tức thì đến đúng nơi bạn cần.” [nghỉ 0.5s]"),

        ("CẢNH 4 — LAB TOÁN 3D (0:48 – 1:06) | VOICE-OVER",
         "“Trong Lab Toán, những khối hình không gian trừu tượng biến thành mô hình 3D tương tác đa chiều. [nghỉ 0.5s] AI Toán học tự động gợi ý đường phụ, phân tích thể tích và chọn bài tập thích ứng đúng sức học của bạn.” [nghỉ 0.5s]"),

        ("CẢNH 5 — LAB VẬT LÝ (1:06 – 1:24) | VOICE-OVER",
         "“Tại Lab Vật Lý, bạn tự tay điều khiển tia laser và lắp ráp mạch điện. [nghỉ 0.5s] Khi thao tác sai, AI Chẩn đoán lập tức phát hiện độ lệch góc tới hay chiết suất, hướng dẫn bạn sửa đúng quy luật tự nhiên.” [nghỉ 0.5s]"),

        ("CẢNH 6 — LAB HÓA HỌC (1:24 – 1:48) | VOICE-OVER",
         "“Lab Hóa là nơi đặc biệt nhất với hai AI song hành. [nghỉ 0.5s] Một AI Giám sát thời gian thực kiểm soát rủi ro, chặn đứng nguy hiểm nếu pha trộn sai nồng độ. [nghỉ 0.5s] Một AI Cố vấn kề bên lập tức giải thích cơ chế phản ứng và phương trình ion chuẩn xác.” [nghỉ 0.5s]"),

        ("CẢNH 7 — LAB SINH HỌC (1:48 – 2:06) | VOICE-OVER",
         "“Ở Lab Sinh, quy luật di truyền Men-đen không còn là những con số trừu tượng. [nghỉ 0.5s] Mạng suy luận xác suất Bayes tính toán ngay tỷ lệ phân ly kiểu hình của từng thế hệ sau mỗi phép lai đa gen.” [nghỉ 0.5s]"),

        ("CẢNH 8 — ĐẤU TRƯỜNG PVP (2:06 – 2:36) | VOICE-OVER",
         "“Và đây là nơi mọi kiến thức được thử lửa: Đấu trường Tri thức một chọi một. [nghỉ 0.5s] Học sinh tranh tài thời gian thực cùng bạn bè hoặc so tài với AI Bot thích ứng. [nghỉ 0.5s] Tung chiêu thẻ bài, đóng băng đối thủ, giành giật từng giây để tích lũy ELO và thăng hạng vinh quang!” [nghỉ 1s]"),

        ("CẢNH 9 — TOÀN CẢNH & KẾT (2:36 – 3:00) | VOICE-OVER",
         "“Bảy trợ lý AI, một hệ sinh thái học tập toàn diện — được kiến tạo bởi chính học sinh cho học sinh Việt Nam. [nghỉ 0.5s] STEM HUB: Học thật, hiểu thật, tiến bộ thật!”")
    ]

    for title, text in vo_paragraphs:
        p_item = doc.add_paragraph()
        r_item_t = p_item.add_run(f"• {title}:\n")
        r_item_t.font.bold = True
        r_item_t.font.size = Pt(10)
        r_item_t.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)

        r_item_c = p_item.add_run(text)
        r_item_c.font.size = Pt(10.5)
        r_item_c.font.bold = True
        r_item_c.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
        p_item.paragraph_format.space_after = Pt(8)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # =========================================================================
    # 6. PHẦN V: NGUYÊN TẮC QUAN TRỌNG KHI TẬP NÓI & QUAY VIDEO
    # =========================================================================
    p_h5 = doc.add_paragraph()
    r_h5 = p_h5.add_run("V. ⚠️ NGUYÊN TẮC QUAN TRỌNG KHI TẬP NÓI & QUAY VIDEO")
    r_h5.font.size = Pt(13)
    r_h5.font.bold = True
    r_h5.font.color.rgb = RGBColor(0xB9, 0x1C, 0x1C)
    p_h5.paragraph_format.space_after = Pt(6)

    notes = [
        ("Cách nói chuyện tự nhiên như học sinh THPT:",
         "Giọng đọc cần tự nhiên, rõ ràng từng từ, không lên gân hay dùng giọng máy móc. Nói như đang chia sẻ chân thành với thầy cô và bạn bè về những điều mình đã tự tay làm được.\nTốc độ chuẩn ~138 từ/phút giúp lời nói thong thả, người nghe dễ tiếp thu trọn vẹn ý tứ và khớp từng giây thao tác trên màn hình."),
        ("Quy tắc quay hình trước, thu âm sau:",
         "Hãy quay màn hình từng thao tác chuột thật chậm rãi, sau đó nhìn vào video để đọc lời thoại đè lên, hình ảnh và tiếng nói sẽ khớp nhau hoàn hảo.\nỞ mỗi cảnh: Khi giọng đọc nhắc đến tính năng nào, chuột rê vào đúng phần đó (Face 2FA -> NOVA HUD -> Lab Toán -> Lab Lý -> Lab Hóa -> Lab Sinh -> Đấu trường)."),
        ("Kỹ thuật phím tắt & Thao tác dứt khoát:",
         "Nhấn phím tắt Alt + U để mở cửa sổ NOVA HUD nổi — thao tác nhanh gọn, tạo cảm giác công nghệ cao.\nTại Đấu trường, dùng tài khoản đã có sẵn điểm ELO và trang bị sẵn thẻ bài (Đóng băng, Khói mù) để khi bấm là hiệu ứng xuất hiện ngay, không bị trễ nhịp video."),
        ("Cân bằng âm thanh (Audio Mixing chuẩn truyền hình):",
         "Giọng Voice-over đặt ở mức -6dB đến -3dB (rõ, ấm, lọc sạch tiếng ồn). Nhạc nền (BGM) đặt ở -22dB, đoạn Đấu trường tăng lên -16dB. Khi micro học sinh nói, bật cơ chế Audio Ducking hạ nhạc nền xuống -26dB.")
    ]

    for title, content in notes:
        p_n = doc.add_paragraph()
        r_nt = p_n.add_run(f"• {title}\n")
        r_nt.font.bold = True
        r_nt.font.size = Pt(10.5)
        r_nt.font.color.rgb = RGBColor(0x99, 0x1B, 0x1B)

        r_nc = p_n.add_run(content)
        r_nc.font.size = Pt(10)
        r_nc.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
        p_n.paragraph_format.space_after = Pt(6)

    # Lưu file Word
    doc.save(str(OUT_PATH))
    print(f"[OK] Da xuat tai lieu Word thanh cong tai: {OUT_PATH}")

if __name__ == "__main__":
    build_docx()
