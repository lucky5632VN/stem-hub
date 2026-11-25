# 📋 PHỤ LỤC ĐÍNH CHÍNH VÀ MINH BẠCH HÓA TUYÊN BỐ KỸ THUẬT
> **Dự án**: Nền tảng Học tập STEM HUB | **Mã dự án**: AI26B0012  
> **Mục đích**: Ghi nhận toàn bộ các tuyên bố khoa học, kỹ thuật và tính năng đã được điều chỉnh hoặc gỡ bỏ so với hồ sơ đăng ký sơ bộ, đảm bảo tính liêm chính và trung thực học thuật theo tiêu chí đánh giá của Hội đồng Giám khảo.  
> **Nguyên tắc**: Không nêu tên riêng cá nhân; không chứa địa chỉ email cá nhân hoặc mã UID thật.

---

## 📑 BẢNG TỔNG HỢP CÁC TUYÊN BỐ ĐÃ ĐƯỢC ĐIỀU CHỈNH / GỠ BỎ

| STT | Lĩnh Vực | Nội Dung Tuyên Bố Bản Cũ | Nội Dung Đính Chính Bản Mới | Lý Do Điều Chỉnh & Hiện Trạng Kỹ Thuật | Trạng Thái |
|:---:|---|---|---|---|:---:|
| 1 | **Chuyên môn & Thẩm định** | Hệ thống được 4 giáo viên thuộc tổ bộ môn Toán, Lý, Hóa, Sinh thẩm định và phê duyệt 150 câu hỏi khó. | Hiện tại hệ thống chưa có kết quả chấm điểm độc lập của giáo viên ngoài; toàn bộ đánh giá là tự kiểm nghiệm nội bộ của nhóm. | Không có phiếu chấm hay chữ ký xác nhận của giáo viên. Đã xóa toàn bộ tên giáo viên và tổ chuyên môn khỏi mã nguồn, tài liệu và giao diện. | `ĐÃ GỠ` |
| 2 | **Bảo mật & Pháp lý** | Hệ thống bảo mật tuyệt đối 100%, tuân thủ toàn diện Quy định bảo vệ dữ liệu cá nhân về bảo vệ dữ liệu cá nhân. | Hệ thống áp dụng các biện pháp kỹ thuật cô lập subcollection riêng tư, phân quyền Rules fail-closed và cung cấp phương án thi thay thế nếu không dùng sinh trắc học. | Từ ngữ "tuyệt đối 100%" mang tính khẳng định phi thực tế. Chưa qua kiểm toán an ninh mạng độc lập của cơ quan có thẩm quyền. | `ĐÃ SỬA` |
| 3 | **Model 1 (Hóa học)** | Hệ luật ngắt mạch đạt độ chính xác 100% trên dữ liệu tổng hợp vì luật đúng theo định nghĩa. | Hệ luật benchmark dạng ngưỡng đơn biến đạt 28/30 (93.33%) trên nhóm A; lệch 2 ca vùng ranh giới so với hàm rủi ro đa biến trọng số trong bộ sinh nhãn. | Phát hiện sự khác biệt về định nghĩa giữa hàm rủi ro đa biến có trọng số trong script sinh nhãn và hệ luật đơn biến rẽ nhánh trong benchmark. | `ĐÃ SỬA` |
| 4 | **Model 2 (Vật lý)** | k-NN vượt trội hơn hệ luật trên toàn bộ các ca kiểm thử quang học; hệ luật và k-NN có hiệu năng ngang nhau. | Trên 15 ca biên viết tay kiểm thử đồng thời 3 chiều sai số, cả Luật, k-NN và Majority đều chỉ đạt 5/15 (33.33%); không phương pháp nào vượt được baseline đoán mò. | Loại bỏ từ ngữ "ngang nhau". Bổ sung phân tích 10 ca sai: khi 3 chiều sai số đồng mức, các đặc trưng triệt tiêu lẫn nhau khiến cả 2 phương pháp suy giảm về baseline. | `ĐÃ SỬA` |
| 5 | **Baseline Majority** | Baseline lớp đa số Model 1 đạt 28/30 trên nhóm A, 10/20 trên nhóm B, tổng hợp 35/50. | Baseline lớp đa số Model 1 sử dụng duy nhất lớp đa số của tập huấn luyện (Class 2: Nguy hiểm, 153/180 = 85.00%): Nhóm A đạt 28/30, Nhóm B đạt 7/20, Tổng hợp đạt 35/50 ($28 + 7 = 35$). | Khắc phục mâu thuẫn số học $28 + 10 = 38 \neq 35$. Baseline majority theo chuẩn khoa học phải là một bộ phân loại không đổi học từ tập huấn luyện. | `ĐÃ SỬA` |
| 6 | **Model 3 (Intent)** | Naive Bayes vượt trội hoàn toàn hệ luật với độ chính xác 90.77% so với 21.54% của hệ luật. | Regex cũ đạt 14/65 (21.54%, bằng đoán mò). Hệ luật tử tế đã tinh chỉnh sau khi xem test đạt 45/65 (69.23%). Naive Bayes đạt 59/65 (90.77%, $p=0.0043$), nhưng tập test chưa độc lập hoàn toàn với tập train. | Bổ sung baseline luật tử tế và ghi chú minh bạch về độ lệch: luật được viết sau khi quan sát dữ liệu test và tập test chia sẻ cấu trúc câu với tập huấn luyện. | `ĐÃ SỬA` |
| 7 | **Kiểm định Thống kê** | Kiểm định McNemar sử dụng công thức $p = \exp(-\chi^2 / 2)$ với giá trị $p$ từ 0.02 đến 0.19. | Tính toán lại toàn bộ kiểm định McNemar theo chuẩn 1 bậc tự do ($df=1$) có hiệu chỉnh liên tục Edwards và kiểm định nhị thức chính xác hai phía (Exact Two-Sided Binomial Test). | Công thức $\exp(-\chi^2 / 2)$ là p-value của phân bố Chi-bình phương với 2 bậc tự do ($df=2$), không đúng với kiểm định McNemar ($df=1$). | `ĐÃ SỬA` |
| 8 | **RAG Giảm Ảo Giác** | Có RAG giúp giảm ảo giác từ 28% xuống 4% và tăng tỷ lệ phát hiện câu hỏi ngoài phạm vi lên 96.67%. | Thí nghiệm trên 80 ca trước đây là mô phỏng suy nghiệm (Heuristic Simulation), chưa gọi API thật. Hiện tại đã chuẩn bị tập 100 câu phân tầng khóa hash nháp SHA-256, gắn nhãn `[CHƯA CÓ]` kết quả chạy live. | Minh bạch rõ ràng bản chất giữa kịch bản suy nghiệm mô phỏng và thực nghiệm gọi API live có ghi nhật ký token. | `ĐÃ SỬA` |
| 9 | **Xác thực Quản trị** | Xác thực phân quyền quản trị viên bằng danh sách email whitelist cứng và trường `role` trong tài liệu Firestore. | Chuyển toàn bộ sang cơ chế Firebase Custom Claims (`token.admin == true`); khóa client không được ghi hoặc sửa trường `role` cả khi tạo và sửa. | Loại bỏ nguy cơ giả mạo hoặc leo thang đặc quyền từ phía client nếu tài khoản bị xâm nhập hoặc email chưa được xác minh. | `ĐÃ SỬA` |
| 10 | **Đấu trường Ghép trận** | Ghép trận đấu trường 1v1 tức thì trong 3-5 giây. | Hệ thống sử dụng hàng đợi ghép trận với ngưỡng chờ tối đa 30 giây; sau 30 giây nếu không có đối thủ sẽ kích hoạt cơ chế luyện tập cùng AI mô phỏng. | Làm rõ cơ chế thực tế để thí sinh không hiểu nhầm là luôn có học sinh thật trực tuyến cùng thời điểm. | `ĐÃ SỬA` |
| 11 | **Nhãn Tri Thức Giáo Viên** | Các mục tri thức tự học có nhãn "verified_by_teacher" được hệ thống ghi nhận là đã được giáo viên thẩm định chuẩn mực. | Toàn bộ các nhãn "verified_by_teacher" sinh bởi cơ chế tự động (Auto-Verified) hoặc script trước đây đã bị gỡ bỏ, chỉ giữ lại các mục do tài khoản giáo viên con người thật duyệt. | Tránh ngộ nhận về việc giáo viên con người đã rà soát thực tế từng mục tri thức. Hệ thống chỉ nạp tri thức giáo viên thật vào bộ nhớ RAG của học sinh. | `ĐÃ GỠ` |

