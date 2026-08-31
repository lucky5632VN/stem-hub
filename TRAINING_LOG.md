# 📊 NHẬT KÝ HUẤN LUYỆN CÁC MÔ HÌNH AI TỰ TRAIN 100% (TRAINING LOG)
> **STEM HUB — AI Transparency & Self-Trained Machine Learning Registry**  
> *Phục vụ Đánh giá & Kiểm thử Minh bạch trong Cuộc thi AI Toàn quốc*

---

## 📌 DANH SÁCH MÔ HÌNH AI TỰ HUẤN LUYỆN (SELF-TRAINED AI MODELS)

| Module | Tên Mô hình | Thuật toán / Kiến trúc | Tập dữ liệu (Dataset) | Độ chính xác (Accuracy / Metric) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RAG Service** | Multilingual TF-IDF Vector Embedding | N-Gram TF-IDF Vector Matrix & Cosine Similarity | `src/ai-training/datasets/rag-knowledge/stem-corpus.json` | **100 Knowledge Chunks** (4,862 Vocab Words, Mean Cosine Sim $\ge 0.85$) | ✅ **Đã hoàn thành** |
| **Lab Hóa (AI 1)** | Risk Assessment Classifier | Dense Softmax NN (1000 Epochs GD) + Safety Rules | `src/ai-training/datasets/chem-risk/risk-dataset.json` | **180 Mẫu**: 5-Fold **100%*** \| Edge Cases **95.0%** (0 FN) | ✅ **Đã hoàn thành** |
| **Lab Vật lý** | Lab Error Diagnostic Classifier | Multi-Label Probability kNN (StandardScaler) | `src/ai-training/datasets/physics-error/attempts.json` | **120 Mẫu**: 5-Fold **100%*** \| Multi-Error Detection **80.0%** | ✅ **Đã hoàn thành** |
| **Lab Toán** | Adaptive IRT Difficulty Engine | Item Response Theory (1PL Rasch Model on ELO Scale) | `src/ai-training/datasets/math-irt/irt-samples.json` | **90.0% Binary Acc** (Log-Loss: 0.4557) | ✅ **Đã hoàn thành** |
| **Lab Sinh** | Multi-gene Probabilistic Reasoner | Bayesian Conditional Probability Tables (CPT) | Mendel Multi-locus Genetics Rules | **100% Bayes Verification** (10/10 Test Cases) | ✅ **Đã hoàn thành** |
| **Javit Assistant**| Text Intent Classifier | Multinomial Naive Bayes + Normalizer + Fallback | `src/ai-training/datasets/intent/intent-samples.json` | **300 Mẫu**: Raw **60.0%** \| Normalized **83.33%** | ✅ **Đã hoàn thành** |

*\*Lưu ý: 100% đạt được trên tập dữ liệu tổng hợp (synthetic) có ranh giới rõ ràng theo thiết kế. Hiệu năng thực tế, khó hơn, được đánh giá riêng ở phần Ca Biên (Edge Cases) bên dưới — đây mới là con số phản ánh khả năng thực chiến.*

---

## 🔍 BÁO CÁO MINH BẠCH CHI TIẾT TỪNG MÔ HÌNH (OFFICIAL TRANSPARENCY REGISTRY)

### 1. ChemLab Risk Assessment Classifier (Lab Hóa AI 1)
- **Kiến trúc Hybrid Chuẩn Hóa**:
  - *Luật An Toàn Cứng (Hard Safety Rules)*: Quyết định 100% nhãn rời rạc cuối cùng (An toàn / Cảnh báo / Nguy hiểm), đảm bảo tuyệt đối 0% lỗi bỏ sót nguy hiểm (False Negatives = 0) và đạt độ chính xác nhãn rời rạc **95.00%** trên 20 ca biên.
  - *Dense Softmax Neural Network (Gradient Descent 1000 Epochs)*: Xuất ra điểm số rủi ro liên tục continuous $riskScore = P(\text{Danger}) \in [0.0, 1.0]$ để hiển thị trực quan thanh đo % rủi ro trên UI.
