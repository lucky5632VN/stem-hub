# 📋 BÁO CÁO ĐÁNH GIÁ RỦI RO & ĐIỀU KHOẢN DỊCH VỤ GOOGLE GEMINI API
## DỰ ÁN STEM HUB — TÀI LIỆU NỘI BỘ (INTERNAL ASSESSMENT)
*Ngày lập: 22/11/2026 | Phiên bản: 1.0*

> ⚠️ **TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM (DISCLAIMER)**:  
> Tài liệu này là bản đánh giá kỹ thuật và quản trị rủi ro nội bộ của đội ngũ phát triển STEM HUB, **KHÔNG CẤU THÀNH VÀ KHÔNG THAY THẾ CHO Ý KIẾN TƯ VẤN PHÁP LÝ CHÍNH THỨC** từ luật sư hoặc chuyên gia pháp chế chuyên nghiệp.

---

### 1. Tóm Tắt Điều Khoản Sử Dụng Gemini API (`ai.google.dev/gemini-api/terms`)
*Căn cứ bản điều khoản có hiệu lực từ ngày 23/03/2026:*

1. **Giới hạn độ tuổi (Age Restrictions)**:
   - Người sử dụng API trực tiếp phải từ **18 tuổi trở lên**.
   - Điều khoản quy định rõ: **không dùng dịch vụ trong ứng dụng hướng tới hoặc có khả năng được người dưới 18 tuổi truy cập**.
2. **Mục đích sử dụng (Business / Professional Use Only)**:
   - Gemini API được cung cấp cho mục đích thương mại, chuyên môn, nghiên cứu hoặc doanh nghiệp, không dành cho mục đích tiêu dùng cá nhân thông thường.
3. **Quyền xử lý và lưu trữ dữ liệu ở Gói Miễn Phí (Free/Unpaid Tier Data Usage)**:
   - Đối với gói miễn phí (Free Tier), dữ liệu người dùng gửi lên (prompts, câu hỏi, hình ảnh) và câu trả lời của mô hình có thể được Google lưu trữ, phục vụ việc đánh giá chất lượng thủ công bởi con người (human reviewers) và sử dụng để huấn luyện/cải tiến các mô hình AI của Google.
4. **Quy định đối với EEA, Thụy Sĩ và Vương Quốc Anh**:
   - Người dùng và dịch vụ vận hành tại Khu vực Kinh tế Châu Âu (EEA), Thụy Sĩ và Vương quốc Anh bắt buộc phải sử dụng gói trả phí (Paid Tier / Google Cloud Terms) để được áp dụng các điều khoản bảo vệ dữ liệu cá nhân theo tiêu chuẩn GDPR.

---

### 2. Rà Soát Toàn Bộ Các Luồng Gửi Dữ Liệu Tới Gemini Trong Sản Phẩm

| STT | Endpoint / Route API | Chức năng | Dữ liệu người dùng gửi tới Gemini | Xác nhận Rà soát PII (Tên/Email/UID/Lớp/Trường) |
| :---: | :--- | :--- | :--- | :--- |
| **1** | `POST /api/ai/chat` | Trợ lý học tập NOVA (Hỏi đáp khoa học) | Lịch sử chat (văn bản câu hỏi), ảnh bài tập (base64) | ✅ **0 trường PII**. Hệ thống không nối `displayName`, `email`, `uid`, `grade`, hay tên trường vào prompt. |
| **2** | `POST /api/lab-toan/chat-model` | Trợ lý Lab Toán 3D | Tên hình khối, câu hỏi toán học | ✅ **0 trường PII**. Không chứa định danh người dùng. |
| **3** | `POST /api/lab-toan/chat-tutor` | Gia sư phương pháp giải Lab Toán | Đề bài toán, công thức tính | ✅ **0 trường PII**. Hoàn toàn phi danh tính. |
| **4** | `POST /api/lab-toan/generate-3d` | Sinh cấu hình hình học 3D | Phương trình / mô tả hình học thuần túy | ✅ **0 trường PII**. |
| **5** | `POST /api/lab-toan/vision-ocr` | Nhận diện đề bài toán từ ảnh | Tệp ảnh chụp đề bài | ✅ **0 trường PII**. |

*Xác nhận kỹ thuật (`git grep`)*: Không phát hiện bất kỳ trường PII (`email`, `uid`, `studentName`, `schoolName`, `gradeClass`) nào được đưa vào các template `systemInstruction` hoặc `contents` gửi tới Gemini API.

---

### 3. Các Biện Pháp Giảm Thiểu Rủi Ro Kỹ Thuật Đã Triển Khai

1. **Cảnh báo công khai tại giao diện Trợ lý AI**:
   - Đã nhúng dòng thông báo cố định tại chân hộp thoại chat của NOVA:  
     `"⚠️ Không nhập thông tin cá nhân; nội dung có thể được xử lý bởi dịch vụ AI của Google."`
2. **Bộ lọc từ khóa cấm PII trước khi học hỏi RAG**:
   - Hàm `containsPersonalOrSystemInfo()` trong `src/lib/ragService.js` tự động phát hiện và chặn lưu trữ mọi câu thoại chứa tên người, danh hiệu, cấp bậc hoặc thông tin hệ thống vào bộ nhớ RAG.
3. **Cơ chế Fallback nội bộ (Zero-API Fallback)**:
   - Khi Gemini API bị tắt hoặc lỗi hạn mức, hệ thống tự động suy diễn hoàn toàn cục bộ qua RAG Top-3 Offline và TensorFlow.js tại client mà không gửi bất kỳ gói tin nào ra internet.

---

### 4. Đề Xuất Cờ Cấu Hình Tắt Trợ Lý AI (Feature Toggle / Kill-Switch)

Để đảm bảo khả năng chủ động tuân thủ điều khoản dịch vụ và quản lý rủi ro nhà trường, đề xuất cấu hình 3 cấp độ bật/tắt AI:

1. **Cấp độ Toàn hệ thống (Global Kill-Switch)**:
   - Biến môi trường: `NEXT_PUBLIC_ENABLE_AI_ASSISTANT="false"` (khi đặt false, toàn bộ widget NOVA sẽ ẩn trên giao diện, cổng `/api/ai/chat` trả về 403).
2. **Cấp độ Lớp học / Độ tuổi (Grade-Level Restrictions)**:
   - Cấu hình trong Firestore document `system_settings/ai_policy`:
     ```json
     {
       "allowedGrades": [12],
       "disallowedGrades": [10, 11],
       "requireParentConsent": true
     }
     ```
3. **Cấp độ Tài khoản cá nhân (Per-User Flag)**:
   - Thuộc tính trong Firestore `users/{uid}`: `aiOptOut: true` hoặc `aiDisabledByTeacher: true`. Khi bật, tài khoản chỉ được dùng các thí nghiệm ảo 3D và ngân hàng đề tĩnh, không thể kích hoạt trợ lý AI.
