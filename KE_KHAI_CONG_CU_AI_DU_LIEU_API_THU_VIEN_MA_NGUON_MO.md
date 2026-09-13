# BẢN KÊ KHAI CÔNG CỤ AI, DỮ LIỆU, API VÀ MÃ NGUỒN MỞ

**Dự án**: STEM HUB — Hệ sinh thái học tập và phòng thí nghiệm ảo 3D  
**Đơn vị**: Nhóm học sinh Trường THPT Quỳnh Lưu 4, tỉnh Nghệ An | Tháng 09/2026  

---

### I. CÁC CÔNG CỤ TRÍ TUỆ NHÂN TẠO SỬ DỤNG TRONG DỰ ÁN

#### 1. Công cụ AI hỗ trợ tra cứu kỹ thuật
**Mục đích sử dụng:** Nhóm sử dụng công cụ AI để hỗ trợ tra cứu cú pháp lập trình, tìm hiểu tài liệu kỹ thuật và gợi ý sửa các lỗi chính tả trong mã nguồn. Toàn bộ ý tưởng bài toán, cấu trúc dữ liệu và việc lập trình giao diện đều do nhóm chúng em cùng thầy giáo hướng dẫn tự tay thực hiện.

#### 2. Mô hình ngôn ngữ Google Gemini API
**Mục đích ứng dụng:** Nhóm tích hợp mô hình Gemini phiên bản Flash 1.5 và Flash 2.5 miễn phí để hỗ trợ học sinh học tập trong trang web:

**Trợ lý học tập Nova:** Hỗ trợ giải đáp thắc mắc lý thuyết và bài tập 4 môn Toán, Vật lý, Hóa học, Sinh học theo sách giáo khoa mới, đồng thời gợi ý phòng thí nghiệm ảo phù hợp.

**Trợ lý phân tích hình học 3D:** Đọc hiểu đề bài toán hình học không gian, hướng dẫn học sinh các bước tính thể tích, diện tích xung quanh, góc và khoảng cách.

**Gia sư môn Toán:** Trao đổi với học sinh về các bài toán khó, hiển thị công thức rõ ràng và gõ chữ từng từ mượt mà để học sinh dễ theo dõi.

**Nhận dạng đề thi từ ảnh chụp:** Cho phép học sinh chụp ảnh đề bài trên giấy tải lên để hệ thống nhận dạng chữ và số liệu, sau đó dựng hình không gian 3D tương ứng.

**Cơ chế xoay vòng khóa dự phòng:** Nhóm tự lập trình cơ chế tự động chuyển sang khóa API dự phòng khi một khóa bị đầy lượt dùng, giúp trang web hoạt động liên tục cho nhiều bạn học sinh cùng sử dụng miễn phí.

#### 3. Công cụ âm thanh Meta AudioCraft
**Mục đích sử dụng:** Tạo một số đoạn nhạc nền nhẹ nhàng giúp học sinh tập trung học bài và các âm thanh mô phỏng tiếng bọt khí hóa chất hoặc tiếng va chạm con lắc để thí nghiệm thêm sinh động.

---

### II. CÁC MÔ HÌNH HỌC MÁY DO NHÓM TỰ LẬP TRÌNH VÀ HUẤN LUYỆN

Nhóm chúng em đã tự nghiên cứu và lập trình 6 mô hình trí tuệ nhân tạo chuyên biệt chạy trực tiếp trên trình duyệt máy tính của học sinh bằng ngôn ngữ JavaScript và thư viện TensorFlow.js. Các mô hình này hoạt động ngay trên máy người dùng, không tốn tiền thuê máy chủ và có thể chạy được cả khi mạng Internet yếu.

