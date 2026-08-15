# BỘ PROMPT TÁI CẤU TRÚC VÀ NÂNG CẤP ĐẤU TRƯỜNG VẬT LÝ (STEM ARENA — bản CLIENT-SIDE)

**Role:** Bạn là một Senior Full-Stack Developer & Kiến trúc sư hệ thống Next.js/Firebase. Bạn có tư duy sư phạm để xây dựng các tính năng EdTech hữu ích và tối ưu hóa hiệu năng ứng dụng thời gian thực.

**Bối cảnh kiến trúc (đọc kỹ trước khi code):** Dự án hiện KHÔNG dùng Cloud Functions dưới bất kỳ hình thức nào. Toàn bộ logic tính toán, chấm điểm đều chạy trực tiếp ở client, ghi thẳng Firestore bằng `updateDoc`. Firestore Rules đang mở gần hoàn toàn (chỉ yêu cầu đăng nhập). Đây là bản dùng để nộp báo cáo/demo ngắn hạn, KHÔNG cần cơ chế chống gian lận hay validate phía server. TUYỆT ĐỐI KHÔNG tạo hay gọi bất kỳ Cloud Function/`httpsCallable`/`functions/index.js` nào — mọi logic "server" trong các phiên bản trước của yêu cầu này giờ đều chuyển thành logic client.

**Context:** Trong dự án "Đấu Trường STEM" (thi đấu 1v1 realtime), module Vật Lý hiện tại đang sử dụng minigame xoay gương Laser với logic phức tạp không cần thiết (vì không còn yêu cầu chống gian lận), khiến code khó bảo trì. Môn Lý cũng đang thiếu hoàn toàn phần Trắc nghiệm, khiến nhịp độ trận đấu bị hỏng (tiến trình nhảy vọt từ 0% lên 100% chỉ qua 1 thao tác bắn trúng/trượt).

**Task:** Hãy tái cấu trúc toàn bộ module Vật Lý, chạy hoàn toàn ở CLIENT. Chuyển đổi từ 1 thử thách Laser tĩnh sang cấu trúc **30 câu hỏi xen kẽ (Trắc nghiệm + Thực hành bám sát THPT)**. Viết lại mã nguồn client (Next.js) theo các bước dưới đây. Sau mỗi giai đoạn, chạy `npm run build` và báo cáo trước khi tiếp tục.

---

### GIAI ĐOẠN 1: ĐƠN GIẢN HÓA LOGIC & CHUẨN HÓA CHẤM ĐIỂM Ở CLIENT

1. **Đơn giản hóa và chuẩn hóa logic chấm điểm (trong `src/app/dau-truong/page.js`):**
   - **Vấn đề:** Hiện tại logic chấm điểm của môn Lý chỉ xử lý đúng 1 task quang học (bắn laser qua gương), và trước đây từng có 1 bản tính lại quỹ đạo phản xạ phức tạp ở server — bản này KHÔNG CÒN CẦN THIẾT nữa vì không còn yêu cầu chống gian lận.
   - **Yêu cầu:** Viết lại hàm xử lý môn Vật Lý ở client:
     - Lặp lại logic chấm điểm theo mảng câu hỏi (giống môn Sinh/Toán). Mỗi câu đúng cộng điểm, tính `% progress` dựa trên công thức `Math.round((currentScore / questionPool.length) * 100)`.
     - Đọc field `challengeType`/`type` của câu hỏi hiện tại:
       - Nếu `type === 'mcq'`, so sánh đáp án text (A, B, C, D) trực tiếp ở client.
       - Nếu `type.startsWith('practical')`, so sánh các tham số thực hành tương ứng (ví dụ: chu kỳ $T$, điện trở $R$) với sai số cho phép hợp lý (ví dụ ±0.05 cho chu kỳ, ±0.5 Ω cho điện trở).
     - Sau khi tính xong, ghi kết quả thẳng vào Firestore bằng `updateDoc`.

2. **Đơn giản hóa Engine Vật lý cũ:**
   - Nếu vẫn giữ minigame Laser cũ (`physicsEngine.js` hoặc logic tương đương trong `page.js`): đơn giản hóa để client tự xác nhận trúng/trượt dựa trên vị trí thực tế của tia sáng trên giao diện (không cần thuật toán phản xạ hình học phức tạp nếu không còn ai cố gian lận việc này) — có thể giữ nguyên logic hiện có nếu đang chạy đúng, chỉ cần đảm bảo nó chạy client-side hoàn toàn.

---

### GIAI ĐOẠN 2: THIẾT KẾ MIXED GAMEPLAY GENERATOR (30 CÂU)

