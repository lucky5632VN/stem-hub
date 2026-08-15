# BỘ PROMPT TÁI CẤU TRÚC VÀ NÂNG CẤP ĐẤU TRƯỜNG TOÁN HỌC (STEM ARENA — bản CLIENT-SIDE)

**Role:** Bạn là một Senior Full-Stack Developer chuyên gia về hệ sinh thái Next.js (App Router), React State Management và Firebase (Firestore). Bạn có kinh nghiệm xử lý giao diện tương tác cao và tư duy thuật toán vững chắc.

**Bối cảnh kiến trúc (đọc kỹ trước khi code):** Dự án hiện KHÔNG dùng Cloud Functions dưới bất kỳ hình thức nào. Toàn bộ logic tính toán, chấm điểm, xác định thắng thua đều chạy trực tiếp ở phía client (trong `page.js` và các file trong `src/lib/`), rồi ghi thẳng kết quả vào Firestore bằng `updateDoc`/`setDoc`. Firestore Rules hiện đang mở gần như hoàn toàn (chỉ yêu cầu `request.auth != null`, không giới hạn field nào). Đây là bản dùng để nộp báo cáo/demo cho ban giám khảo trong thời gian ngắn hạn, KHÔNG phải sản phẩm vận hành công khai lâu dài — do đó KHÔNG cần cơ chế chống gian lận, KHÔNG cần validate phía server, KHÔNG được tạo hay gọi bất kỳ Cloud Function/`httpsCallable` nào. Mọi hướng dẫn "gọi server", "Cloud Function", "backend" trong các phiên bản cũ của prompt này đều KHÔNG còn áp dụng — hãy thay thế bằng logic chạy ngay tại client.

**Context:** Hệ thống "Đấu Trường STEM" (thi đấu 1v1 realtime) đang trong giai đoạn hoàn thiện để nộp báo cáo. Module Toán Học hiện tại đang gặp lỗi chấm điểm sai khi nộp bài trắc nghiệm (do code cũ hardcode tìm tọa độ x, y trong khi câu hỏi mới có thể là trắc nghiệm chữ), lỗi hiển thị ký tự (font/UTF-8), lỗi parse công thức LaTeX/số mũ, và cấu trúc game còn đơn điệu (chỉ 3-8 câu tính vector đơn giản).

**Task:** Hãy viết lại mã nguồn, đề xuất bản vá lỗi và hướng dẫn cập nhật chi tiết cho từng file theo 3 giai đoạn dưới đây. Cung cấp code hoàn chỉnh và tối ưu hóa hiệu năng. Sau MỖI giai đoạn, chạy `npm run build` xác nhận không lỗi, và báo cáo rõ trước khi sang giai đoạn tiếp theo.

---

### GIAI ĐOẠN 1: BUG BASH - XỬ LÝ TRIỆT ĐỂ LỖI HIỆN TẠI

1. **Khắc phục lỗi chấm điểm sai khi nộp bài trắc nghiệm (chạy ở CLIENT, trong `src/app/dau-truong/page.js`):**
   - **Vấn đề:** Logic chấm điểm môn Toán hiện tại đang hardcode để tìm `selectedAnswer.x` và `selectedAnswer.y`. Khi câu hỏi là dạng trắc nghiệm chữ (VD: `selectedAnswer: "D"`), logic so sánh sai/văng lỗi.
   - **Yêu cầu:** Viết lại hàm xử lý nộp đáp án Toán học trong `page.js` (hoặc file logic liên quan trong `src/lib/`) để nhận diện `type`/`challengeType` của câu hỏi hiện tại:
     - Nếu `type === 'mcq'`, so sánh chuỗi `selectedAnswer` với `target.correct` (so sánh string trực tiếp, không phân biệt hoa/thường nếu cần).
     - Nếu `type === 'practical'`, so sánh tọa độ `x, y` như cũ (có thể cho phép sai số nhỏ nếu cần, ví dụ `Math.abs(x - target.x) < 0.01`).
   - Sau khi xác định đúng/sai, tính `currentProgress` mới và gọi `updateDoc` để ghi thẳng vào Firestore document của trận đấu (`match_rooms/{roomId}`), cập nhật field tiến độ tương ứng của người chơi. KHÔNG gọi bất kỳ `httpsCallable` hay hàm nào import từ `firebase/functions`.

2. **Fix lỗi font chữ và nhầm nội dung tĩnh (`src/app/dau-truong/page.js`):**
   - **Vấn đề:** Giao diện hiển thị các ký tự lỗi do UTF-8 hoặc Regex parse lỗi. Phần "Hướng dẫn đấu trường" đang render nhầm text của môn Sinh (Bảng thông tin gen, sinh học tế bào) khi đang ở môn Toán.
   - **Yêu cầu:** Tách biệt state/component chứa nội dung hướng dẫn của môn Toán ra khỏi state chung (nếu đang dùng chung 1 biến `guideText` cho cả 4 môn mà bị gán nhầm, tách thành object có key theo từng môn: `guideTexts.math`, `guideTexts.biology`...). Kiểm tra toàn bộ file `page.js` có đang lưu đúng encoding UTF-8 không (mở file trong VS Code, kiểm tra góc dưới bên phải thanh trạng thái ghi "UTF-8", nếu ghi khác thì chuyển đổi lại qua "Save with Encoding").

