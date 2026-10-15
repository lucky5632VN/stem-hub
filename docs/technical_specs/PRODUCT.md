# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Học sinh THPT**: Đối tượng người dùng chính (đặc biệt học sinh trường THPT Quỳnh Lưu 4, Nghệ An và các trường phổ thông học chương trình GDPT mới). Học sinh cần một không gian học tập trực quan sinh động, thực hành các thí nghiệm khó hoặc nguy hiểm ngoài đời thực, ôn luyện đề thi THPT Quốc gia và tham gia thách đấu kiến thức PvP 1v1 để tăng hứng thú học tập.
- **Giáo viên & Giám khảo**: Theo dõi tiến độ học tập, kiểm tra báo cáo minh bạch và độ tin cậy của 6 mô hình AI tự huấn luyện phục vụ công tác giảng dạy và thẩm định cuộc thi.

## Product Purpose

- Chuyển đổi phương pháp học các môn STEM (Toán, Vật lý, Hóa học, Sinh học) từ lý thuyết khô khan thành trải nghiệm tương tác 2D/3D trực quan, an toàn và lôi cuốn.
- Cung cấp hệ sinh thái toàn diện: 4 phòng thí nghiệm ảo mô phỏng thời gian thực, Đấu trường tri thức 1v1 PvP gay cấn, Phòng luyện thi trắc nghiệm chuẩn cấu trúc MoET và Trợ lý AI chỉ huy học tập Javit/NOVA HUD.
- Thước đo thành công: Học sinh chủ động làm thí nghiệm, nắm vững bản chất khoa học, nâng cao phản xạ giải đề và đạt kết quả thi cử tốt hơn.

## Positioning

- Cổng học tập & đấu trường STEM tiên phong tại Việt Nam tích hợp **6 mô hình AI tự huấn luyện (Self-Trained AI Registry)** chạy 100% cục bộ (Client-Side) trên trình duyệt, đạt chuẩn minh bạch tuyệt đối của Cuộc thi Sáng tạo AI Quốc gia mà không phụ thuộc vào API AI thương mại ngoài.
- Kết hợp phong cách thiết kế Trung tâm Chỉ huy Sci-Fi / Cyberpunk tương tác cao (Three.js, HTML5 Canvas, KaTeX, Web Audio Synthesizer, Biometric Face 2FA) với tính sư phạm bám sát chương trình giáo dục phổ thông.

## Operating Context

- Môi trường hoạt động: Trình duyệt web hiện đại (Google Chrome, Microsoft Edge, Safari) trên máy tính để bàn, laptop và thiết bị di động.
- Ngữ cảnh sử dụng: Học sinh tự học tại nhà, thực hành trong phòng tin học / câu lạc bộ STEM của trường, hoặc tham gia các giải đấu STEM Arena theo mùa giải.
- Điều kiện vận hành: Tối ưu cho cả kết nối mạng ổn định lẫn mạng chập chờn nhờ kiến trúc AI cục bộ và đồng bộ dữ liệu thời gian thực qua Firebase Firestore.

## Capabilities and Constraints

- **Khả năng cốt lõi**:
  - 4 Phòng Lab ảo:
    - *Lab Hóa học*: Pha trộn chất, mô phỏng phản ứng đổi màu/kết tủa/khí, mạng nơ-ron phân loại rủi ro phản ứng hóa học (Dense Softmax NN).
    - *Lab Vật lý*: Quang học Laser 2D/3D phản xạ/khúc xạ, thuật toán kNN Z-Score chẩn đoán lỗi thao tác thực nghiệm.
    - *Lab Toán học*: Không gian hàm số & hình học giải tích, động cơ 1PL Rasch IRT chọn câu hỏi thích ứng theo ELO người học.
    - *Lab Sinh học*: Mô phỏng quy luật phân ly & phân ly độc lập Mendel bằng mô hình xác suất Bayes đa gen (Bayesian Reasoner).
  - Đấu trường 1v1 PvP: Ghép trận thời gian thực, thi đấu theo lượt tính giờ, hiệu ứng kỹ năng (Khiên, Đóng băng, Sương mù), hệ thống xếp hạng ELO và AI Bot Heuristics khi không có người đấu cùng.
  - Phòng thi THPT QG: Bộ đề trắc nghiệm chuẩn ma trận, tính giờ, phân tích đáp án chi tiết với KaTeX, cấp chứng chỉ thành tích qua Canvas.
  - Trợ lý AI Javit / NOVA HUD: Hệ thống RAG đa ngôn ngữ (TF-IDF N-Gram Matrix + Cosine Similarity) truy xuất kiến thức bài giảng STEM và thực thi điều hướng giao diện.
  - Bảo mật sinh trắc học Face 2FA: ResNet-34 FaceNet nhận diện khuôn mặt và kiểm tra độ sống (Eye Aspect Ratio Liveness).
