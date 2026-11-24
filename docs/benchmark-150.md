# 📑 ĐẶC TẢ BỘ ĐỐI CHỨNG KỸ THUẬT TỔNG HỢP 150 CA (SYNTHETIC BENCHMARK)

> **Mã định danh**: `STEM-HUB-BENCHMARK-150`  
> **Tệp dữ liệu**: `src/ai-training/datasets/synthetic_benchmark_150.json`  
> **Script khởi tạo**: `src/ai-training/scripts/generate_full_150_dataset.js`  
> **Trạng thái thẩm định**: **Bộ đối chứng kỹ thuật tổng hợp (Synthetic Benchmark) do nhóm phát triển tự xây dựng, CHƯA qua chấm của giáo viên**.

---

## 1. Nguồn Gốc & Động Lực Xây Dựng

Bộ 150 ca kiểm thử kỹ thuật được xây dựng nhằm đáp ứng nhu cầu kiểm thử tích hợp (Integration Test) và kiểm tra hồi quy tự động (Regression Testing) trong quá trình phát triển các module AI cục bộ và cổng kết nối LLM của dự án STEM HUB:

1. **Người biên soạn**: Nhóm tác giả phát triển dự án STEM HUB (học sinh tham gia cuộc thi Sáng tạo trẻ Quốc gia 2026).
2. **Quy trình sinh dữ liệu**: Dữ liệu được tổng hợp trực tiếp bằng mã nguồn JavaScript (`src/ai-training/scripts/generate_full_150_dataset.js`) thông qua các mảng đối tượng định nghĩa sẵn trong script, sau đó ghi ra tệp JSON `src/ai-training/datasets/synthetic_benchmark_150.json`.
3. **Mục đích kỹ thuật**: Kiểm tra tính ổn định của luồng xử lý văn bản, bộ lọc công thức toán học KaTeX, cơ chế tính điểm thích ứng và khả năng phản hồi của hệ thống.

---

## 2. Cơ Cấu Phân Bổ & Template Sinh 150 Ca

Bộ dữ liệu gồm chính xác 150 trường hợp, chia đều theo 4 môn học Khoa học Tự nhiên & Toán cấp THPT (Chương trình GDPT 2018), được xây dựng theo các template chuẩn hóa:

| STT | Môn Học | Số Lượng Ca | Dải Mã Định Danh | Template Kiến Thức Chuẩn Hóa |
|:---:|:---|:---:|:---:|:---|
| 1 | **Toán Học** | 40 ca | `BENCH_TOAN_01` – `BENCH_TOAN_40` | **Template Hàm số & Tích phân**: Dạng bài tìm cực trị hàm bậc ba, tiệm cận phân thức, GTLN/GTNN trên đoạn, tích phân đổi biến số/từng phần, hình học không gian Oxyz (khoảng cách điểm - mp, góc, pt mặt cầu), xác suất có điều kiện và nhị thức Bernoulli. |
| 2 | **Vật Lý** | 38 ca | `BENCH_LY_01` – `BENCH_LY_38` | **Template Dao động & Sóng**: Dạng bài tính chu kỳ/cơ năng con lắc lò xo và con lắc đơn, hệ thức độc lập thời gian, độ lệch pha sóng cơ, giao thoa sóng cực đại/cực tiểu, sóng dừng 2 đầu cố định/1 đầu tự do, mạch RLC nối tiếp và công suất tiêu thụ. |
| 3 | **Hóa Học** | 38 ca | `BENCH_HOA_01` – `BENCH_HOA_38` | **Template Hữu cơ & Điện hóa**: Dạng bài phản ứng este hóa axit-ancol, xà phòng hóa triglixerit, phản ứng tráng bạc glucozơ, tính khử kim loại trong dãy điện hóa, ăn mòn điện hóa học, cân bằng chuyển dịch Le Chatelier, pH dung dịch. |
| 4 | **Sinh Học** | 34 ca | `BENCH_SINH_01` – `BENCH_SINH_34` | **Template Di truyền & Quần thể**: Dạng bài đột biến thay thế cặp nucleotit, quy luật phân ly độc lập Menđen (tỷ lệ kiểu gen/kiểu hình), xác định tần số alen theo định luật Hardy-Weinberg, cấu trúc operon Lac ở E. coli, diễn thế sinh thái. |
| **Tổng** | **4 môn** | **150 ca** | | **Bao phủ kiến thức trọng tâm THPT lớp 10, 11, 12** |

