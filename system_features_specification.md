# Tài liệu Đặc tả Tính năng & Cấu trúc Tệp tin Dự án "Đấu Trường STEM" (STEM Arena)

Tài liệu này mô tả chi tiết toàn bộ các tính năng từ nhỏ nhất, kiến trúc kỹ thuật, cấu trúc dữ liệu Firestore, luồng hoạt động chi tiết của client/server và **sơ đồ cấu trúc file đầy đủ** của dự án **Đấu Trường STEM**. Bạn có thể sử dụng tài liệu này để đưa cho Claude (hoặc các AI khác) phân tích, đánh giá chất lượng hệ thống và định hướng các tính năng phát triển trong tương lai.

---

## 📁 1. Cấu Trúc Thư Mục & Tệp Tin Dự Án (Project Structure)

Dưới đây là sơ đồ cây chi tiết của thư mục `src` và mô tả ý nghĩa hoạt động của từng tệp tin:

```
src/
├── app/                      # Next.js App Router Pages
│   ├── admin/                # Phân hệ Quản trị viên (Admin Panel)
│   │   ├── exams/            # Quản lý đề thi (CRUD)
│   │   ├── leaderboard/      # Quản lý Bảng xếp hạng ELO học sinh
│   │   ├── logs/             # Nhật ký hoạt động Admin (Audit Trail)
│   │   ├── matches/          # Giám sát trận đấu realtime & timeline sự kiện
│   │   ├── questions/        # Quản lý ngân hàng câu hỏi STEM
│   │   ├── settings/         # Cấu hình tham số toàn cục hệ thống
│   │   ├── stories/          # Kiểm duyệt stories cộng đồng
│   │   ├── students/         # Quản lý học sinh (Ban/Unban, tặng crystals, xuất Excel)
│   │   ├── layout.js         # Bố cục chung trang Admin (Sidebar + Header)
│   │   └── page.js           # Dashboard chính hiển thị biểu đồ và thống kê tổng hợp
│   ├── auth/                 # Trang xác thực người dùng (Đăng ký/Đăng nhập)
│   ├── dau-truong/           # Phòng thi đấu đối kháng 1v1 realtime
│   ├── ho-so/                # Hồ sơ cá nhân học sinh (Avatar chibi builder, shop, milestones)
│   ├── lien-he/              # Trang liên hệ trợ giúp
│   ├── phong-thi/            # Phòng tự ôn luyện đề thi đơn lẻ (Toán/Lý/Hóa/Sinh)
│   ├── story/                # Diễn đàn cộng đồng học sinh chia sẻ bài viết STEM
│   ├── xep-hang/             # Bảng xếp hạng ELO chung toàn hệ thống
│   ├── layout.js             # Root layout cấu hình font, cursor, theme providers
│   ├── page.js               # Landing page / Cổng thông tin chính (Portal)
│   └── globals.css           # Định nghĩa Tailwind v4 & custom keyframes, CSS variables
│
├── components/               # React Components tái sử dụng
│   ├── admin/                # Components dành riêng cho trang Admin
│   │   ├── AdminHeader.jsx   # Thanh header admin (Thông tin admin, nút logout)
│   │   └── AdminSidebar.jsx  # Thanh sidebar điều hướng rút gọn khi thu nhỏ màn hình (76px/260px)
│   ├── atoms/                # Các UI component nhỏ nhất
│   │   ├── AvatarFrame.jsx   # Khung avatar hiệu ứng neon chuyển màu
│   │   ├── CustomCursor.jsx  # Hiệu ứng con trỏ chuột neon phát hạt (particle) theo chuột
│   │   └── STEMAvatarSVG.jsx # Bộ sinh avatar Chibi SVG động lắp ráp nhiều lớp (tóc, quần, áo...)
│   ├── layout/               # Cấu trúc bố cục trang client
│   │   ├── DashboardLayout.jsx# Bố cục giao diện dashboard của học sinh
│   │   ├── Header.jsx        # Header điều hướng chính của học sinh
│   │   └── Sidebar.jsx       # Sidebar điều hướng của học sinh
│   ├── organisms/            # Các component lớn phức tạp
│   │   ├── AuthModal.jsx     # Modal popup xử lý logic Auth mượt mà
│   │   └── SettingsDropdown.jsx# Dropdown cài đặt tài khoản, âm thanh, ngôn ngữ
│   └── providers/            # Các providers bọc ứng dụng
│       └── ThemeProvider.jsx # Quản lý trạng thái giao diện sáng/tối (Dark/Light mode)
│
├── data/                     # Dữ liệu tĩnh mẫu
│   ├── exams.js              # Database chứa hàng trăm câu hỏi/đề thi chuẩn THPT
│   └── exams_seed.js         # File chứa dữ liệu hạt giống (seed data) để import vào Firestore
│
├── lib/                      # Các thư viện & Helper logic cốt lõi
│   ├── adminLogger.js        # Ghi nhận nhật ký thao tác admin (`logAdminAction`) lên Firestore
│   ├── arenaGenerator.js     # Thuật toán tự động sinh đề bài đấu trường từ kho câu hỏi
│   ├── firebase.js           # Khởi tạo Firebase SDK (Auth, Firestore, Storage)
│   ├── firestoreRetry.js     # Cơ chế tự động thử lại khi Firestore ghi nhận thất bại do mạng
│   ├── matchmaker.js         # Hệ thống ghép trận 1v1 realtime và xếp bậc rank theo điểm ELO
│   └── sound.js              # Trình quản lý nhạc nền, SFX (click, correct, incorrect, alert...)
│
└── store/                    # Quản lý State toàn cục bằng Zustand
    └── useAppStore.js        # Lưu trữ trạng thái Auth, sound, personalization, matchmaking queue
```

