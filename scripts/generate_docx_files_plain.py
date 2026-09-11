import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def add_title(doc, text, subtitle_text):
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_p.paragraph_format.space_after = Pt(4)
    run_t = title_p.add_run(text)
    run_t.font.name = 'Calibri'
    run_t.font.size = Pt(16)
    run_t.bold = True
    run_t.font.color.rgb = RGBColor(27, 54, 93)

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_p.paragraph_format.space_after = Pt(16)
    run_sub = sub_p.add_run(subtitle_text)
    run_sub.font.name = 'Calibri'
    run_sub.font.size = Pt(11)
    run_sub.italic = True
    run_sub.font.color.rgb = RGBColor(100, 100, 100)

def add_heading_1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(13)
    run.bold = True
    run.font.color.rgb = RGBColor(27, 54, 93)
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(11.5)
    run.bold = True
    run.font.color.rgb = RGBColor(41, 128, 185)
    return p

def add_body(doc, text, bold_prefix="", indent=0):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    if indent > 0:
        p.paragraph_format.left_indent = Inches(0.25 * indent)
    
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Calibri'
        r_pre.font.size = Pt(11)
        r_pre.bold = True

    r = p.add_run(text)
    r.font.name = 'Calibri'
    r.font.size = Pt(11)
    return p


