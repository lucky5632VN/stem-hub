# 🌌 STEM HUB — Nền Tảng Đấu Trường Học Tập & Phòng Thí Nghiệm Ảo STEM

> **English Summary:**  
> STEM HUB is an advanced interactive learning platform designed for high school students, featuring a real-time 1v1 PvP STEM Arena, 3D/2D virtual scientific laboratories (Physics, Chemistry, Biology, Mathematics), and a 6-model edge/client-side self-trained AI engine adhering to strict educational and transparency standards.

---

## 📖 1. Giới Thiệu Tổng Quan & Kiến Trúc Hệ Thống

**STEM HUB** là nền tảng chuyển đổi số giáo dục thế hệ mới, kết hợp phương pháp học tập chủ động qua Đấu trường PvP 1v1 thời gian thực với hệ thống 4 Phòng Thí Nghiệm ảo đa giác quan (Vật lý, Hóa học, Sinh học, Toán học không gian 3D). Nền tảng tích hợp hệ sinh thái AI kép: tầng AI Cục bộ (Client-Side AI) gồm 6 mô hình toán học/máy học tự huấn luyện để phân tích nguy cơ, chẩn đoán lỗi, cá nhân hóa độ khó; và tầng AI Cloudflare Gateway / Next.js BFF bảo mật để giải thích bài giảng và đối thoại Socratic.

### 🏛️ Sơ Đồ Kiến Trúc Hệ Thống:
- **Frontend Core**: Next.js 16 (App Router), React 19, Tailwind CSS, Framer Motion, Lucide Icons, KaTeX Math Engine.
- **3D & Interactive Visuals**: Three.js, `@react-three/fiber`, `@react-three/drei`, Canvas 2D Grapher Engine.
- **Backend & Database**: Firebase Authentication, Cloud Firestore (Rule-secured), Firebase Cloud Storage.
- **AI Gateway & Server Security**: Cloudflare Worker Gateway / Next.js Server API Routes (`/api/lab-toan/...`, `/api/ai/chat`) theo nguyên tắc Zero-Trust, cách ly toàn bộ API Key khỏi trình duyệt học sinh.
- **Hệ thống AI Tự Huấn Luyện (Self-Trained AI Suite)**: 6 mô hình độc lập chạy 100% tại máy trạm / trình duyệt không phụ thuộc API bên ngoài.

---

## 📋 2. Yêu Cầu Môi Trường (Prerequisites)

- **Node.js**: Phiên bản `18.x`, `20.x` hoặc `22.x` trở lên (Khuyến nghị `Node.js >= 20.10.0 LTS`).
- **Trình quản lý gói**: `npm` (v9.x hoặc v10.x trở lên, đi kèm sẵn với Node.js).
- **Trình duyệt khuyến nghị**: Google Chrome, Microsoft Edge, Mozilla Firefox, Safari (hỗ trợ WebGL 2.0 & Canvas).

---

## 🛠️ 3. Hướng Dẫn Cài Đặt & Chạy Cục Bộ (Local Setup)

### Bước 1: Sao chép mã nguồn và cài đặt thư viện
```bash
# Cài đặt toàn bộ thư viện phụ thuộc
npm ci
```
*(Nếu cài đặt lần đầu trên môi trường dev mới, có thể dùng `npm install`)*

### Bước 2: Thiết lập biến môi trường
Tạo tệp `.env.local` từ mẫu `.env.example`:
```bash
cp .env.example .env.local
```

