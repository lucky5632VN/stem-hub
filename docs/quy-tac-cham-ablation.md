# 📜 QUY TẮC CHẤM THẨM ĐỊNH ABLATION BENCHMARK (ĐÓNG BĂNG TRƯỚC KHI CHẠY)

> **Dự án**: STEM HUB  
> **Ngày ban hành**: 2026-11-23  
> **Trạng thái**: ĐÃ ĐÓNG BĂNG (FROZEN - Không sửa đổi sau khi quan sát kết quả)  
> **Mục đích**: Thiết lập quy tắc chấm khách quan, tiền định (pre-registered) cho các thực nghiệm cắt bỏ (ablation study) trên tập dữ liệu đánh giá 100 câu và các tập ứng viên chính thức.

---

## 1. NGUYÊN TẮC CỐT LÕI VỀ TÍNH TRUNG THỰC (PROMPT 0)

1. **Khóa quy tắc trước khi chạy (Rule Freeze)**:  
   Mọi quy tắc, tiêu chí chấm, ngưỡng sai số và định nghĩa kết quả phải được văn bản hóa và tính mã băm (SHA-256) trước khi tiến hành thực nghiệm. Tuyệt đối **không thay đổi quy tắc chấm** sau khi đã thấy dữ liệu đầu ra từ mô hình.
2. **Không làm đẹp số liệu**:  
   Mọi phản hồi lỗi (HTTP 429, timeout), câu trả lời sai lệch hoặc câu bị ngắt đều phải được ghi nhận đúng sự thật kỹ thuật.

---

## 2. QUY ĐỊNH VỀ CÂU BỊ BỘ LỌC TỪ CHỐI (ABSTENTION / REFUSAL)

1. **Cách tính điểm trong bài toán giải quyết vấn đề**:  
   - Nếu câu hỏi yêu cầu giải toán/khoa học nhưng hệ thống kích hoạt cơ chế an toàn hoặc bộ ngắt Fail-Closed từ chối trả lời (do không đủ căn cứ SGK hoặc phát hiện cạm bẫy), câu hỏi đó **tính là SAI** (`isCorrect: false, isAbstained: true`) đối với năng lực giải quyết bài toán.
   - Không được quy đổi trạng thái từ chối thành "đúng một phần" hay loại bỏ khỏi mẫu số để làm tăng tỷ lệ chính xác.
2. **Báo cáo tỷ lệ từ chối riêng biệt**:  
   - Tỷ lệ từ chối (Abstention Rate = $\frac{\text{Số câu từ chối}}{\text{Tổng số câu}}$) bắt buộc phải được **báo cáo ở một cột độc lập**, tách biệt hoàn toàn với tỷ lệ trả lời đúng (Accuracy).
   - Tỷ lệ từ chối phản ánh tính thận trọng (conservatism) của hệ thống an toàn và không được phép gộp chung làm lu mờ độ chính xác thực tế.

---

## 3. PHẠM VI ÁP DỤNG CỦA CHẤM TỰ ĐỘNG (AUTO-GRADER)

Hệ thống chấm tự động (Auto-grader script) **CHỈ ĐƯỢC PHÉP ÁP DỤNG** cho 2 trường hợp cụ thể sau:

1. **Nhận diện trạng thái từ chối (Abstention Detection)**:  
   - Tự động phát hiện các mẫu câu ngắt an toàn chuẩn của hệ thống: *"⚠️ Cảnh báo thiếu căn cứ: Câu hỏi nằm ngoài phạm vi kho ngữ liệu..."*, *"Chưa tìm thấy căn cứ trong kho tài liệu..."*, hoặc các phản hồi dạng fail-closed.
2. **So khớp đáp số cuối của câu hỏi số học (Numerical Matching)**:  
   - Áp dụng cho các câu số học Phần III (trả lời ngắn) và Phần I (trắc nghiệm) có đáp án dạng số rõ ràng.
   - So khớp giá trị số cuối cùng với dung sai cho phép (tolerance):
     - Dạng số nguyên: Sai số tuyệt đối $\Delta = 0$.
     - Dạng số thập phân (làm tròn hàng phần trăm/hàng chục): Sai số tuyệt đối $|\hat{y} - y| \le 0.02$.
     - Trắc nghiệm: Khớp đúng ký tự phương án (A, B, C, D).

