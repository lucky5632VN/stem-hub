# 📑 NHẬT KÝ HUẤN LUYỆN & AUDIT TÁI LẬP SỐ LIỆU AI (TRAINING LOG)
> **Trạng thái**: Tái lập tự động qua script khi thực thi `node src/ai-training/scripts/run-all-audits.js`  
> **Git Commit Hash**: `b9fe3b0`  
> **Thời điểm xuất log**: `2026-11-16T15:12:46.123Z`  
> **Nguyên tắc**: Mọi con số trong nhật ký này được ghi **tự động** từ output thực tế của script train/eval. Không hard-code, không sửa số tay.

---

## 📋 1. BẢNG TỔNG HỢP CHỈ SỐ AUDIT TÁI LẬP THỰC TẾ (6 MODULES)

| STT | Mô hình AI Tự Train | Tập Dữ Liệu Train / Test | Kích thước Mẫu ($n$) | Chỉ số Kiểm thử Thực tế | 95% Wilson Score CI | Ghi chú & Trạng thái |
|---|---|---|---|---|---|---|
| **1** | **ChemLab Risk Classifier** | `risk-dataset.json` + `independent_eval_135.json` (5-Fold CV) | Tập tổng hợp thứ hai (nhiễu script, $n=135$) | **95.56%** 5-Fold Acc<br>(Macro F1: **95.58%**)<br>**95.00%** Edge Acc | **[90.6%, 98.0%]**<br>Edge: [76.4%, 99.1%] | **0 False Negatives**. Monotonic Trend (25.33% < 55.64% < 73.23%) $\rightarrow$ PASS. |
| **2** | **Physics Diagnostic kNN** | `attempts.json` + `independent_eval_135.json` (5-Fold CV) | Tập tổng hợp thứ hai (nhiễu script, $n=135$) | **96.30%** 5-Fold Acc<br>(Macro F1: **96.30%**)<br>**86.67%** Combo Acc | **[91.6%, 98.4%]**<br>Edge: [62.1%, 96.3%] | k-NN ($k=5$) Z-Score StandardScaler $\rightarrow$ PASS. |
| **3** | **Javit Intent Classifier** | `intent-samples.json` + `independent_eval_140.json` (5-Fold CV) | Tập tổng hợp thứ hai (nhiễu script, $n=140$) | **88.57%** 5-Fold Acc<br>(Macro F1: **88.33%**)<br>(97.50% Raw) | **[82.2%, 92.8%]** | Đánh giá 5-Fold CV trên tập tổng hợp thứ hai; ngưỡng tin cậy 0.65. |
| **4** | **Math IRT Engine** | 10 Benchmark Items | Benchmark $n=10$ | **40.00%** Hits | [16.8%, 68.7%] | Vùng phát triển $P(\text{correct}) \in [60\%, 75\%]$. *Cỡ mẫu $n=10$ mang tính minh họa.* |
| **5** | **Genetics Bayesian Reasoner** | 10 Benchmark Cases | Benchmark $n=10$ | **10/10** Pass | [72.2%, 100.0%] | 10/10 Mendel Verification cases. *Cỡ mẫu $n=10$ mang tính minh họa.* |
| **6** | **Multilingual TF-IDF RAG** | `stem-corpus.json`<br>(303 Chunks, 9061 Tokens) | Query $n=32$ | **96.88%** Top-1 Acc<br>**96.88%** Top-3 Hit | [84.3%, 99.4%] | Mean Cosine Sim: **75.90%**. Phủ 4 môn THPT GDPT 2018. |

---

## 🔬 2. CHI TIẾT KẾT QUẢ KIỂM THỬ TỪNG MODULE

### 2.1 Module 1: ChemLab Risk Classifier (Hybrid Softmax NN + Circuit Breaker)
- **Tập Train**: 144 mẫu | **Tập Test**: 36 mẫu | **Tập Ca biên**: 20 mẫu.
- **Hàm mất mát (Cross-Entropy Loss)**:
  - Epoch 1: Loss = 1.095329
  - Epoch 100: Loss = 0.337273
  - Epoch 500: Loss = 0.255697
  - Epoch 1000: Loss = 0.224431
