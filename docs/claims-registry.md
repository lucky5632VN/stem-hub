# 📋 SỔ ĐĂNG KÝ VÀ THEO DÕI TUYÊN BỐ KHOA HỌC (CLAIMS REGISTRY)
> **Dự án**: STEM HUB | **Mã đội thi**: AI26B0012  
> **Cuộc thi**: Sáng tạo trẻ Quốc gia 2026 — Lĩnh vực Trí tuệ Nhân tạo  
> **Thời điểm xuất bản tự động**: 2026-11-16T15:12:53.230Z  
> **Nguyên tắc**: Sinh tự động bằng script `scripts/generate_claims_registry.js` từ các file kết quả và mã nguồn thực tế. Không gõ tay số liệu.

---

## 🧭 TỔNG QUAN PHÂN LOẠI TRẠNG THÁI TUYÊN BỐ

- **Tổng số tuyên bố được kiểm toán**: 18 tuyên bố
- **Đo thật (Verified by Real Commands)**: 8 tuyên bố
- **Mô phỏng (Heuristic Simulation)**: 1 tuyên bố
- **Đã gỡ (Removed / Sanitized)**: 4 tuyên bố
- **Chưa đo (Pending Future Phase)**: 2 tuyên bố

---

## 📊 BẢNG TRA CỨU CHI TIẾT TỪNG TUYÊN BỐ

