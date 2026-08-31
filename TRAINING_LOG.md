# 📊 NHẬT KÝ HUẤN LUYỆN CÁC MÔ HÌNH AI TỰ TRAIN 100% (TRAINING LOG)
> **STEM HUB — AI Transparency & Self-Trained Machine Learning Registry**  
> *Phục vụ Đánh giá & Kiểm thử Minh bạch trong Cuộc thi AI Toàn quốc*

---

## 📌 DANH SÁCH MÔ HÌNH AI TỰ HUẤN LUYỆN (SELF-TRAINED AI MODELS)

| Module | Tên Mô hình | Thuật toán / Kiến trúc | Tập dữ liệu (Dataset) | Độ chính xác (Accuracy / Metric) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RAG Service** | Multilingual Vector Embedding | `@xenova/transformers` (`e5-small`) | `src/ai-training/datasets/rag-knowledge/stem-corpus.json` | Cosine Similarity Score | *Đang khởi tạo (Phase 2)* |
| **Lab Hóa (AI 1)** | Risk Assessment Classifier | TensorFlow.js Dense Neural Network (16-8-3) | `src/ai-training/datasets/chem-risk/risk-dataset.json` | Target Accuracy $\ge 85\%$ | *Đang chờ (Phase 3)* |
| **Lab Vật lý** | Lab Error Diagnostic Classifier | k-Nearest Neighbors (kNN) / Decision Tree | `src/ai-training/datasets/physics-error/attempts.json` | Classification Accuracy | *Đang chờ (Phase 4)* |
| **Lab Toán** | Adaptive IRT Difficulty Predictor | Logistic Regression / Item Response Theory | Firestore Questions & Student ELO Ratings | Predictive Log-Loss / AUC | *Đang chờ (Phase 5)* |
| **Lab Sinh** | Multi-gene Probabilistic Reasoner | Bayesian Conditional Probability Tables (CPT) | Mendel Multi-locus Genetics Rules | 100% Deterministic Bayes Verification | *Đang chờ (Phase 6)* |
| **Javit Assistant**| Text Intent Classifier | Naive Bayes Text Classification | `src/ai-training/datasets/intent/intent-samples.json` | Target Accuracy $\ge 90\%$ | *Đang chờ (Phase 7)* |

---
