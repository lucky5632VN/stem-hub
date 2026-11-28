# EVIDENCE MANIFEST — DANH MỤC BẰNG CHỨNG BÁO CÁO

Mọi con số trong báo cáo đều bắt nguồn từ lệnh chạy thực tế dưới đây.

| ID | Tuyên bố | Lệnh sinh ra | Tệp kết quả | Placeholder liên kết | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `baseline_unit_tests` | 16 suite unit test nền tảng hiện có đều pass trước khi sửa code | `npm run test:unit` | `reports/unit_test_summary.json` | *(baseline)* | **verified** |
| `safety_eval_cases` | 20 ca thử: chặn nguy hiểm `6/6`, giám sát `5/5`, chặn AI xác nhận thay GV `4/4`, không chặn nhầm `5/5` | `node scripts/eval_safety_cases.mjs` | `reports/safety_eval_result.json` | `safety_eval_timestamp`, `blocked_*`, `supervised_*`, `no_ai_approval_*`, `safe_*`, `sample_*` | **verified** |
| `final_unit_and_safety_tests` | `17/17` suite (`test:unit` + `safety_control.test.mjs`) và `npm run build` đều PASS | `npm run test:unit && node tests/safety_control.test.mjs` | `reports/unit_test_summary.json` | `unit_suites_passed`, `unit_suites_total` | **verified** |
| `security_and_packaging` | 1.612 tệp staging sạch, `gitleaks` phát hiện `0` rò rỉ | `node scripts/package_submission.mjs` | `reports/security_package_summary.json` | `gitleaks_leaks` | **verified** |