# ==============================================================================
# DOC 1: Lịch sử câu lệnh và hình ảnh minh chứng (NO TABLES)
# ==============================================================================
def build_doc1():
    doc = Document()
    for s in doc.sections:
        s.top_margin = Inches(1)
        s.bottom_margin = Inches(1)
        s.left_margin = Inches(1)
        s.right_margin = Inches(1)

    add_title(doc, "LỊCH SỬ CÂU LỆNH VÀ HÌNH ẢNH MINH CHỨNG", "Dự án: STEM HUB - Hệ sinh thái Học tập và Thí nghiệm Ảo\nĐơn vị dự thi: Trường THPT Quỳnh Lưu 4")

    add_heading_1(doc, "I. Giới thiệu chung")
    add_body(doc, "Dự án STEM HUB được nhóm học sinh Trường THPT Quỳnh Lưu 4 thực hiện nhằm tạo ra môi trường học tập trực quan cho các môn Khoa học tự nhiên (Toán, Lý, Hóa, Sinh). Trong quá trình phát triển, nhóm tự lên nội dung bài học, xây dựng ngân hàng câu hỏi và sử dụng công cụ AI để hỗ trợ viết mã nguồn, gỡ lỗi và thiết kế giao diện.")

    add_heading_1(doc, "II. Lịch sử các câu lệnh chính (Prompt Log)")
    add_body(doc, "Dưới đây là các câu lệnh chính nhóm đã sử dụng trong từng giai đoạn phát triển sản phẩm:")

    phases = [
        ("Giai đoạn 1: Dựng khung website và mô phỏng phòng lab Hóa ảo",
         "Mục tiêu: Tạo giao diện chính của website và phòng thí nghiệm Hóa học cơ bản.\nCâu lệnh sử dụng: \"Tạo giao diện website học tập STEM bằng Next.js. Viết mô phỏng phòng lab Hóa học tương tác, cho phép chọn hóa chất và hiển thị hiện tượng phản ứng.\"\nKết quả: Hoàn thành khung trang web và chức năng trộn hóa chất cơ bản."),
        
        ("Giai đoạn 2: Xây dựng các phòng lab Vật lý, Sinh học và Toán học",
         "Mục tiêu: Tích hợp đầy đủ các phòng thí nghiệm ảo cho 4 môn học.\nCâu lệnh sử dụng: \"Viết mã nguồn mô phỏng con lắc đơn 3D cho môn Vật lý, bài tập di truyền cho môn Sinh học và công thức toán học bằng KaTeX.\"\nKết quả: Tích hợp thành công 4 phòng thí nghiệm ảo tương tác trực quan."),
        
        ("Giai đoạn 3: Tích hợp Trợ lý AI Nova",
         "Mục tiêu: Tạo trợ lý ảo hỗ trợ giải đáp thắc mắc và chuyển trang.\nCâu lệnh sử dụng: \"Tạo cửa sổ trợ lý AI Nova dạng nổi kéo thả, hỗ trợ nhận diện giọng nói tiếng Việt để giải đáp thắc mắc và hỗ trợ chuyển trang.\"\nKết quả: Trợ lý Nova hoạt động mượt mà, giúp học sinh tra cứu và điều hướng website."),
        
        ("Giai đoạn 4: Phát triển Đấu trường Thách đấu 1v1",
         "Mục tiêu: Tạo phân hệ thi đấu trắc nghiệm 1v1 giữa 2 học sinh.\nCâu lệnh sử dụng: \"Viết chức năng đấu trường thách đấu 1v1 giữa 2 học sinh, tự động ghép trận sau 30 giây và tạo câu hỏi trắc nghiệm theo ELO.\"\nKết quả: Hoàn thành tính năng Đấu trường 1v1 sôi nổi, hấp dẫn."),
        
        ("Giai đoạn 5: Tích hợp Đăng nhập và Quét khuôn mặt 2FA",
         "Mục tiêu: Tăng tính bảo mật cho tài khoản người dùng.\nCâu lệnh sử dụng: \"Thêm chức năng đăng nhập tài khoản và tính năng quét khuôn mặt 2FA bằng thư viện TensorFlow.js để tăng tính bảo mật.\"\nKết quả: Hệ thống đăng nhập và xác thực khuôn mặt hoạt động ổn định."),
        
        ("Giai đoạn 6: Tối ưu trải nghiệm và hoàn thiện giao diện",
         "Mục tiêu: Hoàn thiện ứng dụng và sửa các lỗi hiển thị.\nCâu lệnh sử dụng: \"Tạo hiệu ứng in chữ từ từ cho Trợ lý Nova, sửa lỗi cuộn trang và hoàn thiện các chức năng hiển thị trên máy tính và điện thoại.\"\nKết quả: Sản phẩm hoạt động ổn định, giao diện mượt mà và dễ sử dụng.")
    ]

    for title, detail in phases:
        add_heading_2(doc, title)
        for line in detail.split('\n'):
            if line.startswith("Mục tiêu:"):
                add_body(doc, line[9:], bold_prefix="- Mục tiêu: ", indent=1)
            elif line.startswith("Câu lệnh sử dụng:"):
                add_body(doc, line[17:], bold_prefix="- Câu lệnh sử dụng: ", indent=1)
            elif line.startswith("Kết quả:"):
                add_body(doc, line[8:], bold_prefix="- Kết quả: ", indent=1)

    add_heading_1(doc, "III. Danh sách các câu lệnh hệ thống (System Prompts)")

    prompts = [
        ("Trợ lý AI Nova (Cố vấn Học tập & Điều hướng):",
         "\"Bạn là NOVA - Trợ lý AI hỗ trợ học tập STEM cho học sinh THPT. Nhiệm vụ: Giải đáp thắc mắc kiến thức 4 môn Toán, Lý, Hóa, Sinh theo chương trình SGK THPT 2025; hỗ trợ chuyển trang khi học sinh yêu cầu (ví dụ: 'Mở lab Hóa', 'Vào đấu trường'); giữ thái độ thân thiện, lịch sự, từ chối các nội dung không phù hợp hoặc bạo lực.\""),
        
        ("AI Giám sát Phòng Lab Hóa:",
         "\"Bạn là AI hỗ trợ thí nghiệm Hóa học ảo. Nhiệm vụ: Theo dõi các chất hóa học học sinh đưa vào cốc thí nghiệm, giải thích ngắn gọn nguyên nhân phản ứng xảy ra và đưa ra lời nhắc an toàn thí nghiệm.\""),
        
        ("AI Cố vấn Kiến thức 4 Môn:",
         "\"Bạn là AI Cố vấn Khoa học cho các phòng thí nghiệm ảo. Nhiệm vụ: Trả lời ngắn gọn, súc tích (từ 2 đến 4 dòng) đi thẳng vào đáp số, công thức cốt lõi môn Toán, Lý, Hóa, Sinh.\""),
        
        ("AI Đấu trường 1v1:",
         "\"Bạn là Động cơ hỗ trợ Đấu trường Thách đấu STEM 1v1. Nhiệm vụ: Hỗ trợ tự động ghép trận đấu khi hết thời gian chờ, chọn câu hỏi trắc nghiệm phù hợp với trình độ người chơi.\"")
    ]

    for p_name, p_val in prompts:
        add_body(doc, p_val, bold_prefix=f"- {p_name}\n  ", indent=1)

    add_heading_1(doc, "IV. Danh mục hình ảnh minh chứng thực tế")
    add_body(doc, "Dưới đây là danh sách các hình ảnh minh chứng thu thập từ giao diện thực tế của sản phẩm:")

    imgs = [
        "Hình 1: Giao diện Trang chủ & Trợ lý Nova - Màn hình trang chủ STEM HUB với cửa sổ Trợ lý AI Nova hỗ trợ học sinh.",
        "Hình 2: Nhật ký xử lý câu lệnh hệ thống - Màn hình hiển thị quá trình nhận và xử lý câu hỏi của trợ lý AI.",
        "Hình 3: Mô phỏng Thí nghiệm Lab Hóa - Giao diện trộn hóa chất và hiển thị kết quả phản ứng trong phòng lab Hóa.",
        "Hình 4: Mô phỏng Thí nghiệm Lab Vật lý 3D - Mô phỏng con lắc đơn 3D và đồ thị dao động môn Vật lý.",
        "Hình 5: Bài tập Di truyền Lab Sinh học - Sơ đồ phả hệ và bài tập xác suất di truyền môn Sinh học.",
        "Hình 6: Đấu trường Thách đấu PvP 1v1 - Giao diện thi đấu trắc nghiệm 1v1 giữa hai học sinh thời gian thực.",
        "Hình 7: Tính năng Quét khuôn mặt 2FA - Màn hình xác thực khuôn mặt khi đăng nhập tài khoản.",
        "Hình 8: Trang kiểm thử hệ thống (/admin) - Giao diện dành cho người quản trị kiểm tra các chức năng của website."
    ]

    for img_text in imgs:
        parts = img_text.split(" - ")
        add_body(doc, parts[1], bold_prefix=f"- {parts[0]}: ", indent=1)

    add_heading_1(doc, "V. Hướng dẫn nộp bài lên Google Drive")
    steps = [
        "Bước 1: Tạo một thư mục trên Google Drive cá nhân với tên thư mục: [QuynhLuu4_STEMHUB]_LichSuCauLenh_MinhChung.",
        "Bước 2: Tải file báo cáo này cùng các hình ảnh minh chứng tương ứng vào thư mục vừa tạo.",
        "Bước 3: Nhấp chuột phải vào thư mục -> Chọn Chia sẻ -> Chuyển quyền truy cập thành 'Bất kỳ ai có liên kết đều có thể xem'.",
        "Bước 4: Sao chép liên kết chia sẻ của thư mục và dán vào ô 'Lịch sử câu lệnh và hình ảnh minh chứng' trên cổng nộp bài."
    ]

    for step in steps:
        add_body(doc, step, indent=1)

    doc.save("e:/project/cuoc_thi_AI/Lich_Su_Cau_Lenh_Va_Hinh_Anh_Minh_Chung.docx")
    print("Saved Doc1 plain successfully!")


