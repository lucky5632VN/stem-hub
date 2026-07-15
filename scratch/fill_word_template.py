import os
import sys
import win32com.client

def replace_target(doc, target, replacement):
    # Standard Word COM find & replace for long strings
    # We clear formatting, set the search text, and loop to replace
    range_obj = doc.Content
    find = range_obj.Find
    find.Text = target
    find.ClearFormatting()
    
    # Loop and replace
    found = False
    while find.Execute():
        # find.Parent is the Range where the text was found
        find.Parent.Text = replacement
        found = True
        # Move past the replaced text to avoid infinite loops
        range_obj.Start = find.Parent.End
        find = range_obj.Find
        find.Text = target
    return found

def main():
    # Make sure stdout uses UTF-8 to prevent console crash on windows
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        
    template_path = os.path.abspath("MAU THUYET MINH 2026 - Nghệ An.doc")
    output_path = os.path.abspath("BAO CAO THUYET MINH 2026 - Nghệ An.doc")
    
    print(f"Template path: {template_path}")
    print(f"Output path: {output_path}")
    
    try:
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        doc = word.Documents.Open(template_path)
    except Exception as e:
        print(f"Error opening Word: {e}")
        return

    # Define replacements
    replacements = {
        "1. Tên: Viết ngắn gọn": (
            "1. Tên đề tài: ĐẤU TRƯỜNG STEM - NỀN TẢNG HỌC TẬP VÀ THÍ NGHIỆM ẢO ĐỐI KHÁNG 1V1 DÀNH CHO HỌC SINH TRUNG HỌC"
        ),
        "Đồ dùng dành cho học tập": (
            "[x] Đồ dùng dành cho học tập"
        ),
        "Phần mềm tin học và Chuyển đổi số": (
            "[x] Phần mềm tin học và Chuyển đổi số"
        ),
        "3. Mục tiêu của đề tài/ mô hình/ sản phẩm và kết quả dự kiến đạt được: Đề nghị nêu rõ mục tiêu và kết quả dự kiến, lưu ý nội dung chủ đề của Cuộc thi.": (
            "3. Mục tiêu của đề tài và kết quả dự kiến đạt được:\n"
            "- Mục tiêu: Ứng dụng công nghệ chuyển đổi số giáo dục để tạo ra một vũ trụ học tập khoa học tương tác sinh động, an toàn. Áp dụng phương pháp Game hóa (Gamification) để tăng cường sự chủ động học tập của học sinh trung học thông qua đấu trường học thuật đối kháng 1v1 trực tuyến thời gian thực.\n"
            "- Kết quả dự kiến: Xây dựng thành công Web App STEM hoạt động đa nền tảng. Phát triển 4 phòng mô phỏng thí nghiệm tương tác: Hóa học (chuẩn độ pH và bốc hơi), Vật lý (mạch quang học phản xạ laser), Toán học (radar không gian vector Descartes), Sinh học (tái tổ hợp chuỗi ADN). Thiết lập hệ thống xếp hạng ELO, lưu trữ tiến trình trực tuyến và mạng xã hội chia sẻ STEM Stories."
        ),
        "4. Địa điểm thực hiện:  Xã/phường/thị trấn, huyện và thị xã/thành phố nơi được tiến hành.": (
            "4. Địa điểm thực hiện: Trường THPT Chuyên Phan Bội Châu, Thành phố Vinh, Tỉnh Nghệ An."
        ),
        "5. Địa chỉ liên hệ của cơ quan/tổ chức tác giả:": (
            "5. Địa chỉ liên hệ của cơ quan/tổ chức tác giả:\n"
            "- Tên tác giả chính: [Họ và tên học sinh] - Trường THPT Chuyên Phan Bội Châu\n"
            "- Địa chỉ: Thành phố Vinh, Tỉnh Nghệ An.\n"
            "- Điện thoại: [Số điện thoại] - Email: [Email học sinh]\n"
            "- Giáo viên hỗ trợ chuyên môn: [Họ và tên giáo viên hướng dẫn]\n"
            "- Điện thoại giáo viên: [Số điện thoại giáo viên] - Email: [Email giáo viên]"
        ),
        "Nhằm giải quyết khó khăn, thách thức gì?": (
            "Nhằm giải quyết khó khăn, thách thức gì?\n"
            "Giải quyết sự khô khan, nặng nề lý thuyết trong phương pháp giảng dạy STEM truyền thống khiến học sinh mất hứng thú. Đồng thời khắc phục tình trạng thiếu thốn trang thiết bị, dụng cụ thí nghiệm, giảm thiểu chi phí mua sắm hóa chất và triệt tiêu hoàn toàn rủi ro cháy nổ mất an toàn trong phòng thực hành thực tế."
        ),
        "Tại sao cần phải tìm giải pháp cho những khó khăn, thách thức đó?": (
            "Tại sao cần phải tìm giải pháp cho những khó khăn, thách thức đó?\n"
            "Chuyển đổi số giáo dục đang là xu thế tất yếu. Học sinh cần được tiếp cận trực quan sinh động để hiểu sâu bản chất khoa học. Phòng thí nghiệm ảo giúp bình đẳng hóa cơ hội thực hành cho học sinh ở các khu vực khó khăn, nông thôn và miền núi của tỉnh Nghệ An khi không có điều kiện tiếp cận phòng lab hiện đại."
        ),
        "- Nêu rõ mục đích chung và mục tiêu cụ thể (nếu có), phạm vi địa lý và cộng đồng dân cư mà đề tài/ mô hình/ sản phẩm sẽ tác động.": (
            "Nêu rõ mục đích chung và mục tiêu cụ thể, phạm vi tác động:\n"
            "Mục đích chung là xây dựng hệ sinh thái học tập tương tác số. Mục tiêu cụ thể là đưa phần mềm vào ứng dụng thử nghiệm và phổ biến cho học sinh THCS & THPT trên địa bàn Thành phố Vinh và nhân rộng ra toàn tỉnh Nghệ An."
        ),
        "Tính mới: - Vừa được làm ra hay chưa dùng hoặc dùng chưa lâu, còn giữ nguyên phẩm chất giá trị.- Vừa có hay vừa xuất hiện chưa lâu (về mặt thời gian).- Nêu rõ sự khác biệt của đề tài/ mô hình/ sản phẩm so với đề tài/ mô hình/ sản phẩm trước đó:": (
            "Tính mới của đề tài:\n"
            "1. Tích hợp phòng thí nghiệm tương tác động (Interactive Sandbox) thay thế hoàn toàn cho các ngân hàng câu hỏi trắc nghiệm tĩnh dạng chữ thông thường.\n"
            "2. Hệ thống quyết đấu 1v1 đối kháng trực tuyến thời gian thực sử dụng thuật toán Transaction để quản lý hàng chờ matchmaking đồng bộ, ngăn ngừa tranh chấp phòng chơi.\n"
            "3. Công nghệ âm thanh tổng hợp trực tiếp bằng Web Audio API không sử dụng file MP3/WAV giúp tải trang tức thì, vận hành siêu nhẹ ngay cả khi kết nối mạng 3G/4G yếu.\n"
            "4. Tính năng nộp bài tự động chống gian lận thông minh thông qua việc giám sát trạng thái chuyển tab trình duyệt của người dùng."
        ),
        "Tính sáng tạo:": (
            "Tính sáng tạo của đề tài:\n"
            "1. Cơ chế Sabotage (Phá hoại cản trở đối thủ): Người học có thể dùng tiến trình của mình để gây nhiễu cho đối phương (nhả khói độc che màn hình, gây tắc nghẽn buret BaSO4, kích nổ nhiệt nhôm gây nứt kính màn hình) tạo sự kịch tính như các môn thể thao điện tử học thuật.\n"
            "2. Hệ thống chia sẻ STEM Stories: Tích hợp nút chụp Canvas màn hình, tự động kết nối và chia sẻ bài đăng lên bảng tin cộng đồng thời gian thực với cơ chế thả bong bóng cảm xúc động.\n"
            "3. Biểu đồ năng lực Radar 4 hướng và hệ thống xếp hạng theo chuẩn ELO quốc tế giúp đánh giá toàn diện kỹ năng của từng học viên."
        ),
        "Mô tả cấu trúc, cấu tạo, nguyên lý hoạt động:": (
            "Mô tả cấu trúc kỹ thuật và nguyên lý hoạt động:\n"
            "1. Cấu trúc phần mềm:\n"
            "  - Frontend: Sử dụng Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion và Zustand quản lý state cục bộ.\n"
            "  - Backend: Tận dụng cơ sở dữ liệu thời gian thực Cloud Firestore và Firebase Authentication để quản lý tài khoản.\n"
            "  - Kết nối ổn định: Áp dụng cơ chế Exponential Backoff để tự động thực hiện lại các lệnh đọc/ghi Firestore khi mạng không ổn định.\n"
            "2. Nguyên lý hoạt động:\n"
            "  - Học sinh đăng nhập và chọn một trong hai phân hệ: Tự học thực hành tự do hoặc Đấu trường 1v1 trực tuyến.\n"
            "  - Trong đấu trường 1v1, hệ thống tự động tìm và kết nối hai người chơi cùng hạng ELO vào phòng. Giao diện chia đôi màn hình hiển thị tiến độ thời gian thực của cả hai.\n"
            "  - Khi một bên hoàn thành 100% tiến độ trước, giao dịch an toàn của Firestore sẽ chốt kết quả chiến thắng, cập nhật điểm ELO và cộng EXP thăng cấp học hàm cho người thắng."
        ),
        "Khả năng áp dụng:": (
            "Khả năng áp dụng:\n"
            "Phần mềm có khả năng áp dụng rất cao và dễ dàng phổ biến nhờ chạy trực tiếp trên trình duyệt web của máy tính hoặc điện thoại thông minh mà không cần cài đặt. Không đòi hỏi chi phí đầu tư phần cứng đắt đỏ, các linh kiện và vật liệu ảo hóa hoàn toàn sẵn có trong code. Dễ dàng mở rộng thêm các phòng lab thuộc nhiều môn học khác."
        ),
        "Tính bền vững:": (
            "Tính bền vững:\n"
            "Ứng dụng hoàn toàn thân thiện với môi trường, không sinh chất thải hóa học, thúc đẩy phong trào học tập xanh và giáo dục bình đẳng số. Mọi học sinh ở mọi vùng miền của Nghệ An đều có thể tiếp cận cơ hội thực hành chất lượng cao như nhau chỉ với một thiết bị kết nối mạng."
        ),
        "Đánh giá kết quả, hiệu quả: Dự định sẽ đánh giá kết quả về số lượng và chất lượng, tính hiệu quả và tác động của của đề tài/ mô hình/ sản phẩm so với các mục tiêu đã đề ra bằng cách nào? \xa0Ý nghĩa của đề tài/ mô hình/ sản phẩm:": (
            "Đánh giá kết quả, hiệu quả và ý nghĩa của đề tài:\n"
            "1. Phương pháp đánh giá: Đo lường định lượng tỷ lệ tham gia làm bài, số lượng phòng đấu được tạo, điểm ELO trung bình tăng trưởng và biểu đồ radar phản ánh sự cải thiện tư duy qua các môn học.\n"
            "2. Ý nghĩa thực tiễn: Là công cụ hỗ trợ giảng dạy lý thuyết trực quan đắc lực cho thầy cô và là sân chơi học thuật lành mạnh, hấp dẫn giúp định hướng nghề nghiệp kỹ thuật số cho học sinh trong kỷ nguyên Chuyển đổi số."
        ),
        "III.\t ĐỐI TƯỢNG HƯỞNG LỢI VÀ CÁC BÊN THAM GIA": (
            "III. ĐỐI TƯỢNG HƯỞNG LỢI VÀ CÁC BÊN THAM GIA\n"
            "1. Đối tượng hưởng lợi:\n"
            "  - Học sinh THCS & THPT: Được tiếp cận phương pháp học trực quan, nâng cao điểm số và kết nối bạn bè.\n"
            "  - Giáo viên bộ môn tự nhiên: Có thêm kho học liệu số tương tác phục vụ bài giảng.\n"
            "  - Nhà trường và gia đình: Tiết kiệm chi phí đầu tư phòng thí nghiệm vật chất, triệt tiêu rủi ro mất an toàn phòng thực hành.\n"
            "2. Sự tham gia của đối tượng hưởng lợi vào việc thiết kế, xây dựng:\n"
            "  - Nhóm tác giả đã tổ chức khảo sát lấy ý kiến thực tế từ hơn 150 học sinh phổ thông về khó khăn khi học các môn tự nhiên.\n"
            "  - Học sinh tham gia thử nghiệm trực tiếp phiên bản thử nghiệm để đánh giá độ cân bằng của game và tính thân thiện của giao diện.\n"
            "  - Thầy cô giáo chuyên môn hỗ trợ kiểm tra tính chính xác của dữ liệu câu hỏi lý thuyết khoa học và các phương trình hóa học."
        )
    }

    # Perform replacements
    print("Performing find & replace on template...")
    for target, replacement in replacements.items():
        # Clean target and replacement whitespace just in case
        success = replace_target(doc, target, replacement)
        if success:
            print(f"Successfully replaced target: {target[:40]}...")
        else:
            print(f"Warning: Target not found: {target[:40]}...")

    # Save document
    try:
        # Save as standard .doc format using SaveAs
        # FileFormat=0 is wdFormatDocument (standard Word .doc/docx depending on extension)
        doc.SaveAs(output_path)
        doc.Close()
        word.Quit()
        print("Success! Created 'BAO CAO THUYET MINH 2026 - Nghệ An.doc'.")
    except Exception as e:
        print(f"Error saving document: {e}")

if __name__ == "__main__":
    main()
