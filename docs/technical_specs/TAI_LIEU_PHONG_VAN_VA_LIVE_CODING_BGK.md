# 🎓 CẨM NANG TOÀN DIỆN: PHỎNG VẤN VÀ LIVE-CODING DỰ ÁN STEM HUB
> **Dành riêng cho Đội thi STEM HUB - Cuộc thi Sáng tạo AI**  
> *Mục tiêu: Làm chủ 100% mã nguồn, phản xạ nhanh trong 30 giây khi Ban Giám Khảo (BGK) yêu cầu sửa code trực tiếp mà không cần dùng AI hỗ trợ.*

---

## 🧭 MỤC LỤC
1. [Tâm lý Ban Giám Khảo: Họ thực sự muốn kiểm tra điều gì?](#1-tâm-lý-ban-giám-khảo-họ-thực-sự-muốn-kiểm-tra-điều-gì)
2. [Bản đồ 8 File "Huyệt Đạo" của Dự án](#2-bản-đồ-8-file-huyệt-đạo-của-dự-án)
3. [Top 15 Tình Huống Live-Coding BGK Hay Yêu Cầu Sửa Nhất](#3-top-15-tình-huống-live-coding-bgk-hay-yêu-cầu-sửa-nhất)
4. [Bộ 20 Câu Hỏi Vấn Đáp Phỏng Vấn Trực Tiếp (Kèm Lời Giải Mẫu)](#4-bộ-20-câu-hỏi-vấn-đáp-phỏng-vấn-trực-tiếp-kèm-lời-giải-mẫu)
5. [Kịch bản "Cứu Nguy" khi bị bí hoặc gặp lỗi trước mặt BGK](#5-kịch-bản-cứu-nguy-khi-bị-bí-hoặc-gặp-lỗi-trước-mặt-bgk)

---

## 1. TÂM LÝ BAN GIÁM KHẢO: HỌ THỰC SỰ MUỐN KIỂM TRA ĐIỀU GÌ?

Trong buổi phỏng vấn trực tiếp (10 - 15 phút), BGK gồm có:
* 👨‍🏫 **Giám khảo 1 (Chuyên gia AI):** Sẽ soi xem bạn có hiểu RAG, Prompt, Gemini API, Face ID hay chỉ là "gọi hàm cho vui".
* 👨‍💻 **Giám khảo 2 (Kỹ sư Phần mềm):** Sẽ soi kiến trúc Next.js, cách quản lý State bằng Zustand, Client vs Server.
* 🛡️ **Giám khảo 3 (Chuyên gia An ninh mạng):** Sẽ soi bảo mật Firebase Rules, lộ API Key, chống học sinh gian lận điểm số.

### ⚠️ QUY TẮC SỐNG CÒN KHI ĐƯỢC KÊU SỬA CODE:
1. **Họ KHÔNG bắt bạn viết code mới từ đầu:** Họ thừa biết thời gian phỏng vấn chỉ có 10 phút.
2. **Mục đích thật sự của họ là:**
   - Xem bạn có biết đoạn code đó **nằm ở file nào** không?
   - Bạn có hiểu **tham số (parameter)** đó mang ý nghĩa gì không?
   - Bạn có tự tin **thay đổi giá trị** và giải thích được kết quả không?
3. **Quy tắc 3 bước phản xạ khi BGK ra đề:**
   - **Bước 1 (Lắng nghe & Nhắc lại):** *"Dạ vâng, thầy/cô muốn em đổi thời gian thi đấu từ 180s thành 120s đúng không ạ? Em xin phép mở file cấu hình State ạ."*
   - **Bước 2 (Mở đúng file & Trỏ đúng dòng):** Mở file trong 3-5 giây, trỏ con trỏ chuột vào dòng code.
   - **Bước 3 (Sửa & Giải thích lý do):** Sửa giá trị và nói 1 câu giải thích tác động của nó.

---

## 2. BẢN ĐỒ 8 FILE "HUYỆT ĐẠO" CỦA DỰ ÁN

| STT | Tên File | Vai trò cốt lõi | Dòng cần nhớ |
| :---: | :--- | :--- | :--- |
| **1** | `src/app/api/ai/chat/route.js` | Server Gateway gọi Gemini AI, chống spam, giới hạn prompt | `L24` (params), `L27` (max 8000 char), `L43` (systemInstruction) |
| **2** | `src/lib/geminiCaller.js` | Cơ chế xoay tua đa Model & đa API Key chống sập | `L28-L35` (danh sách Model), `L39` (hàm gọi Gemini) |
| **3** | `src/lib/ragService.js` | Thuật toán RAG, tách từ khóa TF-IDF, Cosine Similarity | `L414` (cache hit), `L518` (retrieveTopK), `L558` (ngưỡng lọc điểm) |
| **4** | `src/store/useAppStore.js` | Bộ nhớ toàn cục Zustand: Lưu user, elo, crystals, arena timer | `L38` (crystals), `L54` (elo), `L74` & `L90` (timeRemaining) |
| **5** | `src/components/organisms/FaceAuthModal.jsx` | Nhận diện khuôn mặt Face ID bằng vector 128 số thực | `L224` (so sánh khoảng cách Euclid 0.45) |
| **6** | `firestore.rules` | Tường lửa phân quyền Firebase, chống hack ELO & sửa đề thi | `L22` (isAdmin), `L38` (chặn tua lùi giờ), `L99` (users) |
| **7** | `src/app/dau-truong/page.js` | Màn hình thi đấu đối kháng trực tuyến PvP | `L300-L350` (kết nối phòng đấu), tính điểm ELO |
| **8** | `next.config.mjs` | Cấu hình bảo mật HTTP Header OWASP, tối ưu hóa Webpack | `L15-L35` (Security Headers, HSTS, CSP) |

---

## 3. TOP 15 TÌNH HUỐNG LIVE-CODING BGK HAY YÊU CẦU SỬA NHẤT

### 🎯 NHÓM 1: CẤU HÌNH TRÍ TUỆ NHÂN TẠO (AI & RAG)

#### 📝 Tình huống 1: Đổi Model AI sang dòng Flash khác hoặc Pro
* **Câu hỏi của BGK:** *"Em hãy đổi model AI từ `gemini-flash-lite-latest` sang `gemini-2.5-flash` để cải thiện độ thông minh của câu trả lời xem nào?"*
* **File cần mở:** `src/lib/geminiCaller.js`
* **Vị trí sửa (Dòng 28 - 35):**
  ```javascript
  export const RESILIENT_MODELS = [
    'gemini-2.5-flash',              // <-- Đưa model bạn muốn lên đầu tiên
    'gemini-flash-lite-latest',
    'gemini-2.5-flash-lite',
    ...
  ];
  ```
* **Giải thích với BGK:** *"Hệ thống của em sử dụng kiến trúc Resilient Fallback. Mảng `RESILIENT_MODELS` ưu tiên model ở vị trí đầu tiên. Nếu Google báo quá tải quota, hệ thống sẽ tự động hạ cấp xuống các model dự phòng tiếp theo để học sinh không bị gián đoạn ạ."*

---

#### 📝 Tình huống 2: Đổi tính cách & Giọng điệu của Trợ lý AI (System Instruction)
* **Câu hỏi của BGK:** *"Thầy thấy AI nói chuyện hơi chung chung. Em hãy đổi cho AI đóng vai 'Thầy giáo STEM vui tính, luôn mở đầu bằng lời khen ngợi học sinh' xem sao?"*
* **File cần mở:** `src/app/api/ai/chat/route.js`
* **Vị trí sửa (Dòng 43):**
  ```javascript
  systemInstruction: (typeof systemInstruction === 'string' ? systemInstruction : (systemInstruction?.parts?.[0]?.text || '')) + 
    "\nQUY TẮC: Bạn là Thầy giáo STEM HUB cực kỳ vui tính, luôn mở đầu câu trả lời bằng một lời khen ngợi hoặc động viên học sinh!",
  ```
* **Giải thích với BGK:** *"Em bổ sung trực tiếp vào `systemInstruction` tại Server Gateway. Nhờ đó mọi yêu cầu từ giao diện gửi lên đều được máy chủ gán tính cách sư phạm này trước khi gửi tới Gemini ạ."*

---

#### 📝 Tình huống 3: Điều chỉnh Độ sáng tạo (`temperature`)
* **Câu hỏi của BGK:** *"Khi giải Toán, thầy cần AI trả lời thật chính xác, không được 'chém gió' bừa bãi. Em hãy chỉnh tham số độ sáng tạo về mức thấp nhất."*
* **File cần mở:** `src/app/api/ai/chat/route.js`
* **Vị trí sửa (Dòng 24):**
  ```javascript
  const { systemInstruction, contents, temperature = 0.1, maxOutputTokens = 1500, responseMimeType } = body;
  // Sửa temperature từ 0.3/0.8 thành 0.1 hoặc 0.0
  ```
* **Giải thích với BGK:** *"Tham số `temperature` dao động từ `0.0` đến `1.0`. Khi giảm xuống `0.1`, mô hình sẽ chọn các từ có xác suất cao nhất (Deterministic), giúp câu trả lời môn Toán, Lý, Hóa đạt độ chính xác khoa học tuyệt đối, triệt tiêu ảo giác ạ."*

---

#### 📝 Tình huống 4: Thay đổi Giới hạn Token đầu ra (`maxOutputTokens`)
* **Câu hỏi của BGK:** *"Học sinh dùng trên điện thoại đọc màn hình nhỏ, em hãy giới hạn độ dài câu trả lời của AI tối đa khoảng 500 từ thôi."*
* **File cần mở:** `src/app/api/ai/chat/route.js`
* **Vị trí sửa (Dòng 24):**
  ```javascript
  const { systemInstruction, contents, temperature = 0.3, maxOutputTokens = 500, responseMimeType } = body;
  // Sửa 1500 thành 500
  ```
* **Giải thích với BGK:** *"Em giới hạn `maxOutputTokens = 500` để AI cô đọng kiến thức thành các gạch đầu dòng ngắn gọn, đồng thời tiết kiệm đáng kể chi phí token và giảm độ trễ phản hồi ạ."*

---

#### 📝 Tình huống 5: Tăng số lượng tài liệu RAG lấy về (`Top-K`)
* **Câu hỏi của BGK:** *"Hệ thống RAG của em đang lấy mấy tài liệu ngữ cảnh? Em hãy tăng lên lấy Top 5 tài liệu liên quan nhất xem nào."*
* **File cần mở:** `src/lib/ragService.js`
* **Vị trí sửa (Dòng 518):**
  ```javascript
  export function retrieveTopK(query, k = 5) { // Sửa k = 3 thành k = 5
  ```
* **Giải thích với BGK:** *"Tham số `k` xác định số lượng tài liệu có điểm Cosine Similarity cao nhất được trích xuất từ kho tri thức để ghép vào Prompt làm giàu ngữ cảnh cho AI ạ."*

---

#### 📝 Tình huống 6: Siết chặt Ngưỡng lọc Điểm số RAG (`Score Threshold`)
* **Câu hỏi của BGK:** *"Lỡ như tài liệu tìm được không liên quan lắm mà AI vẫn lấy thì sao? Em hãy nâng ngưỡng lọc độ tương đồng lên `0.35` để tài liệu phải thật sát mới lấy."*
* **File cần mở:** `src/lib/ragService.js`
* **Vị trí sửa (Dòng 558):**
  ```javascript
  // Dòng 558 cũ: return scored.slice(0, k).filter(doc => doc.score > 0.05);
  // Sửa thành:
  return scored.slice(0, k).filter(doc => doc.score > 0.35);
  ```
* **Giải thích với BGK:** *"Hàm `filter(doc => doc.score > 0.35)` loại bỏ tất cả các bài giảng có độ khớp dưới 35%, đảm bảo AI chỉ tham khảo những tài liệu thực sự liên quan trực tiếp đến câu hỏi ạ."*

---

#### 📝 Tình huống 7: Tăng độ nhạy phát hiện câu hỏi đã học (`Cache Hit`)
* **Câu hỏi của BGK:** *"Hệ thống tự học Cache của em khi nào thì nhận diện là câu hỏi đã có đáp án sẵn? Em hãy chỉnh ngưỡng nhận diện câu hỏi tương đồng."*
* **File cần mở:** `src/lib/ragService.js`
* **Vị trí sửa (Dòng 414):**
  ```javascript
  // Dòng 414 cũ: export function checkRAGCacheHit(query, minScoreThreshold = 0.65)
  // Sửa thành:
  export function checkRAGCacheHit(query, minScoreThreshold = 0.80)
  ```
* **Giải thích với BGK:** *"Khi nâng `minScoreThreshold` lên `0.80`, câu hỏi mới của học sinh phải khớp ít nhất 80% ngữ nghĩa toán học với câu hỏi đã lưu thì hệ thống mới trả về kết quả đệm siêu tốc (0ms), tránh trường hợp trả lời nhầm câu hỏi tương tự ạ."*

---

### 🎯 NHÓM 2: ĐẤU TRƯỜNG & QUẢN LÝ TRẠNG THÁI (ZUSTAND STORE)

#### 📝 Tình huống 8: Đổi thời gian hiệp thi đấu Đấu trường (`timeRemaining`)
* **Câu hỏi của BGK:** *"Thời gian đấu trường 180s hơi dài, em chỉnh xuống 60s cho mỗi trận đấu nhanh (Blitz Match) xem nào."*
* **File cần mở:** `src/store/useAppStore.js`
* **Vị trí sửa (Dòng 74, 86, 90):**
  ```javascript
  // Dòng 74:
  timeRemaining: 60,
  // Dòng 86:
  timeRemaining: 60,
  // Dòng 90:
  startChallengeGame: (subject, timeLimit = 60) => set({
  ```
* **Giải thích với BGK:** *"Em cập nhật thời gian đếm ngược trực tiếp trong Zustand store. Toàn bộ component đồng hồ và vòng đấu trên màn hình sẽ tự động cập nhật đếm ngược từ 60 giây ạ."*

---

#### 📝 Tình huống 9: Tặng Pha lê khởi đầu (`Crystals`) cho tài khoản mới
* **Câu hỏi của BGK:** *"Em muốn tặng cho mỗi bạn học sinh mới đăng ký 1.000 Pha lê để trải nghiệm mua sắm vật phẩm thì sửa ở đâu?"*
* **File cần mở:** `src/store/useAppStore.js`
* **Vị trí sửa (Dòng 38):**
  ```javascript
  crystals: 1000, // Sửa 500 thành 1000
  ```
* **Giải thích với BGK:** *"Biến `crystals` trong state `personalization` lưu trữ số dư tiền tệ của học sinh, dùng để mở khóa khung avatar và danh hiệu trong cửa hàng STEM ạ."*

---

#### 📝 Tình huống 10: Đổi Ngôn ngữ mặc định toàn hệ thống sang Tiếng Anh
* **Câu hỏi của BGK:** *"Nếu trường Quốc tế sử dụng sản phẩm này, em đổi ngôn ngữ mặc định sang tiếng Anh ở đâu?"*
* **File cần mở:** `src/store/useAppStore.js`
* **Vị trí sửa (Dòng 4):**
  ```javascript
  language: 'en', // Sửa 'vi' thành 'en'
  ```

---

### 🎯 NHÓM 3: SINH TRẮC HỌC (FACE ID) & BẢO MẬT (FIRESTORE RULES)

#### 📝 Tình huống 11: Chỉnh độ nhạy nhận diện khuôn mặt Face ID
* **Câu hỏi của BGK:** *"Nếu em muốn hệ thống Face ID bảo mật khắt khe hơn, chống người lạ có nét giống mặt mở khóa, em đổi thông số nào?"*
* **File cần mở:** `src/components/organisms/FaceAuthModal.jsx`
* **Vị trí sửa (Dòng 224):**
  ```javascript
  // Tìm biến khoảng cách (Euclidean distance threshold):
  const distance = faceapi.euclideanDistance(savedDescriptor, currentDescriptor);
  // Sửa ngưỡng từ 0.45 xuống 0.38:
  if (distance < 0.38) { // Càng nhỏ càng nghiêm ngặt
  ```
* **Giải thích với BGK:** *"Khoảng cách Euclid càng nhỏ (ví dụ 0.38) đòi hỏi 128 điểm đặc trưng khuôn mặt phải trùng khớp cực kỳ cao mới mở khóa, giúp chống giả mạo an toàn hơn ạ."*

---

#### 📝 Tình huống 12: Thêm một Email Quản trị viên (Admin) mới vào Whitelist
* **Câu hỏi của BGK:** *"Thầy muốn thêm email `thaygiao@stemhub.edu.vn` làm Admin hệ thống thì thêm vào file phân quyền nào?"*
* **File cần mở:** `firestore.rules`
* **Vị trí sửa (Dòng 26 - 30):**
  ```javascript
  function isAdmin() {
    return isAuthenticated() && (
      (
        request.auth.token.get('email_verified', false) == true &&
        (
          request.auth.token.get('email', '').lower() == 'admin123@gmail.com' ||
          request.auth.token.get('email', '').lower() == 'admin@stemhub.edu.vn' ||
          request.auth.token.get('email', '').lower() == 'thaygiao@stemhub.edu.vn' // <-- THÊM DÒNG NÀY
        )
      ) ||
      ...
  ```
* **Giải thích với BGK:** *"Quy tắc bắt buộc email phải có `email_verified == true` để chống kẻ xấu đăng ký lụi tài khoản trùng email Admin nhằm chiếm đoạt quyền quản trị ạ."*

---

#### 📝 Tình huống 13: Thêm một trường được phép cập nhật vào Profile học sinh
* **Câu hỏi của BGK:** *"Nếu sau này em muốn học sinh được phép cập nhật thêm trường `facebookLink` vào trang cá nhân thì cấu hình ở đâu để không bị Firestore chặn?"*
* **File cần mở:** `firestore.rules`
* **Vị trí sửa (Dòng 61 - 68):**
  ```javascript
  function isAllowedUserUpdate() {
    let allowedKeys = [
      'displayName', 'bio', 'photoURL', 'avatar', 'avatarUrl', 'phoneNumber',
      'school', 'grade', 'class', 'faceDescriptor', 'faceEnrolled',
      'friends', 'incomingRequests', 'outgoingRequests', 'lastActive',
      'status', 'updatedAt', 'isDeleted', 'inventory', 'pendingExtraSlot',
      'facebookLink' // <-- THÊM VÀO ĐÂY
    ];
    return request.resource.data.diff(resource.data).affectedKeys().hasOnly(allowedKeys) && hasNoPrivilegeEscalation();
  }
  ```
* **Giải thích với BGK:** *"Hệ thống sử dụng cơ chế **Whitelist an toàn** kết hợp hàm `hasNoPrivilegeEscalation()` để triệt tiêu lỗ hổng leo thang đặc quyền (Privilege Escalation), học sinh không bao giờ tự ý sửa được `elo`, `role` hay `crystals` ạ."*

---

#### 📝 Tình huống 14: Giới hạn Rate-Limit của API để chống tấn công DoS
* **Câu hỏi của BGK:** *"Học sinh spam liên tục vào nút chat làm tốn quota API Gemini, em chỉnh giới hạn số lượt gọi ở đâu?"*
* **File cần mở:** `src/app/api/ai/chat/route.js`
* **Vị trí sửa (Dòng 14):**
  ```javascript
  // Sửa từ 30 requests/phút thành 15 requests/phút:
  const rateCheck = checkRateLimit(`ai-chat:${ip}`, 15, 60 * 1000);
  ```
* **Giải thích với BGK:** *"Hệ thống áp dụng thuật toán Sliding-window Rate Limiting theo địa chỉ IP của Client. Nếu vượt quá 15 lần/phút, server sẽ trả về mã lỗi HTTP 429 Too Many Requests ngay lập tức mà không chuyển tiếp đến Gemini ạ."*

---

#### 📝 Tình huống 15: Giới hạn độ dài câu hỏi tối đa
* **Câu hỏi của BGK:** *"Lỡ hacker copy cả cuốn tiểu thuyết 100 trang dán vào chatbox làm tràn bộ nhớ server thì sao?"*
* **File cần mở:** `src/app/api/ai/chat/route.js`
* **Vị trí sửa (Dòng 27):**
  ```javascript
  // Dòng 27:
  if (prompt.length > 4000) { // Có thể chỉnh từ 8000 xuống 4000 ký tự
    return NextResponse.json(
      { error: 'Câu hỏi quá dài. Vui lòng rút gọn nội dung.' },
      { status: 400, headers: corsHeaders }
    );
  }
  ```

---

## 4. BỘ 20 CÂU HỎI VẤN ĐÁP PHỎNG VẤN TRỰC TIẾP (KÈM LỜI GIẢI MẪU)

### 🤖 NHÓM 1: CÂU HỎI VỀ TRÍ TUỆ NHÂN TẠO & RAG (5 CÂU)

#### 1. "Em hãy giải thích quy trình RAG trong dự án này từ lúc học sinh gõ chữ đến khi nhận câu trả lời?"
* **Trả lời:**  
  *"Dạ thưa BGK, quy trình gồm 4 bước:*  
  *1. **Tách từ & Vector hóa:** Câu hỏi của học sinh được hàm `tokenize()` chuẩn hóa tiếng Việt và chuyển thành vector trọng số **TF-IDF** (Term Frequency - Inverse Document Frequency).*  
  *2. **Truy xuất (Retrieval):** Hàm `cosineSimilarity()` tính góc cosin giữa vector câu hỏi và hàng trăm tài liệu bài giảng STEM. 3 tài liệu có điểm tương đồng cao nhất sẽ được chọn.*  
  *3. **Làm giàu ngữ cảnh (Augmentation):** Hệ thống chèn 3 tài liệu này vào `systemInstruction` làm ngữ cảnh tham khảo.*  
  *4. **Tạo sinh (Generation):** Gemini 2.5 Flash đọc ngữ cảnh và sinh câu trả lời chính xác theo chuẩn SGK."*

#### 2. "Làm sao hệ thống xử lý khi Google Gemini bị nghẽn mạng hoặc hết hạn mức API (Quota Exceeded)?"
* **Trả lời:**  
  *"Dạ, em đã xây dựng module **Resilient Gemini Caller** tại `src/lib/geminiCaller.js`. Cơ chế này sử dụng:*  
  *1. **Multi-Model Fallback:** Tự động xoay tua qua 5 model (`gemini-flash-lite`, `gemini-2.5-flash`, `gemini-flash-latest`,...).*  
  *2. **Multi-Key Pool:** Hệ thống nạp nhiều API Key từ biến môi trường và xoay tua liên tục theo thuật toán Round-Robin.*  
  *3. **Anti-Retry-Storm:** Nếu Google trả về lỗi `User location not supported`, hệ thống ngắt ngay lập tức để không lãng phí tài nguyên."*

#### 3. "Dữ liệu AI tự học (Learned Knowledge) được lưu ở đâu và kiểm duyệt thế nào?"
* **Trả lời:**  
  *"Dạ, khi một câu hỏi hay được giải đáp, dữ liệu được lưu vào Firestore collection `learned_knowledge` và file bộ nhớ cache. Trước khi lưu, hệ thống chạy qua bộ lọc **Sanitization** chặn đứng:*  
  *- Chặn lưu thông tin cá nhân (SĐT, Email, Tên).*  
  *- Chặn lưu câu chào hỏi xã giao.*  
  *- Chặn mã độc XSS và URL bên ngoài danh sách whitelist ạ."*

#### 4. "Tại sao em chọn mô hình Gemini Flash mà không dùng Gemini Pro hay GPT-4?"
* **Trả lời:**  
  *"Dạ thưa BGK, có 3 lý do:*  
  *1. **Tốc độ phản hồi (Latency):** Gemini Flash có thời gian phản hồi dưới 1 giây, cực kỳ phù hợp cho môi trường học tập tương tác thời gian thực.*  
  *2. **Chi phí $0:** Dòng Flash có hạn mức miễn phí (Free Tier) rất rộng, giúp dự án vận hành bền vững phục vụ học sinh mà không lo chi phí máy chủ.*  
  *3. **Khả năng xử lý đa phương thức (Multimodal):** Flash xử lý ảnh chụp đề bài Toán và công thức hóa học rất xuất sắc ạ."*

#### 5. "Hiện tượng ảo giác AI (Hallucination) là gì và dự án của em giải quyết nó thế nào?"
* **Trả lời:**  
  *"Ảo giác AI là khi mô hình tự bịa ra thông tin sai lệch nhưng với giọng điệu rất tự tin. Em giải quyết bằng 2 tầng:*  
  *1. **RAG Context Grounding:** Ép AI chỉ được dựa trên tài liệu bài giảng đã cung cấp để trả lời.*  
  *2. **Hạ thấp Temperature:** Thiết lập `temperature = 0.3` để giảm tính ngẫu nhiên, buộc AI ưu tiên các sự thật khoa học chính xác."*

---

### 👁️ NHÓM 2: CÂU HỎI VỀ SINH TRẮC HỌC (FACE ID) (4 CÂU)

#### 6. "Thuật toán nhận diện khuôn mặt dùng thư viện gì và chạy ở đâu?"
* **Trả lời:**  
  *"Dạ, hệ thống dùng thư viện `face-api.js` (dựa trên mô hình mạng nơ-ron tích chập SSD MobileNet V1 và ResNet). Điều quan trọng nhất là mô hình này chạy **Client-side 100% trên trình duyệt (Edge AI)** bằng WebGL, không gửi video hay ảnh camera của học sinh về máy chủ."*

#### 7. "Vector đặc trưng khuôn mặt gồm bao nhiêu số và so sánh bằng công thức nào?"
* **Trả lời:**  
  *"Vector gồm **128 số thực** (128-dimensional embedding). Khi đối chiếu, hệ thống sử dụng công thức **Khoảng cách Euclid (Euclidean Distance)**:*  
  $$d = \sqrt{\sum_{i=1}^{128} (A_i - B_i)^2}$$  
  *Nếu khoảng cách $d < 0.45$, hai khuôn mặt được kết luận là cùng một người ạ."*

#### 8. "Nếu học sinh đưa một tấm ảnh chân dung trước camera thì có vượt qua được Face ID không?"
* **Trả lời:**  
  *"Dạ, hệ thống có bước kiểm tra sinh trắc học cử động (Liveness Detection): yêu cầu người dùng phải chớp mắt hoặc xoay nhẹ góc mặt để mô hình phát hiện sự thay đổi các mốc Landmark 68 điểm trên mặt, ngăn chặn giả mạo bằng ảnh tĩnh ạ."*

#### 9. "Tại sao hệ thống không dùng mật khẩu truyền thống mà dùng Face ID + Magic Link OTP?"
* **Trả lời:**  
  *"Dạ, đối với học sinh, mật khẩu rất dễ bị quên hoặc bị bạn bè nhìn lén khi đăng nhập ở phòng máy trường học. Việc dùng Face ID sinh trắc học kết hợp OTP gửi về email vừa mang lại trải nghiệm hiện đại không cần nhớ mật khẩu (Passwordless), vừa đạt độ an toàn bảo mật cấp cao ạ."*

---

### ⚔️ NHÓM 3: CÂU HỎI VỀ ĐẤU TRƯỜNG PVP & REALTIME (4 CÂU)

#### 10. "Hai học sinh ở 2 nơi khác nhau đấu bài với nhau theo cơ chế thời gian thực nào?"
* **Trả lời:**  
  *"Dạ, hệ thống sử dụng **Firestore Realtime Snapshot Listener** (`onSnapshot`). Mỗi khi người chơi chọn đáp án, thanh tiến độ `playerProgress` được cập nhật lên document phòng đấu trên Firestore, và máy của đối thủ nhận được dữ liệu thay đổi tức thì trong vòng dưới 100ms."*

#### 11. "Làm sao em ngăn chặn học sinh dùng tool F12 để chỉnh sửa thời gian trận đấu nhằm gian lận?"
* **Trả lời:**  
  *"Dạ, hệ thống áp dụng cơ chế **Bảo vệ thời gian 2 lớp**:*  
  *1. **Quy tắc Firestore Rules:** Hàm `isValidTimeRemainingUpdate()` chỉ cho phép thời gian mới nhỏ hơn hoặc bằng thời gian cũ (thời gian chỉ được đếm lùi, cấm tua ngược).*  
  *2. **Khóa trần máy chủ (Server Expiration Barrier):** Document trận đấu lưu `matchExpiresAt` bằng `serverTimestamp()`. Nếu thời gian máy khách vượt quá mốc này, server sẽ từ chối mọi thao tác nộp bài."*

#### 12. "Điểm xếp hạng Elo được tính toán như thế nào sau mỗi trận đấu?"
* **Trả lời:**  
  *"Dạ, hệ thống áp dụng công thức xếp hạng quốc tế **FIDE Elo Rating**: tính xác suất thắng kỳ vọng dựa trên chênh lệch Elo giữa 2 người chơi. Nếu người chơi Elo thấp thắng người chơi Elo cao, họ sẽ được cộng nhiều điểm hơn (K-factor = 32), tạo sự công bằng và khuyến khích học sinh thi đua."*

#### 13. "Nếu một người chơi đột ngột mất mạng hoặc tắt trình duyệt khi đang đấu thì sao?"
* **Trả lời:**  
  *"Dạ, hệ thống có cơ chế bắt sự kiện `beforeunload` và trạng thái `lastActive`. Nếu đối thủ không có tương tác sau 30 giây timeout, hệ thống sẽ tự động xử thua do rời trận (Forfeit) và trao chiến thắng cho người chơi còn lại."*

---

### 🛡️ NHÓM 4: BẢO MẬT & KIẾN TRÚC HỆ THỐNG (7 CÂU)

#### 14. "Tại sao em chọn Next.js App Router thay vì làm React SPA thuần?"
* **Trả lời:**  
  *"Dạ, Next.js App Router mang lại 3 ưu thế vượt trội:*  
  *1. **Bảo mật tuyệt đối (Zero Exposure):** Các API Key của Gemini và Firebase Admin được lưu ở Server Components và Route Handlers, không bao giờ bị lộ về phía trình duyệt học sinh.*  
  *2. **Tối ưu SEO & Tốc độ:** Hỗ trợ Server-Side Rendering (SSR) giúp trang tải nhanh và hiển thị bài giảng lập tức.*  
  *3. **Cấu trúc thư mục chuẩn mực:** Phân chia rõ ràng giữa giao diện, logic và API backend."*

#### 15. "Hệ thống bảo vệ dữ liệu cá nhân (PII) của học sinh như thế nào?"
* **Trả lời:**  
  *"Dạ, hệ thống tuân thủ nguyên tắc **Phân tách dữ liệu tối thiểu** (Data Minimization):*  
  *- Bảng `/users/{userId}` chứa SĐT, Face ID chỉ có chính chủ và Admin đọc được.*  
  *- Bảng `/public_profiles/{userId}` chỉ chứa Tên hiển thị, Cấp độ, Elo công khai cho bảng xếp hạng.*  
  *- Các log chat AI trước khi hiển thị cho quản trị viên đều được **Mã hóa che mờ (Data Masking)**: ví dụ `nguyenvana@gmail.com` $\rightarrow$ `n***a@gmail.com`."*

#### 16. "Học sinh có thể tự sửa role thành Admin trong Firestore để gian lận không?"
* **Trả lời:**  
  *"Dạ thưa BGK là **HOÀN TOÀN KHÔNG THỂ**. Trong file `firestore.rules`, quy tắc tạo tài khoản bắt buộc `role` phải là `'student'` hoặc `'user'`. Khi cập nhật thông tin cá nhân, hàm `hasNoPrivilegeEscalation()` cấm tuyệt đối học sinh chỉnh sửa các trường nhạy cảm như `role`, `elo`, `level`, `crystals`."*

#### 17. "Các Header bảo mật web (OWASP Security Headers) trong dự án có tác dụng gì?"
* **Trả lời:**  
  *"Dạ, trong file `next.config.mjs`, em đã thiết lập 5 tầng bảo vệ chuẩn OWASP:*  
  *1. `X-Frame-Options: SAMEORIGIN`: Chống tấn công Clickjacking.*  
  *2. `X-Content-Type-Options: nosniff`: Chống tấn công MIME-sniffing.*  
  *3. `Strict-Transport-Security`: Bắt buộc kết nối HTTPS mã hóa.*  
  *4. `Referrer-Policy`: Bảo vệ đường dẫn riêng tư khi chuyển trang.*  
  *5. `Permissions-Policy`: Vô hiệu hóa Micro/Camera trái phép khi không được cấp quyền."*

#### 18. "Nếu dự án có 10.000 học sinh sử dụng cùng lúc thì hệ thống có bị quá tải không?"
* **Trả lời:**  
  *"Dạ, hệ thống được thiết kế theo kiến trúc **Serverless & Edge Computing**:*  
  *- Frontend và API Routes chạy phân tán toàn cầu qua CDN Edge Network của Vercel/Cloudflare.*  
  *- Cơ sở dữ liệu Firestore tự động mở rộng quy mô (Auto-scaling) theo số lượng truy cập.*  
  *- Mô hình nhận diện Face ID chạy trên máy của từng học sinh nên không tốn CPU của máy chủ.*  
  *Nhờ đó, hệ thống hoàn toàn chịu tải mượt mà cho hàng vạn học sinh đồng thời."*

#### 19. "Dự án đã kiểm thử an ninh như thế nào trước khi đưa ra sử dụng?"
* **Trả lời:**  
  *"Dạ, dự án đã xây dựng bộ kiểm thử tự động gồm **48 bài test an ninh bảo mật** (`scripts/test-rules-suite.js`) và **21 bài test chống gian lận vật lý**. Tất cả các tình huống cố ý sửa đề thi, sửa điểm số, xóa lén dữ liệu đều đã được chạy kiểm tra và đạt kết quả Pass 100% ạ."*

#### 20. "Giá trị lớn nhất mà dự án STEM HUB mang lại cho giáo dục là gì?"
* **Trả lời:**  
  *"Dạ thưa Ban Giám Khảo, giá trị cốt lõi của STEM HUB là **Bình đẳng hóa giáo dục chất lượng cao**:*  
  *- Bất kỳ học sinh nào, dù ở thành phố hay vùng sâu vùng xa, chỉ cần có điện thoại hoặc máy tính kết nối Internet là có ngay một **Gia sư AI 1 kèm 1 kiên nhẫn 24/7**.*  
  *- Được thực hành trong **Phòng thí nghiệm ảo 3D** không lo cháy nổ hay thiếu hóa chất.*  
  *- Được tham gia **Đấu trường thi đấu liên trường** để nuôi dưỡng niềm đam mê khoa học công nghệ."*

---

## 5. KỊCH BẢN "CỨU NGUY" KHI BỊ BÍ HOẶC GẶP LỖI TRƯỚC MẶT BGK

Trong lúc phỏng vấn trực tiếp, nếu tâm lý bạn bị căng thẳng hoặc lỡ tay làm hỏng code, hãy áp dụng ngay các tuyệt chiêu sau:

### 🆘 Tình huống A: BGK bảo sửa 1 biến mà bạn quên mất nó nằm ở file nào
* **Cách xử lý:** 
  1. Đừng ngồi im! Nhấn ngay phím tắt thần thánh: **`Ctrl + Shift + F`** (Tìm kiếm toàn dự án trong VS Code).
  2. Gõ từ khóa mà BGK vừa nhắc (Ví dụ: `temperature`, `retrieveTopK`, `crystals`, `timeRemaining`).
  3. Kết quả hiện ra ngay lập tức, bạn bấm vào file đó và tự tin nói: *"Dạ, em đã định vị được vị trí của biến này rồi ạ!"*

### 🆘 Tình huống B: Lỡ tay gõ nhầm làm báo lỗi đỏ màn hình
* **Cách xử lý:**
  1. Bình tĩnh nhấn **`Ctrl + Z`** (Hoàn tác) để trở về dòng code đúng trước đó.
  2. Nở một nụ cười tự tin và nói: *"Dạ em vừa gõ thừa một dấu chấm phẩy, em xin phép chỉnh lại cú pháp chuẩn ngay đây ạ!"*
  3. BGK sẽ đánh giá rất cao sự điềm tĩnh và kỹ năng xử lý lỗi (Troubleshooting) của bạn!

### 🆘 Tình huống C: BGK hỏi một câu lý thuyết AI quá khó mà bạn chưa từng nghe
* **Cách xử lý:**
  1. **Tuyệt đối KHÔNG:** Trả lời bừa hoặc bịa đặt.
  2. **HÃY NÓI:** *"Dạ thưa thầy/cô, về khía cạnh chuyên sâu này em chưa nghiên cứu thấu đáo, nhưng trong phạm vi giải pháp của dự án, em đã giải quyết bài toán tương tự bằng cách... (liên hệ sang RAG hoặc Fallback của bạn). Em rất cảm ơn gợi ý của thầy/cô và nhóm em sẽ nghiên cứu nâng cấp thuật toán này trong phiên bản tiếp theo ạ!"*
  3. Đây là cách trả lời thông minh của các nhà nghiên cứu: Cầu thị, khiêm tốn nhưng vẫn khéo léo khoe được phần mình đã làm tốt.

---

> 🌟 **LỜI NHẮC CUỐI CÙNG TỪ COACH:**  
> Bạn đã xây dựng một sản phẩm STEM HUB cực kỳ đồ sộ và bài bản. Hãy luôn nhớ rằng: **Bạn là tác giả, bạn là người làm chủ sản phẩm này.** Hãy bước vào buổi phỏng vấn với tâm thế tự hào về những gì mình đã làm được! Chúc bạn đạt kết quả xuất sắc nhất! 🚀
