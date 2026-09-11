import sys
import docx
from docx.shared import Pt, RGBColor

sys.stdout.reconfigure(encoding='utf-8')

def update_section8():
    doc_path = 'AI2026_Mẫu hồ sơ.docx'
    doc = docx.Document(doc_path)
    
    # Tìm paragraph chứa tiêu đề "8. Hạn chế, rủi ro và hướng phát triển"
    idx_header = -1
    for i, p in enumerate(doc.paragraphs):
        if '8. Hạn chế, rủi ro và hướng phát triển' in p.text:
            idx_header = i
            break
            
    if idx_header == -1:
        print("Không tìm thấy tiêu đề Phần 8!")
        return False
        
    print(f"Tìm thấy tiêu đề Phần 8 tại paragraph [{idx_header}]")
    
    p_body = doc.paragraphs[idx_header + 1]
    p_body.text = ""
    
    sections = [
        # a) Hạn chế hiện tại và các điểm nghẽn kỹ thuật (Bottlenecks)
        ("a) Hạn chế hiện tại của sản phẩm & Các điểm nghẽn kỹ thuật (Bottlenecks):\n", True, RGBColor(0x00, 0x33, 0x66)),
        
        ("• Lỗ hổng bảo mật Network Tab khi gọi API ngoài tại Client: ", True, RGBColor(0x22, 0x22, 0x22)),
        ("Mặc dù các khóa API Gemini đã được mã hóa phân tách (_d deobfuscation helper) trong mã nguồn JavaScript để vượt qua các công cụ cào tự động, khi trình duyệt thực hiện lệnh fetch() gửi truy vấn lên máy chủ Google, khóa API vẫn hiển thị dưới dạng chuỗi rõ (plaintext) trong tab Network của DevTools F12. Người dùng am hiểu công nghệ có thể sao chép khóa để gọi cạn kiệt hạn mức 1.500 lượt/ngày của dự án.\n", False, RGBColor(0x33, 0x33, 0x33)),
        
        ("• Nguy cơ cạn kiệt hạn mức ghi (Quota Exhaustion) trên Firebase Spark ($0): ", True, RGBColor(0x22, 0x22, 0x22)),
        ("Gói miễn phí Firebase Spark giới hạn 20.000 lượt ghi (Writes) và 50.000 lượt đọc (Reads)/ngày. Trong tính năng Đấu trường PvP 1v1 thời gian thực, nếu hệ thống ghi nhận trạng thái lên Firestore sau từng nhấp chuột (chọn đáp án, trừ máu, dùng thẻ bài), 50 cặp đấu đồng thời có thể thiêu rụi toàn bộ hạn ngạch trong 15 phút, gây lỗi Quota Exceeded và làm tê liệt cơ sở dữ liệu trong 24 giờ tiếp theo.\n", False, RGBColor(0x33, 0x33, 0x33)),
        
        ("• Nút thắt hiệu năng (Performance Bottleneck) khi chạy RAG Cosine Similarity trên Main Thread: ", True, RGBColor(0x22, 0x22, 0x22)),
        ("Ngân hàng tri thức RAG gồm 303 đoạn ngữ cảnh chuẩn và 9.061 token. Do JavaScript là ngôn ngữ đơn luồng (Single-threaded), việc thực hiện phép nhân ma trận TF-IDF và tính Cosine Similarity trực tiếp trên Main Thread có thể gây hiện tượng đơ/khựng giao diện (UI Freeze) từ 1–2 giây trên các máy tính học đường cấu hình thấp (RAM 2GB–4GB, CPU thế hệ cũ).\n", False, RGBColor(0x33, 0x33, 0x33)),
        
        ("• Rủi ro giả mạo sinh trắc học khuôn mặt qua video quay sẵn (Replay Attack): ", True, RGBColor(0x22, 0x22, 0x22)),
        ("Hệ thống 2FA Face sử dụng mạng ResNet-34 kết hợp chỉ số tỉ lệ mắt (EAR - Eye Aspect Ratio) để đo chớp mắt xác thực người sống. Tuy nhiên, nếu kẻ tấn công sử dụng màn hình điện thoại/máy tính bảng phát lại video người dùng đang chớp mắt trước webcam, thuật toán có thể bị qua mặt (Liveness Spoofing).\n", False, RGBColor(0x33, 0x33, 0x33)),
        
        ("• Rủi ro thao túng mã nguồn phía máy khách (Client-Side Tampering): ", True, RGBColor(0x22, 0x22, 0x22)),
        ("Do hệ thống vận hành 100% Client-Side nhằm duy trì chi phí 0 VNĐ (không sử dụng Backend Server xác thực tốn phí), người dùng có kiến thức lập trình có thể mở F12 Console để can thiệp hàm chấm điểm (ví dụ: ghi đè hàm checkAnswer trả về true), từ đó gian lận điểm số trong các phòng thí nghiệm Toán thích ứng (IRT).\n\n", False, RGBColor(0x33, 0x33, 0x33)),
        
        # b) Các giải pháp kỹ thuật đã và đang áp dụng (Responsible AI & 0đ Architecture)
        ("b) Các rủi ro tiềm ẩn và giải pháp kỹ thuật giải quyết triệt để (Ngân sách 0 VNĐ):\n", True, RGBColor(0x00, 0x33, 0x66)),
        
        ("• Giải pháp Edge Reverse Proxy qua Cloudflare Workers (Bảo vệ API Key): ", True, RGBColor(0x22, 0x22, 0x22)),
        ("Chuyển hướng toàn bộ yêu cầu gọi Gemini API qua một cổng trung gian Cloudflare Worker (hoàn toàn miễn phí 100.000 requests/ngày). Toàn bộ Secret API Key được lưu trong biến môi trường bí mật của Worker; trình duyệt học sinh chỉ gửi câu hỏi đến Endpoint trung gian mà không bao giờ nhìn thấy khóa Google AI, loại bỏ 100% nguy cơ lộ khóa qua Network tab.\n", False, RGBColor(0x33, 0x33, 0x33)),
        
        ("• Giải pháp State Batching (Zustand RAM) & Đồng bộ Checkpoint (Giảm 98,6% lượt ghi): ", True, RGBColor(0x22, 0x22, 0x22)),
        ("Trong Đấu trường PvP 1v1, thay vì ghi nhận Firestore mỗi giây hoặc sau từng câu hỏi, toàn bộ vòng đời trận đấu được cô lập trong RAM trình duyệt thông qua Zustand store (`usePvPStore`). Mọi hiệu ứng khống chế (đóng băng 500ms, sương mù 30s) và bộ đếm thời gian được tính toán cục bộ (0ms UI latency). Hệ thống chỉ đồng bộ Checkpoint tiến độ lên Firestore tại 3 mốc cố định (120s, 60s, 20s) và chốt hạ bằng duy nhất 1 giao dịch nguyên tử (Atomic Write via runTransaction) khi kết thúc. Trạng thái tạm thời được mã hóa lưu vào sessionStorage chống mất mát khi học sinh bấm F5. Tải trọng ghi Firestore giảm từ >215 lượt xuống còn 2–3 lượt/trận (giảm hơn 98,6%), cho phép phục vụ hơn 6.600 trận đấu/ngày hoàn toàn miễn phí.\n", False, RGBColor(0x33, 0x33, 0x33)),
        
        ("• Giao thức Xử thua tự động 4 Tầng chống treo phòng (Zero-Cost 4-Tier Timeout Fallback Protocol): ", True, RGBColor(0x22, 0x22, 0x22)),
        ("Giải quyết bài toán học sinh cố tình đóng trình duyệt (Rage Quit) hoặc rớt mạng khi không có máy chủ Cron chuyên dụng (tiết kiệm 100% chi phí Cloud Functions): (1) Tầng 1 (Graceful Exit Trap): Bắt sự kiện beforeunload/pagehide để gửi cờ playerAbandoned ngay khi tắt tab, đối thủ nhận cờ qua Firestore Snapshot sau 100ms và được xử thắng tức thì; (2) Tầng 2 (Opponent-Driven Watchdog Claim): Client của người chơi còn lại duy trì bộ đếm giám sát tín hiệu đối thủ. Nếu đối thủ im lặng >25 giây, client còn lại chủ động kích hoạt runTransaction khiếu nại xử thắng và phạt -20 ELO người bỏ cuộc; (3) Tầng 3 (Server Expiration Barrier): Phòng đấu được gán matchExpiresAt cố định, Firestore Rules chặn đứng mọi hành vi can thiệp đồng hồ hệ thống sau mốc này; (4) Tầng 4 (Passive Lazy Garbage Collection): Khi học sinh mới tìm trận trong matchmaker, hệ thống tiện tay quét và dọn dẹp các phòng quá hạn mồ côi mà không phát sinh thêm bất kỳ chi phí nào.\n", False, RGBColor(0x33, 0x33, 0x33)),
        
        ("• Tách thuật toán RAG sang Web Worker độc lập (Giải phóng Main Thread): ", True, RGBColor(0x22, 0x22, 0x22)),
        ("Đưa toàn bộ ma trận TF-IDF và hàm tính toán retrieveTopK() vào Web Worker chạy ngầm ở luồng nền (Background Thread). Main Thread hoàn toàn giải phóng để duy trì giao diện mượt mà 60 FPS, học sinh vẫn tương tác bình thường trong lúc AI tìm kiếm tri thức.\n", False, RGBColor(0x33, 0x33, 0x33)),
        
        ("• Nâng cấp Thử thách - Phản hồi ngẫu nhiên (Challenge-Response Liveness Detection): ", True, RGBColor(0x22, 0x22, 0x22)),
        ("Bên cạnh việc đo chớp mắt (EAR), hệ thống đưa ra thử thách ngẫu nhiên tương tác theo thời gian thực (Interactive Liveness) như: 'Vui lòng nghiêng đầu sang trái', 'Vui lòng mỉm cười' (đo góc xoay khuôn mặt Euler Angle và độ mở khóe miệng). Video quay sẵn trên điện thoại/iPad hoàn toàn bất lực trước lệnh thử thách ngẫu nhiên này.\n", False, RGBColor(0x33, 0x33, 0x33)),
        
        ("• Cơ chế Phát hiện dị thường nhận thức (Cognitive Anomaly Detection): ", True, RGBColor(0x22, 0x22, 0x22)),
        ("Tích hợp cảm biến đo lường thời gian đọc hiểu nhận thức tối thiểu (Cognitive Reading Threshold). Nếu một bài toán khó (Item ELO 1800) được nộp đáp án chỉ trong dưới 2 giây, thuật toán tự động nhận diện hành vi dị thường, cắm cờ isCheating: true và Firestore Rules lập tức từ chối cập nhật ELO lên cơ sở dữ liệu.\n", False, RGBColor(0x33, 0x33, 0x33)),
        
        ("• Màng lọc an toàn cứng (Circuit Breaker) & Bảo mật dữ liệu sinh trắc học: ", True, RGBColor(0x22, 0x22, 0x22)),
        ("Duy trì màng lọc an toàn đạt 0% False Negatives ngắt phản ứng hóa học nguy hiểm; bảo vệ quyền riêng tư bằng cách chỉ lưu trữ vector số học 128 chiều, tuyệt đối không lưu hình ảnh khuôn mặt học sinh.\n\n", False, RGBColor(0x33, 0x33, 0x33)),
        
        # c) Hướng phát triển và hoàn thiện tiếp theo
        ("c) Hướng phát triển và hoàn thiện tiếp theo:\n", True, RGBColor(0x00, 0x33, 0x66)),
        
        ("• Đóng gói SLM (Small Language Models) chạy On-device qua WebGPU: ", True, RGBColor(0x22, 0x22, 0x22)),
        ("Nghiên cứu tích hợp các mô hình ngôn ngữ thu nhỏ (Gemma-2B, Qwen2.5-1.5B hoặc Llama-3.2-1B) chạy trực tiếp trên card đồ họa trình duyệt qua WebGPU, giúp toàn bộ hệ thống hoạt động Offline 100% mà không cần gửi dữ liệu ra ngoài Internet.\n", False, RGBColor(0x33, 0x33, 0x33)),
        
        ("• Mở rộng phòng Lab 3D liên môn: ", True, RGBColor(0x22, 0x22, 0x22)),
        ("Phát triển thêm phân hệ thí nghiệm ảo cho môn Công nghệ (mô phỏng mạch vi điều khiển Arduino/ESP32, cánh tay Robot) và môn Tin học (mô phỏng trực quan 3D cấu trúc dữ liệu và giải thuật).\n", False, RGBColor(0x33, 0x33, 0x33)),
        
        ("• Nâng cấp mô hình thích ứng (Adaptive Learning): ", True, RGBColor(0x22, 0x22, 0x22)),
        ("Mở rộng thuật toán Item Response Theory (từ 1PL Rasch lên 2PL/3PL IRT) và tăng quy mô ngân hàng câu hỏi lên trên 10.000 câu theo chuẩn cấu trúc đề thi tốt nghiệp THPT mới của Bộ GD&ĐT.\n", False, RGBColor(0x33, 0x33, 0x33)),
        
        ("• Mở rộng nền tảng Đấu trường PvP cho các giải đấu liên trường toàn quốc: ", True, RGBColor(0x22, 0x22, 0x22)),
        ("Tối ưu hóa hạ tầng kết nối WebSocket/WebRTC để tổ chức các giải đấu cọ xát kiến thức trực tiếp quy mô lớn giữa các trường THPT.", False, RGBColor(0x33, 0x33, 0x33))
    ]
    
    for text, bold, color in sections:
        run = p_body.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)
        run.bold = bold
        run.font.color.rgb = color
        
    doc.save(doc_path)
    print("✅ Đã cập nhật thành công Phần 8 hoàn chỉnh vào file:", doc_path)
    return True

if __name__ == '__main__':
    update_section8()