- **Đánh giá Đơn điệu (Monotonic Trend)**:
  - Mean RiskScore (Thực tế An toàn): **25.33%**
  - Mean RiskScore (Thực tế Cảnh báo): **55.64%**
  - Mean RiskScore (Thực tế Nguy hiểm): **73.23%**
  - Trạng thái: **ĐÁP ỨNG CHUẨN KHOA HỌC TĂNG ĐƠN ĐIỆU**

---

### 2.2 Module 2: Physics Diagnostic kNN (StandardScaler Z-Score)
- **Tập Train**: 96 mẫu | **Tập Test**: 24 mẫu | **Tập Ca biên**: 15 mẫu.
- **k-NN Hyperparameter**: $k = 5$.
- **Tỷ lệ phát hiện Đa lỗi hỗn hợp (Multi-Error)**: **86.67%** ($n=15, 95% CI: [62.1%, 96.3%]).

---

### 2.3 Module 3: Javit Intent Classifier (Naive Bayes + Text Normalizer)
- **Tập Train**: 392 mẫu | **Tập Unseen Test**: 40 mẫu.
- **Tập đánh giá tổng hợp**: Đánh giá 5-Fold CV trên tập tổng hợp thứ hai `independent_eval_140.json` (ghi nhận có một số mẫu tương đồng giữa tập train và tập test trong dữ liệu do nhóm biên soạn theo báo cáo audit).
- **Chênh lệch trước và sau Normalization**:
  - Accuracy chưa chuẩn hóa (Raw Teencode): **97.50%** ($n=40, 95% CI: [87.1%, 99.6%])
  - Accuracy sau chuẩn hóa (Text Normalizer): **100.00%** ($n=40, 95% CI: [91.2%, 100.0%])

---

### 2.4 Module 4: Genetics Bayesian Reasoner (10 Unit Test Cases)
- **Cỡ mẫu**: $n=10$ test cases di truyền Mendel.
- **Chi tiết kết quả từng Test Case**:
  - Case 1: **Monohybrid (Aa x Aa)** | Target: `0.75` | Calculated: `0.75` | Trạng thái: **PASS**
  - Case 2: **Dihybrid (AaBb x AaBb)** | Target: `0.5625` | Calculated: `0.5625` | Trạng thái: **PASS**
  - Case 3: **Trihybrid (AaBbDd x AaBbDd)** | Target: `0.421875` | Calculated: `0.421875` | Trạng thái: **PASS**
  - Case 4: **Single Locus Homozygous (AA x aa)** | Target: `1` | Calculated: `1` | Trạng thái: **PASS**
  - Case 5: **Testcross (Aa x aa)** | Target: `0.5` | Calculated: `0.5` | Trạng thái: **PASS**
  - Case 6: **Pure Breeding Dihybrid (AABB x aabb)** | Target: `1` | Calculated: `1` | Trạng thái: **PASS**
  - Case 7: **Heterozygous Cross (Aabb x aaBb)** | Target: `0.25` | Calculated: `0.25` | Trạng thái: **PASS**
  - Case 8: **Tetrahybrid (4 Loci AaBbCcDd x AaBbCcDd)** | Target: `0.31640625` | Calculated: `0.31640625` | Trạng thái: **PASS**
  - Case 9: **Dominant Pure Cross (AABBCC x AABBCC)** | Target: `1` | Calculated: `1` | Trạng thái: **PASS**
  - Case 10: **Recessive Pure Cross (aabbcc x aabbcc)** | Target: `0` | Calculated: `0` | Trạng thái: **PASS**

---

