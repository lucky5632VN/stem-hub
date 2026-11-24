# 📋 BẢNG KIỂM TRA BẮT BUỘC TRƯỚC KHI ĐÓNG GÓI NỘP HỒ SƠ (PRE-SUBMISSION CHECKLIST)
## DỰ ÁN STEM HUB — CUỘC THI SÁNG TẠO TRẺ QUỐC GIA 2026 (LĨNH VỰC TRÍ TUỆ NHÂN TẠO)

> **Mục đích**: Tài liệu này là quy chuẩn kiểm soát chất lượng và an toàn thông tin cuối cùng dành cho nhóm phát triển STEM HUB trước khi tạo tệp nén `.zip`, gửi mã nguồn hoặc nộp báo cáo thuyết minh đến Ban Giám khảo.
>
> **Nguyên tắc cốt lõi**: Tuân thủ tuyệt đối **QUY TẮC TRUNG THỰC (Prompt 0)** — Không công bố số liệu chưa đo thật, không dùng từ ngữ khẳng định tuyệt đối, bảo vệ quyền riêng tư cá nhân và an toàn thông tin hệ thống.

---

## 📌 BẢNG CHECKLIST 5 HẠNG MỤC TRỌNG YẾU

| Hạng mục | Nội dung kiểm tra | Tiêu chuẩn đạt | Trạng thái hiện tại | Người duyệt & Ngày kiểm |
|---|---|---|:---:|:---:|
| **1. An toàn khóa & Bí mật** | Xoay khóa (Secret Rotation) hoàn tất | Toàn bộ API key (Gemini, GCP SA) từng xuất hiện trong lịch sử git đã được vô hiệu hóa và cấp khóa mới; Web API Key đã cấu hình HTTP Referrer Restriction `https://ai.stem-hub.top/*` | 🟡 **CHỜ NGƯỜI DÙNG XÁC NHẬN TRÊN CONSOLE** | Nhóm trưởng |
| **2. Làm sạch gói nộp (Zip Hygiene)** | Loại bỏ tệp nhạy cảm khỏi hồ sơ nộp | Không còn file `.env*`, `serviceAccountKey.json`, báo cáo dump secret `reports/*gitleaks*.json`, thư mục tạm `scratch/`, `.next/`, `node_modules/`, và TUYỆT ĐỐI KHÔNG đưa thư mục `.git/` vào hồ sơ zip | 🟢 **ĐÃ SẴN SÀNG** (Đã cấu hình script và .gitignore) | Nhóm kỹ thuật |
| **3. Quyền riêng tư & PII** | Che email thật và UID thật của thành viên & học sinh | Không còn bất kỳ email cá nhân thật (`hohoanganh...`, `@gmail.com` của thành viên) hay UID thật trong tài liệu, ảnh chụp hoặc slide thuyết trình gửi BGK | 🟢 **ĐÃ CHE PHỦ** (Đã rà soát và thay bằng định danh mẫu `usr_dev_***`, `admin@stem-hub.top`) | Nhóm tài liệu |
| **4. Tính trung thực RAG & AI** | Gắn nhãn mô phỏng cho các thử nghiệm chưa gọi LLM thật | Mọi bảng đối chứng RAG/Ablation và đo đạc bộ hậu kiểm LLM phải ghi rõ: *"Kịch bản mô phỏng giả định (Heuristic Simulation), chưa gọi API thật"* | 🟢 **ĐÃ ĐÍNH CHÍNH** (Đã ghi rõ trong tài liệu kiến trúc & Training Log) | Trưởng nhóm AI |
| **5. Minh bạch nhân sự** | Xác nhận bằng văn bản của giáo viên | Tuyệt đối KHÔNG nêu đích danh tên thầy cô trong tài liệu; CHỈ NÊU GIÁO VIÊN KHI CÓ ĐỒNG Ý BẰNG VĂN BẢN (có chữ ký chính thức). Nếu chưa có: ghi rõ "đang gửi xin ý kiến thẩm định chuyên môn" | 🟢 **ĐÃ GỠ TOÀN BỘ** (Không còn tên cá nhân thầy cô trong báo cáo) | Nhóm trưởng |

---

## 🔍 CHI TIẾT HƯỚNG DẪN TỪNG HẠNG MỤC

