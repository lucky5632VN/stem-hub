# 📊 BÁO CÁO AUDIT TÍNH TRUNG THỰC & TÁI LẬP SỐ LIỆU (AUDIT REPORT)
> **Dự án**: STEM HUB — Kiến tạo Hệ thống AI hỗ trợ Hệ sinh thái Học tập Số  
> **Nhánh thực thi**: `fix/remove-hardcoded-auth-bypass`  
> **Thời điểm hoàn thành audit**: `2026-09-02T00:40:00.000Z`  
> **Nguyên tắc báo cáo**: Trung thực, khách quan, không dùng ngôn ngữ quảng cáo, không viết cứng số liệu. Mọi con số đều được trích xuất từ kết quả thực tế của lệnh `node src/ai-training/scripts/run-all-audits.js`.

---

## 1. BẢNG SO SÁNH SỐ LIỆU CŨ (CÔNG BỐ BAN ĐẦU) VS SỐ LIỆU MỚI (TÁI LẬP THỰC TẾ)

| Module | Tập Dữ Liệu & Kích thước Mẫu ($n$) | Số liệu CŨ (Công bố trước) | Số liệu MỚI (Chạy lại thực tế) | 95% Wilson Score CI | Nguyên nhân khác biệt & Giải trình Kỹ thuật |
|---|---|---|---|---|---|
| **ChemLab Risk Classifier** | `risk-dataset.json` (144 Train / 36 Test) + 20 Edge | 95.00% Accuracy | **100.00%** Test Acc ($n=36$)<br>**95.00%** Edge Acc ($n=20$) | Test: [90.4%, 100.0%]<br>Edge: [76.4%, 99.1%] | Phân chia Train/Test 80/20 chuẩn tạo tập test held-out độc lập ($n=36$) đạt 100% Acc. Khi kiểm thử ca biên gây nhiễu (Edge Cases $n=20$), Acc đạt 95.00% với **0 False Negatives** và Monotonic Score Trend (Safe 25.33% < Warn 55.64% < Danger 73.23%). |
| **Physics Diagnostic kNN** | `attempts.json` (96 Train / 24 Test) + 15 Edge | 80.00% Detection | **100.00%** Test Acc ($n=24$)<br>**86.67%** Multi-Error Acc ($n=15$) | Test: [86.2%, 100.0%]<br>Edge: [62.1%, 96.3%] | Tập test held-out 80/20 chuẩn ($n=24$) đạt 100% Acc chẩn đoán đơn lỗi. Tập ca biên phức hợp đa lỗi hỗn hợp ($n=15$) đạt 86.67% Combo Detection. |
| **Javit Intent Classifier** | `intent-samples.json` (392 Train + 40 Unseen Test) | 83.33% Accuracy (n=30) | **100.00%** Normalized Acc ($n=40$)<br>(**97.50%** Raw Teencode) | Test: [91.2%, 100.0%] | Cập nhật tập Unseen Test $n=40$. Đạt 0% trùng lặp giữa 392 mẫu Train và 40 mẫu Unseen Test độc lập. Raw Acc đạt 97.50% (39/40), Normalized Acc đạt 100.00% (40/40) nhờ bộ Text Normalizer teencode. |
| **Math IRT Engine** | 10 Benchmark Items | $P(\text{correct}) \in [60\%, 75\%]$ | **40.00%** Band Hits ($n=10$) | [16.8%, 68.7%] | Đánh giá thực tế bộ 10 benchmark items: Cặp ELO tương đồng đáp ứng đúng vùng thích ứng $[60\%, 75\%]$ ($65.42\%$, $70.06\%$), các cặp chênh lệch ELO cố tình nằm ngoài vùng như thiết kế. |
| **Genetics Bayesian Reasoner** | 10 Mendelian Test Cases | 100% Pass (10/10) | **100.00%** Pass ($n=10$) | [72.2%, 100.0%] | Kiểm thử toán học 100% chuẩn xác trên cả 10 test case di truyền Mendel đơn gen và đa gen. |
| **RAG TF-IDF Service** | `stem-corpus.json` (303 Chunks, 9,061 Tokens) | Cosine Sim $\ge 0.85$ (Số liệu cũ chưa chuẩn) | **96.88%** Top-1 Acc ($n=32$ queries)<br>**100.00%** Top-3 Hit<br>Mean Raw Cosine Sim: **43.19%** | [84.3%, 99.4%] ($n=32$) | **ĐIỀU CHỈNH QUAN TRỌNG**: Cập nhật bộ 32 queries benchmark phủ đủ 4 môn THPT GDPT 2018. Điểm Cosine Sim N-Gram TF-IDF thô đạt trung bình **43.19%**. Top-1 Acc đạt **96.88%** (31/32, 1 query phát xạ hydro bị phân loại nhầm ở Hóa học — Query 10 FAIL trung thực), Top-3 Hit đạt **100.00%**. |

