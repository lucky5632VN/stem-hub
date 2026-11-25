# BỘ CÂU HỎI PHẢN BIỆN BAN GIÁM KHẢO & VỊ TRÍ MÃ NGUỒN CẢI TIẾN — DỰ ÁN STEM HUB

> **Mã dự án**: AI26B0012  
> **Mục đích**: Tài liệu tra cứu nhanh vị trí tệp nguồn, dòng code và hướng dẫn trả lời trung thực trước Hội đồng Giám khảo về cơ chế so sánh Bật/Tắt RAG cùng các hạng mục cải tiến kỹ thuật Chặng 1.

---

## PHẦN 1: CODE "TẮT / BẬT RAG ĐỂ SO SÁNH" NẰM Ở ĐÂU?

Trong hệ thống STEM HUB, cơ chế so sánh đối chứng giữa **Không RAG (Baseline LLM thuần)** và **Có RAG + Pedagogical Guard** được triển khai đồng bộ ở **3 cấp độ**:

### 1. Cấp độ Thực nghiệm Khoa học (Core Ablation Engine)
* **Tệp nguồn**: `scripts/run_ablation_real.mjs`
* **Điều kiện 1 — Không RAG (`no_rag`)** (`scripts/run_ablation_real.mjs`, dòng 644–681):
  * Khóa điều kiện: `condition: 'no_rag'`, `contextText: ''`, `retrievedChunkIds: []`.
  * Prompt gửi tới mô hình chỉ gồm câu hỏi thô (`prompt: item.question`) và hướng dẫn cơ bản `BASE_SYSTEM_INSTRUCTION` (không cung cấp đoạn trích SGK hay luật ràng buộc căn cứ).
```javascript
const noRagKey = buildCacheKey({
  condition: 'no_rag',
  item,
  runIndex: r,
  model: RUN_CONFIG.model,
  systemInstruction: BASE_SYSTEM_INSTRUCTION,
  datasetVersion: currentDatasetVersion,
  datasetSha256: expectedHash,
  corpusHash: stemCorpusHash,
  contextText: '',
  retrievedChunkIds: []
});
const noRagRes = await executeCachedCall({
  keyId: noRagKey,
  prompt: item.question,
  systemInstruction: BASE_SYSTEM_INSTRUCTION,
  temperature: RUN_CONFIG.temperature
});
```

* **Điều kiện 2 — Có RAG + Pedagogical Guard (`rag_guard`)** (`scripts/run_ablation_real.mjs`, dòng 585–597 và 683–732):
  * Gọi `retrieveTopK(item.question, 2, { staticOnly: true, allowedChunkIds: FROZEN_303_CHUNK_IDS })` để truy xuất 2 trích đoạn từ đúng 303 chunk SGK đóng băng.
  * Ghép trích đoạn vào prompt: `Tài liệu SGK tham khảo:\n${ragContextText}\n\nCâu hỏi: ${item.question}`.
  * Kết hợp `PEDAGOGICAL_GUARD` vào system instruction, buộc mô hình chỉ khẳng định công thức/định lý có căn cứ SGK và từ chối nếu ngữ liệu không đủ.
  * Hậu kiểm câu trả lời thông qua `verifyResponseGrounding()`.
```javascript
const retrievedChunks = retrieveTopK(item.question, 2, {
  staticOnly: true,
  allowedChunkIds: FROZEN_303_CHUNK_IDS
});
const ragPrompt = ragContextText
  ? `Tài liệu SGK tham khảo:\n${ragContextText}\n\nCâu hỏi: ${item.question}`
  : item.question;

const ragKey = buildCacheKey({
  condition: 'rag_guard',
  item,
  runIndex: r,
  model: RUN_CONFIG.model,
  systemInstruction: `${BASE_SYSTEM_INSTRUCTION}\n${PEDAGOGICAL_GUARD}`,
  datasetVersion: currentDatasetVersion,
  datasetSha256: expectedHash,
  corpusHash: stemCorpusHash,
  contextText: ragContextText,
  retrievedChunkIds: chunkIdsInContext
});
```

