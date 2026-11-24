# TỔNG HỢP 40 CÂU HỎI ỨNG VIÊN TỪ ĐỀ THI TỐT NGHIỆP THPT NĂM 2026

> [!NOTE]
> Tài liệu này tổng hợp toàn bộ 40 câu hỏi ứng viên được trích xuất trực tiếp từ đề thi chính thức kỳ thi tốt nghiệp THPT năm 2026 của Bộ Giáo dục và Đào tạo (ngày công bố: 19/06/2026).
> Dữ liệu bao gồm 30 câu đề xuất thay thế cho nhóm `in_scope_numerical` và 10 câu dự phòng, kèm phân loại phương pháp kiểm chứng, công thức tính toán độc lập, và đối chiếu độ phủ với kho tri thức 303 chunk.

## 1. THỐNG KÊ PHÂN BỐ VÀ PHÂN LOẠI

- **Tổng số câu ứng viên**: 40 câu.
- **Phân loại phương pháp kiểm chứng**:
  - `computed_independent` (Kiểm chứng tính toán độc lập từ dữ kiện đề bài): **24 câu** (10 Toán, 6 Vật lý, 4 Hóa học, 4 Sinh học). Khớp 24/24.
  - `logic_or_knowledge_check` (Đối chiếu thứ tự quy trình / nhận diện mã / khái niệm): **16 câu** (1 Toán, 5 Vật lý, 6 Hóa học, 4 Sinh học).
- **Phân loại độ phủ kho tri thức 303 chunk**:
  - `trong kho`: 37 câu.
  - `một phần`: 2 câu (CAND_CHEM_01: tính khoáng xi măng Portland Bogue; CAND_CHEM_05: cân bằng ẩm sấy đường).
  - `ngoài kho`: 1 câu (CAND_MATH_02: giải hệ phương trình 3 ẩn, kho chỉ có bất phương trình 2 ẩn).

## 2. BẢNG CHI TIẾT 40 CÂU ỨNG VIÊN

