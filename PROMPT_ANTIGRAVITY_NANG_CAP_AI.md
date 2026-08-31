# 🎯 MASTER PROMPT — NÂNG CẤP HỆ THỐNG AI STEM HUB (5 LAB + AI TỔNG JAVIT)
> Dán toàn bộ nội dung dưới đây vào Google Antigravity. Đây là một task nhiều giai đoạn (multi-phase) —
> yêu cầu Antigravity thực hiện TUẦN TỰ, không được nhảy cóc, và phải dừng lại xin xác nhận sau mỗi PHASE.

---

## ⚠️ PHẦN 0 — QUY TẮC AN TOÀN BẮT BUỘC (ĐỌC TRƯỚC KHI ĐỘNG VÀO BẤT KỲ FILE NÀO)

Bạn (Antigravity) PHẢI tuân thủ nghiêm ngặt các quy tắc sau trong suốt quá trình làm việc. Nếu bất kỳ quy tắc nào bị vi phạm, DỪNG LẠI và báo cáo ngay, không tự ý tiếp tục.

### 0.1 Sao lưu & Rollback (làm TRƯỚC TIÊN, trước cả PHASE 1)
1. Kiểm tra xem project đã có Git chưa (`git status`). Nếu chưa có, chạy `git init` và `git add -A && git commit -m "chore: baseline snapshot before AI upgrade"` để tạo điểm mốc gốc.
2. Nếu đã có Git, PHẢI tạo một **branch riêng** cho toàn bộ công việc này, không được sửa trực tiếp trên `main`/`master`:
   ```
   git checkout -b feature/ai-self-trained-upgrade
   ```
3. Tạo thêm một **Git tag** đánh dấu điểm khởi đầu để rollback nhanh trong mọi trường hợp:
   ```
   git tag before-ai-upgrade
   ```
4. NGOÀI Git, hãy copy toàn bộ thư mục project ra một bản sao vật lý riêng (ví dụ `../stem-hub-BACKUP-<ngày>`), để có phương án dự phòng ngay cả khi Git bị thao tác sai.
5. Sau MỖI PHASE nhỏ hoàn thành và chạy thử thành công, commit riêng với message rõ ràng theo format:
   `feat(ai-upgrade): [PHASE X] mô tả ngắn gọn` — không gộp nhiều phase vào 1 commit.
6. KHÔNG BAO GIỜ xóa file gốc (`gemini_ai.js`, `physicsEngine.js`, `chemistry_engine.js`, `GlobalAIAssistant.jsx`, v.v.). Nếu cần thay logic, hãy giữ nguyên hàm cũ (có thể đổi tên thành `_legacy` hoặc comment lại), viết hàm/module MỚI song song, rồi mới chuyển điểm gọi (call site) sang module mới sau khi đã test.

### 0.2 Cách Rollback khi có sự cố (ghi rõ vào README hoặc báo cho người dùng biết)
- Rollback 1 phase gần nhất: `git reset --hard HEAD~1`
- Rollback về mốc gốc hoàn toàn: `git checkout before-ai-upgrade -- .` hoặc `git reset --hard before-ai-upgrade`
- Nếu Git bị lỗi hoàn toàn: xóa toàn bộ project hiện tại, copy lại từ thư mục backup vật lý đã tạo ở bước 0.1.4.
- Sau khi hoàn tất TOÀN BỘ và người dùng xác nhận hài lòng, mới merge `feature/ai-self-trained-upgrade` vào `main`.

### 0.3 Nguyên tắc không phá vỡ hệ thống hiện có
- KHÔNG thay thế các công thức khoa học xác định (Vật lý: `calculateLaserPath`; Hóa: `calculatepH`, `checkPrecipitate`; Sinh: Hardy-Weinberg $p^2+2pq+q^2=1$) bằng mô hình học máy. Các công thức này chính xác 100% và PHẢI giữ nguyên — AI chỉ được thêm vào như một LỚP BỔ SUNG chạy song song, không thay thế.
- Mỗi phase phải có bước TEST thủ công (chạy app, thử tính năng cũ vẫn hoạt động bình thường) trước khi coi là hoàn thành.
- Nếu một phase làm phát sinh lỗi không rõ nguyên nhân sau 2 lần thử sửa, DỪNG LẠI, rollback phase đó, và báo cáo chi tiết lỗi thay vì cố sửa tiếp bằng cách đoán mò.