| Mã | Lĩnh vực | Nội dung tuyên bố | Phân loại trạng thái | File minh chứng / Kết quả | Lệnh tái lập kiểm toán | Chi tiết số liệu thực tế |
|:---:|---|---|:---:|---|---|---|
| **CLM-001** | RAG Retrieval | Nhận diện môn học Top-1 đạt 96.88% (31/32) | `đo thật (32 queries tiêu đề, nhận diện môn)` | [src/ai-training/datasets/rag-knowledge/rag-evaluation.json](src/ai-training/datasets/rag-knowledge/rag-evaluation.json) | `node src/ai-training/scripts/test-rag-tfidf.js` | Top-1: 31/32 = 96.88% (Wilson 95% CI: [84.3%, 99.4%]) |
| **CLM-002** | RAG Retrieval | Benchmark truy xuất mức đoạn (Chunk-level Benchmark 60 câu) | `đo thật` | [reports/rag_chunk_benchmark_results.json](reports/rag_chunk_benchmark_results.json) | `node src/ai-training/scripts/evaluate-rag-chunk-level.js` | Recall@1: NaN% (16/60), Recall@3: NaN%, Recall@5: NaN%, MRR: 0.4164, True Rejection OOD: 100.00% (20/20) |
| **CLM-003** | RAG Ablation | Có RAG giúp giảm ảo giác từ 28% xuống 4% và tăng cảnh báo Out-of-Scope | `mô phỏng (đang nâng cấp đo thật trên 100 câu)` | [reports/ablation/ablation_dataset_100.json](reports/ablation/ablation_dataset_100.json) | `node scripts/run_ablation_real.mjs` | Đã khóa tập 100 câu phân tầng (SHA-256: 4cf0e5e3...), ước tính 630 calls (~334.500 tokens), chờ xác nhận chạy live. |
| **CLM-004** | Model 1 - Hóa | ChemLab Risk Classifier: Phân loại rủi ro 3 mức | `đo thật (dữ liệu tổng hợp / xấp xỉ luật)` | [reports/ablation/ml_vs_rules_and_ablation_results.json](reports/ablation/ml_vs_rules_and_ablation_results.json) | `node scripts/run_ml_vs_rules_benchmark.mjs` | Test độc lập (n=50): Nhóm A (mô phỏng, n=30): Luật 28/30 (93.33%), NN 28/30 (93.33%), Majority 28/30 (93.33%) (lệch 2 ca ranh giới do khác biệt định nghĩa hàm rủi ro). Nhóm B (ca biên viết tay, n=20): Luật 19/20 (95.00%), NN 12/20 (60.00%), Majority 7/20 (35.00%). Cả bộ (n=50): Luật 47/50 (94.00%), Softmax NN 40/50 (80.00%), Majority 35/50 (70.00%). McNemar (b=9, c=2): chi2=3.2727, p_chi2=0.0704, p_exact=0.0654 (chưa đủ bằng chứng khác biệt ở alpha=0.05). |
| **CLM-005** | Model 2 - Vật lý | Physics Diagnostic kNN: Chẩn đoán lỗi quang học 3D | `đo thật (dữ liệu tổng hợp)` | [reports/ablation/ml_vs_rules_and_ablation_results.json](reports/ablation/ml_vs_rules_and_ablation_results.json) | `node scripts/run_ml_vs_rules_benchmark.mjs` | Test độc lập (n=45): Nhóm A (mô phỏng, n=30): Luật 30/30 (100.00%), k-NN 30/30 (100.00%), Majority 10/30 (33.33%). Nhóm B (ca biên viết tay, n=15): Luật 5/15 (33.33%), k-NN 5/15 (33.33%), Majority 5/15 (33.33%) (không phương pháp nào vượt Majority trên 15 ca biên đa chiều). Cả bộ (n=45): Luật 35/45 (77.78%), k-NN 35/45 (77.78%), Majority 15/45 (33.33%). McNemar (b=5, c=5): chi2=0, p=1.0000. |
| **CLM-006** | Model 3 - Javit | Javit Intent Classifier: Phân loại ý định học sinh | `đo thật (học từ dữ liệu)` | [reports/ablation/ml_vs_rules_and_ablation_results.json](reports/ablation/ml_vs_rules_and_ablation_results.json) | `node scripts/run_ml_vs_rules_benchmark.mjs` | Test teencode (n=65): Regex 21.54% (14/65), Luật tử tế 69.23% (45/65, luật đã tinh chỉnh sau khi xem bộ test), Naive Bayes 90.77% (59/65). McNemar (b=4, c=18): chi2=7.6818, p_exact=0.0043 < 0.01. Kết luận: trên bộ test này, chênh lệch có ý nghĩa thống kê (p=0,0043), nhưng bộ test chưa độc lập với dữ liệu huấn luyện. |
| **CLM-007** | Model 4 - Toán | Math Adaptive Difficulty: Điều chỉnh độ khó theo mô hình 1PL Rasch IRT | `đo thật (thuật toán tất định)` | [src/data/models/math-irt-model.json](src/data/models/math-irt-model.json) | `node src/ai-training/scripts/test-math-irt.js` | 4/10 ca test trúng Vùng phát triển gần nhất (ZPD: [0.60, 0.75]) |
| **CLM-008** | Model 5 - Sinh | Genetics Bayesian Reasoner: Suy luận xác suất di truyền Mendel | `đo thật (thuật toán tất định)` | [src/ai-training/scripts/test-bayes-genetics.js](src/ai-training/scripts/test-bayes-genetics.js) | `node src/ai-training/scripts/test-bayes-genetics.js` | 10/10 passed unit test tổ hợp phân ly độc lập (Wilson 95% CI: [72.2%, 100.0%]) |
| **CLM-009** | Model 6 - RAG | TF-IDF Vector Space Model & Corpus STEM 303 chunks | `đo thật (thuật toán thống kê corpus)` | [src/data/rag-vectors.json](src/data/rag-vectors.json) | `node src/ai-training/scripts/build-rag-embeddings.js` | 303 chunks, 9,061 tokens từ vựng, Cosine Similarity threshold 0.30 |
| **CLM-010** | Sinh trắc học | Xử lý dữ liệu sinh trắc học khuôn mặt (So khớp 1:1) đã cô lập subcollection | `Đã triển khai (có test)` | [tests/firestore.rules.test.js, tests/biometrics_migration.test.cjs](tests/firestore.rules.test.js, tests/biometrics_migration.test.cjs) | `firebase emulators:exec --only firestore "node tests/firestore.rules.test.js"` | 47 test: 47 test chạy trên Firestore emulator (15 test phân quyền cốt lõi, 12 test cách ly RAG, 6 test sinh trắc học, 14 test cổng đánh giá chuyên môn) |
| **CLM-011** | Bảo mật Server | Xác thực Server Fail-Closed bắt buộc kiểm tra chữ ký cryptographic | `Đã triển khai (có test)` | [tests/auth_fail_closed.test.js](tests/auth_fail_closed.test.js) | `node tests/auth_fail_closed.test.js` | 10/10 tests passed (kiểm thử token không chữ ký / sai chữ ký giả mạo role=admin trên cả 3 cấu hình: NODE_ENV unset, development, production) |
| **CLM-012** | Bộ 150 Ca | Bộ 150 ca bẫy/khó GDPT 2018 phủ đủ 4 môn | `Đã triển khai (có test)` | [src/ai-training/datasets/benchmark_150_cases.json](src/ai-training/datasets/benchmark_150_cases.json) | `node src/ai-training/scripts/generate_150_benchmark_cases.js` | 150 ca (Toán: 0, Lý: 0, Hóa: 0, Sinh: 0) |
| **CLM-013** | Giáo viên thẩm định | Được 4 thầy cô Lê Văn Hùng, Đặng Thị Bích Thủy, Nguyễn Trọng Nghĩa, Vũ Thị Hoàng Yến thẩm định | `đã gỡ` | [reports/remediation-step1.md, reports/remediation-step2.md](reports/remediation-step1.md, reports/remediation-step2.md) | `node scripts/scan_teachers.cjs` | 0 kết quả tên thầy cô trong toàn bộ 4,192 file workspace và dữ liệu |
| **CLM-014** | Khóa Bí Mật | Xác thực server bằng chuỗi tĩnh 'stemhub_admin_secret_key_2026' | `đã gỡ` | [reports/gitleaks-history.json](reports/gitleaks-history.json) | `gitleaks detect --source . --log-opts="--all"` | Traced commit 995b89a -> patched faf7564. Không còn sử dụng trong runtime mã nguồn. |
| **CLM-015** | Pháp lý | Hệ thống bảo mật tuyệt đối, tuân thủ Quy định bảo vệ dữ liệu cá nhân | `đã gỡ` | [reports/remediation-step2.md, GIOI_THIEU_KIEN_TRUC_AI_STEM_HUB.md](reports/remediation-step2.md, GIOI_THIEU_KIEN_TRUC_AI_STEM_HUB.md) | `git grep "bảo mật tuyệt đối"` | Đã loại bỏ các từ ngữ 'bảo mật tuyệt đối', 'tuân thủ 100%' |
| **CLM-016** | Đấu trường | Ghép trận đấu trường 1v1 tức thì trong 3-5 giây | `đã gỡ` | [src/app/dau-truong/page.js](src/app/dau-truong/page.js) | `git grep "3-5 giây"` | Đã đính chính cơ chế hàng đợi 30s và bot fallback |
| **CLM-017** | Giáo viên chấm | Chấm độc lập của giáo viên thật trên 150 ca benchmark | `chưa đo (chưa hoàn thành)` | [reports/remediation-step3.md](reports/remediation-step3.md) | `N/A` | Đang chờ phát triển giao diện Teacher Review Portal |
| **CLM-018** | RAG trực tiếp | Nghiên cứu đối chứng RAG gọi trực tiếp Gemini API kèm Raw Logs | `chưa đo (đã khóa hash, chờ xác nhận chạy)` | [reports/ablation/dataset_hash.json](reports/ablation/dataset_hash.json) | `node scripts/run_ablation_real.mjs` | Đã khóa 100 câu dev (SHA-256: 4cf0e5e3...), script runner hoàn tất, ước tính ~334.500 tokens / 630 calls, chờ người dùng xác nhận chạy live. |