### 2.5 Module 5: Math Adaptive IRT Engine (10 Benchmark Items)
- **Cỡ mẫu**: $n=10$ benchmark items.
- **Chi tiết kết quả từng Benchmark Item**:
  - Item 1: **Thí sinh Đồng (1200) vs Bài Dễ (1000)** | $\theta=-0.750, b=-1.250 \rightarrow P(\text{correct})=70.06%$ | Vùng thích ứng [60%, 75%]: **MATCH**
  - Item 2: **Thí sinh Đồng (1200) vs Bài Đồng (1200)** | $\theta=-0.750, b=-0.750 \rightarrow P(\text{correct})=50.00%$ | Vùng thích ứng [60%, 75%]: **OUTSIDE**
  - Item 3: **Thí sinh Vàng (1500) vs Bài Vàng vỡ lòng (1350)** | $\theta=0.000, b=-0.375 \rightarrow P(\text{correct})=65.42%$ | Vùng thích ứng [60%, 75%]: **MATCH**
  - Item 4: **Thí sinh Vàng (1500) vs Bài Vàng chuẩn (1500)** | $\theta=0.000, b=0.000 \rightarrow P(\text{correct})=50.00%$ | Vùng thích ứng [60%, 75%]: **OUTSIDE**
  - Item 5: **Thí sinh Kim Cương (1800) vs Bài Kim Cương (1650)** | $\theta=0.750, b=0.375 \rightarrow P(\text{correct})=65.42%$ | Vùng thích ứng [60%, 75%]: **MATCH**
  - Item 6: **Thí sinh Kim Cương (1800) vs Bài Kim Cương (1800)** | $\theta=0.750, b=0.750 \rightarrow P(\text{correct})=50.00%$ | Vùng thích ứng [60%, 75%]: **OUTSIDE**
  - Item 7: **Thí sinh Cao Thủ (2100) vs Bài Cao Thủ (1950)** | $\theta=1.500, b=1.125 \rightarrow P(\text{correct})=65.42%$ | Vùng thích ứng [60%, 75%]: **MATCH**
  - Item 8: **Thí sinh Cao Thủ (2100) vs Bài Thách Đấu (2100)** | $\theta=1.500, b=1.500 \rightarrow P(\text{correct})=50.00%$ | Vùng thích ứng [60%, 75%]: **OUTSIDE**
  - Item 9: **Thí sinh Vàng (1500) vs Bài Khó Kim Cương (1800)** | $\theta=0.000, b=0.750 \rightarrow P(\text{correct})=21.84%$ | Vùng thích ứng [60%, 75%]: **OUTSIDE**
  - Item 10: **Thí sinh Kim Cương (1800) vs Bài Dễ Đồng (1200)** | $\theta=0.750, b=-0.750 \rightarrow P(\text{correct})=92.76%$ | Vùng thích ứng [60%, 75%]: **OUTSIDE**

---