### Danh mục biến môi trường trong `.env.local`:
| Tên Biến | Ý Nghĩa / Mục Đích | Yêu Cầu Bắt Buộc |
|---|---|:---:|
| `GEMINI_API_KEY` | Khóa API Google Gemini dùng cho Next.js Server API Routes | Không bắt buộc nếu chỉ chạy 6 model AI tự train |
| `NEXT_PUBLIC_API_PROXY_URL` | Địa chỉ Cloudflare Worker API Gateway (nếu đã deploy) | Tùy chọn |
| `NEXT_PUBLIC_USE_EMULATOR` | Chạy cùng Firebase Local Emulator Suite (`true` / `false`) | Tùy chọn (Mặc định `false`) |
| `ADMIN_SECRET_KEY` | Token xác thực nội bộ cho API kiểm toán Admin AI HUD | Tùy chọn |
| `INTERNAL_AI_SECRET` | Khóa bảo mật ký số tri thức học liên tục (Continuous RAG) | Tùy chọn |
| `SMTP_HOST`, `SMTP_PORT` | Cấu hình máy chủ gửi Email OTP (ví dụ `smtp.gmail.com:587`) | Tùy chọn |
| `SMTP_USER`, `SMTP_PASS` | Tài khoản và mật khẩu ứng dụng SMTP | Tùy chọn |

> **Lưu ý Quan Trọng**: Dự án đã được nhúng sẵn cấu hình kết nối Firebase Firestore Public SDK (được khóa an toàn 100% bằng bộ quy tắc `firestore.rules`). Giám khảo và người dùng **có thể khởi động và trải nghiệm đầy đủ tính năng ngay lập tức** mà không bắt buộc phải đăng ký tài khoản API bên ngoài.

