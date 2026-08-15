# BÁO CÁO ĐỀ TÀI STEM: PHÒNG THÍ NGHIỆM ẢO SINH HỌC THÔNG MINH (BioSTEM Virtual Lab)

## I. ĐẶT VẤN ĐỀ (LÝ DO CHỌN ĐỀ TÀI)
Trong chương trình Giáo dục phổ thông 2018 môn Sinh học, các hoạt động thực hành và thí nghiệm đóng vai trò cốt lõi giúp học sinh hình thành năng lực khoa học. Tuy nhiên, việc triển khai trên thực tế gặp nhiều rào cản:
- **Thiếu hụt trang thiết bị**: Các thí nghiệm về di truyền (Mendel), giải phẫu người đòi hỏi thời gian dài hoặc chi phí thiết bị đắt đỏ.
- **Tính trực quan**: Nhiều hiện tượng sinh học diễn ra ở cấp độ tế bào/phân tử (ADN, quang hợp) mắt thường không thể quan sát.

**BioSTEM Virtual Lab** ra đời như một giải pháp chuyển đổi số toàn diện, ứng dụng công nghệ tương tác WebGL để tái hiện môi trường thí nghiệm an toàn, trực quan và không giới hạn.

---

## II. MỤC TIÊU ĐỀ TÀI
1. **Xây dựng hệ sinh thái học tập 3 trong 1**: Thực hành ảo + Tra cứu Lý thuyết + Luyện tập thông minh.
2. **Cá nhân hóa việc học**: Giúp học sinh tự học, tự thử nghiệm các giả thuyết sinh học (ví dụ: lai các cặp tính trạng).
3. **Tối ưu hóa chi phí**: Giảm thiểu việc sử dụng hóa chất, mẫu vật thật gây hại môi trường.

---

## III. CÔNG NGHỆ VÀ Ý TƯỞNG THIẾT KẾ

### 1. Công nghệ sử dụng
- **Frontend**: React.js, Vite (đảm bảo tốc độ tải trang < 1s).
- **Giao diện**: Vanilla CSS theo phong cách *Minimalist Premium* (Tối giản sang trọng), hỗ trợ Dark Mode giảm mỏi mắt.
- **Mô phỏng**: WebGL / Canvas tương tác 2D/3D.

### 2. Cấu trúc hệ thống (Bento Grid Layout)
- **Knowledge Hub (Lý thuyết)**: Tích hợp Sidebar thông minh, chế độ Reader Mode.
- **Virtual Lab (Thư viện thí nghiệm)**: Phân loại khoa học thành 4 nhóm:
  - *Sinh học Tế bào & Thực vật*
  - *Di truyền & Biến dị*
  - *Sinh học Người & Giải phẫu*
  - *Sinh thái & Tiến hóa*
- **Exercise Center (Luyện tập)**: Cơ chế Continuous Quiz (làm bài liên tục) kết hợp Ngân hàng câu hỏi (Question Bank) ngẫu nhiên.

---

## IV. KẾT QUẢ ĐẠT ĐƯỢC
- Hoàn thiện **21 thí nghiệm ảo** tương tác thời gian thực.
- Xây dựng kho dữ liệu **>160 câu hỏi trắc nghiệm** có phân tích lỗi sai khoa học.
- Giao diện đáp ứng tốt trên mọi thiết bị (Responsive Design).

---

## V. HƯỚNG PHÁT TRIỂN
- Tích hợp Trí tuệ nhân tạo (AI Mentor) để chấm điểm bài thực hành.
- Mở rộng ngân hàng câu hỏi lên 100 câu/chuyên đề.