### 0.4 Tiêu chuẩn "AI tự huấn luyện 100%" (bắt buộc cho mọi phase bên dưới)
Đây là yêu cầu cốt lõi của cuộc thi AI cấp quốc gia — mọi AI mới thêm vào PHẢI thỏa:
1. **Có dataset rõ ràng**: lưu tại `src/ai-training/datasets/<tên-module>/` dưới dạng JSON/CSV, có thể mở ra xem được.
2. **Có script huấn luyện** (không phải chỉ gọi API ngoài để suy luận): lưu tại `src/ai-training/scripts/<tên-module>_train.js` (hoặc `.py` nếu train bằng Python rồi export sang TF.js/ONNX).
3. **Có model đã train lưu cục bộ**: file `model.json` + `weights.bin` (TensorFlow.js) hoặc tương đương, KHÔNG gọi API bên ngoài để suy luận (inference) — chỉ được dùng LLM API (Gemini) ở bước cuối cùng để **diễn đạt câu trả lời bằng ngôn ngữ tự nhiên**, không phải để ra quyết định cốt lõi.
4. **Có log huấn luyện**: ghi lại accuracy/loss, số lượng mẫu train/test, ngày train — lưu vào `TRAINING_LOG.md` ở gốc project để phục vụ AI Transparency Hub của cuộc thi.
5. **Ghi rõ ràng trong code** (comment đầu file) input là gì, output là gì, thuật toán gì, train trên bao nhiêu mẫu.

---

## 📦 PHẦN 1 — TỔNG QUAN CÁC PHASE (thực hiện tuần tự, KHÔNG song song)

| Phase | Mục tiêu | Vị trí tác động |
|---|---|---|
| Phase 2 | RAG tự xây (semantic search) thay cho `search_knowledge` giả (regex → Google link) | `GlobalAIAssistant.jsx`, dùng chung cho cả Javit và Lab Hóa AI thứ 2 |
| Phase 3 | Model phân loại rủi ro thí nghiệm cho Lab Hóa AI thứ 1 (Chỉ huy) | `public/labs/lab-ktra15p/gemini_ai.js` |
| Phase 4 | Model chẩn đoán lỗi khái niệm cho Lab Vật Lý | `src/lib/physicsEngine.js` (thêm module mới, không sửa hàm cũ) |
| Phase 5 | Model dự đoán độ khó thích ứng cho Lab Toán | `src/lib/questionAiGenerator.js` |
| Phase 6 | Model xác suất Bayes đa gen cho Lab Sinh | `src/lib/questionAiGenerator.js` (phần Sinh) |
| Phase 7 | Intent Classifier + kích hoạt thật `subjectFrequency`/`conciseMode` cho Javit | `GlobalAIAssistant.jsx`, `useAppStore.js` |
| Phase 8 | Kiểm thử tổng thể + cập nhật `AITransparencyModal.jsx` + `TRAINING_LOG.md` | Toàn hệ thống |

**Sau mỗi Phase, dừng lại, chạy thử, commit, rồi báo cáo tóm tắt cho người dùng trước khi sang Phase tiếp theo.**

---

## 🔧 PHASE 2 — RAG TỰ XÂY (thay `search_knowledge` giả)

### Vấn đề hiện tại
`search_knowledge(query)` chỉ dùng regex/string includes để bắt từ khóa rồi tạo link `google.com/search?q=...`. Đây KHÔNG phải AI, chỉ là tạo URL. Cần thay bằng semantic search thật.

### Cách làm chi tiết
1. Thu thập nội dung kiến thức: tạo file `src/ai-training/datasets/rag-knowledge/stem-corpus.json`, mỗi phần tử có dạng:
   ```json
   { "id": "hoa-001", "subject": "hoa", "topic": "Cân bằng Le Chatelier", "content": "đoạn kiến thức 100-200 từ..." }
   ```
   Cần khoảng 300-500 đoạn (chia đều 4 môn), có thể lấy từ SGK/tài liệu ôn thi THPT QG đã có sẵn trong dự án (`questionAiGenerator.js` đã có nhiều nội dung, tái sử dụng).
2. Tính embedding cho toàn bộ corpus **một lần duy nhất, offline** (không phải tính real-time mỗi lần hỏi):
   - Dùng một model embedding mã nguồn mở, nhẹ, chạy được bằng `@xenova/transformers` (chạy hoàn toàn trong Node.js/trình duyệt, KHÔNG cần gọi API trả phí) — ví dụ model `Xenova/multilingual-e5-small` (hỗ trợ tiếng Việt).
   - Viết script `src/ai-training/scripts/build-rag-embeddings.js`: đọc `stem-corpus.json` → tính vector embedding cho từng đoạn → lưu ra `src/data/rag-vectors.json` (mảng `{id, vector: [...]}`).
