# PROMPT RÚT GỌN — ƯU TIÊN HOÀN THÀNH PHẦN TRẮC NGHIỆM (MCQ) TRƯỚC (CLIENT-SIDE)

**Bối cảnh:** Thời gian không còn nhiều. Tạm hoãn toàn bộ phần module Thực hành tương tác (Giai đoạn 3 của cả 3 môn: con lắc lò xo, mạch điện, DNA/RNA, sắp xếp chu kỳ tế bào, tối ưu thể tích, radar Oxyz...). Mục tiêu DUY NHẤT của lượt này: cả 3 môn (Toán, Lý, Sinh) chạy đúng, ổn định với **30 câu hỏi trắc nghiệm (MCQ) xen kẽ Đúng/Sai đối với Sinh)**, chấm điểm đúng, không lỗi hiển thị. Phần thực hành động (practical) sẽ làm ở đợt sau — generator có thể tạo sẵn "chỗ trống" cho type practical nhưng KHÔNG cần dựng UI/logic thực hành lúc này.

**Role:** Senior Full-Stack Developer Next.js (App Router) + Firebase/Firestore.

**Nguyên tắc kiến trúc bắt buộc (giữ nguyên từ các prompt gốc):**
- KHÔNG dùng Cloud Functions / `httpsCallable` / `functions/index.js` dưới bất kỳ hình thức nào. Toàn bộ logic chấm điểm chạy ở client (`src/app/dau-truong/page.js` và `src/lib/`), ghi thẳng Firestore bằng `updateDoc`.
- Đây là bản demo/báo cáo ngắn hạn, không cần chống gian lận hay validate server.
- Sau mỗi giai đoạn, chạy `npm run build`, báo cáo kết quả trước khi sang giai đoạn tiếp theo.

---

## GIAI ĐOẠN 1: BUG BASH — CHỈ SỬA LỖI CHẶN ĐƯỜNG (làm trước tiên, rủi ro thấp)

Làm đúng phần Giai đoạn 1 đã mô tả trong 3 prompt gốc, cho cả 3 môn, KHÔNG làm gì thêm ngoài phạm vi này:

1. **Toán:**
   - Sửa lỗi chấm điểm hardcode `selectedAnswer.x/.y`: nhận diện `type === 'mcq'` → so sánh chuỗi `selectedAnswer` với `target.correct`.
   - Tách `guideTexts` theo từng môn (`guideTexts.math`, `guideTexts.biology`...), không còn hiển thị nhầm nội dung Sinh khi đang ở Toán.
   - Nâng cấp `formatMathText` để xử lý `^n` và `_{n}` → `<sup>`/`<sub>`, kèm vài test-case console.log (`x^2`, `x^{10}`, `x_1`, text thường).

2. **Lý:**
   - Chuẩn hóa hàm chấm điểm Vật Lý ở client: đọc `type === 'mcq'` → so sánh đáp án text trực tiếp. (Phần `practical_*` để dành Giai đoạn sau — chưa cần viết logic so sánh chi tiết cho nó ngay bây giờ, chỉ cần không crash nếu gặp type lạ.)

3. **Sinh:**
   - Fix UI câu Đúng/Sai: render field `context` (đề bài chung) phía trên các phát biểu I/II/III/IV, có scrollbar nếu dài.
   - Nâng cấp `formatBioText`: bọc `<sup>` cho kiểu gen (`I^A I^B`, `X^M X^m`), đảm bảo UTF-8 không vỡ font, giữ đúng ký hiệu ×, ♂, ♀.

**Điều kiện dừng của Giai đoạn 1:** `npm run build` sạch, cả 3 môn hiển thị đúng câu hỏi hiện có (kể cả với dữ liệu MCQ mẫu), chấm điểm MCQ đúng 100% các case test thủ công.

---

## GIAI ĐOẠN 2: GENERATOR 30 CÂU — CHỈ MCQ (+ TF CHO SINH), CHƯA LÀM PRACTICAL

Viết/sửa `src/lib/arenaGenerator.js`:

- `generateMathMatchPool()`, `generatePhysicsMatchPool()`, `generateBiologyMatchPool()`: mỗi hàm trả về mảng **30 câu**, lấy từ ngân hàng câu hỏi Firestore (collection `questions`, lọc theo môn), **100% type `'mcq'`** (riêng Sinh có thể xen `'tf'` — Đúng/Sai — vì đã có ngân hàng câu hỏi dạng này).
- KHÔNG sinh câu hỏi `practical_*` trong đợt này. Nếu ngân hàng câu hỏi của môn nào không đủ 30 câu MCQ, cho phép lặp lại câu hỏi (random có hoàn lại) và log cảnh báo ra console — không được để hàm trả về mảng thiếu 30 phần tử hoặc bị `undefined`.
- Cấu trúc object giữ nguyên như đã định nghĩa ở 3 prompt gốc:
  - MCQ: `{ type: 'mcq', content: '...', choices: [...], correct: 'A' }`
  - TF (Sinh): `{ type: 'tf', context: '...', statements: [...], correct: [...] }`
- Ghi mảng 30 câu vào `matchData.questionPool` khi tạo phòng đấu, dùng chung cho cả 2 người chơi.

Cập nhật `src/app/dau-truong/page.js`:
- Chấm điểm switch-case theo `type`: xử lý đầy đủ `'mcq'` và `'tf'`. Tính `% progress = Math.round((currentScore / 30) * 100)`. Giữ cơ chế thưởng +10% nếu đúng ≥60% ở câu 30 (áp dụng cho Sinh như bản gốc; có thể áp dụng chung cho cả 3 môn nếu muốn đồng bộ — nêu rõ giả định này trong báo cáo).
- Ghi kết quả từng câu thẳng vào Firestore bằng `updateDoc`.
- **Không cần** mount Component thực hành (laser, con lắc, mạch điện, DNA...) trong đợt này — miễn là UI không bị vỡ khi generator (tạm thời) chỉ trả về toàn `mcq`/`tf`.

**Điều kiện dừng của Giai đoạn 2:** Một trận đấu đầy đủ 30 câu MCQ/TF chạy được từ đầu đến cuối, không đơ, không văng lỗi, điểm số và % progress cập nhật đúng theo thời gian thực trên Firestore, `npm run build` sạch.

---

## PHẠM VI TẠM HOÃN (không làm trong lượt này)

- Toàn bộ Giai đoạn 3 của cả 3 môn: mô phỏng con lắc lò xo, mạch điện R1/R2, Máy khâu DNA/RNA, sắp xếp chu kỳ tế bào, tối ưu thể tích, radar Oxyz.
- Việc trộn tỷ lệ 70% MCQ - 30% thực hành trong generator (chuyển hết về 100% MCQ/TF).
- `runTransaction` cho race condition (chỉ cần thiết khi có ghi đồng thời phức tạp hơn — giữ ghi `updateDoc` đơn giản như bản gốc là đủ cho MCQ).

**Yêu cầu Output:** Chỉ code cho đúng phạm vi Giai đoạn 1 + 2 ở trên. Không tạo trước code rỗng/half-done cho các Component thực hành — để tránh code chết gây rối khi quay lại làm tiếp sau này. Sau mỗi giai đoạn, chạy `npm run build`, báo cáo kết quả rồi mới hỏi có tiếp tục sang giai đoạn kế hay không.
