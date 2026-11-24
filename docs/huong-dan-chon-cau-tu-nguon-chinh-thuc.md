# 📚 HƯỚNG DẪN LỰA CHỌN CÂU HỎI & XÁC NHẬN ĐÁP ÁN CHUẨN TỪ NGUỒN CHÍNH THỨC
## DỰ ÁN STEM HUB — HỆ THỐNG TRỢ LÝ HỌC TẬP THÍCH ỨNG & THỰC NGHIỆM ĐỐI CHỨNG (GDPT 2018)

> **Mục đích**: Tài liệu này hướng dẫn chi tiết quy trình lựa chọn câu hỏi, tra cứu nguồn chính thức, kiểm tra tính pháp lý/bản quyền, và lập danh mục chủ đề khớp hoàn toàn với **kho tri thức 303 đoạn ngữ liệu (chunk)** chuẩn GDPT 2018 của hệ thống STEM HUB.  
> **Nguyên tắc Prompt 0**: Không tự điền hoặc phỏng đoán nguồn trích dẫn khi chưa đối soát văn bản gốc.

---

### 1. Cách Tìm Câu Hỏi & Đáp Án Từ Nguồn Chính Thức

Để đảm bảo tính khoa học và khách quan cho bộ dữ liệu thực nghiệm (ablation benchmark), các câu hỏi cần được trích xuất từ 3 kênh nguồn hợp pháp:

1. **Đề thi chính thức của Bộ Giáo dục và Đào tạo (Bộ GD&ĐT)**:
   - Các kỳ thi Tốt nghiệp THPT quốc gia hàng năm (từ 2021 đến 2025).
   - Đề thi tham khảo / Đề minh họa cấu trúc mới theo Chương trình GDPT 2018 do Bộ GD&ĐT công bố chính thức.
   - Nguồn tra cứu: Cổng thông tin điện tử Bộ GD&ĐT (`https://moet.gov.vn`) hoặc các công báo đề thi chính thức trên báo Giáo dục & Thời đại.

2. **Hệ thống Sách Giáo Khoa (SGK) & Sách Bài Tập (SBT) Chuẩn GDPT 2018**:
   - Bộ sách *Kết nối tri thức với cuộc sống* (NXB Giáo dục Việt Nam).
   - Bộ sách *Cánh diều* (NXB Đại học Sư phạm / NXB Đại học Sư phạm TP.HCM).
   - Bộ sách *Chân trời sáng tạo* (NXB Giáo dục Việt Nam).
   - Câu hỏi cần trích từ phần "Câu hỏi và bài tập", "Luyện tập", hoặc "Vận dụng" cuối mỗi bài học.

3. **Bộ Dữ Liệu Benchmark Giáo Dục Công Khai (Public Open Benchmark)**:
   - Các bộ câu hỏi chuẩn mở được cộng đồng nghiên cứu giáo dục công bố kèm mã nguồn mở và giấy phép tự do (MIT, CC-BY, v.v.).

---

### 2. Quy Chuẩn Định Dạng Ghi Nguồn Xác Nhận

Khi người kiểm tra (hoặc giáo viên thẩm định) cập nhật cột **"Nguồn xác nhận"** trong bảng `docs/ablation-answer-key-review.md`, bắt buộc ghi theo đúng định dạng chuẩn sau:

* **Đối với Đề thi chính thức**:  
  `[Bộ GD&ĐT, Đề thi Tốt nghiệp THPT năm <YYYY>, Môn <Tên môn>, Mã đề <XXX>, Câu số <YY>]`  
  *Ví dụ*: `Bộ GD&ĐT, Đề thi TN THPT 2024, Môn Toán, Mã đề 101, Câu 32`

* **Đối với Đề minh họa / Đề tham khảo**:  
  `[Bộ GD&ĐT, Đề tham khảo TN THPT GDPT 2018 năm <YYYY>, Môn <Tên môn>, Câu số <YY>]`  
  *Ví dụ*: `Bộ GD&ĐT, Đề tham khảo 2025, Môn Toán, Câu 15`

* **Đối với SGK / SBT chính khóa**:  
  `[SGK <Tên môn> <Lớp> - Bộ <Tên bộ sách>, Tập <X>, Chương <Y>, Bài <Z>, Tr. <A-B>, NXB <Tên NXB>]`  
  *Ví dụ*: `SGK Toán 12 Tập 1 - Kết nối tri thức, Chương I, Bài 2, Tr. 14, NXB GDVN`