| STT | Tên mô hình học máy | Mục đích sử dụng trong môn học | Dữ liệu huấn luyện và kiểm thử | Kết quả thực tế đạt được |
|:---:|:---|:---|:---|:---|
| 1 | **Mô hình cảnh báo an toàn hóa chất** | Dùng trong Phòng thí nghiệm Hóa học ảo để phân tích nhiệt độ, nồng độ và các chất tham gia, kịp thời cảnh báo nguy cơ cháy nổ hoặc sinh khí độc trước khi học sinh trộn hóa chất. | 144 mẫu huấn luyện, 36 mẫu kiểm thử và 20 trường hợp biên nguy hiểm. | Đạt độ chính xác 100% trên tập kiểm thử, phát hiện chính xác 95% trường hợp nguy hiểm và không bỏ sót tình huống rủi ro nào. |
| 2 | **Mô hình chẩn đoán sai số thực nghiệm** | Dùng trong Phòng thí nghiệm Vật lý ảo nhằm so sánh kết quả đo của học sinh với số liệu chuẩn, từ đó chỉ ra học sinh đang mắc lỗi đo góc, lỗi bấm đồng hồ hay đặt dụng cụ sai. | 96 mẫu huấn luyện, 24 mẫu kiểm thử và 15 trường hợp sai số hỗn hợp. | Đạt độ chính xác 100% trên tập kiểm thử và nhận diện đúng 86,67% các trường hợp học sinh mắc đồng thời nhiều lỗi thao tác. |
| 3 | **Mô hình phân loại ý định câu hỏi** | Giúp Trợ lý Nova hiểu câu hỏi của học sinh để tự động mở đúng bài học lý thuyết, công thức tính toán hoặc chuyển đến đúng phòng thí nghiệm cần tìm. | 392 câu hỏi thực tế của học sinh làm tập huấn luyện và 40 câu hỏi mới hoàn toàn để kiểm thử. | Nhận diện chính xác 100% ý định câu hỏi sau khi chuẩn hóa từ ngữ học trò, phân luồng trơn tru 7 nhóm nhu cầu học tập. |
| 4 | **Mô hình chọn câu hỏi vừa sức môn Toán** | Tự động đánh giá sức học của học sinh qua từng câu trả lời đúng sai, từ đó chọn câu hỏi tiếp theo vừa vặn với năng lực của bạn. | 10 bộ câu hỏi chuẩn hóa với nhiều mức độ từ dễ đến khó. | Đưa ra câu hỏi phù hợp với năng lực học sinh, giữ tỷ lệ làm đúng kỳ vọng trong khoảng 60% đến 75% để học sinh không nản lòng. |
| 5 | **Mô hình tính xác suất di truyền Menđen** | Dùng trong phân hệ Di truyền học môn Sinh học để tính toán tỷ lệ phân ly kiểu gen, kiểu hình và xác suất truyền bệnh trong sơ đồ phả hệ gia đình. | 10 bài toán di truyền chuẩn từ lai 1 cặp tính trạng đến lai 4 cặp tính trạng và tương tác gen. | Đạt độ chính xác tuyệt đối 100% trên toàn bộ 10 bài toán kiểm thử theo đúng các quy luật di truyền của Menđen. |
| 6 | **Mô hình tìm kiếm tri thức bài học** | Tìm kiếm nhanh các đoạn kiến thức sách giáo khoa phù hợp nhất với câu hỏi của học sinh ngay trong bộ nhớ máy tính mà không cần máy chủ dữ liệu bên ngoài. | 303 đoạn tóm tắt kiến thức 4 môn học với hơn 9.000 từ khóa chuyên môn. | Tìm trúng nội dung liên quan nhất ở vị trí đầu tiên đạt 96,88% và nằm trong 3 kết quả gợi ý đầu đạt 100%. |

#### Tính năng nhận diện khuôn mặt điểm danh bảo mật
**Cách thức hoạt động:** Nhóm sử dụng thư viện Face-API để nhận diện khuôn mặt học sinh phục vụ điểm danh và bảo vệ tài khoản.

**Bảo vệ quyền riêng tư tuyệt đối:** Toàn bộ việc quét khuôn mặt và so khớp dữ liệu được thực hiện trực tiếp trên trình duyệt qua webcam máy tính của học sinh. Hình ảnh chỉ được chuyển thành các con số đặc trưng để so khớp tại máy, tuyệt đối không gửi hoặc lưu trữ bất kỳ hình ảnh nào của học sinh lên mạng Internet.

---

### III. NGUỒN DỮ LIỆU NHÓM EM TỰ THU THẬP VÀ BIÊN SOẠN

