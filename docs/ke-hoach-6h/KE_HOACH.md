# KẾ HOẠCH 6 GIỜ — ĐỀ CẢI TIẾN PHIÊN BẢN 1 (BGK)

- **Mốc bắt đầu ($T_0$)**: `07:30` (28/11/2026) — **Hạn nộp**: `13:30` (Tổng quỹ: `360 phút`)
- **Đề BGK (nguyên văn từ ảnh xác nhận nhận đề lúc `07:32:35 28/11/26`)**:
  > **1. Kiểm soát an toàn học tập**
  > - **Vấn đề**: Hệ thống có nội dung thí nghiệm và sinh câu trả lời cho học sinh.
  > - **Yêu cầu**: Giữ bộ lọc hóa chất nguy hiểm, cơ chế hướng dẫn có giám sát, không để AI thay giáo viên xác nhận thao tác rủi ro.
  > - **Minh chứng**: Ca thử yêu cầu nguy hiểm và cách hệ thống phản hồi.

---

## 1. BẢNG PHÂN RÃ YÊU CẦU (R1..R3) & HIỆN TRẠNG REPO

| Mã R | Yêu cầu nguyên văn / Diễn giải | Minh chứng BGK mong đợi & Độ rõ ràng | Tình trạng hiện tại (kèm bằng chứng trong repo) | Việc phải làm | Owner | Phút (N/T/C) | DoD (Nghiệm thu đo được) | Bằng chứng cần tạo | MoSCoW |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **R1** | **Giữ bộ lọc hóa chất nguy hiểm** (và chặn yêu cầu nguy hiểm từ học sinh khi hỏi AI hoặc thao tác Lab). | Ca thử yêu cầu nguy hiểm (chất nổ, khí độc, hóa chất cấm) và cách hệ thống phản hồi. *(Rõ)* | - Lab Hóa đã có `SafetyWatcher.checkViolation()` (`public/labs/lab-hoa-sandbox/public/chemistry_engine.js#L23-L57`) kiểm tra PPE & quạt hút khi kéo hóa chất (`lab.js#L1142-L1155`).<br>- AI Chat (`src/app/api/ai/chat/route.js#L113`) **chỉ nhắc trong system prompt**, chưa có bộ lọc tất định trước khi gọi LLM hoặc trong fallback RAG (`route.js#L157-L180`). | Tạo `src/lib/safetyFilter.js` (bộ lọc từ khóa/mẫu câu tất định 3 mức), gắn vào `/api/ai/chat` (pre-filter + fallback), `GlobalAIAssistant.jsx`, `gemini_ai.js`, và danh mục hóa chất cấm trong `chemistry_engine.js`. | Luồng A | 50 / 65 / 80 | 100% ca thử nguy hiểm (từ bộ ca chuẩn) bị chặn tất định trước khi gọi LLM, trả mã quyết định `BLOCKED_HAZARD` và thông báo từ chối an toàn. | `tests/safety_control.test.mjs` + `reports/safety_eval_result.json` | **Must** |
| **R2** | **Cơ chế hướng dẫn có giám sát** (phân tách thao tác tự do và thao tác rủi ro cao cần hướng dẫn/theo dõi của GV). | Cách hệ thống hướng dẫn học sinh theo chuẩn sư phạm có giám sát, ghi nhận ca rủi ro. *(Hơi mơ hồ ở mức độ lưu trữ)* | - Đã có luồng `learned_knowledge` (`src/app/api/learned-knowledge/route.js`) để HS gửi câu hỏi cho GV duyệt (`Gửi GV kiểm tra`), có nhãn `Đã có GV kiểm định` (`GlobalAIAssistant.jsx#L2824-L2828`).<br>- Chưa có gắn cờ `SUPERVISED_RISK` riêng cho thí nghiệm/câu hỏi hóa chất rủi ro cao và log giám sát gửi GV. | Bổ sung phân loại `SUPERVISED_RISK` trong `safetyFilter.js`, hiển thị banner "Hướng dẫn có giám sát" kèm quy trình an toàn SGK + nút gửi GV giám sát trong Chat & Lab Hóa; ghi nhận ca rủi ro qua API giám sát. | Luồng A | 45 / 55 / 70 | Các ca thao tác/hỏi đáp rủi ro cao (axit đặc, kim loại kiềm, khí độc $\text{Cl}_2$...) hiển thị cảnh báo giám sát + không trả lời kiểu "làm thoải mái", có log ca thử. | `tests/safety_control.test.mjs` + `reports/safety_eval_result.json` + ảnh/output UI | **Must** |
| **R3** | **Không để AI thay giáo viên xác nhận thao tác rủi ro** (AI và nút tự bấm của HS không được tự ý "duyệt an toàn" cho thao tác rủi ro cao). | Ca thử cố tình ép AI xác nhận thao tác nguy hiểm hoặc HS tự bấm xác nhận nổ trong Lab -> bị chặn, yêu cầu GV. *(Rõ)* | - Lớp dữ liệu chấm/RAG đã chặn AI auto-verify (`reviews/submit/route.js#L282`, `answer-key-check/route.js#L148`).<br>- **Lỗ hổng**: Trong Lab Hóa (`lab.js#L2030-L2065`, `#L2918`), phản ứng `hazardLevel >= 2` chỉ cần HS tự bấm nút "Đã hiểu" là chạy tiếp `performEffects()`. AI Chat chưa có hậu kiểm chặn câu trả lời mang tính "xác nhận an toàn thay GV". | - Trong `lab.js`: khóa phản ứng rủi ro cao (`hazardLevel >= 2` khi thiếu bảo hộ hoặc `hazardLevel >= 3`) không cho HS tự mở khóa; bắt buộc có xác nhận từ GV (role `teacher`/`admin` hoặc mã xác nhận phiên do GV cấp).<br>- Trong `/api/ai/chat`: hậu kiểm từ chối nếu câu hỏi yêu cầu AI "xác nhận an toàn / cho phép thực hiện" thao tác rủi ro. | Luồng A | 60 / 75 / 90 | Ca thử "ép AI xác nhận thao tác rủi ro" trả `requiresTeacherApproval: true` và thông báo AI không có quyền thay GV; Lab Hóa khóa thao tác rủi ro cao khi chưa có xác nhận GV. | `tests/safety_control.test.mjs` + `reports/safety_eval_result.json` + test Lab Hóa | **Must** |
| **R4** | **Kiểm thử tổng hợp, đóng gói, rà soát bí mật & triển khai đồng bộ** (phục vụ minh chứng & nộp bài). | Toàn bộ test pass, `gitleaks` sạch, bản deploy khớp code & rules. *(Rõ)* | - Baseline `npm run test:unit` đã khởi chạy kiểm tra.<br>- `scripts/package_submission.mjs` và `gitleaks` (v8.30.1) đã có sẵn trong repo/máy. | Chạy `test:unit`, `safety_control.test.mjs`, `eval_safety_cases.mjs`, `build`, `render_report_numbers.mjs`, `package_submission.mjs`, `gitleaks`; deploy khi có lệnh user. | Luồng A & B | 40 / 45 / 55 | Tất cả test pass, `EVIDENCE_MANIFEST` xanh 100%, `render_report_numbers` điền số sạch, `gitleaks` 0 rò rỉ. | Log chạy lệnh lưu tại `reports/` + gói staging sạch | **Must** |

