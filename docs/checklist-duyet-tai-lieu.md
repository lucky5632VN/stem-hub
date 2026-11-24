# 📋 BẢNG ĐỐI SOÁT CHỈ SỐ TÀI LIỆU (DOCUMENTATION AUDIT CHECKLIST)
## DỰ ÁN STEM HUB — ĐỐI SOÁT TỪNG CON SỐ VÀ NGUỒN GỐC KỸ THUẬT

> **Mục tiêu**: Đảm bảo 100% các con số, chỉ số thống kê, tỷ lệ $k/n$, giá trị $p$, kích thước mẫu và thời điểm xuất hiện trong `docs/bao-cao-cai-tien-chang-1.md`, `docs/phu-luc-dinh-chinh.md` và `README.md` đều có file mã nguồn/dữ liệu đối chứng trực tiếp; loại bỏ hoàn toàn các số liệu ảo hoặc suy đoán.

---

### 1. Bảng Đối Soát Mô Hình 1: Rủi Ro Phản Ứng ChemLab

| Con số / Chỉ số trong Báo cáo | Giá trị công bố | File nguồn đối chiếu thực tế | Lệnh kiểm tra xác minh | Trạng thái đối soát |
|---|:---:|---|---|:---:|
| Kích thước mẫu toàn bộ ($n$) | $n=50$ | `src/ai-training/datasets/chem-risk/unseen-test-chem.json` (30)<br>`src/ai-training/datasets/chem-risk/edge-cases-chem.json` (20) | `node scripts/run_ml_vs_rules_benchmark.mjs` | ✅ Khớp 100% |
| Kích thước tập huấn luyện gốc | $n=180$ (lệch: 1/26/153) | `src/ai-training/datasets/chem-risk/risk-dataset.json` | `node -e "..."` | ✅ Khớp 100% |
| Kích thước tập cân bằng khảo sát | $n=135$ (45/45/45) | `src/ai-training/datasets/chem-risk/independent_eval_135.json` | `node -e "..."` | ✅ Khớp 100% |
| Baseline công thức tuyến tính gốc | **48/50 (96.00%)**<br>(A: 30/30, B: 18/20) | `scripts/run_ml_vs_rules_benchmark.mjs` (hàm `chemFormulaPredict`) | `node scripts/run_ml_vs_rules_benchmark.mjs` | ✅ Khớp 100% |
| Độ chính xác Hệ luật phân ngưỡng | **47/50 (94.00%)**<br>(A: 28/30, B: 19/20) | `scripts/run_ml_vs_rules_benchmark.mjs` (hàm `chemRulePredict`) | `node scripts/run_ml_vs_rules_benchmark.mjs` | ✅ Khớp 100% |
| Độ chính xác Softmax NN (Z-Score) | **40/50 (80.00%)**<br>(A: 28/30, B: 12/20) | `src/data/models/chemlab-risk-nn.json`<br>`scripts/run_ml_vs_rules_benchmark.mjs` | `node scripts/run_ml_vs_rules_benchmark.mjs` | ✅ Khớp 100% |
| Baseline đoán mò lớp đa số (Class 2) | **35/50 (70.00%)**<br>(A: 28/30, B: 7/20) | `scripts/run_ml_vs_rules_benchmark.mjs` (majorityClass = 2) | `node scripts/run_ml_vs_rules_benchmark.mjs` | ✅ Khớp 100% |
| Cặp lệch McNemar (Luật vs NN) | $b=9, c=2$ | `reports/ablation/ml_vs_rules_and_ablation_results.json` | `node scripts/run_ml_vs_rules_benchmark.mjs` | ✅ Khớp 100% |
| McNemar $\chi^2$ ($df=1$) và p-value | $\chi^2=3.2727$<br>$p_{\chi^2}=0.0704$<br>$p_{\text{exact}}=0.0654$ | `reports/ablation/ml_vs_rules_and_ablation_results.json` | `node scripts/run_ml_vs_rules_benchmark.mjs` | ✅ Khớp 100% |

---

### 2. Bảng Đối Soát Mô Hình 2: Chẩn Đoán Lỗi Quang Hình Học