---

## 🔍 CHI TIẾT TỪNG TUYÊN BỐ VÀ HIỆN TRẠNG KỸ THUẬT

### CLM-001: Nhận diện môn học Top-1 đạt 96.88% (31/32)
- **Lĩnh vực**: RAG Retrieval
- **Vị trí tài liệu xuất hiện**: README.md, GIOI_THIEU_KIEN_TRUC_AI_STEM_HUB.md
- **Hiện trạng kỹ thuật thực tế**: Kiểm tra 32 câu hỏi do nhóm biên soạn từ tiêu đề bài (có nguy cơ rò rỉ). Đo mức độ khớp môn học (subject match), không phải độ chính xác tìm đúng chunk cụ thể.
- **Phân loại**: `đo thật (32 queries tiêu đề, nhận diện môn)`
- **File minh chứng**: `src/ai-training/datasets/rag-knowledge/rag-evaluation.json`
- **Lệnh chạy tái lập**: `node src/ai-training/scripts/test-rag-tfidf.js`
- **Số liệu đo đạc thực tế**: Top-1: 31/32 = 96.88% (Wilson 95% CI: [84.3%, 99.4%])

### CLM-002: Benchmark truy xuất mức đoạn (Chunk-level Benchmark 60 câu)
- **Lĩnh vực**: RAG Retrieval
- **Vị trí tài liệu xuất hiện**: reports/rag_chunk_benchmark_results.json, README.md
- **Hiện trạng kỹ thuật thực tế**: Tập 60 câu độc lập viết tay (không dùng LLM) có ngôn ngữ tự nhiên, teencode/không dấu + 20 câu OOD. Đo Recall@1/3/5, MRR và tỷ lệ từ chối.
- **Phân loại**: `đo thật`
- **File minh chứng**: `reports/rag_chunk_benchmark_results.json`
- **Lệnh chạy tái lập**: `node src/ai-training/scripts/evaluate-rag-chunk-level.js`
- **Số liệu đo đạc thực tế**: Recall@1: NaN% (16/60), Recall@3: NaN%, Recall@5: NaN%, MRR: 0.4164, True Rejection OOD: 100.00% (20/20)

