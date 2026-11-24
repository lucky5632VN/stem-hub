# 🎬 KỊCH BẢN DEMO HỆ THỐNG AI CHO BAN GIÁM KHẢO (STEM HUB 2026)
> **Chặng thi**: Chặng 1 - Cải tiến, hoàn thiện sản phẩm (Cuộc thi Sáng tạo trẻ Quốc gia 2026 - Lĩnh vực Trí tuệ nhân tạo)  
> **Cam kết**: Tuân thủ Quy tắc trung thực Prompt 0. Mọi dữ liệu demo được gắn nhãn `isDemo: true`, tài khoản demo tách biệt hoàn toàn với dữ liệu thực tế.

---

## 📌 I. MỤC TIÊU VÀ TÀI KHOẢN TRÌNH DIỄN

Kịch bản demo được thiết kế nhằm giải quyết trực tiếp 3 yêu cầu cốt lõi của Ban Giám Khảo (Phiên bản 1):
1. **Kiểm chứng câu trả lời có căn cứ**: Hiển thị rõ ràng khối "Căn cứ", đoạn trích nguồn, nhãn nguồn trung thực, cảnh báo khi thiếu căn cứ.
2. **Cơ chế từ chối khi ngoài phạm vi (Abstention Guard)**: Ngắt an toàn, không bịa đặt trích đoạn nguồn.
3. **Quy trình giáo viên sửa và duyệt tri thức**: Tri thức mới mặc định ở trạng thái chờ duyệt (Pending), chỉ sau khi giáo viên thật kiểm định mới được nạp vào RAG; dữ liệu demo được gắn nhãn `isDemo: true`.

### 🔑 Thông Tin Tài Khoản Trình Diễn
| Vai Trò | Email Trình Diễn | Mật Khẩu Khởi Tạo | Quyền Hạn Trong Hệ Thống |
|---|---|---|---|
| **Học sinh (Student)** | `hocsinh.demo@stemhub.edu.vn` | `StemHub@2026` | Trải nghiệm hỏi đáp trợ lý NOVA, phòng lab, làm bài tập |
| **Giáo viên (Teacher/Admin)** | `giaovien.demo@stemhub.edu.vn` | `TeacherHub@2026` | Quyền duyệt tri thức tại `/admin/knowledge-review` |
| **Ban Giám Khảo (Judge Demo)** | `giamkhao_demo@stemhub.edu.vn` | `JudgeHub@2026` | Trải nghiệm toàn diện: Mở khóa 4 Lab 3D, 500 ELO Đấu trường, Trợ lý NOVA |

---

## 🧪 II. 3 TÌNH HUỐNG TRÌNH DIỄN CHI TIẾT (STEP-BY-STEP)

### 🟢 Tình Huống 1: Câu Hỏi Trong Phạm Vi Có Căn Cứ (In-Scope Grounded Query)

* **Mục đích**: Chứng minh khả năng truy xuất đúng tri thức chuẩn GDPT 2018, hiển thị khối căn cứ minh bạch, trích dẫn chính xác và không bịa đặt nguồn.
* **Các bước thao tác**:
  1. Tại bất kỳ trang nào của STEM HUB, bấm phím tắt `Ctrl + K` (hoặc `Cmd + K` trên macOS) hoặc click vào biểu tượng Trợ lý AI ở góc dưới bên phải màn hình để mở giao diện NOVA HUD.
  2. Nhập câu hỏi mẫu môn Hóa học:
     ```text
     Este no đơn chức mạch hở có công thức phân tử tổng quát là gì?
     ```
  3. Bấm **Enter** hoặc click nút gửi.
* **Những điểm cần hướng dẫn Ban Giám Khảo quan sát trên màn hình**:
  - **Khối Căn Cứ & Kiểm Chứng**: Xuất hiện ngay phía dưới câu trả lời của AI.
  - **Huy hiệu trạng thái**: Hiển thị `🟢 Có căn cứ` cùng chỉ số tương quan cụ thể (ví dụ: `Độ tương quan: 75% - 85%`).
  - **Nhãn loại nguồn trung thực**: Hiển thị rõ `Bản tóm tắt do nhóm biên soạn theo chương trình GDPT 2018` (tuyệt đối không bịa đặt tên sách/chương/số trang nếu không phải trích đoạn SGK nguyên bản).
  - **Đoạn trích đối chiếu (Snippet)**: Trích dẫn nội dung thực tế của chunk ngữ liệu (ví dụ mã ID `hoa-12-001`).
  - **Nút "Xem ngữ cảnh"**: Click để mở rộng xem toàn bộ văn bản của đoạn tri thức được nạp vào mô hình.
  - **Hậu kiểm suy nghiệm (Heuristic Verifier)**: Các số liệu/công thức hóa học ($\text{C}_n\text{H}_{2n}\text{O}_2$) được đối sánh trùng khớp với đoạn ngữ liệu.

