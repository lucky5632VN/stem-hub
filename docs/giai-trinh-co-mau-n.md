# 📋 BÁO CÁO GIẢI TRÌNH KÍCH THƯỚC MẪU $n$ (MODEL 1 & MODEL 2)
**Dự án**: STEM HUB — Hệ thống Trợ lý AI và Phòng thí nghiệm ảo GDPT 2018  
**Tuân thủ**: QUY TẮC TRUNG THỰC (Prompt 0)  
**Ngày lập**: 21/11/2026  

---

## 1. TÓM TẮT GIẢI TRÌNH

| Mô hình | Kích thước trong bản thảo cũ | Kích thước đo thực tế ($n$) | Số ca bị loại | Nguyên nhân chênh lệch |
| :--- | :---: | :---: | :---: | :--- |
| **Model 1: ChemLab Risk Classifier** | $n = 56$ | **$n = 50$** | **0** | **Lỗi tính nhẩm trong văn bản báo cáo cũ**, không phải do loại ca dữ liệu. |
| **Model 2: Physics Diagnostic k-NN** | $n = 51$ | **$n = 45$** | **0** | **Lỗi tính nhẩm trong văn bản báo cáo cũ**, không phải do loại ca dữ liệu. |

> [!IMPORTANT]
> **Khẳng định trung thực**: Hoàn toàn **KHÔNG CÓ BẤT KỲ CA NÀO BỊ LOẠI BỎ** khỏi tập kiểm thử độc lập. Con số phần trăm được ghi nhận trong mọi file kết quả máy chạy (như 94,00% hay 77,78%) từ đầu đến nay đều có mẫu số thực tế chính xác là $n = 50$ và $n = 45$.

---

## 2. NGUYÊN NHÂN CHI TIẾT

### 2.1. Model 1 (ChemLab): Vì sao xuất hiện con số $n=56$?
- Trong kịch bản huấn luyện ban đầu (`src/ai-training/scripts/chem-risk_train.js`), tập dữ liệu gốc gồm 180 mẫu (`risk-dataset.json`). Khi chia theo tỷ lệ 80% Train / 20% Test, kích thước tập test fold cũ là $180 \times 20\% = 36$ mẫu.
- Trong bản thảo tài liệu trước, người viết đã cộng gộp nhẩm:  
  $$\text{Số mẫu ghi nhầm} = 36 \text{ (test split cũ)} + 20 \text{ (edge cases)} = \mathbf{56 \text{ mẫu}}$$
- **Thực tế trong script benchmark độc lập (`scripts/run_ml_vs_rules_benchmark.mjs`)**:
  - Dữ liệu nạp vào gồm 2 file JSON riêng biệt:
    1. `src/ai-training/datasets/chem-risk/unseen-test-chem.json`: đúng **30 mẫu**.
    2. `src/ai-training/datasets/chem-risk/edge-cases-chem.json`: đúng **20 mẫu**.
  - Tổng số mẫu thực tế: $30 + 20 = \mathbf{50 \text{ mẫu}}$.
  - Mọi số liệu đo:
    - Luật: $47 / 50 = 94,00\%$
    - Softmax NN: $40 / 50 = 80,00\%$
    - Baseline đa số: $35 / 50 = 70,00\%$
    - NN không chuẩn hóa: $35 / 50 = 70,00\%$
    *(Nếu chia cho 56, $47/56 \approx 83,93\%$, không khớp với bất kỳ log nào).*

### 2.2. Model 2 (Physics): Vì sao xuất hiện con số $n=51$?
- Trong kịch bản huấn luyện quang học ban đầu (`src/ai-training/scripts/physics-error_train.js`), tập dữ liệu gốc gồm 120 mẫu (`attempts.json`). Khi chia tỷ lệ kiểm thử 70/30, tập test fold cũ có $120 \times 30\% = 36$ mẫu.
- Trong bản thảo tài liệu trước, người viết đã cộng gộp nhẩm:  
  $$\text{Số mẫu ghi nhầm} = 36 \text{ (test split cũ)} + 15 \text{ (edge cases)} = \mathbf{51 \text{ mẫu}}$$
- **Thực tế trong script benchmark độc lập (`scripts/run_ml_vs_rules_benchmark.mjs`)**:
  - Dữ liệu nạp vào gồm 2 file JSON riêng biệt:
    1. `src/ai-training/datasets/physics-error/unseen-test-physics.json`: đúng **30 mẫu**.
    2. `src/ai-training/datasets/physics-error/edge-cases-physics.json`: đúng **15 mẫu**.
  - Tổng số mẫu thực tế: $30 + 15 = \mathbf{45 \text{ mẫu}}$.
  - Mọi số liệu đo:
    - Luật: $35 / 45 = 77,78\%$
    - k-NN ($k=5$): $35 / 45 = 77,78\%$
    - Baseline đa số: $15 / 45 = 33,33\%$
    - k-NN không Z-Score: $35 / 45 = 77,78\%$
    *(Nếu chia cho 51, $35/51 \approx 68,63\%$, hoàn toàn không khớp).*

---

## 3. DANH SÁCH FILE VÀ HASH ĐỐI CHỨNG CỦA TẬP TEST ĐỘC LẬP THẬT

### Tập dữ liệu Model 1 ($n=50$):
1. `src/ai-training/datasets/chem-risk/unseen-test-chem.json` (30 mẫu, ID: `chem_unseen_1` đến `chem_unseen_30`).
2. `src/ai-training/datasets/chem-risk/edge-cases-chem.json` (20 mẫu, ID: `chem_edge_1` đến `chem_edge_20`).

### Tập dữ liệu Model 2 ($n=45$):
1. `src/ai-training/datasets/physics-error/unseen-test-physics.json` (30 mẫu, ID: `phys_unseen_1` đến `phys_unseen_30`).
2. `src/ai-training/datasets/physics-error/edge-cases-physics.json` (15 mẫu, ID: `phys_edge_1` đến `phys_edge_15`).

---

## 4. CHANGELOG SỬA ĐỔI TÀI LIỆU
- **Phiên 21/11/2026**:
  - Sửa `docs/claims-registry.md` dòng CLM-004: Thay `(n=56)` thành `(n=50, 47/50)`.
  - Sửa `docs/claims-registry.md` dòng CLM-005: Thay `(n=51)` thành `(n=45, 35/45)`.
  - Cập nhật [docs/ablation-report.md](file:///e:/project/cuoc_thi_AI/docs/ablation-report.md) ghi nhận chính xác cỡ mẫu $n=50$ và $n=45$, kèm kiểm định McNemar chính xác với $df=1$.