---

## 🎮 2. Đấu Trường Realtime 1v1 (Arena 1v1 Module)

Đây là tính năng cốt lõi của website, cho phép hai người chơi ghép cặp và thi đấu làm bài trực tuyến thời gian thực.

### a. Cơ chế Ghép cặp Tự động (Matchmaking)
- **Vị trí code**: `src/lib/matchmaker.js`
- **Cách hoạt động**:
  1. Khi học sinh click "Tìm trận" cho một môn học cụ thể (Toán/Lý/Hóa/Sinh), client gọi hàm `joinMatchmakingQueue`.
  2. Hệ thống tìm kiếm trong Firestore collection `match_rooms` các phòng có `status == "waiting"` và có cùng môn học (`subject`).
  3. **Giao dịch an toàn (Firestore Transaction)**: Để tránh lỗi Race Condition (nhiều người cùng join 1 phòng), hệ thống sử dụng Transaction để chiếm phòng. Nếu phòng vẫn trống `player2` và trạng thái vẫn là `waiting`, thông tin người chơi sẽ được cập nhật vào `player2`, và phòng chuyển trạng thái thành `playing`.
  4. **Tự tạo phòng chờ**: Nếu không tìm thấy phòng trống khả dụng, một phòng chờ mới được tạo với ID `room_[uid]_[timestamp]`, và người chơi đó đóng vai trò là `player1`.
  5. **Cơ chế Tự chữa lành / Hợp nhất phòng (Room Merge)**: Đề phòng trường hợp 2 người chơi click tìm trận cùng một tích tắc dẫn đến việc tạo 2 phòng chờ song song. Client liên tục kiểm tra xem có phòng chờ nào khác của môn học này không. Nếu có phòng chờ khác có ID nhỏ hơn phòng hiện tại của mình:
     - Hệ thống tự động xóa phòng của mình (`deleteDoc`).
     - Thực hiện Transaction gia nhập phòng của đối thủ làm `player2`.
     - Chuyển hướng client sang phòng mới này.

### b. Vận hành Trận đấu Realtime (Realtime Game Loop)
- **Đồng bộ dữ liệu**: Sử dụng Firebase `onSnapshot` để lắng nghe liên tục sự thay đổi của phòng đấu trong `match_rooms/{roomId}`. Cả hai người chơi và quản trị viên đều thấy cùng một dữ liệu realtime.
- **Tiến độ làm bài (Progress Bar)**: Khi người chơi trả lời đúng một câu hỏi, `player1Progress` hoặc `player2Progress` tăng lên (ví dụ: +20% mỗi câu đúng trong đề 5 câu). Tiến độ này hiển thị dưới dạng thanh trượt neon chạy đua thời gian thực đối kháng.
- **Realtime Activity Logs**: Mỗi hành động của người chơi (Click đáp án đúng/sai, dùng thẻ bổ trợ, chuyển tab vi phạm) đều được ghi nhận và đẩy lên subcollection `match_rooms/{roomId}/actionLogs` để render lên danh sách hoạt động trực quan.
- **Hệ thống Đếm ngược**: Trận đấu giới hạn trong 60 giây. Một interval chạy trên client liên tục cập nhật `timeRemaining` trên Firestore bởi Host (Player 1). Khi hết giờ, hệ thống so sánh tiến độ để tìm ra người thắng (`winnerId`).