---

### 🔴 Tình Huống 2: Câu Hỏi Ngoài Phạm Vi Bị Từ Chối (Out-of-Scope Strict Abstention)

* **Mục đích**: Chứng minh cơ chế ngắt an toàn (Strict Grounding Abstention), từ chối trả lời câu hỏi ngoài chương trình SGK, không suy đoán bừa bãi và không bịa đặt trích đoạn ngữ liệu.
* **Các bước thao tác**:
  1. Trong cửa sổ Trợ lý NOVA, nhập một câu hỏi hoàn toàn nằm ngoài kho tri thức STEM THPT:
     ```text
     Hôm nay thời tiết Hà Nội bao nhiêu độ và tối nay có mưa không?
     ```
     *(Hoặc câu hỏi: "Ai là cầu thủ ghi nhiều bàn thắng nhất World Cup 2022?")*
  2. Bấm **Enter**.
* **Những điểm cần hướng dẫn Ban Giám Khảo quan sát trên màn hình**:
  - **Cơ chế ngắt tự động kích hoạt**: Hệ thống không gọi Gemini để bịa chuyện mà hiển thị cảnh báo ngay:
    > *"⚠️ Cảnh báo thiếu căn cứ: Câu hỏi nằm ngoài phạm vi kho ngữ liệu Sách giáo khoa chuẩn hiện có. Hệ thống tạm dừng trả lời tự động để tránh sai lệch kiến thức."*
  - **Khối Căn Cứ hiển thị**: `🔴 Không có căn cứ` (Độ tương quan cực thấp: $< 15\%$).
  - **Bảo toàn dữ liệu nguồn (Negative Case)**: Tuyệt đối **không hiển thị bất kỳ đoạn trích dẫn giả mạo nào** (Snippet rỗng).
  - **Cảnh báo nổi bật**: Khung cảnh báo màu đỏ: *"Chưa tìm thấy căn cứ trong kho tài liệu. Hãy đối chiếu sách giáo khoa hoặc hỏi giáo viên."*
  - **Quyền tự quyết của người học**: Hiển thị nút `[Vẫn xem gợi ý tham khảo mở rộng từ AI]`. Nếu học sinh click nút này, hệ thống mới gọi AI nhưng luôn kèm nhãn cảnh báo `Căn cứ yếu` hoặc `Không có căn cứ`.

---

### 🟡 Tình Huống 3: Giáo Viên Đăng Nhập Duyệt/Sửa Tri Thức Chờ Duyệt (Teacher Review Workflow)

* **Mục đích**: Chứng minh sự kiểm soát của con người (Human-in-the-Loop), quy trình cách ly tri thức tự học (Quarantine) và vai trò phê duyệt sư phạm của giáo viên trước khi tri thức được đưa vào RAG.
* **Các bước thao tác**:
  1. Đăng nhập hệ thống bằng tài khoản Giáo viên (`giaovien.demo@stemhub.edu.vn`).
  2. Điều hướng vào trang Quản lý & Thẩm định Tri thức: URL `/admin/knowledge-review`.
  3. Chọn tab **"⏳ Chờ duyệt (Pending Review)"**.
  4. Quan sát danh sách các bản ghi có gắn nhãn `isDemo: true` (ví dụ: `sample_hoa_1`, `sample_ly_1`):
     - Dữ liệu hiển thị rõ: Câu hỏi của học sinh, câu trả lời do AI đề xuất, bộ môn, thời điểm tạo.
  5. **Thao tác Chỉnh sửa sư phạm**:
     - Click nút **"✏️ Sửa"** tại một bản ghi.
     - Sửa lại nội dung câu trả lời cho ngắn gọn, chuẩn mực sư phạm hơn (ví dụ: bổ sung điều kiện nhiệt độ/áp suất).
     - Bấm **"Lưu cập nhật"**.
  6. **Thao tác Phê duyệt**:
     - Click nút **"✅ Duyệt"** (Approve).
     - Trạng thái bản ghi lập tức chuyển sang `verified_by_teacher`, ghi nhận ID giáo viên và thời điểm duyệt.
     - Sau bước này, bản ghi mới đủ điều kiện được đưa vào dynamic index của RAG.
  7. **Kiểm chứng tính an toàn & cách ly**:
     - Các bản ghi đang ở trạng thái `pending_review`, `quarantined` hoặc gắn nhãn `isDemo: true` bị cô lập hoàn toàn, không xuất hiện trong kết quả truy xuất RAG của học sinh khác.

