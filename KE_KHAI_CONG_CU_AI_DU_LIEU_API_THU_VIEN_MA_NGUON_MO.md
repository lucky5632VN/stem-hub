# BẢN KÊ KHAI CHI TIẾT CÔNG CỤ TRÍ TUỆ NHÂN TẠO, NGUỒN DỮ LIỆU, GIAO DIỆN API VÀ MÃ NGUỒN MỞ

**DỰ ÁN**: STEM HUB — HỆ SINH THÁI HỌC TẬP VÀ PHÒNG THÍ NGHIỆM ẢO 3D TÍCH HỢP AI  
**Đơn vị dự thi**: Nhóm học sinh Trường THPT Quỳnh Lưu 4, tỉnh Nghệ An  
**Cuộc thi**: Sáng tạo trẻ trong lĩnh vực Trí tuệ Nhân tạo năm 2026 do Ban Bí thư Trung ương Đoàn phát động  
**Thời gian lập**: Tháng 09/2026  

---

### I. LỜI CAM ĐOAN MỞ ĐẦU VÀ NGUYÊN TẮC LIÊM CHÍNH HỌC THUẬT

**Kính gửi**: Ban Tổ chức và Ban Giám khảo Cuộc thi Sáng tạo trẻ trong lĩnh vực Trí tuệ Nhân tạo năm 2026.

Em là **Hồ Hoàng Anh**, học sinh lớp 12A trường THPT Quỳnh Lưu 4, đại diện cho nhóm tác giả gồm 03 học sinh (Hồ Hoàng Anh, Nguyễn Trung Hiếu, Đậu Việt Hưng) dưới sự hướng dẫn chuyên môn của thầy giáo Nguyễn Văn Phúc, xin được gửi tới Ban Giám khảo lời chào trân trọng nhất.

Nhóm chúng em xin cam đoan kê khai một cách đầy đủ, chi tiết, minh bạch và trung thực 100% toàn bộ các công cụ trí tuệ nhân tạo, nguồn dữ liệu học tập, các giao diện kết nối API đám mây, các mô hình học máy tự huấn luyện và các thư viện mã nguồn mở mà nhóm đã tìm hiểu, tích hợp và triển khai trong suốt quá trình xây dựng hệ thống STEM HUB.

**Nguyên tắc liêm chính học thuật**:
Toàn bộ ý tưởng bài toán sư phạm, kịch bản thí nghiệm ảo 3D, kiến trúc hệ thống, cấu trúc dữ liệu SGK GDPT 2018, thuật toán giải suy luận hình học và phần lớn mã nguồn giao diện tương tác đều do nhóm chúng em trực tiếp thiết kế, làm chủ và lập trình. Các công cụ AI bên ngoài đóng vai trò hỗ trợ kỹ thuật, tăng tốc phát triển và tối ưu hóa giải thuật theo đúng định hướng của cuộc thi.

---

### II. CÁC CÔNG CỤ TRÍ TUỆ NHÂN TẠO VÀ DỊCH VỤ MÔ HÌNH NGÔN NGỮ LỚN (LLM)

Trong quá trình thực hiện dự án, nhóm chúng em đã chủ động tìm tòi và ứng dụng có chọn lọc các công cụ AI hiện đại:

#### 1. Trợ lý lập trình Trí tuệ Nhân tạo Google Antigravity & Claude 3.5 Sonnet
- **Mục đích sử dụng**: Hỗ trợ sinh khung mã nguồn (boilerplate), gợi ý cú pháp Next.js 16, React 19, TypeScript, Three.js và TensorFlow.js; hỗ trợ tìm và sửa lỗi cú pháp (debug), tối ưu hóa hiệu năng render đồ họa WebGL đạt chuẩn 60 FPS.
- **Quyền làm chủ của học sinh**: Học sinh trực tiếp thiết kế sơ đồ luồng dữ liệu, kịch bản sư phạm cho từng môn học, cấu trúc các bài toán hình học 3D, kiểm tra tính đúng đắn khoa học của các công thức và trực tiếp kiểm thử nghiệm thu từng chức năng.