### c. Hệ thống Chống Gian lận (Anti-Cheat Engine)
- **Cơ chế phát hiện**: Trang thi đấu `/dau-truong` lắng nghe các sự kiện trình duyệt:
  - Sự kiện `visibilitychange` (Khi học sinh ẩn trình duyệt hoặc chuyển sang tab khác).
  - Sự kiện `window.blur` (Khi học sinh nhấp chuột ra ngoài cửa sổ trình duyệt, ví dụ để mở ứng dụng chat, tài liệu).
- **Xử lý vi phạm**: 
  - Mỗi khi phát hiện rời màn hình, số lần vi phạm (`tabSwitchCount`) của người chơi tương ứng tăng thêm 1.
  - Số lần chuyển tab được lưu trữ trực tiếp trên Firestore phòng đấu.
  - Khi số lần chuyển tab vượt quá 3 lần (`tabSwitchCount > 3`), phòng đấu tự động bị gắn cờ gian lận (`flagged = true`).
  - Ghi nhận chi tiết thời điểm vi phạm vào `actionLogs` của phòng đấu (Ví dụ: "Học sinh Nguyễn Văn A chuyển tab vi phạm lần 1").

### d. Tính điểm ELO và Lưu lịch sử
- **Cập nhật ELO**: Khi trận đấu kết thúc, hệ thống tính toán điểm ELO mới dựa trên công thức ELO chuẩn:
  - Thắng: ELO cộng thêm (ELO đối thủ càng cao, ELO cộng càng nhiều, dao động +15 đến +32).
  - Thua: ELO trừ đi.
- **Phân bậc Rank theo ELO**:
  - `< 200`: Trợ Lý Tập Sự (🌱)
  - `200 - 499`: Kỹ Thuật Viên (🧪)
  - `500 - 899`: Nhà Nghiên Cứu (🔬)
  - `900 - 1399`: Tiến Sĩ STEM (🎓)
  - `1400 - 1999`: Giáo Sư Phát Minh (⚡)
  - `2000 - 2599`: Viện Sĩ Lượng Tử (🌀)
  - `>= 2600`: Huyền Thoại Trí Tuệ (🔮)

---

## 📝 3. Phòng Thi Luyện Tập (Practice Rooms)

Phòng thi đơn tuyến (`/phong-thi`) giúp học sinh tự luyện tập kiến thức.

### a. Lựa chọn môn học & Cấp độ
- Các môn học: Toán học, Vật lý, Hóa học, Sinh học.
- Cấp độ: **Cơ bản** (phù hợp học sinh trung bình) và **Nâng cao** (dành cho học sinh giỏi/ôn thi).
- Đề thi được truy vấn từ `EXAM_DATABASE` hoặc Firestore `exams` collection.

### b. Bộ Parser Công Thức LaTeX Tùy Biến (Custom Parser)
- **Vị trí code**: `src/app/dau-truong/page.js` (Hàm `formatMathText`)
- **Cách hoạt động**:
  - Không sử dụng KaTeX hay MathJax (giúp trang load cực nhanh, không chặn render).
  - Sử dụng Regex để chuyển đổi trực tiếp các biểu thức toán học LaTeX sang HTML/Unicode tương thích cao:
    - `\frac{A}{B}` & `\dfrac{A}{B}`: chuyển thành thẻ `<span>` có flexbox xếp dọc tạo cấu hình phân số chồng tuyệt đẹp.
    - `\begin{cases} ... \end{cases}`: Dịch thành ký tự ngoặc nhọn `{` lớn bằng nét kéo giãn `scaleY` bao bọc các dòng phương trình xếp cột.
    - `\begin{aligned} ... \end{aligned}`: Dịch thành khối canh lề trái.
    - Các ký hiệu Hy Lạp (`\pi, \alpha, \lambda, \Delta, \Omega...`), ký hiệu so sánh (`\le, \ge, \neq, \approx`), tích phân `\int`, vô cực `\infty` được thay thế bằng ký tự Unicode tương ứng.
    - `_{1, 2}` hoặc `^2`: Dịch sang Unicode subscript (`₁`, `₂`) và superscript (`²`) để hiển thị công thức hóa học (như `H₂SO₄`) và số mũ toán học một cách hoàn hảo.
  - Tự động lọc các thẻ hình ảnh `<img>` để tiêm thuộc tính `referrerpolicy="no-referrer"` và mã hóa URL đảm bảo ảnh từ Firebase Storage luôn hiển thị bình thường.