---

## 3. Cấu Trúc Mỗi Bản Ghi Dữ Liệu

Mỗi ca kiểm thử bao gồm các trường thông tin kỹ thuật sau:

```json
{
  "id": "BENCH_TOAN_01",
  "subject": "toan",
  "grade": 12,
  "topic": "Cực trị hàm số bậc ba",
  "difficulty": "Thông hiểu",
  "question": "Tìm tọa độ các điểm cực trị của đồ thị hàm số y = x^3 - 3x^2 + 2.",
  "ground_truth": "y' = 3x^2 - 6x = 0 <=> x=0 hoặc x=2. Cực đại A(0; 2), Cực tiểu B(2; -2).",
  "sgk_reference": "Tóm tắt chương trình GDPT 2018: Toán 12 Tập 1, Chương I",
  "gemini_response": "Phân tích theo chuẩn GDPT 2018: y' = 3x^2 - 6x = 0...",
  "preset_not_for_reporting": {
    "score_correctness": 9.8,
    "score_sgk_grounding": 9.6,
    "score_pedagogy": 9.5,
    "weighted_score": 9.67
  },
  "teacher_validator": null,
  "status": "synthetic_unverified",
  "benchmark_note": "Bộ đối chứng kỹ thuật tổng hợp (synthetic benchmark) do nhóm xây dựng, chưa qua chấm của giáo viên"
}
```

---

## 4. Minh Bạch Về Điểm Số & Trạng Thái Thẩm Định

> [!WARNING]
> **LƯU Ý QUAN TRỌNG VỀ ĐIỂM SỐ TRONG FILE JSON**:
> - Các trường điểm số ban đầu (`score_correctness`, `score_sgk_grounding`, `score_pedagogy`, `weighted_score`) đã được đóng gói thành đối tượng **`preset_not_for_reporting`**.
> - **Các điểm số này KHÔNG phản ánh kết quả chấm thực tế của bất kỳ giáo viên hay hội đồng chuyên gia nào** và đã bị loại bỏ hoàn toàn khỏi toàn bộ báo cáo, biểu đồ và số liệu công bố.
> - Mọi trường `teacher_validator` được đặt về `null` và `status` được gán nhãn `synthetic_unverified`.
> - Nhóm cam kết **không công bố hay sử dụng các điểm số gõ sẵn này** làm bằng chứng định lượng về hiệu quả sư phạm của sản phẩm.

---

## 5. Giới Hạn Kỹ Thuật Của Bộ Dữ Liệu

1. **Thiếu đánh giá mù độc lập**: Toàn bộ câu hỏi, đáp án chuẩn (`ground_truth`) và phản hồi mẫu được chuẩn bị bởi nội bộ nhóm phát triển, chưa qua đánh giá chéo độc lập từ hội đồng giáo viên môn học.
2. **Ngữ liệu trích dẫn là bản tóm tắt**: Các trường `sgk_reference` là định hướng chủ đề kiến thức do nhóm tóm tắt, không phải là văn bản số hóa nguyên văn từng trang sách giáo khoa.
3. **Phạm vi sử dụng**: Bộ 150 ca này chỉ được sử dụng làm **bộ đối chứng kỹ thuật nội bộ** (Smoke Test / Regression Test) cho pipeline CI/CD của dự án.
4. **Kế hoạch thẩm định thật**: Đánh giá chất lượng thật của giáo viên sẽ được triển khai thông qua công cụ **Teacher Review HUD** (`/admin/knowledge-review`), nơi giáo viên thật đăng nhập bằng tài khoản được xác thực và trực tiếp đánh giá từng nội dung.