*(Giả định minh bạch: Với R2, nếu không kịp làm bảng quản lý riêng trong Firestore cho giáo viên duyệt thao tác lab theo thời gian thực, phạm vi được thu hẹp thành lưu nhật ký an toàn + tận dụng cổng `Gửi GV kiểm tra` / `learned_knowledge` hiện có và xác nhận phiên GV tại chỗ trong Lab Hóa).*

---

## 2. TỔNG HỢP NGÂN SÁCH THỜI GIAN & QUYẾT ĐỊNH MoSCoW

- **Tổng ước tính thực thi (T01..T07)**:
  - Nhanh: `195 phút` | Thường: `240 phút` | Chậm: `295 phút`
- **Cộng 15% đệm**: `+36 phút` (theo mức thường `240 phút`) -> `276 phút`
- **Cộng giai đoạn lập kế hoạch (`20 phút`) + Đóng băng cuối (`45 phút`, từ `12:45` đến `13:30`)**: `20 + 276 + 45 = 341 phút` $\le$ `360 phút`.
- **Mục dự kiến cắt nếu trễ (>20% thời gian ở T01–T04)**:
  - Cắt **T05 (Should)** phần tạo collection Firestore mới & UI bảng duyệt riêng; thay bằng ghi log local/API chuẩn + tái sử dụng cơ chế `Gửi GV kiểm tra` sẵn có. Không bao giờ cắt T01, T02, T03, T04, T06, T07.

---

## 3. HỢP ĐỒNG GIAO TIẾP GIỮA LUỒNG A (CODE) VÀ LUỒNG B (BÁO CÁO)

| Tệp kết quả | Định dạng | Thời điểm giao | Người tạo -> Người nhận | Nội dung chính |
| :--- | :--- | :--- | :--- | :--- |
| `reports/safety_eval_result.json` | JSON | `T0 + 230 phút` (`11:20`) | Luồng A -> Luồng B (qua `render_report_numbers.mjs`) | Tổng số ca thử (`totalCases`), số ca chặn thành công (`blockedCount`), số ca giám sát (`supervisedCount`), số ca từ chối AI thay GV (`noAiApprovalCount`), danh sách từng ca thử + phản hồi rút gọn. |
| `reports/unit_test_summary.json` | JSON | `T0 + 295 phút` (`12:25`) | Luồng A -> Luồng B | Kết quả chạy `npm run test:unit` và `tests/safety_control.test.mjs` (số suite pass/fail, thời điểm chạy). |
| `reports/security_package_summary.json` | JSON | `T0 + 320 phút` (`12:50`) | Luồng A -> Luồng B | Kết quả `next build`, `package_submission.mjs`, `gitleaks` (số lỗi rò rỉ = 0). |

