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
- **Hệ thống AI Tự Huấn Luyện (Self-Trained AI Suite)**: 6 mô hình độc lập chạy cục bộ tại máy trạm / trình duyệt không phụ thuộc API bên ngoài cho các tác vụ suy luận và giám sát an toàn.

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
| `SMTP_HOST`, `SMTP_PORT` | Cấu hình máy chủ gửi Email OTP (ví dụ `smtp.gmail.com:587`) | Tùy chọn |
| `SMTP_USER`, `SMTP_PASS` | Tài khoản và mật khẩu ứng dụng SMTP | Tùy chọn |

> **Lưu ý Quan Trọng**: Dự án đã được nhúng sẵn cấu hình kết nối Firebase Firestore Public SDK (được kiểm soát truy cập bằng bộ quy tắc `firestore.rules`). Giám khảo và người dùng **có thể khởi động và trải nghiệm đầy đủ tính năng ngay lập tức** mà không bắt buộc phải đăng ký tài khoản API bên ngoài.

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

Dự án STEM HUB cam kết tính minh bạch học thuật. Toàn bộ 6 mô hình AI tự huấn luyện cục bộ có thể được thẩm định độc lập chỉ bằng một câu lệnh:

```bash
# Khởi chạy bộ kiểm toán độc lập trên toàn bộ dữ liệu đối chứng
npm run audit:ai
```
*Lệnh tương đương:* `node src/ai-training/scripts/run-all-audits.js`

### Bảng Chỉ Số Bộ 6 Mô Hình Cục Bộ (Đã Kiểm Toán Thực Tế):
| # | Mô Hình AI | Phân Loại & Thuật Toán | Tập Dữ Liệu Kiểm Thử | Độ Chính Xác (Accuracy) | Wilson 95% Confidence Interval |
|---|---|---|---|:---:|:---:|
| 1 | **ChemLab Risk Classifier** | *Thuật toán tất định* (Circuit Breaker) + Softmax Linear Risk Scoring (1 Dense layer, lr=0.2, GD 1000 epochs) | $n=50$ độc lập:<br>• Nhóm A (30 unseen mô phỏng): Công thức gốc 30/30, Luật 28/30, NN 28/30<br>• Nhóm B (20 ca biên viết tay): Công thức gốc 18/20, Luật 19/20, NN 12/20 | **Công thức tuyến tính gốc: 48/50 (96.00%)**<br>**Luật phân ngưỡng: 47/50 (94.00%)**<br>**Softmax NN: 40/50 (80.00%)**<br>Majority: **35/50 (70.00%)**<br>McNemar p=0.0654 (chưa đủ bằng chứng khác biệt ở $\alpha=0.05$) | $[86.5\%, 98.9\%]$ (Công thức)<br>$[83.8\%, 97.9\%]$ (Luật)<br>$[67.0\%, 88.8\%]$ (NN) |
| 2 | **Physics Error Diagnostic** | *Mô hình học từ dữ liệu* (kNN, $k=5$) | $n=45$ độc lập:<br>• Nhóm A (30 unseen mô phỏng): Luật 30/30, k-NN 30/30<br>• Nhóm B (15 ca biên viết tay - phân tích định tính đa nhãn): Luật 5/15, k-NN 5/15, Majority 5/15 | **Cả bộ: 35/45 (77.78%)** (Luật)<br>**35/45 (77.78%)** (k-NN)<br>Majority: **15/45 (33.33%)**<br>McNemar p=1.0000 | $[63.7\%, 87.5\%]$ (Luật)<br>$[63.7\%, 87.5\%]$ (k-NN) |
| 3 | **Javit Intent Classifier** | *Mô hình học từ dữ liệu* (Naive Bayes) | $n=65$ teencode/nhiễu (chưa độc lập hoàn toàn với train) | **59/65 (90.77%)** (Naive Bayes)<br>**45/65 (69.23%)** (Luật tử tế đã tinh chỉnh sau khi xem test)<br>McNemar $p=0.0043 < 0.01$ | $[81.3\%, 95.7\%]$ (NB)<br>$[57.2\%, 79.1\%]$ (Luật) |
| 4 | **Math Adaptive Difficulty** | *Thuật toán tất định* (1PL Rasch Logit) | $n=10$ ca kiểm thử kỹ thuật | **4/10** ca trúng ZPD $[0.60, 0.75]$ | $[16.8\%, 68.7\%]$ |
| 5 | **Genetics Reasoner** | *Thuật toán tất định* (Tổ hợp xác suất Punnett) | $n=10$ unit test lai độc lập | **10/10 passed** | $[72.2\%, 100.0\%]$ |
| 6 | **RAG Knowledge Service** | *Thuật toán tất định & Thống kê ngữ liệu* (TF-IDF + Cosine) | $n=32$ queries tiêu đề (khớp môn)<br>$n=60$ chunk benchmark (+20 OOD)<br>*(Ablation $n=80$ là mô phỏng heuristic)* | Khớp môn Top-1: **96.88%** (31/32)<br>Recall@1: **26.67%** (16/60)<br>Recall@3: **36.67%** (22/60)<br>Recall@5: **43.33%** (26/60)<br>MRR: **0.3225** | Khớp môn: $[84.3\%, 99.4\%]$<br>Recall@1: $[17.1\%, 39.0\%]$<br>Recall@3: $[25.6\%, 49.3\%]$<br>Recall@5: $[31.6\%, 55.9\%]$<br>Loại trừ OOD: $[83.9\%, 100.0\%]$ |