3. **Nâng cấp Custom Parser Toán học (`formatMathText`):**
   - **Vấn đề:** Các công thức chứa số mũ nội tuyến như `y = x^2 - 2x - 2` đang hiển thị thành `y = x2 - 2x - 2` (mất ký hiệu mũ).
   - **Yêu cầu:** Nâng cấp hàm Regex `formatMathText` (tìm trong `src/lib/` hoặc trực tiếp trong `page.js` nếu định nghĩa cục bộ) để nhận diện cấu trúc `^n` hoặc `_{n}` và bọc tự động vào thẻ `<sup>n</sup>` / `<sub>n</sub>`. Hàm nên trả về chuỗi HTML an toàn (dùng `dangerouslySetInnerHTML` có kiểm soát, hoặc parse thành mảng React node) để render công thức chuẩn xác mà không cần import thư viện nặng như KaTeX/MathJax. Viết thêm vài test-case thủ công (in ra console.log) để xác nhận parser xử lý đúng các trường hợp: mũ đơn `x^2`, mũ nhiều ký tự `x^{10}`, chỉ số dưới `x_1`, và trường hợp không có ký hiệu đặc biệt (không được làm hỏng text bình thường).

---

### GIAI ĐOẠN 2: THIẾT KẾ KIẾN TRÚC 30 CÂU XEN KẼ (MIXED GAMEPLAY)

1. **Viết lại Generator (`src/lib/arenaGenerator.js`):**
   - **Yêu cầu:** Viết hàm `generateMathMatchPool()` trả về một mảng đúng **30 câu hỏi**.
   - **Logic sinh:** Trộn ngẫu nhiên (theo tỷ lệ khoảng 70% trắc nghiệm - 30% thực hành) các câu hỏi từ ngân hàng tĩnh (đọc từ Firestore collection `questions`, lọc theo môn Toán) và các thử thách thực hành sinh động (dùng lại/mở rộng logic sinh tọa độ đã có trong `arenaGenerator.js`).
   - **Cấu trúc object:** Mỗi object câu hỏi bắt buộc phải có trường `type`.
     - Ví dụ MCQ: `{ type: 'mcq', content: '...', choices: [...], correct: 'A' }`
     - Ví dụ Thực hành: `{ type: 'practical_radar', eq: '...', targetCoord: { x, y } }`
   - Hàm này chạy hoàn toàn ở client (được gọi khi tạo phòng đấu trong `matchmaker.js` hoặc `Header.jsx`), kết quả mảng 30 câu được ghi thẳng vào field `matchData.questionPool` của document `match_rooms/{roomId}` trên Firestore để cả 2 người chơi cùng đọc chung 1 bộ đề khi vào trận.

2. **Cập nhật Client Routing/Rendering (`src/app/dau-truong/page.js`):**
   - **Yêu cầu:** Dựa vào `mathAsteroids[mathTargetIndex]?.type` (hoặc tên biến tương đương đang dùng), thay đổi Component hiển thị tương ứng.
   - Nếu là `'mcq'`, render Component giao diện chọn 4 đáp án (có thể tái sử dụng UI trắc nghiệm đã có của môn Sinh, đổi theme màu/icon cho phù hợp môn Toán).
   - Nếu là `'practical_radar'` (hoặc các type thực hành khác), ẩn UI trắc nghiệm và mount Component mô phỏng tương tác (như hệ tọa độ Descartes bắn thiên thạch hiện có) ra giữa màn hình. Đảm bảo hiệu ứng transition mượt mà giữa các câu (dùng CSS transition hoặc thư viện animation nhẹ đã có sẵn trong dự án, ví dụ Framer Motion nếu đã cài).
   - Toàn bộ việc chấm điểm khi chuyển từ câu này sang câu khác đều xử lý ở client, ghi thẳng Firestore, không gọi server.

---

### GIAI ĐOẠN 3: TRIỂN KHAI MODULE THỰC HÀNH MỚI BÁM SÁT CHƯƠNG TRÌNH THPT

- **Yêu cầu:** Để tận dụng nền tảng đồ họa web và bám sát kiến thức khối 12, hãy thiết kế thêm cấu trúc Data và Client UI mô phỏng cho 1 trong 2 ý tưởng thực hành sau (để trộn chung vào pool 30 câu):
  1. **Tối ưu hóa thể tích (Ứng dụng Đạo hàm):** Học sinh kéo thanh trượt cắt góc $x$ của tấm nhôm để gập thành hộp. Hệ thống tự vẽ đồ thị $V(x)$ và khối 3D realtime (có thể dùng SVG/Canvas 2D đơn giản thay vì Three.js nếu muốn nhẹ hơn). Điểm tối đa khi học sinh tìm đúng cực đại (cho phép sai số nhỏ, ví dụ ±0.1cm).
  2. **Radar Không gian (Hình học Oxyz):** Mở rộng hệ tọa độ Oxy hiện tại lên không gian 3 chiều. Học sinh tính toán tọa độ điểm đối xứng hoặc khoảng cách đến mặt phẳng (dùng công thức Oxyz lớp 12) để ngắm bắn mục tiêu tàng hình.
  - Với module đã chọn: khi học sinh bấm nút "Xác nhận"/"Kích hoạt", client tự so sánh giá trị nhập vào với đáp án đúng (tính sẵn trong object câu hỏi từ Generator ở Giai đoạn 2), cập nhật đúng/sai và tiến độ, ghi thẳng vào Firestore — không có bất kỳ bước gọi server nào.

**Lưu ý cho AI:** Hãy tuân thủ chặt chẽ việc kiểm soát luồng trạng thái của React, cẩn thận với Race Condition khi 2 người chơi cùng ghi vào Firestore đồng thời (dùng `runTransaction` nếu cần đảm bảo tính nhất quán khi cả 2 cùng cập nhật 1 document), và tối ưu code sạch sẽ, chia tách component hợp lý. Trình bày code block rõ ràng. Sau mỗi giai đoạn, chạy `npm run build` và báo cáo kết quả trước khi tiếp tục.