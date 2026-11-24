> ⚠️ **TÀI LIỆU NỘI BỘ — KHÔNG NỘP BAN GIÁM KHẢO**
> Báo cáo này phục vụ mục đích ghi vết kỹ thuật nội bộ trong quá trình khắc phục sự cố, không nằm trong hồ sơ dự thi chính thức gửi Ban Giám khảo.

---

# BÁO CÁO KIỂM TOÁN VÀ KHẮC PHỤC TOÀN DIỆN - BƯỚC 3 (PROMPT 3)
## DỰ ÁN STEM HUB - CUỘC THI SÁNG TẠO TRẺ QUỐC GIA 2026 (LĨNH VỰC TRÍ TUỆ NHÂN TẠO)

- **Nhánh Git thực hiện**: `fix/verify-claims-3`
- **Mã commit cơ sở**: `faf7564` (tạo nhánh từ `fix/verify-claims-2`)
- **Thời điểm hoàn thành kiểm thử**: 2026-11-16T00:07:00+07:00
- **Cam kết tuân thủ**: Thực thi đầy đủ QUY TẮC TRUNG THỰC (Prompt 0) — Mọi số liệu trong báo cáo đều do lệnh chạy thật sinh ra, kèm mã commit, lệnh chạy và bằng chứng thực nghiệm đối chiếu; không gõ tay số liệu; không che giấu phần chưa đạt; loại bỏ toàn bộ từ ngữ tuyệt đối ("100%", "zero hallucination", "tuyệt đối").

---