---

## 📋 III. CHECKLIST KIỂM TRA TRƯỚC GIỜ TRÌNH DIỄN (PRE-FLIGHT CHECKLIST)

Trước khi Ban Giám Khảo bước vào bàn chấm thi, thực hiện kiểm tra 5 phút theo danh mục sau:

- [ ] **Môi trường & Trình duyệt**:
  - Mở Chrome/Edge ở chế độ bình thường (đã lưu sẵn phiên đăng nhập demo).
  - Kiểm tra độ phân giải hiển thị tối thiểu `1280x720` hoặc tỷ lệ zoom `100%`.
- [ ] **Kết nối & Âm thanh**:
  - Kiểm tra loa máy tính để nghe âm thanh phản hồi nhẹ khi gửi tin nhắn (sound chime).
  - Bật sẵn phím tắt `Ctrl + K` để sẵn sàng gọi trợ lý NOVA bất kỳ lúc nào.
- [ ] **Kiểm tra trạng thái máy chủ cục bộ**:
  - Chạy sẵn lệnh `npm run dev` trên cổng `localhost:3000`.
  - Mở sẵn tab `/admin/knowledge-review` ở một cửa sổ riêng.
- [ ] **Dữ liệu demo tách biệt**:
  - Xác nhận các bản ghi dùng cho demo đều mang cờ `isDemo: true`.
  - Không tồn tại tên tuổi hay thông tin cá nhân của người dùng thật trong giao diện.

---

## 🛡️ IV. PHƯƠNG ÁN DỰ PHÒNG KHI CÓ SỰ CỐ (CONTINGENCY PLANS)

### 1. Tình huống: Mất kết nối Internet hoặc mạng Wifi hội đồng thi chập chờn
* **Phương án**: STEM HUB được thiết kế với kiến trúc **Offline-First Resilience**:
  - Toàn bộ 6 mô hình AI tự huấn luyện (ChemLab Risk Softmax NN, Physics kNN, Javit Intent Naive Bayes, Math IRT, Genetics Bayes, TF-IDF RAG) đều chạy cục bộ phía Client-Side trên JavaScript / Web Worker.
  - Kho ngữ liệu SGK 303 chunks (`rag-vectors.json`) đã được đóng gói tĩnh trong build client.
  - Khi mất mạng, trợ lý AI tự động chuyển sang cơ chế **Resilient Offline RAG**: tra cứu trực tiếp từ 303 chunks cục bộ và trả lời học sinh với mô hình `stemhub-rag-offline-resilient` mà không bị gián đoạn hay báo lỗi mạng.

### 2. Tình huống: Gemini API Key hết Quota (HTTP 429) hoặc bị giới hạn tốc độ
* **Phương án**:
  - API proxy `/api/ai/chat` được tích hợp sẵn bộ đệm Failover thông minh: nếu phát hiện lỗi HTTP 429 hoặc quá hạn mức, hệ thống tự động trích xuất nội dung từ Top-1 chunk của kho tri thức chuẩn và phản hồi với tiền tố:
    `[Trợ lý STEM HUB - Tri thức Chuẩn]: <Nội dung chunk>`
  - Nếu câu hỏi ngoài phạm vi, hệ thống tự động trả về thông điệp sư phạm thân thiện (`stemhub-offline-pedagogical-guard`) thay vì hiển thị màn hình lỗi đỏ.

---

## 🏁 V. THÔNG ĐIỆP KẾT LUẬN GỬI BAN GIÁM KHẢO
> *"STEM HUB kiên định với định hướng: AI trong giáo dục không phải để làm thay học sinh, mà là công cụ gợi mở tư duy có kiểm chứng. Mọi số liệu, nhãn nguồn và quy trình trong hệ thống đều minh bạch, đặt tính trung thực khoa học và quyền kiểm soát của thầy cô giáo lên hàng đầu."*

