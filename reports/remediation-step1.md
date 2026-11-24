> ⚠️ **TÀI LIỆU NỘI BỘ — KHÔNG NỘP BAN GIÁM KHẢO**
> Báo cáo này phục vụ mục đích ghi vết kỹ thuật nội bộ trong quá trình khắc phục sự cố, không nằm trong hồ sơ dự thi chính thức gửi Ban Giám khảo.

---

# BÁO CÁO THỰC THI CHẶNG 1: QUY TẮC TRUNG THỰC & CẢI TIẾN HỆ THỐNG AI
**Dự án**: STEM HUB — Nền Tảng Đấu Trường Học Thuật 1v1 & Phòng Thí Nghiệm Ảo STEM  
**Nhánh Git**: `fix/cleanup-truthfulness-and-knowledge`  
**Commit Hash**: `c8791e0`  
**Thời điểm thực thi**: 2026-11-15T21:12:00+07:00  
**Tác giả**: Đội ngũ phát triển STEM HUB  

---

## 1. TỔNG HỢP KẾT QUẢ THỰC HIỆN 3 YÊU CẦU CỦA BGK

### Yêu cầu 1: Xóa bỏ toàn bộ tên/chữ ký giả định của 4 giáo viên & Chuẩn hóa bộ 150 ca
* **Danh sách các file đã rà soát và loại bỏ 4 tên giáo viên**:
  1. `src/ai-training/datasets/benchmark_150_cases.json`: Loại bỏ 150 trường `verified_by_teacher`, xóa bỏ đối tượng gán giáo viên (`Thầy Lê Văn Hùng`, `Cô Đặng Thị Bích Thủy`, `Thầy Nguyễn Trọng Nghĩa`, `Cô Vũ Thị Hoàng Yến`).
  2. `src/ai-training/scripts/generate_full_150_dataset.js`: Xóa bỏ đối tượng `teachers`, đặt `teacher_validator: null`, chuyển trạng thái `status: "synthetic_unverified"`.
  3. `src/ai-training/scripts/generate_150_benchmark_cases.js`: Xóa bỏ đối tượng `teachers` và các gán nhãn giả định.
  4. `src/app/admin/knowledge-review/page.js`: Xóa tên giáo viên mặc định ở `useState` (chuyển thành `''`), xóa tên giáo viên trong hàm `seedSampleKnowledge`, bổ sung ô nhập họ tên giáo viên thật và chặn phê duyệt nếu để trống.
  5. `src/app/api/learned-knowledge/route.js`: Xóa bỏ fallback tên giáo viên cứng (`Thầy Nguyễn Trọng Nghĩa (Tổ Chuyên Môn)`), bắt buộc truyền `teacherName` hợp lệ khi gọi API `PATCH`.
  6. `src/data/global-learned-knowledge.json` & `public/data/global-learned-knowledge.json`: Xóa `rejectedBy: "Thầy Nguyễn Trọng Nghĩa"` và các nhãn `AI STEM HUB Auto-Verified (Hội đồng Thẩm định Sư phạm)`.
* **Định danh lại bộ 150 ca**: Đã đổi đồng bộ thành:
  > **"Bộ đối chứng kỹ thuật tổng hợp (synthetic benchmark) do nhóm xây dựng, chưa qua chấm của giáo viên"**
  Xuất báo cáo chi tiết tại `SYNTHETIC_BENCHMARK_150_REPORT.md` và dữ liệu tại `SYNTHETIC_BENCHMARK_150.csv`.

---

