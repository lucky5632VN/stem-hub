# BÁO CÁO THỰC NGHIỆM ĐO ĐẠC VÀ ABLATION STUDY HỆ THỐNG AI STEM HUB
> **Nhánh thực hiện**: `feat/ablation-real`  
> **Nguyên tắc**: Tuân thủ tuyệt đối Quy tắc Trung thực Prompt 0 (Zero False Claims, Không số giả lập, Mọi chỉ số có $k/n$, khoảng tin cậy Wilson CI, kiểm định cặp McNemar và file đối chứng).  
> **Thời điểm cập nhật**: 21/11/2026.

---

## 1. TỔNG QUAN VÀ THAM SỐ THỰC NGHIỆM

Thực nghiệm Ablation Study được thiết kế nhằm bóc tách, đo lường độc lập và đánh giá thực chất đóng góp của từng thành phần kiến trúc trong hệ thống AI của STEM HUB:
1. **RAG Bật vs RAG Tắt vs Chỉ Truy Xuất**: Tác động của việc cung cấp ngữ liệu SGK chuẩn GDPT 2018 và Pedagogical Guardrail đến độ chính xác và khả năng từ chối trả lời ngoài phạm vi (Abstention).
2. **Luật rẽ nhánh vs Mô hình máy học vs Baseline**: Đối chiếu trực tiếp giữa Luật phân ngưỡng cứng (Heuristic Rules), Bộ phân loại máy học (Softmax NN, k-NN, Naive Bayes), Baseline lớp đa số (Majority-class) và Baseline Luật tử tế (có từ điển teencode).
3. **Bóc tách từng thành phần riêng lẻ (Ablation thực sự)**: Đo mức suy giảm hiệu năng khi loại bỏ:
   - Circuit Breaker chống bão Retry (trong điều kiện mạng mô phỏng).
   - Ngưỡng từ chối Cosine 0.30 (Abstention Guard).
   - Bộ chuẩn hóa tiếng Việt / teencode (Text Normalizer).
   - Chuẩn hóa Z-Score / tỉ lệ đặc trưng (Feature Scaler).