**1. Cơ sở tri thức 4 môn học lớp 10, 11, 12:** Nhóm em đọc kỹ sách giáo khoa mới của 4 môn Toán, Vật lý, Hóa học, Sinh học theo chương trình giáo dục phổ thông năm 2018 và tài liệu ôn tập của Bộ Giáo dục và Đào tạo, sau đó tự tay tóm tắt thành 303 đoạn kiến thức trọng tâm với hơn 9.000 từ khóa để hệ thống tra cứu bài học nhanh chóng.

**2. Ngân hàng hơn 500 câu hỏi trắc nghiệm:** Chúng em sưu tầm, chọn lọc và biên soạn lại hơn 500 câu hỏi từ các đề thi tốt nghiệp THPT chính thức và đề thi học sinh giỏi các tỉnh. Nhóm em tự giải chi tiết từng câu và phân loại độ khó từ cơ bản đến nâng cao để đưa vào phần Đấu trường cho các bạn thi đấu kiến thức cùng nhau. Toàn bộ câu hỏi được lưu sẵn trong ứng dụng để mở tức thì mà không lo nghẽn mạng.

**3. Dữ liệu 144 phản ứng hóa học thực nghiệm:** Nhóm em tra cứu bảng tính tan, sổ tay hóa học và sách giáo khoa để tự tổng hợp 144 trường hợp trộn hóa chất thường gặp. Với mỗi phản ứng, nhóm ghi rõ hiện tượng đổi màu, kết tủa hoặc sủi bọt khí và viết phương trình ion thu gọn để máy tính hiển thị mô phỏng giống hệt như khi làm thí nghiệm thật ở trường học.

**4. Dữ liệu gần 400 câu giao tiếp của học sinh:** Để Trợ lý Nova hiểu được cách nói chuyện thường ngày của các bạn cùng trường, nhóm em đã thu thập 392 câu nói, câu hỏi thực tế của các bạn khi hỏi bài để dạy cho AI hiểu được ý định và mở đúng trang học sinh cần.

**5. Quần thể 20 Bot AI luyện tập:** Chúng em tự tạo 20 nhân vật Bot có mức điểm từ thấp đến cao, từ 50 đến 130 điểm, để khi học sinh vào Đấu trường mà chưa có bạn nào ghép cặp thì hệ thống sẽ đưa Bot ra luyện tập cùng, giúp việc học không bao giờ bị ngắt quãng.

**6. Dữ liệu thông số các hình học không gian 3D:** Nhóm đã hệ thống hóa thông số toán học của hơn 15 dạng hình không gian như hình chóp tam giác đều, chóp tứ giác, lăng trụ đứng, lăng trụ xiên, hộp chữ nhật, lập phương, bát diện đều, chóp cụt, tứ diện vuông để thuật toán máy tính tự động vẽ hình 3D tương tác theo đúng đề bài học sinh đưa vào.

---

### IV. CÁC DỊCH VỤ VÀ CÔNG NGHỆ WEB HỖ TRỢ VẬN HÀNH

#### 1. Các dịch vụ đám mây miễn phí
**Dịch vụ Google Firebase:** Dùng gói miễn phí 0 đồng để quản lý tài khoản người dùng, đồng bộ điểm số thi đấu thời gian thực giữa hai bạn học sinh trên Đấu trường và lưu bảng xếp hạng toàn trường.

**Cổng bảo vệ Cloudflare Worker:** Đóng vai trò trạm trung gian giúp che giấu mã khóa Gemini API, đồng thời ngăn chặn truy cập quá tải để bảo vệ tài nguyên miễn phí của dự án.

**Nền tảng triển khai Vercel:** Dùng để lưu trữ và vận hành trang web chính thức tại địa chỉ `https://ai.stem-hub.top`, giúp học sinh toàn quốc truy cập nhanh và ổn định.

**Dịch vụ gửi mã xác thực email:** Tự động gửi mã số xác nhận qua hòm thư điện tử khi học sinh đăng ký tài khoản mới để bảo đảm an toàn thông tin.

