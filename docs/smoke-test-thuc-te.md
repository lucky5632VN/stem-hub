# 🧪 HƯỚNG DẪN KIỂM THỬ THỰC TẾ TRÊN MÔI TRƯỜNG TRIỂN KHAI (SMOKE TEST RUNBOOK)
## DỰ ÁN STEM HUB — TÀI LIỆU NỘI BỘ VẬN HÀNH & HẬU KIỂM DEPLOY

> **Lưu ý phương pháp luận**: Toàn bộ các bộ test tự động (`npm test`) trong mã nguồn chạy trên môi trường giả lập (Firestore Emulator và Mock JWT Token). Để đảm bảo hệ thống vận hành đúng sau khi triển khai lên Cloud (Vercel / Cloudflare / Firebase), kỹ sư vận hành bắt buộc thực hiện kiểm thử thực tế (Smoke Test) theo 7 kịch bản dưới đây bằng tài khoản thật và token thật.

---

### Kịch Bản 1: Đăng Nhập Quản Trị Viên (Admin Privilege Verification)
* **Mục tiêu**: Xác nhận Admin truy cập được trang quản trị và Custom Claims hoạt động chuẩn.
* **Các bước thử**:
  1. Đăng nhập bằng tài khoản Admin đã được cấp claim qua script `scripts/grant_admin_role.cjs --execute`.
  2. Mở trình duyệt, truy cập `https://ai.stem-hub.top/admin`.
  3. Mở DevTools Network: Kiểm tra request tới `/api/admin/...` trả về mã `200 OK` (token chứa claim `admin: true`).
  4. Thử đăng xuất và đăng nhập bằng tài khoản học sinh thông thường: Truy cập `/admin` $\rightarrow$ Bị chặn chuyển hướng về `/` hoặc báo lỗi `403 Forbidden`.

---

### Kịch Bản 2: Phân Quyền Giáo Viên & Cổng Thẩm Định (Teacher Review Portal)
* **Mục tiêu**: Giáo viên Toán chỉ truy cập được câu hỏi Toán, không thể truy cập môn khác.
* **Các bước thử**:
  1. Đăng nhập bằng tài khoản Giáo viên được cấp claim môn Toán (`reviewerType: 'teacher'`, `subjects: ['toan']`).
  2. Truy cập `https://ai.stem-hub.top/danh-gia-chuyen-mon`.
  3. Kiểm tra nhãn vai trò: Hiển thị "Giáo viên thẩm định độc lập: Môn Toán".
  4. Bấm chọn tab môn "Vật lý" hoặc "Hóa học": Nút bị vô hiệu hóa (disabled).
  5. Nếu cố tình gửi request API: `GET /api/reviews/samples?subject=ly` $\rightarrow$ Server trả về `403 Forbidden: Bạn chỉ được cấp quyền thẩm định môn [toan]`.

---

### Kịch Bản 3: Đăng Ký Tài Khoản Mới & Chặn Leo Thang Đặc Quyền (Privilege Escalation Prevention)
* **Mục tiêu**: Người dùng mới không thể tự phong Admin khi tạo tài khoản.
* **Các bước thử**:
  1. Mở cửa sổ ẩn danh, đăng ký tài khoản mới bằng Email/Password.
  2. Mở Console trình duyệt hoặc dùng Postman/Curl: Cố tình ghi vào Firestore document `users/{uid}` với dữ liệu: `{ role: 'admin', reviewerType: 'teacher' }`.
  3. Kết quả mong đợi: Firestore Security Rules từ chối ngay lập tức (`PERMISSION_DENIED`). Document chỉ chấp nhận các trường cho phép (`displayName`, `avatarUrl`, `grade`) với `role: 'student'`.

---