| Con số / Chỉ số trong Báo cáo | Giá trị công bố | File nguồn đối chiếu thực tế | Lệnh kiểm tra xác minh | Trạng thái đối soát |
|---|:---:|---|---|:---:|
| Kích thước mẫu toàn bộ ($n$) | $n=45$ | `src/ai-training/datasets/physics-error/unseen-test-physics.json` (30)<br>`src/ai-training/datasets/physics-error/edge-cases-physics.json` (15) | `node scripts/run_ml_vs_rules_benchmark.mjs` | ✅ Khớp 100% |
| Nhóm A (Mô phỏng độc lập) | Luật: 30/30 (100%)<br>k-NN: 30/30 (100%)<br>Đa số: 10/30 (33.33%) | `reports/ablation/ml_vs_rules_and_ablation_results.json` | `node scripts/run_ml_vs_rules_benchmark.mjs` | ✅ Khớp 100% |
| Nhóm B (15 ca biên do nhóm viết) | Luật: 5/15 (33.33%)<br>k-NN: 5/15 (33.33%)<br>Đa số: 5/15 (33.33%) | `src/ai-training/datasets/physics-error/edge-cases-physics.json` | `node scripts/run_ml_vs_rules_benchmark.mjs` | ✅ Khớp 100% |
| Tổng hợp cả bộ ($n=45$) | Luật: 35/45 (77.78%)<br>k-NN: 35/45 (77.78%)<br>Đa số: 15/45 (33.33%) | `reports/ablation/ml_vs_rules_and_ablation_results.json` | `node scripts/run_ml_vs_rules_benchmark.mjs` | ✅ Khớp 100% |
| Cặp lệch McNemar (Luật vs k-NN) | $b=5, c=5$ | `reports/ablation/ml_vs_rules_and_ablation_results.json` | `node scripts/run_ml_vs_rules_benchmark.mjs` | ✅ Khớp 100% |
| McNemar $\chi^2$ ($df=1$) và p-value | $\chi^2=0$, $p=1.0000$ | `reports/ablation/ml_vs_rules_and_ablation_results.json` | `node scripts/run_ml_vs_rules_benchmark.mjs` | ✅ Khớp 100% |

---

### 3. Bảng Đối Soát Mô Hình 3: Phân Loại Ý Định Javit

| Con số / Chỉ số trong Báo cáo | Giá trị công bố | File nguồn đối chiếu thực tế | Lệnh kiểm tra xác minh | Trạng thái đối soát |
|---|:---:|---|---|:---:|
| Kích thước mẫu toàn bộ ($n$) | $n=65$ | `src/ai-training/datasets/intent/unseen-test-intent.json` (40)<br>`src/ai-training/datasets/intent/hard-unseen-test-intent.json` (25) | `node scripts/run_ml_vs_rules_benchmark.mjs` | ✅ Khớp 100% |
| Regex đơn giản cũ | **14/65 (21.54%)** | `scripts/run_ml_vs_rules_benchmark.mjs` (hàm `oldRegexPredict`) | `node scripts/run_ml_vs_rules_benchmark.mjs` | ✅ Khớp 100% |
| Hệ luật tử tế (đã xem test) | **45/65 (69.23%)** | `scripts/run_ml_vs_rules_benchmark.mjs` (hàm `refinedRulePredict`) | `node scripts/run_ml_vs_rules_benchmark.mjs` | ✅ Khớp 100% |
| Naive Bayes học từ dữ liệu | **59/65 (90.77%)** | `src/data/models/intent-classifier.json` | `node scripts/run_ml_vs_rules_benchmark.mjs` | ✅ Khớp 100% |
| Cặp lệch McNemar (Luật vs NB) | $b=4, c=18$ | `reports/ablation/ml_vs_rules_and_ablation_results.json` | `node scripts/run_ml_vs_rules_benchmark.mjs` | ✅ Khớp 100% |
| McNemar $\chi^2$ ($df=1$) và p-value | $\chi^2=7.6818$, $p_{\chi^2}=0.0056$, $p_{\text{exact}}=0.0043$ | `reports/ablation/ml_vs_rules_and_ablation_results.json` | `node scripts/run_ml_vs_rules_benchmark.mjs` | ✅ Khớp 100% |

---

### 4. Bảng Đối Soát Kiểm Toán Auth & Dữ Liệu Firestore