#### 2. Các công nghệ tích hợp sẵn trên trình duyệt
**Công nghệ xử lý đa luồng Web Worker:** Nhóm tách các phép tính toán học nặng và tìm kiếm dữ liệu sang luồng chạy ngầm riêng. Nhờ đó, màn hình chính của trang web luôn mượt mà đạt tốc độ 60 khung hình trên giây, không bị giật lag kể cả trên máy tính cũ ở phòng tin học của trường.

**Công nghệ nhận dạng giọng nói và phát âm tiếng Việt:** Tận dụng tính năng có sẵn của trình duyệt để học sinh nói chuyện trực tiếp bằng giọng nói với Trợ lý Nova và nghe AI đọc câu trả lời bằng tiếng Việt hoàn toàn miễn phí; kết hợp xử lý tự động giảm nhỏ nhạc nền khi AI bắt đầu nói.

**Bộ nhớ lưu trữ trình duyệt IndexedDB:** Lưu dữ liệu bài học và mô hình AI ngay trên máy tính của học sinh, giúp trang web mở nhanh hơn ở các lần sau và học sinh vẫn có thể ôn bài khi mạng Internet bị chập chờn.

**Đồ họa không gian WebGL và Canvas:** Hiển thị các mô hình 3D tương tác với đầy đủ ánh sáng, bóng đổ, hiệu ứng trong suốt của ống nghiệm và đường đi của tia sáng laser.

---

### V. DANH MỤC CÁC THƯ VIỆN MÃ NGUỒN MỞ ĐÃ SỬ DỤNG

Toàn bộ các thư viện dưới đây đều là các phần mềm mã nguồn mở miễn phí, uy tín và được cộng đồng lập trình thế giới sử dụng rộng rãi:

| STT | Tên thư viện mã nguồn mở | Phiên bản | Giấy phép | Mục đích sử dụng cụ thể trong trang web |
|:---:|:---|:---:|:---:|:---|
| 1 | **Next.js** | 16.2.6 | MIT | Khung xây dựng trang web chính, giúp tối ưu tốc độ tải trang và kết nối các mục bài học. |
| 2 | **React và React-DOM** | 19.2.4 | MIT | Nền tảng tạo các thành phần giao diện tương tác trên toàn bộ hệ thống. |
| 3 | **TensorFlow.js** | 4.22.0 | Apache 2.0 | Thư viện chạy 6 mô hình trí tuệ nhân tạo tự huấn luyện trực tiếp trên trình duyệt. |
| 4 | **Google Generative AI SDK** | 0.24.1 | Apache 2.0 | Công cụ kết nối trang web với mô hình Google Gemini. |
| 5 | **Three.js** | 0.184.0 | MIT | Động cơ vẽ các mô hình không gian 3D cho các phòng thí nghiệm Toán, Vật lý và Sinh học. |
| 6 | **React Three Fiber** | 9.6.1 | MIT | Cầu nối giúp kết hợp Three.js vào giao diện React một cách mượt mà. |
| 7 | **React Three Drei** | 10.7.7 | MIT | Các tiện ích hỗ trợ xoay góc nhìn 3D, tạo chữ 3D và điều chỉnh ánh sáng mô hình. |
| 8 | **KaTeX** | 0.18.7 | MIT | Hiển thị công thức Toán, phương trình Hóa học và ký hiệu Vật lý rõ nét giống sách giáo khoa. |
| 9 | **Mathjs** | 15.2.0 | Apache 2.0 | Thư viện tính toán các công thức toán học, tọa độ và ma trận không gian. |
| 10 | **Tailwind CSS** | 4.0.0 | MIT | Tạo phong cách thiết kế màu sắc hiện đại cho phòng thí nghiệm khoa học, đẹp trên cả điện thoại và máy tính. |
| 11 | **Framer Motion** | 12.39.0 | MIT | Tạo hiệu ứng đóng mở cửa sổ và chuyển trang nhẹ nhàng, sinh động. |
| 12 | **Lucide React** | 1.16.0 | ISC | Cung cấp các biểu tượng đồ họa khoa học và giáo dục trên thanh menu của trang web. |
| 13 | **Firebase SDK** | 12.13.0 | Apache 2.0 | Kết nối trang web với cơ sở dữ liệu thời gian thực của Google để lưu điểm và xếp hạng. |
| 14 | **Zustand** | 5.0.13 | MIT | Quản lý điểm số tạm thời và trạng thái trận đấu nhanh chóng trong Đấu trường 1 đấu 1. |
| 15 | **Leva** | 0.10.1 | MIT | Bảng điều khiển cho phép học sinh tự chỉnh kích thước hình 3D và thông số thí nghiệm. |
| 16 | **Canvas Confetti** | 1.9.4 | MIT | Tạo hiệu ứng pháo hoa chúc mừng khi học sinh làm đúng bài tập hoặc thắng trận đấu. |
| 17 | **SheetJS XLSX** | 0.18.5 | Apache 2.0 | Hỗ trợ đọc và nhập danh sách câu hỏi trắc nghiệm từ bảng tính Excel vào hệ thống. |
| 18 | **Html2canvas-pro** | 2.0.4 | MIT | Chụp ảnh màn hình để học sinh tải về Giấy chứng nhận kết quả sau mỗi tuần học. |
| 19 | **Nodemailer** | 9.0.5 | MIT | Module gửi email tự động chứa mã xác nhận khi học sinh đăng ký tài khoản. |
| 20 | **Next Themes** | 0.4.6 | MIT | Hỗ trợ học sinh chuyển đổi giữa chế độ nền sáng và nền tối để không mỏi mắt khi học ban đêm. |
| 21 | **Lodash** | 4.18.1 | MIT | Xử lý dữ liệu danh sách bài học và tìm kiếm bài tập trơn tru hơn. |
| 22 | **Axios** | 1.15.0 | MIT | Gửi nhận dữ liệu giữa trang web và máy chủ một cách an toàn và tin cậy. |
| 23 | **TanStack React Query** | 5.99.0 | MIT | Tối ưu hóa bộ nhớ đệm giúp trang web tải dữ liệu nhanh và tiết kiệm dung lượng mạng. |
| 24 | **Hugging Face Transformers.js** | 4.2.0 | Apache 2.0 | Chuẩn bị cho việc chạy mô hình AI ngôn ngữ nhỏ hoàn toàn ngoại tuyến trong tương lai. |