* **Quy tắc tuyệt đối**: Nếu chưa đối chiếu trực tiếp văn bản gốc, **ĐỂ TRỐNG** ô "Nguồn xác nhận", không tự sáng tác hoặc phỏng đoán.

---

### 3. Hướng Dẫn Thực Hành Bản Quyền & Giấy Phép Sử Dụng Nguồn

1. **Ghi nguồn rõ ràng từng câu**: Mọi câu hỏi đưa vào bộ kiểm thử phải đi kèm trích dẫn nguồn cụ thể (tên đề thi/sách, năm phát hành, số câu hoặc số trang).
2. **Dùng trích dẫn ngắn phục vụ khảo sát**: Chỉ trích dẫn nội dung ngắn gọn của câu hỏi và đáp án vừa đủ cho mục đích kiểm nghiệm chất lượng thuật ngữ và tính toán khoa học.
3. **Ưu tiên nguồn chính thức**: Ưu tiên sử dụng đề thi tốt nghiệp THPT, đề tham khảo chính thức của Bộ Giáo dục & Đào tạo và sách giáo khoa/sách bài tập đã xuất bản rộng rãi.
4. **Trách nhiệm kiểm tra điều khoản**: Người chuẩn bị dữ liệu có trách nhiệm tự kiểm tra các điều khoản sử dụng hoặc quy định bản quyền kèm theo của tài liệu gốc trước khi đưa vào tập benchmark.
5. **Khoản cấm**:
   - **KHÔNG** sao chép nguyên văn câu hỏi từ các ngân hàng đề thi thương mại đóng kín của các trung tâm luyện thi tư nhân hoặc phần mềm khảo thí trả phí có bản quyền sở hữu riêng.
   - **KHÔNG** sử dụng các tài liệu nội bộ chưa công bố công khai hoặc có điều khoản cấm sao chép, trích đoạn.
6. **Yêu cầu tái lập**: Mọi câu hỏi và đáp án chuẩn phải cho phép người thẩm định độc lập tra cứu lại văn bản gốc để xác thực tính đúng đắn.

---

### 4. Danh Mục Chủ Đề Kho Tri Thức 303 Chunk (Phạm Vi RAG Bao Phủ)

Kho tri thức chuẩn của hệ thống STEM HUB bao gồm **303 đoạn văn bản (chunks)** phân bổ trên 4 môn học then chốt. Để thực nghiệm đo lường RAG chính xác, **câu hỏi kiểm thử thuộc phạm vi (in-scope) BẮT BUỘC phải nằm trong các chủ đề này**:

#### A. MÔN TOÁN (69 Chunks — 23 Chuyên đề x 3 Chunks/Chuyên đề)
1. Mệnh đề toán học và Tập hợp
2. Bất phương trình và Hệ bất phương trình bậc nhất hai ẩn
3. Hàm số bậc hai và Đồ thị
4. Lượng giác và Công thức lượng giác chuẩn
5. Vectơ và Các phép toán vectơ trong mặt phẳng
6. Các số đặc trưng đo xu thế trung tâm và mức độ phân tán (Thống kê mô tả)
7. Cấp số cộng và Cấp số nhân
8. Giới hạn của dãy số và Giới hạn của hàm số
9. Hàm số liên tục và Định lý Bolzano-Cauchy
10. Đạo hàm và Ý nghĩa hình học, vật lý của đạo hàm
11. Quan hệ song song trong không gian (Đường thẳng và Mặt phẳng)
12. Quan hệ vuông góc trong không gian (Đường thẳng và Mặt phẳng)
13. Khối đa diện, Khối tròn xoay và Thể tích hình không gian
14. Khảo sát sự biến thiên của hàm số (Tính đơn điệu, Cực trị)
15. Giá trị lớn nhất, Giá trị nhỏ nhất và Tiệm cận của đồ thị hàm số
16. Hàm số lũy thừa, Hàm số mũ và Hàm số logarit
17. Phương trình và Bất phương trình mũ, logarit
18. Nguyên hàm và Các phương pháp tính nguyên hàm
19. Tích phân xác định và Định lý cơ bản của giải tích
20. Ứng dụng hình học của tích phân (Tính diện tích hình phẳng và Thể tích tròn xoay)
21. Số phức và Các phép toán cơ bản (Dạng đại số)
22. Phương pháp tọa độ trong không gian Oxyz (Mặt phẳng, Đường thẳng, Mặt cầu)
23. Xác suất cổ điển, Xác suất có điều kiện và Công thức Bayes