> ⚠️ **Ghi chú cỡ mẫu nhỏ ($n \le 40$)**: Đối với các module có cỡ mẫu kiểm thử nhỏ ($n=10, 15, 20, 24, 32, 36, 40$), các chỉ số % mang tính chất minh họa cho thuật toán, không đại diện cho thống kê cỡ mẫu lớn. Khoảng tin cậy 95% Wilson Score đã được bổ sung đầy đủ bên cạnh từng con số.

---

## 2. DANH SÁCH CÁC THAY ĐỔI ĐÃ THỰC HIỆN (PHẦN 2 - 4)

### 2.1 Phần 2: Phân định Rõ 3 Nhóm AI trong Giao diện Minh bạch & Tài liệu
- **Giao diện `AITransparencyModal.jsx`**: Cập nhật danh mục AI phân chia rõ rệt thành 3 nhóm:
  1. **Nhóm 1 — AI Tự Huấn Luyện 100%**: 6 mô hình cục bộ (`ChemLab Risk Classifier`, `Physics Diagnostic kNN`, `Javit Intent Classifier`, `Math IRT Engine`, `Genetics Bayesian Reasoner`, `Multilingual TF-IDF RAG`).
  2. **Nhóm 2 — LLM Nền tảng bên ngoài**: Gemini API đóng vai trò *Language Synthesizer* (chỉ diễn đạt lại ngữ cảnh RAG thành văn bản tiếng Việt tự nhiên).
  3. **Nhóm 3 — Thư viện AI Pretrained có sẵn (Không thuộc 6 model tự train)**: Thư viện `@vladmandic/face-api` (ResNet-34 FaceNet 128-D) dùng cho Biometric Face 2FA, kèm chú thích minh bạch: *"Tính năng bảo mật sử dụng thư viện nhận diện khuôn mặt có sẵn, không thuộc phạm vi 6 mô hình AI tự train của dự án."*
- **Tài liệu Kiến trúc (`STEM_HUB_WEB_ARCHITECTURE_AI_DOCUMENTATION.md`)**: Cập nhật Mục 3 thành Sơ đồ 3 Nhóm AI và cập nhật bảng chỉ số tái lập thực tế.

### 2.2 Phần 3: Làm rõ Vai trò Hard Circuit Breaker trong Chem Risk Classifier
- Đã chèn giải thích tường minh trong `AITransparencyModal.jsx` và tài liệu kiến trúc:
  > *"Nhãn cuối cùng Safe/Warning/Danger được quyết định bởi luật an toàn cứng (rule-based), CHỦ ĐỘNG override mô hình AI, vì đây là tình huống an toàn hóa chất không được phép để AI tự quyết định khi có sai sót. Mạng nơ-ron Softmax chỉ cung cấp thanh đo % rủi ro mang tính tham khảo trực quan (continuous gauge), không phải là bộ phận ra quyết định cuối."*

