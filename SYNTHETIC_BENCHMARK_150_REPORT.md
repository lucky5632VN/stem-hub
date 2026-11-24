# 📑 BÁO CÁO KỸ THUẬT: BỘ ĐỐI CHỨNG KỸ THUẬT TỔNG HỢP (SYNTHETIC BENCHMARK 150)
> **Mã đội thi**: AI26B0012 | **Dự án**: STEM HUB  
> **Phân loại**: Bộ đối chứng kỹ thuật tổng hợp (synthetic benchmark) do nhóm xây dựng, chưa qua chấm của giáo viên.  
> **Trạng thái thẩm định**: Chưa qua chấm của giáo viên (phần chấm thực tế sẽ thực hiện qua Teacher Review HUD).  
> **Lưu ý trung thực**: Toàn bộ điểm số preset kỹ thuật ban đầu đã được chuyển thành `preset_not_for_reporting` và loại bỏ hoàn toàn khỏi các bảng thống kê và số liệu công bố.

---

## 1. MỤC TIÊU VÀ BẢN CHẤT BỘ ĐỐI CHỨNG 150 CA
Bộ 150 ca kiểm thử kỹ thuật được biên soạn phục vụ mục đích:
1. Xác thực schema dữ liệu đa môn (Toán, Vật lý, Hóa học, Sinh học) theo chương trình GDPT 2018.
2. Kiểm thử khả năng đối sánh trích dẫn ngữ liệu và định dạng công thức khoa học (KaTeX/LaTeX).
3. Chuẩn bị tập dữ liệu đối chứng chuẩn để các thầy cô giáo bộ môn thực hiện thẩm định và chấm điểm thực tế trên giao diện Teacher Review HUD.

> ⚠️ **Cam kết trung thực**: Bộ dữ liệu hiện chưa có điểm số đánh giá chính thức từ giáo viên. Điểm số chính thức chỉ được ghi nhận khi giáo viên thật đăng nhập và thực hiện chấm điểm từng ca trên hệ thống.

---

## 2. PHÂN BỔ 150 CA ĐÁNH GIÁ THEO MA TRẬN 4 MÔN & MỨC ĐỘ NHẬN THỨC

| Bộ Môn | Nhận Biết | Thông Hiểu | Vận Dụng | Vận Dụng Cao | Tổng Số Ca | Trạng Thái Thẩm Định |
|---|:---:|:---:|:---:|:---:|:---:|---|
| **Toán Học** | 8 | 18 | 11 | 3 | **40** | Chưa qua chấm của giáo viên (Synthetic Benchmark) |
| **Vật Lý** | 10 | 21 | 6 | 1 | **38** | Chưa qua chấm của giáo viên (Synthetic Benchmark) |
| **Hóa Học** | 10 | 21 | 6 | 1 | **38** | Chưa qua chấm của giáo viên (Synthetic Benchmark) |
| **Sinh Học** | 9 | 19 | 6 | 0 | **34** | Chưa qua chấm của giáo viên (Synthetic Benchmark) |
| **TỔNG CỘNG** | **37 (24.7%)** | **79 (52.7%)** | **29 (19.3%)** | **5 (3.3%)** | **150 (100%)** | **Chờ thẩm định thực tế qua HUD** |

---

## 3. FILE MINH CHỨNG ĐÍNH KÈM
- **File Dữ liệu nguồn JSON**: `src/ai-training/datasets/benchmark_150_cases.json`
- **File Bảng tính CSV**: `SYNTHETIC_BENCHMARK_150.csv` (Trạng thái `synthetic_unverified`).
