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

## 📌 Ghi Chú Quan Trọng Dành Cho Ban Giám Khảo

1. **Bảo mật và Tự Động Đồng Bộ**:
   - Toàn bộ thông tin Firebase Client đã được cấu hình dạng bảo mật Client-side.
   - Cơ sở dữ liệu và Cơ chế xác thực chạy trực tiếp trên Cloud Firestore / Firebase Auth.
2. **Không Cần Triển Khai Cloud Functions**:
   - Dự án được tích hợp cơ chế tự động chuyển đổi thông minh (**Client-Side Callable Engine** tại `src/lib/clientFunctions.js`).
   - Khi chạy ở môi trường ngoài, hệ thống sẽ tự động điều phối toàn bộ nghiệp vụ (tính toán ELO, kết hợp trận đấu PvP, vòng quay Gacha, điểm danh 30 ngày) chạy trực tiếp trên trình duyệt Client mà không phụ thuộc vào Firebase Cloud Functions.
3. **Danh Sách Tài Khoản Khảo Sát**:
   - Vui lòng tham khảo file đính kèm `Danh_sach_20_tai_khoan_test.docx` để có danh sách các tài khoản học sinh và giáo viên đã được tạo sẵn để trải nghiệm các tính năng kết bạn, đấu trường PvP và quản lý lớp học.
"# vn-stem-hub" 
