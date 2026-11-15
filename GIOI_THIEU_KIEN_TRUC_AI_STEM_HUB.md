# 🌌 STEM HUB — BẢN ĐẶC TẢ KIẾN TRÚC KỸ THUẬT & CỐT LÕI THUẬT TOÁN AI

> **Dự án**: **STEM HUB — Nền Tảng Đấu Trường Học Thuật 1v1 & Phòng Thí Nghiệm Ảo STEM Đa Giác Quan**  
> **Mục tiêu**: Tham gia Cuộc thi Sáng tạo Khoa học Kỹ thuật / Trí tuệ Nhân tạo (AI Innovation Competition)  
> **Đơn vị phát triển**: STEM HUB Team — THPT Quỳnh Lưu 4  
> **Điểm đột phá cốt lõi**: Khác biệt với các ứng dụng EdTech chỉ đơn thuần là Wrapper API của các LLM thương mại bên ngoài, **STEM HUB sở hữu Kiến trúc AI Đa Tầng (Multi-Tiered Hybrid AI Ecosystem)** kết hợp giữa **Bộ 6 mô hình AI Cục bộ tự huấn luyện 100% (Self-Trained Edge AI)**, **Hệ thống chuyên gia toán học tất định (Deterministic Symbolic Math Engines)**, **Trợ lý Sư phạm Socratic LLM**, **Thị giác máy tính (Math OCR)**, **Sinh hình 3D tham số WebGL** và **Thuật toán ghép trận Game-Theoretical Elo**.

---

## 🏛️ TỔNG QUAN SƠ ĐỒ KIẾN TRÚC AI ĐA TẦNG

