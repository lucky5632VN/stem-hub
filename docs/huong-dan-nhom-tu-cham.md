# 📋 QUY TRÌNH HƯỚNG DẪN DÀNH CHO THÀNH VIÊN NHÓM TỰ CHẤM (INTERNAL TEAM EVALUATION)
## DỰ ÁN STEM HUB — ĐÁNH GIÁ NỘI BỘ VÀ KIỂM ĐỊNH KỸ THUẬT

> **⚠️ NGUYÊN TẮC CỐT LÕI (PROMPT 0)**:
> 1. Mọi kết quả do thành viên nhóm tự chấm **LÀ ĐÁNH GIÁ NỘI BỘ, TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ NHẬN LÀ ĐÁNH GIÁ ĐỘC LẬP HAY THẨM ĐỊNH CHUYÊN MÔN**.
> 2. Giao diện chấm và toàn bộ báo cáo xuất ra bắt buộc mang biểu ngữ cảnh báo cố định:
>    `⚠️ Đánh giá nội bộ của nhóm — không phải đánh giá độc lập`
> 3. Không bao giờ được cấp vai trò `teacher` cho thành viên nhóm hoặc gộp điểm nhóm vào điểm giáo viên.

---

### 1. Kỷ Luật Chấm Mù Nội Bộ (Internal Blind Rating)
Nhằm hạn chế tối đa thiên kiến xác nhận (Confirmation Bias) khi người phát triển tự đánh giá sản phẩm của mình, các thành viên nhóm phải tuân thủ nghiêm ngặt:
1. **Không mở mã nguồn hoặc log hệ thống trong khi chấm**: Khi ngồi vào phiên chấm, chỉ tương tác với màn hình chấm mù tại `/danh-gia-chuyen-mon`.
2. **Không cố đoán phiên bản mô hình hay cấu hình**: Giao diện đã ẩn toàn bộ tên mô hình AI, điều kiện bật/tắt RAG và thứ tự câu hỏi đã bị xáo trộn ngẫu nhiên bằng UID của từng thành viên.
3. **Chấm độc lập tuyệt đối**: Các thành viên không được ngồi cạnh nhau, không thảo luận, không so sánh điểm số trong quá trình chấm cho đến khi hoàn tất toàn bộ số mẫu được giao.

---

### 2. Sử Dụng Đáp Án Chuẩn Đối Chiếu Có Nguồn SGK
- Với mỗi câu hỏi, hệ thống cung cấp hộp tham chiếu **"Đáp án chuẩn & Nguồn SGK GDPT 2018"**.
- Thành viên nhóm **bắt buộc đọc kỹ đáp án chuẩn và vị trí trang sách** trước khi chấm điểm câu trả lời của trợ lý AI.
- Nếu câu trả lời AI thiếu bước giải quan trọng, đưa số liệu không có trong bài học, hoặc ngộ nhận công thức: Kiên quyết chấm mức **0 điểm** hoặc **1 điểm** theo đúng định nghĩa Rubric, không châm chước.

---

### 3. Khai Báo & Ghi Nhận Xung Đột Lợi Ích (Conflict of Interest Disclosure)
- Mỗi thành viên khi tham gia chấm phải hiểu rằng:
  - Dữ liệu này chỉ phục vụ mục đích kỹ thuật nội bộ (so sánh ablation, tìm lỗi để sửa prompt và hệ thống truy xuất RAG).
  - Không sử dụng điểm tự chấm của nhóm để quảng bá "Độ chính xác đạt 9x%" hay "Giáo viên công nhận".
  - Trong tệp xuất báo cáo và mã nguồn, toàn bộ dữ liệu tự chấm được gán nhãn rõ ràng:
    `reviewerType: "team_self"` và mã ẩn danh `TEAM-XXXX`.
- Báo cáo khoa học nộp Ban Giám khảo sẽ phân tách 2 cột riêng biệt: Cột "Giáo viên chấm" và Cột "Nhóm tự chấm", minh bạch rõ sự khác biệt giữa hai nguồn đánh giá.
