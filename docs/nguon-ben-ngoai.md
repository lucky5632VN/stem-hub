# 🌐 BẢNG KÊ KHAI NGUỒN TÀI NGUYÊN BÊN NGOÀI & BẢN QUYỀN
> **Dự án**: STEM HUB — Nền tảng Đấu trường Học tập & Phòng Thí Nghiệm Ảo STEM  
> **Thời điểm cập nhật**: Tháng 11/2026 (Phiên bản nghiệm thu kỹ thuật)

---

## 1. Nguyên Tắc Quản Lý Tài Nguyên Bên Ngoài
1. **Tuân thủ bản quyền & Tối ưu dung lượng**: Toàn bộ các tệp âm thanh thương mại/nhạc nền MP3 có dung lượng lớn (>80MB) và chưa có giấy phép phát hành thương mại đã được **gỡ bỏ hoàn toàn khỏi thư mục `public/`**.
2. **Cơ chế âm thanh mặc định**:
   - Nhạc nền trong các phòng thí nghiệm ảo mặc định được thiết lập **TẮT (`_isMuted: true`, `_isPlaying: false`)**.
   - Khi người dùng bật âm thanh hoặc xảy ra phản ứng cảnh báo, hệ thống sử dụng **Web Audio API tổng hợp dao động âm (Synthesized Oscillator / Ambient Drone)** trực tiếp trên trình duyệt, đảm bảo **không phụ thuộc tệp MP3 ngoài** và **không phát sinh bất kỳ lỗi console nào** khi thiếu tệp.
3. **Thư viện mã nguồn mở**: Chỉ sử dụng các thư viện có giấy phép thương mại mở (MIT, Apache 2.0, BSD-3-Clause) được kiểm toán rõ ràng trong `package.json`.

---

## 2. Danh Mục Các Thư Viện & Công Nghệ Bên Ngoài Sử Dụng

| Tên Thư Viện / Thành Phần | Phiên Bản | Giấy Phép | Mục Đích Sử Dụng Trong Dự Án |
|---|---|:---:|---|
| **Next.js** | `16.2.6` | MIT | Khung phát triển ứng dụng web SSR / BFF Gateway |
| **React** & **React-DOM** | `19.2.4` | MIT | Thư viện xây dựng giao diện người dùng |
| **Three.js** | `^0.184.0` | MIT | Công cụ dựng hình 3D cho các phòng thí nghiệm ảo |
| **@react-three/fiber**, **@react-three/drei** | `^9.x / ^10.x` | MIT | Cầu nối React cho Three.js |
| **KaTeX** | `^0.18.4` | MIT | Trình hiển thị công thức toán học và hóa học chuẩn LaTeX |
| **Lucide React** | `^1.16.0` | ISC | Bộ biểu tượng giao diện vector mã nguồn mở |
| **Framer Motion** | `^12.39.0` | MIT | Thư viện chuyển động và hiệu ứng giao diện |
| **Firebase Web SDK & Admin SDK** | `^12.x / ^14.x` | Apache-2.0 | Xác thực (Auth), Cơ sở dữ liệu phân tán (Cloud Firestore) |
| **@tensorflow/tfjs** | `^4.22.0` | Apache-2.0 | Tầng máy học chạy cục bộ trên trình duyệt |
| **Tailwind CSS** | `^4.x` | MIT | Tiện ích thiết kế giao diện đáp ứng (Responsive UI) |

---

## 3. Danh Mục Kho Dữ Liệu & Tri Thức Tham Khảo

| Nhóm Dữ Liệu | Nguồn Gốc | Mục Đích Sử Dụng | Hiện Trạng Kiểm Soát |
|---|---|---|---|
| **Kho tri thức 303 chunks (101 chuyên đề)** | Sách giáo khoa & Sách bài tập GDPT 2018 (Toán, Lý, Hóa, Sinh) | Cung cấp ngữ cảnh tham chiếu cho bộ máy RAG | Được băm nhỏ thành các đoạn kiến thức súc tích, phục vụ trích dẫn học tập nghiên cứu |
| **Dữ liệu phân loại thí nghiệm ChemLab** | Mô phỏng số hóa từ định luật hóa học kết hợp công thức đa biến | Huấn luyện mạng Softmax đo thanh trượt rủi ro | Dữ liệu nội bộ được sinh toán học, độc lập với dữ liệu bên thứ ba |
| **Dữ liệu chẩn đoán sai số Quang học** | Định luật khúc xạ Snell và quang hình thực nghiệm | Huấn luyện bộ phân loại k-NN | Dữ liệu tự sinh và kiểm thử đa nhãn độc lập |

