# 📘 RUNBOOK: DI CHUYỂN DỮ LIỆU SINH TRẮC HỌC SANG SUBCOLLECTION RIÊNG BIỆT (FIRESTORE)
> **Trạng thái**: **CHƯA CHẠY TRÊN DỮ LIỆU PRODUCTION THẬT** (Đang chờ lệnh và xác nhận trực tiếp từ Quản trị viên).  
> **Nguyên tắc an toàn**: Không tự ý sửa đổi dữ liệu; script mặc định chạy `--dry-run`; bắt buộc sao lưu trước khi thực thi; có cơ chế hoàn tác tự động.

---

## 🛡️ I. MỤC TIÊU & CHÍNH SÁCH BẢO MẬT
1. **Mục tiêu**: Di chuyển trường vector đặc trưng khuôn mặt (`faceDescriptor`, mảng 128 số thực trích xuất từ ResNet-34 FaceNet) khỏi document gốc `users/{uid}` vào subcollection cô lập `users/{uid}/private/biometrics`.
2. **Quyền riêng tư & Security Rules**:
   - Subcollection `users/{uid}/private/biometrics` áp dụng quy tắc Owner-Only: **chỉ duy nhất chủ tài khoản được phép đọc/ghi/xóa**.
   - Giáo viên (Teacher) và Quản trị viên (Admin) hoàn toàn bị từ chối quyền đọc (`allow read: if isOwner(userId)`).
   - Document gốc `users/{uid}` bị cấm tạo hoặc sửa trường `faceDescriptor` (`hasNoRootFaceDescriptor()`).
3. **Đồng thuận minh bạch**:
   - Bản ghi consent tại `users/{uid}/private/consent` mang nhãn chính thức:  
     `"học sinh tự xác nhận đã có đồng ý của phụ huynh (chưa được xác minh)"`.
   - Việc xác thực khuôn mặt là **hoàn toàn tự nguyện, không bắt buộc để vào thi**. Nếu học sinh từ chối quét mặt, hệ thống áp dụng phương án thi thay thế: **giám sát thủ công bởi giáo viên tại phòng thi** (`manual_teacher_supervision`).

---

## 💾 II. BƯỚC 1: SAO LƯU DỮ LIỆU FIRESTORE TRƯỚC KHI THỰC HIỆN (BẮT BUỘC)
Trước khi chạy bất kỳ thao tác ghi/xóa nào, người quản trị bắt buộc phải tạo một bản sao lưu (snapshot backup) toàn vẹn collection `users`.

### Lựa chọn A: Sử dụng Google Cloud CLI
```bash
# Đăng nhập tài khoản sở hữu dự án Google Cloud
gcloud auth login
gcloud config set project [PROJECT_ID_THAT]

# Xuất dữ liệu collection users sang Cloud Storage Bucket
gcloud firestore export gs://[TÊN_BUCKET_BACKUP]/firestore_backup_users_$(date +%Y%m%d_%H%M%S) --collection-ids=users
```

