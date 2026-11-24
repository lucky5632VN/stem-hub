# BẢN NHÁP THAY THẾ ĐỀ XUẤT CHO ANSWER KEY (v1.4.0-DRAFT)

> [!WARNING]
> **TÀI LIỆU DỰ THẢO - CHƯA PHÊ DUYỆT - TOÀN BỘ Ô ĐỐI CHIẾU ĐỂ TRỐNG**:
> - Bản nháp này đề xuất thay thế phân tầng `in_scope_numerical` trong bộ 100 câu ablation bằng các câu hỏi chính thức từ Đề thi tốt nghiệp THPT năm 2026 của Bộ GD&ĐT.
> - Trợ lý AI KHÔNG tự ý tích chọn, KHÔNG sửa file dataset `ablation_dataset_100.json`. Chỉ khi người dùng đối chiếu phiếu và phê duyệt thì mới chính thức cập nhật.

## 1. RỦI RO RÒ RỈ DỮ LIỆU VÀ THỜI ĐIỂM CUTOFF CỦA MÔ HÌNH

- **Mô hình kiểm thử**: `gemini-flash-lite-latest`.
- **Tra cứu tài liệu chính thức của Google**: Tài liệu upstream Google Gemini API cho thấy `gemini-2.0-flash-lite` có knowledge cutoff là **tháng 8/2024**; `gemini-2.5-flash-lite` có cutoff là **tháng 1/2025**. Tuy nhiên, bí danh rolling alias `gemini-flash-lite-latest` không công bố ngày cutoff tĩnh cố định (**không rõ**).
- **Rủi ro rò rỉ dữ liệu (Data Leakage)**: Đề thi và đáp án tốt nghiệp THPT 2026 được Bộ GD&ĐT công bố ngày 19/06/2026. Nếu bản checkpoint nền của `gemini-flash-lite-latest` được huấn luyện sau thời điểm này, mô hình có thể đã ghi nhớ đề thi. Điều này dẫn đến nguy cơ baseline 'Không RAG' (No RAG) đạt điểm cao giả tạo, làm sai lệch (thu hẹp) mức độ đóng góp thực tế của RAG (RAG lift). Nhóm nghiên cứu bắt buộc phải công bố rủi ro này trong báo cáo khoa học.

## 2. CHANGELOG ĐỀ XUẤT (v1.3.0 -> v1.4.0)

- **Thực trạng nhóm `in_scope_numerical` cũ (30 câu)**:
  - Kiểm toán phát hiện 7/30 câu (ABL_IN_NUM_01, 02, 06, 07, 08, 09, 10) thực chất là câu hỏi định tính / lý thuyết Sinh học, không chứa phép tính số học.
  - Toàn bộ 30 câu cũ chỉ ghi nguồn 'SGK' chung chung, không có mã đề, số câu hoặc văn bản nguồn kiểm chứng độc lập.
- **Phương án đề xuất v1.4.0**:
  - Đề xuất thay thế bằng danh sách câu hỏi chính thức từ Đề thi tốt nghiệp THPT 2026.
  - Báo cáo trung thực: Trong toàn bộ đề thi THPT 2026, số câu trả lời ngắn số học thực sự là **20 câu** (Toán 5 câu, Lý 6 câu, Hóa 4 câu, Sinh 4 câu; còn lại 2 câu Hóa và 2 câu Sinh là mã ghép nối/thứ tự). Bổ sung thêm 4 câu trắc nghiệm số học từ Phần I Toán để đạt **24 câu tính toán độc lập (`computed_independent`)**.
  - Toàn bộ 24 câu số học này đã được kiểm chứng tính toán độc lập bằng code Python chuẩn (24/24 khớp).

## 3. BẢNG ĐỀ XUẤT THAY THẾ 30 CÂU in_scope_numerical (CHƯA PHÊ DUYỆT)

