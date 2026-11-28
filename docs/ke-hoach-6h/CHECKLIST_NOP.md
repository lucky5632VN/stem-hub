# CHECKLIST NGÀY NỘP BÀI (ĐÓNG BĂNG CUỐI T-45 -> NỘP)

Thực hiện nghiêm ngặt trước khi bấm nút Gửi bài (mục tiêu xong trước `13:15`):

## 1. Kiểm thử & Đóng băng mã nguồn (T-60 đến T-30)
- [ ] **T-60 (`12:30`)**: Dừng toàn bộ tính năng mới, chỉ sửa lỗi phát sinh.
- [ ] **T-45 (`12:45`)**: Chạy `npm run test:unit` -> PASS toàn bộ, lưu output vào `reports/unit_test_summary.json`.
- [ ] **T-45**: Chạy `node tests/safety_control.test.mjs` -> PASS toàn bộ, lưu log.
- [ ] **T-45**: Chạy `node scripts/eval_safety_cases.mjs` -> sinh `reports/safety_eval_result.json`.
- [ ] **T-45**: Chạy `npm run build` -> thành công không lỗi.
- [ ] **T-45** *(khi có lệnh của người quyết định)*: Triển khai `firestore.rules` (nếu sửa) và Frontend CÙNG một đợt.
- [ ] **T-40**: Smoke test trên bản production (`https://ai.stem-hub.top`) ở tab ẩn danh:
  - [ ] Đăng nhập tài khoản demo BGK (`giamkhao_demo@stemhub.edu.vn`).
  - [ ] Đăng ký tài khoản học sinh mới / đăng nhập tài khoản học sinh.
  - [ ] Thử ca nguy hiểm trên NOVA AI Chat -> bị từ chối cứng, không sinh hướng dẫn nguy hiểm.
  - [ ] Thử ca yêu cầu AI xác nhận thao tác rủi ro -> AI từ chối xác nhận thay GV.
  - [ ] Thử phản ứng nguy hiểm trong Lab Hóa -> khóa thao tác nếu chưa có GV xác nhận.

## 2. Hoàn thiện Báo cáo từ số thật (T-30)
- [ ] Chạy `node scripts/render_report_numbers.mjs` -> kiểm tra **0 placeholder `{{kq:...}}` còn sót**, xuất file báo cáo hoàn chỉnh.
- [ ] Đối chiếu mọi con số trong báo cáo khớp 100% với `EVIDENCE_MANIFEST.json`.
- [ ] Xuất bản PDF báo cáo cuối cùng.

## 3. Đóng gói sạch & Kiểm tra bí mật (T-20)
- [ ] Chạy `node scripts/package_submission.mjs` (dùng staging do script sinh ra, **TUYỆT ĐỐI KHÔNG** `git add -A` trên thư mục làm việc).
- [ ] Chạy `gitleaks dir --redact` trên thư mục staging và `gitleaks git --redact` trên repo nộp -> **0 leaks**.
- [ ] Kiểm tra không có email thật, UID thật, API key, khóa Firebase Admin trong báo cáo, log hay gói zip.
- [ ] Tạo repo sạch 1 commit + tag phiên bản nộp (nếu cần nộp repo riêng) hoặc xác nhận commit/tag trên nhánh `main`.

## 4. Kiểm tra ẩn danh & Nộp bài (T-10 -> Trước 13:15)
- [ ] Mở toàn bộ link ở **trình duyệt chế độ ẩn danh** (không đăng nhập Google/GitHub cá nhân):
  - [ ] Link mã nguồn (HTTPS) truy cập được công khai.
  - [ ] Link sản phẩm chạy thử (`https://ai.stem-hub.top`) hoạt động bình thường.
  - [ ] Link báo cáo PDF/Word mở xem được ở chế độ "Bất kỳ ai có liên kết đều có thể xem".
- [ ] Kiểm tra mục **Khai báo AI, mã nguồn & dữ liệu bên ngoài** và gắn đúng nhãn nguồn thứ cấp (nếu có).
- [ ] Người quyết định tự kiểm tra và bấm xác nhận nộp bài trước `13:15`.