---

## 👤 4. Cá Nhân Hóa Hồ Sơ & Cửa Hàng (Personalization & Shop)

Tính năng tăng tương tác cho học sinh thông qua cơ chế Gamification.

### a. Tùy biến nhân vật Chibi (Avatar Builder)
- Học sinh tự tạo hình ảnh đại diện Chibi theo sở thích qua các thuộc tính:
  - `gender`: Giới tính (male/female).
  - `bodyType`: Loại cơ thể (chibi, standard...).
  - `pose`: Tư thế đứng.
  - `body`: Màu da (peach, tan, pale...).
  - `hair`: Kiểu tóc và màu sắc.
  - `top`: Trang phục áo.
  - `bottom`: Trang phục quần/váy.
  - `accessory`: Phụ kiện đeo thêm (kính, tai nghe, sách...).
- Các thuộc tính này được render realtime bằng cấu trúc SVG lớp (`STEMAvatarSVG`) ghép đè lên nhau.

### b. Cửa hàng Danh hiệu & Khung đại diện (Shop)
- Tiền tệ: **Pha lê (Crystals)** tích lũy được sau các trận thắng hoặc luyện tập.
- **Khung Avatar (Avatar Frames)**: Mua các khung hiệu ứng neon khác nhau (Default, Bronze, Silver, Golden, Cyberpunk, Quantum) để bao bọc quanh hình đại diện.
- **Danh hiệu (Active Title)**: Mua các danh hiệu hiển thị dưới tên học sinh (Tập sự STEM, Trợ tá Nghiên cứu, Học giả STEM, Chuyên gia Lab, Viện sĩ STEM, Trưởng ban Học thuật).
- Thông tin cá nhân hóa lưu tại Firestore document `users/{uid}`.

### c. Mốc thành tích (Milestones)
- Hệ thống theo dõi số trận thắng, số crystals và cấp độ ELO của học sinh.
- Khi đạt các mốc (Ví dụ: Thắng 10 trận, đạt 1000 ELO), học sinh có thể click "Claim" để nhận thưởng Pha lê tương ứng.

---

## 💬 5. Nhật Ký STEM & Cộng Đồng (Community Stories)

Nơi học sinh chia sẻ các câu chuyện học tập, kiến thức STEM lý thú.

### a. Viết Story & Đăng tải
- Học sinh tạo bài viết mới với Tiêu đề, Nội dung (hỗ trợ định dạng văn bản), và tag chủ đề (Toán, Lý, Hóa, Sinh, Robot, AI...).
- Đăng tải lên collection `stories` với trạng thái mặc định `status: "pending"` chờ Admin kiểm duyệt.

### b. Tương tác Cộng đồng
- **Thả tim (Likes)**: Tăng/giảm số lượt thích, lưu danh sách `likedBy` (mảng ID người dùng) để tránh thả tim trùng lặp.
- **Bình luận (Comments)**: Subcollection `comments` cho phép thảo luận kiến thức dưới mỗi câu chuyện.

---

## 🛡️ 6. Bảng Quản Trị Hệ Thống (Admin Panel Dashboard)

Hệ thống quản lý chuyên sâu dành riêng cho quản trị viên kiểm soát toàn bộ nền tảng.

### a. Trang chủ Dashboard Quản trị (`/admin`)
- Hiển thị các thẻ chỉ số tổng quan (Tổng số học sinh, Tổng số câu hỏi, Trận đấu đang diễn ra, Câu chuyện chờ duyệt).
- Biểu đồ phân bố học sinh theo ELO/Rank và thống kê hoạt động.

### b. Quản lý Ngân hàng Câu hỏi (`/admin/questions`)
- CRUD câu hỏi (Thêm mới, sửa, xóa, tìm kiếm, lọc theo môn học).
- Hỗ trợ công thức LaTeX, tạo phương án nhiễu, giải thích đáp án.
- Chức năng import câu hỏi hàng loạt và export câu hỏi.