### 2.6 Module 6: Multilingual TF-IDF RAG Service (32 Query Tests)
- **Kích thước Corpus**: 303 Chunks | **Kích thước Từ vựng (Vocabulary)**: **9061 N-Gram Tokens**.
- **Cỡ mẫu Query thử nghiệm**: $n=32$ queries.
- **Chi tiết kết quả từng Query**:
  - Query 1: "este hóa phản ứng giữa axit và ancol" $\rightarrow$ Top-1: [HOA] **Axit Cacboxylic (Phần 3)** (Score: 80.2%) | Match: **PASS**
  - Query 2: "dao động điều hòa con lắc đơn chu kỳ T" $\rightarrow$ Top-1: [LY] **Con lắc Lò xo và Con lắc Đơn (Phần 2)** (Score: 78.5%) | Match: **PASS**
  - Query 3: "tích phân nguyên hàm diện tích hình phẳng" $\rightarrow$ Top-1: [TOAN] **Ứng dụng Tích phân Tính Diện tích và Thể tích (Phần 1)** (Score: 78.4%) | Match: **PASS**
  - Query 4: "di truyền mendel quy luật phân ly độc lập ADN" $\rightarrow$ Top-1: [SINH] **Quy luật Di truyền Mendel và Liên kết Gen (Phần 2)** (Score: 99.6%) | Match: **PASS**
  - Query 5: "phản ứng trung hòa axit bazơ tạo muối nước" $\rightarrow$ Top-1: [HOA] **Axit Cacboxylic (Phần 2)** (Score: 41.1%) | Match: **PASS**
  - Query 6: "thấu kính hội tụ tiêu điểm ảnh thật" $\rightarrow$ Top-1: [LY] **Thấu kính Mỏng và Quang cụ (Phần 3)** (Score: 57.5%) | Match: **PASS**
  - Query 7: "đạo hàm cực trị hàm số bậc ba" $\rightarrow$ Top-1: [TOAN] **Tính Đơn biến và Cực trị Hàm số (Phần 3)** (Score: 83.5%) | Match: **PASS**
  - Query 8: "đột biến gen thay thế cặp nucleotit" $\rightarrow$ Top-1: [SINH] **Đột biến Gen và Đột biến Nhiễm sắc thể (Phần 1)** (Score: 91.5%) | Match: **PASS**
  - Query 9: "cân bằng le chatelier chuyển dịch nhiệt độ" $\rightarrow$ Top-1: [HOA] **Trạng thái Cân bằng Hóa học (Phần 3)** (Score: 76.9%) | Match: **PASS**
  - Query 10: "quang phổ vạch phát xạ nguyên tử hydro" $\rightarrow$ Top-1: [HOA] **Cấu tạo Nguyên tử và Điện tích Hạt nhân (Phần 3)** (Score: 18.7%) | Match: **FAIL**
  - Query 11: "phương trình mặt phẳng oxyz véc tơ pháp tuyến" $\rightarrow$ Top-1: [TOAN] **Hình học Oxyz - Mặt phẳng và Đường thẳng (Phần 1)** (Score: 47.8%) | Match: **PASS**
  - Query 12: "Hardy Weinberg tần số alen quần thể" $\rightarrow$ Top-1: [SINH] **Di truyền Quần thể và Hardy-Weinberg (Phần 1)** (Score: 77.3%) | Match: **PASS**
  - Query 13: "cấu hình electron nguyên tử phân lớp s p d f" $\rightarrow$ Top-1: [HOA] **Vỏ Electron và Cấu hình Electron (Phần 1)** (Score: 71.5%) | Match: **PASS**
  - Query 14: "định luật Coulomb lực hút giữa hai điện tích điểm" $\rightarrow$ Top-1: [LY] **Điện trường và Định luật Coulomb (Phần 1)** (Score: 85.1%) | Match: **PASS**
  - Query 15: "hàm số bậc hai đồ thị parabol đỉnh I" $\rightarrow$ Top-1: [TOAN] **Hàm số Bậc hai và Parabol (Phần 1)** (Score: 100.0%) | Match: **PASS**
  - Query 16: "tế bào nhân sơ vùng nhân ADN dạng vòng" $\rightarrow$ Top-1: [SINH] **Cấu trúc Tế bào Nhân sơ và Nhân thực (Phần 1)** (Score: 100.0%) | Match: **PASS**
  - Query 17: "axit nitric HNO3 tính oxi hóa mạnh kim loại" $\rightarrow$ Top-1: [HOA] **Axit Nitric và Phản ứng Oxi hóa Mạnh (Phần 1)** (Score: 91.6%) | Match: **PASS**
  - Query 18: "hiện tượng cảm ứng điện từ suất điện động Lenz" $\rightarrow$ Top-1: [LY] **Hiện tượng Cảm ứng Điện từ (Phần 2)** (Score: 73.0%) | Match: **PASS**
  - Query 19: "cấp số cộng số hạng tổng quát công sai d" $\rightarrow$ Top-1: [TOAN] **Dãy số, Cấp số Cộng và Cấp số Nhân (Phần 1)** (Score: 74.5%) | Match: **PASS**
  - Query 20: "quang hợp C3 C4 CAM chu trình calvin" $\rightarrow$ Top-1: [SINH] **Quang hợp C3, C4 và CAM ở Thực vật (Phần 1)** (Score: 66.4%) | Match: **PASS**
  - Query 21: "phản ứng xà phòng hóa este triglixerit glixerol" $\rightarrow$ Top-1: [HOA] **Este và Phản ứng Xà phòng hóa (Phần 2)** (Score: 85.5%) | Match: **PASS**
  - Query 22: "dòng điện xoay chiều mạch RLC nối tiếp cộng hưởng" $\rightarrow$ Top-1: [LY] **Dòng điện Xoay chiều Mạch RLC (Phần 2)** (Score: 66.1%) | Match: **PASS**
  - Query 23: "phương trình mũ logarit tập nghiệm" $\rightarrow$ Top-1: [TOAN] **Phương trình và Bất phương trình Mũ Logarit (Phần 1)** (Score: 57.5%) | Match: **PASS**
  - Query 24: "mã di truyền bộ ba codon mARN dịch mã protein" $\rightarrow$ Top-1: [SINH] **Cấu trúc ADN và Mã Di truyền (Phần 2)** (Score: 67.8%) | Match: **PASS**
  - Query 25: "dãy điện hóa kim loại tính khử cation tính oxi hóa" $\rightarrow$ Top-1: [HOA] **Đại cương Kim loại và Dãy Điện hóa (Phần 3)** (Score: 97.9%) | Match: **PASS**
  - Query 26: "sóng điện từ mạch LC tần số góc bước sóng" $\rightarrow$ Top-1: [LY] **Sóng Điện từ và Mạch LC (Phần 2)** (Score: 80.9%) | Match: **PASS**
  - Query 27: "tọa độ điểm đường tròn Oxy bán kính R" $\rightarrow$ Top-1: [TOAN] **Phương trình Đường tròn Oxy (Phần 3)** (Score: 63.6%) | Match: **PASS**
  - Query 28: "enzyme chất xúc tác sinh học giảm năng lượng hoạt hóa" $\rightarrow$ Top-1: [SINH] **Enzyme và Chuyển hóa Năng lượng (Phần 1)** (Score: 100.0%) | Match: **PASS**
  - Query 29: "tốc độ phản ứng hóa học nồng độ nhiệt độ chất xúc tác" $\rightarrow$ Top-1: [HOA] **Tốc độ Phản ứng Hóa học (Phần 2)** (Score: 100.0%) | Match: **PASS**
  - Query 30: "định luật bảo toàn động lượng hệ kín va chạm" $\rightarrow$ Top-1: [LY] **Động lượng và Định luật Bảo toàn Động lượng (Phần 3)** (Score: 88.7%) | Match: **PASS**
  - Query 31: "số phức phần thực phần ảo môđun liên hợp" $\rightarrow$ Top-1: [TOAN] **Số phức và Các phép toán (Phần 1)** (Score: 69.5%) | Match: **PASS**
  - Query 32: "operon lac vi khuẩn E coli protein chế tiết" $\rightarrow$ Top-1: [SINH] **Dịch mã và Operon Lac (Phần 3)** (Score: 58.2%) | Match: **PASS**

