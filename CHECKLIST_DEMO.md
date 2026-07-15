# CHECKLIST KHỞI ĐỘNG HỆ THỐNG ĐẤU TRƯỜNG STEM (DEMO)

Hãy in tờ checklist này ra giấy và thực hiện chính xác các bước dưới đây trước mỗi buổi Demo để đảm bảo hệ thống không bị lỗi xung đột cổng (Port conflict) và hoạt động mượt mà.

---

### BƯỚC 1: KIỂM TRA MẠNG WI-FI (Nếu demo trên nhiều thiết bị)
* [ ] **Kết nối chung mạng**: Đảm bảo máy tính chạy demo và tất cả các thiết bị dùng để test (điện thoại của giám khảo, máy tính thứ 2) đều kết nối vào **cùng một mạng Wi-Fi**.
* [ ] **Lấy địa chỉ IP nội bộ**:
  * Mở PowerShell/CMD trên máy tính chạy demo, gõ lệnh: `ipconfig`
  * Tìm dòng **IPv4 Address** (thường có dạng: `192.168.1.X` hoặc `10.0.0.X`).
  * *Ghi nhớ địa chỉ IP này (ví dụ: `192.168.1.50`)*.

---

### BƯỚC 2: GIẢI PHÓNG CÁC CỔNG BỊ CHIẾM (PORT CLEANUP)
Đôi khi các tiến trình chạy ngầm từ lần trước chưa tắt hẳn sẽ chiếm các cổng `3000`, `5001`, `8080`, `9099`, `4000`.
* [ ] Chạy lệnh sau trong PowerShell để giải phóng nhanh các cổng (tắt các tiến trình chạy ngầm):
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000, 5001, 8080, 9099, 4000 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force
  ```
  *(Hoặc khởi động lại máy tính nếu muốn chắc chắn 100% các cổng đều sạch).*

---

### BƯỚC 3: KHỞI ĐỘNG FIREBASE EMULATOR (CHẠY CLOUD FUNCTIONS)
* [ ] Mở **Terminal thứ nhất** tại thư mục dự án `STT2026`.
* [ ] Gõ lệnh và nhấn Enter:
  ```bash
  firebase emulators:start --only functions
  ```
* [ ] Chờ đến khi màn hình hiển thị:
  `✔  All emulators ready! It is now safe to connect your app.`
  *(Lưu ý: Không tắt cửa sổ này trong suốt quá trình demo).*

---

### BƯỚC 4: KHỞI ĐỘNG NEXT.JS DEV SERVER
* [ ] Mở **Terminal thứ hai** tại thư mục dự án `STT2026`.
* [ ] Gõ lệnh tùy theo cách thức demo:
  * **Nếu demo trên 1 máy duy nhất (2 tab trình duyệt):**
    ```bash
    npm run dev
    ```
  * **Nếu demo trên 2 máy/thiết bị khác nhau (dùng Wi-Fi nội bộ):**
    ```bash
    npx next dev -H 0.0.0.0
    ```
* [ ] Chờ đến khi màn hình hiển thị:
  `▲ Next.js 16.2.6 (Turbopack)`
  `- Local: http://localhost:3000`
  `- Network: http://<IP_MÁY_CHỦ>:3000`

---

### BƯỚC 5: TRUY CẬP VÀ TIẾN HÀNH DEMO
* [ ] **Nếu chạy trên 1 máy duy nhất**:
  * **Tab 1**: Mở Google Chrome bình thường truy cập `http://localhost:3000`.
  * **Tab 2**: Mở cửa sổ ẩn danh (Incognito) hoặc Microsoft Edge truy cập `http://localhost:3000`.
* [ ] **Nếu chạy trên 2 máy/thiết bị**:
  * Trên cả hai thiết bị, mở trình duyệt và truy cập theo đường dẫn IP nội bộ đã lấy ở Bước 1:
    `http://<IP_MÁY_CHỦ>:3000` (Ví dụ: `http://192.168.1.50:3000`).
* [ ] Đăng nhập 2 tài khoản học sinh khác nhau và bắt đầu trải nghiệm đấu trường 1v1!