- **Ràng buộc kỹ thuật**:
  - Framework: Next.js 16 (App Router), cấu hình Static Export (`output: 'export'`) phục vụ Firebase Hosting / Cloudflare Pages.
  - CSDL & Xác thực: Firebase Firestore, Firebase Authentication (Email Magic Link).
  - Yêu cầu AI: Tất cả 6 mô hình AI phải chạy 100% Client-Side trong trình duyệt, không phát sinh chi phí API cloud ngoài.

## Brand Commitments

- **Tên sản phẩm**: STEM HUB (Đấu Trường & Phòng Thí Nghiệm Học Tập STEM).
- **Tông giọng (Voice)**: Trí tuệ, năng động, mang phong cách công nghệ tương lai (Sci-Fi Academy), kích thích khát vọng khám phá khoa học.
- **Bản sắc thiết kế**: Tone nền tối (Dark Sci-Fi), hiệu ứng kính mờ (Glassmorphism), viền phát sáng Neon Cyan/Blue/Purple, giao diện điều khiển dạng HUD phi thuyền không gian.

## Evidence on Hand

- Mã nguồn và trọng số 6 mô hình AI tại `src/ai-training/`.
- Nhật ký huấn luyện và chứng nhận sẵn sàng tại [TRAINING_LOG.md](TRAINING_LOG.md) và [FINAL_READINESS_CERTIFICATION.md](FINAL_READINESS_CERTIFICATION.md).
- Kiến trúc hệ thống toàn diện tại [STEM_HUB_WEB_ARCHITECTURE_AI_DOCUMENTATION.md](STEM_HUB_WEB_ARCHITECTURE_AI_DOCUMENTATION.md).
- 4 module phòng lab hoàn chỉnh tại thư mục `src/components/labs/`.

## Product Principles

1. **Minh bạch & Chuẩn xác Khoa học**: Mọi mô phỏng vật lý/hóa học và phân loại AI phải dựa trên định luật khoa học thực tế, giải thích được và kiểm chứng minh bạch.
2. **Học qua Trải nghiệm & Tranh tài (Gamified Learning)**: Biến kiến thức thành thử thách, thực nghiệm trực quan và đối kháng trí tuệ thay vì học vẹt một chiều.
3. **Tự chủ Công nghệ (Client-Side Independence)**: Tối đa hóa khả năng xử lý trên máy người dùng, bảo vệ quyền riêng tư, phản hồi tức thời và không phụ thuộc hạ tầng đắt đỏ.
4. **Chuẩn mực Thiết kế Tương lai (Sci-Fi Craft)**: Xây dựng giao diện sắc nét, giàu cảm xúc thị giác, mang lại sự tự hào và hứng khởi cho học sinh khi đăng nhập học tập.

## Accessibility & Inclusion

- Responsive hoàn chỉnh từ Mobile (375px) đến Desktop độ phân giải cao.
- Độ tương phản cao cho văn bản khoa học và công thức toán học KaTeX.
- Tùy chọn bật/tắt toàn bộ hiệu ứng âm thanh synthesizer để phù hợp với môi trường học tập yên tĩnh.