| Mục kiểm toán | Kết quả kiểm toán thực tế | File nguồn đối chiếu | Lệnh kiểm tra xác minh | Trạng thái đối soát |
|---|---|---|---|:---:|
| Danh sách email whitelist cũ trên Auth | 25 tài khoản thật tồn tại, 2 tài khoản không tồn tại (`admin@stemhub.edu.vn`, `admin@stem-hub.top`) | Firebase Auth (`stem-hub-43e96`) | `node scripts/audit_test_accounts_on_production.cjs` | ✅ Khớp 100% |
| Lịch sử Rules thêm whitelist | Commit `896c273` (11/09/2026) | Git commit history `firestore.rules` | `git log -S "admin123@gmail.com" -- firestore.rules` | ✅ Khớp 100% |
| Lịch sử Rules gỡ whitelist | Commit `970e193` (18/11/2026) | Git commit history `firestore.rules` | `git log -S "admin123@gmail.com" -- firestore.rules` | ✅ Khớp 100% |
| Kiểm tra `email_verified` trước commit `970e193` | Hoàn toàn KHÔNG kiểm tra `email_verified` | Git commit history `firestore.rules` | `git show 896c273:firestore.rules` | ✅ Khớp 100% |
| Batch write `exams` (400 docs) | `2026-07-13T18:49:11Z` – `18:49:21Z` | Commit `17d69b3` (`src/data/exams.js`) | `node scripts/check_collection_update_times.cjs` | ✅ Khớp 100% |
| Batch write `questions` (2,200 docs) | `2026-08-14T15:35:58Z` – `15:36:09Z` | Commit `fd6d587` & `fc8ee64` (`scripts/reseed_firestore.js`) | `node scripts/check_collection_update_times.cjs` | ✅ Khớp 100% |

---

### 5. Bảng Đối Soát Bộ Dữ Liệu Ablation & Khóa Hash

| Mục đối soát | Thông số kỹ thuật | File nguồn đối chiếu | Lệnh kiểm tra xác minh | Trạng thái đối soát |
|---|---|---|---|:---:|
| Tập dữ liệu 100 câu phân tầng | 40 Khái niệm + 30 Số liệu + 30 Ngoài phạm vi | `reports/ablation/ablation_dataset_100.json` | `node scripts/lock_answer_key.mjs` | ✅ Khớp 100% |
| Mã băm SHA-256 | `4cf0e5e3ae5f9381a47debbea763ae38f414933d62d24a385a2eea83885eae77` | `reports/ablation/dataset_hash.json` | `node scripts/lock_answer_key.mjs` | ✅ Khớp 100% |
| Phiên bản khóa hash hiện tại | `v1.4.0` | `reports/ablation/dataset_hash.json` | `node scripts/lock_answer_key.mjs` | ✅ Khớp 100% |
| Trạng thái kiểm duyệt câu số học | `0/30` câu được người kiểm [x] và có nguồn xác nhận | `docs/ablation-answer-key-review.md` | `node scripts/lock_answer_key.mjs` | ✅ Khớp 100% |
| Ước tính số lệnh gọi full | 630 calls (~334.500 tokens) | `scripts/run_ablation_real.mjs` | `node scripts/run_ablation_real.mjs` | ✅ Khớp 100% |
| Ước tính thời gian chạy full | 15 – 25 phút | `scripts/run_ablation_real.mjs` | `node scripts/run_ablation_real.mjs` | ✅ Khớp 100% |
| Chế độ thử nghiệm thăm dò | `--pilot=5` (5 câu x 3 điều kiện x 1 lần = 10 calls) | `scripts/run_ablation_real.mjs` | `node scripts/run_ablation_real.mjs --pilot=5` | ✅ Khớp 100% |

---

### 6. Bảng Đối Soát Tài Nguyên Âm Thanh MP3

| Tệp tin | Dung lượng | SHA-256 Hash | Nơi tham chiếu | Trạng thái bản quyền |
|---|:---:|---|---|:---:|
| `public/labs/lab-hoa-sandbox/.../nhactrannhantao_soundtrack.mp3` | 25.51 MB | `1a4370bb32f7840be570d19c499a65cbde49b7c6cdb64f2394d42016134af6cc` | `lab-hoa-sandbox/public/lab.js` | Không rõ (chờ thay CC0) |
| `public/labs/lab-ktra15p/dist/.../nhactrannhantao_soundtrack.mp3` | 25.51 MB | `1a4370bb32f7840be570d19c499a65cbde49b7c6cdb64f2394d42016134af6cc` | `lab-ktra15p/dist/lab.js` | Không rõ (trùng hash) |
| `public/labs/lab-ktra15p/public/.../nhactrannhantao_soundtrack.mp3` | 25.51 MB | `1a4370bb32f7840be570d19c499a65cbde49b7c6cdb64f2394d42016134af6cc` | `lab-ktra15p/public/lab.js` | Không rõ (trùng hash) |