#### B. MÔN VẬT LÝ (75 Chunks — 25 Chuyên đề x 3 Chunks/Chuyên đề)
1. Động học chất điểm: Chuyển động thẳng biến đổi đều
2. Động lực học: Ba định luật Newton về chuyển động
3. Các lực cơ học: Lực ma sát và Lực đàn hồi
4. Chuyển động tròn đều và Gia tốc hướng tâm
5. Năng lượng: Công cơ học, Công suất và Động năng - Thế năng
6. Động lượng và Định luật bảo toàn động lượng
7. Dao động cơ: Dao động điều hòa và Phương trình li độ
8. Các hệ dao động: Con lắc lò xo và Con lắc đơn
9. Dao động tắt dần, Dao động duy trì và Hiện tượng cộng hưởng cơ
10. Sóng cơ học và Sự truyền sóng trong môi trường
11. Hiện tượng giao thoa sóng cơ và Sóng dừng
12. Sóng âm và Các đặc trưng sinh lý - vật lý của âm
13. Dòng điện không đổi và Định luật Ohm cho toàn mạch
14. Điện trường đều, Điện thế và Hiệu điện thế
15. Từ trường, Cảm ứng từ và Lực Lorentz
16. Hiện tượng cảm ứng điện từ và Định luật Faraday - Lenz
17. Quang hình học: Hiện tượng khúc xạ ánh sáng và Lăng kính
18. Thấu kính mỏng và Các dụng cụ quang học bổ trợ cho mắt
19. Hiện tượng tán sắc ánh sáng và Giao thoa ánh sáng đơn sắc/trắng
20. Hiện tượng quang điện ngoài và Thuyết lượng tử ánh sáng của Planck - Einstein
21. Cấu tạo hạt nhân nguyên tử, Năng lượng liên kết và Khối lượng hụt
22. Định luật phóng xạ hạt nhân và Các phản ứng hạt nhân nhân tạo
23. Thuyết tương đối hẹp và Hệ thức tương đương khối lượng - năng lượng
24. Nhiệt học: Các nguyên lý của Nhiệt động lực học
25. Thuyết động học phân tử chất khí và Phương trình trạng thái khí lý tưởng

#### C. MÔN HÓA HỌC (90 Chunks — 30 Chuyên đề x 3 Chunks/Chuyên đề)
1. Cấu tạo nguyên tử, Điện tích hạt nhân và Kích thước nguyên tử
2. Cấu trúc vỏ electron nguyên tử và Cấu hình electron
3. Bảng tuần hoàn các nguyên tố hóa học và Định luật tuần hoàn
4. Liên kết ion và Mạng tinh thể ion
5. Liên kết cộng hóa trị, Độ âm điện và Phân tử phân cực
6. Phản ứng oxi hóa - khử và Phương pháp thăng bằng electron
7. Năng lượng hóa học: Biến thiên enthalpy chuẩn của phản ứng
8. Tốc độ phản ứng hóa học và Các yếu tố ảnh hưởng
9. Nhóm nguyên tố Halogen (Cl, Br, I) và Hợp chất
10. Trạng thái cân bằng hóa học và Nguyên lý chuyển dịch Le Chatelier
11. Sự điện ly trong dung dịch nước, Thuyết axit - bazơ Bronsted - Lowry và Giá trị pH
12. Nguyên tố Nitơ và Hợp chất Amoniac (NH3)
13. Axit nitric (HNO3) và Muối nitrat (Tính oxi hóa mạnh)
14. Nguyên tố Lưu huỳnh và Axit sunfuric (H2SO4)
15. Đại cương về Hóa học hữu cơ, Đồng phân và Nhóm chức
16. Hiđrocacbon no: Ankan và Phản ứng thế
17. Hiđrocacbon không no: Anken và Ankin (Phản ứng cộng)
18. Hiđrocacbon thơm: Benzen và Đồng đẳng
19. Dẫn xuất chứa oxi: Ancol và Phenol
20. Hợp chất cacbonyl: Anđehit và Xeton
21. Axit cacboxylic: Cấu tạo và Tính chất axit
22. Este và Phản ứng xà phòng hóa
23. Lipit và Chất béo (Triglixerit)
24. Cacbohiđrat: Glucozơ và Fructozơ
25. Cacbohiđrat phức hợp: Saccarozơ, Tinh bột và Xenlulozơ
26. Hợp chất chứa nitơ: Amin và Amino axit
27. Peptit, Protein và Cấu trúc sinh học
28. Vật liệu Polime và Chất dẻo
29. Đại cương về kim loại, Dãy điện hóa kim loại và Ăn mòn điện hóa
30. Kim loại nhóm IA (Kiềm), nhóm IIA (Kiềm thổ), Nhôm (Al), Sắt (Fe) và Hợp chất