1. **Viết Generator (`src/lib/arenaGenerator.js`):**
   - Viết hàm `generatePhysicsMatchPool()` tạo ra một mảng đúng 30 câu hỏi.
   - Trộn ngẫu nhiên câu hỏi trắc nghiệm (lấy từ ngân hàng câu hỏi Firestore, lọc theo môn Vật Lý) và các câu thực hành động.
   - **Cấu trúc Object bắt buộc:**
     - MCQ: `{ type: 'mcq', content: '...', choices: [...], correct: 'B' }`
     - Thực hành Dao động: `{ type: 'practical_oscillation', targetPeriod: 2.0 }` (Chu kỳ mục tiêu, tính bằng giây).
     - Thực hành Mạch điện: `{ type: 'practical_circuit', targetResistance: 15 }` (Điện trở mục tiêu, tính bằng Ω).
   - Mảng 30 câu này được ghi vào `matchData.questionPool` khi tạo phòng đấu, để cả 2 người chơi dùng chung 1 bộ đề.

2. **Xử lý Routing UI Client (`src/app/dau-truong/page.js`):**
   - Đọc thuộc tính `type` của câu hỏi hiện tại (`physicsAsteroids[physicsTargetIndex]?.type` hoặc tên biến tương đương).
   - Nếu `type === 'mcq'`: Mount Component giao diện trắc nghiệm 4 đáp án.
   - Nếu `type.startsWith('practical')`: Ẩn khung trắc nghiệm, mount Component phòng thí nghiệm mô phỏng ra giữa màn hình.

---

### GIAI ĐOẠN 3: XÂY DỰNG MODULE THỰC HÀNH MỚI BÁM SÁT THPT

Thiết kế Client UI Component cho 2 module thực hành sau để thay thế/bổ sung cho game Laser:

1. **Module 1: Căn chỉnh Dao động (Con lắc lò xo - Lớp 12):**
   - **Giao diện:** Mô phỏng một con lắc lò xo đang dao động thẳng đứng và một đồ thị tọa độ $x-t$ chạy realtime (sử dụng `requestAnimationFrame` hoặc Canvas đơn giản, hoặc SVG animate nếu đơn giản hơn).
   - **Thao tác:** Cung cấp 2 thanh trượt (Slider) để thay đổi Khối lượng $m$ (kg) và Độ cứng $k$ (N/m).
   - **Mục tiêu:** Hệ thống yêu cầu một chu kỳ $T$ mục tiêu. Học sinh kéo slider sao cho $T = 2\pi\sqrt{m/k}$ khớp với yêu cầu (cho phép sai số nhỏ). Cung cấp nút "Kích hoạt / Xác nhận" — khi bấm, client tự tính $T$ hiện tại từ giá trị slider, so sánh với $T$ mục tiêu, xác nhận đúng/sai và ghi thẳng Firestore.

2. **Module 2: Lắp ráp Mạch điện (Lớp 11):**
   - **Giao diện:** Một bảng mạch điện đơn giản với nguồn 1 chiều và 2 vị trí trống để gắn điện trở.
   - **Thao tác:** Cung cấp các điện trở $R_1, R_2$ có giá trị cố định. Học sinh sử dụng nút chuyển đổi (Toggle) để chọn cách mắc Nối tiếp ($R_{nt} = R_1 + R_2$) hoặc Song song ($R_{ss} = \frac{R_1 R_2}{R_1 + R_2}$).
   - **Mục tiêu:** Cấu hình mạch sao cho Điện trở tương đương toàn mạch khớp với $R$ mục tiêu của đề bài. Bấm "Xác nhận" để client tự tính và so sánh.

3. **Tối ưu hóa UX khi kéo Slider (không còn liên quan đến chống spam API vì không còn Cloud Function):**
   - **Vẫn nên áp dụng:** Chỉ tính toán và cập nhật state hiển thị (không ghi Firestore) mỗi khi người dùng kéo Slider, và CHỈ ghi kết quả vào Firestore khi người dùng bấm nút "Xác nhận". Điều này giúp UI mượt và tránh ghi Firestore quá nhiều lần không cần thiết (dù không còn lo về chi phí Cloud Function, ghi Firestore liên tục vẫn có thể gây giật/lag UI nếu không kiểm soát).

**Yêu cầu Output:** 
- Phân chia rõ ràng các file cần chỉnh sửa.
- Cung cấp đoạn code (snippet) hoàn chỉnh, đặc biệt là logic React Component cho module mô phỏng dao động và mạch điện.
- Tuân thủ Clean Code và React Hooks best practices. Sau mỗi giai đoạn, chạy `npm run build`, báo cáo kết quả trước khi tiếp tục.