### CLM-003: Có RAG giúp giảm ảo giác từ 28% xuống 4% và tăng cảnh báo Out-of-Scope
- **Lĩnh vực**: RAG Ablation
- **Vị trí tài liệu xuất hiện**: TRAINING_LOG.md, GIOI_THIEU_KIEN_TRUC_AI_STEM_HUB.md
- **Hiện trạng kỹ thuật thực tế**: Kịch bản mô phỏng suy nghiệm (Heuristic Simulation) trên 80 ca (50 câu khó GDPT 2018 + 30 câu OOD), chưa gọi Gemini API thật và chưa qua giáo viên chấm. Tỷ lệ cảnh báo OOD (96.67%) là hệ quả trực tiếp của việc áp ngưỡng cosine 0.30.
- **Phân loại**: `mô phỏng`
- **File minh chứng**: `src/ai-training/datasets/rag_ablation_results.json`
- **Lệnh chạy tái lập**: `node src/ai-training/scripts/run_rag_ablation_experiment.js`
- **Số liệu đo đạc thực tế**: 50 câu khó: Không RAG 72% vs Có RAG 92% (+20.0 pp). 30 câu OOD: 0% vs 96.67% (Hệ quả trực tiếp của ngưỡng cosine 0.30).

### CLM-004: ChemLab Risk Classifier: Độ chính xác kiểm định chéo đạt 95.56% và kiểm thử biên 95.00%
- **Lĩnh vực**: Model 1 - Hóa
- **Vị trí tài liệu xuất hiện**: README.md, GIOI_THIEU_KIEN_TRUC_AI_STEM_HUB.md
- **Hiện trạng kỹ thuật thực tế**: Mạng nơ-ron hồi quy Softmax tuyến tính (1 Dense layer, 4 inputs, 3 outputs, lr=0.2, GD 1000 epochs) chấm điểm nguy cơ liên tục; nhãn lớp cuối cùng ghi đè bởi Circuit Breaker tất định. Nhãn tập 180 mẫu do chính luật sinh ra nên đo mức độ xấp xỉ luật. 5-Fold CV trên tập tổng hợp thứ hai, cùng hàm luật/bộ sinh, nhiễu do script thêm (n=135) đạt 95.56%.
- **Phân loại**: `đo thật (dữ liệu tổng hợp / xấp xỉ luật)`
- **File minh chứng**: `src/data/models/chem-risk-model.json`
- **Lệnh chạy tái lập**: `node src/ai-training/scripts/chem-risk_train.js && node src/ai-training/scripts/extended-robust-evaluation.js`
- **Số liệu đo đạc thực tế**: Test: 100.00% (36/36), Edge: 95.00% (19/20, FN=0), 5-Fold CV: 95.56% (Macro F1: 95.58%)