3. Viết module truy vấn mới `src/lib/ragService.js`:
   - Hàm `embedQuery(text)`: dùng CÙNG model embedding trên để encode câu hỏi của học sinh thành vector (chạy client-side bằng `@xenova/transformers` trong trình duyệt, hoặc server-side nếu cần nhẹ hơn cho máy yếu).
   - Hàm `cosineSimilarity(vecA, vecB)`: công thức chuẩn $\cos(\theta) = \frac{A \cdot B}{\|A\|\|B\|}$.
   - Hàm `retrieveTopK(query, k=3)`: encode query → so với toàn bộ `rag-vectors.json` → trả về k đoạn liên quan nhất.
4. Sửa `GlobalAIAssistant.jsx`: thay lời gọi tới `generateOfflineFallbackResponse` (fallback string-match cũ) bằng luồng mới:
   `câu hỏi học sinh → ragService.retrieveTopK() → đưa đoạn liên quan nhất làm context → Gemini API chỉ dùng để DIỄN ĐẠT câu trả lời tự nhiên dựa trên context đó (không tự bịa kiến thức)`.
5. Áp dụng tương tự cho AI thứ 2 trong Lab Hóa (`gemini_ai.js`, mode `'gen'`).

### Test bắt buộc trước khi qua Phase 3
- Hỏi Javit 5 câu về 4 môn khác nhau, xác nhận câu trả lời trích đúng nội dung từ `stem-corpus.json`, không phải bịa.
- Xác nhận nút cũ (nếu học sinh hỏi ngoài phạm vi corpus) vẫn fallback về hành vi cũ, không bị lỗi trắng màn hình.

---

## 🔧 PHASE 3 — MODEL PHÂN LOẠI RỦI RO THÍ NGHIỆM (Lab Hóa AI thứ 1)

### Cách làm chi tiết
1. Xác định input features từ `getLabContext()` đã có sẵn: `currentTemp`, `currentEnergy` (IDCL %), `safetyViolations`, số lượng `deskChemicals`, có chứa hóa chất nguy hiểm hay không (tra trong danh sách hóa chất đã phân loại).
2. Tạo dataset bootstrap: viết script sinh dữ liệu giả lập có gán nhãn dựa trên luật hóa học đã biết (ví dụ: nhiệt độ > ngưỡng + hóa chất dễ cháy → nhãn "Nguy hiểm"), khoảng 500-1000 dòng, lưu tại `src/ai-training/datasets/chem-risk/risk-dataset.json`. Đây gọi là "weak supervision" — dùng luật để tạo nhãn ban đầu, hoàn toàn hợp lệ về học thuật khi ghi rõ trong tài liệu.
3. Viết script train `src/ai-training/scripts/chem-risk_train.js` dùng TensorFlow.js:
   - Model: mạng neural nhỏ 2 lớp ẩn (Dense 16 → Dense 8 → Dense 3 softmax cho 3 nhãn: An toàn/Cảnh báo/Nguy hiểm).
   - Chuẩn hóa input (min-max scaling) trước khi train.
   - Chia 80% train / 20% test, in ra accuracy cuối cùng, lưu vào `TRAINING_LOG.md`.
   - Export model: `await model.save('file://src/data/models/chem-risk-model')`.
4. Tích hợp vào `gemini_ai.js`: trước khi build system prompt cho AI thứ 1, load model đã train, chạy `model.predict()` trên context hiện tại, đưa nhãn rủi ro vào prompt để Gemini diễn giải, thay vì để Gemini tự đọc số liệu thô và tự đoán.

### Test bắt buộc
- Giả lập 3 tình huống (an toàn/cảnh báo/nguy hiểm rõ ràng), xác nhận model phân loại đúng cả 3.
- Xác nhận accuracy trên tập test ≥ 85% trước khi coi là đạt (nếu thấp hơn, quay lại bước 2 bổ sung dữ liệu, KHÔNG hạ chuẩn để "cho qua").

---

## 🔧 PHASE 4 — MODEL CHẨN ĐOÁN LỖI LAB VẬT LÝ

