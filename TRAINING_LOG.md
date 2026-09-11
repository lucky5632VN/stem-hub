# 📑 NHẬT KÝ HUẤN LUYỆN & AUDIT TÁI LẬP SỐ LIỆU AI (TRAINING LOG)
> **Trạng thái**: Tái lập tự động 100% khi thực thi `node src/ai-training/scripts/run-all-audits.js`  
> **Git Commit Hash**: `0131e40`  
> **Thời điểm xuất log**: `2026-09-10T13:48:40.661Z`  
> **Nguyên tắc**: Mọi con số trong nhật ký này được ghi **tự động** từ output thực tế của script train/eval. Không hard-code, không sửa số tay.

---

## 📋 1. BẢNG TỔNG HỢP CHỈ SỐ AUDIT TÁI LẬP THỰC TẾ (6 MODULES)

| STT | Mô hình AI Tự Train | Tập Dữ Liệu Train / Test | Kích thước Mẫu ($n$) | Chỉ số Kiểm thử Thực tế | 95% Wilson Score CI | Ghi chú & Trạng thái |
|---|---|---|---|---|---|---|
| **1** | **ChemLab Risk Classifier** | `risk-dataset.json`<br>(144 Train / 36 Test) + 20 Edge | Test $n=36$<br>Edge $n=20$ | **100.00%** Test Acc<br>**95.00%** Edge Acc | Test: [90.4%, 100.0%]<br>Edge: [76.4%, 99.1%] | **0 False Negatives**. Monotonic Trend (25.33% < 55.64% < 73.23%) $\rightarrow$ PASS. |
| **2** | **Physics Diagnostic kNN** | `attempts.json`<br>(96 Train / 24 Test) + 15 Edge | Test $n=24$<br>Edge $n=15$ | **100.00%** Test Acc<br>**86.67%** Combo Acc | Test: [86.2%, 100.0%]<br>Edge: [62.1%, 96.3%] | k-NN ($k=5$) Z-Score StandardScaler $\rightarrow$ PASS. |
| **3** | **Javit Intent Classifier** | `intent-samples.json`<br>(392 Train + 40 Unseen Test) | Test $n=40$ | **100.00%** Normalized<br>(97.50% Raw) | Test: [91.2%, 100.0%] | 0% Overlap giữa Train & Unseen. Threshold = 0.65. Phủ đủ 7 lớp ý định (bao gồm Chitchat). |
| **4** | **Math IRT Engine** | 10 Benchmark Items | Benchmark $n=10$ | **40.00%** Hits | [16.8%, 68.7%] | Vùng phát triển $P(\text{correct}) \in [60\%, 75\%]$. *Cỡ mẫu $n=10$ mang tính minh họa.* |
| **5** | **Genetics Bayesian Reasoner** | 10 Benchmark Cases | Benchmark $n=10$ | **100.00%** Pass | [72.2%, 100.0%] | 100% Mendel Verification (10/10 cases). *Cỡ mẫu $n=10$ mang tính minh họa.* |
| **6** | **Multilingual TF-IDF RAG** | `stem-corpus.json`<br>(303 Chunks, 9061 Tokens) | Query $n=32$ | **96.88%** Top-1 Acc<br>**100.00%** Top-3 Hit | [84.3%, 99.4%] | Mean Cosine Sim: **44.14%**. Phủ 4 môn THPT GDPT 2018. |

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
- **Kiểm tra Trùng lặp (Train vs Unseen)**: **0 câu trùng** (Xác nhận tập Unseen độc lập 100%).
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
  - Query 1: "este hóa phản ứng giữa axit và ancol" $\rightarrow$ Top-1: [HOA] **Axit Cacboxylic (Phần 3)** (Score: 38.6%) | Match: **PASS**
  - Query 2: "dao động điều hòa con lắc đơn chu kỳ T" $\rightarrow$ Top-1: [LY] **Con lắc Lò xo và Con lắc Đơn (Phần 2)** (Score: 51.1%) | Match: **PASS**
  - Query 3: "tích phân nguyên hàm diện tích hình phẳng" $\rightarrow$ Top-1: [TOAN] **Ứng dụng Tích phân Tính Diện tích và Thể tích (Phần 1)** (Score: 43.7%) | Match: **PASS**
  - Query 4: "di truyền mendel quy luật phân ly độc lập ADN" $\rightarrow$ Top-1: [SINH] **Quy luật Di truyền Mendel và Liên kết Gen (Phần 2)** (Score: 55.8%) | Match: **PASS**
  - Query 5: "phản ứng trung hòa axit bazơ tạo muối nước" $\rightarrow$ Top-1: [HOA] **Axit Cacboxylic (Phần 2)** (Score: 22.7%) | Match: **PASS**
  - Query 6: "thấu kính hội tụ tiêu điểm ảnh thật" $\rightarrow$ Top-1: [LY] **Thấu kính Mỏng và Quang cụ (Phần 3)** (Score: 30.8%) | Match: **PASS**
  - Query 7: "đạo hàm cực trị hàm số bậc ba" $\rightarrow$ Top-1: [TOAN] **Tính Đơn biến và Cực trị Hàm số (Phần 3)** (Score: 45.3%) | Match: **PASS**
  - Query 8: "đột biến gen thay thế cặp nucleotit" $\rightarrow$ Top-1: [SINH] **Đột biến Gen và Đột biến Nhiễm sắc thể (Phần 1)** (Score: 55.5%) | Match: **PASS**
  - Query 9: "cân bằng le chatelier chuyển dịch nhiệt độ" $\rightarrow$ Top-1: [HOA] **Trạng thái Cân bằng Hóa học (Phần 3)** (Score: 42.3%) | Match: **PASS**
  - Query 10: "quang phổ vạch phát xạ nguyên tử hydro" $\rightarrow$ Top-1: [HOA] **Cấu tạo Nguyên tử và Điện tích Hạt nhân (Phần 3)** (Score: 10.7%) | Match: **FAIL**
  - Query 11: "phương trình mặt phẳng oxyz véc tơ pháp tuyến" $\rightarrow$ Top-1: [TOAN] **Hình học Oxyz - Mặt phẳng và Đường thẳng (Phần 1)** (Score: 24.3%) | Match: **PASS**
  - Query 12: "Hardy Weinberg tần số alen quần thể" $\rightarrow$ Top-1: [SINH] **Di truyền Quần thể và Hardy-Weinberg (Phần 1)** (Score: 43.5%) | Match: **PASS**
  - Query 13: "cấu hình electron nguyên tử phân lớp s p d f" $\rightarrow$ Top-1: [HOA] **Vỏ Electron và Cấu hình Electron (Phần 1)** (Score: 35.3%) | Match: **PASS**
  - Query 14: "định luật Coulomb lực hút giữa hai điện tích điểm" $\rightarrow$ Top-1: [LY] **Điện trường và Định luật Coulomb (Phần 1)** (Score: 47.2%) | Match: **PASS**
  - Query 15: "hàm số bậc hai đồ thị parabol đỉnh I" $\rightarrow$ Top-1: [TOAN] **Hàm số Bậc hai và Parabol (Phần 1)** (Score: 62.9%) | Match: **PASS**
  - Query 16: "tế bào nhân sơ vùng nhân ADN dạng vòng" $\rightarrow$ Top-1: [SINH] **Cấu trúc Tế bào Nhân sơ và Nhân thực (Phần 1)** (Score: 66.6%) | Match: **PASS**
  - Query 17: "axit nitric HNO3 tính oxi hóa mạnh kim loại" $\rightarrow$ Top-1: [HOA] **Axit Nitric và Phản ứng Oxi hóa Mạnh (Phần 1)** (Score: 61.0%) | Match: **PASS**
  - Query 18: "hiện tượng cảm ứng điện từ suất điện động Lenz" $\rightarrow$ Top-1: [LY] **Hiện tượng Cảm ứng Điện từ (Phần 2)** (Score: 39.3%) | Match: **PASS**
  - Query 19: "cấp số cộng số hạng tổng quát công sai d" $\rightarrow$ Top-1: [TOAN] **Dãy số, Cấp số Cộng và Cấp số Nhân (Phần 1)** (Score: 47.1%) | Match: **PASS**
  - Query 20: "quang hợp C3 C4 CAM chu trình calvin" $\rightarrow$ Top-1: [SINH] **Quang hợp C3, C4 và CAM ở Thực vật (Phần 1)** (Score: 31.7%) | Match: **PASS**
  - Query 21: "phản ứng xà phòng hóa este triglixerit glixerol" $\rightarrow$ Top-1: [HOA] **Este và Phản ứng Xà phòng hóa (Phần 2)** (Score: 50.8%) | Match: **PASS**
  - Query 22: "dòng điện xoay chiều mạch RLC nối tiếp cộng hưởng" $\rightarrow$ Top-1: [LY] **Dòng điện Xoay chiều Mạch RLC (Phần 2)** (Score: 34.6%) | Match: **PASS**
  - Query 23: "phương trình mũ logarit tập nghiệm" $\rightarrow$ Top-1: [TOAN] **Phương trình và Bất phương trình Mũ Logarit (Phần 1)** (Score: 28.4%) | Match: **PASS**
  - Query 24: "mã di truyền bộ ba codon mARN dịch mã protein" $\rightarrow$ Top-1: [SINH] **Cấu trúc ADN và Mã Di truyền (Phần 2)** (Score: 44.7%) | Match: **PASS**
  - Query 25: "dãy điện hóa kim loại tính khử cation tính oxi hóa" $\rightarrow$ Top-1: [HOA] **Đại cương Kim loại và Dãy Điện hóa (Phần 3)** (Score: 55.8%) | Match: **PASS**
  - Query 26: "sóng điện từ mạch LC tần số góc bước sóng" $\rightarrow$ Top-1: [LY] **Sóng Điện từ và Mạch LC (Phần 2)** (Score: 53.5%) | Match: **PASS**
  - Query 27: "tọa độ điểm đường tròn Oxy bán kính R" $\rightarrow$ Top-1: [TOAN] **Phương trình Đường tròn Oxy (Phần 3)** (Score: 40.1%) | Match: **PASS**
  - Query 28: "enzyme chất xúc tác sinh học giảm năng lượng hoạt hóa" $\rightarrow$ Top-1: [SINH] **Enzyme và Chuyển hóa Năng lượng (Phần 1)** (Score: 58.1%) | Match: **PASS**
  - Query 29: "tốc độ phản ứng hóa học nồng độ nhiệt độ chất xúc tác" $\rightarrow$ Top-1: [HOA] **Tốc độ Phản ứng Hóa học (Phần 2)** (Score: 67.0%) | Match: **PASS**
  - Query 30: "định luật bảo toàn động lượng hệ kín va chạm" $\rightarrow$ Top-1: [LY] **Động lượng và Định luật Bảo toàn Động lượng (Phần 3)** (Score: 52.9%) | Match: **PASS**
  - Query 31: "số phức phần thực phần ảo môđun liên hợp" $\rightarrow$ Top-1: [TOAN] **Số phức và Các phép toán (Phần 1)** (Score: 39.0%) | Match: **PASS**
  - Query 32: "operon lac vi khuẩn E coli protein chế tiết" $\rightarrow$ Top-1: [SINH] **Dịch mã và Operon Lac (Phần 3)** (Score: 32.3%) | Match: **PASS**

---

## 🛠️ 3. LỆNH TÁI LẬP KẾT QUẢ DÀNH CHO BAN GIÁM KHẢO

Giám khảo hoặc nhà phát triển có thể kiểm chứng lại toàn bộ các con số trên bằng cách thực thi duy nhất lệnh sau trong Terminal:

```bash
node src/ai-training/scripts/run-all-audits.js
```

Toàn bộ script sẽ chạy lại toán học, xuất log tự động và cập nhật lại file `TRAINING_LOG.md` theo thời gian thực.
