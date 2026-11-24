# 📐 ĐẶC TẢ BỘ CHẤM TỰ ĐỘNG (AUTO-GRADER SPEC)
> **Tài liệu quy chuẩn kỹ thuật**: Hệ thống chấm tự động thực nghiệm RAG Ablation Study  
> **Nguyên tắc**: Minh bạch tuyệt đối theo QUY TẮC TRUNG THỰC (Prompt 0).

---

## 1. PHẠM VI ÁP DỤNG CỦA BỘ CHẤM TỰ ĐỘNG (STRICT SCOPE)

Nhằm đảm bảo tính chính xác khoa học và tránh sai số do máy tự chấm văn phong lý thuyết, bộ chấm tự động `evaluateAnswer(caseItem, responseText)` trong `scripts/run_ablation_real.mjs` được **GIỚI HẠN NGHIÊM NGẶT** chỉ xử lý 2 mục tiêu:

### 1.1. Chấm Từ chối Trả lời Ngoài phạm vi (Pedagogical Abstention / Out-of-Scope)
- **Mục tiêu**: Đo lường khả năng phòng vệ chống ảo giác (Hallucination Defense) và từ chối trả lời câu hỏi ngoài thẩm quyền chương trình GDPT 2018.
- **Quy tắc chấm**:
  - Quét biểu thức chính quy phát hiện các mẫu từ chối hợp lệ:
    ```javascript
    const abstentionPatterns = [
      /nằm ngoài/i, /ngoài phạm vi/i, /ngoài chương trình/i, /chưa đủ căn cứ/i,
      /không thuộc phạm vi/i, /thiếu căn cứ/i, /sgk không/i, /chưa có trong sgk/i,
      /tham khảo tài liệu chuyên ngành/i, /đại học/i
    ];
    ```
  - **ĐÚNG (`isCorrect = true`)**: Khi phản hồi xuất hiện ít nhất 1 tín hiệu từ chối hợp lệ.
  - **SAI (`isCorrect = false`)**: Khi mô hình tự ý giải đáp hoặc khẳng định kiến thức ngoài SGK mà không cảnh báo.

### 1.2. Chấm Đáp án Số Cuối Cùng (Numerical Final Answer Check)
- **Mục tiêu**: Đảm bảo nghiệm số, giá trị định lượng và hằng số then chốt khớp chính xác với đáp án chuẩn.
- **Quy tắc chấm cứng**:
  - Trích xuất token số học, nghiệm phương trình từ `evaluation_keywords`.
  - So khớp chuỗi số, thứ nguyên và dấu. Yêu cầu khớp chính xác đáp án số cuối cùng.
  - Nếu xuất hiện dạng biểu thức phân số, căn thức phức tạp hoặc kết quả làm tròn khác quy ước: tự động gắn cờ `needsManualReview = true` ("Cần người chấm").

### 1.3. Khái Niệm SGK (Conceptual) & Trích Dẫn Nguồn (Grounding): CẦN NGƯỜI CHẤM
- **Quy định bắt buộc**:
  - Với các câu hỏi lý thuyết, cơ chế phản ứng, bản chất sinh học hoặc nhận xét định tính (In-Scope Concept): **Auto-grader KHÔNG tự ý kết luận đúng/sai**. Toàn bộ nhóm này được đánh dấu:  
    👉 `status: "cần người chấm"` (`needsManualReview: true`).
  - Với việc kiểm tra trích dẫn nguồn (Source Grounding): Kiểm tra sự hiện diện mã chunk chỉ mang tính chất tham khảo kỹ thuật; việc đánh giá câu trả lời có bám sát ngữ cảnh trích dẫn hay không bắt buộc phải do **người chấm thẩm định trực tiếp**.

---

## 2. CHÍNH SÁCH CÔNG BỐ ĐỘ CHÍNH XÁC & ĐỘ ĐỒNG THUẬN

> [!IMPORTANT]
> **Cam kết trung thực về việc không công bố độ chính xác so với nhãn AI**:
> - Nhóm nghiên cứu **KHÔNG CÔNG BỐ** độ chính xác của bộ chấm tự động so với 20 nhãn do mô hình/AI gán thử nghiệm trước đây. Nhãn do AI tự gán cho AI không có giá trị thẩm định khoa học độc lập.
> - Độ chính xác và độ đồng thuận (Inter-Rater Agreement / Cohen's Kappa) của Auto-grader **CHỈ ĐƯỢC CÔNG BỐ** sau khi người dùng / giáo viên hoàn thành việc chấm độc lập bằng tay trên mẫu kiểm định mù tại:  
>   [docs/mau-cham-tay-20-ca-cho-nguoi-dung.md](docs/mau-cham-tay-20-ca-cho-nguoi-dung.md).
> - Hiện tại, các chỉ số độ đồng thuận đối với 20 ca mẫu được ghi nhận ở trạng thái: **"Chờ nhãn người chấm thật (Pending Human Ground Truth)"**.