#### 2. Mô hình Ngôn ngữ Lớn Đa phương thức Google Gemini API (Gemini 2.5 Flash, 1.5 Flash, 1.5 Pro)
Mô hình Gemini được tích hợp sâu vào 4 phân hệ cốt lõi:
- **Trợ lý Ảo Toàn năng NOVA AI**: Gia sư ảo đồng hành 24/7 trên toàn hệ thống, giải đáp lý thuyết và hướng dẫn phương pháp tư duy 4 môn Toán - Lý - Hóa - Sinh theo Chương trình GDPT 2018 mới.
- **Trợ lý AI Phân tích Hình học 3D trong Lab Toán (`/api/lab-toan/chat-model`)**: Tự động phân tích đề bài hình học không gian, giải thích chi tiết các bước giải, tính diện tích xung quanh, thể tích khối đa diện, góc và khoảng cách.
- **Gia sư STEM AI Toán 3D chuyên sâu (`/api/lab-toan/chat-tutor`)**: Gia sư đồng hành từng bước môn Toán định dạng chuẩn công thức KaTeX, có hiệu ứng gõ chữ từng từ mượt mà (word-by-word streaming effect ~16ms/từ) giúp học sinh dễ dàng tiếp thu.
- **Nhận dạng Đề thi qua Thị giác Máy tính AI Vision OCR (`/api/lab-toan/vision-ocr`)**: Học sinh chụp ảnh đề toán từ sách bài tập hoặc giấy nháp, AI tự động nhận dạng văn bản, trích xuất thực thể hình học và kích hoạt dựng mô hình 3D tương tác.
- **Kiến trúc Hồ chứa Khóa Dự phòng Đa Tầng (Gemini Resilient Pool & Multi-Key Rotation)**: Nhóm em tự thiết kế cơ chế xoay vòng thông minh giữa nhiều API key miễn phí (Tier Free) trong `geminiResilientPool.js` và `geminiCaller.js`. Khi một khóa chạm ngưỡng giới hạn tần suất (HTTP 429 Rate Limit) hoặc gặp lỗi mạng, hệ thống tự động chuyển tiếp liền mạch sang khóa dự phòng và tự động fallback linh hoạt giữa các model (`gemini-2.5-flash` $\rightarrow$ `gemini-1.5-flash` $\rightarrow$ `gemini-1.5-pro`), đảm bảo hệ thống duy trì độ sẵn sàng 99.9% cho hàng trăm học sinh sử dụng đồng thời với chi phí 0 VNĐ.

#### 3. Công cụ Tạo Âm thanh Thí nghiệm Meta AudioCraft
- **Mục đích ứng dụng**: Tạo các hiệu ứng âm thanh môi trường trực quan và chân thực cho các phòng thí nghiệm ảo (tiếng bọt khí sủi khi xảy ra phản ứng hóa học, tiếng va chạm con lắc, tiếng laser quang học) cùng các đoạn nhạc nền nhẹ nhàng giúp học sinh tăng cường sự tập trung khi tự học.

#### 4. Thư viện Mô hình Ngôn ngữ Cục bộ Hugging Face Transformers.js
- **Định hướng nghiên cứu tương lai**: Nhóm tích hợp thư viện này để thử nghiệm đóng gói các mô hình ngôn ngữ thu nhỏ (Small Language Models - SLM) chạy trực tiếp trên card đồ họa của máy tính học sinh thông qua chuẩn WebGPU, hướng tới khả năng phục vụ học sinh tại các điểm trường vùng sâu vùng xa hoàn toàn ngoại tuyến (100% Offline AI).

---

### III. KÊ KHAI 6 MÔ HÌNH HỌC MÁY TỰ HUẤN LUYỆN CỤC BỘ (SELF-TRAINED CLIENT-SIDE AI)

Nhóm đã tự nghiên cứu, lập trình và huấn luyện **6 mô hình Trí tuệ Nhân tạo chuyên biệt** chạy 100% trên trình duyệt phía người dùng (Client-Side AI Execution) bằng JavaScript thuần và thư viện **TensorFlow.js**, không tốn bất kỳ chi phí thuê máy chủ GPU nào.