# ==============================================================================
# DOC 2: Kê khai công cụ AI, dữ liệu, API, thư viện, mã nguồn mở (NO TABLES)
# ==============================================================================
def build_doc2():
    doc = Document()
    for s in doc.sections:
        s.top_margin = Inches(1)
        s.bottom_margin = Inches(1)
        s.left_margin = Inches(1)
        s.right_margin = Inches(1)

    add_title(doc, "KÊ KHAI CÔNG CỤ AI, DỮ LIỆU, API, THƯ VIỆN VÀ MÃ NGUỒN MỞ", "Dự án: STEM HUB - Hệ sinh thái Học tập và Thí nghiệm Ảo\nĐơn vị dự thi: Trường THPT Quỳnh Lưu 4")

    add_heading_1(doc, "I. Cam kết minh bạch dự án")
    add_body(doc, "Nhóm phát triển dự án STEM HUB (Trường THPT Quỳnh Lưu 4) xin cam kết trung thực kê khai toàn bộ các công cụ AI, nguồn dữ liệu, giao diện API, thư viện phần mềm và mã nguồn mở được sử dụng trong quá trình xây dựng sản phẩm theo quy định của Ban Tổ chức Cuộc thi Trí tuệ Nhân tạo do Ban Bí thư Trung ương Đoàn phát động.")

    add_heading_1(doc, "II. Kê khai các công cụ AI đã sử dụng")
    ai_tools = [
        "Antigravity AI Agent (do Google DeepMind phát hành): Hỗ trợ nhóm lập trình mã nguồn, sửa lỗi code và tối ưu hóa các chức năng của website.",
        "Google Gemini API (do Google AI phát hành): Xử lý ngôn ngữ tự nhiên, giúp Trợ lý AI Nova trả lời thắc mắc của học sinh bằng tiếng Việt.",
        "AudioCraft / MusicGen (do Meta AI phát hành): Tạo âm thanh nền và hiệu ứng âm thanh khoa học cho các phòng thí nghiệm ảo."
    ]
    for item in ai_tools:
        parts = item.split(": ")
        add_body(doc, parts[1], bold_prefix=f"- {parts[0]}: ", indent=1)

    add_heading_1(doc, "III. Kê khai nguồn dữ liệu")
    datasets = [
        "Bộ dữ liệu Tri thức STEM THPT (303 đoạn tri thức tóm tắt): Dùng cho Trợ lý AI Nova tra cứu kiến thức SGK 4 môn Toán, Lý, Hóa, Sinh. Nguồn gốc: Nhóm tự biên soạn dựa trên sách giáo khoa Chương trình GDPT 2018.",
        "Ngân hàng Câu hỏi Trắc nghiệm (500+ câu hỏi 4 môn): Dùng cho phân hệ Đấu trường 1v1 và luyện tập. Nguồn gốc: Nhóm tự biên soạn và phân loại độ khó.",
        "Dữ liệu Phản ứng Hóa học (144 mẫu thí nghiệm Hóa): Dùng cho phòng lab Hóa ảo phân tích phản ứng và đưa ra cảnh báo an toàn. Nguồn gốc: Nhóm tự tổng hợp.",
        "Dữ liệu Mẫu Ý định Hội thoại (392 câu thoại tiếng Việt): Dùng cho Trợ lý Nova nhận diện ý định câu hỏi và từ ngữ teencode của học sinh. Nguồn gốc: Nhóm tự thu thập.",
        "Dữ liệu Thao tác Lab Vật lý (96 mẫu thao tác thí nghiệm): Dùng cho phòng lab Vật lý 3D hỗ trợ phát hiện các lỗi thao tác của học sinh. Nguồn gốc: Nhóm tự thử nghiệm."
    ]
    for item in datasets:
        parts = item.split(": ")
        add_body(doc, parts[1], bold_prefix=f"- {parts[0]}: ", indent=1)

    add_heading_1(doc, "IV. Kê khai giao diện API và dịch vụ tích hợp")
    apis = [
        "Google Gemini REST API (Google AI): Dùng để gửi câu hỏi và nhận câu trả lời tư vấn cho học sinh từ Gemini LLM.",
        "Firebase Auth & Cloud Firestore (Google Firebase): Dùng để quản lý tài khoản học sinh, lưu lịch sử thi đấu và điểm xếp hạng ELO.",
        "Web Speech API (Tích hợp sẵn trên trình duyệt): Dùng để nhận diện giọng nói tiếng Việt trực tiếp khi học sinh bấm mic nói chuyện với Trợ lý Nova.",
        "Web Audio API (Tích hợp sẵn trên trình duyệt): Dùng để phát âm thanh hiệu ứng thí nghiệm và nhạc nền học tập."
    ]
    for item in apis:
        parts = item.split(": ")
        add_body(doc, parts[1], bold_prefix=f"- {parts[0]}: ", indent=1)

    add_heading_1(doc, "V. Kê khai thư viện và mã nguồn mở")
    libs = [
        "Next.js / React (Phiên bản 16.2 / 19.0): Framework chính dùng để dựng giao diện website và hệ thống API. Giấy phép: MIT License.",
        "TensorFlow.js / Face-API (Phiên bản 4.x / 1.7.x): Thư viện hỗ trợ tính năng quét khuôn mặt xác thực 2FA. Giấy phép: Apache 2.0 / MIT License.",
        "KaTeX (Phiên bản 0.16.x): Thư viện hiển thị công thức Toán, Lý, Hóa đẹp mắt trên trang web. Giấy phép: MIT License.",
        "Tailwind CSS & Framer Motion (Phiên bản 3.4 / 11.x): Dùng để thiết kế giao diện đẹp, mượt mà và tương thích với nhiều thiết bị. Giấy phép: MIT License.",
        "Zustand & LocalForage (Phiên bản 4.5 / 1.10): Dùng để quản lý trạng thái ứng dụng và lưu trữ bộ nhớ dữ liệu trên trình duyệt. Giấy phép: MIT License.",
        "Lucide React Icons (Phiên bản 0.4x): Bộ biểu tượng đồ họa khoa học dùng trong ứng dụng. Giấy phép: ISC License."
    ]
    for item in libs:
        parts = item.split(": ")
        add_body(doc, parts[1], bold_prefix=f"- {parts[0]}: ", indent=1)

    add_heading_1(doc, "VI. Cam kết bản quyền")
    add_body(doc, "Nhóm phát triển xin cam kết toàn bộ thư viện mã nguồn mở nêu trên đều được sử dụng hợp pháp theo đúng các giấy phép nguồn mở tương ứng. Toàn bộ nội dung bài học, ngân hàng câu hỏi và mã nguồn giao diện của dự án STEM HUB là sản phẩm tự thực hiện của nhóm học sinh Trường THPT Quỳnh Lưu 4.")

    doc.save("e:/project/cuoc_thi_AI/Ke_Khai_Cong_Cu_AI_Du_Lieu_API_Thu_Vien_Ma_Nguon_Mo.docx")
    print("Saved Doc2 plain successfully!")

if __name__ == '__main__':
    build_doc1()
    build_doc2()
