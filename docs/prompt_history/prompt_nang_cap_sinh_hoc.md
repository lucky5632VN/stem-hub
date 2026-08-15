# BỘ PROMPT TÁI CẤU TRÚC VÀ NÂNG CẤP ĐẤU TRƯỜNG SINH HỌC (STEM ARENA — bản CLIENT-SIDE)

**Role:** Bạn là một Senior Full-Stack Developer chuyên môn cao về Next.js (App Router), React UI/UX. Bạn thấu hiểu cấu trúc đề thi THPT Quốc gia Việt Nam mới (đặc biệt là dạng bài Trắc nghiệm Đúng/Sai).

**Bối cảnh kiến trúc (đọc kỹ trước khi code):** Dự án hiện KHÔNG dùng Cloud Functions. Toàn bộ logic chấm điểm chạy trực tiếp ở client, ghi thẳng Firestore bằng `updateDoc`. Firestore Rules đang mở gần hoàn toàn. Đây là bản nộp báo cáo/demo ngắn hạn, KHÔNG cần chống gian lận hay validate server. KHÔNG được tạo/gọi bất kỳ Cloud Function nào — mọi phần "Cập nhật Backend (`functions/index.js`)" trong các phiên bản trước của yêu cầu này giờ chuyển hết thành logic client trong `page.js`.

**Context:** Module Sinh học trong dự án "Đấu Trường STEM" (thi đấu 1v1 realtime) đang là module ổn định nhất với cấu trúc 30 câu hỏi liên tiếp. Tuy nhiên, module này đang gặp 3 vấn đề lớn:
1. Các câu hỏi Đúng/Sai bị mất phần "Đề bài/Ngữ cảnh", chỉ hiện đáp án A) Đúng, B) Sai.
2. Lỗi hiển thị font chữ (ký tự bị vỡ do UTF-8) và công thức Sinh học (lai di truyền, số mũ, ký hiệu chéo) chưa được parse đúng chuẩn.
3. Thiếu tính tương tác. Gameplay chỉ có trắc nghiệm thuần túy, chưa có phần thực hành xen kẽ như các môn Toán, Lý.

**Task:** Hãy viết lại mã nguồn, đề xuất bản vá lỗi và thiết kế kiến trúc "Mixed Gameplay" (Trắc nghiệm xen kẽ Thực hành) cho môn Sinh học, TẤT CẢ chạy client-side. Cung cấp code hoàn chỉnh theo 3 giai đoạn dưới đây. Sau mỗi giai đoạn, chạy `npm run build` và báo cáo trước khi tiếp tục.

---

### GIAI ĐOẠN 1: BUG BASH - FIX LỖI HIỂN THỊ & UI CÂU HỎI ĐÚNG/SAI (ƯU TIÊN CAO NHẤT, RỦI RO THẤP NHẤT)

1. **Khắc phục lỗi mất đề bài câu Đúng/Sai (`src/app/dau-truong/page.js`):**
   - **Vấn đề:** Các câu Đúng/Sai (dạng thức mới của Bộ GD) thường có 1 đoạn ngữ cảnh chung, sau đó là 4 phát biểu (I, II, III, IV) để chọn Đ/S. UI hiện tại không parse và render được phần ngữ cảnh này.
   - **Yêu cầu:** Cập nhật lại UI Component hiển thị câu hỏi. Cấu trúc Object câu hỏi từ ngân hàng câu hỏi cần có field `context` (Đoạn thông tin/Đề bài chung) — kiểm tra xem dữ liệu trong Firestore collection `questions` đã có field này chưa, nếu chưa cần bổ sung khi tạo/sửa câu hỏi ở trang Admin (`/admin/questions`). Giao diện cần render khối `context` ở trên cùng, sau đó mới render các lựa chọn ở dưới. Có thanh cuộn (scrollbar) tinh tế nếu đề bài quá dài.

2. **Fix lỗi font chữ và Custom Parser cho Sinh học:**
   - **Vấn đề:** Các ký hiệu như phép lai (×), ký hiệu đực/cái (♂, ♀), hoặc kiểu gen có số mũ ($I^A I^B$, $X^M X^m$) đang hiển thị lỗi.
   - **Yêu cầu:** Nâng cấp hàm `formatBioText` (hoặc custom parser tương đương trong `src/lib/` hoặc `page.js`) để xử lý an toàn chuỗi văn bản. Đảm bảo parse đúng các subscript/superscript của kiểu gen (bọc vào `<sup>`) và mã hóa đúng chuẩn UTF-8 để không bị lỗi dấu tiếng Việt. Kiểm tra file đang lưu đúng encoding UTF-8 (xem góc dưới bên phải VS Code).