---

## 🛠️ 3. LỆNH TÁI LẬP KẾT QUẢ DÀNH CHO BAN GIÁM KHẢO

Giám khảo hoặc nhà phát triển có thể kiểm chứng lại toàn bộ các con số trên bằng cách thực thi duy nhất lệnh sau trong Terminal:

```bash
node src/ai-training/scripts/run-all-audits.js
```

Toàn bộ script sẽ chạy lại toán học, xuất log tự động và cập nhật lại file `TRAINING_LOG.md` theo thời gian thực.

---

## 🔬 4. PHỤ LỤC AUDIT BỔ SUNG: STRATIFIED 5-FOLD CV & SO SÁNH SÒNG PHẲNG

### 4.1 Bảng So Sánh: Quy Tắc Xác Định vs Machine Learning vs Kiến Trúc Lai STEM HUB
| Tiêu Chí So Sánh | Quy Tắc Xác Định (Rule-Based) | Học Máy (ML Thống Kê) | **Kiến Trúc Lai STEM HUB (Hybrid)** |
|---|---|---|---|
| **Bản chất giải quyết** | Giải quyết **Bài toán thuận** & danh mục cấm cố định. | Giải quyết **Bài toán suy diễn ngược** từ số liệu thực nghiệm có nhiễu thống kê và ngôn ngữ tự nhiên phi cấu trúc. | **Tầng 1 (Rule-Based ngắt cứng) + Tầng 2 (ML xác suất mềm) + Tầng 3 (LLM RAG Socratic).** |
| **Độ chính xác thực tế** | Quyết định tất định theo ngưỡng thiết lập. | **89% - 96%** (phản ánh trung thực nhiễu đo đạc đời thường, không làm đẹp số). | Ngắt mạch bảo vệ (Circuit Breaker) kết hợp gợi mở sư phạm (ML/RAG). |
| **Khả năng chịu nhiễu** | Kém / Dễ gãy nếu sai khác định dạng hoặc gặp ca chưa định nghĩa. | Tốt, tự động thích ứng qua hàm khoảng cách và phân phối xác suất. | Tối ưu: Bộ chuẩn hóa từ vựng + ML phân loại + Bộ ngắt khẩn cấp. |