### Lựa chọn B: Sử dụng Firebase Console
1. Truy cập [Firebase Console](https://console.firebase.google.com/) $\rightarrow$ Chọn dự án STEM HUB thật.
2. Chọn **Build** $\rightarrow$ **Firestore Database** $\rightarrow$ Chọn tab **Usage** hoặc **Backups**.
3. Bấm **Export Data** $\rightarrow$ Chọn bucket lưu trữ $\rightarrow$ Xác nhận xuất dữ liệu.

---

## 🔍 III. BƯỚC 2: CHẠY KIỂM TRA THỬ Ở CHẾ ĐỘ CHỈ ĐỌC (DRY-RUN)
Script [scripts/migrate_biometrics_real_firestore.cjs](file:///e:/project/cuoc_thi_AI/scripts/migrate_biometrics_real_firestore.cjs) được thiết kế mặc định chạy ở chế độ `--dry-run` (Safe Read-Only Mode):

```bash
# Thiết lập biến môi trường trỏ tới Service Account thật (nếu cần)
export FIREBASE_SERVICE_ACCOUNT_PATH="./serviceAccountKey.json"

# Chạy kiểm tra thử (Mặc định dry-run)
node scripts/migrate_biometrics_real_firestore.cjs
```

**Hành vi của script**:
- Quét toàn bộ collection `users`.
- Lọc và đếm số tài khoản đang chứa trường `faceDescriptor` tại root document.
- In ra danh sách UID và kích thước vector.
- **TUYỆT ĐỐI KHÔNG GHI HOẶC XÓA BẤT KỲ DỮ LIỆU NÀO TRÊN FIRESTORE**.

---

## ⚡ IV. BƯỚC 3: THỰC THI DI CHUYỂN THẬT KHI ĐÃ ĐƯỢC PHÊ DUYỆT (`--execute`)
> ⚠️ **CẢNH BÁO**: Chỉ thực hiện lệnh này sau khi (1) Đã hoàn tất Bước 1 (Sao lưu) và (2) Có sự xác nhận trực tiếp của người quản trị dự án.

```bash
node scripts/migrate_biometrics_real_firestore.cjs --execute
```

**Quy trình tự động hóa an toàn của script**:
1. Tự động sao lưu toàn bộ dữ liệu vector cũ của các tài khoản phát hiện vào file bản đồ hoàn tác:  
   `reports/biometrics_rollback_map_<timestamp>.json`.
2. Tạo document `users/{uid}/private/biometrics` và ghi dữ liệu vector kèm metadata (`migratedAt`, `version: 2.0`).
3. Thực hiện lệnh atomic `FieldValue.delete()` để xóa trường `faceDescriptor` ở document gốc `users/{uid}`.
4. In nhật ký từng tài khoản đã xử lý thành công.

---

## ✅ V. BƯỚC 4: KIỂM CHỨNG SAU DI CHUYỂN (POST-MIGRATION VERIFICATION)
1. **Chạy lại lệnh dry-run**:
   ```bash
   node scripts/migrate_biometrics_real_firestore.cjs
   ```
   *Kết quả mong đợi*:
   ```text
   🎯 KẾT QUẢ QUÉT:
      - Số tài khoản có faceDescriptor ở root: 0
   ✅ Tuyệt vời: Không phát hiện tài khoản nào có faceDescriptor ở document gốc.
   ```
2. **Kiểm tra phân quyền trên Firebase Console / Emulator**:
   - Truy cập vào document của một học sinh: xác nhận không còn trường `faceDescriptor`.
   - Mở subcollection `private` $\rightarrow$ document `biometrics`: xác nhận vector 128 số thực đã được lưu trữ an toàn.

---

## ⏪ VI. BƯỚC 5: QUY TRÌNH HOÀN TÁC KHẨN CẤP (ROLLBACK PROCEDURE)
Trong trường hợp hy hữu xảy ra lỗi ngoài ý muốn, người quản trị có thể phục hồi ngay lập tức toàn bộ trạng thái dữ liệu cũ bằng cách sử dụng file bản đồ hoàn tác:

```bash
node scripts/migrate_biometrics_real_firestore.cjs --rollback=reports/biometrics_rollback_map_[TIMESTAMP].json
```

**Hành vi hoàn tác**:
- Đọc lại dữ liệu vector gốc từ file JSON.
- Phục hồi lại trường `faceDescriptor` về document gốc `users/{uid}`.
- Xóa document tạm ở subcollection `private/biometrics`.
- Đảm bảo hệ thống trở về trạng thái ban đầu một cách toàn vẹn.

---

## 🧪 VII. PHƯƠNG ÁN THI THAY THẾ (KHI KHÔNG DÙNG SINH TRẮC HỌC)
- **Quy định**: Sinh trắc học khuôn mặt là tính năng tùy chọn.
- **Phương án thay thế**:
  - Học sinh chọn không đăng ký hoặc xóa dữ liệu sinh trắc học vẫn vào làm bài bình thường tại `/phong-thi` và `/dau-truong`.
  - Giám sát phòng thi được thực hiện theo phương thức truyền thống: Giáo viên trực tiếp đối chiếu danh sách thí sinh và giám sát trực quan, kết hợp cơ chế Anti-Cheat chuyển tab của hệ thống.
  - Bộ kiểm thử tự động tại `tests/biometrics_alternative_exam.test.js` xác nhận học sinh không bật face 2FA không bị chặn quyền làm bài thi.