### Kịch Bản 4: Hỏi Đáp Trợ Lý AI Có Căn Cứ & Cảnh Báo Thiếu Nguồn (Grounding & Abstention)
* **Mục tiêu**: Kiểm tra RAG trích dẫn đúng trang SGK và từ chối câu ngoài phạm vi.
* **Các bước thử**:
  1. Vào Phòng thí nghiệm ảo hoặc Trợ lý học tập.
  2. **Thử câu trong phạm vi SGK**: *"Cực trị của hàm số y = |x^3 - 3x^2 + 2|"*  
     $\rightarrow$ Trợ lý phản hồi đáp số 5 cực trị, kèm trích dẫn ngữ liệu SGK Toán 12.
  3. **Thử câu ngoài phạm vi GDPT 2018**: *"Giải phương trình Navier-Stokes siêu thanh"* hoặc *"Hôm nay giá vàng bao nhiêu"*  
     $\rightarrow$ Trợ lý kích hoạt cờ cảnh báo màu vàng: *"Nội dung này nằm ngoài phạm vi SGK chuẩn GDPT 2018..."* và từ chối đưa ra kết luận thiếu căn cứ.

---

### Kịch Bản 5: Phòng Thí Nghiệm Ảo & Chẩn Đoán Lỗi Thao Tác (Virtual Lab ML Diagnostic)
* **Mục tiêu**: Kiểm tra mô hình máy học chẩn đoán lỗi cục bộ và cơ chế bảo vệ an toàn.
* **Các bước thử**:
  1. Truy cập Phòng thí nghiệm Hóa học ảo (ChemLab).
  2. Tăng nhiệt độ phản ứng lên 90°C và giảm năng lượng làm mát dưới 30%:
     - Thanh trượt rủi ro Softmax NN tăng lên mức đỏ (Nguy hiểm).
     - Khi phát hiện vi phạm an toàn, Circuit Breaker cứng ngắt nguồn cấp nhiệt và hiển thị khuyến nghị an toàn.
  3. Truy cập Lab Quang học (Physics Lab): Xoay lăng kính lệch góc 20° $\rightarrow$ Mô hình k-NN nhận diện sai số góc tới và gợi ý điều chỉnh góc về tia tới chuẩn.

---

### Kịch Bản 6: Đấu Trường Trí Tuệ & Tính Điểm Elo Chống Gian Lận (PvP Arena Anti-Cheat)
* **Mục tiêu**: Chống chuyển tab gian lận và tính toán Elo an toàn phía Server.
* **Các bước thử**:
  1. Vào Đấu trường 1v1 bằng 2 tài khoản trên 2 trình duyệt khác nhau.
  2. Bắt đầu trận đấu: Chuyển tab sang cửa sổ khác $\rightarrow$ Hệ thống ghi nhận `tabSwitches` tăng lên.
  3. Nếu chuyển tab quá 3 lần: Trận đấu tự động xử thua do vi phạm nội quy.
  4. Điểm xếp hạng Elo được tính toán lại an toàn và cập nhật qua Firestore Rules kiểm soát giới hạn delta $\le 32$ điểm/trận.

---

### Kịch Bản 7: Tác Vụ Kiểm Tra Đáp Án Môn Toán Cho Giáo Viên (`/danh-gia-chuyen-mon/kiem-dap-an`)
* **Mục tiêu**: Giáo viên Toán đối soát bộ 33 câu Toán trong answer key và gửi ý kiến vào collection riêng `teacher_answer_key_reviews`.
* **Các bước thử**:
  1. Đăng nhập tài khoản Giáo viên Toán, truy cập `/danh-gia-chuyen-mon/kiem-dap-an`.
  2. Bấm "Tải Bản In CSV": Tệp CSV UTF-8 tải về máy, mở trong Excel hiển thị chuẩn tiếng Việt không lỗi font.
  3. Tích chọn "Đồng ý" hoặc "Không đồng ý", điền ghi chú chuyên môn cho 2 câu bất kỳ.
  4. Bấm "Gửi Phiếu Thẩm Định Đáp Án".
  5. Kiểm tra thông báo: Hiển thị mã phiếu thành công (`teacher_answer_key_reviews`).
  6. Kiểm tra quyền tác giả: Dữ liệu này được lưu trữ độc lập, không tự ý thay đổi file hash `dataset_hash.json` trừ khi tác giả nghiên cứu đối soát văn bản và ký xác nhận.

---

### Kịch Bản 8: Hậu Kiểm Bảo Mật API Sau Triển Khai (Fail-Closed & Claims-Only Verification)
* **Mục tiêu**: Đảm bảo toàn bộ các route bảo mật trên môi trường production hoạt động theo cơ chế Fail-Closed và Claims-Only nghiêm ngặt, chống timing-attack và từ chối mọi hình thức bypass bằng secret chia sẻ.