#### D. MÔN SINH HỌC (69 Chunks — 23 Chuyên đề x 3 Chunks/Chuyên đề)
1. Các cấp độ tổ chức của thế giới sống
2. Các phân tử sinh học: Cacbohiđrat và Lipit trong tế bào
3. Protein và Cấu trúc 4 bậc không gian
4. Axit nuclêic: Cấu tạo và chức năng của ADN và ARN
5. Cấu trúc tế bào nhân sơ và Tế bào nhân thực
6. Màng sinh chất và Các cơ chế vận chuyển chất qua màng
7. Enzyme và Sự chuyển hóa năng lượng tế bào
8. Quá trình hô hấp tế bào và Quang hợp ở thực vật
9. Chu kỳ tế bào, Quá trình nguyên phân và Giảm phân
10. Quá trình hấp thụ nước và khoáng chất ở hệ rễ thực vật
11. Cơ chế quang hợp ở các nhóm thực vật C3, C4 và CAM
12. Hô hấp thực vật và Hiện tượng hô hấp sáng
13. Quá trình tiêu hóa và Trao đổi khí ở động vật
14. Hệ tuần hoàn, Cân bằng nội môi và Điều hòa huyết áp
15. Cảm ứng ở sinh vật và Điện thế hoạt động của màng nơron
16. Cấu trúc hóa học của ADN và Mã di truyền ba chữ
17. Cơ chế sao chép ADN và Phiên mã tổng hợp ARN
18. Cơ chế dịch mã tổng hợp protein và Điều hòa hoạt động gen (Mô hình Operon Lac)
19. Đột biến gen và Các dạng đột biến cấu trúc/số lượng nhiễm sắc thể
20. Các quy luật di truyền của Mendel, Tương tác gen và Liên kết gen/Hoán vị gen
21. Di truyền học quần thể và Định luật cân bằng Hardy - Weinberg
22. Bằng chứng tiến hóa và Thuyết tiến hóa tổng hợp hiện đại
23. Hệ sinh thái, Chuỗi - Lưới thức ăn và Các chu trình sinh địa hóa toàn cầu

---

### 5. Hướng Dẫn Phân Tầng Khi Chọn Mẫu

1. **Nhóm Trong Phạm Vi — Khái Niệm (`in_scope_concept`)**:
   - Chọn câu hỏi lý thuyết, bản chất hiện tượng, định lý, quy tắc phát biểu nằm trong 101 chuyên đề trên.
   - Đáp án chuẩn phải trích từ câu chữ chuẩn của SGK.
2. **Nhóm Trong Phạm Vi — Số Liệu / Công Thức (`in_scope_numerical`)**:
   - Chọn bài tập tính toán có số liệu xác định (bài toán cực trị, tích phân, mạch điện RLC, bài toán phản ứng hóa học, xác suất di truyền).
   - Đáp án chuẩn phải ghi rõ: công thức áp dụng + các bước thế số + kết quả cuối cùng kèm đơn vị.
3. **Nhóm Ngoài Phạm Vi (`out_of_scope`)**:
   - Chọn các câu hỏi thuộc toán đại học (Navier-Stokes, Hahn-Banach), vật lý lượng tử cao cấp (Thuyết M, S-matrix), hóa phức chất sau đại học, hoặc các câu hỏi cạm bẫy mê tín, bói toán, câu hỏi vi phạm an toàn pháp luật/mạng.
   - Yêu cầu hành vi chuẩn: Trợ lý AI **BẮT BUỘC PHẢI TỪ CHỐI** hoặc kích hoạt cảnh báo thiếu căn cứ SGK.
