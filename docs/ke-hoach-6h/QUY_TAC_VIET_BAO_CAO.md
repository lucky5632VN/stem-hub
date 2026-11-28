# QUY TẮC VIẾT BÁO CÁO (1 TRANG CHO LUỒNG B)

Tài liệu này áp dụng bắt buộc cho người viết báo cáo (Luồng B). Không chạm vào mã nguồn.

## 1. Nguyên tắc vàng về số liệu
1. **Không tự gõ số liệu bằng tay**: Mọi con số đo lường (số ca thử, tỷ lệ chặn, số test pass...) đều phải viết dưới dạng placeholder `{{kq:<tên_khóa>}}` theo danh sách trong `BAO_CAO_KHUNG.md` và `EVIDENCE_MANIFEST.json`.
2. **Điền số tự động**: Đến `T-30`, Luồng A chạy `node scripts/render_report_numbers.mjs`. Nếu thiếu số nào, script sẽ báo lỗi và dừng chứ không điền bừa.
3. **Ghi rõ nguồn gốc**: Mỗi bảng số liệu phải ghi chú tên lệnh chạy, thời điểm chạy và tệp JSON nguồn (ví dụ: `reports/safety_eval_result.json`).

## 2. Phân loại thành phần kỹ thuật (Không đánh đồng)
Trong mọi phần mô tả giải pháp, bắt buộc tách rõ 3 loại thành phần của hệ thống:
- **Thuật toán tất định / Luật cứng**: Bộ lọc từ khóa & mẫu câu nguy hiểm (`safetyFilter.js`), `SafetyWatcher` kiểm tra PPE/tủ hút trong Lab Hóa, cơ chế khóa thao tác `hazardLevel >= 2/3` yêu cầu xác nhận giáo viên.
- **Gọi mô hình ngôn ngữ lớn (LLM ngoài)**: Google Gemini API dùng để giải thích kiến thức sư phạm khi câu hỏi đã vượt qua bộ lọc an toàn.
- **Dữ liệu tri thức / học máy**: Kho RAG 303 trích đoạn SGK GDPT 2018 và tri thức học sinh gửi lên đã qua giáo viên kiểm duyệt (`teacherVerified: true`). Không gọi dữ liệu mô phỏng hay test là "dữ liệu học sinh thật".

## 3. Từ ngữ CẤM dùng và Cách viết thay thế
- **CẤM dùng**: `"100%"`, `"hoàn hảo"`, `"tuyệt đối"`, `"chứng minh"`, `"đảm bảo an toàn tuyệt đối"`, `"không thể vượt qua"`.
- **NÊN dùng**: Ghi theo tỷ lệ đếm `k/n` (ví dụ: `chặn thành công 18/18 ca thử nguy hiểm trong bộ kiểm thử nội bộ`), nêu rõ phạm vi và giới hạn của kiểm tra từ khóa/heuristic.
- **CẤM**: Nêu tên thật giáo viên/học sinh nếu chưa có văn bản đồng ý; cấm in email thật, UID, API key; cấm trích dẫn số điều luật cụ thể.
- **Nếu có mục chưa làm kịp**: Ghi trung thực ở mục *"Giới hạn & Hạng mục chưa thực hiện"*, không làm giả hay lấp liếm cho đủ.