> **Lệnh kiểm chứng số liệu khoa học**: Toàn bộ số liệu kiểm thử dưới đây được xuất tự động và có thể tái lập 100% thông qua lệnh:  
> `node src/ai-training/scripts/run-all-audits.js` (kết quả ghi tự động tại [TRAINING_LOG.md](file:///e:/project/cuoc_thi_AI/TRAINING_LOG.md)).

| STT | Mô hình AI Tự Huấn Luyện | Kiến trúc Thuật toán | Quy mô Tập Dữ liệu | Chỉ số Thực nghiệm | Khoảng Tin cậy 95% (Wilson CI) |
|:---:|:---|:---|:---|:---|:---|
| **1** | **ChemLab Risk Classifier**<br>(Dự báo nguy cơ Hóa học) | Mạng Nơ-ron Đa lớp Softmax + Circuit Breaker | 144 mẫu Train<br>36 mẫu Test<br>20 mẫu Ca biên | **100.00%** Test Acc<br>**95.00%** Edge Acc<br>**0 False Negatives** | Test: [90.4%, 100.0%]<br>Edge: [76.4%, 99.1%]<br>Tăng đơn điệu chuẩn |
| **2** | **Physics Diagnostic kNN**<br>(Chẩn đoán lỗi Vật lý) | k-Nearest Neighbors ($k=5$)<br>+ Z-Score StandardScaler | 96 mẫu Train<br>24 mẫu Test<br>15 mẫu Đa lỗi | **100.00%** Test Acc<br>**86.67%** Combo Acc | Test: [86.2%, 100.0%]<br>Edge: [62.1%, 96.3%] |
| **3** | **Nova Intent Classifier**<br>(Phân luồng ý định 7 lớp) | Multinomial Naive Bayes<br>+ Text Normalizer (Teencode) | 392 mẫu Train<br>40 mẫu Unseen Test<br>(0% trùng lặp) | **100.00%** Normalized<br>(97.50% Raw) | Test: [91.2%, 100.0%]<br>Threshold = 0.65 |
| **4** | **Math Adaptive IRT Engine**<br>(Định vị năng lực Toán) | 1PL Rasch Item Response Theory ($\theta$ vs $b$) | 10 Benchmark Items<br>(Hệ thống câu hỏi) | Phát hiện vùng ZPD<br>$P(\text{correct}) \in [60\%, 75\%]$ | [16.8%, 68.7%]<br>Đề xuất độ khó tối ưu |
| **5** | **Genetics Bayesian Reasoner**<br>(Suy luận xác suất Di truyền) | Bayesian Belief Network<br>+ Bảng CPT di truyền | 10 Benchmark Cases<br>(1-4 cặp alen Menđen) | **100.00%** Pass<br>(10/10 test cases) | [72.2%, 100.0%]<br>Chuẩn xác 100% Menđen |
| **6** | **In-Browser TF-IDF RAG**<br>(Trích xuất tri thức 4 môn) | TF-IDF Ma trận thưa<br>+ Cosine Similarity | 303 Chunks tri thức<br>9.061 N-Gram Tokens | **96.88%** Top-1 Acc<br>**100.00%** Top-3 Hit | [84.3%, 99.4%]<br>Mean Cosine = 44.14% |

#### Mô hình Bổ sung: Bảo mật Sinh trắc học Nhận diện Khuôn mặt Face-API (Biometric 2FA)
- **Kiến trúc**: Mạng nơ-ron tích chập **ResNet-34** kết hợp **SSD MobileNetV1** chạy trực tiếp qua webcam trình duyệt.
- **Bảo mật quyền riêng tư**: Trích xuất 128 vector đặc trưng số (face embeddings) so khớp trực tiếp trên máy client. Tuyệt đối không lưu trữ hay gửi hình ảnh chân dung học sinh lên mạng Internet.

---

### IV. NGUỒN DỮ LIỆU NHÓM EM TỰ THU THẬP, XÂY DỰNG VÀ CHUẨN HÓA

1. **Cơ sở Tri thức Khoa học 4 môn THPT (303 đoạn tri thức, 9.061 tokens)**: Tự tay biên soạn và số hóa từ sách giáo khoa lớp 10, 11, 12 Chương trình GDPT 2018 (Kết nối tri thức, Chân trời sáng tạo, Cánh diều) và tài liệu chuẩn của Bộ GD&ĐT cho 4 môn Toán, Lý, Hóa, Sinh.
2. **Ngân hàng Đề thi & Câu hỏi Trắc nghiệm Chuẩn hóa (Hơn 500 câu hỏi)**: Sưu tầm và biên soạn từ các đề thi tốt nghiệp THPT chính thức, đề thi khảo sát và đề thi học sinh giỏi. Giải chi tiết từng câu, gán nhãn 4 mức độ nhận thức và độ khó IRT. Cấu trúc hóa tĩnh `.json` nhúng sẵn (In-Memory Bundling) tra cứu tức thì chi phí 0 đồng.
3. **Cơ sở Dữ liệu 144 Phản ứng Hóa học Thực nghiệm**: Tổng hợp từ sổ tay tra cứu hóa học và bảng tính tan gồm 144 cặp phản ứng vô cơ và hữu cơ. Ghi chú hiện tượng đổi màu chỉ thị pH, kết tủa, khí thoát ra, phương trình ion thu gọn và thông số nhiệt động lực học.
4. **Bộ Dữ liệu Hội thoại Học sinh (392 mẫu câu giao tiếp)**: Thu thập trực tiếp từ các bạn học sinh THPT Quỳnh Lưu 4 khi hỏi bài (ngôn ngữ tự nhiên, teencode) để huấn luyện bộ phân loại ý định Naive Bayes.
5. **Bộ Dữ liệu Quần thể 20 AI Bots Luyện tập Đấu trường PvP**: Thiết lập 20 hồ sơ Bot với điểm ELO từ 50 đến 130 điểm, cấu hình thời gian phản hồi và tỷ lệ chính xác mô phỏng thực tế.
6. **Bộ Dữ liệu Tham số Hình học Không gian Đa diện 3D**: Cấu trúc hóa tham số toán học cho hơn 15 dạng hình không gian (chóp tam giác đều, chóp tứ giác, lăng trụ đứng, lăng trụ xiên, hộp chữ nhật, lập phương, bát diện đều, chóp cụt, tứ diện vuông...) phục vụ thuật toán sinh mesh 3D tự động từ đề bài.

---

### V. CÁC DỊCH VỤ ĐÁM MÂY (CLOUD SERVICES) VÀ TIÊU CHUẨN WEB API

#### A. Các Dịch vụ Đám mây (Cloud Services)
1. **Dịch vụ Đám mây Google Firebase (Firestore & Authentication)**: Gói Spark miễn phí (0 VNĐ) lưu trữ tài khoản, đồng bộ thời gian thực trận đấu PvP 1v1 và bảng xếp hạng ELO toàn trường.
2. **Cổng Rìa Mạng Không Máy Chủ Cloudflare Workers (Serverless Edge Gateway)**: Reverse Proxy trung gian ở rìa mạng bảo vệ API Key Gemini, chống tấn công DDoS và giới hạn tần suất (Rate Limiting).
3. **Dịch vụ Nền tảng Triển khai Vercel Cloud (Edge Production)**: Biên dịch và phân phối mã nguồn Next.js 16 trên CDN toàn cầu, kết nối tên miền chính thức `https://ai.stem-hub.top` với chứng chỉ SSL/TLS.
4. **Dịch vụ Gửi Mã Xác thực Email OTP (Nodemailer Service)**: Tự động gửi mã OTP 6 chữ số qua hòm thư điện tử bảo vệ tài khoản học sinh khi đăng ký.

#### B. Các Tiêu chuẩn Web API của Trình duyệt (Browser Web APIs)
1. **Tiêu chuẩn Xử lý Đa luồng Web Worker (Off-Main-Thread Processing API)**: Tách các tác vụ nặng (ma trận AI, giải toán hình học 3D, RAG) sang luồng ngầm độc lập (Background Worker Thread), giải phóng luồng chính duy trì **60 FPS mượt mà**.
2. **Tiêu chuẩn Âm thanh và Tiếng nói Web Speech API & Web Audio API**: Nhận dạng giọng nói tiếng Việt và tổng hợp giọng đọc AI hai chiều với Trợ lý Nova; kết hợp hiệu ứng dìm tiếng nhạc nền (Audio Ducking).
3. **Tiêu chuẩn Cơ sở dữ liệu Cục bộ IndexedDB (Client-Side Storage API)**: Lưu trữ bền vững trọng số mô hình AI, bộ nhớ đệm bài học và dữ liệu thí nghiệm ngay tại máy người dùng.
4. **Tiêu chuẩn Đồ họa Không gian WebGL & Canvas API**: Kết xuất mô hình 3D tương tác với đầy đủ ánh sáng, bóng đổ, vật liệu ống nghiệm và tia laser.

---

### VI. BẢNG KÊ KHAI CHI TIẾT CÁC THƯ VIỆN MÃ NGUỒN MỞ

| STT | Tên Thư viện Mã nguồn mở | Phiên bản | Giấy phép Bản quyền | Mục đích Sử dụng Cụ thể trong Dự án STEM HUB |
|:---:|:---|:---:|:---:|:---|
| 1 | **Next.js** | 16.2.6 | MIT | Khung ứng dụng web chính (App Router), tối ưu hóa kiến trúc Serverless, render SSR/SSG. |
| 2 | **React & React-DOM** | 19.2.4 | MIT | Thư viện nền tảng xây dựng toàn bộ giao diện người dùng tương tác và component hóa. |
| 3 | **@tensorflow/tfjs** | 4.22.0 | Apache 2.0 | Thư viện học máy cốt lõi thực thi 6 mô hình AI tự huấn luyện trực tiếp trên trình duyệt. |
| 4 | **@google/generative-ai** | 0.24.1 | Apache 2.0 | SDK chính thức kết nối và quản lý luồng dữ liệu tới Google Gemini API. |
| 5 | **Three.js** | 0.184.0 | MIT | Động cơ đồ họa 3D WebGL dựng mô hình hình học không gian, phòng thí nghiệm Vật lý & Sinh học. |
| 6 | **@react-three/fiber** | 9.6.1 | MIT | Cầu nối Three.js vào hệ sinh thái React, quản lý vòng đời render 3D dạng khai báo trực quan. |
| 7 | **@react-three/drei** | 10.7.7 | MIT | Tập hợp tiện ích 3D chuyên sâu: OrbitControls, Text3D, ánh sáng môi trường, camera góc nhìn. |
| 8 | **KaTeX** | 0.18.7 | MIT | Kết xuất các công thức Toán học, phương trình Hóa học và ký hiệu Vật lý chuẩn LaTeX SGK. |
| 9 | **Mathjs** | 15.2.0 | Apache 2.0 | Thư viện tính toán đại số máy tính, ma trận không gian và hình học giải tích. |
| 10 | **Tailwind CSS** | 4.0.0 | MIT | Hệ thống thiết kế giao diện hiện đại phong cách phòng lab khoa học, responsive đa thiết bị. |
| 11 | **Framer Motion** | 12.39.0 | MIT | Tạo các hiệu ứng vi chuyển động (micro-animations), chuyển trang mượt mà, popup cửa sổ. |
| 12 | **Lucide React** | 1.16.0 | ISC | Bộ biểu tượng đồ họa khoa học, giáo dục sắc nét cho thanh điều hướng và các nút thao tác. |
| 13 | **Firebase & Firebase-Admin** | 12.13.0 / 14.1.0 | Apache 2.0 | SDK kết nối Firestore thời gian thực và quản trị phân quyền người dùng phía server. |
| 14 | **Zustand** | 5.0.13 | MIT | Quản lý trạng thái ứng dụng toàn cục (state management) nhẹ và siêu tốc cho Đấu trường 1v1. |
| 15 | **Leva** | 0.10.1 | MIT | Bảng điều khiển GUI tùy biến tham số hình học và thông số thí nghiệm 3D theo thời gian thực. |
| 16 | **Canvas-confetti** | 1.9.4 | MIT | Hiệu ứng pháo hoa chúc mừng khi học sinh hoàn thành xuất sắc thí nghiệm hoặc thắng trận PvP. |
| 17 | **SheetJS (XLSX)** | 0.18.5 | Apache 2.0 | Xử lý nhập/xuất bảng dữ liệu Excel phục vụ quản trị ngân hàng câu hỏi đề thi trắc nghiệm. |
| 18 | **Html2canvas-pro** | 2.0.4 | MIT | Chụp ảnh màn hình kết quả học tập để xuất Giấy chứng nhận hoàn thành khóa học cho học sinh. |
| 19 | **Nodemailer** | 9.0.5 | MIT / EUPL | Module gửi email tự động chứa mã xác thực OTP phục vụ quy trình đăng ký bảo mật. |
| 20 | **Next-themes** | 0.4.6 | MIT | Hỗ trợ chế độ giao diện sáng/tối (Dark/Light Mode) tối ưu hóa trải nghiệm thị giác học tập. |
| 21 | **Lodash** | 4.18.1 | MIT | Tiện ích xử lý cấu trúc dữ liệu mảng, chuỗi, khử nhiễu (debounce) khi tìm kiếm đề bài. |
| 22 | **Axios** | 1.15.0 | MIT | Thư viện HTTP client truyền tải dữ liệu bất đồng bộ với cơ chế timeout và xử lý lỗi chặt chẽ. |
| 23 | **@tanstack/react-query** | 5.99.0 | MIT | Quản lý đồng bộ bộ nhớ đệm (cache), tái nạp dữ liệu nền và tối ưu hóa tài nguyên mạng. |
| 24 | **@huggingface/transformers** | 4.2.0 | Apache 2.0 | Thư viện chuẩn bị cho các mô hình AI ngôn ngữ nhỏ chạy cục bộ WebGPU ngoại tuyến. |

---

### VII. LỜI CAM KẾT DANH DỰ CỦA NHÓM HỌC SINH TÁC GIẢ

Nhóm học sinh chúng em xin cam đoan trước Ban Bí thư Trung ương Đoàn TNCS Hồ Chí Minh và Ban Giám khảo Cuộc thi:
1. Toàn bộ các nội dung kê khai về công cụ trí tuệ nhân tạo, nguồn dữ liệu, giao diện API và các thư viện mã nguồn mở trong bản này là hoàn toàn chính xác, đầy đủ và trung thực 100%.
2. Toàn bộ ý tưởng khoa học, cấu trúc bài giảng số, ngân hàng câu hỏi, dữ liệu phản ứng hóa học và phần lớn mã nguồn tương tác 3D đều do nhóm chúng em trực tiếp nghiên cứu, lập trình dưới sự chỉ dẫn của thầy giáo hướng dẫn. Chúng em không sao chép nguyên mẫu, không vi phạm quyền sở hữu trí tuệ của bất kỳ cá nhân hay tổ chức nào.
3. Chúng em tuân thủ đầy đủ và nghiêm túc các điều khoản giấy phép mã nguồn mở (MIT, Apache 2.0, ISC, BSD) và cam kết sản phẩm hoàn toàn phục vụ mục đích phi thương mại, hỗ trợ cộng đồng học sinh cả nước nâng cao năng lực chuyển đổi số và tiếp cận công nghệ STEM đỉnh cao.

*Nghệ An, ngày 13 tháng 09 năm 2026*

| THẦY GIÁO HƯỚNG DẪN | ĐẠI DIỆN NHÓM HỌC SINH TÁC GIẢ |
|:---:|:---:|
| *(Ký và ghi rõ họ tên)*<br><br><br><br><br>**Nguyễn Văn Phúc**<br>Giáo viên Trường THPT Quỳnh Lưu 4, Nghệ An | *(Ký và ghi rõ họ tên)*<br><br><br><br><br>**Hồ Hoàng Anh**<br>Học sinh lớp 12A (Trưởng nhóm)<br>Các thành viên: Nguyễn Trung Hiếu, Đậu Việt Hưng |