---

## 🧪 5. Cấu Trúc Các Phòng Thí Nghiệm Nhúng (Sub-Labs)

Các phòng thí nghiệm nhúng đặt trong `public/labs/` được đóng gói dạng static asset tối ưu để chạy trong sandbox `<iframe>`:
- **Lab Toán 3D** (`public/labs/toan/frontend/`): React + Three.js + KaTeX. (Nếu cần biên dịch lại mã nguồn lab: `cd public/labs/toan/frontend && npm ci && npm run build`).
- **Lab Sinh Học** (`public/labs/lab_sinh/`): Mô phỏng giải phẫu 3D, di truyền học và kính hiển vi tế bào.
- **Lab Hóa Học** (`public/labs/lab-ktra15p/`): Mô phỏng pha chế hóa chất, phản ứng axit-bazơ và giám sát an toàn tự động.
- **Lab Vật Lý** (`public/labs/PhysicsLab/`): Mô phỏng mạch điện một chiều DC, định luật Ohm, con lắc và quang học.

---

## ⚖️ 6. Giới Hạn Đã Biết & Cam Kết Minh Bạch (Transparency & Limitations)

1. **Phạm vi Dữ liệu Huấn luyện**: Bộ ngữ liệu RAG cục bộ hiện tập trung vào chương trình môn Khoa học Tự nhiên & Toán cấp THPT theo khung chuẩn Chương trình Giáo dục Phổ thông (GDPT) 2018 của Bộ Giáo dục & Đào tạo gồm 303 chunks do nhóm tự biên soạn.
2. **Cơ chế Từ chối An toàn (Strict Grounding Abstention)**: Khi học sinh đặt câu hỏi nằm ngoài phạm vi SGK hoặc câu hỏi giả khoa học với điểm tương đồng ngữ nghĩa $S_{\text{grounding}} < 0.30$, hệ thống sẽ từ chối suy đoán tự do để giảm thiểu ảo giác (giảm từ 28% xuống 4%).
3. **Phân định rõ ràng 3 loại thành phần trong hệ thống**:
   - **(a) Mô hình học từ dữ liệu**: Model 2 (Physics k-NN chẩn đoán lỗi), Model 3 (Javit Naive Bayes nhận diện ý định).
   - **(b) Thuật toán & công thức tất định**: Model 1 (Luật ngắt mạch hóa học + Softmax Danger Scoring), Model 4 (Công thức 1PL IRT Rasch tính ZPD), Model 5 (Tổ hợp xác suất di truyền Mendel), Model 6 (TF-IDF Vector Space Model & Thống kê corpus).
   - **(c) Gọi LLM ngoại vi**: Google Gemini API qua Next.js BFF Worker Gateway để làm mượt câu văn giải thích Socratic và nhận diện đề toán hình học (Vision OCR).
4. **Bộ đối chứng kỹ thuật tổng hợp 150 ca & Vòng học liên tục**:
   - Bộ 150 ca là tập dữ liệu tổng hợp (Synthetic Benchmark) do nhóm lập trình xây dựng để chạy unit test, chưa qua chấm của giáo viên thật.
   - Vòng học liên tục (`/api/learned-knowledge`) chỉ chấp nhận gửi tri thức từ Trợ lý AI chính trên giao diện chính thông qua Firebase Bearer ID Token của người dùng đã đăng nhập; toàn bộ các phòng lab nhúng (`public/labs/*/stem-lab-ai-bridge.js`) đã tắt tính năng gửi trực tiếp không xác thực. Mọi tri thức mới nạp mặc định ở trạng thái `pending_review` (chưa duyệt) và bắt buộc phải qua thẩm định của giáo viên/quản trị viên thật trên Teacher Review Portal trước khi được hòa nhập vào kho tri thức.
5. **Lưu ý phương pháp luận dữ liệu đánh giá**: Các câu hỏi kiểm thử trích từ đề thi hoặc nguồn công khai có khả năng đã nằm trong dữ liệu tiền huấn luyện của các mô hình nền tảng lớn (Foundation Models), do đó điểm số có thể mang tính lạc quan. Ngoài ra, do các câu hỏi kiểm thử RAG được chọn lọc nằm đúng trong 101 chuyên đề thuộc kho 303 chunk, thực nghiệm RAG chỉ đo lường năng lực truy xuất và kiểm chứng trong phạm vi tri thức mục tiêu này.

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

