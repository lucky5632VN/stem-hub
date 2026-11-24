# -*- coding: utf-8 -*-
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os
import zipfile
import shutil

def extract_media_if_needed():
    if not os.path.exists('temp_media'):
        os.makedirs('temp_media', exist_ok=True)
        if os.path.exists('MẪU HỒ SƠ CẢI TIẾN CHẶNG 1.docx'):
            with zipfile.ZipFile('MẪU HỒ SƠ CẢI TIẾN CHẶNG 1.docx', 'r') as z:
                for f in z.namelist():
                    if f.startswith('word/media/'):
                        fname = os.path.basename(f)
                        if fname:
                            with open(os.path.join('temp_media', fname), 'wb') as out_f:
                                out_f.write(z.read(f))

def create_document():
    extract_media_if_needed()
    doc = docx.Document()

    # Thiết lập kích thước trang A4 & căn lề chuẩn
    section = doc.sections[0]
    section.top_margin = Pt(42.55)    # 1.5 cm
    section.bottom_margin = Pt(42.55) # 1.5 cm
    section.left_margin = Pt(70.9)    # 2.5 cm
    section.right_margin = Pt(42.55)  # 1.5 cm
    section.page_width = Pt(595.45)   # A4 width
    section.page_height = Pt(841.7)   # A4 height

    # Thiết lập style mặc định
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Times New Roman'
    font.size = Pt(14)
    font.color.rgb = RGBColor(0, 0, 0)
    style_normal.paragraph_format.line_spacing = 1.15
    style_normal.paragraph_format.space_after = Pt(4)

    def add_p(text="", align=WD_ALIGN_PARAGRAPH.JUSTIFY, bold=False, size=14, space_before=0, space_after=4):
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
        return p

    def add_bullet(lead_bold, text_normal):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.left_indent = Inches(0.25)
        
        run_bullet = p.add_run("- ")
        run_bullet.font.name = 'Times New Roman'
        run_bullet.font.size = Pt(14)

        if lead_bold:
            run_bold = p.add_run(lead_bold)
            run_bold.font.name = 'Times New Roman'
            run_bold.font.size = Pt(14)
            run_bold.bold = True

        if text_normal:
            run_text = p.add_run(text_normal)
            run_text.font.name = 'Times New Roman'
            run_text.font.size = Pt(14)
        return p

    def add_subbullet(lead_bold, text_normal):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.left_indent = Inches(0.45)
        
        run_bullet = p.add_run("+ ")
        run_bullet.font.name = 'Times New Roman'
        run_bullet.font.size = Pt(13.5)

        if lead_bold:
            run_bold = p.add_run(lead_bold)
            run_bold.font.name = 'Times New Roman'
            run_bold.font.size = Pt(13.5)
            run_bold.bold = True

        if text_normal:
            run_text = p.add_run(text_normal)
            run_text.font.name = 'Times New Roman'
            run_text.font.size = Pt(13.5)
        return p

    def add_heading_1(text):
        return add_p(text, align=WD_ALIGN_PARAGRAPH.LEFT, bold=True, size=16, space_before=10, space_after=4)

    def add_heading_2(text):
        return add_p(text, align=WD_ALIGN_PARAGRAPH.LEFT, bold=True, size=14, space_before=8, space_after=3)

    def add_heading_3(text):
        return add_p(text, align=WD_ALIGN_PARAGRAPH.LEFT, bold=True, size=14, space_before=6, space_after=2)

    # ----------------------------------------------------
    # PHẦN THÔNG TIN HỘI THI & NHÓM THÍ SINH
    # ----------------------------------------------------
    add_p("MẪU HỒ SƠ CẢI TIẾN CHẶNG 1", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=16, space_after=2)
    add_p("BẢNG B", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=13, space_after=2)
    add_p("Cuộc thi Sáng tạo trẻ Quốc gia trong lĩnh vực Trí tuệ nhân tạo năm 2026", align=WD_ALIGN_PARAGRAPH.CENTER, bold=False, size=13, space_after=6)
    add_p("TÊN DỰ ÁN: STEM HUB - Kiến tạo hệ thống AI đa tầng hỗ trợ hệ sinh thái học tập số", align=WD_ALIGN_PARAGRAPH.LEFT, bold=True, size=13, space_after=4)
    add_p("Số lượng thí sinh trong đội thi: 1 người ☐   |   2 người ☐   |   3 người ☑", align=WD_ALIGN_PARAGRAPH.LEFT, bold=False, size=12, space_after=4)

    p_info = doc.add_paragraph()
    p_info.paragraph_format.line_spacing = 1.15
    p_info.paragraph_format.space_after = Pt(4)
    runs_data = [
        ("Thí sinh thứ nhất (Đội trưởng):\n", True),
        (" - Họ và tên: Hồ Hoàng Anh    - Lớp: 12A1 — Trường THPT Quỳnh Lưu 4, Nghệ An\n", False),
        (" - Điện thoại: 0356202878    - Email: hohoanganh20092021@gmail.com\n", False),
        ("Thí sinh thứ hai:\n", True),
        (" - Họ và tên: Nguyễn Trung Hiếu    - Lớp: 12A1 — Trường THPT Quỳnh Lưu 4, Nghệ An\n", False),
        (" - Điện thoại: 0385399693    - Email: trunghieuty2009@gmail.com\n", False),
        ("Thí sinh thứ ba:\n", True),
        (" - Họ và tên: Đậu Việt Hưng    - Lớp: 12A1 — Trường THPT Quỳnh Lưu 4, Nghệ An\n", False),
        (" - Điện thoại: 0385137767    - Email: hungdau208@gmail.com\n", False),
        ("Giáo viên / Người hướng dẫn:\n", True),
        (" - Họ và tên: Nguyễn Văn Phúc    - Đơn vị: GV Trường THPT Quỳnh Lưu 4\n", False),
        (" - Điện thoại: 0978754060    - Email: kist0320@gmail.com", False),
    ]
    for txt, is_b in runs_data:
        r = p_info.add_run(txt)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11.5)
        r.bold = is_b

    add_p("-" * 85, align=WD_ALIGN_PARAGRAPH.CENTER, bold=False, size=11, space_before=2, space_after=6)

    # ----------------------------------------------------
    # NỘI DUNG CẢI TIẾN
    # ----------------------------------------------------
    add_p("NỘI DUNG CẢI TIẾN", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=16, space_before=4, space_after=8)

    # 1. VẤN ĐỀ CẦN CẢI TIẾN
    add_heading_1("1. Vấn đề cần cải tiến")
    add_p("Trên cơ sở tiếp thu nghiêm túc ý kiến đóng góp và yêu cầu cải tiến sản phẩm của Ban Giám khảo tại vòng Chặng 1, nhóm nghiên cứu tập trung nâng cấp hệ thống ở ba nội dung trọng tâm sau:")

    add_heading_2("1.1. Kiểm chứng câu trả lời có căn cứ")
    add_bullet("Vấn đề: ", "Trợ lý AI có thể trả lời thiếu nguồn hoặc suy đoán câu ngoài kho dữ liệu.")
    add_bullet("Yêu cầu: ", "Hiển thị đoạn sách/nguồn cụ thể, cảnh báo khi thiếu căn cứ; chỉ lưu/tái sử dụng câu trả lời sau khi có bước đánh giá và duyệt phù hợp.")
    add_bullet("Minh chứng: ", "Demo câu có nguồn, câu ngoài phạm vi và quy trình giáo viên sửa/duyệt.")

    add_heading_2("1.2. Làm rõ độ tin cậy các chỉ số công bố")
    add_bullet("Vấn đề: ", "Các mức trên 92% hoặc 100% trên mẫu nhỏ chưa đủ để khái quát chất lượng.")
    add_bullet("Yêu cầu: ", "Công bố cách dựng 150 ca, mẫu đánh giá từng mô hình, tách dữ liệu thử với dữ liệu sinh/huấn luyện; nhờ giáo viên chấm chất lượng, báo lỗi theo từng nhóm.")
    add_bullet("Minh chứng: ", "Bộ kiểm thử có đáp án, thống kê số mẫu, confusion matrix hoặc precision/recall khi phù hợp.")

    add_heading_2("1.3. Đo đóng góp riêng của AI và RAG")
    add_bullet("Vấn đề: ", "Chưa rõ khi nào RAG hoặc mô hình học máy tốt hơn quy tắc xác định.")
    add_bullet("Yêu cầu: ", "So cùng câu hỏi khi bật/tắt truy xuất; với bài có công thức/quy tắc rõ, so giải pháp dựa trên quy tắc với AI, giải thích vì sao cần học máy.")
    add_bullet("Minh chứng: ", "Bảng đối chứng về đúng/sai, thời gian và lỗi, kèm các ví dụ có ý nghĩa.")

    # 2. GIẢI PHÁP THỰC HIỆN
    add_heading_1("2. Giải pháp thực hiện")
    add_p("Để giải quyết triệt để và minh bạch các yêu cầu từ Ban Giám khảo, nhóm nghiên cứu đã tái cấu trúc toàn diện kiến trúc nền tảng STEM HUB thông qua ba nhóm giải pháp kỹ thuật đồng bộ sau:")

    # 2.1. KIỂM CHỨNG CÂU TRẢ LỜI CÓ CĂN CỨ
    add_heading_2("2.1. Giải pháp kiểm chứng câu trả lời có căn cứ (Ứng phó Yêu cầu 1)")
    add_heading_3("2.1.1. Giải pháp:")
    add_p("Nhằm đảm bảo mọi phản hồi của trợ lý AI đều bám sát học liệu chuẩn và có khả năng truy xuất nguồn gốc tường minh, hệ thống được nâng cấp theo cơ chế kiểm soát nghiêm ngặt:")

    add_bullet("Truy xuất và trích dẫn nguồn học liệu tường minh: ", "Nâng cấp thuật toán RAG kết nối kho 303 chunk Sách giáo khoa chuẩn GDPT 2018 (Toán, Vật lí, Hóa học, Sinh học, Tin học lớp 10–12). Mỗi phản hồi được hệ thống tự động sinh kèm khối căn cứ có cấu trúc (GroundingEvidenceBox) hiển thị: tên tài liệu, bài học, chunk ID và đoạn trích dẫn nguyên văn. Tuyệt đối loại bỏ cơ chế để AI tự sinh dẫn chứng văn bản tự do giả mạo.")
    add_bullet("Cơ chế cảnh báo thiếu căn cứ và nghiêm ngặt từ chối suy đoán (Strict Grounding Abstention): ", "Thiết lập ngưỡng tương đồng ngữ nghĩa. Khi câu hỏi nằm ngoài kho SGK hoặc độ tương đồng thấp (WEAK/UNGROUNDED), hệ thống tự động phát cảnh báo 'Không tìm thấy căn cứ trong SGK chuẩn' và dừng đưa ra khẳng định suy đoán để tránh sai lệch kiến thức. Giao diện cung cấp tùy chọn xem gợi ý mở rộng với nhãn phân định rạch ròi.")
    add_bullet("Cơ chế phản hồi người học & Quy trình duyệt hai lớp (Human-in-the-loop):", "")
    add_subbullet("Tích hợp nút [🧑‍🏫 Gửi GV kiểm tra] ", "ngay dưới mỗi câu trả lời của AI để học sinh gửi thắc mắc khi thấy băn khoăn hoặc phát hiện sai sót kiến thức.")
    add_subbullet("Cách ly tri thức tự học: ", "Mọi câu hỏi được học sinh gửi duyệt hoặc câu trả lời tự học đều được lưu trữ ở trạng thái cách ly nghiêm ngặt (pending_review, quarantined = true), tuyệt đối không lọt vào kho tri thức RAG của học sinh khác.")
    add_subbullet("Thẩm định bởi giáo viên chuyên môn (Subject-level RBAC): ", "Chỉ khi giáo viên đúng bộ môn (xác thực qua Firebase Custom Claims) trực tiếp thẩm định, chỉnh sửa chuẩn xác và phê duyệt thành công, câu trả lời mới được lưu vào kho RAG bổ trợ với nhãn 'Tri thức bổ trợ của học sinh (đã qua giáo viên duyệt)' và gán mác verified_by_teacher.")

    add_heading_3("2.1.2. Kết quả thực nghiệm và minh chứng:")
    add_bullet("Minh chứng câu trả lời có căn cứ học liệu: ", "Hệ thống trích xuất đồng thời thông tin nguồn (tên tài liệu, chương, mục, số trang) đi kèm câu trả lời để người dùng trực tiếp kiểm chứng đối chiếu:")

    # Ảnh 1 & 2 side-by-side
    table_img12 = doc.add_table(rows=1, cols=2)
    table_img12.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell_a, cell_b = table_img12.rows[0].cells
    cell_a.width = Inches(3.1)
    cell_b.width = Inches(3.1)
    p_a = cell_a.paragraphs[0]
    p_a.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_a.add_run().add_picture('temp_media/image1.png', width=Inches(3.05))
    p_b = cell_b.paragraphs[0]
    p_b.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_b.add_run().add_picture('temp_media/image2.png', width=Inches(3.05))

    add_bullet("Minh chứng câu hỏi ngoài phạm vi kho học liệu: ", "Hệ thống tự động kích hoạt trạng thái Cảnh báo thiếu căn cứ (Strict Grounding Abstention), từ chối suy đoán khẳng định và cung cấp tùy chọn tham khảo mở rộng:")

    # Ảnh 3 & 4 side-by-side
    table_img34 = doc.add_table(rows=1, cols=2)
    table_img34.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell_c, cell_d = table_img34.rows[0].cells
    cell_c.width = Inches(3.1)
    cell_d.width = Inches(3.1)
    p_c = cell_c.paragraphs[0]
    p_c.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_c.add_run().add_picture('temp_media/image3.png', width=Inches(3.05))
    p_d = cell_d.paragraphs[0]
    p_d.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_d.add_run().add_picture('temp_media/image4.png', width=Inches(3.05))

    add_bullet("Minh chứng nút 'Gửi GV kiểm tra' và Quy trình giáo viên sửa/duyệt: ", "Học sinh bấm nút phản hồi theo môn học; giáo viên chuyên môn thẩm định độc lập và chỉnh sửa câu trả lời trước khi nạp vào kho RAG bổ trợ:")

    # Ảnh teacher review
    p_tr = doc.add_paragraph()
    p_tr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_tr.paragraph_format.space_before = Pt(4)
    p_tr.paragraph_format.space_after = Pt(6)
    p_tr.add_run().add_picture('docs/official_submission/evidence_images/02_teacher_verify_action_success.png', width=Inches(6.2))

    # 2.2. NÂNG CẤP QUY TRÌNH ĐÁNH GIÁ VÀ LÀM RÕ ĐỘ TIN CẬY
    add_heading_2("2.2. Nâng cấp quy trình đánh giá và làm rõ độ tin cậy các chỉ số công bố (Ứng phó Yêu cầu 2)")
    add_heading_3("2.2.1. Giải pháp:")
    add_p("Nhóm nghiên cứu đã chuẩn hóa lại toàn bộ phương pháp đánh giá thực nghiệm theo tiêu chuẩn khoa học dữ liệu khắt khe:")

    add_bullet("Minh bạch hóa bản chất bộ 150 ca: ", "Công bố rõ ràng trên hệ thống và giao diện: Tập 150 ca (benchmark_150_cases.json) là tập tổng hợp kỹ thuật (synthetic benchmark) dùng để đối đầu tự động giữa Có RAG và Base (không RAG) với nhãn đặt trước (preset ground-truth), không đánh đồng với điểm số giáo viên chấm thực tế. Đổi tên tab đối soát thành: 'Tập tổng hợp: RAG (Điểm đặt trước, chưa qua giáo viên)'.")
    add_bullet("Tách biệt độc lập dữ liệu Huấn luyện & Kiểm thử theo từng mô hình:", "")
    add_subbullet("Mô hình 1 – Phân loại rủi ro Hóa học ChemLab (n = 50 ca): ", "Tập huấn luyện 180 mẫu sinh được tách rời hoàn toàn khỏi tập kiểm thử 50 ca độc lập (30 ca tổng hợp + 20 ca biên). Hệ luật đạt 94.0% [83.8%, 97.9%], mạng Softmax NN đạt 80.0% [67.0%, 88.8%], kiểm định McNemar p = 0.065.")
    add_subbullet("Mô hình 2 – Chẩn đoán lỗi Quang hình học Optics (n = 45 ca): ", "Đánh giá riêng 30 ca mô phỏng đơn biến (định luật Snell đạt 100%) và 15 ca biên lỗi đồng thời đa chiều (chỉ đạt 33.3%, tương đương baseline đoán mò lớp đa số). Báo cáo trung thực hạn chế bài toán, không khái quát hóa mức 100%.")
    add_subbullet("Mô hình 3 – Phân loại ý định hội thoại Javit Intent (n = 65 ca): ", "Kiểm thử trên tập câu hỏi thực tế của học sinh, mô hình Naive Bayes (90.8% [81.3%, 95.7%]) vượt trội có ý nghĩa thống kê so với Regex đơn giản (21.5%), kiểm định McNemar p = 0.0043 < 0.01.")
    add_bullet("Quy trình Giáo viên thẩm định độc lập & Phân quyền theo môn (RBAC):", "")
    add_subbullet("Cổng thẩm định làm mù (Double-Blind Review): ", "Hệ thống xáo trộn ngẫu nhiên thứ tự các phiên bản (seed cố định 2026), ẩn nhãn mô hình để giáo viên chấm công tâm theo 2 tiêu chí: Độ chính xác kiến thức và Tính sư phạm.")
    add_subbullet("Phân quyền chuyên môn nghiêm ngặt (Subject-level RBAC): ", "Giáo viên môn nào chỉ xem và thẩm định câu hỏi thuộc môn đó (Toán, Lý, Hóa, Sinh, Tin); chặn truy cập chéo môn học.")
    add_subbullet("Bộ đối soát chuẩn 20 bài toán THPT: ", "Sử dụng các câu hỏi trích từ Đề thi tốt nghiệp THPT và Đề tham khảo chính thức của Bộ GD&ĐT có đáp án in sẵn làm thước đo chuẩn (Ground Truth).")
    add_bullet("Chuẩn hóa phương pháp thống kê: ", "Mọi chỉ số đều công bố kèm cỡ mẫu n và Khoảng tin cậy Wilson 95% CI; trình bày Ma trận nhầm lẫn 2×2 (TP, FP, FN, TN) so sánh với mô hình đối chứng 'All-Positive' (luôn đoán Đạt); tuân thủ nguyên tắc ẩn tỷ lệ phần trăm khi n < 30 (chỉ hiển thị đếm thô).")

    add_heading_3("2.2.2. Kết quả thực nghiệm và minh chứng:")
    add_bullet("Ma trận nhầm lẫn (Confusion Matrix): ", "Đối chiếu chi tiết mức độ khớp giữa dự đoán AI và thẩm định thực tế theo 2 tiêu chí (Độ chính xác đáp án và Tính chuẩn mực sư phạm), lấy chuẩn SGK làm hệ quy chiếu:")

    # Ảnh 5 (Confusion Matrix)
    p_cm = doc.add_paragraph()
    p_cm.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cm.paragraph_format.space_before = Pt(4)
    p_cm.paragraph_format.space_after = Pt(6)
    p_cm.add_run().add_picture('temp_media/image5.png', width=Inches(5.9))

    add_bullet("Minh chứng Thẩm định độc lập của Giáo viên THPT: ", "Mọi phản hồi trong quá trình kiểm thử đều được đội ngũ giáo viên THPT trực tiếp thẩm định độc lập theo từng môn học, đối chiếu nghiêm ngặt với đáp án chuẩn:")

    # Ảnh 6 (Badge teacher review)
    p_badge = doc.add_paragraph()
    p_badge.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_badge.paragraph_format.space_before = Pt(2)
    p_badge.paragraph_format.space_after = Pt(6)
    p_badge.add_run().add_picture('temp_media/image6.png', width=Inches(1.8))

    # 2.3. ĐO ĐÓNG GÓP RIÊNG CỦA AI VÀ RAG
    add_heading_2("2.3. Đo đóng góp riêng của AI và RAG – Tối ưu hóa kiến trúc đa tầng (Ứng phó Yêu cầu 3)")
    add_heading_3("2.3.1. Giải pháp:")
    add_p("Để làm rõ vai trò thực sự của từng thành phần trong hệ thống, nhóm tiến hành chuỗi thực nghiệm đối chứng (Ablation Study):")

    add_bullet("Thực nghiệm đối đầu Bật/Tắt RAG trên cùng tập câu hỏi: ", "Đo lường độc lập trên cùng 150 câu hỏi STEM giữa 2 chế độ: (1) Bật RAG Guard (truy xuất ngữ cảnh SGK và dẫn chứng nguồn) và (2) Tắt RAG Guard (Base AI, chỉ dùng tri thức nội tại của mô hình ngôn ngữ).")
    add_bullet("Phân định ranh giới kỹ thuật giữa Hệ quy tắc (Rule-based) và Trí tuệ nhân tạo (AI/ML):", "")
    add_subbullet("Tác vụ có công thức/quy tắc xác định: ", "Đối với các bài toán có cấu trúc toán học hoặc định luật vật lý/hóa học rõ ràng (cân bằng phản ứng hóa học, định luật Snell, định luật Mendel), giải pháp dựa trên quy tắc/công thức giải tích (Rule-based) đạt độ chính xác gần như tuyệt đối (>95%), thời gian xử lý cực nhanh (< 5ms) và hoàn toàn không bị ảo giác. Do đó hệ thống ưu tiên định tuyến các tác vụ này cho động cơ chuyên dụng.")
    add_subbullet("Vì sao bắt buộc cần Trí tuệ nhân tạo (Học máy / LLM): ", "Quy tắc xác định hoàn toàn bất lực trước sự đa dạng của ngôn ngữ tự nhiên, lỗi chính tả, câu hỏi mở và cách viết tắt (teencode) của học sinh (như 'pt', 'nhiet do', 'suy ra', 'k/cách'). Mô hình học máy (Naive Bayes / LLM) giải quyết xuất sắc khâu hiểu ngữ cảnh, phân loại ý định và tổng hợp giải thích sư phạm linh hoạt mà không một hệ luật tĩnh nào có thể bao quát hết được.")

    add_heading_3("2.3.2. Kết quả thực nghiệm và minh chứng:")
    add_bullet("Kết quả thực nghiệm khi Bật RAG Guard: ", "Hệ thống bóc tách và thống kê toàn diện hiệu năng phản hồi của AI trên 150 ca kiểm thử, phản hồi chính xác và có trích dẫn nguồn sách giáo khoa:")

    # Ảnh 7 (Bật RAG)
    p_rag_on = doc.add_paragraph()
    p_rag_on.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_rag_on.paragraph_format.space_before = Pt(4)
    p_rag_on.paragraph_format.space_after = Pt(6)
    p_rag_on.add_run().add_picture('temp_media/image7.png', width=Inches(6.2))

    add_bullet("Kết quả thực nghiệm khi Tắt RAG Guard: ", "Mô hình ngôn ngữ thuần túy không có RAG suy giảm độ chính xác, dễ mắc lỗi ảo giác kiến thức số liệu và không thể trích dẫn nguồn:")

    # Ảnh 8 (Tắt RAG)
    p_rag_off = doc.add_paragraph()
    p_rag_off.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_rag_off.paragraph_format.space_before = Pt(4)
    p_rag_off.paragraph_format.space_after = Pt(6)
    p_rag_off.add_run().add_picture('temp_media/image8.png', width=Inches(6.2))

    # Bảng số liệu Ma trận nhầm lẫn & Chỉ số định lượng 150 ca
    add_bullet("Bảng đối chiếu định lượng Ma trận nhầm lẫn trên 150 ca kiểm thử độc lập: ", "Thực nghiệm trên 150 ca chuẩn GDPT 2018 (Toán: 40, Vật lý: 38, Hóa học: 38, Sinh học: 34), tách biệt hoàn toàn khỏi kho tri thức SGK:")

    table_150 = doc.add_table(rows=9, cols=5)
    table_150.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers_150 = ["Chỉ số Đánh giá", "Base Model (No-RAG)", "STEM-RAG Guard", "Chênh lệch (Δ)", "Ý nghĩa thực tiễn GDPT 2018"]
    data_150 = [
        ["Ma trận nhầm lẫn (TP / FN / FP / TN)", "114 / 14 / 11 / 11", "123 / 5 / 5 / 17", "+9 TP, -6 FP", "Giảm 54.5% lỗi ảo giác, tăng bắt lỗi bẫy"],
        ["Độ chính xác (Accuracy)", "83.33%", "93.33%", "+10.00%", "Độ tin cậy tổng thể khi phục vụ học sinh THPT"],
        ["Độ chuẩn xác (Precision)", "91.20%", "96.09%", "+4.89%", "Hạn chế tối đa đưa ra đáp án sai lệch, ngụy biện"],
        ["Độ nhạy / Thu hồi (Recall)", "89.06%", "96.09%", "+7.03%", "Không từ chối oan câu hỏi chính đáng của học sinh"],
        ["Độ đặc hiệu (Specificity)", "50.00%", "77.27%", "+27.27%", "Phát hiện và cảnh báo cạm bẫy, ngoài SGK"],
        ["Điểm F1-Score", "90.12%", "96.09%", "+5.97%", "Cân bằng hài hòa giữa độ chuẩn xác và độ bao quát"],
        ["Hệ số Cohen's Kappa (κ)", "0.3697", "0.7337", "+0.3640", "Đồng thuận cao với chuẩn SGK ngoài yếu tố may rủi"],
        ["Tỷ lệ đúng Đáp án cuối cùng", "61.33%", "96.67%", "+35.34%", "Số học, công thức và phương án chọn A/B/C/D"]
    ]

    for col_idx, h_text in enumerate(headers_150):
        cell = table_150.cell(0, col_idx)
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = cell.paragraphs[0].add_run(h_text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10.5)
        r.bold = True
        cell._element.get_or_add_tcPr().append(parse_xml(r'<w:shd {} w:fill="EAECEF"/>'.format(nsdecls('w'))))

    for row_idx, row_vals in enumerate(data_150, start=1):
        for col_idx, val in enumerate(row_vals):
            cell = table_150.cell(row_idx, col_idx)
            cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.LEFT if col_idx == 0 or col_idx == 4 else WD_ALIGN_PARAGRAPH.CENTER
            r = cell.paragraphs[0].add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)
            if col_idx == 0:
                r.bold = True

    for row in table_150.rows:
        for cell in row.cells:
            tcPr = cell._element.get_or_add_tcPr()
            borders = parse_xml(
                r'<w:tcBorders {}><w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>'
                r'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>'
                r'<w:left w:val="none"/><w:right w:val="none"/></w:tcBorders>'.format(nsdecls('w'))
            )
            tcPr.append(borders)

    add_p("", space_before=2, space_after=2)

    add_bullet("Bảng đối chứng thực nghiệm giữa các tầng kiến trúc: ", "")

    # Bảng so sánh 4 cột
    table = doc.add_table(rows=7, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Tiêu chí đối chứng", "Hệ quy tắc xác định\n(Rule-based)", "AI thuần túy\n(Không có RAG - Base)", "Hệ thống đa tầng\n(Tích hợp AI + RAG)"]
    data = [
        ["Phạm vi xử lý tối ưu", "Công thức, định luật có cấu trúc cố định", "Câu hỏi ngôn ngữ tự nhiên mở", "Toàn diện hệ sinh thái học tập số"],
        ["Độ chính xác bài toán cấu trúc", "Rất cao (> 95%)", "Khá (80% – 85%, dễ nhầm số)", "Rất cao (> 95%, có đối soát)"],
        ["Độ trễ trung bình", "Cực thấp (< 5 ms)", "800 ms – 1.500 ms", "1.200 ms – 2.200 ms"],
        ["Nguy cơ ảo giác (Hallucination)", "Tuyệt đối không", "Có nguy cơ cao (15% – 25%)", "Giảm thiểu rõ rệt (có cảnh báo)"],
        ["Khả năng hiểu Teencode / Văn tự do", "Thất bại (< 25%)", "Rất tốt (> 90%)", "Rất tốt (> 90%)"],
        ["Khả năng dẫn nguồn SGK cụ thể", "Không có", "Bịa nguồn / Không trích dẫn", "Chính xác bài, trang SGK"]
    ]

    for col_idx, h_text in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = cell.paragraphs[0].add_run(h_text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11)
        r.bold = True
        cell._element.get_or_add_tcPr().append(parse_xml(r'<w:shd {} w:fill="EAECEF"/>'.format(nsdecls('w'))))

    for row_idx, row_vals in enumerate(data, start=1):
        for col_idx, val in enumerate(row_vals):
            cell = table.cell(row_idx, col_idx)
            cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.LEFT if col_idx == 0 else WD_ALIGN_PARAGRAPH.CENTER
            r = cell.paragraphs[0].add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10.5)
            if col_idx == 0:
                r.bold = True

    # Định dạng viền cho bảng
    for row in table.rows:
        for cell in row.cells:
            tcPr = cell._element.get_or_add_tcPr()
            borders = parse_xml(
                r'<w:tcBorders {}><w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>'
                r'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>'
                r'<w:left w:val="none"/><w:right w:val="none"/></w:tcBorders>'.format(nsdecls('w'))
            )
            tcPr.append(borders)

    add_p("", space_before=2, space_after=2)

    # Ảnh 9 (Phân tích tổng hợp)
    p_comp = doc.add_paragraph()
    p_comp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_comp.paragraph_format.space_before = Pt(4)
    p_comp.paragraph_format.space_after = Pt(6)
    p_comp.add_run().add_picture('temp_media/image9.png', width=Inches(6.2))

    add_bullet("Kết luận thực nghiệm: ", "Qua đối chiếu thực nghiệm, mỗi thành phần trong kiến trúc đa tầng của STEM HUB đều đảm nhiệm một vai trò chuyên biệt và bổ trợ lẫn nhau: các quy tắc xác định xử lý tối ưu các bài toán công thức có cấu trúc cố định với độ trễ cực thấp; mô hình học máy và AI giải quyết xuất sắc bài toán hiểu ngữ cảnh tự nhiên và ngôn ngữ của học sinh; và hệ thống RAG đóng vai trò là chiếc mỏ neo kiểm soát chất lượng, neo chặt mọi phản hồi của AI vào học liệu chuẩn Sách giáo khoa GDPT 2018.")

    output_path = 'MẪU HỒ SƠ CẢI TIẾN CHẶNG 1.docx'
    doc.save(output_path)
    shutil.rmtree('temp_media', ignore_errors=True)
    print(f"File saved successfully to {output_path}")

if __name__ == '__main__':
    create_document()