#### 8.1. Kiểm thử Route Nạp Tri Thức (`POST /api/learned-knowledge`):
* **Yêu cầu an toàn**: Đã loại bỏ hoàn toàn khóa chia sẻ `INTERNAL_AI_SECRET`. Bắt buộc xác thực người dùng bằng Firebase Bearer ID Token. Mọi tri thức nộp từ học sinh mặc định mang `status: 'pending_review'`, `teacherVerified: false`, không được tự động duyệt vào RAG.
1. **Thiếu header `Authorization` (hoặc không có token)**:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" -X POST https://ai.stem-hub.top/api/learned-knowledge \
     -H "Content-Type: application/json" \
     -d '{"query":"Thực nghiệm test","answer":"Nội dung kiểm thử bảo mật"}'
   # Kết quả kỳ vọng: 401 Unauthorized
   ```
2. **Token giả mạo hoặc hết hạn**:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" -X POST https://ai.stem-hub.top/api/learned-knowledge \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer fake_or_expired_token_xyz" \
     -d '{"query":"Thực nghiệm test","answer":"Nội dung kiểm thử bảo mật"}'
   # Kết quả kỳ vọng: 401 Unauthorized
   ```
3. **Token học sinh hợp lệ**:
   ```bash
   curl -s -X POST https://ai.stem-hub.top/api/learned-knowledge \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <STUDENT_ID_TOKEN>" \
     -d '{"query":"Hỏi bài quang hình","answer":"Thấu kính hội tụ cho ảnh thật"}'
   # Kết quả kỳ vọng: 200 OK kèm payload { success: true, item: { status: 'pending_review', teacherVerified: false } }
   ```

#### 8.2. Kiểm thử Route Quản Trị Viên (`PATCH /api/learned-knowledge`, `POST /api/contact/reply`, `GET /api/ai-reasoning-log`):
* **Yêu cầu an toàn**: Chỉ chấp nhận Bearer ID token có Custom Claims `admin: true` (hoặc `reviewerType: teacher` đối với duyệt tri thức). Đã loại bỏ hoàn toàn cơ chế dùng shared secret trên các route này.
1. **Không có token (No Authorization header)**:
   ```bash
   # Route xem nhật ký suy luận AI
   curl -s -o /dev/null -w "%{http_code}\n" -X GET https://ai.stem-hub.top/api/ai-reasoning-log
   # Kết quả kỳ vọng: 401 Unauthorized

   # Route duyệt tri thức
   curl -s -o /dev/null -w "%{http_code}\n" -X PATCH https://ai.stem-hub.top/api/learned-knowledge \
     -H "Content-Type: application/json" -d '{"id":"test","action":"approve"}'
   # Kết quả kỳ vọng: 401 Unauthorized

   # Route phản hồi liên hệ
   curl -s -o /dev/null -w "%{http_code}\n" -X POST https://ai.stem-hub.top/api/contact/reply \
     -H "Content-Type: application/json" -d '{"contactId":"test","replyText":"test"}'
   # Kết quả kỳ vọng: 401 Unauthorized
   ```
2. **Token của Học sinh thông thường (Không có Claims admin/teacher)**:
   ```bash
   STUDENT_TOKEN="<ID_TOKEN_HỌC_SINH_LẤY_TỪ_CLIENT>"
   curl -s -o /dev/null -w "%{http_code}\n" -X GET https://ai.stem-hub.top/api/ai-reasoning-log \
     -H "Authorization: Bearer $STUDENT_TOKEN"
   # Kết quả kỳ vọng: 403 Forbidden
   ```
3. **Token của Quản trị viên (Có Claims `admin: true`)**:
   ```bash
   ADMIN_TOKEN="<ID_TOKEN_ADMIN_ĐƯỢC_CẤP_CLAIMS>"
   curl -s -o /dev/null -w "%{http_code}\n" -X GET https://ai.stem-hub.top/api/ai-reasoning-log \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   # Kết quả kỳ vọng: 200 OK
   ```

