# 📑 BÁO CÁO CẢI TIẾN KỸ THUẬT VÀ KHẮC PHỤC TỒN TẠI (CHẶNG 1)
> **Dự án**: Nền tảng Học tập & Đấu trường Trí tuệ STEM HUB  
> **Mã dự án**: AI26B0012  
> **Thời điểm lập báo cáo**: Tháng 11/2026 (Phiên bản cập nhật sau kiểm toán thực tế)  
> **Cam kết**: Báo cáo được xây dựng trên nguyên tắc trung thực khoa học, đối chiếu trực tiếp từ mã nguồn và dữ liệu đo đạc thực tế; không sử dụng các thuật ngữ phóng đại ("hoàn hảo", "tuyệt đối", "100%"). Mọi chỉ số đều kèm kích thước mẫu $n$, phân tầng $k/n$, khoảng tin cậy Wilson CI 95% và kiểm định cặp McNemar với 1 bậc tự do ($df=1$).

---

## 🎯 1. TÓM TẮT 3 NHÓM YÊU CẦU CỐT LÕI CỦA BAN GIÁM KHẢO (BGK)

| Nhóm Yêu Cầu | Trọng Tâm Yêu Cầu Của BGK | Hiện Trạng Đã Khắc Phục |
|---|---|---|
| **Yêu cầu 1: Tính Chân Thực Của Mô Hình & Thống Kê** | Phân định rạch ròi giữa luật tất định, mô hình học từ dữ liệu và baseline đoán mò; kiểm định ý nghĩa thống kê chính xác ($df=1$, McNemar binomial exact); giải trình nguồn gốc dữ liệu test và kích thước mẫu $n$. | Đã tách bạch 3 nhóm mô hình, xây dựng bộ benchmark đối chứng thực tế trên tập kiểm thử độc lập, tính khoảng tin cậy Wilson 95% và kiểm định McNemar chính xác với $df=1$. Bổ sung baseline công thức tuyến tính gốc. |
| **Yêu cầu 2: An Toàn & Quyền Riêng Tư Sinh Trắc Học** | Dữ liệu khuôn mặt học sinh phải được bảo vệ nghiêm ngặt; không lưu trữ chung với thông tin tài khoản công khai; phải có cơ chế đồng ý của phụ huynh và phương án thay thế không ép buộc. | Đã di chuyển toàn bộ vector đặc trưng 128-D vào subcollection `users/{uid}/private/biometrics` với phân quyền Firestore chỉ cho phép chính chủ đọc/ghi; bổ sung phương án thi bằng mã OTP thay thế; soạn Runbook vận hành. |
| **Yêu cầu 3: Minh Bạch Hóa Tuyên Bố & Kiểm Toán Bảo Mật** | Gỡ bỏ toàn bộ danh sách giáo viên thẩm định chưa có chữ ký; loại bỏ các tuyên bố về hiệu năng chưa qua thực nghiệm; đóng kín các lỗ hổng xác thực (Server Fail-Closed, loại bỏ email whitelist). | Đã gỡ bỏ toàn bộ tên giáo viên khỏi mã nguồn và giao diện; triển khai cổng đánh giá độc lập Teacher Review Portal; siết chặt xác thực chỉ dùng Firebase Custom Claims; đạt 178 tests kiểm thử pass. |

---

## 🔬 2. KẾT QUẢ ĐỐI CHỨNG THỰC NGHIỆM CHI TIẾT (ĐỌC TỪ DỮ LIỆU JSON)