| STT | ID Cũ | ID Mới Đề xuất | Môn | Dạng câu | Đáp án chính thức | Nguồn gốc | Độ phủ kho 303 chunk | Người kiểm [ ] |
| :---: | :--- | :--- | :---: | :--- | :---: | :--- | :---: | :---: |
| 1 | `ABL_IN_NUM_01` | `CAND_MATH_01` | toan | Phần III (Trả lời ngắn) | **5,91** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0115) | trong kho | [ ] |
| 2 | `ABL_IN_NUM_02` | `CAND_MATH_02` | toan | Phần III (Trả lời ngắn) | **1275** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0115) | ngoài kho | [ ] |
| 3 | `ABL_IN_NUM_03` | `CAND_MATH_03` | toan | Phần III (Trả lời ngắn) | **1856** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0115) | trong kho | [ ] |
| 4 | `ABL_IN_NUM_04` | `CAND_MATH_04` | toan | Phần III (Trả lời ngắn) | **7,35** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0115) | trong kho | [ ] |
| 5 | `ABL_IN_NUM_05` | `CAND_MATH_05` | toan | Phần III (Trả lời ngắn) | **1990** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0115) | trong kho | [ ] |
| 6 | `ABL_IN_NUM_06` | `CAND_MATH_06` | toan | Phần I (Trắc nghiệm) | **B. (1; 0)** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0115) | trong kho | [ ] |
| 7 | `ABL_IN_NUM_07` | `CAND_MATH_07` | toan | Phần I (Trắc nghiệm) | **B. x = 4** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0115) | trong kho | [ ] |
| 8 | `ABL_IN_NUM_08` | `CAND_MATH_08` | toan | Phần I (Trắc nghiệm) | **C. 0,2** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0115) | trong kho | [ ] |
| 9 | `ABL_IN_NUM_09` | `CAND_MATH_09` | toan | Phần I (Trắc nghiệm) | **B. (2; -2; 0)** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0115) | trong kho | [ ] |
| 10 | `ABL_IN_NUM_10` | `CAND_MATH_10` | toan | Phần I (Trắc nghiệm) | **A. 4** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0115) | trong kho | [ ] |
| 11 | `ABL_IN_NUM_11` | `CAND_PHYS_01` | ly | Phần III (Trả lời ngắn) | **0,12** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0214) | trong kho | [ ] |
| 12 | `ABL_IN_NUM_12` | `CAND_PHYS_02` | ly | Phần III (Trả lời ngắn) | **7,06** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0214) | trong kho | [ ] |
| 13 | `ABL_IN_NUM_13` | `CAND_PHYS_03` | ly | Phần III (Trả lời ngắn) | **11,8** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0214) | trong kho | [ ] |
| 14 | `ABL_IN_NUM_14` | `CAND_PHYS_04` | ly | Phần III (Trả lời ngắn) | **10,6** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0214) | trong kho | [ ] |
| 15 | `ABL_IN_NUM_15` | `CAND_PHYS_05` | ly | Phần III (Trả lời ngắn) | **2,67** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0214) | trong kho | [ ] |
| 16 | `ABL_IN_NUM_16` | `CAND_PHYS_06` | ly | Phần III (Trả lời ngắn) | **0,13** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0214) | trong kho | [ ] |
| 17 | `ABL_IN_NUM_17` | `CAND_PHYS_07` | ly | Phần I (Trắc nghiệm) | **A. sự nóng chảy** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0214) | trong kho | [ ] |
| 18 | `ABL_IN_NUM_18` | `CAND_PHYS_08` | ly | Phần I (Trắc nghiệm) | **D. áp suất của khối khí giảm** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0214) | trong kho | [ ] |
| 19 | `ABL_IN_NUM_19` | `CAND_CHEM_01` | hoa | Phần III (Trả lời ngắn) | **17,2** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0340) | một phần | [ ] |
| 20 | `ABL_IN_NUM_20` | `CAND_CHEM_02` | hoa | Phần III (Trả lời ngắn) | **42,9** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0340) | trong kho | [ ] |
| 21 | `ABL_IN_NUM_21` | `CAND_CHEM_03` | hoa | Phần III (Trả lời ngắn) | **3412** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0340) | trong kho | [ ] |
| 22 | `ABL_IN_NUM_22` | `CAND_CHEM_04` | hoa | Phần III (Trả lời ngắn) | **0,64** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0340) | trong kho | [ ] |
| 23 | `ABL_IN_NUM_23` | `CAND_CHEM_05` | hoa | Phần III (Trả lời ngắn) | **4,95** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0340) | một phần | [ ] |
| 24 | `ABL_IN_NUM_24` | `CAND_CHEM_06` | hoa | Phần III (Trả lời ngắn) | **1256** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0340) | trong kho | [ ] |
| 25 | `ABL_IN_NUM_25` | `CAND_BIO_01` | sinh | Phần III (Trả lời ngắn) | **1600** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0431) | trong kho | [ ] |
| 26 | `ABL_IN_NUM_26` | `CAND_BIO_02` | sinh | Phần III (Trả lời ngắn) | **0,31** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0431) | trong kho | [ ] |
| 27 | `ABL_IN_NUM_27` | `CAND_BIO_03` | sinh | Phần III (Trả lời ngắn) | **0,25** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0431) | trong kho | [ ] |
| 28 | `ABL_IN_NUM_28` | `CAND_BIO_04` | sinh | Phần III (Trả lời ngắn) | **0,17** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0431) | trong kho | [ ] |
| 29 | `ABL_IN_NUM_29` | `CAND_BIO_05` | sinh | Phần III (Trả lời ngắn) | **4132** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0431) | trong kho | [ ] |
| 30 | `ABL_IN_NUM_30` | `CAND_BIO_06` | sinh | Phần III (Trả lời ngắn) | **2603** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0431) | trong kho | [ ] |