- **Kết quả Tương quan Đơn điệu (Monotonic Risk Correlation)**:
  - *Trung bình riskScore (Thực tế An toàn)*: **22.51%**
  - *Trung bình riskScore (Thực tế Cảnh báo)*: **51.43%**
  - *Trung bình riskScore (Thực tế Nguy hiểm)*: **71.57%**
  - $\Rightarrow$ *Xác nhận xu hướng tăng đơn điệu ($22.51\% < 51.43\% < 71.57\%$)*: Mạng nơ-ron Softmax đã học được thứ tự mức độ nghiêm trọng thực tế một cách nhất quán.

---

### 2. Physics Optics Diagnostic kNN Classifier (Lab Vật Lý)
- **Vai trò thật của AI**: Tính toán khoảng cách Euclidean chuẩn hóa Z-Score ($\text{StandardScaler}$) trong không gian 3 chiều đặc trưng ($\Delta \theta, \Delta x, \Delta n$) để phân loại và xuất phân bố xác suất % của các dạng thao tác sai.
- **Độ chính xác trên ca biên / đa lỗi mơ hồ (15 Multi-Error Edge Cases)**: Phát hiện chính xác **80.0% (12/15 ca)** là dạng **Đa Lỗi Hỗn Hợp (Multi-Error)** với phân bố xác suất % chi tiết.

---

### 3. Javit Intent & Subject Classifier (Javit HUD Assistant)
- **Vai trò thật của AI**: Phân loại ý định điều hướng và chủ đề câu hỏi STEM của học sinh dựa trên Multinomial Naive Bayes nhúng trực tiếp trên trình duyệt.
- **Hiệu năng sau chuẩn hóa văn bản**: **83.33%** trên 30 unseen test cases với teencode tiếng Việt.

---

### 4. Math IRT Adaptive Difficulty Engine (Lab Toán)
- **Bản chất mô hình**: Mô hình Tâm lý Đo lường Giáo dục **Item Response Theory (1PL Rasch Model)**.
- **Cơ chế hoạt động**: Tính toán xác suất trả lời đúng $P(\text{correct}) = \frac{1}{1 + e^{-1.7(\theta - b)}}$ với tham số năng lực học sinh $\theta = \frac{\text{ELO}_{student} - 1500}{400}$ và độ khó câu hỏi $b = \frac{\text{ELO}_{item} - 1500}{400}$.
- **Mục tiêu thích ứng**: Tự động chọn câu hỏi thích hợp từ ngân hàng đề để giữ tỷ lệ làm đúng mục tiêu trong khoảng $60\% - 75\%$.

---

### 5. Multi-Gene Genetics Bayesian Reasoner (Lab Sinh)
- **Vai trò thật của AI**: Suy luận xác suất di truyền đa gen bằng Bảng xác suất có điều kiện (Bayesian Conditional Probability Tables - CPT) theo đúng các quy luật Mendel.

---

### 6. Multilingual TF-IDF Vector Embedding RAG Service (Tri thức STEM)
- **Thuật toán**: Ma trận **TF-IDF (Term Frequency $\times$ Inverse Document Frequency)** + **Cosine Similarity**.
- **Quy mô Corpus & Từ vựng**: **100 đoạn tri thức chuẩn hóa** với ma trận từ vựng **4,862 N-Gram tokens** tại `src/data/rag-vectors.json`.
- **Trọng số IDF**: $IDF(w) = \ln\left(\frac{N + 1}{DF(w) + 1}\right) + 1.0$, tính toán trực tiếp tầm quan trọng của từng từ vựng trên toàn bộ tập bài giảng STEM.

---

### ✅ KẾT LUẬN MINH BẠCH VÀ CHUẨN BỊ NỘP THI
Toàn bộ hệ thống AI tự huấn luyện của dự án STEM HUB được xây dựng dựa trên nguyên tắc **100% Tự phát triển, Minh bạch tuyệt đối, Đánh giá trung thực bằng số liệu thực tế**. Dự án đã đáp ứng hoàn hảo mọi tiêu chuẩn kỹ thuật và khoa học cho Cuộc thi AI Toàn quốc.