### 4.2 Chi Tiết Kết Quả Stratified 5-Fold Cross-Validation (Tập tổng hợp thứ hai n=135, cùng hàm luật sinh nhãn)
- **ChemLab Risk Classifier**: Fold Accuracies: [88.89%, 100%, 92.59%, 96.3%, 100%] | Trung bình: **95.56%** | Macro F1: **95.58%** | 95% Wilson CI: **[90.6%, 98.0%]** ($n=135$)
- **Physics Diagnostic kNN**: Fold Accuracies: [96.3%, 96.3%, 100%, 92.59%, 96.3%] | Trung bình: **96.30%** | Macro F1: **96.30%** | 95% Wilson CI: **[91.6%, 98.4%]** ($n=135$)
- **Javit Intent Classifier**: Fold Accuracies: [89.29%, 92.86%, 92.86%, 89.29%, 78.57%] | Trung bình: **88.57%** | Macro F1: **88.33%** | 95% Wilson CI: **[82.2%, 92.8%]** ($n=140$)

*(Chi tiết đầy đủ ma trận nhầm lẫn và bảng Precision/Recall từng lớp đã được lưu tại `EXTENDED_ROBUST_EVALUATION_REPORT.md`)*.

---

## 📊 5. NGHIÊN CỨU ĐỐI CHỨNG "CÓ RAG vs. KHÔNG CÓ RAG" (MÔ PHỎNG HEURISTIC, KHÔNG PHẢI ĐO TRÊN LLM THẬT)
> ⚠️ **LƯU Ý MINH BẠCH**: Bảng đối chứng dưới đây là **kết quả mô phỏng suy nghiệm (heuristic simulation)** trên 80 ca kiểm thử mẫu, **KHÔNG PHẢI số liệu đo lường trực tiếp trên Gemini LLM thật** (chưa có log thô API request/response).  
> **Điều kiện so sánh**: Điều kiện Không RAG (Vanilla LLM) không có cơ chế phát hiện từ chối tự nhiên; các mức chênh lệch được tính bằng **điểm phần trăm (pp)** thay vì phần trăm tăng trưởng tương đối.  
> **Tập dữ liệu**: 50 câu hỏi khó/bẫy theo chuẩn GDPT 2018 + 30 câu hỏi ngoài phạm vi (Out-of-Scope). Tổng cộng $n=80$ ca.  
> **File dữ liệu**: `src/ai-training/datasets/rag_ablation_benchmark.json`  
> **Script tái lập**: `node src/ai-training/scripts/run_rag_ablation_experiment.js`

### 5.1 Bảng Số Liệu Đối Chứng Mô Phỏng Suy Nghiệm

| Chỉ Số Đánh Giá | Không Tra Cứu Ngữ Liệu<br>(Mô phỏng Vanilla LLM) | Có Tra Cứu Ngữ Liệu<br>(Mô phỏng RAG + Abstention) | Chênh Lệch Điểm Phần Trăm (pp) | 95% Wilson Score CI (Có RAG vs Không RAG) |
|---|:---:|:---:|:---:|:---:|
| **(a) Độ chuẩn xác nội dung**<br>*(Đánh giá trên 50 câu GDPT 2018)* | **72%** (36/50) | **92%** (46/50) | 🟢 **+20.0 pp** (Mô phỏng) | Có RAG: **[81.2%, 96.8%]**<br>Không RAG: [58.3%, 82.5%] |
| **(b) Tỷ lệ ảo giác (Hallucination)**<br>*(Bịa công thức, sai hằng số)* | **28%** (14/50) | **4%** (2/50) | 🟢 **-24.0 pp** (Mô phỏng) | Có RAG: **[1.1%, 13.5%]**<br>Không RAG: [17.5%, 41.7%] |
| **(c) Tỷ lệ trích dẫn ngữ liệu hệ thống**<br>*(Gắn mã ID đoạn ngữ liệu)* | **10%** (5/50) | **94%** (47/50) | 🟢 **+84.0 pp** (Mô phỏng) | Có RAG: **[83.8%, 97.9%]**<br>Không RAG: [4.3%, 21.4%] |
| **(d) Tỷ lệ cảnh báo ngoài phạm vi (Abstention)**<br>*(Đánh giá trên 30 câu Out-of-Scope)* | **0%** (0/30)<br>*(Không có cơ chế từ chối)* | **96.67%** (29/30)<br>*(Cảnh báo ngoài phạm vi)* | Hệ quả trực tiếp của ngưỡng cosine 0.30 (Mô phỏng, không phải thành tích thuật toán) | Có RAG: **[83.3%, 99.4%]**<br>Không RAG: [0%, 11.4%] |

