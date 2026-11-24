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

---

## 🔒 6. KẾT LUẬN VỀ TÍNH TOÀN VẸN CỦA DỮ LIỆU VÀ MÃ NGUỒN

1. Mọi số liệu trong các bảng biểu báo cáo hiện tại đều có thể tái lập thông qua các script kiểm toán tự động lưu tại thư mục `scripts/` và `tests/`.
2. Toàn bộ mã nguồn, dữ liệu huấn luyện và tài liệu kỹ thuật đã được quét và loại bỏ các chuỗi bí mật, mật khẩu cứng và dữ liệu định danh cá nhân.
3. Dự án tuân thủ nghiêm ngặt tinh thần khoa học: Báo cáo những gì hệ thống thực sự làm được, chỉ rõ những gì còn đang ở mức mô phỏng hoặc nháp, và phân tích sâu sắc các hạn chế kỹ thuật thay vì che giấu.

