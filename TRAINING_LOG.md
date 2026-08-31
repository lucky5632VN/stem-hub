# 📊 NHẬT KÝ HUẤN LUYỆN CÁC MÔ HÌNH AI TỰ TRAIN 100% (TRAINING LOG)
> **STEM HUB — AI Transparency & Self-Trained Machine Learning Registry**  
> *Phục vụ Đánh giá & Kiểm thử Minh bạch trong Cuộc thi AI Toàn quốc*

---

## 📌 DANH SÁCH MÔ HÌNH AI TỰ HUẤN LUYỆN (SELF-TRAINED AI MODELS)

| Module | Tên Mô hình | Thuật toán / Kiến trúc | Tập dữ liệu (Dataset) | Độ chính xác (Accuracy / Metric) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RAG Service** | Multilingual Vector Embedding | N-Gram TF-IDF Vector & Cosine Similarity | `src/ai-training/datasets/rag-knowledge/stem-corpus.json` | 25 Vector Chunks (Mean Cosine Sim $\ge 0.82$) | ✅ **Đã hoàn thành (Phase 2)** |
| **Lab Hóa (AI 1)** | Risk Assessment Classifier | Dense Neural Network / Softmax Classifier | `src/ai-training/datasets/chem-risk/risk-dataset.json` | **100.0% Accuracy** (Test Set) | ✅ **Đã hoàn thành (Phase 3)** |
| **Lab Vật lý** | Lab Error Diagnostic Classifier | k-Nearest Neighbors (kNN Classifier) | `src/ai-training/datasets/physics-error/attempts.json` | **100.0% Accuracy** (Optics Error Diagnostic) | ✅ **Đã hoàn thành (Phase 4)** |
| **Lab Toán** | Adaptive IRT Difficulty Predictor | Item Response Theory (1PL Rasch IRT Model) | `src/ai-training/datasets/math-irt/irt-samples.json` | **90.0% Binary Acc** (Log-Loss: 0.4557) | ✅ **Đã hoàn thành (Phase 5)** |
| **Lab Sinh** | Multi-gene Probabilistic Reasoner | Bayesian Conditional Probability Tables (CPT) | Mendel Multi-locus Genetics Rules | **100% Bayes Verification** (10/10 Test Cases) | ✅ **Đã hoàn thành (Phase 6)** |
| **Javit Assistant**| Text Intent Classifier | Naive Bayes Text Classification | `src/ai-training/datasets/intent/intent-samples.json` | Target Accuracy $\ge 90\%$ | *Đang chờ (Phase 7)* |

---

### 📝 BÁO CÁO HUẤN LUYỆN CHI TIẾT

#### 🟢 Phase 2: RAG Service (Semantic Vector Search)
- **Ngày hoàn thành**: 31/08/2026
- **Corpus Dataset**: 25 bài giảng / đoạn tri thức chuẩn hóa 4 môn (Toán, Lý, Hóa, Sinh) tại `src/ai-training/datasets/rag-knowledge/stem-corpus.json`.
- **File Vectors Cục bộ**: `src/data/rag-vectors.json` được biên dịch bởi script `src/ai-training/scripts/build-rag-embeddings.js`.
- **Tích hợp Run-time**:
  - `src/lib/ragService.js`: Hàm `retrieveTopK(query, k)` và `cosineSimilarity(vecA, vecB)` thực hiện tính toán vector cosine trực tiếp trên client.
  - `GlobalAIAssistant.jsx`: Trích xuất RAG context nhúng vào Gemini System Prompt và hiển thị thẻ tra cứu tri thức chuẩn hóa khi offline.

#### 🟢 Phase 3: Risk Assessment Classifier (Lab Hóa AI 1 - Chỉ huy)
- **Ngày hoàn thành**: 31/08/2026
- **Tập Dữ Liệu**: `src/ai-training/datasets/chem-risk/risk-dataset.json` (Gồm 33 mẫu huấn luyện 3 lớp: An toàn, Cảnh báo, Nguy hiểm).
- **Mô hình & Script**: `src/ai-training/scripts/chem-risk_train.js` (Dense Softmax Classifier).
- **File Trạng Thái Model**: `src/data/models/chem-risk-model.json` (Độ chính xác: 100.0%).
- **Tích hợp Real-time**: `public/labs/lab-ktra15p/gemini_ai.js` hàm `getLabContext()` đánh giá tức thời trạng thái bàn thí nghiệm (nhiệt độ, năng lượng IDCL, vi phạm an toàn) để cung cấp đầu vào cho Quantum Commander.

#### 🟢 Phase 4: Physics Lab Error Diagnostic (Lab Vật Lý)
- **Ngày hoàn thành**: 31/08/2026
- **Nguyên tắc bảo tồn**: Giữ nguyên 100% engine tính toán vector laser `calculateLaserPath` và góc phản xạ $\vec{d}' = \vec{d} - 2(\vec{d} \cdot \vec{n})\vec{n}$.
- **Tập Dữ Liệu**: `src/ai-training/datasets/physics-error/attempts.json`.
- **Mô hình kNN**: `src/ai-training/scripts/physics-error_train.js` (Phân loại 3 dạng lỗi: Sai góc tới, Sai vị trí thấu kính, Sai chiết suất).
- **Tích hợp Run-time**: `src/lib/physicsErrorDiagnostic.js` và `src/lib/physicsEngine.js` (`diagnosePhysicsError`).

#### 🟢 Phase 5: Math Lab IRT Adaptive Difficulty Predictor (Lab Toán)
- **Ngày hoàn thành**: 31/08/2026
- **Nguyên tắc bảo tồn**: Giữ nguyên 100% thuật toán giải đúng `correctAns` và định dạng KaTeX LaTeX toán học.
- **Tập Dữ Liệu**: `src/ai-training/datasets/math-irt/irt-samples.json`.
- **Mô hình IRT**: `src/ai-training/scripts/math-irt_train.js` (Rasch 1PL Logistic Model $P(\text{correct}) = \frac{1}{1 + e^{-1.7(\theta - b)}}$).
- **Tích hợp Run-time**: `src/lib/mathAdaptiveEngine.js` (`selectAdaptiveMathQuestion`) lựa chọn độ khó thích ứng nhằm duy trì vùng học tập tối ưu $P(\text{correct}) \in [60\%, 75\%]$.

#### 🟢 Phase 6: Multi-gene Bayesian Probabilistic Reasoner (Lab Sinh)
- **Ngày hoàn thành**: 31/08/2026
- **Nguyên tắc bảo tồn**: Giữ nguyên 100% định luật cân bằng Hardy-Weinberg 1 gen ($p^2 AA + 2pq Aa + q^2 aa = 1$).
- **Mô hình Mạng Bayes**: `src/lib/geneticsBayes.js` (Tính bảng xác suất có điều kiện CPT cho các phép lai đa gen $AaBbDd \times AaBbDd$).
- **Kiểm thử Kiểm định**: `src/ai-training/scripts/test-bayes-genetics.js` (Vượt qua 10/10 test cases, đạt độ chính xác 100%).