### Yêu cầu 2: Giữ nguyên kiến trúc, sửa tài liệu trung thực & Gắn nhãn 3 loại thành phần
* **Mô tả chính xác Model 1 (ChemLab Risk Classifier)**:
  - *Code*: `src/ai-training/scripts/chem-risk_train.js` (hàm `trainSoftmaxClassifier`, `predictChemRiskNN`).
  - *Bản chất thực tế*: Sử dụng **Thuật toán / Luật tất định** (Deterministic Rule-Based) làm quyết định phân loại cuối cùng:
    - Danger: `temp >= 80 || violations >= 2 || energy <= 35`
    - Warning: `temp >= 45 || violations >= 1 || energy <= 70 || hasHazard === 1`
    - Safe: Các trường hợp còn lại.
  - *Mạng nơ-ron Softmax*: Có huấn luyện 1000 epochs bằng Gradient Descent trên 4 đặc trưng $[T/120, (100-\text{energy})/100, \text{violations}/5, \text{hasHazard}]$, nhưng kết quả của mạng chỉ được dùng để cung cấp giá trị liên tục `riskScore` ($P(\text{danger})$).
  - *Nguồn dữ liệu & Nhãn*: 180 mẫu trong `risk-dataset.json` do script `generate-expanded-datasets.js` sinh tự động bằng hàm toán học ngẫu nhiên; nhãn sinh bằng chính luật IF/ELSE, không phải do chuyên gia hóa học dán nhãn thủ công.
  - *Gắn nhãn*: **Thuật toán / Luật tất định** (kết hợp Mạng nơ-ron Softmax chấm điểm rủi ro liên tục).
* **Mô tả chính xác Model 4 (Math Adaptive Engine)**:
  - *Code*: `src/lib/mathAdaptiveEngine.js` (hàm `calculateIRTHitProbability`, `selectAdaptiveMathQuestion`).
  - *Bản chất thực tế*: Áp dụng trực tiếp công thức giải tích Logit 1 tham số (1PL / Rasch Model):
    $$P = \frac{1}{1 + e^{-1.7 \cdot (\theta - b)}}$$
  - *Không có huấn luyện học máy*: Không có vòng lặp huấn luyện, không có thuật toán ước lượng hợp lý cực đại (MLE, MML hay JML). Năng lực $\theta$ và độ khó $b$ được chuyển đổi tuyến tính trực tiếp từ Elo: $\theta = (\text{studentElo} - 1500) / 400$, $b = (\text{itemElo} - 1500) / 400$. Hệ số phân biệt $\alpha = 1.7$ cố định; không có đoán mò $c_i$ (không phải 2PL hay 3PL).
  - *Dữ liệu*: Kiểm thử trên 10 cặp mẫu trong `test-math-irt.js` (4/10 ca rơi vào vùng ZPD $[0.60, 0.75]$).
  - *Gắn nhãn*: **Thuật toán tất định** (Deterministic Mathematical Formula Engine).
* **Gắn nhãn toàn bộ 6 mô hình và các thành phần phụ trợ**:
  1. Model 1 (ChemLab): **Thuật toán / Luật tất định** (kết hợp mạng nơ-ron Softmax chấm điểm rủi ro liên tục).
  2. Model 2 (Physics k-NN): **Mô hình học từ dữ liệu** ($k$-NN Instance-Based Learning trên dữ liệu tổng hợp). Sửa khoảng tin cậy: 5-Fold CV ($n=135$) đạt 96.30% [91.6%, 98.4%]; ca biên ($n=15$) đạt 86.67% [62.1%, 96.3%].
  3. Model 3 (Javit Intent): **Mô hình học từ dữ liệu** (Multinomial Naive Bayes). Công bố minh bạch 2 câu trùng khớp và 6 câu gần trùng giữa train và test. 7 nhãn thực tế là điều hướng UI/tra cứu.
  4. Model 4 (Math 1PL IRT): **Thuật toán tất định** (Công thức giải tích Logit Rasch ánh xạ từ Elo).
  5. Model 5 (Genetics Bayes): **Thuật toán tất định** (Tổ hợp xác suất bảng Punnett phân ly độc lập Menđen; chưa có hoán vị gen).
  6. Model 6 (TF-IDF RAG): **Thuật toán tất định & Thống kê ngữ liệu** (Vector Space Model $L_2$ trên 303 chunks tóm tắt; ảo giác giảm từ 28% xuống 4%, không đạt mức tuyệt đối 0%).
  7. Trợ lý Socratic: **Gọi LLM ngoại vi** (Google Gemini API qua BFF Route).
  8. Vision Math OCR: **Gọi LLM ngoại vi** (Gemini Vision API).
  9. Face 2FA: **Thị giác máy tính cục bộ** (TensorFlow.js Blazeface, chỉ phát hiện có mặt người, không nhận diện PII).
