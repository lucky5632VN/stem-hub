# 🌌 STEM HUB — BẢN ĐẶC TẢ KIẾN TRÚC KỸ THUẬT & CỐT LÕI THUẬT TOÁN AI
*(Bản cập nhật kiểm toán minh bạch học thuật — Vòng Quốc gia Cuộc thi Sáng tạo trẻ 2026)*

> **Dự án**: **STEM HUB — Nền Tảng Đấu Trường Học Thuật 1v1 & Phòng Thí Nghiệm Ảo STEM Đa Giác Quan**  
> **Lĩnh vực**: Trí tuệ Nhân tạo (AI Innovation Track)  
> **Đơn vị phát triển**: STEM HUB Team — THPT Quỳnh Lưu 4  
> **Cam kết trung thực học thuật**: Báo cáo phân định minh bạch 3 loại thành phần cấu tạo nên hệ thống: (a) Mô hình học máy từ dữ liệu, (b) Thuật toán và công thức toán học tất định, (c) Gọi mô hình ngôn ngữ lớn ngoại vi (Google Gemini API). Mọi chỉ số kiểm thử đều xuất phát từ lệnh chạy kiểm toán thực tế và có thể tái lập độc lập.

---

## 🏛️ TỔNG QUAN SƠ ĐỒ KIẾN TRÚC AI ĐA TẦNG

