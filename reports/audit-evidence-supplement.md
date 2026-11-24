> ⚠️ **TÀI LIỆU NỘI BỘ — KHÔNG NỘP BAN GIÁM KHẢO**
> Báo cáo này phục vụ mục đích ghi vết kỹ thuật nội bộ trong quá trình khắc phục sự cố, không nằm trong hồ sơ dự thi chính thức gửi Ban Giám khảo.

---

# BÁO CÁO MINH CHỨNG BỔ SUNG: 3 NỘI DUNG BẢO MẬT VÀ DỮ LIỆU
## DỰ ÁN STEM HUB — CUỘC THI SÁNG TẠO TRẺ QUỐC GIA 2026 (LĨNH VỰC TRÍ TUỆ NHÂN TẠO)

- **Nhánh Git**: `feat/grounding-ui`
- **Thời điểm thực hiện**: 2026-11-16T20:48:30+07:00
- **Cam kết tuân thủ**: Thực hiện đầy đủ QUY TẮC TRUNG THỰC (Prompt 0) — Mọi con số đều do lệnh chạy thật sinh ra, kèm mã lệnh và output nguyên bản.

---

## 1. Mục 1(a): Di chuyển FaceDescriptor sang Subcollection & Xóa vị trí cũ

### 1.1. Hiện trạng mã nguồn và Firestore Security Rules
- **Vị trí mới**: `users/{userId}/private/biometrics`
- **Quy tắc phân quyền tại [firestore.rules](file:///e:/project/cuoc_thi_AI/firestore.rules)**:
  ```javascript
  match /users/{userId}/private/{docId} {
    allow read, write, delete: if isOwner(userId);
  }
  ```
- **Khóa chặt document gốc `users/{userId}`**:
  - `faceDescriptor` và `faceEnrolled` bị loại khỏi whitelist cập nhật hồ sơ `isAllowedUserUpdate()`.
  - `faceDescriptor` được thêm vào danh sách `forbiddenKeys` trong hàm kiểm tra leo thang `hasNoPrivilegeEscalation()`.
  - Cấm hoàn toàn việc tạo mới tài khoản có chứa `faceDescriptor` ở document gốc:
    ```javascript
    allow create: if isAuthenticated() &&
                    request.auth.uid == userId &&
                    hasNoPrivilegeEscalation() &&
                    !('faceDescriptor' in request.resource.data) &&
                    (!('personalization' in request.resource.data) || !('faceDescriptor' in request.resource.data.personalization));
    ```
  - Giáo viên (`role == 'teacher'`) và Quản trị viên (`role == 'admin'`) **hoàn toàn không có quyền đọc** `users/{userId}/private/biometrics` (Owner-Only Access).

### 1.2. Script migration và Kết quả chạy thực tế trên Emulator
- **Script**: [scripts/migrate_face_biometrics.cjs](file:///e:/project/cuoc_thi_AI/scripts/migrate_face_biometrics.cjs)
- **Unit test**: [tests/biometrics_migration.test.cjs](file:///e:/project/cuoc_thi_AI/tests/biometrics_migration.test.cjs)
- **Lệnh chạy**:
  ```bash
  npx --no-install firebase-tools emulators:exec --only firestore "node tests/biometrics_migration.test.cjs"
  ```
- **Output thực tế từ emulator**:
  ```text
  i  emulators: Starting emulators: firestore
  +  firestore: Firestore Emulator was started in standard edition.
  +  firestore: Firestore Emulator UI websocket is running on 9150.
  i  Running script: node tests/biometrics_migration.test.cjs
  🧪 === BẮT ĐẦU TEST SCRIPT MIGRATION DỮ LIỆU SINH TRẮC HỌC ===

  🔄 === BẮT ĐẦU MIGRATION DỮ LIỆU SINH TRẮC HỌC SANG SUBCOLLECTION RIÊNG TƯ ===
  📋 Tổng số tài khoản người dùng quét được: 3
    -> Tìm thấy vector khuôn mặt cũ tại user user_old_1 (độ dài 128-D)
    -> Tìm thấy vector khuôn mặt cũ tại user user_old_2 (độ dài 128-D)

  📊 KẾT QUẢ MIGRATION:
    - Số bản ghi đã chuyển sang users/{uid}/private/biometrics: 2
    - Số bản ghi đã xóa trường cũ trên users/{uid}: 2
  ========================================================================

  ✅ [PASS] Tất cả các bước di chuyển và dọn dẹp dữ liệu sinh trắc học thành công!
  +  Script exited successfully (code 0)
  ```

### 1.3. Bằng chứng kiểm thử phân quyền người khác không đọc được
- **File test**: [tests/firestore.rules.test.js](file:///e:/project/cuoc_thi_AI/tests/firestore.rules.test.js) (6 ca test chuyên biệt M, N, O, P, Q, R)
- **Lệnh chạy**:
  ```bash
  npx --no-install firebase-tools emulators:exec --only firestore "node tests/firestore.rules.test.js"
  ```
- **Output thực tế từ emulator**:
  ```text
  ✅ [PASS] Test M: Chủ sở hữu (Alice) CÓ THỂ đọc, ghi, xóa users/alice/private/biometrics
  ✅ [PASS] Test N: Người dùng khác đã đăng nhập (Bob) KHÔNG THỂ đọc users/alice/private/biometrics
  ✅ [PASS] Test O: Người dùng chưa đăng nhập KHÔNG THỂ đọc users/alice/private/biometrics
  ✅ [PASS] Test P: Teacher và Admin KHÔNG THỂ đọc users/alice/private/biometrics
  ✅ [PASS] Test Q: Alice KHÔNG THỂ cập nhật faceDescriptor lên users/alice gốc
  ✅ [PASS] Test R: Không thể tạo user mới chứa faceDescriptor ở tài liệu gốc

  =========================================
  ✅ TẤT CẢ CÁC TEST CASES ĐÃ PASS THÀNH CÔNG! (33/33 passed, 0 failed)
  +  Script exited successfully (code 0)
  ```

---

## 2. Mục 1(b): Bỏ và Khóa Nhánh Dev Auth (Fail-Closed)

### 2.1. Hiện trạng mã nguồn tại [src/lib/firebaseAdmin.js](file:///e:/project/cuoc_thi_AI/src/lib/firebaseAdmin.js)
Hàm `verifyFirebaseIdToken(authHeader, clientIp, options)` quy định:
1. Luôn ưu tiên xác thực chữ ký số bằng Firebase Admin SDK (`adminAuth.verifyIdToken(token)`).
2. Khi không có cờ `ALLOW_INSECURE_DEV_AUTH=1` $\rightarrow$ Mặc định **Fail-Closed**. Nếu thiếu cấu hình server hoặc token không chữ ký / sai chữ ký thì lập tức từ chối và trả về HTTP 401.
3. Khi có cờ `ALLOW_INSECURE_DEV_AUTH=1`:
   - Nếu `process.env.NODE_ENV === 'production'` $\rightarrow$ **Lập tức từ chối với HTTP 403 Forbidden**.
   - Nếu host không phải localhost (`host !== 'localhost' && !host.startsWith('127.0.0.1')`) $\rightarrow$ **Lập tức từ chối với HTTP 403 Forbidden**.
   - Chuỗi bí mật tĩnh `'stemhub_admin_secret_key_2026'` đã bị xóa bỏ hoàn toàn khỏi mã nguồn.

### 2.2. Kết quả kiểm thử tự động trên 3 cấu hình môi trường
- **File test**: [tests/auth_fail_closed.test.js](file:///e:/project/cuoc_thi_AI/tests/auth_fail_closed.test.js)
- **Lệnh chạy**:
  ```bash
  node tests/auth_fail_closed.test.js
  ```
- **Output thực tế**:
  ```text
  🧪 === BẮT ĐẦU KIỂM THỬ XÁC THỰC FAIL-CLOSED TOÀN DIỆN (REQUIREMENT 2) ===

    ✅ [PASS] Mặc định: NODE_ENV chưa đặt -> Token unsigned role=admin BỊ TỪ CHỐI (Fail-Closed)
    ✅ [PASS] Mặc định: NODE_ENV="development" -> Token unsigned role=admin BỊ TỪ CHỐI (Fail-Closed)
    ✅ [PASS] Mặc định: NODE_ENV="production" -> Token unsigned role=admin BỊ TỪ CHỐI (Fail-Closed)
  [FirebaseAdmin] 🚨 NGUY HIỂM: Cờ ALLOW_INSECURE_DEV_AUTH=1 bị từ chối trên môi trường Production hoặc Remote Host!
    ✅ [PASS] ALLOW_INSECURE_DEV_AUTH=1 trên Production -> BẮT BUỘC BỊ TỪ CHỐI (Status 403)
  [FirebaseAdmin] 🚨 NGUY HIỂM: Cờ ALLOW_INSECURE_DEV_AUTH=1 bị từ chối trên môi trường Production hoặc Remote Host!
    ✅ [PASS] ALLOW_INSECURE_DEV_AUTH=1 với non-localhost host -> BẮT BUỘC BỊ TỪ CHỐI
  [FirebaseAdmin] ⚠️ CẢNH BÁO: Đang sử dụng ALLOW_INSECURE_DEV_AUTH=1 (Chỉ dùng cho Local Dev Offline).
    ✅ [PASS] ALLOW_INSECURE_DEV_AUTH=1 trên localhost dev -> Cho phép parse nội bộ
    ✅ [PASS] Missing Token -> Trả về 401
    ✅ [PASS] Token không đủ 3 phần JWT -> Trả về 401
    ✅ [PASS] Token hết hạn (exp in past) -> Trả về 401
    ✅ [PASS] Chuỗi hardcoded secret cũ bị loại bỏ hoàn toàn

  📊 KẾT QUẢ: 10/10 passed (0 failed)
  ```

---

## 3. Mục 1(c): Kết quả Quét Secret Toàn bộ Lịch sử Git & Kế hoạch Xoay vòng

### 3.1. Kết quả quét bằng Gitleaks v8.30.1 trên 101 Commit Lịch sử Git
- **Lệnh chạy**:
  ```bash
  gitleaks detect --source . --log-opts="--all" --report-format json --report-path reports/gitleaks-history.json
  ```
- **File báo cáo lưu trữ**: [reports/gitleaks-history.json](file:///e:/project/cuoc_thi_AI/reports/gitleaks-history.json)
- **Thống kê 111 phát hiện**:
  1. `gcp-api-key` (31 phát hiện): Các API key Gemini dạng `AIzaSy...` dùng trong các commit ban đầu.
  2. `curl-auth-header` (6 phát hiện): Đoạn cURL mẫu chứa header Authorization trong file hướng dẫn.
  3. `generic-api-key` (72 phát hiện): Các token JWT mẫu, client config demo.
  4. `aws-access-token` (1 phát hiện): Chuỗi định dạng AWS access key cũ.
  5. `private-key` (1 phát hiện): Khóa Private Key của Firebase Service Account cũ.

### 3.2. Truy vết chuỗi `'stemhub_admin_secret_key_2026'`
- Xuất hiện lần đầu tại commit `995b89a` (`src/app/api/learned-knowledge/route.js`).
- Đã gỡ bỏ vĩnh viễn khỏi mã nguồn tại commit `faf7564`.

### 3.3. Danh sách các Khóa cần xoay vòng (Rotation Plan)
> **Cam kết trung thực**: Nhóm **không viết lại lịch sử git** và **không xóa commit** để che giấu vết tích cũ. Các khóa cũ được xử lý thông qua quy trình xoay vòng (Key Rotation):

| STT | Loại khóa | Khóa / ID nhận dạng | Trạng thái hiện tại | Kế hoạch hành động |
|:---:|---|---|:---:|---|
| 1 | **Google Gemini API Key** | Các key bắt đầu bằng `AIzaSy...` | Đã đưa vào biến môi trường server `GEMINI_API_KEY` | Vô hiệu hóa (Revoke) toàn bộ các Key ID cũ trên Google AI Studio / GCP Console; tạo key mới nạp vào Secret Manager Vercel |
| 2 | **Firebase Service Account** | `d71f6a4cd7...` | Đã xóa file `.json` khỏi repo | Xóa Private Key ID `d71f6a4cd7...` trên Google Cloud IAM; tạo Service Account Key mới dạng Base64 string nạp vào biến môi trường hosting |
| 3 | **Cloudflare Secret** | Chuỗi băm HMAC khuôn mặt | Bắt buộc đọc từ `env.FACE_AUTH_SECRET` | Chạy lệnh `wrangler secret put FACE_AUTH_SECRET` nạp chuỗi hex 32 bytes ngẫu nhiên |
| 4 | **Admin Secret tĩnh** | `'stemhub_admin_secret_key_2026'` | **Đã gỡ bỏ** | Không còn sử dụng trong bất kỳ route hay component nào (0 tham chiếu trong code) |