### CLM-005: Physics Diagnostic kNN: Chẩn đoán lỗi quang học đạt 96.30% (5-Fold CV)
- **Lĩnh vực**: Model 2 - Vật lý
- **Vị trí tài liệu xuất hiện**: README.md, GIOI_THIEU_KIEN_TRUC_AI_STEM_HUB.md
- **Hiện trạng kỹ thuật thực tế**: Mô hình học từ dữ liệu (k-NN, k=5) trên 3 đặc trưng quang học (góc tới, khoảng cách thấu kính, chiết suất). Dữ liệu 180 mẫu tổng hợp sinh từ script mô phỏng có nhiễu. Đánh giá 5-Fold CV trên tập tổng hợp thứ hai, cùng hàm luật/bộ sinh, nhiễu do script thêm (n=135) đạt 96.30%.
- **Phân loại**: `đo thật (dữ liệu tổng hợp)`
- **File minh chứng**: `src/data/models/physics-error-model.json`
- **Lệnh chạy tái lập**: `node src/ai-training/scripts/physics-error_train.js && node src/ai-training/scripts/extended-robust-evaluation.js`
- **Số liệu đo đạc thực tế**: 5-Fold CV: 96.30% (130/135, CI: [91.6%, 98.4%]), Edge: 86.67% (13/15, CI: [62.1%, 96.3%])

### CLM-006: Javit Intent Classifier: Phân loại 7 ý định đạt 88.57% (5-Fold CV) và 83.33% unseen
- **Lĩnh vực**: Model 3 - Javit
- **Vị trí tài liệu xuất hiện**: README.md, GIOI_THIEU_KIEN_TRUC_AI_STEM_HUB.md
- **Hiện trạng kỹ thuật thực tế**: Mô hình học từ dữ liệu (Multinomial Naive Bayes) với Laplace smoothing và Text Normalizer xử lý teencode. Dữ liệu 140 mẫu do nhóm soạn; có rò rỉ 2 câu trùng khớp và 6 câu gần trùng giữa train và test. Đánh giá 5-Fold CV trên tập tổng hợp thứ hai, cùng hàm luật/bộ sinh, nhiễu do script thêm (n=140) đạt 88.57%.
- **Phân loại**: `đo thật (học từ dữ liệu, có rò rỉ mẫu tương đồng)`
- **File minh chứng**: `src/data/models/intent-classifier.json`
- **Lệnh chạy tái lập**: `node src/ai-training/scripts/intent_train.js && node src/ai-training/scripts/extended-robust-evaluation.js`
- **Số liệu đo đạc thực tế**: 5-Fold CV: 88.57% (124/140, CI: [82.2%, 92.8%]), Unseen: 83.33% (25/30, CI: [66.4%, 92.7%])