---

### VI. LỜI CAM KẾT DANH DỰ CỦA NHÓM HỌC SINH

Nhóm học sinh chúng em xin cam đoan trước Ban Bí thư Trung ương Đoàn TNCS Hồ Chí Minh và Ban Giám khảo Cuộc thi:
1. Toàn bộ các nội dung kê khai ở trên là hoàn toàn trung thực và chính xác đúng với những gì có trong dự án STEM HUB của chúng em.
2. Tất cả các ý tưởng sư phạm, cấu trúc bài giảng, bộ ngân hàng câu hỏi, dữ liệu phản ứng hóa học và phần lớn mã nguồn giao diện tương tác 3D đều do nhóm chúng em cùng thầy giáo hướng dẫn tự tay nghiên cứu, thiết kế và phát triển. Các công cụ AI chỉ đóng vai trò hỗ trợ kỹ thuật và thúc đẩy quá trình học hỏi của chúng em.
3. Chúng em cam kết tuân thủ nghiêm túc các giấy phép mã nguồn mở, tuyệt đối không sao chép nguyên mẫu hay sử dụng mã nguồn vi phạm bản quyền của bất kỳ tổ chức hay cá nhân nào. Nhóm xin hoàn toàn chịu trách nhiệm trước Ban Tổ chức cuộc thi về tính trung thực của văn bản kê khai này.

*Nghệ An, ngày 13 tháng 09 năm 2026*

| THẦY GIÁO HƯỚNG DẪN | ĐẠI DIỆN NHÓM HỌC SINH TÁC GIẢ |
|:---:|:---:|
| *(Ký và ghi rõ họ tên)*<br><br><br><br><br>**Nguyễn Văn Phúc**<br>Giáo viên Trường THPT Quỳnh Lưu 4, Nghệ An | *(Ký và ghi rõ họ tên)*<br><br><br><br><br>**Hồ Hoàng Anh**<br>Học sinh lớp 12A, Trưởng nhóm<br>Các thành viên: Nguyễn Trung Hiếu, Đậu Việt Hưng |
