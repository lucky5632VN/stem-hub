# 🛡️ HƯỚNG DẪN TẠO TÀI KHOẢN ADMIN THỦ CÔNG TRÊN FIREBASE CONSOLE

> **Mục đích**: Loại bỏ hoàn toàn mọi cơ chế hardcode tài khoản ẩn/bypass trong mã nguồn. Tài khoản Admin duy nhất được tạo thủ công trực tiếp trên bảng điều khiển Firebase.

---

## 📋 THAO TÁC THỰC HIỆN (1 LẦN DỰ ÁN)

### Dòng 1: Tạo tài khoản xác thực (Firebase Authentication)

1. Truy cập **Firebase Console**: `https://console.firebase.google.com/`
2. Chọn dự án **STEM HUB** (hoặc dự án Firebase đang liên kết).
3. Vào menu **Authentication** $\rightarrow$ chọn tab **Users** $\rightarrow$ nhấn nút **Add User**.
4. Nhập thông tin:
   - **Email**: Email quản trị viên mong muốn (Ví dụ: `admin@stemhub.edu.vn`).
   - **Password**: Nhập một mật khẩu mạnh ngẫu nhiên (chứa chữ hoa, chữ thường, số và ký tự đặc biệt).
5. Nhấn **Add User** và **Sao chép User UID** của tài khoản vừa tạo.

---

### Dòng 2: Phân quyền Quản trị viên (Firestore Database)

1. Trên Firebase Console, vào menu **Firestore Database**.
2. Chọn collection **`users`**.
3. Nhấn **Add document**:
   - **Document ID**: Dán chính xác **User UID** vừa sao chép ở Dòng 1.
4. Thêm các trường dữ liệu (Fields) sau:
   - `uid` (string): User UID của tài khoản.
   - `email` (string): Email quản trị viên đã tạo.
   - `displayName` (string): Tên hiển thị (Ví dụ: `Quản trị viên`).
   - `role` (string): **`admin`** *(Trường quan trọng nhất để cấp quyền)*.
   - `createdAt` (string): Thời điểm tạo (ISO 8601 string, ví dụ: `2026-09-02T00:00:00.000Z`).
5. Nhấn **Save**.

---

## 🔑 ĐĂNG NHẬP & VẬN HÀNH

- Sau khi hoàn thành 2 bước trên, Quản trị viên có thể đăng nhập bình thường qua biểu mẫu **Đăng Nhập** trên giao diện Web bằng Email và Mật khẩu vừa tạo.
- Hệ thống sẽ tự động xác thực quyền qua Firestore `users/{uid}.role === 'admin'` và mở khóa cổng quản trị `/admin` và `/admin/ai-core-demo`.
- **Lưu ý bảo mật**: Không bao giờ commit email/mật khẩu thật của tài khoản Admin lên mã nguồn Git.