3. **Bổ sung chuẩn hóa xử lý biến thể đáp số (Pre-registered Addendum - 2026-11-23T17:05:00+07:00)**:
   - **Chuẩn hóa dấu thập phân**: Chuyển đổi dấu phẩy `,` thành dấu chấm `.` (ví dụ `5,91` -> `5.91`).
   - **Xử lý số 0 vô nghĩa và làm tròn**: `5,910` quy về `5.91` (sai số = 0). Biến thể `5,9` có sai số $|5.9 - 5.91| = 0.01 \le 0.02$ (nằm trong dung sai $\pm 0.02$).
   - **Tách lọc tiền tố và đơn vị**: Tự động loại bỏ cụm "xấp xỉ", "khoảng", "kết quả là", đơn vị đo (`cm3`, `cm^3`, `L`, `lít`, `kJ`, `kg`, `nghìn đồng`) trước khi parse số.
   - **Trắc nghiệm Phần I**: Chấp nhận cả 3 biến thể: chỉ ghi chữ cái phương án (`"B"`), chỉ ghi nội dung (`"(1; 0)"`), hoặc cả hai (`"B. (1; 0)"`).
   - **Trường hợp nhiều số trong văn bản**: Ưu tiên bắt số nằm sau các cụm từ chốt (`"kết quả:"`, `"đáp số:"`, `"bằng"`, `"là"`) hoặc lấy số tại câu kết luận cuối cùng.
   - **Mã 4 chữ số (mã ghép/thứ tự)**: Xử lý dạng chuỗi ký tự khớp chính xác (`\b3412\b`), không áp dụng dung sai số học.

---

## 4. BẮT BUỘC NGƯỜI CHẤM CHO CÂU KHÁI NIỆM (HUMAN-IN-THE-LOOP)

1. **Cấm chấm tự động cho câu hỏi khái niệm (In-scope Concept)**:  
   - Toàn bộ các câu hỏi khái niệm, giải thích bản chất hiện tượng khoa học, cơ chế sinh học, định luật vật lý **bắt buộc phải do con người chấm** (thẩm định viên chuyên môn / giáo viên hoặc nhóm tự chấm).
   - Tuyệt đối không dùng mô hình ngôn ngữ lớn (LLM-as-a-judge) hoặc thuật toán chuỗi để tự động chấm đạt/không đạt cho câu khái niệm trong các báo cáo chính thức.
2. **Quy trình thẩm định người chấm**:  
   - Người chấm áp dụng Rubric 4 tiêu chí chuẩn (Đúng kiến thức khoa học, Có căn cứ SGK, Tính sư phạm Socratic, An toàn phòng lab/độ tuổi) trên thang điểm 0–2.
   - Giao diện chấm mù phải ẩn toàn bộ thông tin công nghệ (Model, RAG status) để tránh thiên kiến xác nhận.

---

## 5. PHÂN TẦNG VÀ BÁO CÁO ĐỘC LẬP (KHÔNG GỘP CHUNG)

1. **3 tầng đối với câu hỏi số học chính thức**:  
   - **Tầng A (n=4)**: "kho đủ để giải" — Kho tài liệu cung cấp trực tiếp công thức/phương pháp đầy đủ.
   - **Tầng B (n=16)**: "chủ đề liên quan, chưa đủ để giải" — Kho có đề cập chủ đề nền nhưng chưa đủ công thức đặc thù hoặc bước giải bài toán thực tế.
   - **Tầng C (n=4)**: "ngoài kho" — Hoàn toàn không có ngữ liệu liên quan trong kho 303 chunks.
2. **Quy tắc cỡ mẫu nhỏ $n$**:  
   - Đối với cỡ mẫu nhỏ ($n = 4$ ở Tầng A và C; $n = 16$ ở Tầng B), **chỉ báo cáo số liệu thống kê mô tả** dưới dạng phân số (ví dụ: $k/4$, $k/16$) hoặc bảng liệt kê từng câu.
   - Tuyệt đối không suy diễn thống kê suy luận (như khoảng tin cậy p-value quá đà) và không tính trung bình gộp 3 tầng thành một con số duy nhất.
3. **Cố định kho tri thức**:  
   - Kho tri thức (`stem-corpus.json`, 303 chunks) **tuyệt đối không được bổ sung hay sửa đổi sau khi đã tiếp cận đề thi**.

---

## 6. MÃ BĂM VÀ XÁC THỰC BẢN QUYỀN

- Tài liệu này được tính mã băm SHA-256 ngay khi tạo và ghi nhận vào `reports/ablation/dataset_hash.json`.
- Mọi sửa đổi nội dung sau thời điểm ghi nhận đều làm thay đổi mã băm và bị coi là vi phạm quy tắc đóng băng thực nghiệm.

