# 🧬 Phân tích Codebase — BioSTEM Virtual AI (lab_sinh)

> **Dự án:** `e:\project\STT2026\lab_sinh` | **Ngày:** 2026-05-18

---

## 📁 Cấu trúc thư mục

Đây là một ứng dụng **React + Vite** hiện đại, kết hợp Three.js cho giao diện 3D và các iframe nhúng mô phỏng thực hành ảo.

```
lab_sinh/
├── index.html                  # Entry point HTML của Vite
├── package.json                # Chứa dependencies (React, Three, Lucide)
├── vite.config.js              # Cấu hình Vite
├── public/
│   └── external/               # Chứa file HTML gốc của các lab mô phỏng ảo (Anatomy, Mendel, ...)
└── src/
    ├── main.jsx                # Render React root
    ├── App.jsx                 # Khai báo React Router (Routing tổng thể)
    ├── index.css               # Global CSS
    ├── components/
    │   ├── layout/             # Component khung: MainLayout, Sidebar, BottomBar
    │   └── Chatbot.jsx         # Chatbot Gemini AI tích hợp
    ├── pages/
    │   ├── Home.jsx            # Trang chủ
    │   ├── Theory.jsx          # Lý thuyết
    │   ├── Exercises.jsx       # Bài tập
    │   ├── VirtualLab.jsx      # Danh sách tổng hợp tất cả Lab ảo
    │   └── labs/               # Các trang Wrapper của từng Lab (AnatomyLab, MendelLab, v.v.)
```

---

## 🏗️ Kiến trúc & Công nghệ

*   **Framework:** React 19 + Vite.
*   **Routing:** `react-router-dom` (BrowserRouter).
*   **Icons:** `lucide-react`.
*   **3D Graphics:** `@react-three/fiber` & `@react-three/drei` (hiện diện trong file package.json, có thể dùng trong các trang Theory/Exercises).
*   **AI Chatbot:** Sử dụng Gemini API (`VITE_GEMINI_API_KEY`) với 3 phiên bản model fallback (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`).
*   **Virtual Labs:** Hệ thống có tới **21 bài thí nghiệm**, chia thành 4 chuyên đề (Sinh lý người, Di truyền, Sinh thái, Tế bào). Các Lab này được React bọc lại (wrapper) bằng thẻ `<iframe>` trỏ tới `/external/.../index.html`.

---

## 🎯 Luồng hoạt động chính (Routing Flow)

```
<App>
  ├─ <Chatbot> (Hiển thị Global ở góc dưới)
  └─ <Routes>
      ├─ <MainLayout> (Có Sidebar, BottomBar)
      │   ├─ "/" (Home)
      │   ├─ "/theory" (Theory)
      │   ├─ "/exercises" (Exercises)
      │   └─ "/virtual-lab" (Danh sách 21 Lab)
      │
      └─ Bọc Lab riêng biệt (Không có Sidebar, tối đa hóa màn hình)
          ├─ "/virtual-lab/anatomy" → <AnatomyLab> (Hiển thị iframe /external/anatomy/index.html)
          ├─ "/virtual-lab/ct-scan"
          ├─ ... 19 Lab khác
```

---

## 📄 Chi tiết các Components quan trọng

### `src/App.jsx`
Cấu hình toàn bộ Routes. Mọi file lab wrapper đều được import và map vào route `/virtual-lab/...`. Chatbot được đặt bên ngoài `<Routes>` nên sẽ hiện diện ở mọi trang.

### `src/pages/VirtualLab.jsx`
Hiển thị danh sách các card thí nghiệm. Dữ liệu mảng `labs` chứa thông tin chi tiết (id, name, category, mô tả, màu sắc). Khi click vào card, `navigate(lab.path)` sẽ đưa người dùng tới trang wrapper lab tương ứng. Có tính năng lưu trữ vị trí cuộn trang (scroll position) bằng `sessionStorage`.

### `src/components/Chatbot.jsx`
Giao diện chat cố định góc dưới bên phải. Gửi request tới Google Generative Language API. Nó thay thế các markdown tokens (như `**`, `*`, `#`) bằng plain text để giữ UI gọn gàng. Lưu trữ lịch sử tin nhắn trong `localStorage`.

### `src/pages/labs/AnatomyLab.jsx` (và các file lab khác)
Một trang React đơn giản đóng vai trò là "Theater mode". Nó chứa thanh Header nhỏ (Nút Back, Nút Restart Iframe, Nút Fullscreen) và một `<iframe>` chiếm toàn bộ phần thân để load source HTML local từ thư mục `/public/external/`.

---

## ⚠️ Điểm quan trọng khi chỉnh sửa và cập nhật

> [!IMPORTANT]
> **Vite Server:** Ứng dụng này dùng Vite, do đó **không thể** mở file `index.html` trực tiếp trên trình duyệt bằng giao thức `file://` hay qua server HTTP cơ bản thông thường để xem React content. Phải chạy `npm run dev` (hoặc build ra dist).

> [!WARNING]
> **Iframe Paths:** Các trang thực hành ảo sử dụng đường dẫn gốc như `src="/external/anatomy/index.html"`. Thư mục `/external` nằm trong `/public`. Khi build Vite, thư mục `public` sẽ được copy y nguyên vào gốc của thư mục `dist`. Hãy chắc chắn cấu hình `base: '/'` của Vite (hoặc đường dẫn tương đối) phải phù hợp nếu bạn định deploy nó dưới một subpath.

> [!NOTE]
> **Tích hợp với Hub Portal:** Vì Hub Portal (`e:\project\STT2026\index.html`) là file HTML tĩnh còn `lab_sinh` là app Vite, nên lúc Dev bạn cần chạy 2 server song song:
> - Server tĩnh cho Hub (`http://localhost:3000`)
> - Server Vite cho Lab Sinh (`http://localhost:5174`)
> 
> Nút "Về Hub" trong `lab_sinh` sẽ dùng `href="http://localhost:3000/"`.

---
*Antigravity AI — 2026-05-18*
