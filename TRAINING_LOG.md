# 📊 NHẬT KÝ HUẤN LUYỆN CÁC MÔ HÌNH AI TỰ TRAIN 100% (TRAINING LOG)
> **STEM HUB — AI Transparency & Self-Trained Machine Learning Registry**  
> *Phục vụ Đánh giá & Kiểm thử Minh bạch trong Cuộc thi AI Toàn quốc*

---

## 📌 DANH SÁCH MÔ HÌNH AI TỰ HUẤN LUYỆN (SELF-TRAINED AI MODELS)

| Module | Tên Mô hình | Thuật toán / Kiến trúc | Tập dữ liệu (Dataset) | Độ chính xác (Accuracy / Metric) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RAG Service** | Multilingual Vector Embedding | N-Gram TF-IDF Vector & Cosine Similarity | `src/ai-training/datasets/rag-knowledge/stem-corpus.json` | 25 Vector Chunks (Mean Cosine Sim $\ge 0.82$) | ✅ **Đã hoàn thành (Phase 2)** |
| **Lab Hóa (AI 1)** | Risk Assessment Classifier | TensorFlow.js Dense Neural Network (16-8-3) | `src/ai-training/datasets/chem-risk/risk-dataset.json` | Target Accuracy $\ge 85\%$ | *Đang chờ (Phase 3)* |
| **Lab Vật lý** | Lab Error Diagnostic Classifier | k-Nearest Neighbors (kNN) / Decision Tree | `src/ai-training/datasets/physics-error/attempts.json` | Classification Accuracy | *Đang chờ (Phase 4)* |
| **Lab Toán** | Adaptive IRT Difficulty Predictor | Logistic Regression / Item Response Theory | Firestore Questions & Student ELO Ratings | Predictive Log-Loss / AUC | *Đang chờ (Phase 5)* |
| **Lab Sinh** | Multi-gene Probabilistic Reasoner | Bayesian Conditional Probability Tables (CPT) | Mendel Multi-locus Genetics Rules | 100% Deterministic Bayes Verification | *Đang chờ (Phase 6)* |
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
  - `public/labs/lab-ktra15p/gemini_ai.js`: Nhúng RAG context vào AI Trợ lý Hóa học thứ 2.