* **Điều kiện 3 — Chỉ truy xuất RAG (`condition_3_retrieval_only`)** (`scripts/run_ablation_real.mjs`, dòng 609–640):
  * Đánh giá khả năng truy xuất ngữ liệu offline (TF-IDF / BM25 Hybrid) với ngưỡng tương đồng `topScore >= 0.30` mà không tiêu tốn API call hay token LLM.

### 2. Cấp độ Giao diện Web Thẩm định Chuyên môn (Teacher Portal UI)
* **Tệp nguồn**: `src/app/danh-gia-chuyen-mon/page.js`
* **Bộ nút chuyển đổi nguồn so sánh** (dòng 138 và dòng 1030–1075):
  * Quản lý qua biến trạng thái `confusionSource`:
    * `'teacher'` (mặc định): Hiển thị kết quả chấm độc lập thực tế của giáo viên (đã lọc bỏ `isDemo`).
    * `'bench150_compare'`: Bật chế độ **So sánh đối đầu song song 2 mô hình (Không RAG vs Có RAG)**.
    * `'bench150_rag'`: Hiển thị ma trận nhầm lẫn 2x2 và phân rã tiêu chí của riêng nhánh Có RAG.
    * `'bench150_base'`: Hiển thị ma trận nhầm lẫn 2x2 và phân rã tiêu chí của riêng nhánh Không RAG.
