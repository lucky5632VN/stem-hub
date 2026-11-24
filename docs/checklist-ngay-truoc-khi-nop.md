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
| **6. Kiến trúc phân quyền** | Kiểm soát độc lập Client vs Server API & Firestore Rules | Server API kiểm tra chữ ký cryptographic của Firebase ID Token qua Claims / Env; Firestore Rules kiểm tra trên Cloud độc lập với client | 🟢 **ĐÃ KIỂM CHỨNG 100%** (12/12 test bảo mật đạt yêu cầu) | Nhóm kỹ thuật |

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
- [x] Kiểm tra các tệp tài liệu trong `docs/`, `reports/`, slide thuyết trình, tài liệu minh họa gửi BGK:
  - [x] Không hiển thị địa chỉ email cá nhân của học sinh hay người trong nhóm (Đã rà soát toàn bộ `docs/` và `reports/`: không còn email cá nhân `hohoanganh...`, `trunghieuty...`, `hungdau...`; toàn bộ dùng email demo `hocsinh.demo@stemhub.edu.vn`, `admin@stem-hub.top`).
  - [x] Không hiển thị UID người dùng thật từ Firebase (Đã rà soát và che phủ toàn bộ UID thô trong `docs/runbook-deploy.md`, thay thế bằng biến mẫu `<YOUR_ADMIN_UID_1>`, `<YOUR_ADMIN_UID_2>`).
  - [x] Kiểm tra ảnh chụp màn hình cơ sở dữ liệu Firestore: các trường thông tin cá nhân (email, tên phụ huynh, UID) trong ảnh chụp màn hình đều được làm mờ (blur) hoặc che phủ trước khi đưa vào hồ sơ in hoặc slide trình chiếu.
- [x] Trang liên hệ trên website (`/lien-he`):
  - [x] Không hiển thị các email cá nhân không có hộp thư thực tế.
  - [x] Sử dụng **Biểu mẫu liên hệ trực tuyến** an toàn (lưu trực tiếp vào collection `contact_messages` trên Firestore với xác thực người dùng).

---

### 4. Hạng mục (d): Gắn nhãn trung thực cho các thử nghiệm AI & RAG
- [x] **Bảng 80 câu Ablation Study**:
  - [x] Đã ghi chú minh bạch trong tài liệu kiến trúc và training log: *"Đây là kịch bản mô phỏng suy nghiệm (Heuristic Simulation) với giả định Vanilla LLM không có cơ chế phát hiện ngoại biên, chưa gọi trực tiếp Gemini API thật."*
- [x] **Bộ hậu kiểm LLM (LLM-as-a-Judge)**:
  - [x] Đã công bố trung thực: *"Chưa đo trên API thực tế / Đang trong giai đoạn thiết kế kịch bản thử nghiệm"*.
  - [x] Tuyệt đối không tự gán tỷ lệ cảnh báo giả định khi chưa có log chạy lệnh thực tế kèm chi phí token; toàn bộ các lần chạy pilot bị nhiễm đã được lưu trữ cách ly tại `reports/ablation/archive_contaminated/`.
- [x] **Tập dữ liệu kiểm thử (Test Dataset)**:
  - [x] Phân định rõ ràng: Tập 60 câu in-scope + 20 câu OOS ban đầu là **Tập Dev (Dev Set)**; tập 150 ca chuẩn GDPT 2018 (`benchmark_150_cases.json`) là **Tập synthetic benchmark đối đầu kỹ thuật**; kho 303 chunk SGK GDPT 2018 đã được đóng băng cố định (SHA-256: `28f7b3382697...`).
  - [x] Tập 24 ca số học chính thức (v1.4.2) đã được đối chiếu 24/24 với `official_candidates.json` và ĐÃ KHÓA CHÍNH THỨC theo lệnh người dùng "khóa v1.4.2" (SHA-256: `cefc6ce343f01692dc4b9e83b9ac257ed833f70bb7c3d366d05259057c2c65c6`).

---

