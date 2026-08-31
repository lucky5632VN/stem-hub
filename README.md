# Hệ Thống Đấu Trường & Phòng Thí Nghiệm Học Tập STEM (STEM Arena)

Hệ thống Đấu Trường STEM là nền tảng học tập tương tác thế hệ mới dành cho học sinh. Dự án kết hợp mô hình đấu trường PvP 1v1 thời gian thực kịch tính với các phòng thí nghiệm mô phỏng trực quan (Vật lý, Hóa học, Toán học, Sinh học), giúp kích thích tư duy khoa học và tối ưu hóa hiệu quả giáo dục số.

---

## 📋 Yêu Cầu Hệ Thống

- **Môi trường**: Node.js v18.x hoặc v20.x trở lên.
- **Trình quản lý gói**: `npm` (đi kèm sẵn khi cài đặt Node.js).
- **Trình duyệt khuyến nghị**: Google Chrome, Microsoft Edge, Safari (chạy tốt trên cả thiết bị di động và máy tính).

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Dự Án

### Bước 1: Giải nén mã nguồn
Giải nén tệp zip mã nguồn vào một thư mục làm việc trên máy tính của bạn.

### Bước 2: Cài đặt thư viện phụ thuộc
Mở Terminal / Command Prompt tại thư mục dự án và chạy lệnh sau để tải các package cần thiết:
```bash
npm install
```

### Bước 3: Cấu hình biến môi trường (Tùy chọn)
Dự án được cấu hình sẵn thông tin kết nối tới hệ thống Cơ sở dữ liệu đám mây **Firebase (Auth & Firestore)** chính thức (nằm trong gói miễn phí). Giám khảo **không cần cấu hình thêm bất kỳ khóa bảo mật nào** để chạy thử.

Nếu muốn chuyển đổi chế độ giả lập (Emulator), có thể tạo file `.env.local` tại thư mục gốc với nội dung:
```env
NEXT_PUBLIC_USE_EMULATOR=false
```
*Lưu ý: Đặt thành `true` nếu muốn chạy dự án kèm theo Firebase Local Emulator.*

### Bước 4: Khởi động chế độ phát triển (Development)
Chạy lệnh sau để khởi động dự án ở Localhost:
```bash
npm run dev
```
Sau đó, truy cập ứng dụng thông qua trình duyệt tại địa chỉ: [http://localhost:3000](http://localhost:3000).

### Bước 5: Biên dịch phiên bản Production (Tùy chọn)
Để tối ưu hóa hiệu năng và kiểm tra độ ổn định của ứng dụng, chạy lệnh build chính thức:
```bash
npm run build
```

---

---

## 🤖 Hệ Thống 6 Mô Hình AI Tự Huấn Luyện (Self-Trained AI Registry) & Minh Bạch AI

Dự án STEM HUB tích hợp **6 Mô hình AI Tự Huấn Luyện 100% Cục bộ (Client-Side)** tuân thủ khắt khe các tiêu chuẩn minh bạch của Cuộc thi AI Cấp Quốc gia:
1. **ChemLab Risk Classifier**: Dense Softmax NN (1000 Epochs GD) + Circuit Breaker (Accuracy 95.0%, 0 False Negatives).
2. **Physics Multi-Label Diagnostic kNN**: kNN Z-Score StandardScaler chẩn đoán 3 loại lỗi thao tác 3D (80% Multi-error Detection).
3. **Javit Text Intent Classifier**: Multinomial Naive Bayes + Text Normalizer teencode (Accuracy 83.33% trên tập unseen).
4. **Math Adaptive Difficulty IRT Engine**: Mô hình 1PL Rasch IRT chọn câu hỏi vừa tầm năng lực ELO học sinh (P = 60%-75%).
5. **Multi-Gene Genetics Bayesian Reasoner**: Suy luận xác suất di truyền đa gen theo quy luật Mendel (100% verification).
6. **Multilingual TF-IDF Vector RAG Service**: Bộ trích xuất Ma trận TF-IDF (4,862 N-Gram tokens) & Cosine Similarity tìm kiếm tri thức bài giảng STEM.

*Ghi chú: Giám khảo có thể bấm nút **"Minh bạch AI"** trên thanh Header ứng dụng hoặc mở file `TRAINING_LOG.md` & `STEM_HUB_WEB_ARCHITECTURE_AI_DOCUMENTATION.md` để xem chi tiết nhật ký huấn luyện và mã nguồn.*