### CLM-007: Math Adaptive Difficulty: Điều chỉnh độ khó theo mô hình 1PL Rasch IRT
- **Lĩnh vực**: Model 4 - Toán
- **Vị trí tài liệu xuất hiện**: README.md, GIOI_THIEU_KIEN_TRUC_AI_STEM_HUB.md
- **Hiện trạng kỹ thuật thực tế**: Thuật toán tất định áp dụng công thức P = 1 / (1 + exp(-1.7 * (theta - b))) với theta và b chuẩn hóa từ điểm Elo. Không huấn luyện học máy.
- **Phân loại**: `đo thật (thuật toán tất định)`
- **File minh chứng**: `src/data/models/math-irt-model.json`
- **Lệnh chạy tái lập**: `node src/ai-training/scripts/test-math-irt.js`
- **Số liệu đo đạc thực tế**: 4/10 ca test trúng Vùng phát triển gần nhất (ZPD: [0.60, 0.75])

### CLM-008: Genetics Bayesian Reasoner: Suy luận xác suất di truyền Mendel
- **Lĩnh vực**: Model 5 - Sinh
- **Vị trí tài liệu xuất hiện**: README.md, GIOI_THIEU_KIEN_TRUC_AI_STEM_HUB.md
- **Hiện trạng kỹ thuật thực tế**: Thuật toán tất định áp dụng nguyên lý nhân xác suất độc lập và tổ hợp ma trận bảng Punnett cho các locus gen phân ly độc lập.
- **Phân loại**: `đo thật (thuật toán tất định)`
- **File minh chứng**: `src/ai-training/scripts/test-bayes-genetics.js`
- **Lệnh chạy tái lập**: `node src/ai-training/scripts/test-bayes-genetics.js`
- **Số liệu đo đạc thực tế**: 10/10 passed unit test tổ hợp phân ly độc lập (Wilson 95% CI: [72.2%, 100.0%])

### CLM-009: TF-IDF Vector Space Model & Corpus STEM 303 chunks
- **Lĩnh vực**: Model 6 - RAG
- **Vị trí tài liệu xuất hiện**: README.md, GIOI_THIEU_KIEN_TRUC_AI_STEM_HUB.md
- **Hiện trạng kỹ thuật thực tế**: Thuật toán thống kê N-gram TF-IDF trích xuất ma trận từ vựng 9,061 tokens từ 303 đoạn tóm tắt kiến thức do nhóm biên soạn (sourceType: team_summary).
- **Phân loại**: `đo thật (thuật toán thống kê corpus)`
- **File minh chứng**: `src/data/rag-vectors.json`
- **Lệnh chạy tái lập**: `node src/ai-training/scripts/build-rag-embeddings.js`
- **Số liệu đo đạc thực tế**: 303 chunks, 9,061 tokens từ vựng, Cosine Similarity threshold 0.30

### CLM-010: Xử lý dữ liệu sinh trắc học khuôn mặt (So khớp 1:1) đã cô lập subcollection
- **Lĩnh vực**: Sinh trắc học
- **Vị trí tài liệu xuất hiện**: src/app/ho-so/page.js, firestore.rules
- **Hiện trạng kỹ thuật thực tế**: Nạp mô hình ResNet-34 FaceNet trích xuất vector 128-D. Dữ liệu đã chuyển khỏi users/{uid} sang users/{uid}/private/biometrics. Rule chỉ cho phép chính chủ đọc/ghi/xóa; admin/teacher không có quyền. Đã có modal xin phép phụ huynh (<18 tuổi) và phương án thi thay thế nếu từ chối.
- **Phân loại**: `Đã triển khai (có test)`
- **File minh chứng**: `tests/firestore.rules.test.js, tests/biometrics_migration.test.cjs`
- **Lệnh chạy tái lập**: `firebase emulators:exec --only firestore "node tests/firestore.rules.test.js"`
- **Số liệu đo đạc thực tế**: 33/33 Firestore Security Rules tests passed (Tests M, N, O, P, Q, R kiểm chứng phân quyền biometrics độc lập)

