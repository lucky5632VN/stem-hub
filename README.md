# 🌟 STEM HUB — HỆ SINH THÁI GIÁO DỤC STEM THỰC HÀNH TÍCH HỢP AI AGENTIC
> **Mã số dự án dự thi**: `AI26B0012`  
> **Căn cứ văn bản cải tiến**: Thông báo Cải tiến Đề thi Phiên bản `CMV8BKS3P00MF01LYP0R7YNN2`  
> **Điểm Sức Khỏe Toàn Diện (System Health Score)**: 🟢 **100/100** (0 Lỗi, 0 Cảnh báo)  
> **Trạng thái Triển khai**: 🚀 **Production Ready** (Đã nghiệm thu và chạy thực nghiệm 100%)

---

## 🌐 1. TRẢI NGHIỆM TRỰC TUYẾN TRÊN VERCEL PRODUCTION

Hệ thống đã được tự động đóng gói và triển khai trực tuyến trên hạ tầng điện toán đám mây toàn cầu:

* **Trang web chính thức (Production Domain)**: [https://ai.stem-hub.top](https://ai.stem-hub.top)
* **Vercel Deployment Mirror**: [https://spatial-mind.vercel.app](https://spatial-mind.vercel.app)
* **Tài khoản Trải nghiệm Nhanh (Dành cho Ban Giám khảo)**:
  * **Học sinh**: `hocsinh.demo@stemhub.edu.vn` | Mật khẩu: `StemHub@2026`
  * **Giáo viên / Quản trị viên**: `giaovien.kiemduyet@stemhub.edu.vn` | Mật khẩu: `TeacherAdmin@2026`

---

## 🧭 2. BẢNG ĐIỀU HƯỚNG 6 YÊU CẦU CẢI TIẾN CỦA BAN GIÁM KHẢO

Dưới đây là bảng tra cứu nhanh toàn bộ hồ sơ minh chứng, số liệu kiểm thử thực nghiệm và mã nguồn kỹ thuật tương ứng với 6 yêu cầu cải tiến của Ban Giám khảo:

| STT | Ràng Buộc Kỹ Thuật Theo Đề Bài | Tài Liệu Minh Chứng Chính Thức | Vị Trí Mã Nguồn / Dữ Liệu Thực Nghiệm | Chỉ Số Kiểm Định Thực Tế |
|---|---|---|---|---|
| **YC1** | **Cơ chế Kiểm duyệt Cache AI bởi Giáo viên** *(Quarantine & Zero Unverified Exposure)* | [HO_SO_MINH_CHUNG_CAI_TIEN_AI26B0012.md](HO_SO_MINH_CHUNG_CAI_TIEN_AI26B0012.md#1-yêu-cầu-1-cơ-chế-kiểm-duyệt-của-giáo-viên-trước-khi-tái-sử-dụng-cache-tri-thức-ai) | • `src/app/api/learned-knowledge/route.js`<br>• `src/lib/ragService.js`<br>• `src/app/admin/knowledge-review/page.js` | **100% tri thức AI mới** đều lưu ở trạng thái `pending_review`. Tách biệt quyền Client/Admin. |
| **YC2** | **Strict Grounding Abstention & Trích dẫn Nguồn SGK** | [HO_SO_MINH_CHUNG_CAI_TIEN_AI26B0012.md](HO_SO_MINH_CHUNG_CAI_TIEN_AI26B0012.md#2-yêu-cầu-2-từ-chối-trả-lời-khi-thiếu-căn-cứ-ngữ-liệu-strict-grounding-abstention--trích-dẫn-nguồn-sgk) | • `src/components/organisms/GlobalAIAssistant.jsx`<br>• `src/lib/ragService.js`<br>• Cảnh báo thiếu căn cứ khi $S_{\text{grounding}} < 0.30$ | Cung cấp dẫn chứng bắt buộc `[Nguồn dẫn chứng: SGK <Môn> <Lớp>]` trên **100% câu trả lời hợp lệ**. |
| **YC3** | **Bộ 150 Ca Đánh giá Đa diện & Rubric Giáo viên** | • [BENCHMARK_150_REPORT.md](BENCHMARK_150_REPORT.md)<br>• [TEACHER_EVALUATION_SHEET_150.csv](TEACHER_EVALUATION_SHEET_150.csv) | • `src/ai-training/datasets/benchmark_150_cases.json`<br>• `src/ai-training/scripts/generate_150_benchmark_cases.js` | **150/150 ca** phủ đủ 4 môn (Toán 40, Lý 38, Hóa 38, Sinh 34). Điểm tổng hợp Rubric: **98.00%**. |
| **YC4** | **Đánh giá Độc lập 5-Fold Cross-Validation** | • [EXTENDED_ROBUST_EVALUATION_REPORT.md](EXTENDED_ROBUST_EVALUATION_REPORT.md)<br>• [TRAINING_LOG.md](TRAINING_LOG.md) | • `src/ai-training/datasets/chem-risk/independent_eval_135.json`<br>• `src/ai-training/datasets/physics-error/independent_eval_135.json`<br>• `src/ai-training/datasets/intent/independent_eval_140.json` | • Hóa học: **95.56%** (95% CI: [90.6%, 98.0%])<br>• Vật lý kNN: **96.30%** (95% CI: [91.6%, 98.4%])<br>• Javit Intent: **88.57%** (95% CI: [82.2%, 92.8%]) |
| **YC5** | **Nghiên cứu Đối chứng Thực nghiệm RAG vs No-RAG** | [TRAINING_LOG.md](TRAINING_LOG.md#5-nghiên-cứu-đối-chứng-thực-nghiệm-rag-vs-no-rag-ablation-study) | • `src/ai-training/datasets/rag_ablation_benchmark.json`<br>• `src/ai-training/scripts/run_rag_ablation_experiment.js` | • Độ đúng khoa học: **92.0% vs 72.0%** (+20.0%)<br>• Tỷ lệ ảo giác: **4.0% vs 28.0%** (giảm 7 lần)<br>• Cảnh báo ngoài phạm vi: **96.67% vs 0.0%** |
| **YC6** | **Bảng Phân định Quy tắc Xác định vs Machine Learning** | • [HO_SO_MINH_CHUNG_CAI_TIEN_AI26B0012.md](HO_SO_MINH_CHUNG_CAI_TIEN_AI26B0012.md#6-yêu-cầu-6-bảng-phân-định-rạch-ròi-bài-toán-xác-định-quy-tắc-vs-học-máy-machine-learning)<br>• [TRAINING_LOG.md](TRAINING_LOG.md#4-bảng-phân-định-rạch-ròi-bài-toán-quy-tắc-xác-định-forward-vs-học-máy-nghịch-inverse) | • `src/lib/physicsEngine.js`<br>• `src/lib/physicsErrorDiagnostic.js`<br>• `src/lib/geneticsBayes.js` | Phân định rạch ròi bài toán thuận (Forward Rule Engine 100% tất định) vs bài toán nghịch (Inverse ML Diagnostic). |

---

## 🤖 3. HỆ THỐNG 6 MÔ HÌNH AI TỰ HUẤN LUYỆN (SELF-TRAINED AI REGISTRY)

Toàn bộ 6 mô hình AI tự huấn luyện trong dự án đều chạy 100% Client-Side / Edge, không phụ thuộc vào API bên thứ ba cho các quyết định cốt lõi:

1. **ChemLab Risk Classifier**: Mạng nơ-ron Dense Softmax 3 lớp + Circuit Breaker. Đạt độ chính xác **95.56%** trên tập đánh giá độc lập ($n=135$), tuyệt đối **0 False Negatives** trên các ca nguy hiểm.
2. **Physics Multi-Label Diagnostic kNN**: Mô hình k-NN ($k=5$) kết hợp chuẩn hóa Z-Score StandardScaler, nhận diện chuẩn xác **86.67%** các ca đa lỗi hỗn hợp trong không gian thí nghiệm Vật lý 3D.
3. **Javit Text Intent Classifier**: Mô hình Multinomial Naive Bayes 7 lớp ý định tích hợp bộ chuẩn hóa ngôn ngữ Teencode học đường, đạt độ chính xác **88.57%** trên tập Unseen độc lập ($n=140$).
4. **Math Adaptive Difficulty IRT Engine**: Mô hình lý thuyết ứng đáp câu hỏi 1PL Rasch IRT, duy trì xác suất trả lời đúng trong vùng phát triển nhận thức tối ưu $P(\text{correct}) \in [60\%, 75\%]$.
5. **Multi-Gene Genetics Bayesian Reasoner**: Bộ suy luận xác suất Bayes di truyền Mendel đa alen/đa locus, xác thực tất định 100% quy luật phân ly độc lập.
6. **Multilingual TF-IDF Vector RAG Service**: Không gian vector TF-IDF N-gram (303 Chunks ngữ liệu chuẩn SGK GDPT 2018), độ chính xác trích xuất Top-1 đạt **96.88%** với Cosine Similarity trung bình **75.90%**.

---

## 🩺 4. CÔNG CỤ TỰ ĐỘNG KIỂM TOÁN HỆ THỐNG (ANTIGRAVITY DOCTOR)

Dự án tích hợp công cụ kiểm toán nghiêm ngặt độc lập [src/ai-training/scripts/antigravity-doctor.js](src/ai-training/scripts/antigravity-doctor.js) giúp tự động rà soát toàn bộ dự án trên 5 trụ cột:
* **Pillar 1**: Toàn vẹn liên kết & Không sót đường dẫn cục bộ cá nhân (`file:///`, `C:\`, `e:/`).
* **Pillar 2**: Tính nhất quán số liệu chéo giữa Data JSON và các Báo cáo thực nghiệm (Có khoảng tin cậy Wilson 95% CI).
* **Pillar 3**: Cú pháp hiển thị công thức Toán/Hóa học KaTeX & Chuẩn danh pháp IUPAC/GDPT 2018.
* **Pillar 4**: Bảo mật, Chốt chặn giáo viên, Strict Grounding Abstention và chống XSS/Prompt Injection.
* **Pillar 5**: Kiến trúc Next.js App Router & Tính toàn vẹn của Import module.

> **Báo cáo Chẩn đoán Chi tiết**: [AUDIT_DIAGNOSIS_REPORT.md](AUDIT_DIAGNOSIS_REPORT.md) (Điểm sức khỏe: **100/100**).

---

## 🛠️ 5. HƯỚNG DẪN CÀI ĐẶT & TÁI LẬP KẾT QUẢ THỰC NGHIỆM TẠI LOCAL

### Bước 1: Cài đặt thư viện phụ thuộc
```bash
npm install
```

### Bước 2: Chạy kiểm toán tái lập toàn bộ số liệu 6 mô hình AI & RAG Ablation (1 Lệnh duy nhất)
```bash
npm run audit:ai
```
*Lệnh trên sẽ tự động chạy toàn bộ 6 script đánh giá, kiểm thử đối chứng RAG vs No-RAG, và tự động đồng bộ hóa bảng số liệu vào `TRAINING_LOG.md` theo thời gian thực.*

### Bước 3: Chạy chẩn đoán kiểm toán độc lập Antigravity Doctor
```bash
node src/ai-training/scripts/antigravity-doctor.js
```

### Bước 4: Khởi chạy môi trường phát triển (Localhost)
```bash
npm run dev
```
Truy cập ứng dụng tại: [http://localhost:3000](http://localhost:3000).

---

## 📁 6. DANH MỤC TÀI LIỆU CHÍNH THỨC TẠI THƯ MỤC GỐC

Thư mục gốc của dự án được chuẩn hóa tinh gọn tuyệt đối, chỉ lưu trữ các tài liệu chính thống phục vụ Ban Giám khảo:

1. [README.md](README.md): Tổng quan dự án, liên kết Vercel và Bảng điều hướng 6 yêu cầu cải tiến.
2. [HO_SO_MINH_CHUNG_CAI_TIEN_AI26B0012.md](HO_SO_MINH_CHUNG_CAI_TIEN_AI26B0012.md): Báo cáo giải trình kỹ thuật chi tiết đáp ứng toàn bộ các góp ý của Ban Giám khảo.
3. [TRAINING_LOG.md](TRAINING_LOG.md): Nhật ký huấn luyện và kiểm thử tái lập tự động của 6 mô hình AI + Nghiên cứu RAG Ablation.
4. [BENCHMARK_150_REPORT.md](BENCHMARK_150_REPORT.md): Báo cáo tổng hợp kết quả đánh giá 150 ca bẫy/khó GDPT 2018.
5. [EXTENDED_ROBUST_EVALUATION_REPORT.md](EXTENDED_ROBUST_EVALUATION_REPORT.md): Báo cáo chi tiết kiểm định K-Fold Cross-Validation và ma trận nhầm lẫn (Confusion Matrix).
6. [AUDIT_DIAGNOSIS_REPORT.md](AUDIT_DIAGNOSIS_REPORT.md): Báo cáo sức khỏe mã nguồn toàn diện của Antigravity Doctor.
7. [TEACHER_EVALUATION_SHEET_150.csv](TEACHER_EVALUATION_SHEET_150.csv): Bảng chấm điểm thực nghiệm chi tiết từng câu của Giáo viên chuyên môn theo Rubric 3 tiêu chí.
