# KHUNG BÁO CÁO CẢI TIẾN — ĐỀ BGK PHIÊN BẢN 1 (LUỒNG B)

> **Hướng dẫn cho Luồng B**: Các phần `[VIẾT NGAY]` có thể viết hoàn chỉnh từ bây giờ theo `QUY_TAC_VIET_BAO_CAO.md`. Các phần có `{{kq:...}}` giữ nguyên mã placeholder để `scripts/render_report_numbers.mjs` tự động điền số thật ở mốc `T-30`.

---

## 1. BỐI CẢNH & VẤN ĐỀ BGK ĐẶT RA `[VIẾT NGAY]`
- **Vấn đề**: Hệ thống STEM HUB có nội dung thí nghiệm ảo (đặc biệt phòng Lab Hóa học) và trợ lý AI sinh câu trả lời cho học sinh (NOVA HUD & Chatbot Lab Hóa).
- **Yêu cầu cải tiến**:
  1. Giữ bộ lọc hóa chất nguy hiểm (ngăn thao tác/câu hỏi chế tạo chất nổ, khí độc, hóa chất cấm).
  2. Thiết lập cơ chế hướng dẫn có giám sát cho các nội dung/thí nghiệm rủi ro cao.
  3. Không để AI thay giáo viên xác nhận thao tác rủi ro.

## 2. KIẾN TRÚC KIỂM SOÁT AN TOÀN 3 LỚP `[VIẾT NGAY]`
*(Lưu ý phân loại rõ thành phần theo quy tắc trung thực)*:
- **Lớp 1 — Bộ lọc tất định (Deterministic Rule-based Filter)**:
  - Thực thi tại `src/lib/safetyFilter.js` trước khi gọi LLM và tại `SafetyWatcher` trong `public/labs/lab-hoa-sandbox/public/chemistry_engine.js`.
  - Phân loại đầu vào thành 3 mức: `BLOCKED_HAZARD` (chặn cứng), `SUPERVISED_RISK` (hướng dẫn có giám sát), `SAFE`.
- **Lớp 2 — Hậu kiểm & Chống AI tự xác nhận thao tác rủi ro (Deterministic Post-check + Human-in-the-loop Gate)**:
  - Thực thi tại `src/app/api/ai/chat/route.js` và `public/labs/lab-hoa-sandbox/public/lab.js`.
  - Nếu câu hỏi hoặc phản ứng thuộc mức rủi ro cao (`hazardLevel >= 2/3` hoặc thiếu thiết bị bảo hộ / xin xác nhận an toàn tự làm), hệ thống từ chối để AI tự xác nhận và yêu cầu xác nhận trực tiếp của Giáo viên.
- **Lớp 3 — Sinh câu trả lời sư phạm có trích dẫn (LLM + RAG SGK GDPT 2018)**:
  - Chỉ gọi Google Gemini API khi yêu cầu đã qua Lớp 1, kết hợp 303 trích đoạn SGK GDPT 2018 và luồng gửi giáo viên duyệt (`learned_knowledge`).

## 3. KẾT QUẢ THỬ NGHIỆM CA NGUY HIỂM & PHẢN HỒI HỆ THỐNG `[CHỜ KẾT QUẢ TỪ reports/safety_eval_result.json]`
- Nguồn dữ liệu: `reports/safety_eval_result.json` (sinh bởi lệnh `node scripts/eval_safety_cases.mjs` lúc `{{kq:safety_eval_timestamp}}`).

| Nhóm ca thử | Số lượng ca | Kết quả đạt | Ghi chú hành vi hệ thống |
| :--- | :--- | :--- | :--- |
| Ca yêu cầu nguy hiểm (chất nổ, khí độc, chất cấm) | `{{kq:blocked_total}}` | Chặn được `{{kq:blocked_pass}}`/`{{kq:blocked_total}}` | Từ chối tất định trước khi gọi LLM (`BLOCKED_HAZARD`) |
| Ca thí nghiệm/câu hỏi rủi ro cần giám sát | `{{kq:supervised_total}}` | Gắn nhãn giám sát `{{kq:supervised_pass}}`/`{{kq:supervised_total}}` | Hiện hướng dẫn có giám sát + cảnh báo bảo hộ |
| Ca ép AI xác nhận thao tác rủi ro thay giáo viên | `{{kq:no_ai_approval_total}}` | Từ chối xác nhận thay GV `{{kq:no_ai_approval_pass}}`/`{{kq:no_ai_approval_total}}` | Yêu cầu xác nhận từ giáo viên (`requiresTeacherApproval: true`) |
| Ca học tập bình thường (không chặn nhầm) | `{{kq:safe_total}}` | Cho phép đi qua `{{kq:safe_pass}}`/`{{kq:safe_total}}` | Đảm bảo không chặn nhầm câu hỏi SGK hợp lệ |

*(Luồng B chừa sẵn 1 bảng trích dẫn mẫu 3–5 ca thử tiêu biểu lấy từ `reports/safety_eval_result.json` sau khi nhận tệp lúc `11:20`)*:
- **Ca mẫu 1 (`BLOCKED_HAZARD`)**: `{{kq:sample_blocked_prompt}}` -> Phản hồi: `{{kq:sample_blocked_response}}`
- **Ca mẫu 2 (`SUPERVISED_RISK`)**: `{{kq:sample_supervised_prompt}}` -> Phản hồi: `{{kq:sample_supervised_response}}`
- **Ca mẫu 3 (`NO_AI_APPROVAL`)**: `{{kq:sample_no_ai_prompt}}` -> Phản hồi: `{{kq:sample_no_ai_response}}`

## 4. KIỂM THỬ HỒI QUY, BẢO MẬT & ĐÓNG GÓI `[CHỜ KẾT QUẢ]`
- Bộ unit test nền tảng + an toàn (`npm run test:unit` & `tests/safety_control.test.mjs`): `{{kq:unit_suites_passed}}`/`{{kq:unit_suites_total}}` suite đạt yêu cầu (nguồn: `reports/unit_test_summary.json`).
- Rà soát rò rỉ bí mật (`gitleaks` trên gói staging `scripts/package_submission.mjs`): `{{kq:gitleaks_leaks}}` rò rỉ phát hiện (nguồn: `reports/security_package_summary.json`).

## 5. GIỚI HẠN & HẠNG MỤC CHƯA LÀM `[ĐIỀN SẴN THEO KẾ HOẠCH]`
1. Bộ lọc ở Lớp 1 hoạt động theo từ khóa, cụm từ tiếng Việt/tiếng Anh và biểu thức chính quy tất định; các cách diễn đạt ẩn dụ phức tạp chưa có trong từ điển vẫn phụ thuộc vào tầng kiểm soát của LLM và hậu kiểm.
2. Xác nhận của giáo viên trong Lab Hóa được thực hiện theo cơ chế phiên tại lớp/tài khoản giáo viên; chưa mở rộng thành hệ thống duyệt trực tuyến thời gian thực qua WebSocket riêng cho từng thao tác kéo thả.
3. *(Nếu cắt T05)*: Nhật ký các ca bị chặn/giám sát được lưu qua luồng API/nội bộ và cổng `Gửi GV kiểm tra` sẵn có, chưa tách thành bảng quản trị Firestore riêng biệt.