## 4. DANH SÁCH 10 CÂU DỰ PHÒNG CHÍNH THỨC

| STT | ID Dự phòng | Môn | Dạng câu | Số câu | Đáp án | Nguồn |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 1 | `CAND_MATH_11` | toan | Phần I (Trắc nghiệm) | Phần I - Câu 9 | **A. D'C'** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0115) |
| 2 | `CAND_CHEM_07` | hoa | Phần I (Trắc nghiệm) | Phần I - Câu 13 | **D. 1** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0340) |
| 3 | `CAND_CHEM_08` | hoa | Phần I (Trắc nghiệm) | Phần I - Câu 17 | **A. số neutron** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0340) |
| 4 | `CAND_CHEM_09` | hoa | Phần I (Trắc nghiệm) | Phần I - Câu 18 | **C. Au** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0340) |
| 5 | `CAND_CHEM_10` | hoa | Phần I (Trắc nghiệm) | Phần I - Câu 2 | **D. CH2=CH-CH3** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0340) |
| 6 | `CAND_PHYS_09` | ly | Phần I (Trắc nghiệm) | Phần I - Câu 5 | **C. chống lại sự biến thiên của từ thông qua mạch** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0214) |
| 7 | `CAND_PHYS_10` | ly | Phần I (Trắc nghiệm) | Phần I - Câu 7 | **C. Cường độ dòng điện biến thiên theo thời gian theo định luật dạng sin (hoặc cosin)** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0214) |
| 8 | `CAND_BIO_07` | sinh | Phần I (Trắc nghiệm) | Phần I - Câu 10 | **C. Ti thể** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0431) |
| 9 | `CAND_PHYS_11` | ly | Phần I (Trắc nghiệm) | Phần I - Câu 8 | **C. hạt nhân X bền vững hơn hạt nhân Y** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0214) |
| 10 | `CAND_BIO_09` | sinh | Phần I (Trắc nghiệm) | Phần I - Câu 5 | **A. Tiêu hóa thức ăn** | Đề thi tốt nghiệp THPT năm 2026 (Mã 0431) |