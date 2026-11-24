# 🚀 RUNBOOK NỘP BÀI DỰ THI CHÍNH THỨC (SUBMISSION RUNBOOK)
> **Dự án**: STEM HUB — Nền tảng Đấu trường Học tập & Phòng Thí Nghiệm Ảo STEM  
> **Mã dự án**: AI26B0012  
> **Thời hạn nộp hồ sơ chính thức**: **23:59 ngày 26/11/2026**  
> **Nguyên tắc cốt lõi**: Tuân thủ Quy tắc Trung thực Prompt 0 — Tuyệt đối không phỏng đoán, mọi số liệu đối soát trực tiếp từ mã nguồn và kiểm thử thực tế.

---

## 📌 1. BẢNG KIỂM AN TOÀN TRƯỚC KHI ĐÓNG GÓI (PRE-PACKAGING CHECKLIST)

| STT | Hạng Mục Kiểm Tra | Lệnh Kiểm Tra | Yêu Cầu Đạt Chuẩn | Trạng Thái |
|:---:|---|---|---|:---:|
| 1 | **Không đưa thư mục `.git` vào gói nộp** | Cấu hình trong `scripts/package_submission.mjs` | Thư mục `.git` bị loại trừ hoàn toàn | ✅ Đã cấu hình |
| 2 | **Không rò rỉ Secrets / API Keys** | `npx gitleaks dir --redact .` | 0 phát hiện rò rỉ khóa bí mật | ✅ 0 leaks |
| 3 | **Loại trừ tệp môi trường `.env*`** | Kiểm tra danh sách loại trừ | Không đóng gói bất kỳ file `.env*` nào | ✅ Đã cấu hình |
| 4 | **Loại trừ tệp CSV thô chứa Email** | Kiểm tra `reports/ablation/evidence/` | Không đóng gói CSV chứa email thực của giáo viên | ✅ Đã cấu hình |
| 5 | **Loại bỏ tệp âm thanh MP3 bản quyền** | `Get-ChildItem -Recurse public -Filter *.mp3` | 0 tệp MP3 trong thư mục `public/` | ✅ 0 tệp MP3 |
| 6 | **Toàn vẹn bộ kiểm thử tự động** | `npm test` | 100% bài kiểm thử đơn vị và bảo mật PASS | ✅ 178/178 tests |
| 7 | **Quy tắc Admin Fail-Closed** | `node tests/api_admin_security.test.mjs` | Chỉ chấp nhận Custom Claims, chặn client ghi role | ✅ PASS |

---

## 📋 2. QUY TRÌNH THỰC HIỆN TỪNG BƯỚC (STEP-BY-STEP WORKFLOW)

### Bước 1: Rà soát và hoàn tất thẩm định đáp án chuẩn
1. Người dùng trực tiếp rà soát 30 câu hỏi số học trong file [docs/ablation-answer-key-review.md](file:///e:/project/cuoc_thi_AI/docs/ablation-answer-key-review.md), điền nguồn trích dẫn vào cột **"Nguồn xác nhận"** và đánh dấu `[x]` vào cột **"Người đã kiểm duyệt"**.
2. Chạy lệnh kiểm tra tính toàn vẹn (chỉ đọc):
   ```powershell
   node scripts/check_answer_key.mjs
   ```
   *Yêu cầu*: Báo cáo đạt 30/30 câu đạt cả 2 tiêu chí (đã tích [x] và có nguồn xác nhận).

### Bước 2: Khóa Hash bộ dữ liệu đáp án chính thức
Chạy lệnh khóa hash và cập nhật nhật ký phiên bản:
```powershell
node scripts/lock_answer_key.mjs --version=v1.4.0 --notes="Khóa hash chính thức phục vụ nộp bài"
```
*Kết quả*: Tệp `reports/ablation/dataset_hash.json` ghi nhận mã SHA-256 chính thức cùng danh sách các câu đã được thẩm định.

### Bước 3: Chạy thực nghiệm Ablation RAG (Khi được cấp khóa mới)
1. Chạy thử nghiệm thăm dò (Pilot 5 câu):
   ```powershell
   node scripts/run_ablation_real.mjs --pilot=5 --execute
   ```
2. Sau khi xác nhận độ trễ và token bình thường, chạy đầy đủ bộ thực nghiệm:
   ```powershell
   node scripts/run_ablation_real.mjs --execute
   ```
   *Lưu ý*: Kết quả được ghi nhận khách quan vào `reports/ablation/evidence/` và `reports/ablation/ablation_report.md`.

### Bước 4: Vô hiệu hóa tài khoản kiểm thử trên Production
Thực hiện đặt lại mật khẩu ngẫu nhiên cho các tài khoản bot/test:
```powershell
node scripts/remediate_test_accounts.cjs --execute
```

### Bước 5: Khởi tạo tài khoản trải nghiệm cho Ban Giám Khảo
Khởi tạo tài khoản demo sạch có sẵn dữ liệu và phân quyền:
```powershell
node scripts/create_judge_demo_account.cjs --execute
```

### Bước 6: Kiểm tra đóng gói thử nghiệm (Dry-Run Packaging)
Chạy script đóng gói thử nghiệm để quét kiểm toán độ sạch của gói nộp:
```powershell
node scripts/package_submission.mjs
```
*Yêu cầu*: Tệp zip thử nghiệm được giải nén và quét sạch 100% PII, email và khóa bảo mật.

### Bước 7: Xuất hồ sơ văn bản và đóng gói nộp chính thức
1. Tạo các tài liệu Word / PDF:
   ```powershell
   python scripts/create_docx_docs.py
   ```
2. Đóng gói tệp zip nộp bài chính thức và nộp lên cổng khảo thí trước **23:59 ngày 26/11/2026**.