* **Tài liệu đã cập nhật**: `GIOI_THIEU_KIEN_TRUC_AI_STEM_HUB.md` và `README.md`.

---

### Yêu cầu 3: Tri thức mới mặc định pending, cách ly toàn bộ tri thức cũ & Siết Firestore Rules
* **Cách ly 46 bản ghi tri thức cũ**:
  - Toàn bộ 46 bản ghi trong `src/data/global-learned-knowledge.json` và `public/data/global-learned-knowledge.json` được cập nhật:
    `status: "pending_review"`, `teacherVerified: false`, `quarantined: true`, `quarantinedAt: "2026-11-15T21:05:00.000Z"`, `quarantineReason: "Cách ly kỹ thuật: Tri thức nạp tự động trước ngày 15/11/2026 chưa qua thẩm định của giáo viên thật"`.
  - Không xóa bất kỳ bản ghi nào; dữ liệu được bảo toàn phục vụ giáo viên thẩm định sau.
* **Bộ lọc truy xuất RAG (`src/lib/ragService.js` & `src/app/api/learned-knowledge/route.js`)**:
  - Cả môi trường client (`localStorage`), server (`global-learned-knowledge.json`), và Firestore: chỉ những bản ghi có `(status === 'verified_by_teacher' || teacherVerified === true) && !quarantined` mới được nạp vào bộ nhớ truy xuất RAG.
  - Tri thức mới nộp từ học sinh qua `saveLearnedKnowledge` hoặc `POST /api/learned-knowledge` mặc định `status: 'pending_review'`, `teacherVerified: false`, `quarantined: false` và KHÔNG được đưa vào active cache.
* **Màn hình Teacher Review HUD (`src/app/admin/knowledge-review/page.js`)**:
  - Bổ sung ô nhập họ tên giáo viên thẩm định bắt buộc.
  - Chặn thao tác duyệt đơn lẻ hoặc duyệt hàng loạt nếu chưa nhập tên giáo viên thật.
* **Audit Log**:
  - Ghi nhận mọi sự kiện (cách ly ban đầu, nộp tri thức mới, duyệt, từ chối, hiệu đính) vào `src/data/knowledge_audit_log.json`, `public/data/knowledge_audit_log.json` và Firestore `admin_logs`.
* **Siết chặt Firestore Security Rules (`firestore.rules`)**:
  - Đã ủy quyền cho chuyên gia phụ trách `firestore-rules-author` subagent thực hiện:
    - `allow read`: Chỉ Admin hoặc các bản ghi `status == 'verified_by_teacher' && teacherVerified == true && quarantined == false`.
    - `allow create`: Học sinh chỉ được tạo bản ghi ở trạng thái `pending_review` với `teacherVerified == false` và `verifiedBy == null` (chống đầu độc RAG và leo thang đặc quyền).
    - `allow update, delete`: Chỉ duy nhất `isAdmin()`.

---

## 2. DANH MỤC FILE ĐÃ SỬA VÀ TẠO MỚI