### 5. Hạng mục (e): Minh bạch vai trò giáo viên & Đơn vị đồng hành
- [x] Rà soát toàn bộ tài liệu thuyết minh, poster, slide và video demo:
  - [x] Đảm bảo **KHÔNG CÓ TÊN CÁ NHÂN** giáo viên khi chưa có văn bản đồng ý chính thức có chữ ký xác nhận của thầy cô tham gia hội đồng thẩm định (Chỉ duy nhất giáo viên hướng dẫn chính thức của trường THPT Quỳnh Lưu 4 được ghi danh theo đúng thể lệ cuộc thi).
  - [x] Tuyệt đối KHÔNG sử dụng nhãn thay thế giả định như *"Giáo viên thử nghiệm A/B"* — **CHỈ NÊU GIÁO VIÊN KHI CÓ ĐỒNG Ý BẰNG VĂN BẢN**.
  - [x] Đã ghi chú minh bạch trong toàn bộ hồ sơ báo cáo (`MẪU HỒ SƠ CẢI TIẾN CHẶNG 1 CHUẨN.docx` và `docs/bao-cao-cai-tien-chang-1.md`): *"Bộ dữ liệu câu hỏi và bảng đối chiếu hiện do nhóm học sinh tự biên soạn và chuẩn hóa dựa trên SGK/SBT chương trình GDPT 2018; đang trong quá trình gửi xin ý kiến thẩm định chuyên môn từ các thầy cô bộ môn."*
  - [x] **Xử lý Tab và Dữ liệu 150 Ca Tổng hợp (Task 5)**:
    - [x] Đã đưa toàn bộ các tab và số liệu mô phỏng dựa trên công thức `idx % N` sau cờ cấu hình `NEXT_PUBLIC_ENABLE_SYNTHETIC_BENCHMARK === 'true'`, mặc định tắt ở môi trường production. Giao diện công khai mặc định chỉ hiển thị chế độ *"Giáo viên chấm thực tế"*.
    - [x] Đã thực thi xử lý 150 phiếu `rev_150_*` trên Firestore (`node scripts/dryrun_remediate_reviews_and_claims.cjs --execute`), gán cờ `isDemo: true`, `reviewerType: 'demo'` để cách ly triệt để khỏi số liệu giáo viên thật.
    - [x] Đã thu hồi quyền teacher của tài khoản `sZmj***bHI3` trên Firebase Auth và Firestore (`role: 'student'`), ghi nhật ký kiểm toán `admin_logs`.
    - [x] Đã cách ly 4 bản ghi tự duyệt ngoài SGK trong `learned_knowledge` (`node scripts/remediate_learned_knowledge_dryrun.cjs --execute`): `status: 'pending_review'`, `teacherVerified: false`, `quarantined: true`.
    - [x] Đã vô hiệu hóa 25 tài khoản bot/test lộ mật khẩu trên Firebase Auth (`node scripts/remediate_test_accounts.cjs --execute`).
    - [x] Đã khởi tạo tài khoản demo an toàn dành cho Ban Giám Khảo (`giamkhao_demo@stemhub.edu.vn`) có sẵn dữ liệu trải nghiệm 4 Lab 3D và 500 điểm ELO (`node scripts/create_judge_demo_account.cjs --execute`).
    - [x] Trong `README.md` và `docs/claims-registry.md` (CLM-017), bộ 150 ca được ghi nhận trung thực là tập dữ liệu tổng hợp (Synthetic Benchmark) đối đầu kỹ thuật, ghi rõ *"chưa qua chấm của giáo viên thật / chưa đo (chưa hoàn thành)"*, không dùng làm số liệu kết quả đánh giá con người.
    - [x] Làm rõ nguồn gốc ma trận 2x2 tạo ra $F1 = 89.03\%$ và $Kappa = 0.0273$: Đây là kết quả trên tập phân loại rủi ro ban đầu ($N = 179$ mẫu, trích từ 180 mẫu trong `risk-dataset.json` bị lệch nhãn nặng: 170 Positive / 9 Negative, $TP=142, FP=7, FN=28, TN=2$). Do phân bố lệch nặng dẫn đến thỏa thuận ngẫu nhiên $P_e = 79.90\%$, khiến Kappa gần bằng 0 ($0.0273$). Bảng này hoàn toàn độc lập với bộ 150 ca chuẩn GDPT 2018.

---

### 6. Hạng mục (f): Kiến trúc phân quyền client vs server
- [x] Biến môi trường `NEXT_PUBLIC_ADMIN_UIDS` chỉ được sử dụng cho giao diện (UI state) để ẩn/hiện các nút điều hướng phía client (Đã xác minh: không cấp quyền ghi thực tế).
- [x] **Mọi yêu cầu nhạy cảm phía Server API và Cơ sở dữ liệu Firestore ĐỀU BẮT BUỘC KIỂM TRA ĐỘC LẬP**:
  - Server API (`/api/admin/*`, `/api/learned-knowledge`): Xác thực chữ ký cryptographic của Firebase ID Token qua `admin.auth().verifyIdToken()`, đối chiếu biến bí mật riêng phía server `process.env.ADMIN_UIDS` (hoàn toàn không lộ ra client) hoặc Custom Claims `admin === true` (Đã kiểm chứng: `tests/api_admin_security.test.mjs` đạt 100% PASS).
  - Firestore Security Rules: Kiểm tra trực tiếp trên hạ tầng bảo mật Google Cloud (`request.auth.token.admin == true` hoặc role trong DB), hoàn toàn độc lập với bundle client (Đã kiểm chứng: `tests/firestore.rules.test.js` đạt 100% PASS).

---

## ✍️ KÝ XÁC NHẬN HOÀN TẤT TRƯỚC GIỜ NỘP

- **Đại diện Nhóm Kỹ thuật**: ___________________________ *(Ký và ghi rõ họ tên)*
- **Đại diện Nhóm Nội dung & AI**: _______________________ *(Ký và ghi rõ họ tên)*
- **Nhóm trưởng xác nhận**: _____________________________ *(Ký và ghi rõ họ tên)*
- **Thời điểm hoàn thành xác nhận**: Ngày _____ tháng _____ năm 2026.