### 5.2 Cơ Chế Tính Điểm Tương Quan Ngữ Liệu
Hệ thống kết hợp tương đồng Cosine TF-IDF và bao phủ từ khóa tại `src/lib/ragService.js`:
- **Ngưỡng kích hoạt**: $S_{\text{grounding}} \ge 0.30$ (tương ứng điểm Cosine TF-IDF thô $\ge 0.18$) nạp đoạn ngữ liệu vào prompt kèm nhãn `[sourceType: team_summary]`.
- **Nếu $S_{\text{grounding}} < 0.30$**: Hệ thống hiển thị cảnh báo câu hỏi ngoài phạm vi kho ngữ liệu tóm tắt hiện có, tạm dừng trả lời tự động để tránh sai lệch thông tin.

---

## 🎯 6. ĐÁNH GIÁ CHUẨN XÁC RAG MỨC ĐỘ CHUNK VÀ CƠ CHẾ TỪ CHỐI (ABSTENTION EVALUATION)

> 🔬 **Dữ liệu thực nghiệm thực tế**: Được sinh tự động từ script `src/ai-training/scripts/evaluate-rag-chunk-level.js`, đo đạc trên **Tập Dev (Dev Set)** gồm 60 câu In-Scope và 20 câu Out-of-Scope (SHA-256: `1ed59070c66731730e55775aa5316e57b4ab4cdf0dd07d6b47a068756fe94f5f`), lưu trữ kết quả tại `reports/rag_chunk_benchmark_results.json`.

### 6.1 Hiệu Năng Truy Xuất Sau Cải Tiến Thuật Toán (Variant 2: Unaccented Auxiliary Matching)
| Chỉ số Đo Đạc | Trước Cải Tiến (TF-IDF Thô) | Sau Cải Tiến (Variant 2) | Tỷ Lệ Hiện Tại (%) | Khoảng Tin Cậy 95% Wilson CI | Bản Chất Kỹ Thuật & Đánh Giá |
|---|:---:|:---:|:---:|:---:|---|
| **Recall@1** (In-Scope) | 16/60 (26.67%) | 20/60 | **33.33%** | [22.7%, 45.9%] | Chunk chuẩn nằm ở vị trí xếp hạng 1 (+6.66 pp) |
| **Recall@3** (In-Scope) | 22/60 (36.67%) | 29/60 | **48.33%** | [36.2%, 60.7%] | Chunk chuẩn nằm trong Top-3 kết quả (+11.66 pp) |
| **Recall@5** (In-Scope) | 26/60 (43.33%) | 34/60 | **56.67%** | [44.1%, 68.4%] | Chunk chuẩn nằm trong Top-5 kết quả (+13.34 pp) |
| **Mean Reciprocal Rank (MRR)** | 0.3225 | **0.4164** | - | - | Điểm xếp hạng nghịch đảo trung bình (+0.0939) |

### 6.2 Phân Phối 3 Tầng Căn Cứ & Cơ Chế Từ Chối (Tri-Band Grounding & Abstention)
Hệ thống phân tầng mức độ tin cậy của căn cứ theo 3 dải điểm minh bạch:
- **Có căn cứ vững chắc (Grounded)**: $S \ge 0.30$
- **Căn cứ yếu (Weak Grounding)**: $0.15 \le S < 0.30$ (kèm khuyến cáo tra cứu thêm SGK)
- **Không có căn cứ / Ngoài phạm vi (Ungrounded / Abstention)**: $S < 0.15$