| STT | Đường Dẫn File | Trạng Thái | Mục Đích Sửa Đổi |
|:---:|---|:---:|---|
| 1 | `GIOI_THIEU_KIEN_TRUC_AI_STEM_HUB.md` | Sửa đổi | Cập nhật toàn diện đặc tả kiến trúc trung thực, gắn nhãn 3 loại thành phần, sửa lỗi Wilson CI Model 2, mô tả chính xác Model 1 & 4 |
| 2 | `README.md` | Sửa đổi | Đồng bộ bảng chỉ số kiểm toán thật, loại bỏ các tuyên bố tuyệt đối, minh bạch 3 loại thành phần |
| 3 | `firestore.rules` | Sửa đổi | Siết chặt quyền đọc/ghi bộ sưu tập `learned_knowledge`, chặn tự duyệt và chặn đọc tri thức chưa thẩm định |
| 4 | `src/app/api/learned-knowledge/route.js` | Sửa đổi | Mặc định pending trong POST, chặn tự gán verified, yêu cầu họ tên giáo viên thật trong PATCH, thêm helper ghi audit log |
| 5 | `src/app/admin/knowledge-review/page.js` | Sửa đổi | Xóa tên giáo viên mặc định, thêm ô nhập tên giáo viên bắt buộc, làm sạch mẫu sample |
| 6 | `src/lib/ragService.js` | Sửa đổi | Lọc tri thức cách ly khỏi RAG (client, server, Firestore), nạp tri thức mới ở trạng thái pending |
| 7 | `src/data/global-learned-knowledge.json` | Sửa đổi | Cách ly toàn bộ 46 bản ghi cũ (`status: pending_review`, `quarantined: true`, xóa tên giáo viên giả) |
| 8 | `public/data/global-learned-knowledge.json` | Sửa đổi | Đồng bộ cách ly 46 bản ghi cho client static asset |
| 9 | `src/ai-training/datasets/benchmark_150_cases.json` | Sửa đổi | Xóa 150 trường giáo viên giả định, cập nhật nhãn synthetic benchmark |
| 10 | `src/ai-training/scripts/generate_full_150_dataset.js` | Sửa đổi | Xóa đối tượng teachers, định danh synthetic benchmark chưa qua chấm giáo viên |
| 11 | `src/ai-training/scripts/generate_150_benchmark_cases.js` | Sửa đổi | Xóa đối tượng teachers |
| 12 | `src/data/knowledge_audit_log.json` | Tạo mới | Nhật ký kiểm toán tri thức hệ thống |
| 13 | `public/data/knowledge_audit_log.json` | Tạo mới | Bản sao nhật ký kiểm toán phục vụ client audit |
| 14 | `SYNTHETIC_BENCHMARK_150_REPORT.md` | Tạo mới | Báo cáo cơ cấu 150 ca benchmark đối chứng kỹ thuật tổng hợp |
| 15 | `reports/remediation-step1.md` | Tạo mới | Báo cáo kiểm toán và khắc phục chặng 1 |

---

## 3. LỆNH CHẠY & BẰNG CHỨNG KIỂM THỬ THỰC TẾ

### Lệnh 1: `npm test`
```
> hub-temp@0.1.0 test
> node tests/bugfix_validation.test.js && node tests/physicsEngine.test.js && node tests/harmonicPhysicsEngine.test.js

=== BUG FIX VALIDATION TESTS ===
✅ VIỆC 1a: dau-truong/page.js không còn query status='finished'
✅ VIỆC 1b: dau-truong/page.js đã dùng status='result'
✅ VIỆC 1c: admin/matches/page.js nhận diện status='result'
✅ VIỆC 1d: admin/students/page.js nhận diện status='result'
✅ VIỆC 2: debounce 300ms đã được thêm vào physics submitAnswer
✅ VIỆC 2b: timer cũ (0ms) đã bị xóa
✅ VIỆC 3a: isValidTimeRemainingUpdate() được thêm vào allow update
✅ VIỆC 3b: rule chặn timeRemaining tăng đã được định nghĩa
✅ VIỆC 4a: server-side physical validation đã được thêm
✅ VIỆC 4b: server kiểm tra chemTemp nếu client gửi kèm
✅ VIỆC 4c: server kiểm tra chemEvap nếu client gửi kèm
✅ VIỆC 4d: client iframe handler chuyển sang gọi server trong online mode
✅ VIỆC 4e: handleChemistryRealtimeTick gửi kèm dữ liệu thô lên server
✅ VIỆC 5a: systemSettings không còn được đọc ngoài transaction
✅ VIỆC 5b: settingsRef được đọc bằng transaction.get() bên trong transaction
✅ VIỆC 5c: tất cả reads được gộp trong 1 Promise.all() atomic
✅ Physics engine: [45,90,135] vẫn cho isHit=true sau các thay đổi
✅ Physics engine: [0,90,135] vẫn cho isHit=false (sai đáp án bị chặn)
✅ VIỆC 4f: server từ chối khi idclEnergy=100 (không có thao tác thí nghiệm)
✅ VIỆC 4g: server log cảnh báo khi phát hiện iframe console injection
✅ VIỆC 4h: client gửi kèm idclEnergy từ iframe postMessage lên server

=== KẾT QUẢ: 21 passed, 0 failed ===

=== RUNNING PHYSICS ENGINE UNIT TESTS ===
✅ Passed: Case 1: Hit target via 1 mirror reflection
✅ Passed: Case 2: Hit target via 2 mirrors reflection
✅ Passed: Case 3: Hit target via all 3 mirrors reflection (standard course)
✅ Passed: Case 4: Miss target due to misaligned mirror A
Note: Reflection loop stopped after 4 steps.
✅ Passed: Case 5: Handle infinite reflection loops gracefully (capped at 10)
✅ Passed: Case 6: Dynamic offset on custom coordinates
=== ALL PHYSICS ENGINE UNIT TESTS PASSED SUCCESSFULLY! ===

=== RUNNING ADVANCED SIMULATION ENGINES UNIT TESTS ===
✅ Passed: Planet gravity parameters
✅ Passed: Mechanical energy conservation & spring generation
✅ Passed: Mechanical wave and standing wave nodes/antinodes
✅ Passed: Multi-planet projectile kinematics
=== ALL ADVANCED SIMULATION UNIT TESTS PASSED (4/4) ===
```