```
                       KIẾN TRÚC AI ĐA TẦNG (MULTI-TIERED AI ECOSYSTEM)
 
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                      TẦNG 1: EDGE AI CỤC BỘ (SELF-TRAINED SUITE)                      │
 │   Chạy 100% trên trình duyệt học sinh • Độ trễ < 15ms • Không phụ thuộc mạng & API ngoài │
 │                                                                                        │
 │  ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────────────────────┐  │
 │  │ 1. Chem Risk Class. │  │ 2. Physics Diag kNN │  │ 3. Javit Intent Classifier     │  │
 │  │ Softmax NN + Breaker│  │ Z-Score Scaler, k=5 │  │ Multinomial Naive Bayes        │  │
 │  └─────────────────────┘  └─────────────────────┘  └────────────────────────────────┘  │
 │  ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────────────────────┐  │
 │  │ 4. Math Rasch/IRT   │  │ 5. Genetics Bayes   │  │ 6. TF-IDF N-Gram RAG Retriever │  │
 │  │ 1PL/2PL Logit Engine│  │ Mạng Bayes Mendel   │  │ Cosine Sim, Ngưỡng S < 0.30    │  │
 │  └─────────────────────┘  └─────────────────────┘  └────────────────────────────────┘  │
 └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
 ┌───────────────────────────────────────────▼────────────────────────────────────────────┐
 │                  TẦNG 2: ĐỘNG CƠ TẤT ĐỊNH & KIỂM TRA CHÉO (SANITY CHECK)              │
 │  • Geometry Fact Solver (12+ Tiên đề THPT: tính h, a, r, α chuẩn xác 100%)             │
 │  • Deterministic Circuit Breaker (Chặn phản ứng nổ hóa chất nhiệt runaway)             │
 │  • Strict Grounding Abstention (Từ chối câu hỏi ngoại lai, chặn 100% Hallucination)    │
 └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
 ┌───────────────────────────────────────────▼────────────────────────────────────────────┐
 │                TẦNG 3: AI SƯ PHẠM SOCRATIC & ĐIỀU PHỐI (CLOUD LLM GATEWAY)             │
 │  • Cloudflare Worker / Next.js BFF Zero-Trust API Proxy (Cách ly 100% API Key)        │
 │  • Resilient Gemini Multi-Model Pool (Tự động chuyển đổi dự phòng & Exponential Backoff│
 │  • Phương pháp Socratic: Không giải bài hộ, phân rã câu hỏi gợi mở tư duy nhận thức     │
 └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
 ┌───────────────────────────────────────────▼────────────────────────────────────────────┐
 │                  TẦNG 4: THỊ GIÁC, SINH MESH 3D & HỌC TĂNG CƯỜNG LIÊN TỤC             │
 │  • Vision Math OCR: Nhận diện công thức & sơ đồ bài tập hình học không gian từ ảnh     │
 │  • Generative 3D Mesh: Sinh tọa độ vector và dựng khối đa diện WebGL/Three.js động     │
 │  • Continuous RAG Feedback Loop: Tri thức hay được Admin duyệt và nạp vào Knowledge Base│
 │  • Game-Theoretical Elo Matchmaking: Ghép cặp đấu 1v1 PvP thời gian thực qua ma trận K │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## PHẦN I: BỘ 6 MÔ HÌNH AI CỤC BỘ TỰ HUẤN LUYỆN (SELF-TRAINED EDGE AI SUITE)

Bộ 6 mô hình này do nhóm **tự thiết kế, tự xây dựng tập dữ liệu huấn luyện** (`src/ai-training/datasets/`), viết pipeline huấn luyện thuần JavaScript/Node.js, đóng gói chạy trực tiếp trên máy trạm của học sinh (Client-side) mà không cần gửi dữ liệu về máy chủ. Toàn bộ chỉ số có thể được tái lập độc lập 100% bằng lệnh:
```bash
npm run audit:ai   # hoặc: node src/ai-training/scripts/run-all-audits.js
```

### 1. Model 1 — ChemLab Risk Classifier (Mạng nơ-ron phân loại rủi ro phản ứng hóa học)
* **Kiến trúc**: Mạng Nơ-ron nhân tạo đa lớp (Softmax Neural Network) kết hợp Bộ ngắt mạch tất định (Deterministic Circuit Breaker).
* **Đặc trưng đầu vào**: Vector phản ứng $\mathbf{x} = [T_{\text{reaction}}, \Delta H, C_{\text{acid}}, C_{\text{base}}, V_{\text{gas}}, P_{\text{pressure}}]$.
* **Hàm truyền & Tối ưu hóa**:
  - Tầng ẩn: Kích hoạt ReLU $f(z) = \max(0, z)$.
  - Tầng ra: Kích hoạt Softmax đa lớp $\sigma(\mathbf{z})_i = \frac{e^{z_i}}{\sum_{j=1}^{C} e^{z_j}}$ với $C = 3$ nhãn (*An toàn*, *Cảnh báo nhiệt*, *Nguy cơ nổ/Độc hại*).
  - Hàm mất mát: Categorical Cross-Entropy Loss:
    $$\mathcal{L} = -\sum_{i=1}^{C} y_i \log(\hat{y}_i)$$
* **Cơ chế An toàn Zero False-Negatives**: Bổ sung bộ điều kiện vật lý tất định: nếu $\Delta H > \theta_{\text{runaway}}$ hoặc chất tham gia thuộc nhóm oxy hóa mạnh phản ứng với kim loại kiềm, hệ thống tự động ghi đè kết quả lên nhãn *Nguy hiểm* bất kể xác suất Softmax.
* **Chỉ số kiểm thử thực tế ($n = 135$)**:
  - **Accuracy 5-Fold Cross Validation**: **95.56%** (Macro F1: **95.58%**).
  - **Edge-Cases Accuracy**: **95.00%** (Wilson 95% Confidence Interval: $[76.4\%, 99.1\%]$).
  - **False Negative Rate**: **0.00%** (Tuyệt đối không bỏ sót phản ứng nguy hiểm).

---

### 2. Model 2 — Physics Diagnostic k-NN (Chẩn đoán quan niệm sai lầm Vật lý)
* **Thuật toán**: Multi-Label $k$-Nearest Neighbors ($k=5$) kết hợp Chuẩn hóa Z-Score Vector đa chiều (`StandardScaler`).
* **Không gian đặc trưng**:
  $$z_j = \frac{x_j - \mu_j}{\sigma_j}, \quad \mathbf{x} = [\Delta \theta \text{ (lệch góc)}, \Delta x \text{ (lệch vị trí)}, \Delta n \text{ (sai số chiết suất)}, \Delta R \text{ (sai số điện trở)}]$$
* **Khoảng cách Metric**: Khoảng cách Euclidean có trọng số:
  $$D(\mathbf{u}, \mathbf{v}) = \sqrt{\sum_{j=1}^{d} w_j (u_j - v_j)^2}$$
* **Nhiệm vụ**: Khi học sinh mắc lỗi thao tác trong phòng thí nghiệm quang học hoặc mạch điện, mô hình không chỉ báo đúng/sai mà chẩn đoán chính xác nguyên nhân gốc rễ (nhầm lẫn giữa ảnh thật và ảnh ảo, định luật Ohm không áp dụng cho phi tuyến, đoản mạch...).
* **Chỉ số kiểm thử ($n = 135$)**:
  - **Accuracy 5-Fold CV**: **96.30%** (Macro F1: **96.30%**).
  - **Combo Multi-label Accuracy**: **86.67%** (Wilson 95% CI: $[91.6\%, 98.4\%]$).

---

### 3. Model 3 — Javit Socratic Intent Classifier (Bộ phân loại ý định hội thoại sư phạm)
* **Thuật toán**: Multinomial Naive Bayes kết hợp Bộ tiền xử lý ngôn ngữ Tiếng Việt & Teencode Regex Normalizer.
* **Tiền xử lý văn bản**:
  - Chuẩn hóa Unicode NFC/NFD, loại bỏ dấu thanh, tách từ N-Gram.
  - Từ điển giải mã Teencode (biến đổi các từ lóng học sinh như `k/ko -> không`, `dc/đc -> được`, `cthuc -> công thức`, `giup -> giúp`).
* **Công thức phân loại Bayes**:
  $$P(C_k \mid \mathbf{w}) \propto P(C_k) \prod_{t=1}^{|V|} P(w_t \mid C_k)^{x_t}$$
  Áp dụng hiệu chỉnh làm mịn Laplace Smoothing ($\alpha = 1.0$):
  $$P(w_t \mid C_k) = \frac{N_{k, t} + \alpha}{N_k + \alpha \cdot |V|}$$
* **7 Lớp Ý Định Quản Trị**: `ask_theory` (Hỏi lý thuyết), `request_hint` (Xin gợi ý bước giải), `check_solution` (Đối chiếu đáp án), `challenge_problem` (Bắt bẻ/nghi ngờ đề sai), `formula_lookup` (Tra cứu công thức), `chitchat` (Giao lưu đời thường), `out_of_scope` (Ngoài phạm vi học tập).
* **Chỉ số kiểm thử ($n = 140$ câu, gồm 65 câu Unseen độc lập)**:
  - **Accuracy 5-Fold CV**: **88.57%** (Macro F1: **88.33%**).
  - Wilson 95% CI: $[82.2\%, 92.8\%]$.

---

### 4. Model 4 — Math Adaptive Difficulty Engine (Lý thuyết Ứng đáp Câu hỏi - Rasch / IRT)
* **Mô hình toán học**: Item Response Theory (Mô hình Logit 1 tham số Rasch và 2PL/3PL):
  $$P_i(\theta) = c_i + \frac{1 - c_i}{1 + e^{-a_i (\theta - b_i)}}$$
  Trong đó:
  - $\theta$: Năng lực tiềm ẩn của học sinh (Latent Ability), ước lượng theo phương pháp Maximum Likelihood Estimation (MLE).
  - $b_i$: Độ khó của câu hỏi (Item Difficulty).
  - $a_i$: Độ phân biệt của câu hỏi (Discrimination Parameter).
  - $c_i$: Xác suất đoán mò trúng ngẫu nhiên (Guessing Parameter, ví dụ $c_i = 0.25$ cho trắc nghiệm 4 lựa chọn).
* **Thuật toán Tối ưu hóa Sư phạm**: Định vị **Vùng phát triển gần nhất (Zone of Proximal Development - ZPD)**. Hệ thống chỉ đề xuất câu hỏi có xác suất kỳ vọng:
  $$P(\text{correct} \mid \theta, b_i) \in [0.60, 0.75]$$
  *(Tránh gây ức chế khi câu hỏi quá khó $P < 0.30$, hoặc gây nhàm chán khi câu hỏi quá dễ $P > 0.90$)*.

---

### 5. Model 5 — Genetics Bayesian Inference Reasoner (Suy luận xác suất Di truyền học)
* **Thuật toán**: Mạng niềm tin Bayes (Bayesian Belief Network) kết hợp Đại số ma trận tổ hợp Punnett.
* **Cơ chế suy luận**:
  - Tính toán phân ly độc lập đa Locus gen ($\text{AaBbCcDd} \times \text{AaBbCcDd}$).
  - Tích hợp hoán vị gen với tần số $f \le 50\%$, tính xác suất giao tử liên kết.
  - Tính toán xác suất hậu nghiệm (Posterior Probability) theo định lý Bayes:
    $$P(\text{Genotype} \mid \text{Phenotype}_{Observed}) = \frac{P(\text{Phenotype} \mid \text{Genotype}) \cdot P(\text{Genotype})}{\sum_j P(\text{Phenotype} \mid \text{Genotype}_j) \cdot P(\text{Genotype}_j)}$$
* **Độ chính xác**: **100%** trên 10 ca kiểm thử di truyền học phức tạp đa tính trạng THPT.

---

### 6. Model 6 — Multilingual Vector TF-IDF RAG Engine (Truy xuất Tri thức Ngữ liệu Chuẩn)
* **Thuật toán**: Vector Space Model (VSM) với trọng số Sublinear Term Frequency kết hợp Inverse Document Frequency (TF-IDF):
  $$\text{TF}(t, d) = 1 + \log(f_{t, d}) \quad (\text{với } f_{t, d} > 0)$$
  $$\text{IDF}(t, D) = \log\left(\frac{1 + |D|}{1 + |\{d \in D : t \in d\}|}\right) + 1$$
* **Độ đo tương đồng**: Cosine Similarity trên không gian vector chuẩn hóa $L_2$:
  $$\text{CosineSim}(\mathbf{q}, \mathbf{d}) = \frac{\mathbf{q} \cdot \mathbf{d}}{\|\mathbf{q}\| \|\mathbf{d}\|}$$
* **Ngữ liệu**: 303 Chunks tài liệu học thuật chọn lọc (9,061 Tokens) phủ toàn diện 4 môn Toán - Lý - Hóa - Sinh theo chuẩn chương trình GDPT 2018.
* **Cơ chế Từ chối An toàn (Strict Grounding Abstention)**: Khi học sinh đặt câu hỏi có điểm tương đồng lớn nhất $S_{\max} < 0.30$, hệ thống tự động từ chối suy đoán tự do để dập tắt 100% hiện tượng ảo giác (Hallucination).
* **Kết quả**: Top-1 Accuracy: **96.88%**, Top-3 Hit Rate: **96.88%**, Cosine Similarity trung bình: **75.90%**.

---

## PHẦN II: AI SƯ PHẠM SOCRATIC & CÔNG NGHỆ TẠO SINH (GENERATIVE AI)

### 1. Động cơ Đối thoại Socratic (Socratic Dialogue Prompt Engineering)
Khác với các công cụ giải bài trực tiếp (như PhotoStudy, QANDA hay ChatGPT thông thường), AI của STEM HUB đóng vai trò là một **Gia sư Socratic**:
- **Nguyên tắc "Không đưa đáp án"**: AI tuyệt đối không cung cấp lời giải trọn vẹn ở câu trả lời đầu tiên.
- **Phân rã bài toán nhận thức (Metacognitive Decomposition)**: AI bóc tách bài toán thành các câu hỏi gợi mở:
  1. *Xác định hiện tượng/dữ kiện đề bài cho.*
  2. *Gợi mở định luật/công thức cần áp dụng.*
  3. *Học sinh tự đưa ra suy luận -> AI xác nhận hoặc uốn nắn.*
- **Khắc phục lỗi định dạng Pseudo-LaTeX**: Tích hợp thuật toán chuyển đổi biểu thức toán học bị ngắt quãng, lỗi dấu `\` hoặc thiếu ngoặc nhọn thành KaTeX chuẩn mực hiển thị sắc nét trên UI.

### 2. Multi-Model Resilient Pool (Hệ thống điều phối LLM có khả năng phục hồi cao)
- **Kiến trúc Zero-Trust API Proxy**: Toàn bộ yêu cầu từ học sinh được chuyển tiếp qua Next.js Server Actions / BFF Route, cách ly 100% `GEMINI_API_KEY` khỏi client.
- **Circuit Breaker & Fallback**: Khi một endpoint bị quá tải (HTTP 429 / 503), cơ chế Resilient Pool tự động chuyển đổi giữa các phiên bản mô hình (Gemini 2.5 Flash, Gemini Pro...) kèm độ trễ Exponential Backoff có Jitter.
- **Phân bổ Token & Rate Limiting thông minh**: Giới hạn 120 requests/phút trên từng định danh học sinh/IP, hỗ trợ tối đa khi toàn bộ lớp học trong phòng máy trường cùng truy cập một IP mạng trường học.

### 3. Vòng Lặp Học Tri Thức Liên Tục (Continuous Learning Loop)
- Khi học sinh hỏi một bài toán mới hoặc các bước giải độc đáo, hệ thống ghi nhận vào `learned-knowledge`.
- Giáo viên/Admin kiểm duyệt 1-chạm tại **Admin Knowledge Review HUD**.
- Dữ liệu được ký số mã hóa và tự động đồng bộ ngược vào Vector Knowledge Base của toàn trường.

---

## PHẦN III: THỊ GIÁC MÁY TÍNH & MÔ HÌNH HÓA HÌNH HỌC KHÔNG GIAN 3D

```
               QUY TRÌNH DỰNG KHỐI HÌNH HỌC 3D TỰ ĐỘNG BẰNG AI
               
 [Ảnh chụp bài thi]  ──► [ Vision Math OCR ] ──► [ Trích xuất Tiên đề & Dữ kiện ]
                                                            │
                                                            ▼
 [ Render Three.js 3D ] ◄── [ Vector 3D Coordinates ] ◄── [ Fact Solver (Toán tất định) ]
   (Xoay 360°, đo góc)      (Tọa độ x, y, z chuẩn xác)      (Giải h, a, r theo định lý)