---

## ⚠️ 5. SỰ CỐ NHIỄM ĐÁP ÁN TRONG THÍ NGHIỆM VÀ CÁCH KHẮC PHỤC

### 5.1. Mô tả sự cố nhiễm đáp án ban đầu
Trong các đợt chạy thử nghiệm ban đầu (các đợt chạy lưu trữ tại `reports/ablation/archive_uncertain/`), nhóm nghiên cứu phát hiện nguy cơ rò rỉ và nhiễm tri thức:
1. **Rò rỉ từ tri thức tự học (Learned Knowledge)**: Một số bản ghi trong collection `learned_knowledge` (chứa tiền tố `bench_verified_*` hoặc nhãn `Auto-Verified`) được tạo ra từ các script kiểm thử benchmark trước đó. Khi bộ truy xuất RAG hoạt động ở chế độ mở, các trích đoạn này có thể bị nạp vào ngữ cảnh mô hình, khiến mô hình tiếp cận đáp án mẫu đã được định sẵn thay vì suy luận từ sách giáo khoa chuẩn GDPT 2018.
2. **Khiếm khuyết cấu trúc khóa bộ nhớ đệm (Cache Key)**: Cấu trúc khóa cache cũ chỉ gồm tên điều kiện, mã câu hỏi, phiên bản chuỗi và tên mô hình, mà không bao gồm mã băm SHA-256 của kho tri thức (Corpus Hash), mã băm của ngữ cảnh truy xuất thực tế (Context/Chunk Hash) và mã băm của bộ dữ liệu (Dataset SHA-256). Điều này dẫn đến nguy cơ các kết quả sinh ra từ kho tri thức cũ hoặc ngữ cảnh khác có thể bị sử dụng lại trong lần chạy mới nếu không làm sạch cache.