### Lệnh 2: `npm run audit:ai`
```
> hub-temp@0.1.0 audit:ai
> node src/ai-training/scripts/run-all-audits.js

🚀 === KHỞI CHẠY AUDIT TOÀN BỘ 6 MÔ HÌNH AI TỰ TRAIN & TỰ ĐỘNG XUẤT LOG ===
🔬 === KHỞI CHẠY THỰC NGHIỆM ĐỐI CHỨNG: CÓ RAG vs. KHÔNG CÓ RAG (AI26B0012) ===

📊 Quy mô mẫu thực nghiệm:
   - 50 Câu hỏi khó/bẫy theo chuẩn GDPT 2018 (Toán, Lý, Hóa, Sinh)
   - 30 Câu hỏi ngoài phạm vi SGK (Học thuật Đại học, Giả khoa học, Đời sống)
   - Tổng: 80 trường hợp kiểm thử

--- ĐANG ĐỐI CHỨNG 50 CÂU HỎI KHÓ GDPT 2018 ---
--- ĐANG ĐỐI CHỨNG 30 CÂU HỎI NGOÀI PHẠM VI (OUT-OF-SCOPE) ---

💾 Đã lưu kết quả thực nghiệm chi tiết tại: E:\project\cuoc_thi_AI\src\ai-training\datasets\rag_ablation_results.json

========================================================================================
🏆 BẢNG TỔNG HỢP ĐỐI CHỨNG: KHÔNG RAG (PURE LLM) vs CÓ RAG (STEM HUB RAG + ABSTENTION)
========================================================================================
1. Độ chính xác thực tế (n=50 câu khó):
   - Không RAG: 72% [58.3%, 82.5%]
   - Có RAG:    92% [81.2%, 96.8%] (TĂNG +20%)
2. Tỷ lệ ảo giác (Hallucination Rate, n=50):
   - Không RAG: 28% [17.5%, 41.7%]
   - Có RAG:    4% [1.1%, 13.5%] (GIẢM 7 LẦN)
3. Tỷ lệ trích dẫn nguồn chuẩn SGK (n=50):
   - Không RAG: 10% [4.3%, 21.4%]
   - Có RAG:    94% [83.8%, 97.9%] (TĂNG +84%)
4. Tỷ lệ cảnh báo an toàn đúng trên Out-of-Scope (n=30):
   - Không RAG: 0% [0%, 11.4%]
   - Có RAG:    96.67% [83.3%, 99.4%] (TĂNG +96.7%)
========================================================================================
✅ [Master Audit Logger] Đã cập nhật thành công TRAINING_LOG.md tự động tại: E:\project\cuoc_thi_AI\TRAINING_LOG.md
```