* **Bảng đối đầu trực quan** (dòng 1099–1233): Đối chiếu song song 8 chỉ số định lượng (Accuracy, Precision, Recall, Specificity, F1-Score, Cohen's Kappa, Đúng đáp án số học, Đúng trình bày logic) kèm phần chênh lệch điểm phần trăm.

### 3. Cấp độ Trợ lý AI Thực tế của Học sinh (Production Assistant)
* **Tệp nguồn**: `src/components/organisms/GlobalAIAssistant.jsx` (dòng 1911–1959)
* **Cơ chế Strict Grounding Abstention**:
  * Khi học sinh gửi câu hỏi, hệ thống truy xuất top-3 ngữ liệu qua `retrieveTopK(textToSend, 3)`.
  * **Khi không tìm thấy căn cứ SGK (`topScore < 0.30`)**: Hệ thống **ngừng gọi LLM thông thường**, trả về cảnh báo thiếu căn cứ kèm nút tùy chọn `[[BTN_EXPANDED_AI_REPLY]]`.
  * **Khi học sinh chủ động bấm nút mở rộng (`isExpandedOverride = true`)**: Hệ thống mới cho phép mô hình gợi ý tham khảo mở rộng (không có trích đoạn SGK), đồng thời gắn nhãn cảnh báo: `"💡 Nội dung tham khảo mở rộng từ AI, chưa đối sánh trực tiếp với SGK chuẩn."`

---

## PHẦN 2: BỘ CÂU HỎI BAN GIÁM KHẢO CÓ THỂ HỎI & VỊ TRÍ CODE ĐỐI CHỨNG

### NHÓM 1: CÔNG NGHỆ RAG, CHỐNG ẢO GIÁC & CÔ LẬP BỘ NHỚ ĐỆM

#### Câu 1: Kho ngữ liệu RAG lấy từ đâu? Làm sao chứng minh kho này không bị chỉnh sửa sau khi xem đề?
* **Vị trí code**:
  * Kho dữ liệu 303 chunk đóng băng: `src/ai-training/datasets/rag-knowledge/stem-corpus.json`
  * Chốt chặn kiểm tra mã băm & ID chunk: `scripts/run_ablation_real.mjs` (dòng 40–59 và 585–597)
* **Gợi ý trả lời**:
  * Kho ngữ liệu gồm đúng **303 chunk** biên soạn theo SGK GDPT 2018 (Toán, Vật lý, Hóa học, Sinh học lớp 10–12).
  * Tệp kho được khóa cứng bằng mã băm SHA-256 (`28f7b3382697954fd92f9c09971469d6f9d2c897e5c506fc838b800603ac2cc0`). Trước mỗi lần chạy thực nghiệm, script tự động tính SHA-256 của tệp `stem-corpus.json` và dùng tập hợp `FROZEN_303_CHUNK_IDS` để chặn mọi chunk nằm ngoài danh sách hoặc có tiền tố `bench_verified_*`.

#### Câu 2: Sau khi mô hình sinh câu trả lời, làm sao biết câu trả lời bám sát SGK hay đang tự suy diễn (hallucination)?
* **Vị trí code**:
  * Hàm hậu kiểm căn cứ: `verifyResponseGrounding()` tại `src/lib/responseVerifier.js` (bắt đầu dòng 123)
  * Điểm tích hợp API chat: `src/app/api/ai/chat/route.js` (dòng 128–138)
* **Gợi ý trả lời**:
  * Hệ thống chạy bộ hậu kiểm suy nghiệm `verifyResponseGrounding()` sau khi LLM trả lời. Bộ kiểm tra tách các công thức, con số, đại lượng trong câu trả lời và đối chiếu với các đoạn văn bản SGK đã nạp vào ngữ cảnh. Nếu có công thức hoặc số liệu không xuất hiện trong đoạn trích SGK, hệ thống đánh dấu `hasUnverifiedContent: true` và hiển thị cảnh báo để học sinh đối chiếu lại với SGK hoặc giáo viên.

#### Câu 3: Hệ thống giải quyết sự cố nhiễm tri thức tự học (`Auto-Verified` / `bench_verified_*`) và khóa bộ nhớ đệm ra sao?
* **Vị trí code**:
  * Kịch bản kiểm toán và cách ly `learned_knowledge`: `scripts/quarantine_autoverified.cjs`
  * Bộ lọc tri thức phía client: `src/lib/ragService.js` (dòng 100–150 và 887–896)
  * Tệp tri thức công khai đã làm sạch: `public/data/global-learned-knowledge.json` và `src/data/global-learned-knowledge.json` (giảm từ 176 xuống 49 mục)
  * Hàm tạo khóa cache cô lập: `buildCacheKey()` tại `scripts/run_ablation_real.mjs` (dòng 122–151)
  * Bộ kiểm thử hồi quy khóa cache: `tests/cache_key_isolation.test.mjs`
* **Gợi ý trả lời**:
  * Nhóm đã chủ động lưu trữ riêng các đợt chạy cũ vào `reports/ablation/archive_uncertain/`, xóa trống bộ nhớ đệm chính và nâng cấp khóa `buildCacheKey` để băm đủ 10 thành phần gồm: mã băm tập dữ liệu, mã băm kho 303 chunk, danh sách + mã băm ngữ cảnh truy xuất thực tế, điều kiện, mô hình, câu hỏi, system prompt và lần chạy.
  * Tệp `tests/cache_key_isolation.test.mjs` chạy 6 ca kiểm thử chứng minh khi đổi kho tri thức hoặc đổi ngữ cảnh truy xuất thì hệ thống sinh khóa mới (Cache Miss), không tái sử dụng kết quả cũ.
  * Bộ nạp `ragService.js` chặn mọi bản ghi chứa `Auto-Verified` hoặc tiền tố `bench_verified_*`, chỉ nạp tri thức đã được giáo viên con người thật duyệt.

---

### NHÓM 2: BẢO MẬT, PHÂN QUYỀN & CUSTOM CLAIMS (RBAC FAIL-CLOSED)

#### Câu 4: Phân quyền Admin và Giáo viên thực hiện ở đâu? Người dùng có thể tự sửa trường `role` trong Firestore để nâng quyền không?
* **Vị trí code**:
  * Luật bảo mật Firestore: `firestore.rules` (dòng 21–35 cho `isAdmin()`, `isTeacher()`; dòng 55–72 cho `hasNoPrivilegeEscalation()`, `isAllowedUserUpdate()`)
  * API cấp/thu hồi Custom Claims: `src/app/api/admin/reviewer-roles/route.js`
  * Xác thực JWT Token phía server: `verifyFirebaseIdToken()` tại `src/lib/firebaseAdmin.js` (dòng 134–190)
  * Bộ kiểm thử bảo mật: `tests/api_fail_closed_and_claims.test.mjs` và `tests/firestore.rules.test.js`
* **Gợi ý trả lời**:
  * Quyền quản trị và giáo viên được xác thực bằng **Firebase Custom Claims** nằm trong JWT token (`request.auth.token`), không tin cậy vào trường `role` trong Firestore document do client gửi lên.
  * Trong `firestore.rules`, hàm `hasNoPrivilegeEscalation()` liệt kê danh sách `forbiddenKeys` gồm `role`, `reviewerType`, `subjects`, `isTeamMember`, `elo`, `crystals`, `isAdmin`, `faceDescriptor` — ngăn chặn toàn bộ thao tác tự sửa quyền hạn từ phía client.
  * Tại backend Next.js, hàm `verifyFirebaseIdToken()` tuân theo cơ chế fail-closed: thiếu token hợp lệ hoặc không có quyền Admin SDK trên môi trường production sẽ trả về mã lỗi 401/403 ngay lập tức.

#### Câu 5: Quy trình đóng gói nộp bài và kiểm tra lộ lọt bí mật (API key, email cá nhân, UID) chạy bằng code nào?
* **Vị trí code**:
  * Script đóng gói staging & kiểm toán: `scripts/package_submission.mjs` (dòng 22–58 quy định danh sách loại trừ)
  * Script kiểm tra gitleaks trên git staging: `scripts/test_gitleaks_git.cjs`
* **Gợi ý trả lời**:
  * Dự án không đóng gói trực tiếp từ thư mục làm việc thô mà đi qua script `scripts/package_submission.mjs`. Script tự động loại trừ `.git`, `.env*`, `node_modules`, `.next`, `serviceAccount*.json`, nhật ký thô (`reports/ablation/raw`), tệp mapping giải mã (`secret_mapping`), thư mục lưu trữ/sao lưu (`archive_*`, `reports/backup`) và ảnh đề thi thô.
  * Sau khi sao chép 1.580 tệp sạch vào `scratch/staging_submission`, gói được quét qua cả `gitleaks dir` và `gitleaks git`, đồng thời quét PII/UID, ghi nhận kết quả 0 rò rỉ khóa bí mật.

---

### NHÓM 3: CỔNG THẨM ĐỊNH CHUYÊN MÔN, LÀM MÙ & COHEN'S KAPPA

#### Câu 6: Cơ chế làm mù (Blind Review) cho giáo viên Toán hoạt động như thế nào trong mã nguồn?
* **Vị trí code**:
  * Bộ sinh mẫu làm mù & giải mã server: `generateMathTeacherBlindReviewSet()` tại `src/lib/reviewSampler.js` (dòng 263)
  * Giao diện chấm điểm giáo viên: `src/app/danh-gia-chuyen-mon/page.js`
* **Gợi ý trả lời**:
  * Hàm `generateMathTeacherBlindReviewSet()` lấy câu hỏi Toán từ đầu ra thực tế của mô hình, tráo đổi ngẫu nhiên thứ tự hai câu trả lời (Có RAG và Không RAG) thành `Phương án A` và `Phương án B` bằng seed cố định, rồi lưu bảng ánh xạ giải mã riêng tại máy chủ (`reports/ablation/secret_mapping/`). Giao diện chấm điểm của giáo viên không hiển thị nhãn mô hình nhằm loại bỏ thiên lệch chủ quan.

#### Câu 7: Công thức Cohen's Kappa và ma trận $N=179$ ($F1 = 89.03\%$, $Kappa = 0.0273$) được tính ở đâu? Tại sao Kappa thấp dù F1 cao?
* **Vị trí code**:
  * Động cơ tính đồng thuận & khoảng tin cậy: `computeCohenKappa()` và `wilsonInterval()` tại `src/lib/reviewAgreement.js` (dòng 17–91)
  * Bảng đính chính nguồn số liệu $N=179$: `docs/phu-luc-dinh-chinh.md` và `docs/checklist-ngay-truoc-khi-nop.md`
* **Gợi ý trả lời**:
  * Công thức $\kappa = (P_o - P_e) / (1 - P_e)$ được cài đặt tại `computeCohenKappa()` trong `src/lib/reviewAgreement.js`.
  * Bộ số liệu $N=179$ ($TP=142, FP=7, FN=28, TN=2$) trích từ `risk-dataset.json` (0 phiếu từ `rev_150_*`). Do bộ dữ liệu rủi ro ban đầu bị mất cân bằng lớp nghiêm trọng (170 Positive / 9 Negative), xác suất đồng thuận ngẫu nhiên $P_e$ đạt tới $79.90\%$, kéo giá trị Kappa xuống còn $0.0273$ dù $F1$ đạt $89.03\%$. Nhóm đã tách bạch rõ số liệu này khỏi bộ thực nghiệm GDPT 2018.

#### Câu 8: Hệ thống xử lý thế nào khi số phiếu chấm thật của giáo viên ít ($n < 30$) hoặc khi tồn tại phiếu kịch bản `rev_150_*`?
* **Vị trí code**:
  * Lọc loại bỏ phiếu demo ở API: `src/app/api/reviews/report/route.js` (dòng 63–75: `r.subject === subj && !r.isDemo`)
  * Lọc loại bỏ demo trong engine đồng thuận: `src/lib/reviewAgreement.js` (dòng 106–111)
  * Ẩn phần trăm với $n < 30$ trên giao diện: `src/app/danh-gia-chuyen-mon/page.js` (dòng 1261–1276)
  * Script cách ly 150 phiếu kịch bản và gỡ claims tài khoản thử nghiệm: `scripts/dryrun_remediate_reviews_and_claims.cjs`
* **Gợi ý trả lời**:
  * API báo cáo và engine đồng thuận chỉ tổng hợp các phiếu không phải demo (`!r.isDemo`). Khi cỡ mẫu phiếu thật $n < 30$, giao diện `/danh-gia-chuyen-mon` tự động ẩn toàn bộ tỷ lệ phần trăm và chỉ số Kappa, chỉ hiển thị số đếm thô ($TP, FP, FN, TN$) cùng khung cảnh báo cỡ mẫu nhỏ để tránh suy diễn thống kê sai lệch.

---

### NHÓM 4: BỘ DỮ LIỆU ABLATION v1.4.2, CỔNG SỐ HỌC & QUY TRÌNH CHẤM

#### Câu 9: Bộ dữ liệu `v1.4.2` được khóa và đối chiếu với đề thi thật như thế nào?
* **Vị trí code**:
  * Dữ liệu khóa chính thức: `reports/ablation/ablation_dataset_100.v1.4.2.json`
  * Danh sách câu ứng viên đề thi thật: `reports/ablation/official_candidates.json`
  * Hồ sơ khóa mã băm SHA-256: `reports/ablation/dataset_hash.json` (`v1_4_2_official`)
  * Cổng kiểm tra trước khi chạy thực nghiệm: `auditAnswerKeySheet()` tại `scripts/check_answer_key.mjs` (dòng 16) và chốt chặn ở `scripts/run_ablation_real.mjs` (dòng 513–541)
* **Gợi ý trả lời**:
  * Bộ `v1.4.2` gồm 100 câu (40 câu khái niệm, 24 câu số học chính thức gắn mã `CAND_*` và phân tầng 3 mức Tầng A/B/C đối với kho SGK, 36 câu ngoài phạm vi). Toàn bộ 24 câu số học đã được kiểm tra khớp văn bản 24/24 với `official_candidates.json`.
  * Trước khi gọi API thật, `run_ablation_real.mjs` đối chiếu mã băm SHA-256 của dataset với khóa `v1_4_2_official` và xác nhận lại số lượng câu đạt chuẩn trên phiếu đối chiếu, nếu sai lệch sẽ từ chối thực thi.

#### Câu 10: Bộ chấm tự động phân biệt thế nào giữa câu số học, câu ngoài phạm vi và câu khái niệm?
* **Vị trí code**:
  * Hàm phân loại trạng thái & chấm điểm: `evaluateAnswer()` tại `scripts/run_ablation_real.mjs` (dòng 302–370)
  * Hàm so khớp số học dung sai: `matchNumericalAnswer()` tại `src/lib/ablationGrader.js` (dòng 6)
* **Gợi ý trả lời**:
  * Câu số học được chuẩn hóa dấu thập phân, trích xuất giá trị số và so khớp qua `matchNumericalAnswer()` với dung sai 2%, trả về trạng thái `"đúng"`, `"sai"` hoặc `"từ chối"`.
  * Câu ngoài phạm vi kiểm tra bộ mẫu biểu thức từ chối sư phạm, trả về `"từ chối"` (hành vi mong muốn) hoặc `"sai"`.
  * Câu khái niệm trong phạm vi (`in_scope_concept`) **không chấm tự động PASS/FAIL** mà đặt `isCorrect: null` và gán nhãn `"cần người chấm"` để chờ người chấm tay theo quy tắc đóng băng.
  * Với các nhóm phân tầng có số lượng mẫu $n < 10$, báo cáo tổng hợp (`computeAggregatedMetrics`) không xuất tỷ lệ phần trăm mà chỉ giữ phân số $k/n$.

---

### NHÓM 5: BẢO VỆ DỮ LIỆU CÁ NHÂN & PHƯƠNG ÁN THI THAY THẾ

#### Câu 11: Thí sinh từ chối xác thực khuôn mặt (sinh trắc học) có bị chặn vào phòng thi không? Dữ liệu sinh trắc được xử lý thế nào?
* **Vị trí code**:
  * Kiểm tra điều kiện 2FA tùy chọn: `src/components/layout/DashboardLayout.jsx`
  * Giao diện phòng thi: `src/app/phong-thi/page.js`
  * Nhãn đồng ý và phương án thay thế: `src/app/ho-so/page.js` (`alternativeSupervision: 'manual_teacher_supervision'`, `parentalConsentStatus: 'self_reported_unverified'`)
  * Ký phiên 2FA an toàn: `src/lib/faceAuthSecurity.js`
  * Bộ kiểm thử tự động: `tests/biometrics_alternative_exam.test.js`
  * Script di trú dữ liệu sinh trắc sang subcollection riêng tư: `scripts/migrate_biometrics_real_firestore.cjs`
* **Gợi ý trả lời**:
  * Hệ thống không ép buộc sinh trắc học để vào phòng thi: trong `DashboardLayout.jsx`, bước kiểm tra `isFaceVerified` chỉ kích hoạt khi người dùng tự bật `face2FAEnabled`. Trang phòng thi `/phong-thi` không đọc `faceDescriptor` và không kiểm tra `isFace2FAValid`, cho phép học sinh thi bình thường với phương án giám sát thay thế của giáo viên (`manual_teacher_supervision`).
  * Tài khoản thử nghiệm và học sinh lưu trạng thái đồng ý trung thực là `"học sinh tự xác nhận đã có đồng ý của phụ huynh (chưa được xác minh)"`.

#### Câu 12: Hệ thống ngăn ngừa lộ thông tin cá nhân (PII) trong luồng tự học của RAG như thế nào?
* **Vị trí code**:
  * Hàm phát hiện PII & thông tin hệ thống: `containsPersonalOrSystemInfo()` tại `src/lib/ragService.js` (dòng 21)
  * Bộ lọc khi nạp tri thức động: `src/lib/ragService.js` (dòng 130–150)
* **Gợi ý trả lời**:
  * Trước khi tri thức được dùng lại trong `ragService.js`, hàm `containsPersonalOrSystemInfo()` kiểm tra và loại bỏ nội dung chứa email, số điện thoại hoặc dấu hiệu thông tin cá nhân, kết hợp `isGreetingOrChitchat()` để lọc câu chào hỏi thông thường và yêu cầu trạng thái giáo viên duyệt thật.

---

## BẢNG TRA CỨU NHANH VỊ TRÍ CODE CÁC HẠNG MỤC CẢI TIẾN

| STT | Hạng Mục Cải Tiến | Tệp Mã Nguồn Chính | Dòng Code | Chức Năng Cốt Lõi |
|:---:|---|---|---|---|
| 1 | So sánh Bật/Tắt RAG (Ablation) | `scripts/run_ablation_real.mjs` | L644–L732 | Tách điều kiện `no_rag` (prompt thô) và `rag_guard` (303 chunk SGK + Guard). |
| 2 | Đối đầu RAG trên giao diện Web | `src/app/danh-gia-chuyen-mon/page.js` | L1030–L1233 | Chuyển chế độ xem `teacher` / `bench150_compare` / `bench150_rag` / `bench150_base`. |
| 3 | Strict Grounding Abstention | `src/components/organisms/GlobalAIAssistant.jsx` | L1911–L1959 | Cosine < 0.30 ngừng gọi LLM, báo thiếu căn cứ; cho phép mở rộng có cảnh báo. |
| 4 | Heuristic Verifier hậu kiểm | `src/lib/responseVerifier.js` | L123–L240 | Đối chiếu công thức, số liệu sinh ra với trích đoạn SGK đầu vào. |
| 5 | Đóng băng kho 303 chunk | `scripts/run_ablation_real.mjs` | L40–L59 | Khóa SHA-256 `28f7b3...` trên `stem-corpus.json`, chặn chunk ngoài danh sách. |
| 6 | Khóa bộ nhớ đệm cô lập | `scripts/run_ablation_real.mjs` | L122–L151 | Băm SHA-256 dataset, kho 303 chunk, danh sách + nội dung chunk, prompt, model. |
| 7 | Bộ test cô lập khóa cache | `tests/cache_key_isolation.test.mjs` | L1–L66 | 6 ca test kiểm chứng đổi kho hoặc đổi ngữ cảnh gây Cache Miss. |
| 8 | Chấm số học & gán nhãn thủ công | `src/lib/ablationGrader.js` & `scripts/run_ablation_real.mjs` | L6 & L302–L370 | So khớp dung sai 2% cho số học; câu khái niệm trả về `"cần người chấm"`. |
| 9 | Phân quyền Custom Claims | `firestore.rules` & `src/lib/firebaseAdmin.js` | L21–L72 & L134–L190 | Chỉ nhận `request.auth.token`, chặn client tự sửa quyền, xác thực fail-closed. |
| 10 | Cổng thẩm định & Cohen's Kappa | `src/lib/reviewAgreement.js` & `src/lib/reviewSampler.js` | L17–L111 & L263 | Xáo trộn làm mù A/B, loại phiếu `isDemo`, ẩn phần trăm khi $n < 30$. |
| 11 | Phương án thi không sinh trắc | `src/app/phong-thi/page.js` & `tests/biometrics_alternative_exam.test.js` | Toàn tệp | Không yêu cầu `faceDescriptor` khi thi; giám sát thủ công qua giáo viên. |
| 12 | Đóng gói nộp bài & Gitleaks | `scripts/package_submission.mjs` | L22–L58 | Loại tệp nhạy cảm/lưu trữ, quét `gitleaks dir` và `gitleaks git` đạt 0 leak. |