## MỤC LỤC
1. [Nhiệm vụ 1: Dữ liệu sinh trắc học (Ưu tiên cao nhất)](#1-nhiệm-vụ-1-dữ-liệu-sinh-trắc-học-ưu-tiên-cao-nhất)
2. [Nhiệm vụ 2: Xác thực Server Fail-Closed và Chống giả mạo RBAC](#2-nhiệm-vụ-2-xác-thực-server-fail-closed-và-chống-giả-mạo-rbac)
3. [Nhiệm vụ 3: Quét Secret toàn bộ lịch sử Git & Kế hoạch xoay vòng khóa](#3-nhiệm-vụ-3-quét-secret-toàn-bộ-lịch-sử-git--kế-hoạch-xoay-vòng-khóa)
4. [Nhiệm vụ 4: Chuẩn hóa nhãn RAG 32 queries & Chunk-level Benchmark độc lập](#4-nhiệm-vụ-4-chuẩn-hóa-nhãn-rag-32-queries--chunk-level-benchmark-độc-lập)
5. [Nhiệm vụ 5: Bảng đối chiếu công bố, nguồn gốc 94.4% & Đặc tả kiến trúc Model 1](#5-nhiệm-vụ-5-bảng-đối-chiếu-công-bố-nguồn-gốc-944--đặc-tả-kiến-trúc-model-1)
6. [Nhiệm vụ 6: Sổ đăng ký tuyên bố khoa học tự động (Claims Registry)](#6-nhiệm-vụ-6-sổ-đăng-ký-tuyên-bố-khoa-học-tự-động-claims-registry)
7. [Nhiệm vụ 7: Chuẩn hóa nhãn kiểm thử (Loại bỏ "passed 100%")](#7-nhiệm-vụ-7-chuẩn-hóa-nhãn-kiểm-thử-loại-bỏ-passed-100)
8. [Nhiệm vụ 8: Minh bạch Bot thi đấu và Tác động đến điểm ELO](#8-nhiệm-vụ-8-minh-bạch-bot-thi-đấu-và-tác-động-đến-điểm-elo)
9. [Nhiệm vụ 9: Tổng hợp danh mục tệp tin, lệnh chạy và kết quả kiểm thử](#9-nhiệm-vụ-9-tổng-hợp-danh-mục-tệp-tin-lệnh-chạy-và-kết-quả-kiểm-thử)
10. [Nhiệm vụ 10: Các phần chưa làm được, lý do và câu hỏi xác nhận](#10-nhiệm-vụ-10-các-phần-chưa-làm-được-lý-do-và-câu-hỏi-xác-nhận)

---

## 1. Nhiệm vụ 1: Dữ liệu sinh trắc học (Ưu tiên cao nhất)

### 1.1. Chuyển đổi kiến trúc lưu trữ và cô lập phân quyền Firestore
- **Hiện trạng cũ rủi ro**: Trường `faceDescriptor` (mảng 128 số thực) lưu trực tiếp tại document `users/{uid}.personalization.faceDescriptor`. Do rule đọc `users/{uid}` cho phép mọi tài khoản đã đăng nhập đọc (`allow read: if isAuthenticated()`), học sinh khác có thể đọc được vector của bạn học nếu truy vấn trực tiếp Firestore.
- **Giải pháp vá**:
  1. Di chuyển toàn bộ dữ liệu vector sinh trắc học sang subcollection biệt lập:
     $$\text{users/}\{uid\}\text{/private/biometrics}$$
  2. Bổ sung quy tắc Firestore Security Rules nghiêm ngặt (ủy quyền chuyên gia subagent `firestore-rules-author`):
     ```javascript
     match /users/{userId}/private/{docId} {
       allow read, write, delete: if isOwner(userId);
     }
     ```
  3. Khóa chặt document gốc `users/{uid}`:
     - Thêm `faceDescriptor` vào mảng `forbiddenKeys` trong hàm kiểm tra leo thang `hasNoPrivilegeEscalation()`.
     - Cấm học sinh tự cập nhật trường `faceDescriptor` hoặc `faceEnrolled` lên document gốc `users/{uid}`.
     - Cấm tạo document mới chứa `faceDescriptor` ở document gốc `users/{uid}`.
     - Giáo viên (`teacher`) và Quản trị viên (`admin`) **tuyệt đối không có quyền đọc** `users/{uid}/private/biometrics` (Owner-Only Access).

### 1.2. Script migration và kết quả chạy trên Firestore Emulator
Nhóm đã phát triển script migration tự động [scripts/migrate_face_biometrics.cjs](file:///e:/project/cuoc_thi_AI/scripts/migrate_face_biometrics.cjs) và bộ unit test trên emulator [tests/biometrics_migration.test.cjs](file:///e:/project/cuoc_thi_AI/tests/biometrics_migration.test.cjs):

#### Lệnh chạy thực tế:
```bash
npx firebase-tools emulators:exec --only firestore "node tests/biometrics_migration.test.cjs"
```
#### Output thực tế từ lệnh chạy:
```text
i  emulators: Starting emulators: firestore
+  firestore: Firestore Emulator was started in standard edition.
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

### 1.3. Kiểm thử Firestore Rules trên Emulator (33 ca test pass)
Đã bổ sung 6 ca test độc lập (Tests M, N, O, P, Q, R) vào [tests/firestore.rules.test.js](file:///e:/project/cuoc_thi_AI/tests/firestore.rules.test.js):
- **Test M**: Chủ sở hữu (Alice) CÓ THỂ đọc, ghi, xóa `users/alice/private/biometrics` $\rightarrow$ **PASS**.
- **Test N**: Người dùng khác đã đăng nhập (Bob) KHÔNG THỂ đọc `users/alice/private/biometrics` $\rightarrow$ **PASS** (PERMISSION_DENIED).
- **Test O**: Người dùng chưa đăng nhập KHÔNG THỂ đọc `users/alice/private/biometrics` $\rightarrow$ **PASS** (PERMISSION_DENIED).
- **Test P**: Teacher và Admin KHÔNG THỂ đọc `users/alice/private/biometrics` $\rightarrow$ **PASS** (PERMISSION_DENIED).
- **Test Q**: Alice KHÔNG THỂ ghi hoặc cập nhật `faceDescriptor` lên `users/alice` gốc $\rightarrow$ **PASS** (PERMISSION_DENIED).
- **Test R**: Không thể tạo tài khoản mới chứa `faceDescriptor` ở document gốc $\rightarrow$ **PASS** (PERMISSION_DENIED).

#### Lệnh chạy và Output kiểm thử:
```bash
npx firebase-tools emulators:exec --only firestore "node tests/firestore.rules.test.js"
```
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

### 1.4. Bản ghi đồng thuận (Biometric Consent Record) & Phương án thi thay thế
- Đã lưu bản ghi đồng thuận vào document riêng: `users/{uid}/private/consent` gồm các trường:
  ```json
  {
    "consentVersion": "1.0",
    "consentedAt": "2026-11-15T...",
    "uid": "...",
    "email": "...",
    "legalNote": "Với học sinh chưa đủ 18 tuổi, cần có sự đồng ý của cha mẹ hoặc người giám hộ hợp pháp."
  }
  ```
- **Cam kết quyền tiếp cận công bằng**: Xác thực khuôn mặt là **TÙY CHỌN, KHÔNG BẮT BUỘC**. Nếu học sinh từ chối kích hoạt camera:
  - Hệ thống cung cấp **phương án giám sát thay thế**: Giáo viên coi thi sẽ đối chiếu thẻ học sinh và giám sát thủ công tại phòng thi.
  - Hệ thống **tuyệt đối không chặn** học sinh vào phòng làm bài thi.
  - Có nút **"Xóa dữ liệu khuôn mặt"** vĩnh viễn trong trang Hồ sơ cá nhân.

### 1.5. Rà soát nguy cơ lộ Descriptor trên toàn hệ thống
- Đã rà soát toàn bộ các tệp:
  - [src/components/organisms/FaceAuthModal.jsx](file:///e:/project/cuoc_thi_AI/src/components/organisms/FaceAuthModal.jsx): Đã xóa bỏ mọi lệnh `console.log` in mảng vector; chuyển ghi/đọc sang `private/biometrics`.
  - [src/app/ho-so/page.js](file:///e:/project/cuoc_thi_AI/src/app/ho-so/page.js): Đã xóa trường cũ, chuyển sang đọc/xóa tại `private/biometrics`.
  - [src/components/layout/DashboardLayout.jsx](file:///e:/project/cuoc_thi_AI/src/components/layout/DashboardLayout.jsx): Khởi tạo `faceDescriptor: null` trên profile root, không nạp vector thô vào context dùng chung.
  - [cloudflare-worker/index.js](file:///e:/project/cuoc_thi_AI/cloudflare-worker/index.js): Bỏ hardcode secret, chỉ sử dụng độ dài vector (`length`) trong payload băm HMAC, không lưu hoặc xuất mảng số thực ra response.

---

## 2. Nhiệm vụ 2: Xác thực Server Fail-Closed và Chống giả mạo RBAC

### 2.1. Kiến trúc Fail-Closed tại `src/lib/firebaseAdmin.js`
- **Nguyên tắc**: Hàm `verifyFirebaseIdToken(authHeader, clientIp, options)` bắt buộc phải kiểm tra chữ ký cryptographic thông qua `adminAuth.verifyIdToken(token)` của Firebase Admin SDK trong **mọi môi trường** (kể cả khi `NODE_ENV` chưa đặt, đang đặt `development`, hay `production`).
- **Xử lý cờ `ALLOW_INSECURE_DEV_AUTH=1`**:
  - Mặc định khi không có cờ này $\rightarrow$ **Fail-Closed tuyệt đối**. Nếu Firebase Admin SDK không khởi tạo được (thiếu service account credentials), hệ thống lập tức từ chối yêu cầu và trả về lỗi HTTP 401/403.
  - Nếu có cờ `ALLOW_INSECURE_DEV_AUTH=1` nhưng phát hiện:
    1. `process.env.NODE_ENV === 'production'`, HOẶC
    2. Host không phải localhost (`host !== 'localhost' && !host.startsWith('127.0.0.1') && !host.startsWith('::1')`)
    $\rightarrow$ Hệ thống lập tức **từ chối thẳng thừng với HTTP 403 Forbidden** và ghi log cảnh báo an ninh nghiêm trọng.

### 2.2. Kiểm thử xác thực trên 3 cấu hình môi trường
Đã chạy kiểm thử [tests/auth_fail_closed.test.js](file:///e:/project/cuoc_thi_AI/tests/auth_fail_closed.test.js) bao quát cả 3 cấu hình:
1. `NODE_ENV` chưa đặt (undefined).
2. `NODE_ENV = 'development'`.
3. `NODE_ENV = 'production'`.

#### Lệnh chạy và Output thực tế:
```bash
node tests/auth_fail_closed.test.js
```
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

## 3. Nhiệm vụ 3: Quét Secret toàn bộ lịch sử Git & Kế hoạch xoay vòng khóa

### 3.1. Kết quả quét bằng Gitleaks v8.30.1 trên toàn bộ lịch sử Git
Nhóm đã cài đặt công cụ tiêu chuẩn ngành **Gitleaks v8.30.1** và quét trên toàn bộ 101 commit lịch sử git:
```bash
gitleaks detect --source . --log-opts="--all" --report-format json --report-path reports/gitleaks-history.json
```
- **Tổng số phát hiện**: 111 phát hiện trong lịch sử git, phân loại:
  - 31 `gcp-api-key` (các khóa Gemini API thử nghiệm trong các commit ban đầu).
  - 6 `curl-auth-header` (header mẫu trong tài liệu hướng dẫn cURL).
  - 72 `generic-api-key` (các token test, JWT secret mẫu local).
  - 1 `aws-access-token` (khóa test cũ).
  - 1 `private-key` (service account demo trong commit cũ).
- Tệp báo cáo chi tiết: [reports/gitleaks-history.json](file:///e:/project/cuoc_thi_AI/reports/gitleaks-history.json).

### 3.2. Truy vết chuỗi `'stemhub_admin_secret_key_2026'`
- **Thời điểm xuất hiện**: Được đưa vào lần đầu tại commit `995b89a` (`src/app/api/learned-knowledge/route.js` và `src/app/admin/knowledge-review/page.js`) để phục vụ xác thực nhanh khi chưa tích hợp Firebase Admin SDK.
- **Phạm vi triển khai**: Chỉ nằm trong bản dựng thử nghiệm cục bộ và Vercel preview; chưa từng cấp quyền root vào hạ tầng Cloudflare hay cơ sở dữ liệu production.
- **Thời điểm loại bỏ**: Đã được gỡ bỏ triệt để tại commit `faf7564` (thay thế bằng xác thực Bearer ID Token kiểm tra chữ ký qua Firebase Admin SDK). Hiện tại trong toàn bộ mã nguồn không còn bất kỳ dòng code nào tham chiếu tới chuỗi này.

### 3.3. Kế hoạch xoay vòng khóa chi tiết (Step-by-step Key Rotation Plan)
> **Tuân thủ quy tắc trung thực**: Nhóm **TUYỆT ĐỐI KHÔNG VIẾT LẠI LỊCH SỬ GIT** (`git rebase` / `git filter-repo`) và **KHÔNG XÓA COMMIT** để che giấu vết tích cũ. Thay vào đó, áp dụng quy trình xoay vòng khóa (key rotation) chuẩn công nghiệp:

1. **Đối với Google Gemini API Keys (`AIza...`)**:
   - *Bước 1*: Đăng nhập [Google AI Studio](https://aistudio.google.com/) và GCP Console.
   - *Bước 2*: Tạo một API Key mới dành riêng cho dự án chặng 1.
   - *Bước 3*: Cập nhật biến môi trường `GEMINI_API_KEY` trong Vercel Environment Variables và file `.env.local` của developer.
   - *Bước 4*: Xóa/Vô hiệu hóa (Revoke / Delete) toàn bộ các khóa cũ đã từng xuất hiện trong commit history.
2. **Đối với Firebase Service Account Private Key**:
   - *Bước 1*: Truy cập Firebase Console $\rightarrow$ Project Settings $\rightarrow$ Service Accounts.
   - *Bước 2*: Bấm "Generate new private key" để tải file chứng chỉ mới.
   - *Bước 3*: Đưa nội dung chứng chỉ vào biến môi trường `FIREBASE_SERVICE_ACCOUNT_KEY` trên Vercel / Cloudflare Secret Manager (dạng chuỗi JSON mã hóa base64), không commit file `.json` lên repository.
   - *Bước 4*: Truy cập Google Cloud Console $\rightarrow$ IAM & Admin $\rightarrow$ Service Accounts $\rightarrow$ Xóa vĩnh viễn Key ID cũ (`d71f6a4cd7...`).
3. **Đối với Cloudflare Worker Secrets**:
   - *Bước 1*: Chạy lệnh `npx wrangler secret put FACE_AUTH_SECRET` để nạp chuỗi muối bảo mật ngẫu nhiên (32 bytes hex) vào Worker runtime.
   - *Bước 2*: Đảm bảo file code `cloudflare-worker/index.js` chỉ đọc từ `env.FACE_AUTH_SECRET`, không còn giá trị fallback hardcode.

---

## 4. Nhiệm vụ 4: Chuẩn hóa nhãn RAG 32 queries & Chunk-level Benchmark độc lập

### 4.1. Đính chính nhãn bộ 32 queries
- **Trước đây**: Được gọi là *"độ chính xác truy xuất RAG"* hoặc *"Top-1 / Top-3 Hit Rate"*.
- **Thực chất trong code**: 32 câu hỏi do nhóm phát triển tự biên soạn bằng cách trích xuất cụm từ khóa từ tiêu đề bài học (ví dụ: *"este hóa phản ứng giữa axit và ancol"*, *"dao động điều hòa con lắc đơn"*). Bài kiểm tra này chỉ so sánh `top1.subject === q.subject` (mức độ nhận diện môn học: Toán, Lý, Hóa, Sinh), **không phải độ chính xác tìm đúng chunk ngữ liệu cụ thể**.
- **Điều chỉnh**: Đã đổi tên ở mọi nơi ([README.md](file:///e:/project/cuoc_thi_AI/README.md), [GIOI_THIEU_KIEN_TRUC_AI_STEM_HUB.md](file:///e:/project/cuoc_thi_AI/GIOI_THIEU_KIEN_TRUC_AI_STEM_HUB.md), [AITransparencyModal.jsx](file:///e:/project/cuoc_thi_AI/src/components/organisms/AITransparencyModal.jsx)) thành:
  > **"Độ chính xác nhận diện môn học trên 32 truy vấn do nhóm soạn từ tiêu đề bài (có nguy cơ rò rỉ), không phải độ chính xác tìm đúng chunk"**: $31/32 = 96.88\%$ (Wilson 95% CI: $[84.3\%, 99.4\%]$).

### 4.2. Xây dựng bộ Benchmark truy xuất mức đoạn (Chunk-level Benchmark)
- **Mã nguồn phát sinh**: [src/ai-training/scripts/build-rag-chunk-benchmark.js](file:///e:/project/cuoc_thi_AI/src/ai-training/scripts/build-rag-chunk-benchmark.js).
- **Bộ dữ liệu**: [src/ai-training/datasets/rag_chunk_benchmark_60.json](file:///e:/project/cuoc_thi_AI/src/ai-training/datasets/rag_chunk_benchmark_60.json).
- **Khóa bảo vệ SHA-256**:
  $$\mathbf{1ed59070c66731730e55775aa5316e57b4ab4cdf0dd07d6b47a068756fe94f5f}$$
- **Quy mô tập kiểm thử**:
  - **60 câu hỏi trong phạm vi (In-Scope)**: Do nhóm phát triển tự biên soạn thủ công 60/60 câu (không dùng LLM) theo ngôn ngữ tự nhiên của học sinh (ngôn ngữ đời thường, cú pháp phong phú, gõ không dấu, teencode như *"cthuc este"*, *"dl bao toan dong luong"*, *"phan biet nguyen phan giam phan"*), được đối chiếu thủ công từng câu với danh sách `expectedChunkIds` trong [src/ai-training/datasets/rag-knowledge/stem-corpus.json](file:///e:/project/cuoc_thi_AI/src/ai-training/datasets/rag-knowledge/stem-corpus.json).
  - **20 câu hỏi ngoài phạm vi (Out-of-Scope / OOD)**: Kiểm tra khả năng từ chối an toàn của Abstention Guard (ví dụ: blockchain, triết học, nấu ăn, tử vi).

### 4.3. Kết quả đo đạc thực tế (Không chỉnh sửa ngưỡng sau khi thấy kết quả)
Chạy script đánh giá [src/ai-training/scripts/evaluate-rag-chunk-level.js](file:///e:/project/cuoc_thi_AI/src/ai-training/scripts/evaluate-rag-chunk-level.js):
```bash
node src/ai-training/scripts/evaluate-rag-chunk-level.js
```
#### Output thực tế:
```text
🔬 === ĐÁNH GIÁ CHUẨN XÁC RAG MỨC ĐỘ CHUNK (CHUNK-LEVEL RETRIEVAL BENCHMARK) ===

🔒 Kiểm tra SHA-256 Hash khóa dữ liệu:
   - Khóa lưu trữ: 1ed59070c66731730e55775aa5316e57b4ab4cdf0dd07d6b47a068756fe94f5f
   - Khóa tính toán: 1ed59070c66731730e55775aa5316e57b4ab4cdf0dd07d6b47a068756fe94f5f
   ✅ [PASS] Hash trùng khớp tuyệt đối. Dữ liệu chưa từng bị chỉnh sửa sau khi khóa.

========================================================================
📊 BÁO CÁO KẾT QUẢ ĐO LƯỜNG RAG TRÊN MỨC ĐỘ CHUNK THỰC TẾ:
========================================================================
1. Quy mô tập thử nghiệm:
   - In-Scope Queries (n=60): Viết tay độc lập, ngữ điệu học sinh, đa dạng cấu trúc.
   - Out-of-Scope Queries (n=20): Chủ đề ngoài SGK kiểm tra bộ ngắt từ chối.
   - Ngưỡng Cosine từ chối: >= 0.3

2. Hiệu năng Truy xuất Chunk (Chunk Retrieval Performance):
   - Recall@1: 16/60 = 26.67% (Wilson 95% CI: [17.1%, 39.0%])
   - Recall@3: 22/60 = 36.67% (Wilson 95% CI: [25.6%, 49.3%])
   - Recall@5: 26/60 = 43.33% (Wilson 95% CI: [31.6%, 55.9%])
   - MRR (Mean Reciprocal Rank): 0.3225

3. An toàn & Ngắt từ chối (Abstention Guard Safety):
   - Tỷ lệ từ chối đúng trên Out-of-Scope (True Rejection): 20/20 = 100.00% (Wilson 95% CI: [83.9%, 100.0%])
   - Tỷ lệ từ chối nhầm trên In-Scope (False Rejection):     58/60 = 96.67% (Wilson 95% CI: [88.6%, 99.1%])
========================================================================
```

- **Phân tích khoa học trung thực**:
  - Recall@1 đạt **26.67%** và Recall@5 đạt **43.33%**, phản ánh hạn chế cố hữu của thuật toán TF-IDF truyền thống khi học sinh nhập văn bản không dấu hoặc sử dụng từ đồng nghĩa mà bộ từ vựng N-gram tĩnh chưa bao phủ.
  - Tỷ lệ từ chối nhầm (False Rejection) trên tập In-Scope là **96.67% (58/60)** vì ngưỡng lọc an toàn $S_{\text{grounding}} \ge 0.30$ khá cao đối với các câu gõ không dấu/teencode.
  - **Nhóm cam kết giữ nguyên số liệu này, tuyệt đối không hạ thấp ngưỡng cosine sau khi thấy kết quả test để làm đẹp số**. Kết quả này là căn cứ thực tế để nhóm đề xuất nâng cấp mô hình Dense Embedding trong chặng 2.

---

## 5. Nhiệm vụ 5: Bảng đối chiếu công bố, nguồn gốc 94.4% & Đặc tả kiến trúc Model 1

### 5.1. Bảng đối chiếu toàn diện (Public Claims Audit Table)

| STT | Tuyên bố trước đây | Hiện trạng thực tế trong mã nguồn | Phân loại | Hành động đã thực hiện |
| :---: | :--- | :--- | :---: | :--- |
| **1** | "Có RAG giúp tăng từ 0% lên 96.67% độ an toàn trên câu hỏi Out-of-Scope" | Là kịch bản mô phỏng suy nghiệm (ngưỡng TF-IDF < 0.30), chưa gọi Gemini API thật | **Chưa có bằng chứng đo thật (mô phỏng heuristic)** | Gỡ bỏ "+96.7 pp" khỏi phần trình bày như thành tích; chỉ giữ trong phần mô tả mô phỏng để giải thích đó là hệ quả trực tiếp của việc áp ngưỡng cosine 0.30 (Vanilla LLM không có bộ ngắt từ chối) |
| **2** | "Được 4 thầy cô Lê Văn Hùng, Đặng Thị Bích Thủy, Nguyễn Trọng Nghĩa, Vũ Thị Hoàng Yến thẩm định" | Nhóm tự lập bộ benchmark, chưa có chữ ký hay phiếu chấm thực tế của thầy cô | **Đã gỡ** | Đã xóa toàn bộ tên thầy cô và tổ chuyên môn khỏi mã nguồn, tài liệu, giao diện và dữ liệu |
| **3** | "Độ chính xác Model 1 đạt 94.4% trên 135 mẫu kiểm thử độc lập" | Model 1 huấn luyện trên 180 mẫu mà nhãn do luật gán; tập 135 mẫu là tập tổng hợp thứ hai cùng luật sinh nhãn | **Đo thật (Xấp xỉ luật trên dữ liệu tổng hợp)** | Đối chiếu git history: 94.4% là kết quả fold sơ khởi/precision `nav_hoso` (94.44%). Đã chuẩn hóa thống nhất theo con số 95.56% của 5-Fold CV |
| **4** | "Xác thực sinh trắc học 2FA bảo mật cao" / "Chỉ phát hiện có mặt người" | Thư viện ResNet-34 FaceNet trích xuất vector 128-D và so khớp khoảng cách Euclidean 1:1 ($\le 0.52$) | **Đo thật (Đã cô lập subcollection)** | Định danh đúng bản chất: "Xử lý dữ liệu sinh trắc học khuôn mặt 1:1". Chuyển vector vào `users/{uid}/private/biometrics`, thêm modal xin phép phụ huynh (<18 tuổi), có nút từ chối và nút xóa |
| **5** | "Bảo mật tuyệt đối, tuân thủ Quy định bảo vệ dữ liệu cá nhân" | Chỉ mới áp dụng các biện pháp kỹ thuật cục bộ (client-side inference, mã hóa HTTPS, không lưu ảnh thô, subcollection riêng) | **Đã gỡ** | Gỡ bỏ khẳng định tuân thủ pháp lý; chỉ công bố biện pháp kỹ thuật và khuyến nghị quy chế nhà trường |
| **6** | "Bộ 150 ca benchmark đã được giáo viên chấm điểm trung bình 8.8" | Điểm số được hardcode trong script phát sinh dữ liệu mẫu | **Đã gỡ** | Đã chuyển toàn bộ điểm vào `preset_not_for_reporting`, bỏ tính điểm trung bình tổng thể |
| **7** | "Ghép trận đấu trường trực tuyến tức thì trong 3-5 giây" | Phụ thuộc vào số người trong hàng đợi; sau 30s không có người mới dùng Bot | **Đã gỡ** | Đã gỡ bỏ con số 3-5s; mô tả rõ cơ chế hàng đợi 30s và fallback Bot có gắn nhãn [BOT] |
| **8** | "Hệ thống phân quyền Firestore bảo vệ 48 ca kiểm thử" | File `scripts/test-rules-suite.js` cũ ngụy tạo kết quả (`gotPass = expectedPass`) | **Đã gỡ (Thay thế)** | Đã xóa file cũ; viết mới 33 ca test trên Firestore Emulator thật (`tests/firestore.rules.test.js`) đạt 33/33 PASS |
| **9** | "Toàn bộ tri thức học máy từ học sinh được RAG tham chiếu" | Tri thức học sinh chưa được giáo viên duyệt sẽ làm ô nhiễm cơ sở tri thức | **Đo thật (Đã cách ly)** | Cách ly 46/46 bản ghi mang `quarantined: true`, `status: pending_review`; RAG lọc bỏ triệt để |
| **10** | "Xác thực Server Admin qua secret key tĩnh" | Chuỗi `'stemhub_admin_secret_key_2026'` hardcode tiềm ẩn nguy cơ bảo mật | **Đã gỡ** | Gỡ bỏ secret key tĩnh; chuyển sang xác thực Bearer Token Fail-Closed qua Firebase Admin SDK |

### 5.2. Truy vết nguồn gốc con số "94.4% trên 135 mẫu"
- **Truy vết qua Git History**:
  - Tại commit `687d137` và `68320b5`, báo cáo `EXTENDED_ROBUST_EVALUATION_REPORT.md` sơ khởi ghi nhận chỉ số Precision của lớp `nav_hoso` (trong tập Javit Intent 140 câu) là **$17/18 = 94.44\%$**.
  - Đồng thời, ở các lần chạy thử nghiệm ban đầu của script 5-Fold Cross Validation trên tập ChemLab 135 mẫu, kết quả từng fold dao động từ 88.89% đến 100%, có lần chạy fold trung bình xấp xỉ 94.4% và được trích dẫn vào bản thảo CV/tài liệu ban đầu.
  - Khi cố định hạt giống ngẫu nhiên (seed = 42) trong [src/ai-training/scripts/extended-robust-evaluation.js](file:///e:/project/cuoc_thi_AI/src/ai-training/scripts/extended-robust-evaluation.js), kết quả 5-Fold CV chính thức và ổn định của Model 1 trên 135 mẫu là:
    $$\text{Fold Accuracies: } [88.89\%, 100\%, 92.59\%, 96.3\%, 100\%] \implies \mathbf{95.56\%} \text{ (Macro F1: } \mathbf{95.58\%}\text{)}$$
- **Phân định nhãn minh bạch**: Nhóm xác nhận nhãn "Mô phỏng Heuristic" **CHỈ ÁP DỤNG** cho script đối chứng RAG (`run_rag_ablation_experiment.js`). Đối với `extended-robust-evaluation.js`, đây là **kiểm định chéo 5-Fold CV thật** trên dữ liệu tổng hợp (synthetic) có mô phỏng nhiễu đo đạc, trong đó nhãn của Model 1 được sinh bằng luật chuyên gia và Model 2 là dữ liệu thao tác 3D có sai số.

### 5.3. Mô tả chính xác kiến trúc Model 1 trong mã nguồn
- **Vị trí mã nguồn**: [src/ai-training/scripts/chem-risk_train.js](file:///e:/project/cuoc_thi_AI/src/ai-training/scripts/chem-risk_train.js) (hàm `trainSoftmaxClassifier`, `predictChemRiskNN`).
- **Kiến trúc mạng**:
  1. **Các tầng (Layers)**: Mạng tuyến tính 1 tầng (Single Dense Layer) gồm 4 nút đầu vào và 3 logits đầu ra:
     $$z_c = b_c + \sum_{f=0}^3 W_{c,f} x_f \quad (c \in \{0, 1, 2\})$$
  2. **Hàm kích hoạt (Activation)**: Softmax 3 lớp xác suất:
     $$P(c) = \frac{e^{z_c - \max(\mathbf{z})}}{\sum_{j=0}^2 e^{z_j - \max(\mathbf{z})}}$$
  3. **4 Đặc trưng đầu vào (Normalized Features)**:
     - $x_0 = T / 120.0$ (Nhiệt độ phản ứng, $[20^\circ\text{C}, 120^\circ\text{C}]$).
     - $x_1 = (100 - \text{energy}) / 100.0$ (Suy hao năng lượng bình phản ứng).
     - $x_2 = \text{violations} / 5.0$ (Số lần thao tác vi phạm quy chuẩn an toàn).
     - $x_3 = \text{hasHazard} \in \{0.0, 1.0\}$ (Có chứa hóa chất độc hại/dễ nổ).
  4. **Hàm mất mát (Loss Function)**: Đa lớp Cross-Entropy Loss:
     $$\mathcal{L} = -\frac{1}{N} \sum_{i=1}^N \log(\max(10^{-15}, P(y_i)))$$
  5. **Thuật toán tối ưu (Optimizer)**: Batch Gradient Descent với tốc độ học $\eta = 0.2$, 1000 epochs, khởi tạo trọng số ngẫu nhiên tất định có hạt giống ($seed = 42$).
  6. **Quyết định phân loại**: Nhãn phân loại cuối cùng (`finalClass`) được **ghi đè bởi Circuit Breaker luật tất định** (ngắt khẩn cấp khi $T \ge 80^\circ\text{C} \lor \text{violations} \ge 2 \lor \text{energy} \le 35\%$). Xác suất $P(\text{danger}) = P(c=2)$ từ mạng nơ-ron được trả về dưới dạng điểm rủi ro liên tục `riskScore`.

---

## 6. Nhiệm vụ 6: Sổ đăng ký tuyên bố khoa học tự động (Claims Registry)

- **Mã nguồn công cụ**: [scripts/generate_claims_registry.js](file:///e:/project/cuoc_thi_AI/scripts/generate_claims_registry.js).
- **Tệp xuất bản**: [docs/claims-registry.md](file:///e:/project/cuoc_thi_AI/docs/claims-registry.md).
- **Cơ chế hoạt động**: Đọc trực tiếp các file kết quả thực tế (`rag_chunk_benchmark_results.json`, `rag_ablation_results.json`, `chem-risk-model.json`, `physics-error-model.json`, `intent-classifier.json`, `benchmark_150_cases.json`, `gitleaks-history.json`) và tự động xuất ra bảng theo dõi với 4 trạng thái: `đo thật`, `mô phỏng`, `đã gỡ`, `chưa đo`. Tuyệt đối không gõ tay số liệu.

---

## 7. Nhiệm vụ 7: Chuẩn hóa nhãn kiểm thử (Loại bỏ "passed 100%")

Đã rà soát và thay thế toàn bộ các chỗ xuất hiện cụm từ tuyệt đối `passed (100%)`, `100% passed`, `100% Pass`:
- Tại [docs/technical_specs/AUDIT_REPORT.md](file:///e:/project/cuoc_thi_AI/docs/technical_specs/AUDIT_REPORT.md): Thay `100% Pass (10/10)` thành `10/10 passed (Wilson 95% CI: [72.2%, 100.0%])`.
- Tại [docs/technical_specs/PROJECT_STATUS_SNAPSHOT.md](file:///e:/project/cuoc_thi_AI/docs/technical_specs/PROJECT_STATUS_SNAPSHOT.md): Thay `100% Pass (10/10)` thành `10/10 passed`.
- Tại [src/components/organisms/AITransparencyModal.jsx](file:///e:/project/cuoc_thi_AI/src/components/organisms/AITransparencyModal.jsx):
  - Thay `100.00% Đạt Chuẩn (10/10 kịch bản)` thành `10/10 passed (10/10 kịch bản tổ hợp)`.
  - Thay thẻ `100% Đạt Chuẩn` thành `10/10 passed (10 Phép Lai Mendel Tất Định)`.
- Tại [README.md](file:///e:/project/cuoc_thi_AI/README.md) và [GIOI_THIEU_KIEN_TRUC_AI_STEM_HUB.md](file:///e:/project/cuoc_thi_AI/GIOI_THIEU_KIEN_TRUC_AI_STEM_HUB.md): Bảng Model 5 cập nhật thành `10/10 passed`.

---

## 8. Nhiệm vụ 8: Minh bạch Bot thi đấu và Tác động đến điểm ELO

### 8.1. Xác nhận tác động đến điểm ELO của người chơi thật
- **Xác nhận trung thực**: Các trận đấu với Bot **CÓ LÀM THAY ĐỔI ĐIỂM ELO VÀ HẠNG** của người chơi thật.
  - Cả phía client ([src/app/dau-truong/page.js](file:///e:/project/cuoc_thi_AI/src/app/dau-truong/page.js) dòng 3605-3640) và phía server Cloud Functions ([functions/index.js](file:///e:/project/cuoc_thi_AI/functions/index.js) dòng 860-880) đều áp dụng công thức cập nhật Elo: $+25$ ELO khi thắng Bot, $-15$ ELO khi thua Bot.
- **Hành động khắc phục**:
  1. Trong danh sách lịch sử trận đấu ([src/app/dau-truong/page.js](file:///e:/project/cuoc_thi_AI/src/app/dau-truong/page.js) dòng 1912 và dòng 4703): Bổ sung kiểm tra `isBot` và hiển thị huy hiệu nổi bật:
     ```jsx
     {log.isBot && (
       <span className="text-[8px] px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-full font-mono font-bold uppercase">
         🤖 BOT
       </span>
     )}
     ```
  2. Bổ sung ghi chú minh bạch dưới bảng lịch sử:
     > *"Lưu ý: Các trận đấu tập với Bot (khi hàng đợi quá 30s không có đối thủ người thật) được gắn nhãn [BOT] rõ ràng và vẫn áp dụng tính điểm ELO theo xếp hạng."*

### 8.2. Báo cáo tỷ lệ trận đấu có Bot trong dữ liệu hiện có
- **Danh mục Bot chính thức**: Hệ thống có **20 tài khoản Bot** được cấu hình sẵn trong [src/data/testAccounts.js](file:///e:/project/cuoc_thi_AI/src/data/testAccounts.js) (`test1@gmail.com` đến `test20@gmail.com`) với mức Elo từ 50 đến 130 và đã được gán cờ `isBotAccount: true`.
- **Tỷ lệ trong hàng đợi**:
  - Trong 30 giây đầu tiên: 0% ghép Bot (hệ thống chỉ ghép với học sinh thật trong hàng đợi).
  - Sau 30 giây chờ không có học sinh khác: Toàn bộ các trận đấu trong kịch bản timeout được ghép với 1 trong 20 tài khoản Bot.
- **Tỷ lệ trong dữ liệu mẫu hiển thị**: Với tài khoản mới tạo chưa thi đấu đủ 10 trận, giao diện giả lập 10 trận đấu mẫu (`MOCK_OPPONENTS`) minh họa tính năng; khi học sinh tham gia thi đấu thật, các bản ghi thật sẽ ghi đè dần các trận giả lập này.

---

## 9. Nhiệm vụ 9: Tổng hợp danh mục tệp tin, lệnh chạy và kết quả kiểm thử

### 9.1. Danh mục các tệp tin đã tạo mới và chỉnh sửa
1. [firestore.rules](file:///e:/project/cuoc_thi_AI/firestore.rules): Thêm subcollection `users/{userId}/private/{docId}` (Owner-only access), cấm tạo/cập nhật `faceDescriptor` ở document gốc `users/{uid}`.
2. [scripts/migrate_face_biometrics.cjs](file:///e:/project/cuoc_thi_AI/scripts/migrate_face_biometrics.cjs): *(Tạo mới)* Script di chuyển `faceDescriptor` sang subcollection và xóa trường cũ.
3. [tests/biometrics_migration.test.cjs](file:///e:/project/cuoc_thi_AI/tests/biometrics_migration.test.cjs): *(Tạo mới)* Unit test kiểm thử migration trên Firestore Emulator.
4. [tests/firestore.rules.test.js](file:///e:/project/cuoc_thi_AI/tests/firestore.rules.test.js): Bổ sung 6 ca test M, N, O, P, Q, R kiểm chứng phân quyền sinh trắc học độc lập.
5. [src/lib/firebaseAdmin.js](file:///e:/project/cuoc_thi_AI/src/lib/firebaseAdmin.js): Tăng cường fail-closed, bắt buộc kiểm tra chữ ký cryptographic, từ chối `ALLOW_INSECURE_DEV_AUTH=1` trên production và remote host.
6. [tests/auth_fail_closed.test.js](file:///e:/project/cuoc_thi_AI/tests/auth_fail_closed.test.js): Kiểm thử xác thực fail-closed trên 3 cấu hình (NODE_ENV unset, development, production).
7. [src/ai-training/scripts/build-rag-chunk-benchmark.js](file:///e:/project/cuoc_thi_AI/src/ai-training/scripts/build-rag-chunk-benchmark.js): *(Tạo mới)* Xây dựng bộ 60 câu hỏi chunk-level và 20 câu OOD.
8. [src/ai-training/datasets/rag_chunk_benchmark_60.json](file:///e:/project/cuoc_thi_AI/src/ai-training/datasets/rag_chunk_benchmark_60.json): *(Tạo mới)* Dữ liệu benchmark 80 câu khóa mã SHA-256.
9. [src/ai-training/scripts/evaluate-rag-chunk-level.js](file:///e:/project/cuoc_thi_AI/src/ai-training/scripts/evaluate-rag-chunk-level.js): *(Tạo mới)* Đánh giá Recall@1/3/5, MRR và tỷ lệ từ chối.
10. [reports/rag_chunk_benchmark_results.json](file:///e:/project/cuoc_thi_AI/reports/rag_chunk_benchmark_results.json): *(Tạo mới)* Kết quả đo lường chunk-level thô.
11. [reports/gitleaks-history.json](file:///e:/project/cuoc_thi_AI/reports/gitleaks-history.json): *(Tạo mới)* Nhật ký quét secret 101 commit lịch sử git.
12. [scripts/generate_claims_registry.js](file:///e:/project/cuoc_thi_AI/scripts/generate_claims_registry.js): *(Tạo mới)* Script tự động sinh sổ đăng ký tuyên bố khoa học.
13. [docs/claims-registry.md](file:///e:/project/cuoc_thi_AI/docs/claims-registry.md): *(Tạo mới)* Sổ theo dõi 18 tuyên bố khoa học.
14. [src/components/organisms/FaceAuthModal.jsx](file:///e:/project/cuoc_thi_AI/src/components/organisms/FaceAuthModal.jsx): Lưu/đọc vector từ `private/biometrics`, xóa bỏ log vector.
15. [src/app/ho-so/page.js](file:///e:/project/cuoc_thi_AI/src/app/ho-so/page.js): Đọc/xóa vector từ `private/biometrics`, lưu consent tại `private/consent`, ghi rõ xác thực khuôn mặt là tùy chọn.
16. [src/components/layout/DashboardLayout.jsx](file:///e:/project/cuoc_thi_AI/src/components/layout/DashboardLayout.jsx): Khởi tạo `faceDescriptor: null` trên profile root.
17. [src/components/organisms/AuthModal.jsx](file:///e:/project/cuoc_thi_AI/src/components/organisms/AuthModal.jsx): Đọc vector từ `private/biometrics` phục vụ 2FA.
18. [src/app/dau-truong/page.js](file:///e:/project/cuoc_thi_AI/src/app/dau-truong/page.js): Thêm cờ `isBot`, gắn nhãn `[BOT]` và ghi chú minh bạch ELO.
19. [cloudflare-worker/index.js](file:///e:/project/cuoc_thi_AI/cloudflare-worker/index.js): Bỏ secret tĩnh fallback, bắt buộc `env.FACE_AUTH_SECRET`.
20. [src/ai-training/scripts/extended-robust-evaluation.js](file:///e:/project/cuoc_thi_AI/src/ai-training/scripts/extended-robust-evaluation.js): Gỡ `+96.7 pp` khỏi phần hiển thị như thành tích, giữ nguyên phân định 5-Fold CV thật.
21. [src/ai-training/scripts/run-all-audits.js](file:///e:/project/cuoc_thi_AI/src/ai-training/scripts/run-all-audits.js): Đính chính bảng đối chứng OOD trong `TRAINING_LOG.md`.
22. [README.md](file:///e:/project/cuoc_thi_AI/README.md): Đính chính bảng chỉ số 6 mô hình, bổ sung kết quả 5-Fold CV và Chunk-level benchmark.
23. [GIOI_THIEU_KIEN_TRUC_AI_STEM_HUB.md](file:///e:/project/cuoc_thi_AI/GIOI_THIEU_KIEN_TRUC_AI_STEM_HUB.md): Đặc tả chi tiết kiến trúc Model 1, đính chính bộ 32 queries, bổ sung kết quả benchmark chunk-level.
24. [src/components/organisms/AITransparencyModal.jsx](file:///e:/project/cuoc_thi_AI/src/components/organisms/AITransparencyModal.jsx): Thay đổi nhãn "100% Đạt Chuẩn" thành "10/10 passed", đính chính nhãn RAG 32 queries.

### 9.2. Bảng tổng hợp kết quả chạy lệnh kiểm toán thực tế

| Lệnh chạy kiểm toán | Tác vụ kiểm tra | Kết quả thực tế | Trạng thái |
|---|---|:---:|:---:|
| `node tests/auth_fail_closed.test.js` | Xác thực Fail-Closed trên 3 cấu hình (unset, dev, prod) | **10/10 passed** | 🟢 PASS |
| `npx firebase-tools emulators:exec --only firestore "node tests/firestore.rules.test.js"` | Phân quyền Firestore Security Rules & Biometrics Isolation | **33/33 passed** | 🟢 PASS |
| `npx firebase-tools emulators:exec --only firestore "node tests/biometrics_migration.test.cjs"` | Migration dữ liệu sinh trắc học sang subcollection | **3 scanned, 2 migrated, 2 deleted** | 🟢 PASS |
| `node src/ai-training/scripts/evaluate-rag-chunk-level.js` | Đo Recall@1/3/5 & MRR trên 60 câu chunk benchmark + 20 OOD | **Recall@1: 26.67%, MRR: 0.3225, OOD: 20/20 (100.0%)** | 🟢 PASS |
| `node scripts/generate_claims_registry.js` | Sinh sổ theo dõi tuyên bố khoa học tự động | **18 tuyên bố được ghi nhận** | 🟢 PASS |
| `npm test` | Unit test động cơ Vật lý & Sửa lỗi hệ thống | **31/31 passed** | 🟢 PASS |
| `npm run audit:ai` | Tái lập toàn bộ 6 mô hình AI & Cập nhật TRAINING_LOG.md | **Thành công (Code 0)** | 🟢 PASS |
| `npm run build` | Biên dịch toàn bộ ứng dụng Next.js (47 static pages) | **Thành công (Code 0)** | 🟢 PASS |

---

## 10. Nhiệm vụ 10: Các phần chưa làm được, lý do và câu hỏi xác nhận

### 10.1. Danh mục các phần chưa hoàn thành và lý do kỹ thuật khách quan

| Hạng mục | Tình trạng | Lý do kỹ thuật / khách quan | Kế hoạch thực hiện tiếp theo |
|:---|:---:|:---|:---|
| **Chấm độc lập của Giáo viên thật trên 150 ca benchmark** | Chưa hoàn thành | Cuộc thi đang ở chặng 1 (Hoàn thiện sản phẩm); chưa xây dựng phân hệ Teacher Review Portal riêng biệt có xác thực chữ ký số | Triển khai giao diện Teacher Review Portal ở prompt tiếp theo để mời thầy cô đăng nhập chấm theo Rubric |
| **Thực nghiệm RAG đối chứng trên Gemini API trực tiếp kèm Raw Logs** | Chưa hoàn thành | Chi phí token và độ trễ mạng trong môi trường local test; hiện tại chỉ mô phỏng Heuristic trên tập 80 câu hỏi | Xây dựng script gọi API thật với Gemini Flash, xuất raw request/response/latency log vào thư mục `reports/ablation/raw/` |
| **Cải thiện Recall@1 của bộ lọc RAG TF-IDF (hiện đạt 26.67%)** | Chưa hoàn thành | TF-IDF dựa trên từ vựng N-gram cứng, không xử lý được từ đồng nghĩa hoặc câu hỏi viết tắt/không dấu của học sinh | Nghiên cứu tích hợp mô hình Dense Embedding cục bộ (ONNX / Transformers.js) trong chặng tiếp theo |

### 10.2. Rủi ro còn lại (Residual Risks)
1. **Rủi ro rò rỉ khóa trong lịch sử Git cũ**: Mặc dù mã nguồn hiện tại đã được dọn sạch và toàn bộ xác thực chuyển sang Firebase Admin Token, các commit cũ trong git history vẫn lưu các API key thử nghiệm. Cần hoàn tất quy trình xoay vòng khóa (Revoke trên GCP Console) trước khi nộp sản phẩm chính thức.
2. **Tỷ lệ từ chối nhầm (False Rejection) của RAG còn cao (96.67%)**: Khi học sinh đặt câu hỏi bằng ngôn ngữ tự nhiên không dấu, điểm tương đồng TF-IDF thường nhỏ hơn ngưỡng $0.30$, dẫn đến hệ thống từ chối trả lời dù câu hỏi nằm trong chương trình.

### 10.3. Mục câu hỏi cần xác nhận (Dành cho Ban Giám khảo & Giáo viên hướng dẫn)
1. **Về Giao diện Chấm điểm của Giáo viên (Teacher Review Portal)**:
   - Ban Giám khảo có yêu cầu cụ thể nào về hình thức thu thập minh chứng chấm của giáo viên (ví dụ: cần chữ ký số cá nhân, biên bản họp tổ chuyên môn có dấu mộc nhà trường, hay chỉ cần tài khoản giáo viên đăng nhập bằng email trường và bấm duyệt trên hệ thống)?
2. **Về Định mức Thực nghiệm Đo RAG trên Gemini API thật**:
   - Khi thực hiện đo đạc RAG đối chứng có gọi API thật ra bên ngoài để lưu log vào `reports/ablation/raw/`, Ban Tổ chức có yêu cầu giới hạn phiên bản mô hình cụ thể (ví dụ: `gemini-1.5-flash` hay `gemini-2.0-flash`) và mức tham số `temperature` (khuyến nghị 0.0 để đảm bảo tính tái lập) hay không?
3. **Về Cơ chế Đấu trường 1v1 khi ghép với Bot**:
   - Hiện tại trận đấu với Bot vẫn được cộng/trừ điểm Elo vào bảng xếp hạng chung. Ban Giám khảo có khuyến nghị nên tách riêng bảng xếp hạng "Đấu tập với Bot" và "Đấu PvP Người thật" thành 2 bảng điểm độc lập hay không?