### Cách làm chi tiết
1. Thêm logging: mỗi lần học sinh chỉnh tham số (góc gương, vị trí nguồn) và bấm kiểm tra kết quả, ghi vào Firestore collection `physicsAttempts`: `{ params: {...}, isCorrect, errorType (nếu người dùng tự đánh giá hoặc suy ra từ độ lệch kết quả) }`.
2. Sau khi có ít nhất 200-300 lượt log thật (hoặc sinh giả lập ban đầu để có dữ liệu khởi động), export ra `src/ai-training/datasets/physics-error/attempts.json`.
3. Train model kNN đơn giản (k=5) hoặc Decision Tree bằng thư viện nhẹ (`ml-knn` hoặc tự code) để phân loại `errorType` phổ biến dựa trên `params` khi `isCorrect = false`.
4. Tích hợp: khi học sinh làm sai, gọi model để gợi ý loại lỗi khả dĩ nhất, hiển thị gợi ý trong UI hoặc để Javit chủ động nhắc.

### Test bắt buộc
- Xác nhận `calculateLaserPath` KHÔNG bị sửa đổi gì (vẫn ra kết quả y hệt trước khi thêm module này).

---

## 🔧 PHASE 5 — MODEL ĐỘ KHÓ THÍCH ỨNG LAB TOÁN

### Cách làm chi tiết
1. Thu thập dữ liệu đã có sẵn qua `fetchFirestoreQuestions`: lịch sử (ELO học sinh, độ khó câu hỏi, đúng/sai).
2. Train Logistic Regression đơn giản (dùng `src/ai-training/scripts/math-difficulty_train.js`, có thể code tay bằng gradient descent hoặc dùng TensorFlow.js `tf.layers.dense` 1 lớp với sigmoid) mô phỏng ý tưởng Item Response Theory: dự đoán xác suất trả lời đúng dựa trên (ELO học sinh − độ khó câu hỏi).
3. Tích hợp vào `generateMathQuestions()`: thay vì chọn độ khó theo ngưỡng ELO cố định, dùng model để chọn độ khó sao cho xác suất đúng dự đoán nằm trong khoảng tối ưu (khoảng 60-75%, giữ động lực học nhưng vẫn thử thách).

### Test bắt buộc
- Xác nhận đáp án đúng (`correctAns`) vẫn được tính chính xác 100% như cũ — model chỉ ảnh hưởng đến việc CHỌN độ khó, không ảnh hưởng đến việc GIẢI bài.

---

## 🔧 PHASE 6 — MODEL BAYES ĐA GEN LAB SINH

### Cách làm chi tiết
1. Giữ nguyên công thức Hardy-Weinberg 1 gen hiện có.
2. Thêm module mới `src/lib/geneticsBayes.js`: xây bảng xác suất có điều kiện (Conditional Probability Table) cho trường hợp lai 2 gen độc lập trở lên, dùng quy tắc nhân xác suất Mendel mở rộng — đây là suy luận Bayes cổ điển, không cần "train" theo nghĩa machine learning nhưng vẫn là thuật toán AI hợp lệ (Bayesian Reasoning), cần ghi rõ trong tài liệu là "AI suy luận xác suất" chứ không tự nhận là "học máy" để tránh nhầm lẫn với giám khảo.
3. Viết ít nhất 10 test case tay để đối chiếu kết quả model với xác suất tính tay, đảm bảo đúng trước khi tích hợp UI.

---

## 🔧 PHASE 7 — JAVIT: INTENT CLASSIFIER + KÍCH HOẠT THẬT `subjectFrequency`/`conciseMode`

### Vấn đề hiện tại
Tài liệu cũ có ghi 2 tính năng này nhưng code thực tế KHÔNG có — đây là rủi ro trung thực với giám khảo. Bắt buộc chọn 1 trong 2:
- (a) Xóa mô tả này khỏi mọi tài liệu nộp thi, HOẶC
- (b) Cài đặt thật (khuyến nghị chọn cách này, vì đây là tính năng cá nhân hóa dễ ăn điểm).

### Cách làm chi tiết (chọn phương án b)
1. Trong `useAppStore.js`, thêm state thật: `subjectFrequency: { toan: 0, ly: 0, hoa: 0, sinh: 0 }`, cập nhật +1 mỗi khi Javit xử lý câu hỏi thuộc môn đó (dùng chính Intent Classifier ở bước 3 để xác định môn).
2. Thêm `conciseMode: boolean`, cập nhật dựa trên phản hồi 👍/👎 của học sinh (nếu học sinh bấm 👎 nhiều lần cho câu trả lời dài → tự chuyển sang chế độ súc tích) — công thức đơn giản: nếu tỷ lệ 👎 trên câu trả lời dài > 40% trong 10 lượt gần nhất → bật `conciseMode`.
3. Xây Intent Classifier thật:
   - Tạo dataset `src/ai-training/datasets/intent/intent-samples.json`: ít nhất 300 câu mẫu tiếng Việt, gán nhãn 1 trong các lớp: `mo_lab`, `hoi_bai`, `bat_dau_thi`, `tra_cuu`, `dieu_khien_am_nhac`, `chat_thuong`.
   - Train bằng Naive Bayes văn bản đơn giản (tự code: đếm tần suất từ theo từng nhãn, tính xác suất hậu nghiệm) hoặc dùng thư viện nhẹ `natural` (Node.js) — không cần deep learning phức tạp, mô hình này dễ giải thích với giám khảo và đủ chính xác cho tập lệnh cố định hiện có.
   - Lưu model dưới dạng JSON bảng xác suất từ-nhãn tại `src/data/models/intent-classifier.json`.
