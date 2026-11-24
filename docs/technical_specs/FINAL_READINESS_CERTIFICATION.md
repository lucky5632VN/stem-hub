# BÁO CÁO TỰ ĐÁNH GIÁ MỨC ĐỘ SẴN SÀNG KỸ THUẬT
### TECHNICAL READINESS & SYSTEM INTEGRITY REPORT

> **Đơn vị thực hiện**: Nhóm tác giả học sinh Trường THPT Quỳnh Lưu 4, tỉnh Nghệ An  
> **Dự án**: STEM HUB — Hệ sinh thái Học tập tích hợp Lab ảo 3D, Đấu trường PvP & Trợ lý AI Chỉ huy NOVA  
> **Tác giả**: Hồ Hoàng Anh, Nguyễn Trung Hiếu, Đậu Việt Hưng  
> **Giáo viên hướng dẫn**: Thầy Nguyễn Văn Phúc  
> **Trạng thái**: Báo cáo kỹ thuật nội bộ do nhóm phát triển tự lập phục vụ chặng 1 "Cải tiến, hoàn thiện sản phẩm", Cuộc thi Sáng tạo trẻ Quốc gia 2026.

---

## I. TỔNG QUAN KỸ THUẬT

STEM HUB được thiết kế với kiến trúc lai kết hợp giữa các module máy học cục bộ chạy trên trình duyệt (Edge AI), các thuật toán tất định và cổng kết nối an toàn với mô hình ngôn ngữ lớn (LLM BFF Proxy). 

Trong giai đoạn rà soát và khắc phục hiện trạng, nhóm phát triển đã tiến hành chuẩn hóa toàn bộ các tuyên bố kỹ thuật, gỡ bỏ các dữ liệu giả lập và kiểm toán độc lập trên từng thành phần của hệ thống.

---

## II. CÁC HÀNG RÀO KỸ THUẬT ĐÃ TRIỂN KHAI

### 1. Hiệu năng & Tối ưu Tài nguyên
* **Xử lý nền với Web Worker (Off-Main-Thread RAG)**: Chuyển toàn bộ pipeline tính toán vector TF-IDF 303 chunks sang Web Worker chạy ngầm, giải phóng Main Thread giúp giao diện duy trì phản hồi mượt mà.
* **Chiến lược State Batching qua Zustand Store**: Cô lập trạng thái trận đấu trong RAM máy khách (`usePvPStore`), chỉ đồng bộ lên Firestore tại các mốc định kỳ và kết thúc bằng một giao dịch nguyên tử (`runTransaction`), giúp tiết kiệm đáng kể số lượt ghi cơ sở dữ liệu.
* **Cấu hình Bộ nhớ đệm IndexedDB**: Chuyển đổi Firestore sang `persistentSingleTabManager` kết hợp IndexedDB để tránh tràn hạn ngạch LocalStorage.

### 2. Xử lý Tương tranh & Dự phòng Mất kết nối
* **Cơ chế Xử lý Mất kết nối 4 Tầng**:
  * Tầng 1: Lắng nghe sự kiện `beforeunload` / `pagehide` để cập nhật trạng thái khi người dùng chủ động rời phòng.
  * Tầng 2: Giám sát nhịp tim (Heartbeat) đối thủ, tự động khiếu nại xử thắng nếu đối phương mất tín hiệu liên tục.
  * Tầng 3: Khóa chặn cứng thời gian phòng đấu (`matchExpiresAt`) qua Firestore Security Rules.
  * Tầng 4: Dọn dẹp thụ động các phòng đấu quá hạn trong luồng ghép trận.
* **Giao dịch Nguyên tử (ACID Transactions)**: Quy trình cập nhật điểm số và kết quả trận đấu được bọc trong giao dịch nguyên tử để tránh xung đột dữ liệu.

### 3. An Toàn & Bảo Mật
* **Bảo mật Firestore Security Rules**:
  * Bộ sưu tập `users/{userId}` chỉ cho phép người dùng đã xác thực đọc (`allow read: if isAuthenticated()`).
  * Bộ sưu tập `learned_knowledge` chỉ cho phép đọc các mục đã được giáo viên phê duyệt thật (`status == 'verified_by_teacher' && teacherVerified == true && !quarantined && !isDemo`). Học sinh chỉ được tạo bản ghi ở trạng thái `pending_review`.
* **Cổng Edge Reverse Proxy / Next.js Server Route**: Toàn bộ yêu cầu gọi API trí tuệ nhân tạo ngoại vi được chuyển qua server route `/api/gemini-proxy`, khóa API được lưu ở biến môi trường máy chủ và không bị lộ ra phía client.
* **Xử Lý Dữ Liệu Sinh Trắc Học Khuôn Mặt Phục Vụ Giám Sát Phòng Thi (So Khớp 1:1)**:
  * Sử dụng thư viện `@vladmandic/face-api@1.7.12` (kiến trúc ResNet-34 FaceNet) chạy trực tiếp trên trình duyệt để trích xuất vector đặc trưng số thực 128-D và đối chiếu 1:1 khi thi đấu/làm bài (ngưỡng Euclidean $\le 0.52$).
  * Hệ thống hoàn toàn không lưu trữ ảnh chụp hay video webcam thô của học sinh; chỉ lưu mảng vector số 128-D trong Firestore (`users/{uid}.personalization.faceDescriptor`).
  * Có màn hình thông báo và xin đồng ý rõ ràng trước khi kích hoạt (ghi chú bắt buộc có sự đồng ý của cha mẹ/người giám hộ với học sinh dưới 18 tuổi); có nút xóa vĩnh viễn dữ liệu khuôn mặt.
  * Nhóm ghi nhận lưu ý về bảo mật: do Firestore rule hiện tại cho phép người dùng đã xác thực đọc tài liệu `users/{uid}`, nhóm đã xây dựng lộ trình tách trường sinh trắc học sang subcollection riêng tư để bảo vệ tối đa.
* **Bộ Cắt mạch An toàn (Safety Circuit Breaker)**: Tự động ngắt khẩn cấp và cảnh báo khi thí nghiệm hóa học vượt ngưỡng nguy cơ.

---

## III. CAM KẾT TRUNG THỰC

1. Toàn bộ con số báo cáo được sinh ra từ các bài kiểm thử thực tế và script đo đạc có lưu log trong thư mục `reports/`.
2. Bộ 150 ca kiểm thử là bộ đối chứng kỹ thuật tổng hợp do nhóm xây dựng, chưa qua chấm của giáo viên.
3. Mọi tri thức mới nạp vào hệ thống mặc định ở trạng thái chờ duyệt (`pending_review`) và chỉ được đưa vào RAG sau khi giáo viên thật đăng nhập và phê duyệt trên Teacher Review HUD.