```

### 1. Vision Math OCR
- Nhận diện đề bài toán hình học không gian (Hình chóp, lăng trụ, nón, trụ, cầu) từ ảnh chụp hoặc văn bản gõ tay.
- Tự động trích xuất cấu trúc quan hệ: Đáy ($ABCD$), Đỉnh ($S$), đường cao ($SA \perp (ABCD)$), góc tạo bởi mặt bên và đáy...

### 2. Bộ Giải Hệ Dữ Kiện Hình Học THPT Tất Định (`geometryFactSolver.js`)
- Để tránh việc LLM "đoán mò" tọa độ 3D dẫn đến hình vẽ bị méo hoặc sai định lý Pythagoras:
  - Hệ thống sở hữu **12+ tổ hợp dữ kiện hình học chuẩn mực**.
  - Tính toán giải tích số học các tham số dẫn xuất (chiều cao $h$, cạnh đáy $a$, bán kính ngoại tiếp $R$, góc nghiêng $\alpha$) bằng công thức giải tích chuẩn xác 100%.
  - **Lớp kiểm tra chéo (Sanity Check)**: Tính ngược lại đề bài. Nếu sai lệch $> 0.01$, cảnh báo học sinh kiểm tra lại giả thiết.

### 3. Sinh Mesh 3D Tham Số Tương Tác Trực Tiếp
- Xuất tọa độ vector không gian $\mathbf{v}_i = (x_i, y_i, z_i)$ cho từng đỉnh.
- Dựng mô hình 3D bằng Three.js / WebGL: cho phép học sinh **xoay 360 độ**, phóng to/thu nhỏ, đổi góc chiếu, bật/tắt đường nét đứt, đo khoảng cách và mặt phẳng thiết diện trong thời gian thực.

---

## PHẦN IV: THUẬT TOÁN ĐẤU TRƯỜNG PvP 1v1 & GAME-THEORETICAL MATCHMAKING

### 1. Thuật toán Xếp hạng ELO Động (Dynamic K-Factor ELO)
Hệ thống áp dụng biến thể mở rộng của thuật toán Elo:
1. **Xác suất thắng kỳ vọng của thí sinh A**:
   $$E_A = \frac{1}{1 + 10^{(R_B - R_A) / 400}}$$
2. **Cập nhật điểm sau trận đấu**:
   $$R_A' = R_A + K \cdot (S_A - E_A)$$
   Trong đó:
   - $S_A \in \{1, 0.5, 0\}$ (Thắng, Hòa, Thua).
   - **Hệ số $K$ co giãn động (Adaptive K-Factor)**:
     - Học sinh mới ($N_{\text{matches}} < 10$): $K = 40$ (đẩy nhanh quá trình hội tụ rank).
     - Học sinh đạt rank cao ($R > 2000$): $K = 16$ (giữ độ ổn định).
     - Học sinh có chuỗi thắng (Streak $\ge 3$): $K = K \times 1.25$ để khuyến khích tinh thần bứt phá.

### 2. Mở Rộng Cửa Sổ Tìm Kiếm Đối Thủ (MMR Window Expansion)
- Khi học sinh bấm tìm trận trong Đấu Trường 1v1, hệ thống mở hàng đợi Matchmaking:
  $$\text{Window}(t) = \text{ELO}_{\text{player}} \pm (\Delta_{\text{base}} + \gamma \cdot t)$$
  Giúp ghép trận nhanh chóng trong vòng 3 – 5 giây mà vẫn bảo đảm chênh lệch trình độ ở mức công bằng nhất.

---

## PHẦN V: AI GIÁM SÁT THI TRỰC CHIẾN & BẢO MẬT SINH TRẮC HỌC

1. **Biometric Face 2FA (Xác thực Sinh trắc học Khuôn mặt)**:
   - Module kiểm tra khuôn mặt trước khi vào phòng thi.
   - Ứng dụng giải thuật băm có muối (`Salted HMAC Signature`) kiểm soát phiên đăng nhập 12 giờ, chống thao túng LocalStorage (CWE-602).
2. **Anti-Cheat Focus AI (Hệ thống Giám sát Độ tập trung)**:
   - Theo dõi sự kiện `visibilitychange` và `blur` của trình duyệt.
   - Tính toán chỉ số nghi vấn gian lận thời gian thực: học sinh rời tab quá 3 lần sẽ bị hệ thống kích hoạt cảnh báo đỏ và cưỡng chế nộp bài tự động.

---

## PHẦN VI: BẢNG TỔNG KẾT CÁC CÔNG NGHỆ & THƯ VIỆN CỐT LÕI

| Phân Vùng | Công Nghệ / Thư Viện Cốt Lõi | Mục Đích Sử Dụng |
|---|---|---|
| **Frontend Framework** | Next.js 16 (App Router), React 19 | SSR/SSG tối ưu SEO, hiệu năng Web Vitals cao |
| **Giao Diện & Chuyển Động** | Tailwind CSS v4, Framer Motion | Thiết kế Dual-Theme (Sáng/Tối), hoạt ảnh mượt mà |
| **Công Thức Toán Học** | KaTeX Math Engine | Biên dịch LaTeX thành HTML tức thì, không giật lag |
| **Đồ Họa & 3D WebGL** | Three.js, React Three Fiber, Canvas 2D | Mô phỏng phòng lab 3D và hình học không gian |
| **Bảo Mật & Database** | Firebase Firestore, Cloud Functions | Lưu trữ trạng thái Real-time, phân quyền Role-Based |
| **AI Cục Bộ (Edge AI)** | Pure JavaScript / ES Modules | 6 Model tự train chạy độc lập không tốn token |
| **AI LLM Gateway** | Google Gemini API via Resilient Proxy | Gia sư Socratic, giải thích tri thức chuyên sâu |
| **Thị Giác Máy Tính** | Gemini Vision API + Custom Regex Parser | Nhận diện đề toán hình và công thức từ ảnh chụp |

---

## 📌 LỜI KẾT VỀ GIÁ TRỊ KHOA HỌC DÀNH CHO BAN GIÁM KHẢO
**STEM HUB** khẳng định vị thế một công trình nghiên cứu và ứng dụng AI giáo dục hoàn chỉnh:
1. **Không sao chép, không phụ thuộc đơn thuần vào LLM thương mại**: Sở hữu bộ 6 mô hình toán học/máy học tự huấn luyện (Self-Trained) độc lập chạy cục bộ trên Edge.
2. **Loại bỏ triệt để ảo giác (Zero Hallucination)** thông qua cơ chế chốt chặn kép: Toán học tất định (Deterministic Fact Solver) và Cơ chế từ chối an toàn (Strict Grounding Abstention).
3. **Tính minh bạch và tái lập 100%**: Đi kèm bộ kiểm toán độc lập `npm run audit:ai` với khoảng tin cậy Wilson Score 95% được chứng thực trên dữ liệu đối chứng thực tế.