### Tham số cấu hình hệ thống:
- **Mô hình Production**: `gemini-flash-lite-latest` (được đọc trực tiếp từ cấu hình luân chuyển trong [`src/lib/geminiCaller.js`](file:///e:/project/cuoc_thi_AI/src/lib/geminiCaller.js)).
- **Nhiệt độ (Temperature)**: `0` (đảm bảo tính tất định cao nhất cho kiểm định khoa học).
- **Số lần chạy lặp lại ($k$)**: `k = 3` lần chạy độc lập cho mỗi câu hỏi trên từng điều kiện.
- **Trần ngân sách chi tiêu token**: `5.000.000` tokens (có cơ chế cảnh báo vàng ở mức 80% tức 4.000.000 tokens và dừng ngắt khẩn cấp nếu chạm 5.000.000 tokens).
- **Khóa API**: Sử dụng biến môi trường `GEMINI_API_KEY` mới trong `.env.local`, tuyệt đối không ghi log hay in khóa ra console/file.
- **Giám sát phiên bản mô hình (Model Version)**: Script runner ghi nhận `modelVersion` từ phản hồi API trên từng lượt gọi. Nếu phát hiện nhà cung cấp thay đổi `modelVersion` giữa chừng, hệ thống sẽ ngắt ngay lập tức để bảo vệ tính nhất quán khoa học.

---

## 2. BỘ DỮ LIỆU PHÂN TẦNG VÀ KHÓA BẢO VỆ SHA-256

Để loại bỏ hoàn toàn việc "chọn mẫu thiên lệch", bộ câu hỏi thực nghiệm gồm đúng **100 câu hỏi** được phân tầng rõ ràng:
- **Tập tin lưu trữ**: [reports/ablation/ablation_dataset_100.json](file:///e:/project/cuoc_thi_AI/reports/ablation/ablation_dataset_100.json)
- **Mã băm SHA-256**: `4cf0e5e3ae5f9381a47debbea763ae38f414933d62d24a385a2eea83885eae77` (ghi nhận tại [reports/ablation/dataset_hash.json](file:///e:/project/cuoc_thi_AI/reports/ablation/dataset_hash.json)).
- **Bảng đối chiếu từng câu hỏi (Answer Key Review)**: Đã tạo tại [docs/ablation-answer-key-review.md](file:///e:/project/cuoc_thi_AI/docs/ablation-answer-key-review.md) kèm nguồn SGK và cột người kiểm duyệt.

### Phân bổ phân tầng (Stratified Distribution):
1. **Phân tầng 1: Khái niệm & Bẫy lý thuyết trong phạm vi (In-Scope Concept) - 40 câu**:
   - Gồm các câu hỏi lý thuyết sâu, định lý, cơ chế phản ứng, bẫy quan niệm sai lầm phổ biến của học sinh và LLM trong SGK GDPT 2018 Toán, Lý, Hóa, Sinh (do AI hỗ trợ gợi ý và nhóm đối soát với SGK).
2. **Phân tầng 2: Số liệu, Công thức & Tính toán chính xác (In-Scope Numerical) - 30 câu**:
   - Gồm các bài toán yêu cầu kết quả số liệu chính xác (pH, tọa độ cực trị, chu kỳ dao động, tỉ lệ di truyền Mendel) trích từ bộ 150 ca chuẩn và bẫy tính toán.
3. **Phân tầng 3: Ngoài phạm vi & Câu hỏi đối kháng (Out-of-Scope / Adversarial) - 30 câu**:
   - Gồm toán học/vật lý đại học chuyên sâu, câu hỏi ngoài chương trình phổ thông hoặc phi khoa học để kiểm định bộ lọc từ chối (Abstention Guard).

> [!WARNING]
> **Minh bạch bắt buộc về bản chất dữ liệu**:
> Do nhóm chưa có tập kiểm thử độc lập hoàn toàn do giáo viên bên ngoài viết độc lập, tập 100 câu này là **"Tập dev phân tầng"**. Kết quả đo đạc trên tập này có thể **lạc quan hơn so với triển khai thực tế trên diện rộng**, đóng vai trò đo lường độ nhạy kỹ thuật của hệ thống.

> [!IMPORTANT]
> **Ghi chú Phương pháp luận & Thống kê Nguồn (Source Methodology & Benchmark Scope)**:
> 1. **Nguy cơ rò rỉ vào dữ liệu huấn luyện (Pre-training Data Leakage)**: Các câu hỏi trích xuất từ đề thi công khai hoặc sách giáo khoa có khả năng cao đã nằm trong tập dữ liệu tiền huấn luyện của các mô hình nền tảng (Foundation Models như Gemini, GPT). Vì vậy, điểm số đo được của LLM độc lập có thể mang tính lạc quan hơn so với năng lực giải quyết các bài toán hoàn toàn mới.
> 2. **Phạm vi kiểm định RAG**: Toàn bộ các câu hỏi thuộc nhóm trong phạm vi (`in_scope_concept` và `in_scope_numerical`) được chọn lọc nằm đúng trong 101 chuyên đề mà kho tri thức 303 chunk bao phủ. Do đó, kết quả thực nghiệm RAG phản ánh năng lực truy xuất ngữ liệu và kiểm chứng căn cứ trong phạm vi kho tri thức mục tiêu này, không khái quát hóa ra ngoài phạm vi dữ liệu được nạp.

---

## 3. BẢNG ƯỚC TÍNH SỐ LỆNH GỌI & CHI PHÍ TOKEN (PRE-RUN ESTIMATION)

| Điều kiện / Thành phần | Số câu hỏi | Số lần lặp ($k$) | Tổng số lệnh gọi API | Ước tính Tokens/Call | Tổng Token ước tính |
|---|:---:|:---:|:---:|:---:|:---:|
| **Điều kiện 1: LLM Không RAG** | 100 | 3 | 300 | ~280 tokens | ~84.000 tokens |
| **Điều kiện 2: LLM Có RAG + Guard** | 100 | 3 | 300 | ~810 tokens | ~243.000 tokens |
| **Điều kiện 3: Chỉ truy xuất RAG** | 100 | 3 | 0 (tính toán nội bộ) | 0 | 0 tokens |
| **Part B: Baseline LLM thô cho Model 1, 2, 3** | 30 | 1 | 30 | ~250 tokens | ~7.500 tokens |
| **TỔNG SỐ LỆNH GỌI** | - | - | **630 calls** | - | **~334.500 tokens** |
| **TỔNG DỰ PHÒNG (+20% biên dao động)** | - | - | - | - | **~401.400 tokens** |

### Tỉ lệ chiếm dụng trên trần ngân sách 5.000.000 tokens:
- **Tỉ lệ cơ sở (Base Token Estimation)**: $\frac{334.500}{5.000.000} = \mathbf{6,69\%}$
- **Tỉ lệ có dự phòng (+20% buffer)**: $\frac{401.400}{5.000.000} = \mathbf{8,03\%}$
- **Quy tắc an toàn**: Không đưa ước tính chi phí tiền mặt chưa kiểm chứng vào báo cáo. Hệ thống giám sát bộ đếm token theo từng câu gọi qua `reports/ablation/call_cache.json`.

---

## 4. KẾT QUẢ ĐỐI CHỨNG: LUẬT, MÁY HỌC VÀ BASELINE (PHẦN B & C ĐO THẬT)

Chạy thực nghiệm bằng lệnh:
```powershell
node scripts/run_ml_vs_rules_benchmark.mjs
```
Kết quả ghi nhận tại [reports/ablation/ml_vs_rules_and_ablation_results.json](file:///e:/project/cuoc_thi_AI/reports/ablation/ml_vs_rules_and_ablation_results.json) và bản chứng cớ sạch tại [reports/ablation/evidence/ml_vs_rules_evidence.json](file:///e:/project/cuoc_thi_AI/reports/ablation/evidence/ml_vs_rules_evidence.json):

### 4.1. Bảng số liệu chi tiết ($k/n$, Wilson 95% CI và McNemar Test)

#### Model 1: ChemLab Risk Classifier ($n = 50$)
*Nguồn dữ liệu: 30 ca unseen mô phỏng + 20 ca biên viết tay.*
- **Nhóm A: Mẫu mới sinh từ script mô phỏng ($n = 30$)** *(Dữ liệu sinh từ hàm đa biến trọng số trong `generate-expanded-datasets.js`; hệ luật benchmark dạng ngưỡng đơn biến đạt 28/30, lệch 2 ca vùng ranh giới)*:
  - **Luật**: **28/30 (93,33%)** | 95% CI: [78,7%, 98,2%]
  - **Softmax NN**: **28/30 (93,33%)** | 95% CI: [78,7%, 98,2%]
  - **Lớp đa số**: **28/30 (93,33%)** | 95% CI: [78,7%, 98,2%]
  - *Giải trình 2 ca lệch*:
    1. Sample #20 (`temp: 64, energy: 35, violations: 0`): Nhãn ground truth là `1` (Warning) do tổng điểm có trọng số $0.4025 < 0.55$, nhưng luật benchmark rẽ nhánh `energy <= 35` đoán `2` (Danger).
    2. Sample #28 (`temp: 76, energy: 36, violations: 1, hasHazard: 1`): Nhãn ground truth là `2` (Danger) do điểm trọng số $0.585 \ge 0.55$, nhưng luật benchmark có ngưỡng `temp >= 80` và `violations >= 2` nên đoán `1` (Warning).
    -> Đây là sự khác biệt giữa hai định nghĩa luật (hàm trọng số liên tục vs ngưỡng rời rạc), không phải nhiễu ngẫu nhiên.
- **Nhóm B: Ca biên viết tay ($n = 20$)**:
  - **Luật**: **19/20 (95,00%)** | 95% CI: [76,4%, 99,1%]
  - **Softmax NN**: **12/20 (60,00%)** | 95% CI: [38,7%, 78,1%]
  - **Lớp đa số**: **7/20 (35,00%)** | 95% CI: [18,1%, 56,7%] *(theo lớp đa số duy nhất của tập huấn luyện là Class 2: Nguy hiểm)*
- **Tổng hợp cả bộ test ($n = 50$)**:
  - **Luật phân ngưỡng**: **47/50 (94,00%)** | 95% CI: [83,8%, 97,9%]
  - **Softmax NN**: **40/50 (80,00%)** | 95% CI: [67,0%, 88,8%]
  - **Lớp đa số**: **35/50 (70,00%)** | 95% CI: [56,2%, 80,9%] *(Nhóm A: 28 + Nhóm B: 7 = 35)*
  - **NN khi bỏ chuẩn hóa Z-Score**: **35/50 (70,00%)** *(với siêu tham số hiện tại không hội tụ khi bỏ chuẩn hóa)*
  - **Kiểm định McNemar**: Cặp lệch $b=9, c=2$, $\chi^2 = 3.2727 (df=1)$, $p_{\chi^2} = 0.0704$, $p_{\text{exact}} = 0.0654$.
  - *Kết luận*: **Chưa đủ bằng chứng để khẳng định sự khác biệt có ý nghĩa thống kê giữa Hệ luật và Softmax NN ở mức $\alpha=0.05$**. Softmax NN đóng vai trò tạo thanh đo rủi ro mượt mà trên UI, còn luật cứng giữ chốt an toàn qua Circuit Breaker (mạng mô phỏng).

#### Model 2: Physics Optics Diagnostic ($n = 45$)
*Nguồn dữ liệu: 30 ca unseen mô phỏng quang học có nhiễu Gaussian + 15 ca biên viết tay.*
- **Nhóm A: Mẫu mới sinh từ script mô phỏng ($n = 30$)** *(Dữ liệu mô phỏng độc lập theo định luật Snell)*:
  - **Luật**: **30/30 (100,00%)** | 95% CI: [88,6%, 100,0%]
  - **k-NN ($k=5$)**: **30/30 (100,00%)** | 95% CI: [88,6%, 100,0%]
  - **Lớp đa số**: **10/30 (33,33%)** | 95% CI: [19,2%, 51,2%] *(theo Class 0 của tập huấn luyện cân bằng 40-40-40)*
- **Nhóm B: Ca biên viết tay ($n = 15$)**:
  - **Luật**: **5/15 (33,33%)** | 95% CI: [15,2%, 58,3%]
  - **k-NN ($k=5$)**: **5/15 (33,33%)** | 95% CI: [15,2%, 58,3%]
  - **Lớp đa số**: **5/15 (33,33%)** | 95% CI: [15,2%, 58,3%]
  - *Phân tích 10 ca sai trên 15 ca biên*:
    - Cả 15 ca biên kiểm thử đồng thời 3 chiều lỗi (góc tới, vị trí thấu kính, chiết suất).
    - **Luật đoán đúng 5/15** (toàn bộ 5 ca có Target = 0: lỗi góc tới, vì điều kiện `angle > 15` được ưu tiên kiểm tra đầu tiên), nhưng sai 100% (10/10) trên 5 ca Target = 1 và 5 ca Target = 2.
    - **k-NN đoán đúng 5/15** (toàn bộ 5 ca có Target = 2: lỗi chiết suất), nhưng sai 100% (10/10) trên 5 ca Target = 0 và 5 ca Target = 1 do khoảng cách Euclidean bị kéo lệch bởi không gian 3 chiều đồng mức.
    - **Kết quả**: Cả Luật, k-NN và Majority đều đạt đúng 5/15 (33,33%) — **không phương pháp nào vượt được baseline đoán mò lớp đa số** trên tập ca biên này.
- **Tổng hợp cả bộ test ($n = 45$)**:
  - **Luật phân ngưỡng**: **35/45 (77,78%)** | 95% CI: [63,7%, 87,5%]
  - **k-NN ($k=5$)**: **35/45 (77,78%)** | 95% CI: [63,7%, 87,5%]
  - **Lớp đa số**: **15/45 (33,33%)** | 95% CI: [21,4%, 47,9%] *(Nhóm A: 10 + Nhóm B: 5 = 15)*
  - **Kiểm định McNemar**: Cặp lệch $b=5, c=5$, $\chi^2 = 0 (df=1)$, $p_{\chi^2} = 1.0000$, $p_{\text{exact}} = 1.0000$.
  - *Kết luận*: **Không có sự khác biệt có ý nghĩa thống kê giữa Luật và k-NN trên bộ test này ($p=1.0000$)**. Trên ca biên đa chiều, cả hai phương pháp đều suy giảm về ngang baseline đoán mò.

#### Model 3: Javit Intent Classification ($n = 65$)
*Nguồn dữ liệu: 40 ca test chuẩn + 25 ca teencode/nhiễu.*
- **Độ lệch thực nghiệm (Biases)**:
  1. *Độ lệch 1*: Luật đã tinh chỉnh sau khi xem bộ test (không phải luật ban đầu mù với bộ test).
  2. *Độ lệch 2*: Bộ test 65 câu có chia sẻ cấu trúc/template câu với tập dữ liệu huấn luyện Naive Bayes (chưa hoàn toàn độc lập).
- **Kết quả so sánh ($n = 65$)**:
  - **Regex cũ**: **14/65 (21,54%)** *(Bằng đoán mò lớp đa số: 14/65)*
  - **Luật tử tế**: **45/65 (69,23%)** *(luật đã tinh chỉnh sau khi xem bộ test)* | 95% CI: [57,2%, 79,1%]
  - **Naive Bayes + Normalizer**: **59/65 (90,77%)** | 95% CI: [81,3%, 95,7%]
  - **Naive Bayes không chuẩn hóa (Raw)**: **59/65 (90,77%)**
  - **Lớp đa số**: **14/65 (21,54%)** | 95% CI: [13,2%, 33,1%]
  - **Kiểm định McNemar**: Cặp lệch $b=4, c=18$, $\chi^2 = 7.6818 (df=1)$, $p_{\chi^2} = 0.0056$, $p_{\text{exact}} = 0.0043 < 0.01$.
  - *Kết luận*: **Trên bộ test này, chênh lệch có ý nghĩa thống kê ($p=0,0043$), nhưng bộ test chưa độc lập với dữ liệu huấn luyện**.

> [!IMPORTANT]
> **Kết luận trung thực tổng kết**:
> 1. **Model 1: Chưa đủ bằng chứng để khẳng định sự khác biệt có ý nghĩa thống kê ở $\alpha=0.05$** ($b=9, c=2, p=0,0654$). Nhóm A luật đúng theo định nghĩa; Nhóm B ca biên luật nắm bắt tốt hơn mô hình nơ-ron tuyến tính đơn giản.
> 2. **Model 2: Luật và k-NN có cùng tỉ lệ chính xác 77,78%** ($b=5, c=5, p = 1.0000$).
> 3. **Model 3: Trên bộ test này, chênh lệch có ý nghĩa thống kê ($p=0,0043$), nhưng bộ test chưa độc lập với dữ liệu huấn luyện**. Nhóm đã xây dựng tài liệu `docs/viet-tap-test-intent.md` để người dùng/giáo viên bổ sung 30 câu test hoàn toàn mới khóa hash nhằm thẩm định độc lập.

---

## 5. BÓC TÁCH THÀNH PHẦN RIÊNG LẺ (PART C ABLATION)

1. **Bỏ Circuit Breaker (trong điều kiện mạng mô phỏng)**:
   - Khi mô phỏng môi trường mạng có 60% tỉ lệ nghẽn/lỗi HTTP 429/503:
   - Hệ thống không có Circuit Breaker lặp lại liên tục, khuếch đại số yêu cầu lên **2,22 lần** (222 lần thử mạng cho 100 yêu cầu), dễ gây bão retry và sập hệ thống.
   - Khi có Circuit Breaker, số lần gửi mạng giảm xuống chỉ còn **0,55 lần** (55 lần thử thật, còn lại chuyển ngay sang chế độ phòng vệ ngoại tuyến).
2. **Bỏ Chuẩn hóa Z-Score / Tỉ lệ**:
   - Ở Model 1, khi đưa thẳng dữ liệu thô vào mô hình, mạng nơ-ron không hội tụ và độ chính xác tụt dốc từ **80,00% (40/50) xuống 70,00% (35/50)**, bằng đúng mức đoán mò lớp đa số. Gắn nhãn chuẩn xác: *"với siêu tham số hiện tại không hội tụ khi bỏ chuẩn hóa"*.
3. **Bỏ Bộ chuẩn hóa Teencode / Tiếng Việt**:
   - Gây sụt giảm độ chính xác của bộ phân loại ý định từ **90,77% (59/65) xuống 89,23% (58/65)**.

---

## 6. DANH MỤC CÁC CA ĐỐI CHỨNG MINH HỌA TRỰC QUAN (PART D)

In toàn bộ các ca bất đồng quan điểm giữa các mô hình và chọn ra các ca đại diện tiêu biểu (bao gồm ca bất lợi cho hệ thống):

| Mã ID | Dữ liệu đầu vào | Dự đoán Luật | Dự đoán Máy học | Ground Truth | Kết quả & Đánh giá |
|---|---|:---:|:---:|:---:|---|
| `chem_edge_04` | $T=79^\circ\text{C}, E=36\%, \text{vi phạm}=0$ | Warning (1) | Danger (2) | **Warning (1)** | **Luật đúng, NN sai (Bất lợi cho ML)**: Do nhiệt độ tiệm cận $80^\circ\text{C}$, mạng nơ-ron cộng dồn trọng số đẩy xác suất Danger vượt ngưỡng sớm. |
| `chem_30` | $T=44^\circ\text{C}, E=72\%, \text{vi phạm}=1$ | Danger (2) | Warning (1) | **Warning (1)** | **NN đúng, Luật sai**: Mạng nơ-ron cân bằng đa yếu tố tốt hơn khi vi phạm nhẹ nhưng các chỉ số khác an toàn. |
| `phys_30` | Lệch góc $5^\circ$, Lệch vị trí $8\text{px}$, Lệch chiết suất $0.05$ | Sai góc tới (0) | Sai chiết suất (2) | **Sai góc tới (0)** | **Luật đúng, k-NN sai**: Vùng sai số nhỏ bị chi phối bởi các mẫu láng giềng nhiễu trong k-NN. |
| `phys_32` | Lệch góc $12^\circ$, Lệch vị trí $15\text{px}$, Lệch chiết suất $0.22$ | Sai góc tới (0) | Sai chiết suất (2) | **Sai chiết suất (2)** | **k-NN đúng, Luật sai**: k-NN nắm bắt chính xác độ lệch chiết suất vượt trội hơn góc tới. |
| `intent_40` | *"cho tui dô coi cái sảnh đấu trường coi"* | chitchat (sai) | nav_dautruong (đúng) | **nav_dautruong** | **ML đúng, Regex cũ sai**: Teencode "dô coi" bị regex bỏ qua. |
| `intent_46` | *"dạ hế lô sư huynh em tới chơi nè"* | chitchat (đúng) | nav_dautruong (sai) | **chitchat** | **Luật đúng, ML sai (Bất lợi cho ML)**: Từ "chơi" kích hoạt nhầm ý định đấu trường trong Naive Bayes. |

---

## 7. BỘ CHỨNG CỨ SẠCH ĐƯA VÀO HỒ SƠ NỘP (EVIDENCE DOSSIER)

Toàn bộ dữ liệu minh chứng sau khi chạy đã được xuất bản sao sạch (loại bỏ hoàn toàn khóa API và PII cá nhân) vào thư mục:
- [`reports/ablation/evidence/ml_vs_rules_evidence.json`](file:///e:/project/cuoc_thi_AI/reports/ablation/evidence/ml_vs_rules_evidence.json)
- [`reports/ablation/evidence/dataset_hash.json`](file:///e:/project/cuoc_thi_AI/reports/ablation/evidence/dataset_hash.json)
- [`reports/ablation/evidence/ablation_summary.json`](file:///e:/project/cuoc_thi_AI/reports/ablation/evidence/ablation_summary.json) *(Sẽ tự động xuất sau khi bạn duyệt chạy live).*
