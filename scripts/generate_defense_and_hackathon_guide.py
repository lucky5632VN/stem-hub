# -*- coding: utf-8 -*-
"""
Script tạo tài liệu Word:
BỘ CÂU HỎI PHẢN BIỆN CHẶNG 1, DỰ ĐOÁN ĐỀ THI VÀ CHIẾN LƯỢC BẢO VỆ HACKATHON CHẶNG 2 (28-29/11/2026)
Dự án: Nền tảng học tập & Đấu trường trí tuệ STEM HUB (Mã: AI26B0012)
"""

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import os

def create_defense_and_hackathon_guide():
    doc = docx.Document()

    # Thiết lập kích thước trang A4 & căn lề chuẩn văn bản khoa học
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
        p.paragraph_format.space_before = Pt(14)
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

    def add_qa_box(q_num, question, danger_level, defense_summary, detailed_script):
        # Header câu hỏi
        p_q = doc.add_paragraph()
        p_q.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p_q.paragraph_format.space_before = Pt(8)
        p_q.paragraph_format.space_after = Pt(2)
        p_q.paragraph_format.keep_with_next = True

        r_badge = p_q.add_run(f"[{danger_level}] ")
        r_badge.font.name = 'Times New Roman'
        r_badge.font.size = Pt(11)
        r_badge.bold = True
        if "CỰC KỲ NGUY HIỂM" in danger_level or "XOÁY SÂU" in danger_level:
            r_badge.font.color.rgb = RGBColor(190, 30, 30)
        elif "TRỌNG TÂM" in danger_level:
            r_badge.font.color.rgb = RGBColor(200, 110, 10)
        else:
            r_badge.font.color.rgb = RGBColor(16, 75, 140)

        r_q = p_q.add_run(f"Câu hỏi {q_num}: \"{question}\"")
        r_q.font.name = 'Times New Roman'
        r_q.font.size = Pt(11.5)
        r_q.bold = True

        # Hộp câu trả lời (Table 1 ô có viền trái nổi bật)
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.8)
        tcPr = cell._element.get_or_add_tcPr()
        borders = parse_xml(
            r'<w:tcBorders {}><w:top w:val="none"/><w:bottom w:val="none"/>'
            r'<w:left w:val="single" w:sz="24" w:space="0" w:color="104B8C"/>'
            r'<w:right w:val="none"/></w:tcBorders>'.format(nsdecls('w'))
        )
        tcPr.append(borders)
        tcPr.append(parse_xml(r'<w:shd {} w:fill="F5F8FA"/>'.format(nsdecls('w'))))

        p_ans = cell.paragraphs[0]
        p_ans.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_ans.paragraph_format.space_before = Pt(3)
        p_ans.paragraph_format.space_after = Pt(2)
        p_ans.paragraph_format.line_spacing = 1.15

        r_core = p_ans.add_run("🎯 Ý cốt lõi ghi điểm: ")
        r_core.font.name = 'Times New Roman'
        r_core.font.size = Pt(10.5)
        r_core.bold = True
        r_core.font.color.rgb = RGBColor(16, 120, 70)

        r_sum = p_ans.add_run(defense_summary + "\n")
        r_sum.font.name = 'Times New Roman'
        r_sum.font.size = Pt(10.5)
        r_sum.italic = True

        r_script_lead = p_ans.add_run("🎙️ Kịch bản trả lời mẫu trước Hội đồng:\n")
        r_script_lead.font.name = 'Times New Roman'
        r_script_lead.font.size = Pt(10.5)
        r_script_lead.bold = True
        r_script_lead.font.color.rgb = RGBColor(16, 75, 140)

        r_script = p_ans.add_run(detailed_script)
        r_script.font.name = 'Times New Roman'
        r_script.font.size = Pt(10.5)

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
    add_p("HỘI THI SÁNG TẠO KHOA HỌC KỸ THUẬT & TRÍ TUỆ NHÂN TẠO", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=11, space_after=2)
    add_p("DỰ ÁN: NỀN TẢNG HỌC TẬP & ĐẤU TRƯỜNG TRÍ TUỆ STEM HUB (MÃ: AI26B0012)", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=10.5, color=RGBColor(100, 100, 100), space_after=10)

    p_title = add_p("CẨM NANG PHẢN BIỆN CHẶNG 1, DỰ ĐOÁN ĐỀ THI VÀ CHIẾN LƯỢC BẢO VỆ HACKATHON CHẶNG 2", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=14.5, color=RGBColor(16, 75, 140), space_after=3)
    add_p("(Tài liệu tác chiến kỹ thuật & sư phạm chuẩn bị cho vòng chung kết ngày 28–29/11/2026)", align=WD_ALIGN_PARAGRAPH.CENTER, italic=True, size=10.5, color=RGBColor(90, 90, 90), space_after=10)

    # Khung lưu ý chiến thuật
    p_box = doc.add_paragraph()
    p_box.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_box.paragraph_format.space_before = Pt(2)
    p_box.paragraph_format.space_after = Pt(8)
    r_box = p_box.add_run("MỤC TIÊU TỐI THƯỢNG TRƯỚC HỘI ĐỒNG GIÁM KHẢO:\n\"Lấy số liệu thực nghiệm định lượng làm khiên đỡ vững chắc; bảo vệ kiến trúc 3 tầng và chứng minh giải pháp giải quyết trọn vẹn bài toán chống ảo giác trong Giáo dục Phổ thông 2018\"")
    r_box.font.name = 'Times New Roman'
    r_box.font.size = Pt(11)
    r_box.bold = True
    r_box.font.color.rgb = RGBColor(16, 120, 70)

    # =========================================================================
    # PHẦN 1: BỘ CÂU HỎI PHẢN BIỆN CHẶNG 1 VÀ KỊCH BẢN ĐÁP TRẢ MẪU
    # =========================================================================
    add_heading_1("Phần 1: Bộ Câu Hỏi Phản Biện Chuyên Sâu Về Chặng 1 Của Ban Giám Khảo")
    add_p("Ban Giám khảo (BGK) ở Chặng 1 tập trung xoáy sâu vào 3 vấn đề học thuật cốt lõi: (1) Căn cứ kiến thức & cơ chế kiểm duyệt; (2) Độ tin cậy phương pháp luận của 150 ca; (3) Giá trị thực chất của RAG so với hệ quy tắc. Dưới đây là 12 câu hỏi phản biện sắc bén nhất mà BGK chắc chắn sẽ chất vấn cùng kịch bản trả lời mẫu đạt điểm tuyệt đối:")

    add_heading_2("1.1. Nhóm câu hỏi về Kiểm chứng câu trả lời có căn cứ (Grounding & Abstention)")

    add_qa_box(
        q_num="01",
        danger_level="XOÁY SÂU VÀO THUẬT TOÁN",
        question="Tại sao các em lại chọn ngưỡng Cosine Similarity là 25% để kích hoạt cơ chế Cảnh báo thiếu căn cứ (Abstention)? Nếu hạ xuống 20% hoặc nâng lên 35% thì hệ thống sẽ thay đổi thế nào?",
        defense_summary="Ngưỡng 25% là điểm tối ưu cân bằng giữa Precision và Recall trên tập dữ liệu kiểm thử thực nghiệm (Empirical Thresholding).",
        detailed_script="\"Kính thưa Thầy/Cô trong Hội đồng, ngưỡng 25% không phải là một con số ngẫu nhiên mà là kết quả kiểm định thực nghiệm trên tập 150 ca kiểm thử. Trong không gian vector embedding của mô hình (Text-Embedding đa ngữ), các câu hỏi học tập bằng tiếng Việt thường có độ biến thiên từ vựng cao (do học sinh viết tắt, dùng từ đồng nghĩa hoặc câu hỏi ngắn). Nếu nhóm nâng ngưỡng lên 35%, hệ thống rơi vào trạng thái 'quá thận trọng' (Over-abstention), dẫn đến việc từ chối nhầm các câu hỏi hoàn toàn chính đáng của học sinh (False Negative tăng vọt lên 18 ca). Ngược lại, nếu hạ ngưỡng xuống 20%, hệ thống sẽ bắt đầu 'nhận vơ' các đoạn kiến thức không liên quan, làm tăng nguy cơ ảo giác kiến thức (False Positive tăng lên 11 ca). Mức 25% chính là điểm cân bằng tối ưu giúp hệ thống đạt Precision 96.09% và Recall 96.09% như số liệu nhóm đã công bố.\""
    )

    add_qa_box(
        q_num="02",
        danger_level="TRỌNG TÂM SƯ PHẠM",
        question="Mỗi đoạn ngữ liệu (Chunk) trong kho RAG có độ dài bao nhiêu? Làm sao các em đảm bảo việc chia nhỏ tài liệu không làm mất đi tính toàn vẹn và bối cảnh sư phạm của SGK?",
        defense_summary="Sử dụng kỹ thuật Semantic Chunking có Semantic Overlap 15-20% theo cấu trúc phân đoạn sư phạm của SGK.",
        detailed_script="\"Dạ thưa Ban Giám khảo, nhóm áp dụng kỹ thuật Phân đoạn theo ranh giới ngữ nghĩa (Semantic Chunking) chứ không cắt cơ học theo số lượng từ cố định. Mỗi chunk có độ dài từ 300 đến 600 ký tự, tương ứng trọn vẹn với một tiểu mục định nghĩa, một quy tắc toán học hoặc một cơ chế phản ứng hóa học. Đặc biệt, giữa hai chunk liền kề luôn có phần gối đầu ngữ cảnh (Overlap) 15%, kết hợp lưu trữ metadata chuẩn gồm: Tên sách, Tên chương, Tên bài và Trang sách cụ thể. Nhờ đó, khi AI trích xuất đối chiếu trong khối GroundingEvidenceBox, người học và giáo viên có thể tra cứu ngược lại chính xác vị trí trong sách giấy mà không hề bị đứt gãy ngữ cảnh.\""
    )

    add_qa_box(
        q_num="03",
        danger_level="CỰC KỲ NGUY HIỂM - BẢO MẬT HỆ THỐNG",
        question="Nếu một học sinh gửi câu trả lời sai, hoặc tài khoản giáo viên bị rò rỉ và cố tình duyệt kiến thức sai vào hệ thống (Data Poisoning) thì nền tảng có bị 'nhiễm độc' không?",
        defense_summary="Kiến trúc Zero-trust 3 lớp: Cách ly cưỡng bức (Quarantine), Subject-level RBAC và Audit Trail truy vết giáo viên.",
        detailed_script="\"Kính thưa Hội đồng, nhóm đã thiết kế kiến trúc bảo mật chống đầu độc dữ liệu 3 lớp: Thứ nhất, cơ chế Cách ly cưỡng bức (Quarantine): 100% câu trả lời do học sinh gửi lên đều bị gắn cờ pending_review và tuyệt đối không bao giờ được đưa vào vector search cache. Thứ hai, Phân quyền giáo viên độc lập theo môn học (Subject-level RBAC): Chỉ tài khoản có Custom Claims role: teacher đúng bộ môn (Toán chỉ duyệt Toán, Hóa chỉ duyệt Hóa) mới có quyền duyệt. Thứ ba, Cơ chế Kiểm toán (Audit Trail): Mỗi tri thức bổ trợ được nạp đều lưu mã định danh UID của giáo viên và dấu thời gian. Nếu phát hiện sai sót, quản trị viên có thể thu hồi (revoke) tức thì trong 1 click, loại bỏ triệt để nguy cơ lan truyền kiến thức sai lệch.\""
    )

    add_heading_2("1.2. Nhóm câu hỏi về Độ tin cậy của 150 ca benchmark & Ma trận nhầm lẫn")

    add_qa_box(
        q_num="04",
        danger_level="XOÁY SÂU VÀO ĐỘ TRUNG THỰC",
        question="150 ca kiểm thử này nhóm lấy từ nguồn nào? Làm sao chứng minh nhóm không cố tình chọn những câu mô hình giải được (Cherry-picking) để khoe số liệu 93.33%?",
        defense_summary="Tập Held-out Test Split độc lập, bao gồm 22 ca bẫy nghịch lý và sai bản chất, lấy từ đề thi khảo sát chất lượng và ngân hàng đề thi chuẩn GDPT 2018.",
        detailed_script="\"Kính thưa Thầy/Cô, toàn bộ 150 ca benchmark được nhóm xây dựng theo nguyên tắc Held-out Test Split nghiêm ngặt: hoàn toàn không trùng lặp và không nằm trong tập tri thức nạp RAG của hệ thống. Để chứng minh tính khách quan và chống cherry-picking, tập 150 ca được phân bổ rải đều trên 4 môn (Toán: 40, Lý: 38, Hóa: 38, Sinh: 34). Đặc biệt, trong 150 ca này có tới 22 ca cạm bẫy (Negative Class) chứa các tiên đề sai, ngụy biện logic toán học hoặc hỏi ngoài chương trình để kiểm tra khả năng 'từ chối an toàn' của AI. Minh chứng rõ nhất là ở mô hình Không RAG, hệ thống chỉ đạt 50% độ đặc hiệu (bắt trúng 11/22 ca bẫy), trong khi bật RAG thì bắt trúng 17/22 ca bẫy (Specificity đạt 77.27%). Toàn bộ bộ đề này nhóm đã đóng gói công khai và có thể chạy tái lập (reproducible) ngay tại bàn thi đấu.\""
    )

    add_qa_box(
        q_num="05",
        danger_level="TOÁN HỌC & THỐNG KÊ",
        question="Tại sao hệ số Cohen's Kappa của mô hình Có RAG là 0.7337 chứ không phải trên 0.85? Và 5 ca False Positive (ảo giác) là những ca nào?",
        defense_summary="0.7337 là mức Substantial Agreement rất cao đối với bài toán ngôn ngữ mở; 5 ca FP rơi vào dạng bài tính toán phân hóa cao vượt ngoài đoạn trích SGK.",
        detailed_script="\"Dạ thưa BGK, trong thống kê y sinh và khoa học máy tính (theo chuẩn Landis & Koch), hệ số Cohen's Kappa từ 0.61 đến 0.80 được xếp loại 'Đồng thuận thực chất' (Substantial Agreement) rất đáng tin cậy, đặc biệt là khi loại trừ yếu tố may rủi ngẫu nhiên (chênh lệch vượt bậc so với Không RAG chỉ đạt 0.3697). Về 5 ca False Positive (tỷ lệ 3.3%): Qua phân tích lỗi (Error Analysis), nhóm phát hiện 4 ca thuộc môn Toán và Vật lý lớp 12 liên quan đến việc biến đổi số học nhiều bước. Đoạn trích SGK chỉ cung cấp công thức tổng quát, nhưng AI khi suy luận bước 3 đã tính nhẩm sai một hằng số nhưng vẫn tự tin kết luận đáp án. Đây chính là lý do nhóm cần cơ chế Human-in-the-loop để giáo viên phát hiện các điểm sai tinh vi này.\""
    )

    add_qa_box(
        q_num="06",
        danger_level="THÁCH THỨC VỀ TÍNH KHÁI QUÁT",
        question="Khoảng tin cậy Wilson 95% CI của Accuracy là [88.16% – 96.34%], biên độ dao động khoảng 8%. Liệu cỡ mẫu 150 có quá nhỏ để đại diện cho hàng ngàn dạng bài tập GDPT 2018?",
        defense_summary="150 ca là cỡ mẫu chuẩn mực cho giai đoạn Prototype khoa học; nhóm công bố kèm khoảng tin cậy Wilson chính là biểu hiện của sự trung thực khoa học.",
        detailed_script="\"Kính thưa Hội đồng, nhóm hoàn toàn đồng ý rằng 150 ca chưa thể đại diện cho toàn bộ kho tàng tri thức THPT. Tuy nhiên, trong nghiên cứu AI, việc nhóm không chỉ công bố điểm số đơn lẻ (Point estimate 93.33%) mà chủ động tính toán Khoảng tin cậy Wilson 95% CI [88.16% - 96.34%] chính là để khẳng định tính trung thực: Dù trong kịch bản xấu nhất ở quần thể lớn, độ chính xác của hệ thống vẫn được bảo đảm trên 88.16%. Đây là bước đệm chuẩn mực để mở rộng quy mô lên 1.000 ca trong giai đoạn tiếp theo.\""
    )

    add_heading_2("1.3. Nhóm câu hỏi về Đo lường đóng góp riêng của AI, RAG và Hệ quy tắc")

    add_qa_box(
        q_num="07",
        danger_level="XOÁY VÀO KIẾN TRÚC KỸ THUẬT",
        question="Các em chứng minh hệ quy tắc (Rule-based) giải các bài toán ChemLab và Quang hình chuẩn xác 100% và độ trễ dưới 5ms. Vậy tại sao không dùng luôn hệ quy tắc cho toàn bộ hệ thống mà lại cần RAG và LLM vừa đắt vừa chậm?",
        defense_summary="Hệ quy tắc chỉ xử lý được bài toán có cấu trúc đóng (Closed-domain); hoàn toàn bất lực trước ngôn ngữ tự nhiên không cấu trúc và teencode của học sinh.",
        detailed_script="\"Kính thưa Thầy/Cô, đây chính là phát hiện quan trọng nhất trong nghiên cứu của nhóm: Hệ quy tắc (Rule-based) là 'vua' trong các bài toán đã được hình thức hóa (công thức tính nồng độ, cân bằng phản ứng, khúc xạ ánh sáng) vì độ chính xác tuyệt đối 100% và không bao giờ ảo giác. Nhưng hệ quy tắc chỉ chiếm khoảng 15-20% nhu cầu thực tế của học sinh. Học sinh không hỏi bằng cú pháp toán học chuẩn mực; các em hỏi bằng ngôn ngữ tự nhiên, viết tắt (teencode như: 'pt', 'nhiet do', 'k/cách', 'đl bảo toàn e'), hỏi vì sao, hỏi so sánh bản chất. Hệ quy tắc hoàn toàn thất bại (<25%) trước các câu hỏi này. Do đó, kiến trúc 3 tầng của nhóm kết hợp hoàn hảo: Tầng 1 (Rule-based) giải nhanh bài toán đóng -> Tầng 2 (RAG) cung cấp neo tri thức SGK -> Tầng 3 (LLM) diễn giải sư phạm theo phương pháp gợi mở Socratic. Sự kết hợp này mang lại hiệu quả vượt trội hơn bất kỳ thành phần đơn lẻ nào.\""
    )

    add_qa_box(
        q_num="08",
        danger_level="HIỆU NĂNG THỰC TẾ",
        question="Bật RAG làm tăng tỷ lệ đúng đáp án từ 61.33% lên 96.67%, nhưng chi phí thời gian (Latency) và chi phí tài chính (Token API) tăng lên bao nhiêu?",
        defense_summary="RAG tăng thêm ~220ms cho khâu Vector Search nhưng giúp giảm độ dài sinh text của LLM, tổng thời gian phản hồi vẫn duy trì ở mức 1.8s - 2.4s.",
        detailed_script="\"Dạ thưa BGK, nhóm đã đo lường chi tiết chi phí này: Khâu truy vấn Vector RAG cục bộ bằng TF.js/IndexedDB chỉ mất từ 15ms đến 45ms; nếu gọi backend RAG mất khoảng 180ms - 250ms. Mặc dù tổng thời gian tăng khoảng 10-15% (từ 1.8s lên 2.2s), nhưng việc nạp context chuẩn SGK lại giúp LLM không phải 'đoán mò', trả lời thẳng vào trọng tâm, làm giảm 30% số lượng token sinh ra dư thừa. Về mặt kinh tế, một truy vấn kèm RAG chỉ tiêu tốn khoảng 0.00015 USD (~3.8 VNĐ), hoàn toàn khả thi để phổ cập cho trường học phổ thông.\""
    )

    # =========================================================================
    # PHẦN 2: DỰ ĐOÁN ĐỀ THI HACKATHON 6 GIỜ TẠI CHẶNG 2 (28-29/11/2026)
    # =========================================================================
    add_heading_1("Phần 2: Dự Đoán Đề Bài Hackathon 06 Giờ Tại Chặng 2 (28–29/11/2026)")
    add_p("Vòng Hackathon Chặng 2 diễn ra trong 06 giờ với áp lực trực tiếp tại chỗ. Mục đích tối thượng của Hội đồng Giám khảo ở vòng này là **kiểm tra năng lực thích ứng thời gian thực (Real-time Adaptability), độ chịu tải, khả năng làm chủ công nghệ và tính độc lập của sản phẩm** khi đối mặt với dữ liệu hoàn toàn mới mà nhóm chưa từng chuẩn bị trước.")

    add_heading_2("2.1. Phân tích 3 Kịch bản đề thi Hackathon có xác suất xuất hiện cao nhất")

    # Bảng phân tích 3 kịch bản
    table_scenarios = doc.add_table(rows=4, cols=4)
    sc_headers = ["Kịch Bản Dự Đoán", "Nội Dung Thách Thức Của BGK", "Kỹ Năng Cần Thể Hiện Trong 6 Giờ", "Xác Suất"]
    sc_data = [
        ["KỊCH BẢN 1:\nThách Thức Dữ Liệu Mới & Đề Thi Định Dạng 2025\n(Trọng tâm)",
         "BGK cung cấp 1 bộ tài liệu SGK mới (ví dụ: Chuyên đề Tin học 12 hoặc Giáo dục Kinh tế & Pháp luật) + 30 câu hỏi trắc nghiệm Đúng/Sai 4 ý theo chuẩn đề Bộ GD&ĐT 2025.",
         "1. Ingest và chunking dữ liệu mới vào Vector RAG trong 45 phút.\n2. Tinh chỉnh prompt để chấm đúng dạng bài 4 ý Đúng/Sai.\n3. Xuất bảng đối soát căn cứ và demo trực tiếp trên màn chiếu.",
         "50%\n(Cực kỳ cao)"],
        ["KỊCH BẢN 2:\nThách Thức Đa Phương Thức (Multimodal Vision RAG)",
         "BGK đưa vào 15 bài toán có hình ảnh thực tế: Đồ thị dao động điều hòa, sơ đồ thí nghiệm bình cầu điều chế khí Clo/Este, hoặc sơ đồ phả hệ di truyền.",
         "1. Tích hợp module OCR / Gemini Multimodal Vision API.\n2. Trích xuất thông số từ hình ảnh và đối chiếu với đoạn SGK mô tả thí nghiệm.\n3. Hiển thị khối căn cứ giải thích các bước thí nghiệm.",
         "30%\n(Rất cao)"],
        ["KỊCH BẢN 3:\nThách Thức Stress-test & Phòng Thủ Ngụy Biện (Red-Teaming)",
         "BGK trực tiếp đóng vai 'học sinh cá biệt' gửi vào 20 câu hỏi gài bẫy hiểm hóc: câu hỏi nghịch lý, câu hỏi ép AI chứng minh 1=2, hoặc câu hỏi chứa mã độc/Prompt Injection.",
         "1. Kích hoạt tầng Guardrail từ chối trả lời khẳng định sai.\n2. Chỉ ra chính xác lỗi ngụy biện toán học mà BGK cố tình cài cắm.\n3. Chứng minh hệ thống không bị 'bẻ khóa' (Jailbreak).",
         "20%\n(Trung bình)"]
    ]

    for c_idx, h in enumerate(sc_headers):
        cell = table_scenarios.cell(0, c_idx)
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = cell.paragraphs[0].add_run(h)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10.5)
        r.bold = True
        cell._element.get_or_add_tcPr().append(parse_xml(r'<w:shd {} w:fill="EAECEF"/>'.format(nsdecls('w'))))

    for r_idx, row in enumerate(sc_data, start=1):
        for c_idx, val in enumerate(row):
            cell = table_scenarios.cell(r_idx, c_idx)
            cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx < 3 else WD_ALIGN_PARAGRAPH.CENTER
            r = cell.paragraphs[0].add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)
            if c_idx == 0:
                r.bold = True
            if c_idx == 3:
                r.bold = True
                if "50%" in val:
                    r.font.color.rgb = RGBColor(190, 30, 30)
                elif "30%" in val:
                    r.font.color.rgb = RGBColor(200, 110, 10)
    format_table(table_scenarios, [Inches(1.8), Inches(2.7), Inches(2.3), Inches(1.0)])

    add_p("", space_before=4, space_after=4)

    add_heading_2("2.2. Chiến lược phân bổ thời gian tác chiến trong 06 giờ Hackathon")
    add_bullet("Giờ 0:00 - 0:45 (Khởi động & Phân tích đề): ", "Đọc kỹ yêu cầu của BGK, trích xuất cấu trúc dữ liệu input/output. Họp nhanh 5 phút chốt phương án kiến trúc, không vội viết code ngay.")
    add_bullet("Giờ 0:45 - 2:30 (Xử lý dữ liệu & Pipeline cốt lõi): ", "Chạy script tiền xử lý (cleaning, tokenization, semantic chunking). Nạp vào vector store hoặc xây dựng logic phân loại theo format đề mới.")
    add_bullet("Giờ 2:30 - 4:00 (Tích hợp giao diện & Chạy thực nghiệm): ", "Kết nối pipeline với giao diện Web sẵn có của STEM HUB. Đảm bảo hiển thị đầy đủ Khối căn cứ học liệu (Grounding Box) và Huy hiệu xác thực.")
    add_bullet("Giờ 4:00 - 5:15 (Kiểm thử, Stress-test & Chống lỗi vặt): ", "Chạy test toàn bộ các test case của BGK. Bắt các ngoại lệ (Network error, Empty response, JSON parsing error). Đóng băng mã nguồn (Code Freeze).")
    add_bullet("Giờ 5:15 - 6:00 (Chuẩn bị Slide & Kịch bản Demo Live): ", "Chụp ảnh màn hình các ca điển hình, soạn 5 slide thuyết trình tập trung vào số liệu thực nghiệm và bật sẵn các tab trình duyệt chạy local/cloud.")

    # =========================================================================
    # PHẦN 3: BỘ CÂU HỎI PHẢN BIỆN TẠI CHẶNG 2 TRƯỚC HỘI ĐỒNG CHUNG CUỘC
    # =========================================================================
    add_heading_1("Phần 3: Bộ Câu Hỏi Phản Biện Trực Tiếp Tại Chặng 2 Trước Hội Đồng Chung Cuộc")
    add_p("Tại phiên bảo vệ trực tiếp, BGK sẽ không chỉ hỏi về kỹ thuật mà sẽ mở rộng sang **tính ứng dụng thực tế, chi phí vận hành, an toàn học đường và năng lực thương mại hóa / triển khai diện rộng**.")

    add_qa_box(
        q_num="09",
        danger_level="CÂU HỎI ĐÒN HIỂM - TÍNH ĐỘC LẬP",
        question="Nếu Google ngắt kết nối Gemini API hoặc tăng giá gấp 10 lần thì nền tảng STEM HUB của các em có còn hoạt động được không?",
        defense_summary="Kiến trúc Decoupled Model-Agnostic: Tầng 1 và Tầng 2 chạy 100% On-device/Local; Tầng 3 hỗ trợ cắm rút đa mô hình (Ollama, PhoGPT, DeepSeek, Claude).",
        detailed_script="\"Kính thưa Hội đồng Giám khảo, hệ thống STEM HUB được xây dựng theo kiến trúc 'Tách rời và Độc lập mô hình' (Decoupled Model-Agnostic Architecture): Hai tầng quan trọng nhất là Tầng 1 (Hệ quy tắc mô phỏng ChemLab, Quang hình) và Tầng 2 (Vector Search RAG) hoàn toàn chạy Offline trên thiết bị client hoặc server nội bộ (On-premise) mà không tốn một xu chi phí API nào. Đối với Tầng 3 (LLM diễn giải), adapter backend của nhóm tuân thủ chuẩn OpenAI API / RESTful chuẩn, cho phép chuyển đổi sang các mô hình mã nguồn mở như Llama-3, PhoGPT hoặc DeepSeek tự host chỉ bằng cách thay đổi đúng 1 biến môi trường (.env) trong vòng 30 giây. Sản phẩm hoàn toàn không bị trói buộc (vendor lock-in) vào bất kỳ nhà cung cấp dịch vụ nào.\""
    )

    add_qa_box(
        q_num="10",
        danger_level="ĐẠO ĐỨC AI & GIÁO DỤC HỌC",
        question="Học sinh thời nay rất lười suy nghĩ, nếu có trợ lý AI này, các em sẽ dùng nó để giải hộ bài tập về nhà rồi chép lại. Nền tảng của các em có đang làm hại tư duy của học sinh không?",
        defense_summary="Chế độ Sư phạm Socratic Prompting: Tuyệt đối không đưa ra đáp số trọn gói ngay mà dẫn dắt từng bước bằng câu hỏi gợi mở.",
        detailed_script="\"Dạ thưa Thầy/Cô, đây chính là triết lý sư phạm cốt lõi phân biệt STEM HUB với các công cụ giải bài tập thông thường (như Qanda hay Photomath): Hệ thống tích hợp chế độ 'Trợ lý Sư phạm Socratic'. Khi học sinh hỏi một bài toán khó, hệ thống không bao giờ giải hộ từ A đến Z để học sinh chép. Thay vào đó, AI trích dẫn công thức nền tảng trong SGK, phân tích giả thiết, và đặt câu hỏi gợi mở: 'Em đã có gia tốc a và thời gian t, hãy xem công thức (1) ở SGK trang 45 để tìm vận tốc v nhé?'. Hệ thống đóng vai trò như một người Thầy kèm cặp bên cạnh, kích thích tư duy phản biện chứ không biến học sinh thành người thụ động chép đáp án.\""
    )

    add_qa_box(
        q_num="11",
        danger_level="KHẢ NĂNG CHỊU TẢI & THƯƠNG MẠI HÓA",
        question="Nếu nhân rộng nền tảng ra 5.000 học sinh trong toàn tỉnh cùng đăng nhập thi đấu trực tuyến vào giờ cao điểm thì hệ thống có bị nghẽn (DDoS / Crash) không?",
        defense_summary="Kiến trúc Hybrid phân tán: Tận dụng sức mạnh tính toán client (TF.js, Web Worker) kết hợp Firebase Serverless Auto-scaling.",
        detailed_script="\"Kính thưa BGK, nhóm đã tối ưu hóa bài toán chịu tải bằng mô hình Điện toán biên (Edge Computing): Thay vì dồn toàn bộ tải xử lý vector search về máy chủ trung tâm, Tầng 2 của hệ thống tận dụng tài nguyên trình duyệt của chính học sinh (chạy qua Web Workers và IndexedDB), giúp giảm tải hơn 70% áp lực cho backend. Phía máy chủ sử dụng hạ tầng Firebase Serverless và CDN Cloudflare, tự động co giãn tài nguyên theo tải thực tế (Auto-scaling). Với kiến trúc này, hệ thống sẵn sàng đáp ứng 5.000 - 10.000 người dùng đồng thời với chi phí duy trì hạ tầng tối thiểu.\""
    )

    add_qa_box(
        q_num="12",
        danger_level="LỢI THẾ CẠNH TRANH",
        question="Hiện nay trên thị trường đã có ChatGPT Plus, Qanda, Coze, Monica... Tại sao học sinh và nhà trường lại phải dùng nền tảng STEM HUB của các em?",
        defense_summary="STEM HUB có 3 lợi thế độc quyền: Bám sát 100% chuẩn GDPT 2018, Chống ảo giác bằng kiểm định chuyên môn của Giáo viên THPT, và Đấu trường học tập tương tác.",
        detailed_script="\"Kính thưa Hội đồng, các công cụ thương mại quốc tế (như ChatGPT) rất thông minh nhưng mắc phải 3 nhược điểm chí mạng trong trường học Việt Nam: Thứ nhất, chúng không biết chuẩn chương trình GDPT 2018 của Bộ GD&ĐT (thường dùng danh pháp hóa học cũ, giải theo SGK cũ). Thứ hai, chúng bị ảo giác và không thể dẫn nguồn trang sách để học sinh đối chiếu. Thứ ba, chúng hoàn toàn thiếu sự tham gia của Giáo viên bộ môn. STEM HUB sinh ra từ chính môi trường giáo dục phổ thông Việt Nam: chuẩn hóa danh pháp IUPAC mới, có khối Căn cứ trích dẫn SGK cụ thể, có Cổng giáo viên kiểm định bảo chứng và tích hợp hệ thống thi đấu Arena giúp việc học trở nên hào hứng như một trò chơi trí tuệ. Đó là những giá trị mà không một mô hình AI đa năng nào có thể thay thế được.\""
    )

    # =========================================================================
    # PHẦN 4: MA TRẬN PHẢN XẠ NHANH KHI ĐỨNG TRÊN SÂN KHẤU (DEFENSE MATRIX)
    # =========================================================================
    add_heading_1("Phần 4: Ma Trận Phản Xạ Nhanh Và Nguyên Tắc Vàng Khi Bảo Vệ Trực Tiếp")
    add_p("Khi bảo vệ trực tiếp trước Hội đồng Giám khảo ở Chặng 2, phong thái tự tin, khiêm tốn nhưng đanh thép bằng số liệu là yếu tố quyết định 50% điểm số thuyết trình. Nhóm cần khắc cốt ghi tâm 4 nguyên tắc vàng sau:")

    add_bullet("Nguyên tắc 1 (Không bao giờ cãi cùn): ", "Khi BGK chỉ ra một lỗi của hệ thống, tuyệt đối KHÔNG nói: 'Dạ cái này do mạng', 'Dạ do AI ngẫu nhiên'. HÃY NÓI: 'Dạ chúng em xin cảm ơn Thầy/Cô đã phát hiện một ca biên (Edge Case) rất sâu sắc. Trong 150 ca thực nghiệm, chúng em cũng ghi nhận 5 ca False Positive tương tự vì lý do... và giải pháp trong bản cập nhật tới của chúng em là...'.")
    add_bullet("Nguyên tắc 2 (Lấy số liệu thực nghiệm làm khiên đỡ): ", "Mọi luận điểm phản biện đều phải dẫn kèm số liệu: 'Độ chính xác 93.33%', 'Đúng đáp án tăng từ 61.33% lên 96.67%', 'Hệ số Kappa 0.7337', 'Ngưỡng cosine 25%'. Giám khảo khoa học chỉ bị thuyết phục bởi số liệu định lượng, không bị thuyết phục bởi cảm tính.")
    add_bullet("Nguyên tắc 3 (Nhấn mạnh tính làm chủ công nghệ): ", "Luôn làm nổi bật rằng nhóm tự tay xây dựng hệ thống, tự làm sạch 303 chunks, tự code ma trận nhầm lẫn 2x2, tự viết thuật toán Wilson CI và thiết kế cổng phân quyền giáo viên RBAC, không phải là một dự án 'kéo thả' no-code hay bọc API đơn giản.")
    add_bullet("Nguyên tắc 4 (Phân công vai diễn nhịp nhàng): ", "Đội thi gồm 2-3 bạn đứng sân khấu cần phân vai rõ ràng: 1 bạn phụ trách Tổng quan sư phạm & Luận điểm khoa học; 1 bạn phụ trách Kỹ thuật Backend/RAG/AI; 1 bạn chuyên thao tác Live Demo trên máy tính. Tránh việc tranh nhau cướp lời hoặc nhìn nhau lúng túng.")

    output_path = 'BO_CAU_HOI_PHAN_BIEN_VA_CHIEN_LUOC_HACKATHON_CHANG_2.docx'
    try:
        doc.save(output_path)
        print(f"✅ Đã tạo thành công tài liệu Word: {output_path}")
    except PermissionError:
        fallback_path = 'BO_CAU_HOI_PHAN_BIEN_VA_CHIEN_LUOC_HACKATHON_CHANG_2_MOI.docx'
        doc.save(fallback_path)
        print(f"⚠️ File bị khóa. Đã lưu sang: {fallback_path}")

if __name__ == '__main__':
    create_defense_and_hackathon_guide()

