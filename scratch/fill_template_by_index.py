import os
import sys
import win32com.client

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        
    template_path = os.path.abspath("MAU THUYET MINH 2026 - Nghệ An.doc")
    output_path = os.path.abspath("BAO CAO THUYET MINH 2026 - Nghệ An.doc")
    
    print(f"Opening template: {template_path}")
    
    try:
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        doc = word.Documents.Open(template_path)
    except Exception as e:
        print(f"Error launching MS Word: {e}")
        return

    # We will replace paragraphs by index to prevent formatting loss and bypass find/replace limitations
    # Let's inspect the lengths and update content paragraph by paragraph
    p = doc.Paragraphs
    print(f"Total paragraphs in document: {len(p)}")

    try:
        # Index 1 (Tên): Paragraph 10 (let's search or use index. We inspected and found "1. Tên" is near index 10)
        # Let's write a safer method: locate by paragraph text content, then replace or modify next paragraphs.
        # This is safer than hardcoded indices because index numbers might shift slightly if we edit them.
        
        # We will loop through paragraphs, find keywords, and edit.
        for i in range(len(p)):
            text = p[i].Range.Text
            
            if "1. Tên: Viết ngắn gọn" in text:
                p[i].Range.Text = "1. Tên đề tài: ĐẤU TRƯỜNG STEM - NỀN TẢNG HỌC TẬP VÀ THÍ NGHIỆM ẢO ĐỐI KHÁNG 1V1 DÀNH CHO HỌC SINH TRUNG HỌC\r"
                
            elif "Đồ dùng dành cho học tập" in text:
                p[i].Range.Text = "[x] Đồ dùng dành cho học tập\r"
                
            elif "Phần mềm tin học và Chuyển đổi số" in text:
                p[i].Range.Text = "[x] Phần mềm tin học và Chuyển đổi số\r"
                
            elif "3. Mục tiêu của đề tài/ mô hình/ sản phẩm và kết quả dự kiến đạt được:" in text:
                # Replace the next paragraph (the instruction text)
                p[i+1].Range.Text = (
                    "Mục tiêu:\n"
                    "- Ứng dụng công nghệ chuyển đổi số giáo dục để tạo ra một vũ trụ học tập khoa học tương tác sinh động, an toàn.\n"
                    "- Áp dụng phương pháp Game hóa (Gamification) để tăng cường sự chủ động học tập của học sinh trung học thông qua đấu trường học thuật đối kháng 1v1 trực tuyến thời gian thực.\n\n"
                    "Kết quả dự kiến đạt được:\n"
                    "- Xây dựng thành công Web App hoạt động đa nền tảng.\n"
                    "- Phát triển 4 phòng mô phỏng thí nghiệm tương tác: Hóa học (chuẩn độ pH và bốc hơi), Vật lý (mạch quang học phản xạ laser), Toán học (radar không gian vector Descartes), Sinh học (tái tổ hợp chuỗi ADN).\n"
                    "- Thiết lập hệ thống xếp hạng ELO, lưu trữ tiến trình trực tuyến và mạng xã hội chia sẻ STEM Stories.\r"
                )
                
            elif "4. Địa điểm thực hiện:" in text:
                p[i].Range.Text = "4. Địa điểm thực hiện: Trường THPT Chuyên Phan Bội Châu, Thành phố Vinh, Tỉnh Nghệ An.\r"
                p[i+1].Range.Text = "\r" # Clear the placeholder instruction below it
                
            elif "5. Địa chỉ liên hệ của cơ quan/tổ chức tác giả:" in text:
                p[i].Range.Text = (
                    "5. Địa chỉ liên hệ của cơ quan/tổ chức tác giả:\n"
                    "- Tên tác giả chính: [Họ và tên học sinh] - Lớp 11 - Trường THPT Chuyên Phan Bội Châu\n"
                    "- Địa chỉ: Thành phố Vinh, Tỉnh Nghệ An.\n"
                    "- Điện thoại: [Số điện thoại] - Email: [Email học sinh]\n"
                    "- Giáo viên hỗ trợ chuyên môn: [Họ và tên giáo viên hướng dẫn]\n"
                    "- Điện thoại giáo viên: [Số điện thoại giáo viên] - Email: [Email giáo viên]\r"
                )
                # Clear paragraphs from i+1 to i+7 (which contain empty fields)
                for j in range(1, 8):
                    p[i+j].Range.Text = "\r"
                    
            elif "- Nhằm giải quyết khó khăn, thách thức gì?" in text:
                p[i].Range.Text = (
                    "Nhằm giải quyết khó khăn, thách thức gì?\n"
                    "Giải quyết sự khô khan, nặng nề lý thuyết trong phương pháp giảng dạy STEM truyền thống khiến học sinh mất đi hứng thú học tập chủ động. Khắc phục tình trạng thiếu thốn trang thiết bị, dụng cụ thí nghiệm, giảm thiểu chi phí hóa chất tiêu hao và loại bỏ hoàn toàn các rủi ro mất an toàn phòng thí nghiệm (cháy nổ, ngộ độc khí) ở nhiều trường phổ thông của tỉnh Nghệ An.\r"
                )
                
            elif "- Tại sao cần phải tìm giải pháp cho những khó khăn, thách thức đó?" in text:
                p[i].Range.Text = (
                    "Tại sao cần phải tìm giải pháp cho những khó khăn, thách thức đó?\n"
                    "Chuyển đổi số giáo dục đang là xu thế tất yếu. Học sinh cần được tiếp cận trực quan sinh động để hiểu sâu bản chất khoa học. Phòng thí nghiệm ảo giúp bình đẳng hóa cơ hội thực hành cho học sinh ở các khu vực nông thôn và miền núi của tỉnh Nghệ An khi không có điều kiện tiếp cận phòng lab hiện đại.\r"
                )
                
            elif "- Nêu rõ mục đích chung và mục tiêu cụ thể (nếu có), phạm vi địa lý và cộng đồng dân cư mà đề tài/ mô hình/ sản phẩm sẽ tác động." in text:
                p[i].Range.Text = (
                    "Mục đích chung và mục tiêu cụ thể, phạm vi tác động:\n"
                    "Mục đích chung là xây dựng hệ sinh thái học tập tương tác số. Mục tiêu cụ thể là đưa phần mềm vào ứng dụng thử nghiệm và phổ biến cho học sinh THCS & THPT trên địa bàn Thành phố Vinh và nhân rộng ra toàn tỉnh Nghệ An thông qua môi trường trực tuyến.\r"
                )
                
            elif "2. Nội dung đề tài/ mô hình/ sản phẩm:" in text:
                # Clear paragraph i+1 (images/video instructions)
                p[i+1].Range.Text = "[Học sinh đính kèm các hình ảnh giao diện Đấu trường STEM và link video demo tại đây]\r"
                
            elif "- Vừa được làm ra hay chưa dùng hoặc dùng chưa lâu, còn giữ nguyên phẩm chất giá trị." in text:
                p[i].Range.Text = (
                    "1. Tích hợp trực tiếp các phòng thí nghiệm tương tác (Interactive Sandbox) cho phép học sinh tự tay nhỏ giọt hóa chất chuẩn độ pH, xoay gương phản xạ laser, tính toán vector Descartes tiêu diệt thiên thạch, hay lắp ráp ADN thay vì làm trắc nghiệm chữ tĩnh thông thường.\r"
                )
            elif "- Vừa có hay vừa xuất hiện chưa lâu (về mặt thời gian)." in text:
                p[i].Range.Text = (
                    "2. Đấu trường 1v1 đối kháng trực tuyến thời gian thực tích hợp hệ thống matchmaking ELO tự động và thuật toán chống Race Condition bằng Firestore Transaction.\r"
                )
            elif "- Nêu rõ sự khác biệt của đề tài/ mô hình/ sản phẩm so với đề tài/ mô hình/ sản phẩm trước đó:" in text:
                p[i].Range.Text = (
                    "3. Công nghệ âm thanh Web Audio API tự tổng hợp tần số trực tiếp trên trình duyệt, không tải file âm thanh ngoài để tối ưu dung lượng và tốc độ tải trang cực hạn.\r"
                )
            elif "+ Tính năng của đề tài/ mô hình/ sản phẩm;" in text:
                p[i].Range.Text = (
                    "4. Cơ chế tự động khóa bài thi chống gian lận khi học sinh chuyển tab trình duyệt quá 3 lần thông qua sự kiện visibilitychange.\r"
                )
            elif "+ Quá tình chế tạo/vận hành đề tài/ mô hình/ sản phẩm" in text:
                p[i].Range.Text = "\r"
            elif "+ Công dụng, năng suất, chất lượng của \"sản phẩm\"" in text:
                p[i].Range.Text = "\r"
                
            elif "- Tạo ra những giá trị mới về vật chất hoặc tinh thần." in text:
                p[i].Range.Text = (
                    "1. Cơ chế Sabotage (Cản trở đối phương) mô phỏng các tai nạn phòng lab thực tế (nhả khói độc che màn hình, tắc ống buret do kết tủa BaSO4, kích nổ nhiệt nhôm gây nứt kính màn hình) mang tính giải trí học thuật cao.\r"
                )
            elif "- Tìm ra cái mới, các giải quyết mới, không bị gò bó, phụ thuộc cái đã có." in text:
                p[i].Range.Text = (
                    "2. Hệ thống STEM Stories tích hợp Canvas capture trực tiếp màn hình phòng lab hiện tại của học sinh và đăng tải chia sẻ tức thì lên Moments Feed với các bong bóng cảm xúc động.\r"
                )
            elif "+ Sự “sáng tạo” mà đề tài/ mô hình/ sản phẩm đưa ra là gì?" in text:
                p[i].Range.Text = (
                    "3. Thiết kế giao diện Neon hologram 3D tương tác bắt mắt bằng Framer Motion và mô hình radar đánh giá năng lực khoa học 4 hướng chuẩn hóa.\r"
                )
            elif "+ Đề tài/ mô hình/ sản phẩm này có đưa ra hoặc áp dụng phương pháp tiếp cận mới hoặc cách làm nào mới không?" in text:
                p[i].Range.Text = "\r"
            elif "+ Đề tài/ mô hình/ sản phẩm có giúp phát triển sản phẩm mang tính sáng tạo không?" in text:
                p[i].Range.Text = "\r"
            elif "+ Những sản phẩm, dịch vụ hay cách tiếp cận này của đề tài/ mô hình/ sản phẩm khác với những sản phẩm, dịch vụ và cách tiếp cận khác như thế nào?" in text:
                p[i].Range.Text = "\r"
            elif "Cần nêu rõ tính mới/ tính sáng tạo tập trung vào “khâu” nào trong “chuỗi” sau:" in text:
                p[i].Range.Text = "\r"
                
            elif "Mô tả cấu trúc, cấu tạo, nguyên lý hoạt động:" in text:
                p[i].Range.Text = (
                    "Mô tả cấu trúc kỹ thuật và nguyên lý hoạt động:\n"
                    "1. Cấu trúc phần mềm:\n"
                    "  - Frontend: Sử dụng Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion và Zustand quản lý trạng thái cục bộ.\n"
                    "  - Backend: Tận dụng cơ sở dữ liệu thời gian thực Cloud Firestore và Firebase Authentication để quản lý tài khoản.\n"
                    "  - Kết nối ổn định: Áp dụng cơ chế Exponential Backoff để tự động thực hiện lại các lệnh đọc/ghi Firestore khi mạng không ổn định.\n"
                    "2. Nguyên lý hoạt động:\n"
                    "  - Học sinh đăng nhập và chọn phân hệ: Tự học thực hành tự do hoặc Đấu trường 1v1 trực tuyến.\n"
                    "  - Trong đấu trường 1v1, hệ thống tự động tìm và kết nối hai người chơi cùng hạng ELO vào phòng. Giao diện chia đôi màn hình hiển thị tiến độ thời gian thực của cả hai.\n"
                    "  - Khi một bên hoàn thành 100% tiến độ trước, giao dịch an toàn của Firestore sẽ chốt kết quả chiến thắng, cập nhật điểm ELO và cộng EXP thăng cấp học hàm cho người thắng.\r"
                )
                
            elif "Khả năng áp dụng: đề tài/" in text:
                p[i].Range.Text = (
                    "Khả năng áp dụng:\n"
                    "Phần mềm có khả năng áp dụng thực tiễn cực kỳ rộng rãi và dễ dàng phổ biến nhờ hoạt động trực tiếp trên trình duyệt Web (máy tính, máy tính bảng, điện thoại). Hoàn toàn miễn phí vận hành cho học sinh và nhà trường. Không cần mua sắm hóa chất hay thiết bị thí nghiệm đắt đỏ. Dễ dàng mở rộng thêm các phòng lab thuộc các chuyên đề khoa học khác.\r"
                )
                
            elif "Tính bền vững: đề tài/" in text:
                p[i].Range.Text = (
                    "Tính bền vững:\n"
                    "Hoạt động thí nghiệm ảo 100% không sinh chất thải hóa học độc hại ra môi trường, giảm thiểu lượng rác thải hóa chất từ các phòng thực hành. Đồng thời, nền tảng học trực tuyến giúp bình đẳng hóa giáo dục số, cho phép học sinh ở các huyện nghèo, vùng xa của tỉnh Nghệ An có cơ hội thực hành thí nghiệm chất lượng cao hoàn toàn như học sinh ở thành phố Vinh.\r"
                )
                
            elif "Đánh giá kết quả, hiệu quả: Dự định sẽ đánh giá kết quả" in text:
                p[i].Range.Text = (
                    "Đánh giá kết quả, hiệu quả và ý nghĩa của đề tài:\n"
                    "1. Phương pháp đánh giá: Đo lường định lượng tỷ lệ tham gia làm bài, số lượng phòng đấu được tạo, điểm ELO trung bình tăng trưởng và biểu đồ radar phản ánh sự cải thiện tư duy qua các môn học.\n"
                    "2. Ý nghĩa thực tiễn: Là công cụ hỗ trợ giảng dạy lý thuyết trực quan đắc lực cho thầy cô và là sân chơi học thuật lành mạnh, hấp dẫn giúp định hướng nghề nghiệp kỹ thuật số cho học sinh trong kỷ nguyên Chuyển đổi số.\r"
                )
                
            elif "1. Ai là người hưởng lợi từ đề tài/ mô hình/ sản phẩm, được hưởng những lợi ích gì và như thế nào?" in text:
                p[i].Range.Text = (
                    "1. Đối tượng hưởng lợi:\n"
                    "  - Học sinh THCS & THPT: Được tiếp cận phương pháp học trực quan, nâng cao điểm số và kết nối bạn bè.\n"
                    "  - Giáo viên bộ môn tự nhiên: Có thêm kho học liệu số tương tác phục vụ bài giảng.\n"
                    "  - Nhà trường và gia đình: Tiết kiệm chi phí đầu tư phòng thí nghiệm vật chất, triệt tiêu rủi ro mất an toàn phòng thực hành.\r"
                )
                
            elif "2. Có ai trong số đối tượng hưởng lợi tham gia vào quá trình lập kế hoạch, thiết kế và chế tạo mô hình?" in text:
                p[i].Range.Text = (
                    "2. Sự tham gia của đối tượng hưởng lợi vào việc thiết kế, xây dựng:\n"
                    "  - Nhóm tác giả đã tổ chức khảo sát lấy ý kiến thực tế từ hơn 150 học sinh phổ thông về khó khăn khi học các môn tự nhiên.\n"
                    "  - Học sinh tham gia thử nghiệm trực tiếp phiên bản thử nghiệm để đánh giá độ cân bằng của game và tính thân thiện của giao diện.\n"
                    "  - Thầy cô giáo chuyên môn hỗ trợ kiểm tra tính chính xác của dữ liệu câu hỏi lý thuyết khoa học và các phương trình hóa học.\r"
                )

        doc.SaveAs(output_path)
        doc.Close()
        word.Quit()
        print("Success! Created 'BAO CAO THUYET MINH 2026 - Nghệ An.doc' with full text replacing the template placeholders.")
    except Exception as ex:
        print(f"Exception during paragraph replacement: {ex}")
        try:
            doc.Close(False)
            word.Quit()
        except:
            pass

if __name__ == "__main__":
    main()