### 2.3 Phần 4: Chế độ AI Core Live Demo (`/admin/ai-core-demo`)
- Đã khởi tạo route `/admin/ai-core-demo` và API endpoint `/api/admin/run-ai-demo`.
- Cho phép Ban Giám khảo kích hoạt tính toán live toàn bộ 6 mô hình AI ngay trên giao diện web, hiển thị Terminal Real-time Feed, loss curve, confusion matrix và khoảng tin cậy 95% Wilson.

---

## 3. XÁC NHẬN ĐỒNG BỘ VÀ BIÊN DỊCH BẢN DỰ ÁN

- **Thực thi script log tự động**: Lệnh `node src/ai-training/scripts/run-all-audits.js` (hoặc `npm run audit:ai`) chạy thành công 100%, tự động sinh file `TRAINING_LOG.md`.
- **Kiểm tra biên dịch Next.js**: Đã chuẩn hóa toàn bộ mã nguồn, không còn đụng độ ESM JSON import attributes.

---

## 4. NHẬT KÝ SỬA LỖI ĐỒNG BỘ & QUYỀN TRUY CẬP GIÁM KHẢO (V3)

| STT | Tên Lỗi Phát Hiện | Trạng Thái | Vị Trí / Dòng Code Đã Sửa | Nội Dung Thay Đổi & Giải Trình Kỹ Thuật |
|---|---|---|---|---|
| **1** | Mâu thuẫn cỡ mẫu $n=30$ vs $n=40$ của Javit Intent Classifier | ✅ Đã sửa | `AITransparencyModal.jsx` (dòng 57)<br>`src/app/admin/ai-core-demo/page.js` (dòng 243, 248)<br>`src/lib/clientAiAuditRunner.js` (dòng 125-136) | Thay thế toàn bộ các chuỗi ghi $n=30$ còn sót thành $n=40$, xuất chỉ số Normalized Acc $100.00\%$ và Raw Acc $97.50\%$ khớp 100% với `TRAINING_LOG.md`. |
| **2** | UI tuyên bố 100% tuyệt đối không có căn cứ tại tab Testing | ✅ Đã sửa | `AITransparencyModal.jsx` (dòng 1018-1024) | Thay câu khẳng định quảng cáo bằng câu mô tả trung thực: *"Toàn bộ chỉ số trên trang này được ghi tự động từ script audit thực tế (`run-all-audits.js`), có thể tái lập lại bất kỳ lúc nào bằng cách chạy lại lệnh trên."* |
| **3** | `AUDIT_REPORT.md` chưa cập nhật theo `TRAINING_LOG.md` mới nhất | ✅ Đã sửa | `AUDIT_REPORT.md` (Mục 1) | Cập nhật lại Bảng So sánh Số liệu: Javit Intent đạt $n=40$ (Norm 100.00%, Raw 97.50%) và RAG TF-IDF đạt 303 Chunks, 9,061 Tokens, Top-1 Acc 96.88% ($n=32$), Top-3 Hit 100.00%, Mean Cosine Sim 43.19%. |
| **4** | Gỡ bỏ cơ chế tài khoản ngầm & Vá lỗ hổng Auth Bypass | ✅ Đã dứt điểm | `AuthModal.jsx`<br>`AdminLayout.js`<br>`SettingsDropdown.jsx`<br>`firestore.rules`<br>`HUONG_DAN_TAO_TAI_KHOAN_ADMIN.md` | Gỡ bỏ 100% logic tự động tạo tài khoản Admin/Giám khảo ngầm trong mã nguồn Client JavaScript. Xoá vai trò `judge` và toàn bộ các chuỗi credential cứng. Chuyển sang quy trình tạo tài khoản Admin thủ công 1 lần trực tiếp trên Firebase Console theo file hướng dẫn. Cập nhật `firestore.rules` cấm tuyệt đối Client tự gán hoặc tự sửa trường `role` trong Firestore. |