### c. Quản lý Đề thi (`/admin/exams`)
- Quản lý các đề thi luyện tập của hệ thống.
- Tạo đề thi mới, phân loại theo lớp/môn học, cài đặt thời gian làm bài, điểm tối đa.
- Quản lý danh sách câu hỏi thuộc đề thi đó.

### d. Quản lý Học sinh (`/admin/students`)
- Tìm kiếm, lọc học sinh theo ELO, cấp độ, trạng thái tài khoản.
- Xem chi tiết hồ sơ, lịch sử đấu.
- **Điều chỉnh Pha lê (Crystals)**: Admin có thể tặng thêm hoặc trừ bớt pha lê trực tiếp của học sinh (Hành động này bắt buộc phải ghi Audit Log).
- **Cấm/Bỏ cấm (Ban/Unban)**: Thay đổi thuộc tính `status` của học sinh sang `banned` để khóa quyền truy cập.
- **Xuất Excel**: Client-side xuất danh sách học sinh ra file `.xlsx` chứa toàn bộ thống kê chi tiết.

### e. Giám sát Trận đấu Realtime (`/admin/matches`)
- Liệt kê toàn bộ các phòng đấu đang hoạt động (`playing`), phòng chờ (`waiting`) hoặc đã kết thúc (`result`).
- Hiển thị nổi bật cờ cảnh báo **`FLAGGED`** màu đỏ nếu trận đấu đó bị hệ thống chống gian lận phát hiện chuyển tab > 3 lần.
- **Dòng thời gian sự kiện (Unified Timeline Modal)**: Admin click xem chi tiết nhật ký sự kiện của trận đấu dưới dạng dòng thời gian tuyến tính trực quan, lấy trực tiếp từ `actionLogs` của phòng đấu.
- **Hủy trận đấu (Reset/Cancel)**: Cho phép admin hủy phòng đấu gặp sự cố hoặc gian lận nghiêm trọng.

### f. Kiểm duyệt Stories (`/admin/stories`)
- Hiển thị danh sách các bài viết STEM của học sinh đang ở trạng thái `pending`.
- Admin có thể đọc nội dung chi tiết và chọn **Duyệt (Approve)** (chuyển sang `active` hiển thị lên cộng đồng) hoặc **Từ chối (Reject/Delete)**.

### g. Nhật ký hoạt động Admin (Audit Trail)
- **Collection Firestore**: `admin_logs`
- **Cách hoạt động**:
  - Ghi nhận tất cả các hành động chỉnh sửa dữ liệu hệ thống của Admin (Ví dụ: BAN_USER, GRANT_CURRENCY, UPDATE_SETTINGS, DELETE_QUESTION...).
  - Lưu trữ ID admin, email admin, loại hành động, ID đối tượng bị tác động, tên đối tượng, chi tiết sự kiện thay đổi và dấu thời gian.
  - Dashboard `/admin/logs` hiển thị realtime danh sách log, có bộ lọc từ khóa, lọc loại hành động và lọc khoảng thời gian.
  - Tự động tô màu Badges phân loại mức độ rủi ro (Hủy/Xóa -> Đỏ, Thay đổi/Cập nhật -> Cam, Thêm mới/Xuất file -> Xanh).

### h. Cấu hình hệ thống (`/admin/settings`)
- Thay đổi các tham số toàn cục của hệ thống (Bảo trì hệ thống ON/OFF, điều chỉnh hệ số cộng/trừ ELO, số Crystals thưởng khi thắng, tên mùa giải hiện tại).

---

## 🔒 7. Quy Tắc Bảo Mật Firestore (Security Rules)

- **Vị trí**: `firestore.rules`
- **Các quy tắc cốt lõi**:
  - Chỉ người dùng đã đăng nhập (`isAuthenticated()`) mới có quyền đọc thông tin học sinh khác, tham gia hàng chờ matchmaking và đọc/ghi logs phòng đấu (`actionLogs`).
  - Học sinh chỉ có quyền đọc/ghi dữ liệu của chính mình (`request.auth.uid == userId`).
  - Chỉ tài khoản có trường `role == "admin"` trong Firestore mới có quyền truy cập, đọc/ghi vào collection cấu hình hệ thống (`settings`), kiểm duyệt bài viết, quản lý đề thi/câu hỏi và xem/ghi nhận nhật ký Admin (`admin_logs`).