Dữ liệu được trích xuất trực tiếp từ [reports/ablation/ml_vs_rules_and_ablation_results.json](file:///e:/project/cuoc_thi_AI/reports/ablation/ml_vs_rules_and_ablation_results.json):

### 2.1. Model 1: Phân loại rủi ro thí nghiệm Hóa học ChemLab ($n = 50$)
- **Bản chất kỹ thuật**: Kết hợp giữa thuật toán tất định (Circuit Breaker ngắt khẩn cấp) và mạng hồi quy tuyến tính Softmax 1 lớp ẩn đo rủi ro liên tục cho thanh trượt giao diện.
- **Làm rõ 2 tập dữ liệu huấn luyện và khảo sát**:
  1. *Tập huấn luyện ban đầu (180 mẫu)*: Sinh từ `generate-expanded-datasets.js`, bị lệch lớp nghiêm trọng (1 An toàn, 26 Cảnh báo, 153 Nguy hiểm).
  2. *Tập đánh giá độc lập cân bằng (135 mẫu)*: Lưu tại `independent_eval_135.json` (45 An toàn, 45 Cảnh báo, 45 Nguy hiểm) phục vụ kiểm tra tính ổn định phân phối.
- **Bản chất hàm sinh nhãn vs Hệ luật**:
  - *Hàm sinh nhãn*: Sử dụng công thức tuyến tính đa biến có trọng số kết hợp ngưỡng:  
    $$\text{score} = \left(\frac{\text{temp}}{120}\right) \times 0.45 + \left(\frac{100 - \text{energy}}{100}\right) \times 0.25 + \left(\frac{\text{violations}}{5}\right) \times 0.2 + (\text{hasHazard} \times 0.1)$$
  - *Hệ luật benchmark*: Là tập hợp các câu lệnh rẽ nhánh `if-else` trên ngưỡng từng biến đơn lẻ.
  - *Mạng Softmax NN*: Học xấp xỉ lại công thức tuyến tính này để xuất phân phối xác suất trơn cho thanh trượt UI, không tạo ra tri thức vật lý/hóa học mới.
- **Tập kiểm thử**: $n=50$ mẫu (gồm Nhóm A: 30 mẫu kiểm thử tổng hợp + Nhóm B: 20 ca biên viết tay).
- **Kết quả đo đạc thực tế**:
  - **Baseline công thức tuyến tính có trọng số (Hàm gốc)**: Đạt **48/50 (96.00%)** | 95% CI: [86.5%, 98.9%] (Nhóm A: 30/30, Nhóm B: 18/20).
  - **Hệ luật phân ngưỡng đơn lẻ**: Đạt **47/50 (94.00%)** | 95% CI: [83.8%, 97.9%] (Nhóm A: 28/30, Nhóm B: 19/20).  
    *Giải trình 2 ca lệch ở Nhóm A*: Do sự khác biệt ranh giới giữa hàm rủi ro liên tục có trọng số và hệ luật ngưỡng rời rạc đơn biến.
  - **Softmax NN (chuẩn hóa Z-Score)**: Đạt **40/50 (80.00%)** | 95% CI: [67.0%, 88.8%] (Nhóm A: 28/30, Nhóm B: 12/20).
  - **Baseline đoán mò lớp đa số (Class 2 từ tập train)**: Đạt **35/50 (70.00%)** | 95% CI: [56.2%, 80.9%].
  - **Softmax NN khi bỏ chuẩn hóa Z-Score**: Đạt **35/50 (70.00%)** *(với siêu tham số hiện tại không hội tụ khi bỏ chuẩn hóa)*.
  - **Kiểm định McNemar**: Cặp lệch $b=9$ (Luật đúng, NN sai), $c=2$ (NN đúng, Luật sai), $\chi^2 = 3.2727 (df=1)$, $p_{\chi^2} = 0.0704$, $p_{\text{exact}} = 0.0654$.
  - **Kết luận khoa học**: Chưa đủ bằng chứng để khẳng định sự khác biệt có ý nghĩa thống kê giữa Hệ luật và Softmax NN ở mức ý nghĩa $\alpha=0.05$. Công thức tuyến tính đóng đạt cùng chức năng, Softmax NN chỉ đóng vai trò hàm trơn cho thanh trượt UI.

### 2.2. Model 2: Chẩn đoán lỗi thí nghiệm Quang hình học ($n = 45$)
- **Bản chất kỹ thuật**: Mô hình học từ dữ liệu (k-Nearest Neighbors, $k=5$) chẩn đoán 3 loại sai số quang học (góc tới, vị trí thấu kính, chiết suất môi trường).
- **Tập kiểm thử**: $n=45$ mẫu (Nhóm A: 30 mẫu mô phỏng độc lập theo định luật Snell + Nhóm B: 15 ca biên viết tay).
- **Kết quả đo đạc thực tế**:
  - **Nhóm A (30 mẫu mô phỏng độc lập)**: Luật đạt **30/30 (100.00%)**; k-NN đạt **30/30 (100.00%)**; Baseline đa số đạt **10/30 (33.33%)**.
  - **Nhóm B (15 ca biên do nhóm tự viết tay — Phân tích định tính)**: Luật đạt **5/15 (33.33%)**; k-NN đạt **5/15 (33.33%)**; Baseline đa số đạt **5/15 (33.33%)**.  
    *Phân tích định tính*: Trên 15 ca biên này, cả 3 chiều lỗi (góc tới, vị trí, chiết suất) cùng đồng thời xảy ra. Bản chất bài toán thực tế là đa nhãn (multi-label), nhưng hệ thống hiện tại đang ép buộc gán đơn nhãn (single-label), khiến việc chọn 1 nhãn duy nhất mang tính chủ quan của người tạo ca biên. Cả Luật, k-NN và Majority đều đạt đúng 5/15 và không phương pháp nào vượt được baseline. Do đó, Nhóm B được tách thành phân tích định tính về giới hạn bài toán, không đưa vào số liệu đánh giá chính của mô hình.
  - **Tổng hợp cả bộ ($n=45$)**:
    - Hệ luật phân ngưỡng: **35/45 (77.78%)** | 95% CI: [63.7%, 87.5%]
    - k-NN ($k=5$): **35/45 (77.78%)** | 95% CI: [63.7%, 87.5%]
    - Baseline đoán mò lớp đa số: **15/45 (33.33%)** | 95% CI: [21.4%, 47.9%]
  - **Kiểm định McNemar**: Cặp lệch $b=5, c=5$, $\chi^2 = 0 (df=1)$, $p_{\chi^2} = 1.0000$, $p_{\text{exact}} = 1.0000$.
  - **Kết luận khoa học**: Không có sự khác biệt có ý nghĩa thống kê giữa Luật và k-NN ($p=1.0000$). Trên các ca lỗi đồng thời đa chiều, mô hình phân loại đơn nhãn suy giảm về mức tương đương baseline đoán mò.

### 2.3. Model 3: Phân loại ý định hội thoại Javit Intent ($n = 65$)
- **Bản chất kỹ thuật**: Mô hình học máy Multinomial Naive Bayes kết hợp bộ tiền xử lý chuẩn hóa teencode tiếng Việt.
- **Kết quả đo đạc thực tế**:
  - Regex đơn giản cũ: **14/65 (21.54%)** (bằng baseline đoán mò lớp đa số 14/65).
  - Hệ luật tử tế (luật đã tinh chỉnh sau khi xem bộ test): **45/65 (69.23%)** | 95% CI: [57.2%, 79.1%].
  - Naive Bayes (học từ dữ liệu): **59/65 (90.77%)** | 95% CI: [81.3%, 95.7%].
  - **Kiểm định McNemar**: Cặp lệch $b=4, c=18$, $\chi^2 = 7.6818 (df=1)$, $p_{\chi^2} = 0.0056$, $p_{\text{exact}} = 0.0043 < 0.01$.
  - **Kết luận khoa học**: Trên bộ test 65 câu này, Naive Bayes vượt trội hơn hệ luật có ý nghĩa thống kê ($p=0.0043$). Tuy nhiên, cần lưu ý bộ test 65 câu này có chia sẻ template câu với dữ liệu huấn luyện.

---

## 🔍 3. KIỂM TOÁN DỮ LIỆU FIRESTORE & ĐỐI CHIẾU GIT LOG

Dựa trên phân tích updateTime của Firestore và đối chiếu nhật ký Git commit của dự án:

| Collection | Số lượng Docs | Khoảng thời gian updateTime | Đối chiếu Git Log | Ghi chú đối soát |
|---|:---:|---|---|---|
| `exams` | 400 | `2026-07-13T18:49:11Z` – `18:49:21Z` | Commit `17d69b3` (2026-07-15 14:48:12 +0700) | Khởi tạo cấu trúc ngân hàng đề thi gốc trong `src/data/exams.js` |
| `questions` | 2,200 | `2026-08-14T15:35:58Z` – `15:36:09Z` | Commit `fd6d587` & `fc8ee64` (2026-08-15 16:54:15 +0700) | Nạp ngân hàng câu hỏi qua `scripts/reseed_firestore.js` |
| `users` | 27 | Rải rác theo đợt tạo | Chưa đối chiếu được | Dữ liệu tài khoản người dùng và bot mô phỏng |
| `admin_logs` | 48 | Rải rác | Chưa đối chiếu được | Nhật ký ghi nhận thao tác quản trị |
| `expert_reviews`| Biến động | Rải rác | Chưa đối chiếu được | Phiếu thẩm định chuyên môn (tách riêng web_portal và imported_form) |

> **Nguyên tắc đối soát**: Các collection không tìm thấy commit trực tiếp tương ứng được ghi nhận trung thực là **"Chưa đối chiếu được"**, loại bỏ hoàn toàn các nhận định phỏng đoán cá nhân.

---

## 🛡️ 4. BẢO MẬT ADMIN & BẢO VỆ DỮ LIỆU SINH TRẮC HỌC

1. **Cô lập Subcollection Riêng Tư**:
   - Trường `faceDescriptor` đã được loại bỏ hoàn toàn khỏi tài liệu gốc `users/{uid}`.
   - Dữ liệu khuôn mặt được chuyển vào subcollection `users/{uid}/private/biometrics`, chỉ chính chủ sở hữu tài khoản mới có quyền đọc/ghi. Admin và Teacher bị chặn hoàn toàn ở tầng Rules.
2. **Quyền Đồng Ý Phụ Huynh & Phương Án Thi Thay Thế**:
   - Bổ sung modal xin xác nhận của phụ huynh đối với học sinh dưới 18 tuổi.
   - Thí sinh có quyền từ chối cung cấp khuôn mặt và được lựa chọn phương án thi thay thế bằng mã xác thực 2 lớp qua email/OTP mà không bị trừ điểm hay hạn chế quyền làm bài.
3. **Loại Bỏ Email Whitelist & Siết Chặt Phân Quyền Custom Claims**:
   - Loại bỏ toàn bộ danh sách email cứng (`admin123@gmail.com`, `admin@stemhub.edu.vn`) khỏi mã nguồn API, Rules và giao diện.
   - Chuyển toàn bộ phân quyền Quản trị viên sang **Firebase Custom Claims** (`token.admin == true`), chặn triệt để lỗ hổng sửa trường `role` trong document để leo thang đặc quyền.
   - Đã kiểm toán 25 tài khoản test tồn tại trên Auth, chuẩn bị script đặt lại mật khẩu ngẫu nhiên an toàn (`scripts/remediate_test_accounts.cjs`).
   - Loại bỏ hoàn toàn các secret key tĩnh và token nội bộ chia sẻ (không dùng so khớp tĩnh hay timingSafeEqual cho token chia sẻ); xác thực 100% bằng Firebase ID Token. Vòng học liên tục chỉ nạp tri thức từ Trợ lý chính khi có Bearer ID Token của học sinh đăng nhập; các phòng lab nhúng đã tắt tính năng gửi trực tiếp không xác thực. Tri thức mới mặc định ở trạng thái `pending_review` cách ly kỹ thuật.

---

## 📊 5. TỔNG HỢP KIỂM THỬ HỆ THỐNG (178 TESTS PASS KHÔNG ĐẾM TRÙNG)

Hệ thống đã thiết lập và vượt qua toàn bộ 178 ca kiểm thử tự động phân định rõ ràng giữa môi trường Node.js và Firestore Emulator:

| Nhóm Kiểm Thử | File Test | Số Test | Môi Trường | Trạng Thái |
|---|---|:---:|:---:|:---:|
| Phân quyền Firestore Rules cốt lõi | `tests/firestore.rules.test.js` | 52 | Emulator | ✅ PASS |
| Đăng ký Client mới & Chặn leo thang | `tests/client_registration_rules.test.js` | 8 | Emulator | ✅ PASS |
| Di chuyển dữ liệu sinh trắc học | `tests/biometrics_migration.test.cjs` | 1 | Emulator | ✅ PASS |
| Cách ly tri thức RAG & Xác thực | `tests/rag_quarantine_and_auth.test.js` | 12 | Node.js | ✅ PASS |
| Bảo mật API Routes (Claims-driven) | `tests/api_admin_security.test.mjs` | 4 | Node.js | ✅ PASS |
| Cổng thẩm định giáo viên & Cohen Kappa | `tests/teacher_review_portal.test.js` | 14 | Node.js | ✅ PASS |
| Xác thực Admin không dùng Whitelist | `tests/admin_auth_whitelist.test.js` | 10 | Node.js | ✅ PASS |
| Xác thực Server Fail-Closed | `tests/auth_fail_closed.test.js` | 10 | Node.js | ✅ PASS |
| Chặn ảo giác & Heuristic Verifier | `tests/grounding_and_ui_negative.test.js` | 8 | Node.js | ✅ PASS |
| Phương án thi thay thế sinh trắc học | `tests/biometrics_alternative_exam.test.js` | 4 | Node.js | ✅ PASS |
| Khả năng chịu lỗi & Chế độ Offline | `tests/fallback_resilience.test.js` | 4 | Node.js | ✅ PASS |
| Kiểm thực sửa lỗi gian lận & Trận đấu | `tests/bugfix_validation.test.js` | 21 | Node.js | ✅ PASS |
| Động cơ vật lý phản xạ gương 3D | `tests/physicsEngine.test.js` | 6 | Node.js | ✅ PASS |
| Động cơ mô phỏng sóng & lò xo | `tests/harmonicPhysicsEngine.test.js` | 4 | Node.js | ✅ PASS |
| Xác suất di truyền Mendel | `src/ai-training/scripts/test-bayes-genetics.js` | 10 | Node.js | ✅ PASS |
| Thích ứng độ khó 1PL Rasch IRT | `src/ai-training/scripts/test-math-irt.js` | 10 | Node.js | ✅ PASS |
| **TỔNG CỘNG (KHÔNG ĐẾM TRÙNG)** | **16 test suites** | **178** | **-** | **✅ 178/178 TESTS PASS** |

> **Lưu ý về Token kiểm thử API**: Các test suite kiểm thử API (`tests/api_admin_security.test.mjs`, `tests/auth_fail_closed.test.js`) sử dụng Mock JWT Token giả lập cục bộ không qua internet. Quy trình kiểm thử thực tế với Token Firebase thật sau khi deploy được quy định tại [docs/smoke-test-thuc-te.md](file:///e:/project/cuoc_thi_AI/docs/smoke-test-thuc-te.md).

---

## ⚠️ 6. CÁC HẠN CHẾ KỸ THUẬT VÀ PHẦN CHƯA HOÀN THÀNH

Nhóm nghiên cứu công khai và minh bạch các phần **chưa hoàn thành** tại thời điểm nộp báo cáo:

1. **`[CHƯA CÓ]` Đánh giá thực nghiệm của Giáo viên độc lập**:
   - Hệ thống đã hoàn thiện giao diện chuyên môn (Teacher Review Portal), cơ chế làm mù thông tin và tính độ đồng thuận Cohen's Kappa, đặt mặc định 20 mục chấm (khoảng 40 phút).
   - Tuy nhiên, hiện tại **chưa có giáo viên nào trực tiếp chấm xong dữ liệu**. Toàn bộ điểm số hiện tại là điểm tự đánh giá nội bộ của các thành viên trong nhóm nghiên cứu hoặc điểm chuẩn kỹ thuật tổng hợp.
2. **`[CHƯA CÓ]` Kết quả thực nghiệm Ablation RAG chạy live trên Gemini API**:
   - Nhóm đã biên soạn và phân tầng tập kiểm thử 100 câu (40 câu khái niệm, 30 câu số liệu/công thức, 30 câu ngoài phạm vi/đối kháng).
   - Đã khóa hash nháp SHA-256 (`4cf0e5e3ae5f9381a47debbea763ae38f414933d62d24a385a2eea83885eae77`), cập nhật phiên bản v1.4.0 với cột Nguồn xác nhận và Loại nguồn.
   - Ước tính số lượng lệnh gọi: 630 calls (~334.500 tokens). Thời gian chạy ước tính: 15 – 25 phút.
   - **Chưa chạy `--execute` live** trên API thật để bảo đảm trần ngân sách và an toàn khóa bí mật; báo cáo giữ nguyên trạng thái `[CHƯA CÓ]` cho kết quả chạy thật.
   - *Lưu ý phương pháp luận*: Câu hỏi từ nguồn công khai có khả năng đã nằm trong dữ liệu tiền huấn luyện của mô hình nền tảng, kết quả có thể mang tính lạc quan; câu hỏi chọn lọc thuộc 101 chuyên đề trong kho 303 chunk nên thực nghiệm RAG chỉ đo lường năng lực trong phạm vi này.
3. **Giới hạn lưu vết của Firestore**:
   - Firestore document metadata chỉ lưu `createTime` và `updateTime`, không lưu danh tính người ghi (`request.auth.uid`).
   - Dịch vụ Cloud Data Access Audit Logs mặc định tắt trên Google Cloud Platform để tránh phát sinh chi phí lưu trữ log lớn. Do đó, nhóm không đưa ra tuyên bố võ đoán về việc "không bị can thiệp" mà chỉ báo cáo đúng số liệu timestamp kỹ thuật ghi nhận được.
4. **Tài nguyên MP3 trong thư mục public**:
   - 3 file MP3 (`public/labs/lab-hoa-sandbox/...`, `public/labs/lab-ktra15p/dist/...`, `public/labs/lab-ktra15p/public/...`) có dung lượng 25.51 MB và cùng mã băm SHA-256 (`1a4370bb...`). Nguồn gốc/giấy phép hiện "chưa rõ". Đề xuất thay thế bằng file âm thanh ngắn CC0 miễn phí bản quyền trước khi xuất bản rộng rãi.