### CLM-011: Xác thực Server Fail-Closed bắt buộc kiểm tra chữ ký cryptographic
- **Lĩnh vực**: Bảo mật Server
- **Vị trí tài liệu xuất hiện**: src/lib/firebaseAdmin.js
- **Hiện trạng kỹ thuật thực tế**: verifyFirebaseIdToken bắt buộc verifyIdToken() bằng Firebase Admin SDK ở mọi môi trường. Cờ ALLOW_INSECURE_DEV_AUTH=1 bị từ chối thẳng thừng (HTTP 403) nếu môi trường là production hoặc host không phải localhost.
- **Phân loại**: `Đã triển khai (có test)`
- **File minh chứng**: `tests/auth_fail_closed.test.js`
- **Lệnh chạy tái lập**: `node tests/auth_fail_closed.test.js`
- **Số liệu đo đạc thực tế**: 10/10 tests passed (kiểm thử token không chữ ký / sai chữ ký giả mạo role=admin trên cả 3 cấu hình: NODE_ENV unset, development, production)

### CLM-012: Bộ 150 ca bẫy/khó GDPT 2018 phủ đủ 4 môn
- **Lĩnh vực**: Bộ 150 Ca
- **Vị trí tài liệu xuất hiện**: src/ai-training/datasets/benchmark_150_cases.json
- **Hiện trạng kỹ thuật thực tế**: Bộ đối chứng kỹ thuật tổng hợp do nhóm tự lập để chạy unit test (Toán 40, Lý 38, Hóa 38, Sinh 34). Toàn bộ điểm số cũ đã chuyển vào preset_not_for_reporting, chưa qua chấm của giáo viên thật.
- **Phân loại**: `Đã triển khai (có test)`
- **File minh chứng**: `src/ai-training/datasets/benchmark_150_cases.json`
- **Lệnh chạy tái lập**: `node src/ai-training/scripts/generate_150_benchmark_cases.js`
- **Số liệu đo đạc thực tế**: 150 ca (Toán: 0, Lý: 0, Hóa: 0, Sinh: 0)

### CLM-013: Được 4 thầy cô Lê Văn Hùng, Đặng Thị Bích Thủy, Nguyễn Trọng Nghĩa, Vũ Thị Hoàng Yến thẩm định
- **Lĩnh vực**: Giáo viên thẩm định
- **Vị trí tài liệu xuất hiện**: README.md (cũ), docs (cũ)
- **Hiện trạng kỹ thuật thực tế**: Chưa có chữ ký hay phiếu chấm thực tế của các thầy cô. Đã quét toàn diện và xóa 100% tên thầy cô và tổ chuyên môn khỏi mã nguồn, tài liệu, UI và dữ liệu.
- **Phân loại**: `đã gỡ`
- **File minh chứng**: `reports/remediation-step1.md, reports/remediation-step2.md`
- **Lệnh chạy tái lập**: `node scripts/scan_teachers.cjs`
- **Số liệu đo đạc thực tế**: 0 kết quả tên thầy cô trong toàn bộ 4,192 file workspace và dữ liệu

### CLM-014: Xác thực server bằng chuỗi tĩnh 'stemhub_admin_secret_key_2026'
- **Lĩnh vực**: Khóa Bí Mật
- **Vị trí tài liệu xuất hiện**: src/app/api/learned-knowledge/route.js (cũ)
- **Hiện trạng kỹ thuật thực tế**: Đã gỡ bỏ hoàn toàn secret key tĩnh. Thay thế bằng xác thực Bearer ID Token kiểm tra chữ ký cryptographic qua Firebase Admin SDK.
- **Phân loại**: `đã gỡ`
- **File minh chứng**: `reports/gitleaks-history.json`
- **Lệnh chạy tái lập**: `gitleaks detect --source . --log-opts="--all"`
- **Số liệu đo đạc thực tế**: Traced commit 995b89a -> patched faf7564. Không còn sử dụng trong runtime mã nguồn.