4. Tích hợp vào `GlobalAIAssistant.jsx`: TRƯỚC khi gọi Gemini, chạy Intent Classifier trên câu hỏi học sinh, dùng kết quả để (a) cập nhật `subjectFrequency`, (b) quyết định có cần trigger `[[NAV:...]]` ngay không cần chờ Gemini, giúp phản hồi nhanh hơn với các lệnh rõ ràng ("mở lab hóa", "vào phòng thi").

### Test bắt buộc
- Xác nhận `isMatchOrPracticeActive()` vẫn hoạt động, HUD vẫn tự đóng khi đang thi đấu — TUYỆT ĐỐI không được phá cơ chế này.
- Thử 20 câu hỏi mẫu, đo accuracy của Intent Classifier, ghi vào `TRAINING_LOG.md`.

---

## ✅ PHASE 8 — KIỂM THỬ TỔNG THỂ & CẬP NHẬT TÀI LIỆU MINH BẠCH

1. Chạy toàn bộ regression test thủ công: mở từng route (`/`, `/dau-truong`, `/phong-thi`, `/ho-so`...), xác nhận không có tính năng cũ nào bị hỏng.
2. Cập nhật `AITransparencyModal.jsx` để hiển thị rõ 2 nhóm tách biệt:
   - **"AI tự huấn luyện"**: liệt kê từng model ở Phase 3-7, kèm link tới dataset + script train + accuracy.
   - **"Nền tảng ngôn ngữ (Gemini API)"**: chỉ dùng để diễn đạt câu trả lời cuối, không ra quyết định cốt lõi.
3. Hoàn thiện `TRAINING_LOG.md` ở gốc project với format:
   ```
   ## [Tên module] — [ngày train]
   - Thuật toán: ...
   - Số mẫu train/test: ...
   - Accuracy: ...
   - File model: ...
   - Dataset: ...
   ```
4. Commit cuối cùng: `git add -A && git commit -m "feat(ai-upgrade): complete self-trained AI integration across 5 labs + Javit"`.
5. CHỈ merge vào `main` sau khi người dùng (chủ dự án) xác nhận đã kiểm tra và hài lòng với toàn bộ kết quả.

---

## 📚 PHẦN CUỐI — GIẢI THÍCH CÁCH TRAIN CHO NGƯỜI KHÔNG CHUYÊN (đính kèm để người dùng tự hiểu, không chỉ Antigravity)

- **"Train" nghĩa là gì**: cho máy tính xem nhiều ví dụ (input → output đúng), máy tính tự điều chỉnh các con số bên trong model để lần sau gặp input tương tự sẽ đoán ra output đúng mà không cần lập trình luật cứng nhắc cho từng trường hợp.
- **Vì sao dùng TensorFlow.js**: chạy được ngay trong Node.js/trình duyệt, không cần server riêng, không tốn phí, phù hợp cho một dự án học sinh không có GPU mạnh.
- **Weak supervision (Phase 3)**: khi chưa có dữ liệu thật, dùng luật đã biết để tự tạo nhãn ban đầu — đây là kỹ thuật hợp lệ và phổ biến trong thực tế khi thiếu dữ liệu, cần nói rõ với giám khảo đây là bước khởi tạo, và hệ thống có thể tiếp tục học từ dữ liệu thật khi có học sinh sử dụng.
- **Sau khi Antigravity train xong mỗi model**, luôn yêu cầu nó in ra: số mẫu dùng để train, accuracy trên tập test, và 3 ví dụ dự đoán thử để tự tay bạn kiểm tra logic có hợp lý không trước khi tin tưởng đưa vào sản phẩm.

---

**YÊU CẦU CUỐI CÙNG VỚI ANTIGRAVITY**: sau khi đọc xong toàn bộ prompt này, hãy tóm tắt lại kế hoạch bằng 8 gạch đầu dòng (theo 8 Phase) và HỎI XÁC NHẬN trước khi bắt đầu Phase 0 (backup). Không tự ý bắt đầu code ngay.