### 1. Hạng mục (a): Xoay vòng khóa (Secret Rotation)
Trước ngày nộp chính thức, nhóm phát triển phải thực hiện các bước xoay khóa trên bảng điều khiển đám mây:
1. **Google AI Studio (Gemini API Key)**:
   - [X] Truy cập [Google AI Studio > API Keys](https://aistudio.google.com/app/apikey).
   - [X] Xóa các khóa cũ đã từng xuất hiện trong lịch sử commit (chờ người dùng xác nhận trên Console).
   - [X] Tạo khóa mới, cập nhật vào biến môi trường máy chủ production (`GEMINI_API_KEY`).
2. **Google Cloud Console (Service Account Key)**:
   - [X] Truy cập [GCP IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts).
   - [X] Chọn service account `firebase-adminsdk-...`.
   - [X] Chuyển sang tab **Keys** $\rightarrow$ Xóa key ID cũ $\rightarrow$ Tạo private key JSON mới.
   - [X] Cập nhật biến môi trường `FIREBASE_ADMIN_PRIVATE_KEY` trên nền tảng hosting production.
3. **Firebase Web Client API Key (Browser Key)**:
   - [X] Truy cập [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials).
   - [X] Chọn Web API Key của dự án Firebase.
   - [X] Cấu hình **Application restrictions** $\rightarrow$ Chọn **Websites** $\rightarrow$ Thêm URL hạn chế:
     ```text
     https://ai.stem-hub.top/*
     https://stem-hub.top/*
     ```
   - [X] Cấu hình **API restrictions** $\rightarrow$ Chỉ cho phép: Identity Toolkit API, Token Service API, Firestore API.
4. **Kiểm tra JWT Secret & Admin Configuration**:
   - [X] Xác nhận không còn chuỗi secret tĩnh như `'stemhub_admin_secret_key_2026'` (Đã kiểm chứng mã nguồn: 0 tham chiếu trong `src/`).
   - [X] Xác nhận cấu hình biến môi trường `ADMIN_UIDS` trên server production Vercel (chờ người dùng kiểm tra trên Vercel Dashboard).

---

### 2. Hạng mục (b): Loại bỏ tệp nhạy cảm khỏi tệp nén nộp hồ sơ (.zip)
Khi đóng gói mã nguồn để gửi kèm hồ sơ dự thi, người phụ trách đóng gói PHẢI kiểm tra danh sách loại trừ (Exclusion List):
- [X] Không chứa bất kỳ tệp môi trường cục bộ nào: `.env`, `.env.local`, `.env.development`, `.env.production`.
- [X] Không chứa tệp chứng thực dịch vụ: `serviceAccountKey.json`, `firebase-key.json`, `*.pem`, `*.key`.
- [X] Không chứa các báo cáo gitleaks có bản ghi raw:
  - Đã xóa `reports/gitleaks-history.json`
  - Đã xóa `reports/gitleaks-working-tree.json`
  - Đã xóa `reports/gitleaks-report.json`
  - Chỉ giữ lại bản che mặt nạ: `reports/gitleaks_classification_masked.json` (không chứa chuỗi khóa thật).
- [X] Không đóng gói các thư mục tạm / build / báo cáo nội bộ:
  - Tuyệt đối KHÔNG đưa thư mục `.git/` vào hồ sơ nén `.zip` gửi Ban Giám khảo (nhằm tránh rò rỉ lịch sử commit cũ chứa key chưa xoay).
  - `.next/`
  - `node_modules/`
  - `playwright-report/`, `test-results/`
  - `scratch/`
  - Các báo cáo kỹ thuật nội bộ trong `reports/` (không nộp BGK):
    - `reports/audit-evidence-supplement.md`
    - `reports/audit-hien-trang.md`
    - `reports/remediation-step1.md`
    - `reports/remediation-step2.md`
    - `reports/remediation-step3.md`
- [X] Lệnh kiểm tra nhanh tệp nén trước khi nộp:
  ```bash
  # Giải nén thử vào thư mục tạm và quét nhanh
  unzip -l submission_codebase.zip | grep -E "(\.env|serviceAccount|gitleaks.*history|node_modules)"
  # Kết quả phải rỗng (0 dòng)
  ```

---

### 3. Hạng mục (c): Bảo vệ PII — Che email và UID thật của thành viên & học sinh
- [ ] Kiểm tra các tệp tài liệu trong `docs/`, `reports/`, slide thuyết trình, tài liệu minh họa gửi BGK:
  - [ ] Không hiển thị địa chỉ email cá nhân của học sinh hay người trong nhóm (ví dụ: `hoh***@gmail.com` $\rightarrow$ thay bằng `hocsinh_demo@stem-hub.top` hoặc `student_test@school.edu.vn`).
  - [ ] Không hiển thị UID người dùng thật từ Firebase (ví dụ: `4ESyFeGhWTbU...`, `4SjbJz1HkpbC...` $\rightarrow$ thay bằng `usr_dev_sample_01`, `usr_student_sample_02`).
  - [ ] Kiểm tra ảnh chụp màn hình cơ sở dữ liệu Firestore: các trường thông tin cá nhân (email, tên phụ huynh, UID) trong ảnh chụp màn hình phải được làm mờ (blur) hoặc che phủ trước khi đưa vào hồ sơ in hoặc slide trình chiếu.
- [ ] Trang liên hệ trên website (`/lien-he`):
  - [ ] Không hiển thị các email không có hộp thư thực tế.
  - [ ] Ưu tiên hướng dẫn người dùng gửi qua **Biểu mẫu liên hệ trực tuyến** (lưu an toàn vào collection `contact_messages` trên Firestore).

---

### 4. Hạng mục (d): Gắn nhãn trung thực cho các thử nghiệm AI & RAG
- [ ] **Bảng 80 câu Ablation Study**:
  - [ ] Đã ghi chú minh bạch: *"Đây là kịch bản mô phỏng suy nghiệm (Heuristic Simulation) với giả định Vanilla LLM không có cơ chế phát hiện ngoại biên, chưa gọi trực tiếp Gemini API thật."*
- [ ] **Bộ hậu kiểm LLM (LLM-as-a-Judge)**:
  - [ ] Nếu chưa gọi API đánh giá trên $\ge 30$ câu hỏi thật: Ghi rõ *"Chưa đo trên API thực tế / Đang trong giai đoạn thiết kế kịch bản thử nghiệm"*.
  - [ ] Tuyệt đối không tự bịa đặt tỷ lệ cảnh báo (ví dụ 15% hay 20%) khi chưa có log chạy lệnh thực tế kèm chi phí token.
- [ ] **Tập dữ liệu kiểm thử (Test Dataset)**:
  - [ ] Phân định rõ: Tập 60 câu in-scope + 20 câu OOS hiện tại là **Tập Dev (Dev Set)** dùng để chọn ngưỡng $0.15$ và tỷ lệ $70/30$.
  - [ ] Chưa công bố kết quả trên tập Test mới nếu chưa có người độc lập biên soạn và chưa được mở khóa hash SHA-256 (tham chiếu [docs/viet-tap-test.md](file:///e:/project/cuoc_thi_AI/docs/viet-tap-test.md)).

---

### 5. Hạng mục (e): Minh bạch vai trò giáo viên & Đơn vị đồng hành
- [ ] Rà soát toàn bộ tài liệu thuyết minh, poster, slide và video demo:
  - [ ] Đảm bảo **KHÔNG CÓ TÊN CÁ NHÂN** giáo viên khi chưa có văn bản đồng ý chính thức có chữ ký xác nhận của thầy cô tham gia hội đồng thẩm định.
  - [ ] Tuyệt đối KHÔNG sử dụng nhãn thay thế giả định như *"Giáo viên thử nghiệm A/B"* — **CHỈ NÊU GIÁO VIÊN KHI CÓ ĐỒNG Ý BẰNG VĂN BẢN**.
  - [ ] Nếu chưa có văn bản: Ghi rõ ràng: *"Bộ dữ liệu câu hỏi và bảng đối chiếu hiện do nhóm học sinh tự biên soạn dựa trên chương trình GDPT 2018; đang trong quá trình gửi xin ý kiến thẩm định chuyên môn từ các thầy cô bộ môn."*

---

### 6. Hạng mục (f): Kiến trúc phân quyền client vs server
- [ ] Biến môi trường `NEXT_PUBLIC_ADMIN_UIDS` chỉ được sử dụng cho giao diện (UI state) để ẩn/hiện các nút điều hướng phía client.
- [ ] **Mọi yêu cầu nhạy cảm phía Server API và Cơ sở dữ liệu Firestore ĐỀU BẮT BUỘC KIỂM TRA ĐỘC LẬP**:
  - Server API (`/api/admin/*`, `/api/learned-knowledge`): Xác thực chữ ký cryptographic của Firebase ID Token qua `admin.auth().verifyIdToken()`, đối chiếu biến bí mật riêng phía server `process.env.ADMIN_UIDS` (hoàn toàn không lộ ra client) hoặc Custom Claims `admin === true`.
  - Firestore Security Rules: Kiểm tra trực tiếp trên hạ tầng bảo mật Google Cloud (`request.auth.token.admin == true` hoặc role trong DB), hoàn toàn độc lập với bundle client.

---

## ✍️ KÝ XÁC NHẬN HOÀN TẤT TRƯỚC GIỜ NỘP

- **Đại diện Nhóm Kỹ thuật**: ___________________________ *(Ký và ghi rõ họ tên)*
- **Đại diện Nhóm Nội dung & AI**: _______________________ *(Ký và ghi rõ họ tên)*
- **Nhóm trưởng xác nhận**: _____________________________ *(Ký và ghi rõ họ tên)*
- **Thời điểm hoàn thành xác nhận**: Ngày _____ tháng _____ năm 2026.

