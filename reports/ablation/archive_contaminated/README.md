# ⚠️ ARCHIVE: BÁO CÁO CÁC LẦN CHẠY CÓ THỂ BỊ NHIỄM (POTENTIALLY CONTAMINATED RUNS)

> **Cảnh báo tính toàn vẹn khoa học**: Các tệp trong thư mục này được đánh dấu là **CÓ THỂ BỊ NHIỄM (CONTAMINATED)** do phát hiện rò rỉ các đoạn tri thức mang tiền tố `bench_verified_*` vào ngữ cảnh RAG trong quá trình chạy thử nghiệm.
> **Quy định**: Không xóa các tệp này nhằm phục vụ đối soát, minh bạch dữ liệu lịch sử và kiểm toán độc lập.

## 1. Nguyên nhân nhiễm dữ liệu (Root Cause of Contamination)
- Tệp `public/data/global-learned-knowledge.json` và `src/data/global-learned-knowledge.json` chứa 127 bản ghi mang tiền tố `bench_verified_*` được nạp vào hệ thống ở commit `41dbcb3`.
- Các bản ghi này chứa câu hỏi, đáp án mẫu và lời giải của bộ câu hỏi benchmark 150 ca, đồng thời mang nhãn `status: "verified_by_teacher"`.
- Trước khi cơ chế cô lập kho tĩnh được kích hoạt, hàm `retrieveTopK()` trong `src/lib/ragService.js` tự động nạp toàn bộ tri thức tự học đã duyệt từ `global-learned-knowledge.json` vào ngữ cảnh truy xuất với hệ số nhân điểm ưu tiên `x1.4`.
- Kết quả: Khi chạy ablation hoặc pilot, mô hình RAG đã truy xuất chính các câu giải chuẩn từ `bench_verified_*` thay vì trích xuất từ 303 chunk sách giáo khoa thuần túy của `stem-corpus.json`.

## 2. Thống kê xuất hiện trong nhật ký (Contamination Occurrences)
- `pilot_run_1795437992353.jsonl`: 21 lần xuất hiện token `bench_verified_` (4/5 ca pilot bị nhiễm).
- `ablation_run_1795438207546.jsonl`: 129 lần xuất hiện token `bench_verified_` (25/28 dòng).
- `ablation_run_1795452090341.jsonl`: 150 lần xuất hiện token `bench_verified_` (31/37 dòng).

## 3. Trạng thái task-12878 (Full Run Status)
- Lệnh chạy: `node scripts/run_ablation_real.mjs` trên tập `ablation_dataset_100.v1.4.1.json`.
- Trạng thái: **DỞ DANG (ABORTED)** do lỗi nghẽn hạn mức API Gemini (`Failed after 6 attempts: Tất cả mô hình Gemini đều bận: This operation was aborted`).
- Tiến độ: Dừng lại ở câu thứ 13 (`[13/100] Evaluating: ABL_IN_CONCEPT_13`).
- Số lệnh gọi thực tế: Đã thực hiện khoảng 26 lệnh gọi LLM trước khi dừng lại ở lần thử thứ 6 của ca 13.
- Tệp kết quả: Không có báo cáo tổng kết hợp lệ (`ablation_dataset_100_summary.json` không được sinh ra).

## 4. Biện pháp khắc phục đã áp dụng
1. Đóng băng kho ngữ cảnh: Chỉ cho phép duy nhất 303 chunk từ `stem-corpus.json` (mã băm SHA-256: `28f7b3382697954fd92f9c09971469d6f9d2c897e5c506fc838b800603ac2cc0`).
2. Tắt hoàn toàn tri thức tự học (`learned_knowledge`), kho động, cache và Firestore trong chế độ ablation.
3. Cơ chế Chunk Guard: Mọi lệnh gọi RAG đối soát tự động kiểm tra chunkId; nếu phát hiện mã ngoài 303 chunk hoặc có tiền tố `bench_verified_*` thì dừng ngay lập tức và ném lỗi `[ABLATION CORRUPTION DETECTED]`.