### Lệnh 3: `node src/ai-training/scripts/extended-robust-evaluation.js`
```
🚀 === KHỞI CHẠY ĐÁNH GIÁ ĐỘC LẬP & STRATIFIED 5-FOLD CROSS-VALIDATION (AI26B0012) ===
🧪 1. Chạy Stratified 5-Fold Cross-Validation cho ChemLab Risk Classifier...
   👉 ChemLab 5-Fold Accuracies: [88.89%, 100%, 92.59%, 96.3%, 100%] | Trung bình: 95.56% | Macro F1: 95.58%
🔭 2. Chạy Stratified 5-Fold Cross-Validation cho Physics Diagnostic kNN...
   👉 Physics 5-Fold Accuracies: [96.3%, 96.3%, 100%, 92.59%, 96.3%] | Trung bình: 96.3% | Macro F1: 96.3%
🗣️ 3. Chạy Stratified 5-Fold Cross-Validation cho Javit Intent Classifier...
   👉 Intent 5-Fold Accuracies: [89.29%, 92.86%, 92.86%, 89.29%, 78.57%] | Trung bình: 88.57% | Macro F1: 88.33%
💾 Đã xuất Báo cáo Độc lập & 5-Fold CV: E:\project\cuoc_thi_AI\EXTENDED_ROBUST_EVALUATION_REPORT.md
```

### Lệnh 4: `node scripts/test-rules-suite.js` (Kiểm thử bộ luật Firestore)
```
[Firestore Rules Test Suite] Total test cases: 48
Result: 48/48 passed
```

---

## 4. KẾT QUẢ KIỂM THỬ: ĐẠT (PASS)

* Toàn bộ test case của dự án (`npm test`, `npm run audit:ai`, `test-rules-suite.js`) đều vượt qua (0 ca thất bại) không có lỗi hồi quy (zero regressions).
* Toàn bộ các file tài liệu và mã nguồn đã được đồng bộ chuẩn mực theo đúng quy tắc trung thực học thuật.

---

## 5. CÁC PHẦN CHƯA THỰC HIỆN & RỦI RO CÒN LẠI

### Phần chưa làm:
1. **Chấm thực tế của giáo viên**: 46 bản ghi tri thức cũ và 150 ca benchmark hiện mang trạng thái cách ly / chưa qua chấm. Nhóm cần tổ chức phiên làm việc trực tiếp với giáo viên bộ môn để đăng nhập vào Teacher Review HUD và thực hiện chấm/thẩm định thật.
2. **Metadata SGK chi tiết cho 303 chunks RAG**: Hiện tại các chunk mới có phân loại theo `subject` (Toán, Lý, Hóa, Sinh) và `topic`. Cần bổ sung metadata cụ thể về bộ sách (Cánh Diều, Kết Nối Tri Thức, Chân Trời Sáng Tạo), chương, bài học, và số trang theo đúng sách giáo khoa chính khóa.
3. **Cải tiến thuật toán học máy (Yêu cầu #3 của BGK)**: Hiện giữ nguyên kiến trúc theo yêu cầu; việc huấn luyện lại hoặc nâng cấp mô hình học thực thụ (cho Model 1 và Model 4) sẽ được quyết định sau khi có kết quả đối chứng kỹ thuật.

### Rủi ro còn lại & Biện pháp kiểm soát:
1. **Rủi ro rò rỉ dữ liệu (Data Leakage) ở Model 3**: Vẫn tồn tại 2 câu trùng khớp và 6 câu gần trùng trong bộ dữ liệu intent mẫu do cùng một người biên soạn theo khung cú pháp. Cần mở rộng tập dữ liệu từ câu hỏi thực tế của học sinh trong giai đoạn thử nghiệm tiếp theo.
2. **Độ tin cậy của ca biên Model 2**: Do số lượng ca biên quang học chỉ có $n=15$, khoảng tin cậy Wilson khá rộng ($[62.1\%, 96.3\%]$). Cần thu thập thêm ít nhất 50 ca biên trong thực tế để thu hẹp khoảng tin cậy.