| Phân Nhóm Dữ Liệu | Grounded ($S \ge 0.30$) | Weak ($0.15 \le S < 0.30$) | Ungrounded ($S < 0.15$) | Tổng Số Mẫu | Tỷ Lệ Chấp Nhận Hợp Lệ (G + W) |
|---|:---:|:---:|:---:|:---:|:---:|
| **In-Scope Queries** (GDPT 2018) | 14/60 (23.3%) | 44/60 (73.3%) | 2/60 (3.3%) | 60 | **58/60 (96.67%)** |
| **Out-of-Scope Queries** (Ngoại biên) | **0/20 (0.0%)** | 9/20 (45.0%) | 11/20 (55.0%) | 20 | 9/20 (45.0%) |

#### Hệ quả kỹ thuật thực tế (Thừa nhận trung thực):
1. **73.3% (44/60) câu in-scope rơi vào nhóm "Căn cứ yếu"**: Do câu hỏi tự nhiên của học sinh (gõ không dấu, câu ngắn) chỉ khớp một phần thuật ngữ với ngữ liệu tóm tắt GDPT 2018, dẫn đến điểm tương quan chỉ đạt dải $[0.15, 0.30)$. Học sinh vẫn nhận được câu trả lời kèm khối khuyến cáo đối chiếu SGK.
2. **45.0% (9/20) câu ngoài phạm vi (OOS) không bị chặn ở ngưỡng 0.15**: Do các câu hỏi ngoại biên (toán cao cấp, y học đời sống, đồ gia dụng điện) có chứa từ vựng khoa học trùng lặp (ví dụ "điện", "nước", "toán học", "ion"), điểm số đạt dải $[0.15, 0.30)$. Các câu này vẫn được hệ thống trả lời kèm huy hiệu cảnh báo `Căn cứ yếu`, chứ không bị ngắt hoàn toàn như khi ở ngưỡng nghiêm ngặt 0.30.

### 6.3 So Sánh Tỷ Lệ Từ Chối Theo 2 Ngưỡng Quyết Định
| Ngưỡng Đánh Giá | True Rejection (Out-of-Scope) [Wilson CI] | False Rejection (In-Scope) [Wilson CI] | Nhận Xét Kỹ Thuật |
|---|:---:|:---:|---|
| **Ngưỡng Tối Thiểu ($S = 0.15$)** | 11/20 = **55.00%** [34.2%, 74.2%] | 2/60 = **3.33%** [0.9%, 11.4%] | Giảm thiểu tối đa việc từ chối nhầm học sinh (In-Scope False Rejection chỉ 3.33%) |
| **Ngưỡng Nghiêm Ngặt ($S = 0.30$)** | 20/20 = **100.00%** [83.9%, 100.0%] | 46/60 = **76.67%** [64.6%, 85.6%] | Chặn 20/20 câu ngoài phạm vi không bị gán nhãn "Có căn cứ" |

### 6.4 Nguồn Gốc và Tính Độc Lập của Dữ Liệu
1. **Nguồn gốc tập dữ liệu & Lựa chọn tham số**: Ngưỡng $0.15$ và tỷ lệ trọng số kết hợp $70/30$ ($70\%$ TF-IDF/BM25 $+ 30\%$ so khớp phụ không dấu) được chọn dựa trên kết quả thực nghiệm 7 biến thể truy xuất tại `src/ai-training/scripts/benchmark-retrieval-variants.js` **chạy trực tiếp trên Tập Dev (Dev Set)**. Hiện tại **chưa có tập Test độc lập** để kiểm chứng mù.
2. **Kỷ luật Dev/Test**: Nhóm tuân thủ nghiêm ngặt quy tắc KHÔNG dùng tập Dev làm bài kiểm tra cuối cùng. Tài liệu hướng dẫn xây dựng tập Test độc lập mới đã được công bố tại `docs/viet-tap-test.md` kèm công cụ khóa mã hóa `scripts/lock-test-dataset.js`. Hiện tại **chưa có tập test độc lập mới của con người** (trạng thái: Đang biên soạn, từ chối dùng LLM tự sinh giả mạo).