*(Đây là phần AN TOÀN NHẤT trong cả 3 bộ prompt của 3 môn — chỉ sửa lỗi hiển thị, không đụng logic chấm điểm hay cấu trúc dữ liệu quan trọng. Nên hoàn thành và test kỹ phần này trước khi sang Giai đoạn 2.)*

---

### GIAI ĐOẠN 2: THIẾT KẾ KIẾN TRÚC MIXED GAMEPLAY (30 CÂU)

1. **Viết lại Generator (`src/lib/arenaGenerator.js`):**
   - **Yêu cầu:** Hàm `generateBiologyMatchPool()` phải trả về mảng 30 câu hỏi, trộn ngẫu nhiên Trắc nghiệm tĩnh và Thực hành động.
   - **Cấu trúc object:** Phân định rõ ràng bằng field `type`:
     - Trắc nghiệm 4 đáp án: `{ type: 'mcq', context: '...', choices: [...], correct: 'A' }`
     - Trắc nghiệm Đúng/Sai: `{ type: 'tf', context: '...', statements: [...], correct: [...] }`
     - Thực hành: `{ type: 'practical_dna', templateStrand: 'ATGC...' }`
   - Mảng 30 câu ghi vào `matchData.questionPool` khi tạo phòng, dùng chung cho cả 2 người chơi.

2. **Chấm điểm ở CLIENT (`src/app/dau-truong/page.js`):**
   - Viết switch-case theo `type` của câu hỏi gửi lên để chấm điểm tương ứng (MCQ, True/False, hoặc Practical) — TẤT CẢ chạy ở client, không qua server.
   - Tiến độ vẫn tính theo tỷ lệ phần trăm `(currentScore / 30) * 100` và giữ nguyên cơ chế thưởng +10% nếu đúng ≥ 60% ở câu cuối cùng (câu thứ 30).
   - Sau khi tính xong mỗi câu, ghi kết quả thẳng Firestore bằng `updateDoc`.

---

### GIAI ĐOẠN 3: TRIỂN KHAI MODULE THỰC HÀNH SINH HỌC BÁM SÁT THPT

Thiết kế Client UI Component cho 2 module thực hành sau để chèn xen kẽ vào 30 câu đấu trường:

1. **Module 1: Máy Khâu DNA / Phiên mã RNA (Lớp 12):**
   - **Giao diện:** Hiển thị một mạch khuôn DNA (ví dụ: `T - A - X - G - A`). Bên dưới là một kho (pool) các Nucleotide trôi nổi tự do (A, U, G, X, T).
   - **Thao tác:** Học sinh phải kéo - thả (Drag & Drop, dùng thư viện nhẹ như `@dnd-kit/core` nếu đã có sẵn trong dự án, hoặc tự viết bằng HTML5 Drag API/click-to-select nếu muốn đơn giản hơn) các Nu tự do để khớp vào mạch khuôn theo nguyên tắc bổ sung (A-U, G-X, T-A).
   - **Mục tiêu:** Hoàn thành việc lắp ráp một đoạn mạch mRNA hoặc DNA hoàn chỉnh trong thời gian nhanh nhất. Kích hoạt hiệu ứng âm thanh/nháy sáng khi ghép đúng từng cặp (dùng Web Audio API đã có sẵn trong dự án nếu có). Khi hoàn thành đủ mạch, client tự so sánh kết quả với đáp án đúng và ghi Firestore.

2. **Module 2: Sắp xếp Chu kỳ Tế bào (Lớp 10):**
   - **Giao diện:** Cung cấp 4-5 hình ảnh/sơ đồ mô phỏng các kỳ của Nguyên phân / Giảm phân (Kỳ đầu, Kỳ giữa, Kỳ sau, Kỳ cuối) đang bị đảo lộn xộn.
   - **Thao tác:** Học sinh dùng chuột kéo thả để sắp xếp các hình ảnh này theo đúng thứ tự thời gian sinh học.
   - **Mục tiêu:** Nhấn nút "Xác nhận" để client tự kiểm tra mảng thứ tự hiện tại có khớp với thứ tự đúng đã định nghĩa sẵn trong object câu hỏi hay không, rồi ghi kết quả Firestore.

**Yêu cầu Output:** 
- Phân chia rõ ràng code cho từng file client cần chỉnh sửa.
- Đặc biệt chú trọng vào phần React Component của bài tập "Máy Khâu DNA" (cung cấp logic xử lý mảng và drag-drop/click ghép nối).
- Code phải gọn gàng, sử dụng TailwindCSS tương thích với giao diện sci-fi tối màu hiện tại của dự án. Sau mỗi giai đoạn, chạy `npm run build`, báo cáo kết quả trước khi tiếp tục.