### 5.2. Cách thức phát hiện
- Nhóm kiểm toán thực hiện truy vấn đối soát chéo trên toàn bộ collection `learned_knowledge` và phát hiện 157/161 bản ghi mang nhãn tự động hoặc tiền tố `bench_verified_`.
- Kiểm tra các cuộc gọi trong cache cho thấy có những câu hỏi nhận được kết quả trùng khớp mà không ghi nhận rõ mã băm của các đoạn văn bản SGK được đưa vào prompt.

### 5.3. Biện pháp khắc phục khoa học và triệt để
Nhóm nghiên cứu đã thực hiện các biện pháp cô lập nghiêm ngặt:
1. **Lưu trữ cách ly toàn bộ dữ liệu không chắc chắn**: Toàn bộ kết quả chạy cũ và cache 327 lệnh gọi cũ đã được di chuyển vào thư mục lưu trữ `reports/ablation/archive_uncertain/`. Tệp bộ nhớ đệm chính `reports/ablation/call_cache.json` được thiết lập lại về trạng thái rỗng (`{}`) trước khi chạy lại.
2. **Đóng băng kho ngữ liệu chuẩn 303 chunk (Frozen Corpus Guard)**:
   - Khóa cứng kho ngữ liệu SGK chuẩn GDPT 2018 gồm đúng 303 chunk tại `src/ai-training/datasets/rag-knowledge/stem-corpus.json`.
   - Ghi nhận và kiểm tra mã băm SHA-256 cố định: `28f7b3382697954fd92f9c09971469d6f9d2c897e5c506fc838b800603ac2cc0`. Bất kỳ thay đổi nào dù chỉ 1 ký tự trong kho học liệu sẽ khiến pipeline từ chối chạy ngay lập tức.
   - Thêm cơ chế chốt chặn runtime (`FROZEN_303_CHUNK_IDS`): Nếu quá trình truy xuất trả về bất kỳ chunkId nào nằm ngoài 303 chunk hoặc có tiền tố `bench_verified_`, script lập tức ngắt khẩn cấp (`throw Error`).
