# BỘ PROMPT XỬ LÝ LỖI THANH TOÁN CỬA HÀNG & GACHA (MISSING PERMISSIONS)

**Role:** Bạn là một Senior Full-Stack Developer chuyên gia về Firebase (Cloud Functions, Firestore) và Next.js. Bạn có kinh nghiệm xử lý các giao dịch (Transactions) và hệ thống tiền tệ trong game/ứng dụng an toàn.

**Context:** Trong dự án "Đấu Trường STEM", tính năng Mua đồ trực tiếp và Quay Gacha ở trang Hồ sơ đang bị lỗi văng popup `Missing or insufficient permissions`. Nguyên nhân là do Firestore Rules đang chặn Client tự ý thay đổi trường `crystals` (để chống học sinh dùng tool hack tiền). Việc Client đang gọi `updateDoc` trực tiếp để trừ Pha lê là vi phạm quy tắc bảo mật này.

**Task:** Hãy chuyển toàn bộ logic thanh toán (Mua đồ & Gacha) từ Client-side sang Server-side bằng Firebase Cloud Functions để vượt qua rào cản Security Rules một cách an toàn và hợp lệ.

---

### GIAI ĐOẠN 1: XÂY DỰNG API THANH TOÁN TRÊN SERVER (`functions/index.js`)

Tạo 2 Callable Functions xử lý giao dịch. Bắt buộc sử dụng `db.runTransaction` để đảm bảo dữ liệu không bị sai lệch nếu người dùng spam click nhiều lần cùng lúc.

**1. Hàm `purchaseItem` (Mua đồ trực tiếp):**
   - **Đầu vào:** `itemId` (ID món đồ), `itemCost` (Giá tiền).
   - **Validation:** Bắt buộc có `context.auth.uid`. Nếu thiếu throw lỗi `unauthenticated`.
   - **Xử lý Transaction:**
     - Đọc Document của User hiện tại (`users/{uid}`).
     - Kiểm tra: Số dư `crystals >= itemCost`? Nếu không đủ, throw lỗi `failed-precondition`.
     - Kiểm tra: Mảng `unlockedItems` đã chứa `itemId` chưa? Nếu có rồi, throw lỗi `already-exists`.
     - Thực hiện trừ tiền: `newCrystals = currentCrystals - itemCost`.
     - Cập nhật Document: Lưu `newCrystals` và thêm `itemId` vào `unlockedItems`.
   - **Trả về:** `{ success: true, newBalance, message: 'Mua thành công' }`

**2. Hàm `rollGacha` (Quay Gacha lượng tử):**
   - **Đầu vào:** `rollCount` (1 hoặc 10), `costPerRoll` (Ví dụ: 100).
   - **Validation:** Bắt buộc có `context.auth.uid`.
   - **Xử lý Transaction:**
     - Đọc Document User, kiểm tra số dư: `crystals >= rollCount * costPerRoll`.
     - Server chạy thuật toán Random (dựa trên tỷ lệ cấu hình) để sinh ra mảng `items` trúng thưởng.
     - Duyệt qua các item trúng thưởng:
       - Nếu item CHƯA CÓ trong `unlockedItems` -> Đưa vào danh sách mở khóa mới.
       - Nếu item ĐÃ CÓ (Trùng đồ) -> Chuyển hóa thành Pha lê hoàn trả (Ví dụ: +150 Pha lê/món trùng).
     - Cập nhật số dư cuối: `newCrystals = currentCrystals - (rollCount * costPerRoll) + totalRefundCrystals`.
     - Ghi dữ liệu vào Firestore (Cập nhật mảng item và số dư).
   - **Trả về:** `{ success: true, results: [...], totalRefund, newBalance }`.

---

### GIAI ĐOẠN 2: CẬP NHẬT GIAO DIỆN CLIENT (`src/app/ho-so/page.js` / Component Cửa Hàng)

1. **Thay thế logic Client cũ:**
   - Xóa bỏ các đoạn mã dùng `setDoc` hoặc `updateDoc` can thiệp trực tiếp vào số dư Tinh thể/Pha lê từ phía giao diện.
   - Thay thế bằng việc gọi API: `httpsCallable(functions, 'purchaseItem')` và `httpsCallable(functions, 'rollGacha')`.

2. **Xử lý UI/UX chống Spam:**
   - Khi người dùng click "Mua ngay" hoặc "Quay X10", lập tức set State `isProcessing = true` để làm mờ (disable) các nút bấm, ngăn chặn việc click liên tục.
   - Bọc block gọi API trong `try...catch`. Bắt lỗi và hiển thị thông báo (Toast/Alert) tương ứng: "Không đủ Pha lê", "Đã sở hữu vật phẩm này".
   - Khi nhận kết quả thành công, cập nhật ngay State nội bộ (Ví dụ: Store của Zustand) để số dư Pha lê trên Header tự động trừ đi và item mới mất biểu tượng "Ổ khóa" mà không cần người dùng tải lại trang (F5).

**Yêu cầu Output:** 
- Phân tách rõ ràng file Server-side và Client-side.
- Viết code sạch, tối ưu hiệu năng và bắt buộc dùng Transaction của Firestore Admin SDK cho các hàm xử lý tiền tệ.
