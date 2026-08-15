# BỘ PROMPT SỬA LỖI VÀ HOÀN THIỆN HỆ THỐNG KẾT BẠN (FRIEND SYSTEM)

**Role:** Bạn là một Senior Full-Stack Developer chuyên gia về Firebase (Cloud Functions, Firestore) và Next.js. Bạn có kinh nghiệm xử lý các thao tác cross-user data (dữ liệu chéo người dùng) một cách bảo mật.

**Context:** Trong dự án "Đấu Trường STEM", tính năng "Mạng lưới bạn bè" đang gặp lỗi. Khi người dùng bấm nút "Kết bạn", giao diện trả về lỗi `Lỗi khi gửi lời mời: internal`. Nguyên nhân chính là do thao tác ghi dữ liệu chéo (User A ghi vào `incomingRequests` của User B) bị Firestore Security Rules chặn lại ở Client, hoặc Cloud Function xử lý kết bạn đang bị crash do thiếu validation.

**Task:** Hãy viết lại luồng logic cho tính năng Kết bạn (Friend System) bao gồm cả Client và Server (Cloud Functions) để giải quyết dứt điểm lỗi `internal` này.

---

### GIAI ĐOẠN 1: XÂY DỰNG API KẾT BẠN TRÊN SERVER (`functions/index.js`)

Tính năng kết bạn bắt buộc phải dùng quyền Admin trên Cloud Functions để cập nhật song song 2 Document của 2 người dùng khác nhau. Hãy tạo (hoặc sửa) 3 Callable Functions sau:

1. **`sendFriendRequest`:**
   - **Đầu vào:** `targetUserId` (ID của người muốn kết bạn).
   - **Validation:** Bắt buộc phải có `context.auth.uid`. Không được tự gửi cho chính mình. Kiểm tra xem 2 người đã là bạn bè chưa, hoặc đã gửi request trước đó chưa.
   - **Xử lý (Dùng Firestore Batch/Transaction):** 
     - Thêm `targetUserId` vào mảng `outgoingRequests` của người gửi.
     - Thêm `context.auth.uid` vào mảng `incomingRequests` của người nhận.
   - **Trả về:** `{ success: true, message: 'Đã gửi yêu cầu' }`

2. **`acceptFriendRequest`:**
   - **Đầu vào:** `requesterId` (ID của người đã gửi lời mời).
   - **Xử lý (Dùng Batch):**
     - Xóa `requesterId` khỏi `incomingRequests` và thêm vào `friends` của người nhận.
     - Xóa `context.auth.uid` khỏi `outgoingRequests` và thêm vào `friends` của người gửi.

3. **`rejectFriendRequest`:**
   - **Xử lý:** Chỉ đơn giản là xóa ID khỏi `incomingRequests` của người nhận và `outgoingRequests` của người gửi.

*Lưu ý cho AI:* Sử dụng `admin.firestore.FieldValue.arrayUnion()` và `arrayRemove()` để xử lý mảng an toàn. Đặt trong khối `try...catch` và throw ra `functions.https.HttpsError` cụ thể (ví dụ: `already-exists`, `invalid-argument`) thay vì để crash sinh ra lỗi `internal`.

---

### GIAI ĐOẠN 2: KẾT NỐI API TRÊN CLIENT (`src/app/ho-so/page.js` hoặc file Component Bạn bè)

1. **Xử lý Nút "Kết bạn":**
   - Viết hàm `handleSendRequest(targetId)` sử dụng `httpsCallable`.
   - Bắt lỗi (catch) một cách rõ ràng. Thay vì hiển thị mã lỗi `internal` khô khan, hãy map nó thành các câu thông báo thân thiện với người dùng (Ví dụ: "Bạn đã gửi yêu cầu cho người này rồi", "Người dùng không tồn tại").
   - Thêm trạng thái `loading` (spinner) hoặc `disabled` vào nút bấm để người dùng không click liên tục gây spam request.

2. **Xử lý Nút "Đồng ý" / "Từ chối" ở danh sách Yêu cầu đến:**
   - Gọi tương ứng `acceptFriendRequest` hoặc `rejectFriendRequest`.
   - Sau khi gọi API thành công, sử dụng State (Zustand hoặc React State) để update lại giao diện (xóa user đó khỏi danh sách yêu cầu và đưa vào danh sách bạn bè) ngay lập tức mà không cần phải f5 tải lại trang.

**Yêu cầu Output:** 
- Phân chia rõ ràng code của `functions/index.js` và code của Client Component.
- Code đảm bảo tính nguyên vẹn dữ liệu (Data Integrity). Không để xảy ra tình trạng User A thấy User B là bạn, nhưng User B lại không thấy User A (phải cập nhật thành công cả 2 bên).