```
                     KIẾN TRÚC AI ĐA TẦNG (MULTI-TIERED AI ECOSYSTEM)
 
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                      TẦNG 1: BỘ 6 MÔ HÌNH CỤC BỘ (CLIENT-SIDE EDGE ENGINES)           │
 │        Chạy trực tiếp trên trình duyệt học sinh • Không phụ thuộc API bên ngoài       │
 │                                                                                        │
 │  [HỌC TỪ DỮ LIỆU]                                                                     │
 │  • Model 2: Physics Diagnostic k-NN (Z-Score Scaler, k=5, 3 đặc trưng quang học)       │
 │  • Model 3: Javit Intent Classifier (Multinomial Naive Bayes, Laplace α=1.0, 7 nhãn)   │
 │                                                                                        │
 │  [THUẬT TOÁN & CÔNG THỨC TẤT ĐỊNH]                                                    │
 │  • Model 1: ChemLab Risk Classifier (Luật an toàn tất định + Softmax Risk Scoring)    │
 │  • Model 4: Math Adaptive Engine (Công thức giải tích 1PL Rasch IRT ánh xạ từ Elo)    │
 │  • Model 5: Genetics Inference Reasoner (Tích tổ hợp bảng Punnett phân ly độc lập)    │
 │  • Model 6: Multilingual TF-IDF Retriever (Mô hình không gian vector & Thống kê corpus)│
 └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
 ┌───────────────────────────────────────────▼────────────────────────────────────────────┐
 │                  TẦNG 2: ĐỘNG CƠ TẤT ĐỊNH & KIỂM TRA CHÉO (SANITY CHECK)              │
 │  • Geometry Fact Solver (12+ quan hệ hình học THPT: tính h, a, r, α giải tích số học)  │
 │  • Deterministic Circuit Breaker (Bộ ngắt mạch an toàn phản ứng hóa chất nhiệt runaway)│
 │  • Strict Grounding Abstention (Cơ chế từ chối khi độ tương đồng Cosine S < 0.30)      │
 └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
 ┌───────────────────────────────────────────▼────────────────────────────────────────────┐
 │                TẦNG 3: AI SƯ PHẠM SOCRATIC & ĐIỀU PHỐI (CLOUD LLM GATEWAY)             │
 │  • Next.js BFF Route / Server Actions Zero-Trust Proxy (Cách ly API Key khỏi Client)   │
 │  • Resilient Gemini Multi-Model Pool (Cơ chế chuyển đổi dự phòng & Exponential Backoff)│
 │  • Phương pháp Socratic: Không giải bài hộ, phân rã gợi mở tư duy nhận thức           │
 └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
 ┌───────────────────────────────────────────▼────────────────────────────────────────────┐
 │                  TẦNG 4: THỊ GIÁC, SINH MESH 3D & KIỂM SOÁT TRI THỨC SƯ PHẠM          │
 │  • Vision Math OCR: Nhận diện đề bài toán hình học từ ảnh chụp qua Gemini Vision API   │
 │  • Generative 3D Mesh: Sinh tọa độ vector và dựng khối đa diện Three.js/WebGL động     │
 │  • Human-in-the-Loop RAG Loop: Tri thức mới mặc định pending, bắt buộc giáo viên duyệt│
 │  • Dynamic Elo Matchmaking: Ghép cặp đấu 1v1 PvP thời gian thực mở rộng theo hàm thời gian│
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## PHẦN I: BẢN ĐẶC TẢ CHI TIẾT BỘ 6 MÔ HÌNH CỤC BỘ (EDGE ENGINES)

Mọi mã nguồn và tập dữ liệu của 6 mô hình đặt tại thư mục `src/ai-training/`. Toàn bộ chỉ số có thể được tái lập độc lập bằng lệnh:
```bash
npm run audit:ai   # hoặc: node src/ai-training/scripts/run-all-audits.js
node src/ai-training/scripts/extended-robust-evaluation.js
```

---

### 1. Model 1 — ChemLab Risk Classifier (Bộ phân loại nguy cơ phản ứng hóa học)
* **Phân loại thành phần**: **Thuật toán / Luật tất định** kết hợp **Mạng nơ-ron Softmax Linear** tính điểm rủi ro liên tục.
* **Vị trí mã nguồn**: `src/ai-training/scripts/chem-risk_train.js` (hàm `trainSoftmaxClassifier`, `predictChemRiskNN`).
* **Kiến trúc mạng nơ-ron chi tiết**:
  - **Số tầng (Layers)**: 1 tầng tuyến tính (Single Dense/Linear Layer) gồm 4 nút đầu vào và 3 logits đầu ra:
    $$z_c = b_c + \sum_{f=0}^3 W_{c,f} x_f \quad (c \in \{0, 1, 2\})$$
  - **Hàm kích hoạt (Activation)**: Softmax 3 lớp xác suất:
    $$P(c) = \frac{e^{z_c - \max(\mathbf{z})}}{\sum_{j=0}^2 e^{z_j - \max(\mathbf{z})}}$$
    (sử dụng trừ $\max(\mathbf{z})$ để chống tràn số học - numerical stability).
  - **4 Đặc trưng đầu vào (Normalized Features)**:
    1. $x_0 = \frac{T}{120.0}$ (Nhiệt độ phản ứng chuẩn hóa về $[0, 1]$).
    2. $x_1 = \frac{100 - \text{energy}}{100.0}$ (Tỷ lệ suy hao năng lượng chuẩn hóa).
    3. $x_2 = \frac{\text{violations}}{5.0}$ (Số lần vi phạm an toàn chuẩn hóa).
    4. $x_3 = \text{hasHazard} \in \{0.0, 1.0\}$ (Có chứa hóa chất nguy hại hay không).
  - **Hàm mất mát (Loss Function)**: Đa lớp Cross-Entropy Loss:
    $$\mathcal{L} = -\frac{1}{N} \sum_{i=1}^N \log(\max(10^{-15}, P(y_i)))$$
  - **Thuật toán tối ưu (Optimizer)**: Batch Gradient Descent với learning rate $\eta = 0.2$, huấn luyện 1000 epochs, khởi tạo tham số ngẫu nhiên tất định có hạt giống ($seed=42$, $W, b \in [-0.1, 0.1]$) để đảm bảo 100% tái lập.
  - **Trích xuất điểm rủi ro**: Xác suất lớp Nguy hiểm $P(c=2)$ được trích xuất thành chỉ số nguy cơ liên tục `riskScore \in [0.0, 1.0]`.
* **Cơ chế quyết định phân loại (Circuit Breaker Override)**:
  - Nhãn phân loại cuối cùng (`finalClass`) được quyết định bởi bộ luật tất định (Circuit Breaker ngắt khẩn cấp an toàn) để loại trừ triệt để nguy cơ bỏ sót tai nạn:
    - **Nguy hiểm (Class 2)**: nếu `temp >= 80` HOẶC `violations >= 2` HOẶC `energy <= 35`.
    - **Cảnh báo (Class 1)**: nếu `temp >= 45` HOẶC `violations >= 1` HOẶC `energy <= 70` HOẶC `hasHazard === 1`.
    - **An toàn (Class 0)**: các trường hợp còn lại.
* **Nguồn dữ liệu huấn luyện & Bản chất nhãn**:
  - Tập dữ liệu `risk-dataset.json` (180 mẫu) được sinh tự động bằng script (`generate-expanded-datasets.js`). Nhãn lớp do chính bộ luật IF/ELSE nói trên gán tự động.
  - *Ý nghĩa khoa học*: Quá trình huấn luyện mạng nơ-ron thực chất là tối ưu hóa xấp xỉ lại bộ luật chuyên gia (Rule Approximation), không phải học từ số liệu đo đạc cảm biến phòng thí nghiệm thực tế.
* **Kết quả đo thực tế & Đối chiếu chỉ số**:
  - Huấn luyện trên 144 mẫu, kiểm tra trên 36 mẫu test split: đạt $36/36 = \mathbf{100.00\%}$ (Wilson 95% CI: $[90.4\%, 100.0\%]$).
  - Kiểm thử trên tập 20 ca biên (`edge-cases-chem.json`): $19/20$ ca đúng (**95.00%**, Wilson 95% CI: $[76.4\%, 99.1\%]$).
  - Tỷ lệ bỏ sót nguy hiểm (False Negative Rate): $0/20 = \mathbf{0.00\%}$ (Wilson 95% CI: $[0.0\%, 16.1\%]$).
  - **Đánh giá kiểm định chéo phân tầng (Stratified 5-Fold Cross-Validation, $n=135$)**: Đạt trung bình **95.56%** (Macro F1: **95.58%**, Wilson 95% CI: $[90.6\%, 97.9\%]$).
  - *Giải trình nguồn gốc con số*: Bản thảo tài liệu cũ từng xuất hiện số liệu "94.4% trên 135 mẫu" do trích dẫn từ kết quả đánh giá thử nghiệm một fold đơn lẻ hoặc nhầm lẫn với chỉ số precision lớp `nav_hoso` ($17/18 = 94.44\%$) của Javit Intent. Số liệu chính thức được chuẩn hóa đồng bộ là **95.56%** đo đạc từ lệnh `node src/ai-training/scripts/extended-robust-evaluation.js`.

---

### 2. Model 2 — Physics Diagnostic k-NN (Chẩn đoán lỗi sai Vật lý)
* **Phân loại thành phần**: **Mô hình học từ dữ liệu** (Data-Learned Model — $k$-NN Instance-Based Learning).
* **Vị trí mã nguồn**: `src/ai-training/scripts/physics-error_train.js`, `src/lib/physicsEngine.js`.
* **Thuật toán**: Multi-Label $k$-Nearest Neighbors ($k=5$), khoảng cách Euclidean trên vector chuẩn hóa Z-Score:
  $$z_j = \frac{x_j - \mu_j}{\sigma_j}, \quad D(\mathbf{u}, \mathbf{v}) = \sqrt{\sum_{j=1}^{3} (u_j - v_j)^2}$$
* **Đặc trưng đầu vào thực tế (3 đặc trưng quang học)**:
  $$\mathbf{x} = [\Delta \theta \text{ (sai lệch góc tới/khúc xạ)}, \Delta x \text{ (sai lệch tiêu cự/khoảng cách)}, \Delta n \text{ (sai lệch chiết suất)}]$$
  *(Lưu ý minh bạch: trong code hiện tại chỉ sử dụng 3 đặc trưng quang học, không có đặc trưng điện trở $\Delta R$)*.
* **Dữ liệu**: 180 mẫu tổng hợp sinh từ template/script (`generate-expanded-datasets.js`).
* **Kết quả đo thực tế & Sửa lỗi khoảng tin cậy**:
  - **Stratified 5-Fold Cross Validation ($n=135$)**: Combo Multi-label Accuracy đạt $130/135 = \mathbf{96.30\%}$ (Wilson 95% CI: $[91.6\%, 98.4\%]$).
  - **Kiểm thử trên 15 ca biên (`edge-cases-physics.json`)**: Combo Multi-label Accuracy đạt $13/15 = \mathbf{86.67\%}$ (Wilson 95% CI thực tế: $[62.1\%, 96.3\%]$).
  *(Tài liệu phiên bản cũ ghi $86.67\%$ nhưng chép nhầm khoảng tin cậy $[91.6\%, 98.4\%]$ của 5-Fold CV, dẫn đến giá trị nằm ngoài khoảng. Bản tài liệu này đã tách bạch và đính chính chính xác)*.

---

### 3. Model 3 — Javit Intent Classifier (Bộ phân loại ý định người dùng)
* **Phân loại thành phần**: **Mô hình học từ dữ liệu** (Data-Learned Model — Multinomial Naive Bayes).
* **Vị trí mã nguồn**: `src/ai-training/scripts/intent_train.js`, `src/lib/javitNLP.js`.
* **Thuật toán**: Multinomial Naive Bayes với Laplace Smoothing $\alpha = 1.0$:
  $$P(C_k \mid \mathbf{w}) \propto P(C_k) \prod_{t=1}^{|V|} \left(\frac{N_{k, t} + 1.0}{N_k + |V|}\right)^{x_t}$$
* **7 Lớp ý định thực tế trong mã nguồn**:
  `nav_phongthi` (vào lab/phòng thi), `nav_dautruong` (vào đấu trường 1v1), `nav_hoso` (mở hồ sơ), `nav_story` (chế độ cốt truyện), `toggle_theme` (chuyển giao diện sáng/tối), `stem_query` (câu hỏi học thuật STEM), `chitchat` (chào hỏi xã giao).
  *(Lưu ý minh bạch: Các nhãn sư phạm mô tả trong tài liệu cũ như `ask_theory`, `request_hint` hiện chưa có trong bộ phân loại này mà do Socratic LLM điều phối)*.
* **Nguồn dữ liệu & Công bố rò rỉ dữ liệu (Data Leakage)**:
  - Bộ 140 câu mẫu do nhóm biên soạn theo các mẫu câu hỏi thường gặp.
  - Kiểm tra đối chiếu giữa tập huấn luyện (110 câu) và tập kiểm thử (30 câu): phát hiện **2 câu trùng khớp 100%** và **6 câu gần trùng** (độ tương đồng $> 80\%$) do sinh từ cùng khung mẫu cú pháp.
* **Kết quả đo thực tế**:
  - **5-Fold Cross Validation ($n=140$)**: $124/140 = \mathbf{88.57\%}$ (Wilson 95% CI: $[82.2\%, 92.8\%]$).
  - **Kiểm thử trên 30 câu unseen test**: $25/30 = \mathbf{83.33\%}$ (Wilson 95% CI: $[66.4\%, 92.7\%]$).

---

### 4. Model 4 — Math Adaptive Engine (Điều chỉnh độ khó thích ứng môn Toán - 1PL IRT)
* **Phân loại thành phần**: **Thuật toán tất định** (Deterministic Mathematical Formula Engine).
* **Vị trí mã nguồn**: `src/lib/mathAdaptiveEngine.js` (hàm `calculateIRTHitProbability`, `selectAdaptiveMathQuestion`).
* **Mô hình toán học**: Áp dụng trực tiếp công thức Logit 1 tham số (1PL / Rasch Model):
  $$P(\text{correct} \mid \theta, b) = \frac{1}{1 + e^{-1.7 \cdot (\theta - b)}}$$
* **Cơ chế hoạt động từng bước trong code**:
  1. *Chuyển đổi điểm Elo sang không gian năng lực*:
     $$\theta = \frac{\text{studentElo} - 1500.0}{400.0}, \quad b = \frac{\text{itemDifficultyElo} - 1500.0}{400.0}$$
  2. *Hằng số tỷ lệ định cỡ*: $D = 1.7$ cố định (scaling constant để xấp xỉ hàm phân phối chuẩn tích lũy normal ogive, không phải hệ số phân biệt $a_i$); không sử dụng tham số đoán mò $c_i$ hay độ phân biệt $a_i$ riêng lẻ cho từng câu (đặc trưng mô hình 1PL Rasch).
  3. *Không có quá trình huấn luyện máy học*: Tham số không qua ước lượng hợp lý cực đại (MLE hay Marginal MLE) mà suy diễn trực tiếp từ Elo.
  4. *Lựa chọn câu hỏi thích ứng*: Duyệt danh sách câu hỏi, chọn câu hỏi có khoảng cách $|P - 0.675|$ nhỏ nhất để đưa học sinh vào Vùng phát triển gần nhất (ZPD: $P \in [0.60, 0.75]$).
* **Dữ liệu kiểm thử**: File `src/ai-training/scripts/test-math-irt.js` kiểm thử trên 10 cặp (studentElo, itemElo) mẫu: $4/10$ cặp rơi vào đúng vùng ZPD mục tiêu.

---

### 5. Model 5 — Genetics Reasoner (Tổ hợp xác suất Punnett tất định)
* **Phân loại thành phần**: **Thuật toán tất định** (Deterministic Combinatorial Algorithm).
* **Vị trí mã nguồn**: `src/ai-training/scripts/genetics_train.js`, `src/lib/geneticsEngine.js`.
* **Cơ chế suy luận**:
  - Áp dụng nguyên lý nhân xác suất độc lập và tổ hợp ma trận bảng Punnett cho các locus gen phân ly độc lập ($\text{AaBb} \times \text{AaBb}$).
  - *(Lưu ý minh bạch: Mã nguồn hiện tại chỉ mô phỏng phân ly độc lập Menđen; tính năng hoán vị gen với tần số $f \le 50\%$ hoặc liên kết gen chưa được lập trình. Mô hình không thực hiện ước lượng hậu nghiệm Bayes $P(G \mid P)$ mà tính tích xác suất tiên lượng thuận)*.
* **Kết quả đo thực tế**:
  - $10/10$ ca kiểm thử unit test chuẩn đạt kết quả chính xác (**100%**, khoảng tin cậy Wilson 95%: $[72.2\%, 100.0\%]$).

---

### 6. Model 6 — Multilingual TF-IDF RAG Engine (Truy xuất Tri thức Ngữ liệu)
* **Phân loại thành phần**: **Thuật toán tất định & Thống kê ngữ liệu** (Deterministic Vector Space Model & Corpus Statistics).
* **Vị trí mã nguồn**: `src/lib/ragService.js`, `src/ai-training/scripts/rag-evaluation.js`.
* **Thuật toán**: Mô hình không gian vector TF-IDF N-gram (Unigram, Bigram), trọng số Sublinear TF ($1 + \log(\text{tf})$), độ đo Cosine Similarity trên vector chuẩn hóa $L_2$.
* **Đặc điểm bộ ngữ liệu (303 Chunks)**:
  - Gồm 303 đoạn tóm tắt kiến thức cốt lõi (khoảng 9.061 tokens, gắn nhãn `sourceType: "team_summary"`) do nhóm tác giả tự biên soạn theo khung kiến thức GDPT 2018 (Toán, Lý, Hóa, Sinh).
  - Đây là bản tóm tắt do nhóm biên soạn, không phải là văn bản số hóa nguyên văn từ SGK và không tự điền số trang hay tên bộ sách giả định.
* **Cơ chế Từ chối An toàn (Strict Grounding Abstention)**:
  - Khi câu hỏi có độ tương đồng Cosine cực đại $S_{\max} < 0.30$, hệ thống tự động từ chối trả lời để tránh suy đoán tùy tiện.
* **Kết quả đo đạc thực nghiệm**:
  - **Độ chính xác nhận diện môn học trên 32 truy vấn do nhóm soạn từ tiêu đề bài (có nguy cơ rò rỉ), không phải độ chính xác tìm đúng chunk**: Top-1 subject match đạt **$31/32 = 96.88\%$** (khoảng tin cậy Wilson 95%: $[84.3\%, 99.4\%]$).
    - *Ghi chú nguồn gốc*: 32 truy vấn test do nhóm phát triển tự biên soạn bằng cách trích xuất cụm từ khóa cốt lõi từ chủ đề các chunk (ví dụ: *"este hóa phản ứng giữa axit và ancol"*, *"dao động điều hòa con lắc đơn chu kỳ T"*), không phải câu hỏi do học sinh thật đưa ra; phép đo chỉ kiểm tra mức độ khớp môn học (subject match: hóa, lý, toán, sinh) của chunk retrieved Top-1.
  - **Bài đo chunk-level độc lập (60 câu hỏi tự nhiên của học sinh + 20 câu ngoài phạm vi tại `rag_chunk_benchmark_60.json`, SHA-256 locked)**:
    - *Nguồn gốc dữ liệu*: Bộ benchmark do nhóm phát triển tự viết tay độc lập (không dùng LLM) mô phỏng câu hỏi tự nhiên của học sinh (ngôn ngữ đời thường, đa dạng cú pháp, không dấu, teencode) kèm ánh xạ `expectedChunkIds` đối chiếu thủ công với `stem-corpus.json`.
    - **Recall@1**: $16/60 = \mathbf{26.67\%}$ (Wilson 95% CI: $[17.1\%, 39.0\%]$).
    - **Recall@3**: $22/60 = \mathbf{36.67\%}$ (Wilson 95% CI: $[25.6\%, 49.3\%]$).
    - **Recall@5**: $26/60 = \mathbf{43.33\%}$ (Wilson 95% CI: $[31.6\%, 55.9\%]$).
    - **Mean Reciprocal Rank (MRR)**: $\mathbf{0.3225}$.
    - **Tỷ lệ từ chối đúng trên tập ngoài phạm vi (True Rejection, 20 câu OOD)**: $20/20 = \mathbf{100.00\%}$ (Wilson 95% CI: $[83.9\%, 100.0\%]$).
    - **Tỷ lệ từ chối nhầm trên tập trong phạm vi (False Rejection)**: $58/60 = \mathbf{96.67\%}$ (Wilson 95% CI: $[88.6\%, 99.1\%]$) do thuật toán TF-IDF không có cơ chế mở rộng từ đồng nghĩa hay chuẩn hóa không dấu dẫn đến điểm tương đồng $S_{\max} < 0.30$. Nhóm giữ nguyên ngưỡng theo cam kết trung thực, không sửa ngưỡng sau khi thấy kết quả test.
  - **Kịch bản mô phỏng đối chứng giả định ($n=80$ câu tại `rag_ablation_results.json`)**:
    - *Ghi chú minh bạch*: Đây là kịch bản **mô phỏng suy nghiệm (heuristic simulation)** dựa trên quy tắc/từ khóa, **KHÔNG PHẢI số liệu đo lường trực tiếp trên Gemini LLM thật** (chưa có log thô API request/response). Số liệu so sánh được trình bày theo điểm phần trăm (pp) và lưu ý điều kiện Vanilla LLM không có cơ chế từ chối tự nhiên.
    - Trên 50 câu hỏi khó: Không RAG (mô phỏng) đạt $36/50 = 72\%$ (Wilson CI: $[58.3\%, 82.5\%]$); Có RAG (mô phỏng) đạt $46/50 = \mathbf{92\%}$ (Wilson CI: $[81.2\%, 96.8\%]$, chênh lệch +20 điểm phần trăm / pp). Tỷ lệ ảo giác mô phỏng giảm từ $28\%$ xuống $\mathbf{4.00\%}$ (-24 pp).
    - Trên 30 câu hỏi ngoài phạm vi (Out-of-Scope): Tỷ lệ kích hoạt cảnh báo từ chối đạt $29/30 = \mathbf{96.67\%}$ (Wilson CI: $[83.3\%, 99.4\%]$). Đây là hệ quả trực tiếp của việc áp ngưỡng cosine 0.30 trên câu hỏi ngoài phạm vi, không phải thành tích thuật toán vượt trội.

---

## PHẦN II: AI SƯ PHẠM SOCRATIC & ĐIỀU PHỐI LLM

### 1. Trợ lý Sư phạm Socratic LLM
* **Phân loại**: **Gọi mô hình ngoại vi (External LLM)** qua Google Gemini API.
* **Kiến trúc Zero-Trust API Proxy**:
  - Toàn bộ yêu cầu từ client đi qua Next.js Server Route (`/api/gemini-proxy` và `/api/chat-ai`), khóa API `GEMINI_API_KEY` được bảo mật hoàn toàn ở môi trường server.
* **Phương pháp Socratic**:
  - Prompt hệ thống yêu cầu AI không cung cấp trực tiếp đáp án cuối cùng mà gợi ý từng bước (Metacognitive Decomposition).
  - Xử lý biểu thức toán học qua bộ lọc chuyển đổi sang KaTeX chuẩn trước khi hiển thị cho học sinh.
* **Kiểm soát lưu lượng (Rate Limiting)**:
  - Giới hạn **80 requests/phút** trên mỗi định danh học sinh / địa chỉ IP (thực thi tại `src/lib/serverSecurity.js`).

### 2. Quy trình Nạp & Thẩm định Tri thức Mới (Human-in-the-Loop RAG)
* **Nguyên tắc an toàn**: Mọi câu hỏi và câu trả lời mới phát sinh trong quá trình học sinh tương tác qua Trợ lý AI chính **mặc định mang trạng thái `pending_review`** và bị **cách ly kỹ thuật** khỏi cơ sở tri thức RAG (`quarantined: false, teacherVerified: false`).
* **Nguồn nạp duy nhất**: Chỉ chấp nhận bản ghi từ Trợ lý AI chính trên giao diện trang chủ khi người dùng đã đăng nhập kèm Firebase Bearer ID Token hợp lệ. Toàn bộ các phòng lab nhúng (`public/labs/*/stem-lab-ai-bridge.js`) đã tắt tính năng gửi trực tiếp không xác thực. Hệ thống loại bỏ hoàn toàn việc sử dụng token nội bộ chia sẻ (không dùng so khớp tĩnh hay timingSafeEqual cho token chia sẻ); xác thực 100% dựa trên chữ ký mật mã của Firebase Admin SDK.
* **Thẩm định bởi giáo viên thật (Teacher Review HUD)**:
  - Đặt tại `/admin/knowledge-review`.
  - Bỏ hoàn toàn ô tự gõ tên; danh tính người duyệt được xác thực tự động từ tài khoản đăng nhập (Firebase Auth ID token) ở phía server.
  - Route PATCH `/api/learned-knowledge` và Firestore Security Rules kiểm tra nghiêm ngặt vai trò `teacher` hoặc `admin` từ token.
  - Hệ thống ghi nhật ký kiểm toán (Audit Log) ghi nhận `reviewerUid`, `reviewerEmail`, thời điểm, trạng thái trước (`beforeState`) và trạng thái sau (`afterState`) lưu tại `src/data/knowledge_audit_log.json` và Firestore `admin_logs`.
* **Quyền ghi Firestore**: Được siết chặt trong `firestore.rules`: người dùng thông thường chỉ có thể tạo bản ghi ở trạng thái `pending_review` với `teacherVerified: false`, nghiêm cấm tự gắn nhãn đã duyệt.

---

## PHẦN III: THỊ GIÁC MÁY TÍNH & HÌNH HỌC KHÔNG GIAN 3D

1. **Vision Math OCR**:
   - Sử dụng Gemini Vision API để nhận diện hình ảnh đề bài toán hình học và trích xuất dữ kiện văn bản.
2. **Bộ giải dữ kiện hình học tất định (`geometryFactSolver.js`)**:
   - Chứa các công thức giải tích chuẩn mực cho 12+ dạng hình khối THPT (tính chiều cao $h$, bán kính đáy $r$, góc $\alpha$).
3. **Mô hình hóa 3D Mesh**:
   - Sử dụng Three.js / WebGL dựng khối đa diện không gian cho phép học sinh tương tác xoay 360 độ và quan sát thiết diện.

---

## PHẦN IV: ĐẤU TRƯỜNG PvP 1v1 & BẢO MẬT PHÒNG THI

1. **Ghép trận Elo động**:
   - Mở rộng cửa sổ tìm kiếm đối thủ theo hàm thời gian $\text{Window}(t) = \text{ELO} \pm (\Delta_0 + \gamma \cdot t)$.
   - Thời gian ghép trận thật giữa hai học sinh phụ thuộc vào số lượng người chơi trong hàng đợi; hệ thống áp dụng cơ chế tự động chuyển sang Bot sau 30 giây chờ đợi. Các tuyên bố ghép trận tức thì "3–5 giây" trước đây dựa trên việc ghép ngay với Bot giả lập đã được gỡ bỏ khỏi tài liệu công bố.
2. **Xử lý dữ liệu sinh trắc học khuôn mặt (ResNet-34 FaceNet 128-D, so khớp 1:1)**:
   - Sử dụng thư viện `@vladmandic/face-api@1.7.12` (mô hình ResNet-34 FaceNet và TinyFaceDetector qua TensorFlow.js) chạy trực tiếp trên trình duyệt để trích xuất vector đặc trưng số thực 128 chiều và so khớp 1:1 với vector đã đăng ký (khoảng cách Euclidean $\le 0.52$).
   - **Cam kết bảo vệ dữ liệu cá nhân & Cách ly Subcollection**: Hệ thống hoàn toàn không lưu trữ ảnh chụp hay video webcam thô của học sinh; vector số 128-D được cô lập bảo mật trong subcollection `users/{uid}/private/biometrics` với Firestore Security Rules nghiêm ngặt chỉ cho phép duy nhất chủ sở hữu đọc/ghi/xóa (Owner-Only Access; giáo viên và quản trị viên không có quyền đọc). Trường `faceDescriptor` ở document gốc `users/{uid}` bị cấm tạo và cấm cập nhật.
   - **Đồng thuận minh bạch & Phương án thi thay thế**: Đã triển khai bản ghi đồng ý độc lập tại `users/{uid}/private/consent` (`consentVersion: "1.0"`, ghi chú rõ học sinh dưới 18 tuổi cần sự đồng thuận của cha mẹ hoặc người giám hộ). Việc xác thực khuôn mặt là TÙY CHỌN, KHÔNG BẮT BUỘC: nếu học sinh từ chối, hệ thống cung cấp phương án giám sát thay thế (giáo viên giám sát thủ công tại phòng thi) và không chặn quyền vào thi của học sinh. Có nút xóa vĩnh viễn dữ liệu sinh trắc học bất kỳ lúc nào.
3. **Anti-Cheat Focus AI**:
   - Lắng nghe sự kiện chuyển tab (`visibilitychange` / `blur`) để cảnh báo học sinh khi rời khỏi màn hình làm bài.

---

## PHẦN V: BỘ ĐỐI CHỨNG KỸ THUẬT TỔNG HỢP 150 CA

* **Định danh chính thức**: **Bộ đối chứng kỹ thuật tổng hợp (Synthetic Benchmark) gồm 150 ca do nhóm phát triển tự xây dựng, chưa qua chấm của giáo viên**.
* **Mục đích**: Dùng làm tập dữ liệu kiểm thử tự động (Unit Test / Integration Test) trong pipeline phát triển phần mềm để đánh giá tính ổn định của các module.
* **Cơ cấu 150 ca**: Phân bổ trên 4 môn:
  - 40 ca Toán học (khảo sát hàm số, nguyên hàm - tích phân, Oxyz, xác suất).
  - 38 ca Vật lý (dao động cơ, sóng cơ, mạch RLC, quang học).
  - 38 ca Hóa học (este, cacbohydrat, kim loại, cân bằng hóa học).
  - 34 ca Sinh học (di truyền phân tử, quy luật Menđen, Hardy-Weinberg, sinh thái).
* **Cam kết trung thực**: Mọi trường điểm số ban đầu đã được đóng gói thành `preset_not_for_reporting` và loại bỏ hoàn toàn khỏi các báo cáo công bố. Dữ liệu đánh giá của giáo viên thật sẽ chỉ được ghi nhận khi các thầy cô trực tiếp thẩm định qua hệ thống Teacher Review HUD.

---

## PHẦN VI: BẢNG TỔNG HỢP PHÂN LOẠI & CHỈ SỐ KIỂM TOÁN CÁC MÔ HÌNH

| # | Mô Hình AI | Phân Loại Thành Phần | Dữ Liệu Kiểm Thử | Chỉ Số Chính (Accuracy / Metric) | Khoảng Tin Cậy Wilson 95% |
|---|---|---|---|:---:|:---:|
| 1 | **ChemLab Risk Classifier** | Thuật toán tất định (Circuit Breaker) + Softmax Linear Risk Scoring (1 Dense layer, lr=0.2, GD 1000 epochs) | $n=20$ ca biên nguy cơ<br>$n=135$ (5-Fold CV tổng hợp) | **95.00%** (19/20 biên, FN: 0)<br>**95.56%** (129/135 CV) | $[76.4\%, 99.1\%]$ (Biên)<br>$[90.6\%, 97.9\%]$ (5-Fold CV) |
| 2 | **Physics Error Diagnostic** | Mô hình học từ dữ liệu ($k$-NN, $k=5$) | $n=135$ (5-Fold CV)<br>$n=15$ ca biên | **96.30%** (130/135)<br>**86.67%** (13/15) | $[91.6\%, 98.4\%]$<br>$[62.1\%, 96.3\%]$ |
| 3 | **Javit Intent Classifier** | Mô hình học từ dữ liệu (Naive Bayes) | $n=140$ (5-Fold CV)<br>$n=30$ unseen test | **88.57%** (124/140)<br>**83.33%** (25/30) | $[82.2\%, 92.8\%]$<br>$[66.4\%, 92.7\%]$ |
| 4 | **Math Adaptive Engine** | Thuật toán tất định (1PL Rasch Logit) | $n=10$ ca kiểm thử kỹ thuật | **4/10** ca trúng ZPD $[0.60, 0.75]$ | $[16.8\%, 68.7\%]$ |
| 5 | **Genetics Reasoner** | Thuật toán tất định (Tổ hợp Punnett) | $n=10$ unit test lai độc lập | **10/10 passed** | $[72.2\%, 100.0\%]$ |
| 6 | **TF-IDF RAG Retriever** | Thuật toán tất định & Thống kê ngữ liệu (TF-IDF + Cosine) | $n=32$ queries tiêu đề (khớp môn)<br>$n=60$ chunk benchmark (+20 OOD)<br>*(Ablation $n=80$ là mô phỏng heuristic)* | Khớp môn Top-1: **96.88%** (31/32)<br>Recall@1: **26.67%** (16/60)<br>Recall@3: **36.67%** (22/60)<br>Recall@5: **43.33%** (26/60)<br>MRR: **0.3225** | Khớp môn: $[84.3\%, 99.4\%]$<br>Recall@1: $[17.1\%, 39.0\%]$<br>Recall@3: $[25.6\%, 49.3\%]$<br>Recall@5: $[31.6\%, 55.9\%]$<br>Loại trừ OOD: $[83.9\%, 100.0\%]$ |
| - | **Socratic Tutor** | Gọi LLM ngoại vi (Google Gemini API) | Thực nghiệm đối thoại Socratic | Hỗ trợ gợi mở sư phạm | N/A (Cloud API) |
| - | **Vision Math OCR** | Gọi LLM ngoại vi (Gemini Vision API) | Trích xuất đề toán hình ảnh | Trích xuất dữ kiện hình học | N/A (Cloud API) |
| - | **Phát hiện khuôn mặt trước camera** | Thị giác máy tính cục bộ (TensorFlow.js) | Webcam giám sát thi | Phát hiện có mặt người & vector 128-D | N/A (Client-side detector) |