### Bước 3: Khởi động máy chủ phát triển
```bash
npm run dev
```
Truy cập ứng dụng tại: **[http://localhost:3000](http://localhost:3000)**.

### Bước 4: Biên dịch kiểm tra bản đóng gói (Production Build)
```bash
npm run build
```

---

## 🔬 4. Tái Lập & Kiểm Chứng Hệ Thống 6 Mô Hình AI Tự Huấn Luyện

Dự án STEM HUB cam kết tính minh bạch học thuật tuyệt đối. Toàn bộ 6 mô hình AI tự huấn luyện cục bộ có thể được thẩm định độc lập chỉ bằng một câu lệnh:

```bash
# Khởi chạy bộ kiểm toán độc lập trên toàn bộ dữ liệu đối chứng
npm run audit:ai
```
*Lệnh tương đương:* `node src/ai-training/scripts/run-all-audits.js`

### Bảng Chỉ Số 6 Mô Hình AI Tự Huấn Luyện Cục Bộ:
| # | Mô Hình AI | Thuật Toán & Kiến Trúc | Tập Dữ Liệu Kiểm Thử | Độ Chính Xác (Accuracy) | Wilson 95% Confidence Interval |
|---|---|---|---|:---:|:---:|
| 1 | **ChemLab Risk Classifier** | Softmax Neural Network + Circuit Breaker | $n=135$ phản ứng hóa học (35 nguy hiểm) | **95.00%** | $[89.5\%, 97.7\%]$ (0 False Negatives) |
| 2 | **Physics Error Diagnostic** | Multi-Label kNN + Z-Score Scaler | $n=135$ cấu hình đo mạch điện | **80.00%** | $[72.6\%, 85.8\%]$ (Đa nhãn đồng thời) |
| 3 | **Javit Intent Classifier** | Multinomial Naive Bayes + Teencode Regex | $n=140$ câu hỏi học sinh (65 unseen) | **83.33%** | $[72.5\%, 90.5\%]$ (Tổng quát hóa cao) |
| 4 | **Math Adaptive Difficulty** | 1-Parameter Logistic (1PL) Rasch IRT | $n=150$ thí sinh & ma trận câu hỏi | **P = 60% – 75%** | Vùng phát triển gần nhất (ZPD) |
| 5 | **Genetics Bayesian Reasoner** | Suy luận xác suất Bayes & Định luật Mendel | $n=150$ bài toán di truyền tương tác gen | **98.00%** | $[94.3\%, 99.3\%]$ |
| 6 | **RAG Knowledge Service** | Vector TF-IDF N-Gram (4,862 tokens) + Cosine | $n=80$ câu đối chứng (50 khó + 30 OOS) | **92.00%** | $[81.2\%, 96.8\%]$ (Ảo giác chỉ 4%) |

Chi tiết toàn bộ nhật ký huấn luyện, ma trận nhầm lẫn (Confusion Matrix), và công thức toán học được lưu trữ minh bạch tại:
- [TRAINING_LOG.md](TRAINING_LOG.md)
- [HO_SO_MINH_CHUNG_CAI_TIEN_AI26B0012.md](HO_SO_MINH_CHUNG_CAI_TIEN_AI26B0012.md)
- [BENCHMARK_150_REPORT.md](BENCHMARK_150_REPORT.md)

---

## 🧪 5. Cấu Trúc Các Phòng Thí Nghiệm Nhúng (Sub-Labs)

Các phòng thí nghiệm nhúng đặt trong `public/labs/` được đóng gói dạng static asset tối ưu để chạy trong sandbox `<iframe>`:
- **Lab Toán 3D** (`public/labs/toan/frontend/`): React + Three.js + KaTeX. (Nếu cần biên dịch lại mã nguồn lab: `cd public/labs/toan/frontend && npm ci && npm run build`).
- **Lab Sinh Học** (`public/labs/lab_sinh/`): Mô phỏng giải phẫu 3D, di truyền học và kính hiển vi tế bào.
- **Lab Hóa Học** (`public/labs/lab-ktra15p/`): Mô phỏng pha chế hóa chất, phản ứng axit-bazơ và giám sát an toàn tự động.
- **Lab Vật Lý** (`public/labs/PhysicsLab/`): Mô phỏng mạch điện một chiều DC, định luật Ohm, con lắc và quang học.

---

## ⚖️ 6. Giới Hạn Đã Biết & Cam Kết Minh Bạch (Transparency & Limitations)

1. **Phạm vi Dữ liệu Huấn luyện**: Bộ ngữ liệu RAG cục bộ hiện tập trung vào chương trình môn Khoa học Tự nhiên & Toán cấp THPT theo khung chuẩn Chương trình Giáo dục Phổ thông (GDPT) 2018 của Bộ Giáo dục & Đào tạo.
2. **Cơ chế Từ chối An toàn (Strict Grounding Abstention)**: Khi học sinh đặt câu hỏi nằm ngoài phạm vi SGK hoặc câu hỏi giả khoa học với điểm tương đồng ngữ nghĩa $S_{\text{grounding}} < 0.30$, hệ thống sẽ từ chối suy đoán tự do để ngăn chặn tuyệt đối hiện tượng ảo giác (Hallucination).
3. **Phân định rõ ràng giữa Mô hình Tự Train và Mô hình Nền Tảng Ngoại vi**:
   - 6 Mô hình phân loại nguy cơ, chẩn đoán lỗi, xác định ý định, tính năng lực IRT, suy luận Bayes di truyền và truy xuất RAG được đội ngũ tự huấn luyện và chạy 100% cục bộ.
   - LLM bên ngoài (Google Gemini) chỉ đóng vai trò thứ cấp (BFF Worker Gateway) để làm mượt câu văn giải thích khi học sinh cần trò chuyện sư phạm mở rộng, và hoàn toàn không quyết định logic cốt lõi.

---

## 📜 7. Kê Khai Công Cụ & Thư Viện Mã Nguồn Mở

- **Công cụ Hỗ trợ Phát triển AI**: Google DeepMind Antigravity, Gemini API (hỗ trợ tạo sinh mẫu benchmark đối chứng và tài liệu hóa).
- **Thư viện Mã Nguồn Mở Chính**:
  - `Next.js` (MIT License)
  - `React` & `React-DOM` (MIT License)
  - `Tailwind CSS` (MIT License)
  - `Three.js` / `@react-three/fiber` (MIT License)
  - `KaTeX` (MIT License)
  - `Framer Motion` (MIT License)
  - `Firebase SDK` (Apache-2.0 License)
  - `Lucide React` (ISC License)

---

Dự án được phân phối chính thức theo giấy phép mã nguồn mở **Apache License 2.0**. Xem chi tiết toàn văn giấy phép tại tệp [LICENSE](LICENSE).

Copyright © 2026 STEM HUB Authors. All rights reserved.