### CLM-015: Hệ thống bảo mật tuyệt đối, tuân thủ Quy định bảo vệ dữ liệu cá nhân
- **Lĩnh vực**: Pháp lý
- **Vị trí tài liệu xuất hiện**: Tài liệu giới thiệu cũ
- **Hiện trạng kỹ thuật thực tế**: Đã gỡ bỏ toàn bộ khẳng định tuân thủ pháp lý. Chỉ công bố các biện pháp kỹ thuật (client-side inference, mã hóa HTTPS, không lưu ảnh thô, subcollection riêng) và khuyến nghị nhà trường ban hành quy chế.
- **Phân loại**: `đã gỡ`
- **File minh chứng**: `reports/remediation-step2.md, GIOI_THIEU_KIEN_TRUC_AI_STEM_HUB.md`
- **Lệnh chạy tái lập**: `git grep "bảo mật tuyệt đối"`
- **Số liệu đo đạc thực tế**: Đã loại bỏ các từ ngữ 'bảo mật tuyệt đối', 'tuân thủ 100%'

### CLM-016: Ghép trận đấu trường 1v1 tức thì trong 3-5 giây
- **Lĩnh vực**: Đấu trường
- **Vị trí tài liệu xuất hiện**: Tài liệu giới thiệu cũ
- **Hiện trạng kỹ thuật thực tế**: Đã gỡ bỏ con số 3-5 giây. Mô tả đúng cơ chế hàng đợi: chờ đối thủ thật trong 30 giây, sau 30 giây fallback sang ghép với 1 trong 20 tài khoản Bot có gắn nhãn [BOT].
- **Phân loại**: `đã gỡ`
- **File minh chứng**: `src/app/dau-truong/page.js`
- **Lệnh chạy tái lập**: `git grep "3-5 giây"`
- **Số liệu đo đạc thực tế**: Đã đính chính cơ chế hàng đợi 30s và bot fallback

### CLM-017: Chấm độc lập của giáo viên thật trên 150 ca benchmark
- **Lĩnh vực**: Giáo viên chấm
- **Vị trí tài liệu xuất hiện**: Kế hoạch chặng 2
- **Hiện trạng kỹ thuật thực tế**: Chưa triển khai xong Teacher Review Portal. Phần chấm thật của giáo viên sẽ thực hiện qua công cụ riêng có chữ ký số/biên bản thẩm định.
- **Phân loại**: `chưa đo (chưa hoàn thành)`
- **File minh chứng**: `reports/remediation-step3.md`
- **Lệnh chạy tái lập**: `N/A`
- **Số liệu đo đạc thực tế**: Đang chờ phát triển giao diện Teacher Review Portal

### CLM-018: Nghiên cứu đối chứng RAG gọi trực tiếp Gemini API kèm Raw Logs
- **Lĩnh vực**: RAG trực tiếp
- **Vị trí tài liệu xuất hiện**: Kế hoạch chặng 2
- **Hiện trạng kỹ thuật thực tế**: Hiện tại bảng đối chứng RAG là mô phỏng heuristic trên 80 câu. Chưa chạy script gọi API thật với Gemini Flash để lưu raw logs vào reports/ablation/raw/.
- **Phân loại**: `chưa đo (chưa hoàn thành)`
- **File minh chứng**: `reports/remediation-step3.md`
- **Lệnh chạy tái lập**: `N/A`
- **Số liệu đo đạc thực tế**: Chờ cấp ngân sách token và triển khai script đo LLM trực tiếp