3. **Tái thiết kế cấu trúc khóa bộ nhớ đệm (Cryptographic Cache Isolation)**:
   - Khóa cache mới bắt buộc kết hợp: `condition + case_id + dataset_version + dataset_sha256 + corpus_hash + retrieved_chunks_hash + context_hash + model_id + question_hash + system_prompt_hash + run_index`.
   - Viết bộ kiểm thử hồi quy độc lập (`tests/cache_key_isolation.test.mjs`) với 6 trường hợp kiểm định: chứng minh rằng nếu khác kho tri thức, khác ngữ cảnh trích đoạn hoặc khác phiên bản dữ liệu thì hệ thống bắt buộc tạo khóa mới (Cache Miss) và không dùng lại dữ liệu cũ.
4. **Loại bỏ hoàn toàn tri thức tự động khỏi bộ nạp Client**:
   - Thanh lọc tệp công khai `public/data/global-learned-knowledge.json` và `src/data/global-learned-knowledge.json` từ 176 mục xuống 49 mục (loại bỏ toàn bộ 127 mục `bench_verified_*` và `Auto-Verified`).
   - Cập nhật bộ nạp `src/lib/ragService.js` để từ chối nạp bất kỳ bản ghi nào mang nhãn `Auto-Verified` hoặc bắt đầu bằng `bench_verified_`.

---

## ⚠️ 6. CÁC HẠN CHẾ KỸ THUẬT HIỆN TẠI (LIMITATIONS)

1. **Nhãn "Giáo viên duyệt" cũ đã bị gỡ bỏ**: Toàn bộ nhãn duyệt trước đây được tạo bằng thuật toán quy tắc heuristic tự động nhằm mục đích thử nghiệm giao diện đã bị gỡ bỏ khỏi hệ thống. Hệ thống phân định rõ: chỉ những bản ghi có chữ ký xác thực từ tài khoản được cấp Custom Claims `teacher: true` mới được hiển thị là có giáo viên duyệt.
2. **Cỡ mẫu thẩm định con người còn nhỏ**: Hiện tại số phiếu thẩm định từ giáo viên con người thật đang trong giai đoạn tiếp nhận qua Cổng Thẩm Định Chuyên Môn (`/danh-gia-chuyen-mon`). Đối với các tập mẫu có số lượng nhỏ ($n < 30$), hệ thống tuân thủ nguyên tắc không hiển thị tỷ lệ phần trăm hoặc hệ số Kappa để tránh suy diễn thống kê sai lệch, chỉ hiển thị số đếm thô ($TP, FP, FN, TN$).
3. **Mô hình phụ thuộc vào hạn mức API**: Tốc độ thực nghiệm bị giới hạn bởi hạn mức gọi của nhà cung cấp mô hình (Gemini API Free Tier 15 RPM). Hệ thống áp dụng cơ chế giãn cách an toàn 4.100 ms mỗi lệnh gọi và thuật toán Exponential Backoff tự động khi gặp mã lỗi 503/429.

---

## 🔒 6. KẾT LUẬN VỀ TÍNH TOÀN VẸN CỦA DỮ LIỆU VÀ MÃ NGUỒN

1. Mọi số liệu trong các bảng biểu báo cáo hiện tại đều có thể tái lập thông qua các script kiểm toán tự động lưu tại thư mục `scripts/` và `tests/`.
2. Toàn bộ mã nguồn, dữ liệu huấn luyện và tài liệu kỹ thuật đã được quét và loại bỏ các chuỗi bí mật, mật khẩu cứng và dữ liệu định danh cá nhân.
3. Dự án tuân thủ nghiêm ngặt tinh thần khoa học: Báo cáo những gì hệ thống thực sự làm được, chỉ rõ những gì còn đang ở mức mô phỏng hoặc nháp, và phân tích sâu sắc các hạn chế kỹ thuật thay vì che giấu.