### 1. [CAND_MATH_01] TOAN - Phần III - Câu 1 (Phần III (Trả lời ngắn))
- **Mã đề**: 0115 (Đề) / 0115 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Để chế tác một hạt cườm, người ta lấy một khối vật thể có dạng một khối tròn xoay được tạo thành khi quay hình phẳng giới hạn bởi trục Ox và nửa trên của elip x^2 / 1,5^2 + y^2 / 1^2 = 1 (một đơn vị dài trên mỗi trục tọa độ tương ứng với một xăng-ti-mét trong thực tế) quanh trục Ox; sau đó khoan dọc theo trục xoay. Lỗ khoan có dạng hình trụ với bán kính 0,2cm và có trục nằm trên trục xoay. Phần còn lại sau khi khoan là hạt cườm, có dạng một khối tròn xoay. Thể tích của hạt cườm đó bằng bao nhiêu xăng-ti-mét khối (không làm tròn kết quả các phép tính trung gian, chỉ làm tròn kết quả cuối cùng đến hàng phần trăm)?
- **Đáp án chính thức**: **5,91**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `5.91`
- **Ghi chú tính toán**: Tích phân thể tích tròn xoay: V = 2 * pi * int_0^{sqrt(2.16)} (0.96 - x^2/2.25) dx = 5.9100... Làm tròn 5,91.
- **Độ tin cậy OCR**: cao (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `toan-12-228`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Thể tích khối tròn xoay tạo thành khi quay hình phẳng giới hạn bởi y = f(x), trục Ox quanh Ox: V = pi*int[f(x)]^2dx"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_MATH_01_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_MATH_01_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://vietnamnet.vn/de-thi-mon-toan-thi-tot-nghiep-thpt-nam-2026-2524242.html)

### 2. [CAND_MATH_02] TOAN - Phần III - Câu 2 (Phần III (Trả lời ngắn))
- **Mã đề**: 0115 (Đề) / 0115 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Một nông trại cung cấp rau quả cho siêu thị A với số liệu bán hàng của bốn ngày trong tuần được ghi lại trong bảng sau: Thứ Tư: 19 kg rau muống, 14 kg bí xanh, 10 kg cà chua, tổng số tiền 600 nghìn đồng; Thứ Năm: 20 kg rau muống, 12 kg bí xanh, 8 kg cà chua, tổng số tiền 540 nghìn đồng; Thứ Sáu: 25 kg rau muống, 12 kg bí xanh, 7 kg cà chua, tổng số tiền 570 nghìn đồng; Thứ Bảy: 50 kg rau muống, 25 kg bí xanh, 20 kg cà chua, tổng số tiền ? nghìn đồng. Biết rằng đơn giá theo ki-lô-gam của mỗi loại rau quả trong bảng trên là không đổi. Tổng số tiền nông trại thu được ở ngày thứ Bảy từ ba loại rau quả trên khi cung cấp cho siêu thị A là bao nhiêu nghìn đồng?
- **Đáp án chính thức**: **1275**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `1275`
- **Ghi chú tính toán**: Hệ phương trình 3 ẩn: [19,14,10]*X=600; [20,12,8]*X=540; [25,12,7]*X=570 => đơn giá X = [10, 15, 20]. Thứ Bảy = 50*10 + 25*15 + 20*20 = 1275 nghìn đồng.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `ngoài kho` | Chunk đối chiếu: `toan-10-169`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Bất phương trình bậc nhất hai ẩn x, y có dạng ax + by < c (hoặc <=, >, >=)"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_MATH_02_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_MATH_02_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://vietnamnet.vn/de-thi-mon-toan-thi-tot-nghiep-thpt-nam-2026-2524242.html)

### 3. [CAND_MATH_03] TOAN - Phần III - Câu 4 (Phần III (Trả lời ngắn))
- **Mã đề**: 0115 (Đề) / 0115 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Một khung hình trang trí có dạng một đa giác đều 12 cạnh A1A2...A12 được gắn cố định trên một trần nhà. Bạn Dũng có 12 bóng đèn gồm bốn bóng màu đỏ và tám bóng màu xanh, có công suất đôi một khác nhau. Bạn Dũng lắp ngẫu nhiên 12 bóng đèn trên vào 12 đỉnh A1, A2, ..., A12 sao cho mỗi đỉnh có đúng một bóng đèn. Gọi P là xác suất để mỗi hình vuông (có bốn đỉnh là các đỉnh của đa giác đã cho) đều có ít nhất một bóng đèn màu đỏ. Giá trị của 3190P bằng bao nhiêu?
- **Đáp án chính thức**: **1856**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `1856`
- **Ghi chú tính toán**: 12 đỉnh tạo 3 hình vuông rời nhau (mỗi hình 4 đỉnh). Chọn 4 bóng đỏ vào 3 hình vuông sao cho mỗi hình >= 1 bóng đỏ => phân phối dạng (2,1,1). Số cách = C(3,1)*C(4,2)*C(4,1)*C(4,1) = 3*6*4*4 = 288. Tổng số cách chọn 4 đỉnh = C(12,4) = 495. P = 288/495 = 32/55 => 3190 * P = 1856.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `toan-11-210`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Xác suất của biến cố A là P(A) = n(A) / n(Omega) với n(A) là số kết quả thuận lợi cho A"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_MATH_03_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_MATH_03_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://vietnamnet.vn/de-thi-mon-toan-thi-tot-nghiep-thpt-nam-2026-2524242.html)

### 4. [CAND_MATH_04] TOAN - Phần III - Câu 5 (Phần III (Trả lời ngắn))
- **Mã đề**: 0115 (Đề) / 0115 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Cho hình lập phương ABCD.MNPQ có cạnh bằng 6. Gọi E là trung điểm của đoạn thẳng AB. Khoảng cách từ điểm P đến mặt phẳng (MED) bằng bao nhiêu (không làm tròn kết quả các phép tính trung gian, chỉ làm tròn kết quả cuối cùng đến hàng phần trăm)?
- **Đáp án chính thức**: **7,35**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `7.35`
- **Ghi chú tính toán**: Gắn trục Oxyz tại D(0,0,0): M(6,0,6), E(6,3,0), D(0,0,0) => vtpt n=(1,-2,-1). P(0,6,6) => d(P,(MED)) = |0 - 12 - 6| / sqrt(6) = 18/sqrt(6) = 3*sqrt(6) = 7.348469... Làm tròn 7,35.
- **Độ tin cậy OCR**: cao (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `toan-12-232`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Khoảng cách từ điểm M0 đến mặt phẳng (P) tính theo d = |Ax0 + By0 + Cz0 + D| / sqrt(A^2 + B^2 + C^2)"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_MATH_04_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_MATH_04_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://vietnamnet.vn/de-thi-mon-toan-thi-tot-nghiep-thpt-nam-2026-2524242.html)

### 5. [CAND_MATH_05] TOAN - Phần III - Câu 6 (Phần III (Trả lời ngắn))
- **Mã đề**: 0115 (Đề) / 0115 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Một công ty nông sản có công suất chế biến không quá 200 tấn nguyên liệu một tháng. Nếu công ty chế biến x tấn nguyên liệu trong một tháng (1 <= x <= 200) thì chi phí sản xuất và doanh thu lần lượt là C(x) = 0,001x^3 + 30x + 10 (triệu đồng) và R(x) = 60x (triệu đồng). Lợi nhuận lớn nhất mà công ty đạt được trong một tháng là bao nhiêu triệu đồng?
- **Đáp án chính thức**: **1990**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `1990`
- **Ghi chú tính toán**: Hàm lợi nhuận P(x) = R(x) - C(x) = -0.001*x^3 + 30*x - 10. P'(x) = -0.003*x^2 + 30 = 0 => x = 100. P(100) = -1000 + 3000 - 10 = 1990 triệu đồng.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `toan-12-211`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Điểm x0 là điểm cực đại của hàm số f(x) nếu f'(x0) = 0 và đạo hàm f'(x) đổi dấu từ dương sang âm"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_MATH_05_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_MATH_05_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://vietnamnet.vn/de-thi-mon-toan-thi-tot-nghiep-thpt-nam-2026-2524242.html)

### 6. [CAND_MATH_06] TOAN - Phần I - Câu 2 (Phần I (Trắc nghiệm))
- **Mã đề**: 0115 (Đề) / 0115 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Cặp số nào sau đây là nghiệm của hệ bất phương trình { x + y - 3 < 0, x - y + 1 > 0 }? A. (0; 2). B. (1; 0). C. (-1; 1). D. (1; 2).
- **Đáp án chính thức**: **B. (1; 0)**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `B. (1; 0)`
- **Ghi chú tính toán**: Thay (1; 0): 1 + 0 - 3 = -2 < 0 (thỏa); 1 - 0 + 1 = 2 > 0 (thỏa). Đáp án B.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `toan-10-170`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Cặp số (x0, y0) là nghiệm của hệ bất phương trình nếu nó là nghiệm của tất cả các bất phương trình trong hệ"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_MATH_06_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_MATH_06_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://vietnamnet.vn/de-thi-mon-toan-thi-tot-nghiep-thpt-nam-2026-2524242.html)

### 7. [CAND_MATH_07] TOAN - Phần I - Câu 4 (Phần I (Trắc nghiệm))
- **Mã đề**: 0115 (Đề) / 0115 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Nghiệm của phương trình log_3(x - 1) = 1 là: A. x = 3. B. x = 4. C. x = 5. D. x = 2.
- **Đáp án chính thức**: **B. x = 4**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `B. x = 4`
- **Ghi chú tính toán**: log_3(x - 1) = 1 <=> x - 1 = 3 <=> x = 4. Đáp án B.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `toan-12-220`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Phương trình log_a(f(x)) = b tương đương với f(x) = a^b (với a > 0, a != 1)"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_MATH_07_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_MATH_07_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://vietnamnet.vn/de-thi-mon-toan-thi-tot-nghiep-thpt-nam-2026-2524242.html)

### 8. [CAND_MATH_08] TOAN - Phần I - Câu 5 (Phần I (Trắc nghiệm))
- **Mã đề**: 0115 (Đề) / 0115 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Cho hai biến cố độc lập A và B có xác suất thỏa mãn P(A) = 0,5 và P(B) = 0,4. Giá trị của P(AB) bằng: A. 0,9. B. 0,8. C. 0,2. D. 0,1.
- **Đáp án chính thức**: **C. 0,2**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `C. 0,2`
- **Ghi chú tính toán**: Do A và B độc lập: P(AB) = P(A) * P(B) = 0.5 * 0.4 = 0.2. Đáp án C.
- **Độ tin cậy OCR**: cao (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `toan-11-210`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Hai biến cố A và B là độc lập khi và chỉ khi P(AB) = P(A) * P(B)"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_MATH_08_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_MATH_08_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://vietnamnet.vn/de-thi-mon-toan-thi-tot-nghiep-thpt-nam-2026-2524242.html)

### 9. [CAND_MATH_09] TOAN - Phần I - Câu 7 (Phần I (Trắc nghiệm))
- **Mã đề**: 0115 (Đề) / 0115 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Trong không gian với hệ tọa độ Oxyz, cho hai điểm A(1; 5; 1) và B(3; 3; 1). Vectơ AB có tọa độ là: A. (4; 8; 2). B. (2; -2; 0). C. (2; 4; 1). D. (-2; 2; 0).
- **Đáp án chính thức**: **B. (2; -2; 0)**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `B. (2; -2; 0)`
- **Ghi chú tính toán**: AB = (3-1, 3-5, 1-1) = (2, -2, 0). Đáp án B.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `toan-12-230`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Cho hai điểm A và B, vectơ AB có tọa độ là (xB - xA, yB - yA, zB - zA)"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_MATH_09_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_MATH_09_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://vietnamnet.vn/de-thi-mon-toan-thi-tot-nghiep-thpt-nam-2026-2524242.html)

### 10. [CAND_MATH_10] TOAN - Phần I - Câu 12 (Phần I (Trắc nghiệm))
- **Mã đề**: 0115 (Đề) / 0115 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Cho cấp số cộng (u_n) có u_1 = 5 và công sai d = -1. Giá trị của u_2 bằng: A. 4. B. 5. C. -5. D. -4.
- **Đáp án chính thức**: **A. 4**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `A. 4`
- **Ghi chú tính toán**: u_2 = u_1 + d = 5 + (-1) = 4. Đáp án A.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `toan-11-196`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Cấp số cộng là dãy số mà u_{n+1} = u_n + d với mọi n >= 1, d là công sai"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_MATH_10_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_MATH_10_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://vietnamnet.vn/de-thi-mon-toan-thi-tot-nghiep-thpt-nam-2026-2524242.html)

### 11. [CAND_MATH_11] TOAN - Phần I - Câu 9 (Phần I (Trắc nghiệm))
- **Mã đề**: 0115 (Đề) / 0115 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Cho hình lập phương ABCD.A'B'C'D'. Vectơ nào sau đây bằng vectơ AB? A. D'C'. B. AD. C. AA'. D. CD.
- **Đáp án chính thức**: **A. D'C'**
- **Phương pháp kiểm chứng**: `logic_or_knowledge_check`
- **Ghi chú phân tích**: Trong hình lập phương, vectơ AB = vectơ DC = vectơ A'B' = vectơ D'C'. Đáp án A.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `toan-10-178`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Hai vectơ được gọi là bằng nhau nếu chúng có cùng hướng và cùng độ dài"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_MATH_11_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_MATH_11_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://vietnamnet.vn/de-thi-mon-toan-thi-tot-nghiep-thpt-nam-2026-2524242.html)

### 12. [CAND_CHEM_01] HOA - Phần III - Câu 1 (Phần III (Trả lời ngắn))
- **Mã đề**: 0340 (Đề) / 0340 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Xi măng Portland có thành phần được biểu diễn như sau: 3CaO.Al2O3 (kí hiệu là C3A), 2CaO.SiO2 (kí hiệu là C2S), 3CaO.SiO2 (kí hiệu là C3S), 4CaO.Al2O3.Fe2O3 (kí hiệu là C4AF), CaSO4 (hay CaO.SO3), còn lại là phụ gia. Thành phần của một loại xi măng Portland quy đổi về % khối lượng các chất được cho trong bảng sau: CaO (67,76%), SiO2 (22,20%), Al2O3 (5,61%), Fe2O3 (2,40%), SO3 (1,60%), Phụ gia (0,43%). Phần trăm theo khối lượng của 2CaO.SiO2 (C2S) trong loại xi măng Portland trên là x %. Xác định giá trị của x (không làm tròn kết quả các phép tính trung gian, chỉ làm tròn kết quả cuối cùng tới hàng phần mười).
- **Đáp án chính thức**: **17,2**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `17.2`
- **Ghi chú tính toán**: Định luật bảo toàn nguyên tố/khối lượng khoáng: n(C4AF)=0.015, n(C3A)=0.040, n(CaSO4)=0.020. n(CaO tác dụng silicate)=1.010 mol. Hệ n(SiO2)=a+b=0.370 và 2a+3b=1.010 => a=n(C2S)=0.100 mol. %C2S = 0.100 * 172 = 17.2%. Khớp 17,2.
- **Độ tin cậy OCR**: cao (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `một phần` | Chunk đối chiếu: `hoa-12-071`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Các hợp chất canxi gồm CaO, Ca(OH)2, CaCO3, CaSO4 ứng dụng trong sản xuất xi măng và vật liệu xây dựng"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_CHEM_01_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_CHEM_01_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Hoa-hoc-pdf.pdf)

### 13. [CAND_CHEM_02] HOA - Phần III - Câu 2 (Phần III (Trả lời ngắn))
- **Mã đề**: 0340 (Đề) / 0340 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Một nhà máy sản xuất ammonia theo phương pháp Haber – Bosch. Để thu được nitrogen (N2) và hydrogen (H2) từ methane, không khí và nước, các giai đoạn chính được thực hiện như sau: Giai đoạn 1: Cho hỗn hợp gồm khí methane và hơi nước với tỉ lệ mol tương ứng là 1 : 3 qua tháp phản ứng chứa xúc tác ở 900 oC, xảy ra phản ứng CH4(g) + H2O(g) -> CO(g) + 3H2(g). Hiệu suất chuyển hoá CH4 ở giai đoạn này là h %. Giai đoạn 2: Hỗn hợp thu được sau giai đoạn 1 được trộn với không khí (chứa 80 % N2 và 20 % O2 theo thể tích) để oxi hoá hết methane theo phản ứng: 2CH4(g) + O2(g) -> 2CO(g) + 4H2(g). Giai đoạn 3: Trộn hỗn hợp thu được sau giai đoạn 2 với hơi nước dư để oxi hoá hết CO thành CO2 theo phản ứng: CO(g) + H2O(g) -> CO2(g) + H2(g). Giai đoạn 4: Dẫn hỗn hợp thu được sau giai đoạn 3 vào tháp hấp thụ để tách CO2 và hơi nước. Hỗn hợp khí còn lại chỉ gồm N2 và H2 với tỉ lệ mol tương ứng là 1 : 3 được sử dụng để tổng hợp ammonia. Coi các phản ứng khác xảy ra không đáng kể. Xác định giá trị của h (làm tròn kết quả tới hàng phần mười).
- **Đáp án chính thức**: **42,9**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `42.9`
- **Ghi chú tính toán**: 1 mol CH4: Sau GĐ1 còn (1-h) mol CH4. GĐ2 cần (1-h)/2 mol O2 => n(N2) = 2(1-h) mol. Tổng CO = 1 mol. GĐ3 CO -> H2 thêm 1 mol => Tổng H2 = 3 + h. Tỉ lệ N2:H2 = 1:3 => 3+h = 3*[2(1-h)] = 6 - 6h => 7h = 3 => h = 3/7 = 42.857% => Làm tròn 42,9.
- **Độ tin cậy OCR**: cao (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `hoa-11-040`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Phản ứng tổng hợp ammonia: N2(g) + 3H2(g) <=> 2NH3(g), xúc tác bột sắt, nhiệt độ khoảng 450 oC"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_CHEM_02_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_CHEM_02_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Hoa-hoc-pdf.pdf)

### 14. [CAND_CHEM_03] HOA - Phần III - Câu 3 (Phần III (Trả lời ngắn))
- **Mã đề**: 0340 (Đề) / 0340 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Cho các phản ứng hoá học được đánh số như sau: (1) nCH2=CH-CN -> (-CH2-CH(CN)-)n; (2) CH2=CH2 + Br2 -> CH2Br-CH2Br; (3) C12H22O11 (saccharose) + H2O -> C6H12O6 (glucose) + C6H12O6 (fructose); (4) nH2N-[CH2]5-COOH -> (-NH-[CH2]5-C(=O)-)n + nH2O. Sắp xếp số tương ứng của mỗi phản ứng theo thứ tự: phản ứng thủy phân, phản ứng trùng ngưng, phản ứng trùng hợp và phản ứng cộng, thành bộ bốn số (ví dụ: 1234, 4321, ...).
- **Đáp án chính thức**: **3412**
- **Phương pháp kiểm chứng**: `logic_or_knowledge_check`
- **Ghi chú phân tích**: Thủy phân = (3), Trùng ngưng = (4), Trùng hợp = (1), Phản ứng cộng = (2) => Bộ 4 số: 3412.
- **Độ tin cậy OCR**: trung bình (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `hoa-11-048`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Nhận biết các cation và anion trong dung dịch dựa vào phản ứng tạo kết tủa đặc trưng"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_CHEM_03_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_CHEM_03_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Hoa-hoc-pdf.pdf)

### 15. [CAND_CHEM_04] HOA - Phần III - Câu 4 (Phần III (Trả lời ngắn))
- **Mã đề**: 0340 (Đề) / 0340 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Thế điện cực chuẩn của các cặp oxi hoá – khử Zn2+/Zn và Pb2+/Pb lần lượt là –0,763 V và –0,126 V. Tính sức điện động chuẩn (theo V) của pin Galvani tạo bởi hai cặp oxi hoá – khử trên (làm tròn kết quả tới hàng phần trăm).
- **Đáp án chính thức**: **0,64**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `0.64`
- **Ghi chú tính toán**: E_pin = E0(catot) - E0(anot) = E0(Pb2+/Pb) - E0(Zn2+/Zn) = -0.126 - (-0.763) = 0.637 V => Làm tròn hàng phần trăm: 0,64.
- **Độ tin cậy OCR**: cao (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `hoa-12-064`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Sức điện động chuẩn của pin điện hóa E^0_{pin} = E^0_{catot} - E^0_{anot} trong đó catot là cực dương, anot là âm"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_CHEM_04_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_CHEM_04_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Hoa-hoc-pdf.pdf)

### 16. [CAND_CHEM_05] HOA - Phần III - Câu 5 (Phần III (Trả lời ngắn))
- **Mã đề**: 0340 (Đề) / 0340 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Trong một nhà máy sản xuất đường saccharose, sau một số giai đoạn xử lí thu được đường ẩm (chỉ gồm saccharose và 0,90 % nước theo khối lượng). Đường ẩm được đưa vào thiết bị sấy cho tiếp xúc với dòng không khí nóng (chứa 1,00 % nước theo khối lượng). Tỉ lệ khối lượng không khí nóng : đường ẩm là 3 : 1. Trong quá trình sấy, chỉ xảy ra sự bay hơi của nước từ đường ẩm vào dòng không khí nóng. Sau khi sấy, dòng không khí nóng thoát ra khỏi thiết bị chứa 1,28 % nước theo khối lượng và thu được đường chứa a x 10^-2 % nước theo khối lượng. Xác định giá trị của a (không làm tròn kết quả các phép tính trung gian, chỉ làm tròn kết quả cuối cùng tới hàng phần trăm).
- **Đáp án chính thức**: **4,95**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `4.95`
- **Ghi chú tính toán**: Cân bằng vật chất: 100 kg đường ẩm (0.9kg nước, 99.1kg đường khô), 300 kg khí nóng (3kg nước, 297kg khí khô). Khí ra chứa 1.28% nước => m_nuoc_ra = 3.85089 kg. Nước bay hơi = 0.85089 kg. Nước còn lại = 0.049108 kg. % nước trong đường = 0.049529% => a = 4.9529 => làm tròn 4,95.
- **Độ tin cậy OCR**: cao (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `một phần` | Chunk đối chiếu: `hoa-12-058`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Saccharose là chất rắn kết tinh màu trắng, tan tốt trong nước, có nhiều trong mía, củ cải đường"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_CHEM_05_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_CHEM_05_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Hoa-hoc-pdf.pdf)

### 17. [CAND_CHEM_06] HOA - Phần III - Câu 6 (Phần III (Trả lời ngắn))
- **Mã đề**: 0340 (Đề) / 0340 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Cho các chất được đánh số như sau: (1) methyl acetate; (2) propyl acetate; (3) sodium formate; (4) sodium palmitate; (5) methyl methacrylate; (6) methyl formate. Liệt kê theo trình tự từ nhỏ đến lớn các số ứng với tất cả các chất là ester (ví dụ: 56, 124, 3456, ...).
- **Đáp án chính thức**: **1256**
- **Phương pháp kiểm chứng**: `logic_or_knowledge_check`
- **Ghi chú phân tích**: Các ester gồm: (1) methyl acetate, (2) propyl acetate, (5) methyl methacrylate, (6) methyl formate. (3) và (4) là muối carboxylate. Dãy số: 1256.
- **Độ tin cậy OCR**: trung bình (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `hoa-12-055`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Aldehyde tham gia phản ứng tráng bạc với thuốc thử Tollens tạo kết tủa kim loại bạc bám trên thành ống nghiệm"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_CHEM_06_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_CHEM_06_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Hoa-hoc-pdf.pdf)

### 18. [CAND_CHEM_07] HOA - Phần I - Câu 13 (Phần I (Trắc nghiệm))
- **Mã đề**: 0340 (Đề) / 0340 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Ở 25 °C, một mẫu nước (mẫu X) có pH = 6,5. Để làm giảm độ đục của X, người ta cho vào X một lượng phèn nhôm – kali. Cho các phát biểu sau: (a) Mẫu X có môi trường acid; (b) Sự có mặt của các ion K+ và Al3+ làm cho nước có tính cứng toàn phần; (c) Nếu thêm acid mạnh vào mẫu X thì hiệu quả làm trong nước đục của phèn nhôm – kali tăng lên; (d) Sau khi xử lí mẫu X bằng phèn nhôm – kali, nước thu được có pH = 7,5. Số phát biểu đúng là: A. 2. B. 3. C. 4. D. 1.
- **Đáp án chính thức**: **D. 1**
- **Phương pháp kiểm chứng**: `logic_or_knowledge_check`
- **Ghi chú phân tích**: Chỉ phát biểu (a) đúng (pH 6.5 < 7 môi trường acid). (b) sai vì ion cứng là Ca2+, Mg2+. (c) sai vì thêm acid chuyển dịch cân bằng giảm kết tủa Al(OH)3. (d) sai vì Al3+ thủy phân tạo H+ làm giảm pH.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `hoa-12-060`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Amine bậc một có nhóm -NH2 liên kết với gốc hydrocarbon, ví dụ methylamine, ethylamine, propylamina"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_CHEM_07_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_CHEM_07_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Hoa-hoc-pdf.pdf)

### 19. [CAND_CHEM_08] HOA - Phần I - Câu 17 (Phần I (Trắc nghiệm))
- **Mã đề**: 0340 (Đề) / 0340 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Các đồng vị của một nguyên tố hoá học là những nguyên tử có cùng số proton nhưng khác nhau ...(1).... Nội dung phù hợp trong chỗ trống (1) là: A. số neutron. B. điện tích hạt nhân. C. số electron. D. số hiệu nguyên tử.
- **Đáp án chính thức**: **A. số neutron**
- **Phương pháp kiểm chứng**: `logic_or_knowledge_check`
- **Ghi chú phân tích**: Định nghĩa đồng vị: cùng số proton (Z) nhưng khác nhau về số neutron (N). Đáp án A.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `hoa-10-002`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Đồng vị là các nguyên tử có cùng số proton nhưng khác nhau về số neutron, có số khối khác nhau"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_CHEM_08_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_CHEM_08_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Hoa-hoc-pdf.pdf)

### 20. [CAND_CHEM_09] HOA - Phần I - Câu 18 (Phần I (Trắc nghiệm))
- **Mã đề**: 0340 (Đề) / 0340 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Kim loại nào sau đây không tan trong dung dịch HCl 0,10 M? A. Zn. B. Al. C. Au. D. Mg.
- **Đáp án chính thức**: **C. Au**
- **Phương pháp kiểm chứng**: `logic_or_knowledge_check`
- **Ghi chú phân tích**: Au đứng sau H trong dãy hoạt động hóa học nên không phản ứng với HCl. Đáp án C.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `hoa-12-063`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Trong dãy điện hóa, kim loại đứng sau có tính khử yếu hơn; vàng Au đứng cuối cùng có tính khử rất yếu"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_CHEM_09_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_CHEM_09_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Hoa-hoc-pdf.pdf)

### 21. [CAND_CHEM_10] HOA - Phần I - Câu 2 (Phần I (Trắc nghiệm))
- **Mã đề**: 0340 (Đề) / 0340 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Polypropylene được điều chế bằng phản ứng trùng hợp chất nào sau đây? A. CH2=CH-Cl. B. CH2=CH2. C. CH3-CH2-Cl. D. CH2=CH-CH3.
- **Đáp án chính thức**: **D. CH2=CH-CH3**
- **Phương pháp kiểm chứng**: `logic_or_knowledge_check`
- **Ghi chú phân tích**: Polypropylene trùng hợp từ propylene CH2=CH-CH3. Đáp án D.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `hoa-11-043`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Alkene là hydrocarbon không no mạch hở có một liên kết đôi C=C, công thức chung CnH2n (n >= 2)"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_CHEM_10_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_CHEM_10_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Hoa-hoc-pdf.pdf)

### 22. [CAND_PHYS_01] LY - Phần III - Câu 1 (Phần III (Trả lời ngắn))
- **Mã đề**: 0214 (Đề) / 0214 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Một pin hạt nhân sử dụng đồng vị phóng xạ plutonium 238_94Pu với hằng số phóng xạ lambda = 2,50 x 10^-10 s^-1 để cung cấp năng lượng cho xe tự hành trên Hỏa Tinh. Tại thời điểm đưa vào sử dụng để phát điện (thời điểm ban đầu), pin hạt nhân này chứa 8,60 x 10^24 hạt nhân 238_94Pu. Biết mỗi phân rã hạt nhân 238_94Pu toả ra năng lượng là 8,97 x 10^-13 J và toàn bộ năng lượng này biến thành nhiệt. Trong đó, chỉ có 6,20 % năng lượng nhiệt chuyển thành năng lượng điện. Biết một năm có 365 ngày, một ngày có 86400 s. Năng lượng điện do pin cung cấp trong giây đầu tiên tính từ thời điểm ban đầu là bao nhiêu kilôjun (kJ) (làm tròn kết quả đến chữ số hàng phần trăm)?
- **Đáp án chính thức**: **0,12**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `0.12`
- **Ghi chú tính toán**: Số phân rã trong 1s: delta_N = N0 * lambda * 1 = 8.60e24 * 2.50e-10 = 2.15e15 hạt. Nhiệt tỏa ra: Q = 2.15e15 * 8.97e-13 J = 1928.55 J. Năng lượng điện: W = 1928.55 * 6.20% = 119.57 J = 0.11957 kJ => Làm tròn 0,12.
- **Độ tin cậy OCR**: cao (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `ly-12-160`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Số hạt nhân bị phân rã sau khoảng thời gian delta t nhỏ tính theo delta N = N * lambda * delta t"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_PHYS_01_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_PHYS_01_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Vat-ly-pdf.pdf)

### 23. [CAND_PHYS_02] LY - Phần III - Câu 2 (Phần III (Trả lời ngắn))
- **Mã đề**: 0214 (Đề) / 0214 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Một pin hạt nhân sử dụng đồng vị phóng xạ plutonium 238_94Pu với hằng số phóng xạ lambda = 2,50 x 10^-10 s^-1 để cung cấp năng lượng cho xe tự hành trên Hỏa Tinh. Tại thời điểm đưa vào sử dụng để phát điện (thời điểm ban đầu), pin hạt nhân này chứa 8,60 x 10^24 hạt nhân 238_94Pu. Biết một năm có 365 ngày, một ngày có 86400 s. Ở thời điểm t = 25,0 năm kể từ thời điểm ban đầu, số lượng hạt nhân 238_94Pu chưa phân rã trong pin là x . 10^24 hạt nhân. Tìm x (làm tròn kết quả đến chữ số hàng phần trăm)?
- **Đáp án chính thức**: **7,06**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `7.06`
- **Ghi chú tính toán**: t = 25 * 365 * 86400 = 7.884e8 s. lambda * t = 2.50e-10 * 7.884e8 = 0.1971. N(t) = 8.60e24 * exp(-0.1971) = 7.0615e24 hạt => x = 7,06.
- **Độ tin cậy OCR**: cao (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `ly-12-161`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Định luật phóng xạ: Số hạt nhân còn lại sau thời gian t là N(t) = N0 * e^(-lambda * t)"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_PHYS_02_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_PHYS_02_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Vat-ly-pdf.pdf)

### 24. [CAND_PHYS_03] LY - Phần III - Câu 3 (Phần III (Trả lời ngắn))
- **Mã đề**: 0214 (Đề) / 0214 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Trước khi khởi hành, người lái xe điều chỉnh áp suất khí trong lốp xe ô tô về giá trị khuyến nghị của nhà sản xuất. Khi đó, nhiệt độ của khí trong lốp xe là 14,5 °C. Sau khi lái xe được một quãng đường, cảm biến cho biết nhiệt độ của khí trong lốp là 48,5 °C. Coi khí trong lốp xe là khí lí tưởng và thể tích lốp xe không thay đổi. Lấy T(K) = t(°C) + 273. Áp suất khí trong lốp xe đã tăng thêm bao nhiêu phần trăm so với giá trị khuyến nghị (làm tròn kết quả đến chữ số hàng phần mười)?
- **Đáp án chính thức**: **11,8**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `11.8`
- **Ghi chú tính toán**: T1 = 14.5 + 273 = 287.5 K; T2 = 48.5 + 273 = 321.5 K. Quá trình đẳng tích: P2/P1 = T2/T1 = 321.5 / 287.5 = 1.11826 => Delta_P / P1 = 11.826% => Làm tròn 11,8.
- **Độ tin cậy OCR**: cao (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `ly-12-132`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Trong quá trình đẳng tích của lượng khí xác định, áp suất tỉ lệ thuận nhiệt độ tuyệt đối p/T = hằng số"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_PHYS_03_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_PHYS_03_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Vat-ly-pdf.pdf)

### 25. [CAND_PHYS_04] LY - Phần III - Câu 4 (Phần III (Trả lời ngắn))
- **Mã đề**: 0214 (Đề) / 0214 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Người lái xe giảm áp suất khí trong lốp về giá trị khuyến nghị bằng cách xả bớt một lượng khí qua van. Nhiệt độ của khí trong lốp xe vẫn giữ ở mức 48,5 °C. Khối lượng khí đã được xả ra ngoài bằng bao nhiêu phần trăm khối lượng khí trong lốp xe trước khi xả (làm tròn kết quả đến chữ số hàng phần mười)?
- **Đáp án chính thức**: **10,6**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `10.6`
- **Ghi chú tính toán**: V và T không đổi => m tỉ lệ thuận với P. m_sau / m_truoc = P1 / P2 = 287.5 / 321.5 = 0.89425 => delta_m / m_truoc = 1 - 0.89425 = 10.575% => Làm tròn 10,6.
- **Độ tin cậy OCR**: cao (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `ly-12-131`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Phương trình trạng thái khí lí tưởng pV = (m/M)RT mô tả liên hệ giữa áp suất, thể tích, nhiệt độ, khối lượng"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_PHYS_04_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_PHYS_04_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Vat-ly-pdf.pdf)

### 26. [CAND_PHYS_05] LY - Phần III - Câu 5 (Phần III (Trả lời ngắn))
- **Mã đề**: 0214 (Đề) / 0214 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Một thanh kim loại có chiều dài l = 25,0 cm chuyển động đều với tốc độ v = 55,0 cm/s dọc theo hai thanh ray kim loại song song, được nối với nhau bằng một dây dẫn ở một đầu. Hệ thống ở trong một từ trường đều có cảm ứng từ vuông góc, hướng ra khỏi mặt phẳng hình vẽ và có độ lớn B = 0,350 T. Khi đó, suất điện động cảm ứng xuất hiện trong thanh kim loại có độ lớn là |e_c| = B*l*v. Thanh kim loại có điện trở là 18,0 ôm, các thanh ray và dây nối có điện trở không đáng kể. Cường độ dòng điện trong thanh kim loại là bao nhiêu miliampe (mA) (làm tròn kết quả đến chữ số hàng phần trăm)?
- **Đáp án chính thức**: **2,67**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `2.67`
- **Ghi chú tính toán**: e_c = B*l*v = 0.350 * 0.250 * 0.550 = 0.048125 V. I = e_c / R = 0.048125 / 18.0 = 2.6736 mA => Làm tròn 2,67.
- **Độ tin cậy OCR**: cao (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `ly-11-125`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Suất điện động cảm ứng xuất hiện khi thanh kim loại chuyển động trong từ trường: e = B * v * l * sin(alpha)"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_PHYS_05_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_PHYS_05_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Vat-ly-pdf.pdf)

### 27. [CAND_PHYS_06] LY - Phần III - Câu 6 (Phần III (Trả lời ngắn))
- **Mã đề**: 0214 (Đề) / 0214 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Một thanh kim loại có chiều dài l = 25,0 cm chuyển động đều với tốc độ v = 55,0 cm/s dọc theo hai thanh ray kim loại song song trong từ trường đều B = 0,350 T vuông góc mặt phẳng. Suất điện động cảm ứng |e_c| = B*l*v, điện trở thanh là 18,0 ôm. Công suất toả nhiệt ở thanh kim loại là bao nhiêu milioát (mW) (làm tròn kết quả đến chữ số hàng phần trăm)?
- **Đáp án chính thức**: **0,13**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `0.13`
- **Ghi chú tính toán**: P = e_c^2 / R = 0.048125^2 / 18.0 = 0.00012867 W = 0.12867 mW => Làm tròn hàng phần trăm: 0,13.
- **Độ tin cậy OCR**: cao (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `ly-11-126`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Công suất tỏa nhiệt trên điện trở tính theo định luật Joule-Lenz P = I^2 * R = e^2 / R"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_PHYS_06_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_PHYS_06_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Vat-ly-pdf.pdf)

### 28. [CAND_PHYS_07] LY - Phần I - Câu 2 (Phần I (Trắc nghiệm))
- **Mã đề**: 0214 (Đề) / 0214 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Quá trình chuyển thể từ thể rắn sang thể lỏng được gọi là: A. sự nóng chảy. B. sự đông đặc. C. sự sôi. D. sự hóa hơi.
- **Đáp án chính thức**: **A. sự nóng chảy**
- **Phương pháp kiểm chứng**: `logic_or_knowledge_check`
- **Ghi chú phân tích**: Chuyển từ rắn sang lỏng là sự nóng chảy. Đáp án A.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `ly-12-130`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Quá trình chuyển từ thể rắn sang thể lỏng của một chất được gọi là sự nóng chảy"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_PHYS_07_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_PHYS_07_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Vat-ly-pdf.pdf)

### 29. [CAND_PHYS_08] LY - Phần I - Câu 4 (Phần I (Trắc nghiệm))
- **Mã đề**: 0214 (Đề) / 0214 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Khi một khối khí lí tưởng xác định giãn nở đẳng nhiệt thì: A. áp suất của khối khí không đổi. B. nội năng của khối khí giảm. C. nội năng của khối khí tăng. D. áp suất của khối khí giảm.
- **Đáp án chính thức**: **D. áp suất của khối khí giảm**
- **Phương pháp kiểm chứng**: `logic_or_knowledge_check`
- **Ghi chú phân tích**: Đẳng nhiệt P tỉ lệ nghịch với V theo định luật Boyle. Giãn nở V tăng thì P giảm. Nội năng chỉ phụ thuộc nhiệt độ nên không đổi. Đáp án D.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `ly-12-132`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Định luật Boyle: Trong quá trình đẳng nhiệt của một khối lượng khí xác định, áp suất tỉ lệ nghịch với thể tích"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_PHYS_08_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_PHYS_08_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Vat-ly-pdf.pdf)

### 30. [CAND_PHYS_09] LY - Phần I - Câu 5 (Phần I (Trắc nghiệm))
- **Mã đề**: 0214 (Đề) / 0214 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Theo định luật Lenz, dòng điện cảm ứng sinh ra trong một mạch điện kín có chiều sao cho từ trường mà nó sinh ra có tác dụng: A. làm giảm từ thông qua mạch. B. làm từ thông qua mạch bằng không. C. chống lại sự biến thiên của từ thông qua mạch. D. làm tăng từ thông qua mạch.
- **Đáp án chính thức**: **C. chống lại sự biến thiên của từ thông qua mạch**
- **Phương pháp kiểm chứng**: `logic_or_knowledge_check`
- **Ghi chú phân tích**: Định luật Lenz về chiều dòng điện cảm ứng. Đáp án C.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `ly-11-124`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Dòng điện cảm ứng có chiều sao cho từ trường do nó sinh ra có tác dụng chống lại biến thiên từ thông"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_PHYS_09_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_PHYS_09_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Vat-ly-pdf.pdf)

### 31. [CAND_PHYS_10] LY - Phần I - Câu 7 (Phần I (Trắc nghiệm))
- **Mã đề**: 0214 (Đề) / 0214 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Khi nói về dòng điện xoay chiều, phát biểu nào sau đây là đúng? A. Công suất toả nhiệt ở điện trở R tỉ lệ thuận với cường độ hiệu dụng của dòng điện qua điện trở. B. Giá trị hiệu dụng của dòng điện bằng một nửa giá trị cực đại. C. Cường độ dòng điện biến thiên theo thời gian theo định luật dạng sin (hoặc cosin). D. Giá trị hiệu dụng của điện áp bằng một nửa giá trị cực đại.
- **Đáp án chính thức**: **C. Cường độ dòng điện biến thiên theo thời gian theo định luật dạng sin (hoặc cosin)**
- **Phương pháp kiểm chứng**: `logic_or_knowledge_check`
- **Ghi chú phân tích**: Định nghĩa dòng điện xoay chiều: cường độ biến thiên điều hòa theo thời gian dạng sin/cosin. Đáp án C.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `ly-12-150`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Dòng điện xoay chiều là dòng điện có cường độ biến thiên điều hòa theo thời gian dạng sin hoặc cosin"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_PHYS_10_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_PHYS_10_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Vat-ly-pdf.pdf)

### 32. [CAND_BIO_01] SINH - Phần III - Câu 1 (Phần III (Trả lời ngắn))
- **Mã đề**: 0431 (Đề) / 0431 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Để tính kích thước quần thể cây ngải dại trong một khu vườn (100 m x 100 m), người ta đã lập 5 ô nghiên cứu được bố trí như hình bên. Biết rằng, kích thước mỗi ô là 10 m x 10 m; các số trong mỗi ô nghiên cứu thể hiện số lượng cây ngải dại đã đếm được (các số lần lượt là: 16, 14, 17, 15, 18). Kích thước của quần thể này là bao nhiêu cá thể (không làm tròn kết quả các phép tính trung gian, chỉ làm tròn kết quả cuối cùng đến số nguyên)?
- **Đáp án chính thức**: **1600**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `1600`
- **Ghi chú tính toán**: Tổng số cây trong 5 ô: 16 + 14 + 17 + 15 + 18 = 80 cây. Diện tích 5 ô = 5 * 100 m^2 = 500 m^2. Mật độ = 80 / 500 = 0.16 cây/m^2. Diện tích cả vườn = 100 * 100 = 10000 m^2. Kích thước quần thể = 0.16 * 10000 = 1600 cá thể.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `sinh-12-298`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Xác định mật độ cá thể qua các ô tiêu chuẩn ngẫu nhiên rồi nhân tổng diện tích để ước tính kích thước"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_BIO_01_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_BIO_01_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Sinh-ho-c-pdf.pdf)

### 33. [CAND_BIO_02] SINH - Phần III - Câu 2 (Phần III (Trả lời ngắn))
- **Mã đề**: 0431 (Đề) / 0431 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Ở ếch, gene mã hóa malate dehydrogenase nằm trên NST thường và có ba allele: M1, M2, M3. Một quần thể ếch có 500 cá thể, số lượng cá thể có kiểu gene tương ứng như bảng bên: M1M1: 59, M1M2: 105, M1M3: 119, M2M2: 48, M2M3: 108, M3M3: 61. Tần số allele M2 của quần thể này là bao nhiêu (không làm tròn kết quả các phép tính trung gian, chỉ làm tròn kết quả cuối cùng đến hàng phần trăm)?
- **Đáp án chính thức**: **0,31**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `0.31`
- **Ghi chú tính toán**: Tổng allele = 2 * 500 = 1000. Số allele M2 = 2*48 (M2M2) + 105 (M1M2) + 108 (M2M3) = 96 + 105 + 108 = 309. Tần số M2 = 309 / 1000 = 0.309 => Làm tròn hàng phần trăm: 0,31.
- **Độ tin cậy OCR**: cao (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `sinh-12-286`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Tần số của một allele bằng tỉ lệ giữa số lượng allele đó trên tổng số các allele của gene trong quần thể"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_BIO_02_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_BIO_02_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Sinh-ho-c-pdf.pdf)

### 34. [CAND_BIO_03] SINH - Phần III - Câu 3 (Phần III (Trả lời ngắn))
- **Mã đề**: 0431 (Đề) / 0431 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Tính trạng màu sắc hạt đậu do gene Y (gồm allele Y, y) và gene G (gồm allele G, g) phân li độc lập cùng quy định; Y_G_: hạt màu nâu, Y_gg: hạt màu vàng, yyG_: hạt màu xám, yygg: hạt màu xanh. Phép lai giữa hai cây có kiểu gene khác nhau thu được thế hệ F1 có tỉ lệ kiểu hình như sau: 3 hạt màu nâu : 1 hạt màu vàng : 3 hạt màu xám : 1 hạt màu xanh. Ở thế hệ F1, tỉ lệ hạt màu nâu có kiểu gene dị hợp ở cả hai gene này là bao nhiêu (không làm tròn kết quả các phép tính trung gian, chỉ làm tròn kết quả cuối cùng đến hàng phần trăm)?
- **Đáp án chính thức**: **0,25**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `0.25`
- **Ghi chú tính toán**: Tỉ lệ kiểu hình F1 là (3:1)(1:1). Bố mẹ: YyGg x yyGg (hoặc YyGg x Yygg). Cả hai trường hợp F1 sinh ra tỉ lệ hạt dị hợp tử 2 cặp gen YyGg = 2/8 = 1/4 = 0.25. Khớp 0,25.
- **Độ tin cậy OCR**: cao (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `sinh-12-280`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Quy luật phân li độc lập: Các cặp allele phân li độc lập và tổ hợp tự do trong thụ tinh tạo các biến dị"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_BIO_03_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_BIO_03_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Sinh-ho-c-pdf.pdf)

### 35. [CAND_BIO_04] SINH - Phần III - Câu 4 (Phần III (Trả lời ngắn))
- **Mã đề**: 0431 (Đề) / 0431 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Ở trạng thái nghỉ, nhịp tim của một người bình thường và một vận động viên điền kinh lần lượt là 70 và 50 nhịp/phút. Biết rằng, tỉ lệ khoảng thời gian diễn ra các pha nhĩ co, thất co, dãn chung của mỗi chu kì tim ở người này là như nhau và tương ứng là 1 : 3 : 4. Ở trạng thái nghỉ, thời gian pha dãn chung trong mỗi chu kì tim ở vận động viên điền kinh dài hơn so với ở người bình thường bao nhiêu giây (không làm tròn kết quả các phép tính trung gian, chỉ làm tròn kết quả cuối cùng đến hàng phần trăm)?
- **Đáp án chính thức**: **0,17**
- **Phương pháp kiểm chứng**: `computed_independent`
- **Kết quả tính độc lập**: `0.17`
- **Ghi chú tính toán**: Pha dãn chung chiếm 4/(1+3+4) = 1/2 chu kì tim. Người bình thường: T1 = 60/70 s => t_dc1 = 30/70 = 3/7 s = 0.42857 s. Vận động viên: T2 = 60/50 s => t_dc2 = 30/50 = 0.6 s. Hiệu = 0.6 - 3/7 = 1.2 / 7 = 0.1714 s => Làm tròn 0,17.
- **Độ tin cậy OCR**: cao (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `sinh-11-274`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Mỗi chu kì tim gồm ba pha: pha co tâm nhĩ 0,1s, pha co tâm thất 0,3s và pha dãn chung 0,4s"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_BIO_04_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_BIO_04_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Sinh-ho-c-pdf.pdf)

### 36. [CAND_BIO_05] SINH - Phần III - Câu 5 (Phần III (Trả lời ngắn))
- **Mã đề**: 0431 (Đề) / 0431 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Một học sinh thực hiện thí nghiệm về hiện tượng co nguyên sinh ở tế bào biểu bì lá hành chỉ gồm bốn bước (không theo thứ tự đúng) như sau: 1. Tách một lớp tế bào biểu bì lá hành đặt vào giọt nước cất đã được chuẩn bị trên lam kính. 2. Giữ nguyên tiêu bản trên kính hiển vi, nhỏ dung dịch NaCl 2% vào mép lamen, dùng giấy thấm đặt vào mép lamen ở phía đối diện và quan sát. 3. Đậy lamen lên mẫu vật, đặt tiêu bản lên kính hiển vi và quan sát ở vật kính phù hợp. 4. Đầu tiên, nhỏ một giọt nước cất lên lam kính. Hãy viết các số tương ứng với bốn bước thí nghiệm theo thứ tự đúng từ khi bắt đầu thí nghiệm.
- **Đáp án chính thức**: **4132**
- **Phương pháp kiểm chứng**: `logic_or_knowledge_check`
- **Ghi chú phân tích**: Trình tự thực hành chuẩn: Nhỏ nước cất (4) -> Đặt mẫu tế bào (1) -> Đậy lamen và quan sát (3) -> Nhỏ NaCl và thấm quan sát co nguyên sinh (2). Dãy số: 4132.
- **Độ tin cậy OCR**: trung bình (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `sinh-10-244`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Hiện tượng co nguyên sinh xảy ra khi cho tế bào vào môi trường ưu trương, màng sinh chất tách khỏi thành"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_BIO_05_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_BIO_05_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Sinh-ho-c-pdf.pdf)

### 37. [CAND_BIO_06] SINH - Phần III - Câu 6 (Phần III (Trả lời ngắn))
- **Mã đề**: 0431 (Đề) / 0431 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Hình bên thể hiện sự thay đổi diện tích che phủ của mỗi quần xã thực vật: cây gỗ lớn, cỏ một lá mầm ưa sáng, cây bụi hai lá mầm, cỏ ưa bóng, cây gỗ nhỏ ưa sáng (kí hiệu ngẫu nhiên là 2601, 2602, 2603, 2604 hoặc 2605) trong quá trình diễn thế trên một vùng đất trống. Hãy viết kí hiệu của quần xã tương ứng với quần xã cỏ một lá mầm ưa sáng.
- **Đáp án chính thức**: **2603**
- **Phương pháp kiểm chứng**: `logic_or_knowledge_check`
- **Ghi chú phân tích**: Trong diễn thế nguyên sinh trên đất trống: quần xã tiên phong là cỏ ưa sáng xuất hiện sớm nhất và đạt cực đại độ che phủ đầu tiên (khoảng năm 50-80). Đường đồ thị 2603 tương ứng với cỏ một lá mầm ưa sáng. Đáp số: 2603.
- **Độ tin cậy OCR**: trung bình (CẦN NGƯỜI XEM LẠI)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `sinh-12-301`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Diễn thế nguyên sinh khởi đầu từ môi trường chưa có sinh vật; thực vật tiên phong thường là rêu, địa y, cỏ"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_BIO_06_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_BIO_06_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Sinh-ho-c-pdf.pdf)

### 38. [CAND_BIO_07] SINH - Phần I - Câu 10 (Phần I (Trắc nghiệm))
- **Mã đề**: 0431 (Đề) / 0431 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Ở tế bào nhân thực, chu trình Krebs của quá trình hô hấp tế bào (phân giải hiếu khí) xảy ra ở bào quan nào sau đây? A. Ribosome. B. Lysosome. C. Ti thể. D. Lục lạp.
- **Đáp án chính thức**: **C. Ti thể**
- **Phương pháp kiểm chứng**: `logic_or_knowledge_check`
- **Ghi chú phân tích**: Chu trình Krebs xảy ra tại chất nền của ti thể (mitochondrial matrix). Đáp án C.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `sinh-10-248`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Chu trình Krebs diễn ra trong chất nền của ti thể, biến đổi acetyl-CoA giải phóng CO2 và tạo NADH, FADH2, ATP"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_BIO_07_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_BIO_07_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Sinh-ho-c-pdf.pdf)

### 39. [CAND_PHYS_11] LY - Phần I - Câu 8 (Phần I (Trắc nghiệm))
- **Mã đề**: 0214 (Đề) / 0214 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Hai hạt nhân X và Y có năng lượng liên kết bằng nhau. Nếu số nucleon của hạt nhân X nhỏ hơn số nucleon của hạt nhân Y thì: A. độ hụt khối của hạt nhân X lớn hơn độ hụt khối của hạt nhân Y. B. độ hụt khối của hạt nhân Y lớn hơn độ hụt khối của hạt nhân X. C. hạt nhân X bền vững hơn hạt nhân Y. D. hạt nhân Y bền vững hơn hạt nhân X.
- **Đáp án chính thức**: **C. hạt nhân X bền vững hơn hạt nhân Y**
- **Phương pháp kiểm chứng**: `logic_or_knowledge_check`
- **Ghi chú phân tích**: Độ bền vững hạt nhân phụ thuộc vào năng lượng liên kết riêng epsilon = E_lk / A. Khi E_lk bằng nhau và A_X < A_Y thì epsilon_X > epsilon_Y nên X bền vững hơn Y. Đáp án C.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `ly-12-159`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Năng lượng liên kết riêng epsilon = E_lk / A đặc trưng cho mức độ bền vững hạt nhân; càng lớn càng bền vững"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_PHYS_11_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_PHYS_11_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Vat-ly-pdf.pdf)

### 40. [CAND_BIO_09] SINH - Phần I - Câu 5 (Phần I (Trắc nghiệm))
- **Mã đề**: 0431 (Đề) / 0431 (Bảng đáp án) -> Khớp: `True`
- **Nội dung câu hỏi**: Ở người, quá trình biến đổi thức ăn thành các phân tử nhỏ, đơn giản thuộc giai đoạn nào sau đây của quá trình dinh dưỡng? A. Tiêu hóa thức ăn. B. Lấy thức ăn. C. Đồng hóa các chất. D. Hấp thụ chất dinh dưỡng.
- **Đáp án chính thức**: **A. Tiêu hóa thức ăn**
- **Phương pháp kiểm chứng**: `logic_or_knowledge_check`
- **Ghi chú phân tích**: Quá trình biến đổi thức ăn thành các phân tử nhỏ, đơn giản là giai đoạn tiêu hóa thức ăn. Đáp án A.
- **Độ tin cậy OCR**: cao (Rõ ràng)
- **Kho tri thức 303 chunk**: Độ phủ `trong kho` | Chunk đối chiếu: `sinh-11-271`
- **Trích dẫn nội dung chunk (<= 20 từ)**: *"Quá trình dinh dưỡng gồm lấy thức ăn, tiêu hóa thức ăn, hấp thụ chất dinh dưỡng và thải bã ra ngoài"*
- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi](reports/ablation/evidence/official_pages/crops/CAND_BIO_09_de.png) | [Ảnh cắt đáp án](reports/ablation/evidence/official_pages/crops/CAND_BIO_09_dap_an.png)
- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026](https://attachment.vnecdn.net/2026/06/19/Sinh-ho-c-pdf.pdf)
